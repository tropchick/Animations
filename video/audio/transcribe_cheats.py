"""Word timings for the cheats narration (faster-whisper small, cpu). Writes audio/voice/cheats-words.json."""
from faster_whisper import WhisperModel
from pathlib import Path
import json, subprocess
import numpy as np
v = Path(__file__).resolve().parent / 'voice'
m = WhisperModel('small', device='cpu', compute_type='int8', cpu_threads=4)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(v / 'cheats-vo.mp3'), '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
ss, _ = m.transcribe(np.frombuffer(raw, np.float32), language='ru', word_timestamps=True, beam_size=5,
                     initial_prompt='Что если бы читы из ГТА заработали в реальной жизни? Хесоям. Аезакми. Багувикс. Вайс-Сити. Больничный.')
w = []
for s in ss:
    print(f'{s.start:.2f}–{s.end:.2f} {s.text}', flush=True)
    w.extend([[round(t.start, 3), round(t.end, 3), t.word.strip()] for t in s.words])
(v / 'cheats-words.json').write_text(json.dumps(w, ensure_ascii=False, indent=1))
