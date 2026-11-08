"""Word timings for «Тихий этаж» voices (faster-whisper small, cpu). Writes audio/voice/quiet-words.json
as {take: [[start, end, word], ...]} for every take that exists (narrator, man, radio1, radio2)."""
from faster_whisper import WhisperModel
from pathlib import Path
import json, subprocess, sys
import numpy as np

v = Path(__file__).resolve().parent / 'voice'
m = WhisperModel('small', device='cpu', compute_type='int8', cpu_threads=int(sys.argv[1]) if len(sys.argv) > 1 else 4)
PROMPT = 'Тихая, девять. Артём, Соня Миронова. Крикуны. Частота девяносто один и четыре. Ворота закрываются.'
out_p = v / 'quiet-words.json'
out = json.loads(out_p.read_text()) if out_p.exists() else {}
for take in ['narrator', 'man', 'radio1', 'radio2']:
    f = v / f'quiet-{take}.mp3'
    if take == 'radio1' and not f.exists():
        f = v / 'quiet-radio.mp3'
    if not f.exists() or take in out:
        continue
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(f), '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
    ss, _ = m.transcribe(np.frombuffer(raw, np.float32), language='ru', word_timestamps=True, beam_size=5, initial_prompt=PROMPT)
    w = []
    for s in ss:
        print(f'[{take}] {s.start:.2f}–{s.end:.2f} {s.text}', flush=True)
        w.extend([[round(t.start, 3), round(t.end, 3), t.word.strip()] for t in s.words])
    out[take] = w
    out_p.write_text(json.dumps(out, ensure_ascii=False, indent=1))
