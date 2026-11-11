import * as THREE from 'three';
import {Parts, V3} from './ink';
import {Blob, SUN_AZ, SUN_G, SUN_X} from './Jungle';
import {GScene} from './World';
import {mv, orbit} from '../bear/common';
import {E, HEAVE, LOOKBACK, MELEE_HITS, S, SLUMP, THROWN, clamp01, easeOut, lerp, ramp, smooth} from './cues';
import {A, B, C, G0, HURT_MEN, LAND, LOOKS, MELEE_V, N, PILE_MEN, PILE_OFF, RING, Toss, lying, marker, puff, put, runner, sm, standing, tossLand, tossed, yawTo} from './crowd';
import {Gor, ManState, cheer, drawGorilla, guard, hash, hug, mix, mix3, mixPose, press, rootMatrix, run, sitHurt, stand, tired} from './rig';
import {gorBlob, knuckle} from './scenesA';

const along2 = (o: V3, a: V3, ka: number, b: V3 = [0, 0, 0], kb = 0): V3 => [o[0] + a[0] * ka + b[0] * kb, o[1] + a[1] * ka + b[1] * kb, o[2] + a[2] * ka + b[2] * kb];
const ringP = (i: number): [number, number] => [RING[i].x, RING[i].z];
const dirOf = (az: number): V3 => [Math.sin(az), 0, Math.cos(az)];

// ---------------------------------------------------------------- melee choreography (also used by the swarm)
// hit j: the gorilla faces PHI[j]; the victim stands there and flies off along it
const PHI = MELEE_HITS.map((_, j) => 0.9 + j * 2.15);
export const VSPOT = MELEE_V.map((_, j): [number, number] => [G0[0] + Math.sin(PHI[j]) * 1.85, G0[2] + Math.cos(PHI[j]) * 1.85]);
const VTOSS: Toss[] = MELEE_V.map((i, j) => {
  const d = dirOf(PHI[j] + (hash(i) - 0.5) * 0.5);
  const sp = 4.6 + 1.6 * hash(i * 3);
  return {from: [VSPOT[j][0], 1.15, VSPOT[j][1]], vel: [d[0] * sp, 3.4 + 1.2 * hash(i * 7), d[2] * sp], spin: (j % 2 ? 1 : -1) * (6 + 3 * hash(i)), yaw: PHI[j] + Math.PI + 0.5};
});
MELEE_V.forEach((i, j) => {
  LAND[i] = {p: tossLand(VTOSS[j]).rest, yaw: VTOSS[j].yaw};
});
const meleeYaw = (v: number) => {
  let y = PHI[0] - 1.2;
  let prev = S.melee - 0.2;
  for (let j = 0; j < PHI.length; j++) {
    const t = MELEE_HITS[j];
    y = mix(y, PHI[j], sm(v, prev + 0.05, t - 0.06));
    prev = t;
  }
  return y + 0.5 * sm(v, prev, prev + 0.5);
};
const meleeGor = (v: number): Gor => {
  let armL: V3 = [-0.8, 1.1, 0.45];
  let armR: V3 = [0.8, 1.1, 0.45];
  let hit = 0;
  MELEE_HITS.forEach((t, j) => {
    const wind = sm(v, t - 0.3, t - 0.12) * (1 - sm(v, t + 0.12, t + 0.3));
    const strike = sm(v, t - 0.1, t + 0.02);
    const left = j % 2 === 0;
    const w: V3 = left ? [-0.9, 1.75, -0.2] : [0.9, 1.75, -0.2];
    const s: V3 = left ? [-0.25, 1.15, 1.3] : [0.25, 1.15, 1.3];
    const target = mix3(w, s, strike);
    if (left) armL = mix3(armL, target, wind);
    else armR = mix3(armR, target, wind);
    hit = Math.max(hit, 1 - Math.abs(v - t) / 0.22);
  });
  const tire = sm(v, MELEE_HITS[4], MELEE_HITS[7] + 0.3);
  return {root: {pos: G0, yaw: meleeYaw(v)}, up: mix(0.95, 0.8, tire), armL, armR, jaw: 0.35 + 0.65 * clamp01(hit), brow: 1, head: [0, 0.12], breath: Math.sin(v * 8), squat: 0.08 * tire};
};
const victim = (j: number, v: number): {m: ManState; y: number} => {
  const i = MELEE_V[j];
  const t = MELEE_HITS[j];
  if (v >= t) {
    const s = tossed(VTOSS[j], v - t, i);
    return {m: {root: s.root, pose: s.pose, look: LOOKS[i]}, y: s.y};
  }
  // lunging in and out before the hit
  const r = 1.85 + 0.9 * (1 - sm(v, t - 0.9, t - 0.15)) + 0.12 * Math.sin(v * 9 + j);
  const p: [number, number] = [G0[0] + Math.sin(PHI[j]) * r, G0[2] + Math.cos(PHI[j]) * r];
  return {m: standing(i, v, p, [G0[0], G0[2]], mixPose(guard(v, i), run(v * 12 + i, 1, i), 0.35)), y: 0};
};

// the ring of everyone else: where a man is and what he does while the fight is on
const ringMan = (i: number, v: number, surge = 1): ManState => {
  const r = RING[i];
  const k = r.rad < 4 ? 0.3 * surge * Math.sin(v * 3.1 + i * 1.7) : 0.12 * surge * Math.sin(v * 2.3 + i);
  const d = dirOf(r.az);
  const p: [number, number] = [r.x - d[0] * k, r.z - d[2] * k];
  const pose = mixPose(guard(v, i), run(v * 10 + i, 1, i), r.rad < 4 ? 0.25 + 0.2 * Math.sin(v * 3.1 + i * 1.7) : 0.08);
  return standing(i, v, p, [G0[0], G0[2]], {...pose, mouth: 0.5 + 0.4 * Math.sin(v * 5 + i)});
};
const hurtDown = (P: Parts, blobs: Blob[], v: number, cam: V3, ids: number[], far = false) => {
  for (const i of ids) {
    put(P, blobs, lying(i, v), 0, far);
    marker(P, [LAND[i].p[0], 0.95, LAND[i].p[2]], cam, v, i);
  }
};

// ---------------------------------------------------------------- swarm: from above, the ring closes
export const swarmScene: GScene = {
  view: (v) => mv(v, S.swarm - 0.3, E.swarm + 0.4, [1.2, 19, 10.5], [0.4, 13.5, 7.2], [0, 0, 1.2], [0, 0, 0.6], [50, 46]),
  build: (v, P, blobs) => {
    const cam = swarmScene.view(v).pos;
    const t = v - S.swarm;
    drawGorilla(P, {root: {pos: G0, yaw: 0.9 * Math.sin(t * 2.4)}, up: 0.95, armL: [-0.95, 1.5, 0.4], armR: [0.95, 1.5, 0.4], jaw: 0.7, brow: 1, head: [0.5 * Math.sin(t * 2.4 + 0.6), 0]});
    gorBlob(blobs, G0);
    hurtDown(P, blobs, v, cam, [A, B, C], true);
    for (let i = 0; i < N; i++) {
      if (i === A || i === B || i === C) continue;
      const j = MELEE_V.indexOf(i);
      const end: [number, number] = j >= 0 ? [G0[0] + Math.sin(PHI[j]) * 2.75, G0[2] + Math.cos(PHI[j]) * 2.75] : ringP(i);
      const az = Math.atan2(end[0] - G0[0], end[1] - G0[2]);
      const far = 5.0 + 2.0 * hash(i * 1.3);
      const start: [number, number] = [end[0] + Math.sin(az) * far, end[1] + Math.cos(az) * far];
      const t0 = S.swarm - 0.5 + 0.5 * hash(i * 2.9);
      put(P, blobs, runner(i, v, start, end, t0, t0 + 2.2 + 0.6 * hash(i * 4.3), [G0[0], G0[2]], guard), 0, true);
    }
  },
};

// ---------------------------------------------------------------- melee
const camAz = (v: number) => lerp(0.3, 1.05, smooth(ramp(v, S.melee - 0.3, E.melee + 0.3)));
export const meleeScene: GScene = {
  view: (v) => orbit(v, S.melee - 0.3, E.melee + 0.3, [G0[0], 0, G0[2]], [6.6, 5.6], [2.7, 2.2], 0.3, 1.05, [G0[0], 1.2, G0[2]], [46, 42]),
  shakes: MELEE_HITS.map((t) => [t, 0.7] as [number, number]),
  build: (v, P, blobs) => {
    const cam = meleeScene.view(v).pos;
    drawGorilla(P, meleeGor(v));
    gorBlob(blobs, G0);
    hurtDown(P, blobs, v, cam, [A, B, C]);
    MELEE_V.forEach((i, j) => {
      const s = victim(j, v);
      put(P, blobs, s.m, s.y);
      const l = tossLand(VTOSS[j]);
      puff(P, l.land, v - (MELEE_HITS[j] + l.T), i, 0.85, 0.8);
      puff(P, [VSPOT[j][0], 0.9, VSPOT[j][1]], v - MELEE_HITS[j], i + 50, 0.5, 0.35);
      marker(P, [LAND[i].p[0], 0.95, LAND[i].p[2]], cam, v, i, easeOut(ramp(v, MELEE_HITS[j] + l.T + 0.1, MELEE_HITS[j] + l.T + 0.35)));
    });
    for (let i = 0; i < N; i++) {
      if (!RING[i]) continue;
      // keep a lane open between the lens and the fight
      const r = RING[i];
      const da = Math.abs(Math.atan2(Math.sin(r.az - 0.68), Math.cos(r.az - 0.68)));
      if (da < 0.62 && r.rad > 2.4) continue;
      put(P, blobs, ringMan(i, v));
    }
  },
};

// ---------------------------------------------------------------- pile
export const PILE_YAW = 0.55;
export const PC: V3 = [G0[0] + Math.sin(PILE_YAW) * 0.35, 0, G0[2] + Math.cos(PILE_YAW) * 0.35]; // middle of the lying body
const JUMP = (j: number) => S.pile + 0.25 + j * 0.15;
const downK = (v: number) => sm(v, S.pile + 0.7, S.pile + 1.7); // off his feet
const flatK = (v: number) => sm(v, S.pile + 1.6, S.pile + 3.4) * (1 - 0.5 * heaveK(v));
const heaveK = (v: number) => sm(v, HEAVE, HEAVE + 0.45) * (1 - sm(v, SLUMP - 0.1, SLUMP + 0.02));
type Slot = {az: number; r: number; lift: number; pitch: number};
const SLOT: Slot[] = PILE_MEN.map((_, j) => {
  // PILE_OFF (the first three) sit on top, so they are the ones shaken off
  if (j < 3) return {az: j * 2.1 + 0.4, r: 0.3, lift: 1.42, pitch: 1.35};
  if (j < 15) return {az: ((j - 3) / 12) * Math.PI * 2 + 0.2, r: 1.25, lift: 0.52, pitch: 1.05};
  if (j < 25) return {az: ((j - 15) / 10) * Math.PI * 2 + 0.5, r: 0.75, lift: 0.98, pitch: 1.25};
  return {az: ((j - 25) / 5) * Math.PI * 2 + 0.9, r: 0.4, lift: 1.25, pitch: 1.4};
});
// the first three jump last (they end up on top)
const ORDER = PILE_MEN.map((_, j) => (j < 3 ? 27 + j : j - 3));
const OFF_TOSS: Toss[] = PILE_OFF.map((i, j) => {
  const d = dirOf(SLOT[j].az + 0.3);
  return {from: [PC[0] + d[0] * 0.3, 1.5, PC[2] + d[2] * 0.3], vel: [d[0] * 3.4, 3.6, d[2] * 3.4], spin: j % 2 ? 6 : -6, yaw: SLOT[j].az + 2};
});
PILE_OFF.forEach((i, j) => {
  LAND[i] = {p: tossLand(OFF_TOSS[j]).rest, yaw: OFF_TOSS[j].yaw};
});
const pileMan = (j: number, v: number): {m: ManState; y: number} => {
  const i = PILE_MEN[j];
  if (j < 3 && v >= THROWN[j]) {
    const s = tossed(OFF_TOSS[j], v - THROWN[j], i);
    return {m: {root: s.root, pose: s.pose, look: LOOKS[i]}, y: s.y};
  }
  const tj = JUMP(ORDER[j]);
  if (v < tj - 0.35) return {m: ringMan(i, v), y: 0};
  const s = SLOT[j];
  const fk = flatK(v);
  const hv = heaveK(v);
  const rr = s.r * (1 - 0.2 * (1 - fk));
  const lift = s.lift * (0.75 + 0.25 * fk) + (1 - fk) * 0.45 + hv * 0.3 + 0.03 * Math.sin(v * 7 + j);
  const d = dirOf(s.az);
  const at: V3 = [PC[0] + d[0] * rr * 0.85, 0, PC[2] + d[2] * rr * 1.05];
  const yaw = s.az + Math.PI + 0.3 * Math.sin(j * 3.3);
  const k = clamp01((v - (tj - 0.35)) / 0.45);
  if (k < 1) {
    // run-up and leap
    const from = ringP(i);
    const e = smooth(k);
    const p: V3 = [mix(from[0], at[0], e), 0, mix(from[1], at[2], e)];
    const h = mix(0.93, lift, e) + Math.sin(k * Math.PI) * 0.75;
    return {m: {root: {pos: p, yaw: yawTo(from, [PC[0], PC[2]]), pitch: s.pitch * e, pivot: 0.93, lift: h}, pose: mixPose(run(v * 14, 1, i), hug(v, i), e), look: LOOKS[i]}, y: h - 0.93};
  }
  return {m: {root: {pos: at, yaw, pitch: s.pitch + 0.08 * hv * Math.sin(v * 20 + j), pivot: 0.93, lift}, pose: hug(v, i), look: LOOKS[i]}, y: lift * 0.5};
};
const pileGor = (v: number): Gor => {
  const dk = downK(v);
  const fk = flatK(v);
  const hv = heaveK(v);
  const limp = sm(v, SLUMP, SLUMP + 0.25);
  const claw = (1 - limp) * (0.5 + 0.5 * Math.sin(v * 4.2));
  const strain = Math.max(hv, sm(v, S.pile + 0.3, S.pile + 1.2) * (1 - sm(v, S.pile + 3.2, S.pile + 4.2)));
  return {
    root: {pos: G0, yaw: mix(meleeYaw(S.pile), PILE_YAW, sm(v, S.pile - 0.1, S.pile + 0.9)), roll: 0.05 * Math.sin(v * 9) * (1 - fk)},
    up: 0.9 * (1 - dk),
    flat: fk,
    armR: mix3(mix3([0.9, 1.3, 0.6], [0.78, 0.12, 1.2 + 0.25 * claw], dk), [0.7, 0.1, 1.42], limp),
    armL: mix3([-0.9, 1.4, 0.5], [-0.7, 0.1, 0.9], dk),
    footL: [-0.4, 0, -0.75 - 0.2 * fk],
    footR: [0.42, 0, -0.7 - 0.2 * fk],
    jaw: mix(0.25 + 0.6 * strain, 0.2 + 0.12 * Math.sin(v * 6), limp),
    brow: mix(1, 0.2, limp),
    eyes: 0.55 * limp,
    head: [mix(0, 0.5, fk), mix(0.1, -0.12, fk) + 0.1 * limp],
    palm: limp,
    breath: Math.sin(v * 7),
  };
};
const laneBlocked = (i: number, cam: V3, half = 1.2) => {
  // is ring man i standing between the camera and the pile?
  const r = RING[i];
  const dx = PC[0] - cam[0];
  const dz = PC[2] - cam[2];
  const L = Math.hypot(dx, dz);
  const t = ((r.x - cam[0]) * dx + (r.z - cam[2]) * dz) / (L * L);
  if (t < -0.1 || t > 0.9) return false;
  const px = cam[0] + dx * t;
  const pz = cam[2] + dz * t;
  return Math.hypot(r.x - px, r.z - pz) < half;
};
const pileCommon = (v: number, P: Parts, blobs: Blob[], cam: V3, lane: V3, half: number) => {
  drawGorilla(P, pileGor(v));
  gorBlob(blobs, G0, 1.1);
  hurtDown(P, blobs, v, cam, [A, B, C, ...MELEE_V]);
  PILE_MEN.forEach((i, j) => {
    const s = pileMan(j, v);
    put(P, blobs, s.m, s.y);
    if (j < 3) {
      const l = tossLand(OFF_TOSS[j]);
      puff(P, l.land, v - (THROWN[j] + l.T), i, 0.8, 0.8);
      marker(P, [LAND[i].p[0], 0.95, LAND[i].p[2]], cam, v, i, easeOut(ramp(v, THROWN[j] + l.T + 0.1, THROWN[j] + l.T + 0.35)));
    } else puff(P, [s.m.root.pos[0], 0.6, s.m.root.pos[2]], v - JUMP(ORDER[j]) - 0.08, i, 0.4, 0.35);
  });
  // the slump throws a ring of dust
  for (let j = 0; j < 8; j++) {
    const d = dirOf(j * 0.8 + 0.3);
    puff(P, [PC[0] + d[0] * 1.7, 0, PC[2] + d[2] * 1.9], v - SLUMP, 60 + j, 0.5, 0.8, [d[0] * 0.9, 0, d[2] * 0.9]);
  }
  let pressers = 0;
  for (let i = 0; i < N; i++) {
    if (!RING[i] || PILE_MEN.includes(i)) continue;
    if (laneBlocked(i, lane, half)) continue;
    const r = RING[i];
    if (r.rad < 3.9 && pressers < 9) {
      // the nearest ones step in and push down on whatever sticks out
      pressers++;
      const k = sm(v, S.pile + 2.4 + 0.15 * pressers, S.pile + 3.3 + 0.15 * pressers);
      const d = dirOf(r.az);
      const p: [number, number] = [mix(r.x, PC[0] + d[0] * 2.05, k), mix(r.z, PC[2] + d[2] * 2.25, k)];
      put(P, blobs, standing(i, v, p, [PC[0], PC[2]], mixPose(ringMan(i, v).pose, press(v, i, 0.55), k)));
      continue;
    }
    put(P, blobs, ringMan(i, v, 0.6));
  }
};
export const pileScene: GScene = {
  view: (v) => mv(v, S.pile - 0.3, E.pile + 0.3, [6.4, 3.5, 8.6], [4.7, 2.7, 6.7], [0.2, 1.0, 0.6], [0.2, 0.75, 0.6], [44, 40]),
  shakes: [[S.pile + 1.6, 0.5]],
  build: (v, P, blobs) => pileCommon(v, P, blobs, pileScene.view(v).pos, [6.4, 3.5, 8.6], 1.5),
};

// ---------------------------------------------------------------- pinned: one free arm, a last heave
export const pinnedScene: GScene = {
  view: (v) => mv(v, S.pinned - 0.3, E.pinned + 0.3, [3.5, 0.62, 5.0], [2.9, 0.55, 4.5], [0.75, 0.7, 1.3], [0.75, 0.62, 1.3], [42, 38]),
  shakes: [[HEAVE + 0.1, 0.5], [SLUMP, 1.4]],
  build: (v, P, blobs) => pileCommon(v, P, blobs, pinnedScene.view(v).pos, [3.5, 0.62, 5.0], 1.6),
};

// ---------------------------------------------------------------- spent: his face on the ground
const headOf = (g: Gor): V3 => {
  const info = drawGorilla(new Parts(), g);
  const p = new THREE.Vector3(info.head[0], info.head[1], info.head[2]).applyMatrix4(rootMatrix(g.root));
  return [p.x, p.y, p.z];
};
const spentGor = (v: number): Gor => {
  const g = pileGor(Math.max(v, SLUMP + 1));
  const pant = 0.5 + 0.5 * Math.sin(v * 5.6);
  const blink = Math.max(0, Math.sin((v - S.spent) * 1.9 - 0.4)) ** 6;
  return {...g, jaw: 0.14 + 0.2 * pant, breath: pant * 2 - 1, eyes: 0.45 + 0.5 * blink, brow: 0.1, head: [0.55, -0.02]};
};
export const HEAD_DOWN = headOf(spentGor(S.spent));
export const spentScene: GScene = {
  view: (v) => {
    const h = HEAD_DOWN;
    return mv(v, S.spent - 0.3, E.spent + 0.3, [h[0] + 1.25, 0.42, h[2] + 1.9], [h[0] + 0.95, 0.4, h[2] + 1.45], [h[0], h[1] + 0.05, h[2]], [h[0], h[1] + 0.02, h[2]], [36, 32]);
  },
  build: (v, P, blobs) => {
    const cam = spentScene.view(v).pos;
    const g = spentGor(v);
    drawGorilla(P, g);
    gorBlob(blobs, G0, 1.1);
    const inFront = (p: V3 | [number, number, number]) => (p[0] - HEAD_DOWN[0]) * (cam[0] - HEAD_DOWN[0]) + (p[2] - HEAD_DOWN[2]) * (cam[2] - HEAD_DOWN[2]) > -0.25;
    PILE_MEN.forEach((i, j) => {
      if (j < 3) return;
      const s = pileMan(j, v);
      if (inFront(s.m.root.pos)) return;
      put(P, blobs, s.m, s.y);
    });
    // breath: small puffs at the nostrils on each exhale
    const n = Math.floor(((v - S.spent) * 5.6) / (Math.PI * 2));
    for (let j = n - 1; j <= n; j++) {
      const t0 = S.spent + ((j + 0.3) * Math.PI * 2) / 5.6;
      puff(P, [HEAD_DOWN[0] + 0.3, HEAD_DOWN[1] - 0.2, HEAD_DOWN[2] + 0.32], v - t0, 80 + j, 0.1, 0.6, [0.2, 0, 0.2]);
    }
    let pressers = 0;
    for (let i = 0; i < N; i++) {
      if (!RING[i] || PILE_MEN.includes(i)) continue;
      const r = RING[i];
      if (r.rad < 3.9 && pressers < 9) {
        pressers++;
        const d = dirOf(r.az);
        const p: [number, number] = [PC[0] + d[0] * 2.05, PC[2] + d[2] * 2.25];
        // nobody kneels in front of the lens
        if (inFront([p[0], 0, p[1]])) continue;
        put(P, blobs, standing(i, v, p, [PC[0], PC[2]], press(v, i, 0.55)));
        continue;
      }
      if (inFront([r.x, 0, r.z]) && Math.hypot(r.x - cam[0], r.z - cam[2]) < 3.5) continue;
      put(P, blobs, ringMan(i, v, 0.2));
    }
  },
};

// ---------------------------------------------------------------- release: they let go, he walks into the sun
const RG: V3 = SUN_G;
const walkDist = (t: number) => {
  // rises, walks, stops to look back, walks on
  const tl = LOOKBACK - S.release;
  const a = 1.75 * Math.max(0, Math.min(t, tl - 0.25) - 0.9);
  const b = 1.5 * Math.max(0, t - (tl + 0.75));
  return a + b - 0.2 * sm(t, tl - 0.5, tl - 0.1);
};
const releaseGor = (v: number): {g: Gor; pos: V3} => {
  const t = v - S.release;
  const rise = sm(t, 0.15, 0.95);
  const d = walkDist(t);
  const tl = LOOKBACK - S.release;
  const look = sm(t, tl - 0.3, tl + 0.1) * (1 - sm(t, tl + 0.6, tl + 0.9));
  const moving = t > 0.9 && (t < tl - 0.25 || t > tl + 0.75) ? 1 : 0;
  const w = knuckle(d * 3.3, moving);
  const pos: V3 = along2(G0, RG, d);
  const g: Gor = {
    root: {pos, yaw: mix(PILE_YAW, SUN_AZ, sm(t, 0.3, 1.2)) + 0.55 * look},
    up: 0.06,
    flat: 1 - rise,
    ...w,
    head: [1.25 * look, 0.02 + 0.1 * (1 - rise)],
    brow: 0.25,
    jaw: 0.1 + 0.08 * Math.sin(v * 5),
    breath: Math.sin(v * 5),
    eyes: 0.25 * (1 - look),
  };
  return {g, pos};
};
// two banks of men along the corridor of light
const bankSpot = (n: number): [number, number] => {
  const side = n % 2 ? 1 : -1;
  const row = Math.floor(n / 2) % 4;
  const col = Math.floor(n / 8);
  const along = -4.6 + col * 1.0 + 0.4 * hash(n * 3.1);
  const off = side * (1.35 + row * 0.75 + 0.25 * hash(n * 5.3) + Math.max(0, -along - 3) * 0.2);
  return [G0[0] + RG[0] * along + SUN_X[0] * off, G0[2] + RG[2] * along + SUN_X[2] * off];
};
const HEALTHY = Array.from({length: N}, (_, i) => i).filter((i) => !HURT_MEN.includes(i));
export const releaseScene: GScene = {
  view: (v) => {
    const {pos} = releaseGor(v);
    const k = sm(v, S.release - 0.3, E.release + 0.3);
    const cam = along2([G0[0], lerp(1.25, 1.5, k), G0[2]], RG, lerp(-7.6, -6.0, k), SUN_X, lerp(0.5, 0.2, k));
    return {pos: cam, target: [pos[0] * 0.7 + G0[0] * 0.3, 1.05, pos[2] * 0.7 + G0[2] * 0.3], fov: 46, far: 900};
  },
  build: (v, P, blobs) => {
    const {g, pos} = releaseGor(v);
    drawGorilla(P, g);
    gorBlob(blobs, pos);
    const t = v - S.release;
    HEALTHY.forEach((i, n) => {
      const p = bankSpot(n);
      // they back away from him as he gets up
      const side = n % 2 ? 1 : -1;
      const step = 0.5 * sm(t, 0.2 + 0.03 * (n % 8), 1.0 + 0.03 * (n % 8));
      const q: [number, number] = [p[0] + SUN_X[0] * side * step, p[1] + SUN_X[2] * side * step];
      const base = n % 5 === 0 ? tired(v, i) : mixPose(stand(v, i), guard(v, i), 0.5 * (1 - sm(t, 1.5, 3)));
      put(P, blobs, standing(i, v, q, [pos[0], pos[2]], base));
    });
  },
};

// ---------------------------------------------------------------- result: the men, seen from where he left
const RC: V3 = along2(G0, RG, -1.5);
const resultSpot = (n: number): [number, number] => {
  const rad = 1.2 + 6.4 * Math.sqrt((n + 0.5) / HEALTHY.length);
  const az = n * 2.39996 + 0.3;
  return [RC[0] + Math.sin(az) * rad * 0.8 - RG[0] * rad * 0.25, RC[2] + Math.cos(az) * rad * 0.8 - RG[2] * rad * 0.25];
};
// the hurt ones, up front: across the frame, a few metres from the lens
const hurtSpot = (k: number): [number, number] => {
  const row = k % 3;
  const col = Math.floor(k / 3);
  const off = (col - 2) * 1.45 + (row - 1) * 0.5 + 0.3 * hash(k * 2.7);
  const al = 2.6 + row * 1.3 + 0.4 * hash(k * 6.1);
  return [G0[0] + RG[0] * al + SUN_X[0] * off, G0[2] + RG[2] * al + SUN_X[2] * off];
};
export const resultScene: GScene = {
  view: (v) => {
    const k = sm(v, S.result - 0.3, E.result);
    const cam = along2([G0[0], lerp(1.35, 4.4, k), G0[2]], RG, lerp(8.6, 11.5, k), SUN_X, lerp(-0.8, 0.4, k));
    return {pos: cam, target: along2([G0[0], lerp(1.0, 0.7, k), G0[2]], RG, lerp(1.5, 2.5, k)), fov: lerp(44, 40, k), far: 900};
  },
  build: (v, P, blobs) => {
    const cam = resultScene.view(v).pos;
    const sunP: [number, number] = [G0[0] + RG[0] * 30, G0[2] + RG[2] * 30];
    HEALTHY.forEach((i, n) => {
      const p = resultSpot(n);
      const r = hash(i * 8.3);
      const pose = r < 0.3 ? tired(v, i) : r < 0.42 ? cheer(v, i) : r < 0.55 ? {...sitHurt(v, i), eyes: 0, brow: 0, mouth: 0.25, handL: [-0.3, 0.1, -0.3] as V3, handR: [0.3, 0.1, -0.3] as V3, lean: -0.15, bend: 0} : stand(v, i);
      put(P, blobs, standing(i, v, p, sunP, pose));
    });
    HURT_MEN.forEach((i, k) => {
      const p = hurtSpot(k);
      const sit = k % 3 !== 1;
      const yaw = yawTo(p, sunP) + (hash(i * 3.3) - 0.5) * 1.4;
      if (sit) put(P, blobs, {root: {pos: [p[0], 0, p[1]], yaw}, pose: sitHurt(v, i), look: LOOKS[i]});
      else put(P, blobs, {root: {pos: [p[0], 0, p[1]], yaw, pitch: -Math.PI / 2, pivot: 0.93, lift: 0.14}, pose: lying(i, v).pose, look: LOOKS[i]});
      marker(P, [p[0], sit ? 1.45 : 0.95, p[1]], cam, v, i);
    });
  },
};
