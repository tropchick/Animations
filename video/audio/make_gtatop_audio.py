"""«Топ-10 героев GTA по шахматному рейтингу» — test piece (intro + 10th place).
Voice: ElevenLabs v4 «Arcades», one take (audio/voice/gtatop-test.mp3), word times from faster-whisper.
Writes public/audio/gtatop.wav and src/gtatop/cues.json. Frame 0 is the cover, so everything starts at OFF.

Sync map (on-screen event <-> sound):
  title slams in               <-> low boom
  leaderboard rows slide in    <-> soft clicks
  «НЕ ТОММИ» stamp             <-> thump
  hero card / place number     <-> whoosh + wooden piece
  tags pop                     <-> clicks
  ELO counter running          <-> fast ticks, ting when it stops
  best move card (‼)           <-> bright ting
  blunder card (??)            <-> low thump
  joke stamp                   <-> thump
"""
import json
import subprocess
import numpy as np
from slime_lib import ROOT, SR, Mix, click, filt, thump, ting, tt_, white

OFF = 1 / 30
W = json.loads((ROOT / "audio/voice/gtatop-test-words.json").read_text())["s"]
t = lambda i: round(W[i][0] + OFF, 3)
te = lambda i: round(W[i][1] + OFF, 3)

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(ROOT / "audio/voice/gtatop-test.mp3"), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                     capture_output=True, check=True).stdout
vo = np.frombuffer(raw, np.int16).astype(np.float64) / 32768

ELO_START, ELO_END = t(14), t(14) + 1.6
ev = {
    "title": t(0), "board": t(4), "tommy": t(9), "stamp": t(10), "place": t(12), "card": t(12) + 0.45,
    "name": t(14), "game": t(15), "tags": [t(16), t(17), t(18)], "eloStart": ELO_START, "eloEnd": ELO_END,
    "best": t(19), "blunder": t(27), "joke": t(35), "toTable": te(39) + 0.5,
}
DUR = ev["toTable"] + 2.6

def piece():
    s = thump(240, 150, 0.18, decay=38, click=0) * 0.5
    c = click(0.06, 1700)
    s[: len(c)] += c * 0.8
    return s

def whoosh(dur=0.5):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [400, 4000]) * np.sin(np.pi * tt / dur) ** 2

mix = Mix(DUR)
mix.add(vo * 1.0, OFF, 1.0)
mix.add(thump(55, 28, 1.6, decay=2.5, click=0.3), ev["title"], 0.55)
for k in range(10):
    mix.add(click(0.04, 2200), ev["board"] + k * 0.06, 0.12)
mix.add(thump(90, 40, 0.7, decay=6), ev["stamp"], 0.5)
mix.add(whoosh(0.5), ev["place"] - 0.3, 0.14)
mix.add(piece(), ev["card"], 0.45)
for x in ev["tags"]:
    mix.add(click(0.05, 2600), x, 0.25)
n = int((ELO_END - ELO_START) / 0.05)
for k in range(n):
    mix.add(click(0.02, 3200), ELO_START + k * 0.05, 0.08)
mix.add(ting(1900, 0.8), ELO_END, 0.07)
mix.add(piece(), ev["best"], 0.4)
mix.add(ting(2600, 1.3), ev["best"] + 0.03, 0.09)
mix.add(piece(), ev["blunder"], 0.4)
mix.add(thump(80, 38, 0.8, decay=5), ev["blunder"] + 0.02, 0.45)
mix.add(thump(100, 45, 0.6, decay=7), ev["joke"] + 0.9, 0.4)
mix.add(whoosh(0.6), ev["toTable"] - 0.2, 0.14)
mix.add(piece(), ev["toTable"] + 0.5, 0.4)
final = mix.write("gtatop")

subs = [(0, 6, 'Топ-10 героев GTA по шахматному рейтингу!'), (7, 11, 'И нет, Томми не первый.'), (12, 13, 'Десятое место.'),
        (14, 15, 'Виктор Вэнс.'), (16, 18, 'Солдат, брат, бизнесмен.'), (19, 26, 'Его сильнейший ход: построил империю в Вайс-Сити.'),
        (27, 34, 'Его зевок: умер в самом начале следующей игры.'), (35, 39, 'Партия длиной в одну заставку.')]
S = [{"s": t(a), "e": te(b) + 0.3, "text": x} for a, b, x in subs]
for k in range(len(S) - 1):
    S[k]["e"] = min(S[k]["e"], S[k + 1]["s"] - 0.05)
cues = {"duration": round(DUR, 3), "ev": ev, "subs": S}
(ROOT / "src/gtatop/cues.json").write_text(json.dumps(cues, ensure_ascii=False, indent=1))
print(f"wrote {final}; duration {DUR:.2f} s = {round(DUR * 30) + 1} frames")
