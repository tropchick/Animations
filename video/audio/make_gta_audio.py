"""Soundtrack and timing cues for «Что если GTA 6 перенесут ещё на год?» (TikTok meme, Russian).

Voice: ElevenLabs Eleven v4, library voice «VASKO - Deep, Warm and Pleasant», ONE take
(flow 66nNylMXrJlbLMN2nwC7): audio/voice/gta-vo.mp3, word times audio/voice/gta-words.json.
The take is cut into phrases at its pauses and every phrase is placed on its shot.
Sound effects: ElevenLabs text-to-sound v2, one take each, audio/sfx/gta/*.mp3.
Music (low drone, hits, ticking clock) and small sounds (TV off, ding, whoosh) are synthesized here.

Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30); the track gets 1/30 s in front.

Sync map (story time of the on-screen event <-> sound):
  REPAINT       roller covers 2026, paints 2027      <-> two roller swishes
  JAW           the fan's jaw drops                  <-> low "bwamm" hit
  FLARE         the Sun erupts                       <-> hit + roar
  BLACKOUT      the lights die along the avenue      <-> blackout.mp3 (bangs from its start)
  TV_OFF        the TV at 99 % goes black            <-> CRT power-down
  MOON_CRACK    the Moon cracks                      <-> moon.mp3
  WAVE_HIT      the wave reaches the promenade       <-> tsunami.mp3 peak (0.95 s into the clip)
  ERUPT         the volcano explodes                 <-> volcano.mp3 start
  BOMBS         three lava bombs hit cars            <-> bombs.mp3
  FREEZE        the frost front sweeps the street    <-> freeze.mp3 (onset 0.9 s in)
  LAUNCH        rocket ignition                      <-> rocket.mp3 (onset 0.55 s in)
  PASS          the rocket flies past the asteroid   <-> whoosh
  LOAD_100      99 % -> 100 %, ИГРАТЬ appears        <-> ding
  QUAKE         the bunker starts to shake           <-> bunker.mp3 (onset 0.4 s in)
  IMPACT        the asteroid hits the Earth          <-> impact.mp3 start, everything else cuts
  NOTIFY        the notification slides in           <-> phone ding
"""

import json

import numpy as np

from slime_lib import ROOT, SR, Mix, brown, click, drone, fade_edges, filt, load, thump, ting, tt_, white

OFF = 1 / 30

SHOTS = [
    ("bill", 0.0),
    ("fan", 3.2),
    ("sun", 5.6),
    ("blackout", 8.4),
    ("tv", 11.2),
    ("moon", 12.8),
    ("wave", 15.4),
    ("run", 18.8),
    ("volcano", 21.0),
    ("bombs", 24.0),
    ("mask", 26.2),
    ("ice", 28.4),
    ("candle", 31.6),
    ("asteroid", 34.0),
    ("rocket", 37.0),
    ("miss", 39.6),
    ("bunker", 42.2),
    ("reach", 46.4),
    ("impact", 48.6),
    ("ruins", 52.0),
    ("phone", 57.8),
]
DUR = 62.6

REPAINT = (0.5, 1.6)  # the roller covers 2026
PAINT = (1.7, 2.8)  # 2027 is painted
JAW = 3.9
FLARE = 6.2
BLACKOUT = 8.9  # the dark wave starts down the avenue
TV_OFF = 11.95
MOON_CRACK = 13.2
WAVE_HIT = 17.0
ERUPT = 21.15
BOMBS = [24.15, 24.8, 25.55]
FREEZE = 28.9
LAUNCH = 37.45
PASS = 40.35
LOAD_100 = 44.3
PLAY = 44.9
QUAKE = 45.6
IMPACT = 49.4
SCREEN_ON = 58.6
NOTIFY = 59.0
BATTERY = (60.8, 61.7)
SCREEN_OFF = 61.9

# ---------------------------------------------------------------- the voice, cut into phrases
VO = load(ROOT / "audio/voice/gta-vo.mp3")
WH = json.loads((ROOT / "audio/voice/gta-words.json").read_text())["vo"]
# (start, end) in the take, where it goes on the timeline, the caption text
PIECES = [
    (0.06, 2.78, 0.35, "Rockstar переносит GTA 6 на год."),
    (3.35, 5.20, 3.45, "Человечество до неё не доживёт."),
    (5.71, 7.98, 5.85, "На Солнце мощнейшая вспышка."),
    (8.43, 10.60, 8.65, "Электричество на Земле исчезает."),
    (11.04, 12.69, 13.0, "Луна сходит с орбиты."),
    (13.09, 14.95, 15.6, "Приливы смывают побережья."),
    (15.33, 17.17, 21.3, "Просыпается супервулкан."),
    (17.56, 19.36, 24.3, "Пепел закрывает Солнце."),
    (19.72, 21.71, 28.65, "Начинается ледниковый период."),
    (22.06, 24.00, 34.2, "К Земле летит астероид."),
    (24.32, 26.44, 37.25, "Ракета, которая должна его сбить…"),
    (26.81, 27.74, 40.55, "промахивается."),
    (29.00, 30.72, 42.5, "18 ноября."),
    (31.19, 32.97, 44.6, "До релиза одна ночь."),
    (33.95, 35.73, 52.7, "Человечество вымерло."),
    (36.28, 37.30, 55.2, "GTA 6…"),
    (37.75, 38.54, 56.5, "так и не вышла."),
]
# pieces that share one caption plate
GROUPS = [[0], [1], [2], [3], [4], [5], [6], [7], [8], [9], [10, 11], [12], [13], [14], [15, 16]]

mix = Mix(DUR + OFF + 0.6)
O = OFF
voice = np.zeros(mix.n)
words = []  # [start, end, token, piece]
for k, (a, b, at, text) in enumerate(PIECES):
    seg = fade_edges(VO[int((a - 0.04) * SR): int((b + 0.12) * SR)], 10)
    i = int((O + at - 0.04) * SR)
    voice[i: i + len(seg)] += seg[: mix.n - i]
    toks = text.split(" ")
    ws = [w for w in WH if a - 0.1 <= w[0] < b - 0.25]
    starts = [max(at, at + w[0] - a) for w in ws]
    if len(starts) != len(toks):  # whisper split a token differently: spread them over the phrase
        starts = [at + (b - a) * j / len(toks) for j in range(len(toks))]
    for j, tok in enumerate(toks):
        end = starts[j + 1] if j + 1 < len(toks) else at + (b - a)
        words.append([round(starts[j], 3), round(end, 3), tok, k])
mix.add(voice, 0, 1.0)

# ---------------------------------------------------------------- sound effects
SFX = {n: load(ROOT / f"audio/sfx/gta/{n}.mp3") for n in
       ("blackout", "moon", "tsunami", "volcano", "bombs", "gasmask", "freeze", "rocket", "bunker", "impact", "wind")}


def place(name, at, gain, pan=0.0, fade_out=None, length=None):
    x = SFX[name]
    if length is not None:
        x = x[: int(length * SR)]
    if fade_out:
        n = int(fade_out * SR)
        x = x.copy()
        x[-n:] *= np.linspace(1, 0, n)
    mix.add(x, O + at, gain, pan)


def whoosh(dur=1.2, f0=300, f1=3000):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [200, 6000])
    shape = np.exp(-((tt - dur * 0.45) / (dur * 0.22)) ** 2)
    return filt(s * shape, "lowpass", 4000)


def roller(dur=0.5):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [300, 2400]) * np.sin(np.pi * tt / dur) ** 2


def braam(f=41.2, dur=2.6):
    """A low cinematic brass hit."""
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for r, g in ((1, 1.0), (1.5, 0.5), (2, 0.6), (3, 0.3), (4, 0.18)):
        ph = 2 * np.pi * f * r * tt
        saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
        s += saw * g
    s = filt(s, "lowpass", 900, 2)
    s = np.tanh(s * 1.6)
    return s * np.clip(tt / 0.04, 0, 1) * np.exp(-tt * 1.1)


def crt_off(dur=0.7):
    tt = tt_(dur)
    f = 15700 * np.exp(-tt * 6) + 60
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15 + filt(white(len(tt)), "highpass", 2000) * np.exp(-tt * 18) * 0.5
    return s * np.exp(-tt * 3) + thump(90, 40, dur, decay=12, click=0.4) * 0.5


def ding(f=1318.5, dur=1.2):
    return ting(f, dur) * 0.6 + ting(f * 1.5, dur) * 0.4


# the billboard: two roller swishes, the "bwamm" on the jaw drop
mix.add(roller(0.6), O + REPAINT[0], 0.18, pan=0.2)
mix.add(roller(0.6), O + REPAINT[0] + 0.55, 0.16, pan=0.25)
mix.add(roller(0.5), O + PAINT[0], 0.15, pan=0.2)
mix.add(roller(0.5), O + PAINT[0] + 0.5, 0.14, pan=0.25)
mix.add(braam(43.65), O + JAW, 0.55)
mix.add(thump(55, 30, 1.6, decay=2.2, click=0.3), O + JAW, 0.5)

# the Sun
mix.add(braam(36.7, 3.0), O + FLARE, 0.5)
mix.add(filt(brown(int(2.6 * SR)), "lowpass", 500) * np.exp(-tt_(2.6) * 1.1), O + FLARE, 0.6)
mix.add(whoosh(1.8), O + FLARE + 0.3, 0.35)

place("blackout", BLACKOUT - 0.05, 0.75, pan=0.1)
mix.add(crt_off(), O + TV_OFF, 0.5)

place("moon", MOON_CRACK - 0.1, 1.0)
mix.add(braam(32.7, 3.0), O + MOON_CRACK, 0.45)
place("tsunami", WAVE_HIT - 0.95, 1.0)
# the roar keeps going behind the running fan
roar = filt(brown(int(4.0 * SR)), "lowpass", 700)
mix.add(roar * np.clip(tt_(4.0) / 0.3, 0, 1) * np.clip((4.0 - tt_(4.0)) / 1.0, 0, 1), O + 18.4, 0.55)

place("volcano", ERUPT - 0.05, 1.0)
mix.add(braam(30.9, 3.0), O + ERUPT, 0.45)
place("bombs", BOMBS[0] - 0.12, 0.9)
for at in BOMBS:
    mix.add(thump(60, 28, 1.2, decay=3.5, click=0.6), O + at, 0.55)
place("gasmask", 26.25, 0.9, fade_out=0.4, length=2.3)
ash = filt(brown(int(2.4 * SR)), "lowpass", 350)
mix.add(ash * np.clip(tt_(2.4) / 0.2, 0, 1) * np.clip((2.4 - tt_(2.4)) / 0.3, 0, 1), O + 26.0, 0.35)

place("freeze", FREEZE - 0.9, 1.0)
mix.add(braam(27.5, 3.0), O + FREEZE, 0.35)
# candle: wind outside, a soft flame
wind_in = filt(white(int(2.6 * SR)), "bandpass", [250, 900]) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * tt_(2.6)))
mix.add(wind_in * np.clip(tt_(2.6) / 0.2, 0, 1) * np.clip((2.6 - tt_(2.6)) / 0.4, 0, 1), O + 31.55, 0.18)
flame = filt(white(int(2.5 * SR)), "lowpass", 600) * 0.6
mix.add(flame * np.clip((2.5 - tt_(2.5)) / 0.3, 0, 1), O + 31.6, 0.12)

mix.add(braam(24.5, 3.2), O + 34.25, 0.55)
mix.add(drone([49, 73.4, 98], 3.0) * np.clip(tt_(3.0) / 1.0, 0, 1), O + 34.0, 0.4)
place("rocket", LAUNCH - 0.55, 0.95)
mix.add(whoosh(1.4), O + PASS - 0.6, 0.6, pan=-0.3)
mix.add(whoosh(1.0), O + PASS - 0.3, 0.4, pan=0.4)

# the bunker: a ticking clock, the ding, then the quake
for k, at in enumerate(np.arange(42.3, QUAKE, 0.5)):
    mix.add(click(0.04, 3800 if k % 2 == 0 else 3200), O + at, 0.12)
mix.add(ding(), O + PLAY, 0.22)
place("bunker", QUAKE - 0.4, 0.9)
mix.add(filt(brown(int(3.0 * SR)), "lowpass", 160) * np.clip(tt_(3.0) / 2.0, 0, 1), O + 46.4, 0.7)

place("impact", IMPACT - 0.02, 1.0)
mix.add(thump(48, 22, 3.0, decay=1.0, click=0.8), O + IMPACT, 0.8)
place("wind", 51.6, 0.6, fade_out=1.5)

# the phone
mix.add(click(0.05, 2500), O + SCREEN_ON, 0.1)
mix.add(ding(1567.98, 1.0), O + NOTIFY, 0.3)
mix.add(ding(2093.0, 1.0), O + NOTIFY + 0.16, 0.22)
for at in np.arange(BATTERY[0], BATTERY[1], 0.3):
    mix.add(ting(880, 0.15) * 0.5, O + at, 0.04)

# ---------------------------------------------------------------- music: a low pulse that grows until the impact
t = mix.t - O
tension = np.interp(t, [0, 5.6, 21.0, 34.0, 42.2, 46.4, 49.3, 49.45], [0.35, 0.55, 0.7, 0.85, 0.7, 1.0, 1.0, 0.0])
base = drone([36.7, 55.0, 73.4], DUR + 1)[: mix.n] * 1.0
pulse_rate = np.interp(t, [0, 42.0, 46.4, 49.4], [1.6, 2.0, 2.0, 4.5])
pulse = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(pulse_rate) / SR) ** 8
bed = filt(base * pulse, "lowpass", 700) * tension
duck = np.ones(mix.n)
for a, b, at, _ in PIECES:
    duck -= 0.45 * mix.env(O + at - 0.1, O + at + (b - a) + 0.15, 0.15, 0.3)
duck = np.clip(duck, 0.35, 1)
mix.l += bed * duck * 0.35
mix.r += bed * duck * 0.35
# everything except the impact and the wind goes quiet after the hit
after = np.clip((t - IMPACT) / 0.05, 0, 1)

# ---------------------------------------------------------------- write
final = mix.write("gta6-delay")

cues = {
    "duration": DUR,
    "shots": [[n, s] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "pieces": [[at, at + (b - a)] for a, b, at, _ in PIECES],
    "repaint": list(REPAINT),
    "paint": list(PAINT),
    "jaw": JAW,
    "flare": FLARE,
    "blackout": BLACKOUT,
    "tvOff": TV_OFF,
    "moonCrack": MOON_CRACK,
    "waveHit": WAVE_HIT,
    "erupt": ERUPT,
    "bombs": BOMBS,
    "freeze": FREEZE,
    "launch": LAUNCH,
    "pass": PASS,
    "load100": LOAD_100,
    "play": PLAY,
    "quake": QUAKE,
    "impact": IMPACT,
    "screenOn": SCREEN_ON,
    "notify": NOTIFY,
    "battery": list(BATTERY),
    "screenOff": SCREEN_OFF,
}
(ROOT / "src/gta").mkdir(exist_ok=True)
(ROOT / "src/gta/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame) and src/gta/cues.json")
