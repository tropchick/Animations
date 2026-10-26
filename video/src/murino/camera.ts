import {View, handheld} from '../slime/camera';
import {
  CHAIN, CHASE, DOOR_A, FLICKER, LAND, LIFT_OPEN, SLAM, Shot, THROW, V3, add3, lerp, lerp3, ramp, shotAt, shotEnd, shotStart, smooth, wordStart,
} from './cues';
import {CORR, DOUBLE_AT, EXT, LAND as LAND_SET, LIFT, WELL} from './places';
import {CUP_TREAD, WALK0, courierCorrB, courierN, neighbourN, onStairs, treadPoint, wellI} from './action';

export type {View};

const E = (p: V3): V3 => add3(EXT, p);
const L = (p: V3): V3 => add3(LIFT, p);
const C = (p: V3): V3 => add3(CORR, p);
const D = (p: V3): V3 => add3(LAND_SET, p);

// a move between two framings over [t0, t1] with ease in and out
const move = (v: number, t0: number, t1: number, a: V3, b: V3, ta: V3, tb: V3, fov: number | [number, number], extra: Partial<View> = {}): View => {
  const k = smooth(ramp(v, t0, t1));
  return {pos: lerp3(a, b, k), target: lerp3(ta, tb, k), fov: typeof fov === 'number' ? fov : lerp(fov[0], fov[1], k), ...extra};
};
const fwd = (yaw: number, d: number): V3 => [Math.sin(yaw) * d, 0, Math.cos(yaw) * d];

// cut points inside shots
export const CUTS = {
  orderBack: wordStart(16) + 0.45, // after ПРИНЯТЬ: pull back to the house
  liftDoors: wordStart(28) - 0.15, // «Вчера…»: from the panel to the doors
  wellSide: wordStart(44) - 0.05, // «Туман растёт…»: from above to the chase on the stairs
  longReveal: wordStart(64) - 0.2, // «Длинный…»
  longFace: wordStart(69) - 0.12, // «Не смотри ему в лицо»
  longFloor: WALK0 + 0.15, // «Пока ты смотришь в пол»: eyes on the floor
  nLook: wordStart(88) - 0.25, // «…из тумана тебя зовут»
  nFace: wordStart(91) - 0.1, // «у него будет лицо человека»
  nChase: CHASE,
  nRun1: CHASE + 1.5,
  nRun2: CHASE + 3.1,
  nThrow: THROW - 0.55,
  doorA: DOOR_A - 0.25,
  doubleFace: wordStart(131) - 0.25, // «заказ не отдавай»
  twinsWide: CHAIN - 0.3,
  twinsGap: CHAIN + 0.65,
  slam: SLAM - 0.2,
};

// the double's face in the dark doorway, one slow push across the doors/twins boundary
const doubleClose = (v: number) =>
  move(v, CUTS.doubleFace, CUTS.twinsWide, D([-0.72, 1.62, -0.5]), D([-0.84, 1.55, -0.92]), add3(DOUBLE_AT, [0, 1.6, 0]), add3(DOUBLE_AT, [0, 1.58, 0]), [36, 32]);

const SHOTS: Record<Shot, (k: number, v: number) => View> = {
  // rising along corpus 14 into the fog, lamp posts and the porch sliding past below
  title: (k, v) => move(v, 0, shotEnd('title'), E([-7.5, 1.6, 30]), E([-5.2, 7.5, 24]), E([1.5, 7, 0]), E([0.5, 40, -4]), [52, 56], {far: 260}),
  // over his shoulder onto the phone; after ПРИНЯТЬ, back and up: the entrance, the house going up into the fog
  order: (k, v) => {
    if (v < CUTS.orderBack)
      return move(v, shotStart('order'), CUTS.orderBack, E([-0.12, 1.95, 3.35]), E([-0.05, 1.88, 3.08]), E([0.22, 1.62, 1.6]), E([0.2, 1.6, 1.65]), 46, {far: 260});
    return move(v, CUTS.orderBack, shotEnd('order') + 0.5, E([0.7, 1.7, 4.4]), E([2.6, 2.0, 12.5]), E([0.2, 1.6, 0]), E([0.2, 5.5, 0]), [48, 56], {far: 260});
  },
  // the panel close up, buttons to 100 and the note; then from behind him onto the doors, through them onto the landing
  lift: (k, v) => {
    if (v < CUTS.liftDoors)
      return move(v, shotStart('lift'), CUTS.liftDoors, L([0.0, 1.05, 0.2]), L([0.02, 1.45, 0.24]), L([0.526, 1.1, 0.43]), L([0.546, 1.6, 0.4]), 56, {near: 0.02});
    const out = smooth(ramp(v, LIFT_OPEN + 1.1, shotEnd('lift')));
    return {
      pos: lerp3(L([0.4, 1.68, -0.6]), L([0.3, 1.66, 0.95]), out),
      target: lerp3(L([-0.3, 1.5, 3.2]), L([0.7, 1.5, 3.2]), out),
      fov: 58,
      near: 0.02,
    };
  },
  // from high up the well, looking down past him into the rising fog; then the chase along the stairs
  well: (k, v) => {
    const i = wellI(v);
    const c = onStairs(i);
    if (v < CUTS.wellSide) {
      const kk = ramp(v, shotStart('well'), CUTS.wellSide);
      const a = c.a + Math.PI + 0.35;
      const pos: V3 = add3(WELL, [Math.cos(a) * 1.1, c.p[1] - WELL[1] + lerp(4.6, 3.6, kk), -Math.sin(a) * 1.1]);
      const target = lerp3(add3(c.p, [0, 0.8, 0]), add3(WELL, [0, c.p[1] - WELL[1] - 7, 0]), 0.12);
      return {pos, target, fov: 64, far: 60};
    }
    return {pos: add3(onStairs(i - 1.9, 2.1).p, [0, 1.45, 0]), target: add3(onStairs(i + 0.7, 3.3).p, [0, 0.95, 0]), fov: 60, far: 60};
  },
  // into the corridor behind him; the Long One far off; his face as he drops his eyes; his eyes on the floor
  long: (k, v) => {
    if (v < CUTS.longReveal) return move(v, shotStart('long'), CUTS.longReveal, C([0.45, 1.72, -0.15]), C([0.3, 1.66, -0.95]), C([-0.1, 1.5, -20]), C([0.1, 1.55, -20]), 50);
    if (v < CUTS.longFace) return move(v, CUTS.longReveal, CUTS.longFace + 0.3, C([0.05, 1.5, -16.5]), C([0.18, 1.62, -22.0]), C([0.6, 2.2, -31.2]), C([0.62, 2.32, -31.2]), [30, 24]);
    if (v < CUTS.longFloor) return move(v, CUTS.longFace, CUTS.longFloor, C([-0.2, 1.12, -4.35]), C([-0.24, 1.1, -4.15]), C([-0.42, 1.62, -3.0]), C([-0.42, 1.55, -3.0]), 48);
    const c = courierCorrB(v);
    const sway = 0.03 * Math.sin(c.phase);
    return {pos: add3(c.p, [0.05 + sway, 1.62, -0.62]), target: add3(c.p, [0.45 + sway * 2, 0, -2.0]), fov: 68, near: 0.02};
  },
  // up the stairs again; he looks down; the face in the fog; the chase; the sauce
  neighbor: (k, v) => {
    const ci = courierN(v);
    const c = onStairs(ci);
    const n = onStairs(neighbourN(v), 3.25);
    if (v < CUTS.nLook) {
      const kk = ramp(v, shotStart('neighbor'), CUTS.nLook);
      return {pos: add3(onStairs(ci - 1.2 + kk * 0.4, 1.4).p, [0, 1.9, 0]), target: add3(c.p, [0, 1.15, 0]), fov: 50, far: 60};
    }
    if (v < CUTS.nFace) {
      // over his shoulder, across the open well: a figure standing in the fog below
      const kk = smooth(ramp(v, CUTS.nLook, CUTS.nFace));
      return {pos: add3(onStairs(ci - 1.5, 2.75).p, [0, lerp(1.75, 1.85, kk), 0]), target: lerp3(add3(n.p, [0, 1.9, 0]), add3(n.p, [0, 1.4, 0]), kk), fov: lerp(36, 26, kk), far: 60};
    }
    if (v < CUTS.nChase) {
      const kk = smooth(ramp(v, CUTS.nFace, CUTS.nChase));
      return {pos: add3(n.p, add3(fwd(n.yaw, lerp(1.25, 1.0, kk)), [0, 2.35, 0])), target: add3(n.p, [0, 1.63, 0]), fov: 30, far: 60};
    }
    if (v < CUTS.nRun1) {
      // he comes up the stairs at us
      const ni = neighbourN(v);
      return {pos: add3(onStairs(ni + 3.2, 2.5).p, [0, 1.2, 0]), target: add3(onStairs(ni + 0.3, 3.25).p, [0, 1.15, 0]), fov: 52, far: 60};
    }
    if (v < CUTS.nRun2) {
      // the courier sprints at us, looking back
      return {pos: add3(onStairs(ci + 2.6, 2.45).p, [0, 1.45, 0]), target: add3(onStairs(ci + 0.3, 3.3).p, [0, 1.2, 0]), fov: 52, far: 60};
    }
    if (v < CUTS.nThrow) {
      // low, the slippers slapping up the steps
      const ni = neighbourN(v);
      return {pos: add3(onStairs(ni + 2.2, 2.6).p, [0, 0.55, 0]), target: add3(onStairs(ni + 0.2, 3.25).p, [0, 0.75, 0]), fov: 56, far: 60};
    }
    // from across the well: the throw, the cup, the Neighbour sitting down with it
    const cup = treadPoint(CUP_TREAD);
    const kk = smooth(ramp(v, LAND, shotEnd('neighbor')));
    const across = onStairs(CUP_TREAD + 9 + 0.6, 1.9);
    const mid = lerp3(cup, n.p, 0.55);
    return {pos: add3(across.p, [0, lerp(2.4, 2.1, kk), 0]), target: lerp3(add3(mid, [0, 0.9, 0]), add3(mid, [0, 0.55, 0]), kk), fov: lerp(46, 30, kk), far: 60};
  },
  // he walks up to the two doors; А swings open; the face in the dark
  doors: (k, v) => {
    if (v < CUTS.doorA) return move(v, shotStart('doors'), CUTS.doorA, D([-0.3, 1.75, 3.1]), D([0.45, 1.66, 1.5]), D([0.1, 1.35, -1.9]), D([-0.05, 1.3, -1.9]), 52);
    if (v < CUTS.doubleFace) return move(v, CUTS.doorA, CUTS.doubleFace + 0.4, D([0.38, 1.48, 0.62]), D([0.2, 1.47, 0.36]), D([-0.95, 1.35, -2.2]), D([-0.95, 1.45, -2.3]), 44);
    return doubleClose(v);
  },
  // "Ты принёс мою шаурму?"; door Б on the chain; the code; the bag through the gap
  twins: (k, v) => {
    if (v < CUTS.twinsWide) return doubleClose(v);
    if (v < CUTS.twinsGap) return move(v, CUTS.twinsWide, CUTS.twinsGap, D([-1.6, 1.55, 0.9]), D([-1.45, 1.55, 0.75]), D([0.75, 1.3, -1.9]), D([0.7, 1.35, -1.9]), 46);
    return move(v, CUTS.twinsGap, shotEnd('twins'), D([-0.45, 1.62, 0.05]), D([-0.32, 1.6, -0.2]), D([0.58, 1.55, -2.15]), D([0.58, 1.53, -2.15]), 36, {near: 0.02});
  },
  // low, looking up at door А: the double straightens up past the lintel; door Б slams
  grow: (k, v) => {
    if (v < CUTS.slam) return move(v, shotStart('grow'), CUTS.slam, D([0.15, 0.78, 0.95]), D([0.08, 0.68, 0.7]), D([-0.85, 1.75, -2.2]), D([-0.88, 2.05, -2.2]), 48);
    return move(v, CUTS.slam, shotEnd('grow'), D([0.15, 1.5, -0.45]), D([0.18, 1.48, -0.55]), D([0.95, 1.2, -1.9]), D([0.95, 1.2, -1.9]), 44);
  },
  // the landing again, door А open on darkness, while the app speaks
  app: (k, v) => move(v, shotStart('app'), shotEnd('app'), D([0.8, 1.75, 1.7]), D([0.55, 1.7, 0.95]), D([-0.35, 1.25, -1.9]), D([-0.5, 1.3, -1.9]), 50),
  end: () => ({pos: [0, 500, 0], target: [0, 500, -1], fov: 40}),
};

const SHAKES: [number, number][] = [
  [SLAM, 0.9],
  [DOOR_A, 0.35],
  [FLICKER, 0.12],
  [LIFT_OPEN, 0.15],
];

export const viewAt = (v: number): View => {
  const s = shotAt(v);
  return handheld(SHOTS[s.name](s.k, v), v, SHAKES);
};

// the cover: the corridor, the courier from behind, the Long One at the end
export const COVER_VIEW: View = {pos: C([0.3, 1.25, -0.2]), target: C([0.25, 2.05, -8.5]), fov: 46, near: 0.05};
