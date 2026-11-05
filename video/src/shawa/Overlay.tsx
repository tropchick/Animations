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
  marker: 'ДЕНЬ 1, 11:59',
  copy: 'ДЕНЬ 1, 12:00',
  deck: 'ДЕНЬ 30',
};
const RED: Partial<Record<Shot, boolean>> = {marker: true, copy: true};

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

// ---------- the tape rewind ----------

const Rewind: React.FC<{v: number}> = ({v}) => {
  const a = shotStart('rewind');
  const b = shotEnd('rewind');
  if (v < a - 0.05 || v > b + 0.25) return null;
  const k = clamp((v - a) / (b - a));
  const after = v > b ? 1 - (v - b) / 0.25 : 1;
  const lines = Array.from({length: 7}).map((_, i) => {
    const y = ((i * 297 + v * 2600) % 1920 + 1920) % 1920;
    return <div key={i} style={{position: 'absolute', left: 0, right: 0, top: y, height: 10 + (i % 3) * 8, background: 'rgba(255,255,255,0.35)', mixBlendMode: 'screen'}} />;
  });
  return (
    <AbsoluteFill style={{opacity: after}}>
      {v <= b ? <AbsoluteFill style={{background: 'rgba(40,10,30,0.25)'}} /> : null}
      {v <= b ? lines : null}
      <div style={{position: 'absolute', left: 0, right: 0, top: 820, textAlign: 'center', fontFamily: COND, fontWeight: 600, fontSize: 150, color: '#fff', textShadow: '0 0 30px rgba(255,60,60,0.9)', opacity: v <= b ? 0.6 + 0.4 * Math.round((Math.sin(k * 30) + 1) / 2) : 1}}>
        ◀◀
      </div>
    </AbsoluteFill>
  );
};

export const Overlay: React.FC<{v: number}> = ({v}) => (
  <AbsoluteFill>
    <DateStamp v={v} />
    <Rewind v={v} />
    {GROUPS.map((_, g) => (
      <Caption key={g} v={v} g={g} />
    ))}
  </AbsoluteFill>
);
