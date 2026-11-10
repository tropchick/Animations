"""Soundtrack and timing cues for «GTA 7 или Half-Life 3: что выйдет быстрее?» (Russian TikTok race, soft toy 3D).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant» (flow nB12SudknIxbwQL2rs7I, 938 credits),
71.9 s raw (audio/voice/hl3gta-vo-raw.mp3) -> atempo 1.12 = 64.3 s (audio/voice/hl3gta-vo.mp3).
Word times: audio/voice/hl3gta-words.json (audio/transcribe_hl3gta.py). Frame 0 is the cover: v = (frame - 1) / 30.

Sync map (story time of the on-screen event <-> sound):
  LIGHTS / GO      traffic light red, yellow, green      <-> beeps, the green one higher; wheels screech + motor
  STEP3 / SLIDE    HL3 reaches for step 3, slides back    <-> boing, slide whistle down + bump
  HOPS             GTA hops onto 5, 6, 7                  <-> rising boings
  FLIPS            calendar pages fly off                 <-> paper flaps
  SNORE            GTA 7 asleep                           <-> soft snore
  READY            «ПОЧТИ ГОТОВО» plate                   <-> ding
  COINS            coins fall on the HL3 sofa             <-> coins
  BILLION/LAUNCH   «$1 000 000 000», GTA rolls down ramp   <-> register ding, whoosh
  KNOCKS           GTA knocks on the locked door          <-> three knocks
  POP              toast pops                             <-> spring pop
  FLASH            photo finish flash                     <-> shutter
  VOID             «НЕ ЗАСЧИТАНО» stamp                    <-> stamp + braam
  WIN              podium, confetti                       <-> cheer + ding
"""

import json

import numpy as np

from slime_lib import ROOT, SR, Mix, click, drone, filt, load, thump, ting, tt_, white

OFF = 1 / 30
VO_AT = 0.15
VO_PATH = ROOT / "audio/voice/hl3gta-vo.mp3"
WORDS_PATH = ROOT / "audio/voice/hl3gta-words.json"

PHRASES = [
    "GTA 7 или Half-Life 3: что выйдет быстрее?",  # 0
    "Последняя Half-Life вышла 19 лет назад.",  # 1
    "А GTA 7 даже не анонсировали.",  # 2
    "Число.",  # 3
    "Valve не умеет считать до трёх —",  # 4
    "Half-Life застряла на двойке.",  # 5
    "Rockstar считает отлично:",  # 6
    "пять, шесть, семь.",  # 7
    "Разработка.",  # 8
    "Между пятой и шестой GTA прошло 13 лет —",  # 9
    "седьмая выйдет в тридцать девятом.",  # 10
    "А Half-Life 3 делают уже 19 лет.",  # 11
    "Значит, она почти готова.",  # 12
    "Деньги.",  # 13
    "Valve столько зарабатывает на Steam, что игры ей делать не нужно.",  # 14
    "GTA 6 за день принесёт миллиард, и Rockstar сразу сядет за седьмую.",  # 15
    "Железо.",  # 16
    "GTA 7 нужна приставка, которую ещё не придумали.",  # 17
    "Half-Life 3 запустится даже на тостере.",  # 18
    "Два — два.",  # 19
    "Финиш!",  # 20
    "Фотофиниш:",  # 21
    "Half-Life впереди на нос.",  # 22
    "Но на коробке написано: «Эпизод три».",  # 23
    "Valve снова не досчитала до трёх.",  # 24
    "Победила GTA 7.",  # 25
    "Выйдет в тридцать девятом.",  # 26
    "Без версии для ПК.",  # 27
]
# measured phrase windows in take time (whisper on the 1.12x take)
MEASURED = [
    (0.0, 3.62), (4.24, 7.2), (7.56, 9.82), (10.24, 10.8), (11.18, 12.98), (13.24, 15.1), (15.46, 16.9), (17.16, 18.7), (19.08, 19.9), (20.2, 23.0),
    (23.5, 25.38), (25.64, 28.2), (28.3, 30.42), (30.86, 31.48), (31.78, 35.32), (35.72, 40.18), (40.72, 41.38), (41.66, 44.88), (45.14, 47.76), (48.28, 49.3),
    (49.6, 50.3), (50.96, 51.7), (51.84, 53.5), (53.58, 56.06), (56.48, 58.36), (59.02, 60.72), (60.9, 62.44), (62.64, 63.88),
]
PT = [(VO_AT + a, VO_AT + b) for a, b in MEASURED]


class _P:
    def __init__(self, k):
        self.s, self.e = PT[k]


P = [_P(k) for k in range(len(PHRASES))]
VO_END = P[-1].e

# whisper words, «Half» + «-Life» glued so tokens match the caption text
WH = []
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
    print(f"!! no «{prefix}» in phrase {k}")
    return a + (b - a) * frac


# ---------------------------------------------------------------- shots
SHOTS = [
    ("hook", 0.0),
    ("race", P[1].s - 0.12),
    ("stairsH", P[3].s - 0.12),
    ("stairsG", P[6].s - 0.12),
    ("calendar", P[8].s - 0.12),
    ("loading", P[11].s - 0.12),
    ("sofa", P[13].s - 0.12),
    ("tower", P[15].s - 0.12),
    ("door", P[16].s - 0.12),
    ("toaster", P[18].s - 0.12),
    ("finish", P[19].s - 0.12),
    ("photo", P[21].s - 0.12),
    ("reveal", word_at(23, "коробк", 0.3) - 0.15),
    ("podium", P[25].s - 0.12),
]

GO = word_at(0, "быстр", 0.8)
LIGHTS = [0.35, (0.35 + GO) / 2, GO]
STEP3 = word_at(4, "трех", 0.9)
SLIDE = word_at(5, "застр", 0.4)
HOPS = [word_at(7, "пять", 0.05), word_at(7, "шест", 0.4), word_at(7, "сем", 0.75)]
FLIP0 = P[9].s + 0.2
FLIP1 = word_at(10, "тридц", 0.6)
SNORE = P[10].e + 0.1
LOAD_AT = P[11].s
READY = word_at(12, "готов", 0.8)
COINS = P[13].s + 0.1
BILLION = word_at(15, "миллиард", 0.4)
LAUNCH = word_at(15, "сразу", 0.75)
KNOCK = word_at(17, "котор", 0.5)
KNOCKS = [KNOCK, KNOCK + 0.35, KNOCK + 0.7]
POP = word_at(18, "тостер", 0.8)
FLASH = word_at(21, "фотоф", 0.2) + 0.25
NOSE = word_at(22, "нос", 0.85)
EP3 = word_at(23, "эпизод", 0.75)
VOID = word_at(24, "снова", 0.3)
WIN = P[25].s
Y2039 = word_at(26, "тридц", 0.5)
NOPC = word_at(27, "верси", 0.4)
# score steps: [time, hl3 points, gta points]
SCORE = [
    [-1, 0, 0],
    [P[7].e + 0.15, 0, 1],
    [P[12].e + 0.2, 1, 1],
    [P[15].e + 0.15, 1, 2],
    [P[18].e + 0.2, 2, 2],
    [WIN + 0.2, 2, 3],
]
DUR = round(VO_END + 1.6, 2)

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
GROUPS = [[0], [1], [2], [3, 4], [5], [6, 7], [8], [9], [10], [11], [12], [13], [14], [15], [16], [17], [18], [19, 20], [21, 22], [23], [24], [25], [26], [27]]

mix = Mix(DUR + OFF + 0.6)
O = OFF
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


def tone(f, dur=0.25):
    tt = tt_(dur)
    return (np.sin(2 * np.pi * f * tt) * 0.5 + np.sin(4 * np.pi * f * tt) * 0.15) * np.clip(tt / 0.01, 0, 1) * np.clip((dur - tt) / 0.04, 0, 1)


def sweep(f0, f1, dur, wob=0.0):
    tt = tt_(dur)
    f = f0 + (f1 - f0) * (tt / dur) + wob * np.sin(2 * np.pi * 6 * tt)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.45 * np.clip(tt / 0.02, 0, 1) * np.clip((dur - tt) / 0.06, 0, 1)


def boing(f=220, dur=0.45):
    tt = tt_(dur)
    f_ = f * (1 + 0.5 * np.exp(-tt * 12) * np.sin(2 * np.pi * 14 * tt))
    return np.sin(2 * np.pi * np.cumsum(f_) / SR) * np.exp(-tt * 6) * 0.5


def motor(dur, f=95):
    tt = tt_(dur)
    s = np.sign(np.sin(2 * np.pi * f * tt + 0.3 * np.sin(2 * np.pi * 7 * tt))) * 0.4
    return filt(s, "lowpass", 1400) * np.clip(tt / 0.1, 0, 1) * np.clip((dur - tt) / 0.2, 0, 1)


def flap():
    tt = tt_(0.14)
    return filt(white(len(tt)), "bandpass", [800, 5000]) * np.exp(-tt * 30) * 0.6


def snore(dur=1.4):
    tt = tt_(dur)
    env = np.sin(np.pi * tt / dur) ** 2
    s = filt(brownish(len(tt)), "bandpass", [90, 500]) * env
    return s


def brownish(n):
    return np.cumsum(np.random.default_rng(4).normal(0, 1, n)) * 0.02 % 2 - 1


def shutter():
    tt = tt_(0.12)
    return filt(white(len(tt)), "bandpass", [1500, 8000]) * np.exp(-tt * 60) * 0.8


COINS_S = sfx("bear/coins")
STAMP = sfx("bear/stamp")
CHEER = sfx("bear/cheer")
CROWD = sfx("gta/crowd")
KNOCK_S = sfx("scp/knock")
TIRES = sfx("earth/tires")
WIND = sfx("gta/wind")
CREAK = sfx("grow/creak")
HUM = sfx("scp/hum")
CRINKLE = sfx("bear/crinkle")

S = dict(SHOTS)
END = {n: (SHOTS[i + 1][1] if i + 1 < len(SHOTS) else DUR) for i, (n, _) in enumerate(SHOTS)}

# hook: the start lights, launch, race
for j, at in enumerate(LIGHTS):
    mix.add(tone(660 if j < 2 else 1320, 0.28 if j < 2 else 0.5), O + at, 0.3)
place(TIRES, GO, 0.3, length=1.2, fade_out=0.5)
mix.add(motor(END["race"] - GO, 92), O + GO, 0.12, pan=-0.2)
mix.add(motor(END["race"] - GO, 104), O + GO, 0.12, pan=0.2)
place(CROWD, 0.0, 0.12, length=END["race"], fade_in=0.2, fade_out=0.6)
place(WIND, S["race"], 0.15, length=END["race"] - S["race"], fade_in=0.3, fade_out=0.3)

# round 1: stairs
mix.add(boing(260), O + S["stairsH"] + 0.5, 0.25)
mix.add(boing(330), O + S["stairsH"] + 1.15, 0.25)
mix.add(boing(390, 0.3), O + STEP3, 0.25)
mix.add(sweep(900, 180, SLIDE - 0.35 - STEP3 - 0.5, 20), O + STEP3 + 0.5, 0.3)  # the fall back
mix.add(thump(110, 70, 0.3, decay=12, click=0.4), O + SLIDE + 0.1, 0.45)
mix.add(sweep(392, 330, 0.6), O + SLIDE + 0.5, 0.12)
for j, at in enumerate(HOPS):
    mix.add(boing(330 * 1.26 ** j), O + at, 0.3)
    mix.add(thump(140, 90, 0.18, decay=18, click=0.5), O + at + 0.22, 0.25)

# round 2: calendar, loading
n = 14
for j in range(n):
    at = FLIP0 + (FLIP1 - FLIP0) * (j / (n - 1)) ** 0.8
    mix.add(flap(), O + at, 0.35, pan=0.4 * np.sin(j * 1.7))
place(WIND, S["calendar"], 0.12, length=END["calendar"] - S["calendar"], fade_in=0.3, fade_out=0.3)
mix.add(snore(1.3), O + SNORE, 0.25)
place(HUM, S["loading"], 0.18, length=END["loading"] - S["loading"], fade_in=0.2, fade_out=0.2)
for j in range(5):
    mix.add(tone(1100, 0.05), O + LOAD_AT + 0.3 + j * 0.4, 0.05)
mix.add(ding(1567.98, 0.9), O + READY, 0.2)

# round 3: money
place(COINS_S, COINS, 0.35, length=END["sofa"] - COINS, fade_out=0.4)
mix.add(snore(1.2), O + COINS + 2.2, 0.2)
place(CREAK, S["tower"], 0.2, length=1.6, fade_out=0.5)
mix.add(ding(2093.0, 0.8) + 0, O + BILLION, 0.3)
mix.add(click(0.05), O + BILLION - 0.04, 0.4)
mix.add(whoosh(1.1, 200, 5000), O + LAUNCH - 0.2, 0.4)
mix.add(motor(1.5, 120), O + LAUNCH, 0.12)

# round 4: hardware
for at in KNOCKS:
    mix.add(thump(180, 120, 0.15, decay=25, click=0.7), O + at, 0.5)
mix.add(sweep(300, 280, 0.6) * 0.3, O + KNOCKS[-1] + 0.6, 0.08)
mix.add(click(0.04), O + S["toaster"] + 0.3, 0.3)
mix.add(boing(520, 0.35), O + POP, 0.35)
mix.add(click(0.06, 1800), O + POP, 0.5)
mix.add(boing(300), O + POP + 0.55, 0.25)

# final
place(CROWD, S["finish"], 0.3, length=FLASH - S["finish"] + 0.4, fade_in=0.3, fade_out=0.4)
mix.add(motor(FLASH - S["finish"], 92), O + S["finish"], 0.13, pan=-0.2)
mix.add(motor(FLASH - S["finish"], 104), O + S["finish"], 0.13, pan=0.2)
mix.add(shutter(), O + FLASH, 0.6)
mix.add(thump(60, 40, 0.5, decay=6, click=0.2), O + FLASH, 0.3)
for j in range(8):
    mix.add(click(0.02, 2500), O + FLASH + 0.4 + j * 0.09, 0.12)  # the printer
mix.add(ding(1318.5, 0.9), O + NOSE, 0.18)
mix.add(whoosh(0.8, 300, 4000), O + S["reveal"] - 0.3, 0.3)
place(STAMP, VOID, 0.6, length=0.9)
mix.add(braam(36.7, 2.4), O + VOID, 0.3)
mix.add(sweep(392, 196, 1.0, 10), O + VOID + 0.6, 0.15)
place(CHEER, WIN, 0.35, length=DUR - WIN + 0.6, fade_out=1.2)
mix.add(ding(1046.5, 1.4), O + WIN, 0.3)
place(CRINKLE, WIN + 0.1, 0.25, length=1.5, fade_out=0.6)
mix.add(ding(784.0, 1.2), O + Y2039, 0.2)
place(STAMP, NOPC + 0.25, 0.35, length=0.7)

# score ticks
for at, *_ in SCORE[1:-1]:
    mix.add(ding(2093.0, 0.5), O + at, 0.12)

# ---------------------------------------------------------------- bed: a light bouncy race pulse
t = mix.t - O
tension = np.interp(t, [0, S["race"], S["finish"], FLASH, FLASH + 0.2, VOID, WIN, DUR - 1, DUR], [0.45, 0.5, 0.75, 0.9, 0.0, 0.35, 0.55, 0.45, 0.0])
base = drone([55.0, 82.4, 110.0], DUR + 1)[: mix.n]
rate = np.interp(t, [0, S["finish"], FLASH, DUR], [2.2, 3.2, 2.2, 2.2])
pulse = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(rate) / SR) ** 8
bed = filt(base * pulse, "lowpass", 700) * tension
duck = np.clip(1 - 0.4 * mix.env(O + VO_AT, O + VO_END, 0.3, 0.6), 0.35, 1)
mix.l += bed * duck * 0.32
mix.r += bed * duck * 0.32

final = mix.write("hl3-vs-gta7")

cues = {
    "duration": DUR,
    "shots": [[n, round(s, 3)] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "phrases": [[round(a, 3), round(b, 3)] for a, b in PT],
    "lights": LIGHTS,
    "go": GO,
    "step3": STEP3,
    "slide": SLIDE,
    "hops": HOPS,
    "flip": [FLIP0, FLIP1],
    "snore": SNORE,
    "loadAt": LOAD_AT,
    "ready": READY,
    "coins": COINS,
    "billion": BILLION,
    "launch": LAUNCH,
    "knocks": KNOCKS,
    "pop": POP,
    "flash": FLASH,
    "nose": NOSE,
    "ep3": EP3,
    "void": VOID,
    "win": WIN,
    "y2039": Y2039,
    "nopc": NOPC,
    "score": SCORE,
}
(ROOT / "src/hl3gta").mkdir(exist_ok=True)
(ROOT / "src/hl3gta/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame) and src/hl3gta/cues.json")
