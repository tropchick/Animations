import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {World} from './scp/World';
import {Overlay} from './scp/Overlay';
import {shotAt} from './scp/cues';
import {ScpCover} from './ScpCover';
import './scp/fonts';

// "What if you got lost in SCP-3008? (Part 1) — Closing Time", vertical 1080x1920, English voice-over, no music.
// Frame 0 is the cover (YouTube only lets you pick a thumbnail from the video's own frames);
// the story runs from frame 1, so story time v = (frame - 1) / fps.
export const ScpEp1: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const v = Math.max(0, (frame - 1) / fps);
  const s = shotAt(v).name;
  const night = !['enter', 'turn', 'signs', 'rise', 'pa'].includes(s);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {frame === 0 ? (
        <ScpCover />
      ) : (
        <>
          <AbsoluteFill style={{filter: night ? 'saturate(0.85) contrast(1.08)' : 'saturate(0.92) contrast(1.04)'}}>
            <ThreeCanvas width={width} height={height} shadows flat gl={{logarithmicDepthBuffer: true}} camera={{fov: 50, position: [0, 2, 6]}}>
              <World v={v} />
            </ThreeCanvas>
          </AbsoluteFill>
          <Overlay v={v} frame={frame} />
        </>
      )}
      {withAudio ? <Audio src={staticFile('audio/scp-ep1.wav')} /> : null}
    </AbsoluteFill>
  );
};
