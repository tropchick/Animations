"""Soundtrack and timing cues for «Что если шаурма подорожает в 5 раз?» (low poly, Russian VO, causal chain).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant» (flow 66nNylMXrJlbLMN2nwC7):
audio/voice/shawa-vo.mp3, word times audio/voice/shawa-words.json (faster-whisper medium).
All other sounds are synthesized here.

Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30); the track gets 1/30 s in front.

Sync map (story time of the on-screen event <-> sound):
  ONE        the «1» is drawn in front of 250 on the tag   <-> marker squeak
  JAW        the guy's jaw drops                           <-> low hit + sad horn
  BITES      each student bites                            <-> crunch
  FLIPS      menu prices flip up                           <-> split-flap clacks
  CART       empty trolley rolls through the shop          <-> rattle
  TUG        two people tear the last lavash               <-> stretch + rip
  TAGS       each price tag doubles                        <-> pop + rising blip
  KNOCKS     knuckles on the door                          <-> three knocks
  HATCH      the hatch slides open                         <-> metal slide
  DOOR       the door opens on the spit                    <-> creak + sizzle
  WALLET     the wallet opens                              <-> leather flap + jingle
  STACK      each shawarma lands on the pile               <-> soft thud
  HORN       the yacht horn                                <-> horn
  REWIND     tape rewinds to day 1                         <-> rewind chirps, music cut
  WRITE      the seller writes 250                         <-> marker squeaks
  SLIP       the marker slips and leaves the «1»           <-> sharp squeak
  COPY       the neighbours retag to 1250                  <-> squeak each
  SHRUG / GLASSES                                          <-> cloth + click
"""

import json

import numpy as np

from slime_lib import ROOT, SR, Mix, brown, click, drone, fade_edges, filt, load, thump, ting, tt_, white

OFF = 1 / 30

SHOTS = [
    ("stall", 0.0),
    ("bench", 4.5),
    ("queue", 8.0),
    ("menu", 13.0),
    ("windows", 16.8),
    ("shop", 19.4),
    ("tags", 22.9),
    ("door", 28.4),
    ("wallet", 34.3),
    ("phone", 36.4),
    ("yacht", 39.4),
    ("rewind", 42.4),
    ("marker", 43.2),
    ("copy", 48.6),
    ("deck", 52.0),
]
DUR = 58.6

ONE = (1.95, 2.35)
JAW = 3.38
BITES = [5.25, 5.95, 6.65, 7.35]
FLIPS = [15.4, 15.62, 15.84, 16.06]
CART = 19.55
TUG = (20.9, 22.2)
RIP = 22.25
TAGS = [23.15, 25.0, 25.95, 27.2]
KNOCKS = [29.0, 29.3, 29.6]
HATCH = 32.1
BUBBLE1 = 32.35
BUBBLE2 = 33.0
DOOR = 33.6
WALLET = 34.55
STACK = [36.9, 37.15, 37.4, 37.65, 37.9, 38.15, 38.4, 38.65]
HORN = 39.75
WRITE = (43.7, 45.7)
SLIP = 47.0
COPY = [49.6, 50.5, 51.3]
LOOK = 53.6
TO_CAM = 54.6
SHRUG = 55.5
GLASSES = 56.6

# ---------------------------------------------------------------- the voice
VO = load(ROOT / "audio/voice/shawa-vo.mp3")
WH = json.loads((ROOT / "audio/voice/shawa-words.json").read_text())["vo"]
# whisper glued the silence before «Во» onto it: the word really starts at 28.45
for w in WH:
    if w[2] == "Во":
        w[0] = 28.45
# take (start, end), where it goes on the timeline, the caption text
PIECES = [
    (0.00, 3.80, 0.30, "Сегодня вся шаурма в стране подорожала в пять раз."),
    (4.44, 7.44, 4.70, "Студенты скидываются вчетвером на одну шаурму."),
    (7.92, 10.14, 8.20, "Голодные люди уходят в бургерные."),
    (10.56, 12.44, 10.84, "Очереди — на два квартала."),
    (13.02, 16.30, 13.20, "Бургерные не справляются и тоже поднимают цены."),
    (16.86, 19.40, 16.90, "Вся страна начинает крутить шаурму дома."),
    (19.68, 22.52, 19.72, "Из магазинов исчезают лаваш и курица."),
    (22.98, 28.04, 23.10, "Курица дорожает, а за ней — яйца, майонез и всё, где есть курица."),
    (28.40, 31.56, 28.75, "Во дворах открываются подпольные шаурмичные."),
    (31.80, 33.14, 32.15, "Вход — по паролю."),
    (33.62, 35.42, 34.50, "Шаурма становится валютой."),
    (35.62, 38.26, 36.50, "Телефон теперь стоит 80 шаурм."),
    (38.70, 40.88, 39.60, "Шаурмисты покупают яхты."),
    (42.22, 47.18, 43.40, "А всё началось с того, что у одного шаурмиста соскользнул маркер."),
    (47.70, 50.50, 48.80, "Остальные просто подняли цены вслед за ним."),
    (51.74, 54.32, 52.40, "Через месяц он заметил ошибку."),
    (54.96, 56.80, 55.40, "Но исправлять не стал."),
]
GROUPS = [[k] for k in range(len(PIECES))]



def edge(t, d, thr=0.004, quiet=0.06):
    """From t, step in direction d (−1 back, +1 forward) until there is `quiet` seconds of silence; keep 30 ms of it."""
    w = int(0.01 * SR)
    k = 0
    run = 0
    while k < 60:  # never more than 0.6 s
        c = t + d * k * 0.01
        x = VO[max(0, int(c * SR) - (w if d < 0 else 0)): max(0, int(c * SR) + (0 if d < 0 else w))]
        if len(x) == 0:
            return max(0.0, c)
        run = run + 1 if np.sqrt((x ** 2).mean()) < thr else 0
        if run * 0.01 >= quiet:
            return max(0.0, c - d * (quiet - 0.03))
        k += 1
    return max(0.0, t + d * 0.6)


mix = Mix(DUR + OFF + 0.6)
O = OFF
voice = np.zeros(mix.n)
words = []  # [start, end, token, piece]
for k, (a, b, at, text) in enumerate(PIECES):
    # whisper puts word starts a little late: walk back to real silence so no word loses its start
    a0, b0 = edge(a, -1), edge(b, 1)
    seg = fade_edges(VO[int(a0 * SR): int(b0 * SR)], 10)
    i = int((O + at - (a - a0)) * SR)
    voice[i: i + len(seg)] += seg[: mix.n - i]
    toks = [t for t in text.split(" ") if t != "—"]
    ws = [w for w in WH if a - 0.1 <= w[0] < b - 0.15]
    starts = [max(at, at + w[0] - a) for w in ws]
    if len(starts) != len(toks):
        print("token mismatch in piece", k, [w[2] for w in ws], toks)
        starts = [at + (b - a) * j / len(toks) for j in range(len(toks))]
    # the dash goes with the word before it
    toks2 = text.split(" ")
    j = 0
    out = []
    for tok in toks2:
        if tok == "—":
            out[-1][2] += " —"
            continue
        out.append([starts[j], None, tok, k])
        j += 1
    for j, w in enumerate(out):
        w[1] = out[j + 1][0] if j + 1 < len(out) else at + (b - a)
        words.append([round(w[0], 3), round(w[1], 3), w[2], k])
mix.add(voice, 0, 1.0)


# ---------------------------------------------------------------- synthesized sounds
def squeak(dur=0.35, f0=2300, f1=1700, rough=0.6):
    """Felt marker on a plastic tag."""
    tt = tt_(dur)
    f = f0 + (f1 - f0) * tt / dur + 140 * np.sin(2 * np.pi * 23 * tt)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * tt) ** 2)
    s = s * 0.5 + filt(white(len(tt)), "bandpass", [1500, 6000]) * rough * 0.5
    return s * np.sin(np.pi * tt / dur) ** 0.6


def sad_horn(notes=(311.1, 293.7, 277.2, 261.6), each=0.32):
    out = []
    for k, f in enumerate(notes):
        d = each * (2.2 if k == len(notes) - 1 else 1)
        tt = tt_(d)
        vib = 1 + (0.012 * np.sin(2 * np.pi * 6 * tt) if k == len(notes) - 1 else 0)
        ph = 2 * np.pi * np.cumsum(f * vib) / SR
        s = sum(np.sin(ph * h) / h ** 1.2 for h in range(1, 7))
        s = filt(s, "lowpass", 1600) * np.clip(tt / 0.03, 0, 1) * np.clip((d - tt) / 0.06, 0, 1)
        out.append(s)
    return np.concatenate(out) * 0.4


def crunch(dur=0.22):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for k in range(6):
        i = int(len(tt) * k / 7)
        n = int(0.02 * SR)
        s[i: i + n] += filt(white(n), "bandpass", [1200, 7000]) * np.exp(-np.arange(n) / SR * 160)
    return s


def flap(n=6, gap=0.035):
    s = np.zeros(int((n * gap + 0.1) * SR))
    for k in range(n):
        c = click(0.03, 1800 + 200 * (k % 3))
        i = int(k * gap * SR)
        s[i: i + len(c)] += c * (0.6 + 0.4 * (k == n - 1))
    return s


def rattle(dur=1.6):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [700, 4000]) * (0.4 + 0.6 * (np.sin(2 * np.pi * 17 * tt) > 0.6))
    for k in range(10):
        c = clank(0.25, 500 + 90 * (k % 4)) * 0.3
        i = int(rng_.uniform(0, dur - 0.3) * SR)
        s[i: i + len(c)] += c
    return s * np.clip(tt / 0.1, 0, 1) * np.clip((dur - tt) / 0.4, 0, 1)


from slime_lib import clank  # noqa: E402

rng_ = np.random.default_rng(11)


def stretch(dur=1.3):
    tt = tt_(dur)
    f = 180 + 260 * tt / dur
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.2 + filt(white(len(tt)), "bandpass", [300, 2000]) * 0.5
    return filt(s, "lowpass", 2500) * (tt / dur) ** 1.5


def rip(dur=0.4):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [800, 6000]) * np.exp(-tt * 9) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 90 * tt)))


def popup(f=880):
    tt = tt_(0.25)
    fr = f * (1 + 0.8 * tt / 0.25)
    blip = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 9)
    return blip * 0.5 + thump(170, 90, 0.25, decay=20, click=0.6) * 0.5


def knock():
    return thump(120, 70, 0.35, decay=18, click=1.2)


def slide(dur=0.35):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [900, 5000]) * np.sin(np.pi * tt / dur) * 0.6
    c = click(0.05, 2500) * 0.5
    s[-len(c):] += c
    return s


def creak(dur=0.9):
    tt = tt_(dur)
    f = 300 + 120 * np.sin(np.pi * tt / dur) + 30 * np.sin(2 * np.pi * 11 * tt)
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (0.5 + 0.5 * np.sin(2 * np.pi * 29 * tt) ** 2)
    return filt(s, "bandpass", [300, 3000]) * np.sin(np.pi * tt / dur) * 0.4


def sizzle(dur=4.0):
    tt = tt_(dur)
    crack = (rng_.random(len(tt)) > 0.9993) * rng_.uniform(0.3, 1, len(tt))
    crack = np.convolve(crack, np.exp(-np.arange(200) / 30), "same")
    s = filt(white(len(tt)), "highpass", 3000) * 0.25 + filt(crack * white(len(tt)), "highpass", 1500) * 2
    return s * np.clip(tt / 0.2, 0, 1) * np.clip((dur - tt) / 0.8, 0, 1)


def jingle():
    s = np.zeros(int(1.0 * SR))
    for k in range(8):
        c = ting(3200 + 500 * (k % 4), 0.5)
        i = int((0.03 + k * 0.05 + 0.01 * np.sin(k)) * SR)
        s[i: i + len(c)] += c[: len(s) - i] * 0.25
    return s


def horn(dur=1.6):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for f, g in ((98.0, 1.0), (123.5, 0.7), (146.8, 0.5)):
        ph = 2 * np.pi * f * tt
        s += (2 * ((ph / (2 * np.pi)) % 1) - 1) * g
    s = filt(s, "lowpass", 1100, 2)
    return np.tanh(s * 1.4) * np.clip(tt / 0.08, 0, 1) * np.clip((dur - tt) / 0.25, 0, 1) * 0.6


def gull(dur=0.5, f0=1500):
    tt = tt_(dur)
    f = f0 * (1 + 0.35 * np.sin(np.pi * tt / dur)) * (1 + 0.04 * np.sin(2 * np.pi * 38 * tt))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)
    return filt(s, "bandpass", [700, 5000]) * np.sin(np.pi * tt / dur) ** 1.5 * 0.3


def waves(dur):
    tt = tt_(dur)
    s = filt(brown(len(tt)), "lowpass", 900) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.23 * tt) ** 2)
    s += filt(white(len(tt)), "bandpass", [1500, 6000]) * 0.08 * np.clip(np.sin(2 * np.pi * 0.23 * tt + 1.2), 0, 1) ** 4
    return s


def murmur(dur):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for k in range(6):
        f = 140 + 40 * k
        env = np.clip(np.sin(2 * np.pi * (2.1 + 0.37 * k) * tt + k) + 0.2 * np.sin(2 * np.pi * 7.3 * tt + k), 0, 1)
        s += filt(white(len(tt)), "bandpass", [f, f * 4.5]) * env
    return s / 6 * np.clip(tt / 0.3, 0, 1) * np.clip((dur - tt) / 0.3, 0, 1)


def rewind(dur=0.8):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [1000, 8000]) * 0.3
    for k in range(10):
        a = k * dur / 10
        d = 0.06
        i = int(a * SR)
        t2 = tt_(d)
        f = 2500 + 3000 * t2 / d
        c = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t2 / d)
        s[i: i + len(c)] += c[: len(s) - i] * 0.4
    return s * np.clip(tt / 0.05, 0, 1) * np.clip((dur - tt) / 0.08, 0, 1)


def cloth(dur=0.3):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [400, 2500]) * np.sin(np.pi * tt / dur) ** 2 * 0.5


# the hook
mix.add(murmur(4.4), O + 0.0, 0.12)
mix.add(squeak(ONE[1] - ONE[0], 2600, 1900), O + ONE[0], 0.32, pan=0.15)
mix.add(thump(55, 30, 1.4, decay=2.5, click=0.3), O + JAW, 0.45)
mix.add(sad_horn(), O + JAW + 0.05, 0.3)
for k in range(5):
    mix.add(filt(white(int(0.25 * SR)), "bandpass", [100, 900]) * np.exp(-tt_(0.25) * 20), O + 3.8 + k * 0.28, 0.06, pan=np.sin(k) * 0.6)

# students
for k, at in enumerate(BITES):
    mix.add(crunch(), O + at, 0.22 if k < 3 else 0.08, pan=-0.4 + 0.27 * k)

# queue: the street murmur
mix.add(murmur(5.0), O + 8.0, 0.2)
mix.add(filt(brown(int(5.0 * SR)), "lowpass", 400) * mix.env(0, 5.0, 0.3, 0.3)[: int(5.0 * SR)], O + 8.0, 0.08)

# menu flips
for k, at in enumerate(FLIPS):
    mix.add(flap(), O + at, 0.3, pan=-0.3 + 0.2 * k)

# windows: a hum of a whole house of spits
mix.add(sizzle(2.6) * 0.5 + filt(brown(int(2.6 * SR)), "lowpass", 300) * 0.3, O + 16.8, 0.25)
# shop
mix.add(rattle(1.6), O + CART, 0.25, pan=-0.3)
mix.add(stretch(TUG[1] - TUG[0]), O + TUG[0], 0.18)
mix.add(rip(), O + RIP, 0.35)

# tags
for k, at in enumerate(TAGS):
    mix.add(popup(660 + 110 * k), O + at, 0.3, pan=-0.3 + 0.2 * k)

# door
for at in KNOCKS:
    mix.add(knock(), O + at, 0.4)
mix.add(slide(), O + HATCH, 0.3)
mix.add(creak(), O + DOOR - 0.1, 0.25)
mix.add(sizzle(1.3), O + DOOR + 0.1, 0.25)

# wallet + stack
mix.add(cloth(0.25), O + WALLET - 0.1, 0.3)
mix.add(jingle(), O + WALLET + 0.1, 0.25)
for k, at in enumerate(STACK):
    mix.add(thump(150, 90, 0.2, decay=25, click=0.6), O + at, 0.18, pan=0.2)

# yacht
mix.add(waves(3.2), O + 39.4, 0.2)
mix.add(horn(1.5), O + HORN, 0.5)
mix.add(gull(0.45, 1500), O + 40.9, 0.15, pan=-0.5)
mix.add(gull(0.35, 1700), O + 41.4, 0.12, pan=0.4)

# rewind
mix.add(rewind(0.8), O + 42.4, 0.35)

# flashback: the seller writes, the marker slips
for k in range(3):
    a = WRITE[0] + k * (WRITE[1] - WRITE[0]) / 3
    mix.add(squeak(0.45, 2300 - 100 * k, 1800), O + a, 0.16, pan=0.1)
mix.add(squeak(0.18, 3000, 2000, rough=0.3), O + SLIP, 0.35, pan=0.1)
mix.add(murmur(9.0), O + 43.2, 0.06)
for k, at in enumerate(COPY):
    mix.add(squeak(0.3, 2500 + 150 * k, 1900), O + at, 0.18, pan=-0.4 + 0.4 * k)

# the deck: waves, gulls, then quiet
mix.add(waves(DUR - 52.0 + 0.5), O + 52.0, 0.22)
for k, (at, f, p) in enumerate([(52.6, 1500, -0.5), (53.0, 1650, -0.4), (54.9, 1450, 0.5), (56.9, 1600, 0.3), (57.3, 1750, 0.35), (58.0, 1500, -0.3)]):
    mix.add(gull(0.4 + 0.1 * (k % 2), f), O + at, 0.13, pan=p)
mix.add(cloth(0.3), O + SHRUG, 0.25)
mix.add(click(0.04, 2200), O + GLASSES + 0.25, 0.25)

# ---------------------------------------------------------------- music: light bouncy bed, faster towards the yachts, cut at the rewind
t = mix.t - O
bpm = np.interp(t, [0, 16, 39.4, 42.4], [104, 112, 128, 132])
beat = np.cumsum(bpm / 60 / SR)  # beats
bass_notes = [55.0, 55.0, 65.4, 49.0]  # A1 A1 C2 G1
bar = (beat // 4).astype(int) % 4
f = np.array(bass_notes)[bar]
ph_b = beat % 1
bass = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-ph_b * 5) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR) * np.exp(-ph_b * 8)
off = (beat + 0.5) % 1
hat = filt(white(mix.n), "highpass", 7000) * np.exp(-off * 40) * 0.25
pl_notes = np.array([440.0, 523.3, 659.3, 523.3, 392.0, 493.9, 587.3, 493.9])
eighth = (beat * 2).astype(int) % 8
pl_f = pl_notes[eighth]
ph8 = (beat * 2) % 1
pluck = np.sin(2 * np.pi * np.cumsum(pl_f) / SR) * np.exp(-ph8 * 9) * 0.25
bed = (bass * 0.5 + hat + pluck * np.interp(t, [0, 8, 16], [0.4, 0.7, 1.0]))
level = np.interp(t, [0, 0.4, 16, 39.4, 42.35, 42.4], [0.0, 0.6, 0.75, 1.0, 1.0, 0.0])
duck = np.ones(mix.n)
for a, b, at, _ in PIECES:
    duck -= 0.5 * mix.env(O + at - 0.1, O + at + (b - a) + 0.15, 0.12, 0.3)
duck = np.clip(duck, 0.4, 1)
bed = filt(bed, "lowpass", 5000) * level * duck * 0.22
mix.l += bed
mix.r += bed

# ---------------------------------------------------------------- write
final = mix.write("shawa-x5")

cues = {
    "duration": DUR,
    "shots": [[n, s] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "pieces": [[at, at + (b - a)] for a, b, at, _ in PIECES],
    "one": list(ONE), "jaw": JAW, "bites": BITES, "flips": FLIPS, "cart": CART, "tug": list(TUG), "rip": RIP,
    "tags": TAGS, "knocks": KNOCKS, "hatch": HATCH, "bubble1": BUBBLE1, "bubble2": BUBBLE2, "door": DOOR,
    "wallet": WALLET, "stack": STACK, "horn": HORN, "write": list(WRITE), "slip": SLIP, "copy": COPY,
    "look": LOOK, "toCam": TO_CAM, "shrug": SHRUG, "glasses": GLASSES,
}
(ROOT / "src/shawa").mkdir(exist_ok=True)
(ROOT / "src/shawa/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame) and src/shawa/cues.json")
