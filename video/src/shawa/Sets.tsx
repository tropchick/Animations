import React from 'react';
import * as THREE from 'three';
import {Box, Cone, Cyl, Ico, Tree} from '../scene/parts';
import {Person, PersonPose} from '../scene/Characters';
import {useCanvas} from '../gta/tex';
import {Sky, SkyCols} from '../gta/World';
import {V3, clamp01, lerp, rnd} from './cues';
import {drawBubble, drawContract, drawFacade, drawKioskTag, drawMenu, drawMortgage, drawPhoneTag, drawRate, drawScreen, drawShelfTag, drawSign} from './tex';

// ---------------------------------------------------------------- basics

export const SHIRTS = ['#e85d5d', '#4a7fd0', '#f2c14e', '#6fbf73', '#b36ad1', '#ef8f4a', '#4fb6c2', '#d9d9de', '#3d3d48', '#c85b8a'];
export const PANTS = ['#2c3550', '#3a3a40', '#5a4a3a', '#24364a', '#4a4a52'];
export const HAIR = ['#2a1d15', '#4a3324', '#7b5434', '#c9a46a', '#1a1a1a', '#8a8a8a'];

export const DAY: SkyCols = {top: '#3f86d6', mid: '#93c3ec', low: '#f2e7cf', sunDir: [0.5, 0.35, -1], sun: 0.8, sunCol: '#fff2c8'};
export const EVENING: SkyCols = {top: '#1e2a5a', mid: '#6a5a9a', low: '#ffb47a', sunDir: [0.2, 0.05, -1], sun: 0.8, sunCol: '#ffc080'};

export const DayLights: React.FC<{k?: number}> = ({k = 1}) => (
  <>
    <hemisphereLight color="#dff0ff" groundColor="#8a7c6a" intensity={1.25 * k} />
    <directionalLight position={[60, 90, 80]} color="#fff0d8" intensity={2.1 * k} />
    <directionalLight position={[-80, 40, -40]} color="#9ab8e0" intensity={0.45 * k} />
  </>
);

export const DaySky: React.FC<{c?: SkyCols; fog?: [number, number]}> = ({c = DAY, fog = [60, 600]}) => (
  <>
    <Sky c={c} />
    <fog attach="fog" args={['#cfe0ee', fog[0], fog[1]]} />
  </>
);

// a canvas picture on a plane; lit = takes the scene light (paper, signs), unlit = glows (screens)
export const Pic: React.FC<{
  size: [number, number];
  res: [number, number];
  k: string;
  draw: (g: CanvasRenderingContext2D, W: number, H: number) => void;
  position?: V3;
  rotation?: V3;
  lit?: boolean;
  glow?: number;
  transparent?: boolean;
}> = ({size, res, k, draw, position, rotation, lit = true, glow = 1, transparent}) => {
  const tex = useCanvas(res[0], res[1], k, (g) => draw(g, res[0], res[1]));
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      {lit ? (
        <meshStandardMaterial map={tex} roughness={0.85} metalness={0} transparent={transparent} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.25} />
      ) : (
        <meshBasicMaterial map={tex} toneMapped={false} transparent={transparent} color={new THREE.Color(glow, glow, glow)} />
      )}
    </mesh>
  );
};

// ---------------------------------------------------------------- people

export const Sunglasses: React.FC<{on: number}> = ({on}) => {
  // on 0: pushed up on the forehead, 1: on the eyes
  const y = lerp(0.335, 0.215, on);
  const z = lerp(0.135, 0.168, on);
  return (
    <group position={[0, y, z]} rotation={[lerp(-0.5, 0, on), 0, 0]}>
      <Box size={[0.115, 0.06, 0.012]} position={[-0.07, 0, 0]} color="#101014" shadow={false} />
      <Box size={[0.115, 0.06, 0.012]} position={[0.07, 0, 0]} color="#101014" shadow={false} />
      <Box size={[0.04, 0.014, 0.012]} position={[0, 0.018, 0]} color="#101014" shadow={false} />
      <Box size={[0.012, 0.014, 0.17]} position={[-0.157, 0.01, -0.08]} color="#101014" shadow={false} />
      <Box size={[0.012, 0.014, 0.17]} position={[0.157, 0.01, -0.08]} color="#101014" shadow={false} />
    </group>
  );
};

// the shawarma maker: white shirt, red apron, cap, moustache
export const Seller: React.FC<{position: V3; rotation?: number; pose?: PersonPose; glasses?: number; rightHand?: React.ReactNode; leftHand?: React.ReactNode; shirt?: string; apron?: string}> = ({
  position,
  rotation = 0,
  pose,
  glasses,
  rightHand,
  leftHand,
  shirt = '#f4f4f2',
  apron = '#c8322c',
}) => (
  <Person
    position={position}
    rotation={rotation}
    shirt={shirt}
    pants="#2e2e36"
    hair="#2a1d15"
    skin="#e2b48e"
    pose={pose}
    rightHand={rightHand}
    leftHand={leftHand}
    headExtra={
      <>
        <Box size={[0.33, 0.07, 0.33]} position={[0, 0.375, 0]} color={apron} />
        <Box size={[0.3, 0.025, 0.12]} position={[0, 0.35, 0.2]} color={apron} />
        <Box size={[0.13, 0.03, 0.02]} position={[0, 0.112, 0.162]} color="#2a1d15" shadow={false} />
        {glasses !== undefined ? <Sunglasses on={glasses} /> : null}
      </>
    }
    bodyExtra={
      <>
        <Box size={[0.46, 0.62, 0.02]} position={[0, 1.12, 0.16]} color={apron} shadow={false} />
        <Box size={[0.4, 0.16, 0.02]} position={[0, 0.74, 0.16]} color={apron} shadow={false} />
      </>
    }
  />
);

export const Guy: React.FC<{position: V3; rotation?: number; i: number; pose?: PersonPose; rightHand?: React.ReactNode; leftHand?: React.ReactNode; scale?: number}> = ({
  position,
  rotation = 0,
  i,
  pose,
  rightHand,
  leftHand,
  scale,
}) => (
  <Person
    position={position}
    rotation={rotation}
    scale={scale}
    shirt={SHIRTS[i % SHIRTS.length]}
    pants={PANTS[(i * 3) % PANTS.length]}
    hair={HAIR[(i * 5) % HAIR.length]}
    longHair={i % 3 === 1}
    pose={pose}
    rightHand={rightHand}
    leftHand={leftHand}
  />
);

export const walk = (t: number, amount = 1, freq = 1.7): PersonPose => {
  const ph = t * freq * Math.PI * 2;
  return {legL: Math.sin(ph) * 0.45 * amount, legR: -Math.sin(ph) * 0.45 * amount, armL: [-Math.sin(ph) * 0.35 * amount, 0.06], armR: [Math.sin(ph) * 0.35 * amount, -0.06]};
};
export const SIT: PersonPose = {legL: 1.45, legR: 1.45};

// ---------------------------------------------------------------- food

// a shawarma roll; len 0..1 is what is left of it, empty: only the flat lavash
export const Shawarma: React.FC<{len?: number; empty?: boolean; position?: V3; rotation?: V3; scale?: number}> = ({len = 1, empty, position, rotation, scale = 1}) => {
  if (empty) {
    return (
      <group position={position} rotation={rotation} scale={scale}>
        <Box size={[0.17, 0.2, 0.012]} position={[0, 0.06, 0]} rotation={[0, 0, 0.12]} color="#f0d9a8" />
        <Box size={[0.12, 0.05, 0.018]} position={[0, -0.04, 0]} color="#c9cdd2" />
      </group>
    );
  }
  const h = 0.06 + 0.2 * len;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Cyl rTop={0.05} rBottom={0.045} height={h} position={[0, h / 2 - 0.06, 0]} color="#ecd29c" segments={8} />
      <Cyl rTop={0.052} rBottom={0.052} height={0.08} position={[0, -0.03, 0]} color="#c9cdd2" segments={8} />
      <Cyl rTop={0.043} rBottom={0.043} height={0.02} position={[0, h - 0.055, 0]} color="#8a4a2a" segments={8} />
      <Box size={[0.03, 0.025, 0.03]} position={[0.015, h - 0.04, 0.01]} color="#6fbf4a" />
      <Box size={[0.025, 0.02, 0.025]} position={[-0.02, h - 0.042, -0.012]} color="#e84a3a" />
    </group>
  );
};

// the vertical spit with the meat, turning; heat: the red heater behind it
export const Spit: React.FC<{position: V3; t: number; scale?: number; heat?: number}> = ({position, t, scale = 1, heat = 1}) => (
  <group position={position} scale={scale}>
    <Box size={[0.4, 0.06, 0.4]} position={[0, 0.03, 0]} color="#9aa0a8" />
    <Cyl rTop={0.012} rBottom={0.012} height={0.9} position={[0, 0.5, 0]} color="#c8ccd2" segments={6} />
    <group rotation={[0, t * 1.4, 0]}>
      <Cyl rTop={0.15} rBottom={0.09} height={0.52} position={[0, 0.42, 0]} color="#9a5a32" segments={9} />
      <Cyl rTop={0.155} rBottom={0.155} height={0.03} position={[0, 0.69, 0]} color="#7a4626" segments={9} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Box key={i} size={[0.03, 0.2, 0.02]} position={[Math.cos(i * 1.26) * 0.125, 0.45, Math.sin(i * 1.26) * 0.125]} rotation={[0, -i * 1.26, 0.1]} color="#c88a4a" shadow={false} />
      ))}
    </group>
    {/* heater */}
    <Box size={[0.42, 0.66, 0.06]} position={[0, 0.42, -0.26]} color="#3a3a40" />
    <Box size={[0.32, 0.54, 0.02]} position={[0, 0.42, -0.222]} color="#ff5a1a" emissive="#ff4a10" emissiveIntensity={1.4 * heat} shadow={false} />
  </group>
);

// ---------------------------------------------------------------- the kiosk

export const SIGN_RED = '#d62a22';

export const KioskTag: React.FC<{write?: number; one?: number; position?: V3; rotation?: V3; size?: number; k?: string}> = ({write = 1, one = 0, position, rotation, size = 1}) => {
  const w = Math.round(write * 30) / 30;
  const o = Math.round(one * 30) / 30;
  return (
    <Pic size={[0.9 * size, 0.6 * size]} res={[480, 320]} k={`kt${w}-${o}`} draw={(g, W, H) => drawKioskTag(g, W, H, w, o)} position={position} rotation={rotation} />
  );
};

// the sidewalk A-board with the price card on its front
export const ABoard: React.FC<{position: V3; rotation?: number; write?: number; one?: number}> = ({position, rotation = 0, write = 1, one = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    {/* front leaf leaning back, back leaf leaning forward */}
    <group position={[0, 0, 0.18]} rotation={[-0.105, 0, 0]}>
      <Box size={[1.0, 1.5, 0.04]} position={[0, 0.75, 0]} color="#2e3a4a" />
      <Box size={[1.06, 0.06, 0.06]} position={[0, 1.5, 0]} color="#1e2630" />
      <KioskTag position={[0, 1.02, 0.026]} write={write} one={one} />
    </group>
    <group position={[0, 0, -0.18]} rotation={[0.105, 0, 0]}>
      <Box size={[1.0, 1.5, 0.04]} position={[0, 0.75, 0]} color="#2e3a4a" />
    </group>
  </group>
);

export const Kiosk: React.FC<{position?: V3; rotation?: number; t: number; seller?: React.ReactNode; color?: string; sign?: string}> = ({
  position = [0, 0, 0],
  rotation = 0,
  t,
  seller,
  color = '#f2efe6',
  sign = 'ШАУРМА',
}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[3.2, 0.2, 1.96]} position={[0, 0.1, 0]} color="#6a6a70" />
    <Box size={[3.2, 2.6, 0.08]} position={[0, 1.5, -0.96]} color={color} />
    <Box size={[3.08, 2.5, 0.02]} position={[0, 1.45, -0.91]} color="#c9b89a" />
    <Box size={[0.08, 2.6, 1.96]} position={[-1.6, 1.5, 0]} color={color} />
    <Box size={[0.08, 2.6, 1.96]} position={[1.6, 1.5, 0]} color={color} />
    <Box size={[3.4, 0.12, 2.2]} position={[0, 2.86, 0.02]} color="#7a7a82" />
    {/* front: lower panel, counter, top panel, posts */}
    <Box size={[3.3, 0.95, 0.08]} position={[0, 0.675, 1.0]} color={color} />
    <Box size={[3.3, 0.18, 0.02]} position={[0, 0.32, 1.05]} color={SIGN_RED} shadow={false} />
    <Box size={[3.36, 0.06, 0.42]} position={[0, 1.18, 1.14]} color="#b8bcc4" />
    <Box size={[3.3, 0.66, 0.08]} position={[0, 2.47, 1.0]} color={color} />
    <Box size={[0.08, 0.95, 0.1]} position={[-1.55, 1.65, 1.0]} color="#9aa0a8" />
    <Box size={[0.08, 0.95, 0.1]} position={[1.55, 1.65, 1.0]} color="#9aa0a8" />
    {/* the sign on the roof */}
    <Box size={[3.0, 0.62, 0.1]} position={[0, 3.25, 0.9]} color={SIGN_RED} />
    <Pic size={[2.9, 0.54]} res={[1000, 186]} k={`sign-${sign}`} draw={(g, W, H) => drawSign(g, W, H, sign, SIGN_RED, '#ffe14a', '#ffe14a')} position={[0, 3.25, 0.956]} />
    {/* striped awning */}
    {Array.from({length: 6}).map((_, i) => (
      <Box key={i} size={[0.535, 0.03, 0.7]} position={[-1.375 + i * 0.55, 2.22, 1.36]} rotation={[0.38, 0, 0]} color={i % 2 ? '#ffffff' : SIGN_RED} />
    ))}
    {/* inside: floor, spit, a fridge, napkins on the counter */}
    <Box size={[3.1, 0.02, 1.86]} position={[0, 0.21, 0]} color="#5a5048" />
    <Spit position={[-0.75, 1.12, -0.5]} t={t} />
    <Box size={[1.4, 0.92, 0.6]} position={[-0.7, 0.66, -0.55]} color="#d0d4da" />
    <Box size={[0.7, 1.8, 0.6]} position={[1.1, 1.1, -0.55]} color="#e8eaee" />
    <Box size={[0.6, 1.4, 0.02]} position={[1.1, 1.2, -0.24]} color="#9ab8d0" shadow={false} />
    <Box size={[0.16, 0.1, 0.12]} position={[0.9, 1.26, 1.1]} color="#ffffff" />
    <pointLight position={[0, 2.3, 0.2]} color="#fff2d8" intensity={3} distance={4} decay={2} />
    {seller}
  </group>
);

// ---------------------------------------------------------------- the street

export const Facade: React.FC<{position: V3; size: V3; cols: number; rows: number; wall?: string; seed?: number; rotation?: number}> = ({
  position,
  size,
  cols,
  rows,
  wall = '#d9d2c4',
  seed = 0,
  rotation = 0,
}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={size} position={[0, size[1] / 2, 0]} color={wall} />
    <Pic size={[size[0] - 0.02, size[1] - 0.6]} res={[cols * 40, rows * 40]} k={`f${cols}x${rows}-${seed}-${wall}`} draw={(g, W, H) => drawFacade(g, W, H, cols, rows, wall, seed)} position={[0, size[1] / 2 + 0.3, size[2] / 2 + 0.012]} />
  </group>
);

export const Street: React.FC<{len?: number; trees?: boolean; x0?: number}> = ({len = 80, trees = true, x0 = 0}) => (
  <>
    {/* sidewalk, curb, road */}
    <Box size={[len, 0.1, 9]} position={[x0, -0.05, -1.5]} color="#b9b3a8" />
    <Box size={[len, 0.14, 0.3]} position={[x0, -0.03, 3.1]} color="#d6d2ca" />
    <Box size={[len, 0.1, 14]} position={[x0, -0.12, 10.2]} color="#55565c" />
    {Array.from({length: Math.round(len / 6)}).map((_, i) => (
      <Box key={i} size={[2.4, 0.01, 0.16]} position={[x0 - len / 2 + 3 + i * 6, -0.064, 10.2]} color="#e8e6e0" shadow={false} />
    ))}
    <Box size={[len, 0.1, 10]} position={[x0, -0.05, 22]} color="#b9b3a8" />
    {/* houses behind */}
    {Array.from({length: Math.ceil(len / 26)}).map((_, i) => (
      <Facade key={i} position={[x0 - len / 2 + 13 + i * 26, 0, -10]} size={[24, 15 + (i % 2) * 6, 8]} cols={12} rows={5 + (i % 2) * 2} wall={['#d9d2c4', '#cfd6dc', '#e2d0bc'][i % 3]} seed={i} />
    ))}
    {Array.from({length: Math.ceil(len / 26)}).map((_, i) => (
      <Facade key={`b${i}`} position={[x0 - len / 2 + 5 + i * 26, 0, 30]} size={[24, 18, 8]} cols={12} rows={6} wall={['#cfd6dc', '#e2d0bc', '#d9d2c4'][i % 3]} seed={i + 9} rotation={Math.PI} />
    ))}
    {trees
      ? Array.from({length: Math.round(len / 9)}).map((_, i) => <Tree key={i} position={[x0 - len / 2 + 4 + i * 9, 0, -4.6 + (i % 2) * 0.4]} size={0.8 + rnd(i) * 0.25} seed={i} />)
      : null}
  </>
);

// ---------------------------------------------------------------- bench in the park

export const Bench: React.FC<{position?: V3}> = ({position = [0, 0, 0]}) => (
  <group position={position}>
    <Box size={[3.2, 0.07, 0.5]} position={[0, 0.45, 0]} color="#a5683a" />
    <Box size={[3.2, 0.4, 0.06]} position={[0, 0.78, -0.24]} rotation={[-0.15, 0, 0]} color="#a5683a" />
    {[-1.4, 1.4].map((x) => (
      <group key={x}>
        <Box size={[0.08, 0.42, 0.42]} position={[x, 0.21, 0]} color="#2c2c32" />
        <Box size={[0.08, 0.5, 0.06]} position={[x, 0.74, -0.26]} rotation={[-0.15, 0, 0]} color="#2c2c32" />
      </group>
    ))}
  </group>
);

// ---------------------------------------------------------------- the burger shop and its queue

export const BurgerShop: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <Box size={[10, 4.2, 6]} position={[0, 2.1, -3]} color="#3a3640" />
    <Box size={[3.2, 2.4, 0.04]} position={[-2.6, 1.4, 0.02]} color="#f7d58a" emissive="#f2b850" emissiveIntensity={0.3} />
    <Box size={[3.2, 2.4, 0.04]} position={[2.6, 1.4, 0.02]} color="#f7d58a" emissive="#f2b850" emissiveIntensity={0.3} />
    <Box size={[1.3, 2.3, 0.05]} position={[0, 1.15, 0.03]} color="#2a2a30" />
    <Box size={[4.4, 0.9, 0.14]} position={[0, 3.45, 0.08]} color="#ffb02e" />
    <Pic size={[4.2, 0.8]} res={[1050, 200]} k="burg" draw={(g, W, H) => drawSign(g, W, H, 'БУРГЕРЫ', '#ffb02e', '#2a1a10')} position={[0, 3.45, 0.156]} />
  </group>
);

export const FoldingChair: React.FC<{position: V3; rotation?: number}> = ({position, rotation = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[0.5, 0.05, 0.46]} position={[0, 0.42, 0]} color="#2f6a3a" />
    <Box size={[0.5, 0.5, 0.04]} position={[0, 0.7, -0.24]} rotation={[-0.2, 0, 0]} color="#2f6a3a" />
    <Box size={[0.03, 0.62, 0.03]} position={[-0.23, 0.22, 0.1]} rotation={[0.5, 0, 0]} color="#9aa0a8" />
    <Box size={[0.03, 0.62, 0.03]} position={[0.23, 0.22, 0.1]} rotation={[0.5, 0, 0]} color="#9aa0a8" />
    <Box size={[0.03, 0.62, 0.03]} position={[-0.23, 0.22, -0.1]} rotation={[-0.5, 0, 0]} color="#9aa0a8" />
    <Box size={[0.03, 0.62, 0.03]} position={[0.23, 0.22, -0.1]} rotation={[-0.5, 0, 0]} color="#9aa0a8" />
  </group>
);

// ---------------------------------------------------------------- inside the burger shop

export const MenuBoard: React.FC<{position: V3; ks: number[]}> = ({position, ks}) => {
  const q = ks.map((k) => Math.round(k * 12) / 12);
  return (
    <group position={position}>
      <Box size={[2.3, 1.62, 0.08]} position={[0, 0, -0.05]} color="#0e0c10" />
      <Pic size={[2.2, 1.52]} res={[1040, 720]} k={`menu${q.join(',')}`} draw={(g, W, H) => drawMenu(g, W, H, q)} position={[0, 0, -0.005]} lit={false} glow={0.95} />
    </group>
  );
};

// ---------------------------------------------------------------- the house where everyone turns a spit

export const SpitHouse: React.FC<{t: number; cols?: number; rows?: number}> = ({t, cols = 7, rows = 9}) => {
  const W = 2.2;
  const H = 2.7;
  return (
    <group>
      <Box size={[cols * W + 1, rows * H + 0.8, 1]} position={[0, (rows * H + 0.8) / 2, -0.5]} color="#cfc7b8" />
      {Array.from({length: rows}).map((_, r) =>
        Array.from({length: cols}).map((__, c) => {
          const x = (c - (cols - 1) / 2) * W;
          const y = 0.8 + r * H + 0.6;
          const i = r * cols + c;
          return (
            <group key={i} position={[x, y, 0]}>
              {/* window frame, warm room, spit */}
              <Box size={[1.36, 1.46, 0.06]} position={[0, 0.72, 0.012]} color="#f2f0ea" />
              <Box size={[1.2, 1.3, 0.06]} position={[0, 0.72, 0.03]} color="#ffcf8a" emissive="#ff9a3a" emissiveIntensity={0.55 + 0.25 * rnd(i)} />
              <Spit position={[(rnd(i + 3) - 0.5) * 0.4, 0.08, 0.32]} t={t + i * 0.7} scale={0.85} heat={0.9} />
              <Box size={[1.5, 0.06, 0.2]} position={[0, -0.02, 0.1]} color="#e2ded6" />
            </group>
          );
        }),
      )}
    </group>
  );
};

// ---------------------------------------------------------------- the shop

const LABEL = (text: string) => (g: CanvasRenderingContext2D, W: number, H: number) => drawSign(g, W, H, text, '#ffffff', '#1a1a1a');

export const Shelf: React.FC<{position: V3; rotation?: number; labels: string[]; stock?: (row: number, k: number) => React.ReactNode}> = ({position, rotation = 0, labels, stock}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[3.0, 2.0, 0.08]} position={[0, 1.0, -0.3]} color="#e8e8ea" />
    <Box size={[0.06, 2.0, 0.66]} position={[-1.5, 1.0, 0]} color="#d0d2d6" />
    <Box size={[0.06, 2.0, 0.66]} position={[1.5, 1.0, 0]} color="#d0d2d6" />
    {[0.15, 0.6, 1.05, 1.5].map((y, r) => (
      <group key={r}>
        <Box size={[2.94, 0.04, 0.6]} position={[0, y, 0]} color="#f2f2f4" />
        <Box size={[2.94, 0.1, 0.02]} position={[0, y - 0.03, 0.31]} color="#d8dade" shadow={false} />
        {labels[r] ? <Pic size={[0.5, 0.09]} res={[280, 50]} k={`lb${labels[r]}`} draw={LABEL(labels[r])} position={[0, y - 0.03, 0.326]} /> : null}
        {stock ? stock(r, y) : null}
      </group>
    ))}
  </group>
);

export const Cart: React.FC<{position: V3; rotation?: number}> = ({position, rotation = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[0.55, 0.45, 0.85]} position={[0, 0.72, 0]} color="#c8ccd4" opacity={0.6} />
    <Box size={[0.58, 0.03, 0.88]} position={[0, 0.5, 0]} color="#8a9098" />
    <Box size={[0.6, 0.04, 0.04]} position={[0, 1.02, -0.5]} color="#d62a22" />
    {[-0.24, 0.24].map((x) =>
      [-0.36, 0.36].map((z) => <Cyl key={`${x}${z}`} rTop={0.05} rBottom={0.05} height={0.04} position={[x, 0.06, z]} rotation={[0, 0, Math.PI / 2]} color="#222" />),
    )}
    {[-0.24, 0.24].map((x) => (
      <Box key={x} size={[0.03, 0.44, 0.03]} position={[x, 0.28, 0]} color="#8a9098" />
    ))}
  </group>
);

// ---------------------------------------------------------------- shelf tags

export const ShelfTag: React.FC<{position: V3; name: string; a: string; b: string; k: number; size?: number}> = ({position, name, a, b, k, size = 1}) => (
  <Pic size={[0.56 * size, 0.36 * size]} res={[420, 270]} k={`st${name}${k > 0 ? 1 : 0}`} draw={(g, W, H) => drawShelfTag(g, W, H, name, a, b, k)} position={position} />
);

// ---------------------------------------------------------------- the yard with the secret door

export const Bubble: React.FC<{text: string; position: V3; rotation?: V3; k: number; tailRight?: boolean; w?: number}> = ({text, position, rotation, k, tailRight = false, w = 1.1}) => {
  if (k <= 0) return null;
  const s = 0.6 + 0.4 * Math.min(1, k) + 0.08 * Math.sin(Math.min(1, k) * Math.PI);
  return (
    <group position={position} rotation={rotation} scale={s}>
      <Pic size={[w, w * 0.42]} res={[520, 200]} k={`bb${text}`} draw={(g, W, H) => drawBubble(g, W, H, text, tailRight)} lit={false} transparent />
    </group>
  );
};

export const SecretDoor: React.FC<{hatch: number; door: number; t: number}> = ({hatch, door, t}) => (
  <group>
    {/* wall of the house */}
    <Box size={[14, 7, 0.5]} position={[0, 3.5, -0.25]} color="#6a6460" />
    <Box size={[1.4, 2.3, 0.04]} position={[0, 1.15, 0.0]} color="#1a1410" />
    {/* the spit glowing inside, seen when the door opens */}
    <Box size={[1.36, 2.26, 0.5]} position={[0, 1.15, -0.3]} color="#ff9a4a" emissive="#ff7a2a" emissiveIntensity={0.7 * door} />
    {door > 0 ? <Spit position={[0.15, 0.05, -0.32]} t={t} scale={1.3} /> : null}
    {door > 0 ? <pointLight position={[0, 1.4, 0.6]} color="#ff9a4a" intensity={6 * door} distance={5} decay={2} /> : null}
    {/* the door on its hinge at the left edge */}
    <group position={[-0.68, 0, 0.06]} rotation={[0, -door * 1.45, 0]}>
      <Box size={[1.34, 2.24, 0.08]} position={[0.67, 1.14, 0]} color="#4a5a52" />
      <Box size={[0.08, 0.16, 0.06]} position={[1.2, 1.1, 0.07]} color="#c8ccd2" />
      {/* the hatch: a slot with eyes behind, the plate slides right */}
      <Box size={[0.42, 0.16, 0.02]} position={[0.67, 1.62, 0.05]} color="#0c0a08" />
      {hatch > 0 && door < 0.1 ? (
        <>
          <Box size={[0.05, 0.03, 0.01]} position={[0.6, 1.63, 0.057]} color="#f2f2f2" emissive="#ffffff" emissiveIntensity={0.4} shadow={false} />
          <Box size={[0.05, 0.03, 0.01]} position={[0.74, 1.63, 0.057]} color="#f2f2f2" emissive="#ffffff" emissiveIntensity={0.4} shadow={false} />
        </>
      ) : null}
      <Box size={[0.46, 0.2, 0.025]} position={[0.67 + hatch * 0.44, 1.62, 0.072]} color="#5a6a62" />
    </group>
    {/* lamp over the door */}
    <Box size={[0.3, 0.12, 0.2]} position={[0, 2.62, 0.1]} color="#2a2a2e" />
    <Box size={[0.22, 0.04, 0.14]} position={[0, 2.55, 0.12]} color="#fff2c8" emissive="#ffe8a0" emissiveIntensity={1.5} shadow={false} />
    <pointLight position={[0, 2.45, 0.6]} color="#ffe2a0" intensity={4} distance={6} decay={2} />
    {/* yard: asphalt, a bin, a pipe */}
    <Box size={[16, 0.1, 10]} position={[0, -0.05, 4.5]} color="#3a3a40" />
    <Box size={[0.9, 1.1, 0.7]} position={[3.2, 0.55, 0.6]} color="#2f5a3a" />
    <Cyl rTop={0.07} rBottom={0.07} height={6.8} position={[-2.4, 3.4, 0.12]} color="#5a5a60" />
  </group>
);

// ---------------------------------------------------------------- the wallet

export const Wallet: React.FC<{open: number}> = ({open}) => (
  <group>
    <Box size={[0.24, 0.02, 0.12]} position={[0, 0.01, 0]} color="#6a3e22" />
    {/* rolled shawarmas where the notes should be */}
    {open > 0.3
      ? [0, 1, 2].map((i) => <Shawarma key={i} position={[0.03 - i * 0.012, 0.042, -0.038 + i * 0.038]} rotation={[0, 0, Math.PI / 2 + 0.05 * (i - 1)]} scale={0.42} />)
      : null}
    <group position={[0, 0.02, -0.06]} rotation={[-open * Math.PI * 0.97, 0, 0]}>
      <Box size={[0.24, 0.016, 0.12]} position={[0, 0.0, 0.06]} color="#7a4a2a" />
      <Box size={[0.08, 0.006, 0.05]} position={[0.06, 0.011, 0.07]} color="#c8a050" shadow={false} />
    </group>
  </group>
);

// ---------------------------------------------------------------- the market table with the phone

export const PhoneStand: React.FC<{n: number}> = ({n}) => {
  // the pile: 4 + 3 + 2 + 1 shawarmas lying side by side, n of them already there
  const slots: V3[] = [];
  [4, 3, 2, 1].forEach((cnt, row) => {
    for (let i = 0; i < cnt; i++) slots.push([(i - (cnt - 1) / 2) * 0.105, 0.05 + row * 0.088, 0]);
  });
  return (
    <group>
      <Box size={[1.6, 0.06, 0.8]} position={[0, 0.9, 0]} color="#8a6a4a" />
      {[-0.7, 0.7].map((x) => [-0.32, 0.32].map((z) => <Box key={`${x}${z}`} size={[0.06, 0.87, 0.06]} position={[x, 0.435, z]} color="#5a4430" />))}
      <Box size={[1.62, 0.02, 0.82]} position={[0, 0.94, 0]} color="#d8e2ea" shadow={false} />
      {/* the phone on a small stand */}
      <group position={[-0.32, 0.95, -0.05]} rotation={[-0.25, 0.25, 0]}>
        <Box size={[0.08, 0.04, 0.08]} position={[0, 0.02, 0.04]} color="#2a2a30" />
        <Box size={[0.17, 0.33, 0.016]} position={[0, 0.19, 0]} color="#1a1a1e" />
        <Pic size={[0.15, 0.3]} res={[150, 300]} k="scr" draw={drawScreen} position={[0, 0.19, 0.013]} lit={false} glow={1.1} />
      </group>
      <Pic size={[0.42, 0.24]} res={[420, 240]} k="ptag" draw={drawPhoneTag} position={[-0.3, 1.02, 0.3]} rotation={[-0.5, 0.15, 0]} />
      <group position={[0.32, 0.95, 0.02]}>
        {slots.map((p, i) =>
          i < n ? <Shawarma key={i} position={p} rotation={[Math.PI / 2, 0, 0]} scale={0.95} /> : null,
        )}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- the sea and the yacht

export const Sea: React.FC<{t: number}> = ({t}) => (
  <>
    <Box size={[600, 0.1, 600]} position={[0, -0.05, 0]} color="#2f8ac0" />
    {Array.from({length: 70}).map((_, i) => {
      const x = (rnd(i + 1) - 0.5) * 120;
      const z = (rnd(i + 2) - 0.5) * 120;
      const s = 0.6 + 0.4 * Math.sin(t * 1.3 + i);
      return <Box key={i} size={[1.4 * s, 0.02, 0.12]} position={[x, 0.01 + 0.002 * (i % 5), z]} color="#9fd4f0" shadow={false} />;
    })}
  </>
);

export const Pier: React.FC = () => (
  <group>
    <Box size={[3, 0.25, 40]} position={[-6, 0.6, -6]} color="#a07850" />
    {Array.from({length: 10}).map((_, i) => (
      <Cyl key={i} rTop={0.12} rBottom={0.12} height={1.6} position={[-7.3 + (i % 2) * 2.6, 0, -24 + Math.floor(i / 2) * 9]} color="#6a4a30" />
    ))}
  </group>
);

export const Yacht: React.FC<{position?: V3; rotation?: number; bob: number; children?: React.ReactNode}> = ({position = [0, 0, 0], rotation = 0, bob, children}) => (
  <group position={[position[0], position[1] + Math.sin(bob * 1.2) * 0.05, position[2]]} rotation={[Math.sin(bob * 0.9) * 0.012, rotation, Math.sin(bob * 1.1) * 0.015]}>
    {/* hull: a long box with a pointed bow (towards +z) */}
    <Box size={[3.2, 1.3, 9]} position={[0, 0.45, 0]} color="#fafafa" />
    <mesh position={[0, 0.45, 4.5]} rotation={[0, 0, 0]}>
      <cylinderGeometry args={[1.6, 1.6, 1.3, 3, 1, false, -Math.PI / 2, Math.PI]} />
      <meshStandardMaterial color="#fafafa" flatShading roughness={0.6} />
    </mesh>
    <Box size={[3.24, 0.12, 9.04]} position={[0, -0.12, 0]} color="#1e3a6a" />
    {/* the name on both sides */}
    <Pic size={[4.4, 0.6]} res={[1100, 150]} k="yname" draw={(g, W, H) => drawSign(g, W, H, 'ДВОЙНОЙ СЫР', '#fafafa', '#1e3a6a')} position={[1.612, 0.55, -0.6]} rotation={[0, Math.PI / 2, 0]} />
    <Pic size={[4.4, 0.6]} res={[1100, 150]} k="yname" draw={(g, W, H) => drawSign(g, W, H, 'ДВОЙНОЙ СЫР', '#fafafa', '#1e3a6a')} position={[-1.612, 0.55, -0.6]} rotation={[0, -Math.PI / 2, 0]} />
    {/* deck, cabin, windows, rail */}
    <Box size={[3.0, 0.06, 8.8]} position={[0, 1.13, 0]} color="#c8a070" />
    <Box size={[2.4, 1.0, 3.6]} position={[0, 1.66, -1.2]} color="#f4f4f4" />
    <Box size={[2.44, 0.36, 3.0]} position={[0, 1.8, -1.0]} color="#1a2a3a" />
    <Box size={[2.6, 0.08, 4.0]} position={[0, 2.2, -1.2]} color="#e8e8ea" />
    {[-1.45, 1.45].map((x) => (
      <Box key={x} size={[0.04, 0.04, 8]} position={[x, 1.65, 0.2]} color="#d0d4da" />
    ))}
    {[-1.45, 1.45].map((x) => [-3.6, -1.6, 0.4, 2.4, 4.0].map((z) => <Box key={`${x}${z}`} size={[0.04, 0.5, 0.04]} position={[x, 1.4, z]} color="#d0d4da" />))}
    {children}
  </group>
);

export const DeckChair: React.FC<{position: V3; rotation?: number}> = ({position, rotation = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[0.6, 0.06, 0.6]} position={[0, 0.4, 0]} color="#f2f2f2" />
    <Box size={[0.6, 0.7, 0.06]} position={[0, 0.72, -0.34]} rotation={[-0.35, 0, 0]} color="#f2f2f2" />
    <Box size={[0.56, 0.05, 0.56]} position={[0, 0.45, 0.0]} color="#3a7ad0" />
    {[-0.27, 0.27].map((x) => [-0.25, 0.25].map((z) => <Box key={`${x}${z}`} size={[0.04, 0.4, 0.04]} position={[x, 0.2, z]} color="#9aa0a8" />))}
  </group>
);

// the little side table on the deck with the framed price card
export const FramedTag: React.FC<{position: V3; rotation?: V3}> = ({position, rotation}) => (
  <group position={position} rotation={rotation}>
    <Box size={[0.5, 0.36, 0.03]} position={[0, 0, -0.016]} color="#c89a3a" />
    <KioskTag position={[0, 0, 0.002]} size={0.5} write={1} one={1} />
    <Box size={[0.05, 0.25, 0.05]} position={[0, -0.15, -0.08]} rotation={[0.4, 0, 0]} color="#c89a3a" />
  </group>
);

export const Gulls: React.FC<{t: number; n?: number; center?: V3; r?: number}> = ({t, n = 5, center = [0, 9, -10], r = 8}) => (
  <>
    {Array.from({length: n}).map((_, i) => {
      const a = t * (0.3 + 0.05 * i) + i * 1.3;
      const flap = Math.sin(t * 6 + i) * 0.5;
      const p: V3 = [center[0] + Math.cos(a) * r * (0.6 + 0.1 * i), center[1] + Math.sin(a * 2) * 0.6 + i * 0.4, center[2] + Math.sin(a) * r * 0.5];
      return (
        <group key={i} position={p} rotation={[0, -a, 0]}>
          <Box size={[0.12, 0.1, 0.4]} color="#ffffff" />
          <Box size={[0.5, 0.02, 0.16]} position={[-0.28, 0.02, 0]} rotation={[0, 0, flap]} color="#f2f2f2" />
          <Box size={[0.5, 0.02, 0.16]} position={[0.28, 0.02, 0]} rotation={[0, 0, -flap]} color="#f2f2f2" />
        </group>
      );
    })}
  </>
);

export {Box, Cone, Cyl, Ico, clamp01};

// ---------------------------------------------------------------- the ending: board, bank, proposal, flat, van

export const RateBooth: React.FC<{value: number; up: boolean}> = ({value, up}) => {
  // round so neighbouring frames share a texture, but small prices stay exact
  const q = value < 10000 ? Math.round(value / 10) * 10 : Number(value.toPrecision(3));
  return (
    <group>
      {/* the exchange booth: a small glass kiosk with the board on its roof */}
      <Box size={[2.6, 2.4, 1.6]} position={[0, 1.2, 0]} color="#e6e8ec" />
      <Box size={[1.6, 1.2, 0.04]} position={[0, 1.3, 0.81]} color="#9ab8d0" emissive="#5a7a90" emissiveIntensity={0.2} />
      <Box size={[0.5, 0.06, 0.3]} position={[0, 0.82, 0.95]} color="#b8bcc4" />
      <Box size={[3.0, 1.6, 0.16]} position={[0, 3.25, 0.5]} color="#1a1c22" />
      <Pic size={[2.86, 1.46]} res={[1100, 560]} k={`rate${q}${up ? 1 : 0}`} draw={(g, W, H) => drawRate(g, W, H, q, up)} position={[0, 3.25, 0.586]} lit={false} glow={1} />
      {[-1.3, 1.3].map((x) => <Box key={x} size={[0.1, 0.9, 0.1]} position={[x, 2.85, 0.5]} color="#5a5e66" />)}
    </group>
  );
};

export const Office: React.FC<{sign: number; stamp: boolean}> = ({sign, stamp}) => {
  const s = Math.round(sign * 20) / 20;
  return (
    <group>
      <Box size={[12, 0.1, 12]} position={[0, -0.05, 0]} color="#c8c2b8" />
      <Box size={[12, 3.4, 0.2]} position={[0, 1.7, -2.6]} color="#dfe6ee" />
      <Box size={[4.2, 0.5, 0.04]} position={[0, 2.5, -2.48]} color="#1f5fbf" />
      <Pic size={[4.0, 0.42]} res={[1000, 105]} k="banksign" draw={(g, W, H) => drawSign(g, W, H, 'БАНК', '#1f5fbf', '#ffffff')} position={[0, 2.5, -2.455]} />
      {/* desk */}
      <Box size={[1.9, 0.06, 0.9]} position={[0, 0.76, 0]} color="#8a6a4a" />
      <Box size={[1.85, 0.72, 0.06]} position={[0, 0.37, -0.4]} color="#7a5a3a" />
      {[-0.88, 0.88].map((x) => <Box key={x} size={[0.06, 0.73, 0.85]} position={[x, 0.365, 0]} color="#7a5a3a" />)}
      {/* the screen faces the couple */}
      <Box size={[0.08, 0.3, 0.08]} position={[0.45, 0.94, -0.25]} color="#2a2a30" />
      <Box size={[0.8, 0.5, 0.04]} position={[0.45, 1.3, -0.25]} rotation={[0, -0.25, 0]} color="#1a1a1e" />
      <group position={[0.45, 1.3, -0.25]} rotation={[0, -0.25, 0]}>
        <Pic size={[0.74, 0.44]} res={[740, 440]} k="mort" draw={drawMortgage} position={[0, 0, 0.026]} lit={false} glow={1} />
      </group>
      {/* the contract lies flat in front of the couple */}
      <Pic size={[0.3, 0.42]} res={[300, 420]} k={`ctr${s}${stamp ? 1 : 0}`} draw={(g, W, H) => drawContract(g, W, H, s, stamp)} position={[-0.2, 0.795, 0.02]} rotation={[-Math.PI / 2, 0, 0.1]} />
      {/* chairs for the couple */}
      {[-0.6, 0.2].map((x) => (
        <group key={x} position={[x, 0, 0.75]}>
          <Box size={[0.48, 0.06, 0.46]} position={[0, 0.45, 0]} color="#3a3a44" />
          <Box size={[0.48, 0.5, 0.06]} position={[0, 0.72, 0.24]} color="#3a3a44" />
          {[-0.2, 0.2].map((xx) => [-0.18, 0.18].map((z) => <Box key={`${xx}${z}`} size={[0.04, 0.42, 0.04]} position={[xx, 0.21, z]} color="#9aa0a8" />))}
        </group>
      ))}
      <Box size={[0.6, 1.6, 0.6]} position={[-2.8, 0.8, -2.0]} color="#3a6a3a" />
    </group>
  );
};

export const RingBox: React.FC<{open: number}> = ({open}) => (
  <group>
    <Box size={[0.09, 0.05, 0.09]} position={[0, 0.025, 0]} color="#b0182a" />
    <Box size={[0.075, 0.012, 0.075]} position={[0, 0.051, 0]} color="#f2e8d8" shadow={false} />
    {open > 0.2 ? <Shawarma position={[0, 0.058, 0]} rotation={[0, 0, Math.PI / 2]} scale={0.26} /> : null}
    <group position={[0, 0.05, -0.045]} rotation={[-open * 1.9, 0, 0]}>
      <Box size={[0.092, 0.035, 0.092]} position={[0, 0.0175, 0.046]} color="#c01c30" />
    </group>
  </group>
);

export const Flat: React.FC = () => (
  <group>
    <Box size={[8, 0.1, 8]} position={[0, -0.05, 0]} color="#c8a878" />
    <Box size={[8, 3, 0.2]} position={[0, 1.5, -2.6]} color="#f2f0ea" />
    <Box size={[0.2, 3, 8]} position={[-2.6, 1.5, 0]} color="#ecebe6" />
    {/* big window with the city */}
    <Box size={[2.6, 1.7, 0.04]} position={[0.6, 1.55, -2.48]} color="#bfe0f6" emissive="#9ad0f0" emissiveIntensity={0.6} />
    <Box size={[0.06, 1.7, 0.06]} position={[0.6, 1.55, -2.45]} color="#ffffff" />
    <Box size={[2.6, 0.06, 0.06]} position={[0.6, 1.55, -2.45]} color="#ffffff" />
    <Box size={[2.7, 0.08, 0.2]} position={[0.6, 0.66, -2.4]} color="#ffffff" />
    {/* boxes from the move */}
    <Box size={[0.5, 0.4, 0.5]} position={[-1.9, 0.2, -1.6]} color="#c89a5a" />
    <Box size={[0.4, 0.32, 0.4]} position={[-1.85, 0.56, -1.55]} rotation={[0, 0.3, 0]} color="#d8aa6a" />
  </group>
);

// a ring of keys (the hand prop)
export const Keys: React.FC = () => (
  <group>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.025, 0.005, 6, 12]} />
      <meshStandardMaterial color="#d8c050" flatShading />
    </mesh>
    <Box size={[0.012, 0.06, 0.004]} position={[0.01, -0.045, 0]} color="#d8c050" />
    <Box size={[0.012, 0.06, 0.004]} position={[-0.012, -0.043, 0.006]} rotation={[0, 0, 0.3]} color="#c8ccd2" />
  </group>
);

export const FrozenShawarma: React.FC<{position?: V3; rotation?: V3; scale?: number}> = ({position, rotation, scale = 1}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <Shawarma />
    <Cyl rTop={0.058} rBottom={0.058} height={0.3} position={[0, 0.07, 0]} color="#dfefff" opacity={0.45} segments={8} />
  </group>
);

export const Van: React.FC<{position?: V3; rotation?: number; doors: number}> = ({position = [0, 0, 0], rotation = 0, doors}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    {/* body: the back faces +z */}
    {/* the cargo box is hollow so the open doors show the inside */}
    <Box size={[0.06, 2.2, 4.0]} position={[-1.07, 1.55, 0]} color="#3d5a46" />
    <Box size={[0.06, 2.2, 4.0]} position={[1.07, 1.55, 0]} color="#3d5a46" />
    <Box size={[2.2, 0.06, 4.0]} position={[0, 2.62, 0]} color="#3d5a46" />
    <Box size={[2.1, 1.5, 1.4]} position={[0, 1.2, -2.7]} color="#3d5a46" />
    <Box size={[1.9, 0.6, 0.04]} position={[0, 1.65, -3.42]} color="#22303a" />
    <Box size={[2.24, 0.25, 4.04]} position={[0, 0.55, 0]} color="#2a3a30" />
    <Pic size={[3.0, 0.4]} res={[900, 120]} k="vanname" draw={(g, W, H) => drawSign(g, W, H, 'ИНКАССАЦИЯ', '#3d5a46', '#f2e8c8')} position={[1.112, 1.9, 0]} rotation={[0, Math.PI / 2, 0]} />
    <Pic size={[3.0, 0.4]} res={[900, 120]} k="vanname" draw={(g, W, H) => drawSign(g, W, H, 'ИНКАССАЦИЯ', '#3d5a46', '#f2e8c8')} position={[-1.112, 1.9, 0]} rotation={[0, -Math.PI / 2, 0]} />
    {[[-0.8, -2.6], [0.8, -2.6], [-0.8, 1.2], [0.8, 1.2]].map(([x, z]) => (
      <Cyl key={`${x}${z}`} rTop={0.42} rBottom={0.42} height={0.3} position={[x * 1.3, 0.42, z]} rotation={[0, 0, Math.PI / 2]} color="#1a1a1a" segments={10} />
    ))}
    {/* inside, seen through the open doors */}
    <Box size={[2.0, 2.0, 0.05]} position={[0, 1.55, -1.9]} color="#2a2e30" />
    <Box size={[2.0, 0.05, 3.8]} position={[0, 0.66, 0]} color="#3a3e40" />
    {/* rear doors hinged at the outer edges */}
    <group position={[-1.1, 0, 2.03]} rotation={[0, -doors * 1.7, 0]}>
      <Box size={[1.08, 2.1, 0.06]} position={[0.54, 1.55, 0]} color="#456650" />
      <Box size={[0.4, 0.25, 0.02]} position={[0.54, 2.05, 0.035]} color="#22303a" />
    </group>
    <group position={[1.1, 0, 2.03]} rotation={[0, doors * 1.7, 0]}>
      <Box size={[1.08, 2.1, 0.06]} position={[-0.54, 1.55, 0]} color="#456650" />
      <Box size={[0.4, 0.25, 0.02]} position={[-0.54, 2.05, 0.035]} color="#22303a" />
    </group>
  </group>
);

// a cash-in-transit guard: helmet, vest
export const Guard: React.FC<{position: V3; rotation?: number; pose?: PersonPose; rightHand?: React.ReactNode; leftHand?: React.ReactNode; i?: number}> = ({position, rotation = 0, pose, rightHand, leftHand, i = 0}) => (
  <Person
    position={position}
    rotation={rotation}
    shirt="#3a4250"
    pants="#2a2e36"
    hair="#2a1d15"
    skin={i % 2 ? '#d8b090' : '#efd2b3'}
    pose={pose}
    rightHand={rightHand}
    leftHand={leftHand}
    headExtra={<Box size={[0.36, 0.14, 0.36]} position={[0, 0.39, -0.005]} color="#2a3a30" />}
    bodyExtra={<Box size={[0.58, 0.56, 0.36]} position={[0, 1.22, 0]} color="#4a5a48" />}
  />
);

export const Case: React.FC<{open?: number}> = ({open = 0}) => (
  <group>
    <Box size={[0.42, 0.3, 0.1]} position={[0, 0, 0]} color="#c8ccd2" />
    <Box size={[0.12, 0.03, 0.03]} position={[0, 0.17, 0]} color="#3a3a40" />
    {open > 0 ? <Box size={[0.38, 0.26, 0.012]} position={[0, 0, 0.056]} color="#2a2a30" /> : null}
  </group>
);
