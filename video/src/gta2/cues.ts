import cues from './cues.json';

// The remake of «Что если GTA 6 перенесут ещё на год?»: a chain of causes. Timing from audio/make_gta2_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot =
  | 'bill' | 'fan' | 'refund' | 'servers' | 'chart' | 'domino' | 'bubble' | 'crisis' | 'studio' | 'repaint' | 'leak'
  | 'globe' | 'card' | 'shelf' | 'burn' | 'find' | 'setup' | 'screen' | 'turn';

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
export const PIECES = cues.pieces as [number, number][];

export const PRESS = cues.press;
export const SERVERS = cues.servers;
export const SERVERS_OFF = cues.serversOff as [number, number];
export const PLUNGE = cues.plunge;
export const FACEPLANT = cues.faceplant;
export const DOMINO_TIP = cues.dominoTip;
export const DOMINO_HITS = cues.dominoHits as number[];
export const POP = cues.pop;
export const STANDUP = cues.standup as number[];
export const REPAINT2 = cues.repaint2 as [number, number];
export const PAINT2 = cues.paint2 as [number, number];
export const USB = cues.usb;
export const UPLOAD = cues.upload as [number, number];
export const ARCS = cues.arcs as [number, number];
export const NET_DOWN = cues.netDown;
export const LIGHTS_OUT = cues.lightsOut as [number, number];
export const DECLINED = cues.declined;
export const DISC_FOUND = cues.discFound;
export const DISC_IN = cues.discIn;
export const TV_ON = cues.tvOn;
export const ERROR = cues.error;
export const TURN = cues.turn;
export const TV_OFF = cues.tvOff;
