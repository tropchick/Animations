import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Human, HumanPose, girl} from '../bear/People';
import {Chair, Phone, PhoneScreen, Table} from '../bear/Props';
import {Sky} from '../bear/Forest';
import {Ball, Block, Cone, Cyl, Glow, RBox, mat} from '../bear/kit';
import {Scene, blink, ease, ease5, follow, mv} from '../bear/common';
import {at, dirOf, humanHand, humanHead, inside} from '../bear/rig';
import {Stars} from '../gta/Space';
import type {View} from '../slime/camera';
import {DETECT, FALL, FINAL, GREEN, KILLS, LIFTOFF, NOTIFY, STAMP, V3, XRAY, lerp, ramp, rnd, shotEnd, shotStart} from './cues';
import {Beam, CLUB_COLS, CLUB_ROWS, ClubRoom, GameDesk, Ghost, Headset, PLAYER, Shield, guy} from './Sets';
import {drawGame, drawKills, drawNote} from './tex';
import {InteriorLights, playPose} from './scenes1';

const S = shotStart;
const E = shotEnd;
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

// ======================================================================= 9. launch

const rocketY = (v: number) => {
  const t = Math.max(0, v - LIFTOFF);
  return 0.6 + 1.6 * t * t;
};

const Rocket: React.FC<{y: number; flame: number; v: number}> = ({y, flame, v}) => (
  <group position={[0, y, 0]}>
    <Cyl position={[0, 1.7, 0]} rt={0.46} rb={0.46} h={3.0} seg={32} color="#f6f4ee" look={{rough: 0.4, rim: '#ffffff', rimK: 0.15}} />
    <Cyl position={[0, 2.6, 0]} rt={0.465} rb={0.465} h={0.18} seg={32} color="#3a7fd8" />
    <Cyl position={[0, 0.5, 0]} rt={0.465} rb={0.465} h={0.18} seg={32} color="#3a7fd8" />
    <Cone position={[0, 3.75, 0]} r={0.46} h={1.1} seg={32} color="#e8453c" look={{rough: 0.4}} />
    {[0, 1, 2, 3].map((i) => (
      <group key={i} rotation={[0, (i * Math.PI) / 2 + Math.PI / 4, 0]}>
        <RBox position={[0, 0.45, 0.62]} size={[0.06, 0.8, 0.45]} r={0.03} color="#e8453c" />
      </group>
    ))}
    <Shield position={[0, 1.65, 0.47]} size={0.62} mood={{look: [0, 0.4]}} />
    <Cyl position={[0, 0.12, 0]} rt={0.3} rb={0.36} h={0.24} seg={20} color="#3a3c46" look={{metal: 0.6, rough: 0.35}} />
    {flame > 0 ? (
      <group position={[0, -0.05, 0]}>
        <Cone position={[0, -0.9 * flame, 0]} rotation={[Math.PI, 0, 0]} r={0.3} h={1.8 * flame * (0.9 + 0.12 * Math.sin(v * 40))} seg={16} color="#ffd27a" look={{basic: true}} shadow={false} />
        <Cone position={[0, -0.55 * flame, 0]} rotation={[Math.PI, 0, 0]} r={0.16} h={1.1 * flame} seg={12} color="#ffffff" look={{basic: true}} shadow={false} />
        <Glow position={[0, -0.8, 0]} size={4 * flame} color="#ffb25a" k={1} />
      </group>
    ) : null}
  </group>
);

const Smoke: React.FC<{t: number}> = ({t}) => {
  if (t <= 0) return null;
  return (
    <>
      {Array.from({length: 22}, (_, i) => {
        const a = rnd(i * 1.3) * Math.PI * 2;
        const sp = 0.8 + rnd(i * 2.1) * 1.6;
        const r = Math.min(t, 2.5) * sp;
        const s = 0.35 + Math.min(t, 2.5) * (0.35 + rnd(i * 3.7) * 0.4);
        return <Ball key={i} position={[Math.cos(a) * r, 0.3 + s * 0.4 + rnd(i) * 0.3, Math.sin(a) * r]} scale={s} color={i % 3 ? '#f4f2ee' : '#e0dcd6'} look={{rough: 1}} shadow={false} />;
      })}
    </>
  );
};

export const launchScene: Scene = {
  view: (v): View => {
    const y = rocketY(v);
    return follow(v, S('launch'), E('launch'), [4.6, 1.0, 8.5], [3.6, 1.4, 7.4], [0, y + 2.2, 0], [44, 50], 900, 540);
  },
  shakes: [
    [LIFTOFF, 0.5],
    [LIFTOFF + 0.6, 0.3],
    [LIFTOFF + 1.2, 0.25],
  ],
  render: (v) => {
    const flame = ease(v, LIFTOFF - 0.3, LIFTOFF + 0.1);
    return (
      <>
        <Sky top="#5d9ee0" mid="#bcdcf4" low="#f2e6cc" />
        <InteriorLights key1={[6, 10, 6]} k={1.05} box={8} sky="#e8f2ff" ground="#7a9a60" />
        <Block position={[0, -0.05, 0]} size={[80, 0.1, 80]} color="#8ac070" />
        <RBox position={[0, 0.15, 0]} size={[3.4, 0.3, 3.4]} r={0.05} color="#c8c4bc" />
        {[[-12, -30, 9], [6, -36, 12], [22, -28, 8], [-26, -24, 7]].map(([x, z, h], i) => (
          <Cone key={i} position={[x, h / 2, z]} r={h * 0.9} h={h} seg={6} color={['#9ab88a', '#a8c09a', '#8aac80', '#b0c8a0'][i]} look={{flat: true}} />
        ))}
        {/* service tower */}
        <group position={[-1.4, 0, -0.6]}>
          {[
            [0, 0],
            [0.5, 0],
            [0, 0.5],
            [0.5, 0.5],
          ].map(([x, z], i) => (
            <Cyl key={i} position={[x - 0.25, 2.6, z - 0.25]} rt={0.04} rb={0.04} h={5.2} seg={8} color="#e8453c" />
          ))}
          {[1, 2, 3, 4, 5].map((y) => (
            <RBox key={y} position={[0, y, 0]} size={[0.58, 0.05, 0.58]} r={0.01} color="#e8453c" />
          ))}
          <RBox position={[0.5, 3.6, 0]} size={[0.6, 0.06, 0.12]} r={0.01} color="#3a3c46" />
        </group>
        <Rocket y={rocketY(v)} flame={flame} v={v} />
        <Smoke t={v - LIFTOFF} />
      </>
    );
  },
};

// ======================================================================= 10. orbit: the satellites see everything

const EARTH_R = 5;
const CONTINENTS: {d: V3; s: V3}[] = Array.from({length: 11}, (_, i) => {
  const u = rnd(i * 2.3 + 1) * 1.6 - 0.8;
  const a = rnd(i * 3.7 + 2) * Math.PI * 2;
  const r = Math.sqrt(1 - u * u);
  return {d: [Math.cos(a) * r, u, Math.sin(a) * r], s: [0.6 + rnd(i) * 0.45, 0.5 + rnd(i * 5) * 0.4, 0.22]};
});

const ToyEarth: React.FC<{r: number; spin: number; position?: V3}> = ({r, spin, position = [0, 0, 0]}) => (
  <group position={position} rotation={[0.3, spin, 0]}>
    <Ball scale={r} seg={64} color="#3a8ad8" look={{rough: 0.5, rim: '#9ad8ff', rimK: 0.6, rimPow: 2.2}} />
    {CONTINENTS.map((c, i) => {
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...c.d));
      const e = new THREE.Euler().setFromQuaternion(q);
      return <Ball key={i} position={[c.d[0] * r * Math.sqrt(1 - Math.max(c.s[0], c.s[1]) ** 2 / 25), c.d[1] * r * Math.sqrt(1 - Math.max(c.s[0], c.s[1]) ** 2 / 25), c.d[2] * r * Math.sqrt(1 - Math.max(c.s[0], c.s[1]) ** 2 / 25)]} rotation={[e.x, e.y, e.z]} scale={[(c.s[0] * r) / 5, (c.s[1] * r) / 5, (c.s[2] * r) / 5]} color={i % 3 ? '#6fbf73' : '#c8b878'} look={{rough: 0.8}} />;
    })}
  </group>
);

const SATS = [0, 1, 2, 3].map((i) => ({a: [0.75, 1.35, 1.95, 2.55][i] - 0.12 * 41.4, tilt: (i % 2 ? 0.35 : -0.25) + i * 0.1}));
const satPos = (i: number, v: number, R = 7.0): V3 => {
  const s = SATS[i];
  const a = s.a + v * 0.12;
  return [Math.cos(a) * R, Math.sin(s.tilt) * R * 0.6 * Math.sin(a + i), Math.sin(a) * R];
};

export const orbitScene: Scene = {
  view: (v): View => mv(v, S('orbit'), E('orbit'), [4, 4.5, 27], [3, 3.4, 23.5], [0, 0, 0], [0, 0.2, 0], [42, 40]),
  render: (v) => (
    <>
      <color attach="background" args={['#05060f']} />
      <Stars radius={300} size={2} />
      <ambientLight intensity={0.35} color="#8a9ac8" />
      <directionalLight position={[10, 6, 8]} intensity={2.4} color="#fff4e0" />
      <ToyEarth r={EARTH_R} spin={v * 0.08} />
      {SATS.map((_, i) => {
        const p = satPos(i, v);
        const yaw = Math.atan2(-p[0], -p[2]);
        const l = Math.hypot(...p);
        const ground: V3 = [(p[0] / l) * EARTH_R, (p[1] / l) * EARTH_R, (p[2] / l) * EARTH_R];
        return (
          <group key={i}>
            <Shield position={p} rotation={[0, yaw, 0]} size={1.05} wings={1} mood={{look: [0, -0.3]}} />
            <Beam from={p} to={ground} r={0.9} k={0.9} />
          </group>
        );
      })}
    </>
  ),
};

// ======================================================================= 11. x-ray: walls go see-through

const HOUSES: {p: V3; c: string; roof: string; yaw: number}[] = [
  {p: [-3.2, 0, -2.5], c: '#f2c69a', roof: '#c8503a', yaw: 0.1},
  {p: [0, 0, -3.0], c: '#cfe2f2', roof: '#3a6ab8', yaw: -0.05},
  {p: [3.2, 0, -2.4], c: '#f4e2a0', roof: '#7a4a2a', yaw: 0.08},
  {p: [-3.4, 0, 1.0], c: '#e8b8c8', roof: '#5a3a6a', yaw: -0.1},
  {p: [0.1, 0, 0.6], c: '#d8ecc8', roof: '#c8503a', yaw: 0.04},
  {p: [3.3, 0, 1.2], c: '#f0d0b0', roof: '#3a6ab8', yaw: -0.06},
];

const House: React.FC<{p: V3; c: string; roof: string; yaw: number; see: number; i: number}> = ({p, c, roof, yaw, see, i}) => {
  const op = Math.round((1 - 0.72 * see) * 10) / 10;
  const look = op < 1 ? {opacity: op, rough: 0.9} : {rough: 0.9};
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      <Block position={[0, 0.006, 0]} size={[2.06, 0.012, 2.06]} color="#b89a7a" />
      {/* four walls, each its own slab so the inside shows */}
      <Block position={[0, 1.004, 1.0]} size={[2.1, 1.992, 0.1]} color={c} look={look} />
      <Block position={[0, 1.004, -1.0]} size={[2.1, 1.992, 0.1]} color={c} look={look} />
      <Block position={[1.0, 1.004, 0]} size={[0.1, 1.992, 1.9]} color={c} look={look} />
      <Block position={[-1.0, 1.004, 0]} size={[0.1, 1.992, 1.9]} color={c} look={look} />
      {op >= 1 ? (
        <>
          <RBox position={[-0.45, 1.15, 1.06]} size={[0.5, 0.5, 0.03]} r={0.02} color="#9ad0f0" />
          <RBox position={[0.45, 0.6, 1.06]} size={[0.45, 1.1, 0.03]} r={0.02} color="#7a4a2a" />
        </>
      ) : null}
      <group position={[0, 2.0, 0]} rotation={[0, Math.PI / 4, 0]}>
        <Cone position={[0, 0.55, 0]} r={1.62} h={1.1} seg={4} color={roof} look={op < 1 ? {opacity: Math.min(1, op + 0.2), flat: true} : {flat: true}} />
      </group>
      {/* the people inside: a sofa, a table */}
      <RBox position={[-0.4, 0.25, -0.55]} size={[0.9, 0.5, 0.4]} r={0.08} color="#5a6aa8" />
      <Ghost position={[-0.4, 0.05, -0.5]} k={see} sit scale={0.9} />
      <Ghost position={[0.45, 0, 0.2]} rotation={i} k={see} scale={0.9} />
    </group>
  );
};

export const xrayScene: Scene = {
  view: (v): View => mv(v, S('xray'), E('xray'), [7.5, 8.5, 11], [5.0, 5.4, 8.0], [0, 0.6, -0.8], [0, 0.8, -0.8], [46, 44], 0.6),
  render: (v) => {
    const see = ease(v, XRAY, XRAY + 0.6);
    const sat: V3 = [0.5, 7.6, -3.5];
    return (
      <>
        <Sky top="#6fa8e0" mid="#cfe2f2" low="#f6e2c0" />
        <InteriorLights key1={[6, 10, 6]} k={1.0} box={9} sky="#e8f2ff" ground="#8a9a70" />
        <Block position={[0, -0.05, 0]} size={[40, 0.1, 40]} color="#9ac880" />
        <Block position={[0, -0.04, -0.8]} size={[40, 0.1, 1.2]} color="#c8bca8" />
        {HOUSES.map((h, i) => (
          <House key={i} {...h} see={see} i={i} />
        ))}
        <Shield position={sat} rotation={[0.5, 0, 0]} size={1.3} wings={1} mood={{look: [0, -0.7]}} />
        <Beam from={[sat[0], sat[1] - 0.2, sat[2] + 0.2]} to={[0, 0.05, -0.8]} r={4.5} k={0.55 + 0.45 * see} />
      </>
    );
  },
};

// ======================================================================= 12. the mirror: it sees itself through the walls

const REAL: V3 = [0, 0, 1.6];
const REFL: V3 = [0, 0, -1.6];
const fallOf = (v: number) => {
  const t = Math.max(0, v - FALL);
  return {dy: -1.4 * t * t - 0.4 * t, spin: t * 2.6, dz: 0.6 * t};
};

export const mirrorScene: Scene = {
  view: (v): View => {
    if (v < DETECT - 0.3) return mv(v, S('mirror'), DETECT - 0.3, [2.3, 1.0, 5.2], [1.9, 0.6, 4.4], [-0.2, 0.1, -1.3], [-0.2, 0.05, -1.5], [42, 40], 0.3);
    if (v < STAMP - 0.75) return mv(v, DETECT - 0.3, STAMP - 0.75, [1.9, 0.6, 4.4], [1.5, 0.45, 3.6], [-0.2, 0.05, -1.5], [-0.15, 0.05, -1.6], [40, 36]);
    return mv(v, STAMP - 0.75, E('mirror'), [1.35, 0.35, 0.35], [1.6, 0.3, 0.1], [0, 0.0, 1.6], [0, -0.35, 1.7], [40, 46]);
  },
  shakes: [[STAMP, 0.7]],
  render: (v) => {
    const notice = ease(v, DETECT - 0.6, DETECT - 0.2);
    const out = ease(v, DETECT, DETECT + 0.2);
    const dead = v >= STAMP ? 1 : 0;
    const f = fallOf(v);
    const mood = {wide: notice, look: [0, 0] as [number, number], dead, glow: 1};
    return (
      <>
        <color attach="background" args={['#05060f']} />
        <Stars radius={300} size={2} />
        <ambientLight intensity={0.45} color="#8a9ac8" />
        <directionalLight position={[6, 4, 8]} intensity={2.2} color="#fff4e0" />
        <directionalLight position={[3, 2, -8]} intensity={1.6} color="#e8f0ff" />
        <ToyEarth r={40} spin={0.6} position={[0, -47, -10]} />
        {/* the station's mirror panel */}
        <group>
          <RBox position={[0, 0, -0.04]} size={[3.6, 2.5, 0.04]} r={0.02} color="#cfe2fa" look={{opacity: 0.26, rough: 0.05, metal: 0.3}} />
          {[-1.82, 1.82].map((x) => (
            <Block key={x} position={[x, 0, -0.04]} size={[0.06, 2.56, 0.08]} color="#c8c8d0" />
          ))}
          {[-1.27, 1.27].map((y) => (
            <Block key={y} position={[0, y, -0.04]} size={[3.7, 0.06, 0.08]} color="#c8c8d0" />
          ))}
          <Cyl position={[0, -2.2, -0.2]} rt={0.05} rb={0.05} h={2.0} seg={8} color="#c8c8d0" />
        </group>
        {/* the reflection (a mirrored twin behind the glass) */}
        <Shield position={REFL} rotation={[0, 0, 0]} size={0.9} wings={0} mood={mood} outline={out * (1 - dead * 0.3)} />
        {/* the real one, falling after the ban */}
        <group position={[REAL[0], REAL[1] + f.dy, REAL[2] + f.dz]} rotation={[f.spin, 0, f.spin * 0.6]}>
          <Shield rotation={[0, Math.PI, 0]} size={0.9} wings={0} mood={mood} />
        </group>
      </>
    );
  },
};

// ======================================================================= 13. back in the club: the cheaters return

const HERO_SEAT: V3 = [0, 0, 0.62];
const ScreenCue = (v: number) => KILLS.filter((k) => v >= k).length;

const BackClub: React.FC<{v: number; heroSide?: boolean}> = ({v, heroSide}) => {
  const green = ease(v, GREEN, GREEN + 0.3);
  return (
    <>
      {CLUB_ROWS.map((z, r) =>
        CLUB_COLS.map((x, c) => {
          const hero = r === 0 && c === 2;
          const i = r * 5 + c;
          const o = hero ? PLAYER : i % 3 === 1 ? girl(i + 2) : guy(i);
          const on = green > 0.5 || hero;
          if (hero && heroSide) return <GameDesk key={i} position={[x, 0, z]} k={`k-${ScreenCue(v)}-${Math.round(v * 8)}`} draw={(g, W, H) => drawKills(g, W, H, v, ScreenCue(v))} />;
          return (
            <group key={i}>
              <GameDesk position={[x, 0, z]} k={hero ? `k-${ScreenCue(v)}-${Math.round(v * 8)}` : on ? `bg${i}-${Math.round(v * 8)}` : 'blank'} draw={hero ? (g, W, H) => drawKills(g, W, H, v, ScreenCue(v)) : on ? (g, W, H) => drawGame(g, W, H, v, i) : (g, W, H) => {
                g.fillStyle = '#0a0a10';
                g.fillRect(0, 0, W, H);
              }} rgb={['#ff4fd8', '#4fd8ff', '#9bff4f'][i % 3]} can={i % 2 ? '#2fd06a' : '#e03a3a'} />
              {hero ? null : (
                <>
                  <Chair position={[x, 0, z + 0.62]} rotation={Math.PI} office color="#2a2a30" />
                  <Human o={o} position={[x, 0, z + 0.62]} rotation={Math.PI} pose={{...playPose(v, i), face: {smile: 0.6 * green, happy: 0.3, look: [0, -0.1], lid: blink(v, i)}}} head={<Headset color={['#1b1c22', '#e8e8f0', '#d8483a'][i % 3]} />} />
                </>
              )}
            </group>
          );
        }),
      )}
    </>
  );
};

export const backScene: Scene = {
  view: (v): View => {
    if (v < KILLS[0] + 0.4) return mv(v, S('back'), KILLS[0] + 0.4, [-1.0, 2.7, 3.6], [0.6, 1.75, 1.6], [0, 1.1, -1.6], [0, 0.99, -0.14], [48, 44], 0.3);
    return mv(v, KILLS[0] + 0.4, E('back'), [0.6, 1.75, 1.6], [0.42, 1.38, 0.62], [0, 0.99, -0.14], [0.02, 0.99, -0.14], [44, 40]);
  },
  render: (v) => {
    const heroPose = {...playPose(v, 2), face: {browIn: -0.4, lid: 0.3, look: [0, -0.1] as [number, number]}};
    return (
      <>
        <color attach="background" args={['#1a1624']} />
        <InteriorLights key1={[2, 6, 5]} k={0.8} box={6} warm="#ffe6c8" sky="#c8c0ff" ground="#3a2a40" />
        <ClubRoom />
        <BackClub v={v} />
        <Chair position={HERO_SEAT} rotation={Math.PI} office color="#2a2a30" />
        <Human o={PLAYER} position={HERO_SEAT} rotation={Math.PI} pose={heroPose} head={<Headset />} />
      </>
    );
  },
};

// ======================================================================= 14. the phone: «Мы работаем над этим»

const PH_SEAT: V3 = [0, 0, 0.75];
const PH_YAW = Math.PI / 2;
const PHONE_AT: V3 = [-0.01, -0.125, 0.03];
const PHONE_ROT: V3 = [-0.35, 0.25, 0.15 + Math.PI];
const phonePose = (v: number): HumanPose => {
  const down = ease(v, FINAL - 1.2, FINAL - 0.5);
  return {
    sit: 1,
    lean: lerp(0.16, -0.05, down),
    head: [lerp(0.42, 0.05, down), 0, 0],
    armR: [-0.75, 0.12, -0.25],
    elbowR: -1.45,
    armL: [0.05, 0.12, 0],
    elbowL: -0.3,
    face: {lid: 0.45 + 0.1 * down, browIn: -0.25, brow: -0.02, smile: -0.25, look: [0, lerp(-0.4, 0, down)]},
  };
};
const phoneM = (v: number) => inside(humanHand(PLAYER, PH_SEAT, PH_YAW, phonePose(v), 1), PHONE_AT, PHONE_ROT);

export const phoneScene: Scene = {
  view: (v): View => {
    if (v < FINAL - 1.3) {
      const M = phoneM(S('phone'));
      const c = at(M, [0, 0, 0.005]);
      const n = dirOf(M, [0, 0, 1]);
      const up = dirOf(M, [0, 1, 0]);
      const k = ease5(v, S('phone'), NOTIFY + 0.5);
      return {pos: add(c, n, lerp(0.42, 0.3, k)), target: add(c, up, 0.01), up, fov: 32, far: 60};
    }
    const h = at(humanHead(PLAYER, PH_SEAT, PH_YAW, phonePose(v)));
    const k = ease(v, FINAL - 1.3, E('phone'));
    return {pos: [h[0] + lerp(1.15, 1.0, k), h[1] + 0.02, h[2] + 0.18], target: [h[0], h[1] + 0.02, h[2]], fov: lerp(40, 36, k), far: 60};
  },
  shakes: [[NOTIFY, 0.2]],
  render: (v) => {
    const note = ease(v, NOTIFY, NOTIFY + 0.25);
    return (
      <>
        <color attach="background" args={['#1a1624']} />
        <InteriorLights key1={[3, 6, 3]} k={0.8} box={6} warm="#ffe6c8" sky="#c8c0ff" ground="#3a2a40" />
        <pointLight position={[0.5, 1.4, 0.75]} color="#9ab8ff" intensity={0.45} distance={2} decay={1.6} />
        <ClubRoom />
        <BackClub v={Math.max(v, GREEN + 1)} />
        <Chair position={PH_SEAT} rotation={PH_YAW} office color="#2a2a30" />
        <Human
          o={PLAYER}
          position={PH_SEAT}
          rotation={PH_YAW}
          pose={phonePose(v)}
          noHead={v < FINAL - 1.3}
          head={<Headset />}
          handR={
            <Phone position={PHONE_AT} rotation={PHONE_ROT}>
              <PhoneScreen draw={(g, W, H) => drawNote(g, W, H, note)} k={`note-${Math.round(note * 10)}`} />
            </Phone>
          }
        />
      </>
    );
  },
};

export {Table, mat, useMemo, Glow};
