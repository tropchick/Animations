import {useThree} from '@react-three/fiber';
import {PerspectiveCamera} from 'three';
import {random} from 'remotion';
import {DECK} from './town';
import {V, V3, clamp01, gAt, lerp3, ramp} from './time';

export type View = {pos: V3; target: V3; fov: number};
type Shot = {from: number; to: number; pos: [V3, V3]; target: [V3, V3]; fov: number; ease?: boolean; accel?: boolean};

const D = DECK;

// Hard cuts between shots, a slow move inside each. Times are video seconds.
export const SHOTS: Shot[] = [
  // down from the sky over the bay to the pier
  {from: 0, to: 4.2, pos: [[30, 120, 70], [15, 7.5, 15]], target: [[-20, 60, -700], [-8, 10, -55]], fov: 55, ease: true},
  // the girl with her ice cream
  {from: 4.2, to: 5.2, pos: [[2.3, D + 1.1, 3.0], [2.35, D + 1.1, 3.15]], target: [[3.4, D + 0.95, 6.0], [3.4, D + 0.95, 6.0]], fov: 40},
  // the juggler
  {from: 5.2, to: 6.2, pos: [[-2.66, D + 1.4, 1.32], [-2.7, D + 1.4, 1.48]], target: [[-3.6, D + 1.25, 5.0], [-3.6, D + 1.25, 5.0]], fov: 46},
  // the kid on the trampoline
  {from: 6.2, to: 7.1, pos: [[-13.0, D + 1.7, 1.8], [-12.9, D + 1.7, 1.95]], target: [[-10.5, D + 2.0, 6.4], [-10.5, D + 2.0, 6.4]], fov: 50},
  // dad holding his son up
  {from: 7.1, to: 8.2, pos: [[-1.5, D + 1.8, 4.5], [-1.4, D + 1.8, 4.65]], target: [[1.7, D + 1.85, 7.9], [1.7, D + 1.85, 7.9]], fov: 48},
  // the scoop drops off the cone
  {from: 8.2, to: 11.2, pos: [[2.51, D + 0.95, 3.56], [2.58, D + 0.92, 3.72]], target: [[3.4, D + 0.55, 6.0], [3.4, D + 0.5, 6.0]], fov: 46},
  // the juggler can't keep up
  {from: 11.2, to: 13.6, pos: [[-2.66, D + 1.25, 1.4], [-2.72, D + 1.2, 1.6]], target: [[-3.6, D + 0.9, 5.0], [-3.6, D + 0.85, 5.0]], fov: 50},
  // the trampoline barely throws the kid up
  {from: 13.6, to: 16, pos: [[-12.6, D + 1.4, 2.6], [-12.5, D + 1.35, 2.8]], target: [[-10.5, D + 1.3, 6.4], [-10.5, D + 1.25, 6.4]], fov: 50},
  // dad puts his son down
  {from: 16, to: 18.7, pos: [[-1.5, D + 1.7, 4.5], [-1.4, D + 1.6, 4.7]], target: [[1.7, D + 1.5, 7.9], [1.7, D + 1.1, 7.9]], fov: 50},
  // the coaster can't make it up the lift hill and rolls back; the wheel stops
  {from: 18.7, to: 20.6, pos: [[31, D + 5, -35], [31.5, D + 5.2, -35.8]], target: [[16, D + 7, -51], [16, D + 6.5, -51]], fov: 52},
  // gulls land on the railing; the airliner sinks towards the mountains
  {from: 20.6, to: 22.2, pos: [[8.6, D + 1.75, 3.6], [8.5, D + 1.75, 3.7]], target: [[10, 250, -1300], [10, 245, -1300]], fov: 56},
  // people sit down; signs and balconies start to fall
  {from: 22.2, to: 25, pos: [[-9.5, 4.6, 0.5], [-9.1, 4.7, 0.7]], target: [[8, 3.0, 9], [8.3, 3.0, 9]], fov: 58},
  // everyone lies down
  {from: 25, to: 28.2, pos: [[-14, D + 5.5, -1.5], [-12.5, D + 6.4, -2.4]], target: [[5, D + 0.8, 13], [6, D + 0.8, 13]], fov: 56},
  // the houses fold
  {from: 28.2, to: 31.4, pos: [[12, D + 12, 3], [11, D + 12.3, 3.6]], target: [[-25, D + 3, 25], [-25, D + 2.6, 25]], fov: 58},
  // the Ferris wheel buckles and rolls into the sea
  {from: 31.4, to: 34.2, pos: [[12, D + 11, -24], [11, D + 11.5, -25]], target: [[-20, D + 8, -64], [-25, D + 5, -64]], fov: 58},
  // the bridge cables snap
  {from: 34.2, to: 36, pos: [[-150, 42, -282], [-146, 40, -286]], target: [[10, 18, -345], [10, 15, -345]], fov: 64},
  // the mountains sink
  {from: 36, to: 38, pos: [[75, 7, -30], [75, 7.5, -34]], target: [[120, 110, -1100], [120, 80, -1100]], fov: 32},
  // the clouds come down, the sky turns black
  {from: 38, to: 42, pos: [[10, 22, 46], [10, 25, 49]], target: [[-10, 45, -600], [-10, 35, -600]], fov: 60},
  // the world is flat; the camera shoots up
  {from: 42, to: 46, pos: [[0, 32, 60], [0, 420, 320]], target: [[0, 0, -300], [0, 0, -520]], fov: 60, accel: true},
  // space: satellites fall
  {from: 46, to: 50, pos: [[7, 4.5, 37], [5, 3.6, 32]], target: [[0, 0, 0], [0, 0, 0]], fov: 50},
  // the Moon falls and is torn apart
  {from: 50, to: 54, pos: [[-40, 0, 70], [-36, 0, 64]], target: [[0, -15, -10], [0, -15, -10]], fov: 58},
  // the planet goes dark, the debris spirals in, starlight bends
  {from: 54, to: 58, pos: [[0, 16, 52], [0, 10, 46]], target: [[0, 0, 0], [0, 0, 0]], fov: 50},
  // a black hole
  {from: 58, to: V.end + 0.1, pos: [[0, 7, 48], [0, 5, 40]], target: [[0, 0, 0], [0, 0, 0]], fov: 50, ease: true},
];

// The ground shakes harder as things break; nothing shakes in space.
const shake = (v: number): V3 => {
  if (v >= V.space) return [0, 0, 0];
  const g = gAt(v);
  let a = clamp01((g - 4) / 30) * 0.25;
  if (v > 28.2 && v < 34.2) a = 0.12 + 0.2 * clamp01((g - 6) / 6);
  if (a <= 0) return [0, 0, 0];
  const f = Math.floor(v * 30);
  return [(random(`gx-${f}`) - 0.5) * a, (random(`gy-${f}`) - 0.5) * a, (random(`gz-${f}`) - 0.5) * a];
};

export const shotAt = (v: number): View => {
  const s = SHOTS.find((x) => v >= x.from && v < x.to) ?? SHOTS[SHOTS.length - 1];
  const k = s.accel ? ramp(v, s.from, s.to, (t) => t * t * t) : s.ease ? ramp(v, s.from, s.to) : ramp(v, s.from, s.to, (t) => t);
  const pos = lerp3(s.pos[0], s.pos[1], k);
  const j = shake(v);
  const dist = Math.hypot(s.target[0][0] - s.pos[0][0], s.target[0][1] - s.pos[0][1], s.target[0][2] - s.pos[0][2]);
  const scale = Math.min(3, Math.max(0.3, dist / 14));
  return {pos: [pos[0] + j[0] * scale, pos[1] + j[1] * scale, pos[2] + j[2] * scale], target: lerp3(s.target[0], s.target[1], k), fov: s.fov};
};

export const CameraRig: React.FC<{v: number; view?: View}> = ({v, view}) => {
  const camera = useThree((st) => st.camera) as PerspectiveCamera;
  const {pos, target, fov} = view ?? shotAt(v);
  camera.position.set(...pos);
  camera.up.set(0, 1, 0);
  camera.lookAt(...target);
  camera.fov = fov;
  camera.near = 0.1;
  camera.far = 9000;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return null;
};
