import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ROUND} from '../bear/Overlay';
import {BADGE, BOUGHT, CARD, DOLG, FINAL, GLOBE, GROUPS, GROW_B, GROW_G, MIL, MINUS, NO1, PHRASES, RULER, SCORE, Shot, THRONE, WIN, WORDS, X4, BOARD, ENV, clamp01, shotAt, shotStart} from './cues';

const YELLOW = '#ffd23f';
const INK = '#2a1f3a';
const G_GRAD = 'linear-gradient(90deg, #5ee89a, #2fae6a 60%, #1f8a50)';
const B_GRAD = 'linear-gradient(90deg, #7ab8ff, #2a7ae2 60%, #1a54b0)';
const RED = '#e8453c';
const GREEN = '#2fae5a';
const PLATE = 'rgba(24,18,40,0.84)';
const CREAM = '#fff7e8';
const SHADOW = '0 8px 0 rgba(40,20,60,0.4), 0 16px 30px rgba(0,0,0,0.3)';

const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const pop = (t: number, k = 9) => (t <= 0 ? 0 : 1 - Math.exp(-t * k) * Math.cos(t * k * 1.6));

// ---------- the score: one tug bar, green (Gaben) from the left, blue (MrBeast) from the right ----------

const stepAt = (v: number) => {
  let i = 0;
  SCORE.forEach((s, k) => {
    if (v >= s[0]) i = k;
  });
  return i;
};
const split = (v: number) => {
  const i = stepAt(v);
  const at = (j: number) => 0.5 + 0.13 * (SCORE[j][1] - SCORE[j][2]);
  if (i === 0) return at(0);
  const t = v - SCORE[i][0];
  const k = 1 - Math.exp(-t * 6) * Math.cos(t * 9);
  return at(i - 1) + (at(i) - at(i - 1)) * k;
};

export const ScoreBar: React.FC<{v: number}> = ({v}) => {
  const i = stepAt(v);
  const [, g, b] = SCORE[i];
  const t = v - SCORE[i][0];
  const bump = i > 0 && t < 0.8 ? pop(t, 10) : 1;
  const W = 880;
  const x = split(v);
  return (
    <div style={{position: 'absolute', left: (1080 - W) / 2, width: W, top: 120}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10}}>
        <div style={{background: G_GRAD, color: '#fff', borderRadius: 18, padding: '6px 24px 9px', fontFamily: ROUND, fontWeight: 800, fontSize: 42, boxShadow: SHADOW}}>ГАБЕН</div>
        <div style={{background: CREAM, color: INK, borderRadius: 20, padding: '2px 22px 6px', fontFamily: ROUND, fontWeight: 800, fontSize: 58, fontVariantNumeric: 'tabular-nums', transform: `scale(${0.8 + 0.2 * bump})`, boxShadow: SHADOW}}>
          <span style={{color: '#1f8a50'}}>{g}</span> : <span style={{color: '#1a54b0'}}>{b}</span>
        </div>
        <div style={{background: B_GRAD, color: '#fff', borderRadius: 18, padding: '6px 24px 9px', fontFamily: ROUND, fontWeight: 800, fontSize: 42, boxShadow: SHADOW}}>БИСТ</div>
      </div>
      <div style={{position: 'relative', height: 40, borderRadius: 20, overflow: 'hidden', boxShadow: 'inset 0 0 0 4px rgba(255,255,255,0.85), 0 6px 0 rgba(40,20,60,0.35)'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${x * 100}%`, background: G_GRAD}} />
        <div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: `${(1 - x) * 100}%`, background: B_GRAD}} />
        <div style={{position: 'absolute', left: `calc(${x * 100}% - 4px)`, top: -2, bottom: -2, width: 8, background: '#fff'}} />
      </div>
    </div>
  );
};

// ---------- the round name and whose turn ----------

const ROUNDS: Partial<Record<Shot, string>> = {
  worth: 'РАУНД 1: СОСТОЯНИЕ',
  fansG: 'РАУНД 2: ФАНАТЫ',
  fansB: 'РАУНД 2: ФАНАТЫ',
  spendB: 'РАУНД 3: ТРАТЫ',
  yacht: 'РАУНД 3: ТРАТЫ',
  factory: 'РАУНД 3: ТРАТЫ',
  ageG: 'РАУНД 4: ВОЗРАСТ',
  ageB: 'РАУНД 4: ВОЗРАСТ',
  final: 'ФИНАЛ: ДЕНЬГИ НА КАРТЕ',
  sea: 'ФИНАЛ: ДЕНЬГИ НА КАРТЕ',
  wallet: 'ФИНАЛ: ДЕНЬГИ НА КАРТЕ',
  mom: 'ФИНАЛ: ДЕНЬГИ НА КАРТЕ',
};
const WHO: Partial<Record<Shot, 'g' | 'b'>> = {fansG: 'g', fansB: 'b', spendB: 'b', yacht: 'g', factory: 'g', ageG: 'g', ageB: 'b', sea: 'g', wallet: 'b', mom: 'b'};

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
  const final = text.startsWith('ФИНАЛ');
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', opacity: clamp01(t / 0.08)}}>
      <div style={{display: 'inline-block', background: final ? YELLOW : CREAM, color: INK, borderRadius: 999, padding: '8px 34px 11px', fontFamily: ROUND, fontWeight: 800, fontSize: final ? 46 : 50, transform: `scale(${0.6 + 0.4 * pop(t, 10)}) rotate(-2deg)`, boxShadow: SHADOW}}>{text}</div>
    </div>
  );
};

const WhoChip: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v).name;
  const who = WHO[s];
  if (!who) return null;
  const t = sinceSame(v, (x) => WHO[x]);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 392, textAlign: 'center', opacity: clamp01(t / 0.08)}}>
      <div style={{display: 'inline-block', background: who === 'g' ? G_GRAD : B_GRAD, color: '#fff', borderRadius: 22, padding: '6px 26px 10px', fontFamily: ROUND, fontWeight: 800, fontSize: 44, transform: `scale(${0.6 + 0.4 * pop(t, 11)}) rotate(1.5deg)`, boxShadow: SHADOW}}>
        {who === 'g' ? 'ГАБЕН' : 'МИСТЕР БИСТ'}
      </div>
    </div>
  );
};

// ---------- the hook question ----------

const HOOK_END = shotStart('worth') + 0.1;
export const Question: React.FC<{v: number; still?: boolean}> = ({v, still}) => {
  if (!still && v > HOOK_END) return null;
  const o = still ? 1 : fade(v, 0, HOOK_END, 0.01, 0.25);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 320, textAlign: 'center', opacity: o, transform: `scale(${still ? 1 : 0.9 + 0.1 * pop(v + 0.15, 7)})`}}>
      <div style={{display: 'inline-block', background: CREAM, color: INK, borderRadius: 34, padding: '16px 40px 22px', fontFamily: ROUND, fontWeight: 800, fontSize: 96, lineHeight: 1.08, boxShadow: SHADOW, transform: 'rotate(-1.5deg)'}}>
        Кто <span style={{color: RED}}>богаче?</span>
      </div>
    </div>
  );
};

// ---------- one-off stickers ----------

const Sticker: React.FC<{v: number; at: number; to: number; top: number; bg: string; fg?: string; size?: number; rot?: number; side?: 'l' | 'r' | 'c'; children: React.ReactNode}> = ({v, at, to, top, bg, fg = '#fff', size = 96, rot = -6, side = 'c', children}) => {
  if (v < at || v > to) return null;
  const t = v - at;
  return (
    <div style={{position: 'absolute', left: side === 'r' ? 470 : 40, right: side === 'l' ? 470 : 40, top, textAlign: 'center', opacity: fade(v, at, to, 0.04, 0.15)}}>
      <div style={{display: 'inline-block', background: bg, color: fg, borderRadius: 32, padding: '10px 36px 16px', fontFamily: ROUND, fontWeight: 800, fontSize: size, lineHeight: 1.1, transform: `scale(${0.5 + 0.5 * pop(t, 10)}) rotate(${rot}deg)`, boxShadow: '0 12px 0 rgba(40,20,60,0.45), 0 22px 44px rgba(0,0,0,0.35)'}}>{children}</div>
    </div>
  );
};

// a small grey source line under the numbers (so nobody thinks they are made up)
const Source: React.FC<{v: number; at: number; to: number; text: string}> = ({v, at, to, text}) => {
  if (v < at || v > to) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 1300, textAlign: 'center', opacity: fade(v, at, to, 0.15, 0.15)}}>
      <span style={{background: 'rgba(20,14,34,0.7)', color: '#e8e4f0', borderRadius: 14, padding: '4px 18px 7px', fontFamily: ROUND, fontWeight: 600, fontSize: 34}}>{text}</span>
    </div>
  );
};

// ---------- the bank app (minus money) and the final card ----------

const BankApp: React.FC<{v: number}> = ({v}) => {
  const a = MINUS;
  const b = shotStart('mom');
  if (v < a || v >= b) return null;
  const t = v - a;
  return (
    <div style={{position: 'absolute', left: 40, right: 610, top: 470, opacity: fade(v, a, b, 0.1, 0.12), transform: `translateY(${(1 - pop(t, 8)) * 60}px) rotate(-4deg)`}}>
      <div style={{background: '#1a1c24', borderRadius: 44, padding: 18, boxShadow: SHADOW}}>
        <div style={{background: '#f4f6fa', borderRadius: 30, padding: '26px 24px 30px', fontFamily: ROUND, textAlign: 'center'}}>
          <div style={{color: '#5a6070', fontWeight: 700, fontSize: 36}}>Баланс карты</div>
          <div style={{color: RED, fontWeight: 800, fontSize: 92, lineHeight: 1.1, marginTop: 6}}>− $</div>
          {v > DOLG ? <div style={{marginTop: 10, background: RED, color: '#fff', borderRadius: 16, padding: '4px 0 8px', fontWeight: 800, fontSize: 36}}>БЕРУ В ДОЛГ</div> : null}
        </div>
      </div>
    </div>
  );
};

const CardLine: React.FC<{v: number}> = ({v}) => {
  if (v < CARD) return null;
  const t = v - CARD;
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 1080, textAlign: 'center', opacity: clamp01(t / 0.1), transform: `scale(${0.6 + 0.4 * pop(t, 9)}) rotate(-2deg)`}}>
      <div style={{display: 'inline-block', background: 'linear-gradient(135deg, #3a3a50, #1a1a28)', color: '#fff', borderRadius: 30, padding: '18px 30px 22px', fontFamily: ROUND, fontWeight: 800, fontSize: 56, lineHeight: 1.15, boxShadow: SHADOW, border: '4px solid #ffd23f'}}>
        ТВОЯ КАРТА <span style={{color: YELLOW}}>&gt;</span> КАРТА БИСТА
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

const P = PHRASES;
const S = shotStart;
export const Overlay: React.FC<{v: number}> = ({v}) => (
  <AbsoluteFill>
    <ScoreBar v={v} />
    <Question v={v} />
    <RoundSticker v={v} />
    <WhoChip v={v} />
    <BankApp v={v} />
    <Sticker v={v} at={P[1][0]} to={S('worth') - 0.05} top={1150} bg={YELLOW} fg={INK} size={58} rot={-3}>
      ТОЛЬКО НАСТОЯЩИЕ ЦИФРЫ
    </Sticker>
    {/* round 1 */}
    <Sticker v={v} at={GROW_B + 0.3} to={S('fansG') - 0.05} top={1040} bg={B_GRAD} size={62} rot={3} side="r">
      $2,6 млрд
    </Sticker>
    <Sticker v={v} at={GROW_G + 0.6} to={S('fansG') - 0.05} top={520} bg={G_GRAD} size={66} rot={-3} side="l">
      $10,2 млрд
    </Sticker>
    <Sticker v={v} at={X4} to={S('fansG') - 0.05} top={760} bg={RED} size={92} rot={6} side="r">
      ×4
    </Sticker>
    <Source v={v} at={GROW_B + 0.3} to={S('fansG') - 0.05} text="Forbes, ноябрь 2026 · Fortune, январь 2026" />
    {/* round 2 */}
    <Sticker v={v} at={BOARD} to={S('fansB') - 0.05} top={1150} bg={G_GRAD} size={56} rot={-3}>
      рекорд Стима: 43,5 млн онлайн
    </Sticker>
    <Source v={v} at={BOARD} to={S('fansB') - 0.05} text="SteamDB, 11 октября 2026" />
    <Sticker v={v} at={GLOBE + 0.3} to={S('spendB') - 0.05} top={1120} bg={B_GRAD} size={64} rot={3}>
      500 000 000+ подписчиков
    </Sticker>
    <Sticker v={v} at={NO1} to={S('spendB') - 0.05} top={520} bg={YELLOW} fg={INK} size={58} rot={-4}>
      №1 В ИСТОРИИ ЮТУБА
    </Sticker>
    {/* round 3 */}
    <Sticker v={v} at={MIL} to={S('yacht') - 0.05} top={1150} bg={GREEN} size={62} rot={-3}>
      $1 000 000 = 1 видео
    </Sticker>
    <Sticker v={v} at={RULER + 0.3} to={S('factory') - 0.05} top={1150} bg={YELLOW} fg={INK} size={76} rot={3}>
      яхта 111 м
    </Sticker>
    <Sticker v={v} at={BOUGHT} to={S('ageG') - 0.05} top={480} bg={RED} size={86} rot={-8}>
      КУПЛЕН
    </Sticker>
    <Source v={v} at={BOUGHT + 0.2} to={S('ageG') - 0.05} text="верфь Oceanco, август 2025" />
    {/* round 4 */}
    <Sticker v={v} at={S('ageG') + 0.3} to={S('ageB') - 0.05} top={520} bg={CREAM} fg={INK} size={70} rot={-3}>
      27 лет
    </Sticker>
    <Sticker v={v} at={BADGE} to={S('ageB') - 0.05} top={1150} bg="#5a6070" size={58} rot={2}>
      обычный сотрудник
    </Sticker>
    <Sticker v={v} at={S('ageB') + 0.3} to={S('final') - 0.05} top={520} bg={CREAM} fg={INK} size={70} rot={3}>
      27 лет
    </Sticker>
    <Sticker v={v} at={THRONE} to={S('final') - 0.05} top={1130} bg={B_GRAD} size={54} rot={-2}>
      миллиардер (на бумаге)
    </Sticker>
    {/* final */}
    <Sticker v={v} at={FINAL - 0.6} to={FINAL + 0.2} top={640} bg={CREAM} fg={INK} size={110} rot={-4}>
      2 : 2
    </Sticker>
    <Sticker v={v} at={S('sea') + 0.6} to={S('wallet') - 0.05} top={1150} bg={G_GRAD} size={56} rot={-2}>
      живёт в море на яхтах
    </Sticker>
    <Source v={v} at={MINUS} to={S('mom') - 0.05} text="интервью WSJ, январь 2026" />
    <Sticker v={v} at={ENV - 0.2} to={S('win') - 0.05} top={560} bg="#e8607a" size={62} rot={-3}>
      на свадьбу
    </Sticker>
    <Sticker v={v} at={WIN + 0.2} to={1e9} top={300} bg={CREAM} fg={INK} size={58} rot={-2}>
      ПОБЕДИТЕЛЬ:
      <br />
      <span style={{color: '#1f8a50', fontSize: 96}}>ГАБЕН</span>
    </Sticker>
    <CardLine v={v} />
    {GROUPS.map((_, g) => (
      <Caption key={g} v={v} g={g} />
    ))}
  </AbsoluteFill>
);
