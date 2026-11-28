import type {ThreeElements} from '@react-three/fiber';
import {BoxGeometry, ExtrudeGeometry, Shape, type BufferGeometry} from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {toyboxQuality, type ToyboxQuality} from './theme';

export type ToySize = readonly [number, number, number];
export type ToyPoint = readonly [number, number];

const roundedBoxes = new Map<string, BufferGeometry>();
const extrusions = new Map<string, ExtrudeGeometry>();

/** Shared by profile and dimensions. The caller owns transforms and never edits the shared geometry. */
export function getRoundedBox(size: ToySize, radius = 0.1, segments = 2): BufferGeometry {
  const [w, h, d] = size;
  const bevel = Math.max(0, Math.min(radius, Math.min(w, h, d) * 0.49));
  const key = `${w}/${h}/${d}/${bevel}/${segments}`;
  let geometry = roundedBoxes.get(key);
  if (!geometry) {
    geometry = bevel > 0
      ? mergeVertices(new RoundedBoxGeometry(w, h, d, segments, bevel), 1e-6)
      : new BoxGeometry(w, h, d);
    roundedBoxes.set(key, geometry);
  }
  return geometry;
}

export function ToyBox({
  size,
  radius,
  quality = 'balanced',
  ...mesh
}: Omit<ThreeElements['mesh'], 'geometry'> & {
  size: ToySize;
  radius?: number;
  quality?: ToyboxQuality;
}) {
  const geometry = getRoundedBox(size, radius, toyboxQuality[quality].bevelSegments);
  return <mesh geometry={geometry} {...mesh} dispose={null} />;
}

/** Build a beveled panel from a simple, ordered XY polygon. Z is centered on its nominal extrusion. */
export function getToyExtrusion(
  points: readonly ToyPoint[],
  depth: number,
  bevel = 0.035,
  segments = 2,
): ExtrudeGeometry {
  if (points.length < 3) throw new Error('Toy extrusion requires at least three ordered XY points.');
  const key = JSON.stringify([points, depth, bevel, segments]);
  let geometry = extrusions.get(key);
  if (!geometry) {
    const shape = new Shape();
    const [start, ...rest] = points;
    shape.moveTo(...start);
    rest.forEach((point) => shape.lineTo(...point));
    shape.closePath();
    geometry = new ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: bevel > 0,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: segments,
      steps: 1,
    });
    geometry.translate(0, 0, -depth / 2);
    extrusions.set(key, geometry);
  }
  return geometry;
}

export function ToyExtrusion({
  points,
  depth,
  bevel,
  quality = 'balanced',
  ...mesh
}: Omit<ThreeElements['mesh'], 'geometry'> & {
  points: readonly ToyPoint[];
  depth: number;
  bevel?: number;
  quality?: ToyboxQuality;
}) {
  const geometry = getToyExtrusion(points, depth, bevel, toyboxQuality[quality].bevelSegments);
  return <mesh geometry={geometry} {...mesh} dispose={null} />;
}
