"""Soundtrack and timing cues for «Что если движуха закончится?» (low poly, Russian VO, causal chain).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant» (flow tVeSoBQ4kOMJr6oP1EVH):
audio/voice/dvizh-vo.mp3, word times audio/voice/dvizh-words.json (faster-whisper medium).
All other sounds are synthesized here.

Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30); the track gets 1/30 s in front.

Sync map (story time of the on-screen event <-> sound):
  FIREWORKS  bursts in the kitchen window                   <-> pop + crackle
  MUG        the mug leaves his hand / hits the floor       <-> - / smash
  COUNT      the dollar counts down to 30                   <-> fast clicks, hit at the end
  PHOTO      grandma's phone flash                          <-> shutter
  FLIPS      departure board rows flip                      <-> split-flap clacks
  PLY        each plywood sheet hits the floor              <-> wooden slap
  SIGN_ON    the burger sign lights up                      <-> neon buzz + ting
  LOAD       the video bar fills at once                    <-> whoosh + ting
  SIGH       the VPN seller sighs                           <-> breath out
  DOORS_OPEN terminal doors slide open                      <-> whoosh
  KISS       the IT guy lands face down / kisses            <-> thump / smack
  TAGS       each price tag drops                           <-> falling blip
  CASH       the till                                       <-> ka-ching
  HOLES      the roller drum passes a pothole               <-> soft pop
  BUZZ       teacher's phone buzzes                         <-> buzz
  DROP       the pointer hits the floor                     <-> wooden clatter
  COUNT2     the dollar counts down to 5                    <-> clicks, hit
  CLINKS     spoon on a cup                                 <-> ting
  FIST       uncle's fist on the table                      <-> thump + dishes rattle
"""

import json

import numpy as np

from slime_lib import ROOT, SR, Mix, breath, brown, clank, click, fade_edges, filt, load, step, thump, ting, tt_, white

OFF = 1 / 30

SHOTS = [
    ("kitchen", 0.0),
    ("rate", 4.2),
    ("airport", 8.0),
    ("mall", 15.0),
    ("queue", 17.3),
    ("phone", 21.0),
    ("seller", 24.6),
    ("arrivals", 27.8),
    ("tech", 34.0),
    ("road", 40.0),
    ("school", 48.2),
    ("embassy", 52.6),
    ("rate2", 56.8),
    ("family", 61.0),
    ("uncle", 68.6),
]
DUR = 75.5

FIREWORKS = [0.35, 1.25, 2.75, 3.5]
MUG = (1.75, 2.2)
COUNT = (5.6, 7.15)
PHOTO = 7.55
FLIPS = [8.5, 8.75, 9.0, 9.25, 9.5]
PLY = [15.75, 16.15, 16.55]
SIGN_ON = 16.75
LOAD = 23.05
SIGH = 25.55
DOORS_OPEN = 28.05
KISS = (31.25, 31.7, 31.95)  # starts tipping, lands, kiss
TAGS = [34.75, 35.15, 35.55]
CASH = 36.55
ROLLER = (40.3, 47.9, -13.0, 13.0)  # time from/to, drum x from/to
HOLES_X = [-9.0, -6.0, -3.0, 0.0, 3.0, 6.0, 9.0]
HOLES = [ROLLER[0] + (x - ROLLER[2]) / (ROLLER[3] - ROLLER[2]) * (ROLLER[1] - ROLLER[0]) for x in HOLES_X]
BUZZ = 48.75
DROP = (50.95, 51.35)  # lets go, hits the floor
COUNT2 = (57.5, 59.4)
CLINKS = [63.1, 65.3]
PAPER = 69.0
FIST = 72.15

# ---------------------------------------------------------------- the voice
VO = load(ROOT / "audio/voice/dvizh-vo.mp3")
WH = json.loads((ROOT / "audio/voice/dvizh-words.json").read_text())["vo"]
# take (start, end), where it goes on the timeline, the caption text
PIECES = [
    (0.00, 2.30, 0.30, "Сегодня движуха закончилась."),
    (2.70, 5.82, 4.40, "Через пять минут доллар падает до 30 рублей."),
    (6.40, 9.30, 8.20, "Рубль крепнет, рейсы в Европу возвращаются."),
    (9.66, 12.74, 11.40, "Билет в Париж теперь дешевле такси до аэропорта."),
    (12.92, 14.86, 15.20, "Ушедшие бренды возвращаются."),
    (15.16, 17.54, 17.60, "За первым бургером стоят с ночи."),
    (17.72, 21.04, 21.20, "Блокировки снимают, видео грузятся без ВПН."),
    (21.24, 23.78, 24.80, "Продавцы ВПН остаются без работы."),
    (24.36, 26.58, 28.10, "Все, кто уехал, возвращаются домой."),
    (26.86, 28.95, 30.50, "Айтишники целуют асфальт."),
    (29.15, 31.20, 34.20, "Импорт дешевеет в 10 раз."),
    (31.40, 33.32, 36.60, "Люди берут по три телевизора."),
    (33.78, 37.24, 40.20, "Деньги, которые уходили на движуху, отдают на дороги."),
    (37.50, 40.28, 44.00, "Все ямы в стране закатывают за одну ночь."),
    (40.58, 43.70, 48.40, "Учителям и врачам поднимают зарплату в 5 раз."),
    (43.98, 47.02, 52.80, "Теперь иностранцы стоят в очереди за нашей визой."),
    (47.36, 50.38, 57.00, "Рубль становится самой сильной валютой мира."),
    (51.84, 56.54, 61.60, "Впервые за четыре года вся родня собралась за одним столом."),
    (56.66, 58.20, 66.60, "И никто не поругался."),
    (59.12, 62.06, 69.10, "Дядя Витя продержался один день."),
    (62.54, 64.34, 72.60, "Теперь он спорит о шаурме."),
]
GROUPS = [[k] for k in range(len(PIECES))]


def edge(t, d, x, thr=0.004, quiet=0.06):
    """From t, step in direction d (−1 back, +1 forward) until there is `quiet` seconds of silence; keep 30 ms of it."""
    w = int(0.01 * SR)
    k = 0
    run = 0
    while k < 60:  # never more than 0.6 s
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
    a0, b0 = edge(a, -1, VO), edge(b, 1, VO)
    seg = fade_edges(VO[int(a0 * SR): int(b0 * SR)], 10)
    i = int((O + at - (a - a0)) * SR)
    voice[i: i + len(seg)] += seg[: mix.n - i]
    toks = text.split(" ")
    ws = [w for w in WH if a - 0.1 <= w[0] < b - 0.15]
    starts = [max(at, at + w[0] - a) for w in ws]
    if len(starts) != len(toks):
        print("token mismatch in piece", k, [w[2] for w in ws], toks)
        starts = [at + (b - a) * j / len(toks) for j in range(len(toks))]
    for j, tok in enumerate(toks):
        end = starts[j + 1] if j + 1 < len(toks) else at + (b - a)
        words.append([round(starts[j], 3), round(end, 3), tok, k])
mix.add(voice, 0, 1.0)

rng_ = np.random.default_rng(7)


# ---------------------------------------------------------------- synthesized sounds
def firework():
    tt = tt_(1.4)
    boom = thump(90, 40, 0.6, decay=6, click=0.8)
    s = np.zeros(len(tt))
    s[: len(boom)] += boom[: len(s)]
    crack = (rng_.random(len(tt)) > 0.9985) * rng_.uniform(0.3, 1, len(tt)) * np.clip((tt - 0.15) / 0.1, 0, 1) * np.exp(-tt * 2.2)
    s += filt(np.convolve(crack, np.exp(-np.arange(150) / 25), "same") * white(len(tt)), "highpass", 1800) * 3
    return s


def smash():
    s = np.zeros(int(0.9 * SR))
    for k in range(12):
        c = ting(2500 + rng_.uniform(0, 3500), 0.4) * rng_.uniform(0.2, 0.6)
        i = int(rng_.uniform(0, 0.12) * SR)
        s[i: i + len(c)] += c[: len(s) - i]
    n = int(0.25 * SR)
    s[:n] += filt(white(n), "bandpass", [1500, 9000]) * np.exp(-np.arange(n) / SR * 25)
    return s


def flap(n=6, gap=0.035):
    s = np.zeros(int((n * gap + 0.1) * SR))
    for k in range(n):
        c = click(0.03, 1800 + 200 * (k % 3))
        i = int(k * gap * SR)
        s[i: i + len(c)] += c * (0.6 + 0.4 * (k == n - 1))
    return s


def slap():
    s = thump(110, 60, 0.3, decay=16, click=1.4)
    n = len(s)
    return s + filt(white(n), "bandpass", [300, 2500]) * np.exp(-np.arange(n) / SR * 30) * 0.6


def buzz(dur=0.8, f=120):
    tt = tt_(dur)
    s = np.sign(np.sin(2 * np.pi * f * tt)) * 0.3 + np.sin(2 * np.pi * 2 * f * tt) * 0.3
    return filt(s, "bandpass", [200, 3000]) * np.clip(tt / 0.02, 0, 1) * np.clip((dur - tt) / 0.1, 0, 1) * (0.7 + 0.3 * np.sin(2 * np.pi * 9 * tt))


def whoosh(dur=0.6, f0=600, f1=3000):
    tt = tt_(dur)
    s = white(len(tt))
    lo = filt(s, "bandpass", [f0, f1])
    return lo * np.sin(np.pi * tt / dur) ** 2


def murmur(dur, base=140):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for k in range(6):
        f = base + 40 * k
        env = np.clip(np.sin(2 * np.pi * (2.1 + 0.37 * k) * tt + k) + 0.2 * np.sin(2 * np.pi * 7.3 * tt + k), 0, 1)
        s += filt(white(len(tt)), "bandpass", [f, f * 4.5]) * env
    return s / 6 * np.clip(tt / 0.3, 0, 1) * np.clip((dur - tt) / 0.3, 0, 1)


def fall_blip(f=900):
    tt = tt_(0.35)
    fr = f * (1 - 0.55 * tt / 0.35)
    s = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 7) * 0.6
    th = thump(150, 80, 0.25, decay=20, click=0.5) * 0.4
    s[: len(th)] += th[: len(s)]
    return s


def kaching():
    s = np.zeros(int(1.2 * SR))
    c = clank(0.3, 700)
    s[: len(c)] += c * 0.5
    for k, f in enumerate((2637, 3136)):
        t2 = ting(f, 1.0)
        i = int((0.08 + 0.06 * k) * SR)
        s[i: i + len(t2)] += t2[: len(s) - i] * 0.6
    return s


def rumble(dur):
    tt = tt_(dur)
    eng = np.sign(np.sin(2 * np.pi * 28 * tt)) * 0.35 + brown(len(tt)) * 0.65
    return filt(eng, "lowpass", 260) * np.clip(tt / 0.6, 0, 1) * np.clip((dur - tt) / 0.8, 0, 1)


def smack():
    tt = tt_(0.12)
    return filt(white(len(tt)), "bandpass", [600, 4000]) * np.exp(-tt * 45) + np.sin(2 * np.pi * 420 * tt) * np.exp(-tt * 50) * 0.5


def cloth(dur=0.3):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [400, 2500]) * np.sin(np.pi * tt / dur) ** 2 * 0.5


def shutter():
    s = np.zeros(int(0.2 * SR))
    for at in (0.0, 0.07):
        c = click(0.04, 2200)
        i = int(at * SR)
        s[i: i + len(c)] += c
    return s


def tick():
    return click(0.02, 3500) * 0.6


# the hook: evening kitchen, fireworks outside, the mug
for k, at in enumerate(FIREWORKS):
    mix.add(firework(), O + at, 0.22 - 0.03 * (k % 2), pan=-0.3 + 0.2 * k)
mix.add(murmur(4.2, 200), O + 0.0, 0.07)  # distant cheering
mix.add(smash(), O + MUG[1], 0.45, pan=0.1)
# exchange booth: street, count down, photo
mix.add(murmur(3.8), O + 4.2, 0.1)
n_cl = 22
for k in range(n_cl):
    at = COUNT[0] + (COUNT[1] - COUNT[0]) * (k / n_cl) ** 0.7
    mix.add(click(0.03, 2400 - 40 * k), O + at, 0.12, pan=0.2)
mix.add(thump(60, 32, 1.2, decay=3, click=0.5), O + COUNT[1], 0.4)
mix.add(ting(1760, 0.8), O + COUNT[1], 0.12)
mix.add(shutter(), O + PHOTO, 0.3, pan=-0.3)
# airport
mix.add(murmur(7.0, 180), O + 8.0, 0.12)
for k, at in enumerate(FLIPS):
    mix.add(flap(), O + at, 0.28, pan=-0.3 + 0.15 * k)
for k in range(10):
    mix.add(step(), O + 11.5 + k * 0.27, 0.12, pan=-0.5 + 0.1 * k)
mix.add(filt(white(int(3 * SR)), "bandpass", [200, 700]) * np.sin(np.pi * tt_(3) / 3) ** 2, O + 11.6, 0.06)  # suitcase wheels
# mall
for k, at in enumerate(PLY):
    mix.add(slap(), O + at, 0.4, pan=-0.3 + 0.3 * k)
mix.add(buzz(0.7), O + SIGN_ON, 0.15)
mix.add(ting(1568, 1.0), O + SIGN_ON + 0.05, 0.12)
# queue: snoring
for k in range(3):
    tt = tt_(1.2)
    sn = filt(white(len(tt)), "bandpass", [80, 500]) * np.sin(np.pi * tt / 1.2) ** 2 * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 30 * tt)))
    mix.add(sn, O + 17.6 + k * 1.2, 0.12, pan=0.3 - 0.3 * k)
# phone
mix.add(whoosh(0.35, 1500, 6000), O + LOAD - 0.2, 0.25)
mix.add(ting(2093, 0.8), O + LOAD + 0.05, 0.15)
# seller
mix.add(murmur(3.2), O + 24.6, 0.06)
mix.add(breath(1.0, inhale=False), O + SIGH, 0.4)
# arrivals
mix.add(murmur(6.0, 170), O + 27.8, 0.14)
mix.add(whoosh(0.7, 300, 2500), O + DOORS_OPEN, 0.3)
for k in range(12):
    mix.add(step(), O + 28.5 + k * 0.23, 0.1, pan=-0.4 + 0.07 * k)
mix.add(thump(80, 40, 0.5, decay=9, click=0.8), O + KISS[1], 0.45)
mix.add(smack(), O + KISS[2], 0.4)
# tech store
for k, at in enumerate(TAGS):
    mix.add(fall_blip(1000 - 80 * k), O + at, 0.3, pan=-0.3 + 0.3 * k)
mix.add(kaching(), O + CASH, 0.35)
for k in range(9):
    mix.add(step(), O + 37.0 + k * 0.33, 0.12)
# road at night: the roller rumbles left to right, a pop on each hole
mix.add(rumble(ROLLER[1] - ROLLER[0] + 0.4), O + 40.0, 0.4)
for k, at in enumerate(HOLES):
    pan = -0.7 + 1.4 * k / (len(HOLES) - 1)
    mix.add(thump(140, 70, 0.3, decay=14, click=0.5), O + at, 0.2, pan=pan)
crick = filt(white(int(8 * SR)), "bandpass", [4000, 5000]) * (np.sin(2 * np.pi * 14 * tt_(8)) > 0.6) * (np.sin(2 * np.pi * 0.7 * tt_(8)) > 0)
mix.add(crick, O + 40.0, 0.03)
# school
mix.add(buzz(0.5, 150), O + BUZZ, 0.2, pan=0.2)
mix.add(buzz(0.5, 150), O + BUZZ + 0.65, 0.2, pan=0.2)
mix.add(clank(0.25, 900) * 0.4, O + DROP[1], 0.35)
mix.add(thump(200, 120, 0.2, decay=20, click=1.0) * 0.6, O + DROP[1], 0.35)
mix.add(clank(0.2, 1100) * 0.3, O + DROP[1] + 0.17, 0.2)
# embassy
mix.add(murmur(4.2, 160), O + 52.6, 0.14)
# rate again
mix.add(murmur(4.2), O + 56.8, 0.1)
n_cl = 18
for k in range(n_cl):
    at = COUNT2[0] + (COUNT2[1] - COUNT2[0]) * (k / n_cl) ** 0.7
    mix.add(click(0.03, 2400 - 50 * k), O + at, 0.12, pan=0.2)
mix.add(thump(55, 28, 1.4, decay=2.5, click=0.6), O + COUNT2[1], 0.5)
mix.add(ting(1318, 1.2), O + COUNT2[1], 0.15)
# family: a clock and spoons, otherwise quiet
for k in range(int((68.6 - 61.0) / 1.0)):
    mix.add(tick(), O + 61.2 + k * 1.0, 0.05)
for at in CLINKS:
    mix.add(ting(3520, 0.6), O + at, 0.12, pan=0.2)
# uncle
mix.add(cloth(0.45), O + PAPER, 0.35)
mix.add(thump(75, 38, 0.6, decay=8, click=1.2), O + FIST, 0.6)
for k in range(5):
    mix.add(ting(2400 + 400 * k, 0.4), O + FIST + 0.03 + 0.04 * k, 0.07, pan=-0.3 + 0.15 * k)
mix.add(murmur(2.4, 220), O + FIST + 0.4, 0.1)

# ---------------------------------------------------------------- music: a light happy bed until the family scene
t = mix.t - O
bpm = np.interp(t, [0, 30, 60], [112, 118, 124])
beat = np.cumsum(bpm / 60 / SR)
bass_notes = [65.4, 87.3, 98.0, 65.4]  # C2 F2 G2 C2
bar = (beat // 4).astype(int) % 4
f = np.array(bass_notes)[bar]
ph_b = beat % 1
bass = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-ph_b * 5) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR) * np.exp(-ph_b * 8)
off = (beat + 0.5) % 1
hat = filt(white(mix.n), "highpass", 7000) * np.exp(-off * 40) * 0.25
pl_notes = np.array([523.3, 659.3, 784.0, 659.3, 698.5, 880.0, 784.0, 659.3])
eighth = (beat * 2).astype(int) % 8
ph8 = (beat * 2) % 1
pluck = np.sin(2 * np.pi * np.cumsum(pl_notes[eighth]) / SR) * np.exp(-ph8 * 9) * 0.25
bed = bass * 0.5 + hat + pluck * np.interp(t, [0, 4, 8], [0.3, 0.7, 1.0])
level = np.interp(t, [0, 0.4, 40.0, 41.0, 47.5, 48.2, 60.2, 61.0], [0.0, 0.7, 0.85, 0.45, 0.45, 0.85, 0.85, 0.0])
duck = np.ones(mix.n)
for a, b, at, _ in PIECES:
    duck -= 0.5 * mix.env(O + at - 0.1, O + at + (b - a) + 0.15, 0.12, 0.3)
duck = np.clip(duck, 0.4, 1)
bed = filt(bed, "lowpass", 5000) * level * duck * 0.2
mix.l += bed
mix.r += bed

# ---------------------------------------------------------------- write
final = mix.write("dvizh-end")

cues = {
    "duration": DUR,
    "shots": [[n, s] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "fireworks": FIREWORKS, "mug": list(MUG), "count": list(COUNT), "photo": PHOTO, "flips": FLIPS, "ply": PLY,
    "signOn": SIGN_ON, "load": LOAD, "sigh": SIGH, "doorsOpen": DOORS_OPEN, "kiss": list(KISS), "tags": TAGS,
    "cash": CASH, "roller": list(ROLLER), "holesX": HOLES_X, "buzz": BUZZ, "drop": list(DROP),
    "count2": list(COUNT2), "clinks": CLINKS, "paper": PAPER, "fist": FIST,
}
(ROOT / "src/dvizh").mkdir(exist_ok=True)
(ROOT / "src/dvizh/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame) and src/dvizh/cues.json")
