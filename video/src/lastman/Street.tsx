import React from 'react';
import {Block, Box, Cyl, DAY, DayLights, Ground, Sky, SunLight, Tree} from './common';
import {C, V3, clamp01, easeIn, lerp, lerp3, ramp, smooth} from './cues';
import {Drone, Woman, walk} from './people';

// The run: a street along -z. The camera runs at RUN_SPEED from z = 0.
export const STREET: V3 = [0, 0, 1200];
export const RUN_SPEED = 6.2;
export const runZ = (v: number) => -RUN_SPEED * Math.max(0, v - 61.2);

export const dronesAt = (v: number): V3[] => {
  const cz = runZ(v);
  const k = smooth(ramp(v, 61.3, 62.6));
  return [0, 1, 2].map((i) => {
    const ahead = lerp(-6 + i * 2, 5 + i * 1.5, k);
    return [STREET[0] + (i - 1) * 2.2 + 0.4 * Math.sin(v * 2 + i), 3.4 + 0.5 * i + 0.2 * Math.sin(v * 3 + i), STREET[2] + cz - ahead] as V3;
  });
};

export const Street: React.FC<{v: number}> = ({v}) => {
  const cz = runZ(v);
  return (
    <group position={STREET}>
      <Sky c={DAY} />
      <fog attach="fog" args={['#cfe0ee', 40, 200]} />
      <DayLights />
      <SunLight dir={[0.5, 0.8, 0.3]} target={[0, 0, cz - 15]} size={30} />
      <Ground color="#7a8a6a" />
      <Box size={[8, 0.08, 400]} position={[0, 0.04, -150]} color="#5d5f66" />
      <Box size={[5, 0.14, 400]} position={[-6.5, 0.07, -150]} color="#b9b3a8" />
      <Box size={[5, 0.14, 400]} position={[6.5, 0.07, -150]} color="#b9b3a8" />
      {Array.from({length: 20}).map((_, i) => (
        <Box key={i} size={[0.15, 0.012, 2]} position={[0, 0.086, -i * 8]} color="#f2f2f2" shadow={false} />
      ))}
      {Array.from({length: 8}).map((_, i) => (
        <React.Fragment key={i}>
          <Block position={[-16, 0, -i * 26 + 10]} size={[22, 16 + (i % 3) * 5, 10]} rotation={Math.PI / 2} color={['#d8cdb8', '#c8b8a8', '#e2d8c8'][i % 3]} seed={20 + i} />
          <Block position={[16, 0, -i * 26 + 4]} size={[22, 18 + (i % 2) * 6, 10]} rotation={-Math.PI / 2} color={['#d2cab8', '#e0d0c0', '#cfc6b4'][i % 3]} seed={40 + i} />
        </React.Fragment>
      ))}
      {Array.from({length: 10}).map((_, i) => (
        <Tree key={i} position={[i % 2 ? 9.5 : -9.5, 0, -i * 12 - 4]} s={0.8} seed={i} birch={i % 3 === 0} />
      ))}
      {/* people on the sidewalks jump aside as the hot dog runs past */}
      {[
        [-3.2, -14, 0],
        [3.6, -24, 1],
        [-3.8, -31, 2],
        [3.0, -40, 3],
      ].map(([x, z, i]) => {
        const near = clamp01(1 - Math.abs(cz - z) / 6);
        const jump = Math.sin(clamp01((z - cz + 5) / 5) * Math.PI) * (cz < z + 5 ? 1 : 0);
        return (
          <Woman
            key={i}
            i={i + 40}
            position={[x + Math.sign(x) * 1.6 * smooth(clamp01((z - cz + 7) / 4)), Math.max(0, jump) * 0.25, z]}
            rotation={Math.sign(x) * 1.2}
            pose={{...walk(v, 0.3), armL: [2.2 * near, 0.3], armR: [2.4 * near, -0.3], eyes: 1 + 0.5 * near, mouth: 0.6 * near}}
          />
        );
      })}
      {dronesAt(v).map((p, i) => (
        <Drone key={i} position={[p[0] - STREET[0], p[1], p[2] - STREET[2]]} rotation={[0.15, Math.PI, 0]} t={v + i} />
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- the elektrichka vestibule, doors to the platform on +z
export const TRAIN: V3 = [0, 0, 1600];
export const BONK_POINT: V3 = [0.3, 1.75, 0.22];

export const trainShift = (v: number) => -easeIn(ramp(v, C.trainGo, C.trainGo + 3.5)) * 9 * 1.2;

export const Train: React.FC<{v: number}> = ({v}) => {
  const doors = 1 - smooth(ramp(v, C.doorsShut - 0.5, C.doorsShut));
  const shift = trainShift(v);
  // the drone: flies at the window, bonks, wobbles back
  const a = ramp(v, 64.3, C.bonk);
  const back = smooth(ramp(v, C.bonk, C.bonk + 0.9));
  const dp = lerp3(lerp3([4.5, 3.5, 9], [BONK_POINT[0], BONK_POINT[1], BONK_POINT[2] + 0.35], easeIn(a)), [1.2, 2.6, 3.2], back);
  const others: V3[] = [
    [-2.5 + 0.3 * Math.sin(v * 2), 2.9, 5.5],
    [2.8, 3.4 + 0.2 * Math.sin(v * 3), 6.5],
  ];
  return (
    <group position={TRAIN}>
      <Sky c={DAY} />
      <DayLights />
      <SunLight dir={[0.4, 0.8, 0.5]} target={[0, 0, 6]} size={20} />
      {/* outside: the platform and a shelter, moving away when the train leaves */}
      <group position={[shift, 0, 0]}>
        <Ground color="#7a8a6a" y={-1.2} />
        <Box size={[80, 1.1, 5]} position={[0, -0.55, 3.2]} color="#a8a49c" />
        <Box size={[80, 0.02, 0.3]} position={[0, 0.01, 0.95]} color="#f2c14e" shadow={false} />
        <Box size={[6, 0.15, 2.4]} position={[-4, 2.8, 4.5]} color="#3a6a4a" />
        <Box size={[0.12, 2.8, 0.12]} position={[-6.6, 1.4, 4.0]} color="#3a3d44" />
        <Box size={[0.12, 2.8, 0.12]} position={[-1.4, 1.4, 4.0]} color="#3a3d44" />
        <Box size={[3, 0.1, 0.5]} position={[-4, 0.5, 5.2]} color="#9a6a42" />
        {[8, 14, 22, -14, -22].map((x, i) => (
          <Tree key={i} position={[x, -1.2, 9 + (i % 2) * 3]} s={1} seed={i} birch />
        ))}
        {others.map((p, i) => (
          <Drone key={i} position={[p[0] - shift, p[1], p[2]]} rotation={[0.2, Math.PI, 0]} t={v + i} />
        ))}
      </group>
      <Drone position={dp} rotation={[0.25 - back * 0.8 * Math.sin(v * 9) * (1 - back), Math.PI, back * 0.5 * Math.sin(v * 13)]} t={v} />
      {/* inside: vestibule walls, floor, ceiling; the doors with windows */}
      <Box size={[3.2, 0.1, 2.2]} position={[0, -0.05, -1.0]} color="#6a6e66" />
      <Box size={[3.2, 0.1, 2.2]} position={[0, 2.5, -1.0]} color="#e2e2da" />
      <Box size={[0.1, 2.6, 2.2]} position={[-1.6, 1.25, -1.0]} color="#9ab09a" />
      <Box size={[0.1, 2.6, 2.2]} position={[1.6, 1.25, -1.0]} color="#9ab09a" />
      <Box size={[0.95, 2.6, 0.1]} position={[-1.1, 1.25, 0.05]} color="#3a7a4a" />
      <Box size={[0.95, 2.6, 0.1]} position={[1.1, 1.25, 0.05]} color="#3a7a4a" />
      <Box size={[1.3, 0.35, 0.1]} position={[0, 2.37, 0.05]} color="#3a7a4a" />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (0.32 + doors * 0.62), 0, 0.12]}>
          <Box size={[0.62, 1.23, 0.05]} position={[0, 0.635, 0]} color="#c8402a" />
          <Box size={[0.62, 0.17, 0.05]} position={[0, 2.035, 0]} color="#c8402a" />
          <Box size={[0.09, 0.7, 0.05]} position={[-0.265, 1.6, 0]} color="#c8402a" />
          <Box size={[0.09, 0.7, 0.05]} position={[0.265, 1.6, 0]} color="#c8402a" />
          <mesh position={[0, 1.6, 0]}>
            <planeGeometry args={[0.44, 0.7]} />
            <meshStandardMaterial color="#d8ecff" transparent opacity={0.15} roughness={0.1} depthWrite={false} />
          </mesh>
        </group>
      ))}
      <Cyl rTop={0.02} rBottom={0.02} height={1.0} position={[-1.5, 1.3, -0.4]} color="#d8dce2" />
      <pointLight position={[0, 2.2, -1]} intensity={4} distance={5} color="#fff8e8" />
    </group>
  );
};
