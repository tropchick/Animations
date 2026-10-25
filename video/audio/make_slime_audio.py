"""Builds the soundtrack and the timing cues for "Slime Chronicle", episode 1 "The Leak".

The voice comes from ElevenLabs (audio/voice/slime-ep1-v4-*.mp3, model Eleven v4; the first version used Multilingual v2). Its pauses came out too short, so the
voice is cut at the word boundaries listed in PAUSES and silence is inserted there. Word times come
from audio/voice/slime-ep1-words.json (speech recognition of the two files).

Everything else is synthesized here (no samples): ventilation hum, a cold drone, servo, locks,
counter beep, steps, glass taps, clock, the jar, breathing, the final click.

Outputs:
  public/audio/slime-ep1.wav   48 kHz stereo, loudness-normalized
  src/slime/cues.json          word times on the video timeline, shot boundaries, voice envelope
"""

import json
import subprocess
import wave
from pathlib import Path

import numpy as np
from scipy import signal

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
FPS = 30
rng = np.random.default_rng(7)

VOICE_START = 0.45  # the record click comes first
# extra silence (seconds) inserted before main-file word number N
PAUSES = {4: 0.5, 10: 0.6, 17: 0.3, 24: 0.6, 34: 0.5, 41: 0.3, 52: 0.6, 66: 0.7, 72: 0.7,
          84: 0.5, 91: 0.7, 103: 0.6, 113: 0.5, 118: 0.5, 119: 0.8, 128: 0.5}
GAP_BEFORE_ENDING = 1.5  # silence before "Их стало два"
ENDING_FROM_WORD = 0  # the ending file is only "Их стало два"
HOLD_AFTER = 0.9  # the shock frame stays this long after "два"
TITLE = 3.2  # black title card


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float64) / 32768


def quietest(x, a, b, thr=0.01):
    """Sample index in the middle of the longest pause between a and b seconds.
    The longest one matters: a short dip inside a word (the closure before "т", "к") must not be taken for a pause."""
    w = int(0.01 * SR)
    i0 = int(a * SR)
    seg = x[i0: int(b * SR)]
    env = np.sqrt(np.convolve(seg ** 2, np.ones(w) / w, "same"))
    quiet = env < thr
    best, run, best_end = 0, 0, len(seg) // 2
    for k, q in enumerate(quiet):
        run = run + 1 if q else 0
        if run > best:
            best, best_end = run, k
    return i0 + best_end - best // 2


def dip(x, a, b):
    """Sample index of the quietest 20 ms between a and b seconds."""
    w = int(0.02 * SR)
    i0, i1 = int(a * SR), int(b * SR)
    e = np.convolve(x[i0:i1] ** 2, np.ones(w), "valid")
    return i0 + int(np.argmin(e)) + w // 2


def fade_edges(x, ms=8):
    n = min(int(ms / 1000 * SR), len(x) // 2)
    r = np.linspace(0, 1, n)
    x = x.copy()
    x[:n] *= r
    x[-n:] *= r[::-1]
    return x


words = json.loads((ROOT / "audio/voice/slime-ep1-v4-words.json").read_text())
main = load(ROOT / "audio/voice/slime-ep1-v4-main.mp3")[: int(words["main_end"] * SR)]
ending = load(ROOT / "audio/voice/slime-ep1-v4-ending.mp3")
mw, ew = words["main"], words["ending"]

# ---------------------------------------------------------------- voice edit

cuts = []  # (sample in main, pause)
for n, p in sorted(PAUSES.items()):
    cuts.append((quietest(main, mw[n - 1][1] - 0.15, mw[n][0] + 0.35), p))

pieces, bounds, prev = [], [], 0
for c, p in cuts:
    pieces.append(fade_edges(main[prev:c]))
    pieces.append(np.zeros(int(p * SR)))
    bounds.append((c / SR, p))
    prev = c
pieces.append(fade_edges(main[prev:]))
voice_main = np.concatenate(pieces)


def map_main(s):
    """Main-file seconds -> video seconds."""
    return VOICE_START + s + sum(p for c, p in bounds if c <= s)


end_cut = 0 if ENDING_FROM_WORD == 0 else dip(ending, ew[ENDING_FROM_WORD - 1][1] - 0.05, ew[ENDING_FROM_WORD][0] + 0.04)
voice_end = fade_edges(ending[end_cut:])
end_start = VOICE_START + len(voice_main) / SR + GAP_BEFORE_ENDING


def map_end(s):
    return end_start + s - end_cut / SR


W = [(map_main(a), map_main(b), w) for a, b, w in mw]
E = [(map_end(a), map_end(b), w) for a, b, w in ew[ENDING_FROM_WORD:]]
DUR = round(E[-1][1] + HOLD_AFTER + TITLE, 2)
N = int(SR * DUR)
t = np.arange(N) / SR


def ws(i):
    return W[i][0]


def we(i):
    return W[i][1]


# Shot boundaries in video seconds (see scripts/slime-chronicle-ep1.md, "Список кадров").
BLACK = round(E[-1][1] + HOLD_AFTER, 3)
SHOTS = [
    ("grain", 0.0),
    ("recorder", we(9) + 0.3),
    ("hall", ws(15) - 0.1),
    ("microscope", ws(24) - 0.25),
    ("dust", ws(35) - 0.2),
    ("arm", ws(41) - 0.1),
    ("chamber", ws(52) - 0.3),
    ("locks", ws(59) - 0.45),
    ("counter", ws(66) - 0.35),
    ("approach", ws(72) - 0.2),
    ("glass", ws(77) - 0.15),
    ("corridor", ws(85) - 0.15),
    ("desk", ws(91) - 0.25),
    ("glint", ws(96) - 0.1),
    ("pit", ws(103) - 0.3),
    ("rim", ws(109) - 0.15),
    ("bottom", ws(114) - 0.2),
    ("jar", ws(119) - 0.35),
    ("note", ws(123) - 0.15),
    ("hands", ws(125) - 0.2),
    ("jarhold", ws(128) - 0.25),
    ("shock", E[0][0] - 0.4),
    ("title", BLACK),
]
shot_at = {name: s for name, s in SHOTS}
shot_end = {SHOTS[k][0]: (SHOTS[k + 1][1] if k + 1 < len(SHOTS) else DUR) for k in range(len(SHOTS))}

LOCKS = [ws(59) - 0.05, ws(59) + 0.2, ws(60) + 0.12]
LID = shot_at["chamber"] + 0.35
COUNT_ZERO = ws(71)
GLASS_TAP = ws(79) - 0.1
JAR_DOWN = shot_at["jar"] + 1.5

# ---------------------------------------------------------------- helpers

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
    out_l[i: i + n] += sig[:n] * gain * lg
    out_r[i: i + n] += sig[:n] * gain * rg


def filt(x, kind, freq, order=4):
    return signal.sosfilt(signal.butter(order, freq, btype=kind, fs=SR, output="sos"), x)


def white(n):
    return rng.standard_normal(n)


def brown(n):
    x = np.cumsum(white(n))
    x = filt(x, "highpass", 20, 2)
    return x / (np.max(np.abs(x)) + 1e-9)


def env(start, end, fi=0.5, fo=0.5):
    return np.clip((t - start) / max(fi, 1e-4), 0, 1) * np.clip((end - t) / max(fo, 1e-4), 0, 1)


def tt_(dur):
    return np.arange(int(dur * SR)) / SR


def thump(f0=60, f1=32, dur=1.0, decay=4.0, click=0.15):
    tt = tt_(dur)
    f = f1 + (f0 - f1) * np.exp(-tt * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = (np.sin(ph) + 0.55 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)) * np.exp(-tt * decay)
    return s + filt(white(len(tt)), "bandpass", [80, 900]) * np.exp(-tt * 28) * click * 1.6


def clank(dur=0.5, base=420):
    """Steel latch: a short noise hit plus inharmonic ringing."""
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [600, 5000]) * np.exp(-tt * 70)
    for k, r in enumerate((1.0, 2.31, 3.77, 5.1)):
        s += np.sin(2 * np.pi * base * r * tt + k) * np.exp(-tt * (14 + 6 * k)) * 0.35
    return s + thump(110, 60, dur, decay=18, click=0.0) * 0.6


def ting(freq=2400, dur=1.4):
    tt = tt_(dur)
    s = sum(np.sin(2 * np.pi * freq * r * tt + k) * np.exp(-tt * (3 + 2.5 * k)) / (k + 1)
            for k, r in enumerate((1.0, 1.58, 2.37, 3.11)))
    return s * np.clip(tt / 0.002, 0, 1)


def beep(freq, dur=0.16):
    tt = tt_(dur)
    return np.sign(np.sin(2 * np.pi * freq * tt)) * 0.3 * np.clip(tt / 0.004, 0, 1) * np.clip((dur - tt) / 0.01, 0, 1)


def click(dur=0.05, tone=3000):
    tt = tt_(dur)
    return (filt(white(len(tt)), "bandpass", [tone * 0.5, tone * 2]) + np.sin(2 * np.pi * tone * 0.4 * tt)) * np.exp(-tt * 140)


def step(dur=0.3):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [90, 1400]) * np.exp(-tt * 30) + thump(80, 50, dur, decay=25, click=0) * 0.5


def breath(dur=1.6, inhale=True):
    tt = tt_(dur)
    shape = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** (1.5 if inhale else 0.8)
    return filt(white(len(tt)), "bandpass", [500, 3500]) * shape


def drone(freqs, dur, detune=0.25, wobble=0.07):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for f in freqs:
        for d in (-detune, detune):
            ph = rng.uniform(0, 2 * np.pi)
            fm = 1 + 0.002 * np.sin(2 * np.pi * wobble * tt + ph)
            s += np.sin(2 * np.pi * (f + d) * np.cumsum(fm) / SR + ph)
    return s / (2 * len(freqs))


# ---------------------------------------------------------------- voice: dictaphone in an empty hall

v = np.zeros(N)
i0 = idx(VOICE_START)
v[i0: i0 + len(voice_main)] += voice_main[: N - i0]
i1 = idx(end_start)
v[i1: i1 + len(voice_end)] += voice_end[: N - i1] * 0.85  # the last line a little quieter
v = filt(v, "highpass", 120, 2)
v = filt(v, "lowpass", 7000, 2)
v = np.tanh(v * 1.6) / 1.6  # a little recorder grit
ir_t = tt_(0.9)
ir = filt(white(len(ir_t)), "lowpass", 3500) * np.exp(-ir_t * 6.5)
ir[: int(0.012 * SR)] = 0
wet = signal.fftconvolve(v, ir)[:N]
wet *= 0.1 * np.max(np.abs(v)) / (np.max(np.abs(wet)) + 1e-9)
add(v, gain=1.0)
add(wet, gain=0.9, pan=-0.3)
add(np.roll(wet, int(0.023 * SR)), gain=0.9, pan=0.3)

# envelope of the voice for the recorder waveform, one value per video frame
frames = int(DUR * FPS)
hop = SR // FPS
vabs = np.abs(v)
venv = np.array([np.sqrt(np.mean(vabs[k * hop:(k + 1) * hop] ** 2)) for k in range(frames)])
venv = venv / (np.percentile(venv[venv > 0], 98) + 1e-9)
venv = np.clip(venv, 0, 1)

# ---------------------------------------------------------------- room

silence_at = shot_at["shock"]  # everything except the voice stops before "Их стало два"
hum_off = COUNT_ZERO

# ventilation and lamp hum, until the counter hits zero
hum = filt(brown(N), "lowpass", 260) * 0.55 + filt(white(N), "bandpass", [700, 2400]) * 0.03
mains = sum(np.sin(2 * np.pi * 50 * k * t) / k for k in (1, 2, 3, 5)) * 0.05
add((hum + mains) * env(0.0, hum_off, 0.6, 0.08), gain=0.32)
# power-down sweep when the hum stops
tt = tt_(1.2)
f = 100 * np.exp(-tt * 2.2) + 20
add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.5), hum_off, gain=0.12)
# after that only a thin air tone, colder, and it stays until the shock
air = filt(white(N), "bandpass", [1800, 5200]) * 0.05 + filt(brown(N), "lowpass", 120) * 0.3
add(air * env(hum_off, silence_at, 0.8, 0.05), gain=0.22)
# corridor: hollower
corr = filt(brown(N), "bandpass", [60, 400]) * 0.5
add(corr * env(shot_at["corridor"], shot_end["corridor"], 0.2, 0.2), gain=0.25)

# cold drone: low fifth, swells slowly; after the counter it turns darker
d1 = drone([55.0, 82.4, 110.0], hum_off + 0.5)
add(filt(d1, "lowpass", 900) * np.clip(tt_(hum_off + 0.5) / 8, 0, 1) * 0.8, 0.0, gain=0.16)
d2_len = silence_at - hum_off
d2 = drone([51.9, 55.0, 77.8, 103.8], d2_len, detune=0.4)
d2 *= np.minimum(1, tt_(d2_len) / 1.5) * (0.6 + 0.6 * tt_(d2_len) / d2_len)
d2[-int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR))
add(filt(d2, "lowpass", 700), hum_off, gain=0.2)
# high glassy tone that creeps in from the pit shot on
hi_len = silence_at - shot_at["pit"]
hi = drone([1244.5, 1318.5], hi_len, detune=1.5, wobble=0.3) * np.minimum(1, tt_(hi_len) / hi_len) ** 2
add(hi, shot_at["pit"], gain=0.025)

# ---------------------------------------------------------------- events

add(click(0.06, 2600), 0.05, gain=0.5)  # record button
add(beep(1760, 0.09), 0.14, gain=0.12)
for k in range(4):  # instrument blips in the hall
    add(beep(rng.uniform(1100, 1900), 0.07), shot_at["hall"] + 0.8 + k * 1.9 + rng.uniform(0, 0.4), gain=0.04,
        pan=rng.uniform(-0.6, 0.6))

# robotic arm: servo whine while it lowers the capsule
a0, a1 = shot_at["arm"], shot_end["arm"]
tt = tt_(a1 - a0)
fs = 380 + 60 * np.sin(np.pi * tt / (a1 - a0))
servo = (signal.sawtooth(2 * np.pi * np.cumsum(fs) / SR) * 0.4 + np.sin(2 * np.pi * np.cumsum(fs * 2) / SR) * 0.3)
servo = filt(servo, "bandpass", [250, 2500]) * np.minimum(1, tt / 0.4) * np.minimum(1, (a1 - a0 - tt) / 0.4)
add(servo, a0, gain=0.05, pan=0.2)
add(clank(0.4, 300), a1 - 0.6, gain=0.12)  # capsule set down

add(thump(70, 40, 1.2, decay=6, click=0.4), LID, gain=0.3)  # lid shuts
add(clank(0.5, 260), LID + 0.02, gain=0.18)
for k, s in enumerate(LOCKS):
    add(clank(0.6, 330 + 25 * k), s, gain=0.32, pan=(-0.4, 0.0, 0.4)[k])
    add(beep(880, 0.05), s + 0.12, gain=0.04)

# the counter: two falling tones on "ноль"
add(beep(1320, 0.14), COUNT_ZERO - 0.02, gain=0.14)
add(beep(660, 0.32), COUNT_ZERO + 0.16, gain=0.14)

for k in range(5):
    add(step(), shot_at["approach"] + 0.05 + k * 0.42, gain=0.18, pan=-0.2 + 0.1 * k)
add(click(0.04, 2200), shot_at["glass"] + 0.3, gain=0.3)  # flashlight
add(ting(2600, 1.2), GLASS_TAP, gain=0.08, pan=0.2)
add(ting(2450, 1.2), GLASS_TAP + 0.55, gain=0.06, pan=0.2)

add(filt(beep(220, 0.5), "lowpass", 900), shot_at["corridor"] + 0.6, gain=0.05)  # door lock buzz far away

# desk: a wall clock ticking until the silence
k = 0
while shot_at["desk"] + k * 1.0 < silence_at - 0.2:
    add(click(0.03, 4200 if k % 2 else 3600), shot_at["desk"] + 0.2 + k * 1.0, gain=0.08, pan=-0.5)
    k += 1
add(ting(3400, 2.0), shot_at["glint"] + 0.55, gain=0.035, pan=0.1)  # the glint

# pit: faint metallic crawl, as if something keeps working
p0, p1 = shot_at["pit"], silence_at
tt = tt_(p1 - p0)
crawl = filt(white(len(tt)), "bandpass", [3000, 9000]) * (rng.random(len(tt)) < 0.004)
crawl = filt(crawl, "bandpass", [2500, 8000]) * 6 + filt(white(len(tt)), "highpass", 6000) * 0.05
add(crawl * np.minimum(1, tt / 2.0), p0, gain=0.06, pan=0.15)

# jar: breath, glass on steel
j0 = shot_at["jar"]
add(breath(1.4), j0 + 0.05, gain=0.05)
add(breath(1.1, False), shot_at["hands"] + 0.1, gain=0.06)
add(ting(1900, 1.6), JAR_DOWN, gain=0.12)
add(clank(0.3, 900), JAR_DOWN, gain=0.05)
for k in range(3):  # heartbeat, close
    add(thump(55, 35, 0.35, decay=12, click=0.0), shot_at["hands"] + 0.3 + k * 0.85, gain=0.12)
    add(thump(50, 32, 0.3, decay=14, click=0.0), shot_at["hands"] + 0.3 + k * 0.85 + 0.24, gain=0.08)

# end: the recording is cut, a low hit on black, a long cold tail under the title
add(click(0.03, 1800) * 2, BLACK - 0.01, gain=0.5)
add(thump(48, 26, 3.0, decay=1.3, click=0.2), BLACK, gain=0.35)
tail = drone([41.2, 61.7], TITLE)
add(filt(tail, "lowpass", 400) * np.exp(-tt_(TITLE) * 0.6), BLACK, gain=0.18)

# ---------------------------------------------------------------- master

mix = np.stack([out_l, out_r], axis=1)
mix = filt(mix.T, "highpass", 25, 2).T
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.3) / np.tanh(1.3) * 0.9

raw = ROOT / "audio" / "slime-ep1-raw.wav"
final = ROOT / "public" / "audio" / "slime-ep1.wav"
final.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(raw), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())

target = "I=-15:TP=-1.5:LRA=18"
probe = subprocess.run(
    ["ffmpeg", "-hide_banner", "-i", str(raw), "-af", f"loudnorm={target}:print_format=json", "-f", "null", "-"],
    capture_output=True, text=True, check=True,
).stderr
m = json.loads(probe[probe.rindex("{"): probe.rindex("}") + 1])
measured = (
    f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
    f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
)
subprocess.run(
    ["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", f"loudnorm={target}:{measured}", "-ar", str(SR), str(final)],
    check=True,
)
raw.unlink()

cues = {
    "duration": DUR,
    "shots": [[n, round(s, 3)] for n, s in SHOTS],
    "words": [[round(a, 3), round(b, 3), w] for a, b, w in W],
    "ending": [[round(a, 3), round(b, 3), w] for a, b, w in E],
    "locks": [round(s, 3) for s in LOCKS],
    "lid": round(LID, 3),
    "countZero": round(COUNT_ZERO, 3),
    "glassTap": round(GLASS_TAP, 3),
    "jarDown": round(JAR_DOWN, 3),
    "voice": [round(float(x), 3) for x in venv],
}
(ROOT / "src/slime/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s) and src/slime/cues.json")
for n, s in SHOTS:
    print(f"  {n:<11} {s:6.2f} – {shot_end[n]:6.2f}  ({shot_end[n] - s:4.1f} s)")
