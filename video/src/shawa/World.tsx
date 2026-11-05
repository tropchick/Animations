import React from 'react';
import {Box, Cyl} from '../scene/parts';
import {Person, PersonPose} from '../scene/Characters';
import {CameraRig, View, handheld} from '../slime/camera';
import {
  BITE,
  BITES,
  BOX_OPEN,
  BUBBLE1,
  BUBBLE2,
  CART,
  COUNT,
  DOOR,
  DOORS,
  FLIPS,
  GASP,
  GLANCE,
  HANDOVER,
  HATCH,
  JAW,
  KNOCKS,
  ONE,
  RIP,
  SIGN,
  STAMP,
  SWAP,
  STACK,
  Shot,
  TAGS,
  TUG,
  V3,
  WALLET,
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
  ABoard,
  Bench,
  Bubble,
  Case,
  BurgerShop,
  Cart,
  DAY,
  DayLights,
  DaySky,
  DeckChair,
  EVENING,
  Flat,
  FoldingChair,
  FrozenShawarma,
  Facade,
  FramedTag,
  Guard,
  Gulls,
  Guy,
  Keys,
  Kiosk,
  MenuBoard,
  Office,
  PhoneStand,
  Pier,
  RateBooth,
  RingBox,
  SIT,
  Sea,
  SecretDoor,
  Seller,
  Shawarma,
  Shelf,
  ShelfTag,
  SpitHouse,
  Street,
  Van,
  Wallet,
  walk,
} from './Sets';
import {Tree} from '../scene/parts';
import {Yacht as YachtHull} from './Sets';
import {Sky} from '../gta/World';

const S = (n: Shot) => shotStart(n);
const E = (n: Shot) => shotEnd(n);
const mv = (v: number, t0: number, t1: number, a: V3, b: V3, ta: V3, tb: V3, fov: number | [number, number], far = 3000): View => {
  const k = smooth(ramp(v, t0, t1));
  return {pos: lerp3(a, b, k), target: lerp3(ta, tb, k), fov: typeof fov === 'number' ? fov : lerp(fov[0], fov[1], k), far};
};
const yawTo = (from: V3, to: V3) => Math.atan2(to[0] - from[0], to[2] - from[2]);

// ---------------------------------------------------------------- the street with the kiosk

const BOARD: V3 = [-2.3, 0, 2.0];
const BOARD_YAW = 0.35;
// the price card's centre in the world (the front leaf leans back a little)
const TAG: V3 = [BOARD[0] + Math.sin(BOARD_YAW) * 0.37, 1.02, BOARD[2] + Math.cos(BOARD_YAW) * 0.37];
const N: V3 = [Math.sin(BOARD_YAW), 0, Math.cos(BOARD_YAW)];
const HERO: V3 = [0.2, 0, 3.1];
const HERO_YAW = yawTo(HERO, TAG);
const QUEUE: V3[] = [
  [0.1, 0, 1.75],
  [0.35, 0, 2.45],
  [0.0, 0, 3.85],
  [0.3, 0, 4.6],
];

const StallStreet: React.FC<{v: number; children?: React.ReactNode}> = ({v, children}) => (
  <>
    <DaySky />
    <DayLights />
    <Street len={90} />
    {children ?? <Kiosk t={v} seller={<Seller position={[0.3, 0.2, 0.15]} pose={{armL: [0.5, 0.1], armR: [0.5, -0.1], elbowL: 0.8, elbowR: 0.8}} />} />}
  </>
);

// ---------------------------------------------------------------- scenes

type Scene = {view: (v: number) => View; render: (v: number) => React.ReactNode; shakes?: [number, number][]};

const STUDENTS = [-1.17, -0.39, 0.39, 1.17];
// who holds the shawarma: student i from just after bite i-1 to just after bite i
const holder = (v: number) => {
  for (let i = 0; i < 4; i++) if (v < BITES[i] + 0.3) return i;
  return 3;
};
const biteK = (v: number, i: number) => {
  const a = BITES[i] - 0.45;
  return smooth(ramp(v, a, BITES[i])) * (1 - smooth(ramp(v, BITES[i] + 0.12, BITES[i] + 0.4)));
};

const SHELF_STOCK = (row: number) => {
  // a few things left on the far shelves; none of them lavash or chicken
  if (row === 0) return <Box size={[0.3, 0.2, 0.25]} position={[-0.9, 0.27, 0]} color="#d8b04a" />;
  if (row === 2) return <Cyl rTop={0.06} rBottom={0.06} height={0.2} position={[1.1, 1.17, 0.05]} color="#5a8ad0" />;
  return null;
};

const SCENES: Record<Shot, Scene> = {
  stall: {
    view: (v) => {
      if (v < 2.75) {
        const close: V3 = [TAG[0] + N[0] * 2.5 + 0.1, TAG[1] + 0.35, TAG[2] + N[2] * 2.5];
        return mv(v, 0.0, 2.0, [-0.9, 2.3, 7.0], close, [-1.75, 1.55, 1.2], [TAG[0], TAG[1] + 0.05, TAG[2]], [50, 40]);
      }
      const d: V3 = [Math.sin(HERO_YAW), 0, Math.cos(HERO_YAW)];
      const side: V3 = [d[2], 0, -d[0]];
      const a: V3 = [HERO[0] + d[0] * 1.9 + side[0] * 0.45, 1.8, HERO[2] + d[2] * 1.9 + side[2] * 0.45];
      const b: V3 = [HERO[0] + d[0] * 1.55 + side[0] * 0.4, 1.82, HERO[2] + d[2] * 1.55 + side[2] * 0.4];
      return mv(v, 2.75, 4.5, a, b, [HERO[0], 1.72, HERO[2]], [HERO[0], 1.74, HERO[2]], [42, 40]);
    },
    shakes: [[JAW, 0.6]],
    render: (v) => {
      const j = smooth(ramp(v, JAW, JAW + 0.22));
      const leave = (i: number) => Math.max(0, v - (3.7 + i * 0.18));
      return (
        <StallStreet v={v}>
          <Kiosk t={v} seller={<Seller position={[0.3, 0.2, 0.15]} pose={{armL: [0.5, 0.1], armR: [0.5, -0.1], elbowL: 0.8, elbowR: 0.8, head: [0, j * 0.3]}} />} />
          <ABoard position={BOARD} rotation={BOARD_YAW} write={1} one={ramp(v, ONE[0], ONE[1])} />
          <Guy
            position={HERO}
            rotation={HERO_YAW}
            i={6}
            pose={{head: [lerp(0.1, -0.05, j), 0], mouth: j, eyes: 1 + 0.7 * j, armL: [0.15 + 0.2 * j, 0.1], armR: [0.15 + 0.2 * j, -0.1], elbowL: 0.3, elbowR: 0.3}}
          />
          {QUEUE.map((p, i) => {
            const t = leave(i);
            const dir = i % 2 ? 1 : -1;
            const turn = smooth(Math.min(1, t / 0.35));
            const yaw0 = Math.PI;
            const yaw1 = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
            const go = Math.max(0, t - 0.25);
            const sp = 1.3 * easeOut(Math.min(1, go / 0.5)) * go;
            return (
              <Guy
                key={i}
                position={[p[0] + dir * sp, 0, p[2] + 0.2 * sp]}
                rotation={lerp(yaw0, yaw1, turn)}
                i={i}
                pose={t > 0.25 ? walk(go, Math.min(1, go * 3)) : {head: [0.1, 0]}}
              />
            );
          })}
        </StallStreet>
      );
    },
  },
  bench: {
    view: (v) => mv(v, S('bench'), E('bench'), [3.4, 1.55, 3.3], [2.9, 1.45, 2.8], [-0.2, 1.05, 0.1], [0.0, 1.0, 0.1], [44, 42]),
    render: (v) => {
      const h = holder(v);
      return (
        <>
          <DaySky />
          <DayLights />
          <Box size={[60, 0.1, 60]} position={[0, -0.05, 0]} color="#7fb860" />
          <Box size={[60, 0.02, 2.2]} position={[0, 0.01, 1.8]} color="#d8c8a8" shadow={false} />
          {[-6, -2.5, 3, 7].map((x, i) => (
            <Tree key={i} position={[x, 0, -4 - (i % 2) * 2]} size={0.95} seed={i + 3} />
          ))}
          <Bench />
          {STUDENTS.map((x, i) => {
            const has = h === i;
            const b = has ? biteK(v, i) : 0;
            const done = v > BITES[i] + 0.3;
            const left = i === 3;
            const len = [1, 0.7, 0.42, 0][i] - (has && v > BITES[i] ? 0.25 : 0);
            const pose: PersonPose = {
              ...SIT,
              armL: [0.55, 0.12],
              elbowL: 0.7,
              armR: has ? [lerp(0.7, 1.15, b), -0.32] : [0.55, -0.12],
              elbowR: has ? lerp(0.9, 1.85, b) : 0.7,
              head: [has ? lerp(0.25, 0.05, b) : 0.15 + (done && left ? 0.25 : 0), has ? 0 : (h - i) * 0.25],
              mouth: has ? b * 0.6 : 0,
            };
            return (
              <Guy
                key={i}
                position={[x, -0.235, 0.04]}
                scale={0.9}
                i={i + 2}
                pose={pose}
                rightHand={has ? <Shawarma len={Math.max(0.05, len)} empty={left} rotation={[Math.PI, 0, 0]} position={[0, 0.04, 0.03]} scale={1.5} /> : undefined}
              />
            );
          })}
        </>
      );
    },
  },
  queue: {
    view: (v) => mv(v, S('queue'), E('queue'), [3.4, 2.1, 2.4], [-30, 1.6, -1.2], [1.0, 2.5, -5.9], [-33.4, 0.9, -5.3], [50, 44]),
    render: (v) => (
      <>
        <DaySky />
        <DayLights />
        <Street len={120} x0={-20} trees={false} />
        <BurgerShop position={[1.5, 0, -5.9]} />
        {Array.from({length: 38}).map((_, i) => {
          const x = 0.5 - i * 0.85;
          const z = -5.0 + (rnd(i + 7) - 0.5) * 0.25;
          return <Guy key={i} position={[x, 0, z]} rotation={Math.PI / 2 + (rnd(i) - 0.5) * 0.3} i={i} pose={{head: [0.05, Math.sin(v * 0.8 + i) * 0.3], armL: [0.1, 0.1], armR: [0.1, -0.1]}} />;
        })}
        <FoldingChair position={[-32.4, 0, -5.0]} rotation={Math.PI / 2} />
        <Person position={[-32.4 + 0.02, -0.38, -5.0]} rotation={Math.PI / 2} shirt="#7a5ab0" pants="#2c3550" hair="#4a3324" pose={{...SIT, head: [0.55, 0.3], armL: [0.3, 0.2], armR: [0.3, -0.2], elbowL: 1.2, elbowR: 1.2}} />
      </>
    ),
  },
  menu: {
    view: (v) => mv(v, S('menu'), E('menu'), [0.35, 1.95, 4.4], [0.1, 2.1, 3.0], [0.0, 2.25, -3], [0.0, 2.35, -3], [44, 42]),
    shakes: FLIPS.map((f) => [f, 0.12] as [number, number]),
    render: (v) => (
      <>
        <color attach="background" args={['#201a18']} />
        <hemisphereLight color="#fff0dc" groundColor="#5a4a40" intensity={1.0} />
        <pointLight position={[0, 3.2, -1]} color="#fff2dc" intensity={10} distance={10} decay={1.6} />
        <pointLight position={[0, 2.6, 2.5]} color="#ffe8cc" intensity={5} distance={8} decay={1.8} />
        <Box size={[10, 0.1, 10]} position={[0, -0.05, 0]} color="#8a6a5a" />
        <Box size={[10, 4, 0.2]} position={[0, 2, -3.2]} color="#d8562a" />
        <Box size={[10, 0.2, 10]} position={[0, 3.9, 0]} color="#3a2a28" />
        <MenuBoard position={[0, 2.5, -3.04]} ks={FLIPS.map((f) => ramp(v, f - 0.1, f + 0.12))} />
        <Box size={[4, 1.05, 0.8]} position={[0, 0.525, -1.6]} color="#3a3640" />
        <Box size={[4.1, 0.05, 0.9]} position={[0, 1.075, -1.6]} color="#c8ccd2" />
        <Person position={[1.35, 0, -2.4]} shirt="#ffb02e" pants="#2c2c32" hair="#2a1d15" pose={{head: [0, Math.sin(v * 1.3) * 0.2], armL: [0.3, 0.1], armR: [0.3, -0.1], elbowL: 0.8, elbowR: 0.8}} headExtra={<Box size={[0.33, 0.08, 0.33]} position={[0, 0.375, 0]} color="#ffb02e" />} />
        {/* the backs of the people in the queue: foreground for the push-in */}
        <Guy position={[-0.65, 0, 0.6]} rotation={Math.PI} i={3} pose={{head: [-0.15, 0]}} />
        <Guy position={[0.85, 0, 0.1]} rotation={Math.PI + 0.2} i={5} pose={{head: [-0.15, 0]}} />
      </>
    ),
  },
  windows: {
    view: (v) => mv(v, S('windows'), E('windows'), [2.6, 1.6, 10.5], [1.4, 15.5, 8.2], [0.4, 4.5, 0], [0.0, 18.5, 0], [46, 48]),
    render: (v) => (
      <>
        <Sky c={EVENING} />
        <hemisphereLight color="#8a90c0" groundColor="#3a2a3a" intensity={0.9} />
        <directionalLight position={[40, 30, 60]} color="#ffb47a" intensity={1.1} />
        <Box size={[80, 0.1, 40]} position={[0, -0.05, 6]} color="#5a5a60" />
        <SpitHouse t={v} />
      </>
    ),
  },
  shop: {
    view: (v) => mv(v, S('shop'), E('shop'), [0.35, 1.7, 2.8], [0.05, 1.6, -4.9], [0, 1.2, -10], [0, 1.25, -10.2], [50, 50]),
    shakes: [[RIP, 0.35]],
    render: (v) => {
      const tug = smooth(ramp(v, TUG[0], RIP));
      const after = Math.max(0, v - RIP);
      const back = easeOut(Math.min(1, after / 0.4)) * 0.45;
      const cartZ = lerp(-1.6, -6.4, ramp(v, CART - 0.1, CART + 2.6));
      const pull = (side: 1 | -1): PersonPose => ({armL: [1.15, 0], armR: [1.15, 0], elbowL: 0.15, elbowR: 0.15, head: [0.15 - tug * 0.1, 0], legL: 0.25 * side * tug, legR: -0.25 * side * tug});
      const lav = 0.25 + 0.3 * tug;
      return (
        <>
          <color attach="background" args={['#cfd4d8']} />
          <hemisphereLight color="#f4f8ff" groundColor="#8a8a84" intensity={1.4} />
          <pointLight position={[0, 2.8, -1]} color="#f4f8ff" intensity={8} distance={10} decay={1.6} />
          <pointLight position={[0, 2.8, -7]} color="#f4f8ff" intensity={8} distance={10} decay={1.6} />
          <Box size={[8, 0.1, 30]} position={[0, -0.05, -6]} color="#d8d4cc" />
          <Box size={[8, 0.1, 30]} position={[0, 3.2, -6]} color="#eaeaea" />
          <Box size={[8, 3.2, 0.2]} position={[0, 1.6, -12.5]} color="#c8d0d8" />
          {[-1.5, -4.6, -7.7].map((z, i) => (
            <group key={z}>
              <Shelf position={[-1.45, 0, z]} rotation={Math.PI / 2} labels={[['ЛАВАШ', 'ЛАВАШ', 'ЛАВАШ', ''], ['КУРИЦА', 'КУРИЦА', '', 'СОУС'], ['СОУС', '', 'ЛАВАШ', '']][i]} stock={i === 2 ? SHELF_STOCK : undefined} />
              <Shelf position={[1.45, 0, z]} rotation={-Math.PI / 2} labels={[['КУРИЦА', '', 'СОУС', 'СОУС'], ['', 'ЛАВАШ', 'ЛАВАШ', ''], ['', 'КУРИЦА', '', '']][i]} />
            </group>
          ))}
          <Cart position={[-0.72, 0, cartZ]} rotation={0.04} />
          {/* the last lavash, torn between two people */}
          <group position={[0, 0, -10.2]}>
            <Guy position={[-0.48 - lav / 2 - back, 0, 0]} rotation={Math.PI / 2} i={4} pose={pull(-1)} />
            <Guy position={[0.48 + lav / 2 + back, 0, 0]} rotation={-Math.PI / 2} i={7} pose={pull(1)} />
            {after <= 0 ? (
              <Box size={[0.3 + lav, 0.012, 0.5]} position={[0, 1.3, 0.12]} rotation={[1.15, 0, 0]} color="#f0d9a8" />
            ) : (
              <>
                <Box size={[0.42, 0.012, 0.5]} position={[-0.55 - back - 0.05, 1.3 - after * 0.2, 0.12]} rotation={[1.15, 0, -0.5]} color="#f0d9a8" />
                <Box size={[0.42, 0.012, 0.5]} position={[0.55 + back + 0.05, 1.3 - after * 0.2, 0.12]} rotation={[1.15, 0, 0.5]} color="#f0d9a8" />
              </>
            )}
          </group>
        </>
      );
    },
  },
  tags: {
    view: (v) => {
      if (v < TAGS[3] - 0.05) {
        const x = v < TAGS[1] - 0.35 ? -0.9 : v < TAGS[2] - 0.3 ? lerp(-0.9, 0, smooth(ramp(v, TAGS[1] - 0.35, TAGS[1] - 0.05))) : lerp(0, 0.9, smooth(ramp(v, TAGS[2] - 0.3, TAGS[2] - 0.05)));
        const drift = (v - S('tags')) * 0.02;
        return {pos: [x + 0.12, 0.98, 2.15 - drift], target: [x, 0.86, 0.3], fov: 34, far: 100};
      }
      return mv(v, TAGS[3] - 0.05, TAGS[3] + 0.9, [1.02, 0.98, 2.15], [0.5, 1.3, 4.4], [0.9, 0.86, 0.3], [0, 0.95, 0], [34, 44], 100);
    },
    shakes: TAGS.map((t) => [t, 0.15] as [number, number]),
    render: (v) => {
      const big: [string, string, string, number][] = [
        ['КУРИЦА', '320', '640', TAGS[0]],
        ['ЯЙЦА', '110', '220', TAGS[1]],
        ['МАЙОНЕЗ', '95', '190', TAGS[2]],
      ];
      const small: [string, string, string][] = [
        ['ПЕЛЬМЕНИ', '250', '500'],
        ['НАГГЕТСЫ', '290', '580'],
        ['КОТЛЕТЫ', '310', '620'],
        ['БУЛЬОН', '80', '160'],
        ['САЛАТ', '140', '280'],
        ['ПИРОЖКИ', '60', '120'],
      ];
      return (
        <>
          <color attach="background" args={['#cfd4d8']} />
          <hemisphereLight color="#f4f8ff" groundColor="#8a8a84" intensity={1.4} />
          <pointLight position={[0, 2.6, 2]} color="#f4f8ff" intensity={6} distance={8} decay={1.6} />
          <Box size={[8, 0.1, 8]} position={[0, -0.05, 0]} color="#d8d4cc" />
          <Box size={[8, 3.2, 0.2]} position={[0, 1.6, -0.6]} color="#c8d0d8" />
          <Shelf
            position={[0, 0, 0]}
            labels={['', '', '', '']}
            stock={(row, y) =>
              row === 2 ? (
                <>
                  {/* chicken packs, egg cartons, mayonnaise */}
                  {[-1.15, -0.9, -0.65].map((x) => <Box key={x} size={[0.22, 0.09, 0.3]} position={[x, y + 0.065, 0]} color="#f2b8a8" />)}
                  {[-0.2, 0.05, 0.25].map((x) => <Box key={x} size={[0.22, 0.08, 0.28]} position={[x, y + 0.06, 0]} color="#c8b090" />)}
                  {[0.7, 0.85, 1.0, 1.15].map((x) => (
                    <group key={x}>
                      <Cyl rTop={0.045} rBottom={0.055} height={0.2} position={[x, y + 0.12, 0]} color="#f8f6ee" />
                      <Cyl rTop={0.03} rBottom={0.03} height={0.03} position={[x, y + 0.235, 0]} color="#d62a22" />
                    </group>
                  ))}
                </>
              ) : (
                <>
                  {[-1.1, -0.55, 0, 0.55, 1.1].map((x, i) => <Box key={x} size={[0.36, 0.22, 0.3]} position={[x, y + 0.13, 0]} color={['#7aa0d0', '#e8c060', '#9ad08a', '#e88a6a', '#c0a0e0'][(i + row) % 5]} />)}
                </>
              )
            }
          />
          {big.map(([n, a, b, at], i) => (
            <ShelfTag key={n} position={[-0.9 + i * 0.9, 0.86, 0.335]} name={n} a={a} b={b} k={v >= at ? 1 : 0} />
          ))}
          {v < TAGS[3] - 0.05 ? null : small.map(([n, a, b], i) => {
            const row = i < 3 ? 0.42 : 1.31;
            const x = -0.9 + (i % 3) * 0.9;
            return <ShelfTag key={n} position={[x, row, 0.335]} name={n} a={a} b={b} k={v >= TAGS[3] + 0.15 + i * 0.09 ? 1 : 0} size={0.8} />;
          })}
        </>
      );
    },
  },
  door: {
    view: (v) => mv(v, S('door'), E('door'), [2.3, 1.75, 4.0], [1.75, 1.7, 3.2], [-0.15, 1.55, 0.3], [-0.05, 1.5, 0.2], [44, 42]),
    shakes: [...KNOCKS.map((k) => [k, 0.12] as [number, number]), [DOOR, 0.2]],
    render: (v) => {
      const hatch = smooth(ramp(v, HATCH - 0.15, HATCH + 0.15));
      const door = smooth(ramp(v, DOOR, DOOR + 0.6));
      const knock = KNOCKS.reduce((m, k) => Math.max(m, v >= k - 0.12 && v < k + 0.12 ? 1 - Math.abs(v - k) / 0.12 : 0), 0);
      const knocking = v > KNOCKS[0] - 0.4 && v < KNOCKS[2] + 0.35 ? 1 : 0;
      const cam: V3 = [2.0, 1.7, 3.6];
      const b1: V3 = [0.25, 2.12, 0.35];
      const b2: V3 = [-0.85, 2.38, 1.1];
      const gone = 1 - ramp(v, DOOR + 0.2, DOOR + 0.4);
      return (
        <>
          <color attach="background" args={['#0a0c18']} />
          <hemisphereLight color="#3a4a7a" groundColor="#14141a" intensity={0.8} />
          <pointLight position={[2.6, 2.4, 3.4]} color="#8aa0e0" intensity={3} distance={8} decay={1.6} />
          <SecretDoor hatch={hatch} door={door} t={v} />
          <Guy
            position={[-0.45, 0, 0.95]}
            rotation={Math.PI - 0.35}
            i={8}
            pose={{armR: [knocking ? 1.55 : 0.1, -0.1], elbowR: knocking ? 0.7 + knock * 0.5 : 0.1, armL: [0.1, 0.1], head: [-0.05, 0]}}
          />
          <Bubble text="Пароль?" position={b1} rotation={[0, yawTo(b1, cam), 0]} k={gone * ramp(v, BUBBLE1, BUBBLE1 + 0.15)} w={0.9} />
          <Bubble text="Сырный соус." position={b2} rotation={[0, yawTo(b2, cam), 0]} k={gone * ramp(v, BUBBLE2, BUBBLE2 + 0.15)} w={1.15} tailRight />
        </>
      );
    },
  },
  wallet: {
    view: (v) => mv(v, S('wallet'), E('wallet'), [0.06, 0.5, 0.42], [0.03, 0.42, 0.32], [0, 0.0, -0.04], [0, 0.0, -0.03], [40, 38], 50),
    render: (v) => (
      <>
        <color attach="background" args={['#3a2a20']} />
        <hemisphereLight color="#fff2e0" groundColor="#5a4030" intensity={1.2} />
        <pointLight position={[0.3, 0.6, 0.4]} color="#fff2d8" intensity={1.6} distance={3} decay={2} />
        <Box size={[2, 0.04, 2]} position={[0, -0.02, 0]} color="#9a6a42" />
        <Wallet open={smooth(ramp(v, WALLET - 0.2, WALLET + 0.25))} />
        {[0, 1, 2].map((i) => (
          <Cyl key={i} rTop={0.012} rBottom={0.012} height={0.003} position={[0.17 + i * 0.012, 0.0015 + i * 0.003, 0.05 - i * 0.008]} color="#d8b04a" />
        ))}
      </>
    ),
  },
  phone: {
    view: (v) => mv(v, S('phone'), E('phone'), [0.4, 1.75, 2.1], [0.15, 1.6, 1.75], [-0.22, 1.02, 0.1], [-0.18, 1.05, 0.1], [44, 42]),
    shakes: STACK.map((s) => [s, 0.05] as [number, number]),
    render: (v) => {
      const n = 2 + STACK.filter((s) => v >= s - 0.12).length;
      return (
        <>
          <DaySky fog={[20, 200]} />
          <DayLights />
          <Box size={[30, 0.1, 30]} position={[0, -0.05, 0]} color="#b9b3a8" />
          <Box size={[3.4, 0.08, 1.8]} position={[0, 2.6, -0.3]} rotation={[0.15, 0, 0]} color="#3a7ad0" />
          {[-1.6, 1.6].map((x) => <Cyl key={x} rTop={0.03} rBottom={0.03} height={2.6} position={[x, 1.3, -1.0]} color="#9aa0a8" />)}
          <PhoneStand n={Math.min(10, n)} />
          <Seller position={[0.15, 0, -0.75]} shirt="#6a8ad0" apron="#3a3a44" pose={{armL: [0.4, 0.1], armR: [0.4, -0.1], elbowL: 0.9, elbowR: 0.9, head: [0.2 + 0.08 * Math.sin(v * 9), 0]}} />
          <Guy position={[1.4, 0, 0.9]} rotation={-2.2} i={1} pose={{armL: [0.9, 0.1], elbowL: 0.6, armR: [0.3, -0.1], head: [0.35, 0]}} />
        </>
      );
    },
  },
  yacht: {
    view: (v) => mv(v, S('yacht'), E('yacht'), [10.5, 3.6, 11.5], [6.2, 3.0, 10.2], [0, 1.6, 0.5], [0, 2.0, 1.8], [44, 42]),
    shakes: [[39.75, 0.15]],
    render: (v) => (
      <>
        <DaySky fog={[80, 900]} />
        <DayLights />
        <Sea t={v} />
        <Pier />
        <Yacht v={v} />
        <Gulls t={v} center={[2, 8, -4]} r={7} />
      </>
    ),
  },
  rate: {
    view: (v) => {
      if (v < 45.5) return mv(v, S('rate'), 45.0, [1.3, 1.05, 11.2], [0.6, 1.4, 9.0], [0, 2.9, 0.5], [0, 3.05, 0.5], 40);
      return mv(v, 45.5, 46.5, [0.6, 1.4, 9.0], [1.25, 1.55, 4.3], [0, 3.05, 0.5], [0.5, 1.35, 1.3], [40, 42]);
    },
    shakes: [[COUNT[1], 0.25]],
    render: (v) => {
      const k = smooth(ramp(v, COUNT[0], COUNT[1]));
      const value = v >= COUNT[1] ? 8000000 : 1250 * Math.pow(8000000 / 1250, k);
      const admire = smooth(ramp(v, 45.9, 46.6));
      return (
        <>
          <DaySky />
          <DayLights />
          <Street len={60} />
          <Facade position={[-6.5, 0, -3.5]} size={[8, 9, 2]} cols={5} rows={4} seed={3} />
          <Facade position={[6.5, 0, -3.5]} size={[8, 7, 2]} cols={5} rows={3} wall="#c9d2d8" seed={5} />
          <group position={[0, 0, -0.3]}>
            <RateBooth value={value} up />
          </group>
          {/* the crowd watching the rate */}
          {[[-1.9, 3.4], [-1.05, 2.9], [-0.3, 3.7], [2.4, 3.5], [3.0, 2.7], [-2.6, 2.6], [-0.6, 2.4]].map(([x, z], i) => (
            <Guy
              key={i}
              position={[x, 0, z]}
              rotation={Math.PI + (rnd(i + 3) - 0.5) * 0.4}
              i={i + 1}
              pose={{head: [-0.45 - 0.1 * rnd(i), 0], armR: i % 3 === 0 ? [1.4, -0.1] : [0.1, -0.08], elbowR: i % 3 === 0 ? 0.6 : 0, armL: [0.1, 0.08]}}
              rightHand={i % 3 === 0 ? <Box size={[0.08, 0.15, 0.012]} position={[0, -0.02, 0.07]} rotation={[0.2, 0, 0]} color="#1a1a1e" /> : undefined}
            />
          ))}
          {/* the investor at the window: a suit, a case and one shawarma */}
          <Person
            position={[0.3, 0, 1.5]}
            rotation={0.55}
            shirt="#2a2e3a"
            pants="#22252e"
            hair="#3a2a1e"
            pose={{armR: [lerp(0.5, 1.0, admire), -0.1], elbowR: lerp(1.0, 1.3, admire), armL: [0.05, 0.06], head: [lerp(0.1, 0.4, admire), -0.1]}}
            rightHand={<Shawarma rotation={[Math.PI, 0, 0]} position={[0, 0.03, 0.03]} scale={1.3} />}
            leftHand={<group position={[0, -0.19, 0]}><Case /></group>}
            bodyExtra={<Box size={[0.08, 0.4, 0.02]} position={[0, 1.33, 0.16]} color="#b02a2a" />}
          />
        </>
      );
    },
  },
  bank: {
    view: (v) => {
      if (v < 48.95) return mv(v, S('bank'), 48.95, [-1.08, 1.72, 1.9], [-1.0, 1.68, 1.62], [0.45, 1.25, -0.25], [0.45, 1.27, -0.25], 40);
      return mv(v, 48.95, E('bank'), [-0.15, 2.08, 0.9], [-0.16, 2.0, 0.8], [-0.2, 0.8, 0.04], [-0.2, 0.8, 0.04], [40, 38]);
    },
    shakes: [[STAMP, 0.25]],
    render: (v) => {
      const sign = ramp(v, SIGN[0], SIGN[1]);
      const writing = v >= SIGN[0] - 0.25 && v < SIGN[1] + 0.15;
      const reach = smooth(ramp(v, STAMP - 0.45, STAMP - 0.04)) * (1 - smooth(ramp(v, STAMP + 0.2, STAMP + 0.7)));
      return (
        <>
          <color attach="background" args={['#dfe6ee']} />
          <hemisphereLight color="#ffffff" groundColor="#8a8070" intensity={1.3} />
          <directionalLight position={[2, 5, 4]} intensity={1.4} />
          <Office sign={sign} stamp={v >= STAMP} />
          {/* the couple */}
          <Guy
            position={[0.2, -0.32, 0.75]}
            rotation={Math.PI}
            i={4}
            pose={{
              ...SIT,
              armR: writing ? [0.85, 0.08 + 0.05 * Math.sin(v * 25)] : [0.5, -0.05],
              elbowR: writing ? 0.55 : 0.9,
              armL: [0.5, 0.05],
              elbowL: 0.9,
              head: [writing ? 0.5 : 0.25, 0],
            }}
            rightHand={writing ? <Cyl rTop={0.01} rBottom={0.01} height={0.13} position={[0, -0.05, 0.03]} rotation={[0.3, 0, 0]} color="#141414" /> : undefined}
          />
          <Person position={[-0.6, -0.32, 0.75]} rotation={Math.PI} shirt="#d06a8a" pants="#3a3550" hair="#6a3a22" longHair pose={{...SIT, armL: [0.3, 0.05], armR: [0.3, -0.05], elbowL: 1.0, elbowR: 1.0, head: [0.35, -0.35]}} />
          {/* the manager */}
          <Person
            position={[-0.5, -0.32, -0.85]}
            shirt="#f2f2f2"
            pants="#2a2e3a"
            hair="#2a1d15"
            pose={{legL: 0.3, legR: 0.3, armR: [lerp(0.4, 1.13, reach), -0.04], elbowR: lerp(1.3, 0.0, reach), armL: [0.4, 0.1], elbowL: 1.3, head: [0.3, 0]}}
            rightHand={
              <group>
                <Cyl rTop={0.014} rBottom={0.014} height={0.08} position={[0, -0.03, 0]} color="#2a2a30" />
                <Box size={[0.07, 0.025, 0.05]} position={[0, -0.08, 0]} color="#b02020" />
              </group>
            }
            bodyExtra={<Box size={[0.08, 0.4, 0.02]} position={[0, 1.33, 0.16]} color="#1f5fbf" />}
          />
        </>
      );
    },
  },
  propose: {
    view: (v) => {
      if (v < 52.95) return mv(v, S('propose'), 52.95, [0.08, 1.42, 0.9], [0.12, 1.38, 0.76], [0.35, 1.04, 0.04], [0.35, 1.03, 0.04], 40);
      return mv(v, 52.95, E('propose'), [0.6, 1.3, 4.0], [0.58, 1.28, 3.55], [0.55, 1.1, 0], [0.55, 1.12, 0], 42);
    },
    render: (v) => {
      const open = smooth(ramp(v, BOX_OPEN - 0.15, BOX_OPEN + 0.25));
      const g = smooth(ramp(v, GASP - 0.15, GASP + 0.2));
      return (
        <>
          <DaySky />
          <DayLights />
          <Box size={[60, 0.1, 60]} position={[0, -0.05, 0]} color="#7fb860" />
          <Box size={[60, 0.02, 1.6]} position={[0, 0.01, 1.4]} color="#d8c8a8" shadow={false} />
          {[-5, -1.5, 2.5, 6].map((x, i) => (
            <Tree key={i} position={[x, 0, -3.5 - (i % 2) * 1.5]} size={1} seed={i + 7} />
          ))}
          <Bench position={[-3.6, 0, -1.2]} />
          {/* she */}
          <Person
            position={[0, 0, 0]}
            rotation={Math.PI / 2}
            shirt="#e8a0b8"
            pants="#3a3550"
            hair="#6a3a22"
            longHair
            pose={{armL: [lerp(0.05, 1.0, g), lerp(0.06, 0.3, g)], armR: [lerp(0.05, 1.0, g), lerp(-0.06, -0.3, g)], elbowL: lerp(0.1, 2.1, g), elbowR: lerp(0.1, 2.1, g), head: [lerp(0.3, 0.1, g), 0], mouth: 0.8 * g, eyes: 1 + 0.6 * g}}
          />
          {/* he, on one knee */}
          <Guy
            position={[1.15, -0.4, 0]}
            rotation={-Math.PI / 2}
            i={6}
            pose={{legL: -0.9, legR: 0.9, armR: [1.25, -0.35], elbowR: 0.3, armL: [1.1, 0.35], elbowL: 0.4, head: [-0.3, 0]}}
            rightHand={
              <group position={[0, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
                <RingBox open={open} />
              </group>
            }
          />
        </>
      );
    },
  },
  flash: {
    view: (v) => mv(v, S('flash'), E('flash'), [3.0, 1.7, 5.0], [2.6, 1.65, 4.5], [0.3, 1.35, 1.4], [0.3, 1.35, 1.4], [42, 40]),
    render: (v) => {
      const give = smooth(ramp(v, HANDOVER - 0.6, HANDOVER - 0.05));
      const back = smooth(ramp(v, HANDOVER + 0.1, HANDOVER + 0.6));
      const took = v >= HANDOVER;
      const turn = smooth(ramp(v, HANDOVER + 0.5, HANDOVER + 1.1));
      const roll = <Shawarma rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.06]} scale={1.3} />;
      const sArm = took ? lerp(1.15, 0.5, back) : lerp(0.6, 1.15, give);
      const hArm = took ? lerp(1.2, 0.55, back) : lerp(0.1, 1.2, give);
      return (
        <StallStreet v={v}>
          <Kiosk
            t={v}
            seller={
              <Seller
                position={[0.3, 0.2, 0.5]}
                pose={{armR: [sArm, -0.3], elbowR: took ? lerp(0.3, 0.9, back) : lerp(1.2, 0.3, give), armL: [0.5, 0.1], elbowL: 0.8, head: [0.15, 0]}}
                rightHand={took ? undefined : roll}
              />
            }
          />
          <ABoard position={BOARD} rotation={BOARD_YAW} write={1} one={1} />
          <Guy
            position={[0.4, 0, 2.1]}
            rotation={lerp(Math.PI, 1.25, turn)}
            i={6}
            pose={{armR: [hArm, -0.35 * (1 - back)], elbowR: took ? lerp(0.6, 1.6, back) : lerp(0.1, 0.6, give), armL: [0.1, 0.1], head: [took ? lerp(0.0, 0.35, back) * (1 - turn * 0.6) : 0.0, 0]}}
            rightHand={took ? roll : undefined}
          />
        </StallStreet>
      );
    },
  },
  keys: {
    view: (v) => mv(v, S('keys'), E('keys'), [0.25, 1.45, 4.8], [0.15, 1.45, 3.9], [0, 1.25, 0.2], [0, 1.28, 0.2], 40),
    shakes: [[SWAP, 0.08]],
    render: (v) => {
      const out = smooth(ramp(v, SWAP - 0.6, SWAP - 0.05));
      const back = smooth(ramp(v, SWAP + 0.1, SWAP + 0.6));
      const lift = smooth(ramp(v, SWAP + 0.5, SWAP + 1.0));
      const done = v >= SWAP;
      const frozen = <FrozenShawarma rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.06]} scale={1.3} />;
      const keys = <group position={[0, 0, -0.04]} rotation={[Math.PI / 2, 0, 0]}><Keys /></group>;
      const reach = done ? 1 - back : out;
      return (
        <>
          <color attach="background" args={['#e8e4dc']} />
          <hemisphereLight color="#ffffff" groundColor="#a08a6a" intensity={1.3} />
          <directionalLight position={[1, 4, 3]} intensity={1.3} />
          <pointLight position={[0.6, 1.6, -1.8]} color="#cfe8ff" intensity={2} distance={5} decay={1.5} />
          <Flat />
          <Guy
            position={[-0.55, 0, 0.2]}
            rotation={Math.PI / 2}
            i={6}
            pose={{
              armR: done ? [lerp(lerp(0.4, 0.6, reach), 2.0, lift), lerp(-0.35, -0.15, lift)] : [lerp(0.6, 0.4, reach), -0.35],
              elbowR: done ? lerp(lerp(0.9, 1.1, reach), 0.5, lift) : lerp(1.3, 1.1, reach),
              armL: [0.1, 0.1],
              head: [lerp(0.1, -0.25, lift), lift * 0.3],
              eyes: 1 + 0.3 * lift,
            }}
            rightHand={done ? keys : frozen}
          />
          <Person
            position={[0.55, 0, 0.2]}
            rotation={-Math.PI / 2}
            shirt="#2a2e3a"
            pants="#22252e"
            hair="#4a3324"
            pose={{
              armR: [lerp(0.6, 0.4, reach), -0.35],
              elbowR: done ? lerp(1.1, 1.5, back) : lerp(1.3, 1.1, reach),
              armL: done ? [lerp(0.1, 0.55, back), 0.25] : [0.1, 0.1],
              elbowL: done ? lerp(0, 1.3, back) : 0,
              head: [done ? lerp(0.1, 0.45, back) : 0.1, 0],
            }}
            rightHand={done ? frozen : keys}
            bodyExtra={<Box size={[0.08, 0.4, 0.02]} position={[0, 1.33, 0.16]} color="#8a2a2a" />}
          />
        </>
      );
    },
  },
  van: {
    view: (v) => {
      if (v < 64.55) return mv(v, S('van'), 64.55, [5.6, 1.7, 5.2], [5.1, 1.65, 4.7], [0.6, 1.5, 0.2], [0.6, 1.5, 0.3], [42, 40]);
      return mv(v, 64.55, E('van'), [-0.5, 1.65, 6.8], [-0.35, 1.6, 6.1], [0.15, 1.2, 2.0], [0.15, 1.25, 2.0], 42);
    },
    shakes: [[DOORS, 0.3]],
    render: (v) => {
      const walkK = clamp01((v - S('van')) / 1.6);
      const a: V3 = [-0.5, 0, 5.4];
      const b: V3 = [0.75, 0, 2.75];
      const put = smooth(ramp(v, 64.7, 65.0));
      const placed = v >= 65.0;
      const stepBack = smooth(ramp(v, 65.05, 65.45));
      const p = lerp3(a, b, easeOut(walkK));
      const pos: V3 = [p[0] + 0.7 * stepBack, 0, p[2] + 0.4 * stepBack];
      const walking = walkK < 1;
      const doors = 1 - smooth(ramp(v, DOORS - 0.4, DOORS));
      const caseInHand = <group position={[0, -0.17, 0]}><Case /></group>;
      return (
        <>
          <DaySky />
          <DayLights />
          <Street len={60} />
          <Facade position={[-5, 0, -3.5]} size={[8, 9, 2]} cols={5} rows={4} seed={8} />
          <Facade position={[5.5, 0, -3.5]} size={[8, 7, 2]} cols={5} rows={3} wall="#d8cbb8" seed={2} />
          <Van position={[0, 0, 0]} doors={doors} />
          {placed ? <group position={[0.45, 0.84, 1.7]}><Case /></group> : null}
          <Guard position={[-1.55, 0, 2.6]} rotation={-0.5 + 0.3 * Math.sin(v * 1.3)} pose={{armL: [0.3, 0.2], armR: [0.3, -0.2], elbowL: 1.2, elbowR: 1.2, head: [0, 0.3 * Math.sin(v * 1.7)]}} i={1} />
          <Guard
            position={pos}
            rotation={walking ? yawTo(a, b) : Math.PI}
            pose={walking ? {...walk(v - S('van'), 1 - walkK * 0.5), armR: [0.05, -0.08], elbowR: 0} : {armR: [lerp(0.05, 0.95, put * (1 - stepBack)), -0.08], elbowR: 0.15 * put, armL: [0.05, 0.08]}}
            rightHand={placed ? undefined : caseInHand}
          />
        </>
      );
    },
  },
  inside: {
    view: (v) => mv(v, S('inside'), E('inside'), [0.4, 1.35, 2.6], [0.3, 1.3, 2.2], [0.2, 1.05, 0], [0.18, 1.08, 0], 40),
    shakes: [[BITE, 0.08]],
    render: (v) => {
      const glance = ramp(v, GLANCE[0], GLANCE[1]);
      const yaw = v < GLANCE[1] ? 0.55 * Math.sin(glance * Math.PI * 2) : 0;
      const b = smooth(ramp(v, BITE - 0.45, BITE)) * (1 - smooth(ramp(v, BITE + 0.12, BITE + 0.5)));
      const chew = v > BITE + 0.4 ? 0.22 * (0.5 + 0.5 * Math.sin((v - BITE) * 14)) : 0;
      const caught = smooth(ramp(v, 68.7, 68.95));
      const len = v >= BITE ? 0.62 : 1;
      return (
        <>
          <color attach="background" args={['#0e1012']} />
          <hemisphereLight color="#8a9098" groundColor="#1a1a1e" intensity={0.55} />
          <pointLight position={[0.2, 2.1, 0.6]} color="#ffe2b0" intensity={3.2} distance={4} decay={1.6} />
          {/* the van's cargo box: back wall, floor, ceiling and the bench */}
          <Box size={[3, 2.2, 0.06]} position={[0, 1.1, -0.45]} color="#3a4044" />
          <Box size={[3, 0.06, 3]} position={[0, -0.03, 0.8]} color="#2a2e30" />
          <Box size={[3, 0.06, 3]} position={[0, 2.2, 0.8]} color="#2e3236" />
          <Box size={[1.8, 0.06, 0.5]} position={[0, 0.45, -0.1]} color="#4a4e52" />
          <Box size={[1.8, 0.42, 0.04]} position={[0, 0.21, 0.13]} color="#3a3e42" />
          <Box size={[0.2, 0.05, 0.12]} position={[0.2, 2.15, 0.6]} color="#fff2d8" emissive="#ffe2b0" emissiveIntensity={1.2} />
          {/* the open case on the bench, an empty shawarma-shaped slot in the foam */}
          <group position={[0.58, 0.63, -0.12]} rotation={[0, -0.3, 0]}>
            <Case open={1} />
            <Box size={[0.26, 0.07, 0.006]} position={[0, 0, 0.064]} rotation={[0, 0, 0.1]} color="#121214" shadow={false} />
          </group>
          <Guard
            position={[0, -0.32, -0.1]}
            pose={{
              ...SIT,
              armR: [lerp(0.7, 1.15, b), -0.32],
              elbowR: lerp(0.9, 1.85, b),
              armL: [0.5, 0.12],
              elbowL: 0.7,
              head: [lerp(lerp(0.2, 0.05, b), -0.05, caught), yaw],
              mouth: Math.max(b * 0.6, chew * (1 - caught)),
              eyes: 1 + 0.5 * caught,
            }}
            rightHand={<Shawarma len={len} rotation={[Math.PI, 0, 0]} position={[0, 0.04, 0.03]} scale={1.4} />}
          />
        </>
      );
    },
  },
};

// ---------------------------------------------------------------- the yacht with the seller on it

const Yacht: React.FC<{v: number}> = ({v}) => (
  <YachtHull bob={v}>
    <DeckChair position={[0, 1.16, 2.6]} />
    <Seller position={[0, 1.16 + 0.475 - 0.8, 2.62]} pose={{...SIT, head: [0, 0.2], armL: [0.6, 0.6], armR: [0.6, -0.6], elbowL: 1.4, elbowR: 1.4}} glasses={1} />
    <Box size={[0.5, 0.05, 0.5]} position={[0.75, 1.16 + 0.62, 3.05]} color="#f2f2f2" />
    <Cyl rTop={0.04} rBottom={0.06} height={0.6} position={[0.75, 1.16 + 0.3, 3.05]} color="#d0d4da" />
    <FramedTag position={[0.68, 1.16 + 0.83, 3.0]} rotation={[-0.2, 0.25, 0]} />
    {/* a drink */}
    <Cyl rTop={0.04} rBottom={0.03} height={0.14} position={[0.92, 1.16 + 0.715, 2.92]} color="#ff9a4a" />
  </YachtHull>
);

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

export {SCENES, TAG, HERO, HERO_YAW, BOARD, BOARD_YAW, DAY};

// the cover: the guy turned to us with his jaw dropped, the «1250 ₽» card next to him
const RIGHT: V3 = [N[2], 0, -N[0]];
export const COVER_CAM: V3 = [TAG[0] + N[0] * 3.0 + RIGHT[0] * 0.15, 1.6, TAG[2] + N[2] * 3.0 + RIGHT[2] * 0.15];
const COVER_HERO: V3 = [TAG[0] + N[0] * 0.35 + RIGHT[0] * 0.8, 0, TAG[2] + N[2] * 0.35 + RIGHT[2] * 0.8];
export const coverView: View = {pos: COVER_CAM, target: [TAG[0] * 0.6 + COVER_HERO[0] * 0.4, 1.42, TAG[2] * 0.6 + COVER_HERO[2] * 0.4], fov: 54, far: 3000};
export const CoverScene: React.FC = () => (
  <>
    <CameraRig v={0} view={() => coverView} />
    <StallStreet v={1}>
      <Kiosk t={1} seller={<Seller position={[0.3, 0.2, 0.15]} pose={{armL: [0.5, 0.1], armR: [0.5, -0.1], elbowL: 0.8, elbowR: 0.8, head: [0, 0.3]}} />} />
      <ABoard position={BOARD} rotation={BOARD_YAW} write={1} one={1} />
      <Guy position={COVER_HERO} rotation={yawTo(COVER_HERO, COVER_CAM) + 0.25} i={6} pose={{head: [-0.05, -0.2], mouth: 1, eyes: 1.75, armL: [0.35, 0.15], armR: [0.35, -0.15], elbowL: 0.4, elbowR: 0.4}} />
      {QUEUE.slice(2).map((p, i) => (
        <Guy key={i} position={p} rotation={Math.PI} i={i + 2} pose={{head: [0.1, 0]}} />
      ))}
    </StallStreet>
  </>
);
