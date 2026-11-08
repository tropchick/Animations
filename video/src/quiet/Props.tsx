import React from 'react';
import {Ball, Block, Cyl, Pill, RBox, Ring} from '../bear/kit';
import {Pic} from '../bear/Props';
import {COND} from '../gta/tex';
import {ARTEM} from './Chars';
import type {V3} from '../bear/cues';

// Close-up props for «Тихий этаж»: Артём's palm with the three rules, the marker, the note from the box, the hammer.

// ---------------------------------------------------------------- the palm

// lines on the palm. written: how many characters are on (0..1 of all), wiped: the third line rubbed off (0..1),
// newWord: «ИДЁМ» written where the third line was (0..1)
export const palmLines = ['НЕ ШУМИ', 'НЕ СВЕТИ', 'НЕ БЕРИ ЛИШНЕГО'];
const drawPalm = (written: number, wiped: number, newWord: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.clearRect(0, 0, W, H);
  const total = palmLines.reduce((a, l) => a + l.length, 0);
  let left = Math.round(total * written);
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  palmLines.forEach((l, i) => {
    const n = Math.max(0, Math.min(l.length, left));
    left -= n;
    let size = i === 2 ? H * 0.15 : H * 0.2;
    g.font = `700 ${Math.round(size)}px ${COND}`;
    while (g.measureText(l).width > W * 0.9 && size > 10) {
      size -= 2;
      g.font = `700 ${Math.round(size)}px ${COND}`;
    }
    const full = g.measureText(l).width;
    const x0 = (W - full) / 2;
    const y = H * (0.24 + i * 0.26);
    g.save();
    g.translate(0, y);
    g.rotate(-0.04 + i * 0.02);
    if (i === 2 && wiped > 0) {
      // the rubbed-off line: fading smear
      g.globalAlpha = Math.max(0, 1 - wiped * 1.3);
      g.fillStyle = '#1e2a6a';
      g.fillText(l.slice(0, n), x0, 0);
      g.globalAlpha = 0.35 * Math.min(1, wiped * 2) * (1 - Math.max(0, wiped - 0.6) * 1.5);
      g.fillStyle = '#5a6088';
      g.fillRect(x0 - 10, -size * 0.4, full * Math.min(1, wiped * 1.6) + 20, size * 0.8);
      g.globalAlpha = 1;
    } else {
      g.fillStyle = '#1e2a6a';
      g.fillText(l.slice(0, n), x0, 0);
    }
    g.restore();
  });
  if (newWord > 0) {
    const word = 'ИДЁМ';
    const n = Math.round(word.length * newWord);
    g.font = `700 ${Math.round(H * 0.24)}px ${COND}`;
    const full = g.measureText(word).width;
    g.save();
    g.translate((W - full) / 2, H * 0.78);
    g.rotate(-0.03);
    g.fillStyle = '#1e2a6a';
    g.fillText(word.slice(0, n), 0, 0);
    g.restore();
  }
};

// a big palm facing up (+y), fingers towards −z, wrist at +z; about 20 cm long. Sleeve: the yellow puffer cuff.
export const Palm: React.FC<{position?: V3; rotation?: V3; written?: number; wiped?: number; newWord?: number; curl?: number}> = ({position, rotation, written = 1, wiped = 0, newWord = 0, curl = 0.15}) => {
  const skin = ARTEM.skin;
  const steps = 24;
  const w = Math.round(written * steps) / steps;
  const wp = Math.round(wiped * steps) / steps;
  const nw = Math.round(newWord * steps) / steps;
  return (
    <group position={position} rotation={rotation}>
      {/* palm */}
      <RBox position={[0, 0, 0]} size={[0.095, 0.03, 0.11]} r={0.014} color={skin} look={{rough: 0.6}} />
      {/* fingers */}
      {[-0.034, -0.011, 0.012, 0.034].map((x, i) => {
        const len = [0.062, 0.075, 0.072, 0.058][i];
        return (
          <group key={i} position={[x, 0.002, -0.055]} rotation={[-curl * (1 + i * 0.1), 0, (i - 1.5) * 0.04]}>
            <Pill position={[0, 0, -len / 2]} rotation={[Math.PI / 2, 0, 0]} r={0.0105} len={len - 0.02} color={skin} look={{rough: 0.6}} />
          </group>
        );
      })}
      {/* thumb */}
      <group position={[-0.05, 0.0, 0.0]} rotation={[0, -0.7, 0.25]}>
        <Pill position={[-0.022, 0, -0.012]} rotation={[Math.PI / 2, 0, 0.9]} r={0.012} len={0.04} color={skin} look={{rough: 0.6}} />
      </group>
      {/* wrist + cuff */}
      <Pill position={[0, -0.002, 0.07]} rotation={[Math.PI / 2, 0, 0]} r={0.028} len={0.04} color={skin} />
      <Cyl position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]} rt={0.05} rb={0.052} h={0.08} seg={20} color={ARTEM.top} look={{rough: 0.85}} />
      <Ring position={[0, 0, 0.082]} r={0.046} tube={0.008} color={ARTEM.top} />
      {/* the words, on a thin plane just above the palm */}
      <Pic size={[0.088, 0.1]} res={[440, 500]} k={`palm_${w}_${wp}_${nw}`} draw={drawPalm(w, wp, nw)} position={[0, 0.0158, 0.002]} rotation={[-Math.PI / 2, 0, 0]} transparent />
    </group>
  );
};

// a marker pen; tip at the origin pointing −y
export const Marker: React.FC<{position?: V3; rotation?: V3; cap?: boolean}> = ({position, rotation, cap}) => (
  <group position={position} rotation={rotation}>
    <Cyl position={[0, 0.005, 0]} rt={0.003} rb={0.0015} h={0.01} seg={10} color="#1e2a6a" />
    <Cyl position={[0, 0.02, 0]} rt={0.007} rb={0.005} h={0.02} seg={14} color="#e8e8e8" />
    <Cyl position={[0, 0.075, 0]} rt={0.0085} rb={0.0085} h={0.09} seg={14} color="#2a3a9a" />
    {cap ? <Cyl position={[0, 0.02, 0]} rt={0.0095} rb={0.0095} h={0.04} seg={14} color="#1e2a6a" /> : null}
  </group>
);

// the note found in the box
const drawNote = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#f2ecd8';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#c8d0e0';
  g.lineWidth = 2;
  for (let y = H * 0.18; y < H; y += H * 0.12) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  g.fillStyle = '#2a2a3a';
  g.textAlign = 'center';
  g.font = `600 ${Math.round(H * 0.13)}px ${COND}`;
  g.fillText('Включай в 3:00', W / 2, H * 0.36);
  g.font = `700 ${Math.round(H * 0.2)}px ${COND}`;
  g.fillText('91,4', W / 2, H * 0.66);
  g.strokeStyle = '#2a2a3a';
  g.lineWidth = 4;
  g.beginPath();
  g.ellipse(W / 2, H * 0.62, W * 0.24, H * 0.16, -0.05, 0, Math.PI * 2);
  g.stroke();
};
export const Note: React.FC<{position?: V3; rotation?: V3; scale?: number}> = ({position, rotation, scale = 1}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <Block position={[0, 0, -0.0008]} size={[0.15, 0.1, 0.0012]} color="#e8e0c8" shadow={false} />
    <Pic size={[0.148, 0.098]} res={[600, 400]} k="note_914" draw={drawNote} position={[0, 0, 0.0002]} />
  </group>
);

// hammer: handle along −y from the head at the origin
export const Hammer: React.FC<{position?: V3; rotation?: V3}> = ({position, rotation}) => (
  <group position={position} rotation={rotation}>
    <RBox position={[0, 0, 0]} size={[0.12, 0.035, 0.035]} r={0.006} color="#5a5e66" look={{metal: 0.7, rough: 0.35}} />
    <Cyl position={[0, -0.14, 0]} rt={0.012} rb={0.014} h={0.26} seg={10} color="#8a5a30" />
  </group>
);

// a tin can opened, for the cold supper
export const OpenCan: React.FC<{position?: V3}> = ({position}) => (
  <group position={position}>
    <Cyl position={[0, 0.055, 0]} rt={0.045} rb={0.045} h={0.11} seg={16} open color="#c8ccd0" look={{metal: 0.6, rough: 0.35}} />
    <Cyl position={[0, 0.04, 0]} rt={0.046} rb={0.046} h={0.06} seg={16} color="#b8442e" />
    <Cyl position={[0, 0.095, 0]} rt={0.043} rb={0.043} h={0.004} seg={16} color="#a86a3a" />
    <Ball position={[0.0, 0.1, 0]} scale={[0.02, 0.006, 0.02]} color="#9a5a2a" shadow={false} />
  </group>
);
