import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {T, airAmount, ramp, secondsWithoutAir} from './timeline';

const SERIF = "'Spectral', Georgia, serif";
const SANS = "'Inter', Helvetica, Arial, sans-serif";
const SHADOW = '0 2px 12px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.35)';
const HIGHLIGHT = '#f6c869';

const fade = (v: number, from: number, to: number, f = 0.3) =>
  interpolate(v, [from, from + f, to - f, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

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
    <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 21, letterSpacing: 2.2, color: 'rgba(255,255,255,0.88)', textShadow: SHADOW, marginTop: 4}}>
      {sub}
    </div>
  </div>
);

const Hud: React.FC<{v: number}> = ({v}) => {
  const left = Math.max(0, Math.min(10, 10 - (v - T.countdownStart)));
  const ss = Math.floor(left);
  const tenth = Math.floor((left - ss) * 10);
  const countdown = `00:${String(ss).padStart(2, '0')}.${tenth}`;
  const red = left <= 3 && v < T.airGone;
  const pulse = red ? 1 + 0.06 * Math.max(0, Math.cos((left % 1) * Math.PI * 2)) : 1;

  const gone = secondsWithoutAir(v);
  const pressureDrop = Math.round(101 * (1 - ramp(v, T.airGone, T.airGone + 0.8)));

  const a = 1 - ramp(v, T.airGone, T.airGone + 0.25);
  const b = ramp(v, T.airGone + 0.1, T.airGone + 0.4) * (1 - ramp(v, T.airBack, T.airBack + 0.25));
  const c = ramp(v, T.airBack + 0.1, T.airBack + 0.4);
  const intro = ramp(v, 0.6, 1.3);

  return (
    <div style={{position: 'absolute', left: 44, top: 860, opacity: intro}}>
      {a > 0 ? (
        <HudBlock label="AIR DISAPPEARS IN" value={countdown} sub="PRESSURE 101 kPa" opacity={a} valueColor={red ? '#ff6a5c' : '#fff'} pulse={pulse} />
      ) : null}
      {b > 0 ? (
        <HudBlock
          label="TIME WITHOUT AIR"
          value={`${gone.toFixed(1)} s`}
          sub={`PRESSURE ${pressureDrop} kPa  ·  SLOW MOTION ×9`}
          opacity={b}
        />
      ) : null}
      {c > 0 ? <HudBlock label="AIR RESTORED" value="5.0 s" sub="PRESSURE 101 kPa" opacity={c} /> : null}
    </div>
  );
};

// ---------- Title and captions ----------

type Cap = [number, number, string];

const CAPTIONS: Cap[] = [
  [2.6, 5.8, 'A normal summer day.'],
  [6.2, 8.9, "Nobody knows what's coming."],
  [9.3, 11.95, 'Then, in an instant…'],
  [12.15, 13.95, 'The air is gone.'],
  [14.1, 16.3, 'No air means no sound.'],
  [16.5, 18.9, 'The sky turns black.\nYou can see stars at noon.'],
  [19.1, 20.95, 'No oxygen. Every flame dies.'],
  [21.2, 23.9, 'The air in your lungs rushes out.'],
  [24.1, 26.3, 'Your eardrums bulge outward.'],
  [26.6, 29.9, 'A balloon has nothing\nholding it in.'],
  [30.2, 32.45, 'With no air pressure,\nwater boils…'],
  [32.6, 34.45, "…even when it's cold."],
  [34.7, 38.9, 'The saliva on your tongue\nstarts to boil.'],
  [39.2, 43.5, 'The air inside your house\npushes the windows out.'],
  [43.8, 47.9, "Birds can't fly.\nNeither can planes."],
  [48.2, 52.8, 'You have about 10 seconds\nbefore you pass out.'],
  [53.2, 56.8, "You're halfway there."],
  [57.3, 59.9, 'The air comes back.'],
  [60.1, 62.85, 'It rushes into every empty room.'],
  [63.1, 65.6, 'Everyone survives.\nBut the world doesn’t sound the same.'],
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
        left: 90,
        right: 90,
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

const Title: React.FC<{v: number}> = ({v}) => {
  const o = fade(v, 0.15, 5.9, 0.45);
  if (o <= 0) return null;
  return (
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
        opacity: o,
        translate: `0px ${interpolate(o, [0, 1], [18, 0])}px`,
      }}
    >
      What if <span style={{color: HIGHLIGHT}}>the air disappeared</span> for 5 seconds?
    </div>
  );
};

const Ending: React.FC<{v: number}> = ({v}) => {
  const o = fade(v, 65.8, 68.4, 0.5);
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        top: 430,
        textAlign: 'center',
        fontFamily: SERIF,
        fontWeight: 400,
        fontSize: 86,
        lineHeight: 1.12,
        color: '#fff',
        textShadow: SHADOW,
        opacity: o,
      }}
    >
      <span style={{color: HIGHLIGHT}}>5 seconds.</span>
      <br />
      That’s all it took.
    </div>
  );
};

export const Overlay: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const v = frame / fps;
  const air = airAmount(v);
  // Heartbeat pulse in the darkness, faster near the end of the 5 seconds.
  const beat = v > T.airGone && v < T.airBack ? Math.pow(Math.max(0, Math.sin(v * Math.PI * (0.75 + ramp(v, 45, 56) * 0.6))), 16) : 0;
  const flash = interpolate(v, [T.airBack - 0.05, T.airBack + 0.05, T.airBack + 0.5], [0, 0.5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const endDim = ramp(v, 65.6, 66.6) * 0.45;
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.85) 100%)',
          opacity: (1 - air) * (0.55 + beat * 0.25),
        }}
      />
      <AbsoluteFill style={{background: 'rgba(10,12,18,1)', opacity: endDim}} />
      <AbsoluteFill style={{background: '#ffffff', opacity: flash}} />
      <Hud v={v} />
      <Title v={v} />
      {CAPTIONS.map((c, i) => (
        <Caption key={i} v={v} cap={c} />
      ))}
      <Ending v={v} />
    </AbsoluteFill>
  );
};
