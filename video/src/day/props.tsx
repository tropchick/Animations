import React from 'react';
import {C, DISPLAY, Glow, LinGrad, rnd, starPath} from './kit';

// ---------- the game box (our own art: sunset, palms, «GTA 6» in our font; no studio logo) ----------
// drawn in a 300x400 frame with the origin at the box centre
export const GameBox: React.FC<{x: number; y: number; s?: number; rot?: number; id: string; side?: boolean; glow?: number}> = ({x, y, s = 1, rot = 0, id, side = true, glow = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <defs>
      <LinGrad id={`${id}a`} stops={[[0, '#2a1260'], [0.38, '#b02a8f'], [0.62, '#ff5e7a'], [0.82, '#ff9a4a'], [1, '#ffd36b']]} />
      <LinGrad id={`${id}s`} stops={[[0, '#fff2b0'], [1, '#ff7a59']]} />
      <LinGrad id={`${id}e`} stops={[[0, '#17103a'], [1, '#07041a']]} />
      <clipPath id={`${id}c`}>
        <rect x={-150} y={-158} width={300} height={358} rx={6} />
      </clipPath>
    </defs>
    {glow > 0 ? <Glow x={0} y={0} r={520} c={C.magenta} o={0.5 * glow} /> : null}
    {side ? <path d="M150 -200 L176 -186 L176 214 L150 200 Z" fill={`url(#${id}e)`} /> : null}
    <rect x={-150} y={-200} width={300} height={400} rx={10} fill="#140c33" />
    {/* top strip */}
    <rect x={-150} y={-200} width={300} height={42} rx={10} fill="#2f6bff" />
    <rect x={-150} y={-176} width={300} height={18} fill="#2f6bff" />
    <rect x={-132} y={-188} width={56} height={14} rx={7} fill="#fff" opacity={0.9} />
    <rect x={92} y={-188} width={40} height={14} rx={7} fill="#fff" opacity={0.35} />
    <g clipPath={`url(#${id}c)`}>
      <rect x={-150} y={-158} width={300} height={358} fill={`url(#${id}a)`} />
      {/* sun */}
      <circle cx={0} cy={36} r={86} fill={`url(#${id}s)`} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={-100} y={58 + i * 17} width={200} height={4 + i * 2} fill="#ff5e7a" opacity={0.95} />
      ))}
      {/* far skyline */}
      <path d="M-150 120 L-150 96 L-128 96 L-128 70 L-104 70 L-104 100 L-84 100 L-84 84 L-60 84 L-60 108 L52 108 L52 78 L72 78 L72 60 L92 60 L92 92 L118 92 L118 74 L150 74 L150 120 Z" fill="#7a1f73" opacity={0.85} />
      {/* ground */}
      <rect x={-150} y={118} width={300} height={90} fill="#1b0b3a" />
      <path d="M-150 118 L150 118" stroke="#ff8fb8" strokeWidth={2} opacity={0.8} />
      {/* palms */}
      {[
        [-108, 124, 1, 1],
        [112, 126, 0.86, -1],
      ].map(([px, py, ps, dir], i) => (
        <g key={i} transform={`translate(${px} ${py}) scale(${ps * dir} ${ps})`}>
          <path d="M-4 0 Q4 -70 22 -150 L28 -150 Q12 -70 5 0 Z" fill="#12072b" />
          {[-2.5, -1.9, -1.3, -0.7, -0.1, 0.5].map((a, k) => {
            const ex = Math.cos(a) * 74;
            const ey = Math.sin(a) * 50 + 30;
            return <path key={k} d={`M25 -150 Q${25 + ex * 0.5} ${-150 + ey * 0.2 - 26} ${25 + ex} ${-150 + ey} Q${25 + ex * 0.5} ${-150 + ey * 0.4 - 6} 25 -150 Z`} fill="#12072b" />;
          })}
        </g>
      ))}
      {/* car */}
      <path d="M-62 152 Q-58 136 -30 134 L-14 120 L36 120 L54 135 Q76 137 78 152 Z" fill="#0b041c" />
      <circle cx={-34} cy={153} r={11} fill="#0b041c" />
      <circle cx={50} cy={153} r={11} fill="#0b041c" />
      <rect x={66} y={139} width={10} height={4} fill="#ffe08a" />
      {/* title */}
      <text x={0} y={-66} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={88} fill="#ff2e88" transform="skewX(-8)" opacity={0.9}>
        GTA
      </text>
      <text x={-4} y={-70} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={88} fill="#fff" transform="skewX(-8)">
        GTA
      </text>
      <text x={96} y={18} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={112} fill="#12072b" transform="skewX(-8)" opacity={0.55}>
        6
      </text>
      <text x={90} y={12} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={112} fill="#ffe14d" transform="skewX(-8)">
        6
      </text>
      {/* gloss */}
      <path d="M-150 -158 L-40 -158 L-150 60 Z" fill="#fff" opacity={0.07} />
    </g>
    <rect x={-150} y={-200} width={300} height={400} rx={10} fill="none" stroke="#fff" strokeOpacity={0.22} strokeWidth={2.5} />
  </g>
);

// ---------- gamepad (front view), origin at centre, ~120 px wide ----------
export const Gamepad: React.FC<{x: number; y: number; s?: number; rot?: number; body?: string; dark?: string; light?: string; press?: number}> = ({x, y, s = 1, rot = 0, body = '#f4f1ff', dark = '#231a45', light, press = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-38 -22 Q-60 -24 -64 2 Q-70 30 -58 40 Q-46 46 -36 24 L36 24 Q46 46 58 40 Q70 30 64 2 Q60 -24 38 -22 Z" fill={body} />
    {light ? <path d="M-38 -22 Q-60 -24 -64 2 Q-66 12 -66 20" stroke={light} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.9} /> : null}
    <rect x={-18} y={-18} width={36} height={20} rx={5} fill={dark} opacity={0.85} />
    <circle cx={-26} cy={12} r={9} fill={dark} />
    <circle cx={22} cy={12} r={9} fill={dark} />
    <rect x={-50} y={-9} width={18} height={6} rx={2} fill={dark} />
    <rect x={-44} y={-15} width={6} height={18} rx={2} fill={dark} />
    <circle cx={42} cy={-12 + press * 1.5} r={4.6} fill={press > 0.3 ? '#ffe14d' : C.magenta} />
    <circle cx={52} cy={-4} r={4.6} fill={C.teal} />
    <circle cx={32} cy={-4} r={4.6} fill={C.amber} />
    <circle cx={42} cy={4} r={4.6} fill={C.blue} />
  </g>
);

// ---------- energy can ----------
export const Can: React.FC<{x: number; y: number; s?: number; rot?: number; c?: string; c2?: string}> = ({x, y, s = 1, rot = 0, c = C.teal, c2 = '#0b8f86'}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-13} y={-46} width={26} height={46} rx={5} fill={c} />
    <rect x={3} y={-46} width={10} height={46} rx={4} fill={c2} />
    <rect x={-13} y={-46} width={26} height={7} rx={3} fill="#d9d4ee" />
    <path d={starPath(-3, -22, 7)} fill="#fff" opacity={0.9} />
  </g>
);

// ---------- game console (white tower), origin at the base centre ----------
export const Console: React.FC<{x: number; y: number; s?: number; hot?: number; t?: number}> = ({x, y, s = 1, hot = 0, t = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {hot > 0 ? <Glow x={0} y={-70} r={150} c={C.orange} o={0.55 * hot} /> : null}
    <path d="M-34 0 L-40 -140 Q-40 -150 -30 -150 L30 -150 Q40 -150 40 -140 L34 0 Z" fill="#f4f1ff" />
    <path d="M10 0 L14 -150 L30 -150 Q40 -150 40 -140 L34 0 Z" fill="#cfc8ea" />
    <rect x={-14} y={-150} width={28} height={150} fill="#171031" />
    <rect x={-9} y={-128} width={3} height={90} rx={1.5} fill={hot > 0.2 ? C.orange : C.blue} opacity={0.9} />
    <rect x={-46} y={-4} width={92} height={10} rx={5} fill="#231a45" />
    {hot > 0
      ? [0, 1, 2].map((i) => {
          const k = (t * 0.6 + i / 3) % 1;
          return <path key={i} d={`M${-22 + i * 22} ${-160 - k * 90} q10 -14 0 -28 q-10 -14 0 -28`} stroke={C.orange} strokeWidth={5} fill="none" strokeLinecap="round" opacity={(1 - k) * 0.8 * hot} />;
        })
      : null}
  </g>
);

// ---------- wanted stars ----------
export const Wanted: React.FC<{x: number; y: number; n: number; s?: number; t: number; on?: number}> = ({x, y, n, s = 1, t, on = n}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({length: n}, (_, i) => {
      const lit = i < on;
      const blink = lit ? 0.75 + 0.25 * Math.sin(t * 9 + i) : 1;
      return (
        <g key={i} transform={`translate(${(i - (n - 1) / 2) * 62} 0)`}>
          {lit ? <Glow x={0} y={0} r={56} c="#ffe14d" o={0.6 * blink} /> : null}
          <path d={starPath(0, 0, 26)} fill={lit ? '#ffe14d' : 'rgba(255,255,255,0.18)'} stroke={lit ? '#fff7c2' : 'rgba(255,255,255,0.35)'} strokeWidth={3} strokeLinejoin="round" />
        </g>
      );
    })}
  </g>
);

// little confetti / sparks burst
export const Burst: React.FC<{x: number; y: number; t: number; n?: number; seed?: number; cols?: string[]; power?: number; g?: number}> = ({x, y, t, n = 40, seed = 1, cols = [C.magenta, C.cyan, C.amber, '#fff'], power = 700, g = 900}) => {
  if (t <= 0) return null;
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const a = rnd(seed + i) * Math.PI * 2;
        const sp = power * (0.35 + 0.65 * rnd(seed + i * 2.7));
        const px = x + Math.cos(a) * sp * t * Math.exp(-t * 0.9);
        const py = y + Math.sin(a) * sp * t * Math.exp(-t * 0.9) + 0.5 * g * t * t;
        const o = Math.max(0, 1 - t / 1.6);
        return <rect key={i} x={px - 5} y={py - 5} width={10} height={10} rx={2} fill={cols[i % cols.length]} opacity={o} transform={`rotate(${t * 400 * (rnd(i) - 0.5)} ${px} ${py})`} />;
      })}
    </g>
  );
};
