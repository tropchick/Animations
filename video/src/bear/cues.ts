import cues from './cues.json';

// «Что если она реально выбрала медведя?»: all timing comes from audio/make_bear_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot =
  | 'phone' | 'path' | 'rise' | 'throw' | 'wrapper' | 'sit' | 'views' | 'carry' | 'dance' | 'unbox' | 'contract'
  | 'build' | 'den' | 'dinner' | 'sign' | 'ladle' | 'crowd' | 'jaw' | 'star' | 'pass' | 'podcast' | 'lean'
  | 'freeze' | 'answer' | 'end';

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

// [start, end, token, group, speaker]
export const WORDS = cues.words as unknown as [number, number, string, number, string][];
export const GROUPS = cues.groups as number[];

type Lip = {at: number; vals: number[]};
const LIPS = cues.lips as unknown as Record<'mom' | 'host' | 'bear', Lip>;
// how open a speaker's mouth is at story time v (0 shut .. 1 wide)
export const lip = (who: 'mom' | 'host' | 'bear', v: number) => {
  const l = LIPS[who];
  const f = (v - l.at) * 30;
  if (f < 0 || f >= l.vals.length - 1) return 0;
  const i = Math.floor(f);
  return l.vals[i] + (l.vals[i + 1] - l.vals[i]) * (f - i);
};

export const TYPE = cues.type as [number, number];
export const POST = cues.post;
export const REPLY = cues.reply;
export const JUMP = cues.jump;
export const WALK = cues.walk as [number, number];
export const STEP_T = cues.stepT;
export const RUSTLE = cues.rustle;
export const RISE = cues.rise as [number, number];
export const ROAR = cues.roar as [number, number];
export const GRAB = cues.grab;
export const THROW = cues.throw;
export const CATCH = cues.catch;
export const CHEW = cues.chew as [number, number];
export const WRAP_LAND = cues.wrapLand;
export const SIT = cues.sit;
export const PAW = cues.paw;
export const COUNT = cues.count as [number, number];
export const LIFT = cues.lift;
export const MUSIC0 = cues.music0;
export const BPM = cues.bpm;
export const SUBS = cues.subs as [number, number];
export const RIP = cues.rip;
export const SLIDE = cues.slide as [number, number];
export const DIP = cues.dip;
export const STAMP = cues.stamp;
export const SACK = cues.sack;
export const HAMMER = cues.hammer as number[];
export const LIGHTS = cues.lights;
export const POINT = cues.point;
export const LADLE = cues.ladle;
export const JAW = cues.jaw;
export const FLASHES = cues.flashes as number[];
export const LEAN = cues.lean as [number, number];
export const UNWRAP = cues.unwrap as [number, number];
export const BITE = cues.bite;
export const TITLE = cues.title;

// beat phase of the music bed (0 at each beat), and the beat number
export const beatAt = (v: number) => {
  const b = Math.max(0, ((v - MUSIC0) * BPM) / 60);
  return {n: Math.floor(b), ph: b - Math.floor(b)};
};
