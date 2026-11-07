"""Soundtrack for «Снеговик против весны» (rule simulation, no voice).

Reads the run's timeline (src/snow/timeline.json, written by src/snow/dump.ts) and puts a sound on every event:
a soft shimmer when the sun fires, a sizzle when a beam hits the snowman, a drip when a flake melts in the air,
a crunch + chime (pitch follows the counter) when a flake lands, tiny pops for flowers. Under it a calm music box
in spring that slowly freezes, birds that go quiet, wind that turns into a blizzard, and a big chord at infinity.
Frame 0 of the video is the cover, so story time t plays at t + 1/30.
"""
import json

import numpy as np

from slime_lib import ROOT, SR, Mix, brown, filt, thump, ting, tt_, white, rng

TL = json.loads((ROOT / "src" / "snow" / "timeline.json").read_text())
OFF = 1 / 30
DUR = TL["dur"]
INF = TL["inf"]
ZOOM = TL["zoom"]
mix = Mix(DUR + OFF + 0.3)
t_all = mix.t

curve = np.array(TL["curve"])  # t, ln Sd, winter, zoom
def at(col):
    return np.interp(t_all - OFF, curve[:, 0], curve[:, col])
LN = at(1)
WIN = at(2)
ZM = at(3)


def ln_at(t):
    return float(np.interp(t, curve[:, 0], curve[:, 1]))


# ---------- beds ----------
n = mix.n
# spring breeze, then winter wind that grows into a blizzard
breeze = filt(brown(n), "lowpass", 900) * (0.10 + 0.05 * np.sin(2 * np.pi * 0.07 * t_all))
mix.add(breeze * (1 - WIN) * 0.7, 0)
wind_src = white(n)
lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.11 * t_all) * np.sin(2 * np.pi * 0.037 * t_all + 1)
wind = filt(wind_src, "bandpass", [250, 1400]) * (0.25 + 0.75 * lfo)
howl = filt(white(n), "bandpass", [500, 900]) * (0.4 + 0.6 * np.sin(2 * np.pi * 0.23 * t_all) ** 2)
mix.add(wind * WIN ** 1.3 * 0.16, 0, pan=-0.2)
mix.add(howl * WIN ** 2.2 * 0.10, 0, pan=0.25)
# after infinity the blizzard settles
settle = np.clip(1 - (t_all - OFF - INF - 1.2) / 2.5, 0.35, 1)
mix.l *= np.where(t_all > INF + OFF + 1.2, settle, 1)
mix.r *= np.where(t_all > INF + OFF + 1.2, settle, 1)


# birds in spring, fewer as winter comes
def chirp():
    k = rng.integers(2, 5)
    out = []
    base = rng.uniform(2600, 4200)
    for _ in range(k):
        d = rng.uniform(0.05, 0.11)
        tt = tt_(d)
        f = base * (1 + 0.35 * np.sin(np.pi * tt / d)) * rng.uniform(0.9, 1.1)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2
        out.append(s)
        out.append(np.zeros(int(rng.uniform(0.03, 0.08) * SR)))
    return np.concatenate(out)


t = 0.6
while t < DUR:
    w = float(np.interp(t, curve[:, 0], curve[:, 2]))
    if rng.random() > w * 1.6:
        mix.add(chirp(), t + OFF, gain=0.035, pan=rng.uniform(-0.8, 0.8))
    t += rng.uniform(1.2, 3.2)

# ---------- music box: C - Am - F - G, slowly freezing ----------
BPM = 84
beat = 60 / BPM
CH = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]]
PAT = [0, 1, 2, 3, 2, 1, 2, 3]
midi = lambda m: 440 * 2 ** ((m - 69) / 12)


def pluck(freq, dur=1.2, bright=1.0):
    tt = tt_(dur)
    s = sum(np.sin(2 * np.pi * freq * k * tt) * np.exp(-tt * (3.2 + 2.4 * k)) / k ** (1.6 - 0.4 * bright) for k in (1, 2, 3, 4))
    return s * np.clip(tt / 0.003, 0, 1)


step_i = 0
t = 0.3
music_end = INF + 0.2
while t < music_end:
    bar = (step_i // 8) % 4
    note = CH[bar][PAT[step_i % 8]] + 12
    w = float(np.interp(t, curve[:, 0], curve[:, 2]))
    g = 0.075 * (1 - 0.45 * w)
    mix.add(pluck(midi(note), 1.1, 1 - w), t + OFF, gain=g, pan=0.3 * np.sin(step_i))
    if step_i % 8 == 0:
        mix.add(pluck(midi(CH[bar][0] - 12), 2.0, 0.5), t + OFF, gain=0.07)
    # once the camera pulls back the arpeggio speeds up
    speed = 1.0 if t < ZOOM else 1.5
    t += beat / 2 / speed
    step_i += 1

# a rising pad under the comeback and the pull-back
pad_t = tt_(max(0.1, INF - ZOOM + 2.0))
pad = np.zeros(len(pad_t))
for m in (48, 55, 60, 64, 67):
    pad += np.sin(2 * np.pi * midi(m) * pad_t * (1 + 0.003 * np.sin(2 * np.pi * 0.3 * pad_t + m)))
pad *= np.clip(pad_t / (INF - ZOOM), 0, 1) ** 2 * np.clip((len(pad_t) / SR - pad_t) / 1.5, 0, 1) / 5
mix.add(filt(pad, "lowpass", 2500), ZOOM + OFF, gain=0.11)

# ---------- events ----------
PENTA = [0, 2, 4, 7, 9]


def penta(k):
    return 72 + 12 * (k // 5) + PENTA[k % 5]


def shimmer():
    tt = tt_(0.16)
    f = 2900 - 1400 * tt / 0.16
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 18) + filt(white(len(tt)), "highpass", 5000) * np.exp(-tt * 30) * 0.3


def sizzle(d=0.45):
    tt = tt_(d)
    s = filt(white(len(tt)), "highpass", 3200) * np.clip(tt / 0.006, 0, 1) * np.exp(-tt * 7)
    crackle = (rng.random(len(tt)) > 0.9985) * rng.uniform(-1, 1, len(tt))
    return s * (0.8 + 0.4 * np.sin(2 * np.pi * 37 * tt)) + filt(crackle, "highpass", 2000) * 2.5 * np.exp(-tt * 5)


def drip():
    tt = tt_(0.09)
    f = 700 + 1500 * tt / 0.09
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.09)


def crunch():
    tt = tt_(0.14)
    grains = filt(white(len(tt)), "bandpass", [400, 3000]) * (rng.random(len(tt)) > 0.6)
    return grains * np.exp(-tt * 22)


def pop():
    tt = tt_(0.05)
    f = 500 + 900 * tt / 0.05
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.05)


for b in TL["beams"]:
    if b < INF:
        mix.add(shimmer(), b + OFF, gain=0.045, pan=-0.5)

last = {"grow": -9.0, "hit": -9.0, "kill": -9.0, "flower": -9.0}
for t, kind, x in TL["events"]:
    if t >= INF + 0.4:
        continue
    pan = float(np.clip((x - 540) / 600, -0.8, 0.8))
    gap = t - last[kind]
    if kind == "hit":
        mix.add(sizzle(), t + OFF, gain=0.16 if gap > 0.1 else 0.07, pan=pan)
        mix.add(drip(), t + OFF + 0.12, gain=0.05, pan=pan)
    elif kind == "kill":
        mix.add(sizzle(0.25), t + OFF, gain=0.11, pan=pan)
        mix.add(drip(), t + OFF + 0.18, gain=0.16, pan=pan)
    elif kind == "grow":
        if gap < 0.07:
            continue  # a flurry of landings: one sound per 70 ms is plenty
        lnS = ln_at(t)
        k = int(np.clip(4 + lnS / 0.405, 0, 14))
        mix.add(crunch(), t + OFF, gain=0.14, pan=pan)
        mix.add(ting(midi(penta(k)), 1.0), t + OFF + 0.01, gain=0.07 if gap > 0.25 else 0.045, pan=pan)
    elif kind == "flower":
        if gap < 0.12:
            continue
        mix.add(pop(), t + OFF, gain=0.04, pan=pan)
    last[kind] = t

# ---------- the pull-back and infinity ----------
sw = tt_(max(0.5, INF - ZOOM))
whoosh = filt(white(len(sw)), "bandpass", [300, 3000]) * (sw / sw[-1]) ** 2.5
mix.add(whoosh, ZOOM + OFF, gain=0.05)
mix.add(thump(70, 34, 2.2, decay=2.2, click=0.3), INF + OFF, gain=0.5)
for k, m in enumerate((60, 64, 67, 72, 76, 79, 84)):
    mix.add(pluck(midi(m), 3.2, 0.8), INF + OFF + 0.03 * k, gain=0.07)
mix.add(ting(midi(96), 2.5), INF + OFF + 0.25, gain=0.08)

# a quiet music-box outro over the planet
for k, m in enumerate((72, 76, 79, 84, 79, 76, 72, 67)):
    mix.add(pluck(midi(m), 1.6, 0.6), INF + OFF + 1.0 + 0.42 * k, gain=0.07)
out_t = tt_(max(0.5, DUR - INF - 0.6))
outro = sum(np.sin(2 * np.pi * midi(m) * out_t) for m in (48, 55, 60, 64)) / 4
outro *= np.clip(out_t / 1.0, 0, 1) * np.clip((len(out_t) / SR - out_t) / 1.2, 0, 1)
mix.add(filt(outro, "lowpass", 1800), INF + OFF + 0.6, gain=0.10)
mix.add(filt(brown(len(out_t)), "lowpass", 700) * np.clip(out_t / 1.0, 0, 1), INF + OFF + 0.6, gain=0.08)

fade = np.clip((mix.dur - t_all) / 0.6, 0, 1)
mix.l *= fade
mix.r *= fade
print("wrote", mix.write("snow-spring"))
