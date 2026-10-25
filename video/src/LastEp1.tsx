import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {World} from './last/World';
import {Overlay} from './last/Overlay';
import './last/fonts';

// "Последний", episode 1 "Ожидайте" — vertical 1080x1920, Russian voice-over.
export const LastEp1: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const v = frame / fps;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(0.8) contrast(1.06) brightness(0.97)'}}>
        <ThreeCanvas width={width} height={height} shadows flat camera={{fov: 40, position: [0, 2, 6]}}>
          <World v={v} />
        </ThreeCanvas>
      </AbsoluteFill>
      <Overlay />
      {withAudio ? <Audio src={staticFile('audio/last-ep1.wav')} /> : null}
    </AbsoluteFill>
  );
};
