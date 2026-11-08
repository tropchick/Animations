import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CoverScene} from './bear/cover';
import {ROUND} from './bear/Overlay';

// Cover = frame 0 of the video: the bear up on his hind legs behind the girl with the selfie stick, and the title.
export const BearCover: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(1.12) contrast(1.05)'}}>
        <ThreeCanvas width={width} height={height} flat shadows gl={{logarithmicDepthBuffer: true, antialias: true}} camera={{fov: 60, position: [0, 1.6, 2]}}>
          <CoverScene />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(40,20,0,0.4) 100%)'}} />
      <div style={{position: 'absolute', left: 60, right: 60, top: 240, textAlign: 'center'}}>
        <div
          style={{
            display: 'inline-block',
            background: '#fff7e8',
            color: '#3b2412',
            borderRadius: 36,
            padding: '18px 34px 24px',
            fontFamily: ROUND,
            fontWeight: 800,
            fontSize: 76,
            lineHeight: 1.1,
            transform: 'rotate(-2deg)',
            boxShadow: '0 12px 0 rgba(70,36,10,0.45), 0 22px 44px rgba(0,0,0,0.35)',
          }}
        >
          Что если она
          <br />
          реально выбрала
          <br />
          <span style={{color: '#d8531c'}}>медведя?</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
