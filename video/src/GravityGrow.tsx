import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {World} from './grow/World';
import {Overlay} from './grow/Overlay';
import {GrowCover, GROW_COVER} from './GrowCover';
import './fonts';

// "What if gravity kept getting stronger?" — 1:06, vertical 1080x1920.
// Frame 0 is the cover (YouTube only lets you pick a thumbnail from the video's own frames);
// the story runs from frame 1, so video second v = (frame - 1) / fps.
export const GravityGrow: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const v = Math.max(0, (frame - 1) / fps);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {frame === 0 ? (
        <GrowCover {...GROW_COVER} />
      ) : (
        <>
          <ThreeCanvas width={width} height={height} shadows flat gl={{logarithmicDepthBuffer: true}} camera={{fov: 55, position: [0, 4, 16]}}>
            <World v={v} />
          </ThreeCanvas>
          <Overlay v={v} />
        </>
      )}
      {withAudio ? <Audio src={staticFile('audio/gravity-grow.wav')} /> : null}
    </AbsoluteFill>
  );
};
