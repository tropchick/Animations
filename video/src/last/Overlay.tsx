import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Grain, Label} from '../slime/Overlay';
import {FPS, Shot, ramp, shotAt, shotEnd, shotStart} from './cues';

export const MONO = "'IBM Plex Mono', monospace";
export const SERIF = "'Spectral', serif";
export const GREEN_INK = '#5fd38d';

export const Overlay: React.FC = () => {
  const frame = useCurrentFrame();
  const v = frame / FPS;
  const s = shotAt(v);
  const inShot = (...names: Shot[]) => names.includes(s.name);
  const labelIn = (name: Shot) => ramp(v, shotStart(name) + 0.15, shotStart(name) + 0.6);
  const fadeIn = interpolate(v, [0, 0.4], [1, 0], {extrapolateRight: 'clamp'});
  const titleStart = shotStart('title');
  const hookText = ramp(v, 0.25, 0.8) * (1 - ramp(v, shotEnd('hook') - 0.35, shotEnd('hook')));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.62) 100%)'}} />
      <Grain frame={frame} />
      {inShot('hook') ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: '0 90px'}}>
          <div
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: 70,
              lineHeight: 1.18,
              textAlign: 'center',
              color: '#ece8df',
              opacity: hookText,
              textShadow: '0 4px 30px rgba(0,0,0,0.95)',
            }}
          >
            Что если ты остался последним человеком на&nbsp;Земле?
          </div>
        </AbsoluteFill>
      ) : null}
      {inShot('stuck', 'button', 'sleep') ? <Label opacity={labelIn('stuck')}>ВЧЕРА · 23:40</Label> : null}
      {inShot('morning', 'doors') ? <Label opacity={labelIn('morning')}>07:10</Label> : null}
      {inShot('door36') ? <Label opacity={labelIn('door36')}>19:30</Label> : null}
      {inShot('window', 'reflect') ? <Label opacity={labelIn('window')}>23:52</Label> : null}
      {inShot('title') ? (
        <AbsoluteFill style={{background: '#000', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 40}}>
          <div
            style={{
              fontFamily: SERIF,
              fontWeight: 300,
              fontSize: 96,
              letterSpacing: '0.2em',
              whiteSpace: 'nowrap',
              color: '#e4e0d6',
              opacity: ramp(v, titleStart + 0.4, titleStart + 1.2),
              paddingLeft: '0.2em',
            }}
          >
            ПОСЛЕДНИЙ
          </div>
          <div style={{width: 120, height: 2, background: GREEN_INK, opacity: 0.8 * ramp(v, titleStart + 0.8, titleStart + 1.4)}} />
          <div
            style={{
              fontFamily: MONO,
              fontWeight: 400,
              fontSize: 34,
              letterSpacing: '0.3em',
              whiteSpace: 'nowrap',
              color: '#a7a399',
              opacity: ramp(v, titleStart + 1.0, titleStart + 1.7),
              paddingLeft: '0.3em',
            }}
          >
            СЕРИЯ 1 · ОЖИДАЙТЕ
          </div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{background: '#000', opacity: fadeIn}} />
    </AbsoluteFill>
  );
};
