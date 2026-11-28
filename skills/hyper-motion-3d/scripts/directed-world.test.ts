import {deepStrictEqual, equal, ok, throws} from 'node:assert/strict';
import {sampleCamera, type CameraShot} from '../examples/camera';
import {
  bandPlacement, compileScaleLadder, fromBandPoint, projectScaleAnchor, reseatScaleAnchor,
  sampleLodMix, toBandCamera, toBandPoint,
} from '../examples/scale-escalation';
import {compileWorldReaction, elasticResponse, sampleReactionPose} from '../examples/world-reactions';
import {type Vec3} from '../examples/math';

const almost = (a: number, b: number) => ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
const origins = {seed: [0, 0, 0], bed: [2, 0, 0], roof: [10, 0, 0], outside: [40, 0, 0]} as const;
const initial = {bed: {open: 0, color: 'ochre'}, roof: {open: 0, color: 'ochre'}};
const world = compileWorldReaction({origins, initial, events: [
  {id: 'wake', frame: 100, origin: 'seed', speed: 0.5, radius: 20, attack: 2, hold: 1, decay: 3,
    channels: {bounce: 0.8, sway: 0.5}, persist: {open: 1, color: 'mint'}, transitionFrames: 10},
  {id: 'sunset', frame: 122, origin: 'roof', targets: ['roof'],
    persist: {open: 0, color: 'blue'}, transitionFrames: 10},
]});
equal(world(103, 'bed').pulse, 0);
equal(world(106, 'bed').hits[0].arrival, 104);
almost(world(106, 'bed').channels.bounce!, 0.8 * 0.972);
almost(world(110, 'bed').state.open as number, 0.648);
equal(world(113, 'bed').state.color, 'ochre');
equal(world(114, 'bed').state.color, 'mint');
equal(world(118, 'roof').state.open, 0);
almost(world(127, 'roof').state.open as number, 0.052);
equal(world(133, 'roof').state.open, 0);
equal(world(133, 'roof').state.color, 'blue');
equal(world(133, 'bed').state.open, 1);
deepStrictEqual(world(133, 'outside').state, {});
const frameOrder = [127, 116, 100, 120, 106, 133, 127];
const allReceivers = (frame: number) => Object.keys(origins).map((id) => world(frame, id));
deepStrictEqual(frameOrder.map(allReceivers), [...frameOrder].reverse().map(allReceivers).reverse());
throws(() => compileWorldReaction({origins, events: [{id: 'bad', frame: 0, origin: 'unknown'}]}), /origin/);
const clay = sampleReactionPose({squash: 0.7, sway: 0.4}, {style: 'clay', seed: 'bed'});
ok(clay.scale[1] < 1 && clay.scale[0] > 1);
almost(clay.scale[0] * clay.scale[1] * clay.scale[2], 1);
equal(elasticResponse(20, 20), 0);
ok(elasticResponse(3, 20) > 0);

const near = {id: 'site', from: 0, origin: [0, 0, 0], worldUnitsPerUnit: 1, near: 0.025, far: 80} as const;
const far = {id: 'district', from: 100, origin: [14, 3, -31], worldUnitsPerUnit: 4, near: 0.01, far: 30} as const;
const scale = compileScaleLadder([far, near]);
equal(scale(100).id, 'district');
equal(scale(99).id, 'site');
equal(scale(120).id, 'district');
const anchor: Vec3 = [14.2, 3.2, -30.8];
const close = toBandPoint(anchor, scale(100));
fromBandPoint(close, far).forEach((value, i) => almost(value, anchor[i]));
const placement = bandPlacement(far);
close.forEach((value, i) => almost(value, placement.position[i] + anchor[i] * placement.scale));
const shot: CameraShot = {frame: 0, position: [12, 4, -25], target: [14, 3, -31], fov: 39, roll: 11, focus: 8};
const source = sampleCamera({frame: 10, shots: [shot]});
const oldOptics = toBandCamera(source, near);
const newOptics = toBandCamera(source, far);
equal(newOptics.focusDistance * far.worldUnitsPerUnit, 8);
equal(newOptics.near, far.near);
equal(newOptics.far, far.far);
const aspect = 1080 / 1920;
const oldAnchor = projectScaleAnchor(toBandPoint(anchor, near), oldOptics, aspect);
const newAnchor = projectScaleAnchor(close, newOptics, aspect);
oldAnchor.screen.forEach((value, i) => almost(value, newAnchor.screen[i]));
almost(oldAnchor.depth, newAnchor.depth * far.worldUnitsPerUnit);
ok(oldAnchor.visible && newAnchor.visible);
const want = [0.65, 0.36] as const;
const reseated = projectScaleAnchor(close, reseatScaleAnchor(newOptics, close, want, aspect), aspect);
want.forEach((value, i) => almost(value, reseated.screen[i]));
almost(reseated.depth, newAnchor.depth);
for (const [frame, expected] of [[95, 0], [100, 0.5], [105, 1]]) equal(sampleLodMix(frame, 100, 5), expected);
throws(() => compileScaleLadder([near, {...far, from: 0}]), /Invalid scale band/);

const directed = sampleCamera({frame: 20, shots: [
  {frame: 0, position: [0, 1, 8], target: [0, 1, 0], fov: 32, roll: 0},
  {frame: 20, position: [0, 1, 4], target: [0, 1, 0], fov: 40, roll: 10},
], trackLag: 4, sampleTarget: (frame) => [frame / 4, 0, 0], sampleLook: (frame) => [frame / 2, 2, 0],
sampleMotionTime: (frame) => frame / 2});
deepStrictEqual(directed.position, [4, 1, 6]);
deepStrictEqual(directed.target, [10, 2, 0]);
equal(directed.fov, 36);
equal(directed.roll, 5);
console.log('World propagation, persistent reversal, scale continuity and directed camera timing passed.');
