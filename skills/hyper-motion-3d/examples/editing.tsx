import React, {type CSSProperties, type ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Color} from 'three';
import {clamp, frameProgress, lerp, smoothstep, type Vec3} from './math';

export type TimeKey = {
  frame: number;
  sourceFrame: number;
  /** Incoming curve. Equal source positions hold the world pose. */
  ease?: 'linear' | 'smooth' | 'accelerate' | 'decelerate';
};

/** Map editorial time to source time. Keep narration and SFX on editorial time. */
export function sampleEditTime(frame: number, keys: readonly TimeKey[]) {
  if (keys.length === 0) return frame;
  const next = keys.findIndex((key) => key.frame > frame);
  if (next === 0) return keys[0].sourceFrame;
  if (next === -1) return keys[keys.length - 1].sourceFrame;
  const a = keys[next - 1];
  const b = keys[next];
  const u = clamp((frame - a.frame) / (b.frame - a.frame));
  let p = u;
  if (b.ease === 'smooth') p = smoothstep(u);
  if (b.ease === 'accelerate') p = u ** 2;
  if (b.ease === 'decelerate') p = 1 - (1 - u) ** 2;
  return lerp(a.sourceFrame, b.sourceFrame, p);
}

export type MorphPose = {position: Vec3; scale: Vec3; color: string};

/** One persistent mesh can connect two scenes through a matched silhouette. */
export function sampleMorph(from: MorphPose, to: MorphPose, progress: number) {
  const p = smoothstep(clamp(progress));
  const blend = (a: Vec3, b: Vec3): [number, number, number] => [
    lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p),
  ];
  return {
    position: blend(from.position, to.position),
    scale: blend(from.scale, to.scale),
    color: `#${new Color(from.color).lerp(new Color(to.color), p).getHexString()}`,
  };
}

export type TransitionKind = 'whip' | 'match' | 'zoom' | 'wipe' | 'morph' | 'scale';
type TransitionWindow = {
  frame?: number;
  from: number;
  duration: number;
  direction?: 'left' | 'right';
  /** Affects the travel, tilt and blur. The edit still occurs at zero strength. */
  strength?: number;
  color?: string;
};

function scene(content: ReactNode, style?: CSSProperties) {
  return <AbsoluteFill style={style}>{content}</AbsoluteFill>;
}

/** DOM wrapper for fully framed shots. Keep shared captions/UI above the wrapper. */
export function HyperTransition({kind, outgoing, incoming, frame, from, duration,
  direction = 'left', strength = 1, color = '#182331', pivot = 0.5, wipeObject,
  origin = [50, 50]}: TransitionWindow & {
  kind: TransitionKind;
  outgoing: ReactNode;
  incoming: ReactNode;
  pivot?: number;
  /** Optional artwork centered on the moving seam of an object wipe. */
  wipeObject?: ReactNode;
  /** Match point as percent viewport coordinates. */
  origin?: readonly [number, number];
}) {
  const local = useCurrentFrame();
  const at = frame ?? local;
  if (at < from) return scene(outgoing);
  if (duration < 2 || at >= from + duration - 1) return scene(incoming);
  const p = frameProgress(at, from, duration);
  const cut = clamp(pivot, 0.15, 0.85);
  const after = p >= cut;
  const gain = clamp(strength, 0, 1.5);
  if (p === 0 || kind === 'match' || gain === 0) return scene(after ? incoming : outgoing);

  const anchor = `${origin[0]}% ${origin[1]}%`;
  if (kind === 'wipe') {
    const right = direction === 'right';
    const edge = lerp(-12, 112, right ? smoothstep(p) : 1 - smoothstep(p));
    const tilt = 6 * gain;
    const clipPath = right
      ? `polygon(0 0, ${edge - tilt}% 0, ${edge + tilt}% 100%, 0 100%)`
      : `polygon(${edge - tilt}% 0, 100% 0, 100% 100%, ${edge + tilt}% 100%)`;
    return <AbsoluteFill style={{overflow: 'hidden'}}>
      {scene(outgoing)}
      {scene(incoming, {clipPath})}
      {wipeObject && <div style={{position: 'absolute', top: '50%', left: `${edge}%`,
        transform: 'translate(-50%, -50%)'}}>{wipeObject}</div>}
    </AbsoluteFill>;
  }

  if (kind === 'morph' || kind === 'scale') {
    const blend = smoothstep(p);
    const transform = `scale(${lerp(1 + gain * 0.2, 1, blend)})`;
    const style: CSSProperties = kind === 'morph'
      ? {opacity: blend, transform, transformOrigin: anchor}
      : {clipPath: `circle(${190 * blend}% at ${anchor})`, transform, transformOrigin: anchor};
    return <AbsoluteFill style={{overflow: 'hidden', backgroundColor: color}}>
      {scene(outgoing, {transform: `scale(${1 + blend * gain * (kind === 'scale' ? 0.32 : 0.05)})`,
        transformOrigin: anchor})}
      {scene(incoming, style)}
    </AbsoluteFill>;
  }

  const accent = after ? 1 - smoothstep((p - cut) / (1 - cut)) : smoothstep(p / cut);
  const sign = direction === 'right' ? 1 : -1;
  const transform = kind === 'whip'
    ? `translateX(${sign * (after ? -1 : 1) * 10 * accent * gain}%) scale(${1 + 0.25 * accent * gain})`
    : `scale(${1 + (after ? 0.36 : 0.66) * accent * gain})`;
  return <AbsoluteFill style={{overflow: 'hidden', backgroundColor: color}}>
    {scene(after ? incoming : outgoing, {transform, transformOrigin: anchor,
      filter: gain * accent > 0.01 ? `blur(${6 * gain * accent}px)` : undefined})}
  </AbsoluteFill>;
}

/** A lightweight bridge for a camera or environment cut inside one persistent canvas. */
export function TransitionVeil({kind, frame, from, duration, color = '#283b44', direction = 'left',
  strength = 1}: TransitionWindow & {kind: Exclude<TransitionKind, 'match' | 'morph'>}) {
  const local = useCurrentFrame();
  const at = frame ?? local;
  if (at < from || at >= from + duration || duration < 3) return null;
  const p = frameProgress(at, from, duration);
  const gain = clamp(strength, 0, 1.5);
  if (p === 0 || p === 1 || gain === 0) return null;
  const sign = direction === 'right' ? 1 : -1;
  // The center plateau covers both center samples of an even-length cut.
  const entrance = smoothstep(clamp(p / 0.4));
  const exit = smoothstep(clamp((p - 0.6) / 0.4));
  const motion = exit + entrance - 1;
  const opacity = entrance * (1 - exit);
  if (kind === 'zoom' || kind === 'scale') {
    return <AbsoluteFill style={{pointerEvents: 'none', opacity, backgroundColor: color,
      clipPath: `circle(${125 * opacity}% at 50% 50%)`}} />;
  }
  return <AbsoluteFill style={{overflow: 'hidden', pointerEvents: 'none'}}>
    <div style={{position: 'absolute', inset: '-25% -18%', backgroundColor: color,
      transform: `translateX(${sign * 112 * motion}%) skewX(${sign * gain * (kind === 'whip' ? 9 : 5)}deg)`}} />
  </AbsoluteFill>;
}
