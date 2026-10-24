import React from 'react';
import {Color} from 'three';
import {random} from 'remotion';
import {Box, Bush, Cone, Cyl, Tree} from './parts';
import {Dog, Person} from './Characters';
import {House, WindowSpec} from './House';
import {Airplane, Balloon, Birds, ChipBag, Flame, Leaves, LemonadeTable, Pool, SkyDome, Stars, TongueBubbles} from './Effects';
import {CameraRig, DAD, DOG, DOG_ROT, GIRL, POOL, SIDE_TABLE} from './CameraRig';
import {T, airAmount, inVacuum, lerp, ramp, worldTime} from '../timeline';

const HORIZON = '#d6e6f1';
const SUN_WARM = new Color('#fff1dc');
const SUN_SPACE = new Color('#ffffff');

const mainWindows: WindowSpec[] = [
  {x: -3.6, y: 1.6, w: 1.4, h: 1.5},
  {x: 3.6, y: 1.6, w: 1.4, h: 1.5},
  {x: 0, y: 1.15, w: 2.0, h: 2.2, door: true},
  {x: -3.6, y: 4.4, w: 1.4, h: 1.5},
  {x: 0, y: 4.4, w: 1.4, h: 1.5},
  {x: 3.6, y: 4.4, w: 1.4, h: 1.5},
];

const smallWindows: WindowSpec[] = [
  {x: -2.6, y: 1.5, w: 1.3, h: 1.4},
  {x: 2.6, y: 1.5, w: 1.3, h: 1.4},
  {x: -2.6, y: 3.9, w: 1.3, h: 1.3},
  {x: 2.6, y: 3.9, w: 1.3, h: 1.3},
];

// Wind in the trees: a light breeze, calm before the event, a strong gust when air comes back.
const treeSway = (v: number, seed: number) => {
  const wt = worldTime(v);
  if (v < T.airGone) return 0.035 * Math.sin(wt * 1.3 + seed) * (1 - ramp(v, 6, 8.5));
  if (v < T.airBack) return 0;
  const d = v - T.airBack;
  return -0.2 * Math.exp(-d * 0.8) * Math.cos(d * 4 + seed * 0.3);
};

const Ground: React.FC = () => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[600, 600]} />
      <meshStandardMaterial color="#76b351" roughness={1} />
    </mesh>
    {/* mowed lawn stripes */}
    {Array.from({length: 10}).map((_, i) => (
      <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-13.5 + i * 3 + 1.5, 0.004, 4]} receiveShadow>
        <planeGeometry args={[3, 26]} />
        <meshStandardMaterial color={i % 2 ? '#7fbf58' : '#6fa94b'} roughness={1} />
      </mesh>
    ))}
    {/* patio */}
    <Box size={[12, 0.1, 3.6]} position={[0, 0.05, -7.2]} color="#dcd8d0" />
    {/* street at the back */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, -26]} receiveShadow>
      <planeGeometry args={[600, 6]} />
      <meshStandardMaterial color="#b9b6ae" roughness={1} />
    </mesh>
  </>
);

const Grill: React.FC<{v: number}> = ({v}) => {
  const [x, , z] = [DAD[0], 0, DAD[2] + 0.85];
  return (
    <group position={[x, 0, z]}>
      {[-0.4, 0.4].map((lx) =>
        [-0.2, 0.2].map((lz) => <Box key={`${lx}${lz}`} size={[0.05, 0.78, 0.05]} position={[lx, 0.39, lz]} color="#2f3135" />),
      )}
      <Box size={[1.0, 0.36, 0.55]} position={[0, 0.96, 0]} color="#3a3d42" />
      <Box size={[0.94, 0.02, 0.5]} position={[0, 1.15, 0]} color="#1e1f22" shadow={false} />
      <group position={[0, 1.14, -0.28]} rotation={[-1.25, 0, 0]}>
        <Box size={[1.0, 0.06, 0.55]} position={[0, 0, 0.27]} color="#43474d" />
      </group>
      {[-0.25, 0.05, 0.3].map((bx, i) => (
        <Cyl key={i} rTop={0.09} rBottom={0.09} height={0.045} segments={8} position={[bx, 1.18, 0.05 * (i - 1)]} color="#6e3e22" />
      ))}
      <Flame position={[0, 1.13, 0]} t={worldTime(v)} visible={v < T.airGone} />
      <Box size={[0.3, 0.04, 0.2]} position={[0.75, 0.9, 0]} color="#3a3d42" />
    </group>
  );
};

const PatioTable: React.FC<{v: number}> = ({v}) => (
  <group position={[3.4, 0, -6.6]}>
    <Cyl rTop={0.6} rBottom={0.6} height={0.05} segments={10} position={[0, 0.76, 0]} color="#ffffff" />
    <Cyl rTop={0.04} rBottom={0.04} height={2.4} segments={6} position={[0, 1.2, 0]} color="#d0d0d0" />
    <Cone radius={1.5} height={0.5} segments={8} position={[0, 2.45, 0]} color="#3fa6b4" />
    <Box size={[0.5, 0.06, 0.5]} position={[-0.95, 0.46, 0.1]} color="#f5f5f5" />
    <Box size={[0.5, 0.5, 0.06]} position={[-0.95, 0.72, -0.15]} color="#f5f5f5" />
    <Box size={[0.5, 0.06, 0.5]} position={[0.95, 0.46, 0.1]} color="#f5f5f5" />
    <Box size={[0.5, 0.5, 0.06]} position={[0.95, 0.72, -0.15]} color="#f5f5f5" />
    <ChipBag position={[-0.15, 0.79, 0.15]} v={v} />
  </group>
);

const LoungeChair: React.FC = () => (
  <group position={[9.1, 0, 0.8]}>
    <Box size={[0.75, 0.1, 2.0]} position={[0, 0.4, 0.2]} color="#f2f0ea" />
    <group position={[0, 0.42, -0.75]} rotation={[0.55, 0, 0]}>
      <Box size={[0.75, 0.08, 0.9]} position={[0, 0, -0.3]} color="#f2f0ea" />
    </group>
    {[-0.3, 0.3].map((lx) =>
      [-0.6, 1.0].map((lz) => <Box key={`${lx}${lz}`} size={[0.05, 0.38, 0.05]} position={[lx, 0.19, lz]} color="#c9c9c9" />),
    )}
  </group>
);

export const World: React.FC<{v: number}> = ({v}) => {
  const air = airAmount(v);
  const wt = worldTime(v);
  const vac = inVacuum(v);
  const sunColor = SUN_WARM.clone().lerp(SUN_SPACE, 1 - air);

  // ----- Dad -----
  const flip = v < T.airGone ? Math.sin(wt * 3) : Math.sin(T.airGone * 3);
  const gasp = ramp(v, T.airBack, T.airBack + 0.6) * (1 - ramp(v, T.airBack + 1.5, T.airBack + 3.5));
  const dadChest =
    v < T.airBack ? 1 - 0.22 * ramp(v, 21, 24) : lerp(0.78, 1, ramp(v, T.airBack, T.airBack + 0.8)) + 0.12 * gasp;
  const dadMouth =
    v < T.airBack
      ? ramp(v, 21, 22.2) * 0.9 - ramp(v, 23, 26) * 0.35
      : 0.55 + 0.45 * gasp - 0.55 * ramp(v, T.airBack + 2.5, T.airBack + 4.5);
  const dadHead =
    v < T.airBack
      ? lerp(0.32, -0.18, ramp(v, 9.5, 11.5))
      : lerp(-0.18, 0.05, ramp(v, T.airBack + 1, T.airBack + 3));
  const dadEyes = v < T.airGone ? 1 : v < T.airBack ? 1 + 0.75 * ramp(v, 12.3, 15) : lerp(1.75, 1.15, ramp(v, T.airBack, T.airBack + 4));
  const armRelax = ramp(v, T.airBack + 1.5, T.airBack + 3.5);

  // ----- Girl -----
  const girlArm = lerp(1.55, 0.2, armRelax);
  const girlElbow = lerp(0.25, 0.1, armRelax);
  const girlMouth = ramp(v, 26.7, 27.6) * 0.8 * (1 - ramp(v, 40, 44)) + 0.5 * gasp;

  // ----- Dog -----
  const walk = ramp(v, 0, 5.5, (t) => t);
  const dogStart: [number, number, number] = [-0.6, 0, -0.9];
  const dogPos: [number, number, number] = [lerp(dogStart[0], DOG[0], walk), 0, lerp(dogStart[2], DOG[2], walk)];
  const walkHeading = Math.atan2(DOG[0] - dogStart[0], DOG[2] - dogStart[2]);
  const dogRot = lerp(walkHeading, DOG_ROT, ramp(v, 5.2, 6.4));
  const dogHead = v < T.airBack ? lerp(0.05, -0.45, ramp(v, 6.6, 7.6)) : lerp(-0.45, 0, ramp(v, T.airBack + 0.5, T.airBack + 2));
  const wag = v < 7.5 ? Math.sin(wt * 14) * 0.5 : v > T.airBack + 3 ? Math.sin(wt * 14) * 0.4 : 0;
  const shakeEnv = ramp(v, T.airBack + 1.2, T.airBack + 1.6) * (1 - ramp(v, T.airBack + 2.6, T.airBack + 3.2));
  const dogShake = Math.sin(v * 38) * 0.28 * shakeEnv;

  return (
    <>
      <CameraRig v={v} />
      <SkyDome vacuum={1 - air} />
      <Stars opacity={Math.max(0, 1 - air * 1.6) * 0.95} />
      <fog attach="fog" args={[HORIZON, 45, 170]} color={HORIZON} near={45} far={vac ? 100000 : lerp(2000, 170, air)} />

      <hemisphereLight color="#e4f0fb" groundColor="#7a9a5c" intensity={0.12 + 0.95 * air} />
      <ambientLight intensity={0.04 + 0.1 * air} />
      <directionalLight
        position={[14, 22, 12]}
        color={sunColor}
        intensity={2.3 + (1 - air) * 1.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />

      <Ground />

      <House id="main" position={[0, 0, -12.5]} size={[11, 6.2, 7]} windows={mainWindows} burstAt={40.5} v={v} />
      <House id="left" position={[-18, 0, -15]} rotation={0.25} size={[9, 5.4, 8]} windows={smallWindows} burstAt={41.1} v={v} roof="#b9917a" />
      <House id="right" position={[18, 0, -16]} rotation={-0.2} size={[10, 5.6, 8]} windows={smallWindows} burstAt={41.4} v={v} />
      <House id="far1" position={[-7, 0, -36]} size={[9, 5, 8]} windows={smallWindows} burstAt={41.7} v={v} roof="#b9917a" />
      <House id="far2" position={[11, 0, -37]} size={[8, 5, 7]} windows={smallWindows} burstAt={41.9} v={v} />

      <Tree position={[-8.5, 0, -5]} size={1.1} sway={treeSway(v, 1)} seed={0.3} />
      <Tree position={[-11.5, 0, 5]} size={0.9} sway={treeSway(v, 2)} seed={1.1} />
      <Tree position={[12.5, 0, -5]} size={1.0} sway={treeSway(v, 3)} seed={2.2} />
      <Tree position={[13.5, 0, 7]} size={0.85} sway={treeSway(v, 4)} seed={0.7} />
      <Tree position={[-25, 0, -22]} size={1.4} sway={treeSway(v, 5)} seed={1.7} />
      <Tree position={[24, 0, -26]} size={1.3} sway={treeSway(v, 6)} seed={2.9} />
      <Tree position={[2, 0, -31]} size={1.5} sway={treeSway(v, 7)} seed={0.2} />
      <Tree position={[-14, 0, -30]} size={1.2} sway={treeSway(v, 8)} seed={1.4} />
      <Bush position={[-5.8, 0, -8.5]} flowers seed={0.4} />
      <Bush position={[5.9, 0, -8.5]} flowers seed={1.3} />
      <Bush position={[-9.5, 0, -8.8]} size={1.2} seed={2.1} />
      <Bush position={[9.8, 0, -8.6]} size={1.1} seed={0.9} />
      <Bush position={[-12, 0, 0]} size={1.3} seed={1.9} />
      <Bush position={[12.2, 0, 1.5]} size={1.2} flowers seed={2.6} />

      <Grill v={v} />
      <PatioTable v={v} />
      <Pool position={POOL} size={[3.6, 7]} v={v} />
      <LoungeChair />
      <LemonadeTable position={SIDE_TABLE} v={v} />

      <Person
        position={DAD}
        shirt="#f0b24a"
        pants="#9ec0e6"
        hair="#8a5a34"
        pose={{
          armR: [lerp(0.95 + 0.22 * flip, 0.1, armRelax), -0.1],
          elbowR: lerp(0.7, 0.1, armRelax),
          armL: [lerp(0.5, 0.05, armRelax), 0.1],
          elbowL: lerp(0.6, 0.1, armRelax),
          head: [dadHead, 0],
          chest: dadChest,
          mouth: Math.max(0, dadMouth),
          eyes: dadEyes,
        }}
        rightHand={
          <group rotation={[1.2, 0, 0]}>
            <Box size={[0.03, 0.03, 0.32]} position={[0, 0, 0.16]} color="#5b3a24" shadow={false} />
            <Box size={[0.12, 0.01, 0.12]} position={[0, 0, 0.36]} color="#c8c8c8" shadow={false} />
          </group>
        }
      />
      <Person
        position={GIRL}
        rotation={-0.35}
        scale={0.62}
        child
        longHair
        shirt="#e985a6"
        pants="#5c6fa8"
        hair="#5a3a22"
        pose={{
          armR: [girlArm, -0.15],
          elbowR: girlElbow,
          head: [lerp(-0.45, 0, armRelax), 0.1],
          mouth: girlMouth,
          eyes: v > 26.6 && v < T.airBack + 3 ? 1.5 : 1,
        }}
        rightHand={<Balloon v={v} counterPitch={girlArm + girlElbow} scaleFix={1 / 0.62} />}
      />
      <Person
        position={[9.1, 0.62, 0.9]}
        lying
        shirt="#ffffff"
        pants="#4d8fb0"
        hair="#c99b52"
        skin="#e8c4a2"
        pose={{
          armL: [0.1, 0.25],
          armR: [0.1, -0.25],
          mouth: 0.5 * gasp + (vac ? 0.3 * ramp(v, 21, 23) : 0),
          eyes: vac ? 1.5 : 1,
          chest: v < T.airBack ? 1 - 0.18 * ramp(v, 21, 24) : 1,
        }}
      />
      <Dog
        position={dogPos}
        rotation={dogRot}
        pose={{
          head: dogHead,
          tail: wag,
          legPhase: walk < 1 ? wt * 12 : 0,
          tongue: 1,
          shake: dogShake,
        }}
        tongueBubbles={<TongueBubbles v={v} />}
      />

      <Birds v={v} />
      <Airplane v={v} />
      <Leaves v={v} />
      {/* a few seeded flowers in the lawn */}
      {Array.from({length: 24}).map((_, i) => (
        <Cyl
          key={i}
          rTop={0.05}
          rBottom={0.05}
          height={0.04}
          segments={5}
          position={[(random(`fl-x-${i}`) - 0.5) * 22, 0.03, -3 + random(`fl-z-${i}`) * 16]}
          color={i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#f6e08a' : '#f2a6c4'}
          shadow={false}
        />
      ))}
    </>
  );
};
