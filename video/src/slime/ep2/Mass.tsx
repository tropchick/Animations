import React, {useMemo} from 'react';
import {random} from 'remotion';
import {BufferAttribute, PlaneGeometry} from 'three';
import {V3} from '../cues';
import {Cyl, Mat, Material, RUBBER} from '../parts';
import {MASS} from '../Hall';

// The grey mass: a smooth faceted skin whose small facets shiver, so the light runs over it.
// height(x, z) gives the surface in local coordinates; below 0 means "no mass here" (the skin dives under the floor).
export const MassField: React.FC<{
  size: [number, number];
  seg: [number, number];
  height: (x: number, z: number) => number;
  v: number;
  ripple?: number;
  jitter?: number;
  position?: V3;
  m?: Mat;
  shadow?: boolean;
  id: string;
}> = ({size, seg, height, v, ripple = 0.004, jitter = 0.3, position, m = MASS, shadow = false, id}) => {
  const {geo, base, phase} = useMemo(() => {
    const g = new PlaneGeometry(size[0], size[1], seg[0], seg[1]);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as BufferAttribute;
    const cell = Math.min(size[0] / seg[0], size[1] / seg[1]);
    const b = new Float32Array(pos.count);
    const ph = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + (random(`${id}-jx-${i}`) - 0.5) * cell * jitter;
      const z = pos.getZ(i) + (random(`${id}-jz-${i}`) - 0.5) * cell * jitter;
      pos.setX(i, x);
      pos.setZ(i, z);
      const h = height(x, z);
      b[i] = h < 0 ? -0.12 : h + random(`${id}-jy-${i}`) * cell * 0.08;
      ph[i] = random(`${id}-ph-${i}`) * Math.PI * 2;
    }
    return {geo: g, base: b, phase: ph};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useMemo(() => {
    const pos = geo.attributes.position as BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const y = base[i];
      pos.setY(i, y < -0.1 ? y : y + ripple * Math.sin(v * 2.2 + phase[i]) * (0.6 + 0.4 * Math.sin(v * 0.7 + phase[i] * 3)));
    }
    pos.needsUpdate = true;
  }, [geo, base, phase, v, ripple]);
  return (
    <mesh geometry={geo} position={position} receiveShadow castShadow={shadow}>
      <Material m={m} />
    </mesh>
  );
};

// a rounded dome over a rectangle-ish footprint, for building-sized mounds
export const mound = (x: number, z: number, cx: number, cz: number, rx: number, rz: number, h: number) => {
  const q = ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2;
  return q < 1 ? h * Math.pow(1 - q, 0.75) : 0;
};

// wobbly outline: 1 near the centre, 0 outside r (with a few lobes)
export const blob = (x: number, z: number, cx: number, cz: number, r: number) => {
  const a = Math.atan2(z - cz, x - cx);
  const rr = r * (0.88 + 0.08 * Math.sin(a * 3 + 1.3) + 0.04 * Math.sin(a * 7 + 0.4));
  return Math.hypot(x - cx, z - cz) / rr;
};

// the mass climbing a leg or a pillar: a short faceted cone
export const Collar: React.FC<{position: V3; r: number; h: number; spread?: number; seg?: number; scale?: V3}> = ({
  position,
  r,
  h,
  spread = 1.4,
  seg = 9,
  scale,
}) => (
  <group position={position} scale={scale}>
    <Cyl r={r} r2={r + h * spread} h={h} seg={seg} position={[0, h / 2, 0]} m={MASS} shadow={false} />
  </group>
);

// the lamp's cable, the only thing left of the desk
export const LampWire: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <Cyl r={0.006} h={0.22} seg={5} position={[0, 0.1, 0]} rotation={[0.25, 0, 0.15]} m={RUBBER} />
    <group position={[-0.03, 0.2, 0.05]} rotation={[0.9, 0, 0.5]}>
      <Cyl r={0.006} h={0.16} seg={5} position={[0, 0.07, 0]} m={RUBBER} />
      <Cyl r={0.01} h={0.03} seg={6} position={[0, 0.16, 0]} m={{color: '#c9ccd0', metal: 0.3, rough: 0.5}} />
    </group>
  </group>
);
