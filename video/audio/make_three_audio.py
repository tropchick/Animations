"""Three Stories: supplied ONE narrator take, faster-whisper words, original synthesized effects.
No TTS, no music, no paid API. Story times exclude the one-frame cover (1/30 s).
Reuses the bear soundtrack pipeline (slime_lib.Mix, load, filters, two-pass loudnorm).
"""
import json, wave
from pathlib import Path
import numpy as np
from scipy import signal
from slime_lib import ROOT, SR, Mix, load, filt, thump, tt_, fade_edges

OFF=1/30
DUR=57
GAP_AT=20.1
GAP=4.0
rng=np.random.default_rng(317)
voice_dir=ROOT/'audio/voice/three'
source=voice_dir/'narrator.mp3'
if not source.exists():
 import shutil
 voice_dir.mkdir(parents=True,exist_ok=True)
 shutil.copy('/mnt/project-files/voice/three/narrator.mp3',source)
raw_words=json.loads((voice_dir/'words-raw.json').read_text())
# Correct only ASR orthography, preserving all observed times.
fix={'Торнадо?':'торнадо?','скоп':'скоб','парализовала.':'парализовало.','десертацию.':'диссертацию.','2006.':'2006.','78.':'1978.'}
ws=[]
for a,b,w in raw_words:
 shift=GAP if a>=GAP_AT else 0
 if w=='Бессознание':
  ws.extend([[a+shift,a+shift+.22,'Без'],[a+shift+.22,b+shift,'сознания']])
 else: ws.append([a+shift,b+shift,fix.get(w,w)])
# Short, stable phrase plates: no line reflows while highlighting words.
words=[];g=0;buf=[]
for i,(a,b,w) in enumerate(ws):
 buf.append([a,b,w,g])
 stop=w[-1:] in '.?!,' or len(buf)>=5 or (i+1<len(ws) and ws[i+1][0]-b>.30)
 if stop:
  words.extend(buf);buf=[];g+=1
if buf: words.extend(buf)
json_data={'duration':DUR,'offset':OFF,'voiceGap':{'source':GAP_AT,'silence':GAP},'words':words,'groups':sorted(set(w[3] for w in words))}
(ROOT/'src/three/cues.json').write_text(json.dumps(json_data,ensure_ascii=False,indent=2))
m=Mix(DUR+OFF)
vo=load(source);cut=int(GAP_AT*SR);vo=np.concatenate([vo[:cut],np.zeros(int(GAP*SR)),vo[cut:]])
# Keep the original chosen performance and natural speed.
m.add(vo,OFF,.92)
fx=Mix(DUR+OFF)
T=fx.t
noise=lambda n:rng.standard_normal(n)
def wind(d,seed=0):
 t=tt_(d);n=noise(len(t));a=filt(n,'bandpass',[80,1800]);a/=max(.001,np.std(a));return a*(.5+.2*np.sin(t*1.4+seed)+.13*np.sin(t*3.2+seed))*np.minimum(t/.1,1)*np.minimum((d-t)/.15,1)
def bed(start,end,gain,kind='wind',pan=0):
 t=tt_(end-start)
 if kind=='bus':x=(np.sin(t*2*np.pi*46+.5*np.sin(t*4))*.4+np.sin(t*2*np.pi*91)*.2+wind(end-start)*.4)
 elif kind=='hum':x=(np.sin(t*2*np.pi*50)*.45+np.sin(t*2*np.pi*150)*.12+filt(noise(len(t)),'bandpass',[150,1100])*.35)
 elif kind=='rain':x=filt(noise(len(t)),'highpass',1800)*.2+wind(end-start)*.1
 else:x=wind(end-start,start)
 fx.add(fade_edges(x,80),OFF+start,gain,pan)
def crash(d=.7,kind='glass'):
 t=tt_(d);x=filt(noise(len(t)),'bandpass',[1800,11000])*np.exp(-t*11)*.5
 if kind=='glass':
  for i in range(14):
   f=1000+hash_(i)*7900;x+=np.sin(2*np.pi*f*t+hash_(i+1)*6.28)*np.exp(-t*(5+hash_(i+2)*18))*.065
 elif kind=='wood':x=filt(noise(len(t)),'bandpass',[160,3400])*np.exp(-t*24)+thump(220,80,d,14,.4)*.35
 return x
def hash_(i):return float((np.sin(i*127.1+31.7)*43758.5453)%1)
def whoosh(d):
 t=tt_(d);return wind(d)*np.sin(np.pi*t/d)**2
sync=[]
def event(name,at,x,gain=.2,pan=0,echo=False):
 # Place the initial transient's strongest 5 ms energy window at the visual contact frame.
 n=min(len(x),int(.09*SR));env=np.convolve(x[:n]**2,np.ones(240)/240,'same');pk=np.argmax(env)/SR
 start=max(OFF,OFF+at-pk)
 fx.add(x,start,gain,pan)
 if echo:
  for dt,amp in [(.13,.24),(.29,.12),(.47,.07)]:fx.add(x,start+dt,gain*amp,-pan*.5)
 sync.append({'event':name,'story':at,'video':at+OFF,'peak':start+pk,'difference_frames':round((start+pk-OFF-at)*30,3)})
# Hook: immediate movement and rising pressure, then three different tactile hits.
bed(0,2.8,.075,'bus');event('Касание в хуке',.7,thump(100,37,.8,8,.35)+crash(.8,'wood')*.35,.33,echo=True)
event('Окна в хуке',2.97,crash(),.22,-.2)
event('Луч в хуке',4.55,thump(150,45,.6,12,.1),.16)
event('Штамп «Правда»',5.5,thump(105,57,.35,22,.1),.12)
# Bus: speed, approaching wall, brittle impact and a long tunnel tail.
bed(7.4,13.4,.07,'bus');bed(7.4,13.1,.052)
event('Нарастание тоннеля',12.9,whoosh(.7),.11)
event('Череп касается бетона',13.4,thump(95,31,1.1,7,.32)+crash(1.1,'wood')*.38,.37,.05,True)
for at in [13.53,13.7,13.92,14.14]:event('Крошка бетона',at,crash(.24,'wood'),.045,hash_(int(at*100))-.5)
bed(13.4,17.4,.025,'hum')
t=tt_(2.0);ring=np.sin(t*2*np.pi*4100)*np.exp(-t*1.8)*.03;fx.add(ring,OFF+13.4)
t=tt_(1.7);brake=(np.sin(2*np.pi*(1350*t+100*t*t))+.3*np.sin(t*2*np.pi*2713))*np.sin(np.pi*t/1.7)**.6
event('Торможение и рывок салона',17.65,brake,.055,-.12,True)
event('Кепка падает',18.55,thump(100,45,.3,20,.3),.08,.4)
# Nonverbal alarm/crowd texture, no speech or TTS.
t=tt_(.9);alarm=filt(noise(len(t)),'bandpass',[700,2400])*(.4+.6*np.abs(np.sin(t*17)))*np.sin(np.pi*t/.9)
fx.add(alarm,OFF+17.75,.06)
bed(19.1,21.9,.015,'bus')
# Storm intro includes a safe center band for the later VPN overlay.
bed(21.85,32.45,.055)
t=tt_(7.1);freq=460+170*np.sin(t*1.1);siren=(np.sin(2*np.pi*np.cumsum(freq)/SR)+.3*np.sin(4*np.pi*np.cumsum(freq)/SR))*np.sin(np.pi*t/7.1)**.7
fx.add(siren,OFF+21.85,.025)
event('Дальний гром',23.15,thump(57,26,1.8,2.5,.08)+wind(1.8)*.16,.15,.2,True)
event('Посуда скользит',26.55,crash(.35)*.25,.08,-.3)
event('Стекло в диван',29.05,crash(.9),.27,-.35,True)
event('Отрыв стен',29.5,crash(.8,'wood')+thump(95,42,.8,9,.2)*.4,.24,.2)
event('Отрыв крыши',30.0,crash(.7,'wood'),.21,-.2)
event('Лампа в макушку',31.9,thump(120,36,.65,10,.16)+crash(.65)*.3,.36,0,True)
# At blackout all transient tails disappear. Wind remains by design.
mask=1-fx.env(OFF+32.45,OFF+32.78,.012,.012)
fx.l*=mask;fx.r*=mask
bed(32.45,35.65,.085)
bed(35.65,39.9,.043,'rain')
for at in [37.8,38.27]:event('Босой шаг по гравию',at,filt(noise(int(.24*SR)),'bandpass',[400,6000])*np.exp(-tt_(.24)*22),.1,-.15)
# Accelerator. No music; the low tonal bed is electrical machinery.
bed(39.9,47.23,.037,'hum')
event('Щелчок лючка',42.25,crash(.2,'wood')*.3+thump(230,130,.2,35,.1),.12,.25)
event('Пучок входит в затылок',45.9,thump(180,65,.4,18,.06),.2,-.1)
t=tt_(2.4);high=np.sin(2*np.pi*5700*t)*np.exp(-t*1.3)*.028
fx.add(high,OFF+47.23)
event('Белая вспышка',47.23,whoosh(.18)+thump(200,90,.18,30,.1)*.4,.17)
bed(47.6,50.5,.014,'hum')
# Auditory point of view: left side loses the machine high frequencies, voice stays centered.
bed(50.5,52.6,.023,'hum',.75)
event('Диплом в руках',53.5,whoosh(.28)*.4,.035,.15)
bed(55.2,57,.025)
# Sidechain the FX under narration, preserving short contact transients.
pad=np.zeros(m.n);i=int(OFF*SR);pad[i:i+min(len(vo),m.n-i)]=vo[:m.n-i]
env=signal.sosfilt(signal.butter(2,8,fs=SR,output='sos'),pad*pad)
duck=1-.38*np.clip(np.sqrt(np.maximum(env,0))/.11,0,1)
m.l+=fx.l*duck;m.r+=fx.r*duck
final=m.write('three-stories',target='I=-15:TP=-1.5:LRA=12')
(ROOT/'out/three-review').mkdir(parents=True,exist_ok=True)
(ROOT/'out/three-review/sync-peaks.json').write_text(json.dumps(sync,ensure_ascii=False,indent=2))
# FX stem supports sample-level sync verification after final AAC decoding.
with wave.open(str(ROOT/'out/three-review/fx-stem.wav'),'wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);a=np.stack([fx.l,fx.r],axis=1);w.writeframes((np.clip(a,-.999,.999)*32767).astype(np.int16).tobytes())
print(f'Wrote {final}; {DUR+OFF:.3f} seconds; {len(words)} timed words; {len(sync)} synchronized effects.')
