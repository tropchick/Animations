// Contact sheet of the gorilla video: node tools/gor-sheet.mjs out/sheet.jpg 1 2.5 4 ... (story seconds)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const [out, ...times] = process.argv.slice(2);
const id = process.env.COMP ?? 'Gorilla100';
const scale = Number(process.env.SCALE ?? 0.3);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const files = [];
for (const t of times) {
  const inputProps = {at: Number(t), withAudio: false};
  const composition = await selectComposition({serveUrl, id, inputProps, chromiumOptions: {gl: 'swangle'}});
  const f = `out/_sheet_${t}.jpg`;
  await renderStill({serveUrl, composition, frame: 5, output: f, inputProps, imageFormat: 'jpeg', jpegQuality: 82, scale, chromiumOptions: {gl: 'swangle'}});
  files.push(f);
}
const cols = Number(process.env.COLS ?? Math.min(6, files.length));
execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
files=sys.argv[3:]; cols=int(sys.argv[2])
ims=[Image.open(f) for f in files]
w,h=ims[0].size
rows=(len(ims)+cols-1)//cols
s=Image.new('RGB',(w*cols,h*rows))
for i,im in enumerate(ims):
    d=ImageDraw.Draw(im); d.rectangle([0,0,90,22],fill=(0,0,0)); d.text((4,4),files[i].split('_')[-1][:-4],fill=(255,255,0))
    s.paste(im,((i%cols)*w,(i//cols)*h))
s.save(sys.argv[1],quality=85)
`, out, String(cols), ...files]);
for (const f of files) fs.unlinkSync(f);
console.log(out);
