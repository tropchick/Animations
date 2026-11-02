import React from 'react';
import * as THREE from 'three';
import {Box, Cone, Cyl, Ico} from '../scene/parts';
import {PersonPose} from '../scene/Characters';
import {V3, rnd} from './cues';
import {ConsoleBox, Fan, FanLook} from './props';
import {drawLoading, drawPhone, useCanvas} from './tex';

// ---------- a TV with the install screen ----------

export const Screen: React.FC<{position: V3; w: number; h: number; pct: number; play: number; pulse: number; on: number; rotation?: V3}> = ({
  position,
  w,
  h,
  pct,
  play,
  pulse,
  on,
  rotation,
}) => {
  const tex = useCanvas(800, 450, `${pct.toFixed(1)}-${play.toFixed(2)}-${pulse.toFixed(2)}`, (g) => drawLoading(g, 800, 450, pct, play, pulse));
  // switching off: the picture squeezes into a bright line, then a dot
  const sy = on >= 1 ? 1 : Math.max(0.004, on);
  return (
    <group position={position} rotation={rotation}>
      <Box size={[w + 0.08, h + 0.08, 0.08]} position={[0, 0, -0.045]} color="#141418" />
      <mesh position={[0, 0, 0.0]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color="#050507" />
      </mesh>
      {on > 0 ? (
        <mesh position={[0, 0, 0.004]} scale={[on >= 1 ? 1 : 0.3 + 0.7 * Math.min(1, on * 3), sy, 1]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={tex} toneMapped={false} color={on < 1 ? new THREE.Color(2, 2, 2) : new THREE.Color(1, 1, 1)} />
        </mesh>
      ) : null}
    </group>
  );
};

// ---------- the fan's flat: TV corner for the blackout, the floor by the window for the ice age ----------

export const Room: React.FC<{outside: string; outsideLit: number; frost?: number}> = ({outside, outsideLit, frost = 0}) => (
  <group>
    <Box size={[6, 0.1, 6]} position={[0, -0.05, 0]} color="#8a6a52" />
    <Box size={[6, 3, 0.1]} position={[0, 1.5, 3.05]} color="#d9cfc2" />
    <Box size={[0.1, 3, 6]} position={[-3.05, 1.5, 0]} color="#d3c6b6" />
    <Box size={[0.1, 3, 6]} position={[3.05, 1.5, 0]} color="#d3c6b6" />
    <Box size={[6, 0.1, 6]} position={[0, 3.05, 0]} color="#e8e2da" />
    {/* the back wall with a wide window */}
    <Box size={[6, 0.9, 0.12]} position={[0, 0.45, -3.0]} color="#d9cfc2" />
    <Box size={[6, 0.6, 0.12]} position={[0, 2.7, -3.0]} color="#d9cfc2" />
    <Box size={[1.6, 1.5, 0.12]} position={[-2.2, 1.65, -3.0]} color="#d9cfc2" />
    <Box size={[1.6, 1.5, 0.12]} position={[2.2, 1.65, -3.0]} color="#d9cfc2" />
    <Box size={[2.8, 0.06, 0.06]} position={[0, 1.65, -2.97]} color="#f4f4f4" />
    <Box size={[0.06, 1.5, 0.06]} position={[0, 1.65, -2.97]} color="#f4f4f4" />
    <Box size={[2.9, 0.08, 0.3]} position={[0, 0.92, -2.88]} color="#f4f4f4" />
    {/* the view: sky and lit windows of the houses across */}
    <mesh position={[0, 1.8, -8]}>
      <planeGeometry args={[14, 8]} />
      <meshBasicMaterial color={outside} toneMapped={false} />
    </mesh>
    {Array.from({length: 5}).map((_, i) => (
      <group key={i} position={[-4 + i * 2, 0, -7.5]}>
        <Box size={[1.8, 2.4 + rnd(i + 3) * 2.5, 0.5]} position={[0, 0.6 + (2.4 + rnd(i + 3) * 2.5) / 2, 0]} color="#2c2638" shadow={false} />
        {Array.from({length: 4}).map((__, k) => (
          <Box
            key={k}
            size={[0.3, 0.3, 0.05]}
            position={[(k % 2) * 0.7 - 0.35, 1.4 + Math.floor(k / 2) * 0.8, 0.27]}
            color={outsideLit > 0.5 && rnd(i * 4 + k) > 0.3 ? '#ffd890' : '#1b1d26'}
            emissive={outsideLit > 0.5 && rnd(i * 4 + k) > 0.3 ? '#ffb850' : undefined}
            shadow={false}
          />
        ))}
      </group>
    ))}
    {/* frost on the glass */}
    {frost > 0 ? (
      <mesh position={[0, 1.65, -2.93]}>
        <planeGeometry args={[2.8, 1.5]} />
        <meshBasicMaterial color="#e6f2fa" transparent opacity={0.55 * frost} depthWrite={false} />
      </mesh>
    ) : null}
    {/* TV on a low stand in the corner, the sofa facing it */}
    <Box size={[1.8, 0.5, 0.5]} position={[1.6, 0.25, -2.6]} color="#3b3330" />
    <Box size={[2.4, 0.45, 0.9]} position={[1.6, 0.22, 0.6]} color="#6b3f52" />
    <Box size={[2.4, 0.6, 0.25]} position={[1.6, 0.75, 1.0]} color="#6b3f52" />
    <Box size={[0.25, 0.35, 0.9]} position={[0.5, 0.6, 0.6]} color="#6b3f52" />
    <Box size={[0.25, 0.35, 0.9]} position={[2.7, 0.6, 0.6]} color="#6b3f52" />
    <Box size={[2.2, 0.06, 1.4]} position={[0.2, 0.03, -0.4]} color="#3f6a8a" />
  </group>
);

// sitting: the hips drop to `seat`, legs forward
export const sitPose = (pose: PersonPose = {}): PersonPose => ({legL: 1.45, legR: 1.45, ...pose});
export const Sitting: React.FC<{position: V3; rotation?: number; seat: number; pose?: PersonPose; look?: FanLook; box?: 'chest' | 'lap' | 'none'}> = ({
  position,
  rotation = 0,
  seat,
  pose,
  look,
  box = 'none',
}) => (
  <Fan position={[position[0], position[1] + seat - 0.9 + 0.1, position[2]]} rotation={rotation} pose={sitPose(pose)} look={look} box={box} />
);

// the candle on the floor
export const Candle: React.FC<{position: V3; t: number}> = ({position, t}) => {
  const f = 1 + 0.12 * Math.sin(t * 13) + 0.08 * Math.sin(t * 29 + 1);
  return (
    <group position={position}>
      <Cyl rTop={0.035} rBottom={0.035} height={0.14} position={[0, 0.07, 0]} color="#f3ead6" segments={8} />
      <Cyl rTop={0.06} rBottom={0.07} height={0.02} position={[0, 0.01, 0]} color="#8a8a8a" segments={8} />
      <Cone radius={0.018} height={0.06 * f} position={[0, 0.17, 0]} color="#ffe2a0" emissive="#ffb050" emissiveIntensity={3} shadow={false} segments={6} />
      <pointLight position={[0, 0.25, 0]} color="#ffb060" intensity={2.6 * f} distance={4} decay={2} />
    </group>
  );
};

// a breath cloud in the cold
export const Breath: React.FC<{position: V3; t: number}> = ({position, t}) => {
  const k = (t % 2.2) / 2.2;
  if (k > 0.7) return null;
  return <Ico radius={0.04 + k * 0.18} position={[position[0], position[1] + k * 0.1, position[2] + k * 0.35]} color="#eef4f8" opacity={0.5 * (1 - k / 0.7)} shadow={false} />;
};

// ---------- the bunker ----------

export const Bunker: React.FC<{shake: number; t: number; swing: number}> = ({shake, t, swing}) => {
  const wall = '#8d8c87';
  return (
    <group>
      <Box size={[5, 0.1, 5]} position={[0, -0.05, 0]} color="#6d6c68" />
      <Box size={[5, 2.6, 0.2]} position={[0, 1.3, -2.5]} color={wall} />
      <Box size={[5, 2.6, 0.2]} position={[0, 1.3, 2.5]} color={wall} />
      <Box size={[0.2, 2.6, 5]} position={[-2.5, 1.3, 0]} color={wall} />
      <Box size={[0.2, 2.6, 5]} position={[2.5, 1.3, 0]} color={wall} />
      <Box size={[5, 0.2, 5]} position={[0, 2.7, 0]} color="#7d7c78" />
      {/* concrete seams */}
      {[-1.2, 0, 1.2].map((x) => (
        <Box key={x} size={[0.04, 2.6, 0.04]} position={[x, 1.3, -2.39]} color="#73726d" shadow={false} />
      ))}
      {/* steel door */}
      <Box size={[1.1, 2.0, 0.1]} position={[-1.6, 1.0, 2.37]} color="#4d5a52" />
      <Cyl rTop={0.18} rBottom={0.18} height={0.05} position={[-1.6, 1.1, 2.3]} rotation={[Math.PI / 2, 0, 0]} color="#c4b26a" segments={10} />
      {/* shelves with cans and water */}
      <group position={[-2.15, 0, -1.2]}>
        {[0.5, 1.1, 1.7].map((y) => (
          <Box key={y} size={[0.5, 0.05, 1.8]} position={[0, y, 0]} color="#5b4a3a" />
        ))}
        {Array.from({length: 12}).map((_, i) => (
          <Cyl
            key={i}
            rTop={0.07}
            rBottom={0.07}
            height={0.16}
            position={[0, [0.5, 1.1, 1.7][i % 3] + 0.105, -0.75 + Math.floor(i / 3) * 0.45]}
            color={['#c94a3a', '#d8c25a', '#5a8ac9'][i % 3]}
            segments={8}
          />
        ))}
      </group>
      {/* the car battery with cables */}
      <Box size={[0.35, 0.25, 0.2]} position={[0.75, 0.125, -1.85]} color="#202226" />
      <Box size={[0.36, 0.04, 0.21]} position={[0.75, 0.27, -1.85]} color="#c9382f" />
      <Box size={[0.6, 0.02, 0.02]} position={[0.45, 0.29, -1.85]} color="#c9382f" />
      {/* the crate with the TV and the console */}
      <Box size={[1.4, 0.7, 0.7]} position={[0, 0.35, -2.0]} color="#8a6a42" />
      <Box size={[1.42, 0.06, 0.72]} position={[0, 0.5, -2.0]} color="#6f5434" />
      <Box size={[0.38, 0.08, 0.3]} position={[-0.5, 0.74, -1.85]} color="#f2f2f4" />
      <Box size={[0.39, 0.02, 0.31]} position={[-0.5, 0.79, -1.85]} color="#1f3f9e" />
      {/* the hanging bulb */}
      <group position={[0, 2.6, -0.4]} rotation={[swing * 0.5, 0, swing]}>
        <Cyl rTop={0.006} rBottom={0.006} height={0.7} position={[0, -0.35, 0]} color="#111" segments={4} />
        <Ico radius={0.07} detail={1} position={[0, -0.75, 0]} color="#fff2c8" emissive="#ffd890" emissiveIntensity={2.5} shadow={false} />
        <pointLight position={[0, -0.8, 0]} color="#ffd8a0" intensity={4} distance={7} decay={2} castShadow={false} />
      </group>
      {/* falling dust while it shakes */}
      {shake > 0
        ? Array.from({length: 26}).map((_, i) => {
            const life = 1.1;
            const age = (t + rnd(i) * life) % life;
            return (
              <Box
                key={i}
                size={[0.02, 0.02, 0.02]}
                position={[(rnd(i + 5) - 0.5) * 3.5, 2.55 - age * age * 4.5, (rnd(i + 9) - 0.5) * 3.5 - 0.5]}
                color="#c9c4b8"
                shadow={false}
                opacity={Math.min(1, shake * 1.5)}
              />
            );
          })
        : null}
    </group>
  );
};

// ---------- the gamepad in his hands (close-up) ----------

export const Gamepad: React.FC<{press: number}> = ({press}) => (
  <group>
    <Box size={[0.16, 0.035, 0.08]} position={[0, 0, 0]} color="#22232a" />
    <Box size={[0.05, 0.034, 0.09]} position={[-0.07, -0.002, 0.05]} rotation={[0, 0.25, 0]} color="#22232a" />
    <Box size={[0.05, 0.034, 0.09]} position={[0.07, -0.002, 0.05]} rotation={[0, -0.25, 0]} color="#22232a" />
    {/* D-pad */}
    <Box size={[0.03, 0.006, 0.01]} position={[-0.05, 0.02, -0.005]} color="#45464e" />
    <Box size={[0.01, 0.006, 0.03]} position={[-0.05, 0.02, -0.005]} color="#45464e" />
    {/* sticks */}
    <Cyl rTop={0.011} rBottom={0.013} height={0.012} position={[-0.025, 0.023, 0.022]} color="#3a3b42" segments={10} />
    <Cyl rTop={0.011} rBottom={0.013} height={0.012} position={[0.025, 0.023, 0.022]} color="#3a3b42" segments={10} />
    {/* four round face buttons */}
    {(
      [
        [0.05, -0.018, '#3bd16f'],
        [0.064, -0.004, '#e8453c'],
        [0.036, -0.004, '#3b8ee8'],
        [0.05, 0.01, '#f2c230'],
      ] as [number, number, string][]
    ).map(([x, z, c], i) => (
      <Cyl
        key={i}
        rTop={0.0065}
        rBottom={0.0065}
        height={0.008}
        position={[x, 0.02 - (i === 3 ? press * 0.003 : 0), z]}
        color={c}
        emissive={i === 3 ? c : undefined}
        emissiveIntensity={0.5}
        segments={12}
      />
    ))}
  </group>
);

// ---------- the phone in the ash ----------

export const Phone: React.FC<{on: number; note: number; battery: boolean}> = ({on, note, battery}) => {
  const tex = useCanvas(540, 1100, `${on.toFixed(2)}-${note.toFixed(3)}-${battery}`, (g) => drawPhone(g, 540, 1100, on, note, battery));
  return (
    <group>
      <Box size={[0.078, 0.009, 0.162]} position={[0, 0.0045, 0]} color="#1a1a1e" />
      <mesh position={[0, 0.0115, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.072, 0.156]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {on > 0 ? <pointLight position={[0, 0.06, 0]} color="#9ab8ff" intensity={0.25 * on} distance={0.5} decay={2} /> : null}
    </group>
  );
};

// ash dunes around the phone
export const AshGround: React.FC<{scale?: number}> = ({scale = 1}) => (
  <group scale={scale}>
    <Box size={[4, 0.2, 4]} position={[0, -0.1, 0]} color="#77726b" />
    {Array.from({length: 18}).map((_, i) => (
      <Ico
        key={i}
        radius={0.05 + rnd(i + 1) * 0.12}
        position={[(rnd(i + 2) - 0.5) * 0.9, -0.03, (rnd(i + 3) - 0.5) * 0.9]}
        rotation={[i, i * 2, 0]}
        scale={[1, 0.35, 1]}
        color={rnd(i + 4) > 0.5 ? '#6d6862' : '#827c74'}
      />
    ))}
    <Box size={[0.05, 0.02, 0.03]} position={[0.12, 0.005, 0.1]} rotation={[0, 0.6, 0]} color="#3a3633" />
  </group>
);

export {ConsoleBox};
