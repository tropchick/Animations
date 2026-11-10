"""Soundtrack and timing cues for «Что весит больше: GTA 6 или мать Габена?» (Russian TikTok meme, soft toy 3D).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant», text /mnt/project-files/voice/gtamom/gtamom-vo-text.txt
(Cyrillic vowels + combining U+0301 stress marks). Expected file: audio/voice/gtamom-vo.mp3,
word times audio/voice/gtamom-words.json (audio/transcribe_gtamom.py).

Every shot and event hangs on a caption phrase (P[k].s / P[k].e). Without the take (draft) phrase times are estimates
and the take is left out of the mix. Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30).

Sync map (story time of the on-screen event <-> sound):
  LAND_BOX / LAND_MOM  box and slipper hit the floor           <-> thumps + floor crack
  FLASH                selfie flash                            <-> camera shutter
  WIFI_OFF             neighbour's router lights die           <-> sad down-beep
  NET_OFF              planet lights go out                    <-> blackout sweep
  INTO_CLOUD           the box enters the cloud                <-> whoosh
  THUNDER              cloud darkens, lightning                <-> thunder
  SIT                  the slipper lands on the cloud          <-> soft poof
  CLOUD_HIT            the cloud lands on the city             <-> big soft impact
  PRESS                washing machine button                  <-> click, then fuse pop at FUSE
  CONSOLE              console button                          <-> click + rising hum
  EU_OFF               Europe goes dark                        <-> blackout
  LIFT                 lift doors try to close                 <-> door bumps + overload buzzer
  ROW_k                file rows appear                        <-> ticks, the last one a fat thud
  REVEAL               the island is a slipper                 <-> braam
  WIN                  winner plate                            <-> ding
"""

import json
import sys

import numpy as np

from slime_lib import ROOT, SR, Mix, click, drone, filt, load, thump, ting, tt_, white

OFF = 1 / 30
VO_AT = 0.15
VO_PATH = ROOT / "audio/voice/gtamom-vo.mp3"
WORDS_PATH = ROOT / "audio/voice/gtamom-words.json"

PHRASES = [
    ("GTA 6 весит 212 гигабайт.", 2.6),  # 0
    ("Это больше, чем мать Габена?", 1.8),  # 1
    ("Проверим.", 0.8),  # 2
    ("Интернет.", 0.8),  # 3
    ("Мать Габена отправила селфи — у соседей завис вайфай.", 3.4),  # 4
    ("GTA 6 начали качать — интернет лёг на всей планете.", 3.4),  # 5
    ("Облако.", 0.7),  # 6
    ("GTA 6 загрузили в облако — оно потемнело.", 2.8),  # 7
    ("Мать Габена присела на облако — оно упало.", 2.8),  # 8
    ("Запуск.", 0.7),  # 9
    ("Мать Габена включила стиралку — выбило пробки.", 3.0),  # 10
    ("GTA 6 включили на приставке — свет погас во всей Европе.", 3.6),  # 11
    ("Загрузка.", 0.8),  # 12
    ("GTA 6 грузится три дня.", 1.8),  # 13
    ("Мать Габена грузится в лифт с 2004-го.", 3.2),  # 14
    ("Два — два.", 0.9),  # 15
    ("Открываем файлы игры.", 1.5),  # 16
    ("Город — два гигабайта.", 1.5),  # 17
    ("Машины — три.", 1.0),  # 18
    ("Мать Габена — двести семь.", 1.8),  # 19
    ("Она в игре вместо острова.", 1.8),  # 20
    ("Гигабайт — это килограмм.", 1.7),  # 21
    ("И это только её левый тапок.", 2.0),  # 22
]
GAP = 0.3
LONG_GAP = {2: 0.1, 5: 0.2, 8: 0.2, 11: 0.2, 14: 0.2, 16: 0.5, 19: 0.3, 20: 0.5}

HAVE_VO = VO_PATH.exists() and WORDS_PATH.exists() and "--draft" not in sys.argv

# measured phrase windows in take time (from whisper, once the take exists)
MEASURED: list[tuple[float, float]] = [
    (0.0, 3.12), (3.6, 5.22), (5.58, 6.1), (6.58, 7.08), (7.68, 11.24), (11.6, 15.8), (16.46, 16.92), (17.4, 20.46), (20.96, 23.94), (24.56, 25.04),
    (25.44, 28.5), (28.54, 33.22), (33.76, 34.32), (34.64, 36.66), (37.06, 40.08), (40.6, 41.4), (41.74, 43.06), (44.28, 46.1), (46.56, 47.5), (47.98, 49.64),
    (50.0, 51.6), (52.8, 54.7), (54.94, 56.8),
]  # take vBkEJBCQAybOg9VfT5Xv (flow 0BA3pM8biL0cfXJ0SQRk, 760 credits), 62.8 s raw, atempo 1.1 -> 57.1 s

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
        if a - VO_AT - 0.05 <= w[0] < b - VO_AT and w[2].lower().strip(" ,.—-«»:…?").startswith(prefix):
            return VO_AT + w[0]
    return a + (b - a) * frac


# ---------------------------------------------------------------- shots
WIFI = word_at(4, "у", 0.55) - 0.15
EUROPE = word_at(11, "свет", 0.6) - 0.2
SHOTS = [
    ("hook", 0.0),
    ("selfie", P[3].s - 0.1),
    ("wifi", WIFI),
    ("planet", P[5].s - 0.1),
    ("cloudG", P[6].s - 0.1),
    ("cloudM", P[8].s - 0.1),
    ("washer", P[9].s - 0.1),
    ("console", P[11].s - 0.1),
    ("europe", EUROPE),
    ("loading", P[12].s - 0.1),
    ("lift", P[14].s - 0.1),
    ("files", P[15].s - 0.1),
    ("island", P[20].s - 0.15),
    ("robe", P[22].s - 0.1),
]

LAND_BOX = word_at(0, "вес", 0.3) - 0.1
LAND_MOM = word_at(1, "мать", 0.6) + 0.05
FLASH = word_at(4, "селф", 0.45) + 0.1
WIFI_OFF = word_at(4, "завис", 0.78) + 0.05
DL = word_at(5, "кача", 0.35)
NET_OFF = (word_at(5, "лёг", 0.7) - 0.1, P[5].e + 0.3)
INTO_CLOUD = word_at(7, "облак", 0.45) + 0.05
THUNDER = word_at(7, "потемн", 0.8) + 0.1
SIT = word_at(8, "облак", 0.5)
CLOUD_HIT = word_at(8, "упал", 0.85) + 0.25
PRESS = word_at(10, "стирал", 0.45) + 0.1
FUSE = word_at(10, "выбил", 0.75) + 0.05
CONSOLE = word_at(11, "приста", 0.4) + 0.1
EU_OFF = (word_at(11, "погас", 0.72) - 0.05, P[11].e + 0.4)
LOAD_AT = P[13].s
LIFT_AT = word_at(14, "лифт", 0.55)
ROWS = [word_at(17, "город", 0.1), word_at(18, "машин", 0.1), word_at(19, "мать", 0.1)]
ROW_BIG = word_at(19, "двест", 0.6)
REVEAL = word_at(20, "вмест", 0.5)
WIN = P[20].e + 0.35
BAIT = P[21].s
LEFT = word_at(22, "лев", 0.75)
GTA7 = P[22].e + 0.5
# score steps: [time, gta points, mom points, gta share of the bar]
SCORE = [
    [-1, 0, 0, 0.5],
    [P[5].e + 0.15, 1, 0, 0.66],
    [P[8].e + 0.25, 1, 1, 0.5],
    [P[11].e + 0.25, 2, 1, 0.64],
    [P[14].e + 0.2, 2, 2, 0.5],
    [WIN, 2, 3, 0.0],
]
DUR = round(GTA7 + 1.8, 2)

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
    shown = []
    for tok in text.split(" "):
        if tok == "—":
            shown[-1] += " —"
        else:
            shown.append(tok)
    for j, tok in enumerate(shown):
        end = starts[j + 1] if j + 1 < len(shown) else end_of
        words.append([round(starts[j], 3), round(end, 3), tok, k])
GROUPS = [[0], [1], [2, 3], [4], [5], [6], [7], [8], [9], [10], [11], [12], [13], [14], [15, 16], [17], [18], [19], [20], [21], [22]]

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


def whoosh(dur=1.2, lo=200, hi=6000, rev=False):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [lo, hi])
    c = 0.75 if rev else 0.45
    shape = np.exp(-((tt - dur * c) / (dur * 0.25)) ** 2)
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


def buzz(f=110, dur=0.7):
    tt = tt_(dur)
    s = np.sign(np.sin(2 * np.pi * f * tt)) * 0.5 + np.sign(np.sin(2 * np.pi * f * 1.06 * tt)) * 0.3
    return filt(s, "lowpass", 2200) * np.clip((dur - tt) / 0.05, 0, 1)


def beep(f=1800, dur=0.12):
    tt = tt_(dur)
    return np.sin(2 * np.pi * f * tt) * 0.4 * np.clip((dur - tt) / 0.02, 0, 1)


def downbeep():
    tt = tt_(0.5)
    f = 900 - 500 * tt / 0.5
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 * np.clip((0.5 - tt) / 0.05, 0, 1)


def shutter():
    tt = tt_(0.12)
    s = filt(white(len(tt)), "bandpass", [1500, 8000]) * np.exp(-tt * 60)
    return s * 0.8


def poof(dur=0.7):
    tt = tt_(dur)
    s = filt(white(len(tt)), "lowpass", 900) * np.exp(-tt * 6) * np.clip(tt / 0.02, 0, 1)
    return s


def hum_up(dur=1.6):
    tt = tt_(dur)
    f = 60 + 140 * (tt / dur) ** 1.5
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + np.sin(2 * np.pi * np.cumsum(f * 2.01) / SR) * 0.2
    return s * np.clip(tt / 0.2, 0, 1)


IMPACT = sfx("gta/impact")
BLACKOUT = sfx("gta/blackout")
LIGHTS_OFF = sfx("scp/lights_off")
WIND = sfx("gta/wind")
CITYS = sfx("earth/city")
LIFT_S = sfx("murino/lift")
SERVERS = sfx("gta/servers")
HUM = sfx("scp/hum")
MOONS = sfx("gta/moon")
SEASIDE = sfx("grow/seaside")
PLOP = sfx("bear/plop")
STAMP = sfx("bear/stamp")

S = dict(SHOTS)
END = {n: (SHOTS[i + 1][1] if i + 1 < len(SHOTS) else DUR) for i, (n, _) in enumerate(SHOTS)}

# hook: two landings
mix.add(thump(70, 45, 0.5, decay=6, click=0.3), O + LAND_BOX, 0.5, pan=-0.3)
mix.add(thump(60, 40, 0.6, decay=5, click=0.3), O + LAND_MOM, 0.55, pan=0.3)
place(IMPACT, LAND_MOM, 0.2, length=1.0, fade_out=0.4)

# internet
mix.add(shutter(), O + FLASH, 0.5)
mix.add(downbeep(), O + WIFI_OFF, 0.35, pan=0.2)
place(MOONS, S["planet"], 0.18, length=END["planet"] - S["planet"], fade_in=0.3, fade_out=0.3)
for j in range(10):
    mix.add(beep(1400 + 90 * j, 0.06), O + DL + j * 0.09, 0.08, pan=0.6 * np.sin(j * 1.9))
place(BLACKOUT, NET_OFF[0], 0.45, length=2.0, fade_out=0.6)

# cloud
place(WIND, S["cloudG"], 0.2, length=END["cloudM"] - S["cloudG"], fade_in=0.3, fade_out=0.4)
mix.add(whoosh(0.9, 300, 5000), O + INTO_CLOUD - 0.45, 0.4)
mix.add(filt(white(int(2.2 * SR)), "lowpass", 300) * np.exp(-tt_(2.2) * 2.2) * np.clip(tt_(2.2) / 0.01, 0, 1), O + THUNDER, 0.7)
mix.add(poof(), O + SIT, 0.5)
mix.add(whoosh(0.9, 100, 2500), O + CLOUD_HIT - 0.8, 0.4)
mix.add(thump(50, 30, 0.9, decay=3, click=0.1), O + CLOUD_HIT, 0.6)
mix.add(poof(1.2), O + CLOUD_HIT, 0.5)
place(CITYS, S["cloudM"] + 0.3, 0.15, length=END["cloudM"] - S["cloudM"], fade_in=0.4, fade_out=0.2)

# launch
mix.add(click(0.04), O + PRESS, 0.5)
mix.add(hum_up(0.6) * 0.5, O + PRESS + 0.05, 0.25)
mix.add(thump(120, 80, 0.2, decay=20, click=0.6), O + FUSE, 0.45)
place(LIGHTS_OFF, FUSE, 0.4, length=1.4, fade_out=0.4)
mix.add(click(0.04), O + CONSOLE, 0.5)
mix.add(hum_up(EUROPE - CONSOLE + 0.2), O + CONSOLE + 0.05, 0.22)
place(BLACKOUT, EU_OFF[0], 0.45, length=2.2, fade_out=0.6)

# load
place(HUM, S["loading"], 0.2, length=END["loading"] - S["loading"], fade_in=0.2, fade_out=0.2)
for j in range(6):
    mix.add(beep(1100, 0.05), O + LOAD_AT + 0.3 + j * 0.25, 0.06)
place(LIFT_S, S["lift"], 0.35, length=END["lift"] - S["lift"], fade_in=0.1, fade_out=0.3)
for j in range(3):
    mix.add(thump(140, 90, 0.18, decay=18, click=0.5), O + LIFT_AT + 0.15 + j * 0.55, 0.35, pan=0.3 * (1 if j % 2 else -1))
    mix.add(buzz(440, 0.25), O + LIFT_AT + 0.25 + j * 0.55, 0.12)

# final: file rows, reveal, win
for j, at in enumerate(ROWS[:2]):
    mix.add(ding(1567.98 + 200 * j, 0.5), O + at, 0.15)
place(STAMP, ROW_BIG, 0.5, length=0.8)
mix.add(thump(55, 35, 0.6, decay=5, click=0.3), O + ROW_BIG, 0.4)
place(SEASIDE, S["island"], 0.3, length=END["robe"] - S["island"] + 1.5, fade_in=0.3, fade_out=1.0)
mix.add(braam(36.7, 2.8), O + REVEAL, 0.3)
mix.add(ding(1046.5, 1.4), O + WIN, 0.3)
mix.add(whoosh(1.2, 100, 3000), O + S["robe"], 0.3)
mix.add(ding(784.0, 1.6), O + GTA7, 0.25)

# score ticks
for at, *_ in SCORE[1:-1]:
    mix.add(ding(2093.0, 0.5), O + at, 0.12)

# ---------------------------------------------------------------- bed: a light bouncy pulse
t = mix.t - O
tension = np.interp(t, [0, S["selfie"], S["loading"], S["files"], ROW_BIG, ROW_BIG + 0.2, REVEAL, DUR - 1, DUR], [0.4, 0.45, 0.6, 0.75, 0.85, 0.0, 0.5, 0.4, 0.0])
base = drone([49.0, 73.4, 98.0], DUR + 1)[: mix.n]
rate = np.interp(t, [0, S["files"], ROW_BIG, DUR], [2.0, 3.0, 2.0, 2.0])
pulse = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(rate) / SR) ** 8
bed = filt(base * pulse, "lowpass", 700) * tension
duck = np.ones(mix.n)
if HAVE_VO:
    duck -= 0.4 * mix.env(O + VO_AT, O + VO_END, 0.3, 0.6)
duck = np.clip(duck, 0.35, 1)
mix.l += bed * duck * 0.32
mix.r += bed * duck * 0.32

final = mix.write("gta-vs-mom")

cues = {
    "duration": DUR,
    "draft": not HAVE_VO,
    "shots": [[n, round(s, 3)] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "phrases": [[round(a, 3), round(b, 3)] for a, b in PT],
    "landBox": LAND_BOX,
    "landMom": LAND_MOM,
    "flash": FLASH,
    "wifiOff": WIFI_OFF,
    "dl": DL,
    "netOff": list(NET_OFF),
    "intoCloud": INTO_CLOUD,
    "thunder": THUNDER,
    "sit": SIT,
    "cloudHit": CLOUD_HIT,
    "press": PRESS,
    "fuse": FUSE,
    "console": CONSOLE,
    "euOff": list(EU_OFF),
    "loadAt": LOAD_AT,
    "liftAt": LIFT_AT,
    "rows": ROWS,
    "rowBig": ROW_BIG,
    "reveal": REVEAL,
    "win": WIN,
    "bait": BAIT,
    "left": LEFT,
    "gta7": GTA7,
    "score": SCORE,
}
(ROOT / "src/gtamom").mkdir(exist_ok=True)
(ROOT / "src/gtamom/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame, {'with voice' if HAVE_VO else 'DRAFT without voice'}) and src/gtamom/cues.json")
