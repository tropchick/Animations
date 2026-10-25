import cues from './cues.json';
import {clamp01} from '../cues';

// Episode 3 timing, written by audio/make_slime_ep3_audio.py.
export const DURATION_S = cues.duration;

export type Shot3 =
  | 'aerial' | 'recorder' | 'cordon' | 'tent' | 'notepad' | 'crane' | 'wall' | 'fire' | 'phone' | 'kitchen'
  | 'bridge' | 'window' | 'city' | 'scan' | 'hold' | 'live' | 'reflect' | 'title';

export const SHOTS = cues.shots.map(([name, from], i) => ({
  name: name as Shot3,
  from: from as number,
  to: i + 1 < cues.shots.length ? (cues.shots[i + 1][1] as number) : DURATION_S,
}));

export const shotAt = (v: number) => {
  const s = SHOTS.find((x) => v >= x.from && v < x.to) ?? SHOTS[SHOTS.length - 1];
  return {...s, t: v - s.from, k: clamp01((v - s.from) / (s.to - s.from))};
};
export const shotStart = (name: Shot3) => SHOTS.find((s) => s.name === name)!.from;
export const shotEnd = (name: Shot3) => SHOTS.find((s) => s.name === name)!.to;

export const wordStart = (i: number) => cues.words[i][0] as number;
export const wordEnd = (i: number) => cues.words[i][1] as number;

export const TWO = cues.two;
export const FLAME = cues.flame as [number, number];
export const NO_NET = cues.noNet;
export const NO_INTERNET = cues.noInternet;
export const DARK = cues.dark;
export const SCAN_STOP = cues.scanStop;
export const LIVE = cues.live;
export const HER = cues.her as [number, number][];
export const VOICE = cues.voice;
export const LOG_NUMBER = 21;
