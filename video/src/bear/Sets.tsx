import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Ball, Block, Cyl, G, Glow, Pill, RBox, Ring, mat} from './kit';
import {Garland, HoneyJar, Pic, Plate, Pot, Table} from './Props';
import {drawBanner, drawChart, drawFrameSign, drawNeon, drawOnAir, drawPoster, drawWoodSign} from './tex';
import {V3, rnd} from './cues';
import {LEAF_COLS} from './Forest';
import {girl} from './People';

// Interiors (Аня's room, the office, the den, the studio), the den outside, the crowd.

const WALL = {rough: 0.95};

// ---------------------------------------------------------------- Аня's room

export const AnyaRoom: React.FC<{night?: number}> = ({night = 0}) => {
  const wall = night > 0.5 ? '#5a4a6a' : '#efd9bd';
  return (
    <group>
      <Block position={[0, -0.05, 0]} size={[6, 0.1, 6]} color="#a8754a" />
      {/* planks */}
      {Array.from({length: 12}, (_, i) => (
        <Block key={i} position={[-3 + i * 0.5 + 0.25, 0.0015, 0]} size={[0.004, 0.003, 6]} color="#8a5a34" shadow={false} receive={false} />
      ))}
      <RBox position={[0, 0.006, 0.4]} size={[2.2, 0.012, 1.6]} r={0.006} color="#c8574a" look={{rough: 1}} />
      <Block position={[0, 1.5, -2.0]} size={[6, 3, 0.1]} color={wall} look={WALL} />
      <Block position={[-2.3, 1.5, 0]} size={[0.1, 3, 6]} color={wall} look={WALL} />
      {/* window on the left wall with an autumn view */}
      <group position={[-2.24, 1.55, -0.2]} rotation={[0, Math.PI / 2, 0]}>
        <RBox size={[1.3, 1.1, 0.06]} r={0.02} color="#f6f0e6" />
        <mesh position={[0, 0, 0.032]} material={mat(night > 0.5 ? '#1a2240' : '#9ccbea', {basic: true})}>
          <planeGeometry args={[1.16, 0.96]} />
        </mesh>
        {night > 0.5
          ? null
          : [0, 1, 2, 3, 4].map((k) => <Ball key={k} position={[-0.45 + k * 0.23, -0.25 + (k % 2) * 0.08, 0.034]} scale={[0.16, 0.16, 0.001]} color={LEAF_COLS[k % LEAF_COLS.length]} look={{basic: true}} shadow={false} />)}
        <Block position={[0, 0, 0.05]} size={[0.04, 0.96, 0.03]} color="#f6f0e6" />
        <Block position={[0, 0, 0.05]} size={[1.16, 0.04, 0.03]} color="#f6f0e6" />
      </group>
      {/* bed */}
      <group position={[0.3, 0, -1.2]}>
        <RBox position={[0, 0.22, 0]} size={[1.9, 0.3, 1.5]} r={0.05} color="#8a5a34" />
        <RBox position={[0, 0.42, 0.02]} size={[1.85, 0.16, 1.45]} r={0.07} color="#f4efe6" />
        <RBox position={[0.15, 0.53, 0.25]} rotation={[0.04, 0, 0.02]} size={[1.6, 0.1, 1.0]} r={0.05} color="#7fa8d8" look={{rough: 1, rim: '#ffffff', rimK: 0.15}} />
        <RBox position={[-0.55, 0.6, -0.5]} rotation={[0.2, 0.2, 0]} size={[0.6, 0.18, 0.35]} r={0.08} color="#ffd8b8" />
        <RBox position={[0.2, 0.6, -0.52]} rotation={[0.2, -0.15, 0]} size={[0.55, 0.16, 0.32]} r={0.08} color="#f2b42e" />
        <RBox position={[0, 0.9, -0.73]} size={[1.9, 0.9, 0.08]} r={0.03} color="#8a5a34" />
      </group>
      {/* a plush bear on the shelf, of course */}
      <group position={[1.6, 1.32, -1.85]}>
        <RBox position={[0, -0.04, 0]} size={[0.9, 0.04, 0.25]} r={0.01} color="#8a5a34" />
        <Ball position={[0, 0.08, 0]} scale={[0.1, 0.11, 0.09]} color="#9a6236" />
        <Ball position={[0, 0.22, 0.01]} scale={0.075} color="#9a6236" />
        <Ball position={[-0.05, 0.28, 0]} scale={0.03} color="#9a6236" />
        <Ball position={[0.05, 0.28, 0]} scale={0.03} color="#9a6236" />
        <Ball position={[0.25, 0.06, 0]} scale={[0.06, 0.08, 0.06]} color="#5aa0e6" />
        <Cyl position={[-0.3, 0.07, 0]} rt={0.04} rb={0.04} h={0.14} color="#e8462e" />
      </group>
      {/* poster */}
      <Pic position={[-0.6, 1.75, -1.94]} size={[0.6, 0.8]} res={[300, 400]} k="poster-room" draw={(g, W, H) => drawPoster(g, W, H, 'ЛЕС', 'зовёт', '#3a6a4a')} />
      {/* string lights over the bed */}
      <Garland pts={[[-0.9, 2.3, -1.9], [0.4, 2.15, -1.9], [1.5, 2.3, -1.9]]} on={night > 0.5 ? 0.6 : 0.35} n={8} />
      {/* desk lamp */}
      <group position={[1.65, 0, -0.9]}>
        <RBox position={[0, 0.3, 0]} size={[0.5, 0.6, 0.45]} r={0.02} color="#f4efe6" />
        <Cyl position={[0, 0.75, 0]} rt={0.02} rb={0.05} h={0.3} color="#2a2a30" />
        <Cyl position={[0, 0.95, 0]} rt={0.08} rb={0.14} h={0.14} seg={20} color="#f2b42e" look={{emissive: '#ffd27a', emissiveK: night > 0.5 ? 0.3 : 0.1}} />
        <Glow position={[0, 0.88, 0]} size={0.8} color="#ffd27a" k={night > 0.5 ? 0.25 : 0.3} />
      </group>
      {/* plant */}
      <group position={[-1.8, 0, -1.6]}>
        <Cyl position={[0, 0.15, 0]} rt={0.15} rb={0.11} h={0.3} color="#d8724a" />
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <Ball key={k} position={[Math.cos(k) * 0.12, 0.42 + (k % 3) * 0.12, Math.sin(k) * 0.12]} rotation={[0.4 * Math.cos(k), 0, 0.4 * Math.sin(k)]} scale={[0.07, 0.17, 0.035]} color="#4a8a4a" />
        ))}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- the office

export const Office: React.FC = () => (
  <group>
    <Block position={[0, -0.05, 0]} size={[8, 0.1, 7]} color="#6a7488" />
    <Block position={[0, 1.6, -2.6]} size={[8, 3.2, 0.1]} color="#e9e4dc" look={WALL} />
    <Block position={[-3.2, 1.6, 0]} size={[0.1, 3.2, 7]} color="#e9e4dc" look={WALL} />
    {/* window strip with a soft skyline */}
    <group position={[1.4, 1.65, -2.54]}>
      <mesh material={mat('#bcd8ee', {basic: true})}>
        <planeGeometry args={[3.6, 1.6]} />
      </mesh>
      {Array.from({length: 9}, (_, i) => (
        <mesh key={i} position={[-1.6 + i * 0.4, -0.8 + (0.3 + rnd(i) * 0.6) / 2, 0.005]} material={mat('#9ab8d4', {basic: true})}>
          <planeGeometry args={[0.32, 0.3 + rnd(i) * 0.6]} />
        </mesh>
      ))}
      {[-1.8, -0.6, 0.6, 1.8].map((x) => (
        <Block key={x} position={[x, 0, 0.03]} size={[0.06, 1.66, 0.05]} color="#d8d8d8" />
      ))}
    </group>
    <Pic position={[-1.7, 1.75, -2.54]} size={[1.0, 1.3]} res={[400, 520]} k="poster-office" draw={(g, W, H) => drawPoster(g, W, H, 'МЕДОВАЯ ФАБРИКА', 'с 1987 года', '#c8701a')} />
    <Pic position={[-3.14, 1.7, -0.6]} rotation={[0, Math.PI / 2, 0]} size={[1.2, 0.8]} res={[480, 320]} k="chart" draw={drawChart} />
    {/* plant */}
    <group position={[2.9, 0, -2.1]}>
      <Cyl position={[0, 0.25, 0]} rt={0.2} rb={0.16} h={0.5} color="#2a2a30" />
      {[0, 1, 2, 3, 4, 5, 6].map((k) => (
        <Ball key={k} position={[Math.cos(k) * 0.18, 0.7 + (k % 3) * 0.18, Math.sin(k) * 0.18]} rotation={[0.5 * Math.cos(k), 0, 0.5 * Math.sin(k)]} scale={[0.09, 0.28, 0.04]} color="#3a7a4a" />
      ))}
    </group>
    <Table position={[0, 0, 0]} size={[2.4, 1.2]} top="#5a3e2a" />
  </group>
);

// ---------------------------------------------------------------- the den outside

export const DEN: V3 = [0, 0, 0];

const Window: React.FC<{position: V3; rotation?: V3; r?: number; glow?: number}> = ({position, rotation, r = 0.42, glow = 1}) => (
  <group position={position} rotation={rotation}>
    <Cyl rotation={[Math.PI / 2, 0, 0]} rt={r + 0.07} rb={r + 0.07} h={0.12} seg={28} color="#7a4e2a" />
    <Cyl position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]} rt={r} rb={r} h={0.06} seg={28} color="#ffc66a" look={{emissive: '#ffb050', emissiveK: 0.5 + 0.7 * glow}} />
    <Block position={[0, 0, 0.07]} size={[0.04, r * 2, 0.02]} color="#7a4e2a" />
    <Block position={[0, 0, 0.07]} size={[r * 2, 0.04, 0.02]} color="#7a4e2a" />
    <Glow position={[0, 0, 0.2]} size={r * 3.2} color="#ffb860" k={0.35 * glow} />
  </group>
);

// k: 0 bare ground .. 1 finished; lights: garland 0..1
export const Den: React.FC<{k?: number; lights?: number; smoke?: number; v?: number; sign?: boolean}> = ({k = 1, lights = 1, smoke = 1, v = 0, sign = true}) => {
  const grow = Math.max(0.001, Math.min(1, k));
  const done = Math.max(0, (k - 0.8) / 0.2);
  return (
    <group>
      {/* frame of logs while building */}
      {k < 0.98
        ? [-1.6, -0.55, 0.55, 1.6].map((x) => (
            <group key={x}>
              <Cyl position={[x, 1.2, 1.2]} rt={0.09} rb={0.1} h={2.4} seg={10} color="#a0703e" />
              <Cyl position={[x, 1.0, -1.3]} rt={0.09} rb={0.1} h={2.0} seg={10} color="#a0703e" />
            </group>
          ))
        : null}
      {k < 0.98 ? <Cyl position={[0, 2.4, 1.2]} rotation={[0, 0, Math.PI / 2]} rt={0.09} rb={0.09} h={3.6} seg={10} color="#a0703e" /> : null}
      {/* the mound */}
      <group scale={[grow, grow, grow]}>
        <mesh position={[0, 0, 0]} scale={[2.6, 2.35, 2.3]} geometry={G.hemi(48)} material={mat('#7a8a3a', {rough: 1, rim: '#e8f0a0', rimK: 0.25})} castShadow receiveShadow />
        {Array.from({length: 26}, (_, i) => {
          const a = rnd(i * 1.7) * Math.PI * 2;
          const el = 0.15 + rnd(i * 2.9) * 1.1;
          return (
            <Ball
              key={i}
              position={[Math.cos(a) * Math.cos(el) * 2.55, Math.sin(el) * 2.3, Math.sin(a) * Math.cos(el) * 2.25]}
              scale={[0.32, 0.12, 0.32]}
              rotation={[Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6]}
              color={LEAF_COLS[i % LEAF_COLS.length]}
              look={{rough: 1}}
              shadow={false}
            />
          );
        })}
      </group>
      {done > 0 ? (
        <group scale={[1, 1, 1]}>
          {/* door */}
          <group position={[0, 0, 2.14]}>
            <Cyl position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]} rt={0.62} rb={0.62} h={0.2} seg={32} color="#6a4426" />
            <Block position={[0, 0.4, 0]} size={[1.24, 0.8, 0.2]} color="#6a4426" />
            <Cyl position={[0, 0.8, 0.06]} rotation={[Math.PI / 2, 0, 0]} rt={0.52} rb={0.52} h={0.14} seg={32} color="#b5703a" />
            <Block position={[0, 0.4, 0.06]} size={[1.04, 0.8, 0.14]} color="#b5703a" />
            <Ball position={[0.36, 0.7, 0.15]} scale={0.045} color="#e2b22b" look={{metal: 0.9, rough: 0.3}} />
          </group>
          <Window position={[-1.45, 1.05, 1.62]} rotation={[0, -0.6, 0]} glow={lights} />
          <Window position={[1.45, 1.05, 1.62]} rotation={[0, 0.6, 0]} glow={lights} />
          <Window position={[0, 1.95, 1.3]} rotation={[-0.55, 0, 0]} r={0.3} glow={lights} />
          {/* chimney + smoke */}
          <Cyl position={[0.9, 2.3, -0.5]} rt={0.22} rb={0.26} h={1.0} seg={14} color="#8a7a6a" look={{rough: 1}} />
          {smoke > 0
            ? [0, 1, 2, 3, 4].map((i) => {
                const t = (v * 0.35 + i / 5) % 1;
                return <Ball key={i} position={[0.9 + t * 0.6, 2.9 + t * 2.2, -0.5 - t * 0.3]} scale={0.18 + t * 0.4} color="#e8e2da" look={{opacity: 0.55 * (1 - t) * smoke, rough: 1}} shadow={false} />;
              })
            : null}
          <Garland pts={[[-2.2, 0.9, 1.0], [-1.2, 1.9, 1.8], [0, 2.35, 1.95], [1.2, 1.9, 1.8], [2.2, 0.9, 1.0]]} on={lights} n={8} />
          {/* mailbox */}
          <group position={[1.9, 0, 2.6]}>
            <Cyl position={[0, 0.5, 0]} rt={0.04} rb={0.04} h={1.0} seg={8} color="#6a4426" />
            <RBox position={[0, 1.05, 0]} size={[0.3, 0.22, 0.4]} r={0.08} color="#d8342a" />
          </group>
        </group>
      ) : null}
      {sign && k > 0.95 ? (
        <group position={[-1.95, 0, 2.75]} rotation={[0, 0.35, 0]}>
          <Cyl position={[0, 0.6, -0.02]} rt={0.05} rb={0.05} h={1.2} seg={8} color="#6a4426" />
          <Pic position={[0, 1.15, 0.05]} size={[1.25, 0.55]} res={[500, 220]} k="den-sign" draw={(g, W, H) => drawWoodSign(g, W, H, ['3 КОМНАТЫ', 'ВИД НА РЕЧКУ'])} shadow />
        </group>
      ) : null}
    </group>
  );
};

export const River: React.FC<{z?: number; v?: number; w?: number; len?: number; x?: number}> = ({z = -5, v = 0, w = 3.2, len = 80, x = 0}) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#4a8ac8', {rough: 0.15, metal: 0.1, emissive: '#2a5a8a', emissiveK: 0.3})} receiveShadow>
      <planeGeometry args={[len, w]} />
    </mesh>
    {Array.from({length: 26}, (_, i) => {
      const xx = ((rnd(i * 3.1) * len + v * 0.8) % len) - len / 2;
      const tw = 0.5 + 0.5 * Math.sin(v * 3 + i * 2.3);
      return <Glow key={i} position={[xx, 0.05, (rnd(i * 5.3) - 0.5) * w * 0.8]} size={0.25} color="#ffffff" k={0.4 * tw} />;
    })}
    {/* banks */}
    {([1, -1] as const).map((s) => (
      <mesh key={s} position={[0, 0.06, (w / 2 + 0.1) * s]} rotation={[0, 0, Math.PI / 2]} scale={[0.14, len, 0.3]} geometry={G.cyl(1, 1, 1, 10)} material={mat('#8a6a3a', {rough: 1})} receiveShadow />
    ))}
  </group>
);

// ---------------------------------------------------------------- the den inside

export const DenInside: React.FC<{v?: number; pot?: boolean; table?: [number, number]}> = ({v = 0, pot = true, table = [1.9, 1.1]}) => (
  <group>
    <Block position={[0, -0.05, 0]} size={[7, 0.1, 7]} color="#9a6a3c" />
    {Array.from({length: 14}, (_, i) => (
      <Block key={i} position={[-3.5 + i * 0.5 + 0.25, 0.0015, 0]} size={[0.004, 0.003, 7]} color="#7a4e2a" shadow={false} receive={false} />
    ))}
    {/* round log walls: the inside of a cylinder */}
    <mesh position={[0, 1.5, 0]} geometry={G.cyl(3.2, 3.2, 3.0, 40, true)} material={mat('#b8834e', {rough: 0.9, side: THREE.BackSide})} receiveShadow />
    {Array.from({length: 6}, (_, i) => (
      <mesh key={i} position={[0, 0.25 + i * 0.5, 0]} geometry={G.torus(3.17, 0.05, Math.PI * 2, 48)} rotation={[Math.PI / 2, 0, 0]} material={mat('#8a5a30', {rough: 0.9})} />
    ))}
    {/* round window with the river view */}
    <group position={[1.53, 1.55, -2.6]} rotation={[0, -0.53, 0]}>
      <Cyl rotation={[Math.PI / 2, 0, 0]} rt={0.62} rb={0.62} h={0.14} seg={32} color="#6a4426" />
      <mesh position={[0, 0, 0.075]} material={mat('#8cc8f0', {basic: true})}>
        <circleGeometry args={[0.52, 32]} />
      </mesh>
      <mesh position={[0, -0.2, 0.078]} material={mat('#4a8ac8', {basic: true})}>
        <planeGeometry args={[0.98, 0.25]} />
      </mesh>
      {[0, 1, 2].map((k) => (
        <Ball key={k} position={[-0.3 + k * 0.3, 0.08, 0.08]} scale={[0.15, 0.15, 0.001]} color={LEAF_COLS[k]} look={{basic: true}} shadow={false} />
      ))}
      <Block position={[0, 0, 0.09]} size={[0.04, 1.04, 0.03]} color="#6a4426" />
      <Block position={[0, 0, 0.09]} size={[1.04, 0.04, 0.03]} color="#6a4426" />
    </group>
    {/* the framed plan «3 КОМНАТЫ» */}
    <group position={[-1.67, 1.6, -2.5]} rotation={[0, 0.58, 0]}>
      <RBox size={[0.86, 0.68, 0.05]} r={0.02} color="#c8a050" look={{metal: 0.5, rough: 0.4}} />
      <Pic position={[0, 0, 0.027]} size={[0.76, 0.58]} res={[440, 336]} k="frame-sign" draw={drawFrameSign} />
    </group>
    {/* hanging lamp */}
    <Cyl position={[0, 2.85, 0.2]} rt={0.01} rb={0.01} h={0.5} seg={6} color="#2a2020" />
    <mesh position={[0, 2.55, 0.2]} scale={[0.32, 0.2, 0.32]} geometry={G.hemi(24)} material={mat('#e8a040', {side: THREE.DoubleSide, emissive: '#ffb050', emissiveK: 0.3})} />
    <Glow position={[0, 2.45, 0.2]} size={2.2} color="#ffc070" k={0.45} />
    {/* table with dinner */}
    <Table position={[0, 0, 0.2]} size={table} top="#8a5a34" cloth="#f4ead8" />
    {pot ? <Pot position={[0.15, 0.765, 0.32]} /> : null}
    <HoneyJar position={[0.32, 0.765, -0.05]} scale={1.2} />
    {[-0.4, 0.45].map((x) => (
      <group key={x} position={[x, 0.765, 0.55]}>
        <Cyl position={[0, 0.08, 0]} rt={0.025} rb={0.03} h={0.16} seg={12} color="#fbf3e2" />
        <Glow position={[0, 0.2, 0]} size={0.45} color="#ffcf7a" k={0.6 + 0.15 * Math.sin(v * 9 + x * 10)} />
        <Ball position={[0, 0.185, 0]} scale={[0.012, 0.025, 0.012]} color="#ffd27a" look={{basic: true}} shadow={false} />
      </group>
    ))}
  </group>
);

// ---------------------------------------------------------------- the studio

export const Studio: React.FC<{v?: number; viewers?: number; dark?: number}> = ({v = 0, viewers = 20000000, dark = 0}) => {
  const panels = useMemo(() => {
    const out: {p: V3; c: string}[] = [];
    for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) out.push({p: [-3.2 + i * 0.8, 0.6 + j * 0.62, -2.9], c: (i + j) % 2 ? '#2b2440' : '#332a4c'});
    return out;
  }, []);
  return (
    <group>
      <Block position={[0, -0.05, 0]} size={[8, 0.1, 7]} color="#2a2430" />
      <RBox position={[0, 0.005, 0.1]} size={[3.6, 0.01, 2.6]} r={0.005} color="#5a2a3a" look={{rough: 1}} />
      <Block position={[0, 1.6, -3.0]} size={[8, 3.4, 0.1]} color="#1e1a28" />
      <Block position={[-3.6, 1.6, 0]} size={[0.1, 3.4, 7]} color="#1e1a28" />
      <Block position={[3.6, 1.6, 0]} size={[0.1, 3.4, 7]} color="#1e1a28" />
      {panels.map((q, i) => (
        <RBox key={i} position={q.p} size={[0.74, 0.56, 0.08]} r={0.04} color={q.c} look={{rough: 1}} />
      ))}
      {/* neon */}
      <Pic position={[0, 2.35, -2.84]} size={[2.6, 0.75]} res={[780, 225]} k="neon" draw={(g, W, H) => drawNeon(g, W, H, 'ПОДКАСТ', '#ff4fd8')} lit={false} glow={1.15} transparent />
      <Glow position={[0, 2.35, -2.7]} size={4.0} color="#ff4fd8" k={0.3} />
      {/* on-air board */}
      <group position={[-1.45, 1.78, -2.82]}>
        <Pic size={[0.95, 0.3]} res={[480, 150]} k={`onair-sign${Math.floor(v * 2) % 2}`} draw={(g, W, H) => drawOnAir(g, W, H, -1, (Math.floor(v * 2) % 2) * 1)} lit={false} glow={1.1} />
        <Glow position={[0, 0, 0.1]} size={1.6} color="#ff3b3b" k={0.25} />
      </group>
      {/* shelf with a plant and a honey jar (a hint) */}
      <group position={[2.2, 1.3, -2.8]}>
        <RBox size={[1.0, 0.04, 0.25]} r={0.01} color="#3a2a20" />
        <HoneyJar position={[-0.25, 0.02, 0]} scale={1.1} />
        <Cyl position={[0.2, 0.1, 0]} rt={0.08} rb={0.06} h={0.18} color="#d8724a" />
        {[0, 1, 2, 3].map((k) => (
          <Ball key={k} position={[0.2 + Math.cos(k * 1.6) * 0.06, 0.28 + (k % 2) * 0.06, Math.sin(k * 1.6) * 0.06]} scale={[0.04, 0.1, 0.02]} rotation={[0.4 * Math.cos(k), 0, 0.4 * Math.sin(k)]} color="#4a8a4a" />
        ))}
      </group>
      {/* the desk */}
      <RBox position={[0, 0.74, 0]} size={[2.2, 0.06, 1.1]} r={0.03} color="#4a3226" look={{rough: 0.5}} />
      <Cyl position={[0, 0.37, 0]} rt={0.12} rb={0.25} h={0.72} seg={16} color="#2a2026" />
      {/* warm desk lamps */}
      {[
        [-0.72, -0.42],
        [0.95, -0.35],
      ].map(([x, z]) => (
        <group key={x} position={[x, 0.77, z]}>
          <Cyl position={[0, 0.15, 0]} rt={0.012} rb={0.06} h={0.3} seg={10} color="#1a1a20" />
          <Cyl position={[0, 0.33, 0]} rt={0.05} rb={0.09} h={0.1} seg={16} color="#c89a40" look={{emissive: '#ffc060', emissiveK: 0.4}} />
          <Glow position={[0, 0.27, 0.0]} size={0.6} color="#ffc070" k={0.5 * (1 - dark)} />
        </group>
      ))}
    </group>
  );
};

export const Banner: React.FC<{position: V3; rotation?: number; w?: number}> = ({position, rotation = 0, w = 4.2}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    {([1, -1] as const).map((s) => (
      <Cyl key={s} position={[(w / 2 + 0.05) * s, 1.4, 0]} rt={0.05} rb={0.06} h={2.8} seg={8} color="#6a4426" />
    ))}
    <Pic position={[0, 2.3, 0]} size={[w, w * 0.2]} res={[1050, 210]} k="banner" draw={drawBanner} shadow />
  </group>
);

// ---------------------------------------------------------------- a crowd of fans (instanced, cheap)

const CROWD_TOPS = ['#ff8fb1', '#7fd6c2', '#9b7bd8', '#f4f1ea', '#5aa0e6', '#ff9f43', '#e85d75', '#c7e46b', '#f2b42e'];
const CROWD_HAIR = ['#e8c372', '#1f1714', '#6a3a1e', '#e889b0', '#a54a22', '#3a2618'];

export type Fan = {p: V3; yaw: number; i: number};

export const Crowd: React.FC<{fans: Fan[]; v: number; jump?: number; phones?: number; freeze?: boolean}> = ({fans, v, jump = 0.5, phones = 0.5, freeze}) => {
  const n = fans.length;
  const meshes = useMemo(() => {
    const body = new THREE.InstancedMesh(G.capsule(0.17, 0.3, 10), new THREE.MeshStandardMaterial({roughness: 0.85}), n);
    const legs = new THREE.InstancedMesh(G.capsule(0.07, 0.5, 8), new THREE.MeshStandardMaterial({roughness: 0.85, color: '#3a4460'}), n * 2);
    const head = new THREE.InstancedMesh(G.sphere(16), new THREE.MeshStandardMaterial({roughness: 0.7}), n);
    const hair = new THREE.InstancedMesh(G.sphere(16), new THREE.MeshStandardMaterial({roughness: 0.75}), n);
    const arm = new THREE.InstancedMesh(G.capsule(0.055, 0.36, 8), new THREE.MeshStandardMaterial({roughness: 0.85}), n);
    const phone = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.14, 0.01), new THREE.MeshBasicMaterial({color: '#cfe8ff', toneMapped: false}), n);
    const col = new THREE.Color();
    fans.forEach((f, k) => {
      body.setColorAt(k, col.set(CROWD_TOPS[(f.i * 3) % CROWD_TOPS.length]));
      arm.setColorAt(k, col.set(CROWD_TOPS[(f.i * 3) % CROWD_TOPS.length]));
      head.setColorAt(k, col.set(['#f4c7a6', '#e6b08a', '#f7d2b6', '#d89e78'][f.i % 4]));
      hair.setColorAt(k, col.set(CROWD_HAIR[f.i % CROWD_HAIR.length]));
    });
    for (const m of [body, legs, head, hair, arm]) {
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
    }
    phone.frustumCulled = false;
    return {body, legs, head, hair, arm, phone};
  }, [n]);
  const o = useMemo(() => new THREE.Object3D(), []);
  const q = useMemo(() => new THREE.Object3D(), []);
  fans.forEach((f, k) => {
    const ph = f.i * 1.7;
    const hop = freeze ? 0 : Math.max(0, Math.sin(v * (6 + (f.i % 3)) + ph)) * 0.08 * jump;
    const sway = freeze ? 0 : Math.sin(v * 2.2 + ph) * 0.06;
    const up = (f.i % 3 !== 0 ? 1 : 0) * phones;
    q.position.set(f.p[0], f.p[1] + hop, f.p[2]);
    q.rotation.set(0, f.yaw, sway);
    q.updateMatrixWorld();
    const put = (mesh: THREE.InstancedMesh, idx: number, x: number, y: number, z: number, rx = 0, rz = 0, s: V3 = [1, 1, 1]) => {
      o.position.set(x, y, z);
      o.rotation.set(rx, 0, rz);
      o.scale.set(...s);
      o.updateMatrix();
      o.matrix.premultiply(q.matrixWorld);
      mesh.setMatrixAt(idx, o.matrix);
    };
    put(meshes.body, k, 0, 0.98, 0);
    put(meshes.legs, k * 2, 0.08, 0.38, 0);
    put(meshes.legs, k * 2 + 1, -0.08, 0.38, 0);
    put(meshes.head, k, 0, 1.47, 0.0, 0, 0, [0.16, 0.16, 0.16]);
    put(meshes.hair, k, 0, 1.5, -0.04, 0, 0, [0.175, 0.17, 0.17]);
    // most of them hold a phone up; the rest keep their arms down
    if (up > 0) {
      put(meshes.arm, k, 0.21, 1.47, 0.04, -0.2, 0.12);
      put(meshes.phone, k, 0.24, 1.73, 0.1, -0.25, 0);
    } else {
      put(meshes.arm, k, 0.21, 1.0, 0, 0, 0.12);
      put(meshes.phone, k, 0, -5, 0);
    }
  });
  for (const m of Object.values(meshes)) m.instanceMatrix.needsUpdate = true;
  return (
    <>
      {Object.values(meshes).map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </>
  );
};

// fans standing in rows / a queue along a curve
export const queueFans = (pts: V3[], n: number, seed = 1, spread = 0.5): Fan[] => {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  return Array.from({length: n}, (_, i) => {
    const t = i / Math.max(1, n - 1);
    const p = curve.getPoint(t);
    const tan = curve.getTangent(t);
    const side = (rnd(seed + i * 1.3) - 0.5) * spread;
    return {p: [p.x - tan.z * side, 0, p.z + tan.x * side] as V3, yaw: Math.atan2(-tan.x, -tan.z) + (rnd(i * 2.1) - 0.5) * 0.6, i: i + seed};
  });
};

export const blobFans = (center: V3, r: number, n: number, seed = 1, face?: V3): Fan[] =>
  Array.from({length: n}, (_, i) => {
    const a = rnd(seed + i * 1.37) * Math.PI * 2;
    const d = Math.sqrt(rnd(seed * 2 + i * 1.91)) * r;
    const x = center[0] + Math.cos(a) * d;
    const z = center[2] + Math.sin(a) * d;
    const yaw = face ? Math.atan2(face[0] - x, face[2] - z) + (rnd(i) - 0.5) * 0.4 : rnd(i * 3.3) * 6.28;
    return {p: [x, 0, z] as V3, yaw, i: i + seed};
  });

export {Garland, girl, Pill, Ring};
