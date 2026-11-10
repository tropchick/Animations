import cues from './cues.json';

// «День выхода GTA 6». Timing comes from audio/make_day_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export const FPS = 30;
export const DURATION_S = cues.duration;

export type Shot =
  | 'hook' | 'hook2' | 'block' | 'room' | 'empty' | 'bus' | 'cockpit' | 'office' | 'jump' | 'police'
  | 'heat' | 'earth' | 'penguin' | 'miami' | 'flood' | 'gator' | 'raft' | 'pc' | 'build';

export const SHOTS = cues.shots.map(([name, from], i) => ({
  name: name as Shot,
  from: from as number,
  to: i + 1 < cues.shots.length ? (cues.shots[i + 1][1] as number) : DURATION_S,
}));
export const shotAt = (v: number) => {
  const s = SHOTS.find((x) => v >= x.from && v < x.to) ?? SHOTS[SHOTS.length - 1];
  return {...s, t: v - s.from, d: s.to - s.from, k: Math.min(1, Math.max(0, (v - s.from) / (s.to - s.from)))};
};
export const shotStart = (name: Shot) => SHOTS.find((s) => s.name === name)!.from;
export const shotEnd = (name: Shot) => SHOTS.find((s) => s.name === name)!.to;

export const WORDS = cues.words as unknown as [number, number, string, number][];
export const PHRASES = cues.phrases as [number, number][];

export const TICKS = cues.ticks as number[];
export const ZERO = cues.zero;
export const WAVE = cues.wave as [number, number];
export const PRESS = cues.press;
export const LAPSE = cues.lapse as [number, number];
export const JUMP = cues.jump;
export const LAND = cues.land;
export const ALARM = cues.alarm;
export const THERMO = cues.thermo as [number, number];
export const CALVE = cues.calve;
export const RISE = cues.rise as [number, number];
export const GATOR_IN = cues.gatorIn;
export const GRAB = cues.grab;
export const PC_ON = cues.pcOn;
export const FINAL = cues.final;
