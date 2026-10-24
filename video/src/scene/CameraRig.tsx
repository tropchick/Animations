import {useThree} from '@react-three/fiber';
import {PerspectiveCamera} from 'three';
import {lerp3, ramp} from '../timeline';

type V3 = [number, number, number];

type Shot = {
  from: number;
  to: number;
  pos: [V3, V3];
  target: [V3, V3];
  fov: number;
};

// Character anchors used by several shots.
export const DAD: V3 = [-2.6, 0, -4.15];
export const GIRL: V3 = [0.4, 0, -1.2];
export const DOG: V3 = [1.6, 0, 0.6];
export const DOG_ROT = 0.5;
export const POOL: V3 = [6, 0, 1];
export const SIDE_TABLE: V3 = [9.1, 0, 2.6];

const DAD_HEAD: V3 = [DAD[0], 1.72, DAD[2]];
const DOG_SNOUT: V3 = [DOG[0] + Math.sin(DOG_ROT) * 0.57, 0.8, DOG[2] + Math.cos(DOG_ROT) * 0.57];

// Hard cuts between shots, smooth moves inside each shot. Times are video seconds.
const SHOTS: Shot[] = [
  {from: 0, to: 6, pos: [[0.5, 4.4, 16], [0.3, 3.6, 12]], target: [[0.5, 1.7, -4], [0.3, 1.5, -4]], fov: 55},
  {from: 6, to: 9, pos: [[3.6, 1.0, 3.6], [3.2, 0.95, 3.1]], target: [[1.7, 0.75, 0.8], [1.7, 0.8, 0.8]], fov: 42},
  {from: 9, to: 12, pos: [[-2.6, 1.95, 0.8], [-2.6, 1.9, -1.2]], target: [DAD_HEAD, DAD_HEAD], fov: 38},
  {from: 12, to: 19, pos: [[1.8, 1.0, 11.5], [1.4, 1.15, 10.2]], target: [[0, 5.5, -8], [0, 5.8, -8]], fov: 62},
  {from: 19, to: 21, pos: [[-1.2, 1.7, -1.5], [-1.35, 1.65, -1.75]], target: [[-2.6, 1.0, -3.3], [-2.6, 1.0, -3.3]], fov: 40},
  {from: 21, to: 25.5, pos: [[-1.0, 1.55, -2.3], [-1.25, 1.6, -2.6]], target: [[-2.6, 1.45, -4.15], [-2.6, 1.55, -4.15]], fov: 40},
  {from: 25.5, to: 30, pos: [[2.2, 1.25, 1.8], [2.0, 1.3, 1.5]], target: [[0.4, 1.9, -1.3], [0.4, 2.0, -1.3]], fov: 52},
  {from: 30, to: 32.5, pos: [[11, 3.2, 8.2], [10.4, 2.9, 7.4]], target: [[6, 0.2, 0.5], [6, 0.2, 0.5]], fov: 50},
  {
    from: 32.5,
    to: 34.5,
    pos: [[SIDE_TABLE[0] - 0.55, 0.92, SIDE_TABLE[2] + 0.75], [SIDE_TABLE[0] - 0.45, 0.88, SIDE_TABLE[2] + 0.6]],
    target: [[SIDE_TABLE[0], 0.68, SIDE_TABLE[2]], [SIDE_TABLE[0], 0.68, SIDE_TABLE[2]]],
    fov: 34,
  },
  {
    from: 34.5,
    to: 39,
    pos: [
      [DOG_SNOUT[0] + 0.75, 0.82, DOG_SNOUT[2] + 0.75],
      [DOG_SNOUT[0] + 0.55, 0.78, DOG_SNOUT[2] + 0.6],
    ],
    target: [DOG_SNOUT, DOG_SNOUT],
    fov: 38,
  },
  {from: 39, to: 48, pos: [[-2.2, 2.0, 6.8], [-1.7, 2.3, 5.6]], target: [[0, 3.6, -9], [0, 3.9, -9]], fov: 60},
  {from: 57, to: 63, pos: [[0.6, 3.0, 13.5], [0.4, 3.2, 12.3]], target: [[0.4, 2.4, -6], [0.4, 2.4, -6]], fov: 56},
  {from: 63, to: 68.1, pos: [[0.4, 3.4, 12.3], [0, 12.5, 18.5]], target: [[0.4, 2.2, -6], [0, 0, -5]], fov: 56},
];

const orbitDad = (v: number) => {
  // 48s..57s: slow orbit around the frozen dad.
  const t = ramp(v, 48, 57, (x) => x);
  const a = 0.85 - t * 1.6;
  const r = 3.2 - t * 0.6;
  return {
    pos: [DAD[0] + Math.sin(a) * r, 2.05 - t * 0.05, DAD[2] + Math.cos(a) * r] as V3,
    target: [DAD[0], 1.74, DAD[2]] as V3,
    fov: 42,
  };
};

export const shotAt = (v: number) => {
  if (v >= 48 && v < 57) return orbitDad(v);
  const shot = SHOTS.find((s) => v >= s.from && v < s.to) ?? SHOTS[SHOTS.length - 1];
  const k = ramp(v, shot.from, shot.to);
  return {pos: lerp3(shot.pos[0], shot.pos[1], k), target: lerp3(shot.target[0], shot.target[1], k), fov: shot.fov};
};

export const CameraRig: React.FC<{v: number}> = ({v}) => {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const {pos, target, fov} = shotAt(v);
  camera.position.set(...pos);
  camera.lookAt(...target);
  if (camera.fov !== fov) {
    camera.fov = fov;
  }
  camera.near = 0.05;
  camera.far = 900;
  camera.updateProjectionMatrix();
  return null;
};
