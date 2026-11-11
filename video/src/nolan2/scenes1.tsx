import React from 'react';
import {Sky, ForestLight, Tree} from '../bear/Forest';
import {Ball, Block, Glow} from '../bear/kit';
import {Scene, ease, ease5, mv} from '../bear/common';
import {Stars} from '../gta/Space';
import type {View} from '../slime/camera';
import {Mom, MomBack, Water, Foam, Umbrella, Towel} from '../nolan/Sets';
import {bounce} from '../nolan/scenes1';
import {BAIKAL, DIVE, FOOT_G, LAND, POP, STEP_N, TEAR, V3, lerp, ramp, rnd, shotEnd, shotStart} from './cues';
import {BaikalLand, Bucket, Coil2, Crack, EarthCut, Kangaroo, Palm2, Pit, Spade, TRAMP, Trampoline, Yard} from './Sets';

const S = shotStart;
const E = shotEnd;

// ballistic fall: 0 before t0, then height drops from h to 0 at t1
export const drop = (v: number, t0: number, t1: number, h: number) => (v >= t1 ? 0 : v <= t0 ? h : h * (1 - ((v - t0) / (t1 - t0)) ** 2));

export const SpaceLights: React.FC<{k?: number}> = ({k = 1}) => (
  <>
    <ambientLight intensity={0.45 * k} color="#9aa8d8" />
    <directionalLight position={[10, 6, 9]} intensity={2.4 * k} color="#fff4e0" />
    <directionalLight position={[-8, -2, 6]} intensity={0.5 * k} color="#c8d8ff" />
  </>
);

// puffs of dust/sand that fly out from an impact
export const Puffs: React.FC<{t: number; center: V3; color?: string; n?: number; r?: number; seed?: number}> = ({t, center, color = '#e8d4a8', n = 12, r = 1.2, seed = 1}) =>
  t <= 0 || t > 1.6 ? null : (
    <>
      {Array.from({length: n}).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + rnd(seed + i) * 0.5;
        const k = 1 - Math.exp(-t * 4);
        const d = r * (0.5 + 0.5 * rnd(seed * 3 + i)) * k;
        return <Ball key={i} position={[center[0] + Math.cos(a) * d, center[1] + 0.1 + 0.4 * k * rnd(i * 7), center[2] + Math.sin(a) * d]} scale={0.07 + 0.14 * k} color={color} look={{rough: 1, opacity: Math.max(0, 0.5 * (1 - t / 1.2))}} shadow={false} receive={false} />;
      })}
    </>
  );

// ======================================================================= 0. intro: a yard, two mothers land side by side, the asphalt cracks

const G_X = -0.44;
const N_X = 0.44;
export const introScene: Scene = {
  view: (v): View => mv(v, 0, E('intro'), [0.0, 0.32, 3.6], [0.15, 0.38, 3.15], [0, 0.5, 0], [0, 0.42, 0], [42, 40], 0.3),
  shakes: [[LAND, 0.25]],
  render: (v) => {
    const lg = LAND;
    const ln = LAND + 0.12;
    return (
      <>
        <Sky top="#6aa8e8" mid="#cfe6f6" low="#eef6fa" />
        <ForestLight k={1.0} sun={[-6, 10, 6]} shadowBox={5} warm={1} />
        <Yard />
        <Mom who="g" position={[G_X, drop(v, lg - 0.5, lg, 3.2), 0]} rotation={0.12} hem={3} squash={bounce(v, lg)} />
        <Mom who="n" position={[N_X, drop(v, ln - 0.5, ln, 3.2), 0]} rotation={-0.12} hem={3} squash={bounce(v, ln)} />
        {v > lg ? <Crack position={[G_X, 0, 0]} k={ease(v, lg, lg + 0.25)} seed={3} /> : null}
        {v > ln ? <Crack position={[N_X, 0, 0]} k={ease(v, ln, ln + 0.25)} seed={7} /> : null}
      </>
    );
  },
};

// ======================================================================= 1a. beach: Gaben's mother sinks a metre into the sand

const Beach: React.FC<{v: number}> = ({v}) => (
  <>
    <Sky top="#5fa8e8" mid="#bfe2f6" low="#e8f4fa" />
    <ForestLight k={1.05} sun={[-6, 10, 6]} shadowBox={5} warm={1} />
    <Block position={[0, -0.5, 2]} size={[40, 1, 16]} color="#f0d49a" />
    <Water y={-0.02} color="#2f96cc" center={[0, 0, -26]} size={60} />
    <Foam v={v} y={-0.02} n={24} area={[-12, 12, -26, -7]} seed={5} />
    <Umbrella position={[-2.2, 0, -1.6]} />
    <Towel position={[-1.6, 0, -0.9]} rotation={0.3} />
    <Towel position={[2.4, 0, -1.2]} rotation={-0.2} color="#f2a43a" />
  </>
);

export const beachGScene: Scene = {
  view: (v): View => mv(v, S('beachG'), E('beachG'), [2.6, 1.1, 4.2], [2.1, 0.95, 3.6], [0, 0.5, 0], [0, 0.3, 0], [44, 42], 0.2),
  shakes: [[FOOT_G, 0.15]],
  render: (v) => {
    const sink = 0.55 * ease5(v, FOOT_G, FOOT_G + 0.45);
    const y = drop(v, FOOT_G - 0.35, FOOT_G, 0.5) - sink;
    const pk = ease(v, FOOT_G, FOOT_G + 0.3);
    const tip = ease(v, FOOT_G + 0.3, FOOT_G + 0.8);
    return (
      <>
        <Beach v={v} />
        <Pit position={[0, 0, 0]} k={pk} s={3.4} />
        <Mom who="g" position={[0, y, 0]} rotation={0.4} hem={3} squash={bounce(v, FOOT_G, 0.08)} />
        <Bucket position={[0.95 - 0.3 * tip, -0.2 * tip, 0.55 - 0.15 * tip]} rotation={[0, 0, 1.1 * tip]} />
        <Spade position={[1.2, 0.02, 0.2]} rotation={[0, 0.4, 1.4]} />
        <Puffs t={v - FOOT_G} center={[0, 0, 0]} r={0.9} seed={4} />
      </>
    );
  },
};

// ======================================================================= 1b. beach: Nolan's mother takes one step

export const beachNScene: Scene = {
  view: (v): View => mv(v, S('beachN'), E('beachN'), [-2.6, 0.8, 4.4], [-2.2, 1.0, 3.9], [0, 0.6, 0], [0, 0.7, 0], [44, 46], 0.2),
  shakes: [[STEP_N, 0.55]],
  render: (v) => {
    const y = drop(v, STEP_N - 0.4, STEP_N, 0.55);
    return (
      <>
        <Beach v={v} />
        <Pit position={[0, 0, 0]} k={ease(v, STEP_N, STEP_N + 0.25)} s={3.6} />
        <Mom who="n" position={[0, y, 0]} rotation={-0.35} hem={3} squash={bounce(v, STEP_N, 0.12)} />
        <Puffs t={v - STEP_N} center={[0, 0, 0]} r={2.2} n={16} seed={9} />
      </>
    );
  },
};

// ======================================================================= 1c. Baikal from orbit: the footprint fills with water

const CLOUDS: {p: V3; s: number}[] = Array.from({length: 9}, (_, i) => ({p: [(rnd(i * 3) - 0.5) * 70, 26 + rnd(i * 5) * 12, (rnd(i * 7) - 0.5) * 70], s: 3 + rnd(i) * 4}));
export const baikalScene: Scene = {
  view: (v): View => {
    const k = ease5(v, S('baikal'), S('baikal') + 1.5);
    return {pos: [lerp(4, 8, k), lerp(70, 120, k), lerp(14, 30, k)], target: [0, 0, 0], fov: 50, far: 900};
  },
  noHandheld: true,
  render: (v) => {
    const fill = ease(v, BAIKAL[0], BAIKAL[1]);
    return (
      <>
        <Sky top="#4a8ad8" mid="#a8d0f0" low="#d8ecf8" />
        <ForestLight k={1.05} sun={[-30, 60, 30]} shadowBox={60} warm={1} />
        <BaikalLand fill={fill} size={140} />
        {CLOUDS.map((c, i) => (
          <Ball key={i} position={c.p} scale={[c.s, c.s * 0.35, c.s * 0.7]} color="#ffffff" look={{rough: 1, opacity: 0.9}} shadow={false} />
        ))}
      </>
    );
  },
};

// ======================================================================= 2a. trampoline: Nolan's mother tears it

const Garden: React.FC = () => (
  <>
    <Sky top="#6aa8e8" mid="#d6ecf8" low="#f0f8fa" />
    <ForestLight k={1.0} sun={[-6, 10, 6]} shadowBox={6} warm={1} />
    <Block position={[0, -0.5, 0]} size={[40, 1, 40]} color="#7ab85a" />
    {Array.from({length: 24}).map((_, i) => (
      <Block key={i} position={[-8 + i * 0.7, 0.45, -4]} size={[0.12, 0.9, 0.05]} color="#e8d8b8" />
    ))}
    <Block position={[0, 0.7, -3.97]} size={[17, 0.08, 0.05]} color="#d8c8a8" />
    {Array.from({length: 5}).map((_, i) => (
      <Tree key={i} position={[-7 + i * 3.5, 0, -6 - rnd(i) * 2]} h={3.4 + rnd(i * 3)} seed={i + 11} />
    ))}
  </>
);

const springsOut = (v: number, at: number, seed: number) =>
  v < at
    ? null
    : Array.from({length: 8}).map((_, i) => {
        const t = v - at;
        const a = (i / 8) * Math.PI * 2 + rnd(seed + i) * 0.4;
        const sp = 1.2 + rnd(seed + i) * 1.2;
        const vy = 3 + rnd(seed * 2 + i) * 2;
        const y = Math.max(0.03, TRAMP.y + vy * t - 4.9 * t * t);
        return <Coil2 key={i} position={[Math.cos(a) * (TRAMP.r + sp * Math.min(t, 0.9)), y, Math.sin(a) * (TRAMP.r + sp * Math.min(t, 0.9))]} rotation={[t * 8 + i, t * 5, 0]} s={3} />;
      });

export const trampNScene: Scene = {
  view: (v): View => mv(v, S('trampN'), E('trampN'), [2.6, 1.7, 3.8], [2.1, 1.3, 3.2], [0, 1.0, 0], [0, 0.7, 0], [44, 44], 0.2),
  shakes: [[TEAR, 0.35]],
  render: (v) => {
    const land = TEAR - 0.12;
    const sag = v < land ? 0.06 : v < TEAR ? lerp(0.06, 0.45, ramp(v, land, TEAR)) : 0;
    const yAir = drop(v, land - 0.55, land, 3.2);
    const y = v < land ? TRAMP.y - 0.06 + yAir : v < TEAR ? TRAMP.y - sag : Math.max(0, TRAMP.y - 0.45 - 9.8 * (v - TEAR) ** 2 * 1.5);
    return (
      <>
        <Garden />
        <Trampoline sag={sag} torn={v >= TEAR ? ease(v, TEAR, TEAR + 0.3) : 0} />
        <Mom who="n" position={[0, y, 0]} rotation={-0.3} hem={3} squash={bounce(v, TEAR + 0.25, 0.08)} />
        {springsOut(v, TEAR, 5)}
      </>
    );
  },
};

// ======================================================================= 2b. trampoline: Gaben's mother pulls it down and goes through the ground

export const trampGScene: Scene = {
  view: (v): View => {
    const base = mv(v, S('trampG'), DIVE + 0.2, [-3.4, 2.3, 4.8], [-3.0, 2.2, 4.3], [0, 1.0, 0], [0, 0.8, 0], [46, 46], 0.2);
    const k = ease5(v, DIVE + 0.2, E('trampG'));
    return {...base, pos: [base.pos[0] * (1 - 0.25 * k), base.pos[1] + 2.4 * k, base.pos[2] * (1 - 0.25 * k)], target: [0, lerp(0.8, -0.3, k), 0]};
  },
  shakes: [[DIVE, 0.3], [DIVE + 0.7, 0.4]],
  render: (v) => {
    const land = DIVE;
    const sag = v < land ? 0.06 : 0.06 + 3.5 * ease(v, land, E('trampG') + 0.3) ** 1.4;
    const yAir = drop(v, land - 0.55, land, 3.2);
    const y = v < land ? TRAMP.y - 0.06 + yAir : TRAMP.y - sag;
    const hole = ramp(sag, 0.6, 1.0);
    return (
      <>
        <Garden />
        <Trampoline sag={sag} />
        {hole > 0 ? (
          <>
            <Ball position={[0, 0.006, 0]} scale={[0.95 * hole, 0.004, 0.95 * hole]} color="#1a120c" look={{rough: 1}} shadow={false} />
            <Crack position={[0, 0, 0]} k={hole} seed={13} r0={0.9} len={0.9} color="#3a2a14" />
          </>
        ) : null}
        <Mom who="g" position={[0, y, 0]} rotation={0.3} hem={3} />
        <Puffs t={v - DIVE - 0.6} center={[0, 0, 0]} color="#8a6a40" r={1.6} seed={21} />
      </>
    );
  },
};

// ======================================================================= 2c. the Earth cut in half: she falls through the core

export const coreScene: Scene = {
  view: (v): View => mv(v, S('core'), E('core'), [0.6, 0.6, 14.5], [-0.2, -0.3, 12.5], [0, 0.3, 0], [0, -0.4, 0], [46, 44]),
  render: (v) => {
    const k = ease(v, S('core') - 0.1, E('core') + 0.15);
    const y = lerp(4.6, -4.7, k);
    return (
      <>
        <color attach="background" args={['#05060f']} />
        <Stars radius={300} size={2} />
        <SpaceLights />
        <EarthCut r={4} />
        {/* the dotted path through the centre */}
        {Array.from({length: 17}).map((_, i) => (
          <Ball key={i} position={[0, 4 - i * 0.5, 0.2]} scale={0.04} color="#ffffff" look={{basic: true, opacity: 0.7}} shadow={false} />
        ))}
        <MomBack who="g" position={[0, y, 0.6]} rotation={[0, Math.PI, 0]} scale={0.5} />
        <Glow position={[0, y + 0.4, 0.8]} size={1.2} color="#ffd0e4" k={0.6} />
      </>
    );
  },
};

// ======================================================================= 2d. Australia: she comes out of the sand upside down, a kangaroo jumps away

export const aussieScene: Scene = {
  view: (v): View => mv(v, S('aussie'), E('aussie'), [1.9, 0.5, 2.9], [1.6, 0.58, 2.4], [0, 0.72, 0], [0, 0.78, 0], [44, 44], 0.2),
  shakes: [[POP, 0.3]],
  render: (v) => {
    const k = ease5(v, POP - 0.25, POP + 0.12);
    const H = lerp(-0.8, 0.78, k) + (v > POP + 0.12 ? 0.04 * Math.exp(-(v - POP) * 6) * Math.sin((v - POP) * 20) : 0);
    const fear = ease(v, POP + 0.1, POP + 0.4);
    const hopT = v - POP - 0.15;
    const hop = hopT > 0 && hopT < 0.6 ? 0.9 * Math.sin((Math.PI * hopT) / 0.6) : 0;
    return (
      <>
        <Sky top="#4a9ae8" mid="#f2d8a8" low="#f8e8c8" />
        <ForestLight k={1.1} sun={[6, 10, 6]} shadowBox={6} warm={1} />
        <Block position={[0, -0.5, 2]} size={[40, 1, 16]} color="#f2c47a" />
        <Water y={-0.02} color="#29a0c8" center={[0, 0, -26]} size={60} />
        <Foam v={v} y={-0.02} n={24} area={[-12, 12, -26, -7]} seed={7} />
        <Palm2 position={[-2.4, 0, -1.6]} seed={2} />
        <Palm2 position={[2.8, 0, -2.6]} h={3.1} seed={5} />
        <Kangaroo position={[0.75 + 0.5 * fear, 0, -1.3 - 0.6 * fear]} rotation={-0.6 - 0.8 * fear} hop={hop} scared={fear} />
        <group position={[0, H, 0]} rotation={[Math.PI, 0.5, 0]}>
          <Mom who="g" hem={3} />
        </group>
        <Pit position={[0, 0, 0]} k={ease(v, POP - 0.2, POP)} s={3.2} color="#d8a85a" />
        <Puffs t={v - POP + 0.15} center={[0, 0, 0]} color="#f2d49a" r={1.4} seed={31} />
      </>
    );
  },
};

export {Block};
