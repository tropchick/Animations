import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ROUND} from '../bear/Overlay';
import {CHECK, DRAW, GROUPS, HOP, LAUNCH, SCORE, SEARCH, Shot, WIN, WORDS, clamp01, shotAt, shotStart} from './cues';

const YELLOW = '#ffd23f';
const INK = '#2a1f3a';
const PINK = '#f0559a';
const BLUE = '#3a9cf0';
const GREEN = '#2fae5a';
const RED = '#e8453c';
const PLATE = 'rgba(24,18,40,0.84)';
const CREAM = '#fff7e8';
const SHADOW = '0 8px 0 rgba(40,20,60,0.4), 0 16px 30px rgba(0,0,0,0.3)';

const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const pop = (t: number, k = 9) => (t <= 0 ? 0 : 1 - Math.exp(-t * k) * Math.cos(t * k * 1.6));

// ---------- the score: who leads, and the bar ----------

const FINAL_AT = LAUNCH + 0.35;
// [time, gaben points, nolan points, pink share of the bar]
const STEPS: [number, number, number, number][] = [
  [-1, 0, 0, 0.5],
  [SCORE[1], 0, 1, 0.34],
  [SCORE[2], 1, 1, 0.5],
  [SCORE[3], 1, 2, 0.38],
  [SCORE[4], 2, 2, 0.5],
  [FINAL_AT, 3, 2, 1.0],
];
const stepAt = (v: number) => {
  let i = 0;
  STEPS.forEach((s, k) => {
    if (v >= s[0]) i = k;
  });
  return i;
};
const share = (v: number) => {
  const i = stepAt(v);
  const prev = i > 0 ? STEPS[i - 1][3] : STEPS[0][3];
  const t = v - STEPS[i][0];
  const k = i === 0 ? 1 : 1 - Math.exp(-t * 6) * Math.cos(t * 10);
  // a nervous wobble while nobody leads
  const wob = STEPS[i][3] === 0.5 && i < STEPS.length - 1 ? 0.012 * Math.sin(v * 7) : 0;
  return prev + (STEPS[i][3] - prev) * k + wob;
};

export const ScoreBar: React.FC<{v: number}> = ({v}) => {
  const i = stepAt(v);
  const [, g, n] = STEPS[i];
  const t = v - STEPS[i][0];
  const bump = i > 0 && t < 0.8 ? pop(t, 10) : 1;
  const sh = share(v);
  const W = 860;
  const won = v >= FINAL_AT;
  return (
    <div style={{position: 'absolute', left: (1080 - W) / 2, width: W, top: 150}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10}}>
        <div style={{background: PINK, color: '#fff', borderRadius: 18, padding: '6px 18px 9px', fontFamily: ROUND, fontWeight: 800, fontSize: 38, boxShadow: SHADOW}}>МАТЬ ГАБЕНА</div>
        <div style={{background: CREAM, color: INK, borderRadius: 20, padding: '2px 22px 6px', fontFamily: ROUND, fontWeight: 800, fontSize: 58, fontVariantNumeric: 'tabular-nums', transform: `scale(${0.8 + 0.2 * bump})`, boxShadow: SHADOW}}>
          <span style={{color: PINK}}>{g}</span> : <span style={{color: BLUE}}>{n}</span>
        </div>
        <div style={{background: BLUE, color: '#fff', borderRadius: 18, padding: '6px 18px 9px', fontFamily: ROUND, fontWeight: 800, fontSize: 38, boxShadow: SHADOW}}>МАТЬ НОЛАНА</div>
      </div>
      <div style={{position: 'relative', height: 40, borderRadius: 20, overflow: 'hidden', background: BLUE, boxShadow: '0 6px 0 rgba(40,20,60,0.35), inset 0 0 0 5px rgba(255,255,255,0.9)'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(0, Math.min(1, sh)) * 100}%`, background: PINK}} />
        {!won ? <div style={{position: 'absolute', left: '50%', top: 4, bottom: 4, width: 4, marginLeft: -2, background: 'rgba(255,255,255,0.7)'}} /> : null}
        <div style={{position: 'absolute', inset: 0, borderRadius: 20, boxShadow: 'inset 0 0 0 5px rgba(255,255,255,0.9)'}} />
      </div>
    </div>
  );
};

// ---------- the test name ----------

const TESTS: Partial<Record<Shot, string>> = {
  scales: 'ТЕСТ 1: ВЕСЫ',
  boat: 'ТЕСТ 2: МОРЕ',
  beach: 'ТЕСТ 2: МОРЕ',
  venice: 'ТЕСТ 2: МОРЕ',
  spoons: 'ТЕСТ 3: ГРАВИТАЦИЯ',
  moon: 'ТЕСТ 3: ГРАВИТАЦИЯ',
  quake: 'ТЕСТ 4: ПРЫЖОК',
  globe: 'ТЕСТ 4: ПРЫЖОК',
  scope: 'ТЕСТ 5: ТЕЛЕСКОП',
  scopeN: 'ТЕСТ 5: ТЕЛЕСКОП',
  scopeG: 'ТЕСТ 5: ТЕЛЕСКОП',
  final: 'ФИНАЛ',
  moons: 'ФИНАЛ',
  leg: 'ФИНАЛ',
};
const WHO: Partial<Record<Shot, 'g' | 'n'>> = {boat: 'g', beach: 'n', venice: 'n', spoons: 'n', moon: 'g', quake: 'g', globe: 'n', scopeN: 'n', scopeG: 'g'};

const sinceSame = (v: number, f: (s: Shot) => string | undefined) => {
  const s = shotAt(v);
  const val = f(s.name);
  let since = s.from;
  for (let t = s.from - 0.02; t > 0; t -= 0.1) {
    const p = shotAt(t);
    if (f(p.name) !== val) break;
    since = p.from;
  }
  return v - since;
};

const TestSticker: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v).name;
  const text = TESTS[s];
  if (!text) return null;
  const t = sinceSame(v, (x) => TESTS[x]);
  const final = text === 'ФИНАЛ';
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', opacity: clamp01(t / 0.08)}}>
      <div style={{display: 'inline-block', background: final ? YELLOW : CREAM, color: INK, borderRadius: 999, padding: '8px 34px 11px', fontFamily: ROUND, fontWeight: 800, fontSize: 50, transform: `scale(${0.6 + 0.4 * pop(t, 10)}) rotate(-2deg)`, boxShadow: SHADOW}}>{text}</div>
    </div>
  );
};

const WhoChip: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v).name;
  const who = WHO[s];
  if (!who) return null;
  const t = sinceSame(v, (x) => WHO[x]);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 390, textAlign: 'center', opacity: clamp01(t / 0.08)}}>
      <div style={{display: 'inline-block', background: who === 'g' ? PINK : BLUE, color: '#fff', borderRadius: 22, padding: '6px 26px 10px', fontFamily: ROUND, fontWeight: 800, fontSize: 46, transform: `scale(${0.6 + 0.4 * pop(t, 11)}) rotate(1.5deg)`, boxShadow: SHADOW}}>
        {who === 'g' ? 'МАТЬ ГАБЕНА' : 'МАТЬ НОЛАНА'}
      </div>
    </div>
  );
};

// ---------- the hook ----------

const HOOK_END = shotStart('scales') - 0.1;
const Hook: React.FC<{v: number}> = ({v}) => {
  if (v > HOOK_END) return null;
  const o = fade(v, 0, HOOK_END, 0.01, 0.25);
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top: 330, textAlign: 'center', opacity: o, transform: `scale(${0.9 + 0.1 * pop(v + 0.15, 7)})`}}>
      <div style={{display: 'inline-block', background: CREAM, color: INK, borderRadius: 34, padding: '18px 34px 22px', fontFamily: ROUND, fontWeight: 800, fontSize: 80, lineHeight: 1.1, boxShadow: SHADOW, transform: 'rotate(-1.5deg)'}}>
        Кто весит <span style={{color: RED}}>больше?</span>
      </div>
    </div>
  );
};

// ---------- one-off stickers ----------

const Sticker: React.FC<{v: number; at: number; to: number; top: number; bg: string; fg?: string; size?: number; rot?: number; children: React.ReactNode}> = ({v, at, to, top, bg, fg = '#fff', size = 96, rot = -6, children}) => {
  if (v < at || v > to) return null;
  const t = v - at;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', opacity: fade(v, at, to, 0.04, 0.15)}}>
      <div style={{display: 'inline-block', background: bg, color: fg, borderRadius: 32, padding: '10px 40px 16px', fontFamily: ROUND, fontWeight: 800, fontSize: size, lineHeight: 1.1, transform: `scale(${0.5 + 0.5 * pop(t, 10)}) rotate(${rot}deg)`, boxShadow: '0 12px 0 rgba(40,20,60,0.45), 0 22px 44px rgba(0,0,0,0.35)'}}>{children}</div>
    </div>
  );
};

// ---------- the telescope view ----------

const Scope: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v).name;
  if (s !== 'scopeN' && s !== 'scopeG') return null;
  const R = 470;
  const cy = 960;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(circle at 540px ${cy}px, rgba(0,0,0,0) ${R - 6}px, rgba(0,0,0,0.6) ${R}px, #000 ${R + 14}px)`}} />
      <div style={{position: 'absolute', left: 540 - R, top: cy - R, width: R * 2, height: R * 2, borderRadius: '50%', boxShadow: 'inset 0 0 60px rgba(0,0,0,0.55)', border: '6px solid rgba(255,255,255,0.15)'}} />
      <div style={{position: 'absolute', left: 540 - R + 30, width: 2 * R - 60, top: cy - 1.5, height: 3, background: 'rgba(255,255,255,0.45)'}} />
      <div style={{position: 'absolute', top: cy - R + 30, height: 2 * R - 60, left: 538.5, width: 3, background: 'rgba(255,255,255,0.45)'}} />
    </AbsoluteFill>
  );
};

// ---------- final plate ----------

const Winner: React.FC<{v: number}> = ({v}) => {
  if (v < WIN) return null;
  const t = v - WIN;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 520, textAlign: 'center', opacity: clamp01(t / 0.1)}}>
      <div style={{display: 'inline-block', background: CREAM, color: INK, borderRadius: 36, padding: '18px 36px 26px', fontFamily: ROUND, fontWeight: 800, fontSize: 70, lineHeight: 1.1, transform: `scale(${0.5 + 0.5 * pop(t, 9)}) rotate(-2deg)`, boxShadow: SHADOW}}>
        ПОБЕДИТЕЛЬ:
        <br />
        <span style={{color: PINK, fontSize: 92}}>МАТЬ ГАБЕНА</span>
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

export const Overlay: React.FC<{v: number}> = ({v}) => {
  const searchK = Math.max(0, Math.min(1, (v - SEARCH[0]) / 0.3));
  const blink = Math.floor(v * 4) % 2 === 0;
  return (
    <AbsoluteFill>
      <Scope v={v} />
      <ScoreBar v={v} />
      <Hook v={v} />
      <TestSticker v={v} />
      <WhoChip v={v} />
      <Sticker v={v} at={DRAW} to={shotStart('boat') - 0.05} top={760} bg={YELLOW} fg={INK}>НИЧЬЯ</Sticker>
      <Sticker v={v} at={HOP + 0.25} to={shotStart('globe') - 0.05} top={1120} bg={CREAM} fg={INK} size={72} rot={4}>
        3 балла
      </Sticker>
      <Sticker v={v} at={CHECK} to={shotStart('scopeG') - 0.05} top={1180} bg={GREEN} size={60} rot={-3}>
        НАЙДЕНА ЦЕЛИКОМ ✓
      </Sticker>
      {searchK > 0 && shotAt(v).name === 'scopeG' ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1180, textAlign: 'center', opacity: searchK}}>
          <div style={{display: 'inline-block', background: blink ? RED : '#c0302a', color: '#fff', borderRadius: 28, padding: '10px 30px 14px', fontFamily: ROUND, fontWeight: 800, fontSize: 60, boxShadow: SHADOW}}>ПОИСК КРАЯ… 0%</div>
        </div>
      ) : null}
      <Winner v={v} />
      {GROUPS.map((_, g) => (
        <Caption key={g} v={v} g={g} />
      ))}
    </AbsoluteFill>
  );
};
