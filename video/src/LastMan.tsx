import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import './pov/fonts';
import {World} from './lastman/World';
import {Overlay} from './lastman/Overlay';
import {LastManCover} from './LastManCover';

// «Что если ты остался последним мужчиной на планете?»: a fast POV story. Vertical 1080x1920, Russian VO.
// Frame 0 is the cover; the story runs from frame 1, so story time v = (frame - 1) / fps.
export const LastMan: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const v = Math.max(0, (frame - 1) / fps);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {frame === 0 ? (
        <LastManCover />
      ) : (
        <>
          <AbsoluteFill style={{filter: 'saturate(1.1) contrast(1.05)'}}>
            <ThreeCanvas width={width} height={height} flat gl={{logarithmicDepthBuffer: true}} camera={{fov: 50, position: [0, 1.6, 2]}}>
              <World v={v} />
            </ThreeCanvas>
          </AbsoluteFill>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.34) 100%)'}} />
          <Overlay v={v} />
        </>
      )}
      {withAudio ? <Audio src={staticFile('audio/last-man.wav')} /> : null}
    </AbsoluteFill>
  );
};
