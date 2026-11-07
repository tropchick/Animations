import React from 'react';
import * as THREE from 'three';
import {Box, Cyl, DAY, DayLights, Ground, Helicopter, Ico, NIGHT, Sky, SunLight, Tree} from './common';
import {C, V3, clamp01, lerp, ramp, smooth} from './cues';
import {Drone, Granny, SIT} from './people';

// Grandma's village: a log house facing +z at the origin, a table under an apple tree, the bench across the path.
export const VILLAGE: V3 = [0, 0, 2000];
export const TABLE: V3 = [6, 0, 7];
export const BENCH: V3 = [-3, 0, 15];

const LOG = '#8a5a34';
const LOG2 = '#7a4e2c';
const TRIM = '#3a7ad0';

const House: React.FC<{night: boolean}> = ({night}) => (
  <group>
    {/* log walls: a core box and logs 3 cm proud on the front */}
    <Box size={[8, 3.2, 6]} position={[0, 1.9, 0]} color={LOG} />
    {Array.from({length: 11}).map((_, i) => (
      <Box key={i} size={[8.2, 0.16, 0.08]} position={[0, 0.45 + i * 0.29, 3.03]} color={i % 2 ? LOG2 : LOG} />
    ))}
    {/* roof */}
    <Box size={[9, 0.15, 4.0]} position={[0, 4.4, 1.55]} rotation={[0.72, 0, 0]} color="#5a6a7a" />
    <Box size={[9, 0.15, 4.0]} position={[0, 4.4, -1.55]} rotation={[-0.72, 0, 0]} color="#5a6a7a" />
    <Box size={[0.1, 1.9, 5.6]} position={[-3.98, 4.0, 0]} color={LOG2} />
    {/* windows with carved blue frames, warm light at night */}
    {[-2.4, 2.4].map((x) => (
      <group key={x} position={[x, 2.0, 3.1]}>
        <Box size={[1.2, 1.3, 0.06]} color={TRIM} />
        <Box size={[0.95, 1.05, 0.04]} position={[0, 0, 0.03]} color={night ? '#ffd27a' : '#2a3a4a'} emissive={night ? '#ffc060' : '#000000'} emissiveIntensity={night ? 1.4 : 0} shadow={false} />
        <Box size={[0.05, 1.05, 0.05]} position={[0, 0, 0.055]} color="#f2f2f2" shadow={false} />
        <Box size={[1.5, 0.25, 0.08]} position={[0, 0.75, 0.02]} color={TRIM} />
        <Box size={[1.3, 0.08, 0.2]} position={[0, -0.69, 0.08]} color="#f2f2f2" />
      </group>
    ))}
    {/* porch: deck, steps, posts, a little roof, the door */}
    <Box size={[2.6, 0.5, 1.8]} position={[0, 0.25, 3.95]} color="#a8784a" />
    {[0, 1].map((k) => (
      <Box key={k} size={[1.4, 0.18, 0.4]} position={[0, 0.09 + k * 0.17, 5.05 - k * 0.0 + (1 - k) * 0.35]} color="#9a6a3a" />
    ))}
    <Box size={[0.12, 2.3, 0.12]} position={[-1.2, 1.65, 4.75]} color="#a8784a" />
    <Box size={[0.12, 2.3, 0.12]} position={[1.2, 1.65, 4.75]} color="#a8784a" />
    <Box size={[3.0, 0.12, 2.0]} position={[0, 2.85, 4.0]} rotation={[0.15, 0, 0]} color="#5a6a7a" />
    <Box size={[1.0, 2.0, 0.06]} position={[0, 1.5, 3.06]} color="#6a3a22" />
    <Box size={[0.06, 0.06, 0.06]} position={[0.35, 1.5, 3.12]} color="#c8b070" />
  </group>
);

const Fence: React.FC = () => (
  <group>
    {Array.from({length: 46}).map((_, i) => {
      const x = -16 + i * 0.7;
      if (Math.abs(x) < 1.2) return null;
      return <Box key={i} size={[0.12, 1.1, 0.05]} position={[x, 0.55, 10.5]} color="#c8b48a" />;
    })}
    <Box size={[32, 0.1, 0.06]} position={[0, 0.8, 10.45]} color="#a89470" />
    <Box size={[32, 0.1, 0.06]} position={[0, 0.3, 10.45]} color="#a89470" />
  </group>
);

const Plate: React.FC<{position: V3; food: string}> = ({position, food}) => (
  <group position={position}>
    <Cyl rTop={0.16} rBottom={0.12} height={0.03} segments={14} color="#f4f4f0" />
    <Cyl rTop={0.12} rBottom={0.12} height={0.035} segments={10} position={[0, 0.03, 0]} color={food} />
  </group>
);
const FOODS = ['#e8b04a', '#c8402a', '#f2d06a', '#a8783a', '#e8e2c8', '#6a9a3a', '#d87a3a', '#f4c060', '#b85a2a', '#e8b04a'];

export const Village: React.FC<{v: number; night?: boolean; shot: string}> = ({v, night = false, shot}) => {
  // plates: each PLATES time adds one, alternating between two stacks
  const plates = C.plates as number[];
  const wave = shot === 'porch' ? 0.8 + 0.6 * Math.sin(v * 7) : 0;
  const grannyAtTable = shot === 'table';
  const lastPlate = plates.filter((p) => v >= p - 0.25).length;
  const reach = lastPlate > 0 && lastPlate <= plates.length ? clamp01(1 - (v - plates[lastPlate - 1]) / 0.3) : 0;
  return (
    <group position={VILLAGE}>
      {night ? (
        <>
          <Sky c={NIGHT} />
          <fog attach="fog" args={['#0d1630', 30, 160]} />
          <hemisphereLight color="#4a5a88" groundColor="#101018" intensity={0.55} />
          <directionalLight position={[-30, 50, 20]} color="#a8b8e8" intensity={0.5} />
          <Ico radius={3} position={[-40, 45, -80]} color="#f4f0dc" emissive="#f4f0dc" emissiveIntensity={1.2} shadow={false} />
        </>
      ) : (
        <>
          <Sky c={DAY} />
          <fog attach="fog" args={['#d8e8f0', 50, 220]} />
          <DayLights />
          <SunLight dir={[0.5, 0.75, 0.6]} target={[0, 0, 6]} size={22} />
        </>
      )}
      <Ground color={night ? '#1e3020' : '#6aa04a'} />
      <Box size={[1.6, 0.03, 30]} position={[0, 0.015, 18]} color={night ? '#3a3226' : '#b8a07a'} shadow={false} />
      <House night={night} />
      <Fence />
      {[-9, -12, 11, 14, -7, 18].map((x, i) => (
        <Tree key={i} position={[x, 0, -3 + (i % 3) * 4]} s={1.2} seed={i} birch={i % 2 === 0} dark={night} />
      ))}
      {/* the apple tree and the table */}
      <Tree position={[TABLE[0] + 2.2, 0, TABLE[2] - 1.8]} s={1.1} seed={7} dark={night} />
      <group position={TABLE}>
        <Box size={[1.8, 0.08, 1.0]} position={[0, 0.78, 0]} color="#c8a06a" />
        <Box size={[1.82, 0.012, 1.02]} position={[0, 0.826, 0]} color="#f2f0ea" shadow={false} />
        {[-0.8, 0.8].map((x) => (
          <Box key={x} size={[0.08, 0.76, 0.8]} position={[x, 0.38, 0]} color="#9a7040" />
        ))}
        <Box size={[1.8, 0.06, 0.35]} position={[0, 0.45, 0.85]} color="#9a7040" />
        {plates.map((p, k) => {
          if (v < p - 0.25) return null;
          const fall = 1 - smooth(ramp(v, p - 0.25, p));
          const stack = k % 2;
          const h = Math.floor(k / 2);
          return <Plate key={k} position={[stack ? 0.3 : -0.3, 0.85 + h * 0.07 + fall * 0.35, -0.05]} food={FOODS[k]} />;
        })}
        <Cyl rTop={0.06} rBottom={0.05} height={0.12} position={[0.65, 0.89, 0.25]} color="#f4f4f4" />
      </group>
      {/* grandma: on the porch, then at the table */}
      {shot === 'porch' ? (
        <Granny position={[0.4, 0.5, 4.2]} rotation={0} pose={{armR: [2.6, -0.3 - 0.25 * Math.sin(v * 7)], elbowR: 0.3 + wave * 0.2, mouth: 0.3 * Math.abs(Math.sin(v * 4))}} />
      ) : null}
      {grannyAtTable ? (
        <Granny
          position={[TABLE[0], 0, TABLE[2] - 0.85]}
          rotation={0}
          pose={{armR: [0.6 + reach * 0.7, -0.15], elbowR: 0.6 - reach * 0.4, armL: [0.9, 0.15], elbowL: 1.2, mouth: v >= C.granny && v < C.granny + 2.4 ? 0.5 * Math.abs(Math.sin((v - C.granny) * 14)) : 0}}
        />
      ) : null}
      {/* the bench with three grannies staring right at you */}
      <group position={BENCH}>
        <Box size={[2.4, 0.08, 0.5]} position={[0, 0.48, 0]} color="#7a5a3a" />
        <Box size={[2.4, 0.4, 0.06]} position={[0, 0.8, -0.24]} color="#7a5a3a" />
        <Box size={[0.08, 0.44, 0.4]} position={[-1.1, 0.22, 0]} color="#3a3a3e" />
        <Box size={[0.08, 0.44, 0.4]} position={[1.1, 0.22, 0]} color="#3a3a3e" />
        {[
          [-0.86, '#3a8a5a', '#8a5a3a'],
          [0, '#d8483a', '#4a4a7a'],
          [0.86, '#f2c14e', '#6a3a5a'],
        ].map(([x, scarf, cardigan], i) => (
          <Granny
            key={i}
            position={[x as number, -0.28, 0.02]}
            rotation={0}
            scarf={scarf as string}
            cardigan={cardigan as string}
            pose={{...SIT, head: [0.04, 0.12 * Math.sin(v * 0.6 + i) * (shot === 'bench' ? 0.3 : 1)], eyes: 1.15, armL: [0.5, 0.1], elbowL: 1.0, armR: i === 2 ? [1.7, -0.1] : [0.5, -0.1], elbowR: i === 2 ? 0.4 : 1.0}}
            rightHand={i === 2 ? <Box size={[0.08, 0.15, 0.012]} position={[0, -0.06, 0.07]} color="#16171b" /> : undefined}
          />
        ))}
      </group>
      {night ? <NightHeli v={v} /> : null}
    </group>
  );
};

// the helicopter over the house with a searchlight cone
const NightHeli: React.FC<{v: number}> = ({v}) => {
  const sweep = Math.sin(v * 0.9) * 0.35;
  const hp: V3 = [lerp(-12, 2, smooth(ramp(v, 77.2, 79.0))), 11, 8];
  const coneLen = 16;
  const dir = new THREE.Vector3(sweep * 1.4 - hp[0] * 0.08, -1, -0.25).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  const e = new THREE.Euler().setFromQuaternion(q);
  return (
    <>
      <Helicopter position={hp} rotation={-0.3} t={v} color="#5a6478" spot />
      {/* light on the helicopter so it reads against the night sky, plus blinking nav lights */}
      <pointLight position={[hp[0] + 1.5, hp[1] + 3, hp[2] + 5]} intensity={60} distance={14} color="#c8d4ff" />
      <Box size={[0.25, 0.25, 0.25]} position={[hp[0], hp[1] + 1.3, hp[2]]} color="#ff3020" emissive="#ff2010" emissiveIntensity={Math.sin(v * 8) > 0 ? 4 : 0.2} shadow={false} />
      <group position={[hp[0], hp[1] - 1.2, hp[2]]} rotation={[e.x, e.y, e.z]}>
        <mesh position={[0, -coneLen / 2, 0]}>
          <coneGeometry args={[3.2, coneLen, 24, 1, true]} />
          <meshBasicMaterial color="#fff6d8" transparent opacity={0.12} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      <mesh position={[hp[0] + (dir.x * (hp[1] - 1.2)) / -dir.y, 0.03, hp[2] + (dir.z * (hp[1] - 1.2)) / -dir.y]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.0, 32]} />
        <meshBasicMaterial color="#fff2c8" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {[0, 1].map((i) => (
        <Drone key={i} position={[-5 + i * 9, 6 + i, 12 - i * 2]} t={v + i} />
      ))}
    </>
  );
};
