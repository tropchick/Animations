import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ROUND} from '../bear/Overlay';
import {BAR, DAY_AT, DELAY, GROUPS, PLATE, SLIPS, SUCK, WORDS, clamp01, shotAt, shotStart} from './cues';

const YELLOW = '#ffd23f';
const INK = '#2a1f3a';
const PINK = '#f0559a';
const GREEN = '#2fae5a';
const RED = '#e8453c';
const ORANGE = '#ff8a1e';
const PLATE_BG = 'rgba(24,18,40,0.84)';
const CREAM = '#fff7e8';
const SHADOW = '0 8px 0 rgba(40,20,60,0.4), 0 16px 30px rgba(0,0,0,0.3)';

const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const pop = (t: number, k = 9) => (t <= 0 ? 0 : 1 - Math.exp(-t * k) * Math.cos(t * k * 1.6));

const RW0 = shotStart('rwMoon');
const MON = shotStart('monday');

// ---------- the Half-Life 3 progress bar (horizontal, top) ----------

const barIdx = (v: number) => {
  let i = 0;
  BAR.forEach((b, k) => {
    if (v >= b[0]) i = k;
  });
  return i;
};
const barVal = (v: number) => {
  const i = barIdx(v);
  const prev = i > 0 ? BAR[i - 1][1] : 0;
  const t = v - BAR[i][0];
  const crash = i === BAR.length - 1;
  const k = i === 0 ? 1 : crash ? clamp01(t / 0.35) : 1 - Math.exp(-t * 7) * Math.cos(t * 9);
  return prev + (BAR[i][1] - prev) * k;
};

export const HlBar: React.FC<{v: number; cover?: boolean}> = ({v, cover}) => {
  const val = cover ? 0 : barVal(v);
  const i = barIdx(v);
  const t = v - BAR[i][0];
  const crashed = !cover && v >= DELAY;
  const bump = !cover && i > 0 && t < 0.7 ? pop(t, 10) : 1;
  const W = 900;
  const nervous = !cover && v > BAR[BAR.length - 2][0] && v < DELAY ? (Math.floor(v * 3) % 2 === 0 ? 1 : 0.75) : 1;
  const intro = cover ? 1 : clamp01((v - 0.25) / 0.25);
  const pct = Math.round(val * 100);
  return (
    <div style={{position: 'absolute', left: (1080 - W) / 2, width: W, top: 150, opacity: intro}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10}}>
        <div style={{background: INK, color: '#fff', borderRadius: 18, padding: '6px 20px 9px', fontFamily: ROUND, fontWeight: 800, fontSize: 44, letterSpacing: 1, boxShadow: SHADOW}}>
          HALF-LIFE <span style={{color: ORANGE}}>3</span>
        </div>
        <div style={{background: crashed ? RED : CREAM, color: crashed ? '#fff' : INK, borderRadius: 20, padding: '2px 24px 6px', fontFamily: ROUND, fontWeight: 800, fontSize: 60, fontVariantNumeric: 'tabular-nums', transform: `scale(${0.8 + 0.2 * bump})`, boxShadow: SHADOW, opacity: nervous}}>
          {pct}%
        </div>
      </div>
      <div style={{position: 'relative', height: 44, borderRadius: 22, overflow: 'hidden', background: '#3a3048', boxShadow: '0 6px 0 rgba(40,20,60,0.35)'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(0, Math.min(1, val)) * 100}%`, background: `linear-gradient(90deg, ${ORANGE}, ${YELLOW})`}} />
        <div style={{position: 'absolute', inset: 0, borderRadius: 22, boxShadow: 'inset 0 0 0 5px rgba(255,255,255,0.9)'}} />
      </div>
    </div>
  );
};

// ---------- the day chip ----------

export const DayChip: React.FC<{v: number; text?: string}> = ({v, text}) => {
  let label = text;
  let since = 1;
  if (!label) {
    if (v >= MON) {
      label = 'ПОНЕДЕЛЬНИК';
      since = v - MON;
    } else if (v < RW0 - 0.05) {
      let d = 0;
      DAY_AT.forEach((a, k) => {
        if (v >= a - 0.1) d = k + 1;
      });
      if (d === 0) {
        if (v < 0.4) return null;
        label = 'ДИЕТА: ДЕНЬ 0/7';
        since = v - 0.4;
      } else {
        label = `ДЕНЬ ${d}/7`;
        since = v - (DAY_AT[d - 1] - 0.1);
      }
    } else return null;
  }
  const last = label === 'ДЕНЬ 7/7';
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center'}}>
      <div style={{display: 'inline-block', background: last ? RED : label === 'ПОНЕДЕЛЬНИК' ? YELLOW : PINK, color: label === 'ПОНЕДЕЛЬНИК' ? INK : '#fff', borderRadius: 999, padding: '8px 36px 11px', fontFamily: ROUND, fontWeight: 800, fontSize: 52, transform: `scale(${0.6 + 0.4 * pop(since, 10)}) rotate(-2deg)`, boxShadow: SHADOW}}>{label}</div>
    </div>
  );
};

// ---------- one-off stickers ----------

const Sticker: React.FC<{v: number; at: number; to: number; top: number; bg: string; fg?: string; size?: number; rot?: number; children: React.ReactNode}> = ({v, at, to, top, bg, fg = '#fff', size = 84, rot = -6, children}) => {
  if (v < at || v > to) return null;
  const t = v - at;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', opacity: fade(v, at, to, 0.04, 0.15)}}>
      <div style={{display: 'inline-block', background: bg, color: fg, borderRadius: 32, padding: '10px 40px 16px', fontFamily: ROUND, fontWeight: 800, fontSize: size, lineHeight: 1.1, transform: `scale(${0.5 + 0.5 * pop(t, 10)}) rotate(${rot}deg)`, boxShadow: '0 12px 0 rgba(40,20,60,0.45), 0 22px 44px rgba(0,0,0,0.35)'}}>{children}</div>
    </div>
  );
};

// ---------- the rewind look: scanlines, a "◀◀" badge, a colour shift ----------

const Rewind: React.FC<{v: number}> = ({v}) => {
  if (v < RW0 || v >= MON) return null;
  const jitter = Math.sin(v * 53) * 6;
  const band = ((v * 900) % 2100) - 100;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 7px)', mixBlendMode: 'multiply'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: band, height: 70, background: 'rgba(255,255,255,0.16)', transform: `translateX(${jitter}px)`}} />
      <div style={{position: 'absolute', left: 60, top: 420, fontFamily: ROUND, fontWeight: 800, fontSize: 80, color: '#fff', textShadow: '0 0 12px rgba(0,0,0,0.6), 4px 0 0 rgba(255,0,80,0.6), -4px 0 0 rgba(0,200,255,0.6)', opacity: Math.floor(v * 3) % 2 ? 1 : 0.55}}>◀◀</div>
    </AbsoluteFill>
  );
};

// ---------- final plate ----------

const Delayed: React.FC<{v: number}> = ({v}) => {
  if (v < DELAY + 0.2 || v >= MON - 0.05) return null;
  const t = v - DELAY - 0.2;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 560, textAlign: 'center', opacity: fade(v, DELAY + 0.2, MON - 0.05, 0.05, 0.15)}}>
      <div style={{display: 'inline-block', background: CREAM, color: INK, borderRadius: 36, padding: '18px 36px 26px', fontFamily: ROUND, fontWeight: 800, fontSize: 72, lineHeight: 1.1, transform: `scale(${0.5 + 0.5 * pop(t, 9)}) rotate(-3deg)`, boxShadow: SHADOW}}>
        HALF-LIFE 3:
        <br />
        <span style={{color: RED, fontSize: 96}}>ПЕРЕНЕСЁН</span>
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
    <div style={{position: 'absolute', left: 80, right: 80, top: 1395, textAlign: 'center', opacity: o}}>
      <div style={{display: 'inline-block', background: PLATE_BG, borderRadius: 26, padding: '10px 28px 14px', fontFamily: ROUND, fontWeight: 700, fontSize: 58, lineHeight: 1.2, color: '#fff', boxShadow: '0 8px 26px rgba(0,0,0,0.35)'}}>
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
  const s = shotAt(v).name;
  return (
    <AbsoluteFill>
      <Rewind v={v} />
      <HlBar v={v} />
      <DayChip v={v} />
      <Sticker v={v} at={PLATE + 0.15} to={shotStart('moon') - 0.05} top={620} bg={GREEN} size={72} rot={-4}>
        ДИЕТА!
      </Sticker>
      <Sticker v={v} at={SUCK + 0.25} to={SLIPS - 0.05} top={640} bg={YELLOW} fg={INK} size={76} rot={4}>
        −5 т
      </Sticker>
      <Sticker v={v} at={SLIPS + 0.35} to={shotStart('fridge') - 0.05} top={640} bg={YELLOW} fg={INK} size={76} rot={-4}>
        −3 т
      </Sticker>
      {s === 'city' ? (
        <Sticker v={v} at={shotStart('city') + 0.4} to={shotStart('saturn') - 0.05} top={640} bg={CREAM} fg={INK} size={70} rot={3}>
          1 сутки = 3 часа
        </Sticker>
      ) : null}
      <Delayed v={v} />
      {GROUPS.map((_, g) => (
        <Caption key={g} v={v} g={g} />
      ))}
    </AbsoluteFill>
  );
};
