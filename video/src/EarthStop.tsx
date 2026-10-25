import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {World} from './earth/World';
import {Overlay} from './earth/Overlay';
import './fonts';

// "What if the Earth stopped spinning?" — 1:06, vertical 1080x1920.
export const EarthStop: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const v = frame / fps;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <ThreeCanvas width={width} height={height} shadows flat camera={{fov: 55, position: [0, 4, 16]}}>
        <World v={v} />
      </ThreeCanvas>
      <Overlay />
      {withAudio ? <Audio src={staticFile('audio/earth-stop.wav')} /> : null}
    </AbsoluteFill>
  );
};
