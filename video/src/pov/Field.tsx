import React, {useMemo} from 'react';
import {random} from 'remotion';
import {Box, Cone, Tree} from '../scene/parts';
import {Extra} from './cast';
import {Crowd, CrowdMember, outfit} from './Crowd';
import {Ground, Sky, Sun} from './env';
import {TripodCam, groundTextTexture} from './props';
import {ShotState, V3, clamp01, ramp, shotEnd, shotStart, smooth, wordStart} from './cues';

// A green field with a huge white circle; 100 people stand on it, whoever leaves last takes the prize.
export const RING_R = 14;
const N = 100;
// the two who stay to the end
export const FINALISTS = [0, 4];

const angleOf = (i: number) => (i / N) * Math.PI * 2;
export const memberPos = (i: number, r = RING_R - 0.45): V3 => [Math.sin(angleOf(i)) * r, 0, Math.cos(angleOf(i)) * r];

// when each person walks away: ten during "через час их девяносто", the rest until "двое"
const LEAVE: number[] = (() => {
  const a0 = wordStart(58) + 0.15;
  const a1 = wordStart(61) + 0.3;
  const b0 = wordStart(62) + 0.05;
  const b1 = wordStart(65) + 0.1;
  const order = Array.from({length: N}, (_, i) => i).filter((i) => !FINALISTS.includes(i));
  order.sort((x, y) => random(`leave-${x}`) - random(`leave-${y}`));
  const out = new Array(N).fill(1e9);
  order.forEach((i, k) => {
    out[i] = k < 10 ? a0 + ((a1 - a0) * k) / 10 : b0 + ((b1 - b0) * (k - 10)) / (order.length - 10);
  });
  return out;
})();

export const inCircleAt = (v: number) => LEAVE.filter((t) => t > v).length;

export const Field: React.FC<{v: number; s: ShotState}> = ({v, s}) => {
  const members: CrowdMember[] = useMemo(
    () =>
      Array.from({length: N}, (_, i) => {
        const p = memberPos(i);
        return {p, yaw: Math.atan2(-p[0], -p[2]), ...outfit(i, 'field')};
      }),
    [],
  );
  // sun crosses the sky during the timelapse (morning in the east, afternoon in the west)
  const day = smooth(ramp(v, shotStart('timelapse'), shotEnd('timelapse')));
  const sunA = -1.1 + 2.0 * day;
  const sunPos: V3 = [Math.sin(sunA) * 30, 26 + 8 * Math.sin(Math.PI * day), Math.cos(sunA) * 14 + 10];
  const prize = groundTextTexture('ПРИЗ: $500 000', 2048, 400, 'bold 230px Inter, Arial, sans-serif');
  const pose = (i: number) => {
    if (FINALISTS.includes(i)) return {hidden: true};
    const d = v - LEAVE[i];
    if (d > 0.55) return {hidden: true};
    if (d > 0) {
      // walk off outward
      const p = memberPos(i, RING_R - 0.45 + clamp01(d / 0.55) * 7);
      return {p, yaw: Math.atan2(p[0], p[2]), legSwing: Math.sin(d * 22) * 0.5, arm: Math.sin(d * 22) * 0.4, bend: 0.05};
    }
    return {bend: 0.02 * Math.sin(v * 1.3 + i), arm: 0.05 * Math.sin(v * 1.7 + i * 2)};
  };
  const sleeperSway = Math.sin(v * 1.1) * 0.05;
  const trees = useMemo(
    () =>
      Array.from({length: 26}, (_, i) => {
        const a = (i / 26) * Math.PI * 2 + random(`ft-a-${i}`) * 0.2;
        const r = 55 + random(`ft-r-${i}`) * 30;
        return {p: [Math.sin(a) * r, 0, Math.cos(a) * r] as V3, size: 1.4 + random(`ft-s-${i}`) * 1.2, seed: i};
      }),
    [],
  );
  return (
    <group>
      <Sky top="#5fa9ea" horizon="#d9eefc" />
      <hemisphereLight color="#eaf4ff" groundColor="#6f8a50" intensity={0.85} />
      <ambientLight intensity={0.1} />
      <Sun position={sunPos} target={[0, 0, 0]} intensity={2.4} size={24} />
      <Ground color="#6fae4f" />
      {/* the circle and the prize painted on the grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <ringGeometry args={[RING_R - 0.2, RING_R + 0.2, 128]} />
        <meshStandardMaterial color="#ffffff" roughness={1} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -3.5]}>
        <planeGeometry args={[15, 2.9]} />
        <meshStandardMaterial map={prize} transparent roughness={1} polygonOffset polygonOffsetFactor={-4} depthWrite={false} />
      </mesh>
      {/* film crew: cameras around, a tent */}
      {[0.5, 1.6, 2.7, 3.8, 4.9, 6.0].map((a, k) => {
        const p: V3 = [Math.sin(a) * 18.5, 0, Math.cos(a) * 18.5];
        return <TripodCam key={k} position={p} yaw={Math.atan2(-p[0], -p[2])} rec height={1.6} />;
      })}
      <group position={[-22, 0, -14]} rotation={[0, 0.6, 0]}>
        <Box size={[4, 2.2, 3]} position={[0, 1.1, 0]} color="#f4f1ea" />
        <Cone radius={3.1} height={1.2} segments={4} position={[0, 2.8, 0]} rotation={[0, Math.PI / 4, 0]} color="#e9563c" />
      </group>
      {trees.map((t) => (
        <Tree key={t.seed} position={t.p} size={t.size} seed={t.seed} />
      ))}
      <Crowd members={members} pose={pose} />
      {/* the finalists */}
      <group position={memberPos(FINALISTS[0])} rotation={[0, Math.atan2(-memberPos(FINALISTS[0])[0], -memberPos(FINALISTS[0])[2]), 0]}>
        <group rotation={[sleeperSway, 0, sleeperSway * 0.6]}>
          <Extra position={[0, 0, 0]} shirt="#e88d3a" pants="#2f3a52" hair="#2e2620" skin="#e2b892" pose={{eyes: 0.1, head: [0.38, 0.1], mouth: 0.35, armL: [0.05, 0.08], armR: [0.05, -0.08]}} />
        </group>
      </group>
      <Extra
        position={memberPos(FINALISTS[1])}
        rotation={Math.atan2(-memberPos(FINALISTS[1])[0], -memberPos(FINALISTS[1])[2])}
        shirt="#7c5cc4"
        pants="#3b3f47"
        hair="#c9a46a"
        skin="#f3dcc4"
        pose={{eyes: s.name === 'sleeper' ? 0.6 : 0.9, head: [0.1, s.name === 'sleeper' ? 0.55 : 0], armL: [0.1, 0.1], armR: [0.1, -0.1]}}
      />
    </group>
  );
};
