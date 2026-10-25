import React, {useMemo} from 'react';
import * as THREE from 'three';
import {random} from 'remotion';
import {Box, Cone, Cyl, Ico} from '../scene/parts';
import {Car} from '../gravity/props';
import {Bench, LampPost} from '../gravity/city';
import {Beam, Prism, Puff, SquashY} from './geo';
import {V3, clamp01, collapse, gAt, lerp, ramp, vAtG} from './time';

// ---------- Layout (metres; the sea is north, -z) ----------

export const SEA_Y = -2.5;
export const DECK = 1.6; // promenade and pier deck top
export const ROAD_Y = 1.45;
export const ROAD_Z: [number, number] = [10, 17];
export const FRONT_Z = 21; // house fronts
export const LAND = 4; // headlands and the far shore

// After ~150 g everything still standing is pressed flat.
export const flatAll = (v: number) => ramp(v, 41.5, 44.5);
export const squash = (v: number) => 1 - 0.965 * flatAll(v);

// Seconds since gravity passed g (negative before).
export const since = (v: number, g: number) => v - vAtG(g);

// ---------- Sea ----------

const SEA_N = 170;
const warp = (u: number) => 520 * u + 4500 * u ** 5;

export const waveH = (x: number, z: number, v: number) => {
  const a = (0.34 / Math.pow(gAt(v), 0.8)) / (1 + Math.hypot(x, z + 150) / 900);
  return a * (0.55 * Math.sin(0.085 * x + 1.25 * v) + 0.45 * Math.sin(0.12 * z - 1.05 * v + 0.021 * x) + 0.3 * Math.sin(0.29 * x + 0.23 * z + 2.0 * v));
};

export const Sea: React.FC<{v: number}> = ({v}) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(2, 2, SEA_N, SEA_N);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setXYZ(i, warp(p.getX(i)), 0, warp(p.getZ(i)) - 150);
    return g;
  }, []);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setY(i, waveH(p.getX(i), p.getZ(i), v));
  p.needsUpdate = true;
  const mirror = ramp(v, 40, 44);
  return (
    <mesh geometry={geo} position={[0, SEA_Y, 0]} receiveShadow frustumCulled={false}>
      <meshStandardMaterial
        color={new THREE.Color('#3f86ad').lerp(new THREE.Color('#0c1a26'), mirror)}
        flatShading
        roughness={lerp(0.5, 0.06, mirror)}
        metalness={lerp(0.05, 0.9, mirror)}
      />
    </mesh>
  );
};

// ---------- Ground ----------

const Slab: React.FC<{x: [number, number]; z: [number, number]; y: [number, number]; color: string}> = ({x, z, y, color}) => (
  <Box size={[x[1] - x[0], y[1] - y[0], z[1] - z[0]]} position={[(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2]} color={color} />
);

const HILLS: [number, number, number, number][] = [
  // x, z, radius, base height
  [-420, -300, 150, LAND],
  [-260, -560, 120, LAND],
  [-640, -160, 190, LAND],
  [400, -260, 160, LAND],
  [300, -560, 130, LAND],
  [660, -190, 190, LAND],
  [-320, 260, 210, DECK],
  [260, 300, 230, DECK],
  [0, 430, 260, DECK],
  [-700, 120, 220, DECK],
  [720, 140, 220, DECK],
];

// Hills (about 70 m) and mountains (about 650 m tall) can only stand as high as the rock allows.
export const hillF = (v: number) => Math.min(1, 8849 / gAt(v) / 200);
export const mountainF = (v: number) => Math.min(1, 8849 / gAt(v) / 650);

export const Ground: React.FC<{v: number}> = ({v}) => {
  const hf = hillF(v);
  return (
    <>
      {/* town: promenade, road, sidewalk, lots */}
      <Slab x={[-1400, 1400]} z={[0, 10]} y={[-6, DECK]} color="#dcc9a2" />
      <Slab x={[-1400, 1400]} z={ROAD_Z} y={[-6, ROAD_Y]} color="#5b5e64" />
      <Slab x={[-1400, 1400]} z={[17, FRONT_Z]} y={[-6, DECK]} color="#d2c7b1" />
      <Slab x={[-1400, 1400]} z={[FRONT_Z, 900]} y={[-6, DECK]} color="#93b46c" />
      {/* headlands and the far shore */}
      <Slab x={[-1400, -170]} z={[-700, 0]} y={[-8, LAND]} color="#8fb067" />
      <Slab x={[170, 1400]} z={[-700, 0]} y={[-8, LAND]} color="#8fb067" />
      <Slab x={[-1400, 1400]} z={[-2600, -700]} y={[-8, LAND]} color="#8aab63" />
      {/* road markings, 1 cm above the asphalt */}
      {Array.from({length: 46}, (_, i) => (
        <Box key={i} size={[2.6, 0.02, 0.16]} position={[-135 + i * 6, ROAD_Y + 0.02, 13.5]} color="#efe9d8" shadow={false} />
      ))}
      {HILLS.map(([x, z, r, base], i) => (
        <Ico key={i} radius={r} detail={1} position={[x, base - 2, z]} scale={[1, 0.38 * hf, 0.8]} rotation={[0, i * 1.7, 0]} color={i % 2 ? '#7fa45d' : '#86ab62'} />
      ))}
    </>
  );
};

// ---------- Mountains beyond the bay ----------

export const MOUNTAINS: {x: number; z: number; h: number; r: number}[] = [
  {x: -780, z: -1250, h: 280, r: 250},
  {x: -520, z: -1080, h: 250, r: 230},
  {x: -270, z: -1200, h: 330, r: 260},
  {x: -40, z: -1020, h: 240, r: 210},
  {x: 190, z: -1170, h: 310, r: 250},
  {x: 430, z: -1040, h: 250, r: 215},
  {x: 680, z: -1260, h: 290, r: 260},
];

const Mountain: React.FC<{m: (typeof MOUNTAINS)[number]; f: number; i: number}> = ({m, f, i}) => {
  // the base sits 6 m under the shore, so a flattened mountain sinks out of sight instead of lying flat on it
  const H = m.h + 6;
  const yb = 0.6 * H;
  const d = 0.025 * H;
  const snowH = H + d - yb;
  const snowR = m.r * (1 - yb / H) * 1.06;
  const rot: V3 = [0, i * 0.9, 0];
  return (
    <group position={[m.x, LAND - 6, m.z]} scale={[1, Math.max(0.001, f), 1]}>
      <Cone radius={m.r} height={H} segments={7} position={[0, H / 2, 0]} rotation={rot} color={i % 2 ? '#8b8f95' : '#7f858d'} />
      <Cone radius={snowR} height={snowH} segments={7} position={[0, yb + snowH / 2, 0]} rotation={rot} color="#f2f5f8" />
    </group>
  );
};

export const Mountains: React.FC<{v: number}> = ({v}) => {
  const f = mountainF(v);
  return (
    <>
      {MOUNTAINS.map((m, i) => (
        <Mountain key={i} m={m} f={f} i={i} />
      ))}
      {/* avalanches roll down as the peaks sink */}
      {MOUNTAINS.map((m, i) => {
        const t0 = 36.0 + ((i * 0.37) % 1.4);
        const h = m.h * f;
        return <Puff key={`a${i}`} v={v} t0={t0} position={[m.x, LAND + h * 0.25, m.z + m.r * 0.55]} size={30} seed={`aval-${i}`} color="#eef2f5" life={3.5} />;
      })}
    </>
  );
};

// ---------- Houses along the seafront ----------

const WALLS = ['#f2c39b', '#9fcfd6', '#f3dc9c', '#e7a3a0', '#b4d4a3', '#f1eee4', '#c8b5e2', '#f4b6c8'];
const ROOFS = ['#b5523b', '#3f5f7a', '#8a4b3a', '#5c6f52'];
const SIGNS = ['#e64b3c', '#2f8fd8', '#f2a83a', '#3aa47a', '#d84a9a'];

export type HouseSpec = {
  id: number;
  x: number;
  w: number;
  d: number;
  floors: number;
  wall: string;
  roof: string;
  flatRoof: boolean;
  balcony: boolean;
  sign: string | null;
  awning: [string, string] | null;
  breakG: number;
  partsG: number;
  tilt: number;
};

export const HOUSES: HouseSpec[] = (() => {
  const list: HouseSpec[] = [];
  let cursor = -70;
  for (let i = 0; i < 15; i++) {
    const r = (k: string) => random(`house-${k}-${i}`);
    const w = 8 + Math.round(r('w') * 6) / 2;
    list.push({
      id: i,
      x: cursor + w / 2,
      w,
      d: 9 + r('d') * 2,
      floors: 2 + Math.floor(r('f') * 2.2),
      wall: WALLS[i % WALLS.length],
      roof: ROOFS[Math.floor(r('roof') * ROOFS.length)],
      flatRoof: r('flat') < 0.25,
      balcony: r('bal') < 0.7,
      sign: r('sign') < 0.65 ? SIGNS[i % SIGNS.length] : null,
      awning: r('aw') < 0.6 ? [SIGNS[(i + 2) % SIGNS.length], '#f7f3ea'] : null,
      // a wave of collapse runs west along the seafront, so the shot of the row sees every house go
      breakG: 0,
      partsG: 3.4 + r('pg') * 1.9,
      tilt: (r('tilt') - 0.5) * 0.16,
    });
    cursor += w + 1.2 + r('gap') * 1.4;
  }
  list.forEach((h) => (h.breakG = h.x < -12 ? 6.7 + (1.8 * (-12 - h.x)) / 53 : h.x < 20 ? 6.6 + (0.3 * (20 - h.x)) / 32 : 8.6 + random(`house-bg-${h.id}`) * 0.9));
  return list;
})();

const FLOOR_H = 3.1;
const GLASS = '#6d8fa8';
const FRAME = '#f7f5ef';

// A window: a white frame with the glass 2 cm in front of it, both half sunk into the wall at z = 0.
const Win: React.FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) => (
  <>
    <Box size={[w + 0.24, h + 0.24, 0.08]} position={[x, y, 0]} color={FRAME} shadow={false} />
    <Box size={[w, h, 0.12]} position={[x, y, 0]} color={GLASS} shadow={false} />
  </>
);

// Things that fall off a wall: they drop, turn and come to rest on the sidewalk.
const fallPose = (v: number, t0: number, height: number) => {
  const t = Math.max(0, v - t0);
  const tLand = Math.sqrt((2 * height) / 22);
  const k = Math.min(1, t / tLand);
  return {k, drop: Math.min(height, 11 * t * t), landed: t >= tLand};
};

const Balcony: React.FC<{h: HouseSpec; v: number}> = ({h, v}) => {
  const t0 = vAtG(h.partsG);
  const y0 = DECK + FLOOR_H; // slab top
  const {k, drop} = fallPose(v, t0, y0 - DECK - 0.18);
  const z0 = -0.63; // slab centre, 2 cm into the wall
  const pos: V3 = [0, y0 - 0.09 - drop, z0 - 0.5 * k];
  const rot: V3 = [-0.5 * Math.sin(Math.PI * k) - 0.06 * k, 0, (h.tilt > 0 ? 1 : -1) * 0.1 * k];
  return (
    <group position={pos} rotation={rot}>
      <Box size={[2.8, 0.18, 1.3]} color="#e9e4da" />
      <Box size={[2.8, 0.07, 0.07]} position={[0, 1.09, -0.61]} color="#3b3f46" />
      {[-1.37, 1.37].map((x) => (
        <Box key={x} size={[0.07, 0.07, 1.25]} position={[x, 1.09, 0.02]} color="#3b3f46" />
      ))}
      {[-1.3, -0.65, 0, 0.65, 1.3].map((x) => (
        <Box key={x} size={[0.06, 1.0, 0.06]} position={[x, 0.59, -0.61]} color="#3b3f46" />
      ))}
      {/* a flower pot */}
      <Cyl rTop={0.18} rBottom={0.13} height={0.3} segments={6} position={[0.9, 0.24, -0.2]} color="#c0643c" />
      <Ico radius={0.24} position={[0.9, 0.5, -0.2]} color="#5f9f4c" />
    </group>
  );
};

const BladeSign: React.FC<{h: HouseSpec; v: number}> = ({h, v}) => {
  const t0 = vAtG(h.partsG) - 0.4;
  const y0 = DECK + 3.0;
  const {k, drop, landed} = fallPose(v, t0, y0 - DECK - 0.06);
  const x = -h.w / 2 + 0.9;
  const pos: V3 = [x, y0 - drop + (landed ? 0 : 0), -0.75 - 0.6 * k];
  const rot: V3 = [0.4 * Math.sin(Math.PI * k), 0, (Math.PI / 2) * k];
  return (
    <>
      {/* the bracket stays on the wall */}
      <Box size={[0.08, 0.08, 1.25]} position={[x, DECK + 3.5, -0.6]} color="#2f3238" />
      <group position={pos} rotation={rot}>
        <Box size={[0.1, 0.9, 1.0]} color={h.sign!} />
        {[-0.07, 0.07].map((sx) => (
          <Cyl key={sx} rTop={0.3} rBottom={0.3} height={0.02} segments={10} position={[sx, 0, 0]} rotation={[0, 0, Math.PI / 2]} color="#fff6e0" shadow={false} />
        ))}
      </group>
    </>
  );
};

const Awning: React.FC<{h: HouseSpec; v: number; x: number; w: number}> = ({h, v, x, w}) => {
  const droop = 0.6 * collapse(v, h.partsG + 0.8, 1.2);
  const n = 7;
  const sw = w / n;
  return (
    <group position={[x, 2.75, 0.02]} rotation={[-0.32 - droop, 0, 0]}>
      {Array.from({length: n}, (_, i) => (
        <Box key={i} size={[sw, 0.06, 1.45]} position={[-w / 2 + sw * (i + 0.5), 0, -0.7]} color={i % 2 ? h.awning![1] : h.awning![0]} />
      ))}
    </group>
  );
};

const House: React.FC<{h: HouseSpec; v: number}> = ({h, v}) => {
  const H = h.floors * FLOOR_H;
  const tb = vAtG(h.breakG);
  const k = ramp(v, tb, tb + 0.9, (t) => t * t);
  const s = (1 - 0.86 * k) * squash(v);
  const nWin = Math.max(2, Math.floor((h.w - 1) / 2.6));
  const shopX = -h.w * 0.12;
  const shopW = h.w * 0.55;
  return (
    <>
      <group position={[h.x, DECK, FRONT_Z]}>
        <group scale={[1 + 0.08 * k, Math.max(0.01, s), 1]} rotation={[0.04 * k, 0, h.tilt * k]}>
          <Box size={[h.w, H, h.d]} position={[0, H / 2, h.d / 2]} color={h.wall} />
          {/* ground floor: shop window and door */}
          <Win x={shopX} y={1.25} w={shopW} h={1.7} />
          <Box size={[1.0, 2.2, 0.12]} position={[h.w * 0.32, 1.1, 0]} color="#7a5236" shadow={false} />
          {/* upper floors */}
          {Array.from({length: h.floors - 1}, (_, f) =>
            Array.from({length: nWin}, (_, j) => {
              const wx = -h.w / 2 + (h.w / nWin) * (j + 0.5);
              const isDoor = h.balcony && f === 0 && Math.abs(wx) < h.w / nWin / 2 + 0.01;
              return isDoor ? (
                <Win key={`${f}-${j}`} x={wx} y={FLOOR_H * (f + 1) + 1.07} w={1.0} h={2.0} />
              ) : (
                <Win key={`${f}-${j}`} x={wx} y={FLOOR_H * (f + 1) + 1.55} w={1.05} h={1.35} />
              );
            }),
          )}
          {h.flatRoof ? (
            <Box size={[h.w + 0.3, 0.5, h.d + 0.3]} position={[0, H + 0.25, h.d / 2]} color={h.roof} />
          ) : (
            <Prism w={h.w + 0.6} d={h.d + 0.6} h={2.6} position={[0, H, h.d / 2]} color={h.roof} />
          )}
        </group>
        {h.awning && k < 0.3 ? <Awning h={h} v={v} x={shopX} w={shopW + 0.6} /> : null}
      </group>
      {/* balconies and signs fall before the house gives way, and stay on the sidewalk */}
      <SquashY base={DECK} s={v > tb ? squash(v) : 1}>
        <group position={[h.x, 0, FRONT_Z]}>
          {h.balcony ? <Balcony h={h} v={v} /> : null}
          {h.sign ? <BladeSign h={h} v={v} /> : null}
        </group>
      </SquashY>
      <Puff v={v} t0={tb + 0.75} position={[h.x, DECK, FRONT_Z + 2]} size={h.w * 0.28} seed={`hd-${h.id}`} color="#d9cbb3" life={2.6} />
    </>
  );
};

export const Houses: React.FC<{v: number}> = ({v}) => (
  <>
    {HOUSES.map((h) => (
      <House key={h.id} h={h} v={v} />
    ))}
  </>
);

// ---------- Water tower behind the houses ----------

export const WATER_TOWER: V3 = [36, DECK, 44];

export const WaterTower: React.FC<{v: number}> = ({v}) => {
  const k = collapse(v, 9, 1.0);
  const legH = 15 * (1 - 0.72 * k);
  const s = squash(v);
  return (
    <SquashY base={DECK} s={s}>
      <group position={WATER_TOWER}>
        {[
          [-2.4, -2.4],
          [2.4, -2.4],
          [2.4, 2.4],
          [-2.4, 2.4],
        ].map(([x, z], i) => (
          <Beam key={i} from={[x * (1 + 0.6 * k), 0, z * (1 + 0.6 * k)]} to={[x * 0.85, legH, z * 0.85]} r={0.22} color="#6b5a4a" />
        ))}
        <Beam from={[-2.2, legH * 0.5, -2.2]} to={[2.2, legH * 0.5, 2.2]} r={0.08} color="#6b5a4a" />
        <Beam from={[2.2, legH * 0.5, -2.2]} to={[-2.2, legH * 0.5, 2.2]} r={0.08} color="#6b5a4a" />
        <group position={[0, legH, 0]} rotation={[0.18 * k, 0, -0.12 * k]}>
          <Cyl rTop={3.6} rBottom={3.6} height={5} segments={12} position={[0, 2.5, 0]} color="#c7c9cc" />
          <Cone radius={3.9} height={2.2} segments={12} position={[0, 6.1, 0]} color="#8c4a3c" />
          <Box size={[3.4, 1.1, 0.1]} position={[0, 2.8, -3.62]} color="#2f6fa8" shadow={false} />
        </group>
      </group>
      <Puff v={v} t0={vAtG(9) + 0.6} position={[WATER_TOWER[0], DECK, WATER_TOWER[2]]} size={5} seed="wt" color="#d9cbb3" life={4} />
    </SquashY>
  );
};

// ---------- Promenade: railing, palms, lamps, benches, kiosk ----------

export const Railing: React.FC<{from: number; to: number; z: number}> = ({from, to, z}) => {
  const n = Math.max(1, Math.round((to - from) / 2.5));
  return (
    <>
      <Box size={[to - from, 0.07, 0.07]} position={[(from + to) / 2, DECK + 1.05, z]} color="#f1f1ee" />
      <Box size={[to - from, 0.05, 0.05]} position={[(from + to) / 2, DECK + 0.55, z]} color="#f1f1ee" />
      {Array.from({length: n + 1}, (_, i) => (
        <Box key={i} size={[0.08, 1.04, 0.09]} position={[from + ((to - from) * i) / n, DECK + 0.52, z]} color="#f1f1ee" />
      ))}
    </>
  );
};

export const PALMS: [number, number][] = [
  [-48, 9.1],
  [-34, 9.1],
  [-21, 9.1],
  [18, 9.1],
  [30, 9.1],
  [42, 9.1],
  [56, 9.1],
];

const Palm: React.FC<{x: number; z: number; v: number; i: number}> = ({x, z, v, i}) => {
  const g = gAt(v);
  const droop = 0.3 + 0.75 * clamp01(Math.log10(g) / 1.3);
  const fall = collapse(v, 22 + i * 1.5, 1.1);
  const dir = random(`palm-dir-${i}`) * Math.PI * 2;
  const lean = 0.08 + 0.04 * i;
  const nutsDrop = since(v, 2.6 + i * 0.1);
  return (
    <group position={[x, DECK, z]} rotation={[0, dir, 0]}>
      <group rotation={[(Math.PI / 2 - 0.05) * fall, 0, 0]}>
        {Array.from({length: 6}, (_, s) => (
          <Cyl key={s} rTop={0.2 - s * 0.012} rBottom={0.24 - s * 0.012} height={1.2} segments={6} position={[0, 0.6 + s * 1.15, lean * s * s * 0.12]} rotation={[lean * s * 0.1, 0, 0]} color={s % 2 ? '#8a6a48' : '#7d5f40'} />
        ))}
        <group position={[0, 7.1, lean * 25 * 0.12]}>
          {Array.from({length: 8}, (_, f) => (
            <group key={f} rotation={[0, (f / 8) * Math.PI * 2 + i, 0]}>
              <group rotation={[droop + (f % 2) * 0.12, 0, 0]}>
                <Box size={[0.6, 0.06, 3.3]} position={[0, 0, 1.9]} color={f % 2 ? '#4f8f3e' : '#5fa04a'} />
              </group>
            </group>
          ))}
          <Ico radius={0.45} position={[0, 0.05, 0]} color="#5a8f45" />
          {nutsDrop < 0
            ? [0, 1, 2].map((n) => <Ico key={n} radius={0.17} position={[Math.cos(n * 2.1) * 0.3, -0.25, Math.sin(n * 2.1) * 0.3]} color="#6b4b2a" />)
            : null}
        </group>
      </group>
    </group>
  );
};

export const Promenade: React.FC<{v: number}> = ({v}) => {
  const s = squash(v);
  return (
    <SquashY base={DECK} s={s}>
      <Railing from={-150} to={-5.4} z={0.3} />
      <Railing from={5.4} to={150} z={0.3} />
      {PALMS.map(([x, z], i) => (
        <Palm key={i} x={x} z={z} v={v} i={i} />
      ))}
      {[-41, -27, 24, 36, 49].map((x, i) => {
        const bend = collapse(v, 22 + i * 2, 0.9);
        return (
          <group key={x} position={[x, DECK, 9.5]} rotation={[0, 0, (i % 2 ? 1 : -1) * 1.45 * bend]}>
            <LampPost position={[0, 0, 0]} />
          </group>
        );
      })}
      {[-26, 22, 34].map((x) => (
        <Bench key={x} position={[x, DECK, 2.0]} rot={Math.PI} />
      ))}
    </SquashY>
  );
};

// Ice cream kiosk next to the pier; the big cone on its roof is the first thing to fall.
export const KIOSK: V3 = [11.5, DECK, 5.8];

export const Kiosk: React.FC<{v: number}> = ({v}) => {
  const t0 = vAtG(3.3);
  const kf = clamp01((v - t0) / 0.55);
  const conePos: V3 = [0.4 + 0.3 * kf, lerp(2.73, 0.36, kf * kf), 2.2 * kf];
  const crush = collapse(v, 8.5, 0.8);
  return (
    <SquashY base={DECK} s={squash(v)}>
      <group position={KIOSK} rotation={[0, Math.PI, 0]}>
        <group scale={[1, 1 - 0.7 * crush, 1]}>
          <Box size={[3.4, 2.6, 2.4]} position={[0, 1.3, 0]} color="#f7f1e6" />
          <Box size={[3.6, 0.12, 2.6]} position={[0, 2.66, 0]} color="#e46a8f" />
          {/* counter window facing the promenade */}
          <Box size={[2.6, 1.0, 0.1]} position={[0, 1.55, 1.22]} color="#3a3a42" shadow={false} />
          <Box size={[2.9, 0.1, 0.5]} position={[0, 0.97, 1.42]} color="#e46a8f" />
          {Array.from({length: 6}, (_, i) => (
            <Box key={i} size={[0.6, 0.05, 1.1]} position={[-1.5 + i * 0.6, 2.35, 1.6]} rotation={[0.35, 0, 0]} color={i % 2 ? '#ffffff' : '#e46a8f'} />
          ))}
        </group>
        {/* the big cone sign */}
        <group position={conePos} rotation={[0, 0, 1.45 * kf]}>
          <Cone radius={0.45} height={1.4} segments={8} position={[0, 0.7, 0]} rotation={[Math.PI, 0, 0]} color="#d9a35a" />
          <Ico radius={0.55} detail={1} position={[0, 1.55, 0]} color="#f6c3d2" />
        </group>
      </group>
    </SquashY>
  );
};

// ---------- Parked cars ----------

const CARS: [number, number, string, number][] = [
  [-38, 11.6, '#d9493b', 0],
  [-26.5, 11.6, '#3f7cc4', 0],
  [-15, 15.6, '#f0c23b', Math.PI],
  [16, 11.6, '#4a9a6a', 0],
  [27, 11.6, '#ececec', 0],
  [39, 15.6, '#8a5ac0', Math.PI],
];

export const Cars: React.FC<{v: number}> = ({v}) => (
  <SquashY base={ROAD_Y} s={squash(v)}>
    {CARS.map(([x, z, color, rot], i) => (
      <group key={i} position={[x, ROAD_Y, z]} rotation={[0, rot, 0]}>
        <Car color={color} crush={collapse(v, 22 + i * 1.2, 0.6)} />
      </group>
    ))}
  </SquashY>
);
