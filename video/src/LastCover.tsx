import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {World} from './last/World';
import {DOORS} from './last/cues';
import {GREEN_INK, MONO, SERIF} from './last/Overlay';
import './last/fonts';

// Covers for "Последний": a frame of the episode with its key line (the last word in green).
// Episode 1: the open lift on the empty landing, Kostya alone in the lit cab.
export const LastCover: React.FC<{episode?: number; title?: string; line?: string}> = ({episode = 1, title = 'ОЖИДАЙТЕ', line = 'ВСЕ ОПЕРАТОРЫ ЗАНЯТЫ'}) => {
  const {width, height} = useVideoConfig();
  const words = line.split(' ');
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(0.8) contrast(1.1) brightness(0.95)'}}>
        <ThreeCanvas width={width} height={height} shadows flat camera={{fov: 40, position: [0, 2, 6]}}>
          <World v={DOORS + 3.5} view={() => ({pos: [0.25, 1.62, 3.3], target: [0.0, 1.62, -0.9], fov: 50, near: 0.02})} />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 36%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.8) 100%)'}} />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 200}}>
        <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 40, letterSpacing: '0.34em', color: '#b9b4a8', paddingLeft: '0.34em'}}>ПОСЛЕДНИЙ</div>
        <div
          style={{
            marginTop: 50,
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: 132,
            lineHeight: 1.02,
            letterSpacing: '0.03em',
            textAlign: 'center',
            color: '#f0ece3',
            textShadow: '0 6px 40px rgba(0,0,0,0.9)',
          }}
        >
          {words.slice(0, -1).join(' ')}
          <br />
          <span style={{color: GREEN_INK}}>{words[words.length - 1]}</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 330}}>
        <div style={{fontFamily: MONO, fontSize: 42, letterSpacing: '0.25em', color: '#d8d3c8', paddingLeft: '0.25em'}}>
          СЕРИЯ {episode} · {title}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
