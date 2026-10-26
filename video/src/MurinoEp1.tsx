import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {World} from './murino/World';
import {Overlay} from './murino/Overlay';
import {MurinoCover} from './MurinoCover';
import './scp/fonts';

// «Курьер в Мурино», серия 1 «Инструкция для новичка», vertical 1080x1920, Russian voice-over, no music.
// Frame 0 is the cover (YouTube only lets you pick a thumbnail from the video's own frames);
// the story runs from frame 1, so story time v = (frame - 1) / fps.
export const MurinoEp1: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const v = Math.max(0, (frame - 1) / fps);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {frame === 0 ? (
        <MurinoCover />
      ) : (
        <>
          <AbsoluteFill style={{filter: 'saturate(0.88) contrast(1.06)'}}>
            <ThreeCanvas width={width} height={height} shadows flat gl={{logarithmicDepthBuffer: true}} camera={{fov: 50, position: [0, 2, 6]}}>
              <World v={v} />
            </ThreeCanvas>
          </AbsoluteFill>
          <Overlay v={v} frame={frame} />
        </>
      )}
      {withAudio ? <Audio src={staticFile('audio/murino-ep1.wav')} /> : null}
    </AbsoluteFill>
  );
};
