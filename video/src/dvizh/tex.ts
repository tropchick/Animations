import {COND, roundRect} from '../gta/tex';

// canvas pictures for «Что если движуха закончится?»: the TV, the window, boards, tags, the phone, the paper

const clamp = (x: number) => Math.max(0, Math.min(1, x));

const fit = (g: CanvasRenderingContext2D, text: string, max: number, size: number, weight = 600) => {
  let s = Math.round(size);
  g.font = `${weight} ${s}px ${COND}`;
  while (g.measureText(text).width > max && s > 8) {
    s -= 2;
    g.font = `${weight} ${s}px ${COND}`;
  }
  return s;
};

// the news on TV: red «СРОЧНО» strip, the headline, a ticker
export const drawTv = (g: CanvasRenderingContext2D, W: number, H: number, flash: number) => {
  g.fillStyle = '#0f2a5a';
  g.fillRect(0, 0, W, H);
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, 'rgba(255,255,255,0.10)');
  grd.addColorStop(1, 'rgba(0,0,0,0.25)');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  g.fillStyle = flash > 0.5 ? '#ff2a2a' : '#d81e1e';
  g.fillRect(0, H * 0.08, W * 0.5, H * 0.2);
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, 'СРОЧНО', W * 0.44, H * 0.15);
  g.fillText('СРОЧНО', W * 0.25, H * 0.185);
  g.fillStyle = '#ffffff';
  fit(g, 'ДВИЖУХА', W * 0.9, H * 0.3);
  g.fillText('ДВИЖУХА', W / 2, H * 0.47);
  g.fillStyle = '#ffd23f';
  fit(g, 'ВСЁ', W * 0.9, H * 0.3);
  g.fillText('ВСЁ', W / 2, H * 0.72);
  g.fillStyle = '#d81e1e';
  g.fillRect(0, H * 0.87, W, H * 0.13);
};

// the night outside the kitchen window: houses and firework bursts (t = story time)
export const drawNight = (g: CanvasRenderingContext2D, W: number, H: number, t: number, bursts: number[]) => {
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#060a1c');
  sky.addColorStop(1, '#1d2c52');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  const cols = ['#ff5a5a', '#ffd23f', '#5ad1ff', '#7aff8a', '#ff7ae0'];
  bursts.forEach((at, i) => {
    const a = t - at;
    if (a < 0 || a > 2.2) return;
    const cx = W * (0.2 + 0.6 * ((i * 0.37) % 1));
    const cy = H * (0.18 + 0.18 * ((i * 0.53) % 1));
    const r = W * 0.22 * (1 - Math.exp(-a * 3.5));
    const o = clamp(1 - a / 2.2);
    g.fillStyle = cols[i % cols.length];
    g.globalAlpha = o;
    for (let k = 0; k < 18; k++) {
      const ang = (k / 18) * Math.PI * 2;
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r + a * a * 6;
      g.beginPath();
      g.arc(x, y, W * 0.012, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = o * 0.5;
    g.beginPath();
    g.arc(cx, cy, W * 0.05 * Math.exp(-a * 4), 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
  });
  // houses across the yard with lit windows
  const base = H * 0.55;
  for (let b = 0; b < 3; b++) {
    const x0 = b * W * 0.36 - W * 0.04;
    g.fillStyle = '#121624';
    g.fillRect(x0, base - b * H * 0.05, W * 0.32, H);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 5; c++) {
        const s = Math.sin((r * 13.1 + c * 7.7 + b * 3) * 12.9898) * 43758.5453;
        const f = s - Math.floor(s);
        g.fillStyle = f > 0.45 ? '#ffd88a' : '#1e2436';
        g.fillRect(x0 + W * 0.02 + c * W * 0.06, base - b * H * 0.05 + H * 0.03 + r * H * 0.05, W * 0.035, H * 0.03);
      }
    }
  }
};

// the exchange board: «$ 1» and the rate in roubles; down = green ▼
export const drawUsd = (g: CanvasRenderingContext2D, W: number, H: number, value: number, down: boolean) => {
  g.fillStyle = '#0c0f14';
  g.fillRect(0, 0, W, H);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffb02e';
  g.font = `600 ${Math.round(H * 0.16)}px ${COND}`;
  g.fillText('КУРС', W / 2, H * 0.13);
  g.fillStyle = '#f2ece0';
  g.font = `600 ${Math.round(H * 0.19)}px ${COND}`;
  g.fillText('1 ДОЛЛАР', W / 2, H * 0.37);
  const txt = `${value.toFixed(value < 10 ? 2 : 2).replace('.', ',')} ₽${down ? ' ▼' : ''}`;
  g.fillStyle = down ? '#3cff6a' : '#ff4a4a';
  fit(g, txt, W * 0.92, H * 0.32);
  g.fillText(txt, W / 2, H * 0.72);
};

// the departure board: each row flips from «ОТМЕНЁН» to the city at its own k (0..1); hi lights the Paris price
export const DEPARTURES: [string, string, string][] = [
  ['ПАРИЖ', '21:40', '1 990 ₽'],
  ['РИМ', '22:05', '2 290 ₽'],
  ['БАРСЕЛОНА', '22:30', '2 490 ₽'],
  ['НЬЮ-ЙОРК', '23:15', '3 990 ₽'],
  ['ЛОНДОН', '23:50', '2 190 ₽'],
];
export const drawBoard = (g: CanvasRenderingContext2D, W: number, H: number, ks: number[], hi: number) => {
  g.fillStyle = '#0a0d12';
  g.fillRect(0, 0, W, H);
  const head = H * 0.14;
  g.fillStyle = '#1e5fbf';
  g.fillRect(0, 0, W, head);
  g.fillStyle = '#fff';
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.font = `600 ${Math.round(head * 0.62)}px ${COND}`;
  g.fillText('ВЫЛЕТ', W * 0.03, head * 0.54);
  g.textAlign = 'right';
  g.fillText('ЦЕНА', W * 0.97, head * 0.54);
  const rh = (H - head) / DEPARTURES.length;
  DEPARTURES.forEach(([city, time, price], i) => {
    const y = head + i * rh;
    const k = clamp(ks[i] ?? 0);
    g.fillStyle = i % 2 ? '#10141c' : '#141a24';
    g.fillRect(0, y, W, rh);
    // the flap: squashes vertically in the middle of the flip
    const sq = Math.abs(Math.cos(k * Math.PI));
    const done = k >= 0.5;
    g.save();
    g.translate(0, y + rh / 2);
    g.scale(1, Math.max(0.05, sq));
    g.textAlign = 'left';
    g.font = `600 ${Math.round(rh * 0.5)}px ${COND}`;
    g.fillStyle = done ? '#ffe9a8' : '#6a6e78';
    g.fillText(done ? city : '— — —', W * 0.03, 0);
    g.fillStyle = done ? '#ffe9a8' : '#6a6e78';
    g.fillText(done ? time : '--:--', W * 0.4, 0);
    g.textAlign = 'right';
    if (done) {
      const lit = i === 0 ? hi : 0;
      if (lit > 0) {
        g.fillStyle = `rgba(255,210,63,${0.85 * lit})`;
        roundRect(g, W * 0.66, -rh * 0.38, W * 0.32, rh * 0.76, 10);
        g.fill();
      }
      g.fillStyle = lit > 0.5 ? '#141414' : '#3cff6a';
      g.font = `600 ${Math.round(rh * 0.5)}px ${COND}`;
      g.fillText(price, W * 0.96, 0);
    } else {
      g.fillStyle = '#ff4a4a';
      g.font = `600 ${Math.round(rh * 0.42)}px ${COND}`;
      g.fillText('ОТМЕНЁН', W * 0.96, 0);
    }
    g.restore();
    g.fillStyle = '#000';
    g.fillRect(0, y + rh / 2 - 1, W, 2);
  });
};

// any sign: two lines on a plate
export const drawPlate = (g: CanvasRenderingContext2D, W: number, H: number, a: string, b: string, bg: string, fa: string, fb: string) => {
  g.fillStyle = bg;
  roundRect(g, 0, 0, W, H, H * 0.06);
  g.fill();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = fa;
  fit(g, a, W * 0.9, H * 0.36);
  g.fillText(a, W / 2, b ? H * 0.32 : H * 0.53);
  if (b) {
    g.fillStyle = fb;
    fit(g, b, W * 0.9, H * 0.36);
    g.fillText(b, W / 2, H * 0.72);
  }
};

// a handwritten cardboard sign
export const drawCardboard = (g: CanvasRenderingContext2D, W: number, H: number, lines: string[]) => {
  g.fillStyle = '#c9a26a';
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(120,80,40,0.25)';
  for (let i = 0; i < 6; i++) g.fillRect(0, (H / 6) * i + 4, W, 3);
  g.fillStyle = '#1a1410';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lh = H / (lines.length + 0.6);
  lines.forEach((l, i) => {
    fit(g, l, W * 0.88, lh * 0.82);
    g.save();
    g.translate(W / 2, lh * (i + 0.8));
    g.rotate(i % 2 ? 0.03 : -0.025);
    g.fillText(l, 0, 0);
    g.restore();
  });
};

// the phone screen: a video that loaded at once (k 0 spinner, 1 playing), «ВПН ВЫКЛ» at the top
export const drawVideo = (g: CanvasRenderingContext2D, W: number, H: number, k: number, play: number) => {
  g.fillStyle = '#0e0e12';
  g.fillRect(0, 0, W, H);
  // status bar
  g.fillStyle = '#fff';
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.font = `600 ${Math.round(W * 0.07)}px ${COND}`;
  g.fillText('21:00', W * 0.06, H * 0.035);
  // the VPN pill
  g.fillStyle = '#2a2d36';
  roundRect(g, W * 0.18, H * 0.08, W * 0.64, H * 0.07, H * 0.035);
  g.fill();
  g.fillStyle = '#9aa0ac';
  g.textAlign = 'center';
  fit(g, 'ВПН: ВЫКЛ', W * 0.56, H * 0.05);
  g.fillText('ВПН: ВЫКЛ', W / 2, H * 0.117);
  // the video frame
  const y0 = H * 0.22;
  const vh = W * 0.62;
  const sky = g.createLinearGradient(0, y0, 0, y0 + vh);
  sky.addColorStop(0, '#ff8a5a');
  sky.addColorStop(1, '#ffd27a');
  g.fillStyle = sky;
  g.fillRect(0, y0, W, vh);
  g.fillStyle = '#fff2c0';
  g.beginPath();
  g.arc(W * (0.3 + 0.4 * play), y0 + vh * 0.55, W * 0.1, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#2a3a5a';
  g.fillRect(0, y0 + vh * 0.72, W, vh * 0.28);
  // a cat on the hill, the universal video
  g.fillStyle = '#1a1a1e';
  const cx = W * 0.62;
  const cy = y0 + vh * 0.66;
  g.fillRect(cx - W * 0.07, cy - W * 0.05, W * 0.14, W * 0.07);
  g.fillRect(cx + W * 0.04, cy - W * 0.1, W * 0.06, W * 0.06);
  g.beginPath();
  g.moveTo(cx + W * 0.04, cy - W * 0.1);
  g.lineTo(cx + W * 0.055, cy - W * 0.13);
  g.lineTo(cx + W * 0.07, cy - W * 0.1);
  g.moveTo(cx + W * 0.075, cy - W * 0.1);
  g.lineTo(cx + W * 0.09, cy - W * 0.13);
  g.lineTo(cx + W * 0.1, cy - W * 0.1);
  g.fill();
  if (k < 1) {
    g.fillStyle = 'rgba(0,0,0,0.7)';
    g.fillRect(0, y0, W, vh);
    g.strokeStyle = '#fff';
    g.lineWidth = W * 0.02;
    g.beginPath();
    g.arc(W / 2, y0 + vh / 2, W * 0.08, k * 20, k * 20 + 4.5);
    g.stroke();
  }
  // the bar: red fill
  g.fillStyle = '#444';
  g.fillRect(0, y0 + vh, W, H * 0.012);
  g.fillStyle = '#ff2a2a';
  g.fillRect(0, y0 + vh, W * (k >= 1 ? 1 : 0.02), H * 0.012);
  // HD badge and text under the video
  g.fillStyle = '#fff';
  g.textAlign = 'left';
  fit(g, k >= 1 ? '4K  ·  0 сек загрузки' : 'Загрузка… 1%', W * 0.9, W * 0.08);
  g.fillText(k >= 1 ? '4K  ·  0 сек загрузки' : 'Загрузка… 1%', W * 0.06, y0 + vh + H * 0.06);
  g.fillStyle = '#3a3d46';
  for (let i = 0; i < 3; i++) {
    g.fillRect(W * 0.06, y0 + vh + H * 0.13 + i * H * 0.1, W * 0.3, H * 0.07);
    g.fillRect(W * 0.42, y0 + vh + H * 0.135 + i * H * 0.1, W * 0.5, H * 0.02);
    g.fillRect(W * 0.42, y0 + vh + H * 0.165 + i * H * 0.1, W * 0.35, H * 0.02);
  }
};

// the shop price tag: old price struck through, new one drops in (k 0..1)
export const drawTag = (g: CanvasRenderingContext2D, W: number, H: number, name: string, a: string, b: string, k: number) => {
  g.fillStyle = '#ffffff';
  roundRect(g, 0, 0, W, H, 14);
  g.fill();
  g.fillStyle = '#1e5fbf';
  g.fillRect(0, 0, W, H * 0.24);
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, name, W * 0.9, H * 0.18);
  g.fillText(name, W / 2, H * 0.125);
  // old price
  g.fillStyle = k > 0 ? '#8a8a90' : '#141414';
  fit(g, a, W * 0.9, H * (k > 0 ? 0.2 : 0.34));
  const ya = k > 0 ? H * 0.38 : H * 0.6;
  g.fillText(a, W / 2, ya);
  if (k > 0) {
    const w = g.measureText(a).width;
    g.strokeStyle = '#e02424';
    g.lineWidth = H * 0.03;
    g.beginPath();
    g.moveTo(W / 2 - w / 2 - 6, ya + H * 0.02);
    g.lineTo(W / 2 - w / 2 - 6 + (w + 12) * clamp(k * 3), ya - H * 0.02);
    g.stroke();
    // new price falls in from above
    const yb = H * 0.72 - (1 - clamp(k * 2.2)) * H * 0.3;
    g.save();
    g.globalAlpha = clamp(k * 3);
    g.fillStyle = '#16a34a';
    fit(g, `${b} ▼`, W * 0.92, H * 0.36);
    g.fillText(`${b} ▼`, W / 2, yb);
    g.restore();
  }
};

// a TV box: a picture of a TV and a label
export const drawTvBox = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#e4d6bc';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#1a1a1e';
  g.fillRect(W * 0.12, H * 0.14, W * 0.76, H * 0.56);
  const s = g.createLinearGradient(0, H * 0.18, 0, H * 0.66);
  s.addColorStop(0, '#2a7ad8');
  s.addColorStop(1, '#7ad0ff');
  g.fillStyle = s;
  g.fillRect(W * 0.15, H * 0.18, W * 0.7, H * 0.48);
  g.fillStyle = '#1a1a1e';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, 'ТЕЛЕВИЗОР 65"', W * 0.8, H * 0.13);
  g.fillText('ТЕЛЕВИЗОР 65"', W / 2, H * 0.84);
};

// the bank message on the teacher's phone
export const drawSalary = (g: CanvasRenderingContext2D, W: number, H: number, on: number) => {
  g.fillStyle = '#0e0e12';
  g.fillRect(0, 0, W, H);
  if (on <= 0) return;
  g.globalAlpha = clamp(on);
  g.fillStyle = '#f2f4f8';
  roundRect(g, W * 0.05, H * 0.2, W * 0.9, H * 0.5, W * 0.06);
  g.fill();
  g.fillStyle = '#1f9d55';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, 'ЗАРПЛАТА', W * 0.8, H * 0.08);
  g.fillText('ЗАРПЛАТА', W / 2, H * 0.3);
  g.fillStyle = '#141414';
  fit(g, '+500 000 ₽', W * 0.84, H * 0.14);
  g.fillText('+500 000 ₽', W / 2, H * 0.47);
  g.fillStyle = '#6a6e78';
  fit(g, 'было 50 000 ₽', W * 0.8, H * 0.06);
  g.fillText('было 50 000 ₽', W / 2, H * 0.61);
  g.globalAlpha = 1;
};

// the blackboard
export const drawBlackboard = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#1f4a34';
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.font = `500 ${Math.round(H * 0.16)}px ${COND}`;
  g.fillText('Классная работа', W * 0.06, H * 0.2);
  g.fillText('2 × 2 = 4', W * 0.06, H * 0.45);
  g.fillText('5 × 50 000 = ?', W * 0.06, H * 0.7);
};

// the newspaper front page
export const drawPaper = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#f0ece2';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#141414';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, 'ГАЗЕТА', W * 0.9, H * 0.09);
  g.fillText('ГАЗЕТА', W / 2, H * 0.07);
  g.fillRect(W * 0.05, H * 0.13, W * 0.9, H * 0.008);
  g.fillStyle = '#c21d1d';
  fit(g, 'ШАУРМА', W * 0.9, H * 0.2);
  g.fillText('ШАУРМА', W / 2, H * 0.27);
  g.fillStyle = '#141414';
  fit(g, 'ПОДОРОЖАЛА', W * 0.9, H * 0.16);
  g.fillText('ПОДОРОЖАЛА', W / 2, H * 0.44);
  fit(g, 'В 5 РАЗ', W * 0.9, H * 0.16);
  g.fillText('В 5 РАЗ', W / 2, H * 0.6);
  g.fillStyle = '#9a968c';
  for (let i = 0; i < 5; i++) {
    g.fillRect(W * 0.06, H * (0.72 + i * 0.05), W * 0.4, H * 0.018);
    g.fillRect(W * 0.54, H * (0.72 + i * 0.05), W * 0.4, H * 0.018);
  }
};

export const drawHeart = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#ff3a5a';
  g.beginPath();
  g.moveTo(W / 2, H * 0.85);
  g.bezierCurveTo(W * 0.05, H * 0.5, W * 0.15, H * 0.05, W / 2, H * 0.3);
  g.bezierCurveTo(W * 0.85, H * 0.05, W * 0.95, H * 0.5, W / 2, H * 0.85);
  g.fill();
};
