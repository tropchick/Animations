import {COND, roundRect} from '../gta/tex';
import {fit} from '../cs2/tex';

// Canvas pictures for «мир без брейнротов»: the laptop, the boards, notebooks, the plan, phone cartoons, the tower screen.

export {fit};
const clamp = (x: number) => Math.max(0, Math.min(1, x));

// a tiny shark in sneakers, drawn flat (for the laptop preview)
const flatShark = (g: CanvasRenderingContext2D, cx: number, cy: number, s: number) => {
  g.save();
  g.translate(cx, cy);
  g.scale(s, s);
  // legs + sneakers
  g.strokeStyle = '#6fa6d8';
  g.lineWidth = 9;
  g.lineCap = 'round';
  for (const x of [-34, 0, 34]) {
    g.beginPath();
    g.moveTo(x, 20);
    g.lineTo(x, 62);
    g.stroke();
    g.fillStyle = '#ffffff';
    roundRect(g, x - 14, 58, 32, 15, 7);
    g.fill();
    g.fillStyle = '#2f6fd8';
    g.fillRect(x - 6, 63, 16, 4);
  }
  // body
  g.fillStyle = '#7aa9d6';
  g.beginPath();
  g.ellipse(0, 0, 80, 34, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#f2f6fb';
  g.beginPath();
  g.ellipse(6, 12, 62, 18, 0, 0, Math.PI);
  g.fill();
  // tail + fin
  g.fillStyle = '#7aa9d6';
  g.beginPath();
  g.moveTo(-74, 0);
  g.lineTo(-112, -30);
  g.lineTo(-104, 2);
  g.lineTo(-112, 30);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(-14, -30);
  g.lineTo(8, -68);
  g.lineTo(22, -30);
  g.closePath();
  g.fill();
  // eye + grin
  g.fillStyle = '#1b1b22';
  g.beginPath();
  g.arc(48, -8, 6, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#1b1b22';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(52, 6, 16, 0.1, Math.PI * 0.75);
  g.stroke();
  g.restore();
};

// the author's laptop: preview of the shark, two buttons, the cursor; after the click the preview is gone
export const drawLaptop = (g: CanvasRenderingContext2D, W: number, H: number, cur: number, clicked: number) => {
  g.fillStyle = '#20222c';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#2c2f3c';
  g.fillRect(0, 0, W, 34);
  g.fillStyle = '#c8cadb';
  g.font = `600 20px ${COND}`;
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillText('нейросеть: картинка готова', 16, 18);
  // preview
  g.fillStyle = clicked > 0 ? '#2a2c36' : '#e9f2fb';
  roundRect(g, 26, 48, W - 52, 170, 14);
  g.fill();
  if (clicked <= 0) flatShark(g, W / 2 + 10, 124, 0.9);
  else {
    g.fillStyle = '#7d8094';
    g.textAlign = 'center';
    fit(g, 'УДАЛЕНО', W * 0.5, 44, 700);
    g.fillText('УДАЛЕНО', W / 2, 134);
  }
  // buttons
  const by = 240;
  const bw = (W - 78) / 2;
  const btn = (x: number, text: string, col: string, press: number) => {
    g.fillStyle = col;
    roundRect(g, x, by + press * 3, bw, 56, 14);
    g.fill();
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    fit(g, text, bw - 20, 28, 700);
    g.fillText(text, x + bw / 2, by + 29 + press * 3);
  };
  btn(26, 'ОПУБЛИКОВАТЬ', clicked > 0 ? '#3c6a4a' : '#2fae5a', 0);
  btn(52 + bw, 'УДАЛИТЬ', '#e8453c', clicked > 0 && clicked < 0.25 ? 1 : 0);
  // cursor: from the publish button to delete
  const cx = 26 + bw * 0.55 + (bw + 26) * cur;
  const cy = by + 34 + Math.sin(cur * Math.PI) * -26;
  g.fillStyle = '#ffffff';
  g.strokeStyle = '#111';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(cx, cy);
  g.lineTo(cx, cy + 34);
  g.lineTo(cx + 9, cy + 26);
  g.lineTo(cx + 16, cy + 40);
  g.lineTo(cx + 22, cy + 37);
  g.lineTo(cx + 15, cy + 24);
  g.lineTo(cx + 26, cy + 23);
  g.closePath();
  g.fill();
  g.stroke();
};

// chalkboard with lines written up to k (0..1 over all characters)
const chalkLines = (g: CanvasRenderingContext2D, W: number, H: number, lines: string[], k: number, size: number, top: number, gap: number) => {
  g.fillStyle = '#2f5a46';
  g.fillRect(0, 0, W, H);
  const n = lines.reduce((a, l) => a + l.length, 0);
  let left = Math.floor(n * clamp(k));
  g.fillStyle = '#f4f1e6';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  lines.forEach((l, i) => {
    if (left <= 0) return;
    const part = l.slice(0, left);
    left -= l.length;
    g.font = `500 ${size}px ${COND}`;
    g.fillText(part, W * 0.06, top + i * gap);
  });
  // chalk dust smudges
  g.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 12; i++) g.fillRect((i * 97) % W, (i * 53) % H, 80, 18);
};

export const FORMULA = ['log₂(x + 6) = 3', 'x + 6 = 8', 'x = 2   ✓'];
export const drawFormula = (g: CanvasRenderingContext2D, W: number, H: number, k: number) => {
  chalkLines(g, W, H, FORMULA, k, 92, H * 0.2, H * 0.29);
  g.fillStyle = '#e6d9a8';
  g.textAlign = 'right';
  g.font = `500 34px ${COND}`;
  g.fillText('11 класс', W * 0.96, H * 0.08);
};

export const drawLesson = (g: CanvasRenderingContext2D, W: number, H: number) => {
  chalkLines(g, W, H, ['УРОК 1:', 'таблица умножения', '2 × 2 = 4'], 1, 84, H * 0.2, H * 0.29);
};

// a notebook page, squared paper, with lines of handwriting
const paper = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#fbfaf4';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(80,120,200,0.25)';
  g.lineWidth = 2;
  for (let x = 0; x < W; x += 24) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, H);
    g.stroke();
  }
  for (let y = 0; y < H; y += 24) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  g.strokeStyle = 'rgba(220,60,60,0.5)';
  g.beginPath();
  g.moveTo(W * 0.86, 0);
  g.lineTo(W * 0.86, H);
  g.stroke();
};

export const drawKidNotes = (g: CanvasRenderingContext2D, W: number, H: number) => {
  paper(g, W, H);
  g.fillStyle = '#2a3a8a';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.font = `500 44px ${COND}`;
  ['log₂(x+6)=3', 'x+6=8', 'x=2'].forEach((l, i) => g.fillText(l, 28, 70 + i * 72));
};

export const drawTeacherNotes = (g: CanvasRenderingContext2D, W: number, H: number) => {
  paper(g, W, H);
  g.strokeStyle = '#3a3a5a';
  g.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    for (let x = 0; x < W * 0.7; x += 8) g.lineTo(28 + x, 70 + i * 70 + Math.sin(x * 0.2 + i) * 8);
    g.stroke();
  }
  g.fillStyle = '#c03a3a';
  g.font = `700 64px ${COND}`;
  g.fillText('?', W * 0.75, 80);
};

// dad's homework: 7 × 8 = 54 (the comment bait), the son's red «5»
export const drawDadNotes = (g: CanvasRenderingContext2D, W: number, H: number, five: number) => {
  paper(g, W, H);
  g.fillStyle = '#2a3a8a';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.font = `500 64px ${COND}`;
  ['6 × 7 = 42', '7 × 8 = 54', '9 × 3 = 27'].forEach((l, i) => g.fillText(l, 30, 80 + i * 96));
  if (five > 0) {
    g.strokeStyle = '#d8322a';
    g.fillStyle = '#d8322a';
    g.lineWidth = 7;
    g.font = `700 ${Math.round(150 * Math.min(1, 0.6 + five))}px ${COND}`;
    g.textAlign = 'center';
    g.globalAlpha = clamp(five * 3);
    g.fillText('5', W * 0.78, H * 0.62);
    g.beginPath();
    g.arc(W * 0.78, H * 0.6, 80, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(five * 1.5 - 0.3));
    g.stroke();
    g.globalAlpha = 1;
  }
};

// a speech bubble with text (tail at the bottom left)
export const drawBubble = (text: string, col = '#2a1f3a', bg = '#ffffff') => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.clearRect(0, 0, W, H);
  g.fillStyle = bg;
  roundRect(g, 8, 8, W - 16, H * 0.74, H * 0.18);
  g.fill();
  g.beginPath();
  g.moveTo(W * 0.2, H * 0.7);
  g.lineTo(W * 0.14, H * 0.98);
  g.lineTo(W * 0.36, H * 0.72);
  g.closePath();
  g.fill();
  g.fillStyle = col;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, text, W * 0.84, H * 0.36, 700);
  g.fillText(text, W / 2, H * 0.39);
};

// the whiteboard plan in the basement (portrait board): «ДЕТИ / УМНЕЕ / НАС», arrow, «СДЕЛАТЬ / ГЛУПЕЕ» circled
export const drawPlan = (g: CanvasRenderingContext2D, W: number, H: number, a: number, b: number) => {
  g.fillStyle = '#f4f4f0';
  g.fillRect(0, 0, W, H);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const top = ['ДЕТИ', 'УМНЕЕ', 'НАС'];
  const n1 = top.join('').length;
  let left = Math.floor(n1 * clamp(a));
  g.fillStyle = '#2a3a8a';
  g.font = `700 76px ${COND}`;
  top.forEach((l, i) => {
    if (left <= 0) return;
    g.fillText(l.slice(0, left), W / 2, H * (0.09 + i * 0.12));
    left -= l.length;
  });
  if (b > 0) {
    g.strokeStyle = '#2a3a8a';
    g.lineWidth = 9;
    g.lineCap = 'round';
    const y0 = H * 0.42;
    const y1 = H * 0.56;
    g.beginPath();
    g.moveTo(W / 2, y0);
    g.lineTo(W / 2, y0 + (y1 - y0) * clamp(b * 2.5));
    g.stroke();
    if (b > 0.4) {
      g.beginPath();
      g.moveTo(W / 2 - 26, y1 - 30);
      g.lineTo(W / 2, y1);
      g.lineTo(W / 2 + 26, y1 - 30);
      g.stroke();
      const bot = ['СДЕЛАТЬ', 'ГЛУПЕЕ'];
      const n2 = bot.join('').length;
      let l2 = Math.floor(n2 * clamp((b - 0.4) * 2.2));
      g.fillStyle = '#d8322a';
      g.font = `700 80px ${COND}`;
      bot.forEach((l, i) => {
        if (l2 <= 0) return;
        g.fillText(l.slice(0, l2), W / 2, H * (0.67 + i * 0.14));
        l2 -= l.length;
      });
      if (b > 0.88) {
        g.strokeStyle = '#d8322a';
        g.lineWidth = 7;
        g.beginPath();
        g.ellipse(W / 2, H * 0.74, W * 0.42, H * 0.16, -0.04, 0, Math.PI * 2 * clamp((b - 0.88) * 8.3));
        g.stroke();
      }
    }
  }
};

// endless cartoon: a round bouncing bunny on a bright field
export const drawCartoon = (g: CanvasRenderingContext2D, W: number, H: number, t: number, seed: number) => {
  const bgs = ['#ffd84a', '#7fe0ff', '#ff9fd0', '#b4ff7a'];
  g.fillStyle = bgs[seed % 4];
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 6; i++) {
    g.beginPath();
    g.arc(((i * 140 + t * 60 * (seed + 1)) % (W + 100)) - 50, H * (0.15 + 0.12 * (i % 3)), 40, 0, Math.PI * 2);
    g.fill();
  }
  const y = H * 0.62 - Math.abs(Math.sin(t * 5 + seed)) * H * 0.18;
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.arc(W / 2, y, W * 0.22, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(W / 2 - W * 0.1, y - W * 0.3, W * 0.05, W * 0.14, -0.2, 0, Math.PI * 2);
  g.ellipse(W / 2 + W * 0.1, y - W * 0.3, W * 0.05, W * 0.14, 0.2, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1b1b22';
  g.beginPath();
  g.arc(W / 2 - W * 0.07, y - W * 0.03, W * 0.025, 0, Math.PI * 2);
  g.arc(W / 2 + W * 0.07, y - W * 0.03, W * 0.025, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#5a4a3a';
  g.fillRect(0, H * 0.84, W, H * 0.16);
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, `серия ${1000 + ((seed * 37 + Math.floor(t * 2)) % 9000)}`, W * 0.8, 46, 700);
  g.fillText(`серия ${1000 + ((seed * 37 + Math.floor(t * 2)) % 9000)}`, W / 2, H * 0.92);
};

// a small phone screen in the tower: code / green bars
export const drawTile = (g: CanvasRenderingContext2D, W: number, H: number, seed: number) => {
  g.fillStyle = '#0d1a14';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 9; i++) {
    g.fillStyle = (i + seed) % 3 === 0 ? '#7cff9a' : '#2fae5a';
    g.fillRect(10, 14 + i * 26, 30 + ((i * 53 + seed * 31) % (W - 50)), 12);
  }
};

// the big screen on top of the tower: scanning, then the verdict
export const drawTower = (g: CanvasRenderingContext2D, W: number, H: number, scan: number, found: number, blink: number) => {
  g.fillStyle = found > 0 ? (blink ? '#c0302a' : '#9a2420') : '#0d1a14';
  g.fillRect(0, 0, W, H);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (found <= 0) {
    g.fillStyle = '#7cff9a';
    fit(g, 'СУПЕРКОМПЬЮТЕР', W * 0.86, 64, 700);
    g.fillText('СУПЕРКОМПЬЮТЕР', W / 2, H * 0.3);
    g.strokeStyle = '#7cff9a';
    g.lineWidth = 4;
    g.strokeRect(W * 0.1, H * 0.58, W * 0.8, H * 0.16);
    g.fillRect(W * 0.1, H * 0.58, W * 0.8 * clamp(scan), H * 0.16);
    g.font = `500 34px ${COND}`;
    g.fillText(`поиск… ${Math.round(clamp(scan) * 100)}%`, W / 2, H * 0.86);
  } else {
    g.fillStyle = '#ffffff';
    fit(g, 'ЗАГОВОР ВЗРОСЛЫХ:', W * 0.88, 64, 700);
    g.fillText('ЗАГОВОР ВЗРОСЛЫХ:', W / 2, H * 0.34);
    g.fillStyle = '#ffd23f';
    fit(g, 'НАЙДЕН', W * 0.8, 120, 700);
    g.fillText('НАЙДЕН', W / 2, H * 0.68);
  }
};

// the empty game: sign over the conveyor
export const drawGameSign = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#ffcf3a';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#2a1f3a';
  g.lineWidth = 10;
  g.strokeRect(5, 5, W - 10, H - 10);
  g.fillStyle = '#2a1f3a';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, 'БРЕЙНРОТЫ: 0', W * 0.84, H * 0.56, 700);
  g.fillText('БРЕЙНРОТЫ: 0', W / 2, H * 0.53);
};

// textbook cover
export const drawBook = (title: string, bg: string) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, title, W * 0.84, H * 0.16, 700);
  g.fillText(title, W / 2, H * 0.3);
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.beginPath();
  g.arc(W / 2, H * 0.66, W * 0.2, 0, Math.PI * 2);
  g.fill();
};
