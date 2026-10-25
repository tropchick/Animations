import React, {useMemo} from 'react';
import {CanvasTexture, SRGBColorSpace} from 'three';
import {Box} from '../slime/parts';
import {FPS, MESSAGE_S, SENT, TICK, V3, VOICE, VOICE_START, ramp} from './cues';

const UI = "'Inter', sans-serif";
const W = 552;
const H = 1200;
export const PHONE_SIZE: [number, number, number] = [0.074, 0.156, 0.008];

export type PhoneMode = 'chat' | 'record' | 'sent' | 'call112' | 'dark';

const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
};

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const status = (c: CanvasRenderingContext2D, clock: string, battery: number) => {
  c.fillStyle = '#e8eaec';
  c.font = `600 26px ${UI}`;
  c.fillText(clock, 40, 52);
  // signal: no bars, a cross
  c.fillStyle = '#5d6166';
  for (let i = 0; i < 4; i++) c.fillRect(340 + i * 11, 48 - (i + 1) * 6, 7, (i + 1) * 6);
  c.fillStyle = '#e8eaec';
  c.font = `500 22px ${UI}`;
  c.fillText('×', 388, 50);
  c.strokeStyle = '#c9ccd0';
  c.lineWidth = 2;
  rr(c, 430, 31, 52, 24, 6);
  c.stroke();
  c.fillStyle = battery < 0.15 ? '#ff5b4d' : '#e8eaec';
  c.fillRect(434, 35, Math.max(3, 44 * battery), 16);
  c.fillStyle = '#c9ccd0';
  c.fillRect(484, 38, 4, 10);
};

const tick = (c: CanvasRenderingContext2D, x: number, y: number, color: string) => {
  c.strokeStyle = color;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + 7, y + 7);
  c.lineTo(x + 19, y - 7);
  c.stroke();
};

const bubble = (c: CanvasRenderingContext2D, out: boolean, y: number, lines: string[], time: string, ticks = 0, read = false) => {
  c.font = `400 27px ${UI}`;
  const w = Math.max(...lines.map((l) => c.measureText(l).width)) + 130;
  const h = 34 * lines.length + 34;
  const x = out ? W - 24 - w : 24;
  c.fillStyle = out ? '#244c39' : '#24272b';
  rr(c, x, y, w, h, 22);
  c.fill();
  c.fillStyle = '#eef0f1';
  lines.forEach((l, i) => c.fillText(l, x + 22, y + 40 + i * 34));
  c.fillStyle = out ? '#9fc2b0' : '#8c9196';
  c.font = `400 19px ${UI}`;
  c.fillText(time, x + w - (ticks ? 98 : 70), y + h - 14);
  const col = read ? '#5fd38d' : '#9fc2b0';
  if (ticks >= 1) tick(c, x + w - 40, y + h - 22, col);
  if (ticks >= 2) tick(c, x + w - 30, y + h - 22, col);
  return y + h;
};

const chip = (c: CanvasRenderingContext2D, y: number, text: string) => {
  c.font = `500 20px ${UI}`;
  const w = c.measureText(text).width + 36;
  c.fillStyle = '#1d2023';
  rr(c, (W - w) / 2, y, w, 36, 18);
  c.fill();
  c.fillStyle = '#9ba0a5';
  c.fillText(text, (W - w) / 2 + 18, y + 25);
};

const drawChat = (c: CanvasRenderingContext2D, mode: PhoneMode, v: number) => {
  c.fillStyle = '#0d0f11';
  c.fillRect(0, 0, W, H);
  status(c, mode === 'sent' ? '23:53' : '23:52', 0.62);
  // header
  c.fillStyle = '#16181b';
  c.fillRect(0, 76, W, 104);
  c.strokeStyle = '#c9ccd0';
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(46, 108);
  c.lineTo(30, 128);
  c.lineTo(46, 148);
  c.stroke();
  c.fillStyle = '#6f8b7b';
  c.beginPath();
  c.arc(102, 128, 32, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#f2f4f2';
  c.font = `600 30px ${UI}`;
  c.fillText('М', 91, 139);
  c.fillStyle = '#eef0f1';
  c.font = `600 30px ${UI}`;
  c.fillText('Мама', 152, 122);
  c.fillStyle = '#8c9196';
  c.font = `400 21px ${UI}`;
  c.fillText('была в сети в 03:17', 152, 153);
  // messages
  let y = 220;
  chip(c, y, 'Вчера');
  y = bubble(c, true, y + 60, ['Мам, я на смене до 23,', 'потом наберу'], '18:02', 2, true);
  y = bubble(c, false, y + 14, ['Хорошо. Поешь там'], '18:10');
  chip(c, y + 40, 'Сегодня');
  y = bubble(c, false, y + 100, ['Ты дома?'], '03:17');
  if (mode === 'sent') {
    // the voice message: play button, waveform from the real voice, length, ticks
    const bw = 400;
    const bh = 108;
    const bx = W - 24 - bw;
    const by = y + 18;
    c.fillStyle = '#244c39';
    rr(c, bx, by, bw, bh, 24);
    c.fill();
    c.fillStyle = '#5fd38d';
    c.beginPath();
    c.arc(bx + 50, by + 50, 30, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#0d2a1c';
    c.beginPath();
    c.moveTo(bx + 41, by + 34);
    c.lineTo(bx + 41, by + 66);
    c.lineTo(bx + 66, by + 50);
    c.closePath();
    c.fill();
    const bars = 34;
    const step = Math.floor((SENT - VOICE_START) * FPS / bars);
    for (let i = 0; i < bars; i++) {
      let a = 0;
      for (let k = 0; k < step; k++) a = Math.max(a, VOICE[Math.round(VOICE_START * FPS) + i * step + k] ?? 0);
      const h = 6 + a * 44;
      c.fillStyle = '#9fc2b0';
      c.fillRect(bx + 96 + i * 8, by + 50 - h / 2, 5, h);
    }
    c.fillStyle = '#9fc2b0';
    c.font = `400 19px ${UI}`;
    c.fillText(mmss(MESSAGE_S), bx + 98, by + 96);
    c.fillText('23:53', bx + bw - 102, by + 96);
    const two = v >= TICK;
    tick(c, bx + bw - 44, by + 88, two ? '#5fd38d' : '#7f8a85');
    if (two) tick(c, bx + bw - 34, by + 88, '#5fd38d');
    const d = ramp(v, TICK + 0.15, TICK + 0.6);
    if (d > 0) {
      c.globalAlpha = d;
      c.fillStyle = '#8c9196';
      c.font = `400 20px ${UI}`;
      c.fillText('доставлено', W - 24 - 120, by + bh + 32);
      c.globalAlpha = 1;
    }
  }
  // input bar
  c.fillStyle = '#16181b';
  c.fillRect(0, H - 128, W, 128);
  if (mode === 'record') {
    const t = Math.max(0, v - VOICE_START + 0.2);
    c.fillStyle = Math.floor(v * 2) % 2 === 0 ? '#ff4b3e' : '#6a1d18';
    c.beginPath();
    c.arc(48, H - 64, 11, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#eef0f1';
    c.font = `500 28px ${UI}`;
    c.fillText(mmss(t), 72, H - 54);
    c.fillStyle = '#7d8287';
    c.font = `400 22px ${UI}`;
    c.fillText('‹ влево — отмена', 186, H - 56);
    c.fillStyle = 'rgba(95,211,141,0.25)';
    c.beginPath();
    c.arc(W - 70, H - 66, 62, 0, Math.PI * 2);
    c.fill();
  } else {
    c.fillStyle = '#23262a';
    rr(c, 22, H - 100, W - 140, 64, 32);
    c.fill();
    c.fillStyle = '#7d8287';
    c.font = `400 26px ${UI}`;
    c.fillText('Сообщение', 52, H - 58);
  }
  c.fillStyle = '#3fa86b';
  c.beginPath();
  c.arc(W - 70, H - 66, mode === 'record' ? 44 : 34, 0, Math.PI * 2);
  c.fill();
  // microphone icon
  c.fillStyle = '#eef6f1';
  rr(c, W - 79, H - 88, 18, 30, 9);
  c.fill();
  c.strokeStyle = '#eef6f1';
  c.lineWidth = 3;
  c.beginPath();
  c.arc(W - 70, H - 68, 15, 0.1, Math.PI - 0.1);
  c.stroke();
  c.fillRect(W - 71.5, H - 53, 3, 9);
};

const drawCall = (c: CanvasRenderingContext2D, v: number, from: number) => {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1b2026');
  g.addColorStop(1, '#0b0d10');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  status(c, '07:31', 0.04);
  c.textAlign = 'center';
  c.fillStyle = '#f0f2f3';
  c.font = `500 96px ${UI}`;
  c.fillText('112', W / 2, 330);
  c.fillStyle = '#9aa0a6';
  c.font = `400 28px ${UI}`;
  c.fillText('Экстренный вызов', W / 2, 390);
  const t = v - from;
  c.fillStyle = '#d4d8db';
  c.font = `400 30px ${UI}`;
  c.fillText(t < 1.2 ? 'Вызов' + '.'.repeat(1 + (Math.floor(t * 3) % 3)) : `00:${String(Math.floor(t - 1.2)).padStart(2, '0')}`, W / 2, 450);
  // buttons
  const row = (y: number) =>
    [-1, 0, 1].forEach((k) => {
      c.fillStyle = '#2a2f35';
      c.beginPath();
      c.arc(W / 2 + k * 150, y, 52, 0, Math.PI * 2);
      c.fill();
    });
  row(720);
  row(860);
  c.fillStyle = '#e5483d';
  c.beginPath();
  c.arc(W / 2, 1040, 60, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#fff';
  rr(c, W / 2 - 30, 1030, 60, 18, 9);
  c.fill();
  c.textAlign = 'left';
};

export const Phone: React.FC<{v: number; mode: PhoneMode; position?: V3; rotation?: V3; callFrom?: number; power?: number}> = ({
  v,
  mode,
  position,
  rotation,
  callFrom = 0,
  power = 1,
}) => {
  const {canvas, tex} = useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const tx = new CanvasTexture(cv);
    tx.colorSpace = SRGBColorSpace;
    tx.anisotropy = 8;
    return {canvas: cv, tex: tx};
  }, []);
  const frame = Math.round(v * FPS);
  useMemo(() => {
    const c = canvas.getContext('2d')!;
    if (mode === 'call112') drawCall(c, v, callFrom);
    else if (mode === 'dark') {
      c.fillStyle = '#050607';
      c.fillRect(0, 0, W, H);
    } else drawChat(c, mode, v);
    tex.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, mode, canvas, tex]);
  const [w, h, d] = PHONE_SIZE;
  return (
    <group position={position} rotation={rotation}>
      <Box size={[w, h, d]} m={{color: '#1b1d20', metal: 0.5, rough: 0.35, env: 0.8}} />
      <mesh position={[0, 0, d / 2 + 0.0012]}>
        <planeGeometry args={[w - 0.006, h - 0.008]} />
        <meshBasicMaterial map={tex} toneMapped={false} color={[power, power, power]} />
      </mesh>
      {mode !== 'dark' ? <pointLight position={[0, 0, 0.06]} intensity={0.025 * power} distance={0.9} decay={2} color="#cfe6dc" /> : null}
    </group>
  );
};
