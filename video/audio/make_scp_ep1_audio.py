"""Soundtrack and timing cues for "What if you got lost in SCP-3008? (Part 1) — Closing Time".

Voices (ElevenLabs Eleven v4, one take each):
  audio/voice/scp-ep1-ben.mp3      Ben's phone log, word times in scp-ep1-words.json
  audio/voice/scp-ep1-pa.mp3       the store PA: "The store is now closing..."
  audio/voice/scp-ep1-whisper.mp3  "Ben?" from outside the wardrobe
Sound effects from ElevenLabs text-to-sound (audio/sfx/scp/), the rest synthesized. No music.

Frame 0 of the video is the cover, so the story starts one frame late: every time below is story time
(video second v = (frame - 1) / 30), and the finished track gets 1/30 s of silence in front.

Sync map (story time of the on-screen event <-> where the sound peaks):
  REC          record dot appears           <-> synth beep
  DOORS        sliding doors open           <-> doors.mp3 peak at 1.09 s in the clip
  GONE         cut to the living room       <-> store_day bed cut, hum stays
  CHIME        speaker on the column        <-> chime.mp3 onset at 0 s
  ROWS[k]      ceiling row k goes dark      <-> synth clunk k (lights_off.mp3 onset on ROWS[0])
  STAFF_STEP   staff takes one step         <-> synth heavy step
  HUNT         staff head snaps round       <-> hit.mp3 attack at 0.01 s, peak at 0.07 s
  SLIDES[k]    wardrobe k starts sliding    <-> furniture.mp3 scrape segment
  FLASH_OFF    phone light goes out         <-> synth click
  LEGS[k]      a leg plants outside the gap <-> steps.mp3 onsets every ~0.85 s
  KNOCKS[k]    wardrobe door jolts          <-> knock.mp3 first knock (0.33 s in the clip)
  WHISPER      -                            <-> whisper.mp3, voice from 0.18 s
"""

import json

import numpy as np
from scipy import signal

from slime_lib import ROOT, SR, Mix, assemble, beep, brown, click, envelope, filt, load, rng, step, thump, tt_, white

OFF = 1 / 30
VOICE_START = 1.2

words = json.loads((ROOT / "audio/voice/scp-ep1-words.json").read_text())
takes = {"ben": load(ROOT / "audio/voice/scp-ep1-ben.mp3")}
PA = load(ROOT / "audio/voice/scp-ep1-pa.mp3")
WHISPER_CLIP = load(ROOT / "audio/voice/scp-ep1-whisper.mp3")
SFX = {n: load(ROOT / f"audio/sfx/scp/{n}.mp3") for n in
       ["store_day", "hum", "chime", "lights_off", "steps", "furniture", "knock", "hit", "doors"]}

PIECES = [("ben", 0, 125)]
PAUSES = {12: 0.3, 21: 0.4, 29: 0.4, 35: 0.3, 40: 0.5, 44: 0.6, 52: 5.4, 60: 1.3, 69: 1.0, 75: 0.3, 80: 0.9,
          92: 0.2, 97: 1.7, 105: 0.9, 111: 1.8, 116: 0.4, 121: 2.0}

voice, W = assemble(takes, words, PIECES, PAUSES, VOICE_START)


def ws(i):
    return W[i][0]


def we(i):
    return W[i][1]


CHIME = we(51) + 0.35
PA_AT = CHIME + 1.25
WHISPER = we(125) + 0.75
BLACK = round(WHISPER + 1.25, 3)
END_CARD = 3.6
DUR = round(BLACK + END_CARD, 2)

SHOTS = [
    ("phone", 0.0),
    ("enter", ws(12) - 0.45),
    ("turn", ws(21) - 0.25),
    ("signs", ws(29) - 0.35),
    ("rise", ws(35) - 0.25),
    ("pa", ws(44) - 0.45),
    ("lightsout", PA_AT + len(PA) / SR + 0.2),
    ("staff", ws(60) - 0.45),
    ("daynight", ws(69) - 0.4),
    ("run", ws(80) - 0.45),
    ("fort", ws(92) - 0.3),
    ("hide", ws(97) - 0.5),
    ("inside", ws(105) - 0.4),
    ("knock", ws(116) - 0.35),
    ("end", BLACK),
]
shot_at = {n: s for n, s in SHOTS}
shot_end = {SHOTS[k][0]: (SHOTS[k + 1][1] if k + 1 < len(SHOTS) else DUR) for k in range(len(SHOTS))}

REC = 0.55
DOORS = shot_at["enter"] + 0.6  # doors fully slide open ~1.1 s later
GONE = ws(25) - 0.08  # over-the-shoulder cut: the entrance is a living room now
NIGHT_CUT = ws(75) - 0.12  # daynight: day -> night cut on "In the dark"
HUNT = ws(79) + 0.02
# lights go out row by row, far rows first, the last one right over the camera
ROWS = [round(ws(54) - 0.15 + k * 0.3 + 0.015 * k * k, 3) for k in range(8)]
STAFF_STEP = shot_at["staff"] + 1.5
TURN_HEAD = (ws(66) - 0.1, ws(67) + 0.4)  # the near staff turns its head on "Tall. No faces."
SLIDES = [round(shot_at["fort"] + 0.35 + k * 1.0, 3) for k in range(4)]
SLIDE_LEN = 0.75
FLASH_ON = shot_at["hide"]
FLASH_OFF = we(98) + 0.04
HAND_MOUTH = ws(101) - 0.1
LEGS_FROM = shot_at["inside"] + 0.45
LEGS = [round(LEGS_FROM + x, 3) for x in (0.0, 0.85, 1.71, 2.54, 3.4, 4.25, 5.1)]
KNOCKS = [round(we(120) + 0.55 + k * 0.42, 3) for k in range(3)]

# ---------------------------------------------------------------- voice: a phone held close

mix = Mix(DUR)
N = mix.n
t = mix.t
v = np.zeros(N)
i0 = mix.idx(VOICE_START)
v[i0: i0 + len(voice)] += voice[: N - i0]
dry = filt(filt(v, "highpass", 95, 2), "lowpass", 9000, 2)
ir_t = tt_(0.4)
ir = filt(white(len(ir_t)), "lowpass", 2800) * np.exp(-ir_t * 12)
ir[: int(0.008 * SR)] = 0
wet = signal.fftconvolve(dry, ir)[:N]
wet *= 0.05 * np.max(np.abs(dry)) / (np.max(np.abs(wet)) + 1e-9)
mix.add(dry)
mix.add(wet, pan=-0.25)
mix.add(np.roll(wet, int(0.017 * SR)), pan=0.25)
venv = envelope(dry, DUR)


def hall(x, secs=2.6, bright=2400, amount=0.6):
    """A huge empty store: long dark reverb."""
    it = tt_(secs)
    r = filt(white(len(it)), "lowpass", bright) * np.exp(-it * 6.9 / secs)
    r[: int(0.03 * SR)] = 0
    y = signal.fftconvolve(x, r)
    y *= amount * np.max(np.abs(x)) / (np.max(np.abs(y)) + 1e-9)
    out = np.zeros(len(y))
    out[: len(x)] += x
    return out + y


def loop(clip, dur, xfade=1.0):
    """Repeat a looping bed to `dur` seconds with short crossfades."""
    n, xf = int(dur * SR), int(xfade * SR)
    out = np.zeros(n + len(clip))
    pos = 0
    ramp_in = np.linspace(0, 1, xf)
    while pos < n:
        c = clip.copy()
        c[:xf] *= ramp_in
        c[-xf:] *= ramp_in[::-1]
        out[pos: pos + len(c)] += c
        pos += len(c) - xf
    return out[:n]


def seg(clip, a, b, fade=0.03):
    x = clip[int(a * SR): int(b * SR)].copy()
    f = int(fade * SR)
    x[:f] *= np.linspace(0, 1, f)
    x[-f:] *= np.linspace(1, 0, f)
    return x


# ---------------------------------------------------------------- beds

day = mix.env(shot_at["enter"] - 0.1, GONE, 0.3, 0.02) + mix.env(shot_at["daynight"], NIGHT_CUT, 0.05, 0.02)
mix.add(loop(SFX["store_day"], DUR) * day, gain=1.1)
# fluorescent hum from the moment the store goes wrong until the rows go dark (it dies with them)
lamps_on = mix.env(shot_at["enter"], ROWS[-1] + 0.1, 0.5, 0.6) * (1 - 0.6 * mix.env(shot_at["enter"], GONE, 0.01, 0.01)) \
    + mix.env(shot_at["daynight"], NIGHT_CUT, 0.05, 0.02) * 0.7
mix.add(loop(SFX["hum"], DUR) * lamps_on, gain=3.2)
# the phone shot and the night: ventilation, a big empty room
vent = filt(brown(N), "lowpass", 140) + 0.4 * filt(white(N), "bandpass", [300, 900]) * 0.05
night = mix.env(0, shot_at["enter"], 0.01, 0.2) + mix.env(ROWS[2], BLACK, 1.5, 0.01) * (1 - mix.env(shot_at["daynight"], NIGHT_CUT, 0.01, 0.01))
mix.add(vent * night, gain=0.09)
# the rise: a low swell, the store going on forever
swell = filt(brown(N), "lowpass", 90) * mix.env(shot_at["rise"], shot_end["rise"] + 0.6, 2.5, 1.2)
mix.add(swell, gain=0.3)

# ---------------------------------------------------------------- events

mix.add(beep(1320, 0.07), REC, gain=0.05)
mix.add(beep(1760, 0.07), REC + 0.09, gain=0.05)
mix.add(SFX["doors"], DOORS - 0.6, gain=0.55)
# Ben's steps: walking in, the circles under the signs, running to the bedroom
for at in np.arange(shot_at["enter"] + 0.5, shot_end["enter"] - 0.2, 0.56):
    mix.add(step(0.3), at, gain=0.05, pan=rng.uniform(-0.1, 0.1))
for at in np.arange(shot_at["signs"] + 0.3, shot_end["rise"] - 2.5, 0.58):
    mix.add(hall(step(0.3), 1.2, 1800, 0.4), at, gain=0.04)
RUN_STEPS = list(np.arange(shot_at["run"] + 0.15, shot_end["run"] - 0.4, 0.29))
for at in RUN_STEPS:
    mix.add(hall(step(0.25), 1.5, 1500, 0.35), at, gain=0.07, pan=rng.uniform(-0.15, 0.15))
for k, at in enumerate(np.arange(shot_at["run"] + 0.2, shot_end["run"], 0.62)):
    tt = tt_(0.4)
    b = filt(white(len(tt)), "bandpass", [600, 3000]) * np.sin(np.pi * tt / 0.4) ** 2
    mix.add(b, at, gain=0.025)

# the PA: chime, then the flat voice through ceiling speakers in a huge hall
mix.add(hall(SFX["chime"], 2.8, 3000, 0.5), CHIME, gain=0.55)
pa = filt(PA, "bandpass", [330, 3600], 4)
pa = np.tanh(pa * 3) / 3 * 2.2
mix.add(hall(pa, 3.0, 2600, 0.75), PA_AT, gain=0.85)

# lights out row by row: a heavy clunk per row, each a bit closer and louder
mix.add(SFX["lights_off"], ROWS[0], gain=0.35)
for k, at in enumerate(ROWS):
    near = (k + 1) / len(ROWS)
    clunk = thump(90, 45, 0.6, decay=10, click=0.6)
    clunk[: int(0.08 * SR)] += filt(white(int(0.08 * SR)), "bandpass", [1500, 6000]) * 0.3 * np.exp(-tt_(0.08) * 40)
    mix.add(hall(clunk, 2.2, 1600, 0.5), at, gain=0.08 + 0.18 * near)

# staff: one heavy step, then nothing
mix.add(hall(seg(SFX["steps"], 3.3, 3.95), 2.4, 1400, 0.5), STAFF_STEP - 0.1, gain=0.9)
mix.add(hall(seg(SFX["steps"], 0.75, 1.45), 2.4, 1400, 0.5), shot_at["staff"] + 3.2 - 0.1, gain=0.5, pan=0.2)
# the night half of day/night: the hit when the head snaps round
mix.add(SFX["hit"], HUNT - 0.03, gain=0.9)  # attack at 0.01 s, peak at 0.07 s in the clip

# the fort: four wardrobes scraped across the floor, a thud as each one lands
scrapes = [seg(SFX["furniture"], 1.35, 2.75, 0.06), seg(SFX["furniture"], 3.65, 4.6, 0.06)]
for k, at in enumerate(SLIDES):
    s = scrapes[k % 2][: int((SLIDE_LEN + 0.15) * SR)]
    s[-int(0.1 * SR):] *= np.linspace(1, 0, int(0.1 * SR))
    mix.add(hall(s, 1.6, 2000, 0.3), at - 0.05, gain=0.7, pan=(-0.3, 0.3, -0.15, 0.15)[k])
    mix.add(hall(thump(80, 50, 0.5, decay=12, click=0.5), 1.6, 1500, 0.4), at + SLIDE_LEN, gain=0.2)

# inside: phone light on and off, held breath
mix.add(click(0.04, 2600), FLASH_ON + 0.05, gain=0.18)
mix.add(click(0.05, 2400) * 1.4, FLASH_OFF, gain=0.3)
mix.add(filt(white(int(1.2 * SR)), "bandpass", [500, 3000]) * np.sin(np.pi * tt_(1.2) / 1.2) ** 1.5, FLASH_OFF + 0.7, gain=0.02)

# legs passing the gaps: the staff's slow heavy steps
for k, at in enumerate(LEGS):
    src = seg(SFX["steps"], [0.0, 0.85, 1.71, 2.54, 3.4][k % 5], [0.0, 0.85, 1.71, 2.54, 3.4][k % 5] + 0.8)
    mix.add(hall(src, 2.0, 1500, 0.45), at, gain=0.75 * (1 - 0.08 * k), pan=0.25 * np.sin(k))
# the clock spinning to 03:07: a soft rising whoosh
sp = filt(white(int(1.8 * SR)), "bandpass", [400, 2500]) * np.sin(np.pi * tt_(1.8) / 1.8) ** 2
mix.add(sp, ws(111) - 1.75, gain=0.02)

# three knocks on the wardrobe door, close and dry
knock = seg(SFX["knock"], 0.29, 0.56, 0.005)
for k, at in enumerate(KNOCKS):
    mix.add(knock, at - 0.04, gain=1.3 + 0.2 * k)
    mix.add(thump(140, 90, 0.25, decay=22, click=0.4), at, gain=0.12)

# "Ben?" from outside: muffled through the wardrobe
w = filt(WHISPER_CLIP, "lowpass", 3200, 2)
mix.add(hall(w, 1.0, 2000, 0.25), WHISPER - 0.18, gain=1.4, pan=0.2)

# ---------------------------------------------------------------- the end: total silence, then a low tone for the card
mix.l[mix.idx(BLACK):] = 0
mix.r[mix.idx(BLACK):] = 0
mix.add(thump(46, 28, 3.0, decay=1.4, click=0.05), BLACK + 0.7, gain=0.18)


def write_linear(name, target_lufs=-15.0):
    """One plain gain change to the target loudness (loudnorm would lift the silences), cover frame in front."""
    import subprocess
    import wave

    def save(path, x):
        with wave.open(str(path), "wb") as f:
            f.setnchannels(2)
            f.setsampwidth(2)
            f.setframerate(SR)
            f.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())

    def lufs(path):
        err = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "loudnorm=print_format=json", "-f", "null", "-"],
                             capture_output=True, text=True, check=True).stderr
        return float(json.loads(err[err.rindex("{"): err.rindex("}") + 1])["input_i"])

    x = np.stack([mix.l, mix.r], axis=1)
    x = filt(x.T, "highpass", 22, 2).T
    x = np.concatenate([np.zeros((int(round(OFF * SR)), 2)), x])
    x = x / np.max(np.abs(x)) * 0.5
    final = ROOT / "public" / "audio" / f"{name}.wav"
    for _ in range(4):
        save(final, np.tanh(x * 1.1) / 1.1)
        x = x * 10 ** ((target_lufs - lufs(final)) / 20)
    y = np.tanh(x * 1.1) / 1.1
    save(final, y * min(1.0, 0.89 / np.max(np.abs(y))))
    return final


final = write_linear("scp-ep1")
r3 = lambda x: round(float(x), 3)  # noqa: E731
cues = {
    "duration": DUR,
    "shots": [[n, r3(s)] for n, s in SHOTS],
    "words": [[r3(a), r3(b), x] for a, b, x in W],
    "voiceStart": VOICE_START,
    "rec": REC,
    "doors": r3(DOORS),
    "gone": r3(GONE),
    "chime": r3(CHIME),
    "pa": [r3(PA_AT), r3(PA_AT + len(PA) / SR)],
    "rows": ROWS,
    "staffStep": r3(STAFF_STEP),
    "turnHead": [r3(x) for x in TURN_HEAD],
    "nightCut": r3(NIGHT_CUT),
    "hunt": r3(HUNT),
    "runSteps": [r3(x) for x in RUN_STEPS],
    "slides": SLIDES,
    "slideLen": SLIDE_LEN,
    "flashOff": r3(FLASH_OFF),
    "handMouth": r3(HAND_MOUTH),
    "legs": LEGS,
    "knocks": KNOCKS,
    "whisper": r3(WHISPER),
    "voice": [r3(x) for x in venv],
}
(ROOT / "src/scp").mkdir(exist_ok=True)
(ROOT / "src/scp/cues.json").write_text(json.dumps(cues))
print(f"wrote {final} ({DUR} s + cover frame) and src/scp/cues.json")
for n, s in SHOTS:
    print(f"  {n:<10} {s:6.2f} – {shot_end[n]:6.2f}  ({shot_end[n] - s:4.1f} s)")
print("rows", ROWS, "slides", SLIDES, "knocks", KNOCKS, "hunt", round(HUNT, 2), "whisper", round(WHISPER, 2))
