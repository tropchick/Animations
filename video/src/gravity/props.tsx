import React from 'react';
import * as THREE from 'three';
import {random} from 'remotion';
import {Box, Cone, Cyl, Ico} from '../scene/parts';
import {ramp, V3} from './time';

const G = 9.8;

// ---------- Car ----------

// Low-poly hatchback, 4.2 m long along x, origin at the bottom center.
export const Car: React.FC<{color: string; crush?: number; blink?: boolean}> = ({color, crush = 0, blink = false}) => {
  const glass = '#2b3947';
  const amber = blink ? '#ffb347' : '#8a6a3a';
  return (
    <group scale={[1 + 0.06 * crush, 1 - 0.38 * crush, 1 + 0.08 * crush]}>
      <Box size={[4.2, 0.72, 1.8]} position={[0, 0.66, 0]} color={color} />
      <group position={[-0.25, 1.02, 0]} scale={[1, 1 - 0.55 * crush, 1]} rotation={[0, 0, 0.12 * crush]}>
        <Box size={[2.3, 0.62, 1.62]} position={[0, 0.31, 0]} color={color} />
        <Box size={[2.02, 0.42, 1.64]} position={[0, 0.33, 0]} color={glass} shadow={false} />
        <Box size={[0.06, 0.44, 1.46]} position={[1.16, 0.32, 0]} color={glass} shadow={false} />
        <Box size={[0.06, 0.44, 1.46]} position={[-1.16, 0.32, 0]} color={glass} shadow={false} />
      </group>
      {[-1.35, 1.35].map((x) =>
        [-0.82, 0.82].map((z) => (
          <Cyl key={`${x}${z}`} rTop={0.36} rBottom={0.36} height={0.3} segments={10} position={[x, 0.36, z]} rotation={[Math.PI / 2, 0, 0]} color="#22242a" />
        )),
      )}
      <Box size={[0.05, 0.16, 0.34]} position={[2.11, 0.78, 0.58]} color="#fff6d6" emissive={blink ? '#fff2c0' : undefined} emissiveIntensity={0.9} shadow={false} />
      <Box size={[0.05, 0.16, 0.34]} position={[2.11, 0.78, -0.58]} color="#fff6d6" emissive={blink ? '#fff2c0' : undefined} emissiveIntensity={0.9} shadow={false} />
      <Box size={[0.05, 0.16, 0.3]} position={[-2.11, 0.8, 0.6]} color={amber} emissive={blink ? '#ff9a2a' : undefined} emissiveIntensity={1.2} shadow={false} />
      <Box size={[0.05, 0.16, 0.3]} position={[-2.11, 0.8, -0.6]} color={amber} emissive={blink ? '#ff9a2a' : undefined} emissiveIntensity={1.2} shadow={false} />
    </group>
  );
};

// ---------- Clouds ----------

export const Cloud: React.FC<{position: V3; size: number; seed: number}> = ({position, size, seed}) => (
  <group position={position} scale={size}>
    {[0, 1, 2, 3, 4].map((i) => (
      <Ico
        key={i}
        radius={1}
        detail={1}
        position={[(random(`cl-x-${seed}-${i}`) - 0.5) * 3.2, random(`cl-y-${seed}-${i}`) * 0.5, (random(`cl-z-${seed}-${i}`) - 0.5) * 1.8]}
        scale={[1.1 + random(`cl-s-${seed}-${i}`) * 0.6, 0.55, 1]}
        rotation={[seed + i, seed * 2 + i, 0]}
        color="#ffffff"
        shadow={false}
      />
    ))}
  </group>
);

// ---------- Impact effects (all driven by world time w) ----------

export const DustPuff: React.FC<{w: number; w0: number; position: V3; size: number; seed: string; color?: string; life?: number}> = ({
  w,
  w0,
  position,
  size,
  seed,
  color = '#cdbfa9',
  life = 5,
}) => {
  const d = w - w0;
  if (d < 0 || d > life) return null;
  const grow = 1 - Math.exp(-d * 2.2);
  const fadeOut = 1 - ramp(d, life * 0.25, life, (t) => t);
  const items = [];
  for (let i = 0; i < 12; i++) {
    const a = random(`${seed}-a-${i}`) * Math.PI * 2;
    const spread = size * (0.5 + random(`${seed}-r-${i}`)) * grow * 1.6;
    const r = size * (0.35 + 0.45 * random(`${seed}-s-${i}`)) * (0.4 + grow);
    items.push(
      <Ico
        key={i}
        radius={r}
        detail={0}
        position={[Math.cos(a) * spread, r * 0.6 + d * 0.35 * random(`${seed}-u-${i}`) * size, Math.sin(a) * spread]}
        rotation={[i, a, d * 0.3]}
        color={color}
        shadow={false}
        opacity={0.7 * fadeOut}
      />,
    );
  }
  return <group position={position}>{items}</group>;
};

// Chunks thrown out by an impact; they fly ballistically and rest on floorY.
export const Burst: React.FC<{
  w: number;
  w0: number;
  position: V3;
  seed: string;
  colors: string[];
  count?: number;
  speed?: number;
  size?: number;
  floorY?: number;
  up?: number;
}> = ({w, w0, position, seed, colors, count = 14, speed = 7, size = 0.35, floorY = 0, up = 1}) => {
  const d = w - w0;
  if (d < 0) return null;
  const items = [];
  for (let i = 0; i < count; i++) {
    const a = random(`${seed}-ba-${i}`) * Math.PI * 2;
    const sp = speed * (0.4 + random(`${seed}-bs-${i}`) * 0.8);
    const vy = speed * up * (0.5 + random(`${seed}-bu-${i}`) * 0.9);
    const h0 = position[1] - floorY;
    const tLand = (vy + Math.sqrt(vy * vy + 2 * G * Math.max(0.01, h0))) / G;
    const t = Math.min(d, tLand);
    const s = size * (0.5 + random(`${seed}-bz-${i}`));
    const x = position[0] + Math.cos(a) * sp * t;
    const z = position[2] + Math.sin(a) * sp * t;
    const y = Math.max(floorY + s * 0.3, position[1] + vy * t - 0.5 * G * t * t);
    const spin = t * (5 + random(`${seed}-bp-${i}`) * 8);
    items.push(
      <Box key={i} size={[s, s * 0.6, s * 0.8]} position={[x, y, z]} rotation={[spin + i, spin * 0.6, i]} color={colors[i % colors.length]} />,
    );
  }
  return <>{items}</>;
};

// Water bomb landing: a crown, flying drops and a sheet of water that runs over the lawn.
export const Splash: React.FC<{w: number; w0: number; position: V3; seed: string; size?: number}> = ({w, w0, position, seed, size = 1}) => {
  const d = w - w0;
  if (d < 0) return null;
  const water = '#6cc6dc';
  const sheetR = size * 15 * (1 - Math.exp(-d * 1.1));
  const sheetOp = 0.75 * (1 - ramp(d, 1.2, 5, (t) => t));
  const crown = [];
  const crownH = size * 2.6 * Math.sin(Math.PI * Math.min(1, d / 1.0));
  if (d < 1.0) {
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const r = size * (1.6 + d * 4);
      crown.push(
        <Cone
          key={i}
          radius={size * 0.35}
          height={Math.max(0.01, crownH * (0.7 + 0.5 * random(`${seed}-ch-${i}`)))}
          segments={4}
          position={[Math.cos(a) * r, crownH * 0.45, Math.sin(a) * r]}
          rotation={[Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]}
          color={water}
          shadow={false}
          opacity={0.85}
        />,
      );
    }
  }
  const drops = [];
  for (let i = 0; i < 70; i++) {
    const a = random(`${seed}-da-${i}`) * Math.PI * 2;
    const sp = size * (3 + random(`${seed}-ds-${i}`) * 7);
    const vy = 6 + random(`${seed}-dv-${i}`) * 9;
    const t = d;
    const y = vy * t - 0.5 * G * t * t;
    if (y < -0.1) continue;
    const r = 0.12 + random(`${seed}-dr-${i}`) * 0.22;
    drops.push(
      <Ico key={i} radius={r} position={[Math.cos(a) * sp * t, y, Math.sin(a) * sp * t]} color={water} shadow={false} opacity={0.9} />,
    );
  }
  return (
    <group position={position}>
      {sheetOp > 0.01 ? (
        <Cyl rTop={sheetR} rBottom={sheetR} height={0.08 + 0.4 * Math.exp(-d * 2)} segments={20} position={[0, 0.05, 0]} color={water} shadow={false} opacity={sheetOp} />
      ) : null}
      {/* the lawn stays wet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[Math.max(0.01, sheetR * 0.85), 20]} />
        <meshStandardMaterial color="#8f877b" transparent opacity={0.5} roughness={0.3} depthWrite={false} />
      </mesh>
      {crown}
      {drops}
    </group>
  );
};

// A thin straight line between two points (leash).
export const Rope: React.FC<{from: V3; to: V3; color?: string}> = ({from, to, color = '#c23b3b'}) => {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const len = a.distanceTo(b);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return (
    <mesh position={mid.toArray()} quaternion={q.toArray() as [number, number, number, number]} castShadow>
      <cylinderGeometry args={[0.018, 0.018, Math.max(0.01, len), 5]} />
      <meshStandardMaterial color={color} flatShading roughness={0.9} />
    </mesh>
  );
};
