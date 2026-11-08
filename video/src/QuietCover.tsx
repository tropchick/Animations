import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraRig, View} from './slime/camera';
import {crowdScene} from './quiet/scenes3';
import {H} from './quiet/scenes2';
import {SLIT, FRONT} from './quiet/House';
import {HOUSE} from './quiet/Town';
import {Glow} from './bear/kit';
import {COND, ROUND} from './quiet/Overlay';
import {shotEnd} from './quiet/cues';
import type {V3} from './quiet/cues';

// Cover = frame 0: low behind the crowd of the dead standing in a half-ring at the door of Тихая, 9;
// above them, the boarded upstairs window with a thin warm slit (someone is inside). Title on top.
const HX = HOUSE[0];
const HZ = HOUSE[2];
const COVER_V = shotEnd('crowd') - 0.3;
const coverView = (): View => ({pos: [HX + 1.7, 1.15, HZ + FRONT + 8.2], target: [HX - 0.1, 2.7, HZ + FRONT], fov: 52, far: 900});

export const CoverWorld: React.FC = () => (
  <>
    <CameraRig v={COVER_V} view={coverView} />
    {crowdScene.render(COVER_V)}
    <Glow position={H([SLIT[0], SLIT[1], SLIT[2] + 0.12]) as V3} size={0.9} color="#ffb24a" k={0.9} />
    <pointLight position={H([0, SLIT[1], FRONT + 0.4])} color="#ffb24a" intensity={1.2} distance={2} decay={1.6} />
  </>
);

export const QuietCover: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(1.1) contrast(1.08)'}}>
        <ThreeCanvas width={width} height={height} flat shadows gl={{logarithmicDepthBuffer: true, antialias: true}} camera={{fov: 52, position: [0, 1.6, 2]}}>
          <CoverWorld />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,4,18,0.6) 100%)'}} />
      <div style={{position: 'absolute', left: 70, right: 70, top: 190, textAlign: 'center'}}>
        <div style={{fontFamily: COND, fontWeight: 700, fontSize: 150, lineHeight: 1, letterSpacing: 8, color: '#e8eefc', textShadow: '0 0 40px rgba(120,150,255,0.45), 0 10px 30px rgba(0,0,0,0.85)'}}>ТИХИЙ ЭТАЖ</div>
        <div style={{marginTop: 26}}>
          <span style={{display: 'inline-block', background: 'rgba(6,10,22,0.85)', color: '#ffb24a', fontFamily: ROUND, fontWeight: 800, fontSize: 60, lineHeight: 1.15, borderRadius: 20, padding: '10px 30px 14px', border: '2px solid rgba(255,178,74,0.4)'}}>
            В 2:00 в дверь постучали
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
