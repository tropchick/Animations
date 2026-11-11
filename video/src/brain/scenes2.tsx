import React from 'react';
import {Human, HumanPose, walkPose} from '../bear/People';
import {Office} from '../bear/Sets';
import {Chair, Pic} from '../bear/Props';
import {Block, Cyl} from '../bear/kit';
import {Scene, blink, chatter, ease, follow, mv} from '../bear/common';
import {InteriorLights} from '../cs2/scenes1';
import type {View} from '../slime/camera';
import {ENTER, PLAN, SOLVE, STACK, V3, WIN, lerp, lerp3, ramp, shotEnd, shotStart} from './cues';
import {Basement, Book, Box, COLS_X, Cap, Classroom, KID, KID_SUIT, Kitchen, MOM, Notebook, ROWS_Z, SchoolDesk, Stool, TEACHER, adult, kid} from './Sets';
import {FORMULA, drawBubble, drawFormula, drawKidNotes, drawPlan, drawTeacherNotes} from './tex';
import {withArm} from './scenes1';

const S = shotStart;
const E = shotEnd;

// ======================================================================= 4. class: the formula, the teacher copies

const BOARD_W = 2.8;
const BOARD_H = 1.2;
const BOARD_C: V3 = [0, 1.55, -1.93];
const formulaK = (v: number) => ramp(v, S('board') + 0.3, SOLVE);
// where the chalk is now: x along the current line, y of the line
const chalkAt = (k: number): V3 => {
  const n = FORMULA.reduce((a, l) => a + l.length, 0);
  let c = k * n;
  let line = 0;
  while (line < FORMULA.length - 1 && c > FORMULA[line].length) {
    c -= FORMULA[line].length;
    line++;
  }
  const frac = Math.min(1, c / FORMULA[line].length);
  const x = BOARD_C[0] - BOARD_W / 2 + BOARD_W * 0.06 + frac * FORMULA[line].length * 0.075;
  const y = BOARD_C[1] + BOARD_H / 2 - BOARD_H * (0.2 + 0.29 * line);
  return [x, y, BOARD_C[2] + 0.04];
};

export const FRONT_DESK: V3 = [-1.0, 0, -0.45];
// classmates at their desks, facing the board (−z)
export const Pupils: React.FC<{v: number; adults?: boolean; skip?: (r: number, c: number) => boolean}> = ({v, adults, skip}) => (
  <>
    {ROWS_Z.map((z, r) =>
      COLS_X.map((x, c) => {
        if (skip?.(r, c)) return null;
        const i = r * 3 + c;
        const o = adults ? adult(i) : kid(i);
        const seatY = adults ? -0.12 : 0;
        const pose: HumanPose = {
          sit: 1,
          lean: adults ? 0.1 : 0.08,
          head: [adults ? 0.05 : -0.08, 0.1 * Math.sin(v * 0.7 + i), 0],
          armL: [-0.7, 0.2, 0],
          elbowL: -1.1,
          armR: [-0.7, 0.2, 0],
          elbowR: -1.1,
          face: {lid: blink(v, i) * 0.9 + (adults ? 0.3 : 0), smile: adults ? -0.3 : 0, browIn: adults ? 0.3 : 0},
        };
        return (
          <group key={`${r}${c}`}>
            <SchoolDesk position={[x, 0, z - 0.5]} h={0.55} />
            <Stool position={[x, 0, z]} h={0.36} />
            <Human o={o} position={[x, seatY, z]} rotation={Math.PI} pose={pose} head={!adults && i % 3 === 1 ? <Cap color={['#e8453c', '#2fae5a'][i % 2]} /> : undefined} />
          </group>
        );
      }),
    )}
  </>
);

const KID_BOARD: V3 = [-0.55, 0.3, -1.45];
const kidWritePose = (v: number): HumanPose => {
  const k = formulaK(v);
  const wob = Math.sin(v * 22) * 0.01;
  const done = ease(v, SOLVE, SOLVE + 0.3);
  const c = chalkAt(k);
  const p: HumanPose = {head: [-0.15, 0.2 * done, 0], lean: 0.02, armR: [0.1, 0.15, 0], elbowR: -0.2, face: {look: [0, 0.2], brow: 0.03, smile: 0.4 * done, lid: blink(v, 4) * 0.9}};
  return withArm(KID, KID_BOARD, Math.PI, p, -1, [c[0] + wob, c[1] - 0.02 + wob, c[2]]);
};

const BoardSet: React.FC<{v: number}> = ({v}) => {
  const k = formulaK(v);
  const teacherPeek = ease(v, S('teacher') + 0.2, S('teacher') + 0.8);
  return (
    <>
      <color attach="background" args={['#e9e2c8']} />
      <InteriorLights key1={[-3, 5, 3]} k={0.95} box={5} />
      <Classroom board={<Pic size={[BOARD_W, BOARD_H]} res={[1120, 480]} k={`f${Math.round(k * 60)}`} draw={(g, W, H) => drawFormula(g, W, H, k)} lit={false} glow={0.95} />} />
      <Pupils v={v} />
      {/* the kid on a stool at the board */}
      <Stool position={[KID_BOARD[0], 0, KID_BOARD[2]]} h={0.3} />
      <Human o={KID} position={KID_BOARD} rotation={Math.PI} pose={kidWritePose(v)} head={<Cap />} handL={<Block position={[0, -0.03, 0.02]} size={[0.012, 0.06, 0.012]} color="#ffffff" />} />
      {/* the front pupil and the teacher at her desk */}
      <SchoolDesk position={FRONT_DESK} h={0.55} />
      <Notebook position={[FRONT_DESK[0], 0.551, FRONT_DESK[2]]} k="kidnotes" draw={drawKidNotes} rotation={[0, Math.PI, 0]} scale={1.1} />
      <Stool position={[FRONT_DESK[0], 0, FRONT_DESK[2] + 0.48]} h={0.36} />
      <Human o={kid(7)} position={[FRONT_DESK[0], 0, FRONT_DESK[2] + 0.48]} rotation={Math.PI} pose={{sit: 1, lean: 0.12, head: [0.3, 0, 0], armL: [-0.7, 0.2, 0], elbowL: -1.1, armR: [-0.7, 0.2, 0], elbowR: -1.1, face: {look: [0, -0.4], lid: blink(v, 2) * 0.9 + 0.2}}} />
      <Teacher v={v} peek={teacherPeek} />
    </>
  );
};

const TEACHER_AT: V3 = [-2.0, 0, -1.48];
const Teacher: React.FC<{v: number; peek: number}> = ({v, peek}) => {
  const p: HumanPose = {
    sit: 1,
    lean: 0.15 + 0.2 * peek,
    tilt: -0.28 * peek,
    twist: 0.2 * peek,
    head: [0.25, 0.45 * peek, -0.1 * peek],
    face: {look: [0.6 * peek, -0.3 * peek], lid: blink(v, 5) * 0.9 + 0.25 * peek, brow: -0.02 * peek, browIn: -0.2 * peek, smile: 0.15 * peek, tilt: 0.2 * peek},
  };
  // her left hand covers her own notebook
  const cover = withArm(TEACHER, TEACHER_AT, 0, p, -1, [TEACHER_AT[0] + 0.18, 0.8, TEACHER_AT[2] + 0.42]);
  const pose = withArm(TEACHER, TEACHER_AT, 0, cover, 1, [TEACHER_AT[0] - 0.25, 0.8, TEACHER_AT[2] + 0.4]);
  return (
    <>
      <Chair position={TEACHER_AT} rotation={0} color="#6a4a2a" />
      <Notebook position={[TEACHER_AT[0] + 0.12, 0.768, TEACHER_AT[2] + 0.45]} k="tnotes" draw={drawTeacherNotes} />
      <Human o={TEACHER} position={TEACHER_AT} pose={pose} />
    </>
  );
};

export const boardScene: Scene = {
  view: (v): View => mv(v, S('board'), E('board'), [1.5, 1.45, 2.4], [0.9, 1.5, 1.2], [0.0, 1.45, -1.9], [-0.25, 1.5, -1.9], [46, 42], 0.3),
  render: (v) => <BoardSet v={v} />,
};

export const teacherScene: Scene = {
  view: (v): View => mv(v, S('teacher'), E('teacher'), [-2.35, 1.45, 0.55], [-2.1, 1.35, 0.25], [-1.75, 0.98, -1.1], [-1.7, 0.95, -1.05], [46, 42], 0.15),
  render: (v) => <BoardSet v={v} />,
};

// ======================================================================= 5. the kitchen: the argument, the stack

const MOM_AT: V3 = [-0.38, 0, 0.8];
const KID_K: V3 = [0.45, 0, 0.72];
const momPose = (v: number): HumanPose => {
  const lost = ease(v, WIN - 0.1, WIN + 0.3);
  const point = ease(v, S('stack') + 0.1, S('stack') + 0.4) * (1 - ease(v, STACK + 0.1, STACK + 0.6));
  const p: HumanPose = {
    head: [-0.05, 0, 0],
    lean: -0.04,
    armL: [0.05, 0.12, 0],
    elbowL: -0.25,
    armR: [lerp(lerp(-0.6, 0.1, lost), -1.45, point), lerp(0.15, -0.15, point), 0],
    elbowR: lerp(-0.6 * (1 - lost), -0.05, point),
    face: {
      mouth: v < WIN ? chatter(v) : point > 0.3 && v < STACK ? chatter(v, 1.2) : 0.15,
      brow: lerp(-0.04, 0.05, lost) + 0.05 * ease(v, STACK, STACK + 0.2),
      browIn: lerp(-0.3, 0.3, lost),
      tilt: lerp(0.3, -0.1, lost),
      wide: 0.8 * ease(v, STACK, STACK + 0.2),
      o: 0.6 * ease(v, STACK, STACK + 0.2),
      lid: blink(v, 6) * 0.9,
    },
  };
  return p;
};
const KID_YAW = -Math.PI / 2 - 0.45;
const STACK_ON: V3 = [0.3, 0.765, 0.28];
const stackPos = (v: number): V3 => {
  const k = ease(v, STACK - 0.5, STACK);
  return lerp3([KID_K[0] - 0.05, 1.0, KID_K[2]], STACK_ON, k);
};
const kidKitchenPose = (v: number): HumanPose => {
  const won = ease(v, WIN - 0.1, WIN + 0.25);
  const p: HumanPose = {
    head: [0.05, 0, 0],
    armL: [0.05, 0.12, 0],
    elbowL: -0.2,
    armR: [0.05, 0.12, 0],
    elbowR: -0.2,
    face: {mouth: v < WIN ? chatter(v + 1.3, 0.8) : 0, smile: 0.35 * won, brow: 0.02, tilt: -0.1 * won, lid: blink(v, 7) * 0.9 + 0.25 * won},
  };
  if (v > S('stack') - 0.1) {
    const sp = stackPos(v);
    const rel = ease(v, STACK + 0.05, STACK + 0.4);
    const a = withArm(KID, KID_K, KID_YAW, p, -1, [sp[0], sp[1] + 0.08, sp[2] + 0.12]);
    const b = withArm(KID, KID_K, KID_YAW, a, 1, [sp[0], sp[1] + 0.08, sp[2] - 0.12]);
    return {...b, armL: [lerp(b.armL![0], 0.05, rel), lerp(b.armL![1], 0.12, rel), 0], elbowL: lerp(b.elbowL!, -0.2, rel), armR: [lerp(b.armR![0], 0.05, rel), lerp(b.armR![1], 0.12, rel), 0], elbowR: lerp(b.elbowR!, -0.2, rel)};
  }
  return p;
};

const NotebookStack: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    {Array.from({length: 9}, (_, i) => (
      <Book key={i} position={[(i % 2) * 0.008 - 0.004, 0.012 + i * 0.024, (i % 3) * 0.006]} rotation={[0, (i % 3) * 0.06 - 0.06, 0]} color={['#2f6fd8', '#e8453c', '#2fae5a', '#ffd23f', '#9b7bd8'][i % 5]} size={[0.2, 0.022, 0.27]} />
    ))}
  </group>
);

const KitchenSet: React.FC<{v: number}> = ({v}) => {
  return (
    <>
      <color attach="background" args={['#f2e2c4']} />
      <InteriorLights key1={[2, 5, 4]} k={1} box={4} />
      <Kitchen />
      <Human o={MOM} position={MOM_AT} rotation={Math.PI / 2 + 0.25} pose={momPose(v)} />
      <Human o={KID} position={KID_K} rotation={KID_YAW} pose={kidKitchenPose(v)} head={<Cap />} />
      {v > S('stack') - 0.1 ? <NotebookStack position={stackPos(v)} /> : null}
    </>
  );
};

export const argueScene: Scene = {
  view: (v): View => mv(v, S('argue'), E('argue'), [0.3, 1.55, 4.5], [0.1, 1.45, 3.9], [0.03, 1.1, 0.6], [0.03, 1.1, 0.6], [44, 42], 0.3),
  shakes: [[WIN, 0.1]],
  render: (v) => <KitchenSet v={v} />,
};
export const stackScene: Scene = {
  view: (v): View => mv(v, S('stack'), E('stack'), [0.0, 1.55, 4.3], [0.3, 1.35, 3.0], [0.0, 1.2, 0.6], [0.2, 1.0, 0.45], [44, 42], 0.2),
  shakes: [[STACK, 0.35]],
  render: (v) => <KitchenSet v={v} />,
};

// ======================================================================= 6. the office: kids in, adults out

const KID_SEATS: V3[] = [
  [-0.7, 0, 0.75],
  [0.0, 0, 0.75],
  [0.7, 0, 0.75],
  [-0.7, 0, -0.75],
  [0.7, 0, -0.75],
];
const kidWalk = (v: number, i: number): {p: V3; yaw: number; pose: HumanPose} => {
  const t = v - ENTER - i * 0.35;
  const seat = KID_SEATS[i];
  const door: V3 = [4.2, 0, 1.9];
  const mid: V3 = [seat[0] + 0.6, 0, 1.9];
  const d1 = Math.hypot(mid[0] - door[0], mid[2] - door[2]);
  const d2 = Math.hypot(seat[0] - mid[0], seat[2] - mid[2]);
  const sp = 1.4;
  const dist = Math.max(0, t) * sp;
  let p: V3;
  let yaw: number;
  if (dist < d1) {
    p = lerp3(door, mid, dist / d1);
    yaw = -Math.PI / 2;
  } else if (dist < d1 + d2) {
    p = lerp3(mid, seat, (dist - d1) / d2);
    yaw = Math.atan2(seat[0] - mid[0], seat[2] - mid[2]);
  } else {
    p = seat;
    yaw = seat[2] > 0 ? Math.PI : 0;
  }
  const moving = dist > 0 && dist < d1 + d2;
  const pose = moving ? {...walkPose(dist / 0.55, 0.9), face: {smile: 0.2, brow: 0.03}} : {face: {smile: 0.2, lid: blink(v, i) * 0.9}};
  return {p, yaw, pose: {...pose, armR: [-0.2, 0.15, 0], elbowR: -1.2}};
};
const ADULTS_OUT: V3[] = [
  [-0.7, 0, 0.75],
  [0.7, 0, 0.75],
  [0.0, 0, -0.75],
];
const adultLeave = (v: number, i: number): {p: V3; yaw: number; pose: HumanPose} => {
  const up = ease(v, S('office') + 0.3 + i * 0.25, S('office') + 0.8 + i * 0.25);
  const t = v - (S('office') + 0.9 + i * 0.3);
  const dist = Math.max(0, t) * 0.9;
  const s = ADULTS_OUT[i];
  const p: V3 = [s[0] - dist, 0, s[2] + (s[2] > 0 ? 0.35 : -0.35) * Math.min(1, dist)];
  const moving = dist > 0;
  const base: HumanPose = moving ? walkPose(dist / 0.6, 0.7) : {sit: 1 - up};
  return {p, yaw: moving ? -Math.PI / 2 : s[2] > 0 ? Math.PI : 0, pose: {...base, armL: [-0.55, 0.1, 0], elbowL: -1.0, armR: [-0.55, 0.1, 0], elbowR: -1.0, head: [0.25, 0, 0], face: {smile: -0.5, browIn: 0.5, lid: 0.35}}};
};

export const officeScene: Scene = {
  view: (v): View => mv(v, S('office'), E('office'), [1.5, 2.5, 6.4], [0.7, 2.2, 5.6], [0.6, 0.85, 0.5], [0.3, 0.85, 0.4], [50, 48], 0.3),
  render: (v) => (
    <>
      <color attach="background" args={['#e9e4dc']} />
      <InteriorLights key1={[3, 6, 5]} k={1} box={6} />
      <Office />
      {/* the door frame on the right */}
      <group position={[3.95, 0, 1.9]}>
        <Block position={[0, 1.05, -0.55]} size={[0.1, 2.1, 0.1]} color="#8a8a90" />
        <Block position={[0, 1.05, 0.55]} size={[0.1, 2.1, 0.1]} color="#8a8a90" />
        <Block position={[0, 2.12, 0]} size={[0.1, 0.1, 1.2]} color="#8a8a90" />
      </group>
      {ADULTS_OUT.map((s, i) => {
        const a = adultLeave(v, i);
        return (
          <group key={i}>
            {a.pose.sit ? <Chair position={[s[0], 0, s[2] + (s[2] > 0 ? 0.1 : -0.1)]} rotation={s[2] > 0 ? Math.PI : 0} office color="#2a2a30" /> : null}
            <Human o={adult(i)} position={a.p} rotation={a.yaw} pose={a.pose} handR={<Box position={[-0.18, -0.05, 0.12]} />} />
          </group>
        );
      })}
      {KID_SEATS.map((_, i) => {
        const k = kidWalk(v, i);
        return <Human key={i} o={kid(i, true)} position={k.p} rotation={k.yaw} pose={k.pose} handR={<Block position={[0, -0.12, 0.02]} size={[0.06, 0.2, 0.25]} color="#3a2a20" />} />;
      })}
    </>
  ),
};

// ======================================================================= 7. the basement meeting, the plan

const MEET: {p: V3; yaw: number}[] = [
  {p: [-0.85, 0, -0.2], yaw: 0.9},
  {p: [0.85, 0, -0.2], yaw: -0.9},
  {p: [-0.3, 0, -0.55], yaw: 0.15},
  {p: [0.35, 0, -0.55], yaw: -0.15},
];
const planDraw = (v: number) => {
  const a = ramp(v, S('meeting') + 0.4, S('meeting') + 1.6);
  const b = ramp(v, PLAN - 0.3, PLAN + 1.6);
  return {k: `plan-${Math.round(a * 20)}-${Math.round(b * 40)}`, draw: (g: CanvasRenderingContext2D, W: number, H: number) => drawPlan(g, W, H, a, b)};
};
const BasementSet: React.FC<{v: number; people?: boolean}> = ({v, people = true}) => {
  const pd = planDraw(v);
  return (
    <>
      <color attach="background" args={['#1a1a20']} />
      <hemisphereLight color="#a8a0c0" groundColor="#2a2a30" intensity={0.35} />
      <pointLight position={[0, 1.95, 0.15]} color="#ffdca0" intensity={4} distance={6} decay={1.5} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[1, 3, 3]} color="#9aa8d8" intensity={0.35} />
      <pointLight position={[0.4, 1.5, 2.2]} color="#ffd8b0" intensity={1.4} distance={5} decay={1.4} />
      <Basement v={v} board={<Pic size={[1.2, 1.4]} res={[480, 560]} k={pd.k} draw={pd.draw} />} />
      {people && MEET.map((m, i) => (
        <Human
          key={i}
          o={adult(i + 4)}
          position={m.p}
          rotation={m.yaw}
          pose={{lean: 0.35, head: [0.2, 0, 0], armL: [-0.75, 0.2, 0], elbowL: -0.4, armR: [-0.75, 0.2, 0], elbowR: -0.4, face: {brow: -0.03, browIn: -0.3, tilt: 0.3, mouth: i === 0 ? chatter(v) * 0.6 : 0.05, lid: blink(v, i) * 0.9 + 0.2, look: [0, -0.2]}}}
        />
      ))}
      <Cyl position={[0.25, 0.8, 0.15]} rt={0.04} rb={0.04} h={0.1} color="#f4efe6" />
    </>
  );
};

export const meetingScene: Scene = {
  view: (v): View => mv(v, S('meeting'), E('meeting'), [0.9, 1.75, 3.2], [0.45, 1.65, 2.6], [0, 1.35, -0.8], [0, 1.4, -0.9], [48, 46], 0.25),
  render: (v) => <BasementSet v={v} />,
};
export const planScene: Scene = {
  view: (v): View => mv(v, S('plan'), E('plan'), [0.3, 1.78, 0.75], [0.1, 1.76, 0.45], [0, 1.75, -2.1], [0, 1.75, -2.1], [44, 44]),
  render: (v) => <BasementSet v={v} people={false} />,
};
export {KID_SUIT};
