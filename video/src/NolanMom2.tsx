import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {World} from './nolan2/World';
import {Overlay} from './nolan2/Overlay';
import {View} from './slime/camera';
import {NolanCover2} from './NolanCover2';
import {REWIND, shotAt} from './nolan2/cues';

// The NEW «Кто весит больше: мать Габена или мать Нолана?» (2026-11-11): soft 3D toy style, vertical 1080x1920, Russian VO.
// Frame 0 is the cover; the story runs from frame 1, so story time v = (frame - 1) / fps.
export const NolanMom2: React.FC<{withAudio?: boolean; cam?: View; at?: number; clean?: boolean}> = ({withAudio = true, cam, at, clean}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const v = at ?? Math.max(0, (frame - 1) / fps);
  if (frame === 0 && at === undefined && !cam)
    return (
      <AbsoluteFill style={{backgroundColor: '#000'}}>
        <NolanCover2 />
        {withAudio ? <Audio src={staticFile('audio/nolan-mom-2.wav')} /> : null}
      </AbsoluteFill>
    );
  // the room goes sepia as the calendar reaches 2004
  const sep = shotAt(v).name === 'clockG' ? Math.max(0, Math.min(1, (v - (REWIND[1] - 0.4)) / 0.4)) * 0.75 : 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: `saturate(${1.08 - sep * 0.5}) contrast(1.04) sepia(${sep})`}}>
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
      {withAudio ? <Audio src={staticFile('audio/nolan-mom-2.wav')} /> : null}
    </AbsoluteFill>
  );
};
