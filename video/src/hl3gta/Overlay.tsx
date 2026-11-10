import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ROUND} from '../bear/Overlay';
import {BILLION, FLASH, GROUPS, NOPC, NOSE, PHRASES, POP, READY, SCORE, SNORE, Shot, VOID, WIN, WORDS, Y2039, clamp01, shotAt, shotStart} from './cues';

const YELLOW = '#ffd23f';
const INK = '#2a1f3a';
const HL_GRAD = 'linear-gradient(90deg, #ffb03a, #ff7a1e 60%, #c8501a)';
const GTA_GRAD = 'linear-gradient(90deg, #ff5ab0, #c83ad0 60%, #8a3cf0)';
const RED = '#e8453c';
const PLATE = 'rgba(24,18,40,0.84)';
const CREAM = '#fff7e8';
const SHADOW = '0 8px 0 rgba(40,20,60,0.4), 0 16px 30px rgba(0,0,0,0.3)';

const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const pop = (t: number, k = 9) => (t <= 0 ? 0 : 1 - Math.exp(-t * k) * Math.cos(t * k * 1.6));

// ---------- the score as a two-lane race track: [time, hl3 points, gta points] ----------

const stepAt = (v: number) => {
  let i = 0;
  SCORE.forEach((s, k) => {
    if (v >= s[0]) i = k;
  });
  return i;
};
const lanePos = (v: number, who: 1 | 2) => {
  const i = stepAt(v);
  const prev = i > 0 ? SCORE[i - 1][who] : 0;
  const t = v - SCORE[i][0];
  const k = i === 0 ? 1 : 1 - Math.exp(-t * 6) * Math.cos(t * 9);
  return (prev + (SCORE[i][who] - prev) * k) / 3;
};

const Lane: React.FC<{v: number; who: 1 | 2; label: string; grad: string; out?: boolean}> = ({v, who, label, grad, out}) => {
  const W = 880;
  const x = lanePos(v, who);
  const M = 120;
  return (
    <div style={{position: 'relative', height: 50, marginTop: 10}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 13, height: 24, borderRadius: 12, background: 'rgba(30,22,48,0.7)', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.8)'}}>
        <div style={{position: 'absolute', left: 6, right: 6, top: 10, height: 4, backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.7) 0 18px, transparent 18px 36px)'}} />
      </div>
      {/* the finish flag */}
      <div style={{position: 'absolute', right: -6, top: 0, width: 26, height: 50, borderRadius: 4, backgroundImage: 'repeating-conic-gradient(#1a1420 0 25%, #ffffff 0 50%)', backgroundSize: '13px 12.5px', boxShadow: '0 0 0 3px #fff'}} />
      <div
        style={{
          position: 'absolute',
          left: x * (W - M - 20),
          top: 0,
          width: M,
          height: 50,
          borderRadius: 16,
          background: grad,
          color: '#fff',
          fontFamily: ROUND,
          fontWeight: 800,
          fontSize: 34,
          textAlign: 'center',
          lineHeight: '48px',
          boxShadow: '0 5px 0 rgba(40,20,60,0.45)',
          opacity: out ? 0.55 : 1,
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const ScoreBar: React.FC<{v: number}> = ({v}) => {
  const i = stepAt(v);
  const [, h, g] = SCORE[i];
  const t = v - SCORE[i][0];
  const bump = i > 0 && t < 0.8 ? pop(t, 10) : 1;
  const W = 880;
  return (
    <div style={{position: 'absolute', left: (1080 - W) / 2, width: W, top: 120}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4}}>
        <div style={{background: HL_GRAD, color: '#fff', borderRadius: 18, padding: '6px 22px 9px', fontFamily: ROUND, fontWeight: 800, fontSize: 40, boxShadow: SHADOW}}>HALF-LIFE 3</div>
        <div style={{background: CREAM, color: INK, borderRadius: 20, padding: '2px 22px 6px', fontFamily: ROUND, fontWeight: 800, fontSize: 58, fontVariantNumeric: 'tabular-nums', transform: `scale(${0.8 + 0.2 * bump})`, boxShadow: SHADOW}}>
          <span style={{color: '#e06a10'}}>{h}</span> : <span style={{color: '#8a3cf0'}}>{g}</span>
        </div>
        <div style={{background: GTA_GRAD, color: '#fff', borderRadius: 18, padding: '6px 22px 9px', fontFamily: ROUND, fontWeight: 800, fontSize: 40, boxShadow: SHADOW}}>GTA 7</div>
      </div>
      <Lane v={v} who={1} label="HL3" grad={HL_GRAD} out={v >= VOID} />
      <Lane v={v} who={2} label="GTA 7" grad={GTA_GRAD} />
    </div>
  );
};

// ---------- the round name and whose turn ----------

const ROUNDS: Partial<Record<Shot, string>> = {
  stairsH: 'РАУНД 1: ЧИСЛО',
  stairsG: 'РАУНД 1: ЧИСЛО',
  calendar: 'РАУНД 2: РАЗРАБОТКА',
  loading: 'РАУНД 2: РАЗРАБОТКА',
  sofa: 'РАУНД 3: ДЕНЬГИ',
  tower: 'РАУНД 3: ДЕНЬГИ',
  door: 'РАУНД 4: ЖЕЛЕЗО',
  toaster: 'РАУНД 4: ЖЕЛЕЗО',
  finish: 'ФИНИШ',
  photo: 'ФИНИШ',
  reveal: 'ФИНИШ',
};
const WHO: Partial<Record<Shot, 'h' | 'g'>> = {stairsH: 'h', stairsG: 'g', calendar: 'g', loading: 'h', sofa: 'h', tower: 'g', door: 'g', toaster: 'h'};

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

const RoundSticker: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v).name;
  const text = ROUNDS[s];
  if (!text) return null;
  const t = sinceSame(v, (x) => ROUNDS[x]);
  const final = text === 'ФИНИШ';
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 345, textAlign: 'center', opacity: clamp01(t / 0.08)}}>
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
    <div style={{position: 'absolute', left: 0, right: 0, top: 435, textAlign: 'center', opacity: clamp01(t / 0.08)}}>
      <div style={{display: 'inline-block', background: who === 'h' ? HL_GRAD : GTA_GRAD, color: '#fff', borderRadius: 22, padding: '6px 26px 10px', fontFamily: ROUND, fontWeight: 800, fontSize: 46, transform: `scale(${0.6 + 0.4 * pop(t, 11)}) rotate(1.5deg)`, boxShadow: SHADOW}}>
        {who === 'h' ? 'HALF-LIFE 3' : 'GTA 7'}
      </div>
    </div>
  );
};

// ---------- the hook question ----------

const HOOK_END = shotStart('race') + 0.2;
export const Question: React.FC<{v: number; still?: boolean}> = ({v, still}) => {
  if (!still && v > HOOK_END) return null;
  const o = still ? 1 : fade(v, 0, HOOK_END, 0.01, 0.25);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 345, textAlign: 'center', opacity: o, transform: `scale(${still ? 1 : 0.9 + 0.1 * pop(v + 0.15, 7)})`}}>
      <div style={{display: 'inline-block', background: CREAM, color: INK, borderRadius: 34, padding: '16px 34px 22px', fontFamily: ROUND, fontWeight: 800, fontSize: 84, lineHeight: 1.08, boxShadow: SHADOW, transform: 'rotate(-1.5deg)'}}>
        Что выйдет
        <br />
        <span style={{color: RED}}>быстрее?</span>
      </div>
    </div>
  );
};

// ---------- one-off stickers ----------

const Sticker: React.FC<{v: number; at: number; to: number; top: number; bg: string; fg?: string; size?: number; rot?: number; children: React.ReactNode}> = ({v, at, to, top, bg, fg = '#fff', size = 96, rot = -6, children}) => {
  if (v < at || v > to) return null;
  const t = v - at;
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top, textAlign: 'center', opacity: fade(v, at, to, 0.04, 0.15)}}>
      <div style={{display: 'inline-block', background: bg, color: fg, borderRadius: 32, padding: '10px 40px 16px', fontFamily: ROUND, fontWeight: 800, fontSize: size, lineHeight: 1.1, transform: `scale(${0.5 + 0.5 * pop(t, 10)}) rotate(${rot}deg)`, boxShadow: '0 12px 0 rgba(40,20,60,0.45), 0 22px 44px rgba(0,0,0,0.35)'}}>{children}</div>
    </div>
  );
};

// ---------- «99%» loading bar over HL3 ----------

const LoadBar: React.FC<{v: number}> = ({v}) => {
  const a = shotStart('loading');
  const b = shotStart('sofa');
  if (v < a || v >= b) return null;
  const pct = 0.97 + 0.02 * clamp01((v - a) / 1.5);
  return (
    <div style={{position: 'absolute', left: 150, right: 150, top: 540, opacity: fade(v, a, b, 0.12, 0.1)}}>
      <div style={{background: PLATE, borderRadius: 26, padding: '14px 30px 22px', fontFamily: ROUND, color: '#fff', boxShadow: SHADOW}}>
        <div style={{fontWeight: 800, fontSize: 46, textAlign: 'center'}}>Загрузка {Math.round(pct * 100)}%</div>
        <div style={{marginTop: 12, height: 28, borderRadius: 14, background: 'rgba(255,255,255,0.2)', overflow: 'hidden'}}>
          <div style={{width: `${pct * 100}%`, height: '100%', background: HL_GRAD}} />
        </div>
      </div>
    </div>
  );
};

// ---------- the photo finish frame ----------

const PhotoFrame: React.FC<{v: number}> = ({v}) => {
  const end = shotStart('reveal');
  if (v < FLASH || v >= end) return null;
  const t = v - FLASH;
  return (
    <AbsoluteFill style={{opacity: clamp01(t / 0.15)}}>
      <AbsoluteFill style={{background: 'rgba(255,220,160,0.16)', mixBlendMode: 'multiply'}} />
      <AbsoluteFill style={{boxShadow: 'inset 0 0 0 34px #fbf6ea, inset 0 0 0 40px rgba(0,0,0,0.25)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1210, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: INK, color: '#fff', borderRadius: 16, padding: '6px 26px 10px', fontFamily: ROUND, fontWeight: 800, fontSize: 44, transform: 'rotate(-1deg)', boxShadow: SHADOW}}>
          ФОТОФИНИШ · 0,001 с
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Flash: React.FC<{v: number}> = ({v}) => {
  let k = 0;
  if (v >= FLASH && v < FLASH + 0.7) k = Math.exp(-(v - FLASH) * 6) * 0.95;
  if (k < 0.01) return null;
  return <AbsoluteFill style={{background: '#ffffff', opacity: k}} />;
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
    <PhotoFrame v={v} />
    <Flash v={v} />
    <ScoreBar v={v} />
    <Question v={v} />
    <RoundSticker v={v} />
    <WhoChip v={v} />
    <LoadBar v={v} />
    <Sticker v={v} at={PHRASES[1][0] + 0.3} to={PHRASES[2][0] - 0.1} top={1150} bg={HL_GRAD} size={64} rot={-4}>
      HL3: ждём 19 лет
    </Sticker>
    <Sticker v={v} at={PHRASES[2][0] + 0.2} to={shotStart('stairsH') - 0.05} top={1150} bg={GTA_GRAD} size={64} rot={3}>
      GTA 7: не анонсирована
    </Sticker>
    <Sticker v={v} at={SNORE} to={shotStart('loading') - 0.05} top={640} bg={CREAM} fg={INK} size={70} rot={8}>
      Zzz…
    </Sticker>
    <Sticker v={v} at={READY} to={shotStart('sofa') - 0.05} top={1150} bg={YELLOW} fg={INK} size={72} rot={-4}>
      ПОЧТИ ГОТОВО
    </Sticker>
    <Sticker v={v} at={BILLION} to={shotStart('door') - 0.05} top={1150} bg="#2fae5a" size={62} rot={3}>
      $1 000 000 000 за день
    </Sticker>
    <Sticker v={v} at={POP + 0.15} to={shotStart('finish') - 0.05} top={1150} bg={HL_GRAD} size={66} rot={-3}>
      Работает на тостере
    </Sticker>
    <Sticker v={v} at={NOSE} to={shotStart('reveal') - 0.05} top={560} bg={HL_GRAD} size={64} rot={-3}>
      HL3 впереди на нос!
    </Sticker>
    <Sticker v={v} at={VOID} to={shotStart('podium') - 0.05} top={1120} bg={RED} size={86} rot={-8}>
      НЕ ЗАСЧИТАНО
    </Sticker>
    <Sticker v={v} at={WIN + 0.2} to={1e9} top={300} bg={CREAM} fg={INK} size={58} rot={-2}>
      ПОБЕДИТЕЛЬ:
      <br />
      <span style={{color: '#8a3cf0', fontSize: 92}}>GTA 7</span>
    </Sticker>
    <Sticker v={v} at={Y2039} to={NOPC - 0.05} top={1150} bg={YELLOW} fg={INK} size={72} rot={3}>
      в 2039 году
    </Sticker>
    <Sticker v={v} at={NOPC} to={1e9} top={1150} bg={INK} size={64} rot={-3}>
      <span style={{color: YELLOW}}>без версии для ПК</span>
    </Sticker>
    {GROUPS.map((_, g) => (
      <Caption key={g} v={v} g={g} />
    ))}
  </AbsoluteFill>
);
