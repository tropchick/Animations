import {V3, add3, lerp, lerp3, ramp, smooth} from '../cues';
import {MACRO_X} from '../Macro';
import {RECORDER} from '../Hall';
import {View, handheld} from '../camera';
import {LEVER, LIGHTS_OFF, RADIO_CLICK, Shot2, shotAt, shotStart} from './cues';
import {CAMPUS_X, GLEB_ON_ROOF, RADIO_POS, WINDOW_Z} from './Campus';
import {TUNNEL_X} from './Tunnel';

const M = (p: V3): V3 => [p[0] + MACRO_X, p[1], p[2]];
const C = (p: V3): V3 => [p[0] + CAMPUS_X, p[1], p[2]];
const T = (p: V3): V3 => [p[0] + TUNNEL_X, p[1], p[2]];
const move = (a: V3, b: V3, ta: V3, tb: V3, fov: number, fov2 = fov) => (k: number): View => ({
  pos: lerp3(a, b, smooth(k)),
  target: lerp3(ta, tb, smooth(k)),
  fov: lerp(fov, fov2, smooth(k)),
});
const orbit = (center: V3, r: number, h: number, a0: number, a1: number, target: V3, fov: number) => (k: number): View => {
  const a = lerp(a0, a1, smooth(k));
  return {pos: [center[0] + Math.sin(a) * r, h, center[2] + Math.cos(a) * r], target, fov};
};

const G = GLEB_ON_ROOF;
const FACING: V3 = [-0.45, 0, -0.9];
const R = C(RADIO_POS);

const VIEWS: Record<Shot2, (k: number, v: number, t: number) => View> = {
  jarsink: move(M([3.75, 1.15, 3.55]), M([3.2, 0.85, 3.05]), M([1.9, 0.15, 1.85]), M([1.85, 0.1, 1.8]), 40),
  recorder: move(add3(RECORDER, [0.06, 0.17, 0.2]), add3(RECORDER, [0.035, 0.12, 0.14]), add3(RECORDER, [0, 0.02, -0.02]), add3(RECORDER, [0, 0.02, -0.02]), 34),
  swarm: orbit(M([0, 0, 0]), 1.9, 1.0, 0.4, 1.3, M([0, -0.45, 0]), 38),
  sinking: move([-6.25, 0.83, -2.52], [-6.28, 0.82, -2.6], [-6.62, 0.95, -3.12], [-6.62, 0.95, -3.12], 46),
  phone: move([-3.6, 1.75, 5.3], [-3.8, 1.85, 6.0], [-2.15, 1.4, 2.3], [-2.15, 1.4, 2.3], 44),
  door: move([-3.3, 1.65, -9.75], [-3.36, 1.62, -9.6], [-4.3, 1.35, -7.2], [-4.32, 1.4, -7.2], 58),
  face: move([-4.5, 1.56, -5.35], [-4.5, 1.57, -5.6], [-4.5, 1.6, -7.4], [-4.5, 1.6, -7.4], 30),
  window: move([-4.5, 1.6, -6.95], [-4.5, 1.58, -6.9], [-1.8, 0.2, -1.2], [-2.6, 0.2, -1.6], 52),
  deskgone: move([-4.5, 1.6, -6.95], [-4.52, 1.58, -6.85], [-6.4, 0.25, -3.1], [-6.45, 0.25, -3.05], 44, 30),
  doorgap: (k) => {
    const kk = smooth(ramp(k, 0.3, 1));
    return {
      pos: lerp3([-4.02, 1.32, -7.98], [-4.2, 0.32, -7.72], kk),
      target: lerp3([-4.38, 1.26, -7.14], [-4.46, 0.02, -7.14], kk),
      fov: 40,
    };
  },
  yard: (k) => ({pos: C([3.2, 9.6, 5.2]), target: C([0.4, 2.2, lerp(-1, -9, smooth(k))]), fov: 46}),
  tunnel: move(T([-0.35, 1.55, 0.6]), T([-0.3, 1.5, -1.6]), T([0.3, 1.45, -14]), T([0.3, 1.45, -14]), 50),
  waiting: move(C([0.3, 5.95, WINDOW_Z + 2.95]), C([0.28, 5.92, WINDOW_Z + 2.8]), C([-0.2, 5.1, WINDOW_Z - 8]), C([-0.2, 5.1, WINDOW_Z - 8]), 46),
  radio: (_k, v) => {
    const push = smooth(ramp(v, RADIO_CLICK, RADIO_CLICK + 0.25));
    return {pos: lerp3(add3(R, [0.06, 0.13, 0.72]), add3(R, [0.04, 0.11, 0.42]), push), target: add3(R, [0, 0.09, 0]), fov: 36};
  },
  silent: move(add3(R, [-0.05, 0.11, 0.46]), add3(R, [-0.055, 0.11, 0.44]), add3(R, [0, 0.08, 0]), add3(R, [0, 0.08, 0]), 36),
  osoka: () => ({pos: C([28, 6, 16]), target: C([0, 5, -18]), fov: 50}),
  roof: move(C(add3(G, [2.4, 1.5, 3.9])), C(add3(G, [2.6, 2.3, 4.3])), C(add3(G, [-3.6, 0.6, -7.2])), C(add3(G, [-3.6, 0.6, -7.2])), 46),
  roofview: move(C(add3(G, [FACING[0] * 0.6, 1.75, FACING[2] * 0.6])), C(add3(G, [FACING[0] * 0.6, 1.75, FACING[2] * 0.6])), C([-9, 3, 14]), C([1, 1, -22]), 50),
  aerial: (_k, _v, t) => {
    const e = 1 - Math.pow(1 - ramp(t, 0, 2.6), 3);
    return {pos: lerp3(C(add3(G, [1.5, 6, 6])), C([8, 150, 24]), e), target: lerp3(C(G), C([3, 0, 2]), e), fov: 40};
  },
  title: () => ({pos: C([8, 150, 24]), target: C([3, 0, 2]), fov: 40}),
};

const CAMPUS_SHOTS: Shot2[] = ['yard', 'waiting', 'radio', 'silent', 'osoka', 'roof', 'roofview', 'aerial', 'title'];

const SHAKES: [number, number][] = [
  [LEVER, 0.45],
  [RADIO_CLICK, 0.5],
  [LIGHTS_OFF, 0.35],
];

export const viewAt2 = (v: number): View => {
  const s = shotAt(v);
  const view = VIEWS[s.name](s.k, v, s.t);
  // the aerial view is a drone-like move: no hand shake
  const far = CAMPUS_SHOTS.includes(s.name) ? 2000 : 200;
  if (s.name === 'aerial' || s.name === 'title') return {...view, near: 0.5, far};
  return {...handheld(view, v, SHAKES), far};
};

export const shotFrom = shotStart;
