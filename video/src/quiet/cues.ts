import cues from './cues.json';

// «Тихий этаж»: all timing comes from audio/make_quiet_audio.py (src/quiet/cues.json).
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot =
  | 'door' | 'pull' | 'turn' | 'rNoise' | 'rTire' | 'rHabit' | 'rCount' | 'rScream' | 'palm'
  | 'pharmacy' | 'detour' | 'note' | 'pWater' | 'pDoor' | 'pWin' | 'pLadder' | 'pThread' | 'pExit' | 'pFood'
  | 'knock' | 'slit' | 'whisper' | 'crowd' | 'radio' | 'wall' | 'dawn' | 'change' | 'palm2' | 'road';

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
export const shotLen = (name: Shot) => shotEnd(name) - shotStart(name);
// time inside a shot, and 0..1 progress
export const tIn = (name: Shot, v: number) => v - shotStart(name);
export const kIn = (name: Shot, v: number) => clamp01((v - shotStart(name)) / shotLen(name));

// [start, end, token, group, speaker]
export const WORDS = cues.words as unknown as [number, number, string, number, string][];
export const GROUPS = cues.groups as number[];

export const CRUNCH = cues.crunch; // glass under Артём's boot; the head starts to turn
export const KNOCKS = cues.knocks as number[];
export const TUG = cues.tug; // the thread jerks Соня's wrist
export const HOWL = cues.howl as [number, number];
export const TIP = cues.tip; // the bin falls over (rule 1 → 10 → 100)
export const SCREAM = cues.scream; // the screamer opens his mouth
export const TICK = cues.tick;
export const HAMMER = cues.hammer as number[];
export const RADIO_ON = cues.radioOn;
export const TITLE = cues.title;
export const ASK = cues.ask;
