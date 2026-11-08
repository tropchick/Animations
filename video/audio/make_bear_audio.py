"""Soundtrack and timing cues for «Что если она реально выбрала медведя?» (soft 3D, Russian VO, causal chain).

Voices: ONE take each, ElevenLabs Eleven v4 (flow QCf3AijlP5TzLo4de5cB): narrator VASKO (audio/voice/bear-narrator.mp3),
mom (bear-mom.mp3), podcast host (bear-host.mp3), the bear (bear-bear.mp3, pitched down a little here).
Word times: audio/voice/bear-words.json (faster-whisper). Recorded sound effects: audio/sfx/bear/*.mp3 (ElevenLabs
sound effects); anything missing there falls back to a synthesized sound. The music bed is synthesized here.

Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30); the track gets 1/30 s in front.

Sync map (story time of the on-screen event <-> sound):
  POST       Аня's comment is sent                          <-> phone ping
  REPLY      the friend's «Докажи» pops up                  <-> second ping
  STEPS      Аня's feet touch the path (walk cycle)         <-> steps on leaves
  RUSTLE     the bush starts to shake                       <-> rustle
  ROAR       the bear's mouth opens wide                    <-> roar
  THROW      the bar leaves her hand                        <-> whoosh
  CATCH      the bear's jaws close on the bar               <-> chomp
  SIT        his bottom hits the ground                     <-> thump
  COUNT      the view counter rolls                         <-> ticks, ding at the end
  LIFT       the bear swings the backpack onto his back     <-> thump
  SUBS       the subscriber counter rolls                   <-> ticks, ding at the end
  RIP        the parcel tears open                          <-> rip
  SLIDE      the contract slides over the table             <-> paper slide
  STAMP      the inky paw hits the contract                 <-> stamp thump
  SACK       the money sack lands on the table              <-> thud + coins
  HAMMER     each hammer hit                                <-> knock
  LIGHTS     the garland lights up                          <-> tink
  POINT      the paw points at the «3 КОМНАТЫ» frame        <-> soft whoosh
  LADLE      the food lands in his plate                    <-> plop + clink
  FLASHES    each camera flash at the autographs           <-> shutter
  BITE       Аня bites the last bar                         <-> crunch
"""

import json
import subprocess
from pathlib import Path

import numpy as np

from slime_lib import ROOT, SR, FPS, Mix, brown, click, fade_edges, filt, load, step, thump, ting, tt_, white

OFF = 1 / 30
SFX = ROOT / "audio/sfx/bear"

SHOTS = [
    ("phone", 0.0),
    ("path", 6.6),
    ("rise", 11.0),
    ("throw", 15.0),
    ("wrapper", 17.75),
    ("sit", 18.75),
    ("views", 22.0),
    ("carry", 26.6),
    ("dance", 29.6),
    ("unbox", 31.6),
    ("contract", 33.6),
    ("build", 39.3),
    ("den", 41.5),
    ("dinner", 43.9),
    ("sign", 46.35),
    ("ladle", 47.25),
    ("crowd", 49.8),
    ("jaw", 53.75),
    ("star", 55.3),
    ("pass", 57.5),
    ("podcast", 60.6),
    ("lean", 64.1),
    ("freeze", 70.95),
    ("answer", 73.35),
    ("end", 76.1),
]
DUR = 81.4

# ---------------------------------------------------------------- the voice
NAR = load(ROOT / "audio/voice/bear-narrator.mp3")
MOM = load(ROOT / "audio/voice/bear-mom.mp3")
HOST = load(ROOT / "audio/voice/bear-host.mp3")


def pitch_down(path, k=0.9):
    """Lower the pitch by the factor k and keep the length (asetrate + atempo)."""
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-af", f"asetrate={int(SR * k)},aresample={SR},atempo={1 / k:.5f}",
         "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float64) / 32768


BEAR = pitch_down(ROOT / "audio/voice/bear-bear.mp3", 0.9)
WH = json.loads((ROOT / "audio/voice/bear-words.json").read_text())

# take, (start, end) in the take, where it goes on the timeline, the caption text, who speaks
PIECES = [
    ("narrator", 0.00, 3.22, 0.25, "Аня написала в комментах, что выбрала бы медведя.", "n"),
    ("narrator", 3.72, 5.76, 3.75, "Подруга ответила: «Докажи».", "n"),
    ("narrator", 6.47, 10.57, 6.75, "Через четыре часа она уже стояла в лесу с включённой камерой.", "n"),
    ("narrator", 11.62, 13.21, 11.2, "И медведь пришёл.", "n"),
    ("narrator", 13.80, 16.51, 15.1, "В панике она кинула ему протеиновый батончик.", "n"),
    ("narrator", 16.78, 17.35, 18.0, "Медовый.", "n"),
    ("narrator", 17.74, 20.46, 18.9, "Медведь сел и протянул лапу за вторым.", "n"),
    ("narrator", 20.86, 22.32, 22.1, "Камера всё это сняла.", "n"),
    ("narrator", 22.64, 25.27, 23.75, "К утру у ролика три миллиона просмотров.", "n"),
    ("narrator", 25.63, 28.40, 26.75, "Аня вернулась с полным рюкзаком батончиков.", "n"),
    ("narrator", 28.69, 32.22, 29.7, "Через неделю у медведя десять миллионов подписчиков.", "n"),
    ("narrator", 32.54, 34.75, 33.75, "Медовая фабрика предлагает рекламу.", "n"),
    ("narrator", 35.00, 37.54, 36.2, "Медведь подписывает контракт лапой.", "n"),
    ("narrator", 37.90, 39.92, 39.45, "На гонорар он строит берлогу,", "n"),
    ("narrator", 40.17, 42.15, 41.65, "трёхкомнатную, с видом на речку.", "n"),
    ("mom", 0.00, 1.84, 44.3, "А жильё у него своё?", "mom"),
    ("narrator", 42.86, 44.27, 47.9, "Мама одобрила.", "n"),
    ("narrator", 45.28, 49.98, 50.1, "А потом в лес приехали все, кто тоже выбрал медведя.", "n"),
    ("narrator", 50.53, 52.39, 55.45, "Медведь стал звездой.", "n"),
    ("narrator", 52.77, 55.40, 57.6, "На Аню у него больше не было времени.", "n"),
    ("narrator", 55.96, 59.11, 60.8, "Его позвали на самый большой подкаст страны.", "n"),
    ("narrator", 59.48, 61.76, 64.2, "И задали тот самый вопрос.", "n"),
    ("host", 0.00, 1.73, 66.8, "С кем бы ты остался в лесу?", "host"),
    ("host", 2.11, 3.89, 66.8 + 2.11, "С девушкой или с мужчиной?", "host"),
    ("bear", 0.00, 1.20, 74.4, "С мёдом.", "bear"),
]
TAKES = {"narrator": NAR, "mom": MOM, "host": HOST, "bear": BEAR}
GAIN = {"narrator": 1.0, "mom": 1.05, "host": 1.0, "bear": 1.25}


def edge(t, d, x, thr=0.004, quiet=0.06):
    """From t, step in direction d (−1 back, +1 forward) until there is `quiet` seconds of silence; keep 30 ms of it."""
    w = int(0.01 * SR)
    k = 0
    run = 0
    while k < 40:
        c = t + d * k * 0.01
        seg = x[max(0, int(c * SR) - (w if d < 0 else 0)): max(0, int(c * SR) + (0 if d < 0 else w))]
        if len(seg) == 0:
            return max(0.0, c)
        run = run + 1 if np.sqrt((seg ** 2).mean()) < thr else 0
        if run * 0.01 >= quiet:
            return max(0.0, c - d * (quiet - 0.03))
        k += 1
    return max(0.0, t + d * 0.4)


mix = Mix(DUR + OFF + 0.6)
O = OFF
voice = np.zeros(mix.n)
words = []  # [start, end, token, group, speaker]
groups = []
for k, (take, a, b, at, text, who) in enumerate(PIECES):
    x = TAKES[take]
    a0, b0 = edge(a, -1, x), edge(b, 1, x)
    seg = fade_edges(x[int(a0 * SR): int(b0 * SR)], 10) * GAIN[take]
    i = int((O + at - (a - a0)) * SR)
    voice[i: i + len(seg)] += seg[: mix.n - i]
    toks = text.split(" ")
    ws = [w for w in WH[take] if w[1] > a + 0.05 and w[0] < b - 0.1 and any(ch.isalnum() for ch in w[2])]
    starts = [max(at, at + w[0] - a) for w in ws]
    if len(starts) != len(toks):
        print("token mismatch in piece", k, [w[2] for w in ws], toks)
        starts = [at + (b - a) * j / len(toks) for j in range(len(toks))]
    for j, tok in enumerate(toks):
        end = starts[j + 1] if j + 1 < len(toks) else at + (b - a)
        words.append([round(starts[j], 3), round(end, 3), tok, k, who])
    groups.append(k)
mix.add(voice, 0, 1.0)


# mouth opening per frame for the people who speak on screen
def lips(x, a, b, at):
    seg = x[int(a * SR): int(b * SR)]
    hop = SR // FPS
    n = len(seg) // hop + 1
    e = np.array([np.sqrt(np.mean(seg[k * hop:(k + 1) * hop] ** 2)) if k * hop < len(seg) else 0 for k in range(n)])
    e = e / (np.percentile(e[e > 0], 95) + 1e-9)
    e = np.clip((e - 0.08) / 0.7, 0, 1)
    sm = np.convolve(e, [0.25, 0.5, 0.25], "same")
    return {"at": at, "vals": [round(float(q), 3) for q in sm]}


LIPS = {
    "mom": lips(MOM, 0.0, 1.9, 44.3),
    "host": lips(HOST, 0.0, 3.95, 66.8),
    "bear": lips(BEAR, 0.0, 1.25, 74.4),
}

# ---------------------------------------------------------------- event cues (story time)
TYPE = (0.4, 2.35)            # Аня types her comment
POST = 2.55                    # the comment is sent
REPLY = 4.85                   # «Докажи» pops up
JUMP = 5.95                    # she jumps up from the sofa
WALK = (6.6, 11.0)             # walking in the forest
STEP_T = 0.43                  # one step every 0.43 s
RUSTLE = 10.05
RISE = (11.5, 12.55)           # the bear stands up out of the bush
ROAR = (12.95, 14.35)
GRAB = 15.35                   # her hand in the backpack
THROW = 16.15
CATCH = 16.95
CHEW = (17.0, 18.7)
WRAP_LAND = 18.45
SIT = 19.42
PAW = 20.2
COUNT = (23.9, 25.75)
LIFT = 27.85
MUSIC0 = 22.0
BPM = 118.0
SUBS = (29.85, 32.45)
RIP = 32.2
SLIDE = (34.55, 35.25)
DIP = 36.85
STAMP = 38.3
SACK = 38.95
HAMMER = [39.55, 39.95, 40.35, 40.75, 41.15]
LIGHTS = 42.05
POINT = 46.55
LADLE = 47.75
JAW = 54.15
FLASHES = [55.45, 55.7, 55.85, 56.2, 56.55, 56.7, 57.05, 57.3, 57.75, 58.1, 58.4, 58.9, 59.3]
LEAN = (73.45, 74.35)
UNWRAP = (76.7, 77.55)
BITE = 78.05
TITLE = 78.6

# ---------------------------------------------------------------- recorded or synthesized sounds
rng_ = np.random.default_rng(11)


def rec(name, dur=None):
    p = SFX / f"{name}.mp3"
    if not p.exists():
        return None
    x = load(p)
    pk = np.abs(x).max()
    if 0 < pk < 0.1:
        # a few takes came out very quiet (a real hit, just low): bring them up to a normal level
        x = x * (0.8 / pk)
    if dur is not None:
        x = x[: int(dur * SR)]
    return fade_edges(x, 30)


def whoosh(dur=0.6, f0=600, f1=3000):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [f0, f1]) * np.sin(np.pi * tt / dur) ** 2


def ping():
    s = ting(1568, 0.7) * 0.6
    t2 = ting(2093, 0.7) * 0.5
    i = int(0.09 * SR)
    s[i:] += t2[: len(s) - i]
    return s


def leaves(dur, dens=1.0):
    tt = tt_(dur)
    crackle = (rng_.random(len(tt)) > 1 - 0.004 * dens) * rng_.uniform(0.2, 1, len(tt))
    c = np.convolve(crackle, np.exp(-np.arange(200) / 30), "same")
    return filt(white(len(tt)) * c, "bandpass", [800, 7000]) * 2.5


def rustle(dur):
    tt = tt_(dur)
    env = np.clip(tt / 0.3, 0, 1) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 3.1 * tt)))
    return (leaves(dur, 3) + filt(white(len(tt)), "bandpass", [300, 3000]) * 0.4) * env


def roar(dur=1.6):
    tt = tt_(dur)
    f = 95 + 40 * np.sin(np.pi * tt / dur) - 20 * tt
    ph = 2 * np.pi * np.cumsum(f) / SR
    src = np.sign(np.sin(ph)) * 0.6 + np.sin(2 * ph) * 0.4 + filt(white(len(tt)), "lowpass", 1800) * 0.9
    s = filt(src, "bandpass", [70, 2200])
    env = np.clip(tt / 0.12, 0, 1) * np.clip((dur - tt) / 0.5, 0, 1)
    return np.tanh(s * 2) * env


def chomp():
    s = thump(160, 90, 0.18, decay=28, click=1.6)
    return s + filt(white(len(s)), "bandpass", [1500, 6000]) * np.exp(-tt_(0.18) * 40) * 0.5


def crunch(dur=0.35):
    tt = tt_(dur)
    grains = (rng_.random(len(tt)) > 0.992) * rng_.uniform(0.3, 1, len(tt))
    g = np.convolve(grains, np.exp(-np.arange(120) / 12), "same")
    return filt(white(len(tt)) * g, "bandpass", [1200, 8000]) * 3 * np.exp(-tt * 6)


def crinkle(dur=0.8):
    tt = tt_(dur)
    grains = (rng_.random(len(tt)) > 0.997) * rng_.uniform(0.2, 1, len(tt))
    g = np.convolve(grains, np.exp(-np.arange(300) / 40), "same")
    return filt(white(len(tt)) * g, "bandpass", [2500, 11000]) * 2.2 * np.sin(np.pi * tt / dur) ** 0.5


def chewing(dur):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    k = 0
    while k * 0.24 < dur - 0.1:
        c = crunch(0.16) * 0.6
        th = thump(120, 80, 0.16, decay=30, click=0.3) * 0.4
        c[: len(th)] += th[: len(c)]
        i = int(k * 0.24 * SR)
        s[i: i + len(c)] += c[: len(s) - i]
        k += 1
    return s


def zip_(dur=0.45):
    tt = tt_(dur)
    teeth = (np.sin(2 * np.pi * (60 + 140 * tt / dur) * tt) > 0.7).astype(float)
    return filt(white(len(tt)) * teeth, "bandpass", [1500, 7000]) * 0.8 * np.sin(np.pi * tt / dur)


def paper(dur=0.6):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [1500, 6000]) * np.sin(np.pi * tt / dur) ** 2 * 0.6


def coins(dur=0.9):
    s = np.zeros(int(dur * SR))
    for k in range(14):
        c = ting(3000 + rng_.uniform(0, 3500), 0.35) * rng_.uniform(0.15, 0.5)
        i = int(rng_.uniform(0, 0.4) * SR)
        s[i: i + len(c)] += c[: len(s) - i]
    return s


def knock():
    s = thump(220, 140, 0.25, decay=22, click=1.8)
    return s + filt(white(len(s)), "bandpass", [600, 3500]) * np.exp(-tt_(0.25) * 35) * 0.6


def shutter():
    s = np.zeros(int(0.25 * SR))
    for at in (0.0, 0.06):
        c = click(0.04, 2400)
        i = int(at * SR)
        s[i: i + len(c)] += c
    return s


def murmur(dur, base=220):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for k in range(8):
        f = base + 45 * k
        env = np.clip(np.sin(2 * np.pi * (1.7 + 0.31 * k) * tt + k) + 0.25 * np.sin(2 * np.pi * 6.1 * tt + k), 0, 1)
        s += filt(white(len(tt)), "bandpass", [f, f * 4]) * env
    return s / 8 * np.clip(tt / 0.4, 0, 1) * np.clip((dur - tt) / 0.4, 0, 1)


def birds(dur, dens=1.0):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    k = 0
    t = 0.3
    while t < dur - 0.5:
        n = int(rng_.integers(2, 6))
        f0 = rng_.uniform(2600, 4800)
        for j in range(n):
            ct = tt_(0.09)
            fr = f0 * (1 + 0.25 * np.sin(np.pi * ct / 0.09)) * (1 - 0.1 * j)
            c = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.sin(np.pi * ct / 0.09) ** 2
            i = int((t + j * 0.11) * SR)
            s[i: i + len(c)] += c[: len(s) - i] * rng_.uniform(0.4, 1)
        t += rng_.uniform(0.6, 1.8) / dens
        k += 1
    return filt(s, "highpass", 1500) * 0.5


def forest(dur):
    """A soft forest bed: wind in the leaves plus birds (the recorded ambience if there is one)."""
    r = rec("forest")
    if r is not None and len(r) > SR:
        # loop the recording with half-second crossfades so the seam is not heard
        n = int(dur * SR)
        xf = int(0.5 * SR)
        hop = len(r) - xf
        s = np.zeros(n + len(r))
        up = np.linspace(0, 1, xf)
        k = 0
        while k * hop < n:
            seg = r.copy()
            if k > 0:
                seg[:xf] *= up
            seg[-xf:] *= up[::-1]
            i = k * hop
            s[i: i + len(seg)] += seg
            k += 1
        return s[:n]
    tt = tt_(dur)
    wind = filt(brown(len(tt)), "bandpass", [200, 1200]) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * tt))
    return wind * 0.25 + birds(dur)


def place(sig, at, gain, pan=0.0, fi=0.0, fo=0.0):
    if sig is None:
        return
    s = sig.copy()
    n = len(s)
    if fi > 0:
        s[: int(fi * SR)] *= np.linspace(0, 1, min(n, int(fi * SR)))
    if fo > 0:
        m = min(n, int(fo * SR))
        s[n - m:] *= np.linspace(1, 0, m)
    mix.add(s, O + at, gain, pan)


def pick(name, synth, dur=None):
    r = rec(name, dur)
    return r if r is not None else synth


# --- the phone hook: typing, two pings
for k in range(16):
    at = TYPE[0] + (TYPE[1] - TYPE[0]) * k / 16 + rng_.uniform(-0.02, 0.02)
    mix.add(click(0.025, 3800) * 0.5, O + at, 0.18, pan=0.1)
mix.add(ping(), O + POST, 0.32)
mix.add(ping(), O + REPLY, 0.4)
mix.add(whoosh(0.35, 400, 2500), O + JUMP - 0.1, 0.2)
# room tone
tt0 = tt_(6.6)
mix.add(filt(brown(len(tt0)), "lowpass", 300) * 0.06, O + 0.0, 1.0)

# --- forest: steps, bushes, roar
place(forest(15.5), 6.6, 0.55, fi=0.2, fo=0.3)
for k in range(int((WALK[1] - WALK[0] - 0.3) / STEP_T)):
    at = WALK[0] + 0.2 + k * STEP_T
    mix.add(step(0.25) * 0.5 + leaves(0.25, 6) * 0.7, O + at, 0.22, pan=0.15 * (1 if k % 2 else -1))
place(pick("rustle", rustle(1.9)), RUSTLE, 0.55, pan=-0.25, fo=0.3)
place(pick("rustle", rustle(1.2)), RISE[0], 0.55, pan=-0.2, fo=0.3)
place(pick("roar", roar(1.6)), ROAR[0] - 0.05, 0.95)
place(whoosh(1.2, 300, 4000) + leaves(1.2, 8) * 0.6, ROAR[0] + 0.1, 0.35)
place(thump(55, 30, 1.0, decay=4, click=0.3), ROAR[0], 0.35)
# throw and catch
place(pick("zip", zip_(0.45)), GRAB, 0.35, pan=0.2)
place(whoosh(0.5, 900, 5000), THROW - 0.1, 0.35)
place(chomp(), CATCH, 0.7)
place(pick("chew", chewing(CHEW[1] - CHEW[0]), CHEW[1] - CHEW[0]), CHEW[0] + 0.08, 0.5)
place(pick("crinkle", crinkle(0.8), 1.0), WRAP_LAND - 0.7, 0.35)
place(thump(70, 40, 0.6, decay=8, click=0.6), SIT, 0.55)
place(leaves(0.5, 10), SIT, 0.25)
place(whoosh(0.4, 500, 2500), PAW - 0.15, 0.12)

# --- day 2: views counter
ticks = 24
for k in range(ticks):
    at = COUNT[0] + (COUNT[1] - COUNT[0]) * (k / ticks) ** 0.8
    mix.add(click(0.02, 3200 + 30 * k) * 0.6, O + at, 0.14)
for k, at in enumerate([24.2, 24.6, 24.85, 25.1, 25.3, 25.45, 25.6]):
    mix.add(ting(1760 + 120 * (k % 3), 0.4) * 0.5, O + at, 0.1, pan=-0.3 + 0.1 * k)
mix.add(ping(), O + COUNT[1], 0.32)

# --- day 7: backpack, dance, parcel
place(forest(7.0), 26.6, 0.35, fi=0.2, fo=0.3)
for k in range(6):
    mix.add(step(0.25) * 0.5 + leaves(0.25, 6) * 0.6, O + 26.8 + k * 0.45, 0.16)
place(thump(80, 45, 0.6, decay=9, click=0.8), LIFT, 0.5)
ticks = 26
for k in range(ticks):
    at = SUBS[0] + (SUBS[1] - SUBS[0]) * (k / ticks) ** 0.8
    mix.add(click(0.02, 3400 + 25 * k) * 0.6, O + at, 0.12)
mix.add(ping(), O + SUBS[1], 0.3)
# the recorded rip has ~0.2 s of lead-in before the tear: start it early so the tear lands on the parcel opening
place(pick("rip", paper(0.5), 0.8), RIP - 0.3, 0.45)

# --- day 14: contract
tt1 = tt_(5.7)
mix.add(filt(brown(len(tt1)), "lowpass", 400) * 0.05, O + 33.6, 1.0)  # office air
place(paper(0.7), SLIDE[0], 0.4, pan=-0.2)
place(filt(white(int(0.3 * SR)), "lowpass", 900) * np.exp(-tt_(0.3) * 12) * 0.5, DIP, 0.35)
place(pick("stamp", thump(90, 50, 0.4, decay=14, click=1.4)), STAMP, 0.8)
place(thump(65, 35, 0.6, decay=9, click=1.0), SACK, 0.6)
place(pick("coins", coins(0.9)), SACK + 0.02, 0.4)

# --- day 40: building, the river
place(forest(4.8), 39.3, 0.4, fi=0.2, fo=0.2)
for at in HAMMER:
    place(pick("hammer", knock(), 0.5), at, 0.5, pan=0.15)
river = filt(white(int(3.2 * SR)), "bandpass", [400, 3000]) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.7 * tt_(3.2)))
place(river, 41.5, 0.08, fi=0.6, fo=0.5)
for k in range(5):
    place(ting(2637 + 300 * k, 0.6) * 0.5, LIGHTS + 0.06 * k, 0.12, pan=-0.4 + 0.2 * k)

# --- day 45: dinner
for k, at in enumerate([44.05, 45.9, 49.0]):
    place(ting(3520 - 400 * k, 0.5), at, 0.06, pan=0.2)
place(whoosh(0.35, 400, 2000), POINT - 0.15, 0.15)
place(thump(140, 90, 0.2, decay=25, click=0.4), LADLE, 0.4)
place(ting(2900, 0.5), LADLE + 0.05, 0.12)
place(pick("plop", filt(white(int(0.25 * SR)), "lowpass", 700) * np.exp(-tt_(0.25) * 18), 0.6), LADLE - 0.05, 0.35)

# --- day 50: the crowd
place(pick("crowd", murmur(5.6, 260), 5.6), 49.8, 0.5, fi=1.2, fo=0.4)
place(whoosh(4.0, 200, 1200), 49.8, 0.18)

# --- day 51: the star
place(pick("cheer", murmur(5.3, 300), 5.3), 55.3, 0.34, fi=0.2, fo=0.4)
for k, at in enumerate(FLASHES):
    place(shutter(), at, 0.25, pan=-0.5 + (k % 5) * 0.25)

# --- day 60: the studio
tt2 = tt_(10.3)
mix.add(filt(brown(len(tt2)), "lowpass", 220) * 0.04, O + 60.6, 1.0)
# freeze: total silence until «С мёдом» (nothing is added between 70.95 and 74.4 except the bear's line)

# --- the end: forest, birds, the last bar
place(forest(5.6), 75.9, 1.1, fi=0.6, fo=0.6)
# (the crinkle take builds for ~0.5 s: start it early so its peak lands on the tear)
place(pick("crinkle", crinkle(0.85), 1.0), UNWRAP[0] - 0.45, 0.4)
place(crunch(0.4), BITE, 0.6)
place(chewing(2.0), BITE + 0.35, 0.35)

# ---------------------------------------------------------------- music: a light happy bed from day 2 to day 51
t = mix.t - O
beat = np.clip((t - MUSIC0) * BPM / 60, 0, None)
bar = (beat // 4).astype(int)
chords = [  # C, G, Am, F: root and triad
    (65.41, [261.6, 329.6, 392.0]),
    (98.00, [246.9, 293.7, 392.0]),
    (110.0, [261.6, 329.6, 440.0]),
    (87.31, [261.6, 349.2, 440.0]),
]
ci = bar % 4
root = np.array([c[0] for c in chords])[ci]
ph_q = beat % 1
bass = (np.sin(2 * np.pi * np.cumsum(root) / SR) + 0.35 * np.sin(4 * np.pi * np.cumsum(root) / SR)) * np.exp(-ph_q * 3.5)
# ukulele-like strums on a D-D-U-U-D-U pattern (eighths 0, 2, 3, 5, 6, 7)
eighth = (beat * 2).astype(int) % 8
ph8 = (beat * 2) % 1
hit = np.isin(eighth, [0, 2, 3, 5, 6, 7]).astype(float) * np.where(np.isin(eighth, [0, 2, 6]), 1.0, 0.6)
strum = np.zeros(mix.n)
for j in range(3):
    f = np.array([c[1][j] for c in chords])[ci]
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph) + 0.12 * np.sin(4 * ph)
    delay = np.clip(ph8 - 0.02 * j, 0, None)
    strum += tone * np.exp(-delay * 7) * (ph8 >= 0.02 * j)
strum *= hit / 3
clap_ph = (beat - 1) % 2
clap = filt(white(mix.n), "bandpass", [900, 5000]) * (np.exp(-clap_ph * 30) + 0.5 * np.exp(-np.clip(clap_ph - 0.012, 0, None) * 30))
shaker = filt(white(mix.n), "highpass", 6000) * np.exp(-((beat * 4) % 1) * 18) * 0.35
mel = np.array([784.0, 659.3, 784.0, 880.0, 784.0, 659.3, 587.3, 523.3, 659.3, 587.3, 523.3, 587.3, 659.3, 0, 523.3, 0])
mi = (beat * 2).astype(int) % 16
mf = mel[mi]
ph16 = (beat * 2) % 1
glock = (np.sin(2 * np.pi * np.cumsum(mf) / SR) + 0.3 * np.sin(2 * np.pi * 2.76 * np.cumsum(mf) / SR)) * np.exp(-ph16 * 5) * (mf > 0)
glock *= np.clip((beat - 16) / 2, 0, 1)  # the bells come in after four bars
bed = bass * 0.45 + strum * 0.32 + clap * 0.16 + shaker * 0.5 + glock * 0.14
level = np.interp(t, [MUSIC0 - 0.01, MUSIC0 + 0.25, 33.4, 33.8, 39.2, 39.6, 49.6, 50.2, 60.3, 60.62],
                  [0.0, 0.9, 0.9, 0.55, 0.55, 0.9, 0.9, 1.0, 1.0, 0.0])
duck = np.ones(mix.n)
for take, a, b, at, _, _ in PIECES:
    duck -= 0.55 * mix.env(O + at - 0.1, O + at + (b - a) + 0.15, 0.12, 0.3)
duck = np.clip(duck, 0.4, 1)
bed = filt(bed, "lowpass", 6500) * level * duck * 0.2
# the dance gets the bed louder, it is his moment
bed *= 1 + 0.5 * mix.env(O + 29.7, O + 31.55, 0.2, 0.2)
mix.l += bed
mix.r += bed

# ---------------------------------------------------------------- write
final = mix.write("bear-choice")

cues = {
    "duration": DUR,
    "shots": [[n, s] for n, s in SHOTS],
    "words": words,
    "groups": groups,
    "lips": LIPS,
    "type": list(TYPE), "post": POST, "reply": REPLY, "jump": JUMP, "walk": list(WALK), "stepT": STEP_T,
    "rustle": RUSTLE, "rise": list(RISE), "roar": list(ROAR), "grab": GRAB, "throw": THROW, "catch": CATCH,
    "chew": list(CHEW), "wrapLand": WRAP_LAND, "sit": SIT, "paw": PAW, "count": list(COUNT), "lift": LIFT,
    "music0": MUSIC0, "bpm": BPM, "subs": list(SUBS), "rip": RIP, "slide": list(SLIDE), "dip": DIP, "stamp": STAMP,
    "sack": SACK, "hammer": HAMMER, "lights": LIGHTS, "point": POINT, "ladle": LADLE, "jaw": JAW, "flashes": FLASHES,
    "lean": list(LEAN), "unwrap": list(UNWRAP), "bite": BITE, "title": TITLE,
}
(ROOT / "src/bear").mkdir(exist_ok=True)
(ROOT / "src/bear/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame) and src/bear/cues.json")
