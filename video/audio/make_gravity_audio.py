"""Builds the soundtrack for "What if gravity flipped for 10 seconds?".

Everything is synthesized here (no samples). Times are video seconds and match src/gravity/time.ts:
  0-7    busy square: traffic, crowd, pigeons, crossing beeper, fountain, light music, countdown, riser
  7      the flip: reversed swell cut by a deep boom, screams, slow motion muffles everything
  7-37   flight: driving pulse that builds, wind, car alarms flying away, trees tearing, heartbeat
  37     gravity back: thud, bodies landing, the music drops out
  40-47  hang time 440 m up: thin wind, eerie high pad, near silence
  47-52  everything falls: bomb whistles, riser, double-time drums
  52-57  impacts in slow motion: booms, crushed metal, glass, a water bomb, cracking trees
  57-65  aftermath: car alarms, sirens, dripping water, settling debris, soft ending
Output: public/audio/gravity-flip.wav (48 kHz stereo), loudness-normalized for TikTok/Shorts.
"""

import json
import subprocess
import wave
from pathlib import Path

import numpy as np
from scipy import signal

SR = 48000
DUR = 65.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(11)

FLIP = 7.0
RESTORE = 37.0
LAND = 38.5
# impact moments in video seconds (world impacts mapped through the x2.5 slow motion at 52-57 s)
HITS = {
    "side": 52.25, "tree1": 52.5, "cart": 52.75, "water": 53.0, "pile1": 53.25, "fcar": 54.0,
    "pile2": 54.375, "tree2": 54.75, "taxi": 55.125, "pile3": 55.375, "bus": 55.8,
}

out_l = np.zeros(N)
out_r = np.zeros(N)


def idx(sec):
    return int(np.clip(sec * SR, 0, N))


def add(sig, start=0.0, gain=1.0, pan=0.0):
    i = idx(start)
    n = min(len(sig), N - i)
    if n <= 0:
        return
    lg = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
    rg = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
    out_l[i : i + n] += sig[:n] * gain * lg
    out_r[i : i + n] += sig[:n] * gain * rg


def filt(x, kind, freq, order=4):
    return signal.sosfilt(signal.butter(order, freq, btype=kind, fs=SR, output="sos"), x)


def white(n):
    return rng.standard_normal(n)


def pink(n):
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b, a, white(n)) * 4


def brown(n):
    x = np.cumsum(white(n))
    x = filt(x, "highpass", 20, 2)
    return x / (np.max(np.abs(x)) + 1e-9)


def env(start, end, fi=0.5, fo=0.5):
    return np.clip((t - start) / max(fi, 1e-4), 0, 1) * np.clip((end - t) / max(fo, 1e-4), 0, 1)


def note(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt_(dur):
    return np.arange(int(dur * SR)) / SR


def pad(freqs, dur, detune=0.3, bright=0.3):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for f in freqs:
        for d in (-detune, detune):
            ph = rng.uniform(0, 2 * np.pi)
            s += np.sin(2 * np.pi * (f + d) * tt + ph) + bright * 0.5 * signal.sawtooth(2 * np.pi * (f + d) * tt + ph, 0.5)
    fade = np.minimum(1, tt / 0.4) * np.minimum(1, (dur - tt) / 0.4)
    return s / (len(freqs) * 2) * fade


def pluck(freq, dur=1.0):
    tt = tt_(dur)
    s = np.sin(2 * np.pi * freq * tt) + 0.35 * np.sin(4 * np.pi * freq * tt) + 0.12 * np.sin(6 * np.pi * freq * tt)
    return s * np.exp(-tt * 3.5) * np.clip(tt / 0.005, 0, 1)


def thump(f0=60, f1=32, dur=1.0, decay=4.0, click=0.15):
    tt = tt_(dur)
    f = f1 + (f0 - f1) * np.exp(-tt * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = (np.sin(ph) + 0.55 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)) * np.exp(-tt * decay)
    return s + filt(white(len(tt)), "bandpass", [80, 900]) * np.exp(-tt * 28) * click * 1.6


def hat(dur=0.08):
    tt = tt_(dur)
    return filt(white(len(tt)), "highpass", 7000) * np.exp(-tt * 60)


def metal(dur=1.6, base=180):
    """Crushed car: noise crunch plus inharmonic ringing partials."""
    tt = tt_(dur)
    crunch = filt(white(len(tt)), "bandpass", [250, 3500]) * np.exp(-tt * 9)
    ring = sum(np.sin(2 * np.pi * base * r * tt + rng.uniform(0, 6)) * np.exp(-tt * (3 + r)) for r in (1, 1.47, 2.09, 2.76, 3.9))
    rattle = filt((rng.random(len(tt)) > 0.997) * 1.0, "highpass", 1500) * 4 * np.exp(-tt * 3)
    return crunch * 0.9 + ring * 0.12 + rattle * 0.5


def glass(dur=1.4):
    tt = tt_(dur)
    s = filt(white(len(tt)), "highpass", 3000) * np.exp(-tt * 12) * 0.8
    for _ in range(26):
        st = rng.uniform(0, 0.6)
        f = rng.uniform(2500, 7500)
        k = tt >= st
        s[k] += np.sin(2 * np.pi * f * (tt[k] - st)) * np.exp(-(tt[k] - st) * rng.uniform(15, 40)) * 0.25
    return s


def crack(dur=1.2):
    """Wood tearing: dense crackles that thin out."""
    tt = tt_(dur)
    dens = 0.985 + 0.014 * (tt / dur)
    c = (rng.random(len(tt)) > dens) * rng.uniform(0.5, 1, len(tt))
    return filt(c, "bandpass", [400, 4000]) * 5 * np.exp(-tt * 1.5) + filt(white(len(tt)), "lowpass", 300) * np.exp(-tt * 6) * 0.4


def whoosh(dur=1.5, lo=300, hi=3000):
    tt = tt_(dur)
    e = np.sin(np.pi * tt / dur) ** 2
    s = filt(pink(len(tt)), "bandpass", [lo, hi])
    return s * e


# ---------------------------------------------------------------- busy square (0-7)

calm = env(0, FLIP, 0.6, 0.003)
add(filt(brown(N), "lowpass", 180) * calm, gain=0.25)  # city rumble
crowd = filt(pink(N), "bandpass", [280, 2200]) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.4 * t) * np.sin(2 * np.pi * 0.23 * t))
add(crowd * calm, gain=0.05, pan=-0.2)
add(filt(white(N), "highpass", 2500) * calm, gain=0.012, pan=0.3)  # fountain

# cars passing by, each a short filtered swell moving left to right
for st, pan in ((0.2, -0.6), (1.6, 0.5), (3.1, -0.3), (4.4, 0.6), (5.6, -0.5)):
    w_ = whoosh(2.2, 120, 1400)
    add(w_, st, gain=0.16, pan=pan)

# bus brakes and engine idling as it pulls into the stop
add(filt(white(int(1.0 * SR)), "bandpass", [2500, 4200]) * np.linspace(0, 1, int(1.0 * SR)) ** 2 * np.exp(-np.linspace(0, 1, int(1.0 * SR)) * 0.5), 4.2, gain=0.05, pan=0.4)
idle = np.sin(2 * np.pi * 38 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 12 * t))
add(filt(idle, "lowpass", 200) * env(4.8, FLIP, 0.5, 0.003), gain=0.08, pan=0.3)

# crossing beeper
for k in range(int(FLIP / 0.5)):
    st = 0.25 + k * 0.5
    tt = tt_(0.05)
    add(np.sin(2 * np.pi * 2900 * tt) * np.exp(-tt * 40), st, gain=0.035, pan=0.5)

# pigeons
for st in (0.8, 2.3, 3.7, 5.2):
    tt = tt_(0.6)
    f = 520 + 90 * np.sin(2 * np.pi * 7 * tt)
    add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.6) ** 2, st, gain=0.03, pan=-0.4)

# light music
for st, ch in ((0.0, [60, 64, 67, 72]), (2.0, [57, 60, 64, 69]), (4.0, [53, 57, 60, 65]), (6.0, [55, 59, 62, 67])):
    add(pad([note(m - 12) for m in ch], 2.3, bright=0.15), st, gain=0.06)
    for k in range(8):
        add(pluck(note(ch[k % 4] + (12 if k % 3 == 2 else 0)), 0.8), st + k * 0.25, gain=0.035, pan=0.2 * np.sin(k))

# countdown ticks 3..6 s, a louder one each second
for s_ in range(3, 7):
    tt = tt_(0.05)
    last = s_ >= 4
    add(np.sin(2 * np.pi * (2400 if last else 1800) * tt) * np.exp(-tt * 90), s_, gain=0.22 if last else 0.12)

# reversed swell into the flip, cut dead
tt = tt_(3.0)
sw = (filt(white(len(tt)), "bandpass", [500, 7000]) * 0.6 + np.sin(2 * np.pi * np.cumsum(150 * 2 ** (tt * 1.4)) / SR) * 0.4) * (tt / 3.0) ** 2.5
add(sw, FLIP - 3.0, gain=0.24)

# ---------------------------------------------------------------- the flip (7)

tt = tt_(3.0)
f = 90 * np.exp(-tt * 1.2) + 22
boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.1) + 0.5 * np.sin(4 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2)
add(boom, FLIP, gain=0.75)
add(thump(70, 30, 1.2, decay=3, click=0.6), FLIP, gain=0.5)
add(whoosh(2.5, 200, 2500), FLIP + 0.1, gain=0.35, pan=0.2)

# muffled screams across the square in the x6 slow motion
for st, f0, pan in ((7.4, 300, -0.5), (7.7, 380, 0.4), (8.1, 260, -0.2), (8.6, 420, 0.6), (9.2, 330, -0.6), (10.0, 290, 0.2)):
    tt = tt_(2.2)
    f = f0 * (1 - 0.25 * tt / 2.2) * (1 + 0.02 * np.sin(2 * np.pi * 5 * tt))
    voice = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR)
    v_ = filt(voice, "bandpass", [600, 1300]) + 0.5 * filt(voice, "bandpass", [2000, 2800])
    add(filt(v_, "lowpass", 1800) * np.sin(np.pi * tt / 2.2) ** 1.5, st, gain=0.06, pan=pan)

# ---------------------------------------------------------------- flight (7-37)

fly = env(FLIP + 0.5, RESTORE, 2.0, 0.003)
grow = np.clip((t - FLIP) / (RESTORE - FLIP), 0, 1)
# wind that keeps rising
wind = filt(pink(N), "bandpass", [250, 2600]) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t + 1))
add(wind * fly * (0.4 + 0.8 * grow), gain=0.06, pan=-0.15)
add(filt(white(N), "bandpass", [900, 1800]) * fly * grow, gain=0.02, pan=0.3)

# pulse: kick on every beat from 10.5 s, bass ostinato, hats from 16 s, all building to 37 s
BEAT = 0.6
bass_notes = [45, 45, 48, 45, 43, 43, 41, 40]
k = 0
bt = 10.5
while bt < RESTORE - 0.05:
    prog = (bt - 10.5) / (RESTORE - 10.5)
    add(thump(58, 34, 0.45, decay=9, click=0.3), bt, gain=0.13 + 0.12 * prog)
    m = bass_notes[k % len(bass_notes)]
    tt = tt_(BEAT * 0.9)
    b = signal.sawtooth(2 * np.pi * note(m - 12) * tt) * np.exp(-tt * 3)
    add(filt(b, "lowpass", 300 + 500 * prog), bt, gain=0.1 + 0.06 * prog)
    if bt > 16:
        add(hat(), bt + BEAT / 2, gain=0.05 + 0.05 * prog, pan=0.3)
    if bt > 25:
        add(hat(0.05), bt + BEAT / 4, gain=0.03 + 0.04 * prog, pan=-0.3)
        add(hat(0.05), bt + 3 * BEAT / 4, gain=0.03 + 0.04 * prog, pan=-0.3)
    k += 1
    bt += BEAT
# string pad, one chord every 4 beats
chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [52, 56, 59]]
st = 10.5
i = 0
while st < RESTORE - 0.3:
    dur = min(4 * BEAT * 2, RESTORE - st)
    p = pad([note(m) for m in chords[i % 4]], dur + 0.4, detune=0.5, bright=0.5)
    p = filt(p, "lowpass", 900 + 60 * i)
    cut = int(min(len(p), (RESTORE - st) * SR))
    p[cut:] = 0
    add(p, st, gain=0.07 + 0.005 * i)
    st += 4 * BEAT * 2
    i += 1

# car alarms dragged up into the sky, getting fainter and duller
for st, pan, f0 in ((11.5, 0.5, 900), (13.5, -0.4, 760), (16.0, 0.2, 1050)):
    dur = RESTORE - st
    tt = tt_(dur)
    a = np.sign(np.sin(2 * np.pi * np.where((tt * 3.0) % 2 < 1, f0, f0 * 1.3) * tt))
    far = np.exp(-tt * 0.22)
    add(filt(a, "lowpass", 1600) * far * np.minimum(1, tt / 0.3), st, gain=0.035, pan=pan)

# trees tearing out of the planters, metal groans of the bus
add(crack(2.0), 19.6, gain=0.25, pan=-0.5)
add(crack(1.6), 20.4, gain=0.18, pan=0.5)
for st, f0 in ((14.2, 70), (17.0, 55), (22.5, 62)):
    tt = tt_(1.8)
    f = f0 * (1 + 0.3 * np.sin(2 * np.pi * 0.6 * tt))
    g = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR)
    add(filt(g, "bandpass", [100, 700]) * np.sin(np.pi * tt / 1.8), st, gain=0.06)

# heartbeat while dad hangs upside down
hb = 25.2
while hb < 33.4:
    add(thump(62, 38, 0.35, decay=16, click=0.25), hb, gain=0.25)
    add(thump(55, 36, 0.3, decay=18, click=0.15), hb + 0.26, gain=0.16)
    hb += 0.8

# ---------------------------------------------------------------- gravity back (37)

add(thump(60, 26, 2.2, decay=1.8, click=0.7), RESTORE, gain=0.95)
for st, pan in ((LAND - 0.15, -0.3), (LAND, 0.1), (LAND + 0.1, 0.4), (LAND + 0.25, -0.5), (LAND + 0.4, 0.3)):
    add(thump(90, 50, 0.5, decay=10, click=0.8), st, gain=0.25, pan=pan)
# groans after landing
for st, f0, pan in ((39.2, 180, -0.3), (39.7, 140, 0.2)):
    tt = tt_(0.8)
    v_ = filt(signal.sawtooth(2 * np.pi * np.cumsum(f0 * (1 - 0.2 * tt)) / SR), "bandpass", [400, 1100])
    add(v_ * np.sin(np.pi * tt / 0.8), st, gain=0.04, pan=pan)

# ---------------------------------------------------------------- hang time (40-47)

hang = env(40.0, 47.4, 2.0, 0.6)
add(filt(pink(N), "bandpass", [1500, 4000]) * hang, gain=0.012, pan=0.2)
add(filt(brown(N), "lowpass", 300) * hang, gain=0.12)
p = pad([note(m) for m in (81, 84, 88)], 8.0, detune=0.8, bright=0.0)
add(p * np.sin(np.pi * tt_(8.0) / 8.0), 39.8, gain=0.06)

# ---------------------------------------------------------------- the fall (47-52)

for k in range(9):
    st = 47.2 + k * 0.5 + rng.uniform(0, 0.2)
    dur = 52.2 - st + rng.uniform(0.2, 1.4)
    tt = tt_(dur)
    f = 2600 - 1900 * (tt / dur) ** 0.8
    whistle = np.sin(2 * np.pi * np.cumsum(f) / SR)
    add(whistle * (tt / dur) ** 1.5, st, gain=0.035, pan=rng.uniform(-0.7, 0.7))
add(filt(pink(N), "bandpass", [300, 3000]) * env(47.2, 52.0, 3.5, 0.05) * np.clip((t - 47.2) / 4.8, 0, 1), gain=0.12)
tt = tt_(4.8)
add(np.sin(2 * np.pi * np.cumsum(110 * 2 ** (tt * 0.8)) / SR) * (tt / 4.8) ** 2, 47.2, gain=0.12)
bt = 49.6
while bt < 52.0:
    add(thump(60, 34, 0.3, decay=12, click=0.4), bt, gain=0.3)
    add(hat(0.05), bt + 0.15, gain=0.06)
    bt += 0.3
# light junk raining down before the big pieces
for _ in range(40):
    st = rng.uniform(48.5, 52.5)
    add(thump(rng.uniform(120, 260), 80, 0.15, decay=30, click=1.2), st, gain=0.06, pan=rng.uniform(-0.8, 0.8))

# ---------------------------------------------------------------- impacts (52-57, x2.5 slow motion)

for name, st in HITS.items():
    big = name in ("bus", "fcar", "taxi", "water")
    if name == "water":
        tt = tt_(3.5)
        sp = filt(pink(len(tt)), "lowpass", 2200) * np.exp(-tt * 1.3) * np.clip(tt / 0.02, 0, 1)
        add(sp, st, gain=0.6)
        add(thump(48, 28, 1.6, decay=2.5, click=0.4), st, gain=0.5)
        continue
    add(thump(50 if big else 62, 24, 2.0, decay=2.0 if big else 3.5, click=0.9), st, gain=1.0 if big else 0.55)
    if name.startswith("tree"):
        add(crack(1.4), st, gain=0.35, pan=0.3 if name == "tree2" else -0.4)
        continue
    if name == "cart":
        add(metal(0.8, 420), st, gain=0.25, pan=0.4)
        continue
    add(metal(2.0 if big else 1.2, 120 if name == "bus" else 190), st, gain=0.5 if big else 0.3, pan=rng.uniform(-0.4, 0.4))
    if name in ("bus", "taxi", "pile1", "pile3"):
        add(glass(1.8), st + 0.05, gain=0.45 if big else 0.25, pan=rng.uniform(-0.5, 0.5))
# low rumble holding the hits together
add(filt(brown(N), "lowpass", 90) * env(52.2, 57.5, 0.2, 1.5), gain=0.35)

# ---------------------------------------------------------------- aftermath (57-65)

aft = env(56.8, DUR, 1.0, 2.5)
add(filt(white(N), "lowpass", 900) * aft, gain=0.015)  # dust settling
for st, pan, f0 in ((57.3, -0.6, 880), (57.9, 0.5, 740), (58.8, 0.1, 1000), (60.1, -0.3, 820)):
    a = np.sign(np.sin(2 * np.pi * np.where(((t - st) * 3.2) % 2 < 1, f0, f0 * 1.25) * t))
    add(filt(a, "lowpass", 1800) * env(st, DUR, 0.05, 2.5), gain=0.022, pan=pan)
siren_f = 700 + 250 * np.sign(np.sin(2 * np.pi * 0.5 * t))
siren = np.sin(2 * np.pi * np.cumsum(siren_f) / SR)
add(filt(siren, "lowpass", 1500) * env(59.5, DUR, 3.0, 2.0), gain=0.025, pan=0.6)
for _ in range(22):
    st = rng.uniform(57.2, 64)
    tt = tt_(0.12)
    f = rng.uniform(900, 1600) * (1 + 1.5 * tt)
    add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 40), st, gain=0.05, pan=rng.uniform(-0.6, 0.6))
for _ in range(10):
    add(thump(rng.uniform(150, 300), 90, 0.2, decay=25, click=1.0), rng.uniform(57, 60), gain=0.05, pan=rng.uniform(-0.7, 0.7))
p = pad([note(m - 12) for m in (57, 60, 64, 69)], 7.5, detune=0.3, bright=0.2)
add(filt(p, "lowpass", 1500) * np.minimum(1, tt_(7.5) / 2.0), 57.6, gain=0.13)
for k_, m in enumerate((69, 64, 60, 57)):
    add(pluck(note(m), 2.0), 61.0 + k_ * 0.9, gain=0.08, pan=-0.2 + 0.15 * k_)

# ---------------------------------------------------------------- master

mix = np.stack([out_l, out_r], axis=1)
mix = filt(mix.T, "highpass", 25, 2).T
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.6) / np.tanh(1.6) * 0.9

root = Path(__file__).resolve().parent.parent
raw = root / "audio" / "gravity-flip-raw.wav"
final = root / "public" / "audio" / "gravity-flip.wav"
final.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(raw), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())

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
