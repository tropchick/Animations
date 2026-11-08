"""Verify the final AAC decoding against the authoritative WAV at each sync-map transient."""
from pathlib import Path
import json,subprocess,wave
import numpy as np
from scipy.signal import correlate, correlation_lags
root=Path(__file__).resolve().parent.parent
movie=root.parent/'renders/three-stories.mp4'
review=root/'out/three-review'
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(movie),'-vn','-ar','48000','-ac','1','-f','f32le','-'])
dec=np.frombuffer(raw,np.float32)
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(root/'public/audio/three-stories.wav'),'-ar','48000','-ac','1','-f','f32le','-'])
ref=np.frombuffer(raw,np.float32)
checks=[]
for e in json.loads((review/'sync-peaks.json').read_text()):
 at=e['video'];lo=max(0,round((at-.13)*48000));hi=min(len(ref),len(dec),round((at+.32)*48000))
 a=ref[lo:hi].astype(float);b=dec[lo:hi].astype(float);a-=a.mean();b-=b.mean()
 corr=correlate(b,a,mode='full',method='fft');lags=correlation_lags(len(b),len(a));valid=np.abs(lags)<1600
 lag=int(lags[valid][np.argmax(corr[valid])]);n=min(len(a),len(b))-abs(lag)
 aa=a[max(0,-lag):max(0,-lag)+n];bb=b[max(0,lag):max(0,lag)+n]
 similarity=float(np.dot(aa,bb)/(np.linalg.norm(aa)*np.linalg.norm(bb)+1e-12))
 checks.append({'event':e['event'],'video_s':at,'aac_lag_samples':lag,'aac_lag_frames':lag/1600,'correlation':round(similarity,5)})
assert all(abs(c['aac_lag_samples'])<160 for c in checks),checks
result={'file':str(movie),'sample_rate':48000,'passed':True,'max_shift_ms':max(abs(c['aac_lag_samples']) for c in checks)/48,'events':checks}
(review/'final-sync.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps({'passed':True,'checked_events':len(checks),'max_shift_ms':result['max_shift_ms'],'min_correlation':min(c['correlation'] for c in checks)},ensure_ascii=False))
