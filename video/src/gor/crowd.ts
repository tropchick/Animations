import {DUST_A, DUST_B, Parts, V3} from './ink';
import {Blob, SUN_AZ} from './Jungle';
import {Look, ManState, Pose, Root, drawMan, fly, hash, lie, makeLook, mix, mixPose, run, stand} from './rig';
import {clamp01, ramp, smooth} from './cues';

// Who is who among the hundred, where they stand and where the hurt ones end up.

export const N = 100;
export const LOOKS: Look[] = Array.from({length: N}, (_, i) => makeLook(i + 11));
export const sm = (v: number, a: number, b: number) => smooth(ramp(v, a, b));
export const yawTo = (from: V3 | [number, number], to: V3 | [number, number]) => {
  const fz = from.length === 3 ? from[2] : from[1];
  const tz = to.length === 3 ? to[2] : to[1];
  return Math.atan2(to[0] - from[0], tz - fz);
};
export const wrap = (a: number) => {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};

// the crowd at the start: an arc of rows on the +z side, everyone facing the gorilla at the origin
const ROWS = [9, 11, 12, 13, 14, 15, 13, 13];
export const HOME: {x: number; z: number; yaw: number; row: number; az: number; rad: number}[] = [];
ROWS.forEach((n, row) => {
  for (let j = 0; j < n; j++) {
    const i = HOME.length;
    const rad = 7.6 + row * 1.05 + (hash(i * 3.1) - 0.5) * 0.35;
    const az = ((j - (n - 1) / 2) * 1.02) / rad + (hash(i * 5.7) - 0.5) * 0.04;
    const x = Math.sin(az) * rad;
    const z = Math.cos(az) * rad;
    HOME.push({x, z, yaw: Math.atan2(-x, -z), row, az, rad});
  }
});

// roles
export const A = 4; // tossed
export const B = 3; // swatted
export const C = 5; // pinned
export const D = 2;
export const Eb = 6;
export const MELEE_V = [10, 11, 12, 13, 14, 15, 16, 17]; // fly off in the melee
export const PILE_OFF = [30, 31, 32]; // thrown off the pile
export const PILE_MEN = Array.from({length: 30}, (_, j) => 30 + j);
export const HURT_MEN = [A, B, C, ...MELEE_V, ...PILE_OFF];
export const isHurt = (i: number) => HURT_MEN.includes(i);

// where each hurt man ends up lying (set by the choreography below)
export const LAND: Record<number, {p: V3; yaw: number}> = {};

// ring around the gorilla for everyone else: golden-angle disc between r = 2.5 and 7.2
const RING_ORDER = Array.from({length: N}, (_, i) => i).filter((i) => !isHurt(i) || PILE_OFF.includes(i));
export const RING: Record<number, {x: number; z: number; rad: number; az: number}> = {};
RING_ORDER.forEach((i, n) => {
  const rad = 2.55 + 4.9 * Math.sqrt((n + 0.5) / RING_ORDER.length);
  const az = n * 2.39996 + 0.7;
  RING[i] = {x: Math.sin(az) * rad, z: Math.cos(az) * rad + 0.3, rad, az};
});

export const G0: V3 = [0, 0, 0.3]; // where the gorilla holds his ground

// ballistic flight of a thrown man; returns the state at time t after the hit
const GRAV = 9.8;
export type Toss = {from: V3; vel: V3; spin: number; yaw: number};
export const tossLand = (ts: Toss) => {
  const T = (ts.vel[1] + Math.sqrt(ts.vel[1] * ts.vel[1] + 2 * GRAV * Math.max(0, ts.from[1] - 0.2))) / GRAV;
  const land: V3 = [ts.from[0] + ts.vel[0] * T, 0, ts.from[2] + ts.vel[2] * T];
  const rest: V3 = [land[0] + ts.vel[0] * 0.2, 0, land[2] + ts.vel[2] * 0.2];
  return {T, land, rest};
};
export const tossed = (ts: Toss, t: number, seed: number): {root: Root; pose: Pose; air: boolean; y: number} => {
  const {T, land, rest} = tossLand(ts);
  if (t < T) {
    const y = ts.from[1] + ts.vel[1] * t - 0.5 * GRAV * t * t;
    return {root: {pos: [ts.from[0] + ts.vel[0] * t, 0, ts.from[2] + ts.vel[2] * t], yaw: ts.yaw, pitch: -0.6 + ts.spin * t, pivot: 1.0, lift: Math.max(0.25, y)}, pose: fly(t, seed), air: true, y};
  }
  // lands on the back and slides a little
  const u = t - T;
  const k = 1 - Math.exp(-u * 5);
  const hop = Math.max(0, Math.sin(Math.min(1, u / 0.28) * Math.PI)) * 0.18;
  const p: V3 = [mix(land[0], rest[0], k), 0, mix(land[2], rest[2], k)];
  const settle = clamp01(u / 0.5);
  return {root: {pos: p, yaw: ts.yaw, pitch: -Math.PI / 2, pivot: 0.93, lift: 0.14 + hop}, pose: mixPose(fly(t, seed), lie(t, seed), settle), air: false, y: 0.14 + hop};
};

// a man lying hurt where he landed
export const lying = (i: number, v: number): ManState => {
  const l = LAND[i];
  return {root: {pos: l.p, yaw: l.yaw, pitch: -Math.PI / 2, pivot: 0.93, lift: 0.14}, pose: lie(v, i), look: LOOKS[i]};
};

export const manBlob = (blobs: Blob[], p: V3 | [number, number, number], y = 0, k = 1) => {
  const s = 1 / (1 + y * 0.5);
  blobs.push({x: p[0] - Math.sin(SUN_AZ) * y * 1.2, z: p[2] - Math.cos(SUN_AZ) * y * 1.2, len: 1.5 * k * s, w: 0.3 * k * s});
};

export const put = (P: Parts, blobs: Blob[], m: ManState, y = 0, far = false) => {
  drawMan(P, far ? {...m, far: true} : m);
  manBlob(blobs, m.root.pos, y);
};

// stand at a spot looking at a point, idle
export const standing = (i: number, v: number, p: [number, number], lookAt: [number, number], pose?: Pose): ManState => {
  const yaw = yawTo(p, lookAt);
  return {root: {pos: [p[0], 0, p[1]], yaw}, pose: pose ?? stand(v, i), look: LOOKS[i]};
};

// run along a straight line from a to b between t0 and t1 (eased), run cycle from the distance covered
export const runner = (i: number, v: number, a: [number, number], b: [number, number], t0: number, t1: number, faceAfter?: [number, number], idlePose?: (v: number, i: number) => Pose): ManState => {
  const k = sm(v, t0, t1);
  const p: [number, number] = [mix(a[0], b[0], k), mix(a[1], b[1], k)];
  const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const moving = v > t0 && v < t1 ? Math.sin(ramp(v, t0, t1) * Math.PI) ** 0.5 : 0;
  const yawRun = yawTo(a, b);
  const yawEnd = faceAfter ? yawTo(b, faceAfter) : yawRun;
  const kEnd = sm(v, t1 - 0.25, t1 + 0.1);
  const yaw = yawRun + wrap(yawEnd - yawRun) * kEnd;
  const rest = (idlePose ?? stand)(v, i);
  const pose = moving > 0.02 ? mixPose(rest, run(k * dist * 4.2 + i, 1, i), Math.min(1, moving * 1.4)) : rest;
  return {root: {pos: [p[0], 0, p[1]], yaw}, pose, look: LOOKS[i]};
};

// red cross that hovers over a hurt man, turned to the camera
export const marker = (P: Parts, at: V3, cam: V3, v: number, seed: number, grow = 1) => {
  if (grow <= 0) return;
  const yaw = Math.atan2(cam[0] - at[0], cam[2] - at[2]);
  const bob = 0.05 * Math.sin(v * 3 + seed * 2.1);
  const blink = 0.9 + 0.15 * Math.sin(v * 9 + seed);
  // close to the lens a marker keeps the size it has at five metres, so it never fills the frame
  const s = grow * blink * Math.min(1, Math.hypot(cam[0] - at[0], cam[1] - at[1], cam[2] - at[2]) / 5);
  P.root.makeRotationY(yaw).setPosition(at[0], at[1] + bob, at[2]);
  P.at('sph', [0, 0, 0], [0.2 * s, 0.2 * s, 0.03], '#fff6ea');
  P.at('box', [0, 0, 0.03], [0.26 * s, 0.085 * s, 0.03], '#ff2d46', undefined, false);
  P.at('box', [0, 0, 0.034], [0.085 * s, 0.26 * s, 0.03], '#ff2d46', undefined, false);
  P.root.identity();
};

// a dust puff: a few toon balls that swell and vanish
export const puff = (P: Parts, at: V3, t: number, seed: number, size = 1, life = 0.8, dir: V3 = [0, 0, 0]) => {
  if (t <= 0 || t >= life) return;
  const k = t / life;
  P.root.identity();
  for (let j = 0; j < 7; j++) {
    const a = hash(seed * 7 + j) * Math.PI * 2;
    const r = (0.15 + 0.5 * hash(seed * 3 + j * 5)) * size * (1 - Math.exp(-t * 6));
    const s = size * (0.16 + 0.24 * hash(seed + j * 11)) * (0.6 + 0.9 * k) * (1 - k * k);
    P.at('sph', [at[0] + Math.cos(a) * r + dir[0] * k, at[1] + s * 0.6 + 0.35 * k * size * hash(seed + j), at[2] + Math.sin(a) * r + dir[2] * k], s, j % 2 ? DUST_A : DUST_B);
  }
};
