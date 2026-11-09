import cues from './cues.json';

// «Мать Габена села на диету». Timing comes from audio/make_diet_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot = 'hook' | 'moon' | 'beach' | 'run' | 'city' | 'saturn' | 'servers' | 'galaxy' | 'weigh' | 'fridge' | 'rwMoon' | 'rwSaturn' | 'rwBeach' | 'rwServers' | 'monday';

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

export const DAY_AT = cues.dayAt as number[];
export const KICK = cues.kick;
export const PLATE = cues.plate;
export const MOON_GO = cues.moonGo as [number, number];
export const TIDE = cues.tide as [number, number];
export const RUN = cues.run as [number, number];
export const RINGS = cues.rings as [number, number];
export const DONE = cues.done;
export const GONE = cues.gone;
export const REVEAL = cues.reveal;
export const SUCK = cues.suck;
export const SLIPS = cues.slips;
export const DOOR = cues.door;
export const BITE = cues.bite;
export const DELAY = cues.delay;
export const KICK2 = cues.kick2;
export const PLATE2 = cues.plate2;
export const BAR = cues.bar as [number, number][];
