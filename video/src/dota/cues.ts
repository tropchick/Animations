import cues from './cues.json';

// «Что если Доту закроют навсегда?». Timing comes from audio/make_dota_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot =
  | 'room'
  | 'windows'
  | 'yard'
  | 'queue'
  | 'printer'
  | 'sheet'
  | 'road'
  | 'office'
  | 'plant'
  | 'control'
  | 'leak'
  | 'leave'
  | 'off'
  | 'earth'
  | 'candle'
  | 'fake';

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

export const SWITCH = cues.switch;
export const MUG = cues.mug;
export const WIN_OUT = cues.winOut as [number, number];
export const DOORS = cues.doors;
export const TURN = cues.turn;
export const LABEL = cues.label;
export const PRINT = cues.print as [number, number];
export const STAMP = cues.stamp;
export const HONK = cues.honk as number[];
export const SIGN = cues.sign;
export const GRAPH = cues.graph as [number, number];
export const HOME = cues.home;
export const BUZZ = cues.buzz;
export const LEAK_TXT = cues.leakTxt;
export const JUMP = cues.jump;
export const ALARM = cues.alarm;
export const TOWERS_OFF = cues.towersOff;
export const LIGHTS_OUT = cues.lightsOut as [number, number];
export const NOTIFY = cues.notify;
export const HEAD = cues.head;
export const CANDLE_OUT = cues.candleOut;
export const FINAL = cues.final;
