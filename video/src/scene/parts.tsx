import React from 'react';

type V3 = [number, number, number];

type ShapeProps = {
  position?: V3;
  rotation?: V3;
  scale?: V3 | number;
  color: string;
  shadow?: boolean;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
};

const Mat: React.FC<Pick<ShapeProps, 'color' | 'emissive' | 'emissiveIntensity' | 'opacity'>> = ({
  color,
  emissive,
  emissiveIntensity,
  opacity,
}) => (
  <meshStandardMaterial
    color={color}
    flatShading
    roughness={0.9}
    metalness={0}
    emissive={emissive ?? '#000000'}
    emissiveIntensity={emissiveIntensity ?? 1}
    transparent={opacity !== undefined && opacity < 1}
    opacity={opacity ?? 1}
    depthWrite={opacity === undefined || opacity >= 1}
  />
);

export const Box: React.FC<ShapeProps & {size: V3}> = ({size, shadow = true, ...p}) => (
  <mesh position={p.position} rotation={p.rotation} scale={p.scale} castShadow={shadow} receiveShadow>
    <boxGeometry args={size} />
    <Mat {...p} />
  </mesh>
);

export const Ico: React.FC<ShapeProps & {radius?: number; detail?: number}> = ({
  radius = 1,
  detail = 0,
  shadow = true,
  ...p
}) => (
  <mesh position={p.position} rotation={p.rotation} scale={p.scale} castShadow={shadow} receiveShadow>
    <icosahedronGeometry args={[radius, detail]} />
    <Mat {...p} />
  </mesh>
);

export const Cyl: React.FC<
  ShapeProps & {rTop: number; rBottom: number; height: number; segments?: number}
> = ({rTop, rBottom, height, segments = 8, shadow = true, ...p}) => (
  <mesh position={p.position} rotation={p.rotation} scale={p.scale} castShadow={shadow} receiveShadow>
    <cylinderGeometry args={[rTop, rBottom, height, segments]} />
    <Mat {...p} />
  </mesh>
);

export const Cone: React.FC<ShapeProps & {radius: number; height: number; segments?: number}> = ({
  radius,
  height,
  segments = 8,
  shadow = true,
  ...p
}) => (
  <mesh position={p.position} rotation={p.rotation} scale={p.scale} castShadow={shadow} receiveShadow>
    <coneGeometry args={[radius, height, segments]} />
    <Mat {...p} />
  </mesh>
);

// Faceted tree like on the references: a trunk and a few chunky blobs.
export const Tree: React.FC<{position: V3; size?: number; sway?: number; seed?: number}> = ({
  position,
  size = 1,
  sway = 0,
  seed = 0,
}) => {
  const greens = ['#5c9a4a', '#6aa955', '#4f8a41'];
  return (
    <group position={position} scale={size}>
      <Cyl rTop={0.18} rBottom={0.26} height={2.4} segments={6} position={[0, 1.2, 0]} color="#7a5a3c" />
      <group position={[0, 2.2, 0]} rotation={[sway * 0.6, 0, sway]}>
        <Ico radius={1.5} detail={1} position={[0, 1.4, 0]} rotation={[seed, seed * 2, 0]} color={greens[0]} />
        <Ico radius={1.1} detail={1} position={[0.9, 0.8, 0.4]} rotation={[seed * 3, 0, seed]} color={greens[1]} />
        <Ico radius={1.0} detail={1} position={[-0.8, 0.9, -0.3]} rotation={[0, seed, seed * 2]} color={greens[2]} />
      </group>
    </group>
  );
};

export const Bush: React.FC<{position: V3; size?: number; flowers?: boolean; seed?: number}> = ({
  position,
  size = 1,
  flowers = false,
  seed = 0,
}) => (
  <group position={position} scale={size}>
    <Ico radius={0.7} detail={1} position={[0, 0.45, 0]} scale={[1.2, 0.8, 1]} rotation={[seed, seed, 0]} color="#5f9f4c" />
    {flowers ? (
      <>
        <Ico radius={0.07} position={[0.3, 0.95, 0.35]} color="#f2a6c4" shadow={false} />
        <Ico radius={0.07} position={[-0.35, 0.85, 0.4]} color="#f6e3a1" shadow={false} />
        <Ico radius={0.07} position={[0.05, 1.0, -0.2]} color="#f2a6c4" shadow={false} />
        <Ico radius={0.07} position={[0.6, 0.7, 0.1]} color="#ffffff" shadow={false} />
      </>
    ) : null}
  </group>
);
