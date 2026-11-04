import React from 'react';
import * as THREE from 'three';
import {Box, Cyl, Ico} from '../scene/parts';
import {Person} from '../scene/Characters';
import {CameraRig, View, handheld} from '../slime/camera';
import {SCENES as GTA, Sky, SKIES, DuskLights, FAN0, FAN_YAW, SkyCols} from '../gta/World';
import {BILL, Billboard, CherryPicker, CityState, Ground, Houses, Lamps, PARKED, ParkedCars, Palms} from '../gta/City';
import {Car, Fan, Fire, Smoke} from '../gta/props';
import {Fall} from '../gta/Disaster';
import {
  ARCS,
  DECLINED,
  DISC_FOUND,
  DISC_IN,
  DOMINO_HITS,
  DOMINO_TIP,
  ERROR,
  FACEPLANT,
  LIGHTS_OUT,
  NET_DOWN,
  PLUNGE,
  POP,
  PRESS,
  REPAINT2,
  PAINT2,
  SERVERS,
  SERVERS_OFF,
  STANDUP,
  Shot,
  TURN,
  TV_OFF,
  TV_ON,
  UPLOAD,
  USB,
  V3,
  clamp01,
  easeIn,
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
  AiBubble,
  Aisle,
  BigPhone,
  BOX_POSE,
  Cable,
  CarBattery,
  CardCounter,
  CarryBox,
  Console,
  DiscCase,
  DOMINO_CONTACT,
  Dominoes,
  FallingBoxes,
  LeakRoom,
  OldTv,
  PhoneCrowd,
  ServerRoom,
  Sparks,
  Studio,
  TradingFloor,
} from './Sets';
import {Arcs, Hub, NightEarth, Stars} from './Globe';

const S = (n: Shot) => shotStart(n);
const E = (n: Shot) => shotEnd(n);
const mv = (v: number, t0: number, t1: number, a: V3, b: V3, ta: V3, tb: V3, fov: number | [number, number], far = 3000): View => {
  const k = smooth(ramp(v, t0, t1));
  return {pos: lerp3(a, b, k), target: lerp3(ta, tb, k), fov: typeof fov === 'number' ? fov : lerp(fov[0], fov[1], k), far};
};

const C1 = new THREE.Color();
const C2 = new THREE.Color();
const blendSky = (a: SkyCols, b: SkyCols, k: number): SkyCols => {
  const m = (x: string, y: string) => '#' + C1.set(x).lerp(C2.set(y), k).getHexString();
  return {top: m(a.top, b.top), mid: m(a.mid, b.mid), low: m(a.low, b.low), sunDir: a.sunDir ?? b.sunDir, sun: lerp(a.sun ?? 0, b.sun ?? 0, k), sunCol: a.sunCol ?? b.sunCol};
};

const ON = () => 1;
const OFF = () => 0;
const DUSK = (v: number): CityState => ({t: v, lightsAt: ON, frostAt: OFF, ash: 0, ruin: 0, wreck: 0});
const WRECK = (v: number): CityState => ({t: v, lightsAt: OFF, frostAt: OFF, ash: 0.25, ruin: 0, wreck: 1});
const RUIN = (v: number): CityState => ({t: v, lightsAt: OFF, frostAt: OFF, ash: 1, ruin: 1, wreck: 1});

const DuskCity: React.FC<{v: number; children?: React.ReactNode; billboard?: React.ReactNode}> = ({v, children, billboard}) => {
  const st = DUSK(v);
  return (
    <>
      <Sky c={SKIES.dusk} />
      <fog attach="fog" args={['#c0607a', 120, 1400]} />
      <DuskLights />
      <Ground st={st} />
      <Houses st={st} />
      <Lamps st={st} />
      <Palms st={st} />
      <ParkedCars st={st} />
      {billboard ?? <Billboard st={st} cover={1} paint={1} />}
      {children}
    </>
  );
};

// the worker repainting 2027 into 2028
const rollerX2 = (v: number) => {
  if (v < REPAINT2[0]) return 0.3;
  if (v < REPAINT2[1]) return lerp(0.3, 2.7, ramp(v, REPAINT2[0], REPAINT2[1]));
  if (v < PAINT2[0]) return lerp(2.7, 0.3, smooth(ramp(v, REPAINT2[1], PAINT2[0])));
  if (v < PAINT2[1]) return lerp(0.3, 2.7, ramp(v, PAINT2[0], PAINT2[1]));
  return lerp(2.7, 2.2, smooth(ramp(v, PAINT2[1], PAINT2[1] + 0.5)));
};
const Worker2: React.FC<{v: number}> = ({v}) => {
  const x = rollerX2(v);
  const wob = Math.sin(v * 9) * 0.06;
  return (
    <CherryPicker basketX={x - 0.4} st={DUSK(v)}>
      <Person
        position={[0, 0.05, 0.05]}
        rotation={Math.PI}
        shirt="#ff8a1f"
        pants="#2c3550"
        hair="#4a3324"
        pose={{armR: [2.5 + wob, -0.1], elbowR: 0.3, armL: [0.6, 0.1], elbowL: 0.6, head: [-0.3, 0]}}
        headExtra={<Box size={[0.36, 0.12, 0.36]} position={[0, 0.39, 0]} color="#ffd21f" />}
        rightHand={
          <group rotation={[0.2, 0, 0]}>
            <Cyl rTop={0.02} rBottom={0.02} height={1.3} position={[0, -0.6, 0]} color="#d9d9d9" segments={6} />
            <Cyl rTop={0.09} rBottom={0.09} height={0.5} position={[0, -1.25, 0]} rotation={[0, 0, Math.PI / 2]} color="#7d1f55" segments={10} />
          </group>
        }
      />
    </CherryPicker>
  );
};

// ---------- positions ----------

const FAN_R: V3 = [9.0, 0.14, -3.6]; // the fan on the promenade with his phone
const PHONE: V3 = [FAN_R[0] + 0.1, 1.38, FAN_R[2] + 0.42];
const DOMINO_ANGLES = (v: number) => {
  const starts = [DOMINO_TIP, DOMINO_HITS[0], DOMINO_HITS[1], DOMINO_HITS[2]];
  const rest = 1.36;
  return starts.map((t0, i) => {
    const hit = DOMINO_HITS[i];
    if (v < t0) return 0;
    if (i === 3) return (Math.PI / 2) * easeIn(ramp(v, t0, hit));
    if (v < hit) return DOMINO_CONTACT * easeIn(ramp(v, t0, hit));
    return lerp(DOMINO_CONTACT, rest, smooth(ramp(v, hit, DOMINO_HITS[i + 1] + 0.3)));
  });
};
const BUBBLE: V3 = [-6, 46, 92];
const HUB: V3 = [0.25, 0.32, 0.91];
const SURV: V3 = [3.0, 0.14, 2.0];
const SEAT: V3 = [0, 0, 0.6];
const TVP: V3 = [0, 0, -0.5];

const RuinsLand: React.FC<{v: number; near?: boolean}> = ({v, near}) => {
  const st = RUIN(v);
  return (
    <>
      <Sky c={SKIES.dead} />
      <fog attach="fog" args={['#6a6258', near ? 6 : 20, near ? 60 : 260]} />
      <hemisphereLight color="#c0b8a8" groundColor="#4a4642" intensity={1.6} />
      <directionalLight position={[40, 80, 60]} color="#d8ccb8" intensity={1.2} />
      <Ground st={st} />
      <Houses st={st} />
      <ParkedCars st={st} crush={() => 0.8} burnt={() => 1} />
      <Billboard st={st} cover={1} paint={1} year="2028" base="2027" lit={0} tilt={0.32} sink={2.2} />
      {Array.from({length: 26}).map((_, i) =>
        near && i === 24 ? null : (
          <mesh key={i} position={[(rnd(i + 1) - 0.5) * 120, -0.2, -30 + rnd(i + 2) * 50]} scale={[6 + rnd(i + 3) * 10, 1 + rnd(i + 4) * 2.2, 4 + rnd(i + 5) * 8]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={rnd(i) > 0.5 ? '#77726b' : '#6a655f'} roughness={1} flatShading />
          </mesh>
        ),
      )}
      <Fall center={[3, 4, 0]} t={v} color="#8a847c" size={0.06} box={[30, 10, 30]} speed={0.4} wind={4} n={900} />
    </>
  );
};

// the corner where the survivor plugs it all in
const Corner: React.FC<{v: number; tvOn: number; k: number; err: number; disc: number; head?: [number, number]; reach?: number; hideFan?: boolean}> = ({v, tvOn, k, err, disc, head = [0.3, 0], reach = 0, hideFan}) => (
  <>
    <Box size={[8, 0.2, 8]} position={[0, -0.1, 0]} color="#77726b" />
    {Array.from({length: 14}).map((_, i) => (
      <Ico key={i} radius={0.08 + rnd(i + 1) * 0.25} position={[(rnd(i + 2) - 0.5) * 5, -0.04, (rnd(i + 3) - 0.5) * 5 - 1]} scale={[1, 0.4, 1]} rotation={[i, i * 2, 0]} color={rnd(i + 4) > 0.5 ? '#6d6862' : '#827c74'} />
    ))}
    {/* a broken wall behind the TV */}
    <Box size={[3.2, 1.6, 0.3]} position={[-0.6, 0.8, -1.8]} rotation={[0, 0.15, 0]} color="#8a8178" />
    <Box size={[1.2, 0.9, 0.3]} position={[1.4, 0.45, -1.6]} rotation={[0, -0.3, 0.1]} color="#7a7168" />
    <Box size={[0.6, 0.12, 0.6]} position={[-1.6, 0.06, -0.8]} rotation={[0, 0.5, 0.05]} color="#5a544c" />
    <OldTv position={TVP} on={tvOn} k={k} err={err} />
    <Console position={[0.42, 0, -0.15]} disc={disc} />
    <CarBattery position={[0.85, 0, -0.45]} />
    <Cable a={[0.76, 0.25, -0.45]} b={[0.25, 0.05, -0.62]} color="#c9382f" />
    <Cable a={[0.94, 0.25, -0.45]} b={[0.28, 0.05, -0.15]} color="#1a1a1a" />
    {/* the crate he sits on */}
    <Box size={[0.5, 0.4, 0.45]} position={[SEAT[0], 0.2, SEAT[2] + 0.05]} color="#6a5238" />
    {hideFan ? null : <Fan
      position={[SEAT[0], 0.4 - 0.9 + 0.1, SEAT[2]]}
      rotation={Math.PI}
      box="none"
      look={{hood: true, beard: true}}
      pose={{legL: 1.45, legR: 1.45, armL: [0.7, 0.1], armR: [0.7 + reach * 0.5, -0.3 * reach], elbowL: 0.9, elbowR: 0.9 - reach * 0.4, head}}
    />}
    <Fall center={[0, 1.5, 0]} t={v} color="#8a847c" size={0.02} box={[4, 3, 4]} speed={0.25} wind={0.8} n={400} />
  </>
);

type Scene = {view: (v: number) => View; render: (v: number) => React.ReactNode; shakes?: [number, number][]};

const SCENES: Record<Shot, Scene> = {
  bill: {view: GTA.bill.view, render: GTA.bill.render, shakes: GTA.bill.shakes},
  fan: {view: GTA.fan.view, render: GTA.fan.render, shakes: GTA.fan.shakes},
  refund: {
    view: (v) => {
      const close: View = {pos: [PHONE[0] + 0.03, PHONE[1] + 0.03, PHONE[2] + 0.33], target: [PHONE[0], PHONE[1] - 0.03, PHONE[2]], fov: 44, far: 3000};
      const wide: View = {pos: [13.5, 2.6, 9.5], target: [5, 1.6, -5], fov: 50, far: 3000};
      const k = smooth(ramp(v, PRESS + 0.45, E('refund') - 0.3));
      return {pos: lerp3(close.pos, wide.pos, k), target: lerp3(close.target as V3, wide.target, k), fov: lerp(44, 50, k), far: 3000};
    },
    render: (v) => {
      const pressed = v >= PRESS ? 1 : 0;
      const thumb = smooth(ramp(v, PRESS - 0.4, PRESS)) * (1 - smooth(ramp(v, PRESS + 0.15, PRESS + 0.45)));
      return (
        <DuskCity v={v}>
          <pointLight position={[6, 9, -11]} color="#ff6aa0" intensity={60} distance={30} decay={1.6} />
          <Fan position={FAN_R} rotation={0} box="none" pose={{head: [0.45, 0], armR: [1.0, -0.2], elbowR: 1.2, armL: [0.4, 0.1], elbowL: 0.6}} />
          <group position={PHONE} rotation={[-0.3, 0.05, 0]}>
            <BigPhone pressed={pressed} thumb={thumb} />
            <pointLight position={[0, 0, 0.1]} color={pressed ? '#7dffb0' : '#ff8aa0'} intensity={0.15} distance={0.5} decay={2} />
          </group>
          <PhoneCrowd v={v} from={PRESS + 0.6} />
        </DuskCity>
      );
    },
  },
  servers: {
    view: (v) => mv(v, S('servers'), E('servers'), [0.2, 1.55, 1.4], [0.1, 1.45, -1.6], [-0.1, 1.45, -10], [0.05, 1.5, -10], [52, 48]),
    shakes: [[SERVERS, 0.3], [SERVERS_OFF[0], 0.4]],
    render: (v) => {
      const red = v >= SERVERS ? 1 : 0;
      const offAt = (k: number) => {
        const r = k % 7;
        return lerp(SERVERS_OFF[0], SERVERS_OFF[1], (6 - r) / 6) + (k >= 7 ? 0.07 : 0);
      };
      const allOff = v >= SERVERS_OFF[1] + 0.05;
      return (
        <>
          <color attach="background" args={['#000']} />
          <ambientLight intensity={0.15} />
          <pointLight position={[0, 2.5, -2]} color={red ? '#ff3030' : '#cfe0ff'} intensity={allOff ? 1.2 : 6} distance={9} decay={2} />
          <pointLight position={[0, 2.5, -7]} color={red ? '#ff3030' : '#cfe0ff'} intensity={allOff ? 1.2 : 6} distance={9} decay={2} />
          <ServerRoom v={v} red={red} offAt={offAt} screenOn={red ? 1 : 0} />
          {[1, 4, 9, 11].map((k, i) => {
            const r = k % 7;
            const x = k >= 7 ? 0.65 : -0.65;
            return <Sparks key={k} at={[x, 0.9 + (i % 3) * 0.5, -1 - r * 1.15]} age={v - (SERVERS + 0.1 + i * 0.22)} seed={k * 20} dir={k >= 7 ? -1 : 1} />;
          })}
          {v > SERVERS + 0.3 ? <Smoke origin={[-0.6, 1.6, -3.3]} t={v - SERVERS} seed={3} n={6} rise={1.2} size={0.5} color="#3a3a40" opacity={0.6} /> : null}
          {v > SERVERS + 0.5 ? <Smoke origin={[0.6, 1.2, -5.6]} t={v - SERVERS} seed={8} n={6} rise={1.2} size={0.5} color="#3a3a40" opacity={0.6} /> : null}
        </>
      );
    },
  },
  chart: {
    view: (v) => {
      const a = mv(v, S('chart'), PLUNGE + 0.2, [0.6, 4.6, -4.2], [0.2, 4.4, -5.0], [0, 4.5, -10.8], [0.4, 4.0, -10.8], 46);
      if (v < PLUNGE + 0.35) return a;
      return mv(v, PLUNGE + 0.35, E('chart') - 0.1, [0.2, 4.4, -5.0], [5.6, 2.3, 4.6], [0.4, 4.0, -10.8], [1.2, 2.3, -6], [46, 52]);
    },
    shakes: [[PLUNGE, 0.7], [FACEPLANT, 0.5]],
    render: (v) => {
      const k = v < PLUNGE ? lerp(0.6, 0.78, ramp(v, S('chart'), PLUNGE)) : lerp(0.78, 1, ramp(v, PLUNGE, PLUNGE + 0.7));
      const pct = 61 * ramp(v, PLUNGE, PLUNGE + 0.7);
      const red = v >= PLUNGE ? 1 : 0;
      const face = smooth(ramp(v, FACEPLANT - 0.25, FACEPLANT));
      return (
        <>
          <color attach="background" args={['#05060a']} />
          <ambientLight intensity={0.25} />
          <hemisphereLight color="#8aa0d0" groundColor="#1a1c24" intensity={0.5} />
          <pointLight position={[0, 4.5, -7]} color={red ? '#ff3046' : '#2fe07a'} intensity={30} distance={16} decay={1.8} />
          <pointLight position={[3, 3, 3]} color="#cfd8ff" intensity={6} distance={10} decay={2} />
          <TradingFloor v={v} k={k} pct={pct} red={red} face={face} />
        </>
      );
    },
  },
  domino: {
    view: (v) => mv(v, S('domino'), E('domino'), [-3.6, 1.7, 4.6], [-1.6, 2.2, 6.2], [1.6, 1.2, 0], [3.4, 0.7, 0], [48, 50]),
    shakes: DOMINO_HITS.map((h, i) => [h, 0.35 + i * 0.1] as [number, number]),
    render: (v) => (
      <>
        <color attach="background" args={['#07070b']} />
        <fog attach="fog" args={['#07070b', 8, 22]} />
        <ambientLight intensity={0.3} />
        <spotLight position={[-2, 7, 4]} angle={0.7} penumbra={0.6} intensity={60} distance={20} decay={1.5} color="#ffe8d0" />
        <pointLight position={[6, 1, -2]} color="#ff2a3a" intensity={12} distance={12} decay={1.6} />
        <Box size={[30, 0.1, 20]} position={[2, -0.05, 0]} color="#16161c" />
        {/* a faint red graph line on the floor behind */}
        {Array.from({length: 12}).map((_, i) => (
          <Box key={i} size={[1.2, 0.01, 0.06]} position={[-4 + i * 1.1, 0.006, -3 + (i > 7 ? (i - 7) * 0.6 : -i * 0.08)]} rotation={[0, i > 7 ? -0.5 : 0.07, 0]} color="#ff2a3a" emissive="#ff1a2a" emissiveIntensity={1.4} shadow={false} />
        ))}
        <Dominoes angles={DOMINO_ANGLES(v)} />
      </>
    ),
  },
  bubble: {
    view: (v) => mv(v, S('bubble'), E('bubble'), [2, 1.6, -7], [1.2, 1.8, -5.5], [BUBBLE[0] * 0.7, BUBBLE[1] * 0.62, BUBBLE[2]], [BUBBLE[0] * 0.7, BUBBLE[1] * 0.55, BUBBLE[2]], [52, 56]),
    shakes: [[POP, 0.6]],
    render: (v) => (
      <DuskCity v={v}>
        <AiBubble position={BUBBLE} r={24} t={v} pop={Math.max(0, v - POP)} />
        {v < POP ? <pointLight position={BUBBLE} color="#9fb8ff" intensity={2000} distance={200} decay={1.4} /> : null}
        <PhoneCrowd v={v} from={99} n={14} area={[-8, 10, -3, 4]} />
        <FallingBoxes v={v} from={POP + 0.5} n={20} area={[-20, 16, 2, 40]} />
      </DuskCity>
    ),
  },
  crisis: {
    view: (v) => mv(v, S('crisis'), E('crisis'), [-14.5, 1.7, 6.2], [-14, 1.7, 6.8], [-6, 1.5, 10], [-8, 1.4, 10.2], [48, 46]),
    render: (v) => {
      const st = DUSK(v);
      const sky = blendSky(SKIES.dusk, SKIES.dead, 0.45);
      return (
        <>
          <Sky c={sky} />
          <fog attach="fog" args={['#8a6a72', 60, 900]} />
          <DuskLights dim={0.8} />
          <Ground st={st} />
          <Houses st={st} />
          <Lamps st={st} />
          <Palms st={st} />
          <ParkedCars st={st} />
          <Billboard st={st} cover={1} paint={1} />
          <FallingBoxes v={v} from={S('crisis') - 0.6} n={26} area={[-8, 14, -3, 9]} />
          {[0, 1, 2, 3, 4].map((i) => {
            const t = v - S('crisis');
            const x = -2 - i * 2.4 - t * 1.3;
            const ph = t * 7 + i;
            return (
              <Person
                key={i}
                position={[x, 0.16, 9.2 + (i % 2) * 1.4]}
                rotation={-Math.PI / 2}
                shirt={['#f2f2f4', '#4a7fd0', '#3d3d48', '#d9d9de', '#c85b8a'][i]}
                pants="#2c3550"
                hair={['#2a1d15', '#7b5434', '#1a1a1a', '#c9a46a', '#4a3324'][i]}
                longHair={i % 2 === 1}
                pose={{...BOX_POSE, legL: Math.sin(ph) * 0.45, legR: -Math.sin(ph) * 0.45, head: [0.3, 0]}}
                bodyExtra={<CarryBox />}
              />
            );
          })}
        </>
      );
    },
  },
  studio: {
    view: (v) => mv(v, S('studio'), E('studio'), [5.2, 2.3, 2.8], [4.0, 2.0, 1.7], [-1.6, 0.9, -4], [-1.2, 0.9, -4.4], [50, 48]),
    render: (v) => (
      <>
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.35} color="#fff2e0" />
        <hemisphereLight color="#fff6e8" groundColor="#4a4038" intensity={0.7} />
        <pointLight position={[0, 2.7, -3]} color="#fff6e0" intensity={14} distance={12} decay={1.8} />
        <Studio v={v} stand={STANDUP} />
      </>
    ),
  },
  repaint: {
    view: (v) => mv(v, S('repaint'), E('repaint'), [11.6, 4.9, -3.6], [12.4, 4.7, -2.2], [7.0, 8.4, -15], [6.6, 8.6, -15], [46, 50]),
    render: (v) => (
      <DuskCity v={v} billboard={<Billboard st={DUSK(v)} base="2027" year="2028" cover={ramp(v, REPAINT2[0], REPAINT2[1])} paint={ramp(v, PAINT2[0], PAINT2[1])} />}>
        <pointLight position={[6, 9, -11]} color="#ff6aa0" intensity={60} distance={30} decay={1.6} />
        <Worker2 v={v} />
        <Fan position={FAN0} rotation={FAN_YAW} pose={{head: [-0.25, 0], eyes: 0.55}} />
      </DuskCity>
    ),
  },
  leak: {
    view: (v) => mv(v, S('leak'), E('leak'), [0.62, 1.62, -0.3], [0.48, 1.5, -0.5], [0.02, 0.84, -1.1], [0.02, 0.86, -1.12], [48, 42]),
    render: (v) => {
      const usb = smooth(ramp(v, USB - 0.3, USB));
      const k = ramp(v, UPLOAD[0], UPLOAD[1]);
      const done = v >= UPLOAD[1] ? 1 : 0;
      return (
        <>
          <color attach="background" args={['#000']} />
          <ambientLight intensity={0.3} color="#8a9ad0" />
          <pointLight position={[1.5, 2.2, 1.2]} color="#5a6aa0" intensity={2} distance={6} decay={2} />
          <LeakRoom v={v} usb={usb} k={k} done={done} />
        </>
      );
    },
  },
  globe: {
    view: (v) => mv(v, S('globe'), E('globe'), [4, 4.5, 31], [-3, 2.5, 25], [0, 0.5, 0], [0, 0.6, 0], [40, 42], 5000),
    shakes: [[NET_DOWN, 0.6]],
    render: (v) => {
      const grow = ramp(v, ARCS[0], ARCS[1]);
      const heat = ramp(v, 33.0, NET_DOWN);
      const gone = ramp(v, NET_DOWN, NET_DOWN + 0.3);
      const blast = ramp(v, NET_DOWN, NET_DOWN + 1.4);
      const out = lerp(0, Math.PI, easeIn(ramp(v, LIGHTS_OUT[0], LIGHTS_OUT[1])) * 0.6 + ramp(v, LIGHTS_OUT[0], LIGHTS_OUT[1]) * 0.4);
      return (
        <>
          <color attach="background" args={['#010206']} />
          <Stars />
          <NightEarth r={10} hub={HUB} out={v < LIGHTS_OUT[0] ? 0 : out} load={heat} />
          <Arcs r={10} hub={HUB} grow={grow} heat={heat} gone={gone} t={v} />
          <Hub r={10} hub={HUB} heat={heat} blast={blast} />
        </>
      );
    },
  },
  card: {
    view: (v) => mv(v, S('card'), E('card'), [0.1, 1.42, 0.42], [0.06, 1.36, 0.32], [0, 0.97, 0.06], [0, 0.97, 0.06], [42, 38]),
    shakes: [[DECLINED, 0.25]],
    render: (v) => {
      const tap = smooth(ramp(v, 37.4, 37.65));
      return (
        <>
          <color attach="background" args={['#1a1814']} />
          <fog attach="fog" args={['#3a3630', 1.2, 4]} />
          <ambientLight intensity={0.4} />
          <hemisphereLight color="#fff2e0" groundColor="#4a4038" intensity={0.8} />
          <pointLight position={[0.5, 2.2, 0.8]} color="#fff2d8" intensity={3} distance={5} decay={2} />
          <CardCounter v={v} tap={tap} away={smooth(ramp(v, DECLINED - 0.15, DECLINED + 0.3))} declined={v >= DECLINED ? 1 : 0} />
        </>
      );
    },
  },
  shelf: {
    view: (v) => mv(v, S('shelf'), E('shelf'), [0.5, 1.65, 0.8], [0.3, 1.55, 0.2], [0, 1.25, -1.9], [0.05, 1.3, -1.9], [50, 46]),
    shakes: [[S('shelf') + 0.2, 0.25], [S('shelf') + 0.9, 0.3]],
    render: (v) => (
      <>
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.35} />
        <hemisphereLight color="#f0f6ff" groundColor="#6a665e" intensity={0.8} />
        <pointLight position={[0, 2.7, -1.5]} color="#f0f6ff" intensity={Math.sin(v * 23) > -0.5 ? 6 : 1.5} distance={6} decay={2} />
        <Aisle v={v} pull={1} />
      </>
    ),
  },
  burn: {
    view: (v) => mv(v, S('burn'), E('burn'), [26, 13, -26], [21, 10, -22], [0, 4, 14], [-2, 4, 14], [50, 48]),
    render: (v) => {
      const st = WRECK(v);
      const fires: V3[] = [
        [-20, 8, 12.4], [-6, 14, 12.4], [8, 6, 12.4], [18, 11, 12.4], [32, 5, 12.4], [-34, 10, 12.4], [44, 9, 12.4],
      ];
      return (
        <>
          <Sky c={SKIES.fire} />
          <fog attach="fog" args={['#3a120a', 30, 500]} />
          <hemisphereLight color="#ff6a2a" groundColor="#200805" intensity={1.0} />
          <directionalLight position={[-100, 60, -200]} color="#ff7a3a" intensity={0.8} />
          <Ground st={st} />
          <Houses st={st} />
          <Palms st={st} />
          <ParkedCars st={st} crush={(k) => (k % 2 ? 0.6 : 0)} burnt={() => 1} />
          <Billboard st={st} cover={1} paint={1} year="2028" base="2027" lit={0} tilt={0.25} />
          {fires.map((p, i) => (
            <group key={i}>
              <Fire position={p} t={v} size={2.6} seed={i} />
              <Smoke origin={[p[0], p[1] + 2, p[2]]} t={v} seed={i * 10} n={10} rise={4} size={3.5} />
              <pointLight position={[p[0], p[1] + 1, p[2] - 2]} color="#ff7a2a" intensity={160} distance={30} decay={1.6} />
            </group>
          ))}
          {PARKED.filter((_, k) => k % 2 === 0).map((c, k) => (
            <Fire key={`c${k}`} position={[c.x, 0.9, c.z]} t={v} size={1.2} seed={k + 20} />
          ))}
          <Car position={[-4, 0.4, 1]} color="#7fd3c8" burnt={1} tumble={[0.3, 1.1, 2.7]} />
          <Fall center={[0, 6, 0]} t={v} color="#5a5450" size={0.15} box={[60, 24, 40]} speed={1.2} wind={2} n={900} />
        </>
      );
    },
  },
  find: {
    view: (v) => mv(v, S('find'), E('find'), [6.6, 1.0, 5.6], [5.0, 1.1, 4.3], [SURV[0], 0.9, SURV[2]], [SURV[0], 1.0, SURV[2]], [46, 40]),
    render: (v) => {
      const up = smooth(ramp(v, DISC_FOUND - 0.35, DISC_FOUND + 0.25));
      const dig = v < DISC_FOUND - 0.35 ? Math.sin(v * 7) * 0.25 : 0;
      const yaw = Math.atan2(5.6 - SURV[0], 5.0 - SURV[2]);
      return (
        <>
          <RuinsLand v={v} />
          <group position={[SURV[0], 0, SURV[2]]} rotation={[0, yaw, 0]}>
            <Fan
              position={[0, lerp(-0.42, -0.3, up), 0]}
              rotation={0}
              box="none"
              look={{hood: true, beard: true}}
              pose={{
                legL: 1.3,
                legR: 1.1,
                armL: [lerp(0.9 + dig, 1.35, up), 0.25],
                armR: [lerp(0.9 - dig, 1.35, up), -0.25],
                elbowL: lerp(0.4, 0.7, up),
                elbowR: lerp(0.4, 0.7, up),
                head: [lerp(0.5, 0.25, up), 0],
                eyes: 1 + 0.4 * up,
              }}
            />
            {/* the case: half buried, then in his hands */}
            <group position={[lerp(0.05, 0.0, up), lerp(0.04, 1.0, up), lerp(0.62, 0.55, up)]} rotation={[lerp(-1.4, -0.15, up), 0, lerp(0.4, 0, up)]} scale={1.8}>
              <DiscCase />
            </group>
            {up > 0.5 ? <pointLight position={[0, 2.0, 0.8]} color="#ffb070" intensity={0.8} distance={2} decay={2} /> : null}
          </group>
        </>
      );
    },
  },
  setup: {
    view: (v) => mv(v, S('setup'), E('setup'), [2.0, 1.25, -1.75], [1.75, 1.15, -1.45], [0.2, 0.62, 0.15], [0.25, 0.6, 0.1], [50, 46]),
    render: (v) => {
      const disc = smooth(ramp(v, DISC_IN - 0.45, DISC_IN));
      const on = clamp01((v - TV_ON) / 0.2);
      return (
        <>
          <RuinsLand v={v} near />
          <Corner v={v} tvOn={on} k={ramp(v, TV_ON + 0.2, TV_ON + 3)} err={0} disc={disc} head={[0.55, -0.4]} reach={1 - smooth(ramp(v, DISC_IN, DISC_IN + 0.4))} />
        </>
      );
    },
  },
  screen: {
    view: (v) => mv(v, S('screen'), E('screen'), [0.02, 0.74, 0.55], [0.01, 0.64, 0.4], [0, 0.17, -0.32], [0, 0.17, -0.32], 40),
    render: (v) => {
      const k = Math.min(0.92, ramp(v, TV_ON + 0.2, TV_ON + 1.1));
      const err = ramp(v, ERROR, ERROR + 0.25);
      return (
        <>
          <RuinsLand v={v} near />
          <Corner v={v} tvOn={1} k={k} err={err} disc={1} hideFan />
        </>
      );
    },
  },
  turn: {
    view: (v) => mv(v, S('turn'), E('turn'), [1.5, 1.25, -0.4], [1.3, 1.27, -0.25], [0, 1.15, 0.6], [0, 1.18, 0.6], [44, 40]),
    render: (v) => {
      const turn = smooth(ramp(v, TURN, TURN + 0.9));
      const on = v < TV_OFF ? 1 : clamp01(1 - (v - TV_OFF) / 0.15);
      return (
        <>
          <RuinsLand v={v} near />
          <Corner v={v} tvOn={on} k={0.92} err={1} disc={1} head={[lerp(0.3, 0.05, turn), lerp(0, -1.05, turn)]} />
        </>
      );
    },
  },
};

export const viewAt = (v: number): View => {
  const s = shotAt(v);
  const sc = SCENES[s.name];
  const view = sc.view(v);
  const hv = handheld(view, v, sc.shakes ?? []);
  // far targets: shake the target, not the camera (the camera would wander metres away)
  const d = Math.hypot(view.pos[0] - view.target[0], view.pos[1] - view.target[1], view.pos[2] - view.target[2]);
  const k = Math.min(1, 2 / d);
  const off: V3 = [hv.pos[0] - view.pos[0], hv.pos[1] - view.pos[1], hv.pos[2] - view.pos[2]];
  return {
    ...hv,
    pos: [view.pos[0] + off[0] * k, view.pos[1] + off[1] * k, view.pos[2] + off[2] * k],
    target: [view.target[0] - off[0] * (1 - k), view.target[1] - off[1] * (1 - k), view.target[2] - off[2] * (1 - k)],
  };
};

export const World: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v).name;
  return (
    <>
      <CameraRig v={v} view={viewAt} />
      {SCENES[s].render(v)}
    </>
  );
};

export {SCENES};
