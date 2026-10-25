import {View, handheld} from '../slime/camera';
import {DOORS, JOLT, MOTOR, Shot, V3, add3, lerp3, shotAt, shotStart, smooth} from './cues';
import {CALL_BUTTON, DOOR36} from './House';
import {YARD_X, ENTRANCE, CROSS, SHOP_X, TILL} from './Yard';
import {KITCHEN, KOSTYA_AT_WINDOW, PHONE_NIGHT, PHONE_DAY} from './Kitchen';

export type {View};
const move = (a: V3, b: V3, ta: V3, tb: V3, fov: number, far?: number) => (k: number): View => ({
  pos: lerp3(a, b, smooth(k)),
  target: lerp3(ta, tb, smooth(k)),
  fov,
  far,
});
const Y = (p: V3): V3 => [p[0] + YARD_X, p[1], p[2]];
const S = (p: V3): V3 => [p[0] + SHOP_X, p[1], p[2]];
const K = (p: V3): V3 => add3(KITCHEN, p);

// a phone close-up: the camera looks straight at the screen from `d` metres
const atPhone = (p: V3, d: number, d2: number, up = 0): ((k: number) => View) =>
  move(add3(p, [0.004, 0.01 + up, d]), add3(p, [0, 0.006 + up, d2]), add3(p, [0, up * 0.5, 0]), add3(p, [0, up * 0.5, 0]), 36);

const SHOTS: Record<Shot, (k: number, v: number, t: number) => View> = {
  hook: move([0.42, 2.02, -0.32], [0.4, 1.98, -0.36], [-0.12, 0.35, -1.3], [-0.12, 0.38, -1.28], 64),
  chat: atPhone(PHONE_NIGHT, 0.38, 0.34),
  record: atPhone(PHONE_NIGHT, 0.3, 0.25, -0.025),
  stuck: move([0.47, 2.06, -1.56], [0.45, 2.02, -1.5], [-0.08, 1.15, -0.3], [-0.08, 1.15, -0.3], 74),
  button: move([0.02, 1.36, -0.12], [0.08, 1.3, -0.18], add3(CALL_BUTTON, [0, 0.06, 0]), add3(CALL_BUTTON, [0, 0.06, 0]), 46),
  sleep: move([0.38, 0.95, -0.42], [0.36, 0.86, -0.5], [-0.12, 0.62, -1.3], [-0.12, 0.6, -1.3], 52),
  morning: move([-0.42, 1.9, -0.38], [-0.4, 1.86, -0.42], [-0.12, 0.55, -1.3], [-0.12, 0.62, -1.3], 58),
  doors: (k, v) => {
    const kk = smooth(Math.min(1, Math.max(0, (v - DOORS - 0.6) / 4)));
    return {pos: lerp3([0.3, 1.85, -1.5], [0.26, 1.82, -1.36], kk), target: [0.1, 1.2, 2.5], fov: 58};
  },
  calls: move([-0.95, 1.52, 0.75], [-0.85, 1.5, 0.9], [0.7, 1.5, 2.55], [0.7, 1.5, 2.55], 42),
  screen112: atPhone(PHONE_DAY, 0.37, 0.33),
  yard: move(Y([-17, 13, 34]), Y([-16, 12, 32.5]), Y([0, 3.5, 2]), Y([0, 3.3, 2]), 44, 600),
  cross: move(add3(CROSS, [-1.7, 2.3, 56]), add3(CROSS, [-1.7, 2.2, 52]), add3(CROSS, [-1.0, 1.7, -3]), add3(CROSS, [-1.0, 1.7, -3]), 30, 600),
  shop: move(S([1.3, 1.55, -1.6]), S([1.15, 1.5, -1.45]), S([-0.3, 1.1, 0.6]), S([-0.3, 1.1, 0.6]), 46),
  money: move(add3(TILL, [-0.07, 0.58, -0.46]), add3(TILL, [-0.06, 0.52, -0.42]), add3(TILL, [0, 0.02, 0]), add3(TILL, [0, 0.02, 0]), 40),
  steps: move(add3(ENTRANCE, [-1.6, 1.15, 3.6]), add3(ENTRANCE, [-1.9, 1.45, 4.3]), add3(ENTRANCE, [0.15, 0.85, 1.4]), add3(ENTRANCE, [0.15, 0.95, 1.3]), 44, 600),
  door36: (k) => {
    // first the strip of light under the door with the paws moving in it, then Kostya leaning on the door
    if (k < 0.45) {
      const a = smooth(k / 0.45);
      return {pos: lerp3([DOOR36[0] - 0.62, 0.17, DOOR36[2] + 0.95], [DOOR36[0] - 0.5, 0.15, DOOR36[2] + 0.8], a), target: [DOOR36[0] - 0.03, 0.03, DOOR36[2]], fov: 44};
    }
    const b = smooth((k - 0.45) / 0.55);
    return {pos: lerp3([DOOR36[0] - 1.95, 1.5, DOOR36[2] + 1.9], [DOOR36[0] - 1.6, 1.48, DOOR36[2] + 1.55], b), target: [DOOR36[0] - 0.5, 1.15, DOOR36[2] - 0.1], fov: 46};
  },
  window: move(K([-0.35, 1.5, 0.9]), K([-0.25, 1.48, 0.3]), K([0.05, 1.45, -3]), K([0.05, 1.45, -3]), 50, 1500),
  reflect: move(K([0.38, 1.66, -2.75]), K([0.36, 1.64, -2.6]), K([0.3, 1.58, -1]), K([0.3, 1.58, -1]), 40, 1500),
  sent: atPhone(add3(PHONE_NIGHT, [0, -0.02, 0]), 0.36, 0.31),
  title: () => ({pos: [0, 100, 0], target: [0, 100, -1], fov: 40}),
};

const SHAKES: [number, number][] = [
  [JOLT, 1.2],
  [MOTOR, 0.5],
  [shotStart('morning') + 0.0, 0.2],
];

export const viewAt = (v: number): View => {
  const s = shotAt(v);
  return handheld(SHOTS[s.name](s.k, v, s.t), v, SHAKES);
};

export {KOSTYA_AT_WINDOW};
