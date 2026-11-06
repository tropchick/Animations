import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {COND, YELLOW} from '../gta/Overlay';
import {DARK, GROUPS, Shot, WORDS, clockAt, shotAt} from './cues';
import {EYE} from './World';

const PLATE = 'rgba(16,12,20,0.84)';
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const two = (n: number) => String(Math.floor(n)).padStart(2, '0');

// ---------- the time stamp at the top ----------

const STAMPS: Partial<Record<Shot, string>> = {
  dark: '12:08:20',
  moon: '12:08:21 · НОЧНАЯ СТОРОНА',
  stars: '12:09',
  jupiter: '13:30',
  orbit: 'ДЕНЬ 1',
  grid: 'ДЕНЬ 1, 18:00',
  snow: 'ДЕНЬ 7',
  field: 'ДЕНЬ 14',
  airport: 'ДЕНЬ 30',
  greenhouse: 'ДЕНЬ 60',
  ice: 'ГОД 1',
  vent: 'ГОД 1',
  icecream: 'ГОД 1',
};
const TEMPS: Partial<Record<Shot, string>> = {
  snow: '−18 °C',
  ice: '−73 °C',
};

const stampText = (v: number, name: Shot) => {
  if (name === 'beach' || name === 'gap' || name === 'kiosk' || (name === 'dark' && v < DARK)) {
    const s = clockAt(v);
    return `12:${two(s / 60)}:${two(s % 60)}`;
  }
  return STAMPS[name];
};

const Plate: React.FC<{text: string; color?: string; size?: number; pop?: number; border?: string}> = ({text, color = YELLOW, size = 56, pop = 0, border = 'rgba(255,255,255,0.12)'}) => (
  <div
    style={{
      display: 'inline-block',
      background: PLATE,
      borderRadius: 18,
      padding: '6px 26px 10px',
      fontFamily: COND,
      fontWeight: 600,
      fontSize: size,
      lineHeight: 1.15,
      letterSpacing: 1,
      color,
      transform: `scale(${1 + 0.14 * pop})`,
      boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
      border: `3px solid ${border}`,
      fontVariantNumeric: 'tabular-nums',
    }}
  >
    {text}
  </div>
);

const Stamp: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v);
  const text = stampText(v, s.name);
  if (!text) return null;
  const prev = shotAt(s.from - 0.01);
  const changed = s.from === 0 || stampText(s.from - 0.01, prev.name) !== stampText(s.from + 0.001, s.name);
  const pop = changed ? Math.exp(-s.t * 5) : 0;
  const o = s.from === 0 ? clamp(v / 0.15) : changed ? clamp(s.t / 0.12) : 1;
  const darkNow = s.name === 'dark' && v >= DARK;
  const popDark = darkNow ? Math.exp(-(v - DARK) * 5) : pop;
  const temp = TEMPS[s.name];
  // the countdown to the dark
  const left = Math.max(0, 500 - clockAt(v));
  const countdown = v < DARK + 1.2 && (s.name === 'beach' || s.name === 'gap' || s.name === 'kiosk' || s.name === 'dark');
  const cdO = v < DARK ? 1 : 1 - clamp((v - DARK - 0.7) / 0.4);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', opacity: o}}>
      <Plate text={text} pop={popDark} color={darkNow ? '#ff6a5a' : YELLOW} border={darkNow ? '#ff4d4d' : undefined} />
      {countdown ? (
        <div style={{marginTop: 14, opacity: cdO}}>
          <Plate text={`ТЕМНОТА ЧЕРЕЗ ${two(left / 60)}:${two(left % 60)}`} size={44} color={left < 60 ? '#ff6a5a' : '#ffffff'} />
        </div>
      ) : null}
      {temp ? (
        <div style={{marginTop: 14, opacity: clamp((s.t - 0.25) / 0.15)}}>
          <Plate text={`${temp} в среднем по Земле`} size={44} color="#9fd4ff" />
        </div>
      ) : null}
    </div>
  );
};

// ---------- the eyepiece: everything but a circle is black ----------

const Eyepiece: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v);
  if (s.name !== 'jupiter' || v < EYE) return null;
  return <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 46%, rgba(0,0,0,0) 0, rgba(0,0,0,0) 414px, rgba(70,80,100,0.9) 418px, rgba(70,80,100,0.9) 426px, rgba(0,0,0,1) 430px)'}} />;
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

export const Overlay: React.FC<{v: number}> = ({v}) => (
  <AbsoluteFill>
    <Eyepiece v={v} />
    <Stamp v={v} />
    {GROUPS.map((_, g) => (
      <Caption key={g} v={v} g={g} />
    ))}
  </AbsoluteFill>
);
