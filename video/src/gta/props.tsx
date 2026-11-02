import React from 'react';
import * as THREE from 'three';
import {Box, Cone, Cyl, Ico} from '../scene/parts';
import {Person, PersonPose} from '../scene/Characters';
import {V3, rnd} from './cues';

// mixes a colour towards another one (frost, ash, soot)
export const mix = (a: string, b: string, k: number) => {
  if (k <= 0) return a;
  if (k >= 1) return b;
  return '#' + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();
};
export const ICE = '#dfeaf2';
export const ASH = '#77726b';
export const SOOT = '#1d1a18';

// ---------- the fan: teal hoodie, jeans, always with his console box ----------

export const HOODIE = '#2aa79b';
export const JEANS = '#2c3550';

export type FanLook = {hood?: boolean; mask?: boolean; beard?: boolean; blanket?: boolean; frost?: number};

const ConsoleBox: React.FC<{position?: V3; rotation?: V3; frost?: number}> = ({position, rotation, frost = 0}) => (
  <group position={position} rotation={rotation}>
    <Box size={[0.5, 0.13, 0.36]} color={mix('#f2f2f4', ICE, frost)} />
    <Box size={[0.505, 0.135, 0.12]} position={[0, 0, 0.09]} color={mix('#1f3f9e', ICE, frost * 0.7)} />
    {/* a picture of the console on the lid */}
    <Box size={[0.22, 0.01, 0.13]} position={[-0.08, 0.07, -0.07]} color={mix('#26262c', ICE, frost * 0.7)} shadow={false} />
    <Box size={[0.1, 0.01, 0.04]} position={[0.14, 0.07, -0.1]} color={mix('#ff6a7a', ICE, frost * 0.7)} shadow={false} />
  </group>
);
export {ConsoleBox};

const Hood: React.FC<{up: boolean}> = ({up}) =>
  up ? (
    <group>
      <Box size={[0.38, 0.12, 0.38]} position={[0, 0.39, -0.01]} color="#238f85" />
      <Box size={[0.06, 0.42, 0.36]} position={[-0.185, 0.18, -0.02]} color="#238f85" />
      <Box size={[0.06, 0.42, 0.36]} position={[0.185, 0.18, -0.02]} color="#238f85" />
      <Box size={[0.38, 0.42, 0.06]} position={[0, 0.2, -0.17]} color="#238f85" />
    </group>
  ) : null;

const GasMask: React.FC = () => (
  <group>
    <Box size={[0.26, 0.17, 0.09]} position={[0, 0.1, 0.17]} color="#2d2f2c" />
    <Cyl rTop={0.055} rBottom={0.06} height={0.08} position={[0, 0.06, 0.24]} rotation={[Math.PI / 2, 0, 0]} color="#454842" />
    <Cyl rTop={0.04} rBottom={0.04} height={0.1} position={[-0.13, 0.08, 0.17]} rotation={[0, 0, Math.PI / 2]} color="#5a5d55" />
    <Box size={[0.3, 0.12, 0.05]} position={[0, 0.215, 0.165]} color="#2d2f2c" />
    <Cyl rTop={0.045} rBottom={0.045} height={0.02} position={[-0.07, 0.215, 0.195]} rotation={[Math.PI / 2, 0, 0]} color="#8fa7a8" emissive="#3a4a4c" />
    <Cyl rTop={0.045} rBottom={0.045} height={0.02} position={[0.07, 0.215, 0.195]} rotation={[Math.PI / 2, 0, 0]} color="#8fa7a8" emissive="#3a4a4c" />
    <Box size={[0.34, 0.03, 0.3]} position={[0, 0.25, 0.0]} color="#202220" />
  </group>
);

const Beard: React.FC = () => (
  <group>
    <Box size={[0.32, 0.1, 0.05]} position={[0, 0.05, 0.145]} color="#4a3324" />
    <Box size={[0.2, 0.08, 0.05]} position={[0, -0.01, 0.13]} color="#4a3324" />
    <Box size={[0.03, 0.12, 0.28]} position={[-0.15, 0.1, 0.0]} color="#4a3324" />
    <Box size={[0.03, 0.12, 0.28]} position={[0.15, 0.1, 0.0]} color="#4a3324" />
  </group>
);

export const Fan: React.FC<{position: V3; rotation?: number; pose?: PersonPose; look?: FanLook; box?: 'chest' | 'overhead' | 'lap' | 'none'}> = ({
  position,
  rotation = 0,
  pose = {},
  look = {},
  box = 'chest',
}) => {
  const frost = look.frost ?? 0;
  const p: PersonPose = {...pose};
  if (box === 'chest') {
    p.armL = pose.armL ?? [0.5, 0.1];
    p.armR = pose.armR ?? [0.5, -0.1];
    p.elbowL = pose.elbowL ?? 1.0;
    p.elbowR = pose.elbowR ?? 1.0;
  }
  if (box === 'overhead') {
    p.armL = [2.75, 0.18];
    p.armR = [2.75, -0.18];
    p.elbowL = 0.25;
    p.elbowR = 0.25;
  }
  const headExtra = (
    <>
      <Hood up={!!look.hood} />
      {look.mask ? <GasMask /> : null}
      {look.beard ? <Beard /> : null}
    </>
  );
  const bodyExtra = (
    <>
      {!look.hood ? <Box size={[0.4, 0.14, 0.12]} position={[0, 1.55, -0.13]} color="#238f85" /> : null}
      {/* hoodie pocket and strings */}
      <Box size={[0.34, 0.14, 0.02]} position={[0, 1.02, 0.16]} color="#238f85" shadow={false} />
      <Box size={[0.015, 0.14, 0.015]} position={[-0.05, 1.42, 0.16]} color="#f0f0f0" shadow={false} />
      <Box size={[0.015, 0.14, 0.015]} position={[0.05, 1.42, 0.16]} color="#f0f0f0" shadow={false} />
      {look.blanket ? (
        <>
          <Box size={[0.75, 0.9, 0.5]} position={[0, 1.2, -0.02]} color="#8a3b3b" />
          <Box size={[0.62, 0.3, 0.9]} position={[0, 0.9, 0.45]} color="#7a3232" />
          <Box size={[0.76, 0.05, 0.51]} position={[0, 1.4, -0.02]} color="#c8b070" shadow={false} />
        </>
      ) : null}
      {box === 'chest' ? <ConsoleBox position={[0, 1.1, 0.48]} frost={frost} /> : null}
      {box === 'overhead' ? <ConsoleBox position={[0, 2.46, 0.12]} frost={frost} /> : null}
      {box === 'lap' ? <ConsoleBox position={[0, 1.0, 0.5]} rotation={[0.1, 0, 0]} frost={frost} /> : null}
    </>
  );
  return (
    <Person
      position={position}
      rotation={rotation}
      shirt={mix(HOODIE, ICE, frost * 0.5)}
      pants={JEANS}
      hair="#3a2a1f"
      pose={p}
      headExtra={headExtra}
      bodyExtra={bodyExtra}
    />
  );
};

export const runPose = (t: number, amount = 1, freq = 2.6): PersonPose => {
  const ph = t * freq * Math.PI * 2;
  return {
    legL: Math.sin(ph) * 0.7 * amount,
    legR: -Math.sin(ph) * 0.7 * amount,
    armL: [-Math.sin(ph) * 0.6 * amount, 0.08],
    armR: [Math.sin(ph) * 0.6 * amount, -0.08],
    elbowL: 0.9,
    elbowR: 0.9,
  };
};

export const walkPose = (t: number, amount = 1, freq = 1.7): PersonPose => {
  const ph = t * freq * Math.PI * 2;
  return {
    legL: Math.sin(ph) * 0.42 * amount,
    legR: -Math.sin(ph) * 0.42 * amount,
  };
};
// the body bobs twice per stride
export const bob = (t: number, amount: number, freq: number) => Math.abs(Math.sin(t * freq * Math.PI * 2)) * 0.05 * amount;

// ---------- cars ----------

export const CAR_COLORS = ['#f2a7c3', '#7fd3c8', '#f5d77a', '#e86a5a', '#a9c7f0', '#ffffff'];

export const Car: React.FC<{position: V3; rotation?: number; color: string; crush?: number; burnt?: number; frost?: number; tumble?: V3}> = ({
  position,
  rotation = 0,
  color,
  crush = 0,
  burnt = 0,
  frost = 0,
  tumble,
}) => {
  const body = mix(mix(color, SOOT, burnt), ICE, frost);
  const dark = mix(mix('#1d2430', SOOT, burnt), ICE, frost * 0.6);
  const glass = mix(mix('#7aa6c2', '#151515', burnt), ICE, frost * 0.8);
  const sy = 1 - 0.55 * crush;
  return (
    <group position={position} rotation={tumble ?? [0, rotation, 0]}>
      <group scale={[1 + 0.08 * crush, sy, 1 + 0.05 * crush]}>
        <Box size={[4.2, 0.62, 1.8]} position={[0, 0.62, 0]} color={body} />
        <Box size={[2.2, 0.52, 1.6]} position={[-0.15, 1.18, 0]} color={body} />
        <Box size={[2.05, 0.4, 1.62]} position={[-0.15, 1.18, 0]} color={glass} shadow={false} />
        <Box size={[0.05, 0.16, 0.4]} position={[2.11, 0.68, 0.6]} color={burnt > 0.3 ? SOOT : '#fff6c8'} emissive={burnt > 0.3 ? undefined : '#5a5030'} shadow={false} />
        <Box size={[0.05, 0.16, 0.4]} position={[2.11, 0.68, -0.6]} color={burnt > 0.3 ? SOOT : '#fff6c8'} emissive={burnt > 0.3 ? undefined : '#5a5030'} shadow={false} />
        <Box size={[0.05, 0.14, 0.4]} position={[-2.11, 0.7, 0.6]} color="#a8242a" shadow={false} />
        <Box size={[0.05, 0.14, 0.4]} position={[-2.11, 0.7, -0.6]} color="#a8242a" shadow={false} />
      </group>
      {[
        [1.35, 0.92],
        [-1.35, 0.92],
        [1.35, -0.92],
        [-1.35, -0.92],
      ].map(([x, z], i) => (
        <Cyl key={i} rTop={0.36} rBottom={0.36} height={0.26} position={[x, 0.36, z]} rotation={[Math.PI / 2, 0, 0]} color={dark} segments={10} />
      ))}
      {frost > 0.4 ? <Box size={[2.3, 0.08, 1.65]} position={[-0.15, 1.46 * sy, 0]} color="#f4f8fb" /> : null}
    </group>
  );
};

// ---------- palms ----------

export const Palm: React.FC<{position: V3; seed: number; lean?: number; sway?: number; frost?: number; broken?: number; burnt?: number}> = ({
  position,
  seed,
  lean = 0,
  sway = 0,
  frost = 0,
  broken = 0,
  burnt = 0,
}) => {
  const h = 7 + rnd(seed) * 3;
  const segs = broken > 0.5 ? 2 : 6;
  const bend = (0.12 + rnd(seed + 1) * 0.12) * (rnd(seed + 2) > 0.5 ? 1 : -1);
  const trunk = mix(mix('#8a6a48', SOOT, burnt), ICE, frost * 0.7);
  const leaf = mix(mix('#3f9a4f', '#2a2622', burnt), ICE, frost * 0.85);
  const parts: React.ReactNode[] = [];
  let p = new THREE.Vector3(0, 0, 0);
  let a = 0;
  for (let i = 0; i < segs; i++) {
    a += bend / segs + sway / segs;
    const len = h / 6;
    const d = new THREE.Vector3(Math.sin(a), Math.cos(a), 0).multiplyScalar(len);
    const c = p.clone().add(d.clone().multiplyScalar(0.5));
    parts.push(<Cyl key={i} rTop={0.17 - i * 0.01} rBottom={0.2 - i * 0.01} height={len * 1.04} position={[c.x, c.y, c.z]} rotation={[0, 0, -a]} color={trunk} segments={6} />);
    p = p.add(d);
  }
  return (
    <group position={position} rotation={[0, seed * 1.7, lean]}>
      {parts}
      {broken > 0.5 ? null : (
        <group position={[p.x, p.y, p.z]}>
          {Array.from({length: 7}).map((_, i) => {
            const yaw = (i / 7) * Math.PI * 2 + seed;
            const droop = 0.45 + 0.15 * Math.sin(i * 2.3 + seed) + sway * 0.4 * Math.cos(yaw);
            return (
              <group key={i} rotation={[0, yaw, 0]}>
                <group rotation={[0, 0, -droop]}>
                  <Box size={[2.4, 0.06, 0.55]} position={[1.15, 0, 0]} color={leaf} />
                  {frost > 0.5 ? <Box size={[2.2, 0.05, 0.45]} position={[1.1, 0.05, 0]} color="#f6f9fb" /> : null}
                </group>
              </group>
            );
          })}
          <Ico radius={0.3} position={[0, -0.1, 0]} color={mix('#6a4a2a', ICE, frost)} />
        </group>
      )}
    </group>
  );
};

// ---------- a lava bomb / burning rock ----------

export const Fire: React.FC<{position: V3; t: number; size?: number; seed?: number}> = ({position, t, size = 1, seed = 0}) => (
  <group position={position} scale={size}>
    {Array.from({length: 5}).map((_, i) => {
      const f = 0.75 + 0.35 * Math.sin(t * (11 + i * 3) + i * 1.7 + seed);
      const x = (rnd(seed * 10 + i) - 0.5) * 0.9;
      const z = (rnd(seed * 10 + i + 5) - 0.5) * 0.9;
      return (
        <Cone
          key={i}
          radius={0.35 * f}
          height={1.3 * f}
          segments={5}
          position={[x, 0.6 * f, z]}
          rotation={[0, t * 2 + i, 0]}
          color={i % 2 ? '#ffb02e' : '#ff5a1f'}
          emissive={i % 2 ? '#ff9a1a' : '#ff3d10'}
          emissiveIntensity={1.6}
          shadow={false}
        />
      );
    })}
  </group>
);

export const Smoke: React.FC<{origin: V3; t: number; seed?: number; n?: number; rise?: number; size?: number; color?: string; opacity?: number}> = ({
  origin,
  t,
  seed = 0,
  n = 8,
  rise = 2.5,
  size = 1,
  color = '#2a2624',
  opacity = 0.8,
}) => (
  <group position={origin}>
    {Array.from({length: n}).map((_, i) => {
      const life = 3;
      const age = (t + (i / n) * life + rnd(seed + i) * 0.4) % life;
      const k = age / life;
      return (
        <Ico
          key={i}
          radius={(0.5 + k * 1.6) * size}
          position={[(rnd(seed + i * 3) - 0.5) * 1.2 * size + k * 1.5 * size, age * rise, (rnd(seed + i * 7) - 0.5) * 1.2 * size]}
          color={color}
          opacity={opacity * (1 - k) * Math.min(1, k * 6)}
          shadow={false}
        />
      );
    })}
  </group>
);
