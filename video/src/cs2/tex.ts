import {COND, roundRect} from '../gta/tex';

// Canvas pictures for «античит в CS2»: game screens, the ban screen, the lobby, the exam sheet, signs, the phone.
// No game logos, no real maps: a generic toy shooter look (sand boxes, a doorway, a crosshair).

const clamp = (x: number) => Math.max(0, Math.min(1, x));

export const fit = (g: CanvasRenderingContext2D, text: string, max: number, size: number, weight = 600, font = COND) => {
  let s = Math.round(size);
  g.font = `${weight} ${s}px ${font}`;
  while (g.measureText(text).width > max && s > 8) {
    s -= 2;
    g.font = `${weight} ${s}px ${font}`;
  }
  return s;
};

export const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// a generic shooter frame: warm sky, sand walls, two crates, a dark doorway, the crosshair and the HUD
export const drawGame = (g: CanvasRenderingContext2D, W: number, H: number, t: number, seed = 0) => {
  const sway = Math.sin(t * 1.3 + seed) * W * 0.012;
  const sky = g.createLinearGradient(0, 0, 0, H * 0.55);
  sky.addColorStop(0, '#7fb6e6');
  sky.addColorStop(1, '#f3d9a8');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  g.save();
  g.translate(sway, 0);
  // far wall + doorway
  g.fillStyle = '#d9b27a';
  g.fillRect(-W * 0.1, H * 0.3, W * 1.2, H * 0.4);
  g.fillStyle = '#c69a62';
  g.fillRect(-W * 0.1, H * 0.3, W * 1.2, H * 0.03);
  g.fillStyle = '#4a3424';
  roundRect(g, W * (0.44 + 0.1 * Math.sin(seed)), H * 0.38, W * 0.12, H * 0.32, 8);
  g.fill();
  // ground
  g.fillStyle = '#e6c891';
  g.fillRect(-W * 0.1, H * 0.7, W * 1.2, H * 0.3);
  // crates
  const crate = (x: number, y: number, s: number) => {
    g.fillStyle = '#b27a3e';
    g.fillRect(x, y, s, s);
    g.strokeStyle = '#7a4e22';
    g.lineWidth = s * 0.06;
    g.strokeRect(x + s * 0.06, y + s * 0.06, s * 0.88, s * 0.88);
    g.beginPath();
    g.moveTo(x + s * 0.1, y + s * 0.1);
    g.lineTo(x + s * 0.9, y + s * 0.9);
    g.stroke();
  };
  crate(W * 0.1, H * 0.52, H * 0.26);
  crate(W * 0.72, H * 0.58, H * 0.2);
  g.restore();
  // crosshair
  g.strokeStyle = '#4dff7a';
  g.lineWidth = Math.max(2, W * 0.004);
  const cx = W / 2;
  const cy = H / 2;
  const c = W * 0.018;
  g.beginPath();
  g.moveTo(cx - c * 2, cy);
  g.lineTo(cx - c * 0.6, cy);
  g.moveTo(cx + c * 0.6, cy);
  g.lineTo(cx + c * 2, cy);
  g.moveTo(cx, cy - c * 2);
  g.lineTo(cx, cy - c * 0.6);
  g.moveTo(cx, cy + c * 0.6);
  g.lineTo(cx, cy + c * 2);
  g.stroke();
  // HUD
  g.fillStyle = 'rgba(20,20,30,0.55)';
  roundRect(g, W * 0.03, H * 0.86, W * 0.18, H * 0.1, 8);
  g.fill();
  roundRect(g, W * 0.79, H * 0.86, W * 0.18, H * 0.1, 8);
  g.fill();
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${Math.round(H * 0.07)}px ${COND}`;
  g.fillText('100', W * 0.12, H * 0.912);
  g.fillText('30/90', W * 0.88, H * 0.912);
};

// the ban: a red screen, a shield and the words
export const drawBan = (g: CanvasRenderingContext2D, W: number, H: number) => {
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#e8453c');
  bg.addColorStop(1, '#a8201e');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // shield icon
  const sx = W / 2;
  const sy = H * 0.3;
  const s = H * 0.16;
  g.fillStyle = '#fff';
  g.beginPath();
  g.moveTo(sx, sy - s);
  g.quadraticCurveTo(sx + s * 0.9, sy - s * 0.85, sx + s * 0.9, sy - s * 0.6);
  g.quadraticCurveTo(sx + s * 0.9, sy + s * 0.5, sx, sy + s);
  g.quadraticCurveTo(sx - s * 0.9, sy + s * 0.5, sx - s * 0.9, sy - s * 0.6);
  g.quadraticCurveTo(sx - s * 0.9, sy - s * 0.85, sx, sy - s);
  g.fill();
  g.fillStyle = '#d32f2a';
  g.beginPath();
  g.arc(sx, sy - s * 0.05, s * 0.32, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, 'ВЫ ЗАБАНЕНЫ', W * 0.86, H * 0.2);
  g.fillText('ВЫ ЗАБАНЕНЫ', W / 2, H * 0.64);
  g.fillStyle = 'rgba(255,255,255,0.85)';
  fit(g, 'обнаружен чит', W * 0.7, H * 0.09, 500);
  g.fillText('обнаружен чит', W / 2, H * 0.82);
};

const flag = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, kind: number) => {
  const cols = [
    ['#1a1a1a', '#d8282a', '#f2c230', 'h'],
    ['#2850a8', '#ffffff', '#d8282a', 'v'],
    ['#ffffff', '#d8282a', '', 'h2'],
    ['#c8202a', '#f2c230', '#c8202a', 'h'],
  ][kind];
  if (cols[3] === 'h2') {
    g.fillStyle = cols[0];
    g.fillRect(x, y, w, h / 2);
    g.fillStyle = cols[1];
    g.fillRect(x, y + h / 2, w, h / 2);
  } else if (cols[3] === 'v') {
    for (let i = 0; i < 3; i++) {
      g.fillStyle = cols[i];
      g.fillRect(x + (w / 3) * i, y, w / 3 + 1, h);
    }
  } else {
    const hs = kind === 3 ? [0.25, 0.5, 0.25] : [1 / 3, 1 / 3, 1 / 3];
    let yy = y;
    for (let i = 0; i < 3; i++) {
      g.fillStyle = cols[i];
      g.fillRect(x, yy, w, h * hs[i] + 1);
      yy += h * hs[i];
    }
  }
  g.strokeStyle = 'rgba(0,0,0,0.25)';
  g.lineWidth = 2;
  g.strokeRect(x, y, w, h);
};

// the lobby: four players in all of Europe
export const drawLobby = (g: CanvasRenderingContext2D, W: number, H: number, shown: number, pulse: number) => {
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1f2a44');
  bg.addColorStop(1, '#2c2140');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ffd23f';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, 'ПОИСК МАТЧА: ЕВРОПА', W * 0.86, H * 0.12);
  g.fillText('ПОИСК МАТЧА: ЕВРОПА', W / 2, H * 0.14);
  const names = ['Ганс', 'Пьер', 'Марек', 'Хуан'];
  const cols = ['#ff9f43', '#5aa0e6', '#e85d75', '#7fd6c2'];
  for (let i = 0; i < 4; i++) {
    const k = clamp(shown - i);
    if (k <= 0) continue;
    const cx = W * (0.14 + i * 0.24);
    const cy = H * 0.5;
    const r = H * 0.14 * (0.6 + 0.4 * k);
    g.globalAlpha = k;
    g.fillStyle = cols[i];
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff';
    fit(g, names[i][0], r * 1.4, r * 1.2, 600);
    g.fillText(names[i][0], cx, cy + r * 0.05);
    flag(g, cx - r * 0.55, cy + r * 1.15, r * 1.1, r * 0.7, i);
    g.fillStyle = '#ffffff';
    fit(g, names[i], W * 0.2, H * 0.075, 500);
    g.fillText(names[i], cx, cy + r * 2.25);
    g.globalAlpha = 1;
  }
  g.fillStyle = `rgba(255,255,255,${0.75 + 0.25 * pulse})`;
  fit(g, 'ИГРОКОВ НАЙДЕНО: 4 ИЗ 10', W * 0.86, H * 0.085, 500);
  g.fillText('ИГРОКОВ НАЙДЕНО: 4 ИЗ 10', W / 2, H * 0.92);
};

// kill feed over the game: the same "honest" cheater again and again
export const drawKills = (g: CanvasRenderingContext2D, W: number, H: number, t: number, n: number) => {
  drawGame(g, W, H, t, 2);
  const lines = ['чесный_игрок', 'чесный_игрок', 'чесный_игрок', 'чесный_игрок'];
  const victims = ['Игрок', 'Саня', 'Dimon', 'ты'];
  for (let i = 0; i < Math.min(n, 4); i++) {
    const y = H * (0.06 + i * 0.1);
    g.fillStyle = 'rgba(20,20,30,0.75)';
    roundRect(g, W * 0.4, y, W * 0.57, H * 0.085, 6);
    g.fill();
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.font = `600 ${Math.round(H * 0.055)}px ${COND}`;
    g.fillStyle = '#ff6a5a';
    g.fillText(lines[i], W * 0.42, y + H * 0.045);
    g.fillStyle = '#ffd23f';
    g.fillText('⌖ сквозь стену', W * 0.62, y + H * 0.045);
    g.fillStyle = '#9ad0ff';
    g.textAlign = 'right';
    g.fillText(victims[i], W * 0.95, y + H * 0.045);
  }
};

// the phone: a notification from Valve
export const drawNote = (g: CanvasRenderingContext2D, W: number, H: number, k: number) => {
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#3a4a7a');
  bg.addColorStop(1, '#1a2036');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `500 ${Math.round(W * 0.26)}px ${COND}`;
  g.fillText('12:01', W / 2, H * 0.17);
  if (k <= 0) return;
  const y = H * (0.33 - 0.04 * (1 - k));
  g.globalAlpha = k;
  g.fillStyle = 'rgba(245,245,250,0.95)';
  roundRect(g, W * 0.06, y, W * 0.88, H * 0.2, 28);
  g.fill();
  g.fillStyle = '#5a6070';
  roundRect(g, W * 0.1, y + H * 0.025, W * 0.14, W * 0.14, 14);
  g.fill();
  g.fillStyle = '#fff';
  g.font = `600 ${Math.round(W * 0.1)}px ${COND}`;
  g.fillText('V', W * 0.17, y + H * 0.025 + W * 0.07);
  g.textAlign = 'left';
  g.fillStyle = '#1a1a22';
  g.font = `600 ${Math.round(W * 0.075)}px ${COND}`;
  g.fillText('Valve', W * 0.28, y + H * 0.05);
  g.fillStyle = '#2a2a33';
  fit(g, 'Мы работаем над этим.', W * 0.8, W * 0.075, 500);
  g.fillText('Мы работаем над этим.', W * 0.1, y + H * 0.135);
  g.globalAlpha = 1;
};

// the satellite's scanner screen
export const drawScan = (g: CanvasRenderingContext2D, W: number, H: number, stage: number, blinkOn: number) => {
  g.fillStyle = '#10141f';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255,80,70,0.35)';
  g.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    g.beginPath();
    g.moveTo(0, (H * i) / 6);
    g.lineTo(W, (H * i) / 6);
    g.stroke();
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (stage < 1) {
    g.fillStyle = '#ff6a5a';
    fit(g, 'СКАНИРОВАНИЕ...', W * 0.86, H * 0.2);
    g.fillText('СКАНИРОВАНИЕ...', W / 2, H / 2);
    return;
  }
  g.fillStyle = blinkOn ? '#ff4a3a' : '#c0302a';
  roundRect(g, W * 0.05, H * 0.12, W * 0.9, H * 0.36, 12);
  g.fill();
  g.fillStyle = '#fff';
  fit(g, 'ОБНАРУЖЕН ЧИТ: ВХ', W * 0.82, H * 0.2);
  g.fillText('ОБНАРУЖЕН ЧИТ: ВХ', W / 2, H * 0.3);
  g.fillStyle = '#ffd23f';
  fit(g, 'НАРУШИТЕЛЬ: АНТИЧИТ', W * 0.86, H * 0.17);
  g.fillText('НАРУШИТЕЛЬ: АНТИЧИТ', W / 2, H * 0.72);
};

// the exam answer sheet; red = banned
export const drawSheet = (g: CanvasRenderingContext2D, W: number, H: number, red: number, seed: number) => {
  g.fillStyle = '#fbfaf4';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#2a3a8a';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.font = `600 ${Math.round(H * 0.08)}px ${COND}`;
  g.fillText('ЕГЭ · бланк ответов', W * 0.08, H * 0.08);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 4; c++) {
      const x = W * (0.1 + c * 0.21);
      const y = H * (0.18 + r * 0.095);
      g.strokeStyle = '#8a9ac8';
      g.lineWidth = 2;
      g.strokeRect(x, y, W * 0.07, H * 0.06);
      if ((r * 4 + c + seed) % 3 === 0) {
        g.strokeStyle = '#2a3a8a';
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x + W * 0.012, y + H * 0.03);
        g.lineTo(x + W * 0.03, y + H * 0.05);
        g.lineTo(x + W * 0.06, y + H * 0.008);
        g.stroke();
      }
    }
  }
  if (red > 0) {
    g.fillStyle = `rgba(220,40,36,${0.82 * red})`;
    g.fillRect(0, 0, W, H);
    g.save();
    g.translate(W / 2, H / 2);
    g.rotate(-0.25);
    g.globalAlpha = red;
    g.strokeStyle = '#fff';
    g.lineWidth = H * 0.025;
    roundRect(g, -W * 0.38, -H * 0.12, W * 0.76, H * 0.24, 14);
    g.stroke();
    g.fillStyle = '#fff';
    g.textAlign = 'center';
    fit(g, 'БАН', W * 0.6, H * 0.2);
    g.fillText('БАН', 0, H * 0.01);
    g.restore();
  }
};

// a flat sign (board, banner, plate)
export const drawSign = (text: string, bg: string, fg: string, sub?: string, subCol?: string) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (sub) {
    fit(g, text, W * 0.9, H * 0.52);
    g.fillText(text, W / 2, H * 0.38);
    g.fillStyle = subCol ?? fg;
    fit(g, sub, W * 0.86, H * 0.24, 500);
    g.fillText(sub, W / 2, H * 0.78);
  } else {
    fit(g, text, W * 0.88, H * 0.66);
    g.fillText(text, W / 2, H * 0.54);
  }
};

// the arena banner: «МАЖОР» in gold on purple with lights
export const drawMajor = (g: CanvasRenderingContext2D, W: number, H: number) => {
  const bg = g.createLinearGradient(0, 0, W, 0);
  bg.addColorStop(0, '#3a1f6a');
  bg.addColorStop(0.5, '#5a2a8a');
  bg.addColorStop(1, '#3a1f6a');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 24; i++) {
    g.fillStyle = i % 2 ? '#ffd23f' : '#ff8fd0';
    g.beginPath();
    g.arc(W * (i + 0.5) / 24, H * 0.08, H * 0.03, 0, Math.PI * 2);
    g.arc(W * (i + 0.5) / 24, H * 0.92, H * 0.03, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#ffd23f';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, 'МАЖОР', W * 0.6, H * 0.6);
  g.fillText('МАЖОР', W / 2, H * 0.53);
};

// a game screen with a «БОТ» label in the corner (the bots' monitors)
export const drawBotScreen = (g: CanvasRenderingContext2D, W: number, H: number, t: number, i: number) => {
  drawGame(g, W, H, t, i);
  g.fillStyle = 'rgba(30,30,40,0.7)';
  roundRect(g, W * 0.03, H * 0.04, W * 0.24, H * 0.13, 8);
  g.fill();
  g.fillStyle = '#9ad0ff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${Math.round(H * 0.08)}px ${COND}`;
  g.fillText(`БОТ ${i + 1}`, W * 0.15, H * 0.105);
};

// the shield inside the monitor (before it climbs out)
export const drawShieldScreen = (g: CanvasRenderingContext2D, W: number, H: number, glow: number) => {
  g.fillStyle = '#0f1424';
  g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.6);
  gr.addColorStop(0, `rgba(255,90,70,${0.45 * glow})`);
  gr.addColorStop(1, 'rgba(255,90,70,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#9ad0ff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, 'АНТИЧИТ v2.0: ОБНОВЛЕНИЕ 100%', W * 0.9, H * 0.08, 500);
  g.fillText('АНТИЧИТ v2.0: ОБНОВЛЕНИЕ 100%', W / 2, H * 0.9);
};

// the cake plate «1 МЕСЯЦ ВМЕСТЕ»
export const drawCake = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#fff7e8';
  roundRect(g, 0, 0, W, H, H * 0.3);
  g.fill();
  g.fillStyle = '#d8531c';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, '1 МЕСЯЦ ВМЕСТЕ', W * 0.86, H * 0.6);
  g.fillText('1 МЕСЯЦ ВМЕСТЕ', W / 2, H * 0.54);
};
