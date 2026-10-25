import React from 'react';
import {Person, PersonPose} from '../scene/Characters';
import {Box, Cyl} from '../scene/parts';
import {V3} from './cues';

// The people of the video. All of them are the shared blocky Person with their own clothes and extras.
// Person: feet at the origin, faces +z, head pivot at y 1.64 (head box 0.3, face at z 0.152).

export const HERO = {shirt: '#2f6fd6', pants: '#3b4a66', hair: '#8a6a45', skin: '#efd2b3'};
const HOOD = '#2a62c0';
const BEARD = '#6f5236';

type Who = {position: V3; rotation?: number; pose?: PersonPose; rightHand?: React.ReactNode; leftHand?: React.ReactNode; tears?: number};

// falling tear drops under both eyes; t is a running time, strength 0..1
export const Tears: React.FC<{t: number; strength?: number}> = ({t, strength = 1}) => {
  if (strength <= 0) return null;
  const drops = [];
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const ph = (t * 1.6 + k / 3 + (side > 0 ? 0.17 : 0)) % 1;
      drops.push(
        <Box
          key={`${side}${k}`}
          size={[0.022, 0.035, 0.012]}
          position={[side * 0.085, 0.18 - ph * 0.16, 0.162 + ph * 0.02]}
          color="#9fd8ff"
          emissive="#5fb8ff"
          emissiveIntensity={0.4}
          opacity={strength * (1 - ph * 0.6)}
          shadow={false}
        />,
      );
    }
    drops.push(
      <Box key={`streak${side}`} size={[0.018, 0.12, 0.004]} position={[side * 0.085, 0.13, 0.154]} color="#bfe6ff" opacity={0.6 * strength} shadow={false} />,
    );
  }
  return <>{drops}</>;
};

// short beard, moustache and the hood of the blue hoodie
const HeroHead: React.FC<{mouth: number}> = ({mouth}) => (
  <>
    <Box size={[0.3, 0.055, 0.03]} position={[0, 0.03 - 0.012 * mouth, 0.14]} color={BEARD} shadow={false} />
    <Box size={[0.035, 0.17, 0.26]} position={[-0.152, 0.11, 0.005]} color={BEARD} shadow={false} />
    <Box size={[0.035, 0.17, 0.26]} position={[0.152, 0.11, 0.005]} color={BEARD} shadow={false} />
    <Box size={[0.11, 0.022, 0.012]} position={[0, 0.112, 0.156]} color={BEARD} shadow={false} />
  </>
);
const HeroBody: React.FC = () => (
  <>
    <Box size={[0.42, 0.13, 0.13]} position={[0, 1.6, -0.15]} color={HOOD} />
    <Box size={[0.3, 0.13, 0.02]} position={[0, 1.02, 0.155]} color={HOOD} shadow={false} />
    <Box size={[0.015, 0.16, 0.012]} position={[-0.05, 1.45, 0.156]} color="#f0f0f0" shadow={false} />
    <Box size={[0.015, 0.16, 0.012]} position={[0.05, 1.45, 0.156]} color="#f0f0f0" shadow={false} />
  </>
);

export const Hero: React.FC<Who> = ({position, rotation = 0, pose = {}, rightHand, leftHand}) => (
  <Person
    position={position}
    rotation={rotation}
    {...HERO}
    pose={pose}
    rightHand={rightHand}
    leftHand={leftHand}
    headExtra={<HeroHead mouth={pose.mouth ?? 0} />}
    bodyExtra={<HeroBody />}
  />
);

export const Courier: React.FC<Who & {t?: number}> = ({position, rotation = 0, pose = {}, rightHand, leftHand, tears = 0, t = 0}) => (
  <Person
    position={position}
    rotation={rotation}
    shirt="#f2c230"
    pants="#3a3d44"
    hair="#2e2620"
    skin="#e2b892"
    pose={pose}
    rightHand={rightHand}
    leftHand={leftHand}
    headExtra={
      <>
        <Box size={[0.33, 0.07, 0.33]} position={[0, 0.375, 0]} color="#f2c230" />
        <Box size={[0.3, 0.02, 0.15]} position={[0, 0.35, 0.22]} color="#e0ad1c" />
        <Tears t={t} strength={tears} />
      </>
    }
    bodyExtra={<Box size={[0.46, 0.46, 0.32]} position={[0, 1.28, -0.33]} color="#e39a18" />}
  />
);

// camera on the right shoulder
export const ShoulderCam: React.FC = () => (
  <group position={[0.24, 1.72, 0.05]}>
    <Box size={[0.16, 0.2, 0.5]} color="#1b1c20" />
    <Cyl rTop={0.07} rBottom={0.07} height={0.14} segments={10} position={[0, 0.02, 0.31]} rotation={[Math.PI / 2, 0, 0]} color="#101114" />
    <Box size={[0.04, 0.04, 0.04]} position={[0, 0.12, 0.2]} color="#ff2a2a" emissive="#ff2020" emissiveIntensity={1.5} shadow={false} />
  </group>
);

export const Operator: React.FC<Who & {t?: number}> = ({position, rotation = 0, pose = {}, tears = 0, t = 0}) => (
  <Person
    position={position}
    rotation={rotation}
    shirt="#1f2024"
    pants="#2b2d33"
    hair="#3a2a1e"
    skin="#d9a982"
    pose={{armR: [2.6, -0.3], elbowR: 1.9, armL: [0.9, 0.2], elbowL: 0.9, ...pose}}
    headExtra={<Tears t={t} strength={tears} />}
    bodyExtra={<ShoulderCam />}
  />
);

export const Photographer: React.FC<Who & {cameraUp?: number; t?: number}> = ({position, rotation = 0, pose = {}, cameraUp = 1, rightHand, leftHand}) => (
  <Person
    position={position}
    rotation={rotation}
    shirt="#c94f3b"
    pants="#2d3140"
    hair="#22201d"
    skin="#c58c62"
    pose={pose}
    rightHand={rightHand}
    leftHand={leftHand}
    headExtra={
      <>
        {/* cap worn backwards */}
        <Box size={[0.33, 0.07, 0.33]} position={[0, 0.375, 0]} color="#2c2f38" />
        <Box size={[0.26, 0.02, 0.13]} position={[0, 0.35, -0.21]} color="#2c2f38" />
        {cameraUp > 0 ? (
          <group position={[0, 0.2, 0.24]}>
            <Box size={[0.2, 0.13, 0.1]} color="#17181b" />
            <Cyl rTop={0.05} rBottom={0.055} height={0.12} segments={10} position={[0, -0.01, 0.1]} rotation={[Math.PI / 2, 0, 0]} color="#0e0f11" />
          </group>
        ) : null}
      </>
    }
  />
);

export const Editor: React.FC<Who & {t?: number}> = ({position, rotation = 0, pose = {}, tears = 0, t = 0, rightHand}) => (
  <Person
    position={position}
    rotation={rotation}
    shirt="#6b6f78"
    pants="#2a2c33"
    hair="#4a3424"
    skin="#ead0b6"
    pose={pose}
    rightHand={rightHand}
    headExtra={
      <>
        <Box size={[0.36, 0.04, 0.07]} position={[0, 0.4, 0]} color="#1d1f24" />
        <Box size={[0.025, 0.16, 0.07]} position={[-0.175, 0.31, 0]} color="#1d1f24" />
        <Box size={[0.025, 0.16, 0.07]} position={[0.175, 0.31, 0]} color="#1d1f24" />
        <Box size={[0.06, 0.13, 0.13]} position={[-0.18, 0.19, 0]} color="#1d1f24" />
        <Box size={[0.06, 0.13, 0.13]} position={[0.18, 0.19, 0]} color="#1d1f24" />
        {/* dark circles under the eyes */}
        <Box size={[0.06, 0.02, 0.01]} position={[-0.07, 0.185, 0.153]} color="#b89b8c" shadow={false} />
        <Box size={[0.06, 0.02, 0.01]} position={[0.07, 0.185, 0.153]} color="#b89b8c" shadow={false} />
        <Tears t={t} strength={tears} />
      </>
    }
  />
);

// plain extra people (two in the circle, the queue on the beach)
export const Extra: React.FC<Who & {shirt: string; pants: string; hair?: string; skin?: string; headExtra?: React.ReactNode; rightHand?: React.ReactNode}> = ({
  position,
  rotation = 0,
  pose = {},
  shirt,
  pants,
  hair,
  skin,
  headExtra,
  rightHand,
}) => <Person position={position} rotation={rotation} shirt={shirt} pants={pants} hair={hair} skin={skin} pose={pose} headExtra={headExtra} rightHand={rightHand} />;

// a key ring with two keys and a fob, hanging from a hand
export const Keys: React.FC = () => (
  <group position={[0, -0.05, 0.04]}>
    <mesh rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[0.035, 0.006, 6, 12]} />
      <meshStandardMaterial color="#c9ccd2" metalness={0.6} roughness={0.3} flatShading />
    </mesh>
    <Box size={[0.012, 0.08, 0.025]} position={[0, -0.07, 0.01]} color="#d7d9de" />
    <Box size={[0.012, 0.07, 0.022]} position={[0, -0.065, -0.02]} color="#b8a46a" />
    <Box size={[0.03, 0.06, 0.04]} position={[0, -0.075, 0.045]} color="#141518" />
  </group>
);

// a shovel held at the grip, blade down
export const Shovel: React.FC<{tilt?: number}> = ({tilt = 0}) => (
  <group rotation={[tilt, 0, 0]}>
    <Box size={[0.04, 1.15, 0.04]} position={[0, -0.45, 0]} color="#9b6b3e" />
    <Box size={[0.24, 0.3, 0.03]} position={[0, -1.12, 0]} color="#9aa2ad" />
  </group>
);

export const Cup: React.FC<{position?: V3; rotation?: V3}> = ({position, rotation}) => (
  <group position={position} rotation={rotation}>
    <Cyl rTop={0.045} rBottom={0.035} height={0.13} segments={8} position={[0, 0.065, 0]} color="#f4f1ea" />
    <Cyl rTop={0.048} rBottom={0.048} height={0.018} segments={8} position={[0, 0.138, 0]} color="#6b4630" />
    <Cyl rTop={0.0455} rBottom={0.042} height={0.04} segments={8} position={[0, 0.07, 0]} color="#a87a4f" scale={[1.02, 1, 1.02]} />
  </group>
);
