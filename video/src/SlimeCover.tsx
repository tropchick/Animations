import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {World} from './slime/World';
import {shotStart} from './slime/cues';
import './slime/fonts';

// Cover for "Хроника слизи", episode 1: the two grains under the jar with the last line of the episode.
export const SlimeCover: React.FC<{episode?: number; title?: string; line?: string}> = ({
  episode = 1,
  title = 'УТЕЧКА',
  line = 'ИХ СТАЛО ДВА',
}) => {
  const {width, height} = useVideoConfig();
  const v = shotStart('shock') + 1.2;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(0.55) contrast(1.15) brightness(0.95)'}}>
        <ThreeCanvas width={width} height={height} shadows flat camera={{fov: 40, position: [0, 2, 6]}}>
          <World v={v} />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 38%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)'}} />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 300}}>
        <div style={{fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 40, letterSpacing: '0.3em', color: '#8fa3ad', paddingLeft: '0.3em'}}>
          ХРОНИКА СЛИЗИ
        </div>
        <div
          style={{
            marginTop: 50,
            fontFamily: "'Spectral', serif",
            fontWeight: 400,
            fontSize: 150,
            lineHeight: 1.0,
            letterSpacing: '0.04em',
            textAlign: 'center',
            color: '#e9eef0',
            textShadow: '0 6px 40px rgba(0,0,0,0.9)',
          }}
        >
          {line.split(' ').slice(0, 2).join(' ')}
          <br />
          <span style={{color: '#ff4a3d'}}>{line.split(' ').slice(2).join(' ')}</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 330}}>
        <div style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: 42, letterSpacing: '0.25em', color: '#c9d7dd', paddingLeft: '0.25em'}}>
          СЕРИЯ {episode} · {title}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
