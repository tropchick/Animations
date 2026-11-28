import {memo, useLayoutEffect, useMemo, useRef} from 'react';
import {Color, DynamicDrawUsage, IcosahedronGeometry, InstancedMesh, Object3D, Quaternion, Vector3} from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {clamp, lerp, sampleRandom} from './math';
import {windSway} from './environment';
import {compileWorldReaction} from './world-reactions';
import {compileChoreography, worldEventsFromPlan} from './choreography';
import {DeformGeometry, ImpactOutline} from './spatial-effects';
import rawPlan from './demo-garden-plan.json';

export type GardenPoint = [number, number, number];
export const GARDEN = {leaf: '#8bc465', light: '#f6ebcf', seed: '#8aebc5', terra: '#c26550', plum: '#594453'} as const;
export const DOCK: GardenPoint = [0.20, 0.70, -0.80];
export const HAND: GardenPoint = [-1.18, 0.98, 1.69];
export const BUD: GardenPoint = [-0.28, 3.20, -15.42];
export const DEW_PALM: GardenPoint = [0.04, 3.99, -15.28];
export const GARDEN_PLAN = compileChoreography(rawPlan);
const stages = Object.fromEntries(GARDEN_PLAN.cues.map(({id, at}) => [id, at]));

export const fraction = (frame: number, a: number, b: number) => clamp((frame - a) / (b - a));
export function ease(frame: number, start: number, end: number) {
  const t = fraction(frame, start, end);
  return t * t * (3 - 2 * t);
}
const waves = (f: number, at: number, length: number) => Math.sin(Math.PI * fraction(f, at, at + length)) ** 2;
function point(a: GardenPoint, b: GardenPoint, t: number): GardenPoint {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function seedAt(frame: number): GardenPoint {
  if (frame <= 46) {
    const p = fraction(frame, 0, 46);
    const bounce = frame <= 18 ? 0.75 * (1 - fraction(frame, 0, 18) ** 2)
      : 0.61 * Math.sin(Math.PI * fraction(frame, 18, 45)) + 0.75 * ease(frame, 31, 46);
    return [lerp(1.02, HAND[0], p), 0.23 + bounce, lerp(1.08, HAND[2], p)];
  }
  if (frame < 99) return point(HAND, [0.15, 1.10, -0.48], ease(frame, 53, 92));
  const p = ease(frame, 101, 124);
  return [lerp(0.15, DOCK[0], p), lerp(1.10, DOCK[1], p), lerp(-0.48, DOCK[2], p)];
}

const BOX = new RoundedBoxGeometry(1, 1, 1, 1, 0.13);
const SEED_GEOMETRY = new IcosahedronGeometry(1, 1);
const Y: GardenPoint = [0, 0, 0];
type Part = {p: GardenPoint; s: GardenPoint; color: string; r?: GardenPoint};
type Shape = 'block' | 'box' | 'ball' | 'cone' | 'leaf';
function PartGeometry({shape}: {shape: Shape}) {
  switch (shape) {
    case 'block': return <boxGeometry args={[1, 1, 1]} />;
    case 'cone': return <coneGeometry args={[0.5, 1, 7]} />;
    case 'ball': return <icosahedronGeometry args={[0.5, 0]} />;
    case 'leaf': return <sphereGeometry args={[0.5, 7, 5]} />;
    default: return <primitive object={BOX} attach="geometry" dispose={null} />;
  }
}

function Batch({parts, shape = 'block', basic = false, capacity = parts.length}: {
  parts: readonly Part[]; shape?: Shape; basic?: boolean; capacity?: number;
}) {
  const mesh = useRef<InstancedMesh>(null);
  const transform = useMemo(() => new Object3D(), []);
  const pigment = useMemo(() => new Color(), []);
  useLayoutEffect(() => {
    const instance = mesh.current;
    if (!instance) return;
    instance.count = parts.length;
    instance.instanceMatrix.setUsage(DynamicDrawUsage);
    parts.forEach(({p, s, color, r}, i) => {
      transform.position.set(...p);
      transform.rotation.set(...(r ?? Y));
      transform.scale.set(...s);
      transform.updateMatrix();
      instance.setMatrixAt(i, transform.matrix);
      instance.setColorAt(i, pigment.set(color));
    });
    instance.instanceMatrix.needsUpdate = true;
    if (instance.instanceColor) instance.instanceColor.needsUpdate = true;
  }, [parts, pigment, transform]);
  if (!capacity) return null;
  return <instancedMesh ref={mesh} args={[undefined, undefined, capacity]} frustumCulled={false}>
    <PartGeometry shape={shape} />
    {basic ? <meshBasicMaterial color="#fff" /> :
      <meshStandardMaterial color="#fff" roughness={0.84} flatShading={shape !== 'leaf'} />}
  </instancedMesh>;
}

function SoftBox({p, s, color, r}: Part) {
  return <mesh geometry={BOX} position={p} scale={s} rotation={r}>
    <meshStandardMaterial color={color} roughness={0.79} />
  </mesh>;
}

function Round({p, s, color, r, shine = 0.82}: Part & {shine?: number}) {
  return <mesh position={p} scale={s} rotation={r}>
    <sphereGeometry args={[0.5, 12, 8]} />
    <meshStandardMaterial color={color} roughness={shine} />
  </mesh>;
}

function Shadow({p, s, opacity = 0.22}: {p: GardenPoint; s: GardenPoint; opacity?: number}) {
  return <mesh position={p} scale={s} rotation-x={-Math.PI / 2}>
    <circleGeometry args={[1, 20]} />
    <meshBasicMaterial color="#45314e" transparent opacity={opacity} depthWrite={false} />
  </mesh>;
}

type Pose = {origin: GardenPoint; yaw: number; lean: number; eyes: number; wave: number; catch: number; walk: number};
export function gardenerPose(frame: number): Pose {
  if (frame >= 456) return {
    origin: [0.50, 3.17, -15.50], yaw: -0.25 - 0.22 * fraction(frame, 661, 740),
    lean: 0.045 + 0.13 * waves(frame, 666, 132), eyes: 0.25 + 0.52 * waves(frame, 751, 60),
    wave: ease(frame, 718, 756) - ease(frame, 791, 837), catch: 0, walk: 0,
  };
  const rush = ease(frame, 9, 45);
  const move = ease(frame, 53, 96);
  const leave = ease(frame, 188, 282);
  const climb = ease(frame, 247, 329);
  const z = 1.18 - 1.72 * move - 3.27 * leave - 3.02 * climb;
  const y = 0.69 * ease(-z, 3.16, 4.16);
  return {
    origin: [-0.43 - 0.38 * rush + 1.55 * move - 1.29 * leave + 0.35 * climb, y, z],
    yaw: -0.32 - 0.27 * ease(frame, 20, 45) - 1.0 * move + 0.7 * ease(frame, 129, 159) - 1.95 * leave,
    lean: 0.10 + 0.25 * waves(frame, 10, 61) + 0.14 * waves(frame, 95, 52),
    eyes: 0.25 + 0.72 * waves(frame, 15, 54),
    wave: 0,
    catch: ease(frame, 27, 43) - ease(frame, 133, 153),
    walk: Math.sin(frame * 0.177) * (waves(frame, 7, 34) + waves(frame, 49, 53)
      + waves(frame, 176, 72) + waves(frame, 263, 82)),
  };
}

const UP = new Vector3(0, 1, 0);
function ReachingArm({pose, frame, stance}: {pose: Pose; frame: number; stance: number}) {
  const {origin, yaw, lean, catch: hold, wave, walk} = pose;
  const root = new Vector3(...origin);
  const position = (x: number, y: number, z: number) => new Vector3(x, y, z)
    .applyAxisAngle(UP, yaw).add(root);
  const shoulder = position(-0.266, 0.826 + stance, 0.022);
  const rest = position(-0.326, 0.56 + stance, 0.05 + walk * 0.11);
  const target = frame >= 650 ? new Vector3(...DEW_PALM) : new Vector3(...seedAt(frame));
  target.y -= 0.064;
  const palm = rest.lerp(target, frame < 650 ? hold : wave);
  const direction = palm.clone().sub(shoulder);
  const q = new Quaternion().setFromUnitVectors(UP, direction.clone().normalize());
  const center = shoulder.clone().addScaledVector(direction, 0.45);
  return <>
    <mesh position={center} quaternion={q} scale={[0.17, Math.max(0.18, direction.length()), 0.18]}>
      <sphereGeometry args={[0.5, 12, 8]} />
      <meshStandardMaterial color="#c9a05f" roughness={0.86} />
    </mesh>
    <Round p={palm.toArray()} s={[0.17, 0.13 + 0.025 * (1 - wave), 0.18]}
      r={[lean, yaw * 0.3, 0.04 - hold * 0.32]} color="#e4bc86" />
  </>;
}

export function Gardener({frame}: {frame: number}) {
  const pose = gardenerPose(frame);
  const {origin, yaw, lean, eyes, catch: hold, walk} = pose;
  const blink = [10, 74, 145, 233, 463, 517, 673, 729, 789].reduce(
    (value, at) => Math.min(value, 1 - 0.91 * Math.max(0, 1 - Math.abs(frame - at) / 2.1)), 1,
  );
  const perk = waves(frame, 749, 84);
  const stance = Math.abs(walk) * 0.046;
  return <>
    <Shadow p={[origin[0], origin[1] + 0.016, origin[2]]} s={[0.41, 0.29, 1]} />
    <ReachingArm pose={pose} frame={frame} stance={stance} />
    <group position={origin} rotation-y={yaw}>
      {[-1, 1].map((side) => <group key={side} position={[side * 0.135, 0.55 + stance, 0]}
        rotation-x={side * walk * 0.47}>
        <Round p={[0, -0.175, 0]} s={[0.17, 0.36, 0.17]} color="#4d454f" />
        <SoftBox p={[0, -0.425, 0.061]} s={[0.22, 0.19, 0.32]} color="#6f6860" />
        <SoftBox p={[0, -0.503, 0.067]} s={[0.23, 0.045, 0.33]} color="#50444d" />
      </group>)}
      <group position={[0, 0.70 + stance, 0]} rotation-x={lean} rotation-z={0.09 * walk}>
        <Round p={[0, -0.015, 0.012]} s={[0.58, 0.68, 0.45]} color="#c69954" />
        <SoftBox p={[0, -0.09, 0.211]} s={[0.29, 0.25, 0.065]} color="#a2a757" />
        <SoftBox p={[0.023, -0.16, -0.223]} s={[0.34, 0.30, 0.22]} color="#7f4f52" />
        <Round p={[0.19, -0.18, -0.31]} s={[0.33, 0.24, 0.20]} color="#b38561" />
        <group position={[0.26, 0.131, 0.007]} rotation-x={-0.18 + walk * 0.25 - hold * 0.41}
          rotation-z={0.14 + 0.13 * hold}>
          <Round p={[0, -0.125, 0]} s={[0.18, 0.37, 0.19]} color="#c9a05f" />
          <Round p={[0, -0.295, 0.032]} s={[0.164, 0.152, 0.163]} color="#e4bc86" />
        </group>
        <group position={[0, 0.475, 0.047]} rotation-x={-0.11 - perk * 0.15}
          rotation-z={-0.06 + perk * 0.15}>
          <Round p={[0, 0.013, 0.011]} s={[0.68, 0.55, 0.57]} color="#bc855f" />
          {[-1, 1].map((side) => <group key={side} rotation-z={-0.12 * side}
            position={[side * 0.296, 0.195, -0.035]}>
            <Round p={[0, 0.01, 0]} s={[0.238, 0.235, 0.13]} color="#ae765f" />
            <Round p={[0, 0.015, 0.049]} s={[0.152, 0.151, 0.057]} color="#d29879" />
          </group>)}
          <Round p={[0, -0.068, 0.24]} s={[0.45, 0.275, 0.23]} color="#f4d19a" />
          {[-1, 1].map((side) => <group key={side} position={[side * 0.128 - (0.018 * eyes), 0.054, 0.263]}>
            <Round p={[0, 0, 0]} s={[0.047 + 0.009 * eyes, 0.078 * blink, 0.044]} color="#4b322a" />
            {blink > 0.55 && <Round p={[-0.008, 0.017, 0.019]} s={[0.018, 0.018, 0.014]} color="#fff0c7" />}
          </group>)}
          <Round p={[0, -0.041, 0.345]} s={[0.118, 0.079, 0.084]} color="#704c40" />
          <Round p={[0, -0.129, 0.33]} s={[0.064, 0.019 + perk * 0.044, 0.021]} color="#8e5245" />
          <Round p={[0, 0.234, 0.017]} s={[0.50, 0.20, 0.50]} color="#9eac64" />
          <Round p={[0.065, 0.181, 0.13]} s={[0.545, 0.055, 0.44]} color="#acb773" />
          <Round p={[0.05, 0.325, -0.02]} s={[0.081, 0.069, 0.081]} color="#d7cd84" />
        </group>
      </group>
    </group>
  </>;
}

export function Seed({frame, deformation = 0, contour = false}: {frame: number; deformation?: number; contour?: boolean}) {
  if (frame > 152) return null;
  const seated = ease(frame, 123, 147);
  const rotation: GardenPoint = [frame / 28, frame / 15, frame / 16];
  return <group position={seedAt(frame)} rotation={rotation} scale={1 - 0.86 * seated}>
    <group rotation-z={0.3} scale={[0.136, 0.21, 0.132]}>
      <DeformGeometry geometry={SEED_GEOMETRY} axis={[0, 1, 0]} stretch={1 - 0.22 * deformation}>
        {({geometry}) => <>
          <mesh geometry={geometry}>
            <meshStandardMaterial color={GARDEN.seed} emissive="#35b895" emissiveIntensity={0.22 + deformation * 0.32}
              roughness={0.32} flatShading />
          </mesh>
          {contour && <ImpactOutline geometry={geometry} frame={frame} at={44}
            duration={13} size={1} strength={0.9} thickness={0.13} color="#f5e5a6" />}
        </>}
      </DeformGeometry>
    </group>
    <mesh rotation-x={0.31} rotation-z={0.53} scale={[1, 1.48, 1]}>
      <torusGeometry args={[0.128, 0.018, 6, 19]} />
      <meshStandardMaterial color="#ffe2a4" roughness={0.67} />
    </mesh>
  </group>;
}

const platforms: Part[] = [
  {p: [0, -0.43, 2.3], s: [10.2, 0.84, 13.15], color: '#bf8b70'},
  {p: [0, -0.01, 2.3], s: [10.3, 0.07, 13.12], color: '#ddb495'},
  {p: [0, 0.31, -6.56], s: [11.8, 0.74, 5.06], color: '#be8c70'},
  {p: [0, 0.694, -6.54], s: [11.83, 0.074, 5.07], color: '#ddb398'},
  {p: [0, 0.78, -11.58], s: [13.2, 1.54, 5.17], color: '#ae7668'},
  {p: [0, 1.556, -11.58], s: [13.3, 0.08, 5.18], color: '#d2a185'},
  {p: [0, 1.66, -16.65], s: [15.4, 3.03, 5.63], color: '#9c696c'},
  {p: [0, 3.14, -16.65], s: [15.6, 0.075, 5.65], color: '#e2b798'},
];
const masonry: Part[] = [];
const trims: Part[] = [];
const shades: Part[] = [];
const planterPots: Part[] = [];
type Bed = {size?: number; p: GardenPoint; stage: keyof typeof stages; phase: number; kind: number; city?: boolean};
const beds: Bed[] = [];
const farBeds: Bed[] = [];

function buildHouse(x: number, y: number, z: number, index: number, scale = 1, skyline = false) {
  const walls = ['#bc765f', '#a86d75', '#dfb184', '#cd9679', '#a77d9d', '#d9996b'];
  const roofColors = ['#9e5f59', '#735175', '#75908a', '#a95f56', '#73516b', '#99724d'];
  const width = (1.91 + 0.42 * sampleRandom(36, index)) * scale;
  const height = (2.03 + 1.76 * sampleRandom(12, index)) * scale;
  const depth = (1.7 + 0.25 * sampleRandom(18, index)) * scale;
  const offset = y + 0.11;
  masonry.push({p: [x, offset + height / 2, z], s: [width, height, depth], color: walls[index % walls.length]});
  masonry.push({p: [x, offset + height + 0.07 * scale, z],
    s: [width + 0.20 * scale, 0.18 * scale, depth + 0.23 * scale], color: roofColors[index % roofColors.length]});
  const front = z + depth / 2 + 0.013;
  if (skyline) {
    trims.push({p: [x, offset + 0.62 * height, front], s: [width * 0.68, 0.12 * scale, 0.054 * scale], color: '#f6c996'});
  } else {
    trims.push({p: [x, offset + 0.11, front], s: [width, 0.19 * scale, 0.074 * scale], color: '#b18173'});
    trims.push({p: [x, offset + height * 0.63, front], s: [width, 0.16 * scale, 0.077 * scale], color: '#edbd94'});
    const doorX = x + 0.28 * scale;
    shades.push({p: [doorX, offset + 0.54 * scale, front], s: [0.48 * scale, 1.04 * scale, 0.08 * scale], color: '#715563'});
    for (const side of [-1, 1]) {
      const win = x + side * width * 0.235;
      shades.push({p: [win, offset + height * 0.78, front], s: [0.31 * scale, 0.51 * scale, 0.07 * scale], color: '#775466'});
      trims.push({p: [win, offset + height * 0.78, front + 0.038],
        s: [0.19 * scale, 0.35 * scale, 0.04 * scale], color: index % 2 ? '#d9bc8b' : '#9fbaa3'});
    }
    trims.push({p: [doorX, offset + 1.28 * scale, front + 0.13], r: [0.17, 0, 0],
      s: [0.74 * scale, 0.13 * scale, 0.37 * scale], color: index % 2 ? '#ab716b' : '#aeaa84'});
  }
  return offset + height + 0.17 * scale;
}

for (const row of [0, 1, 2, 3]) {
  const z = [0, -5.9, -11.3, -17.25][row];
  const y = [0.035, 0.73, 1.60, 3.18][row];
  for (const side of [-1, 1]) {
    const x = side * (3.52 + row * 0.31);
    const roof = buildHouse(x, y, z, row * 2 + (side > 0 ? 1 : 0));
    if (row !== 0) beds.push({p: [x, roof, z + 0.21], stage: ['terrace', 'terrace', 'alley', 'roof'][row],
      phase: row * 3 + side * 2, kind: row + side});
    const signX = side * (2.2 + row * 0.16);
    planterPots.push({p: [signX, y + 0.225, z - 0.46], s: [0.89, 0.40, 0.52], color: '#b96f62'});
    trims.push({p: [signX, y + 0.396, z - 0.46], s: [0.94, 0.10, 0.56], color: '#e3a786'});
    for (let u = -2; u <= 2; u++) beds.push({p: [signX + 0.16 * u, y + 0.42, z - 0.46],
      stage: ['courtyard', 'terrace', 'alley', 'roof'][row], phase: u * 2 + side * 4, kind: u + row + 3});
  }
}
for (const [border, rise, base] of [[-4.07, 0.69, 0], [-9.02, 0.85, 0.73], [-14.08, 1.55, 1.6]]) {
  for (let i = 0; i < 5; i++) {
    const height = rise * (i + 1) / 5;
    trims.push({p: [0.0, base + height / 2, border + 0.89 - i * 0.223],
      s: [2.7, height, 0.23], color: i % 2 ? '#d7a98c' : '#e1b597'});
  }
}
const streetCount = masonry.length, streetTrims = trims.length;
for (let row = 0; row < 6; row++) {
  const z = -20 - row * 5.46;
  const y = 2.82 + row * 0.78;
  platforms.push({p: [0, y / 2, z], s: [32 + row * 3.9, y, 6.1], color: ['#ad827f', '#b58486', '#b38b84'][row % 3]});
  const n = 8 + row;
  for (let i = 0; i < n; i++) {
    const index = row * 13 + i;
    const x = (i - (n - 1) / 2) * (row < 2 ? 3.67 : 3.26) + (sampleRandom(6, index) - 0.5) * 1.12;
    if (Math.abs(x) < 1.25) continue;
    const roof = buildHouse(x, y, z - 0.62 * sampleRandom(4, index),
      12 + index, 0.89 + 0.20 * sampleRandom(77, index), true);
    if (sampleRandom(1, index) < 0.22) continue;
    for (let k = -1; k <= 1; k++) farBeds.push({
      p: [x + k * 0.42, roof, z + 0.02], phase: row * 7 + Math.abs(x) * 0.62 + k * 2,
      stage: 'city', kind: index + k + 1, city: true,
    });
  }
}
for (let i = 0; i < 11; i++) {
  beds.push({p: [-2.26 + (i % 6) * 0.47, 3.22, -15.21 - Math.floor(i / 6) * 0.73],
    stage: 'roof', phase: i * 1.7, kind: i + 1});
}

const channelPots = [
  [-0.34, 0.73, -6.30, 'terrace'], [0.96, 0.73, -6.91, 'terrace'],
  [-0.19, 1.60, -10.72, 'alley'], [0.94, 1.60, -11.45, 'alley'],
] as const;
for (const [i, [x, y, z, stage]] of channelPots.entries()) {
  planterPots.push({p: [x, y + 0.15, z], s: [0.54, 0.29, 0.64],
    color: i % 2 ? '#b56a62' : '#8b676e'});
  const dz = 0.19;
  for (const [j, step] of [-1, 0, 1].entries()) {
    beds.push({p: [x + 0.1 * Math.sin(j * Math.PI / 2), y + 0.286, z + step * dz],
      stage, phase: j * 2, kind: i * 3 + j + 3, size: j === 1 ? 1.7 : 1.2});
  }
}

const pebbles: Part[] = Array.from({length: 44}, (_, i) => {
  const y = i < 21 ? 0.036 : i < 32 ? 0.731 : 1.596;
  const z0 = i < 21 ? 0 : i < 32 ? -6.6 : -11.4;
  const width = 0.06 + 0.13 * sampleRandom('size', i);
  return {p: [(sampleRandom('px', i) - 0.50) * 9, y, z0 + (sampleRandom('pz', i) - 0.50) * 3.3],
    s: [width, width * 0.53, width * 0.81], r: [0, i * 1.25, 0],
    color: i % 2 ? '#b2826d' : '#ebc099'};
});
const roofCanopies = farBeds.filter((_, i) => i % 3 === 1);

const hilltops: Part[] = Array.from({length: 18}, (_, i) => ({
  p: [(i - 8.5) * 5.4, -0.5 + sampleRandom(234, i) * 4.6, -47 - sampleRandom(61, i) * 21],
  s: [9 + sampleRandom(7, i) * 7, 10 + sampleRandom(12, i) * 10, 10 + sampleRandom(4, i) * 9],
  r: [0, 0.27 * i, 0], color: ['#b1a5ac', '#b4a1a8', '#c4afb0', '#ac9ca8'][i % 4],
}));

const streets = masonry.slice(0, streetCount);
const distant = masonry.slice(streetCount);
const streetsTrim = trims.slice(0, streetTrims);
const distantTrim = trims.slice(streetTrims);
const inkTerrain = platforms.slice(0, 8);
const farTerrain = platforms.slice(8);

export const GardenArchitecture = memo(function GardenArchitecture({city}: {city: boolean}) {
  return <>
    <Batch parts={inkTerrain} />
    <Batch parts={streets} shape="box" />
    <Batch parts={shades} shape="box" />
    <Batch parts={streetsTrim} shape="block" />
    <Batch parts={planterPots} shape="box" />
    <Batch parts={pebbles} shape="ball" />
    <Batch parts={hilltops} shape="cone" />
    {city && <>
      <Batch parts={farTerrain} />
      <Batch parts={distant} shape="box" />
      <Batch parts={distantTrim} />
    </>}
  </>;
});

export function Hub({frame}: {frame: number}) {
  const awake = ease(frame, 123, 163);
  return <group position={[DOCK[0], 0.025, DOCK[2]]}>
    <Shadow p={[0, 0.007, 0]} s={[0.83, 0.79, 1]} />
    <mesh position-y={0.075}>
      <cylinderGeometry args={[0.61, 0.72, 0.14, 8]} /><meshStandardMaterial color="#a46553" roughness={0.85} />
    </mesh>
    <mesh position-y={0.29}>
      <cylinderGeometry args={[0.34, 0.39, 0.42, 8]} /><meshStandardMaterial color="#c58a6c" flatShading />
    </mesh>
    <mesh position-y={0.52}>
      <cylinderGeometry args={[0.37, 0.32, 0.14, 8]} /><meshStandardMaterial color="#ae6556" flatShading />
    </mesh>
    <mesh rotation-x={-Math.PI / 2} position-y={0.60}>
      <torusGeometry args={[0.295, 0.048, 6, 16]} />
      <meshStandardMaterial color="#e7b488" roughness={0.76} />
    </mesh>
    <mesh rotation-x={-Math.PI / 2} position-y={0.598}>
      <circleGeometry args={[0.27, 21]} />
      <meshStandardMaterial color={awake > 0.06 ? '#80d3ae' : '#774f42'}
        emissive="#74dca9" emissiveIntensity={awake * 0.44} roughness={0.38} />
    </mesh>
    {[-1, 1].map((side) => <group key={side} position={[side * 0.355, 0.25, 0.055]}>
      <SoftBox p={[0, 0, 0]} s={[0.083, 0.175, 0.11]} color="#e1ab7d" />
      {awake > 0.02 && <Round p={[side * 0.034, 0.057, 0.038]} s={[0.036, 0.045, 0.032]} color="#c1f1ae" />}
    </group>)}
  </group>;
}

const puddleBox: Part[] = [{p: [-1.33, 0.027, 1.96], s: [1.72, 0.055, 0.47], color: '#875b53'}];
for (let i = 0; i < 7; i++) puddleBox.push({
  p: [-2.02 + 0.224 * i, 0.064, 1.96], s: [0.063, 0.032, 0.47], color: '#9d7766',
});
export const CatchDrain = memo(function CatchDrain() {
  return <Batch parts={puddleBox} shape="box" />;
});

const GROOVE = '#826a6d';
const route: GardenPoint[] = [
  [0.19, 0.073, -0.5], [0.12, 0.075, -1.6], [0.68, 0.087, -3.24], [0.68, 0.15, -3.48],
  [0.68, 0.762, -4.12], [0.57, 0.779, -6.12], [0.55, 0.785, -8.09], [0.54, 1.614, -9.12],
  [0.25, 1.63, -11.77], [0.1, 1.67, -13.35], [0.07, 3.236, -14.20], [-0.1, 3.246, -15.33],
  [-0.38, 3.24, -16.67], [-0.42, 3.24, -18.74],
];
function segment(a: GardenPoint, b: GardenPoint, width: number, color: string): Part {
  const dz = b[2] - a[2], dx = b[0] - a[0], dy = b[1] - a[1];
  return {p: point(a, b, 0.5), s: [width, 0.028, Math.hypot(dx, dy, dz) + 0.026],
    r: [-Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(dx, dz), 0], color};
}
const groove = route.slice(1).map((end, i) => segment(route[i], end, 0.19, GROOVE));
const FLOW_CLOCK = [126, 147, 172, 218, 247, 265, 306, 336, 362, 419, 458, 493, 513, 555];

export function GardenWater({frame}: {frame: number}) {
  const water = useMemo(() => route.slice(1).map((next, i) => {
    const t = ease(frame, FLOW_CLOCK[i], FLOW_CLOCK[i + 1]);
    const start = route[i];
    const a: GardenPoint = [start[0], start[1] + 0.024, start[2]];
    const b = point(a, [next[0], next[1] + 0.024, next[2]], t);
    return segment(a, b, t > 0 ? 0.106 : 0, i % 2 ? '#71bca7' : '#86d4b4');
  }), [frame]);
  return <>
    <Batch parts={groove} />
    <Batch parts={water} basic />
  </>;
}


const CITY_ROUTE: GardenPoint[] = [
  [-0.42, 3.25, -18.74], [-0.77, 4.15, -20.6], [-0.75, 4.15, -23.14],
  [0.42, 4.94, -25.15], [0.43, 4.94, -28.02], [0.92, 5.66, -30.67],
  [0.52, 5.67, -33.29], [-0.68, 6.47, -36.02], [-0.51, 6.47, -39.14],
  [0.74, 7.24, -41.48], [0.83, 7.24, -45.14], [0.01, 8.0, -48.91],
];
const cityTrough = CITY_ROUTE.slice(1).map((end, i) => {
  const trough = segment(CITY_ROUTE[i], end, 0.66, '#6c7376');
  trough.s[1] = 0.15;
  return trough;
});
const cityPiers: Part[] = CITY_ROUTE.slice(1).map(([x, y, z]) => ({
  p: [x, y - 0.71, z], s: [0.32, 1.43, 0.31], color: '#8a6470',
}));
const cityMats = roofCanopies.map(({p: [x,y,z]}) => ({p: [x, y + 0.025, z - 0.22] as GardenPoint,
  s: [1.42, 0.10, 1.18] as GardenPoint, color: '#8e7770'}));

export function CityAqueduct({frame}: {frame: number}) {
  const flow = useMemo(() => CITY_ROUTE.slice(1).map((end, i) => {
    const a = [...CITY_ROUTE[i]] as GardenPoint;
    a[1] += 0.085;
    const raised: GardenPoint = [end[0], end[1] + 0.085, end[2]];
    const started = stages.city + i * 5.5;
    const live = ease(frame, started, started + 13);
    return segment(a, point(a, raised, live), 0.44 * live, i % 2 ? '#78cbaa' : '#8dd7b1');
  }), [frame]);
  return <>
    <Batch parts={cityPiers} />
    <Batch parts={cityTrough} />
    <Batch parts={cityMats} shape="box" />
    <Batch parts={flow} basic />
  </>;
}

const PETALS = ['#f58e81', '#f0be6b', '#f0afab', '#c7b2de', '#fed3a2'];
const FOLIAGE = ['#75a650', '#89b95c', '#97b65f', '#609279', '#699d62', '#7da852'];

const cityBeds = [...beds, ...farBeds];
const receiver = (id: number) => `flower-${id}`;
const growth = compileWorldReaction({
  origins: Object.fromEntries(cityBeds.map(({p}, i) => [receiver(i), p])),
  initial: Object.fromEntries(cityBeds.map((_, i) => [receiver(i), {grown: 0}])),
  events: worldEventsFromPlan(GARDEN_PLAN).map((event) => ({
    ...event,
    targets: cityBeds.flatMap((bed, i) => bed.stage === event.id ? [receiver(i)] : []),
  })),
});

export function GardenPlants({frame, city, seed, reactionGain}: {
  frame: number; city: boolean; seed: number; reactionGain: number;
}) {
  const detailed = city ? cityBeds : beds;
  const {leaves, buds, stems, canopy} = useMemo(() => {
    const leaves: Part[] = [], buds: Part[] = [], stems: Part[] = [], canopy: Part[] = [];
    for (const [i, entry] of detailed.entries()) {
      const [x, y, z] = entry.p;
      const patch = growth(frame - entry.phase, receiver(i));
      const full = (0.40 + 0.31 * sampleRandom(seed, i) + (entry.city ? 0.5 : 0)) * (entry.size ?? 1);
      const amount = typeof patch.state.grown === 'number' ? patch.state.grown : 0;
      if (amount <= 0) continue;
      const h = full * amount * (1 + 0.21 * reactionGain * patch.pulse);
      const wind = windSway({frame, seed: i, amplitude: 0.13, speed: 0.26, intensity: amount});
      const color = FOLIAGE[entry.kind % FOLIAGE.length];
      if (entry.city && i % 3 === 1) {
        canopy.push({p: [x, y + 0.052, z - 0.22],
          s: [1.50 * amount, 0.11, 1.35 * amount], color: i % 2 ? '#8eaf6b' : '#a9ba72'});
        canopy.push({p: [x + 0.34, y + 0.19, z - 0.44],
          s: [h * 0.96, h * 0.48, h * 0.76], color});
      }
      stems.push({p: [x, y + h * 0.5, z], s: [0.045, h, 0.045], r: [wind[0], 0, wind[2]], color: '#759964'});
      for (const side of [-1, 1]) leaves.push({
        p: [x + side * h * 0.24, y + h * (side > 0 ? 0.60 : 0.47), z],
        s: [h * 0.68, h * 0.25, h * 0.39], r: [wind[0], 2.33 * i, wind[2] + side * 0.56], color,
      });
      buds.push({p: [x + wind[2] * h * 0.37, y + h * 1.01, z],
        s: [0.42 * h, 0.39 * h, 0.39 * h], r: [wind[0], 2.1 * i, -wind[2]],
        color: PETALS[entry.kind % PETALS.length]});
    }
    return {leaves, buds, stems, canopy};
  }, [detailed, reactionGain, frame, seed]);
  return <>
    <Batch parts={leaves} shape="leaf" capacity={detailed.length * 2} />
    <Batch parts={buds} shape="ball" capacity={detailed.length} />
    <Batch parts={stems} shape="block" capacity={detailed.length} />
    {city && <Batch parts={canopy} shape="leaf" capacity={(roofCanopies.length + 2) * 2} />}
  </>;
}

const SHADE_BAYS = [
  [-1.03, 0.73, -5.41, 'awning'], [1.15, 0.73, -6.87, 'terrace'],
  [-0.98, 1.59, -11.10, 'alley'], [0.25, 1.60, -13.29, 'trellis'],
  [2.09, 3.17, -16.3, 'roof'], [-2.5, 3.17, -18.02, 'ridge'],
] as const;

export function AwakenAwnings({frame}: {frame: number}) {
  const {posts, shades} = useMemo(() => {
    const posts: Part[] = [], shades: Part[] = [];
    for (const [i, [x, y, z, id]] of SHADE_BAYS.entries()) {
      const clock = stages[id];
      const erect = ease(frame, clock, clock + 29);
      const unfurl = ease(frame, clock + 13, clock + 42);
      const feature = id === 'trellis' ? 1.85 : 1.13;
      const height = 0.14 + 0.92 * erect * feature;
      const spread = 0.86 * unfurl * feature;
      const sway = windSway({frame, seed: i, amplitude: 0.05, speed: 0.28, intensity: erect});
      for (const side of [-1, 1]) {
        posts.push({p: [x + side * 0.40 * feature, y + height * 0.50, z],
          s: [0.052, height, 0.052], color: '#987b58'});
        posts.push({p: [x + side * 0.26 * feature, y + height, z],
          s: [0.66 * feature, 0.05, 0.045], r: [0, 0, side * 0.17], color: '#e1bf85'});
      }
      for (let iStripe = 0; iStripe < 5; iStripe++) {
        shades.push({p: [x + (iStripe - 2) * 0.22 * unfurl * feature, y + height + 0.045, z + spread / 2],
          s: [0.024 + 0.195 * unfurl * feature, 0.05, 0.075 + spread], r: [0.16 + sway[0], 0, sway[2]],
          color: iStripe % 2 ? '#f0d3a3' : ['#82a65f', '#d58e70', '#899e66', '#719a79', '#a8a35a', '#83a88e'][i]});
      }
    }
    return {posts, shades};
  }, [frame]);
  return <>
    <Batch parts={posts} shape="box" />
    <Batch parts={shades} shape="box" />
  </>;
}

export function HeroFlower({frame}: {frame: number}) {
  if (frame < 462) return null;
  const born = ease(frame, 462, 508);
  const open = ease(frame, 498, 542);
  const dropReady = ease(frame, 665, 716);
  const fall = ease(frame, 733, 762);
  const fade = 1 - ease(frame, 764, 770);
  const sway = windSway({frame, seed: 46, amplitude: 0.10, speed: 0.23});
  return <group position={BUD}>
    <Shadow p={[0, 0.012, 0]} s={[0.27, 0.22, 1]} opacity={0.16} />
    <group rotation={[sway[0], -0.17, sway[2]]} scale={born}>
      <SoftBox p={[0, 0.412, 0]} s={[0.064, 0.83, 0.066]} color="#79a558" />
      <Round p={[-0.16, 0.36, 0.012]} s={[0.51, 0.14, 0.24]} color="#92b768" r={[0, 0, 0.40]} />
      <Round p={[0.11, 0.51, 0.06]} s={[0.39, 0.13, 0.22]} color="#a6c26c" r={[0, -0.37, 0.50]} />
      <group position={[0, 0.82, 0.01]} rotation={[0.45, -0.33, 0.11]}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = i * Math.PI / 3;
          return <group key={i} rotation-y={angle}>
            <Round p={[0.0, 0.10 + 0.08 * (1 - open), 0.16 * open]}
              s={[0.22, 0.16, 0.34]} r={[-0.81 + open * 0.63, 0, 0]}
              color={i % 2 ? '#e99485' : '#f3ab9b'} />
          </group>;
        })}
        <Round p={[0, 0.130, 0.013]} s={[0.24, 0.18, 0.22]} color="#f3c86d" />
      </group>
    </group>
    {dropReady > 0 && fade > 0 && <group scale={dropReady * fade}
      position={point([0.12, 0.98, 0.14], [DEW_PALM[0] - BUD[0], DEW_PALM[1] - BUD[1], DEW_PALM[2] - BUD[2]], fall)}>
      <Round p={[0, 0, 0]} s={[0.089, 0.11 + fall * 0.027, 0.089]} color="#a0f0d7" shine={0.14} />
      <Round p={[-0.019, 0.026, 0.030]} s={[0.038, 0.038, 0.022]} color="#faffd8" shine={0.32} />
    </group>}
  </group>;
}
