import {useEffect, useMemo, useState} from 'react';
import * as THREE from 'three';
import {continueRender, delayRender} from 'remotion';
import '@fontsource/oswald/500.css';
import '@fontsource/oswald/600.css';

export const COND = "'Oswald', 'Arial Narrow', sans-serif";

const fontsLoaded = () => {
  try {
    return document.fonts.check("600 40px 'Oswald'") && document.fonts.check("500 40px 'Oswald'");
  } catch {
    return false;
  }
};

// canvas text needs the font before it is drawn: hold the frame until Oswald is in
export const useFonts = () => {
  const [ready, setReady] = useState(fontsLoaded);
  useEffect(() => {
    if (ready) return;
    const h = delayRender('Oswald for canvas textures');
    Promise.all([document.fonts.load("600 40px 'Oswald'"), document.fonts.load("500 40px 'Oswald'")])
      .then(() => setReady(true))
      .finally(() => continueRender(h));
  }, [ready]);
  return ready;
};

// a canvas texture redrawn whenever the key changes
export const useCanvas = (w: number, h: number, key: string, draw: (g: CanvasRenderingContext2D) => void) => {
  const ready = useFonts();
  const {canvas, tex} = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return {canvas: c, tex: t};
  }, [w, h]);
  useMemo(() => {
    const g = canvas.getContext('2d')!;
    g.clearRect(0, 0, w, h);
    draw(g);
    tex.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready, canvas]);
  return tex;
};

export const roundRect = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
};

// ---------- the billboard: «GTA VI» and the date, the worker rolls over 2026 and paints 2027 ----------

export const drawBillboard = (g: CanvasRenderingContext2D, W: number, H: number, cover: number, paint: number, year: string, dead = 0, base = '2026') => {
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#2a0f3d');
  bg.addColorStop(0.55, '#5a1650');
  bg.addColorStop(1, '#c2365a');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // sunset stripes behind the logo
  for (let i = 0; i < 6; i++) {
    g.fillStyle = `rgba(255, ${150 + i * 14}, ${80 + i * 10}, ${0.18 - i * 0.02})`;
    g.fillRect(0, H * (0.12 + i * 0.075), W, H * 0.04);
  }
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  // «GTA VI» in a warm gradient
  const lg = g.createLinearGradient(0, H * 0.1, 0, H * 0.62);
  lg.addColorStop(0, '#ffd27a');
  lg.addColorStop(0.5, '#ff7a59');
  lg.addColorStop(1, '#ff3d8b');
  g.fillStyle = lg;
  g.font = `600 ${Math.round(H * 0.5)}px ${COND}`;
  g.save();
  g.translate(W / 2, H * 0.6);
  g.transform(1, 0, -0.12, 1, 0, 0);
  g.fillText('GTA VI', 0, 0);
  g.restore();
  // the date
  g.font = `600 ${Math.round(H * 0.2)}px ${COND}`;
  const dayW = g.measureText('19.11.').width;
  const yearW = g.measureText(base).width;
  const x0 = W / 2 - (dayW + yearW) / 2;
  const baseY = H * 0.87;
  g.textAlign = 'left';
  g.fillStyle = '#ffffff';
  g.fillText('19.11.', x0, baseY);
  const yx = x0 + dayW;
  if (base === '2026') g.fillText(base, yx, baseY);
  else {
    // an earlier repaint: yellow, a little crooked, on the painted-over patch
    g.fillStyle = '#7d1f55';
    g.fillRect(yx - 8, baseY - H * 0.19, yearW + 16, H * 0.24);
    g.save();
    g.translate(yx, baseY);
    g.rotate(-0.04);
    g.fillStyle = '#ffe14a';
    g.fillText(base, 4, 2);
    g.restore();
  }
  // the roller paints over the old year with the background colour
  if (cover > 0) {
    g.fillStyle = '#7d1f55';
    const top = baseY - H * 0.19;
    g.fillRect(yx - 8, top, (yearW + 16) * cover, H * 0.24);
  }
  // the new year, painted by hand, a little crooked and yellow
  if (paint > 0) {
    g.save();
    g.beginPath();
    g.rect(yx - 10, baseY - H * 0.25, (yearW + 30) * paint, H * 0.32);
    g.clip();
    g.translate(yx, baseY);
    g.rotate(-0.04);
    g.fillStyle = '#ffe14a';
    g.fillText(year, 4, 2);
    g.restore();
  }
  // a dead (unlit, dusty) billboard in the ruins
  if (dead > 0) {
    g.fillStyle = `rgba(120, 112, 100, ${0.55 * dead})`;
    g.fillRect(0, 0, W, H);
  }
};

// ---------- the TV / console screen ----------

export const drawLoading = (g: CanvasRenderingContext2D, W: number, H: number, pct: number, play: number, pulse: number) => {
  g.fillStyle = '#0b0a14';
  g.fillRect(0, 0, W, H);
  if (play > 0) {
    // the title screen
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#2a0f3d');
    bg.addColorStop(1, '#c2365a');
    g.globalAlpha = play;
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    g.textAlign = 'center';
    g.fillStyle = '#ffb36b';
    g.font = `600 ${Math.round(H * 0.3)}px ${COND}`;
    g.fillText('GTA VI', W / 2, H * 0.48);
    const bw = W * 0.42;
    const bh = H * 0.17;
    roundRect(g, W / 2 - bw / 2, H * 0.62, bw, bh, bh / 2);
    g.fillStyle = `rgba(255, 255, 255, ${0.85 + 0.15 * pulse})`;
    g.fill();
    g.fillStyle = '#2a0f3d';
    g.font = `600 ${Math.round(bh * 0.62)}px ${COND}`;
    g.fillText('ИГРАТЬ', W / 2, H * 0.62 + bh * 0.74);
    g.globalAlpha = 1;
    return;
  }
  g.textAlign = 'center';
  g.fillStyle = '#ffffff';
  g.font = `500 ${Math.round(H * 0.1)}px ${COND}`;
  g.fillText('УСТАНОВКА GTA VI', W / 2, H * 0.36);
  const bw = W * 0.7;
  const bh = H * 0.08;
  const x = (W - bw) / 2;
  const y = H * 0.48;
  g.fillStyle = '#2b2a3a';
  g.fillRect(x, y, bw, bh);
  g.fillStyle = '#ff6a7a';
  g.fillRect(x, y, bw * pct / 100, bh);
  g.fillStyle = '#ffffff';
  g.font = `600 ${Math.round(H * 0.12)}px ${COND}`;
  g.fillText(`${Math.floor(pct)}%`, W / 2, H * 0.78);
};

// ---------- the phone in the ash ----------

export const drawPhone = (g: CanvasRenderingContext2D, W: number, H: number, on: number, note: number, battery: boolean) => {
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  if (on <= 0) return;
  g.globalAlpha = on;
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1b2a4a');
  bg.addColorStop(1, '#4a2140');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.textAlign = 'center';
  g.fillStyle = '#ffffff';
  g.font = `500 ${Math.round(W * 0.075)}px ${COND}`;
  g.fillText('пятница, 19 ноября', W / 2, H * 0.17);
  g.font = `600 ${Math.round(W * 0.28)}px ${COND}`;
  g.fillText('00:01', W / 2, H * 0.33);
  // battery, top right
  g.font = `500 ${Math.round(W * 0.05)}px ${COND}`;
  g.textAlign = 'right';
  g.fillStyle = battery ? '#ff3b30' : '#ffffff';
  g.fillText('1%', W * 0.8, H * 0.045);
  g.strokeStyle = battery ? '#ff3b30' : '#ffffff';
  g.lineWidth = 3;
  g.strokeRect(W * 0.82, H * 0.025, W * 0.09, H * 0.025);
  g.fillStyle = '#ff3b30';
  g.fillRect(W * 0.825, H * 0.03, W * 0.012, H * 0.015);
  // the notification card slides down
  if (note > 0) {
    const cy = H * 0.4 + (1 - note) * -H * 0.12;
    g.globalAlpha = on * Math.min(1, note * 1.5);
    roundRect(g, W * 0.05, cy, W * 0.9, H * 0.19, W * 0.06);
    g.fillStyle = 'rgba(245, 245, 248, 0.94)';
    g.fill();
    // app icon: a plain dark tile with a star
    roundRect(g, W * 0.09, cy + H * 0.025, W * 0.13, W * 0.13, W * 0.03);
    g.fillStyle = '#1a1a1a';
    g.fill();
    g.fillStyle = '#ffcc00';
    g.font = `600 ${Math.round(W * 0.1)}px ${COND}`;
    g.textAlign = 'center';
    g.fillText('★', W * 0.155, cy + H * 0.025 + W * 0.1);
    g.textAlign = 'left';
    g.fillStyle = '#111';
    g.font = `600 ${Math.round(W * 0.062)}px ${COND}`;
    g.fillText('Rockstar Games', W * 0.26, cy + H * 0.05);
    g.fillStyle = '#666';
    g.font = `500 ${Math.round(W * 0.045)}px ${COND}`;
    g.textAlign = 'right';
    g.fillText('сейчас', W * 0.9, cy + H * 0.05);
    g.textAlign = 'left';
    g.fillStyle = '#222';
    g.font = `500 ${Math.round(W * 0.06)}px ${COND}`;
    g.fillText('Релиз GTA VI перенесён', W * 0.26, cy + H * 0.1);
    g.fillText('на 2028 год', W * 0.26, cy + H * 0.145);
  }
  g.globalAlpha = 1;
  drawCracks(g, W, H);
};

// the broken glass: a spider web from a hit near the bottom left corner
export const drawCracks = (g: CanvasRenderingContext2D, W: number, H: number) => {
  const cx = W * 0.22;
  const cy = H * 0.8;
  g.strokeStyle = 'rgba(230, 235, 240, 0.55)';
  g.lineWidth = 2;
  let s = 11;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + r() * 0.4;
    let x = cx;
    let y = cy;
    g.beginPath();
    g.moveTo(x, y);
    const len = W * (0.3 + r() * 0.9);
    for (let k = 1; k <= 5; k++) {
      x = cx + Math.cos(a + (r() - 0.5) * 0.3) * len * (k / 5);
      y = cy + Math.sin(a + (r() - 0.5) * 0.3) * len * (k / 5);
      g.lineTo(x, y);
    }
    g.stroke();
  }
  for (const rad of [W * 0.06, W * 0.13]) {
    g.beginPath();
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const rr = rad * (0.85 + r() * 0.3);
      if (i === 0) g.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      else g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    g.stroke();
  }
};
