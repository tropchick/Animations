import {COND, roundRect} from '../gta/tex';
import {fit} from '../cs2/tex';

// Canvas pictures for «Что если число 67 запретят?»: the chalkboard, the law, the poster, the scoreboard,
// the calculator, the bus sign, TV news, the height ruler, number candles and small signs.

export {fit};
const clamp = (x: number) => Math.max(0, Math.min(1, x));

// ---------------------------------------------------------------- chalkboard: lines appear by k (0..1 over all letters)
export const drawBoard = (lines: string[], k = 1, big = 0.26) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#2f5a3a';
  g.fillRect(0, 0, W, H);
  // smudges
  g.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 9; i++) {
    g.beginPath();
    g.ellipse(W * ((i * 0.37) % 1), H * ((i * 0.53) % 1), W * 0.12, H * 0.08, i, 0, Math.PI * 2);
    g.fill();
  }
  const n = lines.reduce((a, l) => a + l.length, 0);
  let left = Math.round(k * n);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#f4f4ec';
  const lh = H / (lines.length + 0.6);
  lines.forEach((l, i) => {
    const show = l.slice(0, Math.max(0, left));
    left -= l.length;
    if (!show) return;
    g.font = `500 ${fit(g, l, W * 0.9, H * big * (lines.length === 1 ? 2.2 : 1), 500)}px ${COND}`;
    g.fillText(show, W / 2, lh * (i + 0.8));
  });
};

// ---------------------------------------------------------------- the law on the table: stamped (0..1), voided (0..1)
export const drawLaw = (stamped: number, voided: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#fbf8f0';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#1b1c24';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${H * 0.1}px ${COND}`;
  g.fillText('ЗАКОН', W / 2, H * 0.12);
  g.font = `500 ${H * 0.045}px ${COND}`;
  g.fillStyle = '#5a5a66';
  g.fillText('СОВЕТА УЧИТЕЛЕЙ СТРАНЫ', W / 2, H * 0.21);
  g.fillStyle = '#1b1c24';
  g.font = `600 ${fit(g, 'ЧИСЛА 67', W * 0.86, H * 0.13)}px ${COND}`;
  g.fillText('ЧИСЛА 67', W / 2, H * 0.37);
  g.font = `600 ${fit(g, 'БОЛЬШЕ НЕТ', W * 0.86, H * 0.11)}px ${COND}`;
  g.fillText('БОЛЬШЕ НЕТ', W / 2, H * 0.5);
  // lines of small print
  g.fillStyle = '#c8c4bc';
  for (let i = 0; i < 5; i++) g.fillRect(W * 0.12, H * (0.6 + i * 0.05), W * (0.76 - (i === 4 ? 0.3 : 0)), H * 0.012);
  // signature
  g.strokeStyle = '#2a3a8a';
  g.lineWidth = H * 0.008;
  g.beginPath();
  g.moveTo(W * 0.55, H * 0.9);
  g.bezierCurveTo(W * 0.62, H * 0.82, W * 0.66, H * 0.95, W * 0.72, H * 0.86);
  g.bezierCurveTo(W * 0.76, H * 0.8, W * 0.8, H * 0.92, W * 0.86, H * 0.87);
  g.stroke();
  if (stamped > 0) {
    g.save();
    g.globalAlpha = clamp(stamped) * 0.9;
    g.translate(W * 0.3, H * 0.86);
    g.rotate(-0.25);
    g.strokeStyle = '#d8322a';
    g.lineWidth = H * 0.014;
    g.beginPath();
    g.ellipse(0, 0, W * 0.2, H * 0.075, 0, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = '#d8322a';
    g.font = `600 ${H * 0.06}px ${COND}`;
    g.fillText('ПРИНЯТО', 0, 0);
    g.restore();
  }
  if (voided > 0) {
    const k = clamp(voided);
    g.strokeStyle = '#d8322a';
    g.lineWidth = H * 0.03;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(W * 0.08, H * 0.08);
    g.lineTo(W * 0.08 + W * 0.84 * Math.min(1, k * 2), H * 0.08 + H * 0.84 * Math.min(1, k * 2));
    g.stroke();
    if (k > 0.5) {
      g.beginPath();
      g.moveTo(W * 0.92, H * 0.08);
      g.lineTo(W * 0.92 - W * 0.84 * (k - 0.5) * 2, H * 0.08 + H * 0.84 * (k - 0.5) * 2);
      g.stroke();
    }
  }
};

// ---------------------------------------------------------------- poster: two palms, crossed out
const palm = (g: CanvasRenderingContext2D, x: number, y: number, s: number) => {
  g.beginPath();
  g.ellipse(x, y, s * 0.42, s * 0.5, 0, 0, Math.PI * 2);
  g.fill();
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.ellipse(x - s * 0.3 + i * s * 0.2, y - s * 0.62, s * 0.08, s * 0.24, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.beginPath();
  g.ellipse(x + s * 0.5, y - s * 0.1, s * 0.08, s * 0.22, -0.7, 0, Math.PI * 2);
  g.fill();
};
export const drawPoster = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#fff7e8';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#e8453c';
  g.fillRect(0, 0, W, H * 0.06);
  g.fillRect(0, H * 0.94, W, H * 0.06);
  g.fillStyle = '#f2b98e';
  palm(g, W * 0.32, H * 0.38, W * 0.2);
  palm(g, W * 0.68, H * 0.3, W * 0.2);
  g.strokeStyle = '#e8453c';
  g.lineWidth = W * 0.04;
  g.beginPath();
  g.arc(W / 2, H * 0.33, W * 0.36, 0, Math.PI * 2);
  g.moveTo(W / 2 - W * 0.25, H * 0.33 + W * 0.25);
  g.lineTo(W / 2 + W * 0.25, H * 0.33 - W * 0.25);
  g.stroke();
  g.fillStyle = '#1b1c24';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${fit(g, 'ЖЕСТ ТОЖЕ', W * 0.86, H * 0.13)}px ${COND}`;
  g.fillText('ЖЕСТ ТОЖЕ', W / 2, H * 0.7);
  g.fillStyle = '#e8453c';
  g.font = `600 ${fit(g, 'ЗАПРЕЩЁН', W * 0.86, H * 0.14)}px ${COND}`;
  g.fillText('ЗАПРЕЩЁН', W / 2, H * 0.84);
};

// ---------------------------------------------------------------- a plain sign / tape
export const drawSign = (text: string, bg: string, fg: string, sub?: string, subCol?: string, stripes = false) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  if (stripes) {
    g.fillStyle = 'rgba(0,0,0,0.85)';
    for (let x = -H; x < W + H; x += H * 0.9) {
      g.beginPath();
      g.moveTo(x, H);
      g.lineTo(x + H * 0.45, H);
      g.lineTo(x + H * 0.45 + H * 0.3, H * 0.82);
      g.lineTo(x + H * 0.3, H * 0.82);
      g.fill();
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + H * 0.45, 0);
      g.lineTo(x + H * 0.45 + H * 0.3, H * 0.18);
      g.lineTo(x + H * 0.3, H * 0.18);
      g.fill();
    }
  }
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (sub) {
    g.font = `600 ${fit(g, text, W * 0.9, H * 0.48)}px ${COND}`;
    g.fillText(text, W / 2, H * 0.36);
    g.fillStyle = subCol ?? fg;
    g.font = `500 ${fit(g, sub, W * 0.86, H * 0.26, 500)}px ${COND}`;
    g.fillText(sub, W / 2, H * 0.76);
  } else {
    g.font = `600 ${fit(g, text, W * 0.88, H * (stripes ? 0.5 : 0.66))}px ${COND}`;
    g.fillText(text, W / 2, H * 0.54);
  }
};

// ---------------------------------------------------------------- scoreboard: count up to n; hit (0..1) makes 67 glow
export const drawScore = (n: number, hit: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#16182a';
  roundRect(g, 0, 0, W, H, H * 0.06);
  g.fill();
  g.strokeStyle = '#3a3e5a';
  g.lineWidth = H * 0.02;
  roundRect(g, H * 0.03, H * 0.03, W - H * 0.06, H - H * 0.06, H * 0.05);
  g.stroke();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#c8cce0';
  g.font = `500 ${H * 0.12}px ${COND}`;
  g.fillText('ГОЛОСОВАНИЕ', W / 2, H * 0.17);
  g.textAlign = 'left';
  g.font = `600 ${H * 0.2}px ${COND}`;
  g.fillStyle = '#5ad06a';
  g.fillText('ЗА', W * 0.1, H * 0.47);
  g.fillStyle = '#e8453c';
  g.fillText('ПРОТИВ', W * 0.1, H * 0.77);
  g.textAlign = 'right';
  g.save();
  if (hit > 0) {
    g.shadowColor = '#ffd23f';
    g.shadowBlur = H * 0.12 * hit;
  }
  g.fillStyle = hit > 0 ? '#ffd23f' : '#5ad06a';
  g.font = `600 ${H * (0.24 + 0.06 * hit)}px ${COND}`;
  g.fillText(String(Math.round(n)), W * 0.9, H * 0.47);
  g.restore();
  g.fillStyle = '#e8453c';
  g.font = `600 ${H * 0.24}px ${COND}`;
  g.fillText('0', W * 0.9, H * 0.77);
};

// ---------------------------------------------------------------- calculator LCD
export const drawLcd = (text: string, err: boolean) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = err ? '#e8c0b0' : '#b8c8a0';
  g.fillRect(0, 0, W, H);
  g.fillStyle = err ? '#a01a12' : '#1e2a18';
  g.textAlign = 'right';
  g.textBaseline = 'middle';
  g.font = `600 ${fit(g, text, W * 0.9, H * 0.66)}px ${COND}`;
  g.fillText(text, W * 0.94, H * 0.55);
};
export const drawKey = (label: string, col: string) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = col;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${H * 0.6}px ${COND}`;
  g.fillText(label, W / 2, H * 0.55);
};

// ---------------------------------------------------------------- the bus route board (orange LED)
export const drawRoute = (text: string, k = 1) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#141414';
  g.fillRect(0, 0, W, H);
  g.save();
  g.globalAlpha = clamp(k);
  g.shadowColor = '#ff9a2a';
  g.shadowBlur = H * 0.15;
  g.fillStyle = '#ffb040';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${fit(g, text, W * 0.9, H * 0.78)}px ${COND}`;
  g.fillText(text, W / 2, H * 0.55);
  g.restore();
};

// ---------------------------------------------------------------- TV news
export const drawNews = (k: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1d3a8a');
  bg.addColorStop(1, '#0e1d4a');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#e8453c';
  g.fillRect(0, 0, W * 0.34, H * 0.16);
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${H * 0.1}px ${COND}`;
  g.fillText('НОВОСТИ', W * 0.17, H * 0.085);
  g.font = `500 ${fit(g, 'СРЕДНЯЯ ОЦЕНКА ПО СТРАНЕ', W * 0.9, H * 0.11, 500)}px ${COND}`;
  g.fillText('СРЕДНЯЯ ОЦЕНКА ПО СТРАНЕ', W / 2, H * 0.3);
  g.save();
  g.shadowColor = '#ffd23f';
  g.shadowBlur = H * 0.06;
  g.fillStyle = '#ffd23f';
  g.font = `600 ${H * (0.36 + 0.06 * clamp(k))}px ${COND}`;
  g.fillText('6,7', W / 2, H * 0.6);
  g.restore();
  g.fillStyle = '#ffffff';
  g.fillRect(0, H * 0.84, W, H * 0.16);
  g.fillStyle = '#0e1d4a';
  g.font = `500 ${fit(g, 'ШКОЛЬНИКИ ВПЕРВЫЕ ПОЛЮБИЛИ МАТЕМАТИКУ', W * 0.92, H * 0.08, 500)}px ${COND}`;
  g.fillText('ШКОЛЬНИКИ ВПЕРВЫЕ ПОЛЮБИЛИ МАТЕМАТИКУ', W / 2, H * 0.92);
};

// ---------------------------------------------------------------- the height ruler: metres on the left, feet on the right; 0..2.4 m
export const RULER_H = 2.4;
export const drawRulerTex = (lit: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#fbf8f0';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#1b1c24';
  g.textBaseline = 'middle';
  const yOf = (m: number) => H * (1 - m / RULER_H);
  for (let cm = 0; cm <= 240; cm += 5) {
    const y = yOf(cm / 100);
    const long = cm % 10 === 0;
    g.fillRect(0, y - 1, W * (long ? 0.18 : 0.1), 2);
    if (cm % 20 === 0 && cm > 0) {
      g.textAlign = 'left';
      g.font = `500 ${W * 0.11}px ${COND}`;
      g.fillText((cm / 100).toFixed(1).replace('.', ','), W * 0.2, y);
    }
  }
  for (let inch = 0; inch <= 94; inch += 1) {
    const y = yOf(inch * 0.0254);
    const ft = inch % 12 === 0;
    g.fillRect(W * (ft ? 0.82 : 0.9), y - 1, W * (ft ? 0.18 : 0.1), 2);
    if (ft && inch > 0) {
      g.textAlign = 'right';
      g.font = `500 ${W * 0.11}px ${COND}`;
      g.fillText(`${inch / 12}′`, W * 0.8, y);
    }
  }
  if (lit > 0) {
    const y = yOf(2.01);
    g.save();
    g.globalAlpha = clamp(lit);
    g.fillStyle = '#e8453c';
    g.fillRect(0, y - 4, W, 8);
    g.shadowColor = '#e8453c';
    g.shadowBlur = 20;
    roundRect(g, W * 0.08, y - W * 0.62, W * 0.84, W * 0.16, W * 0.04);
    g.fill();
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.font = `600 ${W * 0.12}px ${COND}`;
    g.fillText('2,01 м = 6′7″', W / 2, y - W * 0.54);
    g.restore();
  }
};

// ---------------------------------------------------------------- a number candle (transparent background)
export const drawDigit = (d: string, col: string) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.clearRect(0, 0, W, H);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${H * 0.95}px ${COND}`;
  g.lineJoin = 'round';
  g.lineWidth = W * 0.12;
  g.strokeStyle = '#ffffff';
  g.strokeText(d, W / 2, H * 0.53);
  g.fillStyle = col;
  g.fillText(d, W / 2, H * 0.53);
};

// ---------------------------------------------------------------- the cover board: a big 67 with a red «ЗАПРЕЩЕНО» stamp
export const drawBoardBan = (g: CanvasRenderingContext2D, W: number, H: number) => {
  drawBoard(['67'], 1, 0.4)(g, W, H);
  g.save();
  g.translate(W / 2, H * 0.55);
  g.rotate(-0.16);
  g.strokeStyle = '#ff4a3a';
  g.lineWidth = H * 0.05;
  roundRect(g, -W * 0.36, -H * 0.15, W * 0.72, H * 0.3, H * 0.05);
  g.stroke();
  g.fillStyle = '#ff4a3a';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${fit(g, 'ЗАПРЕЩЕНО', W * 0.66, H * 0.24)}px ${COND}`;
  g.fillText('ЗАПРЕЩЕНО', 0, H * 0.01);
  g.restore();
};
