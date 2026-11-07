import '@fontsource/rye/400.css';
import '@fontsource/rubik/800.css';
import '@fontsource/rubik/900.css';
import React from 'react';
import {AbsoluteFill, Img, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {CUE, FPS} from './woody/cues';

// Woody VPN ad banner: 1920×960 on a pure green screen (key it out like the Soko / NATRIA banners).
// Everything that is not the banner is #00FF00. Soft glows stay inside the panel so the key stays clean.

const fontHandle = delayRender('Loading banner fonts');
Promise.all([
  document.fonts.load("400 140px 'Rye'"),
  document.fonts.load("800 64px 'Rubik'"),
  document.fonts.load("900 300px 'Rubik'"),
  document.fonts.load("90px 'Noto Color Emoji'", '🌯👆'),
])
  .then(() => continueRender(fontHandle))
  .catch(() => continueRender(fontHandle));

const GREEN = '#00FF00';
const INK = '#3b1f0f';
const CREAM = '#fff3d6';

const P = {x: 60, y: 170, w: 1800, h: 740};

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
// overshooting ease, 0 -> 1 with a springy bump
const back = (x: number, s = 2.2) => {
  const k = clamp(x) - 1;
  return 1 + (s + 1) * k * k * k + s * k * k;
};
// damped wobble after an event, starts at 1 and dies out
const wob = (dt: number, freq = 9, decay = 7) => (dt < 0 ? 0 : Math.sin(dt * freq * 2 * Math.PI) * Math.exp(-dt * decay));
const bump = (dt: number, len: number) => (dt < 0 || dt > len ? 0 : Math.sin((dt / len) * Math.PI));

const outlined = (stroke: number, shadow: number): React.CSSProperties => ({
  WebkitTextStroke: `${stroke}px ${INK}`,
  paintOrder: 'stroke fill',
  textShadow: `${shadow}px ${shadow}px 0 ${INK}`,
});

const shakeAt = (t: number, at: number, amp: number) => {
  const dt = t - at;
  if (dt < 0 || dt > 0.35) return [0, 0];
  const e = Math.exp(-dt * 12) * amp;
  return [Math.sin(dt * 97) * e, Math.cos(dt * 83) * e];
};

const Backdrop: React.FC<{t: number}> = ({t}) => {
  const clouds = [
    {x: 150, y: 90, w: 260, s: 14},
    {x: 820, y: 60, w: 200, s: 10},
    {x: 1350, y: 130, w: 300, s: 18},
  ];
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #f7b38c 0%, #f19c76 45%, #ea8a63 72%, #e48058 100%)',
        }}
      />
      {/* sun */}
      <div
        style={{
          position: 'absolute',
          left: 1440 - 260,
          top: 470 - 260,
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,236,190,0.95) 0%, rgba(255,222,170,0.6) 30%, rgba(255,200,150,0) 70%)',
        }}
      />
      {clouds.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: c.x + t * c.s,
            top: c.y,
            width: c.w,
            height: c.w * 0.32,
            borderRadius: 999,
            background: 'rgba(255,240,225,0.75)',
            filter: 'blur(6px)',
          }}
        />
      ))}
      {/* far mesas, then near dunes: they drift at different speeds for a little depth */}
      <svg width={P.w} height={P.h} style={{position: 'absolute', left: -t * 6, top: 0}}>
        <path
          d="M0 560 L120 560 L150 520 L260 520 L285 560 L520 560 L560 500 L700 500 L730 560 L1150 560 L1180 530 L1260 530 L1290 560 L1560 560 L1600 505 L1720 505 L1750 560 L1900 560 L1900 740 L0 740 Z"
          fill="#cf7652"
        />
      </svg>
      <svg width={P.w} height={P.h} style={{position: 'absolute', left: 0, top: 0}}>
        <path d="M0 640 Q 450 585 900 615 T 1800 600 L1800 740 L0 740 Z" fill="#d9865c" />
        <path d="M0 690 Q 600 650 1200 675 T 1800 665 L1800 740 L0 740 Z" fill="#c9744d" />
      </svg>
    </>
  );
};

export const WoodyBanner: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  // whole-banner shake on the two big hits
  const s1 = shakeAt(t, CUE.n99 + 0.12, 9);
  const s2 = shakeAt(t, CUE.cheaper + 0.14, 7);
  const sx = s1[0] + s2[0];
  const sy = s1[1] + s2[1];

  // panel pops in
  const pIn = back(t / 0.4, 1.6);
  const pScale = 0.55 + 0.45 * pIn;
  const pOpacity = clamp(t / 0.12);

  // cowboy: slides in, then breathes; hops on the 99, leans towards the button at the end
  const cIn = back((t - 0.05) / 0.5, 1.4);
  const cX = -760 * (1 - cIn);
  const hop = 34 * bump(t - CUE.n99 - 0.1, 0.32);
  const cY = Math.sin(t * 2 * Math.PI * 0.8) * 5 - hop;
  const lean = 3 * easeOut((t - CUE.link) / 0.4);
  const cRot = -10 * (1 - clamp(cIn)) + Math.sin(t * 2 * Math.PI * 0.45) * 1.1 + lean;
  const squash = 1 + 0.04 * wob(t - CUE.n99 - 0.42, 3, 6);
  const COW = {w: 541, h: 899, left: 140, bottom: 905};
  const cowTop = COW.bottom - COW.h;

  // shield glow (behind the cowboy, clipped to the panel)
  const flash = Math.exp(-Math.max(0, t - CUE.vpn) * 3.5) * (t >= CUE.vpn ? 1 : 0);
  const glowA = clamp(t / 0.6) * (0.35 + 0.12 * Math.sin(t * 2 * Math.PI * 1.3) + 0.55 * flash);
  // puppet parts (coordinates in the cut-out picture, 676×1124, drawn at 0.8)
  const K = 0.8;
  const HEAD_PIV = [285, 430];
  const ARM_PIV = [462, 555];
  // head: idle sway, a nod on every stressed word, tilt towards the text at the end
  const nods = [CUE.woody, CUE.n99, CUE.month, CUE.shawa, CUE.link];
  const nod = nods.reduce((acc, c) => acc + bump(t - c, 0.28), 0);
  const headRot = Math.sin(t * 2 * Math.PI * 0.55 + 1) * 1.4 + 2.6 * nod + 4 * easeOut((t - CUE.link - 0.1) / 0.35);
  const headY = 5 * nod;
  // arm with the shield: raises the shield on «ВПН», shakes it on «99», small sway otherwise
  const armRaise = 8 * back((t - CUE.vpn + 0.05) / 0.35, 2) * (1 - easeOut((t - CUE.vpn - 0.7) / 0.5));
  const armShake = 5 * wob(t - CUE.n99 - 0.1, 5, 4.5) + 4 * wob(t - CUE.cheaper - 0.1, 4, 5);
  const armRot = Math.sin(t * 2 * Math.PI * 0.5) * 1.5 + armRaise + armShake;
  // blinks (k = how closed, 0..1) and a wink with the eye next to the text at the end
  const blinkAt = (c: number, len = 0.16) => bump(t - c, len);
  const blink = Math.max(blinkAt(1.2), blinkAt(3.0), blinkAt(4.9));
  const wink = clamp(Math.max(blink, (t - CUE.link - 0.35) / 0.08) * (t < CUE.link + 0.35 ? 0 : 1)) * (1 - clamp((t - CUE.link - 0.85) / 0.1));
  const winkR = Math.max(blink, wink);
  const ra = (armRot * Math.PI) / 180;
  const sc = [535 - ARM_PIV[0], 250 - ARM_PIV[1]];
  const shieldPx = ARM_PIV[0] + sc[0] * Math.cos(ra) - sc[1] * Math.sin(ra);
  const shieldPy = ARM_PIV[1] + sc[0] * Math.sin(ra) + sc[1] * Math.cos(ra);
  const shieldX = COW.left + cX + shieldPx * K - P.x;
  const shieldY = cowTop + cY + shieldPy * K - P.y;

  // logo letters
  const logo = 'WOODY VPN'.split('');
  const letterT = (i: number) => (i < 5 ? CUE.woody + i * 0.05 : CUE.vpn + (i - 6) * 0.06);

  // price
  const vsegoK = back((t - CUE.vsego) / 0.3);
  const n99 = clamp((t - CUE.n99) / 0.16);
  const n99Scale = t < CUE.n99 ? 0 : n99 < 1 ? 2.6 - 1.6 * (n99 * n99) : 1 + 0.06 * wob(t - CUE.n99 - 0.16, 4, 6);
  const rubK = back((t - CUE.rub) / 0.35, 2.6);
  const monK = clamp((t - CUE.month) / 0.12);
  const monScale = t < CUE.month ? 0 : monK < 1 ? 1.9 - 0.9 * monK : 1 + 0.05 * wob(t - CUE.month - 0.12, 5, 7);

  // stamp
  const stK = clamp((t - CUE.cheaper) / 0.14);
  const stScale = t < CUE.cheaper ? 0 : stK < 1 ? 3 - 2 * stK * stK : 1 + 0.05 * wob(t - CUE.cheaper - 0.14, 4, 6);
  const emojiK = back((t - CUE.shawa) / 0.35, 3);
  const stampSpin = Math.sin(t * 2 * Math.PI * 0.6) * 2;

  // button
  const btnK = back((t - CUE.link) / 0.4, 1.8);
  const btnPulse = t > CUE.link + 0.5 ? 1 + 0.035 * Math.sin((t - CUE.link - 0.5) * 2 * Math.PI * 1.6) : 1;
  const handY = Math.abs(Math.sin((t - CUE.link) * 2 * Math.PI * 1.2)) * -14;

  // dust puffs where the 99 lands
  const dust = t > CUE.n99 + 0.12 && t < CUE.n99 + 0.9 ? (t - CUE.n99 - 0.12) / 0.78 : -1;

  // sparkles around the shield on «ВПН»
  const sp = t > CUE.vpn && t < CUE.vpn + 0.7 ? (t - CUE.vpn) / 0.7 : -1;

  return (
    <AbsoluteFill style={{backgroundColor: GREEN, overflow: 'hidden'}}>
      {withAudio ? <Audio src={staticFile('audio/woody-banner.wav')} /> : null}
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
        {/* panel with a hard drop shadow (no soft shadows over the green) */}
        <div
          style={{
            position: 'absolute',
            left: P.x,
            top: P.y,
            width: P.w,
            height: P.h,
            transform: `scale(${pScale})`,
            opacity: pOpacity,
          }}
        >
          <div style={{position: 'absolute', left: 16, top: 16, width: P.w, height: P.h, borderRadius: 52, background: INK}} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 52,
              overflow: 'hidden',
              border: `10px solid ${INK}`,
              boxSizing: 'border-box',
            }}
          >
            <Backdrop t={t} />
            <div
              style={{
                position: 'absolute',
                left: shieldX - 300,
                top: shieldY - 300,
                width: 600,
                height: 600,
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(140,230,255,${glowA}) 0%, rgba(110,210,255,${glowA * 0.45}) 35%, rgba(110,210,255,0) 70%)`,
              }}
            />
            <div style={{position: 'absolute', inset: 6, borderRadius: 44, border: `5px solid ${CREAM}`, opacity: 0.7}} />
          </div>
        </div>

        {/* logo */}
        <div style={{position: 'absolute', left: 700, top: 188, display: 'flex', whiteSpace: 'pre'}}>
          {logo.map((ch, i) => {
            const k = back((t - letterT(i)) / 0.3, 2.4);
            const vis = t >= letterT(i);
            return (
              <span
                key={i}
                style={{
                  fontFamily: 'Rye',
                  fontSize: 142,
                  lineHeight: 1,
                  color: i >= 6 ? '#8fe8ff' : CREAM,
                  display: 'inline-block',
                  opacity: vis ? 1 : 0,
                  transform: `translateY(${-140 * (1 - k)}px) rotate(${(1 - k) * (i % 2 ? 14 : -14)}deg)`,
                  ...outlined(12, 9),
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>

        {/* «ВСЕГО» */}
        <div
          style={{
            position: 'absolute',
            left: 740,
            top: 345,
            fontFamily: 'Rubik',
            fontWeight: 800,
            fontSize: 66,
            color: CREAM,
            transformOrigin: 'left center',
            transform: `scale(${t < CUE.vsego ? 0 : vsegoK}) rotate(-4deg)`,
            ...outlined(9, 6),
          }}
        >
          ВСЕГО
        </div>

        {/* 99 */}
        <div
          style={{
            position: 'absolute',
            left: 705,
            top: 418,
            width: 470,
            height: 320,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${n99Scale})`,
            opacity: t < CUE.n99 ? 0 : clamp(n99 * 3),
          }}
        >
          <span
            style={{
              fontFamily: 'Rubik',
              fontWeight: 900,
              fontSize: 370,
              lineHeight: 1,
              color: '#ffcf33',
              ...outlined(16, 12),
            }}
          >
            99
          </span>
        </div>
        {dust >= 0
          ? [-1, -0.5, 0.5, 1].map((d, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 940 + d * (140 + 160 * easeOut(dust)) - 40,
                  top: 690 - 30 * easeOut(dust) - 40 * Math.abs(d) * easeOut(dust),
                  width: 80 + 60 * dust,
                  height: 80 + 60 * dust,
                  borderRadius: '50%',
                  background: '#fbe6c8',
                  border: `4px solid rgba(59,31,15,0.55)`,
                  opacity: 1 - dust,
                  transform: `scale(${1 - 0.6 * dust})`,
                }}
              />
            ))
          : null}

        {/* ₽ */}
        <div
          style={{
            position: 'absolute',
            left: 1170,
            top: 452,
            fontFamily: 'Rubik',
            fontWeight: 900,
            fontSize: 262,
            lineHeight: 1,
            color: '#ffcf33',
            transformOrigin: 'center bottom',
            transform: `scale(${t < CUE.rub ? 0 : rubK}) rotate(${(1 - clamp(rubK)) * 30}deg)`,
            ...outlined(14, 11),
          }}
        >
          ₽
        </div>

        {/* «В МЕСЯЦ» tag */}
        <div
          style={{
            position: 'absolute',
            left: 1145,
            top: 668,
            padding: '8px 26px 12px',
            background: '#e0313a',
            border: `7px solid ${INK}`,
            borderRadius: 18,
            boxShadow: `8px 8px 0 ${INK}`,
            fontFamily: 'Rubik',
            fontWeight: 900,
            fontSize: 58,
            lineHeight: 1,
            color: '#ffffff',
            transform: `rotate(-7deg) scale(${monScale})`,
            opacity: t < CUE.month ? 0 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          В МЕСЯЦ
        </div>

        {/* «ДЕШЕВЛЕ ШАУРМЫ!» stamp */}
        <div
          style={{
            position: 'absolute',
            left: 1500,
            top: 330,
            width: 330,
            height: 330,
            borderRadius: '50%',
            background: '#e0313a',
            border: `9px solid ${INK}`,
            boxShadow: `10px 10px 0 ${INK}`,
            transform: `rotate(${-12 + stampSpin}deg) scale(${stScale})`,
            opacity: t < CUE.cheaper ? 0 : 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{position: 'absolute', inset: 14, borderRadius: '50%', border: '5px dashed rgba(255,255,255,0.85)'}} />
          <div
            style={{
              fontFamily: 'Noto Color Emoji',
              fontSize: 92,
              lineHeight: 1,
              marginBottom: 6,
              transform: `scale(${t < CUE.shawa ? 0 : emojiK}) rotate(${(1 - clamp(emojiK)) * -40}deg)`,
            }}
          >
            🌯
          </div>
          <div style={{fontFamily: 'Rubik', fontWeight: 900, fontSize: 44, lineHeight: 1.05, color: '#fff', textAlign: 'center'}}>
            ДЕШЕВЛЕ
            <br />
            ШАУРМЫ!
          </div>
        </div>

        {/* cowboy */}
        <div
          style={{
            position: 'absolute',
            left: COW.left + cX,
            top: cowTop + cY,
            width: COW.w,
            height: COW.h,
            transformOrigin: '50% 100%',
            transform: `rotate(${cRot}deg) scale(${2 - squash}, ${squash})`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: `${HEAD_PIV[0] * K}px ${HEAD_PIV[1] * K}px`,
              transform: `translateY(${headY}px) rotate(${headRot}deg)`,
            }}
          >
            <Img src={staticFile('woody/head.png')} style={{position: 'absolute', width: COW.w, height: COW.h}} />
            <svg width={COW.w} height={COW.h} viewBox="0 0 676 1124" style={{position: 'absolute', left: 0, top: 0}}>
              <defs>
                <clipPath id="eyeL">
                  <ellipse cx={239} cy={228} rx={30} ry={27} />
                </clipPath>
                <clipPath id="eyeR">
                  <ellipse cx={321} cy={225} rx={27} ry={26} />
                </clipPath>
              </defs>
              {[
                {id: 'eyeL', cy: 228, ry: 27, x: 205, w: 70, k: blink, col: '#b4704d'},
                {id: 'eyeR', cy: 225, ry: 26, x: 290, w: 64, k: winkR, col: '#e09c7c'},
              ].map((e) =>
                e.k > 0.01 ? (
                  <g key={e.id} clipPath={`url(#${e.id})`}>
                    <rect x={e.x} y={e.cy - e.ry - 2} width={e.w} height={(2 * e.ry + 4) * e.k} fill={e.col} />
                    <rect x={e.x} y={e.cy - e.ry - 2 + (2 * e.ry + 4) * e.k - 4} width={e.w} height={5} fill="#3a1d12" />
                  </g>
                ) : null,
              )}
            </svg>
          </div>
          <Img src={staticFile('woody/body.png')} style={{position: 'absolute', width: COW.w, height: COW.h}} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: `${ARM_PIV[0] * K}px ${ARM_PIV[1] * K}px`,
              transform: `rotate(${armRot}deg)`,
            }}
          >
            <Img src={staticFile('woody/arm.png')} style={{position: 'absolute', width: COW.w, height: COW.h}} />
          </div>
        </div>

        {/* sparkles */}
        {sp >= 0
          ? [0, 1, 2, 3, 4].map((i) => {
              const a = -1.9 + i * 0.6; // fan out to the right/top, away from the face
              const r = 120 + 140 * easeOut(sp);
              const size = 54 * Math.sin(Math.min(1, sp * 1.4) * Math.PI);
              return (
                <svg
                  key={i}
                  width={size}
                  height={size}
                  viewBox="-10 -10 20 20"
                  style={{
                    position: 'absolute',
                    left: P.x + shieldX + Math.cos(a) * r - size / 2,
                    top: P.y + shieldY + Math.sin(a) * r - size / 2,
                  }}
                >
                  <path d="M0 -10 Q1.5 -1.5 10 0 Q1.5 1.5 0 10 Q-1.5 1.5 -10 0 Q-1.5 -1.5 0 -10Z" fill="#eaffff" stroke="#38b8e0" strokeWidth={1} />
                </svg>
              );
            })
          : null}

        {/* button */}
        <div
          style={{
            position: 'absolute',
            left: 760,
            top: 775,
            height: 112,
            padding: '0 40px 0 46px',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            background: INK,
            border: '7px solid #ffcf33',
            borderRadius: 999,
            boxShadow: `9px 9px 0 #1d0d05`,
            transform: `translateY(${(1 - clamp(btnK)) * 60}px) scale(${(t < CUE.link ? 0 : btnK) * btnPulse})`,
            opacity: t < CUE.link ? 0 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{fontFamily: 'Rubik', fontWeight: 900, fontSize: 62, color: CREAM, lineHeight: 1}}>ССЫЛКА В ПРОФИЛЕ</span>
          <span style={{fontFamily: 'Noto Color Emoji', fontSize: 64, lineHeight: 1, transform: `translateY(${handY}px)`}}>👆</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
