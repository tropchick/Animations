import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {C, DISPLAY, ROUND, clamp01, pop} from './kit';
import {FINAL, PHRASES, Shot, WAVE, WORDS, ZERO, shotAt, shotStart} from './cues';

const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// ---------- the date stamp: a neon pill on top ----------
const DATES: Record<Shot, string> = {
  hook: '18 НОЯБРЯ, 23:59',
  hook2: '18 НОЯБРЯ, 23:59',
  block: '19 НОЯБРЯ, 00:00',
  room: '19 НОЯБРЯ, 00:00',
  empty: '19 НОЯБРЯ, 08:00',
  bus: '19 НОЯБРЯ, 08:00',
  cockpit: '19 НОЯБРЯ, 08:00',
  office: '19 НОЯБРЯ, 08:00',
  jump: '19 НОЯБРЯ, 12:00',
  police: '19 НОЯБРЯ, 12:00',
  heat: '22 НОЯБРЯ',
  earth: '22 НОЯБРЯ',
  penguin: '22 НОЯБРЯ',
  miami: '25 НОЯБРЯ',
  flood: '26 НОЯБРЯ',
  gator: '26 НОЯБРЯ',
  raft: 'ДЕКАБРЬ',
  pc: 'ДЕКАБРЬ',
  build: 'СЕЙЧАС',
};
const dateAt = (v: number) => (v >= ZERO && v < shotStart('block') ? DATES.block : DATES[shotAt(v).name]);

const DateStamp: React.FC<{v: number}> = ({v}) => {
  if (v >= FINAL - 0.15) return null;
  const text = dateAt(v);
  let since = 0;
  for (let t = v; t > 0 && dateAt(t) === text; t -= 1 / 30) since = v - t;
  if (dateAt(0) === text) since = v + 1;
  const hot = text.startsWith('19 НОЯБРЯ, 00');
  const col = hot ? C.cyan : C.magenta;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', opacity: clamp01(since / 0.06)}}>
      <div
        style={{
          display: 'inline-block',
          background: 'rgba(13,7,34,0.82)',
          color: '#fff',
          border: `4px solid ${col}`,
          borderRadius: 999,
          padding: '10px 36px 12px',
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 44,
          lineHeight: 1.1,
          letterSpacing: 1,
          transform: `scale(${0.7 + 0.3 * pop(since, 10)})`,
          boxShadow: `0 0 28px ${col}, 0 0 80px ${col}66, inset 0 0 18px ${col}55`,
          textShadow: `0 0 16px ${col}`,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---------- «ИГРАЮТ» counter while the windows switch on ----------
const Players: React.FC<{v: number}> = ({v}) => {
  const a = shotStart('block') + 0.1;
  const b = shotStart('room') + 0.9;
  if (v < a || v > b) return null;
  const k = clamp01((v - WAVE[0]) / (WAVE[1] - WAVE[0]));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 262, textAlign: 'center', opacity: fade(v, a, b, 0.08, 0.2)}}>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, background: 'rgba(13,7,34,0.82)', borderRadius: 24, padding: '10px 26px 12px 14px', transform: `scale(${0.7 + 0.3 * pop(v - a, 10)})`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)'}}>
        <div style={{background: C.cyan, color: '#0d0722', borderRadius: 14, fontFamily: DISPLAY, fontWeight: 900, fontSize: 34, padding: '6px 14px 8px'}}>ИГРАЮТ</div>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 50, color: '#fff', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', minWidth: 420, textAlign: 'left'}}>{fmt(200000000 * Math.pow(k, 1.6))}</div>
      </div>
    </div>
  );
};

// ---------- final plate ----------
const Final: React.FC<{v: number}> = ({v}) => {
  if (v < FINAL) return null;
  const t = v - FINAL;
  const q = Math.floor(t * 2.5) % 2 === 0;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 300, textAlign: 'center', opacity: clamp01(t / 0.08)}}>
      <div
        style={{
          display: 'inline-block',
          background: 'rgba(13,7,34,0.9)',
          border: `6px solid ${C.magenta}`,
          borderRadius: 44,
          padding: '26px 44px 32px',
          fontFamily: DISPLAY,
          fontWeight: 900,
          fontSize: 78,
          lineHeight: 1.12,
          color: '#fff',
          transform: `scale(${0.5 + 0.5 * pop(t, 9)}) rotate(-2deg)`,
          boxShadow: `0 0 40px ${C.magenta}, 0 0 120px ${C.magenta}88, inset 0 0 24px ${C.magenta}66`,
          textShadow: `0 0 22px ${C.magenta}`,
        }}
      >
        ДО ВЫХОДА
        <br />
        НА ПК: <span style={{color: '#ffe14d', textShadow: '0 0 26px #ffb21f', opacity: q ? 1 : 0.55}}>???</span>
      </div>
    </div>
  );
};

// ---------- karaoke captions ----------
const Caption: React.FC<{v: number; g: number}> = ({v, g}) => {
  const words = WORDS.filter((w) => w[3] === g);
  if (!words.length) return null;
  const start = words[0][0] - 0.1;
  const next = WORDS.find((w) => w[3] === g + 1);
  const end = Math.min(words[words.length - 1][1] + 0.55, next ? next[0] - 0.12 : 1e9);
  const o = fade(v, start, end, 0.07, 0.09);
  if (o <= 0) return null;
  let cur = -1;
  words.forEach((w, i) => {
    if (v >= w[0] - 0.03) cur = i;
  });
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 1392, textAlign: 'center', opacity: o}}>
      <div style={{display: 'inline-block', background: 'rgba(13,7,34,0.86)', borderRadius: 28, padding: '12px 30px 16px', fontFamily: ROUND, fontWeight: 800, fontSize: 60, lineHeight: 1.2, color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.08)'}}>
        {words.map((w, i) => (
          <span key={i} style={{color: i === cur ? '#ffe14d' : '#ffffff', textShadow: i === cur ? '0 0 18px rgba(255,178,31,0.8)' : 'none', display: i <= cur ? 'inline' : 'none'}}>
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
    <DateStamp v={v} />
    <Players v={v} />
    <Final v={v} />
    {PHRASES.map((_, g) => (
      <Caption key={g} v={v} g={g} />
    ))}
  </AbsoluteFill>
);
