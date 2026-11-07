import React from 'react';
import * as THREE from 'three';
import {Box, Cyl, Ico, Pic} from './common';
import {C, V3, clamp01, lerp, ramp, smooth} from './cues';
import {Clone, Hero, SIT, Scientist} from './people';
import {drawDna, tex} from './tex';

// A white lab with the cloning capsule at CAPSULE. The vent is high on the back wall (z = -5).
export const LAB: V3 = [0, 0, 2400];
export const CAPSULE: V3 = [0, 0, 0];
export const CHAIR: V3 = [-2.2, 0, 0.6];
export const VENT: V3 = [1.5, 3.1, -4.9];

export const Lab: React.FC<{v: number; shot: string}> = ({v, shot}) => {
  const lift = smooth(ramp(v, C.hiss, C.hiss + 1.2));
  const cloneOut = shot === 'clone' || shot === 'vent';
  const dna = tex('dna', 256, 320, drawDna);
  const arguing = shot === 'vent';
  const fog = clamp01((v - C.hiss) / 1.8);
  const sciPos: [V3, number, number][] = [
    [[-1.4, 0, 2.2], Math.PI * 0.85, 0],
    [[1.6, 0, 2.0], -Math.PI * 0.8, 1],
    [[2.4, 0, -0.6], -Math.PI / 2, 2],
    [[-3.6, 0, -1.2], Math.PI * 0.35, 3],
  ];
  return (
    <group position={LAB}>
      <color attach="background" args={['#e8eef2']} />
      <Box size={[12, 0.1, 11]} position={[0, -0.05, 0]} color="#dfe4e8" />
      <Box size={[12, 0.1, 11]} position={[0, 3.8, 0]} color="#f6f8fa" />
      <Box size={[12, 3.8, 0.2]} position={[0, 1.9, -5.5]} color="#f2f5f7" />
      <Box size={[0.2, 3.8, 11]} position={[-6, 1.9, 0]} color="#eef2f4" />
      <Box size={[0.2, 3.8, 11]} position={[6, 1.9, 0]} color="#eef2f4" />
      <Box size={[12, 3.8, 0.2]} position={[0, 1.9, 5.5]} color="#f2f5f7" />
      {/* ceiling light panels */}
      {[-3, 0, 3].map((x) =>
        [-2.5, 1.5].map((z) => <Box key={`${x}${z}`} size={[1.6, 0.04, 1.0]} position={[x, 3.73, z]} color="#ffffff" emissive="#ffffff" emissiveIntensity={1.4} shadow={false} />),
      )}
      {/* vent grille on the back wall */}
      <group position={[VENT[0], VENT[1], -5.38]}>
        <Box size={[1.0, 0.7, 0.04]} color="#9aa2aa" />
        {[-0.25, -0.1, 0.05, 0.2].map((y) => (
          <Box key={y} size={[0.9, 0.05, 0.06]} position={[0, y, 0.02]} color="#5a6068" />
        ))}
      </group>
      {/* the capsule: base, glass that lifts, top with a blue ring */}
      <group position={CAPSULE}>
        <Cyl rTop={0.9} rBottom={1.0} height={0.3} segments={20} position={[0, 0.15, 0]} color="#c8d0d8" />
        <Cyl rTop={0.92} rBottom={0.92} height={0.06} segments={24} position={[0, 0.33, 0]} color="#3ad1ff" emissive="#20b0ff" emissiveIntensity={1.5} shadow={false} />
        <Cyl rTop={0.9} rBottom={0.9} height={1.15} segments={20} position={[0, 3.175, 0]} color="#c8d0d8" />
        <mesh position={[0, 1.5 + lift * 2.0, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 2.1, 24, 1, true]} />
          <meshStandardMaterial color="#b8e8ff" transparent opacity={0.22} roughness={0.05} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        {cloneOut ? (
          <Clone position={[0, 0.36, 0]} rotation={0} pose={{armR: shot === 'clone' ? [2.7, -0.2 - 0.3 * Math.abs(Math.sin(v * 5))] : [0.2, -0.1], head: [0, 0.15 * Math.sin(v * 2)], eyes: 1.2}} />
        ) : (
          <mesh position={[0, 1.3, 0]}>
            <capsuleGeometry args={[0.35, 1.0, 4, 10]} />
            <meshStandardMaterial color="#8ad8ff" emissive="#3ab8ff" emissiveIntensity={0.5 + 0.3 * Math.sin(v * 6)} transparent opacity={0.6} />
          </mesh>
        )}
        {/* steam when it opens */}
        {fog > 0 && fog < 1
          ? [0, 1, 2, 3, 4, 5].map((i) => (
              <Ico key={i} radius={0.4 + fog * 0.8} position={[Math.cos(i) * (0.6 + fog * 1.2), 0.5 + fog * 0.6 + (i % 2) * 0.3, Math.sin(i) * (0.6 + fog * 1.2)]} color="#ffffff" opacity={0.5 * (1 - fog)} shadow={false} />
            ))
          : null}
        {/* cable to the chair */}
        <Box size={[2.0, 0.05, 0.05]} position={[-1.1, 0.03, 0.3]} rotation={[0, -0.12, 0]} color="#2a2c30" shadow={false} />
      </group>
      {/* desks with DNA monitors */}
      {[
        [-4.6, -3.6, 0.6],
        [4.4, -3.4, -0.6],
      ].map(([x, z, r], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
          <Box size={[2.0, 0.08, 0.9]} position={[0, 0.76, 0]} color="#e8ecef" />
          <Box size={[0.08, 0.76, 0.8]} position={[-0.9, 0.38, 0]} color="#b8c0c8" />
          <Box size={[0.08, 0.76, 0.8]} position={[0.9, 0.38, 0]} color="#b8c0c8" />
          <Box size={[0.8, 1.0, 0.06]} position={[0, 1.35, -0.2]} color="#1a1c20" />
          <Pic size={[0.72, 0.9]} map={dna} position={[0, 1.35, -0.165]} />
        </group>
      ))}
      {/* the hero on a chair with the electrode cap (he is gone by the vent shot) */}
      {shot !== 'vent' ? (
        <group position={CHAIR}>
          <Box size={[0.6, 0.08, 0.6]} position={[0, 0.5, 0]} color="#3a4a5a" />
          <Box size={[0.6, 0.7, 0.08]} position={[0, 0.85, -0.28]} color="#3a4a5a" />
          <Cyl rTop={0.04} rBottom={0.04} height={0.5} position={[0, 0.25, 0]} color="#8a9098" />
          <Hero
            position={[0, -0.26, 0.02]}
            rotation={0.5}
            pose={{...SIT, armL: [0.6, 0.1], armR: [0.6, -0.1], elbowL: 1.0, elbowR: 1.0, eyes: shot === 'clone' ? 1.4 : 1, head: [0, shot === 'clone' ? -0.5 : 0]}}
            extra={
              <>
                <Box size={[0.34, 0.06, 0.34]} position={[0, 0.4, 0]} color="#c8d0d8" />
                <Box size={[0.04, 0.04, 0.04]} position={[0.1, 0.45, 0.1]} color="#3ad1ff" emissive="#20b0ff" emissiveIntensity={1.2} shadow={false} />
              </>
            }
          />
        </group>
      ) : (
        <group position={CHAIR}>
          <Box size={[0.6, 0.08, 0.6]} position={[0, 0.5, 0]} color="#3a4a5a" />
          <Box size={[0.6, 0.7, 0.08]} position={[0, 0.85, -0.28]} color="#3a4a5a" />
          <Cyl rTop={0.04} rBottom={0.04} height={0.5} position={[0, 0.25, 0]} color="#8a9098" />
        </group>
      )}
      {sciPos.map(([p, r, i]) => {
        const point = arguing ? (i % 2 ? 2.2 + 0.4 * Math.sin(v * 6 + i) : 1.4 + 0.5 * Math.sin(v * 5 + i)) : 0.8;
        return (
          <Scientist
            key={i}
            i={i}
            position={p}
            rotation={r}
            pose={{armR: [point, -0.15], elbowR: arguing ? 0.2 : 1.0, armL: [0.9, 0.2], elbowL: 1.3, mouth: arguing ? Math.abs(Math.sin(v * 9 + i)) * 0.7 : 0, head: [0, arguing ? 0.4 * Math.sin(v * 2 + i) : 0]}}
            leftHand={<Box size={[0.2, 0.28, 0.02]} position={[0, -0.05, 0.08]} rotation={[0.4, 0, 0]} color="#c8a46a" />}
          />
        );
      })}
      <hemisphereLight color="#ffffff" groundColor="#c0c8d0" intensity={1.2} />
      <pointLight position={[0, 3.4, 0.5]} intensity={18} distance={14} color="#f4f8ff" />
      <pointLight position={[0, 1.6, 0]} intensity={4 + 3 * lerp(0, 1, lift)} distance={4} color="#6ad0ff" />
    </group>
  );
};
