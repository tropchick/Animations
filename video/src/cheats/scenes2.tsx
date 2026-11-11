import React from 'react';
import {Human, HumanPose} from '../bear/People';
import {Pic, Table} from '../bear/Props';
import {Office} from '../bear/Sets';
import {Ball, Block, Cyl, Glow, RBox} from '../bear/kit';
import {Scene, blink, ease, ease5, mv} from '../bear/common';
import {InteriorLights} from '../cs2/scenes1';
import type {View} from '../slime/camera';
import {BANNER, CODES, GRANNY, LIFT, POP, TEAR, V3, clamp01, lerp, ramp, rnd, shotEnd, shotStart, typedText} from './cues';
import {BED, BOSS, Bar, BillsOnGround, Car, Cloud, Fat, Flowerbed, Granny, HERO, ROAD_Y, Stall, TrafficLight, WORKER, walker} from './Sets';
import {BigPhone, StreetSet, Thumb, keyboardDraw, phonePose, withArm} from './common';
import {drawBanner, drawSickNote} from './tex';
import {KID_AT, parkedCar} from './scenes1';

const S = shotStart;
const E = shotEnd;

// ======================================================================= Wednesday: cars take off

const ROAD_CARS: {x: number; z: number; i: number; d: number}[] = [
  {x: -7, z: -1.3, i: 0, d: 0},
  {x: -2.2, z: -1.3, i: 3, d: 0.25},
  {x: 2.8, z: -1.3, i: 1, d: 0.12},
  {x: -4.5, z: 1.4, i: 5, d: 0.35},
  {x: 0.6, z: 1.4, i: 6, d: 0.05},
  {x: 5.5, z: 1.4, i: 2, d: 0.4},
];
const LiftSet: React.FC<{v: number}> = ({v}) => {
  const pc = parkedCar(v);
  return (
    <>
      <StreetSet center={[0, 0, -2]} box={10} />
      <Stall price={3} cash={1} />
      <Flowerbed crush={1} />
      <Car position={pc.p} yaw={pc.yaw} i={2} />
      <BillsOnGround area={[-9, 7, -7, -3.4]} n={100} seed={5} />
      {ROAD_CARS.map((c, i) => {
        const t = Math.max(0, v - LIFT - c.d);
        const up = t * t * 2.2 + t * 1.5;
        return <Car key={i} position={[c.x + t * 1.2, ROAD_Y + up, c.z]} i={c.i} pitch={Math.min(0.25, t * 0.15) * (i % 2 ? 1 : -1)} roll={Math.sin(t * 2 + i) * 0.06 * Math.min(1, t)} wheels={v * 12} />;
      })}
      {[[-3.4, -4.9], [0.4, -5.2], [1.8, -4.5]].map(([x, z], i) => (
        <Human key={i} o={walker(i + 2)} position={[x, 0, z]} rotation={0.2} pose={{head: [-0.6, 0, 0], face: {mouth: 0.6, o: 0.8, wide: 0.8, look: [0, 0.5]}, armR: [-0.6, 0.3, 0], elbowR: -0.5}} />
      ))}
    </>
  );
};
export const liftScene: Scene = {
  view: (v): View => mv(v, S('lift'), E('lift'), [-16, 1.4, 0.3], [-15.2, 1.3, 0.3], [0, 2.6, 0], [0, 4.8, 0], [46, 48]),
  render: (v) => <LiftSet v={v} />,
};

// traffic jam in the sky, a traffic light on a cloud
const SKY_Y = 17;
const JAM: {x: number; z: number; i: number}[] = Array.from({length: 11}, (_, i) => ({x: -15 + i * 4.3 + rnd(i) * 0.6, z: (i % 2 ? -1.6 : 0.9) + rnd(i * 3) * 0.4, i}));
const SkyJam: React.FC<{v: number; creep?: number}> = ({v, creep = 0.4}) => (
  <>
    {JAM.map((c) => (
      <Car key={c.i} position={[c.x + v * creep, SKY_Y + Math.sin(v * 1.4 + c.i) * 0.12, c.z]} i={c.i} pitch={0.03 * Math.sin(v + c.i)} />
    ))}
    <Cloud position={[3.2, SKY_Y - 1.3, -4]} scale={1.3} />
    <group position={[3.2, SKY_Y - 0.4, -3.4]}>
      <Cyl position={[0, 0.9, 0]} rt={0.06} rb={0.06} h={1.8} seg={10} color="#3a3e48" />
      <TrafficLight position={[0, 2.2, 0]} on={Math.floor(v * 0.6) % 2 === 0 ? 0 : 2} />
    </group>
    <Cloud position={[-8, SKY_Y - 2.0, -7]} scale={1.6} />
    <Cloud position={[11, SKY_Y + 1.5, -9]} scale={1.4} />
    <Cloud position={[-2, SKY_Y + 4, -14]} scale={2.0} />
  </>
);
const SkySet: React.FC<{v: number}> = ({v}) => (
  <>
    <StreetSet center={[0, SKY_Y - 4, -2]} box={14} noTrees />
    <SkyJam v={v} />
  </>
);
export const jamScene: Scene = {
  view: (v): View => mv(v, S('jam'), E('jam'), [-6, SKY_Y + 1.6, 9], [-2.5, SKY_Y + 1.0, 8.2], [0.5, SKY_Y, -1], [1.8, SKY_Y + 0.2, -1.5], [50, 48], 0.6),
  render: (v) => <SkySet v={v} />,
};

// the granny flies past the camera, overtaking the jam
const grannyAt = (v: number): V3 => {
  const k = ease5(v, GRANNY - 1.1, GRANNY + 1.4);
  return [lerp(5, -5, k), SKY_Y + 0.3 + Math.sin(v * 3) * 0.08, lerp(5.4, 5.0, k)];
};
export const grannyScene: Scene = {
  view: (v): View => {
    const g = grannyAt(v);
    const k = ease(v, S('granny'), E('granny'));
    return {pos: [lerp(1.0, -0.6, k), SKY_Y + 1.25, 8.4], target: [g[0] * 0.8, g[1] + 0.75, g[2]], fov: 44, far: 300};
  },
  render: (v) => {
    const g = grannyAt(v);
    return (
      <>
        <SkySet v={v} />
        <Granny position={g} rotation={-Math.PI / 2} tilt={0} v={v} pose={{lean: 0.5, head: [-0.3, -0.4, 0], armL: [-0.4, 0.7, 0], elbowL: -0.3, armR: [-0.9, 0.3, 0], elbowR: -0.6, legL: 0.2, legR: 0.45, kneeL: 0.5, kneeR: 0.7, face: {smile: 0.9, happy: 0.7, mouth: 0.25, lid: blink(v, 5) * 0.9}}} />
      </>
    );
  },
};

// ======================================================================= Thursday: health bars that never drop

const BAR_PEOPLE: {p: V3; yaw: number; i: number}[] = [
  {p: [-3.6, 0, -4.6], yaw: 0.3, i: 0},
  {p: [-1.4, 0, -5.2], yaw: -0.2, i: 1},
  {p: [0.6, 0, -4.4], yaw: 0.1, i: 3},
  {p: [2.4, 0, -5.4], yaw: -0.4, i: 4},
];
export const BONK = CODES[4].on + 0.9;
const BarsSet: React.FC<{v: number}> = ({v}) => {
  const on = ease(v, CODES[4].on - 0.1, CODES[4].on + 0.3);
  // a flowerpot falls on the third man's head, bounces off; his bar blinks and stays full
  const m = BAR_PEOPLE[2];
  const fall = v < BONK ? lerp(9, 1.72, clamp01(1 - (BONK - v) / 0.6) ** 2) : 1.72 + (v - BONK) * 1.6 - (v - BONK) ** 2 * 6;
  const potX = m.p[0] + (v > BONK ? (v - BONK) * 1.2 : 0);
  const dizzy = v > BONK ? Math.max(0, 1 - (v - BONK) / 1.2) : 0;
  const blinkBar = v > BONK && v < BONK + 0.5 && Math.floor((v - BONK) * 12) % 2 === 0;
  return (
    <>
      <StreetSet center={[-0.5, 0, -4]} box={7} />
      <Stall price={3} cash={1} />
      <Flowerbed crush={1} />
      <BillsOnGround area={[-9, 7, -7, -3.4]} n={100} seed={5} />
      {BAR_PEOPLE.map((b, i) => {
        const o = walker(b.i);
        const pose: HumanPose = i === 2 ? {head: [0.1 + dizzy * 0.2, 0, Math.sin(v * 14) * 0.15 * dizzy], face: {lid: 0.2 + dizzy * 0.3, look: [Math.sin(v * 10) * dizzy, 0], smile: 0.6 - dizzy * 0.6, mouth: dizzy * 0.4}} : {face: {smile: 0.6, happy: 0.4, lid: blink(v, i) * 0.9}, head: [0, 0.2 * Math.sin(v + i), 0]};
        return (
          <React.Fragment key={i}>
            <Human o={o} position={b.p} rotation={b.yaw} pose={pose} />
            {on > 0 && !(i === 2 && blinkBar) ? (
              <group position={[b.p[0], 1.92 * (o.scale ?? 1), b.p[2]]} scale={on}>
                <Bar position={[0, 0, 0]} hp={1} w={0.5} k={`b${i}`} />
              </group>
            ) : null}
          </React.Fragment>
        );
      })}
      {fall > 0.05 && v < BONK + 0.8 ? (
        <group position={[potX, fall, m.p[2]]} rotation={[0, 0, v > BONK ? (v - BONK) * 8 : 0]}>
          <Cyl position={[0, 0.1, 0]} rt={0.12} rb={0.09} h={0.2} seg={16} color="#c8643a" />
          <Ball position={[0, 0.26, 0]} scale={[0.12, 0.1, 0.12]} color="#3aa04a" />
        </group>
      ) : null}
      {dizzy > 0 ? (
        <group position={[m.p[0], 1.95, m.p[2]]} rotation={[0, v * 6, 0]}>
          {[0, 1, 2].map((k) => (
            <Ball key={k} position={[Math.cos((k * Math.PI * 2) / 3) * 0.2, 0, Math.sin((k * Math.PI * 2) / 3) * 0.2]} scale={0.04 * dizzy} color="#ffd23f" look={{basic: true}} shadow={false} />
          ))}
        </group>
      ) : null}
    </>
  );
};
export const barsScene: Scene = {
  view: (v): View => mv(v, S('bars'), E('bars'), [-0.6, 1.6, -0.9], [-0.2, 1.62, -1.3], [-0.6, 1.3, -4.9], [0.2, 1.35, -4.7], [56, 52], 0.3),
  shakes: [[BONK, 0.15]],
  render: (v) => <BarsSet v={v} />,
};

// the office: the boss points at the full bar and tears the sick note
const BOSS_AT: V3 = [0.1, 0, -0.9];
const WORKER_AT: V3 = [1.45, 0, -0.5];
const WORKER_YAW = -1.85;
const Note: React.FC<{half?: -1 | 1; k?: string}> = ({half, k = 'note'}) => (
  <Pic position={[half ? half * 0.045 : 0, 0, 0]} size={[half ? 0.09 : 0.18, 0.24]} res={[half ? 120 : 240, 320]} k={`${k}-${half ?? 0}`} draw={(g, W, H) => {
    if (!half) return drawSickNote(g, W, H);
    g.save();
    if (half === 1) g.translate(-W, 0);
    drawSickNote(g, W * 2, H);
    g.restore();
  }} />
);
const OfficeSet: React.FC<{v: number}> = ({v}) => {
  const give = ease(v, S('office') + 0.1, S('office') + 0.7);
  const torn = v >= TEAR;
  const tt = Math.max(0, v - TEAR);
  const notePos: V3 = [lerp(1.1, 0.75, give), 1.08, lerp(-0.45, -0.6, give)];
  const point = ease(v, S('office') + 0.6, TEAR - 0.6);
  const bossPose = withArm(
    BOSS,
    BOSS_AT,
    0,
    {sit: 1, lean: 0.1, head: [lerp(0.1, -0.35, point), 0, 0], armL: [-1.2, 0.1, 0], elbowL: -0.6, face: {tilt: 0.4, brow: -0.03, browIn: -0.3, lid: blink(v, 2) * 0.8 + 0.15, smile: -0.3 + (torn ? 0.6 : 0)}},
    1,
    torn ? [0.62, 1.12, -0.62] : point < 0.98 ? [0.6, 1.05, -0.62] : [0.75, 1.55, -0.6],
  );
  return (
    <>
      <color attach="background" args={['#cfd8e6']} />
      <InteriorLights key1={[2, 5, 4]} k={0.95} box={4} />
      <Office />
      <Human o={BOSS} position={BOSS_AT} pose={bossPose} />
      <Human o={WORKER} position={WORKER_AT} rotation={WORKER_YAW} pose={withArm(WORKER, WORKER_AT, WORKER_YAW, {lean: 0.05, head: [0.15, 0, 0], face: {browIn: 0.4, brow: 0.02, mouth: torn ? 0.5 : 0.1, o: torn ? 0.6 : 0, lid: blink(v, 7) * 0.8}}, 1, [notePos[0] + 0.12, notePos[1] - 0.05, notePos[2] + 0.04])} />
      <group position={[WORKER_AT[0] - 0.12, 1.86, WORKER_AT[2]]} rotation={[0, -0.12, 0]}>
        <Bar position={[0, 0, 0]} hp={1} w={0.42} k="wb" />
      </group>
      {!torn ? (
        <group position={notePos} rotation={[-0.15, 0.5, 0]}>
          <Note />
        </group>
      ) : (
        ([-1, 1] as const).map((s) => (
          <group key={s} position={[notePos[0] + s * (0.05 + tt * 0.25), Math.max(0.78, notePos[1] - tt * tt * 3), notePos[2] + tt * 0.1]} rotation={[-0.2 + tt * 2, 0, s * tt * 3]}>
            <Note half={s} />
          </group>
        ))
      )}
    </>
  );
};
export const officeScene: Scene = {
  view: (v): View => mv(v, S('office'), E('office'), [1.05, 1.6, 2.9], [0.9, 1.55, 2.6], [0.85, 1.25, -0.7], [0.85, 1.25, -0.7], [50, 48], 0.2),
  render: (v) => <OfficeSet v={v} />,
};

// ======================================================================= Friday: the thumb misses, everyone turns round

const TH_AT: V3 = [-2.6, 1.0, -4.05];
const thumbKeys = (): [number, string][] => CODES[5].keys.map((t, i) => [t, CODES[5].text[i]]);
export const thumbScene: Scene = {
  view: (v): View => mv(v, S('thumb'), E('thumb'), [-2.6, 1.42, -4.25], [-2.6, 1.38, -4.235], [-2.6, 0.985, -4.08], [-2.6, 0.985, -4.08], [40, 38]),
  noHandheld: true,
  render: (v) => {
    const text = typedText(5, v);
    const keys = thumbKeys();
    const hi = keys.filter(([t]) => v >= t && v < t + 0.12).map(([, c]) => c)[0] ?? '';
    const ok = v >= CODES[5].on ? 1 : 0;
    const kb = keyboardDraw(text, hi, ok);
    return (
      <>
        <StreetSet center={[-2, 0, -4]} />
        <group position={TH_AT} rotation={[0, Math.PI, 0]}>
          <group rotation={[-Math.PI / 2 + 0.45, 0, 0]}>
          <BigPhone position={[0, 0, 0]} k={kb.key} draw={kb.draw} />
          <Thumb v={v} keys={keys} skin={HERO.skin} miss={0.4} />
          </group>
        </group>
      </>
    );
  },
};

// the round street: people pop into balls and roll away down the road
const ROUNDERS: {p: V3; yaw: number; i: number; dir: number}[] = [
  {p: [-3.3, 0, -4.7], yaw: 0.3, i: 0, dir: 1},
  {p: [-1.2, 0, -5.4], yaw: -0.2, i: 1, dir: 1},
  {p: [0.9, 0, -4.4], yaw: 0.2, i: 3, dir: 1},
  {p: [2.8, 0, -5.2], yaw: -0.3, i: 4, dir: 1},
  {p: [-5.6, 0, -5.0], yaw: 0.5, i: 5, dir: 1},
];
export const fatK = (v: number) => ease(v, POP, POP + 0.25) * (1 + 0.12 * Math.sin(Math.min(1, (v - POP) / 0.6) * Math.PI * 3) * (v > POP && v < POP + 0.6 ? 1 : 0));
const RoundSet: React.FC<{v: number; roll?: boolean}> = ({v, roll = true}) => {
  const k = fatK(v);
  const go = roll ? Math.max(0, v - POP - 0.5) : 0;
  return (
    <>
      <StreetSet center={[0, 0, -4]} box={9} />
      <Stall price={3} cash={1} />
      <Flowerbed crush={1} />
      <BillsOnGround area={[-9, 7, -7, -3.4]} n={100} seed={5} />
      {ROUNDERS.map((r, i) => {
        const o = walker(r.i);
        const dx = go * go * 0.5 + go * 0.5;
        const rr = 0.5 * (o.scale ?? 1);
        return <Fat key={i} o={o} position={[r.p[0] + dx * r.dir, 0, r.p[2] + Math.min(dx * 0.1, 0.6)]} rotation={r.yaw * (1 - Math.min(1, go))} k={k} roll={dx / rr} pose={{face: {wide: 0.8 * k, mouth: 0.4 * k, o: k, brow: 0.05 * k}}} />;
      })}
      <Fat o={HERO} position={[KID_AT[0] + Math.max(0, go - 0.3) * 1.2, 0, KID_AT[2] + 0.4]} k={k} roll={(Math.max(0, go - 0.3) * 1.2) / 0.39} pose={{face: {wide: k, mouth: 0.5 * k, o: k}}} />
    </>
  );
};
export const roundScene: Scene = {
  view: (v): View => mv(v, S('round'), E('round'), [-0.9, 2.2, 3.4], [0.3, 2.0, 3.1], [-1.2, 0.8, -5.0], [0.6, 0.7, -5.0], [58, 58]),
  shakes: [[POP, 0.2]],
  render: (v) => <RoundSet v={v} />,
};

// ======================================================================= Saturday: the system message in the sky

const BANNER_AT: V3 = [0, 10.5, -10];
const BannerSet: React.FC<{v: number}> = ({v}) => {
  const k = ease(v, BANNER, BANNER + 0.5);
  const s = k < 1 ? 0.6 + 0.4 * k + Math.sin(k * Math.PI) * 0.08 : 1;
  return (
    <>
      <StreetSet center={[0, 0, -4]} box={9} />
      <Stall price={3} cash={1} />
      <Flowerbed crush={1} />
      <BillsOnGround area={[-9, 7, -7, -3.4]} n={100} seed={5} />
      {ROUNDERS.slice(0, 4).map((r, i) => (
        <Fat key={i} o={walker(r.i)} position={[r.p[0] * 0.8, 0, r.p[2] + 1.2]} rotation={Math.PI + 0.2 * (i - 1.5)} k={1} pose={{head: [-0.55, 0, 0], face: {wide: 0.6, mouth: 0.4, o: 0.6, look: [0, 0.5]}}} />
      ))}
      {k > 0 ? (
        <group position={BANNER_AT} scale={s}>
          <Pic position={[0, 0, 0]} rotation={[0.35, 0, 0]} size={[10.6, 3.6]} res={[1300, 440]} k="banner" draw={drawBanner} lit={false} glow={1.1} transparent />
          <Glow position={[0, 0, -0.5]} size={18} color="#7cff9a" k={0.25 * k} />
        </group>
      ) : null}
    </>
  );
};
export const bannerScene: Scene = {
  view: (v): View => mv(v, S('banner'), E('banner'), [0.2, 0.9, 4.6], [0.0, 0.8, 5.4], [0, 4, -8], [0, 8.2, -10], [58, 62]),
  render: (v) => <BannerSet v={v} />,
};

export {SkySet, BannerSet, RoundSet, BED, Block, RBox, ramp, typedText, phonePose, HERO};
