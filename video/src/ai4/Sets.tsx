import React from 'react';
import {Block, Box, Car, Cyl, DayLights, Ground, Ico, Pic, Sky, SunLight, Tree} from '../lastman/common';
import type {SkyCols} from '../lastman/common';
import {Person} from '../scene/Characters';
import {SHIRTS, PANTS, HAIR, SKINS, walk} from '../lastman/people';
import {EV, P, V3, clamp01, easeIn, easeOut, hop, lerp, ramp, rnd, smooth} from './cues';
import {Bus, Dima, Lamp, Pigeon} from './props';
import {ANSWER_LEN, cubeScreen, newsTex} from './tex';

// ---------------------------------------------------------------- world 1: the bunker with the AI cube behind glass
// camera looks along -z; the cube stands at z = -3.6, the glass at z = -1.7, the guard's desk at x = 1.9
export const CUBE: V3 = [0, 1.7, -3.6];
export const SCREEN: V3 = [0, 1.75, -3.6 + 1.31];
export const GUARD: V3 = [0.75, 0, 0.55];

export const cubeStage = (v: number) => {
  if (v >= EV.type[0]) return 3;
  if (v >= EV.no) return 2;
  if (v >= EV.ask) return 1;
  return 0;
};

export const Bunker: React.FC<{v: number}> = ({v}) => {
  const stage = cubeStage(v);
  const typed = Math.floor(ramp(v, EV.type[0], EV.type[1]) * ANSWER_LEN);
  const cursor = Math.floor(v * 2.5) % 2 === 0;
  const pulse = 0.5 + 0.5 * Math.sin(v * 2.4);
  // the guard turns to the cube and shakes his head on «нет»
  const look = smooth(ramp(v, EV.ask + 0.2, EV.ask + 0.9));
  const shake = v > EV.no - 0.3 && v < EV.no + 0.9 ? Math.sin((v - EV.no) * 22) * 0.3 : 0;
  return (
    <group>
      {/* concrete room */}
      <Box size={[10, 0.1, 10]} position={[0, -0.05, -1]} color="#6a6c70" />
      <Box size={[10, 0.1, 10]} position={[0, 4.05, -1]} color="#4a4c50" />
      <Box size={[10, 4.2, 0.3]} position={[0, 2.0, -5.6]} color="#7a7c80" />
      <Box size={[0.3, 4.2, 10]} position={[-4.6, 2.0, -1]} color="#727478" />
      <Box size={[0.3, 4.2, 10]} position={[4.6, 2.0, -1]} color="#727478" />
      <Box size={[10, 4.2, 0.3]} position={[0, 2.0, 3.6]} color="#727478" />
      {/* yellow-black stripe on the floor in front of the glass */}
      {Array.from({length: 16}).map((_, i) => (
        <Box key={i} size={[0.5, 0.012, 0.3]} position={[-3.75 + i * 0.5, 0.006, -1.35]} color={i % 2 ? '#1a1a1a' : '#f2c14e'} shadow={false} />
      ))}
      {/* the glass wall with a steel frame */}
      <Box size={[9, 0.15, 0.15]} position={[0, 0.075, -1.7]} color="#3a3d44" />
      <Box size={[9, 0.15, 0.15]} position={[0, 3.6, -1.7]} color="#3a3d44" />
      {[-4.4, -1.5, 1.5, 4.4].map((x) => (
        <Box key={x} size={[0.15, 3.6, 0.15]} position={[x, 1.85, -1.7]} color="#3a3d44" />
      ))}
      <mesh position={[0, 1.85, -1.7]}>
        <planeGeometry args={[8.8, 3.5]} />
        <meshStandardMaterial color="#b8e0ff" transparent opacity={0.1} roughness={0.05} depthWrite={false} />
      </mesh>
      {/* the cube: black with glowing edges, a screen on the front */}
      <group position={CUBE}>
        <Box size={[2.6, 2.6, 2.6]} color="#15181e" />
        {[-1, 1].map((sx) =>
          [-1, 1].map((sy) => (
            <Box key={`${sx}${sy}`} size={[2.64, 0.05, 0.05]} position={[0, sy * 1.3, sx * 1.3]} color="#5fe0ff" emissive="#5fe0ff" emissiveIntensity={0.6 + pulse} shadow={false} />
          )),
        )}
        {[-1, 1].map((sx) => (
          <Box key={sx} size={[0.05, 2.64, 0.05]} position={[sx * 1.3, 0, 1.3]} color="#5fe0ff" emissive="#5fe0ff" emissiveIntensity={0.6 + pulse} shadow={false} />
        ))}
      </group>
      <Pic size={[1.2, 1.6]} map={cubeScreen(stage, typed, cursor)} position={SCREEN} />
      <pointLight position={[0, 1.8, -1.9]} intensity={4 + 2 * pulse} distance={6} color="#5fe0ff" />
      {/* cables from the cube into the floor */}
      {[-0.8, -0.3, 0.3, 0.8].map((x, i) => (
        <Cyl key={i} rTop={0.05} rBottom={0.05} height={2.4} position={[x, 0.06, -3.6 + 1.3 + 1.2 * 0 - 0.0]} rotation={[Math.PI / 2, 0, 0]} color="#1a1a1e" />
      ))}
      {/* the big red switch on the right wall */}
      <group position={[4.42, 1.6, -0.6]}>
        <Box size={[0.08, 0.9, 0.6]} color="#c8c8c0" />
        <Box size={[0.06, 0.12, 0.3]} position={[-0.06, 0.32, 0]} color="#d62828" />
        <Box size={[0.25, 0.08, 0.08]} position={[-0.14, -0.05, 0]} rotation={[0, 0, 0.5]} color="#d62828" />
        <Ico radius={0.07} position={[-0.25, 0.02, 0]} color="#d62828" />
      </group>
      {/* the guard's desk, chair, the guard */}
      <Box size={[1.4, 0.06, 0.7]} position={[GUARD[0], 0.76, GUARD[2] - 0.55]} color="#5a4a3a" />
      <Box size={[0.06, 0.74, 0.6]} position={[GUARD[0] - 0.62, 0.37, GUARD[2] - 0.55]} color="#4a3a2a" />
      <Box size={[0.06, 0.74, 0.6]} position={[GUARD[0] + 0.62, 0.37, GUARD[2] - 0.55]} color="#4a3a2a" />
      <Cyl rTop={0.06} rBottom={0.06} height={0.12} segments={8} position={[GUARD[0] + 0.35, 0.85, GUARD[2] - 0.5]} color="#e8e8e4" />
      <Box size={[0.5, 0.06, 0.5]} position={[GUARD[0], 0.48, GUARD[2] + 0.1]} color="#2a2a2e" />
      <Box size={[0.5, 0.6, 0.06]} position={[GUARD[0], 0.8, GUARD[2] + 0.37]} color="#2a2a2e" />
      <group position={[GUARD[0], 0.5 - 0.9 + 0.02, GUARD[2] + 0.1]}>
        <Person
          position={[0, 0, 0]}
          rotation={Math.PI + 0.45 * look}
          shirt="#3a4a3a"
          pants="#2a2a2e"
          hair="#1a1a1a"
          skin="#e2b892"
          pose={{legL: 1.45, legR: 1.45, armL: [0.9, 0.1], armR: [0.9 - 0.2 * look, -0.1], elbowL: 0.4, elbowR: 0.4, head: [0, shake + 0.3 * look]}}
          headExtra={<Box size={[0.34, 0.08, 0.36]} position={[0, 0.37, 0.02]} color="#2a3a2a" />}
        />
      </group>
      {/* cold ceiling lamps */}
      {[-2.5, 2.5].map((x) => (
        <Box key={x} size={[1.2, 0.06, 0.2]} position={[x, 3.97, 0.5]} color="#e8f0ff" emissive="#e8f0ff" emissiveIntensity={1.4} shadow={false} />
      ))}
      <pointLight position={[0, 3.6, 1]} intensity={10} distance={12} color="#dfe8ff" />
      <hemisphereLight color="#c8d8ff" groundColor="#3a3a40" intensity={0.5} />
    </group>
  );
};

// ---------------------------------------------------------------- world 2: the street (along +x)
// sidewalk z 0..4.5, road z 4.6..12, buildings behind the sidewalk (z < 0), facades face +z
const SKY: SkyCols = {top: '#4a8ad0', mid: '#a6c8e6', low: '#f0e6d0', sunDir: [0.5, 0.35, 1], sun: 0.6, sunCol: '#fff2c8'};
export const STOP_X = 20;
export const BUS_Z = 6.0;
export const BRICK_X = 70;
export const SCREEN_AT: V3 = [44, 9, 15.6];
export const PIGEON_AT: V3 = [24.3, 1.03, 1.4];

// Dima on the street: runs to the bus, gets in; in the brick shot walks along the wall
export const dimaRun = (v: number) => {
  const k = ramp(v, EV.run[0], EV.run[1]);
  const x = lerp(7.5, STOP_X - 0.2, easeOut(k));
  const turn = smooth(ramp(v, EV.run[1] - 0.2, EV.run[1] + 0.3));
  const inK = smooth(ramp(v, EV.run[1] + 0.1, EV.doors - 0.05));
  return {p: [x, 0.14 + 0.25 * inK, lerp(2.6, 4.75, inK)] as V3, yaw: lerp(Math.PI / 2, 0, turn), moving: k < 1 ? 1 : 0, gone: v >= EV.doors - 0.02};
};
export const busX = (v: number) => STOP_X - 3.6 + easeIn(ramp(v, EV.doors + 0.5, EV.doors + 3.5)) * 25;
export const busDoor = (v: number) => (v < EV.doors ? 1 : 1 - smooth(ramp(v, EV.doors, EV.doors + 0.3)));

const FALL = 1.9;
export const brickAt = (v: number): {p: V3; r: number; landed: boolean} => {
  const t0 = EV.brick - FALL;
  const x = clamp01((v - t0) / FALL);
  const y = 18 * (1 - x * x) + 0.08;
  const push = easeOut(ramp(v, EV.gust, EV.gust + 0.7)) * 1.6;
  const land = v >= EV.brick;
  const bounce = land ? hop(v, EV.brick, 0.3) * 0.25 : 0;
  return {p: [BRICK_X + 0.2 * push, land ? 0.13 + bounce : Math.max(0.13, y), 1.0 + push + (land ? 0.25 * ramp(v, EV.brick, EV.brick + 0.3) : 0)], r: v * 7 * (land ? 0 : 1) + (land ? 0.4 : 0), landed: land};
};
// Dima walks along the wall towards the brick spot and stops
export const dimaWalk = (v: number) => {
  const k = ramp(v, P(13) - 0.6, EV.brick);
  const x = lerp(BRICK_X - 4.2, BRICK_X - 0.15, Math.sin((k * Math.PI) / 2));
  return {p: [x, 0.14, 0.95] as V3, moving: k < 1 ? 1 - smooth(ramp(v, EV.brick - 0.3, EV.brick)) : 0};
};

const walker = (i: number) => ({shirt: SHIRTS[(i * 3) % SHIRTS.length], pants: PANTS[i % PANTS.length], hair: HAIR[(i * 2) % HAIR.length], skin: SKINS[i % SKINS.length]});

export const Street: React.FC<{v: number; shot: string}> = ({v, shot}) => {
  const run = dimaRun(v);
  const walkD = dimaWalk(v);
  const brick = brickAt(v);
  const lightsK = (i: number) => clamp01((v - EV.lights - i * 0.14) / 0.2);
  return (
    <group>
      <Sky c={SKY} />
      <fog attach="fog" args={['#d8e4ee', 60, 420]} />
      <DayLights />
      <SunLight dir={[0.4, 0.8, 0.5]} target={[shot === 'w2brick' ? BRICK_X : shot === 'w2tv' ? 44 : 20, 0, 4]} size={34} />
      <Ground color="#7a8a6a" />
      <Box size={[260, 0.14, 4.6]} position={[40, 0.07, 2.3]} color="#b9b3a8" />
      <Box size={[260, 0.08, 7.6]} position={[40, 0.04, 8.4]} color="#5d5f66" />
      <Box size={[260, 0.14, 4.0]} position={[40, 0.07, 14.2]} color="#b9b3a8" />
      {Array.from({length: 22}).map((_, i) => (
        <Box key={i} size={[2, 0.012, 0.15]} position={[-30 + i * 8, 0.086, 8.4]} color="#f2f2f2" shadow={false} />
      ))}
      {/* buildings behind the near sidewalk */}
      {Array.from({length: 9}).map((_, i) => (
        <Block key={i} position={[-20 + i * 16, 0, -5.2]} size={[15.6, 16 + (i % 3) * 3, 10]} color={['#d8cdb8', '#c8b8a8', '#e2d8c8'][i % 3]} seed={i + 11} />
      ))}
      {/* across the road, facing back to us */}
      {Array.from({length: 9}).map((_, i) => (
        <Block key={i} position={[-20 + i * 16, 0, 21.4]} size={[15.6, 14 + (i % 2) * 6, 10]} rotation={Math.PI} color={['#e0d0c0', '#d2cab8', '#cfc6b4'][i % 3]} seed={i + 51} />
      ))}
      {/* the big news screen on the far building */}
      <group position={SCREEN_AT}>
        <Box size={[9.4, 5.6, 0.4]} color="#1a1a1e" />
        <Pic size={[9, 5.1]} map={newsTex(Math.floor(Math.max(0, v - P(14)) * 30) % 120)} position={[0, 0, -0.21]} rotation={[0, Math.PI, 0]} />
      </group>
      {/* bus stop */}
      <group position={[STOP_X + 1.5, 0.14, 3.6]}>
        <Box size={[3.4, 0.08, 1.2]} position={[0, 2.4, 0]} color="#3a4a5a" />
        <Box size={[0.08, 2.4, 0.08]} position={[-1.6, 1.2, -0.5]} color="#3a4a5a" />
        <Box size={[0.08, 2.4, 0.08]} position={[1.6, 1.2, -0.5]} color="#3a4a5a" />
        <Box size={[3.2, 1.8, 0.03]} position={[0, 1.3, -0.55]} color="#cfe6ff" opacity={0.35} />
        <Box size={[2.4, 0.06, 0.4]} position={[0, 0.5, -0.3]} color="#8a6a4a" />
      </group>
      {shot === 'w2bus' ? <Bus position={[busX(v), 0, BUS_Z]} door={busDoor(v)} /> : null}
      {/* railing with the pigeon */}
      <Box size={[3, 0.05, 0.05]} position={[PIGEON_AT[0], 0.98, PIGEON_AT[2]]} color="#4a4e56" />
      {[-1.4, 0, 1.4].map((dx) => (
        <Box key={dx} size={[0.05, 0.85, 0.05]} position={[PIGEON_AT[0] + dx, 0.56, PIGEON_AT[2]]} color="#4a4e56" />
      ))}
      <Pigeon position={PIGEON_AT} rotation={-Math.PI / 2 + 0.3} head={shot === 'w2pigeon' ? 1.2 * smooth(ramp(v, P(17) + 0.2, P(17) + 0.8)) : 0} eye={hop(v, EV.blink, 0.5)} />
      {/* lamps with the little blue lights */}
      {Array.from({length: 14}).map((_, i) => (
        <Lamp key={i} position={[-6 + i * 8, 0.14, 4.2]} blue={shot === 'w2pull' ? lightsK(i) : 0} />
      ))}
      {/* trees */}
      {Array.from({length: 8}).map((_, i) => (
        <Tree key={i} position={[-2 + i * 16, 0.14, 13.6]} s={0.9} seed={i + 2} birch={i % 2 === 1} />
      ))}
      <Car position={[-8 + ((v * 6) % 60), 0, 10.2]} rotation={Math.PI / 2} color="#e85d5d" />
      <Car position={[90 - ((v * 7) % 70), 0, 6.4]} rotation={-Math.PI / 2} color="#4a7fd0" />
      {/* Dima */}
      {shot === 'w2bus' && !run.gone ? <Dima position={run.p} rotation={run.yaw} pose={{...walk(v, run.moving * 1.4, 2.6), head: [0.05, 0]}} /> : null}
      {shot === 'w2brick' ? (
        <Dima
          position={walkD.p}
          rotation={Math.PI / 2}
          pose={{...walk(v, walkD.moving * 0.8, 1.6), head: [brick.landed ? 0.35 : 0, brick.landed ? 0.7 : 0], eyes: brick.landed ? 1.5 : 1, mouth: brick.landed ? 0.4 : 0}}
        />
      ) : null}
      {/* the brick + a chipped spot on the roof edge + the gust's leaves */}
      {shot === 'w2brick' ? (
        <>
          <Box size={[0.4, 0.2, 0.2]} position={[brick.p[0], brick.p[1] + 0.04, brick.p[2]]} rotation={[brick.r, brick.r * 0.7, 0]} color="#b04a32" />
          {v > EV.brick ? (
            [0, 1, 2, 3].map((i) => (
              <Box key={i} size={[0.05, 0.04, 0.05]} position={[brick.p[0] + Math.cos(i * 1.7) * 0.3 * ramp(v, EV.brick, EV.brick + 0.3), 0.16, brick.p[2] + Math.sin(i * 1.7) * 0.3 * ramp(v, EV.brick, EV.brick + 0.3)]} color="#b04a32" />
            ))
          ) : null}
          {Array.from({length: 14}).map((_, i) => {
            const k = ramp(v, EV.gust - 0.3 + i * 0.03, EV.gust + 1.2 + i * 0.03);
            if (k <= 0 || k >= 1) return null;
            return <Box key={i} size={[0.08, 0.01, 0.06]} position={[BRICK_X - 1 + rnd(i) * 2, 1 + rnd(i, 2) * 6 - k * 1.5, -0.5 + k * 9 + rnd(i, 3)]} rotation={[k * 9 + i, k * 7, i]} color={i % 2 ? '#e0a030' : '#8ab04a'} shadow={false} />;
          })}
        </>
      ) : null}
      {/* passers-by (stay clear of the shots' heroes) */}
      {shot === 'w2tv' || shot === 'w2pull'
        ? Array.from({length: 8}).map((_, i) => {
            const dir = i % 2 ? 1 : -1;
            const x = 30 + ((v * 1.3 * dir + i * 7.3) % 30 + 30) % 30;
            return <Person key={i} {...walker(i)} position={[x, 0.14, i % 2 ? 13.6 : 14.8]} rotation={(dir * Math.PI) / 2} pose={walk(v + i, 1)} />;
          })
        : null}
    </group>
  );
};
