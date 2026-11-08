import React from 'react';
import {Ball, Cone, Cyl, G, Limb, Pill, RBox, Ring, mat} from './kit';
import {Expr, Face, FaceStyle} from './face';
import type {V3} from './cues';

// The star: a huge round brown bear, soft fur (rim light), tan belly and muzzle, big glossy eyes.
// Origin at the ground between his feet, facing +z. Standing he is about 2.5 m tall.

export const FUR = '#7a4826';
export const FUR_DARK = '#5e3519';
export const TAN = '#d8a66c';
const FURL = {rim: '#f0c48c', rimPow: 2.2, rimK: 0.55, rough: 0.92};
const TANL = {rim: '#fff0d0', rimPow: 2.4, rimK: 0.35, rough: 0.9};

export type BearPose = {
  sit?: number; // 0 standing .. 1 sitting on his bottom, legs forward
  lean?: number; // torso pitch forward (rad)
  tilt?: number; // torso roll (rad)
  twist?: number; // torso yaw (rad)
  head?: V3; // pitch (down +), yaw, roll
  armL?: [number, number]; // shoulder pitch (forward/up −), roll (out +)
  armR?: [number, number];
  elbowL?: number; // bend (forward −)
  elbowR?: number;
  legL?: number; // hip pitch (forward −)
  legR?: number;
  jaw?: number; // 0 shut .. 1 roar
  face?: Expr;
  breathe?: number; // time for the idle breathing
  ears?: number; // ear wiggle
};

const BEAR_FACE: FaceStyle = {
  R: 0.44,
  skin: FUR,
  eyeR: 0.092,
  spread: 0.3,
  eyeUp: 0.17,
  iris: '#4a2812',
  brow: '#3a2010',
  browLen: 0.11,
  browR: 0.019,
  browArc: 1.1,
  mouthW: 0.1,
  mouthDown: 0.4,
  embed: 0.3,
  irisK: 0.56,
};

export const Bear: React.FC<{
  position?: V3;
  rotation?: number;
  pose?: BearPose;
  scale?: number;
  handL?: React.ReactNode;
  handR?: React.ReactNode;
  head?: React.ReactNode; // hats, glasses, headphones (head space: centre of the head sphere)
  body?: React.ReactNode; // chain, backpack (torso space)
}> = ({position = [0, 0, 0], rotation = 0, pose = {}, scale = 1, handL, handR, head, body}) => {
  const sit = pose.sit ?? 0;
  const br = Math.sin((pose.breathe ?? 0) * 2.4) * 0.012;
  const hipY = 0.62 - 0.27 * sit;
  const legPitch = (side: 1 | -1) => (side === 1 ? pose.legR : pose.legL) ?? -1.42 * sit;
  const jaw = Math.max(0, Math.min(1.2, pose.jaw ?? 0));
  const hp = pose.head ?? [0, 0, 0];
  const e: Expr = {...pose.face};
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <group position={[0, hipY, 0]} rotation={[-0.22 * sit, 0, 0]}>
        {/* legs */}
        {([1, -1] as const).map((side) => (
          <Limb key={side} position={[0.31 * side, 0.02, 0.04]} rotation={[legPitch(side), 0, 0.04 * side]} r={0.2} len={0.3} color={FUR} look={FURL}>
            <group rotation={[-legPitch(side) * (1 - sit) * 0.9, 0, 0]}>
              <Ball position={[0, -0.04, 0.09]} scale={[0.2, 0.12, 0.27]} color={FUR} look={FURL} />
              {/* sole and toe beans: they face the camera when he sits */}
              <Ball position={[0, -0.12, 0.1]} scale={[0.14, 0.035, 0.19]} color={TAN} look={TANL} />
              {[-1, 0, 1].map((k) => (
                <Ball key={k} position={[0.075 * k, -0.11, 0.28 - Math.abs(k) * 0.03]} scale={[0.045, 0.03, 0.04]} color={TAN} look={TANL} shadow={false} />
              ))}
            </group>
          </Limb>
        ))}
        {/* torso */}
        <group rotation={[pose.lean ?? 0, pose.twist ?? 0, pose.tilt ?? 0]}>
          <Ball position={[0, 0.52, 0]} scale={[0.74 + br, 0.84 + br * 0.5, 0.64 + br]} color={FUR} look={FURL} seg={40} />
          <Ball position={[0, 0.42, 0.37]} scale={[0.55 + br, 0.6, 0.33 + br]} color={TAN} look={TANL} seg={36} />
          <Ball position={[0, 0.16, -0.6]} scale={0.12} color={FUR} look={FURL} />
          {body}
          {/* arms */}
          {([1, -1] as const).map((side) => {
            const a = (side === 1 ? pose.armR : pose.armL) ?? [0.05, 0.12];
            const el = (side === 1 ? pose.elbowR : pose.elbowL) ?? -0.2;
            return (
              <Limb key={side} position={[0.6 * side, 0.98, 0.05]} rotation={[a[0], 0, a[1] * side]} r={0.17} len={0.36} color={FUR} look={FURL}>
                <Limb rotation={[el, 0, 0]} r={0.155} len={0.26} color={FUR} look={FURL}>
                  <group position={[0, -0.06, 0]}>
                    <Ball scale={[0.19, 0.18, 0.17]} color={FUR} look={FURL} />
                    {/* palm pad and claws, on the palm side (+z when the arm hangs) */}
                    <Ball position={[0, -0.04, 0.12]} scale={[0.11, 0.1, 0.06]} color={TAN} look={TANL} shadow={false} />
                    {[-1, 0, 1].map((k) => (
                      <Cone key={k} position={[0.06 * k, -0.17, 0.07]} rotation={[Math.PI + 0.5, 0, 0]} r={0.022} h={0.06} color="#f3e6cf" shadow={false} />
                    ))}
                    <group position={[0, -0.14, 0.05]}>{side === 1 ? handR : handL}</group>
                  </group>
                </Limb>
              </Limb>
            );
          })}
          {/* head */}
          <group position={[0, 1.2, 0.06]} rotation={[hp[0], hp[1], hp[2], 'YXZ']}>
            <group position={[0, 0.27, 0.04]}>
              <Ball scale={0.44} color={FUR} look={FURL} seg={40} />
              {/* cheek fluff */}
              {([1, -1] as const).map((side) => (
                <Ball key={side} position={[0.3 * side, -0.14, 0.1]} scale={[0.14, 0.13, 0.13]} color={FUR} look={FURL} />
              ))}
              {/* ears */}
              {([1, -1] as const).map((side) => (
                <group key={side} position={[0.3 * side, 0.31, -0.04]} rotation={[0, 0, (pose.ears ?? 0) * 0.3 * side - 0.25 * side]}>
                  <Ball scale={[0.14, 0.14, 0.08]} color={FUR} look={FURL} />
                  <Ball position={[0, -0.005, 0.05]} scale={[0.085, 0.085, 0.04]} color={TAN} look={TANL} shadow={false} />
                </group>
              ))}
              {/* muzzle, nose */}
              <Ball position={[0, -0.1, 0.33]} scale={[0.2, 0.135, 0.19]} color={TAN} look={TANL} />
              <Ball position={[0, -0.025, 0.515]} scale={[0.08, 0.056, 0.058]} color="#1d120d" look={{rough: 0.25}} />
              <Ball position={[0.025, -0.002, 0.565]} scale={[0.021, 0.013, 0.012]} color="#ffffff" look={{basic: true}} shadow={false} />
              {/* the closed mouth: a little ω on the muzzle */}
              {jaw < 0.3 ? (
                <group position={[0, -0.1, 0.33]} scale={[0.2, 0.135, 0.19]}>
                  <group position={[0, -0.28, 0.955]} rotation={[0.3, 0, 0]}>
                    <Pill position={[0, 0.12, 0]} r={0.035} len={0.16} color="#2a1610" shadow={false} />
                    {([1, -1] as const).map((s2) => (
                      <group key={s2} position={[0.16 * s2, 0.06, 0]}>
                        <mesh rotation={[0, 0, -Math.PI / 2 - 0.95]} geometry={G.torus(0.17, 0.035, 1.9, 16)} material={mat('#2a1610')} />
                      </group>
                    ))}
                  </group>
                </group>
              ) : null}
              {/* the lower jaw swings down; the dark mouth swings half as far so the gap is always filled */}
              <group position={[0, -0.15, 0.22]} rotation={[0.3 * jaw, 0, 0]}>
                <Ball position={[0, -0.03, 0.1]} scale={[0.15, 0.075, 0.15]} color="#4a1218" look={{rough: 0.9}} shadow={false} />
              </group>
              {jaw > 0.25
                ? ([1, -1] as const).map((side) => (
                    <Cone key={side} position={[0.075 * side, -0.215, 0.44]} rotation={[Math.PI - 0.2, 0, 0]} r={0.02} h={0.055} color="#fbf6ea" shadow={false} />
                  ))
                : null}
              <group position={[0, -0.15, 0.22]} rotation={[0.62 * jaw, 0, (e.chew ?? 0) * 0.08]}>
                <Ball position={[0, -0.035, 0.12]} scale={[0.155, 0.072, 0.155]} color={TAN} look={TANL} />
                <Ball position={[0, 0.005, 0.12]} scale={[0.1, 0.04, 0.12]} color="#e06a74" look={{rough: 0.5}} shadow={false} />
              </group>
              <Face s={BEAR_FACE} e={e} noMouth />
              {head}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- bear accessories

export const Sunglasses: React.FC = () => (
  <group position={[0, 0.1, 0.43]} rotation={[-0.12, 0, 0]}>
    {([1, -1] as const).map((s) => (
      <RBox key={s} position={[0.155 * s, 0, 0]} size={[0.2, 0.13, 0.04]} r={0.035} color="#101014" look={{rough: 0.15, metal: 0.3}} />
    ))}
    <RBox position={[0, 0.03, 0]} size={[0.12, 0.025, 0.03]} r={0.01} color="#c9a227" look={{rough: 0.3, metal: 0.8}} />
    {([1, -1] as const).map((s) => (
      <RBox key={'a' + s} position={[0.27 * s, 0.02, -0.14]} rotation={[0, -0.6 * s, 0]} size={[0.025, 0.025, 0.26]} r={0.01} color="#101014" />
    ))}
    {([1, -1] as const).map((s) => (
      <Ball key={'g' + s} position={[0.13 * s, 0.03, 0.023]} scale={[0.05, 0.02, 0.005]} color="#ffffff" look={{basic: true, opacity: 0.5}} shadow={false} />
    ))}
  </group>
);

export const GoldChain: React.FC = () => (
  <group position={[0, 1.05, 0.2]} rotation={[1.15, 0, 0]}>
    <Ring r={0.4} tube={0.028} color="#e2b22b" look={{rough: 0.25, metal: 0.9}} />
    <group position={[0, -0.41, 0.0]} rotation={[-1.15, 0, 0]}>
      <Cyl rotation={[Math.PI / 2, 0, 0]} rt={0.11} rb={0.11} h={0.03} color="#f0c23a" look={{rough: 0.2, metal: 0.9}} />
      <Ball position={[0, 0, 0.02]} scale={[0.05, 0.05, 0.012]} color="#8a5a10" look={{rough: 0.4, metal: 0.6}} shadow={false} />
    </group>
  </group>
);

export const Headphones: React.FC<{color?: string}> = ({color = '#1b1c22'}) => (
  <group>
    {/* the band runs ear to ear over the crown, tipped back behind the ears */}
    <group rotation={[-0.55, 0, 0]}>
      <Ring position={[0, 0.02, 0]} r={0.47} tube={0.035} arc={Math.PI} color={color} look={{rough: 0.4}} />
    </group>
    {([1, -1] as const).map((s) => (
      <group key={s} position={[0.45 * s, 0.0, 0.0]} rotation={[0, 0, (Math.PI / 2) * s]}>
        <Cyl rt={0.15} rb={0.15} h={0.12} color={color} look={{rough: 0.4}} />
        <Cyl position={[0, -0.065 * s * 0, 0]} rt={0.11} rb={0.11} h={0.13} color="#3b3d48" look={{rough: 0.8}} />
      </group>
    ))}
  </group>
);

export const HardHat: React.FC = () => (
  <group position={[0, 0.3, 0.0]} rotation={[-0.1, 0, 0.06]}>
    <mesh scale={[0.4, 0.3, 0.4]}>
      <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#f5c02a" roughness={0.35} />
    </mesh>
    <Cyl position={[0, 0.0, 0.06]} rt={0.47} rb={0.47} h={0.03} color="#f5c02a" look={{rough: 0.35}} />
    <Pill position={[0, 0.27, 0]} rotation={[Math.PI / 2, 0, 0]} r={0.03} len={0.5} color="#f8cf45" look={{rough: 0.35}} />
  </group>
);

export const Backpack: React.FC<{big?: boolean; color?: string}> = ({big, color = '#e8742c'}) => {
  const k = big ? 1.6 : 1;
  return (
    <group>
      <RBox size={[0.32 * k, 0.4 * k, 0.17 * k]} r={0.06 * k} color={color} look={{rim: '#ffd0a0', rimK: 0.2}} />
      <RBox position={[0, -0.08 * k, 0.1 * k]} size={[0.24 * k, 0.16 * k, 0.06 * k]} r={0.03 * k} color="#d25f22" />
      <Ball position={[0, 0.2 * k, 0.0]} scale={[0.15 * k, 0.05 * k, 0.08 * k]} color="#c9581e" />
      {big
        ? [-1, 0, 1].map((i) => (
            <group key={i} position={[0.1 * i, 0.32 * k, 0.0]} rotation={[0.2 * i, 0, 0.3 * i]}>
              <RBox size={[0.07, 0.2, 0.025]} r={0.01} color="#f2c641" />
              <RBox position={[0, 0.02, 0.014]} size={[0.06, 0.06, 0.004]} r={0.002} color="#7a3e12" shadow={false} />
            </group>
          ))
        : null}
    </group>
  );
};

export const bearMat = () => mat(FUR, FURL);
