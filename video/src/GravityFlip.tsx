import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {World} from './gravity/World';
import {Overlay} from './gravity/Overlay';
import './fonts';

// "What if gravity flipped for 10 seconds?" — 1:05, vertical 1080x1920.
export const GravityFlip: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const v = frame / fps;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <ThreeCanvas width={width} height={height} shadows flat camera={{fov: 55, position: [0, 4, 16]}}>
        <World v={v} />
      </ThreeCanvas>
      <Overlay />
      {withAudio ? <Audio src={staticFile('audio/gravity-flip.wav')} /> : null}
    </AbsoluteFill>
  );
};
