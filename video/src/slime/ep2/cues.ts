import cues from './cues.json';
import {clamp01} from '../cues';

// Episode 2 timing, written by audio/make_slime_ep2_audio.py.
export const DURATION_S = cues.duration;

export type Shot2 =
  | 'jarsink' | 'recorder' | 'swarm' | 'sinking' | 'phone' | 'door' | 'face' | 'window' | 'deskgone' | 'doorgap'
  | 'yard' | 'tunnel' | 'waiting' | 'radio' | 'silent' | 'osoka' | 'roof' | 'roofview' | 'aerial' | 'title';

export const SHOTS = cues.shots.map(([name, from], i) => ({
  name: name as Shot2,
  from: from as number,
  to: i + 1 < cues.shots.length ? (cues.shots[i + 1][1] as number) : DURATION_S,
}));

export const shotAt = (v: number) => {
  const s = SHOTS.find((x) => v >= x.from && v < x.to) ?? SHOTS[SHOTS.length - 1];
  return {...s, t: v - s.from, k: clamp01((v - s.from) / (s.to - s.from))};
};
export const shotStart = (name: Shot2) => SHOTS.find((s) => s.name === name)!.from;
export const shotEnd = (name: Shot2) => SHOTS.find((s) => s.name === name)!.to;

export const wordStart = (i: number) => cues.words[i][0] as number;
export const wordEnd = (i: number) => cues.words[i][1] as number;

export const LEVER = cues.lever;
export const RADIO_CLICK = cues.radioClick;
export const HER = cues.her as [number, number];
export const LIGHTS_OFF = cues.lightsOff;
export const VOICE = cues.voice;

// ep. 1 sets are shown in their final state (lid shut, jar placed, note written)
export const EP1_END = 1000;
export const LOG_NUMBER = 20;
