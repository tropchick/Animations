import React from 'react';
import {random} from 'remotion';
import {Box, Cyl} from '../scene/parts';
import {Car} from '../gravity/props';
import {CafeTable, Chair, HotDogCart, LampPost, Pigeon, Planter, TrafficLight, TreeInPlanter, Bin} from '../gravity/city';
import {Slide, slide, slideSpeed, slideX, vAtWind} from './loose';
import {V, V3, clamp01, ramp, windKmh} from './time';

const G = 9.81;
const FAR = 320; // past this offset a thing has left every shot
const WALK_EDGE = 12; // north edge of the avenue's sidewalk, where the side street starts

// Where a loose thing is: base position plus its slide downwind, with a tumble once it is fast.
const loosePose = (s: Slide, v: number, base: V3, rollAfter = 25, rollR = 1.5, hop = 0.6) => {
  const dx = slideX(s, v);
  const sp = slideSpeed(s, v);
  const roll = -Math.max(0, dx - rollAfter) / rollR;
  const y = base[1] + (dx > rollAfter ? Math.abs(Math.sin(roll)) * hop + Math.max(0, dx - 120) * 0.08 : 0);
  return {p: [base[0] + dx, y, base[2]] as V3, roll, sp, gone: dx > FAR || v >= V.zero};
};

// ---------- Cars ----------

type CarSpec = {x: number; z: number; color: string; yaw: number; drive?: number};

const CAR_COLORS = ['#d8473a', '#3f6fb3', '#f2efe8', '#2f3540', '#7cb46b', '#f2c14e', '#9aa3ad', '#46a6a0'];

export const PARKED: CarSpec[] = [
  ...[-41, -30, -22, 12.5, 30, 38].map((x, i) => ({x, z: 5.6, color: CAR_COLORS[i % 8], yaw: 0})),
  ...[-43, -27, 33, 41].map((x, i) => ({x, z: -5.6, color: CAR_COLORS[(i + 3) % 8], yaw: Math.PI})),
];

// Westbound traffic rolling through before the braking starts, then stopping.
export const TRAFFIC: CarSpec[] = [
  {x: 34, z: -1.8, color: '#3f6fb3', yaw: Math.PI, drive: 7},
  {x: 46, z: -1.8, color: '#f2efe8', yaw: Math.PI, drive: 7},
  {x: -14, z: 1.8, color: '#d8473a', yaw: 0, drive: 0},
  {x: -20, z: 1.8, color: '#7cb46b', yaw: 0, drive: 0},
];

const drivenX = (c: CarSpec, v: number) => {
  if (!c.drive) return c.x;
  // rolls at `drive` m/s, eases to a stop over 9..11.5 s
  const tStop = 9;
  const run = Math.min(v, tStop) * c.drive + (v > tStop ? c.drive * 1.25 * ramp(v, tStop, 11.5, (t) => 1 - (1 - t) * (1 - t)) : 0);
  return c.x - run;
};

const CarThing: React.FC<{c: CarSpec; v: number; i: number}> = ({c, v, i}) => {
  const s = slide(0.7 + 0.08 * random(`car-mu-${i}`), 0.0012);
  const x0 = drivenX(c, v);
  const st = loosePose(s, v, [x0, 0, c.z], 22 + 10 * random(`car-r-${i}`), 1.4, 0.9);
  if (st.gone) return null;
  const alarm = v > s.start && Math.floor(v * 3 + i) % 2 === 0;
  return (
    <group position={st.p} rotation={[0, c.yaw, c.yaw === 0 ? st.roll : -st.roll]}>
      <Car color={c.color} blink={alarm} />
    </group>
  );
};

export const Cars: React.FC<{v: number}> = ({v}) => (
  <>
    {[...PARKED, ...TRAFFIC].map((c, i) => (
      <CarThing key={i} c={c} v={v} i={i} />
    ))}
  </>
);

// ---------- Yellow bus waiting at the red light in the side street, broadside to the wind ----------

export const BUS_POS: V3 = [-2, 0, -WALK_EDGE - 6.6]; // center; the bus runs along z, nose toward the avenue
const BUS_TIP_START = 21.8;
const BUS_W = 2.55;
const SIDE_CURB = 4; // the tipped bus scrapes east until the curb of the side street stops it

export const busState = (v: number) => {
  const tip = (Math.PI / 2) * ramp(v, BUS_TIP_START, BUS_TIP_START + 1.25, (t) => t * t);
  // once on its side it scrapes east until its roof (3.2 m from the pivot) hits the curb
  const room = SIDE_CURB - 0.05 - (BUS_POS[0] + BUS_W / 2 + 3.2);
  const s = slide(0.55, 0.0025);
  const slid = v > BUS_TIP_START + 1.25 ? slideX(s, Math.min(v, V.zero)) - slideX(s, BUS_TIP_START + 1.25) : 0;
  // when the Earth snaps back the bus is left behind and shoots west with the rest
  const k = v >= V.restart ? clamp01((v - V.restart) / (V.restored - V.restart)) : 0;
  const rock = v < BUS_TIP_START ? 0.05 * ramp(v, 15, BUS_TIP_START) * (1 + Math.sin(v * 7)) : 0;
  return {tip: tip + rock, dx: Math.min(room, slid) - 0.5 * 355 * k * k};
};

export const YellowBus: React.FC<{v: number}> = ({v}) => {
  const {tip, dx} = busState(v);
  if (dx < -FAR) return null;
  // pivot on the downwind (+x) bottom edge
  return (
    <group position={[BUS_POS[0] + BUS_W / 2 + dx, 0.02, BUS_POS[2]]} rotation={[0, 0, -tip]}>
      <group position={[-BUS_W / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <BusBody />
      </group>
    </group>
  );
};

// A plain yellow city bus (length along x, front at +x). Every part sticks out a few cm from the body
// so no two faces share a plane.
const BusBody: React.FC = () => (
  <group>
    <Box size={[12, 2.7, BUS_W]} position={[0, 1.75, 0]} color="#f2c230" />
    <Box size={[11.2, 0.9, BUS_W + 0.06]} position={[-0.2, 2.25, 0]} color="#2b3947" shadow={false} />
    <Box size={[0.08, 1.3, 2.2]} position={[6.03, 2.0, 0]} color="#2b3947" shadow={false} />
    <Box size={[12.08, 0.3, BUS_W + 0.08]} position={[0, 0.65, 0]} color="#3a3f47" shadow={false} />
    <Box size={[1.6, 0.4, 0.06]} position={[4.8, 3.3, BUS_W / 2 + 0.04]} color="#1d2a1f" shadow={false} />
    {[-4, 3.6].map((x) =>
      [-1.12, 1.12].map((z) => (
        <Cyl key={`${x}${z}`} rTop={0.5} rBottom={0.5} height={0.36} segments={10} position={[x, 0.5, z]} rotation={[Math.PI / 2, 0, 0]} color="#22242a" />
      )),
    )}
  </group>
);

// ---------- Café on the north sidewalk ----------

export const CAFE_X = [9.5, 12.8, 16.1, 19.4];
export const CAFE_Z = -9.7;

export const Cafe: React.FC<{v: number}> = ({v}) => {
  const items: React.ReactNode[] = [];
  CAFE_X.forEach((x, i) => {
    const tbl = loosePose(slide(0.5, 0.01), v, [x, 0.16, CAFE_Z], 6, 0.5, 0.5);
    const umbRelease = vAtWind(25 + 9 * random(`umb-${i}`));
    const ud = Math.max(0, v - umbRelease);
    if (!tbl.gone) {
      items.push(
        <group key={`t${i}`} position={tbl.p} rotation={[0, 0, tbl.roll]}>
          <CafeTable />
        </group>,
      );
    }
    // umbrella: rattles, then tears off and sails away high
    if (ud < 6 && v < V.zero) {
      const shake = 0.06 * Math.sin(v * 13 + i) * ramp(v, 13, umbRelease);
      const p: V3 = [tbl.p[0] + 0.5 * 14 * ud * ud, tbl.p[1] + 1.5 + 4.5 * ud - 0.5 * 1.2 * ud * ud, tbl.p[2] + ud * (random(`uz-${i}`) - 0.5) * 2];
      items.push(
        <group key={`u${i}`} position={p} rotation={[ud * 2.1, 0, -0.5 * ramp(v, 14, umbRelease) - ud * 3 + shake]}>
          <Cyl rTop={0.025} rBottom={0.025} height={1.6} segments={5} position={[0, 0, 0]} color="#d0d0d0" />
          <Cyl rTop={0.05} rBottom={1.25} height={0.45} segments={8} position={[0, 0.85, 0]} color={i % 2 ? '#3fa6b4' : '#f2efe8'} />
        </group>,
      );
    }
    [-0.7, 0.7].forEach((ox, k) => {
      const ch = loosePose(slide(0.4, 0.02 + 0.004 * k), v, [x + ox, 0.16, CAFE_Z + (k ? 0.3 : -0.3)], 3, 0.4, 0.5);
      if (ch.gone) return;
      items.push(
        <group key={`c${i}${k}`} position={ch.p} rotation={[0, k ? -Math.PI / 2 : Math.PI / 2, ch.roll]}>
          <Chair color={k ? '#3fa6b4' : '#e2725b'} />
        </group>,
      );
    });
    // coffee cups: the coffee leans with the push, then the cups skid off the edge
    [-0.18, 0.2].forEach((ox, k) => {
      const cs = slide(0.33 + 0.04 * k, 0.014);
      const dx = slideX(cs, v);
      const onTable = dx < 0.5 - ox;
      const fall = Math.max(0, v - (cs.start + 0.35 + k * 0.1));
      const y = onTable ? 0.93 : Math.max(0.2, 0.93 - 0.5 * G * fall * fall);
      if (dx > 60 || v >= V.zero) return;
      const tilt = -0.9 * clamp01(windKmh(v) > 0 ? (v - V.slowStart) / 10 : 0) * 0.35;
      items.push(
        <group key={`cup${i}${k}`} position={[tbl.p[0] + ox + dx, y, CAFE_Z + (k ? 0.12 : -0.1)]} rotation={[0, 0, onTable ? 0 : -fall * 6]}>
          <Cyl rTop={0.05} rBottom={0.04} height={0.1} segments={8} position={[0, 0.05, 0]} color="#ffffff" />
          <Cyl rTop={0.044} rBottom={0.044} height={0.01} segments={8} position={[0, 0.099, 0]} rotation={[0, 0, tilt]} color="#6b3e22" shadow={false} />
          <Cyl rTop={0.08} rBottom={0.08} height={0.01} segments={10} position={[0, 0.0, 0]} color="#f2efe8" />
        </group>,
      );
    });
  });
  // hot-dog cart on wheels: the first thing that starts to roll
  const cart = loosePose(slide(0.15, 0.004), v, [22, 0.16, -8.7], 30, 0.9, 0.6);
  if (!cart.gone) {
    items.push(
      <group key="cart" position={cart.p} rotation={[0, 0, cart.roll]}>
        <HotDogCart />
      </group>,
    );
  }
  return <>{items}</>;
};

// ---------- Street furniture ----------

export const LAMPS: V3[] = [-40, -24, -10, 9, 30, 42].flatMap((x) => [
  [x, 0.16, -7.8] as V3,
  [x + 6, 0.16, 7.8] as V3,
]);

export const SIGNALS: {p: V3; rot: number}[] = [
  {p: [-5, 0.16, -7.7], rot: 0},
  {p: [5, 0.16, -7.7], rot: 0},
  {p: [-10, 0.16, 7.7], rot: Math.PI},
  {p: [5, 0.16, 7.7], rot: Math.PI},
];

const POLE_SNAP = (i: number) => vAtWind(330 + 160 * random(`pole-${i}`));

const Pole: React.FC<{v: number; i: number; children: React.ReactNode; p: V3; rot?: number}> = ({v, i, children, p, rot = 0}) => {
  const snap = POLE_SNAP(i);
  const d = Math.max(0, v - snap);
  if (d > 5 || v >= V.zero) return null;
  const bend = -0.07 * clamp01(windKmh(v) / 300) * (1 + 0.3 * Math.sin(v * 11 + i));
  const fallen = -1.4 * ramp(d, 0, 0.6, (t) => t * t);
  const fly: V3 = d > 0.6 ? [0.5 * 30 * (d - 0.6) ** 2, 0.6 * (d - 0.6), 0] : [0, 0, 0];
  return (
    <group position={[p[0] + fly[0], p[1] + fly[1], p[2]]} rotation={[0, 0, bend + fallen - (d > 0.6 ? (d - 0.6) * 4 : 0)]}>
      <group rotation={[0, rot, 0]}>{children}</group>
    </group>
  );
};

export const Furniture: React.FC<{v: number}> = ({v}) => (
  <>
    {LAMPS.map((p, i) => (
      <Pole key={`l${i}`} v={v} i={i} p={p} rot={p[2] < 0 ? Math.PI / 2 : -Math.PI / 2}>
        <LampPost position={[0, 0, 0]} />
      </Pole>
    ))}
    {SIGNALS.map((s, i) => (
      <Pole key={`s${i}`} v={v} i={i + 40} p={s.p}>
        <TrafficLight position={[0, 0, 0]} rot={s.rot} v={v < 9 ? 0 : 4} />
      </Pole>
    ))}
    <BinThing v={v} p={[-20, 0.16, 8.4]} i={0} />
    <BinThing v={v} p={[3.5, 0.16, -8.4]} i={1} />
  </>
);

const BinThing: React.FC<{v: number; p: V3; i: number}> = ({v, p, i}) => {
  const st = loosePose(slide(0.4, 0.03), v, p, 2, 0.3, 0.3);
  if (st.gone) return null;
  return (
    <group position={st.p} rotation={[0, i, st.roll]}>
      <Bin />
    </group>
  );
};

// ---------- Trees in planters ----------

export const TREES: V3[] = [
  [-33, 0.16, 10.2],
  [-17, 0.16, 10.2],
  [9, 0.16, 10.2],
  [20, 0.16, 10.2],
  [33, 0.16, 10.2],
  [-29, 0.16, -10.4],
  [31, 0.16, -10.4],
];

export const Trees: React.FC<{v: number}> = ({v}) => (
  <>
    {TREES.map((p, i) => {
      const up = vAtWind(220 + 120 * random(`tree-${i}`));
      const d = Math.max(0, v - up);
      const w = windKmh(v);
      const sway = v < V.zero ? -Math.min(1.0, (w / 230) ** 1.2) * 0.9 - 0.08 * Math.sin(v * (5 + i)) * clamp01(w / 40) : 0;
      return (
        <group key={i}>
          <Planter position={p} />
          {d < 6 && v < V.zero ? (
            <group position={[p[0] + 0.5 * 16 * d * d, p[1] + 0.6 + 3 * d - 0.5 * 2 * d * d, p[2]]} rotation={[0, i, -d * 2.5]}>
              <group rotation={[0, -i, 0]}>
                <group rotation={[0, 0, d > 0 ? 0 : 0]}>
                  <TreeInPlanter uproot={d > 0 ? 1 : 0} sway={sway} />
                </group>
              </group>
            </group>
          ) : null}
        </group>
      );
    })}
  </>
);

// ---------- Pigeons: startled by the rumble, then swept away ----------

export const Pigeons: React.FC<{v: number}> = ({v}) => {
  const items = [];
  for (let i = 0; i < 9; i++) {
    const bx = -11 + random(`pg-x-${i}`) * 6;
    const bz = 8.4 + random(`pg-z-${i}`) * 2.6;
    const lift = V.slowStart + 0.6 + random(`pg-l-${i}`) * 0.8;
    const d = Math.max(0, v - lift);
    if (v >= 30) continue;
    const peck = d === 0 ? 0.25 * Math.max(0, Math.sin(v * 3 + i * 1.7)) : 0;
    // circle up, then the wind takes them east
    const swept = Math.max(0, v - (13 + random(`pg-s-${i}`) * 2));
    const x = bx + Math.sin(d * 1.3 + i) * 2.5 * clamp01(d) + 0.5 * 9 * swept * swept;
    const y = 0.16 + Math.min(9 + 3 * random(`pg-h-${i}`), d * 4.2);
    const z = bz - d * 0.8 + Math.cos(d * 1.3 + i) * 2 * clamp01(d);
    const flap = d > 0 ? Math.sin(v * 26 + i) * 0.9 : 0;
    items.push(
      <group key={i} position={[x, y, z]} rotation={[peck, d > 0 ? -Math.PI / 2 : random(`pg-r-${i}`) * 6, swept * 0.8]}>
        <Pigeon flap={flap} />
      </group>,
    );
  }
  return <>{items}</>;
};

// ---------- Flying debris: papers and leaves early, grit and chunks later ----------

export const Debris: React.FC<{v: number}> = ({v}) => {
  const w = windKmh(v);
  if (w < 25 || v >= V.restart) return null;
  const items = [];
  const n = Math.min(70, Math.floor(10 + w / 12));
  const speed = Math.min(60, 2 + (w / 3.6) * 0.45); // drawn slower than real so it reads on screen
  const zero = v >= V.zero;
  for (let i = 0; i < n; i++) {
    const lane = random(`db-z-${i}`);
    const h = random(`db-h-${i}`);
    const big = i % 7 === 0 && w > 250;
    const span = 140;
    const phase = random(`db-p-${i}`) * span;
    // at the zero the stream is drawn in slow motion (x5)
    const tt = zero ? V.zero + (v - V.zero) / 5 : v;
    const x = ((phase + tt * speed) % span) - span / 2;
    const z = -14 + lane * 30;
    const y = 0.3 + h * (w > 200 ? 26 : 6) + Math.sin(tt * 3 + i) * 0.4;
    const s = big ? 0.8 + h : 0.18 + 0.2 * h;
    const color = big ? (i % 2 ? '#8f8a80' : '#6f767f') : i % 3 === 0 ? '#e9e4d8' : i % 3 === 1 ? '#7a9a4a' : '#b29a6e';
    items.push(<Box key={i} size={[s, s * 0.15 + (big ? s * 0.5 : 0), s * 0.8]} position={[x, y, z]} rotation={[tt * 4 + i, tt * 3, i]} color={color} shadow={false} />);
  }
  return <>{items}</>;
};

// ---------- Rubble left lying on the bare street at the zero; it is left behind at the restart ----------

export const RUBBLE: {p: V3; s: V3; c: string}[] = Array.from({length: 38}).map((_, i) => {
  const x = -40 + random(`rb-x-${i}`) * 85;
  const z = -12 + random(`rb-z-${i}`) * 26;
  const s = 0.6 + random(`rb-s-${i}`) * 1.8;
  const c = ['#a8a196', '#8f8a80', '#6f767f', '#b9b2a5'][i % 4];
  return {p: [x, s * 0.3, z] as V3, s: [s * 1.4, s * 0.6, s] as V3, c};
});

export const Rubble: React.FC<{v: number}> = ({v}) => {
  if (v < V.zero) return null;
  // the ground jerks east under the rubble, so on screen it shoots west, accelerating over one world second
  const k = v >= V.restart ? clamp01((v - V.restart) / (V.restored - V.restart)) : 0;
  const dx = -0.5 * 355 * k * k;
  if (dx < -FAR) return null;
  return (
    <>
      {RUBBLE.map((r, i) => (
        <Box
          key={i}
          size={r.s}
          position={[r.p[0] + dx * (0.8 + 0.4 * random(`rb-v-${i}`)), r.p[1] + (k > 0 ? Math.abs(Math.sin(k * 8 + i)) * 1.5 * k : 0), r.p[2]]}
          rotation={[i * 0.7, i, k * 6 * (i % 2 ? 1 : -1)]}
          color={r.c}
        />
      ))}
    </>
  );
};
