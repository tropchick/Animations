import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FPS, ramp} from '../cues';
import {Bokeh, Grain, Label, MONO} from '../Overlay';
import {LOG_NUMBER, Shot2, shotAt, shotStart} from './cues';

const BOKEH: Shot2[] = ['jarsink', 'swarm', 'radio', 'silent'];

// thick glass of the small door window: dark steel edges, a cold sheen
const DoorWindow: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{boxShadow: 'inset 0 0 0 54px #0b0e11, inset 0 0 0 60px #2c343b, inset 0 0 90px 70px rgba(0,0,0,0.85)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(125deg, rgba(200,220,235,0.07) 0%, rgba(200,220,235,0) 35%, rgba(200,220,235,0) 70%, rgba(200,220,235,0.05) 100%)'}} />
  </AbsoluteFill>
);

export const Overlay2: React.FC = () => {
  const frame = useCurrentFrame();
  const v = frame / FPS;
  const s = shotAt(v);
  const inShot = (...names: Shot2[]) => names.includes(s.name);
  const labelIn = (name: Shot2) => ramp(v, shotStart(name) + 0.15, shotStart(name) + 0.6);
  const fadeIn = interpolate(v, [0, 0.3], [1, 0], {extrapolateRight: 'clamp'});
  const titleStart = shotStart('title');
  return (
    <AbsoluteFill>
      {BOKEH.includes(s.name) ? <Bokeh v={v} seed={s.name} strength={s.name === 'swarm' ? 0.8 : 0.4} /> : null}
      {inShot('window', 'deskgone') ? <DoorWindow /> : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)'}} />
      <Grain frame={frame} />
      {inShot('recorder') ? (
        <Label opacity={labelIn('recorder')} dot blink={Math.floor(v * 1.6) % 2 === 0}>
          ЗАПИСЬ {LOG_NUMBER} · 05:00
        </Label>
      ) : null}
      {inShot('window', 'deskgone') ? <Label opacity={labelIn('window')}>12:00</Label> : null}
      {inShot('yard', 'tunnel') ? <Label opacity={labelIn('yard')}>18:00</Label> : null}
      {inShot('osoka') ? <Label opacity={labelIn('osoka')}>01:40</Label> : null}
      {inShot('roof', 'roofview') ? <Label opacity={labelIn('roof')}>06:10</Label> : null}
      {inShot('title') ? (
        <AbsoluteFill style={{background: '#000', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 40}}>
          <div
            style={{
              fontFamily: "'Spectral', serif",
              fontWeight: 300,
              fontSize: 78,
              letterSpacing: '0.18em',
              whiteSpace: 'nowrap',
              color: '#b9c4ca',
              opacity: ramp(v, titleStart + 0.5, titleStart + 1.3),
              paddingLeft: '0.18em',
            }}
          >
            ХРОНИКА СЛИЗИ
          </div>
          <div style={{width: 120, height: 2, background: '#5d6970', opacity: ramp(v, titleStart + 0.9, titleStart + 1.5)}} />
          <div
            style={{
              fontFamily: MONO,
              fontWeight: 400,
              fontSize: 34,
              letterSpacing: '0.3em',
              whiteSpace: 'nowrap',
              color: '#8b979e',
              opacity: ramp(v, titleStart + 1.1, titleStart + 1.8),
              paddingLeft: '0.3em',
            }}
          >
            СЕРИЯ 2 · ПЕРВЫЕ СУТКИ
          </div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{background: '#000', opacity: fadeIn}} />
    </AbsoluteFill>
  );
};
