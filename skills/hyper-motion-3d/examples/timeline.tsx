import {createContext, Fragment, useContext, useMemo, type ReactNode} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, frameProgress, lerp, smoothstep, type Seed} from './math';

export type IntensityLevel = 'Minimal' | 'Dynamic' | 'Hyper' | 'Ultra' | 'Climax';
export type Intensity = Readonly<{
  camera: number;
  particles: number;
  text: number;
  transitions: number;
  audio: number;
  background: number;
}>;
export type IntensityKey = Readonly<{
  frame: number;
  level?: IntensityLevel;
  channels?: Partial<Intensity>;
  easing?: 'hold' | 'linear' | 'smooth';
}>;
export type Quality = 'draft' | 'final';
export type Budget = Readonly<{particles: number; effects: number; trailSamples: number}>;

export const intensityPresets: Readonly<Record<IntensityLevel, Intensity>> = {
  Minimal: {camera: 0.18, particles: 0.15, text: 0.24, transitions: 0.18, audio: 0.22, background: 0.27},
  Dynamic: {camera: 0.44, particles: 0.43, text: 0.49, transitions: 0.45, audio: 0.44, background: 0.48},
  Hyper: {camera: 0.72, particles: 0.72, text: 0.74, transitions: 0.72, audio: 0.69, background: 0.62},
  Ultra: {camera: 0.88, particles: 0.91, text: 0.88, transitions: 0.86, audio: 0.81, background: 0.72},
  Climax: {camera: 0.98, particles: 1, text: 0.96, transitions: 0.93, audio: 0.92, background: 0.78},
};
export const qualityBudgets: Readonly<Record<Quality, Budget>> = {
  draft: {particles: 96, effects: 4, trailSamples: 6},
  final: {particles: 320, effects: 7, trailSamples: 12},
};
const noIntensity: Intensity = {camera: 0, particles: 0, text: 0, transitions: 0, audio: 0, background: 0};
const channels = Object.keys(noIntensity) as (keyof Intensity)[];

const channelValues = (get: (key: keyof Intensity) => number): Intensity =>
  Object.fromEntries(channels.map((key) => [key, get(key)])) as Intensity;

export function compileIntensity(keys: readonly IntensityKey[], base: IntensityLevel = 'Hyper') {
  const baseline = intensityPresets[base];
  const sorted = [...keys].sort((a, b) => a.frame - b.frame);
  const initial: IntensityKey[] = sorted[0]?.frame === 0 ? [] : [{frame: 0, level: base}];
  const points = [...initial, ...sorted].map((key, index, all) => {
    if (!Number.isFinite(key.frame) || key.frame < 0 || all[index - 1]?.frame === key.frame) {
      throw new RangeError(`Expected unique, non-negative intensity frames: ${key.frame}`);
    }
    const preset = intensityPresets[key.level ?? base];
    const values = channelValues((name) => {
      const value = key.channels?.[name] ?? preset[name];
      if (!Number.isFinite(value)) throw new RangeError(`Invalid intensity for ${name}`);
      return clamp(value);
    });
    return {...key, values};
  });
  return (frame: number): Intensity => {
    const index = points.findIndex((point) => point.frame > frame);
    if (index === 0) return baseline;
    if (index === -1) return points[points.length - 1].values;
    const left = points[index - 1];
    const right = points[index];
    const p = (frame - left.frame) / (right.frame - left.frame);
    const blend = left.easing === 'hold' ? 0 : left.easing === 'linear' ? p : smoothstep(p);
    return channelValues((key) => lerp(left.values[key], right.values[key], blend));
  };
}

export type MotionEvent = Readonly<{
  id: string;
  kind: string;
  from: number;
  duration: number;
  priority?: number;
  /** Requested instance count. Ambient geometry outside the event track needs its own allowance. */
  particles?: number;
}>;
export type ActiveEvent<T extends MotionEvent = MotionEvent> = Readonly<{
  event: T;
  localFrame: number;
  progress: number;
  particleBudget: number;
  seed: string;
}>;

const compareId = (a: MotionEvent, b: MotionEvent) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
export function compileTimeline<T extends MotionEvent>(events: readonly T[]) {
  const ids = new Set<string>();
  for (const event of events) {
    if (!event.id || ids.has(event.id)) throw new Error(`Duplicate or empty event id: ${event.id}`);
    if (
      !Number.isInteger(event.from) || !Number.isInteger(event.duration) || event.duration < 1 ||
      !Number.isFinite(event.priority ?? 0) || !Number.isFinite(event.particles ?? 0) ||
      (event.particles ?? 0) < 0
    ) throw new RangeError(`Invalid event timing or budget: ${event.id}`);
    ids.add(event.id);
  }
  return [...events].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.from - b.from || compareId(a, b));
}

export function sampleEvents<T extends MotionEvent>(
  timeline: readonly T[],
  frame: number,
  budget: Budget,
  seed: Seed,
  particleIntensity = 1,
): ActiveEvent<T>[] {
  let remaining = budget.particles;
  const active: ActiveEvent<T>[] = [];
  for (const event of timeline) {
    if (active.length >= budget.effects) break;
    if (frame < event.from || frame >= event.from + event.duration) continue;
    const particleBudget = Math.min(remaining, Math.floor((event.particles ?? 0) * clamp(particleIntensity)));
    remaining -= particleBudget;
    active.push({
      event,
      localFrame: frame - event.from,
      progress: frameProgress(frame, event.from, event.duration),
      particleBudget,
      seed: `${seed}/${event.id}`,
    });
  }
  return active;
}

type HyperMotionState = Readonly<{
  frame: number;
  fps: number;
  enabled: boolean;
  seed: Seed;
  quality: Quality;
  budget: Budget;
  intensity: Intensity;
  active: readonly ActiveEvent[];
}>;
const HyperMotionContext = createContext<HyperMotionState | null>(null);
const emptyEvents: readonly MotionEvent[] = [];
const emptyKeys: readonly IntensityKey[] = [];

type HyperMotionProviderProps = {
  children: ReactNode;
  events?: readonly MotionEvent[];
  intensity?: readonly IntensityKey[];
  level?: IntensityLevel;
  quality?: Quality;
  budget?: Partial<Budget>;
  seed?: Seed;
  enabled?: boolean;
  /** Supply an absolute frame when mounted below a Sequence or across multiple clocks. */
  frame?: number;
};
export function HyperMotionProvider({
  children, events = emptyEvents, intensity = emptyKeys, level = 'Hyper', quality = 'final',
  budget: customBudget, seed = 0, enabled = true, frame: frameOverride,
}: HyperMotionProviderProps) {
  const localFrame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const frame = frameOverride ?? localFrame;
  const timeline = useMemo(() => compileTimeline(events), [events]);
  const sampleIntensity = useMemo(() => compileIntensity(intensity, level), [intensity, level]);
  const current = enabled ? sampleIntensity(frame) : noIntensity;
  const budget = {...qualityBudgets[quality], ...customBudget};
  for (const key of Object.keys(budget) as (keyof Budget)[]) {
    if (!Number.isSafeInteger(budget[key]) || budget[key] < 0) throw new RangeError(`Invalid ${key} budget`);
  }
  const active = enabled ? sampleEvents(timeline, frame, budget, seed, current.particles) : [];
  return (
    <HyperMotionContext.Provider value={{frame, fps, enabled, seed, quality, budget, intensity: current, active}}>
      {children}
    </HyperMotionContext.Provider>
  );
}

export function useHyperMotion(): HyperMotionState {
  const state = useContext(HyperMotionContext);
  if (state === null) throw new Error('Place this consumer under HyperMotionProvider');
  return state;
}

/** Narrow custom event payloads with a type predicate, or route base events by kind. */
export function useActiveEvents<T extends MotionEvent>(
  isEvent: (event: MotionEvent) => event is T,
): readonly ActiveEvent<T>[];
export function useActiveEvents(): readonly ActiveEvent[];
export function useActiveEvents(isEvent?: (event: MotionEvent) => boolean) {
  const {active} = useHyperMotion();
  return isEvent ? active.filter(({event}) => isEvent(event)) : active;
}

export function EffectTimeline({
  render,
}: {
  render: (active: ActiveEvent, state: HyperMotionState) => ReactNode;
}) {
  const state = useHyperMotion();
  return state.active.map((active) => (
    <Fragment key={active.event.id}>{render(active, state)}</Fragment>
  ));
}
