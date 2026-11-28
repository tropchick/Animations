import {useEffect, useMemo, type ReactNode} from 'react';
import {DoubleSide, LatheGeometry, Shape, ShapeGeometry, Vector2, type BufferGeometry} from 'three';

type Vec3 = readonly [number, number, number];
type Profile = readonly (readonly [radius: number, height: number])[];
type Axis = 'x' | 'y' | 'z';
const origin: Vec3 = [0, 0, 0];
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const smooth = (t: number) => t * t * (3 - 2 * t);
const mix = (from: number, to: number, t: number) => from + (to - from) * t;

/** Each transform is sampled directly. The endpoints are valid in either direction. */
export function toyTransitionProgress(frame: number, start: number, duration: number) {
  return duration <= 1 ? Number(frame >= start) : clamp01((frame - start) / (duration - 1));
}

/** Model the panel in parent coordinates. The pivot remains on the seam. */
export function ToyHinge({pivot, axis = 'x', closed = 0, open = -Math.PI / 2,
  progress, settle = 0, children}: {
  pivot: Vec3;
  axis?: Axis;
  closed?: number;
  open?: number;
  progress: number;
  /** Final hinge recoil as a fraction of the total swing. */
  settle?: number;
  children: ReactNode;
}) {
  const p = clamp01(progress);
  const rebound = clamp01((p - 0.75) / 0.25);
  const t = smooth(p) + Math.sin(Math.PI * rebound) * Math.min(0.15, Math.max(0, settle));
  const angle = mix(closed, open, t);
  const [x, y, z] = pivot;
  return <group position={[x, y, z]}
    rotation={[axis === 'x' ? angle : 0, axis === 'y' ? angle : 0, axis === 'z' ? angle : 0]}>
    <group position={[-x, -y, -z]}>{children}</group>
  </group>;
}

export type ToyPart = {
  id: string;
  children: ReactNode;
  /** Connected pose, relative to the assembly origin. */
  position?: Vec3;
  /** Incoming offset from the connected pose. */
  offset: Vec3;
  rotation?: Vec3;
  spin?: Vec3;
  /** Offset in normalized shot time. Use separate delays to show the cause of each movement. */
  delay?: number;
  /** Peak height of the incoming trajectory in world units. */
  arc?: number;
};

function Parts({parts, progress, stagger, exploded}: {
  parts: readonly ToyPart[];
  progress: number;
  stagger: number;
  exploded: boolean;
}) {
  return <>{parts.map((part, index) => {
    const delay = Math.min(0.92, Math.max(0, part.delay ?? stagger * index / Math.max(1, parts.length - 1)));
    const t = smooth(clamp01((progress - delay) / (1 - delay)));
    const spread = exploded ? t : 1 - t;
    const lift = 4 * t * (1 - t) * (part.arc ?? 0);
    const [x, y, z] = part.position ?? origin;
    const [dx, dy, dz] = part.offset;
    const [rx, ry, rz] = part.rotation ?? origin;
    const [sx, sy, sz] = part.spin ?? origin;
    return <group key={part.id}
      position={[x + dx * spread, y + dy * spread + lift, z + dz * spread]}
      rotation={[rx + sx * spread, ry + sy * spread, rz + sz * spread]}>{part.children}</group>;
  })}</>;
}

export function ToyAssembly({parts, progress, stagger = 0.32, position}: {
  parts: readonly ToyPart[];
  progress: number;
  stagger?: number;
  position?: Vec3;
}) {
  return <group position={position}><Parts {...{parts, progress, stagger}} exploded={false} /></group>;
}

export function ToyExplodedView({parts, progress, stagger = 0.22, position}: {
  parts: readonly ToyPart[];
  progress: number;
  stagger?: number;
  position?: Vec3;
}) {
  return <group position={position}><Parts {...{parts, progress, stagger}} exploded /></group>;
}

/** A set of independent creases, or a serial fold when another ToyHinge is nested in a panel. */
export function ToyWorldFold({panels, progress}: {
  panels: readonly {
    id: string;
    pivot: Vec3;
    axis?: Axis;
    angle: number;
    delay?: number;
    children: ReactNode;
  }[];
  progress: number;
}) {
  return <>{panels.map(({id, pivot, axis, angle, delay = 0, children}) => {
    const start = Math.min(0.9, clamp01(delay));
    return <ToyHinge key={id} pivot={pivot} axis={axis} closed={angle} open={0}
      progress={clamp01((progress - start) / (1 - start))} settle={0.035}>{children}</ToyHinge>;
  })}</>;
}

export function ToyMiniature({position, pivot = [0, 0, -0.9], miniatureScale = 0.25, lift = 0.42,
  progress, base, cover, interior}: {
  position?: Vec3;
  pivot?: Vec3;
  miniatureScale?: number;
  lift?: number;
  progress: number;
  base?: ReactNode;
  cover?: ReactNode;
  interior: ReactNode;
}) {
  const t = clamp01((progress - 0.28) / 0.72);
  const reveal = smooth(t);
  return <group position={position}>
    {base}
    <ToyHinge pivot={pivot} progress={clamp01(progress / 0.63)} open={-Math.PI * 0.6} settle={0.045}>
      {cover}
    </ToyHinge>
    {t > 0 && <group position-y={-lift * (1 - reveal)} scale={miniatureScale}>{interior}</group>}
  </group>;
}

/** Geometric scaling gives proportionate scale velocity across orders of magnitude. */
export function sampleScaleJourney(progress: number, {hostAnchor, worldAnchor, nearScale, farScale}: {
  hostAnchor: Vec3;
  worldAnchor: Vec3;
  nearScale: number;
  farScale: number;
}): {position: [number, number, number]; scale: number} {
  if (![nearScale, farScale].every((size) => Number.isFinite(size) && size > 0)) {
    throw new Error('Toybox scale journey requires finite positive endpoint scales');
  }
  const scale = Math.exp(mix(Math.log(nearScale), Math.log(farScale), smooth(clamp01(progress))));
  return {position: [
    hostAnchor[0] - worldAnchor[0] * scale,
    hostAnchor[1] - worldAnchor[1] * scale,
    hostAnchor[2] - worldAnchor[2] * scale,
  ], scale};
}

export function ToyScalePortal({progress, children, ...anchors}: Parameters<typeof sampleScaleJourney>[1] & {
  progress: number;
  children: ReactNode;
}) {
  return <group {...sampleScaleJourney(progress, anchors)}>{children}</group>;
}

/** Expose the physical inside of a radial part. The two caps remain independently lit. */
export function ToySection({profile, color, sectionColor, openAngle = Math.PI / 2,
  angle = 0, segments = 36}: {
  profile: Profile;
  color: string;
  sectionColor: string;
  openAngle?: number;
  angle?: number;
  segments?: number;
}) {
  const span = Math.PI * 2 - Math.max(0.01, Math.min(1.98 * Math.PI, openAngle));
  const skin = useMemo(() => {
    if (profile.length < 3) throw new Error('ToySection needs a closed profile with at least three points');
    const outline = [...profile, profile[0]].map(([radius, height]) => new Vector2(radius, height));
    return new LatheGeometry(outline, Math.max(3, Math.floor(segments)), 0, span);
  }, [profile, segments, span]);
  const cap = useMemo(() => new ShapeGeometry(new Shape(profile.map(([r, y]) => new Vector2(r, y)))), [profile]);
  useEffect(() => () => skin.dispose(), [skin]);
  useEffect(() => () => cap.dispose(), [cap]);
  return <group rotation-y={angle}>
    <mesh geometry={skin} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.52} />
    </mesh>
    {[0, span].map((edge) => <mesh key={edge} geometry={cap} rotation-y={edge - Math.PI / 2} receiveShadow>
      <meshStandardMaterial color={sectionColor} roughness={0.84} side={DoubleSide} />
    </mesh>)}
  </group>;
}

/** Author equal-length profiles from bottom to top. Add profile rings for lips and shoulders. */
export function toyMorphLoft(profile: Profile, segments = 32, roundness = 1) {
  const geometry = new LatheGeometry(profile.map(([radius, height]) => new Vector2(radius, height)),
    Math.max(3, Math.floor(segments)));
  // A superellipse converts the same ring topology from circular to rounded-square.
  const power = Math.min(1, Math.max(0.45, roundness));
  if (power !== 1) {
    const vertices = geometry.getAttribute('position');
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i);
      const z = vertices.getZ(i);
      const radius = Math.hypot(x, z);
      if (radius === 0) continue;
      const curve = (coordinate: number) => radius * Math.sign(coordinate) * (Math.abs(coordinate) / radius) ** power;
      vertices.setXYZ(i, curve(x), vertices.getY(i), curve(z));
    }
    geometry.computeVertexNormals();
  }
  return geometry;
}

export function ToyMorph({geometry, target, progress, position, elastic = 0, children}: {
  geometry: BufferGeometry;
  target: BufferGeometry;
  progress: number;
  position?: Vec3;
  /** Bounded overlap after the movement resolves. Keep at zero for hard materials. */
  elastic?: number;
  children: ReactNode;
}) {
  const morph = useMemo(() => makeMorph(geometry, target), [geometry, target]);
  useEffect(() => () => morph.dispose(), [morph]);
  const p = clamp01(progress);
  const rebound = clamp01((p - 0.7) / 0.3);
  const influence = smooth(p) + Math.sin(rebound * Math.PI) * Math.min(0.12, Math.max(0, elastic));
  return <mesh args={[morph]} morphTargetInfluences={[influence]} position={position}
    frustumCulled={elastic <= 0} castShadow receiveShadow>
    {children}
  </mesh>;
}

function makeMorph(source: BufferGeometry, target: BufferGeometry) {
  const a = source.getAttribute('position');
  const b = target.getAttribute('position');
  const aIndex = source.index?.array;
  const bIndex = target.index?.array;
  if (!a || !b || a.itemSize !== 3 || b.itemSize !== 3 || a.count !== b.count ||
    aIndex?.length !== bIndex?.length || aIndex?.some((value, index) => value !== bIndex?.[index])) {
    throw new Error('ToyMorph needs the same topology and vertex ordering at both endpoints');
  }
  const morph = source.clone();
  morph.morphTargetsRelative = false;
  morph.morphAttributes = {position: [b.clone()]};
  const aNormal = source.getAttribute('normal');
  const bNormal = target.getAttribute('normal');
  if (aNormal && bNormal && aNormal.count === bNormal.count && aNormal.itemSize === bNormal.itemSize) {
    morph.morphAttributes.normal = [bNormal.clone()];
  }
  morph.computeBoundingSphere();
  return morph;
}
