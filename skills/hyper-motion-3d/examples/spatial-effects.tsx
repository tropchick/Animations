import {useEffect, useLayoutEffect, useMemo, useRef, type ReactNode} from 'react';
import {
  BackSide, BoxGeometry, BufferGeometry, Color, DynamicDrawUsage, Float32BufferAttribute, FrontSide,
  Matrix4, MeshStandardMaterial, Object3D, Quaternion, TorusGeometry, Vector3, type InstancedMesh, type Texture, type WebGLProgramParametersWithUniforms,
} from 'three';
import {clamp, lerp, sampleRandom, smoothstep, type Seed, type Vec3} from './math';

export type SpatialEffectProps = Readonly<{
  frame: number;
  at: number;
  duration?: number;
  origin?: Vec3;
  direction?: Vec3;
  color?: string;
  accent?: string;
  size?: number;
  strength?: number;
  seed?: Seed;
  particleBudget?: number;
  finish?: 'faceted' | 'sculpted' | 'graphic';
}>;

const TAU = 2 * Math.PI;
const ZERO: Vec3 = [0, 0, 0];
const UP: Vec3 = [0, 1, 0];
const NORMAL = new Vector3(0, 0, 1);
const emptyPieces: readonly FragmentPiece[] = [];
const unit = (direction: Vec3 | undefined, fallback = UP) => {
  const vector = new Vector3(...(direction ?? fallback));
  return vector.lengthSq() > 1e-8 ? vector.normalize() : new Vector3(...fallback);
};
const countWithin = (value: number | undefined, maximum: number) =>
  value === undefined ? maximum : Number.isFinite(value) ? Math.floor(clamp(value, 0, maximum)) : 0;

function phase(props: SpatialEffectProps, fallbackDuration: number) {
  const duration = Math.max(1, props.duration ?? fallbackDuration);
  const age = props.frame - props.at;
  const progress = clamp(duration <= 2 ? (age + 0.5) / duration : age / (duration - 1));
  return {
    live: age >= 0 && age < duration, age, duration,
    progress,
    strength: clamp(props.strength ?? 1, 0, 2),
    size: Math.max(0, props.size ?? 1),
    color: props.color ?? '#72d4cd',
    accent: props.accent ?? '#f5d098',
  };
}

function envelope(progress: number, attack = 0.12, release = 0.55) {
  return smoothstep(progress / attack) * (1 - smoothstep((progress - release) / (1 - release)));
}

function LitEffect({color, opacity, finish, glow = 0}: {
  color: string;
  opacity: number;
  finish: SpatialEffectProps['finish'];
  glow?: number;
}) {
  const alpha = clamp(opacity);
  if (finish === 'graphic') {
    return <meshBasicMaterial color={color} opacity={alpha} transparent={alpha < 1} depthWrite={alpha === 1} />;
  }
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={finish === 'sculpted' ? glow * 0.12 : glow}
    roughness={finish === 'sculpted' ? 0.92 : 0.68} flatShading={finish !== 'sculpted'}
    opacity={alpha} transparent={alpha < 1} depthWrite={alpha === 1} />;
}

/** A real tube profile in 3D. Local +Z is the normal of the front. */
function useWaveGeometry({seed, width, arc, squash, sculpted}: {
  seed: Seed; width: number; arc: number; squash: number; sculpted: boolean;
}) {
  const geometry = useMemo(() => {
    const wave = new TorusGeometry(1, width, sculpted ? 8 : 5, Math.max(12, Math.ceil(48 * arc / TAU)), arc);
    const positions = wave.getAttribute('position');
    const offset = TAU * sampleRandom(seed);
    for (let index = 0; index < positions.count; index++) {
      const x = positions.getX(index);
      const y = positions.getY(index);
      const angle = Math.atan2(y, x);
      const lobe = Math.sin(angle * 5 + offset) * 0.026 + Math.sin(angle * 9 - offset) * 0.012;
      positions.setXYZ(index, x * (1 + lobe), y * (1 + lobe),
        (positions.getZ(index) + 0.016 * Math.sin(angle * 4 + offset)) * squash);
    }
    wave.computeVertexNormals();
    wave.computeBoundingSphere();
    return wave;
  }, [seed, width, arc, squash, sculpted]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

function WaveMesh({seed, width, arc, squash, radius, rotation, lift, color, finish, opacity, glow}: {
  seed: Seed; width: number; arc: number; squash: number; radius: number; rotation: number; lift: number;
  color: string; finish: SpatialEffectProps['finish']; opacity: number; glow: number;
}) {
  const geometry = useWaveGeometry({seed, width, arc, squash, sculpted: finish === 'sculpted'});
  return <mesh geometry={geometry} scale={Math.max(1e-5, radius)} rotation-z={rotation} position-z={lift}
    visible={opacity > 0.002}>
    <LitEffect color={color} finish={finish} opacity={opacity} glow={glow} />
  </mesh>;
}

export function VolumetricRing({arc = TAU, expand = [0.58, 1.08], ...props}: SpatialEffectProps & {
  /** Arc in radians. */
  arc?: number;
  /** Start and end radii as fractions of size. */
  expand?: readonly [number, number];
}) {
  const state = phase(props, 36);
  if (!state.live || state.size <= 0 || state.strength <= 0) return null;
  const alpha = state.strength * envelope(state.progress);
  const radius = state.size * lerp(expand[0], expand[1], 1 - (1 - state.progress) ** 2);
  const orientation = new Quaternion().setFromUnitVectors(NORMAL, unit(props.direction));
  const sweep = clamp(arc, 0.05, TAU);
  const seed = props.seed ?? 'ring';
  return <group position={props.origin} quaternion={orientation}>
    <WaveMesh seed={seed} radius={radius} arc={sweep} rotation={0.35 * state.progress}
      width={0.052} squash={1} lift={0} color={state.color} finish={props.finish}
      opacity={alpha * 0.88} glow={0.22} />
    <WaveMesh seed={seed} radius={radius * 0.915} arc={sweep * 0.84} rotation={0.5 + 0.47 * state.progress}
      width={0.018} squash={0.8} lift={radius * 0.03} color={state.accent} finish={props.finish}
      opacity={alpha * 0.7} glow={0.3} />
  </group>;
}

export function LayeredWave({fronts = 3, thickness = 1, speed, ...props}: SpatialEffectProps & {
  fronts?: number;
  thickness?: number;
  /** World units per frame, for synchronization with a distance-based reaction. */
  speed?: number;
}) {
  const state = phase(props, 46);
  if (!state.live || state.size <= 0 || state.strength <= 0) return null;
  const orientation = new Quaternion().setFromUnitVectors(NORMAL, unit(props.direction));
  return <group position={props.origin} quaternion={orientation}>
    {Array.from({length: countWithin(fronts, 5)}, (_, index) => {
      const offset = index * 0.11;
      const progress = clamp((state.progress - offset) / (1 - offset));
      const radius = speed && speed > 0
        ? clamp((state.age - offset * (state.duration - 1)) * speed, 0, state.size)
        : state.size * lerp(0.12, 1, 1 - (1 - progress) ** 1.65);
      const opacity = state.strength * envelope(progress, 0.085, 0.48) * 0.72 ** index;
      return <WaveMesh key={index} seed={`${props.seed ?? 'wave'}/${index}`} radius={radius} arc={TAU}
        rotation={index * 0.34} width={(0.05 - index * 0.006) * clamp(thickness, 0.15, 3)} squash={0.6}
        lift={radius * (0.02 + index * 0.016)} color={index === 1 ? state.accent : state.color} finish={props.finish}
        opacity={opacity * 0.88} glow={0.19} />;
    })}
  </group>;
}

function createTube(segments: number, sides: number) {
  const geometry = new BufferGeometry();
  const position = new Float32BufferAttribute(new Float32Array((segments + 1) * sides * 3), 3);
  position.setUsage(DynamicDrawUsage);
  geometry.setAttribute('position', position);
  const indices: number[] = [];
  for (let segment = 0; segment < segments; segment++) {
    for (let side = 0; side < sides; side++) {
      const a = segment * sides + side;
      const b = segment * sides + (side + 1) % sides;
      const c = a + sides;
      const d = b + sides;
      indices.push(a, b, c, b, d, c);
    }
  }
  geometry.setIndex(indices);
  return geometry;
}

export function EnergizedArc({start, end, arcHeight = 0.3, segments = 18, thickness = 0.023, ...props}:
  SpatialEffectProps & {start: Vec3; end: Vec3; arcHeight?: number; segments?: number; thickness?: number}) {
  const state = phase(props, 24);
  const count = Math.max(6, countWithin(segments, 36));
  const sides = props.finish === 'sculpted' ? 7 : 5;
  const geometry = useMemo(() => createTube(count, sides), [count, sides]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const strength = envelope(state.progress, 0.17, 0.54) * state.strength;
  useLayoutEffect(() => {
    if (!state.live) return;
    const origin = new Vector3(...start);
    const direction = new Vector3(...end).sub(origin);
    if (direction.lengthSq() < 1e-10) return;
    const normal = unit(props.direction);
    const tangent = direction.clone().normalize();
    // Use a perpendicular cross-section for arbitrary path orientation.
    normal.addScaledVector(tangent, -normal.dot(tangent));
    if (normal.lengthSq() < 1e-8) {
      normal.set(Math.abs(tangent.x) < 0.8 ? 1 : 0, 0, Math.abs(tangent.x) < 0.8 ? 0 : 1);
      normal.addScaledVector(tangent, -normal.dot(tangent));
    }
    normal.normalize();
    const binormal = tangent.clone().cross(normal).normalize();
    const position = geometry.getAttribute('position');
    const point = new Vector3();
    const seed = props.seed ?? 'arc';
    const jitter = TAU * sampleRandom(seed);
    for (let segment = 0; segment <= count; segment++) {
      const t = segment / count;
      const swing = Math.sin(Math.PI * t);
      const age = state.progress;
      const pulse = 0.64 + 0.36 * Math.sin(TAU * (t * 1.4 - age * 0.65));
      point.copy(origin).addScaledVector(direction, t);
      point.addScaledVector(normal, swing * arcHeight *
        (0.83 + 0.16 * Math.sin(t * TAU * 4 + jitter + age * 2.5)));
      point.addScaledVector(binormal, swing * arcHeight * 0.2 * Math.sin(t * TAU * 7 - jitter + age * 2));
      for (let side = 0; side < sides; side++) {
        const angle = TAU * side / sides;
        const radius = Math.max(1e-5, thickness * state.size * (0.35 + 0.65 * pulse) * (0.45 + 0.75 * swing));
        const up = radius * Math.cos(angle);
        const outward = radius * Math.sin(angle);
        position.setXYZ(segment * sides + side, point.x + normal.x * up + binormal.x * outward,
          point.y + normal.y * up + binormal.y * outward, point.z + normal.z * up + binormal.z * outward);
      }
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
  }, [arcHeight, count, end, geometry, props.direction, props.seed, sides, start,
    state.live, state.progress, state.size, thickness]);
  if (!state.live || strength <= 0 || state.size <= 0 ||
    Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]) < 1e-5) return null;
  return <mesh geometry={geometry} position={props.origin} frustumCulled={false}>
    <LitEffect color={state.color} finish={props.finish} opacity={strength * 0.88} glow={0.63} />
  </mesh>;
}

type InstancePose = (object: Object3D, index: number) => void;
function SpatialInstances({capacity, count, origin, geometry, finish, color, accent, opacity,
  seed, write, colorFor}: {
  capacity: number; count: number; origin?: Vec3; geometry?: BufferGeometry; finish: SpatialEffectProps['finish'];
  color: string; accent: string; opacity: number; seed: Seed; write: InstancePose;
  colorFor?: (index: number) => string | undefined;
}) {
  const ref = useRef<InstancedMesh>(null);
  const scratch = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const main = new Color(color);
    const edge = new Color(accent);
    const tint = new Color();
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    for (let index = 0; index < capacity; index++) {
      const override = colorFor?.(index);
      if (override) tint.set(override);
      else tint.copy(main).lerp(edge, sampleRandom(seed, index) ** 3 * 0.43);
      mesh.setColorAt(index, tint);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [accent, capacity, color, colorFor, seed]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    mesh.count = count;
    for (let index = 0; index < count; index++) {
      scratch.position.set(0, 0, 0);
      scratch.rotation.set(0, 0, 0);
      scratch.scale.setScalar(1);
      write(scratch, index);
      scratch.updateMatrix();
      mesh.setMatrixAt(index, scratch.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [capacity, count, scratch, write]);
  if (capacity === 0) return null;
  return <instancedMesh ref={ref} args={[geometry, undefined, capacity]} position={origin} frustumCulled={false}>
    {!geometry && (finish === 'sculpted' ? <sphereGeometry args={[0.5, 10, 7]} /> : <icosahedronGeometry args={[0.5, 1]} />)}
    <LitEffect color="#ffffff" opacity={opacity} finish={finish} />
  </instancedMesh>;
}

export function VolumetricCloud({count = 24, stretch = [1.7, 0.7, 1.25], drift = 0.45, ...props}:
  SpatialEffectProps & {count?: number; stretch?: Vec3; drift?: number}) {
  const state = phase(props, 56);
  const capacity = countWithin(count, 64);
  const active = countWithin(props.particleBudget, capacity);
  const seed = props.seed ?? 'cloud';
  const cloud = useMemo(() => Array.from({length: capacity}, (_, index) => {
    const n = index * 6;
    const angle = TAU * sampleRandom(seed, n);
    const height = 2 * sampleRandom(seed, n + 1) - 1;
    const xz = Math.sqrt(Math.max(0, 1 - height ** 2));
    const radius = 0.45 + 0.55 * Math.cbrt(sampleRandom(seed, n + 2));
    return {point: [radius * xz * Math.cos(angle), radius * height, radius * xz * Math.sin(angle)] as Vec3,
      delay: sampleRandom(seed, n + 3) * 0.22, size: 0.23 + 0.44 * sampleRandom(seed, n + 4),
      rotation: TAU * sampleRandom(seed, n + 5)};
  }), [capacity, seed]);
  if (!state.live || state.size <= 0 || state.strength <= 0) return null;
  const wind = unit(props.direction ?? [1, 0.24, 0]);
  return <SpatialInstances capacity={capacity} count={active} origin={props.origin} finish={props.finish}
    color={props.color ?? '#a89373'} accent={props.accent ?? '#c7b48e'} opacity={1} seed={seed}
    write={(object, index) => {
      const puff = cloud[index];
      const age = clamp((state.progress - puff.delay) / (1 - puff.delay));
      const expansion = 1 - (1 - age) ** 2.2;
      const radius = state.size * (0.14 + 0.68 * expansion);
      object.position.set(puff.point[0] * radius * stretch[0], puff.point[1] * radius * stretch[1],
        puff.point[2] * radius * stretch[2]);
      object.position.y += state.size * (0.14 + 0.15 * expansion);
      object.position.addScaledVector(wind, state.size * drift * expansion);
      object.rotation.set(puff.rotation * 0.3, puff.rotation + age * 1.5, age * 0.9);
      const size = state.size * puff.size * envelope(age, 0.16, 0.53) * Math.sqrt(state.strength);
      object.scale.set(Math.max(1e-5, size), Math.max(1e-5, size * (0.78 + 0.55 * age)), Math.max(1e-5, size * 0.91));
    }} />;
}

export type FragmentPiece = Readonly<{
  /** Rest transform relative to origin, before multiplication by size. */
  position: Vec3;
  rotation?: Vec3;
  scale?: Vec3;
  color?: string;
}>;

const builtInPieces: readonly FragmentPiece[] = Array.from({length: 27}, (_, index) => ({
  position: [(index % 3 - 1) * 0.27, (Math.floor(index / 3) % 3 - 1) * 0.27, (Math.floor(index / 9) - 1) * 0.27],
  scale: [0.253, 0.253, 0.253],
}));

export type FragmentMotion = Readonly<{velocity: Vec3; rotation: Vec3; stagger: number}>;
export function seedFragment(seed: Seed, piece: FragmentPiece, index: number): FragmentMotion {
  const random = (offset: number) => sampleRandom(seed, index * 9 + offset);
  const spatial = unit([
    piece.position[0] + (random(0) - 0.5) * 0.9,
    piece.position[1] + (random(1) - 0.5) * 0.9,
    piece.position[2] + (random(2) - 0.5) * 0.9,
  ]);
  spatial.multiplyScalar(0.65 + random(3) * 0.85);
  return {
    velocity: [spatial.x, spatial.y, spatial.z],
    rotation: [(random(4) - 0.5) * 4.8, (random(5) - 0.5) * 4.8, (random(6) - 0.5) * 4.8],
    stagger: 0.19 * random(7),
  };
}

/** Pure rest-to-flight sample. Reverse progress to restore exact rest transforms. */
export function sampleFragment(piece: FragmentPiece, motion: FragmentMotion, outward: number, {
  size = 1, travel = 1.25, gravity = 0.35, floor, direction = UP,
}: {
  size?: number; travel?: number; gravity?: number; floor?: number; direction?: Vec3;
} = {}) {
  const p = clamp((outward - motion.stagger) / (1 - motion.stagger));
  const advance = (1 - (1 - p) ** 1.7) * travel * size;
  const magnitude = Math.hypot(...direction);
  const dx = magnitude > 1e-8 ? direction[0] / magnitude : 0;
  const dy = magnitude > 1e-8 ? direction[1] / magnitude : 1;
  const dz = magnitude > 1e-8 ? direction[2] / magnitude : 0;
  const rest = piece.position;
  const restRotation = piece.rotation ?? ZERO;
  const x = size * rest[0] + advance * (motion.velocity[0] + 0.25 * dx);
  const y = size * rest[1] + advance * (motion.velocity[1] + 0.25 * dy) - gravity * size * p ** 2;
  const z = size * rest[2] + advance * (motion.velocity[2] + 0.25 * dz);
  const position: Vec3 = [x, floor === undefined || p === 0 ? y : Math.max(floor, y), z];
  const rotation: Vec3 = [restRotation[0] + motion.rotation[0] * p,
    restRotation[1] + motion.rotation[1] * p, restRotation[2] + motion.rotation[2] * p];
  return {position, rotation};
}

/** Stable assembled silhouette across animation budgets. Extra pieces stay at rest. */
export function FragmentAssembly({pieces = emptyPieces, mode = 'assemble', geometry, travel = 1.25, gravity,
  floor, hold = false, ...props}: SpatialEffectProps & {
  pieces?: readonly FragmentPiece[];
  mode?: 'assemble' | 'disassemble';
  /** Unit geometry shared by all provided pieces. */
  geometry?: BufferGeometry;
  travel?: number;
  gravity?: number;
  /** Optional ground height relative to origin. */
  floor?: number;
  hold?: boolean;
}) {
  const state = phase(props, 39);
  const layout = pieces.length ? pieces : builtInPieces;
  const seed = props.seed ?? 'fragment';
  const motions = useMemo(() => layout.map((piece, index) => seedFragment(seed, piece, index)), [layout, seed]);
  const colorFor = useMemo(() => (index: number) => layout[index].color, [layout]);
  const box = useMemo(() => geometry ? undefined : new BoxGeometry(1, 1, 1), [geometry]);
  useEffect(() => () => box?.dispose(), [box]);
  if (layout.length > 96) throw new RangeError('FragmentAssembly supports up to 96 pieces per geometry batch');
  const ended = hold && props.frame >= props.at + Math.max(1, props.duration ?? 39);
  if ((!state.live && !ended) || state.size <= 0) return null;
  const moving = countWithin(props.particleBudget, layout.length);
  const progress = ended ? 1 : state.progress;
  const outward = mode === 'assemble' ? 1 - smoothstep(progress) : smoothstep(progress);
  return <SpatialInstances origin={props.origin} geometry={geometry ?? box} count={layout.length} capacity={layout.length}
    finish={props.finish} color={state.color} accent={state.accent} colorFor={colorFor} seed={seed} opacity={1}
    write={(object, index) => {
      const piece = layout[index];
      const movement = index < moving ? outward : 0;
      const result = sampleFragment(piece, motions[index], movement, {
        size: state.size, travel: travel * state.strength, gravity: (gravity ?? 0.35) * state.strength,
        floor, direction: props.direction,
      });
      object.position.set(...result.position);
      object.rotation.set(...result.rotation);
      const scale = piece.scale ?? [0.18, 0.18, 0.18];
      object.scale.set(scale[0] * state.size, scale[1] * state.size, scale[2] * state.size);
    }} />;
}

const deformationLimit = 5200;

/** Use directional stretch and near volume preservation around a stable contact pivot. */
export function deformationMatrix(axis: Vec3 = UP, pivot: Vec3 = ZERO, stretch = 1) {
  const axial = clamp(stretch, 0.35, 3);
  const lateral = 1 / Math.sqrt(axial);
  const {x, y, z} = unit(axis);
  const change = axial - lateral;
  return new Matrix4().set(
    lateral + change * x * x, change * x * y, change * x * z, 0,
    change * x * y, lateral + change * y * y, change * y * z, 0,
    change * x * z, change * y * z, lateral + change * z * z, 0,
    0, 0, 0, 1,
  ).premultiply(new Matrix4().makeTranslation(...pivot))
    .multiply(new Matrix4().makeTranslation(-pivot[0], -pivot[1], -pivot[2]));
}

export function DeformGeometry({geometry, axis = UP, pivot = ZERO, stretch = 1, warp = 0, phase: wavePhase = 0,
  morphWeights, children}: {
  geometry: BufferGeometry;
  axis?: Vec3;
  pivot?: Vec3;
  stretch?: number;
  /** Bending amplitude in local units. Large meshes use an affine transform or caller-authored morphs. */
  warp?: number;
  phase?: number;
  morphWeights?: readonly number[];
  children: (surface: {geometry: BufferGeometry; morphTargetInfluences?: number[]}) => ReactNode;
}) {
  const position = geometry.getAttribute('position');
  const count = position?.count ?? 0;
  const morphCount = geometry.morphAttributes.position?.length ?? 0;
  const useMorphs = Boolean(morphWeights && morphCount);
  const bends = count > 0 && count <= deformationLimit && !useMorphs && warp !== 0;
  // Clone once per geometry and retain the rest attributes while the impact is active.
  const clone = useMemo(() => {
    if (count <= 0 || count > deformationLimit) return undefined;
    const copy = geometry.clone();
    const positions = copy.getAttribute('position');
    if ('setUsage' in positions) positions.setUsage(DynamicDrawUsage);
    return copy;
  }, [count, geometry]);
  useEffect(() => () => clone?.dispose(), [clone]);
  const matrix = deformationMatrix(axis, pivot, stretch);
  useLayoutEffect(() => {
    if (!clone || !bends) return;
    const rest = new Vector3();
    const vector = unit(axis);
    const side = new Vector3(Math.abs(vector.x) > 0.75 ? 0 : 1, 0, Math.abs(vector.x) > 0.75 ? 1 : 0);
    side.addScaledVector(vector, -side.dot(vector)).normalize();
    const center = new Vector3(...pivot);
    const displaced = clone.getAttribute('position');
    for (let index = 0; index < count; index++) {
      rest.fromBufferAttribute(position, index);
      const along = vector.dot(rest.sub(center));
      const bend = warp * along * Math.abs(along) * (0.75 + 0.25 * Math.cos(wavePhase + 4 * along));
      rest.add(center).addScaledVector(side, bend);
      displaced.setXYZ(index, rest.x, rest.y, rest.z);
    }
    displaced.needsUpdate = true;
    clone.computeVertexNormals();
    clone.computeBoundingSphere();
  }, [axis, bends, clone, count, pivot, position, warp, wavePhase]);
  const morphTargetInfluences = useMorphs && morphWeights
    ? Array.from({length: morphCount}, (_, index) => clamp(morphWeights[index] ?? 0))
    : undefined;
  return <group matrixAutoUpdate={false} matrix={matrix}>
    {children({geometry: bends && clone ? clone : geometry, morphTargetInfluences})}
  </group>;
}

export function ImpactOutline({geometry, mode = 'outline', thickness = 0.035, morphTargetInfluences, ...props}:
  SpatialEffectProps & {geometry: BufferGeometry; mode?: 'outline' | 'wireframe' | 'silhouette';
    thickness?: number; morphTargetInfluences?: number[]}) {
  const state = phase(props, 14);
  const center = useMemo(() => {
    const anchor = new Vector3();
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    geometry.boundingBox?.getCenter(anchor);
    return anchor;
  }, [geometry]);
  const alpha = clamp(state.strength * envelope(state.progress, 0.19, 0.44));
  if (!state.live || alpha <= 0 || state.size <= 0) return null;
  const outline = mode === 'outline';
  const wires = mode === 'wireframe';
  const expansion = outline ? 1 + clamp(thickness, 0.002, 0.18) * (0.65 + 0.35 * state.progress) : wires ? 1.002 : 1;
  return <group position={props.origin} scale={state.size}>
    <mesh geometry={geometry} morphTargetInfluences={morphTargetInfluences}
      position={center.clone().multiplyScalar(1 - expansion)} scale={expansion}>
      <meshBasicMaterial color={state.color} opacity={alpha * (outline || wires ? 0.94 : 0.56)} transparent
        depthWrite={false} side={outline ? BackSide : FrontSide} wireframe={wires}
        polygonOffset={!outline} polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
    </mesh>
  </group>;
}

/** Reveal the supplied geometry along an object-local plane and light its moving edge. */
export function Materialization({geometry, material, axis = UP, mode = 'reveal', hold = false, edgeWidth = 0.07, ...props}:
  SpatialEffectProps & {geometry: BufferGeometry; material?: MeshStandardMaterial; axis?: Vec3;
    mode?: 'reveal' | 'erase'; hold?: boolean; edgeWidth?: number}) {
  const state = phase(props, 36);
  const range = useMemo(() => {
    const direction = unit(axis);
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const point = new Vector3();
    let low = Infinity;
    let high = -Infinity;
    if (box) {
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) {
          const bound = point.set(x, y, z).dot(direction);
          low = Math.min(low, bound);
          high = Math.max(high, bound);
        }
      }
    }
    return {direction, low: Number.isFinite(low) ? low : 0, high: Number.isFinite(high) ? high : 0};
  }, [axis, geometry]);
  const uniforms = useMemo(() => ({
    hmSliceAxis: {value: new Vector3()},
    hmSlicePlane: {value: 0},
    hmSliceWidth: {value: 0},
    hmSliceColor: {value: new Color()},
    hmSliceStrength: {value: 0},
  }), []);
  const complete = hold && props.frame >= props.at + Math.max(1, props.duration ?? 36);
  const progress = complete ? 1 : state.progress;
  const display = mode === 'reveal' ? smoothstep(progress) : 1 - smoothstep(progress);
  const width = Math.max(0.001, edgeWidth);
  useLayoutEffect(() => {
    uniforms.hmSliceAxis.value.copy(range.direction);
    uniforms.hmSlicePlane.value = lerp(range.low - width, range.high + width, display);
    uniforms.hmSliceWidth.value = width;
    uniforms.hmSliceColor.value.set(state.accent);
    uniforms.hmSliceStrength.value = state.strength * envelope(progress, 0.08, 0.8)
      * (props.finish === 'sculpted' ? 0.23 : 0.49);
  }, [display, progress, props.finish, range, state.accent, state.strength, uniforms, width]);
  const compile = useMemo(() => (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = `varying vec3 hmLocalPosition;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>', '#include <begin_vertex>\nhmLocalPosition = position;');
    shader.fragmentShader = `
      varying vec3 hmLocalPosition;
      uniform vec3 hmSliceAxis, hmSliceColor;
      uniform float hmSlicePlane, hmSliceWidth, hmSliceStrength;
      ${shader.fragmentShader}`.replace('#include <color_fragment>', `
        #include <color_fragment>
        float sliceDistance = hmSlicePlane - dot(hmSliceAxis, hmLocalPosition);
        if (sliceDistance < 0.0) discard;
        float sliceAccent = 1.0 - smoothstep(0.0, hmSliceWidth, sliceDistance);
        diffuseColor.rgb = mix(diffuseColor.rgb, hmSliceColor, sliceAccent * hmSliceStrength);
      `);
  }, [uniforms]);
  const sliced = useMemo(() => {
    const output = material ? material.clone() : new MeshStandardMaterial();
    const baseCompile = material?.onBeforeCompile;
    output.onBeforeCompile = (shader, renderer) => {
      baseCompile?.call(output, shader, renderer);
      compile(shader);
    };
    output.customProgramCacheKey = () => `hm-materialization-${material?.customProgramCacheKey() ?? ''}`;
    return output;
  }, [compile, material]);
  useEffect(() => () => sliced.dispose(), [sliced]);
  useLayoutEffect(() => {
    if (!material || props.color) sliced.color.set(state.color);
    if (!material || props.finish) {
      sliced.roughness = props.finish === 'sculpted' ? 0.92 : 0.68;
      const flat = props.finish !== 'sculpted';
      if (flat !== sliced.flatShading) {
        sliced.flatShading = flat;
        sliced.needsUpdate = true;
      }
    }
  }, [material, props.color, props.finish, sliced, state.color]);
  if ((!state.live && !complete) || state.size <= 0 || display <= 0) return null;
  return <mesh geometry={geometry} material={sliced} position={props.origin} scale={state.size} />;
}

const shellVertex = `
  varying vec3 viewNormal, viewPosition, localPosition;
  void main() {
    localPosition = position;
    viewNormal = normalMatrix * normal;
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    viewPosition = view.xyz;
    gl_Position = projectionMatrix * view;
  }`;
const shellFragment = `
  varying vec3 viewNormal, viewPosition, localPosition;
  uniform vec3 ink, highlight;
  uniform float alpha, progress;
  uniform bool hasSource;
  uniform sampler2D source;
  void main() {
    vec3 normal = normalize(viewNormal);
    float facing = clamp(dot(normal, -normalize(viewPosition)), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 2.1);
    float latitude = localPosition.y * 0.5 + 0.5;
    float pulse = 1.0 - smoothstep(0.045, 0.17, abs(latitude - progress));
    vec3 color = mix(ink, highlight, clamp(pulse * 0.66 + fresnel * 0.29, 0.0, 1.0));
    if (hasSource) {
      vec2 uv = clamp(0.5 + localPosition.xy * 0.47 + normal.xy * (0.023 + pulse * 0.034), 0.0, 1.0);
      color = mix(texture2D(source, uv).rgb, color, 0.32 + fresnel * 0.55);
    }
    gl_FragColor = vec4(color, alpha * clamp(0.83 * fresnel + 0.45 * pulse, 0.0, 1.0));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

/** A depth-tested local optical shell. A source texture is optional and remains caller-owned. */
export function OpticalShell({map, ...props}: SpatialEffectProps & {map?: Texture}) {
  const state = phase(props, 38);
  const alpha = state.strength * envelope(state.progress, 0.18, 0.6) * 0.72;
  const uniforms = useMemo(() => ({
    ink: {value: new Color(state.color)}, highlight: {value: new Color(state.accent)}, alpha: {value: alpha},
    progress: {value: state.progress}, hasSource: {value: Boolean(map)}, source: {value: map ?? null},
  }), [alpha, map, state.accent, state.color, state.progress]);
  if (!state.live || alpha <= 0 || state.size <= 0) return null;
  return <mesh position={props.origin} scale={state.size}
    quaternion={new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), unit(props.direction))}>
    <sphereGeometry args={[1, 24, 14]} />
    <shaderMaterial vertexShader={shellVertex} fragmentShader={shellFragment} uniforms={uniforms}
      transparent depthWrite={false} />
  </mesh>;
}
