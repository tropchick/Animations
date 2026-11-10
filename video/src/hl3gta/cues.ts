import cues from './cues.json';

// «GTA 7 или Half-Life 3: что выйдет быстрее?». Timing comes from audio/make_hl3gta_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot = 'hook' | 'race' | 'stairsH' | 'stairsG' | 'calendar' | 'loading' | 'sofa' | 'tower' | 'door' | 'toaster' | 'finish' | 'photo' | 'reveal' | 'podium';

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

export const LIGHTS = cues.lights as number[];
export const GO = cues.go;
export const STEP3 = cues.step3;
export const SLIDE = cues.slide;
export const HOPS = cues.hops as number[];
export const FLIP = cues.flip as [number, number];
export const SNORE = cues.snore;
export const LOAD_AT = cues.loadAt;
export const READY = cues.ready;
export const COINS = cues.coins;
export const BILLION = cues.billion;
export const LAUNCH = cues.launch;
export const KNOCKS = cues.knocks as number[];
export const POP = cues.pop;
export const FLASH = cues.flash;
export const NOSE = cues.nose;
export const EP3 = cues.ep3;
export const VOID = cues.void;
export const WIN = cues.win;
export const Y2039 = cues.y2039;
export const NOPC = cues.nopc;
export const SCORE = cues.score as [number, number, number][];
