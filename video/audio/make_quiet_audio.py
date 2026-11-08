"""Soundtrack and timing cues for «Тихий этаж» (soft 3D night story, Russian VO, no music).

Voices: ONE take each, ElevenLabs Eleven v4: narrator «Mikhail - confident and emotional» (audio/voice/quiet-narrator.mp3),
the man at the door (quiet-man.mp3), the radio (quiet-radio1.mp3, quiet-radio2.mp3: band-limited + hiss here).
Word times: audio/voice/quiet-words.json (python3 audio/transcribe_quiet.py). All sound effects are synthesized.

Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30); the track gets 1/30 s in front.

Sync map (story time of the on-screen event <-> sound):
  CRUNCH    the head under the lamp starts to turn        <-> glass under Артём's boot
  TICK      the clock hand jumps (rule «не устают»)       <-> clock ticks
  TIP       the bin falls over                            <-> metal clang, then the shuffle of the crowd
  SCREAM    the screamer's mouth opens                    <-> scream with street echo
  HAMMER    each hammer hit (on the wind gusts)           <-> knock + wind gust
  KNOCKS    three knocks, then a pause (camera jolts)     <-> three door knocks
  TUG       the thread jerks Соня's wrist                 <-> thread twang
  HOWL      the man throws his head back                  <-> howl turning inhuman
  RADIO_ON  the dial lights up                            <-> switch click + hiss
  ASK       the last question appears                     <-> silence, wind only
"""

import json
import subprocess
from pathlib import Path

import numpy as np

from slime_lib import ROOT, SR, Mix, brown, click, fade_edges, filt, load, step, thump, tt_, white

OFF = 1 / 30
V = ROOT / "audio/voice"

NAR = load(V / "quiet-narrator.mp3")
MAN = load(V / "quiet-man.mp3")
R1P = V / "quiet-radio1.mp3"
RADIO1 = load(R1P) if R1P.exists() else None
RADIO2 = load(V / "quiet-radio2.mp3")
WH = json.loads((V / "quiet-words.json").read_text())

# the first radio message is not recorded yet: keep its slot at the expected length
# the long pause in the take (6.2–8.0) is cut to 0.9 s: two pieces
R1_LEN = (6.2 + 0.9 + (11.98 - 8.02)) if RADIO1 is not None else 8.6
D = round(R1_LEN - 8.6, 3)  # everything after the first radio message moves by this


def after(t):
    return round(t + D, 3)


SHOTS = [
    ("door", 0.0), ("pull", 7.0), ("turn", 10.4), ("rNoise", 17.6), ("rTire", 22.0), ("rHabit", 24.2),
    ("rCount", 27.6), ("rScream", 31.2), ("palm", 35.2), ("pharmacy", 41.6), ("detour", 51.6), ("note", 55.0),
    ("pWater", 61.0), ("pDoor", 63.0), ("pWin", 64.45), ("pLadder", 65.9), ("pThread", 67.35), ("pExit", 68.8),
    ("pFood", 70.25), ("knock", 71.7), ("slit", 77.8), ("whisper", 85.8), ("crowd", 92.0), ("radio", 99.4),
    ("wall", after(110.2)), ("dawn", after(116.4)), ("change", after(124.0)), ("palm2", after(133.8)), ("road", after(138.8)),
]
DUR = after(146.0)

# take, (start, end) in the take, where it goes on the timeline, the caption text, who speaks
PIECES = [
    ("narrator", 0.00, 3.40, 0.3, "Последний заказ. Тихая, девять.", "n"),
    ("narrator", 3.76, 6.90, 3.9, "Никто не открывает. Сирены давно стихли.", "n"),
    ("narrator", 7.32, 10.24, 7.2, "А под фонарём стоит человек. И не двигается.", "n"),
    ("narrator", 11.04, 15.02, 11.2, "Потом он медленно поворачивает голову. На звук шагов.", "n"),
    ("narrator", 15.76, 18.30, 17.7, "За первую ночь Артём выучил правила.", "n"),
    ("narrator", 18.78, 20.60, 19.9, "Они идут на шум и на свет.", "n"),
    ("narrator", 20.86, 21.62, 22.1, "Не устают.", "n"),
    ("narrator", 22.04, 23.10, 24.3, "Помнят привычки.", "n"),
    ("narrator", 23.52, 26.70, 27.7, "Один шум зовёт десять, десять зовут сто.", "n"),
    ("narrator", 27.32, 28.70, 31.3, "А хуже всех крикуны.", "n"),
    ("narrator", 28.72, 34.26, 35.5, "Артём пишет на ладони: не шуми, не свети, не бери лишнего.", "n"),
    ("narrator", 35.08, 38.80, 41.9, "В аптеке сидит Соня. Ей двенадцать, она не слышит.", "n"),
    ("narrator", 39.14, 41.90, 45.8, "Зато тень и дрожь двери замечает первой.", "n"),
    ("narrator", 42.24, 44.60, 48.8, "Он её уши, она его глаза.", "n"),
    ("narrator", 45.24, 50.30, 55.4, "В коробке записка: «Включай в три ночи. Частота девяносто один и четыре».", "n"),
    ("narrator", 50.96, 52.60, 61.1, "До трёх они готовят дом.", "n"),
    ("narrator", 53.12, 54.90, 71.9, "В два часа в дверь стучат.", "n"),
    ("narrator", 55.18, 56.70, 75.7, "Три раза. Пауза.", "n"),
    ("man", 0.00, 3.02, 78.1, "Откройте… Я успел дойти.", "man"),
    ("narrator", 56.82, 59.20, 81.4, "На запястье у него свежий укус.", "n"),
    ("narrator", 59.48, 60.90, 84.1, "Артём не открывает.", "n"),
    ("man", 4.52, 7.14, 86.1, "Не верь… третьему повтору.", "man"),
    ("narrator", 61.36, 63.90, 92.8, "Через минуту у двери стоят десятки.", "n"),
    ("narrator", 64.24, 66.40, 96.5, "Они просто стоят. И ждут.", "n"),
    ("radio1", 0.00, 6.20, 101.0, "Всем, кто слышит. Лагерь в сорока километрах к северу. Ворота открыты.", "radio"),
    ("radio1", 8.02, 11.98, 101.0 + 6.2 + 0.9, "Ищем детей. Соня Миронова, двенадцать лет.", "radio"),
    ("narrator", 66.98, 71.96, after(110.4), "Радио назвало Соню. Она не слышит. Артём пишет это на стене.", "n"),
    ("narrator", 72.56, 74.60, after(116.6), "На рассвете они расходятся.", "n"),
    ("narrator", 74.66, 79.30, after(119.0), "А радио в третий раз повторяет сообщение. Только одно слово другое.", "n"),
    ("radio2", 0.00, 4.80, after(124.2), "Лагерь в сорока километрах к северу. Ворота закрываются.", "radio"),
    ("narrator", 79.66, 83.60, after(129.5), "Артём помнит шёпот у двери. Но Соню ищут там.", "n"),
    ("narrator", 84.22, 88.20, after(134.0), "Артём стирает с ладони «не бери лишнего». Пишет «идём».", "n"),
    ("narrator", 88.88, 90.75, after(139.4), "И они уходят на север.", "n"),
]


def radio_fx(x):
    """Band-limited, slightly crushed, with hiss under it."""
    y = filt(x, "bandpass", [320, 3200])
    y = np.tanh(y * 3.0) / 1.6
    return y


def door_fx(x):
    """The man is behind a door: duller."""
    return filt(x, "lowpass", 2600) * 1.1


TAKES = {"narrator": NAR, "man": door_fx(MAN), "radio1": radio_fx(RADIO1) if RADIO1 is not None else None, "radio2": radio_fx(RADIO2)}
GAIN = {"narrator": 1.0, "man": 1.0, "radio1": 0.9, "radio2": 0.9}
WTAKE = {"narrator": "narrator", "man": "man", "radio1": "radio1", "radio2": "radio2"}


def edge(t, d, x, thr=0.004, quiet=0.06):
    """From t, step in direction d (−1 back, +1 forward) until there is `quiet` seconds of silence; keep 30 ms of it."""
    w = int(0.01 * SR)
    k = 0
    run = 0
    while k < 40:
        c = t + d * k * 0.01
        seg = x[max(0, int(c * SR) - (w if d < 0 else 0)): max(0, int(c * SR) + (0 if d < 0 else w))]
        if len(seg) == 0:
            return max(0.0, c)
        run = run + 1 if np.sqrt((seg ** 2).mean()) < thr else 0
        if run * 0.01 >= quiet:
            return max(0.0, c - d * (quiet - 0.03))
        k += 1
    return max(0.0, t + d * 0.4)


mix = Mix(DUR + OFF + 0.6)
O = OFF
voice = np.zeros(mix.n)
words = []  # [start, end, token, group, speaker]
groups = []
radio_spans = []
for k, (take, a, b, at, text, who) in enumerate(PIECES):
    x = TAKES[take]
    toks = text.split(" ")
    if x is not None:
        a0, b0 = edge(a, -1, x), min(len(x) / SR, edge(b, 1, x))
        seg = fade_edges(x[int(a0 * SR): int(b0 * SR)], 10) * GAIN[take]
        i = int((O + at - (a - a0)) * SR)
        voice[i: i + len(seg)] += seg[: mix.n - i]
    ws = [w for w in WH.get(WTAKE[take], []) if w[1] > a + 0.05 and w[0] < b - 0.1 and any(ch.isalnum() for ch in w[2])]
    starts = [max(at, at + w[0] - a) for w in ws]
    if len(starts) != len(toks):
        print("token mismatch in piece", k, [w[2] for w in ws], toks)
        starts = [at + (b - a) * j / len(toks) for j in range(len(toks))]
    for j, tok in enumerate(toks):
        end = starts[j + 1] if j + 1 < len(toks) else at + (b - a)
        words.append([round(starts[j], 3), round(end, 3), tok, k, who])
    groups.append(k)
    if who == "radio":
        radio_spans.append((at, at + (b - a)))
mix.add(voice, 0, 1.0)

# ---------------------------------------------------------------- event cues (story time)
CRUNCH = 10.75
TICK = 22.3
TIP = 27.75
SCREAM = 32.5
HAMMER = [63.45, 64.0]
KNOCKS = [74.0, 74.45, 74.9]
TUG = 75.45
HOWL = [89.2, 90.9]
RADIO_ON = 99.95
TITLE = 15.3
ASK = after(142.0)

rng_ = np.random.default_rng(7)
sh = dict(SHOTS)
names = [n for n, _ in SHOTS]


def span(name):
    i = names.index(name)
    return sh[name], (SHOTS[i + 1][1] if i + 1 < len(SHOTS) else DUR)


def place(sig, at, gain, pan=0.0):
    mix.add(sig, O + at, gain, pan)


def crunch(dur=0.35):
    tt = tt_(dur)
    grains = (rng_.random(len(tt)) > 0.992) * rng_.uniform(0.3, 1, len(tt))
    g = np.convolve(grains, np.exp(-np.arange(120) / 12), "same")
    return filt(white(len(tt)) * g, "bandpass", [1500, 9000]) * 3 * np.exp(-tt * 6)


def knock():
    s = thump(170, 110, 0.3, decay=20, click=1.6)
    return s + filt(white(len(s)), "bandpass", [400, 2500]) * np.exp(-tt_(0.3) * 30) * 0.7


def clang(dur=1.4):
    tt = tt_(dur)
    s = sum(np.sin(2 * np.pi * f * tt + p) * np.exp(-tt * d) for f, p, d in [(410, 0, 3), (1033, 1, 4), (1710, 2, 6), (2460, 0.5, 8)])
    hit = filt(white(len(tt)), "bandpass", [800, 6000]) * np.exp(-tt * 40)
    return (s * 0.3 + hit) * 0.8


def scream(dur=2.2, f0=520):
    tt = tt_(dur)
    f = f0 + 260 * np.sin(np.pi * tt / dur) + 30 * np.sin(2 * np.pi * 7 * tt)
    ph = 2 * np.pi * np.cumsum(f) / SR
    src = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph) + filt(white(len(tt)), "bandpass", [1500, 6000]) * 0.8
    env = np.clip(tt / 0.1, 0, 1) * np.clip((dur - tt) / 0.6, 0, 1)
    return np.tanh(filt(src, "bandpass", [300, 5000]) * 1.8) * env


def howl(dur=1.6, f0=180, inhuman=0.0):
    tt = tt_(dur)
    f = f0 + 140 * np.sin(np.pi * tt / dur) * (1 + inhuman) - 40 * tt
    ph = 2 * np.pi * np.cumsum(f) / SR
    src = np.sin(ph) + 0.6 * np.sin(2 * ph) + 0.4 * np.sign(np.sin(3 * ph)) * inhuman + filt(white(len(tt)), "lowpass", 2500) * (0.3 + 0.6 * inhuman)
    env = np.clip(tt / 0.15, 0, 1) * np.clip((dur - tt) / 0.5, 0, 1)
    return np.tanh(filt(src, "bandpass", [120, 3500]) * 2) * env


def echo(x, delays=(0.21, 0.43, 0.71), gains=(0.45, 0.3, 0.18)):
    n = len(x) + int(max(delays) * SR) + 1
    y = np.zeros(n)
    y[: len(x)] += x
    for d, g in zip(delays, gains):
        i = int(d * SR)
        y[i: i + len(x)] += filt(x, "lowpass", 2500) * g
    return y


def shuffle(dur, dens=1.0):
    """Dragging feet: soft scrapes at random."""
    tt = tt_(dur)
    s = np.zeros(len(tt))
    t = 0.0
    while t < dur - 0.4:
        sc = filt(white(int(0.35 * SR)), "bandpass", [300, 2500]) * np.sin(np.pi * tt_(0.35) / 0.35) ** 2
        i = int(t * SR)
        s[i: i + len(sc)] += sc[: len(s) - i] * rng_.uniform(0.3, 1)
        t += rng_.uniform(0.15, 0.6) / dens
    return s * 0.6


def wind(dur, k=1.0):
    tt = tt_(dur)
    w = filt(brown(len(tt)), "bandpass", [120, 900]) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.09 * tt + 1) * np.sin(2 * np.pi * 0.031 * tt))
    return w * k


def gust(dur=1.4):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [300, 2200]) * np.sin(np.pi * tt / dur) ** 2 * 0.7


def splash(dur):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [600, 5000]) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 5.3 * tt))) * np.clip(tt / 0.2, 0, 1) * 0.35


def creak(dur=0.7, f0=320):
    tt = tt_(dur)
    f = f0 * (1 + 0.3 * np.sin(np.pi * tt / dur))
    ph = 2 * np.pi * np.cumsum(f) / SR
    grain = (np.sin(2 * np.pi * 38 * tt) > 0.2).astype(float)
    return filt(np.sin(ph) * grain, "bandpass", [200, 2000]) * np.sin(np.pi * tt / dur) * 0.5


def marker(dur):
    tt = tt_(dur)
    strokes = (np.sin(2 * np.pi * 3.2 * tt) > -0.2).astype(float)
    return filt(white(len(tt)), "bandpass", [2500, 7000]) * strokes * 0.25


def hiss(dur):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [1500, 7000]) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * tt))


def birds(dur, dens=1.0):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    t = 0.3
    while t < dur - 0.5:
        n = int(rng_.integers(2, 5))
        f0 = rng_.uniform(2600, 4600)
        for j in range(n):
            ct = tt_(0.09)
            fr = f0 * (1 + 0.25 * np.sin(np.pi * ct / 0.09)) * (1 - 0.1 * j)
            c = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.sin(np.pi * ct / 0.09) ** 2
            i = int((t + j * 0.11) * SR)
            s[i: i + len(c)] += c[: len(s) - i] * rng_.uniform(0.4, 1)
        t += rng_.uniform(0.7, 2.0) / dens
    return filt(s, "highpass", 1500) * 0.5


def steps(dur, every, gain=1.0):
    s = np.zeros(int(dur * SR))
    t = 0.1
    while t < dur - 0.3:
        st = step(0.22)
        i = int(t * SR)
        s[i: i + len(st)] += st[: len(s) - i] * gain * rng_.uniform(0.7, 1)
        t += every
    return s


# --- a bed of night air for the whole film: wind + far hum of an empty city; inside the house it is duller
inside = ["pWater", "pDoor", "pWin", "pLadder", "pThread", "pFood", "radio", "wall", "change"]
night = wind(DUR + 1.0) + filt(brown(int((DUR + 1.0) * SR)), "lowpass", 90) * 0.5
lvl = np.ones(mix.n)
for n in inside:
    a, b = span(n)
    lvl -= 0.55 * mix.env(O + a, O + b, 0.05, 0.05)
for n in ["palm", "palm2"]:
    a, b = span(n)
    lvl -= 0.3 * mix.env(O + a, O + b, 0.05, 0.05)
bed = night[: mix.n] * lvl * 0.16
mix.l += bed
mix.r += bed

# --- 1. the door: his steps, the doorbell knock, the traffic light clicking
a, b = span("door")
place(steps(1.2, 0.45, 0.5), a, 0.25)
for k, at in enumerate([1.25, 1.7]):
    place(knock(), a + at, 0.3)
for k in range(int((sh["rNoise"]) / 1.0)):
    place(click(0.02, 1800), k * 1.0 + 0.5, 0.05, pan=0.5)  # the blinking traffic light
place(crunch(), CRUNCH, 0.7, pan=-0.1)
# a shuffling foot as he turns
place(shuffle(1.5, 0.6), CRUNCH + 0.6, 0.25, pan=0.3)

# --- rules: car alarm light (no siren, just the blinking click), shuffling crowd
a, b = span("rNoise")
place(shuffle(b - a, 2.2), a, 0.45)
for k in range(int((b - a) / 0.5)):
    place(click(0.02, 2600), a + k * 0.5, 0.06, pan=-0.3)
a, b = span("rTire")
for k in range(int((b - a) / 0.5)):
    place(click(0.015, 4200 if k % 2 else 3600), TICK - 0.3 + k * 0.5, 0.12)  # the clock
place(shuffle(b - a, 0.8), a, 0.3)
a, b = span("rHabit")
place(shuffle(b - a, 1.8), a, 0.4)
place(clang(1.4), TIP, 0.55, pan=-0.2)
a, b = span("rCount")
place(shuffle(b - TIP, 4.0) * np.clip(tt_(b - TIP) / 1.2, 0, 1), TIP + 0.3, 0.6)
place(echo(scream(2.2)), SCREAM, 0.5)
a, b = span("rScream")
place(shuffle(b - SCREAM - 0.4, 2.0), SCREAM + 0.6, 0.35)
a, b = span("palm")
place(marker(b - a - 1.2), a + 0.6, 0.6)

# --- the pharmacy: glass underfoot, a passer outside; the detour: a far screamer they avoid
a, b = span("pharmacy")
place(crunch(0.3), a + 0.4, 0.3)
place(shuffle(4.0, 0.9), a + (b - a) * 0.5, 0.3, pan=0.4)
a, b = span("detour")
place(steps(b - a, 0.38, 0.5), a, 0.2)
place(shuffle(b - a, 0.8), a, 0.2, pan=-0.4)
a, b = span("note")
place(filt(white(int(0.5 * SR)), "bandpass", [1500, 5000]) * np.sin(np.pi * tt_(0.5) / 0.5) * 0.4, a + 0.6, 0.4)  # flaps

# --- the house montage
a, b = span("pWater")
place(splash(b - a + 0.2), a, 0.5)
for at in HAMMER:
    place(gust(1.6), at - 0.6, 0.6)
    place(knock(), at, 0.55)
a, b = span("pWin")
place(filt(white(int(1.0 * SR)), "lowpass", 900) * np.sin(np.pi * tt_(1.0)) * 0.4, a + 0.2, 0.5)  # blanket
a, b = span("pLadder")
place(creak(0.9), a + 0.3, 0.6)
place(creak(0.6, 260), a + 1.0, 0.4)
a, b = span("pThread")
place(creak(0.3, 900) * 0.6, a + 0.6, 0.4)
a, b = span("pExit")
place(creak(0.8, 200), a + 0.3, 0.5)
a, b = span("pFood")
place(click(0.04, 1200), a + 0.2, 0.3)

# --- 02:00: three knocks, the pause; the thread
for at in KNOCKS:
    place(knock(), at, 0.9)
place(creak(0.2, 1400), TUG, 0.4)
a, b = span("slit")
place(filt(white(int(0.6 * SR)), "lowpass", 700) * np.sin(np.pi * tt_(0.6) / 0.6) * 0.5, a + 1.0, 0.4)  # boards
place(howl(1.6, 170, 0.15), HOWL[0], 0.75)
place(echo(howl(1.9, 140, 1.0)), HOWL[1], 0.8)
a, b = span("whisper")
place(shuffle(b - HOWL[0] - 0.3, 1.5), HOWL[0] + 0.6, 0.35)
a, b = span("crowd")
place(shuffle(b - a, 5.0) * np.clip((b - a - tt_(b - a)) / 2.5, 0, 1), a, 0.7)

# --- 03:00 the radio: click, hiss under the voice, the marker on the wall
place(click(0.06, 900) + thump(300, 200, 0.06, decay=60, click=1.0) * 0.4, RADIO_ON, 0.6)
a, b = span("radio")
place(hiss(b - RADIO_ON) * 0.25, RADIO_ON + 0.05, 0.25)
a, b = span("wall")
place(marker(3.2), a + 0.2, 0.7)
place(hiss(b - a) * 0.25, a, 0.12)

# --- dawn: birds, the crowd going away; the radio again
a, b = span("dawn")
db = DUR - a
place(birds(db, 0.7), a, 0.35)
place(shuffle(5.0, 2.0) * np.clip((5.0 - tt_(5.0)) / 3.0, 0, 1), a, 0.35)
place(hiss(span("change")[1] - (a + 3.4)) * 0.25, a + 3.4, 0.2)
a, b = span("palm2")
place(filt(white(int(1.8 * SR)), "bandpass", [600, 2500]) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 7 * tt_(1.8)))) * 0.25, a + 0.4, 0.4)  # rubbing
place(marker(1.4), a + 3.0, 0.6)
a, b = span("road")
place(steps(b - a - 1.0, 0.42, 0.6), a + 0.3, 0.28)
place(steps(b - a - 1.0, 0.36, 0.4), a + 0.5, 0.2)

# the radio voices sit in their own hiss
for (s0, s1) in radio_spans:
    place(hiss(s1 - s0 + 0.4) * 0.3, s0 - 0.2, 0.25)

# ---------------------------------------------------------------- write
final = mix.write("quiet-floor")

cues = {
    "duration": DUR,
    "shots": [[n, s] for n, s in SHOTS],
    "words": words,
    "groups": groups,
    "crunch": CRUNCH, "knocks": KNOCKS, "tug": TUG, "howl": HOWL, "tip": TIP, "scream": SCREAM, "tick": TICK,
    "hammer": HAMMER, "radioOn": RADIO_ON, "title": TITLE, "ask": ASK,
}
(ROOT / "src/quiet/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame) and src/quiet/cues.json; radio1 {'recorded' if RADIO1 is not None else 'MISSING (slot kept)'}")
