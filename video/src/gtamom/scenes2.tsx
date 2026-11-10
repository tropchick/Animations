import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Scene, ease, ease5, mv} from '../bear/common';
import {Pic} from '../bear/Props';
import {InteriorLights} from '../cs2/scenes1';
import {drawTiles} from '../diet/Sets';
import {useRobe} from '../gaben/Sets';
import {Stars} from '../gta/Space';
import {LandBlob, SoftSlipper, ToyEarth, Water} from '../nolan/Sets';
import {SpaceLights, bounce} from '../nolan/scenes1';
import type {View} from '../slime/camera';
import {CONSOLE, EU_OFF, LIFT_AT, LOAD_AT, REVEAL, V3, lerp, ramp, rnd, shotEnd, shotStart} from './cues';
import {Ball, Block, CityLights, Console, Couch, Cyl, GameBox, Glow, Lift, Palm, PlayerArm, RBox, SKIN, ToyCar, Tower, Tv, Web, lightsOn} from './Sets';
import {reach} from './scenes1';

const S = shotStart;
const E = shotEnd;

const drawDarkWall = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#3a3a5a';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#34345a';
  for (let i = 0; i < 12; i++) g.fillRect((i / 12) * W, 0, W / 24, H);
};

// ======================================================================= test 3b: one press on the console

const CONSOLE_AT: V3 = [0.2, 0.52, 0];
export const consoleScene: Scene = {
  view: (v): View => mv(v, S('console'), E('console'), [-0.55, 0.95, 1.45], [-0.25, 0.8, 1.0], [0.1, 0.72, 0], [0.18, 0.72, 0], [42, 38], 0.15),
  shakes: [[CONSOLE + 1.2, 0.2]],
  render: (v) => {
    const t = v - S('console');
    const press = ease(v, CONSOLE - 0.5, CONSOLE) * (1 - ease(v, CONSOLE + 0.3, CONSOLE + 0.8));
    const on = v >= CONSOLE ? 1 : 0;
    const heat = ease(v, CONSOLE + 0.4, E('console'));
    const btn: V3 = [CONSOLE_AT[0], CONSOLE_AT[1] + 0.05, CONSOLE_AT[2] + 0.165];
    const from: V3 = [0.95, 0.85, 0.75];
    const arm = reach(from, btn);
    const flick = heat > 0.5 && Math.floor(v * 14) % 3 === 0 ? 0.6 : 1;
    return (
      <>
        <color attach="background" args={['#14121e']} />
        <InteriorLights key1={[1.5, 4, 3]} k={0.85 * flick} box={3} warm="#e8e0ff" sky="#c8c0ff" ground="#3a3048" />
        <Pic size={[6, 4]} res={[512, 320]} k="con-wall" position={[0, 1.6, -0.5]} shadow draw={drawDarkWall} />
        <Pic size={[6, 4]} res={[512, 320]} k="con-floor" position={[0, 0, 1.0]} rotation={[-Math.PI / 2, 0, 0]} shadow draw={drawTiles('#5a4a3a', '#4a3a2a', 8)} />
        {/* TV stand + the TV above (off) */}
        <RBox position={[0, 0.26, -0.05]} size={[1.6, 0.52, 0.45]} r={0.03} color="#2a2430" />
        <RBox position={[0, 0.52 - 0.004, -0.05]} size={[1.62, 0.012, 0.47]} r={0.004} color="#3a3440" shadow={false} />
        <Tv position={[-0.15, 0.62, -0.3]} w={1.2} pct={0} days="" on={false} />
        <Console position={CONSOLE_AT} on={on} heat={heat} t={t} />
        <Glow position={[CONSOLE_AT[0], CONSOLE_AT[1] + 0.2, CONSOLE_AT[2] + 0.2]} size={2.4} color="#ff5a1e" k={heat * 0.6} />
        <group position={from} rotation={[0, arm.yaw, 0]}>
          <group rotation={[arm.pitch, 0, 0]}>
            <PlayerArm len={arm.len - 0.225 - 0.12 * (1 - press)} />
          </group>
        </group>
      </>
    );
  },
};

// ======================================================================= test 3c: Europe goes dark, one dot keeps burning

const ER = 3;
const EU_DIR: V3 = [0.1, 0.35, 0.93];
const EU_LIGHTS = lightsOn([0.1, 0.35, 1], 110, 0.33, 11);
const dirDist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const europeScene: Scene = {
  view: (v): View => mv(v, S('europe'), E('europe'), [0.2, 2.1, 10.5], [0.3, 1.7, 9.0], [0.3, 1.1, 0], [0.3, 1.0, 0], [40, 36]),
  render: (v) => {
    const k = ramp(v, EU_OFF[0], EU_OFF[0] + 1.1);
    const c = EU_LIGHTS[0].d;
    const pulse = 0.75 + 0.25 * Math.sin(v * 12);
    return (
      <>
        <color attach="background" args={['#05060f']} />
        <Stars radius={300} size={2} />
        <SpaceLights k={0.4} />
        <group rotation={[-0.3, 0, 0]}>
          <ToyEarth r={ER} lands={false}>
            <LandBlob r={ER} d={EU_DIR} s={[1.9, 1.5, 0.3]} c="#7ab86a" />
            <LandBlob r={ER} d={[-0.6, 0.2, 0.75]} s={[1.4, 2.0, 0.3]} c="#6fbf73" />
            <LandBlob r={ER} d={[0.55, -0.3, 0.78]} s={[1.4, 1.6, 0.3]} c="#c8b878" />
            <CityLights r={ER} lights={EU_LIGHTS.slice(1)} off={(l) => dirDist(l.d, c) < k * 1.4} />
            <Ball position={[c[0] * ER * 1.005, c[1] * ER * 1.005, c[2] * ER * 1.005]} scale={0.06} color="#ff8a3a" look={{basic: true}} shadow={false} />
            <Glow position={[c[0] * ER * 1.06, c[1] * ER * 1.06, c[2] * ER * 1.06]} size={0.9 * pulse} color="#ff7a2a" k={0.9} />
          </ToyEarth>
        </group>
        <Glow position={[-14, 9, -30]} size={10} color="#fff1c8" k={0.5} />
      </>
    );
  },
};

// ======================================================================= test 4a: GTA 6 is installing: three days left, cobwebs grow

export const loadingScene: Scene = {
  view: (v): View => mv(v, S('loading'), E('loading'), [0.5, 1.4, 3.3], [0.2, 1.25, 2.6], [0, 1.15, -0.8], [0, 1.2, -0.9], [44, 40], 0.2),
  render: (v) => {
    const pct = lerp(0.01, 0.03, ramp(v, LOAD_AT, E('loading')));
    const web = ease(v, S('loading'), E('loading'));
    return (
      <>
        <color attach="background" args={['#0c0c18']} />
        <ambientLight intensity={0.25} color="#8090d0" />
        <pointLight position={[0, 1.3, -0.4]} color="#d880c0" intensity={3.5} distance={6} decay={1.6} />
        <directionalLight position={[2, 4, 3]} intensity={0.35} color="#a0b0ff" />
        <Pic size={[7, 4]} res={[512, 320]} k="load-wall" position={[0, 2, -1.2]} shadow draw={drawDarkWall} />
        <Pic size={[7, 6]} res={[512, 384]} k="load-floor" position={[0, 0, 1.5]} rotation={[-Math.PI / 2, 0, 0]} shadow draw={drawTiles('#4a3a3a', '#3a2a2a', 8)} />
        <Tv position={[0, 0.8, -1.15]} w={1.3} pct={pct} days="ОСТАЛОСЬ: 3 ДНЯ" />
        <Glow position={[0, 1.3, -0.9]} size={3} color="#c060b0" k={0.35} />
        <Web position={[-0.68, 1.6, -1.1]} s={0.5} k={0.4 + 0.6 * web} />
        <Web position={[0.68, 1.6, -1.1]} rotation={[0, 0, -Math.PI / 2]} s={0.5} k={0.3 + 0.7 * web} />
        <Couch position={[0, 0, 1.0]} rotation={Math.PI} />
        {/* the controller left on the couch, under a web */}
        <group position={[0.35, 0.49, 1.0]} rotation={[0, 0.4, 0]}>
          <RBox size={[0.2, 0.05, 0.12]} r={0.025} color="#1c1d24" />
          <Web position={[0, 0.08, 0.01]} rotation={[-Math.PI / 2, 0, 0]} s={0.18} k={web} />
        </group>
      </>
    );
  },
};

// ======================================================================= test 4b: she loads into the lift since 2004

const RobeBulge: React.FC<{squash: number}> = ({squash}) => {
  const robe = useRobe([4, 3]);
  const m = useMemo(() => new THREE.MeshStandardMaterial({map: robe, roughness: 0.95}), [robe]);
  return (
    <mesh position={[0, 1.15, -0.55]} scale={[1.25 * squash, 1.3, 0.75 / squash]} material={m} castShadow receiveShadow>
      <sphereGeometry args={[1, 40, 24]} />
    </mesh>
  );
};

export const liftScene: Scene = {
  view: (v): View => mv(v, S('lift'), E('lift'), [0.6, 1.5, 4.6], [0.2, 1.4, 3.7], [0, 1.4, 0], [0, 1.45, 0], [46, 44], 0.2),
  shakes: [[LIFT_AT + 0.15, 0.15], [LIFT_AT + 0.7, 0.15], [LIFT_AT + 1.25, 0.15]],
  render: (v) => {
    const open = ease(v, S('lift') + 0.1, S('lift') + 0.7);
    let gap = open;
    let squash = 1;
    for (let j = 0; j < 3; j++) {
      const at = LIFT_AT + j * 0.55;
      if (v > at - 0.25 && v < at + 0.3) {
        const x = v < at ? ease(v, at - 0.25, at) : 1 - ease(v, at, at + 0.3);
        gap = Math.min(gap, 1 - 0.42 * x);
        squash = Math.min(squash, 1 - 0.1 * x);
      }
    }
    const sign = v > LIFT_AT - 0.2 ? Math.floor(v * 4) % 2 === 0 : false;
    return (
      <>
        <color attach="background" args={['#2a2a34']} />
        <InteriorLights key1={[1.5, 5, 4]} k={0.9} box={4} warm="#fff4e6" sky="#eef0ff" ground="#6a6a70" />
        <Pic size={[8, 5]} res={[512, 320]} k="lift-wall" position={[0, 2.5, -0.02]} shadow draw={drawTiles('#d8c8b0', '#c8b8a0', 6)} />
        <Pic size={[8, 6]} res={[512, 384]} k="lift-floor" position={[0, 0, 2]} rotation={[-Math.PI / 2, 0, 0]} shadow draw={drawTiles('#8a8a92', '#7a7a82', 10)} />
        {/* the cabin behind the doors: walls, and her robe filling it all */}
        <Block position={[0, 1.1, -1.4]} size={[2.2, 2.2, 0.05]} color="#b8a888" />
        <Block position={[0, 2.17, -0.74]} size={[2.2, 0.04, 1.32]} color="#a89878" />
        <Block position={[0, 0.0, -0.7]} size={[2.2, 0.02, 1.4]} color="#7a6a5a" />
        <RobeBulge squash={squash} />
        <SoftSlipper who="g" position={[-0.3, 0.015, -0.05]} rotation={[0, 0.15, 0]} scale={2.2} />
        <SoftSlipper who="g" position={[0.32, 0.015, -0.08]} rotation={[0, -0.1, 0]} scale={2.2} />
        <Lift gap={gap} sign={sign} />
        <Cyl position={[1.45, 1.1, 0.05]} rotation={[Math.PI / 2, 0, 0]} rt={0.06} rb={0.06} h={0.03} seg={20} color="#e8e8ee" look={{metal: 0.6, rough: 0.3}} />
      </>
    );
  },
};

// ======================================================================= final a: the game files (the window itself is in the Overlay)

export const filesScene: Scene = {
  noHandheld: true,
  view: (v): View => mv(v, S('files'), E('files'), [0, 1.0, 3.6], [0, 0.95, 3.0], [0, 0.7, 0], [0, 0.7, 0], [40, 40]),
  render: (v) => (
    <>
      <color attach="background" args={['#120a24']} />
      <InteriorLights key1={[1.5, 4, 3]} k={0.6} box={3} warm="#ffd8f0" sky="#c8b0ff" ground="#2a1a3a" />
      <GameBox position={[0, 0.1, 0]} rotation={[0.05, (v - S('files')) * 0.35 - 0.3, 0]} scale={1} glow={0.9} />
      <Glow position={[0, 0.7, -0.5]} size={4} color="#c060ff" k={0.5} />
    </>
  ),
};

// ======================================================================= final b: the map: an island in the shape of her slipper, with the city on it

export const ISL = 30; // slipper scale
const lining = (x: number, z: number) => {
  // top of the slipper's inner lining ellipsoid (SoftSlipper: centre y 0.048, scale [0.1, 0.012, 0.165], z -0.01)
  const u = 1 - (x / (0.1 * ISL)) ** 2 - ((z + 0.01 * ISL) / (0.165 * ISL)) ** 2;
  return 0.048 * ISL + 0.012 * ISL * Math.sqrt(Math.max(0, u));
};
const BLOCKS: {x: number; z: number; w: number; h: number}[] = [];
for (let i = 0; i < 40; i++) {
  const x = (rnd(i * 3 + 1) - 0.5) * 4.2;
  const z = -4.4 + rnd(i * 5 + 2) * 5.0;
  const u = (x / 3) ** 2 + ((z + 0.3) / 4.95) ** 2;
  if (u < 0.6 && Math.abs(x) > 0.35) BLOCKS.push({x, z, w: 0.35 + rnd(i * 7) * 0.3, h: 0.6 + rnd(i * 11) * 1.8});
}
const PALMS: V3[] = Array.from({length: 18}, (_, i) => {
  const a = (i / 18) * Math.PI * 2;
  const x = Math.cos(a) * 2.4;
  const z = -0.3 + Math.sin(a) * 4.0;
  return [x, lining(x, z) - 0.05, z] as V3;
}).filter((p) => p[2] < 1.2);

export const SlipperIsland: React.FC<{v: number}> = ({v}) => (
  <group>
    <SoftSlipper who="g" scale={ISL} />
    {BLOCKS.map((b, i) => (
      <Tower key={i} position={[b.x, lining(b.x, b.z) - 0.12, b.z]} w={b.w} h={b.h} i={i} lit={0} />
    ))}
    {/* a road along the middle with cars driving up and down */}
    <Block position={[0, lining(0, -1.5) - 0.02, -1.5]} size={[0.5, 0.06, 6.2]} color="#4a4a52" shadow={false} />
    {Array.from({length: 8}).map((_, i) => {
      const dir = i % 2 ? 1 : -1;
      const z = -4.4 + ((Math.floor(i / 2) * 1.5 + (i % 2) * 0.7 + dir * v * 1.2) % 6 + 6) % 6;
      return <ToyCar key={i} position={[dir * 0.12, lining(0, z) + 0.02, z]} yaw={dir > 0 ? 0 : Math.PI} i={i} scale={0.6} />;
    })}
    {PALMS.map((p, i) => (
      <Palm key={i} position={p} h={0.9} seed={i + 3} scale={0.9} />
    ))}
  </group>
);

export const islandScene: Scene = {
  view: (v): View => mv(v, S('island'), E('island'), [7.5, 3.4, -3.5], [1.0, 33, 11], [0, 1.6, -2.0], [0, 0, -2.6], [46, 42], 2),
  render: (v) => (
    <>
      <color attach="background" args={['#8cd0f0']} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[8, 14, 10]} intensity={2.2} color="#fff4e0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
      <Water y={0.7} size={600} color="#2fa8d8" />
      <SlipperIsland v={v} />
      {v > REVEAL ? <Glow position={[0, 4, 0]} size={12} color="#ffd0e8" k={0.25 * ease(v, REVEAL, REVEAL + 0.6)} /> : null}
    </>
  ),
};

// ======================================================================= final c: pull back: an ankle rises from the island, the robe hangs over the horizon

const GiantRest: React.FC = () => {
  const robe = useRobe([10, 6]);
  const m = useMemo(() => new THREE.MeshStandardMaterial({map: robe, roughness: 0.95, side: THREE.DoubleSide}), [robe]);
  const S2 = ISL;
  const hem = 1.8;
  const R = 0.36;
  return (
    <group>
      {/* her left ankle in the island slipper, and the right foot in a second slipper (the island is at the origin) */}
      <Cyl position={[0, 0.27 * S2, -0.03 * S2]} rt={0.058 * S2} rb={0.052 * S2} h={0.4 * S2} seg={24} color={SKIN} look={{rough: 0.7}} />
      <group position={[0.26 * S2, 0, 0]} rotation={[0, -0.16, 0]}>
        <Cyl position={[0, 0.27 * S2, -0.03 * S2]} rt={0.058 * S2} rb={0.052 * S2} h={0.4 * S2} seg={24} color={SKIN} look={{rough: 0.7}} />
        <SoftSlipper who="g" scale={S2} />
      </group>
      <group position={[0.13 * S2, 0.34 * S2, -0.04 * S2]}>
        <mesh position={[0, (hem * S2) / 2, 0]} material={m} castShadow receiveShadow>
          <cylinderGeometry args={[R * 0.9 * S2, R * 1.12 * S2, hem * S2, 48, 1, true]} />
        </mesh>
      </group>
    </group>
  );
};

export const robeScene: Scene = {
  view: (v): View => mv(v, S('robe'), E('robe'), [-2, 5, 26], [-14, 22, 92], [0, 4, -1], [3.8, 24, -1], [44, 52], 6),
  render: (v) => (
    <>
      <color attach="background" args={['#8cd0f0']} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[30, 60, 50]} intensity={2.2} color="#fff4e0" />
      <Water y={0.7} size={900} color="#2fa8d8" />
      <SlipperIsland v={v} />
      <GiantRest />
    </>
  ),
};

export {bounce};
