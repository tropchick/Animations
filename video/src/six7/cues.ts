import cues from './cues.json';

// «Что если число 67 запретят?». Timing comes from audio/make_six7_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot =
  | 'class'
  | 'council'
  | 'stamp'
  | 'gesture'
  | 'poster'
  | 'scales'
  | 'calc'
  | 'bus'
  | 'cake'
  | 'grumpy'
  | 'board'
  | 'news'
  | 'border'
  | 'ruler'
  | 'vote'
  | 'void'
  | 'finale';

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
export const BANS = cues.bans as unknown as [string, number][];

export const STAMP = cues.stamp;
export const WHISTLE = cues.whistle;
export const POSTER = cues.poster;
export const TAPE = cues.tape;
export const CALC = cues.calc;
export const BUSFLIP = cues.busflip;
export const CAKE = cues.cake;
export const HANDS = cues.hands;
export const NEWS = cues.news;
export const RULER = cues.ruler;
export const DENY = cues.deny;
export const VOTE = cues.vote;
export const VOID = cues.void;
export const FINAL = cues.final;
