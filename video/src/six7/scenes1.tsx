import React from 'react';
import {Human, HumanPose, Outfit, walkPose} from '../bear/People';
import {Chair, Pic} from '../bear/Props';
import {Block, RBox} from '../bear/kit';
import {Scene, blink, chatter, ease, mv} from '../bear/common';
import {InteriorLights} from '../cs2/scenes1';
import {withArm} from '../brain/scenes1';
import {COLS_X, Classroom, ROWS_Z, SchoolDesk, Stool, kid} from '../brain/Sets';
import {STALL, SELLER, Stall} from '../cheats/Sets';
import {StreetSet} from '../cheats/common';
import type {View} from '../slime/camera';
import {P0, P1, P2, P4, P5} from './phr';
import {POSTER, STAMP, TAPE, V3, WHISTLE, clamp01, lerp, lerp3, ramp, shotEnd, shotStart} from './cues';
import {BackCap, HERO, Hall, Palm, Scales, StampTool, Whistle, ZAVUCH, sixSeven, teacher} from './Sets';
import {drawBoard, drawLaw, drawPoster} from './tex';

const S = shotStart;
const E = shotEnd;

// ======================================================================= the classroom (shared)

// the class: the board at z = -2 (brain Classroom) plus a back wall with a door at z = +3
export const ClassSet: React.FC<{board?: string[]; boardK?: number; boardDraw?: (g: CanvasRenderingContext2D, W: number, H: number) => void; boardKey?: string}> = ({board = ['60 + 7 = ?'], boardK = 1, boardDraw, boardKey}) => (
  <>
    <color attach="background" args={['#e9e2c8']} />
    <InteriorLights key1={[-3, 5, 3]} k={0.95} box={5} />
    <Classroom board={<Pic size={[2.8, 1.2]} res={[1120, 480]} k={boardKey ?? `b-${board.join('|')}-${Math.round(boardK * 40)}`} draw={boardDraw ?? drawBoard(board, boardK)} lit={false} glow={0.95} />} />
    <Block position={[0, 1.6, 3.05]} size={[6.4, 3.2, 0.1]} color="#e9e2c8" look={{rough: 0.95}} />
    <Block position={[0, 0.45, 2.99]} size={[6.4, 0.9, 0.02]} color="#9fc0a8" look={{rough: 0.95}} />
    <group position={[-1.9, 0, 2.97]}>
      <RBox position={[0, 1.05, 0]} size={[1.0, 2.1, 0.06]} r={0.02} color="#8a5a34" />
      <Block position={[0.36, 1.0, -0.04]} size={[0.06, 0.06, 0.04]} color="#d8c070" />
    </group>
    <Pic position={[1.2, 1.9, 2.995]} rotation={[0, Math.PI, 0]} size={[1.0, 0.7]} res={[400, 280]} k="table-mult" draw={drawBoard(['6 × 7 = 42', '7 × 7 = 49'], 1, 0.3)} lit={false} glow={0.9} />
  </>
);

const pupilAt = (r: number, c: number): V3 => [COLS_X[c], 0, ROWS_Z[r]];
// the pupils at their desks facing the board (−z); gesture amount per pupil, hands up, or plain
export const Pupils: React.FC<{v: number; gesture?: (i: number) => number; hands?: number; skip?: (r: number, c: number) => boolean; shout?: number; sneaky?: number; stand?: (i: number) => number}> = ({
  v,
  gesture = () => 0,
  hands = 0,
  skip,
  shout = 0,
  sneaky = 0,
  stand = () => 0,
}) => (
  <>
    {ROWS_Z.map((z, r) =>
      COLS_X.map((x, c) => {
        const i = r * 3 + c;
        const p = pupilAt(r, c);
        const desk = <SchoolDesk position={[x, 0, z - 0.5]} h={0.55} />;
        if (skip?.(r, c))
          return (
            <group key={`${r}${c}`}>
              {desk}
              <Stool position={[x, 0, z]} h={0.36} />
            </group>
          );
        const o = kid(i);
        const g = gesture(i);
        const st = stand(i);
        const up = hands > 0 ? clamp01(hands * 1.6 - (i % 3) * 0.25) : 0;
        const base: HumanPose = {
          sit: 1 - st,
          lean: 0.06,
          head: [-0.1, 0.1 * Math.sin(v * 0.7 + i) + sneaky * 0.3 * Math.sin(v * 2 + i), 0],
          armL: [-0.7, 0.2, 0],
          elbowL: -1.1,
          armR: [-0.7, 0.2, 0],
          elbowR: -1.1,
          face: {
            lid: blink(v, i) * 0.9,
            smile: 0.4 * g + 0.3 * shout,
            mouth: shout * chatter(v + i, 0.9) + 0.1 * g,
            o: shout * 0.3,
            happy: 0.5 * g,
            look: [sneaky * 0.6 * Math.sin(v * 2 + i), 0],
          },
        };
        let pose: HumanPose = base;
        if (g > 0) {
          const gp = sixSeven(v, g, i);
          pose = {...base, ...gp, sit: base.sit, lean: base.lean, face: base.face, head: [(gp.head?.[0] ?? 0) - 0.1, gp.head?.[1] ?? 0, gp.head?.[2] ?? 0]};
        }
        if (up > 0) pose = {...pose, armR: [lerp(-0.7, -2.95, up), 0.15, 0], elbowR: lerp(-1.1, -0.1, up), face: {...pose.face, smile: 0.6 * up, happy: 0.6 * up, mouth: 0.25 * up}};
        return (
          <group key={`${r}${c}`}>
            {desk}
            <Stool position={[x, 0, z]} h={0.36} />
            <Human o={o} position={p} rotation={Math.PI} pose={pose} handL={g > 0 ? <Palm skin={o.skin} /> : undefined} handR={g > 0 ? <Palm skin={o.skin} /> : undefined} />
          </group>
        );
      }),
    )}
  </>
);

// the hero standing on his stool in the middle of the front row, facing the board or the camera
export const HERO_SEAT: V3 = [COLS_X[1], 0, ROWS_Z[0]];
export const HeroOnStool: React.FC<{v: number; yaw?: number; amp?: number; shout?: number; at?: V3}> = ({v, yaw = Math.PI, amp = 1, shout = 1, at = HERO_SEAT}) => {
  const gp = sixSeven(v, amp, 0, 2.6);
  return (
    <>
      <Stool position={[at[0], 0, at[2]]} h={0.36} />
      <Human
        o={HERO}
        position={[at[0], 0.36, at[2]]}
        rotation={yaw}
        pose={{...gp, head: [-0.12, gp.head?.[1] ?? 0, gp.head?.[2] ?? 0], face: {mouth: shout * (0.45 + 0.35 * Math.abs(Math.sin(v * 7))), smile: 0.7, happy: 0.6, wide: 0.3, lid: blink(v, 3) * 0.8}}}
        head={<BackCap />}
        handL={<Palm skin={HERO.skin} />}
        handR={<Palm skin={HERO.skin} />}
      />
    </>
  );
};

// ======================================================================= 1. the class shouts «six seven»

export const classScene: Scene = {
  view: (v): View => mv(v, 0, E('class'), [1.6, 1.55, -1.75], [0.9, 1.45, -1.35], [-0.2, 1.05, 1.1], [0.0, 1.1, 0.9], [52, 48], 0.25),
  render: (v) => (
    <>
      <ClassSet />
      <Pupils v={v} gesture={(i) => ease(v, 0.25 + (i % 3) * 0.12, 0.6 + (i % 3) * 0.12)} shout={1 - ease(v, P1.s + 0.6, P1.e)} skip={(r, c) => r === 0 && c === 1} />
      <HeroOnStool v={v} />
    </>
  ),
};

// ======================================================================= 2. the council of teachers

const SEATS = [-2.6, -1.6, -0.9, 0.9, 1.6, 2.6];
export const ZAV_AT: V3 = [0, 0, -0.5];
export const Council: React.FC<{v: number; tired?: number; look?: number; proud?: number; shock?: number}> = ({v, tired = 0, look = 0, proud = 0, shock = 0}) => (
  <>
    {SEATS.map((x, i) => {
      const o: Outfit = teacher(i);
      // tired teachers: hands on the head, slowly shaking
      const t = tired * clamp01(1 - (i % 3) * 0.2);
      const pose: HumanPose = {
        sit: 1,
        lean: 0.12 + 0.1 * t,
        head: [0.1 + 0.2 * t, 0.15 * Math.sin(v * 1.6 + i) * t + look * (x > 0 ? 0.5 : 0.3), 0],
        armL: [lerp(-0.6, -2.4, t), lerp(0.2, 0.55, t), 0],
        elbowL: lerp(-1.2, -1.9, t),
        armR: [lerp(-0.6, -2.4, t), lerp(0.2, 0.55, t), 0],
        elbowR: lerp(-1.2, -1.9, t),
        face: {lid: blink(v, i + 2) * 0.9 + 0.25 * t, browIn: 0.4 * t + 0.4 * shock, smile: -0.4 * t + 0.3 * proud - 0.2 * shock, mouth: 0.4 * shock, o: shock, wide: shock, look: [look * (x > 0 ? 0.5 : -0.2), 0.3 * look]},
      };
      return (
        <group key={i}>
          <Chair position={[x, 0, -0.62]} rotation={0} color="#6a3a2a" />
          <Human o={o} position={[x, 0, -0.62]} pose={pose} />
        </group>
      );
    })}
  </>
);

const zavStandPose = (v: number, up: number, extra: HumanPose = {}): HumanPose => ({
  lean: 0.05,
  head: [0.1, 0, 0],
  armL: [-0.15, 0.12, 0],
  elbowL: -0.4,
  armR: [-0.15, 0.12, 0],
  elbowR: -0.4,
  face: {lid: blink(v, 9) * 0.9 + 0.15, browIn: -0.35 * up, brow: -0.02 * up, smile: -0.2},
  ...extra,
});

const LAW_AT: V3 = [0, 0.782, 0.12];
const stampY = (v: number) => {
  // the stamp rises, then slams down at STAMP and lifts again
  const down = v < STAMP ? 1 - ease(v, STAMP - 0.9, STAMP - 0.35) + ease(v, STAMP - 0.25, STAMP) : 1 - ease(v, STAMP + 0.35, STAMP + 0.8);
  return lerp(0.36, 0.0, clamp01(down));
};

const CouncilSet: React.FC<{v: number}> = ({v}) => {
  const stand = ease(v, P2.s + 0.2, P2.s + 1.0);
  const sy = stampY(v);
  const stamp: V3 = [LAW_AT[0] + 0.02, LAW_AT[1] + 0.008 + sy, LAW_AT[2] - 0.02];
  const pose = withArm(ZAVUCH, ZAV_AT, 0, zavStandPose(v, stand), 1, [stamp[0], stamp[1] + 0.16, stamp[2]]);
  return (
    <>
      <color attach="background" args={['#e8dcc8']} />
      <InteriorLights key1={[3, 6, 5]} k={0.95} box={6} />
      <Hall score={0} hit={0} />
      <Council v={v} tired={1 - ease(v, P2.e, P2.e + 0.6) * 0.7} look={ease(v, P2.e + 0.3, P2.e + 0.9)} />
      <group position={LAW_AT} rotation={[-Math.PI / 2, 0, 0.05]}>
        <Pic size={[0.42, 0.56]} res={[630, 840]} k={`law-${v >= STAMP ? 1 : 0}`} draw={drawLaw(v >= STAMP ? 1 : 0, 0)} />
      </group>
      <group position={stamp}>
        <StampTool />
      </group>
      <Human o={ZAVUCH} position={ZAV_AT} pose={pose} />
    </>
  );
};

export const councilScene: Scene = {
  view: (v): View => mv(v, S('council'), E('council'), [-3.2, 1.65, 2.9], [-1.6, 1.5, 2.2], [0.2, 1.1, -0.5], [0.0, 1.15, -0.4], [50, 46], -0.3),
  render: (v) => <CouncilSet v={v} />,
};

// the stamp close-up: the law, the slam
export const stampScene: Scene = {
  view: (v): View => mv(v, S('stamp'), E('stamp'), [0.05, 1.42, 0.82], [0.03, 1.3, 0.7], [0, 0.8, 0.08], [0, 0.79, 0.1], [40, 38]),
  shakes: [[STAMP, 0.35]],
  render: (v) => <CouncilSet v={v} />,
};

// ======================================================================= 3. the gesture banned: whistle in class

const ZAV_WALK = (v: number): V3 => [lerp(-0.65, -0.65, 0), 0, lerp(-0.9, 1.4, ramp(v, S('gesture') - 0.2, E('gesture') + 0.6))];
const GestureSet: React.FC<{v: number}> = ({v}) => {
  const at = ZAV_WALK(v);
  const ph = (v - S('gesture')) * 1.1;
  const blow = ease(v, WHISTLE - 0.15, WHISTLE) * (1 - ease(v, WHISTLE + 0.6, WHISTLE + 0.9));
  const w = walkPose(ph, 0.6);
  const pose: HumanPose = {...w, armR: [lerp(w.armR?.[0] ?? 0, -1.2, blow), 0.2, 0], elbowR: lerp(-0.35, -2.2, blow), head: [0.05, -0.4, 0], face: {browIn: -0.4, brow: -0.02, smile: -0.3, lid: 0.1, look: [-0.4, -0.1], mouth: 0.15 * blow, o: blow}};
  return (
    <>
      <ClassSet />
      <Pupils v={v} gesture={(i) => (i % 2 ? 0.7 : 0.55) * (1 - ease(v, WHISTLE, WHISTLE + 0.3))} sneaky={1} />
      <Human o={ZAVUCH} position={at} rotation={0} pose={pose} handR={<group position={[0, -0.02, 0.06]} rotation={[0.4, 0, 0]}><Whistle /></group>} />
    </>
  );
};
export const gestureScene: Scene = {
  view: (v): View => mv(v, S('gesture'), E('gesture'), [2.2, 1.5, -1.65], [1.9, 1.45, -1.25], [-0.4, 0.85, 0.9], [-0.4, 0.85, 1.0], [54, 50], 0.2),
  render: (v) => <GestureSet v={v} />,
};

// ======================================================================= 4. the poster goes up

const POSTER_AT: V3 = [3.14, 1.7, -0.5];
const ZAV_P: V3 = [2.5, 0, -1.25];
const PosterSet: React.FC<{v: number}> = ({v}) => {
  const reach = ease(v, POSTER - 0.45, POSTER - 0.05) * (1 - ease(v, POSTER + 0.4, POSTER + 0.8));
  const on = v >= POSTER;
  const hand: V3 = lerp3([ZAV_P[0] + 0.25, 1.1, ZAV_P[2] + 0.1], [POSTER_AT[0] - 0.08, POSTER_AT[1], POSTER_AT[2] - 0.05], reach);
  const base: HumanPose = {head: [-0.05, 0.4, 0], face: {browIn: -0.4, brow: -0.03, smile: -0.3, lid: blink(v, 4) * 0.9, look: [-0.2, 0]}};
  const pose = withArm(ZAVUCH, ZAV_P, Math.PI / 2 + 0.5, base, -1, hand);
  const s = on ? 1 : reach;
  return (
    <>
      <ClassSet />
      <Pupils v={v} sneaky={0.6} gesture={() => 0} />
      <group position={[POSTER_AT[0] - (on ? 0 : 0.06), POSTER_AT[1], POSTER_AT[2]]} rotation={[0, -Math.PI / 2, on ? 0.02 : 0.1]} scale={s * (on ? 1 + 0.08 * Math.exp(-(v - POSTER) * 10) : 1)}>
        <Pic size={[0.8, 1.0]} res={[480, 600]} k="poster" draw={drawPoster} />
      </group>
      <Human o={ZAVUCH} position={ZAV_P} rotation={Math.PI / 2 + 0.5} pose={pose} />
    </>
  );
};
export const posterScene: Scene = {
  view: (v): View => mv(v, S('poster'), E('poster'), [1.0, 1.55, 0.9], [1.3, 1.6, 0.6], [3.1, 1.55, -0.45], [3.1, 1.6, -0.5], [48, 44], 0.15),
  shakes: [[POSTER, 0.2]],
  render: (v) => <PosterSet v={v} />,
};

// ======================================================================= 5. the scales at the market

const SCALES_AT: V3 = [STALL[0] - 0.45, 1.05, STALL[2] + 0.2];
const ZAV_M = (v: number): V3 => [lerp(STALL[0] + 2.4, STALL[0] + 0.55, ease(v, S('scales'), TAPE - 0.6)), 0, STALL[2] + 1.0];
const ScalesSet: React.FC<{v: number}> = ({v}) => {
  const taped = ease(v, TAPE - 0.3, TAPE + 0.05);
  const tilt = 0.28 * Math.sin((v - S('scales')) * Math.PI * 2 * 1.3) * (1 - taped);
  const at = ZAV_M(v);
  const walking = 1 - ease(v, TAPE - 0.8, TAPE - 0.6);
  const w = walkPose((v - S('scales')) * 1.2, walking * 0.7);
  const reach = ease(v, TAPE - 0.6, TAPE - 0.2) * (1 - ease(v, TAPE + 0.3, TAPE + 0.7));
  const yaw = -Math.PI / 2 - 0.5;
  const base: HumanPose = {...w, head: [0.15, 0, 0], face: {browIn: -0.4, brow: -0.02, smile: -0.25, lid: blink(v, 5) * 0.9, look: [0, -0.2]}};
  const pose = reach > 0.02 ? withArm(ZAVUCH, at, yaw, base, -1, lerp3([at[0] - 0.2, 1.0, at[2]], [SCALES_AT[0] + 0.15, SCALES_AT[1] + 0.2, SCALES_AT[2] + 0.15], reach)) : base;
  return (
    <>
      <StreetSet center={[STALL[0], 0, STALL[2]]} />
      <Stall price={0} cash={0} />
      <Scales position={SCALES_AT} tilt={tilt} taped={taped} />
      <Human o={SELLER} position={[STALL[0], 0, STALL[2] - 0.7]} pose={{...sixSeven(v, 0.5 * (1 - taped), 2, 1.3), face: {lid: blink(v, 6) * 0.9 + 0.1, smile: 0.3 - taped * 0.6, wide: taped * 0.5, mouth: taped * 0.3, o: taped}}} />
      <Human o={ZAVUCH} position={at} rotation={yaw} pose={pose} />
    </>
  );
};
export const scalesScene: Scene = {
  view: (v): View => mv(v, S('scales'), E('scales'), [STALL[0] + 1.7, 1.75, STALL[2] + 3.2], [STALL[0] + 1.0, 1.6, STALL[2] + 2.6], [SCALES_AT[0] + 0.1, 1.25, SCALES_AT[2]], [SCALES_AT[0], 1.25, SCALES_AT[2]], [50, 44], 0.2),
  render: (v) => <ScalesSet v={v} />,
};

export {LAW_AT, CouncilSet, zavStandPose, P0, P4, P5};
