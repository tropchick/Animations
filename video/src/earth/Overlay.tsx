import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {SPIN0, V, ramp, spinKmh, windKmh} from './time';

const SERIF = "'Spectral', Georgia, serif";
const SANS = "'Inter', Helvetica, Arial, sans-serif";
const SHADOW = '0 2px 12px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.45)';
const HIGHLIGHT = '#f6c869';
const RED = '#ff6a5c';

const fade = (v: number, from: number, to: number, f = 0.3) =>
  interpolate(v, [from, from + f, to - f, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const kmh = (x: number) => `${Math.round(x).toLocaleString('en-US')} km/h`;

// ---------- HUD on the left, vertically centered ----------

const HudBlock: React.FC<{label: string; value: string; sub: string; opacity: number; valueColor?: string; pulse?: number}> = ({
  label,
  value,
  sub,
  opacity,
  valueColor = '#ffffff',
  pulse = 1,
}) => (
  <div style={{position: 'absolute', left: 0, top: 0, opacity, whiteSpace: 'nowrap'}}>
    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: 2.5, color: '#fff', textShadow: SHADOW}}>{label}</div>
    <div
      style={{
        fontFamily: SERIF,
        fontWeight: 400,
        fontSize: 104,
        lineHeight: 1.05,
        color: valueColor,
        textShadow: SHADOW,
        fontVariantNumeric: 'tabular-nums',
        transformOrigin: 'left center',
        scale: String(pulse),
      }}
    >
      {value}
    </div>
    <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 21, letterSpacing: 2.2, color: 'rgba(255,255,255,0.92)', textShadow: SHADOW, marginTop: 4}}>
      {sub}
    </div>
  </div>
);

const Hud: React.FC<{v: number}> = ({v}) => {
  const spin = spinKmh(v);
  const wind = windKmh(v);
  const zero = v >= V.zero && v < V.restart;
  const restarting = v >= V.restart && v < V.restored;
  const red = (v >= V.slowStart && spin < 300 && v < V.restart) || zero;
  const pulse = zero ? 1 + 0.06 * Math.max(0, Math.cos((v - V.zero) * Math.PI * 1.6)) : 1;
  const intro = ramp(v, 0.6, 1.3);
  const slow = zero ? '  ·  SLOW MOTION ×5' : restarting ? '  ·  SLOW MOTION ×8' : '';
  const label = restarting ? 'SPIN RESTARTING' : "EARTH'S SPIN";
  return (
    <div style={{position: 'absolute', left: 44, top: 860, opacity: intro}}>
      <HudBlock label={label} value={kmh(v >= V.restored ? SPIN0 : spin)} sub={`WIND ${kmh(wind)}${slow}`} opacity={1} valueColor={red ? RED : '#fff'} pulse={pulse} />
    </div>
  );
};

// ---------- Captions ----------

type Cap = [number, number, string];

const CAPTIONS: Cap[] = [
  [4.2, 6.1, 'Right now, you’re moving\nat 1,280 km/h.'],
  [6.2, 8.1, 'You just can’t feel it.'],
  [8.4, 11.0, 'The Earth starts to slow down.'],
  [11.2, 14.2, 'But everything on it\nkeeps moving.'],
  [14.5, 18.6, 'The ground slows down.\nThe air doesn’t.'],
  [18.9, 21.6, 'Wind: 60 km/h.\nAnd rising.'],
  [21.9, 25.8, 'The only safe place\nis underground.'],
  [26.1, 29.0, 'It feels like\nthe ground is tilting.'],
  [29.3, 32.4, 'Glass gives way first.'],
  [32.6, 34.6, 'Wind: 400 km/h.'],
  [34.8, 37.6, 'Stronger than any wind\never recorded.'],
  [37.8, 40.8, 'Sideways, the push is now\nstronger than gravity.'],
  [41.0, 44.4, 'The wind is almost\nat the speed of sound.'],
  [48.2, 50.4, 'The Earth has stopped.'],
  [50.6, 52.9, 'For one second.'],
  [53.2, 55.6, 'Then it starts spinning again.\nAll at once.'],
  [55.8, 58.4, 'The ground catches up with the air.\nThe wind stops.'],
  [58.6, 61.0, 'Everything else\ngets left behind.'],
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

export const Overlay: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const v = frame / fps;
  const flash = interpolate(v, [V.restart - 0.04, V.restart + 0.04, V.restart + 0.6], [0, 0.65, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const storm = ramp(v, 20, 46) * (v < V.restart ? 1 : 1 - ramp(v, V.restart, V.restart + 1));
  const zero = v >= V.zero && v < V.restart;
  const beat = zero ? Math.pow(Math.max(0, Math.sin((v - V.zero) * Math.PI * 1.2)), 14) : 0;
  const endDim = ramp(v, V.end - 1.2, V.end) * 0.6;
  const title = fade(v, 0.15, 4.0, 0.45);
  const ending = fade(v, 61.6, V.end + 1, 0.6);
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 48%, rgba(0,0,0,0.75) 100%)',
          opacity: 0.22 + storm * 0.35 + beat * 0.25,
        }}
      />
      <AbsoluteFill style={{background: '#ffffff', opacity: flash}} />
      <AbsoluteFill style={{background: 'rgba(10,12,18,1)', opacity: endDim}} />
      <Hud v={v} />
      {title > 0 ? (
        <Big opacity={title}>
          What if the Earth <span style={{color: HIGHLIGHT}}>stopped spinning</span>?
        </Big>
      ) : null}
      {CAPTIONS.map((c, i) => (
        <Caption key={i} v={v} cap={c} />
      ))}
      {ending > 0 ? (
        <Big opacity={ending}>
          Good thing the Earth
          <br />
          <span style={{color: HIGHLIGHT}}>can’t just stop.</span>
        </Big>
      ) : null}
    </AbsoluteFill>
  );
};
