import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {C_KMS, V, WEIGHT_KG, escapeKms, gAt, ramp} from './time';

const SERIF = "'Spectral', Georgia, serif";
const SANS = "'Inter', Helvetica, Arial, sans-serif";
const SHADOW = '0 2px 12px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.45)';
const HIGHLIGHT = '#f6c869';
const ORANGE = '#ffad5a';
const RED = '#ff6a5c';

const fade = (v: number, from: number, to: number, f = 0.3) =>
  interpolate(v, [from, from + f, to - f, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const num = (x: number) => Math.round(x).toLocaleString('en-US');

export const formatG = (g: number) => (g < 10 ? `${g.toFixed(1)} g` : `${num(g)} g`);

// ---------- HUD on the left, vertically centered ----------

const Hud: React.FC<{v: number}> = ({v}) => {
  const g = gAt(v);
  const hole = v >= V.blackHole;
  const label = hole ? 'BLACK HOLE' : "EARTH'S GRAVITY";
  const sub = hole
    ? 'ESCAPE VELOCITY = SPEED OF LIGHT'
    : v < V.space
      ? `YOU WEIGH ${num(WEIGHT_KG * g)} kg`
      : `ESCAPE VELOCITY ${num(Math.min(C_KMS, escapeKms(v)))} km/s`;
  const color = g >= 1000 ? RED : g >= 10 ? ORANGE : '#ffffff';
  const intro = ramp(v, 0.6, 1.3);
  const size = g >= 1e7 ? 84 : g >= 1e5 ? 92 : 104;
  return (
    <div style={{position: 'absolute', left: 44, top: 860, opacity: intro, whiteSpace: 'nowrap'}}>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: 2.5, color: '#fff', textShadow: SHADOW}}>{label}</div>
      <div style={{fontFamily: SERIF, fontWeight: 400, fontSize: size, lineHeight: 1.05, color, textShadow: SHADOW, fontVariantNumeric: 'tabular-nums'}}>{formatG(g)}</div>
      <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 21, letterSpacing: 2.2, color: 'rgba(255,255,255,0.92)', textShadow: SHADOW, marginTop: 4}}>{sub}</div>
    </div>
  );
};

// ---------- Captions ----------

type Cap = [number, number, string];

const CAPTIONS: Cap[] = [
  [4.3, 6.2, 'Right now, Earth pulls you\ndown with 1 g.'],
  [6.3, 8.1, 'You weigh exactly\nwhat you should.'],
  [8.4, 11.0, 'Gravity starts to grow.'],
  [11.2, 15.8, 'Everything falls\na little faster.'],
  [16.1, 18.9, 'At 2 g, you weigh\ntwice as much.'],
  [19.1, 22.1, 'Planes need much more speed\nto stay in the air.'],
  [22.3, 25.0, 'Standing up, blood\ncan’t reach your brain.'],
  [25.2, 28.1, 'Lie down. It’s the only way\nto stay awake.'],
  [28.4, 31.3, 'Most buildings can hold about\ntwice their own weight.'],
  [31.6, 34.0, 'Not twelve times.'],
  [34.3, 35.9, 'Bridges go next.'],
  [36.1, 37.9, 'Then the mountains.'],
  [38.2, 40.5, 'The air is squeezed into a layer\nthinner than a skyscraper.'],
  [40.7, 42.0, 'The sky turns black.'],
  [42.2, 44.2, 'Even mountains can’t hold\ntheir own weight.'],
  [44.3, 45.9, 'Earth is getting flattened.'],
  [46.3, 49.9, 'Satellites fall\nout of the sky.'],
  [50.2, 52.2, 'Then the Moon\nstarts to fall.'],
  [52.3, 54.0, 'It’s torn apart\nbefore it hits.'],
  [54.3, 57.9, 'Escape velocity reaches\nthe speed of light.'],
  [58.3, 61.3, 'Earth is now\na black hole.'],
];

const Caption: React.FC<{v: number; cap: Cap}> = ({v, cap}) => {
  const [from, to, text] = cap;
  const o = fade(v, from, to);
  if (o <= 0) return null;
  const rise = interpolate(o, [0, 1], [14, 0]);
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        top: 1250,
        textAlign: 'center',
        fontFamily: SERIF,
        fontStyle: 'italic',
        fontWeight: 500,
        fontSize: 62,
        lineHeight: 1.18,
        color: '#fff',
        textShadow: SHADOW,
        whiteSpace: 'pre-line',
        opacity: o,
        translate: `0px ${rise}px`,
      }}
    >
      {text}
    </div>
  );
};

const Big: React.FC<{opacity: number; children: React.ReactNode}> = ({opacity, children}) => (
  <div
    style={{
      position: 'absolute',
      left: 70,
      right: 70,
      top: 430,
      textAlign: 'center',
      fontFamily: SERIF,
      fontWeight: 400,
      fontSize: 84,
      lineHeight: 1.12,
      color: '#fff',
      textShadow: SHADOW,
      opacity,
      translate: `0px ${interpolate(opacity, [0, 1], [18, 0])}px`,
    }}
  >
    {children}
  </div>
);

export const Overlay: React.FC<{v: number}> = ({v}) => {
  const strain = ramp(v, 22, 44) * (v < V.space ? 1 : 0.3);
  const flash = interpolate(v, [V.space - 0.25, V.space, V.space + 0.5], [0, 0.9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const endDim = ramp(v, V.end - 1.2, V.end) * 0.6;
  const title = fade(v, 0.15, 4.0, 0.45);
  const ending = fade(v, 61.6, V.end + 1, 0.6);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 48%, rgba(0,0,0,0.75) 100%)', opacity: 0.22 + strain * 0.35}} />
      <AbsoluteFill style={{background: '#ffffff', opacity: flash}} />
      <AbsoluteFill style={{background: 'rgba(4,5,8,1)', opacity: endDim}} />
      <Hud v={v} />
      {title > 0 ? (
        <Big opacity={title}>
          What if gravity <span style={{color: HIGHLIGHT}}>kept getting stronger</span>?
        </Big>
      ) : null}
      {CAPTIONS.map((c, i) => (
        <Caption key={i} v={v} cap={c} />
      ))}
      {ending > 0 ? (
        <Big opacity={ending}>
          Luckily, gravity
          <br />
          <span style={{color: HIGHLIGHT}}>doesn’t change.</span>
        </Big>
      ) : null}
    </AbsoluteFill>
  );
};
