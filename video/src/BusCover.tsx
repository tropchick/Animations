import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {World} from './bus/World';
import {TITLE_VIEW} from './bus/camera';
import {TitlePlate} from './bus/Overlay';

// Cover = frame 0 of the video: the guy staring past the girl's shoulder, with the meme title. No spoiler.
export const BusCover: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(1.05) contrast(1.08)'}}>
        <ThreeCanvas width={width} height={height} shadows flat gl={{logarithmicDepthBuffer: true}} camera={{fov: 40, position: [0, 1.6, 2]}}>
          <World v={0.6} view={() => TITLE_VIEW} cover />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
      <TitlePlate />
    </AbsoluteFill>
  );
};
