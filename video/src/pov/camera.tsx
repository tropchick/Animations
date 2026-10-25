import {useThree} from '@react-three/fiber';
import {PerspectiveCamera} from 'three';
import {HEAD_LYING} from './Bedroom';
import {HERO_YARD, HERO_YARD_YAW} from './HouseFront';
import {FINALISTS, memberPos} from './Field';
import {BED_FLOP, EYES_OPEN, MONEY_SLAP, SLAP, ShotState, V3, add3, lerp, lerp3, smooth, wordStart} from './cues';

export type View = {pos: V3; target: V3; fov: number; up?: V3};

const move = (pos: [V3, V3], target: [V3, V3], fov: number, k: number, up?: V3): View => ({
  pos: lerp3(pos[0], pos[1], k),
  target: lerp3(target[0], target[1], k),
  fov,
  up,
});

const yardFace = (): View => {
  const head: V3 = [HERO_YARD[0], 1.78, HERO_YARD[2]];
  const f: V3 = [Math.sin(HERO_YARD_YAW), 0, Math.cos(HERO_YARD_YAW)];
  return {pos: add3(head, [f[0] * 1.25, -0.04, f[2] * 1.25]), target: add3(head, [0, -0.06, 0]), fov: 40};
};

const mid = (a: V3, b: V3): V3 => lerp3(a, b, 0.5);

// one view per shot; some shots cut inside to a second angle
export const viewOf = (s: ShotState, v: number): View => {
  const {t, k} = s;
  const e = smooth(k);
  switch (s.name) {
    case 'alarm':
    case 'alarm2':
      return {pos: [0.86, 0.86, -3.0], target: [1.35, 0.62, -3.12], fov: 58};
    case 'wake':
      return t < 3.55
        ? move([[2.25, 1.55, 0.95], [2.0, 1.5, 0.55]], [[-0.4, 1.1, -2.0], [-0.4, 1.05, -2.0]], 50, smooth(t / 3.55))
        : move([[1.45, 1.74, -2.15], [1.38, 1.72, -2.05]], [[-3.5, 1.45, -0.55], [-3.5, 1.45, -0.6]], 46, smooth((t - 3.55) / 3.3));
    case 'cameras': {
      const z = lerp(3.4, -4.6, k);
      return {pos: [0.05 * Math.sin(t * 9), 1.5 + 0.03 * Math.sin(t * 18), z], target: [0, 1.35, z - 6], fov: 60};
    }
    case 'door':
      return move([[0, 1.74, 0.15], [0, 1.72, 0.3]], [[0, 1.3, 3.5], [0, 1.28, 3.5]], 55, e);
    case 'keys':
      return move([[0.42, 1.95, 0.2], [0.4, 1.93, 0.28]], [[-0.15, 1.3, 2.2], [-0.15, 1.28, 2.2]], 50, e);
    case 'crying':
      return v < wordStart(38) - 0.2 ? move([[-1.0, 2.6, 17.5], [-1.0, 2.5, 16.8]], [[-1.2, 0.9, 8], [-1.2, 0.9, 8]], 40, smooth(t / 3.5)) : yardFace();
    case 'field':
      return move([[0, 12, 30], [0, 31, 22]], [[0, 0, 2], [0, 0, -1]], 50, e);
    case 'timelapse': {
      const a = 0.25 * k;
      return {pos: [0.01, 62, 0.01], target: [0, 0, 0], fov: 48, up: [Math.sin(a), 0, -Math.cos(a)]};
    }
    case 'sleeper': {
      const m = mid(memberPos(FINALISTS[0]), memberPos(FINALISTS[1]));
      return move([[m[0], 0.95, m[2] - 8.2], [m[0], 1.0, m[2] - 7.6]], [[m[0], 1.4, m[2]], [m[0], 1.4, m[2]]], 55, e);
    }
    case 'studio':
      return t < 3.3
        ? move([[1.15, 1.8, 4.6], [1.05, 1.8, 4.3]], [[0, 1.7, -1.5], [0, 1.7, -1.5]], 40, smooth(t / 3.3))
        : move([[0.12, 1.86, 0.45], [0.1, 1.85, 0.25]], [[0, 1.82, -1.5], [0, 1.82, -1.5]], 34, smooth((t - 3.3) / 3.5));
    case 'lcd':
      return t < 1.35 ? {pos: [0.6, 1.75, 4.2], target: [0, 1.75, -1.5], fov: 40} : move([[-0.1, 1.7, 0.6], [-0.05, 1.7, 0.72]], [[0.15, 1.55, 2.6], [0.15, 1.55, 2.6]], 45, smooth((t - 1.35) / 1.5));
    case 'beach':
      return v < wordStart(95) - 0.15
        ? move([[-3, 4, -9], [-2.6, 3.6, -8]], [[2, 0.5, 6], [2, 0.6, 6]], 50, smooth(t / 3))
        : move([[6.7, 1.8, 6.5], [6.4, 1.75, 6.2]], [[2.4, 1.1, 3.9], [2.4, 1.1, 3.9]], 45, smooth((v - wordStart(95)) / 2.5));
    case 'digging': {
      const a = 0.4 + 1.1 * k;
      return {pos: [Math.sin(a) * 25, 17 - 3 * k, Math.cos(a) * 25], target: [0, 0, 0], fov: 55};
    }
    case 'editroom':
      return move([[0.45, 1.6, 2.7], [0.25, 1.45, 1.75]], [[0, 1.2, -0.8], [0, 1.2, -0.8]], 48, e);
    case 'editorface':
      return t < 1.2 ? {pos: [0.05, 1.44, 1.4], target: [0, 1.42, 0.25], fov: 40} : move([[-0.5, 1.5, 3.0], [-0.5, 1.48, 2.85]], [[-0.5, 1.15, 0.4], [-0.5, 1.15, 0.4]], 50, smooth((t - 1.2) / 2.7));
    case 'money':
      return t < 1.7
        ? move([[-1.45, 2.15, -0.8], [-1.48, 2.18, -0.95]], [[-1.55, 2.25, -1.64], [-1.55, 2.25, -1.64]], 35, smooth(t / 1.7))
        : move([[0.35, 2.4, 0.1], [0.36, 2.3, 0.05]], [[0.45, 0.78, -0.45], [0.45, 0.78, -0.45]], 50, smooth((t - 1.7) / 4.9));
    case 'editorcry':
      return move([[0.3, 1.5, 2.5], [0.28, 1.47, 2.3]], [[0.25, 1.2, 0.4], [0.25, 1.2, 0.4]], 45, e);
    case 'phone':
      return {pos: [0.5, 1.3, -1.2], target: [1.2, 0.6, -3.0], fov: 50};
    case 'bed':
      return move([[2.4, 2.5, 0.9], [2.7, 3.0, 1.5]], [[0.4, 0.7, -1.8], [0.4, 0.7, -1.9]], 50, e);
    case 'eyes': {
      const h = HEAD_LYING;
      return move([[h[0], h[1] + 1.0, h[2] + 0.02], [h[0], h[1] + 0.85, h[2] + 0.02]], [[h[0], h[1] + 0.1, h[2]], [h[0], h[1] + 0.1, h[2]]], 40, e, [0, 0, -1]);
    }
  }
};

// short shakes on hits: [time, strength]
const SHAKES: [number, number][] = [
  [SLAP, 0.025],
  [MONEY_SLAP, 0.03],
  [BED_FLOP, 0.06],
  [EYES_OPEN, 0.012],
];

const shakeAt = (v: number, s: ShotState): V3 => {
  let a = 0;
  for (const [t, st] of SHAKES) {
    const d = v - t;
    if (d >= 0 && d < 0.8) a += st * Math.exp(-d * 7);
  }
  // ringing alarm jitters the waking eye a little
  if ((s.name === 'alarm' && v < SLAP) || s.name === 'alarm2') a += 0.004;
  // handheld feel in the crying shot
  if (s.name === 'crying' || s.name === 'editorcry') a += 0.006;
  if (a <= 0) return [0, 0, 0];
  return [a * Math.sin(v * 67), a * Math.sin(v * 53 + 1.3), a * 0.6 * Math.sin(v * 71 + 2.1)];
};

export const CameraRig: React.FC<{s: ShotState; v: number; view?: View}> = ({s, v, view}) => {
  const camera = useThree((st) => st.camera) as PerspectiveCamera;
  const base = view ?? viewOf(s, v);
  const sh = shakeAt(v, s);
  camera.up.set(...(base.up ?? [0, 1, 0]));
  camera.position.set(...add3(base.pos, sh));
  camera.lookAt(...add3(base.target, [sh[0] * 1.5, sh[1] * 1.5, sh[2]]));
  camera.fov = base.fov;
  camera.near = 0.03;
  camera.far = 2500;
  camera.updateProjectionMatrix();
  return null;
};

