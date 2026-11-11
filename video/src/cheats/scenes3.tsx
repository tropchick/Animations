import React from 'react';
import {Human, HumanPose} from '../bear/People';
import {Pic, Table} from '../bear/Props';
import {AnyaRoom} from '../bear/Sets';
import {Block, Glow, RBox} from '../bear/kit';
import {Scene, blink, ease, mv} from '../bear/common';
import {InteriorLights} from '../cs2/scenes1';
import {Crumble} from '../brain/Sets';
import type {View} from '../slime/camera';
import {CODES, DOOR, ERASE, FAIL, FLAG, V3, clamp01, lerp, shotEnd, shotStart, typedText} from './cues';
import {Curlers, FLAG_COLS, Flag, HERO, MOM, MoonSet, Prints, Slipper} from './Sets';
import {BigPhone, Thumb, keyboardDraw, withArm} from './common';
import {drawDiary} from './tex';

const S = shotStart;
const E = shotEnd;

// ======================================================================= Saturday: the flag vanishes from the Moon

export const moonScene: Scene = {
  view: (v): View => mv(v, S('moon'), E('moon'), [1.6, 1.1, 3.2], [1.2, 1.2, 2.6], [0.3, 1.1, 0], [0.3, 1.2, 0], [44, 42], 0.2),
  render: (v) => (
    <>
      <MoonSet />
      <Prints />
      {v < FLAG + 0.05 ? <Flag v={v} /> : null}
      <Crumble center={[0.3, 0.0, 0]} t={v - FLAG} colors={FLAG_COLS} h={1.8} w={0.4} n={60} seed={4} />
    </>
  ),
};

// the diary: the red «5» dissolves into cubes
const DIARY_AT: V3 = [0, 0.762, 0];
export const diaryScene: Scene = {
  view: (v): View => mv(v, S('diary'), E('diary'), [0.02, 1.76, 0.42], [0.02, 1.7, 0.38], [0.01, 0.77, -0.06], [0.02, 0.77, -0.07], [44, 42]),
  noHandheld: true,
  render: (v) => {
    const e = clamp01((v - ERASE) / 0.6);
    // the «5» sits at 80% across, third row; page 0.42 x 0.56 m
    const fiveAt: V3 = [DIARY_AT[0] + 0.42 * 0.3, DIARY_AT[1] + 0.005, DIARY_AT[2] - 0.56 * 0.5 + 0.56 * ((120 + 96 * 3 - 40) / 1120)];
    return (
      <>
        <color attach="background" args={['#efd9bd']} />
        <InteriorLights key1={[1.5, 4, 3]} k={0.95} box={2} />
        <AnyaRoom />
        <Table position={[0, 0, 0]} size={[1.0, 0.7]} top="#b07a4a" />
        <RBox position={[DIARY_AT[0], DIARY_AT[1] - 0.004, DIARY_AT[2]]} size={[0.45, 0.012, 0.59]} r={0.004} color="#2a5bd8" />
        <Pic position={[DIARY_AT[0], DIARY_AT[1] + 0.003, DIARY_AT[2]]} rotation={[-Math.PI / 2, 0, 0]} size={[0.42, 0.56]} res={[840, 1120]} k={`diary-${Math.round(e * 30)}`} draw={(g, W, H) => drawDiary(g, W, H, e)} />
        <RBox position={[-0.3, 0.775, 0.12]} rotation={[0, 0.6, 0]} size={[0.16, 0.02, 0.012]} r={0.004} color="#e8453c" />
        <group scale={0.25} position={[fiveAt[0] * 0.75, fiveAt[1] * 0.75, fiveAt[2] * 0.75]}>
          <Crumble center={fiveAt} t={(v - ERASE) * 1.2} colors={['#e8453c', '#ff6a5a', '#c43b3b']} h={0.25} w={0.12} n={26} seed={9} />
        </group>
      </>
    );
  },
};

// ======================================================================= Sunday: mom in the doorway

const KID_BED: V3 = [0.35, 0.2, -0.6];
const MOM_AT: V3 = [-1.85, 0, 1.45];
const DOOR_Z = 1.45;

const Doorway: React.FC<{open: number}> = ({open}) => (
  <group position={[-2.245, 0, DOOR_Z]}>
    {/* the dark hallway seen through the door */}
    <mesh position={[0.002, 1.05, 0]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[0.92, 2.1]} />
      <meshBasicMaterial color="#5a4a52" toneMapped={false} />
    </mesh>
    <RBox position={[0.03, 2.13, 0]} size={[0.06, 0.08, 1.06]} r={0.01} color="#f4efe6" />
    {[-1, 1].map((s) => (
      <RBox key={s} position={[0.03, 1.07, s * 0.5]} size={[0.06, 2.14, 0.07]} r={0.01} color="#f4efe6" />
    ))}
    {/* the door leaf opens into the room on its hinge at z = -0.46 */}
    <group position={[0.06, 0, -0.46]} rotation={[0, -open * 1.4, 0]}>
      <RBox position={[0.02, 1.04, 0.45]} size={[0.04, 2.06, 0.88]} r={0.01} color="#d8b48a" />
      <RBox position={[0.06, 1.0, 0.82]} size={[0.04, 0.04, 0.1]} r={0.01} color="#c8ccd2" look={{metal: 0.6, rough: 0.3}} />
    </group>
  </group>
);

const momPose = (v: number, raise: number): HumanPose =>
  withArm(MOM, MOM_AT, Math.PI / 2, {head: [0.05, 0.05, 0], armL: [-0.7, 0.2, 0], elbowL: -1.3, face: {tilt: 0.5, brow: -0.04, browIn: -0.45, lid: 0.35 + blink(v, 4) * 0.5, smile: -0.4, look: [0.15, -0.05]}}, 1, [MOM_AT[0] + lerp(0.12, -0.05, raise), lerp(1.0, 1.85, raise), MOM_AT[2] - lerp(0.22, 0.42, raise)]);

const kidBedPose = (v: number, panic: number, freeze: number): HumanPose => {
  const hold: V3 = [KID_BED[0] - 0.02, KID_BED[1] + 0.82, KID_BED[2] + 0.28];
  return withArm(
    HERO,
    KID_BED,
    0,
    {
      sit: 1,
      lean: 0.12 + panic * 0.08,
      head: [lerp(0.25, 0.4, panic) - freeze * 0.25, lerp(-0.35, 0, panic) - freeze * 0.6, 0],
      armL: [-0.95, 0.15, 0.2],
      elbowL: -1.0,
      face: {wide: 0.4 + panic * 0.6, brow: 0.05 + panic * 0.04, browIn: 0.4 * panic, mouth: 0.15 + 0.25 * panic, o: freeze, look: [freeze * -0.5, -0.1 + freeze * 0.2], lid: blink(v, 8) * 0.6 * (1 - panic)},
    },
    1,
    hold,
  );
};

const RoomSet: React.FC<{v: number; noKidHead?: boolean}> = ({v, noKidHead}) => {
  const open = ease(v, DOOR - 0.1, DOOR + 0.7);
  const raise = ease(v, FAIL + 0.2, FAIL + 1.8);
  const panic = ease(v, S('panic') - 0.2, S('panic') + 0.3);
  const freeze = ease(v, FAIL - 0.1, FAIL + 0.3);
  const momIn = ease(v, DOOR + 0.3, DOOR + 1.2);
  const text = typedText(6, v);
  const kb = keyboardDraw(text, '', 0, v >= FAIL ? 1 : 0);
  return (
    <>
      <color attach="background" args={['#efd9bd']} />
      <InteriorLights key1={[2.5, 5, 4]} k={0.95} box={4} />
      <AnyaRoom />
      <Doorway open={open} />
      <Human
        o={HERO}
        position={KID_BED}
        pose={kidBedPose(v, panic, freeze)}
        noHead={noKidHead}
        handR={
          <group position={[0, -0.06, 0.04]} rotation={[-1.2, 0, 0]} scale={1}>
            <BigPhone position={[0, 0, 0]} k={kb.key} draw={kb.draw} />
          </group>
        }
      />
      {momIn > 0 ? (
        <Human o={MOM} position={[lerp(-2.15, MOM_AT[0], momIn), 0, MOM_AT[2]]} rotation={Math.PI / 2 - 0.35} pose={momPose(v, raise)} head={<Curlers />} handR={<Slipper />} />
      ) : null}
      <Glow position={[KID_BED[0], KID_BED[1] + 0.85, KID_BED[2] + 0.25]} size={0.35} color="#cfe0ff" k={0.12} />
    </>
  );
};

export const doorScene: Scene = {
  view: (v): View => mv(v, S('door'), E('door'), [1.5, 1.3, -0.05], [1.3, 1.25, 0.1], [-1.6, 1.15, 1.2], [-1.7, 1.25, 1.35], [48, 44], 0.2),
  render: (v) => <RoomSet v={v} />,
};

// the kid panics and types the police code on the phone (close)
const PANIC_PH: V3 = [0.33, 1.0, -0.33];
export const panicScene: Scene = {
  view: (v): View => mv(v, S('panic'), E('panic'), [-0.35, 1.08, 0.45], [-0.25, 1.05, 0.3], [0.3, 0.95, -0.5], [0.3, 0.95, -0.5], [42, 38]),
  render: (v) => {
    const keys: [number, string][] = CODES[6].keys.map((t, i) => [t, CODES[6].text[i]]);
    return (
      <>
        <RoomSet v={v} />
        {/* a hand-held close insert: thumb on the phone the kid holds */}
        <group position={PANIC_PH} rotation={[-0.5, 0.25, 0]} visible={false}>
          <Thumb v={v} keys={keys} skin={HERO.skin} />
        </group>
      </>
    );
  },
};

// mom keeps staring and slowly raises the slipper
export const stareScene: Scene = {
  view: (v): View => mv(v, S('stare'), E('stare'), [-0.3, 1.25, 0.95], [-0.7, 1.32, 1.15], [-1.9, 1.35, 1.42], [-1.9, 1.45, 1.42], [38, 34]),
  render: (v) => <RoomSet v={v} />,
};

export {Block, DIARY_AT};
