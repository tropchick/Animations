import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box, Glow, Mat} from '../slime/parts';
import {PaintedWall} from '../last/parts';
import {V3, add3} from './cues';
import {CORR, CORR_H, CORR_LEN, CORR_W, DOOR_A_X, DOOR_B_X, DOOR_H, DOOR_W, LAND, LAND_WALL_Z} from './places';
import {FONT, drawPlate, seeded, useTex} from './tex';

// The long corridor of a floor (along -z from CORR) and the landing of floor 430 with flats 412А and 412Б.

const WHITE: Mat = {color: '#d8d3c6', rough: 0.95};
const FRAME: Mat = {color: '#4a3a2e', rough: 0.8};
const KNOB: Mat = {color: '#b9a46a', rough: 0.35, metal: 0.8};
const MAT_RUG: Mat = {color: '#4d4038', rough: 1};

const drawTiles = (c: CanvasRenderingContext2D) => {
  const {width: w, height: h} = c.canvas;
  const r = seeded(3);
  const n = 4;
  const s = w / n;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const dark = (i + j) % 2 === 0;
      const v = Math.floor(r() * 14);
      c.fillStyle = dark ? `rgb(${112 + v},${74 + v},${56 + v})` : `rgb(${196 + v},${182 + v},${156 + v})`;
      c.fillRect(i * s, j * s, s, s);
      c.fillStyle = 'rgba(40,30,25,0.5)';
      c.fillRect(i * s, j * s, s, 2);
      c.fillRect(i * s, j * s, 2, s);
    }
  for (let k = 0; k < 30; k++) {
    c.fillStyle = `rgba(60,50,40,${0.05 + r() * 0.1})`;
    c.fillRect(r() * w, r() * h, 6 + r() * 40, 6 + r() * 30);
  }
};

// a flat door: brown leatherette, quilted in diamonds with brass studs, a number plate
const drawLeather = (num: string) => (c: CanvasRenderingContext2D) => {
  const {width: w, height: h} = c.canvas;
  c.fillStyle = '#5a3b2c';
  c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(30,18,12,0.6)';
  c.lineWidth = 3;
  const step = w / 4;
  for (let k = -8; k < 16; k++) {
    c.beginPath();
    c.moveTo(k * step, 0);
    c.lineTo(k * step + h, h);
    c.stroke();
    c.beginPath();
    c.moveTo(k * step, 0);
    c.lineTo(k * step - h, h);
    c.stroke();
  }
  c.fillStyle = '#c8b06a';
  for (let i = 0; i <= 8; i++)
    for (let j = 0; j <= 20; j++) {
      if ((i + j) % 2) continue;
      c.beginPath();
      c.arc((i * step) / 2, (j * step) / 2, 4, 0, Math.PI * 2);
      c.fill();
    }
  // the number plate
  c.fillStyle = '#d9c27a';
  c.fillRect(w * 0.3, h * 0.12, w * 0.4, h * 0.07);
  c.fillStyle = '#2a2117';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = `800 ${h * 0.055}px ${FONT}`;
  c.fillText(num, w / 2, h * 0.157, w * 0.38);
};

// ---------------------------------------------------------------- one flat door in a frame, on a wall facing +z (local)

// flush: the door hangs on a wall with no opening (the corridor); otherwise it sits in an opening, its face 1 cm behind the wall face
export const FlatDoor: React.FC<{num: string; position: V3; yaw: number; open?: number; hinge?: 1 | -1; flush?: boolean}> = ({num, position, yaw, open = 0, hinge = -1, flush = false}) => {
  const tex = useTex(256, 600, drawLeather(num), `leather-${num}`);
  const m: Mat = {color: '#ffffff', rough: 0.7, map: tex};
  const w = DOOR_W - 0.02;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {/* the frame round the opening, 2-3 cm proud of the wall */}
      <Box size={[0.07, DOOR_H + 0.07, 0.03]} position={[-DOOR_W / 2 - 0.035, (DOOR_H + 0.07) / 2, 0.015]} m={FRAME} />
      <Box size={[0.07, DOOR_H + 0.07, 0.03]} position={[DOOR_W / 2 + 0.035, (DOOR_H + 0.07) / 2, 0.015]} m={FRAME} />
      <Box size={[DOOR_W + 0.16, 0.07, 0.036]} position={[0, DOOR_H + 0.035, 0.018]} m={FRAME} />
      {/* the leaf, hinged on one side, swinging out */}
      <group position={[hinge * (DOOR_W / 2 - 0.005), 0, flush ? 0.056 : -0.012]} rotation={[0, hinge * open, 0]}>
        <Box size={[w, DOOR_H - 0.02, 0.05]} position={[-hinge * (w / 2), (DOOR_H - 0.02) / 2 + 0.005, -0.025]} m={m} />
        <Box size={[0.03, 0.03, 0.06]} position={[-hinge * (w - 0.08), 1.0, 0.03]} m={KNOB} shadow={false} />
        <Box size={[0.09, 0.02, 0.025]} position={[-hinge * (w - 0.1), 1.0, 0.065]} m={KNOB} shadow={false} />
        <mesh position={[-hinge * (w / 2), 1.55, 0.004]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.01, 10]} />
          <meshStandardMaterial color="#8c7d55" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- the corridor

const C = (p: V3): V3 => add3(CORR, p);
export const CORR_DOORS = [-3.2, -6.6, -10.0, -13.4, -16.8, -20.2, -23.6, -27.0];
export const CORR_LAMPS = [-2.4, -6.4, -10.4, -14.4, -18.4, -22.4, -26.4, -30.4];
export const FLICKER_LAMP = 3; // the one at -14.4 m blinks
export const LONG_LAMP = 7; // the one over the Long One

export const Corridor: React.FC<{lamp: (i: number) => number; floor: number}> = ({lamp, floor}) => {
  const tiles = useTex(512, 512, drawTiles, 'corr-tiles');
  const floorMap = useMemo(() => {
    const t = tiles.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(CORR_W / 1.2, CORR_LEN / 1.2);
    t.needsUpdate = true;
    return t;
  }, [tiles]);
  const plate = useTex(768, 256, drawPlate([`ЭТАЖ ${floor}`, 'КОРПУС 14 · СЕКЦИЯ Е4']), `corr-plate-${floor}`);
  const half = CORR_W / 2;
  return (
    <group>
      <mesh position={C([0, 0, -CORR_LEN / 2])} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[CORR_W, CORR_LEN]} />
        <meshStandardMaterial map={floorMap} roughness={0.7} envMapIntensity={0.4} />
      </mesh>
      <Box size={[CORR_W + 0.4, 0.1, CORR_LEN + 0.4]} position={C([0, CORR_H + 0.05, -CORR_LEN / 2])} m={WHITE} />
      <PaintedWall x0={-0.2} x1={CORR_LEN + 0.2} z={-half - 0.1} rot={Math.PI / 2} pos={CORR} y1={CORR_H} />
      <PaintedWall x0={-0.2} x1={CORR_LEN + 0.2} z={half + 0.1} rot={Math.PI / 2} pos={CORR} y1={CORR_H} />
      <PaintedWall x0={-half} x1={half} z={-CORR_LEN - 0.1} pos={CORR} y1={CORR_H} />
      <PaintedWall x0={-half} x1={half} z={0.1} pos={CORR} y1={CORR_H} />
      {/* the window at the far end: grey fog light behind the Long One */}
      <Box size={[1.1, 1.3, 0.04]} position={C([0, 1.55, -CORR_LEN + 0.02])} m={{color: '#e4e1d8', rough: 0.8}} />
      <Glow size={[0.98, 1.18, 0.01]} position={C([0, 1.55, -CORR_LEN + 0.045])} color="#c3cbca" />
      <Box size={[0.04, 1.18, 0.03]} position={C([0, 1.55, -CORR_LEN + 0.06])} m={{color: '#e4e1d8', rough: 0.8}} shadow={false} />
      {/* the stairwell door we came in by, with a wired-glass window */}
      <FlatDoor num="" position={C([-0.3, 0, 0])} yaw={Math.PI} flush />
      {CORR_DOORS.map((z, i) => {
        const left = i % 2 === 0;
        const x = left ? -half : half;
        return (
          <group key={z}>
            <FlatDoor num={`${floor * 10 + i + 1}`} position={C([x, 0, z])} yaw={left ? Math.PI / 2 : -Math.PI / 2} flush />
            <Box size={[0.36, 0.012, 0.56]} position={C([x + (left ? 0.24 : -0.24), 0.006, z])} m={MAT_RUG} shadow={false} />
          </group>
        );
      })}
      {CORR_LAMPS.map((z, i) => (
        <group key={z}>
          <Box size={[0.2, 0.06, 0.5]} position={C([0, CORR_H - 0.03, z])} m={{color: '#e6e3da', rough: 0.6}} shadow={false} />
          <Glow size={[0.14, 0.012, 0.44]} position={C([0, CORR_H - 0.066, z])} color={lamp(i) > 0.5 ? '#eef3ea' : '#4d504c'} />
        </group>
      ))}
      <mesh position={C([-half + 0.012, 1.9, -1.0])} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.75, 0.25]} />
        <meshStandardMaterial map={plate} roughness={0.8} />
      </mesh>
      {/* fog lying on the floor */}
      {[0.08, 0.22].map((y, i) => (
        <mesh key={y} position={C([0, y, -CORR_LEN / 2])} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[CORR_W - 0.02, CORR_LEN - 0.02]} />
          <meshBasicMaterial color="#d6dcda" transparent opacity={0.14 - i * 0.05} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

export const corrLamp = (i: number): V3 => C([0, CORR_H - 0.1, CORR_LAMPS[i]]);

// ---------------------------------------------------------------- the landing of floor 430

const Ld = (p: V3): V3 => add3(LAND, p);
const HALF = 2.4;
const BACK = LAND_WALL_Z; // front face of the wall with the two doors
const A0 = DOOR_A_X - DOOR_W / 2;
const A1 = DOOR_A_X + DOOR_W / 2;
const B0 = DOOR_B_X - DOOR_W / 2;
const B1 = DOOR_B_X + DOOR_W / 2;
const DARK_ROOM: Mat = {color: '#24211f', rough: 0.95};
const WARM_ROOM: Mat = {color: '#a8865c', rough: 0.95};

export const Landing: React.FC<{openA: number; openB: number; chain: boolean}> = ({openA, openB, chain}) => {
  const plate = useTex(1024, 256, drawPlate(['КОРПУС 14 · СЕКЦИЯ Е4', 'ЭТАЖ 430']), 'land-plate');
  const wz = BACK - 0.1;
  // the free edge of door Б (hinge on the right), for the chain
  const edge: V3 = Ld([B1 - 0.005 - Math.cos(openB) * (DOOR_W - 0.02), 1.3, BACK - 0.012 + Math.sin(openB) * (DOOR_W - 0.02)]);
  const jamb: V3 = Ld([B0 + 0.02, 1.3, BACK + 0.01]);
  return (
    <group>
      <Box size={[HALF * 2 + 0.4, 0.04, 5.4]} position={Ld([0, -0.02, 0.6])} m={{color: '#6f675b', rough: 0.95}} />
      {/* the back wall round the two openings */}
      <PaintedWall x0={-HALF} x1={A0} z={wz} pos={LAND} y1={2.7} />
      <PaintedWall x0={A1} x1={B0} z={wz} pos={LAND} y1={2.7} />
      <PaintedWall x0={B1} x1={HALF} z={wz} pos={LAND} y1={2.7} />
      <Box size={[DOOR_W, 2.7 - DOOR_H, 0.2]} position={Ld([DOOR_A_X, (2.7 + DOOR_H) / 2, wz])} m={WHITE} />
      <Box size={[DOOR_W, 2.7 - DOOR_H, 0.2]} position={Ld([DOOR_B_X, (2.7 + DOOR_H) / 2, wz])} m={WHITE} />
      {/* side walls, front wall, ceiling */}
      <PaintedWall x0={-3.3} x1={-BACK + 0.2} z={-HALF - 0.1} rot={Math.PI / 2} pos={LAND} y1={2.7} />
      <PaintedWall x0={-3.3} x1={-BACK + 0.2} z={HALF + 0.1} rot={Math.PI / 2} pos={LAND} y1={2.7} />
      <PaintedWall x0={-HALF} x1={HALF} z={3.4} pos={LAND} y1={2.7} />
      <Box size={[HALF * 2 + 0.4, 0.1, 5.6]} position={Ld([0, 2.75, 0.6])} m={WHITE} />
      <Box size={[0.5, 0.06, 0.2]} position={Ld([0, 2.67, 0.2])} m={{color: '#e6e3da', rough: 0.6}} shadow={false} />
      <Glow size={[0.44, 0.012, 0.14]} position={Ld([0, 2.634, 0.2])} color="#eef3ea" />
      <mesh position={Ld([0, 1.95, BACK + 0.012])}>
        <planeGeometry args={[0.84, 0.21]} />
        <meshStandardMaterial map={plate} roughness={0.8} />
      </mesh>
      {/* the two doors: А swings wide open by itself, Б opens a crack on the chain */}
      <FlatDoor num="412А" position={Ld([DOOR_A_X, 0, BACK])} yaw={0} open={openA} hinge={-1} />
      <FlatDoor num="412Б" position={Ld([DOOR_B_X, 0, BACK])} yaw={0} open={openB} hinge={1} />
      {chain && openB > 0.02 ? <Chain from={edge} to={jamb} /> : null}
      {/* behind А: a dark hall, tall enough for what stands in it */}
      <Box size={[1.6, 0.04, 1.8]} position={Ld([DOOR_A_X - 0.05, -0.02, BACK - 0.2 - 0.9])} m={DARK_ROOM} />
      <Box size={[0.1, 3.4, 1.8]} position={Ld([A0 - 0.4, 1.7, BACK - 0.2 - 0.9])} m={DARK_ROOM} />
      <Box size={[0.1, 3.4, 1.8]} position={Ld([A1 + 0.4, 1.7, BACK - 0.2 - 0.9])} m={DARK_ROOM} />
      <Box size={[1.8, 3.4, 0.1]} position={Ld([DOOR_A_X, 1.7, BACK - 2.05])} m={DARK_ROOM} />
      <Box size={[1.8, 0.1, 1.9]} position={Ld([DOOR_A_X, 3.45, BACK - 0.2 - 0.9])} m={DARK_ROOM} />
      {/* behind Б: a lit hall with warm wallpaper */}
      <Box size={[1.6, 0.04, 1.8]} position={Ld([DOOR_B_X + 0.05, -0.02, BACK - 0.2 - 0.9])} m={{color: '#6a4c34', rough: 0.9}} />
      <Box size={[0.1, 2.6, 1.8]} position={Ld([B0 - 0.4, 1.3, BACK - 0.2 - 0.9])} m={WARM_ROOM} />
      <Box size={[0.1, 2.6, 1.8]} position={Ld([B1 + 0.4, 1.3, BACK - 0.2 - 0.9])} m={WARM_ROOM} />
      <Box size={[1.8, 2.6, 0.1]} position={Ld([DOOR_B_X, 1.3, BACK - 2.05])} m={WARM_ROOM} />
      <Box size={[1.8, 0.1, 1.9]} position={Ld([DOOR_B_X, 2.65, BACK - 0.2 - 0.9])} m={WARM_ROOM} />
      <pointLight position={Ld([DOOR_B_X, 2.2, BACK - 1.2])} color="#ffc98a" intensity={openB > 0.02 ? 2.2 : 0} distance={4} decay={1.6} />
    </group>
  );
};

// a door chain: a few links sagging from the door's free edge to the frame
const Chain: React.FC<{from: V3; to: V3}> = ({from, to}) => {
  const n = 7;
  const links: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const p: V3 = [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - Math.sin(t * Math.PI) * 0.025, from[2] + (to[2] - from[2]) * t];
    links.push(<Box key={i} size={[0.022, 0.012, 0.012]} position={p} rotation={[i % 2 ? Math.PI / 2 : 0, Math.atan2(-(to[2] - from[2]), to[0] - from[0]), 0]} m={KNOB} shadow={false} />);
  }
  return <>{links}</>;
};

export const LAND_LAMP: V3 = Ld([0, 2.55, 0.2]);
export const DOOR_A_CENTER: V3 = Ld([DOOR_A_X, 1.2, BACK]);
export const DOOR_B_CENTER: V3 = Ld([DOOR_B_X, 1.2, BACK]);
