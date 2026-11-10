import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {World} from './hl3gta/World';
import {Question, ScoreBar} from './hl3gta/Overlay';
import {ROUND} from './bear/Overlay';
import {LIGHTS} from './hl3gta/cues';
import {HOOK_VIEW} from './hl3gta/scenes';

// Cover = frame 0 of the video: both boxes on the start line under a red light, score 0:0, the question.
const AT = LIGHTS[0] + 0.3;
export const Hl3GtaCover: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(1.14) contrast(1.05)'}}>
        <ThreeCanvas width={width} height={height} flat shadows gl={{logarithmicDepthBuffer: true, antialias: true}} camera={{fov: 40, position: [0, 1.6, 2]}}>
          <World v={AT} shot="hook" view={() => HOOK_VIEW(0)} />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 55%, rgba(20,10,40,0.4) 100%)'}} />
      <ScoreBar v={0} />
      <Question v={0} still />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1330, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: '#2a1f3a', color: '#fff', borderRadius: 24, padding: '10px 30px 14px', fontFamily: ROUND, fontWeight: 800, fontSize: 60, transform: 'rotate(1.5deg)', boxShadow: '0 10px 0 rgba(10,5,20,0.45), 0 18px 40px rgba(0,0,0,0.4)'}}>
          <span style={{color: '#ff9a3a'}}>Half-Life 3</span> vs <span style={{color: '#e080ff'}}>GTA 7</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
