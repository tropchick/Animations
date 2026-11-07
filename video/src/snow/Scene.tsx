import React from 'react';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import {CX, FPS, GY, SUN, W, balls, geom} from './sim';
import {winterAt} from './winter';
import {SIM, frameAt, recent, lastEvent, INF_VALUE, INF_FRAME} from './data';

const INF_T = INF_FRAME / FPS;

// «Снеговик против весны»: everything is one flat 2D picture in SVG. Screen-fixed layers (sky, sun, flakes, beams, text)
// sit around one "world" group that the camera pulls back from as the snowman outgrows the frame.

const H = 1920;
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mixC = (a: string, b: string, k: number) => {
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(mix(v, B[i], clamp(k)))).join(',')})`;
};
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// lowest value so far: the puddle never dries up
const MIN_SD: number[] = [];
SIM.frames.forEach((f, i) => MIN_SD.push(Math.min(f.Sd, i ? MIN_SD[i - 1] : 1)));


// ---------- world props ----------

type Tree = {x: number; h: number; k: number};
const TREES: Tree[] = [
  {x: -2600, h: 600, k: 2},
  {x: -1900, h: 520, k: 0},
  {x: -1250, h: 470, k: 1},
  {x: -760, h: 580, k: 2},
  {x: -330, h: 540, k: 0},
  {x: 92, h: 380, k: 1},
  {x: 1010, h: 500, k: 0},
  {x: 1330, h: 620, k: 2},
  {x: 1760, h: 520, k: 1},
  {x: 2350, h: 640, k: 0},
  {x: 2900, h: 480, k: 2},
];
type House = {x: number; w: number; h: number; wall: string; roof: string; kind?: 'church' | 'mill'};
const HOUSES: House[] = [
  {x: -7100, w: 420, h: 330, wall: '#f3d7a6', roof: '#b4553f'},
  {x: -5600, w: 380, h: 1050, wall: '#e9e2d4', roof: '#7a5b45', kind: 'mill'},
  {x: -4300, w: 460, h: 360, wall: '#f6e3c5', roof: '#c4643e'},
  {x: -3400, w: 400, h: 300, wall: '#dfe9f2', roof: '#4f6d8f'},
  {x: 3600, w: 420, h: 320, wall: '#f8e7c8', roof: '#b4553f'},
  {x: 4500, w: 380, h: 360, wall: '#e8f1e3', roof: '#5b7f4c'},
  {x: 5700, w: 520, h: 1300, wall: '#f1ece2', roof: '#3f6e9e', kind: 'church'},
  {x: 6900, w: 440, h: 340, wall: '#f6dcc0', roof: '#a3493a'},
];
const HILLS = [
  {x: -10500, rx: 6500, ry: 2600, c: '#7fbf63'},
  {x: 11000, rx: 7200, ry: 3100, c: '#86c46a'},
];
const MOUNTAINS = [
  {x: -26000, hw: 12000, h: 21000},
  {x: 27000, hw: 13000, h: 23000},
  {x: -12500, hw: 9000, h: 15000},
  {x: 13000, hw: 11500, h: 19500},
];
const MEADOW = Array.from({length: 46}, (_, i) => ({x: -900 + hash(i + 3) * 2900, c: Math.floor(hash(i + 50) * 4), s: 0.7 + hash(i + 90) * 0.5}));
const PETALS = ['#ff7eb6', '#ffd23f', '#ffffff', '#b58cff'];

const GRASS = (() => {
  let d = '';
  for (let x = -4000; x < 5200; x += 19) {
    const h = 14 + hash(x) * 16;
    const lean = (hash(x + 7) - 0.5) * 14;
    d += `M${x} ${GY + 2}l${lean * 0.5} ${-h}l${4 + lean * 0.5} ${h}Z`;
  }
  return d;
})();

const TreeShape: React.FC<{t: Tree; snow: number; time: number}> = ({t, snow, time}) => {
  const sway = Math.sin(time * 1.3 + t.x) * 0.012 * t.h;
  if (t.k === 2) {
    // birch
    const crown = mixC('#8fd16a', '#9bb3a0', snow);
    return (
      <g>
        <rect x={t.x - 12} y={GY - t.h * 0.75} width={24} height={t.h * 0.75} fill="#f4f1ea" />
        {[0.15, 0.3, 0.48, 0.62].map((k, i) => (
          <rect key={i} x={t.x - 12} y={GY - t.h * k} width={i % 2 ? 14 : 20} height={7} fill="#3a3a3a" />
        ))}
        <ellipse cx={t.x + sway} cy={GY - t.h * 0.72} rx={t.h * 0.2} ry={t.h * 0.3} fill={crown} />
        <ellipse cx={t.x + sway - t.h * 0.05} cy={GY - t.h * 0.82} rx={t.h * 0.13} ry={t.h * 0.17} fill={mixC('#a8e07e', '#c6d4cc', snow)} />
        <ellipse cx={t.x + sway} cy={GY - t.h * 0.97} rx={t.h * 0.15 * snow} ry={t.h * 0.07 * snow} fill="#fbfdff" opacity={snow} />
      </g>
    );
  }
  const crown = t.k === 0 ? mixC('#ffb3cf', '#d9dfe8', snow) : mixC('#6cc152', '#8fa79a', snow);
  const light = t.k === 0 ? mixC('#ffd6e5', '#eef2f7', snow) : mixC('#8ad66b', '#b7c8be', snow);
  const r = t.h * 0.3;
  const cy = GY - t.h * 0.68;
  return (
    <g>
      <path d={`M${t.x - 16} ${GY}L${t.x - 9} ${cy + r * 0.3}L${t.x + 9} ${cy + r * 0.3}L${t.x + 16} ${GY}Z`} fill="#7a5235" />
      <circle cx={t.x - r * 0.6 + sway} cy={cy + r * 0.25} r={r * 0.72} fill={crown} />
      <circle cx={t.x + r * 0.62 + sway} cy={cy + r * 0.2} r={r * 0.7} fill={crown} />
      <circle cx={t.x + sway} cy={cy - r * 0.3} r={r * 0.85} fill={crown} />
      <circle cx={t.x - r * 0.25 + sway} cy={cy - r * 0.5} r={r * 0.42} fill={light} />
      {t.k === 0 && snow < 0.9
        ? [0, 1, 2, 3, 4, 5, 6].map((i) => (
            <circle key={i} cx={t.x + sway + (hash(t.x + i) - 0.5) * r * 1.8} cy={cy + (hash(t.x + i * 3) - 0.6) * r * 1.3} r={7} fill="#ffffff" opacity={0.85 * (1 - snow)} />
          ))
        : null}
      <ellipse cx={t.x + sway} cy={cy - r * 1.02} rx={r * 0.75 * snow} ry={r * 0.28 * snow} fill="#fbfdff" opacity={snow} />
      <ellipse cx={t.x + sway - r * 0.7} cy={cy - r * 0.3} rx={r * 0.45 * snow} ry={r * 0.18 * snow} fill="#fbfdff" opacity={snow} />
      <ellipse cx={t.x + sway + r * 0.75} cy={cy - r * 0.35} rx={r * 0.42 * snow} ry={r * 0.17 * snow} fill="#fbfdff" opacity={snow} />
    </g>
  );
};

const HouseShape: React.FC<{h: House; snow: number; time: number}> = ({h, snow, time}) => {
  const L = h.x - h.w / 2;
  const roofC = mixC(h.roof, '#f4f8fc', snow * 0.85);
  if (h.kind === 'mill') {
    const a = time * 0.8;
    return (
      <g>
        <path d={`M${h.x - h.w * 0.35} ${GY}L${h.x - h.w * 0.22} ${GY - h.h * 0.72}L${h.x + h.w * 0.22} ${GY - h.h * 0.72}L${h.x + h.w * 0.35} ${GY}Z`} fill={h.wall} />
        <path d={`M${h.x - h.w * 0.3} ${GY - h.h * 0.7}L${h.x} ${GY - h.h * 0.86}L${h.x + h.w * 0.3} ${GY - h.h * 0.7}Z`} fill={roofC} />
        <g transform={`translate(${h.x} ${GY - h.h * 0.74}) rotate(${(a * 180) / Math.PI})`}>
          {[0, 90, 180, 270].map((r) => (
            <rect key={r} x={-14} y={-h.h * 0.36} width={28 + h.w * 0.12} height={h.h * 0.34} fill="#cdb79a" stroke="#7a5b45" strokeWidth={10} transform={`rotate(${r})`} />
          ))}
        </g>
        <rect x={h.x - 40} y={GY - 140} width={80} height={140} fill="#7a5b45" />
      </g>
    );
  }
  if (h.kind === 'church') {
    return (
      <g>
        <rect x={L} y={GY - h.h * 0.32} width={h.w} height={h.h * 0.32} fill={h.wall} />
        <path d={`M${L - 20} ${GY - h.h * 0.32}L${h.x} ${GY - h.h * 0.46}L${L + h.w + 20} ${GY - h.h * 0.32}Z`} fill={roofC} />
        <rect x={h.x - h.w * 0.17} y={GY - h.h * 0.75} width={h.w * 0.34} height={h.h * 0.75} fill={h.wall} />
        <path d={`M${h.x - h.w * 0.2} ${GY - h.h * 0.75}L${h.x} ${GY - h.h}L${h.x + h.w * 0.2} ${GY - h.h * 0.75}Z`} fill={roofC} />
        <circle cx={h.x} cy={GY - h.h * 0.62} r={h.w * 0.08} fill="#4b5d73" />
        <rect x={h.x - 40} y={GY - 170} width={80} height={170} rx={40} fill="#6b4a2b" />
      </g>
    );
  }
  return (
    <g>
      <rect x={L} y={GY - h.h * 0.62} width={h.w} height={h.h * 0.62} fill={h.wall} />
      <path d={`M${L - 30} ${GY - h.h * 0.6}L${h.x} ${GY - h.h}L${L + h.w + 30} ${GY - h.h * 0.6}Z`} fill={roofC} />
      <rect x={h.x + h.w * 0.18} y={GY - h.h * 1.02} width={h.w * 0.12} height={h.h * 0.22} fill="#8c5a44" />
      <rect x={L + h.w * 0.14} y={GY - h.h * 0.45} width={h.w * 0.22} height={h.h * 0.2} fill="#9fd0f0" stroke="#ffffff" strokeWidth={10} />
      <rect x={L + h.w * 0.6} y={GY - h.h * 0.4} width={h.w * 0.2} height={h.h * 0.4} fill="#7a5235" />
    </g>
  );
};

const Flower: React.FC<{x: number; c: number; s: number; grow: number}> = ({x, c, s, grow}) => {
  if (grow <= 0) return null;
  const k = s * grow;
  const top = GY - 30 * k;
  return (
    <g>
      <path d={`M${x} ${GY}Q${x - 4 * k} ${GY - 15 * k} ${x} ${top}`} stroke="#3f8f35" strokeWidth={3.5 * k} fill="none" />
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * 7 * k} cy={top + Math.sin((a * Math.PI) / 180) * 7 * k} r={5.5 * k} fill={PETALS[c]} />
      ))}
      <circle cx={x} cy={top} r={4.5 * k} fill={c === 1 ? '#ff9a3d' : '#ffd23f'} />
    </g>
  );
};

// ---------- the snowman ----------

const Snowman: React.FC<{Hw: number; t: number; mood: number; puddle: number; hitAge: number}> = ({Hw, t, mood, puddle, hitAge}) => {
  const [b1, b2, b3] = balls(Hw);
  const u = Hw / 400; // 1 at 100 %
  const blink = t % 3.7 < 0.13;
  const wave = Math.sin(t * 2.2) * 6 + (mood > 0.3 ? Math.sin(t * 9) * 10 * mood : 0);
  const sad = clamp(-mood);
  const glad = clamp(mood);
  const flinch = hitAge < 0.25 ? 1 - hitAge / 0.25 : 0;
  const arm = (side: number) => {
    const ax = b2.x + side * b2.r * 0.9;
    const ay = b2.y - b2.r * 0.15;
    const ang = ((side > 0 ? -28 : -152) + side * (wave - flinch * 14 - sad * 25)) * (Math.PI / 180);
    const len = Hw * 0.3;
    const ex = ax + Math.cos(ang) * len;
    const ey = ay + Math.sin(ang) * len;
    const mx = ax + Math.cos(ang) * len * 0.6;
    const my = ay + Math.sin(ang) * len * 0.6;
    const twig = ang - side * 0.6;
    return (
      <g stroke="#6b4a2b" strokeWidth={Hw * 0.018} strokeLinecap="round" fill="none">
        <path d={`M${ax} ${ay}L${ex} ${ey}`} />
        <path d={`M${mx} ${my}l${Math.cos(twig) * len * 0.28} ${Math.sin(twig) * len * 0.28}`} />
        <path d={`M${ex} ${ey}l${Math.cos(ang + side * 0.5) * len * 0.16} ${Math.sin(ang + side * 0.5) * len * 0.16}`} />
      </g>
    );
  };
  const mouth = [0, 1, 2, 3, 4].map((i) => {
    const k = (i - 2) / 2;
    return {x: b3.x + k * b3.r * 0.42, y: b3.y + b3.r * 0.42 + (glad - sad) * b3.r * 0.13 * (1 - k * k) - (glad - sad) * b3.r * 0.02};
  });
  return (
    <g>
      {puddle > 0.01 ? <ellipse cx={CX} cy={GY + 4 * u} rx={b1.r * (1.15 + 1.5 * puddle)} ry={b1.r * (0.16 + 0.12 * puddle)} fill="#8fcbf0" opacity={0.85} /> : null}
      <ellipse cx={CX} cy={GY + 2 * u} rx={b1.r * 1.05} ry={b1.r * 0.13} fill="#000" opacity={0.12} />
      {arm(-1)}
      {arm(1)}
      <circle cx={b1.x} cy={b1.y} r={b1.r} fill="url(#ball)" />
      <circle cx={b2.x} cy={b2.y} r={b2.r} fill="url(#ball)" />
      {[-0.42, 0, 0.42].map((k, i) => (
        <circle key={i} cx={b2.x + b2.r * 0.04} cy={b2.y + k * b2.r} r={b2.r * 0.075} fill="#26262b" />
      ))}
      <circle cx={b1.x + b1.r * 0.03} cy={b1.y - b1.r * 0.35} r={b1.r * 0.06} fill="#26262b" />
      {/* scarf */}
      <path d={`M${b3.x - b3.r * 1.02} ${b3.y + b3.r * 0.72}Q${b3.x} ${b3.y + b3.r * 1.12} ${b3.x + b3.r * 1.02} ${b3.y + b3.r * 0.72}L${b3.x + b3.r * 0.98} ${b3.y + b3.r * 1.05}Q${b3.x} ${b3.y + b3.r * 1.42} ${b3.x - b3.r * 0.98} ${b3.y + b3.r * 1.05}Z`} fill="#e0413b" />
      <path d={`M${b3.x + b3.r * 0.45} ${b3.y + b3.r * 1.05}l${b3.r * (0.12 + Math.sin(t * 2.4) * 0.05)} ${b3.r * 0.85}l${b3.r * 0.36} ${-b3.r * 0.06}l${-b3.r * 0.12} ${-b3.r * 0.86}Z`} fill="#c8322d" />
      <circle cx={b3.x} cy={b3.y} r={b3.r} fill="url(#ball)" />
      {/* eyes and brows */}
      {[-1, 1].map((s) => (
        <g key={s}>
          {blink ? (
            <path d={`M${b3.x + s * b3.r * 0.36 - b3.r * 0.1} ${b3.y - b3.r * 0.16}h${b3.r * 0.2}`} stroke="#26262b" strokeWidth={b3.r * 0.05} strokeLinecap="round" />
          ) : (
            <ellipse cx={b3.x + s * b3.r * 0.36} cy={b3.y - b3.r * 0.16} rx={b3.r * 0.1} ry={b3.r * (0.12 + flinch * 0.03)} fill="#26262b" />
          )}
          {!blink ? <circle cx={b3.x + s * b3.r * 0.36 + b3.r * 0.03} cy={b3.y - b3.r * 0.2} r={b3.r * 0.03} fill="#fff" /> : null}
          <path
            d={`M${b3.x + s * b3.r * 0.22} ${b3.y - b3.r * (0.38 + sad * 0.1)}L${b3.x + s * b3.r * 0.5} ${b3.y - b3.r * (0.38 - sad * 0.06 + glad * 0.06)}`}
            stroke="#26262b"
            strokeWidth={b3.r * 0.05}
            strokeLinecap="round"
            opacity={Math.max(sad, glad * 0.6, flinch)}
          />
        </g>
      ))}
      {mouth.map((m, i) => (
        <circle key={i} cx={m.x} cy={m.y} r={b3.r * 0.05} fill="#26262b" />
      ))}
      {/* carrot */}
      <path d={`M${b3.x - b3.r * 0.02} ${b3.y - b3.r * 0.06}L${b3.x + b3.r * 0.82} ${b3.y + b3.r * 0.16}L${b3.x - b3.r * 0.02} ${b3.y + b3.r * 0.2}Z`} fill="#ff8a1f" />
      <path d={`M${b3.x + b3.r * 0.25} ${b3.y + b3.r * 0.02}l${b3.r * 0.04} ${b3.r * 0.1}M${b3.x + b3.r * 0.48} ${b3.y + b3.r * 0.08}l${b3.r * 0.03} ${b3.r * 0.08}`} stroke="#d9671a" strokeWidth={b3.r * 0.03} />
      {/* hat */}
      <g transform={`rotate(-9 ${b3.x} ${b3.y})`}>
        <ellipse cx={b3.x} cy={b3.y - b3.r * 0.8} rx={b3.r * 0.82} ry={b3.r * 0.15} fill="#26262b" />
        <rect x={b3.x - b3.r * 0.52} y={b3.y - b3.r * 1.62} width={b3.r * 1.04} height={b3.r * 0.84} rx={b3.r * 0.06} fill="#26262b" />
        <rect x={b3.x - b3.r * 0.52} y={b3.y - b3.r * 1.02} width={b3.r * 1.04} height={b3.r * 0.16} fill="#e0413b" />
      </g>
      {/* melting drips */}
      {puddle > 0.05
        ? [0, 1, 2].map((i) => {
            const ph = (t * 0.45 + i / 3) % 1;
            const a = -0.9 + i * 0.85;
            const sx = b1.x + Math.sin(a) * b1.r * 0.92;
            const sy = b1.y - Math.cos(a) * b1.r * 0.4 + ph * b1.r * 0.9;
            return <ellipse key={i} cx={sx} cy={sy} rx={b1.r * 0.035} ry={b1.r * 0.06} fill="#7cc2ee" opacity={(1 - ph) * puddle * 1.4} />;
          })
        : null}
    </g>
  );
};

// ---------- screen-fixed pieces ----------

const Snowflake: React.FC<{x: number; y: number; rot: number; s: number; o: number}> = ({x, y, rot, s, o}) => (
  <g transform={`translate(${x} ${y}) rotate(${(rot * 180) / Math.PI}) scale(${s})`} opacity={o}>
    <circle r={30} fill="url(#flakeGlow)" />
    {[0, 60, 120].map((a) => (
      <path key={a} transform={`rotate(${a})`} d="M0 -22V22M0 -14l-7 -7M0 -14l7 -7M0 14l-7 7M0 14l7 7" stroke="#ffffff" strokeWidth={4.2} strokeLinecap="round" fill="none" />
    ))}
    <circle r={8.5} fill="#ffffff" />
    <g transform={`rotate(${(-rot * 180) / Math.PI})`}>
      <circle cx={-3} cy={-1} r={1.7} fill="#27324a" />
      <circle cx={3} cy={-1} r={1.7} fill="#27324a" />
      <path d="M-2.6 2.6Q0 4.6 2.6 2.6" stroke="#27324a" strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </g>
  </g>
);

const SunShape: React.FC<{t: number; worry: number; frost: number; puff: number}> = ({t, worry, frost, puff}) => {
  const r = SUN.r * (1 + 0.06 * puff);
  const body = mixC('#ffd84a', '#dfe9f2', frost * 0.85);
  const rim = mixC('#ffae2e', '#b9c9da', frost * 0.85);
  return (
    <g transform={`translate(${SUN.x} ${SUN.y})`}>
      <circle r={r * 2.3} fill="url(#sunGlow)" opacity={1 - frost * 0.8} />
      <g transform={`rotate(${t * 9})`}>
        {Array.from({length: 12}, (_, i) => {
          const L = r * (1.45 + 0.1 * Math.sin(t * 3 + i * 1.7)) * (1 - frost * 0.35);
          return <path key={i} transform={`rotate(${i * 30})`} d={`M${-r * 0.16} ${-r * 1.08}L0 ${-L}L${r * 0.16} ${-r * 1.08}Z`} fill={rim} />;
        })}
      </g>
      <circle r={r} fill={body} stroke={rim} strokeWidth={6} />
      {[-1, 1].map((s) => (
        <g key={s}>
          <ellipse cx={s * r * 0.33} cy={-r * 0.12} rx={r * 0.09} ry={r * (0.13 + worry * 0.03)} fill="#5a3410" />
          <path d={`M${s * r * 0.18} ${-r * (0.36 + worry * 0.08)}L${s * r * 0.48} ${-r * (0.36 - worry * 0.06)}`} stroke="#5a3410" strokeWidth={5} strokeLinecap="round" opacity={worry} />
          <circle cx={s * r * 0.55} cy={r * 0.18} r={r * 0.12} fill="#ff8a6a" opacity={0.55 * (1 - frost)} />
        </g>
      ))}
      <path d={`M${-r * 0.3} ${r * 0.3}Q0 ${r * (0.3 + 0.28 * (1 - 2 * worry))} ${r * 0.3} ${r * 0.3}`} stroke="#5a3410" strokeWidth={6} fill="none" strokeLinecap="round" />
      {frost > 0.05 ? <path d={`M${-r * 0.9} ${-r * 0.45}Q0 ${-r * 1.35} ${r * 0.9} ${-r * 0.45}Q0 ${-r * 0.8} ${-r * 0.9} ${-r * 0.45}Z`} fill="#fbfdff" opacity={frost} /> : null}
    </g>
  );
};

// after infinity: the whole planet is now one snowman, seen from space
const STARS = Array.from({length: 140}, (_, k) => ({x: hash(k + 400) * W, y: hash(k + 900) * H, r: 0.8 + hash(k + 1300) * 2.2, p: hash(k + 1700) * 6}));
const PlanetEnd: React.FC<{a: number}> = ({a}) => {
  const o = clamp((a - 0.2) / 0.7);
  const k = 1.25 - 0.25 * clamp(a / 4) ** 0.6;
  const R = 300;
  const cx = W / 2;
  const cy = 1140;
  return (
    <g opacity={o}>
      <rect width={W} height={H} fill="#060914" />
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#ffffff" opacity={0.35 + 0.35 * Math.sin(a * 2 + s.p)} />
      ))}
      <g transform={`translate(${cx} ${cy}) scale(${k})`}>
        <circle r={R * 1.1} fill="#9fd4ff" opacity={0.1} />
        <circle r={R} fill="url(#ball)" />
        {[-1, 1].map((sd) => (
          <g key={sd}>
            <ellipse cx={sd * R * 0.3} cy={-R * 0.12} rx={R * 0.08} ry={R * 0.1} fill="#26262b" />
            <circle cx={sd * R * 0.3 + R * 0.025} cy={-R * 0.15} r={R * 0.025} fill="#fff" />
          </g>
        ))}
        <path d={`M${-R * 0.02} ${R * 0.0}L${R * 0.62} ${R * 0.13}L${-R * 0.02} ${R * 0.14}Z`} fill="#ff8a1f" />
        {[0, 1, 2, 3, 4].map((i) => {
          const q = (i - 2) / 2;
          return <circle key={i} cx={q * R * 0.32} cy={R * 0.36 + R * 0.09 * (1 - q * q)} r={R * 0.035} fill="#26262b" />;
        })}
        <g transform="rotate(-12)">
          <ellipse cx={0} cy={-R * 0.9} rx={R * 0.6} ry={R * 0.1} fill="#26262b" />
          <rect x={-R * 0.38} y={-R * 1.48} width={R * 0.76} height={R * 0.6} rx={R * 0.05} fill="#26262b" />
          <rect x={-R * 0.38} y={-R * 1.04} width={R * 0.76} height={R * 0.12} fill="#e0413b" />
        </g>
      </g>
      {/* the sun, far away and frozen */}
      <g transform={`translate(${170} ${760}) scale(0.45)`}>
        <circle r={SUN.r} fill="#dfe9f2" stroke="#b9c9da" strokeWidth={6} />
        <path d={`M${-SUN.r * 0.9} ${-SUN.r * 0.45}Q0 ${-SUN.r * 1.35} ${SUN.r * 0.9} ${-SUN.r * 0.45}Q0 ${-SUN.r * 0.8} ${-SUN.r * 0.9} ${-SUN.r * 0.45}Z`} fill="#fbfdff" />
        {[-1, 1].map((sd) => (
          <ellipse key={sd} cx={sd * SUN.r * 0.33} cy={-SUN.r * 0.08} rx={SUN.r * 0.09} ry={SUN.r * 0.13} fill="#5a3410" />
        ))}
        <path d={`M${-SUN.r * 0.3} ${SUN.r * 0.42}Q0 ${SUN.r * 0.2} ${SUN.r * 0.3} ${SUN.r * 0.42}`} stroke="#5a3410" strokeWidth={6} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
};

const fmt = (v: number) => {
  if (v >= INF_VALUE) return '∞%';
  const s = String(Math.round(v));
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + '%';
};

const outline = {paintOrder: 'stroke' as const, stroke: '#1c2840', strokeLinejoin: 'round' as const};

export const RuleText: React.FC<{v: number; pop: number; o?: number}> = ({v, pop, o = 1}) => {
  const lines = ['Каждый луч солнца растапливает', 'снеговика на 10%.', 'Каждая снежинка растит его на 50%', 'и зовёт ещё 2.'];
  const warm = v < 100;
  return (
    <g opacity={o} fontFamily="Inter" textAnchor="middle">
      {lines.map((l, i) => (
        <text key={i} x={W / 2} y={232 + i * 50} fontSize={40} fontWeight={700} fill="#ffffff" style={{...outline, strokeWidth: 9}}>
          {l}
        </text>
      ))}
      <g transform={`translate(${W / 2} 500) scale(${1 + 0.14 * pop})`}>
        <text x={0} y={0} fontSize={v >= INF_VALUE ? 150 : Math.min(112, 1480 / Math.max(1, fmt(v).length))} fontWeight={800} fill={warm ? '#ff9b45' : '#dff4ff'} style={{...outline, strokeWidth: 14, fontVariantNumeric: 'tabular-nums'}}>
          {v >= INF_VALUE ? (
            <>
              <tspan fontSize={230} dy={18}>
                ∞
              </tspan>
              <tspan dy={-18}>%</tspan>
            </>
          ) : (
            fmt(v)
          )}
        </text>
      </g>
      <text x={W / 2} y={548} fontSize={36} fontWeight={800} letterSpacing={3} fill="#ffffff" style={{...outline, strokeWidth: 8}}>
        СНЕГОВИК
      </text>
    </g>
  );
};

// ---------- the frame ----------

export const SnowScene: React.FC<{i: number; showText?: boolean}> = ({i, showText = true}) => {
  const f = frameAt(i);
  const t = i / FPS;
  const {Z, Hw} = geom(f.Sd);
  const w = winterAt(f.Sd);
  const back = frameAt(i - FPS);
  const trend = Math.log(f.Sd) - Math.log(back.Sd);
  const mood = clamp(trend * 3, -1, 1);
  const puddle = clamp((1 - MIN_SD[Math.min(i, MIN_SD.length - 1)]) * 1.3) * (1 - clamp(w * 3));
  const hitAge = t - lastEvent(['hit'], t);
  const shotAge = t - Math.max(...SIM.frames[Math.max(0, i)].beams.map((b) => b.born), -9);

  const R = Hw * (0.62 + 3.4 * w); // snow patch half-width
  const snowAt = (x: number) => clamp((R - Math.abs(x - CX)) / (0.18 * R + 150));
  const th = Hw * 0.035; // patch thickness above the ground line

  const skyTop = mixC('#4fa6ec', '#97a6ba', w);
  const skyBot = mixC('#c9ecff', '#eef2f6', w);
  const ground = mixC('#6cba4c', '#e9f0f7', clamp(w * 1.7 - 0.1));
  const groundDeep = mixC('#4a9436', '#cdd9e6', clamp(w * 1.7 - 0.1));
  const backdrop = clamp(2 - Z); // the painted far hills fade as the camera pulls back

  // decorative blizzard once winter takes over
  const blizzard = Math.floor(320 * Math.pow(w, 1.6));
  const flakesBg = [] as React.ReactNode[];
  for (let k = 0; k < blizzard; k++) {
    const sp = 120 + hash(k) * 220;
    const x = (((hash(k + 11) * 1300 + t * (70 + w * 260) + Math.sin(t + k) * 20) % 1300) + 1300) % 1300 - 110;
    const y = (hash(k + 23) * 2100 + t * sp) % 2100 - 90;
    flakesBg.push(<circle key={k} cx={x} cy={y} r={2 + hash(k + 5) * 4} fill="#ffffff" opacity={0.75} />);
  }

  const cloudC = mixC('#ffffff', '#c9d2de', w);
  const clouds = [0, 1, 2, 3].map((k) => {
    const x = ((hash(k + 70) * 1500 + t * (12 + k * 5)) % 1500) - 210;
    const y = 120 + k * 150 + hash(k) * 60;
    const s = 0.8 + hash(k + 3) * 0.6;
    return (
      <g key={k} transform={`translate(${x} ${y}) scale(${s})`} opacity={0.92}>
        <ellipse cx={0} cy={0} rx={130} ry={42} fill={cloudC} />
        <circle cx={-40} cy={-22} r={48} fill={cloudC} />
        <circle cx={30} cy={-34} r={58} fill={cloudC} />
      </g>
    );
  });

  // effects from events
  const hits = recent('hit', t, 0.9);
  const grows = recent('grow', t, 0.9);
  const kills = recent('kill', t, 0.8);
  const labels = [...hits.map((e) => ({...e, txt: '−10%', c: '#ff8a3d'})), ...grows.map((e) => ({...e, txt: '+50%', c: '#8fe0ff'}))]
    .sort((a, b) => b.t - a.t)
    .slice(0, 6);

  const worry = clamp(trend * 2.5);
  const lastChange = lastEvent(['hit', 'grow'], t);
  const pop = Math.exp(-(t - lastChange) * 7);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyTop} />
          <stop offset="1" stopColor={skyBot} />
        </linearGradient>
        <radialGradient id="ball" cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#f3f8fd" />
          <stop offset="1" stopColor="#c4d8ec" />
        </radialGradient>
        <radialGradient id="sunGlow">
          <stop offset="0" stopColor="#fff3b0" stopOpacity={0.9} />
          <stop offset="0.45" stopColor="#ffe27a" stopOpacity={0.35} />
          <stop offset="1" stopColor="#ffe27a" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="flakeGlow">
          <stop offset="0" stopColor="#bfe9ff" stopOpacity={0.9} />
          <stop offset="1" stopColor="#bfe9ff" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff2a8" stopOpacity={0} />
          <stop offset="1" stopColor="#fff7d1" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="dirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ground} />
          <stop offset="0.25" stopColor={groundDeep} />
          <stop offset="1" stopColor={groundDeep} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#sky)" />
      {clouds}
      <SunShape t={t} worry={worry} frost={clamp(w * 1.4 - 0.3)} puff={Math.exp(-shotAge * 10)} />
      {backdrop > 0 ? (
        <g opacity={backdrop}>
          <path d={`M-40 ${GY}Q160 ${GY - 210} 380 ${GY - 120}Q560 ${GY - 40} 760 ${GY - 170}Q930 ${GY - 260} 1120 ${GY - 110}L1120 ${GY}Z`} fill={mixC('#a6d98c', '#dfe7ef', w)} />
          <path d={`M-40 ${GY}Q260 ${GY - 120} 520 ${GY - 60}Q800 ${GY - 10} 1120 ${GY - 90}L1120 ${GY}Z`} fill={mixC('#8ccc70', '#e3eaf2', w)} />
        </g>
      ) : null}

      {/* the world, which the camera pulls back from */}
      <g transform={`translate(${CX} ${GY}) scale(${1 / Z}) translate(${-CX} ${-GY})`}>
        {MOUNTAINS.map((m, k) => (
          <g key={k}>
            <path d={`M${m.x - m.hw} ${GY}L${m.x} ${GY - m.h}L${m.x + m.hw} ${GY}Z`} fill={k < 2 ? '#a9b8cc' : '#8ea2bb'} />
            <path d={`M${m.x - m.hw * 0.3} ${GY - m.h * 0.7}L${m.x} ${GY - m.h}L${m.x + m.hw * 0.3} ${GY - m.h * 0.7}L${m.x + m.hw * 0.12} ${GY - m.h * 0.64}L${m.x} ${GY - m.h * 0.72}L${m.x - m.hw * 0.14} ${GY - m.h * 0.63}Z`} fill="#f7fafd" />
            <path d={`M${m.x - m.hw} ${GY}L${m.x} ${GY - m.h}L${m.x + m.hw} ${GY}Z`} fill="#f4f8fc" opacity={snowAt(m.x) * 0.85} />
          </g>
        ))}
        {HILLS.map((h, k) => (
          <g key={k}>
            <ellipse cx={h.x} cy={GY} rx={h.rx} ry={h.ry} fill={h.c} />
            <ellipse cx={h.x} cy={GY} rx={h.rx} ry={h.ry} fill="#f2f6fa" opacity={snowAt(h.x)} />
          </g>
        ))}
        {HOUSES.map((h, k) => (
          <HouseShape key={k} h={h} snow={snowAt(h.x)} time={t} />
        ))}
        {TREES.map((tr, k) => (
          <TreeShape key={k} t={tr} snow={snowAt(tr.x)} time={t} />
        ))}
        <rect x={-2e6} y={GY} width={4e6} height={2e6} fill="url(#dirt)" />
        <path d={GRASS} fill={mixC('#5aa83e', '#d5e0ea', clamp(w * 1.2 - 0.1))} />
        {MEADOW.map((m, k) => (
          <Flower key={k} x={m.x} c={m.c} s={m.s} grow={1 - snowAt(m.x)} />
        ))}
        {SIM.flowers.map((fl, k) => (fl.t <= t ? <Flower key={`b${k}`} x={fl.x} c={fl.c} s={1} grow={clamp((t - fl.t) / 0.35) * (1 - snowAt(fl.x))} /> : null))}
        {/* the snow the snowman stands on, spreading as he grows */}
        <path
          d={`M${CX - R} ${GY + 3}Q${CX - R * 0.92} ${GY - th} ${CX - R * 0.6} ${GY - th}L${CX + R * 0.6} ${GY - th}Q${CX + R * 0.92} ${GY - th} ${CX + R} ${GY + 3}Q${CX + R * 0.8} ${GY + th * 0.9} ${CX + R * 0.5} ${GY + th}L${CX - R * 0.5} ${GY + th}Q${CX - R * 0.8} ${GY + th * 0.9} ${CX - R} ${GY + 3}Z`}
          fill="#f3f7fb"
        />
        <Snowman Hw={Hw} t={t} mood={mood} puddle={puddle} hitAge={hitAge} />
      </g>

      {/* beams */}
      {f.beams.map((b) => {
        const dx = b.tx - b.x0;
        const dy = b.ty - b.y0;
        const L = Math.hypot(dx, dy) || 1;
        const ux = dx / L;
        const uy = dy / L;
        const run = Math.hypot(b.hx - b.x0, b.hy - b.y0);
        const since = b.end >= 0 ? t - b.end : 0;
        const len = Math.min(run, 420) * (1 - clamp(since / 0.3));
        const tx = b.hx - ux * len;
        const ty = b.hy - uy * len;
        const o = 1 - clamp(since / 0.35);
        return (
          <g key={b.id} opacity={o} strokeLinecap="round">
            <path d={`M${tx} ${ty}L${b.hx} ${b.hy}`} stroke="#ffd65a" strokeWidth={22} opacity={0.25} />
            <path d={`M${tx} ${ty}L${b.hx} ${b.hy}`} stroke="#fff3b8" strokeWidth={8} />
            <circle cx={b.hx} cy={b.hy} r={9 + since * 40} fill="#fffbe0" opacity={0.9} />
          </g>
        );
      })}

      {/* steam where beams hit */}
      {hits.map((e) => {
        const a = (t - e.t) / 0.9;
        return (
          <g key={`h${e.id}`} opacity={0.75 * (1 - a)}>
            {[0, 1, 2].map((k) => (
              <circle key={k} cx={e.x + (k - 1) * 18 + Math.sin(a * 6 + k) * 6} cy={e.y - a * (60 + k * 25)} r={10 + a * 26 - k * 3} fill="#ffffff" />
            ))}
          </g>
        );
      })}
      {/* flakes melted in the air turn into falling drops */}
      {kills.map((e) => {
        const a = t - e.t;
        return (
          <g key={`k${e.id}`} opacity={1 - clamp(a / 0.8)}>
            <circle cx={e.x} cy={e.y - a * 50} r={14 + a * 40} fill="#ffffff" opacity={0.5} />
            <path d={`M${e.x} ${e.y + 520 * a * a - 16}q-14 20 0 30q14 -10 0 -30Z`} fill="#6fbff0" />
          </g>
        );
      })}
      {/* sparkles where flakes land */}
      {grows.map((e) => {
        const a = (t - e.t) / 0.6;
        if (a > 1) return null;
        return (
          <g key={`g${e.id}`} opacity={1 - a} stroke="#e9f8ff" strokeWidth={4} strokeLinecap="round">
            {[0, 1, 2, 3, 4, 5].map((k) => {
              const ang = (k / 6) * Math.PI * 2 + 0.3;
              const r0 = 12 + a * 40;
              const r1 = 24 + a * 60;
              return <path key={k} d={`M${e.x + Math.cos(ang) * r0} ${e.y + Math.sin(ang) * r0}L${e.x + Math.cos(ang) * r1} ${e.y + Math.sin(ang) * r1}`} />;
            })}
          </g>
        );
      })}

      {f.flakes.map((fl) => (
        <Snowflake key={fl.id} x={fl.x} y={fl.y} rot={fl.rot} s={1.25 * Math.pow(Math.min(Z, 8), -0.12)} o={clamp((t - fl.born) / 0.4)} />
      ))}

      {flakesBg}

      {labels.map((e) => {
        const a = (t - e.t) / 0.9;
        return (
          <text key={`l${e.id}`} x={clamp(e.x, 90, W - 90)} y={e.y - 40 - a * 70} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={38} fill={e.c} opacity={1 - clamp((a - 0.6) / 0.4)} style={{...outline, strokeWidth: 8}}>
            {e.txt}
          </text>
        );
      })}

      {t > INF_T + 0.2 ? <PlanetEnd a={t - INF_T} /> : null}
      {showText ? <RuleText v={f.Sd * 100} pop={t > INF_T ? Math.exp(-(t - INF_T) * 5) : pop} /> : null}
      {showText && t > INF_T + 1.6 ? (
        <text x={W / 2} y={1700} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={50} fill="#ffffff" opacity={clamp((t - INF_T - 1.6) / 0.4)} style={{...outline, strokeWidth: 10}}>
          Кого запустить следующим?
        </text>
      ) : null}
    </svg>
  );
};
