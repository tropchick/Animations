import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Quad} from './ai4/Quad';
import {COND, YELLOW} from './gta/Overlay';

// Cover = frame 0 of the video: the four windows with their numbers, and the question across the middle.
export const AiCover: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <Quad v={0} pv={4} zoom={0} appear={5} big />
    <div style={{position: 'absolute', left: 30, right: 30, top: 790, textAlign: 'center'}}>
      <div
        style={{
          display: 'inline-block',
          background: 'rgba(16,12,20,0.92)',
          border: `4px solid ${YELLOW}`,
          borderRadius: 30,
          padding: '14px 34px 22px',
          fontFamily: COND,
          fontWeight: 600,
          fontSize: 92,
          lineHeight: 1.08,
          color: '#fff',
          boxShadow: '0 10px 40px rgba(0,0,0,0.55)',
        }}
      >
        Что если ИИ станет
        <br />
        <span style={{color: YELLOW}}>умнее людей?</span>
      </div>
    </div>
  </AbsoluteFill>
);
