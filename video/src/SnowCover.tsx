import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SnowScene} from './snow/Scene';
import {COVER_FRAME} from './snow/data';

// Cover = frame 0: the snowman at his lowest, a beam on its way, and the title.
const outline = {paintOrder: 'stroke' as const, stroke: '#1c2840', strokeLinejoin: 'round' as const};

export const SnowCover: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <SnowScene i={COVER_FRAME} showText={false} />
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <g fontFamily="Inter" fontWeight={800} textAnchor="middle">
        <text x={540} y={300} fontSize={104} fill="#ffffff" style={{...outline, strokeWidth: 18}}>
          СНЕГОВИК
        </text>
        <text x={540} y={420} fontSize={104} fill="#ffffff" style={{...outline, strokeWidth: 18}}>
          ПРОТИВ ВЕСНЫ
        </text>
        <text x={540} y={560} fontSize={64} fill="#ff9b45" style={{...outline, strokeWidth: 12}}>
          кто победит?
        </text>
      </g>
    </svg>
  </AbsoluteFill>
);
