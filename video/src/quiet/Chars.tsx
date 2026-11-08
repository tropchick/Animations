import React from 'react';
import {Human, HumanPose, Outfit, walkPose} from '../bear/People';
import {Ball, Pill, RBox, Ring} from '../bear/kit';
import type {V3} from '../bear/cues';

// «Тихий этаж»: Артём the courier, Соня (12, deaf), the bitten man, and the dead.
// Same soft toy people as the bear video; the dead are greyed, slumped, with milky eyes.

export const ARTEM: Outfit = {
  skin: '#efc3a0',
  hair: '#3a2618',
  hairStyle: 'short',
  top: '#f2c230',
  topStyle: 'puffer',
  legs: '#2e3a52',
  legStyle: 'jeans',
  shoes: '#2a2224',
  iris: '#4a3020',
};

export const SONYA: Outfit = {
  skin: '#f4cdb0',
  hair: '#4a2a1a',
  hairStyle: 'long',
  top: '#3f7f8f', // a grown-up's parka, too big for her
  topStyle: 'coat',
  legs: '#5a4a6a',
  legStyle: 'jeans',
  shoes: '#c8c2b8',
  hat: '#c8574a',
  iris: '#5a3a20',
  lash: true,
  scale: 0.8,
};

export const STRANGER: Outfit = {
  skin: '#e2b896',
  hair: '#5a4a3a',
  hairStyle: 'short',
  top: '#5c5f66',
  topStyle: 'coat',
  legs: '#2f3036',
  legStyle: 'pants',
  shoes: '#1e1a1a',
  beard: '#5a4a3a',
  iris: '#3a2a1a',
};

// the dead: washed-out colours, grey-green skin, milky eyes
const DEAD_SKIN = ['#a7b39a', '#9faa94', '#b2b8a4', '#98a48e', '#aab1a0'];
const DEAD_TOP = ['#6a6f78', '#7a5a52', '#4f5a66', '#7d7a62', '#5f6a5a', '#8a6a6a', '#55606e', '#7a7d84'];
const DEAD_HAIR = ['#3a332c', '#5a5048', '#2a2622', '#7a6a58', '#4a443c'];
const DEAD_LEGS = ['#3a3d44', '#4a4038', '#2f3540', '#545048'];
export const dead = (i: number): Outfit => ({
  skin: DEAD_SKIN[i % DEAD_SKIN.length],
  hair: DEAD_HAIR[(i * 3) % DEAD_HAIR.length],
  hairStyle: (['short', 'bob', 'short', 'long', 'short', 'bun'] as const)[i % 6],
  top: DEAD_TOP[(i * 5) % DEAD_TOP.length],
  topStyle: (['coat', 'hoodie', 'puffer', 'cardigan', 'suit', 'coat'] as const)[i % 6],
  legs: DEAD_LEGS[i % DEAD_LEGS.length],
  legStyle: i % 7 === 3 ? 'skirt' : 'pants',
  shoes: ['#2a2224', '#4a3a30', '#3a3a3a'][i % 3],
  iris: '#c9d0c4',
  sclera: '#e4e8dc',
  noBlush: true,
  shirt: '#b8b4a8',
  tie: '#5a3a3a',
  scale: 0.94 + ((i * 37) % 11) * 0.012,
});

// a shop worker (apron colour) and a schoolkid (smaller, backpack-less) among the dead
export const deadShop = (i: number): Outfit => ({...dead(i), top: ['#4f7a5a', '#a05a3a', '#4a6a8a'][i % 3], topStyle: 'hoodie'});
export const deadKid = (i: number): Outfit => ({...dead(i + 2), scale: 0.72 + (i % 3) * 0.03, topStyle: i % 2 ? 'puffer' : 'hoodie', top: ['#5a6a8a', '#7a6a5a', '#6a5a7a'][i % 3]});
export const SCREAMER: Outfit = {...dead(4), skin: '#c4c8b8', hair: '#2a2622', hairStyle: 'long', top: '#4a4a52', topStyle: 'coat', scale: 1.06};

// the dead's blank face
export const deadFace = (v: number, seed = 0) => ({
  lid: 0.32 + 0.05 * Math.sin(v * 0.7 + seed),
  mouth: 0.12 + 0.06 * Math.sin(v * 0.9 + seed * 2),
  smile: -0.25,
  browIn: -0.05,
  look: [0, -0.05] as [number, number],
});

// standing still: slumped, arms hanging a little forward, head tilted
export const deadIdle = (v: number, seed = 0): HumanPose => {
  const sw = Math.sin(v * 0.8 + seed * 1.7);
  return {
    lean: 0.16 + 0.02 * sw,
    tilt: 0.05 * Math.sin(seed),
    head: [0.22, 0.12 * Math.sin(seed * 2.3), 0.22 * Math.sin(seed * 1.3 + 0.6) + 0.03 * sw],
    armL: [-0.25 - 0.03 * sw, 0.1, 0],
    armR: [-0.18 + 0.03 * sw, 0.08, 0],
    elbowL: -0.25,
    elbowR: -0.35,
    kneeL: 0.08,
    kneeR: 0.12,
    face: deadFace(v, seed),
  };
};

// the shuffle: short dragging steps, uneven arms
export const deadWalk = (ph: number, v: number, seed = 0, amp = 0.55): HumanPose => {
  const w = walkPose(ph, amp);
  const s = Math.sin(ph * Math.PI * 2);
  return {
    ...w,
    lean: 0.2,
    tilt: 0.08 * s,
    bob: (w.bob ?? 0) * 0.6,
    head: [0.25, 0.1 * Math.sin(seed * 2.3), 0.2 * Math.sin(seed * 1.3 + 0.6) + 0.06 * s],
    armL: [-0.45 + 0.1 * s, 0.12, 0],
    armR: [-0.25 - 0.08 * s, 0.1, 0],
    elbowL: -0.2,
    elbowR: -0.4,
    kneeL: (w.kneeL ?? 0) * 0.6 + 0.1,
    kneeR: (w.kneeR ?? 0) * 0.6 + 0.1,
    face: deadFace(v, seed),
  };
};

// Соня's hearing aid behind the right ear (a head child: head centre, radius 0.16)
export const HearingAid: React.FC = () => (
  <group position={[0.165, 0.0, -0.035]} rotation={[0.2, 0, 0]}>
    <Pill r={0.014} len={0.03} color="#e8cdb0" look={{rough: 0.4}} shadow={false} />
    <Ring position={[-0.008, 0.032, 0.01]} rotation={[0, Math.PI / 2, 0]} r={0.016} tube={0.004} arc={Math.PI} color="#e8cdb0" shadow={false} />
  </group>
);

// a small earbud with a wire (Артём listening to the radio)
export const Earbud: React.FC = () => (
  <group position={[-0.16, -0.01, 0.0]}>
    <Ball scale={0.014} color="#f2f2f2" shadow={false} />
    <Pill position={[0.0, -0.08, 0.02]} rotation={[0.15, 0, 0]} r={0.0025} len={0.15} color="#e8e8e8" shadow={false} />
  </group>
);

// the courier's parcel: brown box, red FRAGILE tape
export const Box: React.FC<{position?: V3; rotation?: V3; open?: number; scale?: number}> = ({position, rotation, open = 0, scale = 1}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <RBox size={[0.36, 0.24, 0.28]} r={0.012} color="#b88550" look={{rough: 0.9}} />
    {open < 0.05 ? (
      <>
        <RBox position={[0, 0.121, 0]} size={[0.07, 0.006, 0.285]} r={0.002} color="#c9a070" shadow={false} />
        <RBox position={[0, 0.02, 0.141]} size={[0.3, 0.06, 0.004]} r={0.002} color="#d33a2c" shadow={false} />
      </>
    ) : (
      ([1, -1] as const).map((s) => (
        <group key={s} position={[0, 0.12, 0.14 * s]} rotation={[s * open * 1.9, 0, 0]}>
          <RBox position={[0, 0, -0.07 * s]} size={[0.355, 0.006, 0.14]} r={0.002} color="#b88550" />
        </group>
      ))
    )}
  </group>
);

export {Human, walkPose};
export type {HumanPose, Outfit};
