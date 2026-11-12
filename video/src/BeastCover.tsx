import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {World} from './beast/World';
import {Question, ScoreBar} from './beast/Overlay';
import {ROUND} from './bear/Overlay';
import {HOOK_VIEW} from './beast/scenes';

// Cover = frame 0 of the video: both toys on equal coin hills, score 0:0, the question.
export const BeastCover: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(1.14) contrast(1.05)'}}>
        <ThreeCanvas width={width} height={height} flat shadows gl={{logarithmicDepthBuffer: true, antialias: true}} camera={{fov: 40, position: [0, 1.6, 2]}}>
          <World v={1.2} shot="hook" view={() => HOOK_VIEW(1.2)} />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 55%, rgba(20,10,40,0.4) 100%)'}} />
      <ScoreBar v={0} />
      <Question v={0} still />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1330, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: '#2a1f3a', color: '#fff', borderRadius: 24, padding: '10px 30px 14px', fontFamily: ROUND, fontWeight: 800, fontSize: 60, transform: 'rotate(1.5deg)', boxShadow: '0 10px 0 rgba(10,5,20,0.45), 0 18px 40px rgba(0,0,0,0.4)'}}>
          <span style={{color: '#5ee89a'}}>Габен</span> vs <span style={{color: '#7ab8ff'}}>Мистер Бист</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1460, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: '#ffd23f', color: '#2a1f3a', borderRadius: 18, padding: '6px 24px 10px', fontFamily: ROUND, fontWeight: 800, fontSize: 44, transform: 'rotate(-2deg)'}}>только настоящие цифры</div>
      </div>
    </AbsoluteFill>
  );
};
