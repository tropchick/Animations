import {mkdir, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';

const video = fileURLToPath(new URL('../../../video/', import.meta.url));
const requireFromVideo = createRequire(join(video, 'package.json'));
const {bundle} = requireFromVideo('@remotion/bundler');
const {renderFrames, selectComposition} = requireFromVideo('@remotion/renderer');
const {values} = parseArgs({
  options: {
    browser: {type: 'string'},
    scale: {type: 'string', default: '0.5'},
    quality: {type: 'string', default: 'balanced'},
    out: {type: 'string', default: join(video, 'out/toybox/benchmark.json')},
  },
});

const scale = Number(values.scale);
if (!Number.isFinite(scale) || scale <= 0 || scale > 1) throw new Error('Expected --scale in (0, 1].');
if (!['preview', 'balanced', 'final'].includes(values.quality)) throw new Error('Unknown Toybox quality.');

const browserExecutable = values.browser ?? process.env.REMOTION_BROWSER_EXECUTABLE;
const chromiumOptions = {gl: 'swangle'};
const inputProps = {quality: values.quality, withAudio: false};
const frames = Array.from({length: 12}, (_, index) => 104 + index);
const ids = ['ToyboxCompareLowPoly', 'ToyboxCompareStandalone', 'ToyboxCompareHyper'];
const serveUrl = await bundle({
  entryPoint: join(video, 'src/ToyboxDemo.tsx'),
  rootDir: video,
  publicDir: join(video, 'public'),
  symlinkPublicDir: true,
  webpackOverride: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      modules: [...(config.resolve?.modules ?? ['node_modules']), join(video, 'node_modules')],
    },
  }),
});

const secondsSince = (time) => (performance.now() - time) / 1000;
const results = [];
for (const id of ids) {
  const composition = await selectComposition({
    serveUrl, id, inputProps, browserExecutable, chromiumOptions,
  });
  const started = performance.now();
  let firstFrameAt;
  const intervals = [];
  let lastFrameAt;
  await renderFrames({
    serveUrl, composition, inputProps, browserExecutable, chromiumOptions, frames, scale,
    timeoutInMilliseconds: 180_000, concurrency: 1, imageFormat: 'jpeg', jpegQuality: 92,
    outputDir: null, muted: true, onFrameBuffer: () => {},
    onFrameUpdate: () => {
      const at = performance.now();
      firstFrameAt ??= at;
      if (lastFrameAt !== undefined) intervals.push((at - lastFrameAt) / 1000);
      lastFrameAt = at;
    },
    onStart: () => {},
  });
  const middle = [...intervals].sort((a, b) => a - b)[Math.floor(intervals.length / 2)];
  const result = {
    id, coldFirstFrameSeconds: (firstFrameAt - started) / 1000,
    medianFrameSeconds: middle,
    totalFrameRenderSeconds: secondsSince(started), intervals,
  };
  results.push(result);
  console.log(id, middle.toFixed(2) + 's median after first frame');
}

const out = resolve(values.out);
await mkdir(dirname(out), {recursive: true});
await writeFile(out, JSON.stringify({
  quality: values.quality, scale, gl: chromiumOptions.gl, concurrency: 1,
  size: [Math.round(1080 * scale), Math.round(1920 * scale)], frames, results,
}, null, 2) + '\n');
