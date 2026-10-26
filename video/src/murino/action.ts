import {
  CHASE, DOOR_A, GROW, LAND, LEGS_IN, PASS, SLAM, THROW, V3, add3, lerp, ramp, shotEnd, shotStart, smooth, wordStart,
} from './cues';
import {CORR, COURIER_AT, LAND as LAND_SET, RISE, RUN_R, STEPS_PER_TURN, WELL, helix} from './places';

// Where everybody is, shot by shot. The world draws them from here and the camera follows them from here.

const DELTA = (Math.PI * 2) / STEPS_PER_TURN;

// ---------------------------------------------------------------- someone climbing the spiral
// i = tread index (fractional): a foot lands in the middle of tread floor(i) when i is a whole number,
// the body rises one tread per step with a small hop.
export type Climber = {p: V3; yaw: number; i: number; a: number};
export const onStairs = (i: number, r = RUN_R, hop = 0.05): Climber => {
  const a = (i + 0.5) * DELTA;
  const h = helix(a, r);
  const frac = i - Math.floor(i);
  return {p: [h[0], WELL[1] + i * RISE + hop * Math.sin(Math.PI * frac), h[2]], yaw: Math.atan2(-Math.sin(a), -Math.cos(a)), i, a};
};
export const treadPoint = (k: number, r = RUN_R): V3 => {
  const h = helix((k + 0.5) * DELTA, r);
  return [h[0], WELL[1] + k * RISE, h[2]];
};

// ---------------------------------------------------------------- the well (rule 2): one tread per footstep, 0.3 s
export const WELL_STEP0 = 24.074; // first footstep sound
export const wellI = (v: number) => -2 + (v - WELL_STEP0) / 0.3;
export const fogTopWell = (v: number) => -5.0 + (v - shotStart('well')) * 0.55;

// ---------------------------------------------------------------- the Neighbour scene (rule 4)
const N0 = shotStart('neighbor');
const STOP = wordStart(88) - 0.2; // the courier stops on «тумана» and looks down
const RUN0 = CHASE + 0.25; // he starts running a beat after the Neighbour
// courier: walks up (a tread per 0.55 s), stops, then sprints (a tread per 0.3 s)
export const courierN = (v: number) => {
  const walkTo = (t: number) => (Math.min(t, STOP) - N0) / 0.55;
  if (v < STOP) return walkTo(v);
  if (v < RUN0) return walkTo(STOP);
  return walkTo(STOP) + (v - RUN0) / 0.3 - 0.6 * (1 - Math.exp(-(v - RUN0) * 3)); // a short start-up
};
// the Neighbour stands two thirds of a turn below, across the open well, in the fog
export const N_START = courierN(STOP) - 12;
const N_PACE = 0.21; // s per tread: faster than the courier
export const CUP_TREAD = Math.round(courierN(THROW) - 1.5); // dropped just behind him
const N_STOP = CUP_TREAD - 1.2;
// the Neighbour: still until CHASE, then a tread per N_PACE, braking in front of the cup
export const neighbourN = (v: number) => {
  if (v < CHASE) return N_START;
  const free = N_START + (v - CHASE) / N_PACE;
  const x = free - (N_STOP - 1);
  return x <= 0 ? free : N_STOP - 1 + (1 - Math.exp(-x));
};
export const neighbourSit = (v: number) => smooth(ramp(v, LAND + 0.15, LAND + 0.75));
export const neighbourRunning = (v: number) => v >= CHASE && neighbourN(v) < N_STOP - 0.3;
export const fogTopN = (v: number) => onStairs(N_START).p[1] + 0.3 + (v - N0) * 0.06;

// the cup: from the courier's hand at THROW to the tread in front of the Neighbour at LAND
export const cupAt = (v: number): {p: V3; spin: number; flying: boolean} | null => {
  if (v < THROW) return null;
  const from: V3 = add3(onStairs(courierN(THROW)).p, [0, 1.3, 0]);
  const to = treadPoint(CUP_TREAD, RUN_R - 0.15);
  const k = ramp(v, THROW, LAND);
  if (k >= 1) return {p: to, spin: 0, flying: false};
  const p: V3 = [lerp(from[0], to[0], k), lerp(from[1], to[1], k) + Math.sin(k * Math.PI) * 0.8, lerp(from[2], to[2], k)];
  return {p, spin: k * 9, flying: true};
};

// ---------------------------------------------------------------- the corridor (rule 3)
export const CORR_X = -0.42; // the courier keeps to the left side
const C0 = shotStart('long');
// first part: in from the stairwell door, stop and look down the corridor
export const courierCorrA = (v: number) => {
  const k = smooth(ramp(v, C0 + 0.1, C0 + 2.4));
  return {p: add3(CORR, [lerp(-0.3, CORR_X, k), 0, lerp(-1.2, -3.0, k)]), walking: k > 0 && k < 1, phase: (v - C0) * 5.6};
};
// last part: eyes on the floor, walking past the Long One (a step per 0.62 s, in time with the footsteps)
export const WALK0 = wordStart(74) - 0.3;
export const courierCorrB = (v: number) => {
  const t = v - WALK0;
  return {p: add3(CORR, [CORR_X, 0, -26.9 - t * 1.12]), phase: (t / 0.62) * Math.PI + Math.PI / 2};
};
export const LEGS = LEGS_IN;

// ---------------------------------------------------------------- the landing (rule 5 and after)
const D0 = shotStart('doors');
export const courierLand = (v: number) => {
  const k = smooth(ramp(v, D0 + 0.1, D0 + 2.9));
  const p = add3(LAND_SET, [lerp(0.75, COURIER_AT[0] - LAND_SET[0], k), 0, lerp(2.2, COURIER_AT[2] - LAND_SET[2], k)]);
  return {p, walking: k > 0.02 && k < 0.98, phase: (v - D0) * 5.4};
};
export const openA = (v: number) => {
  const k = ramp(v, DOOR_A - 0.05, DOOR_A + 0.75);
  // swings out fast, bounces a little off its stop
  return 1.7 * (1 - Math.pow(1 - k, 3)) + 0.06 * Math.sin(ramp(v, DOOR_A + 0.75, DOOR_A + 1.6) * Math.PI) * (v < DOOR_A + 1.6 ? 1 : 0);
};
export const openB = (v: number, chain: number) => {
  if (v < chain) return 0;
  if (v >= SLAM - 0.12) return Math.max(0, 0.3 * (1 - ramp(v, SLAM - 0.12, SLAM)));
  return 0.3 * smooth(ramp(v, chain - 0.05, chain + 0.3));
};
export const growAt = (v: number) => smooth(ramp(v, GROW, GROW + 1.5));
export const passAt = (v: number) => smooth(ramp(v, PASS - 0.35, PASS + 0.3));
export const bagGone = (v: number) => v > PASS + 0.55;
export const WELL_END = shotEnd('well');
