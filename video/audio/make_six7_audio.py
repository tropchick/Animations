"""Soundtrack and timing cues for «Что если число 67 запретят?» (Russian TikTok chain, soft toy 3D).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant», text /mnt/project-files/voice/six7/six7-vo-text.txt
(Cyrillic + combining U+0301 stress marks; «Six seven!» at the start and the end is in English on purpose).
Expected file: audio/voice/six7-vo.mp3 (already sped up), word times audio/voice/six7-words.json (audio/transcribe_six7.py).

Every shot and event is anchored to a caption phrase (P[k].s / P[k].e):
  - with the voice file and MEASURED filled in, phrase times come from the take;
  - without them (draft), phrase times are estimated and the take is left out of the mix.

Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30); the track gets 1/30 s in front.

Sync map (story time of the on-screen event <-> sound):
  STAMP     the stamp hits the law, 67 drops out of the number line   <-> stamp thud + crack
  WHISTLE   the head teacher blows the whistle in class              <-> whistle
  POSTER    the poster is slapped on the wall                        <-> paper slap
  TAPE      the tape goes over the scales                            <-> tape rip
  CALC      the calculator shows «ОШИБКА»                            <-> error buzz
  BUSFLIP   the bus sign flips 67 -> 66+1                            <-> flip clack
  CAKE      the cake candles jump 66 -> 68                           <-> pop + sad trombone
  HANDS     the class raises hands                                   <-> whoosh of sleeves
  NEWS      the 6,7 news card on TV                                  <-> news chime
  RULER     the ruler lights 6'7"                                    <-> ding
  DENY      «ВЪЕЗД ЗАПРЕЩЁН» stamp                                   <-> stamp + buzzer
  VOTE      «ЗА: 67» lights up                                       <-> scoreboard tick + gasp hit
  VOID      the law is struck out, 67 returns                        <-> reverse whoosh + pop
  FINAL     «Six seven!» the whole class does the gesture            <-> crowd cheer
"""

import json
import sys

import numpy as np

from slime_lib import ROOT, SR, Mix, beep, click, drone, filt, load, thump, ting, tt_, white

OFF = 1 / 30
VO_AT = 0.2
VO_PATH = ROOT / "audio/voice/six7-vo.mp3"
WORDS_PATH = ROOT / "audio/voice/six7-words.json"

# caption phrases: text as shown on screen, and the estimated length used for the draft
PHRASES = [
    ("Six seven!", 1.0),  # 0
    ("Что если бы число 67 запретили?", 2.6),  # 1
    ("Учителя не выдержали.", 1.5),  # 2
    ("Совет учителей страны принял закон:", 2.2),  # 3
    ("67 больше нет.", 1.5),  # 4
    ("Школьники начали показывать его руками.", 2.3),  # 5
    ("Тогда запретили и жест.", 1.5),  # 6
    ("Вместе с ним под запрет попали весы.", 2.1),  # 7
    ("Калькуляторы на 60 + 7 пишут «ошибка».", 3.0),  # 8
    ("Автобус номер 67 теперь называется «66 + 1».", 3.6),  # 9
    ("Дедушке исполнилось 66,", 1.9),  # 10
    ("а следующий торт был уже с цифрой 68.", 2.6),  # 11
    ("Он потерял целый год.", 1.5),  # 12
    ("Школьники искали лазейки", 1.6),  # 13
    ("и впервые полюбили математику.", 1.9),  # 14
    ("Средняя оценка по стране выросла до 6,7.", 3.2),  # 15
    ("Баскетболистов ростом 2 м 1 см не пускают в страну:", 3.4),  # 16
    ("в Америке это 6 футов 7 дюймов.", 2.4),  # 17
    ("А потом кто-то пересчитал голоса.", 2.0),  # 18
    ("«За» проголосовали ровно 67 учителей.", 2.8),  # 19
    ("Закон запретил сам себя.", 1.7),  # 20
    ("Six seven!", 1.1),  # 21
]
GAP = 0.32

HAVE_VO = VO_PATH.exists() and "--draft" not in sys.argv

# measured phrase windows in take time (from whisper once the take exists): list of (start, end)
MEASURED: list[tuple[float, float]] = [
    (0.0, 0.9),  # 0
    (1.54, 4.16),  # 1
    (4.56, 6.06),  # 2
    (6.5, 8.66),  # 3
    (9.12, 10.96),  # 4
    (11.36, 13.5),  # 5
    (13.84, 15.46),  # 6
    (15.96, 18.24),  # 7
    (18.54, 21.56),  # 8
    (21.92, 26.32),  # 9
    (26.7, 28.9),  # 10
    (29.16, 32.5),  # 11
    (32.78, 34.26),  # 12
    (34.84, 36.58),  # 13
    (36.58, 39.04),  # 14
    (39.44, 43.16),  # 15
    (43.54, 47.68),  # 16
    (47.9, 50.52),  # 17
    (50.92, 53.04),  # 18
    (53.32, 56.4),  # 19
    (56.68, 58.48),  # 20
    (58.82, 59.82),  # 21
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


def at_frac(k, f):
    return round(P[k].s + (P[k].e - P[k].s) * f, 3)


# ---------------------------------------------------------------- events
WH0 = json.loads(WORDS_PATH.read_text()) if HAVE_VO and MEASURED and WORDS_PATH.exists() else []


def word(prefix, k, frac):
    """story time of the first whisper word starting with prefix inside phrase k; draft: a fraction of the phrase"""
    a, b = PT[k]
    for w in WH0:
        if a - VO_AT - 0.05 <= w[0] < b - VO_AT and w[2].lower().strip("«»,.!?:").startswith(prefix):
            return round(VO_AT + w[0], 3)
    return at_frac(k, frac)


STAMP = word("шестьдесят", 4, 0.05)
WHISTLE = word("показывать", 5, 0.45)
POSTER = word("жест", 6, 0.55)
TAPE = word("весы", 7, 0.6)
CALC = word("ошибка", 8, 0.78)
BUSFLIP = word("шестьдесят", 9, 0.62) if not WH0 else [round(VO_AT + w[0], 3) for w in WH0 if PT[9][0] - VO_AT <= w[0] < PT[9][1] - VO_AT and w[2].lower().strip("«»").startswith("шестьдесят")][-1]
CAKE = word("восемь", 11, 0.72) - 0.45
HANDS = word("полюбили", 14, 0.2)
NEWS = P[15].s + 0.15
RULER = word("шесть", 17, 0.25)
DENY = P[17].e - 0.1
VOTE = word("шестьдесят", 19, 0.55)
VOID = word("запретил", 20, 0.35)
FINAL = P[21].s
DUR = round(P[21].e + 2.4, 2)

# chips under the number line: what got banned, in order (text, time)
BANS = [
    ("ЖЕСТ", P[6].s + 0.5),
    ("ВЕСЫ", TAPE),
    ("60 + 7", CALC),
    ("АВТОБУС №67", BUSFLIP),
    ("ГОД ДЕДУШКИ", CAKE),
    ("РОСТ 2,01 м", DENY),
]

# ---------------------------------------------------------------- shots
SHOTS = [
    ("class", 0.0),
    ("council", P[2].s - 0.1),
    ("stamp", P[4].s - 0.35),
    ("gesture", P[5].s - 0.1),
    ("poster", P[6].s - 0.1),
    ("scales", P[7].s - 0.1),
    ("calc", P[8].s - 0.1),
    ("bus", P[9].s - 0.1),
    ("cake", P[10].s - 0.1),
    ("grumpy", P[12].s - 0.1),
    ("board", P[13].s - 0.1),
    ("news", P[15].s - 0.1),
    ("border", P[16].s - 0.1),
    ("ruler", P[17].s - 0.1),
    ("vote", P[18].s - 0.1),
    ("void", P[20].s - 0.1),
    ("finale", P[21].s - 0.2),
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
# phrases that read better together on one caption plate (0, 1 and 21 are big stickers)
GROUPS = [[0], [1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], [12], [13, 14], [15], [16], [17], [18], [19], [20], [21]]

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


def buzzer(dur=0.6, f=110):
    tt = tt_(dur)
    s = np.sign(np.sin(2 * np.pi * f * tt)) * 0.3 + np.sin(2 * np.pi * f * 2 * tt) * 0.2
    return filt(s, "lowpass", 1800) * np.clip(tt / 0.01, 0, 1) * np.clip((dur - tt) / 0.08, 0, 1)


def whistle(dur=0.7):
    tt = tt_(dur)
    f = 2900 + 120 * np.sin(2 * np.pi * 38 * tt)  # the pea rattles
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * 0.5 + filt(white(len(tt)), "bandpass", [2400, 3600]) * 0.25
    return s * np.clip(tt / 0.03, 0, 1) * np.clip((dur - tt) / 0.08, 0, 1)


def slap(dur=0.25):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [700, 5000]) * np.exp(-tt * 30)
    return s + thump(160, 90, dur, decay=25, click=0.6) * 0.5


def tape(dur=0.7):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [1500, 7000]) * (0.6 + 0.4 * np.sin(2 * np.pi * 45 * tt) ** 2)
    return s * np.clip(tt / 0.02, 0, 1) * np.clip((dur - tt) / 0.06, 0, 1) * 0.6


def flip(n=4):
    s = np.zeros(int(0.5 * SR))
    for i in range(n):
        c = click(0.02, 1800 + i * 200)
        n0 = int(i * 0.06 * SR)
        s[n0 : n0 + len(c)] += c
    return s


def trombone():
    # «wah-wah-wah-waaah», sad and soft
    s = np.zeros(int(2.4 * SR))
    notes = [(311.1, 0.38), (293.7, 0.38), (277.2, 0.38), (261.6, 1.1)]
    t0 = 0.0
    for f, d in notes:
        tt = tt_(d)
        vib = 1 + 0.012 * np.sin(2 * np.pi * 5.5 * tt) * (tt > 0.3)
        ph = 2 * np.pi * np.cumsum(f * vib) / SR
        n = (np.sin(ph) * 0.5 + np.sin(2 * ph) * 0.25 + np.sin(3 * ph) * 0.12) * np.clip(tt / 0.05, 0, 1) * np.clip((d - tt) / 0.08, 0, 1)
        n0 = int(t0 * SR)
        s[n0 : n0 + len(n)] += filt(n, "lowpass", 2200)[: len(s) - n0]
        t0 += d
    return s


def chime():
    s = np.zeros(int(1.4 * SR))
    for k, f in enumerate([784.0, 1046.5, 1318.5]):
        n = ting(f, 1.0) * 0.45
        n0 = int(k * 0.09 * SR)
        s[n0 : n0 + len(n)] += n[: len(s) - n0]
    return s


def ticks(n=8, dt=0.07):
    s = np.zeros(int((n * dt + 0.2) * SR))
    for i in range(n):
        c = click(0.015, 2400)
        n0 = int(i * dt * SR)
        s[n0 : n0 + len(c)] += c * (0.5 + 0.5 * i / n)
    return s


def rev_whoosh(dur=0.9):
    return whoosh(dur, 300, 7000, 0.85)


def pop_chord():
    s = np.zeros(int(1.2 * SR))
    for k, f in enumerate([392.0, 493.9, 587.3, 784.0]):
        n = ting(f, 1.0) * 0.4
        n0 = int(k * 0.03 * SR)
        s[n0 : n0 + len(n)] += n[: len(s) - n0]
    p = thump(150, 70, 0.3, decay=14, click=0.6)
    s[: len(p)] += p
    return s


STAMP_S = sfx("bear/stamp")
CHEER = sfx("bear/cheer")
CROWD = sfx("bear/crowd")
CITY = sfx("earth/city")
BUS = sfx("earth/bus")
SCHOOL = sfx("lastman/crowd")

S = dict(SHOTS)
END = {n: (SHOTS[i + 1][1] if i + 1 < len(SHOTS) else DUR) for i, (n, _) in enumerate(SHOTS)}

# the class shouting at the start
place(CROWD, 0.0, 0.22, length=S["council"], fade_out=0.4)
mix.add(pop_chord(), O + P[0].s, 0.3)

# council: the stamp, 67 cracks out of the line
place(CROWD, S["council"], 0.05, length=S["gesture"] - S["council"], fade_in=0.3, fade_out=0.3)
place(STAMP_S, STAMP - 0.05, 0.7, length=1.0)
mix.add(thump(60, 32, 0.8, decay=6, click=0.4), O + STAMP, 0.4)
mix.add(ticks(5, 0.05), O + STAMP + 0.25, 0.25)

# the gesture banned: whistle, poster, tape
mix.add(whistle(0.8), O + WHISTLE, 0.22)
mix.add(slap(), O + POSTER, 0.5)
place(CITY, S["scales"], 0.08, length=END["scales"] - S["scales"], fade_in=0.2, fade_out=0.3)
for k in range(4):
    mix.add(click(0.03, 900 + k * 120), O + S["scales"] + 0.35 + k * 0.38, 0.12, pan=0.2)
mix.add(tape(0.7), O + TAPE - 0.35, 0.45)

# calculator: key taps then the error
for k in range(5):  # the same press times as PRESSES in src/six7/scenes2.tsx
    mix.add(click(0.02, 2600), O + CALC - 1.25 + k * 0.27, 0.3)
mix.add(buzzer(0.5, 140), O + CALC, 0.3)

# bus
place(CITY, S["bus"], 0.1, length=END["bus"] - S["bus"], fade_in=0.2, fade_out=0.3)
place(BUS, S["bus"], 0.25, length=END["bus"] - S["bus"], fade_in=0.2, fade_out=0.5)
mix.add(flip(5), O + BUSFLIP, 0.4)

# cake: the 66 cheer, the jump to 68, the trombone
mix.add(chime(), O + S["cake"] + 0.6, 0.12)
mix.add(pop_chord(), O + CAKE, 0.25)
mix.add(trombone(), O + P[12].s - 0.05, 0.16)

# the board: chalk, hands up
for k in range(10):
    mix.add(click(0.04, 1200 + (k % 3) * 300) * 0.6, O + S["board"] + 0.3 + k * 0.22, 0.14)
mix.add(whoosh(0.6, 400, 5000, 0.4), O + HANDS - 0.1, 0.3)

# news
mix.add(chime(), O + NEWS, 0.3)

# the border
mix.add(ding(1318.5, 1.2), O + RULER, 0.22)
place(STAMP_S, DENY - 0.05, 0.6, length=1.0)
mix.add(buzzer(0.6), O + DENY + 0.1, 0.25)

# vote: ticking counter, the hit on 67
mix.add(ticks(12, 0.06), O + VOTE - 0.75, 0.3)
mix.add(thump(55, 30, 1.0, decay=4, click=0.5), O + VOTE, 0.5)
mix.add(ting(1975.5, 1.2), O + VOTE + 0.02, 0.12)

# void: reverse whoosh, the 67 pops back
mix.add(rev_whoosh(0.9), O + VOID - 0.8, 0.4)
mix.add(pop_chord(), O + VOID + 0.4, 0.4)

# finale: the class goes wild
place(CHEER, FINAL - 0.05, 0.4, length=DUR - FINAL + 0.2, fade_out=1.0)
place(CROWD, FINAL, 0.2, length=DUR - FINAL, fade_out=1.0)

# ---------------------------------------------------------------- bed: a light bouncy pulse
t = mix.t - O
tension = np.interp(t, [0, S["council"], S["calc"], S["board"], S["vote"], S["void"], S["finale"], DUR], [0.6, 0.35, 0.5, 0.6, 0.75, 0.4, 0.8, 0.0])
base = drone([73.4, 110.0, 146.8], DUR + 1)[: mix.n]
rate = np.interp(t, [0, S["calc"], S["vote"], S["finale"], DUR], [2.4, 2.8, 3.2, 3.6, 3.6])
pulse = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(rate) / SR) ** 8
bed = filt(base * pulse, "lowpass", 700) * tension
duck = np.ones(mix.n)
if HAVE_VO:
    duck -= 0.4 * mix.env(O + VO_AT, O + VO_END, 0.3, 0.6)
duck = np.clip(duck, 0.35, 1)
mix.l += bed * duck * 0.3
mix.r += bed * duck * 0.3

final = mix.write("six-seven")

cues = {
    "duration": DUR,
    "draft": not HAVE_VO,
    "shots": [[n, round(s, 3)] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "phrases": [[round(a, 3), round(b, 3)] for a, b in PT],
    "bans": BANS,
    "stamp": STAMP,
    "whistle": WHISTLE,
    "poster": POSTER,
    "tape": TAPE,
    "calc": CALC,
    "busflip": BUSFLIP,
    "cake": CAKE,
    "hands": HANDS,
    "news": NEWS,
    "ruler": RULER,
    "deny": DENY,
    "vote": VOTE,
    "void": VOID,
    "final": FINAL,
}
(ROOT / "src/six7").mkdir(exist_ok=True)
(ROOT / "src/six7/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame, {'with voice' if HAVE_VO else 'DRAFT without voice'}) and src/six7/cues.json")
