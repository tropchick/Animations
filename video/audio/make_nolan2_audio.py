"""Soundtrack and timing cues for the NEW «Кто весит больше: мать Габена или мать Нолана?» (2026-11-11, soft toy 3D).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant», text /mnt/project-files/voice/nolan2/nolan2-vo-text.txt
(Cyrillic + combining U+0301 stress marks). Expected file: audio/voice/nolan2-vo.mp3 (tempo already applied),
word times audio/voice/nolan2-words.json (audio/transcribe_nolan2.py).

Every shot and event hangs on a caption phrase (P[k].s / P[k].e) or a word in it. Without the take (draft) phrase times
are estimates and the take is left out of the mix. Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30).

Sync map (story time of the on-screen event <-> sound):
  LAND        both slippers land on the asphalt, cracks              <-> two thumps + crack
  FOOT_G      the pink slipper leaves a 1 m pit in the sand          <-> soft thump + sand hiss
  STEP_N      the blue slipper steps on the beach                    <-> big thump
  BAIKAL      the slipper-shaped lake fills (seen from orbit)        <-> water rush
  SCORE_k     the score changes                                      <-> score ding
  TEAR        the trampoline under Nolan's mom tears                 <-> rip + boings
  DIVE        the trampoline under Gaben's mom stretches to the core <-> long creak + whoosh down
  POP         the pink slipper pops out of the Australian sand       <-> pop + sand
  TILT_G      the plane leans, the wing scrapes                      <-> metal scrape
  EARTH_TILT  the whole Earth tilts                                  <-> deep braam
  SUMMER      Moscow snow melts                                      <-> birds + chime
  MINUS       the clock hand jumps back a minute                     <-> tick-tock reversed click
  REWIND      the calendar flips back to 2004                        <-> tape rewind
  SIT         both sit on the seesaw                                 <-> creak
  LAUNCH      the pink side slams down, Nolan's mom flies off        <-> impact + whoosh
  STAR        the new star with a pompom lights up                   <-> twinkle
  WIN         «ПОБЕДИТЕЛЬ: МАТЬ ГАБЕНА»                              <-> cheer + braam
"""

import json
import sys
from pathlib import Path

import numpy as np

from slime_lib import ROOT, SR, Mix, click, drone, filt, load, thump, ting, tt_, white

OFF = 1 / 30
VO_AT = 0.2
VO_PATH = ROOT / "audio/voice/nolan2-vo.mp3"
WORDS_PATH = ROOT / "audio/voice/nolan2-words.json"

PHRASES = [
    ("Кто весит больше: мать Габена или мать Нолана?", 3.2),  # 0
    ("Проверим.", 0.9),  # 1
    ("Пляж.", 0.6),  # 2
    ("Мать Габена оставила след глубиной в метр.", 2.6),  # 3
    ("Мать Нолана оставила такой след, что в нём теперь Байкал.", 3.4),  # 4
    ("Батут.", 0.6),  # 5
    ("Мать Нолана порвала батут.", 1.7),  # 6
    ("Мать Габена пробила Землю насквозь и вышла в Австралии вверх ногами.", 4.2),  # 7
    ("Самолёт.", 0.7),  # 8
    ("Мать Габена села у окна — самолёт накренился.", 2.8),  # 9
    ("Мать Нолана села у окна — накренилась вся Земля, и в Москве наступило лето.", 4.6),  # 10
    ("Часы.", 0.6),  # 11
    ("Рядом с матерью Нолана время отстаёт на минуту.", 2.8),  # 12
    ("Рядом с матерью Габена до сих пор 2004 год.", 3.4),  # 13
    ("Поэтому Халф-Лайф три и не вышла.", 2.2),  # 14
    ("Счёт два-два.", 1.2),  # 15
    ("Финал: одни качели на двоих.", 2.0),  # 16
    ("Мать Нолана улетела в космос.", 1.9),  # 17
    ("На небе новая звезда — с помпоном.", 2.2),  # 18
    ("И это она ещё сидела.", 1.8),  # 19
]
GAP = 0.35
LONG_GAP = {1: 0.3, 4: 0.2, 7: 0.2, 10: 0.2, 14: 0.2, 16: 0.8, 17: 0.3, 18: 0.5}

HAVE_VO = VO_PATH.exists() and WORDS_PATH.exists() and "--draft" not in sys.argv

# measured phrase windows in take time (from whisper, once the take exists)
MEASURED: list[tuple[float, float]] = [
    (0.0, 3.38), (3.98, 4.5), (5.0, 5.46), (5.96, 8.52), (9.04, 13.0), (13.54, 13.92), (14.32, 16.24), (16.74, 21.18), (21.74, 22.18), (22.18, 25.88), (26.44, 31.62), (32.14, 32.6), (32.98, 35.96), (36.26, 39.86), (40.14, 42.32), (42.32, 43.76), (44.14, 46.3), (47.22, 49.38), (49.86, 52.52), (53.48, 54.94),
]  # take afHKUWCiyUXrs3l9yzcr (flow 2Zwuws0hWbySiESfVH55, 820 credits), 60.7 s raw, atempo 1.1 = 55.25 s

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


# ---------------------------------------------------------------- events
LAND = P[0].s + 0.45
FOOT_G = word_at(3, "остав", 0.3) + 0.15
STEP_N = word_at(4, "остав", 0.3) + 0.1
BAIKAL_AT = word_at(4, "такой", 0.55) - 0.15
BAIKAL = (BAIKAL_AT + 0.3, word_at(4, "байкал", 0.85) + 0.3)
TEAR = word_at(6, "порвал", 0.5) + 0.1
DIVE = word_at(7, "пробил", 0.3)
CORE_AT = word_at(7, "землю", 0.4) + 0.2
AUSSIE_AT = word_at(7, "вышла", 0.62) - 0.2
POP = word_at(7, "австрал", 0.75) + 0.05
TILT_G = word_at(9, "накрен", 0.75)
TILT_AT = word_at(10, "накрен", 0.45) - 0.3
EARTH_TILT = (TILT_AT + 0.25, TILT_AT + 1.4)
MOSCOW_AT = word_at(10, "москв", 0.8) - 0.35
SUMMER = word_at(10, "лето", 0.92) - 0.15
MINUS = word_at(12, "отста", 0.6) + 0.1
REWIND = (P[13].s + 0.35, word_at(13, "год", 0.95) + 0.15)
BOX = P[14].s + 0.2
SIT = word_at(16, "качел", 0.5)
LAUNCH = P[17].s + 0.1
STAR = word_at(18, "звезд", 0.55) + 0.05
SCORE = [P[1].e, P[4].e + 0.25, P[7].e + 0.25, P[10].e + 0.25, P[14].e + 0.25]
WIN = P[19].e + 0.25
DUR = round(WIN + 2.6, 2)

# ---------------------------------------------------------------- shots
SHOTS = [
    ("intro", 0.0),
    ("beachG", P[2].s - 0.1),
    ("beachN", P[4].s - 0.1),
    ("baikal", BAIKAL_AT),
    ("trampN", P[5].s - 0.1),
    ("trampG", P[7].s - 0.1),
    ("core", CORE_AT),
    ("aussie", AUSSIE_AT),
    ("planeG", P[8].s - 0.1),
    ("planeN", P[10].s - 0.1),
    ("tilt", TILT_AT),
    ("moscow", MOSCOW_AT),
    ("clockN", P[11].s - 0.1),
    ("clockG", P[13].s - 0.1),
    ("final", P[15].s - 0.1),
    ("star", P[18].s - 0.15),
    ("sit", P[19].s - 0.1),
]

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
        if HAVE_VO:
            print(f"  phrase {k}: whisper {len(ws)} words vs text {len(toks)}, spreading by length")
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
# short phrases share a caption with the next one
GROUPS = [[0], [1], [2, 3], [4], [5, 6], [7], [8, 9], [10], [11, 12], [13], [14], [15, 16], [17], [18], [19]]

mix = Mix(DUR + OFF + 0.6)
O = OFF
if HAVE_VO:
    mix.add(load(VO_PATH), O + VO_AT, 1.0)


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


def boing(f0=180, f1=520, dur=0.5):
    tt = tt_(dur)
    f = f0 + (f1 - f0) * (1 - np.exp(-tt * 9))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + 0.5 * np.sin(2 * np.pi * 28 * tt))
    return s * 0.4 * np.exp(-tt * 5)


def hiss(dur=0.8, lo=1500, hi=7000):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [lo, hi]) * np.exp(-tt * 4) * 0.5


def scrape(dur=1.0):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [1800, 5200]) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * tt))
    s += np.sin(2 * np.pi * (2400 + 300 * np.sin(2 * np.pi * 3 * tt)) * tt) * 0.15
    return s * np.clip(tt / 0.03, 0, 1) * np.clip((dur - tt) / 0.3, 0, 1) * 0.6


def rewind(dur=1.6):
    tt = tt_(dur)
    f = 600 + 2400 * (tt / dur) ** 0.7
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25 + filt(white(len(tt)), "bandpass", [2000, 6000]) * 0.15
    flutter = 0.6 + 0.4 * np.sin(2 * np.pi * 23 * tt)
    return s * flutter * np.clip(tt / 0.1, 0, 1) * np.clip((dur - tt) / 0.15, 0, 1)


def chirp(f=3200, dur=0.18):
    tt = tt_(dur)
    ff = f * (1 + 0.3 * np.sin(np.pi * tt / dur))
    return np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.sin(np.pi * tt / dur) * 0.3


def twinkle(n=6, f0=2093.0):
    out = np.zeros(int((0.12 * n + 1.2) * SR))
    for i in range(n):
        x = ting(f0 * (1.0, 1.25, 1.5, 2.0)[i % 4], 1.0) * 0.5
        j = int(i * 0.12 * SR)
        out[j : j + len(x)] += x[: len(out) - j]
    return out


SLIPPERS = sfx("murino/slippers")
CREAK = sfx("grow/creak")
SEASIDE = sfx("grow/seaside")
TSUNAMI = sfx("gta/tsunami")
SPLAT = sfx("grow/splat")
PLOP = sfx("bear/plop")
RIP = sfx("bear/rip")
RUMBLE = sfx("earth/rumble")
CORE = sfx("grow/core")
PLANE = sfx("grow/plane")
BOOM = sfx("earth/boom")
WIND = sfx("gta/wind")
CHEER = sfx("bear/cheer")
CROWD = sfx("bear/crowd")
IMPACT = sfx("gta/impact")
CITY = sfx("earth/city")
CHIME = sfx("scp/chime")
FOREST = sfx("bear/forest")

S = dict(SHOTS)
END = {n: (SHOTS[i + 1][1] if i + 1 < len(SHOTS) else DUR) for i, (n, _) in enumerate(SHOTS)}

# 1. intro: a yard, two heavy steps, the asphalt cracks
place(CITY, 0.0, 0.1, length=END["intro"], fade_in=0.2, fade_out=0.4)
mix.add(thump(58, 30, 1.0, decay=3.5, click=0.3), O + LAND, 0.5, pan=-0.3)
mix.add(thump(55, 28, 1.0, decay=3.5, click=0.3), O + LAND + 0.12, 0.5, pan=0.3)
place(CREAK, LAND + 0.1, 0.25, length=1.0, fade_out=0.4)

# 2. beach: a pit; the big footstep; Baikal fills from orbit
place(SEASIDE, S["beachG"], 0.3, length=S["baikal"] - S["beachG"], fade_in=0.3, fade_out=0.4)
mix.add(thump(80, 40, 0.5, decay=6, click=0.2), O + FOOT_G, 0.4)
mix.add(hiss(0.7, 800, 4000), O + FOOT_G + 0.05, 0.25)
mix.add(thump(48, 26, 1.4, decay=2.6, click=0.35), O + STEP_N, 0.55)
place(BOOM, STEP_N, 0.3, length=1.4, fade_out=0.5)
place(WIND, S["baikal"], 0.18, length=END["baikal"] - S["baikal"], fade_in=0.2, fade_out=0.3)
place(TSUNAMI, BAIKAL[0] - 0.2, 0.35, length=BAIKAL[1] - BAIKAL[0] + 0.8, fade_in=0.3, fade_out=0.6)

# 3. trampoline: a tear and flying springs; then the long stretch, the core, the pop in Australia
place(FOREST, S["trampN"], 0.12, length=S["core"] - S["trampN"], fade_in=0.2, fade_out=0.3)
mix.add(thump(70, 36, 0.6, decay=5, click=0.25), O + TEAR - 0.1, 0.4)
place(RIP, TEAR, 0.45, length=1.0, fade_out=0.3)
for i in range(5):
    mix.add(boing(160 + 40 * i, 480 + 60 * i, 0.45), O + TEAR + 0.1 + 0.08 * i, 0.2, pan=(i - 2) * 0.35)
place(CREAK, DIVE - 0.1, 0.35, length=CORE_AT - DIVE + 0.4, fade_out=0.3)
mix.add(whoosh(1.4, 80, 1500), O + CORE_AT - 0.5, 0.45)
place(CORE, CORE_AT, 0.4, length=AUSSIE_AT - CORE_AT + 0.2, fade_in=0.1, fade_out=0.3)
place(SEASIDE, AUSSIE_AT, 0.2, length=END["aussie"] - AUSSIE_AT, fade_in=0.2, fade_out=0.4)
mix.add(hiss(0.9, 600, 3500), O + POP - 0.1, 0.35)
place(PLOP, POP, 0.4, length=0.8)
mix.add(boing(240, 720, 0.5), O + POP + 0.05, 0.25)

# 4. plane: engines; the scrape; space and a braam for the tilt; Moscow melts, birds
place(PLANE, S["planeG"], 0.3, length=S["tilt"] - S["planeG"], fade_in=0.3, fade_out=0.4)
mix.add(scrape(1.2), O + TILT_G, 0.4, pan=-0.4)
mix.add(braam(32.7, 2.8), O + EARTH_TILT[0], 0.3)
place(RUMBLE, EARTH_TILT[0], 0.25, length=EARTH_TILT[1] - EARTH_TILT[0] + 0.8, fade_out=0.5)
place(WIND, S["moscow"], 0.15, length=SUMMER - S["moscow"] + 0.2, fade_in=0.2, fade_out=0.2)
place(CHIME, SUMMER, 0.25, length=1.5, fade_out=0.6)
place(FOREST, SUMMER, 0.25, length=END["moscow"] - SUMMER, fade_in=0.2, fade_out=0.3)
for i in range(5):
    mix.add(chirp(3000 + 400 * (i % 3)), O + SUMMER + 0.25 + 0.27 * i, 0.2, pan=(i % 2) * 0.6 - 0.3)

# 5. clocks: ticking; one tick back; the long rewind; the box
for k in range(int((S["clockG"] - S["clockN"]) / 0.5)):
    mix.add(click(0.012, 2600 if k % 2 else 2000), O + S["clockN"] + 0.2 + k * 0.5, 0.12)
mix.add(click(0.03, 1200), O + MINUS, 0.3)
mix.add(ding(784.0, 0.6), O + MINUS + 0.05, 0.1)
mix.add(rewind(REWIND[1] - REWIND[0]), O + REWIND[0], 0.4)
for k in range(10):
    mix.add(click(0.01, 3000), O + REWIND[0] + 0.1 + k * (REWIND[1] - REWIND[0] - 0.2) / 10, 0.1)
mix.add(thump(90, 50, 0.3, decay=9, click=0.2), O + BOX, 0.3)

# score changes
for at in SCORE[1:]:
    mix.add(ding(1760.0, 0.7), O + at, 0.14)

# 6. final: the yard again, both sit, a long creak; the slam and the launch; the star; the win
place(CITY, S["final"], 0.08, length=LAUNCH - S["final"], fade_in=0.3, fade_out=0.3)
mix.add(thump(60, 30, 0.8, decay=4, click=0.5), O + SIT, 0.35, pan=-0.3)
mix.add(thump(58, 30, 0.8, decay=4, click=0.5), O + SIT + 0.15, 0.35, pan=0.3)
place(CREAK, SIT + 0.3, 0.25, length=LAUNCH - SIT - 0.2, fade_out=0.3)
place(IMPACT, LAUNCH - 0.03, 0.5, length=1.4, fade_out=0.4)
place(BOOM, LAUNCH, 0.35, length=1.6, fade_out=0.5)
mix.add(whoosh(1.6, 300, 7000), O + LAUNCH + 0.05, 0.45)
mix.add(boing(120, 700, 0.8), O + LAUNCH + 0.05, 0.3)
place(WIND, S["star"] - 0.3, 0.12, length=END["star"] - S["star"] + 0.3, fade_in=0.3, fade_out=0.3)
mix.add(twinkle(), O + STAR, 0.25)
place(SLIPPERS, S["sit"] + 0.3, 0.25, length=0.8, fade_out=0.3)
place(CHEER, WIN - 0.1, 0.4, length=DUR - WIN + 0.1, fade_out=0.8)
mix.add(braam(32.7, 2.6), O + WIN, 0.25)
mix.add(ding(1318.5, 1.4), O + WIN, 0.2)

# ---------------------------------------------------------------- bed: a light bouncy pulse, rising for the final
t = mix.t - O
tension = np.interp(t, [0, S["trampN"], S["planeG"], S["clockN"], S["final"], LAUNCH, LAUNCH + 0.4, WIN, DUR], [0.4, 0.45, 0.55, 0.65, 0.9, 1.0, 0.4, 0.5, 0.0])
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

final = mix.write("nolan-mom-2")

cues = {
    "duration": DUR,
    "draft": not HAVE_VO,
    "shots": [[n, round(s, 3)] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "phrases": [[round(a, 3), round(b, 3)] for a, b in PT],
    "land": LAND,
    "footG": FOOT_G,
    "stepN": STEP_N,
    "baikal": list(BAIKAL),
    "tear": TEAR,
    "dive": DIVE,
    "pop": POP,
    "tiltG": TILT_G,
    "earthTilt": list(EARTH_TILT),
    "summer": SUMMER,
    "minus": MINUS,
    "rewind": list(REWIND),
    "box": BOX,
    "sit": SIT,
    "launch": LAUNCH,
    "star": STAR,
    "score": SCORE,
    "win": WIN,
}
(ROOT / "src/nolan2").mkdir(exist_ok=True)
(ROOT / "src/nolan2/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame, {'with voice' if HAVE_VO else 'DRAFT without voice'}) and src/nolan2/cues.json")
