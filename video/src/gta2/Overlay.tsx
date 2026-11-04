import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {COND, YELLOW} from '../gta/Overlay';
import {GROUPS, NET_DOWN, POP, Shot, WORDS, shotAt} from './cues';

const PLATE = 'rgba(16,12,20,0.84)';

const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// ---------- the date stamp at the top: shows that each step follows the last ----------

const DATES: Partial<Record<Shot, string>> = {
  bill: '19 НОЯБРЯ, 00:01',
  fan: '19 НОЯБРЯ, 00:01',
  refund: '19 НОЯБРЯ, 00:05',
  servers: '19 НОЯБРЯ, 00:07',
  chart: '19 НОЯБРЯ, 09:30',
  domino: '19 НОЯБРЯ, 11:00',
  bubble: 'ДЕКАБРЬ 2026',
  crisis: 'ДЕКАБРЬ 2026',
  studio: 'ФЕВРАЛЬ 2027',
  repaint: 'ФЕВРАЛЬ 2027',
  leak: 'МАРТ 2027',
  globe: 'МАРТ 2027, 03:00',
  card: 'АПРЕЛЬ 2027',
  shelf: 'АПРЕЛЬ 2027',
  burn: 'АПРЕЛЬ 2027',
  find: '2037 · ЧЕРЕЗ 10 ЛЕТ',
};

const DateStamp: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v);
  const text = DATES[s.name];
  if (!text) return null;
  // pop when the date changes
  const prevText = (() => {
    const p = shotAt(s.from - 0.01);
    return p.name === s.name ? undefined : DATES[p.name];
  })();
  const changed = prevText !== text;
  const pop = changed ? Math.exp(-s.t * 5) : 0;
  const o = changed ? clamp(s.t / 0.12) : 1;
  const last = s.name === 'find' || s.name === 'setup';
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
          color: last ? '#ff6a5a' : YELLOW,
          transform: `scale(${1 + 0.14 * pop})`,
          boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
          border: last ? '3px solid #ff4d4d' : '3px solid rgba(255,255,255,0.12)',
        }}
      >
        {text}
      </div>
    </div>
  );
};

const clamp = (x: number) => Math.max(0, Math.min(1, x));

// ---------- karaoke captions ----------

const Caption: React.FC<{v: number; g: number}> = ({v, g}) => {
  const pieces = GROUPS[g];
  const words = WORDS.filter((w) => pieces.includes(w[3]));
  if (!words.length) return null;
  const start = words[0][0] - 0.1;
  const nextGroup = GROUPS[g + 1] ? WORDS.find((w) => GROUPS[g + 1].includes(w[3])) : undefined;
  const end = Math.min(words[words.length - 1][1] + 0.45, nextGroup ? nextGroup[0] - 0.08 : 1e9);
  const o = fade(v, start, end, 0.08, 0.12);
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

const flash = (v: number, at: number, decay: number) => (v >= at ? Math.exp(-(v - at) * decay) : 0);

export const Overlay: React.FC<{v: number}> = ({v}) => {
  const white = Math.max(flash(v, POP, 7) * 0.55, flash(v, NET_DOWN, 4) * 0.8);
  return (
    <AbsoluteFill>
      {white > 0.01 ? <AbsoluteFill style={{background: '#fff', opacity: Math.min(1, white)}} /> : null}
      <DateStamp v={v} />
      {GROUPS.map((_, g) => (
        <Caption key={g} v={v} g={g} />
      ))}
    </AbsoluteFill>
  );
};
