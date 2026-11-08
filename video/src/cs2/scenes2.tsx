import React from 'react';
import {Human, HumanPose, girl, walkPose} from '../bear/People';
import {Chair, Pic, Table} from '../bear/Props';
import {Sky, Tree} from '../bear/Forest';
import {Ball, Block, Cyl, Glow, RBox} from '../bear/kit';
import {Scene, blink, ease, ease5, follow, mv} from '../bear/common';
import type {View} from '../slime/camera';
import {EXIT, GROW, HIRED, SWEEP, V3, lerp, ramp, rnd, shotEnd, shotStart} from './cues';
import {Beam, Laptop, Monitor, Shield, coder, guy} from './Sets';
import {drawSheet, drawShieldScreen, drawSign} from './tex';
import {InteriorLights, playPose} from './scenes1';

const S = shotStart;
const E = shotEnd;

const drawCode = (seed: number, t: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#141824';
  g.fillRect(0, 0, W, H);
  const off = Math.floor(t * 6);
  for (let i = 0; i < 12; i++) {
    const r = rnd(seed * 31 + i + off);
    g.fillStyle = ['#7fd6c2', '#ffd23f', '#ff8fd0', '#9ad0ff'][(i + seed) % 4];
    g.fillRect(W * (0.06 + 0.05 * ((i * 3 + seed) % 4)), H * (0.06 + i * 0.075), W * (0.2 + r * 0.55), H * 0.035);
  }
};

// ======================================================================= 5. the queue of cheat sellers to the tower

const DOOR: V3 = [0, 0, -3.8];
const QUEUE = Array.from({length: 13}, (_, i) => {
  const d = 0.85 + i * 0.78;
  // a gentle curve: straight out of the door, then bending right
  const x = Math.max(0, d - 4) * 0.55;
  const z = DOOR[2] + Math.min(d, 4) + Math.max(0, d - 4) * 0.85;
  return {x, z, i};
});

const Tower: React.FC = () => (
  <group position={[0, 0, -6]}>
    <RBox position={[0, 7, 0]} size={[4.4, 14, 4.2]} r={0.08} color="#7fb0dc" look={{rough: 0.15, metal: 0.45}} />
    {/* window grid on the front */}
    {Array.from({length: 14}, (_, j) => (
      <Block key={`h${j}`} position={[0, 1 + j * 1.0, 2.115]} size={[4.42, 0.06, 0.03]} color="#e8f0f8" />
    ))}
    {[-1.65, -0.55, 0.55, 1.65].map((x) => (
      <Block key={`v${x}`} position={[x, 7, 2.118]} size={[0.06, 14, 0.03]} color="#e8f0f8" />
    ))}
    {/* the door */}
    <RBox position={[0, 1.15, 2.13]} size={[1.4, 2.3, 0.06]} r={0.02} color="#2a3a50" />
    <RBox position={[0, 1.15, 2.165]} size={[0.04, 2.2, 0.02]} r={0.01} color="#c8d0dc" />
    {/* the sign */}
    <RBox position={[0, 2.95, 2.16]} size={[3.6, 0.7, 0.08]} r={0.03} color="#1e2a44" />
    <Pic position={[0, 2.95, 2.202]} size={[3.4, 0.6]} res={[1020, 180]} k="ac-sign" draw={drawSign('ОТДЕЛ АНТИЧИТА', '#1e2a44', '#ffffff')} lit={false} glow={1.05} />
    <Shield position={[0, 15.3, 0.4]} size={2.2} mood={{look: [0, -0.4]}} />
  </group>
);

const Street: React.FC = () => (
  <group>
    <Block position={[0, -0.05, 0]} size={[40, 0.1, 40]} color="#c8c0b0" />
    <Block position={[5.2, -0.04, 0]} size={[3, 0.1, 40]} color="#6a6a72" />
    {[-7, -11].map((x, k) => (
      <RBox key={x} position={[x, 3.5 + k, -4 + k * 2]} size={[3.5, 7 + k * 2, 5]} r={0.1} color={['#f0b98a', '#a8c8a0'][k]} />
    ))}
    {[8.5, 12].map((x, k) => (
      <RBox key={x} position={[x, 4 + k, -6 - k * 3]} size={[3.2, 8 + k * 2, 5]} r={0.1} color={['#e8a0a8', '#c0b0e0'][k]} />
    ))}
    {[
      [-4.2, 1.5],
      [-4.4, 5.5],
      [4.6, -2.0],
      [-4.4, -2.6],
    ].map(([x, z], i) => (
      <Tree key={i} position={[x, 0, z]} h={3.4} seed={i + 3} cols={['#6fbf73', '#4fa860', '#8ad07a', '#5aa86a']} />
    ))}
  </group>
);

const coderWalk = (v: number, i: number): HumanPose => {
  const moving = Math.sin(v * 1.3 + i * 0.7) > 0.2;
  const w = moving ? walkPose(v * 1.4 + i * 0.37, 0.6) : {};
  return {...w, armR: [0.05, 0.12, 0], elbowR: -0.25, head: [0.05, 0.1 * Math.sin(v + i), 0], face: {look: [0, -0.1], lid: blink(v, i) * 0.9 + 0.2, smile: 0.1}};
};

export const queueScene: Scene = {
  view: (v): View => mv(v, S('queue'), E('queue'), [2.6, 1.5, 9.0], [1.6, 1.75, 7.0], [0.1, 2.7, -4.0], [0, 3.0, -4.0], [50, 48], -0.4),
  render: (v) => {
    const t = v - S('queue');
    return (
      <>
        <Sky top="#6fa8e0" mid="#cfe2f2" low="#f6e2c0" />
        <InteriorLights key1={[6, 10, 6]} k={1.05} box={10} warm="#fff4dc" sky="#e8f2ff" ground="#9a8a70" />
        <Street />
        <Tower />
        {QUEUE.map((q) => {
          const step = ramp(t, 0, 3.4) * 0.35;
          const z = q.z - step;
          const front = q.i === 0 ? {x: DOOR[0], z: DOOR[2]} : QUEUE[q.i - 1];
          const yaw = Math.atan2(front.x - q.x, front.z - q.z);
          return (
            <Human
              key={q.i}
              o={coder(q.i)}
              position={[q.x, 0, z]}
              rotation={yaw}
              pose={coderWalk(v, q.i)}
              handR={<RBox position={[0.06, -0.02, 0.02]} size={[0.02, 0.24, 0.3]} r={0.006} color="#3a3c46" />}
            />
          );
        })}
      </>
    );
  },
};

// ======================================================================= 6. the office: the shield grows

const OFF_ROWS = [0, -1.6, -3.2];
const OFF_COLS = [-2.7, -0.9, 0.9, 2.7];

const OfficeRoom: React.FC = () => (
  <group>
    <Block position={[0, -0.05, -1.6]} size={[10, 0.1, 9]} color="#5a6274" />
    <Block position={[0, 1.7, 2.6]} size={[10, 3.4, 0.1]} color="#e9e6e0" look={{rough: 0.95}} />
    <Block position={[0, 1.7, -6.0]} size={[10, 3.4, 0.1]} color="#e9e6e0" look={{rough: 0.95}} />
    <Block position={[-4.9, 1.7, -1.6]} size={[0.1, 3.4, 9]} color="#dcd8d0" look={{rough: 0.95}} />
    {/* windows on the far wall (behind the coders, seen from the front) */}
    {[-3, -1, 1, 3].map((x) => (
      <group key={x} position={[x, 1.8, 2.54]}>
        <mesh rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.6, 1.6]} />
          <meshBasicMaterial color="#bcd8ee" toneMapped={false} />
        </mesh>
        <Block position={[0, 0, -0.02]} size={[1.66, 0.06, 0.04]} color="#d8d8d8" />
      </group>
    ))}
    <Block position={[0, 3.42, -1.6]} size={[10, 0.1, 9]} color="#f2f2ee" />
  </group>
);

const growK = (v: number) => ease(v, GROW[0], GROW[1]);

export const officeScene: Scene = {
  view: (v): View => mv(v, S('office'), E('office'), [2.4, 2.3, -5.4], [1.3, 1.9, -4.6], [0, 1.7, -1.2], [0, 1.85, -1.4], [48, 46], 0.3),
  render: (v) => {
    const g = growK(v);
    const size = lerp(0.7, 1.35, g);
    return (
      <>
        <color attach="background" args={['#cfd8e6']} />
        <InteriorLights key1={[-2, 6, -4]} k={0.95} box={6} />
        <OfficeRoom />
        {OFF_ROWS.map((z, r) =>
          OFF_COLS.map((x, c) => {
            const i = r * 4 + c;
            return (
              <group key={i}>
                <Table position={[x, 0, z]} size={[1.0, 0.6]} h={0.7} top="#f2f2f2" />
                <Laptop position={[x, 0.7, z]} k={`code${i}-${Math.floor(v * 6)}`} draw={drawCode(i, v)} />
                <Chair position={[x, 0, z + 0.6]} rotation={Math.PI} office color="#2a2a30" />
                <Human o={coder(i)} position={[x, 0, z + 0.6]} rotation={Math.PI} pose={{...playPose(v, i + 40), head: [lerp(0.1, -0.25, g), 0, 0], face: {look: [0, 0.3 * g], wide: 0.4 * g, lid: blink(v, i) * 0.9}}} />
              </group>
            );
          }),
        )}
        <Shield position={[0, 2.15 + Math.sin(v * 2) * 0.05, -1.6]} rotation={[0.1, Math.PI, 0]} size={size} mood={{look: [0, -0.4], glow: 1 + g}} />
        <Glow position={[0, 2.2, -1.9]} size={2.5 + 2 * g} color="#ff5a4a" k={0.25 + 0.3 * g} />
        <pointLight position={[0, 2.2, -2.2]} color="#ff6a5a" intensity={1 + 3 * g} distance={7} decay={1.6} />
      </>
    );
  },
};

// ======================================================================= 7. out of the game

const MON: V3 = [0, 0.7, 0];
const SCREEN_C: V3 = [0, 0.7 + 0.13 + 0.158, -0.004];

const exitShield = (v: number): {p: V3; size: number; lid: number; wide: number; angry: number} => {
  const k = ease5(v, EXIT - 0.25, EXIT + 0.45);
  const up = ease5(v, EXIT + 1.3, E('exit'));
  return {
    p: [SCREEN_C[0], SCREEN_C[1] + 0.08 * k + 1.6 * up, lerp(-0.16, 0.3, k) - 0.2 * up],
    size: lerp(0.18, 0.28, k),
    lid: v < EXIT + 0.5 ? 0.35 : 0,
    wide: ease(v, EXIT + 0.4, EXIT + 0.6),
    angry: v < EXIT + 0.5 ? 1 : 0,
  };
};

const Shards: React.FC<{t: number}> = ({t}) => {
  if (t <= 0 || t > 1.5) return null;
  return (
    <>
      {Array.from({length: 18}, (_, i) => {
        const a = rnd(i * 1.7) * Math.PI * 2;
        const sp = 0.3 + rnd(i * 2.3) * 0.6;
        const y = SCREEN_C[1] + Math.sin(a) * sp * t * 0.8 - 2.2 * t * t;
        return (
          <RBox
            key={i}
            position={[SCREEN_C[0] + Math.cos(a) * sp * t, Math.max(0.72, y), SCREEN_C[2] + 0.05 + (0.6 + rnd(i) * 0.8) * t]}
            rotation={[t * 9 + i, t * 6, i]}
            size={[0.03 + rnd(i * 3) * 0.03, 0.02 + rnd(i * 5) * 0.03, 0.004]}
            r={0.001}
            color={i % 3 ? '#cfe8ff' : '#0f1424'}
            look={{rough: 0.2, metal: 0.3}}
            shadow={false}
          />
        );
      })}
    </>
  );
};

export const exitScene: Scene = {
  view: (v): View => {
    if (v < EXIT - 0.2) return mv(v, S('exit'), EXIT - 0.2, [0.35, 1.12, 0.95], [0.2, 1.06, 0.7], SCREEN_C, SCREEN_C, [40, 38]);
    if (v < EXIT + 0.45) return mv(v, EXIT - 0.2, EXIT + 0.45, [0.2, 1.06, 0.7], [0.4, 1.18, 1.35], SCREEN_C, [0, 1.12, 0.15], [38, 44]);
    return mv(v, EXIT + 0.45, E('exit'), [0.4, 1.18, 1.35], [0.55, 1.3, 1.7], [0, 1.12, 0.15], [0, 1.6, 0], [44, 48]);
  },
  shakes: [[EXIT, 0.6]],
  render: (v) => {
    const sh = exitShield(v);
    const broken = v >= EXIT;
    return (
      <>
        <color attach="background" args={['#cfd8e6']} />
        <InteriorLights key1={[2, 6, 4]} k={0.85} box={4} />
        <OfficeRoom />
        <Table position={[0, 0, 0]} size={[1.2, 0.7]} h={0.7} top="#f2f2f2" />
        <Monitor position={[MON[0], MON[1], MON[2]]} k={broken ? 'scr-broken' : `scr-${Math.round(ramp(v, S('exit'), EXIT) * 10)}`} draw={broken ? (g, W, H) => {
          g.fillStyle = '#0a0c14';
          g.fillRect(0, 0, W, H);
          g.strokeStyle = '#cfe8ff';
          g.lineWidth = 3;
          for (let i = 0; i < 9; i++) {
            const a = (i / 9) * Math.PI * 2 + 0.3;
            g.beginPath();
            g.moveTo(W / 2, H / 2);
            g.lineTo(W / 2 + Math.cos(a) * W * 0.6, H / 2 + Math.sin(a) * H * 0.7);
            g.stroke();
          }
        } : (g, W, H) => drawShieldScreen(g, W, H, 0.5 + 0.5 * ramp(v, S('exit'), EXIT))} w={0.62} />
        <Shield position={sh.p} size={sh.size} mood={{lid: sh.lid, wide: sh.wide, angry: sh.angry, look: [0, 0]}} />
        <Shards t={v - EXIT} />
        <pointLight position={[0, 1.0, 0.4]} color="#ff5a4a" intensity={1.5 + (broken ? 2 : 0)} distance={3} decay={1.6} />
        {/* desk clutter */}
        <RBox position={[-0.42, 0.72, 0.15]} size={[0.2, 0.03, 0.28]} r={0.01} color="#f4f0e6" />
        <Cyl position={[0.45, 0.76, 0.1]} rt={0.04} rb={0.035} h={0.1} seg={16} color="#e85d75" />
      </>
    );
  },
};

// ======================================================================= 8. the exam

const EX_COLS = [-1.4, 0, 1.4];
const EX_ROWS = [-1.0, 0.4, 1.8];
const examX = (v: number) => lerp(-2.6, 2.6, ramp(v, SWEEP[0], SWEEP[1]));
const examBanAt = (x: number) => SWEEP[0] + ((x + 2.6) / 5.2) * (SWEEP[1] - SWEEP[0]);

const studentPose = (v: number, at: number, i: number): HumanPose => {
  const k = ease(v, at, at + 0.3);
  return {
    sit: 1,
    lean: lerp(0.28, 0.0, k),
    head: [lerp(0.45, -0.2, k), 0, 0],
    armR: [lerp(-0.7, -2.7, k), lerp(0.1, 0.5, k), 0],
    elbowR: lerp(-1.2, -1.8, k),
    armL: [lerp(-0.6, -2.7, k), lerp(0.15, 0.5, k), 0],
    elbowL: lerp(-1.0, -1.8, k),
    face: k > 0.05 ? {wide: k, o: k, mouth: 0.7 * k, brow: 0.07 * k, browIn: 0.35 * k, look: [0, 0.3]} : {look: [0, -0.5], lid: 0.35 + blink(v, i) * 0.6, browIn: 0.3},
  };
};

const Classroom: React.FC = () => (
  <group>
    <Block position={[0, -0.05, 0.4]} size={[8, 0.1, 8]} color="#c89a6a" />
    <Block position={[0, 1.7, 3.6]} size={[8, 3.4, 0.1]} color="#e8f0e0" look={{rough: 0.95}} />
    <Block position={[3.6, 1.7, 0.4]} size={[0.1, 3.4, 8]} color="#dfe8d8" look={{rough: 0.95}} />
    <Block position={[-3.6, 1.7, 0.4]} size={[0.1, 3.4, 8]} color="#dfe8d8" look={{rough: 0.95}} />
    <RBox position={[0, 2.0, 3.53]} size={[3.4, 1.2, 0.05]} r={0.02} color="#2f5a3a" />
    <Pic position={[0, 2.0, 3.502]} rotation={[0, Math.PI, 0]} size={[3.2, 1.05]} res={[960, 315]} k="ege-board" draw={drawSign('ЕГЭ', '#2f5a3a', '#ffffff', 'не списывать!', '#ffd23f')} />
    {/* windows on the right wall */}
    {[-1.4, 0.6, 2.6].map((z) => (
      <group key={z} position={[3.54, 1.8, z]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[1.3, 1.5]} />
          <meshBasicMaterial color="#cfe6f6" toneMapped={false} />
        </mesh>
        <Block position={[0, 0, 0.02]} size={[0.05, 1.56, 0.04]} color="#f4f4f0" />
      </group>
    ))}
    {/* clock */}
    <group position={[-3.54, 2.4, 1.0]} rotation={[0, Math.PI / 2, 0]}>
      <Cyl rotation={[Math.PI / 2, 0, 0]} rt={0.22} rb={0.22} h={0.05} seg={32} color="#f8f8f4" />
      <RBox position={[0, 0.06, 0.03]} size={[0.02, 0.14, 0.01]} r={0.004} color="#1a1a1a" />
      <RBox position={[0.05, 0, 0.032]} rotation={[0, 0, Math.PI / 2]} size={[0.02, 0.1, 0.01]} r={0.004} color="#1a1a1a" />
    </group>
  </group>
);

export const examScene: Scene = {
  view: (v): View => mv(v, S('exam'), E('exam'), [-1.9, 2.5, -3.0], [1.2, 2.2, -2.7], [-0.6, 1.25, 0.6], [0.6, 1.25, 0.6], [50, 48], -0.3),
  render: (v) => {
    const sx = examX(v);
    const beamK = ease(v, SWEEP[0] - 0.2, SWEEP[0]) * (1 - ease(v, SWEEP[1], SWEEP[1] + 0.3));
    const sp: V3 = [sx, 2.2 + Math.sin(v * 2) * 0.05, 0.4];
    return (
      <>
        <color attach="background" args={['#e8f0e0']} />
        <InteriorLights key1={[5, 6, 1]} k={1.0} box={5} />
        <Classroom />
        {EX_ROWS.map((z, r) =>
          EX_COLS.map((x, c) => {
            const i = r * 3 + c;
            const at = examBanAt(x);
            const red = ease(v, at, at + 0.15);
            const o = i % 2 ? girl(i + 8) : guy(i + 20);
            return (
              <group key={i}>
                <Table position={[x, 0, z]} size={[0.9, 0.55]} h={0.68} top="#d8c8a8" />
                <group position={[x, 0.684, z + 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
                  <Pic size={[0.3, 0.4]} res={[300, 400]} k={`sheet${i}-${Math.round(red * 8)}`} draw={(g, W, H) => drawSheet(g, W, H, red, i)} />
                </group>
                <Chair position={[x, 0, z + 0.55]} rotation={Math.PI} color="#7a8a9a" />
                <Human o={o} position={[x, 0, z + 0.55]} rotation={Math.PI} pose={studentPose(v, at, i)} />
              </group>
            );
          }),
        )}
        <Shield position={sp} rotation={[0.35, Math.PI, 0]} size={0.6} mood={{look: [0, -0.6], angry: 0.5}} />
        {EX_ROWS.map((z) => (
          <Beam key={z} from={[sp[0], sp[1] - 0.1, sp[2]]} to={[sp[0], 0.7, z + 0.05]} r={0.45} k={beamK} />
        ))}
      </>
    );
  },
};

export {Ball};
