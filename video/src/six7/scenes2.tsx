import React from 'react';
import {Human, HumanPose, walkPose} from '../bear/People';
import {Chair, Pic} from '../bear/Props';
import {Block, Glow, Pill, RBox} from '../bear/kit';
import {Scene, blink, ease, mv} from '../bear/common';
import {InteriorLights} from '../cs2/scenes1';
import {withArm} from '../brain/scenes1';
import {Kitchen, Stool, kid} from '../brain/Sets';
import {walker} from '../cheats/Sets';
import {StreetSet} from '../cheats/common';
import type {View} from '../slime/camera';
import {P10, P11, P12, P13, P14} from './phr';
import {BUSFLIP, CAKE, CALC, HANDS, NEWS, V3, clamp01, lerp, lerp3, ramp, shotEnd, shotStart} from './cues';
import {BackCap, Bus, BusStop, Cake, Calculator, GRANDPA, HERO, WallTv, ZAVUCH} from './Sets';
import {ClassSet, Pupils} from './scenes1';
import {drawNews} from './tex';

const S = shotStart;
const E = shotEnd;

// ======================================================================= 6. the calculator: 60 + 7 = ОШИБКА

const CALC_AT: V3 = [-2.0, 0.78, -0.85];
// key presses: [time, key]
const PRESSES: [number, string][] = [
  [CALC - 1.25, '6'],
  [CALC - 0.98, '0'],
  [CALC - 0.71, '+'],
  [CALC - 0.44, '7'],
  [CALC - 0.17, '='],
];
const KEY_POS: Record<string, [number, number]> = {'6': [2, 1], '0': [0, 3], '+': [3, 3], '7': [0, 0], '=': [2, 3]};
const lcdText = (v: number) => {
  if (v >= CALC) return 'ОШИБКА';
  let t = '';
  for (const [at, k] of PRESSES) if (v >= at && k !== '=') t += k;
  return t || '0';
};
const keyWorld = (k: string): V3 => {
  const [c, r] = KEY_POS[k];
  return [CALC_AT[0] - 0.066 + c * 0.044, CALC_AT[1] + 0.02, CALC_AT[2] - 0.02 + r * 0.04];
};
const Finger: React.FC<{v: number}> = ({v}) => {
  let i = 0;
  for (let j = 0; j < PRESSES.length; j++) if (v >= PRESSES[j][0] - 0.13) i = j;
  const [t0, k] = PRESSES[i];
  const prev = PRESSES[Math.max(0, i - 1)];
  const travel = ease(v, t0 - 0.24, t0 - 0.08);
  const p = lerp3(keyWorld(prev[1]), keyWorld(k), i === 0 ? 1 : travel);
  const dip = Math.max(0, 1 - Math.abs(v - t0) / 0.08);
  const before = v < PRESSES[0][0] - 0.4 ? 0.06 : 0;
  const lift = 0.025 * (1 - dip) + before;
  return (
    <group position={[p[0] + 0.01, p[1] + lift + 0.012, p[2] + 0.06]} rotation={[-0.9, 0.1, 0]}>
      <Pill position={[0, 0, 0]} r={0.011} len={0.07} color="#f4c7a6" />
      <Pill position={[0.01, -0.02, 0.09]} rotation={[0.4, 0, 0]} r={0.035} len={0.08} color="#f4c7a6" />
      <RBox position={[0.01, -0.04, 0.18]} rotation={[0.4, 0, 0]} size={[0.11, 0.1, 0.12]} r={0.04} color={HERO.top} />
    </group>
  );
};
export const calcScene: Scene = {
  view: (v): View => mv(v, S('calc'), E('calc'), [-2.0, 1.12, -0.5], [-2.0, 1.04, -0.56], [-2.0, 0.78, -0.86], [-2.0, 0.78, -0.86], [40, 36]),
  noHandheld: true,
  shakes: [[CALC, 0.2]],
  render: (v) => {
    const pressed = PRESSES.find(([t]) => Math.abs(v - t) < 0.07)?.[1];
    return (
      <>
        <ClassSet />
        <Calculator position={CALC_AT} rotation={[0.12, 0, 0]} text={lcdText(v)} err={v >= CALC} press={pressed} />
        <Finger v={v} />
        {v >= CALC ? <Glow position={[CALC_AT[0], CALC_AT[1] + 0.03, CALC_AT[2] - 0.08]} size={0.4} color="#ff6a5a" k={0.4 * (0.6 + 0.4 * Math.sin(v * 20))} /> : null}
      </>
    );
  },
};

// ======================================================================= 7. the bus: «67» becomes «66+1»

const STOP_AT: V3 = [-3.5, 0, -4.3];
const busX = (v: number) => lerp(16, -0.4, ease(v, S('bus') - 0.6, BUSFLIP - 0.6));
const routeFlip = (v: number) => {
  // the board blinks off and comes back with the new number
  const off = ease(v, BUSFLIP - 0.12, BUSFLIP) * (1 - ease(v, BUSFLIP + 0.06, BUSFLIP + 0.22));
  return {text: v < BUSFLIP + 0.05 ? '67' : '66+1', k: 1 - off};
};
const WAITERS: [number, number][] = [
  [-4.3, -3.7],
  [-3.2, -3.6],
  [-2.2, -3.85],
];
const BusSet: React.FC<{v: number}> = ({v}) => {
  const r = routeFlip(v);
  const puzzled = ease(v, BUSFLIP + 0.2, BUSFLIP + 0.6);
  return (
    <>
      <StreetSet center={[-1, 0, -3]} />
      <BusStop position={STOP_AT} />
      <group rotation={[0, Math.PI, 0]} position={[0, 0, -1.7]}>
        <Bus position={[-busX(v), 0, 0.0]} route={r.text} flip={r.k} />
      </group>
      {WAITERS.map(([x, z], i) => {
        const o = walker(i + 2);
        const pose: HumanPose = {
          head: [-0.1, 0.2 * Math.sin(v + i), lerp(0, 0.25 * (i % 2 ? 1 : -1), puzzled)],
          armR: [lerp(0.05, -2.7, puzzled * (i === 1 ? 1 : 0.0)), lerp(0.1, 0.5, puzzled), 0],
          elbowR: lerp(-0.2, -2.1, puzzled * (i === 1 ? 1 : 0)),
          armL: [lerp(0.05, -0.5, puzzled * (i === 1 ? 0 : 1)), 0.15, 0],
          elbowL: lerp(-0.2, -1.6, puzzled * (i === 1 ? 0 : 1)),
          face: {lid: blink(v, i) * 0.9, browIn: 0.4 * puzzled, brow: 0.03 * puzzled, mouth: 0.2 * puzzled, o: 0.5 * puzzled, look: [0, 0.2]},
        };
        return <Human key={i} o={o} position={[x, 0, z]} rotation={0.1 * (i - 1)} pose={pose} />;
      })}
    </>
  );
};
export const busScene: Scene = {
  view: (v): View => mv(v, S('bus'), E('bus'), [0.9, 1.75, -7.4], [0.2, 1.6, -6.6], [-1.0, 2.0, -2.9], [-2.0, 2.2, -2.9], [54, 50], 0.3),
  render: (v) => <BusSet v={v} />,
};

// ======================================================================= 8. grandpa's cake: 66 -> 68

const GRAN_AT: V3 = [0, 0, -0.62];
const CAKE_AT: V3 = [0, 0.765, -0.05];
const KitchenSet: React.FC<{v: number; tv?: boolean}> = ({v, tv}) => (
  <>
    <color attach="background" args={['#f2e2c4']} />
    <InteriorLights key1={[2, 5, 4]} k={0.95} box={4} />
    <Kitchen />
    {tv ? <WallTv position={[-2.53, 1.6, 1.15]} rotation={[0, Math.PI / 2, 0]} k={`news-${Math.round(clamp01((v - NEWS) / 0.4) * 10)}`} draw={drawNews(clamp01((v - NEWS) / 0.4))} w={1.3} /> : null}
  </>
);
const grandpaPose = (v: number, grump: number, blow: number): HumanPose => {
  const cross: HumanPose = {armR: [-1.05, -0.35, 0.6], elbowR: -1.75, armL: [-1.05, -0.35, 0.6], elbowL: -1.75};
  return {
    sit: 1,
    lean: lerp(0.18 + 0.12 * blow, -0.05, grump),
    head: [lerp(0.25, -0.05, grump), lerp(0, -0.35, grump), 0],
    armL: [lerp(-0.6, cross.armL![0], grump), lerp(0.2, cross.armL![1], grump), lerp(0, cross.armL![2] ?? 0, grump)],
    elbowL: lerp(-1.1, cross.elbowL!, grump),
    armR: [lerp(-0.6, cross.armR![0], grump), lerp(0.2, cross.armR![1], grump), lerp(0, cross.armR![2] ?? 0, grump)],
    elbowR: lerp(-1.1, cross.elbowR!, grump),
    face: {
      lid: blink(v, 7) * 0.9 + 0.2 * grump,
      smile: lerp(0.7, -0.8, Math.max(grump, ease(v, CAKE + 0.1, CAKE + 0.5) * 0.6)),
      happy: 0.6 * (1 - grump) * (1 - ease(v, CAKE, CAKE + 0.4)),
      mouth: blow * 0.35 + ease(v, CAKE, CAKE + 0.2) * (1 - grump) * 0.3,
      o: blow + ease(v, CAKE, CAKE + 0.2) * (1 - grump),
      wide: ease(v, CAKE, CAKE + 0.2) * (1 - grump),
      browIn: lerp(0, -0.45, grump) + 0.4 * ease(v, CAKE, CAKE + 0.3) * (1 - grump),
      brow: -0.03 * grump,
      look: [lerp(0, -0.5, grump), lerp(-0.4, 0, grump)],
    },
  };
};
const CakeSet: React.FC<{v: number}> = ({v}) => {
  const after = v >= CAKE;
  const grump = ease(v, P12.s - 0.1, P12.s + 0.5);
  const blow = ease(v, P10.e - 0.4, P10.e) * (1 - ease(v, P10.e + 0.3, P10.e + 0.6));
  const flame = after ? 1 : 1 - blow;
  const flash = after ? Math.max(0, 1 - (v - CAKE) / 0.35) : 0;
  return (
    <>
      <KitchenSet v={v} />
      <Chair position={GRAN_AT} rotation={0} color="#7a5232" />
      <Human o={GRANDPA} position={GRAN_AT} pose={grandpaPose(v, grump, blow)} head={<PartyHat on={1 - grump * 0.0} />} />
      <Cake position={CAKE_AT} digits={after ? ['6', '8'] : ['6', '6']} flame={flame} pop={flash} />
      {flash > 0 ? <Glow position={[CAKE_AT[0], CAKE_AT[1] + 0.3, CAKE_AT[2]]} size={1.6} color="#fff4c0" k={flash} /> : null}
      {/* a grandchild at the side, clapping */}
      <Stool position={[0.95, 0, 0.1]} h={0.45} />
      <Human o={kid(4)} position={[0.95, 0.0, 0.1]} rotation={-Math.PI / 2 - 0.3} pose={{sit: 1, armR: [-1.1, -0.2 + 0.15 * Math.sin(v * 14) * (1 - grump), 0], elbowR: -1.0, armL: [-1.1, -0.2 - 0.15 * Math.sin(v * 14) * (1 - grump), 0], elbowL: -1.0, face: {smile: 0.7 - grump, happy: 0.5, mouth: 0.3, lid: blink(v, 1) * 0.9}}} />
    </>
  );
};
const PartyHat: React.FC<{on: number}> = ({on}) => (
  <group position={[0.03, 0.16, 0]} rotation={[0, 0, -0.2]} scale={on}>
    <mesh position={[0, 0.08, 0]} castShadow>
      <coneGeometry args={[0.07, 0.17, 18]} />
      <meshStandardMaterial color="#3a8ad8" roughness={0.6} />
    </mesh>
    <mesh position={[0, 0.17, 0]}>
      <sphereGeometry args={[0.02, 12, 10]} />
      <meshStandardMaterial color="#ffd23f" roughness={0.6} />
    </mesh>
  </group>
);
export const cakeScene: Scene = {
  view: (v): View => mv(v, S('cake'), E('cake'), [1.0, 1.4, 1.75], [0.55, 1.3, 1.3], [0, 0.98, -0.2], [0, 1.0, -0.25], [48, 44], -0.25),
  shakes: [[CAKE, 0.2]],
  render: (v) => <CakeSet v={v} />,
};
export const grumpyScene: Scene = {
  view: (v): View => mv(v, S('grumpy'), E('grumpy'), [-0.75, 1.45, 0.55], [-0.62, 1.42, 0.42], [0, 1.18, -0.6], [0, 1.18, -0.6], [44, 40]),
  render: (v) => <CakeSet v={v} />,
};

// ======================================================================= 9. loopholes: the hero writes 66 + 1 on the board, hands go up

const LINES = ['66 + 1', '13 × 5 + 2', '134 : 2'];
const boardK = (v: number) => ramp(v, S('board') + 0.2, P14.e - 0.3);
const HERO_B: V3 = [0.5, 0, -1.45];
const chalk = (k: number): V3 => {
  const n = LINES.reduce((a, l) => a + l.length, 0);
  let c = k * n;
  let line = 0;
  while (line < LINES.length - 1 && c > LINES[line].length) {
    c -= LINES[line].length;
    line++;
  }
  const frac = Math.min(1, c / LINES[line].length);
  const w = LINES[line].length * 0.09;
  const y = 1.55 + 0.6 - 1.2 / (LINES.length + 0.6) * (line + 0.8);
  return [-w / 2 + frac * w, y, -1.9];
};
const BoardSet: React.FC<{v: number}> = ({v}) => {
  const k = boardK(v);
  const c = chalk(k);
  const wob = Math.sin(v * 22) * 0.01;
  const shock = ease(v, HANDS + 0.2, HANDS + 0.6);
  const hp: HumanPose = {head: [-0.1, 0, 0], lean: 0.02, face: {look: [0, 0.2], brow: 0.03, smile: 0.4, lid: blink(v, 4) * 0.9}};
  const pose = withArm(HERO, HERO_B, Math.PI, hp, 1, [c[0] + wob, c[1] + wob, c[2]]);
  const zp: HumanPose = {lean: -0.08 * shock, head: [-0.1, 0.5, 0], armL: [lerp(-0.2, -1.9, shock), 0.3, 0], elbowL: lerp(-0.4, -1.9, shock), armR: [lerp(-0.2, -1.9, shock), 0.3, 0], elbowR: lerp(-0.4, -1.9, shock), face: {wide: shock, o: shock, mouth: 0.6 * shock, brow: 0.07 * shock, browIn: 0.3 * shock, look: [0.4, 0.1], lid: blink(v, 8) * 0.9 * (1 - shock)}};
  return (
    <>
      <ClassSet board={LINES} boardK={k} />
      <Pupils v={v} hands={ramp(v, HANDS - 0.1, HANDS + 0.5)} skip={(r, c2) => r === 0 && c2 === 1} />
      <Human o={HERO} position={HERO_B} rotation={Math.PI} pose={pose} head={<BackCap />} handR={<Block position={[0, -0.03, 0.02]} size={[0.012, 0.06, 0.012]} color="#ffffff" />} />
      <Human o={ZAVUCH} position={[-2.1, 0, -1.45]} rotation={0.7} pose={zp} />
    </>
  );
};
export const boardScene: Scene = {
  view: (v): View => mv(v, S('board'), E('board'), [1.7, 1.5, 2.3], [1.0, 1.55, 1.3], [0.15, 1.4, -1.8], [0.1, 1.45, -1.8], [50, 46], 0.3),
  render: (v) => <BoardSet v={v} />,
};

// ======================================================================= 10. the news: «6,7»

export const newsScene: Scene = {
  view: (v): View => mv(v, S('news'), E('news'), [0.6, 1.45, 2.0], [-0.4, 1.55, 1.55], [-2.5, 1.6, 1.15], [-2.5, 1.6, 1.15], [44, 36], 0.2),
  render: (v) => (
    <>
      <KitchenSet v={v} tv />
      <Chair position={GRAN_AT} rotation={0} color="#7a5232" />
      <Human o={GRANDPA} position={GRAN_AT} rotation={-0.9} pose={{sit: 1, head: [0, 0.2, 0], face: {lid: blink(v, 2) * 0.9, browIn: -0.3, smile: -0.4, look: [0.3, 0]}}} />
    </>
  ),
};

export {walkPose, P11, P13};
