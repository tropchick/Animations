import {Easing, interpolate} from 'remotion';

export const FPS = 30;
export const DURATION_S = 68;

// Key moments of the story, in seconds of video time.
export const T = {
  countdownStart: 2,
  airGone: 12,
  airBack: 57,
  end: DURATION_S,
};

// The 5 seconds without air are stretched 9x (12s..57s of video).
export const SLOWMO = 9;

// Physical "world" time: runs at normal speed, except during the slow motion.
export const worldTime = (v: number) => {
  if (v <= T.airGone) return v;
  if (v <= T.airBack) return T.airGone + (v - T.airGone) / SLOWMO;
  return T.airGone + 5 + (v - T.airBack);
};

// Seconds of air loss elapsed (0..5).
export const secondsWithoutAir = (v: number) =>
  Math.min(5, Math.max(0, (v - T.airGone) / SLOWMO));

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// Eased 0..1 progress between two times.
export const ramp = (
  v: number,
  from: number,
  to: number,
  easing: (t: number) => number = Easing.inOut(Easing.cubic),
) =>
  interpolate(v, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const lerp3 = (
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// How much air there is: 1 = normal, 0 = vacuum. In slow motion the sky drains over ~4s, returns over ~0.6s.
export const airAmount = (v: number) => {
  if (v < T.airGone) return 1;
  if (v < T.airBack) return 1 - ramp(v, T.airGone, T.airGone + 4.2, Easing.inOut(Easing.quad));
  return ramp(v, T.airBack, T.airBack + 0.6, Easing.out(Easing.quad));
};

// True while the world is frozen-ish in vacuum (for things that stop instantly).
export const inVacuum = (v: number) => v >= T.airGone && v < T.airBack;
