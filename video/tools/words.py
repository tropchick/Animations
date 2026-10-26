"""Word timings of voice takes with faster-whisper (pip install faster-whisper).
Usage: python3 tools/words.py OUT.json LANG name=audio.mp3 [name=audio.mp3 ...]
Writes {name: [[start, end, word], ...]} in the format the audio/make_*_audio.py scripts read."""
import json
import subprocess
import sys

import numpy as np

from faster_whisper import WhisperModel

out, lang, *takes = sys.argv[1:]
model = WhisperModel("medium", device="cpu", compute_type="int8")
res = {}
for t in takes:
    name, path = t.split("=", 1)
    # decode with ffmpeg: the PyAV that faster-whisper pulls in can clash with the installed one
    pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
    audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    segs, _ = model.transcribe(audio, language=lang, word_timestamps=True, beam_size=5)
    res[name] = [[round(w.start, 2), round(w.end, 2), w.word.strip()] for s in segs for w in s.words]
    print(name, len(res[name]), "words:", " ".join(w[2] for w in res[name]))
open(out, "w").write(json.dumps(res, ensure_ascii=False))
