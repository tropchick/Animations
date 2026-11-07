import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {Box} from './common';
import {C, ShotState, V3, add3, lerp, lerp3, ramp, shotAt, smooth} from './cues';
import {BATH, Bathroom, Bedroom, FY, HALL, Hallway, INTERCOM_SCREEN, RADIO, SHIRT_LAND, SHIRT_START, TShirt, WakeHand, shirtAt} from './Flat';
import {Yard} from './Yard';
import {Platform, WAGON, Wagon} from './Metro';
import {SHOP, SHOP_EYE, Shop} from './Shop';
import {STREET, Street, TRAIN, Train, runZ} from './Street';
import {BENCH, TABLE, VILLAGE, Village} from './Village';
import {CAPSULE, LAB, Lab, VENT} from './Lab';
import {ROOF, Roof} from './Roof';
import {Hand, Phone} from './people';
import {drawCall, drawHome, drawStory, drawViews, tex} from './tex';

export type View = {pos: V3; target: V3; fov: number; roll?: number};

const mv = (k: number, a: V3, b: V3, ta: V3, tb: V3, fov: number | [number, number], roll = 0): View => {
  const e = smooth(k);
  return {pos: lerp3(a, b, e), target: lerp3(ta, tb, e), fov: typeof fov === 'number' ? fov : lerp(fov[0], fov[1], e), roll};
};
const W = (o: V3, p: V3): V3 => add3(o, p);

// where the phone is held in the phone shots (sitting on the bed edge)
const PHONE_EYE: V3 = [-0.7, FY + 1.2, 3.45];
const PHONE_AT: V3 = [-0.66, FY + 1.03, 3.72];
const ROOF_EYE: V3 = W(ROOF, [-0.6, 1.85, -2.4]);
const CALL_AT: V3 = W(ROOF, [-0.5, 1.6, -2.02]);

export const viewOf = (s: ShotState, v: number): View => {
  const {k, t} = s;
  switch (s.name) {
    case 'wake':
      return mv(k, [-1.32, FY + 0.72, 2.12], [-1.24, FY + 0.8, 2.16], [-0.45, FY + 0.6, 2.22], [-0.42, FY + 0.64, 2.2], 52, 0.06);
    case 'radio':
      return mv(k, [-1.05, FY + 0.88, 2.55], [-0.74, FY + 0.76, 2.22], W(RADIO, [0, 0.0, 0.05]), W(RADIO, [0, -0.01, 0]), 42);
    case 'mirror':
      return mv(k, W(BATH, [0.22, 1.85, 1.2]), W(BATH, [0.04, 1.85, 0.92]), W(BATH, [0.05, 1.82, -1]), W(BATH, [0.0, 1.85, -1]), 50);
    case 'story':
    case 'views':
    case 'ex':
      return mv(k, W(PHONE_EYE, [0.02, 0.02, -0.03]), PHONE_EYE, W(PHONE_AT, [0, -0.02, 0]), PHONE_AT, 50);
    case 'window':
      return mv(k, [0.85, FY + 1.8, 4.7], [0.97, FY + 1.78, 5.62], [1.0, FY + 1.0, 20], [1.0, 1.5, 22], 55);
    case 'intercom':
      return mv(k, W(HALL, [0.75, 1.72, 0.85]), W(HALL, [0.5, 1.6, 0.42]), INTERCOM_SCREEN, INTERCOM_SCREEN, 45);
    case 'shirt':
      return mv(k, [0.95, FY + 1.82, 5.5], [0.97, FY + 1.78, 5.72], [1.1, FY + 0.4, 9], [1.4, 5, 16], 52);
    case 'throw': {
      const sh = v < C.land ? shirtAt(v).p : SHIRT_LAND;
      const tgt = lerp3([1.2, FY - 1, 9], sh, smooth(ramp(v, C.throw, C.throw + 0.4)));
      return {pos: lerp3([0.97, FY + 1.9, 5.8], [0.99, FY + 1.95, 5.95], k), target: tgt, fov: 50};
    }
    case 'fight':
      return mv(k, [-7, 3.4, 30.5], [-5.5, 3.0, 29], [SHIRT_LAND[0], 1.6, SHIRT_LAND[2]], [SHIRT_LAND[0], 1.5, SHIRT_LAND[2]], [40, 34]);
    case 'hotdog':
      return mv(ramp(v, 40.8, 44.8), [25, 1.6, 11.5], [24.2, 1.5, 10.6], [12.5, 1.5, 6.5], [20, 1.6, 7.6], [42, 46]);
    case 'metro':
      return mv(k, [1.0, 1.85, 0.6], [1.15, 1.85, 1.3], [-14, 1.6, 5], [3, 1.4, 5], 58);
    case 'wagon':
      return mv(k, W(WAGON, [-5.6, 1.85, 0.12]), W(WAGON, [-4.4, 1.85, 0.0]), W(WAGON, [6, 1.3, 0]), W(WAGON, [6, 1.25, -0.2]), 58);
    case 'sad':
      return mv(k, W(WAGON, [1.95, 1.85, 0.85]), W(WAGON, [1.7, 1.88, 0.4]), W(WAGON, [1.6, 1.8, -0.95]), W(WAGON, [1.6, 1.86, -0.95]), 46);
    case 'shop':
    case 'net':
      return mv(s.name === 'shop' ? k * 0.6 : 0.6 + k * 0.4, SHOP_EYE, W(SHOP_EYE, [0, 0, -0.25]), W(SHOP, [0.2, 1.72, -0.95]), W(SHOP, [0.2, 1.75, -0.95]), 48);
    case 'turn':
      return mv(smooth(ramp(v, C.turn[0] - 0.1, C.turn[1] + 0.3)), W(SHOP_EYE, [0, 0, -0.25]), W(SHOP, [0.15, 2.05, 2.6]), W(SHOP, [0.2, 1.75, -0.95]), W(SHOP, [0, 1.4, -1.0]), [48, 64]);
    case 'run': {
      const z = runZ(v);
      const bob = Math.abs(Math.sin(v * 9.5)) * 0.07;
      const look = smooth(ramp(v, 62.0, 62.6)) * (1 - smooth(ramp(v, 63.3, 63.9)));
      return {pos: W(STREET, [0.25 * Math.sin(v * 4.7), 1.85 + bob, z]), target: W(STREET, [0.3 * Math.sin(v * 4.7 + 0.5), 1.7 + 6 * look, z - 20]), fov: 60, roll: 0.03 * Math.sin(v * 4.7)};
    }
    case 'train':
      return mv(ramp(v, 64.2, 65.2), W(TRAIN, [-0.1, 1.82, -1.4]), W(TRAIN, [0.3, 1.72, -0.5]), W(TRAIN, [0.1, 1.7, 4]), W(TRAIN, [0.32, 1.66, 4]), [55, 50]);
    case 'porch': {
      const bob = Math.abs(Math.sin(t * 6)) * 0.04;
      const m = mv(k, W(VILLAGE, [0.25, 1.85, 15]), W(VILLAGE, [0.1, 1.85, 8.2]), W(VILLAGE, [0.3, 1.9, 3.5]), W(VILLAGE, [0.3, 2.1, 3.5]), 50);
      return {...m, pos: add3(m.pos, [0, bob, 0])};
    }
    case 'table':
      return mv(k, W(VILLAGE, add3(TABLE, [0.1, 1.42, 1.45])), W(VILLAGE, add3(TABLE, [0, 1.38, 1.3])), W(VILLAGE, add3(TABLE, [0, 1.1, -0.6])), W(VILLAGE, add3(TABLE, [0, 1.4, -0.6])), 50);
    case 'bench':
      return mv(k, W(VILLAGE, add3(BENCH, [0.4, 1.85, 5.6])), W(VILLAGE, add3(BENCH, [0.1, 1.75, 3.6])), W(VILLAGE, add3(BENCH, [0, 1.15, 0])), W(VILLAGE, add3(BENCH, [0, 1.2, 0])), [44, 40]);
    case 'heli':
      return mv(k, W(VILLAGE, [11, 1.3, 23]), W(VILLAGE, [9, 1.5, 21]), W(VILLAGE, [0, 6.5, 3]), W(VILLAGE, [0.5, 7.5, 4]), 55);
    case 'lab':
      return mv(k, W(LAB, [4.2, 2.6, 4.9]), W(LAB, [3.3, 2.3, 4.3]), W(LAB, [-0.8, 1.2, 0]), W(LAB, [-0.6, 1.25, 0]), 52);
    case 'clone':
      return mv(k, W(LAB, [0.7, 1.95, 4.2]), W(LAB, [0.2, 1.9, 2.7]), W(LAB, add3(CAPSULE, [0, 1.75, 0])), W(LAB, add3(CAPSULE, [0, 1.9, 0])), 45);
    case 'vent':
      return mv(k, W(LAB, [VENT[0], VENT[1], -4.3]), W(LAB, [VENT[0], VENT[1] + 0.05, -4.75]), W(LAB, [0.3, 1.2, 1.0]), W(LAB, [0.2, 1.1, 0.8]), 55);
    case 'roof':
      return mv(k, W(ROOF, [-1.6, 1.85, -3.6]), ROOF_EYE, W(ROOF, [-6, 16, 80]), W(ROOF, [2, 18, 80]), 55);
    case 'call':
      return mv(k, ROOF_EYE, W(ROOF_EYE, [0, 0.0, 0.02]), CALL_AT, CALL_AT, 50);
    case 'ear':
      return mv(k, ROOF_EYE, W(ROOF_EYE, [0.05, 0, 0.1]), W(ROOF, [6, 15, 80]), W(ROOF, [4, 17, 80]), 52, -0.08);
    case 'counter':
    case 'final':
      return mv(smooth(ramp(v, 98.4, 103)), W(ROOF_EYE, [0.05, 0, 0.1]), W(ROOF_EYE, [0.2, 0.05, 1.0]), W(ROOF, [4, 17, 80]), W(ROOF, [4, 20, 100]), [52, 46], -0.08 * (1 - smooth(ramp(v, 98.4, 99.5))));
  }
};

// short jolts on hits: [time, strength]
const SHAKES: [number, number][] = [
  [C.slap, 0.6],
  [C.hudIn, 0.5],
  [C.land, 0.4],
  [C.turn[1], 0.8],
  [C.doorsShut, 0.5],
  [C.bonk, 0.6],
  [C.flip, 1.0],
];

export const viewAt = (v: number): View => {
  const s = shotAt(v);
  const view = viewOf(s, v);
  const d = Math.hypot(view.pos[0] - view.target[0], view.pos[1] - view.target[1], view.pos[2] - view.target[2]);
  let jolt = 0;
  for (const [at, a] of SHAKES) {
    const x = v - at;
    if (x >= 0 && x < 0.8) jolt += a * Math.exp(-x * 7);
  }
  if (v < C.slap) jolt += 0.12;
  if (s.name === 'call' && v >= C.ring[0] && v < C.ring[1]) jolt += 0.15;
  const h = 0.004;
  const j = 0.01 * jolt;
  const off: V3 = [
    h * (Math.sin(v * 1.3) + 0.5 * Math.sin(v * 3.1 + 1)) + j * Math.sin(v * 71),
    h * (Math.sin(v * 1.7 + 2) + 0.4 * Math.sin(v * 2.6)) + j * Math.sin(v * 57 + 1.3),
    h * 0.6 * Math.sin(v * 1.1 + 4) + j * 0.5 * Math.sin(v * 63 + 2.1),
  ];
  return {...view, pos: add3(view.pos, off), target: add3(view.target, [off[0] * d * 0.3, off[1] * d * 0.3, 0])};
};

export const CameraRig: React.FC<{v: number; view?: View}> = ({v, view}) => {
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  const {pos, target, fov, roll = 0} = view ?? viewAt(v);
  camera.up.set(0, 1, 0);
  camera.position.set(...pos);
  camera.lookAt(...target);
  if (roll) camera.rotateZ(roll);
  camera.fov = fov;
  camera.near = 0.03;
  camera.far = 3000;
  camera.updateProjectionMatrix();
  return null;
};

// a group at `at` turned to face `eye`
const Facing: React.FC<{at: V3; eye: V3; children: React.ReactNode; tilt?: number}> = ({at, eye, children, tilt = 0}) => {
  const q = useMemo(() => {
    const m = new THREE.Matrix4().lookAt(new THREE.Vector3(...eye), new THREE.Vector3(...at), new THREE.Vector3(0, 1, 0));
    const qq = new THREE.Quaternion().setFromRotationMatrix(m);
    return qq.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), tilt));
  }, [at, eye, tilt]);
  return (
    <group position={at} quaternion={q}>
      {children}
    </group>
  );
};

// the phone held in both hands; screen faces the eye
const HeldPhone: React.FC<{at: V3; eye: V3; screen: THREE.Texture; tap?: number; shake?: number}> = ({at, eye, screen, tap = 0, shake = 0}) => (
  <Facing at={[at[0] + shake * 0.004, at[1], at[2]]} eye={eye} tilt={0.06 + shake * 0.03}>
    <group rotation={[0, Math.PI, 0]}>
      <Phone position={[0, 0, 0]} rotation={[0, Math.PI, 0]} screen={screen} />
    </group>
    {/* both hands hold the bottom of the phone from behind; the thumb comes in only to tap */}
    <Hand position={[-0.045, -0.115, -0.035]} rotation={[0.15, 0, Math.PI + 0.35]} shape="grip" side={-1} />
    <Hand position={[0.045, -0.115, -0.035]} rotation={[0.15, 0, Math.PI - 0.35]} shape="grip" />
    {tap > 0 ? (
      <group position={[0.06 - tap * 0.04, -0.06 + tap * 0.02, 0.012]} rotation={[0, 0, 0.8]}>
        <Box size={[0.022, 0.065, 0.02]} position={[0, -0.03, 0]} color="#efd2b3" />
      </group>
    ) : null}
  </Facing>
);

const PhoneShots: React.FC<{v: number; name: string; eye: V3}> = ({v, name, eye}) => {
  if (name === 'story') {
    const posted = v >= C.tap;
    const tap = Math.max(0, 1 - Math.abs(v - C.tap) / 0.15);
    return <HeldPhone at={PHONE_AT} eye={eye} screen={tex(`story-${posted}`, 540, 1080, drawStory(posted))} tap={tap} />;
  }
  if (name === 'views') {
    const k = ramp(v, C.views[0], C.views[1]);
    const n = k <= 0 ? 12 : k >= 1 ? 2_000_000_000 : Math.round(12 * Math.pow(2_000_000_000 / 12, Math.pow(k, 0.9)));
    const key = n >= 1e6 ? Math.round(n / 1e5) * 1e5 : n;
    return <HeldPhone at={PHONE_AT} eye={eye} screen={tex(`views-${key}`, 540, 1080, drawViews(key))} />;
  }
  const msg = v >= C.buzz;
  const buzz = v >= C.buzz && v < C.buzz + 0.7 ? Math.sin(v * 90) : 0;
  return <HeldPhone at={PHONE_AT} eye={eye} screen={tex(`home-${msg}`, 540, 1080, drawHome(msg))} shake={buzz} />;
};

// a straight box limb between two points (a forearm reaching out of frame)
const Limb: React.FC<{a: V3; b: V3; w?: number; color: string}> = ({a, b, w = 0.1, color}) => {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const len = va.distanceTo(vb);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return (
    <mesh position={mid} quaternion={q} castShadow>
      <boxGeometry args={[w, len, w * 0.9]} />
      <meshStandardMaterial color={color} flatShading roughness={0.9} />
    </mesh>
  );
};

export const SetFor: React.FC<{v: number; s: ShotState; eye: V3}> = ({v, s, eye}) => {
  switch (s.name) {
    case 'wake':
    case 'radio':
      return (
        <>
          <color attach="background" args={['#9ab8d8']} />
          <Bedroom v={v} shot={s.name} />
          {s.name === 'wake' ? <WakeHand v={v} /> : null}
        </>
      );
    case 'mirror':
      return <Bathroom v={v} eye={eye} />;
    case 'story':
    case 'views':
    case 'ex':
      return (
        <>
          <Bedroom v={v} shot={s.name} />
          <Yard v={v} withOwnBlock={false} />
          <PhoneShots v={v} name={s.name} eye={eye} />
        </>
      );
    case 'window':
      return (
        <>
          <Bedroom v={v} shot={s.name} />
          <Yard v={v} withOwnBlock={false} />
        </>
      );
    case 'intercom':
      return <Hallway v={v} />;
    case 'shirt':
    case 'throw': {
      const holding = v < C.throw;
      const hand: V3 = holding ? [SHIRT_START[0], SHIRT_START[1] + 0.09, SHIRT_START[2] - 0.14] : lerp3([SHIRT_START[0], SHIRT_START[1] + 0.09, SHIRT_START[2] - 0.14], [0.9, FY + 1.2, 6.2], smooth(ramp(v, C.throw, C.throw + 0.5)));
      const elbow: V3 = add3(eye, [0.28, -0.5, 0.25]);
      const sh = shirtAt(v);
      return (
        <>
          <Bedroom v={v} shot={s.name} />
          <Yard v={v} withOwnBlock={false} />
          {holding ? <TShirt position={sh.p} rotation={sh.r} /> : null}
          {s.name === 'shirt' || v < C.throw + 0.5 ? (
            <>
              <Hand position={hand} rotation={[-1.0, 0, 0]} shape={holding ? 'grip' : 'flat'} />
              <Limb a={add3(hand, [0, 0.16, -0.26])} b={elbow} color="#7d8590" />
            </>
          ) : null}
        </>
      );
    }
    case 'fight':
      return <Yard v={v} withOwnBlock />;
    case 'hotdog':
      return <Yard v={v} withOwnBlock hotdog />;
    case 'metro':
      return <Platform v={v} />;
    case 'wagon':
      return <Wagon v={v} />;
    case 'sad':
      return <Wagon v={v} hotdog />;
    case 'shop':
    case 'net':
    case 'turn':
      return <Shop v={v} />;
    case 'run':
      return <Street v={v} />;
    case 'train':
      return <Train v={v} />;
    case 'porch':
    case 'table':
    case 'bench':
      return <Village v={v} shot={s.name} />;
    case 'heli':
      return <Village v={v} shot={s.name} night />;
    case 'lab':
    case 'clone':
      return <Lab v={v} shot={s.name} />;
    case 'vent': {
      const close = smooth(ramp(v, C.grille - 0.5, C.grille));
      return (
        <>
          <Lab v={v} shot={s.name} />
          {/* the duct mouth around the camera and the grille sliding shut */}
          <group position={W(LAB, [VENT[0], VENT[1], -4.05])}>
            <Box size={[1.2, 0.12, 1.3]} position={[0, 0.42, -0.65]} color="#8a9098" />
            <Box size={[1.2, 0.12, 1.3]} position={[0, -0.42, -0.65]} color="#8a9098" />
            <Box size={[0.12, 0.96, 1.3]} position={[-0.54, 0, -0.65]} color="#8a9098" />
            <Box size={[0.12, 0.96, 1.3]} position={[0.54, 0, -0.65]} color="#8a9098" />
            <group position={[0, 0.75 - close * 0.75, 0.03]}>
              <Box size={[1.0, 0.75, 0.03]} color="#6a7078" />
              {[-0.25, -0.1, 0.05, 0.2].map((y) => (
                <Box key={y} size={[0.92, 0.04, 0.05]} position={[0, y, 0.0]} color="#4a5058" />
              ))}
            </group>
          </group>
        </>
      );
    }
    case 'roof':
    case 'counter':
    case 'final':
      return <Roof v={v} />;
    case 'call': {
      const ring = v >= C.ring[0] && v < C.ring[1] ? Math.sin(v * 80) : 0;
      return (
        <>
          <Roof v={v} />
          <HeldPhone at={CALL_AT} eye={eye} screen={tex(`call-${v >= C.ring[1]}`, 540, 1080, drawCall(v >= C.ring[1]))} shake={ring} />
        </>
      );
    }
    case 'ear':
      return (
        <>
          <Roof v={v} />
          <Facing at={add3(ROOF_EYE, [0.13, -0.02, 0.06])} eye={add3(ROOF_EYE, [-0.5, 0, 0.1])}>
            <Box size={[0.078, 0.158, 0.009]} color="#111216" />
          </Facing>
          <Hand position={add3(ROOF_EYE, [0.17, -0.13, 0.08])} rotation={[0, 0, Math.PI - 0.3]} shape="grip" />
        </>
      );
  }
};

export const World: React.FC<{v: number; view?: View}> = ({v, view}) => {
  const s = shotAt(v);
  const vw = view ?? viewAt(v);
  return (
    <>
      <CameraRig v={v} view={vw} />
      <SetFor v={v} s={s} eye={vw.pos} />
    </>
  );
};
