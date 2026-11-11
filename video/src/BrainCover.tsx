import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {World} from './brain/World';
import {ROUND} from './bear/Overlay';
import {shotStart} from './brain/cues';

// Cover = frame 0 of the video: grown-ups squeezed behind tiny school desks, a kid in a suit teaching them; the title.
const AT = shotStart('desks') + 1.6;
export const BrainCover: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(1.12) contrast(1.05)'}}>
        <ThreeCanvas width={width} height={height} flat shadows gl={{logarithmicDepthBuffer: true, antialias: true}} camera={{fov: 40, position: [0, 1.6, 2]}}>
          <World v={AT} shot="desks" view={() => ({pos: [0.75, 1.55, 3.1], target: [0.15, 1.0, -0.6], fov: 50, far: 200})} />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(20,10,40,0.4) 100%)'}} />
      <div style={{position: 'absolute', left: 60, right: 60, top: 200, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: '#fff7e8', color: '#2a1f3a', borderRadius: 36, padding: '18px 34px 24px', fontFamily: ROUND, fontWeight: 800, fontSize: 78, lineHeight: 1.1, transform: 'rotate(-2deg)', boxShadow: '0 12px 0 rgba(40,20,60,0.45), 0 22px 44px rgba(0,0,0,0.35)'}}>
          Что если бы
          <br />
          <span style={{color: '#e8453c'}}>брейнротов</span>
          <br />
          никогда не существовало?
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1400, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: '#2fae5a', color: '#fff', borderRadius: 24, padding: '8px 30px 12px', fontFamily: ROUND, fontWeight: 800, fontSize: 62, transform: 'rotate(2deg)', boxShadow: '0 10px 0 rgba(10,60,30,0.45), 0 18px 40px rgba(0,0,0,0.4)'}}>
          ВЗРОСЛЫЕ — В ШКОЛУ
        </div>
      </div>
    </AbsoluteFill>
  );
};
