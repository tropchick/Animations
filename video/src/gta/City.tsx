import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box, Cyl, Ico} from '../scene/parts';
import {V3, lerp, rnd} from './cues';
import {ASH, CAR_COLORS, Car, ICE, Palm, SOOT, mix} from './props';
import {drawBillboard, useCanvas} from './tex';

// A low-poly seaside avenue at dusk: the ocean to -z, the beach, a promenade with palms, the avenue along x,
// a row of pastel art-deco houses facing the sea (fronts at z = 12) and glass towers behind them.
// A cross street runs inland along +z at x = 0.

export const SEA_Y = -0.6;
export const BEACH_Z: [number, number] = [-34, -9];
export const PROM_Z: [number, number] = [-9, -4];
export const ROAD_Z: [number, number] = [-4, 8];
export const WALK_Z: [number, number] = [8, 12];
export const FRONT_Z = 12;
export const BILL: V3 = [6, -0.2, -15];

export type CityState = {
  t: number;
  lightsAt: (x: number, z: number) => number; // windows, neon and lamps 0..1
  frostAt: (z: number) => number; // 0..1, white ice
  ash: number; // grey dust over everything
  ruin: number; // houses broken down to stumps
  wreck: number; // after the tsunami: palms broken, cars thrown about
  palms?: boolean;
};

const tint = (c: string, st: CityState, z: number) => mix(mix(c, ASH, st.ash), ICE, st.frostAt(z));

// ---------- houses and towers ----------

type House = {x: number; w: number; d: number; h: number; color: string; trim: string; neon: string; z: number; tower?: boolean};

const PASTEL = ['#f4b6c8', '#9fdcd0', '#f7e2a0', '#c9b6f0', '#ffd2b0', '#bfe3f5', '#f8f1e4'];
const NEON = ['#ff3d8b', '#38f2ff', '#ffe14a', '#b44dff', '#ff7a3d'];

export const HOUSES: House[] = (() => {
  const out: House[] = [];
  for (const side of [-1, 1]) {
    let x = side * 7;
    let i = side > 0 ? 0 : 50;
    while (Math.abs(x) < 150) {
      const w = 10 + Math.floor(rnd(i * 3 + 1) * 8);
      const h = 9 + Math.floor(rnd(i * 3 + 2) * 4) * 3.2;
      out.push({
        x: x + (side * w) / 2,
        w: w - 0.6,
        d: 14,
        h,
        color: PASTEL[i % PASTEL.length],
        trim: '#ffffff',
        neon: NEON[i % NEON.length],
        z: FRONT_Z,
      });
      x += side * w;
      i++;
    }
  }
  // the cross street's own walls, inland
  for (const side of [-1, 1]) {
    for (let k = 0; k < 5; k++) {
      const i = 100 + k + (side > 0 ? 10 : 0);
      out.push({
        x: side * 14,
        w: 13,
        d: 13,
        h: 10 + Math.floor(rnd(i) * 4) * 3.2,
        color: PASTEL[(i + 2) % PASTEL.length],
        trim: '#ffffff',
        neon: NEON[i % NEON.length],
        z: FRONT_Z + 15 + k * 14,
      });
    }
  }
  // glass towers further back
  for (let k = 0; k < 14; k++) {
    const x = -130 + k * 20 + rnd(k + 300) * 8;
    if (Math.abs(x) < 26) continue;
    out.push({
      x,
      w: 12 + rnd(k + 310) * 6,
      d: 12,
      h: 38 + rnd(k + 320) * 45,
      color: ['#5f8fb0', '#7fb0c8', '#4f7a9a', '#8fa8c0'][k % 4],
      trim: '#d8e6ee',
      neon: NEON[(k + 2) % NEON.length],
      z: 48 + rnd(k + 330) * 30,
      tower: true,
    });
  }
  return out;
})();

// how much of a house is left in the ruins
const ruinH = (b: House, i: number, ruin: number) => b.h * lerp(1, 0.18 + rnd(i + 900) * 0.32, ruin);

const HouseBody: React.FC<{b: House; i: number; st: CityState}> = ({b, i, st}) => {
  const h = ruinH(b, i, st.ruin);
  const zc = b.z + b.d / 2;
  const c = tint(b.color, st, b.z);
  const trim = tint(b.trim, st, b.z);
  const lit = st.lightsAt(b.x, b.z);
  const snow = st.frostAt(b.z) > 0.6;
  const parts: React.ReactNode[] = [<Box key="body" size={[b.w, h, b.d]} position={[b.x, h / 2, zc]} color={c} />];
  if (st.ruin < 0.5) {
    parts.push(<Box key="trim" size={[b.w + 0.3, 0.6, b.d + 0.3]} position={[b.x, h - 0.27, zc]} color={trim} />);
    if (!b.tower) {
      // art-deco front: a raised centre panel and a ground-floor awning
      parts.push(<Box key="panel" size={[b.w * 0.3, h * 0.92 + 1.2, 0.5]} position={[b.x, (h * 0.92 + 1.2) / 2, b.z - 0.2]} color={trim} />);
      parts.push(<Box key="awn" size={[b.w * 0.86, 0.18, 1.6]} position={[b.x, 3.2, b.z - 0.8]} color={tint(PASTEL[(i + 3) % PASTEL.length], st, b.z)} />);
    }
    // neon strip down the front edge
    parts.push(
      <Box
        key="neon"
        size={[0.22, h * 0.7, 0.22]}
        position={[b.x - b.w / 2 + 0.5, h * 0.45, b.z - 0.15]}
        color={lit > 0.5 ? b.neon : tint('#3a3a44', st, b.z)}
        emissive={lit > 0.5 ? b.neon : undefined}
        emissiveIntensity={2.2 * lit}
        shadow={false}
      />,
    );
  } else {
    // broken top: a few jagged chunks
    for (let k = 0; k < 3; k++) {
      const ch = 1 + rnd(i * 7 + k) * 3;
      parts.push(
        <Box
          key={`j${k}`}
          size={[b.w * 0.3, ch, b.d * 0.5]}
          position={[b.x + (k - 1) * b.w * 0.32, h + ch / 2 - 0.3, zc + (rnd(i + k) - 0.5) * 4]}
          rotation={[0.1 * (rnd(i * 3 + k) - 0.5), 0, 0.25 * (rnd(i * 5 + k) - 0.5)]}
          color={c}
        />,
      );
    }
  }
  if (snow) parts.push(<Box key="snow" size={[b.w + 0.4, 0.5, b.d + 0.4]} position={[b.x, h + 0.25, zc]} color="#f4f8fb" />);
  return <>{parts}</>;
};

// all the windows of all houses in one instanced mesh
type Win = {p: V3; s: V3; house: number; y: number; luck: number};
const WINDOWS: Win[] = (() => {
  const out: Win[] = [];
  HOUSES.forEach((b, i) => {
    const floorH = 3.2;
    const floors = Math.floor((b.h - 1.5) / floorH);
    const cols = Math.max(2, Math.floor(b.w / (b.tower ? 2.2 : 3.2)));
    for (let f = b.tower ? 0 : 1; f < floors; f++) {
      for (let c = 0; c < cols; c++) {
        const x = b.x - b.w / 2 + (c + 0.5) * (b.w / cols);
        if (!b.tower && Math.abs(x - b.x) < b.w * 0.17) continue; // the centre panel
        const y = f * floorH + 1.8;
        out.push({p: [x, y, b.z - 0.06], s: [b.tower ? 1.4 : 1.5, b.tower ? 2.2 : 1.8, 0.2], house: i, y, luck: rnd(i * 131 + f * 17 + c)});
      }
    }
  });
  return out;
})();

const M = new THREE.Matrix4();
const C = new THREE.Color();
const WARM = new THREE.Color('#ffd890');
const DARK = new THREE.Color('#1c2233');

const Windows: React.FC<{st: CityState}> = ({st}) => {
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({toneMapped: false}), WINDOWS.length);
    m.frustumCulled = false;
    return m;
  }, []);
  WINDOWS.forEach((w, i) => {
    const b = HOUSES[w.house];
    const top = ruinH(b, w.house, st.ruin);
    if (w.y + w.s[1] / 2 > top - 0.3) {
      M.makeScale(0, 0, 0);
    } else {
      M.makeScale(...w.s).setPosition(...w.p);
    }
    mesh.setMatrixAt(i, M);
    const on = w.luck < 0.62 ? st.lightsAt(w.p[0], w.p[2]) : 0;
    C.copy(DARK).lerp(WARM, on);
    if (st.ash > 0) C.lerp(new THREE.Color('#3a3733'), st.ash);
    const f = st.frostAt(b.z);
    if (f > 0) C.lerp(new THREE.Color('#bcd2e2'), f * 0.8);
    mesh.setColorAt(i, C);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return <primitive object={mesh} />;
};

export const Houses: React.FC<{st: CityState}> = ({st}) => (
  <>
    {HOUSES.map((b, i) => (
      <HouseBody key={i} b={b} i={i} st={st} />
    ))}
    <Windows st={st} />
  </>
);

// ---------- ground: sea, beach, promenade, avenue, sidewalk, cross street ----------

// strips along z so the frost front can sweep over them
const Strip: React.FC<{z0: number; z1: number; y: number; color: string; st: CityState; n?: number; x0?: number; x1?: number}> = ({
  z0,
  z1,
  y,
  color,
  st,
  n = 4,
  x0 = -300,
  x1 = 300,
}) => (
  <>
    {Array.from({length: n}).map((_, k) => {
      const a = lerp(z0, z1, k / n);
      const b = lerp(z0, z1, (k + 1) / n);
      return <Box key={k} size={[x1 - x0, 1, b - a]} position={[(x0 + x1) / 2, y - 0.5, (a + b) / 2]} color={tint(color, st, (a + b) / 2)} shadow={false} />;
    })}
  </>
);

export const Ground: React.FC<{st: CityState; seaLevel?: number; seaColor?: string; iceTo?: number}> = ({st, seaLevel = SEA_Y, seaColor = '#1f5f7a', iceTo}) => (
  <>
    {/* the sea */}
    <mesh position={[0, seaLevel, -1490]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[6000, 2980]} />
      <meshStandardMaterial color={mix(seaColor, ASH, st.ash * 0.8)} roughness={0.35} metalness={0.1} flatShading />
    </mesh>
    {iceTo !== undefined && iceTo > -3000 ? (
      <Box size={[6000, 0.6, Math.min(iceTo, -20) + 3000]} position={[0, seaLevel + 0.15, (Math.min(iceTo, -20) - 3000) / 2]} color="#e6f0f6" shadow={false} />
    ) : null}
    {Array.from({length: 12}).map((_, k) => {
      const a = lerp(-70, BEACH_Z[1], k / 12);
      const b = lerp(-70, BEACH_Z[1], (k + 1) / 12);
      const y = lerp(-0.45, 0, (k + 1) / 12);
      return <Box key={k} size={[600, 1, b - a]} position={[0, y - 0.5, (a + b) / 2]} color={tint('#e8cf9a', st, (a + b) / 2)} shadow={false} />;
    })}
    <Strip z0={PROM_Z[0]} z1={PROM_Z[1]} y={0.14} color="#e9a9a0" st={st} n={2} />
    <Strip z0={ROAD_Z[0]} z1={ROAD_Z[1]} y={0.02} color="#3a3d45" st={st} n={4} />
    <Strip z0={WALK_Z[0]} z1={WALK_Z[1]} y={0.16} color="#c9c2b6" st={st} n={2} />
    {/* behind the houses and the cross street */}
    <Strip z0={FRONT_Z} z1={140} y={0.02} color="#3a3d45" st={st} n={8} x0={-6} x1={6} />
    <Strip z0={FRONT_Z} z1={140} y={0.0} color="#8d8a84" st={st} n={6} x0={-300} x1={-6.05} />
    <Strip z0={FRONT_Z} z1={140} y={0.0} color="#8d8a84" st={st} n={6} x0={6.05} x1={300} />
    {/* lane marks, 1.5 cm proud of the asphalt */}
    {st.ruin < 0.5
      ? Array.from({length: 40}).map((_, k) => (
          <Box key={k} size={[3, 0.03, 0.18]} position={[-200 + k * 10, 0.035, 2]} color={tint('#f2efe4', st, 2)} shadow={false} />
        ))
      : null}
  </>
);

// ---------- street lamps on the promenade ----------

export const LAMPS: V3[] = Array.from({length: 22}).map((_, k) => [-168 + k * 16, 0.14, -4.6]);

export const Lamps: React.FC<{st: CityState; sparks?: (x: number) => number}> = ({st, sparks}) => (
  <>
    {LAMPS.map((p, k) => {
      const on = st.lightsAt(p[0], p[2]);
      const sp = sparks ? sparks(p[0]) : 0;
      const pole = tint('#2e3138', st, p[2]);
      return (
        <group key={k} position={p}>
          <Cyl rTop={0.08} rBottom={0.12} height={6} position={[0, 3, 0]} color={pole} segments={6} />
          <Box size={[1.4, 0.12, 0.14]} position={[0.6, 5.9, 0]} color={pole} />
          <Box size={[0.5, 0.2, 0.36]} position={[1.2, 5.8, 0]} color={on > 0.5 ? '#fff1c4' : tint('#555a60', st, p[2])} emissive={on > 0.5 ? '#ffd27a' : undefined} emissiveIntensity={2 * on} shadow={false} />
          {/* the transformer box that bursts in the blackout */}
          <Box size={[0.5, 0.7, 0.5]} position={[0, 4.4, 0.2]} color={tint('#5c6066', st, p[2])} />
          {sp > 0
            ? Array.from({length: 8}).map((_, i) => {
                const a = (i / 8) * Math.PI * 2 + k;
                const r = (1 - sp) * 1.8 + 0.1;
                return (
                  <Ico
                    key={i}
                    radius={0.08 + 0.12 * sp}
                    position={[Math.cos(a) * r, 4.4 + Math.sin(a * 1.7) * r * 0.6 - (1 - sp) * 1.2, 0.3 + Math.sin(a) * r]}
                    color="#fff6c8"
                    emissive="#ffe08a"
                    emissiveIntensity={3}
                    shadow={false}
                  />
                );
              })
            : null}
        </group>
      );
    })}
  </>
);

// ---------- palms along the promenade ----------

export const PALMS: V3[] = Array.from({length: 26}).map((_, k) => [-196 + k * 16 + 8 + (rnd(k + 40) - 0.5) * 3, 0.14, -6.8 + (rnd(k + 41) - 0.5)]);

export const Palms: React.FC<{st: CityState; sway?: number; bendFrom?: (x: number, z: number) => number}> = ({st, sway = 0, bendFrom}) => (
  <>
    {PALMS.map((p, k) => {
      const broken = st.wreck > 0.5 && rnd(k + 70) < 0.6 ? 1 : 0;
      const lean = bendFrom ? bendFrom(p[0], p[2]) : st.wreck * (rnd(k + 80) - 0.3) * 0.5;
      return (
        <Palm
          key={k}
          position={p}
          seed={k + 11}
          lean={lean}
          sway={sway * Math.sin(st.t * 1.3 + k)}
          frost={st.frostAt(p[2])}
          broken={st.ruin > 0.5 ? 1 : broken}
          burnt={st.ash}
        />
      );
    })}
  </>
);

// ---------- traffic ----------

export type CarSpec = {x: number; z: number; rot: number; color: string};
export const PARKED: CarSpec[] = [-40, -24, -16, -8, 0, 16, 26, 44].map((x, k) => ({x, z: 6.2, rot: 0, color: CAR_COLORS[k % CAR_COLORS.length]}));

export const ParkedCars: React.FC<{st: CityState; crush?: (k: number) => number; burnt?: (k: number) => number; skip?: number[]}> = ({st, crush, burnt, skip = []}) => (
  <>
    {PARKED.map((c, k) =>
      skip.includes(k) ? null : (
        <Car
          key={k}
          position={[c.x + st.wreck * (rnd(k + 5) - 0.5) * 6, 0.02, c.z + st.wreck * rnd(k + 6) * 4]}
          rotation={c.rot + st.wreck * (rnd(k + 7) - 0.5) * 1.6}
          color={c.color}
          crush={crush ? crush(k) : 0}
          burnt={Math.max(burnt ? burnt(k) : 0, st.ash * 0.6)}
          frost={st.frostAt(c.z)}
        />
      ),
    )}
  </>
);

// ---------- the billboard ----------

export const Billboard: React.FC<{
  cover?: number;
  paint?: number;
  year?: string;
  lit?: number;
  st: CityState;
  tilt?: number; // pushed over inland (radians, top towards +z)
  sink?: number; // buried in ash (m)
  base?: string; // the year under the roller
}> = ({cover = 0, paint = 0, year = '2027', lit = 1, st, tilt = 0, sink = 0, base = '2026'}) => {
  const W = 1400;
  const H = 600;
  const dead = st.ruin;
  const tex = useCanvas(W, H, `${cover.toFixed(3)}-${paint.toFixed(3)}-${year}-${dead.toFixed(2)}-${base}`, (g) => drawBillboard(g, W, H, cover, paint, year, dead, base));
  const frame = tint('#2a2a33', st, BILL[2]);
  return (
    <group position={[BILL[0], BILL[1] - sink, BILL[2]]}>
      <group rotation={[tilt, 0, 0]}>
        <Box size={[0.5, 8, 0.5]} position={[-4, 4, 0]} color={frame} />
        <Box size={[0.5, 8, 0.5]} position={[4, 4, 0]} color={frame} />
        <Box size={[14.6, 6.6, 0.5]} position={[0, 10.5, -0.05]} color={frame} />
        <mesh position={[0, 10.5, 0.215]}>
          <planeGeometry args={[14, 6]} />
          {lit > 0.01 ? <meshBasicMaterial map={tex} toneMapped={false} color={new THREE.Color(1, 1, 1).multiplyScalar(0.35 + 0.65 * lit)} /> : <meshStandardMaterial map={tex} roughness={0.9} />}
        </mesh>
        {/* lamps along the top */}
        {[-5, -1.7, 1.7, 5].map((x) => (
          <group key={x}>
            <Box size={[0.12, 0.12, 1.2]} position={[x, 14, 0.5]} color={frame} />
            <Box size={[0.5, 0.25, 0.3]} position={[x, 13.95, 1.1]} color={lit > 0.5 ? '#fff6dc' : '#55565c'} emissive={lit > 0.5 ? '#fff0c0' : undefined} emissiveIntensity={2 * lit} shadow={false} />
          </group>
        ))}
        {st.frostAt(BILL[2]) > 0.6 ? <Box size={[14.8, 0.4, 0.9]} position={[0, 14.0, -0.05]} color="#f4f8fb" /> : null}
      </group>
    </group>
  );
};

// the worker's cherry picker in front of the billboard
export const CherryPicker: React.FC<{basketX: number; st: CityState; children?: React.ReactNode}> = ({basketX, st, children}) => {
  const base: V3 = [BILL[0] - 2.5, 0.14, BILL[2] + 6];
  const basket: V3 = [BILL[0] + basketX, 4.8, BILL[2] + 1.6];
  const d = new THREE.Vector3(basket[0] - base[0], basket[1] - (base[1] + 1.8), basket[2] - base[2]);
  const len = d.length();
  const mid = new THREE.Vector3(base[0], base[1] + 1.8, base[2]).add(d.clone().multiplyScalar(0.5));
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  const e = new THREE.Euler().setFromQuaternion(q);
  const yellow = tint('#f2b51f', st, base[2]);
  return (
    <>
      <group position={base}>
        <Box size={[2.4, 1.2, 5]} position={[0, 0.9, 0]} color={tint('#ececec', st, base[2])} />
        <Box size={[2.3, 1.1, 1.8]} position={[0, 1.6, 2.4]} color={tint('#ececec', st, base[2])} />
        <Box size={[2.32, 0.6, 0.5]} position={[0, 1.9, 3.1]} color="#6f8fa8" shadow={false} />
        {[
          [1.1, 1.8],
          [-1.1, 1.8],
          [1.1, -1.6],
          [-1.1, -1.6],
        ].map(([x, z], i) => (
          <Cyl key={i} rTop={0.45} rBottom={0.45} height={0.3} position={[x, 0.45, z]} rotation={[0, 0, Math.PI / 2]} color="#1d2430" segments={10} />
        ))}
      </group>
      <Box size={[0.35, len, 0.35]} position={[mid.x, mid.y, mid.z]} rotation={[e.x, e.y, e.z]} color={yellow} />
      <group position={basket}>
        <Box size={[1.6, 0.1, 1.1]} position={[0, 0, 0]} color={yellow} />
        <Box size={[1.6, 0.9, 0.06]} position={[0, 0.5, 0.53]} color={yellow} />
        <Box size={[1.6, 0.9, 0.06]} position={[0, 0.5, -0.53]} color={yellow} />
        <Box size={[0.06, 0.9, 1.1]} position={[0.8, 0.5, 0]} color={yellow} />
        <Box size={[0.06, 0.9, 1.1]} position={[-0.8, 0.5, 0]} color={yellow} />
        {children}
      </group>
    </>
  );
};

export {SOOT};
