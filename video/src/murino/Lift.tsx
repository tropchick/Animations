import React from 'react';
import {Box, Glow, Mat} from '../slime/parts';
import {PaintedWall} from '../last/parts';
import {V3, add3} from './cues';
import {LIFT} from './places';
import {FONT, MONO_FONT, drawPlate, seeded, useTex} from './tex';

// Inside the lift: brown laminate walls, a panel with buttons 1..100 only, a paper note «ВЫШЕ 100 — ПО ЛЕСТНИЦЕ»,
// sliding steel doors that open onto the foggy landing of floor 100.
// The cabin: x -0.55..0.55, z -0.7..0.7 (doors at +z), floor 0, ceiling 2.1.

const L = (p: V3): V3 => add3(LIFT, p);

const STEEL: Mat = {color: '#8d949a', rough: 0.35, metal: 0.7, env: 0.8};
const DARK: Mat = {color: '#2a2c2f', rough: 0.6};
const FLOOR: Mat = {color: '#3b3733', rough: 0.9};
const CEIL: Mat = {color: '#c9c6bd', rough: 0.9};
const PAINT_SIDE: Mat = {color: '#d8d3c6', rough: 0.95};

const drawLaminate = (c: CanvasRenderingContext2D) => {
  const {width: w, height: h} = c.canvas;
  const r = seeded(7);
  c.fillStyle = '#6e5440';
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 140; i++) {
    const x = r() * w;
    c.fillStyle = `rgba(${r() < 0.5 ? '40,28,20' : '140,110,85'},${0.08 + r() * 0.12})`;
    c.fillRect(x, 0, 1 + r() * 3, h);
  }
  // scratches, a tally of floors, and the letter Ч
  c.strokeStyle = 'rgba(220,205,185,0.55)';
  c.lineWidth = 3;
  for (let i = 0; i < 18; i++) {
    const x = r() * w;
    const y = h * 0.3 + r() * h * 0.5;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + (r() - 0.5) * 90, y + (r() - 0.5) * 40);
    c.stroke();
  }
  c.lineWidth = 5;
  for (let g = 0; g < 4; g++) {
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(w * 0.18 + g * 70 + i * 13, h * 0.42);
      c.lineTo(w * 0.18 + g * 70 + i * 13, h * 0.42 + 46);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(w * 0.18 + g * 70 - 6, h * 0.42 + 40);
    c.lineTo(w * 0.18 + g * 70 + 50, h * 0.42 + 6);
    c.stroke();
  }
  c.font = `700 120px ${FONT}`;
  c.fillStyle = 'rgba(225,212,195,0.6)';
  c.fillText('Ч', w * 0.62, h * 0.62);
};

const drawPanel = (lit: boolean) => (c: CanvasRenderingContext2D) => {
  const {width: w, height: h} = c.canvas;
  c.fillStyle = '#9aa1a7';
  c.fillRect(0, 0, w, h);
  c.fillStyle = '#7c838a';
  c.fillRect(8, 8, w - 16, h - 16);
  const cols = 5;
  const rows = 20;
  const cw = (w - 40) / cols;
  const rh = (h - 60) / rows;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (let n = 1; n <= 100; n++) {
    const row = rows - 1 - Math.floor((n - 1) / cols);
    const col = (n - 1) % cols;
    const x = 20 + col * cw + cw / 2;
    const y = 40 + row * rh + rh / 2;
    const on = lit && n === 100;
    c.beginPath();
    c.arc(x, y, Math.min(cw, rh) * 0.4, 0, Math.PI * 2);
    c.fillStyle = on ? '#ffd27a' : '#2b2f33';
    c.fill();
    c.strokeStyle = on ? '#ffe9b8' : '#c7ccd1';
    c.lineWidth = 3;
    c.stroke();
    c.fillStyle = on ? '#3a2a10' : '#e8eaec';
    c.font = `700 ${Math.round(rh * 0.42)}px ${MONO_FONT}`;
    c.fillText(String(n), x, y + 1);
  }
};

const drawNote = (c: CanvasRenderingContext2D) => {
  const {width: w, height: h} = c.canvas;
  c.fillStyle = '#efeadb';
  c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(120,110,90,0.25)';
  for (let y = 40; y < h; y += 34) c.fillRect(0, y, w, 2);
  c.fillStyle = '#1d2a6b';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = `800 ${h * 0.3}px ${FONT}`;
  c.fillText('ВЫШЕ 100 —', w / 2, h * 0.34, w * 0.92);
  c.fillText('ПО ЛЕСТНИЦЕ', w / 2, h * 0.7, w * 0.92);
  // sticky tape on top
  c.fillStyle = 'rgba(230,225,190,0.8)';
  c.fillRect(w * 0.38, 0, w * 0.24, h * 0.1);
};

const drawDisplay = (floor: number) => (c: CanvasRenderingContext2D) => {
  const {width: w, height: h} = c.canvas;
  c.fillStyle = '#0c0d0e';
  c.fillRect(0, 0, w, h);
  c.fillStyle = '#ff4a2e';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = `700 ${h * 0.78}px ${MONO_FONT}`;
  c.fillText(String(floor), w / 2, h * 0.54);
};

export const Lift: React.FC<{open: number; floor: number; fogIn: number}> = ({open, floor, fogIn}) => {
  const lam = useTex(512, 1024, drawLaminate, 'lift-laminate');
  const panel = useTex(300, 1000, drawPanel(floor >= 100), `lift-panel-${floor >= 100}`);
  const note = useTex(400, 240, drawNote, 'lift-note');
  const disp = useTex(192, 64, drawDisplay(floor), `lift-display-${floor}`);
  const sign = useTex(256, 256, drawPlate(['100'], {bg: '#d8d3c6', fg: '#3b4a3e', border: '#d8d3c6'}), 'lift-100');
  const stairs = useTex(512, 128, drawPlate(['ЛЕСТНИЦА →'], {bg: '#2f6d4a', fg: '#ffffff', border: '#e9e6dc'}), 'lift-stairs');
  const WALL: Mat = {color: '#ffffff', rough: 0.6, map: lam, env: 0.5};
  const slide = 0.42 * open;
  return (
    <group>
      {/* the cabin */}
      <Box size={[0.04, 2.1, 1.48]} position={L([-0.57, 1.05, 0])} m={WALL} />
      <Box size={[0.04, 2.1, 1.48]} position={L([0.57, 1.05, 0])} m={WALL} />
      <Box size={[1.1, 2.1, 0.04]} position={L([0, 1.05, -0.72])} m={WALL} />
      <Box size={[0.15, 2.1, 0.04]} position={L([-0.475, 1.05, 0.72])} m={STEEL} />
      <Box size={[0.15, 2.1, 0.04]} position={L([0.475, 1.05, 0.72])} m={STEEL} />
      <Box size={[0.8, 0.1, 0.04]} position={L([0, 2.05, 0.72])} m={STEEL} />
      <Box size={[1.18, 0.04, 1.48]} position={L([0, -0.02, 0])} m={FLOOR} />
      <Box size={[1.18, 0.04, 1.48]} position={L([0, 2.12, 0])} m={CEIL} />
      <Glow size={[0.6, 0.02, 0.36]} position={L([0, 2.088, -0.1])} color="#e9f1f4" />
      {/* a steel handrail on the back wall */}
      <Box size={[0.9, 0.04, 0.04]} position={L([0, 0.95, -0.62])} m={STEEL} />
      <Box size={[0.03, 0.03, 0.08]} position={L([-0.4, 0.95, -0.66])} m={STEEL} shadow={false} />
      <Box size={[0.03, 0.03, 0.08]} position={L([0.4, 0.95, -0.66])} m={STEEL} shadow={false} />
      {/* the button panel on the right wall, the note above it */}
      <Box size={[0.02, 1.04, 0.34]} position={L([0.54, 1.15, 0.42])} m={STEEL} />
      <mesh position={L([0.526, 1.15, 0.42])} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.3, 1.0]} />
        <meshStandardMaterial map={panel} roughness={0.5} metalness={0.2} emissiveMap={panel} emissive="#ffffff" emissiveIntensity={0.12} />
      </mesh>
      <mesh position={L([0.546, 1.82, 0.4])} rotation={[0.04, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.3, 0.18]} />
        <meshStandardMaterial map={note} roughness={0.9} />
      </mesh>
      {/* the floor display over the doors */}
      <Box size={[0.26, 0.09, 0.02]} position={L([0, 2.045, 0.69])} m={DARK} shadow={false} />
      <mesh position={L([0, 2.045, 0.676])} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.22, 0.072]} />
        <meshBasicMaterial map={disp} toneMapped={false} />
      </mesh>
      {/* the doors slide apart behind the front panels */}
      <Box size={[0.4, 2.0, 0.02]} position={L([-0.2 - slide, 1.0, 0.76])} m={STEEL} />
      <Box size={[0.4, 2.0, 0.02]} position={L([0.2 + slide, 1.0, 0.76])} m={STEEL} />
      {/* the landing of floor 100 */}
      <Box size={[4.0, 0.04, 3.3]} position={L([0, -0.02, 2.39])} m={{color: '#6d6458', rough: 0.95}} />
      <Box size={[0.8, 0.012, 0.06]} position={L([0, 0.006, 0.76])} m={STEEL} shadow={false} />
      <PaintedWall x0={-2.0} x1={-0.42} z={0.88} pos={LIFT} y1={2.6} />
      <PaintedWall x0={0.42} x1={2.0} z={0.88} pos={LIFT} y1={2.6} />
      <Box size={[0.84, 0.55, 0.2]} position={L([0, 2.325, 0.88])} m={PAINT_SIDE} />
      <PaintedWall x0={-2.0} x1={2.0} z={3.3} pos={LIFT} y1={2.6} />
      <Box size={[0.2, 2.6, 2.32]} position={L([-2.1, 1.3, 2.14])} m={PAINT_SIDE} />
      <Box size={[0.2, 2.6, 2.32]} position={L([2.1, 1.3, 2.14])} m={PAINT_SIDE} />
      <Box size={[4.4, 0.1, 2.72]} position={L([0, 2.65, 2.34])} m={CEIL} />
      <Glow size={[0.5, 0.03, 0.16]} position={L([0.6, 2.584, 2.4])} color="#dfe8e2" power={0.85} />
      <mesh position={L([-0.55, 1.95, 3.186])} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshStandardMaterial map={sign} roughness={0.9} />
      </mesh>
      <mesh position={L([0.9, 1.75, 3.186])} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.8, 0.2]} />
        <meshStandardMaterial map={stairs} roughness={0.8} />
      </mesh>
      {/* the fog lying on the landing floor, creeping into the cabin once the doors open */}
      {[0.12, 0.3, 0.5].map((y, i) => (
        <mesh key={y} position={L([0, y, 2.3])} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.0, 3.0]} />
          <meshBasicMaterial color="#d6dcda" transparent opacity={0.22 - i * 0.05} depthWrite={false} />
        </mesh>
      ))}
      {fogIn > 0.01
        ? [0.1, 0.24].map((y) => (
            <mesh key={y} position={L([0, y, 0.15])} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.08, 1.2]} />
              <meshBasicMaterial color="#d6dcda" transparent opacity={0.2 * fogIn} depthWrite={false} />
            </mesh>
          ))
        : null}
    </group>
  );
};

export const LIFT_PANEL: V3 = L([0.526, 1.15, 0.42]);
