import React from 'react';
import {C, Cam, DISPLAY, Glow, H, LinGrad, Par, Sky, Skyline, W, Water, camLerp, clamp01, drift, easeInOut, easeOut, lerp, pop, ramp, rnd, skyline, smooth} from './kit';
import {PC_ON, FINAL} from './cues';
import {Fan, Look} from './room';
import type {SceneProps} from './scenes1';

// ======================================================================== 8–9. the flooded city: the PC players on rafts
const PCGUY: Look = {top: '#3fd07c', topD: '#1f9160', pants: '#2b2b66', pantsD: '#1d1f4a', hair: '#e8893a', hairL: '#ffb86b', phones: true, glasses: true};
const PCGUY2: Look = {top: '#b08af0', topD: '#7a56d6', pants: '#2b2b66', pantsD: '#1d1f4a', hair: '#2b1a55', hairL: '#4a2f8a', phones: true};
const SEA = 1230;
const TOPS = skyline(17, -500, W + 500, 110, 200, 60, 520);
const TOPS_FAR = skyline(29, -500, W + 500, 70, 130, 40, 380);

const hue = (h: number) => `hsl(${((h % 360) + 360) % 360} 100% 62%)`;

// a PC tower with an RGB strip and two fans; origin at the bottom centre, 110 x 170
export const Tower: React.FC<{x: number; y: number; s?: number; t: number; seed?: number; rot?: number}> = ({x, y, s = 1, t, seed = 0, rot = 0}) => {
  const h = t * 90 + seed * 47;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-55} y={-170} width={110} height={170} rx={10} fill="#171031" />
      <rect x={-55} y={-170} width={110} height={170} rx={10} fill="none" stroke="#3b2b78" strokeWidth={4} />
      <rect x={-45} y={-160} width={64} height={150} rx={6} fill="#0b0420" />
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(-13 ${-122 + i * 70})`}>
          <circle r={26} fill="none" stroke={hue(h + i * 60)} strokeWidth={6} />
          <g transform={`rotate(${t * 500 + i * 40})`}>
            <path d="M0 -20 L5 0 L0 20 L-5 0 Z M-20 0 L0 5 L20 0 L0 -5 Z" fill={hue(h + i * 60)} opacity={0.75} />
          </g>
        </g>
      ))}
      <rect x={30} y={-158} width={10} height={146} rx={5} fill={hue(h + 140)} />
      <circle cx={-34} cy={-178 + 12} r={0} />
      <Glow x={-10} y={-86} r={130} c={hue(h + 30)} o={0.4} />
    </g>
  );
};

const FloodCity: React.FC<{cam: Cam; v: number; dawn?: number}> = ({cam, v, dawn = 0}) => {
  const top = dawn ? '#3aa0ff' : '#2a1463';
  return (
    <>
      <Sky id="fc-sky" stops={dawn ? [[0, '#2f8cff'], [0.4, '#8fd0ff'], [0.62, '#ffd9c0'], [0.72, '#ffb38a']] : [[0, '#1a0f4a'], [0.3, '#5a2192'], [0.5, '#c2337f'], [0.62, '#ff7a5c'], [0.7, '#ffc24b']]} />
      <Par cam={cam} d={0.06}>
        <Glow x={540} y={SEA - 60} r={900} c={dawn ? '#fff3c4' : '#ff9a5c'} o={0.9} />
        <circle cx={540} cy={SEA - 40} r={190} fill={dawn ? '#fffbe6' : '#ffe08a'} />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${((i * 500 + v * 10) % 1600) - 300} ${420 + i * 160})`} opacity={dawn ? 0.9 : 0.35}>
            <rect x={0} y={0} width={300} height={44} rx={22} fill={dawn ? '#fff' : '#ff8fc2'} />
            <rect x={70} y={-28} width={160} height={52} rx={26} fill={dawn ? '#fff' : '#ff8fc2'} />
          </g>
        ))}
      </Par>
      <Par cam={cam} d={0.3}>
        <Skyline b={TOPS_FAR} baseY={SEA - 10} fill={dawn ? '#8fb0f0' : '#7a2b9c'} win={dawn ? ['#fff'] : [C.amber]} lit={0.05} cell={22} />
      </Par>
      <Par cam={cam} d={0.55}>
        <Skyline b={TOPS} baseY={SEA} fill={dawn ? '#5a78d6' : '#3b1a72'} win={dawn ? ['#bfe0ff'] : ['#ffb86b']} lit={0.08} cell={26} rim={dawn ? '#fff' : '#ff8fc2'} />
        {/* reflections */}
        <g transform={`translate(0 ${SEA * 2}) scale(1 -1)`} opacity={0.25}>
          <Skyline b={TOPS} baseY={SEA} fill={dawn ? '#5a78d6' : '#3b1a72'} />
        </g>
      </Par>
    </>
  );
};

// the raft: planks on barrels, the player, his monitor and tower. Origin: the seat of the player.
const Raft: React.FC<{x: number; y: number; s: number; v: number; text?: number; look?: Look; screen?: boolean; flip?: boolean}> = ({x, y, s, v, text = 0, look = PCGUY, screen = true, flip}) => {
  const bob = Math.sin(v * 1.6 + x * 0.01) * 8;
  const tilt = Math.sin(v * 1.2 + x * 0.02) * 2.2;
  const line1 = 'GTA 6 ДЛЯ ПК:';
  const line2 = 'НЕ АНОНСИРОВАНО';
  const n = Math.floor(text * (line1.length + line2.length + 2));
  const cursor = Math.floor(v * 3) % 2 === 0 ? '▌' : '';
  return (
    <g transform={`translate(${x} ${y + bob * s}) rotate(${tilt}) scale(${flip ? -s : s} ${s})`}>
      {/* barrels + planks */}
      {[-230, 60, 350].map((bx, i) => (
        <g key={i}>
          <rect x={bx - 70} y={236} width={140} height={84} rx={30} fill={['#ff8a3c', '#2f6bff', '#ff8a3c'][i]} />
          <rect x={bx - 70} y={258} width={140} height={10} fill="#fff" opacity={0.35} />
        </g>
      ))}
      <rect x={-340} y={206} width={860} height={40} rx={10} fill="#b8642a" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={-340 + i * 145} y={206} width={6} height={40} fill="#7a3a1e" opacity={0.6} />
      ))}
      <rect x={-340} y={206} width={860} height={8} rx={4} fill="#e8a05a" />
      {/* a pole with a flag made of a mouse pad */}
      <rect x={-316} y={-330} width={12} height={540} rx={6} fill="#7a3a1e" />
      <path d={`M-304 -324 L-190 ${-300 + Math.sin(v * 4) * 8} L-304 -250 Z`} fill={C.magenta} />
      {/* tower */}
      <Tower x={-200} y={206} s={1.45} t={v} seed={x} />
      {/* crate desk + monitor */}
      <rect x={210} y={66} width={300} height={142} rx={10} fill="#d9843a" />
      <path d="M210 66 L510 66 M210 136 L510 136 M360 66 L360 206" stroke="#7a3a1e" strokeWidth={6} opacity={0.6} />
      {screen ? (
        <g transform="translate(200 -262) skewY(-3)">
          <rect x={190} y={280} width={30} height={62} fill="#120a2e" />
          <rect x={130} y={328} width={150} height={16} rx={8} fill="#120a2e" />
          <rect x={-18} y={-18} width={456} height={306} rx={18} fill="#0b0420" />
          <rect x={0} y={0} width={420} height={270} rx={8} fill="#140c33" />
          <Glow x={210} y={135} r={420} c="#ff4d5e" o={0.35 * clamp01(text * 4)} />
          <text x={210} y={100} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={37} fill="#fff">
            {line1.slice(0, n)}
          </text>
          <text x={210} y={162} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={28} fill="#ff4d5e">
            {n > line1.length ? line2.slice(0, n - line1.length) : ''}
            {text > 0 && text < 1 ? cursor : ''}
          </text>
          {text >= 1 ? (
            <g transform={`translate(210 216) scale(${pop(v - PC_ON - 1.1, 9)})`}>
              <rect x={-84} y={-28} width={168} height={56} rx={28} fill="#ff4d5e" />
              <text y={12} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={31} fill="#fff">
                ЖДИ
              </text>
            </g>
          ) : null}
          <path d="M0 0 L140 0 L50 270 L0 270 Z" fill="#fff" opacity={0.05} />
        </g>
      ) : null}
      {/* his seat: a crate */}
      <rect x={-84} y={14} width={208} height={194} rx={10} fill="#c9742f" />
      <path d="M-84 80 L124 80 M20 14 L20 206" stroke="#7a3a1e" strokeWidth={6} opacity={0.6} />
      {/* the player: keyboard on his knees */}
      <Fan x={20} y={0} t={v} look={look} rim={screen ? '#ff8fa8' : C.amber} hands={[52, -34]} tired={0.5} />
      <rect x={-78} y={-46} width={196} height={38} rx={9} fill="#120a2e" />
      {[0, 1, 2].map((r) => (
        <rect key={r} x={-68} y={-40 + r * 10} width={176} height={6} rx={3} fill={hue(v * 120 + r * 50)} opacity={0.9} />
      ))}
    </g>
  );
};

export const RaftShot: React.FC<SceneProps & {close?: boolean}> = ({v, t, k, close}) => {
  const cam = close
    ? drift(camLerp({x: 0, y: -60, z: 1.0}, {x: 30, y: -90, z: 1.06}, easeOut(k)), v, 3)
    : drift(camLerp({x: 0, y: -160, z: 0.96}, {x: 0, y: 20, z: 1.2}, easeInOut(k)), v, 4);
  const text = close ? clamp01((v - PC_ON) / 1.0) : 0;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <FloodCity cam={cam} v={v} />
      <Par cam={cam} d={1}>
        <Water id="rf-sea" y={SEA} t={v} top="#7a3fb8" bottom="#1a0f4a" amp={8} shine="#ffd9a0" />
        <path d={`M440 ${SEA + 10} L640 ${SEA + 10} L760 2400 L320 2400 Z`} fill="#ffb86b" opacity={0.25} style={{mixBlendMode: 'screen'}} />
        {close ? <Raft x={290} y={850} s={1.16} v={v} text={text} /> : <Raft x={480} y={1090} s={0.5} v={v} />}
        <Water id="rf-sea2" y={close ? 1250 : 1262} t={v + 2} top="#6a34a8" bottom="#150a3a" o={0.92} amp={10} shine="#ffd9a0" />
        {/* things drifting by */}
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${((i * 420 + v * 26) % 1500) - 200} ${(close ? 1262 : 1274) + Math.sin(v * 1.5 + i) * 6}) rotate(${Math.sin(v + i) * 10})`}>
            {i === 0 ? <rect x={-50} y={-12} width={100} height={22} rx={6} fill="#ff8fb0" /> : i === 1 ? <circle r={20} fill="none" stroke="#ff3b4e" strokeWidth={12} /> : <rect x={-34} y={-10} width={68} height={20} rx={4} fill="#fff3df" />}
          </g>
        ))}
      </Par>
    </svg>
  );
};

// the new city: PC towers stacked like bricks
const COLS = 4;
const BRICK_W = 150;
const BRICK_H = 232;
export const Build: React.FC<SceneProps> = ({v, t, k, d}) => {
  const perSec = 3.1;
  const placed = t * perSec;
  const rows = Math.floor(placed / COLS) + 1;
  const topY = SEA - 40 - Math.min(placed / COLS, 6.4) * BRICK_H;
  const cam = drift({x: 0, y: lerp(60, Math.max(-560, (topY - 640) * 0.9), smooth(ramp(t, 0.6, 5.6))), z: lerp(1.0, 0.86, smooth(ramp(t, 0.6, 5.6)))}, v, 4);
  const bricks: React.ReactNode[] = [];
  for (let i = 0; i < Math.min(Math.ceil(placed) + 1, COLS * 8); i++) {
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    const age = (placed - i) / perSec;
    if (age < -0.3) continue;
    const drop = age < 0 ? 1 : Math.max(0, 1 - age * 5);
    const squash = age > 0.2 ? 1 + Math.exp(-(age - 0.2) * 14) * 0.07 * Math.cos((age - 0.2) * 40) : 1;
    const x = 540 + (c - (COLS - 1) / 2) * BRICK_W + (r % 2 ? BRICK_W * 0.0 : 0);
    const y = SEA - 34 - r * BRICK_H - drop * drop * 900;
    bricks.push(
      <g key={i} transform={`translate(${x} ${y}) scale(${1 / squash} ${squash})`} opacity={age < 0 ? clamp01(1 + age * 6) : 1}>
        <Tower x={0} y={0} s={1.32} t={v} seed={i * 1.7} />
      </g>,
    );
  }
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <FloodCity cam={cam} v={v} dawn={1} />
      <Par cam={cam} d={1}>
        <Water id="bd-sea" y={SEA} t={v} top="#2fd0e0" bottom="#1a5fc2" amp={8} />
        {/* foundation platform */}
        <rect x={190} y={SEA - 34} width={700} height={60} rx={12} fill="#b8642a" />
        <rect x={190} y={SEA - 34} width={700} height={10} rx={5} fill="#e8a05a" />
        <Glow x={540} y={(SEA + topY) / 2} r={560} ry={Math.max(300, (SEA - topY) * 0.8)} c="#b08af0" o={0.35} />
        {bricks}
        <Raft x={96} y={1016} s={0.44} v={v} screen={false} />
        <Raft x={1010} y={1026} s={0.44} v={v + 2} screen={false} look={PCGUY2} flip />
        <Water id="bd-sea2" y={SEA + 34} t={v + 2} top="#27c0d6" bottom="#164fb0" o={0.92} amp={10} />
      </Par>
    </svg>
  );
};
