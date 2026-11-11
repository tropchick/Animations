import {Parts, V3} from './ink';
import {Blob} from './Jungle';
import {GScene} from './World';
import {follow, mv} from '../bear/common';
import {BEATS, CHARGE, E, HITS, ROAR, RUN5, S, STOP, clamp01, easeOut, lerp, ramp, smooth} from './cues';
import {A, B, C, D, Eb, G0, HOME, LAND, LOOKS, N, Toss, lying, manBlob, marker, puff, put, runner, sm, standing, tossLand, tossed, wrap, yawTo} from './crowd';
import {Gor, ManState, Pose, drawGorilla, guard, hash, mix, mix3, mixPose, scared, sitHurt, stand} from './rig';

// ---------------------------------------------------------------- gorilla helpers
export const gorBlob = (blobs: Blob[], p: V3, k = 1) => blobs.push({x: p[0], z: p[2], len: 2.5 * k, w: 0.95 * k});

// gorilla-frame point for a world point
export const toLocal = (pos: V3, yaw: number, p: V3): V3 => {
  const dx = p[0] - pos[0];
  const dz = p[2] - pos[2];
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [dx * c - dz * s, p[1] - pos[1], dx * s + dz * c];
};

// knuckle walk: diagonal pairs; ph in radians, amt 0..1
export const knuckle = (ph: number, amt: number) => {
  const st = 0.3 * amt;
  const up = (x: number) => Math.max(0, x) * 0.16 * amt;
  return {
    armL: [-0.5, 0.09 + up(Math.cos(ph)), 0.72 + st * Math.sin(ph)] as V3,
    armR: [0.5, 0.09 + up(-Math.cos(ph)), 0.72 - st * Math.sin(ph)] as V3,
    footL: [-0.33, up(-Math.cos(ph)) * 0.8, -0.42 - st * Math.sin(ph)] as V3,
    footR: [0.33, up(Math.cos(ph)) * 0.8, -0.42 + st * Math.sin(ph)] as V3,
  };
};
// gallop: hands land together, then the feet
export const gallop = (ph: number, amt: number) => {
  const st = 0.55 * amt;
  const up = (x: number) => Math.max(0, x) * 0.3 * amt;
  const fp = ph + 2.6;
  return {
    armL: [-0.48, 0.09 + up(Math.cos(ph)), 0.75 + st * Math.sin(ph)] as V3,
    armR: [0.5, 0.09 + up(Math.cos(ph + 0.5)), 0.75 + st * Math.sin(ph + 0.5)] as V3,
    footL: [-0.33, up(Math.cos(fp)), -0.42 + st * 0.8 * Math.sin(fp)] as V3,
    footR: [0.33, up(Math.cos(fp + 0.4)), -0.42 + st * 0.8 * Math.sin(fp + 0.4)] as V3,
  };
};

const homeP = (i: number): [number, number] => [HOME[i].x, HOME[i].z];
// the crowd standing where it started; f lets a shot override single men
const crowdHome = (P: Parts, blobs: Blob[], v: number, f?: (i: number) => ManState | null | undefined, skip?: (i: number) => boolean, back = 0) => {
  for (let i = 0; i < N; i++) {
    if (skip?.(i)) continue;
    const o = f?.(i);
    if (o === null) continue;
    if (o) {
      put(P, blobs, o);
      continue;
    }
    const h = HOME[i];
    const k = 1 + back / h.rad;
    const pose = hash(i * 9.3) < 0.22 ? mixPose(stand(v, i), guard(v, i), 0.8) : hash(i * 4.1) < 0.2 ? mixPose(stand(v, i), scared(v, i), 0.35) : stand(v, i);
    put(P, blobs, standing(i, v, [h.x * k, h.z * k], [0, 0], pose));
  }
};

// ---------------------------------------------------------------- over: a crane over the heads to the gorilla
const gorCalm = (v: number): Gor => ({root: {pos: G0, yaw: 0}, up: 0.1, breath: Math.sin(v * 1.7), head: [0.25 * Math.sin(v * 0.6), -0.02], brow: 0.3});
export const overScene: GScene = {
  view: (v) => mv(v, S.over - 0.4, E.over + 0.5, [1.9, 2.25, 17.6], [0.4, 3.5, 10.6], [0, 1.5, 7], [0, 0.9, 0.6], [44, 36]),
  build: (v, P, blobs) => {
    drawGorilla(P, gorCalm(v));
    gorBlob(blobs, G0);
    crowdHome(P, blobs, v);
  },
};

// ---------------------------------------------------------------- face: he sits and chews, then looks up
export const faceScene: GScene = {
  view: (v) => mv(v, S.face - 0.2, E.face + 0.3, [1.7, 1.0, 3.9], [1.05, 1.12, 3.0], [0.05, 1.05, 1.2], [0, 1.12, 1.15], [34, 30]),
  build: (v, P, blobs) => {
    const t = v - S.face;
    const look = sm(t, 1.25, 1.75);
    const chew = (1 - look) * (0.18 + 0.16 * Math.sin(t * 11));
    const hand: V3 = [0.62, 0.12, 0.5];
    drawGorilla(P, {
      root: {pos: G0, yaw: 0.1},
      up: 0.4,
      squat: 0.3,
      footL: [-0.46, 0, 0.18],
      footR: [0.46, 0, 0.22],
      armL: [-0.58, 0.09, 0.5],
      armR: hand,
      head: [0.42 * look, mix(0.22, 0.02, look)],
      jaw: chew,
      brow: mix(0.15, 1, look),
      breath: Math.sin(t * 1.8),
    });
    gorBlob(blobs, G0, 0.9);
  },
};

// ---------------------------------------------------------------- hesitate: nobody wants to go first
export const hesitateScene: GScene = {
  view: (v) => {
    const k = sm(v, S.hesitate - 0.3, E.hesitate + 0.3);
    const x = lerp(-2.3, 1.5, k);
    return {pos: [x, 1.5, lerp(3.5, 3.9, k)], target: [x * 0.55 + 0.25, 1.22, 7.6], fov: 38, far: 900};
  },
  build: (v, P, blobs) => {
    const t = v - S.hesitate;
    crowdHome(P, blobs, v, (i) => {
      const h = HOME[i];
      if (i === A) {
        // shoved forward, scrambles back
        const out = sm(t, 0.55, 0.9) * (1 - sm(t, 1.25, 1.95));
        const p: [number, number] = [h.x, h.z - 0.95 * out];
        const pose = mixPose(mixPose(stand(v, i), scared(v, i), clamp01(out * 1.4 + sm(t, 0.5, 0.7) * 0.5)), stand(v, i), 0);
        const st = standing(i, v, p, [0, 0], {...pose, lean: pose.lean + 0.35 * sm(t, 0.55, 0.75) * (1 - sm(t, 0.8, 1.1)), head: [-0.9 * sm(t, 1.5, 2.0), 0]});
        return st;
      }
      if (i === B) {
        const push = sm(t, 0.35, 0.6) * (1 - sm(t, 0.75, 1.1));
        const s0 = stand(v, i);
        return standing(i, v, homeP(i), [0, 0], {...s0, handL: mix3(s0.handL, [-0.55, 1.22, 0.2], push), twist: -0.5 * push, bend: -0.12 * push, head: [mix(-0.5, 0.75 * sm(t, 1.2, 1.6), sm(t, 0.9, 1.2)), mix(0, -0.25, sm(t, 1.2, 1.6))], brow: mix(0.6, -0.2, sm(t, 1.0, 1.3)), mouth: 0.1});
      }
      if (i === C) {
        const pt = sm(t, 0.9, 1.25) * (1 - sm(t, 2.2, 2.6));
        const s0 = mixPose(stand(v, i), scared(v, i), 0.2);
        return standing(i, v, homeP(i), [0, 0], {...s0, handL: mix3(s0.handL, [-0.52, 1.3, 0.12], pt), head: [-0.7 * pt, 0], mouth: 0.5 * pt, brow: 0.3});
      }
      if (i === Eb) {
        const no = sm(t, 1.15, 1.45);
        const s0 = mixPose(stand(v, i), scared(v, i), 0.3 + 0.7 * no);
        return standing(i, v, homeP(i), [0, 0], {...s0, head: [0.5 * Math.sin(t * 15) * no + 0.5 * (1 - no), -0.05], hip: [s0.hip[0], s0.hip[1], s0.hip[2] - 0.1 * no]});
      }
      if (h.row === 0) {
        const s0 = mixPose(stand(v, i), scared(v, i), 0.25 + 0.15 * Math.sin(v * 2 + i));
        return standing(i, v, homeP(i), [0, 0], {...s0, head: [0.6 * Math.sin(v * 1.4 + i * 2.4), 0]});
      }
      if (h.row <= 2 && hash(i * 2.2) < 0.5) {
        // peeking over shoulders
        const s0 = stand(v, i);
        return standing(i, v, homeP(i), [0, 0], {...s0, hip: [0.12 * Math.sin(v * 1.1 + i), 0.93 + 0.05 * Math.max(0, Math.sin(v * 1.7 + i)), 0], bend: 0.14 * Math.sin(v * 1.1 + i)});
      }
      return undefined;
    });
  },
};

// ---------------------------------------------------------------- beat: up on two legs, palms on the chest
const beatPulse = (v: number, parity: number) => {
  let k = 0;
  BEATS.forEach((tb, j) => {
    if (j % 2 !== parity) return;
    const d = v - tb;
    if (d < 0) k = Math.max(k, 1 - -d / 0.1);
    else k = Math.max(k, 1 - d / 0.07);
  });
  return clamp01(k);
};
const beatGor = (v: number, pos: V3, yaw: number, rise: number): Gor => {
  const l = smooth(beatPulse(v, 0));
  const r = smooth(beatPulse(v, 1));
  const going = v > BEATS[0] - 0.25 && v < BEATS[BEATS.length - 1] + 0.2 ? 1 : 0;
  const roar = sm(v, ROAR - 0.25, ROAR + 0.05) * (1 - sm(v, ROAR + 0.9, ROAR + 1.2));
  const outL: V3 = mix3([-0.74, 0.62, 0.22], [-0.6, 1.52, 0.86], going);
  const outR: V3 = mix3([0.74, 0.62, 0.22], [0.6, 1.52, 0.86], going);
  return {
    root: {pos, yaw},
    up: rise,
    armL: mix3(outL, [-0.17, 1.5, 0.62], l),
    armR: mix3(outR, [0.17, 1.5, 0.62], r),
    palm: going,
    jaw: Math.max(0.45 * going, roar),
    brow: 1,
    head: [0, mix(0.2, -0.28, Math.max(going * 0.6, roar))],
    breath: Math.max(l, r) * 1.5,
  };
};
export const beatScene: GScene = {
  view: (v) => mv(v, S.beat - 0.3, E.beat + 0.3, [1.7, 0.5, 4.9], [1.05, 0.62, 4.0], [0, 1.15, 0.5], [0, 1.6, 0.5], [46, 42]),
  shakes: BEATS.map((b) => [b, 0.12] as [number, number]),
  build: (v, P, blobs) => {
    const rise = easeOut(ramp(v, S.beat, S.beat + 0.5));
    drawGorilla(P, beatGor(v, G0, 0.18, rise));
    gorBlob(blobs, G0);
    BEATS.forEach((b, j) => puff(P, [G0[0] + (j % 2 ? 0.5 : -0.5), 0, G0[2] + 0.2], v - b, j + 3, 0.5, 0.5));
  },
};

// ---------------------------------------------------------------- charge: seen from among the men
const CH_FROM: V3 = [0, 0, 0.3];
export const CH_TO: V3 = [0.42, 0, 5.75];
export const chargeGor = (v: number): {g: Gor; pos: V3} => {
  const k = 1 - Math.pow(1 - ramp(v, CHARGE, STOP), 1.7);
  const back = sm(v, STOP + 1.35, E.charge + 0.6);
  const turn = sm(v, STOP + 1.2, STOP + 1.9);
  const pos: V3 = [lerp(CH_FROM[0], CH_TO[0], k) - 0.3 * back, 0, lerp(CH_FROM[2], CH_TO[2], k) - 2.6 * back];
  const yaw = turn * Math.PI * 0.92;
  const rear = sm(v, STOP - 0.08, STOP + 0.16) * (1 - sm(v, STOP + 0.95, STOP + 1.25));
  const before = sm(v, CHARGE - 0.35, CHARGE - 0.05); // drops from the chest beating to all fours
  const moving = v < STOP ? Math.sin(ramp(v, CHARGE, STOP) * Math.PI) ** 0.4 : 0;
  const dist = k * 5.6;
  const ga = gallop(dist * 2.4, moving);
  const wk = knuckle(back * 2.6 * 3.2, back > 0.02 && back < 0.98 ? 1 : 0);
  const up = v < CHARGE ? 1 - before : rear;
  const roar = sm(v, STOP - 0.05, STOP + 0.12) * (1 - sm(v, STOP + 0.8, STOP + 1.1));
  const g: Gor = {
    root: {pos, yaw, pitch: -0.1 * moving * Math.sin(dist * 2.4)},
    up,
    armL: rear > 0.02 ? mix3([-0.5, 0.09, 0.72], [-1.0, 1.95, 0.45], rear) : back > 0 ? wk.armL : ga.armL,
    armR: rear > 0.02 ? mix3([0.5, 0.09, 0.72], [1.02, 1.85, 0.5], rear) : back > 0 ? wk.armR : ga.armR,
    footL: rear > 0.02 ? undefined : back > 0 ? wk.footL : ga.footL,
    footR: rear > 0.02 ? undefined : back > 0 ? wk.footR : ga.footR,
    jaw: Math.max(roar, 0.35 * moving),
    brow: 1,
    head: [0, mix(-0.12, -0.05, rear)],
    palm: rear,
    breath: Math.sin(v * 7),
  };
  return {g, pos};
};
// how far the crowd has backed off (metres along the radius) for a man in a given row
export const recoil = (v: number, row: number) => 1.15 * Math.exp(-row * 0.22) * sm(v, STOP - 0.3 + row * 0.05, STOP + 0.25 + row * 0.07);
export const chargeScene: GScene = {
  view: (v) => {
    const {pos} = chargeGor(v);
    const rec = sm(v, STOP - 0.12, STOP + 0.2);
    const cam: V3 = [0.62, 1.72 - 0.1 * rec, 9.05 + 0.75 * rec];
    const back = sm(v, STOP + 1.3, E.charge);
    return follow(v, 0, 1, cam, cam, [pos[0], lerp(lerp(0.95, 1.75, sm(v, STOP - 0.1, STOP + 0.2)), 1.0, back), pos[2]], lerp(lerp(40, 46, rec), 40, back), 760, 540);
  },
  shakes: [[STOP - 0.75, 0.2], [STOP - 0.45, 0.35], [STOP - 0.18, 0.5], [STOP, 1.1]],
  build: (v, P, blobs) => {
    const {g, pos} = chargeGor(v);
    drawGorilla(P, g);
    gorBlob(blobs, pos);
    // dust from the gallop and the skid
    for (let j = 0; j < 5; j++) {
      const tj = CHARGE + 0.12 + j * 0.2;
      const kj = 1 - Math.pow(1 - ramp(tj, CHARGE, STOP), 1.7);
      puff(P, [lerp(CH_FROM[0], CH_TO[0], kj), 0, lerp(CH_FROM[2], CH_TO[2], kj) - 0.4], v - tj, j + 20, 0.7, 0.7);
    }
    puff(P, [CH_TO[0] - 0.7, 0, CH_TO[2] + 0.5], v - (STOP - 0.1), 31, 0.8, 0.9, [-0.5, 0, 0.3]);
    puff(P, [CH_TO[0] + 0.7, 0, CH_TO[2] + 0.4], v - (STOP - 0.05), 32, 0.75, 0.9, [0.5, 0, 0.3]);
    crowdHome(
      P,
      blobs,
      v,
      (i) => {
        const h = HOME[i];
        const r = recoil(v, h.row);
        const k = 1 + r / h.rad;
        const fear = sm(v, CHARGE + 0.25 + h.row * 0.04, STOP + 0.1);
        const calm = sm(v, STOP + 1.6, STOP + 2.4);
        const p: [number, number] = [h.x * k, h.z * k];
        const base = mixPose(stand(v, i), scared(v, i), fear * (1 - 0.6 * calm));
        if (i === Eb) {
          // falls on his backside
          const fall = sm(v, STOP - 0.05, STOP + 0.3);
          const s = sitHurt(v, i);
          return standing(i, v, p, [0, 0], mixPose(base, {...s, handL: [-0.3, 0.12, -0.35], handR: [0.3, 0.12, -0.35], lean: -0.25, head: [0, -0.3], mouth: 0.9, brow: -1, eyes: 0}, fall));
        }
        return standing(i, v, p, [pos[0], pos[2]], base);
      },
      // keep the lens clear: nobody right in front of the camera
      (i) => HOME[i].row >= 1 && Math.abs(HOME[i].x - 0.62) < 0.75,
    );
  },
};

// ---------------------------------------------------------------- brave: five run out
const startOf = (i: number): [number, number] => {
  const h = HOME[i];
  const k = 1 + recoil(99, h.row) / h.rad;
  return [h.x * k, h.z * k];
};
export const SPOT: Record<number, [number, number]> = {[A]: [0.15, 1.95], [B]: [-0.95, 2.3], [C]: [1.5, 1.25], [D]: [-1.9, 3.2], [Eb]: [2.75, 1.9]};
const FIVE = [D, B, A, C, Eb];
const ARRIVE = HITS[0] - 0.2;
const fiveRun = (i: number, v: number) => runner(i, v, startOf(i), SPOT[i], RUN5 + 0.08 * (FIVE.indexOf(i) % 3), ARRIVE + 0.06 * FIVE.indexOf(i), [G0[0], G0[2]], guard);
const braveGor = (v: number): Gor => {
  const rise = sm(v, RUN5 + 1.2, ARRIVE);
  return {root: {pos: G0, yaw: 0}, up: 0.1 + 0.8 * rise, brow: 1, jaw: 0.3 * rise, head: [0, mix(-0.05, 0.1, rise)], breath: Math.sin(v * 3)};
};
export const braveScene: GScene = {
  view: (v) => {
    const lead = fiveRun(A, v).root.pos;
    const k = sm(v, S.brave - 0.2, E.brave + 0.4);
    return {pos: [lerp(1.3, 0.7, k), lerp(1.0, 1.35, k), lead[2] + lerp(5.2, 4.3, k)], target: [0.1, 1.1, lead[2] - 3.5], fov: 50, far: 900};
  },
  build: (v, P, blobs) => {
    drawGorilla(P, braveGor(v));
    gorBlob(blobs, G0);
    for (const i of FIVE) {
      const m = fiveRun(i, v);
      put(P, blobs, m);
      const d = clamp01((v - RUN5) / (ARRIVE - RUN5));
      for (let j = 1; j < 5; j++) {
        const tj = RUN5 + j * 0.42 + 0.05 * i;
        const kk = smooth(ramp(tj, RUN5, ARRIVE));
        const s = startOf(i);
        if (d > 0) puff(P, [lerp(s[0], SPOT[i][0], kk), 0, lerp(s[1], SPOT[i][1], kk)], v - tj, i * 7 + j, 0.32, 0.5);
      }
    }
  },
};

// ---------------------------------------------------------------- clash: three hits
const [H1, H2, H3] = HITS;
export const TOSS_A: Toss = {from: [0.55, 1.55, 1.6], vel: [5.1, 4.3, 1.5], spin: -7, yaw: Math.PI + 0.4};
export const TOSS_B: Toss = {from: [-0.95, 1.15, 2.2], vel: [-5.6, 3.6, 1.2], spin: 8, yaw: Math.PI - 0.9};
LAND[A] = {p: tossLand(TOSS_A).rest, yaw: TOSS_A.yaw};
LAND[B] = {p: tossLand(TOSS_B).rest, yaw: TOSS_B.yaw};
LAND[C] = {p: [SPOT[C][0] + 0.3, 0, SPOT[C][1] - 0.1], yaw: Math.PI + 1.3};
export const clashGor = (v: number): {g: Gor; pos: V3; yaw: number} => {
  const toB = sm(v, H1 + 0.25, H2 - 0.3);
  const toC = sm(v, H2 + 0.2, H3 - 0.25);
  const yaw = -0.45 * toB * (1 - toC) + 0.95 * toC;
  const lunge = sm(v, H3 - 0.35, H3);
  const pos: V3 = [G0[0] + 0.5 * lunge, 0, G0[2] + 0.2 * lunge];
  const L = (p: V3) => toLocal(pos, yaw, p);
  // right arm: reach for A, lift, throw
  const reach = sm(v, H1 - 0.42, H1 - 0.16);
  const lift = sm(v, H1 - 0.16, H1);
  const thrown = sm(v, H1, H1 + 0.14);
  const relax = sm(v, H1 + 0.35, H1 + 0.75);
  const restR: V3 = [0.74, 0.7, 0.3];
  let armR = mix3(restR, L([SPOT[A][0], 1.22, SPOT[A][1] - 0.12]), reach);
  armR = mix3(armR, L([TOSS_A.from[0] - 0.1, 1.5, TOSS_A.from[2]]), lift);
  armR = mix3(armR, [1.15, 1.85, 0.2], thrown);
  armR = mix3(armR, restR, relax);
  // left arm: wind up across the chest, backhand
  const wind = sm(v, H2 - 0.45, H2 - 0.16);
  const strike = sm(v, H2 - 0.14, H2 + 0.06);
  const relaxL = sm(v, H2 + 0.3, H2 + 0.65);
  const restL: V3 = [-0.74, 0.7, 0.3];
  let armL = mix3(restL, [0.25, 1.45, 0.55], wind);
  armL = mix3(armL, [-1.1, 1.2, 0.95], strike);
  armL = mix3(armL, restL, relaxL);
  // both arms: up, then down on C
  const raise = sm(v, H3 - 0.42, H3 - 0.16);
  const slam = sm(v, H3 - 0.14, H3 + 0.02);
  const cb: V3 = [LAND[C].p[0], 0.4, LAND[C].p[2]];
  armL = mix3(armL, [-0.45, 2.2, 0.5], raise);
  armR = mix3(armR, [0.45, 2.2, 0.5], raise);
  armL = mix3(armL, L([cb[0] - 0.22, 0.42, cb[2] + 0.1]), slam);
  armR = mix3(armR, L([cb[0] + 0.22, 0.42, cb[2] - 0.1]), slam);
  const up = mix(mix(0.9, 1, raise), 0.3, slam);
  const hitNow = Math.max(1 - Math.abs(v - H1) / 0.25, 1 - Math.abs(v - H2) / 0.25, 1 - Math.abs(v - H3) / 0.3, 0);
  return {
    g: {root: {pos, yaw}, up, armL, armR, jaw: 0.3 + 0.7 * hitNow, brow: 1, head: [0, mix(0.1, 0.5, slam)], breath: Math.sin(v * 5), squat: 0.1 * slam},
    pos,
    yaw,
  };
};
export const clashMan = (i: number, v: number): {m: ManState; y: number} | null => {
  if (i === A) {
    if (v >= H1) {
      const s = tossed(TOSS_A, v - H1, i);
      return {m: {root: s.root, pose: s.pose, look: LOOKS[i]}, y: s.y};
    }
    const m = fiveRun(i, v);
    const lift = sm(v, H1 - 0.16, H1);
    const p = mix3([SPOT[A][0], 0, SPOT[A][1]], [TOSS_A.from[0], 0, TOSS_A.from[2]], lift);
    const grabbed = sm(v, H1 - 0.3, H1 - 0.15);
    return {m: {...m, root: {...m.root, pos: p, pivot: 1.0, lift: 1.0 + 0.55 * lift, pitch: -0.5 * lift}, pose: mixPose(m.pose, scared(v, i), grabbed)}, y: 0.55 * lift};
  }
  if (i === B) {
    if (v >= H2) {
      const s = tossed(TOSS_B, v - H2, i);
      return {m: {root: s.root, pose: s.pose, look: LOOKS[i]}, y: s.y};
    }
    const m = fiveRun(i, v);
    return {m: {...m, pose: mixPose(m.pose, scared(v, i), sm(v, H1 + 0.1, H1 + 0.4))}, y: 0};
  }
  if (i === C) {
    const m = fiveRun(i, v);
    const down = sm(v, H3 - 0.1, H3 + 0.04);
    const fear = sm(v, H2, H2 + 0.3);
    if (down <= 0) return {m: {...m, pose: mixPose(m.pose, scared(v, i), fear)}, y: 0};
    const p = mix3([SPOT[C][0], 0, SPOT[C][1]], LAND[C].p, down);
    return {m: {root: {pos: p, yaw: mix(m.root.yaw, LAND[C].yaw, down), pitch: (-Math.PI / 2) * down, pivot: 0.93, lift: mix(0.93, 0.14, down)}, pose: mixPose(scared(v, i), lying(i, v).pose, down), look: LOOKS[i]}, y: 0};
  }
  // D and E: brake, then run for it
  const m = fiveRun(i, v);
  const flee = H1 + 0.45 + (i === D ? 0 : 0.2);
  if (v < flee) return {m: {...m, pose: mixPose(m.pose, scared(v, i), sm(v, H1 - 0.05, H1 + 0.2))}, y: 0};
  return {m: runner(i, v, SPOT[i], [SPOT[i][0] * 2.4, 10.5], flee, flee + 2.2), y: 0};
};
export const clashScene: GScene = {
  view: (v) => mv(v, S.clash - 0.3, E.clash + 0.3, [4.3, 1.75, 5.9], [3.4, 1.5, 5.3], [0.25, 1.25, 1.2], [0.9, 0.95, 0.95], [48, 46]),
  shakes: [[H1, 0.7], [H2, 0.9], [H3, 1.3]],
  build: (v, P, blobs) => {
    const {g, pos} = clashGor(v);
    drawGorilla(P, g);
    gorBlob(blobs, pos);
    const cam = clashScene.view(v).pos;
    for (const i of FIVE) {
      const s = clashMan(i, v);
      if (!s) continue;
      drawMan2(P, blobs, s.m, s.y);
    }
    const la = tossLand(TOSS_A);
    const lb = tossLand(TOSS_B);
    puff(P, la.land, v - (H1 + la.T), 41, 0.9, 0.8);
    puff(P, lb.land, v - (H2 + lb.T), 42, 0.9, 0.8);
    puff(P, [LAND[C].p[0] + 0.7, 0, LAND[C].p[2] - 0.5], v - H3, 43, 0.6, 0.8, [0.6, 0, -0.3]);
    puff(P, [LAND[C].p[0] - 0.5, 0, LAND[C].p[2] - 0.8], v - H3, 44, 0.55, 0.8, [-0.5, 0, -0.4]);
    marker(P, [LAND[A].p[0], 1.0, LAND[A].p[2]], cam, v, 1, easeOut(ramp(v, H1 + la.T + 0.1, H1 + la.T + 0.35)));
    marker(P, [LAND[B].p[0], 1.0, LAND[B].p[2]], cam, v, 2, easeOut(ramp(v, H2 + lb.T + 0.1, H2 + lb.T + 0.35)));
    marker(P, [LAND[C].p[0] + 0.5, 1.15, LAND[C].p[2] + 0.5], cam, v, 3, easeOut(ramp(v, H3 + 0.15, H3 + 0.4)));
  },
};
const drawMan2 = (P: Parts, blobs: Blob[], m: ManState, y: number) => {
  put(P, blobs, m, y);
};
export type {Pose};
export {manBlob, yawTo, wrap};
