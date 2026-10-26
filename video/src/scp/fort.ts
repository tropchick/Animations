import {SLIDES, SLIDE_LEN, V3, lerp, ramp, smooth} from './cues';
import {FORT} from './store';

// Four double wardrobes (1.6 x 0.6 m) in a pinwheel round a 1 m square, doors facing in.
// Wardrobe 1 (west, towards the main aisle) is pushed 10 cm along, so the corner between 0 and 1 leaves a slit
// wide enough to see the aisle through. It is the one that gets knocked on.
const ROT = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
const LOCAL: [number, number][] = [
  [-0.3, -0.86],
  [-0.3 - 0.1, -0.86],
  [-0.3, -0.86],
  [-0.3, -0.86],
];

const rotate = ([x, z]: [number, number], a: number): [number, number] => [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)];

export const WARDROBES = ROT.map((a, k) => {
  const [x, z] = rotate(LOCAL[k], a);
  const out = rotate([0, -1], a); // the back of the wardrobe points away from the centre
  return {k, rotation: a, end: [FORT[0] + x, 0, FORT[2] + z] as V3, out: [out[0], out[1]] as [number, number]};
});

// where each wardrobe stood in the bedroom before Ben dragged it over: further out and turned a little
const START_OFF: [number, number, number][] = [
  [-1.4, -1.6, 0.5],
  [-0.2, 2.6, -0.4],
  [1.1, 2.0, 0.35],
  [1.6, -1.2, -0.5],
];

export const wardrobeAt = (k: number, v: number) => {
  const w = WARDROBES[k];
  const p = smooth(ramp(v, SLIDES[k], SLIDES[k] + SLIDE_LEN));
  const [dx, dz, dr] = START_OFF[k];
  return {
    position: [lerp(w.end[0] + dx, w.end[0], p), 0, lerp(w.end[2] + dz, w.end[2], p)] as V3,
    rotation: w.rotation + dr * (1 - p),
    moving: p > 0 && p < 1,
    p,
  };
};

// the slit between wardrobes 0 and 1: its middle, on the inside and the outside
export const SLIT_IN: V3 = [FORT[0] - 0.45, 0, FORT[2] - 0.48];
export const SLIT_OUT: V3 = [FORT[0] - 1.25, 0, FORT[2] - 0.48];
