import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {Stage, World} from './gor/World';
import {labScene} from './gor/lab';
import {View} from './slime/camera';

// «100 мужчин против гориллы»: comic 3D (toon fill + ink outlines), vertical 1080x1920, Russian VO.
// Frame 0 is the cover; the story runs from frame 1, so story time v = (frame - 1) / fps.
export const Canvas3D: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {width, height} = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} flat gl={{antialias: true, stencil: true}} camera={{fov: 40, position: [0, 1.6, 2]}}>
      {children}
    </ThreeCanvas>
  );
};

export const Gorilla100: React.FC<{withAudio?: boolean; cam?: View; at?: number; clean?: boolean}> = ({withAudio = true, cam, at, clean}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const v = at ?? Math.max(0, (frame - 1) / fps);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Canvas3D>
        <World v={v} view={cam ? () => cam : undefined} />
      </Canvas3D>
      {clean ? null : null}
      {withAudio ? <Audio src={staticFile('audio/gorilla-100.wav')} /> : null}
    </AbsoluteFill>
  );
};

export const GorLab: React.FC<{cam?: View; at?: number}> = ({cam, at}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const v = at ?? frame / fps;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Canvas3D>
        <Stage v={v} scene={labScene} view={cam ? () => cam : labScene.view} />
      </Canvas3D>
    </AbsoluteFill>
  );
};
