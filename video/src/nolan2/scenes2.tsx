import React from 'react';
import {Sky, ForestLight} from '../bear/Forest';
import {Ball, Block, Cyl, Glow, RBox, Ring} from '../bear/kit';
import {Table} from '../bear/Props';
import {Scene, ease, ease5, mv} from '../bear/common';
import {Stars} from '../gta/Space';
import {InteriorLights} from '../cs2/scenes1';
import {CalPage} from '../hl3gta/Sets';
import type {View} from '../slime/camera';
import {Mom, ToyEarth} from '../nolan/Sets';
import {bounce} from '../nolan/scenes1';
import {BOX, EARTH_TILT, LAUNCH, MINUS, REWIND, SIT, STAR, SUMMER, TILT_G, V3, WIN, lerp, lerp3, ramp, rnd, shotEnd, shotStart} from './cues';
import {Crt, GameBox, HandClock, Runway, Seesaw, SitMom, SnowCity, Snowman, StarShape, ToyPlane, Yard, seatPos} from './Sets';
import {Puffs, SpaceLights, drop} from './scenes1';

const S = shotStart;
const E = shotEnd;

// ======================================================================= 3a. plane: Gaben's mother at the window, the plane leans

const WIN_P: V3 = [-0.36, 0.88, 0.06];
const Sparks: React.FC<{t: number; at: V3}> = ({t, at}) =>
  t <= 0 ? null : (
    <>
      {Array.from({length: 14}).map((_, i) => {
        const ph = (t * 3 + rnd(i)) % 1;
        const a = rnd(i * 3) * Math.PI - Math.PI / 2;
        return <Ball key={i} position={[at[0] + Math.sin(a) * ph * 0.8, at[1] + ph * 0.5 - ph * ph * 0.6, at[2] - ph * 1.6]} scale={0.03} color={i % 2 ? '#ffd23f' : '#ff8a1e'} look={{basic: true}} shadow={false} />;
      })}
      <Glow position={at} size={0.9} color="#ffb84a" k={0.8} />
    </>
  );

const planeRoll = (v: number) => 0.33 * ease5(v, TILT_G - 0.25, TILT_G + 0.1);
export const planeGScene: Scene = {
  view: (v): View => {
    const k = ease5(v, S('planeG') + 0.6, TILT_G - 0.1);
    return {pos: lerp3([-1.35, 0.98, 0.75], [-5.6, 2.1, 6.4], k), target: lerp3([-0.3, 0.88, 0.0], [-0.6, 0.6, 0], k), fov: lerp(36, 44, k), far: 900};
  },
  shakes: [[TILT_G + 0.1, 0.3]],
  render: (v) => (
    <>
      <Sky top="#6aa8e8" mid="#d6ecf8" low="#f0f8fa" />
      <ForestLight k={1.05} sun={[-6, 10, 6]} shadowBox={7} warm={1} />
      <Runway />
      <ToyPlane who="g" roll={planeRoll(v)} />
      <Sparks t={v - TILT_G - 0.05} at={[-2.05, 0.05, 0.1]} />
    </>
  ),
};

// ======================================================================= 3b. plane: Nolan's mother at the window

export const planeNScene: Scene = {
  view: (v): View => mv(v, S('planeN'), E('planeN'), [-1.35, 0.98, 0.75], [-2.3, 1.15, 1.6], [-0.3, 0.88, 0.0], [-0.3, 0.86, 0.0], [36, 38], 0.1),
  render: (v) => (
    <>
      <Sky top="#6aa8e8" mid="#d6ecf8" low="#f0f8fa" />
      <ForestLight k={1.05} sun={[-6, 10, 6]} shadowBox={7} warm={1} />
      <Runway />
      <ToyPlane who="n" roll={0.03 * Math.sin(v * 2)} />
    </>
  ),
};
export {WIN_P};

// ======================================================================= 3c. space: the whole Earth tilts on its axis

export const tiltScene: Scene = {
  view: (v): View => mv(v, S('tilt'), E('tilt'), [1.0, 0.6, 19.5], [-0.6, 0.2, 17.0], [0, 0, 0], [0, 0, 0], [44, 46]),
  shakes: [[EARTH_TILT[0], 0.25]],
  render: (v) => {
    const tilt = 0.41 + 0.75 * ease5(v, EARTH_TILT[0], EARTH_TILT[1]);
    return (
      <>
        <color attach="background" args={['#05060f']} />
        <Stars radius={300} size={2} />
        <SpaceLights />
        <Glow position={[16, 6, -30]} size={14} color="#fff1c8" k={0.7} />
        <group rotation={[0, 0, -tilt]}>
          <ToyEarth r={3} spin={v * 0.4} />
          <Cyl rt={0.05} rb={0.05} h={8.4} seg={10} color="#e8453c" />
          <Ball position={[0, 4.2, 0]} scale={0.12} color="#e8453c" />
        </group>
      </>
    );
  },
};

// ======================================================================= 3d. Moscow in November: the snow melts, summer

export const moscowScene: Scene = {
  view: (v): View => mv(v, S('moscow'), E('moscow'), [4.2, 1.5, 8.6], [3.2, 1.3, 7.0], [0.4, 2.2, 0], [0.9, 1.6, 0], [46, 44], 0.3),
  render: (v) => {
    const melt = ease(v, SUMMER - 0.15, SUMMER + 0.9);
    return (
      <>
        <Sky top={melt > 0.5 ? '#4a9ae8' : '#9aa8b8'} mid={melt > 0.5 ? '#bfe2f6' : '#c8d0d8'} low={melt > 0.5 ? '#eef6fa' : '#dfe4ea'} />
        <ForestLight k={0.8 + 0.35 * melt} sun={[-6, 10, 6]} shadowBox={9} warm={melt > 0.5 ? 1 : 0} />
        <SnowCity melt={melt} />
        <Snowman position={[1.4, 0, 3.6]} melt={melt} />
        {melt > 0.2 ? <Glow position={[-12, 14, -30]} size={10} color="#fff1c8" k={melt} /> : null}
      </>
    );
  },
};

// ======================================================================= 4a. clocks: next to Nolan's mother time slips by one minute

const Room: React.FC<{sepia?: number}> = () => (
  <>
    <color attach="background" args={['#e8dcc8']} />
    <InteriorLights key1={[-2, 5, 4]} k={1.0} box={4} warm="#fff0dc" sky="#fff6ea" ground="#9a8070" />
    <Block position={[0, -0.05, 0]} size={[10, 0.1, 8]} color="#b88a5a" />
    <Block position={[0, 2.5, -1.4]} size={[10, 5, 0.1]} color="#e8d8b8" />
    <Block position={[0, 0.06, -1.33]} size={[10, 0.12, 0.04]} color="#8a5a3a" />
  </>
);

export const clockNScene: Scene = {
  view: (v): View => mv(v, S('clockN'), E('clockN'), [-0.9, 1.55, 3.3], [-0.6, 1.65, 2.8], [0.35, 1.5, -0.8], [0.3, 1.65, -1.0], [42, 40], 0.15),
  shakes: [[MINUS, 0.12]],
  render: (v) => {
    const back = v < MINUS ? 0 : 1 - 0.15 * Math.exp(-(v - MINUS) * 8) * Math.cos((v - MINUS) * 30);
    return (
      <>
        <Room />
        <HandClock position={[-0.3, 2.0, -1.3]} minutes={610 - back} />
        <Mom who="n" position={[0.95, 0, -0.55]} rotation={-0.4} hem={3} />
      </>
    );
  },
};

// ======================================================================= 4b. clocks: next to Gaben's mother it is still 2004

export const clockGScene: Scene = {
  view: (v): View => mv(v, S('clockG'), E('clockG'), [0.9, 1.5, 3.4], [0.5, 1.4, 2.8], [-0.3, 1.35, -0.8], [-0.25, 1.25, -0.9], [44, 42], 0.15),
  render: (v) => {
    const k = ease(v, REWIND[0], REWIND[1]);
    const year = Math.round(lerp(2026, 2004, k));
    const minutes = 610 - 9000 * ramp(v, REWIND[0], REWIND[1]) ** 1.2;
    const boxY = drop(v, BOX - 0.35, BOX, 0.8);
    return (
      <>
        <Room />
        <HandClock position={[0.5, 2.35, -1.3]} minutes={minutes} r={0.36} />
        <group position={[-0.75, 1.55, -1.33]} scale={0.6}>
          <RBox position={[0, 0, -0.03]} size={[1.6, 1.35, 0.04]} r={0.02} color="#c8955e" />
          <CalPage year={year} position={[0, 0, 0.0]} />
        </group>
        <Table position={[0.2, 0, -0.75]} size={[1.4, 0.7]} h={0.74} top="#8a5a34" />
        <Crt position={[0.45, 0.74, -0.85]} rotation={-0.2} />
        {v > BOX - 0.35 ? <GameBox position={[-0.2, 0.74 + boxY, -0.6]} rotation={[0, 0.25, 0]} scale={0.9} /> : null}
        <Mom who="g" position={[-1.3, 0, -0.35]} rotation={0.45} hem={3} />
      </>
    );
  },
};

// ======================================================================= 5. final: one seesaw for two

export const SEE_C: V3 = [0, 0, 0];
const SLAM = 0.37;
export const seeAngle = (v: number) => {
  if (v < LAUNCH) {
    const shake = ramp(v, SIT + 0.3, LAUNCH) * 0.02 * Math.sin(v * 31) + 0.012 * Math.sin(v * 9) * ramp(v, SIT, SIT + 0.4);
    return shake;
  }
  const k = ease5(v, LAUNCH, LAUNCH + 0.14);
  return SLAM * k + (v > LAUNCH + 0.14 ? 0.02 * Math.exp(-(v - LAUNCH) * 6) * Math.sin((v - LAUNCH) * 30) : 0);
};
// where Nolan's mother is after the launch (null before)
export const nolanFlight = (v: number): {p: V3; rot: V3} | null => {
  if (v < LAUNCH + 0.08) return null;
  const t = v - LAUNCH - 0.08;
  const p0 = seatPos(1, SLAM, SEE_C);
  return {p: [p0[0] + 2.2 * t, p0[1] + 13 * t - 2.0 * t * t, p0[2] - 0.6 * t], rot: [t * 2.5, t * 1.2, -t * 4]};
};

const Crater: React.FC<{k: number}> = ({k}) =>
  k <= 0 ? null : (
    <group position={[seatPos(-1, SLAM, SEE_C)[0] - 0.1, 0, 0]}>
      <Ball position={[0, 0.006, 0]} scale={[1.15 * k, 0.004, 0.95 * k]} color="#2a2628" look={{rough: 1}} shadow={false} />
      <Ring position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[k, 0.83 * k, 0.5]} r={1.2} tube={0.13} color="#5a5e66" look={{rough: 1}} />
    </group>
  );

const seatH = (side: -1 | 1, a: number, dent: number) => seatPos(side, a, SEE_C)[1] + (side < 0 ? 0.12 * dent : 0);

export const finalScene: Scene = {
  view: (v): View => {
    const base = mv(v, S('final'), SIT + 0.6, [6.2, 2.1, 9.0], [5.0, 1.7, 7.4], [0, 1.1, 0], [0, 0.95, 0], [46, 46], 0.4);
    if (v < LAUNCH) return base;
    const fl = nolanFlight(v);
    const k = ease5(v, LAUNCH, LAUNCH + 1.0);
    const tgt: V3 = fl ? [lerp(0, fl.p[0], k * 0.6), lerp(0.85, Math.min(fl.p[1], 14), k), 0] : base.target;
    return {...base, pos: lerp3(base.pos, [3.6, 0.8, 10.5], k), target: tgt, fov: lerp(46, 52, k)};
  },
  shakes: [[SIT, 0.18], [LAUNCH, 0.6]],
  render: (v) => {
    const a = seeAngle(v);
    const on = v - (SIT - 0.45);
    const dent = ease(v, LAUNCH, LAUNCH + 0.14);
    const fl = nolanFlight(v);
    const yG = drop(v, SIT - 0.45, SIT, 2.4);
    const yN = drop(v, SIT - 0.3, SIT + 0.15, 2.4);
    return (
      <>
        <Sky top="#6aa8e8" mid="#cfe6f6" low="#eef6fa" />
        <ForestLight k={1.0} sun={[-6, 10, 6]} shadowBox={8} warm={1} />
        <Yard />
        <Crater k={dent} />
        <Seesaw
          position={SEE_C}
          angle={a}
          left={on > 0 ? <SitMom who="g" face={1} position={[0, yG, 0]} seatH={seatH(-1, a, dent) + 0.03} squash={bounce(v, SIT, 0.08)} /> : null}
          right={on > 0 && !fl ? <SitMom who="n" face={-1} position={[0, yN, 0]} seatH={seatH(1, a, 0) + 0.03} squash={bounce(v, SIT + 0.15, 0.08)} /> : null}
        />
        {fl ? (
          <group position={fl.p} rotation={fl.rot}>
            <SitMom who="n" face={-1} seatH={0.6} position={[0, -0.6, 0]} />
          </group>
        ) : null}
        <Puffs t={v - LAUNCH} center={[seatPos(-1, SLAM, SEE_C)[0], 0, 0]} color="#9a9aa2" r={2.2} n={16} seed={41} />
      </>
    );
  },
};

// ======================================================================= 6. the night sky: a new star with a pompom

export const starScene: Scene = {
  view: (v): View => mv(v, S('star'), E('star'), [0.4, 0.2, 12], [-0.2, 0.1, 9.5], [0, 0.3, 0], [0, 0.4, 0], [46, 42]),
  render: (v) => {
    const k = ease5(v, STAR - 0.25, STAR + 0.25);
    const tw = 1 + 0.06 * Math.sin(v * 9);
    return (
      <>
        <color attach="background" args={['#0a0f2a']} />
        <Stars radius={200} size={2.4} />
        <SpaceLights k={0.8} />
        <StarShape position={[0, 0.3, 0]} size={1.4} k={k * tw} spin={-0.1 + 0.05 * Math.sin(v)} />
        {k > 0 ? (
          <>
            <Ball position={[0, 0.3 + 1.6 * k * tw, 0.4]} scale={0.42 * k} color="#f4faff" look={{rough: 1, rim: '#ffffff', rimK: 0.4}} />
            <Ball position={[0.05, 0.3 + 2.0 * k * tw, 0.5]} scale={0.2 * k} color="#ffffff" look={{rough: 1}} />
            <Glow position={[0, 0.3, 0.6]} size={5 * k} color="#9ad0ff" k={0.8} />
          </>
        ) : null}
        {/* the small slipper-shaped trail she left */}
        {Array.from({length: 10}).map((_, i) => (
          <Ball key={i} position={[-3.5 + i * 0.32, -3.2 + i * 0.33, -0.5]} scale={0.04 + 0.004 * i} color="#9ad0ff" look={{basic: true, opacity: 0.25 + 0.05 * i}} shadow={false} />
        ))}
      </>
    );
  },
};

// ======================================================================= 7. back in the yard: Gaben's mother still sits there, in a crater

export const sitScene: Scene = {
  view: (v): View => {
    const p = seatPos(-1, SLAM, SEE_C);
    return mv(v, S('sit'), Math.min(E('sit'), WIN + 1), [p[0] + 3.2, 1.6, 5.6], [p[0] + 2.6, 1.4, 4.8], [p[0] + 0.7, 0.85, 0], [p[0] + 0.6, 0.8, 0], [44, 42], 0.2);
  },
  render: (v) => (
    <>
      <Sky top="#6aa8e8" mid="#cfe6f6" low="#eef6fa" />
      <ForestLight k={1.0} sun={[-6, 10, 6]} shadowBox={8} warm={1} />
      <Yard />
      <Crater k={1} />
      <Seesaw position={SEE_C} angle={SLAM} left={<SitMom who="g" face={1} position={[0, 0, 0]} seatH={seatH(-1, SLAM, 1) + 0.03} bob={0.01 * Math.sin(v * 2)} />} />
    </>
  ),
};

export {Ball, Block, Cyl, Glow, RBox, ToyEarth};
