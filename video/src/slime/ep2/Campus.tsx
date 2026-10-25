import React, {useMemo} from 'react';
import {random} from 'remotion';
import {BackSide, BufferAttribute, Color, SphereGeometry} from 'three';
import {V3, lerp, ramp, smooth} from '../cues';
import {Box, Cyl, DARK_STEEL, Glow, Ico, Mat, RUBBER, STEEL} from '../parts';
import {Gleb, NINA_LOOK} from '../Gleb';
import {Flashlight, MASS, useTarget} from '../Hall';
import {MassField, Collar, blob, mound} from './Mass';
import {Radio, WallClock} from './Props';

// The institute's grounds: корпус «Ковыль» (the lab), корпус «Осока» across the yard, the third building with the roof.
// Local metres; the whole set sits at x = CAMPUS_X.
export const CAMPUS_X = -300;
export type Time = 'dusk' | 'night' | 'dawn';

const CONCRETE: Mat = {color: '#5d646a', rough: 0.92};
const CONCRETE_DARK: Mat = {color: '#454b51', rough: 0.92};
const ASPHALT: Mat = {color: '#2b2f33', rough: 0.95};
const GRASS: Mat = {color: '#2f3630', rough: 1};
const GLASS_DARK: Mat = {color: '#1d252d', metal: 0.6, rough: 0.2, env: 1.3};
const INTERIOR: Mat = {color: '#596067', rough: 0.85};

type Bld = {name: string; x: number; z: number; w: number; d: number; floors: number; door: 'n' | 's'};
export const KOVYL: Bld = {name: 'kovyl', x: 0, z: 12, w: 26, d: 16, floors: 3, door: 's'};
export const OSOKA: Bld = {name: 'osoka', x: 0, z: -21, w: 22, d: 18, floors: 3, door: 'n'};
export const THIRD: Bld = {name: 'third', x: 20, z: 36, w: 16, d: 12, floors: 5, door: 'n'};
const FLOOR_H = 3.6;
const bldH = (b: Bld) => 0.6 + b.floors * FLOOR_H + 0.4;
export const ROOF_Y = bldH(THIRD);
const FRONT = THIRD.z - THIRD.d / 2;
// Gleb on the roof, looking at the grounds
export const GLEB_ON_ROOF: V3 = [THIRD.x - 0.4, ROOF_Y, FRONT + 0.85];
const GLEB_ROOF_ROT = Math.PI + 0.46;

// the corridor window on the 2nd floor of «Ковыль», facing «Осока»
export const SILL_Y = 0.6 + FLOOR_H + 0.9;
export const WINDOW_Z = KOVYL.z - KOVYL.d / 2;
export const RADIO_POS: V3 = [0.32, SILL_Y, WINDOW_Z + 0.4];

// ---------------------------------------------------------------- sky

const SkyDome: React.FC<{top: string; horizon: string; low?: string}> = ({top, horizon, low}) => {
  const geo = useMemo(() => {
    const g = new SphereGeometry(900, 24, 16);
    const pos = g.attributes.position as BufferAttribute;
    const cols = new Float32Array(pos.count * 3);
    const t = new Color(top);
    const h = new Color(horizon);
    const l = new Color(low ?? horizon);
    const c = new Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 900;
      if (y >= 0) c.copy(h).lerp(t, Math.pow(y, 0.6));
      else c.copy(h).lerp(l, Math.min(1, -y * 4));
      cols.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new BufferAttribute(cols, 3));
    return g;
  }, [top, horizon, low]);
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial vertexColors side={BackSide} fog={false} toneMapped={false} depthWrite={false} />
    </mesh>
  );
};

// ---------------------------------------------------------------- buildings

const FACES = [
  {n: [0, 1] as const, rot: 0},
  {n: [0, -1] as const, rot: Math.PI},
  {n: [1, 0] as const, rot: Math.PI / 2},
  {n: [-1, 0] as const, rot: -Math.PI / 2},
];

// window planes face outwards only, so from inside the building the walls are see-through
const Building: React.FC<{b: Bld; lit?: (face: number, floor: number, i: number) => number; shadow?: boolean}> = ({b, lit, shadow = true}) => {
  const h = bldH(b);
  const windows = useMemo(() => {
    const out: {p: V3; rot: number; face: number; f: number; i: number}[] = [];
    FACES.forEach(({n, rot}, face) => {
      const len = n[0] === 0 ? b.w : b.d;
      const count = Math.round(len / 2.9);
      for (let f = 0; f < b.floors; f++) {
        for (let i = 0; i < count; i++) {
          const u = -len / 2 + (len * (i + 0.5)) / count;
          const doorHere = f === 0 && Math.abs(u) < 1.5 && ((b.door === 'n' && face === 0) || (b.door === 's' && face === 1));
          if (doorHere) continue;
          const y = 0.6 + f * FLOOR_H + 1.7;
          const p: V3 =
            n[0] === 0 ? [b.x + u * n[1], y, b.z + n[1] * (b.d / 2 + 0.01)] : [b.x + n[0] * (b.w / 2 + 0.01), y, b.z - u * n[0]];
          out.push({p, rot, face, f, i});
        }
      }
    });
    return out;
  }, [b]);
  const doorZ = b.door === 'n' ? b.z + b.d / 2 : b.z - b.d / 2;
  const s = b.door === 'n' ? 1 : -1;
  return (
    <group>
      <mesh position={[b.x, h / 2, b.z]} castShadow={shadow} receiveShadow>
        <boxGeometry args={[b.w, h, b.d]} />
        <meshStandardMaterial color={CONCRETE.color} roughness={0.92} flatShading />
      </mesh>
      {/* floor bands and parapet */}
      {Array.from({length: b.floors}).map((_, f) => (
        <Box key={f} size={[b.w + 0.12, 0.25, b.d + 0.12]} position={[b.x, 0.6 + f * FLOOR_H + 0.2, b.z]} m={CONCRETE_DARK} shadow={false} />
      ))}
      <Box size={[b.w + 0.2, 0.5, b.d + 0.2]} position={[b.x, h + 0.05, b.z]} m={CONCRETE_DARK} shadow={false} />
      <Box size={[b.w + 0.4, 0.6, b.d + 0.4]} position={[b.x, 0.3, b.z]} m={CONCRETE_DARK} shadow={false} />
      {windows.map((w, k) => {
        const l = lit ? lit(w.face, w.f, w.i) : 0;
        return (
          <mesh key={k} position={w.p} rotation={[0, w.rot, 0]}>
            <planeGeometry args={[1.4, 1.6]} />
            {l > 0 ? (
              <meshBasicMaterial color={new Color('#e8e0c8').multiplyScalar(0.55 + 0.45 * l)} toneMapped={false} />
            ) : (
              <meshStandardMaterial color={GLASS_DARK.color} metalness={0.6} roughness={0.2} envMapIntensity={1.3} flatShading />
            )}
          </mesh>
        );
      })}
      {/* entrance */}
      <Box size={[3.4, 0.2, 2.0]} position={[b.x, 3.0, doorZ + s * 1.0]} m={CONCRETE_DARK} />
      <mesh position={[b.x, 1.35, doorZ + s * 0.02]} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
        <planeGeometry args={[2.2, 2.5]} />
        <meshStandardMaterial color="#20272e" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* roof units */}
      <Box size={[3, 1.4, 2.2]} position={[b.x - b.w * 0.25, h + 0.7, b.z]} m={DARK_STEEL} shadow={false} />
      <Box size={[1.6, 1.0, 1.6]} position={[b.x + b.w * 0.3, h + 0.5, b.z - b.d * 0.2]} m={DARK_STEEL} shadow={false} />
    </group>
  );
};

// ---------------------------------------------------------------- the yard

const LAMPS: V3[] = [[-3.2, 0, 1], [3.2, 0, -3.5], [-3.2, 0, -8]];

const YardLamp: React.FC<{p: V3; on: boolean; sunk?: number}> = ({p, on, sunk = 0}) => (
  <group position={[p[0], p[1] - sunk, p[2]]}>
    <Cyl r={0.07} r2={0.09} h={4.6} seg={6} position={[0, 2.3, 0]} m={DARK_STEEL} />
    <Box size={[0.9, 0.08, 0.1]} position={[p[0] < 0 ? 0.4 : -0.4, 4.55, 0]} m={DARK_STEEL} />
    <Box size={[0.4, 0.12, 0.22]} position={[p[0] < 0 ? 0.8 : -0.8, 4.5, 0]} m={DARK_STEEL} />
    {on ? (
      <>
        <Glow size={[0.32, 0.02, 0.16]} position={[p[0] < 0 ? 0.8 : -0.8, 4.43, 0]} color="#e3edf6" />
        <pointLight position={[p[0] < 0 ? 0.8 : -0.8, 4.2, 0]} color="#d6e4f2" intensity={14} distance={14} decay={2} />
      </>
    ) : null}
  </group>
);

const Fence: React.FC<{sunk?: boolean}> = ({sunk}) => (
  <group>
    {[-15, 15].map((x) => (
      <group key={x}>
        {Array.from({length: 9}).map((_, i) => (
          <Box key={i} size={[0.08, 1.8, 0.08]} position={[x, 0.9 - (sunk ? 0.8 : 0), -11 + i * 2]} m={DARK_STEEL} shadow={false} />
        ))}
        {[0.4, 1.6].map((y) => (
          <Box key={y} size={[0.04, 0.05, 16]} position={[x, y - (sunk ? 0.8 : 0), -3]} m={DARK_STEEL} shadow={false} />
        ))}
      </group>
    ))}
  </group>
);

const Car: React.FC<{p: V3; rot: number; color: string}> = ({p, rot, color}) => (
  <group position={p} rotation={[0, rot, 0]}>
    <Box size={[1.8, 0.7, 4.2]} position={[0, 0.55, 0]} m={{color, metal: 0.5, rough: 0.4, env: 0.8}} />
    <Box size={[1.6, 0.55, 2.2]} position={[0, 1.15, -0.2]} m={GLASS_DARK} />
    {[[-0.8, -1.3], [0.8, -1.3], [-0.8, 1.3], [0.8, 1.3]].map(([x, z]) => (
      <Cyl key={`${x}${z}`} r={0.33} h={0.22} seg={8} position={[x, 0.33, z]} rotation={[0, 0, Math.PI / 2]} m={RUBBER} shadow={false} />
    ))}
  </group>
);

const Ground: React.FC = () => (
  <group>
    <Box size={[1400, 0.1, 1400]} position={[0, -0.05, 0]} m={GRASS} shadow={false} />
    {/* the yard and the streets around the grounds */}
    <Box size={[30, 0.02, 64]} position={[0, 0.01, 4]} m={ASPHALT} shadow={false} />
    <Box size={[3, 0.03, 16]} position={[0, 0.02, -4]} m={{color: '#3c4146', rough: 0.95}} shadow={false} />
    {[-58, 60].map((z) => (
      <Box key={z} size={[1400, 0.03, 12]} position={[0, 0.015, z]} m={ASPHALT} shadow={false} />
    ))}
    {[-56, 56].map((x) => (
      <Box key={x} size={[12, 0.03, 1400]} position={[x, 0.016, 0]} m={ASPHALT} shadow={false} />
    ))}
  </group>
);

// the rest of the town: grey blocks, no windows, getting lost in the haze
const Town: React.FC = () => {
  const blocks = useMemo(() => {
    const out: {p: V3; s: V3; c: string}[] = [];
    for (let gx = -9; gx <= 9; gx++) {
      for (let gz = -9; gz <= 9; gz++) {
        const x = gx * 26 + (random(`tx-${gx}-${gz}`) - 0.5) * 6;
        const z = gz * 26 + (random(`tz-${gx}-${gz}`) - 0.5) * 6;
        if (Math.abs(x) < 70 && Math.abs(z) < 74) continue;
        if (random(`te-${gx}-${gz}`) < 0.18) continue;
        const w = 9 + random(`tw-${gx}-${gz}`) * 10;
        const d = 9 + random(`td-${gx}-${gz}`) * 10;
        const h = 6 + Math.pow(random(`th-${gx}-${gz}`), 2) * 18;
        const g = 70 + Math.floor(random(`tc-${gx}-${gz}`) * 30);
        out.push({p: [x, h / 2, z], s: [w, h, d], c: `rgb(${g},${g + 5},${g + 10})`});
      }
    }
    return out;
  }, []);
  return (
    <group>
      {blocks.map((b, i) => (
        <mesh key={i} position={b.p}>
          <boxGeometry args={b.s} />
          <meshStandardMaterial color={b.c} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- the grey mass in the morning

const morningHeight = (x: number, z: number) => {
  const b = blob(x, z, 0, -5, 37);
  if (b >= 1) return -1;
  const strip = Math.abs(x) < 7 && z > -15 && z < 7 ? 0.25 + 0.5 * (1 - (x / 7) ** 2) : 0;
  return Math.max(0.06 + 0.35 * (1 - b), strip, mound(x, z, KOVYL.x, KOVYL.z, 16, 10.5, 7.5), mound(x, z, OSOKA.x, OSOKA.z, 14, 12, 7));
};

const MorningMass: React.FC<{v: number}> = ({v}) => (
  <group>
    <MassField id="campus" size={[92, 84]} seg={[62, 56]} height={morningHeight} v={v} ripple={0.05} jitter={0.4} position={[0, 0, -5]} m={{...MASS, metal: 0.35, rough: 0.42, env: 0.7}} shadow />
    {/* bits that are not eaten yet: a corner of the parapet, a vent pipe */}
    <Box size={[4.5, 0.5, 0.5]} position={[8.5, 4.6, -14.5]} rotation={[0.1, 0.3, -0.35]} m={CONCRETE_DARK} />
    <Cyl r={0.25} h={3} seg={8} position={[-6, 6.6, 11]} rotation={[0.3, 0, 0.2]} m={DARK_STEEL} />
    {LAMPS.map((p, i) => (
      <group key={i}>
        <YardLamp p={p} on={false} sunk={2.2} />
        <Collar position={[p[0], 0.5, p[2]]} r={0.1} h={0.35} />
      </group>
    ))}
    <Fence sunk />
  </group>
);

// ---------------------------------------------------------------- the roof of the third building

const Roof: React.FC = () => {
  const y = ROOF_Y;
  const front = FRONT;
  return (
    <group position={[THIRD.x, 0, 0]}>
      {Array.from({length: 17}).map((_, i) => (
        <Box key={i} size={[0.05, 1.1, 0.05]} position={[-8 + i, y + 0.55, front + 0.3]} m={STEEL} shadow={false} />
      ))}
      <Box size={[16, 0.06, 0.06]} position={[0, y + 1.1, front + 0.3]} m={STEEL} />
      <Box size={[16, 0.04, 0.04]} position={[0, y + 0.55, front + 0.3]} m={STEEL} shadow={false} />
      <Box size={[2.2, 1.3, 1.6]} position={[-4, y + 0.65, front + 4]} m={DARK_STEEL} />
      <Box size={[1.4, 0.9, 3]} position={[3.5, y + 0.45, front + 7]} m={DARK_STEEL} />
      <Cyl r={0.35} h={1.6} seg={8} position={[-4.6, y + 2, front + 4]} m={STEEL} />
      <Cyl r={0.06} h={5} seg={6} position={[6, y + 2.5, front + 9]} m={STEEL} />
      {[1.5, 2.6, 3.6].map((h) => (
        <Box key={h} size={[1.2 - h * 0.15, 0.04, 0.04]} position={[6, y + h, front + 9]} m={STEEL} shadow={false} />
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- the corridor on the 2nd floor of «Ковыль»

const Corridor2: React.FC<{v: number; led: number; reflect: number; gleb: boolean}> = ({v, led, reflect, gleb}) => {
  const fy = 0.6 + FLOOR_H;
  const z0 = WINDOW_Z;
  const wy0 = SILL_Y;
  const wy1 = SILL_Y + 1.6;
  return (
    <group>
      <Box size={[8, 0.2, 5]} position={[0, fy - 0.1, z0 + 2.5]} m={{color: '#30363c', rough: 0.7, metal: 0.1}} />
      <Box size={[8, 0.2, 5]} position={[0, fy + 3.3, z0 + 2.5]} m={{color: '#25292e', rough: 0.9}} shadow={false} />
      {/* inner side of the outer wall, with the window opening */}
      <Box size={[3.3, 3.4, 0.3]} position={[-2.35, fy + 1.7, z0 + 0.15]} m={INTERIOR} />
      <Box size={[3.3, 3.4, 0.3]} position={[2.35, fy + 1.7, z0 + 0.15]} m={INTERIOR} />
      <Box size={[1.4, wy0 - fy, 0.3]} position={[0, (fy + wy0) / 2, z0 + 0.15]} m={INTERIOR} />
      <Box size={[1.4, fy + 3.4 - wy1, 0.3]} position={[0, (wy1 + fy + 3.4) / 2, z0 + 0.15]} m={INTERIOR} />
      <Box size={[1.6, 0.04, 0.42]} position={[0, wy0 - 0.02, z0 + 0.2]} m={{color: '#8a9095', rough: 0.6}} />
      <Box size={[0.05, 1.6, 0.06]} position={[0, wy0 + 0.8, z0 + 0.05]} m={DARK_STEEL} />
      <Box size={[1.4, 0.05, 0.06]} position={[0, wy0 + 1.1, z0 + 0.05]} m={DARK_STEEL} />
      <Box size={[8, 3.4, 0.2]} position={[0, fy + 1.7, z0 + 4.6]} m={INTERIOR} />
      <Box size={[0.2, 3.4, 5]} position={[-3.9, fy + 1.7, z0 + 2.5]} m={INTERIOR} />
      <Box size={[0.2, 3.4, 5]} position={[3.9, fy + 1.7, z0 + 2.5]} m={INTERIOR} />
      <Box size={[0.9, 0.1, 0.12]} position={[0, fy + 0.4, z0 + 0.36]} m={DARK_STEEL} shadow={false} />
      <WallClock position={[-3.79, fy + 2.5, z0 + 1.6]} rotation={Math.PI / 2} v={v} />
      {/* chair */}
      <group position={[0.1, fy, z0 + 1.25]}>
        <Box size={[0.46, 0.05, 0.44]} position={[0, 0.46, 0]} m={DARK_STEEL} />
        <Box size={[0.46, 0.5, 0.04]} position={[0, 0.74, 0.22]} m={DARK_STEEL} />
        {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z]) => (
          <Box key={`${x}${z}`} size={[0.03, 0.46, 0.03]} position={[x, 0.23, z]} m={STEEL} shadow={false} />
        ))}
      </group>
      {gleb ? (
        <Gleb
          position={[0.1, fy - 0.46, z0 + 1.2]}
          rotation={Math.PI}
          pose={{legL: 1.45, legR: 1.4, armL: [0.9, 0.1], armR: [0.95, -0.1], elbowL: 0.9, elbowR: 0.8, head: [0.05, 0.05], stoop: 0.15}}
        />
      ) : null}
      <Radio position={RADIO_POS} led={led} reflect={reflect} rotation={-0.15} />
      <Glow size={[1.2, 0.02, 0.25]} position={[0, fy + 3.18, z0 + 2.6]} color="#cfdbe6" power={0.7} />
      <pointLight position={[0, fy + 2.9, z0 + 2.6]} color="#cfdbe6" intensity={2.2} distance={7} decay={2} />
      <pointLight position={[0.5, wy0 + 0.35, z0 + 0.75]} color="#b8c9da" intensity={0.5} distance={1.6} decay={2} />
    </group>
  );
};

// ---------------------------------------------------------------- Savelyeva crossing the yard

const Nina: React.FC<{v: number; from: number; to: number}> = ({v, from, to}) => {
  const k = ramp(v, from, to);
  const z = lerp(3.2, -8.5, k);
  const ph = (v - from) * 8.5;
  const swing = Math.sin(ph) * 0.38;
  return (
    <Gleb
      position={[0.45 + Math.sin(k * 3) * 0.2, 0, z]}
      rotation={Math.PI}
      look={NINA_LOOK}
      pose={{legL: swing, legR: -swing, armL: [-swing * 0.6, 0.06], armR: [0.7, -0.08], elbowR: 0.4, head: [0.1, 0], stoop: 0.06}}
      rightHand={<Flashlight on />}
    />
  );
};

// ---------------------------------------------------------------- the whole set

const LIT = (seed: string, share: number) => (face: number, f: number, i: number) => (random(`${seed}-${face}-${f}-${i}`) < share ? 0.6 + random(`${seed}-b-${face}-${f}-${i}`) * 0.4 : 0);
const OSOKA_LIT = LIT('osoka', 0.6);
const KOVYL_LIT = LIT('kovyl', 0.12);

export const Campus: React.FC<{
  v: number;
  time: Time;
  shot: string;
  osokaOn: boolean;
  nina?: [number, number];
  led?: number;
  reflect?: number;
  glebAtWindow?: boolean;
  glebOnRoof?: boolean;
}> = ({v, time, shot, osokaOn, nina, led = 0, reflect = 0, glebAtWindow, glebOnRoof}) => {
  const morning = time === 'dawn';
  const center = useTarget([CAMPUS_X, 0, 0]);
  const inside = shot === 'waiting' || shot === 'radio' || shot === 'silent';
  return (
    <group position={[CAMPUS_X, 0, 0]}>
      {time === 'dusk' ? <SkyDome top="#1b2638" horizon="#55698a" low="#2a3446" /> : null}
      {time === 'night' ? <SkyDome top="#05070b" horizon="#141b26" low="#090c12" /> : null}
      {time === 'dawn' ? <SkyDome top="#7d8b99" horizon="#c9cdcc" low="#9aa2a8" /> : null}
      <Ground />
      <Town />
      {morning ? (
        <MorningMass v={v} />
      ) : (
        <>
          <Building b={KOVYL} lit={time === 'night' ? KOVYL_LIT : LIT('kovyl-d', 0.25)} />
          <Building b={OSOKA} lit={osokaOn ? OSOKA_LIT : undefined} />
          <Fence />
          {LAMPS.map((p, i) => (
            <YardLamp key={i} p={p} on={osokaOn || i === 0} />
          ))}
          <Car p={[-9, 0, -6]} rot={0.1} color="#4d5660" />
          <Car p={[-6.5, 0, -6.4]} rot={-0.05} color="#2e3338" />
          <Car p={[10, 0, 0.5]} rot={1.5} color="#6d747a" />
        </>
      )}
      <Building b={THIRD} lit={time === 'night' ? LIT('third', 0.1) : undefined} />
      {morning ? <Roof /> : null}
      {inside ? <Corridor2 v={v} led={led} reflect={reflect} gleb={!!glebAtWindow} /> : null}
      {nina ? <Nina v={v} from={nina[0]} to={nina[1]} /> : null}
      {glebOnRoof ? (
        <Gleb
          position={GLEB_ON_ROOF}
          rotation={GLEB_ROOF_ROT}
          skirtSwing={-0.12 - 0.08 * Math.sin(v * 3.1) * Math.sin(v * 1.3 + 1)}
          pose={{armL: [0.55, 0.1], armR: [0.6, -0.1], elbowL: 0.35, elbowR: 0.3, head: [0.15, 0.05], stoop: 0.12}}
        />
      ) : null}
      {/* light by time of day */}
      {time === 'dusk' ? (
        <>
          <hemisphereLight color="#5d78a3" groundColor="#14181f" intensity={0.22} />
          <directionalLight position={[-40, 50, -30]} color="#8ea6c9" intensity={0.15} target={center} />
        </>
      ) : null}
      {time === 'night' ? (
        <>
          <hemisphereLight color="#2b3a52" groundColor="#08090c" intensity={0.12} />
          <ambientLight intensity={0.03} color="#9fb4c8" />
        </>
      ) : null}
      {time === 'dawn' ? (
        <>
          <hemisphereLight color="#c3ccd5" groundColor="#383d43" intensity={0.6} />
          <directionalLight
            position={[110, 45, -50]}
            color="#e8e4d8"
            intensity={1.0}
            target={center}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-70}
            shadow-camera-right={70}
            shadow-camera-top={70}
            shadow-camera-bottom={-70}
            shadow-camera-near={1}
            shadow-camera-far={400}
            shadow-bias={-0.0005}
            shadow-normalBias={0.2}
          />
        </>
      ) : null}
      {osokaOn && time === 'night' ? <pointLight position={[0, 5, -10]} color="#e8e0c8" intensity={30} distance={22} decay={2} /> : null}
    </group>
  );
};

export const smoothK = smooth;
export {Ico};
