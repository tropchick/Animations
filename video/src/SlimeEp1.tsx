import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {World} from './slime/World';
import {Overlay} from './slime/Overlay';
import {shotAt} from './slime/cues';
import './slime/fonts';

// "Хроника слизи", episode 1 "Утечка" — vertical 1080x1920, Russian voice-over.
export const SlimeEp1: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const v = frame / fps;
  const shot = shotAt(v).name;
  // electron microscope shots are black and white; everything else is cold and desaturated
  const filter = shot === 'microscope' || shot === 'dust' ? 'grayscale(1) contrast(1.35) brightness(1.1)' : 'saturate(0.55) contrast(1.1) brightness(0.92)';
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter}}>
        <ThreeCanvas width={width} height={height} shadows flat camera={{fov: 40, position: [0, 2, 6]}}>
          <World v={v} />
        </ThreeCanvas>
      </AbsoluteFill>
      <Overlay />
      {withAudio ? <Audio src={staticFile('audio/slime-ep1.wav')} /> : null}
    </AbsoluteFill>
  );
};
