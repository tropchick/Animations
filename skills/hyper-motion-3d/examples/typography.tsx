import {useEffect, useMemo, type CSSProperties, type ReactNode} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import type {Font} from 'three/addons/loaders/FontLoader.js';

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (t: number) => 1 - (1 - t) ** 3;

type FrameProp = {frame?: number};
type Insets = {top: number; right: number; bottom: number; left: number};

// Fractions of the composition. Check the current platform chrome before release.
export const SHORT_VERTICAL_INSETS: Insets = {top: 0.10, right: 0.16, bottom: 0.22, left: 0.08};

export function SafeArea({children, insets, style}: {
  children: ReactNode;
  insets?: Partial<Insets>;
  style?: CSSProperties;
}) {
  const {width, height} = useVideoConfig();
  const safe = {...SHORT_VERTICAL_INSETS, ...insets};
  return (
    <div style={{
      position: 'absolute',
      display: 'flex',
      flexDirection: 'column',
      top: height * safe.top,
      right: width * safe.right,
      bottom: height * safe.bottom,
      left: width * safe.left,
      width: 'auto',
      height: 'auto',
      pointerEvents: 'none',
      ...style,
    }}>
      {children}
    </div>
  );
}

export function KineticText({
  children, from = 0, duration = 14, hold, emphasis = false,
  intensity = 1, style, frame: suppliedFrame,
}: FrameProp & {
  children: ReactNode;
  from?: number;
  /** Entrance length in frames. */
  duration?: number;
  /** Frames to keep the phrase after entrance. Omit to keep it mounted. */
  hold?: number;
  emphasis?: boolean | string;
  intensity?: number;
  style?: CSSProperties;
}) {
  const localFrame = useCurrentFrame();
  const frame = (suppliedFrame ?? localFrame) - from;
  if (frame < 0 || (hold !== undefined && frame >= duration + hold)) return null;
  const t = duration <= 0 ? 1 : clamp(frame / duration);
  const settle = easeOut(t);
  const accent = clamp(intensity);
  const bounce = emphasis ? Math.sin(Math.PI * t) * (1 - t) * 0.16 : 0;
  const scale = 1 + ((settle - 1) * 0.12 + bounce) * accent;

  return (
    <span style={{
      display: 'inline-block',
      opacity: Math.min(1, t * 3),
      transform: `translateY(${(1 - settle) * 24 * accent}px) scale(${scale})`,
      transformOrigin: '50% 80%',
      color: typeof emphasis === 'string' ? emphasis : undefined,
      fontWeight: emphasis ? 800 : undefined,
      ...style,
    }}>
      {children}
    </span>
  );
}

export function KineticWords({words, from = 0, stagger = 3, duration = 14, intensity, frame}: FrameProp & {
  words: readonly {text: string; emphasis?: boolean | string}[];
  from?: number;
  stagger?: number;
  duration?: number;
  intensity?: number;
}) {
  const localFrame = useCurrentFrame();
  const resolvedFrame = frame ?? localFrame;
  return (
    <span aria-label={words.map((word) => word.text).join(' ')}>
      {words.map((word, index) => {
        const wordStart = from + index * stagger;
        return (
          <span aria-hidden key={index}>
            {index > 0 ? ' ' : null}
            {resolvedFrame < wordStart ?
              <span style={{visibility: 'hidden', fontWeight: word.emphasis ? 800 : undefined}}>
                {word.text}
              </span> :
              <KineticText {...{duration, intensity}} frame={resolvedFrame} from={wordStart} emphasis={word.emphasis}>
                {word.text}
              </KineticText>}
          </span>
        );
      })}
    </span>
  );
}

export function counterValue(frame: number, start: number, duration: number, from: number, to: number) {
  const t = frame < start ? 0 : duration <= 0 ? 1 : easeOut(clamp((frame - start) / duration));
  return from * (1 - t) + to * t;
}

export function AnimatedCounter({from = 0, to, start = 0, duration = 22, prefix = '', suffix = '',
  format = Math.round, style, frame: suppliedFrame}: FrameProp & {
  from?: number;
  to: number;
  start?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  format?: (value: number) => ReactNode;
  style?: CSSProperties;
}) {
  const localFrame = useCurrentFrame();
  const value = counterValue(suppliedFrame ?? localFrame, start, duration, from, to);
  return (
    <span style={{fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', ...style}}>
      {prefix}{format(value)}{suffix}
    </span>
  );
}

export function AnimatedHUD({progress, label, children, accent = '#78efd1', ticks = 0, style}: {
  progress: number;
  label: string;
  children?: ReactNode;
  accent?: string;
  ticks?: number;
  style?: CSSProperties;
}) {
  const fraction = clamp(progress);
  const divisions = Math.min(20, Math.max(0, Math.floor(ticks)));
  return (
    <div style={{
      color: '#f5f8fa',
      display: 'grid',
      gap: 11,
      minWidth: 200,
      padding: '15px 20px',
      border: '1px solid #f5f8fa4d',
      borderRadius: 18,
      background: '#101d29e8',
      ...style,
    }}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16}}>
        <span style={{fontSize: 32, fontWeight: 700, letterSpacing: '0.045em'}}>{label}</span>
        {children ?? <span style={{fontSize: 36}}>{Math.round(fraction * 100)}%</span>}
      </div>
      <div role="progressbar" aria-label={label} aria-valuenow={Math.round(fraction * 100)}
        style={{height: 7, overflow: 'hidden', background: '#ffffff30', borderRadius: 8}}>
        <div style={{
          height: '100%', width: '100%', background: accent, borderRadius: 'inherit',
          transform: `scaleX(${fraction})`, transformOrigin: 'left',
        }}/>
      </div>
      {divisions > 1 && (
        <div aria-hidden style={{display: 'flex', justifyContent: 'space-between'}}>
          {Array.from({length: divisions}, (_, index) => (
            <i key={index} style={{
              width: 2,
              height: index % 4 === 0 ? 9 : 5,
              background: index / (divisions - 1) <= fraction ? accent : '#ffffff54',
            }}/>
          ))}
        </div>
      )}
    </div>
  );
}

export function InfoCard({label, title, children, from = 0, duration, hold, accent = '#78efd1', style}: {
  label?: string;
  title: string;
  children?: ReactNode;
  from?: number;
  duration?: number;
  hold?: number;
  accent?: string;
  style?: CSSProperties;
}) {
  return (
    <KineticText {...{from, duration, hold}} style={{display: 'block', maxWidth: 580}}>
      <span style={{
        display: 'grid', gap: 8, borderRadius: 20, padding: '22px 25px',
        background: '#101d29ef', borderLeft: `5px solid ${accent}`, color: '#fff', ...style,
      }}>
        {label && <span style={{fontSize: 32, letterSpacing: '0.06em', color: accent}}>{label}</span>}
        <strong style={{fontSize: 44, fontWeight: 800, lineHeight: 1.05}}>{title}</strong>
        {children && <span style={{fontSize: 36, lineHeight: 1.2}}>{children}</span>}
      </span>
    </KineticText>
  );
}

export type TimedWord = {text: string; from: number; to: number; emphasis?: boolean};
export type CaptionLine = {from: number; to: number; words: readonly TimedWord[]};

export function KaraokeCaptions({lines, activeColor = '#ffe181', style, frame: suppliedFrame}: FrameProp & {
  lines: readonly CaptionLine[];
  activeColor?: string;
  style?: CSSProperties;
}) {
  const localFrame = useCurrentFrame();
  const frame = suppliedFrame ?? localFrame;
  const line = lines.find((candidate) => frame >= candidate.from && frame < candidate.to);
  if (!line) return null;

  return (
    <div style={{fontSize: 45, lineHeight: 1.22, fontWeight: 750, textAlign: 'center', color: '#fff',
      textShadow: '0 2px 8px #000', ...style}}>
      <span style={{background: '#10121ce6', borderRadius: 12, padding: '8px 14px', boxDecorationBreak: 'clone'}}>
        {line.words.map((word, index) => {
          const active = frame >= word.from && frame < word.to;
          return (
            <span key={index}>
              {index > 0 ? ' ' : null}
              <span style={{
                display: 'inline-block',
                fontWeight: word.emphasis ? 900 : undefined,
                color: active ? activeColor : undefined,
                transform: active && word.emphasis ? 'scale(1.05)' : undefined,
              }}>{word.text}</span>
            </span>
          );
        })}
      </span>
    </div>
  );
}

export function WorldText({text, font, size = 0.4, depth = 0.04, color = '#ffe8b3',
  position = [0, 0, 0], rotation = [0, 0, 0], bevel = 0.008,
  from, duration = 14, frame: suppliedFrame}: FrameProp & {
  text: string;
  font: Font;
  size?: number;
  depth?: number;
  color?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  bevel?: number;
  from?: number;
  duration?: number;
}) {
  const localFrame = useCurrentFrame();
  const frame = suppliedFrame ?? localFrame;
  const geometry = useMemo(() => {
    const extruded = new TextGeometry(text, {
      font, size, depth, curveSegments: 5, bevelEnabled: bevel > 0,
      bevelSegments: 2, bevelSize: bevel, bevelThickness: bevel,
    });
    extruded.center();
    return extruded;
  }, [text, font, size, depth, bevel]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const progress = from === undefined || duration <= 0 ? 1 : easeOut(clamp((frame - from) / duration));

  return (
    <mesh position={position} rotation={rotation} visible={from === undefined || frame >= from}
      scale={0.82 + 0.18 * progress}>
      <primitive attach="geometry" object={geometry}/>
      <meshStandardMaterial color={color} roughness={0.8}/>
    </mesh>
  );
}
