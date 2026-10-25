import React from 'react';
import {random} from 'remotion';
import {Box, Cone, Cyl, Ico} from '../scene/parts';
import {Beam, Puff, Sail, SquashY} from './geo';
import {DECK, LAND, SEA_Y, squash, waveH} from './town';
import {V3, clamp01, collapse, gAt, lerp, ramp, vAtG} from './time';

// ---------- Suspension bridge across the bay ----------

export const BRIDGE_Z = -330;
const TOWER_X = 85;
const DECK_Y = 22; // deck centre
const DECK_TOP = DECK_Y + 1;
const CABLE_Z = 7.6;
const TOP_Y = 72;
const ANCHOR_X = 262;
const SAG_Y = 26;

const SNAP0 = 34.1;
const snapT = (x: number) => SNAP0 + (Math.abs(x) / TOWER_X) * 1.3;
const SECTIONS = [-63.75, -21.25, 21.25, 63.75];
const SECTION_W = 42.5;
const towerBreak = (v: number) => collapse(v, 30, 1.6);

// height of the main cable over the main span; it drops into the water once the deck is gone
const cableY = (x: number, v: number) => {
  const fall = ramp(v, 35.8, 37.0, (t) => t * t);
  const bottom = lerp(SAG_Y, SEA_Y - 4, fall);
  const top = towerTop(v).y;
  return bottom + (top - bottom) * (x / TOWER_X) ** 2;
};

const towerTop = (v: number) => {
  const k = towerBreak(v);
  return {y: TOP_Y - 26 * k, lean: 0.28 * k};
};

const sectionFall = (i: number, v: number) => {
  const xc = SECTIONS[i];
  const t0 = snapT(Math.abs(xc) + SECTION_W / 2) + 0.05;
  const t = Math.max(0, v - t0);
  const drop = DECK_Y - (SEA_Y + 0.3);
  const a = 42;
  const d = Math.min(drop, 0.5 * a * t * t);
  const tLand = Math.sqrt((2 * drop) / a);
  const sink = Math.max(0, v - t0 - tLand) * 0.6;
  return {y: -d - Math.min(1.8, sink), rot: (xc > 0 ? 1 : -1) * 0.1 * Math.min(1, t / tLand), tLand: t0 + tLand};
};

const DeckPiece: React.FC<{w: number}> = ({w}) => (
  <>
    <Box size={[w, 2, 12]} color="#cfc8bb" />
    <Box size={[w, 0.05, 10]} position={[0, 1.035, 0]} color="#4d5056" />
    {[-5.9, 5.9].map((z) => (
      <Box key={z} size={[w, 1.0, 0.2]} position={[0, 1.5, z]} color="#b3402f" />
    ))}
  </>
);

export const Bridge: React.FC<{v: number}> = ({v}) => {
  const tt = towerTop(v);
  const parts: React.ReactNode[] = [];
  // towers
  [-1, 1].forEach((side) => {
    const x = side * TOWER_X;
    const lean = -side * tt.lean;
    parts.push(
      <group key={`tw${side}`} position={[x, SEA_Y - 3, BRIDGE_Z]} rotation={[0, 0, lean]}>
        {[-CABLE_Z, CABLE_Z].map((z) => (
          <Box key={z} size={[2.6, tt.y - SEA_Y + 3, 2.4]} position={[0, (tt.y - SEA_Y + 3) / 2, z]} color="#c4513c" />
        ))}
        {[DECK_Y - 2.6 - SEA_Y + 3, 0.62 * (TOP_Y - SEA_Y), 0.94 * (TOP_Y - SEA_Y)].map((y) => (
          <Box key={y} size={[2.0, 2.6, CABLE_Z * 2 - 0.4]} position={[0, Math.min(y, tt.y - SEA_Y + 1), 0]} color="#b54733" />
        ))}
      </group>,
    );
  });
  // side spans on piers, from the towers to the anchorages on the headlands
  [-1, 1].forEach((side) => {
    const x0 = side * (TOWER_X + 1.6);
    const x1 = side * ANCHOR_X;
    parts.push(
      <group key={`sd${side}`} position={[(x0 + x1) / 2, DECK_Y, BRIDGE_Z]}>
        <DeckPiece w={Math.abs(x1 - x0)} />
      </group>,
    );
    [128, 200, 252].forEach((px) => {
      const base = px > 170 ? LAND : SEA_Y - 3;
      parts.push(<Box key={`pl${side}${px}`} size={[3, DECK_Y - 1 - base - 0.01, 9]} position={[side * px, (DECK_Y - 1.01 + base) / 2, BRIDGE_Z]} color="#bdb6a8" />);
    });
    parts.push(<Box key={`an${side}`} size={[10, 8, 22]} position={[side * (ANCHOR_X + 4), LAND + 4, BRIDGE_Z]} color="#a9a297" />);
  });
  // main span sections
  SECTIONS.forEach((xc, i) => {
    const f = sectionFall(i, v);
    parts.push(
      <group key={`ms${i}`} position={[xc, DECK_Y + f.y, BRIDGE_Z]} rotation={[0.02 * Math.abs(f.rot) * 10 * (i % 2 ? 1 : -1), 0, f.rot]}>
        <DeckPiece w={SECTION_W - 0.3} />
      </group>,
    );
    parts.push(<Puff key={`sp${i}`} v={v} t0={f.tLand} position={[xc, SEA_Y, BRIDGE_Z]} size={7} seed={`bsp-${i}`} color="#f2f7fa" life={2.6} />);
  });
  // main cables
  [-CABLE_Z, CABLE_Z].forEach((z) => {
    const n = 24;
    for (let i = 0; i < n; i++) {
      const xa = -TOWER_X + (2 * TOWER_X * i) / n;
      const xb = -TOWER_X + (2 * TOWER_X * (i + 1)) / n;
      parts.push(<Beam key={`mc${z}${i}`} from={[xa, cableY(xa, v), BRIDGE_Z + z]} to={[xb, cableY(xb, v), BRIDGE_Z + z]} r={0.8} color="#a83c2c" />);
    }
    [-1, 1].forEach((side) => {
      const tx = side * TOWER_X - side * Math.sin(tt.lean) * (tt.y - SEA_Y);
      parts.push(<Beam key={`bc${z}${side}`} from={[tx, tt.y, BRIDGE_Z + z]} to={[side * ANCHOR_X, LAND + 7, BRIDGE_Z + z]} r={0.8} color="#a83c2c" />);
    });
  });
  // suspenders: they snap from the middle outwards
  for (let x = -80; x <= 80; x += 8) {
    const t0 = snapT(x);
    const snapped = ramp(v, t0, t0 + 0.3);
    [-CABLE_Z, CABLE_Z].forEach((z) => {
      const top: V3 = [x, cableY(x, v), BRIDGE_Z + z];
      const bottom: V3 = [x, DECK_TOP, BRIDGE_Z + Math.sign(z) * 5.95];
      const end: V3 = [lerp(bottom[0], top[0], 0.8 * snapped), lerp(bottom[1], top[1], 0.8 * snapped), lerp(bottom[2], top[2], 0.8 * snapped)];
      if (snapped < 1 || v < t0 + 1.5) parts.push(<Beam key={`su${x}${z}`} from={top} to={end} r={0.3} color="#7a2d22" />);
    });
  }
  return <SquashY base={SEA_Y} s={squash(v)}>{parts}</SquashY>;
};

// ---------- Sailboats ----------

const BOATS: [number, number, number, string][] = [
  [-62, -150, 0.4, '#f7f7f4'],
  [44, -205, -0.6, '#f2d36b'],
  [-118, -255, 2.6, '#f7f7f4'],
  [96, -118, 1.9, '#e86a5a'],
  [14, -440, -1.2, '#f7f7f4'],
  [-30, -560, 0.9, '#9ed0e6'],
];

export const Boats: React.FC<{v: number}> = ({v}) => (
  <SquashY base={SEA_Y} s={squash(v)}>
    {BOATS.map(([x, z, yaw, sail], i) => {
      const y = SEA_Y + waveH(x, z, v);
      const roll = 0.12 * Math.sin(v * 1.1 + i) * (1 - clamp01(gAt(v) / 6));
      const mast = collapse(v, 11 + i * 1.3, 0.8);
      return (
        <group key={i} position={[x + v * 0.4 * Math.cos(yaw), y, z - v * 0.4 * Math.sin(yaw)]} rotation={[0, yaw, roll]}>
          <Box size={[6.4, 1.2, 2.3]} position={[0, 0.3, 0]} color="#f4f2ec" />
          <Box size={[1.63, 1.16, 1.63]} position={[3.2, 0.3, 0]} rotation={[0, Math.PI / 4, 0]} color="#f4f2ec" />
          <Box size={[2.4, 0.6, 1.6]} position={[-0.8, 1.2, 0]} color="#d9d4c8" />
          <group position={[0.8, 0.9, 0]} rotation={[0, 0, -1.45 * mast]}>
            <Cyl rTop={0.08} rBottom={0.1} height={9} segments={6} position={[0, 4.5, 0]} color="#d8d8d4" />
            <Sail w={3.6} h={7.6} color={sail} position={[-0.12, 1.0, 0]} rotation={[0, Math.PI, 0]} />
          </group>
        </group>
      );
    })}
  </SquashY>
);

// ---------- Gulls ----------

const Gull: React.FC<{flap: number; sit?: number; fold?: number}> = ({flap, sit = 0, fold = 0}) => (
  <group>
    <Ico radius={0.16} position={[0, 0.2 - 0.06 * sit, 0]} scale={[0.75, 0.7, 1.5]} color="#fbfbf9" shadow={false} />
    <Ico radius={0.09} position={[0, 0.3 - 0.06 * sit, 0.22]} color="#fbfbf9" shadow={false} />
    <Cone radius={0.03} height={0.12} segments={4} position={[0, 0.29 - 0.06 * sit, 0.34]} rotation={[Math.PI / 2, 0, 0]} color="#f2b33a" shadow={false} />
    {[-1, 1].map((sd) => (
      <group key={sd} position={[sd * 0.08, 0.24 - 0.06 * sit, 0]} rotation={[0, 0, sd * flap]} scale={[1 - 0.72 * fold, 1, 1]}>
        <Box size={[0.5, 0.02, 0.18]} position={[sd * 0.25, 0, 0]} color="#c9ced6" shadow={false} />
        <Box size={[0.12, 0.021, 0.16]} position={[sd * 0.47, 0, 0]} color="#3a3d44" shadow={false} />
      </group>
    ))}
    {sit < 1
      ? [-0.05, 0.05].map((x) => <Box key={x} size={[0.02, 0.1, 0.02]} position={[x, 0.05, 0]} color="#e7a64a" shadow={false} />)
      : null}
  </group>
);

const PERCH: [number, number][] = [
  [6.9, 0.3],
  [7.8, 0.3],
  [8.7, 0.3],
  [9.7, 0.3],
  [-8.0, 0.3],
  [-9.1, 0.3],
];

export const Gulls: React.FC<{v: number}> = ({v}) => (
  <SquashY base={DECK} s={squash(v)}>
    {PERCH.map(([px, pz], i) => {
      const land0 = 19.2 + i * 0.25;
      const k = ramp(v, land0, land0 + 1.6);
      const r = 9 + random(`gull-r-${i}`) * 6;
      const ph = random(`gull-p-${i}`) * Math.PI * 2;
      const sp = 0.35 + random(`gull-s-${i}`) * 0.2;
      const a = ph + Math.min(v, land0 + 1.6) * sp;
      const fly: V3 = [Math.cos(a) * r, 9 + 4 * random(`gull-h-${i}`) + Math.sin(v * 0.7 + i) * 0.8, -14 + Math.sin(a) * r * 0.6];
      const perch: V3 = [px, DECK + 1.085, pz];
      const pos: V3 = [lerp(fly[0], perch[0], k), lerp(fly[1], perch[1], k * k), lerp(fly[2], perch[2], k)];
      const heading = k < 1 ? -a : Math.PI;
      const flap = k < 1 ? Math.sin(v * 9 + ph) * 0.6 : 0.05;
      const sit = clamp01((gAt(v) - 3) / 2);
      return (
        <group key={i} position={pos} rotation={[0, heading, 0]} scale={1.3}>
          <Gull flap={flap} sit={sit} fold={ramp(v, land0 + 1.3, land0 + 1.7)} />
        </group>
      );
    })}
  </SquashY>
);

// ---------- Airliner high over the mountains ----------

// It flies away from the town and sinks behind the mountains.
export const planePos = (v: number): {p: V3; pitch: number} => {
  const x = -260 + v * 13;
  const k = ramp(v, 17.5, 26.5, (t) => t * t);
  const y = 420 - 340 * k;
  const z = -1100 - 60 * Math.max(0, v - 17.5);
  return {p: [x, y, z], pitch: -0.3 * ramp(v, 17.5, 19.5)};
};

export const Plane: React.FC<{v: number}> = ({v}) => {
  if (v > 27) return null;
  const {p, pitch} = planePos(v);
  return (
    <group position={p} rotation={[0, Math.PI / 2 + 0.6, 0]} scale={11}>
      <group rotation={[pitch, 0, 0]}>
        <Cyl rTop={0.35} rBottom={0.35} height={4} segments={8} rotation={[Math.PI / 2, 0, 0]} color="#f4f4f4" shadow={false} />
        <Cone radius={0.35} height={0.8} segments={8} position={[0, 0, 2.4]} rotation={[Math.PI / 2, 0, 0]} color="#f4f4f4" shadow={false} />
        <Box size={[5, 0.08, 0.9]} position={[0, -0.05, 0.2]} color="#e2e6ea" shadow={false} />
        <Box size={[1.8, 0.06, 0.5]} position={[0, 0.05, -1.8]} color="#e2e6ea" shadow={false} />
        <Box size={[0.08, 0.9, 0.6]} position={[0, 0.5, -1.8]} color="#2f6fd0" shadow={false} />
      </group>
    </group>
  );
};

// ---------- Clouds: they sink to the ground as the air is squeezed ----------

const CLOUDS: [number, number, number, number][] = [
  [-420, 170, -820, 26],
  [-120, 150, -700, 20],
  [160, 185, -900, 30],
  [420, 160, -760, 24],
  [-300, 140, -480, 16],
  [300, 150, -520, 18],
  [40, 200, -1300, 34],
];

export const Clouds: React.FC<{v: number}> = ({v}) => {
  const k = ramp(v, 37.6, 41.6, (t) => t * t * (3 - 2 * t));
  if (v > 43.6) return null;
  const under = ramp(v, 41.8, 43.4);
  return (
    <>
      {CLOUDS.map(([x, y, z, s], i) => {
        const yy = lerp(y, LAND + 2, k) - under * s * 0.7;
        const flat = lerp(1, 0.3, k);
        const spread = lerp(1, 1.5, k);
        return (
          <group key={i} position={[x + v * 0.8, yy, z]} scale={[s * spread, s * flat, s * spread * 0.8]}>
            {[0, 1, 2, 3, 4].map((j) => (
              <Ico
                key={j}
                radius={1}
                detail={1}
                position={[(random(`gc-x-${i}-${j}`) - 0.5) * 3.2, random(`gc-y-${i}-${j}`) * 0.5, (random(`gc-z-${i}-${j}`) - 0.5) * 1.8]}
                scale={[1.1 + random(`gc-s-${i}-${j}`) * 0.6, 0.55, 1]}
                rotation={[i + j, i * 2 + j, 0]}
                color="#ffffff"
                shadow={false}
              />
            ))}
          </group>
        );
      })}
    </>
  );
};

export {DECK};
