"""Soundtrack and timing cues for «Мать Габена села на диету» (Russian TikTok meme, soft toy 3D, sequel to gaben/nolan).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant», text /mnt/project-files/voice/diet/diet-vo-text.txt
(Cyrillic vowels + combining U+0301 stress marks). Expected file: audio/voice/diet-vo.mp3,
word times audio/voice/diet-words.json (audio/transcribe_diet.py).

Every shot and event hangs on a caption phrase (P[k].s / P[k].e). Without the take (draft) phrase times are estimates
and the take is left out of the mix. Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30).

Sync map (story time of the on-screen event <-> sound):
  KICK        the pink slipper shoves the donut box away        <-> cardboard scrape + thud
  PLATE       the salad plate lands                             <-> ceramic clink
  MOON_GO     the Moon leaves her orbit                         <-> deep whoosh
  TIDE        the sea drains off the beach                      <-> sucking water rush
  RUN         slippers run on the Earth                         <-> fast slipper steps, rising
  RINGS       Saturn's rings fly to her waist                   <-> whoosh + ring clang (RINGS[1])
  DONE        servers finish: screens turn green                <-> fans spin down + ding
  BAR_k       the HL3 bar jumps                                 <-> soft tick
  GONE        the black hole lifts out of the galaxy            <-> reverse whoosh
  SUCK        robe sucks in on the scale                        <-> "fwip" + scale beep
  SLIPS       the slippers pop off                              <-> two plops
  DOOR        the fridge opens at 3 am                          <-> door seal + hum louder
  BITE        the donut is gone                                 <-> crunch
  RW_*        rewind shots                                      <-> tape rewind squeal
  DELAY       HL3 bar crashes, «ПЕРЕНЕСЁН»                       <-> error buzz + braam
  KICK2/PLATE2 the loop ending                                  <-> same as KICK/PLATE
"""

import json
import sys

import numpy as np

from slime_lib import ROOT, SR, Mix, click, drone, filt, load, thump, ting, tt_, white

OFF = 1 / 30
VO_AT = 0.15
VO_PATH = ROOT / "audio/voice/diet-vo.mp3"
WORDS_PATH = ROOT / "audio/voice/diet-words.json"

PHRASES = [
    ("Мать Габена села на диету.", 2.0),  # 0
    ("Продержится неделю — выйдет Half-Life 3.", 2.6),  # 1
    ("День первый.", 0.9),  # 2
    ("Без сладкого.", 0.9),  # 3
    ("Луна улетела от неё — приливов больше нет.", 2.8),  # 4
    ("День второй.", 0.9),  # 5
    ("Беговая дорожка.", 1.1),  # 6
    ("Земля закрутилась быстрее — сутки теперь три часа.", 3.2),  # 7
    ("День третий.", 0.9),  # 8
    ("Хула-хуп.", 0.8),  # 9
    ("Сатурн наконец вернул ей кольца.", 2.2),  # 10
    ("День четвёртый.", 1.0),  # 11
    ("Компьютеры Valve, которые годами считали её вес, освободились.", 3.6),  # 12
    ("Half-Life 3 готов на девяносто процентов.", 2.6),  # 13
    ("День пятый.", 0.9),  # 14
    ("Из центра галактики пропала чёрная дыра.", 2.6),  # 15
    ("Это был её пончик.", 1.3),  # 16
    ("День шестой.", 0.9),  # 17
    ("Контрольное взвешивание: втянула живот, сняла тапки — девяносто девять процентов.", 5.0),  # 18
    ("День седьмой.", 1.0),  # 19
    ("Три часа ночи.", 1.0),  # 20
    ("Холодильник.", 0.9),  # 21
    ("Один пончик.", 1.0),  # 22
    ("Луна вернулась.", 1.0),  # 23
    ("Кольца — тоже.", 0.9),  # 24
    ("Сутки — снова двадцать четыре часа.", 2.0),  # 25
    ("А Half-Life 3… снова перенесли.", 2.4),  # 26
    ("В понедельник она опять сядет на диету.", 2.4),  # 27
]
GAP = 0.3
LONG_GAP = {1: 0.2, 4: 0.15, 7: 0.15, 10: 0.15, 13: 0.15, 16: 0.15, 18: 0.2, 20: 0.2, 21: 0.6, 22: 0.5, 25: 0.2, 26: 0.4}

HAVE_VO = VO_PATH.exists() and WORDS_PATH.exists() and "--draft" not in sys.argv

# measured phrase windows in take time (from whisper, once the take exists)
MEASURED: list[tuple[float, float]] = [
    (0.0, 1.7), (2.1, 4.7), (5.26, 6.0), (6.44, 7.2), (7.62, 10.48), (11.2, 11.72), (12.26, 13.2), (13.6, 16.96), (17.5, 18.28), (18.68, 19.16),
    (19.64, 21.74), (22.4, 23.22), (23.52, 27.24), (27.6, 30.26), (30.9, 31.66), (31.98, 34.3), (34.72, 36.2), (36.88, 37.62), (37.9, 43.18), (43.7, 44.34),
    (44.76, 45.62), (45.96, 46.58), (47.2, 48.06), (48.82, 49.66), (50.0, 50.76), (51.34, 53.68), (53.9, 56.66), (56.94, 59.4),
]  # take 3y386LnNcSTgIj9HHBZY (flow L7onKeArOraa4NTH0J63, 873 credits), 65.7 s raw, atempo 1.1 -> 59.7 s

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
        if a - VO_AT - 0.05 <= w[0] < b - VO_AT and w[2].lower().strip(" ,.—-«»:…").startswith(prefix):
            return VO_AT + w[0]
    return a + (b - a) * frac


# ---------------------------------------------------------------- shots
BEACH = word_at(4, "прилив", 0.62) - 0.3
CITY = word_at(7, "сутки", 0.62) - 0.3
SHOTS = [
    ("hook", 0.0),
    ("moon", P[2].s - 0.1),
    ("beach", BEACH),
    ("run", P[5].s - 0.1),
    ("city", CITY),
    ("saturn", P[8].s - 0.1),
    ("servers", P[11].s - 0.1),
    ("galaxy", P[14].s - 0.1),
    ("weigh", P[17].s - 0.1),
    ("fridge", P[19].s - 0.1),
    ("rwMoon", P[23].s - 0.15),
    ("rwSaturn", P[24].s - 0.1),
    ("rwBeach", P[25].s - 0.1),
    ("rwServers", P[26].s - 0.1),
    ("monday", word_at(27, "она", 0.4) - 0.1),
]

KICK = word_at(0, "диет", 0.8) + 0.05
PLATE = P[1].s + 0.35
MOON_GO = (P[4].s + 0.05, BEACH - 0.05)
TIDE = (BEACH + 0.15, P[5].s - 0.2)
RUN = (P[5].s, CITY)
RINGS = (word_at(10, "верн", 0.5) - 0.1, P[10].e + 0.25)
DONE = word_at(12, "освобод", 0.85) + 0.1
GONE = word_at(15, "пропал", 0.55)
REVEAL = P[16].s + 0.1
SUCK = word_at(18, "втянул", 0.3) + 0.1
SLIPS = word_at(18, "сняла", 0.55) + 0.1
DOOR = word_at(22, "один", 0.2) - 0.1
BITE = P[22].e + 0.3
DELAY = word_at(26, "перенес", 0.8) + 0.1
KICK2 = word_at(27, "сядет", 0.7)
PLATE2 = P[27].e + 0.15
# HL3 bar: [time, value]
BAR = [
    [0.0, 0.0],
    [P[4].s + 0.6, 0.12],
    [CITY + 0.5, 0.30],
    [RINGS[1], 0.55],
    [P[13].s + 0.5, 0.90],
    [REVEAL + 0.2, 0.97],
    [word_at(18, "девяност", 0.75) + 0.1, 0.99],
    [DELAY, 0.0],
]
DUR = round(PLATE2 + 1.0, 2)

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
GROUPS = [[0], [1], [2, 3], [4], [5, 6], [7], [8, 9], [10], [11], [12], [13], [14], [15], [16], [17], [18], [19, 20], [21], [22], [23, 24], [25], [26], [27]]

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


def rewind(dur=0.9):
    tt = tt_(dur)
    f = 900 + 2600 * (tt / dur) ** 0.6
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25 + filt(white(len(tt)), "bandpass", [2000, 7000]) * 0.15
    return s * np.clip(tt / 0.05, 0, 1) * np.clip((dur - tt) / 0.1, 0, 1)


def fwip(dur=0.35, up=False):
    tt = tt_(dur)
    f = (300 + 1800 * tt / dur) if up else (2100 - 1800 * tt / dur)
    s = filt(white(len(tt)), "bandpass", [400, 4000]) * 0.5 + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    return s * np.sin(np.pi * tt / dur)


def clinkplate():
    a = ting(2900, 0.5) * 0.5
    b = ting(4100, 0.5) * 0.3
    return a + b


def scrape(dur=0.5):
    tt = tt_(dur)
    s = filt(brown_(len(tt)), "bandpass", [150, 1200])
    return s * np.sin(np.pi * tt / dur) * 0.8


def brown_(n):
    w = white(n)
    b = np.cumsum(w)
    b -= np.convolve(b, np.ones(400) / 400, mode="same")
    return b / (np.abs(b).max() + 1e-9)


def beep(f=1800, dur=0.12):
    tt = tt_(dur)
    return np.sin(2 * np.pi * f * tt) * 0.4 * np.clip((dur - tt) / 0.02, 0, 1)


SLIPPERS = sfx("murino/slippers")
SEASIDE = sfx("grow/seaside")
TSUNAMI = sfx("gta/tsunami")
SPLAT = sfx("grow/splat")
PLOP = sfx("bear/plop")
MOONS = sfx("gta/moon")
WIND = sfx("gta/wind")
SERVERS = sfx("gta/servers")
CITYS = sfx("earth/city")
CHEW = sfx("bear/chew")
CRINKLE = sfx("bear/crinkle")
DOOR_OPEN = sfx("murino/door_open")
HUM = sfx("scp/hum")
IMPACT = sfx("gta/impact")
RUNSTEPS = sfx("murino/run_up")

S = dict(SHOTS)
END = {n: (SHOTS[i + 1][1] if i + 1 < len(SHOTS) else DUR) for i, (n, _) in enumerate(SHOTS)}

# hook: a kitchen; kick the donuts away, the salad lands
mix.add(scrape(0.45), O + KICK - 0.05, 0.4, pan=0.3)
place(CRINKLE, KICK, 0.25, length=0.6, fade_out=0.2)
mix.add(thump(80, 50, 0.4, decay=8, click=0.2), O + KICK + 0.35, 0.25, pan=0.5)
mix.add(clinkplate(), O + PLATE, 0.35)

# day 1: space, the Moon leaves; the beach drains
place(MOONS, S["moon"], 0.22, length=END["moon"] - S["moon"] + 0.3, fade_in=0.3, fade_out=0.4)
mix.add(whoosh(MOON_GO[1] - MOON_GO[0] + 0.4, 80, 1500), O + MOON_GO[0], 0.45)
place(SEASIDE, S["beach"], 0.3, length=END["beach"] - S["beach"], fade_in=0.1, fade_out=0.4)
place(TSUNAMI, TIDE[0], 0.25, length=TIDE[1] - TIDE[0] + 0.3, fade_in=0.2, fade_out=0.6)

# day 2: running on the Earth, faster and faster; the city's sun spins
n = int((RUN[1] - RUN[0]) / 0.22)
tt = 0.0
k = 0
while RUN[0] + tt < RUN[1]:
    mix.add(thump(90, 60, 0.18, decay=14, click=0.35), O + RUN[0] + tt, 0.2, pan=0.25 if k % 2 else -0.25)
    tt += max(0.11, 0.3 - 0.04 * k)
    k += 1
place(WIND, S["run"], 0.15, length=END["run"] - S["run"], fade_in=0.3, fade_out=0.3)
place(CITYS, S["city"], 0.25, length=END["city"] - S["city"], fade_in=0.1, fade_out=0.3)
for j in range(int((END["city"] - S["city"]) / 0.5)):
    mix.add(whoosh(0.45, 600, 5000), O + S["city"] + 0.1 + j * 0.5, 0.18, pan=0.6 * np.sin(j * 1.7))

# day 3: Saturn's rings fly over and become a hula hoop
mix.add(whoosh(RINGS[1] - RINGS[0] + 0.3, 200, 4000), O + RINGS[0], 0.45)
mix.add(ting(880, 1.4) * 0.6 + ting(1320, 1.4) * 0.3, O + RINGS[1], 0.3)
for j in range(6):
    mix.add(fwip(0.3), O + RINGS[1] + 0.35 + j * 0.42, 0.12, pan=0.5 * (1 if j % 2 else -1))

# day 4: servers hum, then spin down at DONE
place(SERVERS, S["servers"], 0.35, length=DONE - S["servers"] + 0.4, fade_in=0.2, fade_out=0.6)
mix.add(ding(1567.98, 1.2), O + DONE + 0.1, 0.25)

# day 5: the black hole lifts away and turns out to be a donut
place(WIND, S["galaxy"], 0.12, length=END["galaxy"] - S["galaxy"], fade_in=0.3, fade_out=0.3)
mix.add(whoosh(1.0, 100, 3000, rev=True), O + GONE - 0.6, 0.4)
mix.add(ding(1046.5, 1.0), O + REVEAL + 0.2, 0.2)

# day 6: the weigh-in: suck in, slippers off, beep beep
mix.add(fwip(0.4, up=True), O + SUCK, 0.4)
mix.add(beep(1900), O + SUCK + 0.35, 0.2)
place(PLOP, SLIPS, 0.35, length=0.6)
place(PLOP, SLIPS + 0.18, 0.3, length=0.6, pan=0.3)
mix.add(beep(1900), O + SLIPS + 0.45, 0.2)
mix.add(beep(2400, 0.25), O + BAR[6][0], 0.25)

# day 7: night kitchen, the fridge hum, the door, the crunch
place(HUM, S["fridge"], 0.25, length=END["fridge"] - S["fridge"], fade_in=0.3, fade_out=0.2)
place(DOOR_OPEN, DOOR, 0.4, length=1.2, fade_out=0.3)
place(CHEW, BITE, 0.6, length=0.9, fade_out=0.3)

# rewind: a tape squeal on every rewind cut
for name in ("rwMoon", "rwSaturn", "rwBeach", "rwServers"):
    mix.add(rewind(0.8), O + S[name], 0.3)
mix.add(whoosh(0.8, 80, 1500, rev=True), O + S["rwMoon"] + 0.1, 0.3)
place(TSUNAMI, S["rwBeach"] + 0.1, 0.35, length=END["rwBeach"] - S["rwBeach"], fade_out=0.3)
place(SERVERS, S["rwServers"], 0.3, length=END["rwServers"] - S["rwServers"], fade_in=0.2, fade_out=0.3)
mix.add(buzz(110, 0.8), O + DELAY, 0.3)
mix.add(braam(32.7, 2.4), O + DELAY, 0.25)

# loop ending: same kick and plate
mix.add(scrape(0.45), O + KICK2 - 0.05, 0.4, pan=0.3)
place(CRINKLE, KICK2, 0.25, length=0.6, fade_out=0.2)
mix.add(clinkplate(), O + PLATE2, 0.35)

# HL3 bar ticks
for at, val in BAR[1:-1]:
    mix.add(ding(2093.0, 0.5), O + at, 0.1)

# ---------------------------------------------------------------- bed: a light bouncy pulse; silent at 3 am
t = mix.t - O
tension = np.interp(t, [0, S["moon"], S["servers"], S["weigh"], S["fridge"], S["fridge"] + 0.5, S["rwMoon"], DELAY, DELAY + 0.3, S["monday"], DUR], [0.4, 0.45, 0.6, 0.8, 0.8, 0.0, 0.0, 0.9, 0.0, 0.4, 0.3])
base = drone([49.0, 73.4, 98.0], DUR + 1)[: mix.n]
rate = np.interp(t, [0, S["weigh"], S["fridge"], S["rwMoon"], DUR], [2.0, 2.6, 2.6, 4.0, 2.0])
pulse = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(rate) / SR) ** 8
bed = filt(base * pulse, "lowpass", 700) * tension
duck = np.ones(mix.n)
if HAVE_VO:
    duck -= 0.4 * mix.env(O + VO_AT, O + VO_END, 0.3, 0.6)
duck = np.clip(duck, 0.35, 1)
mix.l += bed * duck * 0.32
mix.r += bed * duck * 0.32

final = mix.write("gaben-diet")

cues = {
    "duration": DUR,
    "draft": not HAVE_VO,
    "shots": [[n, round(s, 3)] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "phrases": [[round(a, 3), round(b, 3)] for a, b in PT],
    "dayAt": [P[k].s for k in (2, 5, 8, 11, 14, 17, 19)],
    "kick": KICK,
    "plate": PLATE,
    "moonGo": list(MOON_GO),
    "tide": list(TIDE),
    "run": list(RUN),
    "rings": list(RINGS),
    "done": DONE,
    "gone": GONE,
    "reveal": REVEAL,
    "suck": SUCK,
    "slips": SLIPS,
    "door": DOOR,
    "bite": BITE,
    "delay": DELAY,
    "kick2": KICK2,
    "plate2": PLATE2,
    "bar": BAR,
}
(ROOT / "src/diet").mkdir(exist_ok=True)
(ROOT / "src/diet/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame, {'with voice' if HAVE_VO else 'DRAFT without voice'}) and src/diet/cues.json")
