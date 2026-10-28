# Usage: python3 tools/words_vad.py <clean16k.wav> large-v3 audio/voice/<id>-words.json
# Russian word timings with VAD (stops whisper inventing text in silence). Writes {"s": [[start,end,word],...]}.
import sys, json, numpy as np, subprocess
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[2], device="cpu", compute_type="int8")
pcm = subprocess.run(["ffmpeg","-loglevel","error","-i",sys.argv[1],"-f","s16le","-ac","1","-ar","16000","-"],capture_output=True,check=True).stdout
a = np.frombuffer(pcm,np.int16).astype(np.float32)/32768
segs,_ = m.transcribe(a, language="ru", word_timestamps=True, beam_size=5, condition_on_previous_text=False, vad_filter=True, vad_parameters=dict(min_silence_duration_ms=300))
ws=[[round(w.start,2),round(w.end,2),w.word.strip()] for s in segs for w in s.words]
json.dump({"s":ws},open(sys.argv[3],"w"),ensure_ascii=False)
line=[];st=None;prev=0
for x,y,t in ws:
    if line and x-prev>0.5: print(f"{st:6.2f}-{prev:6.2f} "+" ".join(line)); line=[]
    if not line: st=x
    line.append(t); prev=y
print(f"{st:6.2f}-{prev:6.2f} "+" ".join(line))
