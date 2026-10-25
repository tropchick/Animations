import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {World3} from './slime/ep3/World';
import {Overlay3} from './slime/ep3/Overlay';
import './slime/fonts';

// "Хроника слизи", episode 3 "Город" — vertical 1080x1920, Russian voice-over.
export const SlimeEp3: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const v = frame / fps;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(0.55) contrast(1.1) brightness(0.92)'}}>
        <ThreeCanvas width={width} height={height} shadows flat camera={{fov: 40, position: [0, 2, 6]}}>
          <World3 v={v} />
        </ThreeCanvas>
      </AbsoluteFill>
      <Overlay3 />
      {withAudio ? <Audio src={staticFile('audio/slime-ep3.wav')} /> : null}
    </AbsoluteFill>
  );
};
