import cues from './cues.json';

// «Сколько весит мать Габена?». Timing comes from audio/make_gaben_audio.py.
// v is story time: frame 0 is the cover, so v = (frame - 1) / 30.
export {FPS, smooth, lerp, lerp3, add3, clamp01} from '../slime/cues';
export type {V3} from '../slime/cues';
export {ramp, easeIn, easeOut, rnd} from '../gta/cues';
import {clamp01} from '../slime/cues';

export const DURATION_S = cues.duration;

export type Shot = 'scale' | 'pile' | 'truck' | 'heli' | 'orbit' | 'moon' | 'donut' | 'universe' | 'servers' | 'screen';

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

export const STEP = cues.step;
export const NEEDLE = cues.needle as [number, number];
export const BURST = cues.burst;
export const PILE_DROP = cues.pileDrop;
export const TRUCK_STEP = cues.truckStep;
export const SINK = cues.sink as [number, number];
export const HELI_FUEL = cues.heliFuel as [number, number];
export const STALL = cues.stall;
export const LAND = cues.land;
export const WALL_LBL = cues.wallLbl;
export const WALL_Q = cues.wallQ;
export const SLIPPER_LBL = cues.slipperLbl;
export const MOON_LEAVE = cues.moonLeave;
export const ZOOM = cues.zoom as [number, number];
export const REVEAL = cues.reveal;
export const NO = cues.no;
export const PASS = cues.pass as [number, number];
export const BAR = cues.bar as [number, number];
export const ERROR = cues.error;
export const CLICK = cues.click;
export const HL3 = cues.hl3;
