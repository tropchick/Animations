import cues from './cues.json';
import {clamp01} from '../slime/cues';

// SCP-3008 Part 1 "Closing Time". All timing comes from audio/make_scp_ep1_audio.py, which cuts the voice and writes cues.json.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, ramp, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export const DURATION_S = cues.duration;

export type Shot =
  | 'phone' | 'enter' | 'turn' | 'signs' | 'rise' | 'pa' | 'lightsout' | 'staff' | 'daynight' | 'run' | 'fort' | 'hide'
  | 'inside' | 'knock' | 'end';

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

export const WORDS = cues.words.map(([s, e, w]) => ({s: s as number, e: e as number, w: w as string}));
export const wordStart = (i: number) => WORDS[i].s;
export const wordEnd = (i: number) => WORDS[i].e;

export const REC = cues.rec;
export const DOORS = cues.doors;
export const GONE = cues.gone;
export const CHIME = cues.chime;
export const PA = cues.pa as [number, number];
export const ROWS = cues.rows;
export const STAFF_STEP = cues.staffStep;
export const TURN_HEAD = cues.turnHead as [number, number];
export const NIGHT_CUT = cues.nightCut;
export const HUNT = cues.hunt;
export const RUN_STEPS = cues.runSteps;
export const SLIDES = cues.slides;
export const SLIDE_LEN = cues.slideLen;
export const FLASH_OFF = cues.flashOff;
export const HAND_MOUTH = cues.handMouth;
export const LEGS = cues.legs;
export const KNOCKS = cues.knocks;
export const WHISPER = cues.whisper;
export const VOICE = cues.voice;
export const voiceAt = (v: number) => VOICE[Math.max(0, Math.min(VOICE.length - 1, Math.floor(v * 30)))] ?? 0;
