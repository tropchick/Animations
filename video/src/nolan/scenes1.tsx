import React from 'react';
import {Table} from '../bear/Props';
import {Sky, ForestLight} from '../bear/Forest';
import {Ball, Block, Cyl, Glow, RBox} from '../bear/kit';
import {Scene, ease, ease5, mv} from '../bear/common';
import {Pic} from '../bear/Props';
import {InteriorLights} from '../cs2/scenes1';
import {Stars} from '../gta/Space';
import type {View} from '../slime/camera';
import {BOAT_IN, FLOOD, LAND, MOON, SINK, SPOONS, STEP_SEA, STOMP, V3, lerp, lerp3, ramp, rnd, shotEnd, shotStart} from './cues';
import {Bubbles, Coil, Dinghy, Dots, Foam, Gondola, Mom, MomBack, Pigeon, Spoon, ToyEarth, ToyMoon, ToyScale, Towel, Umbrella, VeniceHouse, Water} from './Sets';

const S = shotStart;
const E = shotEnd;

// ballistic fall: 0 before t0, then height drops from h to 0 at t1
const drop = (v: number, t0: number, t1: number, h: number) => (v >= t1 ? 0 : v <= t0 ? h : h * (1 - ((v - t0) / (t1 - t0)) ** 2));
// a squash that springs back after an impact at `at`
export const bounce = (v: number, at: number, depth = 0.12) => (v < at ? 1 : 1 - depth * Math.exp(-(v - at) * 7) * Math.cos((v - at) * 22));

// ======================================================================= 0. intro: a stage, two mothers land side by side

const Stage: React.FC = () => (
  <>
    <Block position={[0, -0.05, 0]} size={[14, 0.1, 10]} color="#c8955e" />
    {Array.from({length: 13}).map((_, i) => (
      <Block key={i} position={[-6 + i, 0.002, 0]} size={[0.012, 0.002, 10]} color="#9a6a3a" shadow={false} />
    ))}
    {/* curtain: tall soft folds */}
    {Array.from({length: 22}).map((_, i) => (
      <Cyl key={i} position={[-7 + i * 0.66, 3, -3.6 + (i % 2) * 0.12]} rt={0.36} rb={0.36} h={6.2} seg={16} color={i % 2 ? '#b8283a' : '#a01f30'} look={{rough: 0.9, rim: '#ff8090', rimK: 0.15}} />
    ))}
    <RBox position={[0, 5.6, -3.2]} size={[15, 0.9, 0.4]} r={0.15} color="#d8a83a" look={{metal: 0.4, rough: 0.4}} />
  </>
);

const Crack: React.FC<{position: V3; k: number; seed: number}> = ({position, k, seed}) => (
  <group position={position}>
    {Array.from({length: 7}).map((_, i) => {
      const a = (i / 7) * Math.PI * 2 + rnd(seed + i) * 0.6;
      const len = (0.35 + 0.35 * rnd(seed * 3 + i)) * k;
      return <Block key={i} position={[Math.cos(a) * (0.3 + len / 2), 0.004, Math.sin(a) * (0.3 + len / 2)]} rotation={[0, -a, 0]} size={[len, 0.003, 0.025]} color="#2a1a10" shadow={false} />;
    })}
  </group>
);

const G_X = -0.44;
const N_X = 0.44;
export const introScene: Scene = {
  view: (v): View => mv(v, 0, E('intro'), [0.0, 0.3, 3.6], [0.15, 0.36, 3.15], [0, 0.48, 0], [0, 0.4, 0], [42, 40], 0.3),
  shakes: [[LAND, 0.25]],
  render: (v) => {
    const lg = LAND;
    const ln = LAND + 0.12;
    return (
      <>
        <color attach="background" args={['#2a1420']} />
        <InteriorLights key1={[2, 7, 5]} k={0.9} box={5} warm="#ffe8c8" sky="#ffe0e8" ground="#4a2a30" />
        <pointLight position={[G_X, 4, 1.5]} color="#ffd8b0" intensity={6} distance={9} decay={1.6} />
        <pointLight position={[N_X, 4, 1.5]} color="#ffd8b0" intensity={6} distance={9} decay={1.6} />
        <Stage />
        <Mom who="g" position={[G_X, drop(v, lg - 0.5, lg, 3.2), 0]} rotation={0.12} hem={3} squash={bounce(v, lg)} />
        <Mom who="n" position={[N_X, drop(v, ln - 0.5, ln, 3.2), 0]} rotation={-0.12} hem={3} squash={bounce(v, ln)} />
        {v > lg ? <Crack position={[G_X, 0, 0]} k={ease(v, lg, lg + 0.25)} seed={3} /> : null}
        {v > ln ? <Crack position={[N_X, 0, 0]} k={ease(v, ln, ln + 0.25)} seed={7} /> : null}
      </>
    );
  },
};

// ======================================================================= 1. bathroom scales: both break, a draw

const drawTiles = (base: string, line: string, n: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = line;
  g.lineWidth = 4;
  for (let i = 0; i <= n; i++) {
    g.beginPath();
    g.moveTo((i / n) * W, 0);
    g.lineTo((i / n) * W, H);
    g.stroke();
    g.beginPath();
    g.moveTo(0, (i / n) * H);
    g.lineTo(W, (i / n) * H);
    g.stroke();
  }
};

export const SCALE_X = 0.45;
const springs = (v: number, x0: number, seed: number) =>
  v < STOMP
    ? null
    : Array.from({length: 5}).map((_, i) => {
        const t = v - STOMP;
        const a = rnd(seed + i * 3) * Math.PI * 2;
        const sp = 0.6 + rnd(seed + i) * 0.6;
        const vy = 2.4 + rnd(seed * 2 + i) * 1.2;
        const y = Math.max(0.03, 0.05 + vy * t - 4.9 * t * t);
        const k = Math.min(t, (vy + Math.sqrt(vy * vy + 4 * 4.9 * 0.02)) / 9.8);
        return <Coil key={i} position={[x0 + Math.cos(a) * sp * k, y, Math.sin(a) * sp * k * 0.7 + 0.05]} rotation={[t * 8 + i, t * 5, 0]} s={1.3} />;
      });

export const scalesScene: Scene = {
  view: (v): View => mv(v, S('scales'), E('scales'), [0.15, 0.6, 3.1], [-0.1, 0.48, 2.75], [0, 0.36, 0], [0, 0.28, 0], [40, 40], 0.15),
  shakes: [[STOMP, 0.35]],
  render: (v) => {
    const down = ease5(v, STOMP - 0.32, STOMP);
    const pre = ease(v, S('scales'), S('scales') + 0.7) * (1 - down);
    const sq = v < STOMP ? 1 : 0.45;
    const top = 0.066 * sq;
    const lift = 0.32 * (1 - down) + 0.04 * pre * Math.sin(v * 6);
    return (
      <>
        <color attach="background" args={['#cfe6ee']} />
        <InteriorLights key1={[1.5, 5, 4]} k={1.0} box={3} warm="#fff4e6" sky="#eef8ff" ground="#8aa0a8" />
        <Pic size={[8, 8]} res={[512, 512]} k="floor-tiles" position={[0, 0.0, 0]} rotation={[-Math.PI / 2, 0, 0]} shadow draw={drawTiles('#f2f4f6', '#c8d4dc', 16)} />
        <Pic size={[8, 5]} res={[512, 320]} k="wall-tiles" position={[0, 2.5, -1.4]} shadow draw={drawTiles('#bfe2ea', '#9cc8d4', 20)} />
        {/* the bath behind */}
        <RBox position={[-1.6, 0.3, -1.0]} size={[1.7, 0.6, 0.75]} r={0.12} color="#ffffff" look={{rough: 0.3}} />
        <RBox position={[1.6, 0.42, -1.15]} size={[0.6, 0.84, 0.45]} r={0.05} color="#f4f0e8" />
        <ToyScale position={[-SCALE_X, 0, 0]} squash={sq} err={v > STOMP + 0.5} k="sc-l" />
        <ToyScale position={[SCALE_X, 0, 0]} squash={sq} err={v > STOMP + 0.55} k="sc-r" />
        {springs(v, -SCALE_X, 11)}
        {springs(v, SCALE_X, 23)}
        <Mom who="g" position={[-SCALE_X, top + lift, -0.02]} hem={3} squash={bounce(v, STOMP, 0.1)} />
        <Mom who="n" position={[SCALE_X, top + lift, -0.02]} hem={3} squash={bounce(v, STOMP, 0.1)} />
      </>
    );
  },
};

// ======================================================================= 2a. sea: Gaben's mother steps into a dinghy, it sinks

const SeaSky: React.FC = () => <Sky top="#5fa8e8" mid="#bfe2f6" low="#e8f4fa" />;

export const boatScene: Scene = {
  view: (v): View => mv(v, S('boat'), E('boat'), [1.7, 0.95, 3.6], [1.6, 0.9, 3.9], [0, 0.55, 0], [0, 0.3, 0], [42, 40], 0.2),
  render: (v) => {
    const inK = ease5(v, BOAT_IN - 0.55, BOAT_IN);
    const sink = ease(v, SINK[0], SINK[1]) * 1.9;
    const bob = Math.sin(v * 2.1) * 0.03 * (1 - inK);
    const y0 = -sink + bob;
    const sq = v < BOAT_IN ? 1 : 0.62 + 0.38 * (1 - Math.min(1, (v - BOAT_IN) * 6)) * 0;
    return (
      <>
        <SeaSky />
        <ForestLight k={1.0} sun={[-6, 10, 5]} shadowBox={4} warm={1} />
        <Water y={0} color="#2f96cc" />
        <Foam v={v} y={0} n={40} area={[-10, 10, -30, 3]} seed={2} />
        <Dinghy position={[0, y0 - 0.06 * inK, 0]} rotation={[0, 0.5, 0.04 * Math.sin(v * 1.7)]} squash={sq} />
        <Mom who="g" position={[0, y0 + lerp(1.7, 0.12, inK) - 0.06 * inK, 0]} rotation={0.5} hem={3} squash={bounce(v, BOAT_IN, 0.1)} />
        <Bubbles t={v - SINK[0] - 0.5} center={[0, -0.3, 0]} />
        {/* ripples where it went down */}
        {v > SINK[0] + 0.6 ? <Ball position={[0, 0.006, 0]} scale={[0.6 + (v - SINK[0]) * 0.5, 0.004, 0.6 + (v - SINK[0]) * 0.5]} color="#ffffff" look={{opacity: Math.max(0, 0.6 - (v - SINK[0]) * 0.2), rough: 0.4}} shadow={false} /> : null}
      </>
    );
  },
};

// ======================================================================= 2b. beach: Nolan's mother walks into the sea, the sea rises

const seaY = (v: number) => -0.06 + 0.55 * ease(v, STEP_SEA + 0.1, STEP_SEA + 1.9);
const walk = (v: number, t0: number, t1: number) => {
  const k = ease(v, t0, t1);
  const ph = (v - t0) * 7;
  const on = v > t0 && v < t1 ? 1 : 0;
  return {k, liftL: on * Math.max(0, Math.sin(ph)) * 0.09, liftR: on * Math.max(0, -Math.sin(ph)) * 0.09};
};

export const beachScene: Scene = {
  view: (v): View => mv(v, S('beach'), E('beach'), [3.0, 1.05, 2.5], [2.3, 1.35, 1.7], [0, 0.45, -0.6], [-0.2, 0.4, -1.2], [44, 46], 0.2),
  render: (v) => {
    const w = walk(v, S('beach'), STEP_SEA + 0.3);
    const z = lerp(0.9, -1.4, w.k);
    const y = z < -0.6 ? -0.08 * ramp(-z, 0.6, 1.4) : 0;
    return (
      <>
        <SeaSky />
        <ForestLight k={1.05} sun={[-6, 10, 6]} shadowBox={6} warm={1} />
        <Block position={[0, -0.5, 4]} size={[40, 1, 10]} color="#f0d49a" />
        <Block position={[0, -0.62, -2]} rotation={[-0.12, 0, 0]} size={[40, 1, 4]} color="#e8c88a" />
        <Water y={seaY(v)} color="#2f96cc" center={[0, 0, -20]} size={120} />
        <Foam v={v} y={seaY(v)} n={30} area={[-10, 10, -30, -1.2]} seed={5} />
        <Umbrella position={[-1.8, 0, 1.2]} />
        <Towel position={[-1.2, 0, 1.6]} rotation={0.3} />
        <Towel position={[1.4, 0, 2.2]} rotation={-0.2} color="#f2a43a" />
        <Mom who="n" position={[0, y, z]} rotation={Math.PI} hem={3} feet={{liftL: w.liftL, liftR: w.liftR}} />
      </>
    );
  },
};

// ======================================================================= 2c. Venice goes under

const HOUSES: {x: number; z: number; w: number; h: number}[] = Array.from({length: 12}, (_, i) => ({
  x: i % 2 ? 3.2 : -3.2,
  z: 4 - Math.floor(i / 2) * 3.2,
  w: 3,
  h: 3.6 + rnd(i * 3) * 2.2,
}));
const floodY = (v: number) => lerp(0.3, 5.4, ease(v, FLOOD[0], FLOOD[1]));

export const veniceScene: Scene = {
  view: (v): View => mv(v, S('venice'), E('venice'), [0.4, 7.2, 11.5], [-0.3, 8.2, 10.0], [0, 3.4, -6], [0, 4.4, -6], [46, 44]),
  render: (v) => {
    const wy = floodY(v);
    const pigeonT = v - (FLOOD[1] - 0.6);
    const house = HOUSES[4];
    const chimney: V3 = [house.x - 0.4, house.h + 0.83, house.z + 0.75];
    const pp: V3 = pigeonT > 0 ? [chimney[0] + pigeonT * 1.5, chimney[1] + pigeonT * 1.8, chimney[2] + pigeonT * 1.0] : chimney;
    return (
      <>
        <Sky top="#6aa8e0" mid="#f2d8b8" low="#f6e0c8" />
        <ForestLight k={1.0} sun={[-8, 12, 6]} shadowBox={14} warm={1} />
        <Block position={[0, -0.5, 0]} size={[60, 1, 60]} color="#8a7a6a" />
        {HOUSES.map((hh, i) => (
          <VeniceHouse key={i} position={[hh.x, 0, hh.z]} rotation={hh.x > 0 ? -Math.PI / 2 : Math.PI / 2} w={hh.w} h={hh.h} i={i} />
        ))}
        <Water y={wy} color="#3a9ab8" center={[0, 0, -10]} size={80} />
        <Gondola position={[0.5, wy, -0.5]} rotation={0.2} />
        <Pigeon position={pp} rotation={-1.2} flap={pigeonT > 0 ? 0.5 * Math.sin(v * 30) : 0} />
      </>
    );
  },
};

// ======================================================================= 3a. gravity: spoons fly to the leopard robe

const MOM_SP: V3 = [0.62, 0, -0.05];
const spoonTarget = (i: number): {p: V3; yaw: number} => {
  const a = Math.PI + (i - 2.5) * 0.28; // around the left side of the robe, facing the camera
  const r = 0.37;
  return {p: [MOM_SP[0] + Math.cos(a) * r, 0.75 + (i % 3) * 0.17, MOM_SP[2] - Math.sin(a) * r * 0.2 + 0.25], yaw: -a + Math.PI / 2};
};

export const spoonsScene: Scene = {
  view: (v): View => mv(v, S('spoons'), E('spoons'), [-0.75, 1.15, 2.5], [-0.5, 1.08, 2.15], [0.05, 0.85, 0], [0.12, 0.88, 0], [42, 40], 0.1),
  render: (v) => (
    <>
      <color attach="background" args={['#f2e6d8']} />
      <InteriorLights key1={[-2, 5, 4]} k={1.0} box={3} warm="#fff0dc" sky="#fff6ea" ground="#9a8070" />
      <Block position={[0, -0.05, 0]} size={[8, 0.1, 8]} color="#c8a07a" />
      <Pic size={[8, 4]} res={[512, 256]} k="kitchen-wall" position={[0, 2, -1.2]} shadow draw={drawTiles('#f8f2e6', '#e2d6c4', 14)} />
      <RBox position={[-1.4, 0.45, -0.95]} size={[1.6, 0.9, 0.5]} r={0.03} color="#7ab0a0" />
      <RBox position={[-1.4, 0.92, -0.95]} size={[1.66, 0.05, 0.56]} r={0.015} color="#e8e0d4" />
      <Table position={[-0.45, 0, 0.05]} size={[0.9, 0.6]} h={0.72} top="#b07a4a" />
      <Cyl position={[-0.55, 0.78, 0.1]} rt={0.05} rb={0.045} h={0.11} seg={16} color="#e8453c" />
      {SPOONS.map((at, i) => {
        const tg = spoonTarget(i);
        const k = ease(v, at - 0.28, at);
        const from: V3 = [-0.55 + (i % 3) * 0.02, 0.86, 0.1 + (i % 2) * 0.02];
        const p = lerp3(from, tg.p, k);
        p[1] += Math.sin(Math.PI * k) * 0.12;
        return <Spoon key={i} scale={1.8} position={p} rotation={[lerp(-1.2, 0, k), lerp(i * 0.5, tg.yaw + Math.PI / 2, k), lerp(0, 0.3 * (i % 2 ? 1 : -1), k)]} />;
      })}
      <Mom who="n" position={MOM_SP} rotation={-0.3} hem={3} />
    </>
  ),
};

// ======================================================================= 3b. gravity: the Moon leaves the Earth for Gaben's mother

export const EARTH_C: V3 = [-3.2, 0.5, 0];
export const GIANT_G = {p: [5.0, -5.8, -3] as V3, s: 6};
export const giantCenter: V3 = [GIANT_G.p[0], 0.5, GIANT_G.p[2]];
const moonPos = (v: number): V3 => {
  const aE = 1.2 + v * 0.7;
  const pe: V3 = [EARTH_C[0] + Math.cos(aE) * 3.3, EARTH_C[1] + Math.sin(aE) * 0.5, EARTH_C[2] + Math.sin(aE) * 3.3];
  const aG = 3.0 + (v - MOON[0]) * 1.1;
  const pg: V3 = [giantCenter[0] + Math.cos(aG) * 4.6, giantCenter[1] + 0.8, giantCenter[2] + Math.sin(aG) * 4.6];
  return lerp3(pe, pg, ease5(v, MOON[0], MOON[1]));
};

export const SpaceLights: React.FC<{k?: number}> = ({k = 1}) => (
  <>
    <ambientLight intensity={0.45 * k} color="#9aa8d8" />
    <directionalLight position={[10, 6, 9]} intensity={2.4 * k} color="#fff4e0" />
    <directionalLight position={[-8, -2, 6]} intensity={0.5 * k} color="#c8d8ff" />
  </>
);

export const moonScene: Scene = {
  view: (v): View => mv(v, S('moon'), E('moon'), [-1.5, 1.6, 21], [0.2, 1.0, 19.5], [0.2, 0.6, 0], [0.9, 0.2, 0], [46, 48]),
  render: (v) => {
    const k = ease(v, MOON[0], MOON[1]);
    return (
      <>
        <color attach="background" args={['#05060f']} />
        <Stars radius={300} size={2} />
        <SpaceLights />
        <ToyEarth r={2} spin={v * 0.1} position={EARTH_C} />
        <Dots center={EARTH_C} r={3.3} opacity={0.7 * (1 - k)} />
        <Dots center={[giantCenter[0], giantCenter[1] + 0.8, giantCenter[2]]} r={4.6} opacity={0.7 * k} n={90} />
        <ToyMoon position={moonPos(v)} r={0.55} />
        <MomBack who="g" position={GIANT_G.p} rotation={[0, Math.PI - 0.3, 0]} scale={GIANT_G.s} />
        <Glow position={[14, 8, -30]} size={10} color="#fff1c8" k={0.6} />
      </>
    );
  },
};

export {Block};
