import cues from './cues.json';

// «Что если бы брейнротов никогда не существовало?». Timing comes from audio/make_brain_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot =
  | 'trio'
  | 'laptop'
  | 'vanish'
  | 'game'
  | 'bed'
  | 'board'
  | 'teacher'
  | 'argue'
  | 'stack'
  | 'office'
  | 'meeting'
  | 'plan'
  | 'cartoons'
  | 'tower'
  | 'enter'
  | 'desks'
  | 'dad';

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

export const WORDS = cues.words as unknown as [number, number, string, number][];
export const GROUPS = cues.groups as number[][];
export const PHRASES = cues.phrases as [number, number][];

export const CLICK = cues.click;
export const VANISH = cues.vanish;
export const SIGH = cues.sigh;
export const TAKE = cues.take;
export const SOLVE = cues.solve;
export const WIN = cues.win;
export const STACK = cues.stack;
export const ENTER = cues.enter;
export const PLAN = cues.plan;
export const FOUND = cues.found;
export const BELL = cues.bell;
export const FIVE = cues.five;
export const FINAL = cues.final;
