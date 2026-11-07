import cues from './cues.json';

// «Что если ты остался последним мужчиной на планете?»: POV chase. All timing comes from audio/make_lastman_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export const FPS = 30;
export const DURATION_S = cues.duration;
export type V3 = [number, number, number];

export type Shot =
  | 'wake' | 'radio' | 'mirror' | 'story' | 'views' | 'window' | 'ex' | 'intercom' | 'shirt' | 'throw' | 'fight'
  | 'hotdog' | 'metro' | 'wagon' | 'sad' | 'shop' | 'net' | 'turn' | 'run' | 'train' | 'porch' | 'table' | 'bench'
  | 'heli' | 'lab' | 'clone' | 'vent' | 'roof' | 'call' | 'ear' | 'counter' | 'final';

export const SHOTS = cues.shots.map(([name, from], i) => ({
  name: name as Shot,
  from: from as number,
  to: i + 1 < cues.shots.length ? (cues.shots[i + 1][1] as number) : DURATION_S,
}));
export type ShotState = {name: Shot; from: number; to: number; t: number; k: number};
export const shotAt = (v: number): ShotState => {
  const s = SHOTS.find((x) => v >= x.from && v < x.to) ?? SHOTS[SHOTS.length - 1];
  return {...s, t: v - s.from, k: clamp01((v - s.from) / (s.to - s.from))};
};
export const shotStart = (name: Shot) => SHOTS.find((s) => s.name === name)!.from;
export const shotEnd = (name: Shot) => SHOTS.find((s) => s.name === name)!.to;

export const CAPS = cues.caps as [number, number, string, string][];
export const C = cues;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ramp = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
export const smooth = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x: number) => Math.pow(clamp01(x), 3);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
// deterministic pseudo-random 0..1
export const rnd = (i: number, s = 0) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
// a short hop 0 -> 1 -> 0 over len seconds after t0
export const hop = (v: number, t0: number, len: number) => {
  const x = (v - t0) / len;
  return x < 0 || x > 1 ? 0 : Math.sin(Math.PI * x);
};
