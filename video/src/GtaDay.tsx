import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {Scene} from './day/World';
import {Overlay} from './day/Overlay';
import {Finish} from './day/kit';
import {DayCoverArt} from './day/cover';

// «День выхода GTA 6»: neon 2D illustration (layered SVG, glows, parallax), vertical 1080x1920, Russian VO.
// Frame 0 is the cover; the story runs from frame 1, so story time v = (frame - 1) / fps.
export const GtaDay: React.FC<{withAudio?: boolean; at?: number; clean?: boolean}> = ({withAudio = true, at, clean}) => {
  const frame = useCurrentFrame();
  const v = at ?? Math.max(0, (frame - 1) / 30);
  const audio = withAudio ? <Audio src={staticFile('audio/gta6-day.wav')} /> : null;
  if (frame === 0 && at === undefined)
    return (
      <AbsoluteFill style={{backgroundColor: '#000'}}>
        <DayCoverArt />
        {audio}
      </AbsoluteFill>
    );
  return (
    <AbsoluteFill style={{backgroundColor: '#0d0722', overflow: 'hidden'}}>
      <Scene v={v} />
      <Finish frame={frame} />
      {clean ? null : <Overlay v={v} />}
      {audio}
    </AbsoluteFill>
  );
};

export const GtaDayCover: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <DayCoverArt />
  </AbsoluteFill>
);
