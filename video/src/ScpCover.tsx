import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {World} from './scp/World';
import {View} from './scp/camera';
import {STAFF_AISLE} from './scp/places';
import {add3, shotStart} from './scp/cues';
import {MONO, SANS, YELLOW} from './scp/Overlay';
import './scp/fonts';

export const SCP_COVER_VIEW: View = {pos: add3(STAFF_AISLE, [0.3, 1.5, 7.4]), target: add3(STAFF_AISLE, [-0.25, 1.75, 0]), fov: 50, near: 0.02, far: 120};

// Cover, Part 1: the dark rack aisle, Ben's phone light on three tall faceless staff in the green exit light.
export const ScpCover: React.FC<{view?: View}> = ({view = SCP_COVER_VIEW}) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(0.9) contrast(1.1)'}}>
        <ThreeCanvas width={width} height={height} shadows flat gl={{logarithmicDepthBuffer: true}} camera={{fov: 50, position: [0, 2, 6]}}>
          <World v={shotStart('staff') + 3} view={() => view} cover />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.88) 82%, rgba(0,0,0,0.95) 100%)'}} />
      <div
        style={{
          position: 'absolute',
          right: 56,
          top: 130,
          background: 'rgba(12,14,18,0.8)',
          border: '1px solid rgba(255,255,255,0.16)',
          borderRadius: 24,
          padding: '20px 30px',
          textAlign: 'right',
        }}
      >
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 58, lineHeight: 1, color: '#fff'}}>PART 1</div>
        <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 42, color: YELLOW, marginTop: 8}}>DAY 1</div>
      </div>
      <AbsoluteFill style={{justifyContent: 'flex-end', paddingBottom: 300, paddingLeft: 70, paddingRight: 70}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 64, letterSpacing: '0.3em', color: YELLOW, textShadow: '0 3px 18px rgba(0,0,0,0.8)'}}>WHAT IF...</div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 112, lineHeight: 0.98, color: '#fff', marginTop: 14, textShadow: '0 6px 30px rgba(0,0,0,0.85)'}}>
          YOU GOT LOST IN <span style={{color: YELLOW}}>SCP-3008</span>?
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
