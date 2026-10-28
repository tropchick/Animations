import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {BadgePop, Board, CREAM, EvalBar, Frame, Glyph, MoveCard, Results, SANS, SERIF, Scoreboard, ShowContext, Subtitles, YtCard, badgeLeft, useShow} from './Chess';
import {CHESS_SHOWS} from '../chessShows';
import './fonts';

// A «Шахматный разбор» video for TikTok, vertical 1080x1920. The picture and the dialogue are the meme scene
// (public/<id>/scene.mp4, cut by audio/make_chess_audio.py); everything else is drawn here.
// Frame 0 is the cover; the scene runs from frame 1, so video time v = frame / fps matches cues.json.
export const ChessVideo: React.FC<{id: string; withAudio?: boolean}> = ({id, withAudio = true}) => {
  const show = CHESS_SHOWS[id];
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const v = frame / fps;
  return (
    <ShowContext.Provider value={show}>
      {frame === 0 ? (
        <CoverPage />
      ) : (
        <AbsoluteFill>
          <Board />
          <Scoreboard v={v} />
          <Frame>
            <Sequence from={1}>
              <OffthreadVideo src={staticFile(`${show.cfg.id}/scene.mp4`)} muted style={{width: show.FOOT.w, height: show.FOOT.h, objectFit: 'cover'}} />
            </Sequence>
          </Frame>
          <EvalBar v={v} />
          <BadgePop v={v} />
          <MoveCard v={v} />
          <Subtitles v={v} />
          <Results v={v} />
          <YtCard v={v} />
        </AbsoluteFill>
      )}
      {withAudio ? <Audio src={staticFile(`audio/${show.cfg.id}.wav`)} /> : null}
    </ShowContext.Provider>
  );
};

// Frame 0 of the video and the TikTok cover: the cover frame of the scene, the title and the final verdict.
const CoverPage: React.FC = () => {
  const show = useShow();
  const {cfg, FOOT} = show;
  return (
    <AbsoluteFill>
      <Board />
      <Scoreboard v={0} />
      <Frame>
        <Img src={staticFile(`${cfg.id}/cover.jpg`)} style={{width: FOOT.w, height: FOOT.h, objectFit: 'cover'}} />
      </Frame>
      <EvalBar v={0} p={show.DRAW ? 50 : 0} />
      <div style={{position: 'absolute', left: badgeLeft(show, show.WINNER, 230), top: FOOT.y + 30, filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.6))'}}>
        <Glyph g={show.DRAW ? 'draw' : 'mate'} size={230} />
      </div>
      <div style={{position: 'absolute', left: 40, width: 1000, top: 372, textAlign: 'center'}}>
        <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: cfg.cover.size ?? 108, lineHeight: 1.0, color: '#fff', textShadow: '0 8px 30px rgba(0,0,0,0.7)'}}>
          {cfg.cover.title.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 44, color: CREAM, marginTop: 20}}>{cfg.cover.sub}</div>
      </div>
    </AbsoluteFill>
  );
};

export const ChessCover: React.FC<{id: string}> = ({id}) => (
  <ShowContext.Provider value={CHESS_SHOWS[id]}>
    <CoverPage />
  </ShowContext.Provider>
);
