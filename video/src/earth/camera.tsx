import {useThree} from '@react-three/fiber';
import {PerspectiveCamera} from 'three';
import {random} from 'remotion';
import {CAFE_X, CAFE_Z} from './street';
import {METRO} from './city';
import {BALLOON_GONE, RELEASE_HAND, balloonAt} from './cast';
import {V, V3, clamp01, lerp3, ramp, restartK, windKmh} from './time';

export type View = {pos: V3; target: V3; fov: number};
type Shot = {from: number; to: number; pos: [V3, V3]; target: [V3, V3]; fov: number; ease?: boolean; track?: boolean};

const M = METRO;

// Hard cuts between shots, a slow move inside each. Times are video seconds.
export const SHOTS: Shot[] = [
  // the city from above, coming down to the avenue
  {from: 0, to: 4.2, pos: [[-78, 64, 3], [-22, 5.5, 5]], target: [[10, 24, -12], [12, 5, -7]], fov: 55, ease: true},
  // coffee on the café table
  {from: 4.2, to: 5.5, pos: [[CAFE_X[0] + 1.0, 1.4, CAFE_Z + 1.4], [CAFE_X[0] + 0.85, 1.3, CAFE_Z + 1.2]], target: [[CAFE_X[0], 0.95, CAFE_Z], [CAFE_X[0], 0.95, CAFE_Z]], fov: 34},
  // courier waiting at the crosswalk on his scooter
  {from: 5.5, to: 6.8, pos: [[-6.0, 1.6, 4.6], [-6.2, 1.65, 4.9]], target: [[-7.5, 1.35, 8.0], [-7.5, 1.35, 8.0]], fov: 40},
  // the girl with the red balloon and her mom
  {from: 6.8, to: 8.2, pos: [[-1.2, 1.25, 6.4], [-1.4, 1.3, 6.6]], target: [[-3.3, 1.45, 9.5], [-3.3, 1.5, 9.5]], fov: 44},
  // the avenue: the braking starts
  {from: 8.2, to: 11.2, pos: [[-32, 5.6, 3.6], [-31, 5.8, 3.4]], target: [[6, 4, -8], [6, 4.5, -8]], fov: 56},
  // people on the south sidewalk stumble, pigeons take off
  {from: 11.2, to: 14.5, pos: [[5.5, 1.6, 3.8], [5.0, 1.7, 4.2]], target: [[-5, 1.5, 9.4], [-5, 1.7, 9.4]], fov: 52},
  // the café: coffee tilts, umbrellas tear away, cups skid
  {from: 14.5, to: 17.5, pos: [[6.5, 0.9, -5.0], [6.9, 1.0, -5.3]], target: [[14.5, 1.5, -9.6], [14.5, 1.8, -9.6]], fov: 52},
  // the balloon is torn out of her hand; the courier runs to her
  {from: 17.5, to: 19.6, pos: [[-2.6, 1.2, 3.2], [-2.4, 1.1, 3.0]], target: [[-3.6, 2.2, 9.4], [-3.6, 2.6, 9.4]], fov: 56, track: true},
  // everyone runs across the avenue; the bus goes over
  {from: 19.6, to: 22.6, pos: [[-17, 3.4, 2.5], [-16.4, 3.6, 2.8]], target: [[2, 1.6, -3], [3, 1.8, -3]], fov: 56},
  // down into the metro
  {from: 22.6, to: 26, pos: [[M[0] + 4.2, 2.5, M[2] + 5.8], [M[0] + 4.0, 2.7, M[2] + 6.2]], target: [[M[0] - 0.5, 0.6, M[2]], [M[0] - 0.5, 0.4, M[2]]], fov: 52},
  // cars start to slide and roll down the avenue
  {from: 26, to: 29.2, pos: [[-6.5, 1.1, 9.4], [-6.1, 1.2, 9.6]], target: [[-30, 1.4, 3], [-30, 1.6, 3]], fov: 54},
  // looking up at towers A and B: windows blow out, the billboard tears off
  {from: 29.2, to: 32.8, pos: [[-24, 1.5, 6.5], [-24.5, 1.7, 6.2]], target: [[-30, 34, -14], [-29, 40, -14]], fov: 62},
  // the crane on the roof of tower B goes over
  {from: 32.8, to: 37.2, pos: [[34, 104, 52], [33, 101, 50]], target: [[-11, 112, -22], [-6, 100, -22]], fov: 52},
  // high over the avenue: the low row starts to come apart
  {from: 37.2, to: 41.2, pos: [[-34, 40, -4], [-30, 38, -2]], target: [[8, 12, 19], [12, 12, 19]], fov: 58},
  // street level, looking up: the rooms of tower C blow out
  {from: 41.2, to: 44.6, pos: [[4, 1.8, 6], [4.5, 2.0, 5.5]], target: [[18, 40, -24], [18, 46, -24]], fov: 64},
  // the climax: towers stripped to their frames
  {from: 44.6, to: 48, pos: [[-62, 26, 34], [-58, 28, 32]], target: [[2, 36, -22], [4, 36, -22]], fov: 60},
  // zero: bare streets from above, the metro in the middle
  {from: 48, to: 53, pos: [[M[0] + 22, 42, 32], [M[0] + 19, 39, 29]], target: [[M[0] - 6, 0, -4], [M[0] - 6, 0, -4]], fov: 54},
  // the restart: rubble is left behind and shoots west, the frames whip back
  {from: 53, to: 61, pos: [[12, 2.6, 10], [11, 2.8, 10]], target: [[-12, 7, -10], [-14, 9, -10]], fov: 64},
  // silence; the M sign comes back on
  {from: 61, to: 66.1, pos: [[M[0] + 1.5, 2.6, M[2] + 9], [M[0] + 8, 62, M[2] + 70]], target: [[M[0] + 1.5, 2.6, M[2] + 1.6], [M[0], 0, M[2] - 2]], fov: 52, ease: true},
];

// Shake grows with the wind; a hard jolt when the Earth snaps back.
const shake = (v: number): V3 => {
  const w = windKmh(v);
  let a = clamp01((w - 150) / 900) * 0.35;
  if (v >= V.restart && v < V.restart + 1.2) a += 0.6 * (1 - (v - V.restart) / 1.2);
  if (v >= V.zero && v < V.restart) a *= 0.35; // slow motion
  if (a <= 0) return [0, 0, 0];
  const f = Math.floor(v * 30);
  return [(random(`sx-${f}`) - 0.5) * a, (random(`sy-${f}`) - 0.5) * a, (random(`sz-${f}`) - 0.5) * a];
};

export const shotAt = (v: number): View => {
  const s = SHOTS.find((x) => v >= x.from && v < x.to) ?? SHOTS[SHOTS.length - 1];
  const k = s.ease ? ramp(v, s.from, s.to) : ramp(v, s.from, s.to, (t) => t);
  const pos = lerp3(s.pos[0], s.pos[1], k);
  const j = shake(v);
  // the close shots shake less, the far ones more
  const dist = Math.hypot(s.target[0][0] - s.pos[0][0], s.target[0][1] - s.pos[0][1], s.target[0][2] - s.pos[0][2]);
  const scale = Math.min(3, Math.max(0.4, dist / 12));
  let target = lerp3(s.target[0], s.target[1], k);
  // the balloon shot follows the balloon up and away once it is torn loose
  if (s.track) target = lerp3(target, balloonAt(v, RELEASE_HAND).p, 0.9 * ramp(v, BALLOON_GONE, BALLOON_GONE + 0.8));
  return {pos: [pos[0] + j[0] * scale, pos[1] + j[1] * scale, pos[2] + j[2] * scale], target, fov: s.fov};
};

export const CameraRig: React.FC<{v: number; view?: View}> = ({v, view}) => {
  const camera = useThree((st) => st.camera) as PerspectiveCamera;
  const {pos, target, fov} = view ?? shotAt(v);
  camera.position.set(...pos);
  camera.up.set(0, 1, 0);
  camera.lookAt(...target);
  camera.fov = fov;
  camera.near = 0.05;
  camera.far = 2500;
  camera.updateProjectionMatrix();
  return null;
};

export const restartJolt = (v: number) => restartK(v);
