import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box, Cyl, Ico} from '../scene/parts';
import {Person, PersonPose} from '../scene/Characters';
import {useCanvas} from '../gta/tex';
import {mix} from '../gta/props';
import {V3, clamp01, lerp, rnd} from './cues';
import {drawCard, drawChart, drawError503, drawGame, drawGrechka, drawMonitor, drawRefund, drawTicker, drawTinyRefund, drawDiscCover, drawUpload, drawBubbleLabel} from './tex2';

const SHIRTS = ['#e85d5d', '#4a7fd0', '#f2c14e', '#6fbf73', '#b36ad1', '#ef8f4a', '#4fb6c2', '#d9d9de', '#3d3d48', '#c85b8a'];
const PANTS = ['#2c3550', '#3a3a40', '#5a4a3a', '#24364a', '#4a4a52'];
const HAIR = ['#2a1d15', '#4a3324', '#7b5434', '#c9a46a', '#1a1a1a', '#8a8a8a'];

// a plane with a canvas picture (unlit, so screens glow)
export const CanvasPlane: React.FC<{
  size: [number, number];
  res: [number, number];
  k: string;
  draw: (g: CanvasRenderingContext2D, W: number, H: number) => void;
  position?: V3;
  rotation?: V3;
  glow?: number;
}> = ({size, res, k, draw, position, rotation, glow = 1}) => {
  const tex = useCanvas(res[0], res[1], k, (g) => draw(g, res[0], res[1]));
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={tex} toneMapped={false} color={new THREE.Color(glow, glow, glow)} />
    </mesh>
  );
};

// ---------- phones ----------

// the fan's phone, held upright, screen facing +z
export const BigPhone: React.FC<{pressed: number; thumb: number}> = ({pressed, thumb}) => (
  <group>
    <Box size={[0.078, 0.162, 0.009]} color="#16161a" />
    <CanvasPlane size={[0.071, 0.152]} res={[420, 900]} k={`r${pressed > 0.5}`} draw={(g, W, H) => drawRefund(g, W, H, pressed)} position={[0, 0, 0.0075]} />
    {/* the hand: fingers round the back and the sides, the thumb coming down onto the button */}
    <Box size={[0.1, 0.09, 0.03]} position={[0.004, -0.05, -0.022]} color="#e8c6a6" />
    <Box size={[0.018, 0.08, 0.022]} position={[-0.048, -0.03, -0.004]} color="#e8c6a6" />
    <Box size={[0.022, 0.058, 0.02]} position={[lerp(0.075, 0.012, thumb), lerp(-0.075, -0.044, thumb), lerp(0.03, 0.017, thumb)]} rotation={[0, 0, lerp(-0.2, 0.5, thumb)]} color="#e8c6a6" />
  </group>
);

const TinyPhone: React.FC<{pressed: boolean}> = ({pressed}) => {
  const tex = useCanvas(60, 120, `t${pressed}`, (g) => drawTinyRefund(g, 60, 120, pressed));
  return (
    <group rotation={[-1.2, 0, 0]} position={[0, -0.02, 0.05]}>
      <Box size={[0.07, 0.012, 0.14]} color="#16161a" />
      <mesh position={[0, 0.0075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.062, 0.13]} />
        <meshBasicMaterial map={tex} toneMapped={false} color={new THREE.Color(1.6, 1.6, 1.6)} />
      </mesh>
    </group>
  );
};

// people on the avenue, all staring at their phones, pressing «refund» one after another
export const PhoneCrowd: React.FC<{v: number; from: number; n?: number; area?: [number, number, number, number]}> = ({v, from, n = 34, area = [-14, 22, -3, 7.5]}) => (
  <>
    {Array.from({length: n}).map((_, i) => {
      const x = lerp(area[0], area[1], rnd(i * 7 + 1));
      const z = lerp(area[2], area[3], rnd(i * 7 + 2));
      const press = from + rnd(i * 7 + 3) * 2.2;
      const sway = Math.sin(v * 1.3 + i) * 0.05;
      return (
        <group key={i}>
          <Person
            position={[x, z < -0.5 ? 0.14 : 0.02, z]}
            rotation={rnd(i * 7 + 4) * Math.PI * 2}
            shirt={SHIRTS[i % SHIRTS.length]}
            pants={PANTS[i % PANTS.length]}
            hair={HAIR[i % HAIR.length]}
            longHair={i % 3 === 0}
            pose={{head: [0.5 + sway, 0], armR: [1.1, -0.15], elbowR: 1.0, armL: [0.5, 0.15], elbowL: 0.8}}
            rightHand={<TinyPhone pressed={v > press} />}
          />
          {v > press && v < press + 0.5 ? <pointLight position={[x, 1.6, z]} color="#2fbf71" intensity={0.6} distance={2} decay={2} /> : null}
        </group>
      );
    })}
  </>
);

// ---------- the server room ----------

const RACKS = 7; // per side
export const ServerRoom: React.FC<{v: number; red: number; offAt: (k: number) => number; screenOn: number}> = ({v, red, offAt, screenOn}) => {
  const n = RACKS * 2 * 6 * 5;
  const {mesh, dummy} = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.04, 0.025, 0.012);
    const mat = new THREE.MeshBasicMaterial({toneMapped: false});
    const m = new THREE.InstancedMesh(geo, mat, n);
    return {mesh: m, dummy: new THREE.Object3D()};
  }, [n]);
  const c = new THREE.Color();
  let i = 0;
  for (let side = 0; side < 2; side++) {
    for (let r = 0; r < RACKS; r++) {
      const k = side * RACKS + r;
      const dead = v >= offAt(k);
      const x = side === 0 ? -0.7 : 0.7;
      const z = -1 - r * 1.15;
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 5; col++) {
          dummy.position.set(x + (side === 0 ? 0.008 : -0.008), 0.45 + row * 0.28, z - 0.3 + col * 0.15);
          dummy.rotation.set(0, Math.PI / 2, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          const blink = Math.sin(v * (7 + ((i * 13) % 11)) + i) > -0.3;
          if (dead) c.set('#120808');
          else if (red > 0.5) c.set(blink ? '#ff2a2a' : '#5a0a0a');
          else c.set(blink ? (i % 7 === 0 ? '#ffb02a' : '#2aff7a') : '#0a3a1a');
          mesh.setColorAt(i, c);
          i++;
        }
      }
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return (
    <group>
      <Box size={[3.4, 0.1, 12]} position={[0, -0.05, -5]} color="#2a2d33" />
      {/* floor tiles: a lighter grid, 3 mm proud */}
      {Array.from({length: 10}).map((_, k) => (
        <Box key={k} size={[3.4, 0.006, 0.03]} position={[0, 0.003, -0.4 - k * 1.15]} color="#3a3e46" shadow={false} />
      ))}
      <Box size={[3.4, 0.1, 12]} position={[0, 2.85, -5]} color="#1d1f24" />
      <Box size={[0.1, 2.9, 12]} position={[-1.75, 1.4, -5]} color="#24272d" />
      <Box size={[0.1, 2.9, 12]} position={[1.75, 1.4, -5]} color="#24272d" />
      {Array.from({length: RACKS * 2}).map((_, k) => {
        const side = k < RACKS ? 0 : 1;
        const r = k % RACKS;
        const x = side === 0 ? -1.15 : 1.15;
        return <Box key={k} size={[0.88, 2.2, 1.05]} position={[x, 1.1, -1 - r * 1.15]} color="#17181d" />;
      })}
      <primitive object={mesh} />
      {/* ceiling light strips: on, then the red emergency light */}
      {Array.from({length: 5}).map((_, k) => (
        <Box key={k} size={[0.3, 0.04, 1.4]} position={[0, 2.78, -0.8 - k * 2.3]} color={red > 0.5 ? '#3a0c0c' : '#e8f0ff'} emissive={red > 0.5 ? '#ff2020' : '#cfe0ff'} emissiveIntensity={red > 0.5 ? 0.6 + 0.4 * Math.sin(v * 9) : 1.2} shadow={false} />
      ))}
      {/* the big status screen at the end of the aisle */}
      <Box size={[1.7, 1.0, 0.08]} position={[0, 1.7, -10.4]} color="#0e0e12" />
      <CanvasPlane size={[1.6, 0.9]} res={[640, 360]} k={`e${screenOn.toFixed(2)}`} draw={(g, W, H) => drawError503(g, W, H, screenOn)} position={[0, 1.7, -10.355]} />
    </group>
  );
};

// sparks flying out of a rack front
export const Sparks: React.FC<{at: V3; age: number; seed: number; dir?: number}> = ({at, age, seed, dir = 1}) => {
  if (age < 0 || age > 0.8) return null;
  return (
    <>
      {Array.from({length: 12}).map((_, i) => {
        const a = (rnd(seed + i) - 0.5) * 2;
        const sp = 1.5 + rnd(seed + i + 20) * 2.5;
        const y = at[1] + (1.5 + rnd(seed + i + 40) * 2) * age - 4.9 * age * age;
        return (
          <Box
            key={i}
            size={[0.025, 0.025, 0.025]}
            position={[at[0] + dir * sp * age * 0.6, y, at[2] + a * sp * age * 0.5]}
            color="#fff2b0"
            emissive="#ffb02a"
            emissiveIntensity={3 * (1 - age / 0.8)}
            shadow={false}
          />
        );
      })}
    </>
  );
};

// ---------- the trading floor ----------

export const TradingFloor: React.FC<{v: number; k: number; pct: number; red: number; face: number}> = ({v, k, pct, red, face}) => (
  <group>
    <Box size={[24, 0.1, 22]} position={[0, -0.05, -4]} color="#1b1d24" />
    <Box size={[24, 9, 0.2]} position={[0, 4.5, -11]} color="#121318" />
    <Box size={[16.4, 7.4, 0.12]} position={[0, 4.6, -10.85]} color="#0a0b0f" />
    <CanvasPlane size={[16, 7]} res={[1600, 700]} k={`c${k.toFixed(3)}-${Math.round(pct)}`} draw={(g, W, H) => drawChart(g, W, H, k, pct)} position={[0, 4.6, -10.785]} />
    {/* rows of desks with small screens that flick from green to red */}
    {Array.from({length: 3}).map((_, row) =>
      Array.from({length: 5}).map((__, col) => {
        const x = -6 + col * 3;
        const z = -6 + row * 2.6;
        const r = v > 12.55 + (row * 5 + col) * 0.05 ? 1 : 0;
        return (
          <group key={`${row}-${col}`} position={[x, 0, z]}>
            <Box size={[2.4, 0.08, 0.9]} position={[0, 0.74, 0]} color="#3a3d46" />
            <Box size={[0.08, 0.74, 0.8]} position={[-1.1, 0.37, 0]} color="#2a2d34" />
            <Box size={[0.08, 0.74, 0.8]} position={[1.1, 0.37, 0]} color="#2a2d34" />
            {[-0.6, 0, 0.6].map((mx) => (
              <group key={mx}>
                <Box size={[0.5, 0.32, 0.04]} position={[mx, 1.02, -0.25]} color="#111" />
                <Box size={[0.46, 0.28, 0.01]} position={[mx, 1.02, -0.226]} color={r ? '#ff2a3a' : '#2aff7a'} emissive={r ? '#ff1a2a' : '#1aff6a'} emissiveIntensity={0.9} shadow={false} />
              </group>
            ))}
            <Person
              position={[0, -0.28, 0.75]}
              rotation={Math.PI}
              shirt="#f2f2f4"
              pants="#2c3550"
              hair={HAIR[(row * 5 + col) % HAIR.length]}
              pose={{legL: 1.45, legR: 1.45, armL: [0.9, 0.1], armR: [0.9, -0.1], elbowL: 0.5, elbowR: 0.5, head: [r ? -0.3 : 0.1, 0]}}
              bodyExtra={<Box size={[0.12, 0.3, 0.02]} position={[0, 1.3, 0.16]} color="#c0303a" shadow={false} />}
            />
          </group>
        );
      }),
    )}
    {/* the trader closest to us: head goes down on the keyboard */}
    <group position={[2.6, 0, 1.4]}>
      <Box size={[1.6, 0.08, 0.8]} position={[0, 0.74, 0]} color="#3a3d46" />
      <Box size={[0.08, 0.74, 0.7]} position={[-0.75, 0.37, 0]} color="#2a2d34" />
      <Box size={[0.08, 0.74, 0.7]} position={[0.75, 0.37, 0]} color="#2a2d34" />
      <Box size={[0.5, 0.025, 0.18]} position={[0, 0.79, 0.05]} color="#222" />
      <Box size={[0.6, 0.38, 0.04]} position={[0, 1.08, -0.25]} color="#111" />
      <Box size={[0.56, 0.34, 0.01]} position={[0, 1.08, -0.226]} color={red ? '#ff2a3a' : '#2aff7a'} emissive={red ? '#ff1a2a' : '#1aff6a'} emissiveIntensity={0.9} shadow={false} />
      <group position={[0, 0.45, 0.62]} rotation={[-0.75 * face, 0, 0]}>
        <Person
          position={[0, -0.73, 0]}
          rotation={Math.PI}
          shirt="#f2f2f4"
          pants="#2c3550"
          hair="#2a1d15"
          pose={{legL: 1.45, legR: 1.45, armL: [0.9 + 0.6 * face, 0.15], armR: [0.9 + 0.6 * face, -0.15], elbowL: 0.6, elbowR: 0.6, head: [0.2 + 0.4 * face, 0], eyes: 1 + 0.5 * (1 - face), mouth: 0.6 * (1 - face)}}
          bodyExtra={<Box size={[0.12, 0.3, 0.02]} position={[0, 1.3, 0.16]} color="#c0303a" shadow={false} />}
        />
      </group>
    </group>
  </group>
);

// ---------- dominoes with tickers ----------

const DOM = {w: 1.2, h: 2.6, d: 0.32, gap: 1.5};
export const DOMINO_X = (i: number) => i * DOM.gap;
const TICK = [
  ['TTWO', '#ff3d8b'],
  ['SONY', '#38a2ff'],
  ['MSFT', '#2fbf71'],
  ['NVDA', '#9be52a'],
];
export const Dominoes: React.FC<{angles: number[]}> = ({angles}) => (
  <group>
    {angles.map((a, i) => (
      // pivot on the bottom edge on the +x side, falls towards +x
      <group key={i} position={[DOMINO_X(i) + DOM.d / 2, 0, 0]} rotation={[0, 0, -a]}>
        <group position={[-DOM.d / 2, DOM.h / 2, 0]}>
          <Box size={[DOM.d, DOM.h, DOM.w]} color="#efece4" />
          <CanvasPlane
            size={[DOM.w * 0.92, DOM.h * 0.92]}
            res={[300, 650]}
            k={TICK[i][0]}
            draw={(g, W, H) => drawTicker(g, W, H, TICK[i][0], TICK[i][1])}
            position={[-DOM.d / 2 - 0.004, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            glow={0.9}
          />
        </group>
      </group>
    ))}
  </group>
);
export const DOMINO_CONTACT = Math.asin((DOM.gap - DOM.d) / DOM.h);

// ---------- the AI bubble ----------

export const AiBubble: React.FC<{position: V3; r: number; t: number; pop: number}> = ({position, r, t, pop}) => {
  const tex = useCanvas(512, 400, 'ii', (g) => drawBubbleLabel(g, 512, 400));
  if (pop > 0) {
    // droplets flying out from the shell
    return (
      <group position={position}>
        {pop < 1.6
          ? Array.from({length: 60}).map((_, i) => {
              const d = new THREE.Vector3(rnd(i + 1) - 0.5, rnd(i + 2) - 0.5, rnd(i + 3) - 0.5).normalize();
              const s = r * (1 + pop * 1.4);
              return <Ico key={i} radius={r * 0.04 * (1 - pop / 1.6)} position={[d.x * s, d.y * s - 9.8 * pop * pop, d.z * s]} color="#d8f6ff" emissive="#9fe8ff" emissiveIntensity={1.2} shadow={false} />;
            })
          : null}
      </group>
    );
  }
  const wob = 1 + 0.02 * Math.sin(t * 3.1);
  return (
    <group position={position}>
      <mesh scale={[wob, 1 / wob, wob]}>
        <sphereGeometry args={[r, 48, 32]} />
        <meshPhysicalMaterial color="#cfe9ff" transparent opacity={0.28} roughness={0.05} metalness={0.2} iridescence={1} iridescenceIOR={1.6} emissive="#5a7aff" emissiveIntensity={0.25} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[r * 1.2, r * 0.94]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
};

// cardboard boxes (layoffs) falling onto the street
export const FallingBoxes: React.FC<{v: number; from: number; n?: number; area: [number, number, number, number]}> = ({v, from, n = 26, area}) => (
  <>
    {Array.from({length: n}).map((_, i) => {
      const t0 = from + rnd(i * 5 + 1) * 2.0;
      const x = lerp(area[0], area[1], rnd(i * 5 + 2));
      const z = lerp(area[2], area[3], rnd(i * 5 + 3));
      const age = v - t0;
      const h0 = 22;
      const y = age < 0 ? h0 : Math.max(0.2, h0 - 4.9 * 1.6 * age * age);
      const landed = y <= 0.2;
      return (
        <group key={i} position={[x, y, z]} rotation={landed ? [0, rnd(i) * 3, 0] : [age * 3 + i, age * 2, i]}>
          <Box size={[0.5, 0.4, 0.4]} color="#b9874e" />
          <Box size={[0.505, 0.06, 0.405]} position={[0, 0.12, 0]} color="#8f6638" />
        </group>
      );
    })}
  </>
);

// a box in the hands of a person walking out
export const CarryBox: React.FC = () => (
  <group position={[0, 1.12, 0.36]}>
    <Box size={[0.48, 0.32, 0.34]} color="#b9874e" />
    <Box size={[0.08, 0.14, 0.08]} position={[-0.12, 0.2, 0]} color="#3a8a4a" />
    <Box size={[0.1, 0.12, 0.02]} position={[0.1, 0.2, 0.05]} color="#f2f2f4" />
  </group>
);
export const BOX_POSE: PersonPose = {armL: [0.55, 0.12], armR: [0.55, -0.12], elbowL: 1.0, elbowR: 1.0};

// ---------- the studio office ----------

export const DESKS: {x: number; z: number; leaves: number}[] = (() => {
  const out: {x: number; z: number; leaves: number}[] = [];
  let k = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      out.push({x: -3.3 + col * 2.2, z: -1 - row * 2.2, leaves: k % 2 === 0 ? (k / 2) % 6 : -1});
      k++;
    }
  }
  return out;
})();

export const Studio: React.FC<{v: number; stand: number[]}> = ({v, stand}) => (
  <group>
    <Box size={[12, 0.1, 10]} position={[0, -0.05, -3.5]} color="#4a4038" />
    <Box size={[12, 0.1, 10]} position={[0, 3.05, -3.5]} color="#e6e2dc" />
    <Box size={[0.1, 3, 10]} position={[-6, 1.5, -3.5]} color="#d8d2c8" />
    <Box size={[0.1, 3, 10]} position={[6, 1.5, -3.5]} color="#d8d2c8" />
    {/* the back wall: a long window on the night city */}
    <Box size={[12, 0.8, 0.12]} position={[0, 0.4, -8.5]} color="#d8d2c8" />
    <Box size={[12, 0.5, 0.12]} position={[0, 2.8, -8.5]} color="#d8d2c8" />
    <mesh position={[0, 1.6, -9.5]}>
      <planeGeometry args={[14, 4]} />
      <meshBasicMaterial color="#2a2140" toneMapped={false} />
    </mesh>
    {Array.from({length: 10}).map((_, i) => (
      <Box key={i} size={[0.9, 1 + rnd(i + 3) * 1.6, 0.3]} position={[-5.5 + i * 1.2, 0.8 + (1 + rnd(i + 3) * 1.6) / 2, -9.3]} color="#171427" emissive="#ffb850" emissiveIntensity={0.05} shadow={false} />
    ))}
    {/* ceiling lamps */}
    {[-3, 0, 3].map((x) => (
      <Box key={x} size={[1.6, 0.04, 0.3]} position={[x, 2.97, -3]} color="#ffffff" emissive="#fff6e0" emissiveIntensity={1.0} shadow={false} />
    ))}
    {DESKS.map((d, k) => {
      const gone = d.leaves >= 0 ? v - stand[d.leaves] : -1;
      const sat = gone < 0;
      const walk = Math.max(0, gone - 0.35);
      return (
        <group key={k} position={[d.x, 0, d.z]}>
          <Box size={[1.6, 0.06, 0.8]} position={[0, 0.74, 0]} color="#efe8dc" />
          <Box size={[0.06, 0.74, 0.7]} position={[-0.75, 0.37, 0]} color="#bdb6aa" />
          <Box size={[0.06, 0.74, 0.7]} position={[0.75, 0.37, 0]} color="#bdb6aa" />
          <Box size={[0.62, 0.4, 0.04]} position={[0, 1.04, -0.22]} color="#111" />
          <CanvasPlane size={[0.58, 0.36]} res={[232, 144]} k={`m${k}-${gone > 0}`} draw={(g, W, H) => drawMonitor(g, W, H, k, gone > 0.2)} position={[0, 1.04, -0.196]} />
          <Box size={[0.45, 0.02, 0.15]} position={[0, 0.78, 0.08]} color="#2a2a2e" />
          {/* chair */}
          <Box size={[0.5, 0.08, 0.5]} position={[0, 0.48, 0.65 + Math.min(0.4, Math.max(0, gone) * 0.8)]} color="#2a2a32" />
          <Box size={[0.5, 0.55, 0.08]} position={[0, 0.8, 0.9 + Math.min(0.4, Math.max(0, gone) * 0.8)]} color="#2a2a32" />
          <Cyl rTop={0.03} rBottom={0.03} height={0.44} position={[0, 0.22, 0.65 + Math.min(0.4, Math.max(0, gone) * 0.8)]} color="#555" segments={6} />
          {sat ? (
            <Person
              position={[0, 0.48 - 0.9 + 0.1 + 0.02, 0.62]}
              rotation={Math.PI}
              shirt={SHIRTS[(k * 3) % SHIRTS.length]}
              pants={PANTS[k % PANTS.length]}
              hair={HAIR[k % HAIR.length]}
              longHair={k % 3 === 1}
              pose={{legL: 1.45, legR: 1.45, armL: [0.85, 0.12], armR: [0.85, -0.12], elbowL: 0.55, elbowR: 0.55, head: [0.05 + 0.04 * Math.sin(v * 2 + k), 0]}}
            />
          ) : walk < 4 ? (
            <Person
              position={[walk * 1.6, 0.0, 1.1]}
              rotation={Math.PI / 2}
              shirt={SHIRTS[(k * 3) % SHIRTS.length]}
              pants={PANTS[k % PANTS.length]}
              hair={HAIR[k % HAIR.length]}
              longHair={k % 3 === 1}
              pose={{...BOX_POSE, legL: Math.sin(walk * 9) * 0.5 * clamp01(walk * 4), legR: -Math.sin(walk * 9) * 0.5 * clamp01(walk * 4), head: [0.25, 0]}}
              bodyExtra={<CarryBox />}
            />
          ) : null}
        </group>
      );
    })}
  </group>
);

// ---------- the leak: a dark bedroom, a laptop, a USB stick ----------

export const LeakRoom: React.FC<{v: number; usb: number; k: number; done: number}> = ({v, usb, k, done}) => (
  <group>
    <Box size={[5, 0.1, 5]} position={[0, -0.05, 0]} color="#2a2430" />
    <Box size={[5, 2.8, 0.1]} position={[0, 1.4, -1.6]} color="#2e2a3a" />
    <Box size={[0.1, 2.8, 5]} position={[-2, 1.4, 0]} color="#29253a" />
    {/* posters, 4 mm off the wall */}
    <Box size={[0.6, 0.85, 0.01]} position={[-1.1, 1.75, -1.545]} color="#c2365a" shadow={false} />
    <Box size={[0.5, 0.5, 0.01]} position={[1.2, 1.9, -1.545]} color="#38a2ff" shadow={false} />
    {/* window with the night outside, rain streaks */}
    <Box size={[1.2, 1.0, 0.04]} position={[0.2, 1.8, -1.535]} color="#0d1428" emissive="#1a2a5a" emissiveIntensity={0.4} shadow={false} />
    {/* the desk */}
    <Box size={[1.6, 0.06, 0.8]} position={[0, 0.74, -1.0]} color="#4a3a2e" />
    <Box size={[0.06, 0.74, 0.7]} position={[-0.75, 0.37, -1.0]} color="#3a2e24" />
    <Box size={[0.06, 0.74, 0.7]} position={[0.75, 0.37, -1.0]} color="#3a2e24" />
    {/* energy drink cans */}
    {[0, 1, 2].map((i) => (
      <Cyl key={i} rTop={0.033} rBottom={0.033} height={0.12} position={[0.5 + i * 0.08, 0.83, -1.2 + (i % 2) * 0.1]} color={i === 1 ? '#9be52a' : '#2a2a2e'} segments={10} />
    ))}
    {/* the laptop */}
    <group position={[0, 0.77, -0.95]}>
      <Box size={[0.5, 0.02, 0.34]} position={[0, 0.01, 0]} color="#3a3d44" />
      <group position={[0, 0.02, -0.17]} rotation={[-0.25, 0, 0]}>
        <Box size={[0.5, 0.32, 0.015]} position={[0, 0.16, 0]} color="#2a2d33" />
        <CanvasPlane size={[0.46, 0.29]} res={[690, 435]} k={`u${usb > 0.5}-${k.toFixed(2)}-${done > 0.5}`} draw={(g, W, H) => drawUpload(g, W, H, usb, k, done)} position={[0, 0.16, 0.0115]} />
      </group>
      {/* the stick slides into the side port */}
      <group position={[0.25 + 0.06 * (1 - usb), 0.012, 0.05]}>
        <Box size={[0.06, 0.012, 0.02]} color="#d8d8de" />
        <Box size={[0.03, 0.014, 0.022]} position={[0.04, 0, 0]} color="#c0303a" />
        {usb > 0.9 ? <Box size={[0.006, 0.006, 0.006]} position={[0.058, 0.009, 0]} color="#7dffb0" emissive="#3aff7a" emissiveIntensity={3 * (0.6 + 0.4 * Math.sin(v * 20))} shadow={false} /> : null}
      </group>
    </group>
    <pointLight position={[0, 1.35, -1.3]} color={done > 0.5 ? '#7dffb0' : '#8ab0ff'} intensity={1.4} distance={3} decay={2} />
    {/* the man in the hood, hunched over */}
    <Person
      position={[0, -0.38, -0.25]}
      rotation={Math.PI}
      shirt="#2b2b33"
      pants="#1d1d22"
      hair="#1a1a1a"
      pose={{legL: 1.45, legR: 1.45, armL: [0.95, 0.15], armR: [usb < 1 ? 1.1 : 0.95, -0.2], elbowL: 0.7, elbowR: 0.6, head: [0.3, 0]}}
      headExtra={
        <group>
          <Box size={[0.38, 0.12, 0.38]} position={[0, 0.39, -0.01]} color="#24242c" />
          <Box size={[0.06, 0.42, 0.36]} position={[-0.185, 0.18, -0.02]} color="#24242c" />
          <Box size={[0.06, 0.42, 0.36]} position={[0.185, 0.18, -0.02]} color="#24242c" />
          <Box size={[0.38, 0.42, 0.06]} position={[0, 0.2, -0.17]} color="#24242c" />
        </group>
      }
    />
    <Box size={[0.5, 0.08, 0.5]} position={[0, 0.42, -0.25]} color="#1d1d22" />
  </group>
);

// ---------- the card terminal on a shop counter ----------

export const CardCounter: React.FC<{v: number; tap: number; declined: number; away?: number}> = ({v, tap, declined, away = 0}) => (
  <group>
    <Box size={[3, 0.9, 1.0]} position={[0, 0.45, 0]} color="#c8c2b8" />
    <Box size={[3.02, 0.04, 1.02]} position={[0, 0.92, 0]} color="#8a8478" />
    {/* the terminal */}
    <group position={[0, 0.94, 0.1]} rotation={[-0.35, 0, 0]}>
      <Box size={[0.16, 0.05, 0.3]} position={[0, 0.025, 0]} color="#2a2a2e" />
      <mesh position={[0, 0.0525, -0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.13, 0.1]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      <group position={[0, 0.054, -0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <CanvasPlane size={[0.12, 0.09]} res={[480, 360]} k={`d${declined > 0.5}`} draw={(g, W, H) => drawCard(g, W, H, declined)} position={[0, 0, 0.001]} />
      </group>
      {Array.from({length: 12}).map((_, i) => (
        <Box key={i} size={[0.03, 0.008, 0.022]} position={[-0.04 + (i % 3) * 0.04, 0.053, 0.03 + Math.floor(i / 3) * 0.03]} color="#55555c" shadow={false} />
      ))}
    </group>
    {/* the hand with the card */}
    <group position={[0.02 + 0.25 * away, 1.08 - 0.06 * tap + 0.15 * away, 0.12 + 0.02 * tap + 0.35 * away]} rotation={[-0.4, 0.2, 0]}>
      <Box size={[0.085, 0.004, 0.054]} position={[0, 0, 0]} color="#2a6fd0" />
      <Box size={[0.012, 0.0045, 0.01]} position={[-0.02, 0.0005, 0.005]} color="#e8c870" shadow={false} />
      <Box size={[0.07, 0.03, 0.09]} position={[0.05, 0.012, 0.03]} color="#e8c6a6" />
    </group>
    {declined > 0.5 ? <pointLight position={[0, 1.1, 0.0]} color="#ff2a2a" intensity={0.8} distance={1.5} decay={2} /> : null}
    {/* shelves behind, blurred by the fog */}
    {Array.from({length: 4}).map((_, i) => (
      <Box key={i} size={[3.4, 0.05, 0.4]} position={[0, 0.6 + i * 0.5, -2]} color="#9a9488" />
    ))}
    <Box size={[3.6, 2.6, 0.1]} position={[0, 1.3, -2.25]} color="#b8b2a6" />
  </group>
);

// ---------- the supermarket aisle with one pack left ----------

export const Aisle: React.FC<{v: number; pull: number}> = ({v, pull}) => {
  const tex = useCanvas(200, 280, 'grechka', (g) => drawGrechka(g, 200, 280));
  const tug = Math.sin(v * 14) * 0.08 * pull;
  return (
    <group>
      <Box size={[6, 0.1, 14]} position={[0, -0.05, -4]} color="#cfc9bd" />
      <Box size={[6, 0.1, 14]} position={[0, 3.05, -4]} color="#e8e4dc" />
      {[-1.4, 1.4].map((x) => (
        <group key={x}>
          <Box size={[0.6, 2.1, 12]} position={[x + Math.sign(x) * 0.3, 1.05, -4]} color="#8a8f96" />
          {[0.35, 0.85, 1.35, 1.85].map((y) => (
            <Box key={y} size={[0.66, 0.04, 12]} position={[x + Math.sign(x) * 0.3, y, -4]} color="#b8bdc4" />
          ))}
          {/* a few toppled leftovers */}
          {Array.from({length: 5}).map((_, i) => (
            <Box key={i} size={[0.14, 0.2, 0.1]} position={[x + Math.sign(x) * 0.15, 0.37 + 0.1 + (i % 2) * 0.5, -1 - i * 2.2]} rotation={[0, i, i % 2 ? 1.4 : 0]} color={SHIRTS[(i * 3) % SHIRTS.length]} />
          ))}
        </group>
      ))}
      {/* flickering lamps */}
      {Array.from({length: 4}).map((_, i) => {
        const on = Math.sin(v * (17 + i * 5) + i) > (i === 1 ? 0.2 : -0.6);
        return <Box key={i} size={[0.3, 0.04, 1.6]} position={[0, 2.97, -1 - i * 3]} color={on ? '#ffffff' : '#555'} emissive={on ? '#f0f6ff' : '#000'} emissiveIntensity={on ? 1.2 : 0} shadow={false} />;
      })}
      {/* the last pack and the two people pulling it */}
      <group position={[tug, 1.3, -1.8]} rotation={[0, 0, tug * 2]}>
        <Box size={[0.2, 0.28, 0.08]} color="#c2541a" />
        <mesh position={[0, 0, 0.0425]}>
          <planeGeometry args={[0.19, 0.27]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      </group>
      <Person
        position={[-0.62 + tug * 0.5, 0, -1.85]}
        rotation={Math.PI / 2}
        shirt="#e85d5d"
        pants="#2c3550"
        hair="#2a1d15"
        pose={{armL: [1.3, 0.25], armR: [1.3, -0.1], elbowL: 0.1, elbowR: 0.1, head: [0.1, 0], mouth: 0.7, legL: -0.3, legR: 0.3}}
      />
      <Person
        position={[0.62 + tug * 0.5, 0, -1.75]}
        rotation={-Math.PI / 2}
        shirt="#6fbf73"
        pants="#3a3a40"
        hair="#8a8a8a"
        longHair
        pose={{armL: [1.3, 0.1], armR: [1.3, -0.25], elbowL: 0.1, elbowR: 0.1, head: [0.1, 0], mouth: 0.8, legL: 0.3, legR: -0.3}}
      />
      {/* others running down the aisle with carts */}
      {[0, 1, 2].map((i) => {
        const z = -10 + ((v * 3 + i * 3) % 8);
        return (
          <group key={i}>
            <Person position={[-0.4 + i * 0.4, 0, z]} rotation={0} shirt={SHIRTS[(i + 4) % SHIRTS.length]} pants="#2c3550" hair={HAIR[i]} pose={{armL: [0.9, 0.1], armR: [0.9, -0.1], legL: Math.sin(v * 12 + i) * 0.6, legR: -Math.sin(v * 12 + i) * 0.6}} />
            <Box size={[0.5, 0.4, 0.7]} position={[-0.4 + i * 0.4, 0.6, z + 0.75]} color="#9aa0a8" opacity={0.85} />
          </group>
        );
      })}
    </group>
  );
};

// ---------- the old TV, the console and the car battery in the ash ----------

export const OldTv: React.FC<{position: V3; rotation?: number; on: number; k: number; err: number}> = ({position, rotation = 0, on, k, err}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[0.62, 0.48, 0.45]} position={[0, 0.24, -0.05]} color="#3a3633" />
    <Box size={[0.4, 0.3, 0.25]} position={[0, 0.24, -0.35]} color="#33302d" />
    <Box size={[0.56, 0.4, 0.01]} position={[0, 0.25, 0.175]} color="#0a0a0a" />
    <CanvasPlane size={[0.5, 0.36]} res={[800, 576]} k={`g${on.toFixed(2)}-${k.toFixed(2)}-${err.toFixed(2)}`} draw={(g, W, H) => drawGame(g, W, H, on, k, err)} position={[0, 0.25, 0.1835]} />
    {/* a crack across the case */}
    <Box size={[0.2, 0.012, 0.012]} position={[0.18, 0.47, 0.17]} rotation={[0, 0, 0.5]} color="#1a1816" shadow={false} />
    {on > 0 ? <pointLight position={[0, 0.3, 0.6]} color="#ff8ab0" intensity={1.6 * on} distance={3} decay={2} /> : null}
  </group>
);

export const Console: React.FC<{position: V3; disc: number}> = ({position, disc}) => (
  <group position={position}>
    <Box size={[0.36, 0.08, 0.26]} position={[0, 0.04, 0]} color="#e8e8ec" />
    <Box size={[0.372, 0.02, 0.272]} position={[0, 0.06, 0]} color="#1a1a1e" />
    <Box size={[0.02, 0.006, 0.01]} position={[0.14, 0.04, 0.132]} color="#38a2ff" emissive="#38a2ff" emissiveIntensity={disc > 0.9 ? 2 : 0} shadow={false} />
    {/* the disc goes into the slot */}
    {disc < 1 ? (
      <group position={[-0.02, 0.04, 0.13 + 0.12 * (1 - disc)]} rotation={[Math.PI / 2, 0, 0]}>
        <Cyl rTop={0.06} rBottom={0.06} height={0.004} color="#d8dce2" segments={20} />
      </group>
    ) : null}
  </group>
);

export const CarBattery: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <Box size={[0.3, 0.2, 0.18]} position={[0, 0.1, 0]} color="#202226" />
    <Box size={[0.31, 0.03, 0.19]} position={[0, 0.215, 0]} color="#c9382f" />
    <Cyl rTop={0.018} rBottom={0.018} height={0.04} position={[-0.09, 0.25, 0]} color="#c9a03a" segments={8} />
    <Cyl rTop={0.018} rBottom={0.018} height={0.04} position={[0.09, 0.25, 0]} color="#8a8a8a" segments={8} />
  </group>
);

// a cable as a chain of thin boxes from a to b, sagging on the ground
export const Cable: React.FC<{a: V3; b: V3; color: string}> = ({a, b, color}) => {
  const n = 8;
  const pts = Array.from({length: n + 1}).map((_, i) => {
    const s = i / n;
    return new THREE.Vector3(lerp(a[0], b[0], s), lerp(a[1], b[1], s) - Math.sin(s * Math.PI) * 0.06, lerp(a[2], b[2], s));
  });
  const curve = new THREE.CatmullRomCurve3(pts);
  return (
    <mesh>
      <tubeGeometry args={[curve, 24, 0.008, 5, false]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
};

// the disc case in the survivor's hand
export const DiscCase: React.FC = () => (
  <group>
    <Box size={[0.135, 0.17, 0.014]} color="#1f3f9e" />
    <CanvasPlane size={[0.125, 0.16]} res={[250, 320]} k="disc" draw={(g, W, H) => drawDiscCover(g, W, H)} position={[0, 0, 0.0085]} />
  </group>
);

export {mix};
