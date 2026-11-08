import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box, Cone, Cyl, Ico} from '../scene/parts';
import {Person, PersonPose} from '../scene/Characters';
import {COND, roundRect, useCanvas} from '../gta/tex';
import {V3, rnd} from './cues';

export {Box, Cone, Cyl, Ico};

// ---------- a flat canvas-textured plane (screens, signs, paper) ----------

export const Canvas: React.FC<{
  size: [number, number];
  res: [number, number];
  k: string;
  draw: (g: CanvasRenderingContext2D, W: number, H: number) => void;
  position?: V3;
  rotation?: V3;
  glow?: number;
  lit?: boolean;
}> = ({size, res, k, draw, position, rotation, glow = 1, lit = false}) => {
  const tex = useCanvas(res[0], res[1], k, (g) => draw(g, res[0], res[1]));
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      {lit ? <meshStandardMaterial map={tex} roughness={0.95} /> : <meshBasicMaterial map={tex} toneMapped={false} color={new THREE.Color(glow, glow, glow)} />}
    </mesh>
  );
};

// ---------- the Dotter: pale, black hoodie, headphones round the neck, dark circles under the eyes ----------

export const HOODIES = ['#1d1d24', '#26262e', '#18181c', '#2c2c34', '#202028'];
const HAIRS = ['#2a1f1a', '#3b2a1e', '#1a1614', '#4a3424', '#2e2420'];
const SKINS = ['#ead7c9', '#e6d0bd', '#efdccf', '#e2c9b4'];

export type DotterLook = {hood?: boolean; phones?: 'neck' | 'head' | 'none'; i?: number; can?: boolean; lit?: string};

export const Dotter: React.FC<{position: V3; rotation?: number; pose?: PersonPose; look?: DotterLook; rightHand?: React.ReactNode; leftHand?: React.ReactNode; scale?: number}> = ({
  position,
  rotation = 0,
  pose = {},
  look = {},
  rightHand,
  leftHand,
  scale,
}) => {
  const i = look.i ?? 0;
  const hoodie = HOODIES[i % HOODIES.length];
  const phones = look.phones ?? 'neck';
  const headExtra = (
    <>
      {/* dark circles */}
      <Box size={[0.056, 0.016, 0.01]} position={[-0.07, 0.184, 0.155]} color="#9a7a8e" shadow={false} />
      <Box size={[0.056, 0.016, 0.01]} position={[0.07, 0.184, 0.155]} color="#9a7a8e" shadow={false} />
      {phones === 'head' ? (
        <>
          <Box size={[0.36, 0.035, 0.07]} position={[0, 0.405, 0]} color="#111114" />
          <Box size={[0.05, 0.13, 0.12]} position={[-0.175, 0.2, 0]} color="#111114" />
          <Box size={[0.05, 0.13, 0.12]} position={[0.175, 0.2, 0]} color="#111114" />
          <Box size={[0.018, 0.2, 0.03]} position={[-0.17, 0.32, 0]} color="#111114" />
          <Box size={[0.018, 0.2, 0.03]} position={[0.17, 0.32, 0]} color="#111114" />
          <Box size={[0.012, 0.05, 0.05]} position={[-0.203, 0.2, 0]} color="#e0303a" emissive="#e0303a" emissiveIntensity={0.6} shadow={false} />
          <Box size={[0.012, 0.05, 0.05]} position={[0.203, 0.2, 0]} color="#e0303a" emissive="#e0303a" emissiveIntensity={0.6} shadow={false} />
        </>
      ) : null}
      {look.hood ? (
        <>
          <Box size={[0.38, 0.06, 0.37]} position={[0, 0.43, -0.02]} color={hoodie} />
          <Box size={[0.04, 0.4, 0.37]} position={[-0.19, 0.22, -0.02]} color={hoodie} />
          <Box size={[0.04, 0.4, 0.37]} position={[0.19, 0.22, -0.02]} color={hoodie} />
          <Box size={[0.38, 0.4, 0.05]} position={[0, 0.22, -0.18]} color={hoodie} />
        </>
      ) : null}
    </>
  );
  const bodyExtra = (
    <>
      {/* hood down on the back, pocket, white strings */}
      {!look.hood ? <Box size={[0.4, 0.14, 0.12]} position={[0, 1.55, -0.16]} color={hoodie} /> : null}
      <Box size={[0.34, 0.14, 0.02]} position={[0, 1.02, 0.16]} color="#141418" shadow={false} />
      <Box size={[0.015, 0.14, 0.015]} position={[-0.05, 1.42, 0.16]} color="#f0f0f0" shadow={false} />
      <Box size={[0.015, 0.14, 0.015]} position={[0.05, 1.42, 0.16]} color="#f0f0f0" shadow={false} />
      {phones === 'neck' ? (
        <>
          <Box size={[0.26, 0.04, 0.05]} position={[0, 1.635, -0.1]} color="#111114" />
          <Box size={[0.07, 0.11, 0.12]} position={[-0.15, 1.58, 0.03]} color="#111114" />
          <Box size={[0.07, 0.11, 0.12]} position={[0.15, 1.58, 0.03]} color="#111114" />
          <Box size={[0.012, 0.05, 0.05]} position={[-0.188, 1.58, 0.03]} color="#e0303a" shadow={false} />
          <Box size={[0.012, 0.05, 0.05]} position={[0.188, 1.58, 0.03]} color="#e0303a" shadow={false} />
        </>
      ) : null}
    </>
  );
  return (
    <Person
      position={position}
      rotation={rotation}
      scale={scale}
      shirt={hoodie}
      pants={i % 3 === 1 ? '#3a3f4a' : '#2a2f3a'}
      hair={HAIRS[i % HAIRS.length]}
      skin={SKINS[i % SKINS.length]}
      pose={pose}
      headExtra={headExtra}
      bodyExtra={bodyExtra}
      rightHand={rightHand}
      leftHand={leftHand}
    />
  );
};

// an energy drink can in the hand
export const Can: React.FC<{position?: V3; rotation?: V3; color?: string}> = ({position = [0, -0.05, 0.03], rotation = [0, 0, 0], color = '#2fd06a'}) => (
  <group position={position} rotation={rotation}>
    <Cyl rTop={0.033} rBottom={0.033} height={0.12} color="#1a1a1e" segments={10} />
    <Cyl rTop={0.0335} rBottom={0.0335} height={0.06} position={[0, 0.005, 0]} color={color} segments={10} shadow={false} />
    <Cyl rTop={0.028} rBottom={0.033} height={0.012} position={[0, 0.066, 0]} color="#c8c8cc" segments={10} />
  </group>
);

// sitting: the hips drop to `seat` (seat height above the floor), legs forward
export const SIT: PersonPose = {legL: 1.45, legR: 1.45};
export const seatY = (floor: number, seat: number) => floor + seat - 0.8;

export const walkPose = (t: number, amount = 1, freq = 1.7): PersonPose => {
  const ph = t * freq * Math.PI * 2;
  return {legL: Math.sin(ph) * 0.45 * amount, legR: -Math.sin(ph) * 0.45 * amount, armL: [-Math.sin(ph) * 0.35 * amount, 0.06], armR: [Math.sin(ph) * 0.35 * amount, -0.06]};
};
export const runPose = (t: number, amount = 1, freq = 2.8): PersonPose => {
  const ph = t * freq * Math.PI * 2;
  return {legL: Math.sin(ph) * 0.8 * amount, legR: -Math.sin(ph) * 0.8 * amount, armL: [-Math.sin(ph) * 0.8 * amount, 0.1], armR: [Math.sin(ph) * 0.8 * amount, -0.1], elbowL: 1.2, elbowR: 1.2};
};

// ---------- an office chair (seat top at 0.48) ----------

export const Chair: React.FC<{position: V3; rotation?: number; color?: string}> = ({position, rotation = 0, color = '#2a2a30'}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[0.5, 0.08, 0.5]} position={[0, 0.44, 0]} color={color} />
    <Box size={[0.48, 0.6, 0.07]} position={[0, 0.8, -0.24]} color={color} />
    <Cyl rTop={0.03} rBottom={0.03} height={0.36} position={[0, 0.22, 0]} color="#5a5a60" segments={6} />
    {[0, 1, 2, 3, 4].map((k) => (
      <Box key={k} size={[0.04, 0.03, 0.3]} position={[Math.sin((k / 5) * Math.PI * 2) * 0.14, 0.03, Math.cos((k / 5) * Math.PI * 2) * 0.14]} rotation={[0, (k / 5) * Math.PI * 2, 0]} color="#3a3a40" />
    ))}
  </group>
);

export const Desk: React.FC<{position: V3; size?: [number, number]; rotation?: number; color?: string; legs?: string}> = ({position, size = [1.4, 0.7], rotation = 0, color = '#c9b79a', legs = '#3a3a40'}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[size[0], 0.04, size[1]]} position={[0, 0.74, 0]} color={color} />
    {[-1, 1].map((sx) =>
      [-1, 1].map((sz) => <Box key={`${sx}${sz}`} size={[0.04, 0.72, 0.04]} position={[sx * (size[0] / 2 - 0.05), 0.36, sz * (size[1] / 2 - 0.05)]} color={legs} />),
    )}
  </group>
);

// ---------- a PC monitor with a canvas picture (the screen faces +z) ----------

export const Monitor: React.FC<{position: V3; rotation?: number; k: string; draw: (g: CanvasRenderingContext2D, W: number, H: number) => void; w?: number; glow?: number}> = ({
  position,
  rotation = 0,
  k,
  draw,
  w = 0.62,
  glow = 1,
}) => {
  const h = w * 0.5625;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box size={[w + 0.04, h + 0.04, 0.035]} position={[0, h / 2 + 0.12, -0.02]} color="#141418" />
      <Canvas size={[w, h]} res={[640, 360]} k={k} draw={draw} position={[0, h / 2 + 0.12, 0.0005]} glow={glow} />
      <Box size={[0.05, 0.12, 0.04]} position={[0, 0.06, -0.04]} color="#1c1c20" />
      <Box size={[0.24, 0.015, 0.16]} position={[0, 0.0075, -0.02]} color="#1c1c20" />
    </group>
  );
};

// ---------- a smartphone lying flat or held (screen faces +z) ----------

export const PhoneSlab: React.FC<{position?: V3; rotation?: V3; k: string; draw: (g: CanvasRenderingContext2D, W: number, H: number) => void; glow?: number}> = ({position, rotation, k, draw, glow = 1}) => (
  <group position={position} rotation={rotation}>
    <Box size={[0.078, 0.162, 0.009]} position={[0, 0, -0.005]} color="#121216" />
    <Canvas size={[0.072, 0.154]} res={[360, 770]} k={k} draw={draw} position={[0, 0, 0.0002]} glow={glow} />
  </group>
);

// ---------- a laptop (screen faces +z, keyboard toward +z) ----------

export const Laptop: React.FC<{position: V3; rotation?: number; k: string; draw: (g: CanvasRenderingContext2D, W: number, H: number) => void; glow?: number}> = ({position, rotation = 0, k, draw, glow = 1}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[0.36, 0.02, 0.25]} position={[0, 0.01, 0]} color="#2a2a30" />
    <Box size={[0.3, 0.003, 0.11]} position={[0, 0.0215, 0.02]} color="#18181c" shadow={false} />
    <group position={[0, 0.02, -0.12]} rotation={[-0.25, 0, 0]}>
      <Box size={[0.36, 0.24, 0.012]} position={[0, 0.12, -0.006]} color="#2a2a30" />
      <Canvas size={[0.33, 0.205]} res={[640, 400]} k={k} draw={draw} position={[0, 0.125, 0.0005]} glow={glow} />
    </group>
  </group>
);

// ---------- a bench by the entrance ----------

export const Bench: React.FC<{position: V3; rotation?: number}> = ({position, rotation = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    {[0, 1, 2].map((k) => (
      <Box key={k} size={[1.8, 0.04, 0.11]} position={[0, 0.46, -0.14 + k * 0.13]} color="#7a5232" />
    ))}
    {[0, 1].map((k) => (
      <Box key={k} size={[1.8, 0.11, 0.04]} position={[0, 0.66 + k * 0.15, -0.24]} rotation={[-0.15, 0, 0]} color="#7a5232" />
    ))}
    {[-0.75, 0.75].map((x) => (
      <React.Fragment key={x}>
        <Box size={[0.06, 0.44, 0.4]} position={[x, 0.22, -0.04]} color="#3a3a40" />
        <Box size={[0.06, 0.5, 0.06]} position={[x, 0.7, -0.27]} rotation={[-0.15, 0, 0]} color="#3a3a40" />
      </React.Fragment>
    ))}
  </group>
);

// ---------- a cooling tower: a hyperboloid shell made with a lathe ----------

export const CoolingTower: React.FC<{position: V3; h?: number; r?: number; color?: string}> = ({position, h = 60, r = 24, color = '#b9b4aa'}) => {
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const y = (i / 16) * h;
      const k = (y - h * 0.72) / h;
      const rr = r * (0.62 + 1.25 * k * k) * (i === 16 ? 1 : 1);
      pts.push(new THREE.Vector2(rr, y));
    }
    const g = new THREE.LatheGeometry(pts, 28);
    return g;
  }, [h, r]);
  return (
    <group position={position}>
      <mesh geometry={geo}>
        <meshStandardMaterial color={color} flatShading roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      {/* two red-white bands near the top */}
      <mesh position={[0, h * 0.9, 0]}>
        <cylinderGeometry args={[r * (0.62 + 1.25 * 0.18 * 0.18) * 1.012, r * (0.62 + 1.25 * 0.13 * 0.13) * 1.012, h * 0.05, 28, 1, true]} />
        <meshStandardMaterial color="#c43a32" flatShading roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// a steam column: puffs rising out of a tower top; puffs born after `stop` never appear, the ones in the air keep rising
export const Steam: React.FC<{position: V3; r: number; t: number; stop?: number; seed?: number; color?: string}> = ({position, r, t, stop = 1e9, seed = 1, color = '#e8eef4'}) => (
  <group position={position}>
    {Array.from({length: 14}).map((_, i) => {
      const life = 6;
      const age = (t + 100 + i * (life / 14) + rnd(seed + i) * 0.3) % life;
      if (t - age > stop) return null;
      const k = age / life;
      const op = (1 - k) * 0.7 * Math.min(1, k * 8);
      if (op <= 0.02) return null;
      return (
        <Ico
          key={i}
          radius={r * (0.55 + k * 1.1)}
          position={[Math.sin(i * 2.1 + seed) * r * 0.25 + k * r * 0.8, k * r * 4.5, Math.cos(i * 1.7 + seed) * r * 0.25]}
          rotation={[i, i * 2, 0]}
          color={color}
          opacity={op}
          shadow={false}
        />
      );
    })}
  </group>
);

// ---------- a transmission tower with wires ----------

export const Pylon: React.FC<{position: V3; h?: number; rotation?: number; lamp?: boolean}> = ({position, h = 30, rotation = 0, lamp = false}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    {[-1, 1].map((sx) =>
      [-1, 1].map((sz) => (
        <Box key={`${sx}${sz}`} size={[0.4, h, 0.4]} position={[sx * 1.6, h / 2, sz * 1.6]} rotation={[sz * 0.05, 0, -sx * 0.05]} color="#5a5e66" />
      )),
    )}
    <Box size={[12, 0.5, 0.5]} position={[0, h * 0.82, 0]} color="#5a5e66" />
    <Box size={[8, 0.4, 0.4]} position={[0, h * 0.65, 0]} color="#5a5e66" />
    <Cone radius={1.6} height={h * 0.18} position={[0, h + h * 0.07, 0]} color="#5a5e66" segments={4} />
    {lamp ? <Ico radius={0.5} position={[0, h * 1.17, 0]} color="#ff3a2a" emissive="#ff3a2a" emissiveIntensity={3} shadow={false} /> : null}
  </group>
);

// ---------- canvas pictures ----------

export const drawSearch = (g: CanvasRenderingContext2D, W: number, H: number, secs: number, off: number) => {
  if (off > 0) {
    g.fillStyle = '#2a0608';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#ff4a3c';
    g.font = `600 ${H * 0.13}px ${COND}`;
    g.textAlign = 'center';
    g.fillText('СЕРВЕРЫ ОТКЛЮЧЕНЫ', W / 2, H * 0.46);
    g.fillText('НАВСЕГДА', W / 2, H * 0.64);
    g.fillStyle = '#ff9a8a';
    g.font = `500 ${H * 0.06}px ${COND}`;
    g.fillText('Спасибо, что играли', W / 2, H * 0.8);
    return;
  }
  // a generic dark game-menu screen with a big search timer
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#16202e');
  gr.addColorStop(1, '#0a0e16');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 6; i++) g.fillRect(W * 0.06 + i * W * 0.15, H * 0.08, W * 0.12, H * 0.05);
  roundRect(g, W * 0.25, H * 0.32, W * 0.5, H * 0.38, 18);
  g.fillStyle = '#0e3a26';
  g.fill();
  g.strokeStyle = '#3ad07a';
  g.lineWidth = 4;
  g.stroke();
  g.fillStyle = '#c8ffd8';
  g.textAlign = 'center';
  g.font = `600 ${H * 0.07}px ${COND}`;
  g.fillText('ПОИСК ИГРЫ', W / 2, H * 0.44);
  g.font = `600 ${H * 0.15}px ${COND}`;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  g.fillText(`${m}:${String(s).padStart(2, '0')}`, W / 2, H * 0.63);
};

export const drawSign = (text: string, bg: string, fg: string, border?: string) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  if (border) {
    g.strokeStyle = border;
    g.lineWidth = H * 0.06;
    g.strokeRect(H * 0.06, H * 0.06, W - H * 0.12, H - H * 0.12);
  }
  g.fillStyle = fg;
  g.font = `600 ${H * 0.58}px ${COND}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, W / 2, H * 0.54);
};
