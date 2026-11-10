import React from 'react';
import {C, Cam, DISPLAY, Glow, H, Limb, LinGrad, Palm, Par, SCRIPT, Sky, Skyline, Stars, W, camLerp, clamp01, drift, easeIn, easeInOut, easeOut, lerp, mix, pop, ramp, rnd, skyline, smooth, starPath} from './kit';
import {Burst, Console, Gamepad, Wanted} from './props';
import {ALARM, JUMP, LAND, WAVE, shotEnd, shotStart} from './cues';
import {Fan, Look} from './room';
import type {SceneProps} from './scenes1';
import {Filters} from './scenes1';

// ======================================================================== 2. the panel block: windows switch on / 5. the same block, three days later, hot
const COLS = 7;
const ROWS = 15;
const BX = 96;
const CW = 127;
const CH = 118;
const BY = 250;
const SIDE_L = skyline(51, -420, 60, 70, 130, 500, 1300);
const SIDE_R = skyline(63, 1020, 1500, 70, 130, 500, 1300);
const FAN_COL = 2;
const FAN_ROW = 7;

export const Block: React.FC<SceneProps & {hot?: boolean}> = ({v, t, k, d, hot}) => {
  const zoomK = hot ? 0 : easeIn(ramp(t, d - 0.42, d));
  const base = hot ? camLerp({x: 0, y: 260, z: 1.12}, {x: 0, y: -40, z: 1.0}, easeInOut(k)) : camLerp({x: -20, y: 330, z: 1.08}, {x: 10, y: -150, z: 1.0}, easeInOut(k * 0.95));
  const fx = BX + FAN_COL * CW + CW / 2;
  const fy = BY + 60 + FAN_ROW * CH + CH / 2;
  const cam = drift(camLerp(base, {x: fx - W / 2, y: fy - H / 2, z: 5.5}, zoomK), v, hot ? 3 : 4);
  const wave = (r: number, c: number, seed: number) => {
    if (hot) return 1;
    const order = ((ROWS - r) * 0.55 + c * 0.5 + rnd(seed) * 3.2) / (ROWS * 0.55 + COLS * 0.5 + 3.2);
    const at = lerp(WAVE[0], WAVE[1], order);
    return v >= at ? Math.min(1, 0.4 + (v - at) * 4) : 0;
  };
  const wallA = hot ? '#ff9d6e' : '#4a2d96';
  const wallB = hot ? '#d9567a' : '#24134f';
  const seam = hot ? '#b84468' : '#1b0e40';
  const shimmer = (y: number) => (hot ? Math.sin(y * 0.02 + v * 5) * 5 : 0);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Filters />
      {hot ? <Sky id="bl-sky" stops={[[0, '#ff7a3c'], [0.35, '#ffb347'], [0.7, '#ffe08a'], [1, '#fff3c4']]} /> : <Sky id="bl-sky" stops={[[0, '#05021a'], [0.35, '#1c0d4a'], [0.7, '#5a1e8c'], [1, '#c2337f']]} />}
      <Par cam={cam} d={0.05}>
        {hot ? (
          <>
            <Glow x={800} y={330} r={700} c="#fff3c4" o={0.9} />
            <circle cx={800} cy={330} r={150} fill="#fff7d6" />
          </>
        ) : (
          <>
            <Stars t={v} n={70} y0={-300} y1={700} />
            <circle cx={860} cy={150} r={70} fill="#fff1c9" />
            <Glow x={860} y={150} r={300} c="#ffd9f0" o={0.5} />
          </>
        )}
      </Par>
      <Par cam={cam} d={0.4}>
        <Skyline b={SIDE_L} baseY={2100} fill={hot ? '#e8847a' : '#2a1160'} win={hot ? ['#fff3c4'] : [C.cyan, '#7fa8ff']} cell={26} litAt={(x, y, q) => (hot ? (q < 0.5 ? 1 : 0) : v > lerp(WAVE[0], WAVE[1], 0.2 + q * 0.8) ? 1 : 0)} dim={hot ? '#c96a70' : '#1c0d49'} />
        <Skyline b={SIDE_R} baseY={2100} fill={hot ? '#e8847a' : '#2a1160'} win={hot ? ['#fff3c4'] : [C.cyan, '#7fa8ff']} cell={26} litAt={(x, y, q) => (hot ? (q < 0.5 ? 1 : 0) : v > lerp(WAVE[0], WAVE[1], 0.2 + q * 0.8) ? 1 : 0)} dim={hot ? '#c96a70' : '#1c0d49'} />
      </Par>
      <Par cam={cam} d={1}>
        <defs>
          <LinGrad id="bl-wall" stops={[[0, wallA], [1, wallB]]} />
          <LinGrad id="bl-side" stops={[[0, mix(wallA, '#000000', 0.25)], [1, mix(wallB, '#000000', 0.3)]]} />
        </defs>
        {/* side face + front */}
        <path d={`M${BX + COLS * CW} ${BY} L${BX + COLS * CW + 70} ${BY + 40} L${BX + COLS * CW + 70} 2600 L${BX + COLS * CW} 2600 Z`} fill="url(#bl-side)" />
        <rect x={BX} y={BY} width={COLS * CW} height={2400} fill="url(#bl-wall)" />
        <rect x={BX - 10} y={BY - 16} width={COLS * CW + 20} height={22} fill={hot ? '#b84468' : '#1b0e40'} />
        {/* roof things */}
        <rect x={BX + 120} y={BY - 76} width={110} height={60} fill={hot ? '#b84468' : '#1b0e40'} />
        <rect x={BX + 600} y={BY - 130} width={6} height={114} fill={hot ? '#b84468' : '#1b0e40'} />
        <path d={`M${BX + 570} ${BY - 110} l66 0 M${BX + 580} ${BY - 90} l46 0`} stroke={hot ? '#b84468' : '#1b0e40'} strokeWidth={5} />
        {Array.from({length: ROWS + 1}, (_, r) => (
          <rect key={r} x={BX} y={BY + 52 + r * CH} width={COLS * CW} height={3} fill={seam} opacity={0.55} />
        ))}
        {Array.from({length: COLS - 1}, (_, c) => (
          <rect key={c} x={BX + (c + 1) * CW - 1.5} y={BY} width={3} height={2400} fill={seam} opacity={0.4} />
        ))}
        {Array.from({length: ROWS}, (_, r) =>
          Array.from({length: COLS}, (_, c) => {
            const seed = r * 31.7 + c * 7.3;
            const x = BX + c * CW + 20 + shimmer(r * CH);
            const y = BY + 60 + r * CH + 18;
            const warm = !hot && rnd(seed + 1) < 0.1;
            const on = warm ? 1 : wave(r, c, seed);
            const fl = 0.78 + 0.22 * Math.sin(v * (6 + rnd(seed) * 9) + seed);
            const col = hot ? mix('#ff5a2a', '#ffd24a', 0.5 + 0.5 * Math.sin(v * 3 + seed)) : warm ? C.amber : mix('#63f0ff', '#4f7dff', 0.5 + 0.5 * Math.sin(v * (5 + rnd(seed) * 8) + seed));
            const balcony = c % 3 === 1;
            return (
              <g key={`${r}-${c}`}>
                {on > 0.05 ? <Glow x={x + 43} y={y + 40} r={hot ? 88 : 96} c={col} o={on * fl * (hot ? 0.5 : 0.55)} /> : null}
                <rect x={x - 5} y={y - 5} width={96} height={86} rx={5} fill={hot ? '#ffd9c2' : '#6a48c2'} />
                <rect x={x} y={y} width={86} height={76} rx={3} fill={on > 0.05 ? col : '#150a3a'} opacity={on > 0.05 ? 0.45 + 0.55 * on * fl : 1} />
                {on <= 0.05 ? <path d={`M${x} ${y + 50} L${x + 50} ${y} L${x + 70} ${y} L${x} ${y + 70} Z`} fill="#fff" opacity={0.05} /> : null}
                <rect x={x + 41} y={y} width={4} height={76} fill={hot ? '#ffd9c2' : '#6a48c2'} />
                {hot ? <Console x={x + 62} y={y + 74} s={0.3} /> : null}
                {balcony ? (
                  <>
                    <rect x={x - 12} y={y + 62} width={110} height={34} rx={4} fill={hot ? '#c9587a' : '#2e1a6c'} />
                    <rect x={x - 12} y={y + 62} width={110} height={5} fill={hot ? '#ffd9c2' : '#7a56d6'} opacity={0.8} />
                  </>
                ) : rnd(seed + 5) < 0.22 ? (
                  <rect x={x + 54} y={y + 84} width={36} height={22} rx={3} fill={hot ? '#ffe9dc' : '#8f7fd0'} />
                ) : null}
                {hot
                  ? [0, 1].map((i) => {
                      const q = (v * 0.55 + rnd(seed + i) + i * 0.5) % 1;
                      return <path key={i} d={`M${x + 20 + i * 44} ${y - 8 - q * 70} q9 -11 0 -22 q-9 -11 0 -22`} stroke="#fff3c4" strokeWidth={4} fill="none" strokeLinecap="round" opacity={(1 - q) * 0.75} />;
                    })
                  : null}
              </g>
            );
          }),
        )}
      </Par>
      <Par cam={cam} d={1.5}>
        {hot ? (
          <g />
        ) : (
          <g>
            <path d="M-80 2300 Q-20 1700 40 1500 Q60 1380 150 1300 M40 1500 Q-40 1400 -100 1380 M70 1420 Q160 1420 230 1360 M110 1340 Q120 1260 180 1200" stroke="#070216" strokeWidth={26} fill="none" strokeLinecap="round" />
            <path d="M-300 1750 Q500 1880 1400 1700" stroke="#070216" strokeWidth={7} fill="none" />
            <path d="M-300 1810 Q500 1950 1400 1770" stroke="#070216" strokeWidth={7} fill="none" />
          </g>
        )}
      </Par>
      {hot ? <rect width={W} height={H} fill="#ff6a2a" opacity={0.1 + 0.05 * Math.sin(v * 3)} style={{mixBlendMode: 'screen'}} /> : null}
      {zoomK > 0 ? <rect width={W} height={H} fill="#bfefff" opacity={zoomK * 0.9} /> : null}
    </svg>
  );
};

// ======================================================================== 4. the morning street: nobody; later granny's jump
const ST_FAR = skyline(81, -400, W + 900, 70, 150, 200, 620);
const ST_MID = skyline(93, -400, W + 900, 150, 260, 260, 520);
const GROUND = 1290;

const Dog: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => {
  const leg = (ph: number) => Math.sin(t * 11 + ph) * 16;
  const bob = Math.abs(Math.sin(t * 11)) * 5;
  return (
    <g transform={`translate(${x} ${y - bob})`}>
      {/* leash trailing behind */}
      <path d={`M72 -66 Q20 ${-20 + Math.sin(t * 5) * 8} -70 ${-4 + bob} Q-130 ${6 + bob} -190 ${-2 + bob}`} stroke={C.magenta} strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d={`M-190 ${-2 + bob} q-16 -14 -30 0 q14 14 30 0`} stroke={C.magenta} strokeWidth={7} fill="none" />
      <Limb a={[-44, -34]} b={[-44 + leg(0), 0 + bob]} w={15} fill="#b8642a" />
      <Limb a={[36, -34]} b={[36 + leg(Math.PI), 0 + bob]} w={15} fill="#b8642a" />
      <path d={`M-66 -58 Q-92 ${-96 + Math.sin(t * 14) * 10} -70 ${-110 + Math.sin(t * 14) * 12}`} stroke="#e8893a" strokeWidth={15} fill="none" strokeLinecap="round" />
      <rect x={-72} y={-84} width={132} height={58} rx={28} fill="#e8893a" />
      <path d="M-40 -30 Q0 -22 40 -30 L40 -40 L-40 -40 Z" fill="#fff3df" />
      <Limb a={[-54, -34]} b={[-54 + leg(Math.PI), 0 + bob]} w={15} fill="#e8893a" />
      <Limb a={[46, -34]} b={[46 + leg(0), 0 + bob]} w={15} fill="#e8893a" />
      <g transform="translate(66 -86)">
        <path d="M-22 -30 L-12 -62 L4 -34 Z" fill="#b8642a" />
        <circle r={36} fill="#e8893a" />
        <path d="M6 -30 L22 -64 L32 -28 Z" fill="#e8893a" />
        <ellipse cx={30} cy={12} rx={24} ry={17} fill="#fff3df" />
        <circle cx={48} cy={4} r={7} fill="#2b1a55" />
        <circle cx={12} cy={-8} r={5.5} fill="#2b1a55" />
        <circle cx={14} cy={-10} r={2} fill="#fff" />
      </g>
    </g>
  );
};

const GrannyCar: React.FC<{x: number; y: number; rot: number; t: number; spin?: number}> = ({x, y, rot, t, spin = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <ellipse cx={0} cy={2} rx={96} ry={8} fill="#000" opacity={0.0} />
    <path d="M-96 -22 Q-100 -62 -64 -66 L-44 -118 Q-38 -132 -20 -132 L44 -132 Q62 -132 72 -116 L92 -66 Q110 -62 108 -22 Z" fill="#ffd23f" />
    <path d="M-96 -22 Q-100 -62 -64 -66 L92 -66 Q110 -62 108 -22 Z" fill="#ffb21f" />
    <path d="M-36 -70 L-22 -118 L40 -118 L60 -86 L64 -70 Z" fill="#bff1ff" />
    <rect x={8} y={-120} width={6} height={52} fill="#ffd23f" />
    {/* granny */}
    <g transform={`translate(34 -92) rotate(${Math.sin(t * 20) * 3})`}>
      <circle r={20} fill="#ffc7a1" />
      <path d="M-22 -4 Q-22 -26 0 -26 Q22 -26 20 -6 Q4 -16 -10 -8 Q-16 14 -20 18 Z" fill="#ff5fa2" />
      <circle cx={-18} cy={-18} r={10} fill="#e8e3f5" />
      <circle cx={10} cy={0} r={7} fill="none" stroke="#2b1a55" strokeWidth={3} />
      <path d="M10 10 q5 4 10 0" stroke="#7a2b4a" strokeWidth={3} fill="none" strokeLinecap="round" />
    </g>
    <rect x={96} y={-52} width={14} height={12} rx={4} fill="#fff7c2" />
    <rect x={-100} y={-50} width={10} height={12} rx={3} fill="#ff3b4e" />
    <rect x={-104} y={-26} width={216} height={10} rx={5} fill="#3b2b78" />
    {[-58, 62].map((wx) => (
      <g key={wx} transform={`translate(${wx} -14) rotate(${spin})`}>
        <circle r={25} fill="#1a1036" />
        <circle r={11} fill="#d9d4ee" />
        <rect x={-2} y={-22} width={4} height={44} fill="#1a1036" opacity={0.5} />
      </g>
    ))}
  </g>
);

const Bus: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={4} rx={420} ry={16} fill="#3b1a72" opacity={0.35} />
    <rect x={-400} y={-300} width={800} height={280} rx={44} fill="#19c2b2" />
    <rect x={-400} y={-120} width={800} height={100} rx={30} fill="#0e8f8a" />
    <rect x={-400} y={-134} width={800} height={14} fill="#fff3df" />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={-370 + i * 142} y={-270} width={124} height={118} rx={14} fill="#bff1ff" />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <path key={i} d={`M${-370 + i * 142} ${-200} L${-300 + i * 142} ${-270} L${-270 + i * 142} ${-270} L${-370 + i * 142} ${-170} Z`} fill="#fff" opacity={0.35} />
    ))}
    {/* driver window: empty seat, the gamepad on the wheel */}
    <rect x={212} y={-270} width={160} height={150} rx={16} fill="#bff1ff" />
    <rect x={236} y={-236} width={54} height={110} rx={18} fill="#3b2b78" />
    <circle cx={326} cy={-166} r={30} fill="none" stroke="#1a1036" strokeWidth={9} />
    <Gamepad x={326} y={-170} s={0.62} rot={-12} />
    <rect x={150} y={-270} width={52} height={236} rx={8} fill="#0b6f73" />
    <rect x={158} y={-262} width={36} height={220} rx={6} fill="#0d0722" opacity={0.75} />
    <rect x={384} y={-90} width={20} height={26} rx={6} fill="#fff7c2" />
    <rect x={-404} y={-90} width={14} height={26} rx={5} fill="#ff3b4e" />
    <rect x={-80} y={-298} width={220} height={24} rx={8} fill="#0d0722" />
    <text x={30} y={-279} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={17} fill={C.amber}>
      НЕТ ВОДИТЕЛЯ
    </text>
    {[-250, 250].map((wx) => (
      <g key={wx} transform={`translate(${wx} -22)`}>
        <circle r={46} fill="#1a1036" />
        <circle r={20} fill="#d9d4ee" />
      </g>
    ))}
  </g>
);

const StreetBack: React.FC<{cam: Cam; v: number; noon?: boolean}> = ({cam, v, noon}) => (
  <>
    {noon ? <Sky id="st-sky" stops={[[0, '#2f8cff'], [0.45, '#7fd0ff'], [0.75, '#ffe6c0'], [1, '#ffd0a8']]} /> : <Sky id="st-sky" stops={[[0, '#5d6fe8'], [0.35, '#b08af0'], [0.6, '#ffb0b8'], [0.8, '#ffd9a0'], [1, '#fff0c9']]} />}
    <Par cam={cam} d={0.06}>
      <Glow x={noon ? 760 : 300} y={noon ? 320 : 1000} r={720} c="#fff3c4" o={0.85} />
      <circle cx={noon ? 760 : 300} cy={noon ? 320 : 1000} r={noon ? 90 : 150} fill="#fff7d6" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${((i * 520 + v * 12) % 1700) - 300} ${380 + i * 150})`} opacity={0.85}>
          <rect x={0} y={0} width={260} height={46} rx={23} fill="#fff" />
          <rect x={50} y={-28} width={150} height={50} rx={25} fill="#fff" />
        </g>
      ))}
    </Par>
    <Par cam={cam} d={0.3}>
      <Skyline b={ST_FAR} baseY={GROUND - 30} fill={noon ? '#8fa8f0' : '#c79cf0'} win={['#fff']} lit={0.06} cell={24} />
      <rect x={-600} y={GROUND - 34} width={W + 1800} height={900} fill={noon ? '#8fa8f0' : '#c79cf0'} />
    </Par>
    <Par cam={cam} d={0.6}>
      {ST_MID.map((b, i) => {
        const cols = ['#ff8fb0', '#7fd6c8', '#ffc76b', '#b08af0', '#ff9d6e'];
        const c = cols[i % cols.length];
        const y = GROUND - 8 - b.h;
        return (
          <g key={i}>
            <rect x={b.x} y={y} width={b.w - 8} height={b.h + 40} fill={c} />
            <rect x={b.x} y={y} width={b.w - 8} height={14} fill="#fff" opacity={0.4} />
            <rect x={b.x + b.w - 40} y={y} width={32} height={b.h + 40} fill="#2b1a55" opacity={0.14} />
            {Array.from({length: Math.floor((b.h - 150) / 78)}, (_, r) =>
              Array.from({length: Math.floor((b.w - 30) / 62)}, (_, q) => <rect key={`${r}${q}`} x={b.x + 16 + q * 62} y={y + 34 + r * 78} width={40} height={50} rx={5} fill="#2b1a55" opacity={0.45} />),
            )}
            <rect x={b.x + 12} y={GROUND - 120} width={b.w - 32} height={112} rx={6} fill="#2b1a55" opacity={0.55} />
            <path d={`M${b.x + 4} ${GROUND - 132} L${b.x + b.w - 12} ${GROUND - 132} L${b.x + b.w - 2} ${GROUND - 100} L${b.x - 6} ${GROUND - 100} Z`} fill={i % 2 ? C.magenta : '#fff'} opacity={0.9} />
          </g>
        );
      })}
    </Par>
  </>
);

const StreetGround: React.FC<{noon?: boolean}> = ({noon}) => (
  <g>
    <defs>
      <LinGrad id="st-road" stops={[[0, noon ? '#6d5fb8' : '#7a5fc2'], [1, noon ? '#3b2f86' : '#3b2b78']]} />
    </defs>
    <rect x={-800} y={GROUND - 12} width={W + 2400} height={40} fill={noon ? '#e6d9ff' : '#ffd9e8'} />
    <rect x={-800} y={GROUND + 28} width={W + 2400} height={1200} fill="url(#st-road)" />
    {Array.from({length: 16}, (_, i) => (
      <rect key={i} x={-760 + i * 220} y={GROUND + 150} width={120} height={12} rx={6} fill="#fff" opacity={0.6} />
    ))}
  </g>
);

export const Empty: React.FC<SceneProps> = ({v, t, k}) => {
  const cam = drift(camLerp({x: -160, y: 30, z: 1.06}, {x: 90, y: 0, z: 1.12}, easeInOut(k)), v, 4);
  const dogX = lerp(40, 620, k);
  const blink = Math.floor(v * 1.6) % 2 === 0;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Filters />
      <StreetBack cam={cam} v={v} />
      <Par cam={cam} d={1}>
        <StreetGround />
        {/* traffic light blinking amber */}
        <rect x={-96} y={760} width={14} height={520} fill="#2b1a55" />
        <rect x={-124} y={640} width={70} height={170} rx={18} fill="#2b1a55" />
        <circle cx={-89} cy={678} r={18} fill="#4a2f8a" />
        <circle cx={-89} cy={725} r={18} fill={blink ? C.amber : '#4a2f8a'} />
        <circle cx={-89} cy={772} r={18} fill="#4a2f8a" />
        {blink ? <Glow x={-89} y={725} r={90} c={C.amber} o={0.8} /> : null}
        {/* bus stop */}
        <rect x={620} y={840} width={12} height={440} fill="#2b1a55" />
        <rect x={1010} y={840} width={12} height={440} fill="#2b1a55" />
        <rect x={596} y={820} width={450} height={30} rx={10} fill={C.magenta} />
        <rect x={640} y={870} width={364} height={260} rx={8} fill="#bff1ff" opacity={0.35} />
        <rect x={660} y={1190} width={320} height={18} rx={8} fill="#2b1a55" />
        <circle cx={1070} cy={760} r={46} fill="#2f6bff" />
        <text x={1070} y={780} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={54} fill="#fff">
          A
        </text>
        <rect x={1064} y={806} width={12} height={480} fill="#2b1a55" />
        <Bus x={230} y={GROUND + 30} />
        {/* a newspaper tumbling along */}
        <g transform={`translate(${900 - t * 150} ${GROUND + 70 - Math.abs(Math.sin(t * 3)) * 60}) rotate(${t * 220})`}>
          <rect x={-22} y={-16} width={44} height={32} rx={3} fill="#fff" />
          <rect x={-16} y={-8} width={32} height={4} fill="#b8b0d6" />
          <rect x={-16} y={2} width={24} height={4} fill="#b8b0d6" />
        </g>
        <Dog x={dogX} y={GROUND + 150} t={v} />
      </Par>
    </svg>
  );
};

export const BusCab: React.FC<SceneProps> = ({v, t, k}) => {
  const cam = drift(camLerp({x: -30, y: 20, z: 1.05}, {x: 20, y: -10, z: 1.16}, easeOut(k)), v, 3);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Sky id="bc-sky" stops={[[0, '#7f8cf0'], [0.5, '#ffb0b8'], [1, '#fff0c9']]} />
      <Par cam={cam} d={0.3}>
        <Glow x={300} y={700} r={600} c="#fff3c4" o={0.9} />
        <circle cx={300} cy={700} r={120} fill="#fff7d6" />
        <Skyline b={ST_FAR} baseY={1000} fill="#c79cf0" />
        <rect x={-600} y={996} width={W + 1800} height={900} fill="#c79cf0" />
      </Par>
      <Par cam={cam} d={1}>
        <defs>
          <LinGrad id="bc-dash" stops={[[0, '#3b2b78'], [1, '#1a1036']]} />
          <LinGrad id="bc-seat" stops={[[0, '#ff6fb0'], [1, '#c2337f']]} />
        </defs>
        {/* cabin frame: windshield pillars and the roof */}
        <path d="M-300 -200 L1380 -200 L1380 360 L940 300 L140 300 L-300 360 Z" fill="#170a3b" />
        <path d="M-300 360 L140 300 L96 1180 L-300 1180 Z" fill="#170a3b" opacity={0.0} />
        <rect x={-300} y={300} width={90 + 300} height={900} fill="#221052" />
        <rect x={1000} y={300} width={400} height={900} fill="#221052" />
        <path d="M90 300 L140 300 L140 1100 L90 1100 Z" fill="#170a3b" />
        <path d="M940 300 L1000 300 L1000 1100 L940 1100 Z" fill="#170a3b" />
        <path d="M140 300 L520 300 L140 900 Z" fill="#fff" opacity={0.12} />
        {/* seat */}
        <rect x={250} y={520} width={330} height={640} rx={90} fill="url(#bc-seat)" />
        <rect x={300} y={440} width={230} height={150} rx={50} fill="#ff8fc2" />
        <rect x={290} y={640} width={250} height={16} rx={8} fill="#fff" opacity={0.25} />
        <path d="M250 800 Q250 1100 290 1160 L250 1160 Z" fill="#7a1f73" opacity={0.5} />
        {/* dashboard */}
        <path d="M-300 1080 L1380 1080 L1380 2100 L-300 2100 Z" fill="url(#bc-dash)" />
        <rect x={-300} y={1076} width={1700} height={10} fill="#7a56d6" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${150 + i * 120} 1210)`}>
            <circle r={44} fill="#0d0722" stroke="#7a56d6" strokeWidth={5} />
            <rect x={-3} y={-34} width={6} height={36} rx={3} fill={i === 1 ? C.magenta : C.cyan} transform={`rotate(${-120 + i * 60})`} />
          </g>
        ))}
        {/* wheel with the gamepad on it */}
        <rect x={676} y={1010} width={48} height={260} rx={20} fill="#120a2e" />
        <circle cx={700} cy={960} r={235} fill="none" stroke="#120a2e" strokeWidth={46} />
        <circle cx={700} cy={960} r={235} fill="none" stroke="#4a2f8a" strokeWidth={8} strokeDasharray="120 1360" strokeDashoffset={-980} />
        <path d="M480 960 L920 960 M700 960 L700 1190" stroke="#120a2e" strokeWidth={46} strokeLinecap="round" />
        <circle cx={700} cy={960} r={74} fill="#221052" />
        <Glow x={700} y={900} r={300} c="#fff" o={0.35 + 0.1 * Math.sin(v * 4)} />
        <Gamepad x={700} y={926 + Math.sin(v * 2.4) * 4} s={3.1} rot={-8} light={C.cyan} />
        {/* keys swinging */}
        <g transform={`translate(1010 1160) rotate(${Math.sin(v * 5) * 14})`}>
          <rect x={-3} y={0} width={6} height={70} fill="#d9d4ee" />
          <circle cx={0} cy={86} r={18} fill={C.amber} />
        </g>
      </Par>
    </svg>
  );
};

export const Cockpit: React.FC<SceneProps> = ({v, t, k}) => {
  const cam = drift(camLerp({x: 0, y: 30, z: 1.04}, {x: 0, y: -20, z: 1.14}, easeOut(k)), v, 3);
  const bank = Math.sin(v * 1.3) * 3;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Sky id="cp-sky" stops={[[0, '#2f6bff'], [0.45, '#7fd0ff'], [0.7, '#ffd9c0'], [1, '#ffb0b8']]} />
      <Par cam={cam} d={0.25}>
        <g transform={`rotate(${bank} 540 800)`}>
          <Glow x={540} y={760} r={640} c="#fff3c4" o={0.9} />
          <circle cx={540} cy={760} r={110} fill="#fff7d6" />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const q = (i / 6 + v * 0.22) % 1;
            const s = 0.4 + q * q * 3.2;
            return (
              <g key={i} transform={`translate(${540 + (rnd(i * 3.1) - 0.5) * 1500 * (0.3 + q)} ${780 + q * q * 520 + (rnd(i) - 0.5) * 160}) scale(${s})`} opacity={0.95}>
                <rect x={-130} y={0} width={260} height={46} rx={23} fill="#fff" />
                <rect x={-70} y={-30} width={150} height={56} rx={28} fill="#fff" />
              </g>
            );
          })}
        </g>
      </Par>
      <Par cam={cam} d={1}>
        <defs>
          <LinGrad id="cp-panel" stops={[[0, '#3b2b78'], [1, '#120a2e']]} />
          <LinGrad id="cp-seat" stops={[[0, '#5a6ff0'], [1, '#2c2f73']]} />
        </defs>
        {/* windshield frame */}
        <path d="M-300 -300 L1380 -300 L1380 500 L1040 420 L600 400 L600 1000 L480 1000 L480 400 L40 420 L-300 500 Z" fill="#170a3b" />
        <path d="M-300 500 L40 420 L10 1020 L-300 1040 Z M1380 500 L1040 420 L1070 1020 L1380 1040 Z" fill="#221052" />
        {/* panel */}
        <path d="M-300 1010 L1380 1010 L1380 2200 L-300 2200 Z" fill="url(#cp-panel)" />
        <rect x={-300} y={1004} width={1700} height={10} fill="#7a56d6" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={70 + i * 250} y={1050} width={200} height={130} rx={14} fill="#0d0722" stroke="#4a2f8a" strokeWidth={4} />
            {i % 2 === 0 ? (
              <>
                <rect x={80 + i * 250} y={1060} width={180} height={55} fill="#2f8cff" transform={`rotate(${-bank * 3} ${170 + i * 250} 1115)`} />
                <rect x={80 + i * 250} y={1115} width={180} height={55} fill="#b8642a" transform={`rotate(${-bank * 3} ${170 + i * 250} 1115)`} />
              </>
            ) : (
              <path d={`M${90 + i * 250} 1150 l30 -40 l30 20 l40 -50 l40 30`} stroke={C.teal} strokeWidth={5} fill="none" />
            )}
          </g>
        ))}
        <rect x={380} y={1196} width={320} height={64} rx={14} fill="#0d0722" stroke="#ff4d5e" strokeWidth={4} />
        <Glow x={540} y={1228} r={260} ry={90} c="#ff4d5e" o={Math.floor(v * 4) % 2 ? 0.6 : 0.15} />
        <text x={540} y={1241} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={36} fill={Math.floor(v * 4) % 2 ? '#fff' : '#ff4d5e'}>
          АВТОПИЛОТ
        </text>
        {/* two empty seats, seen from behind, and the yokes */}
        {[220, 860].map((sx, i) => (
          <g key={i} transform="translate(0 -150)">
            <path d={`M${sx - 60} 1260 q0 -70 60 -70 q60 0 60 70 l-20 40 l-80 0 Z`} fill="#120a2e" />
            <rect x={sx - 12} y={1280} width={24} height={200} fill="#120a2e" />
            <rect x={sx - 150} y={1400} width={300} height={900} rx={70} fill="url(#cp-seat)" />
            <rect x={sx - 96} y={1310} width={192} height={130} rx={46} fill="#7f8cf0" />
            <rect x={sx - 110} y={1560} width={220} height={16} rx={8} fill="#fff" opacity={0.2} />
          </g>
        ))}
        {/* headset left on the seat */}
        <g transform="translate(0 -150)">
          <path d="M150 1420 Q220 1340 290 1420" stroke="#0d0722" strokeWidth={16} fill="none" strokeLinecap="round" />
          <rect x={132} y={1404} width={36} height={60} rx={14} fill={C.magenta} />
          <rect x={272} y={1404} width={36} height={60} rx={14} fill={C.magenta} />
        </g>
      </Par>
    </svg>
  );
};

export const Office: React.FC<SceneProps> = ({v, t, k}) => {
  const cam = drift(camLerp({x: 0, y: 40, z: 1.02}, {x: 0, y: 0, z: 1.12}, easeOut(k)), v, 3);
  const ring = Math.sin(v * 60) * 5 * (Math.floor(v * 2.2) % 2 === 0 ? 1 : 0);
  const spin = Math.sin(t * 1.5) * 16 + 10;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <defs>
        <LinGrad id="of-wall" stops={[[0, '#3b1c7a'], [1, '#6a2b9c']]} />
        <LinGrad id="of-desk" stops={[[0, '#b8642a'], [1, '#7a3a1e']]} />
        <LinGrad id="of-chair" stops={[[0, '#ff5a6e'], [1, '#a81c4a']]} />
        <LinGrad id="of-win" stops={[[0, '#7fb0ff'], [0.6, '#ffc7c0'], [1, '#fff0c9']]} />
      </defs>
      <Par cam={cam} d={0.85}>
        <rect x={-400} y={-400} width={W + 800} height={2000} fill="url(#of-wall)" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect key={i} x={-300 + i * 220} y={-400} width={6} height={2000} fill="#fff" opacity={0.05} />
        ))}
        {/* tall windows with drapes */}
        {[150, 930].map((wx, i) => (
          <g key={i}>
            <rect x={wx - 130} y={260} width={260} height={720} rx={130} fill="url(#of-win)" />
            <rect x={wx - 5} y={260} width={10} height={720} fill="#3b1c7a" />
            <rect x={wx - 130} y={610} width={260} height={10} fill="#3b1c7a" />
            <path d={`M${wx - 170} 230 L${wx - 70} 230 Q${wx - 60} 620 ${wx - 130} 1010 L${wx - 170} 1010 Z`} fill={C.magenta} />
            <path d={`M${wx + 170} 230 L${wx + 70} 230 Q${wx + 60} 620 ${wx + 130} 1010 L${wx + 170} 1010 Z`} fill={C.magenta} />
            <Glow x={wx} y={640} r={420} c="#ffd9c0" o={0.45} />
          </g>
        ))}
        {/* round emblem: just a star */}
        <circle cx={540} cy={420} r={120} fill="#2a1160" stroke={C.amber} strokeWidth={10} />
        <path d={starPath(540, 420, 70)} fill={C.amber} />
      </Par>
      <Par cam={cam} d={1}>
        {/* chair, slowly swinging, empty */}
        <g transform={`translate(540 920)`}>
          <rect x={-22} y={180} width={44} height={200} fill="#120a2e" />
          <g transform={`scale(${Math.cos((spin * Math.PI) / 180)} 1)`}>
            <path d="M-170 220 L-190 -220 Q-190 -330 0 -330 Q190 -330 190 -220 L170 220 Z" fill="url(#of-chair)" />
            <path d="M-130 190 L-146 -210 Q-146 -290 0 -290 Q146 -290 146 -210 L130 190 Z" fill="#ff7a8a" opacity={0.5} />
            {[0, 1, 2].map((i) => (
              <rect key={i} x={-110} y={-190 + i * 110} width={220} height={8} rx={4} fill="#7a1f3a" opacity={0.5} />
            ))}
          </g>
        </g>
        {/* desk */}
        <rect x={-200} y={1150} width={W + 400} height={60} rx={12} fill="#d9843a" />
        <rect x={-160} y={1206} width={W + 320} height={900} fill="url(#of-desk)" />
        <rect x={-160} y={1206} width={W + 320} height={14} fill="#5a2a14" opacity={0.5} />
        {/* nameplate */}
        <g transform="translate(540 1096)">
          <path d="M-268 60 L-244 -56 L244 -56 L268 60 Z" fill="#120a2e" />
          <path d="M-250 -44 L250 -44 L260 6 L-260 6 Z" fill={C.amber} />
          <rect x={-250} y={-44} width={500} height={8} fill="#fff" opacity={0.45} />
          <text y={1} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={44} fill="#120a2e" letterSpacing={2} dominantBaseline="middle" transform="translate(0 -16)">
            ПРЕЗИДЕНТ
          </text>
        </g>
        {/* the gamepad left on the desk */}
        <Glow x={930} y={1250} r={220} c={C.cyan} o={0.5} />
        <Gamepad x={930} y={1258} s={1.9} rot={10} light={C.cyan} />
        {/* the red phone ringing */}
        <g transform={`translate(150 1256) rotate(${ring})`}>
          <rect x={-92} y={-14} width={184} height={64} rx={18} fill="#e8303f" />
          <path d="M-110 -34 Q-110 -74 -70 -74 L70 -74 Q110 -74 110 -34 L110 -14 L62 -14 L62 -38 L-62 -38 L-62 -14 L-110 -14 Z" fill="#ff4d5e" />
          <circle cx={0} cy={18} r={20} fill="#fff" opacity={0.9} />
        </g>
        {[0, 1, 2].map((i) => {
          const q = (v * 2.2 + i / 3) % 1;
          return <path key={i} d={`M${150 - 130 - q * 40} ${1200 - q * 20} q-24 30 0 60 M${150 + 130 + q * 40} ${1200 - q * 20} q24 30 0 60`} stroke="#ff4d5e" strokeWidth={8} fill="none" strokeLinecap="round" opacity={(1 - q) * 0.9} />;
        })}
      </Par>
    </svg>
  );
};

// ======================================================================== 4b. granny drives like in the game
const RAMP = {x0: 150, y0: GROUND + 20, x1: 520, y1: GROUND - 250};
const ROOF = {x: 1180, y: 690};

export const JumpShot: React.FC<SceneProps> = ({v, t, k}) => {
  // car path: road -> ramp -> arc -> the roof
  const tj = v - JUMP;
  const air = LAND - JUMP;
  let cx: number;
  let cy: number;
  let rot: number;
  const rampAng = (Math.atan2(RAMP.y1 - RAMP.y0, RAMP.x1 - RAMP.x0) * 180) / Math.PI;
  if (tj < -0.55) {
    const q = ramp(tj, -3, -0.55);
    cx = lerp(-700, RAMP.x0, q * q);
    cy = RAMP.y0;
    rot = 0;
  } else if (tj < 0) {
    const q = ramp(tj, -0.55, 0);
    cx = lerp(RAMP.x0, RAMP.x1, q);
    cy = lerp(RAMP.y0, RAMP.y1, q);
    rot = rampAng;
  } else if (tj < air) {
    const q = tj / air;
    cx = lerp(RAMP.x1, ROOF.x, q);
    cy = lerp(RAMP.y1, ROOF.y, q) - Math.sin(q * Math.PI) * 430;
    rot = lerp(rampAng, 8, q) - Math.sin(q * Math.PI) * 14 + q * 360 * (q < 1 ? 1 : 0);
  } else {
    const q = tj - air;
    cx = ROOF.x + Math.min(70, q * 220);
    cy = ROOF.y - Math.abs(Math.sin(q * 9)) * 40 * Math.exp(-q * 4);
    rot = Math.sin(q * 14) * 6 * Math.exp(-q * 4);
  }
  const follow = smooth(ramp(tj, -0.3, air + 0.2));
  const cam = drift(camLerp({x: -120, y: 120, z: 1.0}, {x: 560, y: -190, z: 1.12}, follow), v, 3);
  const shake = tj > air ? Math.exp(-(tj - air) * 6) * 16 : 0;
  cam.y += Math.sin(v * 80) * shake;
  const landed = tj - air;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Filters />
      <StreetBack cam={cam} v={v} noon />
      <Par cam={cam} d={1}>
        <StreetGround noon />
        {/* the house whose roof she lands on */}
        <rect x={900} y={ROOF.y} width={640} height={GROUND - ROOF.y + 10} fill="#ff8fb0" />
        <rect x={880} y={ROOF.y - 16} width={680} height={34} rx={8} fill="#fff3df" />
        <rect x={1440} y={ROOF.y} width={100} height={GROUND - ROOF.y + 10} fill="#2b1a55" opacity={0.14} />
        {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={950 + c * 140} y={ROOF.y + 70 + r * 170} width={84} height={104} rx={8} fill="#2b1a55" opacity={0.5} />))}
        <rect x={930} y={ROOF.y + 470} width={560} height={26} rx={8} fill={C.magenta} />
        <text x={1210} y={ROOF.y + 452} textAnchor="middle" fontFamily={SCRIPT} fontSize={60} fill="#fff">
          Продукты
        </text>
        <rect x={1030} y={ROOF.y - 96} width={70} height={84} fill="#c9587a" />
        {/* the truck with the ramp */}
        <g>
          <path d={`M${RAMP.x0 - 30} ${RAMP.y0 + 6} L${RAMP.x1} ${RAMP.y1} L${RAMP.x1 + 26} ${RAMP.y1 + 16} L${RAMP.x1 + 26} ${RAMP.y0 + 6} Z`} fill="#3b2b78" />
          <path d={`M${RAMP.x0 - 30} ${RAMP.y0 + 6} L${RAMP.x1} ${RAMP.y1} L${RAMP.x1 + 6} ${RAMP.y1 + 12} L${RAMP.x0 - 10} ${RAMP.y0 + 6} Z`} fill={C.amber} />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${200 + i * 80} ${GROUND + 26} L${250 + i * 80} ${GROUND - 34 - i * 58} L${262 + i * 80} ${GROUND - 34 - i * 58 + 10} L${212 + i * 80} ${GROUND + 26} Z`} fill="#fff" opacity={0.25} />
          ))}
          <rect x={546} y={GROUND - 190} width={170} height={200} rx={26} fill="#19c2b2" />
          <rect x={620} y={GROUND - 160} width={84} height={80} rx={12} fill="#bff1ff" />
          <rect x={300} y={GROUND - 14} width={430} height={30} rx={10} fill="#1a1036" />
          {[360, 650].map((wx) => (
            <g key={wx} transform={`translate(${wx} ${GROUND + 26})`}>
              <circle r={40} fill="#1a1036" />
              <circle r={17} fill="#d9d4ee" />
            </g>
          ))}
        </g>
        {/* speed lines + the car */}
        {tj > -1.2 && tj < air
          ? [0, 1, 2, 3].map((i) => <rect key={i} x={cx - 260 - i * 40} y={cy - 110 + i * 26} width={150} height={7} rx={3.5} fill="#fff" opacity={0.6 - i * 0.1} transform={`rotate(${rot} ${cx} ${cy})`} />)
          : null}
        <GrannyCar x={cx} y={cy} rot={rot} t={v} spin={v * 900} />
        {landed > 0 ? (
          <>
            <Burst x={cx - 40} y={ROOF.y - 8} t={landed} n={26} seed={9} cols={['#fff3df', '#ffd9e8', '#fff']} power={420} g={500} />
            <g transform={`translate(${cx} ${cy - 210}) scale(${pop(landed - 0.15, 8)})`}>
              <Wanted x={0} y={0} n={5} on={Math.min(3, Math.floor((landed - 0.15) / 0.16) + 1)} t={v} s={1.25} />
            </g>
          </>
        ) : null}
      </Par>
    </svg>
  );
};

// ======================================================================== 4c. the police station: they play too
const COP: Look = {top: '#3f6bff', topD: '#2a44c2', pants: '#1d1f52', pantsD: '#14163d', hair: '#2b1a55', hairL: '#4a2f8a', cap: true, pad: true};

export const Police: React.FC<SceneProps> = ({v, t, k}) => {
  const cam = drift(camLerp({x: 0, y: 30, z: 1.02}, {x: 0, y: -10, z: 1.1}, easeOut(k)), v, 3);
  const lamp = (v - ALARM) * 5;
  const red = 0.5 + 0.5 * Math.sin(lamp);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <defs>
        <LinGrad id="po-wall" stops={[[0, '#1c1552'], [1, '#34288c']]} />
        <LinGrad id="po-desk" stops={[[0, '#5a6ff0'], [1, '#2c2f73']]} />
        <LinGrad id="po-beam" stops={[[0, '#ff3b4e', 0.6], [1, '#ff3b4e', 0]]} x1={0} y1={0} x2={1} y2={0} />
      </defs>
      <Par cam={cam} d={0.88}>
        <rect x={-400} y={-400} width={W + 800} height={2200} fill="url(#po-wall)" />
        <rect x={-400} y={1080} width={W + 800} height={14} fill="#5a6ff0" opacity={0.5} />
        {/* sign */}
        <rect x={250} y={250} width={580} height={130} rx={24} fill="#0d0722" stroke="#5a8cff" strokeWidth={6} />
        <text x={540} y={346} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={84} fill="#fff" letterSpacing={4}>
          ПОЛИЦИЯ
        </text>
        <Glow x={540} y={310} r={520} ry={200} c="#5a8cff" o={0.45} />
        {/* wanted board */}
        <g transform="translate(230 600) rotate(-3)">
          <rect x={-130} y={-170} width={260} height={340} rx={10} fill="#fff3df" />
          <text y={-112} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={38} fill="#e8303f">
            РОЗЫСК
          </text>
          <rect x={-100} y={-90} width={200} height={150} rx={6} fill="#bff1ff" />
          <g transform="translate(0 46) scale(0.72)">
            <path d="M-96 -22 Q-100 -62 -64 -66 L-44 -118 Q-38 -132 -20 -132 L44 -132 Q62 -132 72 -116 L92 -66 Q110 -62 108 -22 Z" fill="#ffd23f" />
            <circle cx={-58} cy={-14} r={25} fill="#1a1036" />
            <circle cx={62} cy={-14} r={25} fill="#1a1036" />
            <circle cx={34} cy={-92} r={20} fill="#ffc7a1" />
            <path d="M12 -96 Q12 -118 34 -118 Q56 -118 54 -98 Q38 -108 24 -100 Z" fill="#ff5fa2" />
          </g>
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={starPath(-88 + i * 44, 112, 19)} fill={i < 3 ? '#ffb21f' : '#d9d0c0'} />
          ))}
        </g>
        {/* alarm lamp */}
        <g transform="translate(850 540)">
          <g transform={`rotate(${(lamp * 180) / Math.PI})`} style={{mixBlendMode: 'screen'}}>
            <path d="M0 0 L900 -160 L900 160 Z" fill="url(#po-beam)" />
            <path d="M0 0 L-900 -160 L-900 160 Z" fill="url(#po-beam)" transform="scale(-1 1) scale(-1 1)" opacity={0.6} />
          </g>
          <rect x={-46} y={30} width={92} height={26} rx={8} fill="#0d0722" />
          <path d="M-36 30 Q-36 -44 0 -44 Q36 -44 36 30 Z" fill="#ff3b4e" />
          <path d="M-20 20 Q-22 -26 0 -30" stroke="#fff" strokeWidth={7} fill="none" opacity={0.6} strokeLinecap="round" />
          <Glow x={0} y={0} r={300} c="#ff3b4e" o={0.4 + 0.5 * red} />
        </g>
      </Par>
      <Par cam={cam} d={1}>
        {/* two officers behind the desk, eyes on the game */}
        <g transform="translate(540 1100) scale(1.5) translate(-540 -1270)">
          <Fan x={300} y={1270} t={v} look={COP} legs={false} rim={C.cyan} press={Math.max(0, Math.sin(v * 9))} />
          <g transform="translate(1080 0) scale(-1 1)">
            <Fan x={300} y={1270} t={v + 1.3} look={{...COP, hair: '#b8642a', hairL: '#e8893a'}} legs={false} rim={C.pink} press={Math.max(0, Math.sin(v * 7 + 1))} />
          </g>
          {/* the small TV between them */}
          <g transform="translate(540 1070)">
            <rect x={-104} y={-96} width={208} height={150} rx={14} fill="#0d0722" />
            <rect x={-92} y={-84} width={184} height={126} rx={8} fill="#2fa8ff" />
            <rect x={-92} y={-16} width={184} height={58} fill="#ffd98a" />
            <path d="M-8 -16 L8 -16 L56 42 L-56 42 Z" fill="#4a4470" />
            <path d={`M${-20 + Math.sin(v * 3) * 8} 34 l0 -20 q2 -8 12 -8 l16 0 q10 0 12 8 l0 20 Z`} fill={C.magenta} />
            <circle cx={50} cy={-54} r={14} fill="#fff7b8" />
            <Glow x={0} y={-20} r={300} c={C.cyan} o={0.4 + 0.08 * Math.sin(v * 9)} />
            <rect x={-16} y={54} width={32} height={50} fill="#0d0722" />
          </g>
        </g>
        <rect x={-300} y={1150} width={W + 600} height={50} rx={12} fill="#7f8cf0" />
        <rect x={-260} y={1196} width={W + 520} height={900} fill="url(#po-desk)" />
        <g transform="translate(540 1130)">
          <rect x={-110} y={-8} width={220} height={38} rx={8} fill="#ff8fb0" />
          {[-62, 0, 62].map((dx, i) => (
            <g key={i}>
              <ellipse cx={dx} cy={-8} rx={30} ry={15} fill={[C.amber, '#fff3df', '#b8642a'][i]} />
              <ellipse cx={dx} cy={-9} rx={10} ry={5} fill="#ff8fb0" />
            </g>
          ))}
        </g>
      </Par>
      <rect width={W} height={H} fill="#ff2a3c" opacity={0.1 * red} style={{mixBlendMode: 'screen'}} />
    </svg>
  );
};
