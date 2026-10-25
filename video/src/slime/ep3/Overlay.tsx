import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FPS, ramp} from '../cues';
import {Bokeh, Grain, Label, MONO} from '../Overlay';
import {LOG_NUMBER, Shot3, shotAt, shotStart} from './cues';

const BOKEH: Shot3[] = ['phone', 'scan', 'live', 'notepad'];

export const Overlay3: React.FC = () => {
  const frame = useCurrentFrame();
  const v = frame / FPS;
  const s = shotAt(v);
  const inShot = (...names: Shot3[]) => names.includes(s.name);
  const labelIn = (name: Shot3) => ramp(v, shotStart(name) + 0.15, shotStart(name) + 0.6);
  const fadeIn = interpolate(v, [0, 0.4], [1, 0], {extrapolateRight: 'clamp'});
  const titleStart = shotStart('title');
  return (
    <AbsoluteFill>
      {BOKEH.includes(s.name) ? <Bokeh v={v} seed={s.name} strength={s.name === 'notepad' ? 0.2 : 0.45} /> : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)'}} />
      <Grain frame={frame} />
      {inShot('recorder') ? (
        <Label opacity={labelIn('recorder')} dot blink={Math.floor(v * 1.6) % 2 === 0}>
          ЗАПИСЬ {LOG_NUMBER} · 08:00
        </Label>
      ) : null}
      {inShot('wall', 'fire') ? <Label opacity={labelIn('wall')}>18:00</Label> : null}
      {inShot('phone', 'kitchen') ? <Label opacity={labelIn('phone')}>22:00</Label> : null}
      {inShot('window', 'city') ? <Label opacity={labelIn('window')}>01:30</Label> : null}
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
            СЕРИЯ 3 · ГОРОД
          </div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{background: '#000', opacity: fadeIn}} />
    </AbsoluteFill>
  );
};
