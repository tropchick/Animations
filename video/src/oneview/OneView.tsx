import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {clamp01, outBack, ramp, smooth} from '../chess/cues';
import {CREAM, SANS, SERIF} from '../chess/Chess';
import '../chess/fonts';

// «Исторический рекорд»: a pompous award ceremony for a post that got 1 view (the user's screenshot).
// Vertical 1080x1920 for TikTok. Frame 0 is the cover (the finished stage); the show runs from frame 1.
// Timeline (seconds) — the soundtrack (audio/make_oneview_audio.py) hits the same marks:
export const T = {
  roll: 0.1, // drumroll under sweeping spotlights
  card: 1.6, // crash + fanfare: the screenshot flies in
  trophy: 2.4, // the trophy rises out of the screenshot's little cup
  title: 3.2, // timpani + crowd: «ИСТОРИЧЕСКИЙ РЕКОРД», confetti
  fireworks: [4.8, 6.0, 7.4],
  thanks: 7.8, // «Спасибо моему единственному зрителю»
  button: 9.4, // «Создайте новую публикацию» is pressed
  end: 11.0,
};
export const ONEVIEW_FRAMES = Math.round(T.end * 30) + 1;

const GOLD = 'linear-gradient(180deg, #fff6c8 0%, #ffd34d 38%, #e5a812 62%, #fff0a8 100%)';

// a small deterministic random generator, so every render draws the same confetti
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const Spotlights: React.FC<{v: number}> = ({v}) => {
  const on = smooth(ramp(v, 0.05, 0.6));
  const beams = [
    {x: 160, a: -28 + 22 * Math.sin(v * 2.1)},
    {x: 920, a: 28 - 22 * Math.sin(v * 2.1 + 0.6)},
    {x: 540, a: 10 * Math.sin(v * 1.3 + 1.2)},
  ];
  return (
    <AbsoluteFill style={{opacity: on}}>
      {beams.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: b.x - 260,
            top: -200,
            width: 520,
            height: 2300,
            transformOrigin: '50% 0%',
            rotate: `${b.a}deg`,
            background: 'linear-gradient(180deg, rgba(255,240,190,0.55), rgba(255,240,190,0.05) 75%, transparent)',
            clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)',
            filter: 'blur(18px)',
            mixBlendMode: 'screen',
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const Trophy: React.FC<{v: number}> = ({v}) => {
  const k = outBack(clamp01((v - T.trophy) / 0.6));
  if (v < T.trophy) return null;
  // three turns around its vertical axis, slowing down so it ends facing the camera
  const x = clamp01((v - T.trophy) / (T.button - T.trophy + 0.6));
  const spin = Math.cos(6 * Math.PI * (1 - (1 - x) * (1 - x)));
  const shine = ((v - T.trophy) * 0.7) % 1;
  return (
    <div style={{position: 'absolute', left: 540 - 210, top: 500, width: 420, height: 440, translate: `0 ${(1 - k) * 380}px`, scale: `${0.2 + 0.8 * k}`, filter: 'drop-shadow(0 0 60px rgba(255,200,60,0.65)) drop-shadow(0 20px 30px rgba(0,0,0,0.6))'}}>
      <svg width={420} height={440} viewBox="0 0 420 440" style={{scale: `${Math.max(0.25, Math.abs(spin))} 1`}}>
        <defs>
          <linearGradient id="gold" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#b9800a" />
            <stop offset={Math.max(0.05, shine - 0.15)} stopColor="#f2c230" />
            <stop offset={shine} stopColor="#fff7c9" />
            <stop offset={Math.min(0.95, shine + 0.15)} stopColor="#f2c230" />
            <stop offset="1" stopColor="#a86f06" />
          </linearGradient>
        </defs>
        {/* handles */}
        <path d="M95 70 C 10 70, 10 190, 120 215" fill="none" stroke="url(#gold)" strokeWidth={26} strokeLinecap="round" />
        <path d="M325 70 C 410 70, 410 190, 300 215" fill="none" stroke="url(#gold)" strokeWidth={26} strokeLinecap="round" />
        {/* cup, stem, base */}
        <path d="M80 40 H340 C 340 190, 290 260, 210 270 C 130 260, 80 190, 80 40 Z" fill="url(#gold)" />
        <rect x={185} y={265} width={50} height={70} fill="url(#gold)" />
        <path d="M130 335 H290 L310 385 H110 Z" fill="url(#gold)" />
        <rect x={90} y={385} width={240} height={40} rx={8} fill="#3a2a10" />
        <text x={210} y={180} textAnchor="middle" fontFamily="Spectral, serif" fontWeight={700} fontSize={130} fill="#8a5a00" opacity={0.85}>1</text>
      </svg>
    </div>
  );
};

const Confetti: React.FC<{v: number; at: number}> = ({v, at}) => {
  const age = v - at;
  if (age < 0) return null;
  const colors = ['#ffd34d', '#ff5a5f', '#4fc3f7', '#7fdc6b', '#ffffff', '#c58cff'];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: 170}, (_, i) => {
        const left = i % 2 === 0; // two cannons, bottom left and bottom right
        const ang = (left ? 1 : -1) * (0.15 + rand(i) * 0.5); // radians from vertical, towards the middle
        const sp = 1500 + rand(i + 9) * 1300;
        const delay = rand(i + 3) * 0.25;
        const t = Math.max(0, age - delay);
        const drag = 1 - Math.exp(-t * 2.2);
        const x = (left ? 60 : 1020) + (Math.sin(ang) * sp * drag) / 2.2 + Math.sin(t * 5 + i) * 30 * t;
        const y = 1500 - (Math.cos(ang) * sp * drag) / 2.2 + 260 * t * t;
        if (y > 2000 || t === 0) return null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 18 + rand(i + 5) * 14,
              height: 10 + rand(i + 7) * 8,
              background: colors[i % colors.length],
              rotate: `${t * (300 + rand(i + 11) * 600)}deg`,
              scale: `1 ${Math.cos(t * (6 + rand(i) * 6))}`,
              borderRadius: 3,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Firework: React.FC<{v: number; at: number; x: number; y: number; hue: number}> = ({v, at, x, y, hue}) => {
  const age = v - at;
  if (age < 0 || age > 1.6) return null;
  const r = 260 * (1 - Math.exp(-age * 4));
  const fade = 1 - ramp(age, 0.7, 1.6);
  return (
    <AbsoluteFill style={{opacity: fade, mixBlendMode: 'screen'}}>
      {Array.from({length: 36}, (_, i) => {
        const a = (i / 36) * Math.PI * 2;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + Math.cos(a) * r - 7,
              top: y + Math.sin(a) * r + 120 * age * age - 7,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: `hsl(${hue + (i % 3) * 20}, 100%, 70%)`,
              boxShadow: `0 0 18px hsl(${hue}, 100%, 65%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Stage: React.FC<{v: number}> = ({v}) => {
  const card = outBack(clamp01((v - T.card) / 0.55));
  const glow = smooth(ramp(v, T.trophy, T.trophy + 0.5));
  const title = outBack(clamp01((v - T.title) / 0.4));
  const thanks = smooth(ramp(v, T.thanks, T.thanks + 0.5));
  const press = v >= T.button ? 1 - 0.08 * Math.sin(Math.PI * clamp01((v - T.button) / 0.25)) : 1;
  const pulse = v >= T.button ? 0 : 0.5 + 0.5 * Math.sin(v * 6);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 35%, #3b2a12 0%, #160f08 55%, #070504 100%)'}}>
      <Spotlights v={v} />
      {/* rays behind the trophy */}
      <div style={{position: 'absolute', left: 540 - 700, top: 720 - 700, width: 1400, height: 1400, opacity: 0.5 * glow, rotate: `${v * 12}deg`, background: 'repeating-conic-gradient(rgba(255,210,90,0.35) 0deg 8deg, transparent 8deg 22deg)', maskImage: 'radial-gradient(circle, black 15%, transparent 62%)'}} />
      <div style={{position: 'absolute', left: 40, right: 40, top: 170, textAlign: 'center', scale: `${title}`, opacity: clamp01((v - T.title) / 0.1)}}>
        <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 100, lineHeight: 1.0, backgroundImage: GOLD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 6px 0 #6b4300) drop-shadow(0 18px 30px rgba(0,0,0,0.6))'}}>
          ИСТОРИЧЕСКИЙ
          <br />
          РЕКОРД
        </div>
      </div>
      <Trophy v={v} />
      <div style={{position: 'absolute', left: 40, top: 960, width: 1000, translate: `0 ${(1 - card) * 900}px`, rotate: `${(1 - card) * -8}deg`, borderRadius: 28, overflow: 'hidden', boxShadow: `0 0 ${80 * glow}px rgba(255,200,60,${0.7 * glow}), 0 30px 70px rgba(0,0,0,0.7)`, border: `5px solid rgba(255,211,77,${0.4 + 0.6 * glow})`}}>
        <Img src={staticFile('oneview/shot.jpg')} style={{width: 1000, display: 'block'}} />
      </div>
      <div style={{position: 'absolute', left: 40, right: 40, top: 1306, textAlign: 'center', opacity: thanks, translate: `0 ${(1 - thanks) * 30}px`, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 50, color: CREAM, textShadow: '0 4px 20px rgba(0,0,0,0.8)'}}>
        Спасибо моему единственному зрителю
      </div>
      {/* the screenshot's own link, now a big button the winner presses at the end */}
      <div style={{position: 'absolute', left: 190, width: 700, top: 1386, opacity: thanks, scale: `${press}`}}>
        <div style={{padding: '22px 0', borderRadius: 60, textAlign: 'center', background: '#6aa9ff', boxShadow: `0 0 ${20 + 40 * pulse}px rgba(106,169,255,0.8)`, fontFamily: SANS, fontWeight: 800, fontSize: 42, color: '#0b1a33'}}>
          Создайте новую публикацию
        </div>
      </div>
      {T.fireworks.map((at, i) => (
        <Firework key={at} v={v} at={at} x={[260, 820, 540][i]} y={[420, 380, 300][i]} hue={[45, 200, 330][i]} />
      ))}
      <Confetti v={v} at={T.title} />
      <Confetti v={v} at={T.fireworks[2]} />
    </AbsoluteFill>
  );
};

export const OneViewRecord: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <>
      <Stage v={frame === 0 ? 6.4 : frame / fps} />
      {withAudio ? <Audio src={staticFile('audio/oneview.wav')} /> : null}
    </>
  );
};

export const OneViewCover: React.FC = () => <Stage v={6.4} />;
