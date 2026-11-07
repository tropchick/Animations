import React from 'react';
import {Box, Cyl, Ico, Pic} from '../lastman/common';
import {Person, PersonPose} from '../scene/Characters';
import {V3} from './cues';
import {busTex, visorTex} from './tex';

// ---------------------------------------------------------------- Dima: the same guy in all four worlds
export const DIMA = {shirt: '#4a7fd0', pants: '#2c3550', skin: '#efd2b3', hair: '#4a3324'};
export const Dima: React.FC<{position: V3; rotation?: number; pose?: PersonPose; rightHand?: React.ReactNode; leftHand?: React.ReactNode; shirt?: string}> = ({shirt, ...p}) => (
  <Person {...p} shirt={shirt ?? DIMA.shirt} pants={DIMA.pants} skin={DIMA.skin} hair={DIMA.hair} />
);

// a mug in the hand (held at the hand group origin)
export const Mug: React.FC<{position?: V3; color?: string}> = ({position = [0, -0.04, 0.06], color = '#f4f4f0'}) => (
  <group position={position}>
    <Cyl rTop={0.045} rBottom={0.04} height={0.1} segments={10} color={color} />
    <Cyl rTop={0.038} rBottom={0.038} height={0.004} segments={10} position={[0, 0.051, 0]} color="#5a3a22" shadow={false} />
    <Box size={[0.015, 0.06, 0.03]} position={[0.055, 0, 0]} color={color} />
  </group>
);

// ---------------------------------------------------------------- a hovering robot (white shell, dark visor, glowing ring underneath)
export const Robot: React.FC<{position: V3; rotation?: number; scale?: number; t: number; red?: boolean; armR?: number; armL?: number; head?: number; blink?: boolean; color?: string}> = ({
  position,
  rotation = 0,
  scale = 1,
  t,
  red = false,
  armR = 0,
  armL = 0,
  head = 0,
  blink = false,
  color = '#e8ecf0',
}) => {
  const bob = Math.sin(t * 2.2 + position[0]) * 0.03;
  const glow = red ? '#ff3a2a' : '#5fe0ff';
  return (
    <group position={[position[0], position[1] + bob, position[2]]} rotation={[0, rotation, 0]} scale={scale}>
      {/* base: a cone with a glowing ring */}
      <Cyl rTop={0.26} rBottom={0.12} height={0.35} segments={10} position={[0, 0.42, 0]} color={color} />
      <Cyl rTop={0.13} rBottom={0.13} height={0.04} segments={12} position={[0, 0.23, 0]} color={glow} emissive={glow} emissiveIntensity={1.6} shadow={false} />
      {/* body */}
      <Box size={[0.56, 0.6, 0.38]} position={[0, 0.9, 0]} color={color} />
      <Box size={[0.3, 0.16, 0.012]} position={[0, 0.95, 0.196]} color={glow} emissive={glow} emissiveIntensity={0.8} shadow={false} />
      {/* head */}
      <group position={[0, 1.28, 0]} rotation={[0, head, 0]}>
        <Box size={[0.46, 0.34, 0.38]} position={[0, 0.06, 0]} color={color} />
        <Pic size={[0.38, 0.22]} map={visorTex(red, blink)} position={[0, 0.06, 0.196]} />
        <Cyl rTop={0.012} rBottom={0.012} height={0.16} position={[0.14, 0.3, 0]} color="#9aa2ac" />
        <Ico radius={0.03} position={[0.14, 0.39, 0]} color={glow} emissive={glow} emissiveIntensity={1.5} shadow={false} />
      </group>
      {/* arms: shoulders at the body's sides, pitch forward/up */}
      {([[-1, armL], [1, armR]] as const).map(([side, a]) => (
        <group key={side} position={[0.33 * side, 1.12, 0]} rotation={[-a, 0, side * 0.08]}>
          <Box size={[0.12, 0.42, 0.14]} position={[0, -0.2, 0]} color={color} />
          <Box size={[0.14, 0.1, 0.16]} position={[0, -0.44, 0]} color="#9aa2ac" />
        </group>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- the ceiling robot arm that brings the coffee (world 1)
// base on the ceiling at `base`, reaches toward `tip` (k 0..1 = folded..reached)
export const RoboArm: React.FC<{base: V3; yaw: number; reach: number; drop: number; holding: boolean}> = ({base, yaw, reach, drop, holding}) => (
  <group position={base} rotation={[0, yaw, 0]}>
    <Cyl rTop={0.16} rBottom={0.16} height={0.06} segments={14} position={[0, -0.03, 0]} color="#f2f4f6" />
    <Box size={[0.12, drop, 0.12]} position={[0, -drop / 2 - 0.05, 0]} color="#e2e6ea" />
    <Ico radius={0.08} position={[0, -drop - 0.06, 0]} color="#5fe0ff" emissive="#5fe0ff" emissiveIntensity={0.8} />
    <Box size={[0.1, 0.1, reach]} position={[0, -drop - 0.06, reach / 2]} color="#e2e6ea" />
    <group position={[0, -drop - 0.06, reach]}>
      <Box size={[0.14, 0.04, 0.1]} position={[0, -0.04, 0]} color="#9aa2ac" />
      {holding ? <Mug position={[0, -0.12, 0.02]} /> : null}
    </group>
  </group>
);

// ---------------------------------------------------------------- the robot vacuum (world 4)
export const Vacuum: React.FC<{position: V3; rotation?: number; eye: number}> = ({position, rotation = 0, eye}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Cyl rTop={0.17} rBottom={0.17} height={0.08} segments={16} position={[0, 0.045, 0]} color="#2a2c32" />
    <Cyl rTop={0.12} rBottom={0.12} height={0.012} segments={16} position={[0, 0.091, 0]} color="#3a3d44" shadow={false} />
    <Box size={[0.12, 0.03, 0.03]} position={[0, 0.06, 0.16]} color="#1a1a1e" />
    <Box size={[0.05, 0.025, 0.012]} position={[0, 0.07, 0.176]} color="#ff2a2a" emissive="#ff2020" emissiveIntensity={0.3 + 2.5 * eye} shadow={false} />
    {eye > 0.05 ? <pointLight position={[0, 0.08, 0.3]} intensity={1.5 * eye} distance={1.6} color="#ff2a2a" /> : null}
  </group>
);

// ---------------------------------------------------------------- a pigeon (world 2), looks along +z when head = 0
export const Pigeon: React.FC<{position: V3; rotation?: number; head: number; eye: number}> = ({position, rotation = 0, head, eye}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Ico radius={0.1} position={[0, 0.12, 0]} scale={[0.85, 0.8, 1.25]} color="#8a8f9a" />
    <Box size={[0.07, 0.02, 0.12]} position={[0, 0.1, -0.15]} rotation={[0.3, 0, 0]} color="#5a5f6a" />
    <Box size={[0.012, 0.06, 0.012]} position={[-0.03, 0.03, 0.02]} color="#d06a5a" />
    <Box size={[0.012, 0.06, 0.012]} position={[0.03, 0.03, 0.02]} color="#d06a5a" />
    <group position={[0, 0.24, 0.07]} rotation={[0, head, 0]}>
      <Ico radius={0.055} position={[0, 0, 0.0]} color="#6a7080" />
      <Box size={[0.08, 0.03, 0.03]} position={[0, -0.05, -0.01]} color="#5a8a7a" />
      <Box size={[0.02, 0.018, 0.04]} position={[0, -0.005, 0.065]} color="#e0b090" />
      {[-1, 1].map((s) => (
        <Box key={s} size={[0.012, 0.016, 0.016]} position={[s * 0.05, 0.012, 0.022]} color={eye > 0.5 ? '#5fe0ff' : '#c84a2a'} emissive={eye > 0.5 ? '#5fe0ff' : '#000000'} emissiveIntensity={2.5 * eye} shadow={false} />
      ))}
    </group>
  </group>
);

// ---------------------------------------------------------------- a panda (world 3, the next enclosure)
export const Panda: React.FC<{position: V3; rotation?: number; t: number}> = ({position, rotation = 0, t}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Ico radius={0.45} position={[0, 0.45, 0]} scale={[1, 0.9, 1.15]} color="#f4f2ee" />
    <Ico radius={0.3} position={[0, 0.82, 0.22]} color="#f4f2ee" />
    {[-1, 1].map((s) => (
      <React.Fragment key={s}>
        <Ico radius={0.1} position={[s * 0.2, 1.08, 0.18]} color="#1a1a1a" />
        <Ico radius={0.07} position={[s * 0.11, 0.86, 0.47]} scale={[1, 1.3, 0.5]} color="#1a1a1a" />
        <Box size={[0.2, 0.3, 0.22]} position={[s * 0.3, 0.15, 0.3]} color="#1a1a1a" />
        <Box size={[0.18, 0.35, 0.2]} position={[s * 0.38, 0.55 + 0.04 * Math.sin(t * 3), 0.25]} rotation={[0.6, 0, 0]} color="#1a1a1a" />
      </React.Fragment>
    ))}
    <Box size={[0.07, 0.05, 0.04]} position={[0, 0.78, 0.5]} color="#1a1a1a" />
    {/* bamboo */}
    <Cyl rTop={0.025} rBottom={0.025} height={0.9} position={[0.3, 0.75, 0.45]} rotation={[0.2, 0, 0.5]} color="#7ab04a" />
  </group>
);

// ---------------------------------------------------------------- a city bus (front at +x), doors on the -z side
export const Bus: React.FC<{position: V3; rotation?: number; door: number}> = ({position, rotation = 0, door}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[10, 2.6, 2.5]} position={[0, 1.6, 0]} color="#e8b830" />
    <Box size={[9.4, 0.9, 0.02]} position={[-0.2, 2.15, -1.262]} color="#2a3a4a" shadow={false} />
    <Box size={[9.4, 0.9, 0.02]} position={[-0.2, 2.15, 1.262]} color="#2a3a4a" shadow={false} />
    <Box size={[0.02, 1.2, 2.2]} position={[5.01, 2.0, 0]} color="#2a3a4a" shadow={false} />
    <Pic size={[1.6, 0.4]} map={busTex()} position={[5.012, 2.85, 0]} rotation={[0, Math.PI / 2, 0]} />
    {[-3.3, 3.3].map((x) => (
      <React.Fragment key={x}>
        <Cyl rTop={0.5} rBottom={0.5} height={0.3} segments={14} position={[x, 0.5, -1.15]} rotation={[Math.PI / 2, 0, 0]} color="#1a1a1a" />
        <Cyl rTop={0.5} rBottom={0.5} height={0.3} segments={14} position={[x, 0.5, 1.15]} rotation={[Math.PI / 2, 0, 0]} color="#1a1a1a" />
      </React.Fragment>
    ))}
    {/* front door leaves slide apart along x */}
    {[-1, 1].map((s) => (
      <Box key={s} size={[0.6, 2.2, 0.05]} position={[3.6 + s * (0.3 + 0.55 * door), 1.4, -1.29]} color="#3a4a5a" />
    ))}
    <Box size={[1.2, 2.2, 0.02]} position={[3.6, 1.4, -1.255]} color="#1a1a1e" shadow={false} />
  </group>
);

// ---------------------------------------------------------------- a street lamp with the tiny blue AI light (world 2)
export const Lamp: React.FC<{position: V3; blue: number}> = ({position, blue}) => (
  <group position={position}>
    <Cyl rTop={0.06} rBottom={0.08} height={5} position={[0, 2.5, 0]} color="#4a4e56" />
    <Box size={[0.9, 0.08, 0.1]} position={[0.4, 5, 0]} color="#4a4e56" />
    <Box size={[0.4, 0.12, 0.25]} position={[0.8, 4.92, 0]} color="#f2f0e0" emissive="#fff6d0" emissiveIntensity={0.3} />
    <Ico radius={0.06} position={[0.06, 3.2, 0.07]} color="#5fe0ff" emissive="#5fe0ff" emissiveIntensity={0.2 + 3 * blue} shadow={false} />
  </group>
);

// ---------------------------------------------------------------- the rocket on its pad (world 1), lift 0.. m above the pad
export const Rocket: React.FC<{position: V3; lift: number; t: number; fire: number}> = ({position, lift, t, fire}) => (
  <group position={position}>
    <Box size={[3, 8, 3]} position={[-4, 4, 0]} color="#8a8e96" />
    <group position={[0, lift, 0]}>
      <Cyl rTop={1.2} rBottom={1.2} height={22} segments={12} position={[0, 13, 0]} color="#f2f2f0" />
      <Cyl rTop={0} rBottom={1.2} height={5} segments={12} position={[0, 26.5, 0]} color="#d84a3a" />
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} size={[0.2, 4, 2.4]} position={[Math.cos((i * Math.PI) / 2) * 1.3, 3.5, Math.sin((i * Math.PI) / 2) * 1.3]} rotation={[0, (-i * Math.PI) / 2, 0]} color="#3a3d44" />
      ))}
      {fire > 0 ? (
        <>
          <Cyl rTop={1.0} rBottom={0.2} height={6 + Math.sin(t * 40) * 0.6} segments={10} position={[0, -2.5, 0]} color="#ffd060" emissive="#ffb020" emissiveIntensity={2.5} shadow={false} />
          <pointLight position={[0, -3, 0]} intensity={60 * fire} distance={60} color="#ffb040" />
        </>
      ) : null}
    </group>
  </group>
);

// smoke puffs that stay where the rocket left them
export const Smoke: React.FC<{base: V3; lift: number; t: number}> = ({base, lift, t}) => (
  <group position={base}>
    {Array.from({length: 18}).map((_, i) => {
      const h = (i / 18) * lift;
      if (h > lift - 1) return null;
      const grow = 1 + (lift - h) * 0.04;
      return <Ico key={i} radius={2.2 * grow} position={[Math.sin(i * 1.7) * 0.8, h - 3, Math.cos(i * 2.3) * 0.8]} color="#e8e6e2" opacity={0.85} shadow={false} />;
    })}
    {lift > 0.5
      ? Array.from({length: 8}).map((_, i) => (
          <Ico key={`g${i}`} radius={3 + i * 0.4} position={[Math.cos(i) * (4 + t * 2), 1.5, Math.sin(i) * (4 + t * 2)]} color="#d8d6d0" opacity={0.8} shadow={false} />
        ))
      : null}
  </group>
);
