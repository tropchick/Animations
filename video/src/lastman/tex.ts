import * as THREE from 'three';

// Canvas textures (phone screens, intercom, signs, billboards), drawn once per key and cached.
const cache = new Map<string, THREE.CanvasTexture>();
export const tex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, W: number, H: number) => void) => {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
};

export const SANS = "'Inter', 'Arial', sans-serif";
export const SERIF = "'Spectral', 'Georgia', serif";
export const HERO_COL = {skin: '#efd2b3', hair: '#4a3324', beard: '#6a4a34', hoodie: '#7d8590', jeans: '#3a4a6a'};

const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
};

// the hero's blocky face, flat, filling a box (cx, cy) of size s
export const face = (g: CanvasRenderingContext2D, cx: number, cy: number, s: number, mood: 'calm' | 'shock' = 'calm') => {
  const u = s / 10;
  g.fillStyle = HERO_COL.skin;
  g.fillRect(cx - 5 * u, cy - 5 * u, 10 * u, 11 * u);
  g.fillStyle = HERO_COL.hair;
  g.fillRect(cx - 5.3 * u, cy - 6.2 * u, 10.6 * u, 2.4 * u);
  g.fillStyle = HERO_COL.beard;
  g.fillRect(cx - 5 * u, cy + 3.2 * u, 10 * u, 2.8 * u);
  g.fillRect(cx - 5 * u, cy + 0.5 * u, 1.1 * u, 3 * u);
  g.fillRect(cx + 3.9 * u, cy + 0.5 * u, 1.1 * u, 3 * u);
  g.fillStyle = '#2a2622';
  const eh = mood === 'shock' ? 1.6 * u : 1.1 * u;
  g.fillRect(cx - 3.2 * u, cy - 1.5 * u, 1.6 * u, eh);
  g.fillRect(cx + 1.6 * u, cy - 1.5 * u, 1.6 * u, eh);
  g.fillStyle = HERO_COL.hair;
  g.fillRect(cx - 3.5 * u, cy - 2.6 * u, 2.2 * u, 0.6 * u);
  g.fillRect(cx + 1.3 * u, cy - 2.6 * u, 2.2 * u, 0.6 * u);
  g.fillStyle = mood === 'shock' ? '#4a2422' : '#9a6a52';
  g.fillRect(cx - 1.5 * u, cy + 2.3 * u, 3 * u, mood === 'shock' ? 1.4 * u : 0.5 * u);
};

// ---------------------------------------------------------------- phone screens (W x H = 540 x 1080)
const statusBar = (g: CanvasRenderingContext2D, W: number, dark = true) => {
  g.fillStyle = dark ? '#ffffff' : '#111';
  g.font = `600 30px ${SANS}`;
  g.textAlign = 'left';
  g.fillText('07:12', 40, 52);
  g.textAlign = 'right';
  g.fillText('5G  84%', W - 40, 52);
};

export const drawStory = (posted: boolean) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#6e7f9a');
  grd.addColorStop(1, '#2b3346');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  // the selfie
  g.fillStyle = '#a6b0c0';
  g.fillRect(0, 140, W, 700);
  g.fillStyle = '#8c96a8';
  g.fillRect(60, 160, 140, 260);
  face(g, W / 2, 520, 300, 'shock');
  g.fillStyle = HERO_COL.hoodie;
  g.fillRect(W / 2 - 230, 720, 460, 140);
  statusBar(g, W);
  // the sticker
  g.save();
  g.translate(W / 2, 260);
  g.rotate(-0.05);
  g.fillStyle = '#ffffff';
  rr(g, -220, -50, 440, 100, 20);
  g.fill();
  g.fillStyle = '#111';
  g.font = `800 40px ${SANS}`;
  g.textAlign = 'center';
  g.fillText('я что, один остался?', 0, 14);
  g.restore();
  // the button
  g.fillStyle = posted ? '#3a3f4a' : '#ffffff';
  rr(g, 70, 900, W - 140, 110, 55);
  g.fill();
  g.fillStyle = posted ? '#ffffff' : '#111';
  g.font = `800 40px ${SANS}`;
  g.textAlign = 'center';
  g.fillText(posted ? 'Опубликовано ✓' : 'Опубликовать', W / 2, 970);
};

export const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const drawViews = (n: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#101218';
  g.fillRect(0, 0, W, H);
  statusBar(g, W);
  // the story thumbnail
  g.fillStyle = '#a6b0c0';
  rr(g, W / 2 - 110, 130, 220, 360, 20);
  g.fill();
  face(g, W / 2, 300, 120, 'shock');
  g.fillStyle = '#9aa3b5';
  g.font = `600 34px ${SANS}`;
  g.textAlign = 'center';
  g.fillText('Просмотры', W / 2, 590);
  g.fillStyle = '#ffffff';
  const s = fmt(n);
  g.font = `800 ${s.length > 9 ? 62 : 80}px ${SANS}`;
  g.fillText(s, W / 2, 690);
  // eye icon
  g.strokeStyle = '#ff3b5c';
  g.lineWidth = 8;
  g.beginPath();
  g.ellipse(W / 2, 800, 60, 32, 0, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = '#ff3b5c';
  g.beginPath();
  g.arc(W / 2, 800, 18, 0, Math.PI * 2);
  g.fill();
  // flying hearts
  for (let i = 0; i < 6; i++) {
    g.fillStyle = ['#ff3b5c', '#ff7aa0', '#ffd23f'][i % 3];
    const x = 80 + ((i * 83 + n / 37) % (W - 160));
    const y = 1040 - ((i * 151 + n / 13) % 200);
    g.beginPath();
    g.arc(x - 9, y, 11, 0, Math.PI * 2);
    g.arc(x + 9, y, 11, 0, Math.PI * 2);
    g.moveTo(x - 20, y + 4);
    g.lineTo(x, y + 26);
    g.lineTo(x + 20, y + 4);
    g.fill();
  }
};

export const drawHome = (msg: boolean) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  const grd = g.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, '#2c4a7a');
  grd.addColorStop(1, '#6a3a6a');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  statusBar(g, W);
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.font = `300 120px ${SANS}`;
  g.textAlign = 'center';
  g.fillText('07:16', W / 2, 260);
  if (!msg) return;
  g.fillStyle = 'rgba(245,245,250,0.96)';
  rr(g, 30, 330, W - 60, 230, 34);
  g.fill();
  g.fillStyle = '#ff5a7a';
  g.beginPath();
  g.arc(105, 420, 46, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.font = `800 44px ${SANS}`;
  g.fillText('Б', 105, 436);
  g.textAlign = 'left';
  g.fillStyle = '#111';
  g.font = `800 40px ${SANS}`;
  g.fillText('Бывшая', 175, 410);
  g.fillStyle = '#777';
  g.font = `500 28px ${SANS}`;
  g.textAlign = 'right';
  g.fillText('сейчас', W - 60, 408);
  g.textAlign = 'left';
  g.fillStyle = '#222';
  g.font = `500 38px ${SANS}`;
  g.fillText('привет, как ты?', 175, 470);
  g.fillText('🙂', 175, 525);
};

export const drawCall = (on: boolean) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#0d1016';
  g.fillRect(0, 0, W, H);
  statusBar(g, W);
  g.fillStyle = '#3a404c';
  g.beginPath();
  g.arc(W / 2, 330, 110, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#9aa3b5';
  g.font = `800 120px ${SANS}`;
  g.textAlign = 'center';
  g.fillText('?', W / 2, 372);
  g.fillStyle = '#fff';
  g.font = `700 50px ${SANS}`;
  g.fillText('Неизвестный', W / 2, 540);
  g.fillText('номер', W / 2, 600);
  g.fillStyle = '#9aa3b5';
  g.font = `500 32px ${SANS}`;
  g.fillText(on ? 'Вызов…' : 'мобильный', W / 2, 660);
  const btn = (x: number, col: string) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(x, 900, 70, 0, Math.PI * 2);
    g.fill();
  };
  btn(140, '#ff3b30');
  btn(W - 140, '#34c759');
  g.fillStyle = '#fff';
  g.fillRect(105, 893, 70, 14);
  g.fillRect(W - 175, 893, 70, 14);
  g.fillRect(W - 147, 865, 14, 70);
};

// ---------------------------------------------------------------- props and signs
export const drawClock = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#120808';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ff3a2a';
  g.font = `700 ${H * 0.72}px ${SANS}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('07:00', W / 2, H * 0.54);
};

export const drawRadio = (on: boolean) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = on ? '#0e2a1a' : '#0b0f0c';
  g.fillRect(0, 0, W, H);
  if (!on) return;
  g.fillStyle = '#62ff9a';
  g.font = `700 ${H * 0.5}px ${SANS}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('FM 101.2  НОВОСТИ', W / 2, H * 0.55);
};

export const drawIntercom = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#9aa8a4';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#6f7d7a';
  g.fillRect(0, H * 0.62, W, H * 0.38);
  // three agents in black suits and dark glasses, fisheye-ish
  [-1, 0, 1].forEach((k) => {
    const cx = W / 2 + k * W * 0.3;
    const s = k === 0 ? 1.25 : 0.95;
    const top = H * (k === 0 ? 0.2 : 0.28);
    g.fillStyle = '#1a1c20';
    g.fillRect(cx - 80 * s, top + 110 * s, 160 * s, 260 * s);
    g.fillStyle = '#e8e8e8';
    g.beginPath();
    g.moveTo(cx - 22 * s, top + 110 * s);
    g.lineTo(cx + 22 * s, top + 110 * s);
    g.lineTo(cx, top + 170 * s);
    g.fill();
    g.fillStyle = '#c9b4a0';
    g.fillRect(cx - 45 * s, top, 90 * s, 105 * s);
    g.fillStyle = '#16161a';
    g.fillRect(cx - 52 * s, top - 22 * s, 104 * s, 40 * s);
    g.fillRect(cx - 55 * s, top + 10 * s, 18 * s, 110 * s);
    g.fillRect(cx + 37 * s, top + 10 * s, 18 * s, 110 * s);
    g.fillRect(cx - 40 * s, top + 38 * s, 80 * s, 20 * s);
  });
  // scanlines and a vignette, it is a cheap door camera
  g.fillStyle = 'rgba(0,0,0,0.12)';
  for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 2);
  const v = g.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.75)');
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ff4040';
  g.font = `700 30px ${SANS}`;
  g.fillText('● ПОДЪЕЗД 1', 24, 42);
};

export const drawPortrait = (caption: string, bg = '#1a2a4a') => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  face(g, W / 2, H * 0.42, Math.min(W, H) * 0.52);
  g.fillStyle = HERO_COL.hoodie;
  g.fillRect(W / 2 - W * 0.32, H * 0.74, W * 0.64, H * 0.3);
  if (caption) {
    g.fillStyle = 'rgba(0,0,0,0.65)';
    g.fillRect(0, H * 0.83, W, H * 0.17);
    g.fillStyle = '#ffd23f';
    g.font = `800 ${H * 0.1}px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(caption, W / 2, H * 0.915);
  }
};

export const drawMetroSign = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#f4f4f0';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#d8302a';
  g.font = `900 ${H * 0.8}px ${SANS}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('М', H * 0.55, H * 0.55);
  g.fillStyle = '#1c2a4a';
  g.font = `700 ${H * 0.42}px ${SANS}`;
  g.textAlign = 'left';
  g.fillText('ПЛОЩАДЬ МИРА', H * 1.1, H * 0.55);
};

export const drawBoard = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#0a0a0c';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ff9a2a';
  g.font = `700 ${H * 0.6}px ${SANS}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('0:00:42', W / 2, H * 0.55);
};

export const drawShelf = (seed: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#e9e6de';
  g.fillRect(0, 0, W, H);
  const cols = ['#e85d5d', '#4a7fd0', '#f2c14e', '#6fbf73', '#b36ad1', '#ef8f4a', '#4fb6c2', '#f4f4f4', '#d23c3c', '#2a8a4a'];
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    let x = 4;
    const y0 = (r + 1) * (H / rows) - 6;
    let i = 0;
    while (x < W - 10) {
      const w = 14 + ((seed * 7 + r * 13 + i * 29) % 22);
      const h = H / rows * (0.45 + ((seed + r * 3 + i * 5) % 7) * 0.06);
      g.fillStyle = cols[(seed + r * 3 + i * 7) % cols.length];
      g.fillRect(x, y0 - h, w, h);
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.fillRect(x + 2, y0 - h * 0.7, w - 4, h * 0.18);
      x += w + 3;
      i++;
    }
    g.fillStyle = '#9a9a9a';
    g.fillRect(0, y0, W, 6);
  }
};

export const drawDna = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#06141e';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) {
    const y = 20 + i * ((H - 40) / 26);
    const a = Math.sin(i * 0.55) * W * 0.3;
    g.strokeStyle = i % 2 ? '#3ad1ff' : '#ff4a9a';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(W / 2 - a, y);
    g.lineTo(W / 2 + a, y);
    g.stroke();
    g.fillStyle = '#e8f8ff';
    g.fillRect(W / 2 - a - 4, y - 4, 8, 8);
    g.fillRect(W / 2 + a - 4, y - 4, 8, 8);
  }
  g.fillStyle = '#3ad1ff';
  g.font = `700 ${W * 0.07}px ${SANS}`;
  g.fillText('ОБРАЗЕЦ №1', 12, H - 14);
};

export const drawBillboard = (line: string, bg: string) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  face(g, W * 0.3, H * 0.48, H * 0.62);
  g.fillStyle = '#ffffff';
  g.font = `900 ${H * 0.16}px ${SANS}`;
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  const words = line.split('|');
  words.forEach((w, i) => g.fillText(w, W * 0.56, H * (0.5 - 0.1 * (words.length - 1) + 0.2 * i)));
};

export const drawWindows = (cols: number, rows: number, seed: number, lit: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#00000000';
  g.clearRect(0, 0, W, H);
  const cw = W / cols;
  const rh = H / rows;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x = Math.sin((r * 31 + c * 17 + seed) * 12.9898) * 43758.5453;
      const q = x - Math.floor(x);
      g.fillStyle = q < lit ? (q < lit * 0.4 ? '#ffd58a' : '#ffe9b8') : '#1a2236';
      g.fillRect(c * cw + cw * 0.22, r * rh + rh * 0.2, cw * 0.56, rh * 0.55);
    }
};
