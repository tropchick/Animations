"""Soundtrack and timing cues for "Slime Chronicle", episode 3 "The City".

Voice: one ElevenLabs take on Eleven v4 (audio/voice/slime-ep3-v4.mp3, Gleb) and the woman on the radio,
a separate take with another voice (audio/voice/slime-ep3-her-a.mp3). The announcement "Сохраняйте спокойствие.
Оставайтесь дома." plays through the kitchen radio, her line through the staff walkie-talkie, twice.

Outputs: public/audio/slime-ep3.wav and src/slime/ep3/cues.json.
"""

import json

import numpy as np

from slime_lib import (ROOT, SR, Mix, assemble, beep, brown, clank, click, dictaphone, drone, envelope, filt, load,
                       rng, step, thump, ting, tt_, white)

VOICE_START = 1.2
TITLE = 3.2

words = json.loads((ROOT / "audio/voice/slime-ep3-v4-words.json").read_text())
takes = {k: load(ROOT / f"audio/voice/slime-ep3-{k}.mp3") for k in words}
her_take = load(ROOT / "audio/voice/slime-ep3-her-a.mp3")
her_take = her_take[int(0.12 * SR): int(2.75 * SR)]

PIECES = [("v4", 0, 137)]
PAUSES = {4: 0.4, 12: 0.4, 32: 0.3, 33: 0.3, 38: 0.6, 44: 0.5, 49: 0.3, 51: 0.5, 63: 0.6, 72: 0.4, 79: 0.3,
          83: 0.6, 90: 0.3, 94: 0.5, 105: 0.5, 110: 0.4, 113: 0.5, 116: 0.6, 123: 0.6, 125: 0.3, 134: 0.3}

voice, W = assemble(takes, words, PIECES, PAUSES, VOICE_START)


def ws(i):
    return W[i][0]


def we(i):
    return W[i][1]


HER_LEN = len(her_take) / SR
HER1 = (round(we(137) + 1.0, 3), round(we(137) + 1.0 + HER_LEN, 3))
HER2 = (round(HER1[1] + 1.1, 3), round(HER1[1] + 1.1 + HER_LEN, 3))
BLACK = round(HER2[1] + 0.9, 3)
DUR = round(BLACK + TITLE, 2)
mix = Mix(DUR)
N = mix.n

SHOTS = [
    ("aerial", 0.0),
    ("recorder", ws(2) - 0.3),
    ("cordon", ws(4) - 0.3),
    ("tent", ws(12) - 0.3),
    ("notepad", ws(27) - 0.3),
    ("crane", ws(38) - 0.4),
    ("wall", ws(44) - 0.3),
    ("fire", ws(51) - 0.35),
    ("phone", ws(63) - 0.4),
    ("kitchen", ws(72) - 0.3),
    ("bridge", ws(83) - 0.4),
    ("window", ws(94) - 0.5),
    ("city", ws(105) - 0.3),
    ("scan", ws(116) - 0.5),
    ("hold", ws(125) - 0.4),
    ("live", HER1[0] - 0.6),
    ("reflect", HER2[0] - 0.3),
    ("title", BLACK),
]
shot_at = {n: s for n, s in SHOTS}
shot_end = {SHOTS[k][0]: (SHOTS[k + 1][1] if k + 1 < len(SHOTS) else DUR) for k in range(len(SHOTS))}

TWO = ws(32)  # "два": the pen writes 2
FLAME = (shot_at["fire"] + 0.4, ws(59) + 0.15)  # the flame goes out on "гасло"
NO_NET = ws(66)  # "пропала"
NO_INTERNET = ws(71)  # "интернет"
ANNOUNCE = (ws(79) - 0.05, we(82) + 0.1)
DARK = [ws(108), ws(110), ws(112), ws(114) + 0.1, we(115) + 0.2, HER2[0] + 1.0]  # districts going out
SCAN_STOP = we(124) + 0.15  # the walkie-talkie stops on the live channel
LIVE = HER1[0] - 0.25  # the green led comes on

# ---------------------------------------------------------------- voice

v = np.zeros(N)
i0 = mix.idx(VOICE_START)
v[i0: i0 + len(voice)] += voice[: N - i0]


def through(x, band, drive, hiss):
    y = filt(x, "bandpass", band, 4)
    y = np.tanh(y * drive) / (drive * 0.6)
    return y + filt(white(len(y)), "bandpass", [1500, 6000]) * hiss


def crossfade(dst, a, b, wet):
    fade = np.minimum(1, np.minimum(np.arange(b - a), np.arange(b - a)[::-1]) / (0.02 * SR))
    dst[a:b] = dst[a:b] * (1 - fade) + wet * fade


# the announcement: an old kitchen radio, wide AM band, a little hum
a, b = mix.idx(ANNOUNCE[0]), mix.idx(ANNOUNCE[1])
am = through(v[a:b], [300, 3400], 2.5, 0.012) + np.sin(2 * np.pi * 100 * tt_((b - a) / SR)) * 0.004
crossfade(v, a, b, am)
dry, wet = dictaphone(v, N)
mix.add(dry)
mix.add(wet, gain=0.9, pan=-0.3)
mix.add(np.roll(wet, int(0.023 * SR)), gain=0.9, pan=0.3)

# her voice on the walkie-talkie: narrow, crunchy, sand-like noise in the channel; the second time further away
her = np.zeros(N)
for k, (s0, s1) in enumerate((HER1, HER2)):
    x = her_take * (1.0 if k == 0 else 0.7)
    y = through(x, [500, 2700], 5 if k == 0 else 7, 0.02 if k == 0 else 0.035)
    her[mix.idx(s0): mix.idx(s0) + len(y)] += y[: N - mix.idx(s0)]
mix.add(her, gain=0.55, pan=0.12)
venv = envelope(dry + her * 0.55, DUR)

# ---------------------------------------------------------------- beds

t = mix.t
silence = BLACK
# the cordon: diesel generators, searchlight hum, distant orders
cordon = mix.env(0, shot_at["tent"], 0.3, 0.3) + mix.env(shot_at["crane"], shot_at["phone"], 0.4, 0.3) * 0.7
diesel = filt(brown(N), "lowpass", 120) + 0.5 * np.sin(2 * np.pi * 29 * t) * (0.7 + 0.3 * np.sin(2 * np.pi * 3.1 * t))
mix.add(diesel * cordon, gain=0.22)
mix.add(filt(white(N), "bandpass", [110, 130]) * cordon, gain=0.12)
for k in range(5):
    at = 0.8 + k * 1.6 + rng.uniform(0, 0.5)
    shout = filt(white(int(0.5 * SR)), "bandpass", [300, 1200]) * np.sin(np.pi * tt_(0.5) / 0.5) ** 2
    mix.add(shout, shot_at["cordon"] - 2.5 + at, gain=0.03, pan=rng.uniform(-0.8, 0.8))
for k in range(3):
    mix.add(through(filt(white(int(0.4 * SR)), "bandpass", [400, 2000]), [500, 2600], 3, 0.02) * np.exp(-tt_(0.4) * 4),
            shot_at["cordon"] + 0.5 + k * 1.9, gain=0.05, pan=-0.6)
# the sand-like hiss of the mass under everything outside
hiss = filt(white(N), "bandpass", [2500, 9000]) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * t))
mix.add(hiss * (cordon + mix.env(shot_at["wall"], shot_at["fire"], 0.5, 0.2)), gain=0.03)
# tent: canvas flapping, a humming lamp, the pen on paper
tent = mix.env(shot_at["tent"], shot_at["crane"], 0.3, 0.3)
mix.add(filt(white(N), "bandpass", [80, 400]) * (0.3 + 0.7 * np.clip(np.sin(2 * np.pi * 0.6 * t) ** 8, 0, 1)) * tent, gain=0.12)
mix.add(np.sin(2 * np.pi * 100 * t) * 0.3 * tent, gain=0.02)
for k in range(5):
    mix.add(filt(white(int(0.12 * SR)), "bandpass", [2000, 6000]) * np.sin(np.pi * tt_(0.12) / 0.12), TWO - 0.05 + k * 0.13, gain=0.05)
for k in range(4):
    mix.add(filt(white(int(0.1 * SR)), "bandpass", [2000, 6000]) * np.sin(np.pi * tt_(0.1) / 0.1), ws(34) + k * 0.12, gain=0.04)
# crane: creak and two heavy blocks
mix.add(filt(np.sin(2 * np.pi * np.cumsum(260 + 40 * np.sin(2 * np.pi * 0.7 * tt_(1.6))) / SR), "bandpass", [200, 1200]) *
        np.sin(np.pi * tt_(1.6) / 1.6), shot_at["crane"] + 0.2, gain=0.03, pan=0.4)
for k in range(2):
    mix.add(thump(55, 30, 1.0, decay=6, click=0.6), shot_at["crane"] + 1.6 + k * 1.5, gain=0.25)
    mix.add(clank(0.5, 160), shot_at["crane"] + 1.6 + k * 1.5, gain=0.06)
# fire: roar, then hiss and steam, cut off sharply
fa, fb = FLAME
roar = filt(white(int((fb - fa) * SR)), "lowpass", 900) + 0.5 * filt(white(int((fb - fa) * SR)), "bandpass", [1500, 5000])
roar *= np.clip(tt_(fb - fa) / 0.15, 0, 1) * (0.8 + 0.2 * np.sin(2 * np.pi * 7 * tt_(fb - fa)))
mix.add(roar, fa, gain=0.18)
steam = filt(white(int(2.5 * SR)), "bandpass", [3000, 10000]) * np.exp(-tt_(2.5) * 1.4)
mix.add(steam, fa + 0.4, gain=0.06)
mix.add(steam, fb - 0.05, gain=0.08)
mix.add(click(0.04, 900), fb, gain=0.2)
# phone: no network
mix.add(beep(620, 0.12) + 0, NO_NET, gain=0.05)
mix.add(beep(480, 0.25), NO_NET + 0.18, gain=0.05)
mix.add(beep(380, 0.12), NO_INTERNET, gain=0.04)
# kitchen: fridge hum, radio hiss
flat = mix.env(shot_at["kitchen"], shot_at["bridge"], 0.3, 0.2) + mix.env(shot_at["window"], silence, 0.6, 0.05)
mix.add(filt(white(N), "bandpass", [90, 160]) * flat, gain=0.18)
mix.add(filt(white(N), "bandpass", [1200, 6000]) * mix.env(shot_at["kitchen"], shot_at["bridge"], 0.2, 0.2), gain=0.025, pan=0.2)
# bridge: wind over the river, many slow steps, rustling bags
bridge = mix.env(shot_at["bridge"], shot_at["window"], 0.4, 0.4)
mix.add(filt(white(N), "bandpass", [200, 1200]) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.21 * t + 1)) * bridge, gain=0.1)
for k in range(40):
    mix.add(step(0.2), shot_at["bridge"] + rng.uniform(0.1, shot_end["bridge"] - shot_at["bridge"] - 0.2), gain=0.02, pan=rng.uniform(-0.7, 0.7))
for k in range(10):
    mix.add(filt(white(int(0.3 * SR)), "bandpass", [1500, 5000]) * np.sin(np.pi * tt_(0.3) / 0.3) ** 2,
            shot_at["bridge"] + rng.uniform(0.2, 4), gain=0.012, pan=rng.uniform(-0.6, 0.6))
# the city goes dark: a far low thud each time
for k, at in enumerate(DARK):
    mix.add(thump(48, 28, 2.0, decay=2.2, click=0.4), at, gain=0.22 + 0.03 * k)
# walkie-talkie scanning: clicks and bursts of hiss until it stops
k = 0
while shot_at["scan"] + 0.4 + k * 0.32 < SCAN_STOP:
    at = shot_at["scan"] + 0.4 + k * 0.32
    mix.add(click(0.02, 2600), at, gain=0.12, pan=0.12)
    mix.add(filt(white(int(0.22 * SR)), "bandpass", [1000, 5000]) * np.exp(-tt_(0.22) * 9), at + 0.02, gain=0.03, pan=0.12)
    k += 1
mix.add(click(0.03, 2400) * 2, SCAN_STOP, gain=0.35, pan=0.12)
live = filt(white(N), "bandpass", [1500, 7000]) * (0.6 + 0.4 * (rng.random(N) < 0.02))
mix.add(live * mix.env(SCAN_STOP + 0.05, BLACK, 0.3, 0.02), gain=0.022, pan=0.12)
# cold drone; it thins out for the last lines
d1 = drone([51.9, 77.8, 103.8], shot_at["hold"])
mix.add(filt(d1, "lowpass", 700) * np.clip(tt_(shot_at["hold"]) / 6, 0, 1) * np.clip((shot_at["hold"] - tt_(shot_at["hold"])) / 2, 0, 1), gain=0.15)
d2_len = silence - shot_at["hold"] + 1
d2 = drone([46.2, 69.3], d2_len, detune=0.4)
mix.add(filt(d2, "lowpass", 500) * np.minimum(1, tt_(d2_len) / 2) * np.minimum(1, (d2_len - tt_(d2_len)) / 0.3), shot_at["hold"] - 1, gain=0.14)

# ---------------------------------------------------------------- start and end

mix.add(click(0.06, 2600), 0.05, gain=0.4)
mix.add(ting(2200, 1.2), 0.4, gain=0.015)
mix.add(click(0.03, 1800) * 2, BLACK - 0.01, gain=0.5)
mix.add(thump(48, 26, 3.0, decay=1.3, click=0.2), BLACK, gain=0.35)
tail = drone([41.2, 61.7], TITLE)
mix.add(filt(tail, "lowpass", 400) * np.exp(-tt_(TITLE) * 0.6), BLACK, gain=0.18)

final = mix.write("slime-ep3")
cues = {
    "duration": DUR,
    "shots": [[n, round(s, 3)] for n, s in SHOTS],
    "words": [[round(a, 3), round(b, 3), w] for a, b, w in W],
    "two": round(TWO, 3),
    "flame": [round(x, 3) for x in FLAME],
    "noNet": round(NO_NET, 3),
    "noInternet": round(NO_INTERNET, 3),
    "dark": [round(x, 3) for x in DARK],
    "scanStop": round(SCAN_STOP, 3),
    "live": round(LIVE, 3),
    "her": [list(HER1), list(HER2)],
    "voice": [round(float(x), 3) for x in venv],
}
(ROOT / "src/slime/ep3").mkdir(parents=True, exist_ok=True)
(ROOT / "src/slime/ep3/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s = {round(DUR * 30)} frames) and src/slime/ep3/cues.json")
for n, s in SHOTS:
    print(f"  {n:<10} {s:6.2f} – {shot_end[n]:6.2f}  ({shot_end[n] - s:4.1f} s)")
