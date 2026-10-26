import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Grain} from '../slime/Overlay';
import {
  ACCEPT, APP_DONE, APP_NEXT, CALL, CODE, DOUBLE, FLOOR_JUMP, LIFT_OPEN, Shot, WORDS, lerp, ramp, shotAt, shotEnd, shotStart, smooth, wordEnd,
  wordStart,
} from './cues';
import {courierN, wellI} from './action';
import {STEPS_PER_TURN, WELL_BASE_SCENE} from './places';

export const SANS = "'Inter', Helvetica, Arial, sans-serif";
export const MONO = "'IBM Plex Mono', monospace";
export const YELLOW = '#f2c94c';
export const RED = '#ff3b30';
export const TEAL = '#1fb3a5';
const SHADOW = '0 3px 14px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9), 0 0 22px rgba(0,0,0,0.65)';
const CARD = 'rgba(12,14,18,0.8)';

const fade = (v: number, from: number, to: number, f = 0.2) =>
  interpolate(v, [from, from + f, to - f, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// ---------------------------------------------------------------- the title, same text as the cover

export const TitleText: React.FC<{opacity?: number; scale?: number}> = ({opacity = 1, scale = 1}) => (
  <div style={{position: 'absolute', left: 60, right: 60, top: 300, opacity, scale: `${scale}`, textAlign: 'center'}}>
    <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 116, lineHeight: 1.0, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,0.75)', letterSpacing: '-0.01em'}}>
      ЧТО ДЕЛАТЬ,
      <br />
      ЕСЛИ ТЫ
      <br />
      УСТРОИЛСЯ
      <br />
      КУРЬЕРОМ
      <br />В <span style={{color: RED}}>МУРИНО</span>?
    </div>
  </div>
);

// ---------------------------------------------------------------- the delivery app

const Pin: React.FC = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" style={{flex: 'none'}}>
    <path d="M12 2c-3.9 0-7 3.1-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill={TEAL} />
  </svg>
);
const Stars: React.FC<{n: number; size?: number}> = ({n, size = 56}) => (
  <div style={{display: 'flex', gap: 10, justifyContent: 'center'}}>
    {[0, 1, 2, 3, 4].map((i) => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24" style={{opacity: i < n ? 1 : 0.2, scale: `${i < n ? 1 : 0.8}`}}>
        <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill={YELLOW} />
      </svg>
    ))}
  </div>
);
const Row: React.FC<{label: string; value: React.ReactNode; strong?: boolean}> = ({label, value, strong}) => (
  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 20, padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
    <span style={{fontFamily: SANS, fontWeight: 500, fontSize: 36, color: 'rgba(255,255,255,0.6)'}}>{label}</span>
    <span style={{fontFamily: SANS, fontWeight: strong ? 900 : 700, fontSize: strong ? 46 : 40, color: strong ? YELLOW : '#fff', textAlign: 'right'}}>{value}</span>
  </div>
);
const AppHeader: React.FC<{sub: string}> = ({sub}) => (
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
      <div style={{width: 54, height: 54, borderRadius: 16, background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 34, color: '#06302c'}}>Б</div>
      <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#fff'}}>БыстроВезу</span>
    </div>
    <span style={{fontFamily: MONO, fontWeight: 500, fontSize: 34, color: TEAL}}>{sub}</span>
  </div>
);

const OrderCard: React.FC<{v: number}> = ({v}) => {
  const from = shotStart('order') + 0.3;
  if (v < from || v > ACCEPT + 0.75) return null;
  const inK = smooth(ramp(v, from, from + 0.45));
  const press = v >= ACCEPT ? Math.exp(-(v - ACCEPT) * 10) : 0;
  const pressed = v >= ACCEPT;
  const out = smooth(ramp(v, ACCEPT + 0.35, ACCEPT + 0.75));
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        top: 420,
        opacity: inK * (1 - out),
        translate: `${out * 260}px ${(1 - inK) * 80 - out * 300}px`,
        scale: `${1 - out * 0.55}`,
        background: 'rgba(14,18,22,0.92)',
        border: `2px solid ${TEAL}`,
        borderRadius: 40,
        padding: '34px 42px 40px 42px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}
    >
      <AppHeader sub="НОВЫЙ ЗАКАЗ" />
      <div style={{display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0 16px 0'}}>
        <Pin />
        <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 48, color: '#fff', lineHeight: 1.1}}>Мурино, корпус 14</span>
      </div>
      <Row label="Секция" value="Е4" />
      <Row label="Этаж" value="412" />
      <Row label="Заказ" value="Шаурма + чесночный соус" />
      <Row label="Чаевые" value="5 000 ₽" strong />
      <Row label="Курьер" value="Ч." />
      <div
        style={{
          marginTop: 26,
          borderRadius: 26,
          padding: '26px 0',
          textAlign: 'center',
          background: pressed ? '#7ff0e3' : TEAL,
          scale: `${1 - 0.06 * press}`,
          fontFamily: SANS,
          fontWeight: 900,
          fontSize: 54,
          letterSpacing: '0.08em',
          color: '#06302c',
          boxShadow: pressed ? `0 0 ${40 * press + 10}px ${TEAL}` : 'none',
        }}
      >
        ПРИНЯТЬ
      </div>
    </div>
  );
};

// the order chip in the corner: floor 412 becomes 430
const OrderChip: React.FC<{v: number; shot: Shot}> = ({v, shot}) => {
  const on = ramp(v, ACCEPT + 0.6, ACCEPT + 0.9) * (1 - ramp(v, shotEnd('grow') - 0.2, shotEnd('grow')));
  if (on <= 0 || shot === 'title' || shot === 'app' || shot === 'end') return null;
  const jumped = v >= FLOOR_JUMP;
  const flash = jumped ? Math.exp(-(v - FLOOR_JUMP) * 3) : 0;
  return (
    <div
      style={{
        position: 'absolute',
        right: 56,
        top: 128,
        opacity: on,
        background: CARD,
        border: `2px solid ${flash > 0.05 ? RED : 'rgba(31,179,165,0.7)'}`,
        borderRadius: 22,
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        scale: `${1 + 0.12 * flash}`,
      }}
    >
      <span style={{fontFamily: MONO, fontWeight: 500, fontSize: 34, color: TEAL}}>ЗАКАЗ</span>
      <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#fff'}}>этаж</span>
      <span style={{position: 'relative', fontFamily: SANS, fontWeight: 900, fontSize: 44, color: jumped ? 'rgba(255,255,255,0.45)' : '#fff'}}>
        412
        {jumped ? <span style={{position: 'absolute', left: -4, right: -4, top: '52%', height: 5, background: RED, scale: `${smooth(ramp(v, FLOOR_JUMP, FLOOR_JUMP + 0.2))} 1`, transformOrigin: 'left'}} /> : null}
      </span>
      {jumped ? <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 44, color: RED, opacity: ramp(v, FLOOR_JUMP + 0.1, FLOOR_JUMP + 0.3)}}>430</span> : null}
    </div>
  );
};

// ---------------------------------------------------------------- the floor counter

const floorAt = (v: number, shot: Shot): number | null => {
  switch (shot) {
    case 'lift':
      return Math.round(lerp(64, 100, smooth(ramp(v, shotStart('lift'), LIFT_OPEN - 0.4))));
    case 'well':
      return WELL_BASE_SCENE.well + Math.floor((wellI(v) + 0.5) / STEPS_PER_TURN);
    case 'long':
      return 248;
    case 'neighbor':
      return WELL_BASE_SCENE.neighbor + Math.floor((courierN(v) + 0.5) / STEPS_PER_TURN);
    case 'doors':
    case 'twins':
    case 'grow':
      return 430;
    default:
      return null;
  }
};

const FloorHud: React.FC<{v: number; shot: Shot}> = ({v, shot}) => {
  const f = floorAt(v, shot);
  if (f === null) return null;
  const prev = floorAt(v - 0.25, shotAt(Math.max(0, v - 0.25)).name);
  const tick = prev !== null && prev !== f && shot !== 'lift' ? 1 : 0;
  return (
    <div style={{position: 'absolute', left: 56, top: 128, background: CARD, border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, padding: '12px 24px', display: 'flex', alignItems: 'baseline', gap: 14, scale: `${1 + 0.1 * tick}`}}>
      <span style={{fontFamily: MONO, fontWeight: 500, fontSize: 34, color: 'rgba(255,255,255,0.7)'}}>ЭТАЖ</span>
      <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 56, color: tick ? YELLOW : '#fff', fontVariantNumeric: 'tabular-nums'}}>{f}</span>
    </div>
  );
};

// ---------------------------------------------------------------- rule cards and Fog cards

const RULES: {from: number; to: number; n: string; text: string}[] = [
  {from: wordStart(22) - 0.1, to: shotEnd('lift') - 0.3, n: 'ПРАВИЛО 1', text: 'НЕ СЧИТАЙ ЭТАЖИ'},
  {from: wordStart(36) - 0.1, to: shotEnd('well') - 0.2, n: 'ПРАВИЛО 2', text: 'ТУМАН СНИЗУ — ИДИ ВВЕРХ'},
  {from: wordStart(54) - 0.1, to: wordStart(64) - 0.3, n: 'ПРАВИЛО 3', text: 'В ТУМАНЕ ЖИВЁТ ФОГ'},
  {from: wordStart(83) - 0.1, to: wordStart(99) - 0.15, n: 'ПРАВИЛО 4', text: 'ГОЛОС ИЗ ТУМАНА — НЕ ЧЕЛОВЕК'},
  {from: wordStart(111) - 0.1, to: wordStart(128) - 0.1, n: 'ПРАВИЛО 5', text: 'ЗАКАЗЧИК ОТКРЫВАЕТ НА ЦЕПОЧКУ'},
];
const FOGS: {from: number; to: number; name: string; level: number; line: string}[] = [
  {from: wordStart(64) - 0.1, to: shotEnd('long') - 0.2, name: 'ДЛИННЫЙ', level: 1, line: 'Не смотри ему в лицо'},
  {from: wordStart(99) - 0.05, to: shotEnd('neighbor') - 0.2, name: 'СОСЕД', level: 2, line: 'Бегает. Любит чесночный соус'},
  {from: wordStart(128) - 0.05, to: shotEnd('doors') - 0.1, name: 'ДВОЙНИК', level: 3, line: 'Не отдавай ему заказ'},
];

const Cards: React.FC<{v: number}> = ({v}) => {
  const rule = RULES.find((r) => v >= r.from && v <= r.to);
  const fog = FOGS.find((r) => v >= r.from && v <= r.to);
  return (
    <>
      {rule ? (
        <Card opacity={fade(v, rule.from, rule.to, 0.25)}>
          <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: '0.3em', color: YELLOW}}>{rule.n}</div>
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 70, lineHeight: 1.03, color: '#fff', marginTop: 8}}>{rule.text}</div>
        </Card>
      ) : null}
      {fog ? (
        <Card opacity={fade(v, fog.from, fog.to, 0.25)} border="rgba(255,59,48,0.55)">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: '0.3em', color: RED}}>ФОГ</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <span style={{fontFamily: MONO, fontWeight: 500, fontSize: 34, color: 'rgba(255,255,255,0.7)'}}>опасность</span>
              {[1, 2, 3].map((k) => {
                const on = k <= fog.level;
                const pop = on ? smooth(ramp(v, fog.from + 0.25 + k * 0.15, fog.from + 0.45 + k * 0.15)) : 1;
                return <div key={k} style={{width: 34, height: 34, borderRadius: 17, border: `4px solid ${RED}`, background: on && pop > 0.5 ? RED : 'transparent', scale: `${on ? 0.6 + 0.4 * pop : 1}`}} />;
              })}
            </div>
          </div>
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 84, lineHeight: 1.0, color: '#fff', marginTop: 10}}>{fog.name}</div>
          <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 40, color: 'rgba(255,255,255,0.88)', marginTop: 10}}>{fog.line}</div>
        </Card>
      ) : null}
    </>
  );
};

const Card: React.FC<{opacity: number; border?: string; children: React.ReactNode}> = ({opacity, border, children}) => (
  <div style={{position: 'absolute', left: 56, right: 56, top: 250, opacity, translate: `0px ${interpolate(opacity, [0, 1], [-24, 0])}px`}}>
    <div style={{background: CARD, border: `2px solid ${border ?? 'rgba(255,255,255,0.14)'}`, borderRadius: 30, padding: '26px 38px 30px 38px'}}>{children}</div>
  </div>
);

// ---------------------------------------------------------------- captions: the narrator, a phrase at a time

const GROUPS: [number, number][] = [
  [8, 8], [9, 13], [14, 19], [20, 21], [22, 27], [28, 33], [34, 35], [36, 42], [43, 43], [44, 50], [51, 53], [54, 60], [61, 63], [64, 68],
  [69, 73], [74, 78], [79, 82], [83, 90], [91, 95], [96, 98], [99, 104], [105, 107], [108, 110], [111, 115], [116, 119], [120, 122],
  [123, 126], [127, 130], [131, 133],
];
// how the words are written on screen (whisper drops ё and capitals)
const SPELL: Record<number, string> = {
  27: 'этажи.', 41: 'пошёл', 45: 'растёт', 59: 'живёт', 60: 'Фог.', 61: 'Фоги', 84: 'четвёртое', 99: 'Сосед', 101: 'Длинного,', 108: 'Фоги',
  24: '—', 38: '—', 56: '—', 85: '—', 113: '—',
};

const Captions: React.FC<{v: number}> = ({v}) => {
  const i = GROUPS.findIndex(([a], k) => v >= wordStart(a) - 0.05 && (k + 1 >= GROUPS.length || v < wordStart(GROUPS[k + 1][0]) - 0.05));
  if (i < 0) return null;
  const [a, b] = GROUPS[i];
  const next = i + 1 < GROUPS.length ? wordStart(GROUPS[i + 1][0]) - 0.05 : Infinity;
  // gone before the next phrase, and before a line spoken in the scene starts
  const line = LINES.map((l) => l.at[0] - 0.1).find((t) => t > wordStart(a)) ?? Infinity;
  const end = Math.min(wordEnd(b) + 0.6, next - 0.08, line - 0.05);
  if (v > end) return null;
  const o = fade(v, wordStart(a) - 0.05, end, 0.08);
  const words: {w: string; on: boolean}[] = [];
  for (let k = a; k <= b; k++) words.push({w: SPELL[k] ?? WORDS[k].w, on: v >= WORDS[k].s - 0.02});
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        top: 1250,
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

// the lines spoken in the scene, each with who says it
const LINES: {at: [number, number]; who: string; text: string; color: string}[] = [
  {at: CALL, who: 'ИЗ ТУМАНА', text: 'Курьер! Мне сюда!', color: '#cfe0da'},
  {at: DOUBLE, who: 'КВАРТИРА 412А', text: 'Ты принёс мою шаурму?', color: '#ffd7cf'},
  {at: CODE, who: 'КВАРТИРА 412Б', text: 'Код. 4-1-2.', color: '#fff2cf'},
];
const Lines: React.FC<{v: number}> = ({v}) => (
  <>
    {LINES.map((l) => {
      const o = fade(v, l.at[0] - 0.1, l.at[1] + 0.5, 0.12);
      if (o <= 0) return null;
      return (
        <div key={l.text} style={{position: 'absolute', left: 70, right: 70, top: 1230, textAlign: 'center', opacity: o}}>
          <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 36, letterSpacing: '0.2em', color: YELLOW, textShadow: SHADOW, marginBottom: 10}}>{l.who}</div>
          <div style={{fontFamily: SANS, fontStyle: 'italic', fontWeight: 600, fontSize: 64, lineHeight: 1.1, color: l.color, textShadow: SHADOW}}>«{l.text}»</div>
        </div>
      );
    })}
  </>
);

// ---------------------------------------------------------------- the app at the end: delivered, and the next order

const AppScreen: React.FC<{v: number}> = ({v}) => {
  const t0 = shotStart('app');
  const up = smooth(ramp(v, t0, t0 + 0.45));
  const done = smooth(ramp(v, APP_DONE - 0.1, APP_DONE + 0.3));
  const thanks = ramp(v, wordStart(136) - 0.1, wordStart(136) + 0.2);
  const nextIn = smooth(ramp(v, APP_NEXT - 0.1, APP_NEXT + 0.35));
  const floorOn = ramp(v, wordStart(145) - 0.05, wordStart(145) + 0.15);
  const whoOn = ramp(v, wordStart(149) - 0.05, wordStart(149) + 0.15);
  const pulse = 0.5 + 0.5 * Math.sin((v - APP_NEXT) * 7);
  const cutOff = ramp(v, shotEnd('app') - 0.9, shotEnd('app') - 0.1);
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top: 300, bottom: 360, translate: `0px ${(1 - up) * 900}px`, opacity: 1 - cutOff}}>
      <div style={{position: 'absolute', inset: 0, background: 'rgba(12,16,20,0.95)', border: '3px solid #2b3238', borderRadius: 60, padding: '44px 46px', boxShadow: '0 30px 90px rgba(0,0,0,0.7)', overflow: 'hidden'}}>
        <AppHeader sub="Курьер: Ч." />
        <div style={{marginTop: 50, textAlign: 'center', opacity: done, scale: `${0.85 + 0.15 * done}`}}>
          <svg width="150" height="150" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="11" fill={TEAL} />
            <path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke="#06302c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="20" strokeDashoffset={20 * (1 - smooth(ramp(v, APP_DONE + 0.1, APP_DONE + 0.5)))} />
          </svg>
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 72, color: '#fff', marginTop: 20}}>Заказ доставлен!</div>
          <div style={{marginTop: 22}}>
            <Stars n={Math.floor(lerp(0, 5.99, ramp(v, APP_DONE + 0.3, APP_DONE + 1.0)))} />
          </div>
          <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 42, color: 'rgba(255,255,255,0.8)', marginTop: 26, opacity: thanks}}>Спасибо, что выбрал работу в Мурино!</div>
        </div>
      </div>
      {nextIn > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: -20,
            right: -20,
            top: 0,
            translate: `0px ${(1 - nextIn) * -380}px`,
            opacity: nextIn,
            background: 'rgba(30,8,10,0.97)',
            border: `3px solid ${RED}`,
            borderRadius: 40,
            padding: '30px 40px 36px 40px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          }}
        >
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 36, letterSpacing: '0.2em', color: RED}}>СЛЕДУЮЩИЙ ЗАКАЗ</div>
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 92, color: '#fff', marginTop: 10, opacity: floorOn}}>Этаж 666</div>
          <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 50, color: '#fff', marginTop: 8, opacity: whoOn}}>
            Получатель: <span style={{color: RED}}>Друн</span>
          </div>
          <div
            style={{
              marginTop: 26,
              borderRadius: 26,
              padding: '22px 0',
              textAlign: 'center',
              background: RED,
              opacity: 0.6 + 0.4 * pulse,
              scale: `${1 + 0.03 * pulse}`,
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 50,
              letterSpacing: '0.08em',
              color: '#fff',
            }}
          >
            ПРИНЯТЬ
          </div>
        </div>
      ) : null}
    </div>
  );
};

const EndCard: React.FC<{v: number}> = ({v}) => {
  const t0 = shotStart('end');
  return (
    <AbsoluteFill style={{background: '#000', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24}}>
      <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 40, letterSpacing: '0.3em', color: TEAL, opacity: ramp(v, t0 + 0.3, t0 + 0.8), paddingLeft: '0.3em'}}>БЫСТРОВЕЗУ</div>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 112, lineHeight: 1, color: '#fff', textAlign: 'center', opacity: ramp(v, t0 + 0.5, t0 + 1.1)}}>
        КУРЬЕР
        <br />В <span style={{color: RED}}>МУРИНО</span>
      </div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 60, letterSpacing: '0.12em', color: YELLOW, opacity: ramp(v, t0 + 1.0, t0 + 1.6)}}>СЕРИЯ 1</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- transitions between the scenes, never the same twice in a row

const dip = (v: number, at: number, half: number) => Math.max(0, 1 - Math.abs(v - at) / half);
const Transitions: React.FC<{v: number}> = ({v}) => {
  const white = Math.max(dip(v, shotStart('order'), 0.35), dip(v, shotStart('neighbor'), 0.4));
  const black = Math.max(dip(v, shotStart('well'), 0.3), dip(v, shotStart('doors'), 0.35), ramp(v, shotEnd('app') - 0.5, shotEnd('app')));
  return (
    <>
      {white > 0 ? <AbsoluteFill style={{background: '#dfe4e2', opacity: smooth(white)}} /> : null}
      {black > 0 ? <AbsoluteFill style={{background: '#000', opacity: smooth(black)}} /> : null}
    </>
  );
};

export const Overlay: React.FC<{v: number; frame: number}> = ({v, frame}) => {
  const s = shotAt(v);
  if (s.name === 'end') return <EndCard v={v} />;
  const titleOut = ramp(v, shotEnd('title') - 0.55, shotEnd('title') - 0.05);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.35) 100%)'}} />
      <Grain frame={frame} />
      {s.name === 'title' ? <TitleText opacity={1 - titleOut} scale={1 + 0.04 * titleOut} /> : null}
      <OrderCard v={v} />
      <OrderChip v={v} shot={s.name} />
      <FloorHud v={v} shot={s.name} />
      <Cards v={v} />
      {s.name !== 'app' ? <Captions v={v} /> : null}
      <Lines v={v} />
      {s.name === 'app' ? <AppScreen v={v} /> : null}
      <Transitions v={v} />
    </AbsoluteFill>
  );
};
