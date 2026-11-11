import cues from './cues.json';

// «100 мужчин против гориллы». Timing comes from audio/make_gor_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot = 'over' | 'face' | 'hesitate' | 'beat' | 'charge' | 'brave' | 'clash' | 'swarm' | 'melee' | 'pile' | 'pinned' | 'spent' | 'release' | 'result';

export const SHOTS = cues.shots.map(([name, from], i) => ({
  name: name as Shot,
  from: from as number,
  to: i + 1 < cues.shots.length ? (cues.shots[i + 1][1] as number) : DURATION_S,
}));
export const shotAt = (v: number) => {
  const s = SHOTS.find((x) => v >= x.from && v < x.to) ?? (v < 0 ? SHOTS[0] : SHOTS[SHOTS.length - 1]);
  return {...s, t: v - s.from, k: clamp01((v - s.from) / (s.to - s.from))};
};
export const S = Object.fromEntries(SHOTS.map((s) => [s.name, s.from])) as Record<Shot, number>;
export const E = Object.fromEntries(SHOTS.map((s) => [s.name, s.to])) as Record<Shot, number>;

export const WORDS = cues.words as unknown as [number, number, string, number][];
export const GROUPS = cues.groups as number[][];
export const PHRASES = cues.phrases as [number, number][];

export const BEATS = cues.beats as number[];
export const ROAR = cues.roar;
export const CHARGE = cues.charge;
export const STOP = cues.stop;
export const RUN5 = cues.run5;
export const HITS = cues.hits as number[];
export const MELEE_HITS = cues.meleeHits as number[];
export const HEAVE = cues.heave;
export const THROWN = cues.thrown as number[];
export const SLUMP = cues.slump;
export const LOOKBACK = cues.lookback;
export const PLATE1 = cues.plate1;
export const PLATE2 = cues.plate2;
export const HURT = cues.hurt as number[];
export const TONS = cues.tons;
export const KILOS = cues.kilos;

const keyed = (keys: number[][]) => (v: number) => {
  if (v <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (v < keys[i][0]) {
      const k = (v - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]);
      return keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * k;
    }
  }
  return keys[keys.length - 1][1];
};
// fight clock in seconds and the gorilla's strength 0..1
export const timerAt = keyed(cues.timer as number[][]);
export const powerAt = keyed(cues.power as number[][]);
export const hurtAt = (v: number) => HURT.filter((x) => v >= x).length;
