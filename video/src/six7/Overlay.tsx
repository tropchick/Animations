import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ROUND} from '../bear/Overlay';
import {COND} from '../gta/tex';
import {BANS, DENY, FINAL, GROUPS, PHRASES, STAMP, VOID, WORDS, clamp01, shotAt, shotEnd} from './cues';

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

// ---------- «SIX SEVEN!» burst and the question ----------

const SixSeven: React.FC<{t: number; o: number; top?: number}> = ({t, o, top = 260}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', opacity: o}}>
    <div style={{display: 'inline-block', background: YELLOW, color: INK, borderRadius: 40, padding: '10px 46px 18px', fontFamily: COND, fontWeight: 600, fontSize: 150, letterSpacing: 6, lineHeight: 1.05, boxShadow: STICKER_SHADOW, transform: `scale(${0.4 + 0.6 * pop(t, 10)}) rotate(${-4 + 2 * Math.sin(t * 9)}deg)`}}>
      SIX SEVEN!
    </div>
  </div>
);

export const HookSticker: React.FC<{o?: number; s?: number; top?: number}> = ({o = 1, s = 1, top = 230}) => (
  <div style={{position: 'absolute', left: 70, right: 70, top, textAlign: 'center', opacity: o, transform: `scale(${s})`}}>
    <div style={{display: 'inline-block', background: CREAM, color: INK, borderRadius: 34, padding: '18px 34px 22px', fontFamily: ROUND, fontWeight: 800, fontSize: 84, lineHeight: 1.12, boxShadow: STICKER_SHADOW, transform: 'rotate(-1.5deg)'}}>
      Что если число <span style={{color: RED}}>67</span> запретят?
    </div>
  </div>
);

const HOOK_A = PHRASES[1][0] - 0.05;
const HOOK_END = PHRASES[2][0] - 0.1;
const Hook: React.FC<{v: number}> = ({v}) => {
  if (v > HOOK_END) return null;
  if (v < HOOK_A) return <SixSeven t={v + 0.05} o={1} />;
  return <HookSticker o={fade(v, HOOK_A, HOOK_END, 0.06, 0.2)} s={0.9 + 0.1 * pop(v - HOOK_A + 0.1, 7)} />;
};

// ---------- the number line on top: 64 65 66 [67] 68 69 ----------

const NUMS = [64, 65, 66, 67, 68, 69];
const NumberLine: React.FC<{v: number}> = ({v}) => {
  if (v < HOOK_END) return null;
  const s = shotAt(v).name;
  if (s === 'finale' && v > FINAL + 0.2) return null;
  const crack = v >= STAMP ? clamp01((v - STAMP) / 0.12) : 0;
  const fall = clamp01((v - STAMP - 0.2) / 0.7);
  const back = clamp01((v - VOID - 0.4) / 0.25);
  const o = clamp01((v - HOOK_END) / 0.2);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 150, display: 'flex', justifyContent: 'center', gap: 10, opacity: o}}>
      {NUMS.map((n) => {
        const is67 = n === 67;
        const base: React.CSSProperties = {width: 136, height: 104, borderRadius: 22, fontFamily: COND, fontWeight: 600, fontSize: 68, lineHeight: '100px', textAlign: 'center', boxShadow: '0 6px 0 rgba(40,20,60,0.35)', background: CREAM, color: INK};
        if (!is67) return <div key={n} style={base}>{n}</div>;
        const shake = crack > 0 && fall <= 0 ? Math.sin(v * 80) * 6 : 0;
        return (
          <div key={n} style={{position: 'relative', width: 136, height: 104}}>
            {/* the hole */}
            <div style={{position: 'absolute', inset: 0, borderRadius: 22, border: '5px dashed rgba(255,255,255,0.85)', background: 'rgba(24,18,40,0.55)'}} />
            {back > 0 ? (
              <div style={{...base, position: 'absolute', inset: 0, background: GREEN, color: '#fff', transform: `scale(${0.3 + 0.7 * pop(v - VOID - 0.4, 11)})`}}>67</div>
            ) : fall < 1 ? (
              <div style={{...base, position: 'absolute', inset: 0, background: crack > 0 ? RED : CREAM, color: crack > 0 ? '#fff' : INK, transform: `translate(${shake}px, ${fall * fall * 900}px) rotate(${fall * 70}deg)`, opacity: 1 - fall * 0.6}}>
                67
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

// ---------- «ЗАПРЕЩЕНО:» chips under the line ----------

const Bans: React.FC<{v: number}> = ({v}) => {
  const first = BANS[0][1];
  if (v < first || v > VOID + 0.9) return null;
  if (shotAt(v).name === 'finale') return null;
  const gone = clamp01((v - VOID - 0.4) / 0.4);
  const shown = BANS.filter(([, t]) => v >= t);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 280, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, opacity: 1 - gone, transform: `translateY(${-gone * 80}px)`}}>
      {shown.map(([text, t], i) => {
        const age = v - t;
        const fresh = age < 0.6;
        return (
          <div key={i} style={{background: fresh ? RED : 'rgba(24,18,40,0.82)', color: '#fff', borderRadius: 16, padding: '4px 16px 7px', fontFamily: COND, fontWeight: 600, fontSize: 40, letterSpacing: 1, boxShadow: '0 6px 0 rgba(40,20,60,0.35)', transform: `scale(${0.5 + 0.5 * pop(age, 11)}) rotate(${i % 2 ? 1.5 : -1.5}deg)`, textDecoration: 'line-through', textDecorationThickness: 4, textDecorationColor: fresh ? '#ffffff' : RED}}>
            {text}
          </div>
        );
      })}
    </div>
  );
};

// ---------- the border stamp ----------

const Deny: React.FC<{v: number}> = ({v}) => {
  const end = shotEnd('ruler');
  if (v < DENY || v > end) return null;
  const t = v - DENY;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 1080, textAlign: 'center', opacity: fade(v, DENY, end, 0.03, 0.1)}}>
      <div style={{display: 'inline-block', border: `12px solid ${RED}`, color: RED, borderRadius: 30, padding: '6px 36px 12px', fontFamily: COND, fontWeight: 600, fontSize: 104, letterSpacing: 4, background: 'rgba(255,247,232,0.86)', transform: `scale(${1.6 - 0.6 * Math.min(1, t / 0.12)}) rotate(-8deg)`}}>
        ВЪЕЗД ЗАПРЕЩЁН
      </div>
    </div>
  );
};

// ---------- «ЗАКОН ОТМЕНЁН» ----------

const Void: React.FC<{v: number}> = ({v}) => {
  const a = VOID + 0.35;
  const b = shotEnd('void');
  if (v < a || v > b) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', opacity: fade(v, a, b, 0.05, 0.12)}}>
      <div style={{display: 'inline-block', background: RED, color: '#fff', borderRadius: 34, padding: '12px 40px 18px', fontFamily: ROUND, fontWeight: 800, fontSize: 84, boxShadow: STICKER_SHADOW, transform: `scale(${0.5 + 0.5 * pop(v - a, 9)}) rotate(-2deg)`}}>
        ЗАКОН ОТМЕНЁН
      </div>
    </div>
  );
};

// ---------- the final «SIX SEVEN!» ----------

const Finale: React.FC<{v: number}> = ({v}) => {
  if (v < FINAL) return null;
  return <SixSeven t={v - FINAL} o={clamp01((v - FINAL) / 0.06)} top={230} />;
};

// ---------- karaoke captions ----------

const Caption: React.FC<{v: number; g: number}> = ({v, g}) => {
  const pieces = GROUPS[g];
  // «Six seven!» and the hook question are big stickers
  if (pieces.includes(0) || pieces.includes(1) || pieces.includes(21)) return null;
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

export const Overlay: React.FC<{v: number}> = ({v}) => (
  <AbsoluteFill>
    <Hook v={v} />
    <NumberLine v={v} />
    <Bans v={v} />
    <Deny v={v} />
    <Void v={v} />
    <Finale v={v} />
    {GROUPS.map((_, g) => (
      <Caption key={g} v={v} g={g} />
    ))}
  </AbsoluteFill>
);
