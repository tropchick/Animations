import cues from './cues.json';

// «Что если Солнце погаснет?»: popular-science chain. All timing comes from audio/make_sun_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot =
  | 'beach' | 'gap' | 'kiosk' | 'dark' | 'moon' | 'stars' | 'jupiter' | 'orbit' | 'grid' | 'snow'
  | 'field' | 'airport' | 'greenhouse' | 'ice' | 'vent' | 'icecream';

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

export const WORDS = cues.words as unknown as [number, number, string, number][];
export const GROUPS = cues.groups as number[][];

export const BUY = cues.buy;
export const DARK = cues.dark;
export const LAMPS = cues.lamps as number[];
export const MOON_OFF = cues.moonOff;
export const JUP_OFF = cues.jupOff as [number, number];
export const HEAT = cues.heat as number[];
export const BLACKOUT = cues.blackout as number[];
export const CRACK = cues.crack;
export const KNOCK = cues.knock as number[];
const CLOCK = cues.clock as [number, number][];

// seconds since the Sun went out, as the clock shows it
export const clockAt = (v: number) => {
  if (v <= CLOCK[0][0]) return 0;
  for (let i = 1; i < CLOCK.length; i++) {
    if (v <= CLOCK[i][0]) {
      const [a, sa] = CLOCK[i - 1];
      const [b, sb] = CLOCK[i];
      return sa + ((v - a) / (b - a)) * (sb - sa);
    }
  }
  return CLOCK[CLOCK.length - 1][1];
};
