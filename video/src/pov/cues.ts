import cues from './cues.json';

// All timing comes from audio/make_pov_audio.py, which places the voice and writes cues.json.
export const FPS = 30;
export const DURATION_S = cues.duration;
export type V3 = [number, number, number];

export type ShotName =
  | 'alarm' | 'wake' | 'cameras' | 'door' | 'keys' | 'crying' | 'field' | 'timelapse' | 'sleeper' | 'studio'
  | 'lcd' | 'beach' | 'digging' | 'editroom' | 'editorface' | 'money' | 'editorcry' | 'phone' | 'bed' | 'eyes'
  | 'alarm2';

export const SHOTS = cues.shots.map(([name, from], i) => ({
  name: name as ShotName,
  from: from as number,
  to: i + 1 < cues.shots.length ? (cues.shots[i + 1][1] as number) : DURATION_S,
}));

export type ShotState = {name: ShotName; from: number; to: number; t: number; k: number};
export const shotAt = (v: number): ShotState => {
  const s = SHOTS.find((x) => v >= x.from && v < x.to) ?? SHOTS[SHOTS.length - 1];
  return {...s, t: v - s.from, k: clamp01((v - s.from) / (s.to - s.from))};
};
export const shotStart = (name: ShotName) => SHOTS.find((s) => s.name === name)!.from;
export const shotEnd = (name: ShotName) => SHOTS.find((s) => s.name === name)!.to;
export const wordStart = (i: number) => cues.words[i][0] as number;
export const wordEnd = (i: number) => cues.words[i][1] as number;

export const MONEY = cues.money.map(([t, a, w]) => ({t: t as number, amount: a as number, what: w as string}));
export const FLASHES = cues.flashes;
export const SLAP = cues.slap;
export const CURTAINS = cues.curtains;
export const CUP_FALL = cues.cupFall;
export const MONEY_SLAP = cues.moneySlap;
export const NOTIFY = cues.notify;
export const BED_FLOP = cues.bedFlop;
export const EYES_OPEN = cues.eyesOpen;
export const RESET = cues.reset;
export const KEYS = cues.keys;
export const moneyAt = (what: string) => MONEY.find((m) => m.what === what)!.t;

// money spent so far, with a quick count-up after every purchase
export const spentAt = (v: number) => {
  let s = 0;
  for (const m of MONEY) s += m.amount * smooth(ramp(v, m.t, m.t + 0.45));
  return Math.round(s);
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ramp = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
export const smooth = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
// a short hop 0 -> 1 -> 0 over len seconds after t0
export const hop = (v: number, t0: number, len: number) => {
  const x = (v - t0) / len;
  return x < 0 || x > 1 ? 0 : Math.sin(Math.PI * x);
};
