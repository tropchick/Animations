import React from 'react';
import {Human, HumanPose, walkPose} from '../bear/People';
import {Pic} from '../bear/Props';
import {Glow} from '../bear/kit';
import {Scene, blink, ease, mv} from '../bear/common';
import {InteriorLights} from '../cs2/scenes1';
import type {View} from '../slime/camera';
import {P16, P18, P20} from './phr';
import {DENY, FINAL, RULER, VOID, VOTE, V3, clamp01, lerp, ramp, shotEnd, shotStart} from './cues';
import {Airport, BALLER, BackCap, HERO, Hall, OFFICER, Palm, RULER_AT, SCORE_AT, ZAVUCH, sixSeven} from './Sets';
import {ClassSet, Council, HERO_SEAT, HeroOnStool, LAW_AT, Pupils, ZAV_AT, zavStandPose} from './scenes1';
import {drawBoardBan, drawLaw} from './tex';

const S = shotStart;
const E = shotEnd;

// ======================================================================= 11. the border: 2,01 m = 6'7"

const BALL_STOP: V3 = [RULER_AT[0], 0, RULER_AT[2] + 0.22];
const ballerAt = (v: number): V3 => {
  const k = ease(v, S('border') - 0.2, P16.s + 1.6);
  return [lerp(RULER_AT[0] + 3.2, BALL_STOP[0], k), 0, lerp(RULER_AT[2] + 1.2, BALL_STOP[2], k)];
};
const BorderSet: React.FC<{v: number}> = ({v}) => {
  const lit = ease(v, RULER - 0.1, RULER + 0.25);
  const at = ballerAt(v);
  const walking = 1 - ease(v, P16.s + 1.3, P16.s + 1.7);
  const turn = ease(v, P16.s + 1.2, P16.s + 1.7);
  const sad = ease(v, DENY, DENY + 0.4);
  const w = walkPose((v - S('border')) * 1.0, walking * 0.8);
  const pose: HumanPose = {
    ...w,
    head: [lerp(0, -0.25, lit * (1 - sad)) + 0.3 * sad, 0, 0],
    face: {lid: blink(v, 3) * 0.9 + 0.3 * sad, smile: lerp(0.5, -0.7, sad), happy: 0.4 * (1 - sad), browIn: 0.5 * sad, look: [0, lerp(0.5 * lit, -0.3, sad)], mouth: 0.15 * sad},
  };
  return (
    <>
      <color attach="background" args={['#eef2f6']} />
      <InteriorLights key1={[3, 6, 5]} k={1.0} box={5} />
      <Airport lit={lit} />
      <Human o={OFFICER} position={[-1.1, 0, -1.55]} rotation={0.5} pose={{head: [0.0, 0.3, 0], face: {lid: blink(v, 1) * 0.9 + 0.2, browIn: -0.3, smile: -0.2, look: [0.4, 0.2]}}} />
      <Human o={BALLER} position={at} rotation={lerp(-Math.PI / 2 - 0.3, 0, turn)} pose={pose} />
      {lit > 0 ? <Glow position={[RULER_AT[0], 2.01, RULER_AT[2] + 0.05]} size={0.6} color="#ff6a5a" k={0.5 * lit} /> : null}
    </>
  );
};
export const borderScene: Scene = {
  view: (v): View => mv(v, S('border'), E('border'), [0.2, 1.55, 4.3], [0.6, 1.65, 3.4], [0.6, 1.35, -0.6], [0.7, 1.45, -0.6], [50, 46], 0.3),
  render: (v) => <BorderSet v={v} />,
};
export const rulerScene: Scene = {
  view: (v): View => mv(v, S('ruler'), E('ruler'), [1.65, 2.15, 1.35], [1.45, 2.05, 1.1], [0.72, 1.95, -0.55], [0.75, 1.95, -0.55], [46, 42], 0.1),
  render: (v) => <BorderSet v={v} />,
};

// ======================================================================= 12. the vote: «ЗА: 67»

const VoteSet: React.FC<{v: number; law?: boolean}> = ({v, law}) => {
  const count = 67 * ease(v, VOTE - 0.75, VOTE);
  const hit = ease(v, VOTE, VOTE + 0.15) * (0.7 + 0.3 * Math.sin((v - VOTE) * 8));
  const shock = ease(v, VOTE + 0.15, VOTE + 0.5);
  const look = ease(v, P18.s + 0.3, P18.s + 1.0);
  const pose = zavStandPose(v, 0, {
    head: [lerp(0.05, -0.2, look), lerp(0, 0.9, look), 0],
    armL: [lerp(-0.15, -0.5, 1 - shock), 0.12, 0],
    elbowL: lerp(-0.4, -1.6, 1 - shock),
    armR: [lerp(-0.15, -1.9, shock), 0.3, 0],
    elbowR: lerp(-0.4, -1.6, shock),
    face: {lid: blink(v, 9) * 0.9 * (1 - shock), smile: lerp(0.5, -0.4, shock), happy: 0.5 * (1 - shock), wide: shock, mouth: 0.5 * shock, o: shock, brow: 0.06 * shock, browIn: 0.3 * shock, look: [0.5 * look, 0.25 * look]},
  });
  const voided = ease(v, VOID - 0.3, VOID + 0.5);
  return (
    <>
      <color attach="background" args={['#e8dcc8']} />
      <InteriorLights key1={[3, 6, 5]} k={0.95} box={6} />
      <Hall score={count} hit={hit} />
      <Council v={v} look={look} proud={1 - shock} shock={shock} />
      <group position={LAW_AT} rotation={[-Math.PI / 2, 0, 0.05]}>
        <Pic size={[0.42, 0.56]} res={[630, 840]} k={`law-1-${Math.round(voided * 20)}`} draw={drawLaw(1, law ? voided : 0)} />
      </group>
      <Human o={ZAVUCH} position={ZAV_AT} pose={pose} />
      {hit > 0 ? <Glow position={[SCORE_AT[0] + 0.5, SCORE_AT[1] + 0.05, SCORE_AT[2] + 0.1]} size={1.0} color="#ffd23f" k={0.35 * hit} /> : null}
    </>
  );
};
export const voteScene: Scene = {
  view: (v): View => {
    // a wide on the proud council, then a push to the scoreboard just before 67 lands
    const k = ease(v, VOTE - 1.6, VOTE - 0.1);
    const a = mv(v, S('vote'), VOTE - 1.6, [-2.4, 1.6, 3.0], [-1.6, 1.55, 2.6], [0.3, 1.3, -0.6], [0.6, 1.4, -0.8], [50, 48], 0.2);
    return {pos: [lerp(a.pos[0], 1.65, k), lerp(a.pos[1], 2.05, k), lerp(a.pos[2], 0.95, k)], target: [lerp(a.target[0], SCORE_AT[0] - 0.02, k), lerp(a.target[1], SCORE_AT[1] - 0.2, k), lerp(a.target[2], SCORE_AT[2], k)], fov: lerp(a.fov, 44, k), far: 300};
  },
  shakes: [[VOTE, 0.25]],
  render: (v) => <VoteSet v={v} />,
};
// the law crossed out by itself
export const voidScene: Scene = {
  view: (v): View => mv(v, S('void'), E('void'), [0.05, 1.32, 0.66], [0.03, 1.24, 0.6], [0, 0.79, 0.1], [0, 0.79, 0.11], [42, 40]),
  shakes: [[VOID + 0.4, 0.25]],
  render: (v) => <VoteSet v={v} law />,
};

// ======================================================================= 13. finale: six seven! even the head teacher

const ZAV_F: V3 = [0.45, 0, -0.45];
export const finaleScene: Scene = {
  view: (v): View => mv(v, S('finale'), E('finale') + 0.5, [0.1, 1.45, -1.88], [0.3, 1.52, -1.95], [0.0, 1.15, 1.0], [-0.05, 1.2, 1.0], [56, 60], 0.2),
  render: (v) => {
    const secret = ease(v, FINAL + 1.0, FINAL + 1.4);
    const zp: HumanPose = {
      ...sixSeven(v, 0.45 * secret, 1, 2.8),
      head: [0.05, lerp(0.6, 0.2, secret), 0],
      face: {lid: blink(v, 9) * 0.9, smile: lerp(-0.3, 0.45, secret), happy: 0.5 * secret, look: [lerp(0.4, -0.5, secret), 0], browIn: lerp(-0.4, 0.1, secret)},
    };
    return (
      <>
        <ClassSet />
        <Pupils v={v} gesture={(i) => ease(v, FINAL - 0.1 + (i % 3) * 0.06, FINAL + 0.25 + (i % 3) * 0.06)} shout={1} skip={(r, c) => r === 0 && c === 1} stand={() => 0} />
        <HeroOnStool v={v} />
        <Human o={ZAVUCH} position={ZAV_F} rotation={3.5} pose={zp} handL={secret > 0.1 ? <Palm skin={ZAVUCH.skin} /> : undefined} handR={secret > 0.1 ? <Palm skin={ZAVUCH.skin} /> : undefined} />
      </>
    );
  },
};

// ======================================================================= cover: the hero on his stool, the banned 67 on the board

const COVER_HERO: V3 = [0.75, 0, -0.6];
export const CoverWorld: React.FC<{v?: number}> = ({v = 0.31}) => {
  return (
    <>
      <ClassSet boardDraw={drawBoardBan} boardKey="board-ban" />
      <Pupils v={v} gesture={() => 1} shout={1} skip={(r, c) => r === 0 && c === 1} />
      <HeroOnStool v={v} yaw={0} at={COVER_HERO} />
    </>
  );
};
export const coverView: View = {pos: [0.3, 1.3, 2.3], target: [0.05, 1.35, -1.5], fov: 52, far: 300};

export {HERO, HERO_SEAT, BackCap, ramp, clamp01, P20};
