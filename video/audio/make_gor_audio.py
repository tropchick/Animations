"""Soundtrack and timing cues for «100 мужчин против гориллы» (Russian TikTok, comic 3D, the realistic fight).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant» (flow 7rbccOAqlMQTJp98cDmg, 564 credits),
41.7 s raw (audio/voice/gor-vo-raw.mp3) -> atempo 1.1 = 37.9 s -> audio/voice/gor-vo.mp3 (word times: gor-words.json,
audio/transcribe_gor.py). Until the take exists the script runs on ESTIMATED phrase windows and writes no voice.
The take is cut at the pauses between phrases and the pieces are spread out (GAPS), so the fight has room without narration.
Frame 0 is the cover: v = (frame - 1) / 30.

Sync map (story time of the on-screen event <-> sound):
  BEATS            palms on the chest                    <-> hollow thumps
  ROAR             the mouth opens                       <-> roar
  CHARGE..STOP     gallop, skid                          <-> footfalls, dirt skid, crowd gasp
  RUN5             five men start                        <-> battle cry
  HITS             toss / swat / pin                     <-> whoosh + impact
  MELEE            eight men fly off                     <-> impacts, crowd roar
  JUMPS            men land on the pile                  <-> body thuds
  HEAVE / SLUMP    the pile lifts and drops              <-> strain, heavy thud
  spent            the gorilla pants                     <-> slow breaths
  PLATE1 / PLATE2  result plates                         <-> ding, stamp
"""

import json

import numpy as np

from slime_lib import ROOT, SR, Mix, breath, filt, load, thump, ting, tt_, white

OFF = 1 / 30
VO_AT = 0.25
VO_PATH = ROOT / "audio/voice/gor-vo.mp3"
WORDS_PATH = ROOT / "audio/voice/gor-words.json"
HAVE_VO = VO_PATH.exists() and WORDS_PATH.exists()

PHRASES = [
    "Сто мужчин против одной гориллы.",  # 0
    "Как это было бы в реальной жизни?",  # 1
    "Первым идти не хочет никто.",  # 2
    "Горилла бьёт себя в грудь и делает ложный бросок —",  # 3
    "это блеф.",  # 4
    "Пятеро смелых бросаются первыми.",  # 5
    "Через три секунды трое уже не встают.",  # 6
    "Тогда нападают все сразу.",  # 7
    "Со всех сторон.",  # 8
    "Тридцать человек — это две с половиной тонны.",  # 9
    "Горилла весит двести килограммов.",  # 10
    "Её прижимают к земле.",  # 11
    "Через две минуты горилла выдохлась.",  # 12
    "Её отпускают, и она уходит в джунгли.",  # 13
    "Мужчины победили.",  # 14
    "Но четырнадцать из ста поедут в больницу.",  # 15
]
# phrase windows in take time: estimates until the take is measured with whisper
ESTIMATE = [
    (0.0, 2.2), (2.6, 4.7), (5.2, 7.0), (7.4, 10.4), (10.6, 11.4), (12.0, 14.0), (14.4, 17.0), (17.6, 19.2),
    (19.5, 20.5), (21.1, 23.8), (24.2, 26.3), (26.6, 28.1), (28.7, 31.0), (31.4, 34.0), (34.5, 35.7), (36.0, 38.6),
]
# measured with whisper on the 1.1x take (37.9 s)
TAKE = [
    (0.00, 2.50), (2.86, 4.44), (5.00, 6.72), (7.14, 10.28), (10.62, 11.36), (11.70, 13.80), (14.14, 16.52), (16.90, 18.82),
    (19.14, 19.96), (20.42, 23.24), (23.44, 25.60), (25.90, 27.26), (27.34, 29.98), (30.28, 32.94), (33.26, 34.64), (34.90, 37.60),
]
MEASURED = TAKE if HAVE_VO else ESTIMATE
# extra silence BEFORE a phrase (story seconds): room for the action
GAPS = {2: 0.2, 3: 0.2, 4: 0.6, 5: 0.8, 7: 0.9, 9: 3.3, 12: 1.6, 13: 0.2, 14: 1.3}

shift = 0.0
PT = []
SH = []
for k, (a, b) in enumerate(MEASURED):
    shift += GAPS.get(k, 0.0)
    SH.append(shift)
    PT.append((VO_AT + a + shift, VO_AT + b + shift))


class _P:
    def __init__(self, k):
        self.s, self.e = PT[k]


P = [_P(k) for k in range(len(PHRASES))]
VO_END = P[-1].e

WH = json.loads(WORDS_PATH.read_text()) if HAVE_VO else []


def norm(s):
    return s.lower().replace("ё", "е").strip(" ,.—-«»:…?!")


def word_at(k, prefix, frac):
    """story time of the first word in phrase k that starts with prefix (whisper), else a fraction of the phrase"""
    a, b = MEASURED[k]
    for w in WH:
        if a - 0.05 <= w[0] < b and norm(w[2]).startswith(norm(prefix)):
            return VO_AT + w[0] + SH[k]
    if HAVE_VO:
        print(f"!! no «{prefix}» in phrase {k}")
    return PT[k][0] + (PT[k][1] - PT[k][0]) * frac


# ---------------------------------------------------------------- events
STOP = P[4].s - 0.7  # the charge ends face to face; the roar gets its own beat, then «это блеф»
CHARGE = STOP - 1.15
BEAT0 = P[3].s + 0.55
BEATS = [round(BEAT0 + 0.14 * j, 3) for j in range(int(max(4, (CHARGE - 0.45 - BEAT0) / 0.14)))]
ROAR = BEATS[-1] + 0.1
RUN5 = P[5].s - 0.1
H1 = P[6].s + 0.2
HITS = [H1, H1 + 0.9, H1 + 1.8]
SWARM = P[7].s - 0.15
MELEE = P[8].e + 0.2
MELEE_HITS = [round(MELEE + 0.35 + 0.36 * j, 3) for j in range(8)]
PILE = P[9].s - 0.15
PINNED = P[11].s - 0.2
HEAVE = P[11].e + 0.3
THROWN = [HEAVE + 0.45, HEAVE + 0.57, HEAVE + 0.7]
SLUMP = HEAVE + 1.05
SPENT = P[12].s - 0.15
RELEASE = P[13].s - 0.15
LOOKBACK = P[13].e - 0.15
RESULT = P[14].s - 0.15
PLATE1 = P[14].s + 0.05
PLATE2 = word_at(15, "14", 0.12)
DUR = round(VO_END + 2.3, 2)

SHOTS = [
    ("over", 0.0),
    ("face", P[1].s - 0.12),
    ("hesitate", P[2].s - 0.15),
    ("beat", P[3].s - 0.15),
    ("charge", CHARGE - 0.2),
    ("brave", RUN5 - 0.1),
    ("clash", H1 - 0.55),
    ("swarm", SWARM),
    ("melee", MELEE),
    ("pile", PILE),
    ("pinned", PINNED),
    ("spent", SPENT),
    ("release", RELEASE),
    ("result", RESULT),
]

# the fight clock (seconds shown) and the gorilla's strength (0..1) over story time
TIMER = [[CHARGE, 0], [HITS[0], 3], [HITS[2], 5], [SWARM, 20], [MELEE, 34], [PILE, 66], [PINNED, 98], [SLUMP + 0.4, 120]]
POWER = [[0, 1], [HITS[0], 1], [HITS[2], 0.94], [MELEE, 0.9], [PILE, 0.52], [PINNED, 0.24], [SLUMP + 0.3, 0.06], [RELEASE, 0.04]]
HURT = [round(x, 3) for x in HITS + MELEE_HITS + THROWN]  # the counter ticks at each

# ---------------------------------------------------------------- caption words
words = []
for k, text in enumerate(PHRASES):
    a, b = PT[k]
    toks = [x for x in text.split(" ") if x != "—"]
    ma, mb = MEASURED[k]
    ws = [w for w in WH if ma - 0.05 <= w[0] < mb]
    if len(ws) == len(toks):
        starts = [VO_AT + w[0] + SH[k] for w in ws]
        end_of = VO_AT + ws[-1][1] + SH[k]
    else:
        if HAVE_VO:
            print(f"!! phrase {k}: {len(ws)} whisper words vs {len(toks)} tokens")
        lens = np.cumsum([0] + [len(x) + 2 for x in toks])
        starts = [a + (b - a) * lens[j] / lens[-1] for j in range(len(toks))]
        end_of = b
    shown = []
    for tok in text.split(" "):
        if tok == "—":
            shown[-1] += " —"
        else:
            shown.append(tok)
    for j, tok in enumerate(shown):
        end = starts[j + 1] if j + 1 < len(shown) else end_of
        words.append([round(float(starts[j]), 3), round(float(end), 3), tok, k])
GROUPS = [[0], [1], [2], [3, 4], [5], [6], [7, 8], [9], [10], [11], [12], [13], [14], [15]]

mix = Mix(DUR + OFF + 0.6)
O = OFF

if HAVE_VO:
    vo = load(VO_PATH)
    # cut in the middle of the pause before each phrase, shift each piece by its gap
    cuts = [0.0] + [(MEASURED[k - 1][1] + MEASURED[k][0]) / 2 for k in range(1, len(PHRASES))] + [len(vo) / SR]
    for k in range(len(PHRASES)):
        seg = vo[int(cuts[k] * SR): int(cuts[k + 1] * SR)].copy()
        n = min(len(seg), int(0.012 * SR))
        seg[:n] *= np.linspace(0, 1, n)
        seg[-n:] *= np.linspace(1, 0, n)
        mix.add(seg, O + VO_AT + cuts[k] + SH[k], 1.0)


def sfx(path):
    return load(ROOT / f"audio/sfx/{path}.mp3")


def place(x, at, gain, pan=0.0, fade_out=None, length=None, skip=0.0, fade_in=None):
    x = x[int(skip * SR):]
    if length is not None:
        x = x[: int(max(0.05, length) * SR)]
    x = x.copy()
    if fade_out:
        n = min(len(x), int(fade_out * SR))
        x[-n:] *= np.linspace(1, 0, n)
    if fade_in:
        n = min(len(x), int(fade_in * SR))
        x[:n] *= np.linspace(0, 1, n)
    mix.add(x, O + at, gain, pan)


def whoosh(dur=0.5, lo=300, hi=5000):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [lo, hi])
    return s * np.exp(-((tt - dur * 0.5) / (dur * 0.22)) ** 2)


def chest():
    """a cupped palm on a big chest: short hollow knock"""
    tt = tt_(0.16)
    body = np.sin(2 * np.pi * (150 * tt + 40 * np.exp(-tt * 40) / 40)) * np.exp(-tt * 26)
    slap = filt(white(len(tt)), "bandpass", [600, 2600]) * np.exp(-tt * 70) * 0.5
    return body + slap


def impact(heavy=1.0):
    tt = tt_(0.5)
    crack = filt(white(len(tt)), "bandpass", [500, 5000]) * np.exp(-tt * 38)
    return thump(95, 38, 0.5, decay=9, click=0.5) * heavy + crack * 0.7


def thud():
    tt = tt_(0.35)
    return thump(80, 42, 0.35, decay=13, click=0.25) + filt(white(len(tt)), "lowpass", 900) * np.exp(-tt * 22) * 0.4


def skid(dur=0.7):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [700, 3800]) * np.clip(tt / 0.03, 0, 1) * np.exp(-tt * 4.5)


def ding(f=1318.5, dur=1.2):
    return ting(f, dur) * 0.6 + ting(f * 1.5, dur) * 0.4


def tick():
    tt = tt_(0.09)
    return np.sin(2 * np.pi * 1760 * tt) * np.exp(-tt * 60) * 0.5 + np.sin(2 * np.pi * 880 * tt) * np.exp(-tt * 40) * 0.5


FOREST = sfx("bear/forest")
ROAR_S = sfx("bear/roar")
CROWD_A = sfx("bear/crowd")
CROWD_B = sfx("gta/crowd")
CROWD_C = sfx("lastman/crowd")
HIT_S = sfx("scp/hit")
IMPACT_S = sfx("gta/impact")
RUSTLE = sfx("bear/rustle")
STAMP = sfx("bear/stamp")
CHEER = sfx("bear/cheer")
RUMBLE = sfx("earth/rumble")

S = dict(SHOTS)
END = {n: (SHOTS[i + 1][1] if i + 1 < len(SHOTS) else DUR) for i, (n, _) in enumerate(SHOTS)}


def loop(x, dur):
    reps = int(np.ceil(dur * SR / len(x))) + 1
    return np.tile(x, reps)[: int(dur * SR)]


# the jungle under everything; a nervous crowd until the fight
place(loop(FOREST, DUR + 0.5), 0.0, 0.2, fade_in=0.4, fade_out=1.5)
place(loop(CROWD_A, STOP), 0.0, 0.1, fade_in=0.3, fade_out=0.5)

# chest beating + roar
for j, at in enumerate(BEATS):
    mix.add(chest(), O + at, 0.55, pan=-0.25 if j % 2 else 0.25)
place(ROAR_S, ROAR - 0.05, 0.5, length=1.5, fade_out=0.5)

# the bluff charge: gallop, skid, the crowd recoils
n = 6
for j in range(n):
    at = CHARGE + (STOP - CHARGE - 0.1) * (j / n) ** 0.9
    mix.add(thump(75, 40, 0.3, decay=11, click=0.3), O + at, 0.55 + 0.05 * j, pan=-0.3 + 0.1 * j)
place(RUMBLE, CHARGE, 0.22, length=STOP - CHARGE + 0.3, fade_in=0.15, fade_out=0.3)
mix.add(skid(0.8), O + STOP - 0.12, 0.45)
mix.add(thump(60, 34, 0.6, decay=6, click=0.3), O + STOP, 0.7)
place(ROAR_S, STOP + 0.02, 0.42, length=0.95, skip=0.15, fade_out=0.45)
place(CROWD_B, STOP + 0.05, 0.2, length=1.1, fade_in=0.05, fade_out=0.6)

# five brave ones
place(CROWD_C, RUN5, 0.16, length=HITS[0] - RUN5 + 0.2, fade_in=0.8, fade_out=0.3)
for j in range(9):
    mix.add(thump(140, 80, 0.12, decay=30, click=0.5), O + RUN5 + 0.25 + j * 0.19, 0.18, pan=0.4 * np.sin(j * 2.1))

# three hits
for j, at in enumerate(HITS):
    mix.add(whoosh(0.4, 250, 4200), O + at - 0.3, 0.45)
    mix.add(impact(1.0), O + at, 0.8, pan=(-0.3, 0.3, 0.0)[j])
    place(HIT_S, at, 0.35, length=0.6, fade_out=0.3)
    mix.add(tick(), O + at + 0.12, 0.3)
mix.add(thud(), O + HITS[0] + 0.95, 0.4, pan=-0.5)
mix.add(thud(), O + HITS[1] + 0.8, 0.4, pan=0.5)

# everyone at once
place(CROWD_B, SWARM, 0.32, length=PILE - SWARM, fade_in=0.4, fade_out=0.5)
place(CROWD_C, SWARM + 0.5, 0.26, length=PINNED - SWARM, fade_in=0.6, fade_out=0.8)
place(RUMBLE, SWARM, 0.2, length=MELEE - SWARM + 0.5, fade_in=0.5, fade_out=0.5)
place(ROAR_S, MELEE + 0.1, 0.38, length=1.4, fade_out=0.5)
for j, at in enumerate(MELEE_HITS):
    mix.add(whoosh(0.3, 300, 4500), O + at - 0.22, 0.35, pan=0.5 * np.sin(j * 1.9))
    mix.add(impact(0.85), O + at, 0.62, pan=0.5 * np.sin(j * 1.9))
    mix.add(tick(), O + at + 0.1, 0.26)
    mix.add(thud(), O + at + 0.75, 0.25, pan=-0.5 * np.sin(j * 1.9))
place(ROAR_S, MELEE_HITS[5], 0.3, length=1.2, skip=0.2, fade_out=0.5)

# the pile
jumps = [PILE + 0.35 + 0.2 * j for j in range(int((PINNED - PILE - 0.3) / 0.2))]
for j, at in enumerate(jumps):
    mix.add(thud(), O + at, 0.34, pan=0.45 * np.sin(j * 2.3))
place(ROAR_S, PILE + 0.6, 0.25, length=1.6, skip=0.1, fade_out=0.7)
place(RUSTLE, PILE, 0.2, length=PINNED - PILE, fade_out=0.5)

# heave and slump
place(RUMBLE, HEAVE - 0.1, 0.3, length=1.0, fade_in=0.2, fade_out=0.3)
place(ROAR_S, HEAVE, 0.3, length=0.9, skip=0.25, fade_out=0.4)
for at in THROWN:
    mix.add(whoosh(0.3, 300, 4000), O + at - 0.2, 0.3)
    mix.add(tick(), O + at + 0.1, 0.28)
    mix.add(thud(), O + at + 0.5, 0.3)
mix.add(thump(55, 30, 0.8, decay=5, click=0.25), O + SLUMP, 0.8)
mix.add(skid(0.5), O + SLUMP, 0.25)

# spent: slow heavy breaths; the crowd falls quiet
b = SPENT + 0.1
j = 0
while b < RELEASE + 1.2:
    mix.add(filt(breath(1.0, inhale=j % 2 == 0), "lowpass", 1400), O + b, 0.5)
    b += 0.95
    j += 1

# release: slow knuckle steps away, leaves
for j in range(7):
    mix.add(thump(70, 38, 0.3, decay=12, click=0.2), O + RELEASE + 1.3 + j * 0.42, 0.26 - 0.02 * j, pan=-0.1 * j)
place(RUSTLE, RELEASE + 1.2, 0.2, length=3.5, fade_in=0.4, fade_out=1.0)

# result
mix.add(ding(880.0, 1.6), O + PLATE1, 0.3)
place(CHEER, PLATE1 + 0.1, 0.16, length=2.6, fade_in=0.2, fade_out=1.4)
place(STAMP, PLATE2, 0.5, length=0.8)
mix.add(ding(659.3, 1.8), O + PLATE2 + 0.05, 0.22)

# ---------------------------------------------------------------- bed: low pulse that tightens with the fight
t = mix.t - O
tension = np.interp(t, [0, S["beat"], STOP, RUN5, HITS[2] + 0.6, SWARM, PINNED, SLUMP, RELEASE, RESULT, DUR], [0.25, 0.45, 0.2, 0.55, 0.35, 0.75, 0.9, 0.25, 0.15, 0.12, 0.0])
rate = np.interp(t, [0, RUN5, SWARM, PINNED, SLUMP, DUR], [1.6, 2.6, 3.4, 3.6, 1.2, 1.0])
ph = 2 * np.pi * np.cumsum(rate) / SR
drum = np.sin(2 * np.pi * 52 * t) * np.exp(-((ph / (2 * np.pi)) % 1) * 7)
bed = filt(drum, "lowpass", 220) * tension
mix.l += bed[: mix.n] * 0.5
mix.r += bed[: mix.n] * 0.5

final = mix.write("gorilla-100")

cues = {
    "duration": DUR,
    "estimated": not HAVE_VO,
    "shots": [[n, round(float(s), 3)] for n, s in SHOTS],
    "words": words,
    "groups": GROUPS,
    "phrases": [[round(float(a), 3), round(float(b), 3)] for a, b in PT],
    "beats": BEATS,
    "roar": round(ROAR, 3),
    "charge": round(CHARGE, 3),
    "stop": round(STOP, 3),
    "run5": round(RUN5, 3),
    "hits": [round(x, 3) for x in HITS],
    "meleeHits": MELEE_HITS,
    "heave": round(HEAVE, 3),
    "thrown": [round(x, 3) for x in THROWN],
    "slump": round(SLUMP, 3),
    "lookback": round(LOOKBACK, 3),
    "plate1": round(PLATE1, 3),
    "plate2": round(float(PLATE2), 3),
    "tons": round(float(word_at(9, "две", 0.5)), 3),
    "kilos": round(float(word_at(10, "200", 0.5)), 3),
    "timer": [[round(float(a), 3), b] for a, b in TIMER],
    "power": [[round(float(a), 3), b] for a, b in POWER],
    "hurt": HURT,
}
(ROOT / "src/gor").mkdir(exist_ok=True)
(ROOT / "src/gor/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame) and src/gor/cues.json; voice: {'take' if HAVE_VO else 'ESTIMATED, none in the mix'}")
print("shots:", " ".join(f"{n}@{s:.2f}" for n, s in SHOTS))
