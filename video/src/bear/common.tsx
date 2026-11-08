import React from 'react';
import type {View} from '../slime/camera';
import {V3, lerp, lerp3, ramp, smooth} from './cues';

export type {View};
// probe: named world points, for tools/bear-probe.mjs (where things land on screen)
export type Scene = {view: (v: number) => View; render: (v: number) => React.ReactNode; shakes?: [number, number][]; noHandheld?: boolean; probe?: (v: number) => Record<string, V3>};

export const ease = (v: number, a: number, b: number) => smooth(ramp(v, a, b));
// eased in-out with a softer start/stop (quintic)
export const ease5 = (v: number, a: number, b: number) => {
  const x = ramp(v, a, b);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

// a camera move: position and target eased between two key views, with an optional arc (sideways bulge)
export const mv = (v: number, t0: number, t1: number, a: V3, b: V3, ta: V3, tb: V3, fov: number | [number, number], arc = 0, far = 900): View => {
  const k = ease5(v, t0, t1);
  const p = lerp3(a, b, k);
  if (arc) {
    // bulge perpendicular to the move, in the ground plane
    const dx = b[0] - a[0];
    const dz = b[2] - a[2];
    const l = Math.hypot(dx, dz) || 1;
    const bump = Math.sin(k * Math.PI) * arc;
    p[0] += (-dz / l) * bump;
    p[2] += (dx / l) * bump;
  }
  return {pos: p, target: lerp3(ta, tb, k), fov: typeof fov === 'number' ? fov : lerp(fov[0], fov[1], k), far};
};

// orbit around a point: angle from a0 to a1 (rad, 0 = +z), radius, height
export const orbit = (v: number, t0: number, t1: number, c: V3, r: [number, number], h: [number, number], a0: number, a1: number, target: V3, fov: number | [number, number]): View => {
  const k = ease5(v, t0, t1);
  const a = lerp(a0, a1, k);
  const rr = lerp(r[0], r[1], k);
  return {pos: [c[0] + Math.sin(a) * rr, lerp(h[0], h[1], k), c[2] + Math.cos(a) * rr], target, fov: typeof fov === 'number' ? fov : lerp(fov[0], fov[1], k), far: 900};
};

export const yawTo = (from: V3, to: V3) => Math.atan2(to[0] - from[0], to[2] - from[2]);

// point in a character's space (yaw about y) to world
export const local = (base: V3, yaw: number, p: V3): V3 => [base[0] + p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw), base[1] + p[1], base[2] - p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw)];

// talking mouth from time (narration-free chatter)
export const chatter = (v: number, k = 1) => k * (0.25 + 0.35 * Math.abs(Math.sin(v * 9.3)) * (0.6 + 0.4 * Math.sin(v * 3.1)));

// a blink every few seconds
export const blink = (v: number, seed = 0) => {
  const p = (v + seed * 1.37) % 3.7;
  return p < 0.12 ? Math.sin((p / 0.12) * Math.PI) : 0;
};

// a look-at target that puts the world point p at screen pixel (sx, sy) of the 1080x1920 frame
// (instead of at the centre): keeps faces clear of the stickers at the top and the captions at the bottom
export const aim = (pos: V3, p: V3, fov: number, sy = 640, sx = 540): V3 => {
  const d: V3 = [p[0] - pos[0], p[1] - pos[1], p[2] - pos[2]];
  const L = Math.hypot(d[0], d[1], d[2]) || 1;
  const u: V3 = [d[0] / L, d[1] / L, d[2] / L];
  // right = u x worldUp, up = right x u
  let r: V3 = [-u[2], 0, u[0]];
  const rl = Math.hypot(r[0], r[2]) || 1;
  r = [r[0] / rl, 0, r[2] / rl];
  const up: V3 = [r[1] * u[2] - r[2] * u[1], r[2] * u[0] - r[0] * u[2], r[0] * u[1] - r[1] * u[0]];
  const t = Math.tan((fov * Math.PI) / 360);
  const ty = ((960 - sy) / 960) * t;
  const tx = ((sx - 540) / 960) * t;
  return [p[0] - (up[0] * ty + r[0] * tx) * L, p[1] - (up[1] * ty + r[1] * tx) * L, p[2] - (up[2] * ty + r[2] * tx) * L];
};

// a camera that eases between two positions and keeps a (moving) point at a fixed spot on screen
export const follow = (v: number, t0: number, t1: number, a: V3, b: V3, p: V3, fov: number | [number, number], sy = 640, sx = 540, arc = 0, far = 900): View => {
  const m = mv(v, t0, t1, a, b, p, p, fov, arc, far);
  return {...m, target: aim(m.pos, p, m.fov, sy, sx)};
};
