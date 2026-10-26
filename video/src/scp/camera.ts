import {View, handheld} from '../slime/camera';
import {
  CHIME, GONE, HUNT, KNOCKS, NIGHT_CUT, PA, ROWS, STAFF_STEP, Shot, V3, add3, lerp, lerp3, ramp, shotAt, shotEnd, shotStart, smooth, wordStart,
} from './cues';
import {FORT} from './store';
import {SLIT_IN} from './fort';
import {benRun, DN_BEN, DN_STAFF, JUNCTION, LAMP_TAG, PA_BEN, PHONE_FLOOR, SPEAKER_AT, STAFF_AISLE} from './places';

export type {View};

const ease = (a: V3, b: V3, ta: V3, tb: V3, fov: number, far?: number) => (k: number): View => ({
  pos: lerp3(a, b, smooth(k)),
  target: lerp3(ta, tb, smooth(k)),
  fov,
  far,
});
// a slow move that keeps going to the end of the shot (no settle), for shots that cut away mid-move
const drift = (a: V3, b: V3, ta: V3, tb: V3, fov: number, far?: number) => (k: number): View => ({
  pos: lerp3(a, b, k),
  target: lerp3(ta, tb, k),
  fov,
  far,
});
const F = (p: V3): V3 => add3(FORT, p);

const SHOTS: Record<Shot, (k: number, v: number, t: number) => View> = {
  // the phone on the floor of the fort, from above, sinking slowly towards it and turning a little
  phone: (k) => {
    const a = lerp(0.5, 0.15, smooth(k));
    const h = lerp(0.95, 0.3, smooth(k));
    const r = 0.15 + 0.35 * (1 - smooth(k)); // the phone's top points along -z (turned 0.15); the camera rolls onto it
    return {pos: add3(PHONE_FLOOR, [Math.sin(a) * 0.05, h, Math.cos(a) * 0.05]), target: PHONE_FLOOR, fov: 38, up: [-Math.sin(r), 0, -Math.cos(r)], far: 60};
  },
  // backing away in front of Ben as he walks in, pillow bins sliding past; then the price tag close up
  enter: (k, v) => {
    const cut = wordStart(19) - 0.15;
    if (v < cut) {
      const kk = ramp(v, shotStart('enter'), cut);
      return {pos: lerp3([0.9, 1.25, 24.2], [0.75, 1.35, 20.6], smooth(kk)), target: lerp3([0.2, 1.45, 30], [0.4, 1.3, 25], smooth(kk)), fov: 52, far: 240};
    }
    const kk = ramp(v, cut, shotEnd('enter'));
    return {pos: lerp3(add3(LAMP_TAG, [-1.15, 0.3, -0.35]), add3(LAMP_TAG, [-0.9, 0.22, -0.2]), smooth(kk)), target: lerp3(add3(LAMP_TAG, [0, -0.17, 0.0]), add3(LAMP_TAG, [0, -0.14, 0.02]), smooth(kk)), fov: 40, far: 240};
  },
  // his face as he turns round, then over his shoulder: a living room where the doors were
  turn: (k, v) => {
    if (v < GONE) {
      const kk = ramp(v, shotStart('turn'), GONE);
      return {pos: lerp3([2.3, 1.55, 23.2], [2.1, 1.55, 22.85], kk), target: [1.6, 1.38, 21.4], fov: 42, far: 240};
    }
    const kk = ramp(v, GONE, shotEnd('turn'));
    return {pos: lerp3([1.0, 1.82, 19.75], [0.85, 1.95, 19.1], smooth(kk)), target: lerp3([0.4, 1.3, 30], [0.1, 1.6, 32], smooth(kk)), fov: 46, far: 240};
  },
  // high over a junction, circling, the signs pointing round in a loop
  signs: (k) => {
    const a = lerp(0.65, 1.15, smooth(k));
    const r = lerp(7.2, 6.4, k);
    return {pos: add3(JUNCTION, [Math.sin(a) * r, lerp(4.6, 4.3, k), Math.cos(a) * r]), target: add3(JUNCTION, [0, 1.6, 0]), fov: 56, far: 240};
  },
  // rising up to the ceiling and turning down the main aisle: rooms and racks to the horizon
  rise: (k) => {
    const kk = smooth(k);
    const kt = smooth(ramp(k, 0.0, 0.8));
    return {
      pos: lerp3(add3(JUNCTION, [2.6, 3.6, 5.0]), add3(JUNCTION, [0.6, 6.2, 9.0]), kk),
      target: lerp3(add3(JUNCTION, [0, 1.0, 0]), add3(JUNCTION, [-0.4, 2.6, -90]), kt),
      fov: lerp(54, 62, kk),
      far: 260,
    };
  },
  // Ben on a sofa at 21:58; the chime: the speaker on the column; the voice: a wide shot of the room
  pa: (k, v) => {
    if (v < CHIME - 0.12) {
      const kk = ramp(v, shotStart('pa'), CHIME - 0.12);
      return {pos: lerp3(add3(PA_BEN, [4.5, 1.3, -2.4]), add3(PA_BEN, [3.9, 1.2, -1.9]), kk), target: add3(PA_BEN, [0, 0.95, 0.1]), fov: 42, far: 240};
    }
    if (v < PA[0] + 1.4) {
      const kk = ramp(v, CHIME - 0.12, PA[0] + 1.4);
      return {pos: lerp3(add3(SPEAKER_AT, [-2.4, -2.5, -3.4]), add3(SPEAKER_AT, [-2.1, -2.3, -3.0]), kk), target: add3(SPEAKER_AT, [-0.3, -0.1, 0]), fov: 44, far: 240};
    }
    const kk = ramp(v, PA[0] + 1.4, shotEnd('pa'));
    return {pos: lerp3([1.4, 2.1, PA_BEN[2] - 4.6], [1.0, 2.0, PA_BEN[2] - 4.0], kk), target: lerp3(add3(PA_BEN, [0.4, 0.9, 0]), add3(PA_BEN, [0.3, 1.0, 0]), kk), fov: 44, far: 240};
  },
  // low along the main aisle: the dark rolls in row by row, towards the camera
  lightsout: drift([0.75, 0.42, -92], [0.7, 0.45, -93.6], [-0.2, 2.4, -150], [-0.2, 2.2, -150], 52, 240),
  // through the rack aisle towards the tall figures in the green light
  staff: (k, v) => {
    const kk = smooth(k);
    const step = smooth(ramp(v, STAFF_STEP - 0.1, STAFF_STEP + 0.4)) * 0.4;
    return {pos: lerp3([STAFF_AISLE[0] - 0.35, 1.35, STAFF_AISLE[2] + 22], [STAFF_AISLE[0] - 0.1, 1.5, STAFF_AISLE[2] + 13.5 + step], kk), target: add3(STAFF_AISLE, [0, 1.75, 0]), fov: 40, far: 120};
  },
  // one fixed spot, day then night
  daynight: (k, v) => {
    const night = v >= NIGHT_CUT;
    const kk = night ? ramp(v, NIGHT_CUT, shotEnd('daynight')) : ramp(v, shotStart('daynight'), NIGHT_CUT);
    const push = night ? 0.6 * smooth(ramp(v, HUNT - 0.05, HUNT + 0.35)) : 0;
    const base = add3(DN_BEN, [2.6, 1.55, -3.6]);
    const tgt = lerp3(DN_BEN, DN_STAFF, 0.5);
    const dir = [tgt[0] - base[0], 0, tgt[2] - base[2]] as V3;
    const len = Math.hypot(dir[0], dir[2]);
    return {pos: add3(lerp3(base, add3(base, [-0.25, 0.05, 0.3]), kk), [(dir[0] / len) * push, 0, (dir[2] / len) * push]), target: add3(tgt, [0, 1.45, 0]), fov: 46, far: 120};
  },
  // low behind Ben as he runs off the main aisle into a bedroom, the phone light swinging ahead
  run: (k, v) => {
    const back = benRun(v - 0.95);
    const ahead = benRun(v + 0.7);
    const bounce = 0.03 * Math.abs(Math.sin(benRun(v).phase));
    return {pos: [back.p[0] + 0.45, 0.62 + bounce, back.p[2] + 0.35], target: [ahead.p[0], 1.0, ahead.p[2]], fov: 54, far: 120, near: 0.05};
  },
  // straight down on the bedroom: the wardrobes dragged into a square round him
  fort: (k) => {
    const h = lerp(6.2, 4.6, smooth(k)); // under the ceiling lights (6.45 m)
    const a = lerp(0.0, 0.25, k);
    return {pos: F([0.05, h, 0.02]), target: F([0, 0, 0]), fov: 58, up: [-Math.cos(a), 0, Math.sin(a)], far: 60};
  },
  // in the fort, his face in the phone light
  hide: (k) => {
    const kk = smooth(k);
    return {pos: F([-0.53, lerp(1.08, 1.02, kk), lerp(0.3, 0.24, kk)]), target: F([0.12, 0.78, 0.0]), fov: 54, far: 60, near: 0.02};
  },
  // looking out through the slit between two wardrobes
  inside: (k) => {
    const kk = smooth(k);
    return {pos: add3(SLIT_IN, [lerp(0.32, 0.22, kk), lerp(0.62, 0.58, kk), lerp(0.03, 0.0, kk)]), target: add3(SLIT_IN, [-3, 0.2, -0.05]), fov: 44, far: 60, near: 0.02};
  },
  // face; the knocks: over his shoulder onto the doors; then pushing in on his face for the name
  knock: (k, v) => {
    const t1 = KNOCKS[0] - 0.22;
    const t2 = wordStart(121) - 0.25;
    if (v < t1) {
      const kk = ramp(v, shotStart('knock'), t1);
      return {pos: F([-0.53, lerp(0.98, 0.95, kk), lerp(-0.3, -0.25, kk)]), target: F([0.12, 0.8, 0.0]), fov: 52, far: 60, near: 0.02};
    }
    if (v < t2) {
      const kk = ramp(v, t1, t2);
      return {pos: F([lerp(0.38, 0.33, kk), 1.0, lerp(0.3, 0.26, kk)]), target: F([-0.6, 0.95, 0.35]), fov: 50, far: 60, near: 0.02};
    }
    const kk = smooth(ramp(v, t2, shotEnd('knock')));
    return {pos: F([-0.53, 0.95, lerp(0.05, 0.02, kk)]), target: F([0.12, 0.85, 0.0]), fov: lerp(52, 34, kk), far: 60, near: 0.02};
  },
  end: () => ({pos: [0, 200, 0], target: [0, 200, -1], fov: 40}),
};

const SHAKES: [number, number][] = [
  [HUNT, 0.6],
  ...KNOCKS.map((k): [number, number] => [k, 0.5]),
  [STAFF_STEP, 0.25],
  ...ROWS.slice(5).map((r): [number, number] => [r, 0.12]),
];

export const viewAt = (v: number): View => {
  const s = shotAt(v);
  return handheld(SHOTS[s.name](s.k, v, s.t), v, SHAKES);
};
