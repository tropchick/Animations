import {V3} from './cues';

// The endless store, laid out on a grid. y is up, the main aisle runs along z (x in -2..2), the entrance is at +z.
// Showroom rooms (8 x 8 m, open to the main aisle) line both sides of it, then a side aisle, then warehouse racks.
// Everything static is a list of axis-aligned boxes drawn with a few instanced meshes (see Store.tsx).

export type B = {p: V3; s: V3; c: string};

export const CEIL = 7;
export const ENTRANCE_Z = 28; // the glass front, gone after the turn
export const Z_MIN = -236;
export const Z_BEYOND = 64; // how far the store goes on past the entrance once the entrance is gone
export const ROOM = 8;
// cross aisles cut through the rooms and the racks at these z (each one room wide)
export const CROSS = [-36, -116, -196];
export const RACK_X0 = 13.6;
export const RACK_STEP = 4;
export const RACK_ROWS = 6;
export const RACK_H = 4.2;
// columns along both edges of the main aisle
export const COLUMN_X = 2.35;
export const columnZ = (k: number) => 20 - 24 * k;

let seed = 3008;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length) % a.length];

const WALLS = ['#d8d2c4', '#b8c3c6', '#cdbba6', '#a3b3a8', '#d9cba1', '#a9b6c6', '#c9c4bc', '#b7a99a'];
const FABRIC = ['#5b6f86', '#8a9a73', '#b4a48a', '#7d5f58', '#4d5b5f', '#a98e5c', '#6f7d8c', '#93836f'];
const WOOD = ['#c9a77c', '#b08a5e', '#e0c9a3', '#8e6b4b'];
const WHITE = ['#e9e6df', '#dedad2', '#f0ede6'];
const BOXES = ['#b98f5e', '#a8804f', '#c49d6b', '#9c7a52', '#d0ae7c'];

export type RoomType = 'living' | 'bedroom' | 'kitchen' | 'office' | 'dining' | 'fortroom' | 'paroom';

// a room on side s (1 = +x, -1 = -x) with its centre at z = cz. Local xp points away from the aisle (0 at the room
// centre, the open front at xp = -4, the back wall at +4); local zp runs along the store.
export const room = (type: RoomType, s: 1 | -1, cz: number, out: B[], opts: {wall?: string} = {}) => {
  const cx = 6 * s;
  const L = (xp: number, y: number, zp: number, sx: number, sy: number, sz: number, c: string) =>
    out.push({p: [cx + s * xp, y, cz + zp], s: [sx, sy, sz], c});
  const wall = opts.wall ?? pick(WALLS);
  // back wall and one side wall (the next room's wall closes the other side); the side wall stops at the back wall
  L(4.0, 1.35, 0, 0.12, 2.7, ROOM, wall);
  L(1.22, 1.35, -3.94, 5.44, 2.7, 0.12, wall);
  // a skirting strip on the back wall, a touch proud of it
  L(3.925, 0.05, 0, 0.03, 0.1, ROOM - 0.24, '#e6e2da');
  const fab = pick(FABRIC);
  const wood = pick(WOOD);
  const white = pick(WHITE);
  const rug = (xp: number, zp: number, w: number, d: number) => L(xp, 0.006, zp, w, 0.012, d, pick(['#c7bba5', '#8c8f97', '#a39079', '#6e7a74']));
  const table = (xp: number, zp: number, w: number, d: number, h: number, c: string) => {
    L(xp, h - 0.025, zp, w, 0.05, d, c);
    for (const a of [-1, 1]) for (const b of [-1, 1]) L(xp + a * (w / 2 - 0.06), (h - 0.05) / 2, zp + b * (d / 2 - 0.06), 0.05, h - 0.05, 0.05, c);
  };
  const chair = (xp: number, zp: number, face: number, c: string) => {
    L(xp, 0.45, zp, 0.42, 0.05, 0.42, c);
    for (const a of [-1, 1]) for (const b of [-1, 1]) L(xp + a * 0.17, 0.215, zp + b * 0.17, 0.035, 0.43, 0.035, c);
    L(xp + face * 0.19, 0.72, zp, 0.04, 0.5, 0.4, c);
  };
  const shelf = (xp: number, zp: number, w: number, h: number) => {
    // a bookcase against the side wall, its back 2.5 cm off the wall
    for (const a of [-1, 1]) L(xp + a * (w / 2 - 0.015), h / 2, zp, 0.03, h, 0.34, white);
    for (let k = 0; k <= 4; k++) L(xp, 0.04 + (k * (h - 0.06)) / 4, zp, w - 0.06, 0.025, 0.32, white);
    for (let k = 0; k < 4; k++) {
      let x = xp - w / 2 + 0.06;
      while (x < xp + w / 2 - 0.2) {
        const bw = 0.08 + rnd() * 0.25;
        if (rnd() < 0.7) L(x + bw / 2, 0.06 + (k * (h - 0.06)) / 4 + 0.11, zp + 0.02, bw - 0.01, 0.2 + rnd() * 0.08, 0.24, pick([...FABRIC, ...WOOD, ...BOXES]));
        x += bw + 0.02;
      }
    }
  };
  const sofa = (xp: number, zp: number, len: number, c: string) => {
    L(xp, 0.22, zp, 0.9, 0.26, len, c);
    L(xp + 0.35, 0.62, zp, 0.2, 0.58, len, c);
    for (const a of [-1, 1]) L(xp, 0.45, zp + a * (len / 2 + 0.09), 0.92, 0.48, 0.18, c);
    for (const a of [-1, 1]) L(xp - 0.06, 0.41, zp + a * (len / 4 - 0.01), 0.72, 0.12, len / 2 - 0.06, c);
    L(xp + 0.18, 0.62, zp - len / 4, 0.18, 0.36, 0.42, pick(FABRIC));
  };
  const lamp = (xp: number, zp: number) => {
    L(xp, 0.02, zp, 0.3, 0.04, 0.3, '#333');
    L(xp, 0.8, zp, 0.03, 1.55, 0.03, '#333');
    L(xp, 1.62, zp, 0.36, 0.3, 0.36, '#efe6cf');
  };
  const wardrobe = (xp: number, zp: number, w: number, c: string) => {
    L(xp, 1.05, zp, w, 2.1, 0.6, c);
    for (let k = 1; k < Math.round(w / 0.5); k++) L(xp - w / 2 + k * (w / Math.round(w / 0.5)), 1.06, zp + 0.305, 0.012, 1.94, 0.012, '#8d8a84');
    L(xp - 0.06, 1.1, zp + 0.31, 0.02, 0.2, 0.02, '#777');
    L(xp + 0.06, 1.1, zp + 0.31, 0.02, 0.2, 0.02, '#777');
  };
  const bed = () => {
    L(2.9, 0.18, 0, 2.06, 0.28, 1.66, wood);
    L(2.92, 0.41, 0, 1.94, 0.18, 1.54, '#ece9e2');
    L(2.68, 0.515, 0, 1.5, 0.05, 1.62, fab);
    for (const a of [-1, 1]) L(3.58, 0.56, a * 0.38, 0.32, 0.12, 0.62, '#f2f0ea');
    L(3.88, 0.62, 0, 0.08, 1.2, 1.74, wood);
    for (const a of [-1, 1]) {
      L(3.62, 0.25, a * 1.18, 0.44, 0.5, 0.44, white);
      L(3.62, 0.62, a * 1.18, 0.18, 0.24, 0.18, '#efe6cf');
    }
    rug(2.4, 0, 2.6, 2.4);
  };
  if (type === 'living' || type === 'paroom') {
    if (type === 'living') sofa(3.3, 0.4, 2.3, fab);
    rug(2.0, 0.4, 2.4, 3.0);
    table(1.9, 0.4, 0.6, 1.1, 0.42, wood);
    lamp(3.4, -2.3);
    shelf(1.9, -3.65, 1.6, 1.9);
    L(3.6, 0.25, 3.0, 0.45, 0.5, 1.6, white);
    L(3.65, 0.82, 3.0, 0.08, 0.62, 1.1, '#1b1d20');
    chair(1.2, 2.6, 1, fab);
  } else if (type === 'bedroom' || type === 'fortroom') {
    bed();
    if (type === 'bedroom') {
      wardrobe(0.6, -3.55, 1.6, white);
      wardrobe(2.4, -3.55, 1.6, white);
      chair(0.4, 2.8, 1, wood);
    }
  } else if (type === 'kitchen') {
    L(3.6, 0.45, 0, 0.6, 0.9, 5.0, white);
    L(3.6, 0.92, 0, 0.64, 0.04, 5.04, wood);
    L(3.72, 1.92, 0, 0.36, 0.72, 5.0, white);
    for (let k = 0; k < 8; k++) L(3.295, 0.46, -2.5 + 0.3125 + k * 0.625, 0.012, 0.8, 0.01, '#9e9a92');
    L(3.6, 1.05, 3.05, 0.66, 2.1, 0.8, '#d7d7d4');
    L(3.6, 0.94, -1.2, 0.5, 0.012, 0.6, '#9aa0a6');
    table(1.4, 0, 0.9, 1.4, 0.74, wood);
    chair(0.7, -0.4, -1, wood);
    chair(0.7, 0.4, -1, wood);
    chair(2.1, -0.4, 1, wood);
    chair(2.1, 0.4, 1, wood);
  } else if (type === 'office') {
    table(3.2, 0, 0.75, 1.6, 0.74, white);
    L(3.45, 1.0, 0, 0.06, 0.4, 0.6, '#1b1d20');
    chair(2.5, 0, -1, '#2e3236');
    shelf(1.6, -3.65, 1.8, 1.9);
    shelf(3.3, -3.65, 1.2, 1.2);
    L(0.9, 0.36, 2.8, 0.5, 0.72, 0.9, wood);
    lamp(1.0, 1.8);
  } else if (type === 'dining') {
    rug(1.8, 0, 2.8, 2.8);
    table(1.8, 0, 1.0, 1.8, 0.75, wood);
    for (const b of [-0.5, 0.3]) {
      chair(1.05, b, -1, fab);
      chair(2.55, b, 1, fab);
    }
    L(3.68, 0.45, 0, 0.45, 0.9, 2.4, white);
    L(3.68, 1.45, -2.6, 0.45, 2.9, 0.9, white);
  }
};

const roomZ = (j: number) => 20 - ROOM * j;
const TYPES: RoomType[] = ['living', 'bedroom', 'kitchen', 'office', 'dining'];
const isCross = (z: number) => CROSS.some((c) => Math.abs(z - c) < 0.1);

// Rooms with something happening in them are drawn as hero sets instead.
export const PA_ROOM = {s: -1 as const, z: roomZ(10)}; // z -60, Ben on the sofa at 21:58
export const FORT_ROOM = {s: 1 as const, z: roomZ(24)}; // z -172, the wardrobe fort
export const FORT: V3 = [6, 0, FORT_ROOM.z - 0.4];

const racks = (x: number, z0: number, z1: number, out: B[]) => {
  const bay = 2.8;
  const n = Math.floor((z1 - z0) / bay);
  const levels = [0.15, 1.45, 2.75, 4.05];
  for (let k = 0; k <= n; k++) {
    const z = z0 + k * bay;
    for (const a of [-1, 1]) out.push({p: [x + a * 0.55, RACK_H / 2, z], s: [0.08, RACK_H, 0.08], c: '#41566e'});
    if (k === n) break;
    const zc = z + bay / 2;
    for (const y of levels) {
      for (const a of [-1, 1]) out.push({p: [x + a * 0.55, y, zc], s: [0.06, 0.1, bay - 0.08], c: '#b98d3a'});
      if (y > 4) continue;
      out.push({p: [x, y + 0.055, zc], s: [1.1, 0.012, bay - 0.1], c: '#8b7a62'});
      let zz = z + 0.1;
      while (zz < z + bay - 0.4) {
        const w = 0.45 + rnd() * 0.7;
        const h = 0.3 + rnd() * (y < 1 ? 0.9 : 0.75);
        const d = 0.6 + rnd() * 0.4;
        if (zz + w > z + bay - 0.08) break;
        if (rnd() < 0.85) out.push({p: [x + (rnd() - 0.5) * 0.12, y + 0.062 + h / 2, zz + w / 2], s: [d, h, w - 0.03], c: pick(BOXES)});
        zz += w + 0.04;
      }
    }
  }
};

// Static boxes, split into z blocks so each block can be culled on its own.
export const BLOCK = 32;
const build = (zFrom: number, zTo: number, roomsFrom: number, roomsTo: number) => {
  const out: B[] = [];
  for (let j = roomsFrom; j <= roomsTo; j++) {
    const z = roomZ(j);
    if (isCross(z)) continue;
    for (const s of [-1, 1] as const) {
      if (s === PA_ROOM.s && z === PA_ROOM.z) room('paroom', s, z, out);
      else if (s === FORT_ROOM.s && z === FORT_ROOM.z) room('fortroom', s, z, out);
      else room(pick(TYPES), s, z, out);
    }
  }
  for (const s of [-1, 1]) {
    for (let i = 0; i < RACK_ROWS; i++) {
      const x = s * (RACK_X0 + i * RACK_STEP);
      let z0 = zFrom;
      for (const c of [...CROSS].sort((a, b) => a - b)) {
        if (c - 4 > z0 && c - 4 < zTo) {
          racks(x, z0, c - 4, out);
          z0 = c + 4;
        }
      }
      racks(x, z0, zTo, out);
    }
  }
  // columns along the main aisle, up to the ceiling
  for (let k = 0; columnZ(k) > zFrom; k++) {
    const z = columnZ(k);
    if (z > zTo) continue;
    for (const s of [-1, 1]) out.push({p: [s * COLUMN_X, CEIL / 2, z], s: [0.5, CEIL, 0.5], c: '#a19d93'});
  }
  return out;
};

const blocks = (all: B[]) => {
  const m = new Map<number, B[]>();
  for (const b of all) {
    const k = Math.floor(b.p[2] / BLOCK);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(b);
  }
  return [...m.values()];
};

// inside the store up to the entrance, and the part that appears behind Ben once the entrance is gone
export const STORE = blocks(build(Z_MIN, ENTRANCE_Z - 0.2, 0, 32));
seed = 77;
const beyond: B[] = [];
// (the first ring of rooms is left out: the living room that replaces the doors stands there)
for (let j = 2; j <= 4; j++) for (const s of [-1, 1] as const) room(pick(TYPES), s, 20 + ROOM * j + 4, beyond);
for (const s of [-1, 1]) for (let i = 0; i < RACK_ROWS; i++) racks(s * (RACK_X0 + i * RACK_STEP), ENTRANCE_Z - 0.2, Z_BEYOND, beyond);
export const BEYOND = blocks(beyond);

// ceiling lights: rows across the store every 4 m, one panel over each aisle line every 4 m in x
export const LAMP_ROWS: number[] = [];
for (let z = 22; z > Z_MIN; z -= 4) LAMP_ROWS.push(z);
export const LAMP_ROWS_BEYOND: number[] = [];
for (let z = 30; z < Z_BEYOND; z += 4) LAMP_ROWS_BEYOND.push(z);
export const LAMP_X: number[] = [];
for (let x = -36; x <= 36; x += 4) LAMP_X.push(x);
