import React from 'react';
import {Ball, Block, Cone, Cyl, Glow, RBox, Ring} from '../bear/kit';
import {Pic} from '../bear/Props';
import {COND, roundRect} from '../gta/tex';
import {V3, rnd} from './cues';

// Sets for «GTA 7 или Half-Life 3: что выйдет быстрее?». Two game boxes on toy wheels race each other.
// The covers are our own drawings: no Valve / Rockstar logos, no lambda, no trailer frames.

export const HL_A = '#ff8a1e';
export const HL_B = '#c8501a';
export const GTA_A = '#c83ad0';
export const GTA_B = '#8a3cf0';

// ---------------------------------------------------------------- covers

// HL3: from afar a big «3» under HALF-LIFE; up close the small line reads «2: EPISODE» (the final twist)
const drawHl = (g: CanvasRenderingContext2D, W: number, H: number) => {
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2a1208');
  bg.addColorStop(0.55, '#7a2c0c');
  bg.addColorStop(1, '#1a0a04');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * 0.5, H * 0.62, 0, W * 0.5, H * 0.62, W * 0.7);
  glow.addColorStop(0, 'rgba(255,150,60,0.75)');
  glow.addColorStop(1, 'rgba(255,120,40,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  // a crowbar, diagonal behind the 3
  g.save();
  g.translate(W * 0.5, H * 0.6);
  g.rotate(-0.75);
  g.lineCap = 'round';
  g.strokeStyle = '#1a0a04';
  g.lineWidth = W * 0.075;
  g.beginPath();
  g.moveTo(-W * 0.46, 0);
  g.lineTo(W * 0.38, 0);
  g.arc(W * 0.38, -W * 0.07, W * 0.07, Math.PI / 2, -Math.PI / 2, true);
  g.stroke();
  g.strokeStyle = '#e8452c';
  g.lineWidth = W * 0.045;
  g.stroke();
  g.restore();
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.font = `600 ${W * 0.19}px ${COND}`;
  g.lineWidth = W * 0.025;
  g.strokeStyle = '#1a0a04';
  g.strokeText('HALF-LIFE', W * 0.5, H * 0.2);
  g.fillStyle = '#ffffff';
  g.fillText('HALF-LIFE', W * 0.5, H * 0.2);
  // the small print
  g.font = `500 ${W * 0.05}px ${COND}`;
  g.fillStyle = '#b8805a';
  g.fillText('2: EPISODE', W * 0.5, H * 0.275);
  const three = g.createLinearGradient(0, H * 0.32, 0, H * 0.85);
  three.addColorStop(0, '#ffe27a');
  three.addColorStop(1, '#ff7a1e');
  g.font = `600 ${W * 0.78}px ${COND}`;
  g.lineWidth = W * 0.035;
  g.strokeText('3', W * 0.5, H * 0.86);
  g.fillStyle = three;
  g.fillText('3', W * 0.5, H * 0.86);
  g.fillStyle = '#120804';
  g.fillRect(0, H * 0.9, W, H * 0.1);
  g.fillStyle = '#ffffff';
  g.font = `500 ${W * 0.06}px ${COND}`;
  g.fillText('ЖДЁМ С 2007', W * 0.5, H * 0.965);
};

const drawGta = (g: CanvasRenderingContext2D, W: number, H: number) => {
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2a1660');
  sky.addColorStop(0.38, '#c8307a');
  sky.addColorStop(0.62, '#ff9a3a');
  sky.addColorStop(0.63, '#3a2a7a');
  sky.addColorStop(1, '#1a1040');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  g.save();
  g.beginPath();
  g.arc(W * 0.5, H * 0.6, W * 0.3, Math.PI, 0);
  g.closePath();
  g.clip();
  const sun = g.createLinearGradient(0, H * 0.3, 0, H * 0.6);
  sun.addColorStop(0, '#ffe27a');
  sun.addColorStop(1, '#ff6a3a');
  g.fillStyle = sun;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#c8307a';
  for (let i = 0; i < 5; i++) g.fillRect(0, H * (0.47 + i * 0.026), W, H * (0.006 + i * 0.003));
  g.restore();
  g.fillStyle = 'rgba(255,190,120,0.55)';
  for (let i = 0; i < 9; i++) g.fillRect(W * (0.3 + 0.05 * Math.sin(i * 2.1)), H * (0.65 + i * 0.03), W * (0.4 - i * 0.03), H * 0.008);
  const palm = (x: number, h: number, lean: number) => {
    g.strokeStyle = '#1a0c2a';
    g.lineWidth = W * 0.022;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x, H * 0.66);
    g.quadraticCurveTo(x + lean * 0.5, H * 0.66 - h * 0.5, x + lean, H * 0.66 - h);
    g.stroke();
    g.fillStyle = '#1a0c2a';
    const tx = x + lean;
    const ty = H * 0.66 - h;
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + (k - 3) * 0.55;
      g.beginPath();
      g.moveTo(tx, ty);
      g.quadraticCurveTo(tx + Math.cos(a) * W * 0.12, ty + Math.sin(a) * W * 0.12 - W * 0.02, tx + Math.cos(a) * W * 0.2, ty + Math.sin(a) * W * 0.2 + W * 0.07);
      g.quadraticCurveTo(tx + Math.cos(a) * W * 0.1, ty + Math.sin(a) * W * 0.1 + W * 0.01, tx, ty);
      g.fill();
    }
  };
  palm(W * 0.14, H * 0.3, W * 0.05);
  palm(W * 0.84, H * 0.36, -W * 0.07);
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.font = `600 ${W * 0.36}px ${COND}`;
  g.lineWidth = W * 0.03;
  g.strokeStyle = '#1a0c2a';
  g.strokeText('GTA', W * 0.5, H * 0.33);
  g.fillStyle = '#ffffff';
  g.fillText('GTA', W * 0.5, H * 0.33);
  g.font = `600 ${W * 0.62}px ${COND}`;
  const sev = g.createLinearGradient(0, H * 0.32, 0, H * 0.78);
  sev.addColorStop(0, '#ff5ab0');
  sev.addColorStop(1, '#ffb03a');
  g.strokeText('7', W * 0.5, H * 0.8);
  g.fillStyle = sev;
  g.fillText('7', W * 0.5, H * 0.8);
  g.fillStyle = '#120a24';
  g.fillRect(0, H * 0.9, W, H * 0.1);
  g.fillStyle = '#ffffff';
  g.font = `500 ${W * 0.06}px ${COND}`;
  g.fillText('VICE CITY · 20??', W * 0.5, H * 0.965);
  // the sticker
  g.save();
  g.translate(W * 0.8, H * 0.12);
  g.rotate(0.25);
  g.fillStyle = '#ffd23f';
  g.beginPath();
  for (let k = 0; k < 24; k++) {
    const r = k % 2 ? W * 0.14 : W * 0.165;
    const a = (k / 24) * Math.PI * 2;
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
  g.fillStyle = '#2a1f3a';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${W * 0.07}px ${COND}`;
  g.fillText('СКОРО', 0, 0);
  g.restore();
};

// ---------------------------------------------------------------- the racer: a game box on toy wheels
// travels along local +x; the cover is on the +z and -z faces; stands on y = 0

export const BOX = {w: 0.9, h: 1.2, d: 0.3, lift: 0.2};
export type Mood = 'open' | 'sleep' | 'sad' | 'happy';

const Eye: React.FC<{x: number; mood: Mood; look: [number, number]; lid: number}> = ({x, mood, look, lid}) => {
  const y = BOX.lift + BOX.h + 0.06;
  const open = mood === 'sleep' ? 0.18 : mood === 'happy' ? 0.55 : 1;
  return (
    <group position={[x, y, 0.02]}>
      <Ball scale={[0.13, 0.13 * open * (1 - lid * 0.85), 0.11]} color="#ffffff" look={{rough: 0.3}} />
      {open > 0.5 && lid < 0.6 ? <Ball position={[look[0] * 0.05, (mood === 'sad' ? -0.045 : 0) + look[1] * 0.04, 0.085]} scale={[0.055, 0.055, 0.035]} color="#1a1420" look={{rough: 0.2}} /> : null}
      {mood === 'sad' ? <Block position={[0, 0.1, 0.06]} rotation={[0, 0, x > 0 ? 0.35 : -0.35]} size={[0.2, 0.035, 0.03]} color="#2a1a10" /> : null}
    </group>
  );
};

export const Racer: React.FC<{
  kind: 'hl' | 'gta';
  position?: V3;
  rotation?: V3;
  scale?: number;
  t?: number; // wheel spin (travelled distance)
  squash?: number;
  lean?: number;
  mood?: Mood;
  look?: [number, number];
  blink?: number;
}> = ({kind, position, rotation, scale = 1, t = 0, squash = 1, lean = 0, mood = 'open', look = [0, 0], blink = 0}) => {
  const draw = kind === 'hl' ? drawHl : drawGta;
  const body = kind === 'hl' ? '#2a1208' : '#1a1040';
  const rim = kind === 'hl' ? HL_A : GTA_A;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group scale={[1 / Math.sqrt(squash), squash, 1]} rotation={[0, 0, lean]}>
        <RBox position={[0, BOX.lift + BOX.h / 2, 0]} size={[BOX.w, BOX.h, BOX.d]} r={0.04} color={body} look={{rough: 0.35}} />
        <Pic size={[BOX.w - 0.06, BOX.h - 0.06]} res={[384, 512]} k={`cover-${kind}`} position={[0, BOX.lift + BOX.h / 2, BOX.d / 2 + 0.005]} draw={draw} />
        <Pic size={[BOX.w - 0.06, BOX.h - 0.06]} res={[384, 512]} k={`cover-${kind}`} position={[0, BOX.lift + BOX.h / 2, -BOX.d / 2 - 0.005]} rotation={[0, Math.PI, 0]} draw={draw} />
        {/* a coloured bumper strip along the bottom */}
        <RBox position={[0, BOX.lift + 0.03, 0]} size={[BOX.w + 0.06, 0.07, BOX.d + 0.06]} r={0.03} color={rim} look={{rough: 0.4}} />
        <Eye x={-0.2} mood={mood} look={look} lid={blink} />
        <Eye x={0.2} mood={mood} look={look} lid={blink} />
      </group>
      {[-0.3, 0.3].flatMap((x) =>
        [-1, 1].map((s) => (
          <group key={`${x}${s}`} position={[x, 0.14, s * (BOX.d / 2 + 0.05)]} rotation={[Math.PI / 2, 0, 0]}>
            <group rotation={[0, -t / 0.14, 0]}>
              <Cyl rt={0.14} rb={0.14} h={0.08} seg={20} color="#22202a" look={{rough: 0.8}} />
              <Cyl position={[0, s * 0.03, 0]} rt={0.07} rb={0.07} h={0.03} seg={12} color="#f2f2f6" look={{rough: 0.3, metal: 0.4}} />
              <Block position={[0, s * 0.046, 0]} size={[0.12, 0.004, 0.025]} color={rim} shadow={false} />
            </group>
          </group>
        )),
      )}
    </group>
  );
};

// ---------------------------------------------------------------- the race track along x (two lanes at z = ±LANE)

export const LANE = 0.62;
const drawTrack = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#5a5866';
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 300; i++) g.fillRect(rnd(i) * W, rnd(i * 7) * H, 3, 3);
  g.fillStyle = '#f4f2ea';
  for (let x = 0; x < W; x += W / 16) g.fillRect(x, H / 2 - 3, W / 32, 6);
};
export const Track: React.FC<{from?: number; to?: number; grass?: string}> = ({from = -30, to = 60, grass = '#7ccf6a'}) => {
  const len = to - from;
  const cx = (from + to) / 2;
  return (
    <>
      <Block position={[cx, -0.05, 0]} size={[len, 0.1, 60]} color={grass} look={{rough: 1}} />
      {Array.from({length: Math.ceil(len / 8)}).map((_, i) => (
        <Pic key={i} size={[8, 2.6]} res={[512, 160]} k="track" position={[from + 4 + i * 8, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} shadow draw={drawTrack} />
      ))}
      {/* kerbs */}
      {[-1, 1].map((s) =>
        Array.from({length: Math.ceil(len / 0.5)}).map((_, i) => (
          <Block key={`${s}${i}`} position={[from + 0.25 + i * 0.5, 0.02, s * 1.38]} size={[0.5, 0.04, 0.16]} color={i % 2 ? '#ffffff' : '#e8453c'} shadow={false} />
        )),
      )}
    </>
  );
};

export const Checker: React.FC<{x: number; w?: number; n?: number}> = ({x, w = 0.4, n = 12}) => (
  <>
    {Array.from({length: n * 2}).map((_, i) => {
      const r = i % 2;
      const c = Math.floor(i / 2);
      return <Block key={i} position={[x + (r - 0.5) * (w / 2), 0.006, -1.3 + (c + 0.5) * (2.6 / n)]} size={[w / 2, 0.006, 2.6 / n]} color={(r + c) % 2 ? '#ffffff' : '#1a1420'} shadow={false} />;
    })}
  </>
);

// toy trees and a fence for parallax
export const Tree: React.FC<{position: V3; s?: number; i: number}> = ({position, s = 1, i}) => (
  <group position={position} scale={s}>
    <Cyl position={[0, 0.3, 0]} rt={0.07} rb={0.09} h={0.6} seg={10} color="#8a5a3a" />
    <Ball position={[0, 0.85, 0]} scale={[0.42, 0.5, 0.42]} color={['#4fb05a', '#3c9a4c', '#6ac46a'][i % 3]} look={{rough: 0.9}} />
    <Ball position={[0.16, 1.15, 0.05]} scale={0.26} color={['#5abf64', '#48a856', '#78d070'][i % 3]} look={{rough: 0.9}} />
  </group>
);
export const Trees: React.FC<{z: number; from: number; to: number; seed: number; s?: number; step?: number}> = ({z, from, to, seed, s = 1, step = 1.6}) => (
  <>
    {Array.from({length: Math.ceil((to - from) / step)}).map((_, i) => (
      <Tree key={i} position={[from + i * step + rnd(seed + i) * 0.6, 0, z + (rnd(seed * 3 + i) - 0.5) * 0.8]} s={s * (0.8 + rnd(seed * 5 + i) * 0.5)} i={i} />
    ))}
  </>
);
export const Fence: React.FC<{z: number; from: number; to: number}> = ({z, from, to}) => (
  <>
    <Block position={[(from + to) / 2, 0.42, z]} size={[to - from, 0.06, 0.04]} color="#f4f2ea" />
    <Block position={[(from + to) / 2, 0.22, z]} size={[to - from, 0.06, 0.04]} color="#f4f2ea" />
    {Array.from({length: Math.ceil((to - from) / 0.8)}).map((_, i) => (
      <Block key={i} position={[from + i * 0.8, 0.25, z]} size={[0.06, 0.5, 0.06]} color="#e8453c" />
    ))}
  </>
);
// the stands: rows of round toy fans
const FAN_COLS = ['#ff8a1e', '#8a3cf0', '#ffd23f', '#5aa0e6', '#f0559a', '#ffffff', '#2fae5a'];
export const Stands: React.FC<{z: number; from: number; to: number; v: number}> = ({z, from, to, v}) => (
  <>
    {[0, 1, 2].map((r) => (
      <Block key={r} position={[(from + to) / 2, 0.2 + r * 0.4, z - r * 0.5]} size={[to - from, 0.4 + r * 0.4, 0.5]} color={r % 2 ? '#8a8aa0' : '#9a9ab4'} />
    ))}
    {[0, 1, 2].flatMap((r) =>
      Array.from({length: Math.ceil((to - from) / 0.45)}).map((_, i) => {
        const jump = Math.max(0, Math.sin(v * 9 + i * 1.7 + r)) * 0.08;
        return <Ball key={`${r}-${i}`} position={[from + 0.2 + i * 0.45, 0.62 + r * 0.6 + jump, z - r * 0.5]} scale={0.15} color={FAN_COLS[(i * 3 + r) % FAN_COLS.length]} look={{rough: 0.7}} />;
      }),
    )}
  </>
);

// a gantry with three start lights over the track at x; lit = 0 none, 1 red, 2 yellow, 3 green
export const StartLights: React.FC<{x: number; lit: number}> = ({x, lit}) => (
  <group position={[x, 0, 0]}>
    <Cyl position={[0, 1.4, -1.65]} rt={0.05} rb={0.05} h={2.8} seg={10} color="#3a3a48" look={{metal: 0.5, rough: 0.4}} />
    <Block position={[0, 2.75, -0.85]} size={[0.12, 0.12, 1.7]} color="#3a3a48" />
    <RBox position={[0, 2.35, 0]} size={[0.25, 0.75, 0.3]} r={0.04} color="#1a1a22" />
    {[0, 1, 2].map((i) => {
      const on = lit === i + 1 || (lit === 3 && i === 2);
      const col = ['#ff3a2a', '#ffc81e', '#3aff6a'][i];
      return (
        <group key={i}>
          <Ball position={[0.13, 2.58 - i * 0.22, 0]} scale={[0.04, 0.085, 0.085]} color={on ? col : '#3a3238'} look={on ? {emissive: col, emissiveK: 2.2} : {rough: 0.4}} />
          {on ? <Glow position={[0.22, 2.58 - i * 0.22, 0]} size={0.6} color={col} k={0.9} /> : null}
        </group>
      );
    })}
  </group>
);

// big digit steps (a staircase going up along +x, the front faces +z)
const drawDigit = (d: string, col: string) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = col;
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.25)';
  g.fillRect(0, 0, W, H * 0.08);
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${H * 0.8}px ${COND}`;
  g.lineWidth = H * 0.06;
  g.strokeStyle = 'rgba(30,20,40,0.5)';
  g.strokeText(d, W / 2, H * 0.55);
  g.fillText(d, W / 2, H * 0.55);
};
// a staircase going up and away from the camera (-z); step i is (i + 1) * h tall, the digit sits on its exposed riser
export const STEP = {w: 1.4, h: 0.6, d: 0.75};
export const DigitStep: React.FC<{position: V3; i: number; d: string; col: string}> = ({position, i, d, col}) => {
  const h = STEP.h * (i + 1);
  const dd = STEP.d - 0.03;
  return (
    <group position={position}>
      <RBox position={[0, h / 2, 0]} size={[STEP.w, h, dd]} r={0.04} color={col} look={{rough: 0.6}} />
      <Pic size={[STEP.w * 0.62, STEP.h * 0.84]} res={[256, 180]} k={`digit-${d}-${col}`} position={[0, i * STEP.h + STEP.h / 2, dd / 2 + 0.006]} draw={drawDigit(d, col)} />
    </group>
  );
};

// a wall calendar on a stand: big year
const drawCal = (year: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#fffaf0';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#e8453c';
  g.fillRect(0, 0, W, H * 0.22);
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${H * 0.13}px ${COND}`;
  g.fillText('ГОД', W / 2, H * 0.11);
  g.fillStyle = '#2a1f3a';
  g.font = `600 ${H * 0.42}px ${COND}`;
  g.fillText(String(year), W / 2, H * 0.58);
  g.fillStyle = 'rgba(42,31,58,0.25)';
  for (let r = 0; r < 2; r++) for (let c = 0; c < 7; c++) g.fillRect(W * (0.08 + c * 0.125), H * (0.82 + r * 0.07), W * 0.09, H * 0.05);
};
export const CAL = {w: 1.5, h: 1.25};
export const CalPage: React.FC<{year: number; position?: V3; rotation?: V3}> = ({year, position, rotation}) => (
  <group position={position} rotation={rotation}>
    <Pic size={[CAL.w, CAL.h]} res={[384, 320]} k={`cal-${year}`} draw={drawCal(year)} />
  </group>
);
export const CalStand: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <RBox position={[0, 1.55, -0.04]} size={[CAL.w + 0.1, CAL.h + 0.1, 0.05]} r={0.02} color="#c8955e" />
    {[-0.5, 0.5].map((x) => (
      <Ring key={x} position={[x, 2.2, 0.0]} rotation={[0, Math.PI / 2, 0]} r={0.05} tube={0.012} color="#9a9aa8" look={{metal: 0.8, rough: 0.3}} />
    ))}
    {[-1, 1].map((s) => (
      <Block key={s} position={[s * 0.55, 0.47, -0.25]} rotation={[0.35, 0, 0]} size={[0.06, 1.0, 0.06]} color="#8a5a3a" />
    ))}
  </group>
);

// a floating loading bar
const drawLoad = (pct: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#1a1420';
  roundRect(g, 0, 0, W, H, H * 0.3);
  g.fill();
  g.fillStyle = '#3a3048';
  roundRect(g, W * 0.04, H * 0.52, W * 0.92, H * 0.3, H * 0.15);
  g.fill();
  const gr = g.createLinearGradient(0, 0, W, 0);
  gr.addColorStop(0, '#ffb03a');
  gr.addColorStop(1, '#ff7a1e');
  g.fillStyle = gr;
  roundRect(g, W * 0.04, H * 0.52, W * 0.92 * pct, H * 0.3, H * 0.15);
  g.fill();
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${H * 0.32}px ${COND}`;
  g.fillText(`ЗАГРУЗКА ${Math.round(pct * 100)}%`, W / 2, H * 0.27);
};
export const LoadBar: React.FC<{position: V3; pct: number}> = ({position, pct}) => (
  <group position={position}>
    <Pic size={[1.6, 0.5]} res={[512, 160]} k={`load-${Math.round(pct * 100)}`} draw={drawLoad(pct)} lit={false} />
  </group>
);

// cobweb in a corner (threads in the xy plane)
export const Web: React.FC<{position: V3; rotation?: V3; s?: number}> = ({position, rotation, s = 0.4}) => (
  <group position={position} rotation={rotation} scale={s}>
    {Array.from({length: 6}).map((_, i) => {
      const a = (i / 5) * (Math.PI / 2);
      return <Block key={i} position={[Math.cos(a) * 0.5, -Math.sin(a) * 0.5, 0]} rotation={[0, 0, -a]} size={[1, 0.014, 0.004]} color="#f4f4f8" look={{opacity: 0.8}} shadow={false} receive={false} />;
    })}
    {[0.3, 0.55, 0.8].map((r, j) => (
      <Ring key={j} rotation={[0, 0, -Math.PI / 2]} r={r} tube={0.007} arc={Math.PI / 2} color="#f4f4f8" look={{opacity: 0.7}} shadow={false} />
    ))}
  </group>
);

// money: a brick of banknotes
export const Cash: React.FC<{position: V3; rotation?: V3; s?: number}> = ({position, rotation, s = 1}) => (
  <group position={position} rotation={rotation} scale={s}>
    <RBox size={[0.36, 0.1, 0.18]} r={0.015} color="#6cc46a" look={{rough: 0.8}} />
    <Block position={[0, 0, 0]} size={[0.08, 0.104, 0.184]} color="#f4e8b0" shadow={false} />
  </group>
);
export const Coin: React.FC<{position: V3; rotation?: V3}> = ({position, rotation}) => (
  <Cyl position={position} rotation={rotation} rt={0.07} rb={0.07} h={0.02} seg={16} color="#ffc81e" look={{metal: 0.8, rough: 0.3}} />
);
// a sofa built from cash bricks (seat along x, back at -z)
export const CashSofa: React.FC<{position: V3}> = ({position}) => {
  const bricks: React.ReactNode[] = [];
  let k = 0;
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 6; x++)
      for (let z = 0; z < 4; z++) bricks.push(<Cash key={k++} position={[-0.95 + x * 0.38 + (y % 2) * 0.06, 0.05 + y * 0.1, -0.3 + z * 0.19]} />);
  for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) bricks.push(<Cash key={k++} position={[-0.95 + x * 0.38 + (y % 2) * 0.06, 0.45 + y * 0.1, -0.5]} />);
  for (const s of [-1, 1]) for (let y = 0; y < 3; y++) for (let z = 0; z < 3; z++) bricks.push(<Cash key={k++} position={[s * 1.18, 0.45 + y * 0.1, -0.3 + z * 0.22]} rotation={[0, Math.PI / 2, 0]} />);
  return <group position={position}>{bricks}</group>;
};

// a pipe from above with a sign
const drawSign = (text: string, bg: string, fg = '#ffffff', size = 0.42) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = bg;
  roundRect(g, 0, 0, W, H, H * 0.18);
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.8)';
  g.lineWidth = H * 0.05;
  roundRect(g, H * 0.06, H * 0.06, W - H * 0.12, H - H * 0.12, H * 0.14);
  g.stroke();
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lines = text.split('\n');
  g.font = `600 ${H * size}px ${COND}`;
  lines.forEach((l, i) => g.fillText(l, W / 2, H * (0.5 + (i - (lines.length - 1) / 2) * size * 1.1)));
};
export const Sign: React.FC<{position: V3; rotation?: V3; w: number; h: number; text: string; bg: string; fg?: string; size?: number; k: string; lit?: boolean}> = ({position, rotation, w, h, text, bg, fg, size, k, lit}) => (
  <Pic size={[w, h]} res={w >= h ? [1024, Math.max(64, Math.round((1024 * h) / w))] : [Math.max(64, Math.round((1024 * w) / h)), 1024]} k={k} position={position} rotation={rotation} draw={drawSign(text, bg, fg, size)} lit={lit} />
);
export const Pipe: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <Cyl position={[0, 1.5, 0]} rt={0.2} rb={0.2} h={3} seg={20} color="#9aa0b4" look={{metal: 0.7, rough: 0.3}} />
    <Cyl position={[0, 0.02, 0]} rt={0.26} rb={0.26} h={0.12} seg={20} color="#7a8094" look={{metal: 0.7, rough: 0.3}} />
  </group>
);

// a door in a wall (wall in the xy plane at z = 0, facing +z)
export const DoorWall: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <Block position={[0, 1.6, -0.1]} size={[8, 3.2, 0.2]} color="#c8b8e0" />
    <RBox position={[0, 1.05, 0.02]} size={[1.2, 2.1, 0.08]} r={0.03} color="#6a4a8a" />
    <Block position={[0, 2.16, 0.0]} size={[1.36, 0.1, 0.04]} color="#f4f2ea" />
    {[-1, 1].map((s) => (
      <Block key={s} position={[s * 0.65, 1.05, 0.0]} size={[0.08, 2.2, 0.04]} color="#f4f2ea" />
    ))}
    <Ball position={[0.42, 1.0, 0.09]} scale={0.06} color="#ffc81e" look={{metal: 0.8, rough: 0.3}} />
    <Block position={[0.42, 0.85, 0.07]} size={[0.06, 0.12, 0.02]} color="#2a2030" />
  </group>
);

// a toaster (long side along x, slots on top)
export const Toaster: React.FC<{position: V3; pop: number}> = ({position, pop}) => (
  <group position={position}>
    <RBox position={[0, 0.55, 0]} size={[1.5, 1.0, 0.9]} r={0.2} color="#d8dce8" look={{metal: 0.75, rough: 0.25}} />
    <RBox position={[0, 0.06, 0]} size={[1.6, 0.12, 1.0]} r={0.05} color="#2a2a34" />
    {[-0.2, 0.2].map((z) => (
      <Block key={z} position={[0, 1.054, z]} size={[1.0, 0.01, 0.12]} color="#1a1a22" shadow={false} />
    ))}
    <RBox position={[0.82, 0.4 + 0.3 * (1 - pop), 0]} size={[0.14, 0.12, 0.22]} r={0.03} color="#e8453c" />
    <Block position={[0.761, 0.55, 0]} size={[0.02, 0.6, 0.06]} color="#2a2a34" shadow={false} />
  </group>
);
// a toast; screen = true draws a tiny HL3 on it
const drawToastScreen = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#e0a060';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#1a1420';
  roundRect(g, W * 0.1, H * 0.15, W * 0.8, H * 0.6, W * 0.06);
  g.fill();
  g.fillStyle = '#ff8a1e';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${H * 0.3}px ${COND}`;
  g.fillText('HL3', W / 2, H * 0.45);
  g.fillStyle = '#ffd23f';
  g.font = `500 ${H * 0.12}px ${COND}`;
  g.fillText('60 FPS', W / 2, H * 0.86);
};
export const Toast: React.FC<{position: V3; rotation?: V3; screen?: boolean}> = ({position, rotation, screen}) => (
  <group position={position} rotation={rotation}>
    <RBox size={[0.8, 0.75, 0.08]} r={0.06} color="#c8803a" look={{rough: 0.9}} />
    <RBox position={[0, 0, 0]} size={[0.7, 0.65, 0.085]} r={0.04} color="#f0c890" look={{rough: 0.9}} />
    {screen ? <Pic size={[0.6, 0.55]} res={[256, 240]} k="toast-hl3" position={[0, 0, 0.046]} draw={drawToastScreen} /> : null}
  </group>
);

// finish arch over the track at x
export const FinishArch: React.FC<{x: number}> = ({x}) => (
  <group position={[x, 0, 0]}>
    <RBox position={[0, 1.5, -2.3]} size={[0.2, 3, 0.2]} r={0.04} color="#e8453c" />
    <Sign position={[0, 3.1, 0]} rotation={[0, Math.PI / 2, 0]} w={4.8} h={0.6} text="ФИНИШ" bg="#1a1420" size={0.6} k="sign-finish" />
    <Sign position={[0, 3.1, 0.001]} rotation={[0, -Math.PI / 2, 0]} w={4.8} h={0.6} text="ФИНИШ" bg="#1a1420" size={0.6} k="sign-finish" />
  </group>
);
export const Ribbon: React.FC<{x: number; broken?: number}> = ({x, broken = 0}) =>
  broken > 0 ? (
    <>
      {[-1, 1].map((s) => (
        <Block key={s} position={[x + 0.25 * broken, 0.85 - 0.3 * broken, s * (2.3 - 0.6)]} rotation={[0, s * 0.6 * broken, -0.6 * broken]} size={[0.02, 0.06, 1.2]} color="#ffd23f" shadow={false} />
      ))}
    </>
  ) : (
    <Block position={[x, 0.85, 0]} size={[0.02, 0.06, 4.6]} color="#ffd23f" shadow={false} />
  );

// the podium: places 1 (centre), 2 (left), 3 (right) along x, front +z
const drawPlace = (d: string) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${H * 0.75}px ${COND}`;
  g.fillText(d, W / 2, H * 0.55);
};
export const Podium: React.FC = () => (
  <>
    {(
      [
        [0, 1.2, '1', '#ffc81e'],
        [-1.25, 0.8, '2', '#c8ccd8'],
        [1.25, 0.5, '3', '#d8965a'],
      ] as [number, number, string, string][]
    ).map(([x, h, d, c]) => (
      <group key={d}>
        <RBox position={[x, h / 2, 0]} size={[1.2, h, 1.0]} r={0.05} color={c} look={{rough: 0.5, metal: 0.2}} />
        <Pic size={[0.5, 0.45]} res={[128, 115]} k={`place-${d}`} position={[x, h - 0.32, 0.505]} draw={drawPlace(d)} transparent />
      </group>
    ))}
  </>
);

export {Ball, Block, Cone, Cyl, Glow, RBox, Ring};
