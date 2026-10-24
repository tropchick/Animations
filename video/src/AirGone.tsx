import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {World} from './scene/World';
import {Overlay} from './Overlay';
import './fonts';

// "What if the air disappeared for 5 seconds?" — 1:08, vertical 1080x1920.
export const AirGone: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const v = frame / fps;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <ThreeCanvas width={width} height={height} shadows flat camera={{fov: 55, position: [0, 4, 16]}}>
        <World v={v} />
      </ThreeCanvas>
      <Overlay />
      <Audio src={staticFile('audio/air-gone.wav')} />
    </AbsoluteFill>
  );
};
