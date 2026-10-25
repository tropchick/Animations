import React from 'react';
import {random} from 'remotion';
import {Box, Cyl} from '../scene/parts';
import {PersonPose} from '../scene/Characters';
import {Cup, Editor, Hero} from './cast';
import {HeroArm, MoneyStack} from './props';
import {canvasTexture} from './tex';
import {CUP_FALL, MONEY_SLAP, ShotState, V3, hop, lerp3, ramp, smooth} from './cues';

// The edit room at night: three monitors with a timeline of hundreds of clips, a mountain of coffee cups.
export const EDITOR_POS: V3 = [0, 0, 0.25];
export const STACK_ON_DESK: V3 = [0.5, 0.78, -0.42];
export const CLOCK_WALL: V3 = [-1.55, 2.25, -1.64];
export const HERO_EDIT: V3 = [0.72, 0, 0.72];

const timelineTexture = (k: number) =>
  canvasTexture(`timeline-${k}`, 1024, 600, (c) => {
    c.fillStyle = '#16181f';
    c.fillRect(0, 0, 1024, 600);
    // preview window
    c.fillStyle = '#0c0d11';
    c.fillRect(300, 24, 424, 238);
    const g = c.createLinearGradient(300, 24, 724, 262);
    g.addColorStop(0, ['#3d7bd9', '#6fae4f', '#e3c47c'][k]);
    g.addColorStop(1, ['#f2c84b', '#2f6fd6', '#2bb3c0'][k]);
    c.fillStyle = g;
    c.fillRect(312, 34, 400, 218);
    // tracks full of clips
    const colors = ['#5b8bd9', '#e88d3a', '#7c5cc4', '#4f9a52', '#e9563c', '#3fa6b4', '#f2c84b'];
    for (let row = 0; row < 9; row++) {
      let x = 10;
      while (x < 1014) {
        const w = 8 + random(`clip-${k}-${row}-${x}`) * 40;
        c.fillStyle = colors[Math.floor(random(`clipc-${k}-${row}-${x}`) * colors.length)];
        c.fillRect(x, 290 + row * 32, w - 2, 26);
        x += w;
      }
    }
    c.fillStyle = '#ff3b30';
    c.fillRect(520, 280, 3, 310);
  });

const Monitor: React.FC<{position: V3; yaw: number; k: number}> = ({position, yaw, k}) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <Box size={[0.78, 0.47, 0.04]} color="#0e0f12" />
    <mesh position={[0, 0, 0.0215]}>
      <planeGeometry args={[0.74, 0.43]} />
      <meshBasicMaterial map={timelineTexture(k)} toneMapped={false} />
    </mesh>
    <Box size={[0.05, 0.3, 0.05]} position={[0, -0.36, -0.04]} color="#2a2c31" />
    <Box size={[0.25, 0.02, 0.18]} position={[0, -0.5, -0.04]} color="#2a2c31" />
  </group>
);

// cups stacked into pyramids: [x, z, layers]
const PILES: [number, number, number][] = [
  [-1.0, 0.75, 5],
  [-1.85, -0.35, 3],
];
const cupsOf = (x0: number, z0: number, layers: number) => {
  const out: V3[] = [];
  for (let l = 0; l < layers; l++) {
    const n = layers - l;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out.push([x0 + (i - (n - 1) / 2) * 0.1, 0.72 + l * 0.15, z0 + (j - (n - 1) / 2) * 0.1]);
  }
  return out;
};

const Chair: React.FC = () => (
  <group>
    <Box size={[0.52, 0.08, 0.5]} position={[0, 0.42, 0]} color="#22242b" />
    <Box size={[0.5, 0.62, 0.07]} position={[0, 0.8, -0.27]} color="#22242b" />
    <Cyl rTop={0.035} rBottom={0.035} height={0.36} segments={6} position={[0, 0.2, 0]} color="#5a5d66" />
    {[0, 1, 2, 3, 4].map((k) => (
      <Box key={k} size={[0.05, 0.04, 0.32]} position={[Math.sin((k / 5) * 6.28) * 0.15, 0.04, Math.cos((k / 5) * 6.28) * 0.15]} rotation={[0, (k / 5) * 6.28, 0]} color="#5a5d66" />
    ))}
  </group>
);

export const EditRoom: React.FC<{v: number; s: ShotState}> = ({v, s}) => {
  const t = s.t;
  // editor's chair: facing the monitors, turns to the camera in "editorface", back to the desk when he hugs the money
  const turn = s.name === 'editorface' ? smooth(ramp(t, 0.25, 1.05)) : s.name === 'money' || s.name === 'editorcry' ? 1 : 0;
  const yaw = Math.PI + Math.PI * turn;
  const crying = s.name === 'editorcry';
  const sob = Math.sin(v * 9);
  const lean = crying ? 0.22 + 0.03 * sob : 0;
  const pose: PersonPose = crying
    ? {legL: Math.PI / 2, legR: Math.PI / 2, armL: [0.85 + 0.05 * sob, 0.45], armR: [0.85 + 0.05 * sob, -0.45], elbowL: 1.25, elbowR: 1.25, head: [-0.12, 0.25], eyes: 0.3, mouth: 0.55 + 0.2 * sob}
    : s.name === 'editroom'
      ? {legL: Math.PI / 2, legR: Math.PI / 2, armR: [1.15, -0.1], elbowR: 0.45, armL: [1.1, 0.1], elbowL: 0.5, head: [0.05, 0.12 * Math.sin(t * 0.7)], eyes: 0.8}
      : {legL: Math.PI / 2, legR: Math.PI / 2, armL: [0.25, 0.08], armR: [0.25, -0.08], elbowL: 0.5, elbowR: 0.5, head: [0.08, 0], eyes: 0.7, mouth: 0};
  const cups = PILES.flatMap(([x, z, l]) => cupsOf(x, z, l));
  const topCup = cups.length - 1 - cupsOf(PILES[1][0], PILES[1][1], PILES[1][2]).length;
  // the top cup of the big pile falls while the editor stares
  const fall = s.name === 'editorface' ? ramp(v, CUP_FALL, CUP_FALL + 0.55) : s.name === 'money' || crying ? 1 : 0;
  const fallen: V3 = [-1.25, 0.05, 1.35];
  // the hand puts a stack of money on the desk
  const slap = s.name === 'money' ? smooth(ramp(v, MONEY_SLAP - 0.55, MONEY_SLAP)) : 1;
  const away = s.name === 'money' ? smooth(ramp(v, MONEY_SLAP + 0.6, MONEY_SLAP + 1.1)) : 1;
  const stackPos = lerp3([0.62, 1.35, -0.1], STACK_ON_DESK, slap);
  stackPos[1] += 0.015 * hop(v, MONEY_SLAP, 0.15);
  const showStack = s.name === 'money' ? v > MONEY_SLAP - 0.6 : crying;
  const hand = lerp3([stackPos[0], stackPos[1] + 0.34, stackPos[2]], [1.0, 1.6, 0.6], away);
  return (
    <group>
      <color attach="background" args={['#0b0c10']} />
      <hemisphereLight color="#5b6a9a" groundColor="#1a1b22" intensity={0.85} />
      <ambientLight intensity={0.06} />
      <pointLight position={[0, 1.25, -0.35]} intensity={3.4} distance={5} decay={1.3} color="#9fc0ff" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.002} />
      <pointLight position={[1.2, 2.4, 1.4]} intensity={0.9} distance={6} decay={1.5} color="#ffb070" />
      {/* room */}
      <Box size={[6, 0.1, 6]} position={[0, -0.05, 0.5]} color="#2a2d36" />
      <Box size={[6, 3, 0.1]} position={[0, 1.5, -1.75]} color="#33374a" />
      <Box size={[0.1, 3, 6]} position={[-3, 1.5, 0.5]} color="#2f3344" />
      <Box size={[0.1, 3, 6]} position={[3, 1.5, 0.5]} color="#2f3344" />
      {[-2.2, -1.6, 1.6, 2.2].map((x) => (
        <Box key={x} size={[0.4, 0.4, 0.04]} position={[x, 1.5 + (x > 0 ? 0.3 : 0), -1.68]} color="#3a3e52" />
      ))}
      {/* desk */}
      <Box size={[2.4, 0.06, 0.8]} position={[0, 0.75, -0.6]} color="#1c1d22" />
      {[-1.15, 1.15].map((x) => (
        <Box key={x} size={[0.05, 0.72, 0.7]} position={[x, 0.36, -0.6]} color="#1c1d22" />
      ))}
      <Monitor position={[-0.8, 1.27, -0.75]} yaw={0.42} k={0} />
      <Monitor position={[0, 1.27, -0.88]} yaw={0} k={1} />
      <Monitor position={[0.8, 1.27, -0.75]} yaw={-0.42} k={2} />
      <Box size={[0.5, 0.025, 0.16]} position={[-0.1, 0.792, -0.32]} color="#2c2e35" />
      <Box size={[0.07, 0.03, 0.11]} position={[0.3, 0.795, -0.3]} color="#2c2e35" />
      {/* side tables with the cups */}
      {PILES.map(([x, z]) => (
        <Box key={x} size={[0.62, 0.72, 0.62]} position={[x, 0.36, z]} color="#24262d" />
      ))}
      {cups.map((p, i) =>
        i === topCup && fall > 0 ? (
          <Cup key={i} position={lerp3(p, fallen, fall * fall)} rotation={[0, 0, -Math.PI / 2 * Math.min(1, fall * 1.4)]} />
        ) : (
          <Cup key={i} position={p} />
        ),
      )}
      {/* wall clock, 23:55 */}
      <group position={CLOCK_WALL}>
        <Cyl rTop={0.26} rBottom={0.26} height={0.05} segments={24} rotation={[Math.PI / 2, 0, 0]} color="#f4f1ea" />
        <Cyl rTop={0.28} rBottom={0.28} height={0.04} segments={24} position={[0, 0, -0.012]} rotation={[Math.PI / 2, 0, 0]} color="#1b1c20" />
        {Array.from({length: 12}).map((_, k) => (
          <Box key={k} size={[0.015, 0.04, 0.01]} position={[Math.sin((k / 12) * 6.28) * 0.21, Math.cos((k / 12) * 6.28) * 0.21, 0.03]} rotation={[0, 0, -(k / 12) * 6.28]} color="#1b1c20" shadow={false} />
        ))}
        {/* hour hand just before 12, minute hand on 11 */}
        <group rotation={[0, 0, -((23 + 55 / 60) / 12) * Math.PI * 2]}>
          <Box size={[0.025, 0.13, 0.01]} position={[0, 0.06, 0.035]} color="#1b1c20" shadow={false} />
        </group>
        <group rotation={[0, 0, -(55 / 60) * Math.PI * 2]}>
          <Box size={[0.016, 0.19, 0.01]} position={[0, 0.09, 0.045]} color="#1b1c20" shadow={false} />
        </group>
        <group rotation={[0, 0, -((v * 6) % 60) / 60 * Math.PI * 2]}>
          <Box size={[0.006, 0.2, 0.006]} position={[0, 0.08, 0.052]} color="#e9563c" shadow={false} />
        </group>
      </group>
      {/* editor in his chair */}
      <group position={EDITOR_POS} rotation={[0, yaw, 0]}>
        <Chair />
        <group position={[0, 0.57, 0]} rotation={[lean, 0, 0]}>
          <Editor position={[0, -0.9, 0]} pose={pose} t={v} tears={crying ? 1 : 0} />
        </group>
      </group>
      {showStack && !crying ? (
        <group position={stackPos}>
          <MoneyStack />
        </group>
      ) : null}
      {crying ? (
        // the editor hugs the stack against his chest
        <group position={[EDITOR_POS[0], 0.95, EDITOR_POS[2] + 0.33]} rotation={[-0.25, 0, 0]}>
          <MoneyStack rows={5} />
        </group>
      ) : null}
      {s.name === 'money' && away < 1 ? (
        <HeroArm from={[1.2, 1.7, 0.9]} to={hand}>
          <Box size={[0.11, 0.06, 0.12]} position={[0, 0.03, 0]} color="#efd2b3" />
        </HeroArm>
      ) : null}
      {crying ? (
        <Hero
          position={HERO_EDIT}
          rotation={-2.09}
          pose={{armR: [1.05 + 0.12 * Math.abs(Math.sin(v * 6)), 0.1], elbowR: 0.25, armL: [0.05, 0.06], head: [0.3, 0], eyes: 0.9}}
        />
      ) : null}
    </group>
  );
};

