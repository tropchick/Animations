import cues from './cues.json';

// «Кто весит больше: мать Габена или мать Нолана?». Timing comes from audio/make_nolan_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot = 'intro' | 'scales' | 'boat' | 'beach' | 'venice' | 'spoons' | 'moon' | 'quake' | 'globe' | 'scope' | 'scopeN' | 'scopeG' | 'final' | 'moons' | 'leg';

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
export const STOMP = cues.stomp;
export const DRAW = cues.draw;
export const BOAT_IN = cues.boatIn;
export const SINK = cues.sink as [number, number];
export const STEP_SEA = cues.stepSea;
export const FLOOD = cues.flood as [number, number];
export const SCORE = cues.score as number[];
export const SPOONS = cues.spoons as number[];
export const MOON = cues.moon as [number, number];
export const HOP = cues.hop;
export const BIG_LAND = cues.bigLand;
export const GLUE = cues.glue;
export const CHECK = cues.check;
export const SEARCH = cues.search as [number, number];
export const STEP_ON = cues.stepOn;
export const LAUNCH = cues.launch;
export const WIN = cues.win;
