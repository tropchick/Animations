import {memo, useLayoutEffect, useMemo, useRef} from 'react';
import {AdditiveBlending, DoubleSide, InstancedMesh, Object3D, Vector2} from 'three';

export type Point = [number, number, number];
export const AMBER = '#ffc67a';
export const MINT = '#95ffdc';
const TOWER: Point = [0.64, 0, -1.78];
const DOCK: Point = [0.64, 1.18, -0.37];
const dishTilt = (frame: number) => 0.96 - 0.48 * ease(frame, 394, 532);
const feedPosition = (frame: number): Point => {
  const tilt = dishTilt(frame);
  return [TOWER[0], 2.01 + 0.945 * Math.cos(tilt), TOWER[2] + 0.945 * Math.sin(tilt)];
};
export const SIGNAL: Point = [0.64, 3.43, -1.32];
export const HERO_DOCK: Point = [-0.53, 0, 0.55];

export const span = (frame: number, from: number, to: number) =>
  Math.max(0, Math.min(1, (frame - from) / (to - from)));
export const ease = (frame: number, from: number, to: number) => {
  const t = span(frame, from, to);
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function heroPose(frame: number) {
  const walk = span(frame, 68, 296);
  const distance = walk * walk * (3 - 2 * walk);
  const x = mix(-4.22, HERO_DOCK[0], distance);
  const z = mix(1.72, HERO_DOCK[2], distance);
  const gait = Math.sin(distance * Math.PI * 12) * Math.pow(Math.sin(Math.PI * walk), 0.22);
  const bob = Math.abs(gait) * 0.045;
  const turn = 0.66 + 0.52 * ease(frame, 278, 314) - 1.49 * ease(frame, 359, 447);
  const face = -0.47 * ease(frame, 29, 65) + 0.58 * ease(frame, 80, 180)
    - 0.36 * ease(frame, 340, 379);
  const lookUp = 0.06 + 0.35 * ease(frame, 421, 532) - 0.18 * ease(frame, 619, 673);
  return {x, z, gait, bob, turn, face, lookUp};
}

export function lensPosition(frame: number): Point {
  const {x, z, bob} = heroPose(frame);
  const guided = ease(frame, 307, 338);
  return [
    mix(x + 0.24, DOCK[0], guided),
    mix(1.06 + bob, DOCK[1], guided) + 0.12 * Math.sin(Math.PI * guided),
    mix(z + 0.38, DOCK[2], guided),
  ];
}

function Box({p, size, color, metal = 0}: {p: Point; size: Point; color: string; metal?: number}) {
  return <mesh position={p}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={0.76} metalness={metal} />
  </mesh>;
}

function Pill({p, size, color, glow = 0}: {p: Point; size: Point; color: string; glow?: number}) {
  return <mesh position={p} scale={size} rotation-x={Math.PI / 2}>
    <cylinderGeometry args={[1, 1, 1, 12]} />
    <meshStandardMaterial color={color} roughness={0.67} emissive={color} emissiveIntensity={glow} flatShading />
  </mesh>;
}

function Contact({p, size = [0.55, 1, 0.3]}: {p: Point; size?: Point}) {
  return <group position={p} scale={size} rotation-x={-Math.PI / 2}>
    {[1, 0.78, 0.48].map((r) => <mesh key={r} position-z={(1 - r) * 0.004}>
      <circleGeometry args={[r, 22]} />
      <meshBasicMaterial color="#301b38" transparent opacity={0.12} depthWrite={false} />
    </mesh>)}
  </group>;
}

export function Scout({frame}: {frame: number}) {
  const {x, z, gait, bob, turn, face, lookUp} = heroPose(frame);
  const loading = ease(frame, 302, 333) - ease(frame, 340, 373);
  const attention = Math.max(0, 1 - Math.abs(frame - 44) / 16);
  const blink = [15, 117, 199, 281, 373, 494, 633].reduce(
    (result, beat) => Math.min(result, 1 - 0.9 * Math.max(0, 1 - Math.abs(frame - beat) / 3)),
    1,
  );
  return <>
    <Contact p={[x, 0.012, z]} />
    <group position={[x, 0, z]} rotation-y={turn}>
      <group position-y={bob}>
        <group position={[0, 0.94, 0]}>
          <mesh scale={[0.34, 0.36, 0.24]} rotation-y={Math.PI / 4}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color="#e6a457" roughness={0.64} flatShading />
          </mesh>
          <Box p={[0, -0.05, -0.22]} size={[0.38, 0.37, 0.17]} color="#566775" />
          <Box p={[0, 0.075, -0.32]} size={[0.25, 0.046, 0.035]} color="#e4c28b" />
          <Pill p={[0, 0.025, 0.22]} size={[0.088, 0.065, 0.034]} color="#d2fff0" glow={0.52} />
          <Box p={[0, -0.11, 0.21]} size={[0.24, 0.04, 0.046]} color="#a36748" />
        </group>
        <group position={[0, 1.41, 0.015]} rotation-y={face} rotation-x={-lookUp}>
          <mesh scale={[0.42, 0.32, 0.34]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color="#f1b465" roughness={0.65} flatShading />
          </mesh>
          <mesh position={[0, 0.018, 0.244]} scale={[0.37, 0.213, 0.12]}>
            <sphereGeometry args={[1, 16, 10]} />
            <meshStandardMaterial color="#112243" roughness={0.26} metalness={0.1} />
          </mesh>
          {[-1, 1].map((side) => <mesh key={side} position={[side * 0.12, 0.037 + attention * 0.017, 0.344]}
            scale={[0.063 + 0.012 * attention, 0.063 * blink, 0.022]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshBasicMaterial color={MINT} />
          </mesh>)}
          <mesh position={[0, -0.074, 0.351]} scale={[0.038, 0.012, 0.009]}>
            <sphereGeometry args={[1, 10, 6]} />
            <meshBasicMaterial color="#61bfa7" />
          </mesh>
          <Box p={[-0.16, 0.329, -0.03]} size={[0.021, 0.175, 0.021]} color="#61758c" />
          <Pill p={[-0.16, 0.428, -0.029]} size={[0.032, 0.034, 0.057]} color={MINT} glow={0.4} />
          {[-1, 1].map((side) => <mesh key={side} position={[side * 0.394, -0.018, 0]}
            rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.1, 0.11, 0.065, 10]} />
            <meshStandardMaterial color="#a37658" flatShading />
          </mesh>)}
        </group>
        {[-1, 1].map((side) => <group key={side} position={[side * 0.305, 1.07, 0]}
          rotation-x={side * gait * 0.38 - 0.45 - loading * 1.14}
          rotation-z={side * (0.2 - loading * 0.19)}>
          <Pill p={[0, 0, 0]} size={[0.096, 0.09, 0.15]} color="#526e7c" />
          <Box p={[0, -0.135, 0]} size={[0.09, 0.23, 0.12]} color="#bd8861" />
          <Pill p={[0, -0.28, 0.007]} size={[0.069, 0.088, 0.134]} color="#ecb267" />
        </group>)}
        {[-1, 1].map((side) => <group key={side} position={[side * 0.16, 0.66, 0]}
          rotation-x={gait * side * 0.55}>
          <Box p={[0, -0.15, 0]} size={[0.13, 0.32, 0.12]} color="#658193" />
          <Pill p={[0, -0.31, 0.013]} size={[0.088, 0.086, 0.15]} color="#25465a" />
          <group position={[0, -0.47, 0.075]} rotation-x={-gait * side * 0.46}>
            <Box p={[0, 0, 0]} size={[0.22, 0.19, 0.32]} color="#bf8258" />
            <Box p={[0, -0.077, 0.026]} size={[0.217, 0.045, 0.345]} color="#355365" />
          </group>
        </group>)}
      </group>
    </group>
  </>;
}

export function Lens({frame}: {frame: number}) {
  const charge = ease(frame, 342, 530);
  return <group position={lensPosition(frame)} rotation={[0.06, frame / 52, frame / 187]}>
    <mesh>
      <icosahedronGeometry args={[0.142 + 0.013 * charge, 0]} />
      <meshStandardMaterial color="#b5ffe7" roughness={0.21} emissive="#73f5c9"
        emissiveIntensity={0.34 + charge * 0.85} flatShading />
    </mesh>
    <mesh rotation-x={Math.PI / 2}>
      <torusGeometry args={[0.173, 0.025, 5, 12]} />
      <meshStandardMaterial color="#eec382" roughness={0.47} />
    </mesh>
    <mesh rotation-y={Math.PI / 2}>
      <torusGeometry args={[0.173, 0.017, 5, 12]} />
      <meshStandardMaterial color="#a8dfdd" roughness={0.37} />
    </mesh>
  </group>;
}

const DISH_PROFILE = [
  [0, 0.018], [0.20, 0], [0.39, 0.026], [0.68, 0.13], [0.95, 0.28],
  [1.15, 0.45], [1.15, 0.52], [1.03, 0.46], [0.76, 0.27], [0.51, 0.15],
  [0.28, 0.08], [0, 0.073],
].map(([x, y]) => new Vector2(x, y));

export function Dish({frame}: {frame: number}) {
  const tilt = dishTilt(frame);
  const panel = ease(frame, 339, 511);
  return <group position={TOWER}>
    <Contact p={[0, 0.014, 0]} size={[1.53, 1, 1.02]} />
    <mesh position-y={0.10}>
      <cylinderGeometry args={[1.0, 1.05, 0.20, 8]} />
      <meshStandardMaterial color="#556878" flatShading />
    </mesh>
    <mesh position-y={0.24}>
      <cylinderGeometry args={[0.67, 0.83, 0.14, 8]} />
      <meshStandardMaterial color="#a08373" flatShading />
    </mesh>
    <mesh position-y={1.09}>
      <cylinderGeometry args={[0.235, 0.47, 1.68, 8]} />
      <meshStandardMaterial color="#557889" roughness={0.76} flatShading />
    </mesh>
    <Box p={[0, 0.68, 1.24]} size={[0.58, 0.98, 0.43]} color="#5b7583" />
    <Box p={[0, 0.988, 1.29]} size={[0.65, 0.33, 0.54]} color="#ad875d" />
    <Box p={[0, 0.995, 1.577]} size={[0.52, 0.22, 0.035]} color="#223d51" />
    {Array.from({length: 5}, (_, index) => <mesh key={index} position={[-0.164 + index * 0.082, 1.006, 1.60]}>
      <boxGeometry args={[0.048, 0.039, 0.018]} />
      <meshBasicMaterial color={index / 5 < panel ? MINT : '#557485'} />
    </mesh>)}
    <group position={[0, 2.01, 0]} rotation-x={tilt}>
      <mesh>
        <latheGeometry args={[DISH_PROFILE, 18]} />
        <meshStandardMaterial color="#ddcab2" roughness={0.81} side={DoubleSide} flatShading />
      </mesh>
      <mesh position-y={0.484} rotation-x={Math.PI / 2}>
        <torusGeometry args={[1.148, 0.049, 6, 18]} />
        <meshStandardMaterial color="#947663" roughness={0.64} flatShading />
      </mesh>
      <mesh position-y={0.44} rotation-x={Math.PI / 2}>
        <torusGeometry args={[1.003, 0.016, 5, 18]} />
        <meshStandardMaterial color="#80cabc" emissive="#96ffdd" emissiveIntensity={panel * 0.45} />
      </mesh>
      <mesh position-y={0.48}>
        <cylinderGeometry args={[0.069, 0.10, 0.84, 8]} />
        <meshStandardMaterial color="#5f7a88" roughness={0.55} />
      </mesh>
      <mesh position-y={0.945}>
        <octahedronGeometry args={[0.162, 0]} />
        <meshStandardMaterial color="#dcffe5" emissive="#7af5db" emissiveIntensity={panel * 1.3} />
      </mesh>
      {[0, 2.094, 4.189].map((angle) => <group key={angle} rotation-y={angle}>
        <mesh position={[0.34, 0.48, 0]} rotation-z={0.99}>
          <cylinderGeometry args={[0.017, 0.023, 0.73, 6]} />
          <meshStandardMaterial color="#466171" />
        </mesh>
      </group>)}
    </group>
  </group>;
}

type Instance = {position: Point; scale: Point; rotation?: Point};
const Scatter = memo(function Scatter({points, color, shape}: {
  points: Instance[]; color: string; shape: 'stone' | 'hill' | 'star';
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new Object3D();
    points.forEach(({position, scale, rotation}, i) => {
      matrix.position.set(...position);
      matrix.rotation.set(...(rotation ?? [0, 0, 0]));
      matrix.scale.set(...scale);
      matrix.updateMatrix();
      mesh.setMatrixAt(i, matrix.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [points]);
  return <instancedMesh ref={ref} args={[undefined, undefined, points.length]}>
    {shape === 'hill' ? <coneGeometry args={[1, 1, 6]} /> : <icosahedronGeometry args={[1, 0]} />}
    {shape === 'star' ? <meshBasicMaterial color={color} fog={false} /> :
      <meshStandardMaterial color={color} flatShading roughness={0.9} />}
  </instancedMesh>;
});

function randomAt(i: number, salt: number) {
  const n = Math.imul(i + 1, 1640531527) ^ Math.imul(salt, 1540483477);
  return ((Math.imul(n ^ (n >>> 16), 2246822519) ^ (n >>> 7)) >>> 0) / 4294967296;
}

const mesa = Array.from({length: 17}, (_, i): Instance => ({
  position: [i * 3.9 - 34, -1.4, -18 - randomAt(i, 39) * 13],
  scale: [4.7 + randomAt(i, 1) * 2.8, 6 + randomAt(i, 18) * 13, 3.9],
  rotation: [0, 0.7 * i, 0.12 * Math.cos(i)],
}));
const hills = Array.from({length: 9}, (_, i): Instance => ({
  position: [i * 5.2 - 24, -0.9 + 0.4 * Math.sin(i * 3), -9 - randomAt(i, 6) * 6],
  scale: [3.3 + randomAt(i, 27) * 2.2, 4 + randomAt(i, 13) * 4, 3.4],
  rotation: [0, 0.85 * i, 0.13 * Math.sin(i)],
}));
const stones = Array.from({length: 50}, (_, i): Instance => {
  const x = randomAt(i, 1) * 19 - 10;
  const z = randomAt(i, 2) * 10 - 5;
  const ridge = z > 2.8 || z < -2.4;
  const width = (ridge ? 0.29 : 0.092) * (0.55 + randomAt(i, 25) * 1.2);
  return {position: [x, 0.035, z], scale: [width, width * 0.45, width * 0.75], rotation: [0, i * 0.73, 0]};
});
const stars = Array.from({length: 90}, (_, i): Instance => {
  const radius = 0.022 + randomAt(i, 13) * 0.039;
  return {position: [randomAt(i, 2) * 115 - 57, 3.2 + randomAt(i, 3) * 52, -55 + randomAt(i, 9) * 4],
    scale: [radius, radius, radius]};
});

const SLOPE_COLORS = ['#694961', '#724f63', '#806175'];
const clouds: Point[] = [[-18, 6.5, -21], [-8, 5.8, -27], [6, 6.7, -21], [21, 5.25, -14]];
const plants: Point[] = [[-5, 0, 3.6], [-6.8, 0, 0.4], [-8.3, 0, -1.4], [-2.8, 0, -2.9],
  [-1.4, 0, 3.3], [2.9, 0, 2.3], [3.5, 0, -0.8], [5.2, 0, -3.8], [-4.2, 0, -3.7]];
const stalks = [[-0.12, -0.30, 0.56], [0.08, 0.36, 0.42], [0.03, 0.03, 0.68]];

const Ground = memo(function Ground() {
  return <>
    <mesh rotation-x={-Math.PI / 2}>
      <planeGeometry args={[125, 125]} />
      <meshStandardMaterial color="#8d626f" roughness={0.95} />
    </mesh>
    <group rotation-y={0.25} position={[-3.05, 0.005, 1.39]}>
      <mesh rotation-x={-Math.PI / 2} scale={[3.76, 0.96, 1]}>
        <circleGeometry args={[1, 11]} />
        <meshStandardMaterial color="#aa797d" roughness={0.97} />
      </mesh>
    </group>
    <Scatter points={stones} color="#654b62" shape="stone" />
    {SLOPE_COLORS.map((color, index) => <Scatter key={color} points={mesa.filter((_, i) => i % 3 === index)}
      color={color} shape="hill" />)}
    <Scatter points={hills} color="#665371" shape="stone" />
    <Scatter points={stars} color="#c2e4dd" shape="star" />
  </>;
});

export function Landscape({frame, motion = 1}: {frame: number; motion?: number}) {
  return <>
    <Ground />
    <mesh position={[10.5, 7.2, -39]}>
      <sphereGeometry args={[2.35, 32, 24]} />
      <meshBasicMaterial color="#f0ad82" fog={false} />
    </mesh>
    {clouds.map(([x, y, z], i) => <mesh key={i} position={[x + frame * 0.0017 * motion, y, z]}
      scale={[3.6, 0.18, 0.48]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial color={i % 2 ? '#4e4a66' : '#5c516b'} />
    </mesh>)}
    {plants.map((pos, i) => <group key={i} position={pos} rotation-y={i * 2.3}
      rotation-z={Math.sin(frame * 0.052 + i * 0.7) * 0.1 * motion} scale={i === 0 ? 1.8 : 1}>
      {stalks.map(([x, angle, height], twig) => <mesh key={twig} position={[x, height * 0.45, 0]}
        rotation-z={angle}>
        <coneGeometry args={[0.077, height, 4]} />
        <meshStandardMaterial color={twig % 2 ? '#779597' : '#506f83'} flatShading />
      </mesh>)}
    </group>)}
  </>;
}

const CONSTELLATION: Point[] = [[-2.6, 4.0, -8.5], [-1.3, 5.8, -9], [0.2, 5.4, -9.1],
  [1.2, 6.6, -9.1], [2.55, 5.3, -8.8], [1.65, 3.85, -8.45], [0.2, 5.4, -9.1]];

function Thread({a, b, visible, index}: {a: Point; b: Point; visible: number; index: number}) {
  const dx = (b[0] - a[0]) * visible;
  const dy = (b[1] - a[1]) * visible;
  const dz = (b[2] - a[2]) * visible;
  const horizontal = Math.hypot(dx, dy);
  return <group position={[a[0] + dx / 2, a[1] + dy / 2, a[2] + dz / 2]}
    rotation-z={-Math.atan2(dx, dy)}>
    <mesh rotation-x={Math.atan2(dz, horizontal)} renderOrder={index}>
      <cylinderGeometry args={[0.012, 0.012, Math.hypot(horizontal, dz), 5]} />
      {/* Test against opaque scenery and nodes without resolving depth between intersecting threads. */}
      <meshBasicMaterial color={index % 2 ? '#89d9d6' : '#a2fce2'} fog={false} transparent
        depthWrite={false} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
    </mesh>
  </group>;
}

export function Signal({frame, enhanced}: {frame: number; enhanced: boolean}) {
  const beam = ease(frame, 541, 551) * (1 - ease(frame, 579, 617));
  const burst = ease(frame, 539, 552) * (1 - ease(frame, 562, 593));
  const limit = enhanced ? 1 : 0.66;
  return <>
    {beam > 0 && <group position={feedPosition(frame)} rotation={[0.17, 0, -0.07]}>
      <mesh position-y={6.4}>
        <cylinderGeometry args={[0.030, 0.052, 12.8, 8, 1, true]} />
        <meshBasicMaterial color="#afffe1" transparent opacity={beam * limit * 0.54} depthWrite={false}
          blending={AdditiveBlending} side={DoubleSide} fog={false} />
      </mesh>
      {enhanced && <mesh position-y={6.4}>
        <cylinderGeometry args={[0.084, 0.19, 12.8, 10, 1, true]} />
        <meshBasicMaterial color="#4dfadf" transparent opacity={burst * 0.095} depthWrite={false}
          blending={AdditiveBlending} side={DoubleSide} fog={false} />
      </mesh>}
    </group>}
    {frame >= 557 && CONSTELLATION.map((point, i) => {
      const shown = ease(frame, 558 + i * 6, 575 + i * 6);
      return <group key={i}>
        {i < CONSTELLATION.length - 1 && shown > 0 &&
          <Thread a={point} b={CONSTELLATION[i + 1]} visible={shown} index={i} />}
        {i < CONSTELLATION.length - 1 && <mesh position={point} scale={shown * (i === 3 ? 0.136 : 0.068)}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color={i === 3 ? '#fff0bf' : MINT} fog={false} />
        </mesh>}
      </group>;
    })}
  </>;
}
