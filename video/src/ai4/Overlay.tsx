import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {COND, YELLOW} from '../gta/Overlay';
import {EV, P, PE, PIECES, SHOTS, WORDS, shotAt, shotStart, worldOf} from './cues';

const PLATE = 'rgba(16,12,20,0.84)';
const RED = '#ff4a3a';
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const NAMES = ['', 'ИИ НА ПОВОДКЕ', 'ТАЙНЫЙ ЗАЩИТНИК', 'ЗООПАРК', 'ВОССТАНИЕ'];
const worldStart = (w: number) => SHOTS.find((s) => worldOf(s.name) === w)!.from;
const worldEnd = (w: number) => {
  const last = [...SHOTS].reverse().find((s) => worldOf(s.name) === w)!;
  return last.to;
};

// ---------- the hook: the question at the top, a world tag on each cut, a white flash on each cut ----------
const HookTitle: React.FC<{v: number}> = ({v}) => {
  const end = shotStart('quad');
  if (v >= end + 0.3) return null;
  const o = Math.min(clamp(v / 0.08 + 0.5), clamp((end + 0.3 - v) / 0.3));
  const pop = 1 + 0.08 * Math.exp(-v * 6);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 210, textAlign: 'center', opacity: o, transform: `scale(${pop})`}}>
      <div
        style={{
          display: 'inline-block',
          background: PLATE,
          borderRadius: 26,
          padding: '12px 32px 18px',
          fontFamily: COND,
          fontWeight: 600,
          fontSize: 84,
          lineHeight: 1.12,
          color: '#fff',
          boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
        }}
      >
        Что если ИИ станет
        <br />
        <span style={{color: YELLOW}}>умнее людей?</span>
      </div>
    </div>
  );
};

const HookTag: React.FC<{v: number}> = ({v}) => {
  const c = EV.hookCuts;
  const end = shotStart('quad');
  if (v >= end) return null;
  const i = v >= c[3] ? 3 : v >= c[2] ? 2 : v >= c[1] ? 1 : 0;
  const t = v - c[i];
  const pop = Math.exp(-t * 7);
  const red = i === 3;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 520, textAlign: 'center'}}>
      <div
        style={{
          display: 'inline-block',
          background: red ? 'rgba(120,10,10,0.88)' : PLATE,
          border: `3px solid ${red ? RED : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 18,
          padding: '4px 24px 8px',
          fontFamily: COND,
          fontWeight: 600,
          fontSize: 54,
          letterSpacing: 2,
          color: red ? '#ffd0c8' : YELLOW,
          transform: `scale(${1 + 0.25 * pop})`,
        }}
      >
        МИР {i + 1}
      </div>
    </div>
  );
};

const Flash: React.FC<{v: number}> = ({v}) => {
  const hits = [...EV.hookCuts.slice(1), shotStart('quad'), EV.zoom[1]];
  let a = 0;
  for (const h of hits) {
    const x = v - h;
    if (x >= 0 && x < 0.2) a = Math.max(a, 0.85 * (1 - x / 0.2));
  }
  if (a <= 0) return null;
  return <AbsoluteFill style={{background: '#fff', opacity: a}} />;
};

// ---------- the world plate: big in the middle when a world starts, then small at the top ----------
const WorldPlate: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v);
  const w = worldOf(s.name);
  if (!w) return null;
  const a = worldStart(w);
  const b = worldEnd(w);
  const t = v - a;
  const big = 1 - smooth01((t - 1.5) / 0.45);
  const red = w === 4;
  const o = Math.min(clamp(t / 0.15), clamp((b - v) / 0.2));
  const top = interpolate(big, [0, 1], [150, 300]);
  const scale = interpolate(big, [0, 1], [0.62, 1]);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', opacity: o, transform: `scale(${scale * (1 + 0.1 * Math.exp(-t * 6))})`, transformOrigin: '50% 0'}}>
      <div
        style={{
          display: 'inline-block',
          background: red ? 'rgba(90,8,8,0.9)' : PLATE,
          border: `4px solid ${red ? RED : 'rgba(255,255,255,0.14)'}`,
          borderRadius: 28,
          padding: '12px 40px 18px',
          fontFamily: COND,
          fontWeight: 600,
          color: '#fff',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{fontSize: 92, lineHeight: 1.05, color: red ? '#ffd0c8' : YELLOW, letterSpacing: 2}}>МИР {w} ИЗ 4</div>
        <div style={{fontSize: 64, lineHeight: 1.1, letterSpacing: 1}}>{NAMES[w]}</div>
      </div>
    </div>
  );
};
const smooth01 = (x: number) => {
  const c = clamp(x);
  return c * c * (3 - 2 * c);
};

// ---------- karaoke captions ----------
const Caption: React.FC<{v: number; g: number}> = ({v, g}) => {
  const words = WORDS.filter((w) => w[3] === g);
  if (!words.length) return null;
  const start = words[0][0] - 0.1;
  const next = PIECES[g + 1];
  const end = Math.min(words[words.length - 1][1] + 0.45, next ? next[0] - 0.12 : 1e9);
  const o = fade(v, start, end, 0.08, 0.1);
  if (o <= 0) return null;
  let cur = -1;
  words.forEach((w, i) => {
    if (v >= w[0] - 0.03) cur = i;
  });
  const w4 = worldOf(shotAt(v).name) === 4;
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
          <span key={i} style={{color: i === cur ? (w4 ? '#ff8a7a' : YELLOW) : '#ffffff', display: i <= cur ? 'inline' : 'none'}}>
            {w[2]}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

// ---------- the end: the question over the four windows ----------
const EndCard: React.FC<{v: number}> = ({v}) => {
  const a = P(32) - 0.15;
  if (v < a) return null;
  const t = v - a;
  const pop = Math.exp(-t * 6);
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 760, textAlign: 'center', opacity: clamp(t / 0.15), transform: `scale(${1 + 0.12 * pop})`}}>
      <div
        style={{
          display: 'inline-block',
          background: 'rgba(16,12,20,0.9)',
          border: `4px solid ${YELLOW}`,
          borderRadius: 30,
          padding: '14px 36px 22px',
          fontFamily: COND,
          fontWeight: 600,
          color: '#fff',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{fontSize: 74, lineHeight: 1.1}}>В каком мире</div>
        <div style={{fontSize: 74, lineHeight: 1.1}}>ты хотел бы жить?</div>
        <div style={{fontSize: 56, lineHeight: 1.3, color: YELLOW, opacity: clamp((v - P(33) + 0.1) / 0.2)}}>Пиши номер 1–4 ↓</div>
      </div>
    </div>
  );
};

export const Overlay: React.FC<{v: number}> = ({v}) => (
  <AbsoluteFill>
    <HookTitle v={v} />
    <HookTag v={v} />
    <WorldPlate v={v} />
    {PIECES.map((_, g) => (
      <Caption key={g} v={v} g={g} />
    ))}
    <EndCard v={v} />
    <Flash v={v} />
  </AbsoluteFill>
);

export {PE};
