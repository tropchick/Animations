"""Decode actual exports, extract one frame per second and both sides of each edit.
Usage: python3 tools/three-audit.py ../renders/three-stories.mp4 out/three-review/final
Run only AFTER rendering has finished.
"""
import json, math, subprocess, sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
video=Path(sys.argv[1]).resolve();out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]))
v=next(s for s in info['streams'] if s['codec_type']=='video');a=next(s for s in info['streams'] if s['codec_type']=='audio')
assert v['r_frame_rate']=='30/1',v
assert float(info['format']['duration'])<60
assert int(v['nb_frames'])==1711
seconds=list(range(57))
# tools/sheet.sh lays out 16 frames, so make four pages: every second is represented.
for page in range(4):
 d=out/f'seconds-{page+1}';d.mkdir(exist_ok=True)
 for sec in seconds[page*16:(page+1)*16]:
  target=d/f'f{sec:04d}.jpg'
  subprocess.run(['ffmpeg','-v','error','-y','-ss',str(sec),'-i',str(video),'-frames:v','1','-vf','scale=540:960','-q:v','2',str(target)],check=True)
  im=Image.open(target);dr=ImageDraw.Draw(im);dr.rectangle((0,0,100,32),fill='#142d3b');dr.text((8,8),f'{sec:02d}:00',fill='white');im.save(target,quality=94)
 subprocess.run(['tools/sheet.sh',str(d),str(out/f'seconds-{page+1}.jpg')],check=True)
starts=[0,2.8,3.8,5.4,7.4,11.5,13.1,17.4,20.05,21.85,28.3,30.7,32.45,32.8,35.65,37.55,38.65,39.9,41.7,44.65,47.23,47.6,50.5,52.6,55.2]
frames={0,1,1710}
for s in starts:
 f=math.ceil(s*30)+1
 frames.update([max(0,f-1),f,min(1710,f+1)])
for event in [.7,13.4,29.05,29.5,30,31.9,45.9,47.23]:
 f=math.ceil(event*30)+1
 frames.update([f-2,f-1,f,f+1,f+2])
b=out/'boundaries';b.mkdir(exist_ok=True)
for f in sorted(frames):
 subprocess.run(['ffmpeg','-v','error','-y','-ss',f'{f/30:.9f}','-i',str(video),'-frames:v','1','-vf','scale=540:960','-q:v','2',str(b/f'f{f:04d}.jpg')],check=True)
ps=sorted(b.glob('f*.jpg'))
for page in range(math.ceil(len(ps)/24)):
 subset=ps[page*24:(page+1)*24];sheet=Image.new('RGB',(6*240,4*450),'#122330');dr=ImageDraw.Draw(sheet)
 for i,p in enumerate(subset):
  im=Image.open(p).resize((240,427));x=i%6*240;y=i//6*450;sheet.paste(im,(x,y+23));dr.text((x+10,y+5),f'{int(p.stem[1:]):04d} / {int(p.stem[1:])/30:.3f}s',fill='white')
 sheet.save(out/f'boundaries-{page+1}.jpg',quality=90)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(video),'-vn','-ar','48000','-ac','2',str(out/'decoded-audio.wav')],check=True)
(out/'metadata.json').write_text(json.dumps(info,ensure_ascii=False,indent=2))
print(f'PASS {v["width"]}×{v["height"]}, {v["r_frame_rate"]} fps, {v["nb_frames"]} frames, {info["format"]["duration"]} s; {a["codec_name"]} {a["sample_rate"]} Hz; {len(frames)} boundary/contact frames + 57 second samples.')
