"""Soundtrack and timing cues for "ПОВ: ты Мистер Бист" (parody, one standalone video).

Voice: one ElevenLabs take on Eleven v4, voice Miron (audio/voice/pov-mrbeast.mp3).
Music is a light upbeat loop synthesized here (kick, clap, hats, bass, chord stabs, pluck);
it drops out in the edit room at night and comes back soft after the video goes out.

Outputs: public/audio/pov-mrbeast.wav and src/pov/cues.json.
"""

import json

import numpy as np

from slime_lib import (ROOT, SR, Mix, assemble, beep, brown, clank, click, drone, envelope, filt, load, rng, step,
                       thump, ting, tt_, white)

VOICE_START = 0.6
TAIL = 0.45

words = json.loads((ROOT / "audio/voice/pov-mrbeast-words.json").read_text())
takes = {"t1": load(ROOT / "audio/voice/pov-mrbeast.mp3")}
PIECES = [("t1", 0, 172)]
PAUSES = {22: 0.2, 31: 0.3, 34: 0.2, 44: 0.3, 71: 0.3, 84: 0.2, 88: 0.4, 106: 0.6, 119: 0.2, 129: 0.5,
          138: 0.3, 142: 0.6, 145: 0.6, 154: 0.3, 165: 0.7, 170: 1.0}

voice, W = assemble(takes, words, PIECES, PAUSES, VOICE_START)
DUR = round(W[-1][1] + TAIL, 2)
mix = Mix(DUR)
N = mix.n


def ws(i):
    return W[i][0]


def we(i):
    return W[i][1]


SHOTS = [
    ("alarm", 0.0),
    ("wake", ws(3) - 0.25),
    ("cameras", ws(16) - 0.2),
    ("door", ws(22) - 0.3),
    ("keys", ws(31) - 0.25),
    ("crying", ws(34) - 0.2),
    ("field", ws(44) - 0.3),
    ("timelapse", ws(58) - 0.2),
    ("sleeper", ws(66) - 0.2),
    ("studio", ws(71) - 0.3),
    ("lcd", ws(84) - 0.2),
    ("beach", ws(88) - 0.35),
    ("digging", ws(100) - 0.2),
    ("editroom", ws(106) - 0.45),
    ("editorface", ws(119) - 0.2),
    ("money", ws(129) - 0.35),
    ("editorcry", ws(142) - 0.3),
    ("phone", ws(145) - 0.4),
    ("bed", ws(154) - 0.25),
    ("eyes", ws(161) - 0.4),
    ("alarm2", ws(170) - 0.6),
]
shot_at = dict(SHOTS)
shot_end = {name: (SHOTS[i + 1][1] if i + 1 < len(SHOTS) else DUR) for i, (name, _) in enumerate(SHOTS)}

# ---------- shared moments (the video reads them from cues.json) ----------
SLAP = [we(2) + 0.12, DUR + 1]  # the alarm is slapped in the first shot; the last one ends before the slap
CURTAINS = shot_at["wake"] + 0.5
MONEY = [  # (time, amount added, what)
    (ws(31) + 0.25, 62000, "car"),
    (we(70) + 0.25, 500000, "prize"),
    (ws(84) + 0.35, 340, "coffee"),
    (ws(92) + 0.3, 330000, "sportscar"),
    (ws(99) + 0.1, 27660, "shovels"),
    (ws(139) + 0.15, 80000, "editor"),
]
FLASHES = [round(shot_at["studio"] + 0.35 + k * 0.42 + (0.12 if k % 3 == 2 else 0), 3) for k in range(int((shot_end["studio"] - shot_at["studio"] - 0.5) / 0.44))]
CUP_FALL = shot_at["editorface"] + 1.4
CUP_LAND = CUP_FALL + 0.55
MONEY_SLAP = ws(139) + 0.05
NOTIFY = shot_at["phone"] + 0.25
BED_FLOP = shot_at["bed"] + 0.7
EYES_OPEN = we(164) + 0.3
RESET = ws(169) - 0.1
ALARM2 = shot_at["alarm2"] + 0.25
KEYS = ws(31) + 0.1
DOORBELL = shot_at["door"] + 0.15

# ---------- voice ----------
v = np.zeros(N)
v[int(0): len(voice)] += voice[: N]
mix.add(v, 0, 1.0)
voice_env = np.convolve(np.abs(v), np.ones(int(0.12 * SR)) / int(0.12 * SR), "same")
duck = 1 - 0.55 * np.clip(voice_env / (np.percentile(voice_env[voice_env > 1e-4], 90) + 1e-9), 0, 1)

# ---------- music ----------
BPM = 118
BEAT = 60 / BPM
music_l = np.zeros(N)
music_r = np.zeros(N)


def put(sig, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i < 0:
        return
    n = min(len(sig), N - i)
    lg = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
    rg = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
    music_l[i:i + n] += sig[:n] * g * lg
    music_r[i:i + n] += sig[:n] * g * rg


def kick():
    return thump(150, 48, 0.4, decay=9, click=0.4)


def clap():
    tt = tt_(0.25)
    n = filt(white(len(tt)), "bandpass", [900, 4500])
    env = np.exp(-tt * 28) + 0.6 * np.exp(-np.maximum(tt - 0.012, 0) * 30) * (tt > 0.012)
    return n * env * 0.6


def hat(open_=False):
    tt = tt_(0.18 if open_ else 0.05)
    return filt(white(len(tt)), "highpass", 7000) * np.exp(-tt * (18 if open_ else 90)) * 0.35


def saw(f, dur, bright=3000):
    tt = tt_(dur)
    ph = (f * tt) % 1.0
    s = 2 * ph - 1
    return filt(s, "lowpass", bright, 2)


def bass(f, dur):
    tt = tt_(dur)
    s = np.sin(2 * np.pi * f * tt) + 0.35 * saw(f, dur, 900)
    return s * np.exp(-tt * 3.5) * np.clip(tt / 0.005, 0, 1) * 0.7


def stab(freqs, dur=0.22):
    tt = tt_(dur)
    s = sum(saw(f * d, dur, 2400) for f in freqs for d in (0.997, 1.003))
    return s / (2 * len(freqs)) * np.exp(-tt * 9) * np.clip(tt / 0.004, 0, 1)


def pluck(f, dur=0.3):
    tt = tt_(dur)
    s = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)
    return s * np.exp(-tt * 10) * np.clip(tt / 0.002, 0, 1) * 0.5


def pad(freqs, dur):
    tt = tt_(dur)
    s = sum(np.sin(2 * np.pi * f * d * tt + rng.uniform(0, 6)) for f in freqs for d in (0.996, 1.004))
    return s / (2 * len(freqs)) * np.clip(tt / 0.6, 0, 1) * np.clip((dur - tt) / 0.6, 0, 1)


# I - V - vi - IV in C
CHORDS = [(130.81, [261.6, 329.6, 392.0]), (98.0, [246.9, 293.7, 392.0]), (110.0, [261.6, 329.6, 440.0]), (87.31, [261.6, 349.2, 440.0])]
ARP = [[523.3, 659.3, 784.0, 659.3], [493.9, 587.3, 784.0, 587.3], [523.3, 659.3, 880.0, 659.3], [523.3, 698.5, 880.0, 698.5]]

m_start = shot_at["wake"] + 0.05
m_stop = shot_at["editroom"] + 0.2
fast_a, fast_b = shot_at["timelapse"], shot_end["timelapse"]
t = m_start
b = 0
while t < m_stop:
    bar = (b // 4) % 4
    root, chord = CHORDS[bar]
    beat = b % 4
    put(kick(), t, 0.9)
    if beat in (1, 3):
        put(clap(), t, 0.7)
    fast = fast_a <= t < fast_b
    for h in range(4 if fast else 2):
        put(hat(open_=(h == 1 and not fast)), t + h * BEAT / (4 if fast else 2), 0.6, 0.3)
    put(bass(root, BEAT * 0.9), t, 0.55)
    if beat in (0, 2) or fast:
        put(stab(chord), t + BEAT * 0.5, 0.35, -0.2)
    if b >= 8:
        put(pluck(ARP[bar][beat]), t + BEAT * 0.25, 0.22, 0.4)
        put(pluck(ARP[bar][(beat + 2) % 4]), t + BEAT * 0.75, 0.16, -0.4)
    t += BEAT
    b += 1
# a quick riser into the timelapse and a fill out of it
tt = tt_(fast_a - (fast_a - 1.5))
put(filt(white(len(tt)), "bandpass", [1500, 6000]) * (tt / tt[-1]) ** 2 * 0.25, fast_a - 1.5)

# soft music after the upload: pads and slow plucks
s_start, s_end = shot_at["phone"], shot_at["eyes"] + 0.3
t = s_start
k = 0
while t < s_end:
    root, chord = CHORDS[k % 4]
    put(pad([f / 2 for f in chord] + [root], BEAT * 4 + 0.6) * 0.5, t)
    for j in range(4):
        put(pluck(ARP[k % 4][j] / 2, 0.6) * 0.6, t + j * BEAT)
    t += BEAT * 4
    k += 1

menv = mix.env(m_start, m_stop, 0.05, 0.5) + mix.env(s_start, s_end, 0.4, 1.0)
mix.l += music_l * menv * duck * 0.42
mix.r += music_r * menv * duck * 0.42

# ---------- sound effects ----------


def alarm(dur):
    out = np.zeros(int(dur * SR))
    period = 1.0
    t = 0.0
    while t < dur:
        for j in range(4):
            s = beep(2050, 0.07)
            i = int((t + j * 0.12) * SR)
            n = min(len(s), len(out) - i)
            if n > 0:
                out[i:i + n] += s[:n]
        t += period
    return filt(out, "bandpass", [900, 6000], 2)


def ka_ching():
    s = click(0.08, 2500) * 0.6
    s = np.concatenate([s, np.zeros(int(0.06 * SR))])
    bell = ting(2637, 1.0) * 0.5 + ting(3520, 1.0) * 0.35
    out = np.zeros(len(s) + len(bell))
    out[:len(s)] += s
    out[int(0.05 * SR):int(0.05 * SR) + len(bell)] += bell
    return out


def whoosh(dur=0.6, lo=300, hi=3000):
    tt = tt_(dur)
    n = white(len(tt))
    shape = np.sin(np.pi * tt / dur) ** 2
    return filt(n, "bandpass", [lo, hi]) * shape


def jingle():
    out = np.zeros(int(0.7 * SR))
    for j in range(9):
        s = ting(rng.uniform(4200, 7800), 0.25) * 0.25
        i = int(rng.uniform(0, 0.4) * SR)
        out[i:i + len(s)] += s[:len(out) - i]
    return out


def shutter():
    a = click(0.03, 4500)
    b = click(0.04, 2500)
    out = np.zeros(int(0.12 * SR))
    out[:len(a)] += a
    out[int(0.055 * SR):int(0.055 * SR) + len(b)] += b * 0.8
    return out


def flash_whine():
    tt = tt_(0.35)
    f = 3000 + 2500 * tt / 0.35
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9) * 0.06


def snore(dur=1.4):
    tt = tt_(dur)
    shape = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 1.5
    buzz = np.sign(np.sin(2 * np.pi * (34 + 6 * np.sin(2 * np.pi * 3 * tt)) * tt))
    return filt(buzz * 0.4 + white(len(tt)) * 0.6, "lowpass", 700) * shape


def gull():
    tt = tt_(0.5)
    f = 1700 - 900 * tt / 0.5 + 200 * np.sin(2 * np.pi * 9 * tt)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.5) * 0.1


def dingdong():
    a = ting(988, 1.2) * 0.5
    b = ting(784, 1.6) * 0.5
    out = np.zeros(len(b) + int(0.45 * SR))
    out[:len(a)] += a
    out[int(0.45 * SR):] += b
    return out


def fanfare(dur=1.8):
    tt = tt_(dur)
    s = sum(saw(f * d, dur, 3200) for f in (261.6, 329.6, 392.0, 523.3) for d in (0.995, 1.005)) / 8
    env = np.clip(tt / 0.03, 0, 1) * np.exp(-tt * 1.6)
    return s * env


# alarm at the start, slapped off; again at the very end (the video loops back to the start)
mix.add(alarm(SLAP[0]), 0.0, 0.5)
mix.add(thump(140, 70, 0.3, decay=20, click=0.6), SLAP[0], 0.6)
mix.add(alarm(DUR - ALARM2 + 0.2), ALARM2, 0.5)
mix.add(whoosh(1.0, 200, 2000), CURTAINS, 0.22, -0.3)
mix.add(whoosh(1.0, 200, 2000), CURTAINS + 0.05, 0.22, 0.3)
for j in range(20):
    mix.add(beep(1800 + 60 * (j % 3), 0.05) * 0.4, shot_at["cameras"] + 0.25 + j * 0.11, 0.35, -0.6 + 1.2 * j / 19)
mix.add(dingdong(), DOORBELL, 0.35)
mix.add(step(0.3), shot_at["door"] + 1.1, 0.25)
mix.add(jingle(), KEYS, 0.6, 0.2)
for t_, amount, _ in MONEY:
    mix.add(ka_ching(), t_, 0.5)
# field: wind and the drone
f0, f1 = shot_at["field"], shot_at["studio"]
tt = tt_(f1 - f0)
wind = filt(brown(len(tt)), "lowpass", 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * tt))
mix.add(wind * np.clip(tt / 0.3, 0, 1) * np.clip((f1 - f0 - tt) / 0.2, 0, 1), f0, 0.25)
dr = filt(np.sign(np.sin(2 * np.pi * 182 * tt)) * (1 + 0.2 * np.sin(2 * np.pi * 23 * tt)), "bandpass", [150, 2400])
mix.add(dr * np.clip(tt / 0.3, 0, 1) * np.clip((shot_at["sleeper"] - f0 - tt) / 0.3, 0, 1), f0, 0.05)
mix.add(whoosh(1.2, 400, 5000), shot_at["timelapse"] - 0.3, 0.2)
for j in range(14):
    mix.add(step(0.25), shot_at["timelapse"] + 0.2 + j * 0.45, 0.12, rng.uniform(-0.6, 0.6))
mix.add(snore(1.3), shot_at["sleeper"] + 0.9, 0.35)
mix.add(snore(1.3), shot_at["sleeper"] + 2.6, 0.3)
# studio
for f in FLASHES:
    mix.add(shutter(), f - 0.02, 0.45, 0.1)
    mix.add(flash_whine(), f + 0.06, 1.0)
mix.add(shutter(), shot_at["lcd"] + 0.2, 0.3)
# beach
b0, b1 = shot_at["beach"], shot_at["editroom"]
tt = tt_(b1 - b0)
waves = filt(brown(len(tt)), "lowpass", 1200) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.16 * tt) ** 2)
mix.add(waves * np.clip(tt / 0.2, 0, 1) * np.clip((b1 - b0 - tt) / 0.3, 0, 1), b0, 0.35)
mix.add(gull(), b0 + 0.6, 0.8, 0.5)
mix.add(gull(), b0 + 2.4, 0.6, -0.4)
crowd = filt(white(len(tt)), "bandpass", [300, 1600]) * (0.7 + 0.3 * np.sin(2 * np.pi * 1.7 * tt))
cw = np.clip((tt - (shot_at["digging"] - b0)) / 0.6, 0, 1) * np.clip((b1 - b0 - tt) / 0.3, 0, 1)
mix.add(crowd * cw, b0, 0.18)
for j in range(6):
    mix.add(clank(0.25, rng.uniform(500, 800)), shot_at["beach"] + 1.0 + j * 0.5, 0.12, rng.uniform(-0.5, 0.5))
t_ = shot_at["digging"]
while t_ < b1:
    mix.add(clank(0.2, rng.uniform(400, 900)) * 0.5 + filt(white(int(0.2 * SR)), "bandpass", [300, 2500]) * np.exp(-tt_(0.2) * 25) * 0.4, t_, 0.09, rng.uniform(-0.8, 0.8))
    t_ += rng.uniform(0.05, 0.14)
# edit room: hum, fans, mouse clicks
e0, e1 = shot_at["editroom"], shot_at["phone"]
tt = tt_(e1 - e0)
hum = drone([60, 120], e1 - e0, 0.1) * 0.5 + filt(white(len(tt)), "lowpass", 400) * 0.2
mix.add(hum * np.clip(tt / 0.4, 0, 1) * np.clip((e1 - e0 - tt) / 0.3, 0, 1), e0, 0.3)
t_ = e0 + 0.4
while t_ < shot_at["editorface"]:
    mix.add(click(0.03, 2200), t_, 0.2, 0.2)
    t_ += rng.uniform(0.15, 0.5)
mix.add(clank(0.3, 300) * 0.6, CUP_LAND, 0.3, 0.3)
mix.add(thump(90, 50, 0.4, decay=14, click=0.8), MONEY_SLAP, 0.5)
mix.add(fanfare(), MONEY[-1][0] + 0.15, 0.32)
mix.add(beep(1320, 0.09), NOTIFY, 0.3)
mix.add(beep(1760, 0.12), NOTIFY + 0.12, 0.3)
mix.add(thump(70, 40, 0.6, decay=7, click=0.3) * 0.6 + whoosh(0.6, 200, 1500) * 0.5, BED_FLOP, 0.4)
mix.add(thump(55, 28, 2.0, decay=2.2, click=0.1), EYES_OPEN, 0.8)

final = mix.write("pov-mrbeast")
cues = {
    "duration": DUR,
    "shots": [[n, round(t, 3)] for n, t in SHOTS],
    "words": [[round(s, 3), round(e, 3), w] for s, e, w in W],
    "money": [[round(t, 3), a, w] for t, a, w in MONEY],
    "flashes": FLASHES,
    "slap": round(SLAP[0], 3),
    "curtains": round(CURTAINS, 3),
    "cupFall": round(CUP_FALL, 3),
    "moneySlap": round(MONEY_SLAP, 3),
    "notify": round(NOTIFY, 3),
    "bedFlop": round(BED_FLOP, 3),
    "eyesOpen": round(EYES_OPEN, 3),
    "reset": round(RESET, 3),
    "keys": round(KEYS, 3),
    "voice": [round(float(x), 3) for x in envelope(v, DUR)],
}
(ROOT / "src/pov").mkdir(exist_ok=True)
(ROOT / "src/pov/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s) and src/pov/cues.json")
for n, t in SHOTS:
    print(f"{n:12s} {t:6.2f} {shot_end[n] - t:5.2f}")
