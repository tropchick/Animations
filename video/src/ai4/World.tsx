import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {Drone} from '../lastman/people';
import {Box} from '../lastman/common';
import {EV, P, PE, Shot, ShotState, V3, add3, clamp01, easeOut, hop, lerp, lerp3, ramp, shotAt, smooth} from './cues';
import {BED, BedDima, CLOCK, Dark, FRIDGE, FY, Future, NoSignalPhone, Ordinary, Room, SlapHand, YARD, Yard, Zoo} from './Flat';
import {Bunker, BRICK_X, GUARD, PIGEON_AT, SCREEN, SCREEN_AT, Street, dimaRun} from './Sets';
import {Dima, Mug, RoboArm, Vacuum} from './props';
import {walk} from '../lastman/people';

export type View = {pos: V3; target: V3; fov: number; roll?: number};

const mv = (k: number, a: V3, b: V3, ta: V3, tb: V3, fov: number | [number, number], roll = 0): View => {
  const e = smooth(k);
  return {pos: lerp3(a, b, e), target: lerp3(ta, tb, e), fov: typeof fov === 'number' ? fov : lerp(fov[0], fov[1], e), roll};
};
const blend = (a: View, b: View, k: number): View => ({pos: lerp3(a.pos, b.pos, k), target: lerp3(a.target, b.target, k), fov: lerp(a.fov, b.fov, k), roll: lerp(a.roll ?? 0, b.roll ?? 0, k)});

const W1 = 0;
const ROCKET_TOP = (lift: number): V3 => [-40, -FY + 18 + lift, 520];

// ---------------------------------------------------------------- the four wake-up openings share one move:
// close on the clock with the slapping hand, then pull back to the bed
const wakeView = (v: number, alarm: number, slap: number, end: View): View => {
  const close = mv(ramp(v, alarm - 0.4, slap), [-0.82, 0.8, 1.02], [-0.76, 0.76, 0.94], [-0.42, 0.66, 0.36], [-0.42, 0.64, 0.38], 46, 0.04);
  return blend(close, end, smooth(ramp(v, slap + 0.25, slap + 1.6)));
};

// the window shot: behind Dima, looking out
const DIMA_WIN: V3 = [0.75, 0, 3.8];
// over Dima's left shoulder, through the window
const windowView = (k: number, far: V3): View => mv(k, [0.3, 1.5, 0.95], [0.3, 1.52, 1.2], add3(far, [-3, -1, 0]), far, 56);

// hook cuts: each shows the strongest moment of one world
export const HOOK = {
  rocketV: (t: number) => EV.rocket + 2.2 + t,
  pigeonV: (t: number) => EV.blink - 0.55 + t,
  tapV: (t: number) => EV.tap - 0.25 + t,
  vacV: (t: number) => EV.vac + 0.5 + t,
};
const hookIndex = (v: number) => {
  const c = EV.hookCuts;
  return v >= c[3] ? 3 : v >= c[2] ? 2 : v >= c[1] ? 1 : 0;
};

export const viewOf = (s: ShotState, v: number): View => {
  const {k, t} = s;
  switch (s.name) {
    case 'hook': {
      const i = hookIndex(v);
      const ht = v - EV.hookCuts[i];
      const hk = clamp01(ht / 1.6);
      if (i === 0) {
        const lift = Math.pow(clamp01((HOOK.rocketV(ht) - EV.rocket) / 7), 3) * 220;
        const top = ROCKET_TOP(lift);
        return mv(hk, [0.2, 1.7, 3.2], [0.35, 1.68, 3.9], add3(top, [0, -14, 0]), add3(top, [0, -6, 0]), [16, 12]);
      }
      if (i === 1) return mv(hk, add3(PIGEON_AT, [0.55, 0.32, 1.05]), add3(PIGEON_AT, [0.22, 0.26, 0.62]), add3(PIGEON_AT, [0.04, 0.24, 0.06]), add3(PIGEON_AT, [0.06, 0.25, 0.06]), 38);
      if (i === 2) return mv(hk, [-0.3, 0.68, 7.2], [-0.38, 0.72, 6.75], [-0.38, 1.28, 3.8], [-0.4, 1.3, 3.8], 50);
      return mv(hk, [0.85, 0.36, 2.95], [0.65, 0.28, 2.5], [0.1, 0.06, 1.3], [0.1, 0.07, 1.3], 44);
    }
    case 'w1wake':
      return wakeView(v, EV.alarm[0], EV.slap[0], mv(k, [0.5, 1.6, 3.4], [0.2, 1.55, 3.2], [-1.3, 1.25, 1.3], [-1.35, 1.3, 1.4], 50));
    case 'w1window':
      return windowView(k, [0.3, 8, 300]);
    case 'w1bunker':
      return mv(k, [1.25, 2.75, 3.1], [0.95, 2.5, 2.3], [0.1, 1.5, -3.6], [0.0, 1.6, -3.6], 60);
    case 'w1screen':
      return mv(k, [0.25, 1.85, 1.0], [0.05, 1.8, 0.55], add3(SCREEN, [0.05, -0.11, 0]), add3(SCREEN, [0, -0.14, 0]), 46);
    case 'w2wake':
      return wakeView(v, EV.alarm[1], EV.slap[1], mv(k, [0.5, 1.6, 3.4], [0.4, 1.55, 3.3], [-1.3, 1.1, 1.3], [-1.35, 1.2, 1.4], 50));
    case 'w2bus': {
      const r = dimaRun(v);
      const x = Math.min(r.p[0], 19.0);
      return {pos: [x - 4.6, 1.75, 0.9], target: [x + 2.5, 1.25, 4.2], fov: 52};
    }
    case 'w2brick':
      return mv(k, [BRICK_X + 3.8, 0.55, 5.2], [BRICK_X + 3.3, 0.5, 4.7], [BRICK_X - 0.3, 3.6, 1.2], [BRICK_X, 2.6, 1.6], 62);
    case 'w2tv':
      return mv(k, [46.5, 1.9, 0.5], [45.3, 2.1, 1.6], add3(SCREEN_AT, [0, -1.2, 0]), add3(SCREEN_AT, [0, -1.0, 0]), 62);
    case 'w2pull':
      return mv(k, [12, 3.6, 5.3], [7, 3.8, 5.7], [40, 3.3, 4.2], [42, 3.2, 4.2], 40);
    case 'w2pigeon':
      return mv(k, add3(PIGEON_AT, [0.6, 0.35, 1.1]), add3(PIGEON_AT, [0.2, 0.26, 0.62]), add3(PIGEON_AT, [0.05, 0.22, 0.05]), add3(PIGEON_AT, [0.06, 0.25, 0.06]), 38);
    case 'w3wake': {
      const base = wakeView(v, EV.alarm[2], EV.slap[2], {pos: [0.55, 1.55, 3.3], target: [-1.3, 1.1, 1.3], fov: 50});
      const out = mv(ramp(v, EV.pull[0], EV.pull[1] + 0.4), [0.55, 1.55, 3.3], [0.3, 1.8, 10.2], [-1.3, 1.1, 1.3], [-0.2, 1.3, 2.6], [50, 46]);
      return blend(base, out, ramp(v, EV.pull[0], EV.pull[0] + 0.01));
    }
    case 'w3sign': {
      // the sign and the knock on the glass, then a whip pan to the panda next door on «панд»
      const human = mv(ramp(v, s.from, EV.tap + 0.4), [-0.3, 1.45, 8.9], [-0.4, 1.42, 8.4], [-0.7, 1.62, 4.4], [-0.72, 1.6, 4.4], 48);
      const panda = mv(ramp(v, EV.tap + 0.6, s.to), [5.4, 1.3, 7.9], [5.8, 1.25, 7.5], [8.7, 0.6, 2.6], [8.8, 0.55, 2.6], 44);
      return blend(human, panda, smooth(ramp(v, EV.tap + 0.35, EV.tap + 0.85)));
    }
    case 'w3feed':
      return mv(k, [0.0, 1.55, 1.7], [0.6, 1.4, 2.2], [2.4, 0.95, 3.6], [2.2, 0.85, 3.6], 54);
    case 'w3fence':
      return mv(k, add3(YARD, [2.4, 1.4, 7.2]), add3(YARD, [1.8, 1.6, 6.6]), add3(YARD, [0, 1.8, 2.6]), add3(YARD, [0, 1.9, 2.2]), 50);
    case 'w3wave':
      return mv(k, [-1.0, 0.95, 7.8], [-0.9, 0.98, 7.35], [-0.4, 1.15, 4.4], [-0.42, 1.18, 4.4], 52);
    case 'w4wake': {
      const clock = mv(ramp(v, s.from, EV.wake4 + 0.25), [-0.82, 0.8, 1.02], [-0.76, 0.77, 0.95], [-0.42, 0.66, 0.36], [-0.42, 0.65, 0.37], 46, 0.04);
      if (v < EV.wake4 + 0.25) return clock;
      const wide = mv(ramp(v, EV.wake4 + 0.25, EV.nosig), [0.5, 1.55, 3.3], [0.35, 1.55, 3.1], [-1.35, 1.1, 1.35], [-1.38, 1.15, 1.4], 50);
      const phone = {pos: [-1.05, 1.56, 1.25] as V3, target: [-1.42, 1.3, 1.92] as V3, fov: 36};
      return blend(wide, phone, smooth(ramp(v, EV.nosig - 0.95, EV.nosig - 0.05)));
    }
    case 'w4window':
      return windowView(k, [0.3, 2, 40]);
    case 'w4fridge':
      {
        const pan = smooth(ramp(v, EV.lock - 0.35, EV.lock + 0.35));
        return blend(mv(k, [0.7, 1.62, 3.55], [0.78, 1.6, 3.35], [1.72, 1.4, 0.8], [1.75, 1.4, 0.8], 50), {pos: [1.35, 1.42, 3.05], target: [2.48, 1.18, 2.25], fov: 50}, pan);
      }
    case 'w4vacuum':
      return mv(k, [-0.05, 0.26, 3.9], [-0.1, 0.22, 3.78], [0.3, 0.1, 1.5], [0.05, 0.08, 2.2], 60);
  }
  return {pos: [0, 1.6, 3], target: [0, 1, 0], fov: 50};
};

const SHAKES: [number, number][] = [];
export const viewAt = (v: number): View => {
  const s = shotAt(v);
  const view = viewOf(s, v);
  const d = Math.hypot(view.pos[0] - view.target[0], view.pos[1] - view.target[1], view.pos[2] - view.target[2]);
  let jolt = 0;
  for (const [at, a] of SHAKES) {
    const x = v - at;
    if (x >= 0 && x < 0.8) jolt += a * Math.exp(-x * 7);
  }
  // the hook cuts land with a jolt
  if (s.name === 'hook') jolt += 0.6 * Math.exp(-(v - EV.hookCuts[hookIndex(v)]) * 9);
  const h = 0.004;
  const j = 0.012 * jolt;
  const off: V3 = [
    h * (Math.sin(v * 1.3) + 0.5 * Math.sin(v * 3.1 + 1)) + j * Math.sin(v * 71),
    h * (Math.sin(v * 1.7 + 2) + 0.4 * Math.sin(v * 2.6)) + j * Math.sin(v * 57 + 1.3),
    h * 0.6 * Math.sin(v * 1.1 + 4) + j * 0.5 * Math.sin(v * 63 + 2.1),
  ];
  // far targets: move the target instead of the camera (the camera moves only millimetres)
  const tScale = d > 2 ? 0.3 * Math.min(d, 30) : 0.3 * d;
  return {...view, pos: add3(view.pos, off), target: add3(view.target, [off[0] * tScale, off[1] * tScale, 0])};
};

export const CameraRig: React.FC<{view: View}> = ({view}) => {
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  const {pos, target, fov, roll = 0} = view;
  camera.up.set(0, 1, 0);
  camera.position.set(...pos);
  camera.lookAt(...target);
  if (roll) camera.rotateZ(roll);
  camera.fov = fov;
  camera.near = 0.03;
  camera.far = 3000;
  camera.updateProjectionMatrix();
  return null;
};

// ---------------------------------------------------------------- the sets per world

// world 1 + 2 + 4: the room on the 5th floor with the city outside
const Outside: React.FC<{w: number; v: number}> = ({w, v}) =>
  w === 1 ? <Future v={v} y={FY} /> : w === 2 ? <Ordinary y={FY} /> : <Dark v={v} y={FY} />;

const sitAfter = (v: number, slap: number) => smooth(ramp(v, slap + 0.15, slap + 1.3));

// Dima at the window, back to the camera, mug in hand
const WindowDima: React.FC<{v: number; mug?: boolean}> = ({v, mug = true}) => (
  <Dima position={DIMA_WIN} rotation={0.05} pose={{armR: [1.25, -0.15], elbowR: 1.25, head: [-0.05 + 0.03 * Math.sin(v * 0.7), 0.05]}} rightHand={mug ? <Mug /> : undefined} />
);

export const WakeSet: React.FC<{w: number; v: number}> = ({w, v}) => {
  const i = w - 1;
  const alarm = EV.alarm[i];
  const slap = EV.slap[i];
  const sit = sitAfter(v, slap);
  const ringing = v >= alarm && v < slap;
  // world 1: the ceiling arm brings the coffee
  const armK = w === 1 ? smooth(ramp(v, EV.arm[0], EV.arm[1])) : 0;
  const take = w === 1 ? smooth(ramp(v, EV.arm[1] - 0.6, EV.arm[1])) : 0;
  return (
    <>
      <Room w={w} v={v} alarm={ringing} />
      {w === 3 ? <Zoo v={v} /> : <Outside w={w} v={v} />}
      <BedDima sit={sit} look={0.15 * sit} armR={take > 0 ? [lerp(0.3, 1.25, take), -0.1] : undefined} elbowR={take * 0.6} />
      <SlapHand v={v} slap={slap} alarm={alarm} />
      {w === 1 ? <RoboArm base={[BED.x + 0.35, 2.7, 2.15]} yaw={Math.PI - 0.5} reach={lerp(0.05, 0.4, armK)} drop={lerp(0.25, 1.15, armK)} holding /> : null}
    </>
  );
};

const FenceDima: React.FC<{v: number}> = ({v}) => {
  // climbing up the fence, then the drone takes him by the collar back into the yard
  const climb = smooth(ramp(v, P(22) - 0.4, EV.lift));
  const back = smooth(ramp(v, EV.lift + 0.15, EV.lift + 1.3));
  const y = lerp(lerp(0.2, 1.15, climb), 0, back) + Math.sin(Math.PI * back) * 1.0;
  const z = lerp(2.72, 0.6, back);
  const p: V3 = add3(YARD, [0, y, z]);
  const reach = Math.sin(v * 9) * 0.35 * (1 - back);
  return (
    <>
      <Dima
        position={p}
        rotation={0}
        pose={{armL: [2.7 + reach, 0.15], armR: [2.7 - reach, -0.15], legL: 0.6 * Math.max(0, Math.sin(v * 9)) * (1 - back), legR: 0.6 * Math.max(0, -Math.sin(v * 9)) * (1 - back), head: [-0.3, 0], eyes: 1 + 0.4 * back, mouth: 0.4 * back}}
      />
      <Drone position={add3(p, [0, 2.25 + 0.6 * (1 - smooth(ramp(v, EV.lift - 0.6, EV.lift))), -0.05])} rotation={[0.1, 0, 0]} t={v} light={false} />
      {/* the drone's claw holds the collar */}
      {v > EV.lift - 0.2 ? <Box size={[0.03, 0.55, 0.03]} position={add3(p, [0, 1.95, -0.08])} color="#26282e" /> : null}
    </>
  );
};

export const SetFor: React.FC<{name: Shot; v: number}> = ({name, v}) => {
  switch (name) {
    case 'w1wake':
      return <WakeSet w={1} v={v} />;
    case 'w2wake':
      return <WakeSet w={2} v={v} />;
    case 'w3wake':
      return <WakeSet w={3} v={v} />;
    case 'w1window':
      return (
        <>
          <Room w={1} v={v} />
          <Future v={v} y={FY} />
          <WindowDima v={v} />
        </>
      );
    case 'w1bunker':
    case 'w1screen':
      return <Bunker v={v} />;
    case 'w2bus':
    case 'w2brick':
    case 'w2tv':
    case 'w2pull':
    case 'w2pigeon':
      return <Street v={v} shot={name} />;
    case 'w3sign':
    case 'w3wave': {
      const wave = name === 'w3wave' ? smooth(ramp(v, EV.wave, EV.wave + 0.3)) : 0;
      const tapK = name === 'w3sign' ? Math.max(0, Math.sin(Math.PI * clamp01((v - EV.tap + 0.2) / 0.8))) * (0.6 + 0.4 * Math.abs(Math.sin(v * 15))) : 0;
      const back = name === 'w3wave' ? smooth(ramp(v, EV.wave + 0.7, EV.wave + 1.3)) : 0;
      return (
        <>
          <Room w={3} v={v} />
          <Zoo v={v} kidWave={wave} tap={tapK} />
          <Dima
            position={[-0.35, 0, 3.8]}
            rotation={0}
            pose={{armR: [lerp(0, 2.3, back), -0.2], elbowR: lerp(0, 0.6, back), head: [0.05, 0], mouth: 0, eyes: 0.8}}
          />
        </>
      );
    }
    case 'w3feed': {
      const hatch = smooth(ramp(v, EV.hatch, EV.hatch + 0.35));
      const tray = ramp(v, EV.hatch + 0.35, EV.hatch + 1.1);
      const look = smooth(ramp(v, EV.hatch, EV.hatch + 0.5));
      return (
        <>
          <Room w={3} v={v} hatch={hatch} tray={tray} />
          <Zoo v={v} />
          <BedDima sit={1} look={-0.9 * look} />
        </>
      );
    }
    case 'w3fence':
      return (
        <>
          <Zoo v={v} />
          <Room w={3} v={v} />
          <Yard v={v} />
          <FenceDima v={v} />
        </>
      );
    case 'w4wake': {
      const sit = smooth(ramp(v, EV.wake4 - 0.5, EV.wake4 + 0.9));
      const hold = smooth(ramp(v, EV.nosig - 1.4, EV.nosig - 0.6));
      return (
        <>
          <Room w={4} v={v} />
          <Dark v={v} y={FY} />
          <BedDima sit={sit} look={0} armR={[lerp(0.3, 1.0, hold), -0.25]} elbowR={0.9 * hold} />
          {hold > 0.05 ? <NoSignalPhone position={[BED.x + 0.08, lerp(0.9, 1.3, hold), lerp(1.7, 1.92, hold)]} rotation={[-0.35, Math.PI, 0]} nosig={v >= EV.nosig} /> : null}
        </>
      );
    }
    case 'w4window':
      return (
        <>
          <Room w={4} v={v} />
          <Dark v={v} y={FY} />
          <WindowDima v={v} mug={false} />
        </>
      );
    case 'w4fridge': {
      const tug = Math.max(0, Math.sin((v - P(29)) * 7)) * (v > P(29) + 0.3 && v < EV.lock ? 1 : 0);
      const turn = smooth(ramp(v, EV.lock + 0.05, EV.lock + 0.5));
      return (
        <>
          <Room w={4} v={v} locked={v >= EV.lock} />
          <Dark v={v} y={FY} />
          <Dima position={[FRIDGE[0] - 0.85, 0, FRIDGE[2] + 0.98]} rotation={Math.PI - 0.7 - 0.6 * turn} pose={{armR: [1.3 - 0.3 * tug, -0.05], elbowR: 0.2, head: [0, 0.5 * turn], eyes: 1 + 0.3 * turn}} />
        </>
      );
    }
    case 'w4vacuum': {
      const go = smooth(ramp(v, EV.vac + 0.2, EV.turn[0]));
      const turnK = smooth(ramp(v, EV.turn[0], EV.turn[1]));
      const eye = smooth(ramp(v, EV.vac - 0.1, EV.vac + 0.25));
      const step = smooth(ramp(v, EV.turn[1] - 0.2, EV.turn[1] + 0.5));
      return (
        <>
          <Room w={4} v={v} locked />
          <Dark v={v} y={FY} />
          <Vacuum position={[lerp(0.7, 0.0, go), 0, lerp(0.9, 2.7, go)]} rotation={lerp(0.6, -0.36, turnK) - 0.1 * Math.sin(v * 3) * (1 - go)} eye={eye} />
          <Dima position={[-0.36, 0, lerp(3.12, 3.32, step)]} rotation={Math.PI + 0.3} pose={{legL: -0.35 * hop(v, EV.turn[1] - 0.2, 0.5), head: [0.5, 0], eyes: 1.4}} />
        </>
      );
    }
  }
  return null;
};

// ---------------------------------------------------------------- the four windows (intro and end) and the hook cuts

export const PANEL_VIEW: Record<number, (v: number) => View> = {
  1: (v) => windowView(clamp01(v / 12), [0.3, 8, 300]),
  2: (v) => windowView(clamp01(v / 12), [0.3, 0, 120]),
  3: (v) => mv(clamp01(v / 12), [2.2, 1.3, 8.2], [1.9, 1.35, 7.6], [-0.2, 1.2, 4.4], [-0.25, 1.25, 4.3], 50),
  4: (v) => windowView(clamp01(v / 12), [0.3, 2, 40]),
};

export const PanelSet: React.FC<{w: number; v: number}> = ({w, v}) => {
  if (w === 3)
    return (
      <>
        <Room w={3} v={v} />
        <Zoo v={v} />
        <Dima position={[-0.35, 0, 3.8]} rotation={0} pose={{head: [0.05, 0.1 * Math.sin(v)], eyes: 0.8}} />
      </>
    );
  return (
    <>
      <Room w={w} v={v} />
      <Outside w={w} v={v} />
      <WindowDima v={v} mug={w !== 4} />
    </>
  );
};

export const HookSet: React.FC<{v: number}> = ({v}) => {
  const i = hookIndex(v);
  const ht = v - EV.hookCuts[i];
  if (i === 0) {
    const fv = HOOK.rocketV(ht);
    return (
      <>
        <Room w={1} v={fv} />
        <Future v={fv} y={FY} />
      </>
    );
  }
  if (i === 1) return <Street v={HOOK.pigeonV(ht)} shot="w2pigeon" />;
  if (i === 2) {
    const fv = HOOK.tapV(ht);
    const tapK = Math.max(0, Math.sin(Math.PI * clamp01((fv - EV.tap + 0.2) / 0.9))) * (0.6 + 0.4 * Math.abs(Math.sin(fv * 15)));
    return (
      <>
        <Room w={3} v={fv} />
        <Zoo v={fv} tap={tapK} />
        <Dima position={[-0.35, 0, 3.8]} rotation={0} pose={{head: [0.1, 0], eyes: 1.3, mouth: 0.2}} />
      </>
    );
  }
  const fv = HOOK.vacV(ht);
  const turnK = smooth(ramp(ht, 0.2, 1.0));
  return (
    <>
      <Room w={4} v={fv} locked />
      <Dark v={fv} y={FY} />
      <Vacuum position={[0.1, 0, 1.3]} rotation={lerp(-0.7, 0.35, turnK)} eye={smooth(ramp(ht, 0.0, 0.35))} />
    </>
  );
};

export const World: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v);
  const view = viewAt(v);
  return (
    <>
      <CameraRig view={view} />
      {s.name === 'hook' ? <HookSet v={v} /> : <SetFor name={s.name} v={v} />}
    </>
  );
};

// push 0..1 flies the camera towards the window (the zoom into world 4)
export const Panel: React.FC<{w: number; v: number; push?: number}> = ({w, v, push = 0}) => (
  <>
    <CameraRig view={push > 0 ? blend(PANEL_VIEW[w](v), {pos: [1.3, 1.85, 4.15], target: [3, 4, 40], fov: 50}, smooth(push)) : PANEL_VIEW[w](v)} />
    <PanelSet w={w} v={v} />
  </>
);

export {W1, easeOut, GUARD, PE, ROCKET_TOP};
