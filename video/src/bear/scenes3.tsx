import React from 'react';
import {Bear, BearPose, GoldChain, Headphones, Sunglasses} from './Bear';
import {ANYA, HOST, Human, HumanPose, MOM, girl, walkPose} from './People';
import {AnyaRoom, Crowd, Den, Fan, River, Studio, blobFans, queueFans} from './Sets';
import {Chair, HoneyBar, Ladle, Mic, Phone, PhoneScreen, Pic, Tents} from './Props';
import {Birch, FallingLeaves, ForestLight, ForestPatch, Ground, Haze, LeafLitter, Log, Motes, Path, Pine, Sky, Tree, TreeWall} from './Forest';
import {Ball, Cyl, Glow} from './kit';
import {drawBannerTall} from './tex';
import {BITE, FLASHES, JAW, LEAN, TITLE, UNWRAP, V3, lerp, lerp3, lip, ramp, rnd, shotEnd, shotStart} from './cues';
import {Scene, aim, blink, ease, ease5, follow, local, mv, yawTo} from './common';
import {at, bearHand, bearHead, humanHand, humanHead} from './rig';
import type {View} from '../slime/camera';

const S = shotStart;
const E = shotEnd;
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const NOPACK = {...ANYA, backpack: false};

// ---------------------------------------------------------------- the festival in front of the den (days 50-51)

// the queue winds from the den door out into the forest
const QUEUE: V3[] = [
  [0.15, 0, 3.4],
  [0.25, 0, 8],
  [-0.6, 0, 14],
  [0.9, 0, 20],
  [-0.4, 0, 27],
  [0.6, 0, 35],
];
const queueX = (z: number) => {
  for (let i = 0; i < QUEUE.length - 1; i++) {
    const a = QUEUE[i];
    const b = QUEUE[i + 1];
    if (z >= a[2] && z <= b[2]) return a[0] + ((b[0] - a[0]) * (z - a[2])) / (b[2] - a[2]);
  }
  return QUEUE[QUEUE.length - 1][0];
};
const BANNER_Z = 10.5;
const tentAvoid = (x: number, z: number) =>
  Math.hypot(x, z * 1.1) < 6.8 || Math.abs(x - queueX(z)) < 2.6 || Math.abs(z + 5.2) < 2.8 || (Math.abs(x - 2.6) < 2.6 && Math.abs(z - 6.4) < 2.4);
const QUEUE_FANS: Fan[] = queueFans(QUEUE, 170, 3, 1.0).filter((f) => f.p[2] > 9.0);
const DOOR_FANS: Fan[] = blobFans([0.15, 0, 5.3], 1.9, 26, 11, [0.15, 1.5, 2.3]);

const TallBanner: React.FC<{position: V3; rotation?: number}> = ({position, rotation = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    {([1, -1] as const).map((s) => (
      <Cyl key={s} position={[1.5 * s, 1.7, 0]} rt={0.05} rb={0.06} h={3.4} seg={8} color="#6a4426" />
    ))}
    <Pic position={[0, 2.6, 0]} size={[2.8, 1.4]} res={[840, 420]} k="banner-tall" draw={drawBannerTall} shadow />
    <Pic position={[0, 2.6, -0.004]} rotation={[0, Math.PI, 0]} size={[2.8, 1.4]} res={[840, 420]} k="banner-tall" draw={drawBannerTall} />
  </group>
);

const FestivalWorld: React.FC<{v: number; night?: number; fans?: boolean; queue?: boolean; freeze?: boolean; shadowBox?: number; center?: V3; extra?: React.ReactNode}> = ({
  v,
  night = 0,
  fans = true,
  queue = true,
  freeze,
  shadowBox = 10,
  center = [0, 0, 6],
  extra,
}) => (
  <>
    {night > 0.5 ? (
      <>
        <hemisphereLight color="#4a5a8a" groundColor="#1a1420" intensity={0.55} />
        <directionalLight position={[center[0] - 6, 10, center[2] - 8]} color="#9ab0ff" intensity={0.5} />
        <color attach="background" args={['#0c1428']} />
        <fog attach="fog" args={['#0c1428', 8, 45]} />
      </>
    ) : (
      <>
        <ForestLight center={center} shadowBox={shadowBox} />
        <Sky />
        <Haze near={30} far={150} />
      </>
    )}
    <Ground size={240} />
    <Path pts={[QUEUE[QUEUE.length - 1], ...QUEUE.slice(1).reverse().slice(1), [0.15, 0, 2.4]]} w={1.6} />
    <LeafLitter center={[center[0], 0, center[2]]} r={9} n={1100} avoid={(x, z) => Math.abs(x - queueX(z)) < 0.9 || Math.hypot(x, z * 1.1) < 2.4} />
    <Den k={1} lights={1} smoke={night > 0.5 ? 0 : 1} v={v} />
    <River z={-5.2} v={v} len={140} />
    <Tents n={300} seed={5} area={[-28, 28, -2.4, 46]} avoid={tentAvoid} night={night} />
    {/* a few big trees around the clearing, the forest wall far behind */}
    {[
      [-6.2, 0, -1.4],
      [6.5, 0, -0.8],
      [-8.5, 0, 3.5],
      [9.2, 0, 5.0],
      [-4.8, 0, -3.0],
    ].map((p, i) => (
      <Tree key={i} position={p as V3} h={6.2 + (i % 3) * 0.6} seed={i * 3 + 2} />
    ))}
    <Pine position={[5.2, 0, -2.8]} h={7} />
    <Birch position={[-7.4, 0, 0.6]} h={6.5} seed={4} />
    <TreeWall n={260} r0={40} r1={80} center={[0, 0, 12]} />
    <TallBanner position={[queueX(BANNER_Z), 0, BANNER_Z]} rotation={Math.PI} />
    {queue ? <Crowd fans={QUEUE_FANS} v={v} jump={0.35} phones={0.45} freeze={freeze} /> : null}
    {fans ? <Crowd fans={DOOR_FANS} v={v} jump={0.8} phones={0.8} freeze={freeze} /> : null}
    {night > 0.5 ? null : <FallingLeaves v={v} center={[center[0], 0, center[2]]} box={[10, 6, 10]} n={60} />}
    {extra}
  </>
);

// ---------------------------------------------------------------- 17. day 50: everyone who also chose the bear

const CROWD_CUT = 51.65;
// the people at the head of the queue, walking up to the den (faces to the camera)
const LEAD: {p: V3; i: number; ph: number}[] = [
  {p: [0.55, 0, 7.15], i: 1, ph: 0.0},
  {p: [-0.35, 0, 7.75], i: 4, ph: 0.4},
  {p: [0.95, 0, 8.45], i: 2, ph: 0.75},
  {p: [-0.05, 0, 8.9], i: 6, ph: 0.2},
  {p: [-0.85, 0, 9.4], i: 3, ph: 0.55},
];
const leadPose = (v: number, ph: number, i: number): HumanPose => {
  const w = walkPose((v - S('crowd')) / 0.8 + ph, 0.55);
  const wave = i % 2 === 0;
  return {
    ...w,
    armR: wave ? [-2.7, 0.25, 0] : w.armR,
    elbowR: wave ? -0.35 - 0.3 * Math.sin(v * 9 + i) : w.elbowR,
    head: [-0.05, 0.1 * Math.sin(v * 2 + i), 0.08 * Math.sin(v * 3 + i)],
    face: {smile: 0.9, happy: 0.6, mouth: 0.35 + 0.25 * Math.abs(Math.sin(v * 7 + i)), blush: 0.4, look: [0, 0.15], lid: blink(v, i)},
  };
};
// they shuffle forward a little
const leadPos = (v: number, p: V3): V3 => [p[0], 0, p[2] - 0.45 * ramp(v, CROWD_CUT, E('crowd'))];

export const crowdScene: Scene = {
  view: (v): View => {
    if (v < CROWD_CUT) {
      // a drone over the forest: tents everywhere, the queue winds to the den
      return mv(v, S('crowd'), CROWD_CUT + 0.3, [9.5, 15.5, 37], [4.8, 9.2, 25], [0, 0, 11], [0.2, 0.4, 6.5], [42, 40]);
    }
    // under the banner: the fans walk up to the den
    const m = mv(v, CROWD_CUT, E('crowd'), [1.05, 1.5, 5.0], [0.85, 1.6, 5.45], [0, 0, 0], [0, 0, 0], [44, 42]);
    return {...m, target: aim(m.pos, [queueX(BANNER_Z), 2.6, BANNER_Z], m.fov, 520, 560)};
  },
  shakes: [[CROWD_CUT, 0.25]],
  probe: (v) => ({den: [0, 1.5, 0], banner: [queueX(BANNER_Z), 2.6, BANNER_Z], lead: add(leadPos(v, LEAD[0].p), [0, 1.5, 0])}),
  render: (v) => (
    <FestivalWorld
      v={v}
      fans={v < CROWD_CUT}
      shadowBox={v < CROWD_CUT ? 26 : 9}
      center={v < CROWD_CUT ? [0, 0, 12] : [0, 0, 8]}
      extra={
        v >= CROWD_CUT
          ? LEAD.map((f) => <Human key={f.i} o={{...girl(f.i), backpack: f.i % 2 === 1}} position={leadPos(v, f.p)} rotation={Math.PI + 0.1 * Math.sin(f.i)} pose={leadPose(v, f.ph, f.i)} />)
          : null
      }
    />
  ),
};

// ---------------------------------------------------------------- 18. her jaw drops

const J_A: V3 = [2.75, 0, 6.3];
const J_YAW = -Math.PI / 2 - 0.35;
const jawAnya = (v: number): HumanPose => {
  const drop = ease(v, JAW - 0.06, JAW + 0.12);
  return {
    lean: -0.06 * drop,
    head: [lerp(0.02, -0.08, drop), 0, 0],
    armR: [lerp(-0.85, -0.3, drop), 0.15, 0],
    elbowR: lerp(-1.0, -0.4, drop),
    armL: [0.05, 0.12, 0],
    elbowL: -0.3,
    face: {wide: 1.25 * drop, o: drop, mouth: lerp(0.1, 1.0, drop), brow: 0.08 * drop, look: [0, 0.05], smile: lerp(0.4, 0, drop), lid: drop > 0 ? 0 : blink(v, 3)},
  };
};
// the honey bar slips out of her hand
const barFall = (v: number): {p: V3; r: V3} | null => {
  const t0 = JAW + 0.12;
  const hand = humanHand(NOPACK, J_A, J_YAW, jawAnya(Math.min(v, t0)), 1);
  const p0 = at(hand, [0, -0.02, 0.03]);
  if (v < t0) return null;
  const t = v - t0;
  const y = Math.max(0.03, p0[1] - 4.9 * t * t);
  return {p: [p0[0] + 0.15 * t, y, p0[2] + 0.1 * t], r: [t * 9, t * 3, t * 6]};
};

export const jawScene: Scene = {
  view: (v) => follow(v, S('jaw'), E('jaw'), local(J_A, J_YAW, [0.35, 1.5, 1.55]), local(J_A, J_YAW, [0.3, 1.5, 1.15]), at(humanHead(NOPACK, J_A, J_YAW, jawAnya(v))), [34, 30], 760, 560),
  shakes: [[JAW, 0.35]],
  probe: (v) => ({face: at(humanHead(NOPACK, J_A, J_YAW, jawAnya(v)))}),
  render: (v) => {
    const bar = barFall(v);
    return (
      <FestivalWorld
        v={v}
        center={[1.5, 0, 6]}
        extra={
          <>
            <Human o={NOPACK} position={J_A} rotation={J_YAW} pose={jawAnya(v)} handR={bar ? null : <HoneyBar position={[0, -0.02, 0.03]} rotation={[0, 0, Math.PI / 2]} />} />
            {bar ? <HoneyBar position={bar.p} rotation={bar.r} /> : null}
          </>
        }
      />
    );
  },
};

// ---------------------------------------------------------------- 19. day 51: the bear is a star

const ST_B: V3 = [0.15, 0, 3.15];
const STAR_FANS: Fan[] = [...blobFans([-2.35, 0, 5.4], 1.5, 16, 21, [0.15, 1.5, 3.2]), ...blobFans([2.65, 0, 5.2], 1.5, 16, 31, [0.15, 1.5, 3.2])];
const starPose = (v: number): BearPose => {
  const wave = Math.sin((v - S('star')) * 7);
  const pose = ease(v, S('star') + 0.9, S('star') + 1.2);
  return {
    lean: -0.06,
    twist: 0.08 * Math.sin(v * 1.3),
    head: [-0.06, 0.12 * Math.sin(v * 0.9), 0.1 * pose],
    armR: [lerp(-2.65, -2.2, pose), lerp(0.5, 0.25, pose) + 0.12 * wave * (1 - pose)],
    elbowR: lerp(-0.45, -1.6, pose),
    armL: [-0.25, 0.75],
    elbowL: -1.9,
    jaw: 0.0,
    face: {smile: 0.75, happy: 0.3, brow: 0.04, lid: 0.25},
    ears: 0.3 * Math.sin(v * 5),
    breathe: v,
  };
};
const flashAt = (v: number) => {
  let best = 0;
  let idx = 0;
  FLASHES.forEach((f, i) => {
    const k = v >= f && v < f + 0.16 ? 1 - (v - f) / 0.16 : 0;
    if (k > best) {
      best = k;
      idx = i;
    }
  });
  return {k: best, i: idx};
};

export const starScene: Scene = {
  // low, heroic, his shades and the chain catching the flashes
  view: (v) => follow(v, S('star'), E('star'), [0.75, 0.85, 8.5], [0.45, 0.95, 7.7], at(bearHead(ST_B, 0, starPose(v))), [40, 36], 600, 540),
  shakes: FLASHES.slice(0, 6).map((f) => [f, 0.12] as [number, number]),
  probe: (v) => ({bearHead: at(bearHead(ST_B, 0, starPose(v)))}),
  render: (v) => {
    const fl = flashAt(v);
    const fan = STAR_FANS[(fl.i * 7) % STAR_FANS.length];
    const fp = local(fan.p, fan.yaw, [0.24, 1.73, 0.15]);
    return (
      <FestivalWorld
        v={v}
        fans={false}
        center={[0.5, 0, 5]}
        extra={
          <>
            <Bear position={ST_B} rotation={0} pose={starPose(v)} head={<Sunglasses />} body={<GoldChain />} />
            <Crowd fans={STAR_FANS} v={v} jump={1} phones={1} />
            {fl.k > 0 ? (
              <>
                <Glow position={fp} size={1.6} color="#ffffff" k={fl.k} />
                <pointLight position={[fp[0] * 0.5, 2.0, 4.6]} color="#ffffff" intensity={28 * fl.k} distance={9} decay={1.5} />
              </>
            ) : null}
          </>
        }
      />
    );
  },
};

// ---------------------------------------------------------------- 20. no more time for her

const P_A: V3 = [1.45, 0, 6.75];
const P_YAW = -Math.PI / 2 - 0.12;
const P_FROM: V3 = [0.15, 0, 2.6];
const P_TO: V3 = [0.4, 0, 11.5];
const PASS_AT = 58.75;
const bearPassAt = (v: number): V3 => lerp3(P_FROM, P_TO, ramp(v, S('pass') - 0.6, E('pass')));
const bearWalk = (v: number): BearPose => {
  const ph = (v - S('pass')) * 1.9 * Math.PI * 2;
  const s = Math.sin(ph);
  return {
    lean: 0.05,
    twist: 0.08 * s,
    head: [-0.04, -0.55, 0.05],
    legL: 0.38 * s,
    legR: -0.38 * s,
    armR: [-2.5, 0.35 + 0.15 * Math.sin(v * 8)],
    elbowR: -0.5 - 0.35 * Math.sin(v * 8),
    armL: [0.3 * s, 0.18],
    elbowL: -0.35,
    face: {smile: 0.7, happy: 0.35, lid: 0.25},
    breathe: v,
  };
};
// fans trailing behind him, phones up
const ENTOURAGE: [number, number][] = [
  [-0.6, -0.95],
  [0.45, -1.25],
  [-0.15, -1.7],
  [0.6, -2.0],
  [-0.5, -2.35],
];
const passAnya = (v: number): HumanPose => {
  const hope = 1 - ease(v, PASS_AT + 0.2, PASS_AT + 0.7);
  const low = ease(v, PASS_AT + 0.6, PASS_AT + 1.3);
  return {
    lean: 0.05 + 0.06 * low,
    head: [lerp(-0.02, 0.22, low), lerp(-0.25, 0.1, ease(v, PASS_AT - 0.3, PASS_AT + 0.6)), lerp(0.08, -0.04, low)],
    armR: [lerp(-1.25, -0.2, low), 0.15, lerp(0.2, 0, low)],
    elbowR: lerp(-0.35, -0.6, low),
    armL: [0.05, 0.12, 0],
    elbowL: -0.3,
    face:
      hope > 0.5
        ? {smile: 0.85, happy: 0.5, blush: 0.4, brow: 0.04, look: [-0.25, 0.05], lid: blink(v, 2)}
        : {smile: -0.35, browIn: 0.6, brow: 0.01, lid: 0.35, look: [lerp(-0.3, 0.2, low), -0.25 * low], tilt: -0.3, mouth: 0.1},
  };
};

export const passScene: Scene = {
  // across the path at her: the bear and his crowd sweep through the frame between us, then she is alone with the bar
  view: (v) => follow(v, S('pass'), E('pass'), [-2.9, 1.45, 6.6], [-2.2, 1.42, 6.75], at(humanHead(NOPACK, P_A, P_YAW, passAnya(v))), [30, 27], 860, 600),
  probe: (v) => ({face: at(humanHead(NOPACK, P_A, P_YAW, passAnya(v))), bearHead: at(bearHead(bearPassAt(v), 0, bearWalk(v)))}),
  render: (v) => {
    const b = bearPassAt(v);
    const fans: Fan[] = ENTOURAGE.map(([dx, dz], i) => ({p: [b[0] + dx, 0, b[2] + dz + 0.15 * Math.sin(v * 5 + i)] as V3, yaw: 0.35 * Math.sin(v * 2 + i * 1.7), i: i * 3 + 2}));
    return (
      <FestivalWorld
        v={v}
        fans={false}
        center={[1.0, 0, 7]}
        extra={
          <>
            <Bear position={[b[0], Math.abs(Math.sin((v - S('pass')) * 1.9 * Math.PI * 2)) * 0.03, b[2]]} rotation={0.05} pose={bearWalk(v)} head={<Sunglasses />} body={<GoldChain />} />
            <Crowd fans={fans} v={v} jump={1} phones={1} />
            <Human o={NOPACK} position={P_A} rotation={P_YAW} pose={passAnya(v)} handR={<HoneyBar position={[0, -0.02, 0.04]} rotation={[0, 0, Math.PI / 2]} />} />
          </>
        }
      />
    );
  },
};

// ---------------------------------------------------------------- 21-24. the biggest podcast in the country

const PB: V3 = [0.32, 0, -1.38];
const PH: V3 = [-1.4, 0, -0.32];
const PH_YAW = yawTo(PH, [PB[0], 0, PB[2] + 0.6]);
const B_MIC: V3 = [0.2, 1.42, -0.5];
const Q1 = 66.6;
const Q2 = 68.85;
const FREEZE1 = S('freeze') + 0.8;
const FREEZE2 = S('freeze') + 1.6;

const podBear = (v: number): BearPose => {
  const lean = ease(v, LEAN[0], LEAN[1]) * (1 - ease(v, 75.25, 75.9));
  const talk = lip('bear', v);
  const think = v > Q2 && v < S('answer') ? Math.sin((v - Q2) * 2.4) : 0;
  const after = ease(v, 75.2, 75.7);
  return {
    sit: 1,
    lean: 0.18 + 0.32 * lean,
    head: [0.1 + 0.12 * lean - 0.05 * after, 0.12 * think - 0.06 * lean, 0.06 * think + 0.08 * after],
    armR: [-0.45, 0.15],
    elbowR: -1.25,
    armL: [-0.45, 0.15],
    elbowL: -1.25,
    jaw: talk * 0.55,
    face:
      v < S('freeze')
        ? {smile: 0.4, happy: 0.25, look: v > Q1 && v < Q2 ? [-0.35, 0.02] : [0.35 * think, 0.12 * Math.abs(think)], lid: blink(v, 6), browIn: v > Q2 ? 0.3 : 0}
        : {smile: lerp(0.2, 0.85, after), happy: 0.7 * after, lid: 0.1 + 0.25 * after, look: [-0.05, 0], brow: 0.03, blush: 0.3 * after},
    ears: 0.3 * after * Math.sin(v * 8),
    breathe: v,
  };
};
const hostPose = (v: number): HumanPose => {
  const lean = ease(v, S('lean') + 0.2, Q1 - 0.1);
  const talk = lip('host', v);
  return {
    sit: 1,
    lean: 0.12 + 0.3 * lean,
    head: [-0.05 - 0.05 * lean, 0, 0.05 * Math.sin(v * 1.7)],
    armR: [-0.85, 0.15, 0],
    elbowR: -1.0,
    armL: [-0.85, 0.15, 0],
    elbowL: -1.0 + 0.3 * talk,
    face: {mouth: talk * 0.9, brow: 0.03 + 0.03 * talk, browIn: 0.15, smile: 0.25, look: [0.05, 0.02], lid: blink(v, 4)},
  };
};
const podHead = (v: number) => at(bearHead(PB, 0, podBear(v)));
const hostHead = (v: number) => at(humanHead(HOST, PH, PH_YAW, hostPose(v)));

const PodcastSet: React.FC<{v: number}> = ({v}) => (
  <>
    <hemisphereLight color="#d8c8ff" groundColor="#2a1a2a" intensity={0.9} />
    <spotLight position={[1.2, 3.6, 2.4]} angle={0.55} penumbra={0.6} color="#ffe2c0" intensity={60} distance={12} decay={1.6} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} target-position={[0, 1.0, -1]} />
    <directionalLight position={[-3, 2.5, 3]} color="#c8a0ff" intensity={0.6} />
    <pointLight position={[0, 2.3, -2.4]} color="#ff4fd8" intensity={6} distance={5} decay={1.6} />
    {/* a soft key on the host's face */}
    <pointLight position={[-0.45, 2.0, 0.35]} color="#ffd9b8" intensity={3.2} distance={3.0} decay={1.6} />
    <color attach="background" args={['#120d18']} />
    <Studio v={v} />
    <Bear position={PB} rotation={0} pose={podBear(v)} head={<Headphones />} />
    {/* his mic on a boom arm from the desk */}
    <Cyl position={[B_MIC[0], 0.97, B_MIC[2] + 0.16]} rt={0.012} rb={0.016} h={0.44} seg={8} color="#1a1a20" look={{metal: 0.6, rough: 0.3}} />
    <Mic position={B_MIC} rotation={[-0.2, Math.PI, 0]} />
    <Chair position={[PH[0], 0, PH[2]]} rotation={PH_YAW} color="#2a2430" />
    <Human o={HOST} position={PH} rotation={PH_YAW} pose={hostPose(v)} head={<group scale={0.4}><Headphones color="#30323a" /></group>} />
    <Mic position={local(PH, PH_YAW, [0.02, 1.0, 0.56])} rotation={[0.2, PH_YAW + Math.PI, 0]} />
    <Motes v={v} center={[0, 0.8, 0]} box={[4, 2.5, 3]} n={24} />
  </>
);

export const podcastScene: Scene = {
  // tilt down from the neon to the guest in headphones
  view: (v) => {
    const end: V3 = [1.0, 1.55, 3.0];
    const tb = aim(end, podHead(v), 38, 640, 560);
    return mv(v, S('podcast'), E('podcast') - 0.4, [1.25, 2.7, 3.6], end, [0, 2.4, -2.84], tb, [36, 38], 0.25);
  },
  probe: (v) => ({bearHead: podHead(v), host: hostHead(v), neon: [0, 2.35, -2.84]}),
  render: (v) => <PodcastSet v={v} />,
};

export const leanScene: Scene = {
  view: (v): View => {
    if (v < Q2) {
      // the two of them; the host leans in and asks, the camera creeps closer
      const m = mv(v, S('lean'), Q2, [-0.8, 1.6, 4.9], [-0.85, 1.5, 4.0], [0, 0, 0], [0, 0, 0], [42, 41]);
      const mid = lerp3(hostHead(v), podHead(v), 0.44);
      return {...m, target: aim(m.pos, mid, m.fov, 760, 540)};
    }
    // the question lands on him: slow push in on his face
    return follow(v, Q2, E('lean'), [0.62, 1.6, 1.7], [0.5, 1.62, 1.15], podHead(v), [34, 30], 700, 540);
  },
  probe: (v) => ({bearHead: podHead(v), host: hostHead(v)}),
  render: (v) => <PodcastSet v={v} />,
};

// the pause: everyone everywhere freezes
const FZ_A: V3 = [0.2, 0, -0.32];
const FZ_ANYA: HumanPose = {
  sit: 1,
  lean: 0.12,
  head: [0.25, 0, 0],
  armR: [-0.9, 0.12, -0.25],
  elbowR: -1.5,
  armL: [-0.2, 0.15, 0],
  elbowL: -0.5,
  face: {wide: 0.75, o: 0.45, mouth: 0.3, look: [0, -0.3]},
};
const FZ_M: V3 = [0.2, 0, -0.1];
const FZ_MOM: HumanPose = {
  lean: -0.03,
  head: [0.1, 0, 0],
  armR: [-2.15, 0.2, -0.3],
  elbowR: -1.75,
  armL: [-0.95, 0.15, 0.2],
  elbowL: -1.3,
  face: {wide: 0.55, o: 0.45, mouth: 0.3, brow: 0.05, look: [0.05, -0.3]},
};
const NightRoom: React.FC<{v: number; mom?: boolean}> = ({v, mom}) => (
  <>
    <hemisphereLight color="#5a6aa8" groundColor="#1a1420" intensity={0.45} />
    <pointLight position={[0.15, 1.05, 0.2]} color="#7aa8ff" intensity={0.45} distance={2.0} decay={1.6} />
    <color attach="background" args={['#0c1022']} />
    <AnyaRoom night={1} />
    {mom ? (
      <Human
        o={MOM}
        position={FZ_M}
        rotation={0}
        pose={FZ_MOM}
        handR={<Ladle full={1} />}
        handL={<Phone position={[0, -0.04, 0.03]} rotation={[-0.3, Math.PI, 0]}><PhoneScreen k="freeze-mom" draw={podScreen} glow={1.2} /></Phone>}
      />
    ) : (
      <Human
        o={NOPACK}
        position={FZ_A}
        rotation={0}
        pose={FZ_ANYA}
        handR={<Phone position={[-0.01, -0.125, 0.03]} rotation={[-0.35, 0.25, 0.15 + Math.PI]}><PhoneScreen k="freeze-anya" draw={podScreen} glow={1.25} /></Phone>}
      />
    )}
    <Motes v={v} center={[0.2, 1.2, 0]} box={[2, 1.5, 2]} n={16} />
  </>
);
// what everyone is watching: the bear at the mic
const podScreen = (g: CanvasRenderingContext2D, W: number, H: number) => {
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2a1838');
  bg.addColorStop(1, '#120a18');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ff4fd8';
  g.font = `800 ${Math.round(W * 0.1)}px sans-serif`;
  g.textAlign = 'center';
  g.fillText('ПОДКАСТ', W / 2, H * 0.14);
  g.fillStyle = '#7a4826';
  g.beginPath();
  g.ellipse(W / 2, H * 0.62, W * 0.34, H * 0.2, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(W / 2, H * 0.38, W * 0.22, 0, Math.PI * 2);
  g.fill();
  for (const s of [-1, 1]) {
    g.beginPath();
    g.arc(W / 2 + s * W * 0.17, H * 0.28, W * 0.075, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#1b1c22';
  g.fillRect(W * 0.24, H * 0.36, W * 0.06, H * 0.08);
  g.fillRect(W * 0.7, H * 0.36, W * 0.06, H * 0.08);
  g.fillStyle = '#ff3b4e';
  g.beginPath();
  g.arc(W * 0.12, H * 0.9, W * 0.03, 0, Math.PI * 2);
  g.fill();
};

export const freezeScene: Scene = {
  noHandheld: true,
  probe: () => ({
    aFace: at(humanHead(NOPACK, FZ_A, 0, FZ_ANYA)),
    aPhone: at(humanHand(NOPACK, FZ_A, 0, FZ_ANYA, 1)),
    mFace: at(humanHead(MOM, FZ_M, 0, FZ_MOM)),
    mLadle: at(humanHand(MOM, FZ_M, 0, FZ_MOM, 1)),
    mPhone: at(humanHand(MOM, FZ_M, 0, FZ_MOM, -1)),
    door: [0.15, 1.5, 6.0],
  }),
  view: (v): View => {
    if (v < FREEZE1) {
      // her, at night, the phone lighting her face
      const h = at(humanHead(NOPACK, FZ_A, 0, FZ_ANYA));
      const k = ramp(v, S('freeze'), FREEZE1);
      const pos: V3 = [lerp(0.4, 0.38, k), 1.18, lerp(1.0, 0.92, k)];
      return {pos, target: aim(pos, h, 36, 700, 520), fov: 36, far: 60};
    }
    if (v < FREEZE2) {
      // the fans by their tents, all lit by their phones, not moving
      // from the den door: rows of frozen faces lit by their phones
      const k = ramp(v, FREEZE1, FREEZE2);
      const pos: V3 = [lerp(0.7, 0.65, k), lerp(2.75, 2.7, k), lerp(2.35, 2.6, k)];
      return {pos, target: aim(pos, [0.15, 1.45, 6.4], 42, 900, 540), fov: 42, far: 120};
    }
    // her mother, the ladle halfway to her mouth
    const h = at(humanHead(MOM, FZ_M, 0, FZ_MOM));
    const pos: V3 = [0.35, 1.3, lerp(1.45, 1.35, ramp(v, FREEZE2, E('freeze')))];
    return {pos, target: aim(pos, h, 34, 760, 470), fov: 34, far: 60};
  },
  render: (v) => {
    if (v < FREEZE1) return <NightRoom v={v} />;
    if (v < FREEZE2)
      return (
        <FestivalWorld
          v={v}
          night={1}
          freeze
          center={[0.5, 0, 7]}
          extra={
            <>
              {DOOR_FANS.map((f, i) => (i % 3 !== 0 ? <Glow key={i} position={local(f.p, f.yaw, [0.24, 1.73, 0.12])} size={0.5} color="#bfe0ff" k={0.8} /> : null))}
              <pointLight position={[0.6, 2.2, 4.4]} color="#a8c4ff" intensity={4} distance={7} decay={1.5} />
            </>
          }
        />
      );
    return <NightRoom v={v} mom />;
  },
};

export const answerScene: Scene = {
  // he leans to the mic: «С мёдом.»
  view: (v) => follow(v, S('answer'), E('answer'), [0.5, 1.6, 1.25], [0.42, 1.6, 0.95], podHead(v), [32, 29], 640, 620),
  shakes: [[74.4, 0.15]],
  probe: (v) => ({bearHead: podHead(v), mic: B_MIC}),
  render: (v) => <PodcastSet v={v} />,
};

// ---------------------------------------------------------------- 25. sunset: the last bar

const LOG: V3 = [0, 0.2, 0];
const END_A: V3 = [0.05, 0, 0.18];
const OUT = 78.35;
const endAnya = (v: number): HumanPose => {
  const open = ease(v, UNWRAP[0], UNWRAP[1]);
  const bite = ease(v, BITE - 0.25, BITE) * (1 - ease(v, BITE + 0.1, BITE + 0.45));
  const chew = v > BITE ? Math.max(0, Math.sin((v - BITE) * 14)) * Math.exp(-(v - BITE) * 0.5) : 0;
  return {
    sit: 1,
    lean: 0.12,
    head: [0.12 - 0.1 * bite, -0.05, 0.06],
    armR: [lerp(-0.9, -1.25, bite), 0.1, lerp(0.35, 0.55, bite)],
    elbowR: lerp(-1.25, -1.9, bite),
    armL: [lerp(-0.85, -0.7, open), 0.12, lerp(0.35, 0.2, open)],
    elbowL: -1.2,
    face: {
      smile: v > BITE + 0.4 ? 0.55 : 0.15,
      happy: v > BITE + 0.4 ? 0.5 : 0,
      mouth: 0.45 * bite + 0.18 * chew,
      look: v < BITE ? [0, -0.35] : [0.1, 0.05],
      lid: v > BITE + 0.4 ? 0.3 + blink(v, 2) * 0.6 : blink(v, 2),
      blush: 0.35,
    },
  };
};

// three birds crossing the sunset
const Birds: React.FC<{v: number}> = ({v}) => (
  <>
    {[0, 1, 2].map((i) => {
      const t = v - 76.4 - i * 0.25;
      const p: V3 = [-9 + t * 3.2 + i * 0.6, 7.2 + i * 0.5 + Math.sin(t * 2 + i) * 0.2, -14 - i * 1.5];
      const flap = Math.sin(v * 14 + i * 2) * 0.6;
      return (
        <group key={i} position={p} scale={0.55}>
          <Ball scale={[0.14, 0.06, 0.06]} color="#2a1a20" look={{basic: true}} shadow={false} />
          {([1, -1] as const).map((s) => (
            <group key={s} rotation={[0, 0, s * flap]}>
              <Ball position={[0.22 * s, 0.02, 0]} scale={[0.22, 0.025, 0.08]} color="#2a1a20" look={{basic: true}} shadow={false} />
            </group>
          ))}
        </group>
      );
    })}
  </>
);

export const endScene: Scene = {
  view: (v): View => {
    const h = at(humanHead(NOPACK, END_A, 0, endAnya(v)));
    if (v < OUT) return follow(v, S('end'), OUT, [0.5, 1.15, 1.75], [0.42, 1.12, 1.45], h, [34, 32], 780, 560);
    // pull back: the log, the forest, the last light; the question appears
    const m = mv(v, OUT, E('end') + 0.6, [0.42, 1.12, 1.45], [1.3, 2.0, 5.6], h, h, [32, 40]);
    return {...m, target: aim(m.pos, [h[0], h[1] - 0.2 * ease(v, OUT, E('end')), h[2]], m.fov, lerp(780, 1100, ease(v, OUT, E('end'))), 560)};
  },
  probe: (v) => ({face: at(humanHead(NOPACK, END_A, 0, endAnya(v)))}),
  render: (v) => {
    const open = ease(v, UNWRAP[0], UNWRAP[1]);
    const bitten = v > BITE ? 1 : 0;
    return (
      <>
        <ForestLight center={[0, 0, 0]} sun={[-10, 3.2, -12]} shadowBox={6} k={0.85} />
        <Sky top="#4a4f8a" mid="#ff9a5a" low="#ffcf7a" />
        <Haze color="#f2a868" near={10} far={60} />
        {/* the sun sits low in a gap in the trees, right behind her */}
        <Glow position={[-11, 3.6, -38]} size={18} color="#ffb060" k={0.95} fog={false} />
        <Glow position={[-11, 3.2, -38]} size={6} color="#fff0c0" k={0.9} fog={false} />
        <Ground />
        <LeafLitter center={[0, 0, 0]} r={7} n={900} />
        <ForestPatch center={[0, 0, -4]} r0={3.2} r1={16} n={28} seed={44} avoid={(x, z) => (z > -2.2 && Math.abs(x) < 4.2) || Math.abs(x + 0.28 * (0.2 - z) - 0.05) < 2.6} />
        <TreeWall n={150} r0={18} r1={42} seed={13} arc={[4.73, 10.41]} />
        <Log position={LOG} rot={0} len={1.9} />
        <Human o={NOPACK} position={END_A} rotation={0} pose={endAnya(v)} handR={<HoneyBar position={[0, -0.02, 0.04]} rotation={[0, 0, Math.PI / 2 + 0.3]} open={open} bitten={bitten} />} />
        <FallingLeaves v={v} center={[0, 0, 0]} box={[7, 5, 7]} n={60} speed={0.8} />
        <Motes v={v} center={[0, 0.8, 0.5]} box={[4, 2.5, 4]} n={30} />
        <Birds v={v} />
      </>
    );
  },
};

export {TITLE};
