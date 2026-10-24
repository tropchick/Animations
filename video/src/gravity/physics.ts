import {W} from './time';

const G = 9.8;
const DT = 1 / 240;

// Vertical flight of one loose object: it lets go of the ground `delay` world seconds after the
// flip, falls up with air drag (terminal speed vt), and after the restore falls back until it
// reaches yLand. Integrated once and cached as a table.
export type Flight = {
  y0: number;
  yLand: number;
  liftW: number; // world time of lift-off
  impactW: number; // world time of the impact
  peak: number;
  ys: Float32Array;
  vs: Float32Array;
};

const cache = new Map<string, Flight>();

export const flight = (vt: number, delay: number, y0 = 0, yLand = 0): Flight => {
  const key = `${vt}|${delay}|${y0}|${yLand}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const liftW = W.flip + delay;
  const ys: number[] = [y0];
  const vs: number[] = [0];
  let y = y0;
  let vel = 0;
  let t = liftW;
  let peak = y0;
  while (t < 200) {
    const g = t < W.restore ? G : -G;
    vel += (g - (vel * Math.abs(vel) * G) / (vt * vt)) * DT;
    y += vel * DT;
    t += DT;
    peak = Math.max(peak, y);
    if (t > W.restore && vel < 0 && y <= yLand) {
      ys.push(yLand);
      vs.push(vel);
      break;
    }
    ys.push(y);
    vs.push(vel);
  }
  const f: Flight = {y0, yLand, liftW, impactW: t, peak, ys: Float32Array.from(ys), vs: Float32Array.from(vs)};
  cache.set(key, f);
  return f;
};

const sample = (arr: Float32Array, f: Flight, w: number) => {
  if (w <= f.liftW) return arr[0];
  const x = (w - f.liftW) / DT;
  const i = Math.floor(x);
  if (i >= arr.length - 1) return arr[arr.length - 1];
  return arr[i] + (arr[i + 1] - arr[i]) * (x - i);
};

export const heightAt = (f: Flight, w: number) => sample(f.ys, f, w);
export const speedAt = (f: Flight, w: number) => (w >= f.impactW ? 0 : sample(f.vs, f, w));

// Seconds in the air (0 before the lift-off, frozen after the impact).
export const airTime = (f: Flight, w: number) => Math.max(0, Math.min(w, f.impactW) - f.liftW);

// Terminal speed that makes the object hit yLand exactly at world time impactW.
export const flightFor = (impactW: number, delay: number, y0 = 0, yLand = 0): Flight => {
  let lo = 15;
  let hi = 140;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (flight(mid, delay, y0, yLand).impactW < impactW) lo = mid;
    else hi = mid;
  }
  return flight(Math.round(((lo + hi) / 2) * 100) / 100, delay, y0, yLand);
};

// The reference object for the HUD: a car-sized body (terminal speed 55 m/s) from the ground.
export const REF = flight(55, 0);
