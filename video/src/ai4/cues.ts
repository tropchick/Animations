import cues from './cues.json';

// «Что если ИИ станет умнее людей? 4 сценария». All timing comes from audio/make_ai4_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, clamp01, ramp, smooth, easeIn, easeOut, lerp, lerp3, add3, rnd, hop} from '../lastman/cues';
export type {V3} from '../lastman/cues';
import {clamp01} from '../lastman/cues';

export const DURATION_S = cues.duration;

export type Shot =
  | 'hook' | 'quad' | 'w1wake' | 'w1window' | 'w1bunker' | 'w1screen'
  | 'w2wake' | 'w2bus' | 'w2brick' | 'w2tv' | 'w2pull' | 'w2pigeon'
  | 'w3wake' | 'w3sign' | 'w3feed' | 'w3fence' | 'w3wave'
  | 'w4wake' | 'w4window' | 'w4fridge' | 'w4vacuum' | 'quadEnd';

export const SHOTS = cues.shots.map(([name, from], i) => ({
  name: name as Shot,
  from: from as number,
  to: i + 1 < cues.shots.length ? (cues.shots[i + 1][1] as number) : DURATION_S,
}));
export type ShotState = {name: Shot; from: number; to: number; t: number; k: number};
export const shotAt = (v: number): ShotState => {
  const s = SHOTS.find((x) => v >= x.from && v < x.to) ?? SHOTS[SHOTS.length - 1];
  return {...s, t: v - s.from, k: clamp01((v - s.from) / (s.to - s.from))};
};
export const shotStart = (name: Shot) => SHOTS.find((s) => s.name === name)!.from;
export const shotEnd = (name: Shot) => SHOTS.find((s) => s.name === name)!.to;

export const WORDS = cues.words as unknown as [number, number, string, number][];
export const PIECES = cues.pieces as [number, number][];
export const P = (k: number) => PIECES[k][0];
export const PE = (k: number) => PIECES[k][1];

type Ev = typeof cues.ev;
export const EV: Ev = cues.ev;
// which world a shot belongs to (0 = the four windows)
export const worldOf = (name: Shot) => (name.startsWith('w') ? Number(name[1]) : 0);
