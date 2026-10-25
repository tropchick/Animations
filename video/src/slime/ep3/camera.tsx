import {V3, add3, lerp, lerp3, ramp, smooth} from '../cues';
import {View, handheld} from '../camera';
import {CAMPUS_X} from '../ep2/Campus';
import {FLAME, LIVE, SCAN_STOP, Shot3, shotAt} from './cues';
import {CENTER} from './Cordon';
import {NOTEPAD, RECORDER3, TENT_X} from './Tent';
import {CITY_X, FLOOR_Y, SILL_Y, STAFF_RADIO, WIN_Z} from './City';
import {PHONE_X} from './PhoneSet';

const C = (p: V3): V3 => [p[0] + CAMPUS_X, p[1], p[2]];
const T = (p: V3): V3 => [p[0] + TENT_X, p[1], p[2]];
const Y = (p: V3): V3 => [p[0] + CITY_X, p[1], p[2]];
const P = (p: V3): V3 => [p[0] + PHONE_X, p[1], p[2]];
const move = (a: V3, b: V3, ta: V3, tb: V3, fov: number, fov2 = fov) => (k: number): View => ({
  pos: lerp3(a, b, smooth(k)),
  target: lerp3(ta, tb, smooth(k)),
  fov: lerp(fov, fov2, smooth(k)),
});

const R = Y(STAFF_RADIO);
const RADIO_FACE: V3 = [-0.25, 0, 0.97];
const radioView = (dist: number, up: number): V3 => add3(R, [RADIO_FACE[0] * dist, up, RADIO_FACE[2] * dist]);
const KR = Y([-0.75, SILL_Y + 0.15, WIN_Z + 0.12]);

const VIEWS: Record<Shot3, (k: number, v: number, t: number) => View> = {
  aerial: move(C([46, 128, 74]), C([38, 100, 56]), C(CENTER), C(CENTER), 40),
  recorder: move(add3(RECORDER3, [0.06, 0.17, 0.2]), add3(RECORDER3, [0.035, 0.12, 0.14]), add3(RECORDER3, [0, 0.02, -0.02]), add3(RECORDER3, [0, 0.02, -0.02]), 34),
  cordon: move(C([60.5, 1.75, -1.5]), C([60.5, 1.7, -11]), C([0, 4, -6]), C([0, 4, -13]), 50),
  tent: move(T([1.05, 1.55, 2.35]), T([0.98, 1.52, 2.2]), T([-0.2, 0.92, -0.8]), T([-0.2, 0.92, -0.8]), 44),
  notepad: (k) => ({pos: add3(NOTEPAD, [0.0, 0.33 - 0.03 * smooth(k), 0.055]), target: add3(NOTEPAD, [0, 0, 0.05]), fov: 40, up: [0, 0, -1]}),
  crane: move(C([64, 6.5, 24]), C([68, 8, 27]), C([36, 5, 2]), C([36, 5, 2]), 50),
  wall: move(C([36.6, 2.4, 17.2]), C([35.6, 2.1, 18.3]), C([26.5, 1.4, 21.5]), C([26.5, 1.4, 21.5]), 50),
  fire: move(C([45.4, 1.15, -17.2]), C([45.3, 1.05, -16.5]), C([44.8, 1.0, -10.0]), C([44.7, 1.0, -10.0]), 56),
  phone: move(P([0.01, 0.0, 0.34]), P([0.0, 0.0, 0.27]), P([0, 0, 0]), P([0, 0, 0]), 34),
  kitchen: move(add3(KR, [0.25, 0.25, 1.35]), add3(KR, [0.1, 0.12, 0.62]), add3(KR, [0, 0, 0]), add3(KR, [0, 0.02, 0]), 42),
  bridge: () => ({pos: Y([150, 72, 78]), target: Y([60, 6, 2]), fov: 26}),
  window: move(Y([0.6, FLOOR_Y + 1.9, WIN_Z + 3.3]), Y([0.65, FLOOR_Y + 1.95, WIN_Z + 4.3]), Y([-30, 0, -300]), Y([-30, 0, -300]), 48),
  city: move(Y([0.45, FLOOR_Y + 1.6, WIN_Z + 0.45]), Y([0.45, FLOOR_Y + 1.6, WIN_Z + 0.42]), Y([-35, -25, -300]), Y([-35, -25, -300]), 50),
  scan: move(radioView(0.3, 0.17), radioView(0.27, 0.165), add3(R, [0, 0.14, 0]), add3(R, [0, 0.14, 0]), 34),
  hold: move(Y([0.95, FLOOR_Y + 1.78, WIN_Z + 1.75]), Y([0.92, FLOOR_Y + 1.76, WIN_Z + 1.6]), add3(R, [-0.2, 0.1, -0.6]), add3(R, [-0.2, 0.1, -0.6]), 46),
  live: (_k, v) => {
    const push = smooth(ramp(v, LIVE + 0.1, LIVE + 0.35));
    return {pos: lerp3(radioView(0.42, 0.24), radioView(0.2, 0.215), push), target: add3(R, [0, 0.18, 0]), fov: 32};
  },
  reflect: move(Y([-1.6, FLOOR_Y + 1.62, WIN_Z + 1.6]), Y([-1.58, FLOOR_Y + 1.6, WIN_Z + 1.55]), Y([0.9, FLOOR_Y + 1.3, WIN_Z - 1.09]), Y([0.9, FLOOR_Y + 1.3, WIN_Z - 1.09]), 48),
  title: () => ({pos: Y([0, FLOOR_Y + 1.6, WIN_Z + 0.4]), target: Y([-35, 5, -300]), fov: 50}),
};

const FAR: Shot3[] = ['aerial', 'cordon', 'crane', 'wall', 'fire', 'kitchen', 'bridge', 'window', 'city', 'hold', 'reflect', 'title'];
const SHAKES: [number, number][] = [
  [FLAME[0], 0.3],
  [SCAN_STOP, 0.35],
];

export const viewAt3 = (v: number): View => {
  const s = shotAt(v);
  const view = VIEWS[s.name](s.k, v, s.t);
  const far = FAR.includes(s.name) ? 2600 : 200;
  if (s.name === 'aerial' || s.name === 'bridge' || s.name === 'title') return {...view, near: 0.5, far};
  // the hand shake grows with the distance to the target: keep the target near, on the same line of sight
  const d = Math.hypot(view.target[0] - view.pos[0], view.target[1] - view.pos[1], view.target[2] - view.pos[2]);
  const near = d > 8 ? {...view, target: lerp3(view.pos, view.target, 8 / d)} : view;
  return {...handheld(near, v, SHAKES), far};
};
