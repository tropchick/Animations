import {COND, roundRect} from '../gta/tex';

// ---------- the phone: the pre-order page with the refund button ----------

export const drawRefund = (g: CanvasRenderingContext2D, W: number, H: number, pressed: number) => {
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1d1430');
  bg.addColorStop(1, '#0d0b14');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // a cover tile in the warm sunset colours (no real artwork)
  const cv = g.createLinearGradient(0, H * 0.08, 0, H * 0.45);
  cv.addColorStop(0, '#ffb36b');
  cv.addColorStop(0.5, '#ff5f7e');
  cv.addColorStop(1, '#5a1650');
  roundRect(g, W * 0.08, H * 0.08, W * 0.84, H * 0.36, W * 0.05);
  g.fillStyle = cv;
  g.fill();
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.font = `600 ${Math.round(W * 0.2)}px ${COND}`;
  g.fillText('GTA VI', W / 2, H * 0.3);
  g.font = `500 ${Math.round(W * 0.075)}px ${COND}`;
  g.fillText('ПРЕДЗАКАЗ', W / 2, H * 0.52);
  g.fillStyle = '#ff6a7a';
  g.font = `600 ${Math.round(W * 0.07)}px ${COND}`;
  g.fillText('ВЫХОД ПЕРЕНЕСЁН НА 2027', W / 2, H * 0.6);
  // the button
  const bx = W * 0.1;
  const by = H * 0.7;
  const bw = W * 0.8;
  const bh = H * 0.1;
  roundRect(g, bx, by, bw, bh, bh / 2);
  g.fillStyle = pressed > 0.5 ? '#2fbf71' : '#ff3b30';
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = `600 ${Math.round(bh * 0.5)}px ${COND}`;
  g.fillText(pressed > 0.5 ? 'ДЕНЬГИ ВОЗВРАЩЕНЫ ✓' : 'ВЕРНУТЬ ДЕНЬГИ', W / 2, by + bh * 0.68);
};

// a far phone in the crowd: just the red button glow
export const drawTinyRefund = (g: CanvasRenderingContext2D, W: number, H: number, pressed: boolean) => {
  g.fillStyle = '#1d1430';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ff6a8a';
  g.fillRect(W * 0.1, H * 0.1, W * 0.8, H * 0.35);
  g.fillStyle = pressed ? '#2fbf71' : '#ff3b30';
  g.fillRect(W * 0.1, H * 0.68, W * 0.8, H * 0.12);
};

// ---------- the store's error page in the server room ----------

export const drawError503 = (g: CanvasRenderingContext2D, W: number, H: number, on: number) => {
  g.fillStyle = '#0b0b10';
  g.fillRect(0, 0, W, H);
  if (on <= 0) return;
  g.globalAlpha = on;
  g.fillStyle = '#ff3b30';
  g.textAlign = 'center';
  g.font = `600 ${Math.round(H * 0.42)}px ${COND}`;
  g.fillText('503', W / 2, H * 0.55);
  g.fillStyle = '#ffffff';
  g.font = `500 ${Math.round(H * 0.11)}px ${COND}`;
  g.fillText('СЕРВЕР ПЕРЕГРУЖЕН', W / 2, H * 0.78);
  g.globalAlpha = 1;
};

// ---------- the stock chart on the trading floor wall ----------

// k: how much of the line is drawn (0..1); the last fifth is the plunge
export const drawChart = (g: CanvasRenderingContext2D, W: number, H: number, k: number, pct: number) => {
  g.fillStyle = '#07090f';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(120,140,180,0.18)';
  g.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    g.beginPath();
    g.moveTo(0, (H * i) / 6);
    g.lineTo(W, (H * i) / 6);
    g.stroke();
  }
  for (let i = 1; i < 10; i++) {
    g.beginPath();
    g.moveTo((W * i) / 10, 0);
    g.lineTo((W * i) / 10, H);
    g.stroke();
  }
  // the price: a slow climb with wiggles, then a cliff
  const n = 120;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    let y: number;
    if (s < 0.78) y = 0.62 - s * 0.32 + 0.035 * Math.sin(s * 47) + 0.02 * Math.sin(s * 113);
    else {
      const d = (s - 0.78) / 0.22;
      y = 0.62 - 0.78 * 0.32 + 0.6 * Math.pow(d, 0.6) + 0.02 * Math.sin(s * 140);
    }
    pts.push([W * 0.04 + s * W * 0.82, H * y]);
  }
  const m = Math.max(2, Math.floor(n * k));
  g.lineWidth = 9;
  g.lineJoin = 'round';
  for (let i = 1; i < m; i++) {
    g.strokeStyle = i / n < 0.78 ? '#2fe07a' : '#ff3046';
    g.beginPath();
    g.moveTo(pts[i - 1][0], pts[i - 1][1]);
    g.lineTo(pts[i][0], pts[i][1]);
    g.stroke();
  }
  // the price tag at the tip
  const tip = pts[m - 1];
  const red = m / n >= 0.78;
  g.fillStyle = red ? '#ff3046' : '#2fe07a';
  g.beginPath();
  g.arc(tip[0], tip[1], 14, 0, Math.PI * 2);
  g.fill();
  // header
  g.textAlign = 'left';
  g.fillStyle = '#ffffff';
  g.font = `600 ${Math.round(H * 0.13)}px ${COND}`;
  g.fillText('TTWO', W * 0.05, H * 0.17);
  g.fillStyle = red ? '#ff3046' : '#2fe07a';
  g.textAlign = 'right';
  g.fillText(red ? `▼ −${Math.round(pct)}%` : '▲ +2%', W * 0.95, H * 0.17);
};

// ---------- the ticker on a domino ----------

export const drawTicker = (g: CanvasRenderingContext2D, W: number, H: number, name: string, color: string) => {
  g.fillStyle = '#f4f1ea';
  g.fillRect(0, 0, W, H);
  g.fillStyle = color;
  g.fillRect(0, 0, W, H * 0.06);
  g.fillRect(0, H * 0.94, W, H * 0.06);
  g.textAlign = 'center';
  g.fillStyle = '#16161c';
  g.font = `600 ${Math.round(W * 0.34)}px ${COND}`;
  g.fillText(name, W / 2, H * 0.42);
  g.fillStyle = '#e0283c';
  g.font = `600 ${Math.round(W * 0.3)}px ${COND}`;
  g.fillText('▼', W / 2, H * 0.72);
};

// ---------- the label floating in the AI bubble ----------

export const drawBubbleLabel = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.clearRect(0, 0, W, H);
  g.textAlign = 'center';
  g.font = `600 ${Math.round(H * 0.62)}px ${COND}`;
  g.lineWidth = H * 0.05;
  g.strokeStyle = 'rgba(40,20,80,0.85)';
  g.strokeText('ИИ', W / 2, H * 0.74);
  const lg = g.createLinearGradient(0, H * 0.2, 0, H * 0.8);
  lg.addColorStop(0, '#9ff7ff');
  lg.addColorStop(1, '#d58bff');
  g.fillStyle = lg;
  g.fillText('ИИ', W / 2, H * 0.74);
};

// ---------- a work monitor in the studio ----------

export const drawMonitor = (g: CanvasRenderingContext2D, W: number, H: number, seed: number, off: boolean) => {
  g.fillStyle = off ? '#0a0a0e' : '#141826';
  g.fillRect(0, 0, W, H);
  if (off) return;
  // code lines or a level editor, by seed
  if (seed % 2 === 0) {
    for (let i = 0; i < 9; i++) {
      g.fillStyle = ['#7fd3c8', '#ffb36b', '#d58bff', '#e8e8f0'][(i + seed) % 4];
      g.fillRect(W * (0.08 + 0.06 * ((i * 7 + seed) % 3)), H * (0.1 + i * 0.09), W * (0.2 + 0.5 * (((i + 1) * (seed + 3)) % 5) / 5), H * 0.045);
    }
  } else {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#ff9a6a');
    sky.addColorStop(1, '#5a1650');
    g.fillStyle = sky;
    g.fillRect(W * 0.05, H * 0.08, W * 0.9, H * 0.84);
    g.fillStyle = '#2a1030';
    for (let i = 0; i < 6; i++) g.fillRect(W * (0.1 + i * 0.14), H * (0.45 - 0.05 * ((i * 3 + seed) % 4)), W * 0.1, H * 0.6);
  }
};

// ---------- the leak: the laptop screen ----------

export const drawUpload = (g: CanvasRenderingContext2D, W: number, H: number, usb: number, k: number, done: number) => {
  g.fillStyle = '#0b0f16';
  g.fillRect(0, 0, W, H);
  g.textAlign = 'left';
  g.fillStyle = '#7fd3c8';
  g.font = `500 ${Math.round(H * 0.07)}px ${COND}`;
  g.fillText(usb > 0.5 ? 'USB: GTA6_FULL.zip — 112 ГБ' : 'Вставьте носитель…', W * 0.06, H * 0.14);
  if (usb <= 0.5) return;
  // the file
  roundRect(g, W * 0.06, H * 0.24, W * 0.88, H * 0.3, H * 0.03);
  g.fillStyle = '#1a2233';
  g.fill();
  g.fillStyle = '#ffd23f';
  g.fillRect(W * 0.1, H * 0.29, W * 0.12, H * 0.2);
  g.fillStyle = '#ffffff';
  g.font = `600 ${Math.round(H * 0.1)}px ${COND}`;
  g.fillText('GTA6_FULL.zip', W * 0.27, H * 0.43);
  // the bar
  g.fillStyle = '#2b2f3a';
  g.fillRect(W * 0.06, H * 0.64, W * 0.88, H * 0.08);
  g.fillStyle = done > 0.5 ? '#2fbf71' : '#ff4d6a';
  g.fillRect(W * 0.06, H * 0.64, W * 0.88 * k, H * 0.08);
  g.fillStyle = '#ffffff';
  g.font = `600 ${Math.round(H * 0.1)}px ${COND}`;
  g.textAlign = 'center';
  g.fillText(done > 0.5 ? 'ОПУБЛИКОВАНО ✓' : `ЗАГРУЗКА В СЕТЬ ${Math.floor(k * 100)}%`, W / 2, H * 0.88);
};

// ---------- the card terminal ----------

export const drawCard = (g: CanvasRenderingContext2D, W: number, H: number, declined: number) => {
  g.fillStyle = declined > 0.5 ? '#3a0a0e' : '#0e1a14';
  g.fillRect(0, 0, W, H);
  g.textAlign = 'center';
  g.fillStyle = declined > 0.5 ? '#ff4d4d' : '#7dffb0';
  g.font = `600 ${Math.round(H * 0.17)}px ${COND}`;
  if (declined > 0.5) {
    g.fillText('КАРТА', W / 2, H * 0.36);
    g.fillText('ОТКЛОНЕНА', W / 2, H * 0.58);
    g.font = `500 ${Math.round(H * 0.1)}px ${COND}`;
    g.fillStyle = '#ffb0b0';
    g.fillText('НЕТ СВЯЗИ С БАНКОМ', W / 2, H * 0.8);
  } else {
    g.fillText('ОПЛАТА…', W / 2, H * 0.45);
    g.font = `500 ${Math.round(H * 0.12)}px ${COND}`;
    g.fillText('149 ₽', W / 2, H * 0.68);
  }
};

// the pack of buckwheat
export const drawGrechka = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#f3e3b0';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#c2541a';
  g.fillRect(0, H * 0.62, W, H * 0.38);
  g.fillStyle = '#7a3a12';
  g.textAlign = 'center';
  g.font = `600 ${Math.round(W * 0.22)}px ${COND}`;
  g.fillText('ГРЕЧКА', W / 2, H * 0.42);
  g.fillStyle = '#fff3d0';
  g.font = `500 ${Math.round(W * 0.13)}px ${COND}`;
  g.fillText('900 г', W / 2, H * 0.84);
};

// ---------- the old TV in the ruins ----------

// stage: 0 = off, 1 = loading (k = bar), 2 = the error
export const drawGame = (g: CanvasRenderingContext2D, W: number, H: number, on: number, k: number, err: number) => {
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  if (on <= 0) return;
  g.globalAlpha = on;
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2a0f3d');
  bg.addColorStop(1, '#c2365a');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.textAlign = 'center';
  g.fillStyle = '#ffb36b';
  g.font = `600 ${Math.round(H * 0.26)}px ${COND}`;
  g.fillText('GTA VI', W / 2, H * 0.38);
  if (err <= 0) {
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(W * 0.2, H * 0.6, W * 0.6, H * 0.05);
    g.fillStyle = '#ffffff';
    g.fillRect(W * 0.2, H * 0.6, W * 0.6 * k, H * 0.05);
  } else {
    // the dialog
    g.globalAlpha = on * Math.min(1, err * 2);
    roundRect(g, W * 0.07, H * 0.47, W * 0.86, H * 0.44, H * 0.04);
    g.fillStyle = 'rgba(12,10,18,0.94)';
    g.fill();
    g.fillStyle = '#ffffff';
    g.font = `600 ${Math.round(H * 0.075)}px ${COND}`;
    g.fillText('Для игры требуется', W / 2, H * 0.6);
    g.fillText('подключение к интернету', W / 2, H * 0.69);
    roundRect(g, W * 0.33, H * 0.76, W * 0.34, H * 0.1, H * 0.05);
    g.fillStyle = '#ffffff';
    g.fill();
    g.fillStyle = '#2a0f3d';
    g.font = `600 ${Math.round(H * 0.06)}px ${COND}`;
    g.fillText('ПОВТОРИТЬ', W / 2, H * 0.83);
  }
  g.globalAlpha = 1;
};

// ---------- the game case the survivor digs out ----------

export const drawDiscCover = (g: CanvasRenderingContext2D, W: number, H: number) => {
  const lg = g.createLinearGradient(0, 0, 0, H);
  lg.addColorStop(0, '#ff9a4a');
  lg.addColorStop(0.55, '#ff3d8b');
  lg.addColorStop(1, '#5a1a8a');
  g.fillStyle = lg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#f2f2f4';
  g.fillRect(0, 0, W, H * 0.12);
  g.textAlign = 'center';
  g.fillStyle = '#ffffff';
  g.font = `600 ${Math.round(H * 0.3)}px ${COND}`;
  g.fillText('GTA', W / 2, H * 0.52);
  g.font = `600 ${Math.round(H * 0.24)}px ${COND}`;
  g.fillText('VI', W / 2, H * 0.78);
  // grime of ten years
  g.fillStyle = 'rgba(70,60,50,0.35)';
  for (let i = 0; i < 40; i++) g.fillRect(((i * 73) % W), ((i * 151) % H), 6 + (i % 5) * 4, 4 + (i % 3) * 3);
};
