import cues from './cues.json';

// «Что весит больше: GTA 6 или мать Габена?». Timing comes from audio/make_gtamom_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot = 'hook' | 'selfie' | 'wifi' | 'planet' | 'cloudG' | 'cloudM' | 'washer' | 'console' | 'europe' | 'loading' | 'lift' | 'files' | 'island' | 'robe';

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
export const PHRASES = cues.phrases as [number, number][];

export const LAND_BOX = cues.landBox;
export const LAND_MOM = cues.landMom;
export const FLASH = cues.flash;
export const WIFI_OFF = cues.wifiOff;
export const DL = cues.dl;
export const NET_OFF = cues.netOff as [number, number];
export const INTO_CLOUD = cues.intoCloud;
export const THUNDER = cues.thunder;
export const SIT = cues.sit;
export const CLOUD_HIT = cues.cloudHit;
export const PRESS = cues.press;
export const FUSE = cues.fuse;
export const CONSOLE = cues.console;
export const EU_OFF = cues.euOff as [number, number];
export const LOAD_AT = cues.loadAt;
export const LIFT_AT = cues.liftAt;
export const ROWS = cues.rows as number[];
export const ROW_BIG = cues.rowBig;
export const REVEAL = cues.reveal;
export const WIN = cues.win;
export const BAIT = cues.bait;
export const LEFT = cues.left;
export const GTA7 = cues.gta7;
export const SCORE = cues.score as [number, number, number, number][];
