import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Grain} from '../slime/Overlay';
import {CHIME, PA, Shot, WHISPER, WORDS, lerp, ramp, shotAt, shotEnd, shotStart, smooth, wordEnd, wordStart} from './cues';

export const SANS = "'Inter', Helvetica, Arial, sans-serif";
export const MONO = "'IBM Plex Mono', monospace";
export const YELLOW = '#f2c94c';
const SHADOW = '0 3px 14px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9), 0 0 22px rgba(0,0,0,0.65)';
const CARD = 'rgba(12,14,18,0.78)';

const fade = (v: number, from: number, to: number, f = 0.2) =>
  interpolate(v, [from, from + f, to - f, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// ---------------------------------------------------------------- the clock and the battery

const hm = (min: number) => {
  const m = ((Math.floor(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
const T = (h: number, m: number) => h * 60 + m;

export const clockAt = (v: number, shot: Shot) => {
  switch (shot) {
    case 'enter':
      return T(15, 52);
    case 'turn':
      return T(15, 53);
    case 'signs':
    case 'rise':
      return lerp(T(16, 40), T(21, 58), smooth(ramp(v, shotStart('signs') + 0.4, shotEnd('rise') - 0.3)));
    case 'pa':
      return v < CHIME ? T(21, 58) : v < PA[1] ? T(21, 59) : T(22, 0);
    case 'lightsout':
      return T(22, 0);
    case 'staff':
      return T(22, 4);
    case 'daynight':
      return v < shotStart('daynight') + (wordStart(75) - 0.12 - shotStart('daynight')) ? T(14, 10) : T(22, 6);
    case 'run':
      return T(22, 7);
    case 'fort':
      return T(22, 9);
    case 'hide':
      return T(22, 12);
    case 'inside':
      return lerp(T(22, 15), T(27, 7), smooth(ramp(v, shotStart('inside') + 0.5, wordStart(113) + 0.2)));
    default:
      return T(27, 7);
  }
};
const batteryAt = (v: number, shot: Shot) =>
  shot === 'inside' ? Math.round(lerp(34, 21, smooth(ramp(v, shotStart('inside') + 0.5, wordStart(113) + 0.2)))) : shot === 'knock' ? 21 : 34;

const Battery: React.FC<{pct: number}> = ({pct}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
    <div style={{position: 'relative', width: 46, height: 24, border: '3px solid rgba(255,255,255,0.85)', borderRadius: 6, boxSizing: 'border-box'}}>
      <div style={{position: 'absolute', left: 2, top: 2, bottom: 2, width: `${Math.max(6, (pct / 100) * 36)}px`, background: pct < 25 ? '#ff5b4d' : '#e8eaec', borderRadius: 2}} />
      <div style={{position: 'absolute', right: -8, top: 5, width: 4, height: 9, background: 'rgba(255,255,255,0.85)', borderRadius: 1}} />
    </div>
    <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 34, color: pct < 25 ? '#ff7a6e' : '#e8eaec'}}>{pct}%</div>
  </div>
);

const Hud: React.FC<{v: number; shot: Shot}> = ({v, shot}) => {
  const label = ramp(v, 0.3, 0.8);
  const card = shot === 'phone' ? 0 : ramp(v, shotStart('enter') + 0.2, shotStart('enter') + 0.6);
  const night = !['enter', 'turn', 'signs', 'rise', 'pa'].includes(shot) && !(shot === 'daynight' && clockAt(v, shot) < T(20, 0));
  return (
    <>
      <div style={{position: 'absolute', left: 60, top: 150, opacity: label, display: 'flex', alignItems: 'center', gap: 16, fontFamily: MONO, fontWeight: 500, fontSize: 34, letterSpacing: '0.08em', color: '#fff', textShadow: SHADOW}}>
        <div style={{width: 18, height: 18, borderRadius: 9, background: '#ff3b30', opacity: Math.floor(v * 1.6) % 2 === 0 ? 1 : 0.3}} />
        <span style={{color: YELLOW}}>SCP-3008</span>
        <span>· LOG 01</span>
      </div>
      {card > 0 ? (
        <div
          style={{
            position: 'absolute',
            right: 56,
            top: 128,
            opacity: card,
            background: CARD,
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 22,
            padding: '18px 26px 18px 26px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 6,
          }}
        >
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 50, lineHeight: 1, color: '#fff', letterSpacing: '0.02em'}}>DAY 1</div>
          <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 44, lineHeight: 1.1, color: night ? '#9fd8ff' : YELLOW, fontVariantNumeric: 'tabular-nums'}}>{hm(clockAt(v, shot))}</div>
          <Battery pct={batteryAt(v, shot)} />
        </div>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------- captions: the voice, a few words at a time

const GROUPS: [number, number][] = [
  [0, 4], [5, 9], [10, 11], [12, 13], [14, 19], [20, 20], [21, 23], [24, 28], [29, 34], [35, 39], [40, 43], [44, 51], [52, 56], [57, 59],
  [60, 65], [66, 66], [67, 68], [69, 74], [75, 77], [78, 79], [80, 81], [82, 86], [87, 91], [92, 93], [94, 96], [97, 98], [99, 100],
  [101, 104], [105, 110], [111, 115], [116, 120], [121, 125],
];
const SPOKEN: Record<number, string> = {20: '$19.99.'};

const Captions: React.FC<{v: number}> = ({v}) => {
  const i = GROUPS.findIndex(([a], k) => v >= wordStart(a) - 0.05 && (k + 1 >= GROUPS.length || v < wordStart(GROUPS[k + 1][0]) - 0.05));
  if (i < 0) return null;
  const [a, b] = GROUPS[i];
  const next = i + 1 < GROUPS.length ? wordStart(GROUPS[i + 1][0]) - 0.05 : Infinity;
  const end = Math.min(wordEnd(b) + 0.7, next - 0.08);
  if (v > end) return null;
  const o = fade(v, wordStart(a) - 0.05, end, 0.08);
  const words: {w: string; on: boolean}[] = [];
  for (let k = a; k <= b; k++) {
    const w = SPOKEN[k] ?? WORDS[k].w;
    if (w.startsWith('.') && words.length) words[words.length - 1].w += w;
    else words.push({w, on: v >= WORDS[k].s - 0.02});
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        right: 80,
        top: 1010,
        textAlign: 'center',
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: 60,
        lineHeight: 1.16,
        color: '#fff',
        textShadow: SHADOW,
        opacity: o,
        translate: `0px ${interpolate(o, [0, 1], [10, 0])}px`,
      }}
    >
      {words.map((x, k) => (
        <span key={k} style={{color: x.on ? '#fff' : 'rgba(255,255,255,0.45)'}}>
          {x.w}
          {k < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </div>
  );
};

// the store's PA, in its own style
const PaCaption: React.FC<{v: number}> = ({v}) => {
  const split = PA[0] + 1.8;
  const lines: [number, number, string][] = [
    [PA[0] - 0.05, split - 0.05, 'The store is now closing.'],
    [split + 0.05, PA[1] + 0.35, 'Please make your way to the exit.'],
  ];
  const tag = fade(v, PA[0] - 0.3, PA[1] + 0.35, 0.2);
  if (tag <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 560, textAlign: 'center', opacity: tag}}>
      <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 34, letterSpacing: '0.24em', color: YELLOW, textShadow: SHADOW, marginBottom: 14}}>STORE SPEAKER</div>
      {lines.map(([a, b, t]) => {
        const o = fade(v, a, b, 0.1);
        return o > 0 ? (
          <div key={t} style={{fontFamily: SANS, fontStyle: 'italic', fontWeight: 600, fontSize: 56, lineHeight: 1.15, color: '#e9f0ff', textShadow: SHADOW, opacity: o}}>
            “{t}”
          </div>
        ) : null;
      })}
    </div>
  );
};

// the whisper from outside the wardrobe
const Whisper: React.FC<{v: number}> = ({v}) => {
  const o = fade(v, WHISPER - 0.05, WHISPER + 1.15, 0.15);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 1010, textAlign: 'center', opacity: o, fontFamily: SANS, fontStyle: 'italic', fontWeight: 600, fontSize: 64, color: '#bfe8cf', textShadow: SHADOW, letterSpacing: '0.04em'}}>
      “Ben?”
    </div>
  );
};

// ---------------------------------------------------------------- cards in the reference style

const InfoCard: React.FC<{opacity: number; kicker: string; title: React.ReactNode; line?: string; top: number}> = ({opacity, kicker, title, line, top}) => (
  <div style={{position: 'absolute', left: 70, right: 70, top, opacity, translate: `0px ${interpolate(opacity, [0, 1], [24, 0])}px`}}>
    <div style={{background: CARD, border: '1px solid rgba(255,255,255,0.14)', borderRadius: 30, padding: '30px 40px 34px 40px'}}>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: '0.3em', color: YELLOW}}>{kicker}</div>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 76, lineHeight: 1.02, color: '#fff', marginTop: 10, letterSpacing: '-0.01em'}}>{title}</div>
      {line ? <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 38, color: 'rgba(255,255,255,0.86)', marginTop: 14}}>{line}</div> : null}
    </div>
  </div>
);

const Check: React.FC<{label: string; on: number}> = ({label, on}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 20px',
      borderRadius: 16,
      background: on > 0.5 ? 'rgba(242,201,76,0.18)' : 'rgba(255,255,255,0.06)',
      border: `2px solid ${on > 0.5 ? YELLOW : 'rgba(255,255,255,0.18)'}`,
      opacity: 0.35 + 0.65 * on,
      scale: `${1 + 0.08 * Math.sin(Math.PI * Math.min(1, on))}`,
    }}
  >
    <svg width="30" height="30" viewBox="0 0 30 30">
      <path d="M5 16 L12 23 L25 8" fill="none" stroke={on > 0.5 ? YELLOW : 'rgba(255,255,255,0.4)'} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="34" strokeDashoffset={34 * (1 - on)} />
    </svg>
    <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: '#fff', letterSpacing: '0.04em', whiteSpace: 'nowrap'}}>{label}</span>
  </div>
);

const RuleCard: React.FC<{v: number}> = ({v}) => {
  const from = wordStart(80) - 0.1;
  const to = shotEnd('hide') - 0.1;
  const o = fade(v, from, to, 0.3);
  if (o <= 0) return null;
  const checks: [string, number][] = [
    ['WALLS', wordStart(93)],
    ['NO LIGHT', wordStart(98)],
    ['NO SOUND', wordStart(100)],
  ];
  const showChecks = ramp(v, wordStart(92) - 0.2, wordStart(92) + 0.2);
  return (
    <div style={{position: 'absolute', left: 64, right: 64, top: 1240, opacity: o, translate: `0px ${interpolate(o, [0, 1], [30, 0])}px`}}>
      <div style={{background: CARD, border: '1px solid rgba(255,255,255,0.14)', borderRadius: 30, padding: '28px 38px 30px 38px'}}>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: '0.34em', color: YELLOW}}>RULE 1</div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 72, lineHeight: 1.02, color: '#fff', marginTop: 8}}>WHEN THE LIGHTS GO OUT, HIDE</div>
        <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 38, color: 'rgba(255,255,255,0.86)', marginTop: 12, opacity: ramp(v, wordStart(87) - 0.1, wordStart(87) + 0.2)}}>Get off the main aisle.</div>
        {showChecks > 0 ? (
          <div style={{display: 'flex', gap: 14, marginTop: 20, opacity: showChecks}}>
            {checks.map(([l, t]) => (
              <Check key={l} label={l} on={smooth(ramp(v, t, t + 0.3))} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const EndCard: React.FC<{v: number}> = ({v}) => {
  const t0 = shotStart('end');
  return (
    <AbsoluteFill style={{background: '#000', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 26}}>
      <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 36, letterSpacing: '0.3em', color: YELLOW, opacity: ramp(v, t0 + 0.5, t0 + 1.0), paddingLeft: '0.3em'}}>SCP-3008</div>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 150, lineHeight: 1, color: '#fff', opacity: ramp(v, t0 + 0.7, t0 + 1.3)}}>PART 2</div>
      <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 46, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.8)', opacity: ramp(v, t0 + 1.2, t0 + 1.8)}}>LOG 02 →</div>
    </AbsoluteFill>
  );
};

export const Overlay: React.FC<{v: number; frame: number}> = ({v, frame}) => {
  const s = shotAt(v);
  if (s.name === 'end') return <EndCard v={v} />;
  const size = fade(v, wordStart(40) - 0.25, shotEnd('rise') + 0.0, 0.25);
  const dark = !['enter', 'turn', 'signs', 'rise', 'pa'].includes(s.name);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) ${dark ? 38 : 50}%, rgba(0,0,0,${dark ? 0.7 : 0.4}) 100%)`}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.3) 100%)'}} />
      <Grain frame={frame} />
      <Hud v={v} shot={s.name} />
      {size > 0 ? <InfoCard opacity={size} kicker="SIZE" title={<>NO END<br />FOUND</>} line="Walked: 6 hours" top={430} /> : null}
      <PaCaption v={v} />
      <Captions v={v} />
      <Whisper v={v} />
      <RuleCard v={v} />
      <AbsoluteFill style={{background: '#000', opacity: interpolate(v, [0, 0.35], [1, 0], {extrapolateRight: 'clamp'})}} />
    </AbsoluteFill>
  );
};
