"""Soundtrack and timing cues for «Кто весит больше: мать Габена или мать Нолана?» (Russian TikTok meme, soft toy 3D).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant», text /mnt/project-files/voice/nolan/nolan-vo-text.txt
(Cyrillic vowels + combining U+0301 stress marks). Expected file: audio/voice/nolan-vo.mp3,
word times audio/voice/nolan-words.json (audio/transcribe_nolan.py).

Every shot and event hangs on a caption phrase (P[k].s / P[k].e). Without the take (draft) phrase times are estimates
and the take is left out of the mix. Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30).

Sync map (story time of the on-screen event <-> sound):
  LAND        both slippers land in the intro, the floor cracks     <-> two thumps + crack
  STOMP       both stomp the bathroom scales, springs fly           <-> double thump + boings + error beeps
  DRAW        «НИЧЬЯ» plate                                         <-> soft ting
  BOAT_IN     the pink slipper steps into the dinghy                <-> rubber squeak
  SINK        the dinghy goes under                                 <-> bubbles / glug
  STEP_SEA    the blue slipper steps into the sea                   <-> splash
  FLOOD       the water climbs up Venice                            <-> tsunami rush
  SCORE_k     the score changes                                     <-> score ding
  SPOONS      spoons fly to the leopard robe                        <-> clinks, one per spoon
  MOON        the Moon leaves its orbit and comes to her           <-> deep whoosh + braam
  HOP         the pink slippers land a small hop                    <-> small thump
  BIG_LAND    the giant blue slipper lands on the Earth            <-> boom
  GLUE        the continents meet                                   <-> heavy thump + rumble
  CHECK       telescope: «найдена целиком ✓»                        <-> ding
  SEARCH      telescope pans along the endless flowers              <-> servo hum + ticks
  STEP_ON     both step on the cosmic balance                       <-> clank
  LAUNCH      the left pan shoots up, Nolan's mom flies off         <-> creak + whoosh
  WIN         «ПОБЕДИТЕЛЬ: МАТЬ ГАБЕНА»                             <-> cheer + braam
"""

import json
import sys
from pathlib import Path

import numpy as np

from slime_lib import ROOT, SR, Mix, beep, click, drone, filt, load, thump, ting, tt_, white

OFF = 1 / 30
VO_AT = 0.2
VO_PATH = ROOT / "audio/voice/nolan-vo.mp3"
WORDS_PATH = ROOT / "audio/voice/nolan-words.json"

PHRASES = [
    ("Кто весит больше: мать Габена или мать Нолана?", 3.2),  # 0
    ("Проверим.", 0.9),  # 1
    ("Напольные весы.", 1.3),  # 2
    ("Обе сломали их с первого шага.", 2.0),  # 3
    ("Ничья.", 0.8),  # 4
    ("Море.", 0.7),  # 5
    ("Мать Габена села в лодку — лодка утонула.", 2.8),  # 6
    ("Мать Нолана зашла в море — и Венеция ушла под воду.", 3.3),  # 7
    ("Гравитация.", 0.9),  # 8
    ("К матери Нолана прилипают ложки.", 2.1),  # 9
    ("К матери Габена прилетела Луна.", 2.1),  # 10
    ("Прыжок.", 0.7),  # 11
    ("Мать Габена подпрыгнула — землетрясение в три балла.", 3.2),  # 12
    ("Мать Нолана подпрыгнула — Европа и Америка склеились в один материк.", 4.2),  # 13
    ("Телескоп.", 0.8),  # 14
    ("Мать Нолана учёные увидели целиком.", 2.2),  # 15
    ("Где кончается мать Габена — до сих пор не нашли.", 2.9),  # 16
    ("Счёт два — два.", 1.2),  # 17
    ("Финал: одни весы на двоих.", 2.0),  # 18
    ("Мать Нолана улетела на орбиту.", 2.0),  # 19
    ("Теперь у матери Габена две Луны.", 2.1),  # 20
    ("И это она ещё стояла на одной ноге.", 2.3),  # 21
]
GAP = 0.35
LONG_GAP = {1: 0.3, 4: 0.2, 7: 0.2, 10: 0.2, 13: 0.2, 16: 0.2, 18: 0.6, 19: 0.3, 20: 0.4}

HAVE_VO = VO_PATH.exists() and WORDS_PATH.exists() and "--draft" not in sys.argv

# measured phrase windows in take time (from whisper, once the take exists)
MEASURED: list[tuple[float, float]] = [
    (0.0, 3.72), (4.44, 5.06), (5.62, 6.88), (7.44, 9.66), (10.14, 10.64), (11.46, 11.72), (12.36, 15.68), (16.26, 20.08), (20.74, 21.42), (21.98, 24.08), (24.54, 26.82), (26.82, 27.98), (28.5, 32.16), (32.72, 37.38), (37.98, 38.52), (39.0, 41.52), (42.14, 45.32), (45.9, 47.14), (47.68, 49.98), (50.9, 53.58), (54.14, 56.68), (57.96, 60.2),
]  # take Y5bHwYiaPb84qRgxgWYu (flow klo0PhLzYKuVnayx1q36, 818 credits), 60.5 s

if HAVE_VO and MEASURED:
    PT = [(VO_AT + a, VO_AT + b) for a, b in MEASURED]
else:
    PT = []
    t = VO_AT
    for k, (_, d) in enumerate(PHRASES):
        PT.append((round(t, 3), round(t + d, 3)))
        t += d + GAP + LONG_GAP.get(k, 0)


class _P:
    def __init__(self, k):
        self.s, self.e = PT[k]


P = [_P(k) for k in range(len(PHRASES))]
VO_END = P[-1].e
WH = json.loads(WORDS_PATH.read_text()) if HAVE_VO else []


def word_at(k, prefix, frac):
    """story time of the first word in phrase k that starts with prefix (whisper), else a fraction of the phrase"""
    a, b = PT[k]
    for w in WH:
        if a - VO_AT - 0.05 <= w[0] < b - VO_AT and w[2].lower().strip(" ,.—-«»").startswith(prefix):
            return VO_AT + w[0]
    return a + (b - a) * frac


# ---------------------------------------------------------------- shots
VENICE = word_at(7, "венец", 0.6) - 0.35
SHOTS = [
    ("intro", 0.0),
    ("scales", P[2].s - 0.1),
    ("boat", P[5].s - 0.1),
    ("beach", P[7].s - 0.1),
    ("venice", VENICE),
    ("spoons", P[8].s - 0.1),
    ("moon", P[10].s - 0.1),
    ("quake", P[11].s - 0.1),
    ("globe", P[13].s - 0.1),
    ("scope", P[14].s - 0.1),
    ("scopeN", P[15].s + 0.35),
    ("scopeG", P[16].s - 0.05),
    ("final", P[17].s - 0.1),
    ("moons", P[20].s - 0.1),
    ("leg", P[21].s + 0.05),
]

LAND = P[0].s + 0.45
STOMP = word_at(3, "шаг", 0.8)
DRAW = P[4].s
BOAT_IN = P[6].s + 0.5
SINK = (word_at(6, "лодка", 0.55) + 0.05 if len(WH) else P[6].s + 1.5, P[6].e + 0.4)
STEP_SEA = word_at(7, "зашла", 0.3) + 0.15
FLOOD = (VENICE + 0.2, P[7].e + 0.5)
SCORE = [P[4].s + 0.05, P[7].e + 0.25, P[10].e + 0.35, P[13].e + 0.25, P[16].e + 0.25]
SPOONS = [P[9].s + 0.7 + 0.22 * k for k in range(6)]
MOON = (P[10].s + 0.35, P[10].e + 0.4)
HOP = word_at(12, "подпрыг", 0.3) + 0.55
BIG_LAND = word_at(13, "подпрыг", 0.3) + 0.6
GLUE = word_at(13, "склеил", 0.7) + 0.15
CHECK = P[15].e - 0.25
SEARCH = (P[16].s, P[16].e + 0.4)
STEP_ON = word_at(18, "весы", 0.6)
LAUNCH = P[19].s + 0.15
WIN = P[21].e + 0.25
DUR = round(WIN + 2.6, 2)

# ---------------------------------------------------------------- caption words
words = []
for k, (text, _) in enumerate(PHRASES):
    a, b = PT[k]
    toks = [x for x in text.split(" ") if x != "—"]
    ws = [w for w in WH if a - VO_AT - 0.05 <= w[0] < b - VO_AT]
    if len(ws) == len(toks):
        starts = [VO_AT + w[0] for w in ws]
        end_of = VO_AT + ws[-1][1]
    else:
        lens = np.cumsum([0] + [len(x) + 2 for x in toks])
        starts = [a + (b - a) * lens[j] / lens[-1] for j in range(len(toks))]
        end_of = b
    # keep the dash visually: glue it to the word before
    shown = []
    src = text.split(" ")
    j = 0
    for tok in src:
        if tok == "—":
            shown[-1] += " —"
        else:
            shown.append(tok)
    for j, tok in enumerate(shown):
        end = starts[j + 1] if j + 1 < len(shown) else end_of
        words.append([round(starts[j], 3), round(end, 3), tok, k])
# short phrases share a caption with the next one
GROUPS = [[0], [1], [2, 3], [4], [5, 6], [7], [8, 9], [10], [11, 12], [13], [14, 15], [16], [17, 18], [19], [20], [21]]

mix = Mix(DUR + OFF + 0.6)
O = OFF
if HAVE_VO:
    mix.add(load(VO_PATH), O + VO_AT, 1.0)


def sfx(path):
    return load(ROOT / f"audio/sfx/{path}.mp3")


def place(x, at, gain, pan=0.0, fade_out=None, length=None, skip=0.0, fade_in=None):
    x = x[int(skip * SR):]
    if length is not None:
        x = x[: int(length * SR)]
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


def boing(f0=180, f1=520, dur=0.5):
    tt = tt_(dur)
    f = f0 + (f1 - f0) * (1 - np.exp(-tt * 9))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + 0.5 * np.sin(2 * np.pi * 28 * tt))
    return s * 0.4 * np.exp(-tt * 5)


def err_blip(f=220, dur=0.16):
    tt = tt_(dur)
    s = np.sign(np.sin(2 * np.pi * f * tt)) * 0.4
    return filt(s, "lowpass", 1800) * np.clip((dur - tt) / 0.03, 0, 1)


def squeak(dur=0.35):
    tt = tt_(dur)
    f = 900 + 500 * np.sin(np.pi * tt / dur)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 40 * tt))
    return filt(s, "bandpass", [500, 3000]) * np.sin(np.pi * tt / dur) * 0.4


def bubbles(dur=1.6, n=14, seed=3):
    rng = np.random.default_rng(seed)
    out = np.zeros(int(dur * SR))
    for _ in range(n):
        at = rng.uniform(0, dur - 0.12)
        d = rng.uniform(0.05, 0.11)
        f0 = rng.uniform(300, 700)
        tt = tt_(d)
        f = f0 * (1 + 2.5 * tt / d)
        b = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) * rng.uniform(0.3, 0.7)
        i = int(at * SR)
        out[i : i + len(b)] += b[: len(out) - i]
    return out * 0.5


def servo(dur=2.0):
    tt = tt_(dur)
    f = 180 + 30 * np.sin(2 * np.pi * 0.7 * tt)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + filt(white(len(tt)), "bandpass", [800, 2400]) * 0.08
    return s * np.clip(tt / 0.15, 0, 1) * np.clip((dur - tt) / 0.2, 0, 1)


SLIPPERS = sfx("murino/slippers")
CREAK = sfx("grow/creak")
SEASIDE = sfx("grow/seaside")
TSUNAMI = sfx("gta/tsunami")
SPLAT = sfx("grow/splat")
PLOP = sfx("bear/plop")
RUMBLE = sfx("earth/rumble")
DEBRIS = sfx("earth/debris")
BOOM = sfx("earth/boom")
MOONS = sfx("gta/moon")
CHEER = sfx("bear/cheer")
CROWD = sfx("bear/crowd")
WIND = sfx("gta/wind")
HUM = sfx("scp/hum")
IMPACT = sfx("gta/impact")
GLASS = sfx("earth/glass")

S = dict(SHOTS)
END = {n: (SHOTS[i + 1][1] if i + 1 < len(SHOTS) else DUR) for i, (n, _) in enumerate(SHOTS)}

# 1. intro: two heavy steps on a stage, the floor cracks
place(CROWD, 0.0, 0.12, length=END["intro"], fade_in=0.2, fade_out=0.4)
mix.add(thump(58, 30, 1.0, decay=3.5, click=0.3), O + LAND, 0.5, pan=-0.3)
mix.add(thump(55, 28, 1.0, decay=3.5, click=0.3), O + LAND + 0.12, 0.5, pan=0.3)
place(CREAK, LAND + 0.1, 0.3, length=1.2, fade_out=0.4)

# 2. scales: a bathroom (drip), both stomp, springs fly, error beeps, draw
mix.add(thump(62, 32, 0.8, decay=5, click=0.4), O + STOMP, 0.55)
place(GLASS, STOMP, 0.15, length=0.8, fade_out=0.3)
for i in range(5):
    mix.add(boing(160 + 40 * i, 480 + 60 * i, 0.45), O + STOMP + 0.05 + 0.07 * i, 0.22, pan=(i - 2) * 0.35)
for i in range(3):
    mix.add(err_blip(300 - 40 * i), O + STOMP + 0.55 + 0.22 * i, 0.14, pan=-0.3)
    mix.add(err_blip(300 - 40 * i), O + STOMP + 0.6 + 0.22 * i, 0.14, pan=0.3)
mix.add(ding(988.0, 1.0), O + DRAW, 0.18)

# 3. sea: waves, the dinghy squeaks and sinks, the blue slipper splashes, Venice floods
place(SEASIDE, S["boat"], 0.3, length=S["spoons"] - S["boat"], fade_in=0.3, fade_out=0.5)
mix.add(squeak(0.4), O + BOAT_IN, 0.35)
mix.add(bubbles(SINK[1] - SINK[0] + 0.4), O + SINK[0], 0.4)
place(PLOP, SINK[0] + 0.3, 0.25, length=0.8)
place(SPLAT, STEP_SEA - 0.05, 0.4, length=1.0, fade_out=0.3)
place(TSUNAMI, FLOOD[0] - 0.4, 0.4, length=FLOOD[1] - FLOOD[0] + 0.8, fade_in=0.3, fade_out=0.6)

# 4. gravity: spoons clink; the Moon swings over
for i, at in enumerate(SPOONS):
    mix.add(ting(2400 + 180 * (i % 3), 0.45) * 0.6, O + at, 0.25, pan=((i % 3) - 1) * 0.4)
place(MOONS, S["moon"], 0.25, length=END["moon"] - S["moon"] + 0.4, fade_in=0.3, fade_out=0.5)
mix.add(whoosh(MOON[1] - MOON[0], 80, 1500), O + MOON[0], 0.4)
mix.add(braam(36.7, 2.4), O + MOON[0] + 0.2, 0.2)

# 5. jump: a small hop (and the needle), then the giant landing and the continents meeting
mix.add(thump(70, 40, 0.5, decay=7, click=0.25), O + HOP, 0.35)
for k in range(6):
    mix.add(click(0.015, 1800), O + HOP + 0.05 + 0.09 * k, 0.12)
place(WIND, S["globe"], 0.15, length=END["globe"] - S["globe"], fade_in=0.3, fade_out=0.4)
mix.add(whoosh(0.8, 100, 2000), O + BIG_LAND - 0.7, 0.35)
place(BOOM, BIG_LAND - 0.05, 0.45, length=2.0, fade_out=0.6)
place(RUMBLE, BIG_LAND, 0.35, length=GLUE - BIG_LAND + 1.4, fade_out=0.6)
place(IMPACT, GLUE - 0.05, 0.5, length=1.4, fade_out=0.4)
mix.add(thump(45, 25, 1.4, decay=2.5, click=0.4), O + GLUE, 0.5)

# 6. telescope: dome hum, the check ding, the endless pan
place(HUM, S["scope"], 0.12, length=END["scopeG"] - S["scope"], fade_in=0.3, fade_out=0.4)
mix.add(ding(1567.98, 1.0), O + CHECK, 0.2)
mix.add(servo(SEARCH[1] - SEARCH[0]), O + SEARCH[0], 0.3)
for k in range(int((SEARCH[1] - SEARCH[0]) / 0.25)):
    mix.add(click(0.012, 2200), O + SEARCH[0] + 0.1 + k * 0.25, 0.08)

# score changes
for at in SCORE[1:]:
    mix.add(ding(1760.0, 0.7), O + at, 0.14)

# 7. final: space hum, both step on, a long quiver, then the launch; the two moons; the reveal and the win
place(WIND, S["final"], 0.1, length=DUR - S["final"], fade_in=0.4, fade_out=1.2)
mix.add(thump(60, 30, 0.8, decay=4, click=0.5), O + STEP_ON, 0.4, pan=-0.3)
mix.add(thump(58, 30, 0.8, decay=4, click=0.5), O + STEP_ON + 0.15, 0.4, pan=0.3)
place(CREAK, STEP_ON + 0.3, 0.25, length=LAUNCH - STEP_ON - 0.2, fade_out=0.3)
place(IMPACT, LAUNCH - 0.03, 0.45, length=1.2, fade_out=0.4)
mix.add(whoosh(1.4, 300, 7000), O + LAUNCH, 0.45)
mix.add(boing(120, 700, 0.8), O + LAUNCH + 0.05, 0.3)
place(MOONS, S["moons"], 0.2, length=END["moons"] - S["moons"] + 0.3, fade_in=0.2, fade_out=0.4)
place(SLIPPERS, S["leg"] + 0.3, 0.3, length=0.8, fade_out=0.3)
place(CHEER, WIN - 0.1, 0.4, length=DUR - WIN + 0.1, fade_out=0.8)
mix.add(braam(32.7, 2.6), O + WIN, 0.25)
mix.add(ding(1318.5, 1.4), O + WIN, 0.2)

# ---------------------------------------------------------------- bed: a light bouncy pulse, rising for the final
t = mix.t - O
tension = np.interp(t, [0, S["boat"], S["moon"], S["globe"], S["final"], LAUNCH, LAUNCH + 0.4, WIN, DUR], [0.4, 0.45, 0.55, 0.65, 0.9, 1.0, 0.4, 0.5, 0.0])
base = drone([49.0, 73.4, 98.0], DUR + 1)[: mix.n]
rate = np.interp(t, [0, S["final"], LAUNCH, DUR], [2.0, 2.8, 1.2, 1.2])
pulse = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(rate) / SR) ** 8
bed = filt(base * pulse, "lowpass", 700) * tension
duck = np.ones(mix.n)
if HAVE_VO:
    duck -= 0.4 * mix.env(O + VO_AT, O + VO_END, 0.3, 0.6)
duck = np.clip(duck, 0.35, 1)
mix.l += bed * duck * 0.32
mix.r += bed * duck * 0.32

final = mix.write("nolan-mom")

cues = {
    "duration": DUR,
    "draft": not HAVE_VO,
    "shots": [[n, round(s, 3)] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "phrases": [[round(a, 3), round(b, 3)] for a, b in PT],
    "land": LAND,
    "stomp": STOMP,
    "draw": DRAW,
    "boatIn": BOAT_IN,
    "sink": list(SINK),
    "stepSea": STEP_SEA,
    "flood": list(FLOOD),
    "score": SCORE,
    "spoons": SPOONS,
    "moon": list(MOON),
    "hop": HOP,
    "bigLand": BIG_LAND,
    "glue": GLUE,
    "check": CHECK,
    "search": list(SEARCH),
    "stepOn": STEP_ON,
    "launch": LAUNCH,
    "win": WIN,
}
(ROOT / "src/nolan").mkdir(exist_ok=True)
(ROOT / "src/nolan/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame, {'with voice' if HAVE_VO else 'DRAFT without voice'}) and src/nolan/cues.json")
