import {V, pushG, windMs} from './time';

const G = 9.81;
const DT = 1 / 120;

// Video second when the wind first reaches `kmh` (inverse of windKmh while braking).
export const vAtWind = (kmh: number) => V.slowStart + 40 * Math.pow(Math.min(1, kmh / 1280), 0.4);

// A loose object on the ground: it stays put until the braking push plus the wind drag beats
// friction, then slides east (+x). k is drag per mass (1/m): a_wind = k * (wind - own speed)^2.
// Integrated once over the braking and cached.
export type Slide = {start: number; xs: Float32Array; vs: Float32Array};

const cache = new Map<string, Slide>();

export const slide = (mu: number, k: number): Slide => {
  const key = `${mu}|${k}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const n = Math.ceil((V.zero - V.slowStart) / DT) + 1;
  const xs = new Float32Array(n);
  const vs = new Float32Array(n);
  let x = 0;
  let vel = 0;
  let start = Infinity;
  for (let i = 1; i < n; i++) {
    const v = V.slowStart + i * DT;
    const rel = Math.max(0, windMs(v) - vel);
    const drive = pushG(v) * G + k * rel * rel;
    if (vel <= 0 && drive < mu * G) {
      vel = 0;
    } else {
      if (start === Infinity) start = v;
      vel = Math.max(0, vel + (drive - mu * G) * DT);
    }
    x += vel * DT;
    xs[i] = x;
    vs[i] = vel;
  }
  const s = {start, xs, vs};
  cache.set(key, s);
  return s;
};

const at = (arr: Float32Array, v: number) => {
  if (v <= V.slowStart) return 0;
  const f = (v - V.slowStart) / DT;
  const i = Math.floor(f);
  if (i >= arr.length - 1) return arr[arr.length - 1];
  return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
};

export const slideX = (s: Slide, v: number) => at(s.xs, Math.min(v, V.zero));
export const slideSpeed = (s: Slide, v: number) => at(s.vs, Math.min(v, V.zero));
