import React from 'react';
import {Box, Glow, Mat} from '../slime/parts';
import {V3} from './cues';

// Small things people hold: the courier's phone, the paper bag with the shawarma, the cup of garlic sauce.

const PHONE_BODY: Mat = {color: '#16181b', rough: 0.4, metal: 0.3};

// a phone, screen on its +z face; the screen glows teal (the delivery app)
export const Phone: React.FC<{position?: V3; rotation?: V3; glow?: number}> = ({position, rotation, glow = 1}) => (
  <group position={position} rotation={rotation}>
    <Box size={[0.075, 0.155, 0.01]} m={PHONE_BODY} />
    <Glow size={[0.066, 0.14, 0.002]} position={[0, 0, 0.0068]} color={glow > 0.5 ? '#bff3ec' : '#2a3a3c'} />
    {glow > 0.5 ? <Glow size={[0.056, 0.026, 0.002]} position={[0, -0.045, 0.0095]} color="#1fb3a5" /> : null}
  </group>
);

const KRAFT: Mat = {color: '#b4895a', rough: 0.9};
const KRAFT_DARK: Mat = {color: '#94704a', rough: 0.9};

// the order: a kraft paper bag, top folded over; hangs from the hand by its fold (origin at the top)
export const OrderBag: React.FC<{position?: V3; rotation?: V3}> = ({position, rotation}) => (
  <group position={position} rotation={rotation}>
    <Box size={[0.24, 0.26, 0.13]} position={[0, -0.17, 0]} m={KRAFT} />
    <Box size={[0.245, 0.05, 0.08]} position={[0, -0.02, 0]} m={KRAFT_DARK} />
    {/* a printed teal sticker with the order number */}
    <Box size={[0.08, 0.06, 0.004]} position={[0, -0.16, 0.067]} m={{color: '#1fb3a5', rough: 0.7}} shadow={false} />
  </group>
);

// a small round cup of garlic sauce with a white lid (origin at its bottom)
export const SauceCup: React.FC<{position?: V3; rotation?: V3; scale?: number}> = ({position, rotation, scale = 1}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh position={[0, 0.022, 0]} castShadow>
      <cylinderGeometry args={[0.033, 0.026, 0.044, 14]} />
      <meshStandardMaterial color="#f1eee4" roughness={0.5} flatShading />
    </mesh>
    <mesh position={[0, 0.047, 0]} castShadow>
      <cylinderGeometry args={[0.037, 0.037, 0.008, 14]} />
      <meshStandardMaterial color="#ffffff" roughness={0.4} flatShading />
    </mesh>
  </group>
);
