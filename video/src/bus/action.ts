import {
  BRAKE, DEPART, DOOR_CLOSE, DOOR_OPEN, EXIT_WALK, GLASSES, GLINT, REVEAL, SCARF, STAND, STEP_ASIDE, TUG, TURN, V3, WALK,
  clamp01, lerp, mouth, ramp, smooth,
} from './cues';
import {Face, GRANNY, GUY, Pose, hipHeight} from './Voxel';

// Choreography of «Гляделки»: where everybody is, how they stand and what their faces do at story time v.
// The bus: aisle along z, the front of the bus is +z. The rear platform (raised 0.25 m) ends at z 0.45,
// the middle door is in the right wall (x 1.3) between z 0.6 and 1.6.

export const PLATFORM_Y = 0.25;
export const PLATFORM_EDGE = 0.45;
export const SEAT_Y = 0.55; // top of the rear bench
export const WALL_X = 1.3;
export const DOOR_Z: [number, number] = [0.6, 1.6];
export const KERB_Y = -0.12;

export type Actor = {pos: V3; rot: number; pose: Pose; face: Face};

const PI = Math.PI;
const bell = (v: number, a: number, b: number, fade = 0.2) => clamp01((v - a) / fade) * clamp01((b - v) / fade);

// the bus slows from 8 m/s to a stop at the brake and pulls away at the end
export const busDist = (v: number) => {
  const sp = 8;
  const d1 = BRAKE * sp;
  if (v < BRAKE) return v * sp;
  const stopT = 0.85;
  if (v < BRAKE + stopT) {
    const t = v - BRAKE;
    return d1 + sp * (t - (t * t) / (2 * stopT));
  }
  const d2 = d1 + (sp * stopT) / 2;
  if (v < DEPART) return d2;
  const t = v - DEPART;
  return d2 + 1.6 * t * t;
};
export const STOP_DIST = busDist(BRAKE + 1);

// the lurch everybody feels: forward (+z) while braking, a jolt back when the bus stops
export const lurch = (v: number) => {
  const t = v - BRAKE;
  if (t < 0) return 0;
  const brake = smooth(ramp(t, 0, 0.5)) * (1 - smooth(ramp(t, 0.8, 0.95)));
  const rebound = t > 0.85 ? -Math.exp(-(t - 0.85) * 4.5) * Math.sin((t - 0.85) * 11) * 0.9 : 0;
  const pull = v > DEPART ? -smooth(ramp(v, DEPART, DEPART + 0.5)) * 0.5 : 0;
  return brake + rebound + pull;
};

// floor height under a point of the bus (platform, aisle, kerb outside the door)
export const floorY = (x: number, z: number) => {
  if (x > WALL_X + 0.05) return KERB_Y + 0.0 * smooth(ramp(x, WALL_X + 0.05, WALL_X + 0.2));
  if (z < PLATFORM_EDGE) return PLATFORM_Y;
  return 0;
};

// walking: legs and arms swing with the distance covered
const walkPose = (phase: number, amount: number, base: Pose = {}): Pose => {
  const s = Math.sin(phase) * amount;
  const c = Math.cos(phase);
  return {
    ...base,
    hipL: s * 0.5,
    hipR: -s * 0.5,
    kneeL: Math.max(0, -c) * 0.6 * amount,
    kneeR: Math.max(0, c) * 0.6 * amount,
    armL: base.armL ?? [-s * 0.4, 0.06],
    armR: base.armR ?? [s * 0.4, 0.06],
  };
};

// a path through points; returns position, heading and the distance walked
type P2 = [number, number];
const pathAt = (pts: P2[], s: number) => {
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    if (s <= acc + len || i === pts.length - 2) {
      const k = clamp01((s - acc) / len);
      return {x: lerp(ax, bx, k), z: lerp(az, bz, k), yaw: Math.atan2(bx - ax, bz - az)};
    }
    acc += len;
  }
  return {x: pts[0][0], z: pts[0][1], yaw: 0};
};

// heading that turns smoothly towards a target angle
const blendYaw = (a: number, b: number, k: number) => {
  let d = b - a;
  while (d > PI) d -= 2 * PI;
  while (d < -PI) d += 2 * PI;
  return a + d * k;
};

// ---------------------------------------------------------------- the grandma
const GRANNY_HIP = hipHeight(GRANNY);
const GRANNY_SEAT_ROOT = SEAT_Y + 0.1 - GRANNY_HIP; // root height so the thighs rest on the bench
export const GRANNY_SEAT: P2 = [0, -0.3];
const GRANNY_PATH: P2[] = [GRANNY_SEAT, [0.05, 0.62], [0.95, 1.05], [1.6, 1.05], [2.0, 1.4], [2.05, 3.0], [2.0, 7.0]];
const GRANNY_SPEED = 1.25;

export const granny = (v: number): Actor => {
  const look = smooth(ramp(v, 10.75, 11.1)); // looks up from the knitting into his eyes
  const scarf = bell(v, SCARF, SCARF + 0.85, 0.25);
  const glasses = bell(v, GLASSES, GLASSES + 0.55, 0.18);
  const speak = mouth('granny', v);
  const stand = smooth(ramp(v, STAND, STAND + 0.45));
  const walking = v > EXIT_WALK[0];
  const s = Math.max(0, v - EXIT_WALK[0]) * GRANNY_SPEED;
  const knitting = v < STAND;
  const L = lurch(v);

  // seated, hands on the knitting in her lap
  const seated: Pose = {
    hipL: PI / 2,
    hipR: PI / 2,
    kneeL: PI / 2 - 0.1,
    kneeR: PI / 2 - 0.1,
    lean: -0.06 + 0.06 * L,
    armL: [0.55, 0.02],
    armR: [0.55, 0.02],
    elbowL: 0.9,
    elbowR: 0.9,
    head: [lerp(0.32, -0.08, look), 0, lerp(0, 0.05, look)],
  };
  // her right hand goes up to the knot of the headscarf, later to the bridge of her glasses
  if (scarf > 0) {
    seated.armR = [lerp(0.55, 1.45, scarf), lerp(0.02, -0.42, scarf)];
    seated.elbowR = lerp(0.9, 1.75, scarf);
    seated.head = [seated.head![0] - 0.06 * scarf, 0.08 * scarf, seated.head![2] + 0.06 * scarf];
  }
  if (glasses > 0) {
    seated.armR = [lerp(0.55, 1.72, glasses), lerp(0.02, -0.5, glasses)];
    seated.elbowR = lerp(0.9, 2.05, glasses);
  }
  let pose: Pose = seated;
  let pos: V3 = [GRANNY_SEAT[0], GRANNY_SEAT_ROOT, GRANNY_SEAT[1]];
  let rot = 0;
  if (stand > 0) {
    const st: Pose = {hipL: 0, hipR: 0, kneeL: 0, kneeR: 0, lean: 0.12, armL: [0.25, 0.06], armR: [0.5, 0.1], elbowL: 0.4, elbowR: 0.6, head: [0.0, 0.1, 0]};
    pose = {
      hipL: lerp(seated.hipL!, st.hipL!, stand),
      hipR: lerp(seated.hipR!, st.hipR!, stand),
      kneeL: lerp(seated.kneeL!, 0, stand),
      kneeR: lerp(seated.kneeR!, 0, stand),
      lean: lerp(seated.lean!, st.lean!, stand) + 0.35 * Math.sin(stand * PI),
      armL: [lerp(0.55, 0.25, stand), 0.06],
      armR: [lerp(0.55, 0.5, stand), 0.1],
      elbowL: lerp(0.9, 0.4, stand),
      elbowR: lerp(0.9, 0.6, stand),
      head: [lerp(seated.head![0], 0, stand), 0.1 * stand, 0],
    };
    pos = [GRANNY_SEAT[0], lerp(GRANNY_SEAT_ROOT, PLATFORM_Y, stand), GRANNY_SEAT[1] + 0.12 * stand];
  }
  if (walking) {
    const p = pathAt(GRANNY_PATH, s);
    const k = smooth(ramp(v, EXIT_WALK[0], EXIT_WALK[0] + 0.5));
    rot = blendYaw(0, p.yaw, smooth(ramp(v, EXIT_WALK[0], EXIT_WALK[0] + 0.6)));
    const y = stepY(p.x, p.z);
    pos = [p.x, y, lerp(GRANNY_SEAT[1] + 0.12, p.z, k)];
    if (s < 0.01) pos = [GRANNY_SEAT[0], PLATFORM_Y, GRANNY_SEAT[1] + 0.12];
    // her left arm hooked into his
    pose = walkPose(s / 0.28, 0.55 * k, {lean: 0.1, head: [0.05, 0.25, 0], armL: [0.45, 0.25], elbowL: 1.1});
  }
  const face: Face = {
    gaze: v < 10.75 ? [0, -0.6] : [lerp(0, 0.1, look), lerp(-0.6, 0.15, look)],
    smile: knitting ? (v < REVEAL + 0.6 ? 0.35 : v < 17.0 ? 0.55 : 0.9) : 0.9,
    blush: v > 13.9 ? smooth(ramp(v, 14.6, 15.6)) * 0.85 : 0.25 * look,
    open: speak * 0.8,
    brows: v > 14.6 && v < 17.2 ? 0.6 : 0.15,
    shut: blink(v, [9.15, 12.8, 16.4, 19.3, 22.4]),
  };
  return {pos, rot, pose, face};
};
export const grannyGlint = (v: number) => (v >= GLINT && v < GLINT + 0.55 ? (v - GLINT) / 0.55 : v >= 18.0 && v < 18.45 ? (v - 18.0) / 0.45 : -1);
export const grannyKnitting = (v: number) => v < STAND + 0.1;

// a step up or down at the platform edge and the kerb, eased over a few centimetres of path
const stepY = (x: number, z: number) => {
  if (x > WALL_X - 0.05) return lerp(0, KERB_Y, smooth(ramp(x, WALL_X - 0.05, WALL_X + 0.25)));
  return lerp(PLATFORM_Y, 0, smooth(ramp(z, PLATFORM_EDGE - 0.12, PLATFORM_EDGE + 0.12)));
};

// blinks: eyes shut for 0.12 s at the given times
const blink = (v: number, at: number[]) => (at.some((a) => v >= a && v < a + 0.12) ? 1 : 0);

// ---------------------------------------------------------------- the guy
export const GUY_START: P2 = [0, 3.2];
const GUY_STOP: P2 = [0, 0.95];
const GUY_PATH: P2[] = [GUY_STOP, [0.9, 1.3], [1.55, 1.3], [2.3, 1.75], [2.35, 3.4], [2.3, 7.5]];

export const guy = (v: number): Actor => {
  const L = lurch(v);
  const leaveRail = smooth(ramp(v, WALK[0] - 0.35, WALK[0] + 0.05));
  const w = smooth(ramp(v, WALK[0], WALK[1]));
  const tug = bell(v, TUG, TUG + 0.45, 0.12);
  const smitten = smooth(ramp(v, 11.45, 11.9));
  const speak = mouth('guy', v);
  let pos: V3 = [GUY_START[0], 0, lerp(GUY_START[1], GUY_STOP[1], w)];
  let rot = PI;
  // standing, his right hand (world +x) up on the rail
  let pose: Pose = {
    armR: [lerp(PI - 0.12, 0.05, leaveRail), lerp(0.16, 0.06, leaveRail)],
    elbowR: lerp(0.25, 0.08, leaveRail),
    armL: [0.04, 0.05],
    lean: -0.07 * L,
    head: [0.04, 0, 0],
  };
  if (v > WALK[0] && v < WALK[1] + 0.25) {
    const dist = (GUY_START[1] - GUY_STOP[1]) * w;
    const amount = bell(v, WALK[0], WALK[1] + 0.2, 0.2);
    pose = walkPose(dist / 0.3, amount, {lean: 0.06 * amount, head: [0.04, 0, 0]});
  }
  if (tug > 0) {
    pose = {...pose, armL: [0.3 * tug, -0.15 * tug], armR: [0.3 * tug, -0.15 * tug], elbowL: 0.7 * tug, elbowR: 0.7 * tug, lean: -0.04 * tug, head: [-0.06 * tug, 0, 0]};
  }
  if (v > 13.9 && v < STAND) {
    // asking: a slight tilt of the head, hands relaxed
    pose = {...pose, head: [0.12, 0, 0.07], armL: [0.06, 0.04], armR: [0.06, 0.04], lean: 0.03};
  }
  if (v >= DOOR_OPEN - 0.05) {
    // picks up her bag, offers his arm, leads her out
    const k = smooth(ramp(v, DOOR_OPEN - 0.05, DOOR_OPEN + 0.4));
    rot = blendYaw(PI, PI / 2 + 0.6, k);
    pose = {armL: [0.15, 0.05], armR: [lerp(0.06, 0.55, k), lerp(0.04, -0.25, k)], elbowR: 1.0 * k, head: [0.1, -0.5 * k, 0], lean: 0};
    const start = EXIT_WALK[0] + 0.25;
    if (v > start) {
      const s = (v - start) * GRANNY_SPEED;
      const p = pathAt(GUY_PATH, s);
      rot = blendYaw(PI / 2 + 0.6, p.yaw, smooth(ramp(v, start, start + 0.4)));
      pos = [p.x, stepY(p.x, p.z), p.z];
      const amount = smooth(ramp(v, start, start + 0.3));
      pose = walkPose(s / 0.28, amount, {armL: [0.12, 0.05], armR: [0.55, -0.25], elbowR: 1.0, head: [0.05, -0.35, 0]});
    }
  }
  const face: Face = {
    gaze: [0, v < 11.2 ? -0.15 : 0],
    wide: v < 11.2 ? 0.6 : 0.3,
    brows: v < 6.0 ? 0.1 : v < 11.2 ? 0.2 : 0.55 * smitten,
    sparkle: v < 11.2 ? 0 : smitten,
    smile: v < 11.2 ? 0 : v < 17.0 ? 0.45 * smitten : v < 20.0 ? 0.45 : 0.85,
    blush: v < 11.2 ? 0 : 0.45 * smitten,
    open: speak * 0.75,
    shut: blink(v, [1.6, 12.1, 18.9, 21.5]),
  };
  return {pos, rot, pose, face};
};
export const guyHasBag = (v: number) => v >= DOOR_OPEN - 0.05;

// ---------------------------------------------------------------- the girl
export const GIRL_START: P2 = [0, 1.75];
const GIRL_ASIDE: P2 = [-0.62, 1.75];

export const girl = (v: number): Actor => {
  const L = lurch(v);
  const notice = smooth(ramp(v, 3.25, 3.6));
  const shy = smooth(ramp(v, 3.95, 4.3));
  const tuck = bell(v, 4.3, 5.2, 0.28);
  const aside = smooth(ramp(v, STEP_ASIDE, STEP_ASIDE + 0.7));
  const turn = smooth(ramp(v, TURN, TURN + 0.45));
  const watch = smooth(ramp(v, 12.4, 12.9));
  const toDoor = smooth(ramp(v, DOOR_OPEN + 0.6, DOOR_OPEN + 1.4));
  const pos: V3 = [lerp(GIRL_START[0], GIRL_ASIDE[0], aside), 0, lerp(GIRL_START[1], GIRL_ASIDE[1], aside)];
  let rot = lerp(0, 0.25, aside);
  rot = blendYaw(rot, 1.85, turn);
  rot = blendYaw(rot, 2.1, watch);
  rot = blendYaw(rot, 1.62, toDoor);
  const headYaw = lerp(0, 1.0, turn) - 0.5 * watch - 0.45 * toDoor;
  const stepping = bell(v, STEP_ASIDE, STEP_ASIDE + 0.75, 0.12);
  let pose: Pose = {
    lean: 0.09 * L,
    armL: [0.12, 0.05],
    armR: [0.12, 0.05],
    elbowL: 0.35,
    elbowR: 0.35,
    head: [lerp(-0.02, 0.2, shy * (1 - smooth(ramp(v, 5.6, 6.0)))) + 0.08 * L, headYaw, 0.1 * shy * (1 - aside)],
  };
  if (tuck > 0) {
    pose.armR = [lerp(0.12, 1.55, tuck), lerp(0.05, 0.55, tuck)];
    pose.elbowR = lerp(0.35, 2.15, tuck);
  }
  if (stepping > 0) {
    const ph = ramp(v, STEP_ASIDE, STEP_ASIDE + 0.7) * 2 * PI;
    pose = {...pose, hipL: Math.sin(ph) * 0.35 * stepping, hipR: -Math.sin(ph) * 0.35 * stepping, kneeL: Math.max(0, Math.sin(ph)) * 0.4 * stepping, kneeR: Math.max(0, -Math.sin(ph)) * 0.4 * stepping};
  }
  // shock: hands come up a little at «Выхожу, милок»
  const shock = smooth(ramp(v, 18.0, 18.4));
  if (shock > 0) {
    pose.armL = [0.12 + 0.35 * shock, 0.05];
    pose.armR = [0.12 + 0.35 * shock, 0.05];
    pose.elbowL = 0.35 + 0.9 * shock;
    pose.elbowR = 0.35 + 0.9 * shock;
  }
  const face: Face = {
    gaze: v < 3.25 ? [0, 0] : v < 6.0 ? [0, lerp(0.2, -0.8, shy)] : v < TURN ? [0, 0] : [0.3 * turn, 0],
    blush: v < 6.3 ? 0.9 * notice : lerp(0.9, 0, smooth(ramp(v, 8.2, 9.0))),
    smile: v < 6.0 ? 0.6 * shy : 0,
    brows: v < 8.0 ? 0 : 0.8,
    wide: v < 8.0 ? 0 : 0.7,
    open: v < 8.2 ? 0 : v < 18.0 ? 0.25 : 0.25 + 0.6 * shock,
    shut: blink(v, [2.2, 7.3, 16.0]),
  };
  return {pos, rot, pose, face};
};

// ---------------------------------------------------------------- the door: 0 closed .. 1 open
export const doorOpen = (v: number) => smooth(ramp(v, DOOR_OPEN + 0.1, DOOR_OPEN + 0.8)) * (1 - smooth(ramp(v, DOOR_CLOSE + 0.1, DOOR_CLOSE + 0.75)));
export {GUY};
