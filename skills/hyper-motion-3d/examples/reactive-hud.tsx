import type {CSSProperties, ReactNode} from 'react';
import {useVideoConfig} from 'remotion';
import {clamp} from './math';
import {AnimatedHUD, counterValue, SHORT_VERTICAL_INSETS, WorldText} from './typography';

export type HudUnit = 'count' | 'multiplier' | 'percent';
export type HudMotif = 'chevron' | 'star' | 'ring' | 'none';
export type ReactiveHudCue = Readonly<{
  target?: string;
  label?: string;
  value?: number;
  unit?: HudUnit;
  maximum?: number;
  stage?: string;
  palette?: string;
  /** Length of the number and gauge travel, in output frames. */
  tween?: number;
  motif?: HudMotif;
  /** Local scale accent, as a fraction of the rest size. */
  pop?: number;
}>;

type HudEvent = Readonly<{id: string; at: number; hud?: ReactiveHudCue}>;
type HudBase = Readonly<{
  label: string;
  value: number;
  maximum: number;
  unit: HudUnit;
  stage?: string;
  palette: string;
}>;
export type ReactiveHudView = HudBase & Readonly<{
  eventId?: string;
  targetValue: number;
  progress: number;
  motif: HudMotif;
  /** Decays after the event and reaches zero before the outcome is removed. */
  pulse: number;
  scale: number;
}>;

type NumberKey = {at: number; from: number; to: number; duration: number};
type AppearanceKey = {at: number; id: string; base: HudBase; motif: HudMotif; pop: number};

function lastAt<T extends {at: number}>(keys: readonly T[], frame: number) {
  let low = 0;
  let high = keys.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (keys[middle].at > frame) high = middle;
    else low = middle + 1;
  }
  return keys[low - 1] as T | undefined;
}

function numberAt(keys: readonly NumberKey[], frame: number, initial: number) {
  const key = lastAt(keys, frame);
  return key === undefined ? initial : counterValue(frame, key.at, key.duration, key.from, key.to);
}

function assertHud(base: HudBase, id: string) {
  if (typeof base.label !== 'string' || !base.label.trim() ||
    typeof base.palette !== 'string' || !base.palette.trim() ||
    (base.stage !== undefined && typeof base.stage !== 'string') || !Number.isFinite(base.value) ||
    !Number.isFinite(base.maximum) || base.maximum <= 0 ||
    !['count', 'multiplier', 'percent'].includes(base.unit)) {
    throw new RangeError(`Invalid HUD state: ${id}`);
  }
}

/** Compile once at the composition boundary. Read any output frame independently. */
export function compileReactiveHud(events: readonly HudEvent[], initial: HudBase, target = 'main') {
  assertHud(initial, 'initial');
  const appearance: AppearanceKey[] = [];
  const values: NumberKey[] = [];
  const progress: NumberKey[] = [];
  const initialProgress = clamp(initial.value / initial.maximum);
  let base = {...initial};

  const cues = events
    .filter((event): event is HudEvent & {hud: ReactiveHudCue} => (event.hud?.target ?? 'main') === target
      && event.hud !== undefined)
    .sort((a, b) => a.at - b.at);

  for (const {id, at, hud} of cues) {
    const {tween = 16, motif = 'none', pop = 0.08, value, maximum, label, stage, palette, unit} = hud;
    if (!Number.isInteger(at) || at < 0 || appearance.at(-1)?.at === at ||
      !Number.isInteger(tween) || tween < 0 || !Number.isFinite(pop) ||
      !['none', 'chevron', 'star', 'ring'].includes(motif)) {
      throw new RangeError(`Invalid timing or accent for HUD event: ${id}`);
    }
    base = {
      label: label ?? base.label, stage: stage ?? base.stage, palette: palette ?? base.palette,
      unit: unit ?? base.unit, value: value ?? base.value, maximum: maximum ?? base.maximum,
    };
    assertHud(base, id);
    appearance.push({at, id, base, motif, pop: clamp(pop, 0, 0.16)});

    if (value !== undefined) {
      values.push({at, from: numberAt(values, at, initial.value), to: value, duration: tween});
    }
    if (value !== undefined || maximum !== undefined) {
      progress.push({at, from: numberAt(progress, at, initialProgress),
        to: clamp(base.value / base.maximum), duration: tween});
    }
  }

  return {
    at(frame: number): ReactiveHudView {
      const point = lastAt(appearance, frame);
      const settled = point?.base ?? initial;
      const pulse = point ? (1 - clamp((frame - point.at) / 16)) ** 2 : 0;
      return {
        ...settled, eventId: point?.id, targetValue: settled.value,
        value: numberAt(values, frame, initial.value), progress: numberAt(progress, frame, initialProgress),
        motif: pulse > 0 ? point?.motif ?? 'none' : 'none',
        pulse, scale: 1 + pulse * (point?.pop ?? 0),
      };
    },
  };
}

export function formatHudValue(value: number, unit: HudUnit, locale = 'ru-RU') {
  const text = new Intl.NumberFormat(locale, {maximumFractionDigits: 0}).format(value);
  if (unit === 'multiplier') return `×${text}`;
  if (unit === 'percent') return `${text}%`;
  return text;
}

export function HudGraphic({motif, color, size = 38, style}: {
  motif: HudMotif;
  color: string;
  size?: number;
  style?: CSSProperties;
}) {
  if (motif === 'none') return null;
  const mark = motif === 'ring' ? <circle cx="20" cy="20" r="13"/> : motif === 'star' ?
    <path d="M20 3 23.5 16.5 37 20 23.5 23.5 20 37 16.5 23.5 3 20 16.5 16.5Z"/> :
    <path d="M8 24 20 12l12 12M14 30l6-6 6 6"/>;
  return <svg aria-hidden viewBox="0 0 40 40" width={size} height={size}
    style={{display: 'block', ...style}} fill="none" stroke={color} strokeWidth="2.6"
    strokeLinecap="round" strokeLinejoin="round">{mark}</svg>;
}

export function ReactiveHUD({view, intensity = 1, locale, style}: {
  view: ReactiveHudView;
  intensity?: number;
  locale?: string;
  style?: CSSProperties;
}) {
  const {width, height} = useVideoConfig();
  const unit = Math.min(width / 1080, height / 1920);
  const strength = clamp(intensity);
  return (
    <div style={{position: 'relative', width: 341 * unit, maxWidth: '100%', isolation: 'isolate',
      transform: `scale(${1 + (view.scale - 1) * strength})`, transformOrigin: '8% 28%', ...style}}>
      <AnimatedHUD label={view.label} progress={view.progress} accent={view.palette} ticks={9}
        style={{minWidth: 0, padding: `${14 * unit}px ${17 * unit}px`, color: '#fff3e4',
          background: '#352744', border: `${2 * unit}px solid ${view.palette}`,
          boxShadow: `0 ${6 * unit}px 0 #261c35`, borderRadius: 16 * unit, fontWeight: 700}}>
        <strong style={{color: view.palette, fontSize: 46 * unit, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap'}}>{formatHudValue(view.value, view.unit, locale)}</strong>
      </AnimatedHUD>
      {view.stage && <span style={{display: 'inline-block', marginTop: 11 * unit, padding: `4px ${12 * unit}px`,
        borderRadius: 7 * unit, background: '#352744', color: '#fff3e4', fontWeight: 700,
        fontSize: 29 * unit, lineHeight: 1.13, maxWidth: '100%'}}>{view.stage}</span>}
      <HudGraphic motif={view.motif} color={view.palette} size={36 * unit}
        style={{position: 'absolute', top: -20 * unit, right: -11 * unit,
          opacity: Math.min(1, view.pulse * 2.6) * strength,
          transform: `translateY(${-4 * strength * (1 - view.pulse)}px)`,
          filter: 'drop-shadow(0 1px 1px #352744)'}}/>
    </div>
  );
}

export function ReactiveScoreboard({rows, intensity, locale, style}: {
  rows: readonly {id: string; view: ReactiveHudView}[];
  intensity?: number;
  locale?: string;
  style?: CSSProperties;
}) {
  return <div style={{display: 'grid', justifyItems: 'start', gap: 13, ...style}}>
    {rows.map(({id, view}) => <ReactiveHUD key={id} {...{view, intensity, locale}} />)}
  </div>;
}

/** Input anchor is projected to screen by the caller and expressed as a 0–1 composition point. */
export function ReactiveTooltip({anchor, children, view, side = 'right', style}: {
  anchor: readonly [number, number];
  children: ReactNode;
  view: ReactiveHudView;
  side?: 'left' | 'right';
  style?: CSSProperties;
}) {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1080, height / 1920);
  if (!anchor.every(Number.isFinite) || anchor[0] < 0 || anchor[0] > 1 || anchor[1] < 0 || anchor[1] > 1) {
    return null;
  }
  const card = 250 * scale;
  const safe = SHORT_VERTICAL_INSETS;
  const right = anchor[0] * width + 18 * scale;
  const left = anchor[0] * width - card - 18 * scale;
  const min = safe.left * width;
  const max = (1 - safe.right) * width - card;
  const isRight = side === 'right' ? right <= max || left < min : left < min && right <= max;
  const x = clamp(isRight ? right : left, min, max);
  const y = clamp(anchor[1] * height, safe.top * height + 48 * scale, (1 - safe.bottom) * height - 48 * scale);
  return (
    <div style={{position: 'absolute', pointerEvents: 'none', top: y, left: x,
      width: card, transform: 'translateY(-50%)', ...style}}>
      <div style={{fontSize: 35 * scale, lineHeight: 1.1, fontWeight: 700, color: '#fff3e4',
        background: '#352744', border: `2px solid ${view.palette}`, borderRadius: 14 * scale,
        padding: `${9 * scale}px ${12 * scale}px`}}>{children}</div>
      <HudGraphic motif="chevron" color={view.palette} size={24 * scale}
        style={{position: 'absolute', top: '50%', [isRight ? 'left' : 'right']: -12 * scale,
          transform: `translateY(-50%) rotate(${isRight ? -90 : 90}deg)`,
          filter: 'drop-shadow(0 1px 2px #352744)'}}/>
    </div>
  );
}

/** Extrudes the outcome or stage, so geometry changes once per authored edit. */
export function ReactiveWorldText({view, text, locale, position, rotation, color, ...props}: {
  view: ReactiveHudView;
  text?: string;
  locale?: string;
} & Omit<Parameters<typeof WorldText>[0], 'text'>) {
  const content = text ?? view.stage ?? formatHudValue(view.targetValue, view.unit, locale);
  return (
    <group position={position} rotation={rotation} scale={view.scale}>
      <WorldText {...props} text={content} color={color ?? view.palette}/>
    </group>
  );
}
