import React from 'react';
import {Box, Cyl, Pic} from './common';
import {C, V3, easeOut, lerp, ramp, smooth} from './cues';
import {HotDog, SIT, Woman} from './people';
import {drawBoard, drawMetroSign, tex} from './tex';

// Moscow-style metro: the platform (train along x on z = 5) and, far away, the inside of a car.
const CAR_L = 19.5;
const GAP = 0.6;
export const TRAIN_STOP_X = 6; // the front of the train stops here

export const trainFront = (v: number) => {
  const k = ramp(v, C.trainIn, C.trainStop);
  return lerp(-140, TRAIN_STOP_X + CAR_L * 0.5, easeOut(k));
};

const Car: React.FC<{x: number; doors: number}> = ({x, doors}) => (
  <group position={[x, 0, 5]}>
    <Box size={[CAR_L, 2.9, 2.7]} position={[0, 1.65, 0]} color="#2a5aa8" />
    <Box size={[CAR_L - 0.4, 0.5, 2.72]} position={[0, 0.45, 0]} color="#1a3a72" />
    <Box size={[CAR_L + 0.02, 0.18, 2.74]} position={[0, 2.0, 0]} color="#e8e8e8" />
    {/* windows on the platform side (-z), lit from inside */}
    {[-7.5, -4.5, -1.5, 1.5, 4.5, 7.5].map((wx) => (
      <Box key={wx} size={[1.6, 0.7, 0.02]} position={[wx, 2.35, -1.39]} color="#ffe9b8" emissive="#ffe0a0" emissiveIntensity={0.9} shadow={false} />
    ))}
    {/* doors: two leaves each, sliding apart */}
    {[-6, 0, 6].map((dx) => (
      <group key={dx} position={[dx, 0, -1.37]}>
        <Box size={[0.66, 2.1, 0.04]} position={[-0.34 - doors * 0.6, 1.35, 0]} color="#c8ccd4" />
        <Box size={[0.66, 2.1, 0.04]} position={[0.34 + doors * 0.6, 1.35, 0]} color="#c8ccd4" />
        <Box size={[1.2, 2.1, 0.02]} position={[0, 1.35, 0.03]} color="#ffe9b8" emissive="#ffe0a0" emissiveIntensity={0.6 * doors} shadow={false} />
      </group>
    ))}
  </group>
);

export const Platform: React.FC<{v: number}> = ({v}) => {
  const front = trainFront(v);
  const doors = smooth(ramp(v, C.doors, C.doors + 0.6));
  const sign = tex('metro-sign', 900, 120, drawMetroSign);
  const board = tex('metro-board', 300, 90, drawBoard);
  return (
    <group>
      <color attach="background" args={['#0c0c10']} />
      {/* platform, edge stripe, track pit, back wall across the tracks */}
      <Box size={[90, 0.4, 7]} position={[0, -0.2, 0]} color="#b8a8a0" />
      <Box size={[90, 0.02, 0.3]} position={[0, 0.01, 3.3]} color="#f2c14e" shadow={false} />
      <Box size={[90, 0.2, 5]} position={[0, -1.3, 5.9]} color="#3a3a3e" />
      <Box size={[90, 7, 0.4]} position={[0, 2.3, 8.6]} color="#d8cfc0" />
      <Pic size={[7.5, 1]} map={sign} position={[0, 3.3, 8.39]} rotation={[0, Math.PI, 0]} lit />
      <Box size={[90, 7, 0.4]} position={[0, 2.3, -3.8]} color="#d8cfc0" />
      {/* vault and lamps */}
      <Box size={[90, 0.3, 13]} position={[0, 5.3, 2.4]} color="#e8e2d6" />
      {Array.from({length: 18}).map((_, i) => (
        <Box key={i} size={[1.6, 0.08, 0.5]} position={[-42 + i * 5, 5.1, 1.2]} color="#fff6e0" emissive="#fff0c8" emissiveIntensity={1.6} shadow={false} />
      ))}
      {/* marble columns on the platform's back side */}
      {Array.from({length: 18}).map((_, i) => (
        <Box key={i} size={[0.9, 5.2, 0.9]} position={[-42 + i * 5, 2.6, -2.6]} color="#e0d6c8" />
      ))}
      <Pic size={[1.6, 0.48]} map={board} position={[-4, 4.2, 8.38]} rotation={[0, Math.PI, 0]} />
      {/* the train: three cars */}
      {[0, 1, 2].map((k) => (
        <Car key={k} x={front - CAR_L / 2 - k * (CAR_L + GAP)} doors={doors} />
      ))}
      {/* people waiting */}
      {[
        [-6, 1.8, 0],
        [-3.5, 2.3, 1],
        [-1.4, 1.4, 2],
        [3.2, 2.2, 3],
        [5.5, 1.6, 4],
        [8, 2.4, 5],
        [-9, 1.2, 6],
      ].map(([x, z, i]) => (
        <Woman key={i} i={i + 3} position={[x, 0, z]} rotation={0.2 * Math.sin(i * 3)} pose={{head: [0.05, 0.3 * Math.sin(i)], armR: [0.6, -0.1], elbowR: 1.2}} />
      ))}
      <hemisphereLight color="#fff4e2" groundColor="#6a5a4a" intensity={0.9} />
      <pointLight position={[0, 4.6, 1]} intensity={20} distance={18} color="#fff0d0" />
      <pointLight position={[-10, 4.6, 1]} intensity={14} distance={16} color="#fff0d0" />
      <pointLight position={[10, 4.6, 1]} intensity={14} distance={16} color="#fff0d0" />
    </group>
  );
};

// ---------------------------------------------------------------- inside a car (its own place)
export const WAGON: V3 = [0, 0, 400];
const SEAT = '#3a6ac8';

export const Wagon: React.FC<{v: number; hotdog?: boolean}> = ({v, hotdog = false}) => {
  const sway = 0.01 * Math.sin(v * 1.7);
  const streak = (v * 23) % 6;
  return (
    <group position={WAGON} rotation={[0, 0, sway]}>
      <color attach="background" args={['#050507']} />
      <Box size={[18, 0.1, 2.7]} position={[0, -0.05, 0]} color="#5a5a60" />
      <Box size={[18, 0.1, 2.7]} position={[0, 2.45, 0]} color="#e8e8e2" />
      <Box size={[0.1, 2.5, 2.7]} position={[-9, 1.2, 0]} color="#c8ccd0" />
      <Box size={[0.1, 2.5, 2.7]} position={[9, 1.2, 0]} color="#c8ccd0" />
      {[-1, 1].map((s) => (
        <group key={s}>
          {/* side wall: panel below, dark window band with light streaks, panel above */}
          <Box size={[18, 1.0, 0.08]} position={[0, 0.5, s * 1.35]} color="#d8d4c8" />
          <Box size={[18, 0.9, 0.04]} position={[0, 1.45, s * 1.37]} color="#0c0e12" />
          {[0, 1, 2].map((k) => (
            <Box key={k} size={[0.8, 0.04, 0.02]} position={[-9 + ((streak + k * 6.1) % 18), 1.5 + k * 0.15, s * 1.34]} color="#ffd890" emissive="#ffc870" emissiveIntensity={2} shadow={false} />
          ))}
          <Box size={[18, 0.5, 0.08]} position={[0, 2.15, s * 1.35]} color="#d8d4c8" />
          {/* long bench */}
          <Box size={[16, 0.12, 0.5]} position={[0, 0.48, s * 1.05]} color={SEAT} />
          <Box size={[16, 0.45, 0.1]} position={[0, 0.78, s * 1.27]} color={SEAT} />
          <Box size={[16, 0.42, 0.4]} position={[0, 0.21, s * 1.1]} color="#4a4a52" />
          {/* handrail */}
          <Cyl rTop={0.02} rBottom={0.02} height={18} position={[0, 2.0, s * 0.8]} rotation={[0, 0, Math.PI / 2]} color="#d8dce2" />
        </group>
      ))}
      {[-6, -2, 2, 6].map((x) => (
        <Cyl key={x} rTop={0.025} rBottom={0.025} height={2.5} position={[x, 1.2, 0]} color="#d8dce2" />
      ))}
      {[-6, 0, 6].map((x) => (
        <Box key={x} size={[4.5, 0.04, 0.35]} position={[x, 2.39, 0]} color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} shadow={false} />
      ))}
      {/* passengers: sitting, looking at their phones */}
      {[
        [-7.4, -1, 0],
        [-5.2, -1, 1],
        [-2.4, -1, 2],
        [3.5, -1, 3],
        [6.4, -1, 4],
        [-6.2, 1, 5],
        [-3.4, 1, 6],
        [-0.8, 1, 7],
        [5.6, 1, 8],
        [7.6, 1, 9],
      ].map(([x, s, i]) => (
        <Woman
          key={i}
          i={i + 20}
          position={[x, -0.26, s * 0.98]}
          rotation={s > 0 ? Math.PI : 0}
          pose={{...SIT, head: [0.45, 0], armL: [0.9, 0.15], armR: [0.9, -0.15], elbowL: 0.9, elbowR: 0.9}}
          rightHand={<Box size={[0.08, 0.15, 0.012]} position={[-0.04, -0.04, 0.06]} rotation={[0.3, 0, 0]} color="#16171b" />}
        />
      ))}
      {hotdog ? <HotDog position={[1.6, -0.06, -0.95]} rotation={0} sit sad={smooth(ramp(v, C.sad, C.sad + 1.2))} /> : null}
      <hemisphereLight color="#ffffff" groundColor="#7a7a80" intensity={1.0} />
      <pointLight position={[0, 2.2, 0]} intensity={8} distance={12} color="#f4f8ff" />
      <pointLight position={[-6, 2.2, 0]} intensity={6} distance={10} color="#f4f8ff" />
      <pointLight position={[6, 2.2, 0]} intensity={6} distance={10} color="#f4f8ff" />
    </group>
  );
};
