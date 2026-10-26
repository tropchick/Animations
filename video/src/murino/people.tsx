import React from 'react';
import {Box, Mat} from '../slime/parts';
import {Pose} from '../scp/people';
import {V3} from './cues';

export type {Pose};
export {stride, bob} from '../scp/people';

// One blocky body for everybody in Murino, in the build of the other series (Ben, Kostya):
// the courier, the Long One (2.6 m), the Neighbour (a zombie with a calm human face) and the customer and his double.
type Look = {
  top: Mat; // jacket / shirt / robe
  topDark: Mat; // cuffs, collar, hem
  legs: Mat;
  shoe: Mat;
  sole?: Mat;
  skin: Mat;
  hair: Mat;
  legK?: number; // thigh + shin length factor
  torsoK?: number;
  armK?: number;
  neck?: number; // extra neck length, m
  thin?: number; // body width factor
  slippers?: boolean;
  robe?: boolean; // a bathrobe hanging over the thighs
  stripes?: Mat; // tracksuit stripes down the sleeves and legs
  glasses?: boolean;
  cap?: Mat;
  backpack?: Mat;
  smile?: number; // 0 neutral, 1 a wide fixed smile
  eyes?: number; // eye height factor (1 normal, >1 wide open)
  mouthDark?: number; // 0 closed lips, 1 a dark open mouth
  pale?: Mat; // eye whites for the wide-eyed ones
};

const EYE: Mat = {color: '#17181a', rough: 0.6};
const LIPS: Mat = {color: '#9c6d64', rough: 0.9};
const DARK: Mat = {color: '#1a1112', rough: 0.9};
const FRAME: Mat = {color: '#1d1f22', rough: 0.4, metal: 0.4};
const WHITE: Mat = {color: '#e9e6df', rough: 0.6};

export const Human: React.FC<{
  look: Look;
  position: V3;
  rotation?: number;
  pose?: Pose;
  scale?: number;
  rightHand?: React.ReactNode;
  leftHand?: React.ReactNode;
}> = ({look, position, rotation = 0, pose = {}, scale = 0.9, rightHand, leftHand}) => {
  const {legK = 1, torsoK = 1, armK = 1, neck = 0, thin = 1, smile = 0, eyes = 1, mouthDark = 0} = look;
  const {armL = [0, 0.07], armR = [0, -0.07], elbowL = 0.1, elbowR = 0.1, head = [0.05, 0, 0], stoop = 0.04} = pose;
  const {hipL = 0, hipR = 0, kneeL = 0, kneeR = 0, lean = 0} = pose;
  const HIP = 0.93 * legK;
  const thigh = 0.47 * legK;
  const shin = 0.42 * legK;
  const torso = 0.64 * torsoK;
  const shoulder = 0.55 * torsoK;
  const W = thin;
  const sole = look.sole ?? look.shoe;
  const arm = (side: 1 | -1, rot: [number, number], elbow: number, hand?: React.ReactNode) => (
    <group position={[0.31 * side * W, shoulder, 0]} rotation={[-rot[0], 0, rot[1]]}>
      <Box size={[0.16 * W, 0.32 * armK, 0.17 * W]} position={[0, -0.15 * armK, 0]} m={look.top} />
      {look.stripes ? <Box size={[0.012, 0.3 * armK, 0.05]} position={[0.085 * W * side, -0.15 * armK, 0]} m={look.stripes} shadow={false} /> : null}
      <group position={[0, -0.3 * armK, 0]} rotation={[-elbow, 0, 0]}>
        <Box size={[0.145 * W, 0.27 * armK, 0.155 * W]} position={[0, -0.13 * armK, 0]} m={look.top} />
        <Box size={[0.15 * W, 0.04, 0.16 * W]} position={[0, -0.27 * armK, 0]} m={look.topDark} shadow={false} />
        <Box size={[0.085, 0.11 * Math.max(1, armK * 0.9), 0.05]} position={[0, -0.27 * armK - 0.06 * Math.max(1, armK * 0.9), 0.005]} m={look.skin} />
        <Box size={[0.03, 0.06, 0.03]} position={[0.035 * -side, -0.27 * armK - 0.04, 0.035]} m={look.skin} shadow={false} />
        <group position={[0, -0.27 * armK - 0.1, 0.01]}>{hand}</group>
      </group>
    </group>
  );
  const leg = (side: 1 | -1, hip: number, knee: number) => (
    <group position={[0.11 * side * W, HIP, 0]} rotation={[-hip, 0, 0]}>
      <Box size={[0.18 * W, thigh, 0.2 * W]} position={[0, -thigh / 2, 0]} m={look.legs} />
      {look.robe ? <Box size={[0.22 * W, thigh * 0.8, 0.29 * W]} position={[0.02 * side, -thigh * 0.38, 0]} m={look.top} /> : null}
      {look.stripes ? <Box size={[0.012, thigh * 0.95, 0.05]} position={[0.095 * W * side, -thigh / 2, 0]} m={look.stripes} shadow={false} /> : null}
      <group position={[0, -thigh + 0.01, 0]} rotation={[knee, 0, 0]}>
        <Box size={[0.165 * W, shin, 0.18 * W]} position={[0, -shin / 2, 0]} m={look.legs} />
        {look.stripes ? <Box size={[0.012, shin * 0.9, 0.05]} position={[0.088 * W * side, -shin / 2, 0]} m={look.stripes} shadow={false} /> : null}
        {look.slippers ? (
          <>
            <Box size={[0.15, 0.03, 0.27]} position={[0, -shin - 0.035, 0.05]} m={sole} />
            <Box size={[0.152, 0.05, 0.13]} position={[0, -shin - 0.0, 0.1]} m={look.shoe} />
            <Box size={[0.13, 0.06, 0.16]} position={[0, -shin - 0.0, -0.02]} m={look.skin} />
          </>
        ) : (
          <>
            <Box size={[0.17, 0.08, 0.29]} position={[0, -shin - 0.01, 0.045]} m={look.shoe} />
            <Box size={[0.18, 0.03, 0.3]} position={[0, -shin - 0.045, 0.045]} m={sole} />
          </>
        )}
      </group>
    </group>
  );
  const s = smile;
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {leg(-1, hipL, kneeL)}
      {leg(1, hipR, kneeR)}
      <Box size={[0.4 * W, 0.18, 0.24 * W]} position={[0, HIP + 0.02, 0]} m={look.robe ? look.top : look.legs} />
      <group position={[0, HIP + 0.04, 0]} rotation={[stoop, 0, lean]}>
        <Box size={[0.5 * W, torso, 0.28 * W]} position={[0, torso * 0.47, 0]} m={look.top} />
        {look.robe ? (
          <>
            {/* the robe: a belt round the waist, the skirt flaps ride on the thighs (see leg) */}
            <Box size={[0.52 * W, 0.16, 0.3 * W]} position={[0, -0.02, 0]} m={look.top} />
            <Box size={[0.53 * W, 0.05, 0.31 * W]} position={[0, 0.04, 0]} m={look.topDark} shadow={false} />
            <Box size={[0.12, 0.2, 0.02]} position={[0, torso * 0.82, 0.142 * W]} m={look.skin} shadow={false} />
          </>
        ) : null}
        <Box size={[0.36 * W, 0.08, 0.3 * W]} position={[0, torso - 0.02, -0.01]} m={look.topDark} />
        {look.backpack ? (
          <>
            {/* the courier's thermal backpack, flat against the back, and its straps */}
            <Box size={[0.46, 0.5, 0.32]} position={[0, torso * 0.5, -0.31]} m={look.backpack} />
            <Box size={[0.47, 0.05, 0.33]} position={[0, torso * 0.5 + 0.27, -0.31]} m={look.topDark} shadow={false} />
            <Box size={[0.06, 0.5, 0.02]} position={[-0.14, torso * 0.55, 0.15]} m={look.topDark} shadow={false} />
            <Box size={[0.06, 0.5, 0.02]} position={[0.14, torso * 0.55, 0.15]} m={look.topDark} shadow={false} />
          </>
        ) : null}
        <Box size={[0.13, 0.09 + neck, 0.13]} position={[0, torso + 0.02 + neck / 2, 0]} m={look.skin} />
        <group position={[0, torso + 0.05 + neck, 0.01]} rotation={[head[0], head[1], head[2] ?? 0]}>
          <Box size={[0.27, 0.31, 0.28]} position={[0, 0.16, 0]} m={look.skin} />
          <Box size={[0.29, 0.07, 0.3]} position={[0, 0.33, -0.005]} m={look.hair} />
          <Box size={[0.29, 0.22, 0.07]} position={[0, 0.22, -0.12]} m={look.hair} />
          <Box size={[0.035, 0.12, 0.13]} position={[-0.137, 0.25, -0.05]} m={look.hair} shadow={false} />
          <Box size={[0.035, 0.12, 0.13]} position={[0.137, 0.25, -0.05]} m={look.hair} shadow={false} />
          {look.cap ? (
            <>
              <Box size={[0.3, 0.09, 0.31]} position={[0, 0.355, 0]} m={look.cap} />
              <Box size={[0.26, 0.022, 0.13]} position={[0, 0.315, 0.2]} m={look.cap} />
            </>
          ) : (
            <Box size={[0.25, 0.05, 0.05]} position={[0.02, 0.31, 0.13]} rotation={[0, 0, -0.08]} m={look.hair} shadow={false} />
          )}
          {eyes > 1.15 && look.pale ? (
            <>
              <Box size={[0.06, 0.034 * eyes, 0.008]} position={[-0.063, 0.19, 0.142]} m={look.pale} shadow={false} />
              <Box size={[0.06, 0.034 * eyes, 0.008]} position={[0.063, 0.19, 0.142]} m={look.pale} shadow={false} />
            </>
          ) : null}
          <Box size={[0.048 * (eyes > 1.15 ? 0.6 : 1), 0.026 * Math.min(eyes, 1.2) + 0.004, 0.012]} position={[-0.063, 0.19, 0.146]} m={EYE} shadow={false} />
          <Box size={[0.048 * (eyes > 1.15 ? 0.6 : 1), 0.026 * Math.min(eyes, 1.2) + 0.004, 0.012]} position={[0.063, 0.19, 0.146]} m={EYE} shadow={false} />
          <Box size={[0.062, 0.016, 0.012]} position={[-0.063, 0.232 + 0.006 * (eyes - 1), 0.146]} m={look.hair} shadow={false} />
          <Box size={[0.062, 0.016, 0.012]} position={[0.063, 0.232 + 0.006 * (eyes - 1), 0.146]} m={look.hair} shadow={false} />
          {look.glasses ? (
            <>
              <Box size={[0.085, 0.012, 0.01]} position={[-0.063, 0.215, 0.158]} m={FRAME} shadow={false} />
              <Box size={[0.085, 0.012, 0.01]} position={[0.063, 0.215, 0.158]} m={FRAME} shadow={false} />
              <Box size={[0.085, 0.012, 0.01]} position={[-0.063, 0.163, 0.158]} m={FRAME} shadow={false} />
              <Box size={[0.085, 0.012, 0.01]} position={[0.063, 0.163, 0.158]} m={FRAME} shadow={false} />
              <Box size={[0.04, 0.01, 0.01]} position={[0, 0.2, 0.158]} m={FRAME} shadow={false} />
              <Box size={[0.012, 0.06, 0.01]} position={[-0.114, 0.19, 0.158]} m={FRAME} shadow={false} />
              <Box size={[0.012, 0.06, 0.01]} position={[0.114, 0.19, 0.158]} m={FRAME} shadow={false} />
              <Box size={[0.012, 0.06, 0.01]} position={[-0.012, 0.19, 0.158]} m={FRAME} shadow={false} />
              <Box size={[0.012, 0.06, 0.01]} position={[0.012, 0.19, 0.158]} m={FRAME} shadow={false} />
            </>
          ) : null}
          <Box size={[0.045, 0.065, 0.045]} position={[0, 0.13, 0.155]} m={look.skin} shadow={false} />
          {/* mouth: lips, a wide fixed smile with the corners up, or a dark open mouth */}
          {mouthDark > 0 ? <Box size={[0.07 + 0.06 * s, 0.012 + 0.03 * mouthDark, 0.008]} position={[0, 0.07, 0.142]} m={DARK} shadow={false} /> : null}
          <Box size={[0.075 + 0.07 * s, 0.014, 0.012]} position={[0, 0.07 - 0.004 * s + 0.017 * mouthDark, 0.146]} m={LIPS} shadow={false} />
          {s > 0 ? (
            <>
              <Box size={[0.03, 0.012, 0.012]} position={[-0.062 - 0.035 * s, 0.078, 0.146]} rotation={[0, 0, 0.6]} m={LIPS} shadow={false} />
              <Box size={[0.03, 0.012, 0.012]} position={[0.062 + 0.035 * s, 0.078, 0.146]} rotation={[0, 0, -0.6]} m={LIPS} shadow={false} />
              <Box size={[0.06 + 0.06 * s, 0.01, 0.006]} position={[0, 0.06, 0.143]} m={WHITE} shadow={false} />
            </>
          ) : null}
          <Box size={[0.03, 0.06, 0.05]} position={[-0.145, 0.16, 0]} m={look.skin} shadow={false} />
          <Box size={[0.03, 0.06, 0.05]} position={[0.145, 0.16, 0]} m={look.skin} shadow={false} />
        </group>
        {arm(-1, armL, elbowL, leftHand)}
        {arm(1, armR, elbowR, rightHand)}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- the cast

const SKIN: Mat = {color: '#d9b49a', rough: 0.9};
export const COURIER: Look = {
  top: {color: '#2b3442', rough: 0.85},
  topDark: {color: '#1e252f', rough: 0.85},
  legs: {color: '#25272b', rough: 0.9},
  shoe: {color: '#3a3d42', rough: 0.8},
  sole: {color: '#e2e0da', rough: 0.8},
  skin: SKIN,
  hair: {color: '#3a2a20', rough: 0.95},
  cap: {color: '#1fb3a5', rough: 0.7},
  backpack: {color: '#1fb3a5', rough: 0.6},
};

// the Long One: an ordinary man in an old tracksuit, 2.6 m tall, arms to the knees
export const LONG: Look = {
  top: {color: '#2d3a5a', rough: 0.8},
  topDark: {color: '#222c45', rough: 0.8},
  legs: {color: '#2d3a5a', rough: 0.8},
  shoe: {color: '#3b3d40', rough: 0.85},
  sole: {color: '#cfccc4', rough: 0.85},
  skin: {color: '#cdb3a3', rough: 0.85},
  hair: {color: '#2c2622', rough: 0.95},
  stripes: {color: '#e8e8e4', rough: 0.7},
  legK: 1.42,
  torsoK: 1.22,
  armK: 1.6,
  neck: 0.06,
  thin: 0.82,
  eyes: 1,
};

// the Neighbour: bathrobe and slippers, grey skin, an ordinary calm face with a mouth a little too wide
export const NEIGHBOUR: Look = {
  top: {color: '#6e2f36', rough: 0.9},
  topDark: {color: '#4f2027', rough: 0.9},
  legs: {color: '#8e978a', rough: 0.85},
  shoe: {color: '#3e4a5c', rough: 0.9},
  sole: {color: '#2a2e33', rough: 0.9},
  skin: {color: '#a4ab9b', rough: 0.85},
  hair: {color: '#3d3833', rough: 0.95},
  slippers: true,
  robe: true,
  thin: 0.92,
  pale: {color: '#d9dccf', rough: 0.6},
};

// the customer of flat 412: t-shirt, sweatpants, slippers, glasses; his double is the same man
export const CUSTOMER: Look = {
  top: {color: '#8fa1b3', rough: 0.9},
  topDark: {color: '#73879b', rough: 0.9},
  legs: {color: '#3b3f46', rough: 0.9},
  shoe: {color: '#5a4a3c', rough: 0.9},
  sole: {color: '#2f2a26', rough: 0.9},
  skin: SKIN,
  hair: {color: '#4a3526', rough: 0.95},
  slippers: true,
  glasses: true,
};
export const double = (grow: number, smile: number): Look => ({
  ...CUSTOMER,
  legK: 1 + 0.55 * grow,
  torsoK: 1 + 0.45 * grow,
  armK: 1 + 0.6 * grow,
  neck: 0.25 * grow,
  thin: 1 - 0.18 * grow,
  smile,
});
