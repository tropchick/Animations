import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {World} from './ai4/World';
import {Overlay} from './ai4/Overlay';
import {Canvas, Quad, clamp} from './ai4/Quad';
import {EV, shotAt, shotStart} from './ai4/cues';
import {AiCover} from './AiCover';

// «Что если ИИ станет умнее людей? 4 сценария»: the same morning of one guy in four worlds. Vertical 1080x1920, Russian VO.
// Frame 0 is the cover; the story runs from frame 1, so story time v = (frame - 1) / fps.

export const AiFour: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const v = Math.max(0, (frame - 1) / fps);
  const s = shotAt(v);
  const quad = s.name === 'quad' || s.name === 'quadEnd';
  const end = s.name === 'quadEnd';
  // panels in the end show early-morning moments again (rocket on the pad, no launched smoke)
  const pv = end ? 3 + (v - s.from) : v - shotStart('quad') + 3;
  const appear = (v - s.from) / 0.9;
  const zoom = end ? 0 : clamp((v - EV.zoom[0]) / (EV.zoom[1] - EV.zoom[0]));
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {frame === 0 ? (
        <AiCover />
      ) : (
        <>
          {quad ? (
            <Quad v={v} pv={pv} zoom={zoom} appear={appear} big={end} />
          ) : (
            <AbsoluteFill style={{filter: 'saturate(1.1) contrast(1.05)'}}>
              <Canvas w={width} h={height}>
                <World v={v} />
              </Canvas>
            </AbsoluteFill>
          )}
          <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.38) 100%)'}} />
          <Overlay v={v} />
        </>
      )}
      {withAudio ? <Audio src={staticFile('audio/ai-four-worlds.wav')} /> : null}
    </AbsoluteFill>
  );
};
