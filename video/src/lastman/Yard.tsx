import React, {useMemo} from 'react';
import {Block, Box, Cyl, DAY, DayLights, Ground, Helicopter, Sky, SunLight, Tree, Van} from './common';
import {C, V3, clamp01, lerp, lerp3, ramp, rnd, smooth} from './cues';
import {Crowd, Member, MemberPose, member} from './Crowd';
import {HotDog} from './people';
import {SHIRT_LAND, TShirt, shirtAt} from './Flat';

// The yard in front of the hero's panel block (front wall at z = 6). The crowd gathers here.
const N = 190;
const GATHER = 21.8;
const BUILD: V3 = [0.6, 13, 6];

type Plan = {m: Member; from: V3; to: V3; start: number; walk: number; fight: boolean; fightTo: V3};

const usePlans = () =>
  useMemo(() => {
    const out: Plan[] = [];
    for (let i = 0; i < N; i++) {
      // a slot in a loose crowd between the driveway and the playground
      const row = Math.floor(i / 19);
      const col = i % 19;
      const to: V3 = [-17 + col * 1.9 + (rnd(i, 1) - 0.5) * 1.2, 0, 9.5 + row * 1.7 + (rnd(i, 2) - 0.5) * 0.9];
      const left = col < 9 || (col === 9 && rnd(i, 3) < 0.5);
      const from: V3 = [left ? -44 : 44, 0, to[2]];
      const dist = Math.hypot(to[0] - from[0], to[2] - from[2]);
      // the ones going to the middle arrive first, so nobody walks through anybody
      const arrive = GATHER + 0.2 + (Math.abs(col - 9) / 9) * 2.6 + row * 0.08 + rnd(i, 6) * 0.2;
      const start = arrive - dist / 7.5;
      const near = Math.hypot(to[0] - SHIRT_LAND[0], to[2] - SHIRT_LAND[2]);
      const ang = rnd(i, 7) * Math.PI * 2;
      const rad = 0.5 + Math.sqrt(rnd(i, 8)) * 3.2;
      out.push({
        m: member(i, to, Math.PI, 11),
        from,
        to,
        start,
        walk: 7.5,
        fight: near < 9.5,
        fightTo: [SHIRT_LAND[0] + Math.cos(ang) * rad, 0, SHIRT_LAND[2] + Math.sin(ang) * rad],
      });
    }
    return out;
  }, []);

const yawTo = (p: V3, q: V3) => Math.atan2(q[0] - p[0], q[2] - p[2]);

const poseOf = (pl: Plan, i: number, v: number): MemberPose => {
  if (v < pl.start) return {hidden: true};
  const dist = Math.hypot(pl.to[0] - pl.from[0], pl.to[2] - pl.from[2]);
  const k = clamp01(((v - pl.start) * pl.walk) / dist);
  if (k < 1) {
    const p = lerp3(pl.from, pl.to, k);
    const ph = (v - pl.start) * 2.4 * Math.PI * 2;
    return {p, yaw: yawTo(pl.from, pl.to), legSwing: Math.sin(ph) * 0.55, armL: Math.sin(ph) * 0.5, armR: -Math.sin(ph) * 0.5, bend: 0.12};
  }
  const cheerT = v + rnd(i, 9) * 3;
  // after the T-shirt lands, the nearest run to it and fight
  if (pl.fight && v > C.land - 0.2) {
    const kk = smooth(ramp(v, C.land - 0.2 + rnd(i, 10) * 0.4, C.land + 1.4 + rnd(i, 11) * 0.6));
    const run = kk > 0 && kk < 1;
    const jit = kk >= 1 ? 0.18 : 0;
    const p0 = lerp3(pl.to, pl.fightTo, kk);
    const p: V3 = [p0[0] + jit * Math.sin(v * 7 + i), 0, p0[2] + jit * Math.cos(v * 6 + i * 2)];
    const ph = v * 2.8 * Math.PI * 2;
    return {
      p,
      yaw: run ? yawTo(pl.to, pl.fightTo) : yawTo(p, SHIRT_LAND) + 0.4 * Math.sin(v * 3 + i),
      legSwing: run ? Math.sin(ph) * 0.6 : 0.15 * Math.sin(v * 9 + i),
      armL: 2.4 + 0.5 * Math.sin(v * 8 + i),
      armR: 2.6 + 0.5 * Math.sin(v * 9 + i * 3),
      bend: run ? 0.2 : 0.25 + 0.1 * Math.sin(v * 5 + i),
      lift: kk >= 1 ? Math.max(0, Math.sin(v * 6 + i)) * 0.12 : 0,
    };
  }
  // cheering at the window
  const up = 1.8 + 0.9 * Math.sin(cheerT * 5);
  return {
    p: pl.to,
    yaw: yawTo(pl.to, BUILD),
    armL: i % 3 === 0 ? up : 0.3,
    armR: i % 2 === 0 ? 2.9 + 0.3 * Math.sin(cheerT * 6) : up * 0.8,
    lift: Math.max(0, Math.sin(cheerT * 4)) * 0.15 * (i % 4 === 0 ? 1 : 0),
  };
};

const Playground: React.FC = () => (
  <group position={[0, 0, 32]}>
    <Box size={[16, 0.06, 10]} position={[0, 0.03, 0]} color="#c8a46a" />
    {/* swings */}
    <Box size={[0.12, 2.4, 0.12]} position={[-5, 1.2, -1]} color="#3a6ad0" />
    <Box size={[0.12, 2.4, 0.12]} position={[-2, 1.2, -1]} color="#3a6ad0" />
    <Box size={[3.2, 0.12, 0.12]} position={[-3.5, 2.4, -1]} color="#3a6ad0" />
    <Box size={[0.5, 0.06, 0.25]} position={[-4.2, 0.6, -1]} color="#e85d5d" />
    <Box size={[0.5, 0.06, 0.25]} position={[-2.8, 0.6, -1]} color="#f2c14e" />
    {/* slide */}
    <Box size={[1.2, 1.8, 1.2]} position={[3, 0.9, 1]} color="#e85d5d" />
    <Box size={[0.9, 0.08, 3.0]} position={[3, 1.0, 2.9]} rotation={[0.55, 0, 0]} color="#f2c14e" />
    <Box size={[2.4, 0.3, 2.4]} position={[-5, 0.15, 3]} color="#9a6a42" />
  </group>
);

export const Yard: React.FC<{v: number; withOwnBlock: boolean; hotdog?: boolean}> = ({v, withOwnBlock, hotdog = false}) => {
  const plans = usePlans();
  const members = useMemo(() => plans.map((p) => p.m), [plans]);
  const vans = smooth(ramp(v, 21.9, 24.4));
  const heliT = v;
  const sh = shirtAt(v);
  // hot dog leaves through the basement door at x = 12
  const hdK = ramp(v, 41.4, 44.8);
  const hdPos: V3 = hdK < 0.25 ? [12, 0, lerp(5.2, 7.6, hdK / 0.25)] : [lerp(12, 22, (hdK - 0.25) / 0.75), 0, 7.6];
  const door = smooth(ramp(v, 41.0, 41.5)) * (1 - smooth(ramp(v, 42.6, 43.2)));
  return (
    <group>
      <Sky c={DAY} />
      <fog attach="fog" args={['#cfe0ee', 70, 260]} />
      <DayLights />
      <SunLight dir={[0.45, 0.8, 0.5]} target={[0, 0, 18]} size={34} />
      <Ground color="#7aa25a" />
      {/* sidewalk and driveway */}
      <Box size={[90, 0.1, 3.4]} position={[0, 0.05, 7.7]} color="#b9b3a8" />
      <Box size={[90, 0.08, 6]} position={[0, 0.04, 12.4]} color="#5d5f66" />
      {withOwnBlock ? <Block position={[0, 0, 0]} size={[60, 26, 12]} color="#dcd4c2" seed={3} /> : null}
      {withOwnBlock ? (
        <>
          {/* entrance canopy and the basement door the hot dog uses */}
          <Box size={[2.4, 0.15, 1.6]} position={[-8, 2.6, 6.8]} color="#9aa0a8" />
          <Box size={[1.2, 2.1, 0.1]} position={[-8, 1.05, 6.08]} color="#5a4a3a" />
          <Box size={[1.6, 0.9, 1.4]} position={[12, 0.45, 6.7]} color="#c8c0b0" />
          <group position={[11.5, 0, 6.06]} rotation={[0, -door * 1.7, 0]}>
            <Box size={[1.0, 1.95, 0.06]} position={[0.5, 0.98, 0]} color="#3a5a4a" />
          </group>
        </>
      ) : null}
      <Block position={[0, 0, 62]} size={[70, 26, 12]} rotation={Math.PI} color="#e2d8c8" seed={5} />
      <Block position={[-46, 0, 30]} size={[40, 26, 12]} rotation={Math.PI / 2} color="#d2cab8" seed={7} />
      <Block position={[46, 0, 30]} size={[40, 26, 12]} rotation={-Math.PI / 2} color="#d8cdb8" seed={9} />
      <Playground />
      {[-24, -14, 18, 26, -30, 30].map((x, i) => (
        <Tree key={i} position={[x, 0, 40 + (i % 2) * 6]} s={1.1} seed={i} birch={i % 2 === 0} />
      ))}
      <Van position={[lerp(-60, -22, vans), 0, 7.5]} rotation={Math.PI / 2} />
      <Van position={[lerp(-70, -29, smooth(ramp(v, 22.6, 24.9))), 0, 7.5]} rotation={Math.PI / 2} label="НОВОСТИ" color="#2a6ad0" />
      <Helicopter position={[lerp(-40, -8, smooth(ramp(v, 21.6, 24.0))), 30 + Math.sin(heliT * 0.8) * 0.6, 34]} rotation={0.6} t={heliT} />
      <Crowd members={members} pose={(i) => poseOf(plans[i], i, v)} />
      {/* the T-shirt: in the air, then held up in the fight */}
      {v >= C.throw && v < C.land ? <TShirt position={sh.p} rotation={sh.r} /> : null}
      {v >= C.land ? <TShirt position={[SHIRT_LAND[0] + 0.3 * Math.sin(v * 5), 2.9 + 0.25 * Math.sin(v * 7), SHIRT_LAND[2] + 0.3 * Math.cos(v * 4)]} rotation={[0, v * 2, 0.3 * Math.sin(v * 9)]} /> : null}
      {hotdog && v > 41.0 ? <HotDog position={hdPos} rotation={hdK < 0.25 ? 0 : Math.PI / 2} walkT={v} walking={1} /> : null}
    </group>
  );
};
