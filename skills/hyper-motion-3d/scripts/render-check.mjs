import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';

const repository = fileURLToPath(new URL('../../../', import.meta.url));
const video = join(repository, 'video');
const requireFromVideo = createRequire(join(video, 'package.json'));
const gate = join(repository, 'skills/animation-quality-gate/scripts/animation_contact_sheet.py');
const usage = `Usage: node skills/hyper-motion-3d/scripts/render-check.mjs
  --composition=HyperMotionDemo
  --frames=615,0,241,425 --out=video/out/hyper-motion-qa/demo [--parallel]

Renders independent PNG stills at composition resolution, then runs the quality gate.
With --parallel, also renders the same frames in multiple worker tabs and checks SHA-256.
Paths provided as arguments resolve from the current directory.

Optional:
  --entry=entry.tsx      Remotion entry (default: video/src/HyperMotionDemo.tsx)
  --public-dir=path      Assets for a custom entry (default: video/public)
  --props=props.json     JSON composition input props
  --scale=0.5            Preview scale (default: 1)
  --browser=executable   Chromium path (default: Remotion browser or REMOTION_BROWSER_EXECUTABLE)
  --gl=swangle           Chromium GL backend (default: swangle, software WebGL)
  --workers=2            Worker tabs for --parallel (default: 2)
  --help                 Show usage`;

const {values: options} = parseArgs({
  options: {
    entry: {type: 'string'},
    'public-dir': {type: 'string'},
    composition: {type: 'string'},
    frames: {type: 'string'},
    out: {type: 'string'},
    props: {type: 'string'},
    scale: {type: 'string', default: '1'},
    browser: {type: 'string'},
    gl: {type: 'string', default: 'swangle'},
    workers: {type: 'string', default: '2'},
    parallel: {type: 'boolean'},
    help: {type: 'boolean'},
  },
});

if (options.help) {
  console.log(usage);
  process.exit(0);
}

if (!options.composition || !options.frames || !options.out) {
  throw new Error(usage);
}

const tokens = options.frames.split(',').map((value) => value.trim());
const requestedFrames = tokens.map(Number);
const frames = [...new Set(requestedFrames)].sort((left, right) => left - right);
const scale = Number(options.scale);
const workers = Number(options.workers);

if (!tokens.every((value) => /^\d+$/.test(value)) ||
    !requestedFrames.every(Number.isSafeInteger) || requestedFrames.length !== frames.length) {
  throw new Error('--frames must contain unique, non-negative integer frames.');
}
if (!Number.isFinite(scale) || scale <= 0 || scale > 1) {
  throw new Error('--scale must be greater than zero and at most one.');
}
if (options.parallel && (!Number.isSafeInteger(workers) || workers < 2 || frames.length < workers)) {
  throw new Error('--parallel requires at least two workers and at least as many frames as workers.');
}

const inputProps = options.props ? JSON.parse(await readFile(resolve(options.props), 'utf8')) : {};
if (inputProps === null || Array.isArray(inputProps) || typeof inputProps !== 'object') {
  throw new Error('--props must point to a JSON object.');
}

const entryPoint = options.entry ? resolve(options.entry) : join(video, 'src/HyperMotionDemo.tsx');
const output = resolve(options.out);
const browserExecutable = options.browser ?? process.env.REMOTION_BROWSER_EXECUTABLE;
const chromiumOptions = {gl: options.gl};
const outOfOrderFrames = requestedFrames.every((frame, index) => frame === frames[index])
  ? [...requestedFrames].reverse()
  : requestedFrames;
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const fileName = (frame) => `frame-${String(frame).padStart(4, '0')}.png`;
const {bundle} = requireFromVideo('@remotion/bundler');
const {openBrowser, renderFrames, renderStill, selectComposition} = requireFromVideo('@remotion/renderer');

await mkdir(output, {recursive: true});
const publicDir = options['public-dir'] ? resolve(options['public-dir']) : join(video, 'public');
if (options['public-dir'] && !existsSync(publicDir)) throw new Error(`Public directory does not exist: ${publicDir}`);
const serveUrl = await bundle({
  entryPoint,
  rootDir: video,
  publicDir: existsSync(publicDir) ? publicDir : null,
  symlinkPublicDir: true,
  webpackOverride: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      modules: [...(config.resolve?.modules ?? ['node_modules']), join(video, 'node_modules')],
    },
  }),
});

try {
  const browser = await openBrowser('chrome', {browserExecutable, chromiumOptions});
  const hashes = new Map();
  const stillStarted = process.hrtime.bigint();
  let composition;
  let dimensions;
  let sequentialSeconds;
  try {
    composition = await selectComposition({
      serveUrl,
      id: options.composition,
      inputProps,
      puppeteerInstance: browser,
    });
    if (frames.at(-1) >= composition.durationInFrames) {
      throw new Error(`Frame ${frames.at(-1)} is outside ${composition.id} (${composition.durationInFrames} frames).`);
    }
    for (const frame of outOfOrderFrames) {
      const {buffer} = await renderStill({
        serveUrl,
        composition,
        inputProps,
        puppeteerInstance: browser,
        frame,
        scale,
        imageFormat: 'png',
        timeoutInMilliseconds: 120_000,
      });
      if (!buffer) throw new Error(`No PNG returned for frame ${frame}.`);
      // Chromium rounds scaled capture dimensions to whole output pixels.
      dimensions ??= {width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20)};
      hashes.set(frame, {still: sha256(buffer)});
      await writeFile(join(output, fileName(frame)), buffer);
      console.log(`Still ${composition.id} #${frame}`);
    }
    sequentialSeconds = Number(process.hrtime.bigint() - stillStarted) / 1e9;
  } finally {
    await browser.close({silent: true});
  }

  let parallel = null;
  if (options.parallel) {
    const completionOrder = [];
    const parallelStarted = process.hrtime.bigint();
    let resolvedConcurrency = 0;
    await renderFrames({
      serveUrl,
      composition,
      inputProps,
      browserExecutable,
      chromiumOptions,
      frames,
      scale,
      concurrency: workers,
      imageFormat: 'png',
      outputDir: null,
      muted: true,
      timeoutInMilliseconds: 120_000,
      onStart: (data) => { resolvedConcurrency = data.resolvedConcurrency; },
      onFrameBuffer: async (buffer, frame) => {
        const result = hashes.get(frame);
        if (!result) throw new Error(`Unexpected parallel frame ${frame}.`);
        result.parallel = sha256(buffer);
        completionOrder.push(frame);
        if (result.parallel !== result.still) {
          await writeFile(join(output, `parallel-${fileName(frame)}`), buffer);
        }
      },
      onFrameUpdate: (_rendered, frame) => console.log(`Worker ${composition.id} #${frame}`),
    });
    parallel = {
      resolvedConcurrency,
      completionOrder,
      seconds: Number(process.hrtime.bigint() - parallelStarted) / 1e9,
      mismatches: frames.filter((frame) => hashes.get(frame).still !== hashes.get(frame).parallel),
    };
  }

  const report = join(output, 'render-check.json');
  await writeFile(report, JSON.stringify({
    composition: composition.id,
    ...dimensions,
    fps: composition.fps,
    scale,
    gl: options.gl,
    independentStillOrder: outOfOrderFrames,
    sequentialSeconds,
    frames: frames.map((frame) => ({frame, ...hashes.get(frame)})),
    parallel,
  }, null, 2) + '\n');

  execFileSync(process.env.PYTHON ?? 'python3', [
    gate, '--frames', ...frames.map((frame) => fileName(frame)),
    '--out-image', 'contact.png', '--out-report', 'contact.json',
  ], {cwd: output, stdio: 'inherit'});

  console.log(`Saved ${report}`);
  if (parallel && (parallel.resolvedConcurrency < 2 || parallel.mismatches.length > 0)) {
    throw new Error(`Parallel verification failed. See ${report}.`);
  }
} finally {
  await rm(serveUrl, {recursive: true, force: true});
}
