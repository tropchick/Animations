import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ROUND} from '../bear/Overlay';
import {COND} from '../gta/tex';
import {CODES, DOOR, FAIL, GROUPS, PHRASES, Shot, WORDS, clamp01, shotAt, shotEnd, typedText} from './cues';

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
export const HookSticker: React.FC<{o?: number; s?: number; top?: number}> = ({o = 1, s = 1, top = 230}) => (
  <div style={{position: 'absolute', left: 70, right: 70, top, textAlign: 'center', opacity: o, transform: `scale(${s})`}}>
    <div style={{display: 'inline-block', background: CREAM, color: INK, borderRadius: 34, padding: '18px 34px 22px', fontFamily: ROUND, fontWeight: 800, fontSize: 76, lineHeight: 1.12, boxShadow: STICKER_SHADOW, transform: 'rotate(-1.5deg)'}}>
      Что если бы <span style={{color: GREEN}}>читы из ГТА</span> заработали в&nbsp;реальной жизни?
    </div>
  </div>
);
const Hook: React.FC<{v: number}> = ({v}) => {
  if (v > HOOK_END) return null;
  return <HookSticker o={fade(v, 0, HOOK_END, 0.01, 0.25)} s={0.9 + 0.1 * pop(v + 0.15, 7)} />;
};

// ---------- the day stamp ----------

const DAYS: Record<Shot, string> = {
  teaser: '',
  yard: 'ПОНЕДЕЛЬНИК',
  phone: 'ПОНЕДЕЛЬНИК',
  sack: 'ПОНЕДЕЛЬНИК',
  rain: 'ПОНЕДЕЛЬНИК',
  bread: 'ПОНЕДЕЛЬНИК, ВЕЧЕР',
  typecop: 'ВТОРНИК',
  cop: 'ВТОРНИК',
  lift: 'СРЕДА',
  jam: 'СРЕДА',
  granny: 'СРЕДА',
  bars: 'ЧЕТВЕРГ',
  office: 'ЧЕТВЕРГ',
  thumb: 'ПЯТНИЦА',
  round: 'ПЯТНИЦА',
  banner: 'СУББОТА',
  moon: 'СУББОТА',
  diary: 'СУББОТА',
  door: 'ВОСКРЕСЕНЬЕ',
  panic: 'ВОСКРЕСЕНЬЕ',
  stare: 'ВОСКРЕСЕНЬЕ',
};

const DayStamp: React.FC<{v: number}> = ({v}) => {
  if (v < HOOK_END - 0.1) return null;
  const s = shotAt(v);
  const text = DAYS[s.name];
  if (!text) return null;
  let since = s.from;
  for (let t = s.from - 0.02; t > 0; t -= 0.1) {
    const p = shotAt(t);
    if (DAYS[p.name] !== text) break;
    since = p.from;
  }
  since = Math.max(since, HOOK_END - 0.1);
  const t = v - since;
  const sunday = text === 'ВОСКРЕСЕНЬЕ';
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 168, textAlign: 'center', opacity: clamp01(t / 0.08)}}>
      <div style={{display: 'inline-block', background: sunday ? RED : CREAM, color: sunday ? '#fff' : INK, borderRadius: 999, padding: '8px 34px 11px', fontFamily: ROUND, fontWeight: 800, fontSize: 50, lineHeight: 1.1, transform: `scale(${0.6 + 0.4 * pop(t, 10)}) rotate(-2deg)`, boxShadow: STICKER_SHADOW}}>
        {text}
      </div>
    </div>
  );
};

// ---------- «ВВЕДЁННЫЕ КОДЫ»: a horizontal strip of activated codes ----------

const CodeStrip: React.FC<{v: number}> = ({v}) => {
  const first = CODES[0].on;
  if (v < first || v < HOOK_END || v >= FAIL) return null;
  const shown = CODES.slice(0, 6).filter((c) => v >= c.on);
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 262, display: 'flex', justifyContent: 'center', gap: 8, opacity: clamp01((v - first) / 0.2)}}>
      {shown.map((c, i) => {
        const t = v - c.on;
        const fresh = t < 0.6;
        return (
          <div key={i} style={{background: fresh ? GREEN : CREAM, color: fresh ? '#fff' : INK, borderRadius: 16, padding: '4px 12px 6px', fontFamily: COND, fontWeight: 600, fontSize: 36, letterSpacing: 1, boxShadow: '0 6px 0 rgba(40,20,60,0.35)', transform: `scale(${0.5 + 0.5 * pop(t, 11)})`}}>
            {c.text}
          </div>
        );
      })}
    </div>
  );
};

// ---------- the code being typed, then «ЧИТ АКТИВИРОВАН» ----------

const TypePanel: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v).name;
  for (let i = 0; i < CODES.length; i++) {
    const c = CODES[i];
    const a = c.keys[0] - 0.15;
    const b = i === 6 ? shotEnd('stare') : c.on + 1.0;
    if (v < a || v > b) continue;
    const text = typedText(i, v);
    const on = v >= c.on;
    const fail = i === 6 && v >= FAIL;
    if (fail) return null; // the final plate takes over
    // on the phone close-ups the typing is on the screen; keep only the toast
    if (!on && (s === 'phone' || s === 'thumb')) return null;
    const t = on ? v - c.on : v - a;
    const o = fade(v, a, b, 0.08, 0.2);
    return (
      <div style={{position: 'absolute', left: 80, right: 80, top: 360, textAlign: 'center', opacity: o}}>
        <div style={{display: 'inline-block', background: on ? GREEN : CREAM, color: on ? '#fff' : INK, borderRadius: 28, padding: '12px 34px 16px', boxShadow: STICKER_SHADOW, transform: `scale(${on ? 0.8 + 0.2 * pop(t, 10) : 1}) rotate(${on ? -1.5 : 1}deg)`}}>
          <div style={{fontFamily: COND, fontWeight: 600, fontSize: 84, letterSpacing: 6, minWidth: 300}}>
            {text}
            {!on && Math.floor(v * 4) % 2 === 0 ? <span style={{color: '#3a7bd5'}}>|</span> : null}
          </div>
          {on ? <div style={{fontFamily: ROUND, fontWeight: 800, fontSize: 40, marginTop: -4}}>ЧИТ АКТИВИРОВАН</div> : null}
        </div>
      </div>
    );
  }
  return null;
};

// ---------- mom's phone news ----------

const News: React.FC<{v: number}> = ({v}) => {
  const a = DOOR + 0.9;
  const b = shotEnd('door');
  if (v < a || v > b) return null;
  const t = v - a;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 470, opacity: fade(v, a, b, 0.1, 0.15), transform: `translateY(${(1 - pop(t, 9)) * -60}px)`}}>
      <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 30, padding: '18px 26px 22px', boxShadow: '0 14px 40px rgba(0,0,0,0.35)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: ROUND, fontWeight: 700, fontSize: 34, color: '#7a8090'}}>
          <div style={{width: 46, height: 46, borderRadius: 12, background: RED, color: '#fff', textAlign: 'center', lineHeight: '46px', fontWeight: 800}}>!</div>
          НОВОСТИ · сейчас
        </div>
        <div style={{fontFamily: ROUND, fontWeight: 800, fontSize: 48, color: INK, lineHeight: 1.15, marginTop: 8}}>Кто первым ввёл код? Школьник из вашего дома</div>
      </div>
    </div>
  );
};

// ---------- final plate ----------

const Final: React.FC<{v: number}> = ({v}) => {
  if (v < FAIL) return null;
  const t = v - FAIL;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 330, textAlign: 'center', opacity: clamp01(t / 0.08)}}>
      <div style={{display: 'inline-block', background: RED, color: '#fff', borderRadius: 36, padding: '16px 36px 22px', boxShadow: STICKER_SHADOW, transform: `scale(${0.5 + 0.5 * pop(t, 9)}) rotate(-2deg)`}}>
        <div style={{fontFamily: COND, fontWeight: 600, fontSize: 64, letterSpacing: 6, textDecoration: 'line-through', opacity: 0.85}}>AEZAKMI</div>
        <div style={{fontFamily: ROUND, fontWeight: 800, fontSize: 80, lineHeight: 1.08}}>
          НА МАМУ
          <br />
          НЕ ДЕЙСТВУЕТ
        </div>
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
    <DayStamp v={v} />
    <CodeStrip v={v} />
    <TypePanel v={v} />
    <News v={v} />
    <Final v={v} />
    {GROUPS.map((_, g) => (
      <Caption key={g} v={v} g={g} />
    ))}
  </AbsoluteFill>
);
