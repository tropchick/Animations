import React from 'react';
import {C, Cam, DISPLAY, Glow, H, LinGrad, Palm, Par, SCRIPT, Sky, Skyline, Stars, W, camLerp, clamp01, drift, easeInOut, easeOut, lerp, pop, ramp, rnd, skyline, smooth} from './kit';
import {Burst, GameBox} from './props';
import {LAPSE, PRESS, TICKS, WAVE, ZERO, shotEnd, shotStart} from './cues';
import {Room} from './room';

export type SceneProps = {v: number; t: number; k: number; d: number};

// ======================================================================== 1. night plaza: the giant box and the countdown
const FAR = skyline(11, -300, W + 300, 60, 130, 120, 420);
const MID = skyline(23, -300, W + 300, 80, 170, 160, 560);
const NEAR = skyline(37, -300, W + 300, 110, 220, 90, 330);

const Crowd: React.FC<{y: number; n: number; seed: number; fill: string; rim: string; t: number; jump: number; s?: number; phones?: number}> = ({y, n, seed, fill, rim, t, jump, s = 1, phones = 0.45}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const x = -120 + ((W + 240) * (i + rnd(seed + i) * 0.7)) / n;
      const r = (27 + rnd(seed + i * 3.3) * 9) * s;
      const bob = Math.sin(t * 2.2 + i * 1.7) * 4 * s - jump * (30 + rnd(seed + i * 5) * 50) * s * Math.abs(Math.sin(t * 9 + i));
      const yy = y + rnd(seed + i * 7.1) * 40 * s + bob;
      const hasPhone = rnd(seed + i * 11.3) < phones;
      const px = x + (rnd(seed + i * 2.9) - 0.5) * 30 * s;
      const py = yy - (95 + rnd(seed + i * 4.7) * 50) * s;
      return (
        <g key={i}>
          {hasPhone ? (
            <>
              <path d={`M${x + r * 0.9} ${yy + r * 1.6} Q${px + 26 * s} ${yy - 10 * s} ${px} ${py + 20 * s}`} stroke={fill} strokeWidth={15 * s} strokeLinecap="round" fill="none" />
              <rect x={px - 13 * s} y={py - 22 * s} width={26 * s} height={44 * s} rx={5 * s} fill="#0b0420" />
              <rect x={px - 10 * s} y={py - 19 * s} width={20 * s} height={38 * s} rx={3 * s} fill={i % 3 === 0 ? C.rose : C.cyan} opacity={0.95} />
              <Glow x={px} y={py} r={46 * s} c={i % 3 === 0 ? C.pink : C.cyan} o={0.55} />
            </>
          ) : null}
          <path d={`M${x - r * 1.9} ${yy + 420} L${x - r * 1.8} ${yy + r * 1.9} Q${x - r * 1.7} ${yy + r * 0.9} ${x - r * 0.6} ${yy + r * 0.8} L${x + r * 0.6} ${yy + r * 0.8} Q${x + r * 1.7} ${yy + r * 0.9} ${x + r * 1.8} ${yy + r * 1.9} L${x + r * 1.9} ${yy + 420} Z`} fill={fill} />
          <circle cx={x} cy={yy} r={r} fill={fill} />
          <path d={`M${x - r * 0.92} ${yy - r * 0.38} A${r} ${r} 0 0 1 ${x + r * 0.92} ${yy - r * 0.38}`} stroke={rim} strokeWidth={3.5 * s} fill="none" opacity={0.75} strokeLinecap="round" />
        </g>
      );
    })}
  </g>
);

const Beam: React.FC<{x: number; y: number; a: number; len: number; w: number; c: string; id: string; o?: number}> = ({x, y, a, len, w, c, id, o = 0.5}) => (
  <g transform={`translate(${x} ${y}) rotate(${a})`} style={{mixBlendMode: 'screen'}} opacity={o}>
    <defs>
      <LinGrad id={id} stops={[[0, c, 0], [0.12, c, 0.55], [1, c, 0]]} y1={1} y2={0} />
    </defs>
    <path d={`M-8 0 L${-w} ${-len} L${w} ${-len} L8 0 Z`} fill={`url(#${id})`} />
  </g>
);

const NeonSign: React.FC<{x: number; y: number; text: string; c: string; size?: number; font?: string; t: number; flick?: number; rot?: number}> = ({x, y, text, c, size = 44, font = DISPLAY, t, flick = 0, rot = 0}) => {
  const f = flick > 0 && Math.sin(t * 23 + flick * 9) > 0.93 ? 0.35 : 1;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={f}>
      <text textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={size} fill={c} filter="url(#bl8)" opacity={0.9}>
        {text}
      </text>
      <text textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={size} fill="#fff" stroke={c} strokeWidth={size * 0.05} paintOrder="stroke">
        {text}
      </text>
    </g>
  );
};

export const Filters: React.FC = () => (
  <defs>
    <filter id="bl4" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="4" />
    </filter>
    <filter id="bl8" x="-40%" y="-80%" width="180%" height="260%">
      <feGaussianBlur stdDeviation="9" />
    </filter>
    <filter id="bl20" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="20" />
    </filter>
  </defs>
);

export const Plaza: React.FC<SceneProps & {close?: boolean}> = ({v, t, k, close}) => {
  const tz = v - ZERO; // > 0 after midnight
  const zero = tz > 0;
  const camA: Cam = close ? {x: 0, y: -150, z: 1.42} : {x: -30, y: 110, z: 0.98};
  const camB: Cam = close ? {x: 0, y: -235, z: 1.72} : {x: 10, y: 0, z: 1.12};
  const cam = drift(camLerp(camA, camB, close ? easeInOut(k * 0.9 + 0.05) : easeOut(k * 0.85)), v, 5);
  const shake = zero ? Math.exp(-tz * 5) * 14 : 0;
  cam.x += Math.sin(v * 70) * shake;
  cam.y += Math.cos(v * 83) * shake;
  const left = Math.max(0, Math.ceil(ZERO - v - 0.001));
  const tick = TICKS.reduce((m, at) => (v >= at ? Math.max(m, Math.exp(-(v - at) * 7)) : m), 0);
  const digits = `00:00:0${Math.min(9, left)}`;
  const flash = zero ? Math.exp(-tz * 3.2) : 0;
  const boxGlow = 0.75 + 0.25 * Math.sin(v * 2.1) + flash * 1.5;
  const beamO = 0.42 + flash * 0.5;
  const timerCol = zero ? C.cyan : left <= 3 ? '#ff4d5e' : C.amber;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Filters />
      <Sky id="plz-sky" stops={[[0, '#05021a'], [0.3, '#150a3c'], [0.52, '#3d1576'], [0.68, '#8a2390'], [0.78, '#e0457f'], [0.86, '#ff8a5c']]} />
      <Par cam={cam} d={0.04}>
        <Stars t={v} n={110} y0={-200} y1={900} />
      </Par>
      <Par cam={cam} d={0.1}>
        <defs>
          <LinGrad id="plz-moon" stops={[[0, '#fff6d8'], [0.45, '#ffc9a0'], [1, '#ff5fa2']]} />
          <clipPath id="plz-moonc">
            <circle cx={540} cy={760} r={330} />
          </clipPath>
        </defs>
        <Glow x={540} y={780} r={760} c="#ff4f9a" o={0.55} />
        <circle cx={540} cy={760} r={330} fill="url(#plz-moon)" />
        <g clipPath="url(#plz-moonc)">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={150} y={840 + i * 44 + i * i * 2} width={800} height={8 + i * 5} fill="#7a1f86" opacity={0.92} />
          ))}
        </g>
      </Par>
      <Par cam={cam} d={0.22}>
        <Skyline b={FAR} baseY={1215} fill="#5a2192" win={[C.rose, '#ffd9a0']} lit={0.16} cell={22} />
        <rect x={-400} y={1210} width={W + 800} height={900} fill="#5a2192" />
      </Par>
      <Par cam={cam} d={0.36}>
        <Beam x={170} y={1240} a={-24 + Math.sin(v * 0.8) * 12 - flash * 10} len={1500} w={120} c={C.cyan} id="plz-b1" o={beamO} />
        <Beam x={900} y={1240} a={22 + Math.sin(v * 0.7 + 2) * 12 + flash * 10} len={1500} w={120} c={C.pink} id="plz-b2" o={beamO} />
      </Par>
      <Par cam={cam} d={0.45}>
        <Skyline b={MID} baseY={1250} fill="#2a1160" win={[C.cyan, C.pink, C.amber, '#fff']} lit={0.42} cell={27} dim="#3a1b7c" rim="#a34fd6" />
        <rect x={-400} y={1245} width={W + 800} height={900} fill="#2a1160" />
        <NeonSign x={196} y={742} text="24/7" c={C.cyan} size={40} t={v} flick={1} />
        <NeonSign x={905} y={830} text="ИГРЫ" c={C.magenta} size={38} t={v} flick={2} />
      </Par>
      <Par cam={cam} d={0.68}>
        <Skyline b={NEAR} baseY={1285} fill="#170a3b" win={[C.amber, C.cyan, C.pink]} lit={0.3} cell={32} dim="#231052" rim="#7a35c0" />
        <NeonSign x={150} y={1090} text="Релиз" c={C.pink} size={58} font={SCRIPT} t={v} rot={-6} />
        <NeonSign x={940} y={1120} text="00:00" c={C.amber} size={44} t={v} flick={3} />
      </Par>
      {/* plaza floor with reflections */}
      <Par cam={cam} d={1}>
        <defs>
          <LinGrad id="plz-floor" stops={[[0, '#2b1260'], [0.25, '#1a0b40'], [1, '#07031a']]} />
          <LinGrad id="plz-ref" stops={[[0, C.magenta, 0.55], [1, C.magenta, 0]]} />
          <LinGrad id="plz-step" stops={[[0, '#3b1d7e'], [1, '#1c0d47']]} />
        </defs>
        <rect x={-500} y={1280} width={W + 1000} height={1200} fill="url(#plz-floor)" />
        <rect x={-500} y={1280} width={W + 1000} height={4} fill="#b65cff" opacity={0.6} />
        <path d="M330 1300 L750 1300 L900 2000 L180 2000 Z" fill="url(#plz-ref)" opacity={0.5 + 0.2 * boxGlow} style={{mixBlendMode: 'screen'}} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} x={-500} y={1330 + i * 52 + i * i * 6} width={W + 1000} height={2} fill="#ff7ac0" opacity={0.12} />
        ))}
        {/* stage */}
        <path d="M250 1300 L830 1300 L860 1340 L220 1340 Z" fill="url(#plz-step)" />
        <path d="M290 1262 L790 1262 L830 1300 L250 1300 Z" fill="#4a2596" />
        <rect x={250} y={1298} width={580} height={5} fill={C.cyan} opacity={0.9} />
        <Glow x={540} y={1300} r={420} ry={50} c={C.cyan} o={0.6} />
        <Glow x={540} y={900} r={560} c={C.magenta} o={0.42 * boxGlow} />
        <Glow x={540} y={900} r={900} c="#ff9a5c" o={flash * 0.9} />
        <GameBox x={528} y={955} s={1.52} id="plz-box" />
        {/* rim lights on the box */}
        <rect x={297} y={651} width={5} height={606} fill={C.cyan} opacity={0.8} />
        <Glow x={300} y={950} r={90} ry={340} c={C.cyan} o={0.35} />
        {/* timer */}
        <g transform={`translate(540 ${548 - tick * 6}) scale(${1 + tick * 0.05 + flash * 0.12})`}>
          <rect x={-232} y={-64} width={464} height={118} rx={22} fill="#0a0420" stroke={timerCol} strokeWidth={5} />
          <Glow x={0} y={-4} r={330} ry={130} c={timerCol} o={0.4 + tick * 0.3 + flash * 0.6} />
          <text textAnchor="middle" y={26} fontFamily={DISPLAY} fontWeight={900} fontSize={76} fill={timerCol} filter="url(#bl8)" letterSpacing={2}>
            {digits}
          </text>
          <text textAnchor="middle" y={26} fontFamily={DISPLAY} fontWeight={900} fontSize={76} fill="#fff" letterSpacing={2}>
            {digits}
          </text>
        </g>
        <rect x={380} y={600} width={6} height={56} fill="#2a1160" />
        <rect x={694} y={600} width={6} height={56} fill="#2a1160" />
        {zero ? <Burst x={540} y={560} t={tz} n={70} seed={5} power={1100} g={700} /> : null}
      </Par>
      <Par cam={cam} d={1.18}>
        <Crowd y={1372} n={15} seed={3} fill="#12072e" rim="#ff5fa2" t={v} jump={zero ? Math.exp(-tz * 1.2) : 0} phones={0.5} />
      </Par>
      <Par cam={cam} d={1.45}>
        <Crowd y={1560} n={8} seed={41} fill="#090318" rim="#49e6ff" t={v + 1} jump={zero ? Math.exp(-tz * 1.2) : 0} s={1.7} phones={0.4} />
      </Par>
      {flash > 0.01 ? <rect width={W} height={H} fill="#ffd9f0" opacity={flash * 0.4} style={{mixBlendMode: 'screen'}} /> : null}
    </svg>
  );
};

// ======================================================================== 3. the flat: «ИГРАТЬ», then the night flies by
export const RoomShot: React.FC<SceneProps> = ({v, t, d}) => {
  const pressK = clamp01(1 - Math.abs(v - PRESS - 0.08) / 0.14);
  const after = v - PRESS;
  const lapse = smooth(ramp(v, LAPSE[0], LAPSE[1]));
  const a: Cam = {x: -20, y: 70, z: 1.05};
  const b: Cam = {x: 0, y: 50, z: 1.09};
  const c: Cam = {x: 0, y: -70, z: 1.0};
  const k1 = easeInOut(ramp(v, shotStart('room'), PRESS + 0.2));
  const k2 = easeInOut(ramp(v, LAPSE[0] - 0.35, LAPSE[0] + 0.55));
  const cam = drift(camLerp(camLerp(a, b, k1), c, k2), v, 4);
  return (
    <Room
      v={v}
      cam={cam}
      tv={after > 0.28 ? 'game' : 'menu'}
      press={pressK}
      wipe={after > 0.1 ? clamp01(1 - Math.abs(after - 0.28) / 0.2) : 0}
      dawn={lapse}
      hours={1 + lapse * 7}
      cans={2 + Math.floor(lapse * 7.01)}
      tired={lapse}
    />
  );
};
