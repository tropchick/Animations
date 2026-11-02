import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box, Cyl} from '../scene/parts';
import {Person} from '../scene/Characters';
import {CameraRig, View, handheld} from '../slime/camera';
import {
  BLACKOUT,
  BOMBS,
  ERUPT,
  FLARE,
  FREEZE,
  IMPACT,
  JAW,
  LAUNCH,
  LOAD_100,
  MOON_CRACK,
  NOTIFY,
  PAINT,
  PASS,
  PLAY,
  QUAKE,
  REPAINT,
  SCREEN_OFF,
  SCREEN_ON,
  BATTERY,
  Shot,
  TV_OFF,
  V3,
  WAVE_HIT,
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
import {BILL, Billboard, CityState, CherryPicker, Ground, Houses, Lamps, PARKED, Palms, ParkedCars} from './City';
import {Asteroid, FlareTongue, Glow, Moon, Planet, Rocket, Stars, Sun} from './Space';
import {Burst, Fall, LavaBomb, ShockRing, VOLCANO, Volcano, Wave} from './Disaster';
import {AshGround, Breath, Bunker, Candle, Gamepad, Phone, Room, Screen, Sitting} from './Rooms';
import {CAR_COLORS, Car, Fan, Fire, Smoke, bob, runPose, walkPose} from './props';

// ---------- sky dome ----------

const SKY_V = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const SKY_F = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uLow;
  uniform vec3 uSunDir;
  uniform vec3 uSunCol;
  uniform float uSun;
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    vec3 col = h > 0.12 ? mix(uMid, uTop, smoothstep(0.12, 0.7, h)) : mix(uLow, uMid, smoothstep(-0.05, 0.12, h));
    float s = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
    col += uSunCol * (pow(s, 600.0) * 3.0 + pow(s, 12.0) * 0.5) * uSun;
    gl_FragColor = vec4(col, 1.0);
  }
`;

type SkyCols = {top: string; mid: string; low: string; sunDir?: V3; sun?: number; sunCol?: string};
const SKIES: Record<string, SkyCols> = {
  dusk: {top: '#1b1440', mid: '#8a3a6a', low: '#ff9a52', sunDir: [0.15, 0.03, -1], sun: 1, sunCol: '#ffb070'},
  night: {top: '#03050d', mid: '#0d1630', low: '#1d2c52'},
  fire: {top: '#1a0705', mid: '#5a1a0c', low: '#d0451a'},
  ice: {top: '#8fa6bc', mid: '#c4d3df', low: '#e8eef3'},
  dead: {top: '#2e2b28', mid: '#5a544c', low: '#8a8174'},
};
const C1 = new THREE.Color();
const C2 = new THREE.Color();
const blendSky = (a: SkyCols, b: SkyCols, k: number): SkyCols => {
  const m = (x: string, y: string) => '#' + C1.set(x).lerp(C2.set(y), k).getHexString();
  return {top: m(a.top, b.top), mid: m(a.mid, b.mid), low: m(a.low, b.low), sunDir: a.sunDir ?? b.sunDir, sun: lerp(a.sun ?? 0, b.sun ?? 0, k), sunCol: a.sunCol ?? b.sunCol};
};

const Sky: React.FC<{c: SkyCols}> = ({c}) => {
  const uniforms = useMemo(
    () => ({uTop: {value: new THREE.Color()}, uMid: {value: new THREE.Color()}, uLow: {value: new THREE.Color()}, uSunDir: {value: new THREE.Vector3(0, 0, -1)}, uSunCol: {value: new THREE.Color()}, uSun: {value: 0}}),
    [],
  );
  return (
    <mesh renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[2400, 32, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        uniforms={uniforms}
        uniforms-uTop-value={new THREE.Color(c.top)}
        uniforms-uMid-value={new THREE.Color(c.mid)}
        uniforms-uLow-value={new THREE.Color(c.low)}
        uniforms-uSunDir-value={new THREE.Vector3(...(c.sunDir ?? [0, 0, -1]))}
        uniforms-uSunCol-value={new THREE.Color(c.sunCol ?? '#ffffff')}
        uniforms-uSun-value={c.sun ?? 0}
        vertexShader={SKY_V}
        fragmentShader={SKY_F}
      />
    </mesh>
  );
};

// ---------- camera helpers ----------

const mv = (v: number, t0: number, t1: number, a: V3, b: V3, ta: V3, tb: V3, fov: number | [number, number], far = 3000): View => {
  const k = smooth(ramp(v, t0, t1));
  return {pos: lerp3(a, b, k), target: lerp3(ta, tb, k), fov: typeof fov === 'number' ? fov : lerp(fov[0], fov[1], k), far};
};
const S = (n: Shot) => shotStart(n);
const E = (n: Shot) => shotEnd(n);

// ---------- where things are ----------

const FAN0: V3 = [9.8, 0.14, -6.2];
const FAN_YAW = Math.atan2(BILL[0] - FAN0[0], BILL[2] - FAN0[2]);
const FWD: V3 = [Math.sin(FAN_YAW), 0, Math.cos(FAN_YAW)];

// the roller's x on the billboard (relative to its centre): over 2026, then back and over again for 2027
const rollerX = (v: number) => {
  if (v < REPAINT[0]) return 0.2;
  if (v < REPAINT[1]) return lerp(0.3, 2.7, ramp(v, REPAINT[0], REPAINT[1]));
  if (v < PAINT[0]) return lerp(2.7, 0.3, smooth(ramp(v, REPAINT[1], PAINT[0])));
  if (v < PAINT[1]) return lerp(0.3, 2.7, ramp(v, PAINT[0], PAINT[1]));
  return lerp(2.7, 2.2, smooth(ramp(v, PAINT[1], PAINT[1] + 0.5)));
};

const Worker: React.FC<{v: number}> = ({v}) => {
  const x = rollerX(v);
  const wob = Math.sin(v * 9) * 0.06;
  return (
    <CherryPicker basketX={x - 0.4} st={STATE_DUSK(v)}>
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

// ---------- city states for each part of the story ----------

const ON = () => 1;
const OFF = () => 0;
const NOF = () => 0;

const STATE_DUSK = (v: number): CityState => ({t: v, lightsAt: ON, frostAt: NOF, ash: 0, ruin: 0, wreck: 0});
const blackFront = (v: number) => lerp(-170, 60, ramp(v, BLACKOUT, BLACKOUT + 1.5));
const STATE_BLACKOUT = (v: number): CityState => ({t: v, lightsAt: (x) => (x > blackFront(v) ? 1 : 0), frostAt: NOF, ash: 0, ruin: 0, wreck: 0});
const STATE_NIGHT = (v: number): CityState => ({t: v, lightsAt: OFF, frostAt: NOF, ash: 0, ruin: 0, wreck: 0});
const STATE_WRECK = (v: number, ash = 0): CityState => ({t: v, lightsAt: OFF, frostAt: NOF, ash, ruin: 0, wreck: 1});
const frostFront = (v: number) => lerp(-520, 60, smooth(ramp(v, FREEZE - 0.4, FREEZE + 2.2)));
const STATE_ICE = (v: number): CityState => ({t: v, lightsAt: OFF, frostAt: (z) => clamp01((frostFront(v) - z) / 18), ash: 0.25, ruin: 0, wreck: 1});
const STATE_FROZEN = (v: number): CityState => ({t: v, lightsAt: OFF, frostAt: () => 1, ash: 0, ruin: 0, wreck: 1});
const STATE_RUIN = (v: number): CityState => ({t: v, lightsAt: OFF, frostAt: NOF, ash: 1, ruin: 1, wreck: 1});

// the wave: far out at the start, at the promenade on WAVE_HIT, at the camera at the end of the shot
const waveFront = (v: number) => {
  if (v < WAVE_HIT) return lerp(-190, -9, easeIn(ramp(v, S('wave'), WAVE_HIT)) * 0.4 + ramp(v, S('wave'), WAVE_HIT) * 0.6);
  return lerp(-9, 24, ramp(v, WAVE_HIT, E('wave') - 0.05));
};
const WAVE_CAM_Z = 24;

// the bombs: cars 4 (x 0), 2 (x -16), 3 (x -8)
const BOMB_CARS = [4, 2, 3];
const hitAge = (k: number, v: number) => {
  const i = BOMB_CARS.indexOf(k);
  return i < 0 ? -1 : v - BOMBS[i];
};

// ---------- the scenes ----------

const City: React.FC<{st: CityState; children?: React.ReactNode; palms?: boolean; lamps?: boolean; sparks?: (x: number) => number; sea?: number; seaColor?: string; iceTo?: number; cars?: React.ReactNode}> = ({
  st,
  children,
  palms = true,
  lamps = true,
  sparks,
  sea,
  seaColor,
  iceTo,
  cars,
}) => (
  <>
    <Ground st={st} seaLevel={sea} seaColor={seaColor} iceTo={iceTo} />
    <Houses st={st} />
    {lamps ? <Lamps st={st} sparks={sparks} /> : null}
    {palms ? <Palms st={st} /> : null}
    {cars ?? <ParkedCars st={st} />}
    {children}
  </>
);

const DuskLights: React.FC<{dim?: number}> = ({dim = 1}) => (
  <>
    <hemisphereLight color="#8a6ab0" groundColor="#3a2a3a" intensity={0.9 * dim} />
    <directionalLight position={[40, 30, -200]} color="#ff9a5a" intensity={1.6 * dim} />
    <directionalLight position={[-60, 80, 120]} color="#6a7ad0" intensity={0.5 * dim} />
  </>
);

const NightLights: React.FC<{moonDir?: V3; k?: number}> = ({moonDir = [-0.3, 0.5, -1], k = 1}) => (
  <>
    <hemisphereLight color="#4a5a8a" groundColor="#14182a" intensity={1.1 * k} />
    <directionalLight position={[moonDir[0] * 300, moonDir[1] * 300, moonDir[2] * 300]} color="#b8c8ff" intensity={2.0 * k} />
  </>
);

// ---------- the views and the scenes, shot by shot ----------

const SUN_POS: V3 = [-70, 235, -110];

type Scene = {view: (v: number) => View; render: (v: number) => React.ReactNode; shakes?: [number, number][]; still?: boolean};

const SCENES: Record<Shot, Scene> = {
  bill: {
    view: (v) => mv(v, S('bill'), E('bill'), [12.6, 4.6, -1.8], [11.6, 4.9, -3.6], [6.4, 8.6, -15], [7.0, 8.4, -15], [50, 46]),
    render: (v) => (
      <>
        <Sky c={SKIES.dusk} />
        <fog attach="fog" args={['#c0607a', 120, 1400]} />
        <DuskLights />
        <pointLight position={[6, 9, -11]} color="#ff6aa0" intensity={60} distance={30} decay={1.6} />
        <City st={STATE_DUSK(v)}>
          <Billboard st={STATE_DUSK(v)} cover={ramp(v, REPAINT[0], REPAINT[1])} paint={ramp(v, PAINT[0], PAINT[1])} />
          <Worker v={v} />
          <Fan position={FAN0} rotation={FAN_YAW} pose={{head: [-0.25, 0]}} />
        </City>
      </>
    ),
  },
  fan: {
    view: (v) =>
      mv(
        v,
        S('fan'),
        E('fan'),
        [FAN0[0] + FWD[0] * 3.0 + 0.35, 1.5, FAN0[2] + FWD[2] * 3.0],
        [FAN0[0] + FWD[0] * 2.2 + 0.2, 1.6, FAN0[2] + FWD[2] * 2.2],
        [FAN0[0], 1.95, FAN0[2]],
        [FAN0[0], 2.0, FAN0[2]],
        [44, 40],
      ),
    shakes: [[JAW, 0.6]],
    render: (v) => {
      const j = smooth(ramp(v, JAW, JAW + 0.25));
      return (
        <>
          <Sky c={SKIES.dusk} />
          <fog attach="fog" args={['#c0607a', 120, 1400]} />
          <DuskLights />
          <pointLight position={[6, 8, -12]} color="#ff6aa0" intensity={70} distance={30} decay={1.6} />
          <City st={STATE_DUSK(v)}>
            <Billboard st={STATE_DUSK(v)} cover={1} paint={1} />
            <Fan
              position={FAN0}
              rotation={FAN_YAW}
              pose={{head: [lerp(-0.12, -0.32, j), 0], mouth: j, eyes: 1 + 0.6 * j, armL: [0.5 - 0.25 * j, 0.1], armR: [0.5 - 0.25 * j, -0.1]}}
            />
          </City>
        </>
      );
    },
  },
  sun: {
    view: (v) => {
      const s = new THREE.Vector3(...SUN_POS);
      const w = s.clone().normalize().cross(new THREE.Vector3(0, 1, 0)).normalize();
      const mid = s.clone().multiplyScalar(0.47);
      const k = smooth(ramp(v, S('sun'), E('sun')));
      const D = lerp(380, 345, k);
      const pos = mid.clone().add(w.multiplyScalar(D));
      return {pos: [pos.x, pos.y, pos.z], target: [mid.x, mid.y + lerp(0, 6, k), mid.z], fov: 52, far: 5000};
    },
    shakes: [[FLARE + 0.15, 0.6]],
    render: (v) => {
      const sunPos: V3 = SUN_POS;
      const dir = new THREE.Vector3(...sunPos).normalize();
      const k = ramp(v, FLARE, 8.1);
      const aur = ramp(v, 7.9, 8.3);
      return (
        <>
          <color attach="background" args={['#020306']} />
          <Stars />
          <ambientLight intensity={0.05} />
          <Sun position={sunPos} r={62} t={v} flare={Math.exp(-Math.max(0, v - FLARE) * 3) * (v > FLARE ? 1 : 0)} />
          <FlareTongue from={[sunPos[0] - dir.x * 62, sunPos[1] - dir.y * 62, sunPos[2] - dir.z * 62]} to={[dir.x * 12, dir.y * 12, dir.z * 12]} k={k} t={v} />
          <Planet r={10} sun={sunPos} st={{atmo: 1 + aur * 1.5, atmoColor: aur > 0 ? '#7dff9a' : '#73b8ff', spin: v * 0.04}} />
        </>
      );
    },
  },
  blackout: {
    view: (v) => mv(v, S('blackout'), E('blackout'), [36, 2.6, 4.5], [33, 2.9, 4.8], [-40, 6.5, 6], [-40, 6, 6], [46, 44]),
    shakes: [[BLACKOUT + 1.2, 0.35]],
    render: (v) => {
      const st = STATE_BLACKOUT(v);
      const front = blackFront(v);
      // the sparks at a lamp start when the dark passes it
      const sparks = (x: number) => {
        const t = BLACKOUT + ((x + 170) / 230) * 1.5;
        const a = v - t;
        return a >= 0 && a < 0.45 ? 1 - a / 0.45 : 0;
      };
      const dark = clamp01((front - 20) / 40);
      // two cars drive towards the camera and roll to a stop in the dark
      const carX = (x0: number, sp: number) => {
        const tPass = BLACKOUT + ((x0 + sp * (v - S('blackout')) + 170) / 230) * 1.5;
        const tt = v - S('blackout');
        const tStop = Math.max(0, tPass - S('blackout'));
        if (tt < tStop) return x0 + sp * tt;
        const d = Math.min(tt - tStop, 1.2);
        return x0 + sp * tStop + sp * (d - (d * d) / 2.4);
      };
      return (
        <>
          <Sky c={blendSky(SKIES.dusk, SKIES.night, dark * 0.6)} />
          <fog attach="fog" args={['#5a3a6a', 100, 1200]} />
          <DuskLights dim={1 - 0.55 * dark} />
          <City
            st={st}
            sparks={sparks}
            cars={
              <>
                <ParkedCars st={st} />
                <Car position={[carX(-30, 9), 0.02, -1.2]} rotation={0} color="#f5d77a" />
                <Car position={[carX(-55, 11), 0.02, 2.4]} rotation={0} color="#7fd3c8" />
              </>
            }
          >
            <Billboard st={st} cover={1} paint={1} lit={BILL[0] > front ? 1 : 0} />
          </City>
        </>
      );
    },
  },
  tv: {
    view: (v) => mv(v, S('tv'), E('tv'), [2.75, 1.4, 1.5], [2.55, 1.3, 1.0], [1.45, 0.85, -2.4], [1.5, 0.88, -2.4], [48, 44]),
    render: (v) => {
      const on = v < TV_OFF ? 1 : clamp01(1 - (v - TV_OFF) / 0.25);
      const lit = v < TV_OFF - 0.05 ? 1 : 0;
      return (
        <>
          <color attach="background" args={['#000']} />
          <ambientLight intensity={0.05 + 0.25 * lit} color="#ffd8b0" />
          {lit ? <pointLight position={[-1.2, 2.2, 0.5]} color="#ffcf90" intensity={6} distance={9} decay={2} /> : null}
          {on > 0 ? <pointLight position={[1.6, 0.9, -2.0]} color="#a8b8ff" intensity={4 * on} distance={5} decay={2} /> : null}
          <pointLight position={[0, 1.8, -5]} color="#5a4a8a" intensity={lit ? 3 : 1.2} distance={8} decay={2} />
          <Room outside={lit ? '#3a2a5a' : '#120f1c'} outsideLit={lit} />
          <Screen position={[1.6, 0.92, -2.33]} w={1.3} h={0.74} pct={99} play={0} pulse={0} on={on} />
          <Sitting position={[1.6, 0, 0.55]} rotation={Math.PI} seat={0.45} box="none" pose={{armL: [0.6, 0.1], armR: [0.6, -0.1], elbowL: 0.6, elbowR: 0.6}} />
          <Box size={[0.4, 0.12, 0.3]} position={[1.0, 0.5, 0.55]} color="#f2f2f4" />
        </>
      );
    },
  },
  moon: {
    view: (v) => mv(v, S('moon'), E('moon'), [-3, 3, -72], [-3.2, 2.9, -74], [-40, 100, -470], [-46, 114, -470], [52, 54], 5000),
    shakes: [[MOON_CRACK + 0.2, 0.4]],
    render: (v) => {
      const k = smooth(ramp(v, S('moon'), E('moon')));
      const dir = new THREE.Vector3(-0.1, 0.36, -1).normalize();
      const dist = lerp(1700, 900, k);
      const pos: V3 = [-3 + dir.x * dist, 3 + dir.y * dist, -72 + dir.z * dist];
      const crack = ramp(v, MOON_CRACK, MOON_CRACK + 0.7);
      return (
        <>
          <Sky c={SKIES.night} />
          <Stars />
          <fog attach="fog" args={['#0d1630', 200, 2500]} />
          <NightLights moonDir={[0.3, 0.9, 0.6]} k={0.5 + crack * 0.3} />
          <Moon position={pos} r={lerp(90, 210, k)} sun={[0.4, -0.1, 1]} crack={crack} chunks={ramp(v, MOON_CRACK + 0.4, E('moon')) * 0.6} t={v} />
          <Glow position={pos} size={lerp(90, 210, k) * 3.2} color="#ffb070" k={crack * 0.5} />
          <City st={STATE_NIGHT(v)} sea={lerp(-0.6, 0.35, smooth(ramp(v, MOON_CRACK + 0.3, E('moon'))))} seaColor="#1a3a5a">
            <Billboard st={STATE_NIGHT(v)} cover={1} paint={1} lit={0} />
          </City>
        </>
      );
    },
  },
  wave: {
    view: (v) => mv(v, S('wave'), E('wave'), [2.6, 2.2, WAVE_CAM_Z], [2.4, 2.0, WAVE_CAM_Z + 0.6], [-1, 7, -40], [-1, 11, -30], [52, 56]),
    shakes: [[WAVE_HIT, 0.8], [WAVE_HIT + 0.9, 0.6]],
    render: (v) => {
      const front = waveFront(v);
      const st = STATE_NIGHT(v);
      const moonDir = new THREE.Vector3(-0.25, 0.42, -1).normalize();
      return (
        <>
          <Sky c={SKIES.night} />
          <Stars />
          <fog attach="fog" args={['#0d1630', 150, 2000]} />
          <NightLights moonDir={[moonDir.x, moonDir.y, moonDir.z]} k={1.2} />
          <directionalLight position={[40, 80, 200]} color="#9ab8e8" intensity={1.8} />
          <Moon position={[moonDir.x * 1000, moonDir.y * 1000, moonDir.z * 1000]} r={230} sun={[0.4, -0.1, 1]} crack={1} chunks={0.4} t={v} />
          <Ground st={st} seaLevel={-0.6} seaColor="#1a3a5a" />
          <Houses st={st} />
          <Lamps st={st} />
          <Palms st={st} bendFrom={(x, z) => (front > z - 3 ? -1.2 : 0)} />
          {PARKED.map((c, k) => {
            const hit = front > c.z - 3;
            const carried = hit ? Math.min(30, front - c.z + 2) : 0;
            return <Car key={k} position={[c.x, 0.02 + carried * 0.25, c.z + carried * 0.7]} color={c.color} tumble={hit ? [carried * 0.1, k, carried * 0.08] : undefined} />;
          })}
          <Billboard st={st} cover={1} paint={1} lit={0} tilt={front > BILL[2] - 2 ? Math.min(1.35, (front - BILL[2] + 2) * 0.12) : 0} />
          <Wave front={front} t={v} color="#2a7d9e" />
          {/* the sea behind the wave is high */}
          <Box size={[6000, 12, 3000]} position={[0, 4, front - 90 - 1500]} color="#2a7d9e" shadow={false} />
        </>
      );
    },
  },
  run: {
    view: (v) => {
      const z = runZ(v);
      return {pos: [1.0, 0.95, z + 4.6], target: [-0.1, 7.5, z - 8], fov: 70, far: 3000};
    },
    render: (v) => {
      const z = runZ(v);
      const t = v - S('run');
      const st = STATE_NIGHT(v);
      const moonDir = new THREE.Vector3(-0.25, 0.42, -1).normalize();
      return (
        <>
          <Sky c={SKIES.night} />
          <Stars />
          <fog attach="fog" args={['#0d1630', 150, 2000]} />
          <NightLights moonDir={[moonDir.x, moonDir.y, moonDir.z]} k={1.2} />
          <directionalLight position={[40, 80, 200]} color="#9ab8e8" intensity={1.8} />
          <Moon position={[moonDir.x * 1000, moonDir.y * 1000, moonDir.z * 1000]} r={230} sun={[0.4, -0.1, 1]} crack={1} chunks={0.4} t={v} />
          <Ground st={st} />
          <Houses st={st} />
          <Fan position={[0, 0.02 + bob(t, 1, 2.6), z]} rotation={0} pose={{...runPose(t), head: [0.1, 0], mouth: 0.6, eyes: 1.4}} box="overhead" />
          <Wave front={z - 17} t={v} color="#2a7d9e" />
          <Car position={[3, 9, z - 15]} color="#f2a7c3" tumble={[t * 2, 0.6, t * 1.4]} />
          <Box size={[6000, 12, 3000]} position={[0, 4, z - 17 - 90 - 1500]} color="#2a7d9e" shadow={false} />
        </>
      );
    },
  },
  volcano: {
    view: (v) => mv(v, S('volcano'), E('volcano'), [-4, 3.2, -18], [-5, 3.6, -20], [-120, 140, -900], [-125, 200, -900], [46, 60], 5000),
    shakes: [[ERUPT + 0.1, 0.5], [ERUPT + 2.55, 1.0]],
    render: (v) => {
      const e = v - ERUPT;
      const red = smooth(ramp(v, ERUPT, ERUPT + 1.6));
      const flash = e > 0 ? Math.exp(-e * 2.5) : 0;
      const st = STATE_WRECK(v);
      return (
        <>
          <Sky c={blendSky(SKIES.night, SKIES.fire, red)} />
          <Stars opacity={1 - red} />
          <fog attach="fog" args={[red > 0.5 ? '#5a1a0c' : '#0d1630', 300, 4000]} />
          <NightLights moonDir={[0.3, 0.8, 0.6]} k={1 - 0.6 * red} />
          <hemisphereLight color="#ff6a2a" groundColor="#200805" intensity={1.4 * red} />
          <pointLight position={[VOLCANO[0], 400, VOLCANO[2] + 200]} color="#ff7a2a" intensity={(2 + 8 * flash) * (e > 0 ? 1 : 0.1) * 2500} distance={3000} decay={1.6} />
          <Volcano erupt={e} t={v} />
          <ShockRing center={[VOLCANO[0], -0.6, VOLCANO[2]]} r={Math.max(0, e) * 340} opacity={e > 0 ? 0.7 * clamp01(1 - e / 1.8) : 0} />
          <City st={st}>
            <Billboard st={st} cover={1} paint={1} lit={0} tilt={1.3} />
            <Car position={[-9, 0.15, -11]} color="#7fd3c8" tumble={[0.4, 1.2, 2.6]} />
          </City>
        </>
      );
    },
  },
  bombs: {
    view: (v) => mv(v, S('bombs'), E('bombs'), [8.5, 1.7, 10.6], [7.2, 1.8, 10.3], [-22, 3.2, 3.5], [-22, 3.6, 3.5], [50, 46]),
    shakes: BOMBS.map((b, i) => [b, i === 0 ? 1.2 : 0.6] as [number, number]),
    render: (v) => {
      const st = STATE_WRECK(v, 0.35);
      return (
        <>
          <Sky c={SKIES.fire} />
          <fog attach="fog" args={['#3a120a', 30, 400]} />
          <hemisphereLight color="#ff6a2a" groundColor="#200805" intensity={1.1} />
          <directionalLight position={[-100, 60, -200]} color="#ff7a3a" intensity={1.2} />
          <City
            st={st}
            cars={
              <ParkedCars
                st={{...st, wreck: 0}}
                crush={(k) => (hitAge(k, v) >= 0 ? clamp01(hitAge(k, v) / 0.12) : 0)}
                burnt={(k) => (hitAge(k, v) >= 0 ? 1 : 0)}
              />
            }
          >
            <Billboard st={st} cover={1} paint={1} lit={0} tilt={1.3} />
            {BOMB_CARS.map((k, i) => {
              const c = PARKED[k];
              const to: V3 = [c.x, 1.2, c.z];
              const from: V3 = [c.x + 16, 60, c.z - 22];
              const age = v - BOMBS[i];
              return (
                <group key={k}>
                  <LavaBomb from={from} to={to} k={1 + age / 0.75} />
                  {age >= 0 ? (
                    <>
                      <Fire position={[c.x, 0.9, c.z]} t={v} size={1.3 * clamp01(age / 0.3)} seed={k} />
                      <Smoke origin={[c.x, 2, c.z]} t={v} seed={k * 10} size={1.2} />
                      <Burst at={[c.x, 1.2, c.z]} age={age} seed={k * 30} />
                      <pointLight position={[c.x, 2.5, c.z]} color="#ff7a2a" intensity={(18 + 60 * Math.exp(-age * 5)) * clamp01(age * 10)} distance={25} decay={2} />
                    </>
                  ) : null}
                </group>
              );
            })}
          </City>
          <Fall center={[-5, 10, 6]} t={v} color="#5a5450" size={0.12} box={[50, 24, 30]} speed={1.2} wind={1.5} />
        </>
      );
    },
  },
  mask: {
    view: (v) => {
      const x = maskX(v);
      return {pos: [x + 3.2, 1.72, 3.6], target: [x - 0.8, 1.55, 1.7], fov: 42, far: 3000};
    },
    render: (v) => {
      const x = maskX(v);
      const t = v - S('mask');
      const st = STATE_WRECK(v, 0.45);
      return (
        <>
          <Sky c={SKIES.fire} />
          <fog attach="fog" args={['#3a120a', 20, 300]} />
          <hemisphereLight color="#ff6a2a" groundColor="#200805" intensity={1.0} />
          <directionalLight position={[-100, 60, -200]} color="#ff7a3a" intensity={1.0} />
          <City st={st} cars={<ParkedCars st={{...st, wreck: 0}} crush={(k) => (BOMB_CARS.includes(k) ? 1 : 0)} burnt={(k) => (BOMB_CARS.includes(k) ? 1 : 0.3)} />}>
            {BOMB_CARS.map((k) => (
              <group key={k}>
                <Fire position={[PARKED[k].x, 0.9, PARKED[k].z]} t={v} size={1.1} seed={k} />
                <Smoke origin={[PARKED[k].x, 2, PARKED[k].z]} t={v} seed={k * 10} size={1.2} />
                <pointLight position={[PARKED[k].x, 2.5, PARKED[k].z]} color="#ff7a2a" intensity={20} distance={20} decay={2} />
              </group>
            ))}
            <Fan position={[x, 0.02 + bob(t, 1, 1.5), 1.7]} rotation={Math.PI / 2} pose={{...walkPose(t, 1, 1.5), head: [0.05, 0]}} look={{hood: true, mask: true}} box="chest" />
          </City>
          <Fall center={[x, 6, 2]} t={v} color="#6a6460" size={0.06} box={[20, 12, 14]} speed={1.0} wind={1.2} n={1200} />
        </>
      );
    },
  },
  ice: {
    view: (v) => mv(v, S('ice'), E('ice'), [4.2, 3.3, 9.6], [3.4, 3.6, 8.6], [-8, 4, -40], [-8, 5, -40], [50, 48]),
    shakes: [[FREEZE + 0.6, 0.3]],
    render: (v) => {
      const st = STATE_ICE(v);
      const pale = smooth(ramp(v, S('ice'), FREEZE + 0.8));
      return (
        <>
          <Sky c={blendSky(SKIES.fire, SKIES.ice, pale)} />
          <fog attach="fog" args={[pale > 0.5 ? '#d8e2ea' : '#3a120a', 60, 900]} />
          <hemisphereLight color={pale > 0.5 ? '#dfe8f0' : '#ff6a2a'} groundColor="#8a96a0" intensity={0.6 + 0.8 * pale} />
          <directionalLight position={[60, 120, -100]} color="#e8f0ff" intensity={0.4 + 1.0 * pale} />
          <City st={st} iceTo={frostFront(v)} cars={<ParkedCars st={st} crush={(k) => (BOMB_CARS.includes(k) ? 1 : 0)} burnt={(k) => (BOMB_CARS.includes(k) ? 1 : 0.3)} />}>
            <Billboard st={st} cover={1} paint={1} lit={0} tilt={1.3} />
          </City>
          <Fall center={[0, 8, -6]} t={v} color="#f4f8fb" size={0.14} box={[40, 20, 40]} speed={2.4 * pale} wind={3} opacity={0.9 * pale} n={1400} />
        </>
      );
    },
  },
  candle: {
    view: (v) => mv(v, S('candle'), E('candle'), [0.95, 1.3, 1.3], [0.75, 1.2, 0.9], [-0.05, 0.75, -1.8], [-0.05, 0.8, -1.8], [50, 46]),
    render: (v) => (
      <>
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.12} color="#9ab8e0" />
        <pointLight position={[0, 1.8, -4.5]} color="#cfe0f0" intensity={4} distance={8} decay={2} />
        <Room outside="#c8d8e6" outsideLit={0} frost={1} />
        <Sitting position={[0, 0, -1.7]} rotation={0} seat={0.12} box="lap" look={{blanket: true, hood: true, frost: 0.3}} pose={{head: [0.25, 0]}} />
        <Candle position={[0, 0, -0.95]} t={v} />
        <Breath position={[0, 0.92, -1.45]} t={v - S('candle')} />
        <Fall center={[0, 1.8, -6.5]} t={v} color="#ffffff" size={0.05} box={[10, 6, 2]} speed={2} wind={4} n={500} />
      </>
    ),
  },
  asteroid: {
    view: (v) => mv(v, S('asteroid'), E('asteroid'), [-4, -6, 44], [-2, -4.5, 38], [18, 8, -30], [19, 8, -30], [42, 38], 5000),
    render: (v) => {
      const sun: V3 = [1, 0.35, 0.6];
      const moon: V3 = [26, 14, -44];
      const k = smooth(ramp(v, 34.3, E('asteroid') + 0.3));
      const from: V3 = [moon[0] + 3, moon[1] + 2.5, moon[2] - 14];
      const to: V3 = [22, 9, -16];
      return (
        <>
          <color attach="background" args={['#020306']} />
          <Stars />
          <ambientLight intensity={0.06} />
          <directionalLight position={[sun[0] * 200, sun[1] * 200, sun[2] * 200]} intensity={2.4} color="#fff6e6" />
          <Planet r={10} sun={sun} st={{ice: 1, spin: v * 0.03}} />
          <Moon position={moon} r={5} sun={sun} crack={1} chunks={1} t={v} />
          <Asteroid position={lerp3(from, to, k)} r={3.4} spin={v * 0.4} />
        </>
      );
    },
  },
  rocket: {
    view: (v) => {
      const y = rocketY(v);
      return mv(v, S('rocket'), E('rocket'), [6, 2.2, -12], [5, 2.0, -13], [-30, 10 + y * 0.6, -150], [-30, 18 + y * 0.9, -150], [48, 52]);
    },
    shakes: [[LAUNCH, 0.5], [LAUNCH + 0.5, 0.4]],
    render: (v) => {
      const st = STATE_FROZEN(v);
      const y = rocketY(v);
      const ign = ramp(v, LAUNCH, LAUNCH + 0.3);
      return (
        <>
          <Sky c={SKIES.ice} />
          <fog attach="fog" args={['#d8e2ea', 80, 1500]} />
          <hemisphereLight color="#dfe8f0" groundColor="#8a96a0" intensity={1.3} />
          <directionalLight position={[60, 120, -100]} color="#e8f0ff" intensity={1.2} />
          <City st={st} iceTo={0} cars={<ParkedCars st={st} crush={(k) => (BOMB_CARS.includes(k) ? 1 : 0)} burnt={(k) => (BOMB_CARS.includes(k) ? 1 : 0.3)} />}>
            <Billboard st={st} cover={1} paint={1} lit={0} tilt={1.3} />
          </City>
          {/* launch pad on the frozen sea */}
          <Box size={[16, 2, 16]} position={[-30, 0.4, -150]} color="#8a8f96" />
          <Box size={[1.6, 34, 1.6]} position={[-22, 17, -150]} color="#b0403a" />
          <Rocket position={[-30, 1.6 + y, -150]} scale={4} flame={ign} t={v} />
          {ign > 0 ? <pointLight position={[-30, 2 + y, -146]} color="#ffb04a" intensity={8000 * ign} distance={300} decay={1.8} /> : null}
          {ign > 0 ? <Smoke origin={[-30, 1, -150]} t={v} seed={70} n={14} rise={3} size={6} color="#eef2f4" opacity={0.9} /> : null}
          {Array.from({length: 10}).map((_, i) => {
            const yy = (i / 10) * y;
            return y > 4 ? <Box key={i} size={[3 + i * 0.2, 3, 3 + i * 0.2]} position={[-30, 2 + yy, -150]} rotation={[i, i * 2, 0]} color="#f2f5f7" /> : null;
          })}
          <Fall center={[0, 8, -6]} t={v} color="#f4f8fb" size={0.14} box={[40, 20, 40]} speed={2.4} wind={3} n={1200} />
        </>
      );
    },
  },
  miss: {
    view: (v) => {
      const p = rocketSpace(v);
      if (v < PASS - 0.25) return {pos: [p[0] - 1.2, p[1] + 1.0, p[2] + 11], target: [0.5, 0.5, -26], fov: 50, far: 5000};
      const hold = rocketSpace(PASS - 0.25);
      return {pos: [hold[0] - 1.2, hold[1] + 1.0, hold[2] + 11], target: lerp3([0.5, 0.5, -26], [p[0], p[1], p[2]], smooth(ramp(v, PASS - 0.25, PASS + 0.6))), fov: 50, far: 5000};
    },
    render: (v) => {
      const p = rocketSpace(v);
      const sun: V3 = [1, 0.35, 0.6];
      return (
        <>
          <color attach="background" args={['#020306']} />
          <Stars />
          <ambientLight intensity={0.08} />
          <directionalLight position={[sun[0] * 200, sun[1] * 200, sun[2] * 200]} intensity={2.4} color="#fff6e6" />
          <Asteroid position={[-5, 0, -26]} r={7} spin={v * 0.4} />
          <Rocket position={p} rotation={[-Math.PI / 2 + 0.05, 0, 0.06]} scale={0.9} flame={1} t={v} />
          <Planet position={[60, -40, -500]} r={40} sun={sun} st={{ice: 1}} />
        </>
      );
    },
  },
  bunker: {
    view: (v) => mv(v, S('bunker'), E('bunker'), [0.85, 1.6, 1.6], [0.6, 1.45, 1.1], [0, 0.85, -1.95], [0.05, 0.88, -1.95], [50, 44]),
    shakes: [[QUAKE, 0.6]],
    render: (v) => {
      const shake = ramp(v, QUAKE - 0.2, QUAKE + 0.4);
      const pct = v < LOAD_100 ? 99 : 100;
      const play = ramp(v, PLAY - 0.15, PLAY + 0.15);
      return (
        <>
          <color attach="background" args={['#000']} />
          <ambientLight intensity={0.15} />
          <Bunker shake={shake} t={v} swing={shake * 0.25 * Math.sin(v * 7)} />
          <Screen position={[0, 0.88, -1.86]} w={1.0} h={0.56} pct={pct} play={play} pulse={0.5 + 0.5 * Math.sin(v * 6)} on={1} />
          <pointLight position={[0, 0.9, -1.4]} color={play > 0.5 ? '#ff7aa0' : '#a8b8ff'} intensity={3} distance={4} decay={2} />
          <Box size={[0.5, 0.5, 0.5]} position={[0, 0.25, 0.4]} color="#7a5a3a" />
          <Sitting position={[0, 0, 0.35]} rotation={Math.PI} seat={0.5} box="none" look={{beard: true}} pose={{armL: [0.75, 0.15], armR: [0.75, -0.15], elbowL: 0.7, elbowR: 0.7}} />
        </>
      );
    },
  },
  reach: {
    view: (v) => mv(v, S('reach'), E('reach'), [0.1, 1.25, 0.35], [0.08, 1.2, 0.25], [0.02, 0.84, -0.95], [0.02, 0.85, -0.95], [40, 36]),
    shakes: [[S('reach'), 0.3], [S('reach') + 0.7, 0.4], [S('reach') + 1.4, 0.5]],
    render: (v) => {
      const press = smooth(ramp(v, S('reach') + 0.2, E('reach') - 0.1));
      const skin = '#efd2b3';
      return (
        <>
          <color attach="background" args={['#000']} />
          <ambientLight intensity={0.15} />
          <Bunker shake={1} t={v} swing={0.25 * Math.sin(v * 7)} />
          <Screen position={[0, 0.88, -1.86]} w={1.0} h={0.56} pct={100} play={1} pulse={0.5 + 0.5 * Math.sin(v * 6)} on={1} />
          <pointLight position={[0, 0.95, -0.6]} color="#ff9ab8" intensity={1.6} distance={3} decay={2} />
          <pointLight position={[0.2, 1.3, 0.3]} color="#ffd8a0" intensity={0.6} distance={2} decay={2} />
          <group position={[0, 0.95, -0.12]} rotation={[0.35, 0, 0]}>
            <Gamepad press={press > 0.98 ? 1 : 0} />
            {/* hands round the grips, left thumb on the stick, right thumb coming down on the button */}
            <Box size={[0.06, 0.045, 0.1]} position={[-0.085, -0.03, 0.06]} rotation={[0, 0.3, 0]} color={skin} />
            <Box size={[0.06, 0.045, 0.1]} position={[0.085, -0.03, 0.06]} rotation={[0, -0.3, 0]} color={skin} />
            <Box size={[0.018, 0.016, 0.05]} position={[-0.03, 0.036, 0.04]} rotation={[0, 0.5, 0]} color={skin} />
            <Box size={[0.02, 0.018, 0.055]} position={[0.05, lerp(0.065, 0.032, press), lerp(0.04, 0.02, press)]} rotation={[lerp(-0.5, -0.1, press), -0.5, 0]} color={skin} />
            <Box size={[0.03, 0.04, 0.05]} position={[-0.095, 0.0, 0.1]} color="#2aa79b" />
            <Box size={[0.03, 0.04, 0.05]} position={[0.095, 0.0, 0.1]} color="#2aa79b" />
          </group>
        </>
      );
    },
  },
  impact: {
    view: (v) => mv(v, S('impact'), E('impact'), [3, 5, 40], [2, 4.5, 33], [1.5, 2.5, 0], [1.5, 2.5, 0], [42, 40], 5000),
    shakes: [[IMPACT, 1.4], [IMPACT + 0.4, 1.0]],
    render: (v) => {
      const sun: V3 = [1, 0.45, 0.75];
      const hit = new THREE.Vector3(0.42, 0.55, 0.72).normalize();
      const H: V3 = [hit.x * 10, hit.y * 10, hit.z * 10];
      const from: V3 = [H[0] + 30, H[1] + 24, H[2] + 6];
      const k = ramp(v, S('impact'), IMPACT);
      const e = v - IMPACT;
      const shock = e > 0 ? easeOut(e / 2.4) * Math.PI * 0.95 : 0;
      return (
        <>
          <color attach="background" args={['#020306']} />
          <Stars />
          <ambientLight intensity={0.06} />
          <Planet
            r={10}
            sun={sun}
            st={{ice: 1, hit: H, shock, burn: ramp(v, IMPACT + 0.8, 51.9), dead: ramp(v, 51.0, 52.0), atmo: e > 0 ? Math.max(0, 1.6 - e * 0.6) : 1, atmoColor: e > 0 ? '#ff8a3a' : '#73b8ff'}}
          />
          {e < 0 ? <Asteroid position={lerp3(from, H, k * k * (3 - 2 * k) * 0.3 + k * 0.7)} r={1.6} spin={v} heat={k} /> : null}
          {e >= 0 ? <Glow position={[H[0] * 1.05, H[1] * 1.05, H[2] * 1.05]} size={lerp(4, 40, clamp01(e / 1.2))} color="#ffd8a0" k={Math.max(0, 1.6 - e * 0.7)} /> : null}
          {e >= 0
            ? Array.from({length: 40}).map((_, i) => {
                const d = new THREE.Vector3(rnd(i + 1) - 0.5, rnd(i + 2) - 0.5, rnd(i + 3) - 0.5).normalize().add(hit.clone().multiplyScalar(1.4)).normalize();
                const sp = 4 + rnd(i + 4) * 9;
                const p: V3 = [H[0] + d.x * sp * e, H[1] + d.y * sp * e, H[2] + d.z * sp * e];
                return (
                  <mesh key={i} position={p}>
                    <icosahedronGeometry args={[0.15 + rnd(i + 5) * 0.3, 0]} />
                    <meshStandardMaterial color="#ffb04a" emissive="#ff5a1a" emissiveIntensity={2 * Math.max(0, 1 - e / 2.5)} flatShading />
                  </mesh>
                );
              })
            : null}
          <directionalLight position={[sun[0] * 200, sun[1] * 200, sun[2] * 200]} intensity={2.2} color="#fff6e6" />
        </>
      );
    },
  },
  ruins: {
    view: (v) => mv(v, S('ruins'), E('ruins'), [-2.5, 2.6, 7], [4.2, 2.0, -4.5], [5, 5.2, -15], [6.3, 6.6, -15], [48, 44]),
    render: (v) => {
      const st = STATE_RUIN(v);
      return (
        <>
          <Sky c={SKIES.dead} />
          <fog attach="fog" args={['#6a6258', 20, 260]} />
          <hemisphereLight color="#c0b8a8" groundColor="#4a4642" intensity={1.7} />
          <directionalLight position={[40, 80, 60]} color="#d8ccb8" intensity={1.3} />
          <City st={st} lamps={false} cars={<ParkedCars st={st} crush={() => 0.8} burnt={() => 1} />}>
            <Billboard st={st} cover={1} paint={1} lit={0} tilt={0.32} sink={2.2} />
            {/* ash dunes */}
            {Array.from({length: 26}).map((_, i) => (
              <mesh key={i} position={[(rnd(i + 1) - 0.5) * 120, -0.2, -30 + rnd(i + 2) * 50]} scale={[6 + rnd(i + 3) * 10, 1 + rnd(i + 4) * 2.2, 4 + rnd(i + 5) * 8]}>
                <icosahedronGeometry args={[1, 1]} />
                <meshStandardMaterial color={rnd(i) > 0.5 ? '#77726b' : '#6a655f'} roughness={1} flatShading />
              </mesh>
            ))}
          </City>
          <Fall center={[3, 4, -6]} t={v} color="#8a847c" size={0.07} box={[30, 10, 30]} speed={0.4} wind={4} n={900} />
        </>
      );
    },
  },
  phone: {
    view: (v) => mv(v, S('phone'), E('phone'), [0.012, 0.3, 0.05], [0.004, 0.235, 0.028], [0, 0, 0.004], [0, 0, 0.002], 40, 50),
    render: (v) => {
      const on = v < SCREEN_ON ? 0 : v < SCREEN_OFF ? clamp01((v - SCREEN_ON) / 0.15) : clamp01(1 - (v - SCREEN_OFF) / 0.12);
      const note = smooth(ramp(v, NOTIFY, NOTIFY + 0.35));
      const blink = v > BATTERY[0] && v < BATTERY[1] && Math.floor((v - BATTERY[0]) / 0.15) % 2 === 0;
      return (
        <>
          <color attach="background" args={['#5a554e']} />
          <fog attach="fog" args={['#5a554e', 0.5, 4]} />
          <hemisphereLight color="#b0a898" groundColor="#3a3632" intensity={0.7} />
          <directionalLight position={[2, 4, 1]} color="#c8bca8" intensity={0.5} />
          <AshGround />
          <group rotation={[0, 0.12, 0]}>
            <Phone on={on} note={note} battery={blink} />
          </group>
          <Fall center={[0, 0.1, 0]} t={v} color="#8a847c" size={0.003} box={[0.4, 0.25, 0.4]} speed={0.03} wind={0.06} n={160} />
        </>
      );
    },
  },
};

// the run along the cross street
function runZ(v: number) {
  return 30 + (v - S('run')) * 5.2;
}
// the walk through the ash
function maskX(v: number) {
  return -12.6 + (v - S('mask')) * 1.45;
}
// the rocket climbing off the ice
function rocketY(v: number) {
  const t = Math.max(0, v - (LAUNCH + 0.4));
  return 0.5 * 60 * t * t;
}
// the rocket in space: flies at the asteroid... and past it
function rocketSpace(v: number): V3 {
  const t = v - S('miss');
  const tp = PASS - S('miss');
  const z = 30 - (t / tp) * 30 * 1.0 - Math.max(0, t - tp) * 34;
  return [3.6 + t * 0.2, 1.5 + t * 0.1, z - 26];
}

export const viewAt = (v: number): View => {
  const s = shotAt(v);
  const sc = SCENES[s.name];
  const view = sc.view(v);
  const hv = handheld(view, v, sc.shakes ?? []);
  // for far targets the shake would move the camera metres (even under the ground):
  // move the target instead, which gives the same angular shake with the camera in place
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

export {SCENES, FAN0, FAN_YAW};
export type {SkyCols};
export {Sky, SKIES, DuskLights};
export const coverView: View = {pos: [13.2, 1.1, 1.0], target: [6.6, 10.4, -15], fov: 58, far: 5000};
export {Worker};
