import React from 'react';
import {Human, HumanPose, walkPose} from '../bear/People';
import {AnyaRoom} from '../bear/Sets';
import {Chair, Pic} from '../bear/Props';
import {Block, RBox} from '../bear/kit';
import {Backpack} from '../bear/Bear';
import {Scene, blink, chatter, ease, mv} from '../bear/common';
import {InteriorLights} from '../cs2/scenes1';
import type {View} from '../slime/camera';
import {BELL, FINAL, FIVE, FOUND, V3, lerp, lerp3, ramp, shotEnd, shotStart} from './cues';
import {Bouquet, Bow, Cap, Classroom, DAD, KID_SUIT, Kitchen, MOM, Notebook, PhoneTower, Pointer, SmallPhone, adult, kid} from './Sets';
import {drawCartoon, drawDadNotes, drawLesson, drawTile, drawTower} from './tex';
import {Pupils} from './scenes2';
import {withArm} from './scenes1';

const S = shotStart;
const E = shotEnd;

// ======================================================================= 8. cartoons for everybody, the phone tower

const DAD_ROOM: V3 = [0.2, 0, -0.25];
const KIDS_ROOM: V3[] = [
  [-0.45, 0, 0.55],
  [0.2, 0, 0.7],
  [0.85, 0, 0.55],
];
const phoneKey = (v: number, i: number) => `cart${i}-${Math.round(v * 6)}`;

const CartoonSet: React.FC<{v: number}> = ({v}) => {
  const give = ease(v, S('cartoons') + 0.4, S('cartoons') + 1.0);
  return (
    <>
      <color attach="background" args={['#efd9bd']} />
      <InteriorLights key1={[3, 5, 4]} k={0.95} box={4} />
      <AnyaRoom />
      {/* dad grins and hands out phones */}
      <Human
        o={DAD}
        position={DAD_ROOM}
        pose={withArm(DAD, DAD_ROOM, 0, {head: [0.15, 0, 0], lean: 0.1, armL: [-0.3, 0.15, 0], elbowL: -0.9, face: {smile: 0.7, happy: 0.5, brow: 0.04, lid: blink(v, 2) * 0.9}}, 1, lerp3([0.45, 1.0, -0.05], [0.6, 0.95, 0.3], give))}
        handR={give < 0.95 ? <SmallPhone position={[0, -0.06, 0.04]} rotation={[-1.2, 0, 0]} k={phoneKey(v, 9)} draw={(g, W, H) => drawCartoon(g, W, H, v, 3)} /> : null}
        handL={<SmallPhone position={[0, -0.06, 0.04]} rotation={[-1.2, 0, 0]} k={phoneKey(v, 8)} draw={(g, W, H) => drawCartoon(g, W, H, v, 2)} />}
      />
      {KIDS_ROOM.map((p, i) => {
        const holdP: V3 = [p[0], 0.98, p[2] - 0.22];
        const pose = withArm(kid(i + 1), p, Math.PI, withArm(kid(i + 1), p, Math.PI, {head: [0.45, 0, 0], face: {wide: 0.4, mouth: 0.25, lid: 0.1}}, 1, [holdP[0] - 0.04, holdP[1], holdP[2]]), -1, [holdP[0] + 0.04, holdP[1], holdP[2]]);
        return (
          <group key={i}>
            <Human o={kid(i + 1)} position={p} rotation={Math.PI} pose={pose} />
            <SmallPhone position={[holdP[0], holdP[1] + 0.06, holdP[2]]} rotation={[0.55, Math.PI, 0]} k={phoneKey(v, i)} draw={(g, W, H) => drawCartoon(g, W, H, v, i)} scale={1.3} />
          </group>
        );
      })}
    </>
  );
};

export const cartoonsScene: Scene = {
  view: (v): View => mv(v, S('cartoons'), E('cartoons'), [0.95, 1.45, 2.7], [0.6, 1.35, 2.25], [0.2, 0.95, -0.1], [0.2, 1.0, -0.15], [46, 44], 0.15),
  render: (v) => <CartoonSet v={v} />,
};

const TOWER: V3 = [0.2, 0, -0.1];
const TowerSet: React.FC<{v: number}> = ({v}) => {
  const scan = ramp(v, S('tower') + 0.5, FOUND);
  const found = v >= FOUND ? 1 : 0;
  const blinkOn = Math.floor((v - FOUND) * 4) % 2 === 0;
  return (
    <>
      <color attach="background" args={['#efd9bd']} />
      <InteriorLights key1={[3, 5, 4]} k={0.85} box={4} />
      <pointLight position={[0.2, 1.4, 0.6]} color={found ? '#ff5a4a' : '#7cff9a'} intensity={1.6} distance={4} decay={1.6} />
      <AnyaRoom />
      <PhoneTower
        position={TOWER}
        on={1}
        tile={(i) => <Pic size={[0.075, 0.155]} res={[60, 124]} k={`tile${i}-${Math.round(v * 3) % 4}`} draw={(g, W, H) => drawTile(g, W, H, i + Math.round(v * 3))} lit={false} glow={1.1} />}
        screen={<Pic size={[1.15, 0.58]} res={[640, 320]} k={`tower-${Math.round(scan * 40)}-${found}-${blinkOn ? 1 : 0}`} draw={(g, W, H) => drawTower(g, W, H, scan, found, blinkOn ? 1 : 0)} lit={false} glow={1.05} />}
      />
      {[
        {p: [-0.95, 0, 0.55] as V3, yaw: 0.6},
        {p: [1.35, 0, 0.55] as V3, yaw: -0.6},
        {p: [-0.5, 0, 1.0] as V3, yaw: 0.25},
        {p: [0.95, 0, 1.05] as V3, yaw: -0.25},
      ].map((k, i) => {
        const nod = v > FOUND + 0.6 ? Math.max(0, Math.sin((v - FOUND) * 7)) * 0.25 : 0;
        return (
          <Human
            key={i}
            o={kid(i + 2, true)}
            position={k.p}
            rotation={k.yaw + Math.PI}
            pose={{head: [-0.25 + nod, 0, 0], armL: [0.1, 0.15, 0], elbowL: -0.2, armR: i === 1 ? [-2.4, 0.2, 0] : [0.1, 0.15, 0], elbowR: -0.2, face: {brow: found ? -0.04 : 0.03, browIn: found ? -0.35 : 0, tilt: found ? 0.35 : 0, smile: found ? 0.1 : 0, lid: blink(v, i) * 0.9}}}
          />
        );
      })}
    </>
  );
};
export const towerScene: Scene = {
  view: (v): View => mv(v, S('tower'), E('tower'), [0.9, 1.0, 3.3], [0.45, 1.35, 2.5], [0.2, 1.25, -0.1], [0.2, 1.7, -0.1], [50, 46], 0.3),
  shakes: [[FOUND, 0.2]],
  render: (v) => <TowerSet v={v} />,
};

// ======================================================================= 9. adults back to school

const TEACH_AT: V3 = [0.2, 0, -1.45];
const kidTeacherPose = (v: number): HumanPose => {
  const p = ease(v, S('desks') + 0.3, S('desks') + 0.7);
  return {
    head: [-0.05, 0.1 * Math.sin(v), 0],
    armR: [lerp(0.05, -1.7, p), lerp(0.15, 0.6, p), 0],
    elbowR: -0.2,
    armL: [-0.2, 0.1, 0],
    elbowL: -1.4,
    face: {brow: -0.03, browIn: -0.25, tilt: 0.25, mouth: chatter(v, 0.6) * p, lid: blink(v, 9) * 0.9 + 0.15},
  };
};

// adults walking in from the door at the right with bouquets and backpacks, to their desks
const ENTRY: {o: number; seat: V3}[] = [
  {o: 0, seat: [1.3, 0, 0.6]},
  {o: 1, seat: [0, 0, 0.6]},
  {o: 2, seat: [-1.3, 0, 0.6]},
  {o: 3, seat: [1.3, 0, 1.6]},
];
const enterWalk = (v: number, i: number): {p: V3; yaw: number; pose: HumanPose; seated: number} => {
  const t = v - S('enter') - i * 0.45;
  const door: V3 = [3.6, 0, -0.1];
  const seat = ENTRY[i].seat;
  const aisle: V3 = [seat[0], 0, 0.05];
  const d1 = Math.hypot(aisle[0] - door[0], aisle[2] - door[2]);
  const d2 = Math.hypot(seat[0] - aisle[0], seat[2] - aisle[2]);
  const dist = Math.max(0, t) * 1.2;
  let p: V3;
  let yaw: number;
  if (dist < d1) {
    p = lerp3(door, aisle, dist / d1);
    yaw = -Math.PI / 2;
  } else {
    p = lerp3(aisle, seat, Math.min(1, (dist - d1) / Math.max(0.01, d2)));
    yaw = dist < d1 + d2 ? 0 : Math.PI;
  }
  const moving = dist > 0 && dist < d1 + d2;
  const pose: HumanPose = moving ? {...walkPose(dist / 0.6, 0.8)} : {};
  return {p, yaw, pose: {...pose, armR: [-0.6, 0.15, 0], elbowR: -0.9, face: {smile: 0.25, brow: 0.04, lid: blink(v, i) * 0.9}}, seated: 0};
};

const SchoolSet: React.FC<{v: number; mode: 'enter' | 'desks'}> = ({v, mode}) => (
  <>
    <color attach="background" args={['#e9e2c8']} />
    <InteriorLights key1={[-3, 5, 3]} k={0.95} box={5} />
    <Classroom board={<Pic size={[2.8, 1.2]} res={[1120, 480]} k="lesson" draw={drawLesson} lit={false} glow={0.95} />} />
    {/* door in the right wall */}
    <group position={[3.14, 0, -0.1]} rotation={[0, -Math.PI / 2, 0]}>
      <RBox position={[0, 1.05, 0]} size={[1.0, 2.1, 0.04]} r={0.01} color="#c8a06a" />
    </group>
    <Human o={KID_SUIT} position={TEACH_AT} pose={mode === 'desks' ? kidTeacherPose(v) : {armR: [-0.2, 0.1, 0], elbowR: -1.4, face: {smile: 0.1, lid: blink(v, 9) * 0.9}}} handR={<Pointer />} />
    {mode === 'desks' ? (
      <Pupils v={v} adults />
    ) : (
      <>
        <Pupils v={v} adults skip={(r, c) => ENTRY.some((e) => e.seat[2] === [0.6, 1.6][r] && e.seat[0] === [-1.3, 0, 1.3][c])} />
        {ENTRY.map((e, i) => {
          const w = enterWalk(v, i);
          const o = {...(i === 1 ? MOM : adult(e.o + 6)), backpack: false};
          return (
            <group key={i}>
              <Human o={o} position={w.p} rotation={w.yaw} pose={w.pose} handR={<Bouquet position={[0, -0.02, 0.06]} seed={i} />} head={i === 1 ? <Bow /> : undefined} />
              <group position={w.p} rotation={[0, w.yaw, 0]}>
                <group position={[0, 0.95, -0.2]}>
                  <Backpack color={['#e8453c', '#2fae5a', '#2f6fd8', '#ff8fd0'][i]} />
                </group>
              </group>
            </group>
          );
        })}
      </>
    )}
  </>
);

export const enterScene: Scene = {
  view: (v): View => mv(v, S('enter'), E('enter'), [-0.9, 1.75, 3.9], [-0.4, 1.65, 3.4], [1.7, 1.05, -0.1], [1.2, 1.05, 0.1], [50, 48], 0.3),
  render: (v) => <SchoolSet v={v} mode="enter" />,
};
export const desksScene: Scene = {
  view: (v): View => mv(v, S('desks'), E('desks'), [0.9, 1.75, 3.6], [0.5, 1.6, 2.8], [0.2, 1.05, -1.0], [0.2, 1.1, -1.2], [48, 44], 0.25),
  render: (v) => <SchoolSet v={v} mode="desks" />,
};
export {SchoolSet};

// ======================================================================= 10. evening: «папа, иди делай уроки»

const DAD_AT: V3 = [0, 0, -0.75];
const NOTE: V3 = [0.02, 0.768, -0.22];
const SON_AT: V3 = [0.78, 0, 0.12];
const dadPose = (v: number): HumanPose => {
  const drop = ease(v, FINAL + 0.4, FINAL + 1.0);
  return {
    sit: 1,
    lean: 0.25 + 0.35 * drop,
    head: [0.35 + 0.5 * drop, 0, 0],
    armL: [-0.75, 0.25, 0],
    elbowL: -1.1,
    armR: [-0.75, 0.2, 0],
    elbowR: -1.1,
    face: {lid: 0.45 + 0.4 * drop + blink(v, 3) * 0.5, look: [0, -0.4], browIn: 0.5, smile: -0.4, mouth: 0.05},
  };
};
const sonPose = (v: number): HumanPose => {
  const write = ease(v, FIVE - 0.4, FIVE) * (1 - ease(v, FIVE + 0.7, FIVE + 1.0));
  const point = ease(v, FIVE + 0.8, FIVE + 1.2);
  const p: HumanPose = {
    lean: 0.12 * write,
    head: [0.35 * write + 0.05, 0, 0],
    armL: [0.05, 0.12, 0],
    elbowL: -0.2,
    armR: [0.05, 0.12, 0],
    elbowR: -0.2,
    face: {brow: -0.02, browIn: -0.25, tilt: 0.25, mouth: v > shotStart('dad') + 2.0 && v < FINAL ? chatter(v, 0.5) * point : 0.02, lid: blink(v, 4) * 0.9 + 0.1},
  };
  const wob = Math.sin(v * 25) * 0.008 * (v > FIVE - 0.05 && v < FIVE + 0.6 ? 1 : 0);
  let q = p;
  if (write > 0) {
    const w = withArm(KID_SUIT, SON_AT, -Math.PI * 0.62, p, 1, [NOTE[0] + 0.1 + wob, NOTE[1] + 0.03, NOTE[2] + 0.02 + wob]);
    q = {...p, armR: [lerp(0.05, w.armR![0], write), lerp(0.12, w.armR![1], write), 0], elbowR: lerp(-0.2, w.elbowR!, write)};
  }
  if (point > 0) q = {...q, armL: [lerp(0.05, -1.3, point), lerp(0.12, 0.1, point), 0], elbowL: lerp(-0.2, -0.05, point)};
  return q;
};

export const DadSet: React.FC<{v: number}> = ({v}) => {
  const five = ramp(v, FIVE, FIVE + 0.6);
  return (
    <>
      <color attach="background" args={['#2a3260']} />
      <hemisphereLight color="#ffe6c8" groundColor="#5a4a40" intensity={0.7} />
      <directionalLight position={[2, 5, 3]} color="#ffe2b8" intensity={1.1} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0005} />
      <pointLight position={[0, 2.1, 0]} color="#ffd27a" intensity={2.2} distance={5} decay={1.5} />
      <Kitchen evening={1} />
      <Chair position={[DAD_AT[0], 0, DAD_AT[2]]} rotation={0} color="#7a5232" />
      <Human o={DAD} position={DAD_AT} pose={dadPose(v)} />
      <Notebook position={NOTE} k={`dadnotes-${Math.round(five * 20)}`} draw={(g, W, H) => drawDadNotes(g, W, H, five)} scale={1.25} />
      <Human o={KID_SUIT} position={SON_AT} rotation={-Math.PI * 0.62} pose={sonPose(v)} head={<Cap />} handR={<Block position={[0, -0.05, 0.02]} size={[0.012, 0.12, 0.012]} color="#d8322a" />} />
    </>
  );
};

export const dadScene: Scene = {
  view: (v): View => {
    const a: V3 = [0.55, 1.4, 1.9];
    const close: V3 = [0.1, 1.32, 0.3];
    const k1 = ease(v, S('dad') + 1.2, FIVE - 0.2);
    const k2 = ease(v, FIVE + 1.0, FIVE + 1.8);
    const pos = lerp3(lerp3(a, close, k1), [0.85, 1.45, 2.3], k2);
    const tA: V3 = [0.15, 1.0, -0.35];
    const tC: V3 = [0.03, 0.77, -0.24];
    const target = lerp3(lerp3(tA, tC, k1), [0.35, 1.0, -0.3], k2);
    return {pos, target, fov: lerp(lerp(44, 40, k1), 44, k2), far: 900};
  },
  render: (v) => <DadSet v={v} />,
};
