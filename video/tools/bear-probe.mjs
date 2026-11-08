// Prints where the key points of the «медведь» scenes land on screen (1080x1920), without rendering.
// Usage: node tools/bear-probe.mjs 8 12.5 16.2 ...   (story seconds)
import {build} from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-'));
const entry = path.join(tmp, 'entry.ts');
fs.writeFileSync(
  entry,
  `import * as THREE from 'three';
import {SCENES} from ${JSON.stringify(path.resolve('src/bear/World.tsx'))};
import {shotAt} from ${JSON.stringify(path.resolve('src/bear/cues.ts'))};
const out: string[] = [];
for (const s of process.argv.slice(2).map(Number)) {
  const sh = shotAt(s);
  const sc = (SCENES as any)[sh.name];
  if (!sc) { out.push(s + ' ' + sh.name + ': no scene'); continue; }
  const view = sc.view(s);
  const cam = new THREE.PerspectiveCamera(view.fov, 1080 / 1920, 0.01, 1000);
  cam.up.set(...(view.up ?? [0, 1, 0]));
  cam.position.set(...view.pos);
  cam.lookAt(...view.target);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  const pts = sc.probe ? sc.probe(s) : {};
  const rows = Object.entries(pts).map(([k, p]: any) => {
    const v = new THREE.Vector3(...p).project(cam);
    const behind = new THREE.Vector3(...p).applyMatrix4(cam.matrixWorldInverse).z > 0;
    const d = cam.position.distanceTo(new THREE.Vector3(...p));
    return '   ' + k.padEnd(12) + ' x=' + String(Math.round((v.x + 1) * 540)).padStart(5) + ' y=' + String(Math.round((1 - v.y) * 960)).padStart(5) + '  d=' + d.toFixed(2) + (behind ? ' BEHIND' : '') + '  @' + p.map((x: number) => x.toFixed(2)).join(',');
  });
  out.push(s.toFixed(2) + ' ' + sh.name + ' cam=' + view.pos.map((x: number) => x.toFixed(2)).join(',') + ' fov=' + view.fov.toFixed(1));
  out.push(...rows);
}
console.log(out.join('\\n'));
`,
);
const outfile = path.join(tmp, 'probe.cjs');
await build({entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile, loader: {'.json': 'json', '.css': 'empty', '.woff': 'empty', '.woff2': 'empty'}, jsx: 'automatic', logLevel: 'error', nodePaths: [path.resolve('node_modules')], define: {'process.env.NODE_ENV': '"production"'}});
const {execFileSync} = await import('node:child_process');
process.stdout.write(execFileSync('node', [outfile, ...process.argv.slice(2)]).toString());
