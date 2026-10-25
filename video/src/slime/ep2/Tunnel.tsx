import React from 'react';
import {random} from 'remotion';
import {Box, Cyl, DARK_STEEL, Glow, Ico, RUBBER, STEEL} from '../parts';
import {MASS, useTarget} from '../Hall';

// Underground cable tunnel from «Ковыль» to «Осока»: concrete, cable bundles on brackets, caged lamps.
export const TUNNEL_X = 400;
const LEN = 40;
const CONCRETE = {color: '#4f5458', rough: 0.95};

// k: 0..1, how far the grey strip has crept along the top bundle (it starts near the camera and runs away)
export const Tunnel: React.FC<{k: number}> = ({k}) => {
  const x = TUNNEL_X;
  const front = -2 - k * 9;
  const cables = [1.75, 1.5, 1.25];
  const blobs = Array.from({length: 26}).map((_, i) => -1.0 - i * 0.42).filter((z) => z > front);
  return (
    <group>
      <Box size={[2.4, 0.1, LEN]} position={[x, -0.05, -LEN / 2 + 2]} m={CONCRETE} />
      <Box size={[2.4, 0.1, LEN]} position={[x, 2.45, -LEN / 2 + 2]} m={{color: '#3a3e42', rough: 0.95}} shadow={false} />
      <Box size={[0.1, 2.5, LEN]} position={[x - 1.15, 1.2, -LEN / 2 + 2]} m={CONCRETE} />
      <Box size={[0.1, 2.5, LEN]} position={[x + 1.15, 1.2, -LEN / 2 + 2]} m={CONCRETE} />
      <Box size={[0.3, 0.04, LEN]} position={[x - 0.3, 0.02, -LEN / 2 + 2]} m={{color: '#2d3236', rough: 0.4, metal: 0.3, env: 0.9}} shadow={false} />
      {/* brackets and cable bundles on the right wall */}
      {Array.from({length: 26}).map((_, i) => (
        <group key={i} position={[x + 1.0, 0, 1 - i * 1.5]}>
          {cables.map((y) => (
            <Box key={y} size={[0.3, 0.03, 0.05]} position={[0, y - 0.07, 0]} m={DARK_STEEL} shadow={false} />
          ))}
          <Box size={[0.04, 1.0, 0.05]} position={[0.12, 1.45, 0]} m={DARK_STEEL} shadow={false} />
        </group>
      ))}
      {cables.map((y, j) => (
        <group key={y}>
          {[-0.07, 0, 0.07].map((dx) => (
            <Cyl key={dx} r={0.028} h={LEN} seg={6} position={[x + 0.95 + dx, y, -LEN / 2 + 2]} rotation={[Math.PI / 2, 0, 0]} m={j === 1 ? {color: '#2a2622', rough: 0.8} : RUBBER} />
          ))}
        </group>
      ))}
      {/* the strip: a grey skin over the top bundle, lumpy at its front */}
      <Cyl r={0.075} h={-front - 0.5} seg={8} position={[x + 0.95, cables[0] + 0.01, (front - 0.5) / 2]} rotation={[Math.PI / 2, 0, 0]} m={MASS} shadow={false} />
      {blobs.map((z, i) => (
        <Ico key={i} r={0.05 + random(`tb-${i}`) * 0.04} position={[x + 0.95 + (random(`tbx-${i}`) - 0.5) * 0.1, cables[0] + 0.05, z]} m={MASS} shadow={false} />
      ))}
      <Ico r={0.06} position={[x + 0.95, cables[0] + 0.03, front]} m={MASS} shadow={false} />
      {/* caged lamps, the far ones dead */}
      {Array.from({length: 7}).map((_, i) => {
        const z = -1 - i * 5;
        const on = i < 4;
        return (
          <group key={i} position={[x, 2.3, z]}>
            <Box size={[0.3, 0.12, 0.2]} m={DARK_STEEL} shadow={false} />
            {[-0.1, 0, 0.1].map((dx) => (
              <Box key={dx} size={[0.012, 0.1, 0.22]} position={[dx, -0.08, 0]} m={STEEL} shadow={false} />
            ))}
            {on ? (
              <>
                <Glow size={[0.2, 0.04, 0.12]} position={[0, -0.08, 0]} color="#e9dcb8" />
                <pointLight position={[0, -0.3, 0]} color="#e2d6b4" intensity={2.2} distance={6} decay={2} />
              </>
            ) : null}
          </group>
        );
      })}
      <ambientLight intensity={0.04} color="#9fb4c8" />
      <spotLight position={[x - 0.4, 2.2, 0.5]} target={useTarget([x + 0.9, 1.5, -6])} color="#e2d6b4" intensity={3} distance={12} angle={0.5} penumbra={0.8} decay={2} />
    </group>
  );
};
