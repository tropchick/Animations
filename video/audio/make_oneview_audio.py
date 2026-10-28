"""Soundtrack of «Исторический рекорд» (src/oneview/OneView.tsx): all synthesized, no voice.
Usage: python3 audio/make_oneview_audio.py  ->  public/audio/oneview.wav

Sync map (same marks as T in OneView.tsx):
  0.1  drumroll under the spotlights, growing
  1.6  cymbal crash + fanfare «та-та-та-таам» as the screenshot flies in
  2.4  rising whoosh + bell as the trophy rises
  3.2  timpani + big major chord + crowd applause and cheering, confetti pops
  4.8 / 6.0 / 7.4  fireworks: launch whistle, boom, crackle
  7.4  second fanfare phrase into the final chord
  9.4  button click + ting
"""

import numpy as np
from scipy import signal

from slime_lib import SR, Mix, click, filt, thump, ting, tt_, white

rng = np.random.default_rng(7)
END = 11.0
mix = Mix(END)


def note(name):
    names = {'C': -9, 'D': -7, 'E': -5, 'F': -4, 'G': -2, 'A': 0, 'B': 2}
    return 440 * 2 ** ((names[name[0]] + 12 * (int(name[1]) - 4)) / 12)


def brass(f, dur, vel=1.0):
    """A cheesy synth trumpet: a saw with a filter that opens on the attack, slight vibrato."""
    t = tt_(dur)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.15) / 0.2, 0, 1)
    ph = 2 * np.pi * f * np.cumsum(vib) / SR
    s = sum(np.sin(k * ph) / k for k in range(1, 14))
    bright = filt(s, 'lowpass', 3600)
    dark = filt(s, 'lowpass', 900)
    a = np.clip(t / 0.08, 0, 1)
    s = dark + (bright - dark) * np.exp(-t * 3) * a
    env = np.clip(t / 0.025, 0, 1) * np.clip((dur - t) / 0.08, 0, 1) * (0.85 + 0.15 * np.exp(-t * 4))
    return s * env * vel


def chord(names, dur, vel=1.0):
    return sum(brass(note(n), dur, vel) for n in names) / len(names) * 1.6


def snare(gain=1.0):
    t = tt_(0.09)
    return (filt(white(len(t)), 'bandpass', [1500, 7000]) * 0.8 + np.sin(2 * np.pi * 190 * t) * 0.4) * np.exp(-t * 45) * gain


def crash(dur=2.6):
    t = tt_(dur)
    return filt(white(len(t)), 'highpass', 3500) * np.exp(-t * 1.6)


def clap():
    t = tt_(0.05)
    return filt(white(len(t)), 'bandpass', [900, 4200]) * np.exp(-t * 90)


def whoosh(dur, up=True):
    t = tt_(dur)
    x = white(len(t))
    out = np.zeros(len(t))
    steps = 24
    for k in range(steps):
        a, b = k * len(t) // steps, (k + 1) * len(t) // steps
        f = 300 + 3500 * ((k / steps) if up else 1 - k / steps)
        out[a:b] = filt(x[a:b], 'bandpass', [f * 0.7, f * 1.4], 2)
    return out * np.sin(np.pi * t / dur) ** 2


# drumroll 0.1 -> 1.6, faster and louder
t = 0.1
while t < 1.58:
    p = (t - 0.1) / 1.5
    mix.add(snare(0.15 + 0.6 * p ** 1.6), t, 0.7, pan=rng.uniform(-0.2, 0.2))
    t += 0.055 - 0.02 * p
mix.add(crash(), 1.6, 0.35)
mix.add(thump(70, 40, 1.4, decay=3), 1.6, 0.9)

# fanfare: G G G C(long) on top of a C chord
for at, n, d in [(1.6, 'G4', 0.16), (1.8, 'G4', 0.16), (2.0, 'G4', 0.16), (2.2, 'C5', 0.95)]:
    mix.add(brass(note(n), d) + 0.6 * brass(note(n) / 2, d), at, 0.5)
mix.add(whoosh(0.8), 2.0, 0.12)
mix.add(ting(1568, 2.5), 2.4, 0.06)

# the title: timpani + big chord + crowd
mix.add(thump(55, 30, 2.0, decay=2, click=0.4), 3.2, 1.0)
mix.add(crash(3.2), 3.2, 0.3)
mix.add(chord(['C4', 'E4', 'G4', 'C5'], 2.2), 3.2, 0.55)
mix.add(chord(['F4', 'A4', 'C5', 'F5'], 1.2), 5.4, 0.5)
mix.add(chord(['G4', 'B4', 'D5', 'G5'], 0.8), 6.6, 0.5)
for at, n, d in [(7.4, 'C5', 0.16), (7.6, 'C5', 0.16), (7.8, 'E5', 0.16), (8.0, 'G5', 1.6)]:
    mix.add(brass(note(n), d), at, 0.45)
mix.add(chord(['C4', 'E4', 'G4', 'C5'], 2.6), 8.0, 0.55)
mix.add(thump(55, 30, 2.0, decay=2, click=0.4), 8.0, 0.8)

# applause and cheering from the title to the end
n = int(55 * (END - 3.2))
for k in range(n):
    at = 3.2 + rng.uniform(0, END - 3.3)
    swell = np.clip((at - 3.2) / 0.6, 0, 1) * np.clip((END - at) / 1.2, 0, 1)
    mix.add(clap(), at, 0.16 * swell * rng.uniform(0.5, 1.0), pan=rng.uniform(-0.8, 0.8))
crowd_t = tt_(END - 3.2)
crowd = filt(white(len(crowd_t)), 'bandpass', [300, 2200]) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * crowd_t) ** 2)
crowd *= np.clip(crowd_t / 0.5, 0, 1) * np.clip((END - 3.2 - crowd_t) / 1.5, 0, 1)
mix.add(crowd, 3.2, 0.05)
for at in (3.25, 3.35, 7.45):  # confetti cannons
    mix.add(thump(140, 70, 0.4, decay=12, click=0.8), at, 0.35, pan=-0.6)
    mix.add(thump(140, 70, 0.4, decay=12, click=0.8), at + 0.04, 0.35, pan=0.6)

# fireworks: whistle up, boom, crackle
for at, pan in zip((4.8, 6.0, 7.4), (-0.5, 0.5, 0.0)):
    wt = tt_(0.6)
    whistle = np.sin(2 * np.pi * np.cumsum(1800 + 1600 * wt / 0.6) / SR) * np.sin(np.pi * wt / 0.6)
    mix.add(whistle, at - 0.6, 0.04, pan=pan)
    mix.add(thump(60, 35, 1.2, decay=3.5, click=0.6), at, 0.7, pan=pan)
    for _ in range(40):
        mix.add(click(0.03, rng.uniform(2000, 5000)), at + 0.1 + rng.uniform(0, 1.0), 0.08, pan=pan + rng.uniform(-0.3, 0.3))

# the button
mix.add(click(0.05, 2500), 9.4, 0.5)
mix.add(ting(2093, 1.5), 9.45, 0.08)

# a hall around everything
ir_t = tt_(1.6)
ir = filt(white(len(ir_t)), 'lowpass', 5000) * np.exp(-ir_t * 3.2)
ir[: int(0.02 * SR)] = 0
for ch in ('l', 'r'):
    dry = getattr(mix, ch)
    wet = signal.fftconvolve(dry, ir)[: mix.n]
    setattr(mix, ch, dry + wet * 0.18 * np.max(np.abs(dry)) / (np.max(np.abs(wet)) + 1e-9))

print('wrote', mix.write('oneview'))
