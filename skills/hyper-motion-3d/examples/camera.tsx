import {useThree} from '@react-three/fiber';
import {useLayoutEffect, type ReactNode} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {PerspectiveCamera, Vector3} from 'three';
import {clamp, lerp, smoothstep as smooth, type Vec3} from './math';

export type {Vec3} from './math';
export type CameraShot = {
  frame: number;
  position: Vec3;
  target: Vec3;
  /** Vertical field of view in degrees. */
  fov?: number;
  roll?: number;
  /** Incoming segment. `cut` holds the previous shot until this frame. */
  ease?: 'linear' | 'smooth' | 'spline';
  cut?: boolean;
  orbit?: true | 'clockwise' | 'counterclockwise';
  /** Preserve the subject size from the previous key during this segment. */
  dollyZoom?: boolean;
  /** A distance along the lens axis, or a world-space marker. */
  focus?: number | Vec3;
};

export type CameraAccent = {
  kind: 'shake' | 'punch' | 'whip';
  frame: number;
  duration: number;
  /** Multiplier for the bounded displacement or angle. */
  strength: number;
  direction?: 1 | -1;
};

export type CameraSample = {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  roll: number;
  focusDistance: number;
};

export type CameraTrack = {
  shots: readonly CameraShot[];
  accents?: readonly CameraAccent[];
  intensity?: number;
  /** Add a frame-sampled world anchor to the authored positions and targets. */
  sampleTarget?: (frame: number) => Vec3;
  /** Optionally rack focus independently of the target and tracking anchor. */
  sampleFocus?: (frame: number) => Vec3;
  drift?: number;
};

const radians = Math.PI / 180;
const fullTurn = 2 * Math.PI;
const up = new Vector3(0, 1, 0);
const vector = (v: Vec3) => new Vector3(...v);
const span = (a: CameraShot, b: CameraShot) => Math.max(1, b.frame - a.frame);

function interpolateCoordinate(before: number, a: number, b: number, after: number,
  previousSpan: number, currentSpan: number, nextSpan: number, p: number) {
  // Time-weighted Hermite tangents keep speed continuous on unevenly spaced keys.
  const tangentA = (b - before) * currentSpan / (currentSpan + previousSpan);
  const tangentB = (after - a) * currentSpan / (currentSpan + nextSpan);
  const square = p * p;
  const cube = square * p;
  return (2 * cube - 3 * square + 1) * a + (cube - 2 * square + p) * tangentA
    + (-2 * cube + 3 * square) * b + (cube - square) * tangentB;
}

function interpolatePoint(shots: readonly CameraShot[], i: number, key: 'position' | 'target', p: number) {
  const a = shots[i];
  const b = shots[i + 1];
  if (b.ease !== 'spline') return vector(a[key]).lerp(vector(b[key]), p);
  const before = a.cut ? a : (shots[i - 1] ?? a);
  const after = shots[i + 2]?.cut ? b : (shots[i + 2] ?? b);
  const interpolateAxis = (axis: 0 | 1 | 2) => interpolateCoordinate(
    before[key][axis], a[key][axis], b[key][axis], after[key][axis],
    before === a ? Number.POSITIVE_INFINITY : span(before, a),
    span(a, b),
    after === b ? Number.POSITIVE_INFINITY : span(b, after), p,
  );
  return new Vector3(interpolateAxis(0), interpolateAxis(1), interpolateAxis(2));
}

function orbitPoint(a: CameraShot, b: CameraShot, target: Vector3, p: number) {
  const start = vector(a.position).sub(vector(a.target));
  const end = vector(b.position).sub(vector(b.target));
  const startYaw = Math.atan2(start.x, start.z);
  const endYaw = Math.atan2(end.x, end.z);
  let delta = ((endYaw - startYaw + Math.PI + fullTurn) % fullTurn) - Math.PI;
  if (b.orbit === 'clockwise' && delta > 0) delta -= fullTurn;
  if (b.orbit === 'counterclockwise' && delta < 0) delta += fullTurn;
  const yaw = startYaw + delta * p;
  const pitch = lerp(Math.atan2(start.y, Math.hypot(start.x, start.z)),
    Math.atan2(end.y, Math.hypot(end.x, end.z)), p);
  const distance = lerp(start.length(), end.length(), p);
  const radius = Math.cos(pitch) * distance;
  return target.clone().add(new Vector3(Math.sin(yaw) * radius, Math.sin(pitch) * distance, Math.cos(yaw) * radius));
}

function preservedFov(fov: number, fromDistance: number, toDistance: number) {
  const half = Math.tan(fov * radians / 2) * Math.max(0.01, fromDistance) / Math.max(0.01, toDistance);
  return clamp(2 * Math.atan(half) / radians, 8, 110);
}

function shotDistance(shot: CameraShot) {
  return vector(shot.position).distanceTo(vector(shot.target));
}

function keyFov(shots: readonly CameraShot[], i: number): number {
  const key = shots[i];
  if (i === 0 || key.cut || !key.dollyZoom) return clamp(key.fov ?? 38, 8, 110);
  return preservedFov(keyFov(shots, i - 1), shotDistance(shots[i - 1]), shotDistance(key));
}

function forwardOf(position: Vector3, target: Vector3) {
  const forward = target.clone().sub(position);
  return forward.lengthSq() > 0.0001 ? forward.normalize() : new Vector3(0, 0, -1);
}

function focusAt(focus: number | Vec3 | undefined, position: Vector3, target: Vector3,
  forward: Vector3, tracking: Vector3) {
  if (typeof focus === 'number') return focus;
  // Lens-axis depth matches a perspective depth buffer, including off-center subjects.
  return (focus ? vector(focus).add(tracking) : target.clone()).sub(position).dot(forward);
}

/** Frame sampling is independent of React, playback direction, and worker history. */
export function sampleCamera({frame, fps = 30, shots, accents = [], intensity = 1,
  sampleTarget, sampleFocus, drift = 0}: CameraTrack & {frame: number; fps?: number}): CameraSample {
  if (shots.length === 0) throw new Error('DynamicCamera needs at least one shot');
  let i = 0;
  while (i + 1 < shots.length && frame >= shots[i + 1].frame) i++;
  const a = shots[i];
  const b = shots[i + 1];
  const u = b && !b.cut ? clamp((frame - a.frame) / span(a, b), 0, 1) : 0;
  const p = b?.ease === 'linear' || b?.ease === 'spline' ? u : smooth(u);
  const target = b && p > 0 ? interpolatePoint(shots, i, 'target', p) : vector(a.target);
  let position = b && p > 0 ? interpolatePoint(shots, i, 'position', p) : vector(a.position);
  if (b?.orbit && p > 0) position = orbitPoint(a, b, target, p);

  let fov = keyFov(shots, i);
  if (b && p > 0) {
    fov = b.dollyZoom ? preservedFov(fov, shotDistance(a), position.distanceTo(target))
      : lerp(fov, keyFov(shots, i + 1), p);
  }
  let roll = lerp(a.roll ?? 0, b?.roll ?? 0, p);
  const tracking = sampleTarget ? vector(sampleTarget(frame)) : new Vector3();
  position.add(tracking);
  target.add(tracking);

  const forward = forwardOf(position, target);
  const right = forward.clone().cross(up);
  if (right.lengthSq() < 0.0001) right.set(1, 0, 0);
  else right.normalize();
  const vertical = right.clone().cross(forward);
  const seconds = frame / fps;
  const gain = clamp(intensity, 0, 2);
  const distance = Math.max(0.04, position.distanceTo(target));
  const secondary = clamp(drift * gain, 0, 2) * distance;
  position.addScaledVector(right, Math.sin(2 * seconds) * secondary * 0.008);
  position.addScaledVector(vertical, Math.sin(1.3 * seconds) * secondary * 0.006);

  let punch = 0;
  let yaw = 0;
  let sideways = 0;
  let upwards = 0;
  let shakeRoll = 0;
  for (const accent of accents) {
    const elapsed = frame - accent.frame;
    if (elapsed < 0 || elapsed >= accent.duration || accent.duration <= 1) continue;
    const progress = clamp(elapsed / (accent.duration - 1), 0, 1);
    const strength = clamp(accent.strength * gain, 0, 2);
    const envelope = Math.sin(Math.PI * progress) ** 2;
    const side = accent.direction ?? 1;
    if (accent.kind === 'punch') {
      const attack = 0.18;
      const envelope = progress < attack ? smooth(progress / attack)
        : 1 - smooth((progress - attack) / (1 - attack));
      punch += envelope * strength * side * 0.075;
    } else if (accent.kind === 'whip') {
      yaw += envelope * strength * side * 12;
    } else {
      const phase = 2 * Math.PI * elapsed / fps;
      sideways += Math.sin(phase * 5.1) * envelope * strength * 0.012;
      upwards += Math.sin(phase * 3.7) * envelope * strength * 0.009;
      shakeRoll += Math.sin(phase * 4.3) * envelope * strength * 0.45;
    }
  }
  position.addScaledVector(forward, distance * clamp(punch, -0.2, 0.2));
  position.addScaledVector(right, distance * clamp(sideways, -0.025, 0.025));
  position.addScaledVector(vertical, distance * clamp(upwards, -0.02, 0.02));
  roll += clamp(shakeRoll, -1.2, 1.2);
  if (yaw !== 0) {
    target.sub(position).applyAxisAngle(up, clamp(yaw, -28, 28) * radians).add(position);
  }
  if (target.distanceToSquared(position) < 0.0001) target.copy(position).add(forward);
  const finalForward = forwardOf(position, target);
  const firstFocus = focusAt(a.focus, position, target, finalForward, tracking);
  const focusDistance = sampleFocus ? vector(sampleFocus(frame)).sub(position).dot(finalForward)
    : lerp(firstFocus, focusAt(b?.focus, position, target, finalForward, tracking), p);

  return {position: position.toArray(), target: target.toArray(), fov, roll, focusDistance: Math.max(0.01, focusDistance)};
}

/** Mount one camera owner in a perspective ThreeCanvas. */
export function DynamicCamera({frame, renderFocus, ...track}: CameraTrack & {
  frame?: number;
  /** Render a deterministic depth-of-field pass or a focal diagnostic. */
  renderFocus?: (distance: number) => ReactNode;
}) {
  const currentFrame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const camera = useThree((state) => state.camera);
  const {position: [x, y, z], target: [tx, ty, tz], fov, roll, focusDistance} = sampleCamera({
    ...track, frame: frame ?? currentFrame, fps,
  });
  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) throw new Error('DynamicCamera requires a perspective ThreeCanvas');
    camera.position.set(x, y, z);
    camera.up.copy(up);
    camera.lookAt(tx, ty, tz);
    camera.rotateZ(roll * radians);
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
  }, [camera, x, y, z, tx, ty, tz, fov, roll]);
  return renderFocus?.(focusDistance) ?? null;
}
