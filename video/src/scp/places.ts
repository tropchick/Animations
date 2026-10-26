import {RUN_STEPS, V3, add3, shotEnd, shotStart} from './cues';
import {FORT} from './store';

// Where things happen in the store.
export const JUNCTION: V3 = [0, 0, -36]; // the main aisle crosses the first cross aisle
export const LAMP_DISPLAY: V3 = [2.9, 0, 21.6]; // faces the aisle (-x)
export const LAMP_TAG: V3 = [2.59, 1.05, 22.1];
export const PA_BEN: V3 = [-9.36, 0, -59.6]; // Ben on the sofa in the living room at z -60, facing +x
export const SPEAKER_AT: V3 = [-2.6, 4.3, -52]; // on the column at z -52, horn towards -x
export const STAFF_AISLE: V3 = [15.6, 0, -116]; // the rack aisle meets the second cross aisle
export const DN_BEN: V3 = [0.3, 0, -149.2];
export const DN_STAFF: V3 = [-1.3, 0, -150.0];
export const PHONE_FLOOR: V3 = add3(FORT, [-0.22, 0.0045, 0.33]);
export const BEN_FORT: V3 = add3(FORT, [0.2, 0, 0.02]); // sitting, facing -x

// Ben's run from the main aisle into the bedroom: a polyline walked at constant speed, easing out at the end.
const PATH: V3[] = [
  [0.35, 0, -156.2],
  [0.55, 0, -163.5],
  [1.3, 0, -168.4],
  [3.0, 0, -170.9],
  [5.9, 0, -172.3],
];
const SEG = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[2] - PATH[i][2]));
const TOTAL = SEG.reduce((a, b) => a + b, 0);
const at = (d: number): V3 => {
  let x = Math.max(0, Math.min(TOTAL, d));
  for (let i = 0; i < SEG.length; i++) {
    if (x <= SEG[i] || i === SEG.length - 1) {
      const k = Math.min(1, x / SEG[i]);
      const a = PATH[i];
      const b = PATH[i + 1];
      return [a[0] + (b[0] - a[0]) * k, 0, a[2] + (b[2] - a[2]) * k];
    }
    x -= SEG[i];
  }
  return PATH[PATH.length - 1];
};

export const benRun = (v: number) => {
  const t0 = shotStart('run');
  const t1 = shotEnd('run') - 0.3;
  const k = Math.max(0, Math.min(1, (v - t0) / (t1 - t0)));
  // constant speed, the last 15% slowing down
  const e = k < 0.85 ? k / 0.925 : 0.85 / 0.925 + ((1 - (1 - (k - 0.85) / 0.15) ** 2) * 0.15) / 0.925 / 2;
  const d = Math.min(1, e) * TOTAL;
  const p = at(d);
  const q = at(d + 0.4);
  const dir = Math.atan2(q[0] - p[0], q[2] - p[2]);
  const phase = (Math.PI * (v - RUN_STEPS[0])) / 0.29;
  return {p, dir, phase, k};
};
