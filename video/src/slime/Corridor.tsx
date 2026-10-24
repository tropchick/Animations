import React from 'react';
import {Box, DARK_STEEL, FLOOR, Glow, PANEL, STEEL} from './parts';
import {V3} from './cues';
import {useTarget} from './Hall';

export const CORRIDOR_X = 60;
const LEN = 22;

// Long empty service corridor that ends in a locked steel door.
export const Corridor: React.FC = () => {
  const x = CORRIDOR_X;
  const lights = Array.from({length: 7}).map((_, i) => -1.5 - i * 3);
  const door: V3 = [x, 1.05, -LEN + 0.12];
  const target = useTarget([x, 0, -LEN]);
  return (
    <group>
      <Box size={[2.6, 0.1, LEN + 2]} position={[x, -0.05, -LEN / 2]} m={FLOOR} />
      <Box size={[2.6, 0.1, LEN + 2]} position={[x, 2.85, -LEN / 2]} m={{color: '#1a1e23', rough: 0.9}} shadow={false} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box size={[0.1, 2.8, LEN + 2]} position={[x + s * 1.25, 1.4, -LEN / 2]} m={PANEL} />
          <Box size={[0.04, 0.12, LEN + 2]} position={[x + s * 1.18, 0.06, -LEN / 2]} m={DARK_STEEL} shadow={false} />
          <Box size={[0.03, 0.06, LEN + 2]} position={[x + s * 1.19, 1.0, -LEN / 2]} m={STEEL} shadow={false} />
          {Array.from({length: 10}).map((_, i) => (
            <Box key={i} size={[0.02, 2.8, 0.02]} position={[x + s * 1.195, 1.4, -1 - i * 2.2]} m={{color: '#141a20', rough: 1}} shadow={false} />
          ))}
        </group>
      ))}
      {lights.map((z) => (
        <group key={z}>
          <Glow size={[0.5, 0.02, 1.0]} position={[x, 2.79, z]} color="#dde9f6" />
          <pointLight position={[x, 2.5, z]} color="#dde9f6" intensity={1.6} distance={5} decay={2} />
        </group>
      ))}
      {/* the door at the end */}
      <Box size={[1.4, 2.4, 0.1]} position={[x, 1.2, -LEN]} m={DARK_STEEL} />
      <Box size={[1.1, 2.1, 0.08]} position={door} m={STEEL} />
      <Box size={[0.04, 0.3, 0.06]} position={[x + 0.4, 1.05, -LEN + 0.19]} m={DARK_STEEL} />
      <Box size={[0.14, 0.2, 0.03]} position={[x + 0.62, 1.3, -LEN + 0.17]} m={DARK_STEEL} />
      <Glow size={[0.05, 0.05, 0.01]} position={[x + 0.62, 1.34, -LEN + 0.19]} color="#ff3b30" />
      <pointLight position={[x + 0.62, 1.34, -LEN + 0.6]} color="#ff3b30" intensity={0.6} distance={2.5} decay={2} />
      <ambientLight intensity={0.12} color="#9fb4c8" />
      <spotLight
        position={[x, 2.6, -LEN + 3.5]}
        target={target}
        color="#dde9f6"
        intensity={4}
        distance={7}
        angle={0.7}
        penumbra={0.8}
        decay={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
    </group>
  );
};
