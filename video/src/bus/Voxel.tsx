import React from 'react';
import {Color} from 'three';
import {Box, Mat} from '../slime/parts';
import {V3} from './cues';

// Blocky "voxel" people in the style of the reference: a big cube head with a flat pixel face
// (raised blocks for brows, eye whites, pupils, nose and mouth), box body, box limbs with an elbow and a knee.
// Root at the feet, facing +z. Every face detail stands 4–8 mm proud of the surface below it (no z-fighting).

export type Face = {
  gaze?: [number, number]; // pupil offset, -1..1 (x to the character's left, y up)
  brows?: number; // -1 frown .. 0 .. 1 raised
  open?: number; // mouth open 0..1
  smile?: number; // 0..1
  blush?: number; // 0..1
  sparkle?: number; // 0..1 highlights in the eyes
  wide?: number; // 0..1 eyes open wider
  shut?: number; // 0..1 eyes closed (blink)
};

export type Pose = {
  head?: V3; // pitch (+ looks down), yaw (+ turns to the character's left), roll
  lean?: number; // torso pitch forward
  twist?: number;
  hipL?: number; // thigh pitch forward
  hipR?: number;
  kneeL?: number; // knee bend (shin goes back)
  kneeR?: number;
  armL?: [number, number]; // shoulder pitch forward, roll outward
  armR?: [number, number];
  elbowL?: number; // elbow bend forward
  elbowR?: number;
};

export type Look = {
  skin: string;
  top: string;
  topDark: string;
  legs: string;
  shoe: string;
  hair: string;
  sleeve: number; // 0..1 how far the sleeve covers the arm
  kind: 'guy' | 'girl' | 'granny';
  scale?: number;
  legK?: number;
  wide?: number;
};

const m = (color: string, rough = 0.85, extra: Partial<Mat> = {}): Mat => ({color, rough, env: 0.2, ...extra});
const mix = (a: string, b: string, k: number) => '#' + new Color(a).lerp(new Color(b), Math.min(1, Math.max(0, k))).getHexString();

const EYE_WHITE = m('#eeeae2', 0.6);
const PUPIL = m('#141416', 0.5);
const MOUTH = m('#2a1513', 0.9);
const FRAME = m('#2b2622', 0.35, {metal: 0.3});

// dimensions before scale
export const LEG = 0.36; // thigh and shin each
export const SHOE_H = 0.07;
export const TORSO = 0.62;
export const HEAD = 0.44;
export const hipHeight = (look: Look) => (LEG * 2 * (look.legK ?? 1) + SHOE_H) * (look.scale ?? 1);

const FaceBlocks: React.FC<{look: Look; face: Face; glint?: number}> = ({look, face, glint = -1}) => {
  const H = HEAD / 2;
  const z = H; // the face plane
  const {gaze = [0, 0], brows = 0, open = 0, smile = 0, blush = 0, sparkle = 0, wide = 0, shut = 0} = face;
  const brow = m(look.kind === 'granny' ? '#b9b3ab' : look.hair);
  const skinDark = m(mix(look.skin, '#7a3b26', 0.22));
  const eyeH = 0.06 + 0.02 * wide;
  const eyeOpen = 1 - shut;
  const eyeY = 0.0;
  const eyeX = 0.1;
  const px = gaze[0] * 0.024;
  const py = gaze[1] * 0.004;
  const eyes = ([1, -1] as const).map((s) => (
    <group key={s} position={[s * eyeX, eyeY, z]}>
      {eyeOpen > 0.15 ? (
        <>
          <Box size={[0.11, eyeH * eyeOpen, 0.012]} position={[0, 0, 0.002]} m={EYE_WHITE} shadow={false} />
          <Box size={[0.05, (eyeH - 0.012) * eyeOpen, 0.012]} position={[px + s * -0.012, py * eyeOpen, 0.008]} m={PUPIL} shadow={false} />
          {sparkle > 0.05 ? (
            <Box size={[0.018 * sparkle, 0.018 * sparkle, 0.006]} position={[px + s * -0.012 + 0.012, py + 0.015, 0.016]} m={m('#ffffff', 0.4, {emissive: '#ffffff', glow: 0.9})} shadow={false} />
          ) : null}
        </>
      ) : (
        <Box size={[0.11, 0.016, 0.012]} position={[0, -0.01, 0.002]} m={PUPIL} shadow={false} />
      )}
      {look.kind === 'girl' && eyeOpen > 0.15 ? (
        <Box size={[0.13, 0.02, 0.014]} position={[s * 0.012, eyeH * eyeOpen * 0.5 + 0.008, 0.006]} m={PUPIL} shadow={false} />
      ) : null}
      {/* brow */}
      <Box
        size={[0.12, 0.026, 0.012]}
        position={[s * 0.004, 0.068 + 0.02 * brows + 0.01 * wide, 0.006]}
        rotation={[0, 0, s * (-0.16 * brows + 0.12 * Math.min(0, brows))]}
        m={brow}
        shadow={false}
      />
    </group>
  ));
  const mouthW = (look.kind === 'girl' ? 0.075 : 0.1) + 0.03 * smile;
  const mouthH = (look.kind === 'girl' ? 0.018 : 0.022) + 0.06 * open;
  return (
    <group>
      {eyes}
      {/* nose */}
      <Box size={[0.06, 0.07, 0.03]} position={[0, -0.055, z + 0.012]} m={skinDark} shadow={false} />
      {/* mouth: a bar that opens, with corners that lift into a smile */}
      <Box size={[mouthW, mouthH, 0.012]} position={[0, -0.135 - 0.025 * open + 0.004 * smile, z + 0.002]} m={look.kind === 'girl' ? m(open > 0.15 ? '#3a1618' : '#b8545f') : MOUTH} shadow={false} />
      {smile > 0.05
        ? ([1, -1] as const).map((s) => (
            <Box key={s} size={[0.024, 0.024 * smile + 0.004, 0.012]} position={[s * (mouthW / 2 + 0.008), -0.135 + 0.012 * smile, z + 0.005]} m={look.kind === 'girl' && open <= 0.15 ? m('#b8545f') : MOUTH} shadow={false} />
          ))
        : null}
      {blush > 0.02
        ? ([1, -1] as const).map((s) => (
            <Box key={s} size={[0.07, 0.035, 0.008]} position={[s * 0.14, -0.065, z + 0.001]} m={m(mix(look.skin, '#e2566a', 0.85 * blush))} shadow={false} />
          ))
        : null}
      {look.kind === 'granny' ? <Glasses glint={glint} /> : null}
    </group>
  );
};

// round-ish glasses made of thin bars around each eye, with a glint that runs across them
const Glasses: React.FC<{glint: number}> = ({glint}) => {
  const z = HEAD / 2 + 0.024;
  const rim = (s: 1 | -1) => (
    <group key={s} position={[s * 0.1, 0.0, z]}>
      <Box size={[0.15, 0.014, 0.012]} position={[0, 0.06, 0]} m={FRAME} shadow={false} />
      <Box size={[0.15, 0.014, 0.012]} position={[0, -0.06, 0]} m={FRAME} shadow={false} />
      <Box size={[0.014, 0.134, 0.012]} position={[0.068, 0, 0]} m={FRAME} shadow={false} />
      <Box size={[0.014, 0.134, 0.012]} position={[-0.068, 0, 0]} m={FRAME} shadow={false} />
      {glint >= 0 && glint <= 1 ? (
        <Box
          size={[0.024, 0.11, 0.004]}
          position={[(glint * 2 - 1) * 0.05 * -s, 0, 0.01]}
          rotation={[0, 0, 0.6]}
          m={m('#ffffff', 0.2, {emissive: '#fff4dc', glow: 1.4, opacity: 0.9})}
          shadow={false}
        />
      ) : null}
    </group>
  );
  return (
    <group>
      {rim(1)}
      {rim(-1)}
      <Box size={[0.06, 0.014, 0.012]} position={[0, 0.03, z]} m={FRAME} shadow={false} />
      {/* temples running back along the sides of the head */}
      {([1, -1] as const).map((s) => (
        <Box key={s} size={[0.012, 0.014, 0.2]} position={[s * (HEAD / 2 + 0.03), 0.04, HEAD / 2 - 0.08]} m={FRAME} shadow={false} />
      ))}
    </group>
  );
};

const HairGuy: React.FC<{c: string}> = ({c}) => {
  const H = HEAD / 2;
  const hm = m(c, 0.9);
  return (
    <group>
      <Box size={[HEAD + 0.03, 0.1, HEAD + 0.03]} position={[0, H - 0.03, 0]} m={hm} />
      <Box size={[HEAD + 0.03, 0.26, 0.05]} position={[0, H - 0.18, -H - 0.01]} m={hm} />
      {([1, -1] as const).map((s) => (
        <Box key={s} size={[0.04, 0.2, HEAD - 0.06]} position={[s * (H + 0.01), H - 0.15, -0.04]} m={hm} />
      ))}
      {/* fringe: stepped blocks over the forehead */}
      <Box size={[HEAD + 0.03, 0.05, 0.05]} position={[0, H - 0.07, H + 0.01]} m={hm} />
      <Box size={[0.2, 0.05, 0.04]} position={[-0.09, H - 0.115, H + 0.012]} m={hm} />
      <Box size={[0.08, 0.04, 0.035]} position={[0.07, H - 0.11, H + 0.014]} m={hm} />
      {([1, -1] as const).map((s) => (
        <Box key={s} size={[0.045, 0.12, 0.04]} position={[s * (H - 0.01), H - 0.13, H + 0.01]} m={hm} />
      ))}
    </group>
  );
};

const HairGirl: React.FC<{c: string}> = ({c}) => {
  const H = HEAD / 2;
  const hm = m(c, 0.75);
  return (
    <group>
      <Box size={[HEAD + 0.035, 0.1, HEAD + 0.035]} position={[0, H - 0.03, 0]} m={hm} />
      {/* long hair down the back, past the shoulders */}
      <Box size={[HEAD + 0.06, 0.66, 0.1]} position={[0, -0.12, -H - 0.03]} m={hm} />
      {([1, -1] as const).map((s) => (
        <group key={s}>
          <Box size={[0.05, 0.36, HEAD - 0.02]} position={[s * (H + 0.015), H - 0.2, -0.02]} m={hm} />
          {/* strands that fall forward over the shoulders */}
          <Box size={[0.07, 0.42, 0.08]} position={[s * (H - 0.01), -0.2, H - 0.06]} m={hm} />
        </group>
      ))}
      {/* side-swept fringe */}
      <Box size={[HEAD + 0.035, 0.05, 0.05]} position={[0, H - 0.07, H + 0.012]} m={hm} />
      <Box size={[0.26, 0.05, 0.045]} position={[0.08, H - 0.115, H + 0.014]} m={hm} />
      <Box size={[0.1, 0.04, 0.04]} position={[0.16, H - 0.155, H + 0.016]} m={hm} />
    </group>
  );
};

// headscarf (платок): over the top, the sides and the back, tied under the chin, grey hair showing at the front
const Scarf: React.FC<{c: string; hair: string}> = ({c, hair}) => {
  const H = HEAD / 2;
  const sm = m(c, 0.95);
  const dots = m('#e9c27a', 0.9);
  return (
    <group>
      <Box size={[HEAD + 0.05, 0.12, HEAD + 0.05]} position={[0, H - 0.02, -0.0]} m={sm} />
      <Box size={[HEAD + 0.05, 0.4, 0.05]} position={[0, H - 0.25, -H - 0.02]} m={sm} />
      {([1, -1] as const).map((s) => (
        <Box key={s} size={[0.05, 0.46, HEAD - 0.02]} position={[s * (H + 0.02), -0.04, -0.02]} m={sm} />
      ))}
      {/* the edge framing the face */}
      <Box size={[HEAD + 0.05, 0.05, 0.05]} position={[0, H - 0.06, H + 0.012]} m={sm} />
      {([1, -1] as const).map((s) => (
        <Box key={s} size={[0.06, 0.4, 0.05]} position={[s * (H - 0.01), -0.07, H + 0.012]} m={sm} />
      ))}
      {/* grey hair under the edge */}
      <Box size={[0.3, 0.035, 0.03]} position={[0, H - 0.105, H + 0.008]} m={m(hair, 0.9)} shadow={false} />
      {/* the knot under the chin and the two ends */}
      <Box size={[0.12, 0.08, 0.08]} position={[0, -H - 0.03, H - 0.02]} m={sm} />
      <Box size={[0.07, 0.12, 0.05]} position={[0.05, -H - 0.1, H - 0.01]} rotation={[0, 0, 0.3]} m={sm} />
      <Box size={[0.07, 0.1, 0.05]} position={[-0.05, -H - 0.09, H - 0.02]} rotation={[0, 0, -0.35]} m={sm} />
      {/* a few dots of pattern on the top and the back */}
      {[
        [-0.12, -0.1],
        [0.06, 0.08],
        [0.14, -0.12],
        [-0.04, 0.16],
      ].map(([x, zz], i) => (
        <Box key={i} size={[0.05, 0.008, 0.05]} position={[x, H + 0.042, zz]} m={dots} shadow={false} />
      ))}
      {[
        [-0.12, -0.08],
        [0.1, -0.2],
        [0.0, -0.32],
      ].map(([x, y], i) => (
        <Box key={i} size={[0.05, 0.05, 0.008]} position={[x, H + y, -H - 0.048]} m={dots} shadow={false} />
      ))}
    </group>
  );
};

export const Voxel: React.FC<{
  look: Look;
  position: V3;
  rotation?: number;
  pose?: Pose;
  face?: Face;
  glint?: number;
  rightHand?: React.ReactNode; // hand on the character's right (-x)
  leftHand?: React.ReactNode;
}> = ({look, position, rotation = 0, pose = {}, face = {}, glint, rightHand, leftHand}) => {
  const S = look.scale ?? 1;
  const legK = look.legK ?? 1;
  const W = look.wide ?? 1;
  const {head = [0, 0, 0], lean = 0, twist = 0, hipL = 0, hipR = 0, kneeL = 0, kneeR = 0} = pose;
  const {armL = [0, 0.06], armR = [0, 0.06], elbowL = 0.08, elbowR = 0.08} = pose;
  const thigh = LEG * legK;
  const shin = LEG * legK;
  const HIP = thigh + shin + SHOE_H;
  const top = m(look.top);
  const topDark = m(look.topDark);
  const legs = m(look.legs);
  const shoe = m(look.shoe, 0.7);
  const skin = m(look.skin, 0.8);
  const skirt = look.kind === 'granny';
  const upper = 0.3;
  const fore = 0.26;

  const arm = (side: 1 | -1, rot: [number, number], elbow: number, hand?: React.ReactNode) => (
    <group position={[(0.22 * W + 0.085) * side, TORSO - 0.06, 0]} rotation={[-rot[0], 0, rot[1] * side]}>
      {/* upper arm: sleeve over skin */}
      <Box size={[0.165, upper, 0.19]} position={[0, -upper / 2 + 0.03, 0]} m={look.sleeve > 0.4 ? top : skin} />
      {look.sleeve <= 0.4 ? <Box size={[0.175, 0.16, 0.2]} position={[0, -0.045, 0]} m={top} /> : null}
      <group position={[0, -upper + 0.04, 0]} rotation={[-elbow, 0, 0]}>
        <Box size={[0.155, fore, 0.18]} position={[0, -fore / 2, 0]} m={look.sleeve > 0.8 ? top : skin} />
        {look.sleeve > 0.8 ? <Box size={[0.165, 0.04, 0.19]} position={[0, -fore + 0.025, 0]} m={topDark} shadow={false} /> : null}
        {/* hand */}
        <Box size={[0.14, 0.1, 0.16]} position={[0, -fore - 0.045, 0]} m={skin} />
        <group position={[0, -fore - 0.09, 0.02]}>{hand}</group>
      </group>
    </group>
  );

  const leg = (side: 1 | -1, hip: number, knee: number) => (
    <group position={[0.105 * W * side, HIP, 0]} rotation={[-hip, 0, 0]}>
      <Box size={[0.2 * W, thigh + 0.02, 0.22]} position={[0, -thigh / 2, 0]} m={legs} />
      <group position={[0, -thigh, 0]} rotation={[knee, 0, 0]}>
        <Box size={[0.19 * W, shin, 0.21]} position={[0, -shin / 2, 0]} m={legs} />
        <Box size={[0.205 * W, SHOE_H, 0.27]} position={[0, -shin - SHOE_H / 2, 0.03]} m={shoe} />
      </group>
    </group>
  );

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={S}>
      {leg(1, hipL, kneeL)}
      {leg(-1, hipR, kneeR)}
      <group position={[0, HIP, 0]} rotation={[lean, twist, 0]}>
        {/* hips and torso */}
        <Box size={[0.44 * W, TORSO, 0.24]} position={[0, TORSO / 2, 0]} m={top} />
        {look.kind === 'guy' ? (
          <>
            {/* t-shirt hem and collar */}
            <Box size={[0.45 * W, 0.04, 0.25]} position={[0, 0.026, 0]} m={topDark} />
            <Box size={[0.16, 0.05, 0.012]} position={[0, TORSO - 0.03, 0.124]} m={skin} shadow={false} />
          </>
        ) : null}
        {look.kind === 'girl' ? (
          <>
            {/* coat: lapels, belt and buttons */}
            <Box size={[0.45 * W, 0.05, 0.25]} position={[0, 0.26, 0]} m={topDark} />
            <Box size={[0.08, 0.2, 0.012]} position={[-0.06, TORSO - 0.12, 0.124]} rotation={[0, 0, -0.3]} m={topDark} shadow={false} />
            <Box size={[0.08, 0.2, 0.012]} position={[0.06, TORSO - 0.12, 0.124]} rotation={[0, 0, 0.3]} m={topDark} shadow={false} />
            {/* the coat skirt over the thighs */}
            <Box size={[0.47 * W, 0.26, 0.27]} position={[0, -0.12, 0]} m={top} />
          </>
        ) : null}
        {skirt ? (
          <>
            {/* cardigan buttons and a long skirt */}
            {[0.12, 0.26, 0.4].map((y) => (
              <Box key={y} size={[0.035, 0.035, 0.012]} position={[0, y, 0.124]} m={m('#e8d9b8', 0.5)} shadow={false} />
            ))}
            <Box size={[0.46 * W, 0.05, 0.26]} position={[0, 0.031, 0]} m={topDark} />
          </>
        ) : null}
        {/* neck */}
        <Box size={[0.15, 0.08, 0.15]} position={[0, TORSO + 0.03, 0]} m={skin} />
        {arm(1, armL, elbowL, leftHand)}
        {arm(-1, armR, elbowR, rightHand)}
        <group position={[0, TORSO + 0.04, 0]} rotation={[head[0], head[1], head[2]]}>
          <group position={[0, HEAD / 2, 0]}>
            <Box size={[HEAD, HEAD, HEAD]} m={skin} />
            <FaceBlocks look={look} face={face} glint={glint} />
            {look.kind === 'guy' ? <HairGuy c={look.hair} /> : null}
            {look.kind === 'girl' ? <HairGirl c={look.hair} /> : null}
            {look.kind === 'granny' ? <Scarf c="#b8442a" hair={look.hair} /> : null}
          </group>
        </group>
      </group>
      {/* the granny's skirt hangs from the hips over the thighs */}
      {skirt ? <Skirt hip={HIP} hipL={hipL} hipR={hipR} W={W} c="#3a2f3a" /> : null}
    </group>
  );
};

// a skirt: one block over the thighs that follows them when she sits, and a front panel down to the knees
const Skirt: React.FC<{hip: number; hipL: number; hipR: number; W: number; c: string}> = ({hip, hipL, hipR, W, c}) => {
  const a = (hipL + hipR) / 2;
  const sm = m(c, 0.95);
  return (
    <group position={[0, hip, 0]} rotation={[-a, 0, 0]}>
      <Box size={[0.48 * W, LEG + 0.06, 0.27]} position={[0, -LEG / 2 + 0.01, 0]} m={sm} />
      {a > 0.6 ? <Box size={[0.48 * W, 0.2, 0.05]} position={[0, -LEG + 0.02, 0.16]} rotation={[a - 0.1, 0, 0]} m={sm} /> : null}
    </group>
  );
};

export const GUY: Look = {kind: 'guy', skin: '#e9b48e', top: '#1c1b1f', topDark: '#141317', legs: '#252b3d', shoe: '#d9d4c9', hair: '#16130f', sleeve: 0.3};
export const GIRL: Look = {kind: 'girl', skin: '#f0c3a0', top: '#c9a07a', topDark: '#9c7350', legs: '#2a2630', shoe: '#2b2522', hair: '#e8c66f', sleeve: 1, scale: 0.95};
export const GRANNY: Look = {
  kind: 'granny',
  skin: '#e5b494',
  top: '#6d5a48',
  topDark: '#54443a',
  legs: '#4a3b35',
  shoe: '#2a2220',
  hair: '#c9c4bb',
  sleeve: 1,
  scale: 0.92,
  legK: 0.86,
  wide: 1.06,
};
