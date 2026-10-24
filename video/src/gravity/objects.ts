import {random} from 'remotion';
import {Flight, REF, airTime, flight, flightFor, heightAt} from './physics';
import {FOUNTAIN, FOUNTAIN_R} from './city';
import {W, V3, clamp01, lerp} from './time';

// Everything that falls into the sky. Each object lifts off, flies up with drag, comes back
// and hits the ground at a chosen moment and place (the big hits are timed for the edit).

export type Kind = 'car' | 'taxi' | 'bus' | 'tree' | 'cart' | 'table' | 'chair' | 'bin' | 'junk' | 'water';

export type Flyer = {
  id: string;
  kind: Kind;
  color: string;
  pre: (w: number) => V3; // position before the lift-off
  yaw: number; // heading (local +x is the front)
  speed: number; // m/s forward at the lift-off
  f: Flight;
  land: V3;
  spin: V3;
  landRot: V3;
  size?: number;
  umbrella?: string;
  sink?: number; // how far it sinks after the hit (something below caves in)
};

// Half height of each model: flight positions are the model's center, models are built from the bottom.
export const halfHeight = (o: Pick<Flyer, 'kind' | 'size'>) =>
  ({car: 0.82, taxi: 0.82, bus: 1.62, tree: 2.2, cart: 1.0, table: 0.5, chair: 0.4, bin: 0.45, junk: (o.size ?? 0.2) * 0.3, water: 0})[o.kind];

const TAU = 3; // seconds for the sideways speed to die out in the air
const smooth = (x: number) => x * x * (3 - 2 * x);
const TWO_PI = Math.PI * 2;

const moving = (flipPos: V3, yaw: number, speed: number) => (w: number): V3 => {
  const back = (W.flip - w) * speed;
  return [flipPos[0] - Math.cos(yaw) * back, flipPos[1], flipPos[2] + Math.sin(yaw) * back];
};
const parked = (p: V3) => () => p;

type HeroSpec = {
  id: string;
  kind: Kind;
  color: string;
  flipPos: V3;
  yaw: number;
  speed?: number;
  delay?: number;
  impactW: number;
  land: V3;
  spin: V3;
  landRot: V3;
  pre?: (w: number) => V3;
  sink?: number;
};

const hero = (s: HeroSpec): Flyer => ({
  id: s.id,
  kind: s.kind,
  color: s.color,
  pre: s.pre ?? (s.speed ? moving(s.flipPos, s.yaw, s.speed) : parked(s.flipPos)),
  yaw: s.yaw,
  speed: s.speed ?? 0,
  f: flightFor(s.impactW, s.delay ?? 0, s.flipPos[1], s.land[1] - halfHeight(s)),
  land: s.land,
  spin: s.spin,
  landRot: s.landRot,
  sink: s.sink,
});

// The bus pulls in to the stop and stands still at the flip.
const busPre = (w: number): V3 => {
  const stopW = 5;
  const x = w < stopW ? 4 - 0.5 * 2.7 * (stopW - w) * (stopW - w) : 4;
  return [x, 0.02, -12.6];
};

export const HEROES = {
  bus: hero({id: 'bus', kind: 'bus', color: '#e2463a', flipPos: [4, 0.02, -12.6], yaw: 0, delay: 0.25, impactW: REF.impactW, land: [2.5, 1.64, -21.3], spin: [0.06, 0.1, 0.12], landRot: [0.05, 0.2, 0.1], pre: busPre}),
  fountainCar: hero({id: 'fcar', kind: 'car', color: '#4a7fc1', flipPos: [-6, 0.02, -13], yaw: 0, speed: 9, impactW: 32.4, land: [FOUNTAIN[0] + 0.2, 0.75, FOUNTAIN[2] + 0.2], spin: [0.2, 0.15, 0.25], landRot: [0.25, 0.7, -0.75]}),
  taxi: hero({id: 'taxi', kind: 'taxi', color: '#f2c230', flipPos: [20, 0.02, -3.5], yaw: Math.PI / 2, speed: 8, impactW: 32.85, land: [4.2, 3.55, -8.5], spin: [0.15, 0.2, 0.1], landRot: [0.12, 0.35, 0.05], sink: 1.45}),
  pile1: hero({id: 'pile1', kind: 'car', color: '#f2f2ee', flipPos: [-10, 0.02, -20.6], yaw: 0, impactW: 32.1, land: [-9.2, 0.92, -14.2], spin: [0.1, 0.3, 0.2], landRot: [Math.PI / 2, 0.3, 0]}),
  pile2: hero({id: 'pile2', kind: 'car', color: '#3b3f47', flipPos: [10, 0.02, -19], yaw: Math.PI, speed: 9, impactW: 32.55, land: [-5.6, 0.85, -17.2], spin: [0.25, 0.1, 0.15], landRot: [Math.PI, 0.9, 0.05]}),
  pile3: hero({id: 'pile3', kind: 'car', color: '#c94a3a', flipPos: [16, 0.02, -13], yaw: 0, speed: 9, impactW: 32.95, land: [-14, 0.84, -16], spin: [0.12, 0.2, 0.3], landRot: [0, -0.5, 0.22]}),
  side: hero({id: 'side', kind: 'car', color: '#7cb46b', flipPos: [14, 0.02, -20.6], yaw: 0, impactW: 31.7, land: [19, 0.92, -6], spin: [0.2, 0.1, 0.1], landRot: [-Math.PI / 2, 1.2, 0]}),
  tree1: hero({id: 'tree1', kind: 'tree', color: '', flipPos: [-12, 0.6, -2], yaw: 0, delay: 3.3, impactW: 31.8, land: [-9.5, 1.5, 7.5], spin: [0.15, 0.1, 0.2], landRot: [0, 0.4, Math.PI / 2]}),
  tree2: hero({id: 'tree2', kind: 'tree', color: '', flipPos: [12, 0.6, -2], yaw: 0, delay: 3.6, impactW: 32.7, land: [14.5, 1.5, 4], spin: [0.2, 0.1, 0.1], landRot: [Math.PI / 2, 1.0, 0]}),
  cart: hero({id: 'cart', kind: 'cart', color: '', flipPos: [11.5, 0.12, 8.4], yaw: 0, impactW: 31.9, land: [9.5, 0.62, 15.5], spin: [0.3, 0.4, 0.2], landRot: [0.3, 0.8, 1.35]}),
};

// Traffic further down the streets: fills the sky and rains down out of the frame.
const traffic: Flyer[] = Array.from({length: 10}).map((_, i) => {
  const k = `traffic-${i}`;
  const lane = i % 2 ? -13 : -19;
  const yaw = lane === -13 ? 0 : Math.PI;
  const x = -70 + (i / 10) * 150 + random(`${k}-x`) * 8;
  const flipPos: V3 = [x, 0.02, lane];
  const vt = 48 + random(`${k}-vt`) * 14;
  return {
    id: k,
    kind: i % 4 === 3 ? 'taxi' : 'car',
    color: ['#4f86c6', '#e2e2de', '#2f3540', '#9b6fb5', '#46a6a0', '#c94a3a'][i % 6],
    pre: moving(flipPos, yaw, 9),
    yaw,
    speed: 9,
    f: flight(Math.round(vt), 0, 0.02, 0.02),
    land: [x + (random(`${k}-lx`) - 0.5) * 30, 0.84, lane + (random(`${k}-lz`) - 0.5) * 30],
    spin: [random(`${k}-s1`) * 0.3, random(`${k}-s2`) * 0.3, random(`${k}-s3`) * 0.3],
    landRot: [0, random(`${k}-ly`) * 3, 0.2],
  };
});

// Cafe tables, chairs, bins and light junk from the square.
const smallStuff: Flyer[] = [];
const cafe: V3[] = [
  [-14, 0.12, 4],
  [-14, 0.12, 8],
  [-14.5, 0.12, 12],
  [-11.8, 0.12, 15.5],
];
cafe.forEach((p, i) => {
  const k = `cafe-${i}`;
  smallStuff.push({
    id: k,
    kind: 'table',
    color: '',
    umbrella: ['#3fa6b4', '#e9563c', '#f2c84b', '#3fa6b4'][i],
    pre: parked(p),
    yaw: 0,
    speed: 0,
    f: flight(22 + random(`${k}-vt`) * 10, 0.05, p[1], 0.12),
    land: [p[0] + (random(`${k}-lx`) - 0.5) * 14, 0.55, p[2] + (random(`${k}-lz`) - 0.5) * 10],
    spin: [0.6, 0.4, 0.8],
    landRot: [Math.PI / 2, random(`${k}-r`) * 3, 0],
  });
  for (let c = 0; c < 2; c++) {
    const kc = `${k}-chair-${c}`;
    const cp: V3 = [p[0] + (c ? 0.8 : -0.8), p[1], p[2] + 0.3];
    smallStuff.push({
      id: kc,
      kind: 'chair',
      color: ['#3fa6b4', '#e9563c'][c],
      pre: parked(cp),
      yaw: c ? -1.6 : 1.6,
      speed: 0,
      f: flight(16 + random(`${kc}-vt`) * 10, 0.03, cp[1], 0.12),
      land: [cp[0] + (random(`${kc}-lx`) - 0.5) * 16, 0.4, cp[2] + (random(`${kc}-lz`) - 0.5) * 16],
      spin: [1.2, 0.8, 1.5],
      landRot: [Math.PI / 2, random(`${kc}-r`) * 3, 0],
    });
  }
});
const bins: V3[] = [
  [-6, 0.12, -6.5],
  [6, 0.12, 15],
  [-15, 0.12, -5],
  [15, 0.12, 0],
];
bins.forEach((p, i) => {
  const k = `bin-${i}`;
  smallStuff.push({
    id: k,
    kind: 'bin',
    color: '',
    pre: parked(p),
    yaw: 0,
    speed: 0,
    f: flight(20 + random(`${k}-vt`) * 8, 0.02, p[1], 0.12),
    land: [p[0] + (random(`${k}-lx`) - 0.5) * 12, 0.42, p[2] + (random(`${k}-lz`) - 0.5) * 12],
    spin: [0.9, 0.5, 0.7],
    landRot: [Math.PI / 2, random(`${k}-r`) * 3, 0],
  });
});
for (let i = 0; i < 46; i++) {
  const k = `junk-${i}`;
  const p: V3 = [(random(`${k}-x`) - 0.5) * 34, 0.12, -8 + random(`${k}-z`) * 30];
  smallStuff.push({
    id: k,
    kind: 'junk',
    color: ['#f4f2ec', '#e9563c', '#f2c84b', '#4f86c6', '#7cb46b', '#d9cfbf'][i % 6],
    pre: parked(p),
    yaw: random(`${k}-yaw`) * 6,
    speed: 0,
    f: flight(9 + random(`${k}-vt`) * 10, random(`${k}-d`) * 0.3, p[1], 0.12),
    land: [p[0] + (random(`${k}-lx`) - 0.5) * 20, 0.16, p[2] + (random(`${k}-lz`) - 0.5) * 20],
    spin: [2 + random(`${k}-s`) * 3, 1.5, 2.5],
    landRot: [0, random(`${k}-r`) * 3, 0],
    size: 0.12 + random(`${k}-sz`) * 0.25,
  });
}

// Fountain water: blobs that leave the basin together and come down as one bomb.
export const WATER_IMPACT = 32.0;
export const WATER_LAND: V3 = [-1.5, 0.12, 10];
export const WATER: Flyer[] = Array.from({length: 11}).map((_, i) => {
  const k = `water-${i}`;
  const a = (i / 11) * Math.PI * 2;
  const r = i === 0 ? 0 : 1.2 + random(`${k}-r`) * (FOUNTAIN_R - 1.8);
  const p: V3 = [FOUNTAIN[0] + Math.cos(a) * r, 0.5, FOUNTAIN[2] + Math.sin(a) * r];
  return {
    id: k,
    kind: 'water',
    color: '',
    pre: parked(p),
    yaw: 0,
    speed: 0,
    f: flightFor(WATER_IMPACT - 0.25 + random(`${k}-t`) * 0.3, 0.02 + random(`${k}-d`) * 0.08, 0.5, 1.0),
    land: [WATER_LAND[0] + Math.cos(a) * r * 0.5, 1.0, WATER_LAND[2] + Math.sin(a) * r * 0.5],
    spin: [0.3, 0.2, 0.4],
    landRot: [0, 0, 0],
    size: 0.55 + random(`${k}-s`) * 0.3,
  };
});

export const FLYERS: Flyer[] = [...Object.values(HEROES), ...traffic, ...smallStuff];

// ---------- State of a flyer at world time w ----------

export type FlyState = {pos: V3; rot: V3; landed: boolean; crush: number; air: number};

export const flyerAt = (o: Flyer, w: number): FlyState => {
  const {f} = o;
  const hh = halfHeight(o);
  if (w < f.liftW) {
    const p = o.pre(w);
    return {pos: [p[0], p[1] + hh, p[2]], rot: [0, o.yaw, 0], landed: false, crush: 0, air: 0};
  }
  const p0 = o.pre(f.liftW);
  const t = airTime(o.f, w);
  const total = f.impactW - f.liftW;
  const glide = o.speed * TAU * (1 - Math.exp(-t / TAU));
  const glideEnd = o.speed * TAU * (1 - Math.exp(-total / TAU));
  const fx = Math.cos(o.yaw);
  const fz = -Math.sin(o.yaw);
  const s = smooth(clamp01(t / total));
  const x = p0[0] + fx * glide + (o.land[0] - p0[0] - fx * glideEnd) * s;
  const z = p0[2] + fz * glide + (o.land[2] - p0[2] - fz * glideEnd) * s;
  const landed = w >= f.impactW;
  const y = heightAt(f, w) + hh - (landed ? (o.sink ?? 0) * clamp01((w - f.impactW) / 0.2) : 0);
  // tumble, unwrapped so it ends near the crash orientation without a fast extra spin
  const near = (a: number, target: number) => target + ((((a - target + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI) - Math.PI;
  const tumble: V3 = [
    near(o.spin[0] * t, o.landRot[0]),
    near(o.yaw + o.spin[1] * t, o.landRot[1]),
    near(o.spin[2] * t, o.landRot[2]),
  ];
  // the last moments before the hit turn the object to its crash orientation
  const k = smooth(clamp01((t - (total - 0.5)) / 0.5));
  const rot: V3 = [lerp(tumble[0], o.landRot[0], k), lerp(tumble[1], o.landRot[1], k), lerp(tumble[2], o.landRot[2], k)];
  const crush = landed ? clamp01((w - f.impactW) / 0.12) : 0;
  return {pos: [x, y, z], rot, landed, crush, air: t};
};
