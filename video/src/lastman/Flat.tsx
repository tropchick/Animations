import React from 'react';
import {Box, Cyl, Pic} from './common';
import {C, V3, hop, lerp, lerp3, ramp, smooth} from './cues';
import {Hand, Hero} from './people';
import {drawClock, drawIntercom, drawRadio, tex} from './tex';

// The flat on the 5th floor. The bedroom's window looks out onto the yard (Yard.tsx), front wall at z = 6.
export const FY = 12.0;
export const WIN = {x0: -0.1, x1: 1.3, y0: FY + 0.85, y1: FY + 2.35, z: 6.0};
export const CLOCK: V3 = [-0.5, FY + 0.6, 2.22];
export const RADIO: V3 = [-0.27, FY + 0.65, 2.02];
export const SHIRT_START: V3 = [0.95, FY + 1.05, 6.75];
export const SHIRT_LAND: V3 = [1.5, 0.15, 16.0];

const WALL = '#cfd8c4';
const FRAME = '#f2f2ee';

const Window: React.FC<{open: number}> = ({open}) => {
  const {x0, x1, y0, y1, z} = WIN;
  const w = x1 - x0;
  const h = y1 - y0;
  const cx = (x0 + x1) / 2;
  const half = w / 2;
  return (
    <>
      {/* frame, 4 cm proud of the wall on the inside */}
      <Box size={[w + 0.12, 0.08, 0.3]} position={[cx, y0 - 0.02, z + 0.1]} color={FRAME} />
      <Box size={[w + 0.12, 0.08, 0.3]} position={[cx, y1 + 0.02, z + 0.1]} color={FRAME} />
      <Box size={[0.08, h + 0.12, 0.3]} position={[x0 - 0.02, (y0 + y1) / 2, z + 0.1]} color={FRAME} />
      <Box size={[0.08, h + 0.12, 0.3]} position={[x1 + 0.02, (y0 + y1) / 2, z + 0.1]} color={FRAME} />
      {/* window sill inside */}
      <Box size={[w + 0.3, 0.04, 0.3]} position={[cx, y0 - 0.04, z - 0.12]} color="#f6f6f2" />
      {/* left sash fixed */}
      <group position={[x0, y0, z + 0.12]}>
        <Box size={[half, 0.05, 0.05]} position={[half / 2, 0.025, 0]} color={FRAME} />
        <Box size={[half, 0.05, 0.05]} position={[half / 2, h - 0.025, 0]} color={FRAME} />
        <Box size={[0.05, h, 0.05]} position={[half - 0.025, h / 2, 0]} color={FRAME} />
        <mesh position={[half / 2, h / 2, 0]}>
          <planeGeometry args={[half - 0.05, h - 0.1]} />
          <meshStandardMaterial color="#cfe6ff" transparent opacity={0.12} roughness={0.1} depthWrite={false} />
        </mesh>
      </group>
      {/* right sash swings into the room around the right edge */}
      <group position={[x1, y0, z + 0.06]} rotation={[0, -open * 1.6, 0]}>
        <group position={[-half / 2, 0, 0]}>
          <Box size={[half, 0.05, 0.05]} position={[0, 0.025, 0]} color={FRAME} />
          <Box size={[half, 0.05, 0.05]} position={[0, h - 0.025, 0]} color={FRAME} />
          <Box size={[0.05, h, 0.05]} position={[-half / 2 + 0.025, h / 2, 0]} color={FRAME} />
          <Box size={[0.05, h, 0.05]} position={[half / 2 - 0.025, h / 2, 0]} color={FRAME} />
          <mesh position={[0, h / 2, 0]}>
            <planeGeometry args={[half - 0.1, h - 0.1]} />
            <meshStandardMaterial color="#cfe6ff" transparent opacity={0.12} roughness={0.1} depthWrite={false} />
          </mesh>
        </group>
      </group>
    </>
  );
};

const Curtain: React.FC<{x: number; sway: number}> = ({x, sway}) => (
  <group position={[x, FY + 2.55, 5.78]} rotation={[sway, 0, 0]}>
    {[0, 1, 2, 3].map((k) => (
      <Box key={k} size={[0.16, 1.85, 0.06]} position={[(k - 1.5) * 0.15, -0.93, k % 2 ? 0.04 : 0]} color={k % 2 ? '#e8d9b8' : '#dccaa4'} />
    ))}
  </group>
);

export const Bedroom: React.FC<{v: number; shot: string}> = ({v, shot}) => {
  const ringing = v < C.slap;
  const shake = ringing ? Math.sin(v * 70) * 0.06 : 0;
  const radioOn = v >= C.radioOn;
  const pulse = radioOn && v < C.radio + 7.6 ? 1 + 0.06 * Math.abs(Math.sin(v * 21)) : 1;
  const open = shot === 'shirt' || shot === 'throw' ? 1 : shot === 'window' ? smooth(ramp(v, 21.7, 22.4)) : 0;
  const clockTex = tex('clock', 256, 96, drawClock);
  const radioTex = tex(`radio-${radioOn}`, 512, 96, drawRadio(radioOn));
  return (
    <group>
      {/* floor, ceiling, walls */}
      <Box size={[4.8, 0.1, 4.4]} position={[0, FY - 0.05, 3.9]} color="#a87a52" />
      <Box size={[2.2, 0.012, 1.6]} position={[-0.2, FY + 0.006, 4.4]} color="#6a3a4a" shadow={false} />
      <Box size={[4.8, 0.1, 4.4]} position={[0, FY + 2.75, 3.9]} color="#f4f2ec" />
      <Box size={[4.8, 2.7, 0.2]} position={[0, FY + 1.35, 1.6]} color={WALL} />
      <Box size={[0.2, 2.7, 4.4]} position={[-2.5, FY + 1.35, 3.9]} color={WALL} />
      <Box size={[0.2, 2.7, 4.4]} position={[2.5, FY + 1.35, 3.9]} color={WALL} />
      {/* front wall with the window hole */}
      <Box size={[WIN.x0 + 2.6, 2.7, 0.25]} position={[(WIN.x0 - 2.6) / 2, FY + 1.35, 6.125]} color={WALL} />
      <Box size={[2.6 - WIN.x1, 2.7, 0.25]} position={[(WIN.x1 + 2.6) / 2, FY + 1.35, 6.125]} color={WALL} />
      <Box size={[WIN.x1 - WIN.x0, WIN.y0 - FY, 0.25]} position={[(WIN.x0 + WIN.x1) / 2, (FY + WIN.y0) / 2, 6.125]} color={WALL} />
      <Box size={[WIN.x1 - WIN.x0, FY + 2.7 - WIN.y1, 0.25]} position={[(WIN.x0 + WIN.x1) / 2, (WIN.y1 + FY + 2.7) / 2, 6.125]} color={WALL} />
      <Window open={open} />
      <Curtain x={WIN.x0 - 0.35} sway={0.02 * Math.sin(v * 1.3)} />
      <Curtain x={WIN.x1 + 0.35} sway={0.02 * Math.sin(v * 1.1 + 1)} />
      {/* radiator under the window */}
      <Box size={[1.0, 0.5, 0.1]} position={[0.6, FY + 0.45, 5.88]} color="#e8e8e2" />
      {/* bed: head at the back wall */}
      <Box size={[1.4, 0.35, 2.1]} position={[-1.4, FY + 0.2, 2.75]} color="#8a5a3a" />
      <Box size={[1.36, 0.18, 2.06]} position={[-1.4, FY + 0.46, 2.75]} color="#f0eee8" />
      <Box size={[1.4, 0.12, 1.3]} position={[-1.4, FY + 0.6, 3.15]} color="#3a5a9a" />
      <Box size={[0.62, 0.14, 0.38]} position={[-1.4, FY + 0.62, 1.95]} color="#ffffff" />
      <Box size={[1.4, 0.9, 0.08]} position={[-1.4, FY + 0.65, 1.74]} color="#7a4a2a" />
      {/* nightstand with the alarm clock and the radio */}
      <Box size={[0.5, 0.55, 0.45]} position={[-0.38, FY + 0.275, 2.1]} color="#9a6a42" />
      <group position={CLOCK} rotation={[0, shake, 0]}>
        <Box size={[0.08, 0.1, 0.18]} color="#222428" />
        <Pic size={[0.16, 0.07]} map={clockTex} position={[-0.041, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
        <Box size={[0.03, 0.03, 0.05]} position={[0, 0.065, -0.05]} color="#c8c8c8" />
        <Box size={[0.03, 0.03, 0.05]} position={[0, 0.065, 0.05]} color="#c8c8c8" />
      </group>
      <group position={RADIO}>
        <Box size={[0.14, 0.2, 0.34]} color="#b8bcc4" />
        <Pic size={[0.3, 0.05]} map={radioTex} position={[-0.071, 0.06, 0]} rotation={[0, -Math.PI / 2, 0]} />
        <Cyl rTop={0.06 * pulse} rBottom={0.06 * pulse} height={0.012} segments={16} position={[-0.074, -0.03, -0.08]} rotation={[0, 0, Math.PI / 2]} color="#2a2c30" />
        <Cyl rTop={0.06 * pulse} rBottom={0.06 * pulse} height={0.012} segments={16} position={[-0.074, -0.03, 0.08]} rotation={[0, 0, Math.PI / 2]} color="#2a2c30" />
        <Box size={[0.02, 0.02, 0.3]} position={[0.0, 0.11, 0]} color="#8a8e96" />
        <Cyl rTop={0.005} rBottom={0.005} height={0.5} position={[0.02, 0.33, 0.12]} rotation={[0.2, 0, 0]} color="#c8c8c8" />
      </group>
      {/* wardrobe and a poster */}
      <Box size={[0.6, 2.2, 1.6]} position={[2.08, FY + 1.1, 2.8]} color="#b98a5a" />
      <Box size={[0.012, 2.1, 0.012]} position={[1.775, FY + 1.1, 2.8]} color="#6a4a2a" shadow={false} />
      <Box size={[0.9, 1.2, 0.02]} position={[0.9, FY + 1.6, 1.71]} color="#2a4a7a" />
      <Box size={[0.7, 0.3, 0.012]} position={[0.9, FY + 1.85, 1.725]} color="#f2c14e" shadow={false} />
      {/* lights: a ceiling lamp and daylight through the window */}
      <Box size={[0.4, 0.06, 0.4]} position={[0, FY + 2.67, 3.9]} color="#fff8e8" emissive="#fff3d0" emissiveIntensity={1.2} shadow={false} />
      <pointLight position={[0, FY + 2.4, 3.9]} intensity={6} distance={9} color="#fff1d6" />
      <pointLight position={[0.6, FY + 1.8, 5.3]} intensity={8} distance={7} color="#e8f0ff" />
      <hemisphereLight color="#e8eeff" groundColor="#7a6a5a" intensity={0.55} />
    </group>
  );
};

// the alarm-slapping hand in the first shot
export const WakeHand: React.FC<{v: number}> = ({v}) => {
  const k = smooth(ramp(v, 0.55, C.slap));
  const back = smooth(ramp(v, C.slap + 0.5, C.slap + 1.3));
  const p = lerp3(lerp3([-1.0, FY + 0.42, 2.5], [-0.55, FY + 0.74, 2.22], k), [-1.05, FY + 0.4, 2.55], back);
  const press = hop(v, C.slap - 0.08, 0.25) * 0.03;
  return <Hand position={[p[0], p[1] - press, p[2]]} rotation={[Math.PI / 2, 0, Math.PI / 2 - 0.1]} shape={v < C.slap - 0.1 ? 'relaxed' : 'flat'} />;
};

// the T-shirt: a red tee that hangs from the hand, then flies into the crowd
export const TShirt: React.FC<{position: V3; rotation?: V3}> = ({position, rotation}) => (
  <group position={position} rotation={rotation}>
    <Box size={[0.5, 0.62, 0.03]} position={[0, -0.33, 0]} color="#d8302a" />
    <Box size={[0.2, 0.18, 0.03]} position={[-0.32, -0.1, 0]} rotation={[0, 0, 0.6]} color="#d8302a" />
    <Box size={[0.2, 0.18, 0.03]} position={[0.32, -0.1, 0]} rotation={[0, 0, -0.6]} color="#d8302a" />
    <Box size={[0.22, 0.22, 0.034]} position={[0, -0.32, 0]} color="#f2f2f2" shadow={false} />
  </group>
);

export const shirtAt = (v: number): {p: V3; r: V3} => {
  if (v < C.throw) {
    const sw = Math.sin(v * 2.2) * 0.08;
    return {p: [SHIRT_START[0], SHIRT_START[1], SHIRT_START[2]], r: [0, 0.2, sw]};
  }
  const k = ramp(v, C.throw, C.land);
  const p: V3 = [lerp(SHIRT_START[0], SHIRT_LAND[0], k), lerp(SHIRT_START[1], SHIRT_LAND[1], k * k) + 2.5 * Math.sin(Math.PI * k) * 0.6, lerp(SHIRT_START[2], SHIRT_LAND[2], k)];
  return {p, r: [k * 5, k * 3, Math.sin(k * 9) * 0.6]};
};

// ---------------------------------------------------------------- bathroom mirror (its own place, far from the flat)
export const BATH: V3 = [200, 0, 0];
export const Bathroom: React.FC<{v: number; eye: V3}> = ({v, eye}) => {
  // mirror plane at z = 0; the reflected room is a copy at z < 0 with the hero facing back at the camera
  const rel: V3 = [eye[0] - BATH[0], eye[1], eye[2] - BATH[2]];
  const tile = '#d8e4ea';
  const room = (mirror: 1 | -1) => (
    <group scale={[1, 1, mirror]}>
      <Box size={[3.0, 0.1, 2.4]} position={[0, -0.05, 1.2]} color="#9aa6b0" />
      <Box size={[3.0, 0.1, 2.4]} position={[0, 2.65, 1.2]} color="#f4f4f4" />
      <Box size={[0.2, 2.7, 2.4]} position={[-1.6, 1.35, 1.2]} color={tile} />
      <Box size={[0.2, 2.7, 2.4]} position={[1.6, 1.35, 1.2]} color={tile} />
      <Box size={[3.4, 2.7, 0.2]} position={[0, 1.35, 2.5]} color={tile} />
      {/* sink */}
      <Box size={[0.7, 0.18, 0.45]} position={[0, 0.85, 0.3]} color="#f6f6f6" />
      <Box size={[0.16, 0.85, 0.16]} position={[0, 0.42, 0.18]} color="#e8e8e8" />
      <Box size={[0.04, 0.16, 0.04]} position={[0, 1.0, 0.12]} color="#c8ccd2" />
      {/* towel on the side wall */}
      <Box size={[0.06, 0.6, 0.4]} position={[-1.47, 1.3, 1.0]} color="#e85d5d" />
      <Box size={[0.4, 0.06, 0.4]} position={[0, 2.57, 1.0]} color="#fff8e8" emissive="#fff3d0" emissiveIntensity={1.0} shadow={false} />
    </group>
  );
  return (
    <group position={BATH}>
      {room(1)}
      {room(-1)}
      {/* the mirror wall with a hole, a frame around it */}
      <Box size={[1.1, 2.7, 0.06]} position={[-1.05, 1.35, 0]} color={tile} />
      <Box size={[1.1, 2.7, 0.06]} position={[1.05, 1.35, 0]} color={tile} />
      <Box size={[1.0, 1.15, 0.06]} position={[0, 0.575, 0]} color={tile} />
      <Box size={[1.0, 0.45, 0.06]} position={[0, 2.475, 0]} color={tile} />
      <Box size={[1.06, 0.05, 0.1]} position={[0, 1.15, 0.0]} color="#c8ccd2" />
      <Box size={[1.06, 0.05, 0.1]} position={[0, 2.25, 0.0]} color="#c8ccd2" />
      <Box size={[0.05, 1.15, 0.1]} position={[-0.5, 1.7, 0.0]} color="#c8ccd2" />
      <Box size={[0.05, 1.15, 0.1]} position={[0.5, 1.7, 0.0]} color="#c8ccd2" />
      {/* the reflection: the hero stands where the camera is, mirrored */}
      <Hero position={[rel[0], 0, -rel[2]]} rotation={0} pose={{head: [0.04 + 0.02 * Math.sin(v * 1.2), 0], armL: [0.1, 0.06], armR: [0.1, -0.06], eyes: v < C.hudIn ? 1 : 1.15}} />
      <pointLight position={[0, 2.4, 1.0]} intensity={5} distance={6} color="#fff6e6" />
      <pointLight position={[0, 2.4, -1.0]} intensity={5} distance={6} color="#fff6e6" />
      <hemisphereLight color="#ffffff" groundColor="#8a8a8a" intensity={0.7} />
    </group>
  );
};

// ---------------------------------------------------------------- the hallway with the door intercom
export const HALL: V3 = [300, 0, 0];
export const INTERCOM_SCREEN: V3 = [300.45, 1.55, 0.06];
export const Hallway: React.FC<{v: number}> = ({v}) => {
  const on = v >= C.intercom;
  const scr = tex('intercom', 480, 360, drawIntercom);
  return (
    <group position={HALL}>
      <Box size={[4, 0.1, 3]} position={[0, -0.05, 1.5]} color="#8a6a4a" />
      <Box size={[4, 2.7, 0.2]} position={[0, 1.35, -0.1]} color="#e2d8c6" />
      <Box size={[0.2, 2.7, 3]} position={[-1.5, 1.35, 1.5]} color="#e2d8c6" />
      {/* the front door */}
      <Box size={[0.95, 2.05, 0.08]} position={[-0.6, 1.025, 0.04]} color="#5a3a2a" />
      <Box size={[0.08, 0.04, 0.1]} position={[-0.25, 1.0, 0.1]} color="#c8b070" />
      <Cyl rTop={0.02} rBottom={0.02} height={0.02} position={[-0.6, 1.6, 0.09]} rotation={[Math.PI / 2, 0, 0]} color="#c8c8c8" />
      {/* the intercom: body, screen, buttons */}
      <group position={[0.45, 1.55, 0]}>
        <Box size={[0.22, 0.32, 0.05]} position={[0, -0.03, 0.025]} color="#efefef" />
        <Pic size={[0.17, 0.13]} map={scr} position={[0, 0.04, 0.052]} glow={on ? 1 : 0.05} />
        <Box size={[0.04, 0.025, 0.012]} position={[-0.05, -0.12, 0.055]} color="#3ac86a" emissive="#20c050" emissiveIntensity={on ? 1.2 : 0} shadow={false} />
        <Box size={[0.04, 0.025, 0.012]} position={[0.05, -0.12, 0.055]} color="#d23c3c" shadow={false} />
      </group>
      <Box size={[0.6, 0.06, 0.6]} position={[0, 2.6, 1.2]} color="#fff6e0" emissive="#fff0c8" emissiveIntensity={1} shadow={false} />
      <pointLight position={[0, 2.3, 1.2]} intensity={5} distance={6} color="#fff0d6" />
      <hemisphereLight color="#fff6ea" groundColor="#6a5a4a" intensity={0.6} />
    </group>
  );
};
