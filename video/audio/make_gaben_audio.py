"""Soundtrack and timing cues for «Сколько весит мать Габена?» (Russian TikTok meme, low poly).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant» (flow QdTCkAygUMJTAUOzSGpQ, 709 credits),
audio/voice/gaben-vo.mp3 (48.4 s); word times audio/voice/gaben-words.json (audio/transcribe_gaben.py).
The take is used whole, VO_AT seconds into the story. Sound effects are reused from earlier videos (audio/sfx/*).

Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30); the track gets 1/30 s in front.

Sync map (story time of the on-screen event <-> sound):
  STEP        the slipper lands on the bathroom scale  <-> soft slipper thump
  BURST       the scale bursts into springs            <-> boing + metal clatter
  PILE_DROP   a broken scale lands on the pile         <-> clatter
  TRUCK_STEP  the giant slipper lands on the platform  <-> deep thump
  SINK        the weighbridge sinks with the road      <-> rumble + debris
  STALL       the helicopter rotor dies                <-> heli loop fades, engine whine falls
  WALL_LBL    «Великая китайская стена ?»              <-> tick
  SLIPPER_LBL «тапок»                                  <-> pop
  MOON_LEAVE  the Moon leaves its orbit                <-> whoosh + low swell
  ZOOM/REVEAL the black hole turns into a donut        <-> rising whoosh, then ding
  NO          «Нет.» – the silhouette passes           <-> low braam
  ERROR       out-of-memory dialog                     <-> error chord
  CLICK       «Да»                                     <-> mouse click, reset blip
"""

import json

import numpy as np

from slime_lib import ROOT, SR, Mix, click, drone, filt, load, thump, ting, tt_, white

OFF = 1 / 30
VO_AT = 0.2

SHOTS = [
    ("scale", 0.0),
    ("pile", 5.5),
    ("truck", 7.75),
    ("heli", 11.75),
    ("orbit", 18.05),
    ("moon", 24.75),
    ("donut", 30.3),
    ("universe", 36.15),
    ("servers", 41.7),
    ("screen", 44.3),
]
DUR = 50.2

STEP = 1.05
NEEDLE = (1.1, 2.95)
BURST = 3.05
PILE_DROP = 6.55
TRUCK_STEP = 8.35
SINK = (9.35, 10.9)
HELI_FUEL = (13.0, 16.6)
STALL = 16.6
LAND = 17.7
WALL_LBL = 19.55
WALL_Q = 21.0
SLIPPER_LBL = 23.0
MOON_LEAVE = 27.6
ZOOM = (33.0, 34.7)
REVEAL = 35.3
NO = 39.35
PASS = (39.7, 41.6)
BAR = (44.3, 45.3)
ERROR = 45.45
CLICK = 46.55
HL3 = 47.3

# ---------------------------------------------------------------- the voice + caption words
VO = load(ROOT / "audio/voice/gaben-vo.mp3")
WH = json.loads((ROOT / "audio/voice/gaben-words.json").read_text())

# caption text per phrase (whisper's spelling is wrong in places), with the take time it covers
PHRASES = [
    (0.0, 3.7, "Учёные 20 лет пытаются взвесить мать Габена."),
    (3.7, 5.3, "Вот что у них вышло."),
    (5.3, 7.4, "Обычные весы сдались сразу."),
    (7.5, 11.5, "Весы для грузовиков ушли под асфальт вместе с куском дороги."),
    (11.5, 13.5, "Тогда её решили измерить."),
    (13.7, 17.8, "Вертолёт облетал её 4 часа и вернулся без топлива."),
    (17.8, 21.5, "Говорят, из космоса не видно Великую китайскую стену."),
    (21.5, 22.5, "Это правда."),
    (22.6, 24.5, "Зато видно её тапок."),
    (24.5, 27.4, "Потом Луна перестала крутиться вокруг Земли."),
    (27.4, 30.0, "Теперь она крутится вокруг неё."),
    (30.0, 32.3, "Помните первый снимок чёрной дыры?"),
    (32.3, 34.2, "Учёные его приблизили."),
    (34.2, 35.9, "Это был её пончик."),
    (35.9, 38.9, "Учёные думали, что Вселенная расширяется."),
    (38.9, 39.7, "Нет."),
    (39.7, 41.5, "Это она пошла за добавкой."),
    (41.5, 45.6, "Её точный вес до сих пор считают все компьютеры Valve."),
    (45.6, 48.4, "Поэтому Half-Life 3 так и не вышла."),
]

words = []  # [start, end, token, phrase] in story time
for k, (a, b, text) in enumerate(PHRASES):
    toks = text.split(" ")
    ws = [w for w in WH if a - 0.05 <= w[0] < b]
    starts = [w[0] for w in ws]
    if len(starts) != len(toks):  # whisper split a token differently (Half -Life): spread them over the phrase
        t0 = ws[0][0] if ws else a
        t1 = ws[-1][1] if ws else b
        starts = [t0 + (t1 - t0) * j / len(toks) for j in range(len(toks))]
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


def rise(dur=1.6):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [300, 7000]) * (tt / dur) ** 2
    f = 220 * (4 ** (tt / dur))
    return s * 0.7 + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15 * (tt / dur)


def boing(dur=0.9, f=180):
    tt = tt_(dur)
    fr = f * (1 + 0.6 * np.exp(-tt * 6) * np.sin(2 * np.pi * 9 * tt))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 4) * 0.6


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


def error_chord(dur=1.2):
    return ting(311.1, dur) * 0.5 + ting(370.0, dur) * 0.4 + ting(233.1, dur) * 0.4


def clatter(n=10, spread=0.6, seed=1):
    out = np.zeros(int((spread + 0.4) * SR))
    rng = np.random.default_rng(seed)
    for k in range(n):
        at = int(rng.uniform(0, spread) * SR)
        s = ting(rng.uniform(1800, 4200), 0.25) * 0.5
        c = click(0.02, rng.uniform(1500, 3500)) * 0.6
        s[: len(c)] += c
        out[at: at + len(s)] += s[: len(out) - at]
    return out


SLIP = sfx("murino/slippers")
RUMBLE = sfx("earth/rumble")
DEBRIS = sfx("earth/debris")
HELI = sfx("lastman/heli")
IMPACT = sfx("gta/impact")
SERVERS = sfx("gta/servers")
CORE = sfx("grow/core")
CREAK = sfx("grow/creak")

# 1. bathroom scale
place(SLIP, STEP - 0.15, 0.5, length=0.5, fade_out=0.15)
mix.add(thump(90, 45, 0.6, decay=8, click=0.3), O + STEP, 0.4)
tt = tt_(NEEDLE[1] - NEEDLE[0])
f = 300 + 1500 * (tt / tt[-1]) ** 2
mix.add(np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.08 * np.clip(tt / 0.2, 0, 1), O + NEEDLE[0], 1.0)  # whirring needle
place(CREAK, NEEDLE[0] + 0.3, 0.25, length=1.6, fade_out=0.4)
mix.add(boing(1.0, 160), O + BURST, 0.55, pan=-0.2)
mix.add(boing(0.8, 240), O + BURST + 0.07, 0.4, pan=0.3)
mix.add(boing(0.7, 320), O + BURST + 0.15, 0.3, pan=-0.4)
mix.add(clatter(14, 0.9, 3), O + BURST + 0.05, 0.4)
mix.add(thump(70, 35, 0.8, decay=6, click=0.8), O + BURST, 0.5)

# 2. the pile of broken scales
mix.add(clatter(12, 0.5, 7), O + PILE_DROP, 0.45, pan=0.2)
mix.add(boing(0.6, 280), O + PILE_DROP + 0.05, 0.2, pan=0.2)

# 3. the weighbridge
mix.add(thump(48, 26, 1.6, decay=2.4, click=0.4), O + TRUCK_STEP, 0.8)
place(SLIP, TRUCK_STEP - 0.12, 0.35, length=0.45, fade_out=0.15)
place(RUMBLE, SINK[0] - 0.2, 0.75, length=2.6, fade_out=0.8)
place(DEBRIS, SINK[0] + 0.1, 0.5, length=2.2, fade_out=0.8)
mix.add(braam(36.7, 2.4), O + SINK[0], 0.3)

# 4. helicopter along the robe
place(HELI, 11.75, 0.55, length=STALL - 11.75 + 0.9, fade_in=0.3, fade_out=1.0)
tt = tt_(1.4)
mix.add(np.sin(2 * np.pi * np.cumsum(900 * np.exp(-tt * 1.4) + 80) / SR) * 0.06 * np.exp(-tt * 1.2), O + STALL, 1.0)  # engine dies
mix.add(thump(60, 35, 0.8, decay=6, click=0.4), O + LAND, 0.4)

# 5. orbit
place(sfx("gta/wind"), 18.05, 0.18, length=6.6, fade_in=0.6, fade_out=1.0)
mix.add(click(0.03, 2400), O + WALL_LBL, 0.18)
mix.add(ting(880, 0.5), O + WALL_Q, 0.1)
mix.add(click(0.03, 2000), O + SLIPPER_LBL, 0.2)
mix.add(ding(1046.5, 1.0), O + SLIPPER_LBL + 0.03, 0.2)

# 6. moon
place(CORE, 24.75, 0.22, length=5.5, fade_in=0.8, fade_out=1.2)
mix.add(whoosh(1.4, 150, 3000), O + MOON_LEAVE - 0.4, 0.4)
mix.add(braam(32.7, 3.0), O + MOON_LEAVE, 0.25)

# 7. black hole -> donut
mix.add(rise(ZOOM[1] - ZOOM[0] + 0.2), O + ZOOM[0], 0.35)
mix.add(ding(1567.98, 1.4), O + REVEAL, 0.25)
mix.add(ting(2093.0, 1.0), O + REVEAL + 0.08, 0.1)

# 8. universe
place(CORE, 36.15, 0.2, skip=2.0, length=5.5, fade_in=0.6, fade_out=1.0)
mix.add(braam(30.9, 3.2), O + NO, 0.45)
place(SLIP, PASS[0] + 0.3, 0.3, length=1.2, fade_out=0.4)  # giant steps far away, low-passed
mix.add(thump(42, 24, 1.4, decay=2.5, click=0.1), O + PASS[0] + 0.4, 0.45)
mix.add(thump(42, 24, 1.4, decay=2.5, click=0.1), O + PASS[0] + 1.25, 0.4)

# 9. servers + screen
place(SERVERS, 41.7, 0.5, fade_in=0.2)
place(SERVERS, 44.6, 0.35, fade_out=1.5)
tt = tt_(BAR[1] - BAR[0])
mix.add(np.sin(2 * np.pi * np.cumsum(500 + 300 * tt / tt[-1]) / SR) * 0.04, O + BAR[0], 1.0)
mix.add(error_chord(), O + ERROR, 0.35)
mix.add(click(0.05, 1800), O + CLICK, 0.35)
mix.add(click(0.04, 1200), O + CLICK + 0.09, 0.2)
tt = tt_(0.35)
mix.add(np.sin(2 * np.pi * np.cumsum(1200 * np.exp(-tt * 6) + 300) / SR) * 0.08 * np.exp(-tt * 5), O + CLICK + 0.15, 1.0)
mix.add(ting(659.3, 1.6), O + HL3, 0.12)

# ---------------------------------------------------------------- music: a light pulse that grows with the scale
t = mix.t - O
tension = np.interp(t, [0, 5.5, 18.0, 30.3, 36.1, 41.6, 44.3, 48.4, 50.2], [0.4, 0.5, 0.65, 0.8, 0.95, 1.0, 0.55, 0.5, 0.0])
base = drone([41.2, 61.7, 82.4], DUR + 1)[: mix.n]
pulse_rate = np.interp(t, [0, 18.0, 36.0, 44.0], [1.8, 2.2, 2.7, 1.6])
pulse = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(pulse_rate) / SR) ** 8
bed = filt(base * pulse, "lowpass", 700) * tension
duck = np.ones(mix.n)
duck -= 0.4 * mix.env(O + VO_AT, O + VO_AT + 48.4, 0.3, 0.6)
duck = np.clip(duck, 0.35, 1)
mix.l += bed * duck * 0.35
mix.r += bed * duck * 0.35

final = mix.write("gaben-mom")

cues = {
    "duration": DUR,
    "shots": [[n, s] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "step": STEP,
    "needle": list(NEEDLE),
    "burst": BURST,
    "pileDrop": PILE_DROP,
    "truckStep": TRUCK_STEP,
    "sink": list(SINK),
    "heliFuel": list(HELI_FUEL),
    "stall": STALL,
    "land": LAND,
    "wallLbl": WALL_LBL,
    "wallQ": WALL_Q,
    "slipperLbl": SLIPPER_LBL,
    "moonLeave": MOON_LEAVE,
    "zoom": list(ZOOM),
    "reveal": REVEAL,
    "no": NO,
    "pass": list(PASS),
    "bar": list(BAR),
    "error": ERROR,
    "click": CLICK,
    "hl3": HL3,
}
(ROOT / "src/gaben").mkdir(exist_ok=True)
(ROOT / "src/gaben/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame) and src/gaben/cues.json")
