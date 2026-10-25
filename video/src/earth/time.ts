import {Easing, interpolate} from 'remotion';

// "What if the Earth stopped spinning?" — 1:06, vertical 1080x1920.
export const DURATION_S = 66;

// Key moments in video seconds.
export const V = {
  slowStart: 8, // the Earth starts to brake
  zero: 48, // spin reaches 0 km/h
  restart: 53, // spin snaps back (1 world second at x8)
  restored: 61,
  end: DURATION_S,
};

// Rotation speed at ~40° latitude.
export const SPIN0 = 1280; // km/h
const BRAKE_S = V.zero - V.slowStart; // 40 s of braking, in real time
const SPIN0_MS = SPIN0 / 3.6;
const G = 9.81;

// Fraction of the spin lost so far (0..1). Grows like t^2.5, so it brakes harder and harder.
export const lost = (v: number) => {
  const t = Math.min(BRAKE_S, Math.max(0, v - V.slowStart));
  return Math.pow(t / BRAKE_S, 2.5);
};

// World seconds: real time until the zero, then the zero second at x5, the restart second at x8.
export const worldTime = (v: number) => {
  if (v <= V.zero) return v;
  if (v <= V.restart) return V.zero + (v - V.zero) / 5;
  if (v <= V.restored) return V.zero + 1 + (v - V.restart) / 8;
  return V.zero + 2 + (v - V.restored);
};

export const slowMotion = (v: number) => (v >= V.zero && v < V.restart ? 5 : v >= V.restart && v < V.restored ? 8 : 1);

// Progress of the restart (0..1) within its single world second.
export const restartK = (v: number) => clamp01((v - V.restart) / (V.restored - V.restart));

export const spinKmh = (v: number) => {
  if (v < V.restart) return SPIN0 * (1 - lost(v));
  return SPIN0 * restartK(v);
};

// Wind over the ground: the air keeps its old speed, so it blows as fast as the ground has slowed.
// When the ground spins back up it catches the air and the wind dies.
export const windKmh = (v: number) => {
  if (v < V.restart) return SPIN0 * lost(v);
  return SPIN0 * (1 - restartK(v));
};
export const windMs = (v: number) => windKmh(v) / 3.6;

// Sideways push from the braking, in g (eastward, +x on screen).
export const pushG = (v: number) => {
  const t = v - V.slowStart;
  if (t <= 0 || t >= BRAKE_S) return 0;
  return (SPIN0_MS * 2.5 * Math.pow(t, 1.5)) / Math.pow(BRAKE_S, 2.5) / G;
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export const ramp = (v: number, from: number, to: number, easing: (t: number) => number = Easing.inOut(Easing.cubic)) =>
  interpolate(v, [from, to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type V3 = [number, number, number];
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
