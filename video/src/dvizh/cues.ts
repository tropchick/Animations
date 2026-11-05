import cues from './cues.json';

// «Что если движуха закончится?»: a chain of causes. All timing comes from audio/make_dvizh_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot =
  | 'kitchen' | 'rate' | 'airport' | 'mall' | 'queue' | 'phone' | 'seller' | 'arrivals' | 'tech' | 'road'
  | 'school' | 'embassy' | 'rate2' | 'family' | 'uncle';

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

export const FIREWORKS = cues.fireworks as number[];
export const MUG = cues.mug as [number, number];
export const COUNT = cues.count as [number, number];
export const PHOTO = cues.photo;
export const FLIPS = cues.flips as number[];
export const PLY = cues.ply as number[];
export const SIGN_ON = cues.signOn;
export const LOAD = cues.load;
export const SIGH = cues.sigh;
export const DOORS_OPEN = cues.doorsOpen;
export const KISS = cues.kiss as [number, number, number];
export const TAGS = cues.tags as number[];
export const CASH = cues.cash;
export const ROLLER = cues.roller as [number, number, number, number];
export const HOLES_X = cues.holesX as number[];
export const BUZZ = cues.buzz;
export const DROP = cues.drop as [number, number];
export const COUNT2 = cues.count2 as [number, number];
export const CLINKS = cues.clinks as number[];
export const PAPER = cues.paper;
export const FIST = cues.fist;
