import cues from './cues.json';

// «Что если бы читы из ГТА заработали в реальной жизни?». Timing comes from audio/make_cheats_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot =
  | 'teaser'
  | 'yard'
  | 'phone'
  | 'sack'
  | 'rain'
  | 'bread'
  | 'typecop'
  | 'cop'
  | 'lift'
  | 'jam'
  | 'granny'
  | 'bars'
  | 'office'
  | 'thumb'
  | 'round'
  | 'banner'
  | 'moon'
  | 'diary'
  | 'door'
  | 'panic'
  | 'stare';

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

export type Code = {text: string; keys: number[]; on: number};
export const CODES = cues.codes as Code[];
// how many letters of code i are typed at v
export const typed = (i: number, v: number) => CODES[i].keys.filter((t) => v >= t).length;
export const typedText = (i: number, v: number) => CODES[i].text.slice(0, typed(i, v));

export const SACK = cues.sack;
export const PRICE = cues.price as number[];
export const PARK = cues.park;
export const LIFT = cues.lift;
export const GRANNY = cues.granny;
export const TEAR = cues.tear;
export const POP = cues.pop;
export const BANNER = cues.banner;
export const FLAG = cues.flag;
export const ERASE = cues.erase;
export const DOOR = cues.door;
export const FAIL = cues.fail;
