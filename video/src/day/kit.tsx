import React from 'react';
import '@fontsource/unbounded/cyrillic-700.css';
import '@fontsource/unbounded/cyrillic-900.css';
import '@fontsource/unbounded/latin-700.css';
import '@fontsource/unbounded/latin-900.css';
import '@fontsource/pacifico/cyrillic-400.css';
import '@fontsource/pacifico/latin-400.css';
import '@fontsource/rubik/800.css';
import {continueRender, delayRender, staticFile} from 'remotion';

// «День выхода GTA 6»: neon 2D illustration. Everything is flat SVG shapes with gradients, soft radial glows and
// parallax layers; no 3D. One scene = one <svg viewBox="0 0 1080 1920">.

export const W = 1080;
export const H = 1920;
export const DISPLAY = "'Unbounded', 'Rubik', sans-serif";
export const SCRIPT = "'Pacifico', cursive";
export const ROUND = "'Rubik', 'Arial', sans-serif";

const handle = delayRender('Loading day fonts');
Promise.all([
  document.fonts.load("700 40px 'Unbounded'", 'ДЕНЬ GTA 6'),
  document.fonts.load("900 40px 'Unbounded'", 'ДЕНЬ GTA 6'),
  document.fonts.load("400 40px 'Pacifico'", 'Майами Miami'),
  document.fonts.load("800 60px 'Rubik'", 'Выход GTA'),
])
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));

// ---------- palette ----------
export const C = {
  night: '#0d0722',
  indigo: '#1a0f3d',
  violet: '#3a1a78',
  purple: '#6a2bb8',
  magenta: '#ff2e88',
  pink: '#ff6fb0',
  rose: '#ffa6c9',
  orange: '#ff8a3c',
  amber: '#ffc24b',
  sun: '#ffe08a',
  cream: '#fff3df',
  teal: '#16d9c8',
  cyan: '#63f0ff',
  blue: '#3b6cff',
  ink: '#120a26',
};

// ---------- math ----------
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const ramp = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
export const smooth = (x: number) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x: number) => Math.pow(clamp01(x), 3);
export const easeInOut = (x: number) => {
  const k = clamp01(x);
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
};
export const pop = (t: number, k = 9) => (t <= 0 ? 0 : 1 - Math.exp(-t * k) * Math.cos(t * k * 1.6));
export const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const mix = (a: string, b: string, k: number) => {
  const p = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((q, i) => Math.round(lerp(q, y[i], clamp01(k))).toString(16).padStart(2, '0')).join('');
};

// ---------- camera + parallax ----------
// cam.x / cam.y: where the camera looks (px in the scene, 0 0 = centre), cam.z: zoom.
// A layer with d = 1 follows the camera fully (the subject plane); d < 1 is farther away, d > 1 is the foreground.
export type Cam = {x: number; y: number; z: number};
export const Par: React.FC<{cam: Cam; d?: number; children: React.ReactNode; o?: number}> = ({cam, d = 1, children, o}) => {
  const s = 1 + (cam.z - 1) * d;
  return (
    <g opacity={o} transform={`translate(${W / 2} ${H / 2}) scale(${s}) translate(${-W / 2 - cam.x * d} ${-H / 2 - cam.y * d})`}>
      {children}
    </g>
  );
};
export const camLerp = (a: Cam, b: Cam, k: number): Cam => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
// a tiny breathing drift so a held frame never looks frozen
export const drift = (c: Cam, t: number, amp = 6): Cam => ({x: c.x + Math.sin(t * 0.7) * amp, y: c.y + Math.cos(t * 0.53) * amp * 0.7, z: c.z});

// ---------- gradients and glows ----------
const idOf = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '');

export const LinGrad: React.FC<{id: string; stops: [number, string, number?][]; x1?: number; y1?: number; x2?: number; y2?: number}> = ({id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1}) => (
  <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
    {stops.map(([o, c, a], i) => (
      <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />
    ))}
  </linearGradient>
);

// soft light blob: cheap radial gradient, no blur filter
export const Glow: React.FC<{x: number; y: number; r: number; c: string; o?: number; ry?: number; core?: number}> = ({x, y, r, c, o = 1, ry, core = 0}) => {
  const id = `gl${idOf(c)}${Math.round(core * 100)}`;
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset={0} stopColor={c} stopOpacity={1} />
          {core > 0 ? <stop offset={core} stopColor={c} stopOpacity={0.85} /> : null}
          <stop offset={0.45 + core * 0.4} stopColor={c} stopOpacity={0.28} />
          <stop offset={1} stopColor={c} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y} rx={r} ry={ry ?? r} fill={`url(#${id})`} opacity={o} style={{mixBlendMode: 'screen'}} />
    </>
  );
};

// vertical sky gradient
export const Sky: React.FC<{id: string; stops: [number, string][]; y?: number; h?: number}> = ({id, stops, y = -400, h = H + 800}) => (
  <>
    <defs>
      <LinGrad id={id} stops={stops} />
    </defs>
    <rect x={-600} y={y} width={W + 1200} height={h} fill={`url(#${id})`} />
  </>
);

export const Stars: React.FC<{seed?: number; n?: number; t: number; y0?: number; y1?: number; c?: string}> = ({seed = 1, n = 90, t, y0 = -100, y1 = 900, c = '#fff'}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const x = rnd(seed + i * 3.1) * (W + 400) - 200;
      const y = y0 + rnd(seed + i * 7.7) * (y1 - y0);
      const r = 1.2 + rnd(seed + i * 1.3) * 2.4;
      const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + rnd(i) * 3) + i);
      return <circle key={i} cx={x} cy={y} r={r} fill={c} opacity={tw * (0.35 + 0.65 * rnd(i * 9.1)) * (1 - (y - y0) / (y1 - y0) * 0.6)} />;
    })}
  </g>
);

// ---------- city ----------
type Bld = {x: number; w: number; h: number; top: number; k: number};
export const skyline = (seed: number, x0: number, x1: number, wMin: number, wMax: number, hMin: number, hMax: number): Bld[] => {
  const out: Bld[] = [];
  let x = x0;
  let i = 0;
  while (x < x1) {
    const w = wMin + rnd(seed + i * 2.3) * (wMax - wMin);
    const h = hMin + Math.pow(rnd(seed + i * 5.9), 1.6) * (hMax - hMin);
    out.push({x, w, h, top: Math.floor(rnd(seed + i * 9.7) * 4), k: seed + i * 13.37});
    x += w + (rnd(seed + i * 4.1) < 0.25 ? rnd(seed + i) * 26 : 0);
    i++;
  }
  return out;
};

// A row of building silhouettes standing on baseY. `lit` (0..1) = share of lit windows; litAt lets a wave switch them on.
export const Skyline: React.FC<{
  b: Bld[];
  baseY: number;
  fill: string;
  win?: string[];
  lit?: number;
  cell?: number;
  dim?: string;
  litAt?: (x: number, y: number, k: number) => number;
  rim?: string;
}> = ({b, baseY, fill, win, lit = 0.4, cell = 26, dim, litAt, rim}) => (
  <g>
    {b.map((q, i) => {
      const y = baseY - q.h;
      const cols = Math.max(1, Math.floor((q.w - 14) / cell));
      const rows = Math.max(1, Math.floor((q.h - 24) / (cell * 1.25)));
      const pad = (q.w - cols * cell) / 2;
      const ws: React.ReactNode[] = [];
      if (win)
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            const k = rnd(q.k + r * 17.3 + c * 3.7);
            const wx = q.x + pad + c * cell + cell * 0.18;
            const wy = y + 16 + r * cell * 1.25;
            const on = litAt ? litAt(wx, wy, k) : k < lit ? 1 : 0;
            if (on <= 0.01 && !dim) continue;
            const col = win[Math.floor(rnd(q.k + r * 5.1 + c * 9.3) * win.length)];
            ws.push(<rect key={`${r}-${c}`} x={wx} y={wy} width={cell * 0.64} height={cell * 0.78} rx={2} fill={on > 0.01 ? col : dim} opacity={on > 0.01 ? 0.35 + 0.65 * on : 1} />);
          }
      return (
        <g key={i}>
          <rect x={q.x} y={y} width={q.w} height={q.h + 400} fill={fill} />
          {rim ? <rect x={q.x} y={y} width={q.w} height={3} fill={rim} opacity={0.7} /> : null}
          {q.top === 1 ? <rect x={q.x + q.w * 0.3} y={y - 22} width={q.w * 0.4} height={22} fill={fill} /> : null}
          {q.top === 2 ? <rect x={q.x + q.w * 0.5 - 2} y={y - 60} width={4} height={60} fill={fill} /> : null}
          {q.top === 3 ? <path d={`M${q.x} ${y} L${q.x + q.w / 2} ${y - 34} L${q.x + q.w} ${y} Z`} fill={fill} /> : null}
          {ws}
        </g>
      );
    })}
  </g>
);

// ---------- palm ----------
export const Palm: React.FC<{x: number; y: number; s?: number; lean?: number; fill: string; t?: number; rim?: string; flip?: boolean}> = ({x, y, s = 1, lean = 0.18, fill, t = 0, rim, flip}) => {
  const hgt = 520;
  const tx = lean * hgt;
  const sway = Math.sin(t * 0.9 + x * 0.01) * 0.04;
  const fronds = [-3.0, -2.62, -2.24, -1.86, -1.48, -1.1, -0.72, -0.34, 0.02].map((a, i) => {
    const ang = a + sway * (1 + i * 0.15);
    const len = 220 + (i % 3) * 36;
    const ex = Math.cos(ang) * len;
    const ey = Math.sin(ang) * len * 0.5 + len * 0.6;
    const ux = Math.cos(ang) * len * 0.56;
    const uy = Math.sin(ang) * len * 0.62 - len * 0.16;
    const lx = Math.cos(ang) * len * 0.5;
    const ly = uy + 40;
    return <path key={i} d={`M0 -5 Q${ux} ${uy} ${ex} ${ey} Q${lx} ${ly} 0 10 Z`} fill={fill} />;
  });
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d={`M-13 0 Q${tx * 0.25 - 16} ${-hgt * 0.55} ${tx - 7} ${-hgt} L${tx + 7} ${-hgt} Q${tx * 0.25 + 14} ${-hgt * 0.55} 15 0 Z`} fill={fill} />
      {rim ? <path d={`M10 0 Q${tx * 0.25 + 12} ${-hgt * 0.55} ${tx + 6} ${-hgt}`} stroke={rim} strokeWidth={3} fill="none" opacity={0.7} /> : null}
      <g transform={`translate(${tx} ${-hgt})`}>
        {fronds}
        <circle r={16} fill={fill} />
      </g>
    </g>
  );
};

// ---------- water ----------
export const wavePath = (y: number, t: number, amp = 8, len = 190, x0 = -400, x1 = W + 400, phase = 0) => {
  let d = `M${x0} ${y}`;
  for (let x = x0; x <= x1; x += 30) {
    const yy = y + Math.sin(x / len + t * 1.6 + phase) * amp + Math.sin(x / (len * 0.43) - t * 2.3 + phase * 2) * amp * 0.4;
    d += ` L${x} ${yy.toFixed(1)}`;
  }
  return d;
};
export const Water: React.FC<{id: string; y: number; t: number; top: string; bottom: string; o?: number; amp?: number; shine?: string; depth?: number}> = ({id, y, t, top, bottom, o = 1, amp = 8, shine = '#ffffff', depth = 2400}) => (
  <g>
    <defs>
      <LinGrad id={id} stops={[[0, top], [1, bottom]]} />
    </defs>
    <path d={`${wavePath(y, t, amp)} L${W + 400} ${y + depth} L-400 ${y + depth} Z`} fill={`url(#${id})`} opacity={o} />
    <path d={wavePath(y, t, amp)} stroke={shine} strokeWidth={5} fill="none" opacity={0.75} strokeLinecap="round" />
    <path d={wavePath(y + 26, t * 0.8, amp * 0.6, 150, -400, W + 400, 1.7)} stroke={shine} strokeWidth={3} fill="none" opacity={0.22} strokeDasharray="90 150" strokeDashoffset={t * 40} />
    <path d={wavePath(y + 64, t * 0.6, amp * 0.5, 230, -400, W + 400, 3.1)} stroke={shine} strokeWidth={3} fill="none" opacity={0.14} strokeDasharray="60 210" strokeDashoffset={-t * 30} />
  </g>
);

// ---------- finishing: grain, vignette ----------
export const Finish: React.FC<{frame: number; vig?: string; grain?: number}> = ({frame, vig = 'rgba(8,2,30,0.55)', grain = 0.16}) => (
  <>
    <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 52%, ${vig} 100%)`}} />
    <div
      style={{
        position: 'absolute',
        inset: -8,
        backgroundImage: `url(${staticFile('day/grain.png')})`,
        backgroundPosition: `${Math.floor(rnd(frame) * 300)}px ${Math.floor(rnd(frame + 0.5) * 300)}px`,
        opacity: grain,
        mixBlendMode: 'overlay',
      }}
    />
  </>
);

// rounded "limb" between two points
export const Limb: React.FC<{a: [number, number]; b: [number, number]; c?: [number, number]; w: number; fill: string}> = ({a, b, c, w, fill}) => (
  <path d={c ? `M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}` : `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`} stroke={fill} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
);

// a 5-point star
export const starPath = (cx: number, cy: number, r: number, inner = 0.45, rot = -Math.PI / 2) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = rot + (i * Math.PI) / 5;
    d += `${i === 0 ? 'M' : 'L'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `;
  }
  return d + 'Z';
};
