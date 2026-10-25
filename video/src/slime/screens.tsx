import React, {useMemo} from 'react';
import {random} from 'remotion';
import {CanvasTexture, SRGBColorSpace} from 'three';
import {COUNT_ZERO, VOICE, FPS, V3} from './cues';
import {useScene} from './scene';

const MONO = "'IBM Plex Mono'";

// A canvas drawn again on every frame from the current time, used as a glowing screen.
export const useScreen = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, key: unknown) => {
  const {canvas, tex} = useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const tx = new CanvasTexture(cv);
    tx.colorSpace = SRGBColorSpace;
    return {canvas: cv, tex: tx};
  }, [w, h]);
  useMemo(() => {
    draw(canvas.getContext('2d')!);
    tex.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, canvas, tex]);
  return tex;
};

export const Screen: React.FC<{tex: CanvasTexture; size: [number, number]; position?: V3; rotation?: V3; power?: number}> = ({
  tex,
  size,
  position,
  rotation,
  power = 1,
}) => (
  <mesh position={position} rotation={rotation}>
    <planeGeometry args={size} />
    <meshBasicMaterial map={tex} toneMapped={false} color={[power, power, power]} />
  </mesh>
);

// Voice recorder display: blinking dot, the log label and a waveform that follows the voice.
export const RecorderScreen: React.FC<{v: number; size: [number, number]; position?: V3; rotation?: V3}> = ({v: v1, ...p}) => {
  const ep = useScene();
  const v = ep ? ep.v : v1;
  const voice = ep ? ep.voice : VOICE;
  const frame = Math.round(v * FPS);
  const tex = useScreen(
    512,
    256,
    (c) => {
      c.fillStyle = '#071012';
      c.fillRect(0, 0, 512, 256);
      c.fillStyle = Math.floor(v * 1.6) % 2 === 0 ? '#ff3b30' : '#5a1512';
      c.beginPath();
      c.arc(34, 38, 12, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#b8d4dc';
      c.font = `500 30px ${MONO}`;
      c.fillText(`ЗАП  ${ep ? ep.log : 19}`, 58, 49);
      const sec = Math.floor(v);
      c.fillText(`00:${String(sec).padStart(2, '0')}`, 372, 49);
      c.fillStyle = '#7fa6b1';
      for (let i = 0; i < 46; i++) {
        const a = voice[Math.max(0, frame - 45 + i)] ?? 0;
        const hgt = 4 + a * 120;
        c.fillRect(22 + i * 10.4, 160 - hgt / 2, 6, hgt);
      }
      c.fillStyle = '#3c5960';
      c.font = `500 20px ${MONO}`;
      c.fillText(`${ep ? ep.clock : '03:40'}  НОЧЬ`, 22, 236);
    },
    frame,
  );
  return <Screen tex={tex} {...p} />;
};

// Chamber monitor (portrait panel): the unit counter that drops to zero at 03:52.
export const CounterScreen: React.FC<{v: number; count?: number; size: [number, number]; position?: V3; rotation?: V3}> = ({
  v: v1,
  count,
  ...p
}) => {
  const ep = useScene();
  const v = ep ? ep.v + 1000 : v1;
  const n = count ?? (v < COUNT_ZERO ? 1 : 0);
  const zero = n === 0;
  const sec = 4 + Math.floor(Math.max(0, v - COUNT_ZERO + 3));
  const frame = Math.round(v * FPS);
  const tex = useScreen(
    360,
    540,
    (c) => {
      c.fillStyle = zero ? '#140607' : '#060d10';
      c.fillRect(0, 0, 360, 540);
      c.strokeStyle = zero ? '#5c1a17' : '#1f3a42';
      c.lineWidth = 3;
      c.strokeRect(12, 12, 336, 516);
      c.textAlign = 'center';
      c.fillStyle = '#8fb3bd';
      c.font = `500 24px ${MONO}`;
      c.fillText('КАМЕРА 1', 180, 58);
      c.fillText(`03:52:${String(sec).padStart(2, '0')}`, 180, 92);
      c.fillStyle = zero ? '#ff4a3d' : '#cfe6ec';
      c.font = `500 30px ${MONO}`;
      c.fillText('ОБРАЗЦОВ', 180, 168);
      c.fillText('В КАМЕРЕ', 180, 206);
      c.font = ep?.counter ? `500 52px ${MONO}` : `500 200px ${MONO}`;
      const blinkOn = !zero || Math.floor((v - COUNT_ZERO) * 3) % 2 === 0;
      if (blinkOn) c.fillText(ep?.counter ?? String(n), 180, ep?.counter ? 345 : 410);
      c.fillStyle = '#4f6f78';
      c.font = `500 21px ${MONO}`;
      c.fillText('ЗАМКИ 3/3', 180, 470);
      c.fillText('СТЕКЛО ЦЕЛО', 180, 500);
    },
    frame,
  );
  return <Screen tex={tex} {...p} />;
};

// Desk monitor connected to the pocket microscope: grey grainy picture with a dark dot.
export const ScopeScreen: React.FC<{size: [number, number]; position?: V3; rotation?: V3; power?: number}> = (p) => {
  const tex = useScreen(
    320,
    200,
    (c) => {
      c.fillStyle = '#2b3135';
      c.fillRect(0, 0, 320, 200);
      for (let i = 0; i < 900; i++) {
        const g = 40 + Math.floor(random(`scope-${i}`) * 50);
        c.fillStyle = `rgb(${g},${g + 4},${g + 7})`;
        c.fillRect(random(`scope-x-${i}`) * 320, random(`scope-y-${i}`) * 200, 3, 1);
      }
      c.fillStyle = '#9aa6ad';
      c.beginPath();
      c.arc(160, 100, 34, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#1a1e21';
      c.beginPath();
      c.arc(160, 102, 7, 0, Math.PI * 2);
      c.fill();
    },
    'static',
  );
  return <Screen tex={tex} {...p} />;
};

// Notebook page: "04:14 — под колпаком", written stroke by stroke (k = 0..1).
export const NotePage: React.FC<{k: number; size: [number, number]; position?: V3; rotation?: V3}> = ({k, ...p}) => {
  const step = Math.round(k * 60);
  const tex = useScreen(
    512,
    360,
    (c) => {
      c.fillStyle = '#d9dcd6';
      c.fillRect(0, 0, 512, 360);
      c.strokeStyle = '#a9b4bb';
      c.lineWidth = 2;
      for (let y = 40; y < 360; y += 34) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(512, y);
        c.stroke();
      }
      c.fillStyle = '#3a4048';
      c.font = "italic 500 34px 'Spectral'";
      c.fillText('03:52 — 0', 40, 98);
      c.fillText('04:12 — стол', 40, 166);
      const line = '04:14 — под колпаком';
      const shown = line.slice(0, Math.floor((step / 60) * line.length));
      c.fillStyle = '#1e2329';
      c.fillText(shown, 40, 234);
    },
    step,
  );
  return (
    <mesh position={p.position} rotation={p.rotation} receiveShadow>
      <planeGeometry args={p.size} />
      <meshStandardMaterial map={tex} roughness={0.9} />
    </mesh>
  );
};

export const noteHeadX = (k: number) => {
  const line = '04:14 — под колпаком';
  return Math.floor(k * line.length) / line.length;
};
