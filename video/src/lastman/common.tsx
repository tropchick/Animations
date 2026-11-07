import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box, Cyl, Ico} from '../scene/parts';
import {Sky, SkyCols} from '../gta/World';
import {V3, rnd} from './cues';
import {drawWindows, tex} from './tex';

export {Box, Cyl, Ico, Sky};
export type {SkyCols};

export const DAY: SkyCols = {top: '#3f86d6', mid: '#93c3ec', low: '#f2e7cf', sunDir: [0.5, 0.35, -1], sun: 0.8, sunCol: '#fff2c8'};
export const NIGHT: SkyCols = {top: '#03050d', mid: '#0d1630', low: '#24345e'};

// a textured plane: lit = takes scene light, otherwise glows (screens, signs)
export const Pic: React.FC<{size: [number, number]; map: THREE.Texture; position?: V3; rotation?: V3; glow?: number; lit?: boolean; transparent?: boolean; side?: THREE.Side}> = ({
  size,
  map,
  position,
  rotation,
  glow = 1,
  lit = false,
  transparent,
  side,
}) => (
  <mesh position={position} rotation={rotation}>
    <planeGeometry args={size} />
    {lit ? (
      <meshStandardMaterial map={map} roughness={0.85} transparent={transparent} side={side} />
    ) : (
      <meshBasicMaterial map={map} toneMapped={false} transparent={transparent} color={new THREE.Color(glow, glow, glow)} side={side} />
    )}
  </mesh>
);

// sun with its own target, shadow box +-size around the target
export const SunLight: React.FC<{dir: V3; target: V3; intensity?: number; color?: string; size?: number; shadow?: boolean}> = ({
  dir,
  target,
  intensity = 2.2,
  color = '#fff0d8',
  size = 30,
  shadow = true,
}) => {
  const obj = useMemo(() => new THREE.Object3D(), []);
  obj.position.set(...target);
  obj.updateMatrixWorld();
  return (
    <>
      <primitive object={obj} />
      <directionalLight
        position={[target[0] + dir[0] * 60, target[1] + dir[1] * 60, target[2] + dir[2] * 60]}
        target={obj}
        intensity={intensity}
        color={color}
        castShadow={shadow}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-size}
        shadow-camera-right={size}
        shadow-camera-top={size}
        shadow-camera-bottom={-size}
        shadow-camera-near={1}
        shadow-camera-far={160}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
    </>
  );
};

export const DayLights: React.FC<{k?: number}> = ({k = 1}) => (
  <>
    <hemisphereLight color="#dff0ff" groundColor="#8a7c6a" intensity={1.2 * k} />
    <directionalLight position={[-80, 40, -40]} color="#9ab8e0" intensity={0.45 * k} />
  </>
);

// a panel block: a box with a window grid on its front (+z) face; night = lit windows glow
export const Block: React.FC<{position: V3; size: V3; rotation?: number; color?: string; seed?: number; night?: boolean; lit?: number; floors?: number}> = ({
  position,
  size,
  rotation = 0,
  color = '#d8d2c4',
  seed = 1,
  night = false,
  lit = 0.35,
  floors,
}) => {
  const rows = floors ?? Math.max(1, Math.round(size[1] / 2.8));
  const cols = Math.max(1, Math.round(size[0] / 3));
  const map = tex(`win-${cols}-${rows}-${seed}-${night}-${lit}`, cols * 32, rows * 32, (g, W, H) => {
    if (!night) {
      g.fillStyle = color;
      g.fillRect(0, 0, W, H);
      const cw = W / cols;
      const rh = H / rows;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          g.fillStyle = rnd(r * 31 + c, seed) < 0.15 ? '#5a6a7a' : '#7d93a8';
          g.fillRect(c * cw + cw * 0.22, r * rh + rh * 0.22, cw * 0.56, rh * 0.52);
          g.fillStyle = 'rgba(255,255,255,0.35)';
          g.fillRect(c * cw + cw * 0.22, r * rh + rh * 0.22, cw * 0.56, rh * 0.08);
          g.fillStyle = 'rgba(0,0,0,0.08)';
          g.fillRect(0, r * rh, W, 2);
        }
    } else {
      g.fillStyle = '#141a28';
      g.fillRect(0, 0, W, H);
      drawWindows(cols, rows, seed, lit)(g, W, H);
    }
  });
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box size={size} position={[0, size[1] / 2, 0]} color={night ? '#1a2030' : color} />
      <mesh position={[0, size[1] / 2, size[2] / 2 + 0.03]}>
        <planeGeometry args={[size[0] - 0.1, size[1] - 0.1]} />
        {night ? <meshBasicMaterial map={map} toneMapped={false} /> : <meshStandardMaterial map={map} roughness={0.9} />}
      </mesh>
    </group>
  );
};

export const Tree: React.FC<{position: V3; s?: number; seed?: number; birch?: boolean; dark?: boolean}> = ({position, s = 1, seed = 0, birch = false, dark = false}) => (
  <group position={position} scale={s}>
    <Cyl rTop={0.12} rBottom={0.18} height={2.4} position={[0, 1.2, 0]} color={birch ? '#e8e4dc' : '#6b4a32'} />
    <Ico radius={1.5} position={[0, 3.2, 0]} rotation={[seed, seed * 2, 0]} color={dark ? '#1e3a28' : birch ? '#8abf5a' : '#4f8f45'} />
    <Ico radius={1.1} position={[0.6, 4.1, 0.3]} rotation={[seed * 3, 0, seed]} color={dark ? '#24452e' : birch ? '#9acd66' : '#5ea050'} />
  </group>
);

export const Car: React.FC<{position: V3; rotation?: number; color: string}> = ({position, rotation = 0, color}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[1.8, 0.7, 4.2]} position={[0, 0.6, 0]} color={color} />
    <Box size={[1.6, 0.6, 2.2]} position={[0, 1.25, -0.2]} color={color} />
    <Box size={[1.62, 0.45, 2.0]} position={[0, 1.27, -0.2]} color="#2a3442" />
    {[
      [0.85, 1.3],
      [-0.85, 1.3],
      [0.85, -1.3],
      [-0.85, -1.3],
    ].map(([x, z], i) => (
      <Cyl key={i} rTop={0.34} rBottom={0.34} height={0.24} segments={10} position={[x * 1.02, 0.34, z]} rotation={[0, 0, Math.PI / 2]} color="#1b1b1e" />
    ))}
  </group>
);

// TV van with a dish and big letters
export const Van: React.FC<{position: V3; rotation?: number; color?: string; label?: string}> = ({position, rotation = 0, color = '#f4f4f4', label = 'ТВ'}) => {
  const map = tex(`van-${label}`, 256, 128, (g, W, H) => {
    g.fillStyle = color;
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#d6302a';
    g.font = "900 96px 'Inter', sans-serif";
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(label, W / 2, H / 2 + 4);
  });
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box size={[2.0, 2.0, 5.0]} position={[0, 1.3, 0]} color={color} />
      <Box size={[1.96, 0.7, 1.0]} position={[0, 1.7, 2.1]} color="#2a3442" />
      <Pic size={[2.4, 1.2]} map={map} position={[1.02, 1.5, -0.6]} rotation={[0, Math.PI / 2, 0]} lit />
      <Pic size={[2.4, 1.2]} map={map} position={[-1.02, 1.5, -0.6]} rotation={[0, -Math.PI / 2, 0]} lit />
      <Cyl rTop={0.05} rBottom={0.05} height={0.6} position={[0, 2.6, -1]} color="#888" />
      <Cyl rTop={0.6} rBottom={0.1} height={0.3} position={[0, 3.0, -1]} rotation={[0.7, 0, 0]} color="#e8e8e8" />
      {[
        [0.95, 1.5],
        [-0.95, 1.5],
        [0.95, -1.6],
        [-0.95, -1.6],
      ].map(([x, z], i) => (
        <Cyl key={i} rTop={0.36} rBottom={0.36} height={0.26} segments={10} position={[x * 1.03, 0.36, z]} rotation={[0, 0, Math.PI / 2]} color="#1b1b1e" />
      ))}
    </group>
  );
};

export const Helicopter: React.FC<{position: V3; rotation?: number; t: number; color?: string; spot?: boolean}> = ({position, rotation = 0, t, color = '#2a5aa8', spot = false}) => (
  <group position={position} rotation={[0.08, rotation, 0.03 * Math.sin(t * 0.7)]}>
    <Box size={[1.6, 1.5, 3.4]} position={[0, 0, 0]} color={color} />
    <Box size={[1.4, 0.9, 1.0]} position={[0, 0.15, 1.8]} color="#1a2230" />
    <Box size={[0.35, 0.35, 4.0]} position={[0, 0.3, -3.4]} color={color} />
    <Box size={[0.1, 1.0, 0.6]} position={[0, 0.8, -5.2]} color={color} />
    <Box size={[0.12, 0.12, 0.5]} position={[0, 0.95, 0]} color="#333" />
    {[0, 1].map((k) => (
      <Box key={k} size={[9, 0.05, 0.3]} position={[0, 1.25, 0]} rotation={[0, t * 25 + k * Math.PI / 2, 0]} color="#222" shadow={false} />
    ))}
    <Box size={[0.08, 0.6, 0.12]} position={[0.2, 0.8, -5.5]} rotation={[t * 40, 0, 0]} color="#222" shadow={false} />
    <Box size={[0.1, 0.1, 3.0]} position={[0.7, -0.95, 0]} color="#333" />
    <Box size={[0.1, 0.1, 3.0]} position={[-0.7, -0.95, 0]} color="#333" />
    <Box size={[0.12, 0.12, 0.12]} position={[0, -0.8, 1.6]} color="#fff" emissive="#ffffff" emissiveIntensity={spot ? 3 : 0.5} shadow={false} />
  </group>
);

export const Ground: React.FC<{color: string; size?: number; y?: number}> = ({color, size = 600, y = 0}) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
    <planeGeometry args={[size, size]} />
    <meshStandardMaterial color={color} roughness={1} />
  </mesh>
);
