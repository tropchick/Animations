import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraRig} from './slime/camera';
import {CoverWorld, coverView} from './cheats/scenes1';
import {HookSticker} from './cheats/Overlay';
import {ROUND} from './bear/Overlay';
import {COND} from './gta/tex';

// Cover = frame 0 of the video: money rain, flying cars, the jetpack granny over the street; the question and «HESOYAM».
export const CheatsCover: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(1.12) contrast(1.05)'}}>
        <ThreeCanvas width={width} height={height} flat shadows gl={{logarithmicDepthBuffer: true, antialias: true}} camera={{fov: 40, position: [0, 1.6, 2]}}>
          <CameraRig v={0} view={() => coverView} />
          <CoverWorld />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(20,10,40,0.4) 100%)'}} />
      <HookSticker top={190} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1660, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: '#2fae5a', color: '#fff', borderRadius: 24, padding: '8px 34px 14px', transform: 'rotate(2deg)', boxShadow: '0 10px 0 rgba(10,60,30,0.45), 0 18px 40px rgba(0,0,0,0.4)'}}>
          <div style={{fontFamily: COND, fontWeight: 600, fontSize: 92, letterSpacing: 8}}>HESOYAM</div>
          <div style={{fontFamily: ROUND, fontWeight: 800, fontSize: 40, marginTop: -6}}>ЧИТ АКТИВИРОВАН</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
