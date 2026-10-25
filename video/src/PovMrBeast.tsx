import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {World} from './pov/World';
import {Overlay} from './pov/Overlay';
import './pov/fonts';

// "ПОВ: ты Мистер Бист" — parody, one standalone video, vertical 1080x1920.
export const PovMrBeast: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const v = frame / fps;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <ThreeCanvas width={width} height={height} shadows flat camera={{fov: 50, position: [0, 2, 6]}}>
        <World v={v} />
      </ThreeCanvas>
      <Overlay />
      {withAudio ? <Audio src={staticFile('audio/pov-mrbeast.wav')} /> : null}
    </AbsoluteFill>
  );
};
