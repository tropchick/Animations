import {Easing, interpolate} from 'remotion';

// "What if gravity flipped for 10 seconds?" — 1:05.
export const DURATION_S = 65;

// Key moments in video seconds.
export const V = {
  countdownStart: 2,
  flip: 7,
  restore: 37,
  impactsFrom: 52,
  impactsTo: 57,
  end: DURATION_S,
};

// Key moments in world (physical) seconds.
export const W = {
  flip: 7,
  restore: 17,
};

// Speed ramps: video second -> world second. Between the knots time runs linearly, so the
// slow motion changes right at the cuts: x6 at the lift-off, x3 in flight, faster than real
// time while everything falls back, x2.5 on the impacts.
const KNOTS: [number, number][] = [
  [0, 0],
  [7, 7],
  [10.5, 7.6],
  [16, 8.8],
  [37, 17],
  [40, 18.2],
  [44.5, 22.2],
  [47.2, 24.6],
  [52, 31.6],
  [57, 33.6],
  [65, 41.6],
];

export const worldTime = (v: number) => {
  if (v <= KNOTS[0][0]) return v;
  for (let i = 1; i < KNOTS.length; i++) {
    const [v1, w1] = KNOTS[i];
    if (v <= v1) {
      const [v0, w0] = KNOTS[i - 1];
      return w0 + ((v - v0) / (v1 - v0)) * (w1 - w0);
    }
  }
  const [vl, wl] = KNOTS[KNOTS.length - 1];
  return wl + (v - vl);
};

// Video seconds per world second at video time v (1 = real time, 6 = slow motion x6).
export const slowMotion = (v: number) => {
  for (let i = 1; i < KNOTS.length; i++) {
    if (v < KNOTS[i][0]) {
      const [v0, w0] = KNOTS[i - 1];
      const [v1, w1] = KNOTS[i];
      return (v1 - v0) / (w1 - w0);
    }
  }
  return 1;
};

// Inverse of worldTime, for placing effects at a physical moment.
export const videoTime = (w: number) => {
  for (let i = 1; i < KNOTS.length; i++) {
    const [v1, w1] = KNOTS[i];
    if (w <= w1) {
      const [v0, w0] = KNOTS[i - 1];
      return v0 + ((w - w0) / (w1 - w0)) * (v1 - v0);
    }
  }
  const [vl, wl] = KNOTS[KNOTS.length - 1];
  return vl + (w - wl);
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

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

export type V3 = [number, number, number];

export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
