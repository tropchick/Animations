import React from 'react';
import {Box, Cyl, Pic} from './common';
import {C, V3, hop, lerp, ramp, smooth} from './cues';
import {Cashier, Woman} from './people';
import {drawShelf, tex} from './tex';

// A small grocery store: the till at the origin, the customer (camera) on +z, shelves behind the cashier.
export const SHOP: V3 = [0, 0, 800];
export const SHOP_EYE: V3 = [SHOP[0] + 0.15, 1.85, SHOP[2] + 1.35];

const Shelf: React.FC<{position: V3; rotation?: number; seed: number}> = ({position, rotation = 0, seed}) => {
  const map = tex(`shelf-${seed}`, 512, 256, drawShelf(seed));
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box size={[3.0, 2.0, 0.5]} position={[0, 1.0, 0]} color="#e0dcd2" />
      <Pic size={[2.9, 1.8]} map={map} position={[0, 1.0, 0.26]} lit />
      <Pic size={[2.9, 1.8]} map={map} position={[0, 1.0, -0.26]} rotation={[0, Math.PI, 0]} lit />
    </group>
  );
};

const lookYaw = (from: V3, to: V3) => Math.atan2(to[0] - from[0], to[2] - from[2]);

export const Shop: React.FC<{v: number}> = ({v}) => {
  const turn = smooth(ramp(v, C.turn[0], C.turn[1] + 0.25));
  const talking = v >= C.cashier && v < C.cashier + 0.8 ? Math.abs(Math.sin((v - C.cashier) * 18)) : 0;
  const scanHand = hop(v, C.scan - 0.35, 0.7);
  const eye: V3 = [SHOP_EYE[0] - SHOP[0], 1.85, SHOP_EYE[2] - SHOP[2]];
  // customers: position, own facing, index
  const people: [V3, number, number][] = [
    [[-2.6, 0, -2.2], 1.2, 0],
    [[2.8, 0, -1.8], -1.4, 1],
    [[-3.2, 0, 2.8], Math.PI * 0.6, 2],
    [[3.4, 0, 3.4], -Math.PI * 0.7, 3],
    [[1.2, 0, 3.6], Math.PI, 4],
    [[-1.4, 0, -4.2], 0.3, 5],
  ];
  return (
    <group position={SHOP}>
      <color attach="background" args={['#202024']} />
      <Box size={[16, 0.1, 16]} position={[0, -0.05, 0]} color="#d8d4ca" />
      <Box size={[16, 0.1, 16]} position={[0, 3.3, 0]} color="#f2f2ee" />
      <Box size={[16, 3.3, 0.2]} position={[0, 1.65, -6]} color="#e8e2d2" />
      <Box size={[0.2, 3.3, 16]} position={[-6, 1.65, 0]} color="#e8e2d2" />
      <Box size={[0.2, 3.3, 16]} position={[6, 1.65, 0]} color="#e8e2d2" />
      <Box size={[16, 3.3, 0.2]} position={[0, 1.65, 6]} color="#e8e2d2" />
      {[-3.5, 0, 3.5].map((x, i) => (
        <Shelf key={i} position={[x, 0, -3.2]} seed={i + 1} />
      ))}
      <Shelf position={[-4.2, 0, 1.5]} rotation={Math.PI / 2} seed={4} />
      <Shelf position={[4.4, 0, 1.0]} rotation={-Math.PI / 2} seed={5} />
      {/* the till: counter with a belt, scanner, a register */}
      <Box size={[2.6, 0.9, 0.7]} position={[0, 0.45, 0]} color="#9a9ea8" />
      <Box size={[1.8, 0.02, 0.5]} position={[-0.3, 0.91, 0]} color="#1a1a1e" shadow={false} />
      <Box size={[0.35, 0.04, 0.3]} position={[0.85, 0.92, 0]} color="#3a3d44" />
      <Box size={[0.3, 0.012, 0.22]} position={[0.85, 0.946, 0]} color="#ff3a3a" emissive="#ff2020" emissiveIntensity={hop(v, C.scan, 0.25) * 3} shadow={false} />
      <Box size={[0.4, 0.3, 0.3]} position={[1.0, 1.05, -0.2]} color="#2a2c30" />
      <Box size={[0.3, 0.2, 0.02]} position={[1.0, 1.32, -0.06]} rotation={[-0.3, 0, 0]} color="#3ac8ff" emissive="#20a0e0" emissiveIntensity={0.8} shadow={false} />
      {/* the shopping: milk, bread, a pack of dumplings */}
      <Box size={[0.1, 0.22, 0.08]} position={[0.3 + scanHand * 0.3, 1.03, 0.08]} color="#f4f4f4" />
      <Box size={[0.26, 0.12, 0.12]} position={[-0.2, 0.98, 0.1]} color="#c8904a" />
      <Box size={[0.22, 0.06, 0.16]} position={[-0.6, 0.95, 0.05]} color="#3a6ac8" />
      {/* bag dispenser with bags (the question is about them) */}
      <Box size={[0.25, 0.2, 0.12]} position={[-1.0, 1.0, 0.25]} color="#f4f4f4" />
      <Cashier
        position={[0.2, 0, -0.95]}
        rotation={lerp(0, lookYaw([0.2, 0, -0.95], eye), turn) * 0.3}
        pose={{
          mouth: talking,
          armR: [0.9 + scanHand * 0.4, -0.2],
          elbowR: 0.6,
          head: [0.05 * (1 - turn), lerp(0, lookYaw([0.2, 0, -0.95], eye) * 0.7, turn)],
          eyes: 1 + 0.4 * turn,
        }}
      />
      {people.map(([p, yaw, i]) => {
        const want = lookYaw(p, eye);
        const rot = lerp(yaw, want, turn * 0.75);
        let headYaw = (want - rot) % (Math.PI * 2);
        if (headYaw > Math.PI) headYaw -= Math.PI * 2;
        if (headYaw < -Math.PI) headYaw += Math.PI * 2;
        return (
          <Woman
            key={i}
            i={i + 30}
            position={p}
            rotation={rot}
            pose={{head: [0, Math.max(-1.1, Math.min(1.1, headYaw)) * turn], eyes: 1 + 0.4 * turn, armR: [0.4, -0.1], elbowR: 0.8}}
            rightHand={i % 2 ? <Cyl rTop={0.12} rBottom={0.1} height={0.2} position={[0, -0.15, 0.05]} color="#e85d5d" /> : undefined}
          />
        );
      })}
      {Array.from({length: 4}).map((_, i) => (
        <Box key={i} size={[3, 0.06, 0.4]} position={[-4.5 + i * 3, 3.22, 0.5]} color="#ffffff" emissive="#ffffff" emissiveIntensity={1.4} shadow={false} />
      ))}
      <hemisphereLight color="#ffffff" groundColor="#8a8678" intensity={1.0} />
      <pointLight position={[0, 3.0, 0.5]} intensity={14} distance={14} color="#f6f8ff" />
      <pointLight position={[-3, 3.0, 2.5]} intensity={8} distance={10} color="#f6f8ff" />
    </group>
  );
};
