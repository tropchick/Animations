import React from 'react';
import {Human, HumanPose, Outfit} from '../bear/People';
import {AnyaRoom} from '../bear/Sets';
import {Chair, Table} from '../bear/Props';
import {Ball, Block, Glow, RBox} from '../bear/kit';
import {Scene, blink, ease, ease5, follow, mv} from '../bear/common';
import {humanArmTo} from '../bear/rig';
import {Laptop} from '../cs2/Sets';
import {InteriorLights} from '../cs2/scenes1';
import type {View} from '../slime/camera';
import {CLICK, SIGH, TAKE, V3, VANISH, lerp, lerp3, ramp, shotEnd, shotStart} from './cues';
import {AUTHOR, BALLERINA_COLS, BallerinaToy, BlockyPlayer, Book, Cap, Crumble, GameWorld, KID, LOG_COLS, LogToy, SHARK_COLS, SharkToy} from './Sets';
import {drawBook, drawLaptop} from './tex';
import {Pic} from '../bear/Props';
import {drawGameSign} from './tex';

const S = shotStart;
const E = shotEnd;

export const withArm = (o: Outfit, pos: V3, yaw: number, p: HumanPose, side: 1 | -1, target: V3): HumanPose => {
  const r = humanArmTo(o, pos, yaw, p, side, target);
  return side === 1 ? {...p, armR: r.arm, elbowR: r.elbow} : {...p, armL: r.arm, elbowL: r.elbow};
};

// ======================================================================= 1. the author's room at night

const DESK: V3 = [0, 0, -1.4];
const LAPTOP: V3 = [0, 0.76, -1.45];
const AUTHOR_AT: V3 = [0, 0, -0.78];
// the three brainrots float next to the desk, facing the camera
export const TRIO: {p: V3; yaw: number}[] = [
  {p: [1.45, 0.12, 0.05], yaw: -0.75},
  {p: [1.6, 0.12, -0.45], yaw: 0.35},
  {p: [0.8, 0.12, -0.7], yaw: 0.55},
];

const NightRoom: React.FC<{v: number}> = ({v}) => (
  <>
    <color attach="background" args={['#14122a']} />
    <hemisphereLight color="#8a90d8" groundColor="#2a2040" intensity={0.55} />
    <directionalLight position={[2.5, 4, 3]} color="#b8c0ff" intensity={0.7} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0005} />
    <pointLight position={[0, 1.05, -1.25]} color="#9fc8ff" intensity={0.9} distance={3} decay={1.6} />
    <pointLight position={[1.6, 1.6, -0.2]} color="#ff9fd8" intensity={0.5} distance={4} decay={1.6} />
    <group>
      <Block position={[0, -0.05, 0]} size={[8, 0.1, 6]} color="#5a4a6a" />
      <Block position={[0, 1.5, -2.0]} size={[8, 3, 0.1]} color="#4a3e62" look={{rough: 0.95}} />
      <Block position={[-2.6, 1.5, 0]} size={[0.1, 3, 6]} color="#4a3e62" look={{rough: 0.95}} />
      {/* window with the moon */}
      <group position={[-1.3, 1.75, -1.94]}>
        <RBox size={[1.0, 0.9, 0.05]} r={0.02} color="#6a5a80" />
        <mesh position={[0, 0, 0.028]}>
          <planeGeometry args={[0.88, 0.78]} />
          <meshBasicMaterial color="#1a2250" toneMapped={false} />
        </mesh>
        <Ball position={[0.2, 0.18, 0.03]} scale={[0.09, 0.09, 0.001]} color="#fff4c8" look={{basic: true}} shadow={false} />
      </group>
      <Table position={DESK} size={[1.3, 0.7]} top="#3a2a24" />
      <Chair position={[AUTHOR_AT[0], 0, AUTHOR_AT[2]]} rotation={Math.PI} office color="#2a2a30" />
      {/* an energy can, a mug */}
      <RBox position={[0.45, 0.83, -1.5]} size={[0.07, 0.13, 0.07]} r={0.02} color="#e8453c" />
      <RBox position={[-0.45, 0.81, -1.35]} size={[0.09, 0.1, 0.09]} r={0.03} color="#f4efe6" />
      {/* a poster of nothing in particular */}
      <RBox position={[1.4, 1.7, -1.94]} size={[0.7, 0.9, 0.02]} r={0.01} color="#7a5aa0" />
    </group>
    <Glow position={[0, 0.95, -1.4]} size={1.2} color="#9fc8ff" k={0.25} />
    {v >= 0 ? null : null}
  </>
);

const authorPose = (v: number): HumanPose => {
  const base: HumanPose = {sit: 1, lean: 0.12, head: [0.08, 0, 0], face: {lid: blink(v, 3) * 0.9 + 0.2, look: [0, -0.1], mouth: 0.05}};
  // right hand on the touchpad, moves slightly as the cursor travels
  const cur = ramp(v, S('laptop') + 0.8, CLICK - 0.1);
  const pad: V3 = [LAPTOP[0] - 0.02 + cur * 0.04, LAPTOP[1] + 0.035 + (v > CLICK && v < CLICK + 0.15 ? -0.008 : 0), LAPTOP[2] + 0.1];
  return withArm(AUTHOR, AUTHOR_AT, Math.PI, {...base, armL: [-0.95, 0.15, 0], elbowL: -0.9}, 1, pad);
};

const Trio: React.FC<{v: number; gone?: number}> = ({v, gone = 0}) => {
  const s = 1 - ease(v, VANISH, VANISH + 0.25);
  const hover = (i: number) => Math.sin(v * 2 + i * 1.7) * 0.04;
  return (
    <>
      {s > 0.01 ? (
        <>
          <SharkToy position={[TRIO[0].p[0], TRIO[0].p[1] + hover(0), TRIO[0].p[2]]} rotation={TRIO[0].yaw} scale={s} v={v} />
          <LogToy position={[TRIO[1].p[0], TRIO[1].p[1] + hover(1), TRIO[1].p[2]]} rotation={TRIO[1].yaw} scale={0.85 * s} v={v} />
          <BallerinaToy position={[TRIO[2].p[0], TRIO[2].p[1] + hover(2), TRIO[2].p[2]]} rotation={TRIO[2].yaw} scale={0.95 * s} v={v} />
          {TRIO.map((t, i) => (
            <Glow key={i} position={[t.p[0], 0.05, t.p[2]]} size={0.8} color={['#7fc8ff', '#ffc87a', '#ff9fd8'][i]} k={0.25 * s} />
          ))}
        </>
      ) : null}
      <Crumble center={TRIO[0].p} t={v - VANISH} colors={SHARK_COLS} h={0.85} w={0.35} seed={1} />
      <Crumble center={TRIO[1].p} t={v - VANISH - 0.08} colors={LOG_COLS} h={0.95} w={0.25} seed={2} />
      <Crumble center={TRIO[2].p} t={v - VANISH - 0.16} colors={BALLERINA_COLS} h={0.95} w={0.25} seed={3} />
      {gone ? null : null}
    </>
  );
};

const lapDraw = (v: number) => {
  const cur = ease5(v, S('laptop') + 0.8, CLICK - 0.1);
  const clicked = v >= CLICK ? v - CLICK : 0;
  return {key: `lap-${Math.round(cur * 40)}-${clicked > 0 ? (clicked < 0.25 ? 1 : 2) : 0}`, draw: (g: CanvasRenderingContext2D, W: number, H: number) => drawLaptop(g, W, H, cur, clicked)};
};

const AuthorSet: React.FC<{v: number}> = ({v}) => {
  const l = lapDraw(v);
  return (
    <>
      <NightRoom v={v} />
      <Laptop position={LAPTOP} k={l.key} draw={l.draw} />
      <Human o={AUTHOR} position={AUTHOR_AT} rotation={Math.PI} pose={authorPose(v)} />
      <Trio v={v} />
    </>
  );
};

export const trioScene: Scene = {
  view: (v): View => mv(v, S('trio'), E('trio'), [3.3, 1.65, 3.2], [2.9, 1.5, 2.7], [1.3, 0.6, -0.4], [1.35, 0.58, -0.4], [44, 42], 0.3),
  render: (v) => <AuthorSet v={v} />,
};

export const laptopScene: Scene = {
  view: (v): View => mv(v, S('laptop'), E('laptop'), [0.42, 1.1, -0.92], [0.24, 1.03, -1.06], [0.0, 0.89, -1.57], [0.01, 0.88, -1.57], [40, 38]),
  noHandheld: true,
  render: (v) => <AuthorSet v={v} />,
};

export const vanishScene: Scene = {
  view: (v): View => mv(v, S('vanish'), E('vanish'), [2.8, 1.45, 2.6], [3.1, 1.55, 3.0], [1.3, 0.6, -0.4], [1.3, 0.55, -0.4], [46, 48]),
  shakes: [[VANISH, 0.25]],
  render: (v) => <AuthorSet v={v} />,
};

// ======================================================================= 2. the game that never came out

const SunLights: React.FC = () => (
  <>
    <hemisphereLight color="#dff0ff" groundColor="#6a8a4a" intensity={1.1} />
    <directionalLight position={[5, 9, 6]} color="#fff4dc" intensity={2.0} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-bias={-0.0005} />
  </>
);

export const gameScene: Scene = {
  view: (v): View => mv(v, S('game'), E('game'), [2.6, 2.3, 4.9], [1.1, 1.9, 4.2], [0, 1.25, -2.8], [-0.1, 1.3, -2.8], [50, 48], 0.4),
  render: (v) => (
    <>
      <SunLights />
      <GameWorld v={v} />
      <group position={[0, 0, -3.3]}>
        <Block position={[-1.5, 1.0, 0]} size={[0.12, 2.0, 0.12]} color="#2a2b33" />
        <Block position={[1.5, 1.0, 0]} size={[0.12, 2.0, 0.12]} color="#2a2b33" />
        <Pic position={[0, 2.15, 0.07]} size={[3.2, 0.8]} res={[800, 200]} k="gamesign" draw={drawGameSign} />
      </group>
      <BlockyPlayer position={[-1.0, 0, -1.3]} rotation={0.5} color="#e8453c" v={v} seed={1} />
      <BlockyPlayer position={[0.95, 0, -1.1]} rotation={-0.4} color="#2f6fd8" v={v} seed={2} />
    </>
  ),
};

// ======================================================================= 3. the kid's room: bored, then the textbook

export const KID_BED: V3 = [0.95, 0.18, -0.62];
const NIGHTSTAND_BOOK: V3 = [1.6, 0.62, -0.78];

const kidBedPose = (v: number): HumanPose => {
  const slump = ease(v, SIGH - 0.3, SIGH + 0.2);
  const reach = ease(v, TAKE - 0.35, TAKE);
  const hold = ease(v, TAKE + 0.15, TAKE + 0.6);
  const p: HumanPose = {
    sit: 1,
    lean: lerp(0.0, -0.18, slump) + 0.25 * hold,
    head: [lerp(-0.05, -0.32, slump) * (1 - hold) + 0.45 * hold, lerp(0, 0.5, reach) * (1 - hold), 0],
    twist: 0.25 * reach * (1 - hold),
    armL: [lerp(0.1, 0.25, slump), 0.25, 0],
    elbowL: -0.2,
    armR: [lerp(0.1, 0.25, slump), 0.25, 0],
    elbowR: -0.2,
    face: {lid: 0.35 * slump * (1 - hold) + blink(v, 1) * 0.9, look: [0.3 * reach * (1 - hold), 0.5 * slump * (1 - hold) - 0.3 * hold], mouth: 0.1, smile: -0.4 * slump * (1 - hold) + 0.3 * hold, browIn: 0.3 * slump * (1 - hold)},
  };
  if (reach > 0 && hold < 1) {
    const r = withArm(KID, KID_BED, 0, p, 1, bookPos(v));
    const k = reach * (1 - hold);
    p.armR = [lerp(p.armR![0], r.armR![0], k), lerp(p.armR![1], r.armR![1], k), 0];
    p.elbowR = lerp(p.elbowR!, r.elbowR!, k);
  }
  if (hold > 0) {
    const l = withArm(KID, KID_BED, 0, p, -1, [KID_BED[0] - 0.12, 0.66, KID_BED[2] + 0.3]);
    const r = withArm(KID, KID_BED, 0, p, 1, [KID_BED[0] + 0.12, 0.66, KID_BED[2] + 0.3]);
    p.armL = [lerp(p.armL![0], l.armL![0], hold), lerp(p.armL![1], l.armL![1], hold), 0];
    p.elbowL = lerp(p.elbowL!, l.elbowL!, hold);
    p.armR = [lerp(p.armR![0], r.armR![0], hold), lerp(p.armR![1], r.armR![1], hold), 0];
    p.elbowR = lerp(p.elbowR!, r.elbowR!, hold);
  }
  return p;
};
const bookPos = (v: number): V3 => lerp3(NIGHTSTAND_BOOK, [KID_BED[0], 0.68, KID_BED[2] + 0.32], ease(v, TAKE, TAKE + 0.55));

export const BedRoom: React.FC<{v: number}> = ({v}) => {
  const bp = bookPos(v);
  const open = ease(v, TAKE + 0.5, TAKE + 0.9);
  return (
    <>
      <color attach="background" args={['#efd9bd']} />
      <InteriorLights key1={[3, 5, 4]} k={0.95} box={4} />
      <AnyaRoom />
      <Human o={KID} position={KID_BED} pose={kidBedPose(v)} head={<Cap />} />
      {/* phone face down on the bed */}
      <RBox position={[0.45, 0.6, -0.75]} rotation={[0, 0.4, 0]} size={[0.075, 0.01, 0.155]} r={0.004} color="#1c1d24" />
      {/* the textbook: cover up on the nightstand, then it opens towards the kid */}
      <group position={bp} rotation={[lerp(0, -0.9, ease(v, TAKE + 0.3, TAKE + 0.6)), lerp(0.3, 0, ease(v, TAKE, TAKE + 0.5)), 0]}>
        <Book color="#2f6fd8" size={[0.22, 0.035, 0.29]} />
        <Pic position={[0, 0.019, 0]} rotation={[-Math.PI / 2, 0, 0]} size={[0.2, 0.27]} res={[200, 270]} k="mathbook" draw={drawBook('АЛГЕБРА', '#2f6fd8')} />
        {open > 0 ? <Block position={[0, 0.02 + open * 0.03, 0]} size={[0.2, 0.004, 0.27]} color="#f8f4ea" /> : null}
      </group>
    </>
  );
};

export const bedScene: Scene = {
  view: (v): View => follow(v, S('bed'), E('bed'), [1.65, 1.2, 1.65], [1.3, 1.1, 1.2], [KID_BED[0] + 0.05, 0.95, KID_BED[2]], [44, 42], 930),
  render: (v) => <BedRoom v={v} />,
};
