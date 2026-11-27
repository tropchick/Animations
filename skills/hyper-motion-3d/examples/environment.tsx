import React, {type ReactNode} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Color} from 'three';
import {clamp, lerp, sampleRandom, smoothstep, type Vec3} from './math';

type RouteSegment = {from: Vec3; to: Vec3; start: number; length: number};
export type Route = {segments: readonly RouteSegment[]; length: number; closed: boolean};
const wrap = (position: number, length: number) => ((position % length) + length) % length;

/** Build once at module scope or memoize when the path data changes. */
export function prepareRoute(points: readonly Vec3[], {closed = true} = {}): Route {
  const segments: RouteSegment[] = [];
  let length = 0;
  const count = closed ? points.length : points.length - 1;
  for (let i = 0; i < count; i++) {
    const from = points[i];
    const to = points[(i + 1) % points.length];
    const distance = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
    if (distance < 0.00001) continue;
    segments.push({from, to, length: distance, start: length});
    length += distance;
  }
  if (length === 0) throw new Error('A route needs at least two distinct points');
  return {segments, length, closed};
}

function pointOnRoute(route: Route, distance: number) {
  const at = route.closed ? wrap(distance, route.length) : clamp(distance, 0, route.length);
  const segment = route.segments.find((item) => item.start + item.length > at)
    ?? route.segments[route.segments.length - 1];
  const p = (at - segment.start) / segment.length;
  const {from, to} = segment;
  const position: [number, number, number] = [lerp(from[0], to[0], p), lerp(from[1], to[1], p), lerp(from[2], to[2], p)];
  return {position, segment};
}

export function loopRoute({route, frame, fps = 30, speed, phase = 0, turnDistance = 0.25}: {
  route: Route;
  frame: number;
  fps?: number;
  /** World units/second. Negative speed runs the path in reverse. */
  speed: number;
  /** Initial distance in world units. */
  phase?: number;
  /** Heading is sampled on both sides of a corner over this distance. */
  turnDistance?: number;
}) {
  const at = phase + frame * speed / fps;
  const {position, segment} = pointOnRoute(route, at);
  const window = clamp(turnDistance, 0, route.length / 4);
  const before = pointOnRoute(route, at - window).position;
  const after = pointOnRoute(route, at + window).position;
  let dx = after[0] - before[0];
  let dz = after[2] - before[2];
  if (Math.abs(dx) + Math.abs(dz) < 0.00001) {
    dx = segment.to[0] - segment.from[0];
    dz = segment.to[2] - segment.from[2];
  }
  return {position, yaw: Math.atan2(dx, dz) + (speed < 0 ? Math.PI : 0), distance: at};
}

export function RouteFollower({frame, route, speed, phase, turnDistance, children, yawOffset = 0}: {
  frame?: number;
  route: Route;
  speed: number;
  phase?: number;
  turnDistance?: number;
  /** Direction the model faces in its neutral pose. The default is +Z. */
  yawOffset?: number;
  children: ReactNode | ((motion: ReturnType<typeof loopRoute>) => ReactNode);
}) {
  const currentFrame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const motion = loopRoute({route, frame: frame ?? currentFrame, fps, speed, phase, turnDistance});
  return <group position={motion.position} rotation={[0, motion.yaw + yawOffset, 0]}>
    {typeof children === 'function' ? children(motion) : children}
  </group>;
}

/** Shared breeze with a repeatable offset and amplitude for each plant. */
export function windSway({frame, fps = 30, seed = 0, amplitude = 0.065, speed = 0.5, intensity = 1}: {
  frame: number;
  fps?: number;
  seed?: string | number;
  amplitude?: number;
  speed?: number;
  intensity?: number;
}): [number, number, number] {
  const offset = sampleRandom(seed) * Math.PI * 2;
  const time = frame / fps * speed * Math.PI * 2;
  const gain = Math.max(0, intensity) * amplitude;
  return [gain * Math.sin(time * 0.71 + offset) * 0.34, 0,
    gain * (Math.sin(time) * 0.73 + Math.sin(time * 1.9 + offset) * 0.27)];
}

export function WindGroup({frame, position, seed, amplitude, speed, intensity, children}: {
  frame?: number;
  position?: Vec3;
  seed?: string | number;
  amplitude?: number;
  speed?: number;
  intensity?: number;
  children: ReactNode;
}) {
  const local = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <group position={position}
    rotation={windSway({frame: frame ?? local, fps, seed, amplitude, speed, intensity})}>{children}</group>;
}

/** Attenuated response for an NPC, loose prop or foliage cluster near an event. */
export function reactToEvent({frame, at, distance = 0, radius = 6, delayPerUnit = 1.25,
  attack = 6, recovery = 22, intensity = 1}: {
  frame: number; at: number; distance?: number; radius?: number; delayPerUnit?: number;
  attack?: number; recovery?: number; intensity?: number;
}) {
  if (radius <= 0 || distance >= radius) return 0;
  const local = frame - at - Math.max(0, distance) * Math.max(0, delayPerUnit);
  if (local < 0) return 0;
  const up = Math.max(1, attack);
  const down = Math.max(1, recovery);
  const shape = local < up ? smoothstep(clamp(local / up)) : 1 - smoothstep(clamp((local - up) / down));
  return shape * (1 - smoothstep(clamp(distance / radius))) * Math.max(0, intensity);
}

/** Cloud, leaf or distant vehicle pass. Hide the loop seam offscreen or use visibility. */
export function driftLoop({frame, from, to, period, phase = 0, fade = 0.12}: {
  frame: number; from: Vec3; to: Vec3; period: number; phase?: number; fade?: number;
}) {
  const p = wrap(frame + phase, Math.max(1, period)) / Math.max(1, period);
  const edge = clamp(fade, 0.001, 0.5);
  const position: [number, number, number] = [lerp(from[0], to[0], p), lerp(from[1], to[1], p), lerp(from[2], to[2], p)];
  return {position, visibility: smoothstep(clamp(Math.min(p, 1 - p) / edge))};
}

/** Offset for a flat scenic card. Physical meshes already get optical parallax. */
export function depthPan(cameraDelta: number, relativeDepth: number) {
  return -cameraDelta / Math.max(0.05, relativeDepth);
}

export type LightState = {color: string; intensity: number};
export function ambientLight(from: LightState, to: LightState, progress: number): LightState {
  const p = smoothstep(clamp(progress));
  return {
    color: `#${new Color(from.color).lerp(new Color(to.color), p).getHexString()}`,
    intensity: lerp(from.intensity, to.intensity, p),
  };
}
