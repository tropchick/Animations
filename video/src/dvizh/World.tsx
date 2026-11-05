import React from 'react';
import {Box, Cyl} from '../scene/parts';
import {Person, PersonPose} from '../scene/Characters';
import {CameraRig, View, handheld} from '../slime/camera';
import {
  BUZZ,
  CASH,
  CLINKS,
  COUNT,
  COUNT2,
  DOORS_OPEN,
  DROP,
  FIREWORKS,
  FIST,
  FLIPS,
  HOLES_X,
  KISS,
  LOAD,
  MUG,
  PAPER,
  PHOTO,
  PLY,
  ROLLER,
  SIGH,
  SIGN_ON,
  Shot,
  TAGS,
  V3,
  clamp01,
  easeIn,
  easeOut,
  lerp,
  lerp3,
  ramp,
  rnd,
  shotAt,
  shotEnd,
  shotStart,
  smooth,
} from './cues';
import {
  AirportHall,
  BigPhone,
  ButtonPhone,
  Bench,
  Cardboard,
  Chair,
  Classroom,
  Cup,
  DAY,
  DaySky,
  DayLights,
  DepartureBoard,
  Embassy,
  FW_REF,
  Facade,
  FoldingChair,
  Foreigner,
  Granny,
  Guy,
  Heart,
  Hero,
  Kitchen,
  Laptop,
  MallFloor,
  MoneySack,
  Mug,
  NIGHT,
  NightLights,
  Newspaper,
  Pic,
  PhoneScreen,
  Plate,
  Pothole,
  Roller,
  SIT,
  SchoolDesk,
  Shards,
  Shop,
  SleepingBag,
  Street,
  StreetLamp,
  Suitcase,
  TABLE,
  TV,
  Terminal,
  TechStore,
  TvBox,
  Uncle,
  UsdBooth,
  walk,
} from './Sets';
import {drawPlate} from './tex';

FW_REF.current = FIREWORKS;

const S = (n: Shot) => shotStart(n);
const E = (n: Shot) => shotEnd(n);
const mv = (v: number, t0: number, t1: number, a: V3, b: V3, ta: V3, tb: V3, fov: number | [number, number], far = 3000): View => {
  const k = smooth(ramp(v, t0, t1));
  return {pos: lerp3(a, b, k), target: lerp3(ta, tb, k), fov: typeof fov === 'number' ? fov : lerp(fov[0], fov[1], k), far};
};
const yawTo = (from: V3, to: V3) => Math.atan2(to[0] - from[0], to[2] - from[2]);

// where a person's hand is in the world (roll ignored): side 1 right, −1 left
const handWorld = (pos: V3, yaw: number, pitch: number, elbow: number, side: 1 | -1, scale = 1): V3 => {
  const pe = pitch + elbow;
  const x = 0.33 * side;
  const y = 1.52 - 0.5 * Math.cos(pitch) - 0.36 * Math.cos(pe) + 0.02 * Math.sin(pe);
  const z = 0.5 * Math.sin(pitch) + 0.36 * Math.sin(pe) + 0.02 * Math.cos(pe);
  return [pos[0] + scale * (x * Math.cos(yaw) + z * Math.sin(yaw)), pos[1] + scale * y, pos[2] + scale * (-x * Math.sin(yaw) + z * Math.cos(yaw))];
};

type Scene = {view: (v: number) => View; render: (v: number) => React.ReactNode; shakes?: [number, number][]};

// ---------------------------------------------------------------- the kitchen hook

const HERO0: V3 = [0.3, 0, 0.2];
const HERO_YAW = yawTo(HERO0, TV);
const HOLD = {pitch: 0.55, elbow: 1.25};
const MUG_START: V3 = (() => {
  const h = handWorld(HERO0, HERO_YAW, HOLD.pitch, HOLD.elbow, 1);
  return [h[0] + Math.sin(HERO_YAW) * 0.03, h[1] + 0.02, h[2] + Math.cos(HERO_YAW) * 0.03];
})();
const MUG_FLOOR: V3 = [MUG_START[0] + Math.sin(HERO_YAW) * 0.12, 0.055, MUG_START[2] + Math.cos(HERO_YAW) * 0.12];

const FallingMug: React.FC<{v: number}> = ({v}) => {
  if (v < MUG[0]) return <Mug position={MUG_START} />;
  if (v < MUG[1]) {
    const k = (v - MUG[0]) / (MUG[1] - MUG[0]);
    const p = lerp3(MUG_START, MUG_FLOOR, 0);
    return <Mug position={[lerp(p[0], MUG_FLOOR[0], k), lerp(MUG_START[1], MUG_FLOOR[1], k * k), lerp(p[2], MUG_FLOOR[2], k)]} rotation={[k * 1.6, 0, k * 0.9]} />;
  }
  return <Shards position={[MUG_FLOOR[0], 0, MUG_FLOOR[2]]} age={v - MUG[1]} />;
};

const heroShock = (v: number): PersonPose => {
  const j = smooth(ramp(v, 1.15, 1.45));
  const drop = smooth(ramp(v, MUG[0], MUG[0] + 0.3));
  return {
    head: [lerp(0.02, -0.06, j), 0],
    mouth: j,
    eyes: 1 + 0.75 * j,
    armR: [lerp(HOLD.pitch, 0.35, drop), -0.08],
    elbowR: lerp(HOLD.elbow, 0.5, drop),
    armL: [0.1, 0.08],
  };
};

// the family at the table: [position, yaw]
const T = TABLE;
const SEATS: Record<'granny' | 'uncle' | 'mom' | 'hero' | 'kid', [V3, number]> = {
  granny: [[T[0], 0, T[2] - 0.72], 0],
  uncle: [[T[0] - 1.02, 0, T[2]], Math.PI / 2],
  mom: [[T[0] + 1.02, 0, T[2]], -Math.PI / 2],
  hero: [[T[0] - 0.4, 0, T[2] + 0.72], Math.PI],
  kid: [[T[0] + 0.4, 0, T[2] + 0.72], Math.PI],
};
const seated = (k: keyof typeof SEATS): V3 => [SEATS[k][0][0], -0.3, SEATS[k][0][2]];

const TableTop: React.FC<{jump?: number}> = ({jump = 0}) => (
  <group position={[0, 0.79 + jump * 0.06, 0]}>
    <Plate position={[0, 0, -0.32]} />
    <Plate position={[-0.58, 0, 0]} food="#c84a3a" />
    <Plate position={[0.58, 0, 0]} food="#7ac04a" />
    <Plate position={[-0.36, 0, 0.32]} food="#e8b04a" />
    <Plate position={[0.36, 0, 0.32]} food="#e8d07a" />
    <Cup position={[0.15, 0, -0.3]} />
    <Cup position={[-0.5, 0, 0.18]} />
    <Cup position={[0.5, 0, -0.16]} />
    {/* salad bowl and a cake in the middle */}
    <Cyl rTop={0.16} rBottom={0.1} height={0.1} position={[-0.18, 0.05, 0.02]} color="#f2f2f2" />
    <Cyl rTop={0.14} rBottom={0.14} height={0.05} position={[-0.18, 0.1, 0.02]} color="#6ab84a" />
    <Cyl rTop={0.15} rBottom={0.15} height={0.12} position={[0.2, 0.06, 0.04]} color="#f2d8b0" />
    <Cyl rTop={0.15} rBottom={0.15} height={0.02} position={[0.2, 0.13, 0.04]} color="#d84a6a" />
  </group>
);

type FamilyPose = Partial<Record<keyof typeof SEATS, PersonPose>>;
const Family: React.FC<{p: FamilyPose; uncleHands?: React.ReactNode; uncleRed?: number}> = ({p, uncleHands, uncleRed = 0}) => (
  <>
    {(Object.keys(SEATS) as (keyof typeof SEATS)[]).map((k) => (
      <Chair key={k} position={SEATS[k][0]} rotation={SEATS[k][1]} />
    ))}
    <Granny position={seated('granny')} rotation={SEATS.granny[1]} pose={{...SIT, ...p.granny}} />
    <Uncle position={seated('uncle')} rotation={SEATS.uncle[1]} pose={{...SIT, ...p.uncle}} red={uncleRed} rightHand={uncleHands} />
    <Person position={seated('mom')} rotation={SEATS.mom[1]} shirt="#4fb6c2" pants="#3a3a40" hair="#7b5434" longHair pose={{...SIT, ...p.mom}} />
    <Hero position={seated('hero')} rotation={SEATS.hero[1]} pose={{...SIT, ...p.hero}} />
    <Person position={[seated('kid')[0], -0.2, seated('kid')[2]]} rotation={SEATS.kid[1]} shirt="#f2c14e" pants="#2c3550" hair="#c9a46a" child scale={0.72} pose={{...SIT, ...p.kid}} />
  </>
);

// ---------------------------------------------------------------- the street at night (exchange booth)

const NightStreet: React.FC = () => (
  <>
    <DaySky c={NIGHT} fog={[30, 300]} fogCol="#141a2c" />
    <NightLights />
    <Street len={60} trees={false} />
    <Facade position={[-6.5, 0, -3.5]} size={[8, 9, 2]} cols={5} rows={4} seed={3} />
    <Facade position={[6.5, 0, -3.5]} size={[8, 7, 2]} cols={5} rows={3} wall="#c9d2d8" seed={5} />
    <StreetLamp position={[-3.6, 0, 2.6]} light />
    <StreetLamp position={[4.4, 0, 2.6]} light />
  </>
);

const DayStreet: React.FC = () => (
  <>
    <DaySky />
    <DayLights />
    <Street len={60} />
    <Facade position={[-6.5, 0, -3.5]} size={[8, 9, 2]} cols={5} rows={4} seed={3} />
    <Facade position={[6.5, 0, -3.5]} size={[8, 7, 2]} cols={5} rows={3} wall="#c9d2d8" seed={5} />
  </>
);

const usdAt = (v: number, c: [number, number], from: number, to: number) => {
  const k = smooth(ramp(v, c[0], c[1]));
  return v >= c[1] ? to : from * Math.pow(to / from, k);
};

// ---------------------------------------------------------------- crowds

// runners with suitcases crossing the airport hall
const RUNNERS = Array.from({length: 11}).map((_, i) => ({z: 0.4 + (i % 5) * 0.75 + rnd(i) * 0.3, t0: 11.25 + rnd(i + 7) * 1.6, sp: 3.2 + rnd(i + 3) * 1.6, i}));

// people coming out of the terminal: [start time, end point]
const ARRIVERS = Array.from({length: 9}).map((_, i) => {
  const ang = -1.0 + (i / 8) * 1.15;
  return {t0: DOORS_OPEN + 0.2 + i * 0.32, to: [Math.sin(ang) * 7, 0, 1.2 + Math.cos(ang) * 6.5] as V3, i};
});
const IT0: V3 = [0.7, 0, 0.0];
const IT1: V3 = [1.8, 0, 3.4];
const IT_WALK: [number, number] = [29.3, 30.95];

// the man with three TVs
const TV_MAN: [V3, V3] = [[3.4, 0, 2.6], [0.4, 0, 6.6]];
const TV_WALK: [number, number] = [36.65, 39.9];

// the queue at the visa centre
const VISA_Q: V3[] = Array.from({length: 18}).map((_, i) => (i < 4 ? [0.0, 0, 0.9 + i * 0.75] : [0.75 * (i - 3), 0, 3.85]));

// ---------------------------------------------------------------- scenes

const SCENES: Record<Shot, Scene> = {
  kitchen: {
    view: (v) => {
      if (v < 1.6) return mv(v, 0, 1.6, [1.9, 1.95, 1.55], [1.3, 1.9, 1.25], [-2.88, 1.66, 0.0], [-2.88, 1.72, 0.0], [44, 40]);
      return mv(v, 1.6, E('kitchen'), [-1.95, 1.3, 1.05], [-1.45, 1.4, 0.85], [0.3, 1.1, 0.2], [0.3, 1.3, 0.2], [52, 50]);
    },
    shakes: [[MUG[1], 0.25]],
    render: (v) => (
      <>
        <Kitchen t={v} />
        <Hero position={HERO0} rotation={HERO_YAW} pose={heroShock(v)} />
        <FallingMug v={v} />
      </>
    ),
  },
  rate: {
    view: (v) => mv(v, S('rate'), E('rate'), [2.7, 1.3, 9.6], [1.5, 1.6, 4.9], [0, 3.0, 0.2], [0.3, 2.55, 0.7], [42, 44]),
    shakes: [[COUNT[1], 0.25]],
    render: (v) => {
      const value = usdAt(v, COUNT, 98.4, 30);
      const raise = smooth(ramp(v, 6.6, 7.2));
      const flash = v >= PHOTO && v < PHOTO + 0.15 ? 1 - (v - PHOTO) / 0.15 : 0;
      return (
        <>
          <NightStreet />
          <group position={[0, 0, -0.3]}>
            <UsdBooth value={value} down={v > COUNT[0]} />
          </group>
          <Granny
            position={[1.05, 0, 2.3]}
            rotation={Math.PI + 0.25}
            pose={{armR: [lerp(0.2, 1.55, raise), -0.05], elbowR: lerp(0.2, 0.25, raise), armL: [0.4, 0.1], elbowL: 0.9, head: [-0.3, 0]}}
            rightHand={<ButtonPhone flash={flash} />}
          />
          {[[-1.8, 3.0], [-1.0, 3.8], [2.6, 3.0], [-2.6, 2.2], [-0.2, 4.6]].map(([x, z], i) => {
            const cheer = smooth(ramp(v, COUNT[1] + 0.1 + i * 0.07, COUNT[1] + 0.4 + i * 0.07));
            return (
              <Guy
                key={i}
                position={[x, 0, z]}
                rotation={Math.PI + (rnd(i + 3) - 0.5) * 0.4}
                i={i + 1}
                pose={{head: [-0.4, 0], armR: [lerp(0.1, 2.9, cheer), -0.2], armL: [lerp(0.1, 2.9, cheer), 0.2], elbowR: 0.2 * cheer, elbowL: 0.2 * cheer, mouth: cheer * 0.8}}
              />
            );
          })}
        </>
      );
    },
  },
  airport: {
    view: (v) => {
      if (v < 11.2) return mv(v, S('airport'), 11.2, [0.6, 3.1, 4.6], [0.2, 3.5, 3.4], [0, 4.3, -6.5], [0, 4.35, -6.5], 56);
      return mv(v, 11.2, E('airport'), [-3.8, 1.35, 7.6], [-1.4, 1.5, 6.4], [-0.6, 3.0, -3], [-0.2, 3.2, -3], [54, 52]);
    },
    render: (v) => {
      const ks = FLIPS.map((a) => ramp(v, a, a + 0.3));
      const hi = smooth(ramp(v, 12.4, 12.75));
      return (
        <>
          <AirportHall />
          <group position={[0, 4.4, -6.5]}>
            <DepartureBoard ks={ks} hi={hi} />
          </group>
          {/* the taxi ad on a column */}
          <group position={[3.0, 2.4, -1.68]}>
            <Box size={[1.3, 0.9, 0.04]} position={[0, 0, -0.02]} color="#2a2a30" />
            <Pic size={[1.24, 0.84]} res={[620, 420]} k="taxi" draw={(g, W, H) => drawPlate(g, W, H, 'ТАКСИ В АЭРОПОРТ', '2 500 ₽', '#ffd23f', '#141414', '#141414')} lit={false} glow={1} />
          </group>
          {RUNNERS.map((r) => {
            const t = v - r.t0;
            if (t < 0) return null;
            const x = -9 + r.sp * t;
            if (x > 12) return null;
            return (
              <Guy
                key={r.i}
                position={[x, 0, r.z]}
                rotation={Math.PI / 2}
                i={r.i + 2}
                pose={{...walk(t, 1.4, 2.6), armR: [-0.3, -0.06], elbowR: 0.1}}
                rightHand={<Suitcase color={['#d84a4a', '#3a6ad8', '#2a2a30', '#e8b04a'][r.i % 4]} />}
              />
            );
          })}
          {/* a few people looking up at the board */}
          {[[-1.2, -0.5], [1.5, -0.2], [-2.6, 0.2]].map(([x, z], i) => (
            <Guy key={i} position={[x, 0, z]} rotation={Math.PI} i={i + 5} pose={{head: [-0.5, 0]}} />
          ))}
        </>
      );
    },
  },
  mall: {
    view: (v) => mv(v, S('mall'), E('mall'), [2.6, 1.6, 9.2], [1.3, 1.9, 7.4], [0, 2.1, 0], [0, 2.3, 0], [46, 44]),
    shakes: [[PLY[0], 0.15], [PLY[1], 0.15], [PLY[2], 0.15]],
    render: (v) => {
      const ply = PLY.map((at) => ramp(v, at - 0.45, at));
      const flick = v > SIGN_ON && v < SIGN_ON + 0.25 ? (Math.sin(v * 90) > 0 ? 1 : 0) : 0;
      const on = v >= SIGN_ON + 0.25 ? 1 : flick;
      return (
        <>
          <MallFloor />
          <Shop on={on} ply={ply} />
          {[[-2.4, 3.4], [-1.4, 4.0], [-0.4, 3.3], [0.7, 3.8], [1.7, 3.2], [2.6, 4.1], [-3.2, 4.4], [3.4, 3.6]].map(([x, z], i) => {
            const cheer = smooth(ramp(v, SIGN_ON + 0.25 + 0.05 * i, SIGN_ON + 0.55 + 0.05 * i));
            const jump = cheer > 0 ? Math.abs(Math.sin((v - SIGN_ON) * 7 + i)) * 0.12 * cheer : 0;
            return <Guy key={i} position={[x, jump, z]} rotation={Math.PI + (rnd(i) - 0.5) * 0.3} i={i} pose={{armR: [lerp(0.1, 2.9, cheer), -0.25], armL: [lerp(0.1, 2.9, cheer), 0.25], mouth: cheer * 0.8, head: [-0.15, 0]}} />;
          })}
        </>
      );
    },
  },
  queue: {
    view: (v) => mv(v, S('queue'), E('queue'), [2.8, 2.7, 13.0], [1.7, 2.3, 6.4], [-0.3, 0.3, 7.5], [0, 1.6, 0.2], [44, 46]),
    render: (v) => (
      <>
        <MallFloor />
        <Shop on={1} ply={[1, 1, 1]} />
        {Array.from({length: 11}).map((_, i) => (
          <SleepingBag key={i} position={[(i % 2 ? 0.25 : -0.25) - 0.4, 0, 1.6 + i * 0.85]} rotation={i % 2 ? 0.08 : -0.06} color={['#3a6ad8', '#d84a4a', '#3a9a5a', '#e8a83a', '#8a4ad8'][i % 5]} i={i} t={v} />
        ))}
        <FoldingChair position={[1.5, 0, 3.0]} rotation={-0.3} />
        <Guy position={[1.5, -0.33, 3.05]} rotation={-0.3} i={7} pose={{...SIT, head: [0.55, 0.3], eyes: 0.15, armL: [0.3, 0.1], armR: [0.3, -0.1], elbowL: 0.9, elbowR: 0.9}} />
        <Guy position={[0.9, 0, 1.0]} rotation={Math.PI - 0.1} i={3} pose={{head: [0.3, 0], eyes: 0.4}} />
      </>
    ),
  },
  phone: {
    view: (v) => mv(v, S('phone'), E('phone'), [0.07, 1.49, 2.58], [0.04, 1.47, 2.5], [0, 1.445, 2.2], [0, 1.45, 2.2], 40),
    render: (v) => {
      const k = v >= LOAD ? 1 : (v - S('phone')) * 0.045;
      const play = ramp(v, LOAD, LOAD + 1.6);
      return (
        <>
          <DayStreet />
          <Bench position={[0.2, 0, -0.6]} />
          <group position={[0, 1.45, 2.2]} rotation={[-0.05, 0.08, 0]}>
            <BigPhone k={k} play={play} />
          </group>
        </>
      );
    },
  },
  seller: {
    view: (v) => mv(v, S('seller'), E('seller'), [0.9, 1.35, 4.8], [0.45, 1.2, 3.4], [0, 1.0, 0.4], [0, 0.95, 0.4], [42, 40]),
    render: (v) => {
      const sag = smooth(ramp(v, SIGH - 0.1, SIGH + 0.6));
      return (
        <>
          <DayStreet />
          <Bench position={[0, 0, 0]} />
          <Guy position={[0, -0.33, 0.05]} i={8} pose={{...SIT, head: [lerp(0.15, 0.5, sag), 0], armL: [0.95, 0.12], armR: [0.95, -0.12], elbowL: 0.55, elbowR: 0.55, eyes: 0.7}} />
          <group position={[0, 0.95 - 0.04 * sag, 1.0]} rotation={[-0.1 + 0.08 * sag, 0, 0]}>
            <Cardboard lines={['ОТДАМ ВПН', 'ДАРОМ']} size={[0.82, 0.56]} />
          </group>
          {[0, 1, 2].map((i) => {
            const t = v - S('seller') - i * 0.9;
            const x = -5 + 1.3 * t;
            return <Guy key={i} position={[x, 0, 1.9 + i * 0.35]} rotation={Math.PI / 2} i={i + 2} pose={{...walk(t), head: [i === 1 ? 0.45 : 0, 0], armR: i === 1 ? [1.2, -0.1] : walk(t).armR, elbowR: i === 1 ? 0.8 : 0}} rightHand={i === 1 ? <Box size={[0.08, 0.15, 0.012]} position={[0, -0.02, 0.07]} rotation={[0.2, 0, 0]} color="#1a1a1e" /> : undefined} />;
          })}
        </>
      );
    },
  },
  arrivals: {
    view: (v) => {
      if (v < 30.4) return mv(v, S('arrivals'), 30.4, [3.6, 1.7, 13.2], [2.4, 1.8, 10.6], [0, 2.6, 0], [0.3, 2.3, 1.0], [46, 46]);
      return mv(v, 30.4, 32.2, [6.6, 1.2, 4.6], [5.0, 1.55, 4.5], [1.8, 1.0, 4.0], [1.8, 0.15, 4.5], [56, 50]);
    },
    shakes: [[KISS[1], 0.3]],
    render: (v) => {
      const doors = smooth(ramp(v, DOORS_OPEN, DOORS_OPEN + 0.6));
      const wk = clamp01((v - IT_WALK[0]) / (IT_WALK[1] - IT_WALK[0]));
      const itPos = lerp3(IT0, IT1, wk);
      const tip = easeIn(ramp(v, KISS[0], KISS[1]));
      const ang = 1.47 * tip;
      const itPose: PersonPose = v < IT_WALK[1]
        ? {...walk(v - IT_WALK[0], 1), armL: [0.25, 0.1], elbowL: 1.0}
        : {armL: [lerp(0.25, 2.8, tip), lerp(0.1, 0.5, tip)], armR: [lerp(0.1, 2.8, tip), lerp(-0.06, -0.5, tip)], elbowL: lerp(1.0, 0.2, tip), head: [lerp(0, -0.5, tip), 0], eyes: 0.4 + 0.6 * (1 - tip)};
      const headAt: V3 = [itPos[0], 0.35, itPos[2] + 2.0];
      return (
        <>
          <DaySky />
          <DayLights />
          <Terminal doors={doors} />
          {ARRIVERS.map((a) => {
            const t = v - a.t0;
            if (t < 0 || v >= 30.4) return null;
            const k = clamp01(t / 4.2);
            const p = lerp3([0, 0, -0.1], a.to, k);
            return (
              <Guy
                key={a.i}
                position={p}
                rotation={yawTo([0, 0, -0.1], a.to)}
                i={a.i + 1}
                pose={{...(k < 1 ? walk(t, 1, 1.6) : {}), armR: [-0.3, -0.06], elbowR: 0.1, mouth: 0.3 * (a.i % 2)}}
                rightHand={<Suitcase color={['#d84a4a', '#3a6ad8', '#2a2a30', '#e8b04a'][a.i % 4]} />}
              />
            );
          })}
          {/* the IT guy: hoodie, laptop; falls flat and kisses the asphalt */}
          {v >= IT_WALK[0] - 0.3 ? (
            <group position={[itPos[0], 0.12 * tip, itPos[2]]} rotation={[ang, 0, 0]}>
              <Person
                position={[0, 0, 0]}
                rotation={0}
                shirt="#3a3d46"
                pants="#2a2a30"
                hair="#2a1d15"
                pose={itPose}
                leftHand={tip < 0.2 ? <Laptop /> : undefined}
                headExtra={
                  <>
                    <Box size={[0.36, 0.2, 0.08]} position={[0, 0.12, -0.17]} color="#3a3d46" />
                    <Box size={[0.24, 0.05, 0.012]} position={[0, 0.21, 0.158]} color="#1a1a1e" shadow={false} />
                  </>
                }
              />
            </group>
          ) : null}
          {v >= KISS[1] ? (
            <group position={[itPos[0] + 0.45, 0.05, itPos[2] + 0.5]} rotation={[-Math.PI / 2, 0, 0.4]}>
              <Box size={[0.32, 0.22, 0.02]} color="#b8bcc4" />
            </group>
          ) : null}
          <Heart position={headAt} k={ramp(v, KISS[2], KISS[2] + 1.4)} />
        </>
      );
    },
  },
  tech: {
    view: (v) => {
      if (v < 36.35) {
        const x = lerp(-1.25, 1.2, smooth(ramp(v, 34.3, 35.95)));
        return {pos: [x * 0.85, 1.2, 3.1], target: [x, 0.75, -0.6], fov: 40, far: 3000};
      }
      const k = clamp01((v - TV_WALK[0]) / (TV_WALK[1] - TV_WALK[0]));
      const p = lerp3(TV_MAN[0], TV_MAN[1], k);
      return mv(v, 36.35, E('tech'), [-1.2, 1.7, 9.5], [-0.7, 1.65, 9.9], [2.8, 1.4, 2.6], [p[0], 1.45, p[2]], [46, 46]);
    },
    render: (v) => {
      const ks = TAGS.map((a) => ramp(v, a - 0.05, a + 0.55));
      const k = clamp01((v - TV_WALK[0]) / (TV_WALK[1] - TV_WALK[0]));
      const p = lerp3(TV_MAN[0], TV_MAN[1], k);
      const yaw = yawTo(TV_MAN[0], TV_MAN[1]);
      const wob = Math.sin(v * 7) * 0.05 * (k > 0 && k < 1 ? 1 : 0);
      return (
        <>
          <TechStore ks={ks} />
          <Person
            position={p}
            rotation={yaw}
            shirt="#ef8f4a"
            pants="#2c3550"
            hair="#3a2a1e"
            pose={{...(k > 0 && k < 1 ? walk(v - TV_WALK[0], 0.7) : {}), armL: [1.5, 0.15], armR: [1.5, -0.15], elbowL: 0.2, elbowR: 0.2, head: [-0.1, 0]}}
          />
          <group position={[p[0] + Math.sin(yaw) * 0.32, 0, p[2] + Math.cos(yaw) * 0.32]} rotation={[0, yaw, wob]}>
            {[0, 1, 2].map((i) => (
              <TvBox key={i} position={[(i - 1) * 0.04, 1.15 + i * 0.56, 0]} />
            ))}
          </group>
          {/* the cashier */}
          <Guy position={[3.9, 0, 2.0]} rotation={-0.4} i={4} pose={{armR: [v > CASH ? 1.0 : 0.4, -0.1], elbowR: 0.8, mouth: v > CASH ? 0.4 : 0}} />
        </>
      );
    },
  },
  road: {
    view: (v) => {
      const rx = lerp(ROLLER[2], ROLLER[3], ramp(v, ROLLER[0], ROLLER[1]));
      if (v < 44.0) return {pos: [rx + 5.6, 1.7, 7.2], target: [rx + 0.6, 0.6, 0], fov: 46, far: 3000};
      return mv(v, 44.0, E('road'), [rx - 9, 3.0, 6.5], [rx - 11, 7.5, 7.5], [rx, 0.5, 0], [rx, 0.3, 0], [48, 50]);
    },
    render: (v) => {
      const rx = lerp(ROLLER[2], ROLLER[3], ramp(v, ROLLER[0], ROLLER[1]));
      const fresh = rx - ROLLER[2] + 3;
      return (
        <>
          <DaySky c={NIGHT} fog={[25, 200]} fogCol="#0e1424" />
          <NightLights />
          <hemisphereLight color="#8a9ac8" groundColor="#2a2a34" intensity={0.6} />
          {/* old grey asphalt with cracks, sidewalks, houses */}
          <Box size={[60, 0.1, 7]} position={[0, -0.05, 0]} color="#4e4f55" />
          {Array.from({length: 20}).map((_, i) => (
            <Box key={i} size={[0.8 + rnd(i) * 1.2, 0.004, 0.04]} position={[-28 + i * 3 + rnd(i + 2), 0.002, -2.5 + rnd(i + 5) * 5]} rotation={[0, rnd(i + 9) * 3, 0]} color="#2e2f34" shadow={false} />
          ))}
          {/* fresh black asphalt behind the roller */}
          <Box size={[fresh, 0.02, 6.6]} position={[ROLLER[2] - 3 + fresh / 2, 0.01, 0]} color="#18191c" />
          <Box size={[60, 0.14, 3]} position={[0, 0.02, -5]} color="#7a776e" />
          <Box size={[60, 0.14, 3]} position={[0, 0.02, 5]} color="#7a776e" />
          {Array.from({length: 4}).map((_, i) => (
            <Facade key={i} position={[-21 + i * 14, 0, -11]} size={[12, 15, 6]} cols={6} rows={6} wall="#6a6e7a" seed={i + 2} />
          ))}
          {[-12, -2, 8, 18].map((x, i) => (
            <StreetLamp key={x} position={[x, 0, -3.8]} light={i === 1 || i === 2} />
          ))}
          {HOLES_X.map((hx, i) => (
            <Pothole key={i} position={[hx, 0, i % 2 ? 0.7 : -0.6]} seed={i} k={smooth(ramp(rx, hx - 0.25, hx + 0.15))} />
          ))}
          <Roller x={rx} t={v} />
          {/* a worker with a shovel walking behind */}
          <Person position={[rx - 4.2, 0, 1.6]} rotation={Math.PI / 2} shirt="#ff7a1a" pants="#2a3a5a" hair="#3a2a1e" pose={walk(v, 0.8)} />
        </>
      );
    },
  },
  school: {
    view: (v) => {
      if (v < 49.55) return mv(v, S('school'), 49.55, [0.1, 1.75, 4.4], [0.5, 1.7, 3.4], [1.0, 1.45, -1.7], [1.0, 1.5, -1.6], [44, 42]);
      if (v < 50.75) return mv(v, 49.55, 50.75, [0.64, 1.76, -0.15], [0.6, 1.75, -0.36], [0.57, 1.72, -0.96], [0.57, 1.72, -0.96], [34, 32]);
      return mv(v, 50.75, E('school'), [-0.4, 1.55, 2.7], [-0.15, 1.5, 2.2], [1.45, 1.05, -1.5], [1.45, 0.95, -1.5], [46, 44]);
    },
    shakes: [[DROP[1], 0.12]],
    render: (v) => {
      const look = smooth(ramp(v, BUZZ + 0.1, BUZZ + 0.6));
      const on = ramp(v, BUZZ + 0.05, BUZZ + 0.3);
      const shock = smooth(ramp(v, 50.75, 51.0));
      const TEACH: V3 = [0.9, 0, -1.7];
      const pointerHeld = v < DROP[0];
      const pk = clamp01((v - DROP[0]) / (DROP[1] - DROP[0]));
      const hand = handWorld(TEACH, 0, 1.0, 0.4, 1);
      return (
        <>
          <Classroom />
          <Person
            position={TEACH}
            shirt="#8a4a7a"
            pants="#3a3a44"
            hair="#4a3324"
            longHair
            pose={{armR: [1.0, -0.15], elbowR: 0.4, armL: [lerp(0.2, 1.25, look), 0.35], elbowL: lerp(0.2, 1.3, look), head: [lerp(-0.05, 0.25, look) - 0.2 * shock, 0.2 * look], eyes: 1 + 0.8 * shock, mouth: shock}}
            rightHand={pointerHeld ? <Box size={[0.02, 0.02, 0.9]} position={[0, -0.02, 0.4]} color="#8a5a2a" /> : undefined}
            headExtra={
              <>
                <Box size={[0.25, 0.05, 0.012]} position={[0, 0.21, 0.158]} color="#2a2a2e" shadow={false} />
              </>
            }
          />
          {/* the pointer falling to the floor */}
          {!pointerHeld ? (
            <group position={[hand[0], lerp(hand[1] - 0.02, 0.02, pk * pk), hand[2] + 0.4 * (1 - pk)]} rotation={[lerp(0, 0.3, pk), 0.4 * pk, 0]}>
              <Box size={[0.02, 0.02, 0.9]} position={[0, 0, 0]} color="#8a5a2a" />
            </group>
          ) : null}
          {/* the phone in front of her face */}
          {look > 0 ? (
            <group position={[0.57, lerp(1.2, 1.72, look), -0.96]} rotation={[-0.05, 0.0, 0]}>
              <PhoneScreen on={on} />
            </group>
          ) : null}
          {/* the school nurse next to her, her phone buzzed too */}
          <Person
            position={[2.15, 0, -1.4]}
            rotation={-0.5}
            shirt="#f4f6f8"
            pants="#e8ecf0"
            hair="#2a1d15"
            pose={{armL: [1.25, 0.2], elbowL: 1.3, head: [0.3 - 0.25 * shock, 0], eyes: 1 + 0.8 * shock, mouth: shock}}
            leftHand={<Box size={[0.08, 0.15, 0.012]} position={[0, -0.02, 0.07]} rotation={[0.2, 0, 0]} color="#1a1a1e" />}
            bodyExtra={
              <>
                <Box size={[0.03, 0.4, 0.02]} position={[-0.1, 1.3, 0.16]} color="#2a2a30" shadow={false} />
                <Box size={[0.03, 0.4, 0.02]} position={[0.1, 1.3, 0.16]} color="#2a2a30" shadow={false} />
                <Cyl rTop={0.04} rBottom={0.04} height={0.02} position={[0, 1.1, 0.17]} rotation={[Math.PI / 2, 0, 0]} color="#9aa0a8" />
                <Box size={[0.08, 0.08, 0.02]} position={[0.19, 1.4, 0.166]} color="#d62a22" shadow={false} />
              </>
            }
          />
          {/* the class: kids at desks, backs to us */}
          {[[-1.3, 0.4], [0.3, 0.4], [1.9, 0.4], [-1.3, 1.7], [0.3, 1.7], [1.9, 1.7]].map(([x, z], i) => (
            <group key={i}>
              <SchoolDesk position={[x, 0, z]} />
              <Person position={[x + (i % 2 ? 0.25 : -0.25), -0.15, z + 0.55]} rotation={Math.PI} child scale={0.72} shirt={['#4a7fd0', '#e85d5d', '#6fbf73', '#f2c14e', '#b36ad1', '#4fb6c2'][i]} pants="#2c3550" hair={['#2a1d15', '#c9a46a', '#7b5434'][i % 3]} longHair={i % 2 === 1} pose={{...SIT, armL: [1.2, 0.1], armR: [1.2, -0.1], elbowL: 0.4, elbowR: 0.4, head: [0.1 - 0.2 * shock, 0]}} />
            </group>
          ))}
        </>
      );
    },
  },
  embassy: {
    view: (v) => mv(v, S('embassy'), E('embassy'), [12.5, 1.7, 8.4], [4.6, 2.4, 10.8], [8.5, 1.3, 3.8], [0.6, 3.0, 0.0], [46, 50]),
    render: (v) => (
      <>
        <DaySky />
        <DayLights />
        <Box size={[60, 0.1, 30]} position={[0, -0.05, 6]} color="#b9b3a8" />
        <Box size={[60, 0.1, 10]} position={[0, -0.06, 14]} color="#55565c" />
        <Embassy />
        {VISA_Q.map((p, i) => (
          <Foreigner
            key={i}
            position={p}
            rotation={i < 4 ? Math.PI : -Math.PI / 2 + (rnd(i) - 0.5) * 0.3}
            i={i}
            pose={{head: [0.05 + 0.1 * Math.sin(v * 0.8 + i), 0.2 * Math.sin(v * 0.5 + i * 2)], armL: [0.1, 0.08 + 0.04 * Math.sin(v + i)], mouth: i === 6 ? 0.8 * Math.max(0, Math.sin((v - 53) * 1.5)) : 0}}
          />
        ))}
        {/* one of them brought a folding chair and a thermos: it's going to be long */}
        <FoldingChair position={[9.0, 0, 4.6]} rotation={-Math.PI / 2} />
        <Foreigner position={[9.0, -0.33, 4.62]} rotation={-Math.PI / 2} i={4} pose={{...SIT, head: [0.3, 0], eyes: 0.3}} />
      </>
    ),
  },
  rate2: {
    view: (v) => mv(v, S('rate2'), E('rate2'), [2.3, 1.3, 8.8], [1.4, 1.5, 5.0], [0, 3.05, 0.2], [0.3, 2.45, 0.8], [42, 44]),
    shakes: [[COUNT2[1], 0.35]],
    render: (v) => {
      const value = usdAt(v, COUNT2, 30, 5);
      const give = smooth(ramp(v, 59.6, 60.2));
      return (
        <>
          <DayStreet />
          <group position={[0, 0, -0.3]}>
            <UsdBooth value={value} down={v > COUNT2[0]} />
          </group>
          <Foreigner position={[0.35, 0, 1.15]} rotation={Math.PI - 0.15} i={0} pose={{armR: [lerp(0.6, 1.3, give), -0.1], armL: [lerp(0.6, 1.3, give), 0.1], elbowR: 0.7, elbowL: 0.7, head: [-0.35, 0], mouth: 0.6 * smooth(ramp(v, COUNT2[1], COUNT2[1] + 0.3))}} />
          <group position={[0.35, lerp(0.95, 1.05, give), lerp(0.75, 0.6, give)]}>
            <MoneySack />
          </group>
          {[[-1.8, 3.0], [-1.0, 3.8], [2.6, 3.0], [-2.6, 2.2], [-0.6, 4.6]].map(([x, z], i) => {
            const cheer = smooth(ramp(v, COUNT2[1] + 0.1 + i * 0.07, COUNT2[1] + 0.4 + i * 0.07));
            return (
              <Guy key={i} position={[x, Math.abs(Math.sin((v - COUNT2[1]) * 7 + i)) * 0.1 * cheer, z]} rotation={Math.PI + (rnd(i + 3) - 0.5) * 0.4} i={i + 1} pose={{head: [-0.4, 0], armR: [lerp(0.1, 2.9, cheer), -0.2], armL: [lerp(0.1, 2.9, cheer), 0.2], mouth: cheer * 0.8}} />
            );
          })}
        </>
      );
    },
  },
  family: {
    view: (v) => mv(v, S('family'), E('family'), [2.5, 2.35, 1.7], [1.6, 2.25, 2.1], [0.1, 0.85, -1.5], [0.05, 0.9, -1.5], [56, 54]),
    render: (v) => {
      const stir = CLINKS.reduce((a, c) => a + Math.max(0, 1 - Math.abs(v - c) / 0.5), 0);
      const content: PersonPose = {eyes: 0.45, head: [0.08, 0]};
      return (
        <>
          <Kitchen t={v} night={false} tvOn={false} table={<TableTop />} />
          <Family
            p={{
              granny: {...content, armR: [0.95, -0.1], elbowR: 0.9 + 0.15 * Math.sin(v * 12) * Math.min(1, stir)},
              uncle: {...content, armL: [0.9, 0.1], armR: [0.9, -0.1], elbowL: 0.8, elbowR: 0.8},
              mom: {...content, armL: [0.8, 0.1], elbowL: 0.9},
              hero: {...content, head: [0.1, 0.25 * Math.sin(v * 0.4)]},
              kid: {eyes: 0.9, head: [0.15, -0.2]},
            }}
          />
        </>
      );
    },
  },
  uncle: {
    view: (v) => {
      if (v < 71.75) return mv(v, S('uncle'), 71.75, [2.1, 1.7, -0.9], [1.8, 1.62, -1.0], [0.15, 1.32, -1.4], [0.15, 1.36, -1.4], [40, 36]);
      return mv(v, 71.75, E('uncle'), [2.35, 1.85, -0.7], [2.15, 1.8, -0.8], [-0.6, 1.05, -1.42], [-0.62, 1.08, -1.42], [50, 48]);
    },
    shakes: [[FIST, 0.5]],
    render: (v) => {
      const up = smooth(ramp(v, PAPER - 0.1, PAPER + 0.35));
      const down = smooth(ramp(v, 71.45, 71.75));
      const lift = smooth(ramp(v, 71.75, 72.0));
      const slam = easeIn(ramp(v, 72.0, FIST));
      const jump = v > FIST ? Math.max(0, Math.sin((v - FIST) * 18) * Math.exp(-(v - FIST) * 7)) : 0;
      const flinch = smooth(ramp(v, FIST + 0.1, FIST + 0.35));
      const shout = v > 72.55 && v < 74.4 ? 0.35 + 0.55 * Math.abs(Math.sin((v - 72.55) * 11)) : 0;
      const paperOn = up * (1 - down);
      const U = seated('uncle');
      // the paper in front of his face, facing the camera side (+x)
      const paperPos: V3 = [U[0] + 0.92, lerp(0.95, 1.38, paperOn), U[2]];
      const armUp = Math.max(paperOn, 0);
      const uncleR: PersonPose = v < 71.75
        ? {armR: [lerp(0.9, 1.35, armUp), -0.35 * armUp], elbowR: lerp(0.8, 0.9, armUp)}
        : {armR: [lerp(lerp(0.9, 2.6, lift), 0.95, slam), -0.1], elbowR: lerp(0.8, 0.3, lift)};
      return (
        <>
          <Kitchen t={v} night={false} tvOn={false} table={<TableTop jump={jump} />} />
          <Family
            uncleRed={v > FIST ? 1 : 0}
            p={{
              granny: {eyes: 1 + 0.6 * flinch, armR: [lerp(0.95, 2.5, flinch), -0.3], elbowR: lerp(0.9, 2.3, flinch), head: [0.08 + 0.3 * flinch, 0]},
              uncle: {...uncleR, armL: [lerp(0.9, 1.35, armUp), 0.35 * armUp], elbowL: 0.8, head: [lerp(0.1, -0.05, armUp) - 0.1 * shout, 0], mouth: shout, eyes: 1 + 0.4 * (v > FIST ? 1 : 0)},
              mom: {eyes: 1 + 0.6 * flinch, armL: [lerp(0.8, 0.3, flinch), 0.1], elbowL: lerp(0.9, 0.3, flinch), head: [-0.15 * flinch, 0]},
              hero: {armL: [lerp(0.1, 2.6, flinch), 0.3], armR: [lerp(0.1, 2.6, flinch), -0.3], elbowL: 2.2 * flinch, elbowR: 2.2 * flinch, head: [0.1, -0.3 * flinch]},
              kid: {eyes: 1 + 0.8 * flinch, head: [0.15, -0.4 * flinch], mouth: 0.5 * flinch},
            }}
          />
          {paperOn > 0.02 ? (
            <group position={paperPos} rotation={[0, Math.PI / 2, 0]}>
              <Newspaper open={1} />
            </group>
          ) : v > 71.6 ? (
            <group position={[U[0] + 0.62, 0.81 + jump * 0.06, U[2] + 0.12]} rotation={[-Math.PI / 2, 0, Math.PI / 2 + 0.2]}>
              <Newspaper open={1} />
            </group>
          ) : null}
        </>
      );
    },
  },
};

// ---------------------------------------------------------------- camera + world

export const viewAt = (v: number): View => {
  const s = shotAt(v);
  const sc = SCENES[s.name];
  const view = sc.view(v);
  const hv = handheld(view, v, sc.shakes ?? []);
  const d = Math.hypot(view.pos[0] - view.target[0], view.pos[1] - view.target[1], view.pos[2] - view.target[2]);
  const k = Math.min(1, 2 / d);
  const off: V3 = [hv.pos[0] - view.pos[0], hv.pos[1] - view.pos[1], hv.pos[2] - view.pos[2]];
  return {
    ...hv,
    pos: [view.pos[0] + off[0] * k, view.pos[1] + off[1] * k, view.pos[2] + off[2] * k],
    target: [view.target[0] - off[0] * (1 - k), view.target[1] - off[1] * (1 - k), view.target[2] - off[2] * (1 - k)],
  };
};

export const World: React.FC<{v: number; view?: (v: number) => View; shot?: Shot}> = ({v, view, shot}) => {
  const s = shot ?? shotAt(v).name;
  return (
    <>
      <CameraRig v={v} view={view ?? viewAt} />
      {SCENES[s].render(v)}
    </>
  );
};

export {SCENES, DAY};

// ---------------------------------------------------------------- the cover: the hero turned to us, jaw dropped, the mug in the air, TV behind

const COVER_CAM: V3 = [1.7, 1.55, 2.5];
const COVER_HERO: V3 = [-0.12, 0, 0.6];
export const coverView: View = {pos: COVER_CAM, target: [-1.7, 1.55, -0.1], fov: 54, far: 3000};
export const CoverScene: React.FC = () => {
  const yaw = yawTo(COVER_HERO, COVER_CAM) + 0.35;
  const h = handWorld(COVER_HERO, yaw, 0.35, 0.5, 1);
  return (
    <>
      <CameraRig v={0} view={() => coverView} />
      <Kitchen t={FIREWORKS[2] + 0.5} />
      <Hero position={COVER_HERO} rotation={yaw} pose={{head: [-0.06, -0.1], mouth: 1, eyes: 1.8, armR: [0.35, -0.08], elbowR: 0.5, armL: [0.3, 0.12], elbowL: 0.6}} />
      <Mug position={[h[0] + 0.05, h[1] - 0.28, h[2] + 0.05]} rotation={[0.9, 0, 0.6]} />
    </>
  );
};
