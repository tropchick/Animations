import React, {useMemo} from 'react';
import * as THREE from 'three';
import {random} from 'remotion';
import {Ico} from '../scene/parts';
import {V3} from './time';

// Gable roof: a triangular prism with the ridge along x, base d deep (z), h high, origin at the base center.
export const Prism: React.FC<{w: number; d: number; h: number; color: string; position?: V3; rotation?: V3}> = ({w, d, h, color, position, rotation}) => {
  const geo = useMemo(() => {
    const A = [-w / 2, 0, -d / 2];
    const B = [w / 2, 0, -d / 2];
    const C = [w / 2, 0, d / 2];
    const D = [-w / 2, 0, d / 2];
    const E = [-w / 2, h, 0];
    const F = [w / 2, h, 0];
    const tris = [D, C, F, D, F, E, B, A, E, B, E, F, C, B, F, A, D, E, A, B, C, A, C, D];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tris.flat()), 3));
    g.computeVertexNormals();
    return g;
  }, [w, d, h]);
  return (
    <mesh geometry={geo} position={position} rotation={rotation} castShadow receiveShadow>
      <meshStandardMaterial color={color} flatShading roughness={0.9} />
    </mesh>
  );
};

// A thin flat triangle (sails), in the xy plane, 0.04 thick.
export const Sail: React.FC<{w: number; h: number; color: string; position?: V3; rotation?: V3}> = ({w, h, color, position, rotation}) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(w, 0);
    s.lineTo(0, h);
    s.lineTo(0, 0);
    const g = new THREE.ExtrudeGeometry(s, {depth: 0.04, bevelEnabled: false});
    g.translate(0, 0, -0.02);
    return g;
  }, [w, h]);
  return (
    <mesh geometry={geo} position={position} rotation={rotation} castShadow>
      <meshStandardMaterial color={color} flatShading roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
};

// A box stretched between two points (rails, cables, struts).
const UP = new THREE.Vector3(0, 1, 0);
export const Beam: React.FC<{from: V3; to: V3; r: number; color: string; shadow?: boolean; emissive?: string; opacity?: number}> = ({
  from,
  to,
  r,
  color,
  shadow = true,
  emissive,
  opacity,
}) => {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const len = a.distanceTo(b);
  if (len < 1e-4) return null;
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize());
  return (
    <mesh position={mid.toArray()} quaternion={q.toArray() as [number, number, number, number]} castShadow={shadow} receiveShadow>
      <boxGeometry args={[r * 2, len, r * 2]} />
      <meshStandardMaterial
        color={color}
        flatShading
        roughness={0.85}
        emissive={emissive ?? '#000000'}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
        depthWrite={opacity === undefined}
      />
    </mesh>
  );
};

// Scale a group in y around the plane y = base (used to flatten whole structures).
export const SquashY: React.FC<{base: number; s: number; children: React.ReactNode}> = ({base, s, children}) => (
  <group position={[0, base, 0]} scale={[1, Math.max(0.001, s), 1]}>
    <group position={[0, -base, 0]}>{children}</group>
  </group>
);

// Solid low-poly dust or spray: no transparency (overlapping see-through facets look messy).
// The puffs swell, drift outwards, then shrink away.
export const Puff: React.FC<{v: number; t0: number; position: V3; size: number; seed: string; color?: string; life?: number}> = ({
  v,
  t0,
  position,
  size,
  seed,
  color = '#d9cbb3',
  life = 2.6,
}) => {
  const d = v - t0;
  if (d < 0 || d > life) return null;
  const grow = 1 - Math.exp(-d * 4);
  const shrink = Math.max(0, (d - life * 0.35) / (life * 0.65));
  const items: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const a = random(`${seed}-a-${i}`) * Math.PI * 2;
    const spread = size * (0.3 + 0.7 * random(`${seed}-r-${i}`)) * (0.4 + grow);
    const r = size * (0.25 + 0.3 * random(`${seed}-s-${i}`)) * grow * (1 - shrink * shrink);
    if (r < 0.01) continue;
    items.push(
      <Ico
        key={i}
        radius={r}
        detail={0}
        position={[Math.cos(a) * spread, r * 0.5 + d * size * 0.15 * random(`${seed}-u-${i}`), Math.sin(a) * spread * 0.7]}
        rotation={[i, a, d * 0.4]}
        color={color}
        shadow={false}
      />,
    );
  }
  return <group position={position}>{items}</group>;
};
