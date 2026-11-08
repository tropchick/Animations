import React from 'react';
import {CameraRig, View, handheld} from '../slime/camera';
import {Stars, Glow} from '../gta/Space';
import {NightEarth} from '../gta2/Globe';
import {Candle} from '../gta/Rooms';
import {Block, DayLights, Tree} from '../lastman/common';
import {Granny} from '../lastman/people';
import {Person} from '../scene/Characters';
import {COND, roundRect} from '../gta/tex';
import {
  ALARM,
  BUZZ,
  CANDLE_OUT,
  DOORS,
  GRAPH,
  HEAD,
  HOME,
  JUMP,
  LEAK_TXT,
  LIGHTS_OUT,
  MUG,
  NOTIFY,
  PRINT,
  SIGN,
  STAMP,
  SWITCH,
  Shot,
  TOWERS_OFF,
  TURN,
  V3,
  WIN_OUT,
  clamp01,
  easeIn,
  easeOut,
  lerp,
  lerp3,
  ramp,
  rnd,
  shotAt,
  shotEnd,
  shotStart,
  smooth,
} from './cues';
import {
  Bench,
  Box,
  Can,
  Canvas,
  Chair,
  CoolingTower,
  Cyl,
  Desk,
  Dotter,
  Ico,
  Laptop,
  Monitor,
  PhoneSlab,
  Pylon,
  SIT,
  Steam,
  drawSearch,
  drawSign,
  runPose,
  seatY,
  walkPose,
} from './Sets';

const S = (n: Shot) => shotStart(n);
const E = (n: Shot) => shotEnd(n);
const mv = (v: number, t0: number, t1: number, a: V3, b: V3, ta: V3, tb: V3, fov: number | [number, number], far = 3000): View => {
  const k = smooth(ramp(v, t0, t1));
  return {pos: lerp3(a, b, k), target: lerp3(ta, tb, k), fov: typeof fov === 'number' ? fov : lerp(fov[0], fov[1], k), far};
};
const pulse = (v: number, at: number, len = 0.5) => (v >= at && v < at + len ? Math.sin(((v - at) / len) * Math.PI) : 0);

// ======================================================================= 1. the room at night

const SEAT = seatY(0, 0.48);
const ROOM_CAN_FROM: V3 = [-0.28, 1.12, 0.42];
const ROOM_CAN_TO: V3 = [-0.42, 0.035, 0.62];

const NightRoom: React.FC<{v: number}> = ({v}) => {
  const off = v >= SWITCH;
  const shock = smooth(ramp(v, SWITCH, SWITCH + 0.35));
  const secs = 47 * 60 + 12 + Math.floor(v);
  const dropK = clamp01((v - (MUG - 0.45)) / 0.45);
  const canFalling = v >= MUG - 0.45;
  return (
    <>
      <color attach="background" args={['#05060a']} />
      <ambientLight intensity={0.25} color="#5a6a8a" />
      <pointLight position={[0, 1.15, 0.25]} color={off ? '#ff3a2a' : '#6aa8ff'} intensity={off ? 3.2 : 2.4} distance={4.5} decay={1.6} />
      <pointLight position={[1.4, 2.4, 1.6]} color="#2a3a6a" intensity={1.2} distance={6} decay={2} />
      {/* floor, walls */}
      <Box size={[5, 0.1, 5]} position={[0, -0.05, 0.5]} color="#3a3230" />
      <Box size={[5, 3, 0.1]} position={[0, 1.5, -0.55]} color="#2e3444" />
      <Box size={[0.1, 3, 5]} position={[-1.6, 1.5, 0.5]} color="#2a3040" />
      {/* posters and a shelf */}
      <Box size={[0.6, 0.85, 0.02]} position={[-0.95, 1.75, -0.49]} color="#6a2a3a" />
      <Box size={[0.5, 0.7, 0.025]} position={[-0.95, 1.75, -0.485]} color="#a0503a" shadow={false} />
      <Box size={[0.5, 0.7, 0.02]} position={[1.05, 1.8, -0.49]} color="#2a4a6a" />
      <Box size={[1.2, 0.04, 0.25]} position={[0.9, 2.3, -0.4]} color="#4a3a30" />
      {[0, 1, 2, 3].map((k) => (
        <Can key={k} position={[0.5 + k * 0.22, 2.38, -0.4]} color={['#2fd06a', '#e03a3a', '#3a8ae0', '#2fd06a'][k]} />
      ))}
      <Desk position={[0, 0, 0]} size={[1.5, 0.7]} color="#2a2a30" legs="#1a1a1e" />
      <Monitor position={[0, 0.76, -0.15]} k={off ? 'off' : `s${secs}`} draw={(g, W, H) => drawSearch(g, W, H, secs, off ? 1 : 0)} w={0.66} glow={1.15} />
      {/* keyboard, mouse, empty cans */}
      <Box size={[0.44, 0.025, 0.14]} position={[0, 0.775, 0.12]} color="#18181c" />
      <Box size={[0.42, 0.006, 0.12]} position={[0, 0.79, 0.12]} color="#c03a8a" emissive="#c03a8a" emissiveIntensity={0.5} shadow={false} />
      <Box size={[0.06, 0.03, 0.1]} position={[0.36, 0.775, 0.12]} color="#18181c" />
      <Can position={[-0.6, 0.82, 0.0]} />
      <Can position={[-0.52, 0.82, -0.12]} color="#e03a3a" />
      <Chair position={[0, 0, 0.78]} rotation={Math.PI} />
      <Dotter
        position={[0, SEAT, 0.75]}
        rotation={Math.PI}
        look={{i: 0, phones: 'head'}}
        pose={{
          ...SIT,
          armL: [lerp(0.95, 0.7, shock), 0.08],
          elbowL: lerp(0.55, 0.2, shock),
          armR: [lerp(1.25, 0.9, shock), -0.1],
          elbowR: lerp(1.0, 0.3, shock),
          head: [lerp(0.08, -0.1, shock), 0],
          eyes: lerp(1, 1.55, shock),
          mouth: lerp(0, 0.55, shock),
        }}
        rightHand={!canFalling ? <Can position={[0, -0.04, 0.05]} rotation={[0.3, 0, 0]} /> : null}
      />
      {canFalling ? (
        <Can
          position={[lerp(ROOM_CAN_FROM[0], ROOM_CAN_TO[0], dropK), lerp(ROOM_CAN_FROM[1], ROOM_CAN_TO[1], easeIn(dropK)), lerp(ROOM_CAN_FROM[2], ROOM_CAN_TO[2], dropK)]}
          rotation={dropK >= 1 ? [Math.PI / 2, 0, 0.4] : [dropK * 3, 0, dropK * 1.5]}
        />
      ) : null}
      {v >= MUG ? <Box size={[0.25, 0.004, 0.18]} position={[-0.45, 0.003, 0.72]} color="#4ac070" opacity={0.6} shadow={false} /> : null}
    </>
  );
};

// ======================================================================= 2. the block at night: every window goes out

const COLS = 12;
const ROWS = 14;
const winOff = (c: number, r: number) => (c === 7 && r === 6 ? -1 : WIN_OUT[0] + rnd(c * 31 + r * 7 + 3) * (WIN_OUT[1] - WIN_OUT[0]));
export const HERO_WIN: V3 = [-18 + 7 * 3 + 1.5, 1.5 + 6 * 3 + 1.4, -19.6];

const NightBlock: React.FC<{v: number}> = ({v}) => (
  <>
    <color attach="background" args={['#0a1020']} />
    <Stars opacity={0.6} radius={900} size={1.6} />
    <ambientLight intensity={0.3} color="#5a6a9a" />
    <directionalLight position={[-30, 50, 40]} intensity={0.35} color="#8aa0d0" />
    <Box size={[400, 0.1, 400]} position={[0, -0.05, 0]} color="#1a1e26" />
    {/* the block */}
    <Box size={[36, 44, 12]} position={[0, 22, -26]} color="#2a3040" />
    {Array.from({length: COLS}).map((_, c) =>
      Array.from({length: ROWS}).map((__, r) => {
        const t = winOff(c, r);
        const kind = rnd(c * 13 + r * 17 + 1);
        const x = -18 + c * 3 + 1.5;
        const y = 1.5 + r * 3 + 1.4;
        let col = '#151a26';
        let em: string | undefined;
        if (kind < 0.82) {
          if (v < t) {
            col = '#6aa8ff';
            em = '#4a8aff';
          } else if (v < t + 0.25 || t < 0) {
            col = '#ff4a3a';
            em = '#ff3a2a';
          }
        } else if (kind < 0.9) {
          col = '#ffd890';
          em = '#ffb850';
        }
        return <Box key={`${c}-${r}`} size={[1.5, 1.6, 0.1]} position={[x, y, -19.96]} color={col} emissive={em} emissiveIntensity={em ? 1.4 : 1} shadow={false} />;
      }),
    )}
    {/* two more blocks at the sides, already dark */}
    <Box size={[24, 36, 12]} position={[-34, 18, -40]} color="#20263a" />
    <Box size={[24, 40, 12]} position={[34, 20, -38]} color="#20263a" />
    {/* foreground: a street lamp and a tree */}
    <group position={[9, 0, 10]}>
      <Cyl rTop={0.12} rBottom={0.16} height={7} position={[0, 3.5, 0]} color="#2a2e36" />
      <Box size={[1.4, 0.2, 0.4]} position={[-0.6, 7, 0]} color="#2a2e36" />
      <Box size={[0.6, 0.08, 0.3]} position={[-1.1, 6.86, 0]} color="#ffd8a0" emissive="#ffb860" emissiveIntensity={2} shadow={false} />
      <pointLight position={[-1.1, 6.4, 0]} color="#ffb860" intensity={3} distance={14} decay={1.6} />
    </group>
    <Tree position={[-10, 0, 8]} s={1.5} seed={2} dark />
  </>
);

// ======================================================================= 3. the yard: they come out, the grannies stare

const DOOR_X = [-12, 0, 12];
const BLOCK_FRONT = -6;
type Walker = {door: number; start: number; to: V3; turn: number};
export const WALKERS: Walker[] = Array.from({length: 21}).map((_, i) => {
  const door = i % 3;
  const wave = Math.floor(i / 3);
  return {
    door,
    start: DOORS + 0.1 + wave * 0.42 + rnd(i * 7 + 1) * 0.25,
    to: [DOOR_X[door] + (rnd(i * 7 + 2) - 0.5) * 7, 0, BLOCK_FRONT + 3.5 + rnd(i * 7 + 3) * 6.5],
    turn: (rnd(i * 7 + 4) - 0.5) * 1.2,
  };
});
const walkerAt = (w: Walker, v: number) => {
  const from: V3 = [DOOR_X[w.door], 0, BLOCK_FRONT - 0.4];
  const d = Math.hypot(w.to[0] - from[0], w.to[2] - from[2]);
  const dur = d / 1.3;
  const t = v - w.start;
  const k = clamp01(t / dur);
  const p = lerp3(from, w.to, k);
  const walking = k < 1;
  const dir = Math.atan2(w.to[0] - from[0], w.to[2] - from[2]);
  return {p, walking, dir, t};
};
export const BENCH_POS: V3 = [8.5, 0, 3.2];
export const BENCH_ROT = -2.2;
const GRAN_SEAT = seatY(0, 0.48);

const Yard: React.FC<{v: number}> = ({v}) => {
  const turnK = smooth(ramp(v, TURN, TURN + 0.5));
  return (
    <>
      <color attach="background" args={['#bfe0f5']} />
      <DayLights />
      <directionalLight position={[30, 50, 30]} intensity={1.6} color="#fff2dc" />
      <Box size={[300, 0.1, 300]} position={[0, -0.05, 0]} color="#7aa45a" />
      <Box size={[60, 0.02, 3]} position={[0, 0.01, BLOCK_FRONT + 1.5]} color="#8a8a88" shadow={false} />
      <Block position={[0, 0, -12]} size={[42, 27, 12]} color="#d8d2c4" seed={4} floors={9} />
      {DOOR_X.map((x, d) => {
        const open = smooth(ramp(v, DOORS - 0.2 + d * 0.12, DOORS + 0.3 + d * 0.12));
        return (
          <group key={d} position={[x, 0, BLOCK_FRONT]}>
            <Box size={[2.6, 0.2, 1.6]} position={[0, 2.7, 0.8]} color="#9a9a96" />
            <Box size={[1.5, 2.3, 0.06]} position={[0, 1.15, 0.05]} color="#1a1c20" shadow={false} />
            <group position={[-0.65, 0, 0.12]} rotation={[0, -open * 1.6, 0]}>
              <Box size={[1.3, 2.2, 0.06]} position={[0.65, 1.1, 0]} color="#4a5a6a" />
              <Box size={[0.08, 0.2, 0.06]} position={[1.15, 1.1, 0.05]} color="#c8c8c8" />
            </group>
          </group>
        );
      })}
      {WALKERS.map((w, i) => {
        if (v < w.start) return null;
        const {p, walking, dir, t} = walkerAt(w, v);
        const settle = smooth(ramp(t, 0.2, 1.2));
        const pose = walking
          ? {...walkPose(t, 0.8), head: [-0.15, 0] as [number, number]}
          : {
              armR: [lerp(0.3, 2.55, settle), -0.35] as [number, number],
              elbowR: lerp(0.2, 1.9, settle),
              head: [-0.12 + 0.05 * Math.sin(v * 1.3 + i), 0.15 * Math.sin(v * 0.7 + i * 2)] as [number, number],
              eyes: 0.35,
            };
        // squint: eyes almost shut all the time outside
        return <Dotter key={i} position={p} rotation={walking ? dir : dir + w.turn} pose={{...pose, eyes: 0.35}} look={{i}} />;
      })}
      {/* trees and the bench with the grannies */}
      <Tree position={[-18, 0, 4]} s={1.2} seed={1} birch />
      <Tree position={[19, 0, 7]} s={1.1} seed={3} />
      <Tree position={[-6, 0, 12]} s={1.0} seed={5} birch />
      <group position={BENCH_POS} rotation={[0, BENCH_ROT, 0]}>
        <Bench position={[0, 0, 0]} />
        <Granny position={[-0.42, GRAN_SEAT, 0.05]} pose={{...SIT, armL: [0.6, 0.1], armR: [0.6, -0.1], elbowL: 0.9, elbowR: 0.9, head: [0.05, lerp(0, -0.85, turnK)]}} />
        <Granny position={[0.42, GRAN_SEAT, 0.05]} scarf="#3a6ad8" cardigan="#4a7a5a" pose={{...SIT, armL: [0.5, 0.1], armR: [0.5, -0.1], elbowL: 1.0, elbowR: 1.0, head: [0.1, lerp(0.2, 0.75, turnK)]}} />
      </group>
    </>
  );
};

// ======================================================================= 4. the queue to the police

const QUEUE_PATH: V3[] = [
  [0, 0, -2.2],
  [0, 0, 3.5],
  [14, 0, 3.5],
  [40, 0, 5.0],
];
const pathAt = (d: number): {p: V3; dir: number} => {
  let rest = d;
  for (let i = 0; i < QUEUE_PATH.length - 1; i++) {
    const a = QUEUE_PATH[i];
    const b = QUEUE_PATH[i + 1];
    const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
    if (rest <= len || i === QUEUE_PATH.length - 2) {
      const k = rest / len;
      return {p: lerp3(a, b, k), dir: Math.atan2(a[0] - b[0], a[2] - b[2])};
    }
    rest -= len;
  }
  return {p: QUEUE_PATH[0], dir: 0};
};

const Police: React.FC<{v: number}> = ({v}) => (
  <>
    <color attach="background" args={['#bcdcf2']} />
    <DayLights />
    <directionalLight position={[30, 50, 30]} intensity={1.5} color="#fff2dc" />
    <Box size={[300, 0.1, 300]} position={[0, -0.05, 0]} color="#7a9a5a" />
    <Box size={[200, 0.03, 4]} position={[0, 0.015, 3.8]} color="#a8a49c" shadow={false} />
    <Box size={[200, 0.02, 8]} position={[0, 0.01, 10]} color="#5a5c62" shadow={false} />
    {/* the station */}
    <Box size={[18, 7.5, 10]} position={[0, 3.75, -8]} color="#e6e2d8" />
    <Box size={[18.02, 0.7, 10.02]} position={[0, 3.2, -8]} color="#2a5ac8" />
    <Canvas size={[7, 1.5]} res={[700, 150]} k="police" draw={drawSign('ПОЛИЦИЯ', '#1f4fb8', '#ffffff', '#ffffff')} position={[0, 5.6, -2.97]} />
    <Box size={[2.2, 2.6, 0.08]} position={[0, 1.3, -2.98]} color="#3a4a5a" />
    {[-6, -3.5, 3.5, 6].map((x) => (
      <Box key={x} size={[1.6, 1.4, 0.06]} position={[x, 1.9, -2.98]} color="#8aa4c0" />
    ))}
    {Array.from({length: 54}).map((_, i) => {
      const {p, dir} = pathAt(0.75 + i * 0.78);
      const sway = Math.sin(v * 1.4 + i * 1.7) * 0.03;
      const phone = rnd(i * 5 + 2) > 0.45;
      return (
        <Dotter
          key={i}
          position={[p[0] + (rnd(i * 5 + 1) - 0.5) * 0.3, 0, p[2] + (rnd(i * 5 + 3) - 0.5) * 0.3]}
          rotation={dir + (rnd(i * 5 + 4) - 0.5) * 0.5}
          look={{i}}
          pose={{
            head: [phone ? 0.5 : 0, sway * 4],
            armR: phone ? [0.9, -0.1] : [0, -0.06],
            elbowR: phone ? 1.2 : 0,
            armL: [sway, 0.06],
          }}
          rightHand={phone ? <Box size={[0.07, 0.01, 0.14]} position={[0, -0.02, 0.05]} color="#121216" /> : null}
        />
      );
    })}
    <Tree position={[-12, 0, 1]} s={1.1} seed={2} />
    <Tree position={[22, 0, -2]} s={1.2} seed={6} birch />
  </>
);

// ======================================================================= 5. the printer that can't stop

const SHEETS_PER_S = 7;
const Printer: React.FC<{v: number}> = ({v}) => {
  const t = Math.max(0, v - PRINT[0]);
  const printing = v >= PRINT[0] && v < PRINT[1];
  const n = Math.floor(Math.min(t, PRINT[1] - PRINT[0]) * SHEETS_PER_S);
  const pileH = 0.05 + n * 0.012 + Math.max(0, v - S('printer')) * 0.02;
  return (
    <>
      <color attach="background" args={['#cfd8de']} />
      <hemisphereLight color="#ffffff" groundColor="#9a9590" intensity={1.3} />
      <directionalLight position={[2, 4, 3]} intensity={1.4} />
      <Box size={[6, 0.1, 6]} position={[0, -0.05, 0]} color="#8a8f96" />
      <Box size={[6, 3, 0.1]} position={[0, 1.5, -0.8]} color="#c8d0d6" />
      {/* notice board */}
      <Box size={[1.4, 0.9, 0.03]} position={[-0.9, 1.7, -0.74]} color="#b08a5a" />
      {[0, 1, 2, 3, 4].map((k) => (
        <Box key={k} size={[0.22, 0.3, 0.005]} position={[-1.4 + k * 0.25, 1.75 + (k % 2) * 0.1, -0.722]} rotation={[0, 0, (k - 2) * 0.05]} color="#f4f4ee" shadow={false} />
      ))}
      <Desk position={[0.2, 0, -0.35]} size={[1.2, 0.6]} color="#b8b0a4" />
      {/* the printer */}
      <group position={[0.2, 0.76, -0.4]}>
        <Box size={[0.5, 0.26, 0.42]} position={[0, 0.13, 0]} color="#e8e8ea" />
        <Box size={[0.4, 0.02, 0.2]} position={[0, 0.2, 0.25]} rotation={[-0.25, 0, 0]} color="#d0d0d4" />
        <Box size={[0.08, 0.02, 0.05]} position={[0.17, 0.265, 0.1]} color={printing && Math.sin(v * 20) > 0 ? '#3ae07a' : '#2a7a4a'} emissive={printing ? '#3ae07a' : undefined} shadow={false} />
      </group>
      {/* sheets: each slides out of the slot, flies forward and lands on the pile */}
      {Array.from({length: 10}).map((_, k) => {
        const idx = n - k;
        if (idx < 0 || !printing) return null;
        const born = PRINT[0] + idx / SHEETS_PER_S;
        const a = v - born;
        if (a < 0 || a > 1.0) return null;
        const out = clamp01(a / 0.14);
        const fall = clamp01((a - 0.14) / 0.6);
        const x = 0.2 + Math.sin(idx * 2.3) * 0.08 * fall;
        const y = lerp(0.98, pileH + 0.01, easeIn(fall));
        const z = -0.2 + out * 0.18 + fall * 0.55;
        return <Box key={k} size={[0.21, 0.003, 0.29]} position={[x, y, z]} rotation={[0.3 * (1 - fall) + fall * 0.05, idx * 0.7 * fall, Math.sin(idx) * 0.3 * fall]} color="#f8f8f4" shadow={false} />;
      })}
      {/* the pile on the floor */}
      {Array.from({length: 12}).map((_, k) => {
        const h = pileH * (1 - k * 0.07);
        if (h <= 0.01) return null;
        return <Box key={k} size={[0.3 + k * 0.06, h, 0.36 + k * 0.05]} position={[0.2 + Math.sin(k) * 0.08, h / 2, 0.38 + Math.cos(k * 1.3) * 0.06]} rotation={[0, k * 0.4, 0]} color={k % 2 ? '#f2f2ec' : '#fafaf6'} />;
      })}
    </>
  );
};

// ======================================================================= 6. the statement and the stamp

const drawStatement = (stamped: boolean) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#fbfaf4';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#9aa8c0';
  for (let y = 300; y < H - 60; y += 64) g.fillRect(50, y, W - 100, 2);
  g.fillStyle = '#222';
  g.textAlign = 'right';
  g.font = `500 34px ${COND}`;
  g.fillText('Начальнику отдела полиции', W - 50, 70);
  g.fillText('от жителя кв. 47', W - 50, 112);
  g.textAlign = 'center';
  g.font = `600 64px ${COND}`;
  g.fillText('ЗАЯВЛЕНИЕ', W / 2, 220);
  g.textAlign = 'left';
  g.fillStyle = '#1a3a9a';
  g.font = `italic 500 58px ${COND}`;
  g.fillText('Сосед не дал мид.', 70, 350);
  g.fillText('Прошу принять меры.', 70, 414);
  g.fillText('Кидаю репорт.', 70, 478);
  g.font = `italic 500 40px ${COND}`;
  g.fillText('Подпись: ________', 70, H - 90);
  if (stamped) {
    g.save();
    g.translate(W * 0.6, H * 0.68);
    g.rotate(-0.22);
    g.strokeStyle = 'rgba(214,40,40,0.85)';
    g.lineWidth = 12;
    roundRect(g, -230, -70, 460, 140, 16);
    g.stroke();
    g.fillStyle = 'rgba(214,40,40,0.85)';
    g.font = `700 92px ${COND}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('ОТКАЗАНО', 0, 6);
    g.restore();
  }
};
export const STAMP_AT: V3 = [0.03, 0.78, 0.04];

const Statement: React.FC<{v: number}> = ({v}) => {
  const down = v < STAMP ? smooth(ramp(v, STAMP - 0.35, STAMP)) : 1 - smooth(ramp(v, STAMP + 0.08, STAMP + 0.3));
  const sy = lerp(0.3, 0.0, down);
  const sx = lerp(0.3, 0, smooth(ramp(v, STAMP - 0.7, STAMP - 0.2))) + lerp(0, 0.35, smooth(ramp(v, STAMP + 0.2, STAMP + 0.5)));
  return (
    <>
      <color attach="background" args={['#3a2e26']} />
      <hemisphereLight color="#fff6e8" groundColor="#6a5a4a" intensity={1.2} />
      <directionalLight position={[1, 3, 1]} intensity={1.3} />
      <Box size={[2, 0.05, 1.4]} position={[0, 0.745, 0]} color="#8a5a3a" />
      <Canvas size={[0.297, 0.42]} res={[700, 990]} k={v >= STAMP ? 'st1' : 'st0'} draw={drawStatement(v >= STAMP)} position={[0, 0.7715, 0]} rotation={[-Math.PI / 2, 0, 0.05]} lit />
      <Cyl rTop={0.006} rBottom={0.006} height={0.15} position={[-0.2, 0.776, 0.12]} rotation={[0, 0, Math.PI / 2]} color="#1a3a9a" segments={6} />
      {/* the stamp */}
      <group position={[STAMP_AT[0] + 0.03 + sx, STAMP_AT[1] + sy, STAMP_AT[2] - 0.03]}>
        <Box size={[0.12, 0.03, 0.05]} position={[0, 0.015, 0]} color="#5a3a2a" />
        <Box size={[0.115, 0.006, 0.045]} position={[0, 0.003, 0]} color="#c82a2a" shadow={false} />
        <Cyl rTop={0.022} rBottom={0.026} height={0.09} position={[0, 0.075, 0]} color="#2a2a30" segments={10} />
        <Ico radius={0.035} position={[0, 0.13, 0]} color="#2a2a30" />
      </group>
      {/* the officer's hand on the stamp */}
      <group position={[STAMP_AT[0] + 0.03 + sx, STAMP_AT[1] + sy + 0.16, STAMP_AT[2] - 0.03]}>
        <Box size={[0.09, 0.05, 0.1]} position={[0, 0.0, 0]} color="#e2b898" />
        <Box size={[0.1, 0.09, 0.32]} position={[0, 0.04, -0.2]} rotation={[0.3, 0, 0]} color="#2a3a6a" />
      </group>
    </>
  );
};

// ======================================================================= 7. everyone takes the middle lane

const LANE = 3.6;
const CAR_COLORS = ['#c83a3a', '#3a6ac8', '#e8e8e8', '#2a2a30', '#8a8a90', '#d8b03a', '#3a8a5a', '#6a3a8a'];
const RoadCar: React.FC<{position: V3; color: string; rotation?: number}> = ({position, color, rotation = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[1.8, 0.65, 4.3]} position={[0, 0.6, 0]} color={color} />
    <Box size={[1.6, 0.55, 2.2]} position={[0, 1.18, -0.2]} color={color} />
    <Box size={[1.62, 0.4, 2.0]} position={[0, 1.18, -0.2]} color="#1c2430" />
    <Box size={[0.4, 0.12, 0.04]} position={[-0.6, 0.65, -2.16]} color="#ff3a2a" emissive="#ff2a1a" emissiveIntensity={1.4} shadow={false} />
    <Box size={[0.4, 0.12, 0.04]} position={[0.6, 0.65, -2.16]} color="#ff3a2a" emissive="#ff2a1a" emissiveIntensity={1.4} shadow={false} />
    {[-0.8, 0.8].map((x) => [-1.4, 1.4].map((z) => <Cyl key={`${x}${z}`} rTop={0.33} rBottom={0.33} height={0.25} position={[x * 1.12, 0.33, z]} rotation={[0, 0, Math.PI / 2]} color="#141416" segments={10} />))}
  </group>
);
export const GANTRY_Z = -95;

const Ring: React.FC<{v: number}> = ({v}) => (
  <>
    <color attach="background" args={['#c8dcec']} />
    <fog attach="fog" args={['#c8dcec', 120, 520]} />
    <DayLights />
    <directionalLight position={[40, 60, 20]} intensity={1.4} color="#fff2dc" />
    <Box size={[600, 0.1, 1400]} position={[0, -0.05, -500]} color="#7a9a5a" />
    {/* our three lanes heading -z and the opposite carriageway */}
    <Box size={[3 * LANE + 2, 0.04, 1400]} position={[0, 0.02, -500]} color="#4a4c52" shadow={false} />
    <Box size={[3 * LANE + 2, 0.04, 1400]} position={[16, 0.02, -500]} color="#4a4c52" shadow={false} />
    {[-1, 1].map((s) =>
      Array.from({length: 70}).map((_, k) => <Box key={`${s}${k}`} size={[0.15, 0.01, 3]} position={[s * LANE * 0.5, 0.045, 20 - k * 12]} color="#f4f4f0" shadow={false} />),
    )}
    {[-1, 1].map((s) => (
      <Box key={s} size={[0.12, 0.01, 1400]} position={[s * (LANE * 1.5 + 0.3), 0.045, -500]} color="#f4f4f0" shadow={false} />
    ))}
    <Box size={[0.4, 0.8, 1400]} position={[(3 * LANE + 2) / 2 + 1.5, 0.4, -500]} color="#c8c8c4" />
    <Box size={[0.3, 0.8, 1400]} position={[-(3 * LANE + 2) / 2 - 0.5, 0.4, -500]} color="#c8c8c4" />
    {/* the jam: only the middle lane */}
    {Array.from({length: 95}).map((_, k) => {
      const z = 14 - k * 5.6;
      const nudge = Math.max(0, Math.sin(v * 2 + k)) * 0.04;
      return <RoadCar key={k} position={[(rnd(k * 3 + 1) - 0.5) * 0.4, 0, z - nudge]} color={CAR_COLORS[Math.floor(rnd(k * 3 + 2) * CAR_COLORS.length)]} rotation={Math.PI + (rnd(k * 3 + 3) - 0.5) * 0.05} />;
    })}
    {/* a few cars on the other side, moving freely */}
    {Array.from({length: 6}).map((_, k) => (
      <RoadCar key={k} position={[16 + (k % 3 - 1) * LANE, 0, -400 + ((v * 25 + k * 70) % 420)]} color={CAR_COLORS[(k * 3) % CAR_COLORS.length]} />
    ))}
    {/* lamps */}
    {Array.from({length: 18}).map((_, k) => (
      <group key={k} position={[-(3 * LANE + 2) / 2 - 1.2, 0, 10 - k * 32]}>
        <Cyl rTop={0.1} rBottom={0.14} height={10} position={[0, 5, 0]} color="#8a8e96" />
        <Box size={[2.2, 0.15, 0.3]} position={[1.1, 10, 0]} color="#8a8e96" />
      </group>
    ))}
    {/* the gantry with the road sign */}
    <group position={[0, 0, GANTRY_Z]}>
      <Box size={[0.5, 8, 0.5]} position={[-8, 4, 0]} color="#8a8e96" />
      <Box size={[0.5, 8, 0.5]} position={[8, 4, 0]} color="#8a8e96" />
      <Box size={[16.5, 0.6, 0.6]} position={[0, 7.8, 0]} color="#8a8e96" />
      <Box size={[8.4, 3.2, 0.12]} position={[0, 6.4, 0.4]} color="#e8e8e8" />
      <Canvas size={[8, 2.8]} res={[800, 280]} k="mkad" draw={drawSign('МКАД', '#1a6a3a', '#ffffff', '#ffffff')} position={[0, 6.4, 0.47]} rotation={[0, 0, 0]} />
    </group>
    {/* distant blocks */}
    {Array.from({length: 14}).map((_, k) => (
      <Box key={k} size={[18, 20 + rnd(k) * 30, 12]} position={[(k % 2 ? 1 : -1) * (60 + rnd(k + 9) * 80), 15, -150 - k * 40]} color="#d8d2c8" />
    ))}
  </>
);

// ======================================================================= 8. the office: the boss yells, the Dotter doesn't care

const drawGraph = (k: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#f8f8f4';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#222';
  g.font = `600 ${H * 0.1}px ${COND}`;
  g.textAlign = 'left';
  g.fillText('ПРОИЗВОДИТЕЛЬНОСТЬ', W * 0.06, H * 0.14);
  g.strokeStyle = '#999';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(W * 0.08, H * 0.22);
  g.lineTo(W * 0.08, H * 0.9);
  g.lineTo(W * 0.95, H * 0.9);
  g.stroke();
  const pts = [0.75, 0.78, 0.74, 0.76, 0.73, 0.75];
  g.strokeStyle = '#2a9a4a';
  g.lineWidth = 9;
  g.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const x = W * (0.1 + i * 0.08);
    if (i === 0) g.moveTo(x, H * pts[i]);
    else g.lineTo(x, H * pts[i]);
  }
  // the climb
  const x0 = W * 0.5;
  const steps = 12;
  for (let i = 1; i <= steps * k; i++) {
    const f = i / steps;
    g.lineTo(x0 + f * W * 0.42, H * (0.75 - f * f * 0.5));
  }
  g.stroke();
};
export const GRAPH_POS: V3 = [1.7, 1.75, -2.94];
const BOSS_HITS = [28.6, 30.3, 31.9];

const Office: React.FC<{v: number}> = ({v}) => {
  const anger = clamp01((v - S('office')) / 4);
  const hit = BOSS_HITS.reduce((a, h) => Math.max(a, pulse(v, h - 0.25, 0.45)), 0);
  const wave = Math.sin(v * 9) * 0.5;
  const gk = ramp(v, GRAPH[0], GRAPH[1]);
  return (
    <>
      <color attach="background" args={['#d8dde2']} />
      <hemisphereLight color="#ffffff" groundColor="#8a8a8a" intensity={1.25} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} />
      <Box size={[14, 0.1, 10]} position={[0, -0.05, 0]} color="#7a7f88" />
      <Box size={[14, 3.2, 0.1]} position={[0, 1.6, -3.0]} color="#e8e6e0" />
      <Box size={[0.1, 3.2, 10]} position={[4.0, 1.6, 0]} color="#dcdad4" />
      <Canvas size={[1.6, 1.1]} res={[640, 440]} k={`g${Math.round(gk * 24)}`} draw={drawGraph(Math.round(gk * 24) / 24)} position={GRAPH_POS} lit />
      <Box size={[1.7, 1.2, 0.03]} position={[GRAPH_POS[0], GRAPH_POS[1], GRAPH_POS[2] - 0.03]} color="#3a3a40" />
      {/* the hero's desk, the boss across it */}
      <Desk position={[0, 0, 0]} size={[1.4, 0.75]} color="#e8e4dc" />
      <Monitor position={[-0.3, 0.76, -0.15]} k="code" draw={drawCode} w={0.56} />
      <Box size={[0.44, 0.025, 0.14]} position={[0, 0.775, 0.15]} color="#2a2a30" />
      <Chair position={[0, 0, 0.82]} rotation={Math.PI} />
      <Dotter
        position={[0, SEAT, 0.8]}
        rotation={Math.PI}
        look={{i: 2, phones: 'head'}}
        pose={{...SIT, armL: [0.95, 0.1], armR: [0.95, -0.1], elbowL: 0.55 + Math.max(0, Math.sin(v * 22)) * 0.06, elbowR: 0.55 + Math.max(0, Math.sin(v * 22 + 1.6)) * 0.06, head: [0.12, -0.25], eyes: 0.8}}
      />
      <Person
        position={[0.05, 0, -0.75]}
        shirt="#2a3550"
        pants="#22283a"
        hair="#5a4a3a"
        skin={anger > 0.5 ? '#e8907a' : '#e8b8a0'}
        pose={{
          armL: [hit > 0 ? lerp(1.6, 0.9, hit) : 1.4 + wave * 0.6, 0.35],
          elbowL: hit > 0 ? 0.3 : 0.8,
          armR: [hit > 0 ? lerp(2.2, 0.8, hit) : 1.6 - wave * 0.5, -0.4],
          elbowR: hit > 0 ? 0.2 : 1.1,
          mouth: 0.4 + 0.5 * Math.abs(Math.sin(v * 7)),
          eyes: 1.4,
          head: [-0.05, Math.sin(v * 3) * 0.15],
        }}
        bodyExtra={
          <>
            <Box size={[0.1, 0.36, 0.02]} position={[0, 1.27, 0.159]} color="#c82a2a" shadow={false} />
            <Box size={[0.2, 0.12, 0.02]} position={[0, 1.52, 0.155]} color="#f4f4f4" shadow={false} />
          </>
        }
      />
      {/* other Dotters typing in the open space */}
      {[
        [-2.4, 0.0],
        [-2.4, 1.8],
        [-4.6, 0.0],
        [-4.6, 1.8],
        [2.4, 1.8],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Desk position={[0, 0, 0]} size={[1.4, 0.75]} color="#e8e4dc" />
          <Monitor position={[0, 0.76, -0.15]} k="code" draw={drawCode} w={0.5} />
          <Chair position={[0, 0, 0.82]} rotation={Math.PI} />
          <Dotter position={[0, SEAT, 0.8]} rotation={Math.PI} look={{i: i + 3, phones: 'head'}} pose={{...SIT, armL: [0.95, 0.1], armR: [0.95, -0.1], elbowL: 0.55 + Math.max(0, Math.sin(v * 20 + i)) * 0.07, elbowR: 0.55 + Math.max(0, Math.sin(v * 20 + i + 1.4)) * 0.07, head: [0.15, 0]}} />
        </group>
      ))}
    </>
  );
};
const drawCode = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#16181e';
  g.fillRect(0, 0, W, H);
  const cols = ['#7ad0ff', '#c8a0ff', '#8ae08a', '#e0c070', '#d0d0d0'];
  for (let i = 0; i < 14; i++) {
    g.fillStyle = cols[i % cols.length];
    g.fillRect(30 + (i % 4) * 24, 20 + i * 24, 120 + rnd(i) * 360, 10);
  }
};

// ======================================================================= 9. the power plant at night (and when it stops)

const TOWERS: {p: V3; h: number; r: number}[] = [
  {p: [-30, 0, -140], h: 70, r: 25},
  {p: [35, 0, -165], h: 70, r: 25},
  {p: [95, 0, -130], h: 62, r: 22},
];
const Plant: React.FC<{v: number; stop?: number}> = ({v, stop = 1e9}) => {
  const dark = (k: number) => v >= stop + 0.15 * k;
  const glow = clamp01(1 - (v - stop) / 1.2);
  return (
    <>
      <color attach="background" args={['#0a1224']} />
      <Stars opacity={0.7} radius={1500} size={2} />
      <ambientLight intensity={0.35} color="#4a5a8a" />
      <directionalLight position={[-100, 120, 80]} intensity={0.5} color="#9ab0e0" />
      <Box size={[2000, 0.1, 2000]} position={[0, -0.05, -300]} color="#141a22" />
      {TOWERS.map((tw, i) => (
        <React.Fragment key={i}>
          <CoolingTower position={tw.p} h={tw.h} r={tw.r} />
          <Steam position={[tw.p[0], tw.h, tw.p[2]]} r={tw.r * 0.75} t={v} stop={stop} seed={i * 3 + 1} color="#c8d2e0" />
          <pointLight position={[tw.p[0], 8, tw.p[2] + tw.r * 1.6]} color="#ffb860" intensity={v < stop ? 400 : 0} distance={120} decay={1.6} />
        </React.Fragment>
      ))}
      {/* the main building with lit windows and a chimney */}
      <Box size={[70, 22, 30]} position={[10, 11, -70]} color="#3a4252" />
      {Array.from({length: 18}).map((_, k) => {
        const on = !dark(k % 8);
        return <Box key={k} size={[2.4, 1.6, 0.1]} position={[-20 + (k % 9) * 7, 8 + Math.floor(k / 9) * 6, -54.9]} color={on ? '#ffd890' : '#1a1e26'} emissive={on ? '#ffb850' : undefined} emissiveIntensity={1.6} shadow={false} />;
      })}
      <Cyl rTop={2.5} rBottom={3.5} height={90} position={[-60, 45, -100]} color="#8a8a8e" segments={12} />
      {[30, 60, 88].map((y) => (
        <Ico key={y} radius={1} position={[-60, y, -96.5]} color="#ff3a2a" emissive="#ff3a2a" emissiveIntensity={v < stop ? 3 + Math.sin(v * 6) : 0} shadow={false} />
      ))}
      {/* pylons coming toward the camera */}
      {Array.from({length: 6}).map((_, k) => (
        <Pylon key={k} position={[50 + k * 22, 0, -40 + k * 34]} h={30} rotation={0.6} lamp={v < stop} />
      ))}
      {/* the city on the horizon */}
      {Array.from({length: 40}).map((_, k) => {
        const on = v < stop + 0.6 + rnd(k) * 0.8;
        return <Box key={k} size={[6 + rnd(k + 3) * 8, 6 + rnd(k + 5) * 18, 4]} position={[-300 + k * 16, 6, -520 - rnd(k + 7) * 60]} color={on ? '#ffcf80' : '#151a24'} emissive={on ? '#ffaa40' : undefined} emissiveIntensity={0.9} shadow={false} />;
      })}
      {glow > 0 ? <Glow position={[10, 18, -50]} size={60} color="#ffb860" k={0.25 * glow} /> : null}
    </>
  );
};

// ======================================================================= 10. the control room (operators, the leak, everyone leaves)

export const OPS: {seat: V3; i: number}[] = [
  {seat: [-2.4, 0, 0], i: 1},
  {seat: [-0.8, 0, 0], i: 2},
  {seat: [0.8, 0, 0], i: 0},
  {seat: [2.4, 0, 0], i: 3},
  {seat: [-1.6, 0, 2.2], i: 4},
  {seat: [0.0, 0, 2.2], i: 5},
  {seat: [1.6, 0, 2.2], i: 6},
];
export const HERO_OP = 2;
export const DOOR: V3 = [6.5, 0, 1.2];
const drawConsole = (alarm: boolean, blink: boolean) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = alarm ? '#2a0606' : '#06141a';
  g.fillRect(0, 0, W, H);
  if (alarm) {
    g.fillStyle = blink ? '#ff4a3a' : '#a02a22';
    g.font = `700 ${H * 0.16}px ${COND}`;
    g.textAlign = 'center';
    g.fillText('ОПЕРАТОР', W / 2, H * 0.45);
    g.fillText('ОТСУТСТВУЕТ', W / 2, H * 0.68);
    return;
  }
  g.strokeStyle = '#3ae0a0';
  g.lineWidth = 4;
  g.beginPath();
  for (let x = 0; x <= W; x += 8) g.lineTo(x, H * 0.5 + Math.sin(x * 0.05) * H * 0.18);
  g.stroke();
  g.fillStyle = '#3ae0a0';
  g.font = `600 ${H * 0.12}px ${COND}`;
  g.fillText('50.0 Гц', W * 0.06, H * 0.18);
  g.fillText('НОРМА', W * 0.62, H * 0.18);
};
const drawGrid = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#04101a';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#1a6a8a';
  g.lineWidth = 2;
  for (let x = 0; x < W; x += 60) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, H);
    g.stroke();
  }
  for (let y = 0; y < H; y += 60) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  g.strokeStyle = '#3ae0a0';
  g.lineWidth = 6;
  for (let i = 0; i < 9; i++) {
    g.beginPath();
    g.moveTo(W * 0.5, H * 0.5);
    g.lineTo(W * (0.1 + rnd(i) * 0.8), H * (0.1 + rnd(i + 20) * 0.8));
    g.stroke();
  }
  g.fillStyle = '#ffd860';
  for (let i = 0; i < 9; i++) {
    g.beginPath();
    g.arc(W * (0.1 + rnd(i) * 0.8), H * (0.1 + rnd(i + 20) * 0.8), 12, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#3ae0a0';
  g.font = `600 ${H * 0.07}px ${COND}`;
  g.fillText('ЭНЕРГОСИСТЕМА: НОРМА', W * 0.04, H * 0.1);
};
export const drawLeakPhone = (on: boolean) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = on ? '#0e1420' : '#050507';
  g.fillRect(0, 0, W, H);
  if (!on) return;
  roundRect(g, 18, 120, W - 36, 420, 28);
  g.fillStyle = '#1e2a40';
  g.fill();
  g.fillStyle = '#ff5a4d';
  g.font = `700 46px ${COND}`;
  g.fillText('СЛИВ', 44, 182);
  g.fillStyle = '#ffffff';
  g.font = `600 56px ${COND}`;
  g.fillText('Трейлер', 44, 262);
  g.fillText('«Dota 3»', 44, 330);
  // a video thumbnail with a play button
  g.fillStyle = '#3a1a1a';
  g.fillRect(44, 362, W - 88, 150);
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(W / 2 - 26, 400);
  g.lineTo(W / 2 + 32, 437);
  g.lineTo(W / 2 - 26, 474);
  g.fill();
};

const opState = (o: {seat: V3}, idx: number, v: number) => {
  // before the jump: sitting; after: hop up, then run to the door
  const t = v - (JUMP + idx * 0.04);
  if (t < 0) return {p: [o.seat[0], SEAT, o.seat[2] + 0.75] as V3, rot: Math.PI, sitting: true, t: 0};
  const hop = Math.sin(clamp01(t / 0.3) * Math.PI) * 0.35;
  const k = clamp01((t - 0.2) / 1.1);
  const from: V3 = [o.seat[0], 0, o.seat[2] + 0.75];
  const p = lerp3(from, DOOR, easeIn(k));
  const rot = Math.atan2(DOOR[0] - from[0], DOOR[2] - from[2]);
  return {p: [p[0], t < 0.3 ? lerp(SEAT, 0, clamp01(t / 0.15)) + hop : 0, p[2]] as V3, rot: t < 0.15 ? Math.PI : rot, sitting: false, t};
};

const Control: React.FC<{v: number}> = ({v}) => {
  const alarm = v >= ALARM;
  const blink = Math.sin(v * 8) > 0;
  const phonesOn = v >= BUZZ;
  const hoodK = v >= HOME;
  const sip = smooth(ramp(v, HOME + 0.05, HOME + 0.4)) * (1 - smooth(ramp(v, HOME + 1.0, HOME + 1.4)));
  return (
    <>
      <color attach="background" args={['#04060a']} />
      <ambientLight intensity={alarm ? 0.3 : 0.45} color="#5a6a8a" />
      <hemisphereLight color="#3a5a7a" groundColor="#101418" intensity={alarm ? 0.3 : 0.6} />
      {!alarm ? <pointLight position={[0, 3.6, 2]} color="#8aa0c8" intensity={5} distance={12} decay={1.6} /> : null}
      {alarm ? <pointLight position={[0, 3, 1]} color="#ff2a1a" intensity={blink ? 9 : 2} distance={14} decay={1.4} /> : null}
      <Box size={[14, 0.1, 10]} position={[0, -0.05, 1]} color="#1a1e26" />
      <Box size={[14, 4, 0.1]} position={[0, 2, -2.2]} color="#1e2430" />
      <Box size={[0.1, 4, 10]} position={[6.6, 2, 1]} color="#1e2430" />
      <Canvas size={[8, 2.6]} res={[1200, 390]} k={alarm ? 'gridA' : 'grid'} draw={alarm ? drawSign('АВАРИЯ', '#2a0606', blink ? '#ff4a3a' : '#a02a22') : drawGrid} position={[0, 2.3, -2.14]} glow={1.0} />
      {/* the door on the right wall */}
      <Box size={[0.06, 2.2, 1.2]} position={[6.54, 1.1, DOOR[2]]} color={v >= JUMP + 0.4 ? '#0a0a0e' : '#3a4250'} />
      {OPS.map((o, idx) => {
        const st = opState(o, idx, v);
        const hero = idx === HERO_OP;
        const spin = v >= JUMP ? (v - JUMP) * 9 * Math.exp(-(v - JUMP) * 0.8) : 0;
        return (
          <React.Fragment key={idx}>
            {/* console: slanted panel with a screen, faces +z (the operator) */}
            <group position={[o.seat[0], 0, o.seat[2]]}>
              <Box size={[1.3, 0.75, 0.6]} position={[0, 0.375, -0.05]} color="#2a303c" />
              <group position={[0, 0.95, -0.15]} rotation={[-0.5, 0, 0]}>
                <Box size={[1.3, 0.5, 0.06]} position={[0, 0, -0.03]} color="#2a303c" />
                <Canvas size={[1.1, 0.4]} res={[440, 160]} k={alarm ? `a${blink}` : 'ok'} draw={drawConsole(alarm, blink)} position={[0, 0, 0.001]} />
              </group>
              {[0, 1, 2, 3, 4, 5].map((b) => (
                <Box key={b} size={[0.06, 0.02, 0.06]} position={[-0.4 + b * 0.16, 0.76, 0.12]} color={['#3ae07a', '#e0c03a', '#e03a3a'][b % 3]} emissive={['#3ae07a', '#e0c03a', '#e03a3a'][b % 3]} emissiveIntensity={0.8} shadow={false} />
              ))}
              <pointLight position={[0, 1.1, 0.4]} color={alarm ? '#ff3a2a' : '#3ae0c0'} intensity={0.9} distance={2.2} decay={2} />
              {/* the phone on the console */}
              <PhoneSlab
                position={[0.0, 0.765 + (phonesOn && v < JUMP ? Math.abs(Math.sin(v * 60)) * 0.004 : 0), 0.16]}
                rotation={[-Math.PI / 2, 0, (phonesOn && v < JUMP ? Math.sin(v * 50) * 0.04 : 0) + 0.2]}
                k={phonesOn && v < JUMP + 1 ? 'leak1' : 'leak0'}
                draw={drawLeakPhone(phonesOn && v < JUMP + 1)}
              />
              {phonesOn && v < JUMP ? <pointLight position={[0.0, 0.9, 0.3]} color="#6aa0ff" intensity={0.8} distance={1.2} decay={2} /> : null}
            </group>
            <Chair position={[o.seat[0] + (v >= JUMP ? Math.min(0.4, (v - JUMP) * 0.6) : 0), 0, o.seat[2] + 0.78 + (v >= JUMP ? Math.min(0.5, (v - JUMP) * 0.8) : 0)]} rotation={Math.PI + spin} />
            {st.sitting || st.t < 1.5 ? (
              <Dotter
                position={st.p}
                rotation={st.rot}
                look={{i: o.i, hood: hero ? hoodK : idx % 3 === 0, phones: 'neck'}}
                pose={
                  st.sitting
                    ? {
                        ...SIT,
                        armL: phonesOn ? [0.2, 0.15] : [0.8, 0.1],
                        elbowL: phonesOn ? 1.3 : 0.6,
                        armR: hero && sip > 0 ? [lerp(0.8, 1.6, sip), -0.15] : phonesOn ? [0.2, -0.15] : [0.8, -0.1],
                        elbowR: hero && sip > 0 ? lerp(0.6, 2.2, sip) : phonesOn ? 1.3 : 0.6,
                        head: [phonesOn ? 0.55 : hero ? lerp(0.05, -0.15, sip) : 0.05, 0],
                        eyes: phonesOn ? 1.5 : 0.8,
                        mouth: phonesOn ? 0.4 : 0,
                      }
                    : st.t < 0.3
                      ? {legL: 0.3, legR: 0.3, armL: [2.5, 0.3], armR: [2.5, -0.3], eyes: 1.6, mouth: 0.6}
                      : {...runPose(st.t, 1), eyes: 1.5, mouth: 0.5}
                }
                rightHand={hero && st.sitting ? <Can position={[0, -0.04, 0.05]} rotation={[0.3, 0, 0]} /> : null}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

// ======================================================================= 11. the Earth goes dark

export const HUB: V3 = [-0.25, 0.45, 0.86];
const EarthDark: React.FC<{v: number}> = ({v}) => {
  const out = lerp(0, 1.3, easeOut(ramp(v, LIGHTS_OUT[0], LIGHTS_OUT[1])));
  return (
    <>
      <color attach="background" args={['#01020a']} />
      <Stars />
      <NightEarth r={10} hub={HUB} out={v < LIGHTS_OUT[0] ? 0 : out} load={0} sun={[0.9, 0.25, -0.4]} />
    </>
  );
};

// ======================================================================= 12. the dark flat: candle, laptop, the fake

const drawDownload = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#0e141e';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ffffff';
  g.font = `600 ${H * 0.1}px ${COND}`;
  g.textAlign = 'left';
  g.fillText('Скачивание: Dota 3', W * 0.07, H * 0.22);
  roundRect(g, W * 0.07, H * 0.33, W * 0.86, H * 0.11, 10);
  g.fillStyle = '#26303e';
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = `600 ${H * 0.14}px ${COND}`;
  g.fillText('0%', W * 0.07, H * 0.64);
  g.fillStyle = '#ff5a4d';
  g.font = `600 ${H * 0.085}px ${COND}`;
  g.fillText('Нет подключения к интернету', W * 0.07, H * 0.82);
};
export const drawFakePhone = (on: boolean) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = on ? '#0e1420' : '#050507';
  g.fillRect(0, 0, W, H);
  if (!on) return;
  g.fillStyle = '#ffffff';
  g.font = `600 64px ${COND}`;
  g.textAlign = 'center';
  g.fillText('19:30', W / 2, 110);
  g.textAlign = 'left';
  roundRect(g, 18, 160, W - 36, 360, 28);
  g.fillStyle = '#e8ecf2';
  g.fill();
  g.fillStyle = '#5a6270';
  g.font = `600 34px ${COND}`;
  g.fillText('НОВОСТИ', 42, 212);
  g.fillStyle = '#121418';
  g.font = `700 50px ${COND}`;
  g.fillText('Трейлер', 42, 278);
  g.fillText('«Dota 3»', 42, 338);
  g.fillText('оказался', 42, 398);
  g.fillStyle = '#d63a3a';
  g.fillText('фейком', 42, 458);
  g.fillStyle = '#ff5a4d';
  g.font = `600 30px ${COND}`;
  g.fillText('Заряд 1%', 42, H - 40);
};
export const FAKE_PHONE: V3 = [0.42, 0.765, 0.22];

const DarkFlat: React.FC<{v: number}> = ({v}) => {
  const candleOn = v < CANDLE_OUT;
  const lean = smooth(ramp(v, HEAD, HEAD + 0.35));
  const notif = v >= NOTIFY;
  return (
    <>
      <color attach="background" args={['#020205']} />
      <ambientLight intensity={candleOn ? 0.16 : 0.09} color="#3a4a6a" />
      <pointLight position={[-0.2, 1.05, 0.15]} color="#6a8ac0" intensity={candleOn ? 0.9 : 0.5} distance={2} decay={2} />
      <Box size={[5, 0.1, 5]} position={[0, -0.05, 0.5]} color="#2a2420" />
      <Box size={[5, 3, 0.1]} position={[0, 1.5, -0.6]} color="#24282e" />
      <Desk position={[0, 0, 0]} size={[1.5, 0.7]} color="#3a3230" legs="#1a1a1e" />
      <Laptop position={[-0.34, 0.76, -0.1]} rotation={0.25} k="dl" draw={drawDownload} glow={candleOn ? 1 : 0.55} />
      {candleOn ? <Candle position={[-0.64, 0.76, 0.12]} t={v} /> : <Cyl rTop={0.035} rBottom={0.035} height={0.12} position={[-0.64, 0.82, 0.12]} color="#e8dcc6" segments={8} />}
      {!candleOn && v < CANDLE_OUT + 1.6 ? (
        <Ico radius={0.03 + (v - CANDLE_OUT) * 0.05} position={[-0.64, 0.95 + (v - CANDLE_OUT) * 0.18, 0.12]} color="#8a8a90" opacity={0.5 * (1 - (v - CANDLE_OUT) / 1.6)} shadow={false} />
      ) : null}
      <PhoneSlab position={FAKE_PHONE} rotation={[-Math.PI / 2, 0, 0.15]} k={notif ? 'fake1' : 'fake0'} draw={drawFakePhone(notif)} glow={1} />
      {notif ? <pointLight position={[FAKE_PHONE[0] - 0.1, 1.05, FAKE_PHONE[2] + 0.05]} color="#8ab0ff" intensity={2.2} distance={2} decay={2} /> : null}
      <Chair position={[0, 0, 0.8]} rotation={Math.PI} />
      {/* the Dotter: leans forward from the hips and drops the head on the desk */}
      <group position={[0, SEAT + 0.9, 0.75]} rotation={[-lean * 1.12, 0, 0]}>
        <Dotter
          position={[0, -0.9, 0]}
          rotation={Math.PI}
          look={{i: 0, hood: true, phones: 'neck'}}
          pose={{...SIT, armL: [lerp(0.7, 1.4, lean), 0.15], elbowL: lerp(0.9, 0.2, lean), armR: [lerp(0.7, 1.4, lean), -0.15], elbowR: lerp(0.9, 0.2, lean), head: [lerp(0.25, 0.5, lean), 0], eyes: lean > 0.5 ? 0.2 : 0.9}}
        />
      </group>
    </>
  );
};

// ======================================================================= scenes: camera + set per shot

type Scene = {view: (v: number) => View; shakes?: [number, number][]; render: (v: number) => React.ReactNode};

const Y = HERO_WIN;
export const SCENES: Record<Shot, Scene> = {
  room: {
    view: (v) => {
      if (v < SWITCH) return mv(v, S('room'), SWITCH, [0.95, 1.38, 1.15], [0.78, 1.32, 0.9], [-0.02, 1.02, -0.15], [0, 1.03, -0.15], 40);
      return mv(v, SWITCH, E('room'), [0.62, 1.46, -0.08], [0.52, 1.43, 0.02], [0, 1.4, 0.68], [0, 1.42, 0.68], [46, 40]);
    },
    shakes: [[SWITCH, 0.8], [MUG, 0.2]],
    render: (v) => <NightRoom v={v} />,
  },
  windows: {
    view: (v) => mv(v, S('windows'), E('windows'), [Y[0] + 1.2, Y[1] - 0.6, Y[2] + 4], [6, 10, 34], [Y[0], Y[1], Y[2]], [0, 21, -20], [44, 50]),
    render: (v) => <NightBlock v={v} />,
  },
  yard: {
    view: (v) => {
      if (v < TURN - 0.15) return mv(v, S('yard'), TURN - 0.15, [-1.5, 1.9, 9.5], [0.5, 1.75, 6.5], [0, 1.8, -6], [1.0, 1.4, -3], 52);
      return mv(v, TURN - 0.15, E('yard'), [10.6, 2.4, 6.6], [10.2, 2.25, 6.1], [3.5, 1.0, -0.6], [3.2, 1.0, -0.8], 46);
    },
    shakes: [[DOORS, 0.15]],
    render: (v) => <Yard v={v} />,
  },
  queue: {
    view: (v) => mv(v, S('queue'), E('queue'), [26, 9.5, 16], [10, 6.0, 11], [6, 1.6, 2], [0, 2.4, -2.5], 50),
    render: (v) => <Police v={v} />,
  },
  printer: {
    view: (v) => mv(v, S('printer'), E('printer'), [1.4, 1.3, 1.5], [1.15, 1.15, 1.25], [0.2, 0.75, 0.0], [0.2, 0.6, 0.15], 46),
    shakes: [[PRINT[0], 0.15]],
    render: (v) => <Printer v={v} />,
  },
  sheet: {
    view: (v) => mv(v, S('sheet'), E('sheet'), [0.05, 1.78, 0.2], [0.03, 1.6, 0.12], [0, 0.77, 0.0], [0.01, 0.77, 0.01], 38),
    shakes: [[STAMP, 0.5]],
    render: (v) => <Statement v={v} />,
  },
  road: {
    view: (v) => {
      if (v < SIGN - 0.6) return mv(v, S('road'), SIGN - 0.6, [5.2, 2.4, 10], [9, 22, 26], [0, 1.2, -25], [0, 2, -95], [50, 54]);
      return mv(v, SIGN - 0.6, E('road'), [9, 22, 26], [6, 16, 4], [0, 2, -95], [0, 5.5, GANTRY_Z], [54, 48]);
    },
    render: (v) => <Ring v={v} />,
  },
  office: {
    view: (v) => {
      if (v < GRAPH[0] - 0.4) return mv(v, S('office'), GRAPH[0] - 0.4, [1.0, 1.68, 2.3], [0.85, 1.62, 1.9], [0.0, 1.45, -0.7], [0.05, 1.5, -0.7], 46);
      return mv(v, GRAPH[0] - 0.4, E('office'), [0.85, 1.62, 1.9], [1.55, 1.75, 0.9], [0.05, 1.5, -0.7], GRAPH_POS, [46, 46]);
    },
    shakes: [[28.6, 0.15], [30.3, 0.15], [31.9, 0.2]],
    render: (v) => <Office v={v} />,
  },
  plant: {
    view: (v) => mv(v, S('plant'), E('plant'), [45, 9, 70], [32, 8, 52], [25, 42, -140], [28, 44, -140], 52),
    render: (v) => <Plant v={v} />,
  },
  control: {
    view: (v) => {
      if (v < 39.4) return mv(v, S('control'), 39.4, [-1.2, 2.9, 5.8], [-0.6, 2.5, 4.6], [0, 1.4, -1.5], [0.2, 1.3, -1.2], 50);
      return mv(v, 39.4, E('control'), [1.3, 1.55, -0.85], [1.15, 1.52, -0.55], [0.8, 1.42, 0.75], [0.8, 1.4, 0.75], 40);
    },
    render: (v) => <Control v={v} />,
  },
  leak: {
    view: (v) => {
      if (v < LEAK_TXT - 0.2) return mv(v, S('leak'), LEAK_TXT - 0.2, [1.0, 1.85, -0.8], [0.92, 1.78, -0.62], [0.8, 1.3, 0.6], [0.8, 1.3, 0.62], 50);
      return mv(v, LEAK_TXT - 0.2, E('leak'), [0.8, 1.05, 0.22], [0.8, 0.98, 0.2], [0.8, 0.765, 0.16], [0.8, 0.765, 0.16], 36);
    },
    shakes: [[BUZZ, 0.25]],
    render: (v) => <Control v={v} />,
  },
  leave: {
    view: (v) => {
      if (v < ALARM - 0.2) return mv(v, S('leave'), ALARM - 0.2, [-4.2, 2.6, 5.4], [-3.8, 2.4, 5.0], [0.5, 1.0, 0.5], [1.5, 1.0, 0.8], 56);
      return mv(v, ALARM - 0.2, E('leave'), [-0.4, 1.6, 2.6], [0.3, 1.25, 1.6], [0.8, 0.95, 0], [0.8, 0.95, -0.1], 46);
    },
    shakes: [[JUMP, 0.5]],
    render: (v) => <Control v={v} />,
  },
  off: {
    view: (v) => mv(v, S('off'), E('off'), [-110, 10, 60], [-95, 11, 50], [20, 36, -140], [22, 38, -140], 52),
    shakes: [[TOWERS_OFF, 0.2]],
    render: (v) => <Plant v={v} stop={TOWERS_OFF} />,
  },
  earth: {
    view: (v) => mv(v, S('earth'), E('earth'), [-7, 6, 34], [-5, 5, 31], [0, 0.5, 0], [0, 0.6, 0], 44),
    render: (v) => <EarthDark v={v} />,
  },
  candle: {
    view: (v) => {
      if (v < 54.25) return mv(v, S('candle'), 54.25, [-0.78, 1.42, 1.1], [-0.66, 1.36, 0.88], [-0.37, 0.93, -0.2], [-0.37, 0.92, -0.2], 40);
      return mv(v, 54.25, E('candle'), [-0.58, 1.46, -0.42], [-0.5, 1.42, -0.38], [0, 1.36, 0.65], [0, 1.37, 0.65], 48);
    },
    render: (v) => <DarkFlat v={v} />,
  },
  fake: {
    view: (v) => {
      const P = FAKE_PHONE;
      if (v < 57.5) return mv(v, S('fake'), 57.5, [P[0] + 0.02, 1.08, P[2] + 0.12], [P[0] + 0.01, 1.0, P[2] + 0.08], [P[0], P[1], P[2]], [P[0], P[1], P[2]], 36);
      return mv(v, 57.5, 59.2, [0.55, 1.5, -0.44], [0.8, 1.95, -0.42], [0, 1.28, 0.55], [0, 0.9, 0.45], [50, 58]);
    },
    shakes: [[HEAD + 0.35, 0.3]],
    render: (v) => <DarkFlat v={v} />,
  },
};

export const viewAt = (v: number): View => {
  const s = shotAt(v);
  const sc = SCENES[s.name];
  const view = sc.view(v);
  const hv = handheld(view, v, sc.shakes ?? []);
  // far targets: shake the target, not the camera
  const d = Math.hypot(view.pos[0] - view.target[0], view.pos[1] - view.target[1], view.pos[2] - view.target[2]);
  const k = Math.min(1, 2 / d);
  const off: V3 = [hv.pos[0] - view.pos[0], hv.pos[1] - view.pos[1], hv.pos[2] - view.pos[2]];
  return {
    ...hv,
    far: view.far ?? 3000,
    pos: [view.pos[0] + off[0] * k, view.pos[1] + off[1] * k, view.pos[2] + off[2] * k],
    target: [view.target[0] - off[0] * (1 - k), view.target[1] - off[1] * (1 - k), view.target[2] - off[2] * (1 - k)],
  };
};

export const World: React.FC<{v: number; view?: (v: number) => View; shot?: Shot}> = ({v, view, shot}) => {
  const s = shot ?? shotAt(v).name;
  return (
    <>
      <CameraRig v={v} view={view ?? viewAt} />
      {SCENES[s].render(v)}
    </>
  );
};

export {Yard};
