import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {REF, heightAt, speedAt} from './physics';
import {HEROES} from './objects';
import {V, W, ramp, slowMotion, videoTime, worldTime} from './time';

const SERIF = "'Spectral', Georgia, serif";
const SANS = "'Inter', Helvetica, Arial, sans-serif";
const SHADOW = '0 2px 12px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.4)';
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
    <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 21, letterSpacing: 2.2, color: 'rgba(255,255,255,0.9)', textShadow: SHADOW, marginTop: 4}}>
      {sub}
    </div>
  </div>
);

const IMPACT_SPEED = Math.round(Math.abs(REF.vs[REF.vs.length - 1]) * 3.6);
const SKY_TIME = Math.round(REF.impactW - W.flip);
const SKY_END = videoTime(REF.impactW) + 1.2;

const slowLabel = (v: number) => {
  const s = slowMotion(v);
  if (s < 1.4) return '';
  return `  ·  SLOW MOTION ×${s >= 4 ? Math.round(s) : (Math.round(s * 2) / 2).toString()}`;
};

const Hud: React.FC<{v: number}> = ({v}) => {
  const w = worldTime(v);
  const left = Math.max(0, Math.min(5, 5 - (v - V.countdownStart)));
  const ss = Math.floor(left);
  const tenth = Math.floor((left - ss) * 10);
  const countdown = `00:0${ss}.${tenth}`;
  const red = left <= 3 && v < V.flip;
  const pulse = red ? 1 + 0.06 * Math.max(0, Math.cos((left % 1) * Math.PI * 2)) : 1;

  const h = Math.max(0, heightAt(REF, w));
  const sp = Math.abs(speedAt(REF, w)) * 3.6;

  const a = 1 - ramp(v, V.flip, V.flip + 0.25);
  const b = ramp(v, V.flip + 0.1, V.flip + 0.4) * (1 - ramp(v, V.restore, V.restore + 0.25));
  const c = ramp(v, V.restore + 0.1, V.restore + 0.4) * (1 - ramp(v, SKY_END, SKY_END + 0.3));
  const d = ramp(v, SKY_END + 0.3, SKY_END + 0.6);
  const intro = ramp(v, 0.6, 1.3);
  return (
    <div style={{position: 'absolute', left: 44, top: 860, opacity: intro}}>
      {a > 0 ? (
        <HudBlock label="GRAVITY FLIPS IN" value={countdown} sub="GRAVITY 9.8 m/s²  DOWN" opacity={a} valueColor={red ? '#ff6a5c' : '#fff'} pulse={pulse} />
      ) : null}
      {b > 0 ? (
        <HudBlock label="GRAVITY FLIPPED" value={`${Math.min(10, w - W.flip).toFixed(1)} s`} sub={`HEIGHT ${Math.round(h)} m${slowLabel(v)}`} opacity={b} />
      ) : null}
      {c > 0 ? (
        <HudBlock
          label="GRAVITY RESTORED"
          value={`${Math.round(h)} m`}
          sub={`SPEED ${Math.round(sp)} km/h  ${speedAt(REF, w) >= 0 ? 'UP' : 'DOWN'}${slowLabel(v)}`}
          opacity={c}
        />
      ) : null}
      {d > 0 ? <HudBlock label="TIME IN THE SKY" value={`${SKY_TIME} s`} sub={`IMPACT SPEED ${IMPACT_SPEED} km/h`} opacity={d} /> : null}
    </div>
  );
};

// ---------- Title and captions ----------

type Cap = [number, number, string];

const CAPTIONS: Cap[] = [
  [2.4, 4.6, 'A busy Saturday downtown.'],
  [4.8, 6.9, 'Nothing here is bolted down.'],
  [7.1, 9.4, 'Down becomes up.'],
  [9.6, 12.2, 'Everything falls…\ninto the sky.'],
  [12.4, 15.7, 'Grab something. Anything.'],
  [15.9, 18.7, 'A 12-ton bus.\nFalling upward.'],
  [18.9, 21.8, 'Trees. Cars.\nThe whole fountain.'],
  [22.0, 25.0, 'After 5 seconds:\n100 meters up.'],
  [25.2, 28.6, 'Hanging upside down,\nblood rushes to your head.'],
  [28.8, 33.2, 'Your grip is all that keeps you\nfrom falling into the sky.'],
  [33.5, 36.8, 'Higher than\nthe Eiffel Tower.'],
  [37.1, 39.8, 'Gravity is back.'],
  [40.0, 43.4, 'But everything up there\nis still flying up.'],
  [43.6, 47.0, 'Then it stops.\n440 meters up.'],
  [47.2, 49.6, 'What goes up…'],
  [49.8, 52.2, '…must come down.'],
  [52.5, 55.6, 'At 190 km/h.'],
  [57.3, 60.6, 'Everyone held on.\nThe city didn’t.'],
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
        left: 80,
        right: 80,
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
  const flash = (at: number, peak: number, len = 0.45) =>
    interpolate(v, [at - 0.04, at + 0.04, at + len], [0, peak, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const flashes =
    flash(V.flip, 0.55) + flash(V.restore, 0.3) + flash(videoTime(HEROES.bus.f.impactW), 0.22) + flash(videoTime(HEROES.fountainCar.f.impactW), 0.15);
  const flipped = v > V.flip && v < V.restore;
  const beat = flipped ? Math.pow(Math.max(0, Math.sin(v * Math.PI * (0.9 + ramp(v, 25, 37) * 0.6))), 16) : 0;
  const endDim = ramp(v, 60.6, 61.6) * 0.45;
  const title = fade(v, 0.15, 6.6, 0.45);
  const ending = fade(v, 60.8, 65.4, 0.5);
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.75) 100%)',
          opacity: flipped ? 0.45 + beat * 0.25 : 0.25,
        }}
      />
      <AbsoluteFill style={{background: 'rgba(10,12,18,1)', opacity: endDim}} />
      <AbsoluteFill style={{background: '#ffffff', opacity: Math.min(0.7, flashes)}} />
      <Hud v={v} />
      {title > 0 ? (
        <Big opacity={title}>
          What if <span style={{color: HIGHLIGHT}}>gravity flipped</span> for 10 seconds?
        </Big>
      ) : null}
      {CAPTIONS.map((c, i) => (
        <Caption key={i} v={v} cap={c} />
      ))}
      {ending > 0 ? (
        <Big opacity={ending}>
          <span style={{color: HIGHLIGHT}}>10 seconds.</span>
          <br />
          That’s all it took.
        </Big>
      ) : null}
    </AbsoluteFill>
  );
};
