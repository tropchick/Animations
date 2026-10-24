import React from 'react';
import {AdditiveBlending, DoubleSide, Texture} from 'three';
import {V3} from './cues';

// Materials of the lab: everything is flat-shaded like the other videos, but cold and metallic.
export type Mat = {
  color: string;
  metal?: number;
  rough?: number;
  emissive?: string;
  glow?: number;
  opacity?: number;
  env?: number;
  map?: Texture;
  glass?: boolean;
  additive?: boolean;
  vertexColors?: boolean;
};

export const STEEL: Mat = {color: '#9aa3ab', metal: 0.75, rough: 0.38, env: 0.9};
export const DARK_STEEL: Mat = {color: '#4c545c', metal: 0.7, rough: 0.45, env: 0.7};
export const PANEL: Mat = {color: '#6e777f', metal: 0.05, rough: 0.8};
export const FLOOR: Mat = {color: '#2c3238', metal: 0.25, rough: 0.55, env: 0.5};
export const GLASS: Mat = {color: '#cfe3f0', metal: 0.1, rough: 0.05, opacity: 0.13, env: 1.6, glass: true};
export const RUBBER: Mat = {color: '#1d2125', metal: 0, rough: 0.9};

export const Material: React.FC<{m: Mat}> = ({m}) => (
  <meshStandardMaterial
    color={m.color}
    flatShading
    metalness={m.metal ?? 0}
    roughness={m.rough ?? 0.85}
    envMapIntensity={m.env ?? 0.35}
    emissive={m.emissive ?? '#000000'}
    emissiveIntensity={m.glow ?? 1}
    map={m.map ?? null}
    vertexColors={m.vertexColors ?? false}
    transparent={m.opacity !== undefined && m.opacity < 1}
    opacity={m.opacity ?? 1}
    depthWrite={!(m.opacity !== undefined && m.opacity < 1)}
    side={m.glass ? DoubleSide : undefined}
    blending={m.additive ? AdditiveBlending : undefined}
  />
);

type P = {position?: V3; rotation?: V3; scale?: V3 | number; m: Mat; shadow?: boolean; children?: React.ReactNode};

export const Box: React.FC<P & {size: V3}> = ({size, position, rotation, scale, m, shadow = true}) => (
  <mesh position={position} rotation={rotation} scale={scale} castShadow={shadow && !m.glass} receiveShadow={!m.glass}>
    <boxGeometry args={size} />
    <Material m={m} />
  </mesh>
);

export const Cyl: React.FC<P & {r: number; r2?: number; h: number; seg?: number; open?: boolean}> = ({
  r,
  r2,
  h,
  seg = 12,
  open = false,
  position,
  rotation,
  scale,
  m,
  shadow = true,
}) => (
  <mesh position={position} rotation={rotation} scale={scale} castShadow={shadow && !m.glass} receiveShadow={!m.glass}>
    <cylinderGeometry args={[r, r2 ?? r, h, seg, 1, open]} />
    <Material m={m} />
  </mesh>
);

export const Ico: React.FC<P & {r: number; detail?: number}> = ({r, detail = 0, position, rotation, scale, m, shadow = true}) => (
  <mesh position={position} rotation={rotation} scale={scale} castShadow={shadow} receiveShadow>
    <icosahedronGeometry args={[r, detail]} />
    <Material m={m} />
  </mesh>
);

// Light source panel: bright, unlit, no shadow.
export const Glow: React.FC<{size: V3; position: V3; rotation?: V3; color: string; power?: number}> = ({
  size,
  position,
  rotation,
  color,
  power = 2,
}) => (
  <mesh position={position} rotation={rotation}>
    <boxGeometry args={size} />
    <meshBasicMaterial color={color} toneMapped={false} transparent={power < 1} opacity={Math.min(1, power)} />
  </mesh>
);
