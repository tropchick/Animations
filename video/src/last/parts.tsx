import React, {useMemo} from 'react';
import {CanvasTexture, Object3D, SRGBColorSpace} from 'three';
import {Box, Mat} from '../slime/parts';
import {V3} from './cues';

export {Box, Cyl, Glow, Ico, Material} from '../slime/parts';
export type {Mat} from '../slime/parts';

// A small canvas texture drawn once: door numbers, signs, the lift buttons.
export const useLabel = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, key: string) =>
  useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    draw(cv.getContext('2d')!);
    const tx = new CanvasTexture(cv);
    tx.colorSpace = SRGBColorSpace;
    tx.anisotropy = 8;
    return tx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, key]);

// a flat sign: lit (unaffected by light) or painted (takes the scene light)
export const Sign: React.FC<{size: [number, number]; position: V3; rotation?: V3; draw: (c: CanvasRenderingContext2D) => void; id: string; px?: number; lit?: number}> = ({
  size,
  position,
  rotation,
  draw,
  id,
  px = 256,
  lit,
}) => {
  const tex = useLabel(Math.round(px * (size[0] / size[1])), px, draw, id);
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      {lit !== undefined ? (
        <meshBasicMaterial map={tex} toneMapped={false} color={[lit, lit, lit]} transparent />
      ) : (
        <meshStandardMaterial map={tex} roughness={0.85} flatShading transparent />
      )}
    </mesh>
  );
};

// a wall painted the Soviet way: green oil paint up to 1.5 m, whitewash above, a dark line between
export const PAINT_LOW: Mat = {color: '#5e7b63', rough: 0.55, env: 0.4};
export const PAINT_HIGH: Mat = {color: '#d8d3c6', rough: 0.95};
const LINE: Mat = {color: '#2f3d33', rough: 0.6};
export const PaintedWall: React.FC<{x0: number; x1: number; z: number; t?: number; y0?: number; y1?: number; split?: number; rot?: number; pos?: V3}> = ({
  x0,
  x1,
  z,
  t = 0.2,
  y0 = 0,
  y1 = 2.7,
  split = 1.5,
  rot = 0,
  pos = [0, 0, 0],
}) => {
  const w = x1 - x0;
  const cx = (x0 + x1) / 2;
  const lo = Math.max(y0, Math.min(split, y1));
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {lo > y0 ? <Box size={[w, lo - y0, t]} position={[cx, (y0 + lo) / 2, z]} m={PAINT_LOW} /> : null}
      {y1 > lo ? <Box size={[w, y1 - lo, t]} position={[cx, (lo + y1) / 2, z]} m={PAINT_HIGH} /> : null}
      {split > y0 && split < y1 ? <Box size={[w, 0.02, t + 0.012]} position={[cx, split, z]} m={LINE} shadow={false} /> : null}
    </group>
  );
};

// spot and sun lights with their targets inside the same group, so a set can be moved as a whole
export const Spot: React.FC<{position: V3; target: V3; color: string; intensity: number; distance?: number; angle?: number; penumbra?: number; shadow?: boolean; mapSize?: number}> = ({
  position,
  target,
  color,
  intensity,
  distance = 0,
  angle = 0.6,
  penumbra = 0.6,
  shadow = false,
  mapSize = 1024,
}) => {
  const t = useMemo(() => new Object3D(), []);
  t.position.set(...target);
  return (
    <>
      <primitive object={t} />
      <spotLight position={position} target={t} color={color} intensity={intensity} distance={distance} angle={angle} penumbra={penumbra} decay={2} castShadow={shadow} shadow-mapSize={[mapSize, mapSize]} shadow-bias={-0.0004} />
    </>
  );
};

export const Sun: React.FC<{position: V3; target: V3; color: string; intensity: number; shadow?: boolean; size?: number; mapSize?: number}> = ({
  position,
  target,
  color,
  intensity,
  shadow = false,
  size = 30,
  mapSize = 2048,
}) => {
  const t = useMemo(() => new Object3D(), []);
  t.position.set(...target);
  return (
    <>
      <primitive object={t} />
      <directionalLight
        position={position}
        target={t}
        color={color}
        intensity={intensity}
        castShadow={shadow}
        shadow-mapSize={[mapSize, mapSize]}
        shadow-bias={-0.0005}
        shadow-camera-left={-size}
        shadow-camera-right={size}
        shadow-camera-top={size}
        shadow-camera-bottom={-size}
        shadow-camera-near={0.5}
        shadow-camera-far={size * 6}
      />
    </>
  );
};
