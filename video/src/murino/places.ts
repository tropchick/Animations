import {V3, add3} from './cues';

// Each set sits far from the others, so only the one in the shot is mounted and nothing overlaps.
export const EXT: V3 = [0, 0, 0]; // the street and corpus 14
export const LIFT: V3 = [200, 0, 0]; // inside the lift
export const WELL: V3 = [400, 0, 0]; // the spiral stairwell
export const CORR: V3 = [600, 0, 0]; // the long corridor
export const LAND: V3 = [800, 0, 0]; // the landing of floor 430

// ---------------------------------------------------------------- the spiral stairwell
export const WELL_R = 4.3; // inner face of the round wall
export const STAIR_R0 = 2.35; // inner edge of the steps (the open well in the middle)
export const STAIR_R1 = 4.26; // outer edge, 4 cm off the wall
export const FLOOR_H = 3.0; // one turn of the spiral = one floor
export const STEPS_PER_TURN = 18;
export const RISE = FLOOR_H / STEPS_PER_TURN;
export const RUN_R = 3.3; // where people walk on the steps

// a point on the walking line of the spiral: a = angle (rad, increasing upwards), y from the turn count
export const helix = (a: number, r = RUN_R): V3 => add3(WELL, [Math.cos(a) * r, (a / (Math.PI * 2)) * FLOOR_H, -Math.sin(a) * r]);
// the facing of someone climbing (direction of increasing a)
export const climbYaw = (a: number) => Math.atan2(-Math.sin(a), -Math.cos(a));
// step k covers angles [kΔ, (k+1)Δ] and its tread is at k·RISE, so the walking line is never below a tread
export const treadY = (a: number) => Math.floor((a / (Math.PI * 2)) * STEPS_PER_TURN + 1e-6) * RISE;
// floor numbers: the turn that starts at angle 2πn is floor (base + n)
export const WELL_BASE_SCENE = {well: 180, neighbor: 334};

// ---------------------------------------------------------------- corridor (along -z) and landing
export const CORR_LEN = 34;
export const CORR_W = 2.4;
export const CORR_H = 2.7;
export const LONG_AT: V3 = add3(CORR, [0.62, 0, -31.2]);

export const LAND_WALL_Z = -1.9; // front face of the back wall with the two doors
export const DOOR_A_X = -0.95;
export const DOOR_B_X = 0.95;
export const DOOR_W = 0.88;
export const DOOR_H = 2.05;
export const DOUBLE_AT: V3 = add3(LAND, [DOOR_A_X, 0, LAND_WALL_Z - 0.75]);
export const CUSTOMER_AT: V3 = add3(LAND, [0.66, 0, LAND_WALL_Z - 0.4]);
export const COURIER_AT: V3 = add3(LAND, [0.25, 0, -0.35]);
