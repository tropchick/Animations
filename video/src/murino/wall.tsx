import React from 'react';
import {Box, Mat} from '../slime/parts';
import {PAINT_HIGH, PAINT_LOW} from '../last/parts';
import {V3} from './cues';

// The Soviet painted wall of ../last/parts, with the dark line between the paints stopping 3 mm short of
// the wall's ends, so its end faces never lie in the plane of a door jamb (the z-check caught that).
const LINE: Mat = {color: '#2f3d33', rough: 0.6};
export const PaintedWall: React.FC<{x0: number; x1: number; z: number; t?: number; y0?: number; y1?: number; split?: number; rot?: number; pos?: V3}> = ({
  x0,
  x1,
  z,
  t = 0.2,
  y0 = 0,
  y1 = 2.7,
  split = 1.5,
  rot = 0,
  pos = [0, 0, 0],
}) => {
  const w = x1 - x0;
  const cx = (x0 + x1) / 2;
  const lo = Math.max(y0, Math.min(split, y1));
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {lo > y0 ? <Box size={[w, lo - y0, t]} position={[cx, (y0 + lo) / 2, z]} m={PAINT_LOW} /> : null}
      {y1 > lo ? <Box size={[w, y1 - lo, t]} position={[cx, (lo + y1) / 2, z]} m={PAINT_HIGH} /> : null}
      {split > y0 && split < y1 ? <Box size={[w - 0.006, 0.02, t + 0.012]} position={[cx, split, z]} m={LINE} shadow={false} /> : null}
    </group>
  );
};
