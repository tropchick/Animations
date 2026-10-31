import React from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate} from 'remotion';
import '@fontsource/oswald/500.css';
import '@fontsource/oswald/600.css';
import {WORDS} from './cues';

// Captions in the style of the reference: a condensed font on a dark rounded plate,
// the meme title in white at the top, spoken lines in yellow lower down.
export const COND = "'Oswald', 'Arial Narrow', sans-serif";
export const YELLOW = '#f7c948';
const PLATE = 'rgba(20,17,15,0.86)';

const handle = delayRender('Loading Oswald');
Promise.all([document.fonts.load("600 60px 'Oswald'"), document.fonts.load("500 60px 'Oswald'")])
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));

const fade = (v: number, from: number, to: number, fi = 0.15, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const Plate: React.FC<{children: React.ReactNode; color?: string; size?: number; italic?: boolean}> = ({children, color = YELLOW, size = 62, italic}) => (
  <div
    style={{
      display: 'inline-block',
      background: PLATE,
      borderRadius: 22,
      padding: '10px 28px 14px',
      fontFamily: COND,
      fontWeight: 600,
      fontStyle: italic ? 'italic' : 'normal',
      fontSize: size,
      lineHeight: 1.18,
      color,
      textAlign: 'center',
      boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
    }}
  >
    {children}
  </div>
);

export const TitlePlate: React.FC<{opacity?: number}> = ({opacity = 1}) => (
  <div style={{position: 'absolute', left: 70, right: 70, top: 250, textAlign: 'center', opacity}}>
    <Plate color="#ffffff" size={72}>
      Когда в автобус зашла
      <br />
      очень красивая девушка
    </Plate>
  </div>
);

// a line appears word by word as it is spoken and leaves 0.4 s after the last word
const Line: React.FC<{v: number; who: 'girl' | 'guy' | 'granny'; italic?: boolean; text?: string}> = ({v, who, italic, text}) => {
  const words = WORDS[who];
  const start = words[0][0] - 0.05;
  const end = words[words.length - 1][1] + 0.45;
  const o = fade(v, start, end, 0.08, 0.15);
  if (o <= 0) return null;
  const shown = words.filter((w) => v >= w[0] - 0.04);
  const tokens = (text ?? words.map((w) => w[2]).join(' ')).split(' ');
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1400, textAlign: 'center', opacity: o}}>
      <Plate italic={italic}>
        {tokens.map((t, i) => (
          <span key={i} style={{opacity: i < shown.length ? 1 : 0}}>
            {t}
            {i < tokens.length - 1 ? ' ' : ''}
          </span>
        ))}
      </Plate>
    </div>
  );
};

export const Overlay: React.FC<{v: number}> = ({v}) => (
  <AbsoluteFill>
    <TitlePlate opacity={fade(v, -1, 2.95, 0.1, 0.25)} />
    <Line v={v} who="girl" italic text="Он уже минуту на меня смотрит…" />
    <Line v={v} who="guy" text="Девушка… вы на следующей выходите?" />
    <Line v={v} who="granny" text="Выхожу, милок." />
  </AbsoluteFill>
);
