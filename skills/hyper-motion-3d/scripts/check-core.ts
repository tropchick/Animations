import {deepStrictEqual, equal, ok, throws} from 'node:assert/strict';
import {sampleCamera, type CameraShot} from '../examples/camera';
import {sampleEditTime} from '../examples/editing';
import {loopRoute, prepareRoute, reactToEvent, windSway} from '../examples/environment';
import {sampleRandom} from '../examples/math';
import {
  compileIntensity, compileTimeline, intensityPresets, qualityBudgets, sampleEvents,
} from '../examples/timeline';

const defaultIntensity = compileIntensity([]);
deepStrictEqual(defaultIntensity(0), intensityPresets.Hyper);

const intensity = compileIntensity([
  {frame: 40, level: 'Climax', channels: {camera: 0, audio: 0.6}},
  {frame: 10, level: 'Minimal', easing: 'hold'},
  {frame: 60, level: 'Hyper', channels: {camera: 5}},
  {frame: 0, level: 'Dynamic', easing: 'linear'},
]);
equal(intensity(10).camera, intensityPresets.Minimal.camera);
equal(intensity(39).particles, intensityPresets.Minimal.particles);
equal(intensity(60).camera, 1);
equal(intensity(40).audio, 0.6);
equal(intensity(40).camera, 0);
equal(intensity(50).camera, 0.5);
ok(Math.abs(intensity(5).camera - 0.31) < 1e-12);
throws(() => compileIntensity([{frame: 0}, {frame: 0}]), /unique/);
throws(() => compileIntensity([{frame: -1}]), /non-negative/);

const events = [
  {id: 'trail', kind: 'trail', from: 30, duration: 16, priority: 3, particles: 70},
  {id: 'wave', kind: 'ring', from: 30, duration: 1},
  {id: 'impact', kind: 'burst', from: 30, duration: 15, priority: 5, particles: 76},
];
throws(() => compileTimeline([events[0], events[0]]), /Duplicate/);
throws(() => compileTimeline([{...events[0], duration: -1}]), /Invalid/);
const timeline = compileTimeline(events);
const sample = (frame: number) => sampleEvents(timeline, frame, qualityBudgets.draft, 'fixture');
equal(sample(29).length, 0);
deepStrictEqual(sample(30).map(({event}) => event.id), ['impact', 'trail', 'wave']);
deepStrictEqual(sample(30).map(({particleBudget}) => particleBudget), [76, 20, 0]);
deepStrictEqual(sample(31).map(({event}) => event.id), ['impact', 'trail']);
equal(sample(44)[0].progress, 1);
equal(sample(45)[0].event.id, 'trail');
equal(sample(46).length, 0);
const requests = [40, 30, 45, 31, 43, 40];
const first = requests.map(sample);
deepStrictEqual(first[0], first[5]);
deepStrictEqual(requests.toReversed().map(sample).reverse(), first);
deepStrictEqual(sampleEvents(timeline, 30, {...qualityBudgets.draft, effects: 1}, 5, 0.5)
  .map(({particleBudget}) => particleBudget), [38]);

const randomFrames = [382, 1, 67, 719, 5, 382];
const random = randomFrames.map((frame) => sampleRandom('observatory/trail', frame));
ok(random.every((value) => value >= 0 && value < 1));
equal(random[0], random[5]);
equal(new Set(Array.from({length: 1000}, (_, i) => sampleRandom('particles', i))).size, 1000);

console.log('Hyper Motion timeline, intensity, particle budgets, and random access checks passed.');

const dollyShots: readonly CameraShot[] = [
  {frame: 0, position: [0, 0, 8], target: [0, 0, 0], fov: 30, focus: 8},
  {frame: 20, position: [0, 0, 4], target: [0, 0, 0], dollyZoom: true, focus: 2},
  {frame: 40, position: [4, 0, 0], target: [0, 0, 0], cut: true},
  {frame: 60, position: [0, 0, 4], target: [0, 0, 0], orbit: true},
];
const dolly = (frame: number) => sampleCamera({frame, shots: dollyShots});
const projectedHalfHeight = (frame: number) => {
  const {position, fov} = dolly(frame);
  return Math.hypot(...position) * Math.tan(fov * Math.PI / 360);
};
for (const frame of [20, 15, 10, 5, 19]) {
  ok(Math.abs(projectedHalfHeight(frame) - projectedHalfHeight(0)) < 1e-12);
}
const cameraOrder = [15, 60, 0, 47, 20, 3, 15];
deepStrictEqual(cameraOrder.map(dolly), cameraOrder.toReversed().map(dolly).reverse());
equal(dolly(10).focusDistance, 5);
deepStrictEqual(dolly(39).position, [0, 0, 4]);
deepStrictEqual(dolly(40).position, [4, 0, 0]);
ok(Math.abs(Math.hypot(...dolly(50).position) - 4) < 1e-12);
const accent = {kind: 'punch', frame: 6, duration: 20, strength: 1} as const;
const accentCamera = (frame: number, intensity: number) => sampleCamera({
  frame, shots: dollyShots, accents: [accent], intensity,
});
ok(accentCamera(10, 1).position[2] < dolly(10).position[2]);
deepStrictEqual(accentCamera(10, 0), dolly(10));
deepStrictEqual(accentCamera(26, 1), dolly(26));

const retime = [{frame: 0, sourceFrame: 0}, {frame: 10, sourceFrame: 5},
  {frame: 14, sourceFrame: 5}, {frame: 22, sourceFrame: 21, ease: 'accelerate'}] as const;
deepStrictEqual([18, 12, 5, 22, 3].map((frame) => sampleEditTime(frame, retime)), [9, 5, 2.5, 21, 1.5]);
const route = prepareRoute([[0, 0, 0], [6, 0, 0], [6, 0, 2], [0, 0, 2]]);
const routeAt = (frame: number) => loopRoute({route, frame, speed: 3});
deepStrictEqual(routeAt(20).position, [2, 0, 0]);
deepStrictEqual(routeAt(180).position, routeAt(20).position);
deepStrictEqual([200, 11, 42, 7].map(routeAt), [7, 42, 11, 200].map(routeAt).reverse());
equal(reactToEvent({frame: 10, at: 10, distance: 4}), 0);
ok(reactToEvent({frame: 21, at: 10, distance: 4}) > 0);
equal(reactToEvent({frame: 30, at: 10, distance: 6}), 0);
deepStrictEqual(windSway({frame: 173, seed: 'sapling'}), windSway({frame: 173, seed: 'sapling'}));

console.log('Hyper Motion camera cuts, dolly zoom, orbit, retiming, environment and indexed frame checks passed.');
