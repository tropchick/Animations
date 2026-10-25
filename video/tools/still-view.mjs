// Renders single stills of a composition with a camera override, for setting up shots.
// Usage: node tools/still-view.mjs LastDebug out/dbg.jpg '{"v":12,"cam":{"pos":[0,1,2],"target":[0,1,0],"fov":40}}' ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const [id, ...jobs] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
for (let i = 0; i < jobs.length; i += 2) {
  const output = jobs[i];
  const inputProps = JSON.parse(jobs[i + 1]);
  const composition = await selectComposition({serveUrl, id, inputProps, chromiumOptions: {gl: 'swangle'}});
  await renderStill({serveUrl, composition, frame: 0, output, inputProps, imageFormat: 'jpeg', jpegQuality: 80, scale: inputProps.scale ?? 0.5, chromiumOptions: {gl: 'swangle'}});
  console.log(output);
}
