import React from 'react';
import {random} from 'remotion';
import {Box, Cone, Cyl} from './parts';
import {T, ramp, worldTime} from '../timeline';

type V3 = [number, number, number];

export type WindowSpec = {x: number; y: number; w: number; h: number; door?: boolean};

type HouseProps = {
  id: string;
  position: V3;
  rotation?: number;
  size: V3; // width, wall height, depth
  wall?: string;
  roof?: string;
  windows: WindowSpec[];
  burstAt: number; // video time when the windows blow out
  v: number;
};

const G = 9.8;

// One window: bulges while the air inside pushes, then blows out into shards.
const Window: React.FC<{spec: WindowSpec; id: string; front: number; burstAt: number; v: number; floorY: number}> = ({
  spec,
  id,
  front,
  burstAt,
  v,
  floorY,
}) => {
  const {x, y, w, h, door} = spec;
  const frame = '#f6f5f2';
  const burst = v >= burstAt && v < T.airBack + 400;
  const bulge = v < burstAt && v > T.airGone ? ramp(v, burstAt - 1.6, burstAt, (t) => t * t) : 0;
  const shards = [];
  if (burst) {
    // Physical time since the glass broke (slow motion aware).
    const t = worldTime(v) - worldTime(burstAt);
    for (let i = 0; i < 9; i++) {
      const sx = x + (random(`${id}-sx-${i}`) - 0.5) * w * 0.9;
      const sy = y + (random(`${id}-sy-${i}`) - 0.5) * h * 0.9;
      const vOut = 4 + random(`${id}-vo-${i}`) * 4;
      const vSide = (random(`${id}-vs-${i}`) - 0.5) * 3;
      const vUp = random(`${id}-vu-${i}`) * 2.5;
      const height = sy - floorY;
      // Time when the shard lands: height + vUp t - g t^2 / 2 = 0
      const tLand = (vUp + Math.sqrt(vUp * vUp + 2 * G * Math.max(0.01, height))) / G;
      const tt = Math.min(t, tLand);
      const px = sx + vSide * tt;
      const py = sy + vUp * tt - 0.5 * G * tt * tt;
      const pz = front + 0.05 + vOut * tt;
      const spin = tt * (6 + random(`${id}-sp-${i}`) * 8);
      const size = 0.12 + random(`${id}-sz-${i}`) * 0.18;
      shards.push(
        <Cyl
          key={i}
          rTop={size}
          rBottom={size}
          height={0.015}
          segments={3}
          position={[px, Math.max(py, floorY + 0.02), pz]}
          rotation={t >= tLand ? [0, i, 0] : [spin + i, spin * 0.7, i]}
          color="#a9c3d3"
          shadow={false}
          opacity={0.9}
        />,
      );
    }
  }
  return (
    <group>
      {/* frame */}
      <Box size={[w + 0.16, 0.1, 0.08]} position={[x, y + h / 2 + 0.05, front + 0.02]} color={frame} />
      <Box size={[w + 0.16, 0.1, 0.08]} position={[x, y - h / 2 - 0.05, front + 0.02]} color={frame} />
      <Box size={[0.08, h, 0.08]} position={[x - w / 2 - 0.04, y, front + 0.02]} color={frame} />
      <Box size={[0.08, h, 0.08]} position={[x + w / 2 + 0.04, y, front + 0.02]} color={frame} />
      {!door ? (
        <>
          <Box size={[0.36, h + 0.1, 0.05]} position={[x - w / 2 - 0.32, y, front + 0.01]} color="#7f8fa0" />
          <Box size={[0.36, h + 0.1, 0.05]} position={[x + w / 2 + 0.32, y, front + 0.01]} color="#7f8fa0" />
        </>
      ) : null}
      {/* dark room behind the glass */}
      <Box size={[w, h, 0.006]} position={[x, y, front + 0.004]} color="#15181d" shadow={false} />
      {!burst ? (
        <Box
          size={[w, h, 0.02]}
          position={[x, y, front + 0.02 + bulge * 0.12]}
          scale={[1, 1, 1 + bulge * 6]}
          color="#2a3442"
          shadow={false}
        />
      ) : null}
      {shards}
    </group>
  );
};

export const House: React.FC<HouseProps> = ({
  id,
  position,
  rotation = 0,
  size,
  wall = '#ece6db',
  roof = '#c9a48b',
  windows,
  burstAt,
  v,
}) => {
  const [w, h, d] = size;
  const front = d / 2;
  const roofH = Math.min(w, d) * 0.38;
  // A 4-sided cone makes a hip roof; scale it to the house footprint.
  const side = Math.SQRT2;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box size={[w, h, d]} position={[0, h / 2, 0]} color={wall} />
      <group position={[0, h + roofH / 2, 0]} scale={[(w + 0.8) / side, 1, (d + 0.8) / side]}>
        <Cone radius={1} height={roofH} segments={4} rotation={[0, Math.PI / 4, 0]} color={roof} />
      </group>
      <Box size={[w + 0.3, 0.12, d + 0.3]} position={[0, h + 0.02, 0]} color="#d9cfc2" />
      {windows.map((s, i) => (
        <Window key={i} spec={s} id={`${id}-${i}`} front={front} burstAt={burstAt + i * 0.07} v={v} floorY={0} />
      ))}
    </group>
  );
};
