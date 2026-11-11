import React from 'react';
import {Human, HumanPose, Outfit} from '../bear/People';
import {Pic} from '../bear/Props';
import {Pill, RBox} from '../bear/kit';
import {Haze} from '../bear/Forest';
import {blink} from '../bear/common';
import {withArm} from '../brain/scenes1';
import {SmallPhone} from '../brain/Sets';
import {CityLights, Street} from './Sets';
import {V3, lerp, lerp3} from './cues';
import {drawKeyboard, keyPos} from './tex';

export {withArm};

// the street with its light, sky colour and haze
export const StreetSet: React.FC<{center?: V3; box?: number; noTrees?: boolean}> = ({center, box, noTrees}) => (
  <>
    <CityLights center={center} box={box} />
    <Haze color="#cfe6f6" near={30} far={110} />
    <Street noTrees={noTrees} />
  </>
);

// a person holding a phone in the right hand in front of the chest, looking at it
export const phonePose = (o: Outfit, pos: V3, yaw: number, v: number, seed = 0, extra: HumanPose = {}): HumanPose => {
  const sc = o.scale ?? 1;
  const fwd: V3 = [Math.sin(yaw), 0, Math.cos(yaw)];
  const hold: V3 = [pos[0] + fwd[0] * 0.3 * sc - fwd[2] * 0.05 * sc, pos[1] + 1.0 * sc, pos[2] + fwd[2] * 0.3 * sc + fwd[0] * 0.05 * sc];
  return withArm(o, pos, yaw, {head: [0.38, 0, 0], armL: [0.05, 0.12, 0], elbowL: -0.25, face: {look: [0, -0.2], lid: blink(v, seed) * 0.9 + 0.2}, ...extra}, 1, hold);
};
export const PhoneInHand: React.FC<{k?: string}> = ({k = 'ph'}) => (
  <SmallPhone position={[0, -0.06, 0.04]} rotation={[-1.2, 0, 0]} k={k} draw={(g, W, H) => {
    g.fillStyle = '#f2f4f8';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#3a7bd5';
    g.fillRect(0, 0, W, H * 0.12);
  }} />
);

// a big phone for close-ups: screen 0.068 x 0.145 at hi-res, facing +z of the group
export const BigPhone: React.FC<{position: V3; rotation?: V3; k: string; draw: (g: CanvasRenderingContext2D, W: number, H: number) => void}> = ({position, rotation, k, draw}) => (
  <group position={position} rotation={rotation}>
    <RBox size={[0.075, 0.155, 0.01]} r={0.009} color="#1c1d24" look={{rough: 0.3}} />
    <Pic position={[0, 0, 0.0056]} size={[0.068, 0.145]} res={[540, 1140]} k={k} draw={draw} lit={false} glow={1.05} />
  </group>
);

// screen-local point (canvas px) -> phone-local metres
export const onScreen = (x: number, y: number, W = 540, H = 1140): V3 => [(x / W - 0.5) * 0.068, (0.5 - y / H) * 0.145, 0.006];

// a thumb that taps keys on a BigPhone; keys: [time, char]; misses push the tap off target
export const Thumb: React.FC<{v: number; keys: [number, string][]; skin?: string; miss?: number}> = ({v, keys, skin = '#f4c7a6', miss = 0}) => {
  let cur = keys[0];
  let next = keys[0];
  for (let i = 0; i < keys.length; i++) {
    if (v >= keys[i][0]) {
      cur = keys[i];
      next = keys[i + 1] ?? keys[i];
    }
  }
  const [x0, y0] = keyPos(cur[1], 540, 1140);
  const [x1, y1] = keyPos(next[1], 540, 1140);
  const span = Math.max(0.05, next[0] - cur[0]);
  const k = next === cur ? 0 : Math.min(1, Math.max(0, (v - cur[0]) / span));
  const p = lerp3(onScreen(x0 + miss * 30, y0 + miss * 18), onScreen(x1 + miss * 30, y1 + miss * 18), k * k * (3 - 2 * k));
  const lift = v < keys[0][0] - 0.3 ? 0.04 : Math.sin(Math.PI * k) * 0.012 + 0.002;
  return (
    <group position={[p[0], p[1] - 0.05, p[2] + 0.012 + lift]} rotation={[-0.35, 0, 0.5]}>
      <Pill position={[0, 0, 0]} rotation={[0, 0, 0]} r={0.011} len={0.09} color={skin} />
      <RBox position={[0, 0.04, 0.006]} size={[0.014, 0.012, 0.004]} r={0.002} color="#fbe4d4" shadow={false} />
    </group>
  );
};

export const keyboardDraw = (text: string, hi: string, ok: number, fail = 0) => ({
  key: `kb-${text}-${hi}-${ok > 0 ? 1 : 0}-${fail > 0 ? 1 : 0}`,
  draw: (g: CanvasRenderingContext2D, W: number, H: number) => drawKeyboard(g, W, H, text, hi, ok, fail),
});

export {Human, lerp};
