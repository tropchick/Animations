import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {SnowScene} from './snow/Scene';
import {SnowCover} from './SnowCover';

// «Снеговик против весны»: a rule simulation with no voice. Frame 0 is the cover; story frame i = frame - 1.
export const SnowSpring: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {frame === 0 ? <SnowCover /> : <SnowScene i={frame - 1} />}
      {withAudio ? <Audio src={staticFile('audio/snow-spring.wav')} /> : null}
    </AbsoluteFill>
  );
};
