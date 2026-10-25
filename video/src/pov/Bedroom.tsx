import React from 'react';
import {Box, Bush, Cyl, Tree} from '../scene/parts';
import {PersonPose} from '../scene/Characters';
import {Hero, Operator} from './cast';
import {Ground, Sky, Sun} from './env';
import {AlarmClock, HeroArm, TripodCam} from './props';
import {BED_FLOP, CURTAINS, EYES_OPEN, SLAP, ShotState, V3, hop, lerp, lerp3, ramp, smooth} from './cues';

// The bedroom: morning (alarm, waking up), night (falling into bed, eyes opening) and the hallway with 20 cameras.
// Room 7 x 7 m, floor at y 0, window in the left wall (x = -3.5), bed head against the back wall (z = -3.5).

export const CLOCK_POS: V3 = [1.35, 0.55, -3.1];
export const HERO_X = 0.4;
// hips of the hero in bed: lying on the back (head on the pillow) and sitting up
const HIP_LYING: V3 = [HERO_X, 0.88, -2.2];
const HIP_SITTING: V3 = [HERO_X, 0.71, -2.2];
export const HEAD_LYING: V3 = [HERO_X, 0.88, -3.11];

const WALL = '#e9e1d4';
const FLOOR = '#b98d63';

const Room: React.FC<{curtain: number}> = ({curtain}) => (
  <group>
    <Box size={[7, 0.1, 7]} position={[0, -0.05, 0]} color={FLOOR} />
    <Box size={[7, 3, 0.15]} position={[0, 1.5, -3.575]} color={WALL} />
    <Box size={[0.15, 3, 7]} position={[3.575, 1.5, 0]} color={WALL} />
    <Box size={[7, 3, 0.15]} position={[0, 1.5, 3.575]} color={WALL} />
    {/* left wall around the window: z from -1.6 to 0.4, y from 0.9 to 2.4 */}
    <Box size={[0.15, 0.9, 7]} position={[-3.575, 0.45, 0]} color={WALL} />
    <Box size={[0.15, 0.6, 7]} position={[-3.575, 2.7, 0]} color={WALL} />
    <Box size={[0.15, 1.5, 1.9]} position={[-3.575, 1.65, -2.55]} color={WALL} />
    <Box size={[0.15, 1.5, 3.1]} position={[-3.575, 1.65, 1.95]} color={WALL} />
    <Box size={[0.2, 0.08, 2.1]} position={[-3.56, 0.9, -0.6]} color="#ffffff" />
    <Box size={[0.2, 0.08, 2.1]} position={[-3.56, 2.4, -0.6]} color="#ffffff" />
    <Box size={[0.2, 1.58, 0.08]} position={[-3.56, 1.65, -1.62]} color="#ffffff" />
    <Box size={[0.2, 1.58, 0.08]} position={[-3.56, 1.65, 0.42]} color="#ffffff" />
    <Box size={[7, 0.15, 7]} position={[0, 3.075, 0]} color="#f3efe8" shadow={false} />
    {/* curtains slide apart: closed covers the window, open rests on the wall */}
    <Box size={[0.06, 1.75, 1.08]} position={[-3.4, 1.62, lerp(-1.1, -2.25, curtain)]} color="#3d4a6b" />
    <Box size={[0.06, 1.75, 1.08]} position={[-3.4, 1.62, lerp(-0.1, 1.05, curtain)]} color="#3d4a6b" />
    <Cyl rTop={0.02} rBottom={0.02} height={3.4} segments={6} position={[-3.36, 2.52, -0.6]} rotation={[Math.PI / 2, 0, 0]} color="#8a8f99" />
    {/* bed */}
    <Box size={[2.0, 0.35, 2.3]} position={[0, 0.175, -2.35]} color="#6e4b33" />
    <Box size={[2.1, 1.1, 0.12]} position={[0, 0.55, -3.44]} color="#5a3c28" />
    <Box size={[1.9, 0.25, 2.2]} position={[0, 0.475, -2.36]} color="#f2f2f0" />
    <Box size={[0.68, 0.2, 0.42]} position={[-0.45, 0.7, -3.1]} color="#ffffff" />
    <Box size={[0.68, 0.2, 0.42]} position={[0.45, 0.7, -3.1]} color="#ffffff" />
    <Box size={[1.96, 0.3, 1.62]} position={[0, 0.75, -2.04]} color="#5b6f8c" />
    {/* nightstand */}
    <Box size={[0.5, 0.55, 0.45]} position={[1.35, 0.275, -3.1]} color="#7a5638" />
    <Box size={[0.42, 0.02, 0.02]} position={[1.35, 0.4, -2.865]} color="#3a2a1c" shadow={false} />
    {/* rug, wardrobe, poster frame */}
    <Box size={[2.4, 0.012, 1.4]} position={[0, 0.006, -0.3]} color="#c9533f" shadow={false} />
    <Box size={[1.4, 2.2, 0.6]} position={[2.75, 1.1, 1.5]} color="#d8cbb8" />
    <Box size={[0.02, 2.0, 0.02]} position={[2.75, 1.1, 1.81]} color="#a89880" shadow={false} />
    <Box size={[0.9, 1.2, 0.04]} position={[2.0, 1.8, -3.48]} color="#2a2c33" />
    <Box size={[0.78, 1.08, 0.01]} position={[2.0, 1.8, -3.455]} color="#f2c84b" shadow={false} />
  </group>
);

// outside the window: lawn, hedge, a tree, two camera operators looking in
const Outside: React.FC<{night: boolean; operators: boolean; t: number}> = ({night, operators, t}) => (
  <group>
    <Ground color={night ? '#1d2a3a' : '#79b45a'} y={-0.02} />
    <Box size={[0.8, 0.9, 9]} position={[-8.5, 0.45, -1]} color={night ? '#1a2a2a' : '#4f8f3f'} />
    <Tree position={[-11, 0, -4]} size={1.3} seed={1.2} />
    <Tree position={[-14, 0, 3]} size={1.6} seed={2.4} />
    <Bush position={[-5, 0, 2.2]} size={1.2} seed={0.7} />
    <Box size={[12, 0.02, 1.4]} position={[-9.5, 0, -0.6]} color={night ? '#2a3140' : '#c9c2b4'} shadow={false} />
    {operators ? (
      <>
        <Operator position={[-4.5, 0, -1.05]} rotation={Math.PI / 2 + 0.08} pose={{head: [0.05 * Math.sin(t * 2), 0]}} />
        <Operator position={[-4.7, 0, -0.05]} rotation={Math.PI / 2 - 0.12} pose={{head: [0, 0.1 * Math.sin(t * 1.3)]}} />
      </>
    ) : null}
  </group>
);

type Mode = 'alarm' | 'wake' | 'bed' | 'eyes' | 'phone';

export const heroInBed = (mode: Mode, v: number, t: number) => {
  // returns the hip position, the body rotation [x, y] and the pose
  if (mode === 'wake') {
    const s = smooth(ramp(t, 0.15, 0.95));
    const look = smooth(ramp(t, 3.55, 4.1));
    const pose: PersonPose = {
      legL: (Math.PI / 2) * s,
      legR: (Math.PI / 2) * s,
      armL: [0.25 + 0.3 * s, 0.15],
      armR: [0.25 + 0.3 * s, -0.15],
      elbowL: 0.6,
      elbowR: 0.6,
      head: [0.05 - 0.1 * hop(t, 0.9, 0.5), -1.1 * look],
      eyes: t < 0.3 ? 0.5 : 1.15,
      mouth: 0.15 * hop(t, 1.0, 1.4),
    };
    return {hip: lerp3(HIP_LYING, HIP_SITTING, s), rot: [-(Math.PI / 2) * (1 - s), 0] as [number, number], pose};
  }
  if (mode === 'bed') {
    // standing at the foot of the bed, then a flop face down onto the duvet
    const f = smooth(ramp(v, BED_FLOP - 0.55, BED_FLOP));
    const bounce = 0.05 * hop(v, BED_FLOP, 0.3) + 0.02 * hop(v, BED_FLOP + 0.3, 0.25);
    const start: V3 = [HERO_X, 0.9, -0.35];
    const end: V3 = [HERO_X, 0.95, -2.15];
    const p = lerp3(start, end, f);
    p[1] += 0.35 * Math.sin(Math.PI * f) + bounce;
    const pose: PersonPose = {
      armL: [lerp(0.1, 2.9, f), 0.2],
      armR: [lerp(0.1, 2.9, f), -0.2],
      eyes: lerp(0.6, 0.1, f),
      head: [0.15 * (1 - f), 0],
    };
    return {hip: p, rot: [(Math.PI / 2) * f, Math.PI] as [number, number], pose};
  }
  // lying on the back
  const open = v >= EYES_OPEN;
  const pose: PersonPose = {
    eyes: mode === 'eyes' ? (open ? 1.75 : 0.1) : 0.1,
    head: [0, 0],
    armL: [0.1, 0.1],
    armR: [0.1, -0.1],
    mouth: mode === 'eyes' && open ? 0.08 : 0,
  };
  return {hip: HIP_LYING, rot: [-Math.PI / 2, 0] as [number, number], pose};
};

export const Bedroom: React.FC<{v: number; s: ShotState}> = ({v, s}) => {
  const mode: Mode = s.name === 'alarm' || s.name === 'alarm2' ? 'alarm' : s.name === 'wake' ? 'wake' : s.name === 'bed' ? 'bed' : s.name === 'eyes' ? 'eyes' : 'phone';
  const night = mode === 'bed' || mode === 'eyes' || mode === 'phone';
  const t = s.t;
  const curtain = mode === 'wake' ? smooth(ramp(v, CURTAINS, CURTAINS + 1.1)) : night ? 0.35 : 0;
  const daylight = mode === 'wake' ? curtain : 0;
  // the alarm clock rings and jumps until it is slapped (the last shot ends before the slap)
  const slapAt = s.name === 'alarm' ? SLAP : 1e9;
  const ringing = mode === 'alarm' && v < slapAt;
  const tc = s.name === 'alarm2' ? t : v;
  const bounce = ringing ? Math.abs(Math.sin(tc * 31)) : 0;
  const squash = mode === 'alarm' ? hop(v, slapAt, 0.18) : 0;
  const hb = mode === 'alarm' || mode === 'phone' ? null : heroInBed(mode, v, t);
  // slapping arm in the first shot: rests below the frame, rises and comes down on the clock
  const up = s.name === 'alarm' ? smooth(ramp(tc, 1.05, 1.6)) : 0;
  const down = s.name === 'alarm' ? smooth(ramp(v, slapAt - 0.18, slapAt)) : 0;
  const hand = lerp3(lerp3([0.78, 0.2, -2.75], [1.15, 0.92, -3.02], up), [1.33, 0.73, -3.1], down);
  return (
    <group>
      <Sky top={night ? '#0b1430' : '#7cc0ee'} horizon={night ? '#22305e' : '#dcf0fa'} />
      {night ? (
        <>
          <hemisphereLight color="#6a7fc0" groundColor="#1a1c26" intensity={0.55} />
          <Sun position={[-14, 9, 4]} target={[0, 0.8, -1.5]} intensity={0.9} color="#9fb4ff" size={6} />
          {mode !== 'eyes' ? <pointLight position={[1.3, 0.75, -3.0]} intensity={1.6} distance={3} decay={1.5} color="#a9c8ff" /> : null}
          {mode === 'eyes' ? <pointLight position={[1.1, 1.2, -2.9]} intensity={0.9} distance={2.5} decay={1.5} color="#a9c8ff" /> : null}
        </>
      ) : (
        <>
          <hemisphereLight color="#fff1dc" groundColor="#6b5a48" intensity={0.35 + 0.45 * daylight} />
          <ambientLight intensity={0.08} />
          {/* a strip of morning light through the gap of the curtains */}
          <pointLight position={[-3.0, 1.6, -0.6]} intensity={1.3 * (1 - daylight)} distance={5} decay={1.2} color="#ffd9a0" />
          <Sun position={[-14, 8, 2]} target={[0, 0.8, -1.5]} intensity={2.6 * daylight} color="#fff0d6" size={6} />
          <pointLight position={[1.2, 0.75, -2.95]} intensity={ringing ? 0.12 : 0.05} distance={1.0} decay={2} color="#ff3b30" />
        </>
      )}
      <Room curtain={curtain} />
      {/* thin bright gap between closed curtains */}
      {curtain < 0.05 && !night ? <Box size={[0.02, 1.6, 0.06]} position={[-3.37, 1.62, -0.6]} color="#fff2d0" emissive="#ffe6b0" emissiveIntensity={1.5} shadow={false} /> : null}
      <Outside night={night} operators={mode === 'wake'} t={t} />
      <AlarmClock position={CLOCK_POS} rotation={-Math.PI / 2 + 0.25} text={night ? '00:15' : '06:00'} bounce={bounce} squash={squash} />
      {/* phone on the nightstand, lit at night */}
      <Box size={[0.09, 0.012, 0.17]} position={[1.22, 0.556, -2.97]} rotation={[0, 0.3, 0]} color="#16171a" />
      {night ? <Box size={[0.08, 0.004, 0.155]} position={[1.22, 0.566, -2.97]} rotation={[0, 0.3, 0]} color="#bcd6ff" emissive="#9cc2ff" emissiveIntensity={1.4} shadow={false} /> : null}
      {mode === 'alarm' ? (
        <HeroArm from={[0.62, 0.02, -2.68]} to={hand}>
          <Box size={[0.11, 0.1, 0.06]} position={[0, 0.03, 0]} color="#efd2b3" />
        </HeroArm>
      ) : null}
      {hb ? (
        <group position={hb.hip} rotation={[0, hb.rot[1], 0]}>
          <group rotation={[hb.rot[0], 0, 0]}>
            <Hero position={[0, -0.9, 0]} pose={hb.pose} />
          </group>
        </group>
      ) : null}
    </group>
  );
};

// The hallway of 20 cameras: they turn to the hero walking past and switch on one after another.
export const Hallway: React.FC<{v: number; s: ShotState; eye: V3}> = ({s, eye}) => {
  const cams = [];
  for (let k = 0; k < 20; k++) {
    const side = k % 2 === 0 ? -1 : 1;
    const z = 1.5 - Math.floor(k / 2) * 1.35;
    const x = side * 1.25;
    const facing = Math.atan2(eye[0] - x, eye[2] - z);
    const turn = smooth(ramp(s.t, 0.12 + k * 0.07, 0.42 + k * 0.07));
    const rest = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    cams.push(<TripodCam key={k} position={[x, 0, z]} yaw={lerp(rest, facing, turn)} rec={turn > 0.8} height={1.4} />);
  }
  return (
    <group>
      <hemisphereLight color="#ffffff" groundColor="#8a7a68" intensity={0.8} />
      <ambientLight intensity={0.15} />
      <Sun position={[3, 10, 4]} target={[0, 0, -4]} intensity={1.6} size={12} />
      <Box size={[3.4, 0.1, 22]} position={[0, -0.05, -6]} color="#a87d55" />
      <Box size={[0.15, 3, 22]} position={[-1.775, 1.5, -6]} color="#efe8dc" />
      <Box size={[0.15, 3, 22]} position={[1.775, 1.5, -6]} color="#efe8dc" />
      <Box size={[3.4, 0.15, 22]} position={[0, 3.075, -6]} color="#fbf8f2" shadow={false} />
      <Box size={[3.4, 3, 0.15]} position={[0, 1.5, -16.9]} color="#d7c7b0" />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <Box key={k} size={[0.6, 0.02, 0.6]} position={[0, 3.0, 1 - k * 3]} color="#fffbe8" emissive="#fff6d8" emissiveIntensity={1.2} shadow={false} />
      ))}
      {[0, 1, 2, 3].map((k) => (
        <Box key={`p${k}`} size={[0.04, 0.9, 0.7]} position={[k % 2 ? 1.69 : -1.69, 1.8, -2 - k * 3.2]} color={['#e9563c', '#3fa6b4', '#f2c84b', '#7c5cc4'][k]} />
      ))}
      {cams}
    </group>
  );
};
