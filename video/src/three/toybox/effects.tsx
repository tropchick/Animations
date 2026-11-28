import {useCurrentFrame, useVideoConfig} from 'remotion';
import {
  AnimatedArrow, AtmosphericEffect, CartoonSmoke, DustCloud, EnergyRing, FloatingIcon, LightSweep,
  MotionTrail, ParticleBurst, Shockwave, Sparkles, SpeedLines, type EffectProps, type EffectTheme,
} from '../../hyper-motion-examples/effects';
import {toyboxBrand, toyboxQuality, type ToyboxQuality} from './theme';

const layerCaps = {preview: 2, balanced: 3, final: 4};
const trailCaps = {preview: 4, balanced: 7, final: 11};

export const TOY_EFFECT_THEME: EffectTheme = {
  color: toyboxBrand.cream,
  accent: toyboxBrand.amber,
  finish: 'sculpted',
  roughness: 0.59,
};

const styles = {
  dust: {seconds: 0.72, color: '#f0cba1', count: 10, opacity: 0.9, motion: 'soft'},
  smoke: {seconds: 1.5, color: '#e6eee9', count: 11, opacity: 0.6, motion: 'soft'},
  confetti: {seconds: 0.95, color: toyboxBrand.coral, count: 22, opacity: 0.92, motion: 'sharp'},
  spark: {seconds: 0.55, color: toyboxBrand.amber, count: 9, opacity: 0.92, motion: 'sharp'},
  ring: {seconds: 0.92, color: toyboxBrand.mint, count: 2, opacity: 0.82, motion: 'soft'},
  shockwave: {seconds: 0.62, color: toyboxBrand.cream, count: 2, opacity: 0.73, motion: 'sharp'},
  speed: {seconds: 0.42, color: toyboxBrand.cream, count: 13, opacity: 0.69, motion: 'linear'},
  glint: {seconds: 0.58, color: toyboxBrand.cream, count: 1, opacity: 0.7, motion: 'soft'},
  splash: {seconds: 0.82, color: '#d48243', count: 15, opacity: 0.92, motion: 'sharp'},
  star: {seconds: 0.92, color: toyboxBrand.amber, count: 1, opacity: 0.95, motion: 'soft'},
  arrow: {seconds: 0.96, color: toyboxBrand.mint, count: 1, opacity: 0.75, motion: 'soft'},
  haze: {seconds: 2.2, color: '#eed9bb', count: 1, opacity: 0.35, motion: 'soft'},
} as const satisfies Record<string, {
  seconds: number; color: string; count: number; opacity: number; motion: EffectProps['motion'];
}>;

export type ToyEffectKind = keyof typeof styles;
export type ToyEffectCue = Omit<EffectProps, 'theme' | 'frame' | 'budget'> & {
  kind: ToyEffectKind;
  from: number;
  count?: number;
  /** Render more important simultaneously active cues first. */
  priority?: number;
};

function Accent({kind, ...props}: EffectProps & {kind: ToyEffectKind; count: number}) {
  switch (kind) {
    case 'dust': return <DustCloud {...props} spread={172} />;
    case 'smoke': return <CartoonSmoke {...props} spread={55} />;
    case 'confetti': return <ParticleBurst {...props} spread={175} gravity={0.95} />;
    case 'spark': return <Sparkles {...props} spread={220} />;
    case 'ring': return <EnergyRing {...props} />;
    case 'shockwave': return <Shockwave {...props} rings={2} thickness={0.85} />;
    case 'speed': return <SpeedLines {...props} />;
    case 'glint': return <LightSweep {...props} />;
    case 'splash': return <ParticleBurst {...props} spread={88} gravity={1.8} />;
    case 'star': return <FloatingIcon {...props} icon="star" />;
    case 'arrow': return <AnimatedArrow {...props} />;
    case 'haze': return <AtmosphericEffect {...props} />;
  }
}

/** World-space surface, color and budget presets layered over the Hyper effects engine. */
export function ToyEffects({cues, frame: suppliedFrame, quality = 'balanced', intensity = 1, accent}: {
  cues: readonly ToyEffectCue[];
  frame?: number;
  quality?: ToyboxQuality;
  intensity?: number;
  accent?: string;
}) {
  const localFrame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const frame = suppliedFrame ?? localFrame;
  let remaining = toyboxQuality[quality].particles;
  const theme = accent ? {...TOY_EFFECT_THEME, accent} : TOY_EFFECT_THEME;
  const active = cues.map((cue, index) => ({
    cue, index, duration: cue.duration ?? Math.max(2, Math.round(styles[cue.kind].seconds * fps)),
  })).filter(({cue, duration}) => frame >= cue.from && frame < cue.from + duration)
    .sort((a, b) => (b.cue.priority ?? 0) - (a.cue.priority ?? 0)).slice(0, layerCaps[quality]);

  return <>{active.map(({cue: {priority: _priority, count: requested, ...cue}, index, duration}) => {
    const {motion, color, count: preferred, opacity} = styles[cue.kind];
    const gain = Math.min(1.25, Math.max(0, intensity * (cue.intensity ?? 1)));
    const desired = requested ?? preferred;
    const count = Math.min(remaining, Math.floor(desired));
    if (!Number.isFinite(count) || count <= 0 || gain <= 0 || cue.opacity === 0) return null;
    remaining -= count;
    return <Accent key={index} {...{motion, color, opacity}} {...cue} frame={frame} duration={duration}
      theme={theme} count={count} budget={count} intensity={gain}
      seed={cue.seed ?? [cue.kind, cue.from, index].join('-')} />;
  })}</>;
}

export function ToyTrail({quality = 'balanced', ...props}: Parameters<typeof MotionTrail>[0] & {quality?: ToyboxQuality}) {
  return <MotionTrail theme={TOY_EFFECT_THEME} opacity={0.56} motion="soft"
    samples={trailCaps[quality]} {...props} budget={trailCaps[quality]} />;
}
