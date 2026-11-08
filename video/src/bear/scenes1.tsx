import React from 'react';
import {Bear, BearPose} from './Bear';
import {ANYA, Human, HumanPose, walkPose} from './People';
import {AnyaRoom} from './Sets';
import {Beams, Bush, FallingLeaves, ForestLight, ForestPatch, Ground, Haze, LeafLitter, Motes, Path, Sky, TreeWall} from './Forest';
import {HoneyBar, Phone, PhoneScreen, SelfieStick, Wrapper} from './Props';
import {Glow} from './kit';
import {drawPost} from './tex';
import {CATCH, CHEW, GRAB, JUMP, PAW, POST, REPLY, RISE, ROAR, RUSTLE, SIT, THROW, TYPE, V3, WALK, WRAP_LAND, clamp01, lerp, lerp3, ramp, shotEnd, shotStart} from './cues';
import {Scene, aim, blink, chatter, ease, ease5, local, mv, yawTo} from './common';
import {at, bearHand, bearHead, bearMouth, dirOf, humanHand, humanHead, inside} from './rig';
import type {View} from '../slime/camera';

const S = shotStart;
const E = shotEnd;
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

// ---------------------------------------------------------------- the forest where it all happens
// The path runs along z. Аня walks towards +z; the bush (and the bear behind it) is on the −x side.

export const PATH_PTS: V3[] = [
  [0.3, 0, 12],
  [0.1, 0, 6],
  [0, 0, 1.5],
  [0.3, 0, -3],
  [-0.4, 0, -8],
  [-1.6, 0, -14],
  [-0.5, 0, -22],
];
const pathX = (z: number) => (z > -3 ? 0.1 : 0.1 + 0.11 * (z + 3));
const nearPath = (x: number, z: number) => Math.abs(x - pathX(z)) < 1.7 && z > -24 && z < 14;

export const BUSH: V3 = [-1.05, 0, -2.4];
const BEAR_HIDE: V3 = [-1.0, 0, -3.05];
const STOP_Z = 1.6;

// the den clearing: a path to the door, no trees on the mound or in the river
const DEN_PATH: V3[] = [[0.3, 0, 16], [0.1, 0, 8], [0, 0, 2.4]];
// (and nothing on the drone's way up from the sign)
const denAvoid = (x: number, z: number) => Math.hypot(x, z * 1.1) < 4.4 || Math.abs(z + 5.2) < 2.4 || (Math.abs(x - 0.15) < 1.7 && z > 1.5) || (x > -2.5 && x < 8.5 && z > 3 && z < 15);

export const ForestWorld: React.FC<{v: number; center?: V3; gust?: number; leaves?: number; beams?: number; bushShake?: number; noBush?: boolean; den?: boolean; shadowBox?: number; extra?: React.ReactNode}> = ({
  v,
  center = [0, 0, 0],
  gust = 0,
  leaves = 1,
  beams = 1,
  bushShake = 0,
  noBush,
  den,
  shadowBox = 8,
  extra,
}) => (
  <>
    <ForestLight center={center} shadowBox={shadowBox} />
    <Sky />
    <Haze />
    <Ground />
    <Path pts={den ? DEN_PATH : PATH_PTS} />
    <LeafLitter center={[center[0], 0, center[2]]} r={10} n={1600} avoid={den ? (x, z) => (Math.abs(x - 0.15) < 0.55 && z > 2.2) || Math.hypot(x, z * 1.1) < 2.4 || Math.abs(z + 5.2) < 1.8 : (x, z) => Math.abs(x - pathX(z)) < 0.55} />
    <ForestPatch center={[0, 0, -2]} r0={den ? 4 : 2.6} r1={17} n={34} avoid={den ? denAvoid : (x, z) => nearPath(x, z) || Math.hypot(x - BUSH[0], z - BUSH[2]) < 1.7} />
    <TreeWall n={170} r0={18} r1={44} />
    {noBush || den ? null : (
      <>
        <Bush position={BUSH} scale={1.3} seed={7} shake={bushShake} />
        <Bush position={[BUSH[0] - 0.95, 0, BUSH[2] - 0.45]} scale={1.05} seed={11} shake={bushShake * 0.6} />
        <Bush position={[1.9, 0, -1.4]} scale={0.9} seed={13} />
      </>
    )}
    {leaves > 0 ? <FallingLeaves v={v} center={[center[0], 0, center[2]]} box={[9, 5.5, 9]} n={Math.round(80 * leaves)} gust={gust} /> : null}
    {beams > 0 ? <Beams center={[center[0] - 1, 0, center[2] - 3]} k={0.14 * beams} /> : null}
    <Motes v={v} center={[center[0], 0.4, center[2]]} box={[6, 3.5, 6]} n={30} />
    {extra}
  </>
);

// ---------------------------------------------------------------- 1. the phone: the comment and «Докажи»

const ROOM_A: V3 = [0.2, 0, -0.32];
const PHONE_AT: V3 = [-0.03, -0.045, 0.02];
const PHONE_ROT: V3 = [-0.35, 0.25, 0.15];
const POV_END = 5.15;

const phoneDraw = (v: number) => (g: CanvasRenderingContext2D, W: number, H: number) =>
  drawPost(g, W, H, ramp(v, TYPE[0], TYPE[1]), ramp(v, POST - 0.05, POST + 0.35), ramp(v, REPLY - 0.05, REPLY + 0.6));
const phoneKey = (v: number) => `post-${Math.round(ramp(v, TYPE[0], TYPE[1]) * 19)}-${Math.round(ramp(v, POST - 0.05, POST + 0.35) * 12)}-${Math.round(ramp(v, REPLY - 0.05, REPLY + 0.6) * 20)}`;

const roomAnya = (v: number): HumanPose => {
  const up = ease(v, JUMP - 0.15, JUMP + 0.35);
  const squint = ease(v, REPLY + 0.35, REPLY + 0.8);
  const tap = v > TYPE[0] && v < TYPE[1] ? Math.abs(Math.sin(v * 22)) * 0.05 : 0;
  const lookUp = ease(v, POV_END + 0.1, POV_END + 0.5);
  return {
    sit: 1 - up,
    lean: lerp(0.18, 0.02, up),
    head: [lerp(0.42, 0.02, lookUp), lerp(0, -0.12, squint) * (1 - up), 0.06 * squint * (1 - up)],
    armR: [lerp(-0.75, -0.5, up), 0.12, -0.25],
    elbowR: -1.45 + tap,
    // she jumps up with a fist pump: challenge accepted
    armL: [lerp(-0.7, -2.5, up), lerp(0.12, 0.25, up), 0.25],
    elbowL: lerp(-1.4, -1.9, up),
    face: {
      look: [lerp(0, 0.1, squint), lerp(-0.35, 0.02, lookUp)],
      smile: lerp(0.3, 0.75, squint),
      lid: Math.max(0.38 * squint, blink(v, 1)),
      tilt: 0.35 * squint,
      browIn: -0.3 * squint,
      brow: 0.02 * squint,
      mouth: v > POST - 0.2 && v < POST + 0.1 ? 0.2 : 0,
    },
  };
};
const roomPos = (v: number): V3 => [ROOM_A[0], 0, ROOM_A[2] + ease(v, JUMP, JUMP + 0.4) * 0.15];
const phoneFrame = (v: number) => inside(humanHand(ANYA, roomPos(v), 0, roomAnya(v), 1), PHONE_AT, PHONE_ROT);
const anyaRoomHead = (v: number) => at(humanHead(ANYA, roomPos(v), 0, roomAnya(v)));

const phoneView = (v: number): View => {
  if (v < POV_END) {
    // looking straight at the screen, as she does; a slow push in
    const M = phoneFrame(0.3);
    const c = at(M, [0, -0.004, 0.005]);
    const n = dirOf(M, [0, 0, 1]);
    const up = dirOf(M, [0, 1, 0]);
    const right = dirOf(M, [1, 0, 0]);
    const k = ease5(v, 0, POV_END);
    const d = lerp(0.43, 0.39, k);
    const pos = add(add(c, n, d), right, 0.006 * Math.sin(v * 0.9));
    return {pos, target: add(c, up, -0.004), up, fov: 30, far: 60};
  }
  // her face: she reads «Докажи», squints, smirks, jumps up (the camera catches up a beat later)
  const h = anyaRoomHead(v - 0.12);
  const h0 = anyaRoomHead(POV_END);
  const rise = ease(v, JUMP + 0.05, JUMP + 0.6);
  const pos: V3 = [h0[0] + 0.16, lerp(h0[1] - 0.06, h[1] - 0.02, rise), h0[2] + lerp(0.95, 1.3, rise) - 0.05 * ease(v, POV_END, JUMP)];
  return {pos, target: [h[0] + 0.02, h[1] - 0.03 - 0.12 * rise, h[2]], fov: lerp(34, 40, rise), far: 60};
};

export const phoneScene: Scene = {
  view: phoneView,
  probe: (v) => ({head: anyaRoomHead(v), phone: at(phoneFrame(v))}),
  render: (v) => (
    <>
      <hemisphereLight color="#fff1dc" groundColor="#7a5a40" intensity={1.25} />
      <directionalLight position={[-6, 4, 1]} color="#ffe2b8" intensity={1.9} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-3} shadow-camera-right={3} shadow-camera-top={3} shadow-camera-bottom={-3} shadow-bias={-0.0005} />
      <directionalLight position={[3, 3, 5]} color="#ffeedd" intensity={0.5} />
      <color attach="background" args={['#2a2420']} />
      <AnyaRoom />
      <Human
        o={ANYA}
        position={roomPos(v)}
        pose={roomAnya(v)}
        noHead={v < POV_END}
        handR={
          <Phone position={PHONE_AT} rotation={PHONE_ROT}>
            <PhoneScreen draw={phoneDraw(v)} k={phoneKey(v)} />
          </Phone>
        }
      />
    </>
  ),
};

// ---------------------------------------------------------------- 2-3. the selfie stream in the forest, the bear rises behind her

const WALK_END = 10.55;
const anyaZ = (v: number) => {
  // walks at 0.68 m/s with a soft start and stop
  const a = WALK[0] + 0.2;
  const d = (t: number) => 0.68 * (Math.min(WALK_END, Math.max(a, t)) - a);
  return STOP_Z - d(99) + d(v) - 0.1 * (1 - ease(v, WALK[0], WALK[0] + 0.6));
};
export const anyaPos = (v: number): V3 => [0.02, 0, anyaZ(v)];

const selfiePose = (v: number): HumanPose => {
  const walking = v < WALK_END + 0.05;
  const ph = (v - WALK[0]) / (0.43 * 2);
  const wk = walking ? walkPose(ph, ease(v, WALK[0], WALK[0] + 0.4) * (1 - ease(v, WALK_END - 0.35, WALK_END + 0.05))) : walkPose(0, 0);
  const scare = ease(v, ROAR[0] + 0.05, ROAR[0] + 0.3);
  const unaware = v < ROAR[0];
  return {
    ...wk,
    head: [0.02 - 0.1 * scare, 0.1 - 0.1 * scare + Math.sin(v * 2.1) * 0.05 * (1 - scare), Math.sin(v * 1.3) * 0.07 * (1 - scare)],
    // right arm holds the stick out towards the camera
    armR: [-1.3 - 0.08 * scare, 0.35, 0.3],
    elbowR: -0.15,
    armL: unaware ? [-0.5 + Math.sin(v * 4.2) * 0.35, 0.35 + Math.sin(v * 3.1) * 0.2, 0] : [lerp(-0.4, -2.3, scare), 0.55, 0],
    elbowL: unaware ? -1.0 + Math.sin(v * 5) * 0.3 : lerp(-1.0, -0.5, scare),
    wind: ease(v, ROAR[0] + 0.1, ROAR[0] + 0.35) * (1 - ease(v, ROAR[1] + 0.2, ROAR[1] + 0.8)),
    face: unaware
      ? {smile: 0.75, mouth: chatter(v, v > 7.0 ? 1 : 0.4), lid: blink(v, 2), happy: 0.25, look: [0.12, -0.02]}
      : {wide: scare, mouth: 0.4 + 0.5 * scare, o: 1, brow: 0.06 * scare, browIn: 0.25 * scare, look: [0.05, 0.02], blush: 0.2},
  };
};

const bearHideYaw = yawTo(BEAR_HIDE, [0.02, 0, STOP_Z]);
const bearRise = (v: number): {y: number; pose: BearPose} => {
  const r = ease5(v, RISE[0], RISE[1]);
  const roar = ease(v, ROAR[0] - 0.12, ROAR[0] + 0.12) * (1 - ease(v, ROAR[1] - 0.25, ROAR[1] + 0.25));
  const arms = ease(v, ROAR[0] - 0.3, ROAR[0] + 0.1) * (1 - ease(v, ROAR[1] - 0.1, ROAR[1] + 0.5));
  const shake = roar * Math.sin(v * 38) * 0.04;
  return {
    y: lerp(-2.3, 0, r),
    pose: {
      lean: lerp(0.5, 0.05, r) - 0.18 * roar,
      head: [lerp(0.3, 0.0, r) - 0.25 * roar + shake, 0.1 * (1 - r), shake],
      jaw: roar * 1.1,
      armL: [lerp(0.05, -2.55, arms), lerp(0.12, 0.55, arms)],
      armR: [lerp(0.05, -2.55, arms), lerp(0.12, 0.55, arms)],
      elbowL: lerp(-0.2, -0.5, arms),
      elbowR: lerp(-0.2, -0.5, arms),
      face: {
        lid: 0.55 * roar + blink(v, 3) * (1 - roar),
        tilt: 0.35 * roar,
        browIn: -0.5 * roar,
        brow: 0.02 * (1 - roar),
        look: [0.1 * (1 - roar), -0.1],
      },
      ears: roar,
      breathe: v,
    },
  };
};

const selfieView = (v: number): View => {
  const A = anyaPos(v);
  const bob = v < WALK_END ? Math.sin(((v - WALK[0]) / 0.43) * Math.PI) * 0.018 * ease(v, WALK[0], WALK[0] + 0.4) : 0;
  const sway = Math.sin(v * 1.7) * 0.02;
  const pos: V3 = [A[0] - 0.13 + sway, 1.47 + bob, A[2] + 1.3];
  // the roar: a crash zoom towards him
  const z = ease(v, ROAR[0] - 0.05, ROAR[0] + 0.2) * (1 - ease(v, ROAR[1] + 0.1, ROAR[1] + 0.5));
  const t: V3 = [pos[0] - 0.02 - 0.12 * z, pos[1] - 0.08 + bob * 0.3 + 0.15 * z, pos[2] - 3];
  return {pos, target: t, fov: lerp(62, 52, z), far: 900, up: [Math.sin(v * 1.1) * 0.03, 1, 0]};
};

const selfieProbe = (v: number) => {
  const br = bearRise(v);
  return {face: at(humanHead(ANYA, anyaPos(v), 0, selfiePose(v))), bearHead: at(bearHead([BEAR_HIDE[0], br.y, BEAR_HIDE[2]], bearHideYaw, br.pose)), bush: [BUSH[0], 1.3, BUSH[2]] as V3};
};

export const pathScene: Scene = {
  view: selfieView,
  shakes: [],
  probe: selfieProbe,
  render: (v) => (
    <>
      <ForestWorld v={v} center={[0, 0, 0]} bushShake={v > RUSTLE ? (v - RUSTLE) * 1.5 : 0} />
      <Human o={ANYA} position={anyaPos(v)} rotation={0} pose={selfiePose(v)} handR={<SelfieStick len={0.9} />} />
    </>
  ),
};

export const riseScene: Scene = {
  view: selfieView,
  shakes: [
    [ROAR[0] + 0.05, 1.4],
    [ROAR[0] + 0.5, 0.8],
  ],
  probe: selfieProbe,
  render: (v) => {
    const br = bearRise(v);
    const gust = ease(v, ROAR[0], ROAR[0] + 0.3) * (1 - ease(v, ROAR[1], ROAR[1] + 1));
    return (
      <>
        <ForestWorld v={v} center={[0, 0, 0]} gust={2.5 * gust} leaves={1 + gust} bushShake={v < RISE[1] + 0.3 ? 1.5 + (v - RUSTLE) : 0} />
        <Bear position={[BEAR_HIDE[0], br.y, BEAR_HIDE[2]]} rotation={bearHideYaw} pose={br.pose} />
        <Human o={ANYA} position={anyaPos(v)} rotation={0} pose={selfiePose(v)} handR={<SelfieStick len={0.9} />} />
      </>
    );
  },
};

// ---------------------------------------------------------------- 4. she throws a honey bar, he catches it

export const A_STOP: V3 = [0.02, 0, STOP_Z];
const BEAR_CATCH: V3 = [-0.25, 0, -1.85];
export const ANYA_TURNED = yawTo(A_STOP, BEAR_CATCH);
const BEAR_CATCH_YAW = yawTo(BEAR_CATCH, A_STOP);

const throwPose = (v: number): HumanPose => {
  const reach = ease(v, GRAB - 0.1, GRAB + 0.3);
  const wind = ease(v, GRAB + 0.3, THROW - 0.12);
  const fling = ease(v, THROW - 0.12, THROW + 0.1);
  const relief = ease(v, CATCH + 0.1, CATCH + 0.6);
  // the left hand goes to the pocket, winds up over the shoulder and flings
  const pitch = lerp(lerp(0.0, 0.35, reach), lerp(-2.75, -1.25, fling), wind);
  return {
    lean: 0.06 - 0.1 * wind + 0.18 * fling - 0.1 * relief,
    twist: 0.25 * wind - 0.45 * fling,
    head: [0.02, 0, 0],
    armL: [pitch, lerp(0.2, 0.15, wind), 0],
    elbowL: lerp(lerp(-0.3, -0.5, reach), lerp(-1.7, -0.15, fling), wind),
    armR: [-0.55, 0.35, 0],
    elbowR: -0.9,
    legL: -0.25 * fling,
    legR: 0.15,
    kneeL: 0.15,
    kneeR: 0.12,
    face: {wide: 1 - relief * 0.5, mouth: lerp(0.5, 0.15, relief), o: 1 - relief, brow: 0.06 * (1 - relief), browIn: 0.3, look: [0, 0.1]},
  };
};

const catchPose = (v: number): BearPose => {
  const lean = ease(v, THROW, CATCH - 0.15) * (1 - ease(v, CATCH + 0.2, CATCH + 0.8));
  const open = ease(v, THROW + 0.2, CATCH - 0.12) * (1 - ease(v, CATCH - 0.06, CATCH));
  const chewing = v > CHEW[0] && v < CHEW[1] ? 0.12 + 0.12 * Math.abs(Math.sin((v - CHEW[0]) * 13)) : 0;
  const happy = ease(v, CATCH + 0.2, CATCH + 0.6);
  return {
    lean: 0.28 * lean,
    head: [0.1 * lean - 0.08 * open, 0, 0.12 * happy * Math.sin(v * 3)],
    jaw: open * 0.85 + chewing,
    face: {happy: 0.5 * happy, lid: 0.2 * happy, brow: 0.03 * happy + 0.05 * open, wide: 0.5 * open, chew: chewing > 0 ? Math.sin((v - CHEW[0]) * 13) : 0, look: [0, 0.1]},
    armL: [lerp(0.05, -0.6, open) - 0.3 * happy, 0.3 + 0.2 * happy],
    armR: [lerp(0.05, -0.6, open) - 0.3 * happy, 0.3 + 0.2 * happy],
    elbowL: -0.4 - 0.6 * happy,
    elbowR: -0.4 - 0.6 * happy,
    breathe: v,
    ears: happy * Math.sin(v * 7) * 0.6,
  };
};

const BAR_START = at(humanHand(ANYA, A_STOP, ANYA_TURNED, throwPose(THROW), -1));
const BAR_END = bearMouth(BEAR_CATCH, BEAR_CATCH_YAW, catchPose(CATCH));
const barFlight = (v: number): V3 | null => {
  if (v < THROW || v > CATCH) return null;
  const k = ramp(v, THROW, CATCH);
  const p = lerp3(BAR_START, BAR_END, k);
  p[1] += Math.sin(k * Math.PI) * 0.45;
  return p;
};

export const throwScene: Scene = {
  view: (v) => {
    // from behind her, wide: she throws, the bar flies; after the catch a punch-in on his happy face
    const cam0 = local(A_STOP, ANYA_TURNED, [0.42, 1.62, -3.1]);
    const cam1 = local(A_STOP, ANYA_TURNED, [0.36, 1.6, -2.75]);
    const t0: V3 = [BEAR_CATCH[0] * 0.8, 1.3, BEAR_CATCH[2] + 1.2];
    if (v < CATCH + 0.05) return mv(v, S('throw'), CATCH + 0.05, cam0, cam1, t0, [t0[0], 1.4, t0[2]], 40);
    const head = at(bearHead(BEAR_CATCH, BEAR_CATCH_YAW, catchPose(v)));
    return mv(v, CATCH + 0.05, CATCH + 0.4, cam1, local(A_STOP, ANYA_TURNED, [0.3, 1.66, -2.6]), [t0[0], 1.4, t0[2]], [head[0], head[1] - 0.05, head[2]], [40, 13]);
  },
  shakes: [[CATCH, 0.35]],
  probe: (v) => ({face: at(humanHead(ANYA, A_STOP, ANYA_TURNED, throwPose(v))), bearHead: at(bearHead(BEAR_CATCH, BEAR_CATCH_YAW, catchPose(v))), bar: barFlight(v) ?? BAR_START}),
  render: (v) => {
    const fl = barFlight(v);
    return (
      <>
        <ForestWorld v={v} center={[0, 0, 0]} />
        <Bear position={BEAR_CATCH} rotation={BEAR_CATCH_YAW} pose={catchPose(v)} />
        <Human o={ANYA} position={A_STOP} rotation={ANYA_TURNED} pose={throwPose(v)} handL={v < THROW && v > GRAB + 0.15 ? <HoneyBar rotation={[0, 0, 1.2]} /> : null} handR={<SelfieStick len={0.9} tilt={0.5} />} />
        {fl ? <HoneyBar position={fl} rotation={[v * 14, v * 9, 0.3]} scale={1.7} /> : null}
        {fl
          ? [0.04, 0.08, 0.12, 0.16].map((dt, i) => {
              const p = barFlight(Math.max(THROW, v - dt));
              return p ? <Glow key={i} position={p} size={0.3 - i * 0.05} color="#ffc23a" k={0.55 - i * 0.12} /> : null;
            })
          : null}
      </>
    );
  },
};

// ---------------------------------------------------------------- 5. the wrapper lands: «МЁД»

const WRAP_AT: V3 = [-0.42, 0.012, -1.18];

export const wrapperScene: Scene = {
  view: (v) => mv(v, S('wrapper'), E('wrapper'), [WRAP_AT[0] + 0.06, 0.62, WRAP_AT[2] + 0.5], [WRAP_AT[0] + 0.04, 0.46, WRAP_AT[2] + 0.36], [WRAP_AT[0], 0.06, WRAP_AT[2] - 0.04], [WRAP_AT[0], 0.0, WRAP_AT[2] + 0.02], [40, 36]),
  probe: () => ({wrap: WRAP_AT}),
  render: (v) => {
    const k = ramp(v, S('wrapper') - 0.45, WRAP_LAND);
    const fall = k * (0.4 + 0.6 * k);
    const wob = (1 - k) * Math.sin(v * 9) * 0.5;
    const pos: V3 = [WRAP_AT[0] + Math.sin(v * 5) * 0.12 * (1 - k), lerp(1.3, WRAP_AT[1], fall), WRAP_AT[2] + Math.cos(v * 4) * 0.05 * (1 - k)];
    const rot: V3 = v < WRAP_LAND ? [-Math.PI / 2 + wob, Math.sin(v * 3) * 0.6 * (1 - k), 0.3 + wob * 0.5] : [-Math.PI / 2 + 0.04, 0, 0.3];
    const bounce = v > WRAP_LAND ? Math.max(0, Math.sin((v - WRAP_LAND) * 18)) * Math.exp(-(v - WRAP_LAND) * 9) * 0.02 : 0;
    return (
      <>
        <ForestWorld v={v} center={[0, 0, 0]} />
        <LeafLitter center={WRAP_AT} r={0.9} n={140} seed={17} avoid={(x, z) => Math.hypot(x - WRAP_AT[0], z - WRAP_AT[2]) < 0.16} />
        <Bear position={BEAR_CATCH} rotation={BEAR_CATCH_YAW} pose={{breathe: v, jaw: 0.15 + 0.1 * Math.abs(Math.sin(v * 13)), face: {happy: 0.5, lid: 0.2}}} />
        <Wrapper position={[pos[0], pos[1] + bounce, pos[2]]} rotation={rot} scale={1.6} />
      </>
    );
  },
};

// ---------------------------------------------------------------- 6. he sits like a dog and asks for another one

const BEAR_SIT: V3 = [-0.5, 0, -1.2];
const BEAR_SIT_YAW = yawTo(BEAR_SIT, A_STOP);
const ANYA_SIT_YAW = yawTo(A_STOP, BEAR_SIT);
const MELT = 21.05;

const sitPose = (v: number): BearPose => {
  const down = ease5(v, SIT - 0.45, SIT);
  const paw = ease5(v, PAW - 0.15, PAW + 0.45);
  const settle = v > SIT ? Math.sin((v - SIT) * 16) * Math.exp(-(v - SIT) * 7) * 0.05 : 0;
  return {
    sit: down,
    lean: -0.05 + settle + 0.1 * paw,
    head: [0.08 * paw, 0, 0.22 * paw + Math.sin(v * 1.5) * 0.03],
    armL: [lerp(0.05, -1.3, paw), lerp(0.15, -0.45, paw)],
    elbowL: lerp(-0.2, -0.15, paw),
    armR: [lerp(0.05, -0.35, down), 0.2],
    elbowR: -0.5,
    jaw: v < SIT ? 0.12 : 0.04,
    face: {wide: 0.5 * paw, browIn: 0.45 * paw, brow: 0.03 * paw, look: [0, 0.05], smile: 0.3, lid: blink(v, 5)},
    ears: paw * Math.sin(v * 6) * 0.5,
    breathe: v,
  };
};

const sitAnya = (v: number): HumanPose => {
  const melt = ease(v, MELT, MELT + 0.5);
  return {
    head: [0.05, 0.0, 0.14 * melt],
    armL: [lerp(0.05, -1.2, melt), lerp(0.12, 0.25, melt), lerp(0, 0.2, melt)],
    elbowL: lerp(-0.25, -1.9, melt),
    armR: [lerp(-0.4, -1.2, melt), 0.25, 0.2],
    elbowR: lerp(-1.2, -1.9, melt),
    face: {wide: 0.8 * (1 - melt), mouth: 0.25 * (1 - melt), o: 1 - melt, smile: 0.9 * melt, happy: 0.7 * melt, blush: 0.4 + 0.6 * melt, tilt: 0.2 * melt},
  };
};

export const sitScene: Scene = {
  view: (v) => {
    if (v < MELT) {
      // over her shoulder, a little low: he sits like a dog and holds the paw out to her (and to us)
      const c0 = local(A_STOP, ANYA_SIT_YAW, [-0.6, 1.2, -1.45]);
      const c1 = local(A_STOP, ANYA_SIT_YAW, [-0.42, 1.24, -0.95]);
      const t0 = local(BEAR_SIT, BEAR_SIT_YAW, [0.1, 1.2, 0]);
      const t1 = local(BEAR_SIT, BEAR_SIT_YAW, [0.1, 1.15, 0.3]);
      return mv(v, S('sit'), MELT, c0, c1, t0, t1, [42, 38], 0.15);
    }
    // her: melted
    const h = at(humanHead(ANYA, A_STOP, ANYA_SIT_YAW, sitAnya(v)));
    const c = local(A_STOP, ANYA_SIT_YAW, [0.12, 1.32, 1.1]);
    const m = mv(v, MELT, E('sit'), c, local(A_STOP, ANYA_SIT_YAW, [0.1, 1.33, 0.92]), h, h, 34);
    return {...m, target: aim(m.pos, h, m.fov, 760, 540)};
  },
  shakes: [[SIT, 0.3]],
  probe: (v) => ({face: at(humanHead(ANYA, A_STOP, ANYA_SIT_YAW, sitAnya(v))), bearHead: at(bearHead(BEAR_SIT, BEAR_SIT_YAW, sitPose(v))), paw: at(bearHand(BEAR_SIT, BEAR_SIT_YAW, sitPose(v), -1))}),
  render: (v) => (
    <>
      <ForestWorld v={v} center={[0, 0, 0]} />
      <Bear position={BEAR_SIT} rotation={BEAR_SIT_YAW} pose={sitPose(v)} />
      <Human o={ANYA} position={A_STOP} rotation={ANYA_SIT_YAW} pose={sitAnya(v)} handR={<SelfieStick len={0.9} tilt={0.6} />} />
    </>
  ),
};

export {clamp01};
