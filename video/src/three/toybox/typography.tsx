import type {CSSProperties, ReactNode} from 'react';
import '@fontsource/rubik/800.css';
import '@fontsource/inter/700.css';
import '@fontsource/ibm-plex-mono/600.css';
import {continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  AnimatedCounter, AnimatedHUD, KaraokeCaptions, KineticText, SafeArea, SHORT_VERTICAL_INSETS, WorldText,
} from '../../hyper-motion-examples/typography';

export const TOY_TYPE = {
  headline: {family: 'Rubik', weight: 800, size: 84, tracking: '-0.045em'},
  technical: {family: 'IBM Plex Mono', weight: 600, size: 62, tracking: '-0.05em'},
  soft: {family: 'Inter', weight: 700, size: 70, tracking: '-0.05em'},
} as const;

type TypeVariant = keyof typeof TOY_TYPE;
const cream = '#fff2df';
const ink = '#203249';
const amber = '#ffbf47';
const cyrillicSample = 'Игрушечный мир Ёё 0123456789';

if (typeof document !== 'undefined' && document.fonts) {
  const fontHandle = delayRender('Loading Toybox Cyrillic fonts');
  Promise.all(Object.values(TOY_TYPE).map(({weight, family}) =>
    document.fonts.load([weight, '72px', '"' + family + '"'].join(' '), cyrillicSample),
  )).then(() => continueRender(fontHandle), () => continueRender(fontHandle));
}

function plate(accent: string, scale: number): CSSProperties {
  return {
    display: 'inline-grid', justifyItems: 'start', color: ink, background: cream,
    border: [3 * scale + 'px', 'solid', ink].join(' '), borderRadius: 26 * scale,
    boxShadow: [0, 6 * scale + 'px', 0, ink, ', 0', 10 * scale + 'px', 24 * scale + 'px #20324925'].join(' '),
    padding: [16 * scale + 'px', 26 * scale + 'px'].join(' '),
    outline: [4 * scale + 'px', 'solid', 'color-mix(in srgb, ' + accent + ' 74%, transparent)'].join(' '),
    outlineOffset: 4 * scale,
  };
}

function font(variant: TypeVariant): CSSProperties {
  const {family, tracking, weight} = TOY_TYPE[variant];
  return {fontFamily: ['"' + family + '"', 'Arial', 'sans-serif'].join(', '),
    fontWeight: weight, letterSpacing: tracking};
}

export function ToySafeArea({children, insets, style}: Parameters<typeof SafeArea>[0]) {
  const {width, height} = useVideoConfig();
  const {top, right, bottom, left} = {...SHORT_VERTICAL_INSETS, ...insets};
  // Set the shorthand so Remotion's AbsoluteFill style does not reset the edge offsets.
  const inset = [top * height, right * width, bottom * height, left * width].map((px) => px + 'px').join(' ');
  return <SafeArea style={{inset, ...style}}>{children}</SafeArea>;
}

/** Headline outside the action. Keep a single short label if it supplies story context. */
export function ToyTitle({title, label, from = 0, to, variant = 'headline', accent = amber,
  position = 'top', frame: suppliedFrame, intensity = 0.8}: {
  title: string;
  label?: string;
  from?: number;
  to?: number;
  variant?: TypeVariant;
  accent?: string;
  position?: 'top' | 'bottom';
  frame?: number;
  intensity?: number;
}) {
  const localFrame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const frame = suppliedFrame ?? localFrame;
  if (frame < from || (to !== undefined && frame >= to)) return null;
  const scale = Math.min(width / 1080, height / 1920);
  const opacity = to === undefined ? 1 : Math.min(1, (to - frame - 1) / Math.max(1, Math.round(fps * 0.24)));
  return <ToySafeArea style={{display: 'flex', flexDirection: 'column',
    justifyContent: position === 'top' ? 'flex-start' : 'flex-end', alignItems: 'flex-start', opacity}}>
    <KineticText from={from} duration={Math.max(1, Math.round(fps * 0.33))}
      frame={frame} emphasis intensity={intensity} style={{maxWidth: '100%'}}>
      <span style={{...plate(accent, scale), ...font(variant), maxWidth: '100%', boxSizing: 'border-box',
        gap: 7 * scale, fontSize: TOY_TYPE[variant].size * scale, lineHeight: 0.98, textWrap: 'balance'}}>
        {label && <small style={{...font('technical'), color: ink, background: accent, borderRadius: 8 * scale,
          padding: [5 * scale + 'px', 10 * scale + 'px'].join(' '), fontSize: 25 * scale, lineHeight: 1.1}}>
          {label}
        </small>}
        {title}
      </span>
    </KineticText>
  </ToySafeArea>;
}

/** Inline prop labels, dates, multipliers and counter callouts share the plate shape. */
export function ToyLabel({children, accent = amber, variant = 'technical', style}: {
  children: ReactNode;
  accent?: string;
  variant?: TypeVariant;
  style?: CSSProperties;
}) {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1080, height / 1920);
  return <span style={{...plate(accent, scale * 0.72), ...font(variant), fontSize: 39 * scale,
    lineHeight: 1.05, ...style}}>{children}</span>;
}

type CounterProps = Parameters<typeof AnimatedCounter>[0];
export function ToyCounter({accent, variant, style, ...props}: CounterProps & {
  accent?: string;
  variant?: TypeVariant;
}) {
  return <ToyLabel accent={accent} variant={variant} style={style}><AnimatedCounter {...props} /></ToyLabel>;
}

export function ToyGauge({accent = '#43d9ad', style, ...props}: Parameters<typeof AnimatedHUD>[0]) {
  return <AnimatedHUD accent={accent} style={{...font('technical'), color: cream, background: ink,
    borderColor: accent, borderRadius: 20, ...style}} {...props} />;
}

export function ToyCaptions({accent = amber, ...props}: Parameters<typeof KaraokeCaptions>[0] & {accent?: string}) {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1080, height / 1920);
  return <ToySafeArea style={{display: 'flex', justifyContent: 'flex-end'}}>
    <KaraokeCaptions activeColor={accent} {...props}
      style={{...font('soft'), letterSpacing: 0, wordSpacing: '0.12em', fontSize: 49 * scale, ...props.style}} />
  </ToySafeArea>;
}

export function ToyWorldLabel(props: Parameters<typeof WorldText>[0]) {
  return <WorldText depth={0.052} bevel={0.009} color={cream} {...props} />;
}

/** One screen-space punctuation mark can complete a material 3D accent. */
export function ToyGraphicAccent({mark, x, y, from, duration = 10, hold = 8, color = amber}: {
  mark: '!' | '?' | '↗' | '✦';
  x: number;
  y: number;
  from: number;
  duration?: number;
  hold?: number;
  color?: string;
}) {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1080, height / 1920);
  return <div aria-hidden style={{position: 'absolute', left: x * width, top: y * height,
    pointerEvents: 'none', transform: 'translate(-50%, -50%)'}}>
    <KineticText {...{from, duration, hold}} emphasis>
      <span style={{...font('headline'), display: 'block', fontSize: 92 * scale, lineHeight: 1,
        color, WebkitTextStroke: 2.5 * scale + 'px ' + ink, paintOrder: 'stroke fill',
        textShadow: [0, 5 * scale + 'px', ink].join(' '), transform: 'rotate(-10deg)'}}>{mark}</span>
    </KineticText>
  </div>;
}
