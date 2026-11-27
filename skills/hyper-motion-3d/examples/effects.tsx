import {useLayoutEffect, useMemo, useRef, type ReactNode} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {
  BackSide, Color, DoubleSide, DynamicDrawUsage, Object3D, Quaternion, Shape, Vector3,
  type BufferGeometry, type InstancedMesh, type Texture,
} from 'three';
import {clamp, sampleRandom, smoothstep as smooth, type Seed, type Vec3} from './math';

export type EffectTheme = {
  color: string;
  accent: string;
  finish: 'faceted' | 'sculpted' | 'graphic';
  roughness?: number;
};

const THEMES: Record<'low-poly' | 'clay', EffectTheme> = {
  'low-poly': {color: '#58dfd2', accent: '#ffdb91', finish: 'faceted', roughness: 0.65},
  clay: {color: '#74b9ae', accent: '#e9ad76', finish: 'sculpted', roughness: 0.94},
};

export type EffectProps = {
  frame?: number;
  from?: number;
  duration?: number;
  position?: Vec3;
  direction?: Vec3;
  size?: number;
  color?: string;
  opacity?: number;
  intensity?: number;
  motion?: 'soft' | 'linear' | 'sharp';
  theme?: keyof typeof THEMES | EffectTheme;
  seed?: Seed;
  /** Allocation for this effect, not the whole shot. */
  budget?: number;
};

type ParticleProps = EffectProps & {count?: number};
type ShapeKind = 'streak' | 'chip' | 'puff' | 'spark';
const TAU = 2 * Math.PI;
const UP = new Vector3(0, 1, 0);
const FORWARD = new Vector3(0, 0, 1);
const capacityFor = (count: number, maximum: number, budget = maximum) =>
  Number.isFinite(count) && Number.isFinite(budget)
    ? Math.max(0, Math.floor(Math.min(count, maximum, budget)))
    : 0;
const useSamples = (seed: Seed, count: number, stride: number) => useMemo(() =>
  Float32Array.from({length: count * stride}, (_, index) => sampleRandom(seed, index)), [seed, count, stride]);

const axisFor = (direction: Vec3 | undefined, reference: Vector3) => {
  const target = direction ? new Vector3(...direction) : reference;
  return new Quaternion().setFromUnitVectors(reference, target.lengthSq() > 1e-10 ? target.clone().normalize() : reference);
};

function useEffectState(props: EffectProps, defaultSeconds: number, accent = false) {
  const compositionFrame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const theme = typeof props.theme === 'object' ? props.theme : THEMES[props.theme ?? 'low-poly'];
  const frame = props.frame ?? compositionFrame;
  const duration = props.duration ?? defaultSeconds * fps;
  const age = frame - (props.from ?? 0);
  const continuous = duration === Infinity;
  const progress = continuous ? 0 : duration <= 2 ? clamp((age + 0.5) / Math.max(1, duration))
    : clamp(age / (duration - 1));
  const travel = props.motion === 'soft' ? smooth(progress)
    : props.motion === 'linear' ? progress : 1 - (1 - progress) ** 2;
  const gain = Math.max(0, Math.min(2, props.intensity ?? 1));
  const opacity = clamp((props.opacity ?? 1) * gain);
  return {
    theme, frame, continuous, progress, travel, opacity, gain, seconds: age / fps,
    active: age >= 0 && age < duration && opacity > 0 && (props.size ?? 1) > 0,
    size: props.size ?? 1,
    color: props.color ?? (accent ? theme.accent : theme.color),
  };
}

const life = (p: number, attack = 0.1, release = 0.56) =>
  smooth(p / attack) * (1 - smooth((p - release) / (1 - release)));

function Surface({theme, color, opacity}: {theme: EffectTheme; color: string; opacity: number}) {
  const transparency = {opacity: clamp(opacity), transparent: opacity < 0.995, depthWrite: opacity >= 0.995};
  return theme.finish === 'graphic'
    ? <meshBasicMaterial color={color} {...transparency} />
    : <meshStandardMaterial color={color} roughness={theme.roughness ?? 0.8}
      flatShading={theme.finish === 'faceted'} {...transparency} />;
}

function ParticleGeometry({shape, sculpted}: {shape: ShapeKind; sculpted: boolean}) {
  if (shape === 'streak') return <cylinderGeometry args={[0.04, 0.32, 1, sculpted ? 8 : 4]} />;
  if (shape === 'spark') return <octahedronGeometry args={[0.5, 0]} />;
  if (shape === 'puff' && sculpted) return <sphereGeometry args={[0.5, 10, 7]} />;
  return <icosahedronGeometry args={[0.5, shape === 'puff' ? 1 : 0]} />;
}

/** Stable attribute storage. Each exposure overwrites every displayed matrix. */
function Instances({count, capacity, shape, position, quaternion, theme, color, accent, opacity, write}: {
  count: number;
  capacity: number;
  shape: ShapeKind;
  position?: Vec3;
  quaternion?: Quaternion;
  theme: EffectTheme;
  color: string;
  accent?: string;
  opacity: number;
  write: (object: Object3D, index: number) => void;
}) {
  const ref = useRef<InstancedMesh>(null);
  const object = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh || !accent) return;
    const ink = new Color(color);
    const glint = new Color(accent);
    const chip = new Color();
    for (let index = 0; index < capacity; index++) {
      chip.copy(ink).lerp(glint, sampleRandom('chip-color', index) ** 3 * 0.48);
      mesh.setColorAt(index, chip);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [accent, capacity, color]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    mesh.count = opacity > 0 ? count : 0;
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    for (let index = 0; index < mesh.count; index++) {
      object.position.set(0, 0, 0);
      object.rotation.set(0, 0, 0);
      object.scale.setScalar(1);
      write(object, index);
      object.updateMatrix();
      mesh.setMatrixAt(index, object.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [capacity, count, object, opacity, write]);
  if (capacity === 0) return null;
  return <instancedMesh ref={ref} args={[undefined, undefined, capacity]} position={position}
    quaternion={quaternion} frustumCulled={false}>
    <ParticleGeometry shape={shape} sculpted={theme.finish === 'sculpted'} />
    <Surface theme={theme} color={accent ? '#ffffff' : color} opacity={opacity} />
  </instancedMesh>;
}

/** 3D streak sleeve, open down the center to leave the subject readable. */
export function SpeedLines(props: ParticleProps) {
  const state = useEffectState(props, 0.6);
  const capacity = capacityFor(props.count ?? 16, 64);
  const count = capacityFor(capacity, 64, props.budget);
  const random = useSamples(props.seed ?? 'speed-lines', capacity, 4);
  if (!state.active) return null;
  return <Instances count={count} capacity={capacity} shape="streak" position={props.position} quaternion={axisFor(props.direction, UP)}
    theme={state.theme} color={state.color} opacity={state.opacity * life(state.progress, 0.18, 0.45)}
    write={(object, index) => {
      const n = index * 4;
      const radius = (0.64 + random[n] * 0.63) * state.size;
      const angle = 2.39996 * index + 0.08 * TAU * random[n + 1];
      const y = (random[n + 2] - 0.5 + state.travel * 1.7) * state.size;
      const length = 0.22 + 0.82 * random[n + 3];
      const thickness = state.size * (state.theme.finish === 'sculpted' ? 0.046 : 0.026);
      object.position.set(radius * Math.cos(angle), y, radius * Math.sin(angle));
      object.scale.set(thickness, Math.max(0.001, state.size * length * (0.5 + state.gain * 0.5)), thickness);
    }} />;
}

type BurstProps = ParticleProps & {
  /** Full cone angle in degrees. */
  spread?: number;
  /** Downward acceleration as a ratio of effect size over its lifetime squared. */
  gravity?: number;
};

function Emission({kind, ...props}: BurstProps & {kind: 'burst' | 'spark' | 'smoke' | 'dust'}) {
  const puff = kind === 'smoke' || kind === 'dust';
  const dust = kind === 'dust';
  const state = useEffectState(props, puff ? 1.4 : 0.9, kind === 'spark');
  const maximum = puff ? 48 : 192;
  const capacity = capacityFor(props.count ?? (puff ? 12 : 30), maximum);
  const count = capacityFor(capacity, maximum, props.budget);
  const random = useSamples(props.seed ?? kind, capacity, 7);
  if (!state.active) return null;
  const orientation = axisFor(props.direction, UP);
  const velocity = new Vector3();
  const spread = Math.PI / 360 * Math.max(0, Math.min(360, props.spread ?? (dust ? 168 : puff ? 76 : 105)));
  const gravity = props.gravity ?? (puff ? 0 : 0.75);
  return <Instances count={count} capacity={capacity} shape={puff ? 'puff' : kind === 'spark' ? 'spark' : 'chip'}
    position={props.position} theme={state.theme} color={state.color}
    accent={puff ? undefined : state.theme.accent}
    opacity={state.opacity * life(state.progress, 0.09, puff ? 0.33 : 0.5) * (puff ? 0.78 : 1)}
    write={(object, index) => {
      const n = index * 7;
      const ageOffset = random[n] * 0.14;
      const age = clamp((state.progress - ageOffset) / (1 - ageOffset));
      const azimuth = TAU * random[n + 1];
      const cosAngle = 1 - random[n + 2] * (1 - Math.cos(spread));
      const sinAngle = Math.sqrt(Math.max(0, 1 - cosAngle ** 2));
      const speed = (0.42 + random[n + 3] * 0.76) * (0.6 + 0.4 * state.gain);
      const travel = props.motion === 'linear' ? age : props.motion === 'soft' ? smooth(age) : 1 - (1 - age) ** (puff ? 1.45 : 1.8);
      velocity.set(Math.cos(azimuth) * sinAngle, cosAngle, Math.sin(azimuth) * sinAngle).applyQuaternion(orientation);
      object.position.copy(velocity).multiplyScalar(speed * travel * state.size);
      object.position.y += state.size * (puff ? (dust ? 0.09 : 0.38) * age : -gravity * age ** 2 / 2);
      const scale = age === 0 ? 1e-6 : state.size * (0.6 + 0.75 * random[n + 4])
        * (puff ? 0.19 + 0.43 * Math.sin(age * Math.PI / 2) : 0.1 * (1 - smooth((age - 0.55) / 0.45)));
      object.rotation.set(azimuth + 2.2 * age, random[n + 5] * TAU + age, random[n + 6] * TAU);
      object.scale.set(scale, scale * (dust ? 0.63 : kind === 'spark' ? 1.7 : 1.1), scale);
    }} />;
}

export function ParticleBurst(props: BurstProps) {
  return <Emission {...props} kind="burst" />;
}
export function Sparkles(props: BurstProps) {
  return <Emission count={9} gravity={0} spread={220} {...props} kind="spark" />;
}
export function DustCloud(props: BurstProps) {
  return <Emission color="#bc9b77" {...props} kind="dust" />;
}
export function CartoonSmoke(props: BurstProps) {
  return <Emission color="#c2bab5" {...props} kind="smoke" />;
}

export function AmbientParticles({bounds = [6, 3, 5], ...props}: ParticleProps & {bounds?: Vec3}) {
  const state = useEffectState(props, Infinity, true);
  const capacity = capacityFor(props.count ?? 28, 192);
  const count = capacityFor(capacity, 192, props.budget);
  const random = useSamples(props.seed ?? 'ambient', capacity, 5);
  if (!state.active) return null;
  const wind = new Vector3(...(props.direction ?? [0.3, 0.11, 0]));
  const wrap = (value: number) => value - Math.floor(value);
  const fade = state.continuous ? smooth(state.seconds * 2) : life(state.progress);
  return <Instances count={count} capacity={capacity} shape="chip" position={props.position}
    theme={state.theme} color={state.color} opacity={state.opacity * fade * 0.64}
    write={(object, index) => {
      const n = index * 5;
      const t = state.seconds;
      const x = wrap(random[n] + t * wind.x * 0.1);
      const y = wrap(random[n + 1] + t * wind.y * 0.1);
      const z = wrap(random[n + 2] + t * wind.z * 0.1);
      const edge = Math.min(x, 1 - x, y, 1 - y, z, 1 - z);
      const phase = random[n + 3] * TAU;
      object.position.set((x - 0.5) * bounds[0], (y - 0.5) * bounds[1] + 0.08 * Math.sin(phase + t * 1.3),
        (z - 0.5) * bounds[2]);
      object.rotation.set(phase + t * 0.4, t * 0.37, phase);
      const size = state.size * (0.025 + 0.06 * random[n + 4]) * smooth(edge / 0.12);
      object.scale.setScalar(size * (0.82 + 0.18 * Math.sin(phase + t)));
    }} />;
}

function Ring({theme, color, radius, opacity, width = 0.022, arc = TAU, angle = 0, depth = 0}: {
  theme: EffectTheme;
  color: string;
  radius: number;
  opacity: number;
  width?: number;
  arc?: number;
  angle?: number;
  depth?: number;
}) {
  const clay = theme.finish === 'sculpted';
  return <mesh position-z={depth} scale={radius} rotation-z={angle}>
    <torusGeometry args={[1, width * (clay ? 1.22 : 1), clay ? 7 : 5, Math.max(6, Math.ceil(46 * arc / TAU)), arc]} />
    <Surface theme={theme} color={color} opacity={opacity} />
  </mesh>;
}

export function Shockwave({rings = 2, thickness = 1, ...props}: EffectProps & {rings?: number; thickness?: number}) {
  const state = useEffectState(props, 0.85);
  if (!state.active) return null;
  const count = capacityFor(rings, 4, props.budget);
  return <group position={props.position} quaternion={axisFor(props.direction ?? [0, 1, 0], FORWARD)}>
    {Array.from({length: count}, (_, index) => {
      const p = clamp((state.progress - 0.14 * index) / (1 - 0.14 * index));
      const travel = props.motion === 'linear' ? p : props.motion === 'soft' ? smooth(p) : 1 - (1 - p) ** 2;
      return <Ring key={index} theme={state.theme} color={index ? state.theme.accent : state.color}
        radius={state.size * (0.14 + 0.86 * travel)} width={Math.max(0.1, Math.min(3, thickness)) * (index ? 0.017 : 0.026)} depth={index * 0.004}
        opacity={state.opacity * life(p, 0.075, 0.36) * 0.74 ** index} />;
    })}
  </group>;
}

export function EnergyRing(props: EffectProps) {
  const state = useEffectState(props, 1.75);
  if (!state.active) return null;
  const opacity = state.opacity * life(state.progress, 0.17, 0.68);
  const angle = state.travel * TAU * 0.62;
  return <group position={props.position} quaternion={axisFor(props.direction ?? [0, 1, 0], FORWARD)}>
    <Ring theme={state.theme} color={state.color} radius={state.size * (0.9 + 0.1 * Math.sin(Math.PI * state.progress))}
      opacity={opacity} arc={TAU * 0.69} angle={angle} />
    <Ring theme={state.theme} color={state.theme.accent} radius={state.size * 0.87} width={0.015}
      opacity={opacity * 0.82} arc={TAU * 0.23} angle={-angle + 2.3} depth={0.014} />
  </group>;
}

export function ImpactEffect({budget, ...props}: BurstProps) {
  return <>
    <Shockwave {...props} duration={props.duration} opacity={(props.opacity ?? 1) * 0.84} rings={2} />
    <Sparkles {...props} budget={budget} duration={props.duration} count={props.count ?? 10} size={(props.size ?? 1) * 0.74}
      spread={props.spread ?? 152} color={props.color} />
  </>;
}

type TrailProps = EffectProps & {
  sample: (frame: number) => Vec3;
  /** Distance between samples in output frames. */
  step?: number;
  samples?: number;
  /** Oldest available frame in the sample's coordinate system. */
  sampleFrom?: number;
};

export function MotionTrail({sample, step = 1.5, samples = 10, sampleFrom = 0, ...props}: TrailProps) {
  const state = useEffectState(props, Infinity);
  if (!state.active) return null;
  const capacity = capacityFor(samples, 32);
  const count = capacityFor(capacity, 32, props.budget);
  const displacement = new Vector3();
  const end = new Vector3();
  const spacing = Math.max(0.1, step);
  const fade = state.continuous ? 1 : life(state.progress, 0.06, 0.6);
  return <Instances count={count} capacity={capacity} shape="streak" position={props.position}
    theme={state.theme} color={state.color} opacity={state.opacity * fade * 0.92}
    write={(object, index) => {
      const recent = state.frame - index * spacing;
      const a = sample(Math.max(sampleFrom, recent));
      const b = sample(Math.max(sampleFrom, recent - spacing));
      end.set(...a);
      displacement.set(...b);
      object.position.copy(end).lerp(displacement, 0.5);
      displacement.sub(end);
      const length = displacement.length();
      if (length < 1e-5) {
        object.scale.setScalar(1e-6);
        return;
      }
      object.quaternion.setFromUnitVectors(UP, displacement.divideScalar(length));
      const taper = state.size * (1 - index / capacity) ** 1.12;
      object.scale.set(taper, length * 1.13, taper);
    }} />;
}

export function MotionSmear({sample, step = 1.5, sampleFrom = 0, children, renderSmear, ...props}:
  TrailProps & {children?: ReactNode; renderSmear?: (opacity: number) => ReactNode}) {
  const state = useEffectState(props, Infinity);
  if (!state.active) return null;
  const a = new Vector3(...sample(state.frame));
  const b = new Vector3(...sample(Math.max(sampleFrom, state.frame - Math.max(0.1, step))));
  const forward = a.clone().sub(b);
  const distance = forward.length();
  if (distance < 0.002) return null;
  const length = Math.min(distance, state.size * 3) * state.gain;
  const fade = state.continuous ? 1 : life(state.progress);
  const alpha = state.opacity * fade * 0.8;
  const origin = a.clone().addScaledVector(forward.divideScalar(distance), -length * 0.55);
  return <group position={props.position} visible={fade > 0}>
    <group position={origin} quaternion={new Quaternion().setFromUnitVectors(UP, forward)}
      scale={[state.size, Math.max(0.001, length), state.size]}>
      {renderSmear?.(alpha) ?? children ?? <mesh>
        <sphereGeometry args={[0.5, state.theme.finish === 'sculpted' ? 12 : 6, 7]} />
        <Surface theme={state.theme} color={state.color} opacity={alpha} />
      </mesh>}
    </group>
  </group>;
}

export function StylizedMotionBlur({sample, step = 0.6, samples = 4, sampleFrom = 0, renderGhost, ...props}:
  TrailProps & {renderGhost?: (index: number, opacity: number) => ReactNode}) {
  const state = useEffectState(props, Infinity);
  if (!state.active) return null;
  const count = capacityFor(samples, 8, props.budget);
  const head = new Vector3(...sample(state.frame));
  const fade = state.continuous ? 1 : life(state.progress);
  return <group position={props.position}>
    {Array.from({length: count}, (_, index) => {
      const previous = state.frame - (index + 1) * Math.max(0.1, step);
      if (previous < sampleFrom) return null;
      const point = sample(previous);
      if (head.distanceToSquared(new Vector3(...point)) < 0.0004 * state.size ** 2) return null;
      const opacity = state.opacity * fade * 0.28 * (1 - index / count) ** 1.6;
      return <group key={index} position={point} scale={state.size * (1 - index * 0.025)}>
        {renderGhost ? renderGhost(index, opacity) : <mesh>
          <icosahedronGeometry args={[0.5, 1]} />
          <Surface theme={state.theme} color={state.color} opacity={opacity} />
        </mesh>}
      </group>;
    })}
  </group>;
}

export function EnergyAura(props: EffectProps) {
  const state = useEffectState(props, 1.9);
  const color = useMemo(() => new Color(state.color), [state.color]);
  const alpha = state.opacity * life(state.progress, 0.2, 0.66);
  const uniforms = useMemo(() => ({ink: {value: color}, alpha: {value: alpha * 0.58}}), [color, alpha]);
  if (!state.active) return null;
  const radius = state.size * (1.03 + 0.075 * Math.sin(state.progress * Math.PI));
  if (state.theme.finish === 'sculpted') {
    return <group position={props.position} quaternion={axisFor(props.direction, FORWARD)}>
      <group rotation-z={state.travel * 0.36}>
        <Ring theme={state.theme} color={state.color} radius={radius} opacity={alpha} arc={TAU * 0.42} />
        <Ring theme={state.theme} color={state.theme.accent} radius={radius * 0.94} opacity={alpha * 0.7}
          width={0.016} arc={TAU * 0.33} angle={Math.PI * 1.02} />
      </group>
    </group>;
  }
  return <mesh position={props.position} scale={radius}>
    <sphereGeometry args={[1, 24, 14]} />
    <shaderMaterial side={BackSide} transparent depthWrite={false} uniforms={uniforms}
      vertexShader={`
        varying vec3 viewNormal;
        varying vec3 viewPosition;
        void main() {
          viewNormal = normalize(normalMatrix * normal);
          vec4 view = modelViewMatrix * vec4(position, 1.0);
          viewPosition = view.xyz;
          gl_Position = projectionMatrix * view;
        }`}
      fragmentShader={`
        varying vec3 viewNormal;
        varying vec3 viewPosition;
        uniform vec3 ink;
        uniform float alpha;
        void main() {
          float rim = pow(1.0 - abs(dot(normalize(viewNormal), normalize(viewPosition))), 2.7);
          gl_FragColor = vec4(ink, alpha * rim);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`} />
  </mesh>;
}

export function ObjectHighlight(props: EffectProps) {
  const state = useEffectState(props, 1.55);
  if (!state.active) return null;
  const opacity = state.opacity * life(state.progress, 0.18, 0.68);
  const radius = state.size * (1.18 - state.travel * 0.18);
  const span = state.size * 0.25;
  const thickness = state.size * 0.027;
  return <group position={props.position} quaternion={axisFor(props.direction, FORWARD)}>
    {[-1, 1].flatMap((x) => [-1, 1].map((y) => <group key={`${x},${y}`} position={[x * radius, y * radius, 0]}>
      <mesh position-x={-x * span / 2}>
        <boxGeometry args={[span, thickness, thickness]} />
        <Surface theme={state.theme} color={state.color} opacity={opacity} />
      </mesh>
      <mesh position-y={-y * span / 2}>
        <boxGeometry args={[thickness, span, thickness]} />
        <Surface theme={state.theme} color={state.color} opacity={opacity} />
      </mesh>
    </group>))}
  </group>;
}

export function FocusEffect(props: EffectProps) {
  const state = useEffectState(props, 1.1);
  if (!state.active) return null;
  const opacity = state.opacity * life(state.progress, 0.25, 0.58);
  const radius = state.size * (1.48 - 0.48 * state.travel);
  return <group position={props.position} quaternion={axisFor(props.direction, FORWARD)}>
    {[0.5, 3.65].map((angle) => <Ring key={angle} theme={state.theme} color={state.color} radius={radius}
      opacity={opacity * 0.84} width={0.012} arc={0.96} angle={angle + 0.24 * state.travel} />)}
  </group>;
}

const quadVertex = `
  varying vec2 coord;
  void main() {
    coord = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

export function DistortionEffect({map, ...props}: EffectProps & {map?: Texture}) {
  const state = useEffectState(props, 0.9);
  const color = useMemo(() => new Color(state.color), [state.color]);
  const opacity = state.opacity * life(state.progress, 0.17, 0.48);
  const uniforms = useMemo(() => ({
    ink: {value: color},
    age: {value: state.travel},
    alpha: {value: opacity},
    amplitude: {value: Math.min(0.055, 0.028 * state.gain)},
    image: {value: map ?? null},
    hasImage: {value: Boolean(map)},
  }), [color, map, opacity, state.gain, state.travel]);
  if (!state.active) return null;
  return <mesh position={props.position} quaternion={axisFor(props.direction, FORWARD)} scale={state.size}>
    <planeGeometry args={[2, 2]} />
    <shaderMaterial transparent depthWrite={false} side={DoubleSide} forceSinglePass uniforms={uniforms}
      vertexShader={quadVertex}
      fragmentShader={`
        varying vec2 coord;
        uniform vec3 ink;
        uniform float age, alpha, amplitude;
        uniform sampler2D image;
        uniform bool hasImage;
        void main() {
          vec2 local = coord * 2.0 - 1.0;
          float radius = length(local);
          float edge = 1.0 - smoothstep(0.55, 0.98, radius);
          float wave = sin(24.0 * radius - 10.0 * age) * (1.0 - age);
          vec2 warped = local + local / max(radius, 0.001) * amplitude * wave * edge;
          if (hasImage) {
            vec4 source = texture2D(image, clamp(warped * 0.5 + 0.5, 0.0, 1.0));
            gl_FragColor = vec4(source.rgb, alpha * edge * source.a);
          } else {
            float phase = warped.y * 43.0 + sin(warped.x * 6.0) * 1.4;
            float stripe = smoothstep(0.83, 0.98, cos(phase));
            gl_FragColor = vec4(ink, alpha * edge * stripe * 0.42);
          }
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`} />
  </mesh>;
}

/** Material accent on a sphere or a caller-owned geometry with unit local coordinates. */
export function LightSweep({geometry, ...props}: EffectProps & {geometry?: BufferGeometry}) {
  const state = useEffectState(props, 0.95, true);
  const color = useMemo(() => new Color(state.color), [state.color]);
  const center = -1.75 + state.travel * 3.5;
  const alpha = state.opacity * (state.theme.finish === 'sculpted' ? 0.37 : 0.68);
  const uniforms = useMemo(() => ({ink: {value: color}, center: {value: center}, alpha: {value: alpha}}),
    [color, center, alpha]);
  if (!state.active) return null;
  return <mesh position={props.position} quaternion={axisFor(props.direction, FORWARD)} scale={state.size * 1.018}
    geometry={geometry}>
    {!geometry && <sphereGeometry args={[1, 28, 16]} />}
    <shaderMaterial transparent depthWrite={false} uniforms={uniforms}
      vertexShader={`
        varying vec3 local;
        void main() {
          local = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`}
      fragmentShader={`
        varying vec3 local;
        uniform vec3 ink;
        uniform float center, alpha;
        void main() {
          float offset = local.x + 0.38 * local.y - center;
          float core = 1.0 - smoothstep(0.045, 0.17, abs(offset));
          float rim = 1.0 - smoothstep(0.15, 0.46, abs(offset));
          gl_FragColor = vec4(ink, alpha * (0.7 * core + 0.3 * rim));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`} />
  </mesh>;
}

/** Cheap backlit haze or shafts on an oriented world-space card. */
export function AtmosphericEffect({kind = 'haze', ...props}: EffectProps & {kind?: 'haze' | 'rays'}) {
  const state = useEffectState(props, Infinity);
  const color = useMemo(() => new Color(state.color), [state.color]);
  const fade = state.continuous ? smooth(state.seconds / 0.7) : life(state.progress);
  const alpha = state.opacity * fade * 0.26;
  const uniforms = useMemo(() => ({
    ink: {value: color}, time: {value: state.seconds}, alpha: {value: alpha}, shafts: {value: kind === 'rays'},
  }), [color, state.seconds, alpha, kind]);
  if (!state.active) return null;
  return <mesh position={props.position} quaternion={axisFor(props.direction, FORWARD)}
    scale={[state.size * 1.5, state.size, state.size]}>
    <planeGeometry args={[2, 2]} />
    <shaderMaterial transparent depthWrite={false} side={DoubleSide} forceSinglePass uniforms={uniforms}
      vertexShader={quadVertex}
      fragmentShader={`
        varying vec2 coord;
        uniform vec3 ink;
        uniform float time, alpha;
        uniform bool shafts;
        void main() {
          vec2 local = 2.0 * coord - 1.0;
          float edge = 1.0 - smoothstep(0.2, 1.0, length(local));
          float haze = 0.64 + 0.23 * sin(local.x * 2.1 - local.y * 6.0 + 0.36 * time);
          float rays = pow(0.5 + 0.5 * cos(14.0 * (local.x - 0.5 * local.y) + 0.15 * time), 3.0);
          gl_FragColor = vec4(ink, alpha * edge * (shafts ? rays : haze));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`} />
  </mesh>;
}

/** Origin at the center of the arrow, tip points along direction. */
export function AnimatedArrow(props: EffectProps) {
  const state = useEffectState(props, 1.6, true);
  if (!state.active) return null;
  const alpha = state.opacity * life(state.progress, 0.22, 0.7);
  const soft = state.theme.finish === 'sculpted';
  return <group position={props.position} quaternion={axisFor(props.direction, UP)}>
    <group scale={state.size * (0.75 + 0.25 * state.travel)}
      position-y={state.size * (0.11 * Math.sin(state.seconds * 5.8) - 0.1 * (1 - state.travel))}>
      <mesh position-y={-0.17}>
        <cylinderGeometry args={[0.053, 0.053, 0.46, soft ? 12 : 5]} />
        <Surface theme={state.theme} color={state.color} opacity={alpha} />
      </mesh>
      <mesh position-y={0.206}>
        <coneGeometry args={[0.17, 0.32, soft ? 14 : 5]} />
        <Surface theme={state.theme} color={state.color} opacity={alpha} />
      </mesh>
    </group>
  </group>;
}

const star = new Shape();
for (let index = 0; index < 8; index++) {
  const radius = index % 2 ? 0.2 : 0.5;
  const angle = TAU * index / 8;
  if (index === 0) star.moveTo(radius, 0);
  else star.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
}
star.closePath();
const starExtrusion = {depth: 0.075, steps: 1, bevelEnabled: false};
const clayExtrusion = {...starExtrusion, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.025, bevelThickness: 0.025};

export function FloatingIcon({icon = 'star', ...props}: EffectProps & {icon?: 'star' | 'diamond' | 'dot'}) {
  const state = useEffectState(props, 2.8, true);
  if (!state.active) return null;
  const alpha = state.opacity * life(state.progress, 0.18, 0.64);
  const clay = state.theme.finish === 'sculpted';
  const phase = TAU * sampleRandom(props.seed ?? 'icon', 0);
  const angle = state.seconds * 0.78;
  return <group position={props.position} quaternion={axisFor(props.direction, UP)}>
    <mesh position={[state.size * 0.12 * Math.sin(angle + phase), state.size * (0.64 * state.travel + 0.08 * Math.sin(phase + 4 * angle)), 0]}
      rotation={[0.12 * Math.sin(angle), angle * 0.6, 0.11 * Math.sin(phase + angle)]}
      scale={state.size * (0.72 + 0.28 * state.travel)}>
      {icon === 'star' && <extrudeGeometry args={[star, clay ? clayExtrusion : starExtrusion]} />}
      {icon === 'diamond' && <octahedronGeometry args={[0.47, 0]} />}
      {icon === 'dot' && <sphereGeometry args={[0.27, 12, 8]} />}
      <Surface theme={state.theme} color={state.color} opacity={alpha} />
    </mesh>
  </group>;
}
