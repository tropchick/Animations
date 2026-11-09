import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {World} from './diet/World';
import {HlBar} from './diet/Overlay';
import {ROUND} from './bear/Overlay';
import {PLATE} from './diet/cues';

// Cover = frame 0 of the video: Gaben's mother on the scale, the donuts kicked away, one lettuce leaf; HL3 at 0%.
const AT = PLATE + 0.7;
export const DietCover: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(1.12) contrast(1.05)'}}>
        <ThreeCanvas width={width} height={height} flat shadows gl={{logarithmicDepthBuffer: true, antialias: true}} camera={{fov: 40, position: [0, 1.6, 2]}}>
          <World v={AT} shot="hook" view={() => ({pos: [0.45, 0.34, 1.5], target: [0.06, 0.32, 0.1], fov: 44, far: 200})} />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 55%, rgba(20,10,40,0.45) 100%)'}} />
      <HlBar v={0} cover />
      <div style={{position: 'absolute', left: 50, right: 50, top: 330, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: '#fff7e8', color: '#2a1f3a', borderRadius: 36, padding: '18px 34px 24px', fontFamily: ROUND, fontWeight: 800, fontSize: 88, lineHeight: 1.08, transform: 'rotate(-2deg)', boxShadow: '0 12px 0 rgba(40,20,60,0.45), 0 22px 44px rgba(0,0,0,0.35)'}}>
          <span style={{color: '#f0559a'}}>Мать Габена</span>
          <br />
          села на диету
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 600, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: '#e8453c', color: '#fff', borderRadius: 24, padding: '10px 34px 14px', fontFamily: ROUND, fontWeight: 800, fontSize: 64, transform: 'rotate(2deg)', boxShadow: '0 10px 0 rgba(10,5,20,0.45), 0 18px 40px rgba(0,0,0,0.4)'}}>7 ДНЕЙ</div>
      </div>
    </AbsoluteFill>
  );
};
