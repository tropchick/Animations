import React from 'react';
import {Ball, G, Pill, mat} from './kit';
import type {V3} from './cues';

// Cartoon eyes, brows and mouths placed on a head sphere of radius R (head centre at the origin, face towards +z).

export type Expr = {
  lid?: number; // upper lids 0 open .. 1 shut
  lidL?: number;
  lidR?: number;
  wide?: number; // 0 .. 1 eyes wide open (lids pulled back, pupils smaller)
  happy?: number; // 0 .. 1 lower lids up (smiling eyes)
  tilt?: number; // lid tilt: + angry (inner corners down), − sad
  look?: [number, number]; // pupils: x right, y up (radians)
  brow?: number; // brows up (+) / down (−), in R units
  browIn?: number; // inner ends: + up (worried), − down (angry)
  mouth?: number; // 0 shut .. 1 wide open
  smile?: number; // −1 frown .. 1 big smile
  o?: number; // 0 .. 1 round "O" mouth instead of a D
  chew?: number; // jaw side wobble
  blush?: number;
};

export type FaceStyle = {
  R: number;
  skin: string;
  eyeR: number;
  spread: number; // eye yaw from the middle (rad)
  eyeUp: number; // eye pitch (rad)
  iris: string;
  lash?: string;
  brow: string;
  browLen: number;
  browR: number;
  mouthW: number;
  mouthDown: number; // mouth pitch below the middle (rad)
  lip?: string;
  nose?: {color: string; r: V3; up: number};
  blush?: string;
  sclera?: string;
  embed?: number; // how deep the eyeball sits (in eye radii), default 0.42
  irisK?: number; // iris size (eye radii), default 0.6
  browArc?: number; // brow arch (rad of arc), default 0.9
};

const dir = (yaw: number, pitch: number, r: number): V3 => [Math.sin(yaw) * Math.cos(pitch) * r, Math.sin(pitch) * r, Math.cos(yaw) * Math.cos(pitch) * r];

// a frame on the sphere surface: its +z is the outward normal
const Spot: React.FC<{yaw: number; pitch: number; r: number; children: React.ReactNode; roll?: number}> = ({yaw, pitch, r, children, roll = 0}) => (
  <group position={dir(yaw, pitch, r)} rotation={[-pitch, yaw, roll, 'YXZ']}>
    {children}
  </group>
);

const Eye: React.FC<{s: FaceStyle; side: 1 | -1; e: Expr}> = ({s, side, e}) => {
  const r = s.eyeR;
  const lidK = (side === 1 ? e.lidR : e.lidL) ?? e.lid ?? 0;
  const wide = e.wide ?? 0;
  const happy = e.happy ?? 0;
  const lid = Math.min(1, Math.max(0, lidK));
  // upper lid: its front edge sits at elevation −th; −1.3 fully open, +1.4 shut
  const th = -1.25 - 0.15 * wide + (1.4 + 1.25) * lid;
  const tilt = (e.tilt ?? 0) * side;
  const lx = (e.look?.[0] ?? 0) + 0.06 * side * 0;
  const ly = e.look?.[1] ?? 0;
  const ik = s.irisK ?? 0.6;
  const pupil = 0.6 * ik * (1 - 0.25 * wide);
  // lower lid: its front edge sits at elevation −th2; 1.3 hidden below the eye .. 0.15 high (happy squint)
  const th2 = 1.3 - 1.15 * happy;
  return (
    <Spot yaw={s.spread * side} pitch={s.eyeUp} r={s.R - r * (s.embed ?? 0.42)}>
      <Ball scale={r} color={s.sclera ?? '#fbfaf5'} look={{rough: 0.35}} shadow={false} />
      <group rotation={[-ly, lx, 0, 'YXZ']}>
        <Ball position={[0, 0, r * (1.06 - ik)]} scale={r * ik} color={s.iris} look={{rough: 0.3}} shadow={false} />
        <Ball position={[0, 0, r * (1.1 - pupil)]} scale={r * pupil} color="#120c0a" look={{rough: 0.2}} shadow={false} />
      </group>
      <Ball position={[r * 0.24 * side * 0 + r * 0.22, r * 0.3, r * 1.0]} scale={r * 0.14} color="#ffffff" look={{basic: true}} shadow={false} />
      <Ball position={[-r * 0.18, -r * 0.2, r * 1.0]} scale={r * 0.07} color="#ffffff" look={{basic: true}} shadow={false} />
      {/* upper lid */}
      <group rotation={[0, 0, tilt]}>
        <group rotation={[th, 0, 0]}>
          <mesh geometry={G.hemi(24)} scale={r * 1.08} material={mat(s.skin)} />
          {s.lash ? <mesh rotation={[Math.PI / 2, 0, 0]} geometry={G.torus(r * 1.08, r * 0.09, Math.PI, 24)} material={mat(s.lash, {rough: 0.6})} /> : null}
        </group>
      </group>
      {/* lower lid */}
      <group rotation={[0, 0, -tilt * 0.4]}>
        <group rotation={[th2, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI]} geometry={G.hemi(24)} scale={r * 1.07} material={mat(s.skin)} />
        </group>
      </group>
    </Spot>
  );
};

const Brow: React.FC<{s: FaceStyle; side: 1 | -1; e: Expr}> = ({s, side, e}) => {
  const up = (e.brow ?? 0) + 0.04 * (e.wide ?? 0);
  const inner = e.browIn ?? 0;
  const pitch = s.eyeUp + (s.eyeR / s.R) * 1.75 + up;
  const arc = s.browArc ?? 0.9;
  const arcR = s.browLen / 2 / Math.sin(arc / 2);
  return (
    <Spot yaw={s.spread * side * 1.05} pitch={pitch} r={s.R + s.browR * 0.1} roll={-inner * side}>
      <group position={[0, -arcR * Math.cos(arc / 2), 0]}>
        <mesh rotation={[0, 0, Math.PI / 2 - arc / 2]} geometry={G.torus(arcR, s.browR, arc, 16)} material={mat(s.brow, {rough: 0.8})} />
      </group>
    </Spot>
  );
};

const Mouth: React.FC<{s: FaceStyle; e: Expr}> = ({s, e}) => {
  const open = Math.max(0, Math.min(1, e.mouth ?? 0));
  const smile = e.smile ?? 0;
  const o = e.o ?? 0;
  const W = s.mouthW;
  const lip = s.lip ?? '#5a2a26';
  const chew = e.chew ?? 0;
  const pitch = -s.mouthDown;
  const pieces: React.ReactNode[] = [];
  if (open > 0.04) {
    // the opening: a D for laughing/talking, an O for screaming
    const w = W * (0.5 - 0.22 * o) * (1 + 0.15 * smile);
    const h = s.R * (0.04 + 0.2 * open) * (1 + 0.35 * o);
    const yC = -h * 0.35 * (1 - o);
    pieces.push(
      <group key="open" position={[chew * W * 0.08, yC, -s.R * 0.006]}>
        <Ball scale={[w, h, s.R * 0.06]} color="#3b0d12" look={{rough: 0.9}} shadow={false} />
        <Ball position={[0, -h * 0.55, s.R * 0.012]} scale={[w * 0.62, h * 0.42, s.R * 0.05]} color="#d9636b" look={{rough: 0.6}} shadow={false} />
        {o < 0.5 ? <Ball position={[0, h * 0.72, s.R * 0.014]} scale={[w * 0.72, h * 0.22, s.R * 0.05]} color="#fbf6ee" look={{rough: 0.4}} shadow={false} /> : null}
      </group>,
    );
  } else if (Math.abs(smile) < 0.08) {
    pieces.push(<Pill key="line" rotation={[0, 0, Math.PI / 2]} r={s.R * 0.018} len={W * 0.7} color={lip} shadow={false} />);
  } else {
    const a = 0.35 + 0.8 * Math.min(1, Math.abs(smile));
    const rr = W / 2 / Math.sin(a);
    const up = smile > 0;
    pieces.push(
      <group key="arc" position={[0, (up ? 1 : -1) * rr * (1 + Math.cos(a)) * 0.5, 0]}>
        <mesh
          rotation={[0, 0, up ? -Math.PI / 2 - a : Math.PI / 2 - a]}
          geometry={G.torus(rr, s.R * 0.02, 2 * a, 24)}
          material={mat(lip)}
        />
      </group>,
    );
  }
  return (
    <Spot yaw={0} pitch={pitch} r={s.R - s.R * 0.01}>
      {pieces}
    </Spot>
  );
};

export const Face: React.FC<{s: FaceStyle; e: Expr; noMouth?: boolean}> = ({s, e, noMouth}) => (
  <group>
    <Eye s={s} side={1} e={e} />
    <Eye s={s} side={-1} e={e} />
    <Brow s={s} side={1} e={e} />
    <Brow s={s} side={-1} e={e} />
    {noMouth ? null : <Mouth s={s} e={e} />}
    {s.nose ? (
      <Spot yaw={0} pitch={s.nose.up} r={s.R * 0.97}>
        <Ball scale={s.nose.r} color={s.nose.color} shadow={false} />
      </Spot>
    ) : null}
    {s.blush && (e.blush ?? 0.6) > 0.02
      ? ([1, -1] as const).map((side) => (
          <Spot key={side} yaw={s.spread * 1.25 * side} pitch={s.eyeUp - 0.42} r={s.R * 0.985}>
            <Ball scale={[s.R * 0.16, s.R * 0.1, s.R * 0.03]} color={s.blush!} look={{opacity: 0.55 * (e.blush ?? 0.6), rough: 0.9}} shadow={false} />
          </Spot>
        ))
      : null}
  </group>
);

export {Spot, dir};
