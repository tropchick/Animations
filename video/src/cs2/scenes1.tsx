import React from 'react';
import {Human, HumanPose, Outfit, girl} from '../bear/People';
import {Chair, Pic, Table} from '../bear/Props';
import {Crowd, blobFans} from '../bear/Sets';
import {Ball, Block, Cyl, Glow, RBox} from '../bear/kit';
import {Scene, blink, ease, ease5, follow, mv} from '../bear/common';
import type {View} from '../slime/camera';
import {BAN, CAKE, LOBBY, SEATS_BAN, TROPHY, V3, lerp, ramp, rnd, shotEnd, shotStart} from './cues';
import {Beam, Bot, CLUB_COLS, CLUB_ROWS, ClubRoom, Confetti, GameDesk, Headset, Laptop, Monitor, PLAYER, Poof, Shield, Trophy, guy, screenDraw} from './Sets';
import {drawBan, drawCake, drawGame, drawLobby, drawMajor, drawSign} from './tex';

const S = shotStart;
const E = shotEnd;

export const InteriorLights: React.FC<{key1?: V3; k?: number; box?: number; warm?: string; fill?: string; ground?: string; sky?: string}> = ({key1 = [3, 6, 4], k = 1, box = 5, warm = '#fff2dc', fill = '#dfe8ff', sky = '#f4f2ff', ground = '#6a6070'}) => (
  <>
    <hemisphereLight color={sky} groundColor={ground} intensity={1.15 * k} />
    <directionalLight
      position={key1}
      color={warm}
      intensity={1.9 * k}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-box}
      shadow-camera-right={box}
      shadow-camera-top={box}
      shadow-camera-bottom={-box}
      shadow-bias={-0.0005}
    />
    <directionalLight position={[-key1[0], 3, key1[2] + 2]} color={fill} intensity={0.55 * k} />
  </>
);

// ======================================================================= 1. the club: the ban wave

const HERO_COL = 2;
const clubOutfit = (r: number, c: number): Outfit => {
  if (r === 0 && c === HERO_COL) return PLAYER;
  const i = r * 5 + c;
  return i % 3 === 1 ? girl(i + 2) : guy(i);
};
// the shield sweeps left to right; a screen is banned the moment it passes over
export const shieldX = (v: number) => lerp(-3.4, 3.4, ramp(v, BAN[0], BAN[1]));
const banAt = (x: number) => BAN[0] + ((x + 3.4) / 6.8) * (BAN[1] - BAN[0]);

export const playPose = (v: number, seed: number): HumanPose => ({
  sit: 1,
  lean: 0.14 + 0.02 * Math.sin(v * 2 + seed),
  head: [0.08, 0.04 * Math.sin(v * 0.9 + seed), 0],
  armR: [-0.95 + 0.04 * Math.sin(v * 9 + seed), 0.18, -0.15],
  elbowR: -0.85,
  armL: [-0.95 + 0.04 * Math.sin(v * 7 + seed * 2), 0.2, 0.15],
  elbowL: -0.85,
  face: {look: [0, -0.1], brow: -0.02, browIn: -0.2, lid: blink(v, seed) * 0.9 + 0.15, mouth: 0.05},
});

const bannedPose = (v: number, at: number, seed: number): HumanPose => {
  const k = ease(v, at, at + 0.35);
  const p = playPose(v, seed);
  return {
    ...p,
    lean: lerp(p.lean ?? 0, -0.08, k),
    head: [lerp(0.08, -0.35, k), 0.15 * Math.sin(seed) * k, 0],
    armR: [lerp(-0.95, -2.75, k), lerp(0.18, 0.45, k), 0],
    elbowR: lerp(-0.85, -1.7, k),
    armL: [lerp(-0.95, -2.75, k), lerp(0.2, 0.45, k), 0],
    elbowL: lerp(-0.85, -1.7, k),
    face: k > 0.05 ? {wide: k, o: k, mouth: 0.8 * k, brow: 0.06 * k, browIn: 0.3 * k, look: [0, 0.35 * k]} : p.face,
  };
};

const ClubPeople: React.FC<{v: number; mode: 'ban' | 'play' | 'banned'}> = ({v, mode}) => (
  <>
    {CLUB_ROWS.map((z, r) =>
      CLUB_COLS.map((x, c) => {
        const hero = r === 0 && c === HERO_COL;
        const seed = r * 5 + c;
        const at = banAt(x);
        const banned = !hero && (mode === 'banned' || (mode === 'ban' && v >= at));
        const pose = mode === 'play' || hero ? playPose(v, seed) : mode === 'banned' ? bannedPose(v, -10, seed) : bannedPose(v, at, seed);
        const o = clubOutfit(r, c);
        return (
          <group key={`${r}${c}`}>
            <GameDesk position={[x, 0, z]} k={banned ? 'ban' : `g${seed}-${Math.round(v * 10)}`} draw={screenDraw(banned, v, seed)} rgb={['#ff4fd8', '#4fd8ff', '#9bff4f'][seed % 3]} can={seed % 2 ? '#2fd06a' : '#e03a3a'} />
            <Chair position={[x, 0, z + 0.62]} rotation={Math.PI} office color="#2a2a30" />
            <Human o={o} position={[x, 0, z + 0.62]} rotation={Math.PI} pose={hero && mode === 'ban' ? heroLookAround(v) : pose} head={<Headset color={hero ? '#1b1c22' : ['#1b1c22', '#e8e8f0', '#d8483a'][seed % 3]} />} />
          </group>
        );
      }),
    )}
  </>
);

// the hero is not banned: he looks around at everybody else
const heroLookAround = (v: number): HumanPose => {
  const p = playPose(v, 2);
  const k = ease(v, BAN[0] + 1.6, BAN[0] + 2.1);
  const yaw = Math.sin((v - BAN[0] - 1.6) * 1.6) * 0.6 * k;
  return {...p, head: [lerp(0.08, -0.05, k), yaw, 0], face: k > 0.1 ? {wide: 0.5 * k, look: [0.3 * Math.sign(yaw), 0], brow: 0.04 * k, mouth: 0.15 * k} : p.face};
};

const shieldIn = (v: number) => ease5(v, 1.0, 1.6);
const clubShield = (v: number): {p: V3; size: number; lid: number; look: [number, number]} => {
  const x = v < BAN[0] ? -3.4 : shieldX(v);
  const bob = Math.sin(v * 2.2) * 0.05;
  return {p: [x, 2.85 + bob, -1.5], size: 0.75 * shieldIn(v), lid: 1 - ease(v, 2.2, 2.6), look: [0, -0.6]};
};

export const clubScene: Scene = {
  view: (v): View => {
    if (v < BAN[0]) return mv(v, S('club'), BAN[0], [0.9, 2.9, 4.6], [0.2, 2.35, 3.4], [-0.6, 1.4, -2.0], [-0.9, 1.6, -1.6], [46, 44], 0.4);
    const sx = shieldX(v);
    return mv(v, BAN[0], E('club'), [-1.4, 2.2, 3.4], [1.6, 2.1, 3.1], [lerp(-2.4, 1.6, ramp(v, BAN[0], BAN[1])), 1.75, -1.6], [lerp(-2.4, 1.6, ramp(v, BAN[0], BAN[1])) + 0 * sx, 1.75, -1.6], 50);
  },
  shakes: [[BAN[0], 0.3]],
  render: (v) => {
    const sh = clubShield(v);
    const beamK = ease(v, BAN[0] - 0.2, BAN[0]) * (1 - ease(v, BAN[1], BAN[1] + 0.3));
    return (
      <>
        <color attach="background" args={['#1a1624']} />
        <InteriorLights key1={[2, 6, 5]} k={0.75} box={6} warm="#ffe6c8" sky="#c8c0ff" ground="#3a2a40" />
        <pointLight position={[0, 2.6, -1.5]} color="#ff5a4a" intensity={beamK * 3} distance={6} decay={1.6} />
        <ClubRoom />
        <ClubPeople v={v} mode="ban" />
        {sh.size > 0.01 ? <Shield position={sh.p} size={sh.size} mood={{lid: sh.lid, look: sh.look}} /> : null}
        {CLUB_ROWS.map((z) => (
          <Beam key={z} from={[sh.p[0], sh.p[1] - 0.1, sh.p[2] + 0.05]} to={[sh.p[0], 0.75, z + 0.1]} r={0.55} k={beamK} />
        ))}
      </>
    );
  },
};

// ======================================================================= 2. the lobby: four players

export const lobbyScene: Scene = {
  view: (v): View => mv(v, S('lobby'), E('lobby'), [0.5, 1.5, 1.1], [0.36, 1.4, 0.86], [0, 0.99, -0.14], [0, 0.99, -0.14], [44, 41], 0.12),
  render: (v) => (
    <>
      <color attach="background" args={['#1a1624']} />
      <InteriorLights key1={[2, 6, 5]} k={0.6} box={6} warm="#ffe6c8" sky="#c8c0ff" ground="#3a2a40" />
      <pointLight position={[0, 1.1, 0.3]} color="#7aa0ff" intensity={1.5} distance={3} decay={1.6} />
      <ClubRoom neon={0.7} />
      {/* the hero's desk with the lobby, the empty club around */}
      <group>
        <GameDesk position={[0, 0, 0]} k={`lobby-${Math.round(ramp(v, LOBBY, LOBBY + 1.2) * 20)}-${Math.round(Math.sin(v * 4) * 4)}`} draw={(g, W, H) => drawLobby(g, W, H, (v - LOBBY) / 0.3, 0.5 + 0.5 * Math.sin(v * 4))} glow={1.05} />
        <Chair position={[0, 0, 0.62]} rotation={Math.PI} office color="#2a2a30" />
        <Human o={PLAYER} position={[0, 0, 0.62]} rotation={Math.PI} pose={{...playPose(v, 2), head: [0.12, 0, 0]}} head={<Headset />} />
      </group>
      {CLUB_ROWS.map((z, r) =>
        CLUB_COLS.map((x, c) => (r === 0 && c === HERO_COL ? null : <GameDesk key={`${r}${c}`} position={[x, 0, z]} k="ban" draw={(g, W, H) => drawBan(g, W, H)} glow={0.8} can={null} />)),
      )}
      {CLUB_ROWS.map((z, r) => CLUB_COLS.map((x, c) => (r === 0 && c === HERO_COL ? null : <Chair key={`c${r}${c}`} position={[x, 0, z + 0.62]} rotation={Math.PI + (rnd(r * 5 + c) - 0.5) * 0.8} office color="#2a2a30" />)))}
    </>
  ),
};

// ======================================================================= 3. family dinner: four players, one cake

const FAM: {p: V3; yaw: number; o: Outfit; hs: string}[] = [
  {p: [-0.42, 0, -0.72], yaw: 0, o: PLAYER, hs: '#1b1c22'},
  {p: [0.42, 0, -0.72], yaw: 0, o: girl(5), hs: '#e8e8f0'},
  {p: [-0.42, 0, 0.72], yaw: Math.PI, o: guy(4), hs: '#d8483a'},
  {p: [0.42, 0, 0.72], yaw: Math.PI, o: guy(7), hs: '#1b1c22'},
];

const famPose = (v: number, i: number): HumanPose => {
  const up = ease(v, CAKE - 0.5, CAKE);
  const p = playPose(v, i * 3);
  return {
    ...p,
    lean: lerp(0.14, 0.02, up),
    head: [lerp(0.15, 0.12, up), lerp(0, i % 2 ? -0.35 : 0.35, up) * (i < 2 ? 1 : -1), 0],
    face: up > 0.1 ? {smile: 0.8 * up, happy: 0.7 * up, look: [0, -0.2], lid: blink(v, i)} : {smile: 0.25, look: [0, -0.3], lid: blink(v, i) * 0.9 + 0.1},
  };
};

const Room: React.FC = () => (
  <group>
    <Block position={[0, -0.05, 0]} size={[7, 0.1, 6]} color="#a8744a" />
    <Block position={[0, 1.6, -2.2]} size={[7, 3.2, 0.1]} color="#f2dcc0" look={{rough: 0.95}} />
    <Block position={[-2.8, 1.6, 0]} size={[0.1, 3.2, 6]} color="#ecd2b2" look={{rough: 0.95}} />
    {/* window */}
    <group position={[0.9, 1.7, -2.14]}>
      <mesh>
        <planeGeometry args={[1.4, 1.1]} />
        <meshBasicMaterial color="#2a3a6a" toneMapped={false} />
      </mesh>
      {[-0.7, 0, 0.7].map((x) => (
        <Block key={x} position={[x, 0, 0.02]} size={[0.06, 1.16, 0.04]} color="#f8f2e6" />
      ))}
      {[-0.55, 0.55].map((y) => (
        <Block key={y} position={[0, y, 0.02]} size={[1.46, 0.06, 0.04]} color="#f8f2e6" />
      ))}
      <Ball position={[0.4, 0.25, 0.005]} scale={[0.08, 0.08, 0.001]} color="#f8f0c8" look={{basic: true}} shadow={false} />
      {[-1, 1].map((s) => (
        <RBox key={s} position={[0.88 * s, -0.05, 0.08]} size={[0.32, 1.4, 0.05]} r={0.02} color="#c8503a" look={{rough: 1}} />
      ))}
    </group>
    {/* family photo */}
    <RBox position={[-1.3, 1.85, -2.13]} size={[0.6, 0.45, 0.03]} r={0.01} color="#6a4a2a" />
    <Pic position={[-1.3, 1.85, -2.11]} size={[0.5, 0.36]} res={[300, 216]} k="fam-photo" draw={(g, W, H) => drawGame(g, W, H, 0, 5)} />
    {/* hanging lamp */}
    <Cyl position={[0, 2.75, 0]} rt={0.005} rb={0.005} h={0.9} seg={6} color="#2a2a30" />
    <Cyl position={[0, 2.25, 0]} rt={0.12} rb={0.32} h={0.22} seg={24} color="#e8a83a" look={{emissive: '#ffb84a', emissiveK: 0.3}} />
    <Glow position={[0, 2.12, 0]} size={1.1} color="#ffd890" k={0.55} />
  </group>
);

const Cake: React.FC<{lit: number}> = ({lit}) => (
  <group>
    <Cyl position={[0, 0.06, 0]} rt={0.2} rb={0.2} h={0.12} seg={32} color="#f8e6d0" />
    <Cyl position={[0, 0.12 + 0.002, 0]} rt={0.205} rb={0.205} h={0.02} seg={32} color="#e85d75" shadow={false} />
    <Cyl position={[0, 0.18, 0]} rt={0.14} rb={0.14} h={0.1} seg={32} color="#f8e6d0" />
    <Cyl position={[0, 0.232, 0]} rt={0.145} rb={0.145} h={0.015} seg={32} color="#e85d75" shadow={false} />
    {[0, 1, 2, 3].map((i) => {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      return (
        <group key={i} position={[Math.cos(a) * 0.08, 0.27, Math.sin(a) * 0.08]}>
          <Cyl rt={0.008} rb={0.008} h={0.07} seg={8} color={['#5aa0e6', '#ffd23f', '#7fd6c2', '#ff8fd0'][i]} />
          {lit > 0 ? (
            <>
              <Ball position={[0, 0.05, 0]} scale={[0.01 * lit, 0.018 * lit, 0.01 * lit]} color="#ffd060" look={{basic: true}} shadow={false} />
              <Glow position={[0, 0.05, 0]} size={0.14} color="#ffc060" k={0.8 * lit} />
            </>
          ) : null}
        </group>
      );
    })}
    <group position={[0, 0.11, 0.21]}>
      <Pic size={[0.24, 0.05]} res={[480, 100]} k="cake-plate" draw={drawCake} />
    </group>
  </group>
);

export const familyScene: Scene = {
  view: (v): View => {
    if (v < CAKE - 0.55) return mv(v, S('family'), CAKE - 0.55, [2.0, 1.55, 1.9], [1.6, 1.45, 1.55], [-0.1, 0.95, -0.2], [-0.1, 0.92, -0.25], 42, -0.3);
    return mv(v, CAKE - 0.55, E('family'), [2.3, 2.05, 2.1], [2.0, 1.9, 1.8], [-0.05, 0.85, -0.1], [-0.1, 0.88, -0.15], [44, 42]);
  },
  render: (v) => {
    const lit = ease(v, CAKE, CAKE + 0.25);
    return (
      <>
        <color attach="background" args={['#2a1c18']} />
        <InteriorLights key1={[1.5, 5, 3]} k={0.85} box={4} warm="#ffe0b8" sky="#fff0e0" ground="#6a4a3a" />
        <pointLight position={[0, 2.0, 0]} color="#ffc070" intensity={2.4} distance={5} decay={1.6} castShadow={false} />
        <Room />
        <Table position={[0, 0, 0]} size={[1.7, 1.0]} h={0.72} top="#7a4a2a" cloth="#f4efe4" />
        <group position={[0, 0.724, 0]}>
          <Cake lit={lit} />
        </group>
        {FAM.map((f, i) => (
          <group key={i}>
            <Chair position={f.p} rotation={f.yaw} color="#8a5a34" />
            <Human o={f.o} position={f.p} rotation={f.yaw} pose={famPose(v, i)} head={<Headset color={f.hs} />} />
            <Laptop position={[f.p[0], 0.726, f.p[2] * 0.45]} rotation={f.yaw + Math.PI} k={`fam-lap${i}-${Math.round(v * 6)}`} draw={(g, W, H) => drawGame(g, W, H, v, i)} />
          </group>
        ))}
      </>
    );
  },
};

// ======================================================================= 4. the major: pros banned, the bots win

const STAGE_Y = 0.4;
const SEATS = [-1.2, -0.6, 0, 0.6, 1.2];
const SEAT_Z = -0.55;
const PROS: Outfit[] = SEATS.map((_, i) => ({...guy(i + 10), top: '#f4f4f8', topStyle: 'hoodie', legs: '#2a2a33'}));
const BOTS_IN = shotStart('arena') + 3.6;
const vanishAt = (i: number) => SEATS_BAN + 0.75 + i * 0.07;

const proPose = (v: number, i: number): HumanPose => {
  const k = ease(v, SEATS_BAN + i * 0.06, SEATS_BAN + i * 0.06 + 0.3);
  const p = playPose(v, i + 20);
  return k > 0.02
    ? {...p, head: [lerp(0.08, -0.3, k), 0, 0], armR: [lerp(-0.95, -2.6, k), 0.4, 0], elbowR: lerp(-0.85, -1.6, k), armL: [lerp(-0.95, -2.6, k), 0.4, 0], elbowL: lerp(-0.85, -1.6, k), face: {wide: k, o: k, mouth: 0.8 * k, brow: 0.06 * k, browIn: 0.3 * k, look: [0, 0.4]}}
    : p;
};

const botPose = (v: number, i: number): HumanPose => {
  const stand = ease(v, TROPHY - 0.6, TROPHY - 0.1);
  const lift = ease(v, TROPHY - 0.15, TROPHY + 0.25);
  const cheer = Math.sin((v - TROPHY) * 9 + i) * 0.15 * lift;
  const p = playPose(v, i + 30);
  if (stand < 0.01) return {...p, face: {}};
  const center = i === 2;
  return {
    sit: 1 - stand,
    lean: lerp(0.14, 0, stand),
    head: [lerp(0.08, -0.15 * lift, stand), 0, 0],
    armR: [lerp(-0.95, center ? -2.9 : -2.5 + cheer, lift), lerp(0.18, center ? 0.15 : 0.4, lift), 0],
    elbowR: lerp(-0.85, center ? -0.15 : -0.5, lift),
    armL: [lerp(-0.95, center ? -2.9 : -2.5 - cheer, lift), lerp(0.2, center ? 0.15 : 0.4, lift), 0],
    elbowL: lerp(-0.85, center ? -0.15 : -0.5, lift),
    bob: Math.max(0, Math.sin((v - TROPHY) * 10 + i)) * 0.04 * lift,
  };
};

const BanPlate: React.FC<{position: V3; k: number}> = ({position, k}) =>
  k > 0.01 ? (
    <group position={position} scale={0.4 + 0.6 * k}>
      <RBox size={[0.46, 0.22, 0.03]} r={0.03} color="#c8302a" look={{emissive: '#ff3a2a', emissiveK: 0.4}} />
      <Pic position={[0, 0, 0.0165]} size={[0.42, 0.18]} res={[420, 180]} k="ban-plate" draw={drawSign('БАН', '#d8302a', '#ffffff')} lit={false} glow={1.1} />
      <Glow position={[0, 0, 0.1]} size={0.8} color="#ff4a3a" k={0.4 * k} />
    </group>
  ) : null;

const ARENA_FANS = blobFans([0, 0, 4.4], 2.8, 80, 7, [0, 0, 0]).filter((f) => f.p[2] > 2.2);

export const arenaScene: Scene = {
  view: (v): View => {
    if (v < BOTS_IN - 0.15) return mv(v, S('arena'), BOTS_IN - 0.15, [0.2, 2.7, 5.4], [0.5, 2.35, 3.9], [0, 1.45, -0.4], [0, 1.4, -0.5], [44, 42], 0.3);
    return follow(v, BOTS_IN - 0.15, E('arena'), [-1.5, 1.25, 2.7], [-0.8, 1.15, 2.3], [0, 1.75, SEAT_Z], [44, 42], 1060, 540, 0.2);
  },
  shakes: [
    [SEATS_BAN, 0.25],
    [TROPHY, 0.3],
  ],
  render: (v) => (
    <>
      <color attach="background" args={['#120e1c']} />
      <hemisphereLight color="#b8a8ff" groundColor="#2a1a30" intensity={0.7} />
      <directionalLight position={[2, 6, 6]} color="#fff0e0" intensity={1.8} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-bias={-0.0005} />
      <spotLight position={[-3, 5, 2]} angle={0.5} penumbra={0.6} color="#ff6ad8" intensity={30} distance={14} target-position={[0, 0.5, 0]} />
      <spotLight position={[3, 5, 2]} angle={0.5} penumbra={0.6} color="#4fd8ff" intensity={30} distance={14} target-position={[0, 0.5, 0]} />
      {/* hall + stage */}
      <Block position={[0, -0.05, 2]} size={[12, 0.1, 12]} color="#1e1828" />
      <Block position={[0, 2.5, -2.4]} size={[12, 5, 0.1]} color="#241c34" />
      <RBox position={[0, STAGE_Y / 2, -0.4]} size={[5.2, STAGE_Y, 2.6]} r={0.05} color="#2e2440" />
      <RBox position={[0, STAGE_Y - 0.02, 0.905]} size={[5.2, 0.04, 0.02]} r={0.008} color="#ff4fd8" look={{emissive: '#ff4fd8', emissiveK: 1.2}} shadow={false} />
      <RBox position={[0, 3.0, -2.33]} size={[4.6, 1.2, 0.04]} r={0.02} color="#3a1f6a" />
      <Pic position={[0, 3.0, -2.305]} size={[4.4, 1.1]} res={[1100, 275]} k="major" draw={drawMajor} lit={false} glow={1.05} />
      {[-3.4, 3.4].map((x) => (
        <group key={x} position={[x, 2.2, -2.33]}>
          <RBox size={[1.6, 2.6, 0.04]} r={0.02} color="#1a1426" />
          <Pic position={[0, 0, 0.022]} size={[1.5, 2.5]} res={[300, 500]} k={`side-${x}`} draw={(g, W, H) => drawGame(g, W, H, 1, x > 0 ? 3 : 1)} lit={false} />
        </group>
      ))}
      {/* the team table */}
      <group position={[0, STAGE_Y, 0]}>
        <RBox position={[0, 0.72, -0.15]} size={[3.4, 0.05, 0.75]} r={0.015} color="#1c1d24" />
        <RBox position={[0, 0.36, 0.2]} size={[3.4, 0.7, 0.04]} r={0.015} color="#ffd23f" />
        <Pic position={[0, 0.4, 0.222]} size={[2.6, 0.45]} res={[1040, 180]} k="team" draw={drawSign('КОМАНДА МЕЧТЫ', '#ffd23f', '#3a1f6a')} />
        {SEATS.map((x, i) => (
          <Monitor key={i} position={[x, 0.745, 0.08]} rotation={Math.PI} k="back" draw={(g, W, H) => drawGame(g, W, H, 0, i)} w={0.42} />
        ))}
      </group>
      {SEATS.map((x, i) => {
        const pro = v < vanishAt(i);
        const bot = v >= BOTS_IN;
        return (
          <group key={i}>
            <Chair position={[x, STAGE_Y, SEAT_Z]} rotation={0} office color="#3a1f6a" />
            {pro ? <Human o={PROS[i]} position={[x, STAGE_Y, SEAT_Z]} rotation={0} pose={proPose(v, i)} head={<Headset />} /> : null}
            {bot ? <Bot position={[x, STAGE_Y, SEAT_Z]} rotation={0} pose={botPose(v, i)} handR={i === 2 ? <group rotation={[Math.PI, 0, 0]} position={[0, -0.02, 0.02]}><Trophy scale={1.3} /></group> : undefined} /> : null}
            <BanPlate position={[x, STAGE_Y + 1.75, SEAT_Z]} k={v < BOTS_IN ? ease5(v, SEATS_BAN + i * 0.06, SEATS_BAN + i * 0.06 + 0.25) : 0} />
            <Poof position={[x, STAGE_Y + 1.0, SEAT_Z]} t={v - vanishAt(i)} />
            <Poof position={[x, STAGE_Y + 1.0, SEAT_Z]} t={v - BOTS_IN + 0.2} />
          </group>
        );
      })}
      <Confetti center={[0, STAGE_Y + 2.4, SEAT_Z]} t={v - TROPHY} n={80} />
      <Crowd fans={ARENA_FANS} v={v} jump={v > TROPHY ? 1 : 0.3} phones={0.6} />
    </>
  ),
};
