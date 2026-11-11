import {COND, roundRect} from '../gta/tex';
import {fit} from '../cs2/tex';

// Canvas pictures for «читы в реальной жизни»: the phone (codes page + keyboard), price tag, sky banner,
// sick note, diary, health bars, shop signs.

const clamp = (x: number) => Math.max(0, Math.min(1, x));

// ---------------------------------------------------------------- phone: the page «Коды для Вайс-Сити» with an input field

const LIST: [string, string][] = [
  ['HESOYAM', 'здоровье, броня, $250 000'],
  ['AEZAKMI', 'полиция тебя не ищет'],
  ['RIPAZHA', 'летающие машины'],
  ['YECGAA', 'реактивный ранец'],
  ['BAGUVIX', 'бессмертие'],
];

const drawInput = (g: CanvasRenderingContext2D, W: number, y: number, text: string, caret: boolean, ok: number, fail = 0) => {
  g.fillStyle = fail > 0 ? '#ffe2df' : ok > 0 ? '#e2f8e6' : '#ffffff';
  roundRect(g, 30, y, W - 60, 110, 26);
  g.fill();
  g.lineWidth = 5;
  g.strokeStyle = fail > 0 ? '#e8453c' : ok > 0 ? '#2fae5a' : '#3a7bd5';
  g.stroke();
  g.fillStyle = '#1b1c24';
  g.font = `600 64px ${COND}`;
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillText(text, 60, y + 58);
  if (caret) {
    const w = g.measureText(text).width;
    g.fillStyle = '#3a7bd5';
    g.fillRect(64 + w, y + 24, 5, 66);
  }
};

export const drawCodes = (g: CanvasRenderingContext2D, W: number, H: number, text: string, caret: boolean, ok: number) => {
  g.fillStyle = '#f2f4f8';
  g.fillRect(0, 0, W, H);
  // browser bar
  g.fillStyle = '#e1e5ee';
  g.fillRect(0, 0, W, 120);
  g.fillStyle = '#ffffff';
  roundRect(g, 26, 34, W - 52, 60, 30);
  g.fill();
  g.fillStyle = '#7a8090';
  fit(g, 'коды для вайс сити все', W - 110, 34, 500);
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillText('коды для вайс сити все', 56, 64);
  // title
  g.fillStyle = '#1b1c24';
  g.textAlign = 'center';
  g.font = `600 ${fit(g, 'КОДЫ ДЛЯ ВАЙС-СИТИ', W - 60, 62)}px ${COND}`;
  g.fillText('КОДЫ ДЛЯ ВАЙС-СИТИ', W / 2, 190);
  g.fillStyle = '#e8453c';
  g.fillRect(W / 2 - 90, 232, 180, 6);
  // list
  LIST.forEach(([c, d], i) => {
    const y = 280 + i * 118;
    g.fillStyle = '#ffffff';
    roundRect(g, 30, y, W - 60, 100, 20);
    g.fill();
    g.fillStyle = '#2a5bd8';
    g.textAlign = 'left';
    g.font = `600 44px ${COND}`;
    g.fillText(c, 52, y + 34);
    g.fillStyle = '#5a6070';
    g.font = `500 ${fit(g, d, W - 110, 32, 500)}px ${COND}`;
    g.fillText(d, 52, y + 74);
  });
  // input
  g.fillStyle = '#5a6070';
  g.font = `500 34px ${COND}`;
  g.textAlign = 'left';
  g.fillText('Введи код:', 40, 900);
  drawInput(g, W, 930, text, caret, ok);
  if (ok > 0) {
    g.fillStyle = '#2fae5a';
    g.textAlign = 'center';
    g.font = `600 52px ${COND}`;
    g.fillText('ЧИТ АКТИВИРОВАН', W / 2, 1090);
  }
};

// the keyboard screen: text field on top, QWERTY below; hi = the key under the thumb
const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
export const keyPos = (ch: string, W: number, H: number): [number, number] => {
  for (let r = 0; r < ROWS.length; r++) {
    const i = ROWS[r].indexOf(ch);
    if (i >= 0) {
      const kw = W / 10;
      const x0 = (W - ROWS[r].length * kw) / 2;
      return [x0 + (i + 0.5) * kw, H * 0.62 + r * (H * 0.1)];
    }
  }
  return [W / 2, H * 0.9];
};
export const drawKeyboard = (g: CanvasRenderingContext2D, W: number, H: number, text: string, hi: string, ok: number, fail = 0, title = 'Введи код:') => {
  g.fillStyle = '#f2f4f8';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#5a6070';
  g.font = `500 40px ${COND}`;
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillText(title, 40, 150);
  drawInput(g, W, 190, text, ok <= 0 && fail <= 0, ok, fail);
  if (ok > 0 || fail > 0) {
    g.fillStyle = fail > 0 ? '#e8453c' : '#2fae5a';
    g.textAlign = 'center';
    g.font = `600 52px ${COND}`;
    g.fillText(fail > 0 ? 'НЕ ДЕЙСТВУЕТ' : 'ЧИТ АКТИВИРОВАН', W / 2, 360);
  }
  // keyboard
  g.fillStyle = '#d4d8e0';
  g.fillRect(0, H * 0.56, W, H * 0.44);
  ROWS.forEach((row, r) => {
    const kw = W / 10;
    const x0 = (W - row.length * kw) / 2;
    for (let i = 0; i < row.length; i++) {
      const x = x0 + i * kw;
      const y = H * 0.62 + r * (H * 0.1) - H * 0.04;
      g.fillStyle = row[i] === hi ? '#9ab8f0' : '#ffffff';
      roundRect(g, x + 5, y, kw - 10, H * 0.08, 10);
      g.fill();
      g.fillStyle = '#1b1c24';
      g.textAlign = 'center';
      g.font = `500 42px ${COND}`;
      g.fillText(row[i], x + kw / 2, y + H * 0.04);
    }
  });
  g.fillStyle = '#ffffff';
  roundRect(g, W * 0.2, H * 0.92, W * 0.6, H * 0.055, 10);
  g.fill();
};

// ---------------------------------------------------------------- signs and tags

export const drawSign = (text: string, bg: string, fg: string, sub?: string) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = bg;
  roundRect(g, 0, 0, W, H, Math.min(W, H) * 0.12);
  g.fill();
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const s = fit(g, text, W * 0.86, sub ? H * 0.5 : H * 0.7);
  g.font = `600 ${s}px ${COND}`;
  g.fillText(text, W / 2, sub ? H * 0.38 : H * 0.53);
  if (sub) {
    g.globalAlpha = 0.85;
    g.font = `500 ${fit(g, sub, W * 0.86, H * 0.24, 500)}px ${COND}`;
    g.fillText(sub, W / 2, H * 0.76);
    g.globalAlpha = 1;
  }
};

export const PRICES = ['50 ₽', '5 000 ₽', '100 000 ₽', '1 000 000 ₽'];
export const drawPrice = (g: CanvasRenderingContext2D, W: number, H: number, k: number) => {
  g.fillStyle = k >= 3 ? '#e8453c' : '#ffd23f';
  roundRect(g, 0, 0, W, H, 18);
  g.fill();
  g.fillStyle = k >= 3 ? '#ffffff' : '#1b1c24';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `500 ${H * 0.2}px ${COND}`;
  g.fillText('БАТОН', W / 2, H * 0.22);
  g.font = `600 ${fit(g, PRICES[k], W * 0.9, H * 0.48)}px ${COND}`;
  g.fillText(PRICES[k], W / 2, H * 0.64);
};

// the giant system message in the sky
export const drawBanner = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = 'rgba(16,14,30,0.9)';
  roundRect(g, 0, 0, W, H, H * 0.12);
  g.fill();
  g.lineWidth = H * 0.025;
  g.strokeStyle = '#ffd23f';
  roundRect(g, H * 0.04, H * 0.04, W - H * 0.08, H - H * 0.08, H * 0.1);
  g.stroke();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#7cff9a';
  g.font = `600 ${fit(g, 'ЧИТЫ ВКЛЮЧЕНЫ', W * 0.86, H * 0.3)}px ${COND}`;
  g.fillText('ЧИТЫ ВКЛЮЧЕНЫ', W / 2, H * 0.32);
  g.fillStyle = '#ff6a5a';
  g.font = `600 ${fit(g, 'ДОСТИЖЕНИЯ ОТКЛЮЧЕНЫ', W * 0.86, H * 0.3)}px ${COND}`;
  g.fillText('ДОСТИЖЕНИЯ ОТКЛЮЧЕНЫ', W / 2, H * 0.7);
};

export const drawSickNote = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#fbfaf4';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#2a5bd8';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${fit(g, 'БОЛЬНИЧНЫЙ', W * 0.9, H * 0.16)}px ${COND}`;
  g.fillText('БОЛЬНИЧНЫЙ', W / 2, H * 0.16);
  g.strokeStyle = '#b8bcc8';
  g.lineWidth = 4;
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    g.moveTo(W * 0.1, H * (0.36 + i * 0.1));
    g.lineTo(W * (0.9 - (i % 2) * 0.2), H * (0.36 + i * 0.1));
    g.stroke();
  }
  g.strokeStyle = '#2a5bd8';
  g.lineWidth = 6;
  g.beginPath();
  g.arc(W * 0.74, H * 0.86, H * 0.08, 0, Math.PI * 2);
  g.stroke();
};

// diary page; e = how much of the red «5» is wiped (0..1)
export const drawDiary = (g: CanvasRenderingContext2D, W: number, H: number, e: number) => {
  g.fillStyle = '#fbf8ee';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#b9cbe6';
  g.lineWidth = 3;
  for (let y = 120; y < H; y += 96) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  g.strokeStyle = '#e8a0a0';
  g.beginPath();
  g.moveTo(W * 0.62, 0);
  g.lineTo(W * 0.62, H);
  g.stroke();
  g.fillStyle = '#2a3a6a';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.font = `600 64px ${COND}`;
  g.fillText('ДНЕВНИК', 40, 64);
  const rows: [string, string][] = [
    ['Русский', '4'],
    ['Литература', '4'],
    ['Математика', '5'],
    ['Физкультура', '5'],
  ];
  rows.forEach(([s, m], i) => {
    const y = 120 + 96 * (i + 1) - 44;
    g.fillStyle = '#2a3a6a';
    g.font = `500 56px ${COND}`;
    g.textAlign = 'left';
    g.fillText(s, 40, y);
    if (i === 2) {
      // the «5» that is being wiped
      g.save();
      g.globalAlpha = 1 - clamp(e * 1.15);
      g.fillStyle = '#e8453c';
      g.font = `600 110px ${COND}`;
      g.textAlign = 'center';
      g.fillText(m, W * 0.8, y + 4);
      g.restore();
      if (e > 0.05) {
        // grey rubber smudge
        g.fillStyle = `rgba(190,180,170,${0.35 * clamp(e * 2) * (1 - clamp((e - 0.8) * 5) * 0.6)})`;
        g.beginPath();
        g.ellipse(W * 0.8, y + 4, 90 * clamp(e * 1.4), 52, 0.2, 0, Math.PI * 2);
        g.fill();
      }
    } else {
      g.fillStyle = '#e8453c';
      g.font = `600 84px ${COND}`;
      g.textAlign = 'center';
      g.fillText(m, W * 0.8, y + 4);
    }
  });
};

// health / armour bar over a head
export const drawBar = (g: CanvasRenderingContext2D, W: number, H: number, hp: number, armour: number) => {
  g.clearRect(0, 0, W, H);
  // a GTA-style HUD: icon on the left (heart / shield), bar to the right
  const row = (y: number, h: number, k: number, col: string, bg: string, icon: 'heart' | 'shield') => {
    const ix = h; // icon cell width
    g.fillStyle = '#1b1c24';
    roundRect(g, 0, y, W, h, h / 2);
    g.fill();
    const cx = ix * 0.55;
    const cy = y + h / 2;
    const r = h * 0.3;
    g.fillStyle = col;
    g.beginPath();
    if (icon === 'heart') {
      g.moveTo(cx, cy + r);
      g.bezierCurveTo(cx - r * 1.6, cy - r * 0.2, cx - r * 0.8, cy - r * 1.4, cx, cy - r * 0.5);
      g.bezierCurveTo(cx + r * 0.8, cy - r * 1.4, cx + r * 1.6, cy - r * 0.2, cx, cy + r);
    } else {
      g.moveTo(cx, cy - r * 1.1);
      g.lineTo(cx + r, cy - r * 0.6);
      g.quadraticCurveTo(cx + r, cy + r * 0.6, cx, cy + r * 1.1);
      g.quadraticCurveTo(cx - r, cy + r * 0.6, cx - r, cy - r * 0.6);
      g.closePath();
    }
    g.fill();
    const x0 = ix;
    const bw = W - ix - 8;
    g.fillStyle = bg;
    roundRect(g, x0, y + 8, bw, h - 16, (h - 16) / 2);
    g.fill();
    if (k > 0.01) {
      g.fillStyle = col;
      roundRect(g, x0, y + 8, Math.max(h - 16, bw * k), h - 16, (h - 16) / 2);
      g.fill();
    }
  };
  row(0, armour > 0 ? H * 0.52 : H, hp, '#e8453c', '#5a2020', 'heart');
  if (armour > 0) row(H * 0.56, H * 0.44, armour, '#5ab4ff', '#20304a', 'shield');
};

export const drawSackTag = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#f6efd8';
  roundRect(g, 0, 0, W, H, 16);
  g.fill();
  g.fillStyle = '#2f7a3a';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${fit(g, '$250 000', W * 0.88, H * 0.7)}px ${COND}`;
  g.fillText('$250 000', W / 2, H * 0.54);
};

// a banknote: green with a pale oval
export const drawBill = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#7cc47a';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#3a8a4a';
  g.lineWidth = 6;
  g.strokeRect(6, 6, W - 12, H - 12);
  g.fillStyle = '#d8f0c8';
  g.beginPath();
  g.ellipse(W / 2, H / 2, W * 0.18, H * 0.32, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#2f6a3a';
  g.font = `600 ${H * 0.4}px ${COND}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('$', W / 2, H / 2 + 2);
};
