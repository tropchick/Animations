import cues from './cues.json';

// The NEW «Кто весит больше: мать Габена или мать Нолана?» (2026-11-11). Timing comes from audio/make_nolan2_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot = 'intro' | 'beachG' | 'beachN' | 'baikal' | 'trampN' | 'trampG' | 'core' | 'aussie' | 'planeG' | 'planeN' | 'tilt' | 'moscow' | 'clockN' | 'clockG' | 'final' | 'star' | 'sit';

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

export const LAND = cues.land;
export const FOOT_G = cues.footG;
export const STEP_N = cues.stepN;
export const BAIKAL = cues.baikal as [number, number];
export const TEAR = cues.tear;
export const DIVE = cues.dive;
export const POP = cues.pop;
export const TILT_G = cues.tiltG;
export const EARTH_TILT = cues.earthTilt as [number, number];
export const SUMMER = cues.summer;
export const MINUS = cues.minus;
export const REWIND = cues.rewind as [number, number];
export const BOX = cues.box;
export const SIT = cues.sit;
export const LAUNCH = cues.launch;
export const STAR = cues.star;
export const SCORE = cues.score as number[];
export const WIN = cues.win;
