"""Soundtrack and timing cues for «Гляделки» (TikTok meme: the guy in the bus is in love with the grandma).

Voices (ElevenLabs Eleven v4, one take each, flow J9FB81aWwRIfeCqSva6p):
  audio/voice/bus-girl.mp3    «Он уже минуту на меня смотрит…» (Alisa, whisper)
  audio/voice/bus-guy.mp3     «Девушка… вы на следующей выходите?» (Egor, calm)
  audio/voice/bus-granny.mp3  «Выхожу, милок.» (Babushka Valya)
  word times: audio/voice/bus-words.json (tools/words.py)
Everything else is synthesized here: bus engine, brake, doors, steps, glint, the romantic music.

Frame 0 of the video is the cover, so every time below is story time (v = (frame - 1) / 30)
and the finished track gets 1/30 s of silence in front.

Sync map (story time of the on-screen event <-> sound):
  BRAKE        the bus jolts, the girl sways     <-> brake squeal onset, the first music cut
  STEP_ASIDE   the girl steps to the left        <-> her two steps
  REVEAL       cut to the grandma in slow motion <-> harp glissando + string swell
  GLINT        the glint runs over her glasses   <-> "ting"
  WALK         the guy walks up to her           <-> his footsteps
  DOOR_OPEN    the door leaves slide apart       <-> pneumatic hiss + clunk
  DOOR_CLOSE   the door leaves close             <-> hiss + clunk
"""

import json

import numpy as np

from slime_lib import ROOT, SR, FPS, Mix, brown, envelope, filt, load, step, thump, ting, tt_, white

OFF = 1 / 30

# ---------------------------------------------------------------- the timeline (story time, s)
SHOTS = [
    ("title", 0.0),
    ("girl", 3.0),
    ("brake", 6.0),
    ("step", 7.2),
    ("reveal", 8.6),
    ("smitten", 11.2),
    ("approach", 12.3),
    ("ask", 13.9),
    ("answer", 17.2),
    ("exit", 20.4),
    ("end", 23.3),
]
DUR = 25.4

GIRL_AT = 3.35
GUY_AT = 14.1
GRANNY_AT = 17.6
BRAKE = 6.05
STEP_ASIDE = 6.3  # her two steps to the left, 0.35 s apart
TURN = 7.75  # she turns her head back
REVEAL = 8.6
GLINT = 9.5
SCARF = 9.9  # the grandma straightens her headscarf
WALK = (12.35, 13.55)  # the guy walks up
TUG = 13.55  # he tugs his t-shirt straight
GLASSES = 17.25  # she pushes her glasses up
DOOR_OPEN = 20.45
STAND = 20.55  # she gets up
EXIT_WALK = (21.0, 24.0)
DOOR_CLOSE = 24.25
DEPART = 24.55

words = json.loads((ROOT / "audio/voice/bus-words.json").read_text())
GIRL = load(ROOT / "audio/voice/bus-girl.mp3")
GUY = load(ROOT / "audio/voice/bus-guy.mp3")
GRANNY = load(ROOT / "audio/voice/bus-granny.mp3")

mix = Mix(DUR + OFF + 0.4)
O = OFF

# ---------------------------------------------------------------- voices
mix.add(GIRL, O + GIRL_AT, 0.95, pan=0.05)
mix.add(GUY, O + GUY_AT, 1.0, pan=-0.05)
mix.add(GRANNY, O + GRANNY_AT, 1.0, pan=0.05)


def voice_track(clip, at):
    v = np.zeros(int(SR * DUR))
    i = int(at * SR)
    n = min(len(clip), len(v) - i)
    v[i:i + n] = clip[:n]
    return v


mouth = {
    "girl": envelope(voice_track(GIRL, GIRL_AT), DUR),
    "guy": envelope(voice_track(GUY, GUY_AT), DUR),
    "granny": envelope(voice_track(GRANNY, GRANNY_AT), DUR),
}

# ---------------------------------------------------------------- bus: engine, rattle, brake, doors
t = mix.t - O
speed = np.interp(t, [0, BRAKE, BRAKE + 0.9, DEPART, DEPART + 2.5], [1, 1, 0, 0, 0.8])
hum_f = 46 + 18 * speed
ph = 2 * np.pi * np.cumsum(hum_f) / SR
engine = (np.sin(ph) + 0.45 * np.sin(2 * ph + 0.3) + 0.2 * np.sin(3.02 * ph)) * (0.55 + 0.45 * speed)
road = filt(brown(mix.n), "lowpass", 260) * (0.25 + 1.1 * speed)
rattle = filt(white(mix.n), "bandpass", [1800, 5000]) * (np.random.default_rng(3).random(mix.n) > 0.9993) * 3
rattle = filt(rattle, "lowpass", 6000) * speed
bus = engine * 0.12 + road * 0.5 + rattle * 0.05
mix.add(bus, 0, 1.0)


def squeal(dur=1.0, f0=2150.0):
    tt = tt_(dur)
    f = f0 - 280 * tt / dur + 25 * np.sin(2 * np.pi * 7 * tt)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    s += filt(white(len(tt)), "bandpass", [1500, 3500]) * 0.25
    return s * np.clip(tt / 0.06, 0, 1) * np.clip((dur - tt) / 0.35, 0, 1)


def hiss(dur=0.9):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [1200, 9000]) * np.exp(-tt * 3.2) * np.clip(tt / 0.02, 0, 1)


mix.add(squeal(), O + BRAKE, 0.09, pan=0.2)
mix.add(thump(70, 40, 0.6, decay=9, click=0.05), O + BRAKE + 0.85, 0.35)
mix.add(hiss(0.7), O + BRAKE + 1.0, 0.12, pan=0.4)
for at in (DOOR_OPEN, DOOR_CLOSE):
    mix.add(hiss(1.0), O + at, 0.2, pan=0.55)
    mix.add(thump(110, 60, 0.4, decay=16, click=0.25), O + at + 0.55, 0.35, pan=0.55)

# street outside while the door is open
street = filt(brown(int(SR * (DOOR_CLOSE - DOOR_OPEN + 0.6))), "lowpass", 900)
mix.add(street * np.clip(tt_(len(street) / SR) / 0.5, 0, 1) * np.clip((len(street) / SR - tt_(len(street) / SR)) / 0.4, 0, 1), O + DOOR_OPEN + 0.2, 0.22, pan=0.6)

# steps
for k in range(2):
    mix.add(step(0.25), O + STEP_ASIDE + 0.35 * k, 0.22, pan=-0.2)
walk_steps = list(np.arange(WALK[0] + 0.05, WALK[1], 0.3))
for k, at in enumerate(walk_steps):
    mix.add(step(0.3), O + at, 0.3, pan=-0.1 + 0.05 * k)
exit_steps = list(np.arange(EXIT_WALK[0], EXIT_WALK[1] - 0.2, 0.55))
for k, at in enumerate(exit_steps):
    mix.add(step(0.3), O + at, 0.26, pan=0.3)
    mix.add(step(0.25), O + at + 0.2, 0.18, pan=0.35)

mix.add(ting(3400, 1.6), O + GLINT, 0.1, pan=0.1)

# ---------------------------------------------------------------- music


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def ep_note(freq, dur=1.6, vel=1.0):
    """A soft electric-piano note."""
    tt = tt_(dur)
    s = np.sin(2 * np.pi * freq * tt) + 0.25 * np.sin(2 * np.pi * 2 * freq * tt) * np.exp(-tt * 6) + 0.08 * np.sin(2 * np.pi * 3 * freq * tt) * np.exp(-tt * 9)
    return s * np.exp(-tt * 2.2) * np.clip(tt / 0.006, 0, 1) * np.clip((dur - tt) / 0.08, 0, 1) * vel


def pad(notes, dur, attack=0.6, release=0.6, bright=1800.0):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for n in notes:
        f = midi(n)
        for det in (-0.12, 0.0, 0.11):
            ph = 2 * np.pi * f * 2 ** (det / 12) * tt
            s += np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    s = filt(s, "lowpass", bright, 2)
    return s / (len(notes) * 3) * np.clip(tt / attack, 0, 1) * np.clip((dur - tt) / release, 0, 1)


def harp(notes, dur=1.6):
    s = np.zeros(int(SR * (dur + 2.5)))
    for k, n in enumerate(notes):
        i = int(k * dur / len(notes) * SR)
        x = ep_note(midi(n), 2.4, 0.7) * 0.6
        x[: int(1.2 * SR)] += ep_note(midi(n) * 2, 1.2, 0.3) * 0.2
        s[i:i + len(x)] += x[: len(s) - i]
    return s


# chords as MIDI notes (D major: Dmaj7, Bm7, Gmaj7, A6)
CH = {
    "D": [50, 57, 61, 64, 66],
    "Bm": [47, 54, 57, 62, 66],
    "G": [43, 50, 54, 59, 62],
    "A": [45, 52, 57, 61, 64],
    "Fm": [42, 49, 54, 57, 61],
    "Em": [40, 47, 52, 55, 59],
}

music = Mix(DUR + OFF + 0.4)
# part 1: a quiet lo-fi arpeggio while he "looks at her", cut dead by the brake
bar = 1.5
for k, name in enumerate(["D", "Bm", "G", "A"]):
    at = 0.1 + k * bar
    music.add(pad(CH[name][1:], bar + 0.5, 0.3, 0.3, 1400), O + at, 0.5)
    for j, n in enumerate(CH[name][1:] + [CH[name][2] + 12]):
        music.add(ep_note(midi(n + 12), 1.2, 0.8), O + at + j * bar / 5, 0.22)
    music.add(ep_note(midi(CH[name][0]), 1.6, 1.0), O + at, 0.3)
part1_end = O + BRAKE
cut = np.clip((part1_end - music.t) / 0.03, 0, 1)
music.l *= cut
music.r *= cut

# part 2: the big romantic swell at the reveal, then softer under the dialogue
music.add(harp([62, 66, 69, 73, 74, 78, 81, 85, 86], 1.1), O + REVEAL - 0.05, 0.5, pan=-0.2)
prog = [("G", 2.6), ("A", 2.6), ("Fm", 2.6), ("Bm", 2.6), ("G", 2.6), ("A", 2.6), ("D", 3.5)]
at = REVEAL
for name, d in prog:
    music.add(pad([n + 12 for n in CH[name]], d + 0.8, 0.5, 0.8, 2600), O + at, 1.0, pan=0.15)
    music.add(pad([CH[name][0]], d + 0.8, 0.3, 0.8, 600), O + at, 0.9)
    for j, n in enumerate(CH[name][1:]):
        music.add(ep_note(midi(n + 24), 1.4, 0.6), O + at + 0.15 + j * d / 4, 0.12, pan=0.25)
    at += d
# swell up into the reveal, ducked under the voices
duck = np.ones(music.n)
for clip, start in ((GUY, GUY_AT), (GRANNY, GRANNY_AT)):
    duck -= 0.55 * music.env(O + start - 0.15, O + start + len(clip) / SR + 0.1, 0.25, 0.4)
swell = np.interp(music.t - O, [REVEAL, REVEAL + 1.0, 11.2, 13.9, DUR - 0.6, DUR + 0.2], [0.3, 1.0, 0.85, 0.6, 0.6, 0.0])
part2 = (music.t - O >= REVEAL - 0.1)
music.l = music.l * np.where(part2, swell * duck, 1.0)
music.r = music.r * np.where(part2, swell * duck, 1.0)
mix.l += music.l * 0.55
mix.r += music.r * 0.55

# ---------------------------------------------------------------- write
final = mix.write("babushka-bus")


def r3(x):
    return round(float(x), 3)


cues = {
    "duration": DUR,
    "shots": [[n, s] for n, s in SHOTS],
    "girlAt": GIRL_AT,
    "guyAt": GUY_AT,
    "grannyAt": GRANNY_AT,
    "words": {k: [[r3(a + at), r3(b + at), w] for a, b, w in words[k]] for k, at in (("girl", GIRL_AT), ("guy", GUY_AT), ("granny", GRANNY_AT))},
    "brake": BRAKE,
    "stepAside": STEP_ASIDE,
    "turn": TURN,
    "reveal": REVEAL,
    "glint": GLINT,
    "scarf": SCARF,
    "walk": list(WALK),
    "tug": TUG,
    "glasses": GLASSES,
    "stand": STAND,
    "doorOpen": DOOR_OPEN,
    "exitWalk": list(EXIT_WALK),
    "doorClose": DOOR_CLOSE,
    "depart": DEPART,
    "mouth": {k: [r3(x) for x in v] for k, v in mouth.items()},
}
(ROOT / "src/bus").mkdir(exist_ok=True)
(ROOT / "src/bus/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame) and src/bus/cues.json")
