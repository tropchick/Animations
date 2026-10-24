import {useThree} from '@react-three/fiber';
import {PerspectiveCamera} from 'three';
import {dadAt, dogAt, girlAt, headOf} from './cast';
import {HEROES, WATER_IMPACT, flyerAt} from './objects';
import {V3, lerp3, ramp, videoTime, worldTime} from './time';

type View = {pos: V3; target: V3; fov: number; up?: V3};
type Shot = {from: number; to: number; at: (v: number, k: number, w: number) => View};

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vec = (x: {x: number; y: number; z: number}): V3 => [x.x, x.y, x.z];
const move = (pos: [V3, V3], target: [V3, V3], fov: number, up?: V3) => (_v: number, k: number): View => ({
  pos: lerp3(pos[0], pos[1], k),
  target: lerp3(target[0], target[1], k),
  fov,
  up,
});

const busPos = (w: number) => flyerAt(HEROES.bus, w).pos;

// Hard cuts between shots; every shot is 1.2 to 4.5 seconds long.
const SHOTS: Shot[] = [
  {from: 0, to: 3, at: move([[3, 16, 40], [2, 10, 30]], [[0, 4, -6], [0, 3, -6]], 55)},
  {
    from: 3,
    to: 5.2,
    at: (_v, _k, w) => {
      const p = vec(dadAt(w).P);
      return {pos: add(p, [2.4, 1.5, 5.6]), target: add(p, [0.7, 1.0, 0]), fov: 46};
    },
  },
  {
    from: 5.2,
    to: 7,
    at: (_v, k, w) => {
      const h = vec(headOf(dadAt(w)));
      return {pos: add(h, [0.9 - 0.2 * k, -0.15, 2.6 - 0.5 * k]), target: add(h, [0, -0.15, 0]), fov: 40};
    },
  },
  {from: 7, to: 10.5, at: move([[-6.5, 0.5, 10], [-6.6, 0.8, 9.2]], [[-2, 2.8, -8], [-2, 3.6, -8]], 62)},
  {from: 10.5, to: 13, at: move([[-8.2, 1.4, 6.2], [-8.6, 2.4, 5.6]], [[-4, 2.4, 1], [-4, 3.2, 1]], 52)},
  {from: 13, to: 16, at: move([[14, 2.2, 4], [13, 3.4, 3]], [[3, 3.5, -11], [3, 6, -11]], 55)},
  {
    from: 16,
    to: 19.5,
    at: (_v, _k, w) => {
      const b = busPos(w);
      return {pos: add(b, [9, 1.5, 12]), target: add(b, [-6, 0.5, -4]), fov: 55};
    },
  },
  {from: 19.5, to: 22, at: move([[-8.5, 1.1, -0.5], [-8.6, 1.2, -0.2]], [[-12, 6, -3], [-11, 16, -6]], 62)},
  {from: 22, to: 25.2, at: move([[8, 1.5, 25], [7.5, 1.9, 24]], [[0, 62, -20], [0, 75, -20]], 64)},
  {
    from: 25.2,
    to: 28.8,
    at: (_v, k, w) => {
      // rolled upside down: dad looks upright, the city hangs above him
      const h = vec(headOf(dadAt(w)));
      return {pos: add(h, [2.6 - 0.5 * k, 0.9, 2.6 + 0.2 * k]), target: add(h, [0, 0.9, 0]), fov: 44, up: [0, -1, 0]};
    },
  },
  {
    from: 28.8,
    to: 31,
    at: (_v, k, w) => {
      const g = vec(headOf(girlAt(w), 0.62));
      return {pos: [-1.2 - 0.3 * k, 0.9, 4.8], target: add(g, [0, 0.6, 0]), fov: 52};
    },
  },
  {
    from: 31,
    to: 33.4,
    at: (_v, k, w) => {
      const c = vec(dogAt(w).collar);
      return {pos: add(c, [2.2 - 0.3 * k, 0.2, 2.4 - 0.2 * k]), target: add(c, [0, 0.3, 0]), fov: 46};
    },
  },
  {from: 33.4, to: 37, at: move([[-1, 1.3, 6], [-1, 1.3, 6]], [[-0.6, 100, 0], [-0.3, 100, 0.6]], 72, [0, 0, -1])},
  {from: 37, to: 40, at: move([[-0.5, 1.7, 9.8], [-0.8, 1.5, 9.2]], [[-3.5, 1.8, 1.5], [-3.5, 1.2, 1.5]], 55)},
  {from: 40, to: 44.5, at: move([[-1.6, 0.5, -1.2], [-1.7, 0.45, -1.4]], [[-4, 18, 13], [-4, 24, 12]], 70)},
  {
    from: 44.5,
    to: 52,
    at: (v, _k, w) => {
      // ride with the bus: still at the top, then falling back to the city
      const b = busPos(w);
      const fall = ramp(v, 47.2, 52);
      return {pos: add(b, [8 - 2 * fall, 6 + 3 * fall, 10 - 2 * fall]), target: add(b, [-4 + 3 * fall, -12 + 4 * fall, -6 + 4 * fall]), fov: 60};
    },
  },
  {from: 52, to: 53.4, at: move([[-7, 1.1, 15.5], [-7.3, 1.15, 15.8]], [[-1.5, 2.2, 9], [-1.5, 1.8, 9]], 58)},
  {from: 53.4, to: 54.6, at: move([[5, 2.6, -2.8], [4.7, 2.5, -2.5]], [[0, 0.8, 4.4], [0, 0.7, 4.4]], 50)},
  {from: 54.6, to: 55.8, at: move([[10, 1.6, -1], [9.6, 1.7, -1.4]], [[4, 2.2, -8.5], [4, 2, -8.5]], 52)},
  {from: 55.8, to: 57, at: move([[12, 3.2, -10], [11.5, 3.3, -10.4]], [[2, 2.5, -21], [2, 2.3, -21]], 55)},
  {from: 57, to: 61, at: move([[5, 6.5, 27], [4.5, 6, 25]], [[-1, 1.5, -6], [-1, 1.5, -6]], 55)},
  {from: 61, to: 65.1, at: move([[4.5, 6, 25], [3, 15, 38]], [[-1, 1.5, -6], [0, 4, -6]], 55)},
];

// Camera shake on the flip, the landing and every big hit (world time, strength).
const SHAKES: [number, number][] = [
  [7.0, 0.22],
  [17.6, 0.12],
  [HEROES.side.f.impactW, 0.15],
  [HEROES.tree1.f.impactW, 0.12],
  [HEROES.bus.f.impactW, 0.55],
  [HEROES.cart.f.impactW, 0.12],
  [HEROES.pile1.f.impactW, 0.25],
  [WATER_IMPACT, 0.35],
  [HEROES.pile2.f.impactW, 0.25],
  [HEROES.fountainCar.f.impactW, 0.45],
  [HEROES.tree2.f.impactW, 0.15],
  [HEROES.pile3.f.impactW, 0.25],
  [HEROES.taxi.f.impactW, 0.45],
];

const shakeAt = (v: number): V3 => {
  let a = 0;
  for (const [w, s] of SHAKES) {
    const d = v - videoTime(w);
    if (d >= 0 && d < 1.2) a += s * Math.exp(-d * 4.5);
  }
  if (a <= 0) return [0, 0, 0];
  return [a * Math.sin(v * 67), a * Math.sin(v * 53 + 1.3), a * 0.6 * Math.sin(v * 71 + 2.1)];
};

export const viewAt = (v: number): View => {
  const shot = SHOTS.find((s) => v >= s.from && v < s.to) ?? SHOTS[SHOTS.length - 1];
  const k = ramp(v, shot.from, shot.to);
  const view = shot.at(v, k, worldTime(v));
  const s = shakeAt(v);
  return {...view, pos: add(view.pos, s), target: add(view.target, [s[0] * 1.5, s[1] * 1.5, s[2]])};
};

export const CameraRig: React.FC<{v: number}> = ({v}) => {
  const camera = useThree((st) => st.camera) as PerspectiveCamera;
  const {pos, target, fov, up} = viewAt(v);
  camera.up.set(...(up ?? [0, 1, 0]));
  camera.position.set(...pos);
  camera.lookAt(...target);
  camera.fov = fov;
  camera.near = 0.05;
  camera.far = 4000;
  camera.updateProjectionMatrix();
  return null;
};
