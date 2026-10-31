import cues from './cues.json';

// «Гляделки». All timing comes from audio/make_bus_audio.py, which builds the soundtrack and writes cues.json.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, ramp, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot = 'title' | 'girl' | 'brake' | 'step' | 'reveal' | 'smitten' | 'approach' | 'ask' | 'answer' | 'exit' | 'end';

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

type W = [number, number, string];
export const WORDS = cues.words as unknown as Record<'girl' | 'guy' | 'granny', W[]>;

export const BRAKE = cues.brake;
export const STEP_ASIDE = cues.stepAside;
export const TURN = cues.turn;
export const REVEAL = cues.reveal;
export const GLINT = cues.glint;
export const SCARF = cues.scarf;
export const WALK = cues.walk as [number, number];
export const TUG = cues.tug;
export const GLASSES = cues.glasses;
export const STAND = cues.stand;
export const DOOR_OPEN = cues.doorOpen;
export const EXIT_WALK = cues.exitWalk as [number, number];
export const DOOR_CLOSE = cues.doorClose;
export const DEPART = cues.depart;

// mouth opening per frame from the voice loudness
export const mouth = (who: 'girl' | 'guy' | 'granny', v: number) => {
  const arr = cues.mouth[who];
  const i = Math.max(0, Math.min(arr.length - 1, Math.round(v * 30)));
  const a = arr[i];
  return a < 0.12 ? 0 : Math.min(1, (a - 0.12) * 1.6);
};
