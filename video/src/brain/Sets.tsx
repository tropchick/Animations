import React from 'react';
import {Ball, Block, Cone, Cyl, Glow, Limb, Pill, RBox, Ring} from '../bear/kit';
import {Pic} from '../bear/Props';
import {Outfit, girl} from '../bear/People';
import {V3, rnd} from './cues';

// People, the three brainrot toys, the cube dissolve, and the sets (classroom, kitchen, basement, the empty game).

// ---------------------------------------------------------------- people

export const KID: Outfit = {
  skin: '#f4c7a6',
  hair: '#6a3a1e',
  hairStyle: 'short',
  top: '#ff8a3d',
  topStyle: 'hoodie',
  legs: '#2f4466',
  legStyle: 'jeans',
  shoes: '#f2f2f2',
  iris: '#5a3a1a',
  scale: 0.78,
};
export const KID_SUIT: Outfit = {
  ...KID,
  top: '#26324f',
  topStyle: 'suit',
  legs: '#26324f',
  legStyle: 'pants',
  shoes: '#1a1416',
  shirt: '#f4f6fa',
  tie: '#d8322a',
};
// classmates / other kids
export const kid = (i: number, suit = false): Outfit => {
  const base = i % 2 ? {...girl(i + 3), scale: 0.76} : {...KID, hair: ['#2a1a12', '#c88a3a', '#1a1414', '#8a4a20'][i % 4], top: ['#5aa0e6', '#7fd6c2', '#e85d75', '#9b7bd8', '#c7e46b'][i % 5], skin: ['#f4c7a6', '#e6b08a', '#f7d2b6', '#d89e78'][i % 4], scale: 0.76};
  if (!suit) return base as Outfit;
  return {...base, top: ['#26324f', '#3a3a44', '#2a3a5a'][i % 3], topStyle: 'suit', legs: '#26324f', legStyle: i % 2 ? 'skirt' : 'pants', shoes: '#1a1416', shirt: '#f4f6fa', tie: ['#d8322a', '#2f6fd8', '#2fae5a'][i % 3]} as Outfit;
};
export const MOM: Outfit = {
  skin: '#f0c2a0',
  hair: '#6e2a1e',
  hairStyle: 'bun',
  top: '#c8574a',
  topStyle: 'cardigan',
  legs: '#4a4a58',
  legStyle: 'pants',
  shoes: '#2a2224',
  iris: '#4a3020',
  lash: true,
  shirt: '#f3ead8',
};
export const DAD: Outfit = {
  skin: '#e9b48e',
  hair: '#4a3020',
  hairStyle: 'short',
  top: '#6f7f5a',
  topStyle: 'puffer',
  legs: '#3a3a44',
  legStyle: 'pants',
  shoes: '#2a2224',
  beard: '#4a3020',
  iris: '#3a2416',
};
export const TEACHER: Outfit = {
  skin: '#f2c8a8',
  hair: '#9a9a9a',
  hairStyle: 'bun',
  top: '#7a5aa0',
  topStyle: 'cardigan',
  legs: '#4a3a5a',
  legStyle: 'skirt',
  shoes: '#2a2224',
  glasses: true,
  iris: '#4a3020',
  lash: true,
  shirt: '#f3ead8',
};
export const AUTHOR: Outfit = {
  skin: '#e9b48e',
  hair: '#2e2018',
  hairStyle: 'short',
  top: '#30323a',
  topStyle: 'hoodie',
  legs: '#2f4466',
  legStyle: 'jeans',
  shoes: '#f2f2f2',
  beard: '#2e2018',
  iris: '#3a2416',
};
// tired grey adults in office clothes
export const adult = (i: number): Outfit => ({
  skin: ['#f0c4a2', '#e6b08a', '#d89e78', '#f2c8a8'][i % 4],
  hair: ['#3a2a20', '#8a8a8a', '#1a1414', '#6a4a30', '#b0a090'][i % 5],
  hairStyle: (['short', 'bob', 'short', 'bun', 'short'] as const)[i % 5],
  top: ['#6a6e78', '#7a7468', '#5a6070', '#80808a'][i % 4],
  topStyle: 'suit',
  legs: ['#4a4c56', '#5a5650', '#3a3e48'][i % 3],
  legStyle: i % 5 === 1 || i % 5 === 3 ? 'skirt' : 'pants',
  shoes: '#2a2224',
  shirt: '#e8e8e4',
  tie: ['#7a7a84', '#8a6a6a', '#6a7a8a'][i % 3],
  glasses: i % 3 === 0,
  iris: '#3a2a20',
  lash: i % 5 === 1 || i % 5 === 3,
  beard: i % 4 === 2 ? '#3a2a20' : undefined,
});

// a baseball cap (head accessory: head centre at the origin, R = 0.16)
export const Cap: React.FC<{color?: string}> = ({color = '#2f6fd8'}) => (
  <group>
    <Ball position={[0, 0.045, -0.005]} scale={[0.168, 0.135, 0.17]} color={color} look={{rough: 0.8}} />
    <RBox position={[0, 0.07, 0.17]} rotation={[0.18, 0, 0]} size={[0.22, 0.016, 0.13]} r={0.006} color={color} />
  </group>
);

// a hair bow for mom at the school line
export const Bow: React.FC = () => (
  <group position={[0, 0.17, -0.06]}>
    <Ball position={[0.06, 0, 0]} scale={[0.06, 0.04, 0.02]} color="#ffffff" />
    <Ball position={[-0.06, 0, 0]} scale={[0.06, 0.04, 0.02]} color="#ffffff" />
    <Ball scale={0.022} color="#ffffff" />
  </group>
);

// ---------------------------------------------------------------- the three brainrots (own toy versions)

const SHARK = '#7aa9d6';
const SHARK_BELLY = '#f2f6fb';
const Eye: React.FC<{position: V3; r?: number; look?: [number, number]}> = ({position, r = 0.05, look = [0, 0]}) => (
  <group position={position}>
    <Ball scale={r} color="#ffffff" look={{rough: 0.3}} />
    <Ball position={[look[0] * r * 0.4, look[1] * r * 0.4, r * 0.62]} scale={r * 0.5} color="#1b1b22" shadow={false} />
    <Ball position={[look[0] * r * 0.4 + r * 0.15, look[1] * r * 0.4 + r * 0.18, r * 0.9]} scale={r * 0.14} color="#ffffff" shadow={false} />
  </group>
);

const Sneaker: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <RBox position={[0, 0.04, 0.03]} size={[0.11, 0.08, 0.2]} r={0.035} color="#ffffff" look={{rough: 0.5}} />
    <RBox position={[0, 0.006, 0.03]} size={[0.115, 0.014, 0.205]} r={0.006} color="#d8d8d8" />
    <RBox position={[0.057, 0.045, 0.02]} rotation={[0, 0, 0]} size={[0.004, 0.025, 0.1]} r={0.002} color="#2f6fd8" shadow={false} />
    <RBox position={[-0.057, 0.045, 0.02]} size={[0.004, 0.025, 0.1]} r={0.002} color="#2f6fd8" shadow={false} />
  </group>
);

// the shark in sneakers. legs: 3 (the real meme) or 4 (not used now). Faces +z; about 0.95 m tall.
export const SharkToy: React.FC<{position?: V3; rotation?: number; scale?: number; v?: number; legs?: number}> = ({position, rotation = 0, scale = 1, v = 0, legs = 3}) => {
  const xs = legs === 3 ? [[-0.11, 0.12], [0.11, 0.12], [0, -0.16]] : [[-0.11, 0.14], [0.11, 0.14], [-0.11, -0.14], [0.11, -0.14]];
  const bob = Math.abs(Math.sin(v * 5)) * 0.03;
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {xs.map(([x, z], i) => (
        <group key={i}>
          <Cyl position={[x, 0.2, z]} rt={0.035} rb={0.035} h={0.3} color={SHARK} />
          <Sneaker position={[x, 0, z]} />
        </group>
      ))}
      <group position={[0, 0.55 + bob, 0]}>
        <Ball scale={[0.24, 0.22, 0.48]} color={SHARK} look={{rough: 0.5, rim: '#ffffff', rimK: 0.2}} />
        <Ball position={[0, -0.07, 0.06]} scale={[0.2, 0.15, 0.38]} color={SHARK_BELLY} look={{rough: 0.6}} />
        {/* tail */}
        <group position={[0, 0.02, -0.5]}>
          <Cone position={[0, 0.12, -0.04]} rotation={[-0.9, 0, 0]} r={0.06} h={0.28} color={SHARK} />
          <Cone position={[0, -0.08, -0.03]} rotation={[-2.3, 0, 0]} r={0.05} h={0.2} color={SHARK} />
        </group>
        {/* dorsal + side fins */}
        <Cone position={[0, 0.27, -0.04]} rotation={[-0.35, 0, 0]} r={0.08} h={0.22} color={SHARK} />
        <Cone position={[0.24, -0.06, 0.08]} rotation={[0.3, 0, -1.9]} scale={[1, 1, 0.35]} r={0.07} h={0.2} color={SHARK} />
        <Cone position={[-0.24, -0.06, 0.08]} rotation={[0.3, 0, 1.9]} scale={[1, 1, 0.35]} r={0.07} h={0.2} color={SHARK} />
        {/* face */}
        <Eye position={[0.13, 0.08, 0.36]} r={0.055} look={[0.2, 0]} />
        <Eye position={[-0.13, 0.08, 0.36]} r={0.055} look={[-0.2, 0]} />
        <Ring position={[0, -0.04, 0.4]} rotation={[0.2, 0, Math.PI]} r={0.09} tube={0.012} arc={Math.PI} color="#2a2a33" shadow={false} />
        {[-0.06, -0.02, 0.02, 0.06].map((x) => (
          <Cone key={x} position={[x, -0.055, 0.44]} rotation={[Math.PI, 0, 0]} r={0.012} h={0.03} color="#ffffff" shadow={false} />
        ))}
      </group>
    </group>
  );
};

const WOOD = '#c08a52';
// the wooden log with a bat
export const LogToy: React.FC<{position?: V3; rotation?: number; scale?: number; v?: number}> = ({position, rotation = 0, scale = 1, v = 0}) => {
  const swing = Math.sin(v * 3) * 0.25;
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {([1, -1] as const).map((s) => (
        <group key={s}>
          <Cyl position={[0.08 * s, 0.15, 0]} rt={0.03} rb={0.03} h={0.3} color="#9a6a3a" />
          <RBox position={[0.08 * s, 0.03, 0.04]} size={[0.09, 0.06, 0.15]} r={0.025} color="#5a3a22" />
        </group>
      ))}
      <Cyl position={[0, 0.66, 0]} rt={0.17} rb={0.19} h={0.76} seg={20} color={WOOD} look={{rough: 0.9}} />
      <Cyl position={[0, 1.045, 0]} rt={0.15} rb={0.17} h={0.02} seg={20} color="#e8c48e" />
      {[0.4, 0.62, 0.84].map((y, i) => (
        <Ring key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} r={0.18 - i * 0.008} tube={0.006} color="#8a5a32" shadow={false} />
      ))}
      <Eye position={[0.07, 0.86, 0.15]} r={0.05} />
      <Eye position={[-0.07, 0.86, 0.15]} r={0.05} />
      <Ring position={[0, 0.74, 0.17]} rotation={[0.1, 0, Math.PI]} r={0.07} tube={0.012} arc={Math.PI} color="#3a2214" shadow={false} />
      {/* arms + bat */}
      <Limb position={[-0.18, 0.7, 0]} rotation={[0.2, 0, -0.5]} r={0.025} len={0.28} color="#9a6a3a" />
      <group position={[0.18, 0.72, 0.02]} rotation={[-0.6 + swing, 0, 0.4]}>
        <Limb r={0.025} len={0.22} color="#9a6a3a" />
        <group position={[0, -0.24, 0.04]} rotation={[-1.2, 0, 0]}>
          <Cyl position={[0, 0.22, 0]} rt={0.045} rb={0.022} h={0.5} seg={14} color="#d8a868" look={{rough: 0.6}} />
        </group>
      </group>
    </group>
  );
};

// the ballerina with a cappuccino cup for a head
export const BallerinaToy: React.FC<{position?: V3; rotation?: number; scale?: number; v?: number}> = ({position, rotation = 0, scale = 1, v = 0}) => {
  const spin = v * 1.6;
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <group rotation={[0, Math.sin(spin) * 0.4, 0]}>
        {/* standing leg + raised leg */}
        <Cyl position={[0.03, 0.22, 0]} rt={0.028} rb={0.024} h={0.44} color="#f4d0b8" />
        <Cone position={[0.03, 0.01, 0.02]} rotation={[Math.PI, 0, 0]} r={0.03} h={0.04} color="#ff9fc8" />
        <group position={[-0.04, 0.42, 0]} rotation={[-1.3, 0, 0.2]}>
          <Limb r={0.026} len={0.36} color="#f4d0b8" />
        </group>
        {/* tutu */}
        <Cyl position={[0, 0.46, 0]} rt={0.1} rb={0.26} h={0.08} seg={24} color="#ff9fc8" look={{rough: 0.9, rim: '#ffffff', rimK: 0.25}} />
        <Pill position={[0, 0.6, 0]} r={0.08} len={0.12} color="#ff7fb4" />
        {/* arms up */}
        {([1, -1] as const).map((s) => (
          <group key={s} position={[0.08 * s, 0.68, 0]} rotation={[0, 0, (2.6 + Math.sin(spin * 2) * 0.1) * s]}>
            <Limb r={0.02} len={0.26} color="#f4d0b8" />
          </group>
        ))}
        {/* the cup head */}
        <group position={[0, 0.82, 0]}>
          <Cyl position={[0, 0.07, 0]} rt={0.13} rb={0.09} h={0.16} seg={24} color="#ffffff" look={{rough: 0.25}} />
          <Cyl position={[0, 0.148, 0]} rt={0.118} rb={0.118} h={0.006} seg={24} color="#b07a4a" shadow={false} />
          <Ball position={[0, 0.152, 0]} scale={[0.05, 0.004, 0.035]} color="#f6e6d0" shadow={false} />
          <Ring position={[0.13, 0.07, 0]} rotation={[0, 0, 0]} r={0.04} tube={0.012} color="#ffffff" />
          <Eye position={[0.045, 0.07, 0.105]} r={0.032} />
          <Eye position={[-0.045, 0.07, 0.105]} r={0.032} />
          <Ring position={[0, 0.025, 0.11]} rotation={[0, 0, Math.PI]} r={0.025} tube={0.006} arc={Math.PI} color="#3a2214" shadow={false} />
        </group>
      </group>
    </group>
  );
};

// a toy falling apart into little cubes: t seconds since the burst
export const Crumble: React.FC<{center: V3; t: number; colors: string[]; h?: number; w?: number; n?: number; seed?: number}> = ({center, t, colors, h = 0.9, w = 0.4, n = 46, seed = 1}) => {
  if (t <= 0 || t > 2.2) return null;
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const a = rnd(seed * 13 + i * 1.7) * Math.PI * 2;
        const r0 = rnd(seed * 7 + i * 2.3) * w;
        const y0 = rnd(seed * 3 + i * 3.1) * h;
        const sp = 0.4 + rnd(i * 5.3 + seed) * 1.0;
        const up = 0.6 + rnd(i * 4.1 + seed) * 1.4;
        const delay = (y0 / h) * 0.25;
        const tt = Math.max(0, t - delay);
        const y = Math.max(0.03, center[1] + y0 + up * tt - 4.5 * tt * tt);
        const s = 0.06 * (1 - Math.min(1, tt / 1.8)) + (tt === 0 ? 0.02 : 0);
        if (s <= 0.003) return null;
        return (
          <Block
            key={i}
            position={[center[0] + Math.cos(a) * (r0 + sp * tt), y, center[2] + Math.sin(a) * (r0 + sp * tt)]}
            rotation={[tt * 6 + i, tt * 4 + i, 0]}
            size={[s, s, s]}
            color={colors[i % colors.length]}
            shadow={false}
          />
        );
      })}
    </>
  );
};
export const SHARK_COLS = [SHARK, SHARK_BELLY, '#ffffff', '#2f6fd8'];
export const LOG_COLS = [WOOD, '#8a5a32', '#e8c48e', '#d8a868'];
export const BALLERINA_COLS = ['#ff9fc8', '#ffffff', '#f4d0b8', '#b07a4a'];

// ---------------------------------------------------------------- props

export const Book: React.FC<{position?: V3; rotation?: V3; color?: string; size?: V3}> = ({position, rotation, color = '#2f6fd8', size = [0.2, 0.03, 0.27]}) => (
  <group position={position} rotation={rotation}>
    <RBox size={size} r={0.006} color={color} />
    <RBox position={[0.006, 0, 0]} size={[size[0] - 0.008, size[1] - 0.008, size[2] - 0.01]} r={0.003} color="#f8f4ea" shadow={false} />
  </group>
);

// an open notebook lying flat with a canvas page on the right half
export const Notebook: React.FC<{position?: V3; rotation?: V3; k: string; draw: (g: CanvasRenderingContext2D, W: number, H: number) => void; scale?: number}> = ({position, rotation, k, draw, scale = 1}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <RBox position={[0, 0.004, 0]} size={[0.34, 0.008, 0.24]} r={0.003} color="#3a6ad0" />
    <Pic position={[0, 0.0095, 0]} rotation={[-Math.PI / 2, 0, 0]} size={[0.32, 0.22]} res={[480, 330]} k={k} draw={draw} />
  </group>
);

export const Box: React.FC<{position?: V3; rotation?: V3}> = ({position, rotation}) => (
  <group position={position} rotation={rotation}>
    <RBox size={[0.36, 0.22, 0.26]} r={0.01} color="#c8a06a" look={{rough: 0.95}} />
    <Ball position={[0.08, 0.13, 0.02]} scale={[0.04, 0.06, 0.04]} color="#4a8a4a" />
    <Cyl position={[0.08, 0.1, 0.02]} rt={0.035} rb={0.03} h={0.06} color="#d8724a" />
    <RBox position={[-0.08, 0.14, -0.02]} rotation={[0.3, 0, 0]} size={[0.12, 0.1, 0.01]} r={0.004} color="#2a2a30" />
  </group>
);

export const Bouquet: React.FC<{position?: V3; rotation?: V3; seed?: number}> = ({position, rotation, seed = 0}) => (
  <group position={position} rotation={rotation}>
    <Cone position={[0, 0.1, 0]} rotation={[Math.PI, 0, 0]} r={0.08} h={0.22} color="#f4efe6" />
    {Array.from({length: 7}, (_, i) => {
      const a = (i / 7) * Math.PI * 2;
      return <Ball key={i} position={[Math.cos(a) * 0.06 * (i ? 1 : 0), 0.24 + (i % 2) * 0.03, Math.sin(a) * 0.06 * (i ? 1 : 0)]} scale={0.05} color={['#e8453c', '#ffd23f', '#ff8fd0', '#ffffff'][(i + seed) % 4]} />;
    })}
  </group>
);

// a pointer stick
export const Pointer: React.FC = () => <Cyl position={[0, -0.25, 0.06]} rotation={[0.35, 0, 0]} rt={0.006} rb={0.012} h={0.6} color="#8a5a34" />;

// a phone in hand (screen faces the holder: −z of the group = towards the person)
export const SmallPhone: React.FC<{position?: V3; rotation?: V3; k: string; draw: (g: CanvasRenderingContext2D, W: number, H: number) => void; scale?: number}> = ({position, rotation, k, draw, scale = 1}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <RBox size={[0.075, 0.155, 0.01]} r={0.009} color="#1c1d24" look={{rough: 0.3}} />
    <Pic position={[0, 0, 0.0056]} size={[0.068, 0.145]} res={[200, 420]} k={k} draw={draw} lit={false} glow={1.1} />
  </group>
);

// ---------------------------------------------------------------- sets

const WALL = {rough: 0.95};

// school desk for one kid: top at h
export const SchoolDesk: React.FC<{position: V3; h?: number; w?: number}> = ({position, h = 0.62, w = 0.7}) => (
  <group position={position}>
    <RBox position={[0, h - 0.015, 0]} size={[w, 0.03, 0.45]} r={0.008} color="#d8b27a" />
    {([1, -1] as const).map((s) => (
      <group key={s}>
        <Block position={[(w / 2 - 0.05) * s, (h - 0.03) / 2, 0]} size={[0.03, h - 0.03, 0.38]} color="#3a6a8a" />
      </group>
    ))}
    <Block position={[0, h - 0.13, -0.02]} size={[w - 0.12, 0.02, 0.36]} color="#3a6a8a" />
  </group>
);
// a school stool: seat top at h
export const Stool: React.FC<{position: V3; h?: number}> = ({position, h = 0.38}) => (
  <group position={position}>
    <RBox position={[0, h - 0.015, 0]} size={[0.34, 0.03, 0.3]} r={0.01} color="#d8b27a" />
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
      <Block key={i} position={[x * 0.13, (h - 0.03) / 2, z * 0.11]} size={[0.025, h - 0.03, 0.025]} color="#3a6a8a" />
    ))}
  </group>
);

export const ROWS_Z = [0.6, 1.6];
export const COLS_X = [-1.3, 0, 1.3];

// the classroom: blackboard on the back wall (z = -2), windows on the left, desks in two rows facing −z
export const Classroom: React.FC<{board: React.ReactNode; small?: boolean}> = ({board}) => (
  <group>
    <Block position={[0, -0.05, 0]} size={[8, 0.1, 9]} color="#b88a5a" />
    {Array.from({length: 16}, (_, i) => (
      <Block key={i} position={[-4 + i * 0.5 + 0.25, 0.0015, 0]} size={[0.004, 0.003, 9]} color="#9a6e44" shadow={false} receive={false} />
    ))}
    <Block position={[0, 1.6, -2.05]} size={[8, 3.2, 0.1]} color="#e9e2c8" look={WALL} />
    <Block position={[0, 0.45, -1.99]} size={[8, 0.9, 0.02]} color="#9fc0a8" look={WALL} />
    <Block position={[-3.2, 1.6, 0]} size={[0.1, 3.2, 9]} color="#e9e2c8" look={WALL} />
    <Block position={[3.2, 1.6, 0]} size={[0.1, 3.2, 9]} color="#e9e2c8" look={WALL} />
    {/* board */}
    <group position={[0, 1.55, -1.97]}>
      <RBox size={[2.9, 1.3, 0.06]} r={0.02} color="#7a5232" />
      <group position={[0, 0, 0.035]}>{board}</group>
      <RBox position={[0, -0.7, 0.08]} size={[2.6, 0.04, 0.12]} r={0.01} color="#7a5232" />
      <Block position={[-0.9, -0.67, 0.1]} size={[0.08, 0.02, 0.02]} color="#ffffff" />
    </group>
    {/* windows on the left wall */}
    {[-1.2, 1.4].map((z) => (
      <group key={z} position={[-3.14, 1.7, z]} rotation={[0, Math.PI / 2, 0]}>
        <RBox size={[1.3, 1.4, 0.06]} r={0.02} color="#f6f0e6" />
        <mesh position={[0, 0, 0.032]}>
          <planeGeometry args={[1.16, 1.26]} />
          <meshBasicMaterial color="#a8d4f0" toneMapped={false} />
        </mesh>
        <Block position={[0, 0, 0.05]} size={[0.04, 1.26, 0.03]} color="#f6f0e6" />
      </group>
    ))}
    {/* a clock and a poster */}
    <group position={[1.9, 2.55, -1.98]}>
      <Cyl rotation={[Math.PI / 2, 0, 0]} rt={0.18} rb={0.18} h={0.04} color="#ffffff" />
      <Block position={[0, 0.05, 0.03]} size={[0.012, 0.11, 0.01]} color="#2a2a30" shadow={false} />
      <Block position={[0.035, 0, 0.032]} size={[0.08, 0.012, 0.01]} color="#2a2a30" shadow={false} />
    </group>
    {/* teacher's desk at the front left */}
    <group position={[-2.1, 0, -1.0]}>
      <RBox position={[0, 0.74, 0]} size={[1.2, 0.05, 0.6]} r={0.01} color="#8a5a34" />
      <RBox position={[0.45, 0.37, 0]} size={[0.24, 0.72, 0.56]} r={0.01} color="#7a4e2c" />
      <Block position={[-0.55, 0.36, 0]} size={[0.04, 0.72, 0.5]} color="#7a4e2c" />
    </group>
  </group>
);

// the kitchen: back wall with cabinets, a fridge, the window, a table in the middle (top at 0.76)
export const Kitchen: React.FC<{evening?: number}> = ({evening = 0}) => {
  const wall = evening > 0.5 ? '#d8c0a0' : '#f2e2c4';
  return (
    <group>
      <Block position={[0, -0.05, 0]} size={[7, 0.1, 7]} color="#c8b8a0" />
      {Array.from({length: 7}, (_, i) =>
        Array.from({length: 7}, (_, j) => (i + j) % 2 ? <Block key={`${i}${j}`} position={[-3 + i, 0.0015, -3 + j]} size={[0.98, 0.003, 0.98]} color="#b8a890" shadow={false} receive={false} /> : null),
      )}
      <Block position={[0, 1.5, -2.2]} size={[7, 3, 0.1]} color={wall} look={WALL} />
      <Block position={[-2.6, 1.5, 0]} size={[0.1, 3, 7]} color={wall} look={WALL} />
      {/* counter + cabinets */}
      <group position={[0.6, 0, -1.85]}>
        <RBox position={[0, 0.45, 0]} size={[2.6, 0.9, 0.6]} r={0.02} color="#7fb0a0" />
        <RBox position={[0, 0.92, 0.02]} size={[2.66, 0.05, 0.66]} r={0.01} color="#f4efe6" />
        <RBox position={[0, 2.0, 0.05]} size={[2.6, 0.7, 0.4]} r={0.02} color="#7fb0a0" />
        {[-0.65, 0.65].map((x) => (
          <Block key={x} position={[x, 2.0, 0.26]} size={[0.012, 0.6, 0.012]} color="#5a8a7a" shadow={false} />
        ))}
        <Cyl position={[-0.8, 1.06, 0]} rt={0.11} rb={0.12} h={0.22} color="#e8453c" />
        <Ball position={[0.4, 1.0, 0.05]} scale={[0.1, 0.06, 0.1]} color="#f2b42e" />
      </group>
      {/* fridge */}
      <group position={[2.4, 0, -1.75]}>
        <RBox position={[0, 0.95, 0]} size={[0.8, 1.9, 0.7]} r={0.05} color="#f4f4f2" look={{rough: 0.4}} />
        <Block position={[0.33, 1.1, 0.36]} size={[0.03, 0.4, 0.03]} color="#b8b8bc" />
      </group>
      {/* window */}
      <group position={[-2.54, 1.6, -0.4]} rotation={[0, Math.PI / 2, 0]}>
        <RBox size={[1.2, 1.1, 0.06]} r={0.02} color="#f6f0e6" />
        <mesh position={[0, 0, 0.032]}>
          <planeGeometry args={[1.06, 0.96]} />
          <meshBasicMaterial color={evening > 0.5 ? '#2a3260' : '#a8d4f0'} toneMapped={false} />
        </mesh>
        <Block position={[0, 0, 0.05]} size={[0.04, 0.96, 0.03]} color="#f6f0e6" />
      </group>
      {/* lamp over the table */}
      <group position={[0, 2.35, 0]}>
        <Cyl position={[0, 0.3, 0]} rt={0.008} rb={0.008} h={0.6} color="#2a2a30" />
        <Cone position={[0, 0, 0]} r={0.26} h={0.2} color="#f2b42e" look={{emissive: '#ffd27a', emissiveK: evening > 0.5 ? 0.35 : 0.1}} />
        <Glow position={[0, -0.12, 0]} size={1.0} color="#ffd27a" k={evening > 0.5 ? 0.35 : 0.15} />
      </group>
      {/* table */}
      <group>
        <RBox position={[0, 0.74, 0]} size={[1.5, 0.05, 0.9]} r={0.02} color="#c8945a" />
        {[[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]].map(([x, z], i) => (
          <Cyl key={i} position={[x, 0.36, z]} rt={0.03} rb={0.025} h={0.72} color="#a8743a" />
        ))}
      </group>
    </group>
  );
};

// the basement: concrete, one hanging bulb, a table, a whiteboard, a door with three locks
export const Basement: React.FC<{board: React.ReactNode; v: number}> = ({board, v}) => {
  const sway = Math.sin(v * 1.3) * 0.06;
  return (
    <group>
      <Block position={[0, -0.05, 0]} size={[7, 0.1, 7]} color="#5a5a60" />
      <Block position={[0, 1.4, -2.2]} size={[7, 2.8, 0.1]} color="#6e6e74" look={WALL} />
      <Block position={[-2.4, 1.4, 0]} size={[0.1, 2.8, 7]} color="#64646a" look={WALL} />
      <Block position={[2.4, 1.4, 0]} size={[0.1, 2.8, 7]} color="#64646a" look={WALL} />
      {/* pipes */}
      <Cyl position={[0, 2.6, -2.05]} rotation={[0, 0, Math.PI / 2]} rt={0.05} rb={0.05} h={7} color="#8a7a6a" />
      <Cyl position={[-2.25, 1.4, -1.0]} rt={0.04} rb={0.04} h={2.8} color="#8a7a6a" />
      {/* whiteboard */}
      <group position={[0, 1.75, -2.12]}>
        <RBox size={[1.3, 1.5, 0.04]} r={0.015} color="#b8b8c0" />
        <group position={[0, 0, 0.024]}>{board}</group>
      </group>
      {/* door with three locks, right wall */}
      <group position={[2.34, 0, 0.6]} rotation={[0, -Math.PI / 2, 0]}>
        <RBox position={[0, 1.0, 0]} size={[0.9, 2.0, 0.06]} r={0.01} color="#4a3a2e" />
        {[0.8, 1.05, 1.3].map((y) => (
          <group key={y}>
            <RBox position={[0.3, y, 0.05]} size={[0.12, 0.08, 0.04]} r={0.01} color="#c8c8cc" look={{metal: 0.7, rough: 0.3}} />
          </group>
        ))}
      </group>
      {/* table */}
      <group position={[0, 0, 0.15]}>
        <RBox position={[0, 0.74, 0]} size={[1.4, 0.05, 0.8]} r={0.01} color="#6a5040" />
        {[[-0.6, -0.32], [0.6, -0.32], [-0.6, 0.32], [0.6, 0.32]].map(([x, z], i) => (
          <Block key={i} position={[x, 0.36, z]} size={[0.05, 0.72, 0.05]} color="#4a3a2e" />
        ))}
      </group>
      {/* bulb */}
      <group position={[sway, 2.1, 0.15]}>
        <Cyl position={[0, 0.35, 0]} rt={0.005} rb={0.005} h={0.7} color="#1a1a1e" />
        <Ball scale={[0.06, 0.08, 0.06]} color="#fff2c8" look={{basic: true}} shadow={false} />
        <Glow position={[0, 0, 0]} size={1.4} color="#ffe2a0" k={0.45} />
      </group>
    </group>
  );
};

// the empty blocky game: a voxel field, a conveyor with nothing on it, the sign, two bored blocky players
export const GameWorld: React.FC<{v: number}> = ({v}) => (
  <group>
    <color attach="background" args={['#8fd0ff']} />
    {Array.from({length: 14}, (_, i) =>
      Array.from({length: 14}, (_, j) => (
        <Block key={`${i}-${j}`} position={[-7 + i + 0.5, -0.5 + ((i * 7 + j * 3) % 5 === 0 ? 0.04 : 0), -9 + j + 0.5]} size={[1, 1, 1]} color={(i + j) % 2 ? '#5fbf4a' : '#58b444'} />
      )),
    )}
    {/* conveyor: frame, belt stripes moving, rollers */}
    <group position={[0, 0, -2.5]}>
      <RBox position={[0, 0.45, 0]} size={[7, 0.12, 1.1]} r={0.02} color="#3a3c46" />
      {Array.from({length: 14}, (_, i) => {
        const x = ((i * 0.5 + v * 0.8) % 7) - 3.5;
        return <Block key={i} position={[x, 0.515, 0]} size={[0.06, 0.01, 1.0]} color="#5a5c66" shadow={false} />;
      })}
      {[-3.2, -1.6, 0, 1.6, 3.2].map((x) => (
        <group key={x}>
          <Block position={[x, 0.2, 0.45]} size={[0.12, 0.4, 0.12]} color="#2a2b33" />
          <Block position={[x, 0.2, -0.45]} size={[0.12, 0.4, 0.12]} color="#2a2b33" />
        </group>
      ))}
      {/* empty price tags along the belt */}
      {[-2.4, 0, 2.4].map((x) => (
        <Pic key={x} position={[x, 0.95, -0.45]} size={[0.8, 0.4]} res={[240, 120]} k={`tag${x}`} draw={(g, W, H) => {
          g.fillStyle = '#2a2b33';
          g.fillRect(0, 0, W, H);
          g.fillStyle = '#ffd23f';
          g.font = '700 54px Oswald, Arial';
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          g.fillText('—', W / 2, H / 2);
        }} />
      ))}
      {[-2.4, 0, 2.4].map((x) => (
        <Block key={x} position={[x, 0.66, -0.46]} size={[0.03, 0.3, 0.03]} color="#2a2b33" />
      ))}
    </group>
    {/* voxel trees */}
    {[[-5, -6], [4.5, -7], [5.5, -4], [-5.5, -3.5]].map(([x, z], i) => (
      <group key={i} position={[x, 0, z]}>
        <Block position={[0, 0.75, 0]} size={[0.4, 1.5, 0.4]} color="#8a5a34" />
        <Block position={[0, 1.8, 0]} size={[1.4, 1.0, 1.4]} color="#3f9a3a" />
        <Block position={[0, 2.45, 0]} size={[0.9, 0.5, 0.9]} color="#4aa844" />
      </group>
    ))}
  </group>
);

// a blocky game player (cube head, box body), standing bored
export const BlockyPlayer: React.FC<{position: V3; rotation?: number; color: string; v: number; seed?: number}> = ({position, rotation = 0, color, v, seed = 0}) => {
  const droop = 0.25 + Math.sin(v * 0.8 + seed) * 0.05;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Block position={[-0.1, 0.35, 0]} size={[0.18, 0.7, 0.2]} color="#2f4466" />
      <Block position={[0.1, 0.35, 0]} size={[0.18, 0.7, 0.2]} color="#2f4466" />
      <Block position={[0, 1.05, 0]} size={[0.44, 0.7, 0.24]} color={color} />
      <Block position={[-0.31, 1.05, 0]} rotation={[0.1, 0, 0]} size={[0.16, 0.66, 0.2]} color={color} />
      <Block position={[0.31, 1.05, 0]} rotation={[0.1, 0, 0]} size={[0.16, 0.66, 0.2]} color={color} />
      <group position={[0, 1.42, 0]} rotation={[droop, 0, 0]}>
        <Block position={[0, 0.2, 0]} size={[0.4, 0.4, 0.4]} color="#f4c7a6" />
        <Block position={[0.08, 0.24, 0.201]} size={[0.06, 0.04, 0.005]} color="#1b1b22" shadow={false} />
        <Block position={[-0.08, 0.24, 0.201]} size={[0.06, 0.04, 0.005]} color="#1b1b22" shadow={false} />
        <Block position={[0, 0.1, 0.201]} size={[0.14, 0.025, 0.005]} color="#7a3a2a" shadow={false} />
        <Block position={[0, 0.39, 0]} size={[0.42, 0.06, 0.42]} color="#4a2a1a" />
      </group>
    </group>
  );
};

// the supercomputer: a tower of phones in a frame, cables, a big screen on top
export const PhoneTower: React.FC<{position: V3; screen: React.ReactNode; tile: (i: number) => React.ReactNode; on: number}> = ({position, screen, tile, on}) => (
  <group position={position}>
    <RBox position={[0, 0.05, 0]} size={[1.3, 0.1, 0.7]} r={0.02} color="#2a2b33" />
    {[-0.6, 0.6].map((x) => (
      <Block key={x} position={[x, 0.95, 0]} size={[0.06, 1.8, 0.06]} color="#3a3c46" />
    ))}
    {Array.from({length: 7}, (_, r) =>
      Array.from({length: 6}, (_, c) => {
        const i = r * 6 + c;
        return (
          <group key={i} position={[-0.45 + c * 0.18, 0.25 + r * 0.22, 0.02]} rotation={[0, 0, (rnd(i) - 0.5) * 0.12]}>
            <RBox size={[0.085, 0.17, 0.012]} r={0.008} color="#1c1d24" />
            <group position={[0, 0, 0.007]}>{tile(i)}</group>
          </group>
        );
      }),
    )}
    {/* cables */}
    {[-0.3, 0, 0.3].map((x, i) => (
      <Cyl key={x} position={[x * 1.2, 0.9, -0.12]} rotation={[0.1 * (i - 1), 0, 0.15 * (i - 1)]} rt={0.012} rb={0.012} h={1.7} color={['#e8453c', '#2f6fd8', '#ffd23f'][i]} />
    ))}
    {/* top screen */}
    <group position={[0, 2.15, 0.02]}>
      <RBox position={[0, 0, -0.03]} size={[1.25, 0.66, 0.05]} r={0.02} color="#1c1d24" />
      {screen}
    </group>
    <Glow position={[0, 1.2, 0.3]} size={2.2} color="#7cff9a" k={0.18 * on} />
  </group>
);
