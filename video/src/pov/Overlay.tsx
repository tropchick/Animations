import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {flashAt} from './Studio';
import {inCircleAt} from './Field';
import {MONEY, NOTIFY, RESET, ShotName, clamp01, ramp, shotAt, shotEnd, shotStart, smooth, spentAt, wordStart} from './cues';

const SERIF = "'Spectral', Georgia, serif";
const SANS = "'Inter', Helvetica, Arial, sans-serif";
const SHADOW = '0 2px 12px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.45)';
const YELLOW = '#ffd23f';
const GREEN = '#7dff8a';
const RED = '#ff5a4e';

const fade = (v: number, from: number, to: number, f = 0.3) =>
  interpolate(v, [from, from + f, to - f, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const money = (n: number) => '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// ---------- the time of day, top center ----------

const hm = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
const clockOf = (name: ShotName, v: number): string | null => {
  const k = (a: ShotName) => clamp01((v - shotStart(a)) / (shotEnd(a) - shotStart(a)));
  switch (name) {
    case 'alarm':
    case 'wake':
    case 'alarm2':
      return '06:00';
    case 'cameras':
      return '06:05';
    case 'door':
    case 'keys':
    case 'crying':
      return '07:30';
    case 'field':
      return '09:00';
    case 'timelapse': {
      const mins = 9 * 60 + Math.floor(180 * smooth(k('timelapse')) / 5) * 5;
      return hm(Math.floor(mins / 60), mins % 60);
    }
    case 'sleeper':
      return '12:00';
    case 'studio':
      return hm(12, Math.floor(30 * k('studio')));
    case 'lcd':
      return hm(12, 30 + Math.floor(10 * k('lcd')));
    case 'beach':
    case 'digging':
      return '15:00';
    case 'editroom':
      return '20:00';
    case 'editorface':
      return '20:05';
    case 'money':
      return '23:55';
    case 'editorcry':
      return '23:58';
    case 'phone':
      return null;
    case 'bed':
      return '00:15';
    case 'eyes':
      return '03:12';
  }
};

const ClockChip: React.FC<{text: string}> = ({text}) => (
  <div style={{position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
    <div
      style={{
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: 40,
        letterSpacing: 3,
        color: '#fff',
        padding: '10px 30px',
        borderRadius: 40,
        background: 'rgba(10,12,18,0.45)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {text}
    </div>
  </div>
);

// ---------- the counter on the left ----------

const subOf = (name: ShotName, v: number): [string, string?] => {
  switch (name) {
    case 'wake':
    case 'cameras':
      return ['ЦЕЛЬ: $1 000 000  ·  КАМЕР: 20'];
    case 'door':
    case 'keys':
      return ['ЦЕЛЬ: $1 000 000'];
    case 'crying':
      return v < wordStart(36) ? ['КУРЬЕРОВ В СЛЕЗАХ: 1'] : ['КУРЬЕРОВ В СЛЕЗАХ: 1', 'ОПЕРАТОРОВ В СЛЕЗАХ: 1'];
    case 'field':
    case 'timelapse':
    case 'sleeper':
      return [`В КРУГЕ: ${inCircleAt(v)}`];
    case 'studio':
    case 'lcd': {
      const k = ramp(v, shotStart('studio') + 0.3, shotEnd('lcd') - 0.4);
      return [`ДУБЛЕЙ ОБЛОЖКИ: ${Math.round(1 + 311 * Math.pow(k, 1.6))}`];
    }
    case 'beach':
    case 'digging':
      return ['ЛОПАТ: 1 000'];
    case 'editroom':
    case 'editorface':
      return ['ЧАСОВ ВИДЕО: 140', 'НУЖНО МИНУТ: 20'];
    case 'money': {
      const last = MONEY[MONEY.length - 1].t;
      return v < last ? ['ДО МИЛЛИОНА: $80 000'] : ['ЦЕЛЬ ВЫПОЛНЕНА'];
    }
    case 'editorcry':
      return ['МОНТАЖЁРОВ В СЛЕЗАХ: 1'];
    case 'bed':
      return ['СОН: НАКОНЕЦ-ТО'];
    case 'eyes':
      return v < RESET ? ['СОН: НАКОНЕЦ-ТО'] : ['ЦЕЛЬ НА ЗАВТРА: $2 000 000'];
    default:
      return [''];
  }
};

const Hud: React.FC<{v: number; name: ShotName; t: number}> = ({v, name, t}) => {
  const on = fade(v, wordStart(8) - 0.2, shotEnd('eyes') - 0.05, 0.3);
  if (on <= 0 || name === 'phone' || (name === 'lcd' && t < 1.35)) return null;
  const reset = name === 'eyes' && v >= RESET;
  const spent = reset ? 0 : spentAt(v);
  // green jump after every purchase
  const jump = MONEY.reduce((a, m) => Math.max(a, Math.max(0, 1 - Math.abs(v - m.t - 0.25) / 0.35)), 0);
  const done = spent >= 1000000;
  const pulse = 1 + 0.08 * jump + (done ? 0.03 * Math.max(0, Math.sin(v * 7)) : 0) + (reset ? 0.1 * Math.max(0, 1 - (v - RESET) / 0.3) : 0);
  const color = reset ? '#ffffff' : done ? YELLOW : jump > 0.2 ? GREEN : '#ffffff';
  const [sub1, sub2] = subOf(name, v);
  return (
    <div style={{position: 'absolute', left: 44, top: 860, opacity: on, whiteSpace: 'nowrap'}}>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: 2.5, color: '#fff', textShadow: SHADOW}}>ПОТРАЧЕНО СЕГОДНЯ</div>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 400,
          fontSize: 104,
          lineHeight: 1.05,
          color,
          textShadow: SHADOW,
          fontVariantNumeric: 'tabular-nums',
          transformOrigin: 'left center',
          scale: String(pulse),
        }}
      >
        {money(spent)}
      </div>
      {[sub1, sub2].filter(Boolean).map((line, i) => (
        <div
          key={i}
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 24,
            letterSpacing: 2.2,
            color: reset ? RED : 'rgba(255,255,255,0.92)',
            textShadow: SHADOW,
            marginTop: i === 0 ? 6 : 2,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
};

// ---------- captions ----------

const Caption: React.FC<{opacity: number; children: React.ReactNode; size?: number; top?: number}> = ({opacity, children, size = 66, top = 1250}) =>
  opacity > 0 ? (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        top,
        textAlign: 'center',
        fontFamily: SERIF,
        fontStyle: 'italic',
        fontWeight: 500,
        fontSize: size,
        lineHeight: 1.15,
        color: '#fff',
        textShadow: SHADOW,
        opacity,
        translate: `0px ${interpolate(opacity, [0, 1], [14, 0])}px`,
      }}
    >
      {children}
    </div>
  ) : null;

// ---------- the camera's screen: a grid of the same surprised face ----------

const FaceTile: React.FC<{k: number}> = ({k}) => {
  const tilt = [-4, 3, 0, 5, -2][k % 5];
  return (
    <svg viewBox="0 0 100 100" style={{width: '100%', height: '100%', display: 'block'}}>
      <rect width="100" height="100" fill="#ececea" />
      <g transform={`rotate(${tilt} 50 60)`}>
        <rect x="20" y="78" width="60" height="30" fill="#2f6fd6" />
        <rect x="9" y="20" width="10" height="34" fill="#efd2b3" transform="rotate(-25 14 54)" />
        <rect x="81" y="20" width="10" height="34" fill="#efd2b3" transform="rotate(25 86 54)" />
        <rect x="31" y="26" width="38" height="44" fill="#efd2b3" />
        <rect x="30" y="22" width="40" height="9" fill="#8a6a45" />
        <rect x="29" y="56" width="5" height="16" fill="#6f5236" />
        <rect x="66" y="56" width="5" height="16" fill="#6f5236" />
        <rect x="31" y="66" width="38" height="6" fill="#6f5236" />
        <rect x="37" y="36" width="7" height="8" fill="#2a2622" />
        <rect x="56" y="36" width="7" height="8" fill="#2a2622" />
        <rect x="35" y="30" width="10" height="2.5" fill="#8a6a45" />
        <rect x="55" y="30" width="10" height="2.5" fill="#8a6a45" />
        <rect x="44" y="53" width="12" height="11" fill="#4a2422" />
      </g>
    </svg>
  );
};

const CameraScreen: React.FC<{t: number}> = ({t}) => {
  const sel = Math.min(11, Math.floor(t * 9));
  return (
    <AbsoluteFill style={{background: '#101114', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: 940, padding: 34, borderRadius: 36, background: '#1d1f24', boxShadow: '0 0 0 6px #2a2c31', scale: String(1 + 0.03 * t)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontWeight: 600, fontSize: 30, color: '#d9dde3', marginBottom: 22, letterSpacing: 2}}>
          <span>
            <span style={{color: RED}}>●</span> ОБЛОЖКА
          </span>
          <span>{`ДУБЛЬ ${Math.round(300 + 12 * clamp01(t / 1.2))}`}</span>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14}}>
          {Array.from({length: 12}).map((_, k) => (
            <div key={k} style={{aspectRatio: '1 / 1', outline: k === sel ? `6px solid ${YELLOW}` : 'none', outlineOffset: -6}}>
              <FaceTile k={k} />
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- the phone after the upload ----------

const Thumb: React.FC = () => (
  <svg viewBox="0 0 160 90" style={{width: '100%', display: 'block', borderRadius: 18}}>
    <rect width="160" height="90" fill="#5ec3ea" />
    <rect y="58" width="160" height="32" fill="#ecd28f" />
    <polygon points="70,60 96,60 92,52 74,52" fill="#d8202b" />
    <rect x="68" y="48" width="30" height="3" fill="#d8202b" />
    <rect x="8" y="30" width="22" height="34" fill="#2f6fd6" />
    <rect x="12" y="14" width="14" height="16" fill="#efd2b3" />
    <rect x="16" y="23" width="6" height="5" fill="#4a2422" />
    <text x="104" y="40" textAnchor="middle" fontFamily="Inter, Arial" fontWeight="800" fontSize="17" fill="#ffd23f" stroke="#1a1a1a" strokeWidth="0.8">
      $1 000 000
    </text>
  </svg>
);

const PhoneScreen: React.FC<{v: number; t: number; frame: number}> = ({v, t, frame}) => {
  const digits = Math.min(9, 3 + Math.floor(t * 1.8));
  let views = '';
  for (let i = 0; i < digits; i++) views += Math.floor(random(`views-${frame}-${i}`) * 10);
  views = (Number(views[0]) === 0 ? '1' : '') + views;
  views = views.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const banner = smooth(ramp(v, NOTIFY, NOTIFY + 0.3)) * (1 - smooth(ramp(t, 2.6, 3.0)));
  const pts = Array.from({length: 40}, (_, i) => {
    const x = (i / 39) * 520;
    const grow = clamp01(t / 4) * 1.0;
    const y = 200 - Math.pow(i / 39, 3) * 190 * grow - 6 * random(`sp-${i}`);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <AbsoluteFill style={{background: 'rgba(5,7,12,0.72)', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: 640, height: 1260, borderRadius: 78, background: '#050506', padding: 20, boxShadow: '0 30px 90px rgba(0,0,0,0.6)', translate: `0px ${interpolate(t, [0, 0.4], [60, 0], {extrapolateRight: 'clamp'})}px`}}>
        <div style={{width: '100%', height: '100%', borderRadius: 60, background: '#0f1115', overflow: 'hidden', position: 'relative', fontFamily: SANS, color: '#fff'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', padding: '28px 46px 0', fontWeight: 600, fontSize: 28}}>
            <span>00:10</span>
            <span>▮▮▮ 100%</span>
          </div>
          <div style={{padding: '40px 40px 0'}}>
            <Thumb />
            <div style={{fontWeight: 800, fontSize: 36, lineHeight: 1.2, marginTop: 26}}>Я ПОТРАТИЛ $1 000 000 ЗА 18 ЧАСОВ</div>
            <div style={{fontWeight: 500, fontSize: 24, color: '#9aa0ab', marginTop: 10}}>опубликовано только что</div>
            <div style={{fontWeight: 600, fontSize: 28, letterSpacing: 3, color: '#9aa0ab', marginTop: 70}}>ПРОСМОТРЫ</div>
            <div style={{fontFamily: SERIF, fontSize: 108, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', color: GREEN, whiteSpace: 'nowrap'}}>{views}</div>
            <svg width="520" height="210" style={{marginTop: 30}}>
              <polyline points={pts} fill="none" stroke={GREEN} strokeWidth="6" strokeLinejoin="round" />
            </svg>
          </div>
          <div
            style={{
              position: 'absolute',
              left: 24,
              right: 24,
              top: 18 + interpolate(banner, [0, 1], [-160, 0]),
              borderRadius: 30,
              background: 'rgba(40,44,52,0.96)',
              padding: '22px 28px',
              fontWeight: 600,
              fontSize: 28,
            }}
          >
            ✓ Видео опубликовано
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- snoring Zs over the sleeper ----------

const Zs: React.FC<{t: number}> = ({t}) => (
  <>
    {[0, 1, 2].map((k) => {
      const ph = (t * 0.55 + k / 3) % 1;
      return (
        <div
          key={k}
          style={{
            position: 'absolute',
            left: 930 - ph * 110,
            top: 740 - ph * 250,
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 60 + ph * 40,
            color: '#fff',
            opacity: Math.sin(Math.PI * ph),
            textShadow: SHADOW,
          }}
        >
          Z
        </div>
      );
    })}
  </>
);

export const Overlay: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const v = frame / fps;
  const s = shotAt(v);
  const clock = clockOf(s.name, v);
  const flash = s.name === 'studio' || s.name === 'lcd' ? flashAt(v) : 0;
  const title = s.name === 'wake' ? fade(v, s.from + 0.3, wordStart(16) - 0.25, 0.35) : 0;
  const night = s.name === 'bed' || s.name === 'eyes' || s.name === 'editroom' || s.name === 'editorface' || s.name === 'money' || s.name === 'editorcry';
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 52%, rgba(0,0,0,0.7) 100%)', opacity: night ? 0.6 : 0.3}} />
      {s.name === 'lcd' && s.t < 1.35 ? <CameraScreen t={s.t} /> : null}
      {s.name === 'phone' ? <PhoneScreen v={v} t={s.t} frame={frame} /> : null}
      <AbsoluteFill style={{background: '#ffffff', opacity: Math.min(0.42, flash * 0.42)}} />
      {s.name === 'sleeper' ? <Zs t={s.t} /> : null}
      {clock && !(s.name === 'lcd' && s.t < 1.35) ? <ClockChip text={clock} /> : null}
      <Hud v={v} name={s.name} t={s.t} />
      {title > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 300, textAlign: 'center', opacity: title, translate: `0px ${interpolate(title, [0, 1], [18, 0])}px`}}>
          <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 84, lineHeight: 1.05, color: '#fff', textShadow: SHADOW, whiteSpace: 'nowrap'}}>
            ПОВ: ты <span style={{color: YELLOW}}>Мистер Бист</span>
          </div>
          <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: 4, color: 'rgba(255,255,255,0.9)', textShadow: SHADOW, marginTop: 18}}>
            ПАРОДИЯ · ВСЁ ВЫДУМАНО
          </div>
        </div>
      ) : null}
      <Caption opacity={s.name === 'lcd' ? fade(v, wordStart(86) - 0.15, s.to + 0.2, 0.25) : 0}>«Ещё удивлённее»</Caption>
      <Caption opacity={s.name === 'editroom' ? fade(v, wordStart(110) - 0.1, s.to + 0.2, 0.3) : 0}>
        140 часов <span style={{color: YELLOW}}>→</span> 20 минут
      </Caption>
      <Caption opacity={s.name === 'eyes' ? fade(v, wordStart(169) - 0.05, s.to + 0.3, 0.2) : 0} size={110} top={1220}>
        <span style={{color: RED, fontStyle: 'normal', fontWeight: 700}}>больше.</span>
      </Caption>
      {/* small parody mark in the corner for the whole video */}
      <div style={{position: 'absolute', top: 160, right: 40, fontFamily: SANS, fontWeight: 600, fontSize: 22, letterSpacing: 3, color: 'rgba(255,255,255,0.75)', textShadow: SHADOW}}>
        ПАРОДИЯ
      </div>
    </AbsoluteFill>
  );
};
