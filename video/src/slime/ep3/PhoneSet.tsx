import React from 'react';
import {random} from 'remotion';
import {ramp} from '../cues';
import {GloveHand} from '../Gleb';
import {Phone} from './Props3';

// Close-up of the phone in Gleb's hand at 22:00, dark street lights far behind.
export const PHONE_X = 900;

export const PhoneSet: React.FC<{v: number; noNet: number; noInternet: number}> = ({v, noNet, noInternet}) => (
  <group position={[PHONE_X, 0, 0]}>
    <group rotation={[0.08, -0.12, 0.05]}>
      <Phone position={[0, 0, 0]} noNet={v >= noNet} cross={ramp(v, noInternet, noInternet + 0.35)} v={v} />
      <GloveHand position={[0.004, -0.115, -0.028]} rotation={[0, 0, Math.PI + 0.08]} curl={0.9} spread={0.1} />
    </group>
    {Array.from({length: 12}).map((_, i) => (
      <mesh key={i} position={[(random(`pl-x-${i}`) - 0.5) * 9, (random(`pl-y-${i}`) - 0.4) * 6, -8 - random(`pl-z-${i}`) * 10]}>
        <sphereGeometry args={[0.12 + random(`pl-r-${i}`) * 0.1, 8, 6]} />
        <meshBasicMaterial color={random(`pl-c-${i}`) < 0.6 ? '#e9dcbb' : '#b9cde0'} toneMapped={false} />
      </mesh>
    ))}
    <pointLight position={[0.3, 0.4, 0.5]} color="#8ea2b4" intensity={0.08} distance={3} decay={2} />
    <hemisphereLight color="#2c3746" groundColor="#07090c" intensity={0.15} />
  </group>
);
