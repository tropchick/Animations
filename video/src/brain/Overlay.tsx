import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ROUND} from '../bear/Overlay';
import {ENTER, FINAL, FOUND, GROUPS, PHRASES, SOLVE, STACK, Shot, TAKE, WIN, WORDS, clamp01, shotAt, shotEnd, shotStart} from './cues';

const YELLOW = '#ffd23f';
const INK = '#2a1f3a';
const RED = '#e8453c';
const GREEN = '#2fae5a';
const PLATE = 'rgba(24,18,40,0.84)';
const CREAM = '#fff7e8';
const STICKER_SHADOW = '0 8px 0 rgba(40,20,60,0.4), 0 16px 30px rgba(0,0,0,0.3)';

const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const pop = (t: number, k = 9) => (t <= 0 ? 0 : 1 - Math.exp(-t * k) * Math.cos(t * k * 1.6));

// ---------- the question, first seconds ----------

export const HOOK_END = PHRASES[0][1] + 0.25;
const Hook: React.FC<{v: number}> = ({v}) => {
  if (v > HOOK_END) return null;
  const o = fade(v, 0, HOOK_END, 0.01, 0.25);
  const s = 0.9 + 0.1 * pop(v + 0.15, 7);
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 230, textAlign: 'center', opacity: o, transform: `scale(${s})`}}>
      <div style={{display: 'inline-block', background: CREAM, color: INK, borderRadius: 34, padding: '18px 34px 22px', fontFamily: ROUND, fontWeight: 800, fontSize: 74, lineHeight: 1.12, boxShadow: STICKER_SHADOW, transform: 'rotate(-1.5deg)'}}>
        Что если бы <span style={{color: RED}}>брейнротов</span> никогда не существовало?
      </div>
    </div>
  );
};

// ---------- the date stamp ----------

const DATES: Record<Shot, string> = {
  trio: 'ЯНВАРЬ 2025',
  laptop: 'ЯНВАРЬ 2025',
  vanish: 'ЯНВАРЬ 2025',
  game: 'ИЮЛЬ 2025',
  bed: 'ИЮЛЬ 2025',
  board: 'СЕНТЯБРЬ 2025',
  teacher: 'СЕНТЯБРЬ 2025',
  argue: '2026',
  stack: '2026',
  office: '2027',
  meeting: '2028, НОЧЬ',
  plan: '2028, НОЧЬ',
  cartoons: '2028, ДЕНЬ 2',
  tower: '2028, ДЕНЬ 3',
  enter: '1 СЕНТЯБРЯ 2028',
  desks: '1 СЕНТЯБРЯ 2028',
  dad: 'ВЕЧЕР',
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
  since = Math.max(since, HOOK_END - 0.1);
  const t = v - since;
  const late = s.name === 'meeting' || s.name === 'plan';
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 168, textAlign: 'center', opacity: clamp01(t / 0.08)}}>
      <div style={{display: 'inline-block', background: late ? INK : CREAM, color: late ? '#fff' : INK, borderRadius: 999, padding: '8px 34px 11px', fontFamily: ROUND, fontWeight: 800, fontSize: 50, lineHeight: 1.1, transform: `scale(${0.6 + 0.4 * pop(t, 10)}) rotate(-2deg)`, boxShadow: STICKER_SHADOW}}>
        {text}
      </div>
    </div>
  );
};

// ---------- «УМ ДЕТЕЙ»: a horizontal bar under the date ----------

const mind = (v: number) =>
  interpolate(
    v,
    [TAKE, shotEnd('bed'), SOLVE, WIN, STACK + 0.5, ENTER + 1.5, shotEnd('office'), shotStart('cartoons'), shotEnd('cartoons'), FOUND, shotStart('enter'), shotStart('desks') + 0.5],
    [0.06, 0.24, 0.42, 0.52, 0.6, 0.74, 0.74, 0.74, 0.68, 0.9, 0.92, 1.0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
const MindBar: React.FC<{v: number}> = ({v}) => {
  const a = shotStart('bed');
  if (v < a) return null;
  const k = mind(v);
  const full = k >= 0.999;
  const glow = full ? 0.5 + 0.5 * Math.sin(v * 8) : 0;
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top: 262, opacity: clamp01((v - a) / 0.2)}}>
      <div style={{display: 'flex', alignItems: 'center', background: CREAM, borderRadius: 26, padding: '10px 18px 10px 14px', boxShadow: STICKER_SHADOW}}>
        <div style={{background: RED, borderRadius: 16, color: '#fff', fontFamily: ROUND, fontWeight: 800, fontSize: 36, padding: '6px 16px 8px', marginRight: 18, whiteSpace: 'nowrap'}}>УМ ДЕТЕЙ</div>
        <div style={{flex: 1, height: 40, borderRadius: 20, background: '#e3d8c6', overflow: 'hidden', position: 'relative'}}>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${k * 100}%`, borderRadius: 20, background: full ? `linear-gradient(90deg, ${GREEN}, #7cff9a)` : `linear-gradient(90deg, ${YELLOW}, ${GREEN})`, boxShadow: full ? `0 0 ${20 + 20 * glow}px rgba(124,255,154,${0.6 + 0.4 * glow})` : 'none'}} />
        </div>
        <div style={{fontFamily: ROUND, fontWeight: 800, fontSize: 40, color: INK, marginLeft: 16, width: 104, textAlign: 'right', fontVariantNumeric: 'tabular-nums'}}>{full ? 'MAX' : `${Math.round(k * 100)}%`}</div>
      </div>
    </div>
  );
};

// ---------- the counter sticker ----------

type Count = {label?: string; value: string; key: string; tone: 'red' | 'green' | 'plain'};
const count = (v: number): Count | null => {
  const s = shotAt(v).name;
  switch (s) {
    case 'argue':
    case 'stack':
      return v < WIN ? null : {value: 'ДЕТИ 1 : 0 РОДИТЕЛИ', key: 'score', tone: 'red'};
    case 'office': {
      const k = clamp01((v - ENTER - 0.5) / 2.0);
      return v < ENTER ? null : {label: 'ВЗРОСЛЫЕ БЕЗ РАБОТЫ', value: `${Math.round(50 * k)}%`, key: 'jobs', tone: k >= 1 ? 'red' : 'plain'};
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
  const col = c.tone === 'red' ? RED : c.tone === 'green' ? GREEN : INK;
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 360, textAlign: 'center', opacity: clamp01(since / 0.08 + (since >= 0.99 ? 1 : 0))}}>
      <div style={{display: 'inline-flex', alignItems: 'center', background: CREAM, borderRadius: 26, padding: c.label ? '10px 26px 12px 14px' : '10px 30px 12px', transform: `scale(${0.7 + 0.3 * appear}) rotate(1.5deg)`, boxShadow: STICKER_SHADOW}}>
        {c.label ? <div style={{background: RED, borderRadius: 16, color: '#fff', fontFamily: ROUND, fontWeight: 800, fontSize: 36, padding: '6px 16px 8px', marginRight: 20}}>{c.label}</div> : null}
        <div style={{fontFamily: ROUND, fontWeight: 800, fontSize: 58, color: col, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>{c.value}</div>
      </div>
    </div>
  );
};

// ---------- mom's «ИДИ ДЕЛАЙ УРОКИ!» bubble ----------

const MomBubble: React.FC<{v: number}> = ({v}) => {
  const a = shotStart('stack') + 0.1;
  const b = STACK + 0.8;
  if (v < a || v > b) return null;
  const t = v - a;
  return (
    <div style={{position: 'absolute', left: 70, top: 560, opacity: fade(v, a, b, 0.06, 0.2), transform: `scale(${0.5 + 0.5 * pop(t, 10)}) rotate(-4deg)`, transformOrigin: '20% 100%'}}>
      <div style={{position: 'relative', background: '#ffffff', color: INK, borderRadius: 40, padding: '16px 34px 20px', fontFamily: ROUND, fontWeight: 800, fontSize: 60, boxShadow: STICKER_SHADOW}}>
        ИДИ ДЕЛАЙ УРОКИ!
        <div style={{position: 'absolute', left: 60, bottom: -34, width: 0, height: 0, borderLeft: '22px solid transparent', borderRight: '22px solid transparent', borderTop: '40px solid #ffffff'}} />
      </div>
    </div>
  );
};

// ---------- final plate ----------

const Final: React.FC<{v: number}> = ({v}) => {
  if (v < FINAL) return null;
  const t = v - FINAL;
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 380, textAlign: 'center', opacity: clamp01(t / 0.1)}}>
      <div style={{display: 'inline-block', background: CREAM, color: INK, borderRadius: 36, padding: '20px 36px 26px', fontFamily: ROUND, fontWeight: 800, fontSize: 84, lineHeight: 1.1, transform: `scale(${0.5 + 0.5 * pop(t, 9)}) rotate(-2deg)`, boxShadow: STICKER_SHADOW}}>
        ПАПА,
        <br />
        <span style={{color: RED}}>ИДИ ДЕЛАЙ УРОКИ</span>
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
  // the hook question is already on screen as a big sticker
  if (g === 0) return null;
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

export const Overlay: React.FC<{v: number}> = ({v}) => (
  <AbsoluteFill>
    <Hook v={v} />
    <DateStamp v={v} />
    <MindBar v={v} />
    <Counter v={v} />
    <MomBubble v={v} />
    <Final v={v} />
    {GROUPS.map((_, g) => (
      <Caption key={g} v={v} g={g} />
    ))}
  </AbsoluteFill>
);
