import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import './pov/fonts';
import {CameraRig} from './lastman/World';
import {Bedroom, FY} from './lastman/Flat';
import {Yard} from './lastman/Yard';
import {SANS, SERIF} from './lastman/tex';

// Cover = frame 0 of the video: the crowd of women under your window, the title and the counter «1».
export const COVER_V = 31;
// from the open window straight down at the whole crowd
const CoverScene: React.FC = () => (
  <>
    <CameraRig v={COVER_V} view={{pos: [0.75, FY + 1.75, 6.35], target: [0.3, 0, 14.5], fov: 62}} />
    <Bedroom v={COVER_V} shot="window" />
    <Yard v={COVER_V} withOwnBlock={false} />
  </>
);
const SHADOW = '0 4px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.9)';

export const LastManCover: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(1.15) contrast(1.06)'}}>
        <ThreeCanvas width={width} height={height} flat gl={{logarithmicDepthBuffer: true}} camera={{fov: 50, position: [0, 1.6, 2]}}>
          <CoverScene />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 100%)'}} />
      <div style={{position: 'absolute', left: 50, right: 50, top: 180, textAlign: 'center', fontFamily: SERIF, background: 'rgba(8,10,20,0.55)', borderRadius: 28, padding: '18px 0 26px', color: '#fff', textShadow: SHADOW}}>
        <div style={{fontSize: 92, lineHeight: 1.05, fontWeight: 700}}>ПОСЛЕДНИЙ</div>
        <div style={{fontSize: 92, lineHeight: 1.05, fontWeight: 700, color: '#ff3b30'}}>МУЖЧИНА</div>
        <div style={{fontSize: 92, lineHeight: 1.05, fontWeight: 700}}>НА ЗЕМЛЕ</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 230, textAlign: 'center', fontFamily: SANS, color: '#fff', textShadow: SHADOW}}>
        <div style={{fontSize: 44, fontWeight: 600, letterSpacing: 2}}>МУЖЧИН НА ЗЕМЛЕ</div>
        <div style={{fontSize: 200, fontWeight: 800, lineHeight: 1, color: '#ff3b30'}}>1</div>
      </div>
    </AbsoluteFill>
  );
};
