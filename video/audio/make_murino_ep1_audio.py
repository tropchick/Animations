"""Soundtrack and timing cues for «Курьер в Мурино», серия 1 «Инструкция для новичка».

Voices (ElevenLabs Eleven v4, one take each, flow UcRiBdN06tYOXfpnqQw7):
  audio/voice/murino-ep1-narrator.mp3  the onboarding narrator (Alisa), played 8 % faster
  audio/voice/murino-ep1-lines.mp3     "Курьер! Мне сюда!" (Сосед) / "Ты принёс мою шаурму?" (Двойник) /
                                       "Код. Четыре, один, два." (the real customer), one male voice (Nick Kiku)
  word times: audio/voice/murino-ep1-words.json (tools/words.py)
Sound effects from ElevenLabs text-to-sound (audio/sfx/murino/), the rest synthesized. No music.

Frame 0 of the video is the cover, so every time below is story time (v = (frame - 1) / 30)
and the finished track gets 1/30 s of silence in front.

Sync map (story time of the on-screen event <-> where the sound peaks):
  ACCEPT       finger taps "ПРИНЯТЬ"           <-> synth tap + chime onset
  LIFT_OPEN    lift doors start to open         <-> lift.mp3 from 3.6 s (doors rattle)
  FLOOR_JUMP   order floor 412 -> 430           <-> synth "дзынь"
  FLICKER      the corridor lamp blinks         <-> flicker.mp3 crackles
  CALL         "Курьер! Мне сюда!" from the fog  <-> lines.mp3 0.0-1.9 s
  THROW        sauce leaves the hand            <-> whoosh; LAND <-> sauce.mp3 onset
  DOOR_A       door 412А swings open            <-> door_open.mp3 onset
  DOUBLE       "Ты принёс мою шаурму?"           <-> lines.mp3 3.5-5.1 s
  CHAIN        door 412Б opens on the chain     <-> chain.mp3 onset
  CODE         "Код. Четыре, один, два."         <-> lines.mp3 6.7-9.8 s
  GROW         the double stretches upwards     <-> stretch.mp3
  SLAM         door 412Б slams                  <-> slam.mp3 onset
"""

import json
import subprocess

import numpy as np
from scipy import signal

from slime_lib import ROOT, SR, Mix, assemble, beep, brown, click, envelope, filt, load, step, thump, tt_, white

OFF = 1 / 30
VOICE_START = 0.45
TEMPO = 1.08

words = json.loads((ROOT / "audio/voice/murino-ep1-words.json").read_text())


def faster(path, tempo):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-af", f"atempo={tempo}", "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float64) / 32768


narr_words = [[a / TEMPO, b / TEMPO, w] for a, b, w in words["narrator"]]
takes = {"n": faster(ROOT / "audio/voice/murino-ep1-narrator.mp3", TEMPO)}
LINES = load(ROOT / "audio/voice/murino-ep1-lines.mp3")
LW = words["lines"]
SFX = {n: load(ROOT / f"audio/sfx/murino/{n}.mp3") for n in
       ["amb", "fog", "run_up", "walk", "lift", "flicker", "slippers", "sauce", "door_open", "chain", "slam", "stretch", "creak"]}

# word index -> extra silence before it (cuts, cards, the call from the fog, the scene at the doors)
PAUSES = {8: 0.15, 22: 0.8, 34: 0.25, 36: 0.8, 54: 0.8, 64: 0.5, 69: 0.25, 83: 0.8, 91: 2.3, 99: 0.3, 105: 0.45,
          111: 0.9, 134: 10.7, 142: 0.35}
voice, W = assemble(takes, {"n": narr_words}, [("n", 0, len(narr_words) - 1)], PAUSES, VOICE_START)


def ws(i):
    return W[i][0]


def we(i):
    return W[i][1]


def line(a, b):
    """Words a..b of the lines take: (clip, length)."""
    s = max(0.0, LW[a][0] - 0.06)
    e = LW[b][1] + 0.12
    x = LINES[int(s * SR): int(e * SR)].copy()
    f = int(0.01 * SR)
    x[:f] *= np.linspace(0, 1, f)
    x[-f:] *= np.linspace(1, 0, f)
    return x


CALL_CLIP, DOUBLE_CLIP, CODE_CLIP = line(0, 2), line(3, 7), line(8, 11)

# ---------------------------------------------------------------- timeline
ACCEPT = ws(16) - 0.1            # "инструкция": the finger taps ПРИНЯТЬ
LAMP_BLINK = ws(20)              # "И выжить": the lamp over the entrance blinks
LIFT_OPEN = ws(31)               # doors open on "было"
FLOOR_JUMP = ws(35)              # "четыреста тридцать"
FLICKER = ws(64) - 0.2
CALL = we(90) + 0.35
THROW = ws(105) + 0.05
LAND = THROW + 0.75
DOOR_A = ws(125) - 0.15          # "распахнулась"
DOUBLE = we(133) + 1.0
CHAIN = DOUBLE + len(DOUBLE_CLIP) / SR + 0.45
CODE = CHAIN + 0.75
PASS = CODE + len(CODE_CLIP) / SR + 0.15
GROW = PASS + 1.0
SLAM = GROW + 2.0
END_CARD = 3.2

SHOTS = [
    ("title", 0.0),
    ("order", ws(8) - 0.35),
    ("lift", ws(22) - 0.45),
    ("well", ws(36) - 0.45),
    ("long", ws(54) - 0.45),
    ("neighbor", ws(83) - 0.45),
    ("doors", ws(111) - 0.5),
    ("twins", we(133) + 0.45),
    ("grow", GROW - 0.35),
    ("app", ws(134) - 0.5),
    ("end", we(149) + 1.3),
]
BLACK = SHOTS[-1][1]
DUR = round(BLACK + END_CARD, 2)
shot_at = {n: s for n, s in SHOTS}
shot_end = {SHOTS[k][0]: (SHOTS[k + 1][1] if k + 1 < len(SHOTS) else DUR) for k in range(len(SHOTS))}
RUN_STEPS = list(np.arange(shot_at["well"] + 0.5, shot_end["well"] - 0.2, 0.3))
WALK_STEPS = list(np.arange(ws(74) - 0.3, shot_end["long"] - 0.1, 0.62))

# ---------------------------------------------------------------- mix
mix = Mix(DUR)
N = mix.n
t = mix.t
v = np.zeros(N)
i0 = mix.idx(VOICE_START)
v[i0: i0 + len(voice)] += voice[: N - i0]
# the narrator: a clean studio voice, the "corporate video" over the horror
dry = filt(filt(v, "highpass", 90, 2), "lowpass", 11000, 2)
mix.add(dry, gain=1.0)
venv = envelope(dry, DUR)


def room(x, secs=1.6, bright=2600, amount=0.5, pre=0.02):
    """Concrete stairwell / landing reverb."""
    it = tt_(secs)
    r = filt(white(len(it)), "lowpass", bright) * np.exp(-it * 6.9 / secs)
    r[: int(pre * SR)] = 0
    y = signal.fftconvolve(x, r)
    y *= amount * np.max(np.abs(x)) / (np.max(np.abs(y)) + 1e-9)
    out = np.zeros(len(y))
    out[: len(x)] += x
    return out + y


def loop(clip, dur, xfade=1.0):
    n, xf = int(dur * SR), int(xfade * SR)
    out = np.zeros(n + len(clip))
    pos = 0
    ramp_in = np.linspace(0, 1, xf)
    while pos < n:
        c = clip.copy()
        c[:xf] *= ramp_in
        c[-xf:] *= ramp_in[::-1]
        out[pos: pos + len(c)] += c
        pos += len(c) - xf
    return out[:n]


def seg(clip, a, b, fade=0.03):
    x = clip[int(a * SR): int(b * SR)].copy()
    f = int(fade * SR)
    x[:f] *= np.linspace(0, 1, f)
    x[-f:] *= np.linspace(1, 0, f)
    return x


def pitch(x, semis):
    """Resample: lower and slower (semis < 0) for the things that only sound like people."""
    k = 2 ** (semis / 12)
    return signal.resample(x, int(len(x) / k))


# beds: the stairwell ambience everywhere inside, the street wind outside, a low fog drone that swells with the threat
inside = mix.env(shot_at["lift"], BLACK, 0.3, 0.05)
outside = mix.env(0, shot_at["lift"], 0.6, 0.2)
mix.add(loop(SFX["amb"], DUR) * inside, gain=0.55)
wind = filt(brown(N), "lowpass", 380) + 0.25 * filt(white(N), "bandpass", [600, 2400])
mix.add(wind * outside, gain=0.12)
dr = filt(brown(N), "lowpass", 70)
threat = 0.25 * mix.env(0, shot_at["order"], 0.1, 0.8) + 0.6 * mix.env(shot_at["well"], shot_end["well"], 1.5, 0.6) \
    + 0.35 * mix.env(shot_at["long"], shot_end["long"], 1.0, 0.4) + 0.8 * mix.env(shot_at["neighbor"], shot_end["neighbor"], 1.0, 0.6) \
    + 0.9 * mix.env(shot_at["twins"], shot_end["grow"], 0.8, 0.3)
mix.add(dr * threat, gain=0.5)

# order: phone tap and the app chime; the lamp blinks
mix.add(click(0.04, 2600), ACCEPT, gain=0.25)
for k, f in enumerate((1318, 1760)):
    mix.add(beep(f, 0.09) * np.hanning(int(0.09 * SR)), ACCEPT + 0.12 + k * 0.1, gain=0.12)
mix.add(seg(SFX["flicker"], 0.4, 1.4), LAMP_BLINK - 0.05, gain=0.5)

# lift: hum while it rides, the doors rattle open
mix.add(seg(SFX["lift"], 1.2, 6.0, 0.3), LIFT_OPEN - 2.6, gain=0.6)
mix.add(beep(1568, 0.07) * np.hanning(int(0.07 * SR)), FLOOR_JUMP, gain=0.12)
mix.add(beep(2093, 0.09) * np.hanning(int(0.09 * SR)), FLOOR_JUMP + 0.09, gain=0.12)

# well: fog rising and the courier running up
mix.add(SFX["fog"], shot_at["well"] + 0.2, gain=0.7)
mix.add(room(seg(SFX["run_up"], 0.0, shot_end["well"] - shot_at["well"] - 0.4, 0.2), 1.8, 2400, 0.35), shot_at["well"] + 0.3, gain=0.8)

# long: the flicker, then slow careful steps; a creak when the legs appear
mix.add(SFX["flicker"], FLICKER, gain=0.45)
mix.add(seg(SFX["flicker"], 0.0, 3.0), FLICKER + 6.0, gain=0.3)
mix.add(seg(SFX["walk"], 0.2, 0.2 + shot_end["long"] - ws(74) + 0.3, 0.2), ws(74) - 0.3, gain=0.55)
LEGS_IN = ws(80) - 0.1
mix.add(SFX["creak"], LEGS_IN, gain=0.5)

# neighbor: the call out of the fog, slippers slapping up the stairs, the sauce
call = room(pitch(CALL_CLIP, -1.5), 2.6, 1800, 0.8, 0.04)
call = filt(call, "lowpass", 3500, 2)
mix.add(call, CALL, gain=1.0, pan=-0.15)
CHASE = we(95) - 0.2
mix.add(room(SFX["slippers"], 1.6, 2200, 0.4), CHASE, gain=0.75)
mix.add(room(seg(SFX["slippers"], 0.0, 1.6), 1.6, 2200, 0.4), CHASE + 4.6, gain=0.5)
whoosh = filt(white(int(0.35 * SR)), "bandpass", [700, 3000]) * np.sin(np.pi * tt_(0.35) / 0.35) ** 2
mix.add(whoosh, THROW, gain=0.08)
mix.add(SFX["sauce"], LAND - 0.05, gain=0.8)
mix.add(SFX["fog"][: int(6 * SR)], shot_at["neighbor"], gain=0.45)

# doors: the door swings open by itself, the double, the chain, the code, the stretch, the slam
mix.add(room(SFX["door_open"], 1.2, 2400, 0.3), DOOR_A, gain=0.75)
dbl = DOUBLE_CLIP.copy()
tail = int(0.45 * SR)  # the end of "шаурму?" sinks
dbl[-tail:] = pitch(dbl[-tail:], -2.5)[:tail] if len(pitch(dbl[-tail:], -2.5)) >= tail else dbl[-tail:]
mix.add(room(dbl, 1.4, 2600, 0.45), DOUBLE, gain=1.05, pan=-0.2)
mix.add(SFX["chain"], CHAIN - 0.05, gain=0.75, pan=0.25)
mix.add(room(filt(CODE_CLIP, "lowpass", 5500, 2), 0.8, 2600, 0.25), CODE, gain=0.95, pan=0.25)
rust = filt(white(int(0.6 * SR)), "bandpass", [900, 5000]) * np.sin(np.pi * tt_(0.6) / 0.6) ** 2
mix.add(rust, PASS, gain=0.05, pan=0.2)
mix.add(SFX["stretch"], GROW, gain=0.85, pan=-0.2)
mix.add(room(SFX["slam"], 1.8, 2200, 0.4), SLAM - 0.04, gain=0.9, pan=0.25)

# app: delivered chime, then the new order ping
APP_DONE = ws(134) - 0.15
APP_NEXT = ws(142) - 0.2
for k, f in enumerate((1046, 1318, 1568)):
    mix.add(beep(f, 0.1) * np.hanning(int(0.1 * SR)), APP_DONE + k * 0.09, gain=0.1)
for k, f in enumerate((1568, 1568)):
    mix.add(beep(f, 0.08) * np.hanning(int(0.08 * SR)), APP_NEXT + k * 0.16, gain=0.12)

# the end: silence after "Друн", a low hit on the black card
mix.l[mix.idx(BLACK):] = 0
mix.r[mix.idx(BLACK):] = 0
mix.add(thump(46, 28, 3.0, decay=1.4, click=0.05), BLACK + 0.5, gain=0.2)


def write_linear(name, target_lufs=-15.0):
    """One plain gain change to the target loudness (loudnorm would lift the silences), cover frame in front."""
    import wave

    def save(path, x):
        with wave.open(str(path), "wb") as f:
            f.setnchannels(2)
            f.setsampwidth(2)
            f.setframerate(SR)
            f.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())

    def lufs(path):
        err = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "loudnorm=print_format=json", "-f", "null", "-"],
                             capture_output=True, text=True, check=True).stderr
        return float(json.loads(err[err.rindex("{"): err.rindex("}") + 1])["input_i"])

    x = np.stack([mix.l, mix.r], axis=1)
    x = filt(x.T, "highpass", 22, 2).T
    x = np.concatenate([np.zeros((int(round(OFF * SR)), 2)), x])
    x = x / np.max(np.abs(x)) * 0.5
    final = ROOT / "public" / "audio" / f"{name}.wav"
    final.parent.mkdir(parents=True, exist_ok=True)
    for _ in range(4):
        save(final, np.tanh(x * 1.1) / 1.1)
        x = x * 10 ** ((target_lufs - lufs(final)) / 20)
    y = np.tanh(x * 1.1) / 1.1
    save(final, y * min(1.0, 0.89 / np.max(np.abs(y))))
    return final


final = write_linear("murino-ep1")
r3 = lambda x: round(float(x), 3)  # noqa: E731
cues = {
    "duration": DUR,
    "shots": [[n, r3(s)] for n, s in SHOTS],
    "words": [[r3(a), r3(b), x] for a, b, x in W],
    "voiceStart": VOICE_START,
    "accept": r3(ACCEPT),
    "lampBlink": r3(LAMP_BLINK),
    "liftOpen": r3(LIFT_OPEN),
    "floorJump": r3(FLOOR_JUMP),
    "flicker": r3(FLICKER),
    "legsIn": r3(LEGS_IN),
    "call": [r3(CALL), r3(CALL + len(CALL_CLIP) / SR)],
    "chase": r3(CHASE),
    "throw": r3(THROW),
    "land": r3(LAND),
    "doorA": r3(DOOR_A),
    "double": [r3(DOUBLE), r3(DOUBLE + len(DOUBLE_CLIP) / SR)],
    "chain": r3(CHAIN),
    "code": [r3(CODE), r3(CODE + len(CODE_CLIP) / SR)],
    "pass": r3(PASS),
    "grow": r3(GROW),
    "slam": r3(SLAM),
    "appDone": r3(APP_DONE),
    "appNext": r3(APP_NEXT),
    "runSteps": [r3(x) for x in RUN_STEPS],
    "walkSteps": [r3(x) for x in WALK_STEPS],
    "voice": [r3(x) for x in venv],
}
(ROOT / "src/murino").mkdir(exist_ok=True)
(ROOT / "src/murino/cues.json").write_text(json.dumps(cues, ensure_ascii=False))
print(f"wrote {final} ({DUR} s + cover frame) and src/murino/cues.json")
for n, s in SHOTS:
    print(f"  {n:<9} {s:6.2f} – {shot_end[n]:6.2f}  ({shot_end[n] - s:4.1f} s)")
print({k: cues[k] for k in ["accept", "liftOpen", "floorJump", "call", "throw", "doorA", "double", "chain", "code", "pass", "grow", "slam"]})
