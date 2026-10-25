import React from 'react';
import {random} from 'remotion';
import {DoubleSide, Shape, ShapeGeometry} from 'three';
import {V3, lerp, ramp} from '../cues';
import {Box, Cyl, DARK_STEEL, Glow, Mat, RUBBER, STEEL} from '../parts';
import {Gleb, GloveHand, SOLDIER_LOOK} from '../Gleb';
import {RecorderScreen, useScreen} from '../screens';

// The staff tent of the cordon: canvas walls, a folding table, a bare lamp, the map with the red circle.
export const TENT_X = 700;
const CANVAS: Mat = {color: '#4d5349', rough: 1};
const TABLE_Y = 0.74;
export const TABLE_TOP = TABLE_Y + 0.02;
export const RECORDER3: V3 = [TENT_X + 0.42, TABLE_TOP, 0.32];
export const NOTEPAD: V3 = [TENT_X - 0.05, TABLE_TOP + 0.004, -0.22];
const BLACK_GLOVE: Mat = {color: '#141618', rough: 0.6};

// ---------------------------------------------------------------- map and notepad

const MapSheet: React.FC<{position: V3; rotation: number}> = ({position, rotation}) => {
  const tex = useScreen(
    512,
    360,
    (c) => {
      c.fillStyle = '#c9cbbf';
      c.fillRect(0, 0, 512, 360);
      c.strokeStyle = '#8f9488';
      c.lineWidth = 9;
      [70, 180, 300, 420].forEach((x) => {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x + 20, 360);
        c.stroke();
      });
      [60, 170, 290].forEach((y) => {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(512, y - 15);
        c.stroke();
      });
      c.fillStyle = '#a3a79a';
      for (let i = 0; i < 18; i++) c.fillRect(random(`map-x-${i}`) * 470, random(`map-y-${i}`) * 330, 26 + random(`map-w-${i}`) * 30, 18 + random(`map-h-${i}`) * 26);
      c.fillStyle = '#6f746a';
      c.fillRect(210, 130, 60, 34);
      c.fillRect(214, 196, 52, 30);
      c.strokeStyle = '#d0302a';
      c.lineWidth = 6;
      c.beginPath();
      c.ellipse(240, 178, 92, 80, 0.2, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = '#5d6158';
      c.font = "500 18px 'IBM Plex Mono'";
      c.fillText('КВ. 14', 30, 340);
    },
    'map',
  );
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, rotation]} receiveShadow>
      <planeGeometry args={[0.6, 0.42]} />
      <meshStandardMaterial map={tex} roughness={0.95} />
    </mesh>
  );
};

// the "2": an arc, a diagonal and a base line, in glyph units (x right, y down)
const TWO_PATH: [number, number][] = (() => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 26; i++) {
    const a = ((-200 + (230 * i) / 26) * Math.PI) / 180;
    pts.push([0.5 + 0.34 * Math.cos(a), 0.33 + 0.3 * Math.sin(a)]);
  }
  const e = pts[pts.length - 1];
  for (let i = 1; i <= 12; i++) pts.push([lerp(e[0], 0.06, i / 12), lerp(e[1], 1, i / 12)]);
  for (let i = 1; i <= 10; i++) pts.push([lerp(0.06, 0.96, i / 10), 1 + 0.02 * Math.sin(i)]);
  return pts;
})();

const PW = 512;
const PH = 720;
const ROW = (r: number): [number, number] => [92 + (random(`two-x-${r}`) - 0.5) * 26, 48 + r * 60];
const GLYPH: [number, number] = [40, 46];
const PAGE: [number, number] = [0.15, 0.21];

const drawTwo = (c: CanvasRenderingContext2D, r: number, k: number) => {
  const [ox, oy] = ROW(r);
  const n = Math.floor(k * (TWO_PATH.length - 1)) + 1;
  c.beginPath();
  TWO_PATH.slice(0, n).forEach(([x, y], i) => {
    const px = ox + x * GLYPH[0] + (random(`two-j-${r}`) - 0.5) * 4 * y;
    const py = oy + y * GLYPH[1];
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  });
  c.stroke();
};

// where the pen tip is, in page canvas pixels
const tipPx = (r: number, k: number): [number, number] => {
  const [ox, oy] = ROW(r);
  const f = k * (TWO_PATH.length - 1);
  const i = Math.min(TWO_PATH.length - 2, Math.floor(f));
  const a = TWO_PATH[i];
  const b = TWO_PATH[i + 1];
  const t = f - i;
  return [ox + lerp(a[0], b[0], t) * GLYPH[0], oy + lerp(a[1], b[1], t) * GLYPH[1]];
};

// rows: how many twos are already there; the new ones are written over [start, start + 0.6]
export const OLD_TWOS = 9;
const writeK = (v: number, starts: number[]) => starts.map((s) => ramp(v, s, s + 0.6));

const Notepad: React.FC<{v: number; starts: number[]}> = ({v, starts}) => {
  const ks = writeK(v, starts);
  const tex = useScreen(
    PW,
    PH,
    (c) => {
      c.fillStyle = '#d6d8d0';
      c.fillRect(0, 0, PW, PH);
      c.strokeStyle = '#a8b2b8';
      c.lineWidth = 2;
      for (let y = 40; y < PH; y += 30) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(PW, y);
        c.stroke();
      }
      c.strokeStyle = '#c27a74';
      c.beginPath();
      c.moveTo(60, 0);
      c.lineTo(60, PH);
      c.stroke();
      c.strokeStyle = '#22272d';
      c.lineWidth = 5;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      for (let r = 0; r < OLD_TWOS; r++) drawTwo(c, r, 1);
      ks.forEach((k, i) => (k > 0 ? drawTwo(c, OLD_TWOS + i, k) : null));
    },
    ks.map((k) => Math.round(k * 48)).join('-'),
  );
  return (
    <group position={NOTEPAD}>
      <Box size={[PAGE[0] + 0.01, 0.008, PAGE[1] + 0.012]} position={[0, -0.002, 0]} m={{color: '#2b3034', rough: 0.8}} />
      <mesh position={[0, 0.0025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={PAGE} />
        <meshStandardMaterial map={tex} roughness={0.92} />
      </mesh>
      {Array.from({length: 7}).map((_, i) => (
        <Cyl key={i} r={0.004} h={0.012} seg={6} position={[-0.06 + i * 0.02, 0.004, -PAGE[1] / 2 - 0.002]} rotation={[0, 0, Math.PI / 2]} m={STEEL} shadow={false} />
      ))}
    </group>
  );
};

// the black glove with the pen, its tip on the page
const PenHand: React.FC<{v: number; starts: number[]}> = ({v, starts}) => {
  const ks = writeK(v, starts);
  let row = OLD_TWOS;
  let k = 0;
  let lift = 0.012;
  ks.forEach((kk, i) => {
    if (v >= starts[i] - 0.4) {
      row = OLD_TWOS + i;
      k = kk;
      lift = kk > 0 && kk < 1 ? 0 : 0.012;
    }
  });
  const [px, py] = tipPx(row, k);
  const tip: V3 = [NOTEPAD[0] + (px / PW) * PAGE[0] - PAGE[0] / 2, NOTEPAD[1] + 0.003 + lift, NOTEPAD[2] + (py / PH) * PAGE[1] - PAGE[1] / 2];
  return (
    <group position={tip} rotation={[0.55, 0, -0.5]}>
      <Cyl r={0.0045} r2={0.0015} h={0.012} seg={8} position={[0, 0.006, 0]} m={DARK_STEEL} shadow={false} />
      <Cyl r={0.005} h={0.13} seg={8} position={[0, 0.077, 0]} m={{color: '#1c2b44', rough: 0.4, metal: 0.3}} />
      <GloveHand position={[0.012, 0.19, 0.006]} rotation={[0, -1.4, 0.15]} curl={0.55} spread={0.05} glove={BLACK_GLOVE} sleeveM={SOLDIER_LOOK.coat} />
    </group>
  );
};

// ---------------------------------------------------------------- the tent

const FieldRadio: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <Box size={[0.36, 0.2, 0.24]} position={[0, 0.1, 0]} m={{color: '#363c35', rough: 0.7, metal: 0.2}} />
    <Box size={[0.3, 0.12, 0.004]} position={[0, 0.11, 0.121]} m={{color: '#1d211d', rough: 0.6}} shadow={false} />
    {[-0.1, -0.03, 0.04].map((x) => (
      <Cyl key={x} r={0.012} h={0.02} seg={8} position={[x, 0.09, 0.13]} rotation={[Math.PI / 2, 0, 0]} m={STEEL} shadow={false} />
    ))}
    <Glow size={[0.012, 0.012, 0.004]} position={[0.11, 0.15, 0.124]} color="#ff4a3d" power={0.9} />
    <Cyl r={0.006} h={0.6} seg={5} position={[0.14, 0.5, -0.08]} m={RUBBER} />
  </group>
);

const Recorder: React.FC<{v: number}> = ({v}) => (
  <group position={RECORDER3} rotation={[0, 0.35, 0]}>
    <Box size={[0.075, 0.022, 0.14]} position={[0, 0.011, 0]} m={{color: '#2b3035', rough: 0.45, metal: 0.2}} />
    <RecorderScreen v={v} size={[0.058, 0.029]} position={[0, 0.0226, -0.025]} rotation={[-Math.PI / 2, 0, 0]} />
    <Cyl r={0.009} h={0.006} seg={10} position={[0, 0.024, 0.03]} m={{color: '#c0392b', rough: 0.5}} shadow={false} />
    {Array.from({length: 12}).map((_, i) => (
      <Box key={i} size={[0.003, 0.002, 0.03]} position={[-0.025 + i * 0.0045, 0.0225, 0.055]} m={RUBBER} shadow={false} />
    ))}
  </group>
);

const Chair: React.FC<{position: V3; rotation: number}> = ({position, rotation}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[0.44, 0.04, 0.42]} position={[0, 0.45, 0]} m={DARK_STEEL} />
    <Box size={[0.44, 0.36, 0.03]} position={[0, 0.7, -0.2]} m={DARK_STEEL} />
    {[[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]].map(([x, z]) => (
      <Box key={`${x}${z}`} size={[0.025, 0.45, 0.025]} position={[x, 0.225, z]} m={STEEL} shadow={false} />
    ))}
  </group>
);

const GABLE = (() => {
  const sh = new Shape();
  sh.moveTo(-3, 0);
  sh.lineTo(3, 0);
  sh.lineTo(0, 0.93);
  sh.closePath();
  return new ShapeGeometry(sh);
})();

const SEATED = {legL: 1.45, legR: 1.4, stoop: 0.12};

export const Tent: React.FC<{v: number; writes: number[]; closeup: boolean}> = ({v, writes, closeup}) => {
  const sway = Math.sin(v * 1.7) * 0.02 + Math.sin(v * 0.6) * 0.015;
  return (
    <group>
      <group position={[TENT_X, 0, 0]}>
        <Box size={[7, 0.1, 6]} position={[0, -0.05, 0]} m={{color: '#2c302b', rough: 1}} />
        {/* walls and the sloping roof; the canvas breathes in the wind */}
        <Box size={[7, 1.9, 0.05]} position={[0, 0.95, -3]} rotation={[sway, 0, 0]} m={CANVAS} />
        <Box size={[7, 1.9, 0.05]} position={[0, 0.95, 3]} rotation={[-sway, 0, 0]} m={CANVAS} />
        <Box size={[0.05, 1.9, 6]} position={[-3.5, 0.95, 0]} m={CANVAS} />
        <Box size={[0.05, 1.9, 6]} position={[3.5, 0.95, 0]} m={CANVAS} />
        <Box size={[7, 0.05, 3.25]} position={[0, 2.35, -1.5]} rotation={[-0.3 + sway * 0.5, 0, 0]} m={CANVAS} />
        <Box size={[7, 0.05, 3.25]} position={[0, 2.35, 1.5]} rotation={[0.3 - sway * 0.5, 0, 0]} m={CANVAS} />
        <Cyl r={0.04} h={2.8} seg={6} position={[0, 1.4, -2.6]} m={DARK_STEEL} />
        {/* gable triangles */}
        {[-3.49, 3.49].map((x) => (
          <mesh key={x} position={[x, 1.9, 0]} rotation={[0, Math.PI / 2, 0]} geometry={GABLE}>
            <meshStandardMaterial color={CANVAS.color} roughness={1} side={DoubleSide} flatShading />
          </mesh>
        ))}
        {/* folding table */}
        <Box size={[1.6, 0.04, 0.9]} position={[0, TABLE_Y, 0]} m={{color: '#4b4f50', rough: 0.7, metal: 0.2}} />
        {[[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]].map(([x, z]) => (
          <Box key={`${x}${z}`} size={[0.03, TABLE_Y, 0.03]} position={[x, TABLE_Y / 2, z]} m={STEEL} shadow={false} />
        ))}
        <FieldRadio position={[-0.58, TABLE_TOP, -0.15]} />
        <Chair position={[0.05, 0, 0.78]} rotation={Math.PI} />
        <Chair position={[-0.05, 0, -0.78]} rotation={0} />
        {/* the bare lamp */}
        <Cyl r={0.004} h={0.9} seg={4} position={[0, 2.35, 0]} m={RUBBER} shadow={false} />
        <Cyl r={0.03} h={0.05} seg={8} position={[0, 1.88, 0]} m={DARK_STEEL} shadow={false} />
        <mesh position={[0, 1.82, 0]}>
          <sphereGeometry args={[0.04, 10, 8]} />
          <meshBasicMaterial color="#f1f3ef" toneMapped={false} />
        </mesh>
        <pointLight position={[0, 1.78, 0]} color="#e4e8e2" intensity={2.6} distance={7} decay={2} castShadow shadow-mapSize={[512, 512]} shadow-bias={-0.002} />
        <hemisphereLight color="#4d5560" groundColor="#121417" intensity={0.12} />
      </group>
      <MapSheet position={[TENT_X - 0.25, TABLE_TOP + 0.002, 0.08]} rotation={0.12} />
      <Notepad v={v} starts={writes} />
      <Recorder v={v} />
      {closeup ? (
        <PenHand v={v} starts={writes} />
      ) : (
        <>
          {/* Gleb with his back to us, the man in the mask facing him */}
          <Gleb position={[TENT_X + 0.05, -0.46, 0.83]} rotation={Math.PI} pose={{...SEATED, armL: [0.85, 0.1], armR: [0.9, -0.1], elbowL: 0.75, elbowR: 0.8, head: [0.15, 0.05]}} />
          <Gleb
            position={[TENT_X - 0.05, -0.46, -0.83]}
            rotation={0}
            look={SOLDIER_LOOK}
            pose={{...SEATED, armL: [0.8, 0.12], armR: [0.95, -0.25], elbowL: 0.8, elbowR: 0.85, head: [0.12 + 0.05 * Math.sin(v * 0.9), 0.04 * Math.sin(v * 0.5)]}}
          />
        </>
      )}
    </group>
  );
};
