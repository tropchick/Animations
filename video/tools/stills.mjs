// Renders a few stills of a composition (one bundle, many frames) and a contact sheet.
// Usage: node tools/stills.mjs GravityFlip out/stills 1.5 9 12.3 ...   (seconds)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [id, outDir, ...secs] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id, chromiumOptions: {gl: 'swangle'}});
for (const s of secs) {
  const frame = Math.round(Number(s) * composition.fps);
  const output = path.join(outDir, `f${String(frame).padStart(4, '0')}.jpg`);
  await renderStill({serveUrl, composition, frame, output, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.5, chromiumOptions: {gl: 'swangle'}});
  console.log(output);
}
