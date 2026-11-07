"""Soundtrack and timing cues for «Что если ты остался последним мужчиной на планете?» (POV chase, Russian text).

No narrator: the story is told by captions; only people inside the scenes speak.
Voices: ONE take each, ElevenLabs Eleven v4 (flow t4MRTYYzn8g2kDk5lmg6):
  radio   Zubaida - Calm Documentary Narrator   audio/voice/lastman-radio.mp3
  cashier Alisa Natural Russian Female           audio/voice/lastman-cashier.mp3
  net     VASKO - Deep, Warm and Pleasant        audio/voice/lastman-net.mp3
  granny  Babushka Valya                         audio/voice/lastman-granny.mp3
  caller  Egor                                   audio/voice/lastman-caller.mp3
SFX from ElevenLabs (same flow): audio/sfx/lastman/{crowd,heli,metro,drones,train}.mp3. Music and the rest are synthesized here.

Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30); the track gets 1/30 s in front.

Sync map (story time of the on-screen event <-> sound):
  SLAP        hand hits the alarm clock                    <-> thump, ringing stops
  RADIO_ON    radio display lights up                      <-> static burst, then the news voice
  HUD_IN      HUD slides in over the mirror                <-> hit + music starts
  TAP         thumb taps «Опубликовать»                    <-> click
  BUZZ        the ex's message arrives                     <-> vibration
  INTERCOM    intercom screen lights up                    <-> door-phone ring
  THROW       the T-shirt leaves the hand                  <-> whoosh
  LAND        the T-shirt lands in the crowd               <-> crowd roar peak
  TRAIN_STOP  metro train stops (doors open DOORS)         <-> metro.mp3 brake tail
  SAD         hot dog alone                                 <-> music stops, sad wah-wah
  SCAN        scanner beep at the till                      <-> beep
  TURN_HIT    whole shop has turned to look                 <-> low hit
  DOORS_SHUT  elektrichka doors close                       <-> train.mp3 slam
  BONK        drone hits the door window                    <-> plastic bonk
  PLATES      each plate lands on the stack                 <-> clink
  HISS        clone capsule opens                           <-> steam hiss
  GRILLE      vent grille closes                            <-> metal clank
  RING        incoming call                                 <-> ringtone
  FLIP        HUD counter 1 -> 2                            <-> big hit, music cut
"""

import json

import numpy as np

from slime_lib import ROOT, SR, Mix, brown, clank, click, filt, load, step, thump, ting, tt_, white

OFF = 1 / 30

SHOTS = [
    ("wake", 0.0),
    ("radio", 3.4),
    ("mirror", 11.6),
    ("story", 14.8),
    ("views", 17.6),
    ("window", 21.6),
    ("ex", 25.2),
    ("intercom", 28.0),
    ("shirt", 32.8),
    ("throw", 35.0),
    ("fight", 38.0),
    ("hotdog", 40.8),
    ("metro", 44.8),
    ("wagon", 48.6),
    ("sad", 51.8),
    ("shop", 54.8),
    ("net", 56.9),
    ("turn", 58.4),
    ("run", 61.2),
    ("train", 64.2),
    ("porch", 67.2),
    ("table", 70.0),
    ("bench", 73.0),
    ("heli", 77.2),
    ("lab", 80.0),
    ("clone", 83.0),
    ("vent", 86.2),
    ("roof", 90.2),
    ("call", 93.4),
    ("ear", 95.0),
    ("counter", 98.4),
    ("final", 100.0),
]
DUR = 103.5
shot_at = dict(SHOTS)

# ---------------------------------------------------------------- voice lines (start times) and captions
RADIO = 3.75
CASHIER = 55.35
NET = 57.25
GRANNY = 70.45
CALLER = 95.45

# [start, end, text, kind]: kind "cap" = story caption, "quote" = a line someone says
CAPS = [
    [RADIO - 0.05, RADIO + 1.6, "Экстренное сообщение.", "quote"],
    [RADIO + 1.95, RADIO + 5.45, "Этой ночью на Земле исчезли все мужчины.", "quote"],
    [RADIO + 5.7, RADIO + 7.75, "Все, кроме одного.", "quote"],
    [12.0, 14.6, "Один — это ты.", "cap"],
    [15.0, 17.4, "Ты выкладываешь сторис.", "cap"],
    [17.8, 21.4, "Через 4 минуты у неё два миллиарда просмотров.", "cap"],
    [21.8, 25.0, "Теперь вся планета знает твой адрес.", "cap"],
    [25.7, 27.8, "Даже бывшая.", "cap"],
    [28.3, 30.6, "Правительство хочет тебя «защитить».", "cap"],
    [30.75, 32.6, "В бункере. Навсегда.", "cap"],
    [33.0, 34.8, "Нужно отвлечь толпу.", "cap"],
    [35.2, 37.8, "Ты кидаешь в окно свою футболку.", "cap"],
    [38.2, 40.6, "Её продадут за миллион.", "cap"],
    [41.0, 44.6, "А ты уходишь в костюме хот-дога с корпоратива.", "cap"],
    [45.0, 48.4, "Метро работает. Свет горит. Всё работает.", "cap"],
    [48.8, 51.6, "Мир прекрасно справляется без мужчин.", "cap"],
    [52.3, 54.6, "Это немного обидно.", "cap"],
    [CASHIER - 0.1, CASHIER + 1.4, "Пакет нужен?", "quote"],
    [NET - 0.1, NET + 1.1, "Нет.", "quote"],
    [58.8, 61.0, "Тебя выдал голос.", "cap"],
    [61.4, 64.0, "Дроны находят тебя за 30 секунд.", "cap"],
    [64.4, 67.0, "Но в электричку они не влезают.", "cap"],
    [67.5, 69.8, "Бабушка не смотрит новости.", "cap"],
    [GRANNY - 0.1, GRANNY + 2.5, "Внучек, садись, поешь.", "quote"],
    [73.3, 77.0, "Но бабушки на лавке — самая быстрая разведка в мире.", "cap"],
    [77.5, 79.8, "К утру знает вся планета.", "cap"],
    [80.3, 82.8, "Учёные решают тебя клонировать.", "cap"],
    [83.5, 86.0, "Клон №1 получился… странным.", "cap"],
    [86.4, 90.0, "Пока все спорят, кто из вас настоящий, ты уходишь.", "cap"],
    [90.5, 93.2, "Месяц спустя твоё лицо на каждом экране.", "cap"],
    [CALLER - 0.1, CALLER + 0.8, "Алло…", "quote"],
    [CALLER + 1.1, CALLER + 2.9, "Ты тоже остался?", "quote"],
    [100.9, 103.5, "Ответишь?", "end"],
]

# ---------------------------------------------------------------- the narrator (one take, cut into lines)
# audio/voice/lastman-narrator.mp3: ElevenLabs v4, library voice «Mikhail» (Natural, Sarcastic, Tired), one take.
# Word times from faster-whisper in audio/voice/lastman-narrator-words.json. Each line is cut at the quietest
# point between lines and starts where its caption starts.
# (index of the line's first word in the take, caption start)
NARR_LINES = [
    ("Один", 12.0), ("Ты", 15.0), ("Через", 17.8), ("Теперь", 21.8), ("Даже", 25.7), ("Правительство", 27.9),
    ("В", 30.8), ("Нужно", 33.05), ("Ты", 35.2), ("Её", 38.2), ("А", 41.0), ("Метро", 45.0), ("Мир", 48.8),
    ("Это", 52.3), ("Тебя", 58.8), ("Дроны", 61.4), ("Но", 64.4), ("Бабушка", 67.5), ("Но", 73.3), ("К", 77.5),
    ("Учёные", 80.3), ("Клон", 83.35), ("Пока", 86.5), ("Месяц", 90.5), ("Ответишь.", 100.9),
]


def narrator_lines():
    take = load(ROOT / "audio/voice/lastman-narrator.mp3")
    words = json.load(open(ROOT / "audio/voice/lastman-narrator-words.json"))
    starts, k = [], 0
    for first, _ in NARR_LINES:  # find each line's first word in order
        while words[k][2] != first:
            k += 1
        starts.append(k)
        k += 1
    env = np.abs(take)
    win = int(0.02 * SR)
    env = np.convolve(env, np.ones(win) / win, "same")
    cuts = [max(0.0, words[0][0] - 0.15)]
    for i in range(1, len(starts)):
        a = words[starts[i] - 1][1] - 0.1  # previous line's last word end (whisper is a bit late/early)
        b = words[starts[i]][0] + 0.1
        ia, ib = int(a * SR), int(b * SR)
        cuts.append((ia + int(np.argmin(env[ia:ib]))) / SR if ib > ia else (a + b) / 2)
    cuts.append(len(take) / SR)
    out = []
    for i, (_, at) in enumerate(NARR_LINES):
        seg = take[int(cuts[i] * SR):int(cuts[i + 1] * SR)]
        # trim silence at both ends
        e = np.convolve(np.abs(seg), np.ones(win) / win, "same")
        on = np.where(e > 0.02 * e.max())[0]
        seg = seg[max(0, on[0] - int(0.03 * SR)):min(len(seg), on[-1] + int(0.08 * SR))]
        n = int(0.01 * SR)
        seg[:n] *= np.linspace(0, 1, n)
        seg[-n:] *= np.linspace(1, 0, n)
        out.append((at, seg))
    return out


NARR = narrator_lines()
# the story captions (and the end card line) are the narrator's lines, in order: start with the voice, stay while it speaks
spoken = [c for c in CAPS if c[3] in ("cap", "end")]
assert len(spoken) == len(NARR)
for c, (at, seg) in zip(spoken, NARR):
    c[0] = at
for i, c in enumerate(CAPS):
    if c[3] in ("cap", "end"):
        at, seg = NARR[spoken.index(c)]
        nxt = CAPS[i + 1][0] - 0.12 if i + 1 < len(CAPS) else DUR
        c[1] = min(max(c[1], at + len(seg) / SR + 0.2), nxt)

# ---------------------------------------------------------------- events
SLAP = 1.6
RADIO_ON = 3.55
HUD_IN = 11.8
TAP = 16.6
VIEWS = (18.0, 21.0)
BUZZ = 25.45
INTERCOM = 28.15
THROW = 35.15
LAND = 36.45
TRAIN_IN = 45.0
TRAIN_STOP = 47.4
DOORS = 47.75
SAD = 52.0
SCAN = 55.0
TURN = (58.45, 58.95)
DOORS_SHUT = 64.75
BONK = 65.45
TRAIN_GO = 65.9
PLATES = [round(70.25 + k * 0.3 - 0.004 * k * k, 3) for k in range(10)]
HISS = 83.35
GRILLE = 88.6
RING = (93.6, 95.0)
FLIP = 98.75

mix = Mix(DUR + OFF)
O = OFF
N = mix.n
t = mix.t - O


def loop(sig, dur, fade=0.4):
    """sig repeated to dur seconds with short crossfades"""
    n = int(dur * SR)
    out = np.zeros(n)
    f = int(fade * SR)
    pos = 0
    while pos < n:
        seg = sig.copy()
        seg[:f] *= np.linspace(0, 1, f)
        seg[-f:] *= np.linspace(1, 0, f)
        k = min(len(seg), n - pos)
        out[pos:pos + k] += seg[:k]
        pos += len(seg) - f
    return out


def fades(sig, fi=0.3, fo=0.5):
    n = len(sig)
    e = np.ones(n)
    a, b = int(fi * SR), int(fo * SR)
    if a:
        e[:a] = np.linspace(0, 1, a)
    if b:
        e[-b:] = np.minimum(e[-b:], np.linspace(1, 0, b))
    return sig * e


def whoosh(dur=0.6, lo=300, hi=3000):
    tt = tt_(dur)
    f = lo + (hi - lo) * np.sin(np.pi * tt / dur)
    s = np.zeros(len(tt))
    for k in range(0, len(tt), 2400):
        s[k:k + 2400] = filt(white(min(2400, len(tt) - k)), "bandpass", [max(80, f[k] * 0.6), f[k] * 1.4], 2)
    return s * np.sin(np.pi * tt / dur) ** 2


def ring_tone(dur):
    tt = tt_(dur)
    s = (np.sin(2 * np.pi * 880 * tt) + np.sin(2 * np.pi * 1320 * tt)) * 0.5
    gate = ((tt * 2.5) % 1 < 0.55).astype(float)
    trill = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 18 * tt))
    return s * gate * trill


def alarm(dur):
    tt = tt_(dur)
    s = np.sign(np.sin(2 * np.pi * 2093 * tt)) * 0.4 + np.sin(2 * np.pi * 4186 * tt) * 0.3
    return filt(s * ((tt * 8) % 1 < 0.5), "lowpass", 6000)


def vib(dur=0.7):
    tt = tt_(dur)
    s = np.sin(2 * np.pi * 150 * tt) * (np.sin(2 * np.pi * 1.0 / 0.35 * tt) > 0)
    return filt(s + 0.3 * white(len(tt)) * 0.1, "lowpass", 900)


def static(dur):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [700, 5000]) * np.exp(-tt * 3) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * tt))


def hiss(dur=1.4):
    tt = tt_(dur)
    return filt(white(len(tt)), "highpass", 2500) * np.exp(-tt * 2.2) * np.clip(tt / 0.02, 0, 1)


def bonk():
    tt = tt_(0.4)
    return np.sin(2 * np.pi * (520 * np.exp(-tt * 3)) * tt) * np.exp(-tt * 16) + filt(white(len(tt)), "bandpass", [800, 3000]) * np.exp(-tt * 60) * 0.5


def wah(f0, f1, dur):
    tt = tt_(dur)
    f = f0 + (f1 - f0) * tt / dur
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.012 * np.sin(2 * np.pi * 6 * tt))) / SR
    s = sum(np.sin(ph * k) / k for k in range(1, 8))
    cut = 500 + 1500 * np.sin(np.pi * np.clip(tt / dur, 0, 1))
    out = np.zeros(len(tt))
    for k in range(0, len(tt), 1200):
        out[k:k + 1200] = filt(s[k:k + 1200], "lowpass", cut[k], 2)
    return out * np.clip(tt / 0.04, 0, 1) * np.clip((dur - tt) / 0.15, 0, 1)


def roll(dur=0.5):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [200, 1200]) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * tt)) * np.exp(-tt * 2)


def sfx(name):
    return load(ROOT / f"audio/sfx/lastman/{name}.mp3")


def voice(name):
    return load(ROOT / f"audio/voice/lastman-{name}.mp3")


# ---------------------------------------------------------------- room tones per set
def bed(sig, a, b, g, fi=0.2, fo=0.25):
    seg = loop(sig, b - a + 0.1)
    mix.add(fades(seg, fi, fo), O + a, g)


room = filt(brown(int(20 * SR)), "lowpass", 400)
city = filt(brown(int(20 * SR)), "lowpass", 900) + filt(white(int(20 * SR)), "bandpass", [300, 2000]) * 0.04
bed(room, 0.0, 21.6, 0.05)
crowd = sfx("crowd")
# crowd outside grows with the shot
mix.add(fades(loop(crowd, 4.0)) * np.linspace(0.15, 0.9, int(4.0 * SR)), O + 21.6, 0.5)
bed(crowd, 25.2, 32.8, 0.12)  # muffled through the window
bed(crowd, 32.8, 35.2, 0.3)
roar = loop(crowd, 5.8)
mix.add(fades(roar, 0.05, 0.6) * np.interp(np.arange(len(roar)) / SR, [0, 1.3, 1.6, 5.8], [0.6, 1.0, 1.25, 0.9]), O + 35.0, 0.6)
bed(crowd, 40.8, 44.8, 0.35)
heli = sfx("heli")
bed(heli, 21.6, 25.2, 0.25, 0.8, 0.2)
bed(heli, 77.2, 80.0, 0.6, 0.3, 0.3)
# metro
metro = sfx("metro")
mix.add(fades(metro[: int(7.6 * SR)], 0.05, 0.6), O + TRAIN_STOP - 6.3, 0.75)
rumble = filt(brown(int(10 * SR)), "lowpass", 260)
bed(rumble, 48.6, 54.8, 0.35)
# shop hum
hum = np.sin(2 * np.pi * 100 * tt_(10)) * 0.05 + filt(white(int(10 * SR)), "lowpass", 2000) * 0.02
bed(hum, 54.8, 61.2, 0.6)
# street run
bed(city, 61.2, 64.2, 0.12)
drones = sfx("drones")
mix.add(fades(drones[: int(3.4 * SR)], 0.05, 0.4), O + 61.2, 0.8)
for k in range(9):
    mix.add(step(0.25), O + 61.3 + k * 0.33, 0.25, pan=-0.3 if k % 2 else 0.3)
train = sfx("train")
mix.add(fades(train, 0.02, 0.6), O + DOORS_SHUT - 0.15, 0.8)
mix.add(fades(drones[int(2.0 * SR): int(3.6 * SR)], 0.05, 0.3), O + 64.3, 0.35)
mix.add(bonk(), O + BONK, 0.55, pan=0.15)
# village: birds and a cockerel-ish crow, wind
birds = np.zeros(int(13 * SR))
rng = np.random.default_rng(3)
for k in range(40):
    at = rng.uniform(0, 12.5)
    tt = tt_(0.12)
    f = rng.uniform(3000, 5200)
    ch = np.sin(2 * np.pi * (f + 900 * np.sin(2 * np.pi * 25 * tt)) * tt) * np.sin(np.pi * tt / 0.12)
    i = int(at * SR)
    birds[i:i + len(ch)] += ch * rng.uniform(0.2, 0.5)
mix.add(fades(birds[: int(10 * SR)]), O + 67.2, 0.12)
bed(filt(brown(int(10 * SR)), "lowpass", 600), 67.2, 77.2, 0.06)
# night village: crickets
cr = np.sin(2 * np.pi * 4400 * tt_(4)) * ((tt_(4) * 14) % 1 < 0.35) * ((tt_(4) * 0.9) % 1 < 0.55)
bed(cr, 77.2, 80.0, 0.03)
# lab hum
bed(np.sin(2 * np.pi * 60 * tt_(10)) * 0.2 + filt(white(int(10 * SR)), "bandpass", [2000, 6000]) * 0.03, 80.0, 90.2, 0.25)
# roof wind
bed(filt(brown(int(14 * SR)), "lowpass", 500), 90.2, 100.0, 0.18, 0.3, 1.0)
bed(city, 90.2, 98.7, 0.05)

# ---------------------------------------------------------------- spot effects
mix.add(alarm(SLAP + 0.05), O + 0.0, 0.12)
mix.add(thump(90, 50, 0.5, decay=14, click=1.0), O + SLAP, 0.45)
mix.add(static(0.5), O + RADIO_ON, 0.18)
mix.add(thump(55, 30, 1.6, decay=2.2, click=0.8), O + HUD_IN, 0.6)
mix.add(click(0.04, 2600), O + TAP, 0.3)
mix.add(ting(1760, 0.8), O + TAP + 0.05, 0.08)
for k in range(30):  # view counter ticks
    at = VIEWS[0] + (VIEWS[1] - VIEWS[0]) * (k / 30) ** 0.8
    mix.add(click(0.02, 3200), O + at, 0.07, pan=0.1)
mix.add(ting(2637, 1.2), O + VIEWS[1], 0.12)
mix.add(vib(0.7), O + BUZZ, 0.35)
mix.add(ting(1568, 0.6), O + BUZZ + 0.05, 0.06)
for k in range(3):
    mix.add(ring_tone(0.6) * 0.5, O + INTERCOM + k * 0.9, 0.12)
mix.add(whoosh(0.7, 300, 2500), O + THROW - 0.1, 0.35)
mix.add(thump(70, 40, 0.8, decay=6, click=0.3), O + LAND, 0.25)
for k in range(8):  # hot dog footsteps
    mix.add(step(0.25) * 0.6, O + 41.6 + k * 0.42, 0.15, pan=0.4)
mix.add(click(0.05, 1800) * 0.5 + 0.3 * click(0.05, 2400), O + DOORS, 0.2)
mix.add(wah(220, 196, 0.45), O + SAD + 0.15, 0.13)
mix.add(wah(196, 185, 0.45), O + SAD + 0.65, 0.13)
mix.add(wah(185, 175, 0.45), O + SAD + 1.15, 0.13)
mix.add(wah(175, 150, 1.3), O + SAD + 1.65, 0.13)
mix.add(np.sin(2 * np.pi * 2400 * tt_(0.12)) * 0.4, O + SCAN, 0.18)
mix.add(roll(0.5), O + TURN[0], 0.15)
mix.add(thump(48, 26, 2.0, decay=2.0, click=0.6), O + TURN[1], 0.55)
for k, at in enumerate(PLATES):
    mix.add(ting(2600 + 150 * (k % 4), 0.35), O + at, 0.12, pan=-0.2 + 0.05 * k)
    mix.add(thump(140, 90, 0.2, decay=30, click=0.4), O + at, 0.12)
mix.add(hiss(1.6), O + HISS, 0.3)
mix.add(ting(1046, 1.2), O + HISS + 0.4, 0.06)
mix.add(clank(0.5, 380), O + GRILLE, 0.3)
mix.add(ring_tone(RING[1] - RING[0]) * 0.6, O + RING[0], 0.2)
mix.add(vib(RING[1] - RING[0]), O + RING[0], 0.18)
mix.add(thump(42, 22, 3.0, decay=1.3, click=1.0), O + FLIP, 0.9)
mix.add(ting(659, 3.0), O + FLIP, 0.12)
# heartbeat under the roof scene
for k in range(8):
    at = 91.0 + k * 0.85
    mix.add(thump(55, 40, 0.3, decay=16, click=0), O + at, 0.18)
    mix.add(thump(55, 40, 0.3, decay=16, click=0), O + at + 0.22, 0.12)

# ---------------------------------------------------------------- voices
lines = [("radio", RADIO, 0.95), ("cashier", CASHIER, 0.85), ("net", NET, 1.0), ("granny", GRANNY, 0.9), ("caller", CALLER, 0.95)]
duck = np.ones(N)
for name, at, g in lines:
    v = voice(name)
    if name == "radio":  # small speaker
        v = filt(filt(v, "highpass", 250, 2), "lowpass", 4500, 2)
        v = np.tanh(v * 1.5) / 1.5
    if name == "caller":  # through a phone
        v = filt(filt(v, "highpass", 350, 2), "lowpass", 3400, 2)
    mix.add(v, O + at, g)
    duck -= 0.55 * mix.env(O + at - 0.1, O + at + len(v) / SR + 0.1, 0.1, 0.3)
for at, seg in NARR:
    mix.add(seg, O + at, 1.0)
    duck -= 0.6 * mix.env(O + at - 0.08, O + at + len(seg) / SR + 0.05, 0.08, 0.25)
duck = np.clip(duck, 0.3, 1)

# ---------------------------------------------------------------- music: a driving, slightly cheeky beat
bpm = np.interp(t, [0, 60.9, 61.3, 67.0, 67.4], [118, 118, 132, 132, 112])
beat = np.cumsum(bpm / 60 / SR)
beat -= np.interp(HUD_IN, t, beat)  # the first downbeat on the HUD hit
ph = beat % 1
kick = np.zeros(N)
kick_shape = thump(62, 38, 0.35, decay=12, click=0.25)
idx = np.where(np.diff(np.floor(beat)) > 0)[0]
for i in idx:
    n = min(len(kick_shape), N - i)
    kick[i:i + n] += kick_shape[:n]
half = (beat + 0.5) % 1
hat = filt(white(N), "highpass", 7000) * np.exp(-half * 45) * 0.22
two = (beat % 2) / 2
clap = filt(white(N), "bandpass", [900, 4000]) * np.exp(-((beat - 1) % 2) * 22) * 0.35
notes = np.array([110.0, 110.0, 87.3, 87.3, 130.8, 130.8, 98.0, 98.0])  # A F C G, two beats each
bar = (np.floor(beat) % 8).astype(int)
f = notes[bar]
ph8 = (beat * 2) % 1
bass = np.sin(2 * np.pi * np.cumsum(f / 2) / SR) * np.exp(-ph8 * 4) + 0.35 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-ph8 * 7)
lead_notes = np.array([440.0, 523.3, 659.3, 523.3, 440.0, 392.0, 349.2, 392.0, 440.0, 523.3, 587.3, 659.3, 698.5, 659.3, 587.3, 523.3])
eighth = np.floor(beat * 2).astype(int) % 16
pluck = np.sin(2 * np.pi * np.cumsum(lead_notes[eighth]) / SR) * np.exp(-ph8 * 10)
pluck = pluck + 0.3 * np.sign(pluck) * np.exp(-ph8 * 18)

# sections: (from, to, kick, hat, clap, bass, pluck)
SECT = [
    (HUD_IN, 51.95, 1, 1, 1, 1, 1),
    (54.8, 58.4, 0.6, 1, 0, 0.8, 0),
    (58.95, 67.2, 1, 1, 1, 1, 1),
    (67.2, 80.0, 0.5, 0.6, 0.4, 0.6, 1),
    (80.0, 90.2, 1, 1, 1, 1, 0.6),
    (90.2, FLIP, 0, 0.3, 0, 0.7, 0),
]
mus = np.zeros(N)
for a, b, k, h, c, ba, p in SECT:
    e = mix.env(O + a, O + b, 0.03, 0.08)
    mus += e * (kick * 0.9 * k + hat * h + clap * c + bass * 0.55 * ba + pluck * 0.22 * p)
# a low pad under the radio and the roof
pad_t = t
pad = (np.sin(2 * np.pi * 55 * pad_t) + 0.5 * np.sin(2 * np.pi * 82.4 * pad_t) + 0.3 * np.sin(2 * np.pi * 110 * pad_t + np.sin(2 * np.pi * 0.2 * pad_t)))
mus += pad * 0.25 * (mix.env(O + 4.0, O + HUD_IN, 1.5, 0.05) + mix.env(O + 90.2, O + FLIP, 1.0, 0.05))
# a soft chord on the final card
mus += pad * 0.18 * mix.env(O + 100.0, O + DUR, 1.0, 1.5)
mus = filt(mus, "lowpass", 7000) * duck * 0.42
mix.l += mus
mix.r += mus

final = mix.write("last-man")

cues = {
    "duration": DUR,
    "shots": [[n, s] for n, s in SHOTS],
    "caps": CAPS,
    "slap": SLAP, "radioOn": RADIO_ON, "hudIn": HUD_IN, "tap": TAP, "views": list(VIEWS), "buzz": BUZZ,
    "intercom": INTERCOM, "throw": THROW, "land": LAND, "trainIn": TRAIN_IN, "trainStop": TRAIN_STOP, "doors": DOORS,
    "sad": SAD, "scan": SCAN, "turn": list(TURN), "doorsShut": DOORS_SHUT, "bonk": BONK, "trainGo": TRAIN_GO,
    "plates": PLATES, "hiss": HISS, "grille": GRILLE, "ring": list(RING), "flip": FLIP,
    "cashier": CASHIER, "net": NET, "granny": GRANNY, "caller": CALLER, "radio": RADIO,
}
(ROOT / "src/lastman").mkdir(exist_ok=True)
(ROOT / "src/lastman/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame) and src/lastman/cues.json")
