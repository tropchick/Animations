import React from 'react';
import * as THREE from 'three';
import {CameraRig, View, handheld} from '../slime/camera';
import {Planet, Moon, Stars, Glow} from '../gta/Space';
import {Helicopter} from '../lastman/common';
import {ServerRoom, CanvasPlane} from '../gta2/Sets';
import {COND, roundRect} from '../gta/tex';
import {
  BURST,
  BAR,
  HELI_FUEL,
  LAND,
  MOON_LEAVE,
  NEEDLE,
  PASS,
  PILE_DROP,
  REVEAL,
  SINK,
  STALL,
  STEP,
  Shot,
  TRUCK_STEP,
  V3,
  ZOOM,
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
import {BathScale, BlackHoleRing, Box, Cyl, DottedRing, Donut, Galaxy, Ico, Lorry, RobeBall, RobeHem, Scientist, Slipper, Spring, useRobe} from './Sets';

const S = (n: Shot) => shotStart(n);
const E = (n: Shot) => shotEnd(n);
const mv = (v: number, t0: number, t1: number, a: V3, b: V3, ta: V3, tb: V3, fov: number | [number, number], far = 3000): View => {
  const k = smooth(ramp(v, t0, t1));
  return {pos: lerp3(a, b, k), target: lerp3(ta, tb, k), fov: typeof fov === 'number' ? fov : lerp(fov[0], fov[1], k), far};
};

// a dust puff that starts at `at` and spreads
const Dust: React.FC<{origin: V3; v: number; at: number; n?: number; size?: number; spread?: number; color?: string; seed?: number}> = ({origin, v, at, n = 10, size = 1, spread = 3, color = '#b9aa94', seed = 1}) => {
  const age = v - at;
  if (age < 0 || age > 3) return null;
  const k = easeOut(age / 1.6);
  const fade = 1 - clamp01((age - 0.6) / 2.4);
  return (
    <group position={origin}>
      {Array.from({length: n}).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + rnd(seed + i) * 0.6;
        const r = spread * k * (0.6 + rnd(seed + i * 3) * 0.6);
        return <Ico key={i} radius={size * (0.4 + k * 0.9) * (0.7 + rnd(seed + i * 5) * 0.6)} position={[Math.cos(a) * r, size * 0.3 + k * size * (0.5 + rnd(seed + i * 7)), Math.sin(a) * r]} color={color} opacity={0.75 * fade} />;
      })}
    </group>
  );
};

// ======================================================================= 1. the bathroom scale

const needleAngle = (v: number) => {
  if (v < NEEDLE[0]) return 0;
  if (v < BURST) return Math.PI * 2 * 3.2 * easeIn(ramp(v, NEEDLE[0], NEEDLE[1]));
  return Math.PI * 2 * 3.2 + Math.sin((v - BURST) * 30) * 0.4 * Math.exp(-(v - BURST) * 3);
};
const slipperDrop = (v: number) => lerp(0.62, 0, easeIn(ramp(v, 0.25, STEP)));
// parts flying off the bursting scale: [dir x, up speed, dir z, spin]
const PARTS = Array.from({length: 11}).map((_, i) => [Math.cos(i * 2.4) * (0.5 + rnd(i + 1) * 0.6), 1.3 + rnd(i + 2) * 1.6, Math.sin(i * 2.4) * (0.4 + rnd(i + 3) * 0.6) + 0.25, 6 + rnd(i + 4) * 10]);
const fly = (i: number, v: number, base: V3): {p: V3; r: V3} => {
  const t = Math.max(0, v - BURST);
  const [dx, vy, dz, spin] = PARTS[i];
  const tl = Math.min(t, 1.4);
  const y = Math.max(0.01, base[1] + vy * tl - 4.9 * tl * tl);
  const ground = y <= 0.011;
  return {p: [base[0] + dx * tl, y, base[2] + dz * tl], r: ground ? [Math.PI / 2, i, 0] : [spin * tl, spin * tl * 0.7, 0]};
};

const Bathroom: React.FC<{v: number}> = ({v}) => {
  const burst = v >= BURST;
  const squash = burst ? 0.35 : lerp(1, 0.82, smooth(ramp(v, STEP, BURST)));
  const lift = burst ? 0 : 0.045 * squash + 0.006;
  const sy = v < STEP ? slipperDrop(v) + 0.051 : lift;
  return (
    <>
      <color attach="background" args={['#cfe3ea']} />
      <hemisphereLight color="#ffffff" groundColor="#b0a8a0" intensity={1.3} />
      <directionalLight position={[2, 4, 3]} intensity={1.6} />
      <pointLight position={[0.4, 0.6, 0.8]} intensity={1.2} distance={3} decay={2} color="#fff4e6" />
      {/* tiled floor and wall */}
      <Box size={[4, 0.1, 4]} position={[0, -0.05, 0]} color="#e9edf0" />
      {Array.from({length: 13}).map((_, k) => (
        <React.Fragment key={k}>
          <Box size={[4, 0.003, 0.008]} position={[0, 0.0015, -1.8 + k * 0.3]} color="#b9c3c9" shadow={false} />
          <Box size={[0.008, 0.003, 4]} position={[-1.8 + k * 0.3, 0.0015, 0]} color="#b9c3c9" shadow={false} />
        </React.Fragment>
      ))}
      <Box size={[4, 3, 0.1]} position={[0, 1.5, -1.0]} color="#bfe0ea" />
      {Array.from({length: 10}).map((_, k) => (
        <Box key={k} size={[4, 0.008, 0.004]} position={[0, 0.2 + k * 0.2, -0.948]} color="#9cc6d3" shadow={false} />
      ))}
      {/* a towel and a bath corner for context */}
      <Box size={[1.6, 0.55, 0.7]} position={[-1.3, 0.275, -0.6]} color="#ffffff" />
      <Box size={[0.36, 0.5, 0.04]} position={[0.9, 0.9, -0.93]} color="#7cc4a8" />
      {/* the scale: whole, then the flattened base with the parts flying */}
      <BathScale needle={needleAngle(v)} squash={squash} broken={burst} />
      {burst
        ? PARTS.map((_, i) => {
            const {p, r} = fly(i, v, [0, 0.03, 0]);
            return i < 8 ? <Spring key={i} position={p} rotation={r} s={1.4} /> : <Box key={i} size={[0.12, 0.006, 0.09]} position={p} rotation={r} color="#dbe5ee" />;
          })
        : null}
      {/* two slippers and the robe hem above them */}
      <Slipper position={[-0.075, sy, -0.03]} rotation={[0, 0.06, 0]} scale={0.27} />
      <Slipper position={[0.075, sy, -0.03]} rotation={[0, -0.06, 0]} scale={0.27} />
      <RobeHem position={[0, sy + 0.36, -0.12]} r={0.42} h={2.4} repeat={[5, 4]} />
      <Dust origin={[0, 0, 0.05]} v={v} at={BURST} n={9} size={0.05} spread={0.35} color="#f0f0f0" />
    </>
  );
};

// ======================================================================= 2. the pile of broken scales

const PILE = Array.from({length: 46}).map((_, i) => {
  const r = 1.45 * Math.sqrt(rnd(i * 5 + 1));
  const a = rnd(i * 5 + 2) * Math.PI * 2;
  const y = (1 - r / 1.55) * 0.85 + rnd(i * 5 + 3) * 0.05;
  return {p: [Math.cos(a) * r, y, Math.sin(a) * r * 0.8] as V3, rot: [(rnd(i * 5 + 4) - 0.5) * 1.2, rnd(i * 5 + 5) * 6, (rnd(i * 5 + 6) - 0.5) * 1.2] as V3};
});

const drawBoard = (g: CanvasRenderingContext2D, W: number, H: number, n: number) => {
  g.fillStyle = '#f7f7f2';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#8a8f96';
  g.lineWidth = 10;
  g.strokeRect(5, 5, W - 10, H - 10);
  g.fillStyle = '#1e3a8a';
  g.textAlign = 'center';
  g.font = `600 ${Math.round(H * 0.15)}px ${COND}`;
  g.fillText('ПРОЕКТ «МАМА» · С 2006 ГОДА', W / 2, H * 0.24);
  g.fillStyle = '#333';
  g.font = `500 ${Math.round(H * 0.13)}px ${COND}`;
  g.fillText('СЛОМАНО ВЕСОВ:', W / 2, H * 0.5);
  g.fillStyle = '#d62828';
  g.font = `700 ${Math.round(H * 0.3)}px ${COND}`;
  g.fillText(n.toLocaleString('ru-RU'), W / 2, H * 0.86);
};

const Storage: React.FC<{v: number}> = ({v}) => {
  const thrown = v >= PILE_DROP;
  const k = smooth(ramp(v, PILE_DROP - 0.55, PILE_DROP));
  const hand: V3 = [0.7, 1.3, -1.3];
  const land: V3 = [0.3, 0.85, -0.3];
  const arc: V3 = [lerp(hand[0], land[0], k), lerp(hand[1], land[1], k) + Math.sin(Math.PI * k) * 0.45, lerp(hand[2], land[2], k)];
  const arms = v < PILE_DROP - 0.55 ? 1.2 : lerp(1.9, 0.5, smooth(ramp(v, PILE_DROP - 0.55, PILE_DROP - 0.2)));
  return (
    <>
      <color attach="background" args={['#2a2f38']} />
      <hemisphereLight color="#e8eef8" groundColor="#3a3a40" intensity={1.0} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} />
      <pointLight position={[0, 2.6, 0.5]} intensity={8} distance={7} decay={2} color="#fff2dd" />
      <Box size={[8, 0.1, 8]} position={[0, -0.05, 0]} color="#7b8088" />
      <Box size={[8, 3.4, 0.1]} position={[0, 1.7, -2.6]} color="#c9ced6" />
      <Box size={[0.1, 3.4, 8]} position={[-3.2, 1.7, 0]} color="#b9bec6" />
      {/* metal shelves along the left wall */}
      {[0.4, 1.1, 1.8].map((y) => (
        <Box key={y} size={[0.5, 0.04, 3]} position={[-2.9, y, -0.6]} color="#6b7280" />
      ))}
      <CanvasPlane size={[1.75, 0.95]} res={[880, 480]} k={`b${thrown}`} draw={(g, W, H) => drawBoard(g, W, H, thrown ? 4813 : 4812)} position={[0.05, 2.0, -2.54]} />
      {PILE.map((p, i) => (
        <BathScale key={i} position={p.p} rotation={p.rot} squash={0.6} needle={i} broken />
      ))}
      {PILE.slice(0, 14).map((p, i) => (
        <Spring key={`s${i}`} position={[p.p[0] + 0.1, p.p[1] + 0.06, p.p[2] + 0.12]} rotation={[i, i * 2, 0.5]} s={1.5} />
      ))}
      <BathScale position={arc} rotation={thrown ? [0.5, 0.8, -0.3] : [0.3 + k * 2, 0.4, k * 1.5]} squash={0.6} broken />
      <Scientist
        position={[0.95, 0, -1.6]}
        rotation={-0.7}
        pose={{armL: [arms, 0.15], armR: [arms, -0.15], elbowL: 0.4, elbowR: 0.4, head: [0.25, 0]}}
      />
      <Scientist position={[-1.6, 0, 1.4]} rotation={2.6} hair="#2a2018" pose={{armL: [0.6, 0.1], armR: [0.3, -0.1], elbowL: 1.6, elbowR: 0.3, head: [0.15, 0]}} />
      <Dust origin={land} v={v} at={PILE_DROP} n={6} size={0.12} spread={0.4} color="#d8d8d8" />
    </>
  );
};

// ======================================================================= 3. the weighbridge

const sinkY = (v: number) => -5.5 * easeIn(ramp(v, SINK[0], SINK[1]));
const giantY = (v: number) => (v < TRUCK_STEP ? lerp(26, 0.1, easeIn(ramp(v, 7.75, TRUCK_STEP))) : 0.1);

const drawSign = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#1f5fbf';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#fff';
  g.lineWidth = 12;
  g.strokeRect(14, 14, W - 28, H - 28);
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.font = `600 ${Math.round(H * 0.3)}px ${COND}`;
  g.fillText('ВЕСОВОЙ КОНТРОЛЬ', W / 2, H * 0.45);
  g.font = `500 ${Math.round(H * 0.22)}px ${COND}`;
  g.fillText('МАКС. 60 ТОНН', W / 2, H * 0.8);
};

const Weighbridge: React.FC<{v: number}> = ({v}) => {
  const s = sinkY(v);
  const gy = giantY(v) + s;
  const cracks = v >= SINK[0] - 0.15 ? 1 : 0;
  return (
    <>
      <color attach="background" args={['#9fd0f5']} />
      <fog attach="fog" args={['#bfe0f5', 80, 420]} />
      <hemisphereLight color="#dff0ff" groundColor="#6a7a50" intensity={1.4} />
      <directionalLight position={[40, 80, 50]} intensity={2.0} color="#fff6e8" />
      {/* grass on both sides of the road, the road with a gap where the weighbridge chunk sits */}
      <Box size={[600, 0.2, 296]} position={[0, -0.1, 152]} color="#7ba352" />
      <Box size={[600, 0.2, 296]} position={[0, -0.1, -152]} color="#7ba352" />
      <Box size={[290, 0.2, 8]} position={[155, 0, 0]} color="#4b4f55" />
      <Box size={[290, 0.2, 8]} position={[-155, 0, 0]} color="#4b4f55" />
      {Array.from({length: 22}).map((_, k) => {
        const x = -160 + k * 15;
        return Math.abs(x) < 12 ? null : <Box key={k} size={[5, 0.004, 0.25]} position={[x, 0.102, 0]} color="#f2f2f2" shadow={false} />;
      })}
      {/* the hole walls under the chunk (only seen once it sinks) */}
      <Box size={[20, 7.88, 0.04]} position={[0, -4.06, -3.97]} color="#3b2f25" />
      <Box size={[20, 7.88, 0.04]} position={[0, -4.06, 3.97]} color="#3b2f25" />
      <Box size={[0.04, 7.88, 7.9]} position={[-9.97, -4.06, 0]} color="#3b2f25" />
      <Box size={[0.04, 7.88, 7.9]} position={[9.97, -4.06, 0]} color="#3b2f25" />
      {/* the chunk: road + platform with yellow edge stripes, sinking */}
      <group position={[0, s, 0]}>
        <Box size={[19.86, 0.2, 7.86]} position={[0, 0, 0]} color="#4b4f55" />
        <Box size={[16, 0.06, 3.6]} position={[0, 0.13, 0]} color="#8d939b" />
        {Array.from({length: 16}).map((_, k) => (
          <React.Fragment key={k}>
            <Box size={[0.5, 0.005, 0.2]} position={[-7.5 + k, 0.163, 1.7]} color={k % 2 ? '#1a1a1a' : '#ffd21f'} shadow={false} />
            <Box size={[0.5, 0.005, 0.2]} position={[-7.5 + k, 0.163, -1.7]} color={k % 2 ? '#1a1a1a' : '#ffd21f'} shadow={false} />
          </React.Fragment>
        ))}
      </group>
      {/* cracks running out from the hole */}
      {cracks
        ? Array.from({length: 8}).map((_, k) => (
            <Box key={k} size={[2 + rnd(k + 1) * 4, 0.006, 0.12]} position={[(k % 2 ? 1 : -1) * (11.5 + rnd(k + 2) * 2), 0.103, -3 + k * 0.8]} rotation={[0, (rnd(k + 3) - 0.5) * 1.2, 0]} color="#22252a" shadow={false} />
          ))
        : null}
      {/* the booth, barrier, sign and a lorry waiting its turn */}
      <Box size={[3, 2.8, 3]} position={[14, 1.4, 7.5]} color="#e7e2d6" />
      <Box size={[3.2, 0.25, 3.2]} position={[14, 2.92, 7.5]} color="#c0392b" />
      <Box size={[1.6, 0.9, 0.05]} position={[14, 1.8, 5.98]} color="#2a3a4a" shadow={false} />
      <Box size={[0.3, 1.2, 0.3]} position={[11.5, 0.6, 4.6]} color="#e74c3c" />
      <Box size={[0.18, 0.18, 7]} position={[11.5, 1.15, 1.2]} rotation={[v > TRUCK_STEP + 0.4 ? -1.2 * smooth(ramp(v, TRUCK_STEP + 0.4, TRUCK_STEP + 1.4)) : 0, 0, 0]} color="#f2f2f2" />
      <Box size={[0.2, 4, 0.2]} position={[-14, 2, 6]} color="#9aa0a6" />
      <Box size={[0.2, 4, 0.2]} position={[-9, 2, 6]} color="#9aa0a6" />
      <CanvasPlane size={[5.2, 1.8]} res={[780, 270]} k="sign" draw={drawSign} position={[-11.5, 4.3, 6.21]} />
      <Box size={[5.4, 2.0, 0.1]} position={[-11.5, 4.3, 6.15]} color="#e0e0e0" />
      <Lorry position={[-22, 0.1, -2]} />
      <Scientist position={[16.5, 0, 6.2]} rotation={-0.6} pose={{armL: [0.2, 0.1], armR: [0.2, -0.1], head: [-0.4, 0]}} />
      {/* the giant slipper (toe along +x) and the robe hem over it */}
      <Slipper position={[0, gy + 0.06, 0]} rotation={[0, Math.PI / 2, 0]} scale={14} />
      <RobeHem position={[-2.5, gy + 7.5, -0.5]} r={9.5} h={90} repeat={[6, 9]} />
      <Dust origin={[0, 0.2, 0]} v={v} at={TRUCK_STEP} n={10} size={0.8} spread={9} color="#c9bda8" seed={5} />
      <Dust origin={[0, 0.2, 0]} v={v} at={SINK[1] - 0.2} n={12} size={1.1} spread={12} color="#a89a86" seed={9} />
    </>
  );
};

// ======================================================================= 4. the helicopter along the robe

const HELI_START = 11.75;
const heliX = (v: number) => {
  const t = v - HELI_START;
  const ts = STALL - HELI_START;
  if (t < ts) return 50 * t;
  const d = v - STALL;
  return 50 * ts + 50 * (1 - Math.exp(-d * 1.2)) / 1.2;
};
const heliY = (v: number) => lerp(45, 2.0, smooth(ramp(v, STALL + 0.1, LAND)));
const rotor = (v: number) => (v < STALL ? v : STALL + (1 - Math.exp(-(v - STALL) * 2.5)) / 2.5);

const RobeWall: React.FC = () => {
  const map = useRobe([60, 22]);
  return (
    <mesh position={[0, 700, -700]}>
      <cylinderGeometry args={[600, 600, 1400, 160, 1, true]} />
      <meshStandardMaterial map={map} roughness={0.95} side={THREE.DoubleSide} />
    </mesh>
  );
};

const HeliRun: React.FC<{v: number}> = ({v}) => {
  const p: V3 = [heliX(v), heliY(v), -50];
  return (
    <>
      <color attach="background" args={['#a8d6f7']} />
      <fog attach="fog" args={['#c8e4f7', 150, 900]} />
      <hemisphereLight color="#e6f3ff" groundColor="#5f7f45" intensity={1.4} />
      <directionalLight position={[200, 300, 300]} intensity={2.0} color="#fff3e2" />
      <Box size={[6000, 0.2, 1200]} position={[0, -0.1, 0]} color="#7aa851" />
      {/* field stripes for speed */}
      {Array.from({length: 40}).map((_, k) => (
        <Box key={k} size={[18, 0.01, 260]} position={[-100 + k * 30, 0.01, 20]} color={k % 2 ? '#8fbf5c' : '#6c9a44'} shadow={false} />
      ))}
      {/* a road and a few trees in the foreground */}
      <Box size={[6000, 0.02, 6]} position={[0, 0.02, 15]} color="#555a60" shadow={false} />
      {Array.from({length: 30}).map((_, k) => (
        <group key={k} position={[-40 + k * 22 + rnd(k) * 8, 0, 30 + rnd(k + 9) * 25]}>
          <Cyl rTop={0.4} rBottom={0.5} height={3} position={[0, 1.5, 0]} color="#6b4a2f" segments={6} />
          <Ico radius={3 + rnd(k + 3) * 1.5} position={[0, 5, 0]} color={rnd(k + 5) > 0.5 ? '#3f7a35' : '#4f8a3a'} />
        </group>
      ))}
      {/* clouds near the robe */}
      {Array.from({length: 16}).map((_, k) => (
        <group key={k} position={[-50 + k * 45, 70 + rnd(k + 1) * 40, -85 + rnd(k + 2) * 10]}>
          <Ico radius={9} position={[0, 0, 0]} color="#ffffff" />
          <Ico radius={7} position={[9, -2, 2]} color="#f4f8fb" />
          <Ico radius={6} position={[-8, -3, 1]} color="#f4f8fb" />
        </group>
      ))}
      <RobeWall />
      <Helicopter position={p} rotation={Math.PI / 2} t={rotor(v)} color="#e0a020" />
      {v > LAND - 0.1 ? <Dust origin={[p[0], 0.1, p[2]]} v={v} at={LAND - 0.1} n={10} size={1.2} spread={6} color="#c8c09a" /> : null}
    </>
  );
};

// ======================================================================= 5. the Earth from orbit

export const ORBIT_R = 10;
const dir = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).normalize();
const SLIP_DIR = dir(-0.32, 0.42, 1);
export const ORBIT_SLIPPER: V3 = SLIP_DIR.clone().multiplyScalar(ORBIT_R * 1.05).toArray() as V3;
export const ORBIT_WALL: V3 = dir(0.42, 0.18, 1).multiplyScalar(ORBIT_R).toArray() as V3;
const SLIP_Q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), SLIP_DIR).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.9));
const SUN1: V3 = [-6, 3, 10];

const Orbit: React.FC<{v: number}> = () => (
  <>
    <color attach="background" args={['#02030a']} />
    <Stars />
    <ambientLight intensity={0.25} />
    <directionalLight position={SUN1} intensity={2.2} />
    <Planet r={ORBIT_R} sun={SUN1} st={{spin: 2.3}} />
    <Slipper quaternion={SLIP_Q} position={SLIP_DIR.clone().multiplyScalar(ORBIT_R * 0.995).toArray() as V3} scale={3.6} />
  </>
);

// ======================================================================= 6. the Moon changes its mind

const MOON_R = 18;
const HER: V3 = [64, 0, -36];
const HER_R = 36;
const HER_ORBIT = 50;
const earthMoon = (v: number): V3 => {
  const a = 0.9 + 0.55 * (v - S('moon'));
  return [Math.cos(a) * MOON_R, 0, Math.sin(a) * MOON_R];
};
const herMoon = (v: number): V3 => {
  const m = earthMoon(MOON_LEAVE);
  const a0 = Math.atan2(m[2] - HER[2], m[0] - HER[0]);
  const a = a0 - 0.35 * (v - MOON_LEAVE);
  return [HER[0] + Math.cos(a) * HER_ORBIT, 0, HER[2] + Math.sin(a) * HER_ORBIT];
};
const moonPos = (v: number): V3 => {
  if (v < MOON_LEAVE) return earthMoon(v);
  return lerp3(earthMoon(v), herMoon(v), smooth(ramp(v, MOON_LEAVE, MOON_LEAVE + 1.5)));
};
const SUN2: V3 = [-10, 6, 8];

const MoonScene: React.FC<{v: number}> = ({v}) => {
  const k = smooth(ramp(v, MOON_LEAVE, MOON_LEAVE + 1.5));
  return (
    <>
      <color attach="background" args={['#02030a']} />
      <Stars />
      <ambientLight intensity={0.3} />
      <directionalLight position={SUN2} intensity={2.2} />
      <Planet r={5} sun={SUN2} st={{spin: 2.0 + v * 0.05}} />
      <DottedRing center={[0, 0, 0]} r={MOON_R} opacity={1 - 0.75 * k} />
      <DottedRing center={HER} r={HER_ORBIT} opacity={k} color="#ff9cc8" n={160} />
      <Moon position={moonPos(v)} r={2.2} sun={SUN2} crack={0} />
      <RobeBall position={HER} r={HER_R} rot={v * 0.03} />
    </>
  );
};

// ======================================================================= 7. the black hole photo -> donut

const DonutScene: React.FC<{v: number}> = ({v}) => {
  const fuzz = 1 - smooth(ramp(v, ZOOM[0] + 0.2, ZOOM[1]));
  const real = smooth(ramp(v, ZOOM[0] + 0.3, ZOOM[1] + 0.2));
  const tilt = 0.55 * smooth(ramp(v, ZOOM[0], REVEAL));
  const sleeve = smooth(ramp(v, REVEAL - 0.3, REVEAL + 0.6));
  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.5 * real} />
      <pointLight position={[1.5, 2.5, 4]} intensity={30 * real} distance={14} decay={2} color="#fff3e0" />
      <directionalLight position={[-3, 2, 4]} intensity={1.2 * real} />
      <group rotation={[tilt, 0, 0.15]}>
        <BlackHoleRing k={fuzz} />
        <Glow position={[0.35, -0.75, 0.2]} size={2.4} color="#ffcf70" k={fuzz} />
        <Glow position={[-0.6, 0.6, 0.2]} size={1.6} color="#ff8a30" k={0.5 * fuzz} />
        <Donut k={real} />
      </group>
      {sleeve > 0.001 ? <Sleeve k={sleeve} /> : null}
    </>
  );
};

const Sleeve: React.FC<{k: number}> = ({k}) => {
  const map = useRobe([3, 1]);
  return (
    <group position={[lerp(3.0, 1.75, k), lerp(-3.2, -2.05, k), 0.9]} rotation={[0, 0, 0.75]}>
      <mesh>
        <cylinderGeometry args={[0.9, 1.05, 4, 24]} />
        <meshStandardMaterial map={map} roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.02, 0]}>
        <cylinderGeometry args={[0.93, 0.93, 0.12, 24]} />
        <meshStandardMaterial color="#fff0f6" roughness={1} />
      </mesh>
    </group>
  );
};

// ======================================================================= 8. the expanding universe

const GALAXIES = Array.from({length: 18}).map((_, i) => ({
  p: [(rnd(i * 7 + 1) - 0.5) * 140, (rnd(i * 7 + 2) - 0.5) * 230, -70 - rnd(i * 7 + 3) * 90] as V3,
  size: 9 + rnd(i * 7 + 4) * 10,
  tilt: [0.6 + rnd(i * 7 + 5) * 1.2, rnd(i * 7 + 6) * 3, rnd(i * 7 + 7) - 0.5] as V3,
}));
const UNI_C: V3 = [0, 0, -110];
const herX = (v: number) => lerp(-460, 380, ramp(v, PASS[0] - 1.6, PASS[1] + 0.5));

const Universe: React.FC<{v: number}> = ({v}) => {
  const e = 1 + 0.09 * (v - S('universe'));
  const hx = herX(v);
  return (
    <>
      <color attach="background" args={['#020208']} />
      <Stars />
      {GALAXIES.map((g, i) => (
        <Galaxy key={i} position={[UNI_C[0] + (g.p[0] - UNI_C[0]) * e, UNI_C[1] + (g.p[1] - UNI_C[1]) * e, g.p[2]]} size={g.size} seed={i + 1} tilt={g.tilt} />
      ))}
      {/* her silhouette passing far behind the galaxies, no face: dark shape with a pink rim */}
      <group position={[hx, -60, -600]}>
        <Glow position={[0, 60, -80]} size={900} color="#ff5fa2" k={0.45} />
        {([[0, 0, 150], [0, 205, 62], [18, 268, 30]] as const).map(([x, y, r], i) => (
          <React.Fragment key={i}>
            <mesh position={[x, y, -8]} renderOrder={1}>
              <sphereGeometry args={[r * 1.035, 32, 24]} />
              <meshBasicMaterial color="#c2386f" depthWrite={false} />
            </mesh>
            <mesh position={[x, y, 0]} renderOrder={2}>
              <sphereGeometry args={[r, 32, 24]} />
              <meshBasicMaterial color="#07040a" />
            </mesh>
          </React.Fragment>
        ))}
      </group>
    </>
  );
};

// ======================================================================= 9. the servers

export const drawCalc = (g: CanvasRenderingContext2D, W: number, H: number, pct: number) => {
  g.fillStyle = '#0b1220';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#9fb8d8';
  g.textAlign = 'left';
  g.font = `500 ${Math.round(H * 0.09)}px ${COND}`;
  g.fillText('РАСЧЁТ ВЕСА: МАТЬ ГАБЕНА', W * 0.08, H * 0.25);
  roundRect(g, W * 0.08, H * 0.42, W * 0.84, H * 0.14, H * 0.03);
  g.fillStyle = '#1c2a40';
  g.fill();
  roundRect(g, W * 0.08, H * 0.42, W * 0.84 * pct, H * 0.14, H * 0.03);
  g.fillStyle = '#2fe07a';
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = `600 ${Math.round(H * 0.12)}px ${COND}`;
  g.fillText(`${(pct * 100).toFixed(1)}%`, W * 0.08, H * 0.75);
  g.fillStyle = '#9fb8d8';
  g.font = `500 ${Math.round(H * 0.07)}px ${COND}`;
  g.fillText('Осталось: ~20 лет', W * 0.08, H * 0.88);
};

const Servers: React.FC<{v: number}> = ({v}) => {
  const pct = lerp(0.991, 0.996, ramp(v, S('servers'), BAR[1]));
  return (
    <>
      <color attach="background" args={['#000']} />
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 2.5, -2]} color="#cfe0ff" intensity={6} distance={9} decay={2} />
      <pointLight position={[0, 2.5, -7]} color="#cfe0ff" intensity={6} distance={9} decay={2} />
      <ServerRoom v={v} red={0} offAt={() => 1e9} screenOn={0} />
      <CanvasPlane size={[1.6, 0.9]} res={[640, 360]} k={`c${pct.toFixed(4)}`} draw={(g, W, H) => drawCalc(g, W, H, pct)} position={[0, 1.7, -10.34]} />
    </>
  );
};

// ======================================================================= shots

type Scene = {view: (v: number) => View; render: (v: number) => React.ReactNode; shakes?: [number, number][]};

const SCENES: Record<Shot, Scene> = {
  scale: {
    view: (v) => mv(v, 0, E('scale'), [0.34, 0.2, 0.78], [0.2, 0.15, 0.56], [0, 0.13, 0], [0, 0.11, 0], [50, 48]),
    shakes: [[STEP, 0.3], [BURST, 1.0]],
    render: (v) => <Bathroom v={v} />,
  },
  pile: {
    view: (v) => mv(v, S('pile'), E('pile'), [0.9, 1.5, 4.0], [0.5, 1.35, 3.4], [0.2, 0.95, -0.6], [0.25, 0.85, -0.5], 50),
    shakes: [[PILE_DROP, 0.25]],
    render: (v) => <Storage v={v} />,
  },
  truck: {
    view: (v) => {
      if (v < SINK[0]) return mv(v, S('truck'), SINK[0], [30, 6, 30], [27, 5, 26], [0, 8, 0], [0, 4.5, 0], 52);
      return mv(v, SINK[0], E('truck'), [27, 5, 26], [24, 7.5, 23], [0, 4.5, 0], [0, 0, 0], 52);
    },
    shakes: [[TRUCK_STEP, 1.0], [SINK[0], 0.7], [SINK[0] + 0.6, 0.6]],
    render: (v) => <Weighbridge v={v} />,
  },
  heli: {
    view: (v) => {
      const x = heliX(v);
      const y = heliY(v);
      const k = smooth(ramp(v, S('heli'), S('heli') + 2));
      return {pos: [x - lerp(30, 16, k), y + lerp(14, 6, k), -50 + lerp(40, 30, k)], target: [x + 10, y + 3, -60], fov: 54, far: 3000};
    },
    shakes: [[STALL, 0.4], [LAND, 0.6]],
    render: (v) => <HeliRun v={v} />,
  },
  orbit: {
    view: (v) => mv(v, S('orbit'), E('orbit'), [3, 5, 66], [1.5, 4.5, 58], [0, 0, 0], [-0.8, 0.5, 0], 40),
    render: (v) => <Orbit v={v} />,
  },
  moon: {
    view: (v) => mv(v, S('moon'), E('moon'), [-14, 44, 70], [-6, 40, 64], [20, -9, -10], [26, -9, -14], 54),
    shakes: [[MOON_LEAVE, 0.3]],
    render: (v) => <MoonScene v={v} />,
  },
  donut: {
    view: (v) => {
      if (v < ZOOM[0]) return mv(v, S('donut'), ZOOM[0], [0, 0, 8.2], [0, 0, 7.4], [0, 0, 0], [0, 0, 0], 38);
      return mv(v, ZOOM[0], REVEAL + 0.4, [0, 0, 7.4], [0.4, -0.2, 4.2], [0, 0, 0], [0.3, -0.2, 0], [38, 44]);
    },
    shakes: [[REVEAL, 0.25]],
    render: (v) => <DonutScene v={v} />,
  },
  universe: {
    view: (v) => mv(v, S('universe'), E('universe'), [0, 0, 40], [0, 0, 20], [0, 0, -110], [0, -5, -110], 62),
    render: (v) => <Universe v={v} />,
  },
  servers: {
    view: (v) => mv(v, S('servers'), E('servers'), [0.25, 1.5, 1.4], [0.05, 1.65, -6.8], [-0.1, 1.5, -10.4], [0, 1.7, -10.4], [52, 46]),
    render: (v) => <Servers v={v} />,
  },
  screen: {
    view: () => ({pos: [0, 1.7, -8.4], target: [0, 1.7, -10.4], fov: 40, far: 3000}),
    render: (v) => <Servers v={v} />,
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

export {Slipper, Planet, Stars};
export const COVER_SUN = SUN1;
