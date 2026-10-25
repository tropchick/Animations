import React from 'react';
import {V3, lerp, lerp3, ramp, smooth} from '../cues';
import {Gleb, GloveHand} from '../Gleb';
import {CONSOLE, DESK_TOP, HALL_DOOR, SPOT} from '../Hall';
import {Collar, LampWire, MassField, blob, mound} from './Mass';
import {Handset, PhoneBase} from './Props';

// What episode 2 adds to the hall of episode 1: the mass on the floor, Gleb's new moves, the phone.

const wallRise = (x: number, z: number) => {
  const d = Math.min(x + 16, 16 - x, z + 7, 8 - z);
  return 0.45 * Math.exp(-Math.max(0, d) / 0.3);
};

// by noon the whole floor is grey; a low hump where the desk was
const noonHeight = (x: number, z: number) => {
  const desk = mound(x, z, SPOT[0], SPOT[2], 1.2, 0.9, 0.32);
  return 0.018 + wallRise(x, z) + desk;
};

export const FloorMass: React.FC<{v: number}> = ({v}) => (
  <group>
    <MassField id="hall-noon" size={[32.2, 15.2]} seg={[150, 72]} height={(x, z) => noonHeight(x, z + 0.5)} v={v} ripple={0.006} position={[0, 0, 0.5]} />
    {/* the mass climbs everything that stands on the floor */}
    <Collar position={[0, 0, 0]} r={1.0} h={0.22} spread={0.9} seg={16} />
    <Collar position={[CONSOLE[0], 0, CONSOLE[2]]} r={0.55} h={0.16} spread={0.9} scale={[1.55, 1, 0.75]} seg={12} />
    {[4.5, 8.5, 12.5].flatMap((x) => [-3.2, 3.0].flatMap((z) => [-1.2, 1.2].map((lx) => <Collar key={`${x}${z}${lx}`} position={[x + lx, 0, z]} r={0.05} h={0.14} scale={[1, 1, 8]} />)))}
    {Array.from({length: 7}).map((_, i) => (
      <Collar key={i} position={[-13 + i * 1.1, 0, -6.55]} r={0.45} h={0.25} spread={0.6} scale={[1.15, 1, 0.95]} seg={8} />
    ))}
    <LampWire position={[SPOT[0] - 0.3, 0.3, SPOT[2] - 0.2]} />
  </group>
);

// the grey edge showing from under the hall door; k = 0..1 how far it has come out
export const DoorEdge: React.FC<{v: number; k: number}> = ({v, k}) => {
  const step = Math.round(k * 24);
  const depth = (x: number) => (0.012 + 0.03 * (step / 24)) * (0.75 + 0.25 * Math.sin(x * 23 + 1) + 0.15 * Math.sin(x * 61));
  return (
    <>
    <pointLight position={[-4.25, 0.45, -7.65]} color="#c9d8e6" intensity={0.35} distance={1.4} decay={2} />
    <MassField
      id={`door-edge-${step}`}
      size={[0.96, 0.12]}
      seg={[48, 8]}
      height={(x, z) => (0.06 - z < depth(x) ? 0.004 : -1)}
      v={v}
      ripple={0.0012}
      jitter={0.2}
      position={[HALL_DOOR[0], 0, HALL_DOOR[2] - 0.035 - 0.06]}
    />
    </>
  );
};

const walk = (v: number, a: number, b: number, speed = 9) => {
  const moving = v > a && v < b ? 1 : 0;
  return {k: smooth(ramp(v, a, b)), swing: Math.sin((v - a) * speed) * 0.35 * moving};
};

// Gleb backs away from the desk while the jar sinks
export const GlebBacking: React.FC<{v: number; from: number; to: number}> = ({v, from, to}) => {
  const {k, swing} = walk(v, from + 0.6, to, 6);
  const p = lerp3([-7.55, 0, -5.3], [-7.8, 0, -6.1], k);
  return (
    <Gleb
      position={p}
      rotation={0.35}
      pose={{legL: -swing * 0.6, legR: swing * 0.6, armL: [0.15, 0.1], armR: [0.25, -0.1], elbowL: 0.3, elbowR: 0.4, head: [0.35, 0.1], stoop: 0.12}}
    />
  );
};

// Gleb at the console with the phone to his ear, back to the camera
export const GlebPhone: React.FC<{v: number}> = ({v}) => (
  <>
    <Gleb
      position={[-1.85, 0, 2.72]}
      rotation={Math.PI - 0.25}
      pose={{armL: [0.35, 0.1], elbowL: 0.6, armR: [1.25, 0.55], elbowR: 2.35, head: [0.18 + 0.03 * Math.sin(v * 0.9), -0.12], stoop: 0.14}}
      rightHand={
        <group position={[0, 0.05, 0.02]} rotation={[0.2, 0, 0.3]}>
          <Handset />
        </group>
      }
    />
    <PhoneBase position={[CONSOLE[0] + 0.62, 0.885, CONSOLE[2] + 0.12]} rotation={0.2} />
  </>
);

// outside the hall: pulling the lock lever, then looking in through the window
export const GlebAtDoor: React.FC<{v: number; lever: number}> = ({v, lever}) => {
  const pull = smooth(ramp(v, lever - 0.35, lever));
  const back = smooth(ramp(v, lever + 0.3, lever + 1.2));
  return (
    <Gleb
      position={[lerp(-4.12, -4.3, back), 0, -7.62]}
      rotation={0}
      pose={{armR: [lerp(0.6, 1.05, pull) - back * 0.5, 0.15], elbowR: lerp(0.9, 0.35, pull), armL: [0.1, 0.06], head: [lerp(0.25, 0.1, back), lerp(0.4, 0, back)], stoop: 0.12}}
    />
  );
};

export const GlebAtWindow: React.FC<{v: number}> = ({v}) => (
  <>
    <Gleb position={[-4.5, -0.27, -7.47]} rotation={0} pose={{head: [-0.05 + 0.02 * Math.sin(v * 0.8), 0.04], stoop: 0.04, armL: [0.4, 0.1], elbowL: 1.2, armR: [0.3, -0.1], elbowR: 1.0}} />
    <pointLight position={[-4.2, 2.2, -7.9]} color="#b9cce0" intensity={0.12} distance={2} decay={2} />
  </>
);

// glove flat on the warm door
export const DoorHand: React.FC<{v: number}> = ({v}) => {
  const press = 0.004 * Math.sin(v * 1.4);
  const p: V3 = [HALL_DOOR[0] + 0.12, 1.3, HALL_DOOR[2] - 0.057 - press];
  return <GloveHand position={p} rotation={[0.45, 0, Math.PI]} curl={0.06} spread={0.14} />;
};

export {blob};
