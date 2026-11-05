import React from 'react';
import {Box, Cyl} from '../scene/parts';
import {Person, PersonPose} from '../scene/Characters';
import {CameraRig, View, handheld} from '../slime/camera';
import {
  BITES,
  BUBBLE1,
  BUBBLE2,
  CART,
  COPY,
  DOOR,
  FLIPS,
  GLASSES,
  HATCH,
  JAW,
  KNOCKS,
  LOOK,
  ONE,
  RIP,
  SHRUG,
  SLIP,
  STACK,
  Shot,
  TAGS,
  TO_CAM,
  TUG,
  V3,
  WALLET,
  WRITE,
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
  BurgerShop,
  Cart,
  DAY,
  DayLights,
  DaySky,
  DeckChair,
  EVENING,
  FoldingChair,
  FramedTag,
  Gulls,
  Guy,
  Kiosk,
  MenuBoard,
  PhoneStand,
  Pier,
  SIT,
  Sea,
  SecretDoor,
  Seller,
  Shawarma,
  Shelf,
  ShelfTag,
  SpitHouse,
  Street,
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
        <Yacht v={v} glasses={1} />
        <Gulls t={v} center={[2, 8, -4]} r={7} />
      </>
    ),
  },
  rewind: {
    view: (v) => {
      const s = rewindShot(v);
      return SCENES[s.name].view(s.at);
    },
    render: (v) => {
      const s = rewindShot(v);
      return SCENES[s.name].render(s.at);
    },
  },
  marker: {
    view: (v) => {
      const a: V3 = [TAG[0] + N[0] * 2.6 - 0.55, 1.55, TAG[2] + N[2] * 2.6 + 0.15];
      const b: V3 = [TAG[0] + N[0] * 2.2 - 0.45, 1.5, TAG[2] + N[2] * 2.2 + 0.12];
      return mv(v, S('marker'), E('marker'), a, b, [TAG[0] - 0.12, TAG[1] + 0.05, TAG[2]], [TAG[0] - 0.15, TAG[1] + 0.02, TAG[2]], [44, 40]);
    },
    shakes: [[SLIP, 0.35]],
    render: (v) => {
      const write = ramp(v, WRITE[0], WRITE[1]);
      const one = ramp(v, SLIP - 0.06, SLIP + 0.06);
      // the seller stands right of the board and writes on it
      const P: V3 = [TAG[0] + N[0] * 0.55 + 0.42, 0, TAG[2] + N[2] * 0.55 - 0.1];
      const yaw = yawTo(P, TAG) + 0.2;
      const writing = v >= WRITE[0] - 0.3 && v < WRITE[1] + 0.2;
      const wob = writing ? Math.sin(v * 22) * 0.04 : 0;
      const reach = writing ? lerp(-0.05, 0.28, write) : 0;
      const slip = smooth(ramp(v, SLIP - 0.25, SLIP)) * (1 - smooth(ramp(v, SLIP + 0.3, SLIP + 0.8)));
      const turn = smooth(ramp(v, WRITE[1] + 0.2, WRITE[1] + 0.7));
      return (
        <StallStreet v={v}>
          <Kiosk t={v} seller={null} />
          <ABoard position={BOARD} rotation={BOARD_YAW} write={write} one={one} />
          <Seller
            position={P}
            rotation={yaw}
            pose={{
              armR: [writing ? 0.82 + wob : lerp(0.25, 0.75, slip), writing ? -0.45 - reach : lerp(-0.1, -0.6, slip)],
              elbowR: writing ? 0.55 : lerp(0.3, 0.5, slip),
              armL: [0.2, 0.1],
              head: [writing ? 0.35 : 0.1, writing ? -0.2 : lerp(0, 1.0, turn)],
            }}
            rightHand={<Cyl rTop={0.012} rBottom={0.012} height={0.14} position={[0, -0.04, 0.03]} rotation={[0.3, 0, 0]} color="#141414" />}
          />
        </StallStreet>
      );
    },
  },
  copy: {
    view: (v) => {
      const xs = [BOARD[0], BOARD[0] + 3.6, BOARD[0] + 7.2, BOARD[0] + 10.8];
      const tx = v < COPY[0] - 0.55 ? lerp(xs[0], xs[1], smooth(ramp(v, S('copy') + 0.3, COPY[0] - 0.55))) : v < COPY[1] - 0.45 ? lerp(xs[1], xs[2], smooth(ramp(v, COPY[0] + 0.15, COPY[1] - 0.45))) : lerp(xs[2], xs[3], smooth(ramp(v, COPY[1] + 0.15, COPY[2] - 0.4)));
      return {pos: [tx + 0.9, 1.65, 6.6], target: [tx, 1.15, 2.1], fov: 40, far: 3000};
    },
    render: (v) => (
      <StallStreet v={v}>
        <Kiosk t={v} seller={<Seller position={[0.3, 0.2, 0.15]} pose={{armL: [0.5, 0.1], armR: [0.5, -0.1], elbowL: 0.8, elbowR: 0.8}} />} />
        <ABoard position={BOARD} rotation={BOARD_YAW} write={1} one={1} />
        {[1, 2, 3].map((i) => {
          const x = i * 3.6;
          const at = COPY[i - 1];
          const look = smooth(ramp(v, at - 1.0, at - 0.5));
          return (
            <group key={i}>
              <Kiosk
                position={[x, 0, 0]}
                t={v + i}
                color={['#e8f0e6', '#f0e6dc', '#e6eaf2'][i - 1]}
                sign={['ШАВЕРМА', 'ШАУРМА 24', 'ШАУРМА'][i - 1]}
                seller={<Seller position={[0.2, 0.2, 0.25]} shirt={['#f4f4f2', '#ffe8b0', '#d8eaff'][i - 1]} apron={['#2a7a4a', '#d6862a', '#3a5ad0'][i - 1]} pose={{head: [0, -0.9 * look], armL: [0.5, 0.1], armR: [0.5, -0.1], elbowL: 0.8, elbowR: 0.8}} />}
              />
              <ABoard position={[x + BOARD[0], 0, BOARD[2]]} rotation={BOARD_YAW} write={1} one={ramp(v, at - 0.08, at + 0.08)} />
            </group>
          );
        })}
      </StallStreet>
    ),
  },
  deck: {
    view: (v) => {
      if (v < 53.3) return mv(v, S('deck'), 53.3, [0.95, 2.25, 4.45], [0.9, 2.2, 4.3], [0.68, 2.0, 3.0], [0.66, 2.02, 3.0], 40);
      if (v < 55.2) return mv(v, 53.3, 55.2, [0.35, 2.64, 4.65], [0.3, 2.62, 4.55], [0.05, 2.5, 2.62], [0.05, 2.5, 2.62], [42, 42]);
      return mv(v, 55.6, E('deck'), [0.3, 2.62, 4.55], [0.7, 2.9, 6.6], [0.05, 2.5, 2.62], [0.05, 2.25, 2.4], [42, 46]);
    },
    render: (v) => (
      <>
        <DaySky fog={[80, 900]} />
        <DayLights />
        <Sea t={v} />
        <Yacht v={v} glasses={smooth(ramp(v, GLASSES, GLASSES + 0.3))} deck />
        <Gulls t={v} center={[1, 7, -2]} r={6} />
      </>
    ),
  },
};

// the rewind: earlier shots flash past backwards, ~2-3 frames each
const REWIND: Shot[] = ['phone', 'wallet', 'door', 'tags', 'shop', 'windows', 'menu', 'queue', 'bench', 'stall'];
const rewindShot = (v: number) => {
  const k = clamp01((v - S('rewind')) / (E('rewind') - S('rewind')));
  const i = Math.min(REWIND.length - 1, Math.floor(k * REWIND.length));
  const name = REWIND[i];
  const local = (k * REWIND.length) % 1;
  const at = lerp(E(name) - 0.05, S(name) + 0.05, local);
  return {name, at: name === 'stall' ? Math.max(0.6, at) : at};
};

// ---------------------------------------------------------------- the yacht with the seller on it

const Yacht: React.FC<{v: number; glasses: number; deck?: boolean}> = ({v, glasses, deck}) => {
  const look = smooth(ramp(v, LOOK - 0.3, LOOK + 0.1)) * (1 - smooth(ramp(v, TO_CAM - 0.2, TO_CAM + 0.2)));
  const toCam = smooth(ramp(v, TO_CAM - 0.2, TO_CAM + 0.2));
  const shrug = smooth(ramp(v, SHRUG - 0.15, SHRUG + 0.2)) * (1 - smooth(ramp(v, SHRUG + 0.55, SHRUG + 0.9)));
  const reach = smooth(ramp(v, GLASSES - 0.35, GLASSES)) * (1 - smooth(ramp(v, GLASSES + 0.3, GLASSES + 0.6)));
  const pose: PersonPose = deck
    ? {
        ...SIT,
        head: [lerp(-0.05, 0.45, look) + shrug * 0.05 + reach * 0.18, lerp(0, -0.75, look) * (1 - toCam) + toCam * 0.1],
        armL: [lerp(0.55, 0.35, shrug), lerp(0.1, -0.75, shrug)],
        armR: [lerp(0.55, 0.35, shrug), lerp(-0.1, 0.75, shrug)],
        elbowL: lerp(0.6, 1.5, shrug),
        elbowR: lerp(0.6, 1.5, shrug),
        eyes: 1 + 0.25 * look,
      }
    : {...SIT, head: [0, 0.2], armL: [0.6, 0.6], armR: [0.6, -0.6], elbowL: 1.4, elbowR: 1.4};
  return (
    <YachtHull bob={v}>
      <DeckChair position={[0, 1.16, 2.6]} />
      <Seller position={[0, 1.16 + 0.475 - 0.8, 2.62]} pose={pose} glasses={glasses} />
      <Box size={[0.5, 0.05, 0.5]} position={[0.75, 1.16 + 0.62, 3.05]} color="#f2f2f2" />
      <Cyl rTop={0.04} rBottom={0.06} height={0.6} position={[0.75, 1.16 + 0.3, 3.05]} color="#d0d4da" />
      <FramedTag position={[0.68, 1.16 + 0.83, 3.0]} rotation={[-0.2, 0.25, 0]} />
      {/* a drink */}
      <Cyl rTop={0.04} rBottom={0.03} height={0.14} position={[0.92, 1.16 + 0.715, 2.92]} color="#ff9a4a" />
    </YachtHull>
  );
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
