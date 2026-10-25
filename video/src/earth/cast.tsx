import React from 'react';
import {random} from 'remotion';
import {Box, Cyl, Ico} from '../scene/parts';
import {Dog, Person, PersonPose} from '../scene/Characters';
import {Rope} from '../gravity/props';
import {METRO} from './city';
import {V3, clamp01, lerp, pushG, ramp, windKmh} from './time';

// ---------- Paths ----------
// A path is a list of [video second, x, z]. Between keys people move in straight lines;
// the walk/run cycle follows the distance covered, so feet never slide.

type Key = [number, number, number];

const STAIR_TOP: [number, number] = [METRO[0], METRO[2] + 1.9];
const STAIR_BOTTOM: [number, number] = [METRO[0], METRO[2] - 1.7];

const sample = (path: Key[], v: number) => {
  if (v <= path[0][0]) return {x: path[0][1], z: path[0][2], vx: 0, vz: 0, i: 0};
  for (let i = 1; i < path.length; i++) {
    const [t1, x1, z1] = path[i];
    if (v <= t1) {
      const [t0, x0, z0] = path[i - 1];
      const k = (v - t0) / (t1 - t0);
      return {x: lerp(x0, x1, k), z: lerp(z0, z1, k), vx: (x1 - x0) / (t1 - t0), vz: (z1 - z0) / (t1 - t0), i};
    }
  }
  const l = path[path.length - 1];
  return {x: l[1], z: l[2], vx: 0, vz: 0, i: path.length};
};

// Distance walked up to time v (for the step cycle).
const walked = (path: Key[], v: number) => {
  let d = 0;
  for (let i = 1; i < path.length; i++) {
    const [t0, x0, z0] = path[i - 1];
    const [t1, x1, z1] = path[i];
    const seg = Math.hypot(x1 - x0, z1 - z0);
    if (v >= t1) d += seg;
    else {
      if (v > t0) d += seg * ((v - t0) / (t1 - t0));
      break;
    }
  }
  return d;
};

// Height on the metro stairs: walking north from the top step goes down about 3 m.
const stairY = (x: number, z: number) => {
  if (Math.abs(x - METRO[0]) > 1.4) return 0;
  const k = clamp01((STAIR_TOP[1] - z) / (STAIR_TOP[1] - STAIR_BOTTOM[1]));
  return -3.1 * k;
};

const sidewalkY = (z: number) => (Math.abs(z) > 7 ? 0.16 : 0.02);

type Body = {p: V3; yaw: number; pose: PersonPose; lean: number; hidden: boolean};

const bodyOn = (path: Key[], v: number, stride = 1.0, seed = 0, lookUp = 0): Body => {
  const s = sample(path, v);
  const speed = Math.hypot(s.vx, s.vz);
  const dist = walked(path, v);
  const phase = (dist / stride) * Math.PI;
  const run = clamp01((speed - 1.8) / 3);
  const amp = speed > 0.05 ? lerp(0.38, 0.75, run) : 0;
  const yaw = speed > 0.05 ? Math.atan2(s.vx, s.vz) : NaN;
  const y = (s.z < STAIR_TOP[1] + 0.2 && Math.abs(s.x - METRO[0]) < 1.4 ? stairY(s.x, s.z) : 0) + sidewalkY(s.z);
  // they brace against the push (lean west) while standing; a stumble when it first bites
  const brace = speed < 0.05 ? 0.28 * clamp01(pushG(v) / 0.4) : 0.1 * clamp01(pushG(v) / 0.4);
  const stumble = 0.18 * Math.sin(Math.PI * clamp01((v - 13.2 - seed * 0.4) / 0.9));
  const bob = speed > 0.05 ? Math.abs(Math.sin(phase)) * 0.06 * (1 + run) : 0;
  return {
    p: [s.x, y + bob, s.z],
    yaw,
    lean: brace - stumble,
    hidden: y < -2.4,
    pose: {
      legL: Math.sin(phase) * amp,
      legR: -Math.sin(phase) * amp,
      armL: [-Math.sin(phase) * amp * 0.9 + (speed > 0.05 ? 0 : 0.1 * brace), 0.12],
      armR: [Math.sin(phase) * amp * 0.9, -0.12],
      elbowL: 0.3 + run * 0.9,
      elbowR: 0.3 + run * 0.9,
      head: [lookUp, 0],
      eyes: 1 + 0.5 * clamp01((windKmh(v) - 20) / 40),
      mouth: run * 0.5,
    },
  };
};

// ---------- Who is where ----------

// The courier waits at the crosswalk on a scooter, then grabs the girl and runs for the metro.
const COURIER: Key[] = [
  [0, -7.5, 8.0],
  [17.4, -7.5, 8.0],
  [18.9, -4.2, 9.0],
  [19.25, -4.0, 9.1],
  [20.4, 1.5, 6.4],
  [22.4, 17.5, -4.5],
  [23.2, STAIR_TOP[0], STAIR_TOP[1]],
  [24.6, STAIR_BOTTOM[0], STAIR_BOTTOM[1]],
];
const GIRL_WAIT: Key[] = [
  [0, -3.6, 9.4],
  [6, -3.6, 9.4],
  [7.5, -3.9, 9.3],
];
const MOM: Key[] = [
  [0, -2.9, 9.7],
  [6, -2.9, 9.7],
  [7.5, -3.3, 9.6],
  [19.0, -3.3, 9.6],
  [20.6, 2.8, 6.9],
  [22.6, 18.4, -4.0],
  [23.45, STAIR_TOP[0] - 0.5, STAIR_TOP[1]],
  [24.9, STAIR_BOTTOM[0] - 0.5, STAIR_BOTTOM[1]],
];
const DOG_WOMAN: Key[] = [
  [0, 6, 9.0],
  [8, 1.6, 9.0],
  [18.6, 1.6, 9.0],
  [20.0, 6.2, 6.6],
  [22.0, 19.5, -4.6],
  [22.9, STAIR_TOP[0] + 0.5, STAIR_TOP[1]],
  [24.3, STAIR_BOTTOM[0] + 0.5, STAIR_BOTTOM[1]],
];


const SHIRTS = ['#4f86c6', '#e2725b', '#7cb46b', '#9b6fb5', '#ffffff', '#3d4a5c', '#46a6a0', '#c94a3a'];
const PANTS = ['#2f3a4f', '#5c6fa8', '#3b3b3b', '#7a6a58', '#9ec0e6'];
const HAIR = ['#2a2220', '#5a3a22', '#8a5a34', '#c99b52', '#1f1a17'];
const SKIN = ['#efd2b3', '#e0b48f', '#c68e63', '#8d5a3b', '#f3dcc4'];

// Pedestrians: stroll along the sidewalks, then run east for the metro one after another.
const WALKERS = [
  {x0: -26, z: 9.6, dir: 1, go: 18.2},
  {x0: -20, z: 10.8, dir: 1, go: 18.6},
  {x0: 14, z: 10.6, dir: -1, go: 19.0},
  {x0: 26, z: 9.5, dir: -1, go: 19.4},
  {x0: -16, z: -9.0, dir: 1, go: 18.4},
  {x0: 2, z: -10.6, dir: -1, go: 19.8},
  {x0: 34, z: -9.4, dir: -1, go: 20.2},
].map((w, i) => {
  const xGo = w.x0 + w.dir * 1.1 * w.go * 0.6;
  const cross = w.z > 0;
  const path: Key[] = [
    [0, w.x0, w.z],
    [w.go * 0.6, xGo, w.z],
    [w.go, xGo, w.z],
  ];
  const dist = Math.hypot(STAIR_TOP[0] - xGo, STAIR_TOP[1] - w.z);
  const tRun = dist / 7;
  if (cross) path.push([w.go + tRun * 0.35, lerp(xGo, STAIR_TOP[0], 0.35), 4]);
  path.push([w.go + tRun, STAIR_TOP[0] + (random(`wk-o-${i}`) - 0.5), STAIR_TOP[1]]);
  path.push([w.go + tRun + 1.4, STAIR_BOTTOM[0], STAIR_BOTTOM[1]]);
  return {
    path,
    shirt: SHIRTS[i % SHIRTS.length],
    pants: PANTS[i % PANTS.length],
    hair: HAIR[(i * 3) % HAIR.length],
    skin: SKIN[(i * 2) % SKIN.length],
    longHair: i % 3 === 1,
  };
});

// Her raised right hand while she waits (scale 0.62, facing yaw -0.4).
export const RELEASE_HAND: V3 = (() => {
  const s = 0.62;
  const yaw = -0.4;
  const [gx, , gz] = [GIRL_WAIT[2][1], 0, GIRL_WAIT[2][2]];
  return [gx + Math.cos(yaw) * 0.33 * s + Math.sin(yaw) * 0.45 * s, 0.16 + 1.55 * s + 0.25, gz - Math.sin(yaw) * 0.33 * s + Math.cos(yaw) * 0.45 * s];
})();

export const courierAt = (v: number) => bodyOn(COURIER, v, 1.1, 0);
export const girlSpot = (): V3 => [GIRL_WAIT[2][1], 0.16, GIRL_WAIT[2][2]];
export const DOG_WOMAN_PATH = DOG_WOMAN;

// ---------- Props ----------

const Scooter: React.FC = () => (
  <group>
    <Box size={[0.16, 0.05, 0.9]} position={[0, 0.12, 0]} color="#2f3540" />
    <Cyl rTop={0.025} rBottom={0.025} height={1.05} segments={6} position={[0, 0.62, 0.42]} rotation={[-0.12, 0, 0]} color="#3a3f47" />
    <Box size={[0.5, 0.04, 0.04]} position={[0, 1.13, 0.48]} color="#2a2c30" />
    {[-0.38, 0.4].map((z) => (
      <Cyl key={z} rTop={0.09} rBottom={0.09} height={0.05} segments={10} position={[0, 0.09, z]} rotation={[0, 0, Math.PI / 2]} color="#1e1f22" />
    ))}
  </group>
);

const Backpack: React.FC = () => (
  <group position={[0, 1.25, -0.25]}>
    <Box size={[0.5, 0.5, 0.42]} color="#f2c230" />
    <Box size={[0.52, 0.06, 0.44]} position={[0, 0.22, 0]} color="#2a2c30" />
  </group>
);

const Cap: React.FC = () => (
  <group>
    <Box size={[0.33, 0.1, 0.33]} position={[0, 0.38, 0]} color="#2a2c30" />
    <Box size={[0.3, 0.03, 0.16]} position={[0, 0.34, 0.2]} color="#2a2c30" />
  </group>
);

// The red balloon: leans with the wind, torn out of her hand at ~17.6 s.
export const BALLOON_GONE = 17.6;
export const balloonAt = (v: number, hand: V3): {p: V3; lean: number} => {
  const w = windKmh(v);
  const lean = -Math.min(1.25, 0.12 * Math.sin(v * 1.3) * 0.2 + (w / 45) * 1.2);
  const d = Math.max(0, v - BALLOON_GONE);
  return {
    p: [hand[0] + 0.5 * 7 * d * d + Math.sin(-lean) * 1.1, hand[1] + Math.cos(lean) * 1.1 + 2.2 * d, hand[2] - 0.3 * d],
    lean,
  };
};

const Balloon: React.FC<{v: number; hand: V3}> = ({v, hand}) => {
  const {p, lean} = balloonAt(v, hand);
  const free = v >= BALLOON_GONE;
  if (v > BALLOON_GONE + 6) return null;
  return (
    <>
      <Ico radius={0.3} detail={1} position={p} scale={[1, 1.15, 1]} rotation={[0, 0, lean * 0.4]} color="#e23b3b" />
      {free ? (
        <Box size={[0.012, 1.0, 0.012]} position={[p[0] - 0.1, p[1] - 0.8, p[2]]} rotation={[0, 0, -0.5]} color="#f2f2f2" shadow={false} />
      ) : (
        <Rope from={hand} to={[p[0], p[1] - 0.32, p[2]]} color="#f2f2f2" />
      )}
    </>
  );
};

// ---------- Rendering ----------

const HumanAt: React.FC<{b: Body; shirt: string; pants: string; hair: string; skin: string; longHair?: boolean; child?: boolean; extra?: Partial<React.ComponentProps<typeof Person>>; yawFallback: number}> = ({
  b,
  shirt,
  pants,
  hair,
  skin,
  longHair,
  child,
  extra,
  yawFallback,
}) => {
  if (b.hidden) return null;
  const yaw = Number.isNaN(b.yaw) ? yawFallback : b.yaw;
  return (
    <group position={b.p} rotation={[0, 0, b.lean]}>
      <Person position={[0, 0, 0]} rotation={yaw} shirt={shirt} pants={pants} hair={hair} skin={skin} longHair={longHair} child={child} scale={child ? 0.62 : 1} pose={b.pose} {...extra} />
    </group>
  );
};

export const Cast: React.FC<{v: number}> = ({v}) => {
  const items: React.ReactNode[] = [];

  // courier, scooter, girl
  const c = courierAt(v);
  const onScooter = v < 17.4;
  const carrying = v >= 19.25;
  const cy = Number.isNaN(c.yaw) ? Math.PI : c.yaw;
  if (onScooter) {
    c.pose = {...c.pose, legL: 0, legR: 0.05, armL: [0.55, 0.12], armR: [0.55, -0.12], elbowL: 0.35, elbowR: 0.35};
  }
  if (carrying) {
    c.pose = {...c.pose, armL: [0.9, 0.1], armR: [0.9, -0.1], elbowL: 1.3, elbowR: 1.3};
  }
  items.push(
    <HumanAt
      key="courier"
      b={c}
      shirt="#f2c230"
      pants="#2f3a4f"
      hair="#2a2220"
      skin="#e0b48f"
      yawFallback={Math.PI}
      extra={{headExtra: <Cap />, bodyExtra: <Backpack />}}
    />,
  );
  // the scooter stays where he dropped it until the wind takes it
  {
    const d = Math.max(0, v - 21.5);
    const sx = -7.5 + (v >= 17.4 ? 0.5 * 9 * d * d : 0);
    const fallen = v >= 17.6 ? 1.45 * ramp(v, 17.4, 17.9, (t) => t * t) : 0;
    if (sx < 200 && v < 40) {
      items.push(
        <group key="scooter" position={[sx, 0.02 + (d > 0 ? Math.abs(Math.sin(d * 5)) * 0.5 : 0), 7.65]} rotation={[0, Math.PI, -fallen - d * 3]}>
          <Scooter />
        </group>,
      );
    }
  }

  // girl: waits with her balloon, then rides in the courier's arms
  let girlP: V3;
  let girlYaw: number;
  let girlPose: PersonPose;
  if (!carrying) {
    const g = bodyOn(GIRL_WAIT, v, 0.6, 1, -0.35);
    girlP = g.p;
    girlYaw = Number.isNaN(g.yaw) ? -0.4 : g.yaw;
    girlPose = {...g.pose, armR: [v < BALLOON_GONE ? 1.2 : 2.6 * (1 - ramp(v, BALLOON_GONE + 0.6, BALLOON_GONE + 1.6)), -0.2], elbowR: 0.2, mouth: v > BALLOON_GONE ? 0.7 : 0, head: [v < BALLOON_GONE ? -0.35 : -0.6, 0]};
    if (!c.hidden) {
      items.push(
        <group key="girl" position={girlP} rotation={[0, 0, g.lean]}>
          <Person position={[0, 0, 0]} rotation={girlYaw} child longHair shirt="#e985a6" pants="#5c6fa8" hair="#5a3a22" scale={0.62} pose={girlPose} />
        </group>,
      );
    }
    // balloon hand in world space: her right hand raised (approximate)
    const s = 0.62;
    const hx = girlP[0] + Math.cos(girlYaw) * 0.33 * s + Math.sin(girlYaw) * 0.45 * s;
    const hz = girlP[2] - Math.sin(girlYaw) * 0.33 * s + Math.cos(girlYaw) * 0.45 * s;
    if (v < BALLOON_GONE) items.push(<Balloon key="balloon" v={v} hand={[hx, girlP[1] + 1.55 * s + 0.25, hz]} />);
  } else if (!c.hidden) {
    // held on his chest, facing him
    const fwd: V3 = [Math.sin(cy) * 0.42, 0, Math.cos(cy) * 0.42];
    items.push(
      <group key="girl" position={[c.p[0] + fwd[0], c.p[1] + 0.62, c.p[2] + fwd[2]]} rotation={[0, 0, c.lean]}>
        <Person
          position={[0, 0, 0]}
          rotation={cy + Math.PI}
          child
          longHair
          shirt="#e985a6"
          pants="#5c6fa8"
          hair="#5a3a22"
          scale={0.62}
          pose={{legL: 1.3, legR: 1.2, armL: [1.6, 0.4], armR: [1.6, -0.4], elbowL: 0.6, elbowR: 0.6, head: [0.2, 0.5], mouth: 0.4}}
        />
      </group>,
    );
  }

  // once torn away the balloon flies on from where her hand was
  if (v >= BALLOON_GONE) items.push(<Balloon key="balloon-free" v={v} hand={RELEASE_HAND} />);

  // mom
  const m = bodyOn(MOM, v, 1.0, 2);
  items.push(<HumanAt key="mom" b={m} shirt="#46a6a0" pants="#3b3b3b" hair="#8a5a34" skin="#f3dcc4" longHair yawFallback={-0.3} />);

  // woman with the dog
  const wb = bodyOn(DOG_WOMAN, v, 1.0, 3);
  items.push(<HumanAt key="dogwoman" b={wb} shirt="#9b6fb5" pants="#2f3a4f" hair="#1f1a17" skin="#c68e63" longHair yawFallback={-Math.PI / 2} />);
  {
    const wy = Number.isNaN(wb.yaw) ? -Math.PI / 2 : wb.yaw;
    // the dog trots half a step ahead, on the street side
    const dp: V3 = [wb.p[0] + Math.sin(wy) * 1.1 + Math.cos(wy) * 0.5, wb.p[1] + (wb.p[1] < 0 ? -0.3 : 0), wb.p[2] + Math.cos(wy) * 1.1 - Math.sin(wy) * 0.5];
    const moving = !Number.isNaN(wb.yaw);
    const dogHidden = dp[1] < -1.6;
    if (!dogHidden) {
      items.push(
        <group key="dog" position={dp} rotation={[0, 0, wb.lean * 1.4]}>
          <Dog position={[0, 0, 0]} rotation={wy} pose={{legPhase: moving ? v * 16 : 0, tail: moving ? Math.sin(v * 12) * 0.4 : Math.sin(v * 9) * 0.5 * (v < 12 ? 1 : 0), head: v > 12 && !moving ? -0.3 : 0}} />
        </group>,
      );
      const hand: V3 = [wb.p[0] + Math.cos(wy) * 0.33 + Math.sin(wy) * 0.2, wb.p[1] + 0.75, wb.p[2] - Math.sin(wy) * 0.33 + Math.cos(wy) * 0.2];
      if (!wb.hidden) items.push(<Rope key="leash" from={hand} to={[dp[0] + Math.sin(wy) * 0.4, dp[1] + 0.62, dp[2] + Math.cos(wy) * 0.4]} />);
    }
  }

  WALKERS.forEach((w, i) => {
    const b = bodyOn(w.path, v, 1.0, i * 0.37);
    items.push(<HumanAt key={`w${i}`} b={b} shirt={w.shirt} pants={w.pants} hair={w.hair} skin={w.skin} longHair={w.longHair} yawFallback={w.path[0][2] > 0 ? Math.PI : 0} />);
  });
  return <>{items}</>;
};
