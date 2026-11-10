"""Soundtrack and timing cues for «День выхода GTA 6» (Russian TikTok chain, neon 2D illustration style).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant» (flow 0gNoGImEPOIlCAFutnPc, 853 credits, 62.1 s),
text /mnt/project-files/voice/day/day-vo-text.txt. Raw take: audio/voice/day-vo.mp3, word times audio/voice/day-words.json
(audio/transcribe_day.py). The take is sped up by SPEED with ffmpeg atempo, word times are divided by SPEED.

Every shot and event is anchored to a caption phrase (P[k].s / P[k].e) or a word (W("слово")).
Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30); the track gets 1/30 s in front.

Sync map (story time of the on-screen event <-> sound):
  TICKS       the countdown digits change                         <-> clock ticks
  ZERO        the timer hits 00:00:00, flash, confetti            <-> low hit + braam + ding
  WAVE        windows of the block switch on                      <-> soft pops, rising hum
  PRESS       the Fan presses «ИГРАТЬ»                            <-> button click + chime
  LAPSE       night -> dawn in the window, cans pile up           <-> whoosh + can clinks
  CUT3        bus / cockpit / office cuts                         <-> three thumps
  JUMP        granny's car leaves the ramp                        <-> engine + whoosh
  LAND        the car lands on the roof                           <-> thump + star dings
  ALARM       the lamp in the police station                      <-> alarm beeps
  THERMO      the thermometer climbs to +2                        <-> rising tone + ding
  CALVE       the glacier breaks off                              <-> crack + splash
  RISE        the water covers the Miami promenade                <-> wave
  GATOR_IN    the alligator comes through the window              <-> splash
  GRAB        he picks up the second gamepad, the screen splits   <-> click + chime
  PC_ON       the monitor text appears                            <-> beep
  FINAL       «ДО ВЫХОДА НА ПК: ???»                              <-> low ting + braam
"""

import json
import subprocess
import sys
from pathlib import Path

import numpy as np

from slime_lib import ROOT, SR, Mix, beep, click, drone, filt, load, thump, ting, tt_, white

OFF = 1 / 30
VO_AT = 0.25
SPEED = 1.06
RAW_PATH = ROOT / "audio/voice/day-vo.mp3"
FAST_PATH = ROOT / "audio/voice/day-vo-fast.mp3"
WORDS_PATH = ROOT / "audio/voice/day-words.json"

PHRASES = [
    "Выход GTA 6 уничтожил мир.",
    "Выжили только те, кому она не досталась.",
    "19 ноября, полночь.",
    "200 миллионов человек нажали «Играть».",
    "И больше не встали.",
    "Утром на работу не вышел никто.",
    "Ни водители, ни пилоты, ни даже президент.",
    "Кто всё же вышел на улицу, водил как в GTA.",
    "Полиция не приехала: она тоже играла.",
    "Трое суток приставки гудели без остановки",
    "и нагрели планету на 2 градуса.",
    "Растаяли ледники.",
    "Океан затопил Майами,",
    "тот самый, с которого рисовали игру.",
    "Вода дошла до диванов.",
    "Но в игре было солнечно, и никто не встал.",
    "Даже когда аллигатор взял второй джойстик.",
    "Выжили только пекашники.",
    "На компьютерах GTA 6 так и не вышла.",
    "Теперь они строят мир заново.",
    "Успеть бы до версии для ПК.",
]

if not FAST_PATH.exists() or FAST_PATH.stat().st_mtime < RAW_PATH.stat().st_mtime:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(RAW_PATH), "-filter:a", f"atempo={SPEED}", "-b:a", "192k", str(FAST_PATH)], check=True)

# whisper words (raw take time) -> story time; punctuation-only tokens are dropped
WH = [w for w in json.loads(WORDS_PATH.read_text()) if any(ch.isalnum() for ch in w[2])]
WH = [[VO_AT + a / SPEED, VO_AT + b / SPEED, t] for a, b, t in WH]
assert sum(len(p.split(" ")) for p in PHRASES) == len(WH), (sum(len(p.split(" ")) for p in PHRASES), len(WH))

words = []  # [start, end, token, phrase]
PT = []
i = 0
for k, text in enumerate(PHRASES):
    toks = text.split(" ")
    ws = WH[i: i + len(toks)]
    i += len(toks)
    PT.append((ws[0][0], ws[-1][1]))
    for j, tok in enumerate(toks):
        end = ws[j + 1][0] if j + 1 < len(toks) else ws[j][1]
        words.append([round(ws[j][0], 3), round(min(end, ws[j][1] + 0.6), 3), tok, k])


class _P:
    def __init__(self, k):
        self.s, self.e = PT[k]


P = [_P(k) for k in range(len(PHRASES))]


def W(tok, nth=0, exact=False):
    """start time of the nth caption word that starts with (or equals) tok"""
    norm = lambda x: x.lower().strip("«»,.:")
    hits = [w for w in words if (norm(w[2]) == tok.lower() if exact else norm(w[2]).startswith(tok.lower()))]
    return hits[nth][0]


# ---------------------------------------------------------------- shots
ZERO = P[2].s + 0.05
SHOTS = [
    ("hook", 0.0),
    ("hook2", P[1].s - 0.2),
    ("block", ZERO + 1.0),
    ("room", W("нажали") - 0.2),
    ("empty", P[5].s - 0.2),
    ("bus", P[6].s - 0.1),
    ("cockpit", W("ни", 1, True) - 0.08),
    ("office", W("ни", 2, True) - 0.08),
    ("jump", P[7].s - 0.12),
    ("police", P[8].s - 0.12),
    ("heat", P[9].s - 0.05),
    ("earth", P[10].s - 0.12),
    ("penguin", P[11].s - 0.2),
    ("miami", P[12].s - 0.15),
    ("flood", P[14].s - 0.2),
    ("gator", P[16].s - 0.25),
    ("raft", P[17].s - 0.2),
    ("pc", P[18].s - 0.2),
    ("build", P[19].s - 0.1),
]
S = dict(SHOTS)

TICKS = [ZERO - 3, ZERO - 2, ZERO - 1]
WAVE = (S["block"] + 0.25, S["room"] - 0.5)
PRESS = W("Играть") + 0.1
LAPSE = (P[4].s - 0.1, S["empty"] - 0.15)
JUMP = W("водил") - 0.35
LAND = JUMP + 1.25
ALARM = S["police"] + 0.2
THERMO = (S["earth"] + 0.35, W("2", 0, True) + 0.3)
CALVE = P[11].s + 0.45
RISE = (S["miami"] + 0.6, P[13].e)
GATOR_IN = S["gator"] + 0.15
GRAB = W("взял") + 0.25
PC_ON = S["pc"] + 0.45
FINAL = P[20].e + 0.35
DUR = round(FINAL + 2.3, 2)
END = {n: (SHOTS[i + 1][1] if i + 1 < len(SHOTS) else DUR) for i, (n, _) in enumerate(SHOTS)}

mix = Mix(DUR + OFF + 0.6)
O = OFF
VO = load(FAST_PATH)
mix.add(VO, O + VO_AT, 1.0)
VO_END = P[-1].e


# ---------------------------------------------------------------- sound effects
def sfx(path):
    return load(ROOT / f"audio/sfx/{path}.mp3")


def place(x, at, gain, pan=0.0, fade_out=None, length=None, skip=0.0, fade_in=None):
    x = x[int(skip * SR):]
    if length is not None:
        x = x[: int(max(0.05, length) * SR)]
    x = x.copy()
    if fade_out:
        n = min(len(x), int(fade_out * SR))
        x[-n:] *= np.linspace(1, 0, n)
    if fade_in:
        n = min(len(x), int(fade_in * SR))
        x[:n] *= np.linspace(0, 1, n)
    mix.add(x, O + at, gain, pan)


def whoosh(dur=1.2, lo=200, hi=6000):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [lo, hi])
    shape = np.exp(-((tt - dur * 0.55) / (dur * 0.25)) ** 2)
    return filt(s * shape, "lowpass", 5000)


def braam(f=41.2, dur=2.6):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for r, g in ((1, 1.0), (1.5, 0.5), (2, 0.6), (3, 0.3), (4, 0.18)):
        ph = 2 * np.pi * f * r * tt
        s += (2 * ((ph / (2 * np.pi)) % 1) - 1) * g
    s = np.tanh(filt(s, "lowpass", 900, 2) * 1.6)
    return s * np.clip(tt / 0.04, 0, 1) * np.exp(-tt * 1.1)


def ding(f=1318.5, dur=1.2):
    return ting(f, dur) * 0.6 + ting(f * 1.5, dur) * 0.4


def pop(f=1046.5):
    s = ting(f, 0.25) * 0.3
    c = click(0.04, 2400) * 0.8
    s[: len(c)] += c[: len(s)]
    return s


def rise(dur=2.0, f0=220, f1=880):
    tt = tt_(dur)
    f = f0 * (f1 / f0) ** (tt / dur)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + 0.2 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return s * np.clip(tt / 0.1, 0, 1) * np.clip((dur - tt) / 0.08, 0, 1)


def hum(dur, f=58.0):
    tt = tt_(dur)
    s = np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 2.01 * tt) + 0.25 * np.sin(2 * np.pi * f * 3.02 * tt)
    s += filt(white(len(tt)), "bandpass", [300, 1800]) * 0.5
    return s * 0.3


def splash(dur=1.3):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [500, 7000]) * np.exp(-tt * 3.2) * np.clip(tt / 0.02, 0, 1)
    low = thump(90, 40, dur, decay=5, click=0.1)
    n = min(len(s), len(low))
    return s[:n] * 0.8 + low[:n] * 0.6


def crack(dur=0.9):
    tt = tt_(dur)
    s = filt(white(len(tt)), "highpass", 1500) * np.exp(-tt * 9)
    for k in range(5):
        at = int((0.05 + 0.11 * k) * SR)
        c = click(0.03, 3200 - 300 * k)
        s[at: at + len(c)] += c[: max(0, len(s) - at)] * 0.9
    return s


def synth_chord(notes, dur, bright=1400):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for f in notes:
        for det in (-0.004, 0.0, 0.004):
            ph = (f * (1 + det) * tt) % 1
            s += 2 * ph - 1
    s = filt(s / (len(notes) * 3), "lowpass", bright, 2)
    return s * np.clip(tt / 0.25, 0, 1) * np.clip((dur - tt) / 0.5, 0, 1)


def arp(notes, step, dur, bright=2600):
    out = np.zeros(int(dur * SR))
    n = int(dur / step)
    for k in range(n):
        f = notes[k % len(notes)]
        tt = tt_(step * 1.8)
        ph = (f * tt) % 1
        s = filt((2 * ph - 1) * 0.5 + np.sign(np.sin(2 * np.pi * f * tt)) * 0.2, "lowpass", bright, 2) * np.exp(-tt * 9)
        a = int(k * step * SR)
        b = min(len(out), a + len(s))
        out[a:b] += s[: b - a]
    return out


NEON = sfx("earth/neon")
CROWD = sfx("gta/crowd")
CHEER = sfx("bear/cheer")
SERVERS = sfx("gta/servers")
CITY = sfx("earth/city")
BUS = sfx("earth/bus")
TIRES = sfx("earth/tires")
CARS = sfx("earth/cars")
PLANE = sfx("grow/plane")
HUMS = sfx("scp/hum")
WIND = sfx("gta/wind")
FREEZE = sfx("gta/freeze")
SEASIDE = sfx("grow/seaside")
TSUNAMI = sfx("gta/tsunami")
PLOP = sfx("bear/plop")
HAMMER = sfx("bear/hammer")
IMPACT = sfx("gta/impact")


def span(name, upto=None):
    return (upto or END[name]) - S[name]


# 1. hook: night plaza, crowd murmur, neon, countdown
place(CROWD, 0.0, 0.2, length=ZERO + 0.2, fade_in=0.3, fade_out=0.3)
place(NEON, 0.0, 0.1, length=S["block"], fade_out=0.4)
mix.add(braam(36.7, 2.8), O + 0.05, 0.3)
mix.add(whoosh(0.7, 300, 5000), O + S["hook2"] - 0.35, 0.3)
for k, at in enumerate(TICKS):
    mix.add(click(0.03, 1800), O + at, 0.5)
    mix.add(beep(660, 0.12), O + at, 0.16)
mix.add(beep(1320, 0.5), O + ZERO, 0.22)
mix.add(thump(48, 28, 1.4, decay=2.6, click=0.3), O + ZERO, 0.6)
mix.add(braam(41.2, 2.2), O + ZERO, 0.28)
place(CHEER, ZERO, 0.4, length=S["block"] - ZERO + 0.5, fade_out=0.5)

# 2. block: windows switch on
n_pop = 22
for k in range(n_pop):
    at = WAVE[0] + (WAVE[1] - WAVE[0]) * (k / n_pop) ** 0.8
    mix.add(pop(660 + 40 * (k % 9)), O + at, 0.13, pan=((k * 7) % 11 - 5) / 7)
mix.add(rise(WAVE[1] - WAVE[0], 110, 330), O + WAVE[0], 0.14)
place(SERVERS, S["block"], 0.1, length=END["room"] - S["block"], fade_in=1.0, fade_out=0.3)

# 3. room: press play, the time-lapse
mix.add(click(0.04, 2200), O + PRESS, 0.7)
mix.add(ding(1567.98, 1.2), O + PRESS + 0.05, 0.25)
mix.add(ding(2093.0, 1.0), O + PRESS + 0.2, 0.18)
mix.add(whoosh(LAPSE[1] - LAPSE[0], 200, 4000), O + LAPSE[0], 0.22)
for k in range(7):
    mix.add(click(0.03, 3000 + 200 * (k % 3)), O + LAPSE[0] + 0.15 + k * (LAPSE[1] - LAPSE[0] - 0.3) / 7, 0.3, pan=(k % 3 - 1) * 0.5)

# 4. empty morning, bus, cockpit, office
place(CITY, S["empty"], 0.12, length=span("empty"), fade_in=0.3, fade_out=0.2)
place(WIND, S["empty"], 0.14, length=span("empty"), fade_in=0.3, fade_out=0.2)
for name, f in (("bus", 62), ("cockpit", 55), ("office", 49)):
    mix.add(thump(f, 30, 0.7, decay=5, click=0.35), O + S[name], 0.5)
place(BUS, S["bus"], 0.25, length=span("bus"), fade_out=0.1)
place(PLANE, S["cockpit"], 0.3, length=span("cockpit"), fade_out=0.1)
place(HUMS, S["office"], 0.2, length=span("office"), fade_out=0.15)
for k in range(3):
    mix.add(click(0.02, 1100), O + S["office"] + 0.25 + k * 0.5, 0.25)

# 5. jump + police
place(CARS, S["jump"], 0.22, length=span("jump"), fade_out=0.3)
place(TIRES, JUMP - 0.9, 0.4, length=1.4, fade_out=0.3)
mix.add(whoosh(1.2, 250, 5000), O + JUMP - 0.1, 0.4)
mix.add(thump(60, 32, 0.9, decay=4, click=0.5), O + LAND, 0.6)
place(IMPACT, LAND, 0.25, length=1.2, fade_out=0.5)
for k in range(3):
    mix.add(ding(1318.5 * (1 + 0.12 * k), 0.7), O + LAND + 0.25 + k * 0.16, 0.2)
place(HUMS, S["police"], 0.14, length=span("police"), fade_out=0.2)
for k in range(int(span("police") / 0.42)):
    mix.add(beep(740 if k % 2 == 0 else 590, 0.3), O + ALARM + k * 0.42, 0.11)
for k in range(18):
    mix.add(click(0.02, 2600 + (k % 5) * 200), O + S["police"] + 0.15 + k * 0.16, 0.12, pan=((k % 4) - 1.5) * 0.3)

# 6. heat, earth, penguin
x = hum(span("heat") + 0.3)
x *= np.linspace(0.5, 1.0, len(x))
mix.add(x, O + S["heat"], 0.45)
place(SERVERS, S["heat"], 0.3, length=span("heat") + 0.2, fade_in=0.2, fade_out=0.3)
mix.add(braam(32.7, 2.6), O + S["earth"], 0.25)
mix.add(rise(THERMO[1] - THERMO[0], 180, 720), O + THERMO[0], 0.16)
mix.add(ding(1760.0, 1.0), O + THERMO[1], 0.25)
place(WIND, S["penguin"], 0.2, length=span("penguin"), fade_in=0.1, fade_out=0.2)
mix.add(crack(), O + CALVE, 0.5)
mix.add(splash(1.4), O + CALVE + 0.55, 0.45)

# 7. miami: sea, the water comes
place(SEASIDE, S["miami"], 0.35, length=span("miami"), fade_in=0.2, fade_out=0.3)
place(TSUNAMI, RISE[0], 0.3, length=RISE[1] - RISE[0] + 0.6, fade_in=0.6, fade_out=0.6)

# 8. flood room + gator
for k in range(int((END["gator"] - S["flood"]) / 0.7)):
    mix.add(filt(white(int(0.5 * SR)), "bandpass", [300, 1400]) * np.hanning(int(0.5 * SR)), O + S["flood"] + 0.1 + k * 0.7, 0.07, pan=(k % 3 - 1) * 0.4)
mix.add(arp([523.25, 659.25, 783.99, 1046.5, 783.99, 659.25], 0.18, END["gator"] - S["flood"] - 0.4), O + S["flood"] + 0.2, 0.035)
mix.add(splash(1.2), O + GATOR_IN, 0.4)
place(PLOP, GATOR_IN + 0.75, 0.4, length=0.8)
mix.add(click(0.04, 2000), O + GRAB, 0.6)
mix.add(ding(1318.5, 0.9), O + GRAB + 0.05, 0.22)
mix.add(ding(1975.5, 0.9), O + GRAB + 0.2, 0.16)

# 9. raft, pc, build
place(SEASIDE, S["raft"], 0.22, skip=3.0, length=DUR - S["raft"], fade_in=0.4, fade_out=1.2)
place(WIND, S["raft"], 0.12, length=DUR - S["raft"], fade_in=0.4, fade_out=1.2)
mix.add(braam(30.9, 2.6), O + S["raft"], 0.22)
mix.add(beep(880, 0.12), O + PC_ON, 0.2)
mix.add(beep(1174.7, 0.2), O + PC_ON + 0.14, 0.2)
for k in range(8):
    place(HAMMER, S["build"] + 0.3 + k * 0.62, 0.22, pan=(k % 3 - 1) * 0.5, length=0.5)
mix.add(ting(659.3, 1.8), O + FINAL, 0.16)
mix.add(braam(27.5, 2.6), O + FINAL, 0.22)
mix.add(thump(50, 30, 1.0, decay=3, click=0.4), O + FINAL, 0.4)

# ---------------------------------------------------------------- bed: a soft synth pad in A minor + a low pulse
t = mix.t - O
CH = [
    [110.0, 164.81, 220.0, 261.63],   # Am
    [87.31, 130.81, 174.61, 220.0],   # F
    [130.81, 196.0, 261.63, 329.63],  # C
    [98.0, 146.83, 196.0, 246.94],    # G
]
bar = 3.6
pad = np.zeros(mix.n)
k = 0
at = 0.0
while at < DUR:
    x = synth_chord(CH[k % 4], bar + 0.6, 900)
    a = int((O + at) * SR)
    b = min(mix.n, a + len(x))
    pad[a:b] += x[: b - a]
    at += bar
    k += 1
level = np.interp(t, [0, S["block"], S["empty"], S["jump"], S["heat"], S["miami"], S["raft"], FINAL, DUR], [0.5, 0.7, 0.45, 0.6, 0.75, 0.6, 0.5, 0.6, 0.0])
base = drone([41.2, 61.7, 82.4], DUR + 1)[: mix.n]
rate = np.interp(t, [0, S["jump"], S["heat"], S["raft"], DUR], [2.0, 2.6, 2.2, 1.4, 1.0])
pulse = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(rate) / SR) ** 8
bed = filt(base * pulse, "lowpass", 700) * 0.3 + pad * 0.5
duck = 1 - 0.45 * mix.env(O + VO_AT, O + VO_END, 0.3, 0.6)
duck = np.clip(duck, 0.35, 1)
mix.l += bed * level * duck * 0.4
mix.r += bed * level * duck * 0.4

final = mix.write("gta6-day")

cues = {
    "duration": DUR,
    "shots": [[n, round(s, 3)] for n, s in SHOTS],
    "words": words,
    "phrases": [[round(a, 3), round(b, 3)] for a, b in PT],
    "ticks": TICKS,
    "zero": ZERO,
    "wave": list(WAVE),
    "press": PRESS,
    "lapse": list(LAPSE),
    "jump": JUMP,
    "land": LAND,
    "alarm": ALARM,
    "thermo": list(THERMO),
    "calve": CALVE,
    "rise": list(RISE),
    "gatorIn": GATOR_IN,
    "grab": GRAB,
    "pcOn": PC_ON,
    "final": FINAL,
}
(ROOT / "src/day").mkdir(exist_ok=True)
(ROOT / "src/day/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame) and src/day/cues.json")
for n, s in SHOTS:
    print(f"  {n:8s} {s:6.2f} – {END[n]:6.2f}  ({END[n] - s:.2f} s)")
