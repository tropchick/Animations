import React from 'react';
import {Box, Bush, Cyl, Tree} from '../scene/parts';
import {Car} from '../gravity/props';
import {Courier, Hero, Keys, Operator} from './cast';
import {Ground, Sky, Sun} from './env';
import {Bow} from './props';
import {KEYS, ShotState, V3, hop, lerp, ramp, smooth, wordStart} from './cues';

// In front of the house: the courier with pancakes at the door, the keys, the car with a bow on the driveway.
// Facade at z = 0 facing +z, door at x = 0, step from z 0 to 1.2 (top at 0.15).

export const CAR_POS: V3 = [-1.8, 0, 7];
export const HERO_DOOR: V3 = [0, 0.15, 0.6];
export const COURIER_DOOR: V3 = [0, 0, 2.3];
export const COURIER_HUG: V3 = [-1.55, 0, 8.22];
export const OPERATOR_POS: V3 = [-2.2, 0, 9.7];
export const HERO_YARD: V3 = [0.0, 0, 11.6];
export const HERO_YARD_YAW = -0.17;

const Facade: React.FC = () => {
  const windows: V3[] = [[-5.5, 1.6, 0], [-3, 1.6, 0], [3, 1.6, 0], [5.5, 1.6, 0], [-5.5, 4.8, 0], [-3, 4.8, 0], [0, 4.8, 0], [3, 4.8, 0], [5.5, 4.8, 0]];
  return (
    <group>
      <Box size={[16, 7, 10]} position={[0, 3.5, -5]} color="#f4f1ea" />
      <Box size={[16.4, 0.4, 10.4]} position={[0, 7.2, -5]} color="#d9d2c4" />
      <Box size={[16.2, 0.25, 0.2]} position={[0, 3.3, 0.1]} color="#e2dbcd" />
      {windows.map((w, i) => (
        <group key={i} position={w}>
          <Box size={[1.5, 1.7, 0.08]} position={[0, 0, 0.04]} color="#ffffff" />
          <Box size={[1.3, 1.5, 0.06]} position={[0, 0, 0.09]} color="#33465e" />
          <Box size={[0.05, 1.5, 0.03]} position={[0, 0, 0.13]} color="#ffffff" shadow={false} />
        </group>
      ))}
      {/* door frame and the open door */}
      <Box size={[0.18, 2.5, 0.3]} position={[-0.7, 1.4, 0.15]} color="#ffffff" />
      <Box size={[0.18, 2.5, 0.3]} position={[0.7, 1.4, 0.15]} color="#ffffff" />
      <Box size={[1.58, 0.2, 0.3]} position={[0, 2.75, 0.15]} color="#ffffff" />
      <Box size={[1.22, 2.5, 0.02]} position={[0, 1.4, 0.005]} color="#2b2522" shadow={false} />
      <Box size={[3.2, 0.15, 1.2]} position={[0, 0.075, 0.6]} color="#d6d0c6" />
      {/* lamps by the door */}
      <Box size={[0.16, 0.3, 0.16]} position={[-1.05, 2.2, 0.12]} color="#2d2f35" />
      <Box size={[0.16, 0.3, 0.16]} position={[1.05, 2.2, 0.12]} color="#2d2f35" />
      {[-6.5, -4.2, 4.2, 6.5].map((x) => (
        <Bush key={x} position={[x, 0, 0.9]} size={1.1} seed={x} flowers={x > 0} />
      ))}
      <Tree position={[-9, 0, 4]} size={1.4} seed={0.4} />
      <Tree position={[9.5, 0, 6]} size={1.6} seed={1.7} />
      <Tree position={[-6, 0, 17]} size={1.3} seed={2.2} />
      <Tree position={[8, 0, 18]} size={1.2} seed={3.1} />
      {/* driveway, path and the street */}
      <Box size={[4.6, 0.02, 15]} position={[-1.8, 0.01, 8.5]} color="#c9c4ba" shadow={false} />
      <Box size={[1.4, 0.02, 4]} position={[0, 0.02, 3.2]} color="#d9d3c8" shadow={false} />
      <Box size={[60, 0.02, 7]} position={[0, 0.012, 19.5]} color="#5a5e66" shadow={false} />
      <Box size={[60, 0.03, 0.15]} position={[0, 0.03, 19.5]} color="#f4f1ea" shadow={false} />
      {/* fence along the street */}
      {Array.from({length: 22})
        .map((_, i) => -21 + i * 2)
        .filter((x) => x < -4.4 || x > 0.8)
        .map((x) => (
          <Box key={x} size={[0.1, 0.9, 0.1]} position={[x, 0.45, 15.6]} color="#ffffff" />
        ))}
      {[[-12.7, 16.6], [11.4, 21.2]].map(([x, w]) => (
        <group key={x}>
          <Box size={[w, 0.08, 0.06]} position={[x, 0.75, 15.6]} color="#ffffff" />
          <Box size={[w, 0.08, 0.06]} position={[x, 0.35, 15.6]} color="#ffffff" />
        </group>
      ))}
    </group>
  );
};

const Moped: React.FC<{position: V3; rotation?: number}> = ({position, rotation = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Cyl rTop={0.25} rBottom={0.25} height={0.12} segments={10} position={[0.6, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} color="#1e1f23" />
    <Cyl rTop={0.25} rBottom={0.25} height={0.12} segments={10} position={[-0.6, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} color="#1e1f23" />
    <Box size={[1.1, 0.35, 0.36]} position={[-0.15, 0.55, 0]} color="#f2c230" />
    <Box size={[0.5, 0.1, 0.32]} position={[-0.25, 0.78, 0]} color="#2a2b30" />
    <Box size={[0.12, 0.8, 0.12]} position={[0.55, 0.75, 0]} rotation={[0, 0, -0.3]} color="#2a2b30" />
    <Box size={[0.08, 0.06, 0.6]} position={[0.66, 1.12, 0]} color="#2a2b30" />
    <Box size={[0.45, 0.4, 0.4]} position={[-0.55, 0.95, 0]} color="#e39a18" />
  </group>
);

const PancakeBox: React.FC = () => (
  <group>
    <Box size={[0.42, 0.08, 0.42]} color="#c9a26e" />
    <Box size={[0.2, 0.002, 0.2]} position={[0, 0.041, 0]} color="#e9563c" shadow={false} />
  </group>
);

// watch on the left wrist
const Watch: React.FC = () => <Box size={[0.13, 0.05, 0.14]} position={[0, 0.17, 0]} color="#1b1c20" />;

export const HouseFront: React.FC<{v: number; s: ShotState}> = ({v, s}) => {
  const t = s.t;
  const crying = s.name === 'crying';
  const sob = Math.sin(v * 9);
  // hero: in the door for the pancakes and the keys, on the drive looking at his watch later
  const give = smooth(ramp(v, KEYS - 0.5, KEYS - 0.05));
  const lookUp = smooth(ramp(v, wordStart(41) - 0.2, wordStart(41) + 0.2));
  const courierTake = smooth(ramp(v, KEYS + 0.25, KEYS + 0.6));
  return (
    <group>
      <Sky top="#6fb3ea" horizon="#dcefff" />
      <hemisphereLight color="#eaf4ff" groundColor="#7a8a60" intensity={0.9} />
      <ambientLight intensity={0.1} />
      <Sun position={[-9, 14, 12]} target={[-0.5, 0, 5]} intensity={2.5} size={16} />
      <Ground color="#79b45a" />
      <Facade />
      <group position={CAR_POS}>
        <Car color="#eef1f4" />
        <Bow />
      </group>
      <Moped position={[3.0, 0, 4.2]} rotation={-0.4} />
      {!crying ? (
        <>
          {s.name !== 'door' ? <Hero
            position={HERO_DOOR}
            pose={{armR: [lerp(0.2, 1.3, give), -0.1], elbowR: lerp(0.3, 0.15, give), armL: [0.15, 0.06], head: [0.12, 0]}}
            rightHand={give > 0.5 && courierTake < 0.5 ? <Keys /> : null}
          /> : null}
          <Courier
            position={COURIER_DOOR}
            rotation={Math.PI}
            t={t}
            pose={{
              armL: [s.name === 'door' ? 1.0 : 0.6, 0.15],
              elbowL: s.name === 'door' ? 0.55 : 1.2,
              armR: [s.name === 'door' ? 1.0 : lerp(0.2, 1.15, give), -0.15],
              elbowR: s.name === 'door' ? 0.55 : 0.2,
              mouth: s.name === 'keys' ? 0.5 * courierTake + 0.2 * give : 0.25 * hop(t, 0.9, 1.6),
              eyes: s.name === 'keys' ? 1 + 0.5 * give : 1,
              head: [s.name === 'keys' ? 0.25 * give : -0.05, 0],
            }}
            leftHand={s.name === 'door' ? null : null}
            rightHand={courierTake > 0.5 ? <Keys /> : null}
          />
          {s.name === 'door' ? (
            <group position={[COURIER_DOOR[0], 1.2 + 0.03 * hop(t, 0.3, 0.6), COURIER_DOOR[2] - 0.55 + 0.12 * smooth(ramp(t, 0.2, 0.8)) * -1]}>
              <PancakeBox />
            </group>
          ) : null}
        </>
      ) : (
        <>
          {/* courier hugs the car, the operator cries too, the hero checks his watch */}
          <group position={COURIER_HUG} rotation={[0, Math.PI, 0]}>
            <group rotation={[0.32, 0, 0]}>
              <Courier
                position={[0, 0, 0]}
                t={v}
                tears={1}
                pose={{armL: [1.75 + 0.05 * sob, 0.35], armR: [1.75 + 0.05 * sob, -0.35], elbowL: 0.4, elbowR: 0.4, head: [-0.1, 0.65], mouth: 0.6 + 0.2 * sob, eyes: 0.35}}
              />
            </group>
          </group>
          <group position={[0, 0.02 * Math.abs(Math.sin(v * 7)), 0]}>
            <Operator position={OPERATOR_POS} rotation={2.73} t={v + 0.3} tears={1} pose={{head: [0.25 + 0.06 * Math.sin(v * 8), 0], eyes: 0.4, mouth: 0.35}} />
          </group>
          <Hero
            position={HERO_YARD}
            rotation={HERO_YARD_YAW}
            pose={{armL: [0.75, 0.6], elbowL: 1.25, armR: [0.05, -0.06], head: [lerp(0.5, 0.0, lookUp), lerp(-0.3, 0, lookUp)], eyes: 0.9}}
            leftHand={<Watch />}
          />
        </>
      )}
    </group>
  );
};
