"""Soundtrack and timing cues for "Последний", episode 1 "Ожидайте".

Voice: one ElevenLabs take on Eleven v4, library voice "Mikhail - confident and emotional"
(audio/voice/last-ep1-b.mp3, word times in last-ep1-words.json). Kostya records a voice message
on his phone in the kitchen, so the voice is close and dry. The two lines he quotes (the lift
speaker and the 112 answering machine) get the sound of a small speaker.

Outputs: public/audio/last-ep1.wav and src/last/cues.json.
"""

import json

import numpy as np

from slime_lib import (ROOT, SR, Mix, assemble, beep, brown, clank, click, drone, envelope, filt, load, rng, step,
                       thump, ting, tt_, white)

VOICE_START = 4.4
HOLD_AFTER = 0.6
SENT_HOLD = 4.6
TITLE = 3.6

words = json.loads((ROOT / "audio/voice/last-ep1-words.json").read_text())
takes = {k: load(ROOT / f"audio/voice/last-ep1-{k}.mp3") for k in words}

PIECES = [("b", 0, 139)]
PAUSES = {4: 0.3, 8: 0.6, 14: 0.2, 18: 0.4, 25: 0.6, 31: 1.3, 35: 0.4, 37: 0.6, 39: 0.4, 41: 0.9, 46: 0.3,
          48: 0.5, 50: 0.3, 53: 0.5, 56: 1.0, 59: 0.6, 68: 0.5, 69: 1.0, 76: 0.4, 81: 0.3, 85: 0.6, 88: 1.2,
          94: 0.3, 99: 0.4, 102: 0.9, 108: 0.4, 110: 0.6, 116: 1.5, 118: 0.4, 122: 0.4, 124: 0.5, 131: 1.4,
          136: 0.6, 138: 0.7}

voice, W = assemble(takes, words, PIECES, PAUSES, VOICE_START)
SENT = round(W[-1][1] + HOLD_AFTER, 3)
BLACK = round(SENT + SENT_HOLD, 3)
DUR = round(BLACK + TITLE, 2)
mix = Mix(DUR)
N = mix.n


def ws(i):
    return W[i][0]


def we(i):
    return W[i][1]


SHOTS = [
    ("hook", 0.0),
    ("chat", 2.7),
    ("record", VOICE_START - 0.25),
    ("stuck", ws(8) - 0.35),
    ("button", ws(18) - 0.3),
    ("sleep", ws(25) - 0.4),
    ("morning", ws(31) - 1.0),
    ("doors", ws(35) - 0.3),
    ("calls", ws(41) - 0.5),
    ("screen112", ws(48) - 0.3),
    ("yard", ws(56) - 0.7),
    ("cross", ws(59) - 0.4),
    ("shop", ws(69) - 0.7),
    ("money", ws(81) - 0.2),
    ("steps", ws(88) - 0.8),
    ("door36", ws(102) - 0.6),
    ("window", ws(116) - 1.1),
    ("reflect", ws(131) - 0.9),
    ("sent", SENT),
    ("title", BLACK),
]
shot_at = {n: s for n, s in SHOTS}
shot_end = {SHOTS[k][0]: (SHOTS[k + 1][1] if k + 1 < len(SHOTS) else DUR) for k in range(len(SHOTS))}

LIGHTS_OUT = 1.1  # the lamp in the cab dies in the hook
JOLT = shot_at["stuck"] + 0.35  # the cab stops between floors
MOTOR = shot_at["morning"] + 0.25  # 07:10, the cab starts by itself
DOORS = ws(35) + 0.1  # "Двери"
GREEN = ws(67) - 0.1  # "зелёного"
TICK = SENT + 2.3  # the second tick: delivered
SPEAKER = (ws(24) - 0.04, we(24) + 0.08)  # «Ожидайте» through the lift speaker
MACHINE = (ws(50) - 0.04, we(52) + 0.08)  # «Все операторы заняты» through the phone

# ---------------------------------------------------------------- voice

v = np.zeros(N)
i0 = mix.idx(VOICE_START)
v[i0: i0 + len(voice)] += voice[: N - i0]


def small_speaker(a, b, band, crunch):
    a, b = mix.idx(a), mix.idx(b)
    x = v[a:b].copy()
    y = filt(x, "bandpass", band, 4)
    y = np.tanh(y * crunch) / crunch * 2.2 + filt(white(len(y)), "bandpass", [1500, 6000]) * 0.012
    fade = np.minimum(1, np.minimum(np.arange(len(x)), np.arange(len(x))[::-1]) / (0.02 * SR))
    v[a:b] = x * (1 - fade) + y * fade


small_speaker(*SPEAKER, [380, 3000], 6)
small_speaker(*MACHINE, [300, 3400], 3)

# a phone held close: no room, a little low end from the mic
dry = filt(filt(v, "highpass", 90, 2), "lowpass", 9000, 2)
ir_t = tt_(0.35)
ir = filt(white(len(ir_t)), "lowpass", 3000) * np.exp(-ir_t * 14)
ir[: int(0.008 * SR)] = 0
from scipy import signal  # noqa: E402

wet = signal.fftconvolve(dry, ir)[:N]
wet *= 0.05 * np.max(np.abs(dry)) / (np.max(np.abs(wet)) + 1e-9)
mix.add(dry)
mix.add(wet, gain=1.0, pan=-0.25)
mix.add(np.roll(wet, int(0.017 * SR)), gain=1.0, pan=0.25)
venv = envelope(dry, DUR)

# ---------------------------------------------------------------- music: a warm low pad and a few soft notes

t = mix.t
pad1 = drone([55.0, 82.4, 110.0, 164.8], BLACK, detune=0.3, wobble=0.05)
mix.add(filt(pad1, "lowpass", 520) * np.clip(tt_(BLACK) / 5, 0, 1) * np.clip((BLACK - tt_(BLACK)) / 0.4, 0, 1), 0.0, gain=0.11)
# soft notes from "Мам, я не знаю" and over the night windows
notes = [(ws(88) - 0.4, 440.0), (ws(94), 329.6), (ws(99), 392.0), (ws(116) - 0.8, 440.0), (ws(118), 523.3),
         (ws(122), 493.9), (ws(124), 329.6), (ws(131) - 0.6, 440.0), (ws(136), 392.0), (SENT + 0.4, 329.6)]
for at, f in notes:

    s = ting(f, 3.2)
    s = filt(s, "lowpass", 2400) * np.exp(-tt_(3.2) * 0.6)
    mix.add(s, at, gain=0.035, pan=rng.uniform(-0.3, 0.3))

# ---------------------------------------------------------------- places

# the lift: motor hum and the buzzing lamp
lift_on = mix.env(0, LIGHTS_OUT, 0.3, 0.05) + mix.env(shot_at["stuck"], shot_at["morning"], 0.2, 0.4) * 0.7 \
    + mix.env(MOTOR, shot_end["doors"] - 0.5, 0.4, 0.6)
hum = filt(brown(N), "lowpass", 160) + 0.3 * np.sin(2 * np.pi * 100 * t)
buzz = filt(white(N), "bandpass", [1800, 4000]) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 100 * t)))
mix.add(hum * lift_on, gain=0.12)
mix.add(buzz * lift_on * 0.5, gain=0.012)
for k, at in enumerate([0.35, 0.6, 0.8, 0.95, 1.03]):
    mix.add(click(0.04, 2400 + 300 * k), at, gain=0.18)  # the lamp flickers
mix.add(click(0.06, 1600) * 2, LIGHTS_OUT, gain=0.35)
mix.add(thump(70, 40, 0.6, decay=8, click=0.2), LIGHTS_OUT, gain=0.08)
# phone in the dark: record beep
mix.add(beep(1320, 0.07), shot_at["record"] + 0.05, gain=0.05)
mix.add(beep(1760, 0.07), shot_at["record"] + 0.14, gain=0.05)
# 23:40: the jolt, knocking on the door
mix.add(clank(0.9, 210), JOLT, gain=0.35)
mix.add(thump(60, 32, 1.2, decay=4, click=0.4), JOLT, gain=0.35)
for k, at in enumerate([1.6, 2.0, 2.4, 3.6, 3.9]):
    mix.add(thump(110, 70, 0.3, decay=16, click=0.5) + clank(0.3, 300) * 0.3, shot_at["stuck"] + at, gain=0.16)
# the call button, the speaker hiss before «Ожидайте»
for at in (0.35, 1.3, 2.1):
    mix.add(click(0.04, 3000), shot_at["button"] + at, gain=0.25)
hiss = filt(white(int(0.5 * SR)), "bandpass", [800, 5000]) * np.sin(np.pi * tt_(0.5) / 0.5)
mix.add(hiss, SPEAKER[0] - 0.45, gain=0.03)
mix.add(hiss, SPEAKER[1], gain=0.025)
# 07:10: the motor starts by itself, the cab goes up, the doors slide
motor = filt(brown(int(2.2 * SR)), "lowpass", 220) * np.clip(tt_(2.2) / 0.5, 0, 1)
mix.add(motor, MOTOR, gain=0.4)
mix.add(clank(0.5, 260), MOTOR, gain=0.2)
mix.add(clank(0.6, 230), DOORS - 0.5, gain=0.18)
slide = filt(white(int(1.3 * SR)), "bandpass", [300, 2200]) * np.sin(np.pi * tt_(1.3) / 1.3)
mix.add(slide, DOORS - 0.35, gain=0.08)
mix.add(thump(80, 50, 0.4, decay=12, click=0.3), DOORS + 0.95, gain=0.1)
# after the doors: only a draught in the stairwell
draught = filt(white(N), "bandpass", [150, 900]) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.17 * t))
mix.add(draught * mix.env(DOORS + 1.0, shot_at["yard"], 1.5, 0.5), gain=0.03)
# ring-back tones: 425 Hz, 0.8 s on, 3.2 s off
rb = filt(np.sin(2 * np.pi * 425 * tt_(0.8)) * np.clip(tt_(0.8) / 0.01, 0, 1) * np.clip((0.8 - tt_(0.8)) / 0.01, 0, 1), "bandpass", [300, 3000])
for at in np.arange(shot_at["calls"] + 0.6, shot_at["screen112"] - 0.3, 2.4):
    mix.add(rb, at, gain=0.035, pan=0.35)
mix.add(click(0.03, 1500), shot_at["screen112"] + 0.1, gain=0.15, pan=0.35)
mix.add(rb, MACHINE[1] + 0.25, gain=0.03, pan=0.35)
mix.add(rb, MACHINE[1] + 2.0, gain=0.03, pan=0.35)
# outside: wind, leaves, a creaking swing, no engines anywhere
out_on = mix.env(shot_at["yard"], shot_at["shop"] + 0.3, 0.6, 0.4) + mix.env(shot_at["steps"], shot_at["door36"], 0.5, 0.5)
wind = filt(white(N), "bandpass", [180, 1400]) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.11 * t + 1))
leaves = filt(white(N) * (rng.random(N) < 0.02), "bandpass", [2000, 8000])
mix.add(wind * out_on, gain=0.07)
mix.add(leaves * out_on, gain=0.06)
for k in range(4):
    tt = tt_(0.55)
    f = 900 + 350 * np.sin(np.pi * tt / 0.55)
    squeak = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.55) ** 2
    mix.add(filt(squeak, "bandpass", [600, 3000]), shot_at["yard"] + 0.4 + k * 1.3, gain=0.025, pan=-0.4)
# the traffic light: a click to green, then the slow ticking for the blind
mix.add(click(0.05, 1200) * 1.5, GREEN, gain=0.25, pan=0.2)
for at in np.arange(GREEN + 0.4, shot_end["cross"] - 0.1, 0.5):
    mix.add(click(0.03, 2600), at, gain=0.09, pan=0.2)
for at in np.arange(shot_at["cross"] + 0.3, GREEN, 1.0):
    mix.add(click(0.03, 1700), at, gain=0.05, pan=0.2)
# the shop: a door bell, the fridge
mix.add(ting(2600, 1.2), shot_at["shop"] + 0.2, gain=0.04)
fridge = filt(np.sin(2 * np.pi * 50 * t) + 0.5 * np.sin(2 * np.pi * 100 * t) + 0.3 * filt(brown(N), "lowpass", 300), "lowpass", 400)
mix.add(fridge * mix.env(shot_at["shop"], shot_at["steps"], 0.3, 0.3), gain=0.06)
mix.add(filt(white(int(0.35 * SR)), "bandpass", [2000, 7000]) * np.exp(-tt_(0.35) * 9), shot_at["money"] + 0.5, gain=0.06)
mix.add(click(0.04, 900), shot_at["money"] + 1.6, gain=0.2)
# the landing in the evening: the dog behind door 36 whines and scratches
for k in range(4):
    at = shot_at["door36"] + 0.6 + k * 1.9
    tt = tt_(0.9)
    f = (980 - 260 * tt / 0.9) * (1 + 0.025 * np.sin(2 * np.pi * 7 * tt))
    whine = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.9) ** 1.5
    mix.add(filt(whine, "bandpass", [500, 2500]), at, gain=0.03, pan=0.15)
    for j in range(3):
        mix.add(filt(white(int(0.12 * SR)), "bandpass", [1500, 6000]) * np.exp(-tt_(0.12) * 25), at + 1.0 + j * 0.18, gain=0.03, pan=0.15)
# the kitchen at night: fridge, a clock, a car alarm far away that nobody switches off
night = mix.env(shot_at["chat"], shot_at["stuck"], 0.3, 0.2) + mix.env(shot_at["window"], BLACK, 0.8, 0.05)
mix.add(fridge * night, gain=0.04)
k = 0
while shot_at["window"] + k < BLACK:
    mix.add(click(0.025, 4000 if k % 2 else 3400), shot_at["window"] + 0.3 + k, gain=0.05, pan=-0.5)
    k += 1
tt = tt_(BLACK - shot_at["window"])
alarm = np.sin(2 * np.pi * np.cumsum(1100 + 500 * np.sign(np.sin(2 * np.pi * 1.6 * tt))) / SR)
alarm = filt(alarm, "lowpass", 1200) * np.clip(tt / 2, 0, 1) * np.clip((len(tt) / SR - tt) / 0.1, 0, 1)
mix.add(alarm, shot_at["window"], gain=0.006, pan=0.6)

# ---------------------------------------------------------------- the end

mix.add(beep(1760, 0.06), SENT - 0.05, gain=0.04)  # recording stops
swoosh = filt(white(int(0.4 * SR)), "bandpass", [1500, 7000]) * np.sin(np.pi * tt_(0.4) / 0.4) ** 2
mix.add(swoosh, SENT + 0.1, gain=0.04)
pop = np.sin(2 * np.pi * 880 * tt_(0.18)) * np.exp(-tt_(0.18) * 30) + np.sin(2 * np.pi * 1320 * tt_(0.18)) * np.exp(-tt_(0.18) * 40) * 0.5
mix.add(pop, TICK, gain=0.08)
mix.add(thump(46, 26, 3.2, decay=1.3, click=0.1), BLACK, gain=0.3)
tail = drone([55.0, 82.4], TITLE)
mix.add(filt(tail, "lowpass", 400) * np.exp(-tt_(TITLE) * 0.7), BLACK, gain=0.15)

final = mix.write("last-ep1")
cues = {
    "duration": DUR,
    "shots": [[n, round(s, 3)] for n, s in SHOTS],
    "words": [[round(a, 3), round(b, 3), w] for a, b, w in W],
    "lightsOut": LIGHTS_OUT,
    "jolt": round(JOLT, 3),
    "motor": round(MOTOR, 3),
    "doors": round(DOORS, 3),
    "green": round(GREEN, 3),
    "tick": round(TICK, 3),
    "voiceStart": VOICE_START,
    "voice": [round(float(x), 3) for x in venv],
}
(ROOT / "src/last").mkdir(exist_ok=True)
(ROOT / "src/last/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s) and src/last/cues.json")
for n, s in SHOTS:
    print(f"  {n:<10} {s:6.2f} – {shot_end[n]:6.2f}  ({shot_end[n] - s:4.1f} s)")
