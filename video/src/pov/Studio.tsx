import React from 'react';
import {Box, Cyl} from '../scene/parts';
import {PersonPose} from '../scene/Characters';
import {Cup, Hero, Photographer} from './cast';
import {Sun} from './env';
import {FLASHES, ShotState, V3, hop, lerp, ramp, smooth} from './cues';

// White photo studio for the thumbnail: the hero pulls a surprised face, the photographer wants more.
export const HERO_STUDIO: V3 = [0, 0, -1.5];
export const PHOTOGRAPHER_POS: V3 = [0.15, 0, 2.6];

// three surprised poses, switched on every flash
const POSES: PersonPose[] = [
  {armL: [0.35, -2.25], armR: [0.35, 2.25], elbowL: 0.55, elbowR: 0.55, head: [-0.08, 0.12], mouth: 1, eyes: 1.6},
  {armL: [1.3, 0.25], armR: [1.3, -0.25], elbowL: 1.6, elbowR: 1.6, head: [0.05, -0.1], mouth: 1, eyes: 1.75},
  {armL: [0.25, -0.5], armR: [1.55, -0.05], elbowL: 0.3, elbowR: 0, head: [-0.12, -0.18], mouth: 0.9, eyes: 1.5},
];

const mixPose = (a: PersonPose, b: PersonPose, k: number): PersonPose => {
  const out: PersonPose = {};
  for (const key of Object.keys(a) as (keyof PersonPose)[]) {
    const x = a[key];
    const y = b[key];
    if (Array.isArray(x) && Array.isArray(y)) (out as Record<string, unknown>)[key] = [lerp(x[0], y[0], k), lerp(x[1], y[1], k)];
    else if (typeof x === 'number' && typeof y === 'number') (out as Record<string, unknown>)[key] = lerp(x, y, k);
  }
  return out;
};

export const flashAt = (v: number) => FLASHES.reduce((a, f) => a + Math.max(0, 1 - Math.abs(v - f - 0.03) / 0.09) * (v >= f - 0.03 ? 1 : 0), 0);

export const Studio: React.FC<{v: number; s: ShotState}> = ({v, s}) => {
  const n = FLASHES.filter((f) => f <= v).length;
  const since = n > 0 ? v - FLASHES[n - 1] : 1;
  const pose = s.name === 'lcd' ? POSES[1] : mixPose(POSES[Math.max(0, n - 1) % 3], POSES[n % 3], 0) ;
  const settle = smooth(ramp(since, 0, 0.12));
  const prev = POSES[Math.max(0, n - 2) % 3];
  const heroPose = s.name === 'lcd' ? pose : mixPose(prev, POSES[Math.max(0, n - 1) % 3], settle);
  const flash = flashAt(v);
  // photographer: camera up while shooting; in the close-up he lowers it, holds a coffee and raises a finger
  const close = s.name === 'lcd' && s.t > 1.35;
  const finger = smooth(ramp(s.t, 1.5, 1.85));
  return (
    <group>
      <color attach="background" args={['#24262c']} />
      <hemisphereLight color="#ffffff" groundColor="#b8b8b8" intensity={0.9 + flash * 2.5} />
      <ambientLight intensity={0.2} />
      <Sun position={[-4, 7, 6]} target={[0, 1, -1]} intensity={1.6 + flash * 3} color="#ffffff" size={8} />
      <pointLight position={[-1.2, 1.75, 0.6]} intensity={1.2} distance={5} decay={1.4} color="#fff6ea" />
      {/* cyclorama */}
      <Box size={[12, 0.1, 10]} position={[0, -0.05, -0.5]} color="#f1f1ef" />
      <Box size={[12, 6, 0.1]} position={[0, 3, -5.5]} color="#f3f3f1" />
      <Box size={[12, 0.6, 0.6]} position={[0, 0.0, -5.2]} rotation={[Math.PI / 4, 0, 0]} color="#f1f1ef" shadow={false} />
      {/* ring light on a stand */}
      <group position={[-1.1, 0, 0.7]} rotation={[0, 0.25, 0]}>
        <Cyl rTop={0.02} rBottom={0.02} height={1.75} segments={6} position={[0, 0.875, 0]} color="#2a2c31" />
        <Cyl rTop={0.25} rBottom={0.25} height={0.03} segments={10} position={[0, 0.015, 0]} color="#2a2c31" />
        <mesh position={[0, 1.8, 0]}>
          <torusGeometry args={[0.42, 0.045, 8, 32]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.4} />
        </mesh>
      </group>
      {/* softbox */}
      <group position={[2.0, 0, 0.3]} rotation={[0, -0.6, 0]}>
        <Cyl rTop={0.02} rBottom={0.02} height={2.2} segments={6} position={[0, 1.1, 0]} color="#2a2c31" />
        <Box size={[0.9, 0.9, 0.35]} position={[0, 2.25, 0]} color="#202226" />
        <Box size={[0.82, 0.82, 0.02]} position={[0, 2.25, 0.18]} color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2 + flash * 4} shadow={false} />
      </group>
      {/* side table with coffee */}
      <group position={[1.35, 0, 2.3]}>
        <Cyl rTop={0.3} rBottom={0.3} height={0.04} segments={10} position={[0, 0.72, 0]} color="#3a3d44" />
        <Cyl rTop={0.03} rBottom={0.03} height={0.7} segments={6} position={[0, 0.35, 0]} color="#3a3d44" />
        {!close ? <Cup position={[0.05, 0.74, 0]} /> : null}
      </group>
      <Hero position={HERO_STUDIO} pose={{...heroPose, mouth: (heroPose.mouth ?? 1) * (0.9 + 0.1 * hop(since, 0, 0.3))}} />
      <Photographer
        position={PHOTOGRAPHER_POS}
        rotation={Math.PI + (close ? 0.15 : 0)}
        cameraUp={close ? 0 : 1}
        pose={
          close
            ? {armL: [lerp(0.3, 2.75, finger), -0.15], elbowL: lerp(0.4, 0.25, finger), armR: [0.95, 0.1], elbowR: 1.25, head: [0.02, 0.18 * Math.sin(s.t * 9) * (1 - finger * 0.5)], mouth: 0.25, eyes: 0.85}
            : {armL: [1.45, 0.45], elbowL: 1.55, armR: [1.45, -0.45], elbowR: 1.55, head: [0.05, 0]}
        }
        rightHand={close ? <Cup position={[0, -0.12, 0.05]} /> : null}
        leftHand={close ? <Box size={[0.03, 0.14, 0.03]} position={[0, 0.1, 0.03]} color="#c58c62" /> : null}
      />
    </group>
  );
};
