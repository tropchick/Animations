import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import '../chess/fonts';
import {MONO, SANS, SERIF} from '../chess/Chess';
import {clamp01, outBack, ramp, smooth} from '../chess/cues';
import CUES from './cues.json';

// «Топ-10 героев GTA по шахматному рейтингу» — a leaderboard with a soft Vice City sunset palette.
// Intro, ten heroes (10 → 1) with a leaderboard between them, and the GTA VI finale. Frame 0 is the cover.
export const GTATOP_S = CUES.duration;
const E = CUES.intro;

// palette: deep dusk background, soft sunset accents (bright but never neon on white)
const CREAM = '#fff4e6';
const INK = '#1d1530';
const PINK = '#ff7eb3';
const ORANGE = '#ffb36b';
const TEAL = '#4fd6c8';
const VIOLET = '#9b7bff';
const RED = '#ff6b6b';
const GOLD = 'linear-gradient(135deg, #ffe08a, #f2a93b)';
const SILVER = 'linear-gradient(135deg, #f4f6fb, #a9b3c7)';
const BRONZE = 'linear-gradient(135deg, #f3c19a, #b8743f)';
const SUNSET = `linear-gradient(90deg, ${PINK}, ${ORANGE})`;
const ELO_MIN = 1000;
const ELO_MAX = 2800;

type Hero = {place: number; name: string; game: string; year: number; elo: number; img: string; color: string; tags: string[]; best: string; blunder: string; joke: string};
const HEROES: Hero[] = [
  {place: 10, name: 'ВИКТОР ВЭНС', game: 'Vice City Stories', year: 2006, elo: 1180, img: 'gtatop/victor.jpg', color: PINK,
    tags: ['Солдат', 'Брат', 'Бизнесмен'], best: 'Построил империю в Вайс-Сити', blunder: 'Погиб в первой же катсцене следующей игры', joke: 'ПАРТИЯ: 1 ЗАСТАВКА'},
  {place: 9, name: 'ТОНИ СИПРИАНИ', game: 'Liberty City Stories', year: 2005, elo: 1340, img: 'gtatop/toni.jpg', color: '#7fb3ff',
    tags: ['Мафиози', 'Сын своей мамы'], best: 'Отбил Либерти-Сити у трёх семей', blunder: 'Всю игру не может угодить маме', joke: '−200 ЗА ЗВОНОК МАМЫ'},
  {place: 8, name: 'КЛОД', game: 'GTA III', year: 2001, elo: 1520, img: 'gtatop/claude.jpg', color: ORANGE,
    tags: ['Молчун', 'Угонщик'], best: 'Ни слова за всю игру', blunder: 'Каталина подстрелила его в первой же сцене', joke: 'СЛОВ ЗА ИГРУ: 0'},
  {place: 7, name: 'ДЖОННИ КЛЕБИЦ', game: 'The Lost and Damned', year: 2009, elo: 1610, img: 'gtatop/johnny.jpg', color: '#e07a5f',
    tags: ['Байкер', 'Лидер', 'Человек чести'], best: 'Удержал клуб, когда всё рушилось', blunder: 'Встретил Тревора', joke: 'БЕЗ КОММЕНТАРИЕВ'},
  {place: 6, name: 'МАЙКЛ ДЕ САНТА', game: 'GTA V', year: 2013, elo: 2080, img: 'gtatop/michael.jpg', color: '#8fd3ff',
    tags: ['Грабитель', 'Отец', 'Пенсионер'], best: 'Инсценировал смерть ради пенсии', blunder: 'Снёс балкон дома наркобарона', joke: 'ПЕНСИЯ ОКОНЧЕНА'},
  {place: 5, name: 'ФРАНКЛИН КЛИНТОН', game: 'GTA V', year: 2013, elo: 2190, img: 'gtatop/franklin.jpg', color: '#7be0b0',
    tags: ['Угонщик', 'Бизнесмен'], best: 'Из угонщика — в дом на холмах', blunder: 'Лучший друг — Ламар', joke: 'ВРАГИ НЕ НУЖНЫ'},
  {place: 4, name: 'ТРЕВОР ФИЛИПС', game: 'GTA V', year: 2013, elo: 2310, img: 'gtatop/trevor.jpg', color: '#c3e36b',
    tags: ['Пилот', 'Псих', 'Бизнесмен'], best: 'Первым ходом снёс банду байкеров', blunder: 'Нет. Тревор не признаёт ошибок', joke: 'ЗЕВКОВ: 0 (ОФИЦИАЛЬНО)'},
  {place: 3, name: 'НИКО БЕЛЛИК', game: 'GTA IV', year: 2008, elo: 2440, img: 'gtatop/niko.jpg', color: '#9fb6d6',
    tags: ['Ветеран', 'Кузен Романа'], best: 'Приехал за мечтой, нашёл месть', blunder: 'Не смог отказать Роману в боулинге', joke: 'ПОЙДЁМ В БОУЛИНГ?'},
  {place: 2, name: 'ТОММИ ВЕРСЕТТИ', game: 'Vice City', year: 2002, elo: 2560, img: 'gtatop/tommy.jpg', color: PINK,
    tags: ['Гангстер', 'Хозяин Вайс-Сити'], best: 'Из тюрьмы — в хозяина Вайс-Сити', blunder: 'Доверял Лэнсу Вэнсу', joke: 'ЛЭНС = БРАТ №10'},
  {place: 1, name: 'СИ-ДЖЕЙ', game: 'San Andreas', year: 2004, elo: 2720, img: 'gtatop/cj.jpg', color: '#74d680',
    tags: ['Гроув-стрит', 'Семья'], best: 'Приехал на похороны, забрал штат', blunder: 'Не успел за поездом', joke: 'ЕХАТЬ ЗА ПОЕЗДОМ!'},
];

// timings of each hero, in HEROES order (10 → 1), from audio/make_gtatop_audio.py
type HeroCue = {say: number; cardIn: number; name: number; game: number; tags: number[]; eloStart: number; eloEnd: number; best: number; blunder: number; joke: number; toTable: number};
const HC: HeroCue[] = CUES.heroes;
const F = CUES.finale;

const medal = (p: number) => (p === 1 ? GOLD : p === 2 ? SILVER : p === 3 ? BRONZE : `linear-gradient(135deg, ${VIOLET}, #5b4bb8)`);
const gradText = (bg: string): React.CSSProperties => ({background: bg, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'});

// ---------------------------------------------------------------- background: dusk sky, a soft sun, a faint chess floor

const Sky: React.FC<{v: number}> = ({v}) => (
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #24164a 0%, #3a1d5c 38%, #5a2b62 62%, #1d2c4a 100%)'}}>
    <div style={{position: 'absolute', left: 540 - 520, top: 330 - 520 + Math.sin(v * 0.4) * 10, width: 1040, height: 1040, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,179,107,0.42) 0%, rgba(255,126,179,0.18) 38%, rgba(255,126,179,0) 70%)'}} />
    {/* faint perspective chess floor at the bottom */}
    <div style={{position: 'absolute', left: -400, right: -400, bottom: -40, height: 640, transform: 'perspective(700px) rotateX(62deg)', transformOrigin: '50% 100%', opacity: 0.18,
      backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%), linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%)',
      backgroundSize: '160px 160px', backgroundPosition: `0 ${v * 18}px, 80px ${80 + v * 18}px`}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(20,12,40,0) 60%, rgba(20,12,40,0.75) 100%)'}} />
  </AbsoluteFill>
);

const Header: React.FC = () => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 92, display: 'flex', justifyContent: 'center'}}>
    <div style={{padding: '10px 30px', borderRadius: 40, background: 'rgba(255,244,230,0.1)', border: '2px solid rgba(255,244,230,0.22)',
      fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: '0.14em', color: CREAM}}>
      ♚ РЕЙТИНГ ФИДЕ · ГЕРОИ GTA
    </div>
  </div>
);

// ---------------------------------------------------------------- one leaderboard row (used by the intro and the table)

const Row: React.FC<{p: number; hero?: Hero; k?: number; glow?: number; shimmer?: number; h?: number}> = ({p, hero, k = 1, glow = 0, shimmer = 0, h = 104}) => {
  const top = p <= 3;
  const accent = hero ? hero.color : top ? '#f2c25c' : 'rgba(255,244,230,0.25)';
  const bar = hero ? (hero.elo - ELO_MIN) / (ELO_MAX - ELO_MIN) : 0;
  return (
    <div style={{height: h, marginBottom: 12, borderRadius: h / 2, display: 'flex', alignItems: 'center', padding: '0 26px 0 12px', gap: 20, position: 'relative', overflow: 'hidden',
      background: hero ? 'rgba(255,244,230,0.94)' : p === 1 ? 'rgba(242,194,92,0.18)' : 'rgba(255,244,230,0.08)',
      border: `3px solid ${hero ? accent : p === 1 ? `rgba(242,194,92,${0.6 + glow * 0.4})` : 'rgba(255,244,230,0.16)'}`,
      boxShadow: p === 1 ? `0 0 ${18 + glow * 30}px rgba(242,194,92,${0.25 + glow * 0.35})` : hero ? `0 0 30px ${accent}66` : 'none',
      transform: `translateX(${(1 - k) * 160}px)`, opacity: k}}>
      {/* moving light over the hidden rows */}
      {!hero ? <div style={{position: 'absolute', top: 0, bottom: 0, width: 220, left: -260 + shimmer * 1400, background: 'linear-gradient(90deg, transparent, rgba(255,244,230,0.12), transparent)'}} /> : null}
      <div style={{width: h - 24, height: h - 24, borderRadius: '50%', background: medal(p), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
        fontFamily: MONO, fontWeight: 600, fontSize: 40, color: p <= 3 ? INK : CREAM, boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.18)'}}>{p}</div>
      <div style={{width: h - 24, height: h - 24, borderRadius: '50%', overflow: 'hidden', flex: 'none', background: 'rgba(255,244,230,0.12)', border: `3px solid ${accent}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {hero ? <Img src={staticFile(hero.img)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 18%'}} />
          : <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: 'rgba(255,244,230,0.6)'}}>?</span>}
      </div>
      <div style={{flex: 1, minWidth: 0}}>
        {hero ? (
          <>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: INK, whiteSpace: 'nowrap'}}>{hero.name}</div>
            <div style={{height: 10, borderRadius: 5, background: 'rgba(29,21,48,0.12)', marginTop: 8, overflow: 'hidden'}}>
              <div style={{width: `${bar * 100}%`, height: '100%', background: `linear-gradient(90deg, ${TEAL}, ${accent})`}} />
            </div>
          </>
        ) : (
          <div style={{height: 22, borderRadius: 11, width: p === 1 ? '70%' : `${55 + ((p * 37) % 30)}%`, background: p === 1 ? 'rgba(242,194,92,0.45)' : 'rgba(255,244,230,0.16)'}} />
        )}
      </div>
      <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 42, color: hero ? INK : p === 1 ? '#f7d27a' : 'rgba(255,244,230,0.55)'}}>{hero ? hero.elo : p === 1 ? '???' : '????'}</span>
    </div>
  );
};

// ---------------------------------------------------------------- intro: title + the hidden leaderboard

const Intro: React.FC<{v: number}> = ({v}) => {
  const k = outBack(clamp01((v - E.title) / 0.45));
  const rowsIn = (i: number) => smooth(ramp(v, E.board + i * 0.07, E.board + i * 0.07 + 0.4));
  const stamp = outBack(clamp01((v - E.stamp) / 0.3));
  const out = smooth(ramp(v, HC[0].say - 0.1, HC[0].say + 0.35));
  const glow = 0.5 + 0.5 * Math.sin(v * 5);
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `scale(${1 + out * 0.12})`}}>
      <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', transform: `scale(${0.4 + 0.6 * k})`, opacity: clamp01(k * 2)}}>
        <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 150, lineHeight: 1, ...gradText(SUNSET), filter: 'drop-shadow(0 6px 18px rgba(255,126,179,0.35))'}}>ТОП-10</div>
        <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 100, lineHeight: 1.05, color: CREAM}}>ГЕРОЕВ GTA</div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 38, letterSpacing: '0.12em', color: TEAL, marginTop: 14}}>ПО ШАХМАТНОМУ РЕЙТИНГУ</div>
      </div>
      <div style={{position: 'absolute', top: 640, left: 70, right: 70}}>
        {Array.from({length: 10}, (_, i) => i + 1).map((p, i) => (
          <Row key={p} p={p} k={rowsIn(i)} h={84} glow={p === 1 ? glow : 0} shimmer={((v * 0.6 + i * 0.08) % 1.4)} />
        ))}
        <div style={{position: 'absolute', top: -36, right: -30, transform: `rotate(-8deg) scale(${stamp})`, opacity: clamp01(stamp * 3),
          border: `7px solid ${RED}`, borderRadius: 16, padding: '6px 24px', fontFamily: SANS, fontWeight: 800, fontSize: 56, color: RED, background: 'rgba(36,22,74,0.9)'}}>
          НЕ ТОММИ
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- confetti for the podium (deterministic)

const Confetti: React.FC<{at: number; v: number; n?: number}> = ({at, v, n = 70}) => {
  const t = v - at;
  if (t < 0 || t > 4) return null;
  const cols = ['#ffe08a', '#f2a93b', PINK, TEAL, CREAM, ORANGE];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: n}, (_, i) => {
        const r = (x: number) => ((Math.sin(i * 12.9898 + x * 78.233) * 43758.5453) % 1 + 1) % 1;
        const x0 = 540 + (r(1) - 0.5) * 300;
        const vx = (r(2) - 0.5) * 1500;
        const vy = -900 - r(3) * 900;
        const x = x0 + vx * t;
        const y = 700 + vy * t + 1100 * t * t;
        const rot = t * (300 + r(4) * 600);
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 18, height: 30, background: cols[i % cols.length], borderRadius: 4,
          transform: `rotate(${rot}deg) scaleX(${Math.cos(rot / 40)})`, opacity: clamp01((4 - t) / 1)}} />;
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- one hero

const Tag: React.FC<{text: string; at: number; v: number; color: string}> = ({text, at, v, color}) => {
  const k = outBack(clamp01((v - at) / 0.3));
  return (
    <span style={{display: 'inline-block', transform: `scale(${k})`, opacity: clamp01(k * 3), background: 'rgba(29,21,48,0.82)', color: CREAM, border: `3px solid ${color}`, borderRadius: 30,
      padding: '6px 24px', fontFamily: SANS, fontWeight: 700, fontSize: 36, whiteSpace: 'nowrap'}}>
      {text}
    </span>
  );
};

const MoveRow: React.FC<{glyph: string; color: string; label: string; text: string; at: number; v: number; top: number}> = ({glyph, color, label, text, at, v, top}) => {
  const k = smooth(ramp(v, at, at + 0.35));
  return (
    <div style={{position: 'absolute', top, left: 50, right: 50, background: 'rgba(255,244,230,0.95)', borderRadius: 24, padding: '16px 26px 18px 40px', overflow: 'hidden',
      transform: `translateX(${(1 - k) * -60}px)`, opacity: k, boxShadow: `0 10px 30px rgba(0,0,0,0.3), 0 0 0 3px ${color}`}}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 14, background: color}} />
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        <span style={{width: 52, height: 52, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 30}}>{glyph}</span>
        <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: '0.08em', color: INK, opacity: 0.75}}>{label}</span>
      </div>
      <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: text.length > 32 ? 44 : 50, lineHeight: 1.12, color: INK, marginTop: 8}}>{text}</div>
    </div>
  );
};

// where this rating sits between an amateur and a grandmaster
const EloScale: React.FC<{h: Hero; c: HeroCue; k: number; v: number}> = ({h, c, k, v}) => {
  const x = ((h.elo - ELO_MIN) / (ELO_MAX - ELO_MIN)) * k;
  return (
    <div style={{position: 'absolute', top: 1124, left: 70, right: 70, opacity: ramp(v, c.eloStart - 0.2, c.eloStart + 0.2)}}>
      <div style={{height: 20, borderRadius: 10, background: `linear-gradient(90deg, ${TEAL}, ${VIOLET}, ${PINK}, ${ORANGE})`, opacity: 0.9, position: 'relative'}}>
        <div style={{position: 'absolute', top: -14, left: `calc(${x * 100}% - 24px)`, width: 48, height: 48, borderRadius: '50%', background: CREAM, border: `6px solid ${h.color}`, boxShadow: '0 4px 12px rgba(0,0,0,0.4)'}} />
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 16, fontFamily: SANS, fontWeight: 700, fontSize: 34, color: 'rgba(255,244,230,0.8)'}}>
        <span>Любитель</span>
        <span>Гроссмейстер</span>
      </div>
    </div>
  );
};

const HeroCard: React.FC<{h: Hero; c: HeroCue; v: number}> = ({h, c, v}) => {
  const inK = smooth(ramp(v, c.cardIn, c.cardIn + 0.45));
  const placeK = outBack(clamp01((v - c.cardIn) / 0.4));
  const toTable = smooth(ramp(v, c.toTable, c.toTable + 0.6));
  const eloK = smooth(ramp(v, c.eloStart, c.eloEnd));
  const elo = Math.round(h.elo * eloK);
  const nameK = ramp(v, c.name, c.name + 0.5);
  const zoom = 1 + 0.06 * ramp(v, c.cardIn, c.toTable);
  const joke = outBack(clamp01((v - c.joke) / 0.3));
  const nameSize = Math.min(78, Math.floor((h.place === 10 ? 600 : 660) / (h.name.length * 0.72)));
  const jokeSize = Math.min(60, Math.floor(700 / (h.joke.length * 0.62)));
  return (
    <AbsoluteFill style={{opacity: inK * (1 - toTable)}}>
      {/* the hero's own art, blurred, colours the whole screen */}
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Img src={staticFile(h.img)} style={{position: 'absolute', inset: -120, width: 'calc(100% + 240px)', height: 'calc(100% + 240px)', objectFit: 'cover', filter: 'blur(46px) saturate(1.2)', opacity: 0.55, transform: `scale(${zoom})`}} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(36,22,74,0.55), rgba(36,22,74,0.2) 40%, rgba(29,21,48,0.75))'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `translateY(${(1 - inK) * 120 + toTable * -60}px) scale(${1 - toTable * 0.1})`}}>
        {/* place + name */}
        <div style={{position: 'absolute', top: 186, left: 50, right: 50, display: 'flex', alignItems: 'center', gap: 26}}>
          <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 160, lineHeight: 1, ...gradText(h.place === 1 ? GOLD : SUNSET), transform: `scale(${placeK})`, transformOrigin: 'left center'}}>#{h.place}</div>
          <div style={{flex: 1, minWidth: 0}}>
            <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: nameSize, lineHeight: 1, color: CREAM, whiteSpace: 'nowrap', clipPath: `inset(0 ${(1 - nameK) * 100}% 0 0)`}}>{h.name}</div>
            <div style={{display: 'inline-block', marginTop: 14, padding: '4px 18px', borderRadius: 20, background: h.color, color: INK, fontFamily: SANS, fontWeight: 700, fontSize: 34, opacity: ramp(v, c.game, c.game + 0.4)}}>
              {h.game} · {h.year}
            </div>
          </div>
        </div>
        {/* portrait with a sunset frame */}
        <div style={{position: 'absolute', top: 400, left: 120, width: 840, height: 680, borderRadius: 34, padding: 8,
          background: h.place === 1 ? GOLD : `linear-gradient(135deg, ${h.color}, ${ORANGE}, ${TEAL})`, boxShadow: h.place === 1 ? '0 0 60px rgba(242,194,92,0.6)' : '0 24px 60px rgba(0,0,0,0.45)'}}>
          <div style={{width: '100%', height: '100%', borderRadius: 28, overflow: 'hidden', position: 'relative', background: '#000'}}>
            <Img src={staticFile(h.img)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 20%', transform: `scale(${zoom})`}} />
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 22, display: 'flex', justifyContent: 'center', gap: 16}}>
              {h.tags.map((tg, i) => <Tag key={tg} text={tg} at={c.tags[i]} v={v} color={h.color} />)}
            </div>
            <div style={{position: 'absolute', top: 350, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
              <div style={{transform: `rotate(-10deg) scale(${joke})`, opacity: clamp01(joke * 3), border: `8px solid ${RED}`, borderRadius: 16, padding: '8px 26px',
                fontFamily: SANS, fontWeight: 800, fontSize: jokeSize, color: RED, background: 'rgba(255,244,230,0.92)', whiteSpace: 'nowrap'}}>{h.joke}</div>
            </div>
          </div>
        </div>
        {/* ELO badge over the portrait corner */}
        <div style={{position: 'absolute', top: 350, right: 70, background: INK, border: '5px solid #f2c25c', borderRadius: 22, padding: '10px 26px', textAlign: 'center',
          boxShadow: '0 0 30px rgba(242,194,92,0.35)', opacity: ramp(v, c.eloStart - 0.2, c.eloStart + 0.1)}}>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: '0.14em', color: '#f7d27a'}}>РЕЙТИНГ</div>
          <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 84, lineHeight: 1, color: CREAM}}>{elo}</div>
        </div>
        <EloScale h={h} c={c} k={eloK} v={v} />
        <MoveRow glyph="‼" color={TEAL} label="ЛУЧШИЙ ХОД" text={h.best} at={c.best} v={v} top={1240} />
        <MoveRow glyph="??" color={RED} label="ЗЕВОК" text={h.blunder} at={c.blunder} v={v} top={1414} />
      </AbsoluteFill>
      {h.place <= 3 ? <Confetti at={c.cardIn + 0.2} v={v} n={h.place === 1 ? 90 : 40} /> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- the table between heroes and in the finale

// a generic person silhouette for the GTA VI players (no official art)
const Silhouette: React.FC<{color: string; size: number}> = ({color, size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <rect width="100" height="100" fill="rgba(255,244,230,0.08)" />
    <circle cx="50" cy="38" r="18" fill={color} />
    <path d="M14 100 C 16 70, 34 60, 50 60 C 66 60, 84 70, 86 100 Z" fill={color} />
  </svg>
);

const NewPlayer: React.FC<{name: string; color: string; k: number}> = ({name, color, k}) => (
  <div style={{height: 104, marginBottom: 14, borderRadius: 52, display: 'flex', alignItems: 'center', padding: '0 30px 0 12px', gap: 20,
    background: 'rgba(29,21,48,0.85)', border: `3px dashed ${color}`, boxShadow: `0 0 28px ${color}55`,
    transform: `translateX(${(1 - k) * 200}px)`, opacity: k}}>
    <div style={{width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${color}`, flex: 'none'}}><Silhouette color={color} size={80} /></div>
    <div style={{flex: 1, fontFamily: SANS, fontWeight: 800, fontSize: 44, color: CREAM}}>{name}</div>
    <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 46, color}}>???</span>
  </div>
);

const Table: React.FC<{v: number; i: number}> = ({v, i}) => {
  const c = HC[i];
  const next = HC[i + 1];
  const last = i === HC.length - 1;
  const k = smooth(ramp(v, c.toTable + 0.2, c.toTable + 0.8));
  const out = next ? smooth(ramp(v, next.cardIn, next.cardIn + 0.4)) : 0;
  const pop = outBack(clamp01((v - c.toTable - 0.5) / 0.35));
  const nextOn = next ? smooth(ramp(v, next.say - 0.3, next.say)) : 0;
  const pulse = 0.5 + 0.5 * Math.sin(v * 7);
  // finale: the top-10 shrinks up, the GTA VI players slide in below
  const fin = last ? smooth(ramp(v, F.start, F.start + 0.8)) : 0;
  const scale = 1 - 0.26 * fin;
  return (
    <AbsoluteFill style={{opacity: k * (1 - out)}}>
      <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 72, ...gradText(SUNSET), opacity: 1 - fin}}>ТАБЛИЦА ЛИДЕРОВ</div>
      <div style={{position: 'absolute', top: 330 - 160 * fin, left: 60, right: 60, transform: `scale(${scale})`, transformOrigin: '50% 0'}}>
        {Array.from({length: 10}, (_, j) => j + 1).map((p, j) => {
          const hi = HEROES.findIndex((x) => x.place === p);
          const shown = hi >= 0 && hi <= i;
          const isNew = hi === i;
          const isNext = next && hi === i + 1;
          return (
            <div key={p} style={{position: 'relative', transform: isNew ? `scale(${0.6 + 0.4 * pop})` : isNext ? `scale(${1 + 0.04 * nextOn})` : 'none'}}>
              <Row p={p} hero={shown ? HEROES[hi] : undefined} h={110} shimmer={((v * 0.6 + j * 0.08) % 1.4)} glow={p === 1 ? pulse : 0} />
              {isNext && nextOn > 0 ? (
                <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 110, borderRadius: 55, border: `5px solid ${HEROES[hi].color}`, opacity: nextOn * (0.55 + 0.45 * pulse),
                  boxShadow: `0 0 ${20 + 30 * pulse}px ${HEROES[hi].color}`}} />
              ) : null}
            </div>
          );
        })}
      </div>
      {last ? (
        <>
          <div style={{position: 'absolute', top: 1110, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 38, letterSpacing: '0.14em', color: TEAL,
            opacity: smooth(ramp(v, F.two - 0.2, F.two + 0.3))}}>НОВЫЕ ИГРОКИ · GTA VI</div>
          <div style={{position: 'absolute', top: 1174, left: 90, right: 90}}>
            <NewPlayer name="ДЖЕЙСОН" color={TEAL} k={smooth(ramp(v, F.jason - 0.1, F.jason + 0.35))} />
            <NewPlayer name="ЛЮСИЯ" color={PINK} k={smooth(ramp(v, F.lucia - 0.1, F.lucia + 0.35))} />
          </div>
          <div style={{position: 'absolute', top: 1430, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
            <div style={{padding: '12px 34px', borderRadius: 26, background: GOLD, fontFamily: SANS, fontWeight: 800, fontSize: 46, color: INK,
              transform: `scale(${outBack(clamp01((v - F.date) / 0.35))})`, boxShadow: '0 0 40px rgba(242,194,92,0.5)'}}>ПЕРВАЯ ПАРТИЯ: 19 НОЯБРЯ</div>
          </div>
          <div style={{position: 'absolute', top: 1580, left: 60, right: 60, textAlign: 'center', transform: `scale(${outBack(clamp01((v - F.cta) / 0.4))})`}}>
            <div style={{display: 'inline-block', padding: '18px 34px', borderRadius: 30, background: 'rgba(255,244,230,0.95)', boxShadow: `0 0 0 5px ${PINK}, 0 14px 40px rgba(0,0,0,0.4)`}}>
              <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 64, lineHeight: 1.05, color: INK}}>Кто должен быть первым?</div>
              <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 44, color: PINK, marginTop: 6}}>Пиши в комменты ↓</div>
            </div>
          </div>
        </>
      ) : null}
      {last ? <Confetti at={c.toTable + 0.5} v={v} n={60} /> : null}
    </AbsoluteFill>
  );
};

const Subs: React.FC<{v: number}> = ({v}) => {
  const s = CUES.subs.find((x) => v >= x.s && v < x.e);
  if (!s || v >= F.cta) return null;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1704, display: 'flex', justifyContent: 'center'}}>
      <div style={{padding: '10px 26px', borderRadius: 22, background: 'rgba(20,12,40,0.6)', textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 46, lineHeight: 1.2, color: '#fff'}}>
        {s.text}
      </div>
    </div>
  );
};

export const GtaTop: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const v = frame / 30;
  if (frame === 0) return <GtaTopCover />;
  const tables: number[] = [];
  HC.forEach((c, i) => {
    const next = HC[i + 1];
    if (v >= c.toTable && (!next || v < next.cardIn + 0.45)) tables.push(i);
  });
  return (
    <AbsoluteFill>
      <Sky v={v} />
      {v < HC[0].say + 0.4 ? <Intro v={v} /> : null}
      {tables.map((i) => <Table key={`t${i}`} v={v} i={i} />)}
      {HEROES.map((h, i) => (v >= HC[i].cardIn - 0.05 && v < HC[i].toTable + 0.7 ? <HeroCard key={h.place} h={h} c={HC[i]} v={v} /> : null))}
      <Header />
      <Subs v={v} />
      {withAudio ? <Audio src={staticFile('audio/gtatop.wav')} /> : null}
    </AbsoluteFill>
  );
};

// the cover (frame 0): the title over the hidden table, «#1 ???»
export const GtaTopCover: React.FC = () => (
  <AbsoluteFill>
    <Sky v={0} />
    <Header />
    <Intro v={E.board + 1.4} />
  </AbsoluteFill>
);
