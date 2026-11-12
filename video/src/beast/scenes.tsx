import React from 'react';
import {Scene, blink, ease, ease5, mv, orbit} from '../bear/common';
import {Expr} from '../bear/face';
import {Human, HumanPose, MOM} from '../bear/People';
import {InteriorLights} from '../cs2/scenes1';
import {Confetti} from '../cs2/Sets';
import {CashSofa, Podium} from '../hl3gta/Sets';
import type {View} from '../slime/camera';
import {BOUGHT, ENV, GLOBE, GROW_B, GROW_G, MIL, MOTH, RULER, THRONE, V3, WIN, lerp, lerp3, shotEnd, shotStart} from './cues';
import {
  BEAST, BillStream, Block, Cloud, CoinColumn, Crowd, Cubicle, Envelope, GABE, GABE27, GLOBE_R, Globe, GoldRoom, Ground, Lounger, Moth, Screens, Sea, Shipyard, Sky, Stage, Stars, Strip, VideoCam, Wallet, YACHT_DECK, Yacht, crowdRows,
} from './Sets';

const S = shotStart;
const E = shotEnd;

// ---------------------------------------------------------------- faces and poses

const HAPPY: Expr = {happy: 0.7, smile: 0.85, mouth: 0.25, brow: 0.05};
const PROUD: Expr = {happy: 0.5, smile: 0.6, brow: 0.08};
const WOW: Expr = {wide: 1, o: 0.8, mouth: 0.55, brow: 0.12};
const SAD: Expr = {smile: -0.6, browIn: 0.45, tilt: -0.35, look: [0, -0.25]};
const SMUG: Expr = {happy: 0.35, smile: 0.5, lid: 0.3, brow: -0.02};
const face = (e: Expr, v: number, seed: number): Expr => ({...e, lid: Math.max(e.lid ?? 0, blink(v, seed))});

const wave = (v: number, side: 'L' | 'R' = 'R', k = 1): HumanPose => {
  const s = Math.sin(v * 9) * 0.35 * k;
  return side === 'R' ? {armR: [-2.7 * k, 0.25 + s, 0], elbowR: -0.4} : {armL: [-2.7 * k, 0.25 + s, 0], elbowL: -0.4};
};
const armsUp = (k: number, v: number): HumanPose => ({armL: [-2.7 * k, 0.35 + 0.1 * Math.sin(v * 7), 0], armR: [-2.7 * k, 0.35 + 0.1 * Math.sin(v * 7 + 1), 0], elbowL: -0.3, elbowR: -0.3});
const breathe = (v: number, seed = 0): HumanPose => ({bob: 0.006 * Math.sin(v * 2.4 + seed), tilt: 0.02 * Math.sin(v * 1.3 + seed)});
const SIT_REST: HumanPose = {sit: 1, armL: [-0.3, 0.55, 0], armR: [-0.3, 0.55, 0], elbowL: -0.5, elbowR: -0.5};

const Outdoor: React.FC<{box?: number; key1?: V3}> = ({box = 7, key1 = [4, 8, 6]}) => (
  <>
    <Sky />
    <InteriorLights key1={key1} k={1} box={box} warm="#fff2dc" sky="#e8f6ff" ground="#5a8a50" />
  </>
);
const Hills: React.FC = () => (
  <>
    <Ground />
    {[-9, -4, 3, 9].map((x, i) => (
      <mesh key={x} position={[x, -1.5, -14 - i * 2]} scale={[6, 4, 4]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color={i % 2 ? '#6ac25a' : '#5ab450'} roughness={1} />
      </mesh>
    ))}
    <Cloud position={[-4, 6.5, -16]} s={1.6} />
    <Cloud position={[5, 7.5, -20]} s={2} />
    <Cloud position={[1, 9, -26]} s={1.4} />
  </>
);

// ======================================================================= hook / final: two coin hills of the same height

const GX = -0.78;
const BX = 0.78;
const EVEN_H = 0.32;
const Duo: React.FC<{v: number; hG: number; hB: number; poseG?: HumanPose; poseB?: HumanPose; eG?: Expr; eB?: Expr}> = ({v, hG, hB, poseG = {}, poseB = {}, eG = PROUD, eB = PROUD}) => (
  <>
    <Outdoor />
    <Hills />
    <CoinColumn position={[GX, 0, 0]} h={hG} />
    <CoinColumn position={[BX, 0, 0]} h={hB} />
    <Human o={GABE} position={[GX, hG, 0]} rotation={0.28} pose={{...breathe(v), ...poseG, face: face(eG, v, 1)}} />
    <Human o={BEAST} position={[BX, hB, 0]} rotation={-0.28} pose={{...breathe(v, 2), ...poseB, face: face(eB, v, 2)}} />
  </>
);
export const HOOK_VIEW = (v: number): View => mv(v, 0, E('hook'), [0.6, 1.5, 7.4], [0.25, 1.45, 6.2], [0, 1.15, 0], [0, 1.2, 0], 40, 0.4);
export const hookScene: Scene = {
  view: HOOK_VIEW,
  render: (v) => <Duo v={v} hG={EVEN_H} hB={EVEN_H} poseG={{head: [0, 0.25, 0]}} poseB={{head: [0, -0.25, 0]}} eG={SMUG} eB={SMUG} />,
};

// ======================================================================= round 1: wealth, the columns grow

const hB = (v: number) => lerp(EVEN_H, 0.65, ease(v, GROW_B, GROW_B + 0.8));
const hG = (v: number) => lerp(EVEN_H, 2.55, ease5(v, GROW_G, GROW_G + 1.7));
export const worthScene: Scene = {
  view: (v) => {
    const a = mv(v, S('worth'), GROW_G, [1.4, 1.3, 6.6], [0.9, 1.4, 6.8], [0.3, 1.1, 0], [0.2, 1.25, 0], 40, 0.3);
    const b = mv(v, GROW_G, GROW_G + 2.0, a.pos, [-0.5, 3.1, 9.6], a.target, [-0.15, 2.45, 0], 40);
    return v < GROW_G ? a : b;
  },
  shakes: [[GROW_G + 1.7, 0.25]],
  render: (v) => {
    const g = hG(v);
    const b = hB(v);
    const gUp = ease(v, GROW_G + 0.3, GROW_G + 1.4);
    return (
      <Duo
        v={v}
        hG={g}
        hB={b}
        poseG={gUp > 0 ? {...armsUp(gUp, v)} : {head: [0, 0.2, 0]}}
        poseB={{head: [lerp(0, -0.45, gUp), lerp(0, -0.35, gUp), 0]}}
        eG={v > GROW_G + 0.2 ? HAPPY : PROUD}
        eB={v > GROW_G + 0.6 ? WOW : v > GROW_B ? HAPPY : PROUD}
      />
    );
  },
};

// ======================================================================= round 2a: Steam's online record, Gaben on stage

const ROWS = crowdRows(15, 17, 2.4, 0.72, 0.58, 1);
export const fansGScene: Scene = {
  view: (v) => mv(v, S('fansG'), E('fansG') - 0.3, [0.7, 2.3, 5.4], [0.3, 6.6, 16.5], [0, 2.25, 0], [0, 1.7, 2.8], [40, 44]),
  render: (v) => {
    const on = v >= (S('fansG') + E('fansG')) / 2 - 0.6 ? 1 : 0;
    return (
      <>
        <color attach="background" args={['#1c1830']} />
        <fog attach="fog" args={['#1c1830', 14, 40]} />
        <InteriorLights key1={[2, 9, 8]} k={0.85} box={12} warm="#fff0e0" sky="#c8c0ff" ground="#3a3048" />
        <Block position={[0, -0.05, 6]} size={[40, 0.1, 40]} color="#2a2640" look={{rough: 0.9}} />
        <Stage on={on} />
        <Human o={GABE} position={[0, 0.5, 0.3]} pose={{...breathe(v), ...wave(v, 'R'), face: face(HAPPY, v, 3)}} />
        <Crowd pts={ROWS} seed={2} />
        <Screens pts={ROWS} />
      </>
    );
  },
};

// ======================================================================= round 2b: the globe of subscribers, MrBeast on top

export const fansBScene: Scene = {
  view: (v) => {
    const k = ease5(v, GLOBE - 0.35, E('fansB') - 0.2);
    const pos = lerp3([0.55, GLOBE_R + 1.55, 2.6], [0.2, GLOBE_R + 1.2, 17], k);
    const tgt = lerp3([0, GLOBE_R + 1.3, 0], [0, 0.9, 0], k);
    return {pos, target: tgt, fov: 40, far: 300};
  },
  render: (v) => (
    <>
      <color attach="background" args={['#0b1030']} />
      <InteriorLights key1={[5, 9, 7]} k={1} box={6} warm="#fff4e0" sky="#d8e8ff" ground="#2a3050" />
      <Stars />
      <Globe />
      <Human o={BEAST} position={[0, GLOBE_R - 0.02, 0]} pose={{...breathe(v), ...armsUp(ease(v, GLOBE, GLOBE + 0.6), v), face: face(v > GLOBE ? HAPPY : PROUD, v, 4)}} />
    </>
  ),
};

// ======================================================================= round 3a: a million per video

const LENS: V3 = [0.45, 1.33, -0.16];
const Studio: React.FC<{wall?: string; floor?: string}> = ({wall = '#3a6ad0', floor = '#2a2a38'}) => (
  <>
    <color attach="background" args={[wall]} />
    <InteriorLights key1={[3, 7, 6]} k={1} box={5} warm="#fff2dc" sky="#f6f0ff" ground="#4a4a60" />
    <Block position={[0, -0.05, 0]} size={[20, 0.1, 20]} color={floor} look={{rough: 0.9}} />
    <Block position={[0, 3, -2.4]} size={[20, 6.2, 0.1]} color={wall} look={{rough: 1}} />
  </>
);
export const spendBScene: Scene = {
  view: (v) => mv(v, S('spendB'), E('spendB'), [-0.2, 1.5, 4.4], [0.15, 1.38, 3.8], [0.05, 1.15, 0], [0.08, 1.15, 0], 40, 0.3),
  render: (v) => (
    <>
      <Studio />
      <VideoCam position={[0.45, 0, -0.6]} rec={Math.floor(v * 2) % 2 === 0} />
      <Human o={BEAST} position={[-0.32, 0, 0]} rotation={0.25} pose={{...breathe(v), ...(v > MIL ? armsUp(ease(v, MIL, MIL + 0.4) * 0.75, v) : {}), face: face(v > MIL ? HAPPY : PROUD, v, 5)}} />
      <BillStream from={LENS} t={v - MIL} />
    </>
  ),
};

// ======================================================================= round 3b: the 111 m yacht, then the shipyard

const yachtX = (v: number) => -1.4 * (v - S('yacht'));
export const yachtScene: Scene = {
  view: (v) => {
    const x = yachtX(v);
    const k = ease5(v, S('yacht') + 0.2, RULER + 0.9);
    // close on Gaben at the bow, then far out to see the whole hull with the ruler
    const pos = lerp3([x - 7.2, 4.6, 6.0], [x - 13, 9.5, 30], k);
    const tgt = lerp3([x - 6.2, 3.6, 0.0], [x + 0.6, 2.4, 0], k);
    return {pos, target: tgt, fov: lerp(36, 40, k), far: 400};
  },
  render: (v) => {
    const x = yachtX(v);
    return (
      <>
        <Sky top="#8fd0ff" fog="#cfeaff" near={30} far={140} />
        <InteriorLights key1={[6, 10, 8]} k={1.05} box={14} warm="#fff2dc" sky="#e8f6ff" ground="#2a6a90" />
        <Sea t={v} />
        <Yacht position={[x, 0, 0]} rotation={-Math.PI / 2} bob={v} ruler={ease(v, RULER - 0.1, RULER + 0.7)}>
          <Human o={GABE} position={[0, YACHT_DECK, 4.6]} pose={{...breathe(v), ...wave(v, 'R'), face: face(HAPPY, v, 6)}} rotation={Math.PI / 2 - 0.3} />
        </Yacht>
        <Cloud position={[-30, 14, -40]} s={3} />
        <Cloud position={[10, 18, -60]} s={4} />
      </>
    );
  },
};
export const factoryScene: Scene = {
  view: (v) => mv(v, S('factory'), E('factory'), [3.4, 1.9, 1.5], [6.0, 4.2, 9.5], [0.6, 2.1, -6], [0, 3.2, -10], 40, 0.6),
  shakes: [[BOUGHT, 0.3]],
  render: (v) => (
    <>
      <Sky top="#8fd0ff" fog="#cfeaff" near={25} far={120} />
      <InteriorLights key1={[6, 10, 8]} k={1.05} box={16} warm="#fff2dc" sky="#e8f6ff" ground="#2a6a90" />
      <Sea t={v} />
      <group position={[0, 0, -12]}>
        <Shipyard />
      </group>
      <Human o={GABE} position={[0.6, 0.5, -5.6]} rotation={0.15} pose={{...breathe(v), ...(v > BOUGHT ? armsUp(ease(v, BOUGHT, BOUGHT + 0.35), v) : {}), face: face(v > BOUGHT ? HAPPY : SMUG, v, 7)}} />
      <Yacht position={[-11, 0, -3]} rotation={0.1} bob={v} s={0.8} />
    </>
  ),
};

// ======================================================================= round 4a: Gaben at 27, a Microsoft cubicle (no logos)

const typing = (v: number): HumanPose => ({
  sit: 1,
  armL: [-1.05 + 0.05 * Math.sin(v * 21), 0.12, 0],
  armR: [-1.05 + 0.05 * Math.sin(v * 23 + 1), 0.12, 0],
  elbowL: -0.55,
  elbowR: -0.55,
  head: [0.12, 0, 0],
});
export const ageGScene: Scene = {
  view: (v) => mv(v, S('ageG'), E('ageG'), [1.85, 1.5, -0.55], [1.45, 1.42, -0.75], [0, 1.08, 0.0], [0, 1.08, -0.05], 40, 0.2),
  render: (v) => (
    <>
      <color attach="background" args={['#b8c0cc']} />
      <InteriorLights key1={[2, 6, 4]} k={0.95} box={6} warm="#f4f8ff" sky="#f0f4ff" ground="#6a6a70" />
      <Block position={[0, -0.05, 0]} size={[20, 0.1, 20]} color="#8a8478" look={{rough: 1}} />
      <Block position={[0, 2.62, 0]} size={[20, 0.04, 20]} color="#e8e6e0" look={{rough: 1}} shadow={false} />
      {[-2, 0, 2].map((z) => [-3.2, -1.6, 1.6, 3.2].map((x) => <Strip key={`${x}${z}`} position={[x, 2.59, z - 1]} />))}
      {[
        [0, 0],
        [-1.65, 0],
        [-1.65, -1.75],
        [0, -1.75],
        [1.65, -1.75],
        [-3.3, 0],
        [-3.3, -1.75],
        [0, -3.5],
        [-1.65, -3.5],
        [1.65, -3.5],
      ].map(([x, z], i) => (
        <Cubicle key={i} position={[x, 0, z]} me={i === 0} open={i === 0} />
      ))}
      <Human o={GABE27} position={[0, 0, 0.12]} rotation={Math.PI} pose={{...typing(v), face: face({smile: 0.1, lid: 0.25}, v, 8)}} />
    </>
  ),
};

// ======================================================================= round 4b: MrBeast on a throne of cash

export const ageBScene: Scene = {
  view: (v) => mv(v, S('ageB'), E('ageB'), [0.9, 1.25, 3.4], [0.4, 1.15, 2.6], [0, 0.85, 0], [0, 0.9, 0], 40, 0.3),
  shakes: [[THRONE, 0.2]],
  render: (v) => (
    <>
      <color attach="background" args={['#5a2a4a']} />
      <InteriorLights key1={[3, 7, 6]} k={1} box={5} warm="#fff0d0" sky="#ffe8f0" ground="#6a3a50" />
      <GoldRoom />
      <CashSofa position={[0, 0, -0.1]} />
      <Human o={BEAST} position={[0, 0.02, 0.12]} pose={{...SIT_REST, ...(v > THRONE ? {armR: [-2.5, 0.3, 0], elbowR: -0.4} : {}), face: face(v > THRONE ? HAPPY : SMUG, v, 9)}} />
    </>
  ),
};

// ======================================================================= final: 2 : 2, back on the even hills

export const finalScene: Scene = {
  view: (v) => mv(v, S('final'), E('final'), [-0.6, 0.9, 6.2], [0.4, 1.3, 5.6], [0, 1.25, 0], [0, 1.2, 0], 40, 0.5),
  render: (v) => <Duo v={v} hG={EVEN_H} hB={EVEN_H} poseG={{head: [0, 0.3, 0]}} poseB={{head: [0, -0.3, 0]}} eG={{brow: -0.06, tilt: 0.3, smile: 0.1}} eB={{brow: -0.06, tilt: 0.3, smile: 0.1}} />,
};

// ======================================================================= Gaben lives at sea: a lounger on the deck at sunset

const Sunset: React.FC = () => (
  <>
    <Sky top="#ffb27a" fog="#ffc89a" near={30} far={150} />
    <InteriorLights key1={[-6, 5, -8]} k={1.0} box={10} warm="#ffd2a0" sky="#ffd8b8" ground="#3a5a80" />
    <mesh position={[-20, 8, -90]}>
      <circleGeometry args={[7, 40]} />
      <meshBasicMaterial color="#fff0b0" toneMapped={false} fog={false} />
    </mesh>
  </>
);
const SEA_Y: V3 = [0, 0, 0];
export const seaScene: Scene = {
  view: (v) => orbit(v, S('sea'), E('sea'), [0, YACHT_DECK, 3.4], [2.9, 2.3], [YACHT_DECK + 1.35, YACHT_DECK + 1.15], 0.95, 0.4, [0, YACHT_DECK + 0.9, 3.35], 40),
  render: (v) => (
    <>
      <Sunset />
      <Sea t={v} color="#3a6a9a" foam="#ffd8b0" />
      <Yacht position={SEA_Y} bob={v * 0.6}>
        <Lounger position={[0, YACHT_DECK, 3.6]} rotation={0} />
        <Human o={GABE} position={[0, YACHT_DECK - 0.02, 3.3]} rotation={0} pose={{sit: 1, lean: -0.3, legL: -0.15, legR: -0.05, kneeL: -1.25, kneeR: -1.2, armL: [-0.2, 0.5, 0], armR: [-2.2, 0.4, 0], elbowR: -1.6, head: [-0.25, 0, 0], face: face({happy: 0.6, smile: 0.7, lid: 0.45}, v, 10)}} />
      </Yacht>
      <Yacht position={[-34, 0, -60]} rotation={0.6} bob={v * 0.5} s={0.9} />
    </>
  ),
};

// ======================================================================= MrBeast: «negative money», an empty wallet and a moth

const WALLET_AT: V3 = [0, 1.02, 0.3];
export const walletScene: Scene = {
  view: (v) => mv(v, S('wallet'), E('wallet'), [0.4, 1.45, 1.95], [0.15, 1.4, 1.55], [0, 1.15, 0.15], [0, 1.18, 0.15], 40, 0.15),
  render: (v) => {
    const open = ease(v, S('wallet') + 0.4, S('wallet') + 0.9);
    const mt = v - MOTH;
    const mp: V3 = [WALLET_AT[0] + 0.25 * Math.sin(mt * 2.2) * Math.min(1, mt), WALLET_AT[1] + 0.05 + mt * 0.18, WALLET_AT[2] + mt * 0.12];
    return (
      <>
        <Studio wall="#8aa4c8" floor="#5a6070" />
        <Human
          o={BEAST}
          position={[0, 0, 0]}
          pose={{...breathe(v), armL: [-0.95, 0.12, 0], armR: [-0.95, 0.12, 0], elbowL: -0.85, elbowR: -0.85, head: [0.4, 0, 0], face: face(v > MOTH ? SAD : {smile: 0, look: [0, -0.3]}, v, 11)}}
        />
        <Wallet position={WALLET_AT} rotation={[0.35, 0, 0]} open={open} />
        {mt > 0 && mt < 6 ? <Moth position={mp} t={mt} /> : null}
      </>
    );
  },
};

// ======================================================================= ...and borrowed from mom for the wedding

export const momScene: Scene = {
  view: (v) => mv(v, S('mom'), E('mom'), [0.5, 1.45, 3.0], [0.1, 1.35, 2.5], [0, 1.15, 0], [0, 1.1, 0], 40, 0.2),
  render: (v) => {
    const give = ease(v, ENV - 0.6, ENV + 0.1);
    return (
      <>
        <Studio wall="#e8c8d0" floor="#8a6a70" />
        <Human o={MOM} position={[-0.42, 0, 0.05]} rotation={1.0} pose={{...breathe(v), armR: [-1.2 * give - 0.1, 0.15, 0], elbowR: -0.3, face: face({happy: 0.5, smile: 0.6}, v, 12)}} />
        <Human o={BEAST} position={[0.42, 0, 0.05]} rotation={-1.0} pose={{...breathe(v, 1), armL: [-1.0 * give, -0.1, 0], armR: [-1.0 * give, -0.1, 0], elbowL: -0.5, elbowR: -0.5, head: [0.2, 0, 0], face: face({smile: 0.3, browIn: 0.4, tilt: -0.2, blush: 0.6}, v, 13)}} />
        <Envelope position={[lerp(-0.22, 0.02, give), lerp(0.95, 1.08, give), 0.32]} rotation={[0, 0, 0.1]} />
      </>
    );
  },
};

// ======================================================================= the podium

export const winScene: Scene = {
  view: (v) => mv(v, S('win'), E('win'), [0.4, 1.7, 7.6], [-0.1, 1.9, 6.6], [-0.35, 2.0, 0], [-0.3, 2.05, 0], 40, 0.3),
  shakes: [[WIN, 0.25]],
  render: (v) => (
    <>
      <Outdoor box={6} />
      <Hills />
      <Podium />
      <Human o={GABE} position={[0, 1.2, 0]} pose={{...breathe(v), ...armsUp(ease(v, WIN, WIN + 0.4), v), face: face(HAPPY, v, 14)}} />
      <Human o={BEAST} position={[-1.25, 0.8, 0]} rotation={0.2} pose={{...breathe(v, 1), ...wave(v, 'L', 0.8), face: face({happy: 0.4, smile: 0.4, browIn: 0.25}, v, 15)}} />
      <Confetti center={[0, 3.2, 0]} t={v - WIN} n={90} />
      <Confetti center={[-1.2, 3.0, 0.3]} t={v - WIN - 0.15} n={60} seed={9} />
    </>
  ),
};

