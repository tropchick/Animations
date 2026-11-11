import * as THREE from 'three';
import {Parts, V3} from './ink';

// Joint-based characters: every pose is a handful of points (hips, hands, feet, head direction);
// limbs are solved with two-bone IK and drawn as cylinders between the joints.

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
export const mix3 = (a: V3, b: V3, k: number): V3 => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];
export const along = (o: V3, ...terms: [V3, number][]): V3 => {
  const r: V3 = [o[0], o[1], o[2]];
  for (const [d, k] of terms) {
    r[0] += d[0] * k;
    r[1] += d[1] * k;
    r[2] += d[2] * k;
  }
  return r;
};
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// two-bone IK: joint a, target t, bone lengths, pole = which way the middle joint bends
export const ik = (a: V3, t: V3, l1: number, l2: number, pole: V3): [V3, V3] => {
  let d = sub(t, a);
  let L = len(d);
  const maxL = (l1 + l2) * 0.998;
  const minL = Math.abs(l1 - l2) + 0.02;
  if (L < 1e-5) {
    d = [0, -1, 0];
    L = 1;
  }
  const dir = norm(d);
  L = Math.min(maxL, Math.max(minL, L));
  const x = (l1 * l1 - l2 * l2 + L * L) / (2 * L);
  const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  let p = sub(pole, mul(dir, dot(pole, dir)));
  if (len(p) < 1e-4) p = Math.abs(dir[1]) < 0.9 ? cross(dir, [0, 1, 0]) : cross(dir, [1, 0, 0]);
  p = norm(p);
  return [along(a, [dir, x], [p, h]), along(a, [dir, L])];
};

// root transform: ground point, yaw, then pitch/roll about a pivot that sits `lift` above the ground
export type Root = {pos: V3; yaw: number; pitch?: number; roll?: number; pivot?: number; lift?: number; scale?: number};
const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
export const rootMatrix = (r: Root) => {
  const s = r.scale ?? 1;
  const piv = (r.pivot ?? 0) * s;
  _e.set(r.pitch ?? 0, r.yaw, r.roll ?? 0, 'YXZ');
  _q.setFromEuler(_e);
  const m = new THREE.Matrix4().compose(new THREE.Vector3(r.pos[0], r.pos[1] + (r.lift ?? piv), r.pos[2]), _q, new THREE.Vector3(s, s, s));
  return m.multiply(new THREE.Matrix4().makeTranslation(0, -(r.pivot ?? 0), 0));
};
export const toWorld = (r: Root, p: V3): V3 => {
  const v = new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(rootMatrix(r));
  return [v.x, v.y, v.z];
};

// ---------------------------------------------------------------- men
export type Look = {
  shirt: string;
  pants: string;
  skin: string;
  hair: string;
  style: number; // 0 short, 1 bald, 2 cap, 3 mop
  beard: boolean;
  shorts: boolean;
  h: number;
  w: number;
  shoe: string;
};

const SHIRTS = ['#e8443a', '#f2b632', '#2f9e8f', '#3d6fd6', '#f4f1e6', '#f07f2e', '#6fae3c', '#8a5bd0', '#ef6fa0', '#2b3350', '#d9d2c0', '#48b6e8', '#c93a5e', '#e9e04a'];
const PANTS = ['#2b3350', '#3f4a5c', '#1f2230', '#7a6a4a', '#34507a', '#4a4038', '#5b6470'];
const SKINS = ['#f0c29a', '#e2a877', '#c98a5c', '#9a6642', '#f5d0b0', '#b9784e'];
const HAIRS = ['#2a2018', '#4a3020', '#1a1a1e', '#c9a14a', '#b5522a', '#6b6b70'];
const CAPS = ['#e8443a', '#2b3350', '#f4f1e6', '#2f9e8f', '#f2b632'];

export const makeLook = (i: number): Look => {
  const r = (k: number) => hash(i * 17.3 + k * 7.1);
  const style = r(1) < 0.5 ? 0 : r(1) < 0.64 ? 1 : r(1) < 0.84 ? 2 : 3;
  return {
    shirt: SHIRTS[Math.floor(r(2) * SHIRTS.length)],
    pants: PANTS[Math.floor(r(3) * PANTS.length)],
    skin: SKINS[Math.floor(r(4) * SKINS.length)],
    hair: style === 2 ? CAPS[Math.floor(r(5) * CAPS.length)] : HAIRS[Math.floor(r(5) * HAIRS.length)],
    style,
    beard: r(6) < 0.3,
    shorts: r(7) < 0.3,
    h: 0.94 + r(8) * 0.13,
    w: 0.92 + r(9) * 0.3,
    shoe: r(10) < 0.5 ? '#f4f1e6' : '#26222c',
  };
};

// all points are in the man's own frame: feet on y = 0, facing +z
export type Pose = {
  hip: V3; // pelvis centre
  lean: number; // torso pitch forward (rad)
  bend: number; // torso roll to the side
  twist: number; // shoulders yaw
  head: [number, number]; // yaw, pitch (down positive) relative to the torso
  handL: V3;
  handR: V3;
  footL: V3;
  footR: V3;
  mouth: number; // 0 closed .. 1 shouting
  brow: number; // -1 scared .. 1 angry
  eyes?: number; // 1 = shut
};

export const mixPose = (a: Pose, b: Pose, k: number): Pose => ({
  hip: mix3(a.hip, b.hip, k),
  lean: mix(a.lean, b.lean, k),
  bend: mix(a.bend, b.bend, k),
  twist: mix(a.twist, b.twist, k),
  head: [mix(a.head[0], b.head[0], k), mix(a.head[1], b.head[1], k)],
  handL: mix3(a.handL, b.handL, k),
  handR: mix3(a.handR, b.handR, k),
  footL: mix3(a.footL, b.footL, k),
  footR: mix3(a.footR, b.footR, k),
  mouth: mix(a.mouth, b.mouth, k),
  brow: mix(a.brow, b.brow, k),
  eyes: mix(a.eyes ?? 0, b.eyes ?? 0, k),
});

export const stand = (t = 0, seed = 0): Pose => {
  const s = Math.sin(t * 1.3 + seed * 5.1);
  const c = Math.sin(t * 0.9 + seed * 3.3);
  return {
    hip: [0.012 * s, 0.93, 0],
    lean: 0.04 + 0.015 * c,
    bend: 0.02 * s,
    twist: 0.05 * c,
    head: [0.1 * Math.sin(t * 0.7 + seed * 9), 0.02],
    handL: [-0.27, 0.8 + 0.01 * s, 0.03],
    handR: [0.27, 0.8 - 0.01 * s, 0.03],
    footL: [-0.11, 0, 0],
    footR: [0.11, 0, 0],
    mouth: 0,
    brow: 0,
  };
};

// fists up, knees bent
export const guard = (t = 0, seed = 0): Pose => {
  const s = Math.sin(t * 2.4 + seed * 4);
  return {
    hip: [0, 0.86 + 0.012 * s, 0],
    lean: 0.22,
    bend: 0,
    twist: 0.25,
    head: [-0.15, -0.08],
    handL: [-0.17, 1.3 + 0.015 * s, 0.3],
    handR: [0.2, 1.24 - 0.015 * s, 0.22],
    footL: [-0.13, 0, 0.16],
    footR: [0.15, 0, -0.14],
    mouth: 0.15,
    brow: 0.8,
  };
};

// leaning away, palms out
export const scared = (t = 0, seed = 0): Pose => {
  const s = Math.sin(t * 9 + seed * 4) * 0.008;
  return {
    hip: [0, 0.88, -0.06],
    lean: -0.22,
    bend: 0.05 * Math.sin(seed * 7),
    twist: 0,
    head: [0, -0.1],
    handL: [-0.24, 1.3 + s, 0.3],
    handR: [0.24, 1.33 - s, 0.3],
    footL: [-0.14, 0, 0.1],
    footR: [0.13, 0, -0.2],
    mouth: 0.8,
    brow: -1,
  };
};

// run cycle; ph in radians, amount 0..1 (0 = stand)
export const run = (ph: number, amt = 1, seed = 0): Pose => {
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  const st = 0.42 * amt;
  return {
    hip: [0, 0.9 + 0.035 * Math.abs(c) * amt, 0],
    lean: 0.1 + 0.3 * amt,
    bend: 0,
    twist: -0.3 * s * amt,
    head: [0, -0.12 * amt],
    handL: [-0.25, 1.05 + 0.12 * amt * Math.max(0, s), 0.1 + 0.33 * s * amt],
    handR: [0.25, 1.05 + 0.12 * amt * Math.max(0, -s), 0.1 - 0.33 * s * amt],
    footL: [-0.1, Math.max(0, c) * 0.3 * amt, -st * s + 0.05],
    footR: [0.1, Math.max(0, -c) * 0.3 * amt, st * s + 0.05],
    mouth: 0.75 * amt + 0.1 * Math.sin(seed),
    brow: 0.9,
  };
};

// thrown through the air: limbs spread, flailing
export const fly = (t: number, seed = 0): Pose => {
  const w = Math.sin(t * 14 + seed);
  return {
    hip: [0, 0.93, 0],
    lean: -0.25,
    bend: 0.1 * w,
    twist: 0.2 * w,
    head: [0, -0.3],
    handL: [-0.5, 1.5 + 0.1 * w, 0.15],
    handR: [0.52, 1.35 - 0.1 * w, 0.2],
    footL: [-0.3, 0.25 + 0.1 * w, 0.3],
    footR: [0.25, 0.12 - 0.1 * w, 0.15],
    mouth: 1,
    brow: -1,
  };
};

// on the back (use with pitch = -PI/2, pivot 0.93, lift 0.14): one arm held, knees up a little
export const lie = (t = 0, seed = 0): Pose => {
  const s = Math.sin(t * 2 + seed * 3) * 0.02;
  const left = hash(seed + 3) < 0.5;
  const hold: V3 = left ? [0.2, 1.22, 0.2] : [-0.2, 1.22, 0.2];
  return {
    hip: [0, 0.93, 0],
    lean: 0,
    bend: 0.08 * Math.sin(seed * 5),
    twist: 0,
    head: [0.3 * Math.sin(seed * 9), -0.15],
    handL: left ? [-0.42, 1.25, 0.05] : hold,
    handR: left ? hold : [0.42, 1.25, 0.05],
    footL: [-0.14, 0.12, 0.34 + s],
    footR: [0.16, 0.05, 0.12],
    mouth: 0.45,
    brow: -0.8,
    eyes: 1,
  };
};

// sitting on the ground, holding a shoulder (use as is, hips low)
export const sitHurt = (t = 0, seed = 0): Pose => {
  const s = Math.sin(t * 1.6 + seed * 3) * 0.01;
  const left = hash(seed + 5) < 0.5;
  return {
    hip: [0, 0.2, -0.05],
    lean: 0.35 + s,
    bend: left ? 0.12 : -0.12,
    twist: 0,
    head: [0, 0.3],
    handL: left ? [-0.3, 0.2, 0.2] : [0.17, 0.66, 0.24],
    handR: left ? [-0.17, 0.66, 0.24] : [0.3, 0.2, 0.2],
    footL: [-0.16, 0, 0.72],
    footR: [0.2, 0, 0.55],
    mouth: 0.3,
    brow: -0.7,
    eyes: 0.6,
  };
};

// bent over, hands on knees, catching breath
export const tired = (t = 0, seed = 0): Pose => {
  const s = Math.sin(t * 3.2 + seed * 3);
  return {
    hip: [0, 0.84, -0.12],
    lean: 0.85 + 0.05 * s,
    bend: 0,
    twist: 0,
    head: [0, -0.25],
    handL: [-0.16, 0.56, 0.2],
    handR: [0.16, 0.56, 0.2],
    footL: [-0.16, 0, 0.02],
    footR: [0.16, 0, 0.02],
    mouth: 0.4 + 0.2 * s,
    brow: -0.2,
  };
};

// pushing / holding something down in front (hands low and forward)
export const press = (t = 0, seed = 0, low = 0.5): Pose => {
  const s = Math.sin(t * 5 + seed * 3) * 0.01;
  return {
    hip: [0, 0.62, -0.25],
    lean: 0.95,
    bend: 0,
    twist: 0,
    head: [0, -0.35],
    handL: [-0.2, low + s, 0.62],
    handR: [0.2, low - s, 0.62],
    footL: [-0.17, 0, -0.42],
    footR: [0.17, 0, -0.1],
    mouth: 0.5,
    brow: 0.9,
  };
};

// lying face down across something, arms hugging (use with pitch = PI/2, pivot 0.93)
export const hug = (t = 0, seed = 0): Pose => {
  const s = Math.sin(t * 6 + seed * 3) * 0.015;
  return {
    hip: [0, 0.93, 0],
    lean: 0.15,
    bend: 0.1 * Math.sin(seed * 4),
    twist: 0,
    head: [0.4 * Math.sin(seed * 8), -0.3],
    handL: [-0.42, 1.52 + s, 0.3],
    handR: [0.42, 1.5 - s, 0.3],
    footL: [-0.2, 0.08, -0.1 + s],
    footR: [0.2, 0.1, 0.12 - s],
    mouth: 0.6,
    brow: 0.9,
  };
};

// one fist in the air
export const cheer = (t = 0, seed = 0): Pose => {
  const p = stand(t, seed);
  const s = Math.sin(t * 7 + seed * 2) * 0.03;
  return {...p, handR: [0.3, 1.9 + s, 0.05], mouth: 0.8, brow: 0.5, lean: -0.05, head: [0, -0.2]};
};

export type ManState = {root: Root; pose: Pose; look: Look; far?: boolean};

const INK = '#1c1024';
export const drawMan = (P: Parts, m: ManState) => {
  const {pose, look} = m;
  const h = look.h;
  const w = look.w;
  P.root = rootMatrix({...m.root, scale: (m.root.scale ?? 1) * h});
  const X: V3 = [1, 0, 0];
  // torso frame
  const cl = Math.cos(pose.lean);
  const sl = Math.sin(pose.lean);
  const cb = Math.cos(pose.bend);
  const sb = Math.sin(pose.bend);
  const u: V3 = norm([sb, cl * cb, sl * cb]); // up the spine
  const ct = Math.cos(pose.twist);
  const stw = Math.sin(pose.twist);
  let tx: V3 = [ct, 0, -stw];
  tx = norm(sub(tx, mul(u, dot(tx, u))));
  const tz = cross(tx, u); // chest forward
  const hip = pose.hip;
  const neck = along(hip, [u, 0.55]);
  const far = Boolean(m.far);
  // torso + pelvis
  P.ell('sph', along(hip, [u, -0.02]), along(neck, [u, 0.0]), 0.2 * w, 0.125 * w, tx, look.shirt, true, 0.03);
  P.at('sph', along(hip, [u, -0.01]), [0.165 * w, 0.115, 0.125 * w], look.pants, undefined, true);
  // legs
  for (const sgn of [-1, 1]) {
    const hj = along(hip, [X, 0.095 * sgn * w], [u, -0.03]);
    const ft = sgn < 0 ? pose.footL : pose.footR;
    const ankle: V3 = [ft[0], ft[1] + 0.07, ft[2]];
    const [knee, an] = ik(hj, ankle, 0.44, 0.43, [sgn * 0.12, 0, 1]);
    P.seg('cyl', hj, knee, 0.082 * w, look.pants);
    P.seg('cyl', knee, an, 0.062 * w, look.shorts ? look.skin : look.pants);
    if (!far) P.at('sph', knee, 0.078 * w, look.pants);
    // shoe points along the shin's ground direction
    const fdir = norm([an[0] - knee[0], 0, Math.max(0.2, an[2] - knee[2] + 0.3)]);
    P.ell('sph', along(an, [fdir, -0.06], [[0, 1, 0], -0.035]), along(an, [fdir, 0.15], [[0, 1, 0], -0.035]), 0.055, 0.045, [1, 0, 0], look.shoe);
  }
  // arms
  for (const sgn of [-1, 1]) {
    const sh = along(hip, [u, 0.5], [tx, 0.2 * sgn * w]);
    const hd = sgn < 0 ? pose.handL : pose.handR;
    const [el, wr] = ik(sh, hd, 0.27, 0.26, [sgn * 0.6, -0.5, -0.6]);
    const mid = mix3(sh, el, 0.6);
    P.seg('cyl', sh, mid, 0.062 * w, look.shirt);
    P.seg('cyl', mid, el, 0.05 * w, look.skin);
    P.seg('cyl', el, wr, 0.045 * w, look.skin);
    P.at('sph', sh, 0.064 * w, look.shirt);
    if (!far) P.at('sph', el, 0.05 * w, look.skin);
    P.at('sph', wr, 0.06, look.skin);
  }
  // head frame
  const hy0 = pose.head[0];
  const hp0 = pose.head[1];
  let hf: V3 = along([0, 0, 0], [tz, Math.cos(hy0) * Math.cos(hp0)], [tx, Math.sin(hy0) * Math.cos(hp0)], [u, -Math.sin(hp0)]);
  hf = norm(hf);
  let hx = norm(cross(u, hf));
  if (len(cross(u, hf)) < 1e-3) hx = tx;
  const hu = cross(hf, hx);
  const hc = along(neck, [u, 0.08], [hu, 0.1]);
  P.seg('cyl', along(hip, [u, 0.5]), hc, 0.05, look.skin, false);
  const R = 0.14;
  P.basis('sph', hc, hx, hu, hf, [R, R * 1.06, R], look.skin);
  if (look.style !== 1) {
    // hair / cap: a dome tilted back
    const up2 = norm(along([0, 0, 0], [hu, 0.93], [hf, -0.36]));
    const f2 = norm(sub(hf, mul(up2, dot(hf, up2))));
    const k = look.style === 3 ? 1.16 : 1.07;
    P.basis('cap', along(hc, [hu, 0.005]), hx, up2, f2, [R * k, R * k * 1.05, R * k], look.hair);
    if (look.style === 2) P.basis('sph', along(hc, [hu, 0.07], [hf, 0.13]), hx, hu, hf, [0.085, 0.012, 0.085], look.hair); // cap peak
  }
  if (far) return;
  if (look.beard) P.basis('sph', along(hc, [hu, -0.085], [hf, 0.045]), hx, hu, hf, [0.1, 0.075, 0.095], look.style === 2 || look.style === 1 ? '#3a2a20' : look.hair, false);
  // face
  const open = 1 - (pose.eyes ?? 0);
  for (const sgn of [-1, 1]) {
    const e = along(hc, [hx, 0.052 * sgn], [hu, 0.018], [hf, R * 0.93]);
    P.basis('sph', e, hx, hu, hf, [0.02, 0.004 + 0.022 * open, 0.012], INK, false);
    // brow: angry = inner end down, scared = inner end up
    const a = -pose.brow * 0.45 * sgn;
    const bx = norm(along([0, 0, 0], [hx, Math.cos(a)], [hu, Math.sin(a)]));
    const bu = cross(hf, bx);
    P.basis('sph', along(hc, [hx, 0.055 * sgn], [hu, 0.062 - 0.012 * pose.brow], [hf, R * 0.9]), bx, bu, hf, [0.034, 0.009, 0.012], INK, false);
  }
  P.basis('sph', along(hc, [hu, -0.018], [hf, R * 1.0]), hx, hu, hf, [0.02, 0.022, 0.024], look.skin, false);
  P.basis('sph', along(hc, [hu, -0.068], [hf, R * 0.86]), hx, hu, hf, [0.03 + 0.016 * pose.mouth, 0.006 + 0.034 * pose.mouth, 0.02], '#5a1420', false);
};

// ---------------------------------------------------------------- gorilla
export type Gor = {
  root: Root;
  up: number; // 0 on all fours .. 1 upright
  armL?: V3; // hand targets, gorilla frame
  armR?: V3;
  footL?: V3;
  footR?: V3;
  head?: [number, number]; // yaw, pitch (down positive)
  jaw?: number; // 0..1
  breath?: number; // -1..1
  squat?: number; // lowers the hips (m)
  brow?: number; // 0 calm .. 1 furious
  eyes?: number; // 1 = shut
  palm?: number; // 1 = open palms (chest beating)
  flat?: number; // 0..1 pressed to the ground (lying on the belly)
};

const FUR = '#50557a';
const FUR2 = '#42466a';
const SILVER = '#c4c8d6';
const SKIN = '#2c2836';
const SKIN2 = '#463f52';

// default hand / foot targets for a given stance, so scenes only override what they animate
export const gorDefaults = (up: number) => ({
  armL: mix3([-0.5, 0.09, 0.72], [-0.74, 0.62, 0.22], up) as V3,
  armR: mix3([0.5, 0.09, 0.72], [0.74, 0.62, 0.22], up) as V3,
  footL: mix3([-0.33, 0, -0.42], [-0.3, 0, -0.02], up) as V3,
  footR: mix3([0.33, 0, -0.42], [0.3, 0, -0.02], up) as V3,
});

// returns a few useful world points (head, chest, hands)
export const drawGorilla = (P: Parts, g: Gor) => {
  P.root = rootMatrix(g.root);
  const up = g.up;
  const flat = g.flat ?? 0;
  const d = gorDefaults(up);
  const X: V3 = [1, 0, 0];
  const a = mix(mix(0.36, 1.36, up), 0.06, flat);
  const s: V3 = [0, Math.sin(a), Math.cos(a)];
  const dn: V3 = [0, Math.cos(a), -Math.sin(a)]; // out of the back
  const hipY = mix(mix(0.8, 0.86, up) - (g.squat ?? 0), 0.36, flat);
  const H: V3 = [0, hipY, mix(-0.36, 0.0, up)];
  const br = 1 + 0.035 * (g.breath ?? 0);
  const C = along(H, [s, 0.8]);
  // trunk
  P.ell('sph', along(H, [s, -0.22]), along(H, [s, 0.5]), 0.41, 0.37, X, FUR2);
  P.ell('sph', along(H, [s, 0.22]), along(C, [s, 0.3]), 0.53 * br, 0.43 * br, X, FUR);
  P.ell('sph', along(H, [s, -0.12], [dn, 0.13]), along(C, [s, -0.02], [dn, 0.13]), 0.37, 0.31, X, SILVER);
  // bare chest
  for (const sgn of [-1, 1]) P.ell('sph', along(C, [dn, -0.3 * br], [s, -0.2], [X, 0.2 * sgn]), along(C, [dn, -0.3 * br], [s, 0.16], [X, 0.2 * sgn]), 0.23, 0.15, X, SKIN2, false);
  // legs
  for (const sgn of [-1, 1]) {
    const hj = along(H, [X, 0.25 * sgn], [s, -0.04]);
    const ft = (sgn < 0 ? g.footL : g.footR) ?? (sgn < 0 ? d.footL : d.footR);
    const ankle: V3 = [ft[0], ft[1] + 0.09, ft[2]];
    const [knee, an] = ik(hj, ankle, 0.44, 0.42, [sgn * 0.7, 0.1, 1]);
    P.seg('tap', hj, knee, 0.225, FUR2);
    P.at('sph', hj, 0.225, FUR2);
    P.seg('cyl', knee, an, 0.14, FUR2);
    P.at('sph', knee, 0.165, FUR2);
    P.at('sph', an, 0.14, FUR2);
    P.ell('sph', along(an, [[0, 0, 1], -0.1], [[0, 1, 0], -0.03]), along(an, [[0, 0, 1], 0.24], [[sgn, 0, 0], 0.05], [[0, 1, 0], -0.035]), 0.12, 0.07, X, SKIN);
  }
  // arms
  const hands: V3[] = [];
  for (const sgn of [-1, 1]) {
    const sh = along(C, [X, 0.5 * sgn], [s, 0.04], [dn, 0.0]);
    const ht = (sgn < 0 ? g.armL : g.armR) ?? (sgn < 0 ? d.armL : d.armR);
    const [el, wr] = ik(sh, ht, 0.58, 0.56, [sgn * 0.9, -0.1, -0.8]);
    P.at('sph', sh, 0.27, FUR);
    P.seg('tap', sh, el, 0.215, FUR);
    P.at('sph', el, 0.175, FUR);
    P.seg('cyl', el, wr, 0.165, FUR);
    P.at('sph', wr, 0.165, FUR);
    const fd = norm(sub(wr, el));
    const palm = g.palm ?? 0;
    P.ell('sph', along(wr, [fd, -0.02]), along(wr, [fd, 0.24]), 0.15 + 0.03 * palm, 0.135 - 0.06 * palm, cross(fd, [sgn, 0.3, 0.2]), SKIN);
    hands.push(along(wr, [fd, 0.1]));
  }
  // neck + head
  const hyaw = g.head?.[0] ?? 0;
  const hpitch = (g.head?.[1] ?? mix(-0.1, 0.25, up)) + flat * 0.1;
  const hf: V3 = norm([Math.sin(hyaw) * Math.cos(hpitch), -Math.sin(hpitch), Math.cos(hyaw) * Math.cos(hpitch)]);
  const hx = norm(cross([0, 1, 0], hf));
  const hu = cross(hf, hx);
  const Hd = along(C, [s, 0.36], [dn, -0.13], [hf, 0.1]);
  P.ell('sph', along(C, [s, 0.05], [dn, 0.12]), along(Hd, [hu, 0.02], [hf, -0.1]), 0.33, 0.3, X, FUR);
  P.basis('sph', Hd, hx, hu, hf, [0.215, 0.22, 0.225], FUR);
  P.basis('sph', along(Hd, [hu, 0.19], [hf, -0.07]), hx, hu, hf, [0.15, 0.2, 0.2], FUR); // crest
  for (const sgn of [-1, 1]) P.basis('sph', along(Hd, [hx, 0.215 * sgn], [hu, 0.02], [hf, -0.02]), hx, hu, hf, [0.035, 0.05, 0.03], SKIN, false);
  P.basis('sph', along(Hd, [hu, -0.035], [hf, 0.115]), hx, hu, hf, [0.175, 0.185, 0.14], SKIN, false); // face
  const brow = g.brow ?? 0.4;
  P.basis('sph', along(Hd, [hu, 0.075 - 0.02 * brow], [hf, 0.185]), hx, hu, hf, [0.2, 0.052, 0.085], FUR2); // brow ridge
  const jaw = g.jaw ?? 0;
  const mz = along(Hd, [hu, -0.085], [hf, 0.225]);
  P.basis('sph', mz, hx, hu, hf, [0.135, 0.085, 0.12], SKIN2); // muzzle
  for (const sgn of [-1, 1]) P.basis('sph', along(mz, [hx, 0.035 * sgn], [hu, 0.035], [hf, 0.1]), hx, hu, hf, [0.02, 0.014, 0.02], '#0e0a12', false);
  // eyes
  const open = 1 - (g.eyes ?? 0);
  for (const sgn of [-1, 1]) {
    const e = along(Hd, [hx, 0.078 * sgn], [hu, 0.022], [hf, 0.232]);
    P.basis('sph', e, hx, hu, hf, [0.03, 0.006 + 0.022 * open, 0.02], '#f0a030', false);
    P.basis('sph', along(e, [hf, 0.012]), hx, hu, hf, [0.014, 0.004 + 0.012 * open, 0.012], '#0e0a12', false);
  }
  // jaw
  const jd = norm(along([0, 0, 0], [hu, -Math.cos(jaw * 0.75)], [hf, Math.sin(jaw * 0.75) * 0.6]));
  const jc = along(Hd, [hu, -0.1], [hf, 0.16], [jd, 0.075 + 0.11 * jaw]);
  if (jaw > 0.05) {
    P.basis('sph', along(mz, [hu, -0.05 - 0.05 * jaw], [hf, 0.0]), hx, hu, hf, [0.105, 0.04 + 0.085 * jaw, 0.1], '#7a1626', false);
    for (const sgn of [-1, 1]) {
      P.basis('cone', along(mz, [hx, 0.062 * sgn], [hu, -0.085], [hf, 0.07]), hx, mul(hu, -1), hf, [0.02, 0.07, 0.02], '#f6f0de', false);
      P.basis('cone', along(jc, [hx, 0.052 * sgn], [hu, 0.06], [hf, 0.075]), hx, hu, hf, [0.018, 0.055, 0.018], '#f6f0de', false);
    }
  }
  P.basis('sph', along(jc, [hf, 0.03]), hx, hu, hf, [0.115, 0.055, 0.11], SKIN2);
  return {head: Hd, chest: C, hands, hf};
};
