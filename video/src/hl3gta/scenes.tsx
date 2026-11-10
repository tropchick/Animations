import React from 'react';
import {Scene, blink, ease, ease5, mv} from '../bear/common';
import {Poof, Confetti} from '../cs2/Sets';
import {InteriorLights} from '../cs2/scenes1';
import {bounce} from '../nolan/scenes1';
import type {View} from '../slime/camera';
import {
  BILLION, COINS, FLASH, FLIP, GO, HOPS, KNOCKS, LAUNCH, LIGHTS, NOSE, POP, READY, SLIDE, SNORE, STEP3, V3, VOID, WIN, lerp, lerp3, ramp, rnd, shotEnd, shotStart,
} from './cues';
import {
  BOX, CAL, CalPage, CalStand, CashSofa, Checker, Coin, Cyl, DigitStep, DoorWall, Fence, FinishArch, Glow, LANE, Pipe, Podium, RBox, Racer, Ribbon, STEP, Sign, Stands, StartLights,
  Toast, Toaster, Track, Trees, Web, Block,
} from './Sets';

const S = shotStart;
const E = shotEnd;

const Outdoor: React.FC<{k?: number; box?: number}> = ({k = 1, box = 7}) => (
  <>
    <color attach="background" args={['#a8dcff']} />
    <fog attach="fog" args={['#c8e8ff', 14, 40]} />
    <InteriorLights key1={[4, 8, 6]} k={k} box={box} warm="#fff2dc" sky="#e8f6ff" ground="#5a8a50" />
  </>
);

// a hop: height of a parabola between t0 and t0 + dur
const hop = (v: number, t0: number, dur: number, h: number) => {
  const x = (v - t0) / dur;
  return x <= 0 || x >= 1 ? 0 : 4 * h * x * (1 - x);
};

// ======================================================================= hook: the start line

const lit = (v: number) => (v >= LIGHTS[2] ? 3 : v >= LIGHTS[1] ? 2 : v >= LIGHTS[0] ? 1 : 0);
const launchX = (v: number, a: number) => (v <= GO ? 0 : 0.5 * a * (v - GO) ** 2);
const rev = (v: number, seed: number) => (v < GO ? 1 + 0.025 * Math.sin(v * 46 + seed) : 1);

export const StartScene: React.FC<{v: number}> = ({v}) => {
  const xh = launchX(v, 4.6);
  const xg = launchX(v, 5.0);
  return (
    <>
      <Outdoor />
      <Track from={-14} to={30} />
      <Checker x={0.62} />
      <StartLights x={1.05} lit={lit(v)} />
      <Stands z={-4.2} from={-9} to={12} v={v} />
      <Trees z={-8} from={-14} to={20} seed={3} s={1.3} />
      <Fence z={2.1} from={-6} to={10} />
      <Racer kind="hl" position={[xh, 0, -LANE]} t={xh} squash={rev(v, 0)} lean={v > GO ? -0.08 * Math.exp(-(v - GO) * 2) : 0} look={[0.6, 0]} blink={blink(v, 1)} />
      <Racer kind="gta" position={[xg, 0, LANE]} t={xg} squash={rev(v, 2)} lean={v > GO ? -0.08 * Math.exp(-(v - GO) * 2) : 0} look={[0.6, 0]} blink={blink(v, 2)} />
      <Poof position={[-0.4, 0.15, -LANE]} t={v - GO} />
      <Poof position={[-0.4, 0.15, LANE]} t={v - GO - 0.05} />
    </>
  );
};
export const HOOK_VIEW = (v: number): View => mv(v, 0, E('hook'), [4.6, 1.5, 6.4], [4.0, 1.3, 5.6], [0.3, 1.05, 0], [0.6, 0.95, 0], [38, 40], 0.2);
export const hookScene: Scene = {
  view: HOOK_VIEW,
  shakes: [[GO, 0.35]],
  render: (v) => <StartScene v={v} />,
};

// ======================================================================= the race: side tracking, the lead swaps

const SPEED = 5.2;
const raceX = (v: number) => SPEED * (v - S('race'));
const P1_MID = (S('race') + E('race')) / 2;
const lead = (v: number) => lerp(0.75, -0.75, ease(v, P1_MID - 0.4, P1_MID + 0.6)); // > 0: HL3 ahead
export const raceScene: Scene = {
  view: (v): View => {
    const x = raceX(v);
    const k = ease(v, S('race'), E('race'));
    return {pos: [x + 0.4 - 0.6 * k, 2.0 - 0.2 * k, 6.0], target: [x, 0.75, 0], fov: 38, far: 200};
  },
  render: (v) => {
    const x = raceX(v);
    const l = lead(v);
    const bob = (s: number) => 1 + 0.02 * Math.sin(v * 30 + s);
    return (
      <>
        <Outdoor box={9} />
        <group position={[0, 0, 0]}>
          <Track from={-10} to={60} />
          <Stands z={-4.2} from={-10} to={60} v={v} />
          <Trees z={-8.5} from={-10} to={60} seed={7} s={1.4} />
          <Fence z={2.2} from={-10} to={60} />
          <Trees z={3.6} from={-6} to={60} seed={11} s={0.75} step={6.5} />
        </group>
        <Racer kind="hl" position={[x + l / 2, 0.02 * Math.abs(Math.sin(v * 15)), -LANE]} t={x} squash={bob(0)} lean={-0.05} look={[0.7, 0]} blink={blink(v, 3)} />
        <Racer kind="gta" position={[x - l / 2, 0.02 * Math.abs(Math.sin(v * 15 + 1)), LANE]} t={x} squash={bob(1)} lean={-0.05} look={[0.7, 0]} blink={blink(v, 4)} />
      </>
    );
  },
};

// ======================================================================= round 1a: HL3 on the digit stairs (can't reach the 3)

const HOP1 = S('stairsH') + 0.45;
const HOP2 = S('stairsH') + 1.1;
const LAND2 = SLIDE + 0.1;
const Stairs: React.FC<{digits: string[]; col: string[]; gone?: number}> = ({digits, col, gone = 0}) => (
  <>
    {digits.map((d, i) => (
      <group key={d} position={i === 2 ? [gone * 2.2, -gone * 0.3, -gone * 0.6] : [0, 0, 0]}>
        <DigitStep position={[0, 0, -i * STEP.d]} i={i} d={d} col={col[i]} />
      </group>
    ))}
  </>
);
const Room: React.FC<{wall: string; floor: string}> = ({wall, floor}) => (
  <>
    <color attach="background" args={[wall]} />
    <InteriorLights key1={[3, 7, 6]} k={1} box={5} warm="#fff2dc" sky="#f6f0ff" ground="#6a5a70" />
    <Block position={[1, -0.05, 0]} size={[16, 0.1, 10]} color={floor} look={{rough: 0.9}} />
    <Block position={[1, 3, -3.2]} size={[16, 6.2, 0.1]} color={wall} look={{rough: 1}} />
    {Array.from({length: 9}).map((_, i) => (
      <Block key={i} position={[-5 + i * 1.6, 0.01, 0]} size={[0.02, 0.012, 10]} color="#00000018" shadow={false} />
    ))}
  </>
);
const SZ = (i: number) => -i * STEP.d; // centre z of step i
const Z0 = 1.05; // start on the floor in front
const hlStair = (v: number): {p: V3; mood: 'open' | 'sad'; sq: number; look: [number, number]} => {
  const top = (i: number) => STEP.h * (i + 1);
  if (v < HOP1) return {p: [0, 0, Z0], mood: 'open', sq: 1, look: [0, 0.8]};
  if (v < HOP1 + 0.45) {
    const k = (v - HOP1) / 0.45;
    return {p: [0, lerp(0, top(0), k) + hop(v, HOP1, 0.45, 0.45), lerp(Z0, SZ(0), k)], mood: 'open', sq: 1, look: [0, 0.6]};
  }
  if (v < HOP2) return {p: [0, top(0), SZ(0)], mood: 'open', sq: bounce(v, HOP1 + 0.45), look: [0, 0.8]};
  if (v < HOP2 + 0.45) {
    const k = (v - HOP2) / 0.45;
    return {p: [0, lerp(top(0), top(1), k) + hop(v, HOP2, 0.45, 0.45), lerp(SZ(0), SZ(1), k)], mood: 'open', sq: 1, look: [0, 0.6]};
  }
  if (v < STEP3) return {p: [0, top(1), SZ(1)], mood: 'open', sq: bounce(v, HOP2 + 0.45), look: [0, 1]};
  // the jump for the 3: up and back... the step has gone; hang, look down, fall back onto the 2
  const up = STEP3 + 0.5;
  if (v < up) {
    const k = (v - STEP3) / 0.5;
    return {p: [0, top(1) + Math.sin(k * Math.PI * 0.5) * 0.6, lerp(SZ(1), SZ(2), k)], mood: 'open', sq: 1, look: [0, 0.6]};
  }
  if (v < LAND2 - 0.45) return {p: [0.03 * Math.sin(v * 20), top(1) + 0.6, SZ(2)], mood: 'open', sq: 1, look: [0, -1]};
  if (v < LAND2) {
    const k = (v - (LAND2 - 0.45)) / 0.45;
    return {p: [0, top(1) + 0.6 * (1 - k * k), lerp(SZ(2), SZ(1), k)], mood: 'open', sq: 1, look: [0, -1]};
  }
  return {p: [0, top(1), SZ(1)], mood: 'sad', sq: bounce(v, LAND2, 0.2) * 0.96, look: [0, -0.6]};
};
export const stairsHScene: Scene = {
  view: (v): View => mv(v, S('stairsH'), E('stairsH'), [1.2, 2.4, 6.6], [0.6, 2.7, 6.2], [0, 1.4, -0.7], [0, 1.75, -0.9], 40, 0.3),
  shakes: [[LAND2, 0.25]],
  render: (v) => {
    const h = hlStair(v);
    const gone = ease(v, STEP3 + 0.12, STEP3 + 0.45) * (1 - ease(v, LAND2 + 1.2, LAND2 + 2.0) * 0.55);
    return (
      <>
        <Room wall="#ffe2b8" floor="#e8b878" />
        <Stairs digits={['1', '2', '3']} col={['#5aa0e6', '#7fc46a', '#f0559a']} gone={gone} />
        <Racer kind="hl" position={h.p} scale={0.6} squash={h.sq} mood={h.mood} look={h.look} blink={h.mood === 'sad' ? 0 : blink(v, 5)} />
      </>
    );
  },
};

// ======================================================================= round 1b: GTA hops 5, 6, 7

const gtaStair = (v: number): {p: V3; sq: number; mood: 'open' | 'happy'} => {
  const top = (i: number) => STEP.h * (i + 1);
  let p: V3 = [0, 0, Z0];
  let sq = 1;
  for (let i = 0; i < 3; i++) {
    const t0 = HOPS[i] - 0.05;
    const fromZ = i === 0 ? Z0 : SZ(i - 1);
    const fromY = i === 0 ? 0 : top(i - 1);
    if (v >= t0 && v < t0 + 0.38) {
      const k = (v - t0) / 0.38;
      return {p: [0, lerp(fromY, top(i), k) + hop(v, t0, 0.38, 0.5), lerp(fromZ, SZ(i), k)], sq: 1.04, mood: 'happy'};
    }
    if (v >= t0 + 0.38) {
      p = [0, top(i), SZ(i)];
      sq = bounce(v, t0 + 0.38);
    }
  }
  return {p, sq, mood: v > HOPS[2] + 0.4 ? 'happy' : 'open'};
};
export const stairsGScene: Scene = {
  view: (v): View => mv(v, S('stairsG'), E('stairsG'), [-1.3, 2.2, 6.4], [-0.5, 2.9, 6.0], [0, 1.35, -0.6], [0, 1.85, -0.9], 40, -0.3),
  shakes: [[HOPS[2] + 0.33, 0.12]],
  render: (v) => {
    const g = gtaStair(v);
    return (
      <>
        <Room wall="#e8d8ff" floor="#b8a0e0" />
        <Stairs digits={['5', '6', '7']} col={['#ff8a1e', '#c83ad0', '#8a3cf0']} />
        <Racer kind="gta" position={g.p} scale={0.6} squash={g.sq} mood={g.mood} look={[0.6, 0.5]} blink={blink(v, 6)} />
        <Confetti center={[0, STEP.h * 3 + 1.2, SZ(2)]} t={v - HOPS[2] - 0.35} n={50} />
      </>
    );
  },
};

// ======================================================================= round 2a: the calendar runs to 2039, GTA 7 falls asleep

const yearAt = (v: number) => 2026 + Math.floor(13 * Math.min(1, Math.pow(ramp(v, FLIP[0], FLIP[1]), 0.8)) + 1e-6);
export const calendarScene: Scene = {
  view: (v): View => mv(v, S('calendar'), E('calendar'), [-0.5, 1.5, 6.6], [0.3, 1.35, 5.5], [0.1, 0.9, 0], [0.25, 0.85, 0], 40, 0.25),
  render: (v) => {
    const y = yearAt(v);
    const pages: React.ReactNode[] = [];
    // pages of the last few years flying off
    for (let yy = Math.max(2026, y - 3); yy < y; yy++) {
      const k = (yy - 2026 + 1) / 13;
      const t0 = FLIP[0] + (FLIP[1] - FLIP[0]) * Math.pow(k, 1 / 0.8);
      const t = v - t0;
      if (t < 0 || t > 1.6) continue;
      pages.push(
        <CalPage key={yy} year={yy} position={[-0.3 + t * 2.2, 1.55 + t * 1.3 - t * t * 0.6, 0.03 + t * 0.6]} rotation={[t * 1.6, t * 2.4, t * 3 + rnd(yy) * 0.5]} />,
      );
    }
    const sleep = ease(v, FLIP[1], SNORE);
    return (
      <>
        <Room wall="#ffe8cc" floor="#d8a870" />
        <CalStand position={[-0.3, 0, -0.4]} />
        <CalPage year={y} position={[-0.3, 1.55, -0.36]} />
        {pages}
        <Racer
          kind="gta"
          position={[0.62, 0, 0.6]}
          rotation={[0, -0.3, 0]}
          scale={0.62}
          mood={sleep > 0.5 ? 'sleep' : 'open'}
          squash={1 + (sleep > 0.5 ? 0.02 * Math.sin(v * 2.6) : 0)}
          lean={-0.12 * sleep}
          look={[-0.8, 0.6]}
          blink={blink(v, 7)}
        />
        <Glow position={[-0.3, 2.3, 0.2]} size={2.5} color="#fff4d0" k={0.25} />
      </>
    );
  },
};

// ======================================================================= round 2b: HL3 «99%», cobwebs and dust, proud

const DustyRoom: React.FC = () => (
  <>
    <color attach="background" args={['#3a3040']} />
    <InteriorLights key1={[2, 7, 5]} k={0.85} box={4} warm="#ffe0b8" sky="#d8d0e8" ground="#4a4050" />
    <pointLight position={[0, 3, 1.5]} color="#ffd8a0" intensity={3} distance={7} decay={1.6} />
    <Block position={[0, -0.05, 0]} size={[12, 0.1, 8]} color="#8a7a70" look={{rough: 1}} />
    <Block position={[0, 3, -1.2]} size={[12, 6.2, 0.1]} color="#5a5068" look={{rough: 1}} />
    <Web position={[-2.2, 3.0, -1.14]} s={1.1} />
    <Web position={[2.2, 3.0, -1.14]} rotation={[0, Math.PI, 0]} s={1.1} />
  </>
);
export const loadingScene: Scene = {
  view: (v): View => mv(v, S('loading'), E('loading'), [0.5, 1.3, 4.6], [-0.15, 1.25, 3.6], [0, 0.95, 0], [0, 0.95, 0], 40, 0.2),
  render: (v) => {
    const pct = 0.97 + 0.02 * ease(v, S('loading'), S('loading') + 1.5);
    const proud = ease(v, READY - 0.2, READY + 0.2);
    return (
      <>
        <DustyRoom />
        <Racer kind="hl" position={[0, 0, 0]} scale={0.9} squash={1 + 0.06 * proud * bounce(v, READY, 0.4)} mood="open" look={[0, 0.8 * proud]} blink={blink(v, 8)} />
        {/* dust and cobwebs on the box */}
        <Block position={[0, (BOX.lift + BOX.h) * 0.9 + 0.006, 0]} size={[BOX.w * 0.85, 0.012, BOX.d * 0.9 - 0.05]} color="#b8b0a8" shadow={false} />
        <Web position={[-BOX.w * 0.45 + 0.005, (BOX.lift + BOX.h) * 0.9 - 0.005, BOX.d * 0.45 + 0.02]} s={0.32} />
        <Web position={[BOX.w * 0.45 - 0.005, (BOX.lift + BOX.h) * 0.9 - 0.005, BOX.d * 0.45 + 0.02]} rotation={[0, Math.PI, 0]} s={0.32} />
        <Web position={[-0.8, 2.2, 0.12]} s={0.3} />
      </>
    );
  },
};

// ======================================================================= round 3a: HL3 lies on a sofa of cash, coins rain from a pipe

const NCOIN = 36;
export const sofaScene: Scene = {
  view: (v): View => mv(v, S('sofa'), E('sofa'), [0.9, 1.7, 6.4], [0.1, 1.55, 5.6], [0.15, 1.05, 0], [0.1, 1.0, 0], 40, -0.25),
  render: (v) => {
    const coins: React.ReactNode[] = [];
    for (let i = 0; i < NCOIN; i++) {
      const t0 = COINS + i * 0.11;
      const t = v - t0;
      if (t < 0) continue;
      const land = 0.62 + rnd(i * 3) * 0.12;
      const y0 = 2.05;
      const y = Math.max(land, y0 - 4.9 * t * t);
      const x = 0.35 + (rnd(i) - 0.5) * 0.7 + (y <= land ? (rnd(i * 5) - 0.5) * 0.4 : 0);
      const z = (rnd(i * 7) - 0.5) * 0.4;
      coins.push(<Coin key={i} position={[x, y + (y <= land ? 0.55 : 0), z]} rotation={y <= land ? [0.1 * rnd(i), 0, 0.2 * rnd(i * 2)] : [t * 9 + i, 0, t * 6]} />);
    }
    return (
      <>
        <Room wall="#d8f0d0" floor="#a8c890" />
        <CashSofa position={[0, 0, -0.2]} />
        <Racer kind="hl" position={[0.95, 0.8, 0.02]} rotation={[0, 0, Math.PI / 2]} scale={0.8} mood="sleep" squash={1 + 0.015 * Math.sin(v * 2.2)} />
        <Pipe position={[0.35, 2.05, 0]} />
        {coins}
      </>
    );
  },
};

// ======================================================================= round 3b: a tower of cash; GTA rolls down a ramp from the top

const TOWER_H = 3.2;
const towerH = (v: number) => TOWER_H * ease5(v, S('tower'), BILLION - 0.1);
const RAMP_LEN = 5.2;
const RAMP_A = Math.atan2(TOWER_H, 4.6);
const rampK = (v: number) => Math.pow(ramp(v, LAUNCH, LAUNCH + 1.3), 1.6);
export const towerScene: Scene = {
  view: (v): View => {
    if (v < LAUNCH) return mv(v, S('tower'), BILLION, [2.6, 0.6, 5.6], [2.8, 2.6, 6.6], [0.3, 0.9, 0], [0.3, 2.9, 0], 42, 0.4);
    const k = rampK(v);
    const bx = 0.35 + Math.cos(RAMP_A) * RAMP_LEN * k;
    const by = TOWER_H - Math.sin(RAMP_A) * RAMP_LEN * k;
    const tgt: V3 = [lerp(0.3, bx, ease(v, LAUNCH, LAUNCH + 0.4)), lerp(2.9, by + 0.4, ease(v, LAUNCH, LAUNCH + 0.4)), 0];
    return {pos: [tgt[0] + 2.2, tgt[1] + 0.5, 6.4], target: tgt, fov: 42, far: 200};
  },
  render: (v) => {
    const h = towerH(v);
    const rows = Math.floor(h / 0.1);
    const k = rampK(v);
    const onTop = v < LAUNCH;
    const bx = onTop ? 0 : 0.35 + Math.cos(RAMP_A) * RAMP_LEN * k;
    const by = onTop ? h : TOWER_H - Math.sin(RAMP_A) * RAMP_LEN * k;
    return (
      <>
        <Outdoor box={8} />
        <Block position={[0, -0.05, 0]} size={[30, 0.1, 30]} color="#7ccf6a" look={{rough: 1}} />
        <Trees z={-6} from={-10} to={14} seed={5} s={1.3} />
        {Array.from({length: rows}).map((_, i) => (
          <group key={i} position={[0, 0.05 + i * 0.1, 0]} rotation={[0, (i % 2) * 0.04 - 0.02, 0]}>
            <RBox size={[1.1, 0.098, 0.56]} r={0.015} color="#6cc46a" look={{rough: 0.8}} />
            <Block size={[0.12, 0.1, 0.565]} color="#f4e8b0" shadow={false} />
          </group>
        ))}
        {/* the ramp from the top edge down to the right */}
        {v > BILLION - 0.2 ? (
          <group position={[0.55, TOWER_H, 0]} rotation={[0, 0, -RAMP_A]}>
            <Block position={[RAMP_LEN / 2, -0.03, 0]} size={[RAMP_LEN, 0.06, 0.8]} color="#c8955e" />
          </group>
        ) : null}
        <Racer kind="gta" position={[bx, by, 0]} rotation={[0, 0, onTop ? 0 : -RAMP_A]} scale={0.62} t={k * RAMP_LEN} mood="happy" look={[0.8, -0.3]} squash={onTop ? bounce(v, BILLION, 0.08) : 1} />
        {v > BILLION ? <Glow position={[0, TOWER_H + 1.2, 0.2]} size={3} color="#ffe27a" k={0.5 * Math.exp(-(v - BILLION) * 1.5)} /> : null}
      </>
    );
  },
};

// ======================================================================= round 4a: GTA 7 knocks at the locked «next-gen console» door

const DOOR_X = 1.05;
export const doorScene: Scene = {
  view: (v): View => mv(v, S('door'), E('door'), [-2.6, 1.5, 5.2], [-2.0, 1.4, 4.5], [0.6, 1.2, 0.55], [0.55, 1.15, 0.55], 42, 0.15),
  shakes: KNOCKS.map((k) => [k + 0.05, 0.06] as [number, number]),
  render: (v) => {
    const arrive = ease(v, S('door'), KNOCKS[0] - 0.4);
    let x = lerp(-2.6, 0.32, arrive);
    let lean = 0;
    for (const k of KNOCKS) {
      const t = v - k + 0.12;
      if (t > 0 && t < 0.3) {
        const s = Math.sin((t / 0.3) * Math.PI);
        x += 0.12 * s;
        lean = -0.14 * s;
      }
    }
    const after = v > KNOCKS[2] + 0.5;
    return (
      <>
        <Room wall="#ffe2ee" floor="#c8a0b8" />
        <group position={[DOOR_X, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <DoorWall position={[0, 0, 0]} />
          <Sign position={[1.3, 1.55, 0.06]} w={1.0} h={0.95} text={'ПРИСТАВКА\nНОВОГО\nПОКОЛЕНИЯ:\nСКОРО'} bg="#2a1f3a" size={0.17} k="sign-nextgen" />
          <Web position={[-0.6, 2.13, 0.06]} s={0.35} />
        </group>
        <Racer kind="gta" position={[x, 0, 0]} scale={0.65} t={x} lean={lean} mood={after ? 'sad' : 'open'} look={[1, 0.3]} blink={blink(v, 9)} />
      </>
    );
  },
};

// ======================================================================= round 4b: HL3 runs on a toaster

const JUMP = POP + 0.5;
export const toasterScene: Scene = {
  view: (v): View => mv(v, S('toaster'), E('toaster'), [0.8, 1.5, 6.4], [0.4, 1.7, 5.8], [-0.55, 0.75, 0], [0.0, 0.9, 0], 42, 0.2),
  shakes: [[JUMP + 0.45, 0.15]],
  render: (v) => {
    const up = ease(v, POP, POP + 0.15);
    const tFly = v - POP;
    let p: V3;
    if (v < JUMP) p = [lerp(-2.4, -1.1, ease(v, S('toaster'), POP - 0.1)), 0, 0];
    else if (v < JUMP + 0.45) {
      const k = (v - JUMP) / 0.45;
      p = [lerp(-1.1, -0.2, k), lerp(0, 1.06, k) + hop(v, JUMP, 0.45, 0.6), 0];
    } else p = [-0.2 + 1.6 * (v - JUMP - 0.45), 1.06, 0];
    return (
      <>
        <Room wall="#fff0c8" floor="#d8b080" />
        <Toaster position={[0, 0, 0]} pop={up} />
        <Toast position={[-0.32 + Math.max(0, tFly) * 0.6 * (tFly > 0 ? 1 : 0), 1.0 + 0.55 * up + Math.max(0, tFly > 0.15 ? 1.4 * (tFly - 0.15) - 2.2 * (tFly - 0.15) ** 2 : 0), -0.2]} rotation={[0, 0, tFly > 0.15 ? -(tFly - 0.15) * 1.5 : 0]} />
        <Toast position={[0.15, 1.0 + 0.62 * up, 0.2]} screen />
        <Racer kind="hl" position={p} scale={0.55} t={p[0]} mood="happy" look={[0.7, 0.2]} squash={bounce(v, JUMP + 0.45, 0.15)} />
      </>
    );
  },
};

// ======================================================================= the finish: slow motion to the ribbon

export const FINISH_X = 0;
// front edges (x + w/2) at the ribbon at FLASH; HL3 a nose ahead
const finX = (v: number, ahead: number) => FINISH_X - BOX.w / 2 + ahead - 1.3 * (FLASH - Math.min(v, FLASH));
export const FinishSet: React.FC<{v: number}> = ({v}) => {
  const xh = finX(v, 0.05);
  const xg = finX(v, 0);
  return (
    <>
      <Outdoor box={8} />
      <Track from={-20} to={20} />
      <Checker x={FINISH_X + 0.2} />
      <FinishArch x={FINISH_X} />
      <Ribbon x={FINISH_X} broken={v > FLASH ? 1 : 0} />
      <Stands z={-4.2} from={-10} to={10} v={v} />
      <Trees z={-8.5} from={-14} to={14} seed={9} s={1.4} />
      <Racer kind="hl" position={[xh, 0, -LANE]} t={xh} lean={-0.05} look={[0.8, 0]} />
      <Racer kind="gta" position={[xg, 0, LANE]} t={xg} lean={-0.05} look={[0.8, 0]} />
    </>
  );
};
export const finishScene: Scene = {
  view: (v): View => mv(v, S('finish'), E('finish'), [3.4, 2.4, 5.0], [2.6, 1.9, 4.0], [-1.8, 0.7, 0.6], [-0.7, 0.75, 0.6], 40, 0.2),
  render: (v) => <FinishSet v={Math.min(v, FLASH)} />,
};

// ======================================================================= the photo: frozen at the line, from above

export const photoScene: Scene = {
  view: (v): View => mv(v, S('photo'), E('photo'), [1.9, 3.0, 2.6], [1.35, 2.5, 1.4], [-0.2, 0.7, 0], [-0.1, 0.9, -0.1], 40, 0.1),
  noHandheld: true,
  render: () => <FinishSet v={FLASH} />,
};

// ======================================================================= the reveal: the small print on the HL3 cover

const TEXT_Y = BOX.lift + BOX.h / 2 + (BOX.h - 0.06) * (0.5 - 0.262);
export const revealScene: Scene = {
  view: (v): View => {
    if (v < VOID) return mv(v, S('reveal'), VOID - 0.2, [0.15, 1.0, 2.6], [0, TEXT_Y, 0.78], [0, 0.85, 0], [0, TEXT_Y, 0], [40, 36]);
    return mv(v, VOID, E('reveal'), [0, TEXT_Y, 0.78], [0.1, TEXT_Y - 0.05, 1.5], [0, TEXT_Y, 0], [0, TEXT_Y - 0.1, 0], 36);
  },
  shakes: [[VOID, 0.2]],
  render: (v) => (
    <>
      <Outdoor box={5} />
      <Track from={-10} to={10} />
      <Stands z={-4.2} from={-6} to={6} v={v} />
      <Racer kind="hl" position={[0, 0, 0]} mood={v > VOID ? 'sad' : 'open'} look={[0, -0.4]} blink={blink(v, 10)} />
    </>
  ),
};

// ======================================================================= podium: GTA 7 wins (in 2039)

export const podiumScene: Scene = {
  view: (v): View => mv(v, S('podium'), E('podium'), [0.8, 2.0, 7.4], [-0.4, 2.2, 6.6], [-0.3, 1.25, 0], [-0.2, 1.3, 0], 42, 0.4),
  render: (v) => (
    <>
      <Outdoor box={6} />
      <Block position={[0, -0.05, 0]} size={[30, 0.1, 30]} color="#7ccf6a" look={{rough: 1}} />
      <Stands z={-4.0} from={-8} to={8} v={v} />
      <Trees z={-8} from={-12} to={12} seed={13} s={1.3} />
      <Podium />
      <Racer kind="gta" position={[0, 1.2, 0]} scale={0.7} mood="happy" squash={bounce(v, WIN + 0.15, 0.12)} look={[0, 0.4]} t={0} />
      <Racer kind="hl" position={[-1.25, 0.8, 0]} scale={0.62} mood="sad" look={[0.4, -0.6]} />
      <Confetti center={[0, 3.6, 0.3]} t={v - WIN - 0.1} n={90} />
      <Confetti center={[-1.5, 3.2, 0.3]} t={v - WIN - 0.4} n={40} seed={9} />
      <Confetti center={[1.5, 3.2, 0.3]} t={v - WIN - 0.6} n={40} seed={17} />
    </>
  ),
};

export {Cyl, CAL, lerp3, NOSE, Glow};
