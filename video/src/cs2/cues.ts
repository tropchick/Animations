import cues from './cues.json';

// «Что если в CS2 добавят античит?». Timing comes from audio/make_cs2_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot = 'club' | 'lobby' | 'family' | 'arena' | 'queue' | 'office' | 'exit' | 'exam' | 'launch' | 'orbit' | 'xray' | 'mirror' | 'back' | 'phone';

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

export const BAN = cues.ban as [number, number];
export const LOBBY = cues.lobby;
export const CAKE = cues.cake;
export const SEATS_BAN = cues.seatsBan;
export const TROPHY = cues.trophy;
export const HIRED = cues.hired as [number, number];
export const GROW = cues.grow as [number, number];
export const EXIT = cues.exit;
export const SWEEP = cues.sweep as [number, number];
export const LIFTOFF = cues.liftoff;
export const XRAY = cues.xray;
export const DETECT = cues.detect;
export const STAMP = cues.stamp;
export const FALL = cues.fall;
export const GREEN = cues.green;
export const KILLS = cues.kills as number[];
export const NOTIFY = cues.notify;
export const FINAL = cues.final;
