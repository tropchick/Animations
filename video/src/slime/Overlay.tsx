import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {ENDING, FPS, LOG_NUMBER, ShotName, ramp, shotAt, shotStart} from './cues';

const MONO = "'IBM Plex Mono', monospace";
const INK = '#c9d7dd';
const RED = '#ff4a3d';

// small diary label in the top-left corner (out of the way of the Shorts/TikTok buttons)
const Label: React.FC<{children: React.ReactNode; opacity: number; color?: string; dot?: boolean; blink?: boolean}> = ({
  children,
  opacity,
  color = INK,
  dot,
  blink,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 64,
      top: 150,
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      fontFamily: MONO,
      fontWeight: 500,
      fontSize: 34,
      letterSpacing: '0.12em',
      color,
      opacity,
      textShadow: '0 2px 10px rgba(0,0,0,0.8)',
    }}
  >
    {dot ? <div style={{width: 20, height: 20, borderRadius: 10, background: RED, opacity: blink ? 1 : 0.25}} /> : null}
    {children}
  </div>
);

// scanning electron microscope frame: corners, scale bar, sample name, scan line
const MicroscopeUI: React.FC<{v: number; dust: boolean}> = ({v, dust}) => {
  const scan = ((v * 0.35) % 1) * 1920;
  const corner = (s: React.CSSProperties) => (
    <div style={{position: 'absolute', width: 90, height: 90, borderColor: 'rgba(220,230,235,0.7)', borderStyle: 'solid', borderWidth: 0, ...s}} />
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)',
        }}
      />
      <div style={{position: 'absolute', left: 0, right: 0, top: scan, height: 6, background: 'rgba(230,240,245,0.12)'}} />
      {corner({left: 60, top: 260, borderLeftWidth: 4, borderTopWidth: 4})}
      {corner({right: 60, top: 260, borderRightWidth: 4, borderTopWidth: 4})}
      {corner({left: 60, bottom: 420, borderLeftWidth: 4, borderBottomWidth: 4})}
      {corner({right: 60, bottom: 420, borderRightWidth: 4, borderBottomWidth: 4})}
      <div style={{position: 'absolute', left: 84, top: 150, fontFamily: MONO, fontWeight: 500, fontSize: 34, letterSpacing: '0.12em', color: INK}}>
        ОБРАЗЕЦ К-1
      </div>
      <div style={{position: 'absolute', right: 84, top: 156, fontFamily: MONO, fontSize: 28, letterSpacing: '0.08em', color: INK, opacity: 0.8}}>
        {dust ? 'СЭМ ×12 000' : 'СЭМ ×40 000'}
      </div>
      <div style={{position: 'absolute', left: 90, bottom: 460, fontFamily: MONO, fontSize: 28, color: INK}}>
        <div style={{width: dust ? 120 : 220, height: 6, background: INK, marginBottom: 12}} />
        {dust ? '1 мкм' : '200 нм'}
      </div>
    </AbsoluteFill>
  );
};

// soft out-of-focus lights in the macro shots, like a real lens close to the steel
const Bokeh: React.FC<{v: number; seed: string; strength: number}> = ({v, seed, strength}) => (
  <AbsoluteFill style={{mixBlendMode: 'screen', opacity: strength}}>
    {Array.from({length: 7}).map((_, i) => {
      const x = random(`${seed}-x-${i}`) * 1080;
      const y = random(`${seed}-y-${i}`) * 1920;
      const r = 80 + random(`${seed}-r-${i}`) * 220;
      const dx = Math.sin(v * 0.3 + i) * 12;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x - r + dx,
            top: y - r,
            width: r * 2,
            height: r * 2,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(170,200,230,${0.16 + random(`${seed}-a-${i}`) * 0.12}) 0%, rgba(170,200,230,0.08) 55%, rgba(170,200,230,0) 70%)`,
          }}
        />
      );
    })}
  </AbsoluteFill>
);

const Grain: React.FC<{frame: number}> = ({frame}) => (
  <AbsoluteFill style={{opacity: 0.09, mixBlendMode: 'overlay'}}>
    <svg width="1080" height="1920">
      <filter id={`grain-${frame}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 97} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="1080" height="1920" filter={`url(#grain-${frame})`} />
    </svg>
  </AbsoluteFill>
);

const BOKEH_SHOTS = ['grain', 'pit', 'rim', 'bottom', 'shock', 'glint', 'jarhold'];

export const Overlay: React.FC = () => {
  const frame = useCurrentFrame();
  const v = frame / FPS;
  const s = shotAt(v);
  const fadeIn = interpolate(v, [0, 0.3], [1, 0], {extrapolateRight: 'clamp'});
  const titleStart = shotStart('title');
  const two = ENDING[ENDING.length - 1].s;
  const inShot = (...names: string[]) => names.includes(s.name);
  const labelIn = (name: ShotName) => ramp(v, shotStart(name) + 0.15, shotStart(name) + 0.6);
  return (
    <AbsoluteFill>
      {BOKEH_SHOTS.includes(s.name) ? <Bokeh v={v} seed={s.name} strength={s.name === 'shock' ? 0.6 : 0.9} /> : null}
      {inShot('microscope', 'dust') ? <MicroscopeUI v={v} dust={s.name === 'dust'} /> : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)'}} />
      <Grain frame={frame} />
      {inShot('recorder', 'hall') ? (
        <Label opacity={labelIn('recorder')} dot blink={Math.floor(v * 1.6) % 2 === 0}>
          ЗАПИСЬ {LOG_NUMBER} · 03:40
        </Label>
      ) : null}
      {inShot('counter') ? <Label opacity={labelIn('counter')}>03:52</Label> : null}
      {inShot('desk', 'glint') ? <Label opacity={labelIn('desk')}>04:12</Label> : null}
      {inShot('shock') ? (
        <Label opacity={v >= two ? 1 : 0} color={RED}>
          ОБРАЗЦОВ: 2
        </Label>
      ) : null}
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
            СЕРИЯ 1 · УТЕЧКА
          </div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{background: '#000', opacity: fadeIn}} />
    </AbsoluteFill>
  );
};
