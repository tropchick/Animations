"""Soundtrack and timing cues for «Что если бы читы из ГТА заработали в реальной жизни?» (Russian TikTok chain, soft toy 3D).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant», text /mnt/project-files/voice/cheats/cheats-vo-text.txt
(Cyrillic + combining U+0301 stress marks). Expected file: audio/voice/cheats-vo.mp3,
word times audio/voice/cheats-words.json (audio/transcribe_cheats.py).

Every shot and event is anchored to a caption phrase (P[k].s / P[k].e), so a new take only needs new phrase times:
  - with the voice file and MEASURED filled in, phrase times come from the take;
  - without them (draft), phrase times are estimated and the take is left out of the mix.

Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30); the track gets 1/30 s in front.

Sync map (story time of the on-screen event <-> sound):
  CODES[i]    the code is typed letter by letter (KEYS), then activated    <-> key clicks + «чит активирован» chime
  SACK        the money sack lands next to the kid                         <-> heavy plop
  PRICE[0..2] the bread price tag flips 5 000 / 100 000 / 1 000 000          <-> ding x3
  PARK        the car rolls onto the flowerbed                             <-> tyres + bump
  LIFT        the cars leave the road                                      <-> whoosh up
  GRANNY      the granny on a jetpack passes the camera                     <-> jet roar pass-by
  TEAR        the boss tears the sick note                                  <-> paper rip
  POP         everyone turns round                                          <-> pop chord
  BANNER      «ЧИТЫ ВКЛЮЧЕНЫ / ДОСТИЖЕНИЯ ОТКЛЮЧЕНЫ» in the sky             <-> deep system tone
  FLAG        the flag on the Moon crumbles                                 <-> crumble ticks
  ERASE       the «5» is wiped out of the diary                             <-> rubber scrub
  DOOR        the door opens, mom in the doorway                            <-> door creak
  FAIL        «НА МАМУ НЕ ДЕЙСТВУЕТ»                                       <-> low buzzer
"""

import json
import sys

import numpy as np

from slime_lib import ROOT, SR, Mix, beep, click, drone, filt, load, thump, ting, tt_, white

OFF = 1 / 30
VO_AT = 0.25
VO_PATH = ROOT / "audio/voice/cheats-vo.mp3"
WORDS_PATH = ROOT / "audio/voice/cheats-words.json"

# caption phrases: text as shown on screen, and the estimated length used for the draft
PHRASES = [
    ("Что если бы читы из ГТА заработали в реальной жизни?", 3.4),  # 0
    ("Понедельник.", 0.9),  # 1
    ("Школьник нашёл коды для Вайс-Сити", 2.3),  # 2
    ("и по приколу набрал «хесоям».", 2.0),  # 3
    ("С неба упало 250 тысяч.", 2.2),  # 4
    ("Через час код знала вся страна.", 2.0),  # 5
    ("К вечеру батон стоил миллион.", 2.1),  # 6
    ("Во вторник все набрали «аезакми».", 2.2),  # 7
    ("Полиция перестала замечать людей.", 2.2),  # 8
    ("Даже тех, кто парковался на клумбе.", 2.2),  # 9
    ("В среду полетели машины.", 1.6),  # 10
    ("Пробки переехали в небо.", 1.6),  # 11
    ("Бабушки летали на рынок на ранцах.", 2.2),  # 12
    ("В четверг вспомнили «багувикс».", 2.1),  # 13
    ("Все стали бессмертными.", 1.5),  # 14
    ("И больше никому не давали больничный.", 2.3),  # 15
    ("В пятницу кто-то промахнулся", 1.8),  # 16
    ("и включил код на толщину.", 1.7),  # 17
    ("Всем сразу.", 0.9),  # 18
    ("В субботу в небе всплыло:", 1.6),  # 19
    ("«Читы включены.", 1.1),  # 20
    ("Достижения отключены».", 1.4),  # 21
    ("С Луны пропал флаг,", 1.3),  # 22
    ("а у школьника стёрлась пятёрка.", 1.9),  # 23
    ("А в воскресенье мама узнала, кто всё начал.", 2.6),  # 24
    ("Школьник набрал «аезакми».", 1.7),  # 25
    ("На маму не действует.", 1.5),  # 26
]
GAP = 0.35
SPEED = 1.0  # atempo applied to the raw take before it goes in (audio/voice/cheats-vo.mp3 is already sped up)

HAVE_VO = VO_PATH.exists() and "--draft" not in sys.argv

# measured phrase windows in take time (from whisper once the take exists): list of (start, end)
MEASURED: list[tuple[float, float]] = [
    (0.0, 3.88),  # 0
    (4.28, 5.0),  # 1
    (5.32, 7.28),  # 2
    (7.62, 9.5),  # 3
    (9.84, 12.5),  # 4
    (12.96, 15.26),  # 5
    (15.52, 17.52),  # 6
    (17.9, 20.2),  # 7
    (20.44, 22.6),  # 8
    (23.02, 25.08),  # 9
    (25.34, 27.06),  # 10
    (27.38, 28.95),  # 11
    (29.1, 31.74),  # 12
    (32.0, 33.9),  # 13
    (34.28, 35.98),  # 14
    (36.38, 38.48),  # 15
    (38.8, 40.74),  # 16
    (41.08, 42.6),  # 17
    (43.04, 43.92),  # 18
    (44.22, 46.0),  # 19
    (46.38, 47.54),  # 20
    (47.94, 49.46),  # 21
    (49.82, 51.06),  # 22
    (51.48, 53.3),  # 23
    (53.64, 56.76),  # 24
    (57.06, 58.92),  # 25
    (59.29, 60.75),  # 26
]

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

# ---------------------------------------------------------------- the codes: (text, first key, activation)
def code(text, a, b):
    """letters typed evenly between a and b - 0.25, activation at b"""
    n = len(text)
    keys = [round(a + (b - 0.25 - a) * i / max(1, n - 1), 3) for i in range(n)]
    return {"text": text, "keys": keys, "on": round(b, 3)}


CODES = [
    code("HESOYAM", P[3].s + 0.35, P[3].e + 0.05),
    code("AEZAKMI", P[7].s + 0.5, P[7].e),
    code("RIPAZHA", P[10].s - 0.45, P[10].s + 0.4),
    code("YECGAA", P[12].s - 0.3, P[12].s + 0.55),
    code("BAGUVIX", P[13].s + 0.5, P[13].e),
    code("BTCDBCB", P[16].e - 0.9, P[17].s + 0.5),
    code("AEZAKMI", P[25].s + 0.1, P[25].e),
]

SACK = CODES[0]["on"] + 0.9
PRICE = [P[6].s + 0.35, P[6].s + 0.95, P[6].e - 0.35]
PARK = P[9].s + 0.25
LIFT = CODES[2]["on"] + 0.1
GRANNY = P[12].s + 1.0
TEAR = P[15].e - 0.5
POP = P[18].s + 0.05
BANNER = P[20].s - 0.1
FLAG = P[22].s + 0.55
ERASE = P[23].s + 0.6
DOOR = P[24].s + 0.1
FAIL = P[26].s + 0.05
FINAL = FAIL
DUR = round(max(P[26].e, FAIL) + 2.6, 2)

# ---------------------------------------------------------------- shots
SHOTS = [
    ("teaser", 0.0),
    ("yard", P[1].s - 0.1),
    ("phone", P[3].s - 0.05),
    ("sack", CODES[0]["on"] + 0.15),
    ("rain", P[5].s - 0.1),
    ("bread", P[6].s - 0.1),
    ("typecop", P[7].s - 0.1),
    ("cop", P[8].s - 0.2),
    ("lift", P[10].s - 0.1),
    ("jam", P[11].s + 0.45),
    ("granny", P[12].s - 0.1),
    ("bars", P[13].s - 0.1),
    ("office", P[15].s - 0.1),
    ("thumb", P[16].s - 0.1),
    ("round", P[17].s + 0.6),
    ("banner", P[19].s - 0.1),
    ("moon", P[22].s - 0.1),
    ("diary", P[23].s - 0.1),
    ("door", P[24].s - 0.1),
    ("panic", P[25].s - 0.1),
    ("stare", P[26].s - 0.15),
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
# phrases that read better together on one caption plate
GROUPS = [[0], [1], [2, 3], [4], [5], [6], [7], [8], [9], [10], [11], [12], [13], [14], [15], [16, 17], [18], [19], [20, 21], [22, 23], [24], [25], [26]]

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


def whoosh(dur=1.2, lo=200, hi=6000, peak=0.55):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [lo, hi])
    shape = np.exp(-((tt - dur * peak) / (dur * 0.25)) ** 2)
    return filt(s * shape, "lowpass", 5000)


def ding(f=1318.5, dur=1.2):
    return ting(f, dur) * 0.6 + ting(f * 1.5, dur) * 0.4


def key(seed=0):
    # a phone key tap: a short bright click with a soft body
    c = click(0.018, 2600 + (seed % 3) * 300) * 0.8
    b = thump(320, 220, 0.05, decay=60, click=0.0) * 0.3
    n = max(len(c), len(b))
    s = np.zeros(n)
    s[: len(c)] += c
    s[: len(b)] += b
    return s


def activated():
    # «чит активирован»: two quick rising notes, like an old game menu
    s = np.zeros(int(0.7 * SR))
    for k, f in enumerate([987.8, 1318.5, 1975.5]):
        n = ting(f, 0.45) * (0.5 if k < 2 else 0.35)
        n0 = int(k * 0.07 * SR)
        s[n0 : n0 + len(n)] += n[: len(s) - n0]
    return s


def crumble(dur=1.0):
    s = np.zeros(int(dur * SR))
    rng = np.random.default_rng(7)
    for i in range(70):
        at = (rng.random() ** 1.6) * dur * 0.85
        c = click(0.012, 1800 + rng.random() * 3500) * (0.4 + rng.random() * 0.6)
        n0 = int(at * SR)
        s[n0 : n0 + len(c)] += c[: len(s) - n0]
    return s


def scrub(dur=0.9):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [600, 3000]) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * tt) ** 2)
    return s * np.clip(tt / 0.05, 0, 1) * np.clip((dur - tt) / 0.1, 0, 1) * 0.6


def buzzer(dur=0.8):
    tt = tt_(dur)
    s = np.sign(np.sin(2 * np.pi * 110 * tt)) * 0.3 + np.sin(2 * np.pi * 220 * tt) * 0.2
    return filt(s, "lowpass", 1800) * np.clip(tt / 0.01, 0, 1) * np.clip((dur - tt) / 0.08, 0, 1)


def pop_chord():
    s = np.zeros(int(1.2 * SR))
    for k, f in enumerate([261.6, 329.6, 392.0, 523.3]):
        n = ting(f, 1.0) * 0.4
        n0 = int(k * 0.035 * SR)
        s[n0 : n0 + len(n)] += n[: len(s) - n0]
    p = thump(140, 60, 0.3, decay=14, click=0.6)
    s[: len(p)] += p
    return s


def system_tone(dur=2.2):
    tt = tt_(dur)
    s = sum(np.sin(2 * np.pi * f * tt) * g for f, g in [(65.4, 0.5), (98.0, 0.35), (130.8, 0.25), (196.0, 0.12)])
    return s * np.clip(tt / 0.05, 0, 1) * np.exp(-tt * 1.2)


PLOP = sfx("bear/plop")
COINS = sfx("bear/coins")
CRINKLE = sfx("bear/crinkle")
RIP = sfx("bear/rip")
CROWD = sfx("bear/crowd")
CITY = sfx("earth/city")
CARS = sfx("earth/cars")
TIRES = sfx("earth/tires")
ROCKET = sfx("gta/rocket")
WIND = sfx("gta/wind")
MOON = sfx("gta/moon")
CREAK = sfx("murino/creak")
SLIPPERS = sfx("murino/slippers")

S = dict(SHOTS)
END = {n: (SHOTS[i + 1][1] if i + 1 < len(SHOTS) else DUR) for i, (n, _) in enumerate(SHOTS)}

# the city under everything from Monday to Saturday, quieter in the yard
place(CITY, 0.0, 0.07, length=S["moon"], fade_in=0.3, fade_out=0.4)

# teaser: falling money and a jet passing
place(CRINKLE, 0.3, 0.12, length=2.6, fade_out=0.6)
mix.add(whoosh(1.4, 300, 5000), O + 1.2, 0.18, pan=-0.4)

# all codes: key taps and the activation chime
for i, c in enumerate(CODES):
    for j, t in enumerate(c["keys"]):
        mix.add(key(i * 7 + j), O + t, 0.35, pan=0.1)
    if i < len(CODES) - 1:
        mix.add(activated(), O + c["on"], 0.22)
    else:  # mom: the chime starts, then the buzzer
        mix.add(activated(), O + c["on"], 0.18)

# Monday: flash, health bars, the sack
mix.add(whoosh(0.6, 1500, 9000, 0.3), O + CODES[0]["on"] - 0.05, 0.25)
mix.add(ding(1567.98, 1.2), O + CODES[0]["on"] + 0.25, 0.15)
place(PLOP, SACK, 0.6, length=0.9)
mix.add(thump(55, 30, 0.9, decay=5, click=0.4), O + SACK, 0.5)
place(COINS, SACK + 0.05, 0.25, length=1.0, fade_out=0.4)

# money rain over the street
place(CRINKLE, S["rain"], 0.22, length=END["rain"] - S["rain"], fade_in=0.2, fade_out=0.3)
place(CROWD, S["rain"], 0.12, length=END["bread"] - S["rain"], fade_in=0.3, fade_out=0.4)

# bread price tag
for k, t in enumerate(PRICE):
    mix.add(ding([1046.5, 1318.5, 1760.0][k], 0.6), O + t, 0.2)
    mix.add(click(0.03, 2200), O + t, 0.2)

# Tuesday: the flowerbed parking, a yawn-like low slide
place(TIRES, PARK, 0.25, length=1.3, fade_out=0.4)
mix.add(thump(70, 40, 0.5, decay=8, click=0.2), O + PARK + 0.7, 0.35)
place(CARS, S["cop"], 0.1, length=END["cop"] - S["cop"], fade_in=0.2, fade_out=0.3)

# Wednesday: cars lift off, traffic in the sky, the granny jet
mix.add(whoosh(1.6, 150, 3000, 0.4), O + LIFT, 0.35)
place(WIND, S["jam"], 0.14, length=END["granny"] - S["jam"], fade_in=0.3, fade_out=0.4)
place(CARS, S["jam"], 0.12, length=END["jam"] - S["jam"], fade_in=0.2, fade_out=0.3)
for k in range(3):
    mix.add(beep([660, 523, 587][k], 0.22), O + S["jam"] + 0.4 + k * 0.45, 0.07, pan=[-0.5, 0.4, 0.1][k])
place(ROCKET, GRANNY - 0.6, 0.3, length=2.0, fade_in=0.2, fade_out=0.6)
mix.add(whoosh(1.0, 200, 7000, 0.5), O + GRANNY - 0.3, 0.3, pan=0.5)

# Thursday: bars stay full (a soft heartbeat), the sick note torn
mix.add(ding(880.0, 1.4), O + CODES[4]["on"] + 0.15, 0.15)
BONK = CODES[4]["on"] + 0.9  # the flowerpot hits the head (same as BONK in src/cheats/scenes2.tsx)
mix.add(thump(220, 140, 0.25, decay=18, click=0.8), O + BONK, 0.45)
mix.add(ting(1567.98, 0.6), O + BONK + 0.02, 0.12)
place(RIP, TEAR, 0.45, length=0.9)

# Friday: the pop, then rolling
mix.add(pop_chord(), O + POP, 0.45)
for k in range(5):
    mix.add(thump(90 - k * 6, 50, 0.3, decay=10, click=0.1), O + POP + 0.5 + k * 0.38, 0.22)

# Saturday: the banner, the flag, the diary
mix.add(system_tone(2.4), O + BANNER, 0.5)
mix.add(ting(1975.5, 1.6), O + BANNER + 0.05, 0.12)
place(MOON, S["moon"], 0.25, length=END["moon"] - S["moon"], fade_in=0.2, fade_out=0.3)
mix.add(crumble(1.0), O + FLAG, 0.5)
mix.add(scrub(0.9), O + ERASE, 0.35)

# Sunday: the door, mom's slippers, the fail
place(CREAK, DOOR - 0.1, 0.35, length=1.4, fade_out=0.4)
place(SLIPPERS, DOOR + 0.6, 0.25, length=1.0, fade_out=0.3)
mix.add(buzzer(0.7), O + FAIL, 0.35)
mix.add(thump(48, 28, 1.2, decay=3, click=0.2), O + FAIL + 0.9, 0.35)

# ---------------------------------------------------------------- bed: a light bouncy pulse that rises through the week
t = mix.t - O
tension = np.interp(t, [0, S["yard"], S["rain"], S["lift"], S["round"], S["banner"], S["door"], S["stare"], DUR], [0.5, 0.3, 0.5, 0.65, 0.8, 0.9, 0.45, 0.6, 0.0])
base = drone([65.4, 98.0, 130.8], DUR + 1)[: mix.n]
rate = np.interp(t, [0, S["rain"], S["lift"], S["round"], S["door"], DUR], [2.2, 2.6, 3.0, 3.4, 1.4, 1.4])
pulse = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(rate) / SR) ** 8
bed = filt(base * pulse, "lowpass", 700) * tension
duck = np.ones(mix.n)
if HAVE_VO:
    duck -= 0.4 * mix.env(O + VO_AT, O + VO_END, 0.3, 0.6)
duck = np.clip(duck, 0.35, 1)
mix.l += bed * duck * 0.3
mix.r += bed * duck * 0.3

final = mix.write("gta-cheats")

cues = {
    "duration": DUR,
    "draft": not HAVE_VO,
    "shots": [[n, round(s, 3)] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "phrases": [[round(a, 3), round(b, 3)] for a, b in PT],
    "codes": CODES,
    "sack": SACK,
    "price": PRICE,
    "park": PARK,
    "lift": LIFT,
    "granny": GRANNY,
    "tear": TEAR,
    "pop": POP,
    "banner": BANNER,
    "flag": FLAG,
    "erase": ERASE,
    "door": DOOR,
    "fail": FAIL,
}
(ROOT / "src/cheats").mkdir(exist_ok=True)
(ROOT / "src/cheats/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame, {'with voice' if HAVE_VO else 'DRAFT without voice'}) and src/cheats/cues.json")
