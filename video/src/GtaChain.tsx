import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {World} from './gta2/World';
import {Overlay} from './gta2/Overlay';
import {GtaCover} from './GtaCover';

// «Что если GTA 6 перенесут ещё на год?», remake: one cause leads to the next. Vertical 1080x1920, Russian VO.
// Frame 0 is the cover; the story runs from frame 1, so story time v = (frame - 1) / fps.
export const GtaChain: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const v = Math.max(0, (frame - 1) / fps);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {frame === 0 ? (
        <GtaCover />
      ) : (
        <>
          <AbsoluteFill style={{filter: 'saturate(1.08) contrast(1.05)'}}>
            <ThreeCanvas width={width} height={height} flat gl={{logarithmicDepthBuffer: true}} camera={{fov: 40, position: [0, 1.6, 2]}}>
              <World v={v} />
            </ThreeCanvas>
          </AbsoluteFill>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
          <Overlay v={v} />
        </>
      )}
      {withAudio ? <Audio src={staticFile('audio/gta6-chain.wav')} /> : null}
    </AbsoluteFill>
  );
};
