import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraRig} from './slime/camera';
import {CoverWorld, coverView} from './six7/scenes3';
import {HookSticker} from './six7/Overlay';

// Cover = frame 0 of the video: the boy on his stool does «six seven» in front of the board with the banned 67; the head teacher in shock.
export const Six7Cover: React.FC = () => {
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
      <HookSticker top={170} />
    </AbsoluteFill>
  );
};
