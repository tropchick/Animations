import React, {useMemo} from 'react';
import {Texture} from 'three';
import {Box, Glow, Mat} from '../slime/parts';
import {V3, add3} from './cues';
import {EXT} from './places';
import {drawPlate, seeded, tiled, useTex} from './tex';

// The yard of corpus 14: endless identical panel towers going up into the fog, asphalt, the entrance with its lamp.

// one facade tile: 8 window bays × 8 floors, a bay is 3.0 m wide, a floor 2.8 m high
const BAYS = 8;
const FLOORS = 8;
const TILE_W = BAYS * 3.0;
const TILE_H = FLOORS * 2.8;
const PX = 128; // canvas pixels per bay

const drawFacade = (glow: boolean, seed: number) => (c: CanvasRenderingContext2D) => {
  const r = seeded(seed);
  const W = BAYS * PX;
  const H = FLOORS * PX;
  c.fillStyle = glow ? '#000' : '#b7b4ab';
  c.fillRect(0, 0, W, H);
  for (let f = 0; f < FLOORS; f++) {
    for (let b = 0; b < BAYS; b++) {
      const x = b * PX;
      const y = f * PX;
      if (!glow) {
        // panel shade varies a little, seams between the panels
        const g = 170 + Math.floor(r() * 18);
        c.fillStyle = `rgb(${g},${g - 3},${g - 10})`;
        c.fillRect(x + 2, y + 2, PX - 4, PX - 4);
        c.fillStyle = '#8e8b84';
        c.fillRect(x, y, PX, 3);
        c.fillRect(x, y, 3, PX);
      }
      // the window: a balcony bay every other column
      const balcony = b % 2 === 1;
      const wx = x + PX * 0.2;
      const wy = y + PX * 0.18;
      const ww = PX * 0.6;
      const wh = PX * 0.56;
      const lit = r();
      if (glow) {
        if (lit < 0.16) {
          c.fillStyle = lit < 0.11 ? '#ffcf86' : '#cfe4ff';
          c.fillRect(wx + 4, wy + 4, ww - 8, wh - 8);
        }
      } else {
        c.fillStyle = lit < 0.11 ? '#d9b072' : lit < 0.16 ? '#a9bccf' : '#2c3238';
        c.fillRect(wx, wy, ww, wh);
        c.fillStyle = '#e6e3dc';
        c.fillRect(wx + ww / 2 - 2, wy, 4, wh);
        c.fillRect(wx, wy + wh * 0.35, ww, 4);
        if (balcony) {
          // a glazed balcony front below the window, with rust streaks
          c.fillStyle = '#9d9a92';
          c.fillRect(x + PX * 0.1, y + PX * 0.76, PX * 0.8, PX * 0.22);
          c.fillStyle = 'rgba(90,70,55,0.35)';
          c.fillRect(x + PX * (0.2 + r() * 0.5), y + PX * 0.95, 3, PX * 0.3);
        }
        if (r() < 0.1) {
          // a dark damp stain
          c.fillStyle = 'rgba(70,72,70,0.25)';
          c.fillRect(x + r() * PX * 0.6, y + PX * 0.8, PX * 0.3, PX * 0.5);
        }
      }
    }
  }
};

const useFacade = (seed: number) => {
  const base = useTex(BAYS * PX, FLOORS * PX, drawFacade(false, seed), `facade-${seed}`);
  const glow = useTex(BAYS * PX, FLOORS * PX, drawFacade(true, seed), `facade-glow-${seed}`);
  return {base, glow};
};

// a tower: four textured walls, no roof (the top is always in the fog)
const Tower: React.FC<{at: V3; w: number; d: number; h: number; tex: {base: Texture; glow: Texture}; glow?: number}> = ({at, w, d, h, tex, glow = 1}) => {
  const faces = useMemo(() => {
    const f = (len: number) => ({map: tiled(tex.base, len / TILE_W, h / TILE_H), em: tiled(tex.glow, len / TILE_W, h / TILE_H)});
    return {front: f(w), side: f(d)};
  }, [tex, w, d, h]);
  const wall = (len: number, pos: V3, rot: number, t: {map: Texture; em: Texture}, k: string) => (
    <mesh key={k} position={add3(at, pos)} rotation={[0, rot, 0]} receiveShadow>
      <planeGeometry args={[len, h]} />
      <meshStandardMaterial map={t.map} emissiveMap={t.em} emissive="#ffffff" emissiveIntensity={0.9 * glow} roughness={0.95} />
    </mesh>
  );
  return (
    <>
      {wall(w, [0, h / 2, 0], 0, faces.front, 'f')}
      {wall(w, [0, h / 2, -d], Math.PI, faces.front, 'b')}
      {wall(d, [w / 2, h / 2, -d / 2], Math.PI / 2, faces.side, 'r')}
      {wall(d, [-w / 2, h / 2, -d / 2], -Math.PI / 2, faces.side, 'l')}
    </>
  );
};

// the other towers of the yard, all the same, fading into the fog
const OTHERS: [V3, number][] = [
  [[-38, 0, -6], 1],
  [[37, 0, -18], 2],
  [[-30, 0, -52], 3],
  [[24, 0, -64], 1],
  [[-70, 0, -30], 2],
  [[66, 0, 4], 3],
  [[-6, 0, -104], 2],
  [[-58, 0, 34], 1],
  [[60, 0, 42], 3],
  [[0, 0, 82], 2],
  [[-34, 0, 80], 3],
  [[36, 0, 86], 1],
];

const ASPHALT: Mat = {color: '#3a3e42', rough: 0.95};
const KERB: Mat = {color: '#8c8b86', rough: 0.9};
const PAVE: Mat = {color: '#6c6d6b', rough: 0.95};
const METAL_DOOR: Mat = {color: '#3a3f44', rough: 0.55, metal: 0.4};
const FRAME: Mat = {color: '#5d6166', rough: 0.7, metal: 0.2};
const CONCRETE: Mat = {color: '#9b9a94', rough: 0.95};

export const ENTRANCE_LAMP: V3 = add3(EXT, [0, 2.71, 0.55]);

export const Outside: React.FC<{lamp: number}> = ({lamp}) => {
  const t1 = useFacade(11);
  const t2 = useFacade(23);
  const t3 = useFacade(37);
  const texs = [t1, t1, t2, t3];
  const plate = useTex(512, 256, drawPlate(['КОРПУС 14', 'СЕКЦИЯ Е4']), 'plate-14');
  const big = useTex(256, 256, drawPlate(['14'], {bg: '#2f5f8a', fg: '#ffffff', border: '#e9e6dc'}), 'plate-big-14');
  return (
    <group>
      {/* the ground: asphalt, the pavement along the house, a kerb */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={add3(EXT, [0, 0, 0])} receiveShadow>
        <planeGeometry args={[420, 420]} />
        <meshStandardMaterial color={ASPHALT.color} roughness={0.95} />
      </mesh>
      <Box size={[60, 0.15, 4.0]} position={add3(EXT, [0, 0.05, 2.0])} m={PAVE} />
      <Box size={[60, 0.2, 0.2]} position={add3(EXT, [0, 0.07, 4.1])} m={KERB} />
      {/* corpus 14 itself: its front face is the plane z = 0, the entrance in the middle */}
      <Tower at={add3(EXT, [0, 0, 0])} w={24} d={14} h={420} tex={t1} />
      {OTHERS.map(([p, k], i) => (
        <Tower key={i} at={add3(EXT, p)} w={24} d={14} h={420} tex={texs[k]} glow={0.8} />
      ))}
      {/* the entrance: a concrete porch, a canopy, a steel door in a frame, the lamp */}
      <Box size={[3.0, 0.3, 1.6]} position={add3(EXT, [0, 0.12, 0.8])} m={CONCRETE} />
      <Box size={[3.4, 0.16, 1.8]} position={add3(EXT, [0, 2.86, 0.9])} m={CONCRETE} />
      <Box size={[1.5, 2.55, 0.12]} position={add3(EXT, [0, 1.25, 0.06])} m={FRAME} />
      <Box size={[1.1, 2.12, 0.06]} position={add3(EXT, [0, 1.33, 0.14])} m={METAL_DOOR} />
      <Box size={[0.05, 0.3, 0.06]} position={add3(EXT, [0.42, 1.3, 0.2])} m={FRAME} shadow={false} />
      {/* the intercom with its keypad */}
      <Box size={[0.16, 0.26, 0.04]} position={add3(EXT, [0.95, 1.4, 0.03])} m={{color: '#7c8085', rough: 0.5, metal: 0.4}} shadow={false} />
      <Glow size={[0.1, 0.05, 0.004]} position={add3(EXT, [0.95, 1.47, 0.054])} color="#7fd6c8" power={0.9} />
      {/* the lamp under the canopy; it blinks on «И выжить» */}
      <Box size={[0.4, 0.06, 0.24]} position={add3(EXT, [0, 2.75, 0.55])} m={FRAME} shadow={false} />
      <Glow size={[0.34, 0.012, 0.18]} position={add3(EXT, [0, 2.714, 0.55])} color={lamp > 0.5 ? '#fff1d2' : '#3a3833'} />
      {/* the house sign by the door and the big number at the corner */}
      <mesh position={add3(EXT, [-1.6, 1.9, 0.015])}>
        <planeGeometry args={[0.9, 0.45]} />
        <meshStandardMaterial map={plate} roughness={0.8} />
      </mesh>
      <mesh position={add3(EXT, [-11.2, 8.5, 0.02])}>
        <planeGeometry args={[1.4, 1.4]} />
        <meshStandardMaterial map={big} roughness={0.8} />
      </mesh>
      {/* a bench and a street lamp in front of the house */}
      <Box size={[1.8, 0.08, 0.45]} position={add3(EXT, [-4.5, 0.55, 2.5])} m={{color: '#6b4a32', rough: 0.9}} />
      <Box size={[0.08, 0.4, 0.4]} position={add3(EXT, [-5.2, 0.31, 2.5])} m={FRAME} />
      <Box size={[0.08, 0.4, 0.4]} position={add3(EXT, [-3.8, 0.31, 2.5])} m={FRAME} />
      {[-9, 8].map((x) => (
        <group key={x}>
          <Box size={[0.14, 6.0, 0.14]} position={add3(EXT, [x, 3.1, 5.0])} m={FRAME} />
          <Box size={[0.9, 0.1, 0.24]} position={add3(EXT, [x - 0.35, 6.1, 5.0])} m={FRAME} shadow={false} />
          <Glow size={[0.6, 0.02, 0.16]} position={add3(EXT, [x - 0.45, 6.04, 5.0])} color="#ffe2b0" />
        </group>
      ))}
    </group>
  );
};
