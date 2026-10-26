import React from 'react';
import {Box, Mat} from '../slime/parts';
import {V3} from './cues';

export type Pose = {
  armL?: [number, number]; // shoulder [pitch forward, roll out]
  armR?: [number, number];
  elbowL?: number;
  elbowR?: number;
  head?: [number, number, number?]; // [pitch down, yaw, roll]
  stoop?: number; // upper body leans forward
  hipL?: number; // thigh raised forward
  hipR?: number;
  kneeL?: number; // shin bent back
  kneeR?: number;
  lean?: number;
};

// a walk or run cycle: phase in radians, amp ~0.45 walking, ~0.9 running
export const stride = (phase: number, amp: number, run = false): Pose => {
  const s = Math.sin(phase);
  const k = (x: number) => Math.max(0, Math.sin(x)) * amp * (run ? 2.0 : 1.3);
  return {
    hipL: amp * s,
    hipR: -amp * s,
    kneeL: k(phase - 1.4) + (run ? 0.3 : 0.05),
    kneeR: k(phase + Math.PI - 1.4) + (run ? 0.3 : 0.05),
    armL: [-amp * 0.8 * s, 0.08],
    armR: [amp * 0.8 * s, -0.08],
    elbowL: run ? 1.5 : 0.25 + 0.2 * Math.max(0, -s),
    elbowR: run ? 1.5 : 0.25 + 0.2 * Math.max(0, s),
    stoop: run ? 0.28 : 0.04,
  };
};
// how far the body bobs up and down in a stride
export const bob = (phase: number, amp: number) => -Math.abs(Math.cos(phase)) * amp * 0.06;

const JACKET: Mat = {color: '#3f7a4c', rough: 0.85};
const JACKET_DARK: Mat = {color: '#2f5e3a', rough: 0.85};
const SHIRT: Mat = {color: '#2b2f33', rough: 0.9};
const JEANS: Mat = {color: '#6b6f75', rough: 0.9};
const SOLE: Mat = {color: '#e2e0da', rough: 0.8};
const SHOE: Mat = {color: '#3a3d42', rough: 0.8};
export const SKIN: Mat = {color: '#d9b49a', rough: 0.9};
const HAIR: Mat = {color: '#3a2a20', rough: 0.95};
const EYE: Mat = {color: '#18181a', rough: 0.6};
const BROW: Mat = {color: '#2e231c', rough: 0.95};
const LIPS: Mat = {color: '#a8746a', rough: 0.9};
const BAG: Mat = {color: '#d9b23a', rough: 0.7};

const S = 0.9;
const HIP = 0.93;
export const BEN_HIP = HIP * S;

// Ben Carter, 31: green jacket, dark shirt, grey jeans, light sneakers, an empty yellow store bag on his shoulder.
// Same blocky build as the heroes of the other series; built at 1.98 m and scaled to 1.78 m.
export const Ben: React.FC<{position: V3; rotation?: number; pose?: Pose; rightHand?: React.ReactNode; leftHand?: React.ReactNode; bag?: boolean; eyes?: number}> = ({
  position,
  rotation = 0,
  pose = {},
  rightHand,
  leftHand,
  bag = true,
  eyes = 1,
}) => {
  const {armL = [0, 0.07], armR = [0, -0.07], elbowL = 0.1, elbowR = 0.1, head = [0.05, 0, 0], stoop = 0.04} = pose;
  const {hipL = 0, hipR = 0, kneeL = 0, kneeR = 0, lean = 0} = pose;
  const arm = (side: 1 | -1, rot: [number, number], elbow: number, hand?: React.ReactNode) => (
    <group position={[0.31 * side, 0.55, 0]} rotation={[-rot[0], 0, rot[1]]}>
      <Box size={[0.16, 0.32, 0.17]} position={[0, -0.15, 0]} m={JACKET} />
      <group position={[0, -0.3, 0]} rotation={[-elbow, 0, 0]}>
        <Box size={[0.145, 0.27, 0.155]} position={[0, -0.13, 0]} m={JACKET} />
        <Box size={[0.15, 0.04, 0.16]} position={[0, -0.27, 0]} m={JACKET_DARK} shadow={false} />
        <Box size={[0.085, 0.11, 0.05]} position={[0, -0.33, 0.005]} m={SKIN} />
        <Box size={[0.03, 0.06, 0.03]} position={[0.035 * -side, -0.31, 0.035]} m={SKIN} shadow={false} />
        <group position={[0, -0.37, 0.01]}>{hand}</group>
      </group>
    </group>
  );
  const leg = (side: 1 | -1, hip: number, knee: number) => (
    <group position={[0.11 * side, HIP, 0]} rotation={[-hip, 0, 0]}>
      <Box size={[0.18, 0.47, 0.2]} position={[0, -0.235, 0]} m={JEANS} />
      <group position={[0, -0.46, 0]} rotation={[knee, 0, 0]}>
        <Box size={[0.165, 0.42, 0.18]} position={[0, -0.21, 0]} m={JEANS} />
        <Box size={[0.17, 0.08, 0.29]} position={[0, -0.43, 0.045]} m={SHOE} />
        <Box size={[0.18, 0.03, 0.3]} position={[0, -0.465, 0.045]} m={SOLE} />
      </group>
    </group>
  );
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={S}>
      {leg(-1, hipL, kneeL)}
      {leg(1, hipR, kneeR)}
      <Box size={[0.4, 0.18, 0.24]} position={[0, HIP + 0.02, 0]} m={JEANS} />
      <group position={[0, HIP + 0.04, 0]} rotation={[stoop, 0, lean]}>
        <Box size={[0.5, 0.64, 0.28]} position={[0, 0.3, 0]} m={JACKET} />
        {/* open jacket: the dark shirt shows down the front */}
        <Box size={[0.16, 0.56, 0.02]} position={[0, 0.32, 0.14]} m={SHIRT} shadow={false} />
        <Box size={[0.012, 0.56, 0.02]} position={[-0.085, 0.32, 0.145]} m={JACKET_DARK} shadow={false} />
        <Box size={[0.012, 0.56, 0.02]} position={[0.085, 0.32, 0.145]} m={JACKET_DARK} shadow={false} />
        <Box size={[0.36, 0.08, 0.3]} position={[0, 0.62, -0.01]} m={JACKET_DARK} />
        <Box size={[0.13, 0.09, 0.13]} position={[0, 0.66, 0]} m={SKIN} />
        {bag ? (
          <>
            {/* strap over the left shoulder, the bag hanging at the right hip */}
            <Box size={[0.06, 0.66, 0.31]} position={[0.03, 0.34, 0]} rotation={[0, 0, 0.62]} m={BAG} />
            <Box size={[0.07, 0.4, 0.42]} position={[0.31, 0.02, 0.02]} rotation={[0, 0, 0.06]} m={BAG} />
          </>
        ) : null}
        <group position={[0, 0.69, 0.01]} rotation={[head[0], head[1], head[2] ?? 0]}>
          <Box size={[0.27, 0.31, 0.28]} position={[0, 0.16, 0]} m={SKIN} />
          <Box size={[0.29, 0.07, 0.3]} position={[0, 0.33, -0.005]} m={HAIR} />
          <Box size={[0.29, 0.22, 0.07]} position={[0, 0.22, -0.12]} m={HAIR} />
          <Box size={[0.035, 0.12, 0.13]} position={[-0.137, 0.25, -0.05]} m={HAIR} shadow={false} />
          <Box size={[0.035, 0.12, 0.13]} position={[0.137, 0.25, -0.05]} m={HAIR} shadow={false} />
          <Box size={[0.25, 0.05, 0.05]} position={[0.02, 0.31, 0.13]} rotation={[0, 0, -0.08]} m={HAIR} shadow={false} />
          <Box size={[0.048, 0.026 * eyes + 0.004, 0.012]} position={[-0.063, 0.19, 0.146]} m={EYE} shadow={false} />
          <Box size={[0.048, 0.026 * eyes + 0.004, 0.012]} position={[0.063, 0.19, 0.146]} m={EYE} shadow={false} />
          <Box size={[0.062, 0.016, 0.012]} position={[-0.063, 0.228 + 0.008 * (eyes - 1), 0.146]} m={BROW} shadow={false} />
          <Box size={[0.062, 0.016, 0.012]} position={[0.063, 0.228 + 0.008 * (eyes - 1), 0.146]} m={BROW} shadow={false} />
          <Box size={[0.045, 0.065, 0.045]} position={[0, 0.13, 0.155]} m={SKIN} shadow={false} />
          <Box size={[0.075, 0.014, 0.012]} position={[0, 0.07, 0.146]} m={LIPS} shadow={false} />
          <Box size={[0.03, 0.06, 0.05]} position={[-0.145, 0.16, 0]} m={SKIN} shadow={false} />
          <Box size={[0.03, 0.06, 0.05]} position={[0.145, 0.16, 0]} m={SKIN} shadow={false} />
        </group>
        {arm(-1, armL, elbowL, leftHand)}
        {arm(1, armR, elbowR, rightHand)}
      </group>
    </group>
  );
};

const POLO: Mat = {color: '#d6ad3a', rough: 0.8};
const POLO_DARK: Mat = {color: '#b38d2a', rough: 0.8};
const TROUSERS: Mat = {color: '#2c3b58', rough: 0.85};
const PALE: Mat = {color: '#d4cbc0', rough: 0.55, env: 0.6};
const BLACK: Mat = {color: '#1c1d1f', rough: 0.7};

const LEG = 1.16; // hip height of a 2.4 m staff member
export const STAFF_HIP = LEG + 0.04;

// A staff member (SCP-3008-2): 2.4 m, very thin, yellow polo, blue trousers, a smooth head with no face.
export const Staff: React.FC<{position: V3; rotation?: number; pose?: Pose}> = ({position, rotation = 0, pose = {}}) => {
  const {armL = [0.02, 0.05], armR = [0.02, -0.05], elbowL = 0.08, elbowR = 0.08, head = [0.08, 0, 0], stoop = 0.06} = pose;
  const {hipL = 0, hipR = 0, kneeL = 0, kneeR = 0} = pose;
  const arm = (side: 1 | -1, rot: [number, number], elbow: number) => (
    <group position={[0.24 * side, 0.68, 0]} rotation={[-rot[0], 0, rot[1]]}>
      <Box size={[0.13, 0.2, 0.14]} position={[0, -0.08, 0]} m={POLO} />
      <Box size={[0.075, 0.3, 0.08]} position={[0, -0.32, 0]} m={PALE} />
      <group position={[0, -0.48, 0]} rotation={[-elbow, 0, 0]}>
        <Box size={[0.068, 0.46, 0.072]} position={[0, -0.23, 0]} m={PALE} />
        <Box size={[0.07, 0.16, 0.035]} position={[0, -0.53, 0]} m={PALE} />
        <Box size={[0.05, 0.12, 0.03]} position={[0, -0.66, 0]} m={PALE} />
      </group>
    </group>
  );
  const leg = (side: 1 | -1, hip: number, knee: number) => (
    <group position={[0.085 * side, LEG, 0]} rotation={[-hip, 0, 0]}>
      <Box size={[0.13, 0.6, 0.15]} position={[0, -0.3, 0]} m={TROUSERS} />
      <group position={[0, -0.59, 0]} rotation={[knee, 0, 0]}>
        <Box size={[0.11, 0.53, 0.13]} position={[0, -0.265, 0]} m={TROUSERS} />
        <Box size={[0.12, 0.07, 0.3]} position={[0, -0.535, 0.06]} m={BLACK} />
      </group>
    </group>
  );
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {leg(-1, hipL, kneeL)}
      {leg(1, hipR, kneeR)}
      <Box size={[0.3, 0.16, 0.18]} position={[0, LEG + 0.02, 0]} m={TROUSERS} />
      <group position={[0, LEG + 0.06, 0]} rotation={[stoop, 0, 0]}>
        <Box size={[0.34, 0.74, 0.2]} position={[0, 0.36, 0]} m={POLO} />
        <Box size={[0.36, 0.06, 0.22]} position={[0, 0.02, 0]} m={POLO_DARK} />
        {/* collar and the button strip */}
        <Box size={[0.2, 0.05, 0.22]} position={[0, 0.74, 0]} m={POLO_DARK} />
        <Box size={[0.05, 0.16, 0.01]} position={[0, 0.64, 0.105]} m={POLO_DARK} shadow={false} />
        {/* a blank name badge */}
        <Box size={[0.08, 0.035, 0.01]} position={[-0.09, 0.55, 0.105]} m={{color: '#e8e6e0', rough: 0.6}} shadow={false} />
        <Box size={[0.07, 0.14, 0.07]} position={[0, 0.82, 0]} m={PALE} />
        <group position={[0, 0.86, 0.01]} rotation={[head[0], head[1], head[2] ?? 0]}>
          <mesh position={[0, 0.2, 0.01]} scale={[0.14, 0.2, 0.16]} castShadow receiveShadow>
            <icosahedronGeometry args={[1, 2]} />
            <meshStandardMaterial color={PALE.color} roughness={0.45} envMapIntensity={0.7} flatShading />
          </mesh>
        </group>
        {arm(-1, armL, elbowL)}
        {arm(1, armR, elbowR)}
      </group>
    </group>
  );
};

export type HandShape = 'point' | 'flat' | 'grip' | 'relaxed';

// Close-up bare hand at real size, pointing along -y from the wrist, palm facing +z. side 1 = right hand.
export const Hand: React.FC<{position?: V3; rotation?: V3; shape?: HandShape; side?: 1 | -1}> = ({position, rotation, shape = 'relaxed', side = 1}) => {
  const xs = [-0.03, -0.01, 0.01, 0.03].map((x) => x * side);
  const lens = [0.065, 0.08, 0.085, 0.078];
  const curls = {point: [1.4, 1.4, 1.3, 0.05], flat: [0.02, 0.02, 0.02, 0.05], grip: [1.0, 1.1, 1.15, 1.2], relaxed: [0.25, 0.3, 0.35, 0.4]}[shape];
  return (
    <group position={position} rotation={rotation}>
      <Box size={[0.11, 0.24, 0.1]} position={[0, 0.17, 0]} m={JACKET} />
      <Box size={[0.07, 0.06, 0.05]} position={[0, 0.03, 0]} m={SKIN} />
      <Box size={[0.085, 0.095, 0.028]} position={[0, -0.045, 0]} m={SKIN} />
      {xs.map((x, i) => (
        <group key={i} position={[x, -0.09, 0]} rotation={[curls[i], 0, (i - 1.5) * -0.04 * side]}>
          <Box size={[0.019, lens[i] * 0.55, 0.021]} position={[0, -lens[i] * 0.27, 0]} m={SKIN} />
          <group position={[0, -lens[i] * 0.55, 0]} rotation={[curls[i] * 0.9, 0, 0]}>
            <Box size={[0.018, lens[i] * 0.45, 0.02]} position={[0, -lens[i] * 0.22, 0]} m={SKIN} />
          </group>
        </group>
      ))}
      <group position={[0.045 * side, -0.03, 0.012]} rotation={[0.5, 0, 0.75 * side]}>
        <Box size={[0.022, 0.065, 0.024]} position={[0, -0.032, 0]} m={SKIN} />
      </group>
    </group>
  );
};
