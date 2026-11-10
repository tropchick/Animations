import React from 'react';
import {C, DISPLAY, Glow, H, LinGrad, Palm, Par, SCRIPT, Sky, Skyline, Stars, W, Water, camLerp, clamp01, drift, easeInOut, easeOut, lerp, mix, ramp, rnd, skyline, smooth} from './kit';
import {CALVE, GATOR_IN, GRAB, RISE, THERMO} from './cues';
import {Burst, Console} from './props';
import {Filters} from './scenes1';
import {FLOOR, Room, SEAT} from './room';
import type {SceneProps} from './scenes1';

const WATER_Y = SEAT - 92;

// ======================================================================== 7. the flooded flat
export const FloodShot: React.FC<SceneProps> = ({v, t, k, d}) => {
  const rise = easeOut(ramp(t, 0, 1.7));
  const cam = drift(camLerp({x: -10, y: -90, z: 1.0}, {x: -10, y: -20, z: 1.07}, easeInOut(k)), v, 4);
  const eyesK = ramp(t, d - 2.6, d);
  return <Room v={v} cam={cam} day={1} tv="game" water={lerp(FLOOR + 40, WATER_Y, rise)} fanUp={smooth(ramp(rise, 0.35, 0.95))} tired={1} hours={3.4 + v * 0.002} eyes={eyesK > 0 ? lerp(500, 250, eyesK) : null} />;
};

export const GatorShot: React.FC<SceneProps> = ({v, t, k}) => {
  const up = easeOut(ramp(v, GATOR_IN, GATOR_IN + 1.0));
  const bounce = up >= 1 ? 0 : Math.sin(up * Math.PI) * 0.06;
  const grab = easeInOut(ramp(v, GRAB - 0.35, GRAB));
  const cam = drift(camLerp({x: -30, y: 10, z: 1.06}, {x: -24, y: -20, z: 1.1}, easeInOut(k)), v, 4);
  return <Room v={v} cam={cam} day={1} tv={v > GRAB + 0.12 ? 'split' : 'game'} wipe={clamp01(1 - Math.abs(v - GRAB - 0.12) / 0.14)} water={WATER_Y} fanUp={1} tired={1} hours={3.4} gator={up + bounce} grab={grab} />;
};

// ======================================================================== 5b. the planet warms up
const LAND_BLOBS = [
  'M-260 -120 q40 -70 120 -60 q60 10 70 60 q-10 60 -70 70 q-30 60 -90 40 q-60 -30 -30 -110 Z',
  'M-40 40 q60 -30 110 10 q30 50 -10 110 q-40 60 -90 30 q-50 -70 -10 -150 Z',
  'M150 -170 q70 -30 130 20 q20 60 -40 90 q-60 30 -110 -10 q-30 -60 20 -100 Z',
  'M330 60 q50 -10 80 30 q0 50 -50 60 q-50 -10 -30 -90 Z',
  'M-420 60 q40 -20 70 10 q10 50 -30 70 q-50 -10 -40 -80 Z',
  'M520 -120 q60 -40 120 0 q30 60 -30 100 q-70 20 -100 -30 q-10 -40 10 -70 Z',
];

export const Earth: React.FC<SceneProps> = ({v, t, k}) => {
  const heat = smooth(ramp(v, THERMO[0], THERMO[1]));
  const done = v - THERMO[1];
  const cam = drift(camLerp({x: 0, y: 30, z: 0.94}, {x: 20, y: -10, z: 1.06}, easeOut(k)), v, 4);
  const ex = 440;
  const ey = 930;
  const R = 340;
  const spin = (v * 40) % 760;
  const sea = mix('#2f7bff', '#ff9a3c', heat * 0.85);
  const sea2 = mix('#123a9c', '#e8402a', heat * 0.85);
  const land = mix('#3fd07c', '#ffd24a', heat * 0.8);
  const halo = mix('#63f0ff', '#ff7a3c', heat);
  const lvl = lerp(430, 60, heat);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <defs>
        <radialGradient id="ea-sea" cx="0.35" cy="0.3" r="0.9">
          <stop offset={0} stopColor={sea} />
          <stop offset={1} stopColor={sea2} />
        </radialGradient>
        <radialGradient id="ea-shade" cx="0.32" cy="0.28" r="0.85">
          <stop offset={0.55} stopColor="#000" stopOpacity={0} />
          <stop offset={1} stopColor="#0a0224" stopOpacity={0.45} />
        </radialGradient>
        <clipPath id="ea-clip">
          <circle cx={ex} cy={ey} r={R} />
        </clipPath>
        <LinGrad id="ea-tube" stops={[[0, '#ff3b4e'], [1, '#ff8a3c']]} y1={1} y2={0} />
      </defs>
      <Sky id="ea-sky" stops={[[0, '#04011a'], [0.5, mix('#10083a', '#3a0f2e', heat)], [1, mix('#2a1160', '#7a1f2e', heat)]]} />
      <Par cam={cam} d={0.1}>
        <Stars t={v} n={150} y0={-200} y1={2000} seed={7} />
      </Par>
      <Par cam={cam} d={1}>
        <Glow x={ex} y={ey} r={R * 2.1} c={halo} o={0.6 + heat * 0.3} />
        <circle cx={ex} cy={ey} r={R + 14} fill={halo} opacity={0.35} />
        <circle cx={ex} cy={ey} r={R} fill="url(#ea-sea)" />
        <g clipPath="url(#ea-clip)">
          {[0, 1].map((rep) => (
            <g key={rep} transform={`translate(${ex + spin - rep * 760 - 60} ${ey})`}>
              {LAND_BLOBS.map((d, i) => (
                <path key={i} d={d} fill={land} />
              ))}
            </g>
          ))}
          <ellipse cx={ex} cy={ey - R + 16} rx={170} ry={lerp(46, 8, heat)} fill="#fff" opacity={0.95} />
          <ellipse cx={ex} cy={ey + R - 16} rx={200} ry={lerp(54, 6, heat)} fill="#fff" opacity={0.95} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={ex - 380 + ((v * (30 + i * 12) + i * 230) % 900)} y={ey - 190 + i * 120} width={150 + i * 20} height={22} rx={11} fill="#fff" opacity={0.75 * (1 - heat * 0.6)} />
          ))}
          <circle cx={ex} cy={ey} r={R} fill="url(#ea-shade)" />
        </g>
        {/* heat rising off the planet */}
        {Array.from({length: 14}, (_, i) => {
          const a = (i / 14) * Math.PI * 2 + 0.2;
          const q = (v * 0.5 + rnd(i * 3.7)) % 1;
          const r0 = R + 24 + q * 110;
          const px = ex + Math.cos(a) * r0;
          const py = ey + Math.sin(a) * r0;
          return <path key={i} d="M0 0 q12 -14 0 -28 q-12 -14 0 -28" stroke={halo} strokeWidth={7} fill="none" strokeLinecap="round" opacity={(1 - q) * heat * 0.9} transform={`translate(${px} ${py}) rotate(${(a * 180) / Math.PI + 90})`} />;
        })}
        {/* thermometer */}
        <g transform="translate(940 640)">
          <rect x={-40} y={-40} width={80} height={560} rx={40} fill="#fff" opacity={0.95} />
          <circle cx={0} cy={540} r={74} fill="#fff" opacity={0.95} />
          <rect x={-18} y={lvl} width={36} height={520 - lvl} rx={18} fill="url(#ea-tube)" />
          <circle cx={0} cy={540} r={52} fill="#ff3b4e" />
          <circle cx={-16} cy={524} r={14} fill="#fff" opacity={0.5} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect key={i} x={24} y={20 + i * 56} width={i % 2 ? 14 : 24} height={6} rx={3} fill="#2b1a55" />
          ))}
          <Glow x={0} y={540} r={220} c="#ff3b4e" o={0.5 + heat * 0.4} />
        </g>
        <g transform={`translate(540 400) scale(${1 + (done > 0 ? Math.exp(-done * 6) * 0.35 : 0)})`}>
          <text textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={150} fill={halo} filter="url(#ea-bl)" opacity={0.9}>
            {`+${(2 * heat).toFixed(1).replace('.', ',')}°`}
          </text>
          <text textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={150} fill="#fff">
            {`+${(2 * heat).toFixed(1).replace('.', ',')}°`}
          </text>
        </g>
        <filter id="ea-bl" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </Par>
    </svg>
  );
};

// ======================================================================== 5c. Antarctica: the penguin is hot, the glacier goes
export const PenguinShot: React.FC<SceneProps> = ({v, t, k}) => {
  const cam = drift(camLerp({x: -30, y: 30, z: 1.04}, {x: 20, y: 0, z: 1.14}, easeOut(k)), v, 3);
  const cv = v - CALVE;
  const fall = cv > 0 ? Math.min(1, cv * cv * 2.4) : 0;
  const seaY = 1210;
  const fan = Math.sin(v * 16) * 22;
  const bob = Math.sin(v * 2) * 6;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <defs>
        <LinGrad id="pg-ice" stops={[[0, '#ffffff'], [1, '#bfe6ff']]} />
        <LinGrad id="pg-ice2" stops={[[0, '#eaf6ff'], [1, '#8fc6f5']]} />
      </defs>
      <Sky id="pg-sky" stops={[[0, '#ff8a4a'], [0.3, '#ffb86b'], [0.6, '#ffe08a'], [0.85, '#fff3c4']]} />
      <Par cam={cam} d={0.06}>
        <Glow x={300} y={420} r={900} c="#fff7d6" o={0.95} />
        {Array.from({length: 12}, (_, i) => (
          <rect key={i} x={300 - 9} y={420 - 420} width={18} height={150} rx={9} fill="#fff7d6" opacity={0.55} transform={`rotate(${i * 30 + v * 14} 300 420)`} />
        ))}
        <circle cx={300} cy={420} r={170} fill="#fffbe6" />
      </Par>
      <Par cam={cam} d={0.3}>
        <path d="M-300 1150 L-120 900 L20 1020 L160 860 L330 1150 Z" fill="#ffe9d6" opacity={0.9} />
        <path d="M700 1150 L880 940 L1010 1040 L1160 880 L1400 1150 Z" fill="#ffe9d6" opacity={0.9} />
      </Par>
      <Par cam={cam} d={0.6}>
        {/* glacier wall on the right; a slab breaks off */}
        <path d="M640 1240 L650 640 L760 560 L900 600 L1040 520 L1500 560 L1500 1240 Z" fill="url(#pg-ice)" />
        <path d="M640 1240 L650 640 L700 700 L690 1240 Z" fill="#8fc6f5" opacity={0.7} />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${760 + i * 90} ${600 + i * 16} l-14 ${520 - i * 30}`} stroke="#8fc6f5" strokeWidth={6} opacity={0.5} />
        ))}
        <g transform={`translate(${-fall * 70} ${fall * 600}) rotate(${-fall * 24} 690 900)`}>
          <path d="M560 1240 L580 700 L660 630 L720 700 L700 1240 Z" fill="url(#pg-ice2)" />
          <path d="M560 1240 L580 700 L610 740 L600 1240 Z" fill="#6fb0ee" opacity={0.6} />
        </g>
        {cv > 0 ? <path d="M712 690 l-14 60 l22 50 l-18 70 l20 60 l-12 120" stroke="#2b6fc2" strokeWidth={8} fill="none" opacity={Math.max(0, 1 - cv * 2)} /> : null}
      </Par>
      <Par cam={cam} d={1}>
        <Water id="pg-sea" y={seaY} t={v} top="#35d6d0" bottom="#1a6fc2" amp={9} />
        {cv > 0.5 ? <Burst x={610} y={seaY} t={cv - 0.5} n={40} seed={4} cols={['#fff', '#bffcff', '#8fe6ff']} power={900} g={1500} /> : null}
        {/* the floe with the console and the penguin */}
        <g transform={`translate(430 ${seaY + 6 + bob}) rotate(${Math.sin(v * 1.6) * 2.5})`}>
          <path d="M-330 20 Q-340 -30 -280 -34 L290 -34 Q340 -30 330 20 Q300 70 0 70 Q-300 70 -330 20 Z" fill="url(#pg-ice)" />
          <path d="M-330 20 Q-300 70 0 70 Q300 70 330 20 Q300 40 0 40 Q-300 40 -330 20 Z" fill="#8fc6f5" />
          {[0, 1, 2, 3, 4].map((i) => {
            const q = (v * 0.9 + i * 0.23) % 1;
            return <ellipse key={i} cx={-250 + i * 125} cy={60 + q * 70} rx={7} ry={11} fill="#bffcff" opacity={1 - q} />;
          })}
          <Console x={-200} y={-34} s={1.15} hot={1} t={v} />
          {/* hot air */}
          {[0, 1, 2].map((i) => {
            const q = (v * 0.9 + i / 3) % 1;
            return <path key={i} d={`M${-150 + q * 170} ${-150 + i * 34} q16 -12 32 0 q16 12 32 0`} stroke="#ff8a3c" strokeWidth={8} fill="none" strokeLinecap="round" opacity={(1 - q) * 0.9} />;
          })}
          {/* penguin */}
          <g transform="translate(110 -36)">
            <ellipse cx={-38} cy={-2} rx={40} ry={15} fill="#ff9a3c" />
            <ellipse cx={46} cy={-2} rx={40} ry={15} fill="#ff9a3c" />
            <path d="M-104 -150 Q-110 -330 0 -336 Q110 -330 104 -150 Q100 -20 0 -16 Q-100 -20 -104 -150 Z" fill="#1d1f52" />
            <path d="M-70 -140 Q-74 -260 0 -262 Q74 -260 70 -140 Q66 -34 0 -30 Q-66 -34 -70 -140 Z" fill="#fff" />
            <path d="M60 -320 Q104 -300 104 -150 Q102 -80 80 -50 Q92 -180 74 -290 Z" fill="#ffd9a0" opacity={0.5} />
            {/* face */}
            <circle cx={-34} cy={-262} r={15} fill="#fff" />
            <circle cx={34} cy={-262} r={15} fill="#fff" />
            <circle cx={-30} cy={-258} r={7} fill="#1b1036" />
            <circle cx={38} cy={-258} r={7} fill="#1b1036" />
            <path d="M-52 -284 L-16 -276 M52 -284 L16 -276" stroke="#1d1f52" strokeWidth={7} strokeLinecap="round" />
            <path d="M-26 -236 L26 -236 L0 -200 Z" fill="#ff9a3c" />
            <path d="M-22 -226 L22 -226 L0 -196 Z" fill="#7a2b4a" />
            <path d="M-6 -214 q6 22 12 0 Z" fill="#ff7aa8" />
            {/* sweat */}
            {[0, 1, 2].map((i) => {
              const q = (v * 1.3 + i * 0.35) % 1;
              return <path key={i} d="M0 -10 q10 14 0 22 q-10 -8 0 -22 Z" fill="#7fe9ff" opacity={1 - q} transform={`translate(${-96 + i * 96} ${-300 + q * 90})`} />;
            })}
            {/* flippers: one fans, one holds the scarf away */}
            <g transform={`translate(-100 -190) rotate(${40 + fan})`}>
              <path d="M0 -10 Q-70 20 -90 110 Q-40 100 14 40 Z" fill="#1d1f52" />
            </g>
            <g transform="translate(100 -200) rotate(-74)">
              <path d="M0 -10 Q70 20 90 110 Q40 100 -14 40 Z" fill="#1d1f52" />
            </g>
            <g transform={`translate(196 -292) rotate(${Math.sin(v * 5) * 8})`}>
              <path d="M-10 0 L18 0 L26 150 L-2 160 Z" fill="#ff3b4e" />
              <path d="M-8 30 L20 28 M-6 70 L22 68 M-4 110 L24 108" stroke="#fff" strokeWidth={8} />
              <path d="M-2 160 l4 22 M8 158 l4 22 M18 154 l4 22" stroke="#ff3b4e" strokeWidth={6} strokeLinecap="round" />
            </g>
          </g>
        </g>
      </Par>
      <rect width={W} height={H} fill="#ff9a3c" opacity={0.08} style={{mixBlendMode: 'screen'}} />
    </svg>
  );
};

// ======================================================================== 6. Miami goes under water
const HOTELS: [number, number, number, string, string][] = [
  [-120, 250, 560, '#ff9ec4', '#e06a9a'],
  [150, 210, 430, '#8fe3d0', '#4fb8a4'],
  [380, 320, 720, '#ffe08a', '#e8b04a'],
  [720, 220, 500, '#b9a4ff', '#8a6fe0'],
  [960, 260, 600, '#ffb38a', '#e8805a'],
];

export const Miami: React.FC<SceneProps> = ({v, t, k}) => {
  const rise = smooth(ramp(v, RISE[0], RISE[1]));
  const base = 1190; // promenade level
  const wy = lerp(1560, 890, rise);
  const cam = drift(camLerp({x: -40, y: 20, z: 1.06}, {x: 30, y: -90, z: 1.0}, easeInOut(k)), v, 4);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Filters />
      <Sky id="mi-sky" stops={[[0, '#19b9e8'], [0.35, '#7fe0f0'], [0.6, '#ffd9e0'], [0.8, '#ffc0a0'], [1, '#ffe9c4']]} />
      <Par cam={cam} d={0.06}>
        <Glow x={800} y={420} r={760} c="#fff7d6" o={0.9} />
        <circle cx={800} cy={420} r={120} fill="#fffbe6" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${((i * 480 + v * 14) % 1600) - 300} ${300 + i * 170})`} opacity={0.9}>
            <rect x={0} y={0} width={280} height={50} rx={25} fill="#fff" />
            <rect x={60} y={-32} width={160} height={56} rx={28} fill="#fff" />
          </g>
        ))}
      </Par>
      <Par cam={cam} d={0.35}>
        <Skyline b={skyline(5, -400, W + 500, 70, 140, 240, 620)} baseY={base - 20} fill="#9fd0f5" win={['#fff']} lit={0.08} cell={24} />
      </Par>
      <Par cam={cam} d={0.75}>
        {HOTELS.map(([hx, hw, hh, c1, c2], i) => (
          <g key={i}>
            <path d={`M${hx} ${base + 20} L${hx} ${base - hh + 40} Q${hx} ${base - hh} ${hx + 40} ${base - hh} L${hx + hw - 40} ${base - hh} Q${hx + hw} ${base - hh} ${hx + hw} ${base - hh + 40} L${hx + hw} ${base + 20} Z`} fill={c1} />
            <rect x={hx + hw - 44} y={base - hh + 30} width={44} height={hh} fill={c2} opacity={0.55} />
            {Array.from({length: Math.floor(hh / 92)}, (_, r) => (
              <g key={r}>
                <rect x={hx - 8} y={base - hh + 70 + r * 92} width={hw + 16} height={12} rx={6} fill="#fff" opacity={0.85} />
                {Array.from({length: Math.floor((hw - 30) / 56)}, (_, q) => (
                  <rect key={q} x={hx + 22 + q * 56} y={base - hh + 92 + r * 92} width={34} height={46} rx={6} fill="#2b6fa8" opacity={0.55} />
                ))}
              </g>
            ))}
            <rect x={hx + hw / 2 - 10} y={base - hh - 70} width={20} height={74} rx={6} fill={c2} />
          </g>
        ))}
        {/* the sign */}
        <g transform={`translate(540 ${base - 735})`}>
          <text textAnchor="middle" fontFamily={SCRIPT} fontSize={128} fill={C.magenta} filter="url(#bl8)" opacity={0.85}>
            Майами
          </text>
          <text textAnchor="middle" fontFamily={SCRIPT} fontSize={128} fill="#fff" stroke={C.magenta} strokeWidth={5} paintOrder="stroke">
            Майами
          </text>
        </g>
      </Par>
      <Par cam={cam} d={1}>
        <defs>
          <LinGrad id="mi-sand" stops={[[0, '#ffe9b8'], [1, '#ffc98a']]} />
        </defs>
        <rect x={-500} y={base} width={W + 1000} height={50} fill="#ffd0e0" />
        <rect x={-500} y={base + 50} width={W + 1000} height={1400} fill="url(#mi-sand)" />
        {[-60, 200, 470, 760, 1010].map((px, i) => (
          <Palm key={i} x={px} y={base + 30} s={0.78 + (i % 2) * 0.14} lean={i % 2 ? 0.12 : -0.1} fill={i % 2 ? '#1f9463' : '#2fb37a'} t={v + i} />
        ))}
        {/* parked convertible, later floating */}
        <g transform={`translate(300 ${Math.min(base + 44, wy + 26)}) rotate(${wy < base ? Math.sin(v * 1.4) * 5 : 0})`}>
          <path d="M-130 -20 Q-130 -60 -90 -62 L-40 -62 L-10 -100 L60 -100 L90 -62 Q140 -58 140 -20 Z" fill={C.magenta} />
          <path d="M-30 -64 L-6 -94 L56 -94 L78 -64 Z" fill="#bff1ff" />
          <circle cx={-76} cy={-14} r={26} fill="#1a1036" />
          <circle cx={84} cy={-14} r={26} fill="#1a1036" />
          <circle cx={-76} cy={-14} r={11} fill="#d9d4ee" />
          <circle cx={84} cy={-14} r={11} fill="#d9d4ee" />
        </g>
        {/* beach umbrellas */}
        {[640, 900].map((ux, i) => (
          <g key={i} transform={`translate(${ux + (wy < base + 120 ? Math.sin(v + i) * 20 : 0)} ${Math.min(base + 150, wy + 40)}) rotate(${wy < base + 120 ? 30 + Math.sin(v * 1.2 + i) * 8 : 0})`}>
            <rect x={-4} y={-150} width={8} height={150} fill="#fff" />
            <path d="M-110 -140 Q0 -250 110 -140 Z" fill={i ? C.teal : C.orange} />
            <path d="M-40 -140 Q0 -250 40 -140 Z" fill="#fff" opacity={0.85} />
          </g>
        ))}
        <Water id="mi-sea" y={wy} t={v} top="#2fe0d0" bottom="#1a5fc2" o={0.9} amp={12} />
        {/* inflatable flamingo */}
        <g transform={`translate(${lerp(1150, 610, smooth(k))} ${wy - 6 + Math.sin(v * 1.8) * 8}) rotate(${Math.sin(v * 1.3) * 6})`}>
          <ellipse cx={0} cy={8} rx={120} ry={44} fill="#ff6fb0" />
          <ellipse cx={0} cy={0} rx={62} ry={18} fill="#c2337f" />
          <path d="M-96 0 Q-150 -40 -130 -130 Q-120 -176 -84 -168" stroke="#ff6fb0" strokeWidth={34} fill="none" strokeLinecap="round" />
          <circle cx={-84} cy={-168} r={26} fill="#ff6fb0" />
          <path d="M-66 -176 L-22 -160 L-62 -150 Z" fill="#2b1a55" />
          <path d="M-66 -176 L-44 -168 L-62 -160 Z" fill="#fff" />
          <circle cx={-90} cy={-176} r={6} fill="#2b1a55" />
          <path d="M70 -10 Q130 -60 110 10 Z" fill="#ff8fc2" />
        </g>
      </Par>
    </svg>
  );
};
