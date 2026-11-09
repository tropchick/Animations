import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {World} from './diet/World';
import {Overlay} from './diet/Overlay';
import {View} from './slime/camera';
import {DietCover} from './DietCover';

// «Мать Габена села на диету»: soft 3D toy style (like the bear video), vertical 1080x1920, Russian VO.
// Frame 0 is the cover; the story runs from frame 1, so story time v = (frame - 1) / fps.
export const DietMom: React.FC<{withAudio?: boolean; cam?: View; at?: number; clean?: boolean}> = ({withAudio = true, cam, at, clean}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const v = at ?? Math.max(0, (frame - 1) / fps);
  if (frame === 0 && at === undefined && !cam)
    return (
      <AbsoluteFill style={{backgroundColor: '#000'}}>
        <DietCover />
        {withAudio ? <Audio src={staticFile('audio/gaben-diet.wav')} /> : null}
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
          <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 60%, rgba(20,10,40,0.34) 100%)'}} />
          <Overlay v={v} />
        </>
      )}
      {withAudio ? <Audio src={staticFile('audio/gaben-diet.wav')} /> : null}
    </AbsoluteFill>
  );
};
