import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {World} from './dota/World';
import {COND} from './gta/Overlay';

// Cover = frame 0 of the video: the Dotters squint at the sun in the yard, the grannies stare; title on top.
export const DotaCover: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(1.12) contrast(1.06)'}}>
        <ThreeCanvas width={width} height={height} flat gl={{logarithmicDepthBuffer: true}} camera={{fov: 40, position: [0, 1.6, 2]}}>
          <World v={13.4} shot="yard" view={() => ({pos: [5.5, 1.9, 11.5], target: [1.5, 1.6, -1], fov: 44, far: 3000})} />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
      <div style={{position: 'absolute', left: 50, right: 50, top: 230, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: 'rgba(14,14,20,0.86)', borderRadius: 24, padding: '12px 34px 18px', fontFamily: COND, fontWeight: 600, fontSize: 96, lineHeight: 1.1, color: '#fff', boxShadow: '0 6px 24px rgba(0,0,0,0.35)'}}>
          Что если Доту
          <br />
          <span style={{color: '#ff5a4d'}}>закроют навсегда?</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1460, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: 'rgba(14,14,20,0.86)', borderRadius: 18, padding: '6px 28px 10px', fontFamily: COND, fontWeight: 600, fontSize: 62, color: '#ff5a4d', border: '3px solid rgba(255,90,77,0.7)'}}>
          СЕРВЕРЫ ОТКЛЮЧЕНЫ
        </div>
      </div>
    </AbsoluteFill>
  );
};
