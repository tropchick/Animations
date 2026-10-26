import cues from './cues.json';
import {clamp01} from '../slime/cues';

// «Курьер в Мурино», серия 1. All timing comes from audio/make_murino_ep1_audio.py, which cuts the voice and writes cues.json.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, ramp, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export const DURATION_S = cues.duration;

export type Shot = 'title' | 'order' | 'lift' | 'well' | 'long' | 'neighbor' | 'doors' | 'twins' | 'grow' | 'app' | 'end';

export const SHOTS = cues.shots.map(([name, from], i) => ({
  name: name as Shot,
  from: from as number,
  to: i + 1 < cues.shots.length ? (cues.shots[i + 1][1] as number) : DURATION_S,
}));

export const shotAt = (v: number) => {
  const s = SHOTS.find((x) => v >= x.from && v < x.to) ?? SHOTS[SHOTS.length - 1];
  return {...s, t: v - s.from, k: clamp01((v - s.from) / (s.to - s.from))};
};
export const shotStart = (name: Shot) => SHOTS.find((s) => s.name === name)!.from;
export const shotEnd = (name: Shot) => SHOTS.find((s) => s.name === name)!.to;

export const WORDS = cues.words.map(([s, e, w]) => ({s: s as number, e: e as number, w: w as string}));
export const wordStart = (i: number) => WORDS[i].s;
export const wordEnd = (i: number) => WORDS[i].e;

export const ACCEPT = cues.accept;
export const LAMP_BLINK = cues.lampBlink;
export const LIFT_OPEN = cues.liftOpen;
export const FLOOR_JUMP = cues.floorJump;
export const FLICKER = cues.flicker;
export const LEGS_IN = cues.legsIn;
export const CALL = cues.call as [number, number];
export const CHASE = cues.chase;
export const THROW = cues.throw;
export const LAND = cues.land;
export const DOOR_A = cues.doorA;
export const DOUBLE = cues.double as [number, number];
export const CHAIN = cues.chain;
export const CODE = cues.code as [number, number];
export const PASS = cues.pass;
export const GROW = cues.grow;
export const SLAM = cues.slam;
export const APP_DONE = cues.appDone;
export const APP_NEXT = cues.appNext;
export const VOICE = cues.voice;
