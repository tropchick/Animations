import React from 'react';
import {Box, Mat} from '../slime/parts';
import {V3} from './cues';

const HOODIE: Mat = {color: '#6c7076', rough: 0.95};
const HOOD_IN: Mat = {color: '#585c61', rough: 0.95};
export const VEST: Mat = {color: '#27344a', rough: 0.85};
const JEANS: Mat = {color: '#38465c', rough: 0.9};
const SOLE: Mat = {color: '#e2e0da', rough: 0.8};
const SHOE: Mat = {color: '#3a3d42', rough: 0.8};
export const SKIN: Mat = {color: '#d6b49c', rough: 0.9};
const STUBBLE: Mat = {color: '#a88f7e', rough: 0.95};
const HAIR: Mat = {color: '#2b2522', rough: 0.95};
const EYE: Mat = {color: '#18181a', rough: 0.9};
const LIPS: Mat = {color: '#9c6e62', rough: 0.9};

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
  lean?: number; // whole upper body rolls sideways (sitting against a wall)
};

// the model is built at 1.98 m and scaled to 1.78 m
const S = 0.9;
const HIP = 0.93;
// hips are this high above the soles when standing
export const HIP_H = HIP * S;

// Low-poly Kostya Ryabov, 29: grey hoodie, dark-blue work vest without a logo, jeans, light sneakers.
// Same blocky build as Gleb in "Хроника слизи", but younger, with knees so he can sit.
export const Kostya: React.FC<{position: V3; rotation?: number; pose?: Pose; rightHand?: React.ReactNode; leftHand?: React.ReactNode}> = ({
  position,
  rotation = 0,
  pose = {},
  rightHand,
  leftHand,
}) => {
  const {armL = [0, 0.07], armR = [0, -0.07], elbowL = 0.1, elbowR = 0.1, head = [0.05, 0, 0], stoop = 0.04} = pose;
  const {hipL = 0, hipR = 0, kneeL = 0, kneeR = 0, lean = 0} = pose;
  const arm = (side: 1 | -1, rot: [number, number], elbow: number, hand?: React.ReactNode) => (
    <group position={[0.31 * side, 0.55, 0]} rotation={[-rot[0], 0, rot[1]]}>
      <Box size={[0.15, 0.32, 0.16]} position={[0, -0.15, 0]} m={HOODIE} />
      <group position={[0, -0.3, 0]} rotation={[-elbow, 0, 0]}>
        <Box size={[0.135, 0.27, 0.145]} position={[0, -0.13, 0]} m={HOODIE} />
        <Box size={[0.085, 0.11, 0.05]} position={[0, -0.32, 0.005]} m={SKIN} />
        <Box size={[0.03, 0.06, 0.03]} position={[0.035 * -side, -0.3, 0.035]} m={SKIN} shadow={false} />
        <group position={[0, -0.36, 0.01]}>{hand}</group>
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
        {/* hoodie with the vest over it: the grey hem shows under the vest */}
        <Box size={[0.48, 0.6, 0.26]} position={[0, 0.3, 0]} m={HOODIE} />
        <Box size={[0.5, 0.48, 0.28]} position={[0, 0.33, 0]} m={VEST} />
        <Box size={[0.012, 0.44, 0.012]} position={[0, 0.33, 0.141]} m={{color: '#1b2433', rough: 0.7}} shadow={false} />
        {/* hood lying on the back */}
        <Box size={[0.34, 0.16, 0.12]} position={[0, 0.6, -0.15]} m={HOODIE} />
        <Box size={[0.24, 0.1, 0.06]} position={[0, 0.63, -0.1]} m={HOOD_IN} shadow={false} />
        <Box size={[0.13, 0.09, 0.13]} position={[0, 0.64, 0]} m={SKIN} />
        <group position={[0, 0.67, 0.01]} rotation={[head[0], head[1], head[2] ?? 0]}>
          <Box size={[0.27, 0.31, 0.28]} position={[0, 0.16, 0]} m={SKIN} />
          <Box size={[0.278, 0.1, 0.18]} position={[0, 0.04, 0.055]} m={STUBBLE} />
          <Box size={[0.29, 0.06, 0.3]} position={[0, 0.33, -0.005]} m={HAIR} />
          <Box size={[0.29, 0.2, 0.07]} position={[0, 0.23, -0.12]} m={HAIR} />
          <Box size={[0.035, 0.1, 0.12]} position={[-0.137, 0.25, -0.05]} m={HAIR} shadow={false} />
          <Box size={[0.035, 0.1, 0.12]} position={[0.137, 0.25, -0.05]} m={HAIR} shadow={false} />
          <Box size={[0.29, 0.05, 0.05]} position={[0, 0.31, 0.13]} m={HAIR} shadow={false} />
          <Box size={[0.045, 0.024, 0.012]} position={[-0.063, 0.19, 0.146]} m={EYE} shadow={false} />
          <Box size={[0.045, 0.024, 0.012]} position={[0.063, 0.19, 0.146]} m={EYE} shadow={false} />
          <Box size={[0.06, 0.014, 0.012]} position={[-0.063, 0.225, 0.146]} m={HAIR} shadow={false} />
          <Box size={[0.06, 0.014, 0.012]} position={[0.063, 0.225, 0.146]} m={HAIR} shadow={false} />
          <Box size={[0.045, 0.065, 0.045]} position={[0, 0.13, 0.155]} m={SKIN} shadow={false} />
          <Box size={[0.075, 0.014, 0.012]} position={[0, 0.07, 0.15]} m={LIPS} shadow={false} />
          <Box size={[0.03, 0.06, 0.05]} position={[-0.145, 0.16, 0]} m={SKIN} shadow={false} />
          <Box size={[0.03, 0.06, 0.05]} position={[0.145, 0.16, 0]} m={SKIN} shadow={false} />
        </group>
        {arm(-1, armL, elbowL, leftHand)}
        {arm(1, armR, elbowR, rightHand)}
      </group>
    </group>
  );
};

export type HandShape = 'point' | 'flat' | 'grip' | 'relaxed';

// Close-up bare hand, real size (palm ~9 cm). Points along -y from the wrist, palm facing +z.
// side 1 is the right hand (thumb on -x when the palm faces the camera... i.e. towards the body's centre).
export const Hand: React.FC<{position?: V3; rotation?: V3; shape?: HandShape; side?: 1 | -1; sleeve?: boolean}> = ({
  position,
  rotation,
  shape = 'relaxed',
  side = 1,
  sleeve = true,
}) => {
  const xs = [-0.03, -0.01, 0.01, 0.03].map((x) => x * side);
  const lens = [0.065, 0.08, 0.085, 0.078]; // little finger .. index (the index is next to the thumb)
  const curls = {
    point: [1.4, 1.4, 1.3, 0.05],
    flat: [0.02, 0.02, 0.02, 0.05],
    grip: [1.0, 1.1, 1.15, 1.2],
    relaxed: [0.25, 0.3, 0.35, 0.4],
  }[shape];
  return (
    <group position={position} rotation={rotation}>
      {sleeve ? (
        <>
          <Box size={[0.1, 0.24, 0.09]} position={[0, 0.17, 0]} m={HOODIE} />
          <Box size={[0.07, 0.06, 0.05]} position={[0, 0.03, 0]} m={SKIN} />
        </>
      ) : null}
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
