import React, {useMemo} from 'react';
import {random} from 'remotion';
import {AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, Matrix4, PointsMaterial} from 'three';
import {V3, ramp} from '../cues';
import {Box, Cyl, DARK_STEEL, GLASS, Glow, Mat, STEEL} from '../parts';
import {Gleb, GlebPose} from '../Gleb';
import {SkyDome} from '../ep2/Campus';
import {KitchenRadio, StaffRadio} from './Props3';

// The city at night, seen from the 14th floor across the river. Local metres; the set sits at x = CITY_X.
// River along x at z in [-60, 60]; our tower on the south bank, the institute far away on the north bank.
export const CITY_X = 1500;
export const INSTITUTE: V3 = [-40, 0, -330];
export const FLOOR_Y = 39; // 14th floor
export const WIN_Z = 94; // the kitchen window, facing north (-z)
export const SILL_Y = FLOOR_Y + 0.9;
export const STAFF_RADIO: V3 = [0.45, SILL_Y + 0.04, WIN_Z + 0.2];
export const BRIDGE_X = 60;

// ---------------------------------------------------------------- the city blocks and their windows

type Bld = {x: number; z: number; w: number; d: number; h: number; dist: number; tall: boolean};

const BUILDINGS: Bld[] = (() => {
  const out: Bld[] = [];
  const add = (x: number, z: number, i: string) => {
    const w = 14 + random(`cw-${i}`) * 22;
    const d = 12 + random(`cd-${i}`) * 18;
    const tall = random(`ct-${i}`) < 0.12;
    const h = tall ? 45 + random(`ch-${i}`) * 35 : 9 + Math.pow(random(`ch-${i}`), 1.5) * 30;
    const dist = Math.hypot(x - INSTITUTE[0], z - INSTITUTE[2]) + (random(`cj-${i}`) - 0.5) * 36;
    out.push({x, z, w, d, h, dist, tall});
  };
  for (let gx = -22; gx <= 22; gx++) {
    for (let gz = 0; gz < 22; gz++) {
      const i = `n-${gx}-${gz}`;
      const x = gx * 42 + (random(`cx-${i}`) - 0.5) * 12;
      const z = -84 - gz * 40 + (random(`cz-${i}`) - 0.5) * 10;
      if (Math.hypot(x - INSTITUTE[0], z - INSTITUTE[2]) < 70) continue; // the institute grounds
      if (Math.abs(x - BRIDGE_X) < 16 && z > -110) continue;
      if (random(`ce-${i}`) < 0.15) continue;
      add(x, z, i);
    }
  }
  // our bank: a strip along the embankment, left and right of the tower
  for (let gx = -22; gx <= 22; gx++) {
    for (let gz = 0; gz < 5; gz++) {
      const i = `s-${gx}-${gz}`;
      const x = gx * 42 + (random(`cx-${i}`) - 0.5) * 12;
      const z = 84 + gz * 40 + (random(`cz-${i}`) - 0.5) * 10;
      if (Math.abs(x) < 36 && z < 170) continue; // our tower and the yard in front of it
      if (Math.abs(x - BRIDGE_X) < 16 && z < 110) continue;
      if (random(`ce-${i}`) < 0.15) continue;
      add(x, z, i);
    }
  }
  return out;
})();

// how far from the institute the dark has come
const R_STEPS = [170, 235, 295, 345, 385, 418];
export const darkRadius = (v: number, dark: number[]) => {
  let r = 95;
  dark.forEach((t, i) => {
    r += (R_STEPS[i] - (i === 0 ? 95 : R_STEPS[i - 1])) * ramp(v, t, t + 0.35);
  });
  return r;
};

const CityBlocks: React.FC = () => {
  return (
    <instancedMesh
      args={[undefined, undefined, BUILDINGS.length]}
      ref={(m) => {
        if (!m || m.userData.done) return;
        const mat = new Matrix4();
        BUILDINGS.forEach((b, i) => {
          mat.makeScale(b.w, b.h, b.d);
          mat.setPosition(b.x, b.h / 2, b.z);
          m.setMatrixAt(i, mat);
        });
        m.instanceMatrix.needsUpdate = true;
        m.userData.done = true;
      }}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#12161b" roughness={0.9} flatShading />
    </instancedMesh>
  );
};

// window lights: one point per lit window, on the faces we can see (south, east, west)
const WINDOWS = (() => {
  const pos: number[] = [];
  const col: number[] = [];
  const owner: number[] = [];
  const warm = new Color('#f0dfb8');
  const cool = new Color('#c6d8ea');
  BUILDINGS.forEach((b, bi) => {
    const rows = Math.floor((b.h - 3) / 3.2);
    const faces: [number, number, number][] = [
      [0, 1, b.w],
      [1, 0, b.d],
      [-1, 0, b.d],
    ];
    faces.forEach(([nx, nz, len], fi) => {
      const cols = Math.floor(len / 4.2);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const key = `${bi}-${fi}-${r}-${c}`;
          if (random(`wl-${key}`) > 0.36) continue;
          const u = -len / 2 + (len * (c + 0.5)) / cols;
          const y = 3 + r * 3.2;
          const x = nx === 0 ? b.x + u : b.x + nx * (b.w / 2 + 0.3);
          const z = nz === 0 ? b.z + u : b.z + nz * (b.d / 2 + 0.3);
          pos.push(x, y, z);
          const c0 = random(`wc-${key}`) < 0.2 ? cool : warm;
          const k = 0.55 + random(`wk-${key}`) * 0.45;
          col.push(c0.r * k, c0.g * k, c0.b * k);
          owner.push(bi);
        }
      }
    });
  });
  return {pos: new Float32Array(pos), col: new Float32Array(col), owner};
})();

// street lights along the embankments and the main avenues
const STREET = (() => {
  const pos: number[] = [];
  const dist: number[] = [];
  const push = (x: number, z: number) => {
    pos.push(x, 7, z);
    dist.push(Math.hypot(x - INSTITUTE[0], z - INSTITUTE[2]) + (random(`sl-${x}-${z}`) - 0.5) * 30);
  };
  for (let x = -900; x <= 900; x += 28) {
    push(x, -66);
    push(x, 66);
    push(x, -230);
  }
  for (const ax of [-250, 60, 340]) for (let z = -900; z < -70; z += 28) push(ax, z);
  return {pos: new Float32Array(pos), dist};
})();

const useLights = (count: number, size: number) =>
  useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('color', new BufferAttribute(new Float32Array(count * 3), 3));
    const m = new PointsMaterial({size, sizeAttenuation: true, vertexColors: true, toneMapped: false, transparent: false});
    return {g, m};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

// the lights; mirror: their reflection in the river (drawn under the water, the water dims it)
const CityLights: React.FC<{radius: number; mirror?: boolean}> = ({radius, mirror}) => {
  const {g, m} = useLights(WINDOWS.owner.length, 1.15);
  const st = useLights(STREET.dist.length, 1.6);
  useMemo(() => {
    const p = g.attributes.position as BufferAttribute;
    const c = g.attributes.color as BufferAttribute;
    const arr = p.array as Float32Array;
    for (let i = 0; i < WINDOWS.owner.length; i++) {
      const off = BUILDINGS[WINDOWS.owner[i]].dist < radius;
      arr[i * 3] = WINDOWS.pos[i * 3];
      arr[i * 3 + 1] = off ? -50 : mirror ? -WINDOWS.pos[i * 3 + 1] - 3 : WINDOWS.pos[i * 3 + 1];
      arr[i * 3 + 2] = WINDOWS.pos[i * 3 + 2];
      c.setXYZ(i, WINDOWS.col[i * 3], WINDOWS.col[i * 3 + 1], WINDOWS.col[i * 3 + 2]);
    }
    p.needsUpdate = true;
    c.needsUpdate = true;
    const sp = st.g.attributes.position as BufferAttribute;
    const sc = st.g.attributes.color as BufferAttribute;
    const sa = sp.array as Float32Array;
    for (let i = 0; i < STREET.dist.length; i++) {
      const off = STREET.dist[i] < radius;
      sa[i * 3] = STREET.pos[i * 3];
      sa[i * 3 + 1] = off ? -50 : mirror ? -STREET.pos[i * 3 + 1] - 3 : STREET.pos[i * 3 + 1];
      sa[i * 3 + 2] = STREET.pos[i * 3 + 2];
      sc.setXYZ(i, 0.85, 0.88, 0.92);
    }
    sp.needsUpdate = true;
    sc.needsUpdate = true;
  }, [g, st, radius, mirror]);
  return (
    <group>
      <points geometry={g} material={m} frustumCulled={false} />
      <points geometry={st.g} material={st.m} frustumCulled={false} />
    </group>
  );
};

// red lamps on the roofs of the tall ones
const RoofLamps: React.FC<{v: number; radius: number}> = ({v, radius}) => (
  <group>
    {BUILDINGS.filter((b) => b.tall && b.dist >= radius).map((b, i) => (
      <Glow key={i} size={[0.9, 0.9, 0.9]} position={[b.x, b.h + 1, b.z]} color="#ff3b2f" power={Math.floor(v * 0.8 + i * 0.37) % 2 ? 1 : 0.25} />
    ))}
  </group>
);

// ---------------------------------------------------------------- river, banks, bridge

const WATER: Mat = {color: '#0a1016', metal: 0.7, rough: 0.25, env: 0.6, opacity: 0.78};

const Banks: React.FC = () => (
  <group>
    <Box size={[2400, 1, 1400]} position={[0, -0.5, -760]} m={{color: '#0c0f12', rough: 1}} shadow={false} />
    <Box size={[2400, 1, 1400]} position={[0, -0.5, 760]} m={{color: '#0c0f12', rough: 1}} shadow={false} />
    {/* embankment walls stand 10 cm proud of the ground, so their tops never fight with it */}
    <Box size={[2400, 3.6, 2]} position={[0, -1.7, -61]} m={{color: '#2b3035', rough: 0.95}} shadow={false} />
    <Box size={[2400, 3.6, 2]} position={[0, -1.7, 61]} m={{color: '#2b3035', rough: 0.95}} shadow={false} />
    <mesh position={[0, -2.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2400, 120]} />
      <meshStandardMaterial color={WATER.color} metalness={0.7} roughness={0.25} envMapIntensity={0.6} transparent opacity={0.55} depthWrite={false} />
    </mesh>
  </group>
);

const BRIDGE_Y = 6;
const LAMP_ZS = Array.from({length: 11}).map((_, i) => -60 + i * 12);

// people walk south over the bridge with bags, between cars standing still
const WALKERS = Array.from({length: 64}).map((_, i) => ({
  x: BRIDGE_X - 6 + random(`wx-${i}`) * 12,
  z0: -75 + random(`wz-${i}`) * 150,
  speed: 0.9 + random(`ws-${i}`) * 0.35,
  shade: 0.18 + random(`wg-${i}`) * 0.2,
  bag: random(`wb-${i}`),
}));
const CARS = Array.from({length: 11}).map((_, i) => ({x: BRIDGE_X + (i % 2 ? 3.2 : -3.2), z: -52 + i * 10 + (random(`car-${i}`) - 0.5) * 4, c: 0.15 + random(`cc-${i}`) * 0.25}));

const Walker: React.FC<{x: number; z: number; t: number; shade: number; bag: number}> = ({x, z, t, shade, bag}) => {
  const m: Mat = {color: new Color(shade, shade * 1.03, shade * 1.07).getStyle(), rough: 0.9};
  const bob = Math.abs(Math.sin(t * 6)) * 0.04;
  return (
    <group position={[x, BRIDGE_Y + bob, z]}>
      <Box size={[0.36, 0.85, 0.24]} position={[0, 0.43, 0]} m={m} shadow={false} />
      <Box size={[0.46, 0.7, 0.3]} position={[0, 1.2, 0]} m={m} shadow={false} />
      <Box size={[0.22, 0.24, 0.22]} position={[0, 1.7, 0]} m={m} shadow={false} />
      <Box size={bag > 0.5 ? [0.3, 0.3, 0.18] : [0.2, 0.45, 0.5]} position={bag > 0.5 ? [0.36, 0.75, 0] : [0, 1.2, -0.38]} m={{color: '#2a2d30', rough: 0.9}} shadow={false} />
    </group>
  );
};

export const Bridge: React.FC<{v: number; people: boolean}> = ({v, people}) => (
  <group>
    <Box size={[16, 1.4, 150]} position={[BRIDGE_X, BRIDGE_Y - 0.7, 0]} m={{color: '#3a4046', rough: 0.9}} shadow={false} />
    <Box size={[15, 0.05, 150]} position={[BRIDGE_X, BRIDGE_Y + 0.025, 0]} m={{color: '#24282c', rough: 0.95}} shadow={false} />
    {[-30, 0, 30].map((z) => (
      <Box key={z} size={[10, 9, 4]} position={[BRIDGE_X, BRIDGE_Y - 5.9, z]} m={{color: '#2f353a', rough: 0.95}} shadow={false} />
    ))}
    {[-7.8, 7.8].map((dx) => (
      <group key={dx}>
        <Box size={[0.12, 0.1, 150]} position={[BRIDGE_X + dx, BRIDGE_Y + 1.1, 0]} m={STEEL} shadow={false} />
        {LAMP_ZS.map((z) => (
          <group key={z}>
            <Cyl r={0.08} h={8} seg={6} position={[BRIDGE_X + dx, BRIDGE_Y + 4, z]} m={DARK_STEEL} shadow={false} />
            <Glow size={[0.6, 0.2, 0.4]} position={[BRIDGE_X + dx * 0.88, BRIDGE_Y + 8, z]} color="#e6edf5" />
          </group>
        ))}
      </group>
    ))}
    {[-40, -5, 30].map((z) => (
      <pointLight key={z} position={[BRIDGE_X, BRIDGE_Y + 7, z]} color="#dce6f0" intensity={160} distance={40} decay={2} />
    ))}
    {people
      ? CARS.map((c, i) => (
          <group key={i} position={[c.x, BRIDGE_Y, c.z]} rotation={[0, (random(`cr-${i}`) - 0.5) * 0.3, 0]}>
            <Box size={[1.8, 0.75, 4.3]} position={[0, 0.6, 0]} m={{color: new Color(c.c, c.c * 1.03, c.c * 1.08).getStyle(), metal: 0.5, rough: 0.4}} shadow={false} />
            <Box size={[1.6, 0.55, 2.2]} position={[0, 1.2, -0.2]} m={{color: '#151a1f', metal: 0.6, rough: 0.2}} shadow={false} />
          </group>
        ))
      : null}
    {people
      ? WALKERS.map((w, i) => {
          const z = ((w.z0 + v * w.speed + 75) % 150) - 75;
          const nearCar = CARS.some((c) => Math.abs(c.x - w.x) < 1.3 && Math.abs(c.z - z) < 2.6);
          return <Walker key={i} x={nearCar ? w.x + (w.x > BRIDGE_X ? 1.6 : -1.6) : w.x} z={z} t={v + i} shade={w.shade} bag={w.bag} />;
        })
      : null}
  </group>
);

// ---------------------------------------------------------------- the institute: a dark patch with searchlights

const Beam: React.FC<{p: V3; yaw: number; pitch: number; len: number}> = ({p, yaw, pitch, len}) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <group rotation={[pitch, 0, 0]}>
      <mesh position={[0, len / 2, 0]}>
        <cylinderGeometry args={[1 + len * 0.05, 1, len, 16, 1, true]} />
        <meshBasicMaterial color="#9fb4cc" transparent opacity={0.07} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} fog={false} toneMapped={false} />
      </mesh>
      <Glow size={[2.4, 0.4, 2.4]} position={[0, 0.2, 0]} color="#eef4ff" />
    </group>
  </group>
);

const Institute: React.FC<{v: number}> = ({v}) => (
  <group position={INSTITUTE}>
    {/* two faint grey mounds, lit by the beams */}
    {[[-8, -6, 22, 9], [10, 18, 18, 8]].map(([x, z, r, h], i) => (
      <mesh key={i} position={[x, 0, z]} scale={[r, h, r * 0.75]}>
        <sphereGeometry args={[1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#5d666e" metalness={0.4} roughness={0.4} flatShading />
      </mesh>
    ))}
    {Array.from({length: 7}).map((_, i) => {
      const a = (i / 7) * Math.PI * 2;
      return <Beam key={i} p={[Math.cos(a) * 55, 2, Math.sin(a) * 50]} yaw={a + Math.PI / 2 + 0.5 * Math.sin(v * 0.2 + i)} pitch={0.55 + 0.25 * Math.sin(v * 0.13 + i * 1.7)} len={150} />;
    })}
    <pointLight position={[0, 40, 0]} color="#b9c9da" intensity={2500} distance={160} decay={2} />
  </group>
);

// ---------------------------------------------------------------- the kitchen on the 14th floor

const WALL: Mat = {color: '#3c4247', rough: 0.9};
const WOOD: Mat = {color: '#3b3732', rough: 0.8};

const Kitchen: React.FC = () => {
  const fy = FLOOR_Y;
  const z0 = WIN_Z;
  const w0 = SILL_Y;
  const w1 = FLOOR_Y + 2.6;
  return (
    <group>
      <Box size={[6, 0.2, 6]} position={[0, fy - 0.1, z0 + 3]} m={{color: '#2b2e31', rough: 0.8}} />
      <Box size={[6, 0.2, 6]} position={[0, fy + 2.9, z0 + 3]} m={{color: '#2a2e32', rough: 0.95}} shadow={false} />
      {/* the window wall: a wide opening with a sill */}
      <Box size={[1.4, 2.8, 0.3]} position={[-2.2, fy + 1.4, z0 - 0.15]} m={WALL} />
      <Box size={[1.4, 2.8, 0.3]} position={[2.2, fy + 1.4, z0 - 0.15]} m={WALL} />
      <Box size={[3.0, w0 - fy, 0.3]} position={[0, (fy + w0) / 2, z0 - 0.15]} m={WALL} />
      <Box size={[3.0, fy + 2.8 - w1, 0.3]} position={[0, (w1 + fy + 2.8) / 2, z0 - 0.15]} m={WALL} />
      <Box size={[3.1, 0.04, 0.38]} position={[0, w0 + 0.02, z0 + 0.05]} m={{color: '#8b8f92', rough: 0.6}} />
      {/* one big pane, no mullion */}
      <Box size={[3.0, 0.06, 0.08]} position={[0, w1 - 0.03, z0 - 0.1]} m={DARK_STEEL} shadow={false} />
      <mesh position={[0, (w0 + w1) / 2, z0 - 0.12]}>
        <planeGeometry args={[2.98, w1 - w0]} />
        <meshStandardMaterial color={GLASS.color} metalness={0.1} roughness={0.05} envMapIntensity={1.6} transparent opacity={0.08} depthWrite={false} side={DoubleSide} />
      </mesh>
      {/* side walls, back wall */}
      <Box size={[0.2, 2.8, 6]} position={[-2.9, fy + 1.4, z0 + 3]} m={WALL} />
      <Box size={[0.2, 2.8, 6]} position={[2.9, fy + 1.4, z0 + 3]} m={WALL} />
      <Box size={[6, 2.8, 0.2]} position={[0, fy + 1.4, z0 + 5.9]} m={WALL} />
      {/* fridge, cupboard, table with a kettle */}
      <Box size={[0.6, 1.8, 0.6]} position={[-2.45, fy + 0.9, z0 + 0.8]} m={{color: '#a7acaf', rough: 0.5, metal: 0.2}} />
      <Box size={[0.6, 0.85, 2.2]} position={[2.45, fy + 0.425, z0 + 1.6]} m={WOOD} />
      <Box size={[0.62, 0.04, 2.22]} position={[2.45, fy + 0.87, z0 + 1.6]} m={{color: '#5b5f62', rough: 0.6}} />
      <group position={[-0.9, fy, z0 + 1.6]}>
        <Box size={[0.9, 0.04, 0.7]} position={[0, 0.74, 0]} m={WOOD} />
        {[[-0.4, -0.3], [0.4, -0.3], [-0.4, 0.3], [0.4, 0.3]].map(([x, z]) => (
          <Box key={`${x}${z}`} size={[0.04, 0.72, 0.04]} position={[x, 0.36, z]} m={WOOD} shadow={false} />
        ))}
        <Cyl r={0.08} r2={0.1} h={0.2} seg={10} position={[0.15, 0.86, 0.05]} m={STEEL} />
        <Cyl r={0.04} h={0.09} seg={8} position={[-0.2, 0.805, -0.1]} m={{color: '#c9ccc9', rough: 0.5}} />
      </group>
      <KitchenRadio position={[-0.75, w0 + 0.04, z0 + 0.12]} rotation={0.12} needle={0.62} />
      {/* the only light inside: a weak cold bulb over the cupboard */}
      <pointLight position={[1.8, fy + 2.4, z0 + 3.5]} color="#c9d6e2" intensity={0.8} distance={7} decay={2} />
      <hemisphereLight color="#33404f" groundColor="#0a0c0f" intensity={0.14} />
    </group>
  );
};

// ---------------------------------------------------------------- the whole set

// the reflection in the window: a faint mirrored copy behind the glass
const GHOST: Mat = {color: '#5f7080', emissive: '#18202a', glow: 1, opacity: 0.1, additive: true, glass: true, rough: 0.6};

export type GlebAt = 'window' | 'hold' | 'reflect' | undefined;
const WINDOW_POSE: GlebPose = {armL: [0.12, 0.08], armR: [0.12, -0.08], head: [0.05, 0.08], stoop: 0.05};
const HOLD_POSE: GlebPose = {armL: [0.75, 0.12], armR: [0.7, -0.1], elbowL: 0.3, elbowR: 0.35, head: [0.55, 0], stoop: 0.32};
const REFLECT_POSE: GlebPose = {armL: [0.1, 0.08], armR: [1.15, -0.25], elbowR: 1.9, head: [0.2, -0.15], stoop: 0.08};

export const City: React.FC<{
  v: number;
  dark: number[];
  gleb?: GlebAt;
  people: boolean;
  radio: {channel: number; freq: string; scanning: boolean; led: number};
}> = ({v, dark, gleb, people, radio}) => {
  const r = darkRadius(v, dark);
  const radioInHand = gleb === 'reflect';
  const handRadio = (
    <group rotation={[Math.PI, 0, 0]} position={[0, -0.02, 0.03]}>
      <StaffRadio position={[0, -0.12, 0]} channel={radio.channel} freq={radio.freq} scanning={false} led={radio.led} v={v} />
    </group>
  );
  return (
    <group position={[CITY_X, 0, 0]}>
      <SkyDome top="#04060a" horizon="#1b2330" low="#090c11" />
      <Banks />
      <CityBlocks />
      <CityLights radius={r} />
      <CityLights radius={r} mirror />
      <RoofLamps v={v} radius={r} />
      <Bridge v={v} people={people} />
      <Institute v={v} />
      <Kitchen />
      {radioInHand ? null : <StaffRadio position={STAFF_RADIO} rotation={[0, -0.25, 0]} v={v} {...radio} />}
      {gleb === 'window' ? <Gleb position={[0.25, FLOOR_Y, WIN_Z + 0.75]} rotation={Math.PI} pose={WINDOW_POSE} /> : null}
      {gleb === 'hold' ? <Gleb position={[0.15, FLOOR_Y, WIN_Z + 0.78]} rotation={Math.PI + 0.35} pose={HOLD_POSE} /> : null}
      {gleb === 'reflect' ? (
        <>
          <Gleb position={[0.9, FLOOR_Y, WIN_Z + 0.85]} rotation={Math.PI - 0.15} pose={REFLECT_POSE} rightHand={handRadio} />
          {/* mirror across the window plane */}
          <group position={[0, 0, 2 * (WIN_Z - 0.12)]} scale={[1, 1, -1]}>
            <Gleb position={[0.9, FLOOR_Y, WIN_Z + 0.85]} rotation={Math.PI - 0.15} pose={REFLECT_POSE} ghost={GHOST} />
          </group>
        </>
      ) : null}
      <hemisphereLight color="#1c2533" groundColor="#05070a" intensity={0.08} />
    </group>
  );
};
