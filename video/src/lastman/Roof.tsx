import React from 'react';
import {Block, Box, Cyl, NIGHT, Pic, Sky} from './common';
import {V3, rnd} from './cues';
import {drawBillboard, tex} from './tex';

// Night rooftop over the city; the hero's face on every big screen. The roof edge is at z = 0, the city on +z.
export const ROOF: V3 = [0, 0, 3000];

const SCREENS: [V3, number, [number, number], string, string][] = [
  [[-14, 22, 60], 0.25, [16, 9], 'ПОСЛЕДНИЙ|МУЖЧИНА', '#c8302a'],
  [[22, 30, 90], -0.3, [20, 11], 'ОН|СУЩЕСТВУЕТ', '#1a4aa8'],
  [[4, 40, 150], 0, [26, 14], 'ДЕНЬ|ЕГО', '#7a2a9a'],
  [[-40, 26, 120], 0.45, [18, 10], 'НАЙДИ|ЕГО', '#d8702a'],
];

export const Roof: React.FC<{v: number}> = ({v}) => (
  <group position={ROOF}>
    <Sky c={NIGHT} />
    <fog attach="fog" args={['#0d1630', 80, 420]} />
    <hemisphereLight color="#4a5a88" groundColor="#101018" intensity={0.6} />
    <directionalLight position={[-30, 50, -20]} color="#a8b8e8" intensity={0.4} />
    {/* the roof: tar floor, a parapet, a vent box and an antenna */}
    <Box size={[16, 0.2, 12]} position={[0, -0.1, -5]} color="#2a2c32" />
    <Box size={[16, 0.9, 0.3]} position={[0, 0.45, 0.85]} color="#5a5e66" />
    <Box size={[0.3, 0.9, 12]} position={[-7.85, 0.45, -5]} color="#5a5e66" />
    <Box size={[1.4, 1.2, 1.4]} position={[-4.5, 0.6, -2.5]} color="#6a6e76" />
    <Cyl rTop={0.04} rBottom={0.06} height={5} position={[5, 2.5, -3]} color="#8a8e96" />
    <Box size={[0.08, 0.08, 0.08]} position={[5, 5.05, -3]} color="#ff2a2a" emissive="#ff2020" emissiveIntensity={Math.sin(v * 3) > 0 ? 3 : 0.3} shadow={false} />
    {/* the city: blocks with lit windows, below and around */}
    {Array.from({length: 46}).map((_, i) => {
      const x = (rnd(i, 1) - 0.5) * 260;
      const z = 22 + rnd(i, 2) * 230;
      // below the roof near us, a few towers far away
      const top = z > 150 ? -10 + rnd(i, 3) * 35 : -32 + rnd(i, 3) * 26;
      return <Block key={i} position={[x, -70, z]} size={[10 + rnd(i, 4) * 14, top + 70, 10 + rnd(i, 5) * 8]} rotation={Math.PI} night seed={i + 100} lit={0.3 + rnd(i, 6) * 0.3} />;
    })}
    {SCREENS.map(([p, r, s, line, bg], i) => {
      const map = tex(`bill-${i}`, 640, 360, drawBillboard(line, bg));
      return (
        <group key={i} position={p} rotation={[0, r, 0]}>
          <Box size={[s[0] + 0.8, s[1] + 0.8, 0.6]} position={[0, 0, 0.35]} color="#111216" />
          <Pic size={s} map={map} position={[0, 0, -0.01]} rotation={[0, Math.PI, 0]} glow={1.1 + 0.08 * Math.sin(v * 2 + i)} />
          <Box size={[0.6, 60, 0.6]} position={[0, -30 - s[1] / 2, 0.4]} color="#1a1c22" />
        </group>
      );
    })}
  </group>
);
