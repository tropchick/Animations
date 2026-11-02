import React from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate} from 'remotion';
import '@fontsource/oswald/500.css';
import '@fontsource/oswald/600.css';
import {ERUPT, FLARE, GROUPS, IMPACT, WORDS, clamp01, shotEnd, shotStart} from './cues';

export const COND = "'Oswald', 'Arial Narrow', sans-serif";
export const YELLOW = '#ffd23f';
const PLATE = 'rgba(16,12,20,0.84)';

const handle = delayRender('Loading Oswald');
Promise.all([document.fonts.load("600 60px 'Oswald'"), document.fonts.load("500 60px 'Oswald'")])
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));

const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// ---------- the countdown at the top ----------

const STEPS: [number, number][] = [
  [shotStart('fan'), 365],
  [shotStart('sun'), 340],
  [shotStart('moon'), 260],
  [shotStart('volcano'), 170],
  [shotStart('ice'), 90],
  [shotStart('asteroid'), 30],
  [shotStart('bunker'), 1],
];
const ROLL = 0.5;

const daysWord = (n: number) => {
  const a = n % 10;
  const b = n % 100;
  if (a === 1 && b !== 11) return 'ДЕНЬ';
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'ДНЯ';
  return 'ДНЕЙ';
};

const daysAt = (v: number) => {
  let n = STEPS[0][1];
  for (let i = 0; i < STEPS.length; i++) {
    const [t, d] = STEPS[i];
    if (v < t) break;
    const prev = i === 0 ? d : STEPS[i - 1][1];
    const k = clamp01((v - t) / ROLL);
    n = Math.round(prev + (d - prev) * (1 - Math.pow(1 - k, 3)));
  }
  return n;
};

const Countdown: React.FC<{v: number}> = ({v}) => {
  const o = fade(v, shotStart('fan') - 0.05, shotStart('impact'), 0.2, 0.2);
  if (o <= 0) return null;
  const n = daysAt(v);
  // a pop and a red tint while the number rolls down
  let pop = 0;
  for (const [t] of STEPS.slice(1)) {
    const x = v - t;
    if (x >= 0 && x < 0.8) pop = Math.max(pop, Math.exp(-x * 4));
  }
  const last = n === 1;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', opacity: o}}>
      <div
        style={{
          display: 'inline-block',
          background: PLATE,
          borderRadius: 20,
          padding: '8px 26px 12px',
          fontFamily: COND,
          fontWeight: 600,
          color: '#fff',
          transform: `scale(${1 + 0.12 * pop})`,
          boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
          border: last ? '3px solid #ff4d4d' : '3px solid rgba(255,255,255,0.12)',
        }}
      >
        <div style={{fontSize: 36, fontWeight: 500, letterSpacing: 2, color: '#d8cfe6', lineHeight: 1.2}}>ДО РЕЛИЗА GTA 6</div>
        <div style={{fontSize: 78, lineHeight: 1.05, color: pop > 0.3 || last ? '#ff5a5a' : YELLOW}}>
          {n} {daysWord(n)}
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
  const nextGroup = GROUPS[g + 1] ? WORDS.find((w) => GROUPS[g + 1].includes(w[3])) : undefined;
  const end = Math.min(words[words.length - 1][1] + 0.45, nextGroup ? nextGroup[0] - 0.08 : 1e9);
  const o = fade(v, start, end, 0.08, 0.12);
  if (o <= 0) return null;
  // the word being spoken (or the last one spoken) is yellow
  let cur = -1;
  words.forEach((w, i) => {
    if (v >= w[0] - 0.03) cur = i;
  });
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
          <span key={i} style={{color: i === cur ? YELLOW : '#ffffff', display: i <= cur ? 'inline' : 'none'}}>
            {w[2]}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

// ---------- flashes ----------

const flash = (v: number, at: number, decay: number) => (v >= at ? Math.exp(-(v - at) * decay) : 0);

export const Overlay: React.FC<{v: number}> = ({v}) => {
  const white = Math.max(flash(v, FLARE, 4.5), flash(v, IMPACT, 1.6));
  const orange = flash(v, ERUPT, 2.5) * 0.7;
  const wEnd = shotEnd('wave');
  const engulf = clamp01((v - (wEnd - 0.45)) / 0.4) * (v < wEnd ? 1 : 0);
  return (
    <AbsoluteFill>
      {white > 0.01 ? <AbsoluteFill style={{background: '#fff', opacity: Math.min(1, white)}} /> : null}
      {orange > 0.01 ? <AbsoluteFill style={{background: '#ff7a2a', opacity: orange, mixBlendMode: 'screen'}} /> : null}
      {engulf > 0 ? <AbsoluteFill style={{background: '#0d2f45', opacity: engulf}} /> : null}
      <Countdown v={v} />
      {GROUPS.map((_, g) => (
        <Caption key={g} v={v} g={g} />
      ))}
    </AbsoluteFill>
  );
};
