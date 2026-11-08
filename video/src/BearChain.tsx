import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {World} from './bear/World';
import {Overlay} from './bear/Overlay';
import {View} from './slime/camera';
import {BearCover} from './BearCover';

// «Что если она реально выбрала медведя?»: soft 3D toy style, vertical 1080x1920, Russian VO.
// Frame 0 is the cover; the story runs from frame 1, so story time v = (frame - 1) / fps.
export const BearChain: React.FC<{withAudio?: boolean; cam?: View; at?: number; clean?: boolean}> = ({withAudio = true, cam, at, clean}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const v = at ?? Math.max(0, (frame - 1) / fps);
  if (frame === 0 && at === undefined && !cam)
    return (
      <AbsoluteFill style={{backgroundColor: '#000'}}>
        <BearCover />
        {withAudio ? <Audio src={staticFile('audio/bear-choice.wav')} /> : null}
      </AbsoluteFill>
    );
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(1.08) contrast(1.04)'}}>
        <ThreeCanvas width={width} height={height} flat shadows gl={{logarithmicDepthBuffer: true, antialias: true}} camera={{fov: 40, position: [0, 1.6, 2]}}>
          <World v={v} view={cam ? () => cam : undefined} />
        </ThreeCanvas>
      </AbsoluteFill>
      {clean ? null : (
        <>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 60%, rgba(40,20,0,0.34) 100%)'}} />
          <Overlay v={v} />
        </>
      )}
      {withAudio ? <Audio src={staticFile('audio/bear-choice.wav')} /> : null}
    </AbsoluteFill>
  );
};
