import {PerspectiveCamera, Vector3} from 'three';
import {clamp, smoothstep, type Vec3} from './math';
import {type CameraSample, type MappedCameraSample} from './camera';

export type ScaleBand = Readonly<{
  id: string;
  from: number;
  /** The authored world point that becomes the local origin. */
  origin: Vec3;
  worldUnitsPerUnit: number;
  /** Clipping distances in the normalized band. */
  near: number;
  far: number;
  anchor?: string;
}>;
export type ScreenPoint = readonly [number, number];
export type ProjectedAnchor = Readonly<{screen: ScreenPoint; depth: number; visible: boolean}>;

const point = (input: Vec3) => new Vector3(...input);
const RAD = Math.PI / 180;

/** Output frame → scale band. Band starts are inclusive; shot order may revisit a scale. */
export function compileScaleLadder(bands: readonly ScaleBand[]): (frame: number) => ScaleBand {
  if (bands.length === 0) throw new RangeError('A scale ladder needs at least one band');
  const ids = new Set<string>();
  const copy = [...bands].sort((a, b) => a.from - b.from).map((band, index, all) => {
    if (!band.id || ids.has(band.id) || band.from === all[index - 1]?.from || band.from < 0
        || ![band.from, band.worldUnitsPerUnit, band.near, band.far, ...band.origin].every(Number.isFinite)
        || band.worldUnitsPerUnit <= 0 || band.near <= 0 || band.far <= band.near) {
      throw new RangeError(`Invalid scale band: ${band.id}`);
    }
    ids.add(band.id);
    return Object.freeze({...band, origin: Object.freeze([...band.origin] as [number, number, number])});
  });
  return (frame) => {
    let index = copy.length - 1;
    while (index > 0 && frame < copy[index].from) index--;
    return copy[index];
  };
}

export function toBandPoint([x, y, z]: Vec3, band: ScaleBand): [number, number, number] {
  const [ox, oy, oz] = band.origin;
  const units = band.worldUnitsPerUnit;
  return [(x - ox) / units, (y - oy) / units, (z - oz) / units];
}

export function fromBandPoint([x, y, z]: Vec3, band: ScaleBand): [number, number, number] {
  const [ox, oy, oz] = band.origin;
  const units = band.worldUnitsPerUnit;
  return [x * units + ox, y * units + oy, z * units + oz];
}

/** Placement for a group whose JSX geometry uses authored world coordinates. */
export function bandPlacement(band: ScaleBand) {
  return {position: toBandPoint([0, 0, 0], band), scale: 1 / band.worldUnitsPerUnit};
}

/** Rescale scene geometry, camera position, target, focus and fog together. FOV remains angular. */
export function toBandCamera(sample: CameraSample, band: ScaleBand): MappedCameraSample {
  return {...sample, position: toBandPoint(sample.position, band), target: toBandPoint(sample.target, band),
    focusDistance: sample.focusDistance / band.worldUnitsPerUnit, near: band.near, far: band.far};
}

function optics(sample: CameraSample, aspect: number) {
  if (!(aspect > 0) || !Number.isFinite(aspect)) throw new RangeError('Projection needs a positive aspect ratio');
  const clip = sample as CameraSample & Partial<Pick<ScaleBand, 'near' | 'far'>>;
  const camera = new PerspectiveCamera(sample.fov, aspect, clip.near ?? 0.01, clip.far ?? 1000);
  camera.position.set(...sample.position);
  camera.lookAt(...sample.target);
  camera.rotateZ(sample.roll * RAD);
  camera.updateMatrixWorld();
  return camera;
}

/** Normalized screen points use top-left origin. Width and height come from the actual composition. */
export function projectScaleAnchor(anchor: Vec3, sample: CameraSample, aspect: number): ProjectedAnchor {
  const camera = optics(sample, aspect);
  const depth = -point(anchor).applyMatrix4(camera.matrixWorldInverse).z;
  const projected = point(anchor).project(camera);
  const screen: ScreenPoint = [(1 + projected.x) / 2, (1 - projected.y) / 2];
  return {screen, depth, visible: depth >= camera.near && depth <= camera.far
    && screen.every((axis) => Number.isFinite(axis) && axis >= 0 && axis <= 1)};
}

/** Slide the camera in its lens plane while preserving heading and focal distance. */
export function reseatScaleAnchor<T extends CameraSample>(sample: T, anchor: Vec3, wanted: ScreenPoint,
  aspect: number, weight = 1, maxTranslation = Infinity): T {
  const camera = optics(sample, aspect);
  const view = point(anchor).applyMatrix4(camera.matrixWorldInverse);
  const depth = -view.z;
  if (depth <= camera.near) return sample;
  const halfHeight = depth * Math.tan(sample.fov * RAD / 2);
  const x = view.x - (2 * wanted[0] - 1) * halfHeight * aspect;
  const y = view.y - (1 - 2 * wanted[1]) * halfHeight;
  const delta = new Vector3(x, y, 0).applyQuaternion(camera.quaternion)
    .clampLength(0, Math.max(0, maxTranslation)).multiplyScalar(clamp(weight));
  return {...sample, position: point(sample.position).add(delta).toArray(),
    target: point(sample.target).add(delta).toArray()};
}

/** Eased mix between two authored representations. Gate or mask silhouettes at the swap. */
export function sampleLodMix(frame: number, cut: number, halfWindow: number) {
  if (halfWindow <= 0) return frame < cut ? 0 : 1;
  return smoothstep((frame - cut + halfWindow) / (2 * halfWindow));
}
