import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {BadgePop, Board, EvalBar, FOOT, Frame, MoveCard, Results, Scoreboard, Subtitles} from './slobody/Chess';
import {SlobodyCover} from './SlobodyCover';
import './slobody/fonts';

// «Шахматный разбор: До Слободы доеду?» for TikTok, vertical 1080x1920. The picture and the dialogue are the bus scene
// from «Мама будет против» (public/slobody/scene.mp4, cut by audio/make_slobody_audio.py); everything else is drawn here.
// Frame 0 is the cover; the scene runs from frame 1, so video time v = frame / fps matches cues.json.
export const SlobodyChess: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const v = frame / fps;
  if (frame === 0) return <SlobodyCover />;
  return (
    <AbsoluteFill>
      <Board />
      <Scoreboard v={v} />
      <Frame>
        <Sequence from={1}>
          <OffthreadVideo src={staticFile('slobody/scene.mp4')} muted style={{width: FOOT.w, height: FOOT.h, objectFit: 'cover'}} />
        </Sequence>
      </Frame>
      <EvalBar v={v} />
      <BadgePop v={v} />
      <MoveCard v={v} />
      <Subtitles v={v} />
      <Results v={v} />
      {withAudio ? <Audio src={staticFile('audio/slobody.wav')} /> : null}
    </AbsoluteFill>
  );
};
