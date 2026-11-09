"""Word timings for the Gaben diet narration (faster-whisper small, cpu). Writes audio/voice/diet-words.json."""
from faster_whisper import WhisperModel
from pathlib import Path
import json, subprocess
import numpy as np
v = Path(__file__).resolve().parent / 'voice'
m = WhisperModel('small', device='cpu', compute_type='int8', cpu_threads=4)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(v / 'diet-vo.mp3'), '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
ss, _ = m.transcribe(np.frombuffer(raw, np.float32), language='ru', word_timestamps=True, beam_size=5,
                     initial_prompt="Мать Габена села на диету. Халф-Лайф три. Сатурн. Хула-хуп. Компьютеры Вэлв. Холодильник. Один пончик.")
w = []
for s in ss:
    print(f'{s.start:.2f}–{s.end:.2f} {s.text}', flush=True)
    w.extend([[round(t.start, 3), round(t.end, 3), t.word.strip()] for t in s.words])
(v / 'diet-words.json').write_text(json.dumps(w, ensure_ascii=False, indent=1))

# fix-ups so that caption tokens match: glue "-Лайф" to "Халф", split "Бессладкого", move phrase-start words off the seam
w2 = []
for a, b, t in w:
    if t.startswith('-') and w2:
        w2[-1][1] = b
        w2[-1][2] += t
    elif t.lower().startswith('бессладк'):
        m = (a + b) / 2
        w2 += [[a, m, 'Без'], [m, b, 'сладкого.']]
    else:
        w2.append([a, b, t])
for x in w2:
    if x[2].startswith('Халф') and abs(x[0] - 27.24) < 0.05:
        x[0] = 27.6
    if x[2] == 'А' and abs(x[0] - 53.68) < 0.05:
        x[0] = 53.9
(v / 'diet-words.json').write_text(json.dumps(w2, ensure_ascii=False, indent=1))
