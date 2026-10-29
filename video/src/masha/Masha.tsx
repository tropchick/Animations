import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {BadgePop, Board, CREAM, EvalBar, Frame, INK, MONO, MoveCard, SANS, Scoreboard, ShowContext} from '../chess/Chess';
import {ChessCover} from '../chess/Breakdown';
import {Grade, Move, numbered, ramp, smooth} from '../chess/cues';
import {MASHA} from './show';
import '../chess/fonts';

// The Bear is an independent third player. Keep this episode's rules outside the two-player template.
type ThreeMove = Move & {shares: [number, number, number]};
const moves = MASHA.MOVES as ThreeMove[];
const ENTRY = moves.find((m) => m.grade === 'piece')!.t;
const GOLD = '#d5ac52';
const PLAYERS = [
  {name: 'МАША', who: 'Маша', avatar: 'masha', piece: '♔', color: CREAM, ink: INK},
  {name: 'ПАНДА', who: 'Панда', avatar: 'panda', piece: '♚', color: '#393731', ink: CREAM},
  {name: 'МЕДВЕДЬ', who: 'Медведь', avatar: 'bear', piece: '♜', color: GOLD, ink: INK},
];
const portrait = (avatar: string, size: number) => (
  <Img src={staticFile(`masha/av-${avatar}.jpg`)} style={{width: size, height: size, objectFit: 'cover', borderRadius: '50%', border: '4px solid #8a7451', boxSizing: 'border-box', flex: 'none'}} />
);

const ThreeScoreboard: React.FC<{v: number}> = ({v}) => {
  if (v < ENTRY) return <Scoreboard v={v} />;
  const k = smooth(ramp(v, ENTRY, ENTRY + 0.5));
  const current = moves[MASHA.moveAt(v)];
  return <>
    <div style={{position: 'absolute', left: 40, right: 40, top: 112, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: '0.06em', color: 'rgba(241,234,215,0.72)'}}>ШАХМАТНЫЙ РАЗБОР · ТРИ ИГРОКА</div>
    <div style={{position: 'absolute', left: 40, right: 40, top: 160, height: 178, display: 'flex', border: '6px solid #6e4b2a', borderRadius: 26, overflow: 'hidden', boxShadow: '0 14px 40px #0008'}}>
      {PLAYERS.map((p, i) => {
        const n = moves.filter((m) => m.t <= v && m.who === p.who && numbered(m)).length;
        return <div key={p.who} style={{flex: 1, minWidth: 0, background: p.color, color: p.ink, display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px', opacity: i === 2 ? k : 1, transform: i === 2 ? `translateY(${(1-k)*80}px)` : undefined}}>
          {portrait(p.avatar, 88)}
          <div style={{fontFamily: SANS, minWidth: 0}}>
            <div style={{fontSize: 31, fontWeight: 800, whiteSpace: 'nowrap'}}>{p.name}</div>
            <div style={{fontSize: 28, fontWeight: 700, marginTop: 12, opacity: current.who === p.who ? 1 : 0.65}}>{p.piece} ХОДОВ: {n}</div>
          </div>
        </div>;
      })}
    </div>
  </>;
};

const sharesAt = (v: number) => {
  const i = MASHA.moveAt(v);
  if (i < 0) return [50, 50, 0];
  const from = i ? moves[i - 1].shares : [50, 50, 0];
  const k = smooth(ramp(v, moves[i].t, moves[i].t + 0.7));
  return moves[i].shares.map((p, j) => from[j] + (p - from[j]) * k);
};

const ThreeBar: React.FC<{v: number}> = ({v}) => {
  if (v < ENTRY) return <EvalBar v={v} />;
  const shares = sharesAt(v);
  const top = MASHA.FOOT.y + MASHA.FOOT.h + 24;
  return <>
    <div style={{position: 'absolute', left: 40, right: 40, top, height: 30, display: 'flex', overflow: 'hidden', borderRadius: 10, border: '3px solid #6e4b2a', boxSizing: 'border-box', boxShadow: '0 4px 14px #0008'}}>
      {PLAYERS.map((p, i) => <div key={p.who} style={{width: `${shares[i]}%`, background: p.color}} />)}
    </div>
    <div style={{position: 'absolute', left: 40, right: 40, top: top + 48, display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontSize: 28, fontWeight: 700, color: CREAM}}>
      {PLAYERS.map((p, i) => <span key={p.who} style={{color: i === 2 ? GOLD : CREAM}}>{p.piece} {p.name} {Math.round(shares[i])}%</span>)}
    </div>
  </>;
};

const Entry: React.FC<{v: number}> = ({v}) => {
  const age = v - ENTRY;
  if (age < 0 || age > 3.5) return null;
  const k = smooth(ramp(age, 0, 0.4)) * (1 - smooth(ramp(age, 3, 3.5)));
  return <div style={{position: 'absolute', left: 80, right: 80, top: 1380, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, padding: 24, borderRadius: 22, background: GOLD, color: INK, opacity: k, transform: `translateY(${(1-k)*35}px)`, boxShadow: '0 16px 40px #0008'}}>
    {portrait('bear', 100)}
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 38, lineHeight: 1.25}}>В ПАРТИЮ ВСТУПАЕТ<br />МЕДВЕДЬ ♜</div>
  </div>;
};

const Section: React.FC<{v: number; at: number; children: React.ReactNode}> = ({v, at, children}) => {
  const k = smooth(ramp(v, at, at + 0.4));
  return <div style={{opacity: k, transform: `translateY(${(1-k)*24}px)`}}>{children}</div>;
};
const GRADE_SCORE: Partial<Record<Grade, number>> = {brilliant: 100, great: 95, good: 85, interesting: 75, inaccuracy: 60, mistake: 40, mate: 100};
const playerMoves = (who: string) => moves.filter((m) => numbered(m) && m.who === who);

const ThreeResults: React.FC<{v: number}> = ({v}) => {
  if (v < MASHA.RESULTS) return null;
  const at = (i: number) => MASHA.RESULTS + 0.4 + i * 1.1;
  const graphMoves = moves.filter(numbered);
  const points = [[50, 50, 0], ...graphMoves.map((m) => m.shares)];
  const dim = smooth(ramp(v, MASHA.RESULTS, MASHA.RESULTS + 0.5));
  return <AbsoluteFill>
    <AbsoluteFill style={{background: `rgba(18,22,16,${dim})`}} />
    <div style={{position: 'absolute', top: 150, left: 40, right: 40, display: 'flex', flexDirection: 'column', gap: 24, fontFamily: SANS}}>
      <Section v={v} at={at(0)}>
        <div style={{textAlign: 'center', color: CREAM, fontSize: 36, letterSpacing: '0.18em', fontWeight: 700}}>ИТОГИ МАТЧА</div>
        <div style={{textAlign: 'center', color: GOLD, fontSize: 74, fontWeight: 800, marginTop: 8}}>МЕДВЕДЬ ПОБЕДИЛ</div>
        <div style={{textAlign: 'center', color: CREAM, fontSize: 36, fontWeight: 700, marginTop: 4}}>Мат на 14-м ходу</div>
        <div style={{display: 'flex', gap: 16, marginTop: 24}}>
          {PLAYERS.map((p, i) => <div key={p.who} style={{flex: 1, padding: 20, borderRadius: 18, background: p.color, color: p.ink, textAlign: 'center'}}>
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14}}>{portrait(p.avatar, 76)}<span style={{fontSize: 32, fontWeight: 800}}>{p.name}</span></div>
            <div style={{fontFamily: MONO, fontSize: 82, lineHeight: 1.1, fontWeight: 600, marginTop: 8}}>{i === 2 ? '1' : '0'}</div>
          </div>)}
        </div>
      </Section>
      <Section v={v} at={at(1)}>
        <div style={{color: CREAM, fontSize: 28, fontWeight: 700, marginBottom: 12}}>ПРЕИМУЩЕСТВО ПО ХОДУ ПАРТИИ</div>
        <svg width={1000} height={180} style={{display: 'block', background: '#23211e', borderRadius: 16}}>
          <defs><clipPath id="masha-graph"><rect width={1000*smooth(ramp(v, at(1), at(1)+1.2))} height={180}/></clipPath></defs>
          <line x1={0} y1={90} x2={1000} y2={90} stroke="#ffffff33" strokeDasharray="10 10" />
          <g clipPath="url(#masha-graph)">{PLAYERS.map((p,j) => <polyline key={p.who} points={points.map((s,i) => `${8+i/(points.length-1)*984},${172-s[j]/100*164}`).join(' ')} fill="none" stroke={j===1?'#95918a':p.color} strokeWidth={5} />)}</g>
        </svg>
        <div style={{display: 'flex', justifyContent: 'space-between', color: CREAM, fontSize: 26, fontWeight: 700, marginTop: 8}}><span>♔ Маша</span><span style={{color:'#aaa59c'}}>♚ Панда</span><span style={{color:GOLD}}>♜ Медведь</span></div>
      </Section>
      <Section v={v} at={at(2)}>
        <div style={{display: 'flex', gap: 16}}>{PLAYERS.map((p) => {
          const pm = playerMoves(p.who);
          const accuracy = Math.round(pm.reduce((n,m) => n + (GRADE_SCORE[m.grade] ?? 0), 0)/pm.length);
          return <div key={p.who} style={{flex:1, textAlign:'center', borderRadius:16, background:'#f1ead712', padding:'14px 4px', color:CREAM}}>
            <div style={{fontSize:26,fontWeight:600}}>Точность · {p.name}</div><div style={{fontFamily:MONO,fontSize:58,fontWeight:600,color:p.who==='Медведь'?GOLD:CREAM}}>{accuracy}%</div>
            <div style={{fontSize:26}}>{pm.length} {pm.length===1?'ход':'ходов'}</div>
          </div>;
        })}</div>
      </Section>
      <Section v={v} at={at(3)}>
        <div style={{background:CREAM, borderRadius:20, padding:'12px 24px', color:INK}}>{MASHA.cfg.awards!.map(([label,value],i) => <div key={label} style={{display:'flex',justifyContent:'space-between',gap:20,padding:'16px 0',borderTop:i?'2px solid #6e4b2a33':undefined}}>
          <span style={{fontSize:30,fontWeight:500,flex:'none'}}>{label}</span><span style={{fontSize:32,fontWeight:800,textAlign:'right'}}>{value}</span>
        </div>)}</div>
      </Section>
      <Section v={v} at={at(4)}><div style={{color:CREAM,textAlign:'center',fontSize:42,lineHeight:1.25,fontWeight:800}}>Маша и Панда спорили.<br />Медведь выиграл ремонт.</div></Section>
    </div>
  </AbsoluteFill>;
};

// Same composition props as ChessVideo, so only this episode selects the three-player renderer in Root.
export const MashaVideo: React.FC<{id: string; withAudio?: boolean}> = ({id, withAudio = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const v = frame / fps;
  return <ShowContext.Provider value={MASHA}>
    {frame === 0 ? <ChessCover id={id} /> : <AbsoluteFill>
      <Board />
      <ThreeScoreboard v={v} />
      <Frame><Sequence from={1}><OffthreadVideo src={staticFile('masha/scene.mp4')} muted style={{width: MASHA.FOOT.w, height: MASHA.FOOT.h, objectFit: 'cover'}} /></Sequence></Frame>
      <ThreeBar v={v} />
      <BadgePop v={v} />
      <MoveCard v={v} />
      <Entry v={v} />
      <ThreeResults v={v} />
    </AbsoluteFill>}
    {withAudio ? <Audio src={staticFile('audio/masha.wav')} /> : null}
  </ShowContext.Provider>;
};
