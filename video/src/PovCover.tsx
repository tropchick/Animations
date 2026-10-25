import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraRig} from './pov/camera';
import {Beach} from './pov/Beach';
import {Hero} from './pov/cast';
import {shotAt, shotStart} from './pov/cues';
import './pov/fonts';

// Cover: the beach with a thousand people digging out the sports car, the hero in front with a surprised face.
export const PovCover: React.FC = () => {
  const {width, height} = useVideoConfig();
  const v = shotStart('digging') + 1.3;
  const s = shotAt(v);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <ThreeCanvas width={width} height={height} shadows flat camera={{fov: 50, position: [0, 2, 6]}}>
        <CameraRig s={s} v={v} view={{pos: [7.5, 3.2, 12.5], target: [1.0, 0.9, 1.5], fov: 50}} />
        <Beach v={v} s={s} />
        <Hero
          position={[5.6, 0, 9.4]}
          rotation={0.55}
          pose={{armL: [0.35, -2.25], armR: [0.35, 2.25], elbowL: 0.55, elbowR: 0.55, head: [-0.05, 0.1], mouth: 1, eyes: 1.65}}
        />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)'}} />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 230}}>
        <div style={{fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 74, letterSpacing: 2, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.7)'}}>
          ПОВ: ТЫ <span style={{color: '#ffd23f'}}>МИСТЕР БИСТ</span>
        </div>
        <div
          style={{
            marginTop: 40,
            fontFamily: "'Spectral', serif",
            fontWeight: 700,
            fontSize: 190,
            lineHeight: 1,
            color: '#ffd23f',
            textShadow: '0 8px 40px rgba(0,0,0,0.85), 0 0 2px #000',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          $1 000 000
        </div>
        <div style={{marginTop: 18, fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 80, letterSpacing: 6, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.8)'}}>
          ЗА 18 ЧАСОВ
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', right: 50, bottom: 300, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 34, letterSpacing: 5, color: 'rgba(255,255,255,0.9)', padding: '10px 22px', border: '3px solid rgba(255,255,255,0.8)', borderRadius: 10}}>
        ПАРОДИЯ
      </div>
    </AbsoluteFill>
  );
};
