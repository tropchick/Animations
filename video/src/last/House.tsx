import React from 'react';
import {Box, Cyl, Glow, Mat, PaintedWall, Sign, Spot} from './parts';
import {V3} from './cues';

// The 9th floor of Kostya's panel block: the landing (z from 0 to DEPTH) and the lift cab behind the lift wall (z < 0).
export const LAND_W = 4.8;
export const DEPTH = 3.4;
export const CEIL = 2.7;
export const CAB = {x: 0.55, z0: -1.6, z1: -0.24, h: 2.15};
export const DOOR36: V3 = [LAND_W / 2, 0, 1.45]; // centre of door 36 on the right wall (facing -x)
export const CALL_BUTTON: V3 = [0.545, 1.12, -0.42]; // in the cab, on the right wall
const OPEN_W = 0.45;

const FLOOR: Mat = {color: '#7a6253', rough: 0.75, env: 0.3};
const TILE_LINE: Mat = {color: '#5b483d', rough: 0.8};
const CAB_WALL: Mat = {color: '#8a6a4c', rough: 0.6, env: 0.45};
const CAB_FLOOR: Mat = {color: '#35312e', rough: 0.85};
const STEEL: Mat = {color: '#8d949a', metal: 0.7, rough: 0.35, env: 0.9};
const DOOR_LEAF: Mat = {color: '#9aa1a6', metal: 0.55, rough: 0.42, env: 0.8};
const LEATHER: Mat = {color: '#4f3428', rough: 0.55, env: 0.4};
const BRASS: Mat = {color: '#b8964f', metal: 0.8, rough: 0.35, env: 0.9};
const FRAME: Mat = {color: '#ece8de', rough: 0.7};
const RADIATOR: Mat = {color: '#cfcac0', rough: 0.6, env: 0.4};
const MAT_RUG: Mat = {color: '#5b4d44', rough: 1};
const PLASTIC: Mat = {color: '#2c2f33', rough: 0.6};

export type Light = 'day' | 'evening' | 'night';

const AptDoor: React.FC<{n: number; position: V3; rot: number; under?: number; paws?: number}> = ({n, position, rot, under = 0, paws = 0}) => (
  <group position={position} rotation={[0, rot, 0]}>
    {/* local: door face looks along +z, the wall surface is at z = 0 */}
    <Box size={[1.02, 2.12, 0.04]} position={[0, 1.06, 0.02]} m={FRAME} />
    <Box size={[0.9, 2.02, 0.06]} position={[0, 1.035, 0.07]} m={LEATHER} />
    {[0.45, 1.0, 1.55].map((y) => (
      <Box key={y} size={[0.8, 0.012, 0.01]} position={[0, y, 0.105]} m={{color: '#3c271e', rough: 0.6}} shadow={false} />
    ))}
    <Box size={[0.04, 0.16, 0.04]} position={[0.34, 1.0, 0.12]} m={BRASS} />
    <Box size={[0.03, 0.03, 0.03]} position={[0.34, 1.16, 0.115]} m={BRASS} shadow={false} />
    <Cyl r={0.012} h={0.02} position={[0, 1.55, 0.11]} rotation={[Math.PI / 2, 0, 0]} m={BRASS} shadow={false} />
    <Sign
      id={`door-${n}`}
      size={[0.12, 0.08]}
      position={[0, 1.78, 0.1035]}
      px={96}
      draw={(c) => {
        c.fillStyle = '#c9a35a';
        c.fillRect(0, 0, 144, 96);
        c.fillStyle = '#2a1d10';
        c.font = '600 64px Inter';
        c.textAlign = 'center';
        c.fillText(String(n), 72, 72);
      }}
    />
    <Box size={[0.8, 0.014, 0.5]} position={[0, 0.009, 0.4]} m={MAT_RUG} />
    {under > 0 ? (
      <>
        <Glow size={[0.82, 0.02, 0.004]} position={[0, 0.012, 0.043]} color="#ffd9a0" power={under} />
        {/* the dog behind the door: shadows of paws crossing the strip of light */}
        {[0, 1].map((k) => (
          <Box key={k} size={[0.07, 0.022, 0.003]} position={[-0.25 + paws * 0.4 + k * 0.11, 0.012, 0.0465]} m={{color: '#0b0806', rough: 1}} shadow={false} />
        ))}
      </>
    ) : null}
  </group>
);

const LiftDoors: React.FC<{open: number}> = ({open}) => {
  const s = open * (OPEN_W + 0.02);
  return (
    <>
      <Box size={[OPEN_W + 0.02, 2.05, 0.04]} position={[-(OPEN_W + 0.02) / 2 - s, 1.025, -0.12]} m={DOOR_LEAF} />
      <Box size={[OPEN_W + 0.02, 2.05, 0.04]} position={[(OPEN_W + 0.02) / 2 + s, 1.025, -0.12]} m={DOOR_LEAF} />
    </>
  );
};

// floor display over the door inside the cab, and the button panel
const CabPanel: React.FC<{floor: string; lamp: number; ledOn: boolean}> = ({floor, lamp, ledOn}) => (
  <>
    <Sign
      id={`floor-${floor}`}
      size={[0.16, 0.08]}
      position={[0, 2.11, -0.2455]}
      rotation={[0, Math.PI, 0]}
      px={64}
      lit={0.4 + 0.6 * lamp}
      draw={(c) => {
        c.fillStyle = '#120806';
        c.fillRect(0, 0, 128, 64);
        c.fillStyle = '#ff6a3a';
        c.font = '600 52px "IBM Plex Mono"';
        c.textAlign = 'center';
        c.fillText(floor, 64, 52);
      }}
    />
    <group position={[CAB.x - 0.006, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
      {/* local +z points into the cab (towards -x) */}
      <Box size={[0.16, 0.76, 0.012]} position={[-0.42, 1.3, 0]} m={STEEL} />
      <Sign
        id="cab-buttons"
        size={[0.12, 0.42]}
        position={[-0.42, 1.43, 0.0085]}
        px={420}
        draw={(c) => {
          c.fillStyle = '#7f868c';
          c.fillRect(0, 0, 120, 420);
          for (let i = 0; i < 9; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = 34 + col * 52;
            const y = 380 - row * 70;
            c.fillStyle = '#2b2e31';
            c.beginPath();
            c.arc(x, y, 20, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#e6e8ea';
            c.font = '600 22px Inter';
            c.textAlign = 'center';
            c.fillText(String(i + 1), x, y + 8);
          }
          c.fillStyle = '#4b5055';
          for (let k = 0; k < 5; k++) for (let j = 0; j < 4; j++) c.fillRect(30 + j * 18, 40 + k * 14, 10, 6);
        }}
      />
      {/* the call button: a bell with a green light */}
      <Cyl r={0.022} h={0.012} position={[-0.42, 1.12, 0.012]} rotation={[Math.PI / 2, 0, 0]} m={{color: '#c9a83c', rough: 0.4, metal: 0.4}} shadow={false} />
      <Glow size={[0.012, 0.012, 0.004]} position={[-0.42, 1.16, 0.008]} color={ledOn ? '#4dff88' : '#123a20'} power={ledOn ? 2 : 1} />
    </group>
    {ledOn ? <pointLight position={[CALL_BUTTON[0] - 0.2, CALL_BUTTON[1] + 0.05, CALL_BUTTON[2]]} color="#4dff88" intensity={0.012} distance={1.6} decay={2} /> : null}
  </>
);

export const House: React.FC<{
  light: Light;
  doorsOpen: number; // 0 closed .. 1 open
  cabLamp: number; // 0..1, flickers in the hook
  floor: string;
  dog?: number; // the dog behind door 36 moving, 0..1
  cabOnly?: boolean; // the cab between floors: no landing behind the doors
}> = ({light, doorsOpen, cabLamp, floor, dog = 0, cabOnly = false}) => {
  const day = light === 'day';
  const sky = day ? '#dfe3e3' : light === 'evening' ? '#27344a' : '#0b1018';
  return (
    <group>
      {/* ---------------------------------------------------------- lift cab */}
      <Box size={[1.18, 0.06, CAB.z1 - CAB.z0 + 0.04]} position={[0, -0.03, (CAB.z0 + CAB.z1) / 2 - 0.02]} m={CAB_FLOOR} />
      <Box size={[0.04, CAB.h, CAB.z1 - CAB.z0 + 0.08]} position={[-CAB.x - 0.02, CAB.h / 2, (CAB.z0 + CAB.z1) / 2]} m={CAB_WALL} />
      <Box size={[0.04, CAB.h, CAB.z1 - CAB.z0 + 0.08]} position={[CAB.x + 0.02, CAB.h / 2, (CAB.z0 + CAB.z1) / 2]} m={CAB_WALL} />
      <Box size={[1.18, CAB.h, 0.04]} position={[0, CAB.h / 2, CAB.z0 - 0.02]} m={CAB_WALL} />
      <Box size={[1.18, 0.04, CAB.z1 - CAB.z0 + 0.08]} position={[0, CAB.h + 0.02, (CAB.z0 + CAB.z1) / 2]} m={{color: '#cfc9bd', rough: 0.9}} />
      {/* cab front wall around the opening */}
      <Box size={[0.14, CAB.h, 0.04]} position={[-(OPEN_W + 0.07), CAB.h / 2, -0.22]} m={CAB_WALL} />
      <Box size={[0.14, CAB.h, 0.04]} position={[OPEN_W + 0.07, CAB.h / 2, -0.22]} m={CAB_WALL} />
      <Box size={[1.18, CAB.h - 2.05, 0.04]} position={[0, 2.05 + (CAB.h - 2.05) / 2, -0.22]} m={CAB_WALL} />
      {/* scratched mirror and a handrail on the back wall */}
      <Box size={[0.72, 1.0, 0.012]} position={[0, 1.35, CAB.z0 + 0.006]} m={{color: '#aab4ba', metal: 0.95, rough: 0.12, env: 1.4}} />
      <Box size={[0.9, 0.035, 0.035]} position={[0, 0.92, CAB.z0 + 0.06]} m={STEEL} />
      {/* skirting strips on the side walls */}
      <Box size={[0.012, 0.1, CAB.z1 - CAB.z0]} position={[-CAB.x + 0.006, 0.05, (CAB.z0 + CAB.z1) / 2]} m={STEEL} shadow={false} />
      <Box size={[0.012, 0.1, CAB.z1 - CAB.z0]} position={[CAB.x - 0.006, 0.05, (CAB.z0 + CAB.z1) / 2]} m={STEEL} shadow={false} />
      {/* lamp */}
      <Box size={[0.56, 0.02, 0.34]} position={[0, CAB.h - 0.012, -0.95]} m={{color: '#cfcac0', rough: 0.6}} shadow={false} />
      <Glow size={[0.5, 0.012, 0.28]} position={[0, CAB.h - 0.027, -0.95]} color="#fff1d6" power={0.08 + 0.92 * cabLamp} />
      {cabLamp > 0 ? <pointLight position={[0, CAB.h - 0.25, -0.95]} color="#ffe9c8" intensity={1.1 * cabLamp} distance={4} decay={2} /> : null}
      <CabPanel floor={floor} lamp={cabLamp} ledOn />
      {/* sill */}
      <Box size={[0.98, 0.04, 0.24]} position={[0, -0.016, -0.12]} m={STEEL} />
      <LiftDoors open={doorsOpen} />
      {cabOnly ? (
        <Box size={[1.2, 2.2, 0.04]} position={[0, 1.1, -0.04]} m={{color: '#141414', rough: 1}} />
      ) : (
        <>
          {/* ---------------------------------------------------------- landing */}
          <Box size={[LAND_W, 0.1, DEPTH]} position={[0, -0.05, DEPTH / 2]} m={FLOOR} />
          {Array.from({length: 11}).map((_, i) => (
            <Box key={`tx${i}`} size={[0.012, 0.004, DEPTH]} position={[-LAND_W / 2 + 0.2 + i * 0.44, 0.002, DEPTH / 2]} m={TILE_LINE} shadow={false} />
          ))}
          {Array.from({length: 8}).map((_, i) => (
            <Box key={`tz${i}`} size={[LAND_W, 0.004, 0.012]} position={[0, 0.0045, 0.22 + i * 0.44]} m={TILE_LINE} shadow={false} />
          ))}
          <Box size={[LAND_W + 0.4, 0.1, DEPTH + 0.4]} position={[0, CEIL + 0.05, DEPTH / 2]} m={{color: '#d4cfc3', rough: 0.95}} />
          {/* lift wall, landing side, with the opening */}
          <PaintedWall x0={-LAND_W / 2} x1={-OPEN_W} z={-0.03} t={0.06} y1={CEIL} />
          <PaintedWall x0={OPEN_W} x1={LAND_W / 2} z={-0.03} t={0.06} y1={CEIL} />
          <PaintedWall x0={-OPEN_W} x1={OPEN_W} z={-0.03} t={0.06} y0={2.05} y1={CEIL} />
          {/* steel portal */}
          <Box size={[0.08, 2.13, 0.05]} position={[-OPEN_W - 0.04, 1.065, 0.025]} m={STEEL} />
          <Box size={[0.08, 2.13, 0.05]} position={[OPEN_W + 0.04, 1.065, 0.025]} m={STEEL} />
          <Box size={[OPEN_W * 2 + 0.16, 0.08, 0.05]} position={[0, 2.09, 0.025]} m={STEEL} />
          <Sign
            id="floor9"
            size={[0.22, 0.22]}
            position={[0, 2.38, 0.004]}
            px={128}
            draw={(c) => {
              c.clearRect(0, 0, 128, 128);
              c.fillStyle = '#2d3a31';
              c.font = '600 110px Inter';
              c.textAlign = 'center';
              c.fillText('9', 64, 108);
            }}
          />
          {/* call button outside */}
          <Box size={[0.08, 0.14, 0.02]} position={[0.75, 1.15, 0.01]} m={STEEL} />
          <Cyl r={0.018} h={0.01} position={[0.75, 1.15, 0.024]} rotation={[Math.PI / 2, 0, 0]} m={PLASTIC} shadow={false} />
          {/* electrical cabinet */}
          <Box size={[0.5, 0.8, 0.12]} position={[-2.05, 1.75, 0.06]} m={{color: '#7c8077', rough: 0.7, env: 0.4}} />
          <Box size={[0.02, 0.08, 0.02]} position={[-1.85, 1.75, 0.125]} m={PLASTIC} shadow={false} />
          {/* side walls */}
          <PaintedWall x0={0} x1={DEPTH} z={LAND_W / 2 + 0.1} rot={-Math.PI / 2} y1={CEIL} />
          <PaintedWall x0={0} x1={DEPTH} z={-LAND_W / 2 - 0.1} rot={-Math.PI / 2} y1={CEIL} />
          {/* far wall with the stair window */}
          <PaintedWall x0={-LAND_W / 2} x1={-0.7} z={DEPTH + 0.1} y1={CEIL} />
          <PaintedWall x0={0.7} x1={LAND_W / 2} z={DEPTH + 0.1} y1={CEIL} />
          <PaintedWall x0={-0.7} x1={0.7} z={DEPTH + 0.1} y1={1.0} />
          <PaintedWall x0={-0.7} x1={0.7} z={DEPTH + 0.1} y0={2.3} y1={CEIL} />
          <Box size={[1.5, 0.05, 0.26]} position={[0, 1.0, DEPTH + 0.02]} m={FRAME} />
          <Box size={[0.06, 1.3, 0.08]} position={[0, 1.65, DEPTH + 0.1]} m={FRAME} />
          <Box size={[1.4, 0.06, 0.08]} position={[0, 2.27, DEPTH + 0.1]} m={FRAME} />
          <Box size={[0.06, 1.3, 0.08]} position={[-0.67, 1.65, DEPTH + 0.1]} m={FRAME} />
          <Box size={[0.06, 1.3, 0.08]} position={[0.67, 1.65, DEPTH + 0.1]} m={FRAME} />
          <Glow size={[1.6, 1.5, 0.02]} position={[0, 1.65, DEPTH + 0.35]} color={sky} power={1} />
          {/* radiator */}
          {Array.from({length: 9}).map((_, i) => (
            <Box key={i} size={[0.07, 0.5, 0.08]} position={[-0.36 + i * 0.09, 0.55, DEPTH - 0.08]} m={RADIATOR} />
          ))}
          <AptDoor n={33} position={[-1.15, 0, 0]} rot={0} />
          <AptDoor n={34} position={[1.6, 0, 0]} rot={0} />
          <AptDoor n={35} position={[-LAND_W / 2, 0, 1.45]} rot={Math.PI / 2} />
          <AptDoor n={36} position={DOOR36} rot={-Math.PI / 2} under={light === 'day' ? 0 : 0.9} paws={dog} />
          {/* bare bulb on the ceiling */}
          <Cyl r={0.006} h={0.25} position={[0, CEIL - 0.125, 1.6]} m={PLASTIC} shadow={false} />
          <Glow size={[0.07, 0.09, 0.07]} position={[0, CEIL - 0.3, 1.6]} color={light === 'day' ? '#cfc6b2' : '#ffd99a'} power={light === 'day' ? 0.6 : 1.5} />
          {light === 'day' ? (
            <>
              <Spot position={[0, 2.2, DEPTH + 1.2]} target={[0, 0, 0.6]} color="#e6ecef" intensity={18} distance={9} angle={0.9} penumbra={0.8} shadow />
              <hemisphereLight color="#d7dcdf" groundColor="#5a4c42" intensity={0.55} />
            </>
          ) : (
            <>
              <pointLight position={[0, CEIL - 0.42, 1.6]} color="#ffcf8a" intensity={2.2} distance={7} decay={2} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
              <pointLight position={[DOOR36[0] - 0.12, 0.05, DOOR36[2]]} color="#ffc98a" intensity={0.05} distance={1.2} decay={2} />
              <hemisphereLight color="#5b6a85" groundColor="#2a221d" intensity={0.12} />
            </>
          )}
        </>
      )}
    </group>
  );
};
