// Stills of GtaDay at story times (seconds): node tools/day-stills.mjs out/day 1.5 4 7.2 ...  (SCALE env, default 0.5)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [outDir, ...secs] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: process.env.COMP ?? 'GtaDay', chromiumOptions: {gl: 'swangle'}});
const t0 = Date.now();
for (const s of secs) {
  const frame = s === 'cover' ? 0 : Math.round(Number(s) * composition.fps) + 1;
  const output = path.join(outDir, `t${s === 'cover' ? 'cover' : Number(s).toFixed(2).padStart(5, '0')}.jpg`);
  await renderStill({serveUrl, composition, frame, output, imageFormat: 'jpeg', jpegQuality: 85, scale: Number(process.env.SCALE ?? 0.5), chromiumOptions: {gl: 'swangle'}});
  console.log(output);
}
console.log(`${((Date.now() - t0) / secs.length / 1000).toFixed(2)} s per still`);
