import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import '../chess/fonts';
import {Board, CREAM, INK, MONO, SANS, SERIF} from '../chess/Chess';
import {clamp01, outBack, ramp, smooth} from '../chess/cues';
import CUES from './cues.json';

// «Топ-10 героев GTA по шахматному рейтингу» — a leaderboard in the «Шахматный разбор» look.
// Test piece: the intro and the 10th place. Frame 0 is the cover.
export const GTATOP_S = CUES.duration;
const E = CUES.ev;
const GOLD = '#e2b04a';
const RED = '#d9452f';
const TEAL = '#1fb5a8';

type Hero = {place: number; name: string; game: string; year: number; elo: number; img: string; tags: string[]; best: string; blunder: string; joke: string};
const HEROES: Hero[] = [
  {
    place: 10, name: 'ВИКТОР ВЭНС', game: 'Vice City Stories', year: 2006, elo: 1180, img: 'gtatop/victor.jpg',
    tags: ['Солдат', 'Брат', 'Бизнесмен'], best: 'Построил империю в Вайс-Сити', blunder: 'Погиб в первой же катсцене следующей игры', joke: 'ПАРТИЯ: 1 ЗАСТАВКА',
  },
];

const Header: React.FC<{v: number}> = ({v}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: '0.16em', color: 'rgba(241,234,215,0.72)', opacity: v}}>
    РЕЙТИНГ ФИДЕ · ГЕРОИ GTA
  </div>
);

// the 10 slots under the header: which place is on screen now
const Progress: React.FC<{current: number; v: number}> = ({current, v}) => (
  <div style={{position: 'absolute', top: 160, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14, opacity: v}}>
    {Array.from({length: 10}, (_, k) => 10 - k).map((p) => (
      <div key={p} style={{width: 72, height: 46, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 34,
        background: p === current ? GOLD : p > current ? 'rgba(241,234,215,0.85)' : 'rgba(241,234,215,0.12)', color: p >= current ? INK : 'rgba(241,234,215,0.5)'}}>
        {p}
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------- intro: title + the hidden leaderboard

const Intro: React.FC<{v: number}> = ({v}) => {
  const k = outBack(clamp01((v - E.title) / 0.45));
  const rowsIn = (i: number) => smooth(ramp(v, E.board + i * 0.06, E.board + i * 0.06 + 0.35));
  const stamp = outBack(clamp01((v - E.stamp) / 0.3));
  const out = smooth(ramp(v, E.place - 0.1, E.place + 0.35));
  const pick10 = ramp(v, E.place - 0.3, E.place);
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `scale(${1 + out * 0.15})`}}>
      <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center', transform: `scale(${0.4 + 0.6 * k})`, opacity: clamp01(k * 2)}}>
        <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 132, lineHeight: 1, color: CREAM}}>ТОП-10</div>
        <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 104, lineHeight: 1.05, color: GOLD}}>ГЕРОЕВ GTA</div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 40, letterSpacing: '0.12em', color: 'rgba(241,234,215,0.8)', marginTop: 18}}>ПО ШАХМАТНОМУ РЕЙТИНГУ</div>
      </div>
      <div style={{position: 'absolute', top: 640, left: 90, right: 90}}>
        {Array.from({length: 10}, (_, i) => i + 1).map((p, i) => {
          const r = rowsIn(i);
          const first = p === 1;
          const hot = p === 10 ? pick10 : 0;
          return (
            <div key={p} style={{height: 82, marginBottom: 10, borderRadius: 16, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 26,
              background: first ? 'rgba(226,176,74,0.95)' : `rgba(241,234,215,${0.1 + hot * 0.85})`, border: first ? 'none' : '2px solid rgba(241,234,215,0.18)',
              transform: `translateX(${(1 - r) * 140}px)`, opacity: r}}>
              <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 46, width: 80, color: first || hot > 0.5 ? INK : CREAM}}>#{p}</span>
              <span style={{flex: 1, height: 26, borderRadius: 13, background: first || hot > 0.5 ? 'rgba(30,26,20,0.25)' : 'rgba(241,234,215,0.2)'}} />
              <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 42, color: first || hot > 0.5 ? INK : 'rgba(241,234,215,0.7)'}}>{first ? '?' : '????'}</span>
            </div>
          );
        })}
        {/* «И нет, Томми не первый» */}
        <div style={{position: 'absolute', top: -34, right: -40, transform: `rotate(-8deg) scale(${stamp})`, opacity: clamp01(stamp * 3),
          border: `7px solid ${RED}`, borderRadius: 14, padding: '6px 22px', fontFamily: SANS, fontWeight: 800, fontSize: 56, color: RED, background: 'rgba(20,26,18,0.85)'}}>
          НЕ ТОММИ
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- one hero

const Tag: React.FC<{text: string; at: number; v: number}> = ({text, at, v}) => {
  const k = outBack(clamp01((v - at) / 0.3));
  return (
    <span style={{display: 'inline-block', transform: `scale(${k})`, opacity: clamp01(k * 3), background: 'rgba(241,234,215,0.92)', color: INK, borderRadius: 30, padding: '8px 26px',
      fontFamily: SANS, fontWeight: 700, fontSize: 38}}>
      {text}
    </span>
  );
};

const MoveRow: React.FC<{glyph: string; color: string; label: string; text: string; at: number; v: number; top: number}> = ({glyph, color, label, text, at, v, top}) => {
  const k = smooth(ramp(v, at, at + 0.35));
  return (
    <div style={{position: 'absolute', top, left: 50, right: 50, background: CREAM, borderRadius: 18, borderLeft: `14px solid ${color}`, padding: '16px 26px 18px',
      transform: `translateY(${(1 - k) * 40}px)`, opacity: k, boxShadow: '0 10px 30px rgba(0,0,0,0.35)'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        <span style={{width: 52, height: 52, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 30}}>{glyph}</span>
        <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: '0.08em', color}}>{label}</span>
      </div>
      <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 50, lineHeight: 1.12, color: INK, marginTop: 8}}>{text}</div>
    </div>
  );
};

const HeroCard: React.FC<{h: Hero; v: number}> = ({h, v}) => {
  const inK = smooth(ramp(v, E.place, E.card + 0.2));
  const placeK = outBack(clamp01((v - E.place) / 0.4));
  const toTable = smooth(ramp(v, E.toTable, E.toTable + 0.6));
  const eloK = smooth(ramp(v, E.eloStart, E.eloEnd));
  const elo = Math.round(h.elo * eloK);
  const nameK = ramp(v, E.name, E.name + 0.5);
  const zoom = 1 + 0.06 * ramp(v, E.place, E.toTable);
  const joke = outBack(clamp01((v - E.joke - 0.9) / 0.3));
  return (
    <AbsoluteFill style={{opacity: inK * (1 - toTable), transform: `translateY(${(1 - inK) * 120 + toTable * -60}px) scale(${1 - toTable * 0.1})`}}>
      {/* place + name */}
      <div style={{position: 'absolute', top: 236, left: 50, right: 50, display: 'flex', alignItems: 'center', gap: 28}}>
        <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 150, lineHeight: 1, color: GOLD, transform: `scale(${placeK})`, transformOrigin: 'left center'}}>#{h.place}</div>
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 76, lineHeight: 1, color: CREAM, whiteSpace: 'nowrap', clipPath: `inset(0 ${(1 - nameK) * 100}% 0 0)`}}>{h.name}</div>
          <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 38, color: 'rgba(241,234,215,0.75)', marginTop: 10, opacity: ramp(v, E.game, E.game + 0.4)}}>{h.game} · {h.year}</div>
        </div>
      </div>
      {/* portrait */}
      <div style={{position: 'absolute', top: 430, left: 140, width: 800, height: 700, borderRadius: 26, overflow: 'hidden', border: `8px solid ${CREAM}`, background: '#000', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}>
        <Img src={staticFile(h.img)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 20%', transform: `scale(${zoom})`}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 22, display: 'flex', justifyContent: 'center', gap: 16}}>
          {h.tags.map((tg, i) => <Tag key={tg} text={tg} at={E.tags[i]} v={v} />)}
        </div>
        {/* the joke stamp */}
        <div style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div style={{transform: `rotate(-10deg) scale(${joke})`, opacity: clamp01(joke * 3), border: `8px solid ${RED}`, borderRadius: 14, padding: '8px 26px',
            fontFamily: SANS, fontWeight: 800, fontSize: 60, color: RED, background: 'rgba(241,234,215,0.9)', whiteSpace: 'nowrap'}}>{h.joke}</div>
        </div>
      </div>
      {/* ELO badge over the portrait corner */}
      <div style={{position: 'absolute', top: 386, right: 90, background: INK, border: `5px solid ${GOLD}`, borderRadius: 20, padding: '10px 26px', textAlign: 'center', opacity: ramp(v, E.eloStart - 0.2, E.eloStart + 0.1)}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: '0.14em', color: GOLD}}>РЕЙТИНГ</div>
        <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 84, lineHeight: 1, color: CREAM}}>{elo}</div>
      </div>
      <MoveRow glyph="‼" color={TEAL} label="ЛУЧШИЙ ХОД" text={h.best} at={E.best} v={v} top={1166} />
      <MoveRow glyph="??" color={RED} label="ЗЕВОК" text={h.blunder} at={E.blunder} v={v} top={1380} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- the table after a hero (fills up from the bottom)

const Table: React.FC<{v: number}> = ({v}) => {
  const k = smooth(ramp(v, E.toTable + 0.2, E.toTable + 0.8));
  return (
    <AbsoluteFill style={{opacity: k}}>
      <div style={{position: 'absolute', top: 260, left: 90, right: 90}}>
        {Array.from({length: 10}, (_, i) => i + 1).map((p) => {
          const h = HEROES.find((x) => x.place === p);
          const pop = h ? outBack(clamp01((v - E.toTable - 0.5) / 0.35)) : 1;
          return (
            <div key={p} style={{height: 112, marginBottom: 14, borderRadius: 18, display: 'flex', alignItems: 'center', padding: '0 22px', gap: 22,
              background: h ? CREAM : 'rgba(241,234,215,0.1)', border: h ? 'none' : '2px solid rgba(241,234,215,0.18)', transform: `scale(${h ? pop : 1})`}}>
              <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 46, width: 84, color: h ? INK : CREAM}}>#{p}</span>
              {h ? <Img src={staticFile(h.img)} style={{width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', objectPosition: '50% 15%'}} /> : null}
              <span style={{flex: 1, fontFamily: SANS, fontWeight: 800, fontSize: 40, color: h ? INK : 'rgba(241,234,215,0.35)'}}>{h ? h.name : '· · ·'}</span>
              <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 44, color: h ? INK : 'rgba(241,234,215,0.5)'}}>{h ? h.elo : '????'}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Subs: React.FC<{v: number}> = ({v}) => {
  const s = CUES.subs.find((x) => v >= x.s && v < x.e);
  if (!s) return null;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1620, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 48, lineHeight: 1.2, color: '#fff',
      textShadow: '0 3px 0 #000, 0 0 14px rgba(0,0,0,0.9)'}}>
      {s.text}
    </div>
  );
};

export const GtaTop: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const v = frame / 30;
  if (frame === 0) return <GtaTopCover />;
  const hero = HEROES[0];
  return (
    <AbsoluteFill style={{background: '#141a12'}}>
      <Board />
      <Header v={1} />
      {v < E.place + 0.4 ? <Intro v={v} /> : null}
      {v >= E.place - 0.05 ? <Progress current={hero.place} v={ramp(v, E.place, E.place + 0.3)} /> : null}
      {v >= E.place - 0.05 && v < E.toTable + 0.7 ? <HeroCard h={hero} v={v} /> : null}
      {v >= E.toTable ? <Table v={v} /> : null}
      <Subs v={v} />
      {withAudio ? <Audio src={staticFile('audio/gtatop.wav')} /> : null}
    </AbsoluteFill>
  );
};

// the cover (frame 0): the title over the hidden table, «#1 ?»
export const GtaTopCover: React.FC = () => (
  <AbsoluteFill style={{background: '#141a12'}}>
    <Board />
    <Header v={1} />
    <Intro v={E.board + 1.2} />
  </AbsoluteFill>
);
