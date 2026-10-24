import {Euler, Quaternion, Vector3} from 'three';
import {random} from 'remotion';
import type {PersonPose} from '../scene/Characters';
import {W, clamp01, lerp, ramp, V3} from './time';

// ---------- Rig math ----------
// A person is drawn inside a wrapper group: position P (the feet origin) and quaternion Q.
// Hands hold on to things, so most positions are solved backwards from a grip point.

const G = 9.8;
export const quat = (x: number, y: number, z: number) => new Quaternion().setFromEuler(new Euler(x, y, z, 'YXZ'));

// Hand position in the person's own frame for a straight arm (see Person in Characters.tsx).
export const handLocal = (side: 1 | -1, pitch: number, roll: number, scale = 1) =>
  new Vector3(
    0.33 * side + 0.86 * Math.sin(roll),
    1.52 - 0.86 * Math.cos(roll) * Math.cos(pitch),
    0.86 * Math.cos(roll) * Math.sin(pitch),
  ).multiplyScalar(scale);

const HIP = 0.9;
const toWorld = (P: Vector3, Q: Quaternion, local: Vector3) => local.clone().applyQuaternion(Q).add(P);
const fromHip = (H: Vector3, Q: Quaternion, s: number) => H.clone().sub(new Vector3(0, HIP * s, 0).applyQuaternion(Q));
const hipOf = (P: Vector3, Q: Quaternion, s: number) => toWorld(P, Q, new Vector3(0, HIP * s, 0));

export type BodyState = {P: Vector3; Q: Quaternion; pose: PersonPose; skin?: string};

// Ground height: raised plaza, sidewalk, street.
export const groundY = (x: number, z: number) => {
  if (x > -17 && x < 17 && z > -9.7 && z < 22) return 0.12;
  if (z > -24.2 && z < -22) return 0.16;
  return 0.02;
};

const lerpPair = (a: [number, number], b: [number, number], t: number): [number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

const lerpPose = (a: PersonPose, b: PersonPose, t: number): PersonPose => ({
  armL: lerpPair(a.armL ?? [0, 0.06], b.armL ?? [0, 0.06], t),
  armR: lerpPair(a.armR ?? [0, -0.06], b.armR ?? [0, -0.06], t),
  elbowL: lerp(a.elbowL ?? 0, b.elbowL ?? 0, t),
  elbowR: lerp(a.elbowR ?? 0, b.elbowR ?? 0, t),
  head: lerpPair(a.head ?? [0, 0], b.head ?? [0, 0], t),
  mouth: lerp(a.mouth ?? 0, b.mouth ?? 0, t),
  eyes: lerp(a.eyes ?? 1, b.eyes ?? 1, t),
  legL: lerp(a.legL ?? 0, b.legL ?? 0, t),
  legR: lerp(a.legR ?? 0, b.legR ?? 0, t),
});

// ---------- Cast ----------

export type Member = {
  id: string;
  shirt: string;
  pants: string;
  hair: string;
  skin: string;
  longHair?: boolean;
  child?: boolean;
  scale: number;
  flipPos: V3; // where the feet are at the flip
  vel: [number, number]; // walking velocity before the flip (x, z)
  yaw: number; // facing before the flip
  sitting?: boolean; // on a bench before the flip
  grip?: V3; // what the hands hold while gravity is flipped
  hangYaw: number;
  grabW: number;
  land: V3; // hip position after the fall back
  landYaw: number;
  // arms while hanging (both raised by default)
  hangArmL?: [number, number];
  hangArmR?: [number, number];
};

const SHIRTS = ['#4f86c6', '#e2725b', '#7cb46b', '#f2c14e', '#9b6fb5', '#ffffff', '#3d4a5c', '#e98fa6', '#46a6a0', '#c94a3a', '#f08a3c'];
const PANTS = ['#2f3a4f', '#5c6fa8', '#3b3b3b', '#7a6a58', '#9ec0e6', '#4d5d3b'];
const HAIR = ['#2a2220', '#5a3a22', '#8a5a34', '#c99b52', '#1f1a17', '#a3a3a3'];
const SKIN = ['#efd2b3', '#e0b48f', '#c68e63', '#8d5a3b', '#f3dcc4', '#a8714c'];
const pick = <T,>(arr: T[], key: string) => arr[Math.floor(random(key) * arr.length)];

// Poles people grab: position of the pole axis.
export const LAMPS: V3[] = [
  [-4.5, 0, 1],
  [-10, 0, -8.8],
  [-2.5, 0, -8.8],
  [10, 0, -8.8],
  [-13, 0, 10],
  [13, 0, 10],
  [-8, 0, 19],
  [8, 0, 19],
];
export const SIGNALS: {p: V3; rot: number}[] = [
  {p: [-7.4, 0, -9.6], rot: Math.PI},
  {p: [1.8, 0, -9.6], rot: Math.PI},
  {p: [-7.4, 0, -22.6], rot: 0},
  {p: [1.8, 0, -22.6], rot: 0},
  {p: [15.6, 0, -9.4], rot: -Math.PI / 2},
  {p: [28.4, 0, -9.4], rot: Math.PI / 2},
];
export const BUS_STOP: V3 = [4, 0.12, -8.4];
export const BENCHES: {p: V3; rot: number}[] = [
  {p: [6.5, 0.12, -2], rot: Math.PI},
  {p: [-9, 0.12, 13], rot: 0.3},
  {p: [9, 0.12, 13], rot: -0.3},
  {p: [-7.5, 0.12, 6], rot: Math.PI / 2},
];

// A grip on a pole: just off the axis, on the side the person comes from.
const poleGrip = (pole: V3, from: V3, y: number): {grip: V3; yaw: number} => {
  const dx = from[0] - pole[0];
  const dz = from[2] - pole[2];
  const d = Math.hypot(dx, dz) || 1;
  const grip: V3 = [pole[0] + (dx / d) * 0.24, y, pole[2] + (dz / d) * 0.24];
  return {grip, yaw: Math.atan2(-dx, -dz)};
};

type Seed = {
  flip: V3;
  vel?: [number, number];
  pole?: V3;
  gripY?: number;
  bench?: {p: V3; rot: number};
  benchSide?: number;
  sitting?: boolean;
  child?: boolean;
  landShift?: [number, number]; // move the landing spot (x, z)
};

const crowdSeeds: Seed[] = [
  // bus stop
  {flip: [3.0, 0.12, -8.0], pole: [2, 0, -9.0], landShift: [-1.5, 2.4]},
  {flip: [4.6, 0.12, -7.6], pole: [6, 0, -9.0], landShift: [0.5, 2.6]},
  {flip: [5.8, 0.12, -8.2], pole: [6, 0, -9.0], gripY: 0.7, landShift: [2.2, 1.6]},
  // crosswalk, both curbs
  {flip: [-6.6, 0.02, -11.0], vel: [0, -1.3], pole: [-7.4, 0, -9.6]},
  {flip: [1.0, 0.02, -11.4], vel: [0.1, -1.2], pole: [1.8, 0, -9.6]},
  {flip: [-6.2, 0.02, -21.0], vel: [0, 1.3], pole: [-7.4, 0, -22.6]},
  {flip: [1.2, 0.16, -22.0], vel: [0, 1.4], pole: [1.8, 0, -22.6]},
  {flip: [0.4, 0.02, -20.8], vel: [-0.1, 1.2], pole: [1.8, 0, -22.6], gripY: 0.6},
  // side street corner
  {flip: [15.0, 0.12, -8.4], vel: [1.2, 0], pole: [15.6, 0, -9.4]},
  {flip: [27.4, 0.02, -8.6], vel: [-1.3, 0], pole: [28.4, 0, -9.4]},
  // plaza lamps
  {flip: [-10.8, 0.12, -7.8], vel: [0.9, 0.8], pole: [-10, 0, -8.8]},
  {flip: [-9.2, 0.12, -7.6], vel: [-1.1, 0.4], pole: [-10, 0, -8.8], gripY: 0.7},
  {flip: [-2.0, 0.12, -7.6], vel: [1.2, 0.2], pole: [-2.5, 0, -8.8]},
  {flip: [10.8, 0.12, -7.9], vel: [-1.0, 0.6], pole: [10, 0, -8.8]},
  {flip: [9.3, 0.12, -7.5], vel: [0.8, -0.9], pole: [10, 0, -8.8], gripY: 0.7},
  {flip: [-12.1, 0.12, 10.9], vel: [0.2, -1.3], pole: [-13, 0, 10]},
  {flip: [-8.9, 0.12, 18.0], vel: [1.2, 0.5], pole: [-8, 0, 19]},
  {flip: [7.1, 0.12, 18.2], vel: [-1.2, 0.3], pole: [8, 0, 19]},
  {flip: [8.8, 0.12, 18.1], vel: [0.6, -1.1], pole: [8, 0, 19], gripY: 0.7, child: true},
  // hot dog vendor and a customer
  {flip: [12.3, 0.12, 9.4], pole: [13, 0, 10]},
  {flip: [13.9, 0.12, 9.2], pole: [13, 0, 10], gripY: 0.7},
  // benches
  {flip: [6.0, 0.12, -1.6], sitting: true, bench: BENCHES[0], benchSide: -0.5},
  {flip: [7.0, 0.12, -1.6], sitting: true, bench: BENCHES[0], benchSide: 0.5},
  {flip: [-9.1, 0.12, 13.5], sitting: true, bench: BENCHES[1], benchSide: 0},
  {flip: [9.2, 0.12, 13.5], sitting: true, bench: BENCHES[2], benchSide: 0.3},
  {flip: [-7.1, 0.12, 6.4], sitting: true, bench: BENCHES[3], benchSide: -0.4},
];

const makeMember = (s: Seed, i: number): Member => {
  const k = `crowd-${i}`;
  const vel = s.vel ?? [0, 0];
  let grip: V3;
  let hangYaw: number;
  if (s.bench) {
    // grab the front edge of the bench seat
    const {p, rot} = s.bench;
    const side = s.benchSide ?? 0;
    const fx = Math.sin(rot);
    const fz = Math.cos(rot);
    grip = [p[0] + Math.cos(rot) * side + fx * 0.3, p[1] + 0.5, p[2] - Math.sin(rot) * side + fz * 0.3];
    hangYaw = rot + Math.PI;
  } else {
    const pg = poleGrip(s.pole!, s.flip, s.gripY ?? 1.05 + random(`${k}-gy`) * 0.3);
    grip = pg.grip;
    hangYaw = pg.yaw;
  }
  const away = new Vector3(grip[0] - (s.pole?.[0] ?? grip[0]), 0, grip[2] - (s.pole?.[2] ?? grip[2] - 0.5)).normalize();
  const landX = grip[0] + away.x * 0.55 + (s.landShift?.[0] ?? 0);
  const landZ = grip[2] + away.z * 0.55 + (s.landShift?.[1] ?? 0);
  const walkYaw = Math.hypot(vel[0], vel[1]) > 0.01 ? Math.atan2(vel[0], vel[1]) : s.bench ? s.bench.rot : random(`${k}-yaw`) * Math.PI * 2;
  return {
    id: k,
    shirt: pick(SHIRTS, `${k}-sh`),
    pants: pick(PANTS, `${k}-pa`),
    hair: pick(HAIR, `${k}-ha`),
    skin: pick(SKIN, `${k}-sk`),
    longHair: random(`${k}-lh`) > 0.55,
    child: s.child,
    scale: s.child ? 0.62 : 0.94 + random(`${k}-sc`) * 0.1,
    flipPos: s.flip,
    vel,
    yaw: walkYaw,
    sitting: s.sitting,
    grip,
    hangYaw,
    grabW: W.flip + 0.32 + random(`${k}-gw`) * 0.45,
    land: [landX, groundY(landX, landZ) + 0.11, landZ],
    landYaw: Math.atan2(away.x, away.z) + (random(`${k}-ly`) - 0.5) * 0.8,
  };
};

export const CROWD: Member[] = crowdSeeds.map(makeMember);

// ---------- Hero family: lamp <- dad <- girl <- dog ----------

export const HERO_LAMP = LAMPS[0];
const FAM_VEL: [number, number] = [0.05, 0.7];

export const DAD: Member = {
  id: 'dad',
  shirt: '#f0b24a',
  pants: '#9ec0e6',
  hair: '#8a5a34',
  skin: '#efd2b3',
  scale: 1,
  flipPos: [-3.75, 0.12, 1.55],
  vel: FAM_VEL,
  yaw: 0.05,
  grip: poleGrip(HERO_LAMP, [-3.75, 0, 1.55], 1.1).grip,
  hangYaw: poleGrip(HERO_LAMP, [-3.75, 0, 1.55], 1.1).yaw,
  grabW: W.flip + 0.45,
  land: [-3.85, 0.23, 2.1],
  landYaw: 0.5,
  hangArmL: [Math.PI, 0.05],
  hangArmR: [0.15, 0.4],
};

export const GIRL: Member = {
  id: 'girl',
  shirt: '#e985a6',
  pants: '#5c6fa8',
  hair: '#5a3a22',
  skin: '#efd2b3',
  longHair: true,
  child: true,
  scale: 0.62,
  flipPos: [-2.95, 0.12, 2.2],
  vel: FAM_VEL,
  yaw: 0.05,
  hangYaw: 0,
  grabW: W.flip + 0.95,
  land: [-2.8, 0.23, 2.9],
  landYaw: 0.1,
  hangArmR: [Math.PI, 0],
  hangArmL: [0.1, -0.35],
};

export const DOG_FLIP: V3 = [-2.2, 0.12, 2.7];
export const LEASH = 1.15;

// ---------- Body state over time ----------

const H_GROUND_STAND = (m: Member, P: Vector3) => P;

const walkPose = (m: Member, w: number): PersonPose => {
  const speed = Math.hypot(m.vel[0], m.vel[1]);
  if (m.sitting) return {legL: 1.45, legR: 1.45, armL: [0.45, 0.1], armR: [0.45, -0.1], elbowL: 0.5, elbowR: 0.5};
  if (speed < 0.01) return {head: [0.05 * Math.sin(w * 0.7 + m.grabW * 9), 0.3 * Math.sin(w * 0.4 + m.grabW * 5)]};
  const ph = w * speed * 4.6 + m.grabW * 13;
  const s = Math.sin(ph);
  return {legL: 0.42 * s, legR: -0.42 * s, armL: [-0.35 * s, 0.08], armR: [0.35 * s, -0.08], elbowL: 0.2, elbowR: 0.2};
};

const hangPose = (m: Member, w: number): PersonPose => {
  const k = w * 2.2 + m.grabW * 7;
  return {
    armL: m.hangArmL ?? [Math.PI, 0.02],
    armR: m.hangArmR ?? [Math.PI, -0.02],
    legL: 0.35 * Math.sin(k),
    legR: -0.3 * Math.sin(k * 1.1),
    mouth: 0.7,
    eyes: 1.45,
    head: [0.35, 0.2 * Math.sin(k * 0.5)],
  };
};

const sitPose = (m: Member, w: number): PersonPose => {
  const lookUp = ramp(w, W.restore + 1.2, W.restore + 2.4) * (1 - ramp(w, 34, 35.5));
  const flinch = ramp(w, 31.35, 31.6) * (1 - ramp(w, 33.8, 34.6));
  const around = ramp(w, 34.5, 36);
  const base: PersonPose = {
    legL: 1.4,
    legR: 1.25,
    armL: [-0.55, 0.25],
    armR: [-0.55, -0.25],
    head: [lerp(0.1, -0.6, lookUp) + 0.25 * flinch, 0.5 * around * Math.sin(w * 0.8 + m.grabW * 3)],
    mouth: 0.4 * flinch + 0.2 * lookUp,
    eyes: 1 + 0.4 * lookUp + 0.3 * flinch,
  };
  if (flinch <= 0) return base;
  return lerpPose(base, {...base, armL: [2.7, 0.35], armR: [2.7, -0.35], elbowL: 1.9, elbowR: 1.9}, flinch);
};

// Blood rushing to the head while hanging upside down.
const blush = (skin: string, k: number) => {
  if (k <= 0) return skin;
  const c = parseInt(skin.slice(1), 16);
  const r = (c >> 16) & 255;
  const g = (c >> 8) & 255;
  const b = c & 255;
  const mix = (a: number, t: number) => Math.round(lerp(a, t, k * 0.45));
  return `rgb(${mix(r, 235)},${mix(g, 110)},${mix(b, 105)})`;
};

// Position and orientation while hanging from a grip (with a slow pendulum sway).
export const hangState = (m: Member, w: number, grip: Vector3): {P: Vector3; Q: Quaternion} => {
  const sway = quat(0.07 * Math.sin(w * 1.3 + m.grabW * 5), 0, 0.06 * Math.sin(w * 1.05 + m.grabW * 3));
  const Q = sway.multiply(quat(0, m.hangYaw, Math.PI));
  const armL = m.hangArmL ?? [Math.PI, 0.02];
  const armR = m.hangArmR ?? [Math.PI, -0.02];
  // the grip sits between the hands that hold it
  const hl = handLocal(-1, armL[0], armL[1], m.scale);
  const hr = handLocal(1, armR[0], armR[1], m.scale);
  const both = (m.hangArmL ?? m.hangArmR) === undefined;
  const local = both ? hl.clone().add(hr).multiplyScalar(0.5) : m.id === 'girl' ? hr : hl;
  const P = grip.clone().sub(local.applyQuaternion(Q));
  return {P, Q};
};

// Generic timeline for one person; `gripAt` gives the grip point (it moves for the girl).
export const bodyAt = (m: Member, w: number, gripAt: (w: number) => Vector3): BodyState => {
  const standQ = quat(0, m.yaw, 0);
  const flipFeet = new Vector3(...m.flipPos);
  if (w < W.flip) {
    const P = new Vector3(m.flipPos[0] - m.vel[0] * (W.flip - w), m.flipPos[1], m.flipPos[2] - m.vel[1] * (W.flip - w));
    if (m.sitting) {
      // sitting: hips on the seat
      const H = new Vector3(m.flipPos[0], m.flipPos[1] + 0.5, m.flipPos[2]);
      return {P: fromHip(H, standQ, m.scale), Q: standQ, pose: walkPose(m, w), skin: m.skin};
    }
    return {P: H_GROUND_STAND(m, P), Q: standQ, pose: walkPose(m, w), skin: m.skin};
  }
  if (w < m.grabW) {
    // falling up, twisting around to reach for the grip
    const t = w - W.flip;
    const startH = m.sitting
      ? new Vector3(m.flipPos[0], m.flipPos[1] + 0.5, m.flipPos[2])
      : hipOf(flipFeet, standQ, m.scale);
    const free = startH.clone().add(new Vector3(m.vel[0] * t, 0.5 * G * t * t, m.vel[1] * t));
    const target = hangState(m, m.grabW, gripAt(m.grabW));
    const e = ramp(w, W.flip, m.grabW, (x) => x * x * (3 - 2 * x));
    const Q = standQ.clone().slerp(target.Q, e);
    const H = free.lerp(hipOf(target.P, target.Q, m.scale), e);
    const flail: PersonPose = {
      armL: [1.6 + 0.8 * Math.sin(w * 9), 0.6],
      armR: [1.9 + 0.8 * Math.sin(w * 8 + 1), -0.6],
      legL: 0.5 * Math.sin(w * 7),
      legR: -0.5 * Math.sin(w * 7),
      mouth: 0.8,
      eyes: 1.6,
    };
    const pose = lerpPose(lerpPose(walkPose(m, W.flip), flail, ramp(w, W.flip, W.flip + 0.15)), hangPose(m, w), e);
    return {P: fromHip(H, Q, m.scale), Q, pose, skin: m.skin};
  }
  if (w < W.restore) {
    const {P, Q} = hangState(m, w, gripAt(w));
    return {P, Q, pose: hangPose(m, w), skin: blush(m.skin, ramp(w, m.grabW + 1, m.grabW + 5))};
  }
  // gravity is back: drop and land sitting
  const start = hangState(m, W.restore, gripAt(W.restore));
  const startH = hipOf(start.P, start.Q, m.scale);
  const land = new Vector3(...m.land);
  const tFall = Math.sqrt((2 * Math.max(0.3, startH.y - land.y)) / G);
  const sitQ = quat(-0.12, m.landYaw, 0);
  const f = clamp01((w - W.restore) / tFall);
  const Q = start.Q.clone().slerp(sitQ, f * f * (3 - 2 * f));
  const H = new Vector3(lerp(startH.x, land.x, f), lerp(startH.y, land.y, f * f), lerp(startH.z, land.z, f));
  // small bounce after landing
  const tl = w - W.restore - tFall;
  if (tl > 0) H.y = land.y + Math.max(0, 0.12 * Math.sin(tl * 9) * Math.exp(-tl * 5));
  const pose = lerpPose(hangPose(m, w), sitPose(m, w), f);
  return {P: fromHip(H, Q, m.scale), Q, pose, skin: blush(m.skin, 1 - ramp(w, W.restore, W.restore + 4))};
};

// ---------- Family helpers ----------

export const dadAt = (w: number) => bodyAt(DAD, w, () => new Vector3(...DAD.grip!));

export const dadRightHand = (w: number) => {
  const s = hangState(DAD, w, new Vector3(...DAD.grip!));
  const arm = DAD.hangArmR!;
  return toWorld(s.P, s.Q, handLocal(1, arm[0], arm[1], 1));
};

export const girlAt = (w: number) => bodyAt(GIRL, w, dadRightHand);

export const girlLeftHand = (w: number) => {
  const b = girlAt(w);
  const arm = b.pose.armL ?? [0, 0.06];
  return toWorld(b.P, b.Q, handLocal(-1, arm[0], arm[1], GIRL.scale));
};

export const headOf = (b: BodyState, scale = 1) => toWorld(b.P, b.Q, new Vector3(0, 1.82 * scale, 0));

export type DogState = {P: Vector3; Q: Quaternion; legPhase: number; head: number; tail: number; shake: number; collar: Vector3};

const COLLAR = new Vector3(0, 0.74, 0.42);

export const dogAt = (w: number): DogState => {
  const yaw = 0.15;
  const standQ = quat(0, yaw, 0);
  const flip = new Vector3(...DOG_FLIP);
  const hang = (ww: number) => {
    const hand = girlLeftHand(ww);
    const C = hand.clone().add(new Vector3(0.1 * Math.sin(ww * 1.7), LEASH, 0.1 * Math.cos(ww * 1.4)));
    const Q = quat(Math.PI / 2 + 0.15 * Math.sin(ww * 2.1), yaw, 0.1 * Math.sin(ww * 1.6));
    return {P: C.clone().sub(COLLAR.clone().applyQuaternion(Q)), Q, C};
  };
  if (w < W.flip) {
    const P = new Vector3(flip.x - FAM_VEL[0] * (W.flip - w), flip.y, flip.z - FAM_VEL[1] * (W.flip - w));
    return {P, Q: standQ, legPhase: w * 10, head: -0.1, tail: Math.sin(w * 14) * 0.5, shake: 0, collar: toWorld(P, standQ, COLLAR)};
  }
  const grab = GIRL.grabW + 0.25;
  if (w < W.restore) {
    const h = hang(w);
    if (w < grab) {
      const t = w - W.flip;
      const free = flip.clone().add(new Vector3(0, 0.5 * G * t * t, FAM_VEL[1] * t));
      const e = ramp(w, W.flip, grab, (x) => x * x);
      const target = hang(grab);
      const Q = standQ.clone().slerp(target.Q, e);
      return {P: free.lerp(target.P, e), Q, legPhase: w * 16, head: -0.3, tail: 0.6, shake: 0, collar: h.C};
    }
    return {P: h.P, Q: h.Q, legPhase: w * 13, head: 0.4, tail: 0.3 * Math.sin(w * 5), shake: 0, collar: h.C};
  }
  // drops and lands on its feet next to the girl, shakes the water off after the splash
  const start = hang(W.restore);
  const land = new Vector3(-2.0, 0.12, 3.6);
  const tFall = Math.sqrt((2 * Math.max(0.3, start.P.y - land.y)) / G);
  const f = clamp01((w - W.restore) / tFall);
  const Q = start.Q.clone().slerp(quat(0, -0.6, 0), Math.min(1, f * 1.3));
  const P = new Vector3(lerp(start.P.x, land.x, f), lerp(start.P.y, land.y, f * f), lerp(start.P.z, land.z, f));
  const shakeEnv = ramp(w, 34.4, 34.7) * (1 - ramp(w, 35.6, 36));
  const lookUp = ramp(w, W.restore + 1.5, W.restore + 2.5) * (1 - ramp(w, 31.4, 31.7));
  return {
    P,
    Q,
    legPhase: f < 1 ? w * 14 : 0,
    head: -0.5 * lookUp + 0.2,
    tail: f < 1 ? 0.6 : 0.15 * Math.sin(w * 3),
    shake: Math.sin(w * 38) * 0.3 * shakeEnv,
    collar: toWorld(P, Q, COLLAR),
  };
};
