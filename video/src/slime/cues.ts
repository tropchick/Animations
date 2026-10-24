import cues from './cues.json';

// All timing comes from audio/make_slime_audio.py, which cuts the voice and writes cues.json.
export const FPS = 30;
export const DURATION_S = cues.duration;
export type V3 = [number, number, number];

export type ShotName =
  | 'grain' | 'recorder' | 'hall' | 'microscope' | 'dust' | 'arm' | 'chamber' | 'locks' | 'counter'
  | 'approach' | 'glass' | 'corridor' | 'desk' | 'glint' | 'pit' | 'rim' | 'bottom' | 'jar' | 'note'
  | 'hands' | 'jarhold' | 'shock' | 'title';

export const SHOTS = cues.shots.map(([name, from], i) => ({
  name: name as ShotName,
  from: from as number,
  to: i + 1 < cues.shots.length ? (cues.shots[i + 1][1] as number) : DURATION_S,
}));

export const shotAt = (v: number) => {
  const s = SHOTS.find((x) => v >= x.from && v < x.to) ?? SHOTS[SHOTS.length - 1];
  return {...s, t: v - s.from, k: clamp01((v - s.from) / (s.to - s.from))};
};
export const shotStart = (name: ShotName) => SHOTS.find((s) => s.name === name)!.from;
export const shotEnd = (name: ShotName) => SHOTS.find((s) => s.name === name)!.to;

// word i of the main voice file: [start, end] on the video timeline
export const wordStart = (i: number) => cues.words[i][0] as number;
export const wordEnd = (i: number) => cues.words[i][1] as number;
export const ENDING = cues.ending.map(([s, e, w]) => ({s: s as number, e: e as number, w: w as string}));

export const LOCKS = cues.locks;
export const LID = cues.lid;
export const COUNT_ZERO = cues.countZero;
export const GLASS_TAP = cues.glassTap;
export const JAR_DOWN = cues.jarDown;
export const VOICE = cues.voice;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ramp = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
export const smooth = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// clock on the voice log: 03:40 at the start, 03:52 at the counter, 04:12 at the desk, 04:14 in the notebook
export const LOG_NUMBER = 19;
