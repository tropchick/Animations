import {COND, roundRect} from '../gta/tex';

// Canvas pictures for «она выбрала медведя»: phone screens, the wrapper, signs, the contract, the banner, boards.

const clamp = (x: number) => Math.max(0, Math.min(1, x));

const fit = (g: CanvasRenderingContext2D, text: string, max: number, size: number, weight = 600, font = COND) => {
  let s = Math.round(size);
  g.font = `${weight} ${s}px ${font}`;
  while (g.measureText(text).width > max && s > 8) {
    s -= 2;
    g.font = `${weight} ${s}px ${font}`;
  }
  return s;
};

export const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const heart = (g: CanvasRenderingContext2D, x: number, y: number, s: number) => {
  g.beginPath();
  g.moveTo(x, y + s * 0.3);
  g.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
  g.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
  g.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
  g.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
  g.fill();
};

const eyeIcon = (g: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) => {
  g.save();
  g.strokeStyle = col;
  g.fillStyle = col;
  g.lineWidth = s * 0.12;
  g.beginPath();
  g.ellipse(x, y, s * 0.55, s * 0.32, 0, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(x, y, s * 0.16, 0, Math.PI * 2);
  g.fill();
  g.restore();
};

// a little bear head icon (for the question card)
const bearIcon = (g: CanvasRenderingContext2D, x: number, y: number, s: number) => {
  g.fillStyle = '#7a4826';
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.arc(x + sx * s * 0.36, y - s * 0.34, s * 0.2, 0, Math.PI * 2);
    g.fill();
  }
  g.beginPath();
  g.arc(x, y, s * 0.5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#d8a66c';
  g.beginPath();
  g.ellipse(x, y + s * 0.14, s * 0.24, s * 0.18, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1d120d';
  g.beginPath();
  g.ellipse(x, y + s * 0.06, s * 0.08, s * 0.055, 0, 0, Math.PI * 2);
  g.fill();
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.arc(x + sx * s * 0.17, y - s * 0.1, s * 0.055, 0, Math.PI * 2);
    g.fill();
  }
};

const manIcon = (g: CanvasRenderingContext2D, x: number, y: number, s: number) => {
  g.fillStyle = '#f0c4a2';
  g.beginPath();
  g.arc(x, y - s * 0.12, s * 0.32, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#3a2a20';
  g.beginPath();
  g.arc(x, y - s * 0.24, s * 0.33, Math.PI, Math.PI * 2);
  g.fill();
  g.fillStyle = '#4a6a9a';
  g.beginPath();
  g.ellipse(x, y + s * 0.5, s * 0.45, s * 0.3, 0, Math.PI, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1d120d';
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.arc(x + sx * s * 0.11, y - s * 0.12, s * 0.04, 0, Math.PI * 2);
    g.fill();
  }
};

const avatar = (g: CanvasRenderingContext2D, x: number, y: number, r: number, bg: string, letter: string) => {
  g.fillStyle = bg;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${Math.round(r * 1.1)}px ${COND}`;
  g.fillText(letter, x, y + r * 0.05);
};

// ---------------------------------------------------------------- 1. the trend post with the comments

export const drawPost = (g: CanvasRenderingContext2D, W: number, H: number, typed: number, sent: number, reply: number) => {
  // status bar
  g.fillStyle = '#101014';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ffffff';
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.font = `600 ${Math.round(W * 0.05)}px ${COND}`;
  g.fillText('10:00', W * 0.07, H * 0.03);
  g.textAlign = 'right';
  g.fillText('87%', W * 0.93, H * 0.03);
  // the video card with the question
  const c0 = H * 0.06;
  const c1 = H * 0.44;
  const bg = g.createLinearGradient(0, c0, 0, c1);
  bg.addColorStop(0, '#2b4a2a');
  bg.addColorStop(1, '#6b4a22');
  g.fillStyle = bg;
  g.fillRect(0, c0, W, c1 - c0);
  for (let i = 0; i < 9; i++) {
    g.fillStyle = ['#e8862a', '#f2b33d', '#c84a2a'][i % 3];
    g.beginPath();
    g.arc(W * (0.05 + i * 0.12), H * (0.36 + (i % 2) * 0.03), W * 0.1, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(0,0,0,0.28)';
  g.fillRect(0, c0, W, c1 - c0);
  g.textAlign = 'center';
  g.fillStyle = '#ffffff';
  fit(g, 'С кем бы ты осталась', W * 0.86, W * 0.1);
  g.fillText('С кем бы ты осталась', W / 2, H * 0.11);
  fit(g, 'в лесу?', W * 0.86, W * 0.1);
  g.fillText('в лесу?', W / 2, H * 0.165);
  const cw = W * 0.38;
  const ch = H * 0.17;
  const cy = H * 0.215;
  for (const [i, label] of [[0, 'МУЖЧИНА'], [1, 'МЕДВЕДЬ']] as const) {
    const cx = W * (0.08 + i * 0.46);
    g.fillStyle = i === 1 ? 'rgba(255,210,63,0.95)' : 'rgba(255,255,255,0.9)';
    roundRect(g, cx, cy, cw, ch, W * 0.04);
    g.fill();
    if (i === 0) manIcon(g, cx + cw / 2, cy + ch * 0.4, cw * 0.4);
    else bearIcon(g, cx + cw / 2, cy + ch * 0.4, cw * 0.4);
    g.fillStyle = '#1a1416';
    fit(g, label, cw * 0.9, W * 0.07);
    g.fillText(label, cx + cw / 2, cy + ch * 0.85);
  }
  g.fillStyle = '#ffffff';
  g.font = `600 ${Math.round(W * 0.06)}px ${COND}`;
  g.fillText('VS', W / 2, cy + ch / 2);
  // comments sheet
  const top = H * 0.43;
  g.fillStyle = '#ffffff';
  roundRect(g, 0, top, W, H - top + 40, W * 0.06);
  g.fill();
  g.fillStyle = '#d8d8dc';
  roundRect(g, W * 0.43, top + H * 0.01, W * 0.14, H * 0.006, 4);
  g.fill();
  g.fillStyle = '#1a1416';
  g.textAlign = 'left';
  g.font = `600 ${Math.round(W * 0.055)}px ${COND}`;
  g.fillText('Комментарии  48 302', W * 0.06, top + H * 0.04);
  const row = (y: number, name: string, text: string, col: string, letter: string, hi = 0, al = 1) => {
    g.globalAlpha = al;
    if (hi > 0) {
      g.fillStyle = `rgba(255, 214, 80, ${0.4 * hi})`;
      roundRect(g, W * 0.03, y - H * 0.034, W * 0.94, H * 0.07, W * 0.03);
      g.fill();
    }
    avatar(g, W * 0.12, y, W * 0.055, col, letter);
    g.textAlign = 'left';
    g.fillStyle = '#7a7480';
    g.font = `500 ${Math.round(W * 0.042)}px ${COND}`;
    g.fillText(name, W * 0.21, y - H * 0.016);
    g.fillStyle = '#1a1416';
    fit(g, text, W * 0.72, W * 0.065);
    g.fillText(text, W * 0.21, y + H * 0.017);
    g.globalAlpha = 1;
  };
  row(top + H * 0.09, 'katya_v', 'Ну понятно кого', '#8a7ad8', 'К', 0, 0.55);
  const text = 'С медведем, конечно';
  const shown = text.slice(0, Math.round(text.length * clamp(typed)));
  const kb = 1 - clamp(sent * 1.0); // keyboard up while typing
  if (sent > 0) row(top + H * 0.17, 'anya.forest', text, '#c8402d', 'А', clamp(sent * 3) * (1 - reply * 0.7));
  if (reply > 0) {
    const y = top + H * 0.25;
    g.save();
    g.translate(W * 0.08, (1 - clamp(reply * 3)) * H * 0.03);
    g.globalAlpha = clamp(reply * 3);
    row(y, 'lera_k  ответила', 'Докажи', '#2d8ac8', 'Л', clamp(reply * 2));
    g.restore();
  }
  // input box above the keyboard; the keyboard slides away after sending
  const kh = H * 0.33;
  const ky = H - kh * kb;
  const iy = ky - H * 0.075;
  g.fillStyle = '#ffffff';
  g.fillRect(0, iy - H * 0.01, W, H * 0.085);
  g.fillStyle = '#f0eff2';
  roundRect(g, W * 0.05, iy, W * 0.76, H * 0.06, H * 0.03);
  g.fill();
  g.fillStyle = sent > 0 || !shown ? '#c9c6cf' : '#ff3b5c';
  g.beginPath();
  g.arc(W * 0.88, iy + H * 0.03, H * 0.026, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(W * 0.865, iy + H * 0.018);
  g.lineTo(W * 0.905, iy + H * 0.03);
  g.lineTo(W * 0.865, iy + H * 0.042);
  g.closePath();
  g.fill();
  g.textAlign = 'left';
  g.font = `500 ${Math.round(W * 0.058)}px ${COND}`;
  if (sent <= 0 && shown) {
    g.fillStyle = '#1a1416';
    fit(g, shown, W * 0.66, W * 0.058, 500);
    g.fillText(shown, W * 0.09, iy + H * 0.031);
    const tw = g.measureText(shown).width;
    g.fillStyle = '#2d8ac8';
    g.fillRect(W * 0.09 + tw + 4, iy + H * 0.014, 4, H * 0.034);
  } else {
    g.fillStyle = '#9a96a0';
    g.fillText('Добавить комментарий…', W * 0.09, iy + H * 0.031);
  }
  if (kb > 0.001) {
    g.fillStyle = '#d4d6dc';
    g.fillRect(0, ky, W, kh + 2);
    const rows = ['ЙЦУКЕНГШЩЗХ', 'ФЫВАПРОЛДЖЭ', 'ЯЧСМИТЬБЮ'];
    const kw = W / 11.6;
    // the key under the thumb lights up as each letter appears
    const n = Math.round(text.length * clamp(typed));
    const lit = typed > 0 && typed < 1 ? text[Math.max(0, n - 1)].toUpperCase() : '';
    rows.forEach((r, ri) => {
      const x0 = (W - r.length * kw) / 2;
      for (let i = 0; i < r.length; i++) {
        const x = x0 + i * kw + kw * 0.06;
        const y = ky + H * 0.02 + ri * H * 0.07;
        g.fillStyle = r[i] === lit ? '#9fc4ff' : '#ffffff';
        roundRect(g, x, y, kw * 0.88, H * 0.058, 8);
        g.fill();
        g.fillStyle = '#1a1416';
        g.textAlign = 'center';
        g.font = `500 ${Math.round(W * 0.045)}px ${COND}`;
        g.fillText(r[i], x + kw * 0.44, y + H * 0.03);
      }
    });
    g.fillStyle = '#ffffff';
    roundRect(g, W * 0.22, ky + H * 0.235, W * 0.56, H * 0.058, 8);
    g.fill();
  }
};

// ---------------------------------------------------------------- 2. the viral video with the view counter

export const drawViews = (g: CanvasRenderingContext2D, W: number, H: number, thumb: HTMLImageElement | null, views: number, likes: number, zoom: number, hearts: number[]) => {
  g.fillStyle = '#101014';
  g.fillRect(0, 0, W, H);
  if (thumb && thumb.complete && thumb.naturalWidth > 0) {
    const iw = thumb.naturalWidth;
    const ih = thumb.naturalHeight;
    const s = Math.max(W / iw, H / ih) * zoom;
    g.drawImage(thumb, (W - iw * s) / 2, (H - ih * s) / 2 - H * 0.04, iw * s, ih * s);
  }
  const shade = g.createLinearGradient(0, H * 0.55, 0, H);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.75)');
  g.fillStyle = shade;
  g.fillRect(0, 0, W, H);
  // views pill at the top
  g.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(g, W * 0.08, H * 0.07, W * 0.84, H * 0.1, H * 0.05);
  g.fill();
  eyeIcon(g, W * 0.19, H * 0.12, W * 0.12, '#ffffff');
  g.fillStyle = '#ffd23f';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  fit(g, fmt(views), W * 0.6, W * 0.13);
  g.fillText(fmt(views), W * 0.29, H * 0.123);
  // caption
  g.fillStyle = '#ffffff';
  g.font = `600 ${Math.round(W * 0.055)}px ${COND}`;
  g.fillText('anya.forest', W * 0.07, H * 0.84);
  fit(g, 'медведь просит добавку', W * 0.7, W * 0.06, 500);
  g.fillText('медведь просит добавку', W * 0.07, H * 0.885);
  // like button + count on the right
  g.fillStyle = '#ff3b5c';
  heart(g, W * 0.86, H * 0.6, W * 0.13);
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.font = `600 ${Math.round(W * 0.05)}px ${COND}`;
  const kl = likes >= 1e6 ? (likes / 1e6).toFixed(1).replace('.', ',') + ' млн' : likes >= 1e3 ? Math.round(likes / 1e3) + ' тыс' : String(Math.round(likes));
  g.fillText(kl, W * 0.86, H * 0.69);
  // floating hearts
  hearts.forEach((h, i) => {
    if (h <= 0 || h >= 1) return;
    g.globalAlpha = 1 - h;
    g.fillStyle = ['#ff3b5c', '#ff7a9a', '#ffd23f'][i % 3];
    heart(g, W * (0.86 + Math.sin(h * 6 + i) * 0.05), H * (0.58 - h * 0.35), W * (0.07 + 0.03 * (i % 2)));
    g.globalAlpha = 1;
  });
};

// ---------------------------------------------------------------- the honey bar wrapper

export const drawWrapper = (g: CanvasRenderingContext2D, W: number, H: number) => {
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#ffcf3a');
  bg.addColorStop(1, '#f39a1e');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // honeycomb
  g.strokeStyle = 'rgba(160, 80, 10, 0.3)';
  g.lineWidth = H * 0.025;
  const r = H * 0.12;
  for (let y = -1; y < 6; y++)
    for (let x = -1; x < 14; x++) {
      const cx = x * r * 1.75 + (y % 2) * r * 0.87;
      const cy = y * r * 1.5;
      g.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
        g[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      g.closePath();
      g.stroke();
    }
  // band + text
  g.fillStyle = '#5a2a0c';
  roundRect(g, W * 0.18, H * 0.16, W * 0.64, H * 0.68, H * 0.12);
  g.fill();
  g.fillStyle = '#ffd23f';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, 'МЁД', W * 0.5, H * 0.5, 600);
  g.fillText('МЁД', W / 2, H * 0.44);
  g.fillStyle = '#fff2c8';
  fit(g, 'ПРОТЕИНОВЫЙ БАТОНЧИК', W * 0.56, H * 0.13, 500);
  g.fillText('ПРОТЕИНОВЫЙ БАТОНЧИК', W / 2, H * 0.71);
};

// ---------------------------------------------------------------- signs

export const drawWoodSign = (g: CanvasRenderingContext2D, W: number, H: number, lines: string[], col = '#fff3d6') => {
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#9a6a3c');
  bg.addColorStop(1, '#7a4e2a');
  g.fillStyle = bg;
  roundRect(g, 0, 0, W, H, H * 0.08);
  g.fill();
  g.strokeStyle = 'rgba(60,30,10,0.35)';
  g.lineWidth = 3;
  for (let i = 1; i < 5; i++) {
    g.beginPath();
    g.moveTo(W * 0.02, (H * i) / 5 + Math.sin(i) * 4);
    g.bezierCurveTo(W * 0.3, (H * i) / 5 - 6, W * 0.7, (H * i) / 5 + 6, W * 0.98, (H * i) / 5);
    g.stroke();
  }
  g.fillStyle = col;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const n = lines.length;
  lines.forEach((ln, i) => {
    fit(g, ln, W * 0.88, (H / n) * 0.62);
    g.fillText(ln, W / 2, (H * (i + 0.55)) / n);
  });
  g.fillStyle = '#4a2a12';
  for (const x of [0.05, 0.95])
    for (const y of [0.12, 0.88]) {
      g.beginPath();
      g.arc(W * x, H * y, H * 0.035, 0, Math.PI * 2);
      g.fill();
    }
};

export const drawFrameSign = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#f6efe0';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#5a3a20';
  g.lineWidth = W * 0.012;
  // a tiny floor plan: three rooms
  const x0 = W * 0.12;
  const y0 = H * 0.36;
  const w = W * 0.76;
  const h = H * 0.42;
  g.strokeRect(x0, y0, w, h);
  g.beginPath();
  g.moveTo(x0 + w * 0.4, y0);
  g.lineTo(x0 + w * 0.4, y0 + h);
  g.moveTo(x0 + w * 0.4, y0 + h * 0.5);
  g.lineTo(x0 + w, y0 + h * 0.5);
  g.stroke();
  g.fillStyle = '#5a3a20';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, '3 КОМНАТЫ', W * 0.86, H * 0.2);
  g.fillText('3 КОМНАТЫ', W / 2, H * 0.17);
  g.font = `500 ${Math.round(H * 0.08)}px ${COND}`;
  g.fillText('кухня', x0 + w * 0.2, y0 + h * 0.5);
  g.fillText('спальня', x0 + w * 0.7, y0 + h * 0.25);
  g.fillText('кладовая мёда', x0 + w * 0.7, y0 + h * 0.75);
  g.fillText('вид на речку', W / 2, H * 0.9);
};

export const drawBanner = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#fff6e8';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#e8462e';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, 'МЫ ТОЖЕ ВЫБРАЛИ МЕДВЕДЯ', W * 0.92, H * 0.62);
  g.fillText('МЫ ТОЖЕ ВЫБРАЛИ МЕДВЕДЯ', W / 2, H * 0.53);
  g.fillStyle = '#e8462e';
  for (let i = 0; i < 12; i++) heart(g, W * (0.02 + (i % 2) * 0.96), H * (0.12 + Math.floor(i / 2) * 0.13), H * 0.1);
};

export const drawContract = (g: CanvasRenderingContext2D, W: number, H: number, stamped: number) => {
  g.fillStyle = '#fbf8f0';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#1a1416';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, 'КОНТРАКТ', W * 0.8, H * 0.1);
  g.fillText('КОНТРАКТ', W / 2, H * 0.1);
  g.fillStyle = '#c8701a';
  fit(g, 'РЕКЛАМА МЁДА', W * 0.86, H * 0.085);
  g.fillText('РЕКЛАМА МЁДА', W / 2, H * 0.19);
  g.fillStyle = '#b8b2a8';
  for (let i = 0; i < 9; i++) g.fillRect(W * 0.1, H * (0.28 + i * 0.045), W * (0.8 - (i % 3) * 0.12), H * 0.012);
  g.fillStyle = '#1a1416';
  g.textAlign = 'left';
  g.font = `500 ${Math.round(H * 0.045)}px ${COND}`;
  g.fillText('Подпись:', W * 0.1, H * 0.77);
  g.strokeStyle = '#1a1416';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(W * 0.38, H * 0.79);
  g.lineTo(W * 0.9, H * 0.79);
  g.stroke();
  if (stamped > 0) {
    // the inky paw print
    g.globalAlpha = Math.min(1, stamped);
    g.fillStyle = '#2a1a4a';
    const cx = W * 0.64;
    const cy = H * 0.74;
    const s = W * 0.2;
    g.beginPath();
    g.ellipse(cx, cy + s * 0.12, s * 0.42, s * 0.34, 0, 0, Math.PI * 2);
    g.fill();
    for (let k = 0; k < 4; k++) {
      const a = -Math.PI * 0.85 + k * Math.PI * 0.23;
      g.beginPath();
      g.ellipse(cx + Math.cos(a) * s * 0.55, cy + Math.sin(a) * s * 0.5 - s * 0.05, s * 0.13, s * 0.15, a + Math.PI / 2, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }
};

export const drawOnAir = (g: CanvasRenderingContext2D, W: number, H: number, n: number, blink: number) => {
  g.fillStyle = '#16080a';
  roundRect(g, 0, 0, W, H, H * 0.12);
  g.fill();
  g.fillStyle = `rgba(255, 40, 50, ${0.6 + 0.4 * blink})`;
  g.beginPath();
  g.arc(W * 0.1, H * 0.5, H * 0.17, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ff3b3b';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  if (n < 0) {
    // just the sign, no counter (the counter lives in the overlay)
    fit(g, 'В ЭФИРЕ', W * 0.7, H * 0.56);
    g.fillText('В ЭФИРЕ', W * 0.2, H * 0.53);
    return;
  }
  fit(g, 'В ЭФИРЕ', W * 0.36, H * 0.48);
  g.fillText('В ЭФИРЕ', W * 0.18, H * 0.52);
  g.fillStyle = '#ffffff';
  g.textAlign = 'right';
  eyeIcon(g, W * 0.55, H * 0.5, H * 0.4, '#ffffff');
  fit(g, fmt(n), W * 0.38, H * 0.5);
  g.fillText(fmt(n), W * 0.95, H * 0.52);
};

export const drawNeon = (g: CanvasRenderingContext2D, W: number, H: number, text: string, col: string) => {
  g.clearRect(0, 0, W, H);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, text, W * 0.9, H * 0.7);
  g.shadowColor = col;
  g.shadowBlur = H * 0.25;
  g.fillStyle = col;
  g.fillText(text, W / 2, H * 0.52);
  g.shadowBlur = H * 0.08;
  g.fillStyle = '#ffffff';
  g.fillText(text, W / 2, H * 0.52);
};

export const drawPoster = (g: CanvasRenderingContext2D, W: number, H: number, a: string, b: string, bg: string) => {
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ffd23f';
  g.beginPath();
  g.arc(W / 2, H * 0.42, W * 0.28, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#c8701a';
  g.beginPath();
  g.ellipse(W / 2, H * 0.36, W * 0.12, W * 0.06, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, a, W * 0.86, H * 0.1);
  g.fillText(a, W / 2, H * 0.12);
  fit(g, b, W * 0.86, H * 0.08, 500);
  g.fillText(b, W / 2, H * 0.84);
};

export const drawChart = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#f7f7f2';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#d0d0c8';
  g.lineWidth = 2;
  for (let i = 1; i < 5; i++) {
    g.beginPath();
    g.moveTo(W * 0.1, H * (0.2 + i * 0.15));
    g.lineTo(W * 0.92, H * (0.2 + i * 0.15));
    g.stroke();
  }
  g.strokeStyle = '#e8862a';
  g.lineWidth = W * 0.02;
  g.beginPath();
  const pts = [0.85, 0.82, 0.8, 0.74, 0.7, 0.5, 0.22];
  pts.forEach((y, i) => g[i ? 'lineTo' : 'moveTo'](W * (0.1 + i * 0.135), H * y));
  g.stroke();
  g.fillStyle = '#1a1416';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, 'ПРОДАЖИ МЁДА', W * 0.8, H * 0.12);
  g.fillText('ПРОДАЖИ МЁДА', W / 2, H * 0.1);
};

export const drawLabel = (g: CanvasRenderingContext2D, W: number, H: number, text: string, bg: string, fg: string) => {
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, text, W * 0.86, H * 0.6);
  g.fillText(text, W / 2, H * 0.53);
};

// the autograph photo: a bear portrait with a paw print
export const drawPhoto = (g: CanvasRenderingContext2D, W: number, H: number, signed: number) => {
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, W, H);
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#f6c860');
  bg.addColorStop(1, '#e8862a');
  g.fillStyle = bg;
  g.fillRect(W * 0.06, W * 0.06, W * 0.88, H * 0.72);
  bearIcon(g, W / 2, H * 0.42, W * 0.6);
  if (signed > 0) {
    g.globalAlpha = Math.min(1, signed);
    g.fillStyle = '#2a1a4a';
    const cx = W * 0.7;
    const cy = H * 0.86;
    const s = W * 0.16;
    g.beginPath();
    g.ellipse(cx, cy, s * 0.4, s * 0.32, 0, 0, Math.PI * 2);
    g.fill();
    for (let k = 0; k < 4; k++) {
      const a = -Math.PI * 0.85 + k * Math.PI * 0.23;
      g.beginPath();
      g.arc(cx + Math.cos(a) * s * 0.5, cy + Math.sin(a) * s * 0.45 - s * 0.08, s * 0.12, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }
};

// the fans' banner in two lines, so it fits a vertical frame
export const drawBannerTall = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#fff6e8';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#e8462e';
  g.lineWidth = H * 0.035;
  g.strokeRect(H * 0.04, H * 0.04, W - H * 0.08, H - H * 0.08);
  g.fillStyle = '#e8462e';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, 'МЫ ТОЖЕ ВЫБРАЛИ', W * 0.84, H * 0.3, 700);
  g.fillText('МЫ ТОЖЕ ВЫБРАЛИ', W / 2, H * 0.33);
  g.fillStyle = '#7a3a12';
  fit(g, 'МЕДВЕДЯ', W * 0.7, H * 0.36, 800);
  g.fillText('МЕДВЕДЯ', W / 2, H * 0.7);
  g.fillStyle = '#e8462e';
  for (const [x, y] of [
    [0.07, 0.6],
    [0.93, 0.6],
    [0.11, 0.76],
    [0.89, 0.76],
  ])
    heart(g, W * x, H * y, H * 0.11);
};
