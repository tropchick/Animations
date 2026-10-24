import React from 'react';
import {Box, Mat} from './parts';
import {V3} from './cues';

const COAT: Mat = {color: '#8a9198', rough: 0.85};
const COAT_DARK: Mat = {color: '#737a81', rough: 0.85};
const SWEATER: Mat = {color: '#2e3236', rough: 0.9};
const PANTS: Mat = {color: '#2a2e33', rough: 0.9};
const SHOES: Mat = {color: '#16191c', rough: 0.7};
const SKIN: Mat = {color: '#cdb3a0', rough: 0.9};
const STUBBLE: Mat = {color: '#8f7d70', rough: 0.95};
const HAIR: Mat = {color: '#3b3836', rough: 0.95};
const EYE: Mat = {color: '#1b1c1e', rough: 0.9};
export const GLOVE: Mat = {color: '#8796a6', rough: 0.55, metal: 0.05};
const BADGE: Mat = {color: '#e6e9ec', rough: 0.6};

export type GlebPose = {
  armL?: [number, number]; // shoulder [pitch forward, roll out]
  armR?: [number, number];
  elbowL?: number;
  elbowR?: number;
  head?: [number, number]; // [pitch down, yaw]
  stoop?: number; // upper body leans forward
  legL?: number;
  legR?: number;
};

// Low-poly Gleb Norin: tall, slightly hunched, grey lab coat, gloves.
export const Gleb: React.FC<{position: V3; rotation?: number; pose?: GlebPose; rightHand?: React.ReactNode}> = ({
  position,
  rotation = 0,
  pose = {},
  rightHand,
}) => {
  const {armL = [0, 0.06], armR = [0, -0.06], elbowL = 0, elbowR = 0, head = [0.12, 0], stoop = 0.1, legL = 0, legR = 0} = pose;
  const arm = (side: 1 | -1, rot: [number, number], elbow: number, hand?: React.ReactNode) => (
    <group position={[0.34 * side, 0.56, 0]} rotation={[-rot[0], 0, rot[1]]}>
      <Box size={[0.16, 0.5, 0.17]} position={[0, -0.24, 0]} m={COAT} />
      <group position={[0, -0.5, 0]} rotation={[-elbow, 0, 0]}>
        <Box size={[0.145, 0.32, 0.155]} position={[0, -0.15, 0]} m={COAT} />
        <Box size={[0.11, 0.13, 0.12]} position={[0, -0.37, 0.01]} m={GLOVE} />
        <group position={[0, -0.42, 0.02]}>{hand}</group>
      </group>
    </group>
  );
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {([[-0.12, legL], [0.12, legR]] as const).map(([lx, pitch]) => (
        <group key={lx} position={[lx, 0.92, 0]} rotation={[-pitch, 0, 0]}>
          <Box size={[0.2, 0.86, 0.22]} position={[0, -0.45, 0]} m={PANTS} />
          <Box size={[0.21, 0.08, 0.31]} position={[0, -0.88, 0.04]} m={SHOES} />
        </group>
      ))}
      {/* coat skirt down to the knees */}
      <Box size={[0.58, 0.46, 0.34]} position={[0, 0.78, 0]} m={COAT_DARK} />
      {/* upper body leans forward from the hips */}
      <group position={[0, 0.98, 0]} rotation={[stoop, 0, 0]}>
        <Box size={[0.58, 0.68, 0.33]} position={[0, 0.32, 0]} m={COAT} />
        <Box size={[0.2, 0.36, 0.02]} position={[0, 0.4, 0.17]} m={SWEATER} />
        <Box size={[0.07, 0.1, 0.012]} position={[0.16, 0.42, 0.172]} m={BADGE} shadow={false} />
        <Box size={[0.14, 0.09, 0.14]} position={[0, 0.7, 0]} m={SKIN} />
        <group position={[0, 0.74, 0.01]} rotation={[head[0], head[1], 0]}>
          <Box size={[0.3, 0.35, 0.3]} position={[0, 0.17, 0]} m={SKIN} />
          <Box size={[0.302, 0.12, 0.2]} position={[0, 0.04, 0.052]} m={STUBBLE} />
          <Box size={[0.32, 0.07, 0.32]} position={[0, 0.36, -0.01]} m={HAIR} />
          <Box size={[0.32, 0.2, 0.08]} position={[0, 0.26, -0.13]} m={HAIR} />
          <Box size={[0.05, 0.022, 0.012]} position={[-0.07, 0.21, 0.152]} m={EYE} shadow={false} />
          <Box size={[0.05, 0.022, 0.012]} position={[0.07, 0.21, 0.152]} m={EYE} shadow={false} />
          <Box size={[0.07, 0.016, 0.012]} position={[-0.07, 0.245, 0.152]} m={HAIR} shadow={false} />
          <Box size={[0.07, 0.016, 0.012]} position={[0.07, 0.245, 0.152]} m={HAIR} shadow={false} />
          <Box size={[0.05, 0.07, 0.05]} position={[0, 0.15, 0.165]} m={SKIN} shadow={false} />
        </group>
        {arm(-1, armL, elbowL)}
        {arm(1, armR, elbowR, rightHand)}
      </group>
    </group>
  );
};

// Close-up gloved hand, real size (palm ~9 cm). Points along -y from the wrist, palm facing +z.
export const GloveHand: React.FC<{position: V3; rotation?: V3; curl?: number; spread?: number; sleeve?: boolean}> = ({
  position,
  rotation,
  curl = 0.2,
  spread = 0.08,
  sleeve = true,
}) => {
  const fingers = [-0.03, -0.01, 0.01, 0.03];
  const lens = [0.07, 0.08, 0.077, 0.062];
  return (
    <group position={position} rotation={rotation}>
      {sleeve ? (
        <>
          <Box size={[0.1, 0.3, 0.1]} position={[0, 0.2, 0]} m={COAT} />
          <Box size={[0.075, 0.06, 0.06]} position={[0, 0.03, 0]} m={GLOVE} />
        </>
      ) : null}
      <Box size={[0.085, 0.09, 0.03]} position={[0, -0.04, 0]} m={GLOVE} />
      {fingers.map((x, i) => (
        <group key={x} position={[x, -0.085, 0]} rotation={[curl, 0, (i - 1.5) * -spread * 0.5]}>
          <Box size={[0.018, lens[i] * 0.55, 0.02]} position={[0, -lens[i] * 0.27, 0]} m={GLOVE} />
          <group position={[0, -lens[i] * 0.55, 0]} rotation={[curl * 1.2, 0, 0]}>
            <Box size={[0.017, lens[i] * 0.45, 0.019]} position={[0, -lens[i] * 0.22, 0]} m={GLOVE} />
          </group>
        </group>
      ))}
      <group position={[0.045, -0.03, 0.01]} rotation={[0.3, 0, 0.7]}>
        <Box size={[0.02, 0.06, 0.022]} position={[0, -0.03, 0]} m={GLOVE} />
      </group>
    </group>
  );
};
