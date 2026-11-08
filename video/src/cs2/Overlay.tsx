import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ROUND} from '../bear/Overlay';
import {BAN, DETECT, FINAL, GREEN, GROUPS, HIRED, LOBBY, STAMP, SWEEP, Shot, TROPHY, WORDS, clamp01, shotAt, shotEnd, shotStart} from './cues';
import {fmt} from './tex';

const YELLOW = '#ffd23f';
const INK = '#2a1f3a';
const RED = '#e8453c';
const PLATE = 'rgba(24,18,40,0.84)';
const CREAM = '#fff7e8';
const STICKER_SHADOW = '0 8px 0 rgba(40,20,60,0.4), 0 16px 30px rgba(0,0,0,0.3)';

const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const pop = (t: number, k = 9) => (t <= 0 ? 0 : 1 - Math.exp(-t * k) * Math.cos(t * k * 1.6));

// ---------- the question, first seconds ----------

const HOOK_END = 3.3;
const Hook: React.FC<{v: number}> = ({v}) => {
  if (v > HOOK_END) return null;
  const o = fade(v, 0, HOOK_END, 0.01, 0.25);
  const s = 0.9 + 0.1 * pop(v + 0.15, 7);
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top: 210, textAlign: 'center', opacity: o, transform: `scale(${s})`}}>
      <div style={{display: 'inline-block', background: CREAM, color: INK, borderRadius: 34, padding: '18px 34px 22px', fontFamily: ROUND, fontWeight: 800, fontSize: 72, lineHeight: 1.12, boxShadow: STICKER_SHADOW, transform: 'rotate(-1.5deg)'}}>
        Что если в CS2 добавят <span style={{color: RED}}>античит?</span>
      </div>
    </div>
  );
};

// ---------- the day stamp ----------

const DATES: Record<Shot, string> = {
  club: 'ДЕНЬ 0',
  lobby: 'ДЕНЬ 1',
  family: 'МЕСЯЦ 1',
  arena: 'МЕСЯЦ 2',
  queue: 'МЕСЯЦ 3',
  office: 'МЕСЯЦ 3',
  exit: 'МЕСЯЦ 5',
  exam: 'МЕСЯЦ 5',
  launch: 'МЕСЯЦ 6',
  orbit: 'МЕСЯЦ 6',
  xray: 'МЕСЯЦ 6',
  mirror: 'МЕСЯЦ 6, 12:00',
  back: 'МЕСЯЦ 6, 12:01',
  phone: 'МЕСЯЦ 6, 12:01',
};

const DateStamp: React.FC<{v: number}> = ({v}) => {
  if (v < HOOK_END - 0.1) return null;
  const s = shotAt(v);
  const text = DATES[s.name];
  let since = s.from;
  for (let t = s.from - 0.02; t > 0; t -= 0.1) {
    const p = shotAt(t);
    if (DATES[p.name] !== text) break;
    since = p.from;
  }
  if (s.name === 'club') since = HOOK_END - 0.1;
  const t = v - since;
  const late = s.name === 'mirror' || s.name === 'back' || s.name === 'phone';
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 168, textAlign: 'center', opacity: clamp01(t / 0.08)}}>
      <div style={{display: 'inline-block', background: late ? RED : CREAM, color: late ? '#fff' : INK, borderRadius: 999, padding: '8px 34px 11px', fontFamily: ROUND, fontWeight: 800, fontSize: 50, lineHeight: 1.1, transform: `scale(${0.6 + 0.4 * pop(t, 10)}) rotate(-2deg)`, boxShadow: STICKER_SHADOW}}>
        {text}
      </div>
    </div>
  );
};

// ---------- the counter sticker ----------

type Count = {label: string; value: string; key: string; tone: 'red' | 'green' | 'plain'};
const count = (v: number): Count | null => {
  const s = shotAt(v).name;
  switch (s) {
    case 'club': {
      if (v < HOOK_END) return null;
      const k = clamp01((v - BAN[0]) / (BAN[1] - BAN[0]));
      return {label: 'ОНЛАЙН', value: fmt(1500000 - (1500000 - 37500) * Math.pow(k, 0.7)), key: 'online', tone: k >= 1 ? 'red' : 'plain'};
    }
    case 'lobby':
      return v < LOBBY + 1.2 ? null : {label: 'ЧЕСТНЫХ ИГРОКОВ', value: '4', key: 'honest', tone: 'red'};
    case 'arena':
      return v < TROPHY ? null : {label: 'ПОБЕДИТЕЛЬ', value: 'БОТЫ', key: 'win', tone: 'red'};
    case 'queue':
    case 'office': {
      const k = clamp01((v - HIRED[0]) / (HIRED[1] - HIRED[0]));
      return {label: 'НАНЯТО', value: fmt(200000 * k * k), key: 'hired', tone: k >= 1 ? 'green' : 'plain'};
    }
    case 'exam': {
      const k = clamp01((v - SWEEP[0]) / (SWEEP[1] - SWEEP[0]));
      return {label: 'ЕГЭ: ЗАБАНЕНО', value: `${Math.round(50 * k)}%`, key: 'ege', tone: k >= 1 ? 'red' : 'plain'};
    }
    case 'orbit':
    case 'xray': {
      const k = clamp01((v - shotStart('orbit')) / 1.4);
      return {label: 'ВИДИТ ЛЮДЕЙ', value: fmt(8000000000 * k), key: 'sees', tone: k >= 1 ? 'red' : 'plain'};
    }
    case 'back': {
      const k = clamp01((v - GREEN) / 0.6);
      return {label: 'ОНЛАЙН', value: fmt(37500 + (1500000 - 37500) * k), key: 'back', tone: k >= 1 ? 'green' : 'plain'};
    }
    default:
      return null;
  }
};

const Counter: React.FC<{v: number}> = ({v}) => {
  const c = count(v);
  if (!c) return null;
  let since = 0;
  for (let t = v; t > v - 1 && count(t)?.key === c.key; t -= 1 / 30) since = v - t;
  const appear = since < 0.99 ? pop(since, 10) : 1;
  const col = c.tone === 'red' ? RED : c.tone === 'green' ? '#2fae5a' : INK;
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top: 262, textAlign: 'center', opacity: clamp01(since / 0.08 + (since >= 0.99 ? 1 : 0))}}>
      <div style={{display: 'inline-flex', alignItems: 'center', background: CREAM, borderRadius: 26, padding: '10px 26px 12px 14px', transform: `scale(${0.7 + 0.3 * appear})`, boxShadow: STICKER_SHADOW}}>
        <div style={{background: c.tone === 'green' ? '#2fae5a' : RED, borderRadius: 16, color: '#fff', fontFamily: ROUND, fontWeight: 800, fontSize: 36, padding: '6px 16px 8px', marginRight: 20}}>{c.label}</div>
        <div style={{fontFamily: ROUND, fontWeight: 800, fontSize: 62, color: col, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>{c.value}</div>
      </div>
    </div>
  );
};

// ---------- the scanner verdict and the stamp ----------

const Detect: React.FC<{v: number}> = ({v}) => {
  const a = DETECT;
  const b = STAMP - 0.05;
  if (v < a || v > b) return null;
  const t = v - a;
  const blink = Math.floor(t * 4) % 2 === 0;
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 330, textAlign: 'center', opacity: fade(v, a, b, 0.05, 0.12)}}>
      <div style={{display: 'inline-block', background: blink ? RED : '#c0302a', color: '#fff', borderRadius: 28, padding: '14px 30px 18px', fontFamily: ROUND, fontWeight: 800, fontSize: 64, lineHeight: 1.12, transform: `scale(${0.6 + 0.4 * pop(t, 10)}) rotate(1.5deg)`, boxShadow: '0 10px 0 rgba(90,10,10,0.45), 0 18px 40px rgba(0,0,0,0.4)'}}>
        ОБНАРУЖЕН ЧИТ: ВХ
        <div style={{fontSize: 46, color: YELLOW, marginTop: 6}}>нарушитель: античит</div>
      </div>
    </div>
  );
};

const Stamp: React.FC<{v: number}> = ({v}) => {
  const a = STAMP;
  const b = shotEnd('mirror') - 0.05;
  if (v < a || v > b) return null;
  const t = v - a;
  const s = t < 0.12 ? 1.8 - 0.8 * (t / 0.12) : 1 + 0.04 * Math.exp(-(t - 0.12) * 8) * Math.cos((t - 0.12) * 30);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 760, textAlign: 'center', opacity: fade(v, a, b, 0.03, 0.15)}}>
      <div style={{display: 'inline-block', border: `14px solid ${RED}`, borderRadius: 30, padding: '6px 40px 14px', fontFamily: ROUND, fontWeight: 800, fontSize: 140, color: RED, letterSpacing: 4, background: 'rgba(255,247,232,0.88)', transform: `scale(${s}) rotate(-12deg)`, boxShadow: '0 18px 50px rgba(0,0,0,0.45)'}}>
        ЗАБАНЕН
      </div>
    </div>
  );
};

// ---------- final plate ----------

const Final: React.FC<{v: number}> = ({v}) => {
  if (v < FINAL) return null;
  const t = v - FINAL;
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 300, textAlign: 'center', opacity: clamp01(t / 0.1)}}>
      <div style={{display: 'inline-block', background: CREAM, color: INK, borderRadius: 36, padding: '20px 36px 26px', fontFamily: ROUND, fontWeight: 800, fontSize: 84, lineHeight: 1.1, transform: `scale(${0.5 + 0.5 * pop(t, 9)}) rotate(-2deg)`, boxShadow: STICKER_SHADOW}}>
        АНТИЧИТ:
        <br />
        <span style={{color: RED}}>ЗАБАНЕН ЗА ВХ</span>
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
  const next = GROUPS[g + 1] ? WORDS.find((w) => GROUPS[g + 1].includes(w[3])) : undefined;
  const end = Math.min(words[words.length - 1][1] + 0.5, next ? next[0] - 0.12 : 1e9);
  const o = fade(v, start, end, 0.08, 0.1);
  if (o <= 0) return null;
  let cur = -1;
  words.forEach((w, i) => {
    if (v >= w[0] - 0.03) cur = i;
  });
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top: 1395, textAlign: 'center', opacity: o}}>
      <div style={{display: 'inline-block', background: PLATE, borderRadius: 26, padding: '10px 28px 14px', fontFamily: ROUND, fontWeight: 700, fontSize: 58, lineHeight: 1.2, color: '#fff', boxShadow: '0 8px 26px rgba(0,0,0,0.35)'}}>
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
  const red = flash(v, BAN[0], 6) * 0.25 + flash(v, STAMP, 7) * 0.3;
  return (
    <AbsoluteFill>
      {red > 0.01 ? <AbsoluteFill style={{background: '#ff2a1a', opacity: red}} /> : null}
      <Hook v={v} />
      <DateStamp v={v} />
      <Counter v={v} />
      <Detect v={v} />
      <Stamp v={v} />
      <Final v={v} />
      {GROUPS.map((_, g) => (
        <Caption key={g} v={v} g={g} />
      ))}
    </AbsoluteFill>
  );
};
