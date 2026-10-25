"""Sound for "What if gravity kept getting stronger?" No music and no voice: the seaside, then things giving way.

Sound effects are ElevenLabs text-to-sound clips (audio/sfx/grow/*.mp3); the ground rumble, the deep hits and
the space drone are synthesized here. Times follow the video timeline in src/grow/time.ts. Frame 0 of the video
is the cover, so the whole story starts one frame (1/30 s) late; OFF adds that frame to every time below.

Output: public/audio/gravity-grow.wav
"""

import numpy as np
from scipy.interpolate import PchipInterpolator

from slime_lib import ROOT, SR, Mix, brown, filt, thump, load

OFF = 1 / 30
DUR = 66.0 + OFF
SPACE, BLACK_HOLE = 46.0, 58.0
mix = Mix(DUR)
t = mix.t
v = t - OFF  # story time

# gravity over the video, same keys as gAt in time.ts (monotone cubic on log10 g)
KEYS = [(0, 1), (8, 1), (16, 1.5), (22, 3), (28, 6), (33, 12), (38, 40), (42, 150), (46, 1500), (50, 3e4), (54, 2e6), (58, 7.18e8)]
log_g = PchipInterpolator([k[0] for k in KEYS], [np.log10(k[1]) for k in KEYS])(np.clip(v, 0, 58))


def sfx(name, rms=0.1, a=None, b=None):
    x = load(ROOT / "audio/sfx/grow" / f"{name}.mp3")
    if a is not None or b is not None:
        x = x[int((a or 0) * SR): int(b * SR) if b else None].copy()
        f = int(0.02 * SR)
        x[:f] *= np.linspace(0, 1, f)
        x[-f:] *= np.linspace(1, 0, f)
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


def smooth(x, a, b):
    s = np.clip((x - a) / (b - a), 0, 1)
    return s * s * (3 - 2 * s)


def at(sec):
    """Story second -> audio second."""
    return sec + OFF


# ---------- the seaside: waves and gulls, calming as the waves flatten ----------
sea = loop(sfx("seaside", 0.1), DUR)
sea_gain = smooth(v, -1, 0.8) * (1 - smooth(v, 19, 27)) / np.maximum(1, 10 ** log_g) ** 0.35
mix.add(sea * sea_gain, 0, 1.0)

# ---------- the ground: a rumble that grows and drops in pitch as gravity climbs ----------
noise = brown(mix.n)
noise /= np.sqrt(np.mean(noise ** 2)) + 1e-9
hi = filt(noise, "lowpass", 260, 2)
lo = filt(noise, "lowpass", 85, 2)
deep = smooth(log_g, 0.6, 1.6)  # 4 g .. 40 g: the rumble sinks into the low layer
level = 0.11 * (0.25 * smooth(log_g, 0.1, 0.6) + 0.75 * smooth(log_g, 0.5, 1.9)) * (1 - smooth(v, 42, 45.95))  # muffled away as the air thins
rumble = (hi * (1 - deep) + lo * (0.6 + deep)) * level
# a sub tone that slides down from 55 Hz to 28 Hz
f_sub = 55 - 27 * smooth(log_g, 0.4, 3.0)
sub = np.sin(2 * np.pi * np.cumsum(f_sub) / SR) * 0.05 * smooth(log_g, 0.4, 1.4) * (1 - smooth(v, 43, 45.95))
mix.add(rumble + sub, 0, 1.0)
# while the camera climbs out of the thin air: a rising rush, cut by the white flash at 46 s
rush = filt(noise, "bandpass", [180, 1400], 2) * smooth(v, 42.5, 45.9) ** 2 * 0.16 * (v < SPACE)
mix.add(rush, 0, 1.0)

# ---------- space: no air, only a low drone that swells as the planet darkens; silence after the black hole ----------
drone_t = v - SPACE
drone = (np.sin(2 * np.pi * 36 * t) + 0.5 * np.sin(2 * np.pi * 72.4 * t) + 0.35 * np.sin(2 * np.pi * 108.9 * t) + 1.4 * filt(noise, "bandpass", [60, 240], 2))
drone *= (0.03 + 0.05 * smooth(v, 50, 57.8)) * smooth(drone_t, 0, 0.6) * (v >= SPACE) * (1 - smooth(v, BLACK_HOLE - 0.1, BLACK_HOLE + 0.05))
mix.add(drone, 0, 1.0)
mix.add(thump(46, 22, 4.0, decay=0.9, click=0.1), at(BLACK_HOLE), 0.5)  # the last hit, then nothing

# ---------- events ----------
# (clip, story time of its loudest moment, its own peak time, gain, pan, cut start, cut end)
HITS = [
    ("splat", 10.18, 0.16, 0.5, 0.2, None, None),      # the scoop hits the ground
    ("balls", 11.95, 0.15, 0.4, -0.25, 0, 0.6),        # the juggler's balls land
    ("balls", 12.29, 0.15, 0.35, -0.3, 0, 0.6),
    ("balls", 12.59, 0.15, 0.35, -0.2, 0, 0.6),
    ("plane", 21.4, 4.29, 0.55, 0.3, None, None),      # the airliner sinks towards the mountains
    ("coaster", 19.6, 1.84, 0.7, 0.35, None, None),    # the train rolls back down the lift hill
    ("creak", 23.0, 2.13, 1.0, -0.2, None, None),      # signs and balconies start to give
    ("creak", 25.2, 2.13, 0.9, 0.25, None, None),
    ("houses", 29.4, 1.77, 1.0, -0.15, None, None),    # the houses fold
    ("wheel", 32.2, 0.94, 1.0, -0.2, 0, 2.8),          # the wheel buckles and rolls
    ("wheel", 33.96, 0.7, 0.9, -0.3, 2.8, None),       # ...and hits the sea
    ("cables", 34.1, 0.5, 0.9, 0.0, 0, 2.4),           # the first cables snap
    ("cables", 34.9, 0.6, 1.0, 0.1, 2.4, None),        # the deck tears and drops
    ("avalanche", 37.4, 1.47, 1.1, 0.2, None, None),   # the mountains shed their snow
    ("core", 52.3, 2.07, 0.5, 0.0, None, None),        # the Moon is torn apart, the planet groans
]
for name, peak_at, peak, gain, pan, a, b in HITS:
    x = sfx(name, 0.12, a, b)
    start = at(peak_at) - peak
    if start < 0:
        x, start = x[int(-start * SR):], 0.0
    mix.add(x, start, gain, pan)

# a deep hit for each big thing that lands
for sec, g in ((29.1, 0.45), (29.9, 0.4), (30.6, 0.35), (31.9, 0.55), (33.96, 0.6), (35.87, 0.6), (36.52, 0.45), (37.2, 0.5)):
    mix.add(thump(44, 24, 1.8, decay=1.8, click=0.25), at(sec), g)


def write_linear(name, target_lufs=-15.0):
    """Like Mix.write, but one plain gain change: loudnorm would squash the build-up."""
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
    x = filt(x.T, "highpass", 22, 2).T
    x = x / np.max(np.abs(x)) * 0.5
    final = ROOT / "public" / "audio" / f"{name}.wav"
    for _ in range(4):
        save(final, np.tanh(x * 1.1) / 1.1)
        x = x * 10 ** ((target_lufs - lufs(final)) / 20)
    y = np.tanh(x * 1.1) / 1.1  # soft limit the few hits that go over
    save(final, y * min(1.0, 0.89 / np.max(np.abs(y))))
    return final


final = write_linear("gravity-grow")
print(f"wrote {final} ({DUR:.2f} s)")
