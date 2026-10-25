import cues from './cues.json';
import {clamp01} from '../slime/cues';

// "Последний", episode 1. All timing comes from audio/make_last_ep1_audio.py, which cuts the voice and writes cues.json.
export {FPS, ramp, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export const DURATION_S = cues.duration;

export type Shot =
  | 'hook' | 'chat' | 'record' | 'stuck' | 'button' | 'sleep' | 'morning' | 'doors' | 'calls' | 'screen112'
  | 'yard' | 'cross' | 'shop' | 'money' | 'steps' | 'door36' | 'window' | 'reflect' | 'sent' | 'title';

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

export const wordStart = (i: number) => cues.words[i][0] as number;
export const wordEnd = (i: number) => cues.words[i][1] as number;

export const LIGHTS_OUT = cues.lightsOut;
export const JOLT = cues.jolt;
export const MOTOR = cues.motor;
export const DOORS = cues.doors;
export const GREEN = cues.green;
export const TICK = cues.tick;
export const VOICE_START = cues.voiceStart;
export const VOICE = cues.voice;
export const SENT = shotStart('sent');
// length of the voice message on the phone, as it would show: from the first word to the send
export const MESSAGE_S = SENT - VOICE_START;
