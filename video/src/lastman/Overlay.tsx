import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {C, CAPS, Shot, clamp01, ramp, shotAt, shotStart, smooth} from './cues';
import {SANS, SERIF} from './tex';

const YELLOW = '#ffd84a';
const RED = '#ff3b30';
const fade = (v: number, from: number, to: number, fi = 0.15, fo = 0.18) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const SHADOW = '0 3px 0 rgba(0,0,0,0.55), 0 0 18px rgba(0,0,0,0.75), 0 0 4px rgba(0,0,0,0.9)';

// ---------- the title over the first shot ----------

const Title: React.FC<{v: number}> = ({v}) => {
  const o = fade(v, 0, shotStart('radio'), 0.01, 0.3);
  if (o <= 0) return null;
  const line = (i: number) => {
    const k = smooth(ramp(v, 0.1 + i * 0.25, 0.45 + i * 0.25));
    return {opacity: k, transform: `translateY(${(1 - k) * 30}px)`};
  };
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 300, textAlign: 'center', opacity: o, fontFamily: SERIF, color: '#fff', textShadow: SHADOW}}>
      <div style={{fontSize: 78, fontWeight: 400, lineHeight: 1.1, ...line(0)}}>Что если ты остался</div>
      <div style={{fontSize: 104, fontWeight: 700, lineHeight: 1.08, color: RED, ...line(1)}}>последним мужчиной</div>
      <div style={{fontSize: 78, fontWeight: 400, lineHeight: 1.1, ...line(2)}}>на планете?</div>
    </div>
  );
};

// ---------- the counter on the left: where you are, and how many men are left ----------

const PLACES: [Shot, string, string][] = [
  ['mirror', 'МОСКВА', 'ДЕНЬ 1'],
  ['porch', 'ДЕРЕВНЯ', 'ДЕНЬ 2'],
  ['lab', 'ЛАБОРАТОРИЯ', 'ДЕНЬ 4'],
  ['roof', 'МОСКВА', 'ДЕНЬ 30'],
];
const placeAt = (v: number) => {
  let cur = PLACES[0];
  for (const p of PLACES) if (v >= shotStart(p[0])) cur = p;
  return cur;
};

const Hud: React.FC<{v: number}> = ({v}) => {
  if (v < C.hudIn || v >= shotStart('final')) return null;
  const inK = smooth(ramp(v, C.hudIn, C.hudIn + 0.35));
  const outK = 1 - clamp01((v - shotStart('final') + 0.3) / 0.3);
  // to the centre, bigger, for the flip from 1 to 2
  const c = smooth(ramp(v, shotStart('counter'), shotStart('counter') + 0.45));
  const flipped = v >= C.flip;
  const pop = flipped ? Math.exp(-(v - C.flip) * 6) : 0;
  const [placeShot, place, day] = placeAt(v);
  const placeFrom = shotStart(placeShot);
  const placePop = v >= C.hudIn + 0.5 ? Math.exp(-(v - placeFrom) * 6) : 0;
  const x = interpolate(c, [0, 1], [54, 540]);
  const y = interpolate(c, [0, 1], [640, 860]);
  const sc = interpolate(c, [0, 1], [1, 1.9]) * (1 + 0.25 * pop);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${-50 * c}%, -50%) scale(${sc}) translateX(${(1 - inK) * -80}px)`,
        transformOrigin: c > 0.5 ? '50% 50%' : '0% 50%',
        opacity: inK * outK,
        textAlign: c > 0.5 ? 'center' : 'left',
        fontFamily: SANS,
        color: '#fff',
        textShadow: SHADOW,
      }}
    >
      <div style={{fontSize: 36, fontWeight: 800, letterSpacing: 2, opacity: 1 - c, transform: `scale(${1 + 0.15 * placePop})`, transformOrigin: '0 50%'}}>
        {place} <span style={{color: YELLOW}}>· {day}</span>
      </div>
      <div style={{fontSize: 34, fontWeight: 600, letterSpacing: 1.5, marginTop: 10, opacity: 0.92}}>МУЖЧИН НА ЗЕМЛЕ</div>
      <div style={{fontSize: 150, fontWeight: 800, lineHeight: 1, color: flipped ? YELLOW : RED, marginTop: 4, fontVariantNumeric: 'tabular-nums'}}>{flipped ? 2 : 1}</div>
    </div>
  );
};

// ---------- captions ----------

const Caption: React.FC<{v: number; cap: [number, number, string, string]}> = ({v, cap}) => {
  const [from, to, text, kind] = cap;
  if (kind === 'end') return null;
  const o = fade(v, from, to);
  if (o <= 0) return null;
  const k = smooth(ramp(v, from, from + 0.2));
  const quote = kind === 'quote';
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 1300, textAlign: 'center', opacity: o, transform: `translateY(${(1 - k) * 16}px)`}}>
      <span
        style={{
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 66,
          lineHeight: 1.18,
          color: quote ? YELLOW : '#ffffff',
          textShadow: SHADOW,
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ---------- looking out through the hot dog costume's face hole ----------

const BUN: Shot[] = ['metro', 'wagon', 'shop', 'net', 'turn', 'run', 'train'];
const Bun: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v);
  if (!BUN.includes(s.name)) return null;
  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(ellipse 66% 50% at 50% 47%, rgba(0,0,0,0) 78%, rgba(150,84,30,0.55) 88%, rgba(196,120,52,0.96) 95%, rgba(160,92,36,1) 100%)',
      }}
    />
  );
};

// ---------- the end card ----------

const Final: React.FC<{v: number}> = ({v}) => {
  const from = shotStart('final');
  if (v < from) return null;
  const k = smooth(ramp(v, from, from + 0.4));
  const end = CAPS.find((c) => c[3] === 'end');
  const q = end ? smooth(ramp(v, end[0], end[0] + 0.3)) : 0;
  return (
    <AbsoluteFill style={{background: `rgba(6,8,16,${0.62 * k})`}}>
      <div style={{position: 'absolute', left: 60, right: 60, top: 620, textAlign: 'center', fontFamily: SERIF, color: '#fff', textShadow: SHADOW, opacity: k}}>
        <div style={{fontSize: 74, lineHeight: 1.12}}>Что если ты остался</div>
        <div style={{fontSize: 96, fontWeight: 700, lineHeight: 1.1, color: RED}}>последним мужчиной</div>
        <div style={{fontSize: 74, lineHeight: 1.12}}>на планете?</div>
        <div style={{marginTop: 90, fontSize: 112, fontStyle: 'italic', fontWeight: 500, color: YELLOW, opacity: q, transform: `scale(${0.85 + 0.15 * q})`}}>
          {end ? end[2] : ''}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Overlay: React.FC<{v: number}> = ({v}) => (
  <AbsoluteFill>
    <Bun v={v} />
    <Title v={v} />
    <Hud v={v} />
    {CAPS.map((c, i) => (
      <Caption key={i} v={v} cap={c} />
    ))}
    <Final v={v} />
  </AbsoluteFill>
);
