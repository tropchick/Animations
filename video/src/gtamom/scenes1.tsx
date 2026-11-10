import React from 'react';
import {Scene, ease, ease5, mv} from '../bear/common';
import {Phone, PhoneScreen, Pic} from '../bear/Props';
import {InteriorLights} from '../cs2/scenes1';
import {drawTiles} from '../diet/Sets';
import {Stars} from '../gta/Space';
import {roundRect} from '../gta/tex';
import {Mom, ROUNDF, ToyEarth} from '../nolan/Sets';
import {SpaceLights, bounce} from '../nolan/scenes1';
import type {View} from '../slime/camera';
import {CLOUD_HIT, DL, FLASH, FUSE, INTO_CLOUD, LAND_BOX, LAND_MOM, NET_OFF, PRESS, SIT, THUNDER, V3, WIFI_OFF, lerp, ramp, rnd, shotEnd, shotStart} from './cues';
import {Ball, Block, Bolt, CityLights, Cloud, Cyl, FuseBox, GameBox, Glow, Laptop, MomArm, RBox, Router, Tower, Washer, lightsOn} from './Sets';

const S = shotStart;
const E = shotEnd;

// ballistic fall: 0 before t0, then height drops from h to 0 at t1
const drop = (v: number, t0: number, t1: number, h: number) => (v >= t1 ? 0 : v <= t0 ? h : h * (1 - ((v - t0) / (t1 - t0)) ** 2));

// an arm that reaches from `from` towards `to` (an outer group yaws, an inner one pitches; the arm runs along local -z)
export const reach = (from: V3, to: V3) => {
  const d: V3 = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const len = Math.hypot(d[0], d[1], d[2]);
  return {yaw: Math.atan2(-d[0], -d[2]), pitch: Math.asin(d[1] / len), len};
};

export const Crack: React.FC<{position: V3; k: number; seed: number; s?: number}> = ({position, k, seed, s = 1}) => (
  <group position={position} scale={s}>
    {Array.from({length: 7}).map((_, i) => {
      const a = (i / 7) * Math.PI * 2 + rnd(seed + i) * 0.6;
      const len = (0.3 + 0.35 * rnd(seed * 3 + i)) * k;
      return <Block key={i} position={[Math.cos(a) * (0.28 + len / 2), 0.004, Math.sin(a) * (0.28 + len / 2)]} rotation={[0, -a, 0]} size={[len, 0.003, 0.025]} color="#2a1a10" shadow={false} />;
    })}
  </group>
);

// ======================================================================= 0. hook: the box and her slipper land side by side

const drawPlanks = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#c8955e';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 12; i++) {
    g.fillStyle = i % 2 ? '#bf8a52' : '#cf9c64';
    g.fillRect(0, (i / 12) * H, W, H / 12 - 3);
    g.fillStyle = '#9a6a3a';
    g.fillRect(((i * 37) % 100) / 100 * W, (i / 12) * H, 3, H / 12);
  }
};
const drawWallpaper = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#f2dcc0';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#e8c8a8';
  for (let i = 0; i < 16; i++) g.fillRect((i / 16) * W, 0, W / 32, H);
};

export const BOX_X = -0.36;
export const MOM_X = 0.42;
export const BOX_S = 0.58;
export const MOM_S = 1.2;
export const HookRoom: React.FC = () => (
  <>
    <Pic size={[9, 6]} res={[512, 384]} k="hook-floor" position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} shadow draw={drawPlanks} />
    <Pic size={[9, 5]} res={[512, 320]} k="hook-wall" position={[0, 2.5, -2.2]} shadow draw={drawWallpaper} />
    <Block position={[0, 0.06, -2.17]} size={[9, 0.12, 0.05]} color="#f6efe6" />
    {/* a round rug under both */}
    <Cyl position={[0, 0.004, 0.1]} rt={1.25} rb={1.25} h={0.008} seg={48} color="#8a5ab8" look={{rough: 1}} />
    <Ring2 />
  </>
);
const Ring2: React.FC = () => <Cyl position={[0, 0.006, 0.1]} rt={1.0} rb={1.0} h={0.008} seg={48} color="#a878d0" look={{rough: 1}} />;

export const HookPair: React.FC<{v: number; settle?: boolean}> = ({v, settle}) => {
  const lb = settle ? -1 : LAND_BOX;
  const lm = settle ? -1 : LAND_MOM;
  return (
    <>
      <GameBox position={[BOX_X, drop(v, lb - 0.45, lb, 3), 0.05]} rotation={[0, 0.22, 0]} scale={BOX_S * bounce(v, lb, 0.06)} />
      <Mom who="g" position={[MOM_X, drop(v, lm - 0.45, lm, 3.4), 0]} rotation={-0.35} scale={MOM_S} hem={3} squash={bounce(v, lm)} />
      {v > lb ? <Crack position={[BOX_X, 0, 0.05]} k={settle ? 1 : ease(v, lb, lb + 0.25)} seed={3} s={0.9} /> : null}
      {v > lm ? <Crack position={[MOM_X, 0, 0]} k={settle ? 1 : ease(v, lm, lm + 0.25)} seed={7} /> : null}
    </>
  );
};

export const hookScene: Scene = {
  view: (v): View => mv(v, 0, E('hook'), [0.05, 0.42, 3.4], [0.15, 0.5, 2.9], [0, 0.55, 0], [0, 0.5, 0], [42, 41], 0.3),
  shakes: [[LAND_BOX, 0.2], [LAND_MOM, 0.35]],
  render: (v) => (
    <>
      <color attach="background" args={['#2a1420']} />
      <InteriorLights key1={[2, 6, 5]} k={0.95} box={4} warm="#ffe8c8" sky="#ffe8f0" ground="#5a3a30" />
      <pointLight position={[0, 3, 2]} color="#ffd8b0" intensity={4} distance={8} decay={1.6} />
      <HookRoom />
      <HookPair v={v} />
    </>
  ),
};

// ======================================================================= test 1a: her selfie (we only see her sleeve and the phone)

const drawSelfie = (stage: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  // a blurry pink floral close-up (that's all the camera can fit)
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#f6a8c8');
  bg.addColorStop(1, '#e8689a');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,240,248,0.7)';
  for (let i = 0; i < 14; i++) {
    const x = rnd(i * 3) * W;
    const y = rnd(i * 5) * H;
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      g.beginPath();
      g.arc(x + Math.cos(a) * W * 0.06, y + Math.sin(a) * W * 0.06, W * 0.05, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(0, 0, W, H * 0.09);
  g.fillRect(0, H * 0.82, W, H * 0.18);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (stage === 0) {
    g.strokeStyle = '#ffffff';
    g.lineWidth = W * 0.02;
    g.beginPath();
    g.arc(W / 2, H * 0.91, W * 0.11, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(W / 2, H * 0.91, W * 0.085, 0, Math.PI * 2);
    g.fill();
  } else {
    g.fillStyle = '#ffffff';
    g.font = `700 ${W * 0.075}px ${ROUNDF}`;
    g.fillText(stage === 1 ? 'Отправка… 1%' : 'Отправка… 2%', W / 2, H * 0.89);
    g.fillStyle = 'rgba(255,255,255,0.3)';
    roundRect(g, W * 0.15, H * 0.94, W * 0.7, H * 0.016, H * 0.008);
    g.fill();
    g.fillStyle = '#ffd23f';
    roundRect(g, W * 0.15, H * 0.94, W * 0.7 * (stage === 1 ? 0.02 : 0.04), H * 0.016, H * 0.008);
    g.fill();
  }
};

const PHONE_AT: V3 = [0.02, 1.62, -0.35];
export const selfieScene: Scene = {
  view: (v): View => mv(v, S('selfie'), E('selfie'), [0.12, 1.5, 0.75], [0.02, 1.56, 0.5], [0.04, 1.6, -0.3], [0.02, 1.62, -0.35], [40, 34], 0.05),
  render: (v) => {
    const stage = v < FLASH ? 0 : v < FLASH + 0.5 ? 1 : 2;
    const sh = PHONE_AT;
    const arm = reach([0.32, 1.18, 0.35], [sh[0] + 0.03, sh[1] - 0.06, sh[2] + 0.03]);
    const lift = ease(v, S('selfie'), S('selfie') + 0.6);
    const flash = v >= FLASH ? Math.exp(-(v - FLASH) * 6) : 0;
    return (
      <>
        <color attach="background" args={['#3a2030']} />
        <InteriorLights key1={[1.5, 4, 3]} k={0.9} box={3} warm="#ffe8d0" sky="#fff0f4" ground="#6a4a50" />
        {/* her living room behind the phone: wallpaper, a window, a lamp */}
        <Pic size={[6, 4]} res={[512, 320]} k="selfie-wall" position={[0, 1.6, -1.6]} shadow draw={drawWallpaper} />
        <RBox position={[-0.9, 1.7, -1.55]} size={[0.9, 1.1, 0.06]} r={0.03} color="#ffffff" />
        <RBox position={[-0.9, 1.7, -1.52]} size={[0.8, 1.0, 0.02]} r={0.02} color="#9fd0f0" look={{basic: true}} />
        <Cyl position={[0.9, 1.1, -1.3]} rt={0.18} rb={0.26} h={0.3} seg={20} color="#ffd8a0" look={{emissive: '#ffb860', emissiveK: 0.6}} />
        <Cyl position={[0.9, 0.5, -1.3]} rt={0.02} rb={0.02} h={0.9} seg={8} color="#3a3a42" />
        <Glow position={[0.9, 1.1, -1.25]} size={0.9} color="#ffd8a0" k={0.6} />
        <group position={[0.32, 1.18 - 0.2 * (1 - lift), 0.35]} rotation={[0, arm.yaw, 0]}>
          <group rotation={[arm.pitch, 0, 0]}>
            <MomArm len={arm.len - 0.12} />
          </group>
        </group>
        <Phone position={[sh[0], sh[1] - 0.2 * (1 - lift), sh[2]]} rotation={[0.08, -0.1, 0.04]} scale={2.2}>
          <PhoneScreen k={`selfie-${stage}`} draw={drawSelfie(stage)} glow={1.05 + flash * 2} />
        </Phone>
        {flash > 0 ? <Glow position={[sh[0], sh[1], sh[2] + 0.05]} size={1.6} color="#ffffff" k={flash} /> : null}
      </>
    );
  },
};

// ======================================================================= test 1b: the neighbour's room: the wifi dies

export const wifiScene: Scene = {
  view: (v): View => mv(v, S('wifi'), E('wifi'), [0.55, 1.15, 1.35], [0.35, 1.05, 1.1], [0.05, 0.9, 0], [0.0, 0.88, 0], [42, 40], 0.1),
  render: (v) => {
    const t = v - S('wifi');
    const dead = v >= WIFI_OFF;
    const dim = dead ? 0.85 : 1;
    return (
      <>
        <color attach="background" args={['#1c2030']} />
        <InteriorLights key1={[2, 4, 3]} k={0.8 * dim} box={3} warm="#e8f0ff" sky="#dfe8ff" ground="#4a4a5a" />
        <Pic size={[6, 4]} res={[512, 320]} k="nb-wall" position={[0, 1.6, -0.6]} shadow draw={drawTiles('#a8c8a0', '#98b890', 10)} />
        <Pic size={[6, 4]} res={[512, 320]} k="nb-floor" position={[0, 0, 0.8]} rotation={[-Math.PI / 2, 0, 0]} shadow draw={drawPlanks} />
        {/* desk */}
        <RBox position={[0, 0.72, 0]} size={[1.4, 0.05, 0.7]} r={0.015} color="#e8d8c0" />
        {[-0.62, 0.62].map((x) => (
          <Block key={x} position={[x, 0.35, 0]} size={[0.05, 0.7, 0.6]} color="#d8c8b0" />
        ))}
        <Laptop position={[-0.05, 0.745, 0.08]} rotation={[0, 0.1, 0]} bad={dead} a={t * 6} />
        {/* the router on a shelf above */}
        <RBox position={[0.35, 1.25, -0.48]} size={[0.6, 0.03, 0.2]} r={0.01} color="#e8d8c0" />
        <Router position={[0.35, 1.265, -0.44]} on={!dead} blink={Math.floor(t * 8) % 2 === 0} />
        <Cyl position={[-0.45, 0.82, -0.1]} rt={0.045} rb={0.04} h={0.13} seg={16} color="#e8453c" />
        {dead ? <Glow position={[-0.05, 0.95, 0.1]} size={0.6} color="#ff6a5a" k={0.3} /> : <Glow position={[-0.05, 0.95, 0.1]} size={0.7} color="#8ab0ff" k={0.35} />}
      </>
    );
  },
};

// ======================================================================= test 1c: GTA 6 downloads, the planet goes offline

const ER = 3;
const WORLD_LIGHTS = lightsOn([0, 0.1, 1], 140, 0.85, 3);
export const planetScene: Scene = {
  view: (v): View => mv(v, S('planet'), E('planet'), [-0.4, 0.6, 12.5], [0.3, 0.9, 10.8], [0, 0.3, 0], [0, 0.4, 0], [40, 42]),
  render: (v) => {
    const wave = ramp(v, NET_OFF[0], NET_OFF[0] + 1.2);
    const dl = v >= DL && v < NET_OFF[0] + 0.3;
    return (
      <>
        <color attach="background" args={['#05060f']} />
        <Stars radius={300} size={2} />
        <SpaceLights k={0.45} />
        <ToyEarth r={ER} spin={-0.2 + (v - S('planet')) * 0.05}>
          <CityLights r={ER} lights={WORLD_LIGHTS} off={(l) => l.d[0] < lerp(-1.3, 1.3, wave)} />
          {dl
            ? WORLD_LIGHTS.filter((l) => l.i % 5 === 0 && !(l.d[0] < lerp(-1.3, 1.3, wave))).map((l) => {
                const p = 0.5 + 0.5 * Math.sin(v * 9 + l.i);
                return <Glow key={l.i} position={[l.d[0] * ER * 1.08, l.d[1] * ER * 1.08, l.d[2] * ER * 1.08]} size={0.5 + 0.4 * p} color="#ff9a3a" k={0.7 * ease(v, DL, DL + 0.4)} />;
              })
            : null}
        </ToyEarth>
        <Glow position={[-14, 9, -30]} size={10} color="#fff1c8" k={0.5} />
      </>
    );
  },
};

// ======================================================================= test 2a: GTA 6 goes into the cloud, the cloud darkens

const CLOUD_AT: V3 = [0, 3.4, 0];
const SkyBits: React.FC<{dark: number}> = ({dark}) => (
  <>
    <Cloud position={[-6, 5.5, -14]} scale={1.1} dark={dark * 0.6} />
    <Cloud position={[7, 2.6, -18]} scale={1.4} dark={dark * 0.6} />
    <Cloud position={[3, 7.5, -24]} scale={1.2} dark={dark * 0.6} />
  </>
);
export const cloudGScene: Scene = {
  view: (v): View => mv(v, S('cloudG'), E('cloudG'), [0.3, 1.2, 9.5], [-0.3, 2.0, 8.2], [0, 2.4, 0], [0, 3.0, 0], [46, 44], 0.4),
  shakes: [[THUNDER, 0.3]],
  render: (v) => {
    const fly = ease5(v, INTO_CLOUD - 1.3, INTO_CLOUD + 0.1);
    const boxY = lerp(0.2, CLOUD_AT[1] + 0.8, fly) + (1 - fly) * 0.12 * Math.sin(v * 3);
    const dark = ease(v, INTO_CLOUD + 0.1, THUNDER);
    const flash = v >= THUNDER ? Math.max(Math.exp(-(v - THUNDER) * 7), v > THUNDER + 0.45 ? Math.exp(-(v - THUNDER - 0.45) * 8) : 0) : 0;
    const bg = `rgb(${Math.round(lerp(140, 70, dark) + flash * 80)},${Math.round(lerp(196, 76, dark) + flash * 60)},${Math.round(lerp(240, 100, dark) + flash * 40)})`;
    return (
      <>
        <color attach="background" args={[bg]} />
        <ambientLight intensity={lerp(0.9, 0.45, dark) + flash} color="#ffffff" />
        <directionalLight position={[6, 10, 8]} intensity={lerp(2.0, 0.6, dark)} color="#fff4e0" />
        <SkyBits dark={dark} />
        <Cloud position={CLOUD_AT} scale={1.25} dark={dark} squash={v > INTO_CLOUD ? bounce(v, INTO_CLOUD, 0.08) : 1} />
        {v < INTO_CLOUD + 0.15 ? <GameBox position={[0.1, boxY - 0.6, 0.6]} rotation={[-0.25, 0.35 * Math.sin((v - S('cloudG')) * 2.2), 0.12]} scale={0.95} /> : null}
        {v < INTO_CLOUD + 0.15 && fly < 0.98 ? <Glow position={[0.1, boxY - 0.3, 0.2]} size={1.4} color="#ffb060" k={0.4 * (1 - fly)} /> : null}
        <Bolt position={[0.5, CLOUD_AT[1] - 0.7, 0.8]} k={v >= THUNDER && v < THUNDER + 0.25 ? 1 : 0} seed={2} len={4} />
        <Bolt position={[-1.2, CLOUD_AT[1] - 0.6, 0.6]} k={v >= THUNDER + 0.45 && v < THUNDER + 0.65 ? 1 : 0} seed={7} len={3.5} />
      </>
    );
  },
};

// ======================================================================= test 2b: she sits on the cloud, it falls on the city

const CITY: {x: number; z: number; w: number; h: number}[] = Array.from({length: 26}, (_, i) => ({
  x: ((i % 6) - 2.5) * 1.9 + (rnd(i) - 0.5) * 0.4,
  z: -Math.floor(i / 6) * 2.0 + 1.5 + (rnd(i * 3) - 0.5) * 0.4,
  w: 0.9 + rnd(i * 5) * 0.5,
  h: 1.4 + rnd(i * 7) * 2.6,
}));
const ROOF = 2.2;
export const cloudMScene: Scene = {
  view: (v): View => mv(v, S('cloudM'), E('cloudM'), [1.5, 6.5, 15], [0.8, 4.2, 12.5], [0, 5.6, 0], [0, 3.0, 0], [48, 46], 0.5),
  shakes: [[CLOUD_HIT, 0.6]],
  render: (v) => {
    const sitK = ease5(v, SIT - 0.9, SIT);
    const fall = v < SIT + 0.2 ? 0 : ease5(v, SIT + 0.2, CLOUD_HIT) ** 1.4;
    const cy = lerp(7.2, ROOF + 0.9, fall);
    const sq = v > CLOUD_HIT ? bounce(v, CLOUD_HIT, 0.25) : v > SIT ? bounce(v, SIT, 0.12) : 1;
    const top = cy + 0.85 * 1.4 * sq;
    const momY = lerp(top + 6, top - 0.25, sitK);
    return (
      <>
        <color attach="background" args={['#8cc4ee']} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[6, 12, 8]} intensity={2.0} color="#fff4e0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
        <Block position={[0, -0.5, -2]} size={[60, 1, 40]} color="#8ab870" />
        <Block position={[0, 0.005, 0.6]} size={[60, 0.01, 1.2]} color="#5a5a62" shadow={false} />
        {CITY.map((h, i) => (
          <Tower key={i} position={[h.x, 0, h.z]} w={h.w} h={i === 14 || i === 15 || i === 8 || i === 9 ? ROOF : h.h} i={i} />
        ))}
        <Cloud position={[7, 8, -14]} scale={1.2} />
        <Cloud position={[-8, 9.5, -18]} scale={1.4} />
        <Cloud position={[0, cy, -1.2]} scale={1.4} squash={sq} />
        <Mom who="g" position={[0, momY, -1.0]} rotation={0.2} scale={1.5} hem={2.6} squash={v > SIT ? bounce(v, SIT, 0.1) : 1} />
        {v > CLOUD_HIT
          ? Array.from({length: 10}).map((_, i) => {
              const t = v - CLOUD_HIT;
              const a = (i / 10) * Math.PI * 2;
              const r = 1.8 + t * 3.5;
              return <Ball key={i} position={[Math.cos(a) * r, ROOF + 0.3 + t * 0.4, -1.2 + Math.sin(a) * r * 0.6]} scale={0.5 + t * 0.4} color="#f4f4f8" look={{rough: 1, opacity: Math.max(0, 0.8 - t * 0.6)}} shadow={false} receive={false} />;
            })
          : null}
      </>
    );
  },
};

// ======================================================================= test 3a: the washing machine trips the fuses

const BUTTON: V3 = [0.18, 0.79, 0.32];
export const washerScene: Scene = {
  view: (v): View => mv(v, S('washer'), E('washer'), [-0.35, 1.05, 2.1], [-0.15, 0.95, 1.75], [0.15, 0.7, 0], [0.1, 0.7, 0], [44, 42], 0.15),
  shakes: [[FUSE, 0.3]],
  render: (v) => {
    const dark = v >= FUSE ? 1 : 0;
    const k = lerp(1, 0.14, dark);
    const press = ease(v, PRESS - 0.5, PRESS) * (1 - ease(v, PRESS + 0.35, PRESS + 0.8));
    const from: V3 = [0.85, 1.05, 0.95];
    const arm = reach(from, BUTTON);
    const on = v >= PRESS && v < FUSE ? 1 : 0;
    const spark = v >= FUSE ? Math.exp(-(v - FUSE) * 2.5) : 0;
    return (
      <>
        <color attach="background" args={[dark ? '#0a0a12' : '#cfe0e8']} />
        <InteriorLights key1={[1.5, 4, 3]} k={k} box={3} warm="#fff4e6" sky="#eef8ff" ground="#8aa0a8" />
        <Pic size={[6, 6]} res={[512, 512]} k="wash-floor" position={[0, 0, 1]} rotation={[-Math.PI / 2, 0, 0]} shadow draw={drawTiles('#e8ecf0', '#c0ccd4', 14)} />
        <Pic size={[6, 4]} res={[512, 320]} k="wash-wall" position={[0, 2, -0.35]} shadow draw={drawTiles('#bfe2ea', '#9cc8d4', 18)} />
        {/* a ceiling lamp that goes out */}
        <Ball position={[0, 2.3, 0.6]} scale={0.14} color={dark ? '#5a5a60' : '#fff6d8'} look={dark ? {} : {basic: true}} shadow={false} />
        {!dark ? <Glow position={[0, 2.3, 0.6]} size={1.2} color="#fff6d8" k={0.5} /> : null}
        <Washer position={[0, 0, 0]} on={on} shake={on ? 0.004 * Math.sin(v * 70) : 0} />
        <FuseBox position={[-0.75, 1.35, -0.3]} spark={spark} t={v - FUSE} />
        <Mom who="g" position={[0.78, 0, 0.75]} rotation={-0.9} scale={1} hem={1.8} />
        <group position={from} rotation={[0, arm.yaw, 0]}>
          <group rotation={[arm.pitch, 0, 0]}>
            <MomArm len={arm.len - 0.245 - 0.12 * (1 - press)} finger />
          </group>
        </group>
      </>
    );
  },
};
