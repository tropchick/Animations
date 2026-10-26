import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box, Cyl, Mat} from '../slime/parts';
import {useLabel} from '../last/parts';
import {V3, voiceAt} from './cues';

const UI = "'Inter', Helvetica, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

export type Arrow = 'left' | 'right' | 'up' | 'none';

const drawExit = (c: CanvasRenderingContext2D, arrow: Arrow) => {
  const w = c.canvas.width;
  const h = c.canvas.height;
  c.fillStyle = '#138a4a';
  c.fillRect(0, 0, w, h);
  c.strokeStyle = '#e9fff1';
  c.lineWidth = 8;
  c.strokeRect(10, 10, w - 20, h - 20);
  c.fillStyle = '#f2fff6';
  c.font = `800 ${Math.round(h * 0.52)}px ${UI}`;
  c.textBaseline = 'middle';
  c.textAlign = 'center';
  const tx = arrow === 'left' ? w * 0.6 : arrow === 'right' ? w * 0.4 : w / 2;
  c.fillText('EXIT', tx, h * 0.54);
  if (arrow === 'none') return;
  c.save();
  c.translate(arrow === 'left' ? w * 0.17 : arrow === 'right' ? w * 0.83 : w / 2, h / 2);
  if (arrow === 'left') c.rotate(Math.PI);
  if (arrow === 'up') c.rotate(-Math.PI / 2);
  c.beginPath();
  c.moveTo(-h * 0.26, -h * 0.07);
  c.lineTo(h * 0.04, -h * 0.07);
  c.lineTo(h * 0.04, -h * 0.2);
  c.lineTo(h * 0.27, 0);
  c.lineTo(h * 0.04, h * 0.2);
  c.lineTo(h * 0.04, h * 0.07);
  c.lineTo(-h * 0.26, h * 0.07);
  c.closePath();
  c.fill();
  c.restore();
};

const SIGN_W = 1.1;
const SIGN_H = 0.36;
// A lit green EXIT sign hanging from the ceiling on two rods. The arrow is as seen from the +z face;
// the -z face shows it mirrored, so the sign points the same way in the world from both sides.
export const ExitSign: React.FC<{position: V3; rotation?: number; arrow: Arrow; glow?: number; rods?: number}> = ({position, rotation = 0, arrow, glow = 1.6, rods = 0}) => {
  const back: Arrow = arrow === 'left' ? 'right' : arrow === 'right' ? 'left' : arrow;
  const front = useLabel(400, 130, (c) => drawExit(c, arrow), `exit-${arrow}`);
  const rear = useLabel(400, 130, (c) => drawExit(c, back), `exit-${back}`);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box size={[SIGN_W + 0.06, SIGN_H + 0.06, 0.07]} position={[0, 0, 0]} m={{color: '#2a2d30', rough: 0.6}} shadow={false} />
      {[
        [front, 0.036, 0],
        [rear, -0.036, Math.PI],
      ].map(([tex, z, ry], i) => (
        <mesh key={i} position={[0, 0, z as number]} rotation={[0, ry as number, 0]}>
          <planeGeometry args={[SIGN_W, SIGN_H]} />
          <meshBasicMaterial map={tex as THREE.Texture} toneMapped={false} color={[glow, glow, glow]} />
        </mesh>
      ))}
      {rods > 0
        ? [-0.4, 0.4].map((x) => <Box key={x} size={[0.02, rods, 0.02]} position={[x, SIGN_H / 2 + rods / 2, 0]} m={{color: '#555'}} shadow={false} />)
        : null}
    </group>
  );
};

// the product Ben came for
const SHADE: Mat = {color: '#efe2c4', rough: 0.8};
const LAMP_METAL: Mat = {color: '#2f3336', metal: 0.5, rough: 0.4};
export const TableLamp: React.FC<{position?: V3; rotation?: V3; on?: boolean}> = ({position, rotation, on}) => (
  <group position={position} rotation={rotation}>
    <Cyl r={0.08} r2={0.09} h={0.03} position={[0, 0.015, 0]} m={LAMP_METAL} seg={16} />
    <Cyl r={0.012} h={0.3} position={[0, 0.18, 0]} m={LAMP_METAL} seg={8} />
    <Cyl r={0.07} r2={0.13} h={0.16} position={[0, 0.36, 0]} m={on ? {...SHADE, emissive: '#ffd99a', glow: 0.8} : SHADE} seg={16} />
  </group>
);

const drawTag = (c: CanvasRenderingContext2D) => {
  const w = c.canvas.width;
  const h = c.canvas.height;
  c.fillStyle = '#f4d24b';
  c.fillRect(0, 0, w, h);
  c.fillStyle = '#1c1c1c';
  c.textAlign = 'left';
  c.font = `600 ${h * 0.15}px ${UI}`;
  c.fillText('TABLE LAMP', w * 0.07, h * 0.24);
  c.font = `900 ${h * 0.4}px ${UI}`;
  c.fillText('$19.99', w * 0.06, h * 0.76, w * 0.88);
};

// A podium with a few of the lamps and the yellow price tag on a stand.
export const LampDisplay: React.FC<{position: V3; rotation?: number; taken?: boolean}> = ({position, rotation = 0, taken}) => {
  const tag = useLabel(360, 220, drawTag, 'tag1999');
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box size={[1.4, 0.7, 0.8]} position={[0, 0.35, 0]} m={{color: '#e9e6df', rough: 0.7}} />
      <Box size={[1.2, 0.5, 0.6]} position={[0.1, 0.95, -0.12]} m={{color: '#dcd8cf', rough: 0.7}} />
      <TableLamp position={[-0.45, 0.7, 0.2]} />
      {taken ? null : <TableLamp position={[-0.1, 0.7, 0.24]} />}
      <TableLamp position={[0.3, 1.2, -0.12]} />
      <TableLamp position={[-0.2, 1.2, -0.15]} />
      {/* the tag on a short stand at the front corner */}
      <Box size={[0.02, 0.26, 0.02]} position={[0.5, 0.83, 0.3]} m={LAMP_METAL} shadow={false} />
      <group position={[0.5, 1.05, 0.31]} rotation={[-0.25, 0, 0]}>
        <Box size={[0.38, 0.24, 0.012]} position={[0, 0, -0.008]} m={{color: '#c9a93a'}} shadow={false} />
        <mesh position={[0, 0, 0.0]}>
          <planeGeometry args={[0.36, 0.22]} />
          <meshStandardMaterial map={tag} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
};

// a wire bin of pillows at the aisle edge
const PILLOWS = ['#c8a04a', '#7f9bb5', '#e8e2d6', '#9a6d5f', '#6f8a6a', '#d7c6a6'];
export const PillowBin: React.FC<{position: V3; seed?: number}> = ({position, seed = 1}) => {
  const items = useMemo(() => {
    const out: {p: V3; r: number; c: string}[] = [];
    let s = seed * 97;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 9; i++) out.push({p: [(r() - 0.5) * 0.7, 0.62 + r() * 0.2, (r() - 0.5) * 0.7], r: (r() - 0.5) * 1.2, c: PILLOWS[Math.floor(r() * PILLOWS.length)]});
    return out;
  }, [seed]);
  return (
    <group position={position}>
      <Box size={[1.0, 0.6, 1.0]} position={[0, 0.3, 0]} m={{color: '#3e4246', metal: 0.4, rough: 0.5}} />
      {items.map((it, i) => (
        <Box key={i} size={[0.42, 0.14, 0.42]} position={it.p} rotation={[0.1 * Math.sin(i), it.r, 0.1 * Math.cos(i)]} m={{color: it.c, rough: 0.95}} />
      ))}
    </group>
  );
};

// A PA horn speaker on a bracket, fixed to a column face (facing +x).
export const Speaker: React.FC<{position: V3; rotation?: number; pulse?: number}> = ({position, rotation = 0, pulse = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[0.04, 0.3, 0.16]} position={[0.02, 0, 0]} m={{color: '#6c7074', metal: 0.4, rough: 0.5}} />
    <Box size={[0.22, 0.05, 0.05]} position={[0.13, 0.0, 0]} m={{color: '#6c7074', metal: 0.4, rough: 0.5}} />
    <group position={[0.28, -0.04, 0]} rotation={[0, 0, -Math.PI / 2 - 0.35]} scale={1 + pulse * 0.02}>
      <Cyl r={0.06} r2={0.2} h={0.32} position={[0, 0.12, 0]} m={{color: '#d9d8d2', rough: 0.5}} seg={14} open />
      <Cyl r={0.07} r2={0.07} h={0.12} position={[0, -0.08, 0]} m={{color: '#c6c5bf', rough: 0.5}} seg={14} />
    </group>
  </group>
);

// ------------------------------------------------------------------ the wardrobe fort

const WARD: Mat = {color: '#e6e2d9', rough: 0.75};
const WARD_DOOR: Mat = {color: '#ece8e0', rough: 0.7};
export const WARD_SIZE: V3 = [1.6, 2.1, 0.6];

// A double wardrobe, doors on its +z face. rattle 0..1 shakes the doors on their hinges.
export const Wardrobe: React.FC<{position: V3; rotation?: number; rattle?: number; tilt?: number}> = ({position, rotation = 0, rattle = 0, tilt = 0}) => {
  const [w, h, d] = WARD_SIZE;
  return (
    <group position={position} rotation={[tilt, rotation, 0]}>
      <Box size={[w, h, d]} position={[0, h / 2, 0]} m={WARD} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (w / 2 - 0.02), 0.06, d / 2 + 0.008]} rotation={[0, -s * 0.05 * rattle, 0]}>
          <Box size={[w / 2 - 0.035, h - 0.1, 0.018]} position={[-s * (w / 4 - 0.025), (h - 0.1) / 2, 0]} m={WARD_DOOR} />
          <Box size={[0.02, 0.22, 0.03]} position={[-s * (w / 2 - 0.09), h / 2 + 0.05, 0.02]} m={{color: '#6d6d6a', metal: 0.5, rough: 0.4}} shadow={false} />
        </group>
      ))}
      <Box size={[w, 0.06, d + 0.004]} position={[0, 0.03, 0]} m={{color: '#cfcac0', rough: 0.8}} shadow={false} />
    </group>
  );
};

// ------------------------------------------------------------------ the phone

const W = 360;
const H = 760;
export const PHONE: V3 = [0.074, 0.156, 0.008];

const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
};

export type PhoneMode = 'record' | 'light' | 'dark';

const drawPhone = (c: CanvasRenderingContext2D, mode: PhoneMode, v: number, recFrom: number, battery: number) => {
  c.fillStyle = mode === 'dark' ? '#000' : '#08090b';
  c.fillRect(0, 0, W, H);
  if (mode === 'dark') return;
  c.fillStyle = '#dfe2e6';
  c.font = `600 22px ${UI}`;
  c.textAlign = 'left';
  c.fillText('3:12', 26, 40);
  c.textAlign = 'right';
  c.fillText(`${Math.round(battery)}%`, W - 26, 40);
  c.textAlign = 'center';
  if (mode === 'light') {
    c.fillStyle = '#f2f2f2';
    c.beginPath();
    c.arc(W / 2, H * 0.62, 56, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#111';
    c.font = `700 30px ${UI}`;
    c.fillText('ON', W / 2, H * 0.62 + 10);
    c.fillStyle = '#9aa0a6';
    c.font = `500 24px ${UI}`;
    c.fillText('Flashlight', W / 2, H * 0.62 + 100);
    return;
  }
  const s = Math.max(0, v - recFrom);
  const blink = Math.floor(v * 2) % 2 === 0;
  c.fillStyle = blink ? '#ff3b30' : '#6a1a16';
  c.beginPath();
  c.arc(W / 2 - 64, 150, 13, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ff5b50';
  c.font = `700 30px ${UI}`;
  c.textAlign = 'left';
  c.fillText('REC', W / 2 - 40, 161);
  c.textAlign = 'center';
  c.fillStyle = '#f1f1f1';
  c.font = `700 64px ${MONO}`;
  c.fillText('LOG 01', W / 2, 290);
  c.fillStyle = '#9aa0a6';
  c.font = `500 40px ${MONO}`;
  c.fillText(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`, W / 2, 360);
  // waveform: the last 1.5 s of the voice
  const bars = 36;
  for (let i = 0; i < bars; i++) {
    const a = voiceAt(v - (bars - 1 - i) * 0.04);
    const bh = 6 + a * 150;
    c.fillStyle = i > bars - 4 ? '#ff5b50' : '#c9ccd0';
    rr(c, 22 + i * 9, 520 - bh / 2, 5, bh, 2.5);
    c.fill();
  }
  c.fillStyle = '#ff3b30';
  c.beginPath();
  c.arc(W / 2, 680, 38, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#08090b';
  rr(c, W / 2 - 15, 665, 30, 30, 5);
  c.fill();
};

// Ben's phone, screen on its +z face. flash: the light on the back is on (a warm spot shining out of -z).
export const Phone: React.FC<{v: number; mode: PhoneMode; recFrom?: number; battery?: number; flash?: number; position?: V3; rotation?: V3; screenGlow?: number}> = ({
  v,
  mode,
  recFrom = 0,
  battery = 34,
  flash = 0,
  position,
  rotation,
  screenGlow = 1,
}) => {
  const {cv, tex} = useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return {cv, tex};
  }, []);
  drawPhone(cv.getContext('2d')!, mode, v, recFrom, battery);
  tex.needsUpdate = true;
  const target = useMemo(() => new THREE.Object3D(), []);
  return (
    <group position={position} rotation={rotation}>
      <Box size={PHONE} m={{color: '#141518', metal: 0.5, rough: 0.35}} shadow={false} />
      <mesh position={[0, 0, PHONE[2] / 2 + 0.0008]}>
        <planeGeometry args={[PHONE[0] - 0.006, PHONE[1] - 0.008]} />
        <meshBasicMaterial map={tex} toneMapped={false} color={[screenGlow, screenGlow, screenGlow]} />
      </mesh>
      {flash > 0 ? (
        <>
          <mesh position={[-0.022, 0.06, -PHONE[2] / 2 - 0.0008]} rotation={[0, Math.PI, 0]}>
            <circleGeometry args={[0.005, 12]} />
            <meshBasicMaterial color={[3, 3, 2.6]} toneMapped={false} />
          </mesh>
          <primitive object={target} position={[0, 0.06, -1]} />
          <spotLight position={[-0.022, 0.06, -0.01]} target={target} color="#fff1d6" intensity={6 * flash} distance={14} angle={0.55} penumbra={0.5} decay={1.6} />
        </>
      ) : null}
    </group>
  );
};
