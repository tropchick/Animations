import React from 'react';
import {AdditiveBlending} from 'three';
import {V3} from '../cues';
import {Box, Cyl, DARK_STEEL, Glow, Mat, RUBBER, STEEL} from '../parts';
import {Screen, useScreen} from '../screens';

const MONO = "'IBM Plex Mono'";
const OLIVE_PLASTIC: Mat = {color: '#2e332e', rough: 0.55, metal: 0.15, env: 0.8};

// ---------------------------------------------------------------- the staff walkie-talkie

// channel: the number on the display; scanning: the arrows blink; led: 0..1 green
export const StaffRadio: React.FC<{position: V3; rotation?: V3; channel: number; freq: string; scanning: boolean; led: number; v: number}> = ({
  position,
  rotation,
  channel,
  freq,
  scanning,
  led,
  v,
}) => {
  const key = `${channel}-${scanning ? Math.floor(v * 3) % 2 : 'x'}-${led > 0.02}`;
  const tex = useScreen(
    256,
    128,
    (c) => {
      c.fillStyle = led > 0.02 ? '#0b1c14' : '#0a1312';
      c.fillRect(0, 0, 256, 128);
      c.fillStyle = '#8fe0b0';
      c.font = `500 26px ${MONO}`;
      c.fillText(scanning ? (Math.floor(v * 3) % 2 ? 'СКАН ▶▶' : 'СКАН') : 'ПРИЁМ', 14, 34);
      c.font = `500 58px ${MONO}`;
      c.fillText(`К-${String(channel).padStart(2, '0')}`, 14, 94);
      c.font = `500 24px ${MONO}`;
      c.fillStyle = '#5fa883';
      c.fillText(freq, 150, 120);
    },
    key,
  );
  return (
    <group position={position} rotation={rotation}>
      <Box size={[0.078, 0.2, 0.046]} position={[0, 0.1, 0]} m={OLIVE_PLASTIC} />
      <Box size={[0.082, 0.025, 0.05]} position={[0, 0.012, 0]} m={RUBBER} />
      <Cyl r={0.008} h={0.24} seg={6} position={[0.024, 0.32, -0.006]} m={RUBBER} />
      <Cyl r={0.012} h={0.02} seg={10} position={[-0.02, 0.21, -0.006]} m={DARK_STEEL} />
      {Array.from({length: 7}).map((_, i) => (
        <Box key={i} size={[0.052, 0.003, 0.002]} position={[0, 0.03 + i * 0.008, 0.0235]} m={{color: '#0c0e10', rough: 1}} shadow={false} />
      ))}
      <Screen tex={tex} size={[0.058, 0.029]} position={[0, 0.15, 0.0236]} power={0.9} />
      {/* the led on top, next to the knob */}
      <Cyl r={0.0035} h={0.004} seg={10} position={[0.0, 0.2025, 0.012]} m={led > 0.02 ? {color: '#5dff8f', emissive: '#5dff8f', glow: 0.6 + led * 3.5} : {color: '#123018'}} shadow={false} />
      {led > 0.02 ? (
        <mesh position={[0, 0.2025, 0.012]}>
          <sphereGeometry args={[0.006 + 0.006 * led, 12, 8]} />
          <meshBasicMaterial color="#5dff8f" transparent opacity={0.25 * led} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ) : null}
      {led > 0.02 ? <pointLight position={[0, 0.23, 0.03]} color="#5dff8f" intensity={0.08 * led} distance={0.5} decay={2} /> : null}
      <Box size={[0.006, 0.05, 0.02]} position={[-0.042, 0.13, 0]} m={DARK_STEEL} shadow={false} />
    </group>
  );
};

// ---------------------------------------------------------------- the old kitchen radio with a glowing dial

export const KitchenRadio: React.FC<{position: V3; rotation?: number; needle: number}> = ({position, rotation = 0, needle}) => {
  const tex = useScreen(
    512,
    128,
    (c) => {
      const g = c.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, '#3b3520');
      g.addColorStop(1, '#5d5532');
      c.fillStyle = g;
      c.fillRect(0, 0, 512, 128);
      c.strokeStyle = '#2a2414';
      c.fillStyle = '#2a2414';
      c.lineWidth = 2;
      for (let i = 0; i <= 40; i++) {
        const x = 20 + i * 11.8;
        c.beginPath();
        c.moveTo(x, 70);
        c.lineTo(x, i % 5 === 0 ? 46 : 58);
        c.stroke();
      }
      c.font = `500 20px ${MONO}`;
      ['66', '70', '74', '88', '92', '96', '100', '104'].forEach((t, i) => c.fillText(t, 14 + i * 64, 100));
      c.font = `500 16px ${MONO}`;
      c.fillText('УКВ', 14, 26);
      c.fillStyle = '#c0392b';
      c.fillRect(20 + needle * 472, 10, 4, 108);
    },
    needle,
  );
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box size={[0.42, 0.22, 0.14]} position={[0, 0.11, 0]} m={{color: '#3a332c', rough: 0.6, metal: 0.05}} />
      <Box size={[0.44, 0.012, 0.15]} position={[0, 0.226, 0]} m={{color: '#2a2521', rough: 0.6}} shadow={false} />
      {/* speaker cloth */}
      <Box size={[0.17, 0.15, 0.004]} position={[-0.105, 0.11, 0.071]} m={{color: '#7c7462', rough: 1}} shadow={false} />
      <Screen tex={tex} size={[0.19, 0.06]} position={[0.095, 0.15, 0.0712]} power={1.1} />
      {[0.04, 0.15].map((x) => (
        <Cyl key={x} r={0.017} h={0.02} seg={10} position={[x, 0.065, 0.078]} rotation={[Math.PI / 2, 0, 0]} m={{color: '#c9c4b5', rough: 0.4, metal: 0.4}} shadow={false} />
      ))}
      <pointLight position={[0.09, 0.15, 0.2]} color="#e8d9a0" intensity={0.25} distance={1.2} decay={2} />
    </group>
  );
};

// ---------------------------------------------------------------- the phone in Gleb's hand

const crossedIcon = (c: CanvasRenderingContext2D, x: number, y: number, r: number, k: number) => {
  c.strokeStyle = '#9aa7ae';
  c.lineWidth = 5;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.moveTo(x - r, y);
  c.lineTo(x + r, y);
  c.ellipse(x, y, r * 0.45, r, 0, 0, Math.PI * 2);
  c.stroke();
  if (k > 0) {
    c.strokeStyle = '#ff4a3d';
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(x - r * 1.1, y + r * 1.1);
    c.lineTo(x - r * 1.1 + r * 2.2 * k, y + r * 1.1 - r * 2.2 * k);
    c.stroke();
  }
};

// state: 0 searching, 1 "no network", then k of the crossed-out internet icon
export const Phone: React.FC<{position: V3; rotation?: V3; noNet: boolean; cross: number; v: number}> = ({position, rotation, noNet, cross, v}) => {
  const blink = Math.floor(v * 2) % 2;
  const tex = useScreen(
    360,
    720,
    (c) => {
      c.fillStyle = '#0d1418';
      c.fillRect(0, 0, 360, 720);
      // status bar: empty signal bars
      c.fillStyle = '#6d7b82';
      for (let i = 0; i < 4; i++) c.fillRect(22 + i * 12, 40 - i * 6, 8, 6 + i * 6);
      c.fillStyle = '#0d1418';
      for (let i = 0; i < 4; i++) c.fillRect(24 + i * 12, 42 - i * 6, 4, 2 + i * 6);
      c.fillStyle = '#9aa7ae';
      c.font = `500 22px ${MONO}`;
      c.fillText('22:04', 270, 42);
      c.textAlign = 'center';
      c.fillStyle = '#d5dde1';
      c.font = `500 44px ${MONO}`;
      if (noNet) c.fillText('Нет сети', 180, 250);
      else if (blink) c.fillText('Поиск...', 180, 250);
      c.font = `500 22px ${MONO}`;
      c.fillStyle = '#6d7b82';
      if (noNet) c.fillText('Только экстренные', 180, 300);
      if (noNet) c.fillText('вызовы', 180, 330);
      if (cross > 0) {
        crossedIcon(c, 180, 470, 54, cross);
        c.fillStyle = '#9aa7ae';
        c.fillText('Нет подключения', 180, 580);
      }
    },
    `${noNet}-${blink}-${Math.round(cross * 20)}`,
  );
  return (
    <group position={position} rotation={rotation}>
      <Box size={[0.072, 0.15, 0.009]} position={[0, 0, 0]} m={{color: '#16191c', rough: 0.35, metal: 0.4, env: 1}} />
      <Screen tex={tex} size={[0.066, 0.138]} position={[0, 0, 0.0053]} power={0.9} />
      <Box size={[0.012, 0.012, 0.004]} position={[0, 0.066, -0.005]} m={STEEL} shadow={false} />
      <pointLight position={[0, 0, 0.06]} color="#bcd2dd" intensity={0.15} distance={0.5} decay={2} />
    </group>
  );
};

export {Glow};
