import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {Overlay} from './hl3/Overlay';
import {EVENING_END, FPS, SHOTS} from './hl3/cues';
import {HlCover} from './HlCover';

// «Что если Half-Life 3 выйдет сегодня?»: AI clips (Seedance 2.5 hook + Veo 3.1 Fast) cut to the VASKO narration.
// Frame 0 is the cover; story time v = (frame - 1) / fps.
const fill: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover'};
// Veo letterboxed some 9:16 clips (black bars ~95–115 px of 1280 at top and bottom): zoom those past the bars
const BARS: Record<string, number> = {portal: 1.18, accident: 1.23, army: 1.19};

export const HlToday: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const v = Math.max(0, (frame - 1) / FPS);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {frame === 0 ? (
        <HlCover />
      ) : (
        <>
          {SHOTS.map((s) => {
            const from = 1 + Math.round(s.from * FPS);
            const dur = Math.round(s.to * FPS) - Math.round(s.from * FPS);
            const end = s.name === 'evening' ? Math.min(s.to, EVENING_END) : s.to;
            const k = (v - s.from) / (s.to - s.from);
            // slow push-in inside every shot keeps the frame alive; the still fields push in harder
            const zoom = (BARS[s.clip] ?? 1) * (1.02 + (s.name === 'fields' ? 0.12 : 0.05) * Math.min(1, Math.max(0, k)));
            return (
              <Sequence key={s.name} from={from} durationInFrames={dur}>
                <AbsoluteFill style={{transform: `scale(${zoom})`}}>
                  {v < end ? (
                    <OffthreadVideo src={staticFile(`hl3/${s.clip}.mp4`)} muted startFrom={Math.round(s.offset * FPS)} playbackRate={s.rate} style={fill} />
                  ) : (
                    <Img src={staticFile('hl3/evening-last.jpg')} style={fill} />
                  )}
                </AbsoluteFill>
              </Sequence>
            );
          })}
          <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.4) 100%)'}} />
          <Overlay v={v} />
        </>
      )}
      {withAudio ? <Audio src={staticFile('audio/hl3-today.wav')} /> : null}
    </AbsoluteFill>
  );
};
