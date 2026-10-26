// Z-fighting check for any composition: renders small stills with the input prop {zcheck: true}, so that
// src/zcheck.ts analyses every 3D frame, and lists the faces that flicker against each other.
// Usage: node tools/zcheck.mjs ScpEp1 [every=1] [extra seconds...]
//   every: seconds between checked frames (frame 0, the cover, is always checked)
// Writes out/zcheck-<id>.json and prints a table: video time, shot pixels, the two faces, where.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const [id, everyArg = '1', ...extra] = process.argv.slice(2);
if (!id) throw new Error('usage: node tools/zcheck.mjs <composition> [every seconds] [extra seconds...]');
const inputProps = {zcheck: true};
const chromiumOptions = {gl: 'swangle'};
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id, inputProps, chromiumOptions});
const {fps, durationInFrames: total, width, height} = composition;
const step = Math.max(1, Math.round(Number(everyArg) * fps));
const frames = new Set([0]);
for (let f = 1; f < total; f += step) frames.add(f);
for (const s of extra) frames.add(Math.min(total - 1, Math.round(Number(s) * fps)));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zcheck-'));
const found = new Map(); // pair -> summary over all frames
const perFrame = [];
const t0 = Date.now();
for (const frame of [...frames].sort((a, b) => a - b)) {
  let last = null;
  await renderStill({
    serveUrl, composition, frame, inputProps, chromiumOptions, scale: 0.25, imageFormat: 'jpeg',
    output: path.join(tmp, 'f.jpg'),
    onBrowserLog: (log) => {
      if (log.text.startsWith('ZCHECK ')) last = JSON.parse(log.text.slice(7));
    },
  });
  const hits = last?.hits ?? [];
  perFrame.push({frame, time: frame / fps, analysed: Boolean(last), ms: last?.ms ?? 0, hits});
  for (const h of hits) {
    const key = `${h.kind}|${h.a}|${h.b}`;
    const px = Math.round(h.share * width * height);
    const g = found.get(key) ?? {...h, frames: [], maxPx: 0, maxAt: 0, maxScreen: null};
    g.frames.push(frame);
    if (px > g.maxPx) Object.assign(g, {maxPx: px, maxAt: frame, maxScreen: [Math.round(h.screen[0] * width), Math.round(h.screen[1] * height)], gapMm: h.gapMm});
    found.set(key, g);
  }
  process.stdout.write(`frame ${frame} (${(frame / fps).toFixed(1)} s): ${last ? `${hits.length} hits, ${last.ms} ms` : 'no 3D'}\n`);
}
fs.rmSync(tmp, {recursive: true, force: true});

// two faces of the same colour flicker into each other with no visible change: listed last as harmless
const colour = (label) => label.match(/#[0-9a-f]{6}/)?.[0];
for (const g of found.values()) if (g.kind === 'fight' && colour(g.a) === colour(g.b)) g.kind = 'same';
const rank = {fight: 0, near: 1, same: 2};
const list = [...found.values()].sort((a, b) => rank[a.kind] - rank[b.kind] || b.maxPx - a.maxPx);
fs.mkdirSync('out', {recursive: true});
const outFile = path.join('out', `zcheck-${id}.json`);
fs.writeFileSync(outFile, JSON.stringify({id, fps, checked: perFrame.length, pairs: list, perFrame}, null, 1));

const sec = (f) => (f === 0 ? 'cover' : (f / fps).toFixed(1));
const ranges = (fs_) => {
  const out = [];
  for (const f of fs_) {
    const r = out[out.length - 1];
    if (r && f - r[1] <= step) r[1] = f;
    else out.push([f, f]);
  }
  return out.map(([a, b]) => (a === b ? sec(a) : `${sec(a)}–${sec(b)}`)).join(', ');
};
const count = (k) => list.filter((h) => h.kind === k).length;
console.log(`\n${id}: ${perFrame.length} frames checked in ${Math.round((Date.now() - t0) / 1000)} s: ${count('fight')} flickering pairs, ${count('near')} risky (under 1 mm apart), ${count('same')} harmless (same colour)\n`);
for (const h of list) {
  const tag = {fight: 'FLICKERS', near: 'risky   ', same: 'harmless'}[h.kind];
  console.log(`${tag}  s ${ranges(h.frames)}  up to ${h.maxPx} px at ${sec(h.maxAt)}, screen x${h.maxScreen[0]} y${h.maxScreen[1]}, gap ${h.gapMm} mm`);
  console.log(`          ${h.a}\n          ${h.b}\n          world (${h.at.join(', ')})\n`);
}
console.log(`details: ${outFile}`);
