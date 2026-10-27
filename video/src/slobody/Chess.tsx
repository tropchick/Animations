import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {
  GRADES, Grade, MATE, MOVES, MOVE_NO, Move, PIECE, RESULTS, SUBS, WILLOW_IN, accuracy, clamp01, clocks, count, moveAt, outBack, ramp,
  smooth,
} from './cues';

export const SANS = "'Inter', Helvetica, Arial, sans-serif";
export const SERIF = "'Spectral', Georgia, serif";
export const MONO = "'IBM Plex Mono', monospace";
export const CREAM = '#f1ead7';
export const INK = '#1e1a14';
const WOOD = '#6e4b2a';
const GREEN = '#7fa650';
const DARK = '#23211e';

// Layout of the 1080x1920 frame: the scene full width in the middle, scoreboard and move card above it,
// subtitles under it. TikTok covers the bottom ~450 px and the right edge with its own buttons,
// so the subtitles stay left of x = 940 and above y = 1450.
export const FOOT = {x: 0, y: 656, w: 1080, h: 608};
const BAR = {x: 14, w: 28, pad: 22};
const CARD_Y = 356;
const SUB_Y = 1292;

const fmtClock = (s: number) => {
  const t = Math.max(0, Math.ceil(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

// ---------------------------------------------------------------- background: a dark board

export const Board: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: '#141a12',
      backgroundImage:
        'linear-gradient(45deg, #1a2217 25%, transparent 25%, transparent 75%, #1a2217 75%), linear-gradient(45deg, #1a2217 25%, transparent 25%, transparent 75%, #1a2217 75%)',
      backgroundSize: '270px 270px',
      backgroundPosition: '0 0, 135px 135px',
    }}
  />
);

// ---------------------------------------------------------------- top: broadcast scoreboard with chess clocks

const Avatar: React.FC<{name: string; size: number; ring: string; dim?: number; style?: React.CSSProperties}> = ({name, size, ring, dim = 0, style}) => (
  <div style={{width: size, height: size, borderRadius: '50%', border: `5px solid ${ring}`, overflow: 'hidden', flex: 'none', background: '#000', position: 'relative', ...style}}>
    <Img src={staticFile(`slobody/av-${name}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: `grayscale(${dim}) brightness(${1 - dim * 0.65})`}} />
    {dim > 0.5 ? (
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 800, fontSize: size * 0.5, color: 'rgba(255,255,255,0.85)'}}>?</div>
    ) : null}
  </div>
);

const Clock: React.FC<{sec: number; active: boolean; light: boolean}> = ({sec, active, light}) => (
  <div
    style={{
      fontFamily: MONO,
      fontWeight: 600,
      fontSize: 46,
      lineHeight: 1,
      padding: '10px 18px',
      borderRadius: 12,
      background: active ? GREEN : light ? 'rgba(30,26,20,0.1)' : 'rgba(255,255,255,0.08)',
      color: active ? '#fff' : light ? INK : CREAM,
      boxShadow: active ? '0 0 0 3px rgba(255,255,255,0.35) inset' : 'none',
    }}
  >
    {fmtClock(sec)}
  </div>
);

export const Scoreboard: React.FC<{v: number}> = ({v}) => {
  const c = clocks(v);
  const willow = ramp(v, WILLOW_IN - 0.2, WILLOW_IN + 0.4);
  const active = (side: 'w' | 'b') => c.running && c.turn === side;
  return (
    <>
      <div style={{position: 'absolute', left: 40, right: 40, top: 112, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: '0.06em', color: 'rgba(241,234,215,0.72)', whiteSpace: 'nowrap'}}>
        ШАХМАТНЫЙ РАЗБОР · «ДО СЛОБОДЫ ДОЕДУ?»
      </div>
      <div style={{position: 'absolute', left: 40, right: 40, top: 160, height: 178, display: 'flex', borderRadius: 26, overflow: 'hidden', border: `6px solid ${WOOD}`, boxShadow: '0 14px 40px rgba(0,0,0,0.5)'}}>
        <div style={{flex: 1, background: CREAM, display: 'flex', alignItems: 'center', gap: 20, padding: '0 22px'}}>
          <Avatar name="city" size={112} ring={active('w') ? GREEN : '#cbbf9f'} />
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: INK, letterSpacing: '0.02em'}}>ГОРОДСКАЯ</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <Clock sec={c.left.w} active={active('w')} light />
              <span style={{fontFamily: SANS, fontWeight: 500, fontSize: 34, color: 'rgba(30,26,20,0.6)'}}>♔</span>
            </div>
          </div>
        </div>
        <div style={{flex: 1, background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 18, padding: '0 22px'}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10}}>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: CREAM, letterSpacing: '0.02em'}}>СЛОБОДА</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <span style={{fontFamily: SANS, fontWeight: 500, fontSize: 34, color: 'rgba(241,234,215,0.6)'}}>♜♞♛</span>
              <Clock sec={c.left.b} active={active('b')} light={false} />
            </div>
          </div>
          <div style={{position: 'relative', width: 112, height: 136, flex: 'none'}}>
            <Avatar name="cond" size={74} ring={active('b') ? GREEN : '#55504a'} style={{position: 'absolute', left: 0, top: 0}} />
            <Avatar name="mom" size={74} ring={active('b') ? GREEN : '#55504a'} style={{position: 'absolute', right: 0, top: 16}} />
            <Avatar name="willow" size={74} ring={active('b') ? GREEN : '#55504a'} dim={1 - willow} style={{position: 'absolute', left: 18, top: 60, scale: `${1 + 0.25 * Math.sin(Math.PI * willow)}`}} />
          </div>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------- the eval bar on the left edge of the picture

const pAt = (v: number) => {
  const i = moveAt(v);
  if (i < 0) return 50;
  const prev = i > 0 ? MOVES[i - 1].p : 50;
  return prev + (MOVES[i].p - prev) * smooth(ramp(v, MOVES[i].t, MOVES[i].t + 0.7));
};

export const evalText = (p: number, mate: boolean) => (mate ? '#' : p === 50 ? '0.0' : `${p > 50 ? '+' : '−'}${(Math.abs(p - 50) / 10).toFixed(1)}`);

export const EvalBar: React.FC<{v: number; p?: number}> = ({v, p}) => {
  const pc = p ?? pAt(v);
  const mate = v >= MATE;
  const bh = FOOT.h - 2 * BAR.pad;
  const h = bh * pc / 100;
  return (
    <>
      <div style={{position: 'absolute', left: BAR.x, top: FOOT.y + BAR.pad, width: BAR.w, height: bh, borderRadius: 10, overflow: 'hidden', background: '#2b2925', border: `3px solid ${WOOD}`, boxSizing: 'border-box', boxShadow: '0 4px 14px rgba(0,0,0,0.5)'}}>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: h, background: CREAM}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: bh / 2 - 4, height: 2, background: 'rgba(127,166,80,0.9)'}} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: BAR.x + BAR.w + 14,
          top: FOOT.y + BAR.pad,
          padding: '8px 16px',
          borderRadius: 12,
          fontFamily: MONO,
          fontWeight: 600,
          fontSize: 40,
          background: pc >= 50 && !mate ? CREAM : 'rgba(20,20,18,0.88)',
          color: pc >= 50 && !mate ? INK : CREAM,
        }}
      >
        {p !== undefined ? evalText(p, true) : evalText(Math.round(pc), mate)}
      </div>
    </>
  );
};

// ---------------------------------------------------------------- frame around the scene

export const Frame: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{position: 'absolute', left: FOOT.x, top: FOOT.y - 6, width: FOOT.w, height: FOOT.h + 12, borderTop: `6px solid ${WOOD}`, borderBottom: `6px solid ${WOOD}`, boxSizing: 'border-box', overflow: 'hidden', boxShadow: '0 18px 50px rgba(0,0,0,0.55)', background: '#000'}}>
    {children}
  </div>
);

// ---------------------------------------------------------------- the grade badge that pops on the picture

export const Glyph: React.FC<{g: Grade; size: number}> = ({g, size}) => {
  const G = GRADES[g];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: G.color,
        color: G.ink,
        border: g === 'mate' ? `${Math.max(3, size * 0.06)}px solid ${CREAM}` : 'none',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: size * (G.glyph.length > 1 ? 0.44 : 0.56),
        letterSpacing: '-0.04em',
        flex: 'none',
      }}
    >
      {G.glyph}
    </div>
  );
};

export const BadgePop: React.FC<{v: number}> = ({v}) => {
  const i = moveAt(v);
  if (i < 1) return null;
  const m = MOVES[i];
  const age = v - m.t;
  if (age > 1.6 && m.grade !== 'mate') return null;
  const k = outBack(clamp01(age / 0.35));
  const out = m.grade === 'mate' ? 0 : ramp(age, 1.25, 1.6);
  const big = m.grade === 'mate' ? 230 : 170;
  return (
    <div style={{position: 'absolute', left: FOOT.x + FOOT.w - big - 30, top: FOOT.y + 30, scale: `${k * (1 - 0.3 * out)}`, opacity: 1 - out, filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.6))'}}>
      <Glyph g={m.grade} size={big} />
    </div>
  );
};

// ---------------------------------------------------------------- the move card: a line of a score sheet

const fitTitle = (s: string) => Math.min(62, Math.floor(1660 / s.length));

// each part of the card is wiped in from left to right, one after another
const wipe = (age: number, delay: number): React.CSSProperties => {
  const k = smooth(ramp(age, delay, delay + 0.4));
  return {clipPath: `inset(-20px ${(1 - k) * 100}% -20px -20px)`};
};

const Card: React.FC<{m: Move; no: number; age: number}> = ({m, no, age}) => {
  const G = GRADES[m.grade];
  const head = m.grade === 'start' ? 'ДЕБЮТ' : m.grade === 'piece' ? 'В ИГРУ ВХОДИТ' : `ХОД ${no} · ${m.who.toUpperCase()} ${PIECE[m.who] ?? ''}`;
  return (
    <div
      style={{
        width: 1000,
        background: CREAM,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 55px, rgba(110,75,42,0.12) 55px 57px)',
        borderRadius: 20,
        borderLeft: `16px solid ${G.color}`,
        padding: '16px 28px 20px',
        boxSizing: 'border-box',
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        ...wipe(age, 0),
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, ...wipe(age, 0.15)}}>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: '0.08em', color: '#7a6448', whiteSpace: 'nowrap'}}>{head}</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, flex: 'none'}}>
          <Glyph g={m.grade} size={48} />
          <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: m.grade === 'mate' ? INK : G.color, filter: 'brightness(0.85)'}}>{G.label.replace(' ход', '')}</span>
        </div>
      </div>
      <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: fitTitle(m.title), lineHeight: 1.1, color: INK, marginTop: 6, whiteSpace: 'nowrap', ...wipe(age, 0.3)}}>{m.title}</div>
      <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 34, lineHeight: 1.25, color: '#3b342b', marginTop: 6, ...wipe(age, 0.5)}}>{m.text}</div>
      {m.better ? (
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 34, color: INK, marginTop: 6, ...wipe(age, 0.7)}}>
          <span style={{color: G.color}}>Лучше было: </span>
          {m.better}
        </div>
      ) : null}
    </div>
  );
};

export const MoveCard: React.FC<{v: number}> = ({v}) => {
  if (v >= RESULTS) return null;
  const i = moveAt(v);
  if (i < 0) return null;
  // the previous card fades out completely before the new one is wiped in
  const leaving = i > 0 && v < MOVES[i].t + 0.2;
  const k = leaving ? i - 1 : i;
  const opacity = leaving ? 1 - ramp(v, MOVES[i].t, MOVES[i].t + 0.2) : 1;
  const age = leaving ? 99 : v - MOVES[i].t - (i > 0 ? 0.2 : 0);
  return (
    <div style={{position: 'absolute', left: 40, top: CARD_Y, opacity}}>
      <Card m={MOVES[k]} no={MOVE_NO[k]} age={age} />
    </div>
  );
};

// ---------------------------------------------------------------- subtitles

export const Subtitles: React.FC<{v: number}> = ({v}) => {
  if (v >= RESULTS) return null;
  const s = SUBS.find((x) => v >= x.s && v < x.e);
  if (!s) return null;
  const k = smooth(ramp(v, s.s, s.s + 0.12));
  return (
    <div style={{position: 'absolute', left: 40, width: 900, top: SUB_Y, textAlign: 'center', opacity: k, scale: `${0.94 + 0.06 * k}`}}>
      <span
        style={{
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 52,
          lineHeight: 1.22,
          color: '#fff',
          WebkitTextStroke: '10px #000',
          paintOrder: 'stroke fill',
          textShadow: '0 4px 14px rgba(0,0,0,0.6)',
        }}
      >
        {s.text}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------- the results screen

const ROW_GRADES: Grade[] = ['brilliant', 'great', 'good', 'interesting', 'inaccuracy', 'mistake', 'blunder'];

const Graph: React.FC<{k: number}> = ({k}) => {
  const W = 960;
  const H = 230;
  const pts = [{p: 50}, ...MOVES.filter((m) => m.grade !== 'start')].map((m, i, a) => [(i / (a.length - 1)) * W, H - (m.p / 100) * H]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg width={W} height={H} style={{display: 'block', borderRadius: 14, background: DARK, overflow: 'hidden'}}>
      <defs>
        <clipPath id="reveal">
          <rect x={0} y={0} width={W * k} height={H} />
        </clipPath>
      </defs>
      <g clipPath="url(#reveal)">
        <path d={`${line} L${W},${H} L0,${H} Z`} fill={CREAM} />
        <path d={line} fill="none" stroke={GREEN} strokeWidth={5} />
      </g>
      <line x1={0} x2={W} y1={H / 2} y2={H / 2} stroke="rgba(127,166,80,0.7)" strokeWidth={2} strokeDasharray="10 10" />
    </svg>
  );
};

const Section: React.FC<{v: number; at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({v, at, children, style}) => {
  const k = smooth(ramp(v, at, at + 0.4));
  return <div style={{opacity: k, translate: `0 ${(1 - k) * 30}px`, ...style}}>{children}</div>;
};

const Award: React.FC<{label: string; value: string}> = ({label, value}) => (
  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 20, padding: '10px 0', borderTop: '2px solid rgba(110,75,42,0.25)'}}>
    <span style={{fontFamily: SANS, fontWeight: 500, fontSize: 34, color: '#6a5a44', flex: 'none'}}>{label}</span>
    <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 36, color: INK, textAlign: 'right'}}>{value}</span>
  </div>
);

export const Results: React.FC<{v: number}> = ({v}) => {
  if (v < RESULTS) return null;
  const t = (k: number) => RESULTS + 0.4 + k * 1.1;
  const dim = smooth(ramp(v, RESULTS, RESULTS + 0.5));
  const rows = ROW_GRADES.filter((g) => count('w', g) + count('b', g) > 0);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `rgba(18,22,16,${dim})`}} />
      <div style={{position: 'absolute', left: 40, right: 40, top: 150, display: 'flex', flexDirection: 'column', gap: 18}}>
        <Section v={v} at={t(0)} style={{textAlign: 'center'}}>
          <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: '0.2em', color: 'rgba(241,234,215,0.75)'}}>ИТОГИ МАТЧА</div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 36, marginTop: 6}}>
            <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: CREAM}}>ГОРОДСКАЯ</span>
            <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 104, color: '#fff', lineHeight: 1}}>0 : 1</span>
            <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: CREAM}}>СЛОБОДА</span>
          </div>
          <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 36, color: GREEN, marginTop: 6}}>Мат на {MOVE_NO[MOVE_NO.length - 1]}-м ходу · победа Слободы</div>
        </Section>
        <Section v={v} at={t(1)}>
          <Graph k={smooth(ramp(v, t(1), t(1) + 1.2))} />
        </Section>
        <Section v={v} at={t(2)} style={{display: 'flex', gap: 18}}>
          {(['w', 'b'] as const).map((side) => (
            <div key={side} style={{flex: 1, borderRadius: 18, padding: '14px 20px', background: side === 'w' ? CREAM : DARK, color: side === 'w' ? INK : CREAM, textAlign: 'center'}}>
              <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 34, opacity: 0.7}}>Точность · {side === 'w' ? 'Городская' : 'Слобода'}</div>
              <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 84, lineHeight: 1.05}}>{accuracy(side)}%</div>
            </div>
          ))}
        </Section>
        <Section v={v} at={t(3)} style={{background: CREAM, borderRadius: 18, padding: '8px 24px'}}>
          {rows.map((g) => (
            <div key={g} style={{display: 'flex', alignItems: 'center', gap: 16, padding: '5px 0'}}>
              <Glyph g={g} size={44} />
              <span style={{flex: 1, fontFamily: SANS, fontWeight: 700, fontSize: 34, color: INK}}>{GRADES[g].label}</span>
              <span style={{width: 90, textAlign: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 40, color: INK}}>{count('w', g)}</span>
              <span style={{width: 90, textAlign: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 40, color: '#fff', background: DARK, borderRadius: 10}}>{count('b', g)}</span>
            </div>
          ))}
        </Section>
        <Section v={v} at={t(4)} style={{background: CREAM, borderRadius: 18, padding: '6px 24px'}}>
          <Award label="Игрок матча" value="Тётка с ивой ♛" />
          <Award label="Лучший ход" value="«Психушка недалеко»" />
          <Award label="Худший ход" value="«Вырву ваш лопух»" />
        </Section>
        <Section v={v} at={t(5)} style={{textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 40, lineHeight: 1.25, color: CREAM}}>
          Автобус идёт до Слободы. А доедешь ты или нет — никому не ведомо.
        </Section>
      </div>
    </AbsoluteFill>
  );
};

