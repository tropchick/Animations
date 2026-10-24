import {useThree} from '@react-three/fiber';
import {PerspectiveCamera} from 'three';
import {COUNT_ZERO, LID, LOCKS, ShotName, V3, add3, lerp, lerp3, shotAt, shotStart, smooth} from './cues';
import {MACRO_X} from './Macro';
import {MONITOR, NOTEBOOK, RECORDER, SPOT, gripperY} from './Hall';
import {CORRIDOR_X} from './Corridor';

type View = {pos: V3; target: V3; fov: number; up?: V3; near?: number};
const M = (p: V3): V3 => [p[0] + MACRO_X, p[1], p[2]];
const move = (a: V3, b: V3, ta: V3, tb: V3, fov: number, up?: V3) => (k: number): View => ({
  pos: lerp3(a, b, smooth(k)),
  target: lerp3(ta, tb, smooth(k)),
  fov,
  up,
});

const orbit = (center: V3, r: number, h: number, a0: number, a1: number, target: V3, fov: number) => (k: number): View => {
  const a = lerp(a0, a1, smooth(k));
  return {pos: [center[0] + Math.sin(a) * r, h, center[2] + Math.cos(a) * r], target, fov};
};

const SHOTS: Record<ShotName, (k: number, v: number, t: number) => View> = {
  grain: move(M([2.3, 1.0, 2.7]), M([1.05, 0.55, 1.3]), M([0, 0.2, 0]), M([0, 0.2, 0]), 32),
  recorder: move(add3(RECORDER, [0.06, 0.17, 0.2]), add3(RECORDER, [0.035, 0.12, 0.14]), add3(RECORDER, [0, 0.02, -0.02]), add3(RECORDER, [0, 0.02, -0.02]), 34),
  hall: move([-3.45, 1.9, 4.6], [-3.9, 2.4, 5.3], [-0.4, 1.1, 0.2], [-0.3, 1.0, 0.1], 50),
  microscope: orbit(M([0, 0, 0]), 1.25, 0.42, 0.3, 0.9, M([0, 0.2, 0]), 30),
  dust: move(M([-1.6, 1.3, 4.6]), M([-1.3, 1.15, 4.0]), M([1.1, 0.6, -0.5]), M([1.1, 0.6, -0.5]), 42),
  arm: (k, v) => ({...move([1.9, 1.7, 2.0], [1.7, 1.35, 1.75], [0, 0, 0], [0, 0, 0], 40)(k), target: [0, Math.max(0.65, gripperY(v) - 0.05), 0]}),
  chamber: move([0.0, 0.95, 3.4], [0.12, 1.05, 2.7], [0, 1.15, 0], [0, 1.2, 0], 44),
  locks: move([0.75, 2.12, 1.5], [0.4, 2.02, 1.62], [0, 1.9, 0.75], [-0.05, 1.9, 0.72], 40),
  counter: move(add3(MONITOR, [0.1, 0.03, 1.05]), add3(MONITOR, [0.03, 0.0, 0.86]), MONITOR, MONITOR, 34),
  approach: move([0.55, 1.4, -2.3], [0.45, 1.32, -2.0], [-0.9, 1.25, 1.4], [-0.7, 1.2, 1.2], 42),
  glass: move([-0.05, 1.45, 1.65], [0.1, 1.4, 1.55], [-0.32, 1.1, 0.45], [-0.28, 1.05, 0.42], 44, [0.17, 1, 0]),
  corridor: move([CORRIDOR_X, 1.6, -0.5], [CORRIDOR_X, 1.55, -3.0], [CORRIDOR_X, 1.25, -22], [CORRIDOR_X, 1.25, -22], 48),
  desk: move([-6.55, 1.05, -2.35], [-6.58, 0.95, -2.6], [-6.62, 0.79, -3.06], [-6.62, 0.785, -3.06], 40),
  glint: move([-6.53, 0.8, -2.86], [-6.545, 0.79, -2.9], SPOT, SPOT, 28),
  pit: move(M([0, 3.4, 2.4]), M([0, 1.6, 1.15]), M([0, -0.3, 0]), M([0, -0.3, 0]), 40),
  rim: move(M([2.4, 0.7, 1.9]), M([2.1, 0.6, 1.7]), M([0.6, -0.2, 0.4]), M([0.6, -0.2, 0.4]), 34),
  bottom: move(M([0.9, 0.55, 1.1]), M([0.6, 0.3, 0.75]), M([0.05, -0.33, 0.02]), M([0.05, -0.33, 0.02]), 36),
  jar: move([-6.62, 0.86, -2.66], [-6.62, 0.85, -2.7], [SPOT[0], 0.84, SPOT[2]], [SPOT[0], 0.83, SPOT[2]], 36),
  note: move([-7.03, 1.32, -2.6], [-7.04, 1.27, -2.64], NOTEBOOK, NOTEBOOK, 34),
  hands: move([-6.62, 0.98, -2.55], [-6.64, 0.96, -2.6], [-6.75, 0.78, -2.92], [-6.75, 0.78, -2.92], 36),
  jarhold: move([-6.45, 0.9, -2.55], [-6.5, 0.87, -2.65], [SPOT[0], 0.815, SPOT[2]], [SPOT[0], 0.812, SPOT[2]], 36),
  shock: (_k, _v, t) => {
    const k = smooth(Math.min(1, t / 0.35));
    return {pos: lerp3(M([0, 1.5, 4.3]), M([0, 0.95, 3.0]), k), target: M([0, -0.5, 0]), fov: 36};
  },
  title: () => ({pos: M([0, 0.95, 3.0]), target: M([0, -0.5, 0]), fov: 36}),
};

const SHAKES: [number, number][] = [
  [LID, 0.5],
  [LOCKS[0], 0.25],
  [LOCKS[1], 0.25],
  [LOCKS[2], 0.3],
  [COUNT_ZERO, 0.45],
  [shotStart('shock'), 1.4],
];

export const viewAt = (v: number): View => {
  const s = shotAt(v);
  const view = SHOTS[s.name](s.k, v, s.t);
  const d = Math.hypot(view.pos[0] - view.target[0], view.pos[1] - view.target[1], view.pos[2] - view.target[2]);
  // breathing handheld drift, scaled to how close the camera is
  const h = d * 0.006;
  let jolt = 0;
  for (const [at, a] of SHAKES) {
    const x = v - at;
    if (x >= 0 && x < 0.8) jolt += a * Math.exp(-x * 7);
  }
  const j = d * 0.012 * jolt;
  const off: V3 = [
    h * (Math.sin(v * 1.3) + 0.5 * Math.sin(v * 3.1 + 1)) + j * Math.sin(v * 71),
    h * (Math.sin(v * 1.7 + 2) + 0.4 * Math.sin(v * 2.6)) + j * Math.sin(v * 57 + 1.3),
    h * 0.6 * Math.sin(v * 1.1 + 4) + j * 0.5 * Math.sin(v * 63 + 2.1),
  ];
  return {...view, pos: add3(view.pos, off), near: Math.min(0.1, Math.max(0.003, d * 0.02))};
};

export const CameraRig: React.FC<{v: number}> = ({v}) => {
  const camera = useThree((st) => st.camera) as PerspectiveCamera;
  const {pos, target, fov, up, near} = viewAt(v);
  camera.up.set(...(up ?? [0, 1, 0]));
  camera.position.set(...pos);
  camera.lookAt(...target);
  camera.fov = fov;
  camera.near = near ?? 0.05;
  camera.far = 200;
  camera.updateProjectionMatrix();
  return null;
};
