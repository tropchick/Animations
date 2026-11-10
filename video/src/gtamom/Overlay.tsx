import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ROUND} from '../bear/Overlay';
import {BAIT, DL, FLASH, GROUPS, GTA7, LIFT_AT, NET_OFF, PHRASES, ROWS, ROW_BIG, SCORE, Shot, THUNDER, WIN, WORDS, clamp01, shotAt, shotStart} from './cues';

const YELLOW = '#ffd23f';
const INK = '#2a1f3a';
const PINK = '#f0559a';
const GTA_GRAD = 'linear-gradient(90deg, #ff8a1e, #c83ad0 70%, #8a3cf0)';
const RED = '#e8453c';
const PLATE = 'rgba(24,18,40,0.84)';
const CREAM = '#fff7e8';
const SHADOW = '0 8px 0 rgba(40,20,60,0.4), 0 16px 30px rgba(0,0,0,0.3)';

const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const pop = (t: number, k = 9) => (t <= 0 ? 0 : 1 - Math.exp(-t * k) * Math.cos(t * k * 1.6));

// ---------- the score: [time, gta points, mom points, gta share of the bar] ----------

const stepAt = (v: number) => {
  let i = 0;
  SCORE.forEach((s, k) => {
    if (v >= s[0]) i = k;
  });
  return i;
};
const share = (v: number) => {
  const i = stepAt(v);
  const prev = i > 0 ? SCORE[i - 1][3] : SCORE[0][3];
  const t = v - SCORE[i][0];
  const k = i === 0 ? 1 : 1 - Math.exp(-t * 6) * Math.cos(t * 10);
  const wob = SCORE[i][3] === 0.5 && i < SCORE.length - 1 ? 0.012 * Math.sin(v * 7) : 0;
  return prev + (SCORE[i][3] - prev) * k + wob;
};

export const ScoreBar: React.FC<{v: number}> = ({v}) => {
  const i = stepAt(v);
  const [, g, m] = SCORE[i];
  const t = v - SCORE[i][0];
  const bump = i > 0 && t < 0.8 ? pop(t, 10) : 1;
  const sh = share(v);
  const W = 880;
  const won = v >= WIN;
  return (
    <div style={{position: 'absolute', left: (1080 - W) / 2, width: W, top: 150}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10}}>
        <div style={{background: GTA_GRAD, color: '#fff', borderRadius: 18, padding: '6px 22px 9px', fontFamily: ROUND, fontWeight: 800, fontSize: 40, boxShadow: SHADOW}}>GTA 6</div>
        <div style={{background: CREAM, color: INK, borderRadius: 20, padding: '2px 22px 6px', fontFamily: ROUND, fontWeight: 800, fontSize: 58, fontVariantNumeric: 'tabular-nums', transform: `scale(${0.8 + 0.2 * bump})`, boxShadow: SHADOW}}>
          <span style={{color: '#e06a10'}}>{g}</span> : <span style={{color: PINK}}>{m}</span>
        </div>
        <div style={{background: PINK, color: '#fff', borderRadius: 18, padding: '6px 18px 9px', fontFamily: ROUND, fontWeight: 800, fontSize: 40, boxShadow: SHADOW}}>МАТЬ ГАБЕНА</div>
      </div>
      <div style={{position: 'relative', height: 40, borderRadius: 20, overflow: 'hidden', background: PINK, boxShadow: '0 6px 0 rgba(40,20,60,0.35)'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(0, Math.min(1, sh)) * 100}%`, background: GTA_GRAD}} />
        {!won ? <div style={{position: 'absolute', left: '50%', top: 4, bottom: 4, width: 4, marginLeft: -2, background: 'rgba(255,255,255,0.75)'}} /> : null}
        <div style={{position: 'absolute', inset: 0, borderRadius: 20, boxShadow: 'inset 0 0 0 5px rgba(255,255,255,0.9)'}} />
      </div>
    </div>
  );
};

// ---------- the test name and who is shown ----------

const TESTS: Partial<Record<Shot, string>> = {
  selfie: 'ТЕСТ 1: ИНТЕРНЕТ',
  wifi: 'ТЕСТ 1: ИНТЕРНЕТ',
  planet: 'ТЕСТ 1: ИНТЕРНЕТ',
  cloudG: 'ТЕСТ 2: ОБЛАКО',
  cloudM: 'ТЕСТ 2: ОБЛАКО',
  washer: 'ТЕСТ 3: ЗАПУСК',
  console: 'ТЕСТ 3: ЗАПУСК',
  europe: 'ТЕСТ 3: ЗАПУСК',
  loading: 'ТЕСТ 4: ЗАГРУЗКА',
  lift: 'ТЕСТ 4: ЗАГРУЗКА',
  files: 'ФИНАЛ',
};
const WHO: Partial<Record<Shot, 'g' | 'm'>> = {selfie: 'm', wifi: 'm', planet: 'g', cloudG: 'g', cloudM: 'm', washer: 'm', console: 'g', europe: 'g', loading: 'g', lift: 'm'};

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
      <div style={{display: 'inline-block', background: who === 'g' ? GTA_GRAD : PINK, color: '#fff', borderRadius: 22, padding: '6px 26px 10px', fontFamily: ROUND, fontWeight: 800, fontSize: 46, transform: `scale(${0.6 + 0.4 * pop(t, 11)}) rotate(1.5deg)`, boxShadow: SHADOW}}>
        {who === 'g' ? 'GTA 6' : 'МАТЬ ГАБЕНА'}
      </div>
    </div>
  );
};

// ---------- the hook ----------

const HOOK_END = shotStart('selfie') - 0.1;
const Hook: React.FC<{v: number}> = ({v}) => {
  if (v > HOOK_END) return null;
  const o = fade(v, 0, HOOK_END, 0.01, 0.25);
  return (
    <>
      <div style={{position: 'absolute', left: 90, right: 90, top: 330, textAlign: 'center', opacity: o, transform: `scale(${0.9 + 0.1 * pop(v + 0.15, 7)})`}}>
        <div style={{display: 'inline-block', background: CREAM, color: INK, borderRadius: 34, padding: '18px 34px 22px', fontFamily: ROUND, fontWeight: 800, fontSize: 80, lineHeight: 1.1, boxShadow: SHADOW, transform: 'rotate(-1.5deg)'}}>
          Что весит <span style={{color: RED}}>больше?</span>
        </div>
      </div>
      <Tag v={v} at={PHRASES[0][0] + 1.6} left={70} bg={GTA_GRAD}>212 ГБ</Tag>
      <Tag v={v} at={PHRASES[1][0] + 1.2} left={650} bg={PINK}>??? ГБ</Tag>
    </>
  );
};
const Tag: React.FC<{v: number; at: number; left: number; bg: string; children: React.ReactNode}> = ({v, at, left, bg, children}) => {
  if (v < at || v > HOOK_END) return null;
  const t = v - at;
  return (
    <div style={{position: 'absolute', left, width: 360, top: 690, textAlign: 'center', opacity: clamp01(t / 0.06)}}>
      <div style={{display: 'inline-block', background: bg, color: '#fff', borderRadius: 26, padding: '8px 28px 12px', fontFamily: ROUND, fontWeight: 800, fontSize: 64, transform: `scale(${0.5 + 0.5 * pop(t, 10)}) rotate(-3deg)`, boxShadow: SHADOW}}>{children}</div>
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

// download progress over the planet
const Download: React.FC<{v: number}> = ({v}) => {
  const to = NET_OFF[0] + 0.25;
  if (v < DL - 0.1 || v > to) return null;
  const k = clamp01((v - DL) / (NET_OFF[0] - DL));
  return (
    <div style={{position: 'absolute', left: 150, right: 150, top: 1140, opacity: fade(v, DL - 0.1, to, 0.1, 0.2)}}>
      <div style={{background: PLATE, borderRadius: 26, padding: '16px 30px 22px', fontFamily: ROUND, color: '#fff', boxShadow: SHADOW}}>
        <div style={{fontWeight: 800, fontSize: 44, textAlign: 'center'}}>Скачивают GTA 6: {Math.round(k * 900 + 100)} млн</div>
        <div style={{marginTop: 12, height: 26, borderRadius: 13, background: 'rgba(255,255,255,0.2)', overflow: 'hidden'}}>
          <div style={{width: `${3 + k * 9}%`, height: '100%', background: GTA_GRAD}} />
        </div>
      </div>
    </div>
  );
};

// ---------- the game files window ----------

const FILES_AT = PHRASES[16][0] + 0.1;
const FilesWindow: React.FC<{v: number}> = ({v}) => {
  const end = shotStart('island');
  if (v < FILES_AT - 0.05 || v >= end) return null;
  const t = v - FILES_AT;
  const o = fade(v, FILES_AT - 0.05, end, 0.12, 0.12);
  const row = (i: number, name: string, size: string, color: string, big = false) => {
    const at = ROWS[i];
    if (v < at) return null;
    const rt = v - at;
    const sizeShown = !big || v >= ROW_BIG;
    const bt = v - ROW_BIG;
    const grow = big && sizeShown ? 1 + 0.35 * pop(bt, 8) : 1;
    return (
      <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: big ? '18px 26px' : '14px 26px', marginTop: 14, borderRadius: 20, background: big ? 'rgba(240,85,154,0.22)' : 'rgba(255,255,255,0.08)', transform: `translateX(${(1 - pop(rt, 10)) * -40}px)`, opacity: clamp01(rt / 0.08)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{width: 46, height: 38, borderRadius: 8, background: color, boxShadow: 'inset 0 -6px 0 rgba(0,0,0,0.2)'}} />
          <span style={{fontSize: big ? 52 : 46, fontWeight: 800, color: big ? '#ffb8d8' : '#fff'}}>{name}</span>
        </div>
        {sizeShown ? (
          <span style={{fontSize: big ? 70 : 46, fontWeight: 800, color: big ? PINK : '#ffd23f', display: 'inline-block', transform: `scale(${grow})`, transformOrigin: 'right center', textShadow: big ? '0 0 24px rgba(240,85,154,0.7)' : undefined}}>{size}</span>
        ) : null}
      </div>
    );
  };
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 560, opacity: o, transform: `scale(${0.85 + 0.15 * pop(t, 9)})`}}>
      <div style={{background: 'rgba(20,14,36,0.94)', borderRadius: 30, overflow: 'hidden', boxShadow: '0 16px 0 rgba(10,5,20,0.5), 0 30px 60px rgba(0,0,0,0.5)', fontFamily: ROUND, color: '#fff'}}>
        <div style={{background: GTA_GRAD, padding: '16px 28px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <span style={{fontSize: 46, fontWeight: 800}}>GTA 6 · файлы</span>
          <span style={{fontSize: 46, fontWeight: 800}}>212 ГБ</span>
        </div>
        <div style={{padding: '6px 22px 26px'}}>
          {row(0, 'Город', '2 ГБ', '#5ab0ff')}
          {row(1, 'Машины', '3 ГБ', '#ffd23f')}
          {row(2, 'Мать Габена', '207 ГБ', PINK, true)}
        </div>
      </div>
    </div>
  );
};

// ---------- final plates ----------

const Winner: React.FC<{v: number}> = ({v}) => {
  if (v < WIN || v >= GTA7) return null;
  const t = v - WIN;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 480, textAlign: 'center', opacity: fade(v, WIN, GTA7, 0.1, 0.15)}}>
      <div style={{display: 'inline-block', background: CREAM, color: INK, borderRadius: 36, padding: '14px 32px 20px', fontFamily: ROUND, fontWeight: 800, fontSize: 58, lineHeight: 1.1, transform: `scale(${0.5 + 0.5 * pop(t, 9)}) rotate(-2deg)`, boxShadow: SHADOW}}>
        ПОБЕДИТЕЛЬ:
        <br />
        <span style={{color: PINK, fontSize: 80}}>МАТЬ ГАБЕНА</span>
      </div>
    </div>
  );
};

const Flash: React.FC<{v: number}> = ({v}) => {
  let k = 0;
  if (v >= FLASH && v < FLASH + 0.6) k = Math.exp(-(v - FLASH) * 7) * 0.85;
  if (v >= THUNDER && v < THUNDER + 0.4) k = Math.max(k, Math.exp(-(v - THUNDER) * 10) * 0.5);
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
    <Flash v={v} />
    <ScoreBar v={v} />
    <Hook v={v} />
    <TestSticker v={v} />
    <WhoChip v={v} />
    <Download v={v} />
    <Sticker v={v} at={NET_OFF[0] + 0.5} to={shotStart('cloudG') - 0.05} top={1140} bg={RED} size={72} rot={-4}>
      НЕТ СЕТИ
    </Sticker>
    <Sticker v={v} at={LIFT_AT + 0.1} to={shotStart('files') - 0.05} top={1130} bg={INK} size={56} rot={-3}>
      <span style={{color: YELLOW}}>ЗАГРУЗКА 3%…</span> с 2004 года
    </Sticker>
    <Sticker v={v} at={shotStart('europe') + 0.15} to={shotStart('loading') - 0.05} top={1200} bg={CREAM} fg={INK} size={60} rot={3}>
      ЕВРОПА
    </Sticker>
    <FilesWindow v={v} />
    <Winner v={v} />
    <Sticker v={v} at={BAIT} to={shotStart('robe') + 0.4} top={1130} bg={YELLOW} fg={INK} size={88} rot={4}>
      1 ГБ = 1 КГ
    </Sticker>
    <Sticker v={v} at={GTA7} to={1e9} top={560} bg={CREAM} fg={INK} size={70} rot={-2}>
      Остальное выйдет
      <br />
      <span style={{color: '#e06a10', fontSize: 96}}>в GTA 7</span>
    </Sticker>
    {GROUPS.map((_, g) => (
      <Caption key={g} v={v} g={g} />
    ))}
  </AbsoluteFill>
);
