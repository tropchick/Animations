import React from 'react';
import * as THREE from 'three';
import {Box, Cyl, Ico} from '../scene/parts';
import {V3} from './cues';
import {canvasTexture} from './tex';

// A box stretched between two points (an arm reaching in from outside the frame).
export const Limb: React.FC<{from: V3; to: V3; thick: number; color: string}> = ({from, to, thick, color}) => {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const d = b.clone().sub(a);
  const len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  const mid = a.clone().add(b).multiplyScalar(0.5);
  return (
    <group position={mid.toArray()} quaternion={q.toArray() as [number, number, number, number]}>
      <Box size={[thick, len, thick]} color={color} />
    </group>
  );
};

// arm in the blue sleeve with a hand at `to`
export const HeroArm: React.FC<{from: V3; to: V3; children?: React.ReactNode}> = ({from, to, children}) => {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const wrist = a.clone().lerp(b, 0.82).toArray() as V3;
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return (
    <>
      <Limb from={from} to={wrist} thick={0.15} color="#2f6fd6" />
      <Limb from={wrist} to={to} thick={0.11} color="#efd2b3" />
      <group position={to} quaternion={q.toArray() as [number, number, number, number]}>
        {children}
      </group>
    </>
  );
};

// digital clock face, red digits on black
export const clockTexture = (text: string) =>
  canvasTexture(`clock-${text}`, 256, 128, (c) => {
    c.fillStyle = '#0b0b0d';
    c.fillRect(0, 0, 256, 128);
    c.fillStyle = '#ff3b30';
    c.font = 'bold 92px "Courier New", monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, 128, 68);
  });

export const AlarmClock: React.FC<{position: V3; rotation?: number; text?: string; bounce?: number; squash?: number}> = ({
  position,
  rotation = 0,
  text = '06:00',
  bounce = 0,
  squash = 0,
}) => (
  <group position={[position[0], position[1] + bounce * 0.02, position[2]]} rotation={[0, rotation, bounce * 0.08]} scale={[1 + squash * 0.1, 1 - squash * 0.2, 1]}>
    <Box size={[0.26, 0.13, 0.1]} position={[0, 0.065, 0]} color="#d9dde3" />
    <mesh position={[0, 0.068, 0.0515]}>
      <planeGeometry args={[0.21, 0.09]} />
      <meshBasicMaterial map={clockTexture(text)} toneMapped={false} />
    </mesh>
    <Box size={[0.08, 0.02, 0.05]} position={[0, 0.14, 0]} color="#b5bac2" />
  </group>
);

// camera on a tripod, `yaw` turns the head, `rec` lights the red lamp
export const TripodCam: React.FC<{position: V3; yaw: number; rec?: boolean; height?: number}> = ({position, yaw, rec = false, height = 1.55}) => (
  <group position={position}>
    {[0, 1, 2].map((k) => {
      const a = (k / 3) * Math.PI * 2;
      return (
        <Cyl
          key={k}
          rTop={0.015}
          rBottom={0.015}
          height={height + 0.05}
          segments={5}
          position={[Math.sin(a) * 0.18, height / 2, Math.cos(a) * 0.18]}
          rotation={[Math.cos(a) * 0.07, 0, -Math.sin(a) * 0.07]}
          color="#2a2c31"
        />
      );
    })}
    <group position={[0, height, 0]} rotation={[0, yaw, 0]} scale={1.35}>
      <Box size={[0.16, 0.18, 0.34]} position={[0, 0.1, 0]} color="#1b1c20" />
      <Cyl rTop={0.06} rBottom={0.065} height={0.14} segments={10} position={[0, 0.1, 0.23]} rotation={[Math.PI / 2, 0, 0]} color="#0f1012" />
      <Box size={[0.03, 0.03, 0.03]} position={[0.05, 0.21, 0.12]} color={rec ? '#ff2a2a' : '#4a1d1d'} emissive={rec ? '#ff1a1a' : undefined} emissiveIntensity={2} shadow={false} />
    </group>
  </group>
);

// ribbon and a big bow on a car (car is 4.2 m along x, roof top at 1.64)
export const Bow: React.FC = () => {
  const red = '#e0283a';
  return (
    <group>
      <Box size={[0.28, 0.74, 1.84]} position={[0.2, 0.66, 0]} color={red} />
      <Box size={[0.28, 0.035, 1.66]} position={[0, 1.655, 0]} color={red} shadow={false} />
      <Box size={[2.32, 0.035, 0.28]} position={[-0.25, 1.655, 0]} color={red} shadow={false} />
      <Box size={[4.24, 0.74, 0.28]} position={[0, 0.66, 0]} color={red} />
      <Ico radius={0.34} detail={0} position={[-0.05, 1.86, 0.32]} scale={[0.7, 0.45, 1]} rotation={[0.5, 0, 0]} color={red} />
      <Ico radius={0.34} detail={0} position={[-0.05, 1.86, -0.32]} scale={[0.7, 0.45, 1]} rotation={[-0.5, 0, 0]} color={red} />
      <Box size={[0.2, 0.16, 0.2]} position={[-0.05, 1.74, 0]} color="#c41f30" />
      <Box size={[0.12, 0.03, 0.5]} position={[-0.05, 1.69, 0.42]} rotation={[0.3, 0.4, 0]} color={red} shadow={false} />
      <Box size={[0.12, 0.03, 0.5]} position={[-0.05, 1.69, -0.42]} rotation={[-0.3, -0.4, 0]} color={red} shadow={false} />
    </group>
  );
};

// a stack of banknote bundles with paper bands
export const MoneyStack: React.FC<{rows?: number}> = ({rows = 6}) => {
  const out = [];
  for (let y = 0; y < rows; y++) {
    for (const [x, z] of [[-0.17, -0.08], [0.17, -0.08], [-0.17, 0.08], [0.17, 0.08]] as const) {
      out.push(
        <group key={`${y}${x}${z}`} position={[x, 0.025 + y * 0.05, z]} rotation={[0, (y % 2) * 0.03, 0]}>
          <Box size={[0.32, 0.048, 0.15]} color="#7bbf6a" />
          <Box size={[0.06, 0.05, 0.152]} color="#f1ead6" shadow={false} />
        </group>,
      );
    }
  }
  return <>{out}</>;
};

// a painted word lying flat on the ground (white letters, transparent background)
export const groundTextTexture = (text: string, w = 2048, h = 512, font = 'bold 300px Inter, Arial, sans-serif') =>
  canvasTexture(`ground-${text}`, w, h, (c) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,0.92)';
    c.font = font;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, w / 2, h / 2 + 10);
  });

export const PalmTree: React.FC<{position: V3; lean?: number; seed?: number}> = ({position, lean = 0.15, seed = 0}) => (
  <group position={position} rotation={[0, seed, lean]}>
    {[0, 1, 2, 3, 4, 5].map((k) => (
      <Cyl key={k} rTop={0.16 - k * 0.012} rBottom={0.19 - k * 0.012} height={1.0} segments={6} position={[k * 0.06, 0.5 + k * 0.98, 0]} rotation={[0, k, 0]} color={k % 2 ? '#a2794b' : '#8f6a40'} />
    ))}
    <group position={[0.36, 6.0, 0]}>
      {[0, 1, 2, 3, 4, 5, 6].map((k) => {
        const a = (k / 7) * Math.PI * 2 + seed;
        return (
          <group key={k} rotation={[0, a, 0]}>
            <Box size={[0.5, 0.05, 2.0]} position={[0, -0.25, 1.0]} rotation={[0.45, 0, 0]} color={k % 2 ? '#4f9a3f' : '#5fae4a'} />
          </group>
        );
      })}
      <Ico radius={0.25} detail={0} position={[0, -0.2, 0]} color="#6b4a2a" />
    </group>
  </group>
);
