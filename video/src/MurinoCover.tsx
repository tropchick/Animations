import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {World} from './murino/World';
import {COVER_VIEW} from './murino/camera';
import {SANS, TitleText, YELLOW} from './murino/Overlay';
import './scp/fonts';

// Cover: the corridor in the fog, the courier with the teal backpack from behind, the Long One at the far end;
// the same title as the first seconds of the video.
export const MurinoCover: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(0.9) contrast(1.1)'}}>
        <ThreeCanvas width={width} height={height} shadows flat gl={{logarithmicDepthBuffer: true}} camera={{fov: 50, position: [0, 2, 6]}}>
          <World v={40} view={() => COVER_VIEW} cover />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%)'}} />
      <TitleText />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 250,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{background: 'rgba(12,14,18,0.82)', border: `2px solid ${YELLOW}`, borderRadius: 24, padding: '16px 34px', fontFamily: SANS, fontWeight: 900, fontSize: 58, letterSpacing: '0.12em', color: YELLOW}}>
          СЕРИЯ 1
        </div>
      </div>
    </AbsoluteFill>
  );
};
