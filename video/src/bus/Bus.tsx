import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box, Cyl, Glow, Mat} from '../slime/parts';
import {V3} from './cues';
import {DOOR_Z, KERB_Y, PLATFORM_EDGE, PLATFORM_Y, SEAT_Y, STOP_DIST, WALL_X} from './action';

// The bus at night: dark panels, warm ceiling strips, yellow handrails, rust-orange seats, a raised rear platform
// with a bench across the back. Outside: the city sliding past (square lit windows like the reference) and,
// at the stop, a kerb with a street lamp next to the middle door.

const m = (color: string, rough = 0.8, extra: Partial<Mat> = {}): Mat => ({color, rough, env: 0.3, ...extra});
const FLOOR = m('#2a2c33', 0.9);
const PANEL = m('#383b44', 0.7);
const PANEL_LOW = m('#2c2e36', 0.75);
const CEIL = m('#4a4c52', 0.85);
const SEAT = m('#a8492a', 0.75);
const SEAT_DARK = m('#5a2a1c', 0.8);
const POLE = m('#e1b136', 0.35, {metal: 0.45, env: 0.8});
const RUBBER = m('#17181c', 0.9);
const GLASS = m('#1b2230', 0.05, {opacity: 0.18, glass: true, env: 1.2});
const STEP_EDGE = m('#d7a52f', 0.6);
const DOOR = m('#41444c', 0.6);

export const BUS_Z: [number, number] = [-1.1, 6.5];
const H = 2.32; // ceiling
const WIN: [number, number] = [0.98, 1.92];

// one side wall with windows between pillars; an optional door gap
const Wall: React.FC<{side: 1 | -1; door?: [number, number]}> = ({side, door}) => {
  const x = side * (WALL_X + 0.03);
  const parts: React.ReactNode[] = [];
  const spans: [number, number][] = door ? [[BUS_Z[0], door[0]], [door[1], BUS_Z[1]]] : [[BUS_Z[0], BUS_Z[1]]];
  spans.forEach(([z0, z1], i) => {
    const len = z1 - z0;
    const zc = (z0 + z1) / 2;
    parts.push(<Box key={`lo${i}`} size={[0.06, WIN[0], len]} position={[x, WIN[0] / 2, zc]} m={PANEL_LOW} />);
    parts.push(<Box key={`hi${i}`} size={[0.06, H - WIN[1], len]} position={[x, (H + WIN[1]) / 2, zc]} m={PANEL} />);
    parts.push(<Box key={`gl${i}`} size={[0.01, WIN[1] - WIN[0], len]} position={[x + side * 0.012, (WIN[0] + WIN[1]) / 2, zc]} m={GLASS} shadow={false} />);
    // pillars every ~1.1 m
    const n = Math.max(1, Math.round(len / 1.1));
    for (let k = 0; k <= n; k++) {
      const z = z0 + (len * k) / n;
      parts.push(<Box key={`p${i}-${k}`} size={[0.08, WIN[1] - WIN[0] + 0.02, 0.09]} position={[x - side * 0.005, (WIN[0] + WIN[1]) / 2, z]} m={PANEL} />);
    }
    // a rubber window sill
    parts.push(<Box key={`sill${i}`} size={[0.1, 0.03, len]} position={[x - side * 0.03, WIN[0] + 0.005, zc]} m={RUBBER} shadow={false} />);
  });
  if (door) {
    // the door frame and the panel above the door
    parts.push(<Box key="dtop" size={[0.08, H - 2.0, door[1] - door[0] + 0.02]} position={[x, (H + 2.0) / 2, (door[0] + door[1]) / 2]} m={PANEL} />);
  }
  return <group>{parts}</group>;
};

// a seat facing +z
const Seat: React.FC<{position: V3; width?: number}> = ({position, width = 0.46}) => (
  <group position={position}>
    <Box size={[width, 0.1, 0.44]} position={[0, 0.45, 0]} m={SEAT} />
    <Box size={[width, 0.56, 0.08]} position={[0, 0.78, -0.2]} rotation={[-0.1, 0, 0]} m={SEAT} />
    <Box size={[0.08, 0.4, 0.3]} position={[0, 0.2, -0.02]} m={SEAT_DARK} />
    <Cyl r={0.018} h={0.2} position={[0, 1.12, -0.25]} m={POLE} />
  </group>
);

const Pole: React.FC<{x: number; z: number; y0?: number}> = ({x, z, y0 = 0}) => <Cyl r={0.022} h={H - y0} position={[x, (H + y0) / 2, z]} m={POLE} seg={10} />;

const Rail: React.FC<{x: number; z0: number; z1: number}> = ({x, z0, z1}) => (
  <group>
    <Cyl r={0.018} h={z1 - z0} position={[x, 1.98, (z0 + z1) / 2]} rotation={[PI2, 0, 0]} m={POLE} seg={10} />
    {[z0 + 0.3, (z0 + z1) / 2, z1 - 0.3].map((z) => (
      <Cyl key={z} r={0.01} h={H - 1.98} position={[x, (H + 1.98) / 2, z]} m={POLE} seg={6} />
    ))}
  </group>
);
const PI2 = Math.PI / 2;

export const BusInterior: React.FC<{door: number; lightsOn: number}> = ({door}) => (
  <group>
    {/* floor and ceiling */}
    <Box size={[2 * WALL_X + 0.1, 0.06, BUS_Z[1] - BUS_Z[0]]} position={[0, -0.03, (BUS_Z[0] + BUS_Z[1]) / 2]} m={FLOOR} />
    <Box size={[2 * WALL_X + 0.1, 0.06, BUS_Z[1] - BUS_Z[0]]} position={[0, H + 0.03, (BUS_Z[0] + BUS_Z[1]) / 2]} m={CEIL} />
    {/* ceiling light strips */}
    {[-0.62, 0.62].map((x) => (
      <Glow key={x} size={[0.12, 0.012, BUS_Z[1] - BUS_Z[0] - 0.6]} position={[x, H - 0.008, (BUS_Z[0] + BUS_Z[1]) / 2 + 0.1]} color="#ffd9a8" power={1.4} />
    ))}
    {/* rubber strip down the aisle */}
    <Box size={[0.5, 0.008, BUS_Z[1] - PLATFORM_EDGE - 0.1]} position={[0, 0.004, (PLATFORM_EDGE + BUS_Z[1]) / 2 + 0.05]} m={m('#22242a', 0.95)} shadow={false} />
    {/* the rear platform with a yellow step edge */}
    <Box size={[2 * WALL_X, PLATFORM_Y, PLATFORM_EDGE - BUS_Z[0]]} position={[0, PLATFORM_Y / 2, (BUS_Z[0] + PLATFORM_EDGE) / 2]} m={FLOOR} />
    <Box size={[2 * WALL_X - 0.02, 0.04, 0.06]} position={[0, PLATFORM_Y - 0.015, PLATFORM_EDGE + 0.006]} m={STEP_EDGE} shadow={false} />
    {/* rear bench across the back */}
    <group>
      <Box size={[2 * WALL_X - 0.1, 0.1, 0.5]} position={[0, SEAT_Y - 0.05, -0.37]} m={SEAT} />
      <Box size={[2 * WALL_X - 0.1, SEAT_Y - PLATFORM_Y - 0.1, 0.42]} position={[0, (SEAT_Y - 0.1 + PLATFORM_Y) / 2, -0.4]} m={SEAT_DARK} />
      <Box size={[2 * WALL_X - 0.1, 0.72, 0.09]} position={[0, SEAT_Y + 0.38, -0.66]} rotation={[-0.12, 0, 0]} m={SEAT} />
    </group>
    {/* rear wall with the big back window */}
    <Box size={[2 * WALL_X + 0.1, 1.05, 0.06]} position={[0, 0.525, BUS_Z[0]]} m={PANEL_LOW} />
    <Box size={[2 * WALL_X + 0.1, H - 2.0, 0.06]} position={[0, (H + 2.0) / 2, BUS_Z[0]]} m={PANEL} />
    <Box size={[2 * WALL_X, 0.95, 0.01]} position={[0, 1.525, BUS_Z[0] - 0.012]} m={GLASS} shadow={false} />
    <Box size={[0.08, 0.95, 0.08]} position={[0, 1.525, BUS_Z[0] + 0.01]} m={PANEL} />
    <Wall side={-1} />
    <Wall side={1} door={DOOR_Z} />
    <Doors open={door} />
    {/* seats: left side the whole way, right side in front of the door */}
    {[1.05, 2.15, 3.25, 4.35, 5.45].map((z) => (
      <Seat key={`l${z}`} position={[-0.86, 0, z]} />
    ))}
    {[2.25, 3.35, 4.45, 5.55].map((z) => (
      <Seat key={`r${z}`} position={[0.86, 0, z]} />
    ))}
    {/* handrails */}
    <Rail x={-0.34} z0={0.55} z1={6.2} />
    <Rail x={0.34} z0={0.55} z1={6.2} />
    <Pole x={0.62} z={0.3} y0={PLATFORM_Y} />
    <Pole x={-0.62} z={0.3} y0={PLATFORM_Y} />
    <Pole x={-0.6} z={2.72} />
    <Pole x={0.6} z={3.9} />
    {/* stop button and a small route display over the door */}
    <Box size={[0.05, 0.08, 0.05]} position={[WALL_X - 0.05, 1.35, 2.0]} m={m('#c4372b', 0.5, {emissive: '#ff3a2a', glow: 0.5})} shadow={false} />
    <Box size={[0.02, 0.14, 0.7]} position={[WALL_X - 0.02, 2.13, 1.1]} m={m('#101114', 0.5)} shadow={false} />
    <Glow size={[0.006, 0.07, 0.6]} position={[WALL_X - 0.033, 2.13, 1.1]} color="#ff9a3a" power={1.2} />
  </group>
);

// two leaves that step out and slide apart
const Doors: React.FC<{open: number}> = ({open}) => {
  const w = (DOOR_Z[1] - DOOR_Z[0]) / 2;
  const out = Math.min(1, open * 3) * 0.1;
  const slide = Math.max(0, (open - 0.25) / 0.75) * (w - 0.04);
  const leaf = (s: 1 | -1) => {
    const zc = (DOOR_Z[0] + DOOR_Z[1]) / 2 + s * (w / 2 + slide);
    return (
      <group key={s} position={[WALL_X + 0.03 + out, 0, zc]}>
        <Box size={[0.05, 0.97, w - 0.01]} position={[0, 0.51, 0]} m={DOOR} />
        <Box size={[0.05, 0.1, w - 0.01]} position={[0, 1.95, 0]} m={DOOR} />
        <Box size={[0.05, 0.92, 0.06]} position={[0, 1.45, s * (w / 2 - 0.035)]} m={DOOR} />
        <Box size={[0.05, 0.92, 0.06]} position={[0, 1.45, -s * (w / 2 - 0.035)]} m={DOOR} />
        <Box size={[0.012, 0.9, w - 0.13]} position={[0, 1.45, 0]} m={GLASS} shadow={false} />
        <Box size={[0.07, 0.9, 0.02]} position={[-0.0, 1.0, -s * (w / 2 - 0.01)]} m={RUBBER} shadow={false} />
      </group>
    );
  };
  return (
    <group>
      {leaf(1)}
      {leaf(-1)}
    </group>
  );
};

// ---------------------------------------------------------------- outside

const rnd = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
};

// building facades: a canvas of dark walls with square lit windows, warm and a few cold ones
const useFacade = (seed: number) =>
  useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 256;
    const g = c.getContext('2d')!;
    const r = rnd(seed);
    g.fillStyle = '#07080c';
    g.fillRect(0, 0, c.width, c.height);
    let x = 0;
    while (x < c.width) {
      const bw = 90 + Math.floor(r() * 140);
      const top = 20 + Math.floor(r() * 120);
      g.fillStyle = r() < 0.5 ? '#0d0f15' : '#10121a';
      g.fillRect(x, top, bw - 6, c.height - top);
      for (let wy = top + 10; wy < c.height - 14; wy += 18) {
        for (let wx = x + 8; wx < x + bw - 18; wx += 16) {
          const k = r();
          if (k < 0.32) {
            g.fillStyle = k < 0.05 ? '#9cc4ff' : k < 0.12 ? '#ffd27a' : k < 0.22 ? '#ff9e4a' : '#ffe2b0';
            g.globalAlpha = 0.55 + r() * 0.45;
            g.fillRect(wx, wy, 9, 10);
            g.globalAlpha = 1;
          }
        }
      }
      x += bw;
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter;
    return t;
  }, [seed]);

const Facade: React.FC<{side: 1 | -1; dist: number; seed: number; x: number}> = ({side, dist, seed, x}) => {
  const tex = useFacade(seed);
  const LEN = 120;
  tex.repeat.set(LEN / 60, 1);
  tex.offset.x = (side * dist) / 60;
  return (
    <mesh position={[side * x, 5.5, 2]} rotation={[0, -side * PI2, 0]}>
      <planeGeometry args={[LEN, 15]} />
      <meshBasicMaterial map={tex} toneMapped={false} color="#d8d0c8" />
    </mesh>
  );
};

// street lamps every 14 m along both kerbs, the stop lamp next to the door
const Lamps: React.FC<{dist: number}> = ({dist}) => {
  const items: React.ReactNode[] = [];
  for (const side of [1, -1] as const) {
    for (let k = -2; k < 8; k++) {
      const z0 = k * 14 + (side > 0 ? 3 : 9);
      const z = ((((z0 - dist) % 112) + 112) % 112) - 40;
      items.push(
        <group key={`${side}${k}`} position={[side * 4.2, 0, z]}>
          <Cyl r={0.06} h={5} position={[0, 2.1, 0]} m={m('#1c1d22')} seg={6} />
          <Box size={[0.9, 0.1, 0.2]} position={[-side * 0.4, 4.6, 0]} m={m('#1c1d22')} shadow={false} />
          <Glow size={[0.45, 0.06, 0.16]} position={[-side * 0.7, 4.53, 0]} color="#ffb766" power={2.2} />
        </group>,
      );
    }
  }
  return <group>{items}</group>;
};

export const Outside: React.FC<{dist: number}> = ({dist}) => {
  const rel = dist - STOP_DIST; // 0 when the bus stands at the stop
  return (
    <group>
      {/* road and kerbs */}
      <Box size={[30, 0.1, 200]} position={[0, -0.47, 0]} m={m('#121318', 0.95)} shadow={false} />
      <Box size={[5, 0.4, 200]} position={[WALL_X + 0.1 + 2.5 + 0.05, KERB_Y - 0.2, 0]} m={m('#24252b', 0.9)} />
      <Box size={[5, 0.4, 200]} position={[-(WALL_X + 0.1 + 2.5 + 0.6), -0.32, 0]} m={m('#24252b', 0.9)} />
      <Facade side={1} dist={dist} seed={11} x={9} />
      <Facade side={-1} dist={dist} seed={23} x={9} />
      <Lamps dist={dist} />
      {/* the stop: a pole with a sign and a lamp by the door */}
      <group position={[0, 0, -rel]}>
        <group position={[2.9, KERB_Y, 2.3]}>
          <Cyl r={0.04} h={2.4} position={[0, 1.2, 0]} m={m('#2a2b30')} seg={6} />
          <Box size={[0.04, 0.42, 0.42]} position={[0, 2.3, 0]} m={m('#e8e2d0', 0.6)} />
          <Box size={[0.05, 0.16, 0.16]} position={[0, 2.38, 0]} m={m('#2d6a3a', 0.6)} shadow={false} />
        </group>
      </group>
    </group>
  );
};
export const STOP_LAMP: V3 = [3.4, 3.9, 1.0];
