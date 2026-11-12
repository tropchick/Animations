import cues from './cues.json';

// «Кто богаче: Габен или Мистер Бист?». Timing comes from audio/make_beast_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot = 'hook' | 'worth' | 'fansG' | 'fansB' | 'spendB' | 'yacht' | 'factory' | 'ageG' | 'ageB' | 'final' | 'sea' | 'wallet' | 'mom' | 'win';

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

export const GROW_B = cues.growB;
export const GROW_G = cues.growG;
export const X4 = cues.x4;
export const BOARD = cues.board;
export const GLOBE = cues.globe;
export const NO1 = cues.no1;
export const MIL = cues.mil;
export const HORN = cues.horn;
export const RULER = cues.ruler;
export const BOUGHT = cues.bought;
export const BADGE = cues.badge;
export const THRONE = cues.throne;
export const FINAL = cues.final;
export const MINUS = cues.minus;
export const MOTH = cues.moth;
export const DOLG = cues.dolg;
export const ENV = cues.env;
export const WIN = cues.win;
export const CARD = cues.card;
export const SCORE = cues.score as [number, number, number][];
