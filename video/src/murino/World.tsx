import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {CameraRig, View} from '../slime/camera';
import {useEnvironment} from '../slime/World';
import {Spot} from '../last/parts';
import {
  CALL, CHAIN, CHASE, CODE, DOUBLE, FLICKER, LAMP_BLINK, LAND, LIFT_OPEN, PASS, SLAM, Shot, THROW, V3, add3, lerp, ramp, shotAt, shotStart,
  smooth, wordStart,
} from './cues';
import {viewAt} from './camera';
import {COURIER, CUSTOMER, Human, LONG, NEIGHBOUR, Pose, bob, double, stride} from './people';
import {OrderBag, Phone, SauceCup} from './props';
import {ENTRANCE_LAMP, Outside} from './Outside';
import {Lift} from './Lift';
import {Well} from './Well';
import {CORR_LAMPS, Corridor, FLICKER_LAMP, LAND_LAMP, LONG_LAMP, Landing, corrLamp} from './Halls';
import {CORR, CUSTOMER_AT, DOUBLE_AT, EXT, LAND as LAND_SET, LIFT, LONG_AT, WELL, WELL_BASE_SCENE} from './places';
import {
  WALK0, bagGone, courierCorrA, courierCorrB, courierLand, courierN, cupAt, fogTopN, fogTopWell, growAt, neighbourN, neighbourRunning, neighbourSit,
  onStairs, openA, openB, passAt, wellI,
} from './action';

// ---------------------------------------------------------------- which set each shot uses, its fog and light

type SetName = 'ext' | 'lift' | 'well' | 'corr' | 'land' | 'none';
const SET_OF: Record<Shot, SetName> = {
  title: 'ext',
  order: 'ext',
  lift: 'lift',
  well: 'well',
  long: 'corr',
  neighbor: 'well',
  doors: 'land',
  twins: 'land',
  grow: 'land',
  app: 'land',
  end: 'none',
};
const FOG: Record<SetName, [string, number, number]> = {
  ext: ['#8b959a', 5, 80],
  lift: ['#a3aaa7', 1.8, 11],
  well: ['#6f7875', 5, 26],
  corr: ['#7f8781', 5, 36],
  land: ['#7f8781', 6, 30],
  none: ['#000000', 1, 2],
};

// lamps: the entrance lamp blinks on «И выжить»; the corridor lamp flickers; the far one comes on over the Long One
const blink = (v: number, at: number, pattern: number[]) => {
  const t = v - at;
  if (t < 0) return 1;
  let acc = 0;
  for (let k = 0; k < pattern.length; k++) {
    acc += pattern[k];
    if (t < acc) return k % 2 === 0 ? 0 : 1;
  }
  return 1;
};
const entranceLamp = (v: number) => blink(v, LAMP_BLINK, [0.08, 0.1, 0.05, 0.22, 0.12]);
const corrLampOn = (v: number) => (i: number) => {
  if (i === FLICKER_LAMP) return blink(v, FLICKER, [0.07, 0.09, 0.05, 0.3, 0.1, 0.12, 0.06]) * (v > FLICKER + 6.0 && v < FLICKER + 6.4 ? 0 : 1);
  if (i === LONG_LAMP) return v < FLICKER + 0.35 ? 0 : blink(v, FLICKER + 0.35, [0.05, 0.12, 0.08]);
  return 1;
};

// ---------------------------------------------------------------- people

const COURIER_PHONE_ARM: Pose = {armR: [1.05, -0.32], elbowR: 1.25, armL: [0.25, 0.1], elbowL: 0.5, head: [0.42, 0.05, 0]};

const Courier: React.FC<{p: V3; yaw: number; pose?: Pose; phone?: boolean; bag?: boolean; right?: React.ReactNode}> = ({p, yaw, pose, phone, bag, right}) => (
  <Human
    look={COURIER}
    position={p}
    rotation={yaw}
    pose={pose}
    rightHand={phone ? <Phone position={[0.0, -0.03, 0.045]} rotation={[-Math.PI / 2 + 0.35, 0, 0]} /> : right}
    leftHand={bag ? <OrderBag position={[0, -0.01, 0.02]} /> : null}
  />
);

const People: React.FC<{v: number; shot: Shot; cover?: boolean}> = ({v, shot, cover}) => {
  const out: React.ReactNode[] = [];
  if (cover) {
    out.push(
      <Human key="l" look={LONG} position={add3(CORR, [0.45, 0, -8.5])} rotation={-0.05} scale={1} pose={{head: [0.42, 0.12, 0.12], stoop: 0.1, armL: [0.04, 0.05], armR: [0.04, -0.05]}} />,
    );
    return <>{out}</>;
  }
  if (shot === 'order') {
    out.push(<Courier key="c" p={add3(EXT, [0.35, 0.125, 2.4])} yaw={Math.PI + 0.15} pose={COURIER_PHONE_ARM} phone />);
  }
  if (shot === 'lift') {
    const out0 = ramp(v, LIFT_OPEN + 0.9, LIFT_OPEN + 3.4);
    const z = lerp(0.12, 2.0, smooth(out0));
    const walking = out0 > 0 && out0 < 1;
    const ph = (v - LIFT_OPEN) * 6;
    const turn = smooth(ramp(v, LIFT_OPEN + 3.0, LIFT_OPEN + 4.2));
    out.push(
      <Courier
        key="c"
        p={add3(LIFT, [-0.12 + turn * 0.3, walking ? bob(ph, 0.4) : 0, z])}
        yaw={-turn * 1.2}
        pose={walking ? {...stride(ph, 0.4), head: [0.05, 0, 0]} : {head: [lerp(0.05, -0.12, smooth(ramp(v, LIFT_OPEN, LIFT_OPEN + 0.6))), 0, 0]}}
      />,
    );
  }
  if (shot === 'well') {
    const c = onStairs(wellI(v));
    out.push(<Courier key="c" p={c.p} yaw={c.yaw} pose={{...stride(c.i * Math.PI, 0.85, true), head: [-0.1, 0, 0]}} />);
  }
  if (shot === 'long') {
    if (v < WALK0) {
      const c = courierCorrA(v);
      const down = smooth(ramp(v, wordStart(69), wordStart(69) + 0.45));
      out.push(
        <Courier
          key="c"
          p={add3(c.p, [0, c.walking ? bob(c.phase, 0.4) : 0, 0])}
          yaw={Math.PI}
          pose={c.walking ? {...stride(c.phase, 0.4)} : {head: [lerp(0.0, 0.55, down), 0, 0], stoop: lerp(0.04, 0.1, down)}}
          bag={false}
        />,
      );
    } else {
      const c = courierCorrB(v);
      out.push(<Courier key="c" p={add3(c.p, [0, bob(c.phase, 0.4), 0])} yaw={Math.PI} pose={{...stride(c.phase, 0.4), head: [0.5, 0, 0], stoop: 0.1}} />);
    }
    out.push(<Human key="l" look={LONG} position={LONG_AT} rotation={0} scale={1.03} pose={{head: [0.4, 0.1, 0.1], stoop: 0.1, armL: [0.03, 0.05], armR: [0.03, -0.05]}} />);
  }
  if (shot === 'neighbor') {
    const ci = courierN(v);
    const c = onStairs(ci);
    const running = v > CHASE + 0.25;
    const look = smooth(ramp(v, wordStart(88) - 0.2, wordStart(88) + 0.4)) * (1 - smooth(ramp(v, CHASE, CHASE + 0.3)));
    const throwK = ramp(v, THROW - 0.35, THROW + 0.15);
    const throwing = throwK > 0 && throwK < 1;
    const sw = Math.sin(throwK * Math.PI);
    const base: Pose = running ? stride(ci * Math.PI, 0.85, true) : look > 0.01 ? {head: [0.5 * look, 1.0 * look, 0]} : stride(ci * Math.PI, 0.4);
    out.push(
      <Courier
        key="c"
        p={c.p}
        yaw={c.yaw + 1.1 * look + (throwing ? 1.2 * sw : 0)}
        pose={throwing ? {...base, armR: [lerp(-0.6, 1.6, throwK), -0.3], elbowR: 0.4, head: [0.3, 0.6 * sw, 0]} : base}
        right={v > THROW - 0.35 && v < THROW ? <SauceCup position={[0, -0.02, 0.04]} /> : null}
      />,
    );
    const ni = neighbourN(v);
    const n = onStairs(ni, 3.25, neighbourRunning(v) ? 0.08 : 0);
    const sit = neighbourSit(v);
    const runPose = stride(ni * Math.PI, 0.95, true);
    const pose: Pose = neighbourRunning(v)
      ? {...runPose, stoop: 0.45, head: [-0.35, 0, 0.1]}
      : sit > 0
        ? {hipL: 1.5 * sit, hipR: 1.4 * sit, kneeL: 1.6 * sit, kneeR: 1.5 * sit, stoop: 0.25 * sit, armL: [0.9 * sit, 0.2], armR: [0.95 * sit, -0.2], elbowL: 0.9 * sit, elbowR: 0.9 * sit, head: [0.35 * sit, 0, 0]}
        : {head: [-0.45, 0, 0.08], armL: [0.05, 0.06], armR: [0.05, -0.06]};
    const sitDrop = sit * 0.42;
    const cupHeld = sit > 0.6;
    out.push(
      <Human
        key="n"
        look={{...NEIGHBOUR, smile: 0.35, eyes: v > CALL[0] ? 1.35 : 1}}
        position={add3(n.p, [0, -sitDrop, 0])}
        rotation={n.yaw}
        pose={pose}
        rightHand={cupHeld ? <SauceCup position={[0.02, -0.06, 0.05]} rotation={[Math.PI / 2, 0, 0]} /> : null}
      />,
    );
    const cup = cupAt(v);
    if (cup && !cupHeld) out.push(<SauceCup key="cup" position={cup.p} rotation={[cup.spin, cup.spin * 0.6, 0]} />);
  }
  if (shot === 'doors' || shot === 'twins' || shot === 'grow' || shot === 'app') {
    const c = courierLand(v);
    const pass = passAt(v);
    const hold = !bagGone(v);
    const pose: Pose = c.walking
      ? {...stride(c.phase, 0.4), armL: [0.15, 0.1], elbowL: 0.3}
      : {
          armL: [lerp(0.15, 1.15, pass), lerp(0.1, -0.25, pass)],
          elbowL: lerp(0.3, 0.2, pass),
          head: [0.02, lerp(0.0, -0.35, smooth(ramp(v, CHAIN - 0.2, CHAIN + 0.3))) * (1 - smooth(ramp(v, PASS + 0.8, PASS + 1.4))), 0],
          armR: shot === 'app' ? [1.05, -0.32] : [0.05, -0.08],
          elbowR: shot === 'app' ? 1.25 : 0.1,
        };
    out.push(
      <Human
        key="c"
        look={COURIER}
        position={add3(c.p, [0, c.walking ? bob(c.phase, 0.4) : 0, 0])}
        rotation={Math.PI}
        pose={pose}
        leftHand={hold ? <OrderBag position={[0, -0.01, 0.02]} /> : null}
        rightHand={shot === 'app' ? <Phone position={[0.0, -0.03, 0.045]} rotation={[-Math.PI / 2 + 0.35, 0, 0]} /> : null}
      />,
    );
    // the double in flat А: there from the moment the door swings open, gone after the slam
    if (v < SLAM + 0.2 && v > shotStart('doors')) {
      const g = growAt(v);
      const talk = v > DOUBLE[0] && v < DOUBLE[1] ? Math.abs(Math.sin((v - DOUBLE[0]) * 15)) : 0;
      const reach = smooth(ramp(v, DOUBLE[0] + 0.3, DOUBLE[0] + 1.0)) * (1 - smooth(ramp(v, CHAIN, CHAIN + 0.6)));
      out.push(
        <Human
          key="d"
          look={{...double(g, lerp(0.35, 1, g)), mouthDark: talk * 0.8}}
          position={DOUBLE_AT}
          rotation={0}
          pose={{armR: [reach * 1.1, -0.05], elbowR: 0.2 + reach * 0.1, armL: [0.02, 0.06], head: [lerp(0.02, 0.15, g), 0, lerp(0, 0.12, g)], stoop: -0.02}}
        />,
      );
    }
    // the real customer behind door Б, sleepy, in glasses
    if (v > CHAIN - 0.2 && v < SLAM) {
      const talk = v > CODE[0] && v < CODE[1] ? Math.abs(Math.sin((v - CODE[0]) * 13)) : 0;
      const take = smooth(ramp(v, PASS - 0.1, PASS + 0.35));
      out.push(
        <Human
          key="r"
          look={{...CUSTOMER, mouthDark: talk * 0.7, eyes: 0.7}}
          position={CUSTOMER_AT}
          rotation={-0.3}
          pose={{head: [0.08, 0.12, 0.05], armL: [take * 1.0, 0.25], elbowL: 0.3, armR: [0.05, -0.06]}}
          leftHand={bagGone(v) ? <OrderBag position={[0, -0.01, 0.02]} /> : null}
        />,
      );
    }
  }
  return <>{out}</>;
};

const BLACK = new THREE.Color('#000');

export const World: React.FC<{v: number; view?: (v: number) => View; cover?: boolean}> = ({v, view = viewAt, cover = false}) => {
  const env = useEnvironment();
  const shot: Shot = cover ? 'long' : shotAt(v).name;
  const set = SET_OF[shot];
  const scene = useThree((st) => st.scene);
  const [fc, near, far] = FOG[set];
  const fog = useMemo(() => new THREE.Fog(fc, near, far), [fc, near, far]);
  const bg = useMemo(() => new THREE.Color(fc), [fc]);
  scene.environment = env;
  scene.environmentIntensity = 0.25;
  scene.fog = set === 'none' ? null : fog;
  scene.background = set === 'none' ? BLACK : bg;
  if (set === 'none') return <CameraRig v={v} view={view} />;

  const lamp = entranceLamp(v);
  const corrOn = corrLampOn(cover ? 99 : v);
  const liftOpen = smooth(ramp(v, LIFT_OPEN - 0.05, LIFT_OPEN + 1.1));
  const liftFloor = Math.round(lerp(64, 100, smooth(ramp(v, shotStart('lift'), LIFT_OPEN - 0.4))));
  const wellFog = shot === 'well' ? fogTopWell(v) : fogTopN(v);
  const ci = shot === 'well' ? wellI(v) : courierN(v);
  const cp = onStairs(ci).p;
  // the three corridor lamps nearest the action give real light
  const corrFocus = cover ? -4 : v < WALK0 ? (v > wordStart(64) - 0.3 && v < wordStart(69) - 0.1 ? -24 : -4) : -29;
  const nearLamps = CORR_LAMPS.map((z, i) => ({i, d: Math.abs(z - corrFocus)})).sort((a, b) => a.d - b.d).slice(0, 3).map((x) => x.i);
  const chainAt = CHAIN;
  return (
    <>
      <CameraRig v={v} view={view} />
      <hemisphereLight args={['#c9d2d6', '#4a4640', set === 'ext' ? 0.75 : 0.35]} />
      <ambientLight intensity={set === 'ext' ? 0.25 : 0.12} />
      {set === 'ext' ? (
        <>
          <Outside lamp={lamp} />
          <directionalLight position={add3(EXT, [-20, 40, 30])} intensity={0.35} color="#c3cdd6" />
          <pointLight position={add3(ENTRANCE_LAMP, [0, -0.15, 0.2])} color="#ffdcae" intensity={6 * lamp} distance={9} decay={1.6} />
          {shot === 'order' ? <pointLight position={add3(EXT, [0.3, 1.45, 2.1])} color="#9ff0e4" intensity={0.5} distance={1.2} decay={2} /> : null}
        </>
      ) : null}
      {set === 'lift' ? (
        <>
          <Lift open={liftOpen} floor={liftFloor} fogIn={smooth(ramp(v, LIFT_OPEN + 0.4, LIFT_OPEN + 3))} />
          <pointLight position={add3(LIFT, [0, 1.95, -0.1])} color="#e8f2f5" intensity={2.2} distance={4} decay={1.5} />
          <pointLight position={add3(LIFT, [0.6, 2.3, 2.3])} color="#dfe8e2" intensity={2.5 * (0.3 + 0.7 * liftOpen)} distance={6} decay={1.5} />
        </>
      ) : null}
      {set === 'well' ? (
        <>
          <Well base={shot === 'well' ? WELL_BASE_SCENE.well : WELL_BASE_SCENE.neighbor} fogTop={wellFog} />
          <pointLight position={add3(cp, [0, 2.6, 0])} color="#e9e6d8" intensity={5} distance={10} decay={1.4} />
          <pointLight position={add3(onStairs(ci + 9).p, [0, 2.4, 0])} color="#e9e6d8" intensity={3} distance={9} decay={1.4} />
          <pointLight position={add3(WELL, [0, wellFog + 0.4, 0])} color="#cfd8d6" intensity={3} distance={7} decay={1.2} />
          {shot === 'neighbor' ? <pointLight position={add3(onStairs(neighbourN(v)).p, [0, 2.2, 0])} color="#cfd8d6" intensity={3} distance={6} decay={1.4} /> : null}
        </>
      ) : null}
      {set === 'corr' ? (
        <>
          <Corridor lamp={corrOn} floor={cover ? 430 : 248} />
          {nearLamps.map((i) => (
            <pointLight key={i} position={corrLamp(i)} color="#eef3ea" intensity={3.2 * corrOn(i)} distance={8} decay={1.5} />
          ))}
          {!cover && v > wordStart(69) - 0.3 && v < WALK0 ? <pointLight position={add3(CORR, [-0.3, 1.2, -4.0])} color="#dfe6e2" intensity={1.2} distance={2.5} decay={1.5} /> : null}
          <pointLight position={corrLamp(LONG_LAMP)} color="#dfe8e2" intensity={cover ? 3 : 2.6 * corrOn(LONG_LAMP)} distance={6} decay={1.5} />
        </>
      ) : null}
      {set === 'land' ? (
        <>
          <Landing openA={cover ? 0 : openA(v)} openB={openB(v, chainAt)} chain />
          <pointLight position={LAND_LAMP} color="#eef3ea" intensity={3.2} distance={9} decay={1.4} />
          <Spot position={add3(LAND_SET, [-0.3, 2.5, 0.6])} target={add3(DOUBLE_AT, [0, 1.4, 0])} color="#d8e2dc" intensity={7 * smooth(ramp(v, wordStart(128) - 0.3, wordStart(128) + 0.4))} distance={6} angle={0.32} penumbra={0.6} />
        </>
      ) : null}
      <People v={v} shot={shot} cover={cover} />
    </>
  );
};

