import React from 'react';
import {Human} from '../bear/People';
import {NightLight, NightSky, Town} from './Town';
import {House, HouseState, Yard} from './House';
import {HOUSE} from './Town';
import type {V3} from './cues';

export {ease, ease5, mv, orbit, follow, aim, yawTo, local, blink, chatter} from '../bear/common';
export type {Scene, View} from '../bear/common';

// the night street with Тихая, 9; lamps: indices of lamp posts that get a real (shadow) spotlight
export const Street: React.FC<{v: number; center: V3; lamps?: number[]; box?: number; house?: HouseState; dawn?: number; k?: number; wind?: number; children?: React.ReactNode; cam: V3}> = ({
  v,
  center,
  lamps = [],
  box = 14,
  house = {},
  dawn = 0,
  k = 1,
  wind = 0,
  children,
  cam,
}) => (
  <>
    <NightSky center={cam} dawn={dawn} />
    <NightLight center={center} box={box} k={k * (1 + dawn * 0.6)} />
    <Town v={v} lampLights={lamps} wind={wind} />
    <House position={HOUSE} s={{v, ...house}} />
    <Yard position={HOUSE} />
    {children}
  </>
);

// a walk between two points with eased start/stop: position, yaw and the walk phase
export const walkTo = (v: number, t0: number, t1: number, a: V3, b: V3, stride = 0.65) => {
  const L = Math.hypot(b[0] - a[0], b[2] - a[2]);
  const T = t1 - t0;
  const x = Math.max(0, Math.min(1, (v - t0) / T));
  // trapezoid speed: ease in/out over 15 % of the time each
  const e = 0.15;
  const vmax = 1 / (1 - e);
  const s = x < e ? (vmax * x * x) / (2 * e) : x > 1 - e ? 1 - (vmax * (1 - x) * (1 - x)) / (2 * e) : vmax * (x - e / 2);
  const d = s * L;
  const p: V3 = [a[0] + ((b[0] - a[0]) * d) / (L || 1), a[1] + (b[1] - a[1]) * s, a[2] + ((b[2] - a[2]) * d) / (L || 1)];
  const yaw = Math.atan2(b[0] - a[0], b[2] - a[2]);
  const moving = v > t0 && v < t1;
  const amp = moving ? Math.min(1, Math.min(x, 1 - x) / e) : 0;
  return {p, yaw, ph: d / stride, amp};
};

export {Human};

import {humanArmTo} from '../bear/rig';
import {local as toWorld} from '../bear/common';
import type {HumanPose, Outfit} from '../bear/People';
// carrying the box in front of the chest: both hands IK'd onto its sides; returns the pose and the box's world spot
export const holdBox = (o: Outfit, pos: V3, yaw: number, p: HumanPose, at: V3 = [0, 0.98, 0.3]): {pose: HumanPose; box: V3} => {
  const s = o.scale ?? 1;
  const c = toWorld(pos, yaw, [at[0] * s, at[1] * s, at[2] * s]);
  const L = toWorld(pos, yaw, [(at[0] - 0.17) * s, at[1] * s, at[2] * s]);
  const R = toWorld(pos, yaw, [(at[0] + 0.17) * s, at[1] * s, at[2] * s]);
  const ar = humanArmTo(o, pos, yaw, p, 1, R);
  const al = humanArmTo(o, pos, yaw, p, -1, L);
  return {pose: {...p, armR: ar.arm, elbowR: ar.elbow, armL: al.arm, elbowL: al.elbow}, box: c};
};
