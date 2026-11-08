import React from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate} from 'remotion';
import '@fontsource/rubik/600.css';
import '@fontsource/rubik/700.css';
import '@fontsource/rubik/800.css';
import '@fontsource/oswald/600.css';
import '@fontsource/oswald/700.css';
import '@fontsource/ibm-plex-mono/600.css';
import {ASK, GROUPS, Shot, TITLE, WORDS, clamp01, shotAt, shotEnd, shotStart} from './cues';

// «Тихий этаж»: time plaque, rule captions, karaoke subs, the note, the radio, the title and the last question.
// Everything is centred, away from the left and right edges (TikTok crops them); no text under 34 px.

export const ROUND = "'Rubik', 'Arial', sans-serif";
export const COND = "'Oswald', 'Arial Narrow', sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const PLATE = 'rgba(6,10,22,0.82)';
const PALE = '#e8eefc';
const AMBER = '#ffb24a';
const RED = '#ff5a4a';

const handle = delayRender('Loading fonts');
Promise.all([
  document.fonts.load("700 60px 'Rubik'"),
  document.fonts.load("800 60px 'Rubik'"),
  document.fonts.load("600 60px 'Oswald'"),
  document.fonts.load("700 60px 'Oswald'"),
  document.fonts.load("600 40px 'IBM Plex Mono'"),
])
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));

const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const pop = (t: number, k = 9) => (t <= 0 ? 0 : 1 - Math.exp(-t * k) * Math.cos(t * k * 1.6));

// ---------- the clock plaque ----------

const TIMES: Partial<Record<Shot, string>> = {
  door: '21:40',
  pull: '21:40',
  turn: '21:41',
  rNoise: 'НОЧЬ 1',
  rTire: 'НОЧЬ 1',
  rHabit: 'НОЧЬ 1',
  rCount: 'НОЧЬ 1',
  rScream: 'НОЧЬ 1',
  pharmacy: '22:15',
  detour: '22:20',
  note: '22:40',
  knock: '02:00',
  slit: '02:01',
  whisper: '02:02',
  crowd: '02:03',
  radio: '03:00',
  wall: '03:05',
  dawn: '05:50',
  change: '05:51',
  road: '06:00',
};
const PREP: Shot[] = ['pWater', 'pDoor', 'pWin', 'pLadder', 'pThread', 'pExit', 'pFood'];
const PREP_WORD: Record<string, string> = {pWater: 'ВОДА', pDoor: 'ДВЕРЬ', pWin: 'ОКНА', pLadder: 'ЛЕСТНИЦА', pThread: 'НИТКА', pExit: 'ВЫХОД', pFood: 'ЕДА'};

// 23:00 → 01:50 running through the house montage
const prepClock = (v: number) => {
  const a = shotStart('pWater');
  const b = shotEnd('pFood');
  const k = clamp01((v - a) / (b - a));
  const mins = 23 * 60 + Math.round(k * 170);
  const m = mins % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

const Clock: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v);
  if (s.name === 'palm' || s.name === 'palm2') return null;
  const prep = PREP.includes(s.name);
  const text = prep ? prepClock(v) : TIMES[s.name];
  if (!text) return null;
  // since when has this text been up (so the pop runs once per change)
  let since = s.from;
  if (!prep)
    for (let t = s.from - 0.02; t > 0; t -= 0.1) {
      const p = shotAt(t);
      if (TIMES[p.name] !== text) break;
      since = p.from;
    }
  else since = shotStart('pWater');
  const t = v - since;
  const night = text.startsWith('НОЧЬ');
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 165, textAlign: 'center', opacity: clamp01(t / 0.12)}}>
      <div
        style={{
          display: 'inline-block',
          background: PLATE,
          color: night ? PALE : AMBER,
          borderRadius: 14,
          padding: '6px 26px 8px',
          fontFamily: MONO,
          fontWeight: 600,
          fontSize: 52,
          letterSpacing: 2,
          border: '2px solid rgba(255,178,74,0.35)',
          transform: `scale(${0.75 + 0.25 * pop(t, 10)})`,
          boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---------- the title ----------

const Title: React.FC<{v: number}> = ({v}) => {
  const a = TITLE;
  const b = TITLE + 2.6;
  if (v < a || v > b) return null;
  const t = v - a;
  const o = fade(v, a, b, 0.35, 0.5);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 560, textAlign: 'center', opacity: o}}>
      <div
        style={{
          fontFamily: COND,
          fontWeight: 700,
          fontSize: 150,
          lineHeight: 1,
          letterSpacing: 14 - 6 * clamp01(t / 2.6),
          color: PALE,
          textShadow: '0 0 40px rgba(120,150,255,0.45), 0 10px 30px rgba(0,0,0,0.8)',
        }}
      >
        ТИХИЙ ЭТАЖ
      </div>
    </div>
  );
};

// ---------- big captions: the rules (night 1) and the house montage ----------

const RULES: [Shot, string][] = [
  ['rNoise', 'ИДУТ НА ШУМ И СВЕТ'],
  ['rTire', 'НЕ УСТАЮТ'],
  ['rHabit', 'ПОМНЯТ ПРИВЫЧКИ'],
  ['rCount', '1 → 10 → 100'],
  ['rScream', 'КРИКУНЫ'],
];

const BigWord: React.FC<{v: number; a: number; b: number; text: string; n?: string; color?: string; size?: number}> = ({v, a, b, text, n, color = PALE, size = 96}) => {
  if (v < a || v > b) return null;
  const t = v - a;
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 300, textAlign: 'center', opacity: fade(v, a, b, 0.06, 0.12)}}>
      {n ? <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 40, color: AMBER, marginBottom: 6, textShadow: '0 4px 14px rgba(0,0,0,0.9)'}}>{n}</div> : null}
      <div
        style={{
          display: 'inline-block',
          fontFamily: COND,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.05,
          color,
          WebkitTextStroke: '8px #05070e',
          paintOrder: 'stroke fill',
          textShadow: '0 10px 30px rgba(0,0,0,0.85)',
          transform: `scale(${0.6 + 0.4 * pop(t, 11)})`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Rules: React.FC<{v: number}> = ({v}) => (
  <>
    {RULES.map(([s, text], i) => (
      <BigWord key={s} v={v} a={shotStart(s) + 0.1} b={shotEnd(s) - 0.05} text={text} n={`ПРАВИЛО ${i + 1}`} color={s === 'rScream' ? RED : PALE} />
    ))}
    {PREP.map((s) => (
      <BigWord key={s} v={v} a={shotStart(s) + 0.05} b={shotEnd(s) - 0.03} text={PREP_WORD[s]} size={110} />
    ))}
  </>
);

// ---------- the note in the box ----------

const NoteCard: React.FC<{v: number}> = ({v}) => {
  const a = shotStart('note') + 2.0;
  const b = shotEnd('note') - 0.1;
  if (v < a || v > b) return null;
  const t = v - a;
  return (
    <div style={{position: 'absolute', left: 140, right: 140, top: 360, textAlign: 'center', opacity: fade(v, a, b, 0.15, 0.2)}}>
      <div
        style={{
          display: 'inline-block',
          background: '#f4efe2',
          color: '#1c2030',
          padding: '26px 40px 30px',
          fontFamily: ROUND,
          fontWeight: 700,
          fontSize: 56,
          lineHeight: 1.25,
          transform: `rotate(-3deg) translateY(${30 * (1 - pop(t, 8))}px)`,
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
        }}
      >
        Включай в 3:00.
        <br />
        Частота <span style={{color: '#c8281e'}}>91,4</span>
      </div>
    </div>
  );
};

// ---------- «ПОВТОР 3» ----------

const Repeat: React.FC<{v: number}> = ({v}) => {
  const a = shotStart('dawn') + 3.4;
  const b = shotEnd('change') - 0.1;
  if (v < a || v > b) return null;
  const t = v - a;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 270, textAlign: 'center', opacity: fade(v, a, b, 0.1, 0.2)}}>
      <span style={{display: 'inline-block', background: '#c8281e', color: '#fff', fontFamily: MONO, fontWeight: 600, fontSize: 46, borderRadius: 10, padding: '4px 22px 6px', transform: `scale(${0.6 + 0.4 * pop(t, 10)})`}}>ПОВТОР 3</span>
    </div>
  );
};

// ---------- karaoke subtitles ----------

const TAGS: Record<string, [string, string]> = {
  man: ['МУЖЧИНА', '#8a96b0'],
  radio: ['РАЦИЯ 91,4', '#c8781e'],
};

const Caption: React.FC<{v: number; g: number}> = ({v, g}) => {
  const words = WORDS.filter((w) => w[3] === g);
  if (!words.length) return null;
  const who = words[0][4];
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
  const radio = who === 'radio';
  const whisper = who === 'man';
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top: 1395, textAlign: 'center', opacity: o}}>
      {tag ? (
        <div style={{marginBottom: -4}}>
          <span style={{display: 'inline-block', background: tag[1], color: '#fff', fontFamily: MONO, fontWeight: 600, fontSize: 34, borderRadius: 10, padding: '3px 16px 6px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)'}}>{tag[0]}</span>
        </div>
      ) : null}
      <div
        style={{
          display: 'inline-block',
          background: PLATE,
          borderRadius: 22,
          padding: '10px 28px 14px',
          fontFamily: radio ? MONO : ROUND,
          fontWeight: radio ? 600 : 700,
          fontStyle: whisper ? 'italic' : 'normal',
          fontSize: radio ? 50 : 56,
          lineHeight: 1.22,
          color: '#fff',
          border: radio ? '2px solid rgba(255,178,74,0.4)' : 'none',
          boxShadow: '0 8px 26px rgba(0,0,0,0.45)',
        }}
      >
        {words.map((w, i) => {
          const shown = i <= cur;
          const closing = radio && /^закрыва/i.test(w[2]);
          return (
            <span key={i} style={{color: i === cur ? (radio ? AMBER : '#ffd890') : '#ffffff', display: shown ? 'inline' : 'none'}}>
              {closing ? (
                <>
                  <span style={{color: '#8a8f9c', textDecoration: 'line-through', textDecorationColor: RED, textDecorationThickness: 6}}>открыты</span>{' '}
                  <span style={{color: RED}}>{w[2]}</span>
                </>
              ) : (
                w[2]
              )}
              {i < words.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ---------- the last question ----------

const Ask: React.FC<{v: number}> = ({v}) => {
  if (v < ASK) return null;
  const t = v - ASK;
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 520, textAlign: 'center', opacity: clamp01(t / 0.4)}}>
      <div
        style={{
          fontFamily: COND,
          fontWeight: 700,
          fontSize: 124,
          lineHeight: 1.05,
          color: '#fff6e8',
          WebkitTextStroke: '8px #0a0c16',
          paintOrder: 'stroke fill',
          textShadow: '0 12px 40px rgba(0,0,0,0.7)',
          transform: `scale(${0.85 + 0.15 * pop(t, 6)})`,
        }}
      >
        А ты бы пошёл?
      </div>
    </div>
  );
};

export const Overlay: React.FC<{v: number}> = ({v}) => (
  <AbsoluteFill>
    <Clock v={v} />
    <Title v={v} />
    <Rules v={v} />
    <NoteCard v={v} />
    <Repeat v={v} />
    {GROUPS.map((g) => (
      <Caption key={g} v={v} g={g} />
    ))}
    <Ask v={v} />
  </AbsoluteFill>
);
