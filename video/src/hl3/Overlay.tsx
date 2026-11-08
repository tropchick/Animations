import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {COND, YELLOW} from '../gta/Overlay';
import {FLASH, POPUP, WORDS, shotAt} from './cues';

const PLATE = 'rgba(14,12,18,0.84)';
const ORANGE = '#ff8a1c';
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const fade = (v: number, from: number, to: number, fi = 0.08, fo = 0.12) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// time stamp at the top: every step has its own time, so the chain reads like a chronicle
const DateStamp: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v);
  if (!s.date || v >= POPUP) return null; // the store notice takes the top of the frame
  const prev = shotAt(s.from - 0.01);
  const changed = prev === s || prev.date !== s.date;
  const t = v - s.from;
  const pop = changed ? Math.exp(-t * 5) : 0;
  const last = s.date === 'ВЕЧЕР';
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', opacity: changed ? clamp(t / 0.12) : 1}}>
      <div
        style={{
          display: 'inline-block', background: PLATE, borderRadius: 18, padding: '6px 26px 10px',
          fontFamily: COND, fontWeight: 600, fontSize: 56, lineHeight: 1.15, letterSpacing: 1,
          color: last ? '#ff6a5a' : YELLOW, transform: `scale(${1 + 0.14 * pop})`,
          boxShadow: '0 6px 24px rgba(0,0,0,0.35)', border: last ? '3px solid #ff4d4d' : '3px solid rgba(255,255,255,0.12)',
        }}
      >
        {s.date}
      </div>
    </div>
  );
};

// karaoke captions, one chunk at a time
const groups = Array.from(new Set(WORDS.map((w) => w[3])));
const Caption: React.FC<{v: number; g: number}> = ({v, g}) => {
  const words = WORDS.filter((w) => w[3] === g);
  const next = WORDS.find((w) => w[3] === g + 1);
  const start = words[0][0] - 0.1;
  const end = Math.min(words[words.length - 1][1] + 0.45, next ? next[0] - 0.08 : 1e9);
  const o = fade(v, start, end);
  if (o <= 0) return null;
  let cur = -1;
  words.forEach((w, i) => {
    if (v >= w[0] - 0.03) cur = i;
  });
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1330, textAlign: 'center', opacity: o}}>
      <div style={{display: 'inline-block', background: PLATE, borderRadius: 22, padding: '10px 28px 14px', fontFamily: COND, fontWeight: 600, fontSize: 62, lineHeight: 1.18, color: '#fff', boxShadow: '0 6px 24px rgba(0,0,0,0.35)'}}>
        {words.map((w, i) => (
          <span key={i} style={{color: i === cur ? YELLOW : '#fff', display: i <= cur ? 'inline' : 'none'}}>
            {w[2]}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

// the store notice that ends it all
const Popup: React.FC<{v: number}> = ({v}) => {
  const t = v - POPUP;
  if (t < 0) return null;
  const s = interpolate(t, [0, 0.18, 0.3], [0.6, 1.06, 1], {extrapolateRight: 'clamp'});
  const red = clamp((t - 2.7) / 0.25);
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top: 150, opacity: clamp(t / 0.12), transform: `scale(${s})`}}>
      <div style={{background: 'rgba(20,18,24,0.94)', borderRadius: 26, border: `4px solid ${ORANGE}`, padding: '26px 34px 30px', fontFamily: COND, boxShadow: '0 14px 50px rgba(0,0,0,0.6)', textAlign: 'center'}}>
        <div style={{fontSize: 44, fontWeight: 500, color: ORANGE, letterSpacing: 2}}>HALF-LIFE 3</div>
        <div style={{fontSize: 58, fontWeight: 600, color: '#fff', lineHeight: 1.15, marginTop: 10}}>Снята с продажи из-за инцидента</div>
        <div style={{fontSize: 58, fontWeight: 600, lineHeight: 1.15, marginTop: 16, color: red > 0 ? '#ff5a5a' : '#9a9aa6'}}>
          Новая дата: {red > 0 ? 'неизвестна' : '…'}
        </div>
      </div>
    </div>
  );
};

export const Overlay: React.FC<{v: number}> = ({v}) => {
  const white = v >= FLASH ? Math.exp(-(v - FLASH) * 3.5) : 0;
  return (
    <AbsoluteFill>
      {white > 0.01 ? <AbsoluteFill style={{background: '#fff', opacity: Math.min(1, white * 0.9)}} /> : null}
      <DateStamp v={v} />
      <Popup v={v} />
      {groups.map((g) => (
        <Caption key={g} v={v} g={g} />
      ))}
    </AbsoluteFill>
  );
};
