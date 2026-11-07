"""Soundtrack for the Woody VPN ad banner (7 s, green screen).

Voice: ONE take, ElevenLabs Eleven v4, «VASKO - Deep, Warm and Pleasant» (flow qURqftr4YvuWDue295TX):
audio/voice/woody-vo.mp3, word times audio/voice/woody-words.json (faster-whisper small).
The take is sped up by TEMPO (1.04) and starts at LEAD, the same numbers as src/woody/cues.ts.
No cover frame: this is a banner, frame 0 = time 0.

Sync map (video time of the on-screen event <-> sound):
  0.00  panel pops in, cowboy slides in            <-> whoosh
  vpn   shield flashes, sparkles                   <-> shimmer ting
  n99   the 99 slams down (lands at +0.16)         <-> fall whoosh + heavy thump + ka-ching
  rub   ₽ pops                                     <-> pop
  month red tag slaps on (+0.12)                   <-> slap
  cheaper stamp slams (+0.14)                      <-> thump + clank
  shawa  burrito emoji pops                        <-> pop
  link   button jumps up                           <-> whoosh + ting
No music (user, 2026-11-07): voice + sound effects only.
"""

import subprocess

import numpy as np

from slime_lib import ROOT, SR, Mix, clank, click, filt, thump, ting, tt_, white

LEAD, TEMPO, DUR = 0.1, 1.04, 7.0
v = lambda w: LEAD + w / TEMPO
VPN, N99, RUB, MONTH, CHEAP, SHAWA, LINK = v(0.5), v(1.72), v(2.5), v(3.4), v(4.1), v(4.65), v(5.68)

mix = Mix(DUR)

raw = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", str(ROOT / "audio" / "voice" / "woody-vo.mp3"), "-af", f"atempo={TEMPO}",
     "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
    capture_output=True, check=True).stdout
vo = np.frombuffer(raw, np.int16).astype(np.float64) / 32768
mix.add(vo, LEAD, gain=1.0)


def whoosh(dur, lo=400, hi=4000, rise=2.0):
    tt = tt_(dur)
    env = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** rise
    return filt(white(len(tt)), "bandpass", [lo, hi]) * env


def pop(freq=900, dur=0.12):
    tt = tt_(dur)
    f = freq * (1 + 1.5 * np.exp(-tt * 40))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 30)


midi = lambda m: 440 * 2 ** ((m - 69) / 12)

mix.add(whoosh(0.5, 300, 3000), 0.0, gain=0.25)
mix.add(ting(midi(93), 1.2), VPN, gain=0.10, pan=-0.4)
mix.add(ting(midi(100), 0.9), VPN + 0.06, gain=0.07, pan=-0.3)

mix.add(whoosh(0.2, 600, 5000, 1.0), N99 - 0.04, gain=0.25)
mix.add(thump(80, 36, 0.8, decay=6, click=0.5), N99 + 0.16, gain=0.85)
mix.add(clank(0.25, 1800), N99 + 0.22, gain=0.10)
for k, m in enumerate((88, 93)):  # ka-ching
    mix.add(ting(midi(m), 0.8), N99 + 0.26 + 0.07 * k, gain=0.10)

mix.add(pop(700), RUB, gain=0.3)
mix.add(filt(white(int(0.06 * SR)), "bandpass", [800, 5000]) * np.exp(-tt_(0.06) * 60), MONTH + 0.12, gain=0.5)
mix.add(thump(70, 34, 0.6, decay=7, click=0.4), CHEAP + 0.14, gain=0.7)
mix.add(clank(0.3, 600), CHEAP + 0.15, gain=0.10)
mix.add(pop(1100), SHAWA, gain=0.25)
mix.add(whoosh(0.3, 500, 4000), LINK - 0.05, gain=0.18)
mix.add(ting(midi(96), 1.0), LINK + 0.3, gain=0.08)
mix.add(click(0.04, 2500), LINK + 0.3, gain=0.15)

fade = np.clip((DUR - mix.t) / 0.25, 0, 1)
mix.l *= fade
mix.r *= fade
print("wrote", mix.write("woody-banner"))
