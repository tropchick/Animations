import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {World} from './cs2/World';
import {ROUND} from './bear/Overlay';
import {BAN} from './cs2/cues';

// Cover = frame 0 of the video: the club, every screen red «ВЫ ЗАБАНЕНЫ», the shield with its beam over the rows; the title.
const AT = BAN[0] + 2.0;
export const Cs2Cover: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(1.12) contrast(1.05)'}}>
        <ThreeCanvas width={width} height={height} flat shadows gl={{logarithmicDepthBuffer: true, antialias: true}} camera={{fov: 40, position: [0, 1.6, 2]}}>
          <World v={AT} shot="club" view={() => ({pos: [0.3, 2.05, 3.9], target: [0.3, 1.95, -1.6], fov: 55, far: 200})} />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(20,10,40,0.4) 100%)'}} />
      <div style={{position: 'absolute', left: 60, right: 60, top: 205, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: '#fff7e8', color: '#2a1f3a', borderRadius: 36, padding: '18px 34px 24px', fontFamily: ROUND, fontWeight: 800, fontSize: 80, lineHeight: 1.1, transform: 'rotate(-2deg)', boxShadow: '0 12px 0 rgba(40,20,60,0.45), 0 22px 44px rgba(0,0,0,0.35)'}}>
          Что если в CS2
          <br />
          добавят <span style={{color: '#e8453c'}}>античит?</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1390, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: '#e8453c', color: '#fff', borderRadius: 24, padding: '8px 30px 12px', fontFamily: ROUND, fontWeight: 800, fontSize: 64, transform: 'rotate(2deg)', boxShadow: '0 10px 0 rgba(90,10,10,0.45), 0 18px 40px rgba(0,0,0,0.4)'}}>
          ЗАБАНЕНЫ ВСЕ
        </div>
      </div>
    </AbsoluteFill>
  );
};
