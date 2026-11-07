import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Panel} from './World';
import {NAMES} from './Overlay';
import {COND, YELLOW} from '../gta/Overlay';

export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => {
  const c = clamp(x);
  return c * c * (3 - 2 * c);
};

export const Canvas: React.FC<{w: number; h: number; children: React.ReactNode}> = ({w, h, children}) => (
  <ThreeCanvas width={w} height={h} flat gl={{logarithmicDepthBuffer: true}} camera={{fov: 50, position: [0, 1.6, 2]}}>
    {children}
  </ThreeCanvas>
);

// in the big layouts (cover, end) the bottom row's labels sit at the bottom, clear of the question in the middle
const Label: React.FC<{n: number; big?: boolean}> = ({n, big = false}) => (
  <div style={{position: 'absolute', left: 0, right: 0, ...(big && n >= 3 ? {bottom: 34} : {top: big ? 30 : 24}), textAlign: 'center'}}>
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        background: n === 4 ? 'rgba(90,8,8,0.9)' : 'rgba(16,12,20,0.84)',
        border: `3px solid ${n === 4 ? '#ff4a3a' : 'rgba(255,255,255,0.14)'}`,
        borderRadius: 18,
        padding: '4px 18px 8px',
        fontFamily: COND,
        fontWeight: 600,
        color: '#fff',
      }}
    >
      <span style={{fontSize: big ? 76 : 60, color: n === 4 ? '#ffd0c8' : YELLOW}}>{n}</span>
      <span style={{fontSize: big ? 40 : 36, letterSpacing: 1}}>{NAMES[n]}</span>
    </div>
  </div>
);

// the four windows: 2 x 2 panels; panel 4 is rendered at full size so it can fill the screen sharply
export const Quad: React.FC<{v: number; pv: number; zoom: number; appear?: number; big?: boolean}> = ({v, pv, zoom, appear = 1, big = false}) => {
  const {width, height} = useVideoConfig();
  const pw = width / 2;
  const ph = height / 2;
  const cells = [
    {n: 1, left: 0, top: 0},
    {n: 2, left: pw, top: 0},
    {n: 3, left: 0, top: ph},
  ];
  const z = smooth(zoom);
  const s4 = 0.5 + 0.5 * z;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {cells.map(({n, left, top}, i) => {
        const a = clamp((appear - i * 0.2) / 0.25);
        return (
          <div key={n} style={{position: 'absolute', left, top, width: pw, height: ph, overflow: 'hidden', opacity: a * (1 - z), transform: `scale(${0.9 + 0.1 * a})`}}>
            <Canvas w={pw} h={ph}>
              <Panel w={n} v={pv} />
            </Canvas>
            <Label n={n} big={big} />
            <div style={{position: 'absolute', inset: 0, border: '4px solid #000'}} />
          </div>
        );
      })}
      {(() => {
        const a = clamp((appear - 0.6) / 0.25);
        return (
          <>
            <div style={{position: 'absolute', left: 0, top: 0, width, height, transformOrigin: '100% 100%', transform: `scale(${s4 * (0.9 + 0.1 * a)})`, opacity: a}}>
              <Canvas w={width} h={height}>
                <Panel w={4} v={pv} push={zoom} />
              </Canvas>
              <AbsoluteFill style={{background: `rgba(160,0,0,${0.12 + 0.18 * z})`, mixBlendMode: 'multiply'}} />
              <div style={{position: 'absolute', inset: 0, border: `${8 * (1 - z)}px solid #000`}} />
            </div>
            <div style={{position: 'absolute', left: pw, top: ph, width: pw, height: ph, opacity: a * (1 - z)}}>
              <Label n={4} big={big} />
            </div>
          </>
        );
      })()}
    </AbsoluteFill>
  );
};

