import React from 'react';
import {Human, HumanPose} from '../bear/People';
import {Ball, Pill} from '../bear/kit';
import {humanArmTo} from '../bear/rig';
import {ARTEM, SONYA, STRANGER, Earbud, HearingAid, dead, deadWalk} from './Chars';
import {DeadCrowd, Dead, arc} from './Crowd';
import {FRONT, F1, F2, RADIO, WALL_TEXT, House, HouseState} from './House';
import {HOUSE} from './Town';
import {Marker, Palm, WritingHand} from './Props';
import {Scene, Street, ease, mv, walkTo} from './common';
import {DarkRoom, H} from './scenes2';
import {HOWL, KNOCKS, V3, clamp01, lerp, rnd, shotLen, shotStart, tIn} from './cues';
import {walkPose} from './Chars';

// Scenes 8–10: the knock, the man at the door, the crowd, the radio, the wall, dawn, the palm, the road.

const HX = HOUSE[0];
const HZ = HOUSE[2];
const PORCH_Y = 0.24;
const MAN_AT: V3 = [HX + 0.1, PORCH_Y, HZ + FRONT + 0.42];
const MAN_BACK: V3 = [HX + 0.15, 0.02, HZ + FRONT + 2.1]; // stepped back off the porch to look up at the window
const SLIT_EYE: V3 = H([0.0, 4.45, FRONT + 0.02]);
// the upstairs, all set up (boarded, blankets, thread)
const UP: HouseState = {stairs: 0, ladder: 0, thread: 1, blankets: 1, upBoards: 1, doorBoards: 1, wardrobe: 1};
const SONYA_BED: V3 = H([-2.65, F2 - 0.23, 1.25]);
const ARTEM_SIT: V3 = H([-1.7, F2 - 0.39, 1.85]);

// the bite: a dark bruise ring on the inside of his left wrist (hand child)
const Bite: React.FC = () => (
  <group position={[0, 0.035, 0]}>
    <Ball scale={[0.05, 0.03, 0.05]} color="#3a1a26" shadow={false} />
  </group>
);

// ---------------------------------------------------------------- 8a. the knock
// first the door from inside (the camera jolts with each knock), then Соня jerks awake upstairs
const KNOCK_CUT = 3.1;
export const knockScene: Scene = {
  shakes: KNOCKS.map((k) => [k, 1.0] as [number, number]),
  view: (v) => {
    const t = tIn('knock', v);
    const L = shotLen('knock');
    if (t < KNOCK_CUT) return mv(t, 0, KNOCK_CUT, H([1.9, F1 + 0.8, 0.2]), H([1.7, F1 + 0.85, 0.5]), H([0.1, F1 + 1.35, FRONT - 0.3]), H([0.15, F1 + 1.3, FRONT - 0.3]), 56);
    return mv(t, KNOCK_CUT, L, H([-1.2, F2 + 1.05, 0.2]), H([-1.45, F2 + 0.95, 0.45]), H([-2.5, F2 + 0.55, 1.2]), H([-2.55, F2 + 0.6, 1.25]), [44, 36]);
  },
  render: (v) => {
    const t = tIn('knock', v);
    if (t < KNOCK_CUT)
      return (
        <>
          <DarkRoom k={1.0} />
          <House position={HOUSE} s={{v, ...UP, noRoof: true}} />
          {/* the moon through the gap above the boards; a strip of light on the floor */}
          <pointLight position={H([1.2, F1 + 2.2, 1.6])} color="#a8bcff" intensity={4} distance={5} decay={1.5} />
        </>
      );
    // she wakes on the tug: sits up straight, eyes wide, looks at Артём
    const tug = ease(t, KNOCK_CUT + 0.15, KNOCK_CUT + 0.45);
    const jerk = Math.max(0, 1 - Math.abs(t - KNOCK_CUT - 0.25) * 5);
    const sPose: HumanPose = {
      sit: 1,
      kneeL: -1.3,
      kneeR: -1.2,
      lean: lerp(-0.25, 0.05, tug),
      armL: [-0.6 - 0.5 * jerk, 0.2, 0.2],
      elbowL: -0.5,
      armR: [-0.3, 0.15, 0],
      elbowR: -0.4,
      head: [lerp(0.35, -0.05, tug), lerp(0.2, 0.55, ease(t, KNOCK_CUT + 0.7, KNOCK_CUT + 1.3)), lerp(0.25, 0, tug)],
      face: {lid: lerp(1, 0, tug), wide: 0.9 * tug, browIn: 0.5 * tug, brow: 0.1 * tug, mouth: 0.15 * tug},
    };
    return (
      <>
        <DarkRoom k={1.05} />
        <House position={HOUSE} s={{v, ...UP, noRoof: true}} />
        <Human o={SONYA} position={SONYA_BED} rotation={Math.PI * 0.55} pose={sPose} head={<HearingAid />} />
        <Human o={ARTEM} position={ARTEM_SIT} rotation={-Math.PI * 0.62} pose={{sit: 1, legL: -0.6, kneeL: 0.2, kneeR: -1.2, armR: [-0.5, 0.1, 0], elbowR: -0.6, head: [0.0, -0.6, 0], face: {wide: 0.6, brow: 0.1}}} />
        <pointLight position={H([-1.6, F2 + 1.7, 1.4])} color="#a8bcff" intensity={1.6} distance={3.5} decay={1.6} />
      </>
    );
  },
};

// the two of them at the boarded upstairs window, peering through the slit
const AT_SLIT_A: V3 = H([0.32, F2, FRONT - 0.62]);
const AT_SLIT_S: V3 = H([-0.32, F2, FRONT - 0.55]);
const slitPose = (look: number, shake = 0): HumanPose => ({
  lean: 0.28 * look,
  kneeL: 0.25 * look,
  kneeR: 0.25 * look,
  legL: -0.15 * look,
  legR: -0.15 * look,
  armR: [-0.9, 0.05, 0.2],
  elbowR: -1.1,
  head: [0.15 * look, Math.sin(shake * Math.PI * 4) * 0.35 * Math.min(1, shake * 4) * Math.min(1, (1 - shake) * 4), 0],
  face: {browIn: 0.3, brow: -0.05, tilt: 0.1},
});

// the man at the door: tired, holding up his left wrist (the bite), face up to the window
const manPose = (up: number, lift: number): HumanPose => ({
  lean: -0.05,
  head: [-0.75 * up, 0.05, 0.05],
  armL: [lerp(-0.2, -1.6, lift), 0.25, 0.5],
  elbowL: lerp(-0.2, -1.4, lift),
  armR: [-0.1, 0.1, 0],
  elbowR: -0.3,
  face: {browIn: 0.6, tilt: -0.4, mouth: 0.15, lid: 0.25, look: [0, 0.3 * up]},
});

const raised = (up: number, lift: number): HumanPose => {
  const p = manPose(up, 0);
  const ik = humanArmTo(STRANGER, MAN_BACK, Math.PI, p, -1, [MAN_BACK[0] + 0.05, 1.72, MAN_BACK[2] - 0.32]);
  return {...p, armL: [lerp(-0.2, ik.arm[0], lift), lerp(0.25, ik.arm[1], lift), 0], elbowL: lerp(-0.2, ik.elbow, lift)};
};

// ---------------------------------------------------------------- 8b. the voice at the door, the bite, «Артём не открывает»
const SL_A = 2.4;
const SL_B = 5.4;
export const slitScene: Scene = {
  view: (v) => {
    const t = tIn('slit', v);
    const L = shotLen('slit');
    if (t < SL_A) return mv(t, 0, SL_A, H([1.7, F2 + 1.5, 1.5]), H([1.4, F2 + 1.45, 1.75]), H([0, F2 + 1.25, FRONT - 0.4]), H([0, F2 + 1.3, FRONT - 0.3]), 46);
    // through the slit, down at him; the lens pushes in towards his raised wrist
    if (t < SL_B) {
      const wrist: V3 = [MAN_BACK[0] + 0.05, 1.68, MAN_BACK[2] - 0.3];
      return mv(t, SL_A, SL_B, SLIT_EYE, SLIT_EYE, [MAN_BACK[0], 1.0, MAN_BACK[2]], wrist, [40, 18]);
    }
    // close on Артём at the slit: he shakes his head
    return mv(t, SL_B, L, H([-1.0, F2 + 1.45, 1.3]), H([-0.85, F2 + 1.45, 1.5]), H([0.1, F2 + 1.35, FRONT - 0.5]), H([0.1, F2 + 1.35, FRONT - 0.5]), 42);
  },
  render: (v) => {
    const t = tIn('slit', v);
    const L = shotLen('slit');
    const pullTo = ease(t, 0.4, 1.6);
    const sPose: HumanPose = {
      armL: [-1.1 + 0.25 * Math.sin(t * 9) * (1 - pullTo), 0.35, 0.4],
      elbowL: -0.5,
      head: [-0.1, 0.4 * (1 - pullTo), 0],
      face: {wide: 0.7, browIn: 0.5},
    };
    const look = ease(t, 0.8, 2.0);
    const shake = clamp01((t - SL_B - 0.4) / 1.6);
    const up = ease(t, SL_A - 0.2, SL_A + 0.8);
    const lift = ease(t, SL_A + 0.6, SL_A + 1.6);
    return (
      <Street v={v} center={H([0, 2, FRONT + 1])} lamps={[4]} box={9} cam={H([0, 4.4, FRONT + 4])} house={{...UP, noRoof: t < SL_A || t >= SL_B}}>
        {t < SL_A || t >= SL_B ? <DarkRoom k={0.5} /> : null}
        <Human o={ARTEM} position={AT_SLIT_A} rotation={0} pose={slitPose(look, shake)} />
        <Human o={SONYA} position={AT_SLIT_S} rotation={lerp(0.9, 0.15, pullTo)} pose={sPose} head={<HearingAid />} />
        <pointLight position={H([0.0, F2 + 1.6, FRONT - 1.2])} color="#a8bcff" intensity={1.6} distance={3} decay={1.6} />
        <Human o={STRANGER} position={MAN_BACK} rotation={Math.PI} pose={raised(up, lift)} handL={<Bite />} />
        <pointLight position={[MAN_BACK[0] + 1.0, 2.8, MAN_BACK[2] + 1.0]} color="#b8c8ff" intensity={4} distance={5} decay={1.5} />
      </Street>
    );
  },
};

// ---------------------------------------------------------------- 8c. the whisper into the door crack, then the howl
export const whisperScene: Scene = {
  view: (v) => {
    const t = tIn('whisper', v);
    const L = shotLen('whisper');
    const hw = HOWL[0] - shotStart('whisper');
    if (t < hw + 1.3) return mv(t, 0, hw + 1.3, [MAN_AT[0] + 1.1, 1.5, MAN_AT[2] + 0.15], [MAN_AT[0] + 1.0, 1.3, MAN_AT[2] + 0.1], [MAN_AT[0] - 0.15, 1.45, MAN_AT[2] - 0.2], [MAN_AT[0] - 0.1, 1.7, MAN_AT[2]], [42, 46]);
    // the howl: the camera backs off into the yard; out of the dark, the first ones come
    return mv(t, hw + 1.3, L, [MAN_AT[0] + 1.1, 1.3, MAN_AT[2] + 0.2], [MAN_AT[0] + 2.6, 2.4, MAN_AT[2] + 4.2], [MAN_AT[0], 1.7, MAN_AT[2]], [MAN_AT[0] - 0.4, 1.5, MAN_AT[2] + 1], [40, 50]);
  },
  render: (v) => {
    const t = tIn('whisper', v);
    const hw = HOWL[0] - shotStart('whisper');
    const howl = ease(t, hw - 0.1, hw + 0.35) * (1 - ease(t, hw + 1.6, hw + 2.0)) + ease(t, hw + 2.0 - 0.05 + (HOWL[1] - HOWL[0] - 2.0), hw + (HOWL[1] - HOWL[0]) + 0.3) * 0.8;
    const lean = 1 - ease(t, hw - 0.4, hw);
    const whisper = t < hw - 0.5 ? 0.15 + 0.15 * Math.abs(Math.sin(t * 7)) : 0;
    const pose: HumanPose = {
      lean: 0.32 * lean - 0.1 * howl,
      head: [lerp(0.1, -0.9, howl), lerp(-0.55, 0, 1 - lean), -0.1 * lean],
      armL: [-1.3 * lean, 0.3, 0.2],
      elbowL: -1.2 * lean,
      armR: [lerp(-0.2, 0.15, howl), lerp(0.1, 0.35, howl), 0],
      elbowR: -0.3,
      face: {lid: lerp(0.35, 0.0, howl), browIn: lerp(0.6, -0.2, howl), tilt: lerp(-0.4, 0.4, howl), mouth: Math.max(whisper, howl), o: howl, wide: 0.6 * howl},
    };
    // the first of them, at the gate, after the howl
    const come = Array.from({length: 4}, (_, i) => {
      const w = walkTo(t, hw + 0.6 + i * 0.35, hw + 6, [HX - 2.5 + i * 1.6, 0, HZ + FRONT + 9 + rnd(i) * 2], [HX - 0.6 + i * 0.6, 0, HZ + FRONT + 4.2], 0.5);
      return w;
    });
    return (
      <Street v={v} center={[MAN_AT[0], 0, MAN_AT[2] + 2]} lamps={[4]} box={10} cam={[MAN_AT[0] + 2, 2, MAN_AT[2] + 3]} house={UP}>
        <Human o={STRANGER} position={[MAN_AT[0] - 0.1, MAN_AT[1], MAN_AT[2]]} rotation={Math.PI - 0.45 * lean - 0.5 * howl} pose={pose} />
        <pointLight position={[MAN_AT[0] + 1.0, 2.5, MAN_AT[2] + 1.4]} color="#b8c8ff" intensity={3.5} distance={5} decay={1.5} />
        {t > hw
          ? come.map((w, i) => <Human key={i} o={dead(i + 3)} position={w.p} rotation={w.yaw} pose={deadWalk(w.ph, v, i + 3, w.amp * 0.55)} />)
          : null}
      </Street>
    );
  },
};

// the crowd that comes and stands in a half-ring in front of the door
const DOOR_FLOOR: V3 = [MAN_AT[0], 0, MAN_AT[2]];
const CROWD0 = shotStart('crowd');
export const CROWD: Dead[] = arc(DOOR_FLOOR, 1.7, 4, 9, 2.5, 0, 5).map((d, k) => {
  const dx = d.p[0] - DOOR_FLOOR[0];
  const dz = d.p[2] - DOOR_FLOOR[2];
  const L = Math.hypot(dx, dz) || 1;
  const far = 9 + rnd(k * 1.7) * 7;
  const from: V3 = [d.p[0] + (dx / L) * far + (rnd(k) - 0.5) * 4, 0, d.p[2] + (dz / L) * far];
  const t0 = CROWD0 - 1.2 + rnd(k * 2.3) * 2.4;
  return {...d, walk: {from, to: d.p, t0, t1: t0 + 3.4 + rnd(k * 0.7) * 1.4}};
});

// ---------------------------------------------------------------- 8d. dozens, standing, waiting
const CR_CUT = 4.6;
export const crowdScene: Scene = {
  view: (v) => {
    const t = tIn('crowd', v);
    const L = shotLen('crowd');
    if (t < CR_CUT) return mv(t, 0, CR_CUT, [HX + 6, 9.5, HZ + FRONT + 14], [HX + 4.5, 5.8, HZ + FRONT + 10.5], [HX, 0.3, HZ + FRONT + 5], [HX, 0.9, HZ + FRONT + 2.0], [56, 46]);
    // low, behind the last row: their backs and, past them, the dark door
    return mv(t, CR_CUT, L, [HX + 1.4, 1.05, HZ + FRONT + 6.6], [HX + 1.2, 1.1, HZ + FRONT + 6.3], [HX, 1.3, HZ + FRONT], [HX, 1.35, HZ + FRONT], 40);
  },
  render: (v) => (
    <Street v={v} center={[HX, 0, HZ + FRONT + 4]} lamps={[4]} box={14} cam={[HX + 5, 6, HZ + FRONT + 11]} house={UP}>
      <DeadCrowd dead={CROWD} v={v} />
      <Human o={STRANGER} position={MAN_AT} rotation={Math.PI} pose={{head: [0.25, 0, 0.1], face: {lid: 0.3, tilt: 0.2}}} />
      <pointLight position={[HX + 2, 3.5, HZ + FRONT + 3]} color="#b8c8ff" intensity={5} distance={9} decay={1.4} />
    </Street>
  ),
};

// Артём on the floor at the desk with the radio (one earbud), lit only by the dial
const ARTEM_RADIO: V3 = H([1.85, F2 - 0.39, -1.05]);
const DIAL: V3 = H([RADIO[0] - 0.28, F2 + 0.53, RADIO[2] + 0.141]);
const radioPose = (reach: number, hear: number, turn: number): HumanPose => ({
  sit: 1,
  kneeL: -1.25,
  kneeR: -1.1,
  lean: 0.15,
  armR: [lerp(-0.5, -1.15, reach), 0.05, lerp(0, 0.2, reach)],
  elbowR: lerp(-0.9, -0.45, reach),
  armL: [lerp(-0.4, -1.5, hear), lerp(0.1, 0.25, hear), lerp(0, 0.4, hear)],
  elbowL: lerp(-0.6, -2.0, hear),
  head: [0.15, 0.8 * turn, 0.1 * hear],
  face: {wide: 0.3 + 0.6 * turn, browIn: 0.35, look: [0, -0.05]},
});

// ---------------------------------------------------------------- 9a. 03:00, the radio
const RA_CUT = 3.2;
export const radioScene: Scene = {
  view: (v) => {
    const t = tIn('radio', v);
    const L = shotLen('radio');
    if (t < RA_CUT) return mv(t, 0, RA_CUT, H([0.95, F2 + 0.8, -1.05]), H([1.1, F2 + 0.72, -1.2]), DIAL, DIAL, [36, 30]);
    return mv(t, RA_CUT, L, H([0.45, F2 + 1.05, -2.2]), H([0.6, F2 + 1.02, -2.1]), H([1.85, F2 + 0.85, -1.05]), H([1.85, F2 + 0.88, -1.05]), [36, 30]);
  },
  render: (v) => {
    const t = tIn('radio', v);
    const L = shotLen('radio');
    const on = t > 0.6 ? 1 : 0;
    const reach = ease(t, 0.0, 0.5) * (1 - ease(t, 1.6, 2.4));
    const hear = ease(t, 2.0, 2.9);
    const turn = ease(t, L - 2.0, L - 1.3); // «Соня Миронова»: he looks across at her
    return (
      <>
        <DarkRoom k={0.45} />
        <House position={HOUSE} s={{v, ...UP, radio: on, noRoof: true}} />
        <Human o={ARTEM} position={ARTEM_RADIO} rotation={Math.PI} pose={radioPose(reach, hear, turn)} head={<Earbud />} />
        <pointLight position={[DIAL[0], DIAL[1] + 0.05, DIAL[2] + 0.15]} color="#ffb24a" intensity={0.7 * on} distance={2.5} decay={1.6} />
      </>
    );
  },
};

// where the marker is on the wall for the text written up to k
const wallTip = (k: number): V3 => {
  const lines = ['СОНЯ, ТЕБЯ ИЩУТ', 'ЛАГЕРЬ · 40 КМ', 'НА СЕВЕР ↑'];
  const widths = [3.1, 2.5, 2.0];
  const total = lines.reduce((a, l) => a + l.length, 0);
  let n = k * total;
  let i = 0;
  while (i < 2 && n > lines[i].length) {
    n -= lines[i].length;
    i++;
  }
  const f = clamp01(n / lines[i].length);
  const [wx, wy, wz] = WALL_TEXT.pos;
  return H([wx - 0.02, wy + 0.45 - i * 0.45, wz + (f - 0.5) * widths[i]]);
};

// ---------------------------------------------------------------- 9b. he writes it on the wall; she reads it and cries
const WA_CUT = 3.6;
const wallK = (v: number) => clamp01((tIn('wall', v) - 0.2) / 3.2);
const SONYA_READ: V3 = H([0.9, F2, 1.7]);
export const wallScene: Scene = {
  view: (v) => {
    const t = tIn('wall', v);
    const L = shotLen('wall');
    const mid = H([WALL_TEXT.pos[0], WALL_TEXT.pos[1], WALL_TEXT.pos[2]]);
    if (t < WA_CUT) return mv(t, 0, WA_CUT, H([-0.6, F2 + 1.35, 2.45]), H([-0.3, F2 + 1.3, 2.3]), mid, mid, 50);
    return mv(t, WA_CUT, L, H([1.75, F2 + 1.05, 1.05]), H([1.6, F2 + 1.03, 1.15]), H([0.9, F2 + 1.0, 1.7]), H([0.9, F2 + 1.0, 1.7]), [34, 28]);
  },
  render: (v) => {
    const t = tIn('wall', v);
    const k = wallK(v);
    const tip = wallTip(k);
    const done = ease(t, 3.4, 3.9);
    const apos: V3 = [tip[0] - 0.62, F2, tip[2] - 0.32];
    const yaw = Math.PI / 2;
    const base: HumanPose = {head: [lerp(-0.1, 0.2, done), -0.25, 0], face: {browIn: 0.3}};
    const ik = humanArmTo(ARTEM, apos, yaw, base, 1, tip);
    const aPose: HumanPose = done < 0.5 ? {...base, armR: ik.arm, elbowR: ik.elbow} : {...base, armR: [-0.2, 0.1, 0], elbowR: -0.3};
    // she cries: one tear running down her cheek, from the end of the writing
    const tear = clamp01((t - WA_CUT - 0.4) / 1.6);
    const sPose: HumanPose = {
      head: [-0.1 - 0.15 * tear, -0.15, 0],
      armL: [-0.25, 0.1, 0],
      armR: [-0.25, 0.1, 0],
      face: {tilt: -0.6, browIn: 0.7, smile: -0.35, lid: 0.25, wide: 0.1, look: [0, 0.08]},
    };
    // she faces the wall (+x), slightly towards the camera in the close-up
    return (
      <>
        <DarkRoom k={0.45} />
        <House position={HOUSE} s={{v, ...UP, radio: 1, wall: k, noRoof: true}} />
        <Human o={ARTEM} position={apos} rotation={yaw} pose={aPose} head={<Earbud />} handR={done < 0.5 ? <Marker position={[0, -0.02, 0.05]} rotation={[Math.PI / 2, 0, 0]} /> : undefined} />
        <Human o={SONYA} position={SONYA_READ} rotation={2.11} pose={sPose} head={<><HearingAid />{tear > 0 ? <Ball position={[0.062, -0.035 - 0.06 * tear, 0.148 - 0.01 * tear]} scale={0.011} color="#cfe6ff" look={{rough: 0.05, metal: 0.2}} shadow={false} /> : null}</>} />
        {/* the dial lights the wall from below, warm */}
        <pointLight position={H([2.2, F2 + 0.9, -1.4])} color="#ffb24a" intensity={4} distance={6} decay={1.4} />
        <pointLight position={H([0.6, F2 + 1.8, 2.2])} color="#a8bcff" intensity={0.8} distance={3} decay={1.6} />
      </>
    );
  },
};

// the crowd going away at dawn (each one turns and walks off at its own time)
const DAWN0 = shotStart('dawn');
const GOING: Dead[] = CROWD.map((d, k) => {
  const dx = d.p[0] - DOOR_FLOOR[0];
  const dz = d.p[2] - DOOR_FLOOR[2];
  const L = Math.hypot(dx, dz) || 1;
  const far = 10 + rnd(k * 3.1) * 8;
  const to: V3 = [d.p[0] + (dx / L) * far + (rnd(k * 5) - 0.5) * 8, 0, d.p[2] + (dz / L) * far];
  const t0 = DAWN0 - 0.8 + rnd(k * 1.9) * 2.6;
  return {p: d.p, yaw: d.yaw, i: d.i, walk: {from: d.p, to, t0, t1: t0 + 7 + rnd(k) * 3}};
});

// ---------------------------------------------------------------- 9c. dawn: they go; the radio, repeat 3
const DA_CUT = 3.4;
export const dawnScene: Scene = {
  noHandheld: false,
  view: (v) => {
    const t = tIn('dawn', v);
    const L = shotLen('dawn');
    if (t < DA_CUT) return mv(t, 0, DA_CUT, SLIT_EYE, SLIT_EYE, [HX, 0.4, HZ + FRONT + 5.5], [HX + 0.3, 0.3, HZ + FRONT + 6.5], [46, 50]);
    return mv(t, DA_CUT, L, H([0.95, F2 + 0.85, -1.0]), H([1.1, F2 + 0.78, -1.15]), DIAL, DIAL, [38, 32]);
  },
  render: (v) => {
    const t = tIn('dawn', v);
    const dawn = 0.55 + 0.25 * clamp01(t / shotLen('dawn'));
    if (t < DA_CUT)
      return (
        <Street v={v} center={[HX, 0, HZ + FRONT + 6]} lamps={[]} box={16} dawn={dawn} cam={SLIT_EYE} house={UP}>
          <DeadCrowd dead={GOING} v={v} />
        </Street>
      );
    return (
      <>
        <DarkRoom k={1.2} bg="#2a3a5a" />
        <House position={HOUSE} s={{v, ...UP, radio: 1, wall: 1, noRoof: true}} />
        <Human o={ARTEM} position={ARTEM_RADIO} rotation={Math.PI} pose={radioPose(0, 1, 0)} head={<Earbud />} />
        <pointLight position={H([0.0, F2 + 1.6, 2.0])} color="#c0d0ff" intensity={2.4} distance={6} decay={1.4} />
        <pointLight position={[DIAL[0], DIAL[1] + 0.05, DIAL[2] + 0.15]} color="#ffb24a" intensity={0.5} distance={2.5} decay={1.6} />
      </>
    );
  },
};

// ---------------------------------------------------------------- 9d. «ворота закрываются»: he freezes; she sleeps under the words
const CH_CUT = 3.2;
const ARTEM_STAND: V3 = H([-1.1, F2, -0.3]);
export const changeScene: Scene = {
  view: (v) => {
    const t = tIn('change', v);
    const L = shotLen('change');
    if (t < CH_CUT) return mv(t, 0, CH_CUT, H([1.0, F2 + 1.0, -2.25]), H([1.15, F2 + 0.97, -2.1]), H([1.85, F2 + 0.88, -1.05]), H([1.85, F2 + 0.88, -1.05]), [36, 29]);
    return mv(t, CH_CUT, L, H([-0.72, F2 + 1.72, -1.15]), H([-0.85, F2 + 1.68, -1.0]), H([-2.55, F2 + 0.5, 1.25]), H([-2.55, F2 + 0.5, 1.25]), 44);
  },
  render: (v) => {
    const t = tIn('change', v);
    const freeze = ease(t, 0.6, 1.0);
    const morning = (
      <>
        <DarkRoom k={1.15} bg="#3a4a6a" />
        <pointLight position={H([0.0, F2 + 1.6, 2.0])} color="#c8d4ff" intensity={2.6} distance={7} decay={1.4} />
        <pointLight position={H([1.2, F2 + 1.3, -2.2])} color="#c8d4ff" intensity={1.2} distance={2.5} decay={1.6} />
      </>
    );
    if (t < CH_CUT)
      return (
        <>
          {morning}
          <House position={HOUSE} s={{v, ...UP, radio: 1, wall: 1, noRoof: true}} />
          <Human o={ARTEM} position={ARTEM_RADIO} rotation={Math.PI} pose={{...radioPose(0, 1, 0), head: [0.05, 0.2 * freeze, 0], face: {wide: 0.2 + 0.5 * freeze, browIn: 0.5 * freeze, brow: 0.15 * freeze, lid: 0, look: [0.1 * freeze, 0]}}} head={<Earbud />} />
        </>
      );
    return (
      <>
        {morning}
        <House position={HOUSE} s={{v, ...UP, radio: 1, wall: 1, noRoof: true}} />
        <Human o={ARTEM} position={ARTEM_STAND} rotation={-0.785} pose={{head: [0.25, 0, 0], armL: [-0.1, 0.05, 0], face: {browIn: 0.4}}} />
        <Human o={SONYA} position={SONYA_BED} rotation={Math.PI * 0.55} pose={{sit: 1, kneeL: -1.3, kneeR: -1.2, lean: -0.25, armL: [-0.3, 0.2, 0.2], elbowL: -0.5, head: [0.35, 0.2, 0.25], face: {lid: 1}}} head={<HearingAid />} />
      </>
    );
  },
};

// ---------------------------------------------------------------- 10a. the palm: rubs out «не бери лишнего», writes «идём»
export const palm2Scene: Scene = {
  view: (v) => {
    const t = tIn('palm2', v);
    return mv(t, 0, shotLen('palm2'), [-0.03, 0.26, 0.11], [-0.02, 0.23, 0.095], [0.004, 0.0, 0.005], [0.004, 0.0, 0.0], 40);
  },
  render: (v) => {
    const t = tIn('palm2', v);
    const L = shotLen('palm2');
    const wiped = ease(t, 0.3, 1.7);
    const nw = clamp01((t - 2.0) / Math.max(1, L - 2.8));
    const rub = t > 0.2 && t < 1.9;
    const rubX = Math.sin(t * 14) * 0.03;
    const writing = t > 1.95 && nw < 1;
    const tipX = lerp(-0.026, 0.026, nw);
    return (
      <group>
        <color attach="background" args={['#2a3650']} />
        <hemisphereLight color="#b0c4f0" groundColor="#3a3a48" intensity={1.25} />
        <directionalLight position={[0.8, 1.2, 0.6]} color="#ffd8b0" intensity={1.5} />
        <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2, 2]} />
          <meshStandardMaterial color="#3a3c44" roughness={1} />
        </mesh>
        <Palm position={[0, 0, 0]} written={1} wiped={wiped} newWord={nw} />
        {/* the other thumb rubbing the line out */}
        {rub ? (
          <group position={[rubX, 0.03, 0.03]} rotation={[0, 0, 0]}>
            <Pill rotation={[Math.PI / 2, 0, -0.9]} position={[0.012, 0, 0.01]} r={0.012} len={0.045} color={ARTEM.skin} look={{rough: 0.6}} />
            <Pill rotation={[Math.PI / 2, 0, -0.9]} position={[0.07, 0.02, 0.06]} r={0.03} len={0.06} color={ARTEM.skin} />
          </group>
        ) : null}
        {writing || t > L - 0.8 ? <WritingHand position={[writing ? tipX : 0.04, 0.02 + (writing ? 0 : 0.03), 0.028]} rotation={[-0.25, 0.4, -0.85]} /> : null}
      </group>
    );
  },
};

// ---------------------------------------------------------------- 10b. the road north
const GATE: V3 = [HX, 0.0, HZ + FRONT + 3.6];
const ROAD_END: V3 = [HX - 22, 0, -0.6];
export const roadScene: Scene = {
  view: (v) => {
    const t = tIn('road', v);
    const L = shotLen('road');
    return mv(t, 0, L, [HX + 3.2, 2.2, HZ + FRONT + 2.4], [HX + 5.5, 7.5, HZ + FRONT + 4.5], [HX - 3, 1.0, GATE[2] + 2.5], [HX - 14, 1.5, -0.8], [46, 50]);
  },
  render: (v) => {
    const t = tIn('road', v);
    const L = shotLen('road');
    const a = walkTo(t, 0.2, L + 6, GATE, ROAD_END, 0.66);
    const side: V3 = [Math.cos(a.yaw) * 0.55, 0, -Math.sin(a.yaw) * 0.55];
    const sp: V3 = [a.p[0] + side[0], 0, a.p[2] + side[2]];
    const s = walkTo(t, 0.2, L + 6, [GATE[0] + side[0], 0, GATE[2] + side[2]], [ROAD_END[0] + side[0], 0, ROAD_END[2] + side[2]], 0.5);
    return (
      <Street v={v} center={[HX - 5, 0, -3]} lamps={[]} box={18} dawn={0.95} k={1.15} cam={[HX + 4, 5, HZ + FRONT + 3]} house={{...UP, backOpen: 1}}>
        <Human o={ARTEM} position={a.p} rotation={a.yaw} pose={{...walkPose(a.ph, a.amp * 0.9), armL: [0.1, 0.1, 0], elbowL: -0.2}} />
        <Human o={SONYA} position={sp.map((x, i) => (i === 1 ? 0 : x)) as V3} rotation={s.yaw} pose={{...walkPose(s.ph, s.amp * 0.9), armR: [-0.35, -0.05, 0], elbowR: -0.2}} head={<HearingAid />} />
        <directionalLight position={[HX - 40, 6, -25]} color="#ffc890" intensity={1.6} />
      </Street>
    );
  },
};
