import React, {useMemo} from 'react';
import {AdditiveBlending, CanvasTexture, Color, InstancedMesh, Matrix4, Object3D, SRGBColorSpace} from 'three';
import {random} from 'remotion';
import {Box, Cyl, Glow, Mat, Sun} from './parts';
import {Hand, Kostya, Pose} from './Kostya';
import {Phone, PhoneMode} from './Phone';
import {V3, add3} from './cues';

// Kostya's kitchen on the 9th floor at night, and the city behind the window: thousands of lit windows, nobody in them.
export const KITCHEN: V3 = [600, 25.0, 0];
const K = (p: V3): V3 => add3(KITCHEN, p);
export const KOSTYA_AT_WINDOW: V3 = K([0.3, 0, -1.02]);
// close-ups of the phone: held up in front of the window at night, and on the landing in the morning
export const PHONE_NIGHT: V3 = K([0.36, 1.25, -0.95]);
export const PHONE_DAY: V3 = [0.35, 1.36, 1.55];

const WALLPAPER: Mat = {color: '#a99c84', rough: 0.95};
const FACADE: Mat = {color: '#8f8a80', rough: 0.95};
const FRAME: Mat = {color: '#e2ded4', rough: 0.7};
const WOOD: Mat = {color: '#7c6247', rough: 0.8};
const WHITE: Mat = {color: '#e6e3dc', rough: 0.6, env: 0.5};
const WIN = {x: 0.7, y0: 0.85, y1: 2.3};

// ---------------------------------------------------------------- the city

type Bld = {x: number; z: number; w: number; d: number; h: number};

const useCity = () =>
  useMemo(() => {
    const blds: Bld[] = [];
    let n = 0;
    for (let z = -60; z > -1100; z -= 38 + random(`rz${z}`) * 14) {
      for (let x = -900; x < 900; x += 26 + random(`rx${x}${z}`) * 30) {
        n++;
        if (random(`gap${n}`) < 0.18) continue;
        const tall = random(`tall${n}`);
        const floors = tall < 0.1 ? 16 + Math.floor(random(`f${n}`) * 9) : tall < 0.75 ? 9 : 5 + Math.floor(random(`f${n}`) * 4);
        blds.push({x: x + random(`ox${n}`) * 6, z: z + random(`oz${n}`) * 8, w: 14 + random(`w${n}`) * 42, d: 12, h: floors * 2.8 + 1});
      }
    }
    const o = new Object3D();
    const body: Matrix4[] = [];
    blds.forEach((b) => {
      o.position.set(b.x, b.h / 2, b.z);
      o.scale.set(b.w, b.h, b.d);
      o.updateMatrix();
      body.push(o.matrix.clone());
    });
    // only the faces looking at the kitchen get windows; only the lit ones are drawn
    const win: Matrix4[] = [];
    const col: Color[] = [];
    const c = new Color();
    blds.forEach((b, k) => {
      const cols = Math.floor(b.w / 3);
      const floors = Math.floor((b.h - 1) / 2.8);
      const share = 0.25 + random(`share${k}`) * 0.3;
      for (let f = 0; f < floors; f++) {
        for (let i = 0; i < cols; i++) {
          const r = random(`w${k}-${f}-${i}`);
          if (r > share) continue;
          o.position.set(b.x - b.w / 2 + 1.5 + i * 3, 1.9 + f * 2.8, b.z + b.d / 2 + 0.06);
          o.scale.set(1, 1, 1);
          o.updateMatrix();
          win.push(o.matrix.clone());
          const tone = random(`t${k}-${f}-${i}`);
          c.set(tone < 0.55 ? '#f5c77e' : tone < 0.85 ? '#fbe2b0' : '#cfe0f0').multiplyScalar(0.55 + 0.45 * random(`b${k}-${f}-${i}`));
          col.push(c.clone());
        }
      }
    });
    // street lamps along the gaps between the rows
    const lamps: Matrix4[] = [];
    for (let z = -45; z > -1100; z -= 45) {
      for (let x = -900; x < 900; x += 32) {
        o.position.set(x + random(`lx${x}${z}`) * 4, 8, z + random(`lz${x}${z}`) * 3);
        o.scale.set(1, 1, 1);
        o.updateMatrix();
        lamps.push(o.matrix.clone());
      }
    }
    return {body, win, col, lamps};
  }, []);

const fill = (mats: Matrix4[], cols?: Color[]) => (mesh: InstancedMesh | null) => {
  if (!mesh) return;
  mats.forEach((m, i) => {
    mesh.setMatrixAt(i, m);
    if (cols) mesh.setColorAt(i, cols[i]);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
};

export const City: React.FC = () => {
  const city = useCity();
  return (
    <group position={[KITCHEN[0], 0, 0]}>
      <mesh position={[0, -0.05, -600]} receiveShadow>
        <boxGeometry args={[2000, 0.1, 1300]} />
        <meshStandardMaterial color="#0e1116" roughness={0.9} />
      </mesh>
      <instancedMesh ref={fill(city.body)} args={[undefined, undefined, city.body.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1b2029" roughness={0.95} flatShading />
      </instancedMesh>
      <instancedMesh ref={fill(city.win, city.col)} args={[undefined, undefined, city.win.length]}>
        <planeGeometry args={[1.3, 1.4]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={fill(city.lamps)} args={[undefined, undefined, city.lamps.length]}>
        <boxGeometry args={[0.8, 0.5, 0.8]} />
        <meshBasicMaterial color="#ffad55" toneMapped={false} />
      </instancedMesh>
      {/* sodium glow on the streets between the rows */}
      {Array.from({length: 22}).map((_, i) => (
        <mesh key={i} position={[0, 0.05 + i * 0.002, -45 - i * 45]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1800, 14]} />
          <meshBasicMaterial color="#6a3f17" toneMapped={false} transparent opacity={0.55} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- the kitchen

// faint reflection of the city lights on the window glass, seen from outside
const useReflection = () =>
  useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 1024;
    cv.height = 1024;
    const c = cv.getContext('2d')!;
    c.fillStyle = '#000';
    c.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 260; i++) {
      const x = random(`rf-x${i}`) * 1024;
      const y = 380 + random(`rf-y${i}`) * 644;
      c.fillStyle = random(`rf-c${i}`) < 0.7 ? 'rgba(255,200,130,0.8)' : 'rgba(210,225,240,0.7)';
      c.fillRect(x, y, 2, 3);
    }
    const tx = new CanvasTexture(cv);
    tx.colorSpace = SRGBColorSpace;
    return tx;
  }, []);

// windows of the neighbours on the outer wall: most dark, some lit
const Facade: React.FC = () => {
  const wins = useMemo(() => {
    const out: {p: V3; lit: number}[] = [];
    for (let f = -8; f <= 0; f++) {
      for (let i = -6; i <= 6; i++) {
        if (f === 0 && i === 0) continue;
        const r = random(`fa${f}${i}`);
        out.push({p: [i * 3.0, 1.55 + f * 2.8, -1.906], lit: r < 0.35 ? 0.5 + r : 0});
      }
    }
    return out;
  }, []);
  return (
    <>
      {wins.map((w, k) =>
        w.lit > 0 ? (
          <Glow key={k} size={[1.4, 1.45, 0.004]} position={w.p} color="#f2c47e" power={w.lit} />
        ) : (
          <Box key={k} size={[1.4, 1.45, 0.006]} position={w.p} m={{color: '#141920', metal: 0.6, rough: 0.2, env: 1.2}} shadow={false} />
        ),
      )}
    </>
  );
};

export const Kitchen: React.FC<{
  v: number;
  kostya?: Pose | null;
  phone?: {mode: PhoneMode; at?: V3; rot?: V3; inHand?: boolean} | null;
  outside?: boolean;
}> = ({v, kostya, phone, outside = false}) => {
  const refl = useReflection();
  return (
    <group position={KITCHEN}>
      {/* floor, ceiling, walls */}
      <Box size={[2.9, 0.1, 3.3]} position={[0, -0.05, 0]} m={{color: '#6b5a4a', rough: 0.7}} />
      <Box size={[2.9, 0.1, 3.3]} position={[0, 2.65, 0]} m={{color: '#cfcabf', rough: 0.95}} />
      <Box size={[0.1, 2.6, 3.3]} position={[-1.45, 1.3, 0]} m={WALLPAPER} />
      <Box size={[0.1, 2.6, 3.3]} position={[1.45, 1.3, 0]} m={WALLPAPER} />
      <Box size={[1.9, 2.6, 0.1]} position={[-0.45, 1.3, 1.65]} m={WALLPAPER} />
      <Box size={[1.0, 0.5, 0.1]} position={[0.95, 2.35, 1.65]} m={WALLPAPER} />
      {/* the outer wall with the window opening; outside it is the facade of the block */}
      <Box size={[30, 31, 0.3]} position={[-15 - WIN.x, -12, -1.75]} m={FACADE} />
      <Box size={[30, 31, 0.3]} position={[15 + WIN.x, -12, -1.75]} m={FACADE} />
      <Box size={[WIN.x * 2, 25 + WIN.y0, 0.3]} position={[0, (WIN.y0 - 25) / 2, -1.75]} m={FACADE} />
      <Box size={[WIN.x * 2, 1.2, 0.3]} position={[0, WIN.y1 + 0.6, -1.75]} m={FACADE} />
      {/* wallpaper on the inside of the outer wall */}
      <Box size={[1.4 - WIN.x + 0.05, 2.6, 0.012]} position={[-(WIN.x + 1.45) / 2, 1.3, -1.594]} m={WALLPAPER} shadow={false} />
      <Box size={[1.4 - WIN.x + 0.05, 2.6, 0.012]} position={[(WIN.x + 1.45) / 2, 1.3, -1.594]} m={WALLPAPER} shadow={false} />
      {outside ? <Facade /> : null}
      {/* window: frame, glass, sill */}
      <Box size={[WIN.x * 2 + 0.3, 0.05, 0.32]} position={[0, WIN.y0 + 0.025, -1.5]} m={FRAME} />
      <Box size={[0.07, WIN.y1 - WIN.y0, 0.09]} position={[-WIN.x + 0.035, (WIN.y0 + WIN.y1) / 2, -1.75]} m={FRAME} />
      <Box size={[0.07, WIN.y1 - WIN.y0, 0.09]} position={[WIN.x - 0.035, (WIN.y0 + WIN.y1) / 2, -1.75]} m={FRAME} />
      <Box size={[0.07, WIN.y1 - WIN.y0, 0.09]} position={[0, (WIN.y0 + WIN.y1) / 2, -1.75]} m={FRAME} />
      <Box size={[WIN.x * 2, 0.07, 0.09]} position={[0, WIN.y1 - 0.035, -1.75]} m={FRAME} />
      <Box size={[WIN.x * 2, 0.07, 0.09]} position={[0, WIN.y0 + 0.085, -1.75]} m={FRAME} />
      <mesh position={[0, (WIN.y0 + WIN.y1) / 2, -1.75]}>
        <planeGeometry args={[WIN.x * 2, WIN.y1 - WIN.y0]} />
        <meshStandardMaterial color="#9fb3c4" metalness={0.2} roughness={0.05} transparent opacity={0.08} envMapIntensity={1.5} depthWrite={false} />
      </mesh>
      {outside ? (
        <mesh position={[0, (WIN.y0 + WIN.y1) / 2, -1.81]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[WIN.x * 2 - 0.1, WIN.y1 - WIN.y0 - 0.1]} />
          <meshBasicMaterial map={refl} transparent opacity={0.16} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ) : null}
      {/* radiator under the window */}
      {Array.from({length: 8}).map((_, i) => (
        <Box key={i} size={[0.07, 0.5, 0.08]} position={[-0.32 + i * 0.09, 0.5, -1.5]} m={{color: '#d4cfc5', rough: 0.6}} />
      ))}
      {/* counter with sink and stove on the left, cabinets above, a kettle */}
      <Box size={[0.6, 0.88, 2.0]} position={[-1.1, 0.44, 0.35]} m={WHITE} />
      <Box size={[0.64, 0.04, 2.04]} position={[-1.1, 0.9, 0.35]} m={WOOD} />
      <Box size={[0.36, 0.7, 1.6]} position={[-1.22, 1.95, 0.45]} m={WHITE} />
      <Box size={[0.46, 0.02, 0.46]} position={[-1.1, 0.93, 1.0]} m={{color: '#2b2d30', rough: 0.4}} />
      <Cyl r={0.09} r2={0.11} h={0.2} position={[-1.05, 1.02, -0.2]} m={{color: '#c2c6c9', metal: 0.7, rough: 0.3, env: 1}} />
      {/* table by the window with the charger */}
      <Box size={[0.7, 0.04, 0.9]} position={[1.05, 0.74, -0.85]} m={WOOD} />
      {[-0.3, 0.3].map((x) => [-0.4, 0.4].map((z) => <Box key={`${x}${z}`} size={[0.04, 0.72, 0.04]} position={[1.05 + x, 0.36, -0.85 + z]} m={WOOD} />))}
      <Box size={[0.36, 0.45, 0.36]} position={[1.05, 0.225, -0.1]} m={WOOD} />
      <Box size={[0.012, 0.006, 0.5]} position={[0.85, 0.763, -0.95]} m={{color: '#eeeeea', rough: 0.6}} shadow={false} />
      {/* fridge */}
      <Box size={[0.6, 1.8, 0.62]} position={[1.1, 0.9, 0.6]} m={WHITE} />
      {/* light: the corridor behind, the city glow through the window */}
      <pointLight position={[0.9, 2.0, 1.9]} color="#ffcf96" intensity={0.55} distance={5} decay={2} />
      <Sun position={[0, 6, -14]} target={[0, 0.5, 1]} color="#6f86a8" intensity={0.25} />
      <hemisphereLight color="#33415a" groundColor="#120f0d" intensity={0.25} />
      {kostya ? (
        <Kostya
          position={add3(KOSTYA_AT_WINDOW, [-KITCHEN[0], -KITCHEN[1], -KITCHEN[2]])}
          rotation={Math.PI}
          pose={kostya}
          rightHand={phone?.inHand ? <Phone v={v} mode={phone.mode} position={[0.0, -0.05, 0.03]} rotation={phone.rot ?? [-1.3, 0, 0]} /> : undefined}
        />
      ) : null}
      {phone && !phone.inHand ? (
        <group position={add3(phone.at ?? PHONE_NIGHT, [-KITCHEN[0], -KITCHEN[1], -KITCHEN[2]])} rotation={phone.rot ?? [-0.12, 0, 0]}>
          <Phone v={v} mode={phone.mode} />
          <Hand position={[0.0, -0.1, -0.019]} rotation={[0, 0, Math.PI]} shape="flat" side={-1} />
        </group>
      ) : null}
    </group>
  );
};
