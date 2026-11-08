import React from 'react';
import * as THREE from 'three';
import {Ball, Block, Cyl, Glow, Pill, RBox, Ring, mat} from '../bear/kit';
import {Pic} from '../bear/Props';
import {COND} from '../gta/tex';
import {Fence, Sign} from './Town';
import {V3, clamp01, lerp} from '../bear/cues';

// Тихая, 9: a two-storey house with a real inside. Local frame: origin at the ground under the middle,
// front (+z) to the street. Ground floor 0.3..3.0, upper floor slab top at 3.1, eaves 5.6, ridge 7.6.
// One door in the middle of the front. Upstairs: the room with the radio; the stairs go up along the left wall
// to a hatch at the back-left; the back window over the shed roof is the way out.

export const W = 7.2; // x
export const D = 6.0; // z
export const T = 0.2; // walls
export const F1 = 0.3; // ground floor level
export const F2 = 3.1; // upper floor level
export const EAVES = 5.6;
const RIDGE = 7.6;
export const FRONT = D / 2; // outer face of the front wall
export const BACK = -D / 2;
export const DOOR: [number, number] = [-0.5, 0.5]; // x range of the door
export const DOOR_H = 2.1;
export const SLIT: V3 = [0, 4.45, FRONT - T / 2]; // the gap in the boards of the upstairs front window
export const UPWIN: [number, number, number, number] = [-0.6, 0.6, 3.85, 5.05]; // x0 x1 y0 y1
export const BACKWIN: [number, number, number, number] = [1.2, 2.4, 3.7, 4.9];
export const HATCH: [number, number, number, number] = [-3.3, -2.3, -2.7, -0.9]; // x0 x1 z0 z1 in the upper floor
export const RADIO: V3 = [1.9, F2 + 0.78, -1.9]; // on the desk, back-right
export const WALL_TEXT: {pos: V3; rot: V3; size: [number, number]} = {pos: [W / 2 - T - 0.011, F2 + 1.35, 0.2], rot: [0, -Math.PI / 2, 0], size: [3.6, 1.5]};

const WALL = '#b5a48c';
const INNER = '#9c9486';
const WOOD = '#8a6a48';
const PLANK = '#9a7a52';

type Hole = [number, number, number, number]; // x0 x1 y0 y1 (wall-local x, world y)

// a wall along x (thickness along z), spanning x0..x1 and y0..y1, with rectangular holes (distinct x ranges)
const WallX: React.FC<{z: number; x0: number; x1: number; y0: number; y1: number; holes?: Hole[]; color?: string; inner?: string}> = ({z, x0, x1, y0, y1, holes = [], color = WALL}) => {
  const hs = [...holes].sort((a, b) => a[0] - b[0]);
  const parts: [number, number, number, number][] = [];
  let x = x0;
  for (const h of hs) {
    if (h[0] > x) parts.push([x, h[0], y0, y1]);
    if (h[2] > y0) parts.push([h[0], h[1], y0, h[2]]);
    if (h[3] < y1) parts.push([h[0], h[1], h[3], y1]);
    x = h[1];
  }
  if (x < x1) parts.push([x, x1, y0, y1]);
  return (
    <group>
      {parts.map(([a, b, c, d], i) => (
        <Block key={i} position={[(a + b) / 2, (c + d) / 2, z]} size={[b - a, d - c, T]} color={color} look={{rough: 0.95}} />
      ))}
    </group>
  );
};
// the same along z (for the side walls), x fixed; holes in z
const WallZ: React.FC<{x: number; z0: number; z1: number; y0: number; y1: number; holes?: Hole[]; color?: string}> = ({x, z0, z1, y0, y1, holes = [], color = WALL}) => (
  <group position={[x, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
    <WallX z={0} x0={z0} x1={z1} y0={y0} y1={y1} holes={holes} color={color} />
  </group>
);

const gableShape = (d: number, h: number) => {
  const s = new THREE.Shape();
  s.moveTo(-d / 2, 0);
  s.lineTo(d / 2, 0);
  s.lineTo(0, h);
  s.lineTo(-d / 2, 0);
  return s;
};

// a window frame in a hole of a front/back wall (facing +z); glass dark
const Frame: React.FC<{h: Hole; z: number; flip?: boolean; open?: number}> = ({h, z, flip, open = 0}) => {
  const [x0, x1, y0, y1] = h;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const w = x1 - x0;
  const hh = y1 - y0;
  return (
    <group position={[cx, cy, z]} rotation={[0, flip ? Math.PI : 0, 0]}>
      {/* the frame bars sit inside the hole */}
      <Block position={[0, hh / 2 - 0.03, 0]} size={[w, 0.06, 0.12]} color="#d8d2c4" />
      <Block position={[0, -hh / 2 + 0.03, 0]} size={[w, 0.06, 0.12]} color="#d8d2c4" />
      <Block position={[-w / 2 + 0.03, 0, 0]} size={[0.06, hh - 0.12, 0.12]} color="#d8d2c4" />
      <Block position={[w / 2 - 0.03, 0, 0]} size={[0.06, hh - 0.12, 0.12]} color="#d8d2c4" />
      {/* sash (swings in when open) */}
      <group position={[w / 2 - 0.06, 0, -0.03]} rotation={[0, -open * 1.6, 0]}>
        <mesh position={[-(w - 0.12) / 2, 0, 0]} material={mat('#1a2230', {opacity: 0.55, rough: 0.08, metal: 0.3, side: THREE.DoubleSide})}>
          <planeGeometry args={[w - 0.12, hh - 0.12]} />
        </mesh>
        <Block position={[-(w - 0.12) / 2, 0, 0.0]} size={[0.04, hh - 0.12, 0.04]} color="#d8d2c4" shadow={false} />
      </group>
      {/* sill outside */}
      <Block position={[0, -hh / 2 - 0.04, 0.14]} size={[w + 0.2, 0.06, 0.16]} color="#c8c2b4" />
    </group>
  );
};

// boards nailed over a hole, on the outside (z > 0 side of the local frame); slit leaves a gap at height gapY
const Boards: React.FC<{h: Hole; z: number; n?: number; gap?: number; k?: number; inside?: boolean}> = ({h, z, n = 3, gap, k = 1, inside}) => {
  const [x0, x1, y0, y1] = h;
  const w = x1 - x0 + 0.3;
  const ys: number[] = [];
  if (gap !== undefined) {
    // boards cover the whole hole except a 7 cm slit at gap
    const bh = 0.2;
    for (let y = y0 + bh / 2 - 0.05; y < y1 + 0.05; y += bh + 0.01) if (Math.abs(y - gap) > bh / 2 + 0.035) ys.push(y);
  } else for (let i = 0; i < n; i++) ys.push(y0 + ((i + 0.5) / n) * (y1 - y0));
  const shown = Math.round(ys.length * clamp01(k));
  return (
    <group>
      {ys.slice(0, shown).map((y, i) => (
        <group key={i} position={[(x0 + x1) / 2, y, z + (inside ? -1 : 1) * (0.02 + (i % 2) * 0.012)]} rotation={[0, 0, gap !== undefined ? 0 : (i - 1) * 0.07]}>
          <Block size={[w, gap !== undefined ? 0.2 : 0.17, 0.025]} color={i % 2 ? PLANK : WOOD} />
          {([1, -1] as const).map((s) => (
            <Ball key={s} position={[s * (w / 2 - 0.08), 0, (inside ? -1 : 1) * 0.015]} scale={0.012} color="#6a6a6a" shadow={false} />
          ))}
        </group>
      ))}
    </group>
  );
};

// a hanging blanket inside a window; drawn = 0..1 (1 closed). slit: a narrow parting at the slit height
const Blanket: React.FC<{h: Hole; z: number; color: string; drawn?: number; part?: number}> = ({h, z, color, drawn = 1, part = 0}) => {
  const [x0, x1, y0, y1] = h;
  const w = x1 - x0 + 0.5;
  const hh = y1 - y0 + 0.4;
  if (drawn <= 0.01) return null;
  const half = (w / 2) * drawn;
  return (
    <group position={[(x0 + x1) / 2, (y0 + y1) / 2 + 0.05, z]}>
      <Pill position={[0, hh / 2 + 0.02, 0]} rotation={[0, 0, Math.PI / 2]} r={0.015} len={w + 0.1} color="#5a4a3a" shadow={false} />
      {([1, -1] as const).map((s) => (
        <group key={s} position={[s * (w / 2 - half / 2 + part * 0.04), 0, 0]}>
          {Array.from({length: 4}, (_, i) => (
            <RBox key={i} position={[(-half / 2 + (i + 0.5) * (half / 4)) * 1, 0, (i % 2) * 0.03 - 0.015]} size={[half / 4 + 0.02, hh, 0.03]} r={0.012} color={color} look={{rough: 1}} />
          ))}
        </group>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- props inside

// the lit dial: amber scale with ticks and the big «91.4»
const drawDial = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#e8a040';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#3a2408';
  for (let i = 0; i <= 20; i++) g.fillRect(12 + i * ((W - 24) / 20), 0, 3, i % 5 ? H * 0.16 : H * 0.28);
  g.font = `700 ${Math.round(H * 0.62)}px ${COND}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('91.4', W / 2, H * 0.62);
};
export const Radio: React.FC<{position: V3; rotation?: V3; on?: number; v?: number}> = ({position, rotation, on = 0, v = 0}) => (
  <group position={position} rotation={rotation}>
    <RBox size={[0.46, 0.22, 0.28]} r={0.02} color="#4a4e44" look={{rough: 0.6, metal: 0.2}} />
    {/* dial window */}
    {on > 0.5 ? (
      <Pic size={[0.2, 0.07]} res={[400, 140]} k="radio_dial_914" draw={drawDial} position={[-0.08, 0.03, 0.141]} />
    ) : (
      <mesh position={[-0.08, 0.03, 0.141]} material={mat('#3a3424', {basic: true})}>
        <planeGeometry args={[0.2, 0.07]} />
      </mesh>
    )}
    <Block position={[-0.163 + 0.004 * Math.sin(v * 0.2), 0.03, 0.144]} size={[0.005, 0.07, 0.002]} color="#c8281e" shadow={false} />
    {[0.12, 0.19].map((x) => (
      <Cyl key={x} position={[x, 0.02, 0.15]} rotation={[Math.PI / 2, 0, 0]} rt={0.025} rb={0.028} h={0.03} seg={16} color="#1e1e1e" />
    ))}
    <Cyl position={[-0.08, -0.065, 0.143]} rotation={[Math.PI / 2, 0, 0]} rt={0.006} rb={0.006} h={0.012} seg={10} color={on > 0.5 ? '#ff4030' : '#401a18'} look={on > 0.5 ? {basic: true} : {}} />
    {/* bare wires and a coil (home-made) */}
    <Ring position={[0.1, 0.13, -0.05]} rotation={[0, 0, 0]} r={0.05} tube={0.006} color="#c87a2a" />
    <Pill position={[-0.15, 0.4, -0.08]} rotation={[0, 0, -0.18]} r={0.004} len={0.5} color="#a0a0a0" shadow={false} />
    {on > 0.5 ? <Glow position={[-0.08, 0.03, 0.18]} size={0.22} color="#ffb24a" k={0.35} /> : null}
  </group>
);

const Can: React.FC<{position: V3; c?: string}> = ({position, c = '#b8442e'}) => (
  <group position={position}>
    <Cyl position={[0, 0.06, 0]} rt={0.045} rb={0.045} h={0.12} seg={14} color="#c8ccd0" look={{metal: 0.6, rough: 0.35}} />
    <Cyl position={[0, 0.06, 0]} rt={0.046} rb={0.046} h={0.07} seg={14} color={c} />
  </group>
);
export const Supplies: React.FC<{position: V3; rotation?: number}> = ({position, rotation = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    {/* cans in a neat pyramid */}
    {[
      [-0.2, 0],
      [-0.1, 0],
      [0, 0],
      [0.1, 0],
      [-0.15, 1],
      [-0.05, 1],
      [0.05, 1],
      [-0.1, 2],
      [0.0, 2],
    ].map(([x, l], i) => (
      <Can key={i} position={[x, l * 0.122, 0]} c={['#b8442e', '#3a6a9a', '#c89a2a'][i % 3]} />
    ))}
    {/* water bottles */}
    {[0.32, 0.44, 0.56, 0.68].map((x) => (
      <group key={x} position={[x, 0, 0]}>
        <Cyl position={[0, 0.16, 0]} rt={0.05} rb={0.05} h={0.32} seg={14} color="#9ac8e8" look={{opacity: 0.6, rough: 0.1}} />
        <Cyl position={[0, 0.34, 0]} rt={0.02} rb={0.03} h={0.05} seg={10} color="#2a6ab8" />
      </group>
    ))}
    {/* first-aid kit */}
    <group position={[0.98, 0, 0]}>
      <RBox position={[0, 0.12, 0]} size={[0.36, 0.24, 0.2]} r={0.03} color="#f2f0ea" />
      <Block position={[0, 0.12, 0.101]} size={[0.14, 0.04, 0.004]} color="#d8281e" shadow={false} />
      <Block position={[0, 0.12, 0.101]} size={[0.04, 0.14, 0.004]} color="#d8281e" shadow={false} />
    </group>
  </group>
);

const Bucket: React.FC<{position: V3; full?: number}> = ({position, full = 1}) => (
  <group position={position}>
    <Cyl position={[0, 0.17, 0]} rt={0.16} rb={0.12} h={0.34} seg={18} open color="#7a8a9a" look={{metal: 0.5, rough: 0.4, side: THREE.DoubleSide}} />
    <Cyl position={[0, 0.005, 0]} rt={0.12} rb={0.12} h={0.01} seg={18} color="#7a8a9a" />
    {full > 0.02 ? <Cyl position={[0, 0.01 + 0.3 * full, 0]} rt={0.12 + 0.035 * full} rb={0.12 + 0.035 * full} h={0.004} seg={18} color="#5a7a9a" look={{rough: 0.1, metal: 0.3}} /> : null}
  </group>
);

// a map pinned to the wall: a canvas with roads
const drawMap = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#e8dfc4';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#c8b890';
  g.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    g.beginPath();
    g.moveTo(0, (i * H) / 12);
    g.lineTo(W, (i * H) / 12);
    g.stroke();
    g.beginPath();
    g.moveTo((i * W) / 12, 0);
    g.lineTo((i * W) / 12, H);
    g.stroke();
  }
  g.strokeStyle = '#b8442e';
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(W * 0.1, H * 0.9);
  g.bezierCurveTo(W * 0.4, H * 0.7, W * 0.3, H * 0.4, W * 0.55, H * 0.12);
  g.stroke();
  g.strokeStyle = '#4a6a9a';
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(W * 0.8, H);
  g.bezierCurveTo(W * 0.7, H * 0.6, W * 0.95, H * 0.3, W * 0.75, 0);
  g.stroke();
  g.fillStyle = '#c8281e';
  g.beginPath();
  g.arc(W * 0.55, H * 0.12, 12, 0, Math.PI * 2);
  g.fill();
  g.font = `600 ${Math.round(H * 0.07)}px ${COND}`;
  g.fillText('С', W * 0.6, H * 0.1);
};

// the big letters written on the wall with a marker; k = how much is written (0..1)
export const drawWall = (k: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.clearRect(0, 0, W, H);
  const lines = ['СОНЯ, ТЕБЯ ИЩУТ', 'ЛАГЕРЬ · 40 КМ', 'НА СЕВЕР ↑'];
  const total = lines.reduce((a, l) => a + l.length, 0);
  let left = Math.round(total * k);
  g.fillStyle = '#16181c';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  lines.forEach((l, i) => {
    const n = Math.max(0, Math.min(l.length, left));
    left -= n;
    const size = i === 0 ? H * 0.26 : H * 0.2;
    g.font = `700 ${Math.round(size)}px ${COND}`;
    const full = g.measureText(l).width;
    const x0 = (W - full) / 2;
    g.save();
    g.translate(0, (i - 1) * H * 0.3 + H * 0.5);
    g.rotate(-0.02 + i * 0.012);
    g.fillText(l.slice(0, n), x0, 0);
    g.restore();
  });
};

// ---------------------------------------------------------------- the house

export type HouseState = {
  doorBoards?: number; // 0..1 boards across the door inside
  wardrobe?: number; // 0 against the side wall .. 1 pushed against the door
  stairs?: number; // 1 whole .. 0 taken apart
  ladder?: number; // 0 rolled up in the hatch .. 1 hanging down
  blankets?: number; // 0..1 hung
  upBoards?: number; // 0..1 boards on the upstairs front window
  tub?: number; // water level 0..1
  buckets?: number; // 0..1 filled
  thread?: number; // 0..1 the thread is stretched from the door to the stairs hatch
  radio?: number; // on
  wall?: number; // writing on the wall 0..1
  backOpen?: number; // the back window open 0..1
  v?: number;
  lit?: boolean; // the porch light (off after they arrive)
  noRoof?: boolean; // for top-down cutaway shots
  noFront?: boolean; // hide the front wall upstairs (for shots from the street side into the room)
};

export const House: React.FC<{position?: V3; s?: HouseState}> = ({position = [0, 0, 0], s = {}}) => {
  const v = s.v ?? 0;
  const ground: Hole[] = [
    [DOOR[0], DOOR[1], F1, F1 + DOOR_H],
    [-2.8, -1.6, 1.1, 2.3],
    [1.6, 2.8, 1.1, 2.3],
  ];
  const upFront: Hole[] = [
    [-2.8, -1.8, 3.85, 4.95],
    [UPWIN[0], UPWIN[1], UPWIN[2], UPWIN[3]],
    [1.8, 2.8, 3.85, 4.95],
  ];
  const upBack: Hole[] = [[BACKWIN[0], BACKWIN[1], BACKWIN[2], BACKWIN[3]]];
  const stairsK = s.stairs ?? 1;
  const ladder = s.ladder ?? 0;
  return (
    <group position={position}>
      {/* plinth + floors */}
      <Block position={[0, F1 / 2, 0]} size={[W, F1, D]} color="#6a6460" />
      <Block position={[0, F1 + 0.006, 0]} size={[W - 2 * T - 0.02, 0.012, D - 2 * T - 0.02]} color="#7a5a3e" look={{rough: 0.9}} />
      {/* upper floor slab with the hatch hole */}
      {(() => {
        const [hx0, hx1, hz0, hz1] = HATCH;
        const y = F2 - 0.1;
        const x0 = -W / 2 + T;
        const x1 = W / 2 - T;
        const z0 = -D / 2 + T;
        const z1 = D / 2 - T;
        const parts: [number, number, number, number][] = [
          [hx1, x1, z0, z1],
          [x0, hx0, z0, z1],
          [hx0, hx1, z0, hz0],
          [hx0, hx1, hz1, z1],
        ];
        return parts.map(([a, b, c, d], i) => <Block key={i} position={[(a + b) / 2, y, (c + d) / 2]} size={[b - a, 0.2, d - c]} color={i % 2 ? '#7a5a3e' : '#76583c'} look={{rough: 0.9}} />);
      })()}
      {/* ground floor walls */}
      <WallX z={FRONT - T / 2} x0={-W / 2} x1={W / 2} y0={F1} y1={F2} holes={ground} />
      <WallX z={BACK + T / 2} x0={-W / 2} x1={W / 2} y0={F1} y1={F2} />
      <WallZ x={-W / 2 + T / 2} z0={-D / 2 + T} z1={D / 2 - T} y0={F1} y1={F2} />
      <WallZ x={W / 2 - T / 2} z0={-D / 2 + T} z1={D / 2 - T} y0={F1} y1={F2} />
      {/* upper floor walls */}
      {s.noFront ? null : <WallX z={FRONT - T / 2} x0={-W / 2} x1={W / 2} y0={F2} y1={EAVES} holes={upFront} />}
      <WallX z={BACK + T / 2} x0={-W / 2} x1={W / 2} y0={F2} y1={EAVES} holes={upBack} />
      <WallZ x={-W / 2 + T / 2} z0={-D / 2 + T} z1={D / 2 - T} y0={F2} y1={EAVES} color={WALL} />
      <WallZ x={W / 2 - T / 2} z0={-D / 2 + T} z1={D / 2 - T} y0={F2} y1={EAVES} color={WALL} />
      {/* inner wall faces a bit darker: thin panels 1 cm inside */}
      {[
        [-W / 2 + T + 0.006, Math.PI / 2],
        [W / 2 - T - 0.006, -Math.PI / 2],
      ].map(([x, r], i) => (
        <mesh key={i} position={[x, (F2 + EAVES) / 2, 0]} rotation={[0, r, 0]} material={mat(INNER, {rough: 0.95})} receiveShadow>
          <planeGeometry args={[D - 2 * T - 0.02, EAVES - F2 - 0.02]} />
        </mesh>
      ))}
      {/* ceiling of the upper room */}
      <Block position={[0, EAVES + 0.05, 0]} size={[W - 0.02, 0.1, D - 0.02]} color="#8a8070" />
      {/* roof + gables */}
      {s.noRoof ? null : (
        <group>
          {([1, -1] as const).map((k) => (
            <Block key={k} position={[0, EAVES + (RIDGE - EAVES) / 2 + 0.05, (k * D) / 4]} rotation={[k * Math.atan2(RIDGE - EAVES, D / 2), 0, 0]} size={[W + 0.5, 0.18, Math.hypot(RIDGE - EAVES, D / 2) + 0.4]} color="#4a3430" look={{rough: 0.85}} />
          ))}
          {([1, -1] as const).map((k) => (
            <mesh key={k} position={[(k * W) / 2, EAVES, 0]} rotation={[0, (k * Math.PI) / 2, 0]} material={mat(WALL, {rough: 0.95})} castShadow>
              <shapeGeometry args={[gableShape(D, RIDGE - EAVES)]} />
            </mesh>
          ))}
          <Block position={[W * 0.28, RIDGE - 0.3, -D * 0.12]} size={[0.5, 1.4, 0.5]} color="#5a4a44" />
        </group>
      )}
      {/* window frames */}
      {ground.slice(1).map((h, i) => (
        <Frame key={'gf' + i} h={h} z={FRONT - T / 2} />
      ))}
      {upFront.map((h, i) => (s.noFront ? null : <Frame key={'uf' + i} h={h} z={FRONT - T / 2} />))}
      <Frame h={upBack[0]} z={BACK + T / 2} flip open={s.backOpen ?? 0} />
      {/* ground windows boarded from outside (before they came) */}
      {ground.slice(1).map((h, i) => (
        <Boards key={'gb' + i} h={h} z={FRONT} n={3} />
      ))}
      {/* upstairs front window: boards with the slit, nailed inside */}
      {s.noFront ? null : <Boards h={upFront[1]} z={FRONT - T - 0.02} gap={SLIT[1]} k={s.upBoards ?? 0} inside />}
      {/* blankets over all upstairs windows */}
      {s.noFront ? null : (
        <>
          <Blanket h={upFront[0]} z={FRONT - T - 0.1} color="#7a3a3a" drawn={s.blankets ?? 0} />
          <Blanket h={upFront[2]} z={FRONT - T - 0.1} color="#3a5a7a" drawn={s.blankets ?? 0} />
          <Blanket h={upFront[1]} z={FRONT - T - 0.12} color="#6a6a3a" drawn={(s.blankets ?? 0) * 0.82} part={1} />
        </>
      )}
      {/* the front door + porch */}
      <group position={[0, F1, FRONT - T / 2]}>
        <Block position={[0, DOOR_H / 2, 0]} size={[DOOR[1] - DOOR[0] - 0.02, DOOR_H - 0.01, 0.06]} color="#4a3428" />
        <Ball position={[0.36, 1.0, 0.05]} scale={0.03} color="#c8a050" look={{metal: 0.7, rough: 0.3}} />
        <Ball position={[0.36, 1.0, -0.05]} scale={0.03} color="#c8a050" look={{metal: 0.7, rough: 0.3}} />
        <Block position={[0, DOOR_H + 0.04, 0]} size={[1.2, 0.1, T + 0.04]} color="#d8d2c4" />
      </group>
      <Block position={[0, 0.12, FRONT + 0.75]} size={[2.0, 0.24, 1.5]} color="#6a6460" />
      <Sign text="ТИХАЯ, 9" position={[1.0, 2.85, FRONT + 0.012]} size={[0.9, 0.3]} bg="#1f4a8a" fg="#ffffff" glow={0.4} />
      {s.lit ? (
        <>
          <mesh position={[0, F1 + DOOR_H + 0.35, FRONT + 0.06]} material={mat('#ffe2a8', {basic: true})}>
            <sphereGeometry args={[0.07, 14, 10]} />
          </mesh>
          <Glow position={[0, F1 + DOOR_H + 0.35, FRONT + 0.12]} size={1.4} color="#ffd28a" k={0.6} fog />
        </>
      ) : null}
      {/* inside, ground floor: boards across the door, the wardrobe */}
      <Boards h={[DOOR[0], DOOR[1], F1, F1 + DOOR_H]} z={FRONT - T - 0.03} n={3} k={s.doorBoards ?? 0} inside />
      <Wardrobe position={[lerp(-1.9, 0, s.wardrobe ?? 0), F1, lerp(FRONT - T - 0.36, FRONT - T - 0.36, s.wardrobe ?? 0)]} />
      {/* bathroom corner, back right: tub + buckets */}
      <group position={[2.3, F1, -1.9]}>
        <RBox position={[0, 0.3, 0]} size={[1.5, 0.6, 0.75]} r={0.12} color="#e8e8e2" look={{rough: 0.3}} />
        <RBox position={[0, 0.59, 0]} size={[1.32, 0.04, 0.58]} r={0.05} color="#d0d0ca" />
        {(s.tub ?? 0) > 0.02 ? <Block position={[0, 0.36 + 0.22 * (s.tub ?? 0), 0]} size={[1.28, 0.01, 0.55]} color="#5a7a9a" look={{rough: 0.08, metal: 0.3}} shadow={false} /> : null}
        <Cyl position={[0.6, 0.95, -0.3]} rotation={[0.9, 0, 0]} rt={0.02} rb={0.02} h={0.3} color="#c8ccd0" look={{metal: 0.8, rough: 0.3}} />
        <Bucket position={[-1.1, 0, 0.15]} full={s.buckets ?? 0} />
        <Bucket position={[-1.1, 0, 0.55]} full={s.buckets ?? 0} />
        <Bucket position={[-0.7, 0, 0.7]} full={s.buckets ?? 0} />
      </group>
      {/* stairs up along the left wall, rising towards the back, to the hatch */}
      <Stairs k={stairsK} />
      {/* rope ladder from the hatch */}
      <RopeLadder k={ladder} />
      {/* the alarm thread: from the door handle up to the hatch, then to Соня's corner */}
      {(s.thread ?? 0) > 0.01 ? <Thread k={s.thread ?? 0} /> : null}
      {/* upstairs: desk with the radio, maps, soldering iron, supplies, mattress */}
      <group>
        <Block position={[RADIO[0], F2 + 0.37, RADIO[2]]} size={[1.4, 0.04, 0.7]} color={WOOD} />
        {[
          [-0.65, -0.3],
          [0.65, -0.3],
          [-0.65, 0.3],
          [0.65, 0.3],
        ].map(([x, z], i) => (
          <Block key={i} position={[RADIO[0] + x, F2 + 0.175, RADIO[2] + z]} size={[0.05, 0.35, 0.05]} color="#6a4a30" />
        ))}
        <Radio position={[RADIO[0] - 0.2, F2 + 0.5, RADIO[2]]} on={s.radio ?? 0} v={v} />
        {/* soldering iron + a coil of solder */}
        <Pill position={[RADIO[0] + 0.35, F2 + 0.41, RADIO[2] + 0.12]} rotation={[0, 0.4, Math.PI / 2]} r={0.012} len={0.2} color="#2a6ab8" />
        <Ring position={[RADIO[0] + 0.5, F2 + 0.4, RADIO[2] - 0.1]} rotation={[Math.PI / 2, 0, 0]} r={0.04} tube={0.012} color="#c8ccd0" />
        <Pic size={[1.0, 0.75]} res={[512, 384]} k="tihaya_map" draw={drawMap} position={[W / 2 - T - 0.012, F2 + 1.5, -1.7]} rotation={[0, -Math.PI / 2, 0]} />
        <Pic size={[0.7, 0.55]} res={[512, 400]} k="tihaya_map2" draw={drawMap} position={[-0.2, F2 + 1.45, BACK + T + 0.012]} rotation={[0, 0, 0.05]} />
        <Supplies position={[-1.3, F2, BACK + T + 0.2]} />
        {/* Соня's mattress by the left wall, front */}
        <RBox position={[-2.6, F2 + 0.08, 1.5]} size={[0.9, 0.16, 1.9]} r={0.06} color="#8a9aaa" look={{rough: 1}} />
        <RBox position={[-2.6, F2 + 0.18, 1.2]} size={[0.92, 0.06, 1.2]} r={0.03} color="#a84a3a" look={{rough: 1}} />
      </group>
      {/* the words on the wall */}
      {(s.wall ?? 0) > 0.001 ? (
        <Pic size={WALL_TEXT.size} res={[1024, 428]} k={`tihaya_wall_${Math.round((s.wall ?? 0) * 40)}`} draw={drawWall(Math.round((s.wall ?? 0) * 40) / 40)} position={WALL_TEXT.pos} rotation={WALL_TEXT.rot} transparent />
      ) : null}
    </group>
  );
};

const Wardrobe: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <RBox position={[0, 1.0, 0]} size={[1.3, 2.0, 0.6]} r={0.02} color="#6a4a32" />
    <Block position={[0, 1.0, -0.305]} size={[0.01, 1.8, 0.01]} color="#3a2a1e" shadow={false} />
    {([1, -1] as const).map((s) => (
      <Ball key={s} position={[0.08 * s, 1.05, -0.31]} scale={0.02} color="#c8a050" shadow={false} />
    ))}
  </group>
);

const STEPS = 13;
const Stairs: React.FC<{k: number}> = ({k}) => {
  const x = -2.8;
  const z0 = 1.6; // bottom step (front)
  const z1 = HATCH[2] + 0.15; // top
  const keep = Math.round(STEPS * clamp01(k));
  return (
    <group>
      {/* two stringers stay while the steps go */}
      {k > 0.02
        ? ([1, -1] as const).map((s) => {
            const len = Math.hypot(z0 - z1, F2 - F1);
            const ang = Math.atan2(F2 - F1, z0 - z1);
            return <Block key={s} position={[x + s * 0.45, (F1 + F2) / 2, (z0 + z1) / 2]} rotation={[ang, 0, 0]} size={[0.06, 0.22, len]} color="#7a5a3a" />;
          })
        : null}
      {Array.from({length: STEPS}, (_, i) => i)
        .filter((i) => i % Math.max(1, Math.round(STEPS / Math.max(1, keep))) === 0 && i < STEPS * clamp01(k) + 0.01)
        .map((i) => {
          const f = (i + 0.5) / STEPS;
          return <Block key={i} position={[x, F1 + f * (F2 - F1), z0 + (z1 - z0) * f]} size={[0.86, 0.05, 0.26]} color={i % 2 ? PLANK : WOOD} />;
        })}
    </group>
  );
};

// rope ladder: two ropes + rungs from the hatch edge down; k 0 rolled up .. 1 to the floor
const RopeLadder: React.FC<{k: number}> = ({k}) => {
  const x = (HATCH[0] + HATCH[1]) / 2;
  const z = HATCH[2] + 0.12;
  const len = (F2 - F1) * clamp01(k);
  const n = Math.floor(len / 0.3);
  return (
    <group position={[x, F2, z]}>
      {/* the roll at the top */}
      <Cyl position={[0, 0.06, 0.0]} rotation={[0, 0, Math.PI / 2]} rt={0.06 + 0.06 * (1 - k)} rb={0.06 + 0.06 * (1 - k)} h={0.5} seg={14} color="#b89a6a" />
      {len > 0.05
        ? ([1, -1] as const).map((s) => <Cyl key={s} position={[s * 0.2, -len / 2, 0]} rt={0.012} rb={0.012} h={len} seg={8} color="#c8a878" />)
        : null}
      {Array.from({length: n}, (_, i) => (
        <Cyl key={i} position={[0, -0.25 - i * 0.3, 0]} rotation={[0, 0, Math.PI / 2]} rt={0.018} rb={0.018} h={0.42} seg={8} color="#8a6a48" />
      ))}
    </group>
  );
};

// the alarm thread: door handle → up the stairwell → over the hatch edge → to the mattress
export const THREAD_PTS: V3[] = [
  [0.36, F1 + 1.0, FRONT - T - 0.06],
  [-1.8, F1 + 2.2, 0.8],
  [-2.8, F2 + 0.02, HATCH[3] - 0.02],
  [-2.42, F2 + 0.42, 1.05],
];
const Thread: React.FC<{k: number; tug?: number}> = ({k, tug = 0}) => {
  const pts = THREAD_PTS.map((p) => new THREE.Vector3(...p));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1);
  const g = new THREE.TubeGeometry(curve, 60, 0.0025, 5, false);
  g.setDrawRange(0, Math.floor(60 * clamp01(k)) * 5 * 6);
  return <mesh geometry={g} material={mat('#f2f2ea', {basic: true})} />;
};

// the yard: fence with a gate, the shed at the back (its lean-to roof under the back window)
export const SHED_ROOF_TOP = BACKWIN[2] - 0.25;
export const Yard: React.FC<{position?: V3}> = ({position = [0, 0, 0]}) => (
  <group position={position}>
    <Fence z={FRONT + 3.4} x0={-5} x1={5} gap={[-0.7, 0.7]} />
    {/* path to the porch */}
    <Block position={[0, 0.012, FRONT + 2.2]} size={[1.2, 0.02, 2.4]} color="#6a645c" shadow={false} />
    {/* the shed: walls + a lean-to roof sloping away from the house */}
    <group position={[1.8, 0, BACK - 1.4]}>
      <Block position={[0, 1.2, 0]} size={[3.0, 2.4, 2.6]} color="#6a5a48" look={{rough: 1}} />
      <Block position={[0, (SHED_ROOF_TOP + 2.4) / 2 + 0.1, 0.05]} rotation={[-Math.atan2(SHED_ROOF_TOP - 2.4, 2.8), 0, 0]} size={[3.3, 0.1, Math.hypot(SHED_ROOF_TOP - 2.4, 2.8) + 0.1]} color="#4a4a50" look={{rough: 0.6, metal: 0.3}} />
      {/* gap filler between the low walls and the sloped roof */}
      {([1, -1] as const).map((s) => (
        <mesh key={s} position={[s * 1.5, 2.4, 0]} rotation={[0, (s * Math.PI) / 2, 0]} material={mat('#6a5a48', {rough: 1, side: THREE.DoubleSide})}>
          <shapeGeometry args={[shedSide(2.6, SHED_ROOF_TOP - 2.4)]} />
        </mesh>
      ))}
      <Block position={[0, 1.0, -1.31]} size={[1.0, 2.0, 0.04]} color="#4a3a2a" />
    </group>
  </group>
);
const shedSide = (d: number, h: number) => {
  const s = new THREE.Shape();
  s.moveTo(-d / 2, 0);
  s.lineTo(d / 2, 0);
  s.lineTo(d / 2, h);
  s.lineTo(-d / 2, 0);
  return s;
};
