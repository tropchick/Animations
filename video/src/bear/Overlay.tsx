import React from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate} from 'remotion';
import '@fontsource/rubik/600.css';
import '@fontsource/rubik/700.css';
import '@fontsource/rubik/800.css';
import {GROUPS, ROAR, RUSTLE, SUBS, Shot, TITLE, WALK, WORDS, clamp01, shotAt, shotEnd, shotStart} from './cues';
import {fmt} from './tex';

export const ROUND = "'Rubik', 'Arial', sans-serif";
const HONEY = '#ffc94a';
const INK = '#3b2412';
const PLATE = 'rgba(34,20,9,0.84)';

const handle = delayRender('Loading Rubik');
Promise.all([document.fonts.load("600 40px 'Rubik'"), document.fonts.load("700 60px 'Rubik'"), document.fonts.load("800 60px 'Rubik'")])
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));

const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
// a springy pop: 0 → overshoot → 1
const pop = (t: number, k = 9) => (t <= 0 ? 0 : 1 - Math.exp(-t * k) * Math.cos(t * k * 1.6));

// ---------- the first seconds: the question ----------

const HOOK_END = 2.75;
const Hook: React.FC<{v: number}> = ({v}) => {
  if (v > HOOK_END) return null;
  const o = fade(v, 0, HOOK_END, 0.01, 0.25);
  const s = 0.9 + 0.1 * pop(v + 0.15, 7);
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top: 210, textAlign: 'center', opacity: o, transform: `scale(${s})`}}>
      <div
        style={{
          display: 'inline-block',
          background: '#fff7e8',
          color: INK,
          borderRadius: 34,
          padding: '18px 34px 22px',
          fontFamily: ROUND,
          fontWeight: 800,
          fontSize: 70,
          lineHeight: 1.12,
          boxShadow: '0 10px 0 rgba(70,36,10,0.45), 0 18px 40px rgba(0,0,0,0.35)',
          transform: 'rotate(-1.5deg)',
        }}
      >
        Что если она <span style={{color: '#d9822b'}}>реально</span> выбрала медведя?
      </div>
    </div>
  );
};

// ---------- the day stamp ----------

const DATES: Partial<Record<Shot, string>> = {
  phone: 'ДЕНЬ 1, 10:00',
  path: 'ДЕНЬ 1, 14:00',
  rise: 'ДЕНЬ 1, 14:02',
  throw: 'ДЕНЬ 1, 14:03',
  wrapper: 'ДЕНЬ 1, 14:03',
  sit: 'ДЕНЬ 1, 14:03',
  views: 'ДЕНЬ 2',
  carry: 'ДЕНЬ 3',
  dance: 'ДЕНЬ 7',
  unbox: 'ДЕНЬ 7',
  contract: 'ДЕНЬ 14',
  build: 'ДЕНЬ 25',
  den: 'ДЕНЬ 40',
  dinner: 'ДЕНЬ 45',
  sign: 'ДЕНЬ 45',
  ladle: 'ДЕНЬ 45',
  crowd: 'ДЕНЬ 50',
  jaw: 'ДЕНЬ 50',
  star: 'ДЕНЬ 51',
  pass: 'ДЕНЬ 51',
  podcast: 'ДЕНЬ 60',
  lean: 'ДЕНЬ 60',
  freeze: 'ДЕНЬ 60',
  answer: 'ДЕНЬ 60',
};

const DateStamp: React.FC<{v: number}> = ({v}) => {
  if (v < HOOK_END - 0.1) return null;
  const s = shotAt(v);
  const text = DATES[s.name];
  if (!text) return null;
  // when did this text appear?
  let since = s.from;
  for (let t = s.from - 0.02; t > 0; t -= 0.1) {
    const p = shotAt(t);
    if (DATES[p.name] !== text) break;
    since = p.from;
  }
  if (s.name === 'phone') since = HOOK_END - 0.1;
  const t = v - since;
  const sc = 0.6 + 0.4 * pop(t, 10);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 168, textAlign: 'center', opacity: clamp01(t / 0.08)}}>
      <div
        style={{
          display: 'inline-block',
          background: '#fff7e8',
          color: INK,
          borderRadius: 999,
          padding: '8px 34px 11px',
          fontFamily: ROUND,
          fontWeight: 800,
          fontSize: 50,
          lineHeight: 1.1,
          letterSpacing: 0.5,
          transform: `scale(${sc}) rotate(-2deg)`,
          boxShadow: '0 7px 0 rgba(70,36,10,0.4), 0 14px 30px rgba(0,0,0,0.3)',
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---------- the live stream UI (day 1 in the forest, day 60 on the podcast) ----------

const Eye: React.FC = () => (
  <svg width={40} height={28} viewBox="0 0 40 28" style={{marginRight: 10, verticalAlign: '-3px'}}>
    <path d="M2 14 C9 3 31 3 38 14 C31 25 9 25 2 14 Z" fill="none" stroke="#fff" strokeWidth={3.4} />
    <circle cx={20} cy={14} r={6} fill="#fff" />
  </svg>
);

const LiveBar: React.FC<{v: number; viewers: number; title?: string; top?: number; o?: number; bump?: number}> = ({v, viewers, title, top = 262, o = 1, bump = 0}) => (
  <div style={{position: 'absolute', left: 90, right: 90, top, opacity: o}}>
    <div style={{display: 'flex', justifyContent: 'center', gap: 14}}>
      <div style={{background: '#ff3b4e', color: '#fff', borderRadius: 14, padding: '6px 18px 8px', fontFamily: ROUND, fontWeight: 800, fontSize: 40, display: 'flex', alignItems: 'center'}}>
        <span style={{display: 'inline-block', width: 16, height: 16, borderRadius: 8, background: '#fff', marginRight: 12, opacity: Math.sin(v * 6) > -0.3 ? 1 : 0.25}} />
        ЭФИР
      </div>
      <div style={{background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 14, padding: '6px 18px 8px', fontFamily: ROUND, fontWeight: 700, fontSize: 40, transform: `scale(${1 + 0.18 * bump})`}}>
        <Eye />
        {fmt(viewers)}
      </div>
    </div>
    {title ? (
      <div style={{textAlign: 'center', marginTop: 14}}>
        <span style={{display: 'inline-block', background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: 14, padding: '6px 20px 8px', fontFamily: ROUND, fontWeight: 700, fontSize: 40}}>{title}</span>
      </div>
    ) : null}
  </div>
);

// viewers of Anya's first stream: a dozen, then the roar goes viral
const streamViewers = (v: number) => {
  if (v < ROAR[0]) return 12 + Math.floor(clamp01((v - WALK[0]) / 4.5) * 5) + (v > RUSTLE ? 9 : 0);
  const k = clamp01((v - ROAR[0]) / 2.2);
  return Math.round(26 + (48120 - 26) * k * k);
};

const CHAT: [number, string, string, string][] = [
  [7.35, 'kotik_08', 'привет из Твери', '#7bc4ff'],
  [8.6, 'lesnik', 'а медведь где?', '#9be37a'],
  [10.15, 'masha.k', 'СЗАДИ!!!', '#ff8a7a'],
  [10.75, 'den4ik', 'обернись', '#ffcf6a'],
  [11.7, 'vika_v', 'МЕДВЕДЬ', '#d6a1ff'],
  [13.15, 'pashok', 'ахахахах', '#7bc4ff'],
  [14.15, 'olya', 'это постановка?', '#9be37a'],
];

const Chat: React.FC<{v: number; end: number}> = ({v, end}) => {
  const shown = CHAT.filter((c) => v >= c[0]).slice(-4);
  return (
    <div style={{position: 'absolute', left: 90, width: 640, top: 1040, height: 320, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 10, opacity: fade(v, 0, end, 0.01, 0.2)}}>
      {shown.map((c, i) => {
        const t = v - c[0];
        const age = shown.length - 1 - i;
        const loud = c[2] === c[2].toUpperCase() && /[А-Я]/.test(c[2]);
        return (
          <div key={c[0]} style={{display: 'flex', alignItems: 'center', opacity: clamp01(t / 0.12) * (1 - 0.18 * age), transform: `translateX(${-30 * (1 - pop(t, 12))}px)`}}>
            <div style={{width: 46, height: 46, borderRadius: 23, background: c[3], marginRight: 14, flex: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.3)'}} />
            <div style={{background: 'rgba(0,0,0,0.45)', borderRadius: 18, padding: '4px 16px 7px', fontFamily: ROUND, color: '#fff'}}>
              <span style={{fontWeight: 600, fontSize: 34, color: c[3], marginRight: 12}}>{c[1]}</span>
              <span style={{fontWeight: loud ? 800 : 600, fontSize: loud ? 42 : 38}}>{c[2]}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Stream: React.FC<{v: number}> = ({v}) => {
  const a = shotStart('path');
  const b = shotEnd('rise');
  if (v < a || v >= b) return null;
  const o = clamp01((v - a) / 0.15);
  const bump = v > ROAR[0] ? Math.exp(-(v - ROAR[0]) * 3) : 0;
  return (
    <>
      <LiveBar v={v} viewers={streamViewers(v)} title="ДЕНЬ В ЛЕСУ С МЕДВЕДЕМ" o={o} bump={bump} />
      <Chat v={v - 0} end={b} />
    </>
  );
};

const Podcast: React.FC<{v: number}> = ({v}) => {
  const a = shotStart('podcast');
  const b = shotStart('freeze');
  const c = shotStart('answer');
  const d = shotEnd('answer');
  const on = (v >= a && v < b) || (v >= c && v < d);
  if (!on) return null;
  const t = v - a;
  const n = Math.round(20000000 - 400000 * Math.exp(-t * 0.8) + 1234 * Math.sin(v * 2));
  return <LiveBar v={v} viewers={n} o={clamp01(t / 0.2)} />;
};

// ---------- the subscriber counter (day 7) ----------

const Subs: React.FC<{v: number}> = ({v}) => {
  const a = SUBS[0] - 0.25;
  const b = shotEnd('unbox') - 0.05;
  if (v < a || v > b) return null;
  const k = clamp01((v - SUBS[0]) / (SUBS[1] - SUBS[0]));
  const n = k >= 1 ? 10000000 : Math.round(Math.pow(k, 2.2) * 10000000 + 845000 * k * (1 - k));
  const done = v - SUBS[1];
  const s = done > 0 ? 1 + 0.16 * Math.exp(-done * 5) * Math.cos(done * 18) : 0.7 + 0.3 * pop(v - a, 10);
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top: 262, textAlign: 'center', opacity: fade(v, a, b, 0.1, 0.15)}}>
      <div style={{display: 'inline-flex', alignItems: 'center', background: '#fff7e8', borderRadius: 26, padding: '10px 26px 12px 14px', transform: `scale(${s})`, boxShadow: '0 8px 0 rgba(70,36,10,0.4), 0 16px 30px rgba(0,0,0,0.3)'}}>
        <div style={{background: '#ff3b4e', borderRadius: 16, color: '#fff', fontFamily: ROUND, fontWeight: 800, fontSize: 36, padding: '6px 16px 8px', marginRight: 20}}>ПОДПИСЧИКИ</div>
        <div style={{fontFamily: ROUND, fontWeight: 800, fontSize: 66, color: INK, minWidth: 360, textAlign: 'left', fontVariantNumeric: 'tabular-nums'}}>{fmt(n)}</div>
      </div>
    </div>
  );
};

// ---------- karaoke captions ----------

const TAGS: Record<string, [string, string]> = {
  mom: ['МАМА', '#e0566b'],
  host: ['ВЕДУЩИЙ', '#4f8df0'],
  bear: ['МЕДВЕДЬ', '#c47a2c'],
};

const Caption: React.FC<{v: number; g: number}> = ({v, g}) => {
  const words = WORDS.filter((w) => w[3] === g);
  if (!words.length) return null;
  const who = words[0][4];
  if (who === 'bear') return null; // the answer gets its own big title
  const start = words[0][0] - 0.1;
  const next = WORDS.find((w) => w[3] === g + 1);
  const end = Math.min(words[words.length - 1][1] + 0.5, next ? next[0] - 0.12 : 1e9);
  const o = fade(v, start, end, 0.08, 0.1);
  if (o <= 0) return null;
  let cur = -1;
  words.forEach((w, i) => {
    if (v >= w[0] - 0.03) cur = i;
  });
  const tag = TAGS[who];
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top: 1395, textAlign: 'center', opacity: o}}>
      {tag ? (
        <div style={{marginBottom: -6}}>
          <span style={{display: 'inline-block', background: tag[1], color: '#fff', fontFamily: ROUND, fontWeight: 800, fontSize: 34, borderRadius: 12, padding: '3px 16px 6px', transform: 'rotate(-2deg)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'}}>{tag[0]}</span>
        </div>
      ) : null}
      <div
        style={{
          display: 'inline-block',
          background: PLATE,
          borderRadius: 26,
          padding: '10px 28px 14px',
          fontFamily: ROUND,
          fontWeight: 700,
          fontSize: 58,
          lineHeight: 1.2,
          color: '#fff',
          boxShadow: '0 8px 26px rgba(0,0,0,0.35)',
        }}
      >
        {words.map((w, i) => (
          <span key={i} style={{color: i === cur ? HONEY : '#ffffff', display: i <= cur ? 'inline' : 'none'}}>
            {w[2]}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

// «С мёдом.»: the punchline, big
const Answer: React.FC<{v: number}> = ({v}) => {
  const words = WORDS.filter((w) => w[4] === 'bear');
  if (!words.length) return null;
  const a = words[0][0] - 0.04;
  const b = shotEnd('answer') - 0.05;
  if (v < a || v > b) return null;
  const t = v - a;
  const second = v >= words[1][0] - 0.03;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1300, textAlign: 'center', opacity: fade(v, a, b, 0.02, 0.18)}}>
      <div style={{marginBottom: 6}}>
        <span style={{display: 'inline-block', background: TAGS.bear[1], color: '#fff', fontFamily: ROUND, fontWeight: 800, fontSize: 38, borderRadius: 12, padding: '3px 18px 6px', transform: 'rotate(-2deg)'}}>МЕДВЕДЬ</span>
      </div>
      <div
        style={{
          display: 'inline-block',
          fontFamily: ROUND,
          fontWeight: 800,
          fontSize: 132,
          lineHeight: 1.05,
          color: HONEY,
          WebkitTextStroke: '10px #3b2412',
          paintOrder: 'stroke fill',
          textShadow: '0 12px 0 rgba(59,36,18,0.55), 0 24px 50px rgba(0,0,0,0.45)',
          transform: `scale(${0.55 + 0.45 * pop(t, 11)}) rotate(-3deg)`,
        }}
      >
        С{second ? ' мёдом.' : ''}
      </div>
    </div>
  );
};

// ---------- the final question ----------

const Title: React.FC<{v: number}> = ({v}) => {
  if (v < TITLE) return null;
  const t = v - TITLE;
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 250, textAlign: 'center', opacity: clamp01(t / 0.1)}}>
      <div
        style={{
          display: 'inline-block',
          background: '#fff7e8',
          color: INK,
          borderRadius: 36,
          padding: '20px 36px 26px',
          fontFamily: ROUND,
          fontWeight: 800,
          fontSize: 82,
          lineHeight: 1.1,
          transform: `scale(${0.5 + 0.5 * pop(t, 9)}) rotate(-2deg)`,
          boxShadow: '0 12px 0 rgba(70,36,10,0.45), 0 22px 44px rgba(0,0,0,0.35)',
        }}
      >
        А ты бы кого
        <br />
        выбрал(а)?
      </div>
    </div>
  );
};

export const Overlay: React.FC<{v: number}> = ({v}) => (
  <AbsoluteFill>
    <Hook v={v} />
    <DateStamp v={v} />
    <Stream v={v} />
    <Podcast v={v} />
    <Subs v={v} />
    {GROUPS.map((g) => (
      <Caption key={g} v={v} g={g} />
    ))}
    <Answer v={v} />
    <Title v={v} />
  </AbsoluteFill>
);
