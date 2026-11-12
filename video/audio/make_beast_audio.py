"""Soundtrack and timing cues for «Кто богаче: Габен или Мистер Бист?» (Russian TikTok versus, soft toy 3D).

All figures are real (sources in scripts/gaben-vs-mrbeast-rich.md). Name stress: «Габе́н» (user rule).
Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant» -> audio/voice/beast-vo.mp3 (sped up).
Word times: audio/voice/beast-words.json (audio/transcribe_beast.py). Frame 0 is the cover: v = (frame - 1) / 30.
Until the voice exists the phrase windows are estimated from the text length (draft timing, no voice in the mix).

Sync map (story time of the on-screen event <-> sound):
  GROW_B / GROW_G  coin columns rise                <-> coin rattle, rising sweep
  X4               «×4» sticker                     <-> ding
  BOARD            «43 500 000 ОНЛАЙН» board lights <-> crowd + click
  GLOBE            camera pulls back to the globe   <-> whoosh
  MIL              bills fly out of the camera      <-> coins + whoosh
  HORN             the yacht                        <-> ship horn (synth)
  BOUGHT           «КУПЛЕН» stamp on the factory    <-> stamp
  BADGE            office badge                     <-> typing clicks
  THRONE           cash throne                      <-> coins
  MOTH             moth flies out of the wallet     <-> flutter
  ENV              mom's envelope                   <-> paper
  WIN              podium, confetti                 <-> cheer + ding
"""

import json

import numpy as np

from slime_lib import ROOT, SR, Mix, click, drone, filt, load, thump, ting, tt_, white

OFF = 1 / 30
VO_AT = 0.15
VO_PATH = ROOT / "audio/voice/beast-vo.mp3"
WORDS_PATH = ROOT / "audio/voice/beast-words.json"

PHRASES = [
    "Кто богаче: Габен или Мистер Бист?",  # 0
    "Только настоящие цифры.",  # 1
    "Состояние.",  # 2
    "У Мистера Биста — 2,6 миллиарда долларов.",  # 3
    "У Габена — больше десяти.",  # 4
    "Почти в четыре раза больше.",  # 5
    "Фанаты.",  # 6
    "В Стиме одновременно сидели 43 миллиона человек.",  # 7
    "А на Мистера Биста подписано больше 500 миллионов.",  # 8
    "Первый в истории Ютуба.",  # 9
    "Траты.",  # 10
    "Мистер Бист тратил миллион долларов на одно видео.",  # 11
    "А Габену построили яхту длиной 111 метров.",  # 12
    "А потом он купил целый завод яхт.",  # 13
    "Возраст.",  # 14
    "В 27 лет Габен работал в Майкрософте.",  # 15
    "А Мистер Бист в 27 уже был миллиардером.",  # 16
    "Два — два.",  # 17
    "Финал: деньги на карте.",  # 18
    "Габен уже несколько лет живёт в море, на своих яхтах.",  # 19
    "А Мистер Бист в январе сказал:",  # 20
    "«У меня сейчас минус деньги.",  # 21
    "Я беру в долг».",  # 22
    "А на свадьбу занимал у мамы.",  # 23
    "Побеждает Габен.",  # 24
    "А по словам самого Биста, у тебя на карте сейчас больше денег, чем у него.",  # 25
]
# spoken length in characters (numbers read out), for the draft timing only
SPOKEN = {3: 48, 7: 58, 8: 54, 12: 52, 15: 44, 16: 46}

# measured phrase windows in take time (whisper on the sped-up take); None = draft estimate
MEASURED = None

if MEASURED is None:
    MEASURED = []
    t = 0.0
    for k, text in enumerate(PHRASES):
        d = SPOKEN.get(k, len(text)) / 15.5 + 0.15
        MEASURED.append((round(t, 2), round(t + d, 2)))
        t += d + (0.55 if text.endswith(".") or text.endswith("?") else 0.3)
    HAVE_VO = False
else:
    HAVE_VO = True
PT = [(VO_AT + a, VO_AT + b) for a, b in MEASURED]


class _P:
    def __init__(self, k):
        self.s, self.e = PT[k]


P = [_P(k) for k in range(len(PHRASES))]
VO_END = P[-1].e

WH = []
if HAVE_VO and WORDS_PATH.exists():
    for a, b, t in json.loads(WORDS_PATH.read_text()):
        if t.startswith("-") and WH:
            WH[-1][1] = b
            WH[-1][2] += t
        else:
            WH.append([a, b, t])


def norm(s):
    return s.lower().replace("ё", "е").strip(" ,.—-«»:…?!")


def word_at(k, prefix, frac):
    """story time of the first word in phrase k that starts with prefix (whisper), else a fraction of the phrase"""
    a, b = PT[k]
    for w in WH:
        if a - VO_AT - 0.05 <= w[0] < b - VO_AT and norm(w[2]).startswith(norm(prefix)):
            return VO_AT + w[0]
    if HAVE_VO:
        print(f"!! no «{prefix}» in phrase {k}")
    return a + (b - a) * frac


# ---------------------------------------------------------------- shots
SHOTS = [
    ("hook", 0.0),
    ("worth", P[2].s - 0.15),
    ("fansG", P[6].s - 0.15),
    ("fansB", P[8].s - 0.15),
    ("spendB", P[10].s - 0.15),
    ("yacht", P[12].s - 0.15),
    ("factory", P[13].s - 0.15),
    ("ageG", P[14].s - 0.15),
    ("ageB", P[16].s - 0.15),
    ("final", P[17].s - 0.15),
    ("sea", P[19].s - 0.15),
    ("wallet", P[20].s - 0.15),
    ("mom", P[23].s - 0.15),
    ("win", P[24].s - 0.15),
]

GROW_B = word_at(3, "2", 0.45)
if not any(norm(w[2]).startswith("2") for w in WH):
    GROW_B = word_at(3, "два", 0.45)
GROW_G = word_at(4, "больше", 0.5)
X4 = word_at(5, "четыр", 0.45)
BOARD = word_at(7, "43", 0.6) if any(norm(w[2]).startswith("43") for w in WH) else word_at(7, "сорок", 0.6)
GLOBE = word_at(8, "больше", 0.55)
NO1 = P[9].s
MIL = word_at(11, "миллион", 0.5)
HORN = P[12].s + 0.1
RULER = word_at(12, "длин", 0.6)
BOUGHT = word_at(13, "купил", 0.55)
BADGE = word_at(15, "работал", 0.55)
THRONE = word_at(16, "уже", 0.55)
FINAL = P[18].s
MINUS = word_at(21, "минус", 0.6)
MOTH = MINUS + 0.15
DOLG = word_at(22, "долг", 0.6)
ENV = word_at(23, "мам", 0.8)
WIN = P[24].s
CARD = word_at(25, "карт", 0.55)
# score steps: [time, gaben points, beast points]
SCORE = [
    [-1, 0, 0],
    [P[5].e + 0.15, 1, 0],
    [P[9].e + 0.15, 1, 1],
    [P[13].e + 0.15, 2, 1],
    [P[16].e + 0.15, 2, 2],
    [WIN + 0.2, 3, 2],
]
DUR = round(VO_END + 1.8, 2)

# ---------------------------------------------------------------- caption words
words = []
for k, text in enumerate(PHRASES):
    a, b = PT[k]
    toks = [x for x in text.split(" ") if x != "—"]
    ws = [w for w in WH if a - VO_AT - 0.05 <= w[0] < b - VO_AT]
    if len(ws) == len(toks):
        starts = [VO_AT + w[0] for w in ws]
        end_of = VO_AT + ws[-1][1]
    else:
        if HAVE_VO:
            print(f"!! phrase {k}: {len(ws)} whisper words vs {len(toks)} tokens")
        lens = np.cumsum([0] + [len(x) + 2 for x in toks])
        starts = [a + (b - a) * lens[j] / lens[-1] for j in range(len(toks))]
        end_of = b
    shown = []
    for tok in text.split(" "):
        if tok == "—":
            shown[-1] += " —"
        else:
            shown.append(tok)
    for j, tok in enumerate(shown):
        end = starts[j + 1] if j + 1 < len(shown) else end_of
        words.append([round(starts[j], 3), round(end, 3), tok, k])
GROUPS = [[0], [1], [2, 3], [4], [5], [6, 7], [8], [9], [10, 11], [12], [13], [14, 15], [16], [17, 18], [19], [20], [21, 22], [23], [24], [25]]

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
    shape = np.exp(-((tt - dur * 0.45) / (dur * 0.25)) ** 2)
    return filt(s * shape, "lowpass", 5000)


def ding(f=1318.5, dur=1.2):
    return ting(f, dur) * 0.6 + ting(f * 1.5, dur) * 0.4


def sweep(f0, f1, dur, wob=0.0):
    tt = tt_(dur)
    f = f0 + (f1 - f0) * (tt / dur) + wob * np.sin(2 * np.pi * 6 * tt)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.45 * np.clip(tt / 0.02, 0, 1) * np.clip((dur - tt) / 0.06, 0, 1)


def horn(dur=1.6, f=98.0):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for r, g in ((1, 1.0), (2, 0.5), (3, 0.3), (4, 0.15)):
        s += np.sin(2 * np.pi * f * r * tt) * g
    env = np.clip(tt / 0.12, 0, 1) * np.clip((dur - tt) / 0.35, 0, 1)
    return np.tanh(filt(s, "lowpass", 900) * 1.4) * env * 0.5


def flutter(dur=0.9):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [300, 2500]) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 22 * tt)))
    return s * np.clip(tt / 0.05, 0, 1) * np.clip((dur - tt) / 0.3, 0, 1) * 0.5


def keys(dur, rate=9, seed=2):
    rng = np.random.default_rng(seed)
    out = np.zeros(int(dur * SR))
    t = 0.0
    while t < dur - 0.05:
        c = click(0.02, 2200 + rng.uniform(-400, 400))
        i = int(t * SR)
        out[i: i + len(c)] += c[: len(out) - i] * rng.uniform(0.5, 1)
        t += rng.uniform(0.6, 1.4) / rate
    return out


COINS_S = sfx("bear/coins")
STAMP = sfx("bear/stamp")
CHEER = sfx("bear/cheer")
CROWD = sfx("bear/crowd")
CRINKLE = sfx("bear/crinkle")
WIND = sfx("gta/wind")
SEA = sfx("grow/seaside")

S = dict(SHOTS)
END = {n: (SHOTS[i + 1][1] if i + 1 < len(SHOTS) else DUR) for i, (n, _) in enumerate(SHOTS)}

# hook: the two coin hills, a lightning crackle between them
mix.add(whoosh(0.9, 400, 6000), O + 0.05, 0.25)
mix.add(thump(70, 45, 0.5, decay=6, click=0.3), O + 0.3, 0.3)
place(WIND, 0.0, 0.1, length=END["hook"], fade_in=0.2, fade_out=0.4)

# round 1: wealth, the columns grow
place(COINS_S, GROW_B, 0.3, length=1.2, fade_out=0.4)
mix.add(sweep(300, 520, 1.0), O + GROW_B, 0.12)
place(COINS_S, GROW_G, 0.4, length=2.2, fade_out=0.6, skip=0.3)
mix.add(sweep(300, 1200, 1.8), O + GROW_G, 0.16)
mix.add(ding(1567.98, 1.0), O + X4, 0.25)

# round 2: fans
place(CROWD, S["fansG"], 0.22, length=END["fansG"] - S["fansG"], fade_in=0.3, fade_out=0.3)
mix.add(click(0.05), O + BOARD - 0.03, 0.4)
mix.add(ding(1318.5, 0.8), O + BOARD, 0.2)
mix.add(whoosh(1.4, 200, 5000), O + GLOBE - 0.3, 0.35)
place(CROWD, GLOBE, 0.3, length=END["fansB"] - GLOBE, fade_in=0.4, fade_out=0.5)
mix.add(ding(2093.0, 1.0), O + NO1, 0.22)

# round 3: spending
mix.add(click(0.04), O + S["spendB"] + 0.4, 0.3)  # the camera's REC
place(COINS_S, MIL, 0.3, length=END["spendB"] - MIL, fade_out=0.4)
mix.add(whoosh(1.0, 300, 6000), O + MIL - 0.1, 0.3)
place(SEA, S["yacht"], 0.3, length=END["factory"] - S["yacht"], fade_in=0.3, fade_out=0.4)
mix.add(horn(1.5), O + HORN, 0.5)
mix.add(ding(1046.5, 0.8), O + RULER, 0.15)
place(STAMP, BOUGHT, 0.6, length=0.9)
mix.add(thump(60, 40, 0.4, decay=7, click=0.3), O + BOUGHT, 0.3)

# round 4: age
mix.add(keys(END["ageG"] - S["ageG"] - 0.3), O + S["ageG"] + 0.2, 0.25)
mix.add(ding(880.0, 0.6), O + BADGE, 0.12)
place(COINS_S, THRONE, 0.35, length=1.6, fade_out=0.5)
mix.add(sweep(400, 900, 0.6), O + THRONE, 0.1)

# final
mix.add(whoosh(0.9, 300, 5000), O + S["final"] - 0.2, 0.3)
mix.add(thump(55, 38, 0.6, decay=5, click=0.25), O + FINAL, 0.35)
place(SEA, S["sea"], 0.35, length=END["sea"] - S["sea"], fade_in=0.4, fade_out=0.4)
mix.add(click(0.03, 1500), O + S["wallet"] + 0.5, 0.2)
mix.add(flutter(1.0), O + MOTH, 0.4)
mix.add(sweep(392, 196, 0.8, 8), O + DOLG + 0.2, 0.15)
place(CRINKLE, ENV - 0.2, 0.35, length=1.0, fade_out=0.4)
place(CHEER, WIN, 0.35, length=DUR - WIN + 0.6, fade_out=1.4)
mix.add(ding(1046.5, 1.4), O + WIN, 0.3)
mix.add(ding(1567.98, 1.0), O + CARD, 0.2)

# score ticks
for at, *_ in SCORE[1:-1]:
    mix.add(ding(2093.0, 0.5), O + at, 0.12)

# ---------------------------------------------------------------- bed: a light bouncy pulse, ducked under the voice
t = mix.t - O
tension = np.interp(t, [0, S["worth"], S["final"], S["final"] + 1.0, WIN, DUR - 1, DUR], [0.45, 0.5, 0.7, 0.4, 0.55, 0.45, 0.0])
base = drone([55.0, 82.4, 110.0], DUR + 1)[: mix.n]
pulse = 0.55 + 0.45 * np.sin(2 * np.pi * 2.4 * t) ** 8
bed = filt(base * pulse, "lowpass", 700) * tension
duck = np.clip(1 - 0.4 * mix.env(O + VO_AT, O + VO_END, 0.3, 0.6), 0.35, 1)
mix.l += bed * duck * 0.32
mix.r += bed * duck * 0.32

final = mix.write("gaben-vs-mrbeast")

cues = {
    "duration": DUR,
    "shots": [[n, round(s, 3)] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "phrases": [[round(a, 3), round(b, 3)] for a, b in PT],
    "growB": GROW_B,
    "growG": GROW_G,
    "x4": X4,
    "board": BOARD,
    "globe": GLOBE,
    "no1": NO1,
    "mil": MIL,
    "horn": HORN,
    "ruler": RULER,
    "bought": BOUGHT,
    "badge": BADGE,
    "throne": THRONE,
    "final": FINAL,
    "minus": MINUS,
    "moth": MOTH,
    "dolg": DOLG,
    "env": ENV,
    "win": WIN,
    "card": CARD,
    "score": SCORE,
}
(ROOT / "src/beast").mkdir(exist_ok=True)
(ROOT / "src/beast/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame) and src/beast/cues.json; voice: {HAVE_VO}")
