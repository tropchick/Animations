"""«Что если Half-Life 3 выйдет сегодня?»: builds public/audio/hl3-today.wav and src/hl3/cues.json.
Picture = AI clips (public/hl3/*.mp4, made by tools/kie_gen.py from ai/hl3/shots.json) cut to the narration.
Story time v starts at frame 1 (frame 0 is the cover). Sound = VASKO narration + each clip's own ambience under it."""
import json, subprocess
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR, FPS = 48000, 30
VO_AT = 0.0          # narration starts at story time 0
END = 48.6           # story length, s

# name, story start, clip file, clip offset, playback rate, ambience gain (0 = silent), date stamp
SHOTS = [
    ('hook',     0.00, 'hook',     0.60, 1.0, 0.0,  'СЕГОДНЯ, 10:00'),
    ('teaser',   4.44, 'portal',   0.50, 1.0, 0.30, ''),
    ('leave',    7.70, 'leave',    0.00, 1.0, 0.30, '10:01'),
    ('engineer', 13.50, 'engineer', 0.40, 1.0, 0.35, '10:30'),
    ('fields',   21.00, 'accident', 0.00, 0.2, 0.0,  '11:00'),
    ('blast',    24.90, 'accident', 0.94, 1.0, 0.60, '11:00'),
    ('portal',   26.30, 'portal',   3.00, 1.0, 0.35, '11:05'),
    ('army',     30.20, 'army',     2.00, 1.0, 0.30, '11:20'),
    ('hero',     33.70, 'hero',     1.40, 1.0, 0.22, '11:30'),
    ('evening',  39.70, 'evening',  0.00, 1.0, 0.35, 'ВЕЧЕР'),
]
POPUP = 42.10        # «Но Valve снимает игру с продажи» → the store notice
FLASH = 25.00        # «Авария» → white flash

# caption chunks: word index where each new chunk starts
BREAKS = [0, 5, 8, 14, 17, 24, 30, 35, 39, 44, 50, 51, 55, 59, 62, 65, 69, 73, 76, 80, 86]


def load(path, start=0.0, dur=None):
    cmd = ['ffmpeg', '-v', 'error', '-ss', f'{start:.3f}']
    if dur:
        cmd += ['-t', f'{dur:.3f}']
    cmd += ['-i', str(path), '-vn', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).copy()


def rms(a):
    return float(np.sqrt((a ** 2).mean()) + 1e-9)


mix = np.zeros(int((END + 1 / FPS + 0.5) * SR), np.float32)
off = int(SR / FPS)  # frame 0 = cover

# ambience beds, each scaled to a common loudness, then by its gain
for i, (name, t0, clip, c0, rate, gain, _) in enumerate(SHOTS):
    if gain <= 0 or rate != 1.0:
        continue
    t1 = SHOTS[i + 1][1] if i + 1 < len(SHOTS) else END
    a = load(ROOT / f'public/hl3/{clip}.mp4', c0, t1 - t0)
    a *= (10 ** (-24 / 20)) / rms(a) * gain * 2.5
    fade = int(0.06 * SR)
    a[:fade] *= np.linspace(0, 1, fade)
    a[-fade:] *= np.linspace(1, 0, fade)
    s = off + int(t0 * SR)
    mix[s:s + len(a)] += a[:len(mix) - s]

vo = load(ROOT / 'audio/voice/hl3-vo.mp3')
vo *= (10 ** (-17 / 20)) / rms(vo[np.abs(vo) > 0.01])
s = off + int(VO_AT * SR)
mix[s:s + len(vo)] += vo
mix *= 0.89 / max(1e-6, np.abs(mix).max())
out = ROOT / 'public/audio/hl3-today.wav'
out.parent.mkdir(parents=True, exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-i', '-', '-c:a', 'pcm_s16le', str(out)],
               input=mix.tobytes(), check=True)

words = json.loads((ROOT / 'audio/voice/hl3-words.json').read_text())
words[50][0] = 25.0  # whisper glued «Авария» to the pause before it; the word really starts at 25.0 s
# whisper writes numbers and English: show them the way the video spells them
FIX = {'19': '19', '3.': '3.', 'Half': 'Half-Life', '-Life': None, '-Life.': None, 'по': 'по-настоящему', '-настоящему.': None}
out_words, chunk = [], -1
for i, (a, b, w) in enumerate(words):
    if i in BREAKS:
        chunk += 1
    if w in FIX:
        if FIX[w] is None:
            out_words[-1][1] = b + VO_AT
            if w.endswith('.'):
                out_words[-1][2] += '.'
            continue
        w = FIX[w]
    out_words.append([a + VO_AT, b + VO_AT, w, chunk])
cues = {
    'duration': END,
    'shots': [{'name': n, 'from': t, 'clip': c, 'offset': o, 'rate': r, 'date': d} for n, t, c, o, r, _, d in SHOTS],
    'popup': POPUP, 'flash': FLASH,
    'words': out_words,
}
(ROOT / 'src/hl3/cues.json').write_text(json.dumps(cues, ensure_ascii=False, indent=1))
print('wrote', out, f'{len(mix) / SR:.2f} s;', len(out_words), 'caption words')
