import React from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate} from 'remotion';
import * as THREE from 'three';
import '@fontsource/rubik/700.css';
import '@fontsource/rubik/800.css';
import '@fontsource/russo-one/400.css';
import {BEATS, CHARGE, E, GROUPS, HITS, HURT, KILOS, MELEE_HITS, PHRASES, PLATE1, PLATE2, RUN5, S, SLUMP, STOP, TONS, WORDS, clamp01, hurtAt, powerAt, ramp, shotAt, timerAt} from './cues';
import {V3} from './ink';
import {viewAt} from './World';
import {G0, LAND, C} from './crowd';
import {CH_TO, TOSS_A, TOSS_B} from './scenesA';
import {PC, VSPOT} from './scenesB';

// Comic overlay: ink panels for the fight clock / the hurt counter / the gorilla's strength,
// karaoke captions, starbursts with sound words on every hit, speed lines, halftone corners.

export const COMIC = "'Russo One', 'Rubik', sans-serif";
export const ROUND = "'Rubik', 'Arial', sans-serif";
export const INK = '#1c1024';
export const YELLOW = '#ffd21f';
export const RED = '#ff2d46';
export const CREAM = '#fff6e4';

const handle = delayRender('Loading fonts');
Promise.all([document.fonts.load("400 60px 'Russo One'", 'БАМ'), document.fonts.load("800 60px 'Rubik'", 'БАМ'), document.fonts.load("700 60px 'Rubik'", 'БАМ')])
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));

const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) => interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const pop = (t: number, k = 9) => (t <= 0 ? 0 : 1 - Math.exp(-t * k) * Math.cos(t * k * 1.6));

// world point -> pixel of the 1080x1920 frame
const cam = new THREE.PerspectiveCamera();
export const project = (v: number, p: V3): [number, number, boolean] => {
  const view = viewAt(v);
  cam.fov = view.fov;
  cam.aspect = 1080 / 1920;
  cam.near = 0.1;
  cam.far = 900;
  cam.position.set(...view.pos);
  cam.up.set(0, 1, 0);
  cam.lookAt(...view.target);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  const q = new THREE.Vector3(...p).project(cam);
  return [(q.x * 0.5 + 0.5) * 1080, (-q.y * 0.5 + 0.5) * 1920, q.z < 1];
};

// ---------------------------------------------------------------- ink panel
export const Panel: React.FC<{children: React.ReactNode; bg?: string; color?: string; skew?: number; rot?: number; pad?: string; size?: number; style?: React.CSSProperties}> = ({children, bg = CREAM, color = INK, skew = -7, rot = 0, pad = '8px 26px 10px', size = 44, style}) => (
  <div
    style={{
      display: 'inline-block',
      background: bg,
      color,
      border: `6px solid ${INK}`,
      borderRadius: 10,
      boxShadow: `9px 10px 0 ${INK}`,
      padding: pad,
      fontFamily: COMIC,
      fontSize: size,
      lineHeight: 1.05,
      transform: `rotate(${rot}deg) skewX(${skew}deg)`,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------- HUD
const HUD_FROM = S.hesitate;
const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const Hud: React.FC<{v: number}> = ({v}) => {
  if (v < HUD_FROM || v >= S.result) return null;
  const inn = pop(v - HUD_FROM, 8);
  const n = hurtAt(v);
  const last = HURT.filter((x) => v >= x).pop();
  const bump = last === undefined ? 0 : Math.exp(-(v - last) * 9);
  const power = clamp01(powerAt(v));
  const running = v >= CHARGE;
  const barCol = power > 0.55 ? '#62d143' : power > 0.25 ? '#ffb21f' : RED;
  const low = power < 0.25 ? 0.5 + 0.5 * Math.sin(v * 12) : 0;
  const out = 0;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 150, transform: `translateY(${(1 - inn) * -260 - out * 420}px)`}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <Panel bg={INK} color={CREAM} size={64} pad="6px 28px 8px" rot={-2}>
          <span style={{fontSize: 34, color: running ? YELLOW : '#b9a8c9', marginRight: 16, verticalAlign: 'middle'}}>БОЙ</span>
          <span style={{verticalAlign: 'middle'}}>{clock(timerAt(v))}</span>
        </Panel>
        <Panel bg={n > 0 ? RED : CREAM} color={n > 0 ? '#fff' : INK} size={34} pad="8px 22px 10px" rot={2} style={{transform: `rotate(2deg) skewX(-7deg) scale(${1 + 0.22 * bump})`, transformOrigin: '80% 50%'}}>
          <span style={{verticalAlign: 'middle'}}>ПОСТРАДАВШИХ</span>
          <span style={{fontSize: 66, marginLeft: 18, verticalAlign: 'middle'}}>{n}</span>
        </Panel>
      </div>
      <div style={{marginTop: 30, position: 'relative'}}>
        <div style={{fontFamily: COMIC, fontSize: 36, color: CREAM, WebkitTextStroke: `9px ${INK}`, paintOrder: 'stroke fill', letterSpacing: 1}}>СИЛЫ ГОРИЛЛЫ</div>
        <div style={{marginTop: 6, height: 46, border: `6px solid ${INK}`, borderRadius: 10, background: '#3a2748', boxShadow: `8px 9px 0 ${INK}`, transform: 'skewX(-12deg)', overflow: 'hidden', position: 'relative'}}>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${power * 100}%`, background: barCol, boxShadow: `inset 0 -12px 0 rgba(0,0,0,0.18), inset 0 8px 0 rgba(255,255,255,0.3)`, opacity: 1 - 0.45 * low}} />
          <div style={{position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(90deg, transparent 0 82px, ${INK} 82px 88px)`}} />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- captions
const Captions: React.FC<{v: number}> = ({v}) => {
  const gi = GROUPS.findIndex((g) => {
    const a = PHRASES[g[0]][0];
    const b = PHRASES[g[g.length - 1]][1];
    return v >= a - 0.1 && v < b + 0.3;
  });
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const a = PHRASES[g[0]][0];
  const b = PHRASES[g[g.length - 1]][1];
  const ws = WORDS.filter((w) => g.includes(w[3]));
  const o = fade(v, a - 0.1, b + 0.3, 0.08, 0.12);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 1290, textAlign: 'center', opacity: o, transform: `rotate(-1.5deg) scale(${0.94 + 0.06 * pop(v - a + 0.1, 10)})`}}>
      <div style={{fontFamily: ROUND, fontWeight: 800, fontSize: 66, lineHeight: 1.18, color: '#fff', WebkitTextStroke: `14px ${INK}`, paintOrder: 'stroke fill', textShadow: `7px 8px 0 ${INK}`}}>
        {ws.map((w, i) => {
          const on = v >= w[0] - 0.03;
          const now = on && v < w[1] + 0.05;
          return (
            <span key={i} style={{color: now ? YELLOW : on ? '#fff' : 'rgba(255,255,255,0.55)', display: 'inline-block', margin: '0 12px', transform: now ? 'translateY(-5px) scale(1.07)' : undefined}}>
              {w[2]}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- hits: starbursts with sound words
type Impact = {t: number; p: V3; word?: string; size: number; hue?: string; at?: [number, number]};
const WORDS_M = ['БАМ!', '', 'ХЛОП!', '', 'БУМ!', '', 'ХРЯСЬ!', ''];
export const IMPACTS: Impact[] = [
  ...BEATS.filter((_, j) => j % 2 === 0).map((t, j): Impact => ({t, p: [G0[0] + (j % 2 ? 0.75 : -0.75), 1.75, G0[2] + 0.5], word: 'БУМ', size: 0.55, hue: CREAM})),
  {t: STOP, p: [CH_TO[0], 2.5, CH_TO[2]], word: 'Р-Р-РА!', size: 0.95, hue: RED, at: [770, 1040]},
  {t: HITS[0], p: TOSS_A.from, word: 'ВЖУХ!', size: 1.0},
  {t: HITS[1], p: TOSS_B.from, word: 'БАМ!', size: 1.1},
  {t: HITS[2], p: [LAND[C].p[0], 0.5, LAND[C].p[2]], word: 'БУХ!', size: 1.15, hue: RED},
  ...MELEE_HITS.map((t, j): Impact => ({t, p: [VSPOT[j][0], 1.25, VSPOT[j][1]], word: WORDS_M[j], size: WORDS_M[j] ? 0.8 : 0.5, hue: j % 4 === 2 ? RED : YELLOW})),
  {t: SLUMP, p: [PC[0], 0.5, PC[2]], word: 'БУХ!', size: 1.3, hue: RED},
];
const star = (n: number, r0: number, r1: number, seed: number) => {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const r = (i % 2 ? r0 : r1) * (0.88 + 0.24 * (((Math.sin(seed * 12.9 + i * 78.2) * 43758.5) % 1) + 1) * 0.5);
    pts.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(' ');
};
const Bursts: React.FC<{v: number}> = ({v}) => {
  const shot = shotAt(v);
  return (
    <>
      {IMPACTS.map((im, i) => {
        const t = v - im.t;
        if (t < 0 || t > 0.62) return null;
        // only inside the shot the hit belongs to
        if (im.t < shot.from || im.t >= shot.to) return null;
        const [x, y] = project(v, im.p);
        const s = im.size * (0.35 + 0.65 * pop(t, 14)) * (t > 0.45 ? 1 - (t - 0.45) / 0.17 : 1);
        const rot = (i % 2 ? 1 : -1) * (8 + 4 * Math.sin(i * 3.1));
        const cx = im.at ? im.at[0] : Math.min(880, Math.max(200, x));
        const cy = im.at ? im.at[1] : Math.min(1150, Math.max(520, y - 60 * im.size));
        return (
          <div key={i} style={{position: 'absolute', left: cx, top: cy, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`}}>
            <svg width={560} height={420} viewBox="-280 -210 560 420" style={{display: 'block', overflow: 'visible'}}>
              <polygon points={star(13, 150, 235, i)} fill={INK} transform="translate(12 14) scale(1.25 0.86)" />
              <polygon points={star(13, 150, 235, i)} fill={im.hue ?? YELLOW} stroke={INK} strokeWidth={10} strokeLinejoin="round" transform="scale(1.25 0.86)" />
              <polygon points={star(13, 95, 160, i + 9)} fill="#fff" opacity={0.85} transform="scale(1.25 0.86)" />
            </svg>
            {im.word ? (
              <div style={{position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-54%)', textAlign: 'center', fontFamily: COMIC, fontSize: im.word.length > 5 ? 96 : 118, color: im.hue === RED ? '#fff' : RED, WebkitTextStroke: `16px ${INK}`, paintOrder: 'stroke fill', whiteSpace: 'nowrap', letterSpacing: 2}}>{im.word}</div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};
// a white frame and inked speed lines right on the hit
const BIG_HITS = [STOP, ...HITS, ...MELEE_HITS, SLUMP];
const Flash: React.FC<{v: number}> = ({v}) => {
  let k = 0;
  for (const t of BIG_HITS) {
    const d = v - t;
    if (d >= -0.001 && d < 0.2) k = Math.max(k, 1 - d / 0.2);
  }
  if (k <= 0) return null;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: k > 0.82 ? 0.55 : 0}} />
      <AbsoluteFill style={{opacity: Math.min(1, k * 1.6), background: `repeating-conic-gradient(from ${v * 400}deg at 50% 45%, rgba(28,16,36,0) 0deg 5deg, rgba(28,16,36,0.85) 5deg 5.8deg, rgba(28,16,36,0) 5.8deg 11deg, rgba(255,255,255,0.7) 11deg 11.5deg)`, WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, transparent 38%, #000 78%)', maskImage: 'radial-gradient(ellipse at 50% 45%, transparent 38%, #000 78%)'}} />
    </AbsoluteFill>
  );
};
// streaks from the edges while something rushes at the camera or away from it
const Rush: React.FC<{v: number}> = ({v}) => {
  const k = Math.max(ramp(v, CHARGE, CHARGE + 0.2) * (1 - ramp(v, STOP - 0.05, STOP + 0.1)), ramp(v, RUN5 + 0.3, RUN5 + 0.7) * (1 - ramp(v, E.brave - 0.25, E.brave)) * 0.7);
  if (k <= 0) return null;
  return (
    <AbsoluteFill style={{opacity: k * 0.8, background: `repeating-conic-gradient(from ${Math.floor(v * 30) * 37}deg at 50% 42%, rgba(255,255,255,0) 0deg 7deg, rgba(255,255,255,0.9) 7deg 7.5deg, rgba(255,255,255,0) 7.5deg 16deg, rgba(28,16,36,0.7) 16deg 16.4deg)`, WebkitMaskImage: 'radial-gradient(ellipse at 50% 42%, transparent 45%, #000 85%)', maskImage: 'radial-gradient(ellipse at 50% 42%, transparent 45%, #000 85%)'}} />
  );
};

// ---------------------------------------------------------------- plates
const Title: React.FC<{v: number}> = ({v}) => {
  if (v > HUD_FROM - 0.05) return null;
  const o = fade(v, -1, HUD_FROM - 0.05, 0.01, 0.2);
  const q = pop(v - PHRASES[1][0] + 0.05, 9);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', opacity: o}}>
      <div>
        <Panel bg={YELLOW} size={74} pad="8px 34px 12px" rot={-2}>
          100 МУЖЧИН
        </Panel>
      </div>
      <div style={{marginTop: -6}}>
        <Panel bg={INK} color={CREAM} size={74} pad="8px 34px 12px" rot={1.5}>
          <span style={{color: RED}}>VS</span> 1 ГОРИЛЛА
        </Panel>
      </div>
      {q > 0 ? (
        <div style={{marginTop: 26, transform: `scale(${q})`}}>
          <Panel bg={RED} color="#fff" size={50} rot={-1}>
            КАК В РЕАЛЬНОСТИ?
          </Panel>
        </div>
      ) : null}
    </div>
  );
};
const Weights: React.FC<{v: number}> = ({v}) => {
  const end = PHRASES[11][1] - 0.1; // gone before the last heave
  if (v < TONS - 0.1 || v > end) return null;
  const o = fade(v, TONS - 0.1, end, 0.05, 0.25);
  const a = pop(v - TONS + 0.05, 9);
  const b = pop(v - KILOS + 0.05, 9);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 500, textAlign: 'center', opacity: o}}>
      <div style={{transform: `scale(${a})`}}>
        <Panel bg={YELLOW} size={58} rot={-2}>
          30 МУЖЧИН ≈ <span style={{color: RED}}>2,5 Т</span>
        </Panel>
      </div>
      {b > 0 ? (
        <div style={{transform: `scale(${b})`, marginTop: 16}}>
          <Panel bg={INK} color={CREAM} size={58} rot={1.5}>
            ГОРИЛЛА ≈ <span style={{color: YELLOW}}>200 КГ</span>
          </Panel>
        </div>
      ) : null}
    </div>
  );
};
const Result: React.FC<{v: number}> = ({v}) => {
  if (v < PLATE1 - 0.05) return null;
  const a = pop(v - PLATE1, 8);
  const b = pop(v - PLATE2, 9);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 190, textAlign: 'center'}}>
      <div style={{transform: `scale(${a})`}}>
        <Panel bg={YELLOW} size={82} pad="10px 36px 14px" rot={-2}>
          ПОБЕДИЛИ МУЖЧИНЫ
        </Panel>
      </div>
      {b > 0 ? (
        <>
          <div style={{transform: `scale(${b})`, marginTop: 22}}>
            <Panel bg={RED} color="#fff" size={56} pad="10px 30px 12px" rot={1.5}>
              ПОСТРАДАВШИХ: <span style={{fontSize: 84, verticalAlign: 'middle'}}>14</span> ИЗ 100
            </Panel>
          </div>
          <div style={{transform: `scale(${pop(v - PLATE2 - 0.35, 9)})`, marginTop: 22}}>
            <Panel bg={INK} color={CREAM} size={46} rot={-1}>
              БОЙ ДЛИЛСЯ <span style={{color: YELLOW}}>2 МИНУТЫ</span>
            </Panel>
          </div>
        </>
      ) : null}
    </div>
  );
};

// halftone corners and a soft purple vignette: the printed-comic feel
export const Print: React.FC = () => (
  <>
    <AbsoluteFill style={{backgroundImage: 'radial-gradient(circle, rgba(28,16,36,0.5) 0 2.6px, transparent 3.2px)', backgroundSize: '13px 13px', WebkitMaskImage: 'radial-gradient(ellipse at 50% 46%, transparent 58%, #000 108%)', maskImage: 'radial-gradient(ellipse at 50% 46%, transparent 58%, #000 108%)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 58%, rgba(40,14,60,0.34) 100%)'}} />
  </>
);

export const Overlay: React.FC<{v: number}> = ({v}) => (
  <AbsoluteFill>
    <Print />
    <Rush v={v} />
    <Flash v={v} />
    <Bursts v={v} />
    <Title v={v} />
    <Hud v={v} />
    <Weights v={v} />
    <Result v={v} />
    <Captions v={v} />
  </AbsoluteFill>
);
