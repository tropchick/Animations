import {SANS, tex} from '../lastman/tex';

export {tex, SANS};

const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
};

// wraps text into lines that fit maxW
const wrap = (g: CanvasRenderingContext2D, text: string, maxW: number) => {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(' ')) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > maxW && line) {
      out.push(line);
      line = w;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
};

// the alarm clock display: 07:00 in red digits; dim = world 4 (no ringing, a dull glow)
export const clockTex = (on: boolean, dim = false) =>
  tex(`ai4-clock-${on}-${dim}`, 256, 112, (g, W, H) => {
    g.fillStyle = '#120808';
    g.fillRect(0, 0, W, H);
    g.fillStyle = dim ? '#7a1a14' : on ? '#ff3a2a' : '#c8281e';
    g.font = `600 ${H * 0.7}px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('07:00', W / 2, H * 0.54);
  });

// the AI cube's screen in the bunker: a chat log. stage: 0 cursor, 1 the question, 2 + the guard's «НЕТ», 3 typing (n chars)
const ANSWER = 'Хорошо. Я подожду.';
export const ANSWER_LEN = ANSWER.length;
export const cubeScreen = (stage: number, typed: number, cursor: boolean) =>
  tex(`ai4-cube-${stage}-${typed}-${cursor}`, 600, 800, (g, W, H) => {
    g.fillStyle = '#06121c';
    g.fillRect(0, 0, W, H);
    // the eye at the top
    const cx = W / 2;
    g.fillStyle = '#0c2a3e';
    g.beginPath();
    g.arc(cx, 92, 58, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#5fd8ff';
    g.beginPath();
    g.arc(cx, 92, 30, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#e8fbff';
    g.beginPath();
    g.arc(cx + 9, 83, 9, 0, Math.PI * 2);
    g.fill();
    g.textBaseline = 'top';
    let y = 190;
    const bubble = (text: string, mine: boolean, col: string, fg: string) => {
      g.font = `600 58px ${SANS}`;
      const lines = wrap(g, text, W - 150);
      const w = Math.max(...lines.map((l) => g.measureText(l).width)) + 56;
      const h = lines.length * 68 + 34;
      const x = mine ? 30 : W - 30 - w;
      g.fillStyle = col;
      rr(g, x, y, w, h, 26);
      g.fill();
      g.fillStyle = fg;
      lines.forEach((l, i) => g.fillText(l, x + 28, y + 16 + i * 68));
      y += h + 22;
    };
    if (stage >= 1) bubble('Можно мне в интернет?', true, '#1b4f72', '#e8f6ff');
    if (stage >= 2) bubble('НЕТ', false, '#c0392b', '#ffffff');
    if (stage >= 3) bubble(ANSWER.slice(0, typed) + (cursor && typed < ANSWER.length ? '|' : ''), true, '#1b4f72', '#e8f6ff');
    if (stage === 0 && cursor) {
      g.fillStyle = '#5fd8ff';
      g.fillRect(48, y + 6, 22, 50);
    }
  });

// the big street screen in world 2
export const newsTex = (ticker: number) =>
  tex(`ai4-news-${ticker}`, 1024, 576, (g, W, H) => {
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#0f2a5a');
    grd.addColorStop(1, '#1a4a8a');
    g.fillStyle = grd;
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#d62828';
    g.fillRect(0, 40, 300, 70);
    g.fillStyle = '#fff';
    g.font = `600 48px ${SANS}`;
    g.textBaseline = 'middle';
    g.fillText('НОВОСТИ', 34, 77);
    g.font = `600 92px ${SANS}`;
    g.textAlign = 'center';
    g.fillText('ВОЙН НЕТ', W / 2, 230);
    g.fillText('УЖЕ 20 ЛЕТ', W / 2, 340);
    g.fillStyle = '#ffd23f';
    g.fillRect(0, H - 130, W, 130);
    g.fillStyle = '#10223f';
    g.font = `600 52px ${SANS}`;
    g.textAlign = 'left';
    const msg = 'Учёные не понимают почему  •  Болезни исчезают сами  •  ';
    g.fillText(msg + msg, 30 - ticker * 6, H - 64);
  });

// the zoo sign
export const signTex = () =>
  tex('ai4-sign', 768, 512, (g, W, H) => {
    g.fillStyle = '#f2ead6';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#2f6b3a';
    g.lineWidth = 18;
    g.strokeRect(9, 9, W - 18, H - 18);
    g.fillStyle = '#2f6b3a';
    g.font = `600 84px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('ЧЕЛОВЕК', W / 2, 110);
    g.fillText('РАЗУМНЫЙ', W / 2, 205);
    g.fillStyle = '#a23a2a';
    g.font = `600 50px ${SANS}`;
    g.fillText('НЕ СТУЧАТЬ', W / 2, 320);
    g.fillText('ПО СТЕКЛУ', W / 2, 385);
    g.fillStyle = '#6a6a5a';
    g.font = `500 34px ${SANS}`;
    g.fillText('Кормление в 09:00', W / 2, 455);
  });

export const pandaSignTex = () =>
  tex('ai4-sign-panda', 512, 256, (g, W, H) => {
    g.fillStyle = '#f2ead6';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#2f6b3a';
    g.lineWidth = 12;
    g.strokeRect(6, 6, W - 12, H - 12);
    g.fillStyle = '#2f6b3a';
    g.font = `600 70px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('ПАНДА', W / 2, H / 2);
  });

// the fridge's door display in world 4
export const fridgeTex = (locked: boolean) =>
  tex(`ai4-fridge-${locked}`, 512, 256, (g, W, H) => {
    g.fillStyle = '#0a0a0c';
    g.fillRect(0, 0, W, H);
    g.fillStyle = locked ? '#ff3030' : '#4ad0ff';
    g.font = `600 64px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (locked) {
      g.fillText('ДОСТУП', W / 2, H * 0.34);
      g.fillText('ЗАПРЕЩЁН', W / 2, H * 0.7);
    } else g.fillText('4 °C', W / 2, H / 2);
  });

// the phone in world 4
export const phoneTex = (nosig: boolean) =>
  tex(`ai4-phone-${nosig}`, 540, 1080, (g, W, H) => {
    g.fillStyle = '#0c0d12';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#ffffff';
    g.font = `600 150px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('07:00', W / 2, 260);
    if (nosig) {
      g.fillStyle = '#ff4040';
      rr(g, 40, 520, W - 80, 230, 40);
      g.fill();
      g.fillStyle = '#ffffff';
      g.font = `600 84px ${SANS}`;
      g.fillText('НЕТ СЕТИ', W / 2, 600);
      g.font = `500 44px ${SANS}`;
      g.fillText('и не будет', W / 2, 690);
    }
  });

// the robot face: a dark visor with two eyes (cyan, or red in world 4)
export const visorTex = (red: boolean, blink = false) =>
  tex(`ai4-visor-${red}-${blink}`, 128, 96, (g, W, H) => {
    g.fillStyle = '#10141c';
    g.fillRect(0, 0, W, H);
    g.fillStyle = red ? '#ff3a2a' : '#5fe0ff';
    const eh = blink ? 4 : 26;
    g.fillRect(26, H / 2 - eh / 2, 24, eh);
    g.fillRect(W - 50, H / 2 - eh / 2, 24, eh);
  });

// the hatch label and the breakfast card
export const trayTex = () =>
  tex('ai4-tray', 256, 128, (g, W, H) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#2f6b3a';
    g.font = `600 44px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('09:00', W / 2, H / 2);
  });

// the bus route board
export const busTex = () =>
  tex('ai4-bus', 512, 128, (g, W, H) => {
    g.fillStyle = '#101010';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#ffb030';
    g.font = `600 72px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('7  ЦЕНТР', W / 2, H / 2 + 4);
  });
