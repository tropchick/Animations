import React from 'react';
import {Block, Box, Car, Cyl, DayLights, Ground, Ico, Pic, Sky, SunLight, Tree} from '../lastman/common';
import type {SkyCols} from '../lastman/common';
import {Drone} from '../lastman/people';
import {Hand} from '../lastman/people';
import {EV, P, PE, V3, clamp01, easeIn, hop, lerp, ramp, rnd, smooth} from './cues';
import {DIMA, Dima, Mug, Panda, Robot, RoboArm, Rocket, Smoke, Vacuum} from './props';
import {clockTex, fridgeTex, pandaSignTex, phoneTex, signTex, trayTex} from './tex';
import {Phone} from '../lastman/people';

// Dima's room. Local coords: floor at y = 0, back wall z = 0, front wall (window) z = 4.4..4.65, x -2.5..2.5.
// Worlds 1, 2 and 4: the room is on the 5th floor (FY = 12). World 3: on the ground, the front wall is glass (a zoo enclosure).
export const FY = 12;
export const flatY = (w: number) => (w === 3 ? 0 : FY);
export const WIN = {x0: -0.9, x1: 1.7, y0: 0.5, y1: 2.55, z: 4.4};
export const CLOCK: V3 = [-0.42, 0.62, 0.36];
export const BED = {x: -1.5, hipY: 0.66, hipZ: 1.45};
export const FRIDGE: V3 = [1.95, 0, 0.42];
export const DOOR: V3 = [2.5, 0, 2.6];
export const HATCH: V3 = [2.5, 0.95, 3.5];

const PALETTE: Record<number, {wall: string; floor: string; bed: string; blanket: string}> = {
  1: {wall: '#eef1f4', floor: '#d8dde2', bed: '#f4f6f8', blanket: '#7ac8e8'},
  2: {wall: '#e6d6bc', floor: '#a87a52', bed: '#8a5a3a', blanket: '#3a5a9a'},
  3: {wall: '#e6d6bc', floor: '#a87a52', bed: '#8a5a3a', blanket: '#3a5a9a'},
  4: {wall: '#8a6a66', floor: '#5a3e36', bed: '#5a3e36', blanket: '#4a3a5a'},
};

// sitting up in bed: sit 0 = lying on the back, 1 = sitting; legs stay flat under the blanket
export const BedDima: React.FC<{sit: number; look?: number; armR?: [number, number]; elbowR?: number; rightHand?: React.ReactNode}> = ({sit, look = 0, armR, elbowR, rightHand}) => (
  <group position={[BED.x, BED.hipY, BED.hipZ]} rotation={[lerp(-Math.PI / 2 + 0.08, -0.08, sit), 0, 0]}>
    <Dima position={[0, -0.9, 0]} pose={{legL: lerp(0, 1.5, sit), legR: lerp(0, 1.5, sit), head: [lerp(-0.25, 0.1, sit), look], armL: [0.3 * sit, 0.1], armR: armR ?? [0.3 * sit, -0.1], elbowR, eyes: 1}} rightHand={rightHand} />
  </group>
);

const Window: React.FC<{w: number}> = ({w}) => {
  const {x0, x1, y0, y1, z} = WIN;
  const fr = w === 1 ? '#ffffff' : w === 4 ? '#2a1a1a' : '#f2f2ee';
  const cx = (x0 + x1) / 2;
  return (
    <>
      <Box size={[x1 - x0 + 0.12, 0.08, 0.3]} position={[cx, y0 - 0.02, z + 0.12]} color={fr} />
      <Box size={[x1 - x0 + 0.12, 0.08, 0.3]} position={[cx, y1 + 0.02, z + 0.12]} color={fr} />
      <Box size={[0.08, y1 - y0 + 0.12, 0.3]} position={[x0 - 0.02, (y0 + y1) / 2, z + 0.12]} color={fr} />
      <Box size={[0.08, y1 - y0 + 0.12, 0.3]} position={[x1 + 0.02, (y0 + y1) / 2, z + 0.12]} color={fr} />
      <Box size={[x1 - x0 + 0.3, 0.04, 0.32]} position={[cx, y0 - 0.04, z - 0.12]} color={fr} />
      <mesh position={[cx, (y0 + y1) / 2, z + 0.22]}>
        <planeGeometry args={[x1 - x0, y1 - y0]} />
        <meshStandardMaterial color="#cfe6ff" transparent opacity={0.1} roughness={0.1} depthWrite={false} />
      </mesh>
    </>
  );
};

export const Room: React.FC<{w: number; v: number; alarm?: boolean; locked?: boolean; nosig?: boolean; hatch?: number; tray?: number}> = ({w, v, alarm = false, locked = false, hatch = 0, tray = 0}) => {
  const c = PALETTE[w];
  const ringing = alarm;
  const shake = ringing ? Math.sin(v * 70) * 0.06 : 0;
  const glassFront = w === 3;
  return (
    <group>
      {/* floor, ceiling, back and side walls */}
      <Box size={[5.2, 0.1, 4.8]} position={[0, -0.05, 2.3]} color={c.floor} />
      <Box size={[5.2, 0.1, 4.8]} position={[0, 2.75, 2.3]} color={w === 4 ? '#3a2a2a' : '#f6f6f2'} />
      <Box size={[5.2, 2.8, 0.2]} position={[0, 1.35, -0.1]} color={c.wall} />
      <Box size={[0.2, 2.8, 4.8]} position={[-2.6, 1.35, 2.3]} color={c.wall} />
      {/* right wall with the front door (and the hatch in world 3) */}
      <Box size={[0.2, 2.8, 1.9]} position={[2.6, 1.35, 0.95]} color={c.wall} />
      <Box size={[0.2, 0.7, 1.0]} position={[2.6, 2.4, 2.6]} color={c.wall} />
      {w === 3 ? (
        <>
          <Box size={[0.2, 2.8, 0.25]} position={[2.6, 1.35, 3.225]} color={c.wall} />
          <Box size={[0.2, 0.75, 0.5]} position={[2.6, 0.375, 3.6]} color={c.wall} />
          <Box size={[0.2, 1.45, 0.5]} position={[2.6, 2.025, 3.6]} color={c.wall} />
          <Box size={[0.2, 2.8, 0.85]} position={[2.6, 1.35, 4.275]} color={c.wall} />
          {/* the hatch: a steel shutter slides up, the tray slides in */}
          <Box size={[0.06, 0.55, 0.56]} position={[2.48, 0.98 + 0.5 * hatch, 3.6]} color="#8a8e96" />
          <group position={[lerp(2.9, 2.05, smooth(tray)), 0.78, 3.6]}>
            <Box size={[0.5, 0.03, 0.4]} color="#d8dce0" />
            <Cyl rTop={0.1} rBottom={0.08} height={0.04} segments={12} position={[-0.08, 0.035, 0]} color="#ffffff" />
            <Ico radius={0.05} position={[-0.08, 0.08, 0]} color="#f2c14e" />
            <Box size={[0.08, 0.1, 0.08]} position={[0.14, 0.07, 0.08]} color="#e85d5d" />
            <Pic size={[0.16, 0.08]} map={trayTex()} position={[0.12, 0.022, -0.1]} rotation={[-Math.PI / 2, 0, 0]} lit />
          </group>
        </>
      ) : (
        <Box size={[0.2, 2.8, 1.8]} position={[2.6, 1.35, 4.0]} color={c.wall} />
      )}
      {/* the door itself, with a lock that glows red in world 4 */}
      <Box size={[0.06, 2.05, 0.95]} position={[2.53, 1.025, 2.6]} color={w === 4 ? '#2a1a1a' : '#8a5a3a'} />
      <Box size={[0.04, 0.05, 0.14]} position={[2.48, 1.0, 2.25]} color="#c8c8c8" />
      <Box size={[0.03, 0.18, 0.09]} position={[2.485, 1.18, 2.25]} color={locked ? '#ff2a2a' : '#444'} emissive={locked ? '#ff2020' : '#000'} emissiveIntensity={locked ? 4 : 0} shadow={false} />
      {locked ? <pointLight position={[2.3, 1.2, 2.25]} intensity={3} distance={2} color="#ff3020" /> : null}
      {/* front wall: concrete with a window, or one big glass pane in the zoo */}
      {glassFront ? (
        <>
          <Box size={[5.2, 0.12, 0.2]} position={[0, 2.74, 4.5]} color="#9aa2ac" />
          <Box size={[5.2, 0.12, 0.2]} position={[0, 0.06, 4.5]} color="#9aa2ac" />
          {[-2.55, 2.55].map((x) => (
            <Box key={x} size={[0.1, 2.8, 0.2]} position={[x, 1.4, 4.5]} color="#9aa2ac" />
          ))}
          <mesh position={[0, 1.4, 4.5]}>
            <planeGeometry args={[5.1, 2.6]} />
            <meshStandardMaterial color="#d8ecff" transparent opacity={0.12} roughness={0.05} depthWrite={false} />
          </mesh>
        </>
      ) : (
        <>
          <Box size={[WIN.x0 + 2.7, 2.8, 0.25]} position={[(WIN.x0 - 2.7) / 2, 1.35, 4.525]} color={c.wall} />
          <Box size={[2.7 - WIN.x1, 2.8, 0.25]} position={[(WIN.x1 + 2.7) / 2, 1.35, 4.525]} color={c.wall} />
          <Box size={[WIN.x1 - WIN.x0, WIN.y0 + 0.05, 0.25]} position={[(WIN.x0 + WIN.x1) / 2, (WIN.y0 - 0.05) / 2, 4.525]} color={c.wall} />
          <Box size={[WIN.x1 - WIN.x0, 2.75 - WIN.y1, 0.25]} position={[(WIN.x0 + WIN.x1) / 2, (WIN.y1 + 2.75) / 2, 4.525]} color={c.wall} />
          <Window w={w} />
        </>
      )}
      {/* bed: head at the back wall */}
      <Box size={[1.4, 0.32, 2.2]} position={[BED.x, 0.18, 1.2]} color={c.bed} />
      <Box size={[1.36, 0.16, 2.16]} position={[BED.x, 0.42, 1.2]} color="#f0eee8" />
      <Box size={[0.62, 0.14, 0.38]} position={[BED.x, 0.57, 0.36]} color="#ffffff" />
      <Box size={[1.42, 0.9, 0.08]} position={[BED.x, 0.6, 0.06]} color={c.bed} />
      {/* blanket over the legs (legs stay flat: from the hips to the feet) */}
      <Box size={[1.42, 0.2, 1.05]} position={[BED.x, 0.6, 1.83]} color={c.blanket} />
      {/* nightstand + alarm clock (display faces the bed side, +z / -x) */}
      <Box size={[0.5, 0.52, 0.45]} position={[-0.42, 0.26, 0.32]} color={w === 1 ? '#e2e6ea' : w === 4 ? '#2a1c18' : '#9a6a42'} />
      <group position={CLOCK} rotation={[0, -0.5 + shake, 0]}>
        <Box size={[0.2, 0.1, 0.08]} color="#222428" />
        <Pic size={[0.17, 0.075]} map={clockTex(ringing && Math.sin(v * 12) > 0, w === 4)} position={[0, 0, 0.041]} />
      </group>
      {/* kitchen corner: fridge against the back wall, a counter */}
      <group position={FRIDGE}>
        <Box size={[0.75, 1.9, 0.66]} position={[0, 0.95, 0]} color={w === 1 ? '#f4f6f8' : w === 4 ? '#c8ccd4' : '#e8e8e4'} />
        <Box size={[0.73, 0.012, 0.012]} position={[0, 1.25, 0.335]} color="#9aa2ac" shadow={false} />
        <Box size={[0.04, 0.4, 0.05]} position={[-0.3, 1.5, 0.36]} color="#9aa2ac" />
        <Box size={[0.04, 0.3, 0.05]} position={[-0.3, 0.95, 0.36]} color="#9aa2ac" />
        <Pic size={[0.5, 0.25]} map={fridgeTex(locked)} position={[0.12, 1.52, 0.336]} />
      </group>
      <Box size={[1.0, 0.9, 0.6]} position={[1.0, 0.45, 0.32]} color={w === 1 ? '#ffffff' : w === 4 ? '#2a1c18' : '#c8a070'} />
      <Box size={[1.04, 0.04, 0.64]} position={[1.0, 0.92, 0.32]} color={w === 4 ? '#4a3a32' : '#e8e4dc'} />
      {/* rug + a plant */}
      <Box size={[1.8, 0.012, 1.3]} position={[0.3, 0.006, 2.6]} color={w === 4 ? '#3a1e22' : '#c85b6a'} shadow={false} />
      <Cyl rTop={0.16} rBottom={0.12} height={0.3} position={[-2.15, 0.15, 4.0]} color="#c87a4a" />
      <Ico radius={0.3} position={[-2.15, 0.6, 4.0]} color={w === 4 ? '#3a4a2a' : '#4f9a4a'} />
      {/* lights */}
      {w === 4 ? (
        <>
          <hemisphereLight color="#ffb0a0" groundColor="#401818" intensity={0.75} />
          <pointLight position={[0.5, 1.8, 5.2]} intensity={34} distance={11} color="#ff4a34" />
          <pointLight position={[-1.0, 2.3, 2.4]} intensity={3} distance={6} color="#8090ff" />
        </>
      ) : (
        <>
          <Box size={[0.4, 0.06, 0.4]} position={[0, 2.67, 2.3]} color="#fff8e8" emissive="#fff3d0" emissiveIntensity={1.2} shadow={false} />
          <pointLight position={[0, 2.4, 2.3]} intensity={6} distance={9} color="#fff1d6" />
          <pointLight position={[0.5, 1.8, 3.9]} intensity={8} distance={7} color="#e8f0ff" />
          <hemisphereLight color="#e8eeff" groundColor="#7a6a5a" intensity={0.55} />
        </>
      )}
    </group>
  );
};

// the hand that slaps the alarm (from the bed side)
export const SlapHand: React.FC<{v: number; slap: number; alarm: number}> = ({v, slap, alarm}) => {
  const k = smooth(ramp(v, alarm + 0.25, slap));
  const back = smooth(ramp(v, slap + 0.4, slap + 1.1));
  const from: V3 = [-1.0, 0.75, 0.75];
  const at: V3 = [CLOCK[0] - 0.02, CLOCK[1] + 0.14, CLOCK[2] + 0.02];
  const p: V3 = [lerp(lerp(from[0], at[0], k), from[0], back), lerp(lerp(from[1], at[1], k), from[1], back), lerp(lerp(from[2], at[2], k), from[2], back)];
  const press = hop(v, slap - 0.06, 0.2) * 0.03;
  if (back >= 1 || k <= 0) return null;
  return <Hand position={[p[0], p[1] - press, p[2]]} rotation={[Math.PI / 2, 0, Math.PI / 2 - 0.2]} shape={v < slap - 0.1 ? 'relaxed' : 'flat'} sleeve={DIMA.shirt} />;
};

// ---------------------------------------------------------------- what is outside the window

const SKY1: SkyCols = {top: '#3f86d6', mid: '#9cd0f2', low: '#f6efd8', sunDir: [0.4, 0.3, 1], sun: 0.7, sunCol: '#fff2c8'};
const SKY2: SkyCols = {top: '#4a8ad0', mid: '#a6c8e6', low: '#f0e6d0', sunDir: [0.5, 0.35, 1], sun: 0.6, sunCol: '#fff2c8'};
const SKY4: SkyCols = {top: '#1a0505', mid: '#5a1010', low: '#c0301a'};

// world 1: white towers with light stripes, a maglev line, a rocket far away
export const Future: React.FC<{v: number; y: number}> = ({v, y}) => {
  const trainX = -160 + (v - EV.train) * 90;
  const lift = easeIn(ramp(v, EV.rocket, EV.rocket + 7)) * 220;
  const fire = v >= EV.rocket - 0.3 ? 1 : 0;
  return (
    <group position={[0, -y, 0]}>
      <Sky c={SKY1} />
      <fog attach="fog" args={['#d6ecfa', 120, 900]} />
      <DayLights />
      <SunLight dir={[0.4, 0.8, 0.6]} target={[0, 0, 40]} size={60} />
      <Ground color="#8ab87a" />
      {/* park and lake below */}
      <Box size={[60, 0.1, 30]} position={[0, 0.05, 40]} color="#6aa860" />
      <Box size={[22, 0.12, 12]} position={[-6, 0.07, 46]} color="#5ab0e0" />
      {Array.from({length: 14}).map((_, i) => (
        <Tree key={i} position={[-25 + (i % 7) * 8, 0, 30 + Math.floor(i / 7) * 18]} s={1.1} seed={i} />
      ))}
      {/* towers */}
      {Array.from({length: 16}).map((_, i) => {
        const x = -110 + (i % 8) * 30 + rnd(i) * 8;
        const z = 80 + Math.floor(i / 8) * 55 + rnd(i, 2) * 10;
        // keep a clear corridor from the window to the rocket pad
        if (Math.abs(x + 0.078 * z) < 16) return null;
        const h = 40 + rnd(i, 3) * 70;
        const r = 5 + rnd(i, 4) * 4;
        return (
          <group key={i} position={[x, 0, z]}>
            <Cyl rTop={r * 0.75} rBottom={r} height={h} segments={8} position={[0, h / 2, 0]} color="#f4f6f8" />
            {[0.3, 0.55, 0.8].map((f) => (
              <Cyl key={f} rTop={r * (1 - 0.25 * f) + 0.15} rBottom={r * (1 - 0.25 * f) + 0.15} height={0.6} segments={8} position={[0, h * f, 0]} color="#5fe0ff" emissive="#5fe0ff" emissiveIntensity={0.6} shadow={false} />
            ))}
            <Ico radius={r * 0.6} position={[0, h + r * 0.2, 0]} color="#7ac8a0" />
          </group>
        );
      })}
      {/* the maglev line at 14 m and its train */}
      <Box size={[400, 0.8, 2]} position={[0, 14, 62]} color="#e8ecf0" />
      {[-120, -80, -40, 0, 40, 80, 120].map((x) => (
        <Box key={x} size={[1.2, 14, 1.2]} position={[x, 7, 62]} color="#d8dce0" />
      ))}
      <group position={[trainX, 15.6, 62]}>
        <Box size={[40, 2.2, 2.4]} color="#ffffff" />
        <Box size={[38, 0.7, 2.44]} position={[0, 0.3, 0]} color="#1a3a5a" shadow={false} />
        <Cyl rTop={1.1} rBottom={1.1} height={2.4} segments={10} position={[20, 0, 0]} rotation={[Math.PI / 2, 0, 0]} color="#ffffff" />
      </group>
      {/* the rocket pad far away on the left */}
      <Rocket position={[-40, 0, 520]} lift={lift} t={v} fire={fire} />
      <Smoke base={[-40, 0, 520]} lift={lift} t={Math.max(0, v - EV.rocket)} />
      {/* flying cars */}
      {[0, 1, 2].map((i) => (
        <group key={i} position={[-80 + ((v * (12 + i * 5) + i * 60) % 180), 30 + i * 9, 70 + i * 25]}>
          <Box size={[3, 0.9, 1.5]} color={['#e85d5d', '#f2c14e', '#4a7fd0'][i]} />
          <Box size={[1.4, 0.6, 1.3]} position={[0, 0.6, 0]} color="#2a3a4a" />
        </group>
      ))}
    </group>
  );
};

// world 2: an ordinary sunny city, morning
export const Ordinary: React.FC<{y: number}> = ({y}) => (
  <group position={[0, -y, 0]}>
    <Sky c={SKY2} />
    <fog attach="fog" args={['#d8e4ee', 80, 500]} />
    <DayLights />
    <SunLight dir={[0.5, 0.8, 0.5]} target={[0, 0, 30]} size={60} />
    <Ground color="#7a8a6a" />
    <Box size={[200, 0.08, 10]} position={[0, 0.04, 24]} color="#5d5f66" />
    {Array.from({length: 7}).map((_, i) => (
      <Block key={i} position={[-60 + i * 20, 0, 50 + (i % 2) * 12]} size={[16, 18 + (i % 3) * 8, 10]} rotation={Math.PI} color={['#d8cdb8', '#c8b8a8', '#e2d8c8'][i % 3]} seed={i + 3} />
    ))}
    {Array.from({length: 6}).map((_, i) => (
      <Tree key={i} position={[-25 + i * 10, 0, 18]} s={1} seed={i} birch={i % 2 === 0} />
    ))}
    <Car position={[-12, 0, 23]} rotation={Math.PI / 2} color="#e85d5d" />
    <Car position={[8, 0, 25.5]} rotation={-Math.PI / 2} color="#4a7fd0" />
  </group>
);

// world 4: red sky, a dark city with no lights, swarms of drones
export const Dark: React.FC<{v: number; y: number}> = ({v, y}) => (
  <group position={[0, -y, 0]}>
    <Sky c={SKY4} />
    <fog attach="fog" args={['#3a0a08', 40, 300]} />
    <hemisphereLight color="#ff6040" groundColor="#200808" intensity={0.5} />
    <directionalLight position={[0, 20, 60]} intensity={0.8} color="#ff5030" />
    <Ground color="#1e1414" />
    {Array.from({length: 9}).map((_, i) => (
      <Block key={i} position={[-70 + i * 18, 0, 45 + (i % 3) * 14]} size={[14, 20 + (i % 4) * 9, 10]} rotation={Math.PI} night lit={0} seed={i + 30} />
    ))}
    {Array.from({length: 26}).map((_, i) => {
      const a = v * (0.35 + 0.1 * rnd(i)) + i * 1.3;
      const r = 8 + 10 * rnd(i, 2);
      const cx = (i % 2 ? 14 : -10) + Math.cos(a) * r;
      const cz = 32 + (i % 3) * 8 + Math.sin(a) * r * 0.5;
      return (
        <group key={i} position={[cx * 0.8, 11 + 7 * rnd(i, 3) + Math.sin(v * 2 + i) * 0.5, cz * 0.6]} scale={3}>
          <Drone position={[0, 0, 0]} rotation={[0.1, a, 0]} t={v + i} light />
          <Ico radius={0.06} position={[0, -0.02, 0.15]} color="#ff2a2a" emissive="#ff2020" emissiveIntensity={4} shadow={false} />
        </group>
      );
    })}
  </group>
);

// world 3: the zoo path in front of the glass, robots visiting, the panda next door
export const Zoo: React.FC<{v: number; kidWave?: number; tap?: number}> = ({v, kidWave = 0, tap = 0}) => (
  <group>
    <Sky c={SKY2} />
    <fog attach="fog" args={['#d8e4ee', 60, 400]} />
    <DayLights />
    <SunLight dir={[0.4, 0.8, 0.6]} target={[0, 0, 6]} size={20} />
    <Ground color="#7aa860" />
    {/* the path */}
    <Box size={[60, 0.06, 5]} position={[0, 0.03, 8.0]} color="#d8c8a8" />
    {/* the enclosure building around the room */}
    <Box size={[5.8, 0.4, 5.4]} position={[0, 3.0, 2.3]} color="#c8b89a" />
    <Box size={[0.3, 3.2, 5.4]} position={[-2.85, 1.6, 2.3]} color="#c8b89a" />
    {/* the sign: hangs on the glass, top left, like at any zoo */}
    <group position={[-1.2, 2.2, 4.66]}>
      <Box size={[0.02, 0.36, 0.02]} position={[-0.45, 0.55, -0.06]} color="#5a4a3a" />
      <Box size={[0.02, 0.36, 0.02]} position={[0.45, 0.55, -0.06]} color="#5a4a3a" />
      <Box size={[1.2, 0.8, 0.04]} color="#5a4a3a" />
      <Pic size={[1.12, 0.75]} map={signTex()} position={[0, 0, 0.022]} lit />
    </group>
    {/* the panda enclosure to the right, behind a low fence */}
    <group position={[8.5, 0, 2.5]}>
      <Box size={[6, 0.08, 5]} position={[0, 0.04, 0]} color="#6a9a50" />
      {Array.from({length: 7}).map((_, i) => (
        <Box key={i} size={[0.08, 1.0, 0.08]} position={[-3 + i, 0.5, 2.5]} color="#5a4a3a" />
      ))}
      <Box size={[6, 0.08, 0.06]} position={[0, 0.9, 2.5]} color="#5a4a3a" />
      <Panda position={[0.4, 0, 0]} rotation={-0.5} t={v} />
      <group position={[-2.2, 0, 2.7]}>
        <Box size={[0.06, 0.9, 0.06]} position={[0, 0.45, 0]} color="#5a4a3a" />
        <Pic size={[0.8, 0.4]} map={pandaSignTex()} position={[0, 1.05, 0.04]} lit />
      </group>
    </group>
    {/* trees around */}
    {[-9, -6, 14, 17].map((x, i) => (
      <Tree key={x} position={[x, 0, 12 + (i % 2) * 3]} s={1.1} seed={i + 4} />
    ))}
    {/* robots: a parent and two kids at the glass, more passing by */}
    <Robot position={[-1.7, 0, 6.4]} rotation={Math.PI + 0.25} t={v} head={0.1 * Math.sin(v)} armR={0.3} />
    <Robot position={[-0.5, 0, 5.2]} rotation={Math.PI} scale={0.6} t={v + 1} armR={kidWave > 0 ? 2.6 + 0.35 * Math.sin(v * 9) * kidWave : 0.4 + 1.1 * tap} />
    <Robot position={[2.6, 0, 5.5]} rotation={Math.PI + 0.3} scale={0.55} t={v + 2} head={-0.3} />
    {[0, 1].map((i) => (
      <Robot key={i} position={[-14 + ((v * 1.1 + i * 9) % 30), 0, 9 + i * 1.6]} rotation={Math.PI / 2} scale={i ? 0.6 : 1} t={v + i * 3} />
    ))}
  </group>
);

// world 3: the enclosure's yard with a tall fence (left of the room), for the escape attempt
export const YARD: V3 = [-9, 0, 4];
export const Yard: React.FC<{v: number}> = ({v}) => (
  <group position={YARD}>
    <Box size={[6, 0.06, 6]} position={[0, 0.03, 0]} color="#6a9a50" />
    {Array.from({length: 13}).map((_, i) => (
      <Box key={i} size={[0.07, 3.0, 0.07]} position={[-3 + i * 0.5, 1.5, 3]} color="#6a6e76" />
    ))}
    <Box size={[6.1, 0.08, 0.08]} position={[0, 2.95, 3]} color="#6a6e76" />
    <Box size={[6.1, 0.06, 0.06]} position={[0, 1.2, 3]} color="#6a6e76" />
    <Box size={[6.1, 0.06, 0.06]} position={[0, 0.3, 3]} color="#6a6e76" />
    {/* toys: a ball and a hammock */}
    <Ico radius={0.25} detail={1} position={[1.6, 0.25, -1]} color="#e85d5d" />
    <Box size={[0.08, 1.6, 0.08]} position={[-2.5, 0.8, -2]} color="#8a6a4a" />
    <Box size={[0.08, 1.6, 0.08]} position={[-0.5, 0.8, -2]} color="#8a6a4a" />
    <Box size={[1.9, 0.04, 0.6]} position={[-1.5, 1.0 + 0.03 * Math.sin(v * 2), -2]} color="#e8c060" />
  </group>
);

// world 4: the phone in the hand
export const NoSignalPhone: React.FC<{position: V3; rotation?: V3; nosig: boolean}> = ({position, rotation, nosig}) => <Phone position={position} rotation={rotation} screen={phoneTex(nosig)} />;

export {Mug, Vacuum, RoboArm, Robot, clamp01, P, PE};
