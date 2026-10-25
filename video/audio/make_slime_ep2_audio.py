"""Soundtrack and timing cues for "Slime Chronicle", episode 2 "The First Day".

Voice: one ElevenLabs take on Eleven v4 (audio/voice/slime-ep2-v4.mp3). The first cut used three
Multilingual v2 takes (slime-ep2-main/closed/radio.mp3); PIECES can still glue several takes.
Savelyeva's words on the radio get a walkie-talkie sound.

Outputs: public/audio/slime-ep2.wav and src/slime/ep2/cues.json.
"""

import json

import numpy as np

from slime_lib import (ROOT, SR, Mix, assemble, beep, breath, brown, clank, click, dictaphone, drone, envelope, filt,
                       load, rng, step, thump, ting, tt_, white)

VOICE_START = 0.4
HOLD_AFTER = 1.0
TITLE = 3.2

words = json.loads((ROOT / "audio/voice/slime-ep2-v4-words.json").read_text())
takes = {k: load(ROOT / f"audio/voice/slime-ep2-{k}.mp3") for k in words}

# (take, first word, last word); global word numbers count across the pieces
PIECES = [("v4", 0, 133)]
PAUSES = {4: 0.6, 8: 0.4, 13: 0.3, 16: 0.4, 22: 0.6, 24: 0.2, 27: 0.4, 34: 0.6, 36: 0.2, 43: 0.7, 54: 0.6,
          56: 0.4, 60: 0.6, 65: 0.4, 71: 0.8, 79: 0.3, 86: 0.6, 89: 0.4, 90: 0.6, 96: 0.3, 100: 0.8, 106: 0.8,
          113: 1.0, 115: 0.3, 122: 0.4, 128: 1.5, 130: 0.5}

voice, W = assemble(takes, words, PIECES, PAUSES, VOICE_START)
DUR = round(W[-1][1] + HOLD_AFTER + TITLE, 2)
mix = Mix(DUR)
N = mix.n


def ws(i):
    return W[i][0]


def we(i):
    return W[i][1]


BLACK = round(W[-1][1] + HOLD_AFTER, 3)
SHOTS = [
    ("jarsink", 0.0),
    ("recorder", ws(4) - 0.25),
    ("swarm", ws(8) - 0.2),
    ("sinking", ws(16) - 0.2),
    ("phone", ws(22) - 0.3),
    ("door", ws(34) - 0.25),
    ("face", ws(37) - 0.15),
    ("window", ws(43) - 0.3),
    ("deskgone", ws(54) - 0.25),
    ("doorgap", ws(60) - 0.25),
    ("yard", ws(71) - 0.3),
    ("tunnel", ws(81) - 0.2),
    ("waiting", ws(86) - 0.3),
    ("radio", ws(90) - 0.25),
    ("silent", ws(100) - 0.3),
    ("osoka", ws(106) - 0.3),
    ("roof", ws(113) - 0.4),
    ("roofview", ws(118) - 0.2),
    ("aerial", ws(128) - 0.4),
    ("title", BLACK),
]
shot_at = {n: s for n, s in SHOTS}
shot_end = {SHOTS[k][0]: (SHOTS[k + 1][1] if k + 1 < len(SHOTS) else DUR) for k in range(len(SHOTS))}

LEVER = ws(35)  # "закрыл"
RADIO_CLICK = ws(91)  # "щёлкнула"
HER = (ws(96) - 0.05, we(99) + 0.1)  # "Глеб... тут пол мягкий"
LIGHTS_OFF = ws(109)  # "погас"

# ---------------------------------------------------------------- voice

v = np.zeros(N)
i0 = mix.idx(VOICE_START)
v[i0: i0 + len(voice)] += voice[: N - i0]
# Savelyeva's line through the walkie-talkie: narrow band, crunchy, with hiss
a, b = mix.idx(HER[0]), mix.idx(HER[1])
her = v[a:b].copy()
radio = filt(her, "bandpass", [450, 2800], 4)
radio = np.tanh(radio * 5) / 3 + filt(white(len(radio)), "bandpass", [1500, 6000]) * 0.02
fade = np.minimum(1, np.minimum(np.arange(len(her)), np.arange(len(her))[::-1]) / (0.02 * SR))
v[a:b] = v[a:b] * (1 - fade) + radio * fade
dry, wet = dictaphone(v, N)
mix.add(dry)
mix.add(wet, gain=0.9, pan=-0.3)
mix.add(np.roll(wet, int(0.023 * SR)), gain=0.9, pan=0.3)
venv = envelope(dry, DUR)

# ---------------------------------------------------------------- room tones

t = mix.t
silence = shot_at["title"]
# the hall: no ventilation any more, only the sand-like hiss of the mass
hiss = filt(white(N), "bandpass", [2500, 9000]) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * t))
grit = filt(white(N) * (rng.random(N) < 0.01), "bandpass", [3000, 9000]) * 3
inside = mix.env(0, shot_at["yard"], 0.5, 0.6)
mix.add((hiss * 0.04 + grit * 0.05) * inside, gain=1.0)
low = filt(brown(N), "lowpass", 140)
mix.add(low * mix.env(shot_at["door"], shot_at["yard"], 1.0, 0.5) * (0.5 + 0.5 * np.clip((t - shot_at["door"]) / 20, 0, 1)), gain=0.25)
# cold drone through the whole episode, darker at night, thinner at dawn
d1 = drone([51.9, 77.8, 103.8], shot_at["roof"])
mix.add(filt(d1, "lowpass", 700) * np.clip(tt_(shot_at["roof"]) / 6, 0, 1), 0.0, gain=0.16)
d2_len = silence - shot_at["roof"]
d2 = drone([61.7, 92.5, 123.5], d2_len, detune=0.4)
mix.add(filt(d2, "lowpass", 900) * np.minimum(1, tt_(d2_len) / 2) * np.minimum(1, (d2_len - tt_(d2_len)) / 0.3), shot_at["roof"], gain=0.13)

# outside: wind, a dog far away, steps
outside = mix.env(shot_at["yard"], shot_at["tunnel"], 0.4, 0.2) + mix.env(shot_at["roof"], silence, 0.8, 0.05)
wind = filt(white(N), "bandpass", [200, 1200]) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.21 * t + 1))
mix.add(wind * outside, gain=0.08)
for k in range(2):
    tt = tt_(0.25)
    bark = filt(np.sin(2 * np.pi * (520 - 300 * tt) * tt) * np.exp(-tt * 12), "bandpass", [300, 2000])
    mix.add(bark, shot_at["yard"] + 1.2 + k * 0.5, gain=0.03, pan=0.7)
for k in range(8):
    mix.add(step(0.25), shot_at["yard"] + 0.4 + k * 0.55, gain=0.06, pan=-0.2)
# tunnel: dripping water and humming cables
mix.add(filt(white(N), "bandpass", [90, 140]) * mix.env(shot_at["tunnel"], shot_end["tunnel"], 0.2, 0.2), gain=0.4)
for k in range(4):
    mix.add(ting(rng.uniform(1600, 2400), 0.4), shot_at["tunnel"] + 0.3 + k * 0.9, gain=0.03, pan=rng.uniform(-0.5, 0.5))
# the waiting room: a clock, the radio hiss after it clicks
k = 0
while shot_at["waiting"] + k < shot_at["osoka"]:
    mix.add(click(0.03, 4200 if k % 2 else 3600), shot_at["waiting"] + 0.2 + k, gain=0.07, pan=-0.5)
    k += 1
static = filt(white(N), "bandpass", [1200, 6000])
mix.add(static * mix.env(RADIO_CLICK + 0.05, shot_at["silent"] + 1.5, 0.05, 1.2), gain=0.025, pan=0.15)
# birds at dawn
for k in range(6):
    st = shot_at["roof"] + 1.0 + k * 1.1 + rng.uniform(0, 0.5)
    tt = tt_(0.18)
    f = rng.uniform(2800, 4200) * (1 + 0.4 * np.sin(2 * np.pi * 14 * tt))
    mix.add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.18), st, gain=0.012, pan=rng.uniform(-0.8, 0.8))

# ---------------------------------------------------------------- events

mix.add(click(0.06, 2600), 0.05, gain=0.4)
mix.add(ting(3000, 1.0), 0.6, gain=0.03)  # glass creaks while sinking
for k in range(3):
    mix.add(ting(rng.uniform(2200, 3200), 0.6), shot_at["sinking"] + 0.6 + k * 1.1, gain=0.025)
# phone: dial tone, ring, pick-up
p0 = shot_at["phone"]
mix.add(filt(beep(425, 0.9), "lowpass", 1500), p0 + 0.2, gain=0.05, pan=0.3)
mix.add(click(0.04, 1500), p0 + 1.4, gain=0.15, pan=0.3)
# the lock lever and the red lamp
mix.add(clank(0.7, 240), LEVER, gain=0.3)
mix.add(thump(70, 40, 0.8, decay=7, click=0.3), LEVER + 0.05, gain=0.2)
mix.add(beep(880, 0.08), LEVER + 0.35, gain=0.06)
# glove on the warm door
mix.add(step(0.2), shot_at["doorgap"] + 0.3, gain=0.05)
# radio
mix.add(click(0.03, 2400) * 2, RADIO_CLICK, gain=0.4, pan=0.15)
mix.add(filt(white(int(0.25 * SR)), "bandpass", [1000, 5000]) * np.exp(-tt_(0.25) * 10), RADIO_CLICK + 0.02, gain=0.06)
mix.add(click(0.03, 2400), HER[1] + 0.2, gain=0.25, pan=0.15)
# Osoka goes dark: a far breaker, then the hum of the town drops
mix.add(thump(55, 30, 1.6, decay=3, click=0.5), LIGHTS_OFF, gain=0.3)
mix.add(clank(0.4, 180), LIGHTS_OFF, gain=0.06)
# aerial: wind falls away under the last line
mix.add(filt(white(int(2.0 * SR)), "bandpass", [300, 3000]) * np.linspace(1, 0, int(2.0 * SR)) ** 2, shot_at["aerial"], gain=0.06)
# end
mix.add(click(0.03, 1800) * 2, BLACK - 0.01, gain=0.5)
mix.add(thump(48, 26, 3.0, decay=1.3, click=0.2), BLACK, gain=0.35)
tail = drone([41.2, 61.7], TITLE)
mix.add(filt(tail, "lowpass", 400) * np.exp(-tt_(TITLE) * 0.6), BLACK, gain=0.18)

final = mix.write("slime-ep2")
cues = {
    "duration": DUR,
    "shots": [[n, round(s, 3)] for n, s in SHOTS],
    "words": [[round(a, 3), round(b, 3), w] for a, b, w in W],
    "lever": round(LEVER, 3),
    "radioClick": round(RADIO_CLICK, 3),
    "her": [round(HER[0], 3), round(HER[1], 3)],
    "lightsOff": round(LIGHTS_OFF, 3),
    "voice": [round(float(x), 3) for x in venv],
}
(ROOT / "src/slime/ep2/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s) and src/slime/ep2/cues.json")
for n, s in SHOTS:
    print(f"  {n:<10} {s:6.2f} – {shot_end[n]:6.2f}  ({shot_end[n] - s:4.1f} s)")
