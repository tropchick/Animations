import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, interpolate} from 'remotion';
import {COND, YELLOW} from '../gta/Overlay';
import {FINAL, GRAPH, GROUPS, JUMP, LABEL, LIGHTS_OUT, PRINT, SIGN, SWITCH, Shot, V3, WIN_OUT, WORDS, clamp01, lerp, ramp, shotAt} from './cues';
import {BENCH_POS, viewAt} from './World';

const PLATE = 'rgba(14,14,20,0.86)';
const RED = '#ff5a4d';
const GREEN = '#3ad07a';

const fade = (v: number, from: number, to: number, fi = 0.12, fo = 0.15) =>
  interpolate(v, [from, from + fi, to - fo, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const W = 1080;
const H = 1920;
const CAM = new THREE.PerspectiveCamera(40, W / H, 0.05, 3000);
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

// ---------- the title over the first two shots ----------

const Title: React.FC<{v: number}> = ({v}) => {
  const o = fade(v, 0, 6.7, 0.01, 0.25);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 190, textAlign: 'center', opacity: o}}>
      <div style={{...plate, borderRadius: 24, padding: '10px 30px 14px', fontSize: 76, lineHeight: 1.12, color: '#fff'}}>
        Что если Доту
        <br />
        <span style={{color: RED}}>закроют навсегда?</span>
      </div>
    </div>
  );
};

// ---------- the date stamp: each step follows the last ----------

const DATES: Partial<Record<Shot, string>> = {
  yard: 'ДЕНЬ 1, 08:00',
  queue: 'ДЕНЬ 2',
  printer: 'ДЕНЬ 2',
  sheet: 'ДЕНЬ 2',
  road: 'ДЕНЬ 5',
  office: 'НЕДЕЛЯ 3',
  plant: 'МЕСЯЦ 2',
  control: 'МЕСЯЦ 2',
  leak: 'МЕСЯЦ 3, 19:00',
  leave: 'МЕСЯЦ 3, 19:01',
  off: 'МЕСЯЦ 3, 19:01',
  earth: 'МЕСЯЦ 3, 19:05',
  candle: 'МЕСЯЦ 3, 19:05',
  fake: 'МЕСЯЦ 3, 19:30',
};

const DateStamp: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v);
  const text = DATES[s.name];
  if (!text) return null;
  const prev = shotAt(s.from - 0.01);
  const changed = prev.name === s.name || DATES[prev.name] !== text;
  const pop = changed ? Math.exp(-s.t * 5) : 0;
  const o = changed ? clamp01(s.t / 0.12) : 1;
  const late = s.name === 'leave' || s.name === 'off' || s.name === 'earth' || s.name === 'candle' || s.name === 'fake';
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', opacity: o}}>
      <div style={{...plate, padding: '6px 26px 10px', fontSize: 56, lineHeight: 1.15, letterSpacing: 1, color: late ? '#ff6a5a' : YELLOW, transform: `scale(${1 + 0.14 * pop})`}}>{text}</div>
    </div>
  );
};

// ---------- the counter under the date ----------

const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU').replace(/\s/g, ' ');

const counter = (v: number): {label: string; value: string; color: string; key: string; top: number} | null => {
  const s = shotAt(v).name;
  switch (s) {
    case 'windows': {
      const k = ramp(v, WIN_OUT[0], WIN_OUT[1]);
      return {label: 'ИГРОКОВ ОНЛАЙН', value: fmt(lerp(15000000, 0, k)), color: k >= 1 ? RED : '#fff', key: 'online', top: 420};
    }
    case 'printer': {
      const k = ramp(v, PRINT[0], PRINT[1] - 0.4);
      return {label: 'ЗАЯВЛЕНИЙ', value: fmt(lerp(0, 2000000, k * k)), color: k >= 1 ? RED : '#fff', key: 'reports', top: 290};
    }
    case 'road':
      return v < SIGN ? null : {label: 'ПРОБКА', value: '10 БАЛЛОВ', color: RED, key: 'jam', top: 290};
    case 'office':
      return v < GRAPH[1] - 0.3 ? null : {label: 'ВВП СТРАНЫ', value: '+12%', color: GREEN, key: 'gdp', top: 290};
    case 'leave': {
      if (v < JUMP) return {label: 'НА РАБОТЕ', value: fmt(15000000), color: '#fff', key: 'work', top: 290};
      const k = ramp(v, JUMP, JUMP + 1.2);
      return {label: 'НА РАБОТЕ', value: fmt(lerp(15000000, 0, k)), color: k >= 1 ? RED : '#fff', key: 'work', top: 290};
    }
    case 'earth':
      return v < LIGHTS_OUT[0] + 0.4 ? null : {label: 'БЕЗ СВЕТА', value: 'ВЕСЬ КОНТИНЕНТ', color: RED, key: 'dark', top: 290};
    default:
      return null;
  }
};

const Counter: React.FC<{v: number}> = ({v}) => {
  const h = counter(v);
  if (!h) return null;
  let since = 0;
  for (let t = v; t > v - 1 && counter(t)?.key === h.key; t -= 1 / 30) since = v - t;
  const o = clamp01(since / 0.1 + (since >= 0.99 ? 1 : 0));
  const pop = since < 0.99 ? Math.exp(-since * 6) : 0;
  return (
    <div style={{position: 'absolute', left: 30, right: 30, top: h.top, textAlign: 'center', opacity: Math.max(o, 0.001)}}>
      <div style={{...plate, padding: '6px 28px 10px', fontSize: 54, lineHeight: 1.15, color: '#fff', transform: `scale(${1 + 0.1 * pop})`, whiteSpace: 'nowrap', border: `3px solid ${h.color === RED ? 'rgba(255,90,77,0.7)' : h.color === GREEN ? 'rgba(58,208,122,0.7)' : 'rgba(255,255,255,0.12)'}`}}>
        <span style={{color: '#c8c8d4'}}>{h.label}: </span>
        <span style={{color: h.color, fontVariantNumeric: 'tabular-nums'}}>{h.value}</span>
      </div>
    </div>
  );
};

// ---------- «НОВЫЕ ЖИЛЬЦЫ?» over the grannies ----------

const Gossip: React.FC<{v: number}> = ({v}) => {
  if (shotAt(v).name !== 'yard' || v < LABEL) return null;
  const [x, y] = project([BENCH_POS[0], 2.3, BENCH_POS[2]], v);
  const t = v - LABEL;
  const pop = Math.exp(-t * 7);
  const o = clamp01(t / 0.1);
  return (
    <div style={{position: 'absolute', left: Math.min(Math.max(x - 260, 30), W - 550), top: Math.min(Math.max(y - 120, 400), 1180), width: 520, textAlign: 'center', opacity: o}}>
      <div style={{...plate, background: '#fffbe8', color: '#1a1a1a', padding: '8px 26px 12px', fontSize: 56, transform: `scale(${1 + 0.2 * pop})`, border: '4px solid #1a1a1a'}}>Новые жильцы?</div>
    </div>
  );
};

// ---------- final plate ----------

const Final: React.FC<{v: number}> = ({v}) => {
  if (v < FINAL) return null;
  const t = v - FINAL;
  const o = clamp01(t / 0.15);
  const pop = Math.exp(-t * 6);
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 760, textAlign: 'center', opacity: o}}>
      <div style={{...plate, borderRadius: 24, padding: '14px 34px 18px', fontSize: 84, lineHeight: 1.1, color: '#fff', border: `4px solid ${RED}`, transform: `scale(${1 + 0.12 * pop})`}}>
        ДОТА 3:
        <br />
        <span style={{color: RED}}>ДАТА НЕИЗВЕСТНА</span>
      </div>
    </div>
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
  const red = flash(v, SWITCH, 6) * 0.35;
  const white = flash(v, JUMP, 9) * 0.15;
  return (
    <AbsoluteFill>
      {red > 0.01 ? <AbsoluteFill style={{background: '#ff2a1a', opacity: red}} /> : null}
      {white > 0.01 ? <AbsoluteFill style={{background: '#fff', opacity: white}} /> : null}
      <Title v={v} />
      <DateStamp v={v} />
      <Counter v={v} />
      <Gossip v={v} />
      <Final v={v} />
      {GROUPS.map((_, g) => (
        <Caption key={g} v={v} g={g} />
      ))}
    </AbsoluteFill>
  );
};
