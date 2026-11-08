import React from 'react';
import {Human, HumanPose} from '../bear/People';
import {ARTEM, SCREAMER, Box, dead, deadIdle, deadKid, deadShop, deadWalk} from './Chars';
import {DeadCrowd, Dead, blob} from './Crowd';
import {Bin, LAMP_FAR, SCHOOL, SHOP} from './Town';
import {FRONT} from './House';
import {Palm, WritingHand, palmLines} from './Props';
import {HOUSE} from './Town';
import {Scene, Street, ease, ease5, follow, holdBox, mv, walkTo} from './common';
import {CRUNCH, SCREAM, TIP, V3, clamp01, lerp, shotEnd, shotStart, tIn} from './cues';
import {Pool} from './Town';

// Scenes 1–2: the last delivery, the one under the lamp, the rules, the palm.

const HX = HOUSE[0];
const HZ = HOUSE[2];
const PORCH_Y = 0.24;
const DOOR_SPOT: V3 = [HX + 0.05, PORCH_Y, HZ + FRONT + 0.55];
const GATE: V3 = [HX, 0.0, HZ + FRONT + 3.6];
const UNDER: V3 = [LAMP_FAR[0] + 0.45, 0.14, LAMP_FAR[2] - 0.2]; // the first one, under the lamp

// Артём holding the box in front of him with both hands
const carryPose = (extra: HumanPose = {}): HumanPose => ({
  armL: [-0.75, 0.05, 0.1],
  armR: [-0.75, 0.05, 0.1],
  elbowL: -0.75,
  elbowR: -0.75,
  ...extra,
});
// Артём with the box held in front of his chest (hands IK'd onto it)
const Carrier: React.FC<{pos: V3; yaw: number; pose: HumanPose; freeRight?: boolean}> = ({pos, yaw, pose, freeRight}) => {
  const h = holdBox(ARTEM, pos, yaw, pose);
  const box = h.box;
  const p = freeRight ? {...h.pose, armR: pose.armR, elbowR: pose.elbowR} : h.pose;
  return (
    <>
      <Human o={ARTEM} position={pos} rotation={yaw} pose={p} />
      <Box position={[box[0], box[1] - 0.12 * 0.85, box[2]]} rotation={[0, yaw, 0]} scale={0.85} />
    </>
  );
};

// ---------------------------------------------------------------- 1. the door
export const doorScene: Scene = {
  view: (v) => {
    const t = tIn('door', v);
    return mv(t, 0, 4.6, [HX + 1.9, 1.15, HZ + FRONT + 3.2], [HX + 1.15, 1.35, HZ + FRONT + 2.3], [HX - 0.2, 1.35, HZ + FRONT], [HX - 0.05, 1.45, HZ + FRONT], 44, 0.25);
  },
  render: (v) => {
    const t = tIn('door', v);
    // he knocks twice (right hand off the box), then waits and leans back to look up at the windows
    const knock = t > 1.0 && t < 2.4 ? Math.max(0, Math.sin((t - 1.0) * Math.PI * 2.2)) : 0;
    const look = ease(t, 3.0, 3.8);
    const pose = carryPose({
      armR: [lerp(-0.75, -1.35, t > 0.85 && t < 2.6 ? 1 : 0) - 0.15 * knock, 0.05, 0.1],
      elbowR: t > 0.85 && t < 2.6 ? -0.4 - 0.4 * knock : -0.75,
      head: [-0.35 * look, 0.15 * look, 0],
      lean: -0.05 * look,
      face: {brow: 0.05 * look, look: [0, 0.2 * look]},
    });
    return (
      <Street v={v} center={[HX, 0, HZ + 3]} lamps={[5]} house={{lit: true}} box={10} cam={[HX + 1.5, 1.2, HZ + 6]}>
        <Carrier pos={DOOR_SPOT} yaw={Math.PI} pose={pose} freeRight={t > 0.85 && t < 2.6} />
        <pointLight position={[HX, 2.8, HZ + FRONT + 0.4]} color="#ffcf8a" intensity={2.2} distance={6} decay={1.7} />
        <Human o={dead(0)} position={UNDER} rotation={0} pose={deadIdle(v, 0)} />
      </Street>
    );
  },
};

// ---------------------------------------------------------------- 2. over his shoulder: the one under the lamp
export const pullScene: Scene = {
  view: (v) => {
    const t = tIn('pull', v);
    // from the porch over the fence: the street opens up, a slow push towards the lamp
    return mv(t, 0, 6.2, [HX - 0.9, 1.75, HZ + FRONT + 0.3], [HX - 0.6, 1.65, HZ + FRONT + 2.4], [UNDER[0], 1.2, UNDER[2]], [UNDER[0], 1.25, UNDER[2]], [40, 30], -0.2);
  },
  render: (v) => {
    const t = tIn('pull', v);
    // he turns from the door and walks down the path to the gate
    const turn = ease(t, 0.2, 1.0);
    const w = walkTo(t, 0.9, 5.6, DOOR_SPOT, [HX + 0.1, 0.02, GATE[2] - 0.6], 0.6);
    const pos: V3 = t < 0.9 ? DOOR_SPOT : [w.p[0], t < 1.6 ? lerp(PORCH_Y, 0.02, ease(t, 1.1, 1.6)) : 0.02, w.p[2]];
    const yaw = t < 0.9 ? Math.PI - turn * Math.PI : 0;
    const walk = w.amp > 0 ? walkPoseCarry(w.ph, w.amp) : carryPose();
    return (
      <Street v={v} center={[HX, 0, HZ + 6]} lamps={[5]} house={{lit: true}} box={12} cam={[HX - 0.8, 1.7, HZ + 4]}>
        <Carrier pos={pos} yaw={yaw} pose={{...walk, face: {brow: -0.02}}} />
        <Human o={dead(0)} position={UNDER} rotation={0} pose={deadIdle(v, 0)} />
      </Street>
    );
  },
};

const walkPoseCarry = (ph: number, amp: number): HumanPose => {
  const s = Math.sin(ph * Math.PI * 2);
  const c = Math.cos(ph * Math.PI * 2);
  return carryPose({
    legL: 0.42 * s * amp,
    legR: -0.42 * s * amp,
    kneeL: Math.max(0, -c) * 0.65 * amp + 0.08,
    kneeR: Math.max(0, c) * 0.65 * amp + 0.08,
    bob: Math.abs(c) * 0.022 * amp,
  });
};

// ---------------------------------------------------------------- 3. the crunch, the head turns
export const turnScene: Scene = {
  view: (v) => {
    const t = tIn('turn', v);
    // behind-left of him, low; we drift around to see his face come round
    const c: V3 = [UNDER[0], 1.5, UNDER[2]];
    return follow(t, 0, 5.2, [UNDER[0] - 2.6, 1.4, UNDER[2] - 2.6], [UNDER[0] - 1.9, 1.5, UNDER[2] - 2.1], c, [30, 24], 720, 540, 0.15);
  },
  shakes: [[CRUNCH, 0.35]],
  render: (v) => {
    const t = tIn('turn', v);
    const k = ease5(v, CRUNCH + 0.25, CRUNCH + 2.6); // the slow head turn
    const body = ease5(v, CRUNCH + 1.4, CRUNCH + 3.4) * 1.1; // then the body follows
    const base = deadIdle(v, 0);
    const pose: HumanPose = {
      ...base,
      head: [0.1, -k * 1.25, 0.12 * (1 - k)],
      face: {...base.face, lid: lerp(0.32, 0.12, k), look: [-0.35 * k, 0.05]},
      armL: [-0.15, 0.08, 0],
      armR: [-0.12, 0.08, 0],
    };
    return (
      <Street v={v} center={[UNDER[0], 0, UNDER[2]]} lamps={[5]} house={{lit: true}} box={8} cam={[UNDER[0] - 1, 1.5, UNDER[2] - 1.6]}>
        <Human o={dead(0)} position={UNDER} rotation={-body} pose={pose} />
        {/* Артём at the gate, far, frozen mid-step */}
        <Carrier pos={[HX + 0.1, 0.02, GATE[2] - 0.6 + clamp01(t / 0.6) * 0.15]} yaw={0} pose={carryPose({legL: -0.25, legR: 0.15, head: [0, 0, 0]})} />
      </Street>
    );
  },
};

// ---------------------------------------------------------------- 4. rules montage

// rule 1: they go to noise and light (a car with blinking hazards, the dead shuffle to it)
const CAR: V3 = [26, 0, 2.2];
const RULE1: Dead[] = Array.from({length: 9}, (_, i) => {
  const a = (i / 9) * Math.PI * 1.4 + 0.6;
  const r = 6 + (i % 3) * 1.5;
  const from: V3 = [CAR[0] + Math.cos(a) * r, 0, CAR[2] + Math.sin(a) * r * 0.6 - 2];
  const to: V3 = [CAR[0] + Math.cos(a) * (r - 3.2), 0, CAR[2] + Math.sin(a) * (r - 3.2) * 0.6 - 1];
  return {p: to, yaw: 0, i: 40 + i, walk: {from, to, t0: -1, t1: 6}};
});
export const rNoiseScene: Scene = {
  view: (v) => {
    const t = tIn('rNoise', v);
    return mv(t, 0, 3.6, [CAR[0] - 7.5, 0.6, CAR[2] - 4.5], [CAR[0] - 6.2, 0.75, CAR[2] - 3.4], [CAR[0], 0.9, CAR[2]], [CAR[0], 1.0, CAR[2]], 46, 0.4);
  },
  render: (v) => {
    const t = tIn('rNoise', v);
    const blinkOn = Math.floor(t * 2.6) % 2 === 0 ? 1 : 0;
    const shifted = RULE1.map((d) => ({...d, walk: {...d.walk!, t0: -1, t1: 6}}));
    return (
      <Street v={v} center={CAR} lamps={[13]} box={14} cam={[CAR[0] - 7, 0.7, CAR[2] - 4]}>
        {/* the hazards: orange glows on the car corners */}
        {[
          [2.02, 0.66, 0.7],
          [2.02, 0.66, -0.7],
          [-2.02, 0.66, 0.7],
          [-2.02, 0.66, -0.7],
        ].map(([x, y, z], i) => (
          <group key={i}>
            <pointLight position={[CAR[0] - x, y, CAR[2] + z]} color="#ff9a20" intensity={blinkOn * 3} distance={6} decay={1.6} />
          </group>
        ))}
        <Pool position={[CAR[0], 0.02, CAR[2]]} r={5} k={0.25 * blinkOn} color="#ff8a20" />
        <DeadCrowd dead={shifted} v={t} />
        <Human o={dead(7)} position={[CAR[0] - 3.6 + t * 0.25, 0, CAR[2] + 1.6 - t * 0.05]} rotation={1.75} pose={deadWalk(t * 0.8, v, 7)} />
      </Street>
    );
  },
};

// rule 2: they don't get tired (one walks circles around a post all night)
const POST: V3 = [-1.5, 0.14, 4.5];
export const rTireScene: Scene = {
  view: (v) => {
    const t = tIn('rTire', v);
    return mv(t, 0, 3, [POST[0] - 1.6, 3.4, POST[2] - 5.2], [POST[0] - 0.9, 3.0, POST[2] - 4.4], [POST[0], 0.7, POST[2]], [POST[0], 0.7, POST[2]], 40);
  },
  render: (v) => {
    const t = tIn('rTire', v);
    // time-lapse: he goes round several times in the shot
    const a = t * 2.4;
    const r = 1.1;
    const p: V3 = [POST[0] + Math.sin(a) * r, 0.14, POST[2] + Math.cos(a) * r];
    return (
      <Street v={v} center={POST} lamps={[7]} box={9} cam={[POST[0] + 3.5, 2.4, POST[2] + 3.8]}>
        <Human o={dead(3)} position={p} rotation={a + Math.PI / 2} pose={deadWalk(t * 2.6, v, 3, 0.6)} />
        {/* a worn track in the dust */}
        <mesh position={[POST[0], 0.145, POST[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.18, r + 0.18, 48]} />
          <meshStandardMaterial color="#4a4c52" roughness={1} transparent opacity={0.6} />
        </mesh>
      </Street>
    );
  },
};

// rule 3: they keep their habits (the shop crowd at the doors; then the kids under the school clock)
const SHOP_DOOR: V3 = [SHOP[0] + 8 * 0.28, 0, SHOP[2] + 3.5 + 1.2];
const SHOPPERS: Dead[] = blob(SHOP_DOOR, 1.6, 14, 7, [SHOP_DOOR[0], 0, SHOP_DOOR[2] - 3]);
const KIDS_AT: V3 = [SCHOOL[0] + 4.5 + 1.6, 0, SCHOOL[2]]; // in front of the school door, facing it (−x)
export const rHabitScene: Scene = {
  view: (v) => {
    const t = tIn('rHabit', v);
    const half = (shotEnd('rHabit') - shotStart('rHabit')) * 0.5;
    if (t < half) return mv(t, 0, half, [SHOP_DOOR[0] - 3.2, 1.2, SHOP_DOOR[2] + 4.2], [SHOP_DOOR[0] - 2.4, 1.35, SHOP_DOOR[2] + 3.6], [SHOP_DOOR[0], 1.2, SHOP_DOOR[2] - 1.5], [SHOP_DOOR[0], 1.3, SHOP_DOOR[2] - 1.5], 46);
    return mv(t, half, half * 2, [KIDS_AT[0] + 7.2, 1.3, KIDS_AT[2] - 3.4], [KIDS_AT[0] + 6.4, 1.45, KIDS_AT[2] - 2.8], [SCHOOL[0] + 4.5, 2.6, SCHOOL[2]], [SCHOOL[0] + 4.5, 3.4, SCHOOL[2]], 46);
  },
  render: (v) => {
    const t = tIn('rHabit', v);
    const half = (shotEnd('rHabit') - shotStart('rHabit')) * 0.5;
    if (t < half)
      return (
        <Street v={v} center={SHOP_DOOR} lamps={[10]} box={9} cam={[SHOP_DOOR[0] - 3, 1.2, SHOP_DOOR[2] + 4]}>
          <DeadCrowd dead={SHOPPERS} v={v} />
          {[0, 1, 2].map((i) => (
            <Human key={i} o={deadShop(i)} position={[SHOP_DOOR[0] - 0.7 + i * 0.7, 0.14, SHOP_DOOR[2] - 0.6 + (i % 2) * 0.3]} rotation={Math.PI + (i - 1) * 0.2} pose={{...deadIdle(v, i + 10), armL: [-1.2, 0.1, 0], armR: [-1.0, 0.1, 0]}} />
          ))}
        </Street>
      );
    return (
      <Street v={v} center={KIDS_AT} lamps={[]} box={10} cam={[KIDS_AT[0] + 2.3, 1.1, KIDS_AT[2] - 3.8]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Human key={i} o={deadKid(i)} position={[KIDS_AT[0] + (i % 2) * 0.5, 0.0, KIDS_AT[2] - 1.6 + i * 0.8]} rotation={-Math.PI / 2 + (i - 2) * 0.1} pose={{...deadIdle(v, i + 20), head: [-0.35, 0, 0.05 * (i - 2)]}} />
        ))}
        <pointLight position={[KIDS_AT[0] + 2, 3.5, KIDS_AT[2]]} color="#a8b8ff" intensity={5} distance={10} decay={1.6} />
      </Street>
    );
  },
};

// rule 4: one noise calls ten, ten call a hundred (a bin falls over at the crossing; they pour in)
const BIN_AT: V3 = [-5.0, 0.14, -4.8];
const POUR: Dead[] = Array.from({length: 60}, (_, i) => {
  const lane = i % 3;
  const row = Math.floor(i / 3);
  const fromZ = 46 + row * 1.1 + (lane - 1) * 0.3;
  const from: V3 = [(lane - 1) * 1.6 + Math.sin(i) * 0.4, 0, fromZ];
  const to: V3 = [from[0] * 1.4 + Math.sin(i * 2.1) * 1.2, 0, 7 + row * 0.8];
  return {p: to, yaw: Math.PI, i: 60 + i, walk: {from, to, t0: TIP + 0.2 + row * 0.02, t1: TIP + 9 + row * 0.25}};
});
export const rCountScene: Scene = {
  view: (v) => {
    const t = tIn('rCount', v);
    return mv(t, 0, 3.6, [-6.2, 2.4, -7.6], [-6.6, 3.4, -8.6], [-1, 1.0, 16], [0, 1.0, 22], [44, 48]);
  },
  render: (v) => {
    const tip = ease(v, TIP, TIP + 0.35);
    // fast-forward: the crowd streams in at 3x
    const tt = TIP + Math.max(0, v - TIP) * 3.2;
    return (
      <Street v={v} center={[-2, 0, 8]} lamps={[3]} box={20} cam={[-9, 7.5, -10]}>
        <Bin position={BIN_AT} rot={0.2} tip={tip} />
        <DeadCrowd dead={POUR} v={tt} />
      </Street>
    );
  },
};

// rule 5: the screamers (one opens his mouth wide; behind him the street turns)
const SCR: V3 = [8, 0, 1.2];
const LISTEN: Dead[] = blob([SCR[0] + 2, 0, SCR[2] + 9], 6, 26, 31, undefined, 2);
export const rScreamScene: Scene = {
  view: (v) => {
    const t = tIn('rScream', v);
    return follow(t, 0, 3.8, [SCR[0] - 0.6, 1.35, SCR[2] - 2.4], [SCR[0] - 0.4, 1.4, SCR[2] - 1.5], [SCR[0], 1.62, SCR[2]], [36, 30], 760);
  },
  shakes: [[SCREAM, 0.7]],
  render: (v) => {
    const o = ease(v, SCREAM - 0.1, SCREAM + 0.25);
    const turnAt = (d: Dead) => SCREAM + 0.2 + (Math.hypot(d.p[0] - SCR[0], d.p[2] - SCR[2]) - 2) * 0.12;
    const listeners = LISTEN.map((d) => {
      const k = ease(v, turnAt(d), turnAt(d) + 0.5);
      const face = Math.atan2(SCR[0] - d.p[0], SCR[2] - d.p[2]);
      return {...d, yaw: d.yaw + (face - d.yaw) * k};
    });
    const base = deadIdle(v, 5);
    return (
      <Street v={v} center={SCR} lamps={[9]} box={12} cam={[SCR[0] - 0.5, 1.4, SCR[2] - 2]}>
        <Human
          o={SCREAMER}
          position={SCR}
          rotation={Math.PI}
          pose={{...base, lean: 0.05 - 0.15 * o, head: [-0.35 * o, 0, 0.1 * (1 - o)], armL: [-0.2, 0.3 * o + 0.1, 0], armR: [-0.2, 0.3 * o + 0.1, 0], face: {mouth: lerp(0.15, 1, o), o: o, wide: o, lid: lerp(0.3, 0, o), browIn: -0.2 * o}}}
        />
        <DeadCrowd dead={listeners} v={v} />
      </Street>
    );
  },
};

// ---------------------------------------------------------------- 5. the palm
// the narration: «Артём пишет на ладони: не шуми, не свети, не бери лишнего.» — the marker writes word by word
export const palmWritten = (v: number) => {
  const a = shotStart('palm');
  const b = shotEnd('palm') - 0.6;
  return clamp01((v - a - 0.6) / (b - a - 0.6));
};
export const palmScene: Scene = {
  noHandheld: false,
  view: (v) => {
    const t = tIn('palm', v);
    return mv(t, 0, 5.8, [-0.03, 0.27, 0.11], [-0.02, 0.24, 0.09], [0.004, 0.0, 0.0], [0.004, 0.0, -0.004], 40);
  },
  render: (v) => {
    const w = palmWritten(v);
    // the marker tip follows the writing: three lines across the palm
    const total = palmLines.reduce((a, l) => a + l.length, 0);
    const n = w * total;
    let line = 0;
    let acc = 0;
    for (let i = 0; i < palmLines.length; i++) {
      if (n <= acc + palmLines[i].length) {
        line = i;
        break;
      }
      acc += palmLines[i].length;
      line = i;
    }
    const inLine = clamp01((n - acc) / palmLines[line].length);
    const tip: V3 = [lerp(-0.035, 0.035, inLine), 0.017, -0.026 + line * 0.026];
    return (
      <group>
        <color attach="background" args={['#0e1424']} />
        <hemisphereLight color="#8aa0d8" groundColor="#202430" intensity={1.0} />
        <directionalLight position={[-0.5, 1.5, 0.8]} color="#cfd8ff" intensity={1.4} />
        <pointLight position={[0.2, 0.25, 0.25]} color="#ffcf9a" intensity={0.35} distance={1.5} />
        {/* the step he sits on: dark concrete */}
        <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2, 2]} />
          <meshStandardMaterial color="#2a2c34" roughness={1} />
        </mesh>
        <Palm position={[0, 0, 0]} rotation={[0, 0.0, 0]} written={w} />
        <WritingHand position={[tip[0], tip[1] + 0.003, tip[2]]} rotation={[-0.25, 0.4, -0.85]} />
      </group>
    );
  },
};
