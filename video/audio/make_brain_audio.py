"""Soundtrack and timing cues for «Что если бы брейнротов никогда не существовало?» (Russian TikTok chain, soft toy 3D).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant», text /mnt/project-files/voice/brainrot/brainrot-vo-text.txt
(Cyrillic vowels + combining U+0301 stress marks). Expected file: audio/voice/brain-vo.mp3,
word times audio/voice/brain-words.json (audio/transcribe_brain.py).

Every shot and event is anchored to a caption phrase (P[k].s / P[k].e), so a new take only needs new phrase times:
  - with the voice file and MEASURED filled in, phrase times come from the take;
  - without them (draft), phrase times are estimated and the take is left out of the mix.

Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30); the track gets 1/30 s in front.

Sync map (story time of the on-screen event <-> sound):
  CLICK       the cursor clicks «УДАЛИТЬ»                         <-> mouse click
  VANISH      the three brainrots burst into cubes                <-> pixel crumble + whoosh
  SIGH        the kid drops back on the bed                       <-> soft thump
  TAKE        the kid pulls the textbook off the shelf            <-> book thud + page flip
  SOLVE       the last line of the formula, «= 42»                <-> chalk taps + ding
  WIN         «ДЕТИ 1 : 0 РОДИТЕЛИ»                               <-> score pop
  STACK       the stack of notebooks hits the table               <-> heavy thud
  ENTER       the kids in suits come through the office door      <-> door + steps
  PLAN        the arrow «→ СДЕЛАТЬ ГЛУПЕЕ» on the board           <-> marker squeak
  FOUND       «ЗАГОВОР ВЗРОСЛЫХ: НАЙДЕН» on the tower screen       <-> alarm beeps
  BELL        the school bell, adults walk in                      <-> bell
  FIVE        the son writes a red «5» in dad's notebook          <-> pen scratch
  FINAL       «ПАПА, ИДИ ДЕЛАЙ УРОКИ»                              <-> low ting + thump
"""

import json
import sys
from pathlib import Path

import numpy as np

from slime_lib import ROOT, SR, Mix, beep, click, drone, filt, load, thump, ting, tt_, white

OFF = 1 / 30
VO_AT = 0.25
VO_PATH = ROOT / "audio/voice/brain-vo.mp3"
WORDS_PATH = ROOT / "audio/voice/brain-words.json"

# caption phrases: text as shown on screen, and the estimated length used for the draft
PHRASES = [
    ("Что если бы брейнротов никогда не существовало?", 3.2),  # 0
    ("Январь 2025-го.", 1.6),  # 1
    ("Автор акулы в кроссовках передумал и нажал «удалить».", 3.4),  # 2
    ("Летом не вышла игра «Укради брейнрот».", 2.7),  # 3
    ("Миллионы детей заскучали", 1.8),  # 4
    ("и от скуки открыли учебники.", 2.0),  # 5
    ("К сентябрю пятиклассники решали задачи за 11-й класс.", 3.6),  # 6
    ("Учителя начали списывать у учеников.", 2.6),  # 7
    ("Дети стали спорить с родителями.", 2.2),  # 8
    ("И выигрывать.", 1.1),  # 9
    ("«Иди делай уроки» больше не работало:", 2.3),  # 10
    ("уроки были уже сделаны.", 1.7),  # 11
    ("Через два года 12-летние пришли на работу.", 3.0),  # 12
    ("И заняли места половины взрослых.", 2.3),  # 13
    ("Тогда взрослые собрались на тайное совещание.", 2.9),  # 14
    ("План был один:", 1.1),  # 15
    ("снова сделать детей глупее.", 1.9),  # 16
    ("Они раздали детям бесконечные мультики.", 2.6),  # 17
    ("Дети собрали из телефонов суперкомпьютер.", 2.8),  # 18
    ("Дети раскрыли заговор и решили:", 2.1),  # 19
    ("отстали тут взрослые.", 1.5),  # 20
    ("Всех взрослых отправили обратно в школу.", 2.7),  # 21
    ("А вечером дома папу ждал сын.", 2.2),  # 22
    ("«Папа, иди делай уроки».", 1.8),  # 23
]
GAP = 0.35

HAVE_VO = VO_PATH.exists() and "--draft" not in sys.argv

# measured phrase windows in take time (from whisper once the take exists): list of (start, end)
MEASURED: list[tuple[float, float]] = [
    (0.0, 3.28), (4.3, 5.88), (6.8, 10.54), (10.54, 13.2), (13.9, 15.76), (16.22, 18.16), (18.68, 22.1), (22.96, 25.4),
    (25.92, 27.86), (27.86, 29.1), (29.86, 32.44), (32.74, 34.48), (34.82, 37.6), (37.6, 40.28), (40.54, 43.42), (44.0, 45.08),
    (45.58, 47.28), (47.66, 50.12), (50.76, 53.84), (53.84, 56.18), (56.66, 57.92), (57.92, 61.1), (61.38, 63.58), (63.96, 65.94),
]  # take khBx6LPULmWcNOsSCEcl (flow 4J1t9vDwRizh6hybmecF, 1045 credits), 74.1 s raw -> atempo 1.12 = 66.1 s

if HAVE_VO and MEASURED:
    PT = [(VO_AT + a, VO_AT + b) for a, b in MEASURED]
else:
    PT = []
    t = VO_AT
    for _, d in PHRASES:
        PT.append((round(t, 3), round(t + d, 3)))
        t += d + GAP


class _P:
    def __init__(self, k):
        self.s, self.e = PT[k]


P = [_P(k) for k in range(len(PHRASES))]
VO_END = P[-1].e

# ---------------------------------------------------------------- events
CLICK = P[2].e - 0.45  # on «удалить»
VANISH = CLICK + 0.45
SIGH = P[4].s + 0.5
TAKE = P[5].s + 0.6
SOLVE = P[6].e - 0.5
WIN = P[9].s + 0.15
STACK = P[11].s + 0.2
ENTER = P[12].s + 0.6
PLAN = P[16].s + 0.1
FOUND = P[19].s + 0.1
BELL = P[21].s - 0.15
FIVE = P[23].s + 0.1
FINAL = max(P[23].e + 0.3, FIVE + 1.3)
DUR = round(FINAL + 2.4, 2)

# ---------------------------------------------------------------- shots
SHOTS = [
    ("trio", 0.0),
    ("laptop", P[1].s - 0.1),
    ("vanish", CLICK + 0.25),
    ("game", max(P[3].s - 0.1, VANISH + 1.3)),
    ("bed", P[4].s - 0.1),
    ("board", P[6].s - 0.1),
    ("teacher", P[7].s - 0.1),
    ("argue", P[8].s - 0.1),
    ("stack", P[10].s - 0.1),
    ("office", P[12].s - 0.1),
    ("meeting", P[14].s - 0.1),
    ("plan", P[15].s - 0.1),
    ("cartoons", P[17].s - 0.1),
    ("tower", P[18].s - 0.1),
    ("enter", P[21].s - 0.3),
    ("desks", P[21].s + 1.5),
    ("dad", P[22].s - 0.1),
]

# ---------------------------------------------------------------- caption words
words = []  # [start, end, token, phrase] in story time
WH = json.loads(WORDS_PATH.read_text()) if HAVE_VO and WORDS_PATH.exists() else []
for k, (text, _) in enumerate(PHRASES):
    a, b = PT[k]
    toks = text.split(" ")
    ws = [w for w in WH if a - VO_AT - 0.05 <= w[0] < b - VO_AT]
    if len(ws) == len(toks):
        starts = [VO_AT + w[0] for w in ws]
        end_of = VO_AT + ws[-1][1]
    else:  # spread the tokens by length over the phrase
        lens = np.cumsum([0] + [len(x) + 2 for x in toks])
        starts = [a + (b - a) * lens[j] / lens[-1] for j in range(len(toks))]
        end_of = b
    for j, tok in enumerate(toks):
        end = starts[j + 1] if j + 1 < len(toks) else end_of
        words.append([round(starts[j], 3), round(end, 3), tok, k])
GROUPS = [[k] for k in range(len(PHRASES))]

mix = Mix(DUR + OFF + 0.6)
O = OFF
if HAVE_VO:
    mix.add(load(VO_PATH), O + VO_AT, 1.0)


# ---------------------------------------------------------------- sound effects
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


def ding(f=1318.5, dur=1.2):
    return ting(f, dur) * 0.6 + ting(f * 1.5, dur) * 0.4


def pop(f=1046.5):
    s = ting(f, 0.25) * 0.3
    c = click(0.04, 2400) * 0.8
    s[: len(c)] += c[: len(s)]
    return s


def crumble(dur=1.0):
    # many tiny ticks thinning out: blocks falling apart
    s = np.zeros(int(dur * SR))
    rng = np.random.default_rng(7)
    for i in range(70):
        at = (rng.random() ** 1.6) * dur * 0.85
        c = click(0.012, 1800 + rng.random() * 3500) * (0.4 + rng.random() * 0.6)
        n0 = int(at * SR)
        s[n0 : n0 + len(c)] += c[: len(s) - n0]
    return s


def chalk(dur=0.18):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [2500, 7000]) * (0.6 + 0.4 * np.sin(2 * np.pi * 38 * tt))
    return s * np.clip(tt / 0.01, 0, 1) * np.clip((dur - tt) / 0.03, 0, 1)


def squeak(dur=0.7, f0=1900, f1=2600):
    tt = tt_(dur)
    f = f0 + (f1 - f0) * np.sin(np.pi * tt / dur)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25 + filt(white(len(tt)), "bandpass", [2000, 5000]) * 0.2
    return s * np.clip(tt / 0.04, 0, 1) * np.clip((dur - tt) / 0.06, 0, 1)


def bell(dur=1.8):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for k in range(int(dur / 0.06)):  # an electric school bell: fast hammer on a bright tone
        n0 = int(k * 0.06 * SR)
        h = ting(2100, 0.12) * 0.5 + ting(3150, 0.12) * 0.3
        s[n0 : n0 + len(h)] += h[: len(s) - n0]
    return s * np.clip((dur - tt) / 0.2, 0, 1)


def page(dur=0.35):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [800, 6000]) * np.sin(np.pi * tt / dur) ** 2 * 0.5


CROWD = sfx("bear/crowd")
STEPS = sfx("scp/steps")
DOOR = sfx("murino/door_open")
SERVERS = sfx("gta/servers")
HUM = sfx("scp/hum")
CHEER = sfx("bear/cheer")
PLOP = sfx("bear/plop")
KNOCK = sfx("scp/knock")

S = dict(SHOTS)
END = {n: (SHOTS[i + 1][1] if i + 1 < len(SHOTS) else DUR) for i, (n, _) in enumerate(SHOTS)}

# 1. night room: hum of the laptop, the click, the brainrots crumble
place(HUM, 0.0, 0.08, length=S["game"], fade_in=0.3, fade_out=0.3)
mix.add(ding(880.0, 1.6), O + 0.15, 0.12)
mix.add(click(0.03, 2600), O + CLICK, 0.5)
mix.add(click(0.02, 1800), O + CLICK + 0.06, 0.3)
mix.add(crumble(1.1), O + VANISH, 0.55)
mix.add(whoosh(0.9, 300, 6000), O + VANISH - 0.15, 0.3)
mix.add(thump(60, 35, 0.8, decay=5, click=0.2), O + VANISH, 0.25)

# 2. the empty game: a hollow conveyor rattle
for k in range(int((END["game"] - S["game"]) / 0.25)):
    mix.add(click(0.02, 900 + (k % 2) * 200), O + S["game"] + 0.1 + k * 0.25, 0.08)

# 3. the bed: a sigh thump, the book
mix.add(thump(80, 45, 0.5, decay=8, click=0.05), O + SIGH, 0.25)
mix.add(thump(110, 60, 0.4, decay=10, click=0.3), O + TAKE + 0.35, 0.3)
mix.add(page(), O + TAKE + 0.65, 0.4)
mix.add(page(), O + TAKE + 0.9, 0.3)

# 4. class: chalk on the board, ding on the answer; teacher sneaks
for k in range(int((SOLVE - S["board"] - 0.2) / 0.22)):
    mix.add(chalk(0.12 + 0.05 * (k % 3)), O + S["board"] + 0.25 + k * 0.22, 0.18, pan=0.15)
mix.add(ding(1567.98, 1.2), O + SOLVE, 0.2)
place(CROWD, S["board"], 0.05, length=END["teacher"] - S["board"], fade_in=0.3, fade_out=0.4)
mix.add(page(0.5), O + S["teacher"] + 0.6, 0.3)

# 5. kitchen: score pop, the stack slam
mix.add(pop(1318.5), O + WIN, 0.35)
mix.add(ding(1760.0, 0.8), O + WIN + 0.05, 0.12)
mix.add(thump(55, 30, 1.0, decay=4, click=0.5), O + STACK, 0.55)
place(PLOP, STACK, 0.3, length=0.8)

# 6. office: door, steps of many small feet, boxes
place(DOOR, ENTER - 0.3, 0.3, length=1.4, fade_out=0.4)
place(STEPS, ENTER, 0.3, length=END["office"] - ENTER, fade_out=0.4)
for k in range(10):
    mix.add(click(0.03, 3000 + k * 120), O + S["office"] + 0.3 + k * 0.35, 0.06)

# 7. basement: a buzzing lamp, the marker
place(HUM, S["meeting"], 0.16, length=END["plan"] - S["meeting"], fade_in=0.2, fade_out=0.3)
mix.add(squeak(0.5, 1700, 2300), O + S["plan"] + 0.25, 0.25)
mix.add(squeak(0.8, 1900, 2700), O + PLAN, 0.3)

# 8. cartoons: a silly jingle loop; the tower hums, found alarm
for k in range(6):
    mix.add(ting([523.3, 659.3, 784.0, 659.3, 523.3, 392.0][k], 0.3), O + S["cartoons"] + 0.4 + k * 0.28, 0.08)
place(SERVERS, S["tower"], 0.2, length=END["tower"] - S["tower"], fade_in=0.3, fade_out=0.4)
for k in range(4):
    mix.add(beep(880, 0.16), O + FOUND + k * 0.28, 0.18)

# 9. school: bell, adults shuffle in, sit down
mix.add(bell(1.6), O + BELL, 0.16)
place(STEPS, S["enter"] + 0.3, 0.25, length=END["enter"] - S["enter"], fade_out=0.3)
place(CROWD, S["desks"], 0.05, length=END["desks"] - S["desks"], fade_in=0.2, fade_out=0.3)

# 10. kitchen evening: clock ticks, pen, final
for k in range(int((DUR - S["dad"]) / 0.5)):
    mix.add(click(0.02, 1300), O + S["dad"] + 0.1 + k * 0.5, 0.07)
mix.add(chalk(0.25), O + FIVE, 0.25)
mix.add(chalk(0.2), O + FIVE + 0.3, 0.2)
mix.add(ting(659.3, 1.8), O + FINAL, 0.16)
mix.add(thump(50, 30, 1.0, decay=3, click=0.3), O + FINAL + 0.6, 0.3)

# ---------------------------------------------------------------- bed: a soft bouncy pulse, rising to the school
t = mix.t - O
tension = np.interp(t, [0, S["game"], S["office"], S["meeting"], S["tower"], S["desks"], S["dad"], DUR], [0.35, 0.45, 0.6, 0.75, 0.9, 0.9, 0.4, 0.0])
base = drone([55.0, 82.4, 110.0], DUR + 1)[: mix.n]
rate = np.interp(t, [0, S["office"], S["tower"], S["dad"], DUR], [2.0, 2.4, 3.0, 1.2, 1.2])
pulse = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(rate) / SR) ** 8
bed = filt(base * pulse, "lowpass", 700) * tension
duck = np.ones(mix.n)
if HAVE_VO:
    duck -= 0.4 * mix.env(O + VO_AT, O + VO_END, 0.3, 0.6)
duck = np.clip(duck, 0.35, 1)
mix.l += bed * duck * 0.3
mix.r += bed * duck * 0.3

final = mix.write("brainrot-never")

cues = {
    "duration": DUR,
    "draft": not HAVE_VO,
    "shots": [[n, round(s, 3)] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "phrases": [[round(a, 3), round(b, 3)] for a, b in PT],
    "click": CLICK,
    "vanish": VANISH,
    "sigh": SIGH,
    "take": TAKE,
    "solve": SOLVE,
    "win": WIN,
    "stack": STACK,
    "enter": ENTER,
    "plan": PLAN,
    "found": FOUND,
    "bell": BELL,
    "five": FIVE,
    "final": FINAL,
}
(ROOT / "src/brain").mkdir(exist_ok=True)
(ROOT / "src/brain/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame, {'with voice' if HAVE_VO else 'DRAFT without voice'}) and src/brain/cues.json")
