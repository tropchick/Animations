import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {COND, YELLOW} from './gta/Overlay';

// Cover / frame 0 of «Что если Half-Life 3 выйдет сегодня?»: the fan with a crowbar under the portal.
export const HlCover: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <Img src={staticFile('hl3/cover-bg.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.12) translateY(4%)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 38%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 210, textAlign: 'center', fontFamily: COND, fontWeight: 600, lineHeight: 1.0}}>
      <div style={{fontSize: 150, color: YELLOW, textShadow: '0 8px 30px rgba(0,0,0,0.8)', letterSpacing: 2}}>HALF-LIFE 3</div>
      <div style={{fontSize: 118, color: '#fff', textShadow: '0 8px 30px rgba(0,0,0,0.8)', marginTop: 10}}>ВЫШЛА СЕГОДНЯ</div>
    </div>
  </AbsoluteFill>
);
