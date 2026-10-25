import React from 'react';
import {Box, Cone, Cyl, Ico} from './parts';

type V3 = [number, number, number];

export type PersonPose = {
  // Shoulder rotations [pitch, roll] in radians. Positive pitch lifts the arm forward.
  armL?: [number, number];
  armR?: [number, number];
  // Elbow bend (positive bends the forearm forward).
  elbowL?: number;
  elbowR?: number;
  // Head [pitch, yaw]. Negative pitch looks up.
  head?: [number, number];
  // Chest depth multiplier: below 1 when the air leaves the lungs.
  chest?: number;
  // Mouth opening 0..1.
  mouth?: number;
  // Eye height multiplier: above 1 = wide eyes.
  eyes?: number;
  // Hip pitch per leg (positive swings the leg forward).
  legL?: number;
  legR?: number;
};

type PersonProps = {
  position: V3;
  rotation?: number;
  scale?: number;
  shirt: string;
  pants: string;
  skin?: string;
  hair?: string;
  longHair?: boolean;
  child?: boolean;
  lying?: boolean;
  pose?: PersonPose;
  rightHand?: React.ReactNode;
  leftHand?: React.ReactNode;
  // extra parts that move with the head (beard, cap, headphones) or the torso (hood, bag)
  headExtra?: React.ReactNode;
  bodyExtra?: React.ReactNode;
};

// Blocky low-poly person, ~1.9 m tall, built like the characters on the references.
export const Person: React.FC<PersonProps> = ({
  position,
  rotation = 0,
  scale = 1,
  shirt,
  pants,
  skin = '#efd2b3',
  hair = '#7b5434',
  longHair = false,
  child = false,
  lying = false,
  pose = {},
  rightHand,
  leftHand,
  headExtra,
  bodyExtra,
}) => {
  const {
    armL = [0, 0.06],
    armR = [0, -0.06],
    elbowL = 0,
    elbowR = 0,
    head = [0, 0],
    chest = 1,
    mouth = 0,
    eyes = 1,
    legL = 0,
    legR = 0,
  } = pose;
  const headScale = child ? 1.28 : 1;
  const dark = '#2a2622';

  const arm = (side: 1 | -1, rot: [number, number], elbow: number, hand?: React.ReactNode) => (
    <group position={[0.33 * side, 1.52, 0]} rotation={[-rot[0], 0, rot[1]]}>
      <Box size={[0.15, 0.27, 0.16]} position={[0, -0.12, 0]} color={shirt} />
      <Box size={[0.12, 0.3, 0.13]} position={[0, -0.36, 0]} color={skin} />
      <group position={[0, -0.5, 0]} rotation={[-elbow, 0, 0]}>
        <Box size={[0.115, 0.3, 0.125]} position={[0, -0.14, 0]} color={skin} />
        <Box size={[0.12, 0.1, 0.13]} position={[0, -0.33, 0]} color={skin} />
        <group position={[0, -0.36, 0.02]}>{hand}</group>
      </group>
    </group>
  );

  return (
    <group
      position={position}
      rotation={lying ? [-Math.PI / 2 + 0.25, rotation, 0] : [0, rotation, 0]}
      scale={scale}
    >
      {/* legs, pivoting at the hips */}
      {([[-0.12, legL], [0.12, legR]] as const).map(([lx, pitch]) => (
        <group key={lx} position={[lx, 0.9, 0]} rotation={[-pitch, 0, 0]}>
          <Box size={[0.2, 0.86, 0.22]} position={[0, -0.43, 0]} color={pants} />
          <Box size={[0.22, 0.08, 0.3]} position={[0, -0.86, 0.05]} color="#efefef" />
        </group>
      ))}
      {/* torso: the chest scale shows the lungs emptying */}
      <group position={[0, 1.22, 0]} scale={[1, 1, chest]}>
        <Box size={[0.54, 0.7, 0.3]} color={shirt} />
      </group>
      <Box size={[0.12, 0.08, 0.12]} position={[0, 1.6, 0]} color={skin} />
      {/* head */}
      <group position={[0, 1.64, 0]} rotation={[head[0], head[1], 0]} scale={headScale}>
        <Box size={[0.3, 0.34, 0.3]} position={[0, 0.17, 0]} color={skin} />
        <Box size={[0.32, 0.08, 0.32]} position={[0, 0.36, -0.005]} color={hair} />
        <Box size={[0.32, 0.22, 0.08]} position={[0, 0.25, -0.13]} color={hair} />
        {longHair ? <Box size={[0.33, 0.34, 0.1]} position={[0, 0.08, -0.13]} color={hair} /> : null}
        {/* face */}
        <Box size={[0.05, 0.035 * eyes, 0.012]} position={[-0.07, 0.21, 0.152]} color={dark} shadow={false} />
        <Box size={[0.05, 0.035 * eyes, 0.012]} position={[0.07, 0.21, 0.152]} color={dark} shadow={false} />
        <Box size={[0.07, 0.018, 0.012]} position={[-0.07, 0.255 + 0.01 * (eyes - 1), 0.152]} color={hair} shadow={false} />
        <Box size={[0.07, 0.018, 0.012]} position={[0.07, 0.255 + 0.01 * (eyes - 1), 0.152]} color={hair} shadow={false} />
        <Box size={[0.05, 0.07, 0.05]} position={[0, 0.15, 0.165]} color={skin} shadow={false} />
        <Box size={[0.09, 0.014 + 0.06 * mouth, 0.012]} position={[0, 0.075 - 0.02 * mouth, 0.152]} color={mouth > 0.05 ? '#4a2422' : '#b98466'} shadow={false} />
        {headExtra}
      </group>
      {bodyExtra}
      {arm(-1, armL, elbowL, leftHand)}
      {arm(1, armR, elbowR, rightHand)}
    </group>
  );
};

export type DogPose = {
  head?: number; // pitch, negative = looks up
  tail?: number; // wag angle
  legPhase?: number; // walking cycle angle
  tongue?: number; // 0..1 how far the tongue is out
  shake?: number; // body roll when shaking
};

// Faceted dog, made of low-poly blobs like the one on the reference.
export const Dog: React.FC<{position: V3; rotation?: number; pose?: DogPose; tongueBubbles?: React.ReactNode}> = ({
  position,
  rotation = 0,
  pose = {},
  tongueBubbles,
}) => {
  const {head = 0, tail = 0, legPhase = 0, tongue = 0, shake = 0} = pose;
  const fur = '#dcb27a';
  const furDark = '#c99a62';
  const leg = (x: number, z: number, phase: number) => (
    <group position={[x, 0.36, z]} rotation={[Math.sin(legPhase + phase) * 0.45, 0, 0]}>
      <Box size={[0.09, 0.36, 0.1]} position={[0, -0.18, 0]} color={furDark} />
    </group>
  );
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <group rotation={[0, 0, shake]}>
        <Ico radius={0.3} detail={1} position={[0, 0.48, 0]} scale={[0.75, 0.62, 1.25]} color={fur} />
        <Ico radius={0.2} detail={0} position={[0, 0.6, 0.3]} scale={[1, 1, 1]} color={fur} />
        {leg(-0.12, 0.25, 0)}
        {leg(0.12, 0.25, Math.PI)}
        {leg(-0.12, -0.25, Math.PI)}
        {leg(0.12, -0.25, 0)}
        {/* tail */}
        <group position={[0, 0.55, -0.36]} rotation={[-0.9, tail, 0]}>
          <Cyl rTop={0.025} rBottom={0.05} height={0.32} segments={5} position={[0, 0.16, 0]} color={fur} />
        </group>
        {/* head */}
        <group position={[0, 0.74, 0.42]} rotation={[head, 0, 0]}>
          <Ico radius={0.17} detail={0} position={[0, 0.06, 0]} scale={[1, 0.95, 1.05]} color={fur} />
          <Box size={[0.15, 0.11, 0.17]} position={[0, -0.01, 0.16]} color="#e8c595" />
          <Box size={[0.06, 0.05, 0.03]} position={[0, 0.03, 0.25]} color="#2a2622" />
          <Box size={[0.035, 0.035, 0.01]} position={[-0.07, 0.1, 0.14]} color="#2a2622" shadow={false} />
          <Box size={[0.035, 0.035, 0.01]} position={[0.07, 0.1, 0.14]} color="#2a2622" shadow={false} />
          <Cone radius={0.06} height={0.14} segments={4} position={[-0.09, 0.22, -0.02]} rotation={[0, 0, 0.25]} color={furDark} />
          <Cone radius={0.06} height={0.14} segments={4} position={[0.09, 0.22, -0.02]} rotation={[0, 0, -0.25]} color={furDark} />
          {/* tongue */}
          {tongue > 0 ? (
            <group position={[0, -0.07, 0.2]} rotation={[0.35, 0, 0]}>
              <Box size={[0.07, 0.015, 0.06 + 0.05 * tongue]} position={[0, 0, 0.03 + 0.025 * tongue]} color="#e07b86" shadow={false} />
              {tongueBubbles}
            </group>
          ) : null}
        </group>
      </group>
    </group>
  );
};
