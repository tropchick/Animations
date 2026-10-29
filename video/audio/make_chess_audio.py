"""Scene, soundtrack and timing cues for one «Шахматный разбор» video (TikTok, Russian).
Usage: python3 audio/make_chess_audio.py slobody     (or kniga, ...)

The picture and the dialogue are the user's own clip of a meme scene. The clips are not in git: they sit in the
data's "srcDir" (project files), or in $CHESS_SRC. Everything about one video is in src/<id>/data.json:
  sources  {part: file}, crop {part: "w:h:x:y"} (optional, applied before everything else),
  audioSources {part: path relative to video/} (optional, separate full-length source audio),
  edl      [part, from, to] pieces of the scene in order (the long silent pauses are left out),
  hold     seconds the last frame is held at the end (optional, for the results screen),
  avatars  {name: [part, second, x, y, size]} squares in the cropped frame, cover [part, second],
  thumb    [part, second] (optional) the frame for the YouTube-card ending (show.ts yt),
  moves / subs / resultsAt  point at source times (subtitle words come from the whisper file in "words").
This script
  1. writes the cut scene public/<id>/scene.mp4 (30 fps), the avatars and the cover frame into public/<id>/,
  2. mixes the scene audio with synthesized chess sounds into public/audio/<id>.wav,
  3. writes src/<id>/cues.json: every move, subtitle and the results screen on the video timeline.

Frame 0 of the video is the cover, so the scene starts at 1/30 s (OFF).

Sync map (on-screen event <-> sound onset, both at the move's time):
  move card appears          <-> wooden piece click
  brilliant / great badge    <-> bright ting on top of the click
  blunder / mistake badge    <-> low thump
  mate                       <-> deep boom + low bell
  draw                       <-> soft boom + two bells (a fifth)
  results sections appear    <-> soft clicks
  YouTube card ending        <-> whoosh in, boom + ting when the time slams on (+0.55 s), soft whoosh for the arrow (+0.95 s)
"""

import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

import numpy as np

from slime_lib import ROOT, SR, Mix, click, filt, thump, ting, tt_, white

OFF = 1 / 30
ID = sys.argv[1]
data = json.loads((ROOT / f"src/{ID}/data.json").read_text())
SRC = Path(os.environ.get("CHESS_SRC", data["srcDir"]))
FILES = {p: SRC / f for p, f in data["sources"].items()}
PARTS = list(FILES)
CROP = data.get("crop", {})
HOLD = data.get("hold", 0.0)
PUB = ROOT / "public" / ID
words = json.loads((ROOT / data["words"]).read_text())
EDL = data["edl"]

# segment k starts at seg_out[k] on the video timeline
seg_out, t = [], OFF
for _, s, e in EDL:
    seg_out.append(t)
    t += e - s
DUR = t + HOLD


def out(part, sec):
    """Source time -> video time. A time just past a cut (a card that lands on the last word) clamps to the cut."""
    for (p, s, e), o in zip(EDL, seg_out):
        if p == part and s - 0.05 <= sec <= e + 0.4:
            return round(o + min(max(sec, s), e) - s, 3)
    raise ValueError(f"{part} {sec} falls into a cut")


def ff(*args):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True)


def vf(part, extra=""):
    """The part's own crop first, then whatever else."""
    chain = [f"crop={CROP[part]}"] if part in CROP else []
    return ",".join(chain + ([extra] if extra else [])) or "null"


# 1. the cut scene (re-encoded with a keyframe every second so every frame seeks exactly)
PUB.mkdir(parents=True, exist_ok=True)
scene = PUB / "scene.mp4"
stamp = PUB / "scene.edl"
key = hashlib.sha1(json.dumps([EDL, CROP, HOLD]).encode()).hexdigest()
if not scene.exists() or not stamp.exists() or stamp.read_text() != key:
    chains = [f"[{PARTS.index(p)}:v]{vf(p)},trim={s}:{e},setpts=PTS-STARTPTS,fps=30[v{k}]" for k, (p, s, e) in enumerate(EDL)]
    hold = f",tpad=stop_mode=clone:stop_duration={HOLD}" if HOLD else ""
    graph = ";".join(chains) + ";" + "".join(f"[v{k}]" for k in range(len(EDL))) + f"concat=n={len(EDL)}:v=1:a=0{hold}[v]"
    inputs = [x for p in PARTS for x in ("-i", str(FILES[p]))]
    ff(*inputs, "-filter_complex", graph, "-map", "[v]",
       "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-g", "30", "-pix_fmt", "yuv420p", str(scene))
    stamp.write_text(key)

# 2. avatars (squares in the cropped frame) and the cover frame
for name, (p, sec, x, y, size) in data["avatars"].items():
    ff("-ss", str(sec), "-i", str(FILES[p]), "-frames:v", "1", "-vf", vf(p, f"crop={size}:{size}:{x}:{y},scale=256:256"),
       "-q:v", "3", str(PUB / f"av-{name}.jpg"))
cp, csec = data["cover"]
ff("-ss", str(csec), "-i", str(FILES[cp]), "-frames:v", "1", "-vf", vf(cp), "-q:v", "2", str(PUB / "cover.jpg"))
if "thumb" in data:
    tp, tsec = data["thumb"]
    ff("-ss", str(tsec), "-i", str(FILES[tp]), "-frames:v", "1", "-vf", vf(tp), "-q:v", "2", str(PUB / "thumb.jpg"))


# 3. soundtrack
def load_part(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "s16le", "-ac", "2", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float64).reshape(-1, 2) / 32768


audio_sources = data.get("audioSources", {})
AUD = {p: load_part(ROOT / audio_sources[p] if p in audio_sources else f) for p, f in FILES.items()}
mix = Mix(DUR + 0.5)
fade = int(0.015 * SR)
for (p, s, e), o in zip(EDL, seg_out):
    x = AUD[p][int(s * SR): int(e * SR)].copy()
    ramp = np.linspace(0, 1, fade)[:, None]
    x[:fade] *= ramp
    x[-fade:] *= ramp[::-1]
    i = mix.idx(o)
    n = min(len(x), mix.n - i)
    mix.l[i: i + n] += x[:n, 0]
    mix.r[i: i + n] += x[:n, 1]


def piece():
    """A wooden chess piece put down on the board."""
    s = thump(240, 150, 0.18, decay=38, click=0) * 0.5
    c = click(0.06, 1700)
    s[: len(c)] += c * 0.8
    return s


def whoosh(dur=0.5):
    tt = tt_(dur)
    sweep = filt(white(len(tt)), "bandpass", [400, 4000])
    return sweep * np.sin(np.pi * tt / dur) ** 2


moves = []
for m in data["moves"]:
    mt = out(*m["at"])
    moves.append({**{k: v for k, v in m.items() if k != "at"}, "t": mt})
    g = m["grade"]
    if g == "start":
        mix.add(piece(), mt, 0.35)
        continue
    mix.add(piece(), mt, 0.4)
    if g == "brilliant":
        mix.add(ting(2600, 1.3), mt + 0.03, 0.09)
    elif g in ("great", "good", "interesting"):
        mix.add(ting(1900, 0.6), mt + 0.03, 0.05)
    elif g in ("blunder", "mistake", "inaccuracy"):
        mix.add(thump(80 if g == "blunder" else 120, 38, 0.8, decay=5), mt + 0.02, {"blunder": 0.55, "mistake": 0.35}.get(g, 0.22))
    elif g == "piece":
        mix.add(whoosh(), mt - 0.35, 0.12)
    elif g == "mate":
        mix.add(thump(55, 26, 1.8, decay=2.2, click=0.3), mt + 0.02, 0.9)
        mix.add(ting(660, 2.4), mt + 0.05, 0.08)
    elif g == "draw":
        # a soft boom and two bells a fifth apart: the game stops, nobody won
        mix.add(thump(70, 40, 1.4, decay=3, click=0.2), mt + 0.02, 0.6)
        mix.add(ting(880, 2.2), mt + 0.05, 0.06)
        mix.add(ting(1320, 2.2), mt + 0.05, 0.05)

# resultsDelay: seconds into the held last frame (so the mate card can be read before the ending covers it)
results = round(out(*data["resultsAt"]) + data.get("resultsDelay", 0.0), 3)
if "thumb" in data:
    # YouTube-card ending (Chess.tsx YtCard): card flies in, the time slams on, the arrow is drawn
    mix.add(whoosh(0.45), results, 0.16)
    mix.add(thump(70, 32, 1.0, decay=4, click=0.4), results + 0.55, 0.7)
    mix.add(ting(1760, 1.2), results + 0.57, 0.07)
    mix.add(whoosh(0.35), results + 0.95, 0.08)
else:
    for k in range(6):
        mix.add(click(0.04, 2200), results + 0.4 + k * 1.1, 0.25)
    mix.add(ting(1320, 2.0), results, 0.06)

final = mix.write(ID)


# 4. cues
subs = []
for p, a, b, text in data["subs"]:
    subs.append({"s": out(p, words[p][a][0]), "e": out(p, words[p][b][1]), "text": text})
for k in range(len(subs) - 1):
    # hold each line a little after it is spoken, never into the next one
    subs[k]["e"] = round(min(subs[k]["e"] + 0.35, subs[k + 1]["s"] - 0.05), 3)
if subs:
    subs[-1]["e"] = round(subs[-1]["e"] + 0.6, 3)

cues = {"duration": round(DUR, 3), "results": results, "moves": moves, "subs": subs,
        "cuts": [round(o, 3) for o in seg_out[1:]]}
(ROOT / f"src/{ID}/cues.json").write_text(json.dumps(cues, ensure_ascii=False, indent=1))
print(f"wrote {final}, {scene}; duration {DUR:.2f} s = {round(DUR * 30) + 1} frames; results at {results:.2f} s")
