import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {World} from './World';
import {viewAt} from './camera';
import {V3} from './cues';
import './fonts';

// One frame of the episode at time v, optionally from another camera: for setting up shots (tools/still-view.mjs).
export const LastDebug: React.FC<{v: number; cam?: {pos: V3; target: V3; fov: number}}> = ({v, cam}) => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <ThreeCanvas width={1080} height={1920} shadows flat camera={{fov: 40, position: [0, 2, 6]}}>
      <World v={v} view={cam ? () => ({...cam, near: 0.01, far: 2000}) : viewAt} />
    </ThreeCanvas>
  </AbsoluteFill>
);
