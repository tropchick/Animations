import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Board, CREAM, EvalBar, FOOT, Frame, Glyph, SANS, SERIF, Scoreboard} from './slobody/Chess';
import './slobody/fonts';

// Frame 0 of SlobodyChess and the TikTok cover: her face at «Безнал есть?», the title and the final verdict.
export const SlobodyCover: React.FC = () => (
  <AbsoluteFill>
    <Board />
    <Scoreboard v={0} />
    <Frame>
      <Img src={staticFile('slobody/cover.jpg')} style={{width: FOOT.w, height: FOOT.h, objectFit: 'cover'}} />
    </Frame>
    <EvalBar v={0} p={0} />
    <div style={{position: 'absolute', left: FOOT.x + FOOT.w - 260, top: FOOT.y + 30, filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.6))'}}>
      <Glyph g="mate" size={230} />
    </div>
    <div style={{position: 'absolute', left: 40, width: 1000, top: 372, textAlign: 'center'}}>
      <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 108, lineHeight: 1.0, color: '#fff', textShadow: '0 8px 30px rgba(0,0,0,0.7)'}}>
        До Слободы
        <br />
        доеду?
      </div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 44, color: CREAM, marginTop: 20}}>Разбор партии: 19 ходов до мата</div>
    </div>
  </AbsoluteFill>
);
