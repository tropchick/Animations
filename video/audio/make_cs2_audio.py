"""Soundtrack and timing cues for «Что если в CS2 добавят античит?» (Russian TikTok meme chain, low poly).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant», text /mnt/project-files/voice/cs2/cs2-vo-text.txt
(Cyrillic vowels + combining U+0301 stress marks, never Latin ó/á/ý). Expected file: audio/voice/cs2-vo.mp3,
word times audio/voice/cs2-words.json (audio/transcribe_cs2.py).

Every shot and event is anchored to a caption phrase (P[k].s / P[k].e), so a new take only needs new phrase times:
  - with the voice file and the words json present, phrase times come from whisper (first/last word inside the phrase's window);
  - without them (draft), phrase times are estimated from word counts and the take is left out of the mix.

Frame 0 is the cover, so all times are story time (v = (frame - 1) / 30); the track gets 1/30 s in front.

Sync map (story time of the on-screen event <-> sound):
  BAN         the scanner beam sweeps the club, screens turn red    <-> error blips, one per screen row + low hit
  LOBBY       four avatars pop in the lobby                         <-> 4 pops
  CAKE        the candles on the cake light up                      <-> soft ding
  SEATS_BAN   the pros' screens turn red                            <-> error chord
  TROPHY      the bots lift the cup, confetti                       <-> cheer + ding
  HIRED       the hired counter runs                                <-> steps + door
  GROW        the shield grows inside the office                    <-> rising hum
  EXIT        the shield bursts out of the monitor                  <-> glass + whoosh
  SWEEP       the beam passes the exam desks, sheets turn red       <-> stamp thumps
  LIFTOFF     the rocket lifts off                                  <-> rocket roar
  XRAY        walls go see-through, red outlines                    <-> scanner sweep
  DETECT      «ОБНАРУЖЕН ЧИТ: ВХ» on the satellite screen           <-> alarm beeps
  STAMP       «ЗАБАНЕН» stamp                                       <-> stamp + low hit
  FALL        the satellite's eye dies, it tumbles away             <-> power-down
  GREEN       the club's screens flip back to the game              <-> click wave
  KILLS       kill feed lines                                       <-> taps
  NOTIFY      phone notification from Valve                         <-> notification ding
  FINAL       «АНТИЧИТ: ЗАБАНЕН ЗА ВХ»                               <-> low ting + braam
"""

import json
import sys
from pathlib import Path

import numpy as np

from slime_lib import ROOT, SR, Mix, beep, click, drone, filt, load, thump, ting, tt_, white

OFF = 1 / 30
VO_AT = 0.2
VO_PATH = ROOT / "audio/voice/cs2-vo.mp3"
WORDS_PATH = ROOT / "audio/voice/cs2-words.json"

# caption phrases: text as shown on screen, and the estimated length used for the draft
PHRASES = [
    ("Valve добавила в CS2 настоящий античит.", 2.9),
    ("Первая волна банов, и онлайн упал в 40 раз.", 3.2),
    ("Честных игроков в Европе осталось четверо.", 3.0),
    ("Они играют только друг с другом.", 2.3),
    ("Уже как семья.", 1.4),
    ("Про-игроков забанили за слишком точную стрельбу.", 3.3),
    ("Мажор выиграла команда ботов.", 2.3),
    ("200 000 продавцов читов остались без работы.", 3.2),
    ("И Valve наняла их всех: улучшать античит.", 3.0),
    ("Античит стал сильнее и вышел из игры.", 2.7),
    ("На ЕГЭ он забанил полстраны", 2.2),
    ("за подозрительно правильные ответы.", 2.4),
    ("Потом его подключили к спутникам.", 2.4),
    ("Теперь он видел каждого человека на планете сквозь стены.", 3.6),
    ("И тут античит понял:", 1.5),
    ("видеть сквозь стены — это же ВХ.", 2.4),
    ("И забанил сам себя.", 1.6),
    ("Через секунду все читеры вернулись в игру.", 2.8),
    ("А Valve ответила: «Мы работаем над этим».", 3.0),
]
# phrases followed by a [pause] in the take get a longer gap in the draft estimate
GAP = 0.35

HAVE_VO = VO_PATH.exists() and WORDS_PATH.exists() and "--draft" not in sys.argv

# measured phrase windows in take time (filled in from whisper once the take exists): list of (start, end)
MEASURED: list[tuple[float, float]] = [
    (0.0, 3.36), (4.2, 7.8), (8.3, 11.18), (11.8, 13.78), (14.32, 15.28), (15.72, 19.06), (19.62, 22.0),
    (22.44, 25.8), (25.8, 29.5), (29.9, 32.88), (33.56, 36.04), (36.04, 38.16), (38.44, 40.8), (41.28, 45.14),
    (45.66, 47.2), (47.82, 50.28), (50.82, 52.2), (52.2, 55.56), (55.84, 58.92),
]  # take 9jHsYfBr0Sb9pVVFPU7Q (flow NMnesOlGHWKx445AwILH, 861 credits), 59.3 s

if HAVE_VO and MEASURED:
    PT = [(VO_AT + a, VO_AT + b) for a, b in MEASURED]
else:
    PT = []
    t = VO_AT
    for _, d in PHRASES:
        PT.append((round(t, 3), round(t + d, 3)))
        t += d + GAP


class _P:
    def __init__(self, k):
        self.s, self.e = PT[k]


P = [_P(k) for k in range(len(PHRASES))]
VO_END = P[-1].e

# ---------------------------------------------------------------- shots
SHOTS = [
    ("club", 0.0),
    ("lobby", P[2].s - 0.15),
    ("family", P[3].s - 0.1),
    ("arena", P[5].s - 0.1),
    ("queue", P[7].s - 0.1),
    ("office", P[8].s - 0.1),
    ("exit", P[9].s - 0.1),
    ("exam", P[10].s - 0.1),
    ("launch", P[12].s - 0.1),
    ("orbit", P[13].s - 0.1),
    ("xray", P[13].s + 1.5),
    ("mirror", P[14].s - 0.1),
    ("back", P[17].s - 0.1),
    ("phone", P[18].s + 0.6),
]

BAN = (P[1].s + 0.1, P[1].e + 0.1)
LOBBY = P[2].s + 0.5
CAKE = P[4].s + 0.1
SEATS_BAN = P[5].s + 0.9
TROPHY = P[6].s + 0.8
HIRED = (P[7].s + 0.3, P[7].e)
GROW = (P[8].s + 0.9, P[8].e + 0.2)
EXIT = P[9].s + 1.4
SWEEP = (P[10].s + 0.2, P[11].e - 0.2)
LIFTOFF = P[12].s + 0.25
XRAY = P[13].s + 1.8
DETECT = P[15].s + 0.1
STAMP = P[16].s + 0.35
FALL = STAMP + 0.7
GREEN = P[17].s + 0.25
KILLS = [P[17].s + 1.2 + 0.45 * k for k in range(4)]
NOTIFY = P[18].s + 1.0
FINAL = max(P[18].e + 0.4, NOTIFY + 1.6)
DUR = round(FINAL + 2.2, 2)

# ---------------------------------------------------------------- caption words
words = []  # [start, end, token, phrase] in story time
WH = json.loads(WORDS_PATH.read_text()) if HAVE_VO else []
for k, (text, _) in enumerate(PHRASES):
    a, b = PT[k]
    toks = text.split(" ")
    ws = [w for w in WH if a - VO_AT - 0.05 <= w[0] < b - VO_AT]
    if len(ws) == len(toks):
        starts = [VO_AT + w[0] for w in ws]
        end_of = VO_AT + ws[-1][1]
    else:  # spread the tokens by length over the phrase
        lens = np.cumsum([0] + [len(x) + 2 for x in toks])
        starts = [a + (b - a) * lens[j] / lens[-1] for j in range(len(toks))]
        end_of = b
    for j, tok in enumerate(toks):
        end = starts[j + 1] if j + 1 < len(toks) else end_of
        words.append([round(starts[j], 3), round(end, 3), tok, k])
GROUPS = [[k] for k in range(len(PHRASES))]

mix = Mix(DUR + OFF + 0.6)
O = OFF
if HAVE_VO:
    mix.add(load(VO_PATH), O + VO_AT, 1.0)


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


def err_blip(f=220, dur=0.16):
    tt = tt_(dur)
    s = np.sign(np.sin(2 * np.pi * f * tt)) * 0.4
    return filt(s, "lowpass", 1800) * np.clip((dur - tt) / 0.03, 0, 1)


def scan(dur=1.6, f0=300, f1=1400):
    tt = tt_(dur)
    f = f0 + (f1 - f0) * (tt / dur)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + filt(white(len(tt)), "bandpass", [1500, 5000]) * 0.15
    return s * np.sin(np.pi * tt / dur) ** 2


def hum_rise(dur=2.5):
    tt = tt_(dur)
    f = 70 + 90 * (tt / dur) ** 1.5
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(f * 2) / SR)
    return s * 0.4 * np.clip(tt / 0.3, 0, 1) * np.clip((dur - tt) / 0.2, 0, 1)


def power_down(dur=2.4):
    tt = tt_(dur)
    f = 140 * np.exp(-tt * 1.3) + 25
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 * np.exp(-tt * 0.8)


def buzz(dur=0.45, f=170):
    tt = tt_(dur)
    s = np.sign(np.sin(2 * np.pi * f * tt)) * 0.5 + np.sin(2 * np.pi * f * 2 * tt) * 0.3
    return filt(s, "lowpass", 900) * np.clip(tt / 0.02, 0, 1) * np.clip((dur - tt) / 0.03, 0, 1)


def pop():
    s = ting(1046.5, 0.25) * 0.3
    c = click(0.04, 2400) * 0.8
    s[: len(c)] += c[: len(s)]
    return s


SERVERS = sfx("gta/servers")
CROWD = sfx("lastman/crowd")
CHEER = sfx("bear/cheer")
STAMPS = sfx("bear/stamp")
STEPS = sfx("scp/steps")
DOOR = sfx("murino/door_open")
GLASS = sfx("earth/glass")
ROCKET = sfx("gta/rocket")
HUM = sfx("scp/hum")
WIND = sfx("gta/wind")
CITY = sfx("earth/city")

S = dict(SHOTS)
END = {n: (SHOTS[i + 1][1] if i + 1 < len(SHOTS) else DUR) for i, (n, _) in enumerate(SHOTS)}

# 1. club: PC fans, keyboard chatter, the ban wave
place(SERVERS, 0.0, 0.14, length=END["club"], fade_out=0.4)
for k in range(30):
    mix.add(click(0.02, 2400 + (k % 5) * 250), O + 0.15 + k * 0.11 + (k % 3) * 0.03, 0.08, pan=((k % 5) - 2) * 0.2)
for i in range(6):
    mix.add(err_blip(240 - 15 * i), O + BAN[0] + (BAN[1] - BAN[0]) * i / 5.5, 0.22, pan=(i % 3 - 1) * 0.4)
mix.add(thump(55, 30, 1.2, decay=3, click=0.2), O + BAN[0], 0.4)
mix.add(scan(BAN[1] - BAN[0] + 0.3), O + BAN[0] - 0.1, 0.25)

# 2. lobby + family
for i in range(4):
    mix.add(pop(), O + LOBBY + i * 0.18, 0.25, pan=(i - 1.5) * 0.3)
place(CROWD, S["family"], 0.06, length=END["family"] - S["family"], fade_in=0.3, fade_out=0.4)
mix.add(ding(1567.98, 1.0), O + CAKE, 0.18)

# 3. arena: crowd, the pros banned, the bots win
place(CROWD, S["arena"], 0.3, skip=2.0, length=END["arena"] - S["arena"], fade_in=0.2, fade_out=0.4)
mix.add(error_chord(), O + SEATS_BAN, 0.4)
mix.add(thump(60, 35, 0.9, decay=4, click=0.3), O + SEATS_BAN, 0.3)
place(CHEER, TROPHY - 0.1, 0.45, length=END["arena"] - TROPHY + 0.1, fade_out=0.4)
mix.add(ding(1318.5, 1.2), O + TROPHY, 0.22)

# 4. queue of hooded coders, the tower door
place(CITY, S["queue"], 0.25, length=END["queue"] - S["queue"], fade_in=0.3, fade_out=0.3)
place(STEPS, S["queue"] + 0.2, 0.3, length=END["queue"] - S["queue"] - 0.2, fade_out=0.4)
place(DOOR, HIRED[0] + 0.6, 0.25, length=1.5, fade_out=0.4)

# 5. office: typing, the shield grows
for k in range(24):
    mix.add(click(0.02, 2600 + (k % 5) * 200), O + S["office"] + 0.1 + k * 0.12 + (k % 3) * 0.03, 0.1, pan=((k % 4) - 1.5) * 0.3)
mix.add(hum_rise(GROW[1] - GROW[0]), O + GROW[0], 0.35)

# 6. exit: out of the monitor
place(GLASS, EXIT - 0.05, 0.4, length=1.6, fade_out=0.5)
mix.add(whoosh(1.0, 200, 5000), O + EXIT - 0.3, 0.4)
mix.add(thump(70, 40, 0.6, decay=6, click=0.4), O + EXIT, 0.35)

# 7. exam: silence, a clock, stamps as the beam passes
for k in range(int((END["exam"] - S["exam"]) / 0.5)):
    mix.add(click(0.02, 1200), O + S["exam"] + 0.1 + k * 0.5, 0.08)
mix.add(scan(SWEEP[1] - SWEEP[0]), O + SWEEP[0], 0.2)
for i in range(5):
    place(STAMPS, SWEEP[0] + 0.3 + (SWEEP[1] - SWEEP[0] - 0.6) * i / 4, 0.3, pan=(i - 2) * 0.25, length=0.6)

# 8. launch
place(ROCKET, LIFTOFF - 0.2, 0.55, length=END["launch"] - LIFTOFF + 0.4, fade_out=0.5)

# 9. orbit + xray
place(WIND, S["orbit"], 0.12, length=END["xray"] - S["orbit"], fade_in=0.4, fade_out=0.4)
mix.add(braam(36.7, 2.4), O + S["orbit"] + 0.1, 0.22)
mix.add(scan(1.4, 500, 1800), O + XRAY - 0.2, 0.3)

# 10. mirror: detect, stamp, fall
place(HUM, S["mirror"], 0.18, length=FALL - S["mirror"], fade_out=0.2)
for k in range(4):
    mix.add(beep(880, 0.18), O + DETECT + k * 0.3, 0.18)
place(STAMPS, STAMP - 0.05, 0.65)
mix.add(thump(50, 30, 1.0, decay=3, click=0.4), O + STAMP, 0.45)
mix.add(power_down(2.2), O + FALL, 0.55)

# 11. back in the club
place(SERVERS, S["back"], 0.14, length=DUR - S["back"], fade_in=0.2, fade_out=1.0)
for i in range(8):
    mix.add(click(0.03, 1500 + 120 * i), O + GREEN + i * 0.06, 0.15, pan=(i % 3 - 1) * 0.4)
for at in KILLS:
    mix.add(click(0.03, 3000), O + at, 0.18)
    mix.add(ting(2093.0, 0.25), O + at, 0.05)
mix.add(ding(1760.0, 0.9), O + NOTIFY, 0.25)
mix.add(buzz(0.35, 170), O + NOTIFY, 0.15)
mix.add(ting(659.3, 1.8), O + FINAL, 0.14)
mix.add(braam(27.5, 2.6), O + FINAL, 0.2)

# ---------------------------------------------------------------- bed: a low pulse building to the stamp
t = mix.t - O
tension = np.interp(t, [0, S["arena"], S["office"], S["launch"], S["mirror"], STAMP, FALL + 1.0, DUR], [0.45, 0.5, 0.6, 0.8, 1.0, 1.0, 0.3, 0.0])
base = drone([41.2, 61.7, 82.4], DUR + 1)[: mix.n]
rate = np.interp(t, [0, S["office"], S["mirror"], STAMP, DUR], [2.0, 2.4, 3.2, 1.0, 1.0])
pulse = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(rate) / SR) ** 8
bed = filt(base * pulse, "lowpass", 700) * tension
duck = np.ones(mix.n)
if HAVE_VO:
    duck -= 0.4 * mix.env(O + VO_AT, O + VO_END, 0.3, 0.6)
duck = np.clip(duck, 0.35, 1)
mix.l += bed * duck * 0.35
mix.r += bed * duck * 0.35

final = mix.write("cs2-anticheat")

cues = {
    "duration": DUR,
    "draft": not HAVE_VO,
    "shots": [[n, round(s, 3)] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "phrases": [[round(a, 3), round(b, 3)] for a, b in PT],
    "ban": list(BAN),
    "lobby": LOBBY,
    "cake": CAKE,
    "seatsBan": SEATS_BAN,
    "trophy": TROPHY,
    "hired": list(HIRED),
    "grow": list(GROW),
    "exit": EXIT,
    "sweep": list(SWEEP),
    "liftoff": LIFTOFF,
    "xray": XRAY,
    "detect": DETECT,
    "stamp": STAMP,
    "fall": FALL,
    "green": GREEN,
    "kills": KILLS,
    "notify": NOTIFY,
    "final": FINAL,
}
(ROOT / "src/cs2").mkdir(exist_ok=True)
(ROOT / "src/cs2/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame, {'with voice' if HAVE_VO else 'DRAFT without voice'}) and src/cs2/cues.json")
