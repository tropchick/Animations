import {COND, roundRect} from '../gta/tex';

// canvas pictures for «Шаурма ×5»: price tags, signs, the menu board, speech bubbles

const clamp = (x: number) => Math.max(0, Math.min(1, x));

// the kiosk price card: bright yellow paper, black marker.
// write: 0..1 how much of «250 ₽» is written (left to right); one: 0..1 how much of the stray «1» is drawn (top to bottom)
export const drawKioskTag = (g: CanvasRenderingContext2D, W: number, H: number, write: number, one: number) => {
  g.fillStyle = '#ffd83a';
  roundRect(g, 0, 0, W, H, 18);
  g.fill();
  g.strokeStyle = '#e0a800';
  g.lineWidth = 8;
  roundRect(g, 6, 6, W - 12, H - 12, 14);
  g.stroke();
  g.fillStyle = '#c21d1d';
  g.font = `600 ${Math.round(H * 0.2)}px ${COND}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('ШАУРМА', W / 2, H * 0.2);
  // the price: «250 ₽» sits right of centre, leaving room for the «1» on the left
  const size = Math.round(H * 0.5);
  g.font = `600 ${size}px ${COND}`;
  g.textAlign = 'left';
  const price = '250 ₽';
  const pw = g.measureText(price).width;
  const ow = g.measureText('1').width;
  const x0 = W / 2 - (pw + ow) / 2 + ow;
  const y = H * 0.63;
  g.fillStyle = '#141414';
  g.save();
  g.beginPath();
  g.rect(x0 - 4, 0, (pw + 8) * clamp(write), H);
  g.clip();
  g.fillText(price, x0, y);
  g.restore();
  if (one > 0) {
    g.save();
    g.beginPath();
    g.rect(x0 - ow - 10, y - size * 0.6, ow + 14, size * 1.2 * clamp(one));
    g.clip();
    // slightly tilted: it was never meant to be there
    g.translate(x0 - ow * 0.55, y);
    g.rotate(0.06);
    g.textAlign = 'center';
    g.fillText('1', 0, 0);
    g.restore();
  }
};

export const drawSign = (g: CanvasRenderingContext2D, W: number, H: number, text: string, bg: string, fg: string, edge?: string) => {
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  if (edge) {
    g.strokeStyle = edge;
    g.lineWidth = H * 0.08;
    g.strokeRect(H * 0.04, H * 0.04, W - H * 0.08, H - H * 0.08);
  }
  g.fillStyle = fg;
  let size = Math.round(H * 0.66);
  g.font = `600 ${size}px ${COND}`;
  while (g.measureText(text).width > W * 0.9 && size > 10) {
    size -= 2;
    g.font = `600 ${size}px ${COND}`;
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, W / 2, H * 0.53);
};

// the burger shop menu: each line's price flips up at its own moment (k 0..1 per line)
export const MENU: [string, string, string][] = [
  ['БУРГЕР', '290', '590'],
  ['КАРТОШКА', '120', '260'],
  ['НАГГЕТСЫ', '180', '390'],
  ['НАПИТОК', '90', '190'],
];
export const drawMenu = (g: CanvasRenderingContext2D, W: number, H: number, ks: number[]) => {
  g.fillStyle = '#17141a';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ffb02e';
  g.font = `600 ${Math.round(H * 0.12)}px ${COND}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('МЕНЮ', W / 2, H * 0.1);
  const rowH = H * 0.2;
  MENU.forEach(([name, a, b], i) => {
    const y = H * 0.27 + i * rowH;
    const k = ks[i] ?? 0;
    g.fillStyle = '#f2ece0';
    g.font = `500 ${Math.round(rowH * 0.5)}px ${COND}`;
    g.textAlign = 'left';
    g.fillText(name, W * 0.06, y);
    // a split-flap price cell
    const cw = W * 0.3;
    const cx = W * 0.64;
    g.fillStyle = '#2b2730';
    roundRect(g, cx, y - rowH * 0.38, cw, rowH * 0.76, 10);
    g.fill();
    // flipping: the top half of the old number folds down, then the new number shows
    const up = k >= 0.5;
    const red = k > 0;
    g.fillStyle = red && up ? '#ff4a4a' : '#ffffff';
    g.font = `600 ${Math.round(rowH * 0.58)}px ${COND}`;
    g.textAlign = 'center';
    g.save();
    const squash = k > 0 && k < 1 ? Math.abs(Math.cos(k * Math.PI)) : 1;
    g.translate(cx + cw / 2, y);
    g.scale(1, Math.max(0.05, squash));
    g.fillText(`${up ? b : a} ₽`, 0, 0);
    g.restore();
    g.fillStyle = 'rgba(0,0,0,0.45)';
    g.fillRect(cx, y - 2, cw, 4);
  });
};

// a supermarket shelf tag: name, old price crossed out, new price in red with ×2
export const drawShelfTag = (g: CanvasRenderingContext2D, W: number, H: number, name: string, a: string, b: string, k: number) => {
  g.fillStyle = k > 0 ? '#fff4f0' : '#ffffff';
  g.fillRect(0, 0, W, H);
  g.fillStyle = k > 0 ? '#e02424' : '#ffd23f';
  g.fillRect(0, 0, W, H * 0.3);
  g.fillStyle = k > 0 ? '#ffffff' : '#1a1a1a';
  g.font = `600 ${Math.round(H * 0.2)}px ${COND}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(name, W / 2, H * 0.16);
  if (k <= 0) {
    g.fillStyle = '#1a1a1a';
    g.font = `600 ${Math.round(H * 0.42)}px ${COND}`;
    g.fillText(`${a} ₽`, W / 2, H * 0.64);
    return;
  }
  g.fillStyle = '#8a8a8a';
  g.font = `500 ${Math.round(H * 0.2)}px ${COND}`;
  g.textAlign = 'left';
  g.fillText(`${a} ₽`, W * 0.06, H * 0.44);
  const ow = g.measureText(`${a} ₽`).width;
  g.strokeStyle = '#e02424';
  g.lineWidth = H * 0.025;
  g.beginPath();
  g.moveTo(W * 0.05, H * 0.47);
  g.lineTo(W * 0.07 + ow, H * 0.41);
  g.stroke();
  g.fillStyle = '#e02424';
  g.font = `600 ${Math.round(H * 0.4)}px ${COND}`;
  g.textAlign = 'left';
  g.fillText(`${b} ₽`, W * 0.06, H * 0.75);
  // the arrow and ×2
  const ax = W * 0.82;
  g.beginPath();
  g.moveTo(ax, H * 0.36);
  g.lineTo(ax + W * 0.1, H * 0.52);
  g.lineTo(ax + W * 0.04, H * 0.52);
  g.lineTo(ax + W * 0.04, H * 0.66);
  g.lineTo(ax - W * 0.04, H * 0.66);
  g.lineTo(ax - W * 0.04, H * 0.52);
  g.lineTo(ax - W * 0.1, H * 0.52);
  g.closePath();
  g.fill();
  g.font = `600 ${Math.round(H * 0.2)}px ${COND}`;
  g.textAlign = 'center';
  g.fillText('×2', ax, H * 0.83);
};

export const drawBubble = (g: CanvasRenderingContext2D, W: number, H: number, text: string, tailRight: boolean) => {
  g.fillStyle = '#ffffff';
  roundRect(g, 6, 6, W - 12, H * 0.74, H * 0.2);
  g.fill();
  g.beginPath();
  const tx = tailRight ? W * 0.72 : W * 0.28;
  g.moveTo(tx - W * 0.06, H * 0.74);
  g.lineTo(tx + (tailRight ? W * 0.08 : -W * 0.08), H * 0.98);
  g.lineTo(tx + W * 0.06, H * 0.74);
  g.closePath();
  g.fill();
  g.fillStyle = '#141414';
  let size = Math.round(H * 0.38);
  g.font = `600 ${size}px ${COND}`;
  while (g.measureText(text).width > W * 0.86 && size > 10) {
    size -= 2;
    g.font = `600 ${size}px ${COND}`;
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, W / 2, H * 0.39);
};

// the tag next to the phone at the market
export const drawPhoneTag = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#1a1a1a';
  g.lineWidth = 6;
  g.strokeRect(8, 8, W - 16, H - 16);
  g.fillStyle = '#1a1a1a';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${Math.round(H * 0.24)}px ${COND}`;
  g.fillText('ТЕЛЕФОН', W / 2, H * 0.28);
  g.fillStyle = '#c21d1d';
  g.font = `600 ${Math.round(H * 0.4)}px ${COND}`;
  g.fillText('80 ШАУРМ', W / 2, H * 0.68);
};

// a phone's lit screen: plain, no logos
export const drawScreen = (g: CanvasRenderingContext2D, W: number, H: number) => {
  const gr = g.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, '#5a7cff');
  gr.addColorStop(1, '#c86aff');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.font = `500 ${Math.round(W * 0.28)}px ${COND}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('12:00', W / 2, H * 0.25);
};

// panel-house facade: a grid of windows, some lit
export const drawFacade = (g: CanvasRenderingContext2D, W: number, H: number, cols: number, rows: number, wall: string, seed: number) => {
  g.fillStyle = wall;
  g.fillRect(0, 0, W, H);
  const cw = W / cols;
  const rh = H / rows;
  for (let r = 0; r < rows; r++) {
    // panel seams
    g.fillStyle = 'rgba(0,0,0,0.08)';
    g.fillRect(0, r * rh, W, 3);
    for (let c = 0; c < cols; c++) {
      const s = Math.sin((r * 13.1 + c * 7.7 + seed) * 12.9898) * 43758.5453;
      const f = s - Math.floor(s);
      g.fillStyle = f > 0.8 ? '#f6dfa0' : f > 0.4 ? '#7d98b0' : '#5c7690';
      g.fillRect(c * cw + cw * 0.22, r * rh + rh * 0.24, cw * 0.56, rh * 0.5);
      g.fillStyle = '#e8e4dc';
      g.fillRect(c * cw + cw * 0.2, r * rh + rh * 0.74, cw * 0.6, rh * 0.06);
    }
  }
};
