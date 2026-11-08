import * as THREE from 'three';
import type {V3} from './cues';
import type {HumanPose, Outfit} from './People';
import type {BearPose} from './Bear';

// World-space positions of hands, heads and mouths, mirroring the transforms in People.tsx and Bear.tsx.
// Used to aim the camera at a prop in a hand and to fly things into a mouth.

const m4 = () => new THREE.Matrix4();
const T = (x: number, y: number, z: number) => m4().makeTranslation(x, y, z);
const R = (x: number, y: number, z: number, order: THREE.EulerOrder = 'XYZ') => m4().makeRotationFromEuler(new THREE.Euler(x, y, z, order));
const S = (s: number) => m4().makeScale(s, s, s);
const chain = (...ms: THREE.Matrix4[]) => ms.reduce((a, b) => a.multiply(b), m4());

export const humanTorso = (o: Outfit, position: V3, yaw: number, p: HumanPose, scale = 1) => {
  const sit = p.sit ?? 0;
  const hipH = 0.655 - (0.655 - 0.47) * sit;
  return chain(T(...position), R(0, yaw, 0), S((o.scale ?? 1) * scale), T(0, hipH + (p.bob ?? 0), 0), R(p.lean ?? 0, p.twist ?? 0, p.tilt ?? 0));
};

// the frame of a hand item (what handL / handR children see)
export const humanHand = (o: Outfit, position: V3, yaw: number, p: HumanPose, side: 1 | -1, scale = 1) => {
  const a = (side === 1 ? p.armR : p.armL) ?? [0.05, 0.1, 0];
  const el = (side === 1 ? p.elbowR : p.elbowL) ?? -0.15;
  return chain(humanTorso(o, position, yaw, p, scale), T(0.2 * side, 0.43, 0), R(a[0], (a[2] ?? 0) * side, a[1] * side), T(0, -0.2, 0), R(el, 0, 0), T(0, -0.18 - 0.03 - 0.04, 0));
};

// the centre of the head
export const humanHead = (o: Outfit, position: V3, yaw: number, p: HumanPose, scale = 1) => {
  const hp = p.head ?? [0, 0, 0];
  return chain(humanTorso(o, position, yaw, p, scale), T(0, 0.53, 0), R(hp[0], hp[1], hp[2], 'YXZ'), T(0, 0.16 * 0.95, 0.01));
};

export const bearTorso = (position: V3, yaw: number, p: BearPose, scale = 1) => {
  const sit = p.sit ?? 0;
  return chain(T(...position), R(0, yaw, 0), S(scale), T(0, 0.62 - 0.27 * sit, 0), R(-0.22 * sit, 0, 0), R(p.lean ?? 0, p.twist ?? 0, p.tilt ?? 0));
};

export const bearHand = (position: V3, yaw: number, p: BearPose, side: 1 | -1, scale = 1) => {
  const a = (side === 1 ? p.armR : p.armL) ?? [0.05, 0.12];
  const el = (side === 1 ? p.elbowR : p.elbowL) ?? -0.2;
  return chain(bearTorso(position, yaw, p, scale), T(0.6 * side, 0.98, 0.05), R(a[0], 0, a[1] * side), T(0, -0.36, 0), R(el, 0, 0), T(0, -0.26 - 0.06 - 0.14, 0.05));
};

export const bearHead = (position: V3, yaw: number, p: BearPose, scale = 1) => {
  const hp = p.head ?? [0, 0, 0];
  return chain(bearTorso(position, yaw, p, scale), T(0, 1.2, 0.06), R(hp[0], hp[1], hp[2], 'YXZ'), T(0, 0.27, 0.04));
};

export const at = (m: THREE.Matrix4, local: V3 = [0, 0, 0]): V3 => {
  const v = new THREE.Vector3(...local).applyMatrix4(m);
  return [v.x, v.y, v.z];
};
// a direction (no translation)
export const dirOf = (m: THREE.Matrix4, local: V3): V3 => {
  const v = new THREE.Vector3(...local).transformDirection(m);
  return [v.x, v.y, v.z];
};
// compose an item placed inside a frame (position + XYZ rotation)
export const inside = (m: THREE.Matrix4, position: V3, rotation: V3 = [0, 0, 0]) => m.clone().multiply(T(...position)).multiply(R(...rotation));

export const bearMouth = (position: V3, yaw: number, p: BearPose, scale = 1) => at(bearHead(position, yaw, p, scale), [0, -0.2, 0.47]);

// two-bone reach: the shoulder pitch and elbow bend (both about x) that put the hand on `target`.
// The limb hangs along −y; pitch about x swings it forward (−). Lateral offsets are ignored.
const reach2 = (L1: number, L2: number, ty: number, tz: number) => {
  const u = -ty;
  const w = -tz;
  const d = Math.min(L1 + L2 - 1e-4, Math.max(Math.abs(L1 - L2) + 1e-4, Math.hypot(u, w)));
  const D = (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  // the forearm bends forward (negative), like an arm reaching to a table
  const t2 = -Math.acos(Math.max(-1, Math.min(1, D)));
  const k = d / Math.max(1e-6, Math.hypot(u, w));
  const t1 = Math.atan2(w * k, u * k) - Math.atan2(L2 * Math.sin(t2), L1 + L2 * Math.cos(t2));
  return {pitch: t1, elbow: t2};
};

// the bear's arm angles that bring his paw (the hand-item point) to a world point
export const bearReach = (position: V3, yaw: number, p: BearPose, side: 1 | -1, target: V3, scale = 1) => {
  const sh = bearTorso(position, yaw, p, scale).multiply(T(0.6 * side, 0.98, 0.05));
  const loc = new THREE.Vector3(...target).applyMatrix4(sh.clone().invert());
  return reach2(0.36, 0.46, loc.y, loc.z);
};

// a person's arm angles that bring the hand to a world point
export const humanReach = (o: Outfit, position: V3, yaw: number, p: HumanPose, side: 1 | -1, target: V3, scale = 1) => {
  const sh = humanTorso(o, position, yaw, p, scale).multiply(T(0.2 * side, 0.43, 0));
  const loc = new THREE.Vector3(...target).applyMatrix4(sh.clone().invert());
  return reach2(0.2, 0.25, loc.y, loc.z);
};

// ---------------------------------------------------------------- a small numeric IK for three joint angles

const solve3x3 = (A: number[][], b: number[]) => {
  const [a, b1, c] = A[0];
  const [d, e, f] = A[1];
  const [g, h, i] = A[2];
  const det = a * (e * i - f * h) - b1 * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-12) return [0, 0, 0];
  const inv = [
    [(e * i - f * h) / det, (c * h - b1 * i) / det, (b1 * f - c * e) / det],
    [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
    [(d * h - e * g) / det, (b1 * g - a * h) / det, (a * e - b1 * d) / det],
  ];
  return inv.map((r) => r[0] * b[0] + r[1] * b[1] + r[2] * b[2]);
};

// damped least squares on x = [pitch, roll, elbow] so that f(x) lands on target
export const ik3 = (f: (x: number[]) => V3, target: V3, x0: number[], lo: number[], hi: number[], iters = 40) => {
  let x = x0.slice();
  for (let it = 0; it < iters; it++) {
    const p = f(x);
    const e = [target[0] - p[0], target[1] - p[1], target[2] - p[2]];
    if (Math.hypot(e[0], e[1], e[2]) < 2e-4) break;
    const J = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    for (let j = 0; j < 3; j++) {
      const xx = x.slice();
      xx[j] += 1e-4;
      const q = f(xx);
      for (let r = 0; r < 3; r++) J[r][j] = (q[r] - p[r]) / 1e-4;
    }
    const lam = 0.002;
    const JtJ = [0, 1, 2].map((r) => [0, 1, 2].map((c) => J[0][r] * J[0][c] + J[1][r] * J[1][c] + J[2][r] * J[2][c] + (r === c ? lam : 0)));
    const Jte = [0, 1, 2].map((r) => J[0][r] * e[0] + J[1][r] * e[1] + J[2][r] * e[2]);
    const dx = solve3x3(JtJ, Jte);
    const m = Math.max(Math.abs(dx[0]), Math.abs(dx[1]), Math.abs(dx[2]));
    const s = m > 0.35 ? 0.35 / m : 1;
    x = x.map((xi, j) => Math.max(lo[j], Math.min(hi[j], xi + dx[j] * s)));
  }
  return x;
};

// the bear's paw (hand-item point) on a world point: returns arm [pitch, roll] and elbow
export const bearArmTo = (position: V3, yaw: number, p: BearPose, side: 1 | -1, target: V3, scale = 1): {arm: [number, number]; elbow: number} => {
  const f = (x: number[]) => at(bearHand(position, yaw, side === 1 ? {...p, armR: [x[0], x[1]], elbowR: x[2]} : {...p, armL: [x[0], x[1]], elbowL: x[2]}, side, scale));
  const x = ik3(f, target, [-0.9, 0.1, -0.6], [-3.1, -0.9, -2.5], [1.0, 1.6, 0.05]);
  return {arm: [x[0], x[1]], elbow: x[2]};
};

// a person's hand on a world point: returns arm [pitch, roll, 0] and elbow
export const humanArmTo = (o: Outfit, position: V3, yaw: number, p: HumanPose, side: 1 | -1, target: V3, scale = 1): {arm: [number, number, number]; elbow: number} => {
  const f = (x: number[]) => at(humanHand(o, position, yaw, side === 1 ? {...p, armR: [x[0], x[1], 0], elbowR: x[2]} : {...p, armL: [x[0], x[1], 0], elbowL: x[2]}, side, scale));
  const x = ik3(f, target, [-0.8, 0.1, -0.6], [-3.1, -0.6, -2.5], [1.0, 1.4, 0.05]);
  return {arm: [x[0], x[1], 0], elbow: x[2]};
};
