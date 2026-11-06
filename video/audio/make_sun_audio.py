"""Soundtrack and timing cues for «Что если Солнце погаснет?» (low poly, Russian VO, popular science chain).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant» (flow M0lPmVpsP7xfXFTxYxJN):
audio/voice/sun-vo.mp3, word times audio/voice/sun-words.json (faster-whisper medium).
All other sounds are synthesized here.

Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30); the track gets 1/30 s in front.

Sync map (story time of the on-screen event <-> sound):
  BUY        the seller hands over the ice cream            <-> freezer lid clunk + coin
  DARK       the light ends on the beach                    <-> hard click, the beach sound cuts, sub drop
  LAMPS      beach lamps flicker on                         <-> electric tick + hum
  MOON_OFF   the Moon goes dark                             <-> low whoomp
  JUP_OFF    Jupiter fades in the eyepiece                  <-> soft descending tone
  HEAT       city windows turn orange (heaters on)          <-> clicks
  BLACKOUT   each city block goes dark                      <-> breaker clunk, the hum drops a step
  CRACK      the ice cracks before the camera dives         <-> ice crack
  KNOCK      the frozen ice cream knocks on the bed rail    <-> two wooden knocks
"""

import json

import numpy as np

from slime_lib import ROOT, SR, Mix, brown, clank, click, fade_edges, filt, load, step, thump, ting, tt_, white

OFF = 1 / 30

VO = load(ROOT / "audio/voice/sun-vo.mp3")
WH = json.loads((ROOT / "audio/voice/sun-words.json").read_text())["vo"]
NB = " "  # keeps two words in one caption token

# take (start, end) cut at real silences, extra pause added before it, caption text
PIECES_RAW = [
    (0.00, 2.24, 0.15, "Солнце только что погасло."),
    (2.74, 4.74, 0.0, "Но ты об этом ещё не знаешь."),
    (5.16, 9.16, 0.2, "Свет от Солнца летит до Земли 8 минут 20 секунд."),
    (9.44, 12.84, 0.1, "Так что ты ещё загораешь под Солнцем, которого уже нет."),
    (14.27, 16.27, 0.5, "И вот свет кончился."),
    (16.61, 19.46, 0.0, "Сразу на всей дневной стороне планеты."),
    (19.84, 22.09, 0.2, "На ночной стороне гаснет Луна."),
    (22.39, 26.10, 0.0, "Она никогда не светила сама, только отражала Солнце."),
    (26.45, 28.82, 0.2, "А звёзды горят как горели."),
    (29.21, 31.66, 0.0, "Это чужие солнца, им всё равно."),
    (32.15, 34.72, 0.2, "Через полтора часа исчезает Юпитер."),
    (34.95, 37.59, 0.0, "Его последний свет летел к нам дольше."),
    (37.99, 39.96, 0.3, "Земля никуда не улетит."),
    (40.21, 43.21, 0.0, "Солнце погасло, но его масса осталась."),
    (43.40, 46.36, 0.0, "Мы так и будем кружить вокруг тёмного шара."),
    (46.89, 49.23, 0.3, "Солнечные панели выдают ноль."),
    (49.41, 52.51, 0.0, "А вся планета разом включает обогреватели."),
    (52.79, 54.62, 0.1, "Сети не выдерживают."),
    (55.00, 59.10, 0.4, "Через неделю средняя температура на Земле минус 18."),
    (59.30, 61.36, 0.0, "Снег идёт даже в тропиках."),
    (61.73, 64.84, 0.3, "Фотосинтез остановился ещё в первую секунду."),
    (65.05, 68.19, 0.0, "Через пару недель почти все растения мертвы."),
    (68.53, 70.27, 0.3, "Люди бегут в Исландию."),
    (70.46, 73.81, 0.0, "Там тепло берут прямо из-под земли, от вулканов."),
    (74.08, 76.24, 0.2, "Картошку растят под лампами."),
    (76.56, 81.25, 0.0, "Исландия впервые в истории самое желанное место на планете."),
    (81.74, 84.83, 0.4, "Через год на Земле минус 73."),
    (85.09, 87.15, 0.0, "Океаны замерзают сверху."),
    (87.34, 91.03, 0.0, "Но лёд, как одеяло, держит воду под собой жидкой."),
    (91.30, 95.26, 0.3, "А на дне, у подводных вулканов, жизнь даже не заметила."),
    (95.50, 98.03, 0.0, "Ей Солнце никогда не было нужно."),
    (98.75, 103.21, 0.5, f"А{NB}мороженое, которое он купил в 12:03, так и не растаяло."),
]
# whisper tokens that are only a piece of a caption word («из» «-под», «12» «.03») or a dash
SKIP = lambda w: w.startswith("-") or w.startswith(".") or w in ("–", "—")

PIECES = []
shift = 0.0
for a, b, extra, text in PIECES_RAW:
    shift += extra
    PIECES.append((a, b, round(a + shift, 3), text))
GROUPS = [[k] for k in range(len(PIECES))]
P = lambda k: PIECES[k][2]  # timeline start of piece k
PE = lambda k: PIECES[k][2] + PIECES[k][1] - PIECES[k][0]  # timeline end

SHOTS = [
    ("beach", 0.0),
    ("gap", P(2) - 0.3),
    ("kiosk", P(3) - 0.25),
    ("dark", PE(3) + 0.15),
    ("moon", P(6) - 0.3),
    ("stars", P(8) - 0.25),
    ("jupiter", P(10) - 0.3),
    ("orbit", P(12) - 0.35),
    ("grid", P(15) - 0.3),
    ("snow", P(18) - 0.35),
    ("field", P(20) - 0.3),
    ("airport", P(22) - 0.3),
    ("greenhouse", P(24) - 0.3),
    ("ice", P(26) - 0.35),
    ("vent", P(29) - 0.3),
    ("icecream", P(31) - 0.45),
]
SHOTS = [(n, round(s, 3)) for n, s in SHOTS]
DUR = round(PE(31) + 1.4, 2)
S = dict(SHOTS)


def word_time(k, j):
    """Timeline start of whisper word j (index into the take) that sits in piece k."""
    a, b, at, _ = PIECES[k]
    return at + WH[j][0] - a


BUY = S["kiosk"] + 1.0
DARK = S["dark"] + 0.75
LAMPS = [DARK + 1.1, DARK + 1.35, DARK + 1.5]
MOON_OFF = S["moon"] + 1.6
JUP_OFF = (P(11) - 0.2, P(11) + 1.6)
HEAT = [P(16) + 1.3 + 0.12 * k for k in range(6)]
BLACKOUT = [P(17) + 0.25 + 0.38 * k for k in range(5)]
CRACK = S["ice"] + 2.6
KNOCK = [S["icecream"] + 3.5, S["icecream"] + 3.85]
# the countdown clock: story time -> seconds after the Sun went out
CLOCK = [[0.0, 0.0], [BUY, 180.0], [DARK, 500.0]]

# ---------------------------------------------------------------- the voice


def edge(t, d, x, thr=0.004, quiet=0.06):
    """From t, step in direction d (−1 back, +1 forward) until there is `quiet` seconds of silence; keep 30 ms of it."""
    w = int(0.01 * SR)
    k = 0
    run = 0
    while k < 60:
        c = t + d * k * 0.01
        seg = x[max(0, int(c * SR) - (w if d < 0 else 0)): max(0, int(c * SR) + (0 if d < 0 else w))]
        if len(seg) == 0:
            return max(0.0, c)
        run = run + 1 if np.sqrt((seg ** 2).mean()) < thr else 0
        if run * 0.01 >= quiet:
            return max(0.0, c - d * (quiet - 0.03))
        k += 1
    return max(0.0, t + d * 0.6)


mix = Mix(DUR + OFF + 0.6)
O = OFF
voice = np.zeros(mix.n)
words = []  # [start, end, token, piece]
for k, (a, b, at, text) in enumerate(PIECES):
    a0, b0 = edge(a + 0.02, -1, VO), edge(b - 0.02, 1, VO)
    seg = fade_edges(VO[int(a0 * SR): int(b0 * SR)], 10)
    i = int((O + at - (a - a0)) * SR)
    voice[i: i + len(seg)] += seg[: mix.n - i]
    toks = text.split(" ")
    ws = [w for w in WH if a - 0.12 <= (w[0] + w[1]) / 2 < b + 0.1 and not SKIP(w[2])]
    starts = [max(at, at + w[0] - a) for w in ws]
    if len(starts) != len(toks):
        print("token mismatch in piece", k, [w[2] for w in ws], toks)
        starts = [at + (b - a) * j / len(toks) for j in range(len(toks))]
    for j, tok in enumerate(toks):
        end = starts[j + 1] if j + 1 < len(toks) else at + (b - a)
        words.append([round(starts[j], 3), round(end, 3), tok.replace(NB, " "), k])
mix.add(voice, 0, 1.0)

rng_ = np.random.default_rng(11)


# ---------------------------------------------------------------- synthesized sounds
def waves(dur):
    tt = tt_(dur)
    s = filt(white(len(tt)), "lowpass", 900) * 0.6 + filt(white(len(tt)), "bandpass", [900, 4000]) * 0.25
    swell = 0.35 + 0.65 * np.clip(np.sin(2 * np.pi * tt / 5.5 + 1.0), 0, 1) ** 2
    return s * swell * np.clip(tt / 0.4, 0, 1) * np.clip((dur - tt) / 0.05, 0, 1)


def gull():
    tt = tt_(0.5)
    f = 1500 + 700 * np.sin(np.pi * tt / 0.5) - 500 * tt
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return filt(s, "bandpass", [900, 5000]) * np.sin(np.pi * tt / 0.5) ** 1.5 * (0.6 + 0.4 * np.sin(2 * np.pi * 18 * tt))


def wind(dur, lo=200, hi=1200):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [lo, hi])
    gust = 0.5 + 0.5 * np.sin(2 * np.pi * 0.23 * tt + 1) * np.sin(2 * np.pi * 0.11 * tt + 2)
    return s * (0.4 + 0.6 * gust) * np.clip(tt / 0.8, 0, 1) * np.clip((dur - tt) / 0.6, 0, 1)


def hum(dur, f=50, fade=0.3):
    tt = tt_(dur)
    s = np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * 2 * f * tt) + 0.25 * np.sin(2 * np.pi * 3 * f * tt)
    return s * np.clip(tt / fade, 0, 1) * np.clip((dur - tt) / 0.05, 0, 1)


def murmur(dur, base=160):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for k in range(6):
        fq = base + 40 * k
        env = np.clip(np.sin(2 * np.pi * (2.1 + 0.37 * k) * tt + k) + 0.2 * np.sin(2 * np.pi * 7.3 * tt + k), 0, 1)
        s += filt(white(len(tt)), "bandpass", [fq, fq * 4.5]) * env
    return s / 6 * np.clip(tt / 0.3, 0, 1) * np.clip((dur - tt) / 0.3, 0, 1)


def drone(dur, base=55.0):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for k, (m, g) in enumerate(((1, 1.0), (1.5, 0.5), (2, 0.4), (3, 0.15))):
        s += g * np.sin(2 * np.pi * base * m * tt + 0.3 * np.sin(2 * np.pi * (0.07 + 0.03 * k) * tt))
    return filt(s, "lowpass", 600) * np.clip(tt / 2.0, 0, 1) * np.clip((dur - tt) / 1.5, 0, 1)


def crack():
    s = np.zeros(int(1.4 * SR))
    for k in range(18):
        c = click(0.02, 900 + rng_.uniform(0, 3000)) * rng_.uniform(0.4, 1)
        i = int((k * 0.03 + rng_.uniform(0, 0.02)) * SR)
        s[i: i + len(c)] += c[: len(s) - i]
    boom = thump(70, 35, 1.2, decay=3.5, click=1.0)
    s[: len(boom)] += boom[: len(s)] * 0.8
    tt = tt_(1.4)
    sing = np.sin(2 * np.pi * np.cumsum(2400 * np.exp(-tt * 2.5) + 300) / SR) * np.exp(-tt * 3) * 0.25
    return s + sing


def bubbles(dur):
    s = np.zeros(int(dur * SR))
    t = 0.0
    while t < dur - 0.2:
        f0 = rng_.uniform(250, 700)
        tt = tt_(0.08)
        b = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 2.5 * tt / 0.08)) / SR) * np.exp(-tt * 40)
        i = int(t * SR)
        s[i: i + len(b)] += b[: len(s) - i] * rng_.uniform(0.3, 1)
        t += rng_.uniform(0.03, 0.18)
    return filt(s, "lowpass", 1800)


def knock():
    s = thump(240, 150, 0.25, decay=22, click=1.6)
    n = len(s)
    return s + filt(white(n), "bandpass", [600, 2600]) * np.exp(-np.arange(n) / SR * 40) * 0.5


def ding():
    s = np.zeros(int(1.6 * SR))
    for k, f in enumerate((784.0, 659.3)):
        t2 = ting(f, 1.2)
        i = int(k * 0.35 * SR)
        s[i: i + len(t2)] += t2[: len(s) - i]
    return s


def tick():
    return click(0.02, 3600) * 0.6


# beach until the dark: waves, gulls, light tick
mix.add(waves(S["gap"] + 0.3), O + 0.0, 0.22)
mix.add(waves(DARK - S["kiosk"] + 0.3), O + S["kiosk"] - 0.3, 0.22)
for k, at in enumerate((0.6, 2.3, 3.9)):
    mix.add(gull(), O + at, 0.07, pan=-0.4 + 0.4 * k)
mix.add(gull(), O + S["kiosk"] + 2.2, 0.06, pan=0.5)
mix.add(murmur(DARK - S["kiosk"], 220), O + S["kiosk"], 0.05)
# space: only a thin hum while the last light flies
mix.add(drone(S["kiosk"] - S["gap"] + 0.5, 82.4), O + S["gap"], 0.07)
# the kiosk: lid and coins
mix.add(clank(0.3, 500) * 0.6, O + BUY - 0.4, 0.25)
mix.add(ting(2637, 0.6), O + BUY, 0.1)
mix.add(ting(3136, 0.5), O + BUY + 0.07, 0.08)
# the clock speeds up: ticks get closer towards the dark
tk = 0.3
while tk < DARK - 0.05:
    mix.add(tick(), O + tk, 0.07 + 0.1 * tk / DARK)
    tk += 0.5 * (1 - 0.8 * tk / DARK)
# DARK: hard click, sub drop, then silence and a cold wind
mix.add(click(0.05, 1500) * 1.5, O + DARK, 0.6)
mix.add(thump(48, 22, 2.6, decay=1.6, click=0.6), O + DARK, 0.65)
for at in LAMPS:
    mix.add(click(0.03, 2600), O + at, 0.2)
mix.add(hum(S["moon"] - LAMPS[0], 100), O + LAMPS[0], 0.025)
mix.add(wind(S["jupiter"] - DARK, 150, 700), O + DARK + 0.5, 0.05)
# moon: a soft night city, whoomp when the Moon goes out
mix.add(murmur(S["stars"] - S["moon"], 140), O + S["moon"], 0.04)
mix.add(thump(60, 30, 1.6, decay=2.2, click=0.1), O + MOON_OFF, 0.35)
# stars: a few glassy twinkles
for k in range(6):
    mix.add(ting(2600 + 500 * (k % 3), 1.0), O + S["stars"] + 0.5 + 0.7 * k, 0.03, pan=-0.6 + 0.24 * k)
# jupiter: focus clicks, a falling tone as it fades
for k in range(3):
    mix.add(click(0.02, 1800), O + S["jupiter"] + 0.6 + 0.12 * k, 0.15)
tt = tt_(JUP_OFF[1] - JUP_OFF[0] + 0.6)
fall = np.sin(2 * np.pi * np.cumsum(660 * np.exp(-tt * 0.6)) / SR) * np.clip(tt / 0.2, 0, 1) * np.exp(-tt * 1.4)
mix.add(fall, O + JUP_OFF[0], 0.08)
# orbit: a deep drone
mix.add(drone(S["grid"] - S["orbit"] + 0.6, 41.2), O + S["orbit"], 0.2)
# grid: wind, the hum of the city, heaters click on, breakers
mix.add(wind(S["snow"] - S["grid"], 200, 900), O + S["grid"], 0.05)
h_end = BLACKOUT[-1]
city = hum(h_end - S["grid"], 50, 0.5)
steps = np.ones(len(city))
for k, at in enumerate(BLACKOUT):
    steps[int((at - S["grid"]) * SR):] = 1 - (k + 1) / len(BLACKOUT)
mix.add(city * steps, O + S["grid"], 0.07)
for k, at in enumerate(HEAT):
    mix.add(click(0.02, 2200 + 120 * k), O + at, 0.12, pan=-0.5 + 0.2 * k)
for k, at in enumerate(BLACKOUT):
    mix.add(clank(0.35, 260) * 0.8, O + at, 0.3, pan=-0.4 + 0.2 * k)
    mix.add(thump(80, 40, 0.5, decay=8, click=0.6), O + at, 0.25)
# snow and the field: a growing howl
mix.add(wind(S["airport"] - S["snow"], 300, 2000), O + S["snow"], 0.16)
crk = filt(white(int((S["airport"] - S["field"]) * SR)), "highpass", 5000) * (rng_.random(int((S["airport"] - S["field"]) * SR)) > 0.997)
mix.add(crk, O + S["field"], 0.4)
# airport: murmur, a PA ding
mix.add(murmur(S["greenhouse"] - S["airport"], 170), O + S["airport"], 0.12)
mix.add(ding(), O + S["airport"] + 0.5, 0.12)
for k in range(10):
    mix.add(step(), O + S["airport"] + 1.0 + k * 0.35, 0.07, pan=-0.3 + 0.06 * k)
# greenhouse: lamp hum, a steam hiss from the pipes
mix.add(hum(S["ice"] - S["greenhouse"], 100, 0.4), O + S["greenhouse"], 0.03)
mix.add(filt(white(int(3 * SR)), "highpass", 3000) * np.sin(np.pi * tt_(3) / 3) ** 2, O + S["greenhouse"] + 2.0, 0.05)
# ice: wind above, the crack, then a muffled underwater world
mix.add(wind(CRACK - S["ice"] + 0.3, 250, 1500), O + S["ice"], 0.12)
mix.add(crack(), O + CRACK, 0.5)
under = filt(brown(int((S["icecream"] - CRACK) * SR)), "lowpass", 300)
mix.add(under * np.clip(tt_(S["icecream"] - CRACK) / 0.3, 0, 1), O + CRACK + 0.2, 0.25)
mix.add(bubbles(S["icecream"] - S["vent"]), O + S["vent"], 0.1)
mix.add(drone(S["icecream"] - S["vent"], 36.7), O + S["vent"], 0.15)
# the ice cream: greenhouse hum again, two knocks
mix.add(hum(DUR - S["icecream"], 100, 0.3), O + S["icecream"], 0.025)
for at in KNOCK:
    mix.add(knock(), O + at, 0.55)

# ---------------------------------------------------------------- music: a light summer bed until the dark, then a cold pad
t = mix.t - O
bpm = 104
beat = t * bpm / 60
bass_notes = [98.0, 130.8, 110.0, 146.8]  # G2 C3 A2 D3
bar = (np.maximum(beat, 0) // 4).astype(int) % 4
f = np.array(bass_notes)[bar]
ph_b = beat % 1
bass = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-ph_b * 5)
pl_notes = np.array([587.3, 784.0, 987.8, 784.0, 659.3, 880.0, 987.8, 880.0])
eighth = (np.maximum(beat, 0) * 2).astype(int) % 8
ph8 = (beat * 2) % 1
pluck = np.sin(2 * np.pi * np.cumsum(pl_notes[eighth]) / SR) * np.exp(-ph8 * 9) * 0.3
off = (beat + 0.5) % 1
hat = filt(white(mix.n), "highpass", 7000) * np.exp(-off * 40) * 0.2
summer = (bass * 0.5 + pluck + hat) * (t < DARK)
cold = np.zeros(mix.n)
for fq in (110.0, 130.8, 164.8):
    cold += np.sin(2 * np.pi * fq * t + 0.4 * np.sin(2 * np.pi * 0.05 * t)) * 0.3
cold = filt(cold, "lowpass", 900) * np.interp(t, [0, DARK + 2.5, DARK + 6, S["icecream"] - 1, S["icecream"], DUR], [0, 0, 0.8, 0.8, 0, 0])
level = np.interp(t, [0, 0.3, DARK - 0.02, DARK], [0.0, 0.8, 0.8, 0.0])
duck = np.ones(mix.n)
for a, b, at, _ in PIECES:
    duck -= 0.5 * mix.env(O + at - 0.1, O + at + (b - a) + 0.15, 0.12, 0.3)
duck = np.clip(duck, 0.4, 1)
bed = (filt(summer, "lowpass", 5000) * level + cold * 0.5) * duck * 0.2
mix.l += bed
mix.r += bed

# ---------------------------------------------------------------- write
final = mix.write("sun-out")

cues = {
    "duration": DUR,
    "shots": [[n, s] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "buy": BUY, "dark": DARK, "lamps": LAMPS, "moonOff": MOON_OFF, "jupOff": list(JUP_OFF), "heat": HEAT,
    "blackout": BLACKOUT, "crack": CRACK, "knock": KNOCK, "clock": CLOCK,
}
(ROOT / "src/sun").mkdir(exist_ok=True)
(ROOT / "src/sun/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame) and src/sun/cues.json")
print("shots:", SHOTS)
