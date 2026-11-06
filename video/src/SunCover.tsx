import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CoverScene} from './sun/World';
import {COND} from './gta/Overlay';

// Cover = frame 0 of the video: a frozen beach under black sky, the dead Sun, the hero in swim trunks with his ice cream.

export const SunCover: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(1.12) contrast(1.06)'}}>
        <ThreeCanvas width={width} height={height} flat gl={{logarithmicDepthBuffer: true}} camera={{fov: 40, position: [0, 1.6, 2]}}>
          <CoverScene />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)'}} />
      <div style={{position: 'absolute', left: 60, right: 60, top: 230, textAlign: 'center'}}>
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(16,12,20,0.84)',
            borderRadius: 24,
            padding: '12px 30px 16px',
            fontFamily: COND,
            fontWeight: 600,
            fontSize: 84,
            lineHeight: 1.15,
            color: '#fff',
            boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
          }}
        >
          Что если Солнце
          <br />
          <span style={{color: '#ffd23f'}}>погаснет?</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
