import React from 'react';
import {C, Cam, DISPLAY, Glow, H, Limb, LinGrad, Par, W, clamp01, lerp, mix, rnd, skyline, Skyline, wavePath} from './kit';
import {Can, Console, GameBox, Gamepad} from './props';

// The Fan's flat: a front-facing sofa, the TV in the right corner turned to the sofa, a window in the back wall.
// Used by: room (press «ИГРАТЬ», time-lapse), flood, gator and the cover.

export const FLOOR = 1340;
export const SEAT = 1130;
const FAN_X = 200;
const GATOR_X = 452;

// ---------------------------------------------------------------- TV pictures (310 x 200, origin top-left)
const TW = 310;
const TH = 200;

const Road: React.FC<{id: string; x: number; w: number; v: number; car: string; car2: string; label?: string; steer?: number}> = ({id, x, w, v, car, car2, label, steer = 0}) => {
  const cx = x + w / 2;
  const hor = 92;
  return (
    <g>
      <defs>
        <LinGrad id={`${id}sky`} stops={[[0, '#2fa8ff'], [0.7, '#9fe6ff'], [1, '#fff3c4']]} />
        <clipPath id={`${id}c`}>
          <rect x={x} y={0} width={w} height={TH} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect x={x} y={0} width={w} height={hor} fill={`url(#${id}sky)`} />
        <circle cx={cx + w * 0.22} cy={34} r={20} fill="#fff7b8" />
        <circle cx={cx + w * 0.22} cy={34} r={34} fill="#fff7b8" opacity={0.3} />
        <path d={`M${x} ${hor - 12} q${w * 0.2} -16 ${w * 0.4} -4 t${w * 0.6} -6 L${x + w} ${hor} L${x} ${hor} Z`} fill="#3fd0b6" />
        <rect x={x} y={hor} width={w} height={TH - hor} fill="#ffd98a" />
        <rect x={x} y={hor} width={w} height={10} fill="#19b9c9" />
        <path d={`M${cx - 10 + steer * 6} ${hor} L${cx + 10 + steer * 6} ${hor} L${cx + w * 0.46} ${TH} L${cx - w * 0.46} ${TH} Z`} fill="#4a4470" />
        {[0, 1, 2, 3].map((i) => {
          const k = (i / 4 + v * 1.4) % 1;
          const y = hor + k * k * (TH - hor);
          const ww = 2 + k * 7;
          return <rect key={i} x={cx - ww / 2 + steer * 6 * (1 - k)} y={y} width={ww} height={6 + k * 22} fill="#fff" opacity={0.9} />;
        })}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const k = (i / 6 + v * 0.7) % 1;
          const side = i % 2 === 0 ? -1 : 1;
          const s = 0.12 + k * k * 1.3;
          const px = cx + side * (16 + k * k * w * 0.62) + steer * 6 * (1 - k);
          const py = hor + k * k * (TH - hor) * 0.9;
          return (
            <g key={i} transform={`translate(${px} ${py}) scale(${s})`}>
              <rect x={-3} y={-70} width={6} height={70} fill="#7a4a2a" />
              {[-2.7, -2.1, -1.5, -0.9, -0.3].map((a, j) => (
                <path key={j} d={`M0 -70 Q${Math.cos(a) * 26} ${-92 + Math.sin(a) * 12} ${Math.cos(a) * 46} ${-58 + Math.sin(a) * 8} Q${Math.cos(a) * 22} ${-74} 0 -66 Z`} fill="#17a05d" />
              ))}
            </g>
          );
        })}
        {/* the car from behind */}
        <g transform={`translate(${cx + steer * 10 + Math.sin(v * 3) * 3} ${TH - 38 + Math.sin(v * 17) * 0.8})`}>
          <ellipse cx={0} cy={22} rx={40} ry={7} fill="#000" opacity={0.25} />
          <path d="M-34 18 L-36 -2 Q-34 -10 -24 -11 L24 -11 Q34 -10 36 -2 L34 18 Z" fill={car} />
          <path d="M-22 -11 L-16 -26 L16 -26 L22 -11 Z" fill={car2} />
          <path d="M-17 -13 L-13 -23 L13 -23 L17 -13 Z" fill="#bff1ff" />
          <rect x={-33} y={0} width={14} height={6} rx={2} fill="#ff3b4e" />
          <rect x={19} y={0} width={14} height={6} rx={2} fill="#ff3b4e" />
          <rect x={-30} y={16} width={12} height={8} rx={2} fill="#1a1230" />
          <rect x={18} y={16} width={12} height={8} rx={2} fill="#1a1230" />
        </g>
        {label ? (
          <g>
            <rect x={x + 8} y={8} width={44} height={24} rx={8} fill="rgba(10,4,32,0.7)" />
            <text x={x + 30} y={26} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={16} fill="#fff">
              {label}
            </text>
          </g>
        ) : null}
      </g>
    </g>
  );
};

export type TvMode = 'menu' | 'game' | 'split';
export const TvPicture: React.FC<{mode: TvMode; v: number; press?: number; id: string; wipe?: number}> = ({mode, v, press = 0, id, wipe = 0}) => (
  <g>
    <defs>
      <LinGrad id={`${id}m`} stops={[[0, '#2a1260'], [0.45, '#b02a8f'], [0.75, '#ff6a6a'], [1, '#ffc76b']]} />
      <clipPath id={`${id}clip`}>
        <rect width={TW} height={TH} rx={6} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id}clip)`}>
      {mode === 'menu' ? (
        <g>
          <rect width={TW} height={TH} fill={`url(#${id}m)`} />
          <circle cx={TW / 2} cy={118} r={64} fill="#ffe08a" />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={60} y={128 + i * 14} width={190} height={4 + i} fill="#ff6a6a" />
          ))}
          <rect y={150} width={TW} height={50} fill="#1b0b3a" />
          <text x={TW / 2 - 14} y={62} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={50} fill="#fff" transform="skewX(-8)">
            GTA
          </text>
          <text x={TW / 2 + 98} y={66} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={58} fill="#ffe14d" transform="skewX(-8)">
            6
          </text>
          <g transform={`translate(${TW / 2} 148) scale(${1 + 0.04 * Math.sin(v * 5) - press * 0.1})`}>
            <rect x={-94} y={-28} width={188} height={56} rx={28} fill={press > 0.5 ? '#fff' : C.magenta} stroke="#fff" strokeWidth={4} />
            <text y={11} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={30} fill={press > 0.5 ? C.magenta : '#fff'}>
              ИГРАТЬ
            </text>
          </g>
        </g>
      ) : null}
      {mode === 'game' ? (
        <g>
          <Road id={`${id}r`} x={0} w={TW} v={v} car={C.magenta} car2="#c21a66" steer={Math.sin(v * 0.9)} />
          <circle cx={34} cy={166} r={22} fill="rgba(10,4,32,0.6)" stroke="#fff" strokeWidth={2} />
          <path d="M22 172 L34 152 L44 170" stroke={C.cyan} strokeWidth={3} fill="none" />
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={TW - 18 - i * 16} cy={16} r={5} fill={i > 2 ? '#ffe14d' : 'rgba(255,255,255,0.4)'} />
          ))}
        </g>
      ) : null}
      {mode === 'split' ? (
        <g>
          <Road id={`${id}r1`} x={0} w={TW / 2 - 2} v={v} car={C.magenta} car2="#c21a66" label="P1" steer={Math.sin(v * 0.9)} />
          <Road id={`${id}r2`} x={TW / 2 + 2} w={TW / 2 - 2} v={v + 0.4} car="#3fd07c" car2="#1f9160" label="P2" steer={Math.sin(v * 1.3 + 2)} />
          <rect x={TW / 2 - 2} y={0} width={4} height={TH} fill="#0a0420" />
        </g>
      ) : null}
      {wipe > 0 ? <rect width={TW} height={TH} fill="#fff" opacity={wipe} /> : null}
      <path d={`M0 0 L${TW * 0.36} 0 L${TW * 0.12} ${TH} L0 ${TH} Z`} fill="#fff" opacity={0.06} />
    </g>
  </g>
);

// ---------------------------------------------------------------- the Fan (front body, head turned right to the TV)
const SKIN = '#ffc7a1';
const SKIN_D = '#e59a78';

export type Look = {top: string; topD: string; pants: string; pantsD: string; hair: string; hairL: string; phones?: boolean; glasses?: boolean; cap?: boolean; pad?: boolean};
export const FAN_LOOK: Look = {top: '#ff8a3c', topD: '#d95a2b', pants: '#2c2f73', pantsD: '#1d1f52', hair: '#2b1a55', hairL: '#4a2f8a', pad: true};
export const Fan: React.FC<{x: number; y: number; up?: number; press?: number; tired?: number; rim?: string; t: number; wet?: boolean; look?: Look; s?: number; legs?: boolean; hands?: [number, number]}> = ({x, y, up = 0, press = 0, tired = 0, rim = C.cyan, t, wet, look = FAN_LOOK, s = 1, legs = true, hands}) => {
  const {top: HOOD, topD: HOOD_D, pants: PANTS, pantsD: PANTS_D, hair: HAIR, hairL: HAIR_L} = look;
  const padY = lerp(-42, -138, up);
  const elbowY = lerp(-58, -104, up);
  const elbowX = lerp(88, 104, up);
  const breathe = Math.sin(t * 1.8) * 2;
  const thumb = press * 4;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* legs */}
      {legs ? (
        <>
      <rect x={-72} y={30} width={52} height={170} rx={24} fill={PANTS_D} />
      <rect x={20} y={30} width={52} height={170} rx={24} fill={PANTS} />
      <circle cx={-46} cy={30} r={40} fill={PANTS_D} />
      <circle cx={46} cy={30} r={40} fill={PANTS} />
      <path d="M-86 204 Q-86 182 -46 182 Q-12 182 -12 204 Q-12 214 -22 214 L-76 214 Q-86 214 -86 204 Z" fill="#fff" />
      <path d="M12 204 Q12 182 46 182 Q86 182 86 204 Q86 214 76 214 L22 214 Q12 214 12 204 Z" fill="#fff" />
      <rect x={-86} y={206} width={74} height={8} rx={4} fill={C.magenta} />
      <rect x={12} y={206} width={74} height={8} rx={4} fill={C.magenta} />
        </>
      ) : null}
      {/* hood behind the neck */}
      <ellipse cx={-6} cy={-170 + breathe} rx={84} ry={36} fill={HOOD_D} />
      {/* torso */}
      <path d={`M-78 ${-150 + breathe} Q-80 ${-176 + breathe} -50 ${-176 + breathe} L50 ${-176 + breathe} Q80 ${-176 + breathe} 78 ${-150 + breathe} L74 0 Q74 22 50 22 L-50 22 Q-74 22 -74 0 Z`} fill={HOOD} />
      <path d={`M40 ${-176 + breathe} L50 ${-176 + breathe} Q80 ${-176 + breathe} 78 ${-150 + breathe} L74 0 Q74 22 50 22 L36 22 Z`} fill={rim} opacity={0.35} />
      <path d={`M-78 ${-150 + breathe} Q-80 ${-176 + breathe} -50 ${-176 + breathe} L-30 ${-176 + breathe} L-40 22 L-50 22 Q-74 22 -74 0 Z`} fill={HOOD_D} opacity={0.55} />
      <rect x={-44} y={-52} width={88} height={54} rx={18} fill={HOOD_D} opacity={0.6} />
      <path d={`M-12 ${-170 + breathe} L-14 -120`} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
      <path d={`M14 ${-170 + breathe} L16 -126`} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
      {/* neck + head */}
      <rect x={-20} y={-196 + breathe} width={40} height={34} rx={12} fill={SKIN_D} />
      <g transform={`translate(4 ${-240 + breathe})`}>
        <circle r={66} fill={SKIN} />
        <path d="M36 -53 A64 64 0 0 1 56 30" stroke={rim} strokeWidth={7} fill="none" opacity={0.7} strokeLinecap="round" />
        {/* nose */}
        <path d="M58 -14 Q84 -4 62 14 Z" fill={SKIN} />
        <path d="M66 -8 Q82 -2 66 10" stroke={rim} strokeWidth={4} fill="none" opacity={0.6} strokeLinecap="round" />
        {/* ear */}
        <ellipse cx={-22} cy={2} rx={13} ry={17} fill={SKIN_D} />
        {/* hair */}
        <path d="M-66 6 Q-78 -62 -22 -76 Q30 -92 58 -44 Q32 -52 8 -40 Q-22 -30 -30 4 Q-48 -2 -52 22 Q-66 22 -66 6 Z" fill={HAIR} />
        <path d="M-22 -76 Q30 -92 58 -44 Q40 -62 14 -64 Z" fill={HAIR_L} />
        {wet ? <path d="M-30 -78 q-6 -22 6 -30 q12 12 2 30 Z" fill={HAIR} /> : null}
        {look.cap ? (
          <>
            <path d="M-64 -30 Q-66 -84 0 -86 Q60 -86 64 -34 Z" fill={HOOD_D} />
            <path d="M40 -40 L98 -30 Q104 -22 96 -18 L44 -24 Z" fill="#141a4a" />
            <path d="M-64 -30 L64 -34 L64 -22 L-64 -18 Z" fill="#141a4a" />
            <path d="M14 -66 l6 12 l13 2 l-10 9 l3 13 l-12 -7 l-12 7 l3 -13 l-10 -9 l13 -2 Z" fill="#ffe14d" transform="translate(-6 0) scale(0.8)" />
          </>
        ) : null}
        {/* eye */}
        <ellipse cx={34} cy={-8} rx={15} ry={17} fill="#fff" />
        <circle cx={40} cy={-6} r={8} fill="#1b1036" />
        <circle cx={43} cy={-9} r={3} fill={rim} />
        <path d={`M17 ${-22 + tired * 14} Q34 ${-34 + tired * 20} 51 ${-22 + tired * 14} L52 -30 L16 -30 Z`} fill={SKIN} />
        <path d={`M16 ${-25 + tired * 14} Q34 ${-34 + tired * 20} 52 ${-25 + tired * 14}`} stroke={HAIR} strokeWidth={4} fill="none" strokeLinecap="round" />
        {tired > 0.3 ? <path d="M20 13 Q34 22 50 13" stroke="#b56a8a" strokeWidth={4} fill="none" strokeLinecap="round" opacity={tired} /> : null}
        {look.glasses ? (
          <>
            <rect x={12} y={-28} width={44} height={36} rx={10} fill="rgba(160,240,255,0.35)" stroke="#120a2e" strokeWidth={6} />
            <path d="M12 -12 L-40 -18" stroke="#120a2e" strokeWidth={6} strokeLinecap="round" />
          </>
        ) : null}
        {look.phones ? (
          <>
            <path d="M-34 -70 Q4 -104 40 -72" stroke="#120a2e" strokeWidth={16} fill="none" strokeLinecap="round" />
            <rect x={-46} y={-30} width={48} height={66} rx={20} fill="#120a2e" />
            <rect x={-38} y={-20} width={32} height={46} rx={14} fill={C.magenta} />
          </>
        ) : null}
        {/* mouth */}
        <ellipse cx={46} cy={34} rx={7 + press * 3} ry={4 + press * 5 + tired * 3} fill="#7a2b4a" />
      </g>
      {/* arms + gamepad */}
      <Limb a={[-72, -138 + breathe]} c={[-elbowX - 14, elbowY]} b={[hands ? -hands[0] : -40, hands ? hands[1] : padY + 6]} w={44} fill={HOOD_D} />
      <Limb a={[72, -138 + breathe]} c={[elbowX + 14, elbowY]} b={[hands ? hands[0] : 40, hands ? hands[1] : padY + 6]} w={44} fill={HOOD} />
      {look.pad ? <Gamepad x={0} y={padY} s={1.05} press={press} light={rim} /> : null}
      <circle cx={hands ? -hands[0] - 6 : -46} cy={hands ? hands[1] + 6 : padY + 12} r={19} fill={SKIN_D} />
      <circle cx={hands ? hands[0] + 6 : 46} cy={hands ? hands[1] + 6 - thumb : padY + 12 - thumb} r={19} fill={SKIN} />
    </g>
  );
};

// ---------------------------------------------------------------- the alligator (front body, head in profile to the TV)
const G = '#3ac47c';
const G_D = '#1f9463';
const G_DD = '#157150';
const BELLY = '#e9f7ae';

export const Gator: React.FC<{x: number; y: number; grab?: number; t: number; rim?: string; jaw?: number}> = ({x, y, grab = 1, t, rim = C.cyan, jaw = 0.15}) => {
  const padY = lerp(-10, -150, grab);
  const breathe = Math.sin(t * 1.5 + 1) * 2.5;
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* tail on the sofa */}
      <path d="M-60 -10 Q-150 -6 -196 -70 Q-214 -104 -200 -128 Q-176 -84 -120 -66 Q-80 -58 -50 -70 Z" fill={G_D} />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${-178 + i * 30} ${-78 + i * 9} l10 -22 l12 20 Z`} fill={G_DD} />
      ))}
      {/* feet */}
      <ellipse cx={-56} cy={26} rx={40} ry={24} fill={G_D} />
      <ellipse cx={58} cy={26} rx={40} ry={24} fill={G} />
      {[-1, 1].map((s) =>
        [0, 1, 2].map((i) => <path key={`${s}${i}`} d={`M${s * 56 - 26 + i * 22} 44 l6 14 l6 -14 Z`} fill={BELLY} />),
      )}
      {/* body */}
      <path d={`M-96 -40 Q-104 -150 -70 ${-226 + breathe} Q-40 ${-262 + breathe} 0 ${-262 + breathe} Q44 ${-262 + breathe} 70 ${-226 + breathe} Q104 -150 96 -40 Q92 24 0 26 Q-92 24 -96 -40 Z`} fill={G} />
      <path d={`M-96 -40 Q-104 -150 -70 ${-226 + breathe} Q-56 -150 -60 -40 Q-62 6 -40 22 Q-92 16 -96 -40 Z`} fill={G_D} />
      <path d={`M40 ${-256 + breathe} Q64 ${-240 + breathe} 78 -200 Q100 -130 96 -40 Q94 0 70 14 Q86 -80 70 -180 Z`} fill={rim} opacity={0.3} />
      <ellipse cx={4} cy={-96} rx={60} ry={98} fill={BELLY} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${-48 + Math.abs(i - 2) * 7} ${-160 + i * 34} Q4 ${-148 + i * 34} ${56 - Math.abs(i - 2) * 7} ${-160 + i * 34}`} stroke="#c3de84" strokeWidth={5} fill="none" strokeLinecap="round" />
      ))}
      {/* head */}
      <g transform={`translate(8 ${-290 + breathe})`}>
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${-58 + i * 20} ${-28 - i * 8} l-4 -26 l22 14 Z`} fill={G_DD} />
        ))}
        {/* lower jaw */}
        <g transform={`rotate(${jaw * 16} 10 10)`}>
          <path d="M-10 6 L236 14 Q250 16 246 30 Q240 44 210 44 L20 46 Q-30 44 -40 10 Z" fill={G_D} />
          <path d="M40 16 L226 18 Q236 20 230 26 L40 26 Z" fill="#7a2b4a" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path key={i} d={`M${62 + i * 24} 20 l7 -12 l7 12 Z`} fill="#fff" />
          ))}
        </g>
        {/* skull + upper jaw */}
        <path d="M-56 0 Q-60 -52 -14 -58 Q20 -62 50 -40 L226 -26 Q256 -22 258 -2 Q258 14 236 14 L-10 16 Q-52 18 -56 0 Z" fill={G} />
        <path d="M50 -40 L226 -26 Q256 -22 258 -2 L252 -6 Q246 -16 224 -18 L60 -30 Z" fill={rim} opacity={0.45} />
        <path d="M-56 0 Q-60 -52 -14 -58 Q-30 -30 -26 10 Q-52 14 -56 0 Z" fill={G_D} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={i} d={`M${50 + i * 24} 14 l7 13 l7 -13 Z`} fill="#fff" />
        ))}
        <ellipse cx={238} cy={-12} rx={6} ry={4} fill={G_DD} />
        <ellipse cx={220} cy={-14} rx={6} ry={4} fill={G_DD} />
        {/* eye bump */}
        <circle cx={16} cy={-52} r={30} fill={G} />
        <circle cx={22} cy={-54} r={20} fill="#fff7c2" />
        <ellipse cx={28} cy={-52} rx={6} ry={13} fill="#1b1036" />
        <circle cx={31} cy={-58} r={3} fill="#fff" />
        <path d="M-6 -62 Q20 -84 46 -60 L46 -70 Q20 -92 -8 -72 Z" fill={G_D} />
      </g>
      {/* arms + gamepad */}
      <Limb a={[-78, -196 + breathe]} c={[-112, padY + 4]} b={[-44, padY + 6]} w={38} fill={G_D} />
      <Limb a={[78, -196 + breathe]} c={[112, padY + 4]} b={[44, padY + 6]} w={38} fill={G} />
      {grab > 0.02 ? <Gamepad x={0} y={padY} s={1.05} body="#3b2b78" dark="#120a2e" light={rim} /> : null}
      <circle cx={-48} cy={padY + 10} r={19} fill={G_D} />
      <circle cx={48} cy={padY + 10} r={19} fill={G} />
      {[-1, 1].map((s) =>
        [0, 1].map((i) => <path key={`${s}${i}`} d={`M${s * 48 - 12 + i * 14} ${padY - 6} l5 -12 l5 12 Z`} fill={BELLY} />),
      )}
    </g>
  );
};

// only the eyes and the snout ridge above the water
export const GatorEyes: React.FC<{x: number; y: number; s?: number; t: number; flip?: boolean}> = ({x, y, s = 1, t, flip}) => (
  <g transform={`translate(${x} ${y + Math.sin(t * 3) * 2}) scale(${flip ? -s : s} ${s})`}>
    <path d="M-60 6 Q-56 -16 -30 -18 L96 -8 Q112 -6 110 6 Z" fill={G_D} />
    <circle cx={-26} cy={-18} r={17} fill={G} />
    <circle cx={-22} cy={-20} r={10} fill="#fff7c2" />
    <ellipse cx={-19} cy={-19} rx={3.5} ry={7} fill="#1b1036" />
    <ellipse cx={98} cy={-6} rx={7} ry={5} fill={G} />
    <path d="M-80 8 L130 8" stroke="#fff" strokeWidth={4} opacity={0.7} strokeLinecap="round" />
    <path d="M-110 16 Q-150 22 -190 34 M-110 4 Q-150 2 -200 -4" stroke="#fff" strokeWidth={3} opacity={0.35} fill="none" strokeLinecap="round" />
  </g>
);

// ---------------------------------------------------------------- the room
const OUT_B = skyline(71, 0, 420, 40, 80, 60, 230);
const OUT_WY = 540; // the flood outside stands higher than inside: the window holds it like an aquarium

export type RoomProps = {
  v: number;
  cam: Cam;
  day?: number; // 0 night, 1 flooded daylight
  dawn?: number; // window sky during the time-lapse: 0 night .. 1 morning
  water?: number | null; // y of the water surface
  tv?: TvMode;
  press?: number;
  wipe?: number;
  cans?: number;
  hours?: number; // wall clock
  fanUp?: number;
  tired?: number;
  gator?: number | null; // 0 under water .. 1 seated
  grab?: number;
  eyes?: number | null; // x of the gator's eyes in the window (flooded street outside)
};

export const Room: React.FC<RoomProps> = ({v, cam, day = 0, dawn = 0, water = null, tv = 'menu', press = 0, wipe = 0, cans = 0, hours = 0, fanUp = 0, tired = 0, gator = null, grab = 0, eyes = null}) => {
  const wall0 = mix('#2a1463', '#7f63c9', day);
  const wall1 = mix('#150a3a', '#5b46a8', day);
  const floor0 = mix('#1a0c42', '#4b3a94', day);
  const floor1 = mix('#0a0424', '#2c2068', day);
  const sofa = mix('#5a2a9c', '#8a56d6', day);
  const sofaD = mix('#3b1a72', '#6338ad', day);
  const sofaL = mix('#7b45c9', '#b08af0', day);
  const tvCol = tv === 'menu' ? C.pink : '#7fe9ff';
  const tvGlow = (0.7 + 0.12 * Math.sin(v * 7.3) + 0.08 * Math.sin(v * 13.1)) * (1 - day * 0.45);
  const rim = tv === 'menu' ? C.pink : C.cyan;
  const skyTop = day > 0.5 ? '#3aa7ff' : mix(mix('#080326', '#3b1c7a', clamp01(dawn * 2)), '#6fb7ff', clamp01(dawn * 2 - 1));
  const skyBot = day > 0.5 ? '#c9f1ff' : mix(mix('#3d1576', '#ff7a8a', clamp01(dawn * 2)), '#ffe3b0', clamp01(dawn * 2 - 1));
  const outFill = day > 0.5 ? '#6d83c9' : mix('#1c0d49', '#7a4a9c', dawn);
  const wy = water ?? 0;
  const tvT = 'translate(732 792) skewY(-4)';
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <defs>
        <LinGrad id="rm-wall" stops={[[0, wall1], [0.55, wall0], [1, wall1]]} />
        <LinGrad id="rm-floor" stops={[[0, floor0], [1, floor1]]} />
        <LinGrad id="rm-out" stops={[[0, skyTop], [1, skyBot]]} />
        <LinGrad id="rm-water" stops={[[0, '#2fe0d0', 0.5], [0.5, '#1c9fc4', 0.62], [1, '#1a4fa8', 0.78]]} />
        <LinGrad id="rm-sun" stops={[[0, '#fff3c4', 0.5], [1, '#fff3c4', 0]]} />
        <clipPath id="rm-win">
          <rect x={110} y={300} width={360} height={400} rx={10} />
        </clipPath>
        <filter id="rm-bl" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <Par cam={cam} d={0.9}>
        {/* back wall */}
        <rect x={-500} y={-600} width={W + 1000} height={FLOOR + 600} fill="url(#rm-wall)" />
        {/* LED strip under the ceiling */}
        <rect x={-500} y={150} width={W + 1000} height={8} fill={day > 0.5 ? '#ffd0ea' : C.magenta} />
        <Glow x={540} y={150} r={900} ry={150} c={C.magenta} o={0.5 * (1 - day * 0.7)} />
        {/* window */}
        <g clipPath="url(#rm-win)">
          <rect x={110} y={300} width={360} height={400} fill="url(#rm-out)" />
          {day < 0.5 ? (
            <>
              {dawn < 0.6 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => <circle key={i} cx={120 + rnd(i * 3.3) * 340} cy={305 + rnd(i * 7.7) * 190} r={1.6 + rnd(i) * 1.6} fill="#fff" opacity={(0.8 - dawn * 1.3) * (0.5 + 0.5 * rnd(i * 5))} />) : null}
              <circle cx={lerp(390, 250, dawn)} cy={lerp(372, 700, dawn)} r={36} fill="#fff1c9" opacity={1 - dawn} />
              <circle cx={300} cy={lerp(760, 560, dawn)} r={70} fill="#ffe08a" opacity={clamp01(dawn * 1.5)} />
              <g transform="translate(90 0)">
                <Skyline b={OUT_B} baseY={700} fill={outFill} win={[C.cyan, C.amber, C.pink]} lit={0.5 * (1 - dawn) + 0.05} cell={17} />
              </g>
            </>
          ) : (
            <>
              <circle cx={390} cy={360} r={40} fill="#fff7b8" />
              <circle cx={390} cy={360} r={66} fill="#fff7b8" opacity={0.3} />
              <g transform="translate(90 0)">
                <Skyline b={OUT_B} baseY={720} fill={outFill} win={['#9fb3ea']} lit={0.3} cell={17} />
              </g>
              <path d={`${wavePath(OUT_WY, v, 5, 120, 100, 480)} L480 720 L100 720 Z`} fill="#19b9c9" opacity={0.78} />
              <path d={wavePath(OUT_WY, v, 5, 120, 100, 480)} stroke="#fff" strokeWidth={4} fill="none" opacity={0.85} />
              {[0, 1, 2].map((i) => {
                const fx = 100 + ((v * (26 + i * 9) + i * 150) % 420);
                const fy = OUT_WY + 50 + i * 28 + Math.sin(v * 2 + i) * 6;
                return (
                  <g key={i} transform={`translate(${i % 2 ? 580 - fx : fx} ${fy}) scale(${i % 2 ? -1 : 1} 1)`}>
                    <path d="M-14 0 Q0 -10 14 0 Q0 10 -14 0 Z M-14 0 L-24 -8 L-24 8 Z" fill={i === 1 ? '#ffb347' : '#ff7aa8'} />
                  </g>
                );
              })}
              {eyes !== null ? <GatorEyes x={eyes} y={OUT_WY} s={0.62} t={v} flip /> : null}
            </>
          )}
        </g>
        <rect x={110} y={300} width={360} height={400} rx={10} fill="none" stroke={mix('#4a2a96', '#efe6ff', day)} strokeWidth={14} />
        <rect x={284} y={300} width={12} height={400} fill={mix('#4a2a96', '#efe6ff', day)} />
        <rect x={96} y={694} width={388} height={18} rx={6} fill={mix('#5a34ac', '#ffffff', day)} />
        {/* curtains */}
        <path d="M84 280 L150 280 Q168 480 132 700 L84 716 Z" fill={mix('#7a1f73', '#d86aa8', day)} />
        <path d="M496 280 L430 280 Q412 480 448 700 L496 716 Z" fill={mix('#7a1f73', '#d86aa8', day)} />
        <rect x={70} y={268} width={440} height={14} rx={7} fill={mix('#3b1a72', '#c9b6f2', day)} />
        {day > 0.5 ? <path d="M110 300 L470 300 L760 1340 L240 1340 Z" fill="url(#rm-sun)" opacity={0.45} style={{mixBlendMode: 'screen'}} /> : null}
        {/* poster */}
        <g transform="translate(606 452) rotate(-3)">
          <rect x={-86} y={-112} width={172} height={224} rx={6} fill="#fff" opacity={0.92} />
          <GameBox x={0} y={0} s={0.52} id="rm-post" side={false} />
        </g>
        {/* clock */}
        <g transform="translate(900 400)">
          <circle r={62} fill={mix('#1a0c42', '#fff', day * 0.9)} stroke={mix('#8a56d6', '#5b46a8', day)} strokeWidth={8} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={-3} y={-52} width={6} height={12} fill={mix('#8a56d6', '#5b46a8', day)} transform={`rotate(${i * 90})`} />
          ))}
          <rect x={-4} y={-34} width={8} height={38} rx={4} fill={mix('#fff', '#2b1a55', day)} transform={`rotate(${hours * 30})`} />
          <rect x={-3} y={-48} width={6} height={52} rx={3} fill={C.magenta} transform={`rotate(${hours * 360})`} />
          <circle r={6} fill={mix('#fff', '#2b1a55', day)} />
        </g>
        {/* shelf */}
        <rect x={770} y={640} width={250} height={14} rx={5} fill={mix('#4a2a96', '#efe6ff', day)} />
        <path d="M800 640 q-4 -44 16 -48 q20 4 16 48 Z" fill="#2fbf7a" />
        <rect x={796} y={618} width={40} height={22} rx={5} fill={C.orange} />
        <rect x={880} y={590} width={18} height={50} fill={C.cyan} />
        <rect x={900} y={578} width={18} height={62} fill={C.pink} />
        <rect x={920} y={596} width={22} height={44} fill={C.amber} />
        <path d="M962 640 l8 -36 l26 0 l8 36 Z" fill="#ffe14d" />
      </Par>
      <Par cam={cam} d={1}>
        {/* floor */}
        <rect x={-500} y={FLOOR} width={W + 1000} height={1400} fill="url(#rm-floor)" />
        <rect x={-500} y={FLOOR} width={W + 1000} height={5} fill={mix('#6a3ac0', '#c9b6f2', day)} opacity={0.7} />
        <ellipse cx={500} cy={FLOOR + 120} rx={560} ry={90} fill={mix('#3b1a72', '#8f6fe0', day)} opacity={0.7} />
        {/* TV light on the room */}
        <Glow x={880} y={900} r={760} c={tvCol} o={0.5 * tvGlow} />
        {/* sofa */}
        <rect x={34} y={952} width={634} height={300} rx={56} fill={sofaD} />
        <rect x={64} y={968} width={280} height={180} rx={40} fill={sofa} />
        <rect x={352} y={968} width={280} height={180} rx={40} fill={sofa} />
        <path d="M352 968 L592 968 Q632 968 632 1008 L632 1100 Q600 1010 352 990 Z" fill={sofaL} opacity={0.35} />
        <rect x={16} y={1040} width={92} height={280} rx={40} fill={sofa} />
        <rect x={596} y={1040} width={92} height={280} rx={40} fill={sofaL} />
        <rect x={86} y={1128} width={532} height={120} rx={36} fill={sofa} />
        <rect x={86} y={1128} width={532} height={26} rx={13} fill={sofaL} opacity={0.5} />
        <rect x={60} y={1236} width={584} height={86} rx={22} fill={sofaD} />
        <rect x={74} y={1316} width={30} height={26} rx={6} fill="#1a0c42" />
        <rect x={600} y={1316} width={30} height={26} rx={6} fill="#1a0c42" />
        {/* TV cabinet + console */}
        <rect x={716} y={1160} width={364} height={170} rx={14} fill={mix('#241056', '#5b46a8', day)} />
        <rect x={734} y={1182} width={150} height={126} rx={8} fill={mix('#1a0c42', '#49379a', day)} />
        <rect x={900} y={1182} width={160} height={126} rx={8} fill={mix('#1a0c42', '#49379a', day)} />
        <circle cx={872} cy={1244} r={5} fill={C.cyan} />
        <rect x={716} y={1326} width={364} height={16} rx={6} fill="#120a2e" />
        <Console x={1010} y={1160} s={0.78} />
        {/* TV */}
        <rect x={868} y={1060} width={40} height={90} fill="#120a2e" />
        <rect x={800} y={1142} width={176} height={18} rx={8} fill="#120a2e" />
        <g transform={tvT}>
          <rect x={-14} y={-14} width={338} height={228} rx={14} fill="#0b0420" />
          <rect x={-14} y={-14} width={338} height={228} rx={14} fill="none" stroke={tvCol} strokeWidth={3} opacity={0.6} />
          <TvPicture mode={tv} v={v} press={press} wipe={wipe} id="rm-tv" />
        </g>
        <Glow x={890} y={900} r={300} c={tvCol} o={0.35 * tvGlow} />
        {/* cans on the floor and the arm rest */}
        {Array.from({length: Math.min(9, cans)}, (_, i) => {
          const spots: [number, number, number][] = [[690, FLOOR, 0], [36, FLOOR, 0], [656, 1040, 0], [-10, FLOOR + 6, 78], [734, FLOOR + 4, -84], [62, 1040, 0], [-52, FLOOR, 0], [770, FLOOR, 0], [130, FLOOR + 30, 90]];
          const [cx, cy, r] = spots[i];
          return <Can key={i} x={cx} y={cy} rot={r} c={i % 2 ? C.magenta : C.teal} c2={i % 2 ? '#b01a66' : '#0b8f86'} s={1.15} />;
        })}
        {/* the gator rises behind the water */}
        {gator !== null ? <Gator x={GATOR_X} y={SEAT + (1 - gator) * 420} grab={grab} t={v} rim={rim} jaw={0.1 + 0.1 * Math.sin(v * 2)} /> : null}
        <Fan x={FAN_X} y={SEAT} up={fanUp} press={press} tired={tired} rim={rim} t={v} wet={water !== null} />
        {/* water */}
        {water !== null ? (
          <g>
            <path d={`${wavePath(wy, v, 7, 170)} L${W + 400} 3200 L-400 3200 Z`} fill="url(#rm-water)" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <path key={i} d={wavePath(wy + 70 + i * 62, v * (0.7 + i * 0.07), 9, 120 + i * 25, -400, W + 400, i * 1.9)} stroke="#bffcff" strokeWidth={3} fill="none" opacity={0.16} strokeDasharray={`${70 + i * 20} ${160 + i * 30}`} strokeDashoffset={v * (30 + i * 9) * (i % 2 ? 1 : -1)} />
            ))}
            <path d={wavePath(wy, v, 7, 170)} stroke="#fff" strokeWidth={6} fill="none" opacity={0.85} strokeLinecap="round" />
            <path d={wavePath(wy + 3, v, 7, 170)} stroke="#7ff5ff" strokeWidth={14} fill="none" opacity={0.25} strokeLinecap="round" />
            {/* floating things */}
            {[
              [700, 0, 16, C.magenta],
              [96, 1.3, -22, C.teal],
              [612, 2.2, 80, C.teal],
              [880, 3.4, -70, C.magenta],
              [330, 4.1, 12, C.amber],
            ].map(([fx, ph, r, col], i) => (
              <g key={i} transform={`translate(${(fx as number) + Math.sin(v * 0.6 + (ph as number)) * 14} ${wy + 8 + Math.sin(v * 1.7 + (ph as number)) * 5})`}>
                <Can x={0} y={18} rot={(r as number) + Math.sin(v * 1.2 + i) * 8} c={col as string} c2={col === C.teal ? '#0b8f86' : col === C.magenta ? '#b01a66' : '#c98a1a'} s={1.15} />
              </g>
            ))}
            {/* caustics on the wall */}
            {[0, 1, 2].map((i) => (
              <path key={i} d={wavePath(wy - 60 - i * 54, v * 1.2, 12, 90 + i * 30, 480, W + 200, i * 2.3)} stroke="#bffcff" strokeWidth={5} fill="none" opacity={0.2 - i * 0.05} strokeLinecap="round" strokeDasharray="120 90" strokeDashoffset={v * 50} />
            ))}
          </g>
        ) : null}
      </Par>
      {/* foreground: a plant leaf and a lamp glow, far out of focus */}
      <Par cam={cam} d={1.5}>
        <g filter="url(#rm-bl)" opacity={0.9}>
          <path d="M-140 1900 Q-60 1500 120 1420 Q40 1640 60 1900 Z" fill={mix('#0d0530', '#2c2068', day)} />
          <path d="M-200 1900 Q-180 1560 -20 1380 Q-80 1640 -40 1900 Z" fill={mix('#120838', '#3a2c86', day)} />
          <path d="M1240 1900 Q1150 1620 1000 1560 Q1080 1740 1060 1900 Z" fill={mix('#0d0530', '#2c2068', day)} />
        </g>
      </Par>
    </svg>
  );
};

export {FAN_X, GATOR_X, TW, TH};
