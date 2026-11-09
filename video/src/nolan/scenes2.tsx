import React from 'react';
import {Human, Outfit} from '../bear/People';
import {Table} from '../bear/Props';
import {Sky, ForestLight, Tree} from '../bear/Forest';
import {Ball, Block, Cyl, Glow, RBox} from '../bear/kit';
import {Scene, ease, ease5, mv} from '../bear/common';
import {Pic} from '../bear/Props';
import {InteriorLights} from '../cs2/scenes1';
import {Stars} from '../gta/Space';
import {useRobe} from '../gaben/Sets';
import type {View} from '../slime/camera';
import {BIG_LAND, GLUE, HOP, LAUNCH, SEARCH, STEP_ON, V3, WIN, lerp, lerp3, ramp, shotEnd, shotStart} from './cues';
import {BALANCE, Balance, Dots, Label, LandBlob, Mom, MomBack, Planet, Seismograph, Telescope, ToyEarth, ToyMoon, panPos} from './Sets';
import {GIANT_G, SpaceLights, bounce, giantCenter} from './scenes1';

const S = shotStart;
const E = shotEnd;

// ======================================================================= 4a. jump: Gaben's mother hops, the seismograph twitches

export const quakeScene: Scene = {
  view: (v): View => mv(v, S('quake'), E('quake'), [-1.25, 0.95, 2.5], [-0.95, 0.88, 2.15], [0.15, 0.48, -0.4], [0.22, 0.45, -0.5], [42, 40], 0.1),
  shakes: [[HOP, 0.12]],
  render: (v) => {
    const k = ramp(v, HOP - 0.5, HOP);
    const y = v > HOP - 0.5 && v < HOP ? 0.28 * Math.sin(Math.PI * k) : 0;
    return (
      <>
        <color attach="background" args={['#e8dcc8']} />
        <InteriorLights key1={[-2, 5, 4]} k={1.0} box={3} warm="#fff0dc" sky="#fff6ea" ground="#9a8070" />
        <Block position={[0, -0.05, 0]} size={[8, 0.1, 8]} color="#b88a5a" />
        <Block position={[0, 2, -1.6]} size={[8, 4, 0.1]} color="#e8d8b8" />
        <RBox position={[1.4, 0.45, -1.3]} size={[1.0, 0.9, 0.5]} r={0.04} color="#8a5a3a" />
        <Table position={[-0.35, 0, 0.35]} size={[0.9, 0.6]} h={0.4} top="#6a7a8a" />
        <Seismograph position={[-0.35, 0.4, 0.38]} rotation={0.15} t={v - HOP} amp={0.22} k={`seis-${Math.round(v * 15)}`} />
        <Mom who="g" position={[0.55, y, -0.7]} rotation={-0.4} hem={3} squash={bounce(v, HOP, 0.08)} />
      </>
    );
  },
};

// ======================================================================= 4b. jump: Nolan's mother lands on the Earth, America meets Europe

const ER = 4;
const dirOf = (lon: number, lat: number): V3 => [Math.sin(lon) * Math.cos(lat), Math.sin(lat), Math.cos(lon) * Math.cos(lat)];
const glueK = (v: number) => ease5(v, BIG_LAND + 0.2, GLUE);

export const globeScene: Scene = {
  view: (v): View => mv(v, S('globe'), E('globe'), [0.6, 4.2, 24], [-0.3, 4.8, 21.5], [0, 3.6, 0], [0, 3.0, 0], [46, 45]),
  shakes: [[BIG_LAND, 0.5], [GLUE, 0.6]],
  render: (v) => {
    const g = glueK(v);
    const am = dirOf(lerp(-0.85, -0.34, g), 0.15);
    const eu = dirOf(lerp(0.85, 0.34, g), 0.2);
    const fall = v >= BIG_LAND ? 0 : 9 * (1 - ramp(v, BIG_LAND - 0.6, BIG_LAND) ** 2);
    const wob = v > BIG_LAND ? 0.05 * Math.exp(-(v - BIG_LAND) * 3) * Math.sin((v - BIG_LAND) * 18) : 0;
    const lab = (d: V3, r: number): V3 => [d[0] * r, d[1] * r - 0.9, d[2] * r];
    return (
      <>
        <color attach="background" args={['#05060f']} />
        <Stars radius={300} size={2} />
        <SpaceLights />
        <group rotation={[wob, 0, wob * 0.6]}>
          <ToyEarth r={ER} lands={false}>
            <LandBlob r={ER} d={am} s={[1.5, 2.2, 0.32]} c="#6fbf73" />
            <LandBlob r={ER} d={eu} s={[1.4, 1.9, 0.32]} c="#8ac86a" />
            <LandBlob r={ER} d={dirOf(0.2, -0.85)} s={[1.6, 0.7, 0.3]} c="#f2f6fa" />
          </ToyEarth>
          <Label text="АМЕРИКА" position={lab(am, ER + 0.35)} w={2.2} k="lab-am" />
          <Label text="ЕВРОПА" position={lab(eu, ER + 0.35)} w={2.0} k="lab-eu" />
          <Mom who="n" position={[0, ER - 0.05 + fall, 0]} rotation={0.3} scale={4.2} hem={3} squash={bounce(v, BIG_LAND, 0.1)} />
        </group>
        <Glow position={[-14, 9, -30]} size={10} color="#fff1c8" k={0.6} />
      </>
    );
  },
};

// ======================================================================= 5a. the observatory

const SCI: Outfit = {skin: '#f0c8a8', hair: '#d8d8d8', hairStyle: 'short', top: '#f4f6f8', topStyle: 'coat', legs: '#3a4050', legStyle: 'pants', shoes: '#2a2224', glasses: true, iris: '#3a2416', shirt: '#7aa0d8'};

export const scopeScene: Scene = {
  view: (v): View => mv(v, S('scope'), E('scope'), [2.6, 1.6, 3.4], [2.0, 1.5, 2.6], [0, 1.3, 0], [-0.2, 1.3, 0], [44, 42], 0.3),
  render: (v) => (
    <>
      <color attach="background" args={['#0a0c1c']} />
      <InteriorLights key1={[2, 6, 4]} k={0.75} box={4} warm="#ffe4c4" sky="#a8b8f0" ground="#2a2a3a" />
      <Block position={[0, -0.05, 0]} size={[10, 0.1, 10]} color="#5a5f70" />
      {/* the dome: a ring wall and a half sphere above, with the slit open to the stars */}
      <Cyl position={[0, 1.2, 0]} rt={4.5} rb={4.5} h={2.4} seg={48} open color="#8a90a8" look={{side: 2, rough: 0.8}} />
      <mesh position={[0, 2.4, 0]}>
        <sphereGeometry args={[4.5, 48, 16, 0.3, Math.PI * 2 - 0.6, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#9aa0b8" side={2} roughness={0.8} />
      </mesh>
      <Stars radius={60} size={1.5} />
      <Telescope position={[0, 0, -0.2]} rotation={Math.PI} tilt={0.5} />
      <Human o={SCI} position={[0.05, 0, 0.95]} rotation={Math.PI} pose={{lean: 0.35, head: [0.25, 0, 0], armR: [-1.2, 0.2, 0], elbowR: -0.9, armL: [-1.1, 0.25, 0], elbowL: -1.0, face: {look: [0, -0.2], brow: 0.05}}} />
    </>
  ),
};

// ======================================================================= 5b. telescope view: Nolan's mother, whole

export const scopeNScene: Scene = {
  noHandheld: true,
  view: (v): View => mv(v, S('scopeN'), E('scopeN'), [0, 2.0, 40], [0.3, 1.95, 38], [0, 1.05, 0], [0, 1.0, 0], [5, 4.6]),
  render: (v) => (
    <>
      <Sky top="#5f9fe0" mid="#cfe6f2" low="#e8f0d8" />
      <ForestLight k={1.0} sun={[-6, 10, 8]} shadowBox={6} warm={1} />
      <Block position={[0, -0.5, 0]} size={[200, 1, 200]} color="#8ac06a" />
      {[-4.5, -3, 3.2, 4.8, -6, 6.4].map((x, i) => (
        <Tree key={i} position={[x, 0, -3 - (i % 3)]} h={2.6 + (i % 2)} seed={i + 2} />
      ))}
      <MomBack who="n" position={[0, 0, 0]} rotation={[0, Math.PI - 0.3, 0]} />
    </>
  ),
};

// ======================================================================= 5c. telescope view: the flowers never end

const RobeWall: React.FC = () => {
  const map = useRobe([60, 6]);
  return (
    <mesh position={[0, 15, 0]}>
      <cylinderGeometry args={[80, 82, 30, 160, 1, true]} />
      <meshStandardMaterial map={map} roughness={0.95} />
    </mesh>
  );
};

export const scopeGScene: Scene = {
  noHandheld: true,
  view: (v): View => {
    // panning along the robe, faster and faster
    const t = v - S('scopeG');
    const a = 0.02 * t + 0.035 * t * t;
    const target: V3 = [Math.sin(a) * 80, 10, Math.cos(a) * 80];
    return {pos: [Math.sin(a - 0.02) * 150, 10.5, Math.cos(a - 0.02) * 150], target, fov: 9, far: 900};
  },
  render: () => (
    <>
      <Sky top="#5f9fe0" mid="#cfe6f2" low="#e8f0d8" />
      <ambientLight intensity={0.9} />
      <directionalLight position={[60, 80, 200]} intensity={1.6} color="#fff4e0" />
      <RobeWall />
    </>
  ),
};

// ======================================================================= 6. the final: one balance for two

export const balAngle = (v: number) => {
  if (v < STEP_ON) return 0;
  if (v < LAUNCH) return 0.025 * Math.sin((v - STEP_ON) * 9) * Math.exp(-(v - STEP_ON) * 0.6);
  return -0.42 * ease5(v, LAUNCH, LAUNCH + 0.25) - 0.03 * Math.exp(-(v - LAUNCH - 0.25) * 5) * Math.sin((v - LAUNCH) * 20) * (v > LAUNCH + 0.25 ? 1 : 0);
};
export const BAL_C: V3 = [0, -2.6, 0];
const GABEN_FEET = {liftR: 0.16, toeR: 0.35};

const nolanFlight = (v: number): {p: V3; rot: V3} | null => {
  if (v < LAUNCH + 0.1) return null;
  const t = v - LAUNCH - 0.1;
  const s = panPos(1, balAngle(LAUNCH + 0.1), BAL_C);
  return {p: [s[0] - 1.3 * t, s[1] + 4.6 * t - 0.3 * t * t, s[2] - 1.2 * t], rot: [t * 2.5, t * 1.5, t * 3]};
};

const SpaceBack: React.FC = () => (
  <>
    <color attach="background" args={['#05060f']} />
    <Stars radius={300} size={2} />
    <Planet position={[-16, -10, -40]} r={6} color="#3a8ad8" />
    <Planet position={[22, 14, -70]} r={5} color="#e8b86a" ring="#d8c89a" />
    <Planet position={[-30, 20, -90]} r={2.5} color="#d86a4a" />
    <Glow position={[30, 24, -120]} size={20} color="#fff1c8" k={0.5} />
  </>
);

export const finalScene: Scene = {
  view: (v): View => {
    const base = mv(v, S('final'), STEP_ON + 0.6, [0.8, 1.6, 16.5], [0.3, 1.2, 14.0], [0, 0.8, 0], [0, 0.5, 0], [42, 42], 0.4);
    if (v < LAUNCH) return base;
    const k = ease5(v, LAUNCH, LAUNCH + 1.6);
    return {...base, pos: lerp3(base.pos, [0.0, 0.6, 17.5], k), target: lerp3(base.target, [0.2, 2.4, 0], k), fov: lerp(42, 48, k)};
  },
  shakes: [[STEP_ON, 0.2], [LAUNCH, 0.45]],
  render: (v) => {
    const a = balAngle(v);
    const on = ease5(v, STEP_ON - 0.45, STEP_ON);
    const fl = nolanFlight(v);
    return (
      <>
        <SpaceBack />
        <SpaceLights />
        <Balance
          position={BAL_C}
          angle={a}
          leftPan={<MomBack who="g" position={[0, lerp(0.9, 0, on), 0]} rotation={[0, Math.PI - 0.35, 0]} feet={GABEN_FEET} squash={bounce(v, STEP_ON, 0.08)} />}
          rightPan={fl ? null : <MomBack who="n" position={[0, lerp(0.9, 0, on), 0]} rotation={[0, Math.PI + 0.35, 0]} squash={bounce(v, STEP_ON + 0.15, 0.08)} />}
        />
        {fl ? (
          <group position={fl.p} rotation={fl.rot}>
            <MomBack who="n" position={[0, -1.0, 0]} />
          </group>
        ) : null}
      </>
    );
  },
};

// ======================================================================= 7. two moons around Gaben's mother

export const moonsScene: Scene = {
  view: (v): View => mv(v, S('moons'), E('moons'), [0.5, 1.5, 27], [-0.8, 2.2, 24], [4.2, 0.6, -3], [4.6, 1.2, -3], [48, 46]),
  render: (v) => {
    const t = v - S('moons');
    const c: V3 = [giantCenter[0], giantCenter[1] + 0.8, giantCenter[2]];
    const a1 = 3.4 + t * 0.9;
    const a2 = 0.6 + t * 0.75;
    const m1: V3 = [c[0] + Math.cos(a1) * 5.2, c[1] + Math.sin(a1) * 0.8, c[2] + Math.sin(a1) * 5.2];
    const m2: V3 = [c[0] + Math.cos(a2) * 7.4, c[1] + 2 + Math.sin(a2) * 1.0, c[2] + Math.sin(a2) * 7.4];
    return (
      <>
        <SpaceBack />
        <SpaceLights />
        <MomBack who="g" position={GIANT_G.p} rotation={[0, Math.PI - 0.3, 0]} scale={GIANT_G.s} />
        <Dots center={c} r={5.2} n={90} opacity={0.6} />
        <Dots center={[c[0], c[1] + 2, c[2]]} r={7.4} n={120} opacity={0.6} color="#9ad0ff" />
        <ToyMoon position={m1} r={0.6} />
        <group position={m2} rotation={[t * 1.5, t, t * 2]}>
          <MomBack who="n" position={[0, -0.9, 0]} scale={0.9} />
        </group>
      </>
    );
  },
};

// ======================================================================= 8. the reveal: she stood on one leg

export const legScene: Scene = {
  view: (v): View => {
    const p = panPos(-1, balAngle(v), BAL_C);
    return mv(v, S('leg'), Math.min(E('leg'), WIN), [p[0] + 1.5, p[1] + 0.32, p[2] - 2.5], [p[0] + 1.05, p[1] + 0.28, p[2] - 2.05], [p[0] - 0.05, p[1] + 0.3, p[2] - 0.2], [p[0] - 0.05, p[1] + 0.26, p[2] - 0.2], [42, 40], 0.2);
  },
  render: (v) => (
    <>
      <SpaceBack />
      <SpaceLights />
      <Balance position={BAL_C} angle={balAngle(v)} leftPan={<MomBack who="g" position={[0, 0, 0]} rotation={[0, Math.PI - 0.35, 0]} feet={{liftR: 0.26 + 0.03 * Math.sin(v * 3), toeR: 0.45}} />} rightPan={null} />
    </>
  ),
};

export {BALANCE, Ball, Glow, RBox, ToyMoon};
