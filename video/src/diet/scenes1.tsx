import React from 'react';
import {Human, Outfit} from '../bear/People';
import {Sky, ForestLight} from '../bear/Forest';
import {Ball, Block, Cyl, Glow, RBox} from '../bear/kit';
import {Scene, ease, ease5, mv} from '../bear/common';
import {InteriorLights} from '../cs2/scenes1';
import {Stars} from '../gta/Space';
import type {View} from '../slime/camera';
import {Dinghy, Dots, Foam, Mom, MomBack, ToyEarth, ToyMoon, Umbrella, VeniceHouse, Water} from '../nolan/Sets';
import {SpaceLights, bounce} from '../nolan/scenes1';
import {KICK, KICK2, MOON_GO, PLATE, PLATE2, RINGS, RUN, TIDE, V3, lerp, lerp3, ramp, rnd, shotEnd, shotStart} from './cues';
import {ClockTower, DonutBox, Kitchen, SaladPlate, Surfboard, SaturnRings, TextScale} from './Sets';

const S = shotStart;
const E = shotEnd;
const drop = (v: number, t0: number, t1: number, h: number) => (v >= t1 ? 0 : v <= t0 ? h : h * (1 - ((v - t0) / (t1 - t0)) ** 2));

// ======================================================================= hook / monday: the kitchen, kick the donuts away, salad lands

const kitchenRender = (v: number, kick: number, plate: number, calendar?: string) => {
  // the right foot swings forward-right at `kick`, the box slides off to the right
  const sw = ramp(v, kick - 0.25, kick) * (1 - ramp(v, kick + 0.15, kick + 0.45));
  const slide = ease5(v, kick - 0.02, kick + 0.6);
  const boxP: V3 = [0.42 + slide * 2.6, 0, 0.18 + slide * 0.4];
  const py = drop(v, plate - 0.45, plate, 1.6);
  const plateOn = v > plate - 0.45;
  return (
    <>
      <color attach="background" args={['#f6e6d4']} />
      <InteriorLights key1={[1.8, 5, 4]} k={1.0} box={3} warm="#fff2dc" sky="#fff6ea" ground="#9a8070" />
      <Kitchen calendar={calendar} />
      <TextScale position={[0, 0, 0]} text={plateOn && v > plate ? 'ДИЕТА' : '???'} color={plateOn && v > plate ? '#7dffb0' : '#ff6a5a'} k="hook-scale" />
      <Mom who="g" position={[0, 0.066, -0.02]} hem={3} feet={{liftR: 0.12 * sw, toeR: -0.5 * sw}} squash={bounce(v, plate, 0.05)} />
      <DonutBox position={boxP} rotation={[0, -0.3 - slide * 1.2, 0]} />
      {plateOn ? <SaladPlate position={[-0.08, py, 0.42]} rotation={[0, 0.4, 0]} scale={1.15} /> : null}
    </>
  );
};

const kitchenView = (v: number, t0: number, t1: number): View => mv(v, t0, t1, [1.25, 0.95, 2.7], [0.85, 0.8, 2.25], [0.3, 0.12, 0.15], [0.2, 0.14, 0.15], [42, 42], 0.15);

export const hookScene: Scene = {
  view: (v) => kitchenView(v, 0, E('hook')),
  shakes: [[PLATE, 0.1]],
  render: (v) => kitchenRender(v, KICK, PLATE),
};

export const mondayScene: Scene = {
  view: (v) => kitchenView(v, S('monday'), E('monday')),
  shakes: [[PLATE2, 0.1]],
  render: (v) => kitchenRender(v, KICK2, PLATE2, 'ПОНЕДЕЛЬНИК'),
};

// ======================================================================= day 1: the Moon leaves her (p: 0 = on orbit, 1 = gone)

export const EARTH_C: V3 = [-4.2, 1.6, -6];
export const GIANT: {p: V3; s: number} = {p: [3.6, -5.8, -3], s: 6};
export const GC: V3 = [GIANT.p[0], 0.9, GIANT.p[2]];

const moonPos = (v: number, p: number): V3 => {
  const a = 2.6 + v * 1.1;
  const orbit: V3 = [GC[0] + Math.cos(a) * 4.6, GC[1] + Math.sin(a) * 0.6, GC[2] + Math.sin(a) * 4.6];
  // flies off to the upper left, past the Earth, into the dark
  const away: V3 = [-30, 14, -40];
  const q = p * p;
  return lerp3(orbit, away, q);
};

const spaceMoon = (v: number, p: number, slim: number) => (
  <>
    <color attach="background" args={['#05060f']} />
    <Stars radius={300} size={2} />
    <SpaceLights />
    <ToyEarth r={1.6} spin={v * 0.1} position={EARTH_C} />
    <Dots center={GC} r={4.6} opacity={0.65 * (1 - Math.min(1, p * 2))} n={90} />
    <ToyMoon position={moonPos(v, p)} r={0.8} />
    <MomBack who="g" position={GIANT.p} rotation={[0, Math.PI - 0.3, 0]} scale={GIANT.s} squash={1} feet={{}} />
    {/* she gets a tiny bit slimmer: a soft pink "puff" leaves */}
    {slim > 0 && slim < 1 ? <Ball position={[GC[0] + 2.4 * slim, GC[1] + 1.2, GC[2] + 1.5]} scale={0.6 * (1 - slim)} color="#ffc4dc" look={{opacity: 0.6 * (1 - slim), rough: 1}} shadow={false} /> : null}
    <Glow position={[16, 8, -30]} size={10} color="#fff1c8" k={0.6} />
  </>
);

export const moonScene: Scene = {
  view: (v): View => mv(v, S('moon'), E('moon'), [-1.2, 1.4, 25], [0.2, 1.9, 22.6], [-0.6, 1.4, -2], [-1.6, 1.8, -3], [48, 50]),
  render: (v) => spaceMoon(v, ease(v, MOON_GO[0], MOON_GO[1] + 0.3), ramp(v, MOON_GO[0] - 0.6, MOON_GO[0] + 0.6)),
};

export const rwMoonScene: Scene = {
  view: (v): View => mv(v, S('rwMoon'), E('rwMoon'), [0.2, 1.9, 22.6], [-1.2, 1.4, 25], [-1.6, 1.8, -3], [-0.6, 1.4, -2], [50, 48]),
  render: (v) => spaceMoon(v, 1 - ease5(v, S('rwMoon'), S('rwMoon') + 1.0), 0),
};

// ======================================================================= day 1b: the beach drains (sea: 0 = normal, 1 = gone, >1 = flood back)

const SURFER: Outfit = {skin: '#e8b890', hair: '#f2d27a', hairStyle: 'short', top: '#2a6ad8', topStyle: 'hoodie', legs: '#1c2a5a', legStyle: 'pants', shoes: '#f0c2a0', iris: '#3a5a8a'};
const SLOPE = 0.12;
const bedY = (z: number) => (z > -1 ? -0.05 : -0.05 - (-1 - z) * SLOPE);

const beachRender = (v: number, sea: number, panic: number, flood = 0) => {
  const wy = lerp(-0.02, -3.2, sea) + flood;
  const boats: V3[] = [[-1.6, 0, -7], [2.2, 0, -10], [-3.4, 0, -13]];
  return (
    <>
      <Sky top="#5fa8e8" mid="#bfe2f6" low="#e8f4fa" />
      <ForestLight k={1.05} sun={[-6, 10, 6]} shadowBox={7} warm={1} />
      <Block position={[0, -0.55, 4]} size={[50, 1, 10]} color="#f0d49a" />
      {/* the sea bed, wet sand going down and away */}
      <mesh position={[0, -0.05 - 20 * Math.sin(SLOPE), -1 - 20 * Math.cos(SLOPE)]} rotation={[-Math.PI / 2 - SLOPE, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 40]} />
        <meshStandardMaterial color="#c8a870" roughness={0.9} />
      </mesh>
      {/* starfish and shells on the bed */}
      {Array.from({length: 14}).map((_, i) => {
        const z = -1.5 - rnd(i * 3) * 14;
        const x = (rnd(i * 5) - 0.5) * 10;
        return <Ball key={i} position={[x, bedY(z) + 0.03, z]} scale={[0.12, 0.03, 0.12]} color={i % 2 ? '#f27a4a' : '#f6e6d0'} />;
      })}
      {boats.map((b, i) => (
        <Dinghy key={i} position={[b[0], bedY(b[2]) + 0.02, b[2]]} rotation={[-SLOPE, 0.4 + i, 0.12 * (i % 2 ? 1 : -1)]} />
      ))}
      <Water y={wy} color="#2f96cc" center={[0, 0, -30]} size={140} />
      <Foam v={v} y={wy} n={30} area={[-12, 12, -40, -2]} seed={5} />
      <Umbrella position={[-3.2, 0, 1.2]} />
      <Human o={SURFER} position={[-0.6, 0, -0.5]} rotation={Math.PI + 0.7} pose={{head: [0.1 - 0.2 * panic, 0.4, 0], armL: [-0.3, 0.3, 0], elbowL: -0.5, armR: [-0.6 - 1.2 * panic, -0.2, 0], elbowR: -0.6, face: {look: [0.2, 0], brow: 0.3}}} />
      <Surfboard position={[-1.15, 0, -0.65]} rotation={[0, 0.7, -0.12]} />
    </>
  );
};

export const beachScene: Scene = {
  view: (v): View => mv(v, S('beach'), E('beach'), [1.2, 2.0, 4.6], [0.7, 2.9, 3.8], [-0.6, 0.0, -5], [-0.6, -1.0, -9], [48, 50], 0.2),
  render: (v) => beachRender(v, ease(v, TIDE[0], TIDE[1]), 0),
};

export const rwBeachScene: Scene = {
  view: (v): View => mv(v, S('rwBeach'), E('rwBeach'), [0.7, 2.9, 3.8], [0.6, 1.4, 4.4], [-0.6, -1.0, -9], [-1.0, 0.4, -1], [50, 46]),
  render: (v) => {
    const t0 = S('rwBeach');
    const back = ease(v, t0, t0 + 1.2);
    const over = ease(v, t0 + 1.0, t0 + 1.9) * 0.9;
    return beachRender(v, 1 - back, 1, over);
  },
};

// ======================================================================= day 2: she runs on the Earth like on a treadmill

const ER = 4;
const spinAt = (v: number) => {
  const t = Math.max(0, v - RUN[0]);
  return 0.25 * t + 0.32 * t * t;
};

export const runScene: Scene = {
  view: (v): View => mv(v, S('run'), E('run'), [15, 6.2, 10], [12.5, 7.2, 13], [0, 4.0, 0], [0, 4.4, 0], [46, 48]),
  render: (v) => {
    const sp = 6 + 10 * ramp(v, RUN[0], RUN[1]);
    const ph = (v - RUN[0]) * sp;
    const on = v > RUN[0] ? 1 : 0;
    const liftL = on * Math.max(0, Math.sin(ph)) * 0.14;
    const liftR = on * Math.max(0, -Math.sin(ph)) * 0.14;
    return (
      <>
        <color attach="background" args={['#05060f']} />
        <Stars radius={300} size={2} />
        <SpaceLights />
        <group rotation={[-spinAt(v), 0, 0]}>
          <ToyEarth r={ER} />
        </group>
        {/* speed streaks behind her */}
        {Array.from({length: 8}).map((_, i) => {
          const k = ramp(v, RUN[0] + 1, RUN[1]);
          const z = -2 - ((v * 9 + i * 1.7) % 12);
          return k > 0 ? <RBox key={i} position={[(rnd(i) - 0.5) * 2, ER + 0.4 + rnd(i * 3) * 2.5, z]} size={[0.06, 0.06, 1.6]} r={0.02} color="#ffffff" look={{basic: true, opacity: 0.5 * k}} shadow={false} /> : null;
        })}
        <Mom who="g" position={[0, ER - 0.05, 0]} rotation={0} scale={2.6} hem={1.4} feet={{liftL, liftR, toeL: liftL * 2, toeR: liftR * 2}} sway={0.04 * Math.sin(ph)} />
        <Glow position={[-16, 9, -30]} size={10} color="#fff1c8" k={0.6} />
      </>
    );
  },
};

// ======================================================================= day 2b: the city, the sun whizzes round, 3-hour days

const CITY: {x: number; z: number; w: number; h: number}[] = Array.from({length: 10}, (_, i) => ({
  x: i % 2 ? 4.2 : -4.2,
  z: 6 - Math.floor(i / 2) * 3.4,
  w: 3,
  h: 4 + rnd(i * 5) * 3,
}));

export const cityScene: Scene = {
  view: (v): View => mv(v, S('city'), E('city'), [0.6, 1.7, 13], [-0.4, 2.4, 10.5], [0, 5.5, -6], [0, 6.2, -6], [50, 48]),
  render: (v) => {
    const t = v - S('city');
    const a = t * Math.PI * 2 * 0.9 - 0.6;
    const day = Math.max(0, Math.sin(a + 1.2));
    const sun: V3 = [Math.cos(a + 1.2) * 34, -4 + Math.sin(a + 1.2) * 26, -50];
    const lc = (x: number, y: number) => Math.round(lerp(x, y, day));
    const bg = `rgb(${lc(14, 120)},${lc(18, 186)},${lc(48, 240)})`;
    return (
      <>
        <color attach="background" args={[bg]} />
        <ambientLight intensity={0.35 + 0.5 * day} color={day > 0.3 ? '#ffffff' : '#7080c0'} />
        <directionalLight position={[sun[0] * 0.3, Math.max(2, sun[1]), 10]} intensity={0.3 + 2.0 * day} color="#fff2dc" />
        <Ball position={sun} scale={3.2} color="#ffd23f" look={{basic: true}} shadow={false} />
        <Ball position={[-sun[0], -8 - (sun[1] + 4), -50]} scale={2.2} color="#e8e8f0" look={{basic: true}} shadow={false} />
        <Block position={[0, -0.5, 0]} size={[40, 1, 40]} color="#8a8a92" />
        <Block position={[0, 0.005, 0]} size={[4.6, 0.01, 40]} color="#4a4a52" shadow={false} />
        {Array.from({length: 8}).map((_, i) => (
          <Block key={i} position={[0, 0.012, 8 - i * 3]} size={[0.15, 0.004, 1.2]} color="#f2f2f2" shadow={false} />
        ))}
        {CITY.map((h, i) => (
          <VeniceHouse key={i} position={[h.x, 0, h.z]} rotation={h.x > 0 ? -Math.PI / 2 : Math.PI / 2} w={h.w} h={h.h} i={i + 2} />
        ))}
        <ClockTower position={[0, 0, -9]} a={t * Math.PI * 2 * 0.9 * 2} />
        {/* street lamps blink on at night */}
        {[-2.6, 2.6].map((x) =>
          [3, -1.5].map((z) => (
            <group key={`${x}${z}`} position={[x, 0, z]}>
              <Cyl position={[0, 1.4, 0]} rt={0.05} rb={0.06} h={2.8} seg={8} color="#3a3a42" />
              <Ball position={[0, 2.85, 0]} scale={0.16} color={day < 0.25 ? '#fff2a8' : '#c8c8d0'} look={day < 0.25 ? {basic: true} : {}} shadow={false} />
            </group>
          )),
        )}
      </>
    );
  },
};

// ======================================================================= day 3: Saturn gives her its rings back (p: 0 at Saturn, 1 on her waist)

const SAT: V3 = [-7.5, 3.2, -8];
const SAT_R = 1.9;
const SG = {p: [3.4, -6.2, -2] as V3, s: 5.4};
const WAIST: V3 = [SG.p[0], SG.p[1] + 1.25 * SG.s, SG.p[2]];

const ringsAt = (v: number, p: number): {pos: V3; rot: V3; r: number} => {
  const k = p;
  const at: V3 = lerp3(SAT, WAIST, k);
  at[1] += Math.sin(Math.PI * k) * 3;
  const r = lerp(SAT_R * 1.8, 0.48 * SG.s, k);
  const tilt = lerp(0.45, 0.08, k);
  if (k >= 1) {
    // hula: the hoop's centre circles round her waist
    const w = (v - RINGS[1]) * 7;
    return {pos: [WAIST[0] + Math.cos(w) * 0.35, WAIST[1] + 0.12 * Math.sin(w * 0.5), WAIST[2] + Math.sin(w) * 0.35], rot: [0.08 * Math.sin(w), 0, 0.08 * Math.cos(w)], r};
  }
  return {pos: at, rot: [tilt, k * 4, 0.2 * (1 - k)], r};
};

const saturnRender = (v: number, p: number) => {
  const rg = ringsAt(v, p);
  return (
    <>
      <color attach="background" args={['#05060f']} />
      <Stars radius={300} size={2} />
      <SpaceLights />
      <Ball position={SAT} scale={SAT_R} seg={48} color="#e8c88a" look={{rough: 0.7, rim: '#ffffff', rimK: 0.2}} />
      {[0.35, -0.2, 0.7].map((y, i) => (
        <Ball key={i} position={[SAT[0], SAT[1] + y * SAT_R, SAT[2]]} scale={[SAT_R * 1.003 * Math.sqrt(1 - y * y), SAT_R * 0.08, SAT_R * 1.003 * Math.sqrt(1 - y * y)]} color="#d8a86a" shadow={false} />
      ))}
      <SaturnRings r={rg.r} position={rg.pos} rotation={rg.rot} />
      <MomBack who="g" position={SG.p} rotation={[0, Math.PI - 0.25, 0]} scale={SG.s} />
      <Glow position={[16, 10, -30]} size={10} color="#fff1c8" k={0.5} />
    </>
  );
};

export const saturnScene: Scene = {
  view: (v): View => mv(v, S('saturn'), E('saturn'), [-3.4, 2.6, 26], [-1.4, 2.2, 28], [-2.6, 2.0, -4], [-0.6, 1.6, -3], [50, 50]),
  render: (v) => saturnRender(v, ease5(v, RINGS[0], RINGS[1])),
};

export const rwSaturnScene: Scene = {
  view: (v): View => mv(v, S('rwSaturn'), E('rwSaturn'), [-1.4, 2.2, 28], [-3.4, 2.6, 26], [-0.6, 1.6, -3], [-2.6, 2.0, -4], [50, 50]),
  render: (v) => saturnRender(v, 1 - ease5(v, S('rwSaturn'), S('rwSaturn') + 0.9)),
};

export {Cyl};
