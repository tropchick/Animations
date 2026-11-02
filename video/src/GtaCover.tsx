import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {World, coverView} from './gta/World';
import {Asteroid, Glow} from './gta/Space';
import {COND} from './gta/Overlay';
import {V3, lerp} from './gta/cues';

// the burning asteroid in the upper right of the sky and the end of its trail
const A: V3 = [-29, 169, -193];
const B: V3 = [16, 193, -196];

// Cover = frame 0 of the video: the fan in front of the «GTA VI 19.11.2026» billboard at dusk,
// a burning asteroid already in the sky, and the meme title.
export const GtaCover: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(1.1) contrast(1.08)'}}>
        <ThreeCanvas width={width} height={height} flat gl={{logarithmicDepthBuffer: true}} camera={{fov: 40, position: [0, 1.6, 2]}}>
          <World v={0.2} view={() => coverView} shot="bill" />
          <Asteroid position={A} r={8} spin={0.8} heat={1} />
          <Glow position={A} size={60} color="#ffb070" k={1.1} />
          {Array.from({length: 9}).map((_, i) => {
            const s = (i + 1) / 9;
            return <Glow key={i} position={[A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s, A[2] + (B[2] - A[2]) * s]} size={lerp(42, 20, s)} color={s < 0.4 ? '#ffb070' : '#ff6a3a'} k={0.8 * (1 - s)} />;
          })}
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
      <div style={{position: 'absolute', left: 60, right: 60, top: 250, textAlign: 'center'}}>
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(16,12,20,0.84)',
            borderRadius: 24,
            padding: '12px 30px 16px',
            fontFamily: COND,
            fontWeight: 600,
            fontSize: 76,
            lineHeight: 1.15,
            color: '#fff',
            boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
          }}
        >
          Что если GTA 6
          <br />
          перенесут <span style={{color: '#ffd23f'}}>ещё на год?</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
