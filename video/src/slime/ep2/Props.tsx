import React from 'react';
import {AdditiveBlending} from 'three';
import {V3} from '../cues';
import {Box, Cyl, DARK_STEEL, Glow, Mat, RUBBER, STEEL} from '../parts';

const BLACK_PLASTIC: Mat = {color: '#1f2327', rough: 0.45, metal: 0.15, env: 0.9};

// Walkie-talkie standing on the sill. led: 0 off .. 1 bright green; reflect: the window seen in its face.
export const Radio: React.FC<{position: V3; rotation?: number; led: number; reflect?: number}> = ({position, rotation = 0, led, reflect = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[0.062, 0.15, 0.036]} position={[0, 0.075, 0]} m={BLACK_PLASTIC} />
    <Box size={[0.066, 0.02, 0.04]} position={[0, 0.01, 0]} m={RUBBER} />
    <Cyl r={0.006} h={0.11} seg={6} position={[0.019, 0.2, -0.004]} m={RUBBER} />
    <Cyl r={0.009} h={0.016} seg={8} position={[-0.016, 0.158, -0.004]} m={DARK_STEEL} />
    {/* speaker grill */}
    {Array.from({length: 6}).map((_, i) => (
      <Box key={i} size={[0.04, 0.003, 0.002]} position={[0, 0.04 + i * 0.008, 0.0185]} m={{color: '#0c0e10', rough: 1}} shadow={false} />
    ))}
    {/* small screen and the led */}
    <Box size={[0.036, 0.018, 0.002]} position={[0, 0.115, 0.0185]} m={{color: '#18262a', rough: 0.3, emissive: '#2f5a4a', glow: 0.15 + led * 0.5}} shadow={false} />
    <Box size={[0.008, 0.008, 0.004]} position={[0.02, 0.137, 0.0185]} m={led > 0.02 ? {color: '#5dff8f', emissive: '#5dff8f', glow: 0.5 + led * 3} : {color: '#123018'}} shadow={false} />
    {led > 0.02 ? <pointLight position={[0.02, 0.137, 0.05]} color="#5dff8f" intensity={0.05 * led} distance={0.4} decay={2} /> : null}
    <Box size={[0.02, 0.012, 0.004]} position={[-0.033, 0.11, 0]} m={DARK_STEEL} shadow={false} />
    {reflect > 0 ? (
      <group position={[0.004, 0.08, 0.0195]}>
        {[[-0.009, 0.014], [0.009, 0.014], [-0.009, -0.014], [0.009, -0.014]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0]}>
            <planeGeometry args={[0.015, 0.024]} />
            <meshBasicMaterial color="#9fb6cc" transparent opacity={0.16 * reflect} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
    ) : null}
  </group>
);

// Desk phone on the console; the handset is drawn separately when Gleb holds it.
export const PhoneBase: React.FC<{position: V3; rotation?: number}> = ({position, rotation = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[0.2, 0.06, 0.22]} position={[0, 0.03, 0]} m={BLACK_PLASTIC} />
    <Box size={[0.12, 0.012, 0.09]} position={[0, 0.062, 0.05]} m={DARK_STEEL} shadow={false} />
    {Array.from({length: 12}).map((_, i) => (
      <Box key={i} size={[0.022, 0.006, 0.018]} position={[-0.035 + (i % 3) * 0.035, 0.068, 0.02 + Math.floor(i / 3) * 0.022]} m={STEEL} shadow={false} />
    ))}
    <Glow size={[0.05, 0.004, 0.02]} position={[0.05, 0.062, -0.07]} color="#7fb9c9" power={0.8} />
  </group>
);

export const Handset: React.FC = () => (
  <group>
    <Box size={[0.05, 0.2, 0.04]} position={[0, 0, 0]} m={BLACK_PLASTIC} />
    <Box size={[0.06, 0.045, 0.05]} position={[0, 0.09, 0.012]} m={BLACK_PLASTIC} />
    <Box size={[0.06, 0.045, 0.05]} position={[0, -0.09, 0.012]} m={BLACK_PLASTIC} />
  </group>
);

// Round clock on the corridor wall
export const WallClock: React.FC<{position: V3; rotation?: number; v: number}> = ({position, rotation = 0, v}) => {
  const sec = Math.floor(v);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Cyl r={0.16} h={0.04} seg={16} rotation={[Math.PI / 2, 0, 0]} m={DARK_STEEL} />
      <Cyl r={0.145} h={0.01} seg={16} position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]} m={{color: '#c9cdd0', rough: 0.7}} />
      {[[0.09, -0.6], [0.12, 2.5], [0.13, (sec / 60) * Math.PI * 2]].map(([len, a], i) => (
        <group key={i} position={[0, 0, 0.027 + i * 0.002]} rotation={[0, 0, -a]}>
          <Box size={[i === 2 ? 0.004 : 0.01, len, 0.002]} position={[0, len / 2 - 0.015, 0]} m={{color: i === 2 ? '#a3342b' : '#1b1d20'}} shadow={false} />
        </group>
      ))}
    </group>
  );
};
