import React from 'react';
import {AbsoluteFill, continueRender, delayRender, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {World} from './earth/World';
import {View} from './earth/camera';
import './fonts';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';
import '@fontsource/spectral/600.css';

const coverFonts = delayRender('Loading cover fonts');
Promise.all([document.fonts.load("800 76px 'Inter'"), document.fonts.load("900 112px 'Inter'"), document.fonts.load("600 150px 'Spectral'")])
  .then(() => continueRender(coverFonts))
  .catch(() => continueRender(coverFonts));

const SERIF = "'Spectral', Georgia, serif";
const SANS = "'Inter', Helvetica, Arial, sans-serif";

// Cover: looking up between the towers as the glass blows out and the crane goes over.
export const EarthCover: React.FC<{v: number; view: View}> = ({v, view}) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <ThreeCanvas width={width} height={height} shadows flat gl={{logarithmicDepthBuffer: true}} camera={{fov: 55, position: [0, 4, 16]}}>
        <World v={v} view={view} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.2) 28%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.7) 100%)'}} />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 210, textAlign: 'center'}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, letterSpacing: 3, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.7)'}}>
          WHAT IF THE EARTH
        </div>
        <div style={{marginTop: 6, fontFamily: SANS, fontWeight: 900, fontSize: 112, lineHeight: 1.0, letterSpacing: 1, color: '#f6c869', textShadow: '0 6px 34px rgba(0,0,0,0.8)'}}>
          STOPPED
          <br />
          SPINNING?
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 300}}>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 34, letterSpacing: 5, color: 'rgba(255,255,255,0.92)', textShadow: '0 2px 14px rgba(0,0,0,0.8)'}}>EARTH&apos;S SPIN</div>
        <div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 150, lineHeight: 1.05, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,0.85)', whiteSpace: 'nowrap'}}>
          1,280 <span style={{color: '#ff6a5c'}}>→ 0</span>
          <span style={{fontSize: 64}}> km/h</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
