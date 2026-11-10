import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {World} from './gtamom/World';
import {ScoreBar} from './gtamom/Overlay';
import {ROUND} from './bear/Overlay';
import {LAND_MOM} from './gtamom/cues';

// Cover = frame 0 of the video: the game box and her slipper nose to nose, the same size, score 0:0; the question.
const AT = LAND_MOM + 1.0;
const Bolt: React.FC = () => (
  <svg width="150" height="220" viewBox="0 0 150 220" style={{position: 'absolute', left: 465, top: 930, filter: 'drop-shadow(0 8px 0 rgba(40,20,60,0.5))'}}>
    <path d="M95 0 L20 120 L68 120 L45 220 L135 85 L85 85 L115 0 Z" fill="#ffd23f" stroke="#2a1f3a" strokeWidth="8" strokeLinejoin="round" />
  </svg>
);
export const GtaMomCover: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(1.12) contrast(1.05)'}}>
        <ThreeCanvas width={width} height={height} flat shadows gl={{logarithmicDepthBuffer: true, antialias: true}} camera={{fov: 40, position: [0, 1.6, 2]}}>
          <World v={AT} shot="hook" view={() => ({pos: [0, 0.4, 2.55], target: [0, 0.5, 0], fov: 44, far: 200})} />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 55%, rgba(20,10,40,0.45) 100%)'}} />
      <ScoreBar v={0} />
      <Bolt />
      <div style={{position: 'absolute', left: 50, right: 50, top: 330, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: '#fff7e8', color: '#2a1f3a', borderRadius: 36, padding: '18px 34px 24px', fontFamily: ROUND, fontWeight: 800, fontSize: 92, lineHeight: 1.08, transform: 'rotate(-2deg)', boxShadow: '0 12px 0 rgba(40,20,60,0.45), 0 22px 44px rgba(0,0,0,0.35)'}}>
          Что весит
          <br />
          <span style={{color: '#e8453c'}}>больше?</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 610, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: '#2a1f3a', color: '#fff', borderRadius: 24, padding: '10px 30px 14px', fontFamily: ROUND, fontWeight: 800, fontSize: 56, transform: 'rotate(1.5deg)', boxShadow: '0 10px 0 rgba(10,5,20,0.45), 0 18px 40px rgba(0,0,0,0.4)'}}>
          <span style={{color: '#ff9a3a'}}>GTA 6</span> vs <span style={{color: '#f0559a'}}>мать Габена</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
