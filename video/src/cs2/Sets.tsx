import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Ball, Block, Cone, Cyl, G, Glow, Pill, RBox, Ring, mat} from '../bear/kit';
import {Headphones} from '../bear/Bear';
import {Human, HumanPose, Outfit} from '../bear/People';
import {Chair, Pic, Table} from '../bear/Props';
import {V3, rnd} from './cues';
import {drawBan, drawGame} from './tex';

// Characters, props and sets for «античит в CS2», in the soft toy style of «она выбрала медведя».

// ---------------------------------------------------------------- people

export const PLAYER: Outfit = {
  skin: '#f2c6a2',
  hair: '#4a2c1a',
  hairStyle: 'short',
  top: '#f07a2a',
  topStyle: 'hoodie',
  legs: '#33466a',
  legStyle: 'jeans',
  shoes: '#f2f2f2',
  iris: '#4a3020',
};

const GUY_HAIR = ['#2a1d15', '#6a3a1e', '#c99a5a', '#1a1a1a', '#8a4a22', '#3a2a20'];
const GUY_TOP = ['#5aa0e6', '#7fd6c2', '#e85d75', '#9b7bd8', '#c7e46b', '#ffd23f', '#4fb6c2', '#f4f1ea'];
export const guy = (i: number): Outfit => ({
  skin: ['#f2c6a2', '#e6b08a', '#f7d2b6', '#d89e78', '#c58c62'][i % 5],
  hair: GUY_HAIR[i % GUY_HAIR.length],
  hairStyle: 'short',
  top: GUY_TOP[(i * 3) % GUY_TOP.length],
  topStyle: i % 3 === 2 ? 'coat' : 'hoodie',
  legs: ['#2f4466', '#3a3a40', '#5a4a3a'][i % 3],
  legStyle: 'jeans',
  shoes: ['#f2f2f2', '#2a2224', '#8a5a3a'][i % 3],
  iris: ['#4a3020', '#3a5a2a', '#2a4a6a'][i % 3],
  beard: i % 5 === 3 ? GUY_HAIR[i % GUY_HAIR.length] : undefined,
});

// a cheat seller: dark hoodie, beanie, often glasses
export const coder = (i: number): Outfit => ({
  skin: ['#f2c6a2', '#e6b08a', '#f7d2b6', '#d89e78'][i % 4],
  hair: GUY_HAIR[(i + 2) % GUY_HAIR.length],
  hairStyle: 'short',
  top: ['#2a2c36', '#34303e', '#23262e', '#3a3442'][i % 4],
  topStyle: 'hoodie',
  legs: ['#2a2f3a', '#3a3a40'][i % 2],
  legStyle: 'jeans',
  shoes: '#2a2224',
  hat: ['#1e2028', '#3a2a40', '#202a30'][i % 3],
  glasses: i % 2 === 0,
  iris: '#3a2416',
});

// the bots: grey mannequins with a visor
export const BOT: Outfit = {
  skin: '#c9ced8',
  hair: '#c9ced8',
  hairStyle: 'short',
  top: '#8a93a6',
  topStyle: 'suit',
  legs: '#6a7286',
  legStyle: 'pants',
  shoes: '#4a5062',
  shirt: '#c9ced8',
  tie: '#5aa0e6',
  noBlush: true,
};

// human-size headphones (the bear kit is bear-size)
export const Headset: React.FC<{color?: string}> = ({color = '#1b1c22'}) => (
  <group scale={0.4}>
    <Headphones color={color} />
  </group>
);

// the bot's visor: a dark band with two glowing eyes, sits on the face
export const Visor: React.FC<{on?: number}> = ({on = 1}) => (
  <group position={[0, 0.01, 0.06]}>
    <RBox size={[0.27, 0.085, 0.16]} r={0.04} color="#20242e" look={{rough: 0.3, metal: 0.3}} />
    {([1, -1] as const).map((s) => (
      <Ball key={s} position={[0.055 * s, 0.0, 0.081]} scale={[0.022, 0.016, 0.004]} color="#7fe0ff" look={{basic: true}} shadow={false} />
    ))}
    <Glow position={[0, 0, 0.12]} size={0.22} color="#7fe0ff" k={0.35 * on} />
  </group>
);

export const Bot: React.FC<{position: V3; rotation?: number; pose?: HumanPose; handL?: React.ReactNode; handR?: React.ReactNode}> = ({position, rotation = 0, pose, handL, handR}) => (
  <Human o={BOT} position={position} rotation={rotation} pose={pose} noFace head={<Visor />} handL={handL} handR={handR} />
);

// ---------------------------------------------------------------- the anti-cheat: a white shield with one red eye

let shieldGeo: THREE.ExtrudeGeometry | null = null;
let rimGeo: THREE.ExtrudeGeometry | null = null;
const shieldShape = (s: number) => {
  const sh = new THREE.Shape();
  sh.moveTo(0, 0.62 * s);
  sh.bezierCurveTo(0.25 * s, 0.6 * s, 0.42 * s, 0.56 * s, 0.5 * s, 0.5 * s);
  sh.bezierCurveTo(0.52 * s, 0.05 * s, 0.4 * s, -0.36 * s, 0, -0.62 * s);
  sh.bezierCurveTo(-0.4 * s, -0.36 * s, -0.52 * s, 0.05 * s, -0.5 * s, 0.5 * s);
  sh.bezierCurveTo(-0.42 * s, 0.56 * s, -0.25 * s, 0.6 * s, 0, 0.62 * s);
  return sh;
};
const getShieldGeo = () => {
  if (!shieldGeo) {
    shieldGeo = new THREE.ExtrudeGeometry(shieldShape(1), {depth: 0.14, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 6, curveSegments: 32});
    shieldGeo.translate(0, 0, -0.07);
    shieldGeo.computeVertexNormals();
  }
  return shieldGeo;
};
const getRimGeo = () => {
  if (!rimGeo) {
    rimGeo = new THREE.ExtrudeGeometry(shieldShape(1.13), {depth: 0.1, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 4, curveSegments: 32});
    rimGeo.translate(0, 0, -0.12);
    rimGeo.computeVertexNormals();
  }
  return rimGeo;
};

export type ShieldMood = {lid?: number; wide?: number; look?: [number, number]; dead?: number; angry?: number; glow?: number};

// size = height in metres. Faces +z. dead: the eye goes grey with an X.
export const Shield: React.FC<{position?: V3; rotation?: V3; size?: number; mood?: ShieldMood; wings?: number; outline?: number}> = ({position, rotation, size = 0.6, mood = {}, wings = 0, outline = 0}) => {
  const dead = mood.dead ?? 0;
  const lid = dead > 0.5 ? 0 : mood.lid ?? 0;
  const wide = mood.wide ?? 0;
  const look = mood.look ?? [0, 0];
  const glow = (mood.glow ?? 1) * (1 - dead);
  const eyeR = 0.2 * (1 + 0.12 * wide);
  const iris = dead > 0.5 ? '#6a6a72' : '#e8302a';
  return (
    <group position={position} rotation={rotation} scale={size}>
      <mesh geometry={getShieldGeo()} material={mat(dead > 0.5 ? '#b8b6b2' : '#f6f4ee', {rough: 0.45, rim: '#ffffff', rimK: 0.25})} castShadow receiveShadow />
      <mesh geometry={getRimGeo()} material={mat('#3a7fd8', {rough: 0.4})} castShadow />
      {outline > 0 ? (
        <mesh geometry={getRimGeo()} scale={[1.12, 1.12, 1.4]} material={mat('#ff2a20', {basic: true, opacity: 0.85 * outline})} renderOrder={5} />
      ) : null}
      {/* the eye */}
      <group position={[0, 0.08, 0.1]}>
        <Ball scale={[eyeR, eyeR, eyeR * 0.55]} color="#ffffff" look={{rough: 0.2}} />
        <group position={[look[0] * 0.07, look[1] * 0.07, eyeR * 0.5]}>
          <Ball scale={[eyeR * 0.55, eyeR * 0.55, 0.03]} color={iris} look={dead > 0.5 ? {rough: 0.6} : {emissive: '#ff2a20', emissiveK: 0.6 * glow}} shadow={false} />
          <Ball position={[0, 0, 0.012]} scale={[eyeR * 0.24, eyeR * 0.24, 0.02]} color="#1a0a0a" shadow={false} />
          <Ball position={[eyeR * 0.15, eyeR * 0.17, 0.024]} scale={[eyeR * 0.09, eyeR * 0.09, 0.01]} color="#ffffff" look={{basic: true}} shadow={false} />
        </group>
        {/* upper lid: a cap of shield colour sliding down */}
        {lid > 0.01 ? (
          <group scale={[eyeR * 1.06, eyeR * 1.06, eyeR * 0.8]} rotation={[0, 0, (mood.angry ?? 0) * 0.25]}>
            <mesh rotation={[-Math.PI / 2 + Math.min(1, lid) * Math.PI * 0.98, 0, 0]} geometry={G.hemi(28)} material={mat('#f6f4ee', {rough: 0.45, side: THREE.DoubleSide})} />
          </group>
        ) : null}
        {dead > 0.5 ? (
          <group position={[0, 0, eyeR * 0.58]}>
            {[1, -1].map((s) => (
              <RBox key={s} rotation={[0, 0, s * 0.78]} size={[eyeR * 1.3, eyeR * 0.22, 0.02]} r={0.008} color="#2a2a30" shadow={false} />
            ))}
          </group>
        ) : null}
        <Glow position={[0, 0, 0.22]} size={0.9} color="#ff4a3a" k={0.4 * glow} />
      </group>
      {/* solar wings for the satellite */}
      {wings > 0
        ? ([1, -1] as const).map((s) => (
            <group key={s} position={[0.62 * s, 0.05, -0.05]} scale={wings}>
              <Cyl position={[0.12 * s, 0, 0]} rotation={[0, 0, Math.PI / 2]} rt={0.025} rb={0.025} h={0.24} seg={10} color="#c8c8d0" look={{metal: 0.7, rough: 0.3}} />
              <RBox position={[0.72 * s, 0, 0]} size={[0.95, 0.5, 0.025]} r={0.01} color="#2a4a9a" look={{rough: 0.25, metal: 0.4}} />
              {[0, 1, 2, 3].map((k) => (
                <Block key={k} position={[(0.33 + k * 0.26) * s, 0, 0.014]} size={[0.012, 0.5, 0.004]} color="#9ab8e8" shadow={false} />
              ))}
              <Block position={[0.72 * s, 0, 0.0145]} size={[0.95, 0.012, 0.004]} color="#9ab8e8" shadow={false} />
            </group>
          ))
        : null}
    </group>
  );
};

// the scanner beam: a soft red cone from `from` to `to`
export const Beam: React.FC<{from: V3; to: V3; r?: number; k?: number}> = ({from, to, r = 0.6, k = 1}) => {
  const {pos, quat, len} = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const d = b.clone().sub(a);
    const l = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.clone().normalize());
    return {pos: a.clone().add(d.multiplyScalar(0.5)), quat: q, len: l};
  }, [from[0], from[1], from[2], to[0], to[1], to[2]]);
  const m = useMemo(
    () =>
      new THREE.MeshBasicMaterial({color: '#ff3a2a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false}),
    [],
  );
  m.opacity = 0.22 * k;
  if (k <= 0.01) return null;
  return (
    <group position={pos.toArray() as V3} quaternion={quat}>
      <mesh material={m} renderOrder={8}>
        <coneGeometry args={[r, len, 32, 1, true]} />
      </mesh>
      <mesh material={m} renderOrder={8} scale={[0.45, 1, 0.45]}>
        <coneGeometry args={[r, len, 32, 1, true]} />
      </mesh>
      {/* the spot on the ground */}
      <mesh position={[0, -len / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m} renderOrder={8} scale={[r, r, r]} geometry={G.circle(32)} />
    </group>
  );
};

// ---------------------------------------------------------------- props

// a PC monitor with a canvas picture; screen faces +z, bottom on y=0
export const Monitor: React.FC<{position: V3; rotation?: number; k: string; draw: (g: CanvasRenderingContext2D, W: number, H: number) => void; w?: number; glow?: number}> = ({position, rotation = 0, k, draw, w = 0.56, glow = 1}) => {
  const h = w * 0.5625;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RBox position={[0, h / 2 + 0.13, -0.025]} size={[w + 0.05, h + 0.05, 0.04]} r={0.015} color="#1c1d24" look={{rough: 0.35}} />
      <Pic size={[w, h]} res={[512, 288]} k={k} draw={draw} position={[0, h / 2 + 0.13, -0.0035]} lit={false} glow={glow} />
      <Cyl position={[0, 0.07, -0.05]} rt={0.02} rb={0.025} h={0.14} seg={10} color="#2a2b33" />
      <RBox position={[0, 0.008, -0.04]} size={[0.22, 0.016, 0.14]} r={0.006} color="#2a2b33" />
    </group>
  );
};

export const Keyboard: React.FC<{position: V3; rotation?: number; rgb?: string}> = ({position, rotation = 0, rgb = '#ff4fd8'}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <RBox position={[0, 0.012, 0]} size={[0.42, 0.024, 0.14]} r={0.008} color="#1c1d24" />
    <RBox position={[0, 0.0255, 0]} size={[0.39, 0.004, 0.115]} r={0.002} color={rgb} look={{emissive: rgb, emissiveK: 0.5}} shadow={false} />
    <RBox position={[0.33, 0.014, 0.01]} size={[0.06, 0.028, 0.1]} r={0.02} color="#1c1d24" />
  </group>
);

export const Can: React.FC<{position?: V3; rotation?: V3; color?: string}> = ({position, rotation, color = '#2fd06a'}) => (
  <group position={position} rotation={rotation}>
    <Cyl position={[0, 0.06, 0]} rt={0.032} rb={0.032} h={0.12} seg={16} color="#1a1a1e" look={{metal: 0.5, rough: 0.3}} />
    <Cyl position={[0, 0.065, 0]} rt={0.0325} rb={0.0325} h={0.05} seg={16} color={color} shadow={false} />
    <Cyl position={[0, 0.123, 0]} rt={0.028} rb={0.032} h={0.006} seg={16} color="#c8c8cc" look={{metal: 0.8, rough: 0.3}} />
  </group>
);

export const Laptop: React.FC<{position: V3; rotation?: number; k: string; draw: (g: CanvasRenderingContext2D, W: number, H: number) => void; open?: number}> = ({position, rotation = 0, k, draw, open = 1}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <RBox position={[0, 0.01, 0]} size={[0.34, 0.02, 0.23]} r={0.008} color="#3a3c46" look={{metal: 0.4, rough: 0.4}} />
    <group position={[0, 0.02, -0.115]} rotation={[-(Math.PI / 2) * (1 - open) - 0.25 * open, 0, 0]}>
      <RBox position={[0, 0.11, -0.006]} size={[0.34, 0.22, 0.012]} r={0.006} color="#3a3c46" look={{metal: 0.4, rough: 0.4}} />
      <Pic size={[0.31, 0.19]} res={[512, 320]} k={k} draw={draw} position={[0, 0.112, 0.0005]} lit={false} />
    </group>
  </group>
);

// a gaming desk: the table, monitor, keyboard, a can; returns nothing about the player
export const GameDesk: React.FC<{position: V3; rotation?: number; k: string; draw: (g: CanvasRenderingContext2D, W: number, H: number) => void; rgb?: string; can?: string | null; glow?: number}> = ({
  position,
  rotation = 0,
  k,
  draw,
  rgb,
  can = '#2fd06a',
  glow,
}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Table position={[0, 0, 0]} size={[1.0, 0.6]} h={0.7} top="#2a2b33" />
    <Monitor position={[0, 0.7, -0.14]} k={k} draw={draw} glow={glow} />
    <Keyboard position={[-0.04, 0.7, 0.1]} rgb={rgb} />
    {can ? <Can position={[0.4, 0.7, -0.08]} color={can} /> : null}
  </group>
);

// game or ban, chosen by a key
export const screenDraw = (banned: boolean, t: number, seed: number) =>
  banned ? (g: CanvasRenderingContext2D, W: number, H: number) => drawBan(g, W, H) : (g: CanvasRenderingContext2D, W: number, H: number) => drawGame(g, W, H, t, seed);

export const Trophy: React.FC<{position?: V3; rotation?: V3; scale?: number}> = ({position, rotation, scale = 1}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <RBox position={[0, 0.04, 0]} size={[0.2, 0.08, 0.2]} r={0.015} color="#3a2a20" />
    <Cyl position={[0, 0.14, 0]} rt={0.025} rb={0.05} h={0.12} seg={20} color="#f2c23a" look={{metal: 0.9, rough: 0.25}} />
    <mesh position={[0, 0.26, 0]} rotation={[Math.PI, 0, 0]} scale={[0.13, 0.17, 0.13]} geometry={G.hemi(28)} material={mat('#f2c23a', {metal: 0.9, rough: 0.25, side: THREE.DoubleSide})} castShadow />
    {([1, -1] as const).map((s) => (
      <Ring key={s} position={[0.13 * s, 0.33, 0]} rotation={[0, 0, 0]} r={0.05} tube={0.012} arc={Math.PI} color="#f2c23a" look={{metal: 0.9, rough: 0.25}} />
    ))}
  </group>
);

// confetti from a point, t seconds after the burst
export const Confetti: React.FC<{center: V3; t: number; n?: number; seed?: number}> = ({center, t, n = 60, seed = 3}) => {
  if (t <= 0) return null;
  const cols = ['#ffd23f', '#ff8fd0', '#5aa0e6', '#7fd6c2', '#ff9f43', '#ffffff'];
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const a = rnd(seed + i * 1.3) * Math.PI * 2;
        const sp = 0.6 + rnd(seed + i * 2.7) * 1.6;
        const up = 2.2 + rnd(seed + i * 3.1) * 2.0;
        const tt = Math.min(t, 3);
        const y = center[1] + up * tt - 2.2 * tt * tt;
        const fall = Math.max(y, center[1] - 2.5 - rnd(i) * 0.5) + (y < center[1] - 2.5 ? 0 : 0);
        return (
          <Block
            key={i}
            position={[center[0] + Math.cos(a) * sp * tt, Math.max(fall, 0.02), center[2] + Math.sin(a) * sp * tt]}
            rotation={[t * 7 + i, t * 5 + i * 2, 0]}
            size={[0.05, 0.03, 0.004]}
            color={cols[i % cols.length]}
            shadow={false}
          />
        );
      })}
    </>
  );
};

// a puff of smoke (pros vanish)
export const Poof: React.FC<{position: V3; t: number}> = ({position, t}) => {
  if (t <= 0 || t > 0.9) return null;
  const k = t / 0.9;
  return (
    <>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = (i / 7) * Math.PI * 2;
        const r = 0.12 + 0.35 * Math.sqrt(k);
        return (
          <Ball
            key={i}
            position={[position[0] + Math.cos(a) * r, position[1] + Math.sin(a * 2) * 0.1 + k * 0.25, position[2] + Math.sin(a) * r * 0.6]}
            scale={0.16 * (1 - k * 0.6)}
            color="#f2f0ea"
            look={{opacity: 1 - k, rough: 1}}
            shadow={false}
          />
        );
      })}
    </>
  );
};

// a red wallhack silhouette, visible through anything
export const Ghost: React.FC<{position: V3; rotation?: number; k?: number; sit?: boolean; scale?: number}> = ({position, rotation = 0, k = 1, sit, scale = 1}) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({color: '#ff2a20', transparent: true, depthTest: false, depthWrite: false, toneMapped: false}), []);
  m.opacity = 0.85 * k;
  if (k <= 0.01) return null;
  const y = sit ? -0.2 : 0;
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 1.33 + y, 0]} scale={0.16} geometry={G.sphere(16)} material={m} renderOrder={20} />
      <mesh position={[0, 0.93 + y, 0]} geometry={G.capsule(0.17, 0.32, 10)} material={m} renderOrder={20} />
      {sit ? null : (
        <>
          <mesh position={[0.09, 0.35, 0]} geometry={G.capsule(0.07, 0.45, 8)} material={m} renderOrder={20} />
          <mesh position={[-0.09, 0.35, 0]} geometry={G.capsule(0.07, 0.45, 8)} material={m} renderOrder={20} />
        </>
      )}
    </group>
  );
};

// ---------------------------------------------------------------- the computer club

export const CLUB_ROWS = [0, -1.6, -3.2];
export const CLUB_COLS = [-2.4, -1.2, 0, 1.2, 2.4];

export const ClubRoom: React.FC<{neon?: number}> = ({neon = 1}) => (
  <group>
    <Block position={[0, -0.05, -1.4]} size={[9, 0.1, 10]} color="#2c2638" />
    <Block position={[0, 1.8, -5.4]} size={[9, 3.6, 0.1]} color="#3a3150" look={{rough: 0.95}} />
    <Block position={[-4.4, 1.8, -1.4]} size={[0.1, 3.6, 10]} color="#342c48" look={{rough: 0.95}} />
    <Block position={[4.4, 1.8, -1.4]} size={[0.1, 3.6, 10]} color="#342c48" look={{rough: 0.95}} />
    <Block position={[0, 3.62, -1.4]} size={[9, 0.1, 10]} color="#221d2e" />
    {/* neon strips along the walls */}
    {[-4.33, 4.33].map((x) => (
      <RBox key={x} position={[x, 2.9, -1.4]} size={[0.04, 0.05, 9]} r={0.02} color="#ff4fd8" look={{emissive: '#ff4fd8', emissiveK: 1.2 * neon}} shadow={false} />
    ))}
    <RBox position={[0, 2.9, -5.33]} size={[8.6, 0.05, 0.04]} r={0.02} color="#4fd8ff" look={{emissive: '#4fd8ff', emissiveK: 1.2 * neon}} shadow={false} />
    <Pic position={[0, 2.25, -5.34]} size={[3.2, 0.8]} res={[800, 200]} k="club-sign" draw={(g, W, H) => {
      g.fillStyle = '#1e1a2a';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#4fd8ff';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = `600 ${Math.round(H * 0.6)}px 'Oswald', sans-serif`;
      g.fillText('КОМПЬЮТЕРНЫЙ КЛУБ', W / 2, H * 0.54);
    }} lit={false} glow={1.05} />
    {/* ceiling lamps */}
    {[-2, 0, 2].map((x) =>
      [-0.5, -2.8].map((z) => (
        <group key={`${x}${z}`} position={[x, 3.5, z]}>
          <Cyl rt={0.18} rb={0.26} h={0.14} seg={20} color="#2a2a30" />
          <Glow position={[0, -0.12, 0]} size={0.8} color="#ffe2b0" k={0.35} />
        </group>
      )),
    )}
  </group>
);
