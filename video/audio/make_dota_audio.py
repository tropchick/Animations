"""Soundtrack and timing cues for «Что если Доту закроют навсегда?» (Russian TikTok meme chain, low poly).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant» (flow WOmlFvB4Ncjct7qxkT1Y, 926 credits),
raw take audio/voice/dota-vo-raw.mp3 (66.5 s), sped up 1.1x with atempo -> audio/voice/dota-vo.mp3 (60.4 s).
Word times audio/voice/dota-words.json (audio/transcribe_dota.py). The take is used whole, VO_AT seconds into the story.

Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30); the track gets 1/30 s in front.

Sync map (story time of the on-screen event <-> sound):
  SWITCH      «СЕРВЕРЫ ОТКЛЮЧЕНЫ» on the monitor    <-> error chord + low hit
  MUG         the energy can lands on the floor       <-> clink
  WIN_OUT     windows of the block switch off         <-> soft clicks, one per window row
  DOORS       entrance doors open                     <-> door + crowd steps
  TURN        grannies turn their heads               <-> «hm» tick
  LABEL       «НОВЫЕ ЖИЛЬЦЫ?» pops                     <-> pop
  PRINT       printer runs                            <-> printer chatter
  STAMP       «ОТКАЗАНО» stamp on the sheet           <-> stamp thump
  HONK        horns in the middle lane                <-> horns
  SIGN        «МКАД» sign pops                         <-> tick
  GRAPH       the GDP graph shoots up                 <-> rising blip + ding
  HOME        hood up, sip                            <-> can opening hiss
  BUZZ        every phone in the control room buzzes  <-> vibration
  JUMP        everybody jumps up and runs             <-> chairs + stampede
  ALARM       empty room, red alarm                   <-> alarm beeps
  TOWERS_OFF  the plant shuts down                    <-> power-down
  LIGHTS_OUT  the continent goes dark                 <-> low braam + wind
  NOTIFY      phone notification «фейк»               <-> notification ding
  HEAD        head drops on the table                 <-> thud
  CANDLE_OUT  the candle goes out                     <-> puff
  FINAL       «ДОТА 3: ДАТА НЕИЗВЕСТНА»                <-> low ting
"""

import json

import numpy as np

from slime_lib import ROOT, SR, Mix, beep, click, drone, filt, load, thump, ting, tt_, white

OFF = 1 / 30
VO_AT = 0.2

SHOTS = [
    ("room", 0.0),
    ("windows", 3.1),
    ("yard", 6.75),
    ("queue", 13.75),
    ("printer", 17.25),
    ("sheet", 19.2),
    ("road", 20.95),
    ("office", 27.4),
    ("plant", 34.85),
    ("control", 37.6),
    ("leak", 41.55),
    ("leave", 44.4),
    ("off", 48.5),
    ("earth", 50.95),
    ("candle", 53.25),
    ("fake", 55.2),
]
DUR = 61.6

SWITCH = 1.5
MUG = 2.35
WIN_OUT = (3.5, 6.3)
DOORS = 7.0
TURN = 10.75
LABEL = 12.55
PRINT = (17.35, 19.15)
STAMP = 20.4
HONK = [23.5, 24.1, 24.9, 26.3]
SIGN = 25.6
GRAPH = (32.9, 34.3)
HOME = 40.65
BUZZ = 41.85
LEAK_TXT = 42.95
JUMP = 44.6
ALARM = 46.2
TOWERS_OFF = 49.1
LIGHTS_OUT = (51.2, 53.0)
NOTIFY = 55.85
HEAD = 57.75
CANDLE_OUT = 59.3
FINAL = 59.9

# ---------------------------------------------------------------- the voice + caption words
VO = load(ROOT / "audio/voice/dota-vo.mp3")
WH = json.loads((ROOT / "audio/voice/dota-words.json").read_text())

# caption text per phrase (whisper's spelling is wrong in places), with the take time it covers
PHRASES = [
    (0.0, 2.9, "Этой ночью Доту закрыли навсегда."),
    (2.9, 6.5, "15 миллионов человек остались без смысла жизни."),
    (6.5, 10.3, "Утром они впервые за 10 лет вышли на улицу."),
    (10.3, 13.6, "Бабушки у подъезда решили, что это новые жильцы."),
    (13.6, 16.9, "Кнопки «репорт» больше нет, и они пошли в полицию."),
    (16.9, 18.9, "Два миллиона заявлений:"),
    (18.9, 20.8, "«Сосед не дал мид»."),
    (20.8, 22.9, "Привычка требовать мид осталась."),
    (22.9, 25.2, "Все поехали по средней полосе."),
    (25.2, 27.25, "МКАД стоит третьи сутки."),
    (27.25, 30.0, "Деньги кончились, они пошли работать."),
    (30.0, 32.6, "Кто 10 лет терпел раков в команде,"),
    (32.6, 34.6, "выдержит любого начальника."),
    (34.6, 37.5, "Лучше всего они прижились на электростанциях."),
    (37.5, 40.3, "Ночные смены, темно, никто не мешает."),
    (40.3, 41.3, "Как дома."),
    (41.3, 44.3, "А потом в сеть утёк трейлер «Доты 3»."),
    (44.3, 48.3, "15 миллионов человек ливнули с работы за одну секунду."),
    (48.3, 50.8, "Включая всех операторов электростанций."),
    (50.8, 53.0, "Континент остался без света."),
    (53.0, 55.1, "Скачать «Доту 3» не смог никто."),
    (55.1, 57.3, "А трейлер оказался фейком."),
    (57.3, 60.5, "Valve до сих пор не умеет считать до трёх."),
]

words = []  # [start, end, token, phrase] in story time
for k, (a, b, text) in enumerate(PHRASES):
    toks = text.split(" ")
    ws = [w for w in WH if a - 0.05 <= w[0] < b]
    starts = [w[0] for w in ws]
    if len(starts) != len(toks):  # whisper split the phrase differently: spread the tokens by length over the phrase
        t0 = ws[0][0] if ws else a
        t1 = ws[-1][1] if ws else b
        lens = np.cumsum([0] + [len(t) + 2 for t in toks])
        starts = [t0 + (t1 - t0) * lens[j] / lens[-1] for j in range(len(toks))]
    end_of = ws[-1][1] if ws else b
    for j, tok in enumerate(toks):
        end = starts[j + 1] if j + 1 < len(toks) else end_of
        words.append([round(VO_AT + starts[j], 3), round(VO_AT + end, 3), tok, k])
GROUPS = [[k] for k in range(len(PHRASES))]

mix = Mix(DUR + OFF + 0.6)
O = OFF
mix.add(VO, O + VO_AT, 1.0)


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


def error_chord(dur=1.4):
    return ting(311.1, dur) * 0.5 + ting(370.0, dur) * 0.4 + ting(233.1, dur) * 0.4


def buzz(dur=0.45, f=170):
    tt = tt_(dur)
    s = np.sign(np.sin(2 * np.pi * f * tt)) * 0.5 + np.sin(2 * np.pi * f * 2 * tt) * 0.3
    return filt(s, "lowpass", 900) * np.clip(tt / 0.02, 0, 1) * np.clip((dur - tt) / 0.03, 0, 1)


def printer(dur):
    tt = tt_(dur)
    gate = (np.sin(2 * np.pi * 9 * tt) > 0.2).astype(float)
    s = filt(white(len(tt)), "bandpass", [900, 4500]) * gate * 0.5
    s += np.sin(2 * np.pi * 120 * tt) * 0.12
    return s * np.clip(tt / 0.05, 0, 1) * np.clip((dur - tt) / 0.1, 0, 1)


def horn(dur=0.5, f=410):
    tt = tt_(dur)
    s = sum(2 * ((f * r * tt) % 1) - 1 for r in (1.0, 1.26))
    return np.tanh(filt(s, "lowpass", 2500) * 1.2) * 0.4 * np.clip(tt / 0.02, 0, 1) * np.clip((dur - tt) / 0.04, 0, 1)


def hiss(dur=0.5):
    tt = tt_(dur)
    return filt(white(len(tt)), "highpass", 3000) * np.exp(-tt * 6) * 0.5


def power_down(dur=2.4):
    tt = tt_(dur)
    f = 140 * np.exp(-tt * 1.3) + 25
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 * np.exp(-tt * 0.8)


def clatter(n=10, spread=0.6, seed=1):
    out = np.zeros(int((spread + 0.4) * SR))
    rng = np.random.default_rng(seed)
    for k in range(n):
        at = int(rng.uniform(0, spread) * SR)
        s = click(0.05, rng.uniform(300, 900)) * 0.8
        out[at: at + len(s)] += s[: len(out) - at]
    return out


CITY = sfx("earth/city")
CARS = sfx("earth/cars")
DOOR = sfx("murino/door_open")
CROWD = sfx("lastman/crowd")
STEPS = sfx("scp/steps")
STAMPS = sfx("bear/stamp")
HUM = sfx("scp/hum")
BLACKOUT = sfx("gta/blackout")
LIGHTS_OFF = sfx("scp/lights_off")
WIND = sfx("gta/wind")
SERVERS = sfx("gta/servers")

# 1. room at night: PC hum, the error, the can falls
place(SERVERS, 0.0, 0.12, length=3.1, fade_out=0.4)
mix.add(error_chord(), O + SWITCH, 0.4)
mix.add(thump(55, 30, 1.2, decay=3, click=0.2), O + SWITCH, 0.45)
mix.add(ting(2600, 0.5) * 0.5, O + MUG, 0.35)
mix.add(click(0.03, 1800), O + MUG, 0.35)
mix.add(clatter(3, 0.25, 5), O + MUG + 0.05, 0.25)

# 2. the block at night: windows click off row by row
place(WIND, 3.1, 0.15, length=3.7, fade_in=0.4, fade_out=0.6)
for i in range(9):
    mix.add(click(0.03, 1500 + 120 * i), O + WIN_OUT[0] + (WIN_OUT[1] - WIN_OUT[0]) * i / 8, 0.12, pan=(i % 3 - 1) * 0.4)

# 3. yard: morning city, doors, the crowd shuffling out
place(CITY, 6.75, 0.3, length=7.0, fade_in=0.3, fade_out=0.5)
place(DOOR, DOORS - 0.1, 0.35, length=1.6, fade_out=0.4, pan=-0.3)
place(DOOR, DOORS + 0.25, 0.25, length=1.4, fade_out=0.4, pan=0.4)
place(STEPS, DOORS + 0.3, 0.35, length=4.0, fade_in=0.3, fade_out=1.0)
place(CROWD, DOORS + 0.6, 0.18, length=3.2, fade_in=0.6, fade_out=1.0)
mix.add(click(0.03, 900), O + TURN, 0.2)
mix.add(click(0.03, 2400), O + LABEL, 0.25)
mix.add(ding(1046.5, 0.8), O + LABEL + 0.02, 0.12)

# 4. police queue, printer, stamp
place(CROWD, 13.75, 0.3, skip=3.0, length=3.6, fade_in=0.3, fade_out=0.5)
mix.add(printer(PRINT[1] - PRINT[0]), O + PRINT[0], 0.35)
mix.add(click(0.03, 2200), O + 19.2, 0.15)
place(STAMPS, STAMP - 0.05, 0.6)
mix.add(thump(80, 40, 0.5, decay=8, click=0.5), O + STAMP, 0.35)

# 5. the ring road: engines, horns
place(CARS, 20.95, 0.4, length=3.0, fade_in=0.3)
place(CARS, 23.9, 0.4, length=3.0, fade_out=0.6)
for i, at in enumerate(HONK):
    mix.add(horn(0.45 + 0.2 * (i % 2), 400 + 40 * i), O + at, 0.3, pan=(-0.4, 0.3, -0.1, 0.4)[i])
mix.add(click(0.03, 2000), O + SIGN, 0.2)

# 6. office: typing, the boss bangs the table, the graph shoots up
for k in range(26):
    mix.add(click(0.02, 2600 + (k % 5) * 200), O + 27.6 + k * 0.23 + (k % 3) * 0.04, 0.12, pan=0.3)
for at in (28.6, 30.3, 31.9):
    mix.add(thump(110, 60, 0.35, decay=12, click=0.6), O + at, 0.35, pan=-0.2)
tt = tt_(GRAPH[1] - GRAPH[0])
mix.add(np.sin(2 * np.pi * np.cumsum(400 + 900 * (tt / tt[-1]) ** 2) / SR) * 0.06, O + GRAPH[0], 1.0)
mix.add(ding(1318.5, 1.2), O + GRAPH[1], 0.22)

# 7. power plant at night: steam + hum; control room hum, the can
place(WIND, 34.85, 0.25, skip=1.0, length=2.9, fade_in=0.3, fade_out=0.4)
place(HUM, 34.85, 0.25, length=9.6, fade_in=0.5, fade_out=0.3)
mix.add(click(0.02, 3000), O + HOME - 0.05, 0.2)
mix.add(hiss(0.6), O + HOME, 0.35)

# 8. leak: every phone buzzes
for i in range(5):
    mix.add(buzz(0.4, 160 + 15 * i), O + BUZZ + i * 0.05, 0.22, pan=(i - 2) * 0.3)
    mix.add(buzz(0.4, 160 + 15 * i), O + BUZZ + 0.6 + i * 0.05, 0.18, pan=(i - 2) * 0.3)
mix.add(ting(1567.98, 0.6), O + LEAK_TXT, 0.15)

# 9. everybody leaves
mix.add(clatter(14, 0.6, 9), O + JUMP, 0.5)
mix.add(whoosh(1.0, 150, 2500), O + JUMP + 0.1, 0.35)
place(STEPS, JUMP + 0.1, 0.55, length=1.8, fade_out=0.8)
place(HUM, 44.4, 0.25, skip=5.0, length=4.1, fade_out=0.3)
for k in range(5):
    mix.add(beep(880, 0.25), O + ALARM + k * 0.5, 0.18)

# 10. the plant shuts down
place(WIND, 48.5, 0.25, length=2.5, fade_in=0.2, fade_out=0.5)
mix.add(power_down(2.2), O + TOWERS_OFF, 0.6)
place(BLACKOUT, TOWERS_OFF - 0.1, 0.45, length=2.3, fade_out=0.6)

# 11. the continent goes dark
mix.add(braam(32.7, 3.0), O + LIGHTS_OUT[0], 0.35)
place(WIND, 50.95, 0.2, skip=3.0, length=2.4, fade_in=0.3, fade_out=0.5)
for i in range(6):
    mix.add(click(0.04, 600 + 90 * i), O + LIGHTS_OUT[0] + 0.3 * i, 0.12)

# 12. the dark flat: candle, laptop, the fake
place(WIND, 53.25, 0.12, skip=5.0, length=8.0, fade_in=0.5, fade_out=1.5)
mix.add(beep(440, 0.12), O + 53.6, 0.1)
mix.add(ding(1760.0, 0.9), O + NOTIFY, 0.25)
mix.add(buzz(0.35, 170), O + NOTIFY, 0.15)
mix.add(thump(70, 40, 0.6, decay=7, click=0.3), O + HEAD + 0.35, 0.45)
mix.add(filt(white(int(0.35 * SR)), "lowpass", 1200) * np.exp(-tt_(0.35) * 9) * 0.6, O + CANDLE_OUT, 0.35)
mix.add(ting(659.3, 1.8), O + FINAL, 0.14)
mix.add(braam(27.5, 2.6), O + FINAL, 0.2)

# ---------------------------------------------------------------- music: a low pulse that builds to the leak and drops at the shutdown
t = mix.t - O
tension = np.interp(t, [0, 6.7, 20.9, 34.8, 41.5, 44.4, 48.6, 51.0, 55.2, 60.0, 61.6], [0.45, 0.4, 0.55, 0.7, 0.8, 1.0, 0.9, 0.45, 0.3, 0.25, 0.0])
base = drone([41.2, 61.7, 82.4], DUR + 1)[: mix.n]
pulse_rate = np.interp(t, [0, 20.0, 41.5, 48.5, 51.0], [1.8, 2.2, 2.8, 3.2, 1.2])
pulse = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(pulse_rate) / SR) ** 8
bed = filt(base * pulse, "lowpass", 700) * tension
duck = np.ones(mix.n)
duck -= 0.4 * mix.env(O + VO_AT, O + VO_AT + 60.4, 0.3, 0.6)
duck = np.clip(duck, 0.35, 1)
mix.l += bed * duck * 0.35
mix.r += bed * duck * 0.35

final = mix.write("dota-closed")

cues = {
    "duration": DUR,
    "shots": [[n, s] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "switch": SWITCH,
    "mug": MUG,
    "winOut": list(WIN_OUT),
    "doors": DOORS,
    "turn": TURN,
    "label": LABEL,
    "print": list(PRINT),
    "stamp": STAMP,
    "honk": HONK,
    "sign": SIGN,
    "graph": list(GRAPH),
    "home": HOME,
    "buzz": BUZZ,
    "leakTxt": LEAK_TXT,
    "jump": JUMP,
    "alarm": ALARM,
    "towersOff": TOWERS_OFF,
    "lightsOut": list(LIGHTS_OUT),
    "notify": NOTIFY,
    "head": HEAD,
    "candleOut": CANDLE_OUT,
    "final": FINAL,
}
(ROOT / "src/dota").mkdir(exist_ok=True)
(ROOT / "src/dota/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame) and src/dota/cues.json")
