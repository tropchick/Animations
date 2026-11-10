"""Word timings for the GTA 6 vs Gaben's mom narration (faster-whisper small, cpu). Writes audio/voice/gtamom-words.json."""
from faster_whisper import WhisperModel
from pathlib import Path
import json, subprocess
import numpy as np
v = Path(__file__).resolve().parent / 'voice'
m = WhisperModel('small', device='cpu', compute_type='int8', cpu_threads=4)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(v / 'gtamom-vo.mp3'), '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
ss, _ = m.transcribe(np.frombuffer(raw, np.float32), language='ru', word_timestamps=True, beam_size=5,
                     initial_prompt="ГТА шесть весит двести двенадцать гигабайт. Мать Габена. Селфи, вайфай. Облако. Стиралка, пробки. Приставка. Лифт.")
w = []
for s in ss:
    print(f'{s.start:.2f}–{s.end:.2f} {s.text}', flush=True)
    w.extend([[round(t.start, 3), round(t.end, 3), t.word.strip()] for t in s.words])
(v / 'gtamom-words.json').write_text(json.dumps(w, ensure_ascii=False, indent=1))

# fix-ups so that caption tokens match: «двести двенадцать» -> 212, glue «-го», «-два» -> «два», drop a lone dash
w2 = []
for a, b, t in w:
    if t == '—':
        continue
    if t.startswith('-го') and w2:
        w2[-1][1] = b
        w2[-1][2] += t
    elif t.startswith('-'):
        w2.append([a, b, t[1:]])
    elif t.startswith('двенадцать') and w2 and w2[-1][2] == 'двести':
        w2[-1] = [w2[-1][0], b, '212']
    else:
        w2.append([a, b, t])
(v / 'gtamom-words.json').write_text(json.dumps(w2, ensure_ascii=False, indent=1))
