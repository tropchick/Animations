import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, DISPLAY, Finish} from './kit';
import {Room, SEAT} from './room';

// Cover = frame 0: the flooded flat, the Fan still playing, the alligator with the second gamepad; the title.
export const DayCoverArt: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#0d0722', overflow: 'hidden'}}>
    <Room v={47.3} cam={{x: -20, y: 60, z: 1.1}} day={1} tv="split" water={SEAT - 92} fanUp={1} tired={1} hours={3.4} gator={1} grab={1} />
    <Finish frame={3} />
    <div style={{position: 'absolute', left: 50, right: 50, top: 150, textAlign: 'center'}}>
      <div
        style={{
          display: 'inline-block',
          background: 'rgba(13,7,34,0.9)',
          border: `6px solid ${C.magenta}`,
          borderRadius: 44,
          padding: '20px 40px 28px',
          fontFamily: DISPLAY,
          fontWeight: 900,
          fontSize: 92,
          lineHeight: 1.08,
          color: '#fff',
          transform: 'rotate(-2deg)',
          boxShadow: `0 0 40px ${C.magenta}, 0 0 120px ${C.magenta}88, inset 0 0 24px ${C.magenta}66`,
          textShadow: `0 0 22px ${C.magenta}`,
        }}
      >
        ДЕНЬ ВЫХОДА
        <br />
        <span style={{color: '#ffe14d', textShadow: '0 0 26px #ffb21f', fontSize: 132}}>GTA 6</span>
      </div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1420, textAlign: 'center'}}>
      <div style={{display: 'inline-block', background: C.cyan, color: '#0d0722', borderRadius: 26, padding: '10px 34px 14px', fontFamily: DISPLAY, fontWeight: 900, fontSize: 58, transform: 'rotate(2deg)', boxShadow: `0 0 40px ${C.cyan}aa, 0 14px 30px rgba(0,0,0,0.4)`}}>
        ВЫЖИЛИ НЕ ВСЕ
      </div>
    </div>
  </AbsoluteFill>
);
