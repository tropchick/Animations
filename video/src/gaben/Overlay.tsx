import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, interpolate} from 'remotion';
import {COND, YELLOW} from '../gta/Overlay';
import {BAR, BURST, CLICK, ERROR, GROUPS, HELI_FUEL, HL3, MOON_LEAVE, NEEDLE, REVEAL, SINK, SLIPPER_LBL, STALL, Shot, TRUCK_STEP, V3, WALL_LBL, WALL_Q, WORDS, ZOOM, clamp01, lerp, ramp, shotAt, shotStart, smooth} from './cues';
import {ORBIT_SLIPPER, ORBIT_WALL, viewAt} from './World';

const PLATE = 'rgba(16,12,20,0.84)';
const PINK = '#ff7eb6';
const RED = '#ff5a4d';

const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const W = 1080;
const H = 1920;
const CAM = new THREE.PerspectiveCamera(40, W / H, 0.05, 3000);
// where a world point lands on screen at time v
const project = (p: V3, v: number): [number, number] => {
  const view = viewAt(v);
  CAM.fov = view.fov;
  CAM.position.set(...view.pos);
  CAM.up.set(0, 1, 0);
  CAM.lookAt(...view.target);
  CAM.updateProjectionMatrix();
  CAM.updateMatrixWorld();
  const q = new THREE.Vector3(...p).project(CAM);
  return [(q.x * 0.5 + 0.5) * W, (-q.y * 0.5 + 0.5) * H];
};

const plate: React.CSSProperties = {
  display: 'inline-block',
  background: PLATE,
  borderRadius: 18,
  boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
  fontFamily: COND,
  fontWeight: 600,
};

// ---------- title for the first shot ----------

const Title: React.FC<{v: number}> = ({v}) => {
  const o = fade(v, 0, 5.4, 0.01, 0.25);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 190, textAlign: 'center', opacity: o}}>
      <div style={{...plate, borderRadius: 24, padding: '10px 30px 14px', fontSize: 74, lineHeight: 1.12, color: '#fff'}}>
        Сколько весит
        <br />
        <span style={{color: PINK}}>мать Габена?</span>
      </div>
    </div>
  );
};

// ---------- the counter at the top ----------

const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');

const hud = (v: number): {label: string; value: string; color: string; key: string} | null => {
  const s = shotAt(v).name;
  switch (s) {
    case 'scale':
      if (v < NEEDLE[0]) return null;
      if (v < BURST) return {label: 'ВЕС', value: `${fmt(lerp(60, 999, ramp(v, NEEDLE[0], NEEDLE[1])))} КГ`, color: '#fff', key: 'kg'};
      return {label: 'ВЕС', value: 'ОШИБКА', color: RED, key: 'err'};
    case 'pile':
      return {label: 'ВЕС', value: 'ОШИБКА', color: RED, key: 'err'};
    case 'truck':
      return v < TRUCK_STEP ? {label: 'ВЕС', value: '?', color: '#fff', key: 'q'} : {label: 'ВЕС', value: 'БОЛЬШЕ 60 ТОНН', color: RED, key: '60t'};
    case 'heli':
      return {label: 'ОБХВАТ', value: `${fmt(lerp(0, 720, ramp(v, HELI_FUEL[0] - 1, STALL)))} КМ`, color: '#fff', key: 'km'};
    case 'orbit':
      return {label: 'РАЗМЕР', value: 'ВИДНО ИЗ КОСМОСА', color: PINK, key: 'space'};
    case 'moon':
      return v < MOON_LEAVE ? {label: 'ВЕС', value: '?', color: '#fff', key: 'q2'} : {label: 'ВЕС', value: 'БОЛЬШЕ ЗЕМЛИ', color: RED, key: 'earth'};
    case 'donut':
      return v < REVEAL ? {label: 'ЧЁРНАЯ ДЫРА', value: 'M87*', color: '#ffb347', key: 'm87'} : {label: 'ПОНЧИК', value: '40 МЛРД КМ', color: PINK, key: 'donut'};
    case 'universe': {
      const n = 12 + Math.floor((v - shotStart('universe')) * 4);
      return {label: 'ВЕС', value: '9'.repeat(Math.min(n, 30)), color: RED, key: 'nines'};
    }
    case 'servers':
      return {label: 'ВЕС', value: 'СЧИТАЕТСЯ…', color: YELLOW, key: 'calc'};
    default:
      return null;
  }
};

const Hud: React.FC<{v: number}> = ({v}) => {
  const h = hud(v);
  if (!h) return null;
  // pop when the value changes
  let since = 0;
  for (let t = v; t > v - 1 && hud(t)?.key === h.key; t -= 1 / 30) since = v - t;
  const pop = Math.exp(-since * 6) * (since < 0.99 ? 1 : 0);
  const o = clamp01(since / 0.1 + (since >= 0.99 ? 1 : 0));
  const top = shotAt(v).name === 'scale' ? 440 : 190;
  return (
    <div style={{position: 'absolute', left: 30, right: 30, top, textAlign: 'center', opacity: Math.max(o, 0.001)}}>
      <div style={{...plate, padding: '6px 28px 10px', fontSize: 58, lineHeight: 1.15, color: '#fff', transform: `scale(${1 + 0.12 * pop})`, maxWidth: 1000, overflow: 'hidden', whiteSpace: 'nowrap', border: `3px solid ${h.color === RED ? 'rgba(255,90,77,0.7)' : 'rgba(255,255,255,0.12)'}`}}>
        <span style={{color: '#cfc6d6'}}>{h.label}: </span>
        <span style={{color: h.color}}>{h.value}</span>
      </div>
    </div>
  );
};

// ---------- helicopter fuel gauge ----------

const Fuel: React.FC<{v: number}> = ({v}) => {
  if (shotAt(v).name !== 'heli') return null;
  const f = 1 - ramp(v, HELI_FUEL[0], HELI_FUEL[1]);
  const low = f < 0.25;
  const blink = low && Math.sin(v * 18) > 0;
  return (
    <div style={{position: 'absolute', right: 50, top: 330, ...plate, padding: '10px 20px 14px', fontSize: 40, color: '#fff', width: 300}}>
      <div style={{color: low ? RED : '#cfc6d6'}}>ТОПЛИВО</div>
      <div style={{marginTop: 8, height: 26, borderRadius: 13, background: '#2a2230', overflow: 'hidden', border: blink ? `2px solid ${RED}` : '2px solid transparent'}}>
        <div style={{width: `${f * 100}%`, height: '100%', background: low ? RED : '#2fe07a'}} />
      </div>
    </div>
  );
};

// ---------- labels with arrows in the orbit shot ----------

// a label box centred at (x, y) with an arrow from the box edge to (ax, ay)
const Label: React.FC<{x: number; y: number; ax: number; ay: number; text: React.ReactNode; color: string; o: number; s: number}> = ({x, y, ax, ay, text, color, o, s}) => {
  const y0 = ay > y ? y + 45 : y - 45;
  const len = Math.hypot(ax - x, ay - y0);
  const ang = Math.atan2(ay - y0, ax - x);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: o}}>
      <div style={{position: 'absolute', left: x, top: y0, width: Math.max(0, len - 26), height: 8, background: color, transformOrigin: '0 50%', transform: `translateY(-4px) rotate(${ang}rad) scaleX(${s})`, borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.5)'}} />
      <div
        style={{
          position: 'absolute',
          left: ax - 30,
          top: ay - 18,
          width: 0,
          height: 0,
          borderLeft: '30px solid ' + color,
          borderTop: '18px solid transparent',
          borderBottom: '18px solid transparent',
          transform: `rotate(${ang}rad)`,
          transformOrigin: '30px 18px',
          opacity: s > 0.95 ? 1 : 0,
        }}
      />
      <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', ...plate, padding: '6px 22px 10px', fontSize: 50, color, whiteSpace: 'nowrap'}}>{text}</div>
    </div>
  );
};

const OrbitLabels: React.FC<{v: number}> = ({v}) => {
  if (shotAt(v).name !== 'orbit') return null;
  const [wx, wy] = project(ORBIT_WALL, v);
  const [sx, sy] = project(ORBIT_SLIPPER, v);
  const o1 = fade(v, WALL_LBL, 99, 0.15, 0.1);
  const s1 = smooth(ramp(v, WALL_LBL, WALL_LBL + 0.35));
  const q = v >= WALL_Q;
  const o2 = fade(v, SLIPPER_LBL, 99, 0.12, 0.1);
  const s2 = smooth(ramp(v, SLIPPER_LBL, SLIPPER_LBL + 0.3));
  return (
    <>
      {o1 > 0 ? (
        <Label x={540} y={430} ax={wx} ay={wy} o={o1} s={s1} color="#ffffff" text={<>Великая китайская стена{q ? <span style={{color: RED}}> ?</span> : null}</>} />
      ) : null}
      {o2 > 0 ? <Label x={430} y={1240} ax={sx} ay={sy + 30} o={o2} s={s2} color={PINK} text="Тапок" /> : null}
    </>
  );
};

// ---------- the photo caption in the donut shot ----------

const PhotoTag: React.FC<{v: number}> = ({v}) => {
  if (shotAt(v).name !== 'donut') return null;
  const a = fade(v, shotStart('donut') + 0.1, ZOOM[0] + 0.4, 0.15, 0.3);
  const b = fade(v, REVEAL, 99, 0.12, 0.1);
  return (
    <>
      {a > 0 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1150, textAlign: 'center', opacity: a}}>
          <div style={{...plate, padding: '6px 24px 10px', fontSize: 44, color: '#ffd27a'}}>Первый снимок чёрной дыры, 2019</div>
        </div>
      ) : null}
      {b > 0 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1150, textAlign: 'center', opacity: b}}>
          <div style={{...plate, padding: '6px 24px 10px', fontSize: 50, color: PINK, transform: `scale(${1 + 0.15 * Math.exp(-(v - REVEAL) * 6)})`}}>Увеличено в 1 000 000 раз</div>
        </div>
      ) : null}
    </>
  );
};

// ---------- the full-screen monitor at the end ----------

const Screen: React.FC<{v: number}> = ({v}) => {
  if (shotAt(v).name !== 'screen') return null;
  const reset = v >= CLICK + 0.1;
  const pct = reset ? lerp(0, 0.001, ramp(v, CLICK + 0.1, 50)) : lerp(0.996, 0.999, ramp(v, BAR[0], BAR[1]));
  const err = v >= ERROR && !reset;
  const errPop = err ? Math.exp(-(v - ERROR) * 9) : 0;
  // the mouse cursor moves onto «Да» and clicks
  const cm = smooth(ramp(v, ERROR + 0.35, CLICK - 0.1));
  const cx = lerp(820, 330, cm);
  const cy = lerp(1500, 1105, cm);
  const pressed = v >= CLICK && v < CLICK + 0.12;
  const hl = fade(v, HL3, 99, 0.2, 0.1);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #13213a 0%, #070b14 75%)'}}>
      {/* window */}
      <div style={{position: 'absolute', left: 70, right: 70, top: 380, height: 640, borderRadius: 26, background: '#0e1a2e', border: '3px solid #2a3c5c', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', fontFamily: COND, color: '#fff'}}>
        <div style={{height: 70, borderBottom: '3px solid #2a3c5c', display: 'flex', alignItems: 'center', paddingLeft: 30, fontSize: 38, color: '#9fb8d8', fontWeight: 500}}>
          calc_mother_weight.exe
        </div>
        <div style={{padding: '40px 50px'}}>
          <div style={{fontSize: 58, fontWeight: 600}}>Расчёт веса: мать Габена</div>
          <div style={{marginTop: 40, height: 70, borderRadius: 18, background: '#1c2a40', overflow: 'hidden'}}>
            <div style={{width: `${pct * 100}%`, height: '100%', background: '#2fe07a'}} />
          </div>
          <div style={{marginTop: 26, fontSize: 64, fontWeight: 600}}>{(pct * 100).toFixed(1)}%</div>
          <div style={{marginTop: 6, fontSize: 44, color: '#9fb8d8'}}>{reset ? 'Осталось: ~20 лет' : 'Осталось: почти всё'}</div>
        </div>
      </div>
      {/* the error dialog */}
      {err ? (
        <div style={{position: 'absolute', left: 120, right: 120, top: 760, borderRadius: 22, background: '#f4f5f7', boxShadow: '0 24px 70px rgba(0,0,0,0.7)', fontFamily: COND, color: '#1a1a1a', transform: `scale(${1 + 0.1 * errPop})`, overflow: 'hidden'}}>
          <div style={{background: '#d63a3a', color: '#fff', fontSize: 44, fontWeight: 600, padding: '12px 30px'}}>Ошибка</div>
          <div style={{padding: '26px 34px 10px', fontSize: 52, lineHeight: 1.2, fontWeight: 500}}>Недостаточно памяти. Начать заново?</div>
          <div style={{display: 'flex', gap: 30, padding: '20px 34px 34px'}}>
            <div style={{flex: 1, textAlign: 'center', fontSize: 50, fontWeight: 600, padding: '10px 0', borderRadius: 14, background: pressed ? '#1d5fc0' : '#2f7bf0', color: '#fff'}}>Да</div>
            <div style={{flex: 1, textAlign: 'center', fontSize: 50, fontWeight: 600, padding: '10px 0', borderRadius: 14, background: '#d9dde3', color: '#555'}}>Нет</div>
          </div>
        </div>
      ) : null}
      {v >= ERROR && v < CLICK + 0.5 ? (
        <svg style={{position: 'absolute', left: cx, top: cy}} width="56" height="80" viewBox="0 0 28 40">
          <path d="M2 2 L2 32 L10 25 L15 37 L20 35 L15 23 L25 23 Z" fill="#fff" stroke="#000" strokeWidth="2" />
        </svg>
      ) : null}
      {hl > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 1080, textAlign: 'center', opacity: hl}}>
          <div style={{...plate, padding: '10px 28px 14px', fontSize: 56, lineHeight: 1.2, color: YELLOW, border: `3px solid ${YELLOW}`}}>
            Half-Life 3: ждёт окончания расчёта
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- karaoke captions ----------

const Caption: React.FC<{v: number; g: number}> = ({v, g}) => {
  const pieces = GROUPS[g];
  const words = WORDS.filter((w) => pieces.includes(w[3]));
  if (!words.length) return null;
  const start = words[0][0] - 0.1;
  const nextGroup = GROUPS[g + 1] ? WORDS.find((w) => GROUPS[g + 1].includes(w[3])) : undefined;
  const end = Math.min(words[words.length - 1][1] + 0.45, nextGroup ? nextGroup[0] - 0.08 : 1e9);
  const o = fade(v, start, end, 0.08, 0.12);
  if (o <= 0) return null;
  let cur = -1;
  words.forEach((w, i) => {
    if (v >= w[0] - 0.03) cur = i;
  });
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1380, textAlign: 'center', opacity: o}}>
      <div style={{...plate, borderRadius: 22, padding: '10px 28px 14px', fontSize: 62, lineHeight: 1.18, color: '#fff'}}>
        {words.map((w, i) => (
          <span key={i} style={{color: i === cur ? YELLOW : '#ffffff', display: i <= cur ? 'inline' : 'none'}}>
            {w[2]}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

const flash = (v: number, at: number, decay: number) => (v >= at ? Math.exp(-(v - at) * decay) : 0);

export const Overlay: React.FC<{v: number}> = ({v}) => {
  const white = Math.max(flash(v, BURST, 8) * 0.5, flash(v, REVEAL, 7) * 0.35, flash(v, SINK[0] + 0.05, 9) * 0.0);
  const s = shotAt(v).name as Shot;
  return (
    <AbsoluteFill>
      {white > 0.01 ? <AbsoluteFill style={{background: '#fff', opacity: Math.min(1, white)}} /> : null}
      <Screen v={v} />
      <Title v={v} />
      {s !== 'screen' ? <Hud v={v} /> : null}
      <Fuel v={v} />
      <OrbitLabels v={v} />
      <PhotoTag v={v} />
      {GROUPS.map((_, g) => (
        <Caption key={g} v={v} g={g} />
      ))}
    </AbsoluteFill>
  );
};
