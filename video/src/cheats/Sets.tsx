import React from 'react';
import {Ball, Block, Cone, Cyl, Glow, Pill, RBox, Ring} from '../bear/kit';
import {Pic} from '../bear/Props';
import {Human, HumanPose, Outfit} from '../bear/People';
import {Tree} from '../bear/Forest';
import {Cap, KID, adult, kid} from '../brain/Sets';
import {Cloud} from '../gtamom/Sets';
import {V3, rnd} from './cues';
import {drawBar, drawBill, drawPrice, drawSign} from './tex';

// People and sets for «читы в реальной жизни»: one city street (stall, flowerbed, traffic cop), cars, the jetpack granny,
// health bars, the round «fat code» body, money rain, the Moon.

export {Cloud};

// ---------------------------------------------------------------- people

// the hero: 12, green hoodie, round glasses
export const HERO: Outfit = {...KID, top: '#3fae5a', glasses: true, hair: '#5a3418'};
export const COP: Outfit = {
  skin: '#efc09c',
  hair: '#3a2a20',
  hairStyle: 'short',
  top: '#2c3e6e',
  topStyle: 'puffer',
  legs: '#24305a',
  legStyle: 'pants',
  shoes: '#1a1416',
  iris: '#3a2a20',
};
export const SELLER: Outfit = {
  skin: '#f0c4a2',
  hair: '#a0522d',
  hairStyle: 'bun',
  top: '#f4f1ea',
  topStyle: 'cardigan',
  legs: '#4a4a58',
  legStyle: 'skirt',
  shoes: '#2a2224',
  iris: '#4a3020',
  lash: true,
  shirt: '#e86a6a',
};
export const GRAN: Outfit = {
  skin: '#f2c8a8',
  hair: '#dcdcdc',
  hairStyle: 'bun',
  top: '#8a5aa0',
  topStyle: 'cardigan',
  legs: '#5a4a6a',
  legStyle: 'skirt',
  shoes: '#3a2a24',
  glasses: true,
  iris: '#4a3020',
  lash: true,
  shirt: '#f3ead8',
};
export const BOSS: Outfit = {...adult(0), top: '#26324f', legs: '#26324f', tie: '#d8322a', glasses: true, hair: '#8a8a8a'};
export const WORKER: Outfit = {...adult(4), top: '#7a7468'};
// mom in a pink robe and curlers
export const MOM: Outfit = {
  skin: '#f0c2a0',
  hair: '#6e2a1e',
  hairStyle: 'bob',
  top: '#ef7aa8',
  topStyle: 'coat',
  legs: '#ef7aa8',
  legStyle: 'skirt',
  shoes: '#ffb8d0',
  iris: '#4a3020',
  lash: true,
  shirt: '#ffd8e6',
};
// passers-by
export const folk = (i: number): Outfit => (i % 3 === 2 ? kid(i) : adult(i + 1));
export const walker = (i: number): Outfit => {
  const o = folk(i);
  return {...o, top: ['#e85d75', '#5aa0e6', '#f2b42e', '#7fd6c2', '#9b7bd8', '#ff8a3d'][i % 6], topStyle: (['puffer', 'hoodie', 'coat', 'puffer', 'cardigan', 'hoodie'] as const)[i % 6]};
};

// curlers on mom's head (head accessory: centre at the origin, R = 0.16)
export const Curlers: React.FC = () => (
  <group>
    {Array.from({length: 7}, (_, i) => {
      const a = -1.3 + i * 0.43;
      return <Cyl key={i} position={[Math.sin(a) * 0.15, 0.1 + Math.cos(a) * 0.04, Math.cos(a) * 0.05 - 0.02]} rotation={[0, 0, Math.PI / 2 + a * 0.3]} rt={0.032} rb={0.032} h={0.07} seg={12} color={i % 2 ? '#7fd6ff' : '#ffd23f'} />;
    })}
  </group>
);

// police cap
export const CopCap: React.FC = () => (
  <group>
    <Cap color="#2c3e6e" />
    <Ring position={[0, 0.035, -0.005]} rotation={[Math.PI / 2, 0, 0]} r={0.158} tube={0.012} color="#e8453c" />
  </group>
);

// a striped traffic baton held in a fist
export const Baton: React.FC<{rot?: number}> = ({rot = 0}) => (
  <group rotation={[rot, 0, 0]}>
    {Array.from({length: 5}, (_, i) => (
      <Cyl key={i} position={[0, 0.04 + i * 0.07, 0.02]} rt={0.018} rb={0.018} h={0.07} seg={12} color={i % 2 ? '#1b1c24' : '#ffffff'} />
    ))}
  </group>
);

export const Slipper: React.FC = () => (
  <group rotation={[0.2, 0, 0]}>
    <RBox position={[0, 0.1, 0.02]} size={[0.11, 0.035, 0.27]} r={0.015} color="#ff9fc0" />
    <Ball position={[0, 0.14, 0.08]} scale={[0.065, 0.045, 0.07]} color="#ffd0e0" look={{rough: 1, rim: '#ffffff', rimK: 0.4}} />
  </group>
);

// a string bag with oranges and a loaf
export const NetBag: React.FC = () => (
  <group position={[0, -0.18, 0.02]}>
    <Ring position={[0, 0.17, 0]} rotation={[0, Math.PI / 2, 0]} r={0.06} tube={0.007} color="#e8c48e" />
    <Ball position={[0, 0, 0]} scale={[0.13, 0.15, 0.11]} color="#e8c48e" look={{opacity: 0.35}} shadow={false} />
    <Ball position={[0.04, -0.03, 0.01]} scale={0.055} color="#ff8a1e" />
    <Ball position={[-0.05, -0.05, 0]} scale={0.05} color="#ff9a2e" />
    <Pill position={[0.0, 0.05, -0.02]} rotation={[0, 0, 0.5]} r={0.035} len={0.12} color="#d89a52" />
  </group>
);

// jetpack: worn on the back (origin between the shoulder blades, facing +z), flame k 0..1
export const Jetpack: React.FC<{k?: number; v?: number}> = ({k = 1, v = 0}) => (
  <group>
    <RBox position={[0, 0, -0.03]} size={[0.3, 0.32, 0.08]} r={0.03} color="#5a5e6a" look={{metal: 0.5, rough: 0.35}} />
    {([1, -1] as const).map((s) => (
      <group key={s} position={[0.1 * s, 0, -0.12]}>
        <Cyl rt={0.07} rb={0.07} h={0.42} seg={18} color="#e8453c" look={{metal: 0.3, rough: 0.3}} />
        <Ball position={[0, 0.21, 0]} scale={0.07} color="#e8453c" look={{metal: 0.3, rough: 0.3}} />
        <Cyl position={[0, -0.25, 0]} rt={0.05} rb={0.065} h={0.08} seg={16} color="#3a3a44" look={{metal: 0.6, rough: 0.3}} />
        {k > 0 ? (
          <>
            <Cone position={[0, -0.42, 0]} rotation={[Math.PI, 0, 0]} r={0.055} h={0.3 * k * (0.85 + 0.15 * Math.sin(v * 40 + s))} color="#ffd27a" look={{basic: true}} shadow={false} />
            <Cone position={[0, -0.36, 0]} rotation={[Math.PI, 0, 0]} r={0.035} h={0.16 * k} color="#ffffff" look={{basic: true}} shadow={false} />
            <Glow position={[0, -0.45, 0.02]} size={0.7} color="#ffb04a" k={0.8 * k} />
          </>
        ) : null}
      </group>
    ))}
  </group>
);

// a flying granny: the jetpack sits on her back
export const Granny: React.FC<{position: V3; rotation?: number; pose?: HumanPose; v: number; tilt?: number}> = ({position, rotation = 0, pose = {}, v, tilt = 0}) => (
  <group position={position} rotation={[tilt, rotation, 0]}>
    <Human o={GRAN} pose={pose} handR={<NetBag />} head={<Ball position={[0, 0.02, -0.02]} scale={[0.172, 0.15, 0.17]} color="#e86a6a" look={{rough: 1, rim: '#ffffff', rimK: 0.2}} />} />
    <group position={[0, 1.08, -0.2]}>
      <Jetpack v={v} />
    </group>
  </group>
);

// health (+ armour) bar floating over someone's head
export const Bar: React.FC<{position: V3; hp?: number; armour?: number; w?: number; k?: string; yaw?: number}> = ({position, hp = 1, armour = 0, w = 0.5, k = 'bar', yaw = 0}) => (
  <Pic position={position} rotation={[0, yaw, 0]} size={[w, w * (armour > 0 ? 0.3 : 0.18)]} res={[300, armour > 0 ? 180 : 108]} k={`${k}-${Math.round(hp * 50)}-${Math.round(armour * 50)}`} draw={(g, W, H) => drawBar(g, W, H, hp, armour)} lit={false} transparent />
);

// the «fat code» body: a ball in the top colour around the torso; roll = rotation around the ball centre (rolling along +x)
export const Fat: React.FC<{o: Outfit; position: V3; rotation?: number; k: number; roll?: number; pose?: HumanPose; head?: React.ReactNode}> = ({o, position, rotation = 0, k, roll = 0, pose = {}, head}) => {
  const sc = o.scale ?? 1;
  const cy = 0.88 * sc;
  const r = (0.18 + 0.4 * k) * sc;
  const lift = 0.3 * k * sc; // the ball rests on the ground once round
  const p: HumanPose = {...pose, armL: [-0.1, 0.25 + 1.0 * k, 0], armR: [-0.1, 0.25 + 1.0 * k, 0], elbowL: -0.2, elbowR: -0.2};
  return (
    <group position={[position[0], position[1] + cy + lift * 0.4 - 0.18 * k * sc, position[2]]} rotation={[0, rotation, 0]}>
      <group rotation={[0, 0, -roll]}>
        {/* the body is pushed up as the ball grows, so the head stays on top of the ball */}
        <group position={[0, -cy + 0.22 * k * sc, 0]}>
          <Human o={o} pose={p} head={head} />
        </group>
        {k > 0 ? <Ball position={[0, -0.05 * k * sc, 0]} scale={[r * 1.02, r * 0.85, r]} color={o.top} look={{rim: '#ffffff', rimK: 0.15, rough: 0.85}} /> : null}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- the street (road along x, far sidewalk z < -3, near z > 3)

export const ROAD_Y = -0.15;
const BUILD_COLS = ['#f4d8b8', '#bfe0f0', '#f6c0c8', '#d8e8b0', '#e8d0f0', '#ffe0a0', '#f0b8a0', '#c8e0d8'];

export const House: React.FC<{position: V3; w: number; h: number; d?: number; i: number; yaw?: number}> = ({position, w, h, d = 6, i, yaw = 0}) => {
  const c = BUILD_COLS[i % BUILD_COLS.length];
  const cols = Math.max(2, Math.floor(w / 1.6));
  const rows = Math.max(2, Math.floor((h - 1) / 2.2));
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <RBox position={[0, h / 2, 0]} size={[w, h, d]} r={0.08} color={c} look={{rough: 0.9}} />
      {Array.from({length: rows}).map((_, r) =>
        Array.from({length: cols}).map((_, cI) => {
          const x = -w / 2 + (cI + 0.5) * (w / cols);
          const y = 1.6 + r * 2.2;
          const lit = rnd(i * 31 + r * 7 + cI) < 0.25;
          return (
            <group key={`${r}-${cI}`} position={[x, y, d / 2]}>
              <Block position={[0, 0, 0.02]} size={[0.9, 1.2, 0.06]} color="#f8f4ec" />
              <Block position={[0, 0, 0.055]} size={[0.74, 1.04, 0.02]} color={lit ? '#ffe9a0' : '#6a8ab4'} look={lit ? {basic: true} : {rough: 0.25, metal: 0.2}} shadow={false} />
              <Block position={[0, -0.64, 0.08]} size={[1.0, 0.08, 0.16]} color="#f8f4ec" />
            </group>
          );
        }),
      )}
      <Block position={[0, h + 0.1, 0]} size={[w + 0.2, 0.2, d + 0.2]} color="#9a8a8a" />
    </group>
  );
};

// buildings behind the far sidewalk and a few on the near side
const ROW: {x: number; w: number; h: number}[] = (() => {
  const out = [];
  let x = -34;
  let i = 0;
  while (x < 34) {
    const w = 5 + rnd(i * 3.7) * 4;
    out.push({x: x + w / 2, w, h: 6.5 + rnd(i * 5.1) * 7});
    x += w + 0.6;
    i++;
  }
  return out;
})();

export const Lamp: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <Cyl position={[0, 2.2, 0]} rt={0.05} rb={0.08} h={4.4} seg={12} color="#3a3e48" look={{metal: 0.5, rough: 0.4}} />
    <Cyl position={[0, 4.4, 0.35]} rotation={[Math.PI / 2, 0, 0]} rt={0.04} rb={0.04} h={0.7} seg={8} color="#3a3e48" />
    <RBox position={[0, 4.32, 0.72]} size={[0.3, 0.12, 0.5]} r={0.04} color="#3a3e48" />
  </group>
);

export const TrafficLight: React.FC<{position: V3; rotation?: number; on?: number}> = ({position, rotation = 0, on = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <RBox position={[0, 0, 0]} size={[0.36, 1.0, 0.26]} r={0.06} color="#2a2b33" />
    {['#e8453c', '#ffd23f', '#3ae07a'].map((c, i) => (
      <group key={i} position={[0, 0.3 - i * 0.3, 0.13]}>
        <Cyl rotation={[Math.PI / 2, 0, 0]} rt={0.1} rb={0.1} h={0.02} seg={20} color={i === on ? c : '#4a4a52'} look={i === on ? {basic: true} : {rough: 0.5}} />
        {i === on ? <Glow position={[0, 0, 0.05]} size={0.7} color={c} k={0.6} /> : null}
      </group>
    ))}
  </group>
);

// the bread stall on the far sidewalk (front faces +z)
export const STALL: V3 = [-4.2, 0, -5.0];
export const Stall: React.FC<{price: number; cash: number}> = ({price, cash}) => (
  <group position={STALL}>
    <RBox position={[0, 0.5, 0]} size={[2.2, 1.0, 0.8]} r={0.05} color="#c8794a" />
    <RBox position={[0, 1.02, 0.02]} size={[2.3, 0.06, 0.9]} r={0.02} color="#f4efe6" />
    {/* posts and a striped awning */}
    {[-1, 1].map((s) => (
      <Cyl key={s} position={[1.05 * s, 1.55, -0.3]} rt={0.035} rb={0.035} h={1.1} seg={10} color="#f4efe6" />
    ))}
    {Array.from({length: 8}, (_, i) => (
      <Block key={i} position={[-1.05 + i * 0.3 + 0.15, 2.18, 0.05]} rotation={[0.32, 0, 0]} size={[0.3, 0.05, 1.2]} color={i % 2 ? '#ffffff' : '#e8453c'} />
    ))}
    <Pic position={[0, 2.0, 0.67]} rotation={[0.32, 0, 0]} size={[1.4, 0.36]} res={[560, 144]} k="sign-bread" draw={drawSign('ХЛЕБ', '#ffd23f', '#3a2a20')} />
    {/* loaves */}
    {[-0.7, -0.35, 0.35, 0.7].map((x, i) => (
      <Pill key={i} position={[x, 1.12, 0.12 + (i % 2) * 0.12]} rotation={[0, 0, Math.PI / 2]} r={0.07} len={0.22} color="#d89a52" look={{rough: 0.9}} />
    ))}
    <Pill position={[0, 1.13, 0.22]} rotation={[0, 0, Math.PI / 2]} r={0.08} len={0.26} color="#e0a85a" look={{rough: 0.9}} />
    <Pic position={[0, 1.31, 0.33]} rotation={[-0.25, 0, 0]} size={[0.38, 0.22]} res={[380, 220]} k={`price-${price}`} draw={(g, W, H) => drawPrice(g, W, H, price)} />
    {/* a pile of money on the counter */}
    {Array.from({length: Math.round(cash * 40)}, (_, i) => (
      <Block key={i} position={[0.5 + (rnd(i) - 0.5) * 0.6, 1.06 + rnd(i * 3) * 0.12 * cash, (rnd(i * 5) - 0.5) * 0.5]} rotation={[0, rnd(i * 7) * 3, (rnd(i * 9) - 0.5) * 0.4]} size={[0.15, 0.006, 0.07]} color={i % 3 ? '#7cc47a' : '#5aa45a'} />
    ))}
  </group>
);

// the flowerbed the car parks on
export const BED: V3 = [4.6, 0, -5.4];
export const Flowerbed: React.FC<{crush?: number}> = ({crush = 0}) => (
  <group position={BED}>
    <Cyl position={[0, 0.12, 0]} rt={1.5} rb={1.55} h={0.24} seg={36} color="#d8d0c4" />
    <Cyl position={[0, 0.25, 0]} rt={1.38} rb={1.38} h={0.04} seg={36} color="#6a4a30" look={{rough: 1}} />
    {Array.from({length: 26}, (_, i) => {
      const a = rnd(i * 3.3) * Math.PI * 2;
      const r = Math.sqrt(rnd(i * 5.7)) * 1.2;
      const s = 1 - crush * (rnd(i * 2) < 0.8 ? 1 : 0.3);
      return (
        <group key={i} position={[Math.cos(a) * r, 0.27, Math.sin(a) * r]} scale={[1, Math.max(0.15, s), 1]}>
          <Cyl position={[0, 0.12, 0]} rt={0.01} rb={0.012} h={0.24} seg={6} color="#3a8a3a" />
          <Ball position={[0, 0.26, 0]} scale={0.055} color={['#e8453c', '#ffd23f', '#ff9fc8', '#ffffff', '#9b7bd8'][i % 5]} />
        </group>
      );
    })}
  </group>
);

export const Street: React.FC<{jam?: boolean; noTrees?: boolean}> = ({noTrees}) => (
  <group>
    {/* road and sidewalks */}
    <Block position={[0, ROAD_Y - 0.05, 0]} size={[90, 0.1, 6]} color="#5d616c" look={{rough: 0.9}} />
    {Array.from({length: 22}, (_, i) => (
      <Block key={i} position={[-42 + i * 4, ROAD_Y + 0.004, 0]} size={[2, 0.01, 0.16]} color="#f4f1ea" shadow={false} />
    ))}
    {[-1, 1].map((s) => (
      <group key={s}>
        <Block position={[0, -0.09, s * 3.07]} size={[90, 0.2, 0.12]} color="#c8c4bc" />
        <Block position={[0, -0.1, s * 5.6]} size={[90, 0.2, 5]} color="#d8cfc0" look={{rough: 0.95}} />
        <Block position={[0, -0.1, s * 24.05]} size={[90, 0.2, 31.9]} color="#8cc46a" look={{rough: 1}} />
      </group>
    ))}
    {/* tiles on the far sidewalk */}
    {Array.from({length: 30}, (_, i) => (
      <Block key={i} position={[-44 + i * 3, 0.002, -5.6]} size={[0.02, 0.004, 4.9]} color="#c4baa8" shadow={false} receive={false} />
    ))}
    {/* the far row of houses */}
    {ROW.map((b, i) => (
      <House key={i} position={[b.x, 0, -17]} w={b.w} h={b.h} i={i} />
    ))}
    {/* the near row (seen in reverse shots) */}
    {ROW.map((b, i) => (
      <House key={`n${i}`} position={[b.x + 1.5, 0, 17]} w={b.w} h={b.h * 0.9} i={i + 3} yaw={Math.PI} />
    ))}
    {noTrees
      ? null
      : [-14, -9, -4.5, 8, 13, 19].map((x, i) => <Tree key={i} position={[x, 0, -9.5 - (i % 2) * 1.5]} h={4.4} seed={i + 4} scale={0.9} cols={['#4ab85a', '#3aa04a', '#6ac86a', '#5aae4a']} />)}
    {[-15, 7.5, 16].map((x) => (
      <Lamp key={x} position={[x, 0, -3.6]} />
    ))}
    {[-12, -2, 9, 18].map((x, i) => (
      <Tree key={`t${i}`} position={[x, 0, 4.4]} h={4.0} seed={i + 11} scale={0.85} cols={['#4ab85a', '#3aa04a', '#6ac86a', '#5aae4a']} />
    ))}
  </group>
);

export const CityLights: React.FC<{center?: V3; box?: number; k?: number}> = ({center = [0, 0, -3], box = 12, k = 1}) => (
  <>
    <color attach="background" args={['#9fd0f0']} />
    <hemisphereLight color="#e8f4ff" groundColor="#8a8070" intensity={1.15 * k} />
    <directionalLight
      position={[center[0] + 8, center[1] + 14, center[2] + 9]}
      target-position={center}
      color="#fff2dc"
      intensity={2.1 * k}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-box}
      shadow-camera-right={box}
      shadow-camera-top={box}
      shadow-camera-bottom={-box}
      shadow-camera-near={0.5}
      shadow-camera-far={80}
      shadow-bias={-0.0005}
      shadow-normalBias={0.02}
    />
    <directionalLight position={[center[0] - 6, center[1] + 4, center[2] + 12]} color="#dfe8ff" intensity={0.45 * k} />
  </>
);

// ---------------------------------------------------------------- cars (full size, origin on the ground, nose to +x)

const CAR_COLS = ['#e8453c', '#ffd23f', '#3a9cf0', '#ffffff', '#2fae5a', '#ff8a1e', '#9b7bd8'];
export const Car: React.FC<{position: V3; yaw?: number; i: number; pitch?: number; roll?: number; wheels?: number}> = ({position, yaw = 0, i, pitch = 0, roll = 0, wheels = 0}) => {
  const c = CAR_COLS[i % CAR_COLS.length];
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <group rotation={[roll, 0, pitch]}>
        <RBox position={[0, 0.58, 0]} size={[3.9, 0.62, 1.78]} r={0.2} color={c} look={{rough: 0.35, rim: '#ffffff', rimK: 0.15}} />
        <RBox position={[-0.25, 1.1, 0]} size={[2.1, 0.56, 1.6]} r={0.18} color="#2e3c5a" look={{rough: 0.15, metal: 0.3}} />
        <RBox position={[-0.25, 1.36, 0]} size={[1.9, 0.1, 1.5]} r={0.04} color={c} look={{rough: 0.35}} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <Ball position={[1.93, 0.66, s * 0.62]} scale={[0.03, 0.09, 0.14]} color="#fff6d0" look={{basic: true}} shadow={false} />
            <Ball position={[-1.93, 0.66, s * 0.62]} scale={[0.03, 0.08, 0.13]} color="#e8453c" look={{basic: true}} shadow={false} />
          </group>
        ))}
        {[-1, 1].map((sx) =>
          [-1, 1].map((sz) => (
            <group key={`${sx}${sz}`} position={[sx * 1.25, 0.34, sz * 0.86]} rotation={[Math.PI / 2, 0, -wheels]}>
              <Cyl rt={0.34} rb={0.34} h={0.24} seg={20} color="#1c1d24" />
              <Cyl position={[0, sz * 0.122, 0]} rt={0.17} rb={0.17} h={0.01} seg={14} color="#c8ccd2" look={{metal: 0.6, rough: 0.3}} />
            </group>
          )),
        )}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- money rain

const BILLS = Array.from({length: 140}, (_, i) => ({x: (rnd(i * 1.3) - 0.5) * 16, z: -2 - rnd(i * 2.9) * 10, y0: 4 + rnd(i * 4.7) * 12, sp: 0.8 + rnd(i * 6.1) * 0.7, ph: rnd(i * 8.3) * 6}));
export const MoneyRain: React.FC<{v: number; t0: number; center?: V3; n?: number}> = ({v, t0, center = [0, 0, 0], n = 140}) => {
  const t = v - t0;
  if (t < 0) return null;
  return (
    <group position={center}>
      {BILLS.slice(0, n).map((b, i) => {
        const y = b.y0 - ((t * b.sp * 1.6 + (b.y0 % 3)) % 16) + 2;
        if (y < 0.02) return null;
        return (
          <Pic key={i} position={[b.x + Math.sin(t * 2 + b.ph) * 0.4, y, b.z]} rotation={[Math.sin(t * 3 + b.ph) * 1.2, t * 1.5 + b.ph, Math.cos(t * 2.4 + b.ph) * 0.8]} size={[0.32, 0.15]} res={[128, 60]} k="bill" draw={drawBill} />
        );
      })}
    </group>
  );
};

// bills lying on the ground
export const BillsOnGround: React.FC<{area: [number, number, number, number]; n?: number; seed?: number}> = ({area, n = 60, seed = 1}) => (
  <>
    {Array.from({length: n}, (_, i) => (
      <Block
        key={i}
        position={[area[0] + rnd(seed * 7 + i * 1.7) * (area[1] - area[0]), 0.004 + (i % 20) * 0.0032, area[2] + rnd(seed * 3 + i * 2.3) * (area[3] - area[2])]}
        rotation={[0, rnd(i * 4.1 + seed) * 3, 0]}
        size={[0.3, 0.003, 0.14]}
        color={i % 3 ? '#7cc47a' : '#6ab46a'}
        shadow={false}
      />
    ))}
  </>
);

// ---------------------------------------------------------------- the Moon

export const MoonSet: React.FC = () => (
  <group>
    <color attach="background" args={['#05060f']} />
    <ambientLight intensity={0.35} color="#b8c0ff" />
    <directionalLight position={[6, 8, 5]} intensity={2.4} color="#ffffff" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-bias={-0.0005} />
    <Block position={[0, -0.1, 0]} size={[60, 0.2, 60]} color="#a8a8b0" look={{rough: 1}} />
    {Array.from({length: 18}, (_, i) => {
      const x = (rnd(i * 2.1) - 0.5) * 24;
      const z = -rnd(i * 3.3) * 22 + 3;
      const r = 0.4 + rnd(i * 5.5) * 1.4;
      return (
        <group key={i} position={[x, 0, z]}>
          <Ring position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} r={r} tube={r * 0.16} color="#b8b8c0" look={{rough: 1}} />
          <Cyl position={[0, 0.006, 0]} rt={r * 0.92} rb={r * 0.92} h={0.012} seg={24} color="#8e8e98" look={{rough: 1}} shadow={false} />
        </group>
      );
    })}
    {/* the Earth and stars */}
    <Ball position={[-9, 9, -40]} scale={4} color="#3a7bd5" look={{basic: true}} shadow={false} />
    <Ball position={[-8.2, 9.8, -36.5]} scale={[1.6, 1.0, 0.6]} color="#5abf6a" look={{basic: true}} shadow={false} />
    <Ball position={[-10.2, 8.2, -36.4]} scale={[1.3, 0.9, 0.6]} color="#5abf6a" look={{basic: true}} shadow={false} />
    {Array.from({length: 90}, (_, i) => (
      <Ball key={i} position={[(rnd(i * 1.9) - 0.5) * 90, 4 + rnd(i * 2.7) * 40, -44 - rnd(i * 3.1) * 6]} scale={0.06 + rnd(i * 4.3) * 0.08} color="#ffffff" look={{basic: true}} shadow={false} />
    ))}
  </group>
);

// the flag on a pole (cloth faces +z), pole at the origin
export const FLAG_COLS = ['#ffffff', '#e8453c', '#2f6fd8', '#c8ccd2'];
export const Flag: React.FC<{v: number}> = ({v}) => (
  <group>
    <Cyl position={[0, 0.9, 0]} rt={0.02} rb={0.025} h={1.8} seg={10} color="#c8ccd2" look={{metal: 0.6, rough: 0.3}} />
    <Cyl position={[0.38, 1.78, 0]} rotation={[0, 0, Math.PI / 2]} rt={0.012} rb={0.012} h={0.76} seg={8} color="#c8ccd2" />
    {[0, 1, 2].map((r) => (
      <Block key={r} position={[0.38, 1.64 - r * 0.1, 0.004 * Math.sin(v * 2 + r)]} size={[0.74, 0.1, 0.012]} color={['#ffffff', '#2f6fd8', '#e8453c'][r]} />
    ))}
  </group>
);

// boot prints around the flag
export const Prints: React.FC = () => (
  <>
    {Array.from({length: 10}, (_, i) => (
      <RBox key={i} position={[0.5 + Math.sin(i * 0.7) * 1.4, 0.004, 1.2 - i * 0.35 + (i % 2) * 0.1]} rotation={[0, 0.3, 0]} size={[0.12, 0.006, 0.28]} r={0.002} color="#8a8a94" shadow={false} />
    ))}
  </>
);
