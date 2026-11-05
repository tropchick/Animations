import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {COND, YELLOW} from '../gta/Overlay';
import {GROUPS, Shot, WORDS, shotAt, shotEnd, shotStart} from './cues';

const PLATE = 'rgba(16,12,20,0.84)';
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// ---------- the day stamp at the top ----------

const DATES: Partial<Record<Shot, string>> = {
  stall: 'ДЕНЬ 1, 12:00',
  bench: 'ДЕНЬ 1, 14:00',
  queue: 'ДЕНЬ 2',
  menu: 'ДЕНЬ 3',
  windows: 'ДЕНЬ 5',
  shop: 'ДЕНЬ 5',
  tags: 'ДЕНЬ 7',
  door: 'ДЕНЬ 10',
  wallet: 'ДЕНЬ 14',
  phone: 'ДЕНЬ 14',
  yacht: 'ДЕНЬ 20',
  rate: 'ДЕНЬ 22',
  bank: 'ДЕНЬ 25',
  propose: 'ДЕНЬ 27',
  flash: 'ДЕНЬ 1, 12:05',
  keys: 'ДЕНЬ 30',
  van: 'ДЕНЬ 30',
  inside: 'ДЕНЬ 30',
};
const RED: Partial<Record<Shot, boolean>> = {flash: true};

const DateStamp: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v);
  const text = DATES[s.name];
  if (!text) return null;
  const prev = shotAt(s.from - 0.01);
  const changed = prev.name === s.name || DATES[prev.name] !== text;
  const pop = changed ? Math.exp(-s.t * 5) : 0;
  const o = changed ? clamp(s.t / 0.12) : 1;
  const red = RED[s.name];
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', opacity: o}}>
      <div
        style={{
          display: 'inline-block',
          background: PLATE,
          borderRadius: 18,
          padding: '6px 26px 10px',
          fontFamily: COND,
          fontWeight: 600,
          fontSize: 56,
          lineHeight: 1.15,
          letterSpacing: 1,
          color: red ? '#ff6a5a' : YELLOW,
          transform: `scale(${1 + 0.14 * pop})`,
          boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
          border: red ? '3px solid #ff4d4d' : '3px solid rgba(255,255,255,0.12)',
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---------- karaoke captions ----------

const Caption: React.FC<{v: number; g: number}> = ({v, g}) => {
  const pieces = GROUPS[g];
  const words = WORDS.filter((w) => pieces.includes(w[3]));
  if (!words.length) return null;
  const start = words[0][0] - 0.1;
  const nextGroup = GROUPS[g + 1] ? WORDS.find((w) => GROUPS[g + 1].includes(w[3])) : undefined;
  const end = Math.min(words[words.length - 1][1] + 0.45, nextGroup ? nextGroup[0] - 0.12 : 1e9);
  const o = fade(v, start, end, 0.08, 0.1);
  if (o <= 0) return null;
  let cur = -1;
  words.forEach((w, i) => {
    if (v >= w[0] - 0.03) cur = i;
  });
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1330, textAlign: 'center', opacity: o}}>
      <div
        style={{
          display: 'inline-block',
          background: PLATE,
          borderRadius: 22,
          padding: '10px 28px 14px',
          fontFamily: COND,
          fontWeight: 600,
          fontSize: 62,
          lineHeight: 1.18,
          color: '#fff',
          boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
        }}
      >
        {words.map((w, i) => (
          <span key={i} style={{color: i === cur ? YELLOW : '#ffffff', display: i <= cur ? 'inline' : 'none'}}>
            {w[2]}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

// ---------- the flashback: a warm, faded look with a soft vignette ----------

const Flashback: React.FC<{v: number}> = ({v}) => {
  const a = shotStart('flash');
  const b = shotEnd('flash');
  if (v < a || v >= b) return null;
  const o = Math.min(1, (v - a) / 0.2, (b - v) / 0.15);
  return (
    <AbsoluteFill style={{opacity: o, pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'rgba(150,110,60,0.22)', mixBlendMode: 'multiply'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(30,15,5,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

export const Overlay: React.FC<{v: number}> = ({v}) => (
  <AbsoluteFill>
    <DateStamp v={v} />
    <Flashback v={v} />
    {GROUPS.map((_, g) => (
      <Caption key={g} v={v} g={g} />
    ))}
  </AbsoluteFill>
);
