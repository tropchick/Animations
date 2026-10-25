import React, {useMemo} from 'react';
import {Color, InstancedMesh, Matrix4, Object3D} from 'three';
import {random} from 'remotion';
import {Box, Cyl, Glow, Ico, Mat, Sign, Sun} from './parts';
import {HIP_H, Hand, Kostya} from './Kostya';
import {GREEN, V3, add3, smooth} from './cues';

// Kostya's yard: his nine-storey block (front face at z = 0), the entrance, the shop on the ground floor,
// parked cars, a playground, birches with yellow leaves, the block opposite and the street with the traffic light.
export const YARD_X = 200;
export const SHOP_X = 400;
const FLOOR_H = 2.8;
const PLINTH = 0.7;
const B_LEN = 72;
const B_DEP = 12;
const B_H = PLINTH + 9 * FLOOR_H + 0.4;
export const ENTRANCE: V3 = [YARD_X, 0, 0];
const PORCH_H = 0.52;
// the street at the east end of the block: one lane of cars stopped at the light
const STREET_X = 50.5;
export const CROSS: V3 = [YARD_X + STREET_X, 0, 0];
export const TILL: V3 = [SHOP_X + 0.1, 0.94, -0.28];

const PANEL: Mat = {color: '#c9c3b5', rough: 0.95};
const PANEL_SEAM: Mat = {color: '#a9a397', rough: 0.95};
const PLINTH_M: Mat = {color: '#8e8a82', rough: 0.95};
const ASPHALT: Mat = {color: '#3d3f42', rough: 0.45, env: 0.5};
const CURB: Mat = {color: '#a7a6a1', rough: 0.9};
const PAVING: Mat = {color: '#8f8e89', rough: 0.85};
const GRASS: Mat = {color: '#6f6b47', rough: 1};
const TRUNK: Mat = {color: '#e4e1d8', rough: 0.9};
const TRUNK_DARK: Mat = {color: '#2c2a27', rough: 0.9};
const STEEL: Mat = {color: '#7f868c', metal: 0.6, rough: 0.4, env: 0.8};
const PAINT_RED: Mat = {color: '#a8473b', rough: 0.6};
const PAINT_BLUE: Mat = {color: '#4c6f93', rough: 0.6};
const PAINT_YELLOW: Mat = {color: '#d1a53c', rough: 0.6};
const DOOR_M: Mat = {color: '#4a5056', metal: 0.4, rough: 0.5, env: 0.6};

// ---------------------------------------------------------------- the panel block

type Block = {x: number; z: number; len: number; face: 1 | -1; shopAt?: number; entrances: number[]};

const useInstances = (n: number, set: (o: Object3D, i: number, c: Color) => boolean | void) =>
  useMemo(() => {
    const o = new Object3D();
    const c = new Color();
    const mats: Matrix4[] = [];
    const cols: Color[] = [];
    for (let i = 0; i < n; i++) {
      o.position.set(0, 0, 0);
      o.rotation.set(0, 0, 0);
      o.scale.set(1, 1, 1);
      c.set('#ffffff');
      if (set(o, i, c) === false) continue;
      o.updateMatrix();
      mats.push(o.matrix.clone());
      cols.push(c.clone());
    }
    return {mats, cols};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

const Instances: React.FC<{data: {mats: Matrix4[]; cols: Color[]}; size: V3; m: Mat; lit?: boolean; shadow?: boolean}> = ({data, size, m, lit, shadow}) => {
  const ref = React.useCallback(
    (mesh: InstancedMesh | null) => {
      if (!mesh) return;
      data.mats.forEach((mt, i) => {
        mesh.setMatrixAt(i, mt);
        mesh.setColorAt(i, data.cols[i]);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    },
    [data],
  );
  if (data.mats.length === 0) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, data.mats.length]} castShadow={shadow} receiveShadow={!lit}>
      <boxGeometry args={size} />
      {lit ? (
        <meshBasicMaterial toneMapped={false} />
      ) : (
        <meshStandardMaterial color={m.color} roughness={m.rough ?? 0.85} metalness={m.metal ?? 0} envMapIntensity={m.env ?? 0.35} flatShading />
      )}
    </instancedMesh>
  );
};

export const PanelBlock: React.FC<{b: Block; night?: boolean; litShare?: number; seed: string}> = ({b, night = false, litShare = 0.35, seed}) => {
  const perFloor = Math.round(b.len / 3.0);
  const skip = (i: number, f: number) => {
    const u = -b.len / 2 + (b.len * (i + 0.5)) / perFloor;
    if (f === 0 && b.entrances.some((e) => Math.abs(u - e) < 2.0)) return true;
    if (f === 0 && b.shopAt !== undefined && Math.abs(u - b.shopAt) < 4.6) return true;
    return false;
  };
  const pos = (i: number, f: number, out: number): V3 => {
    const u = -b.len / 2 + (b.len * (i + 0.5)) / perFloor;
    return [b.x + u, PLINTH + f * FLOOR_H + 1.45, b.z + b.face * out];
  };
  const n = perFloor * 9;
  const glass = useInstances(n, (o, k, c) => {
    const i = k % perFloor;
    const f = Math.floor(k / perFloor);
    if (skip(i, f)) return false;
    o.position.set(...pos(i, f, 0.06));
    const r = random(`${seed}-${k}`);
    if (night && r < litShare) c.set(r < litShare * 0.25 ? '#ffe7b0' : r < litShare * 0.6 ? '#f4c27a' : '#e9d9b8').multiplyScalar(0.75 + 0.35 * random(`${seed}-l-${k}`));
    else c.set(night ? '#151b24' : r < 0.5 ? '#5d6a73' : '#4e5960');
  });
  const frames = useInstances(n, (o, k) => {
    const i = k % perFloor;
    const f = Math.floor(k / perFloor);
    if (skip(i, f)) return false;
    o.position.set(...pos(i, f, 0.03));
  });
  // balconies on every other window column, not on the ground floor
  const balconies = useInstances(n, (o, k) => {
    const i = k % perFloor;
    const f = Math.floor(k / perFloor);
    if (f === 0 || i % 4 !== 1) return false;
    const p = pos(i, f, 0.6);
    o.position.set(p[0] + 0.0, p[1] - 0.95, p[2]);
  });
  const rails = useInstances(n, (o, k) => {
    const i = k % perFloor;
    const f = Math.floor(k / perFloor);
    if (f === 0 || i % 4 !== 1) return false;
    const p = pos(i, f, 1.17);
    o.position.set(p[0], p[1] - 0.5, p[2]);
  });
  const seams = useInstances(10, (o, f) => {
    o.position.set(b.x, PLINTH + f * FLOOR_H, b.z + b.face * 0.01);
  });
  const cz = b.z - (b.face * B_DEP) / 2;
  return (
    <group>
      <Box size={[b.len, B_H, B_DEP]} position={[b.x, B_H / 2, cz]} m={PANEL} />
      <Box size={[b.len + 0.1, PLINTH, B_DEP + 0.1]} position={[b.x, PLINTH / 2, cz]} m={PLINTH_M} />
      <Box size={[b.len + 0.3, 0.45, B_DEP + 0.3]} position={[b.x, B_H + 0.1, cz]} m={PLINTH_M} />
      <Instances data={seams} size={[b.len + 0.04, 0.06, B_DEP + 0.04]} m={PANEL_SEAM} />
      <Instances data={frames} size={[1.5, 1.6, 0.06]} m={{color: '#e9e6de', rough: 0.7}} />
      <Instances data={glass} size={[1.3, 1.42, 0.04]} m={{color: '#4e5960'}} lit={night} />
      <Instances data={balconies} size={[2.6, 0.14, 1.2]} m={PANEL_SEAM} shadow />
      <Instances data={rails} size={[2.6, 0.95, 0.06]} m={{color: '#b9b3a6', rough: 0.9}} shadow />
    </group>
  );
};

// ---------------------------------------------------------------- props

const CAR_COLORS = ['#d9d9d4', '#9aa0a5', '#6d2a2a', '#2c3c55', '#c9b99a', '#1e2023', '#5b6b5a', '#b4b8bb'];

export const Car: React.FC<{position: V3; rot?: number; color: string; lights?: boolean}> = ({position, rot = 0, color, lights}) => {
  const body: Mat = {color, metal: 0.35, rough: 0.35, env: 0.9};
  const glass: Mat = {color: '#20272d', metal: 0.6, rough: 0.15, env: 1.2};
  return (
    <group position={position} rotation={[0, rot, 0]}>
      {/* local: nose towards -z */}
      <Box size={[1.76, 0.62, 4.3]} position={[0, 0.58, 0]} m={body} />
      <Box size={[1.6, 0.5, 2.1]} position={[0, 1.13, 0.25]} m={body} />
      <Box size={[1.62, 0.4, 1.96]} position={[0, 1.12, 0.25]} m={glass} />
      <Box size={[1.5, 0.36, 0.06]} position={[0, 1.07, -0.82]} rotation={[-0.5, 0, 0]} m={glass} />
      <Box size={[1.5, 0.34, 0.06]} position={[0, 1.07, 1.32]} rotation={[0.45, 0, 0]} m={glass} />
      {[-0.72, 0.72].map((x) =>
        [-1.35, 1.35].map((z) => <Cyl key={`${x}${z}`} r={0.32} h={0.24} seg={10} position={[x * 1.06, 0.32, z]} rotation={[0, 0, Math.PI / 2]} m={{color: '#151618', rough: 0.9}} />),
      )}
      <Box size={[0.36, 0.12, 0.04]} position={[-0.6, 0.72, -2.16]} m={{color: '#e8e6dc', rough: 0.3}} shadow={false} />
      <Box size={[0.36, 0.12, 0.04]} position={[0.6, 0.72, -2.16]} m={{color: '#e8e6dc', rough: 0.3}} shadow={false} />
      <Box size={[0.36, 0.12, 0.04]} position={[-0.62, 0.76, 2.16]} m={{color: lights ? '#ff3b2e' : '#6b1c18', rough: 0.3, emissive: lights ? '#ff2a1e' : undefined, glow: 1.5}} shadow={false} />
      <Box size={[0.36, 0.12, 0.04]} position={[0.62, 0.76, 2.16]} m={{color: lights ? '#ff3b2e' : '#6b1c18', rough: 0.3, emissive: lights ? '#ff2a1e' : undefined, glow: 1.5}} shadow={false} />
      <Box size={[0.52, 0.12, 0.03]} position={[0, 0.5, 2.165]} m={{color: '#e9e9e4', rough: 0.6}} shadow={false} />
    </group>
  );
};

export const Birch: React.FC<{position: V3; h?: number; seed: string; bare?: number}> = ({position, h = 7, seed, bare = 0.3}) => {
  const crowns = useMemo(
    () =>
      Array.from({length: 5}).map((_, i) => ({
        p: [(random(`${seed}x${i}`) - 0.5) * 2.2, h * 0.62 + random(`${seed}y${i}`) * h * 0.38, (random(`${seed}z${i}`) - 0.5) * 2.2] as V3,
        r: 0.9 + random(`${seed}r${i}`) * 0.9,
        c: ['#d8a93a', '#c98f2c', '#e1bd4d', '#b9852e'][Math.floor(random(`${seed}c${i}`) * 4)],
      })),
    [seed, h],
  );
  return (
    <group position={position}>
      <Cyl r={0.13} r2={0.17} h={h * 0.8} seg={7} position={[0, h * 0.4, 0]} m={TRUNK} />
      {[0.25, 0.45, 0.62].map((y) => (
        <Box key={y} size={[0.36, 0.06, 0.36]} position={[0, h * y, 0]} rotation={[0, y * 9, 0]} m={TRUNK_DARK} shadow={false} />
      ))}
      {crowns.slice(0, Math.round(5 * (1 - bare)) + 1).map((c, i) => (
        <Ico key={i} r={c.r} position={c.p} m={{color: c.c, rough: 0.9}} />
      ))}
    </group>
  );
};

const Bench: React.FC<{position: V3; rot?: number}> = ({position, rot = 0}) => (
  <group position={position} rotation={[0, rot, 0]}>
    {[-0.7, 0.7].map((x) => (
      <Box key={x} size={[0.08, 0.45, 0.45]} position={[x, 0.225, 0]} m={{color: '#2e3134', rough: 0.6}} />
    ))}
    {[-0.12, 0.0, 0.12].map((z) => (
      <Box key={z} size={[1.7, 0.04, 0.1]} position={[0, 0.47, z]} m={{color: '#6e5536', rough: 0.8}} />
    ))}
    {[0.65, 0.8].map((y) => (
      <Box key={y} size={[1.7, 0.1, 0.04]} position={[0, y, -0.22]} m={{color: '#6e5536', rough: 0.8}} />
    ))}
  </group>
);

const Playground: React.FC<{position: V3; swing: number}> = ({position, swing}) => (
  <group position={position}>
    {/* swing */}
    {[-1.3, 1.3].map((x) => (
      <group key={x}>
        <Box size={[0.08, 2.6, 0.08]} position={[x, 1.25, -0.6]} rotation={[0.24, 0, 0]} m={PAINT_BLUE} />
        <Box size={[0.08, 2.6, 0.08]} position={[x, 1.25, 0.6]} rotation={[-0.24, 0, 0]} m={PAINT_BLUE} />
      </group>
    ))}
    <Box size={[2.8, 0.08, 0.08]} position={[0, 2.5, 0]} m={PAINT_BLUE} />
    <group position={[0, 2.46, 0]} rotation={[swing, 0, 0]}>
      <Box size={[0.025, 1.9, 0.025]} position={[-0.24, -0.95, 0]} m={STEEL} shadow={false} />
      <Box size={[0.025, 1.9, 0.025]} position={[0.24, -0.95, 0]} m={STEEL} shadow={false} />
      <Box size={[0.56, 0.05, 0.3]} position={[0, -1.9, 0]} m={PAINT_RED} />
    </group>
    {/* slide */}
    <group position={[4.2, 0, 0.5]}>
      {[-0.35, 0.35].map((x) => (
        <Box key={x} size={[0.07, 1.6, 0.07]} position={[x, 0.8, -0.9]} m={PAINT_YELLOW} />
      ))}
      <Box size={[0.8, 0.07, 0.8]} position={[0, 1.6, -0.9]} m={PAINT_YELLOW} />
      <Box size={[0.7, 0.05, 2.6]} position={[0, 0.85, 0.6]} rotation={[0.62, 0, 0]} m={STEEL} />
      <Box size={[0.6, 1.7, 0.06]} position={[0, 0.85, -1.4]} rotation={[-0.25, 0, 0]} m={PAINT_RED} />
    </group>
    {/* sandbox */}
    <Box size={[2.4, 0.25, 2.4]} position={[-4.5, 0.125, 1]} m={{color: '#6e553b', rough: 0.9}} />
    <Box size={[2.2, 0.26, 2.2]} position={[-4.5, 0.125, 1]} m={{color: '#b8a27c', rough: 1}} />
  </group>
);

// fallen leaves: thin flat boxes, every one a little above the ground so nothing is coplanar
const Leaves: React.FC<{x0: number; x1: number; z0: number; z1: number; n: number; seed: string; y?: number}> = ({x0, x1, z0, z1, n, seed, y = 0}) => {
  const data = useInstances(n, (o, i, c) => {
    o.position.set(x0 + random(`${seed}a${i}`) * (x1 - x0), y + 0.012 + random(`${seed}h${i}`) * 0.01, z0 + random(`${seed}b${i}`) * (z1 - z0));
    o.rotation.set(0, random(`${seed}r${i}`) * 6.28, 0);
    c.set(['#d6a334', '#c4862a', '#e2bf4c', '#9f7a35'][Math.floor(random(`${seed}c${i}`) * 4)]);
  });
  return (
    <instancedMesh
      ref={(mesh: InstancedMesh | null) => {
        if (!mesh) return;
        data.mats.forEach((mt, i) => {
          mesh.setMatrixAt(i, mt);
          mesh.setColorAt(i, data.cols[i]);
        });
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
      }}
      args={[undefined, undefined, data.mats.length]}
      receiveShadow
    >
      <boxGeometry args={[0.09, 0.006, 0.06]} />
      <meshStandardMaterial roughness={0.9} flatShading />
    </instancedMesh>
  );
};

const TrafficLight: React.FC<{position: V3; green: boolean}> = ({position, green}) => (
  <group position={position}>
    <Cyl r={0.07} h={3.6} position={[0, 1.8, 0]} m={{color: '#3a3e42', metal: 0.5, rough: 0.5}} />
    <Box size={[0.36, 1.0, 0.24]} position={[0, 3.2, 0]} m={{color: '#25282b', rough: 0.6}} />
    {[0, 1, 2].map((i) => {
      const on = green ? i === 2 : i === 0;
      const col = ['#ff3b2e', '#ffb22e', '#33e07a'][i];
      return (
        <group key={i}>
          <Box size={[0.3, 0.05, 0.14]} position={[0, 3.56 - i * 0.32 + 0.12, 0.17]} m={{color: '#25282b', rough: 0.6}} shadow={false} />
          <Glow size={[0.2, 0.2, 0.02]} position={[0, 3.52 - i * 0.32, 0.125]} color={on ? col : '#1c1e1f'} power={on ? 2.2 : 1} />
        </group>
      );
    })}
    <pointLight position={[0, green ? 2.88 : 3.52, 0.6]} color={green ? '#33e07a' : '#ff3b2e'} intensity={1.6} distance={7} decay={2} />
  </group>
);

const Entrance: React.FC = () => (
  <group>
    <Box size={[3.0, PORCH_H, 1.7]} position={[0, PORCH_H / 2, 0.85]} m={PAVING} />
    <Box size={[3.0, 0.35, 0.32]} position={[0, 0.175, 1.86]} m={PAVING} />
    <Box size={[3.0, 0.175, 0.32]} position={[0, 0.0875, 2.18]} m={PAVING} />
    {/* canopy */}
    <Box size={[3.4, 0.16, 2.0]} position={[0, 3.05, 1.0]} m={PLINTH_M} />
    {/* door with an intercom */}
    <Box size={[1.25, 2.3, 0.08]} position={[0, PORCH_H + 1.15, 0.04]} m={DOOR_M} />
    <Box size={[0.03, 0.4, 0.05]} position={[0.45, PORCH_H + 1.05, 0.11]} m={STEEL} />
    <Box size={[0.18, 0.28, 0.04]} position={[0.85, PORCH_H + 1.35, 0.02]} m={{color: '#2a2d30', rough: 0.5}} />
    <Glow size={[0.1, 0.04, 0.01]} position={[0.85, PORCH_H + 1.42, 0.045]} color="#7bd3ff" power={0.8} />
    <Bench position={[-2.6, 0, 2.0]} rot={0} />
  </group>
);

export const ShopFront: React.FC = () => (
  <group position={[12, 0, 0]}>
    <Box size={[8.6, 3.2, 0.12]} position={[0, 1.6, 0.06]} m={{color: '#2c3034', metal: 0.4, rough: 0.5}} />
    {[-2.8, 0.0, 2.8].map((x) => (
      <Glow key={x} size={[2.5, 2.2, 0.02]} position={[x, 1.55, 0.13]} color="#e9eadc" power={0.85} />
    ))}
    <Sign
      id="shop-sign"
      size={[6.4, 0.8]}
      position={[0, 3.55, 0.08]}
      px={128}
      lit={1}
      draw={(c) => {
        c.fillStyle = '#1f3d2c';
        c.fillRect(0, 0, 1024, 128);
        c.fillStyle = '#f3f1e7';
        c.font = '600 78px Inter';
        c.textAlign = 'center';
        c.fillText('ПРОДУКТЫ  24 ЧАСА', 512, 94);
      }}
    />
    <Box size={[6.6, 0.9, 0.08]} position={[0, 3.55, 0.03]} m={{color: '#1a1d20', rough: 0.6}} />
    <Box size={[3.0, 0.2, 1.4]} position={[0, 0.1, 0.7]} m={PAVING} />
  </group>
);

export const Yard: React.FC<{v: number; kostya?: 'entrance' | 'steps' | null}> = ({v, kostya}) => {
  const parked = useMemo(
    () =>
      Array.from({length: 13}).map((_, i) => ({
        x: -28 + i * 4.4 + (random(`px${i}`) - 0.5) * 0.4,
        c: CAR_COLORS[Math.floor(random(`pc${i}`) * CAR_COLORS.length)],
        r: (random(`pr${i}`) - 0.5) * 0.08,
        skip: i === 6 || i === 9,
      })),
    [],
  );
  const queue = useMemo(
    () => Array.from({length: 8}).map((_, i) => ({z: 2.2 + i * 6.1, c: CAR_COLORS[(i * 3 + 1) % CAR_COLORS.length], dx: (random(`qx${i}`) - 0.5) * 0.12})),
    [],
  );
  const birches: [number, number, number][] = [
    [-20, 13, 7.5], [-9, 27, 8], [8, 14, 6.5], [15, 24, 7.8], [24, 13, 7], [-30, 22, 8.2], [30, 30, 7.4], [2, 33, 6.8], [-16, 36, 7],
  ];
  return (
    <group position={[YARD_X, 0, 0]}>
      <Sun position={[-30, 60, 50]} target={[0, 0, 10]} color="#e8ecef" intensity={0.55} shadow size={60} />
      <hemisphereLight color="#d6dcdf" groundColor="#4d4a40" intensity={1.25} />
      {/* ground: sidewalk, the yard road with parking, grass with paths */}
      <Box size={[200, 0.1, 160]} position={[0, -0.05, 20]} m={GRASS} />
      <Box size={[B_LEN + 4, 0.1, 2.6]} position={[0, -0.04, 1.3]} m={PAVING} />
      <Box size={[B_LEN + 4, 0.1, 6.4]} position={[0, -0.035, 5.8]} m={ASPHALT} />
      <Box size={[B_LEN + 4, 0.16, 0.18]} position={[0, -0.01, 2.6]} m={CURB} />
      <Box size={[B_LEN + 4, 0.16, 0.18]} position={[0, -0.01, 9.0]} m={CURB} />
      <Box size={[2.2, 0.1, 30]} position={[-4, -0.04, 24]} m={PAVING} />
      {/* puddles on the road */}
      <Box size={[2.6, 0.01, 1.4]} position={[-6, 0.022, 4.6]} m={{color: '#5a6168', metal: 0.8, rough: 0.05, env: 1.6}} shadow={false} />
      <Box size={[1.6, 0.01, 0.9]} position={[9, 0.022, 7.2]} m={{color: '#5a6168', metal: 0.8, rough: 0.05, env: 1.6}} shadow={false} />
      <PanelBlock b={{x: 0, z: 0, len: B_LEN, face: 1, shopAt: 12, entrances: [-24, 0, 24]}} seed="a" />
      <PanelBlock b={{x: 6, z: 52, len: B_LEN, face: -1, entrances: [-18, 6, 30]}} seed="b" />
      <PanelBlock b={{x: -60, z: 30, len: 40, face: 1, entrances: [0]}} seed="c" />
      <Entrance />
      <group position={[-24, 0, 0]}>
        <Entrance />
      </group>
      <group position={[24, 0, 0]}>
        <Entrance />
      </group>
      <ShopFront />
      {parked.map((p, i) => (p.skip ? null : <Car key={i} position={[p.x, 0, 5.6]} rot={p.r} color={p.c} />))}
      <Playground position={[-6, 0, 20]} swing={Math.sin(v * 1.4) * 0.12} />
      {birches.map(([x, z, h], i) => (
        <Birch key={i} position={[x, 0, z]} h={h} seed={`b${i}`} />
      ))}
      <Leaves x0={-36} x1={36} z0={0.2} z1={2.5} n={500} seed="ls" y={0.002} />
      <Leaves x0={-36} x1={36} z0={3} z1={8.6} n={600} seed="lr" y={0.007} />
      <Leaves x0={-30} x1={30} z0={9.5} z1={40} n={1600} seed="lg" />
      {/* the street at the end of the block: asphalt, curbs, a queue of empty cars at the stop line */}
      <Box size={[12, 0.1, 140]} position={[STREET_X + 1.5, -0.03, 10]} m={ASPHALT} />
      <Box size={[80, 0.1, 10]} position={[STREET_X + 10, -0.025, -8]} m={ASPHALT} />
      {Array.from({length: 14}).map((_, i) => (
        <Box key={i} size={[0.14, 0.012, 3]} position={[STREET_X + 1.6, 0.026, 6 + i * 8]} m={{color: '#d9d8cf', rough: 0.8}} shadow={false} />
      ))}
      <Box size={[5.5, 0.012, 0.4]} position={[STREET_X - 0.9, 0.026, -1.2]} m={{color: '#d9d8cf', rough: 0.8}} shadow={false} />
      {Array.from({length: 8}).map((_, i) => (
        <Box key={`zb${i}`} size={[0.5, 0.012, 3.6]} position={[STREET_X - 3.2 + i * 1.0, 0.026, -5.2]} m={{color: '#d9d8cf', rough: 0.8}} shadow={false} />
      ))}
      <Box size={[0.2, 0.16, 140]} position={[STREET_X - 4.5, 0.0, 10]} m={CURB} />
      {queue.map((q, i) => (
        <Car key={i} position={[STREET_X + q.dx, 0, q.z]} color={q.c} />
      ))}
      <TrafficLight position={[STREET_X - 3.6, 0, -2.0]} green={v >= GREEN} />
      <PanelBlock b={{x: STREET_X + 30, z: -16, len: 60, face: 1, entrances: [-10, 15]}} seed="d" />
      <PanelBlock b={{x: STREET_X + 22, z: 40, len: 30, face: 1, entrances: [0]}} seed="e" />
      {kostya === 'entrance' ? <Kostya position={[0.4, 0, 2.9]} rotation={0.4} pose={{head: [0.25, -0.3, 0]}} /> : null}
      {kostya === 'steps' ? (
        <Kostya
          position={[0.15, PORCH_H + 0.11 - HIP_H, 1.42]}
          rotation={0}
          pose={{hipL: 1.62, hipR: 1.5, kneeL: 1.55, kneeR: 1.45, stoop: 0.62, armL: [1.55, 0.3], armR: [1.55, -0.3], elbowL: 2.1, elbowR: 2.1, head: [0.55, 0, 0]}}
        />
      ) : null}
      {kostya === 'steps' ? (
        <group position={[-0.65, PORCH_H, 1.25]}>
          <Box size={[0.32, 0.36, 0.2]} position={[0, 0.18, 0]} m={{color: '#e9e6dd', rough: 0.9}} />
          <Cyl r={0.04} h={0.3} position={[0.05, 0.3, 0.02]} m={{color: '#4a7fb0', rough: 0.2, opacity: 0.7, env: 1.2}} />
        </group>
      ) : null}
    </group>
  );
};

// ---------------------------------------------------------------- inside the shop

const SHELF: Mat = {color: '#d9d6cc', rough: 0.7};
const Shelf: React.FC<{position: V3; rot: number; w: number; seed: string; kind: 'water' | 'cans' | 'bread'}> = ({position, rot, w, seed, kind}) => (
  <group position={position} rotation={[0, rot, 0]}>
    <Box size={[w, 2.0, 0.05]} position={[0, 1.0, -0.22]} m={SHELF} />
    {[0.15, 0.6, 1.05, 1.5, 1.92].map((y, j) => (
      <group key={y}>
        <Box size={[w, 0.03, 0.45]} position={[0, y, 0]} m={SHELF} />
        {Array.from({length: Math.floor(w / 0.11)}).map((_, i) => {
          const x = -w / 2 + 0.07 + i * 0.11;
          if (random(`${seed}${i}${j}`) < 0.12 || y > 1.9) return null;
          if (kind === 'water')
            return <Cyl key={i} r={0.042} h={0.3} seg={8} position={[x, y + 0.165, 0.02]} m={{color: j % 2 ? '#5b8fc0' : '#7fb0d9', rough: 0.25, env: 1.1}} />;
          if (kind === 'cans')
            return <Box key={i} size={[0.09, 0.16, 0.09]} position={[x, y + 0.095, 0.03]} m={{color: ['#b3412f', '#d1a53c', '#3f6d4e', '#e6e1d4'][(i + j) % 4], rough: 0.5}} />;
          return i % 2 ? null : <Box key={i} size={[0.2, 0.1, 0.12]} position={[x + 0.05, y + 0.065, 0.04]} m={{color: j % 2 ? '#a8763f' : '#7a5530', rough: 0.9}} />;
        })}
      </group>
    ))}
  </group>
);

export const Shop: React.FC<{v: number; kostya: boolean}> = ({kostya}) => (
  <group position={[SHOP_X, 0, 0]}>
    <Box size={[7, 0.1, 6]} position={[0, -0.05, 0]} m={{color: '#c8c3b8', rough: 0.5, env: 0.5}} />
    <Box size={[7, 0.1, 6]} position={[0, 3.05, 0]} m={{color: '#e4e1d9', rough: 0.9}} />
    <Box size={[0.1, 3, 6]} position={[-3.05, 1.5, 0]} m={{color: '#dedbd2', rough: 0.9}} />
    <Box size={[0.1, 3, 6]} position={[3.05, 1.5, 0]} m={{color: '#dedbd2', rough: 0.9}} />
    <Box size={[7, 3, 0.1]} position={[0, 1.5, -2.55]} m={{color: '#dedbd2', rough: 0.9}} />
    {/* shop window to the yard: bright overcast outside */}
    <Box size={[7, 0.7, 0.1]} position={[0, 0.35, 2.55]} m={{color: '#2c3034', metal: 0.4, rough: 0.5}} />
    <Box size={[7, 0.4, 0.1]} position={[0, 2.8, 2.55]} m={{color: '#2c3034', metal: 0.4, rough: 0.5}} />
    <Glow size={[7, 1.95, 0.02]} position={[0, 1.67, 2.62]} color="#e4e7e6" power={1} />
    {[-1.75, 0, 1.75].map((x) => (
      <Box key={x} size={[0.08, 1.95, 0.12]} position={[x, 1.67, 2.55]} m={{color: '#2c3034', metal: 0.4, rough: 0.5}} />
    ))}
    {/* counter with the till */}
    <Box size={[2.6, 0.9, 0.6]} position={[0.3, 0.45, -0.3]} m={{color: '#6d5a48', rough: 0.7}} />
    <Box size={[2.7, 0.04, 0.66]} position={[0.3, 0.92, -0.3]} m={{color: '#3a3c3f', rough: 0.5, env: 0.5}} />
    <Box size={[0.36, 0.26, 0.04]} position={[0.95, 1.2, -0.45]} rotation={[-0.25, Math.PI, 0]} m={{color: '#202326', rough: 0.4}} />
    <Glow size={[0.32, 0.22, 0.004]} position={[0.95, 1.2, -0.4265]} rotation={[0.25, 0, 0]} color="#1f3d52" power={0.9} />
    <Box size={[0.06, 0.24, 0.06]} position={[0.95, 1.03, -0.5]} m={{color: '#202326', rough: 0.4}} />
    {/* impulse rack: gum and lighters */}
    <Box size={[0.4, 0.14, 0.18]} position={[-0.75, 1.01, -0.18]} m={{color: '#c0392b', rough: 0.6}} />
    {Array.from({length: 6}).map((_, i) => (
      <Box key={i} size={[0.025, 0.07, 0.012]} position={[-0.9 + i * 0.05, 1.11, -0.18]} m={{color: ['#e04e3a', '#3d8de0', '#f0c43c', '#50b36b'][i % 4], rough: 0.4}} shadow={false} />
    ))}
    {/* behind the counter: cigarettes behind glass */}
    <Box size={[2.6, 1.2, 0.3]} position={[0.3, 1.6, -2.35]} m={{color: '#3b3e41', rough: 0.5}} />
    {/* customer side: shelves, fridges, bread */}
    <Shelf position={[-2.75, 0, 0.6]} rot={Math.PI / 2} w={3.2} seed="w" kind="water" />
    <Shelf position={[2.75, 0, 0.9]} rot={-Math.PI / 2} w={2.6} seed="b" kind="bread" />
    <Shelf position={[0.2, 0, 1.6]} rot={Math.PI} w={2.2} seed="c" kind="cans" />
    <Box size={[0.7, 2.0, 1.6]} position={[-2.65, 1.0, -1.5]} m={{color: '#e9e9e6', rough: 0.5}} />
    <Glow size={[0.02, 1.6, 1.4]} position={[-2.29, 1.05, -1.5]} color="#dfeef5" power={0.7} />
    {/* fluorescent tubes */}
    {[-1.5, 0.3, 2.0].map((z) => (
      <group key={z}>
        <Glow size={[1.4, 0.05, 0.1]} position={[0.2, 2.97, z]} color="#f3f7f5" power={1.6} />
        <pointLight position={[0.2, 2.7, z]} color="#eef5f2" intensity={2.4} distance={7} decay={2} castShadow={z === 0.3} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      </group>
    ))}
    <hemisphereLight color="#eef2f0" groundColor="#776f62" intensity={0.5} />
    {/* on the counter: water and bread he took */}
    <Cyl r={0.045} h={0.3} seg={10} position={[-0.32, 1.09, -0.12]} m={{color: '#7fb0d9', rough: 0.2, opacity: 0.8, env: 1.2}} />
    <Box size={[0.24, 0.12, 0.13]} position={[-0.05, 1.0, -0.06]} rotation={[0, 0.3, 0]} m={{color: '#a8763f', rough: 0.9}} />
    {kostya ? (
      <Kostya
        position={[-0.25, 0, 0.42]}
        rotation={Math.PI}
        pose={{armL: [0.75, 0.05], armR: [0.75, -0.05], elbowL: 0.75, elbowR: 0.75, head: [0.42, 0.15, 0], stoop: 0.08}}
      />
    ) : null}
  </group>
);

// two worn hundred-rouble notes and a lighter on the counter
export const Money: React.FC<{v: number; from: number}> = ({v, from}) => (
  <>
    <MoneyNotes />
    <Lighter t={v - from} />
  </>
);

const MoneyNotes: React.FC = () => (
  <group position={add3(TILL, [0, 0.002, 0])}>
    {[0, 1].map((i) => (
      <group key={i} position={[0.012 * i, i * 0.002, 0.01 * i]} rotation={[0, Math.PI + 0.25 - i * 0.18, 0]}>
        <Sign
          id="note100"
          size={[0.15, 0.065]}
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          px={130}
          draw={(c) => {
            c.fillStyle = '#c3b08c';
            c.fillRect(0, 0, 300, 130);
            c.fillStyle = '#8a6f4c';
            c.fillRect(10, 10, 280, 110);
            c.fillStyle = '#d6c6a3';
            c.fillRect(18, 18, 264, 94);
            c.fillStyle = '#6d5536';
            c.font = '600 54px Inter';
            c.fillText('100', 30, 84);
            c.beginPath();
            c.arc(222, 65, 30, 0, Math.PI * 2);
            c.fillStyle = '#a58d66';
            c.fill();
          }}
        />
      </group>
    ))}
  </group>
);

// the hand comes down with a lighter, sets it on the notes so they don't blow away, and leaves
const Lighter: React.FC<{t: number}> = ({t}) => {
  const down = smooth(Math.min(1, Math.max(0, (t - 0.3) / 0.9)));
  const up = smooth(Math.min(1, Math.max(0, (t - 2.2) / 1.0)));
  const placed = t >= 1.2;
  const lift = (1 - down) * 0.16;
  const handLift = lift + up * 0.3;
  return (
    <group position={add3(TILL, [0.005, 0.006, 0.004])} rotation={[0, 0.5, 0]}>
      <group position={[0, placed ? 0 : lift, 0]}>
        <Box size={[0.025, 0.012, 0.075]} position={[0, 0.006, 0]} m={{color: '#3d8de0', rough: 0.35}} />
        <Box size={[0.026, 0.008, 0.016]} position={[0, 0.0065, -0.042]} m={{color: '#9aa1a6', metal: 0.7, rough: 0.3}} shadow={false} />
      </group>
      {up < 1 ? <Hand position={[0, 0.048 + handLift, 0.05 + up * 0.15]} rotation={[1.2 - up * 0.4, 0, 0]} shape={placed && t > 1.6 ? 'relaxed' : 'grip'} side={1} /> : null}
    </group>
  );
};
