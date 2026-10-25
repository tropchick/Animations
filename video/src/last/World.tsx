import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {Color, Fog} from 'three';
import {CameraRig, View} from '../slime/camera';
import {useEnvironment} from '../slime/World';
import {DOORS, JOLT, LIGHTS_OUT, MOTOR, Shot, V3, lerp, ramp, shotAt, shotEnd, shotStart, smooth} from './cues';
import {viewAt} from './camera';
import {DOOR36, House} from './House';
import {HIP_H, Kostya, Pose} from './Kostya';
import {Phone} from './Phone';
import {Money, Shop, Yard} from './Yard';
import {City, Kitchen, PHONE_DAY, PHONE_NIGHT} from './Kitchen';
import {Hand} from './Kostya';

type Set = 'house' | 'yard' | 'shop' | 'kitchen' | 'black';
const SET: Record<Shot, Set> = {
  hook: 'house', chat: 'kitchen', record: 'kitchen', stuck: 'house', button: 'house', sleep: 'house', morning: 'house',
  doors: 'house', calls: 'house', screen112: 'house', yard: 'yard', cross: 'yard', shop: 'shop', money: 'shop',
  steps: 'yard', door36: 'house', window: 'kitchen', reflect: 'kitchen', sent: 'kitchen', title: 'black',
};
const FOG: Record<Set, [string, number, number]> = {
  house: ['#050505', 30, 60],
  yard: ['#c3c9cc', 45, 320],
  shop: ['#d9dcda', 30, 60],
  kitchen: ['#0b111b', 120, 1150],
  black: ['#000000', 1, 2],
};

// knocks on the lift door, the same times as in the soundtrack
// lift door at z -0.14: the fist reaches it with the elbow almost straight
const KNOCKS = [1.6, 2.0, 2.4, 3.6, 3.9].map((t) => shotStart('stuck') + t);
const knock = (v: number) => {
  let e = 1.3;
  for (const k of KNOCKS) {
    const d = v - k;
    if (d > -0.16 && d <= 0) e = Math.min(e, lerp(1.3, 0.32, smooth((d + 0.16) / 0.16)));
    if (d > 0 && d < 0.25) e = Math.min(e, lerp(0.32, 1.3, smooth(d / 0.25)));
  }
  return e;
};

const SEATED: {position: V3; pose: Pose} = {
  position: [-0.12, 0.12 - HIP_H, -1.3],
  pose: {hipL: 2.3, hipR: 2.2, kneeL: 2.35, kneeR: 2.15, stoop: -0.04, head: [0.38, 0.2, 0.28], armL: [0.55, 0.1], armR: [0.55, -0.1], elbowL: 0.55, elbowR: 0.55},
};

const lampAt = (shot: Shot, v: number) => {
  if (shot === 'hook') {
    if (v >= LIGHTS_OUT) return 0;
    const f = [0.35, 0.6, 0.8, 0.95, 1.03].some((t) => v >= t && v < t + 0.06);
    return f ? 0.15 : 0.85;
  }
  if (shot === 'stuck') return v >= JOLT && v < JOLT + 0.12 ? 0.2 : 1;
  if (shot === 'sleep') return 0.75;
  if (shot === 'morning') return v < MOTOR ? 0.05 : v < MOTOR + 0.08 ? 0.5 : 1;
  return 1;
};

const HouseShots: React.FC<{v: number; shot: Shot}> = ({v, shot}) => {
  const cab = ['hook', 'stuck', 'button', 'sleep', 'morning'].includes(shot);
  const light = shot === 'door36' ? 'evening' : cab ? 'night' : 'day';
  const open = shot === 'doors' ? smooth(ramp(v, DOORS, DOORS + 1.1)) : shot === 'calls' || shot === 'screen112' || shot === 'door36' ? 1 : 0;
  const floor = shot === 'morning' ? (v < MOTOR + 1.6 ? '8' : '9') : shot === 'doors' ? '9' : '8';
  let kostya: React.ReactNode = null;
  if (shot === 'hook' || shot === 'sleep') {
    const nod = shot === 'sleep' ? 0.12 * smooth(ramp(v, shotStart('sleep') + 1, shotEnd('sleep'))) : 0.05;
    kostya = <Kostya position={SEATED.position} pose={{...SEATED.pose, head: [0.3 + nod, 0.2, 0.28]}} />;
  }
  if (shot === 'morning') {
    const up = smooth(ramp(v, MOTOR + 0.2, MOTOR + 1.0));
    kostya = <Kostya position={SEATED.position} pose={{...SEATED.pose, head: [lerp(0.42, -0.25, up), lerp(0.2, -0.1, up), lerp(0.28, 0, up)], stoop: lerp(-0.04, 0.08, up)}} />;
  }
  if (shot === 'stuck') kostya = <Kostya position={[0.02, 0, -0.62]} pose={{armR: [1.32, -0.06], elbowR: knock(v), armL: [0.15, 0.1], elbowL: 0.3, head: [-0.05, 0, 0], stoop: 0.06}} />;
  if (shot === 'button') {
    const press = [0.35, 1.3, 2.1].map((t) => shotStart('button') + t);
    let push = 0;
    for (const p of press) push = Math.max(push, 1 - Math.min(1, Math.abs(v - p) / 0.22));
    kostya = <Hand position={[0.33 + 0.045 * push, 1.125, -0.44]} rotation={[0, 0, Math.PI / 2]} shape="point" side={1} />;
  }
  if (shot === 'doors') kostya = <Kostya position={[-0.2, 0, -0.92]} pose={{head: [-0.08, 0, 0], armL: [0.05, 0.08], armR: [0.05, -0.08]}} />;
  if (shot === 'calls')
    kostya = (
      <Kostya
        position={[0.7, 0, 2.55]}
        rotation={Math.PI + 0.25}
        pose={{armR: [0.35, -0.55], elbowR: 2.45, armL: [0.1, 0.12], head: [0.18, 0.15, 0.12], stoop: 0.08}}
        rightHand={<Phone v={v} mode="call112" callFrom={shotStart('calls')} position={[0, 0.02, 0.0]} rotation={[0, -1.4, 0]} />}
      />
    );
  if (shot === 'screen112')
    kostya = (
      <group position={PHONE_DAY} rotation={[-0.1, 0, 0]}>
        <Phone v={v} mode="call112" callFrom={shotStart('screen112') - 0.4} />
        <Hand position={[0.0, -0.1, -0.019]} rotation={[0, 0, Math.PI]} shape="flat" side={-1} />
      </group>
    );
  if (shot === 'door36')
    kostya = (
      <Kostya
        position={[DOOR36[0] - 0.55, 0, DOOR36[2] - 0.12]}
        rotation={Math.PI / 2}
        pose={{armR: [1.3, -0.12], elbowR: 0.22, armL: [0.08, 0.1], head: [0.5, -0.1, 0], stoop: 0.18}}
      />
    );
  const dog = shot === 'door36' ? 0.5 + 0.5 * Math.sin(v * 2.2) * Math.sin(v * 0.7 + 1) : 0;
  return (
    <>
      <House light={light} doorsOpen={open} cabLamp={lampAt(shot, v)} floor={floor} dog={dog} cabOnly={cab} />
      {kostya}
    </>
  );
};

const KitchenShots: React.FC<{v: number; shot: Shot}> = ({v, shot}) => {
  if (shot === 'chat' || shot === 'record' || shot === 'sent')
    return <Kitchen v={v} phone={{mode: shot, at: shot === 'sent' ? [PHONE_NIGHT[0], PHONE_NIGHT[1] - 0.02, PHONE_NIGHT[2]] : PHONE_NIGHT}} />;
  const lower = shot === 'reflect' ? smooth(ramp(v, shotEnd('reflect') - 2.2, shotEnd('reflect') - 0.6)) : 0;
  const pose: Pose = {armR: [lerp(1.05, 0.35, lower), lerp(-0.42, -0.2, lower)], elbowR: lerp(1.75, 0.9, lower), armL: [0.1, 0.1], head: [lerp(0.15, 0.4, lower), 0, 0], stoop: 0.06};
  return <Kitchen v={v} kostya={pose} phone={{mode: 'record', inHand: true, rot: [-1.2, 0.35, 0]}} outside={shot === 'reflect'} />;
};

export const World: React.FC<{v: number; view?: (v: number) => View}> = ({v, view = viewAt}) => {
  const env = useEnvironment();
  const s = shotAt(v);
  const set = SET[s.name];
  const [fc, near, far] = FOG[set];
  const fog = useMemo(() => new Fog(fc, near, far), [fc, near, far]);
  const bg = useMemo(() => new Color(fc), [fc]);
  const scene = useThree((st) => st.scene);
  scene.environment = env;
  const cab = ['hook', 'stuck', 'button', 'sleep', 'morning'].includes(s.name);
  scene.environmentIntensity = set === 'kitchen' ? 0.15 : cab ? 0.02 + 0.33 * lampAt(s.name, v) : s.name === 'door36' ? 0.2 : 0.4;
  scene.fog = fog;
  scene.background = bg;
  return (
    <>
      <CameraRig v={v} view={view} />
      {set === 'house' ? <HouseShots v={v} shot={s.name} /> : null}
      {set === 'yard' ? <Yard v={v} kostya={s.name === 'yard' ? 'entrance' : s.name === 'steps' ? 'steps' : null} /> : null}
      {set === 'shop' ? (
        <>
          <Shop v={v} kostya={s.name === 'shop'} />
          {s.name === 'money' ? <Money v={v} from={shotStart('money')} /> : null}
        </>
      ) : null}
      {set === 'kitchen' ? (
        <>
          <KitchenShots v={v} shot={s.name} />
          <City />
        </>
      ) : null}
    </>
  );
};
