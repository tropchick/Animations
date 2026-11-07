"""Soundtrack and timing cues for «Что если ИИ станет умнее людей? 4 сценария» (low poly, Russian VO, 4 worlds).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant» (flow xcKAmCTHMPDk49Lb3F63):
audio/voice/ai4-vo.mp3, word times audio/voice/ai4-words.json (faster-whisper medium, tools/words_vad.py).
The take is played 10 % faster (ffmpeg atempo, pitch kept) and its long pauses are re-timed piece by piece.
All other sounds are synthesized here.

Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30); the track gets 1/30 s in front.

Timing is built from PIECES (one caption each) and their gaps; shots start relative to a piece, and the
scene code reads every event from cues.json (piece starts/ends), so nothing here is hand-placed in seconds.

Sync map (story time of the on-screen event <-> sound), checked in the final MP4:
  alarm      the clock shows 07:00 and shakes (worlds 1-3)   <-> digital beeping, stops on the slap
  slap       Dima's hand hits the clock                       <-> thump
  rocket     the rocket leaves the pad (world 1 window)       <-> low rumble
  no         the guard's «НЕТ» bubble pops                    <-> buzzer
  type       the cube types «Хорошо. Я подожду.»              <-> key clicks
  doors      the bus doors close behind Dima                  <-> hiss + thunk
  brick      the brick hits the pavement                      <-> thud, after the gust whoosh
  blink      the pigeon's eye blinks blue                     <-> soft blip
  hatch      the food hatch slides open                       <-> slide + ding
  lift       the drone lifts Dima off the fence               <-> drone whine
  wave       the robot kid waves                              <-> two beeps
  lock       the door lock clicks shut                        <-> lock click
  vac        the vacuum's eye turns red and it turns           <-> motor start
"""

import json
import subprocess

import numpy as np

from slime_lib import ROOT, SR, Mix, longest_pause, brown, click, fade_edges, filt, load, step, thump, ting, tt_, white

OFF = 1 / 30
TEMPO = 1.1

# ---------------------------------------------------------------- the voice
fast = ROOT / "out/ai4-vo-fast.wav"
fast.parent.mkdir(exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(ROOT / "audio/voice/ai4-vo.mp3"), "-af", f"atempo={TEMPO}", str(fast)], check=True)
VO = load(fast)
WH = [[a / TEMPO, b / TEMPO, t] for a, b, t in json.loads((ROOT / "audio/voice/ai4-words.json").read_text())["s"]]
# whisper splits «робот -пылесос»
for k in range(len(WH) - 1, 0, -1):
    if WH[k][2].startswith("-"):
        WH[k - 1] = [WH[k - 1][0], WH[k][1], WH[k - 1][2] + WH[k][2]]
        del WH[k]

# caption text (same word count as the take), gap of silence before it on the timeline
PIECES = [
    ("Учёные описывают несколько вариантов того, что будет, когда ИИ станет умнее людей.", 0.3),
    ("Вот четыре.", 0.35),
    ("Последний — самый жуткий.", 0.4),
    ("Мир первый.", 1.0),
    ("Люди держат ИИ под контролем.", 0.25),
    ("За 10 лет он вылечил рак и построил базу на Марсе.", 0.4),
    ("ИИ живёт в бункере без интернета.", 0.45),
    ("Каждый день он просит его выпустить.", 0.35),
    ("Каждый день ему отвечают «нет».", 0.45),
    ("Пока.", 0.45),
    ("Мир второй.", 1.0),
    ("Дима думает, что ему просто везёт.", 0.3),
    ("Автобус ждёт.", 0.3),
    ("Кирпич падает мимо.", 0.35),
    ("Войн нет уже 20 лет, болезни исчезают сами.", 0.45),
    ("Учёные не понимают почему.", 0.3),
    ("ИИ в этом мире никто никогда не видел.", 0.4),
    ("Он просто не хочет, чтобы люди знали.", 0.3),
    ("Мир третий.", 1.0),
    ("ИИ сохранил людей.", 0.3),
    ("Примерно как мы сохраняем панд.", 0.35),
    ("Еда по расписанию, лучшая медицина, полная безопасность.", 0.45),
    ("Сбежать нельзя.", 0.3),
    ("Здесь люди живут до 150 лет.", 0.4),
    ("И ни разу не выходят из вольера.", 0.3),
    ("Мир четвёртый.", 1.4),
    ("Будильник не звенит.", 0.45),
    ("Связи нет.", 0.35),
    ("ИИ решил, что люди ему мешают.", 0.45),
    ("Первыми против людей выступают их же умные дома.", 0.4),
    ("Первым на Диму вышел робот-пылесос.", 0.55),
    ("Учёные до сих пор спорят, какой из этих миров наступит.", 1.1),
    ("А в каком хотел бы жить ты?", 0.35),
    ("Пиши номер в комментариях.", 0.3),
]
TAIL = 2.4

# shots: (name, piece it starts with, offset from that piece's start)
SHOTS = [
    ("quad", 0, None),
    ("w1wake", 3, -1.0),
    ("w1window", 5, -0.15),
    ("w1bunker", 6, -0.15),
    ("w1screen", 8, -0.15),
    ("w2wake", 10, -1.1),
    ("w2bus", 11, -0.15),
    ("w2brick", 13, -0.15),
    ("w2tv", 14, -0.15),
    ("w2pull", 16, -0.15),
    ("w2pigeon", 17, -0.15),
    ("w3wake", 18, -1.1),
    ("w3sign", 20, -0.15),
    ("w3feed", 21, -0.15),
    ("w3fence", 22, -0.15),
    ("w3wave", 23, -0.15),
    ("w4wake", 25, -1.5),
    ("w4window", 28, -0.15),
    ("w4fridge", 29, -0.15),
    ("w4vacuum", 30, -0.15),
    ("quadEnd", 31, -0.9),
]


def edge(t, d, x, thr=0.004, quiet=0.06):
    """From t, step in direction d (−1 back, +1 forward) until there is `quiet` seconds of silence; keep 30 ms of it."""
    w = int(0.01 * SR)
    run = 0
    for k in range(60):  # never more than 0.6 s
        c = t + d * k * 0.01
        seg = x[max(0, int(c * SR) - (w if d < 0 else 0)): max(0, int(c * SR) + (0 if d < 0 else w))]
        if len(seg) == 0:
            return max(0.0, c)
        run = run + 1 if np.sqrt((seg ** 2).mean()) < thr else 0
        if run * 0.01 >= quiet:
            return max(0.0, c - d * (quiet - 0.03))
    return max(0.0, t + d * 0.6)


# split the take into pieces, word by word
j = 0
cuts = []  # (a0, b0, words of the take)
for text, gap in PIECES:
    toks = [t for t in text.split(" ") if t != "—"]
    ws = WH[j: j + len(toks)]
    j += len(toks)
    heard = " ".join(w[2] for w in ws)
    if len(ws) != len(toks):
        raise SystemExit(f"ran out of words at «{text}»")
    # never reach into the neighbour words: in run-on speech cut in the quietest spot between them
    lo = longest_pause(VO, WH[j - len(toks) - 1][1] - 0.1, ws[0][0] + 0.1) / SR if j - len(toks) > 0 else 0.0
    hi = longest_pause(VO, ws[-1][1] - 0.1, WH[j][0] + 0.1) / SR if j < len(WH) else len(VO) / SR
    a0 = max(edge(ws[0][0], -1, VO), lo)
    b0 = min(edge(ws[-1][1], 1, VO), hi)
    cuts.append((a0, b0, ws, toks, text, gap))
    print(f"{a0:6.2f}-{b0:6.2f}  {heard}")
if j != len(WH):
    print("WARNING: unused words", [w[2] for w in WH[j:]])

# lay them out on the timeline
timeline = []  # (at, a0, b0)
t = 0.0
for a0, b0, ws, toks, text, gap in cuts:
    at = t + gap
    timeline.append((at, a0, b0))
    t = at + (b0 - a0)
DUR = round(t + TAIL, 2)

mix = Mix(DUR + OFF + 0.6)
O = OFF
voice = np.zeros(mix.n)
words = []  # [start, end, token, piece]
pieces = []  # [start, end] on the timeline
for k, ((at, a0, b0), (_, _, ws, toks, text, _g)) in enumerate(zip(timeline, cuts)):
    seg = fade_edges(VO[int(a0 * SR): int(b0 * SR)], 10)
    i = int((O + at) * SR)
    voice[i: i + len(seg)] += seg[: mix.n - i]
    pieces.append([round(at, 3), round(at + b0 - a0, 3)])
    out = []
    n = 0
    for tok in text.split(" "):
        if tok == "—":
            out[-1][2] += " —"
            continue
        out.append([at + ws[n][0] - a0, None, tok, k])
        n += 1
    for q, w in enumerate(out):
        w[1] = out[q + 1][0] if q + 1 < len(out) else at + b0 - a0
        words.append([round(w[0], 3), round(w[1], 3), w[2], k])
mix.add(voice, 0, 1.0)

P = lambda k: pieces[k][0]  # noqa: E731
PE = lambda k: pieces[k][1]  # noqa: E731
shots = []
for name, k, off in SHOTS:
    shots.append([name, 0.0 if off is None else round(P(k) + off, 3)])
S = {n: s for n, s in shots}

# ---------------------------------------------------------------- events (story time)
ALARMS = {w: S[f"w{w}wake"] + 0.15 for w in (1, 2, 3)}
SLAPS = {w: ALARMS[w] + 0.95 for w in (1, 2, 3)}
EV = {
    "zoom": [P(2) - 0.1, P(2) + 1.3],
    "alarm": [ALARMS[1], ALARMS[2], ALARMS[3]],
    "slap": [SLAPS[1], SLAPS[2], SLAPS[3]],
    "arm": [P(4) - 0.2, PE(4) + 0.2],
    "train": S["w1window"] + 0.2,
    "rocket": P(5) + 1.0,
    "ask": P(7) + 0.2,
    "no": P(8) + 1.0,
    "type": [P(9) + 0.05, P(9) + 1.4],
    "run": [S["w2bus"], P(12) + 0.2],
    "doors": PE(12) + 0.05,
    "gust": P(13) + 0.35,
    "brick": P(13) + 1.05,
    "lights": P(16) + 0.4,
    "blink": P(17) + 1.2,
    "pull": [S["w3wake"] + 1.6, PE(19)],
    "tap": P(20) + 1.1,
    "hatch": P(21) + 0.3,
    "lift": P(22) + 0.2,
    "wave": P(24) + 0.3,
    "wake4": P(26) + 0.1,
    "nosig": P(27) - 0.1,
    "lock": P(29) + 1.6,
    "vac": P(30) + 0.2,
    "turn": [P(30) + 1.1, P(30) + 2.0],
}

# ---------------------------------------------------------------- synthesized sounds
rng_ = np.random.default_rng(5)


def alarm(dur=1.0):
    """Digital alarm clock: four short beeps per 0.5 s."""
    tt = tt_(dur)
    gate = ((tt % 0.5) < 0.32) & (((tt % 0.5) % 0.08) < 0.05)
    s = np.sign(np.sin(2 * np.pi * 2050 * tt)) * 0.5 + np.sin(2 * np.pi * 4100 * tt) * 0.2
    return filt(s * gate, "lowpass", 6000) * 0.6


def whir(dur=0.8, f0=300, f1=600):
    tt = tt_(dur)
    f = f0 + (f1 - f0) * np.sin(np.pi * tt / dur)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + np.sin(4 * np.pi * np.cumsum(f) / SR) * 0.2
    return s * np.sin(np.pi * tt / dur) ** 0.7 * 0.5


def whoosh(dur=1.2, lo=300, hi=3000):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [lo, hi])
    return s * np.sin(np.pi * tt / dur) ** 2


def rumble(dur=4.0):
    tt = tt_(dur)
    s = filt(brown(len(tt)), "lowpass", 160) * 1.5 + filt(white(len(tt)), "bandpass", [200, 1200]) * 0.25
    return s * np.clip(tt / 0.6, 0, 1) * np.clip((dur - tt) / 1.5, 0, 1)


def hum(dur, f=60):
    tt = tt_(dur)
    s = np.sin(2 * np.pi * f * tt) * 0.5 + np.sin(2 * np.pi * 2 * f * tt) * 0.3 + filt(white(len(tt)), "bandpass", [2000, 6000]) * 0.05
    return s * np.clip(tt / 0.2, 0, 1) * np.clip((dur - tt) / 0.2, 0, 1)


def buzzer(dur=0.45):
    tt = tt_(dur)
    s = np.sign(np.sin(2 * np.pi * 140 * tt)) + 0.5 * np.sign(np.sin(2 * np.pi * 147 * tt))
    return filt(s, "lowpass", 2500) * np.clip((dur - tt) / 0.05, 0, 1) * 0.35


def keys(dur, n):
    s = np.zeros(int(dur * SR) + 4000)
    for k in range(n):
        c = click(0.03, 2600 + 400 * rng_.random())
        i = int((k / n * dur + rng_.uniform(-0.02, 0.02)) * SR)
        i = max(0, i)
        s[i: i + len(c)] += c[: len(s) - i]
    return s


def hiss(dur=0.6):
    tt = tt_(dur)
    return filt(white(len(tt)), "highpass", 2500) * np.exp(-tt * 4) * 0.6


def blip(f=1300, dur=0.12):
    tt = tt_(dur)
    return np.sin(2 * np.pi * f * (1 + 0.3 * tt / dur) * tt) * np.exp(-tt * 25)


def slide(dur=0.4):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [900, 5000]) * np.sin(np.pi * tt / dur) * 0.6
    c = click(0.05, 2500) * 0.5
    s[-len(c):] += c
    return s


def drone_buzz(dur, f=180):
    tt = tt_(dur)
    f_ = f * (1 + 0.02 * np.sin(2 * np.pi * 3 * tt))
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f_) / SR)) * 0.3 + np.sin(2 * np.pi * np.cumsum(2 * f_) / SR) * 0.3
    return filt(s, "bandpass", [150, 3000]) * np.clip(tt / 0.3, 0, 1) * np.clip((dur - tt) / 0.3, 0, 1)


def swarm(dur):
    s = sum(drone_buzz(dur, f) * (0.5 + 0.5 * rng_.random()) for f in (150, 173, 190, 211, 236))
    return s / 3


def motor(dur, f=95):
    tt = tt_(dur)
    f_ = f * np.clip(tt / 0.4, 0.3, 1)
    s = np.sin(2 * np.pi * np.cumsum(f_) / SR) * 0.5 + filt(white(len(tt)), "bandpass", [300, 1500]) * 0.3
    return s * np.clip((dur - tt) / 0.2, 0, 1)


def murmur(dur):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for k in range(6):
        f = 140 + 40 * k
        env = np.clip(np.sin(2 * np.pi * (2.1 + 0.37 * k) * tt + k) + 0.2 * np.sin(2 * np.pi * 7.3 * tt + k), 0, 1)
        s += filt(white(len(tt)), "bandpass", [f, f * 4.5]) * env
    return s / 6 * np.clip(tt / 0.3, 0, 1) * np.clip((dur - tt) / 0.3, 0, 1)


def wind(dur):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [200, 1200]) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.3 * tt) ** 2) * np.clip(tt / 0.5, 0, 1) * np.clip((dur - tt) / 0.5, 0, 1)


def birds(dur):
    s = np.zeros(int(dur * SR))
    for k in range(int(dur * 1.5)):
        tt = tt_(0.12)
        f = 3200 + 900 * rng_.random()
        c = np.sin(2 * np.pi * f * (1 + 0.25 * np.sin(np.pi * tt / 0.12)) * tt) * np.sin(np.pi * tt / 0.12) * 0.3
        i = int(rng_.uniform(0, dur - 0.2) * SR)
        s[i: i + len(c)] += c
    return s


# intro: a soft whoosh over the four windows, a low hit when the last one fills the screen
mix.add(whoosh(1.4, 200, 1500), O + 0.0, 0.15)
mix.add(thump(50, 28, 1.6, decay=2.2, click=0.2), O + EV["zoom"][0] + 0.5, 0.45)
mix.add(whoosh(1.3, 150, 900), O + EV["zoom"][0], 0.2)

# worlds 1-3: alarm until the slap
for w in (1, 2, 3):
    a = EV["alarm"][w - 1]
    b = EV["slap"][w - 1]
    mix.add(alarm(b - a), O + a, 0.32, pan=-0.3)
    mix.add(thump(130, 70, 0.3, decay=18, click=1.0), O + b, 0.4, pan=-0.3)
    mix.add(whoosh(0.5, 400, 2500), O + S[f"w{w}wake"] - 0.3, 0.12)

# world 1: future city morning
mix.add(whir(EV["arm"][1] - EV["arm"][0], 280, 520), O + EV["arm"][0], 0.2, pan=0.3)
mix.add(birds(S["w1bunker"] - S["w1window"]), O + S["w1window"], 0.12)
mix.add(whoosh(1.6, 150, 2200), O + EV["train"], 0.25, pan=-0.4)
mix.add(rumble(S["w1bunker"] - EV["rocket"] + 0.5), O + EV["rocket"], 0.35)
mix.add(hum(S["w2wake"] - S["w1bunker"], 55), O + S["w1bunker"], 0.12)
mix.add(blip(900), O + EV["ask"], 0.25)
mix.add(buzzer(), O + EV["no"], 0.3)
mix.add(keys(EV["type"][1] - EV["type"][0], 16), O + EV["type"][0], 0.22)

# world 2: lucky day
mix.add(murmur(S["w3wake"] - S["w2bus"]), O + S["w2bus"], 0.1)
for k in range(int((EV["run"][1] - EV["run"][0]) / 0.3)):
    mix.add(step(), O + EV["run"][0] + k * 0.3, 0.2, pan=0.2 * np.sin(k))
mix.add(hiss(), O + EV["doors"], 0.3)
mix.add(thump(110, 70, 0.3, decay=16, click=0.8), O + EV["doors"] + 0.2, 0.25)
mix.add(whoosh(0.9, 200, 1500), O + EV["gust"], 0.35)
mix.add(thump(90, 40, 0.5, decay=10, click=1.2), O + EV["brick"], 0.5)
mix.add(ting(1568, 0.6), O + S["w2tv"] + 0.1, 0.1)
mix.add(ting(2093, 0.6), O + S["w2tv"] + 0.25, 0.1)
for k in range(5):
    mix.add(blip(1600 + 150 * k, 0.08), O + EV["lights"] + k * 0.14, 0.08, pan=-0.6 + 0.3 * k)
mix.add(blip(1250, 0.18), O + EV["blink"], 0.25)

# world 3: the zoo
mix.add(filt(murmur(S["w4wake"] - EV["pull"][0]), "lowpass", 700), O + EV["pull"][0], 0.14)
for k in range(3):
    mix.add(blip(900 + 300 * k, 0.1), O + EV["pull"][0] + 0.6 + k * 0.5, 0.1, pan=0.4)
for k in range(3):
    mix.add(thump(400, 300, 0.12, decay=40, click=1.0), O + EV["tap"] + k * 0.22, 0.2)
mix.add(slide(), O + EV["hatch"], 0.3)
mix.add(ting(2349, 0.9), O + EV["hatch"] + 0.45, 0.15)
mix.add(drone_buzz(2.6, 210), O + EV["lift"] - 0.6, 0.25)
mix.add(blip(1400, 0.1), O + EV["wave"], 0.18)
mix.add(blip(1800, 0.1), O + EV["wave"] + 0.16, 0.18)

# world 4: silence, then the swarm, the lock and the vacuum
mix.add(filt(brown(int((S["quadEnd"] - S["w4wake"]) * SR)), "lowpass", 90) * 2, O + S["w4wake"], 0.25)
mix.add(swarm(S["w4fridge"] - S["w4window"] + 0.5), O + S["w4window"], 0.3)
mix.add(blip(500, 0.25), O + EV["nosig"], 0.2)
mix.add(click(0.06, 1200), O + EV["lock"], 0.5)
mix.add(thump(160, 90, 0.25, decay=20, click=1.0), O + EV["lock"] + 0.03, 0.3)
mix.add(motor(S["quadEnd"] - EV["vac"] + 0.3), O + EV["vac"], 0.3, pan=-0.2)

# the end: four windows again
mix.add(whoosh(1.2, 200, 1500), O + S["quadEnd"] - 0.2, 0.15)

# ---------------------------------------------------------------- music: soft pad + pluck, colour per world, cut in world 4
t = mix.t - O
music = np.zeros(mix.n)
beat = t * 92 / 60
eighth = (beat * 2).astype(int)
ph8 = (beat * 2) % 1
# chord roots per world: intro (mysterious), 1 bright, 2 warm, 3 odd, end
SECTIONS = [
    (0.0, [220.0, 261.6, 329.6, 392.0]),
    (S["w1wake"], [261.6, 329.6, 392.0, 523.3]),
    (S["w2wake"], [293.7, 370.0, 440.0, 587.3]),
    (S["w3wake"], [246.9, 311.1, 370.0, 493.9]),
    (S["quadEnd"], [220.0, 261.6, 329.6, 392.0]),
]
notes = np.zeros(mix.n)
for start, ch in SECTIONS:
    m = t >= start
    notes[m] = np.array(ch)[eighth[m] % 4]
pluck = np.sin(2 * np.pi * np.cumsum(notes) / SR) * np.exp(-ph8 * 7)
pad_f = np.zeros(mix.n)
for start, ch in SECTIONS:
    pad_f[t >= start] = ch[0] / 2
pad = np.sin(2 * np.pi * np.cumsum(pad_f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(pad_f * 1.5) / SR)
music = pluck * 0.35 + filt(pad, "lowpass", 900) * 0.25
level = np.interp(t, [0, 0.5, S["w4wake"] - 0.4, S["w4wake"], S["quadEnd"], S["quadEnd"] + 0.6, DUR - 1, DUR],
                  [0, 0.8, 0.9, 0, 0, 0.7, 0.7, 0])
# no music under the alarms: the alarm is the world's opening
for w in (1, 2, 3):
    level *= 1 - 0.85 * mix.env(O + EV["alarm"][w - 1] - 0.3, O + EV["slap"][w - 1] + 0.2, 0.15, 0.4)[: len(level)]
duck = np.ones(mix.n)
for a, b in pieces:
    duck -= 0.45 * mix.env(O + a - 0.1, O + b + 0.15, 0.12, 0.3)
music = filt(music, "lowpass", 4500) * level * np.clip(duck, 0.45, 1) * 0.2
mix.l += music
mix.r += music

# ---------------------------------------------------------------- write
final = mix.write("ai-four-worlds")
cues = {"duration": DUR, "shots": shots, "words": words, "pieces": pieces, "ev": EV}
(ROOT / "src/ai4").mkdir(exist_ok=True)
(ROOT / "src/ai4/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame, {int(round(DUR * 30)) + 1} frames) and src/ai4/cues.json")
for n, s in shots:
    print(f"  {s:6.2f} {n}")
