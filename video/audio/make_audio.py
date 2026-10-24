"""Builds the soundtrack for "What if the air disappeared for 5 seconds?".

Everything is synthesized here (no samples), so the sound is fully original.
Timeline (video seconds) matches src/timeline.ts:
  0-12   calm backyard: breeze, birds, grill, light music, countdown ticks, riser
  12     the air vanishes: one muffled hit, then silence
  12-57  vacuum in slow motion: low drone, ear ringing, heartbeat, dark pad, felt-not-heard hits
  57     the air slams back: boom and a rush of wind
  57-68  muffled aftermath: gasps, wind, distant car alarms, ringing ears, soft ending
Output: public/audio/air-gone.wav (48 kHz stereo), loudness-normalized for TikTok/Shorts.
"""

import json
import subprocess
import wave
from pathlib import Path

import numpy as np
from scipy import signal

SR = 48000
DUR = 68.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)

AIR_GONE = 12.0
AIR_BACK = 57.0

out_l = np.zeros(N)
out_r = np.zeros(N)


def idx(sec):
    return int(np.clip(sec * SR, 0, N))


def add(sig, start=0.0, gain=1.0, pan=0.0):
    """Mix a mono signal into the stereo bus at `start` seconds. pan -1..1."""
    i = idx(start)
    n = min(len(sig), N - i)
    if n <= 0:
        return
    lg = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
    rg = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
    out_l[i : i + n] += sig[:n] * gain * lg
    out_r[i : i + n] += sig[:n] * gain * rg


def sos_filter(x, kind, freq, order=4):
    sos = signal.butter(order, freq, btype=kind, fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def white(n):
    return rng.standard_normal(n)


def pink(n):
    # Paul Kellet's economy pinking filter
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b, a, white(n)) * 4


def brown(n):
    x = np.cumsum(white(n))
    x = sos_filter(x, "highpass", 20, 2)
    return x / (np.max(np.abs(x)) + 1e-9)


def segment_env(start, end, fade_in=0.5, fade_out=0.5):
    """Envelope over the whole timeline that is 1 between start and end with linear fades."""
    e = np.clip((t - start) / max(fade_in, 1e-4), 0, 1) * np.clip((end - t) / max(fade_out, 1e-4), 0, 1)
    return e


def note(freq):
    return 440.0 * 2 ** ((freq - 69) / 12)


def pad(freqs, dur, detune=0.25, bright=0.3):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for d in (-detune, detune):
            ph = rng.uniform(0, 2 * np.pi)
            s += np.sin(2 * np.pi * (f + d) * tt + ph)
            s += bright * signal.sawtooth(2 * np.pi * (f + d) * tt + ph, 0.5) * 0.5
    return s / (len(freqs) * 2)


def pluck(freq, dur=1.2):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * freq * tt) + 0.35 * np.sin(4 * np.pi * freq * tt) + 0.12 * np.sin(6 * np.pi * freq * tt))
    return s * np.exp(-tt * 3.2) * np.clip(tt / 0.005, 0, 1)


def thump(f0=60, f1=32, dur=1.0, decay=4.0, click=0.15):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-tt * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    # upper harmonics so the hit is still heard on phone speakers
    s = (np.sin(ph) + 0.55 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)) * np.exp(-tt * decay)
    nz = sos_filter(white(n), "bandpass", [80, 900]) * np.exp(-tt * 28) * click * 1.6
    return s + nz


# ---------------------------------------------------------------- calm part (0-12)

calm = segment_env(0, AIR_GONE, 0.8, 0.002)

# breeze: dies down between 6 and 9 seconds
wind = sos_filter(pink(N), "lowpass", 700) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * t))
wind_amt = 1 - 0.75 * np.clip((t - 6) / 3, 0, 1)
add(wind * calm * wind_amt, gain=0.05, pan=-0.1)

# birds: chirps thin out after 7 s, nothing after 10.5 s
bird_times = []
tt0 = 0.3
while tt0 < 10.5:
    bird_times.append(tt0)
    tt0 += rng.uniform(0.35, 1.0) if tt0 < 7 else rng.uniform(1.0, 2.0)
for bt in bird_times:
    pan = rng.uniform(-0.8, 0.8)
    base = rng.uniform(2600, 4200)
    for k in range(rng.integers(1, 4)):
        d = rng.uniform(0.05, 0.12)
        n = int(d * SR)
        tt = np.arange(n) / SR
        f = base * (1 + 0.35 * tt / d) + 180 * np.sin(2 * np.pi * 38 * tt)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2
        add(s, bt + k * rng.uniform(0.09, 0.16), gain=0.05, pan=pan)

# grill sizzle with crackles
sizzle = sos_filter(white(N), "highpass", 3500) * (0.5 + 0.5 * np.abs(sos_filter(white(N), "lowpass", 6)) * 3)
crack = (rng.random(N) > 0.9993) * rng.uniform(0.5, 1.0, N)
crack = sos_filter(crack, "highpass", 1500) * 3
add((sizzle * 0.02 + crack * 0.04) * calm, pan=-0.35)

# distant airplane
plane = sos_filter(brown(N), "lowpass", 260) * np.clip(t / 6, 0.3, 1)
add(plane * calm, gain=0.12, pan=0.4)

# light music: soft pad + plucked arpeggio, darkening after 6 s
chords = [
    (0.0, [60, 64, 67, 71]),  # Cmaj7
    (3.0, [57, 60, 64, 67]),  # Am7
    (6.0, [53, 57, 60, 64]),  # Fmaj7
    (9.0, [55, 58, 62, 65]),  # Gm7 - a little uneasy before the event
]
for start, ch in chords:
    p = pad([note(m - 12) for m in ch], 3.4, bright=0.15)
    e = np.minimum(1, np.arange(len(p)) / (0.6 * SR)) * np.minimum(1, (len(p) - np.arange(len(p))) / (0.4 * SR))
    add(p * e, start, gain=0.07)
    for k in range(6):
        m = ch[k % len(ch)] + (12 if k >= 4 else 0)
        add(pluck(note(m)), start + k * 0.5, gain=0.045 * (1 - 0.5 * (start >= 6)), pan=0.25 * np.sin(k))

# countdown ticks (number changes at 3..11 s), last three louder and higher
for s_ in range(3, 12):
    last = s_ >= 9
    n = int(0.05 * SR)
    tt = np.arange(n) / SR
    f = 2400 if last else 1800
    tick = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 90) + sos_filter(white(n), "highpass", 4000) * np.exp(-tt * 200) * 0.4
    add(tick, s_, gain=0.22 if last else 0.12)

# riser 9 -> 12 s, cut dead at 12
n = int(3.0 * SR)
tt = np.arange(n) / SR
rise_env = (tt / 3.0) ** 2.2
f = 180 * 2 ** (tt * 1.3)
riser = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + sos_filter(white(n), "bandpass", [600, 5000]) * 0.6
add(riser * rise_env, 9.0, gain=0.2)

# ---------------------------------------------------------------- the air vanishes (12)

add(thump(70, 30, 1.0, decay=7, click=0.4), AIR_GONE, gain=0.75)
# total silence 12.6-13.0, then the vacuum bed creeps in

# ---------------------------------------------------------------- vacuum (12-57)

vac = segment_env(13.0, AIR_BACK, 2.5, 0.002)
grow = np.clip((t - 13) / (AIR_BACK - 13), 0, 1)

drone = np.zeros(N)
for f, a in ((41.2, 0.5), (41.5, 0.4), (61.7, 0.5), (82.4, 0.55), (123.5, 0.4), (164.8, 0.25), (247.0, 0.12)):
    drone += a * np.sin(2 * np.pi * f * t)
drone += 1.2 * sos_filter(brown(N), "lowpass", 140)
drone *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * t)
add(drone * vac * (0.5 + 0.7 * grow), gain=0.05)

# ringing in the ears
ring = np.sin(2 * np.pi * 7200 * t) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.3 * t))
add(ring * segment_env(13.5, AIR_BACK, 3.0, 0.002), gain=0.006)

# heartbeat from inside the body, speeding up towards the end
hb_t = 14.0
while hb_t < AIR_BACK - 0.3:
    k = (hb_t - 14) / (AIR_BACK - 14)
    g = 0.2 + 0.2 * k
    add(thump(62, 38, 0.35, decay=16, click=0.25), hb_t, gain=g)
    add(thump(55, 36, 0.3, decay=18, click=0.15), hb_t + 0.26, gain=g * 0.65)
    hb_t += 1.35 - 0.6 * k

# dark slow pad, one chord per lost second
dark = [
    (13.0, [45, 52, 59]),  # A
    (21.0, [41, 48, 57]),  # F
    (30.0, [38, 45, 53]),  # D minor
    (39.0, [40, 47, 56]),  # E (major third, tension)
    (48.0, [45, 52, 60]),  # A minor
]
for i, (start, ch) in enumerate(dark):
    end = dark[i + 1][0] if i + 1 < len(dark) else AIR_BACK
    d = end - start + 1.5
    p = pad([note(m) for m in ch], d, detune=0.4, bright=0.45)
    p = sos_filter(p, "lowpass", 700 + 120 * i)
    e = np.minimum(1, np.arange(len(p)) / (2.0 * SR)) * np.minimum(1, (len(p) - np.arange(len(p))) / (1.5 * SR))
    if end >= AIR_BACK:
        e[int((AIR_BACK - start) * SR) :] = 0
    add(p * e, start, gain=0.06 + 0.012 * i)

# high glassy pad above the drone: the "frozen time" shimmer, audible on phone speakers
for i, (start, ch) in enumerate(dark):
    end = dark[i + 1][0] if i + 1 < len(dark) else AIR_BACK
    d = end - start + 2.0
    n = int(d * SR)
    tt = np.arange(n) / SR
    g = np.zeros(n)
    for m in ch:
        f = note(m + 24)
        g += np.sin(2 * np.pi * f * tt + 0.8 * np.sin(2 * np.pi * 0.21 * tt)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.17 * tt + m))
    g = sos_filter(g, "lowpass", 2500) / len(ch)
    e = np.minimum(1, tt / 2.5) * np.minimum(1, (d - tt) / 2.0)
    if end >= AIR_BACK:
        e[int((AIR_BACK - start) * SR) :] = 0
    add(g * e, start, gain=0.065 + 0.015 * i, pan=0.3 * (-1) ** i)

# felt-not-heard hits on each event
for et, g in ((26.5, 0.45), (30.2, 0.3), (40.5, 0.55), (41.2, 0.3), (43.8, 0.25)):
    add(thump(55, 30, 1.4, decay=3.2, click=0.3), et, gain=g * 0.55)

# reverse swell into the return
n = int(2.4 * SR)
tt = np.arange(n) / SR
sw_env = (tt / 2.4) ** 3
f = 120 * 2 ** (tt * 1.6)
swell = sos_filter(white(n), "bandpass", [300, 6000]) * 0.7 + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4
add(swell * sw_env, AIR_BACK - 2.4, gain=0.3)

# ---------------------------------------------------------------- the air comes back (57)

add(thump(65, 28, 3.0, decay=1.4, click=0.8), AIR_BACK, gain=0.85)
n = int(5.0 * SR)
tt = np.arange(n) / SR
rush_env = np.clip(tt / 0.08, 0, 1) * np.exp(-tt * 0.9)
rush = sos_filter(pink(n), "bandpass", [200, 3500]) * rush_env
add(rush, AIR_BACK, gain=0.28, pan=-0.3)
add(sos_filter(pink(n), "bandpass", [150, 2500]) * rush_env, AIR_BACK + 0.05, gain=0.24, pan=0.3)

# ---------------------------------------------------------------- muffled aftermath (57-68)

after = segment_env(AIR_BACK + 0.4, DUR, 1.5, 2.5)
muffle_bus = np.zeros(N)

# gasps: three people breathing in hard
for gt, f0 in ((57.45, 900), (57.95, 1300), (58.9, 1100), (59.6, 950)):
    n = int(0.55 * SR)
    tt = np.arange(n) / SR
    e = np.clip(tt / 0.4, 0, 1) ** 1.5 * np.clip((0.55 - tt) / 0.05, 0, 1)
    g = sos_filter(white(n), "bandpass", [f0 * 0.6, f0 * 2.4]) * e
    i = idx(gt)
    muffle_bus[i : i + n] += g * 0.5

# breeze back
muffle_bus += sos_filter(pink(N), "lowpass", 600) * after * 0.06

# birds flying off, a few chirps
for bt in (58.6, 59.1, 59.3, 60.4, 61.8):
    n = int(0.09 * SR)
    tt = np.arange(n) / SR
    f = 3000 * (1 + 0.3 * tt / 0.09)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.09) ** 2
    i = idx(bt)
    muffle_bus[i : i + n] += s * 0.06

# distant car alarms
alarm1 = np.where((t * 3.3) % 1 < 0.5, 1.0, -1.0) * np.sign(np.sin(2 * np.pi * np.where((t * 3.3) % 2 < 1, 720, 960) * t))
alarm2 = np.sign(np.sin(2 * np.pi * np.cumsum(850 + 350 * np.sin(2 * np.pi * 1.4 * t)) / SR))
muffle_bus += sos_filter(alarm1, "lowpass", 1400) * segment_env(59.2, DUR, 0.8, 3) * 0.018
muffle_bus += sos_filter(alarm2, "lowpass", 1400) * segment_env(60.6, DUR, 0.8, 3) * 0.014

# everything sounds like through cotton: damaged eardrums
muffled = sos_filter(muffle_bus, "lowpass", 900, 2)
add(muffled, 0, gain=2.6)

# ringing after the event
add(np.sin(2 * np.pi * 4200 * t) * segment_env(57.3, 65, 0.3, 4.0), gain=0.012)

# soft ending pad
end_ch = [57, 60, 64, 69]  # A minor, open
p = pad([note(m - 12) for m in end_ch], 10.5, detune=0.3, bright=0.2)
e = np.minimum(1, np.arange(len(p)) / (2.5 * SR)) * np.minimum(1, (len(p) - np.arange(len(p))) / (2.5 * SR))
add(sos_filter(p, "lowpass", 1500) * e, 58.5, gain=0.15)
for k, m in enumerate((69, 64, 60, 57)):
    add(pluck(note(m), 2.0), 63.2 + k * 0.9, gain=0.08, pan=-0.2 + 0.15 * k)

# ---------------------------------------------------------------- master

mix = np.stack([out_l, out_r], axis=1)
mix = sos_filter(mix.T, "highpass", 25, 2).T
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.3) / np.tanh(1.3) * 0.9
# keep the cut at 12 s truly silent for half a second
i0, i1 = idx(AIR_GONE + 0.62), idx(13.0)
mix[i0:i1] *= np.linspace(1, 0, i1 - i0)[:, None] ** 4

root = Path(__file__).resolve().parent.parent
raw = root / "audio" / "air-gone-raw.wav"
final = root / "public" / "audio" / "air-gone.wav"
final.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(raw), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())

# Loudness for social platforms (about -14 LUFS, true peak -1.5 dB), two passes so the gain is
# constant and the quiet vacuum part stays quiet.
target = "I=-14:TP=-1.5:LRA=20"
probe = subprocess.run(
    ["ffmpeg", "-hide_banner", "-i", str(raw), "-af", f"loudnorm={target}:print_format=json", "-f", "null", "-"],
    capture_output=True, text=True, check=True,
).stderr
m = json.loads(probe[probe.rindex("{") : probe.rindex("}") + 1])
measured = (
    f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
    f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
)
subprocess.run(
    ["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", f"loudnorm={target}:{measured}", "-ar", str(SR), str(final)],
    check=True,
)
raw.unlink()
print(f"wrote {final}")
