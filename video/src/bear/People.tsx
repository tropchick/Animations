import React from 'react';
import * as THREE from 'three';
import {Ball, Cone, Cyl, G, Limb, Pill, RBox, Ring, mat} from './kit';
import {Expr, Face, FaceStyle} from './face';
import {Backpack} from './Bear';
import type {V3} from './cues';

// Soft cartoon people: big heads, puffy clothes, expressive faces.
// Origin at the ground between the feet, facing +z. Аня is about 1.65 m with her hat.

export type Outfit = {
  skin: string;
  hair: string;
  hairStyle: 'pony' | 'bob' | 'short' | 'long' | 'bun';
  top: string; // jacket / cardigan / hoodie / suit
  topStyle: 'puffer' | 'cardigan' | 'hoodie' | 'suit' | 'coat';
  legs: string;
  legStyle: 'pants' | 'skirt' | 'jeans';
  shoes: string;
  hat?: string; // knit beanie / headband
  glasses?: boolean;
  beard?: string;
  iris?: string;
  lash?: boolean;
  shirt?: string;
  tie?: string;
  backpack?: boolean;
  scale?: number;
};

export const ANYA: Outfit = {
  skin: '#f4c7a6',
  hair: '#8a3b1c',
  hairStyle: 'pony',
  top: '#f2b42e',
  topStyle: 'puffer',
  legs: '#5b5a37',
  legStyle: 'pants',
  shoes: '#7a4a2a',
  hat: '#b8322d',
  iris: '#6b3a1a',
  lash: true,
  backpack: true,
};
export const MOM: Outfit = {
  skin: '#f0c2a0',
  hair: '#6e2a1e',
  hairStyle: 'bob',
  top: '#7c1f2b',
  topStyle: 'cardigan',
  legs: '#6c6a6a',
  legStyle: 'skirt',
  shoes: '#2a2224',
  glasses: true,
  iris: '#4a3020',
  lash: true,
  shirt: '#f3ead8',
};
export const HOST: Outfit = {
  skin: '#e9b48e',
  hair: '#2e2018',
  hairStyle: 'short',
  top: '#30323a',
  topStyle: 'hoodie',
  legs: '#2f4466',
  legStyle: 'jeans',
  shoes: '#f2f2f2',
  beard: '#2e2018',
  iris: '#3a2416',
};
export const MANAGER: Outfit = {
  skin: '#f0c4a2',
  hair: '#3a2a20',
  hairStyle: 'short',
  top: '#22304f',
  topStyle: 'suit',
  legs: '#22304f',
  legStyle: 'pants',
  shoes: '#1a1416',
  glasses: true,
  iris: '#2a3a50',
  shirt: '#f4f6fa',
  tie: '#c43b3b',
};

// crowd girls: a few looks mixed by index
const GIRL_HAIR = ['#e8c372', '#1f1714', '#6a3a1e', '#e889b0', '#a54a22', '#3a2618', '#f0dca0'];
const GIRL_TOP = ['#ff8fb1', '#7fd6c2', '#9b7bd8', '#f4f1ea', '#5aa0e6', '#ff9f43', '#e85d75', '#c7e46b'];
const GIRL_HATS = [undefined, '#e14b6a', undefined, '#4a7bd0', undefined, '#f0b030', undefined];
export const girl = (i: number): Outfit => ({
  skin: ['#f4c7a6', '#e6b08a', '#f7d2b6', '#d89e78', '#f2c09c'][i % 5],
  hair: GIRL_HAIR[i % GIRL_HAIR.length],
  hairStyle: (['long', 'pony', 'bun', 'long', 'bob'] as const)[i % 5],
  top: GIRL_TOP[(i * 3) % GIRL_TOP.length],
  topStyle: i % 3 === 0 ? 'coat' : 'puffer',
  legs: ['#2f4466', '#3a3a40', '#6a5a48', '#f0e8dc'][i % 4],
  legStyle: i % 4 === 2 ? 'skirt' : 'jeans',
  shoes: ['#f2f2f2', '#2a2224', '#8a5a3a'][i % 3],
  hat: GIRL_HATS[i % GIRL_HATS.length],
  iris: ['#6b3a1a', '#3a5a2a', '#2a4a6a', '#4a3020'][i % 4],
  lash: true,
});

export type HumanPose = {
  bob?: number;
  lean?: number;
  twist?: number;
  tilt?: number;
  head?: V3; // pitch (down +), yaw, roll
  armL?: [number, number, number?]; // pitch (forward/up −), roll (out +), yaw
  armR?: [number, number, number?];
  elbowL?: number; // bend forward (−)
  elbowR?: number;
  legL?: number; // hip pitch (forward −)
  legR?: number;
  kneeL?: number; // knee bend (back +)
  kneeR?: number;
  sit?: number; // 0 .. 1: hips down to a seat at 0.45 m, thighs forward
  face?: Expr;
  hairSwing?: number; // ponytail swing (rad)
  wind?: number; // hair blown back 0..1
};

const CLOTH = (c: string) => ({rim: '#ffffff', rimK: 0.12, rimPow: 2.6, rough: 0.85});

export const faceStyle = (o: Outfit, R: number): FaceStyle => ({
  R,
  skin: o.skin,
  eyeR: R * 0.27,
  spread: 0.36,
  eyeUp: -0.04,
  iris: o.iris ?? '#5a3a20',
  lash: o.lash ? '#2a1a14' : undefined,
  brow: o.hairStyle === 'short' && !o.beard ? o.hair : o.beard ?? o.hair,
  browLen: R * 0.34,
  browR: R * 0.045,
  mouthW: R * 0.42,
  mouthDown: 0.56,
  lip: '#8a3a34',
  nose: {color: o.skin, r: [R * 0.085, R * 0.07, R * 0.08], up: -0.27},
  embed: 0.36,
  irisK: 0.62,
  blush: '#ff8a80',
});

export const Hair: React.FC<{o: Outfit; R: number; p: HumanPose}> = ({o, R, p}) => {
  const c = o.hair;
  const look = {rim: '#ffd8b0', rimK: 0.25, rough: 0.7};
  const swing = p.hairSwing ?? 0;
  const wind = p.wind ?? 0;
  const style = o.hairStyle;
  return (
    <group>
      {/* the hair shell sits a little back so the face pokes out of it */}
      <Ball position={[0, R * 0.05, -R * 0.12]} scale={[R * 1.08, R * 1.07, R * 1.06]} color={c} look={look} />
      {/* fringe */}
      {style !== 'short'
        ? [-1, 0, 1].map((k) => (
            <Ball key={k} position={[R * 0.36 * k, R * 0.62, R * 0.62]} rotation={[0.4, 0, -0.35 * k]} scale={[R * 0.36, R * 0.24, R * 0.2]} color={c} look={look} />
          ))
        : [-1, 0, 1].map((k) => (
            <Ball key={k} position={[R * 0.3 * k, R * 0.78, R * 0.42]} rotation={[0.6, 0, -0.3 * k]} scale={[R * 0.34, R * 0.2, R * 0.24]} color={c} look={look} />
          ))}
      {style === 'pony' || style === 'long' || style === 'bun'
        ? ([1, -1] as const).map((s2) => (
            <Ball key={'lock' + s2} position={[R * 0.8 * s2, -R * 0.25, R * 0.38]} rotation={[0.15, 0, 0.12 * s2]} scale={[R * 0.17, R * 0.5, R * 0.2]} color={c} look={look} />
          ))
        : null}
      {style === 'pony' ? (
        <group position={[0, R * 0.55, -R * 0.95]} rotation={[0.5 + wind * 0.9 + swing * 0.2, swing, 0]}>
          <Ring rotation={[Math.PI / 2, 0, 0]} r={R * 0.14} tube={R * 0.05} color="#d23b3b" />
          <Ball position={[0, -R * 0.35, -R * 0.12]} scale={[R * 0.26, R * 0.42, R * 0.24]} color={c} look={look} />
          <Ball position={[0, -R * 0.8, -R * 0.18]} scale={[R * 0.22, R * 0.4, R * 0.2]} color={c} look={look} />
          <Ball position={[0, -R * 1.15, -R * 0.14]} rotation={[0.3, 0, 0]} scale={[R * 0.14, R * 0.28, R * 0.13]} color={c} look={look} />
        </group>
      ) : null}
      {style === 'bob' ? (
        <>
          <Ball position={[0, -R * 0.25, -R * 0.1]} scale={[R * 1.16, R * 0.75, R * 1.08]} color={c} look={look} />
          {([1, -1] as const).map((s) => (
            <Ball key={s} position={[R * 0.82 * s, -R * 0.45, R * 0.15]} scale={[R * 0.3, R * 0.42, R * 0.4]} color={c} look={look} />
          ))}
        </>
      ) : null}
      {style === 'long' ? (
        <group rotation={[wind * 0.5, 0, 0]}>
          <Ball position={[0, -R * 0.75, -R * 0.45]} scale={[R * 1.0, R * 1.2, R * 0.6]} color={c} look={look} />
          {([1, -1] as const).map((s) => (
            <Ball key={s} position={[R * 0.78 * s, -R * 0.8, -R * 0.05]} scale={[R * 0.3, R * 0.85, R * 0.35]} color={c} look={look} />
          ))}
        </group>
      ) : null}
      {style === 'bun' ? <Ball position={[0, R * 1.0, -R * 0.35]} scale={R * 0.42} color={c} look={look} /> : null}
      {o.hat ? (
        <group position={[0, R * 0.42, -R * 0.2]} rotation={[-0.55, 0, 0]}>
          <mesh scale={[R * 1.1, R * 0.82, R * 1.1]} geometry={G.hemi(32)} material={mat(o.hat, {rim: '#ffb0a0', rimK: 0.3, rough: 0.95})} castShadow />
          <Ring rotation={[Math.PI / 2, 0, 0]} r={R * 1.06} tube={R * 0.12} color={o.hat} look={{rim: '#ffb0a0', rimK: 0.25, rough: 0.95}} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
            <Pill
              key={k}
              position={[Math.sin((k / 8) * Math.PI * 2) * R * 1.15, R * 0.0, Math.cos((k / 8) * Math.PI * 2) * R * 1.15]}
              r={R * 0.035}
              len={R * 0.12}
              color={o.hat!}
              look={{rough: 0.95}}
              shadow={false}
            />
          ))}
        </group>
      ) : null}
    </group>
  );
};

const Glasses: React.FC<{R: number}> = ({R}) => (
  <group position={[0, R * 0.04, R * 0.93]}>
    {([1, -1] as const).map((s) => (
      <group key={s} position={[R * 0.36 * s, 0, 0]} rotation={[0, 0.3 * s, 0]}>
        <Ring r={R * 0.24} tube={R * 0.035} color="#2a1c18" look={{rough: 0.3}} shadow={false} />
        <mesh scale={R * 0.24} geometry={G.circle(24)} material={mat('#dfefff', {basic: true, opacity: 0.18})} />
      </group>
    ))}
    <Pill rotation={[0, 0, Math.PI / 2]} position={[0, R * 0.06, R * 0.03]} r={R * 0.025} len={R * 0.16} color="#2a1c18" shadow={false} />
  </group>
);

export const Human: React.FC<{
  o: Outfit;
  position?: V3;
  rotation?: number;
  pose?: HumanPose;
  handL?: React.ReactNode;
  handR?: React.ReactNode;
  head?: React.ReactNode;
  scale?: number;
  noFace?: boolean;
  noHead?: boolean; // for point-of-view shots: the camera sits where her head is
}> = ({o, position = [0, 0, 0], rotation = 0, pose = {}, handL, handR, head, scale = 1, noFace, noHead}) => {
  const R = 0.16;
  const sit = pose.sit ?? 0;
  const hipH = 0.655 - (0.655 - 0.47) * sit;
  const top = o.top;
  const clothL = CLOTH(top);
  const puffy = o.topStyle === 'puffer';
  const hp = pose.head ?? [0, 0, 0];
  const legP = (side: 1 | -1) => ((side === 1 ? pose.legR : pose.legL) ?? 0) - 1.45 * sit;
  const kneeB = (side: 1 | -1) => ((side === 1 ? pose.kneeR : pose.kneeL) ?? 0) + 1.45 * sit;
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={(o.scale ?? 1) * scale}>
      <group position={[0, hipH + (pose.bob ?? 0), 0]}>
        {/* legs */}
        {([1, -1] as const).map((side) => (
          <Limb key={side} position={[0.09 * side, 0, 0]} rotation={[legP(side), 0, 0.02 * side]} r={o.legStyle === 'skirt' ? 0.05 : 0.082} len={0.28} color={o.legStyle === 'skirt' ? o.skin : o.legs} look={{rough: 0.85}}>
            <Limb rotation={[kneeB(side), 0, 0]} r={o.legStyle === 'skirt' ? 0.045 : 0.072} len={0.27} color={o.legStyle === 'skirt' ? o.skin : o.legs} look={{rough: 0.85}}>
              <group rotation={[-(legP(side) + kneeB(side)) * (1 - sit * 0.6), 0, 0]}>
                <RBox position={[0, -0.04, 0.045]} size={[0.12, 0.11, 0.23]} r={0.05} color={o.shoes} look={{rough: 0.6}} />
                <RBox position={[0, -0.093, 0.045]} size={[0.125, 0.025, 0.235]} r={0.01} color={o.shoes === '#f2f2f2' ? '#d8d8d8' : '#3a2a20'} />
              </group>
            </Limb>
          </Limb>
        ))}
        {/* hips */}
        {o.legStyle === 'skirt' ? (
          <Cyl position={[0, -0.12, 0]} rt={0.15} rb={0.23} h={0.42} color={o.legs} look={{rough: 0.9}} />
        ) : (
          <Ball position={[0, 0.02, 0]} scale={[0.17, 0.12, 0.13]} color={o.legs} look={{rough: 0.85}} />
        )}
        {/* torso */}
        <group rotation={[pose.lean ?? 0, pose.twist ?? 0, pose.tilt ?? 0]}>
          <Pill position={[0, 0.27, 0]} r={puffy ? 0.175 : 0.155} len={0.24} color={top} look={clothL} seg={24} />
          {puffy
            ? [0.17, 0.3, 0.43].map((y, k) => (
                <Ring key={k} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} r={0.158 - (k === 2 ? 0.012 : 0)} tube={0.024} color={top} look={clothL} />
              ))
            : null}
          {o.topStyle === 'coat' ? <Cyl position={[0, 0.02, 0]} rt={0.17} rb={0.22} h={0.3} color={top} look={clothL} /> : null}
          {o.topStyle === 'cardigan' ? (
            <>
              <RBox position={[0, 0.35, 0.135]} size={[0.11, 0.2, 0.03]} r={0.012} color={o.shirt ?? '#f3ead8'} />
              {[0.16, 0.24, 0.32].map((y) => (
                <Ball key={y} position={[0.045, y, 0.155]} scale={0.012} color="#e9d9a8" shadow={false} />
              ))}
            </>
          ) : null}
          {o.topStyle === 'suit' ? (
            <>
              <RBox position={[0, 0.36, 0.13]} size={[0.13, 0.2, 0.04]} r={0.015} color={o.shirt ?? '#ffffff'} />
              <RBox position={[0, 0.33, 0.152]} rotation={[0, 0, 0]} size={[0.04, 0.17, 0.012]} r={0.005} color={o.tie ?? '#c43b3b'} />
            </>
          ) : null}
          {o.topStyle === 'hoodie' ? (
            <>
              <Ring position={[0, 0.47, -0.04]} rotation={[Math.PI / 2 - 0.5, 0, 0]} r={0.12} tube={0.05} color={top} look={clothL} />
              {([1, -1] as const).map((s) => (
                <Pill key={s} position={[0.035 * s, 0.32, 0.15]} r={0.008} len={0.1} color="#e8e8e8" shadow={false} />
              ))}
              <RBox position={[0, 0.12, 0.13]} size={[0.2, 0.1, 0.04]} r={0.02} color="#2a2c33" />
            </>
          ) : null}
          {/* collar */}
          {puffy ? <Ring position={[0, 0.47, 0]} rotation={[Math.PI / 2, 0, 0]} r={0.085} tube={0.045} color={top} look={clothL} /> : null}
          {o.backpack ? (
            <group position={[0, 0.3, -0.22]}>
              <Backpack />
              {([1, -1] as const).map((s) => (
                <Ring key={s} position={[0.1 * s, 0.1, 0.12]} rotation={[0, Math.PI / 2, 0]} scale={[1, 1.4, 1]} r={0.12} tube={0.018} arc={Math.PI} color="#c9581e" />
              ))}
            </group>
          ) : null}
          {/* arms */}
          {([1, -1] as const).map((side) => {
            const a = (side === 1 ? pose.armR : pose.armL) ?? [0.05, 0.1, 0];
            const el = (side === 1 ? pose.elbowR : pose.elbowL) ?? -0.15;
            const sleeve = puffy ? 0.07 : 0.058;
            return (
              <Limb key={side} position={[0.2 * side, 0.43, 0]} rotation={[a[0], (a[2] ?? 0) * side, a[1] * side]} r={sleeve} len={0.2} color={top} look={clothL}>
                <Limb rotation={[el, 0, 0]} r={sleeve * 0.9} len={0.18} color={top} look={clothL}>
                  <group position={[0, -0.03, 0]}>
                    <Ball scale={[0.048, 0.055, 0.042]} color={o.skin} />
                    <Ball position={[0.03 * side * -1, -0.005, 0.03]} scale={[0.018, 0.03, 0.018]} color={o.skin} shadow={false} />
                    <group position={[0, -0.04, 0.0]}>{side === 1 ? handR : handL}</group>
                  </group>
                </Limb>
              </Limb>
            );
          })}
          {/* neck + head */}
          <Cyl position={[0, 0.5, 0]} rt={0.05} rb={0.055} h={0.12} color={o.skin} />
          <group position={[0, 0.53, 0]} rotation={[hp[0], hp[1], hp[2], 'YXZ']} visible={!noHead}>
            <group position={[0, R * 0.95, 0.01]}>
              <Ball scale={R} color={o.skin} look={{rough: 0.65}} seg={40} />
              {/* ears */}
              {([1, -1] as const).map((s) => (
                <Ball key={s} position={[R * 0.98 * s, -R * 0.05, -R * 0.05]} scale={[R * 0.13, R * 0.2, R * 0.1]} color={o.skin} />
              ))}
              {o.beard ? (
                <Ball position={[0, -R * 0.4, R * 0.18]} scale={[R * 0.92, R * 0.68, R * 0.86]} color={o.beard} look={{rough: 0.95, rim: '#c09070', rimK: 0.2}} />
              ) : null}
              {noFace ? null : <Face s={faceStyle(o, R)} e={pose.face ?? {}} />}
              <Hair o={o} R={R} p={pose} />
              {o.glasses ? <Glasses R={R} /> : null}
              {head}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

// a walk cycle: phase in steps (1 = one full stride)
export const walkPose = (ph: number, amp = 1): HumanPose => {
  const s = Math.sin(ph * Math.PI * 2);
  const c = Math.cos(ph * Math.PI * 2);
  return {
    legL: 0.45 * s * amp,
    legR: -0.45 * s * amp,
    kneeL: Math.max(0, -c) * 0.7 * amp + 0.08,
    kneeR: Math.max(0, c) * 0.7 * amp + 0.08,
    armL: [-0.35 * s * amp, 0.12, 0],
    armR: [0.35 * s * amp, 0.12, 0],
    elbowL: -0.35,
    elbowR: -0.35,
    bob: Math.abs(c) * 0.025 * amp,
    tilt: 0.03 * s * amp,
    hairSwing: 0.25 * s * amp,
  };
};

export {THREE};
