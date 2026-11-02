import cues from './cues.json';

// «Что если GTA 6 перенесут ещё на год?». All timing comes from audio/make_gta_audio.py (writes cues.json).
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot =
  | 'bill' | 'fan' | 'sun' | 'blackout' | 'tv' | 'moon' | 'wave' | 'run' | 'volcano' | 'bombs' | 'mask'
  | 'ice' | 'candle' | 'asteroid' | 'rocket' | 'miss' | 'bunker' | 'reach' | 'impact' | 'ruins' | 'phone';

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

// [start, end, token, piece]
export const WORDS = cues.words as unknown as [number, number, string, number][];
export const GROUPS = cues.groups as number[][];
export const PIECES = cues.pieces as [number, number][];

export const REPAINT = cues.repaint as [number, number];
export const PAINT = cues.paint as [number, number];
export const JAW = cues.jaw;
export const FLARE = cues.flare;
export const BLACKOUT = cues.blackout;
export const TV_OFF = cues.tvOff;
export const MOON_CRACK = cues.moonCrack;
export const WAVE_HIT = cues.waveHit;
export const ERUPT = cues.erupt;
export const BOMBS = cues.bombs as number[];
export const FREEZE = cues.freeze;
export const LAUNCH = cues.launch;
export const PASS = cues.pass;
export const LOAD_100 = cues.load100;
export const PLAY = cues.play;
export const QUAKE = cues.quake;
export const IMPACT = cues.impact;
export const SCREEN_ON = cues.screenOn;
export const NOTIFY = cues.notify;
export const BATTERY = cues.battery as [number, number];
export const SCREEN_OFF = cues.screenOff;

export const ramp = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x: number) => Math.pow(clamp01(x), 3);

// a cheap deterministic random in [0, 1) from an integer seed
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
