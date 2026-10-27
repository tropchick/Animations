"""Scene, soundtrack and timing cues for «Шахматный разбор: До Слободы доеду?» (TikTok, Russian).

The picture and the dialogue are the user's own clip from the series «Мама будет против» (ep. 13, the bus scene),
two parts: part-a.mov and part-b.mov (854x480, 30 fps). They are not in git: the folder comes from
$SLOBODY_SRC (default /mnt/project-files/source/do-slobody). This script
  1. cuts the long silent pauses out (src/slobody/data.json "edl") and writes public/slobody/scene.mp4,
  2. crops the four avatars and the cover frame into public/slobody/,
  3. mixes the scene audio with synthesized chess sounds into public/audio/slobody.wav,
  4. writes src/slobody/cues.json: every move, subtitle and the results screen on the video timeline.

Moves and subtitles in data.json point at source times (part + seconds, subtitle words from
audio/voice/slobody-words.json made with tools/words.py), so the cut list can change without retiming anything.

Frame 0 of the video is the cover, so the scene starts at 1/30 s (OFF).

Sync map (on-screen event <-> sound onset, both at the move's time):
  move card slides in        <-> wooden piece click
  brilliant / great badge    <-> bright ting on top of the click
  blunder / mistake badge    <-> low thump
  mate                       <-> deep boom + low bell
  results sections appear    <-> soft clicks
"""

import hashlib
import json
import os
import subprocess
from pathlib import Path

import numpy as np

from slime_lib import ROOT, SR, Mix, click, filt, thump, ting, tt_, white

OFF = 1 / 30
SRC = Path(os.environ.get("SLOBODY_SRC", "/mnt/project-files/source/do-slobody"))
FILES = {"a": SRC / "part-a.mov", "b": SRC / "part-b.mov"}
PUB = ROOT / "public" / "slobody"
data = json.loads((ROOT / "src/slobody/data.json").read_text())
words = json.loads((ROOT / "audio/voice/slobody-words.json").read_text())
EDL = data["edl"]

# segment k starts at seg_out[k] on the video timeline
seg_out, t = [], OFF
for _, s, e in EDL:
    seg_out.append(t)
    t += e - s
DUR = t


def out(part, sec):
    """Source time -> video time. A time just past a cut (a card that lands on the last word) clamps to the cut."""
    for (p, s, e), o in zip(EDL, seg_out):
        if p == part and s - 0.05 <= sec <= e + 0.4:
            return round(o + min(max(sec, s), e) - s, 3)
    raise ValueError(f"{part} {sec} falls into a cut")


def ff(*args):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True)


# 1. the cut scene (re-encoded with a keyframe every second so every frame seeks exactly)
PUB.mkdir(parents=True, exist_ok=True)
scene = PUB / "scene.mp4"
stamp = PUB / "scene.edl"
key = hashlib.sha1(json.dumps(EDL).encode()).hexdigest()
if not scene.exists() or not stamp.exists() or stamp.read_text() != key:
    chains = [f"[{0 if p == 'a' else 1}:v]trim={s}:{e},setpts=PTS-STARTPTS,fps=30[v{k}]" for k, (p, s, e) in enumerate(EDL)]
    graph = ";".join(chains) + ";" + "".join(f"[v{k}]" for k in range(len(EDL))) + f"concat=n={len(EDL)}:v=1:a=0[v]"
    ff("-i", str(FILES["a"]), "-i", str(FILES["b"]), "-filter_complex", graph, "-map", "[v]",
       "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-g", "30", "-pix_fmt", "yuv420p", str(scene))
    stamp.write_text(key)

# 2. avatars: (part, second, crop x, crop y, size) in the 854x480 frame
AVATARS = {"city": ("a", 39.8, 160, 20, 220), "cond": ("a", 35.0, 386, 80, 240),
           "mom": ("a", 33.0, 160, 90, 220), "willow": ("b", 98.0, 426, 60, 220)}
for name, (p, sec, x, y, size) in AVATARS.items():
    ff("-ss", str(sec), "-i", str(FILES[p]), "-frames:v", "1", "-vf", f"crop={size}:{size}:{x}:{y},scale=256:256",
       "-q:v", "3", str(PUB / f"av-{name}.jpg"))


# the cover frame (her face at «Безнал есть?»)
ff("-ss", "39.8", "-i", str(FILES["a"]), "-frames:v", "1", "-q:v", "2", str(PUB / "cover.jpg"))


# 3. soundtrack
def load_part(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "s16le", "-ac", "2", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float64).reshape(-1, 2) / 32768


AUD = {p: load_part(f) for p, f in FILES.items()}
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

results = out(*data["resultsAt"])
for k in range(6):
    mix.add(click(0.04, 2200), results + 0.4 + k * 1.1, 0.25)
mix.add(ting(1320, 2.0), results, 0.06)

final = mix.write("slobody")


# 4. cues
subs = []
for p, a, b, text in data["subs"]:
    subs.append({"s": out(p, words[p][a][0]), "e": out(p, words[p][b][1]), "text": text})
for k in range(len(subs) - 1):
    # hold each line a little after it is spoken, never into the next one
    subs[k]["e"] = round(min(subs[k]["e"] + 0.35, subs[k + 1]["s"] - 0.05), 3)
subs[-1]["e"] = round(subs[-1]["e"] + 0.6, 3)

cues = {"duration": round(DUR, 3), "results": results, "moves": moves, "subs": subs,
        "cuts": [round(o, 3) for o in seg_out[1:]]}
(ROOT / "src/slobody/cues.json").write_text(json.dumps(cues, ensure_ascii=False, indent=1))
print(f"wrote {final}, {scene}; duration {DUR:.2f} s = {round(DUR * 30) + 1} frames; results at {results:.2f} s")
