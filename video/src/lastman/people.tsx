import React from 'react';
import * as THREE from 'three';
import {Box, Cyl} from '../scene/parts';
import {Person, PersonPose} from '../scene/Characters';
import {HERO_COL} from './tex';
import {V3} from './cues';

// Everybody in the video is the shared blocky Person (feet at origin, faces +z, ~1.9 m, eyes at ~1.85 m).
export const SHIRTS = ['#e85d5d', '#4a7fd0', '#f2c14e', '#6fbf73', '#b36ad1', '#ef8f4a', '#4fb6c2', '#d9d9de', '#c85b8a', '#f08aa8', '#2f8a7a'];
export const PANTS = ['#2c3550', '#3a3a40', '#5a4a3a', '#24364a', '#4a4a52', '#6a3a4a'];
export const HAIR = ['#2a1d15', '#4a3324', '#7b5434', '#c9a46a', '#1a1a1a', '#a5452c', '#e0c890'];
export const SKINS = ['#efd2b3', '#e2b892', '#c58c62', '#f3dcc4', '#9c6a45', '#e8c2a0'];

type Who = {position: V3; rotation?: number; pose?: PersonPose; rightHand?: React.ReactNode; leftHand?: React.ReactNode; scale?: number};

export const walk = (t: number, amount = 1, freq = 1.7): PersonPose => {
  const ph = t * freq * Math.PI * 2;
  return {legL: Math.sin(ph) * 0.45 * amount, legR: -Math.sin(ph) * 0.45 * amount, armL: [-Math.sin(ph) * 0.35 * amount, 0.06], armR: [Math.sin(ph) * 0.35 * amount, -0.06]};
};
export const SIT: PersonPose = {legL: 1.45, legR: 1.45};

// a skirt over the hips: 2-4 cm proud of the torso and legs everywhere
const Skirt: React.FC<{color: string}> = ({color}) => <Box size={[0.58, 0.36, 0.34]} position={[0, 0.76, 0]} color={color} />;

export const Woman: React.FC<Who & {i: number; skirt?: boolean; headExtra?: React.ReactNode; bodyExtra?: React.ReactNode; shirt?: string}> = ({i, skirt, headExtra, bodyExtra, shirt, ...p}) => {
  const sk = skirt ?? i % 2 === 0;
  return (
    <Person
      {...p}
      shirt={shirt ?? SHIRTS[i % SHIRTS.length]}
      pants={sk ? SKINS[(i * 5) % SKINS.length] : PANTS[(i * 3) % PANTS.length]}
      hair={HAIR[(i * 5) % HAIR.length]}
      skin={SKINS[(i * 7 + 1) % SKINS.length]}
      longHair
      headExtra={headExtra}
      bodyExtra={
        <>
          {sk ? <Skirt color={PANTS[(i * 3 + 1) % PANTS.length]} /> : null}
          {bodyExtra}
        </>
      }
    />
  );
};

const Shades: React.FC = () => (
  <>
    <Box size={[0.26, 0.05, 0.02]} position={[0, 0.21, 0.165]} color="#0d0d10" shadow={false} />
    <Box size={[0.3, 0.015, 0.015]} position={[0, 0.235, 0.166]} color="#0d0d10" shadow={false} />
  </>
);

// government agents: black suits, white shirt, dark glasses
export const Agent: React.FC<Who & {i: number}> = ({i, ...p}) => (
  <Person
    {...p}
    shirt="#17181c"
    pants="#17181c"
    hair={HAIR[(i * 3) % 5]}
    skin={SKINS[(i * 2) % SKINS.length]}
    longHair={i % 2 === 0}
    headExtra={<Shades />}
    bodyExtra={
      <>
        <Box size={[0.14, 0.24, 0.02]} position={[0, 1.44, 0.155]} color="#f0f0f0" shadow={false} />
        <Box size={[0.04, 0.2, 0.025]} position={[0, 1.4, 0.16]} color="#0d0d10" shadow={false} />
      </>
    }
  />
);

// scientists: white coat down to the knees, glasses
export const Scientist: React.FC<Who & {i: number}> = ({i, ...p}) => (
  <Person
    {...p}
    shirt="#f2f4f6"
    pants={PANTS[i % PANTS.length]}
    hair={HAIR[(i * 2 + 1) % HAIR.length]}
    skin={SKINS[(i * 3) % SKINS.length]}
    longHair={i !== 1}
    headExtra={
      <>
        <Box size={[0.08, 0.06, 0.015]} position={[-0.07, 0.21, 0.162]} color="#3a6a9a" opacity={0.6} shadow={false} />
        <Box size={[0.08, 0.06, 0.015]} position={[0.07, 0.21, 0.162]} color="#3a6a9a" opacity={0.6} shadow={false} />
        <Box size={[0.28, 0.012, 0.012]} position={[0, 0.24, 0.165]} color="#222" shadow={false} />
      </>
    }
    bodyExtra={<Box size={[0.58, 0.42, 0.34]} position={[0, 0.7, 0]} color="#f2f4f6" />}
  />
);

export const Cashier: React.FC<Who> = (p) => (
  <Person
    {...p}
    shirt="#d63a3a"
    pants="#2a2a30"
    hair="#a5452c"
    skin="#efd2b3"
    longHair
    headExtra={<Box size={[0.33, 0.06, 0.33]} position={[0, 0.39, 0]} color="#d63a3a" />}
    bodyExtra={<Box size={[0.12, 0.05, 0.02]} position={[0.14, 1.42, 0.155]} color="#ffffff" shadow={false} />}
  />
);

// grandma: grey hair, red headscarf, purple cardigan
export const Granny: React.FC<Who & {scarf?: string; cardigan?: string}> = ({scarf = '#d8483a', cardigan = '#7a4a8a', ...p}) => (
  <Person
    {...p}
    shirt={cardigan}
    pants="#4a3a5a"
    hair="#c8c8c8"
    longHair
    skin="#ecc8a8"
    headExtra={
      <>
        <Box size={[0.34, 0.14, 0.34]} position={[0, 0.355, -0.01]} color={scarf} />
        <Box size={[0.34, 0.2, 0.06]} position={[0, 0.22, -0.16]} color={scarf} />
      </>
    }
    bodyExtra={<Box size={[0.58, 0.38, 0.34]} position={[0, 0.74, 0]} color="#5a4a6a" />}
  />
);

// the hero, seen from outside: stubble, grey hoodie, jeans
export const HeroBeard: React.FC<{mouth?: number}> = ({mouth = 0}) => (
  <>
    <Box size={[0.31, 0.06, 0.03]} position={[0, 0.035 - 0.012 * mouth, 0.143]} color={HERO_COL.beard} shadow={false} />
    <Box size={[0.03, 0.12, 0.2]} position={[-0.153, 0.1, 0.04]} color={HERO_COL.beard} shadow={false} />
    <Box size={[0.03, 0.12, 0.2]} position={[0.153, 0.1, 0.04]} color={HERO_COL.beard} shadow={false} />
  </>
);
export const Hero: React.FC<Who & {extra?: React.ReactNode}> = ({extra, ...p}) => (
  <Person
    {...p}
    shirt={HERO_COL.hoodie}
    pants={HERO_COL.jeans}
    hair={HERO_COL.hair}
    skin={HERO_COL.skin}
    headExtra={
      <>
        <HeroBeard mouth={p.pose?.mouth ?? 0} />
        {extra}
      </>
    }
    bodyExtra={<Box size={[0.42, 0.12, 0.12]} position={[0, 1.6, -0.15]} color="#6a727e" />}
  />
);

// clone No 1: almost the hero, but one eye too big, eyebrow on the forehead, a head too large
export const Clone: React.FC<Who> = (p) => (
  <group position={p.position} rotation={[0, p.rotation ?? 0, 0]}>
    <Person
      position={[0, 0, 0]}
      shirt="#e8eef2"
      pants="#e8eef2"
      hair={HERO_COL.hair}
      skin="#f0d6bc"
      child
      pose={p.pose}
      headExtra={
        <>
          <HeroBeard />
          <Box size={[0.085, 0.085, 0.014]} position={[0.07, 0.205, 0.155]} color="#2a2622" shadow={false} />
          <Box size={[0.03, 0.03, 0.016]} position={[0.08, 0.215, 0.157]} color="#ffffff" shadow={false} />
          <Box size={[0.08, 0.02, 0.014]} position={[-0.07, 0.31, 0.155]} color={HERO_COL.hair} shadow={false} />
        </>
      }
    />
  </group>
);

// ---------------------------------------------------------------- the hot dog costume
const SAUSAGE = '#c4543a';
const BUN = '#e2b06a';
const MUSTARD = '#f5d132';
export const HotDog: React.FC<{position: V3; rotation?: number; walkT?: number; walking?: number; sit?: boolean; sad?: number}> = ({
  position,
  rotation = 0,
  walkT = 0,
  walking = 0,
  sit = false,
  sad = 0,
}) => {
  const ph = walkT * 1.9 * Math.PI * 2;
  const sw = Math.sin(ph) * 0.4 * walking;
  const bob = Math.abs(Math.sin(ph)) * 0.04 * walking;
  const waddle = Math.sin(ph) * 0.06 * walking;
  const legs = (side: number, pitch: number) => (
    <group position={[side * 0.13, 0.7, 0]} rotation={[-pitch, 0, 0]}>
      <Box size={[0.19, 0.66, 0.21]} position={[0, -0.33, 0]} color={HERO_COL.jeans} />
      <Box size={[0.21, 0.08, 0.3]} position={[0, -0.66, 0.05]} color="#efefef" />
    </group>
  );
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {sit ? (
        <>
          {legs(-1, 1.45)}
          {legs(1, 1.45)}
        </>
      ) : (
        <>
          {legs(-1, sw)}
          {legs(1, -sw)}
        </>
      )}
      <group position={[0, (sit ? 0.62 : 0.62) + bob, 0]} rotation={[sad * 0.18, 0, waddle]}>
        {/* bun halves left and right, sausage in the middle */}
        <mesh position={[-0.27, 0.78, -0.02]} castShadow receiveShadow>
          <capsuleGeometry args={[0.2, 1.1, 4, 10]} />
          <meshStandardMaterial color={BUN} flatShading roughness={0.9} />
        </mesh>
        <mesh position={[0.27, 0.78, -0.02]} castShadow receiveShadow>
          <capsuleGeometry args={[0.2, 1.1, 4, 10]} />
          <meshStandardMaterial color={BUN} flatShading roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.9, 0.04]} castShadow receiveShadow>
          <capsuleGeometry args={[0.2, 1.3, 4, 10]} />
          <meshStandardMaterial color={SAUSAGE} flatShading roughness={0.7} />
        </mesh>
        {/* mustard zigzag, proud of the sausage */}
        {[0, 1, 2, 3, 4].map((k) => (
          <Box key={k} size={[0.3, 0.035, 0.03]} position={[0, 0.3 + k * 0.17, 0.235]} rotation={[0, 0, k % 2 ? 0.55 : -0.55]} color={MUSTARD} shadow={false} />
        ))}
        {/* the face in the hole */}
        <group position={[0, 1.38, 0.235]}>
          <Box size={[0.2, 0.22, 0.04]} position={[0, 0, 0.02]} color={HERO_COL.skin} shadow={false} />
          <Box size={[0.035, 0.025 + 0.01 * (1 - sad), 0.01]} position={[-0.045, 0.03 - 0.008 * sad, 0.045]} color="#2a2622" shadow={false} />
          <Box size={[0.035, 0.025 + 0.01 * (1 - sad), 0.01]} position={[0.045, 0.03 - 0.008 * sad, 0.045]} color="#2a2622" shadow={false} />
          <Box size={[0.2, 0.05, 0.012]} position={[0, -0.085, 0.045]} color={HERO_COL.beard} shadow={false} />
          <Box size={[0.07, 0.012, 0.01]} position={[0, -0.04 - 0.01 * sad, 0.05]} rotation={[0, 0, 0]} color="#7a4a3a" shadow={false} />
        </group>
        {/* arms: short sausage-coloured sleeves out of the buns */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.44, 0.75, 0]} rotation={[sit ? -0.6 : Math.sin(ph) * -0.4 * walking * s, 0, s * (0.35 - 0.25 * sad)]}>
            <Box size={[0.12, 0.34, 0.13]} position={[0, -0.17, 0]} color={BUN} />
            <Box size={[0.1, 0.1, 0.11]} position={[0, -0.38, 0]} color={HERO_COL.skin} />
          </group>
        ))}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- drone
export const Drone: React.FC<{position: V3; rotation?: V3; t: number; light?: boolean}> = ({position, rotation, t, light = true}) => (
  <group position={position} rotation={rotation}>
    <Box size={[0.28, 0.1, 0.28]} color="#26282e" />
    <Box size={[0.12, 0.08, 0.06]} position={[0, -0.06, 0.12]} color="#111" />
    {[
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].map(([a, b], i) => (
      <group key={i}>
        <Box size={[0.3, 0.035, 0.035]} position={[a * 0.2, 0.0, b * 0.2]} rotation={[0, a * b * Math.PI / 4, 0]} color="#3a3d44" />
        <Cyl rTop={0.14} rBottom={0.14} height={0.006} segments={12} position={[a * 0.32, 0.06, b * 0.32]} color="#c8ccd4" opacity={0.35} shadow={false} />
        <Box size={[0.26, 0.008, 0.03]} position={[a * 0.32, 0.065, b * 0.32]} rotation={[0, t * 40 + i, 0]} color="#1a1a1a" shadow={false} />
      </group>
    ))}
    {light ? (
      <>
        <Box size={[0.05, 0.05, 0.05]} position={[-0.1, 0.07, -0.12]} color="#ff2a2a" emissive="#ff2020" emissiveIntensity={(Math.sin(t * 12) > 0 ? 2 : 0.2)} shadow={false} />
        <Box size={[0.05, 0.05, 0.05]} position={[0.1, 0.07, -0.12]} color="#2a6aff" emissive="#2050ff" emissiveIntensity={(Math.sin(t * 12) > 0 ? 0.2 : 2)} shadow={false} />
      </>
    ) : null}
  </group>
);

// ---------------------------------------------------------------- the POV hand (real size, points along -y, palm +z)
export type HandShape = 'point' | 'flat' | 'grip' | 'relaxed';
export const Hand: React.FC<{position?: V3; rotation?: V3; shape?: HandShape; side?: 1 | -1; sleeve?: string}> = ({position, rotation, shape = 'relaxed', side = 1, sleeve = HERO_COL.hoodie}) => {
  const xs = [-0.03, -0.01, 0.01, 0.03].map((x) => x * side);
  const lens = [0.065, 0.08, 0.085, 0.078];
  const curls = {point: [1.4, 1.4, 1.3, 0.05], flat: [0.02, 0.02, 0.02, 0.05], grip: [1.0, 1.1, 1.15, 1.2], relaxed: [0.25, 0.3, 0.35, 0.4]}[shape];
  const skin = HERO_COL.skin;
  return (
    <group position={position} rotation={rotation}>
      <Box size={[0.105, 0.34, 0.095]} position={[0, 0.22, 0]} color={sleeve} />
      <Box size={[0.07, 0.06, 0.055]} position={[0, 0.03, 0]} color={skin} />
      <Box size={[0.085, 0.095, 0.028]} position={[0, -0.045, 0]} color={skin} />
      {xs.map((x, i) => (
        <group key={i} position={[x, -0.09, 0]} rotation={[curls[i], 0, (i - 1.5) * -0.04 * side]}>
          <Box size={[0.019, lens[i] * 0.55, 0.021]} position={[0, -lens[i] * 0.27, 0]} color={skin} />
          <group position={[0, -lens[i] * 0.55, 0]} rotation={[curls[i] * 0.9, 0, 0]}>
            <Box size={[0.018, lens[i] * 0.45, 0.02]} position={[0, -lens[i] * 0.22, 0]} color={skin} />
          </group>
        </group>
      ))}
      {/* thumb */}
      <group position={[0.045 * side, -0.03, 0.01]} rotation={[0.3, 0, side * 0.7]}>
        <Box size={[0.022, 0.07, 0.024]} position={[0, -0.035, 0]} color={skin} />
      </group>
    </group>
  );
};

// a phone with a screen texture (12 x 24 cm body)
export const Phone: React.FC<{position?: V3; rotation?: V3; screen: THREE.Texture; glow?: number}> = ({position, rotation, screen, glow = 1}) => (
  <group position={position} rotation={rotation}>
    <Box size={[0.078, 0.158, 0.009]} color="#111216" />
    <mesh position={[0, 0, 0.0068]}>
      <planeGeometry args={[0.07, 0.148]} />
      <meshBasicMaterial map={screen} toneMapped={false} color={new THREE.Color(glow, glow, glow)} />
    </mesh>
  </group>
);
