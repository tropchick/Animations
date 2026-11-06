import {COND, roundRect} from '../gta/tex';

// canvas pictures for «Солнце погасло»

// the ice cream cart sign
export const drawCartSign = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#2f7fd0';
  roundRect(g, 0, 0, W, H, 22);
  g.fill();
  g.strokeStyle = '#ffffff';
  g.lineWidth = 10;
  roundRect(g, 10, 10, W - 20, H - 20, 16);
  g.stroke();
  g.fillStyle = '#ffffff';
  g.font = `600 ${Math.round(H * 0.56)}px ${COND}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('МОРОЖЕНОЕ', W / 2, H * 0.53);
};

// solar farm display: «0 кВт» in red
export const drawPanelDisplay = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#0b0d10';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#7a8088';
  g.font = `600 ${Math.round(H * 0.17)}px ${COND}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('СОЛНЕЧНАЯ СТАНЦИЯ', W / 2, H * 0.17);
  g.fillStyle = '#ff3b30';
  g.font = `600 ${Math.round(H * 0.56)}px ${COND}`;
  g.fillText('0 кВт', W / 2, H * 0.6);
};

// a block of city windows: lit (warm), heat (orange, brighter) or off (dark)
export const drawWindows = (g: CanvasRenderingContext2D, W: number, H: number, cols: number, rows: number, seed: number, mode: 'lit' | 'heat' | 'off') => {
  g.fillStyle = '#1a1d26';
  g.fillRect(0, 0, W, H);
  const cw = W / cols;
  const rh = H / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const s = Math.sin((r * 13.1 + c * 7.7 + seed) * 12.9898) * 43758.5453;
      const f = s - Math.floor(s);
      let col = '#2a2f3c';
      if (mode === 'lit') col = f > 0.35 ? '#ffd98a' : '#3a4050';
      if (mode === 'heat') col = f > 0.12 ? (f > 0.6 ? '#ff8a3a' : '#ffb25a') : '#3a4050';
      g.fillStyle = col;
      g.fillRect(c * cw + cw * 0.2, r * rh + rh * 0.22, cw * 0.6, rh * 0.52);
    }
  }
};

// the departure board: every flight to Reykjavik
export const drawBoard = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#0a0d14';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ffd23f';
  g.font = `600 ${Math.round(H * 0.085)}px ${COND}`;
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.fillText('ВЫЛЕТ', W * 0.04, H * 0.08);
  g.textAlign = 'right';
  g.fillText('СТАТУС', W * 0.96, H * 0.08);
  const rows = 7;
  for (let i = 0; i < rows; i++) {
    const y = H * (0.2 + i * 0.115);
    g.fillStyle = i % 2 ? '#141926' : '#10141e';
    g.fillRect(0, y - H * 0.05, W, H * 0.1);
    g.fillStyle = '#f2ece0';
    g.font = `600 ${Math.round(H * 0.075)}px ${COND}`;
    g.textAlign = 'left';
    const hh = String(6 + i).padStart(2, '0');
    g.fillText(`${hh}:${i % 2 ? '30' : '00'}`, W * 0.04, y);
    g.fillText('РЕЙКЬЯВИК', W * 0.22, y);
    g.textAlign = 'right';
    g.fillStyle = i < 5 ? '#ff6a5a' : '#7ee07e';
    g.fillText(i < 5 ? 'МЕСТ НЕТ' : 'ПОСАДКА', W * 0.96, y);
  }
};

// Jupiter's bands
export const drawJupiter = (g: CanvasRenderingContext2D, W: number, H: number) => {
  const bands = ['#e8d8b8', '#c89a6a', '#efe2c8', '#b07a4a', '#e6d2b0', '#c8946a', '#f0e4cc', '#a8784e', '#e8d8b8'];
  const bh = H / bands.length;
  bands.forEach((c, i) => {
    g.fillStyle = c;
    g.fillRect(0, i * bh, W, bh + 1);
  });
  // the great red spot
  g.fillStyle = '#c2583a';
  g.beginPath();
  g.ellipse(W * 0.3, H * 0.62, W * 0.06, H * 0.05, 0, 0, Math.PI * 2);
  g.fill();
};

// a frozen sea seen from above: pale ice with cracks
export const drawIce = (g: CanvasRenderingContext2D, W: number, H: number, seed: number) => {
  g.fillStyle = '#cfe3ee';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(90,130,160,0.55)';
  g.lineWidth = 3;
  for (let i = 0; i < 26; i++) {
    const r = (k: number) => {
      const s = Math.sin((i * 31.7 + k * 17.3 + seed) * 12.9898) * 43758.5453;
      return s - Math.floor(s);
    };
    let x = r(1) * W;
    let y = r(2) * H;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += (r(3 + k) - 0.5) * W * 0.18;
      y += (r(9 + k) - 0.5) * H * 0.18;
      g.lineTo(x, y);
    }
    g.stroke();
  }
};
