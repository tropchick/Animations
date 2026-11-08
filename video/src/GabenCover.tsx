import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraRig} from './slime/camera';
import {Planet, Stars} from './gta/Space';
import {Slipper} from './gaben/Sets';
import {COND} from './gta/Overlay';

const SUN: [number, number, number] = [-8, 4, 10];

// Cover = frame 0 of the video: the Earth in space and, next to it, a pink slipper bigger than the Earth.
export const GabenCover: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(1.12) contrast(1.06)'}}>
        <ThreeCanvas width={width} height={height} flat gl={{logarithmicDepthBuffer: true}} camera={{fov: 40, position: [0, 0, 60]}}>
          <CameraRig v={0} view={() => ({pos: [0, 2, 62], target: [0, -2, 0], fov: 46, far: 3000})} />
          <color attach="background" args={['#02030a']} />
          <Stars />
          <ambientLight intensity={0.35} />
          <directionalLight position={SUN} intensity={2.4} />
          <Planet position={[-7, -14, 0]} r={6} sun={SUN} st={{spin: 2.3}} />
          <Slipper position={[4, -3, -8]} rotation={[0.35, -1.15, 0.12]} scale={26} />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
      <div style={{position: 'absolute', left: 50, right: 50, top: 240, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: 'rgba(16,12,20,0.84)', borderRadius: 24, padding: '12px 34px 18px', fontFamily: COND, fontWeight: 600, fontSize: 92, lineHeight: 1.1, color: '#fff', boxShadow: '0 6px 24px rgba(0,0,0,0.35)'}}>
          Сколько весит
          <br />
          <span style={{color: '#ff7eb6'}}>мать Габена?</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1450, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: 'rgba(16,12,20,0.84)', borderRadius: 18, padding: '6px 28px 10px', fontFamily: COND, fontWeight: 600, fontSize: 64, color: '#fff', border: '3px solid rgba(255,90,77,0.7)'}}>
          <span style={{color: '#cfc6d6'}}>ВЕС: </span>
          <span style={{color: '#ff5a4d'}}>ОШИБКА</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
