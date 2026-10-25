"""Sound for "What if the Earth stopped spinning?" No music and no voice: only the city and the wind.

Sound effects are ElevenLabs text-to-sound clips (audio/sfx/earth/*.mp3); the heartbeat, the ear ring
and a few low hits are synthesized here. Times follow the video timeline in src/earth/time.ts:
the braking runs 8..48 s, the zero second is 48..53 (slow motion x5), the restart 53..61 (x8).

Output: public/audio/earth-stop.wav
"""

import numpy as np
from scipy import signal

from slime_lib import ROOT, SR, Mix, filt, load, thump, tt_

DUR = 66.0
SLOW_START, ZERO, RESTART, RESTORED = 8.0, 48.0, 53.0, 61.0
mix = Mix(DUR)
t = mix.t


def sfx(name, rms=0.1):
    x = load(ROOT / "audio/sfx/earth" / f"{name}.mp3")
    return x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * rms


def loop(x, dur, xfade=1.5):
    """Repeat a clip with crossfades until it is dur seconds long."""
    n, f = int(dur * SR), int(xfade * SR)
    out = np.zeros(n + len(x))
    ramp_in = np.linspace(0, 1, f)
    i = 0
    while i < n:
        seg = x.copy()
        if i > 0:
            seg[:f] *= ramp_in
        seg[-f:] *= ramp_in[::-1]
        out[i: i + len(seg)] += seg
        i += len(x) - f
    return out[:n]


def slowed(x, k):
    """Play a clip k times slower (and lower), like a slow-motion shot."""
    return signal.resample(x, int(len(x) * k))


def smooth(x, a, b):
    s = np.clip((x - a) / (b - a), 0, 1)
    return s * s * (3 - 2 * s)


# wind speed over the video (km/h), as in time.ts
lost = np.clip((t - SLOW_START) / (ZERO - SLOW_START), 0, 1) ** 2.5
wind = np.where(t < RESTART, 1280 * lost, 0.0)
braking = t < ZERO


def bed(name, rms, gain_curve, start=0.0, pan=0.0):
    x = loop(sfx(name, rms), DUR - start)
    g = gain_curve[mix.idx(start):][: len(x)]
    mix.add(x * g, start, 1.0, pan)


# ---------- the city before (and a little of it after) ----------
city_gain = 1 - smooth(wind, 40, 160)
city_gain = np.where(t > RESTORED + 1, 0.0, city_gain)
bed("city", 0.1, city_gain)

# ground rumble: starts with the braking, grows with the push, gone after the restart settles
rumble_gain = smooth(t, 8, 14) * (0.25 + 0.75 * smooth(wind, 50, 900))
rumble_gain = np.where(t >= RESTART, 0.6 * np.exp(-(t - RESTART) / 1.5), np.where(braking, rumble_gain, 0.35))
bed("rumble", 0.035, rumble_gain, pan=-0.1)

# ---------- three wind layers, each takes over as the wind grows ----------
# overall wind level rises steadily with the speed; the layers only share it out
level = (0.01 + 0.17 * (wind / 1280) ** 0.45) * smooth(wind, 1, 12) * braking
p3 = smooth(wind, 350, 750)
p2 = smooth(wind, 60, 220) * (1 - p3)
p1 = np.clip(1 - p2 - p3, 0, 1)
bed("wind1", 1.0, np.sqrt(p1) * level, pan=-0.2)
bed("wind2", 1.0, np.sqrt(p2) * level, pan=0.15)
bed("wind3", 1.0, np.sqrt(p3) * level)

# ---------- the zero second: everything slowed down, muffled, a heartbeat ----------
roar = slowed(sfx("wind3", 0.09)[: int(2.2 * SR)], 2.5)[: int((RESTART - ZERO) * SR)]
roar = filt(roar, "lowpass", 380, 4)
roar *= np.linspace(1.0, 0.75, len(roar))
roar[: int(0.12 * SR)] *= np.linspace(0, 1, int(0.12 * SR))
mix.add(roar, ZERO, 1.1)
# a short tail of the real roar so the cut into slow motion is not a hole
tail = sfx("wind3", 0.09)[: int(0.35 * SR)] * np.linspace(1, 0, int(0.35 * SR))
mix.add(tail, ZERO, 0.8)


def heartbeat():
    lub = thump(58, 36, 0.35, decay=11, click=0.05)
    dub = thump(52, 34, 0.3, decay=13, click=0.03) * 0.7
    out = np.zeros(int(0.7 * SR))
    out[: len(lub)] += lub
    out[int(0.22 * SR): int(0.22 * SR) + len(dub)] += dub
    return filt(out, "lowpass", 160, 2)


# peaks of the vignette pulse in Overlay.tsx: sin((v - 48) * pi * 1.2) = 1
for k in range(6):
    beat_t = ZERO + (0.5 + k) / 1.2
    if beat_t < RESTART - 0.2:
        mix.add(heartbeat(), beat_t - 0.05, 1.1)

# ---------- the restart: one hit, then the wind is gone at once ----------
boom = sfx("boom", 0.2)
mix.add(boom, RESTART - 0.05, 1.3)
mix.add(thump(48, 26, 3.0, decay=1.4, click=0.4), RESTART - 0.02, 1.0)
# everything left behind shoots west, slowed eight times (the debris clip is already slow)
debris = sfx("debris", 0.09)
mix.add(debris * np.linspace(1, 0.6, len(debris)), RESTART + 0.1, 1.0, pan=-0.3)
# ears ringing after the hit
ring_t = tt_(6.5)
ring = np.sin(2 * np.pi * 3650 * ring_t) * 0.6 + np.sin(2 * np.pi * 3710 * ring_t) * 0.4
ring *= np.clip(ring_t / 0.3, 0, 1) * np.exp(-ring_t / 2.2) * 0.022
mix.add(ring, RESTART + 0.25, 1.0)

# ---------- silence after: a light breeze over the empty street ----------
after = loop(filt(sfx("wind1", 0.06), "lowpass", 900, 2), DUR - (RESTART + 2))
after *= smooth(np.arange(len(after)) / SR, 0, 3.0) * 0.35
mix.add(after, RESTART + 2)

# ---------- events ----------
HITS = [
    # (clip, time of its loudest moment in the video, clip's own peak time, gain, pan)
    ("tires", 9.7, 0.65, 0.5, 0.3),     # the traffic brakes as the push starts
    ("cups", 16.6, 0.75, 0.9, 0.2),     # the coffee cups skid off the café tables
    ("bus", 23.05, 0.15, 1.1, -0.1),    # the bus lands on its side
    ("cars", 26.6, 0.5, 1.0, -0.2),     # parked cars start to slide
    ("glass", 29.4, 0.05, 1.1, -0.3),   # the windows of towers A and B blow out
    ("glass", 35.0, 0.05, 0.5, 0.3),    # more glass, further away
    ("crane", 33.6, 1.5, 1.2, 0.2),     # the crane goes over
    ("boom", 39.2, 0.1, 0.45, 0.25),    # the low row comes apart
    ("boom", 41.6, 0.1, 0.4, -0.25),
    ("boom", 43.0, 0.1, 0.55, 0.1),     # the rooms of tower C blow out
    ("glass", 43.1, 0.05, 0.45, -0.1),
    ("boom", 45.8, 0.1, 0.5, -0.1),
    ("neon", 63.55, 0.25, 0.7, 0.2),    # the M sign flickers back on
]
for name, at, peak, gain, pan in HITS:
    x = sfx(name, 0.12)
    # events drown in the storm otherwise: lift them a little as the wind grows
    lift = 1 + 0.6 * np.interp(at, t, smooth(wind, 200, 1000))
    mix.add(x, at - peak, gain * lift, pan)

# a deep hit for each building that gives way
for at in (38.6, 40.4, 44.2, 46.6):
    mix.add(thump(42, 24, 1.6, decay=2.0, click=0.2), at, 0.5)



def write_linear(name, target_lufs=-15.0):
    """Like Mix.write, but one plain gain change: loudnorm would squash the build-up from calm to storm."""
    import json
    import subprocess
    import wave

    def save(path, x):
        with wave.open(str(path), "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())

    def lufs(path):
        err = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "loudnorm=print_format=json", "-f", "null", "-"],
                             capture_output=True, text=True, check=True).stderr
        return float(json.loads(err[err.rindex("{"): err.rindex("}") + 1])["input_i"])

    x = np.stack([mix.l, mix.r], axis=1)
    x = filt(x.T, "highpass", 25, 2).T
    x = x / np.max(np.abs(x)) * 0.5
    final = ROOT / "public" / "audio" / f"{name}.wav"
    for _ in range(4):
        save(final, np.tanh(x * 1.1) / 1.1)
        x = x * 10 ** ((target_lufs - lufs(final)) / 20)
    y = np.tanh(x * 1.1) / 1.1  # soft limit the few hits that go over
    save(final, y * min(1.0, 0.89 / np.max(np.abs(y))))
    return final


final = write_linear("earth-stop")
print(f"wrote {final} ({DUR} s)")
