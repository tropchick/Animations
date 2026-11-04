"""Soundtrack and timing cues for the remake «Что если GTA 6 перенесут ещё на год?» (v4, a chain of causes).

The opening (billboard repaint + the fan's face, 0-5.6 s) and its two lines come from the first video's take
(audio/voice/gta-vo.mp3). Everything after is a new ONE-take voice (ElevenLabs Eleven v4, «VASKO - Deep, Warm
and Pleasant», flow 66nNylMXrJlbLMN2nwC7): audio/voice/gta2-vo.mp3, word times audio/voice/gta2-words.json.
Sound effects: ElevenLabs text-to-sound v2, one take each, audio/sfx/gta/*.mp3 (crowd, servers, dominoes are new).

Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30); the track gets 1/30 s in front.

Sync map (story time of the on-screen event <-> sound):
  REPAINT/PAINT  roller over 2026, paints 2027       <-> roller swishes
  JAW            the fan's jaw drops                 <-> low hit
  PRESS          thumb taps «Вернуть деньги»         <-> tap + ding
  SERVERS        racks turn red, then die            <-> servers.mp3 (starts 0.3 s before)
  PLUNGE         the chart falls through the floor   <-> braam + falling whoosh
  FACEPLANT      the trader hits the keyboard        <-> thump
  DOMINOES       each domino lands                   <-> thump per domino (+ clip at the first)
  POP            the AI bubble bursts                <-> pop + glass sparkle
  REPAINT2/PAINT2 2027 -> 2028                       <-> roller swishes
  USB / UPLOAD   stick goes in, upload bar, done     <-> click, rising tone, ding
  NET_DOWN       the hub server blows                <-> impact + blackout bangs
  DECLINED       card terminal error                 <-> error buzz
  DISC_IN/TV_ON/ERROR                                <-> click, CRT on, error chord
  TV_OFF         the screen dies at the very end    <-> CRT power-down
"""

import json

import numpy as np

from slime_lib import ROOT, SR, Mix, brown, click, drone, fade_edges, filt, load, thump, ting, tt_, white

OFF = 1 / 30

SHOTS = [
    ("bill", 0.0),
    ("fan", 3.2),
    ("refund", 5.6),
    ("servers", 9.0),
    ("chart", 11.1),
    ("domino", 13.85),
    ("bubble", 17.35),
    ("crisis", 20.3),
    ("studio", 22.85),
    ("repaint", 25.8),
    ("leak", 28.1),
    ("globe", 31.25),
    ("card", 37.25),
    ("shelf", 38.9),
    ("burn", 40.5),
    ("find", 43.6),
    ("setup", 47.8),
    ("screen", 49.8),
    ("turn", 52.9),
]
DUR = 55.6

REPAINT = (0.5, 1.6)
PAINT = (1.7, 2.8)
JAW = 3.9
PRESS = 6.45
SERVERS = 9.55  # LEDs flip to red
SERVERS_OFF = (10.1, 10.9)  # the racks die one after another
PLUNGE = 12.55
FACEPLANT = 13.25
DOMINO_TIP = 14.25
DOMINO_HITS = [14.85, 15.63, 16.53, 17.05]  # TTWO lands on SONY, SONY on MSFT, MSFT on NVDA, NVDA on the floor
POP = 17.75
STANDUP = [23.5, 23.8, 24.1, 24.4, 24.7, 25.0]
REPAINT2 = (26.0, 26.75)
PAINT2 = (26.85, 27.6)
USB = 28.45
UPLOAD = (28.75, 30.75)
ARCS = (31.45, 34.3)
NET_DOWN = 34.8
LIGHTS_OUT = (35.1, 36.9)
DECLINED = 38.15
DISC_FOUND = 46.9
DISC_IN = 48.6
TV_ON = 49.05
ERROR = 50.0
TURN = 53.3
TV_OFF = 54.75

# ---------------------------------------------------------------- the voice
VO1 = load(ROOT / "audio/voice/gta-vo.mp3")
VO2 = load(ROOT / "audio/voice/gta2-vo.mp3")
WH1 = json.loads((ROOT / "audio/voice/gta-words.json").read_text())["vo"]
WH2 = json.loads((ROOT / "audio/voice/gta2-words.json").read_text())["vo"]
# whisper split «Take -Two» in two and put «Её» on the end of the pause before it
for k in range(len(WH2) - 1, 0, -1):
    if WH2[k][2].startswith("-"):
        WH2[k - 1] = [WH2[k - 1][0], WH2[k][1], WH2[k - 1][2] + WH2[k][2]]
        del WH2[k]
for w in WH2:
    if w[2] == "Её":
        w[0] = 27.17
# take, (start, end) in the take, where it goes on the timeline, the caption text
PIECES = [
    (1, 0.06, 2.78, 0.35, "Rockstar переносит GTA 6 на год."),
    (1, 3.35, 5.20, 3.45, "Человечество до неё не доживёт."),
    (2, 0.10, 3.26, 5.75, "Миллионы фанатов за ночь отменяют предзаказы."),
    (2, 3.76, 5.60, 9.15, "Серверы магазинов падают."),
    (2, 6.13, 8.65, 11.25, "Утром акции Take-Two обваливаются."),
    (2, 9.03, 12.29, 14.0, "За ними падают Sony, Microsoft и Nvidia."),
    (2, 12.70, 15.41, 17.5, "Лопается пузырь искусственного интеллекта."),
    (2, 15.82, 18.06, 20.45, "Начинается мировой кризис."),
    (2, 18.40, 21.09, 23.0, "Студия увольняет половину разработчиков."),
    (2, 21.46, 23.52, 25.95, "Релиз переносят ещё на год."),
    (2, 23.97, 26.84, 28.25, "Обиженный разработчик сливает игру в интернет."),
    (2, 27.17, 30.13, 31.4, "Её одновременно качает миллиард человек."),
    (2, 30.52, 33.06, 34.6, "Интернет ложится по всей планете."),
    (2, 33.35, 37.20, 37.4, "Без интернета встают банки, магазины, поставки еды."),
    (2, 37.54, 39.48, 41.5, "Цивилизация рушится."),
    (2, 41.25, 46.01, 44.6, "Через 10 лет последний выживший находит диск GTA 6."),
    (2, 46.61, 49.02, 50.2, "Но ей нужен интернет."),
]
GROUPS = [[k] for k in range(len(PIECES))]

mix = Mix(DUR + OFF + 0.6)
O = OFF
voice = np.zeros(mix.n)
words = []  # [start, end, token, piece]
for k, (take, a, b, at, text) in enumerate(PIECES):
    vo, wh = (VO1, WH1) if take == 1 else (VO2, WH2)
    seg = fade_edges(vo[int((a - 0.04) * SR): int((b + 0.12) * SR)], 10)
    i = int((O + at - 0.04) * SR)
    voice[i: i + len(seg)] += seg[: mix.n - i]
    toks = text.split(" ")
    ws = [w for w in wh if a - 0.1 <= w[0] < b - 0.25]
    starts = [max(at, at + w[0] - a) for w in ws]
    if len(starts) != len(toks):  # whisper split a token differently: spread them over the phrase
        starts = [at + (b - a) * j / len(toks) for j in range(len(toks))]
    for j, tok in enumerate(toks):
        end = starts[j + 1] if j + 1 < len(toks) else at + (b - a)
        words.append([round(starts[j], 3), round(end, 3), tok, k])
mix.add(voice, 0, 1.0)

# ---------------------------------------------------------------- sound effects
SFX = {n: load(ROOT / f"audio/sfx/gta/{n}.mp3") for n in ("blackout", "impact", "wind", "crowd", "servers", "dominoes", "bombs")}


def place(name, at, gain, pan=0.0, fade_out=None, length=None, skip=0.0):
    x = SFX[name][int(skip * SR):]
    if length is not None:
        x = x[: int(length * SR)]
    if fade_out:
        n = int(fade_out * SR)
        x = x.copy()
        x[-n:] *= np.linspace(1, 0, n)
    mix.add(x, O + at, gain, pan)


def whoosh(dur=1.2):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [200, 6000])
    shape = np.exp(-((tt - dur * 0.45) / (dur * 0.22)) ** 2)
    return filt(s * shape, "lowpass", 4000)


def fall(dur=1.0, f0=1400, f1=200):
    """A falling slide whistle-ish tone (the chart)."""
    tt = tt_(dur)
    f = f0 * (f1 / f0) ** (tt / dur)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.clip(tt / 0.03, 0, 1) * np.exp(-tt * 1.2) * 0.4


def roller(dur=0.5):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [300, 2400]) * np.sin(np.pi * tt / dur) ** 2


def braam(f=41.2, dur=2.6):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for r, g in ((1, 1.0), (1.5, 0.5), (2, 0.6), (3, 0.3), (4, 0.18)):
        ph = 2 * np.pi * f * r * tt
        s += (2 * ((ph / (2 * np.pi)) % 1) - 1) * g
    s = np.tanh(filt(s, "lowpass", 900, 2) * 1.6)
    return s * np.clip(tt / 0.04, 0, 1) * np.exp(-tt * 1.1)


def crt(dur=0.7, on=False):
    tt = tt_(dur)
    f = 15700 * np.exp(-tt * 6) + 60
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15 + filt(white(len(tt)), "highpass", 2000) * np.exp(-tt * 18) * 0.5
    if on:
        s = s * 0.6 + np.sin(2 * np.pi * 15700 * tt) * 0.05 * np.clip(tt / 0.05, 0, 1)
    return s * np.exp(-tt * 3) + thump(90, 40, dur, decay=12, click=0.4) * 0.5


def ding(f=1318.5, dur=1.2):
    return ting(f, dur) * 0.6 + ting(f * 1.5, dur) * 0.4


def buzz(dur=0.45, f=110):
    tt = tt_(dur)
    sq = np.sign(np.sin(2 * np.pi * f * tt)) * 0.5 + np.sign(np.sin(2 * np.pi * f * 1.06 * tt)) * 0.5
    return filt(sq, "lowpass", 1800) * 0.35 * np.clip((dur - tt) / 0.05, 0, 1)


def pop(dur=0.5):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [600, 7000]) * np.exp(-tt * 30)
    return s + thump(160, 60, dur, decay=14, click=0.8) * 0.6


def error_chord(dur=1.2):
    return ting(311.1, dur) * 0.5 + ting(370.0, dur) * 0.4 + ting(233.1, dur) * 0.4


# opening: same as the first video
mix.add(roller(0.6), O + REPAINT[0], 0.18, pan=0.2)
mix.add(roller(0.6), O + REPAINT[0] + 0.55, 0.16, pan=0.25)
mix.add(roller(0.5), O + PAINT[0], 0.15, pan=0.2)
mix.add(roller(0.5), O + PAINT[0] + 0.5, 0.14, pan=0.25)
mix.add(braam(43.65), O + JAW, 0.55)
mix.add(thump(55, 30, 1.6, decay=2.2, click=0.3), O + JAW, 0.5)

# refunds: a tap and a ding, then a flurry of taps from the crowd of phones
mix.add(click(0.04, 2600), O + PRESS, 0.25)
mix.add(ding(1567.98, 0.9), O + PRESS + 0.08, 0.2)
for k in range(14):
    at = PRESS + 0.55 + k * 0.13 + 0.05 * np.sin(k * 3.1)
    mix.add(click(0.03, 2200 + 300 * (k % 4)), O + at, 0.08, pan=0.6 * np.sin(k * 1.7))
    if k % 3 == 0:
        mix.add(ding(1567.98 + 200 * (k % 2), 0.5), O + at + 0.05, 0.05, pan=0.6 * np.sin(k * 1.7))

# servers
place("servers", SERVERS - 0.3, 0.8, fade_out=0.3)
for k in range(5):
    mix.add(thump(80, 40, 0.5, decay=10, click=0.7), O + SERVERS_OFF[0] + k * 0.18, 0.18, pan=-0.5 + k * 0.25)

# the stock chart
mix.add(braam(38.9, 2.6), O + PLUNGE, 0.5)
mix.add(fall(1.1), O + PLUNGE - 0.15, 0.35)
mix.add(whoosh(1.0), O + PLUNGE - 0.2, 0.3)
mix.add(thump(70, 35, 0.8, decay=6, click=0.6), O + FACEPLANT, 0.45)
mix.add(click(0.06, 1800), O + FACEPLANT + 0.02, 0.2)

# dominoes
place("dominoes", DOMINO_HITS[0] - 0.05, 0.55, length=1.4, fade_out=0.4)
for k, at in enumerate(DOMINO_HITS):
    mix.add(thump(62 - k * 4, 30, 1.2, decay=3.2, click=0.7), O + at, 0.5 + 0.08 * k)
mix.add(braam(32.7, 2.6), O + DOMINO_HITS[-1], 0.35)

# the bubble
mix.add(pop(), O + POP, 0.7)
for k in range(10):
    mix.add(ting(2400 + 400 * (k % 5), 0.6), O + POP + 0.05 + k * 0.05, 0.05, pan=np.sin(k * 2.3) * 0.7)
mix.add(braam(30.9, 3.0), O + POP + 0.05, 0.4)
# boxes landing on the street
for k in range(9):
    mix.add(thump(110, 70, 0.3, decay=16, click=0.5), O + 20.6 + k * 0.23 + 0.06 * np.sin(k), 0.14, pan=np.sin(k * 1.9) * 0.6)

# the studio: chairs rolling back
for at in STANDUP:
    mix.add(filt(white(int(0.35 * SR)), "bandpass", [400, 1600]) * np.sin(np.pi * tt_(0.35) / 0.35) ** 2, O + at, 0.08)

# 2027 -> 2028
mix.add(roller(0.45), O + REPAINT2[0], 0.17, pan=0.2)
mix.add(roller(0.45), O + REPAINT2[0] + 0.35, 0.15, pan=0.25)
mix.add(roller(0.4), O + PAINT2[0], 0.15, pan=0.2)
mix.add(roller(0.4), O + PAINT2[0] + 0.35, 0.14, pan=0.25)
mix.add(thump(55, 32, 1.0, decay=4, click=0.2), O + PAINT2[1] + 0.1, 0.3)

# the leak
mix.add(click(0.05, 1500), O + USB, 0.3)
mix.add(ding(880, 0.5), O + USB + 0.15, 0.08)
tt = tt_(UPLOAD[1] - UPLOAD[0])
rise = np.sin(2 * np.pi * np.cumsum(300 + 500 * tt / tt[-1]) / SR) * 0.06 * np.clip(tt / 0.2, 0, 1)
mix.add(rise, O + UPLOAD[0], 1.0)
mix.add(ding(1318.5, 1.0), O + UPLOAD[1], 0.22)

# the planet: hum of the downloads, then the hub blows and the lights die
tt = tt_(ARCS[1] - ARCS[0] + 0.5)
hum = drone([110, 165, 220], len(tt) / SR) * np.clip(tt / 1.5, 0, 1)
mix.add(filt(hum, "lowpass", 1200), O + ARCS[0], 0.25)
place("impact", NET_DOWN - 0.02, 0.8, length=3.0, fade_out=1.0)
place("blackout", LIGHTS_OUT[0] - 0.1, 0.5, length=2.2, fade_out=0.5)

# collapse
mix.add(click(0.04, 2400), O + 37.55, 0.12)
mix.add(buzz(), O + DECLINED, 0.5)
mix.add(buzz(), O + DECLINED + 0.5, 0.4)
place("crowd", 38.85, 0.75, length=1.8, fade_out=0.3)
place("bombs", 40.55, 0.45, length=2.0, fade_out=0.6)
place("crowd", 40.6, 0.35, skip=2.0, length=1.6, fade_out=0.8)

# ten years later: wind
place("wind", 43.55, 0.6, fade_out=1.5)
place("wind", 47.6, 0.35, fade_out=1.5)
mix.add(filt(white(int(0.5 * SR)), "bandpass", [500, 3000]) * np.sin(np.pi * tt_(0.5) / 0.5) ** 2, O + DISC_FOUND - 0.3, 0.15)
mix.add(ting(1046.5, 1.5), O + DISC_FOUND, 0.08)
mix.add(click(0.06, 1200), O + DISC_IN, 0.3)
mix.add(click(0.04, 900), O + DISC_IN + 0.25, 0.2)
mix.add(crt(0.7, on=True), O + TV_ON, 0.45)
mix.add(error_chord(), O + ERROR, 0.35)
mix.add(crt(), O + TV_OFF, 0.5)

# ---------------------------------------------------------------- music: low pulse that tightens to the collapse, gone after it
t = mix.t - O
tension = np.interp(t, [0, 5.6, 17.3, 31.0, 37.2, 43.4, 43.6], [0.35, 0.55, 0.7, 0.85, 1.0, 1.0, 0.0])
base = drone([36.7, 55.0, 73.4], DUR + 1)[: mix.n]
pulse_rate = np.interp(t, [0, 17.0, 31.0, 43.5], [1.6, 2.0, 2.6, 3.2])
pulse = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(pulse_rate) / SR) ** 8
bed = filt(base * pulse, "lowpass", 700) * tension
duck = np.ones(mix.n)
for _, a, b, at, _ in PIECES:
    duck -= 0.45 * mix.env(O + at - 0.1, O + at + (b - a) + 0.15, 0.15, 0.3)
duck = np.clip(duck, 0.35, 1)
# a sad low pad for the last part
tail = drone([41.2, 61.7, 82.4], DUR + 1)[: mix.n] * np.interp(t, [43.6, 45.0, 52.0, 55.5], [0, 0.5, 0.6, 0.0])
mix.l += (bed * duck + filt(tail, "lowpass", 500) * duck) * 0.35
mix.r += (bed * duck + filt(tail, "lowpass", 500) * duck) * 0.35

# ---------------------------------------------------------------- write
final = mix.write("gta6-chain")

cues = {
    "duration": DUR,
    "shots": [[n, s] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "pieces": [[at, at + (b - a)] for _, a, b, at, _ in PIECES],
    "repaint": list(REPAINT),
    "paint": list(PAINT),
    "jaw": JAW,
    "press": PRESS,
    "servers": SERVERS,
    "serversOff": list(SERVERS_OFF),
    "plunge": PLUNGE,
    "faceplant": FACEPLANT,
    "dominoTip": DOMINO_TIP,
    "dominoHits": DOMINO_HITS,
    "pop": POP,
    "standup": STANDUP,
    "repaint2": list(REPAINT2),
    "paint2": list(PAINT2),
    "usb": USB,
    "upload": list(UPLOAD),
    "arcs": list(ARCS),
    "netDown": NET_DOWN,
    "lightsOut": list(LIGHTS_OUT),
    "declined": DECLINED,
    "discFound": DISC_FOUND,
    "discIn": DISC_IN,
    "tvOn": TV_ON,
    "error": ERROR,
    "turn": TURN,
    "tvOff": TV_OFF,
}
(ROOT / "src/gta2").mkdir(exist_ok=True)
(ROOT / "src/gta2/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame) and src/gta2/cues.json")
