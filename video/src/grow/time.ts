import {clamp01, lerp, ramp, V3, lerp3} from '../earth/time';

export {clamp01, lerp, ramp, lerp3};
export type {V3};

// "What if gravity kept getting stronger?" — 1:06 of story, vertical 1080x1920.
// Frame 0 of the video is the cover; the story starts on frame 1 (see GravityGrow.tsx).
export const DURATION_S = 66;

export const V = {
  growStart: 8, // gravity starts to grow
  space: 46, // the camera leaves the ground
  blackHole: 58, // escape velocity reaches the speed of light
  end: DURATION_S,
};

// Gravity in g at video second v. Between the keys the logarithm of g follows a smooth curve,
// so the growth keeps speeding up without steps.
const KEYS: [number, number][] = [
  [0, 1],
  [8, 1],
  [16, 1.5],
  [22, 3],
  [28, 6],
  [33, 12],
  [38, 40],
  [42, 150],
  [46, 1500],
  [50, 30000],
  [54, 2e6],
  [58, 7.18e8],
];
const LOGS = KEYS.map(([t, g]) => [t, Math.log10(g)] as [number, number]);

// Monotone cubic (Fritsch–Carlson) through the log keys: no overshoot, no dips.
const SLOPES = (() => {
  const n = LOGS.length;
  const d = LOGS.slice(0, -1).map((p, i) => (LOGS[i + 1][1] - p[1]) / (LOGS[i + 1][0] - p[0]));
  const m = LOGS.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return m;
})();

export const logG = (v: number) => {
  if (v <= LOGS[0][0]) return 0;
  const last = LOGS[LOGS.length - 1];
  if (v >= last[0]) return last[1];
  let i = 0;
  while (v > LOGS[i + 1][0]) i++;
  const [t0, y0] = LOGS[i];
  const [t1, y1] = LOGS[i + 1];
  const h = t1 - t0;
  const s = (v - t0) / h;
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1;
  const h10 = s ** 3 - 2 * s ** 2 + s;
  const h01 = -2 * s ** 3 + 3 * s ** 2;
  const h11 = s ** 3 - s ** 2;
  return h00 * y0 + h10 * h * SLOPES[i] + h01 * y1 + h11 * h * SLOPES[i + 1];
};

export const gAt = (v: number) => Math.pow(10, logG(v));

// Video second when gravity first reaches g (inverse of gAt, by bisection).
export const vAtG = (g: number) => {
  let a = 0;
  let b = KEYS[KEYS.length - 1][0];
  for (let k = 0; k < 40; k++) {
    const m = (a + b) / 2;
    if (gAt(m) < g) a = m;
    else b = m;
  }
  return (a + b) / 2;
};

export const WEIGHT_KG = 70;
export const ESCAPE0 = 11.186; // km/s at 1 g
export const C_KMS = 299792;
export const escapeKms = (v: number) => Math.min(C_KMS, ESCAPE0 * Math.sqrt(gAt(v)));

// Tallest mountain that can stand at gravity g (about 8.8 km at 1 g, inversely proportional to g).
export const maxMountain = (g: number) => 8849 / g;

// How far a thing has collapsed: 0 before its breaking point (in g), 1 after `dur` seconds.
export const collapse = (v: number, breakG: number, dur = 0.8) => {
  const t0 = vAtG(breakG);
  return ramp(v, t0, t0 + dur, (t) => t * t);
};

export const smooth = (x: number) => {
  const s = clamp01(x);
  return s * s * (3 - 2 * s);
};
