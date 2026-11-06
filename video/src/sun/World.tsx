import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box, Cyl, Ico} from '../scene/parts';
import {Person, PersonPose} from '../scene/Characters';
import {CameraRig, View, handheld} from '../slime/camera';
import {Glow, Planet, Stars, Sun} from '../gta/Space';
import {NightEarth} from '../gta2/Globe';
import {useCanvas} from '../gta/tex';
import {COND} from '../gta/Overlay';
import {
  BLACKOUT,
  BUY,
  CRACK,
  DARK,
  HEAT,
  JUP_OFF,
  KNOCK,
  LAMPS,
  MOON_OFF,
  Shot,
  V3,
  clamp01,
  clockAt,
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
  Beach,
  CoatHero,
  DAY,
  DarkLights,
  DayLights,
  Facade,
  GH_LEN,
  Greenhouse,
  Guy,
  Hero,
  IceCream,
  IceCreamCart,
  IceSheet,
  Lantern,
  Pic,
  MoonBall,
  PanelDisplay,
  Seabed,
  Shrimp,
  SkyFog,
  Sleeper,
  Smoker,
  SolarPanel,
  StreetLamp,
  Suitcase,
  Sunflower,
  Telescope,
  Tower,
  TubeWorm,
  VOID,
  WinMode,
} from './Sets';
import {drawJupiter} from './tex';

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
const up = (p: V3, dy: number): V3 => [p[0], p[1] + dy, p[2]];
const label = (g: CanvasRenderingContext2D, W: number, H: number, text: string, col: string) => {
  g.clearRect(0, 0, W, H);
  g.fillStyle = col;
  g.font = `600 ${Math.round(H * 0.8)}px ${COND}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, W / 2, H * 0.55);
};

type Scene = {view: (v: number) => View; render: (v: number) => React.ReactNode; shakes?: [number, number][]};

// ---------------------------------------------------------------- the sky over the beach: the Sun, then nothing

const SUN_DIR = new THREE.Vector3(...(DAY.sunDir as V3)).normalize();
const SUN_POS: V3 = [SUN_DIR.x * 1300, SUN_DIR.y * 1300, SUN_DIR.z * 1300];

const DaySet: React.FC<{v: number}> = ({v}) => (
  <>
    <SkyFog c={DAY} fog={[80, 900]} />
    <DayLights />
    <Sun position={SUN_POS} r={42} t={v} />
  </>
);
const DarkSet: React.FC<{fog?: [number, number]; k?: number; stars?: number}> = ({fog = [40, 500], k = 1, stars = 1}) => (
  <>
    <SkyFog c={VOID} fog={fog} fogCol="#05070f" />
    <DarkLights k={k} />
    <Stars opacity={stars} />
  </>
);

// a dense starfield (the shared Stars are too sparse for the shot about the stars)
const StarField: React.FC<{n: number; size: number; seed: number}> = ({n, size, seed}) => {
  const geometry = useMemo(() => {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      // more stars along a band across the sky, like the Milky Way
      const band = i % 3 === 0;
      const u = band ? (rnd(i * 5 + seed) - 0.5) * 0.35 : rnd(i * 5 + seed) * 2 - 1;
      const t = rnd(i * 5 + seed + 1) * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const d = 1900;
      // tilt the band so it crosses the sky diagonally
      const x = Math.cos(t) * r;
      const y = u;
      const z = Math.sin(t) * r;
      pos[i * 3] = x * d;
      pos[i * 3 + 1] = (y * 0.8 + z * 0.6) * d;
      pos[i * 3 + 2] = (-y * 0.6 + z * 0.8) * d;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [n, seed]);
  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={-5}>
      <pointsMaterial color="#ffffff" size={size} sizeAttenuation={false} transparent opacity={0.95} depthWrite={false} fog={false} />
    </points>
  );
};

// a Sun that went out: a dark ball with a faint red rim
const DeadSun: React.FC<{position: V3; r: number}> = ({position, r}) => (
  <group position={position}>
    <mesh>
      <icosahedronGeometry args={[r, 3]} />
      <meshStandardMaterial color="#1a1210" flatShading emissive="#3a1206" emissiveIntensity={0.6} roughness={1} fog={false} />
    </mesh>
    <Glow position={[0, 0, 0]} size={r * 3.2} color="#7a2a10" k={0.35} />
  </group>
);

// ---------------------------------------------------------------- the hero on the lounger

// lounger at the origin: torso along the raised back, legs flat (see Sets.Lounger)
const LIE_POS: V3 = [0, 0.14, 0.71];
const LIE_TILT = -1.12;
const BeachHero: React.FC<{pose?: PersonPose}> = ({pose}) => (
  <group position={LIE_POS} rotation={[LIE_TILT, 0, 0]}>
    <Hero position={[0, 0, 0]} pose={{legL: 0.45, legR: 0.45, armL: [0.05, 0.12], armR: [0.05, -0.12], eyes: 0.25, head: [0.15, 0], ...pose}} />
  </group>
);

// ---------------------------------------------------------------- the kiosk: the seller hands over the ice cream

const CART: V3 = [3.2, 0, 4.0];
const SELLER: V3 = [3.2, 0, 3.12];
const BUYER: V3 = [3.2, 0, 5.02];
const REACH = {pitch: 1.3, elbow: 0.2};
const LICK = {pitch: 0.55, elbow: 1.55};

const kioskPoses = (v: number) => {
  // seller: bends to the freezer, comes up with the cone, reaches out until BUY, then lets go
  const dig = smooth(ramp(v, BUY - 1.6, BUY - 1.2)) * (1 - smooth(ramp(v, BUY - 0.9, BUY - 0.6)));
  const give = smooth(ramp(v, BUY - 0.7, BUY - 0.15)) * (1 - smooth(ramp(v, BUY + 0.3, BUY + 0.8)));
  const sP = lerp(lerp(0.1, 0.9, dig), REACH.pitch, give);
  const sE = lerp(lerp(0.2, 0.3, dig), REACH.elbow, give);
  // buyer: reaches at BUY, then brings it up to lick
  const take = smooth(ramp(v, BUY - 0.5, BUY - 0.05));
  const back = smooth(ramp(v, BUY + 0.15, BUY + 0.75));
  const bP = lerp(lerp(0.05, REACH.pitch, take), LICK.pitch, back);
  const bE = lerp(lerp(0.1, REACH.elbow, take), LICK.elbow, back);
  return {sP, sE, bP, bE, dig, back};
};

// the cone sits 6 cm above the hand
const coneAt = (hand: V3): V3 => up(hand, 0.07);

// ---------------------------------------------------------------- the beach hero standing in the dark

const STAND: V3 = [0.9, 0, 1.7];
const STAND_YAW = 2.75; // facing the sea and the Sun
const standPose = (v: number): {pose: PersonPose; hand: V3} => {
  const shock = smooth(ramp(v, DARK + 0.15, DARK + 0.5));
  const drop = smooth(ramp(v, DARK + 1.4, DARK + 2.6));
  const p = lerp(LICK.pitch, 0.2, drop);
  const e = lerp(LICK.elbow, 1.3, drop);
  return {
    pose: {armR: [p, -0.06], elbowR: e, armL: [0.05, 0.08], head: [lerp(0.05, -0.32, shock), lerp(0, 0.35 * Math.sin((v - DARK) * 0.9), shock)], eyes: lerp(0.6, 1.8, shock), mouth: lerp(0.15, 0.7, shock)},
    hand: handWorld(STAND, STAND_YAW, p, e, 1),
  };
};

// ---------------------------------------------------------------- the night city

const ROOF_Y = 12;
const COUPLE: [V3, V3] = [
  [-0.45, ROOF_Y, 0.2],
  [0.4, ROOF_Y, 0.25],
];
const MOON_POS: V3 = [-8, 40, 70];

const NightCity: React.FC<{v: number}> = ({v}) => {
  const on = 1 - smooth(ramp(v, MOON_OFF, MOON_OFF + 0.35));
  return (
    <>
      <SkyFog c={VOID} fog={[40, 400]} fogCol="#05070f" />
      <DarkLights k={0.55 + 0.45 * on} />
      <directionalLight position={MOON_POS} color="#c8d0e8" intensity={0.9 * on} />
      <Stars />
      <MoonBall position={MOON_POS} r={4.2} on={on} />
      <Glow position={MOON_POS} size={20} color="#9aa8c8" k={0.55 * on} />
      {/* our roof, the street below, the buildings across it */}
      <Box size={[14, ROOF_Y, 10]} position={[0, ROOF_Y / 2, -4]} color="#8a847a" />
      <Box size={[14, 0.5, 0.25]} position={[0, ROOF_Y + 0.25, 0.88]} color="#6a645c" />
      <Box size={[1.2, 1.1, 1.2]} position={[4.5, ROOF_Y + 0.55, -6]} color="#7a746c" />
      <Box size={[200, 0.1, 30]} position={[0, -0.05, 12]} color="#3a3c44" />
      <Facade position={[-9, 0, 26]} size={[14, 14, 4]} cols={7} rows={5} seed={5} wall="#c9d2d8" rotation={Math.PI} />
      <Facade position={[8, 0, 27]} size={[12, 19, 4]} cols={6} rows={7} seed={8} wall="#d9d2c4" rotation={Math.PI} />
      <Facade position={[24, 0, 22]} size={[12, 11, 4]} cols={6} rows={4} seed={11} wall="#cfd6dc" rotation={Math.PI} />
      <Facade position={[-24, 0, 24]} size={[12, 16, 4]} cols={6} rows={6} seed={13} wall="#d9d2c4" rotation={Math.PI} />
      <StreetLamp position={[-5, 0, 9]} on={1} />
      <StreetLamp position={[7, 0, 9]} on={1} />
      {/* warm light from the roof door behind them */}
      <Box size={[1.0, 2.0, 0.1]} position={[-3.2, ROOF_Y + 1.0, -2.45]} color="#ffd98a" emissive="#ffc870" emissiveIntensity={1.2} shadow={false} />
      <Box size={[1.4, 2.4, 1.0]} position={[-3.2, ROOF_Y + 1.2, -3.0]} color="#7a746c" />
      <pointLight position={[-2.0, ROOF_Y + 1.8, -1.4]} color="#ffc870" intensity={7} distance={7} decay={1.6} />
      <Person position={COUPLE[0]} rotation={yawTo(COUPLE[0], MOON_POS)} shirt="#4fb6c2" pants="#3a3a40" hair="#7b5434" longHair pose={{head: [-0.5, 0.15 * (1 - on)], armR: [0.3, -0.1], elbowR: 0.6}} />
      <Person position={COUPLE[1]} rotation={yawTo(COUPLE[1], MOON_POS)} shirt="#d9d9de" pants="#2c3550" hair="#2a1d15" pose={{head: [-0.5, -0.1 * (1 - on)], armL: [lerp(0.3, 1.9, 1 - on), 0.1], elbowL: 0.1}} />
    </>
  );
};

// ---------------------------------------------------------------- the rooftop and Jupiter in the eyepiece

const EYE = JUP_OFF[0] - 0.9; // cut to the eyepiece view
const SCOPE: V3 = [0, 0, 0];
const ASTRO: V3 = [0, 0, 0.62];

const JupiterBall: React.FC<{k: number}> = ({k}) => {
  const tex = useCanvas(512, 256, 'jupiter', (g) => drawJupiter(g, 512, 256));
  const col = useMemo(() => new THREE.Color(), []);
  col.setRGB(k, k, k);
  return (
    <group position={[0, 0, -40]}>
      <mesh rotation={[0.1, 0.4, 0.05]}>
        <sphereGeometry args={[2.2, 48, 32]} />
        <meshBasicMaterial map={tex} color={col.clone()} toneMapped={false} />
      </mesh>
      {/* the four big moons, they go out too */}
      {[-4.4, -3.0, 3.6, 5.4].map((x, i) => (
        <mesh key={i} position={[x, 0.12 * (i - 1.5), 0]}>
          <sphereGeometry args={[0.14, 12, 8]} />
          <meshBasicMaterial color={col.clone()} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

const Rooftop: React.FC = () => (
  <>
    <SkyFog c={VOID} fog={[60, 600]} fogCol="#05070f" />
    <DarkLights k={0.8} />
    <Stars />
    <Box size={[16, 0.3, 16]} position={[0, -0.15, -2]} color="#5a5a62" />
    <Box size={[16, 0.9, 0.25]} position={[0, 0.45, 5.9]} color="#6a6a72" />
    <Box size={[0.25, 0.9, 16]} position={[-7.9, 0.45, -2]} color="#6a6a72" />
    <Box size={[0.25, 0.9, 16]} position={[7.9, 0.45, -2]} color="#6a6a72" />
    <Telescope position={SCOPE} lift={0.55} />
    <pointLight position={[0.9, 2.3, 1.5]} color="#ff6a5a" intensity={6} distance={6} decay={1.6} />
    <Person position={ASTRO} rotation={Math.PI} shirt="#3d3d48" pants="#2c3550" hair="#8a8a8a" pose={{head: [0.42, 0], armR: [0.9, -0.25], elbowR: 1.1, armL: [0.7, 0.2], elbowL: 1.2}} headExtra={<Box size={[0.34, 0.06, 0.34]} position={[0, 0.4, 0]} color="#2a2a30" />} />
    {/* the city below the roof */}
    {Array.from({length: 9}).map((_, i) => (
      <Tower key={i} position={[-36 + i * 9, -40, -30 - (i % 3) * 14]} size={[7, 34 + (i % 4) * 6, 7]} cols={6} rows={12} seed={i + 20} mode="lit" />
    ))}
  </>
);

// ---------------------------------------------------------------- orbit around the dark Sun

const ORBIT_R = 34;
const earthAngle = (v: number) => 0.6 + 0.045 * (v - S('orbit'));
const earthPos = (v: number): V3 => [Math.sin(earthAngle(v)) * ORBIT_R, 0, Math.cos(earthAngle(v)) * ORBIT_R];

// ---------------------------------------------------------------- the city blackout

const TOWERS: {pos: V3; size: V3; cols: number; rows: number; heat: number; out: number}[] = Array.from({length: 9}).map((_, i) => ({
  pos: [-44 + i * 11, 0, -70 - (i % 2) * 10],
  size: [9, 24 + ((i * 7) % 5) * 7, 8],
  cols: 7,
  rows: 10 + ((i * 7) % 5) * 2,
  heat: HEAT[i % HEAT.length],
  out: BLACKOUT[Math.min(BLACKOUT.length - 1, Math.floor((i * BLACKOUT.length) / 9))],
}));
const towerMode = (v: number, t: (typeof TOWERS)[number]): WinMode => (v >= t.out ? 'off' : v >= t.heat ? 'heat' : 'lit');

// ---------------------------------------------------------------- airport queue

const QUEUE: {pos: V3; yaw: number}[] = [
  ...Array.from({length: 12}).map((_, i) => ({pos: [-4.6 + i * 0.85, 0, -0.75] as V3, yaw: -Math.PI / 2})),
  ...Array.from({length: 11}).map((_, i) => ({pos: [5.6 - i * 0.85, 0, -2.45] as V3, yaw: Math.PI / 2})),
];
const HERO_Q = 7; // the hero's place in the first row

// ---------------------------------------------------------------- the ice cream at the end

const GH_HERO: V3 = [0.05, 0, 3.0];
const TABLE_X = 0.75;
const finalPose = (v: number) => {
  const t0 = S('icecream');
  const out = smooth(ramp(v, t0 + 0.9, t0 + 1.8)); // out of the pocket, up to the face
  const to = smooth(ramp(v, t0 + 2.6, t0 + 3.3)); // over the table
  let p = lerp(lerp(0.12, 0.55, out), 0.95, to);
  let e = lerp(lerp(0.55, 1.5, out), 0.25, to);
  for (const k of KNOCK) {
    const x = v - (k - 0.12);
    if (x > 0 && x < 0.3) {
      const b = Math.sin((x / 0.3) * Math.PI);
      p += 0.06 * (x < 0.12 ? x / 0.12 : b);
      e -= 0.05 * b;
    }
  }
  return {p, e, out, to};
};

// ---------------------------------------------------------------- scenes

const SCENES: Record<Shot, Scene> = {
  beach: {
    view: (v) => {
      // from the bright Sun down to the hero in the lounger
      if (v < 2.6) return mv(v, 0, 2.6, [2.6, 1.0, 3.4], [2.4, 1.2, 3.0], [SUN_DIR.x * 40, 1 + SUN_DIR.y * 40, SUN_DIR.z * 40], [0.2, 0.7, -0.5], [44, 42]);
      return mv(v, 2.6, E('beach'), [2.4, 1.2, 3.0], [2.0, 1.55, 0.9], [0.2, 0.7, -0.5], [0, 0.6, -0.55], [42, 40]);
    },
    render: (v) => (
      <>
        <DaySet v={v} />
        <Beach t={v} />
        <BeachHero pose={{mouth: 0.08 + 0.06 * Math.sin(v * 2)}} />
      </>
    ),
  },
  gap: {
    view: (v) => mv(v, S('gap'), E('gap'), [7, 40, 24], [5, 35, 19], [0, -1.5, -26], [0, -0.5, -28], [50, 48]),
    render: (v) => {
      const sunP: V3 = [0, 6, -62];
      const sunR = 9;
      const dir = new THREE.Vector3(-sunP[0], -sunP[1], -sunP[2]).normalize();
      const from = new THREE.Vector3(...sunP).addScaledVector(dir, sunR);
      const to = new THREE.Vector3(0, 0, 0).addScaledVector(dir, -3.25);
      const k = clamp01(clockAt(v) / 500);
      const tail = from.clone().lerp(to, k);
      const len = tail.distanceTo(to);
      const mid = tail.clone().add(to).multiplyScalar(0.5);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      return (
        <>
          <color attach="background" args={['#000000']} />
          <hemisphereLight color="#334" groundColor="#000" intensity={0.3} />
          <Stars />
          <DeadSun position={sunP} r={sunR} />
          <Planet position={[0, 0, 0]} r={3.2} sun={[-dir.x, -dir.y, -dir.z]} st={{}} />
          {/* the last light, still on its way */}
          <group position={[mid.x, mid.y, mid.z]} quaternion={q}>
            <mesh>
              <cylinderGeometry args={[3.5, 3.5, len, 24, 1, true]} />
              <meshBasicMaterial color="#ffcf5a" transparent opacity={0.13} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
            <mesh>
              <cylinderGeometry args={[1.0, 1.0, len, 16, 1, true]} />
              <meshBasicMaterial color="#fff2b0" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
          </group>
          <Glow position={[tail.x, tail.y, tail.z]} size={9} color="#ffb84a" k={0.9} />
        </>
      );
    },
  },
  kiosk: {
    view: (v) => mv(v, S('kiosk'), E('kiosk'), [6.6, 1.55, 6.9], [5.7, 1.5, 6.15], [3.15, 1.25, 4.1], [3.2, 1.35, 4.35], [42, 40]),
    render: (v) => {
      const {sP, sE, bP, bE, dig} = kioskPoses(v);
      const sHand = handWorld(SELLER, 0, sP, sE, 1);
      const bHand = handWorld(BUYER, Math.PI, bP, bE, 1);
      const lid = smooth(ramp(v, BUY - 1.8, BUY - 1.5)) * (1 - smooth(ramp(v, BUY - 0.9, BUY - 0.6)));
      return (
        <>
          <DaySet v={v} />
          <Beach t={v} />
          <IceCreamCart position={CART} lid={lid} />
          <Person position={SELLER} shirt="#ffffff" pants="#2c3550" hair="#2a1d15" pose={{armR: [sP, -0.08], elbowR: sE, head: [0.15 + 0.3 * dig, 0], mouth: 0.2}} headExtra={<Box size={[0.34, 0.08, 0.34]} position={[0, 0.4, 0]} color="#2f7fd0" />} />
          <Hero position={BUYER} rotation={Math.PI} pose={{armR: [bP, -0.08], elbowR: bE, head: [0.05, 0], mouth: 0.1}} />
          {v >= BUY - 1.25 ? <IceCream position={coneAt(v < BUY ? sHand : bHand)} /> : null}
        </>
      );
    },
  },
  dark: {
    view: (v) => {
      const t0 = S('dark');
      const camA: V3 = [STAND[0] + Math.sin(STAND_YAW) * 3.0 - 0.6, 0.75, STAND[2] + Math.cos(STAND_YAW) * 3.0];
      if (v < t0 + 3.4) return mv(v, t0, t0 + 3.4, camA, [camA[0] + 0.25, 0.85, camA[2] + 0.5], [STAND[0], 1.55, STAND[2]], [STAND[0], 1.6, STAND[2]], [44, 40]);
      // wide: the whole beach in the dark, only the lamps
      return mv(v, t0 + 3.4, E('dark'), [1.0, 10.5, -13], [0.8, 9.2, -12], [0, 0.5, 2], [0, 0.6, 2.5], [56, 54]);
    },
    shakes: [[DARK, 0.5]],
    render: (v) => {
      const on = v < DARK;
      const {pose, hand} = standPose(v);
      const lamps = v >= LAMPS[2] ? 1 : v >= LAMPS[1] ? 0 : v >= LAMPS[0] ? 1 : 0;
      return (
        <>
          {on ? <DaySet v={v} /> : <DarkSet />}
          <Beach t={v} lamps={lamps} />
          <Hero position={STAND} rotation={STAND_YAW} pose={pose} />
          <IceCream position={coneAt(hand)} />
          {!on ? <pointLight position={[STAND[0] + Math.sin(STAND_YAW) * 1.6, 1.9, STAND[2] + Math.cos(STAND_YAW) * 1.6]} color="#9ab0e0" intensity={3.5} distance={4} decay={1.6} /> : null}
        </>
      );
    },
  },
  moon: {
    view: (v) => mv(v, S('moon'), E('moon'), [1.7, ROOF_Y + 1.5, -5.6], [1.4, ROOF_Y + 1.45, -4.8], [-3, ROOF_Y + 6, 30], [-4.5, ROOF_Y + 9, 40], [50, 46]),
    render: (v) => <NightCity v={v} />,
  },
  stars: {
    view: (v) => mv(v, S('stars'), E('stars'), [0.4, 0.9, 12.5], [0.2, 1.1, 11.6], [0, 2.4, 0], [0, 10, -10], [52, 56]),
    render: (v) => (
      <>
        <DarkSet stars={0} />
        <StarField n={5000} size={3.2} seed={1} />
        <StarField n={500} size={6} seed={7} />
        <Beach t={v} lamps={1} people />
      </>
    ),
  },
  jupiter: {
    view: (v) => {
      if (v < EYE) return mv(v, S('jupiter'), EYE, [4.4, 2.3, 2.6], [3.7, 2.15, 2.1], [0, 1.4, 0.35], [0, 1.55, 0.3], [40, 38]);
      return {pos: [0, 0, 0], target: [0, 0, -40], fov: 13, far: 3000};
    },
    render: (v) => {
      if (v < EYE) return <Rooftop />;
      const k = 1 - smooth(ramp(v, JUP_OFF[0], JUP_OFF[1]));
      return (
        <>
          <color attach="background" args={['#000000']} />
          <Stars size={1.8} />
          <JupiterBall k={k} />
        </>
      );
    },
  },
  orbit: {
    view: (v) => {
      const e = earthPos(v);
      const a = earthAngle(v);
      const close: View = {pos: [e[0] + Math.sin(a) * 6 + Math.cos(a) * 3, 2.6, e[2] + Math.cos(a) * 6 - Math.sin(a) * 3], target: [e[0] * 0.35, 0, e[2] * 0.35], fov: 46, far: 3000};
      const far: View = {pos: [12, 105, 78], target: [0, -4, 0], fov: 50, far: 3000};
      const k = smooth(ramp(v, S('orbit') + 4.6, E('orbit') - 0.4));
      return {pos: lerp3(close.pos, far.pos, k), target: lerp3(close.target, far.target, k), fov: lerp(close.fov, far.fov, k), far: 3000};
    },
    render: (v) => {
      const e = earthPos(v);
      return (
        <>
          <color attach="background" args={['#000000']} />
          <hemisphereLight color="#4a5a7a" groundColor="#000" intensity={0.5} />
          <Stars />
          <DeadSun position={[0, 0, 0]} r={8} />
          {/* the orbit, dashed */}
          {Array.from({length: 140}).map((_, i) => {
            const a = (i / 140) * Math.PI * 2;
            return <Box key={i} size={[0.25, 0.05, 0.9]} position={[Math.sin(a) * ORBIT_R, 0, Math.cos(a) * ORBIT_R]} rotation={[0, a + Math.PI / 2, 0]} color="#3a5a8a" emissive="#3a5a8a" emissiveIntensity={0.8} shadow={false} />;
          })}
          <group position={e}>
            <NightEarth r={1.6} hub={[0, 0.3, 1]} out={0} load={0} sun={[0, -1, 0]} />
            <Glow position={[0, 0, 0]} size={5} color="#3a6ab8" k={0.25} />
            <Ico radius={0.35} detail={1} position={[Math.sin(v * 0.3) * 3.2, 0.3, Math.cos(v * 0.3) * 3.2]} color="#4a4a50" />
          </group>
        </>
      );
    },
  },
  grid: {
    view: (v) => {
      const t0 = S('grid');
      const rise = BLACKOUT[0] - 2.4;
      if (v < rise) return mv(v, t0, rise, [1.8, 1.35, 8.0], [1.3, 1.5, 7.0], [-1.4, 2.5, 3.0], [-1.4, 2.7, 3.0], [42, 40]);
      return mv(v, rise, rise + 2.2, [1.3, 1.5, 7.0], [0.5, 6.5, 14], [-1.4, 2.7, 3.0], [0, 14, -70], [40, 46]);
    },
    shakes: BLACKOUT.map((b) => [b, 0.12] as [number, number]),
    render: (v) => (
      <>
        <DarkSet fog={[60, 500]} />
        <Box size={[300, 0.1, 300]} position={[0, -0.05, -40]} color="#3a3c38" />
        {Array.from({length: 20}).map((_, i) => (
          <SolarPanel key={i} position={[-6 + (i % 5) * 3, 0, -1 - Math.floor(i / 5) * 3.2]} />
        ))}
        <PanelDisplay position={[-1.4, 0, 3.0]} />
        {TOWERS.map((t, i) => (
          <Tower key={i} position={t.pos} size={t.size} cols={t.cols} rows={t.rows} seed={i} mode={towerMode(v, t)} />
        ))}
      </>
    ),
  },
  snow: {
    view: (v) => mv(v, S('snow'), E('snow'), [3.0, 2.2, 6.4], [2.2, 1.8, 5.0], [-0.8, 1.0, -2.5], [-0.8, 0.9, -2.5], [46, 44]),
    render: (v) => (
      <>
        <DarkSet fog={[30, 300]} k={1.6} />
        <Beach t={v} snow={1} />
      </>
    ),
  },
  field: {
    view: (v) => mv(v, S('field'), E('field'), [1.0, 1.75, 3.2], [0.8, 1.85, 1.2], [0.2, 1.2, -6], [0.1, 1.3, -8], [44, 42]),
    render: (v) => (
      <>
        <DarkSet fog={[14, 70]} k={1.9} />
        <Box size={[200, 0.1, 200]} position={[0, -0.05, -40]} color="#b8c4ce" />
        {Array.from({length: 150}).map((_, i) => {
          const c = i % 10;
          const r = Math.floor(i / 10);
          return <Sunflower key={i} position={[-4.05 + c * 0.9 + (rnd(i) - 0.5) * 0.2, 0, -0.6 - r * 1.1 + (rnd(i + 7) - 0.5) * 0.3]} droop={1} frost={1} seed={i} />;
        })}
        <Person position={[0.7, 0, -6.2]} rotation={0.3} shirt="#4a4a52" pants="#2c3550" hair="#5a4a3a" pose={{head: [0.45, 0.1], armR: [0.75, -0.1], elbowR: 0.55}} rightHand={<Lantern />} bodyExtra={<Box size={[0.6, 0.4, 0.36]} position={[0, 0.72, 0]} color="#4a4a52" />} headExtra={<Box size={[0.34, 0.1, 0.34]} position={[0, 0.4, 0]} color="#7a2a2a" />} />
      </>
    ),
  },
  airport: {
    view: (v) => {
      const t0 = S('airport');
      const h = QUEUE[HERO_Q].pos;
      const turn = t0 + 2.4;
      if (v < turn) return mv(v, t0, turn, [h[0] + 2.6, 1.9, h[2] + 6.0], [h[0] + 1.9, 1.8, h[2] + 4.8], [h[0], 1.15, h[2]], [h[0], 1.2, h[2]], [40, 38]);
      return mv(v, turn, E('airport'), [h[0] + 1.9, 1.8, h[2] + 4.8], [1.5, 2.4, 9.5], [h[0], 1.2, h[2]], [1.5, 5.0, -9.6], [38, 54]);
    },
    render: () => (
      <>
        <color attach="background" args={['#05070f']} />
        <hemisphereLight color="#f2f4f8" groundColor="#8a8c90" intensity={1.0} />
        <directionalLight position={[10, 20, 15]} color="#ffffff" intensity={0.9} />
        <AirportHall />
        {QUEUE.map((q, i) =>
          i === HERO_Q ? (
            <CoatHero key={i} position={q.pos} rotation={q.yaw} pose={{head: [0.05, -0.2]}} />
          ) : (
            <Guy key={i} position={q.pos} rotation={q.yaw} i={i} coat pose={{armR: [0.05, -0.06], head: [0, (rnd(i) - 0.5) * 0.4]}} rightHand={i % 3 !== 2 ? <Suitcase color={['#c84a3a', '#3a6ac8', '#4a4a52', '#e8b04a'][i % 4]} /> : undefined} />
          ),
        )}
      </>
    ),
  },
  greenhouse: {
    view: (v) => mv(v, S('greenhouse'), E('greenhouse'), [0.3, 2.3, 12.5], [0.1, 2.0, 7.5], [0, 0.8, -6], [0, 0.7, -10], [46, 44]),
    render: (v) => (
      <>
        <color attach="background" args={['#05070f']} />
        <fog attach="fog" args={['#120a14', 18, 60]} />
        <hemisphereLight color="#7a6a9a" groundColor="#2a1a24" intensity={0.55} />
        <Stars />
        <Greenhouse t={v} />
        {[-11.5, -8.5, -5.5, -2.5, 0.5, 3.5].map((z, i) => (
          <Sleeper key={i} position={[0, 0, z]} i={i} />
        ))}
        <Guy position={[-1.0, 0, 5.6]} rotation={-Math.PI / 2} i={4} coat pose={{head: [0.4, 0], armR: [0.7, -0.1], elbowR: 0.5, armL: [0.6, 0.1], elbowL: 0.5}} />
      </>
    ),
  },
  ice: {
    view: (v) => {
      const t0 = S('ice');
      if (v < CRACK + 0.25) return mv(v, t0, CRACK + 0.25, [1.6, 2.4, 9.0], [0.2, 1.2, 1.4], [0, 1.2, -40], [0, 0, 0], [46, 44]);
      // the textbook slice: from the ice down to the bottom
      return mv(v, CRACK + 0.25, E('ice'), [2, 1.0, 23], [1, -10, 29], [0, -2.5, 0], [0, -11, 0], [50, 52]);
    },
    shakes: [[CRACK, 0.6]],
    render: (v) => {
      if (v < CRACK + 0.25) {
        return (
          <>
            <DarkSet fog={[40, 500]} k={1.1} />
            <IceSheet crack={smooth(ramp(v, CRACK - 0.35, CRACK + 0.05))} />
          </>
        );
      }
      const t = v - CRACK;
      return (
        <>
          <color attach="background" args={['#020308']} />
          <hemisphereLight color="#9ab8e0" groundColor="#1a2030" intensity={1.3} />
          <directionalLight position={[6, 20, 18]} color="#c8d8f0" intensity={0.8} />
          <Stars />
          {/* a slice of the frozen ocean, like in a textbook */}
          <Box size={[24, 1.6, 8]} position={[0, -0.8, 0]} color="#d8eaf4" />
          <Box size={[23.9, 0.05, 7.9]} position={[0, 0.03, 0]} color="#eef6fa" />
          <Box size={[24, 18, 8]} position={[0, -10.6, 0]} color="#1f6aa8" opacity={0.42} shadow={false} />
          <Box size={[24, 1.4, 8]} position={[0, -20.3, 0]} color="#3a3a44" />
          {Array.from({length: 9}).map((_, i) => (
            <Ico key={i} radius={0.5 + rnd(i) * 0.8} detail={0} position={[-10 + i * 2.5, -19.5, (rnd(i + 2) - 0.5) * 5]} scale={[1, 0.6, 1]} color="#4a4a56" />
          ))}
          {/* small vents on the bottom with their glow */}
          <group position={[6, -19.6, 0]} scale={0.45}>
            <Smoker position={[0, 0, 0]} t={v} h={4} />
          </group>
          <Pic size={[3.2, 0.9]} res={[400, 112]} k="lbl-ice" draw={(g, W, H) => label(g, W, H, 'ЛЁД', '#2a4a68')} position={[-1.2, -0.8, 4.02]} transparent />
          <Pic size={[6.4, 1.1]} res={[800, 138]} k="lbl-water" draw={(g, W, H) => label(g, W, H, 'ЖИДКАЯ ВОДА', '#ffffff')} position={[0, -6.0, 4.02]} transparent />
          {/* fish */}
          {Array.from({length: 12}).map((_, i) => (
            <group key={`f${i}`} position={[-11 + ((t * (0.8 + rnd(i) * 0.5) + rnd(i + 1) * 22) % 22), -4 - rnd(i + 3) * 13, (rnd(i + 5) - 0.5) * 5]} rotation={[0, Math.PI / 2, 0]}>
              <Box size={[0.14, 0.26, 0.55]} color="#c8dcea" />
              <Box size={[0.04, 0.22, 0.2]} position={[0, 0, -0.36]} color="#a8c4d8" />
            </group>
          ))}
        </>
      );
    },
  },
  vent: {
    view: (v) => {
      const k = smooth(ramp(v, S('vent'), E('vent')));
      const a = lerp(0.35, 1.15, k);
      const r = lerp(7.5, 6.2, k);
      return {pos: [Math.sin(a) * r, lerp(1.6, 2.6, k), Math.cos(a) * r], target: [0, lerp(1.8, 3.4, k), 0], fov: 46, far: 3000};
    },
    render: (v) => (
      <>
        <color attach="background" args={['#040e1a']} />
        <fog attach="fog" args={['#040e1a', 5, 34]} />
        <hemisphereLight color="#3a5a7a" groundColor="#0a0a10" intensity={0.55} />
        <Seabed />
        <Smoker position={[0, 0, 0]} t={v} h={4.6} />
        <Smoker position={[-3.4, 0, -2.6]} t={v + 3} h={2.6} />
        {Array.from({length: 34}).map((_, i) => {
          const a = (i / 34) * Math.PI * 2 + rnd(i) * 0.3;
          const r = 0.95 + rnd(i + 3) * 0.9;
          return <TubeWorm key={i} position={[Math.sin(a) * r, 0, Math.cos(a) * r]} t={v} i={i} />;
        })}
        {Array.from({length: 8}).map((_, i) => {
          const a = (i / 8) * Math.PI * 2 + v * 0.05 * (i % 2 ? 1 : -1);
          const y = 0.8 + (i % 4) * 0.7;
          const rr = 0.72 - y * 0.05;
          return <Shrimp key={i} position={[Math.sin(a) * rr, y, Math.cos(a) * rr]} yaw={a + Math.PI / 2} />;
        })}
      </>
    ),
  },
  icecream: {
    view: (v) => mv(v, S('icecream'), E('icecream'), [2.1, 1.75, 0.7], [1.75, 1.65, 1.25], [0.35, 1.35, 2.75], [0.45, 1.38, 2.75], [42, 40]),
    render: (v) => {
      const {p, e, out} = finalPose(v);
      const yaw = Math.PI / 2;
      const hand = handWorld(GH_HERO, yaw, p, e, 1);
      return (
        <>
          <color attach="background" args={['#05070f']} />
          <fog attach="fog" args={['#120a14', 18, 60]} />
          <hemisphereLight color="#7a6a9a" groundColor="#2a1a24" intensity={0.6} />
          <pointLight position={[1.4, 2.4, 4.4]} color="#ffd8f0" intensity={5} distance={6} decay={1.6} />
          <Stars />
          <Greenhouse t={v} />
          {[6.0, 9.0, 12.0].map((z, i) => (
            <Sleeper key={i} position={[0, 0, z]} i={i + 1} />
          ))}
          {/* a potting table */}
          <group position={[TABLE_X, 0, 3.0]}>
            <Box size={[0.75, 0.05, 1.1]} position={[0, 0.925, 0]} color="#a07850" />
            {[-0.3, 0.3].map((x) => [-0.48, 0.48].map((z) => <Box key={`${x}${z}`} size={[0.05, 0.9, 0.05]} position={[x, 0.45, z]} color="#7a5a3c" />))}
            <Cyl rTop={0.1} rBottom={0.08} height={0.16} position={[0.1, 1.03, -0.3]} color="#b85a3a" />
          </group>
          <CoatHero position={GH_HERO} rotation={yaw} pose={{armR: [p, -0.05], elbowR: e, head: [0.25, -0.1], mouth: 0.05, eyes: 0.9}} />
          {out > 0.02 || v > S('icecream') + 0.9 ? <group position={coneAt(hand)} scale={1.5}>
              <IceCream frozen={1} />
            </group> : null}
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

export {SCENES, EYE};

// ---------------------------------------------------------------- the cover: frozen beach, a dead Sun, the hero with his ice cream

const COVER_HERO: V3 = [0.4, 0, 1.4];
export const coverView: View = {pos: [1.3, 0.75, 5.2], target: [0.2, 2.4, -2.0], fov: 54, far: 3000};
export const CoverScene: React.FC = () => {
  const yaw = 0.5;
  const p = 1.0;
  const e = 1.1;
  const hand = handWorld(COVER_HERO, yaw, p, e, 1);
  return (
    <>
      <CameraRig v={0} view={() => coverView} />
      <DarkSet fog={[40, 500]} k={1.25} />
      <DeadSun position={[-220, 420, -900]} r={70} />
      <Beach t={0} snow={1} />
      <Hero position={COVER_HERO} rotation={yaw} pose={{armR: [p, -0.05], elbowR: e, head: [-0.5, -0.35], eyes: 1.9, mouth: 0.75, armL: [0.25, 0.3], elbowL: 0.5}} />
      <group position={coneAt(hand)} scale={1.6}>
        <IceCream />
      </group>
      <pointLight position={[1.6, 2.4, 3.6]} color="#bcd0ff" intensity={7} distance={9} decay={1.6} />
    </>
  );
};
