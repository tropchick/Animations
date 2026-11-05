import cues from './cues.json';

// «Что если шаурма подорожает в 5 раз?»: a chain of causes. All timing comes from audio/make_shawa_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot =
  | 'stall' | 'bench' | 'queue' | 'menu' | 'windows' | 'shop' | 'tags' | 'door' | 'wallet' | 'phone' | 'yacht'
  | 'rate' | 'bank' | 'propose' | 'flash' | 'keys' | 'van' | 'inside';

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

export const ONE = cues.one as [number, number];
export const JAW = cues.jaw;
export const BITES = cues.bites as number[];
export const FLIPS = cues.flips as number[];
export const CART = cues.cart;
export const TUG = cues.tug as [number, number];
export const RIP = cues.rip;
export const TAGS = cues.tags as number[];
export const KNOCKS = cues.knocks as number[];
export const HATCH = cues.hatch;
export const BUBBLE1 = cues.bubble1;
export const BUBBLE2 = cues.bubble2;
export const DOOR = cues.door;
export const WALLET = cues.wallet;
export const STACK = cues.stack as number[];
export const HORN = cues.horn;
export const COUNT = cues.count as [number, number];
export const SIGN = cues.sign as [number, number];
export const STAMP = cues.stamp;
export const BOX_OPEN = cues.boxOpen;
export const GASP = cues.gasp;
export const HANDOVER = cues.handover;
export const SWAP = cues.swap;
export const DOORS = cues.doors;
export const GLANCE = cues.glance as [number, number];
export const BITE = cues.bite;
