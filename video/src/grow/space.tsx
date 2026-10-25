import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {random} from 'remotion';
import {Box, Ico} from '../scene/parts';
import {Beam} from './geo';
import {V3, clamp01, lerp, ramp} from './time';

// Everything after the camera leaves the ground: Earth is a ball of radius R at the origin.
export const R = 10;
export const SUN_DIR = new THREE.Vector3(1, 0.35, 0.55).normalize();

export const heatK = (v: number) => ramp(v, 50.4, 53.6);
export const darkK = (v: number) => ramp(v, 54.2, 57.8, (t) => t * t * (3 - 2 * t));
export const lensK = (v: number) => ramp(v, 54.6, 58.4);

// ---------- Earth ----------

const earthVertex = /* glsl */ `
  varying vec3 vObj;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vObj = normalize(position);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const NOISE = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; }
    return s;
  }
`;

const earthFragment = /* glsl */ `
  uniform vec3 uSun;
  uniform float uHeat;
  uniform float uDark;
  varying vec3 vObj;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  ${NOISE}
  void main() {
    float land = smoothstep(0.5, 0.53, fbm(vObj * 1.7 + 3.1));
    float tone = fbm(vObj * 6.0);
    vec3 ocean = mix(vec3(0.07, 0.25, 0.42), vec3(0.10, 0.33, 0.52), tone);
    vec3 ground = mix(vec3(0.33, 0.46, 0.24), vec3(0.55, 0.50, 0.36), smoothstep(0.35, 0.7, tone));
    float ice = smoothstep(0.93, 0.97, abs(vObj.y));
    vec3 col = mix(mix(ocean, ground, land), vec3(0.92, 0.95, 0.97), ice);
    float diff = max(dot(normalize(vNormalW), uSun), 0.0);
    col *= 0.07 + 0.93 * diff;
    // glowing cracks as the crushed planet heats up from inside
    float c = 1.0 - smoothstep(0.0, 0.03, abs(fbm(vObj * 3.2 + 7.0) - 0.5));
    float c2 = 1.0 - smoothstep(0.0, 0.02, abs(fbm(vObj * 7.5 + 1.0) - 0.5));
    vec3 glow = vec3(1.0, 0.42, 0.08) * (c + 0.6 * c2) * 1.6 + vec3(0.45, 0.08, 0.02) * 0.35;
    col = mix(col, col * 0.55, uHeat) + glow * uHeat;
    col *= 1.0 - uDark;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const atmoFragment = /* glsl */ `
  uniform vec3 uSun;
  uniform float uK;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    float rim = pow(1.0 - max(dot(normalize(vNormalW), vViewDir), 0.0), 3.0);
    float lit = 0.25 + 0.75 * max(dot(normalize(vNormalW), uSun), 0.0);
    gl_FragColor = vec4(vec3(0.45, 0.72, 1.0) * rim * lit * uK, 1.0);
  }
`;

const Earth: React.FC<{v: number}> = ({v}) => {
  const uniforms = useMemo(() => ({uSun: {value: SUN_DIR.clone()}, uHeat: {value: 0}, uDark: {value: 0}}), []);
  const atmo = useMemo(() => ({uSun: {value: SUN_DIR.clone()}, uK: {value: 1}}), []);
  // R3F copies the uniforms object once, so changing values must go through the uniforms-*-value props
  const heat = heatK(v) * (1 - darkK(v));
  const dark = darkK(v);
  const atmoK = 0.9 * (1 - ramp(v, 50, 53));
  return (
    <group rotation={[0.35, v * 0.05, 0]}>
      <mesh>
        <sphereGeometry args={[R, 96, 64]} />
        <shaderMaterial uniforms={uniforms} uniforms-uHeat-value={heat} uniforms-uDark-value={dark} vertexShader={earthVertex} fragmentShader={earthFragment} />
      </mesh>
      {atmoK > 0.001 ? (
        <mesh>
          <sphereGeometry args={[R * 1.012, 96, 64]} />
          <shaderMaterial uniforms={atmo} uniforms-uK-value={atmoK} vertexShader={earthVertex} fragmentShader={atmoFragment} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
};

// ---------- Stars, bent around the black hole ----------

const starVertex = /* glsl */ `
  uniform vec3 uC;
  uniform float uThetaE;
  uniform float uSign;
  uniform float uSize;
  attribute float aB;
  varying float vB;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 d = normalize(mv.xyz);
    vec3 c = normalize(uC);
    float cosT = clamp(dot(d, c), -1.0, 1.0);
    float th = acos(cosT);
    vB = aB;
    if (uThetaE > 0.0 && th < 1.4) {
      // point-lens images: the main one is pushed outwards, the second one appears inside, on the other side
      float th2 = 0.5 * (th + uSign * sqrt(th * th + 4.0 * uThetaE * uThetaE));
      vec3 axis = d - c * cosT;
      float al = length(axis);
      axis = al > 1e-5 ? axis / al : vec3(1.0, 0.0, 0.0);
      vec3 nd = c * cos(th2) + axis * sin(th2);
      mv.xyz = nd * length(mv.xyz);
      if (uSign < 0.0) vB *= 0.6 * smoothstep(0.0, 0.15, uThetaE);
    } else if (uSign < 0.0) {
      vB = 0.0;
    }
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.5 + aB);
  }
`;

const starFragment = /* glsl */ `
  uniform float uOpacity;
  varying float vB;
  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float a = smoothstep(0.5, 0.15, length(q));
    gl_FragColor = vec4(vec3(1.0, 0.97, 0.92), a * vB * uOpacity);
  }
`;

const StarLayer: React.FC<{v: number; sign: 1 | -1; center: THREE.Vector3}> = ({v, sign, center}) => {
  const camera = useThree((s) => s.camera);
  const geometry = useMemo(() => {
    const n = 2600;
    const pos = new Float32Array(n * 3);
    const b = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = random(`ss-u-${i}`) * 2 - 1;
      const t = random(`ss-t-${i}`) * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      pos[i * 3] = Math.cos(t) * r * 1200;
      pos[i * 3 + 1] = u * 1200;
      pos[i * 3 + 2] = Math.sin(t) * r * 1200;
      b[i] = Math.pow(random(`ss-b-${i}`), 3) * 1.6 + 0.15;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aB', new THREE.BufferAttribute(b, 1));
    return g;
  }, []);
  const uniforms = useMemo(() => ({uC: {value: new THREE.Vector3()}, uThetaE: {value: 0}, uSign: {value: sign}, uSize: {value: 3.2}, uOpacity: {value: 1}}), [sign]);
  camera.updateMatrixWorld();
  const c = center.clone().applyMatrix4(camera.matrixWorldInverse);
  const thetaE = 0.36 * lensK(v);
  if (sign < 0 && lensK(v) <= 0) return null;
  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={-5}>
      <shaderMaterial uniforms={uniforms} uniforms-uC-value={[c.x, c.y, c.z]} uniforms-uThetaE-value={thetaE} vertexShader={starVertex} fragmentShader={starFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

// ---------- Glowing ring of bent light around the black hole (always faces the camera) ----------

const ringFragment = /* glsl */ `
  uniform float uK;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0; // 1 = edge of the quad
    float photon = exp(-pow((r - 0.42) / 0.012, 2.0)) * 1.4;
    float halo = exp(-pow((r - 0.45) / 0.07, 2.0)) * 0.35;
    float einstein = exp(-pow((r - 0.62) / 0.02, 2.0)) * 0.5;
    vec3 col = vec3(1.0, 0.86, 0.66) * photon + vec3(0.9, 0.7, 0.5) * halo + vec3(0.75, 0.85, 1.0) * einstein;
    gl_FragColor = vec4(col * uK, 1.0);
  }
`;
const ringVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const LightRing: React.FC<{v: number}> = ({v}) => {
  const camera = useThree((s) => s.camera);
  const uniforms = useMemo(() => ({uK: {value: 0}}), []);
  const k = lensK(v);
  if (k <= 0) return null;
  const q = camera.quaternion.clone();
  // the photon ring sits just outside the black disc (r = 0.42 of the quad half size)
  const size = (R * 1.12 * 2) / 0.42;
  return (
    <mesh quaternion={q} renderOrder={5}>
      <planeGeometry args={[size, size]} />
      <shaderMaterial uniforms={uniforms} uniforms-uK-value={k} vertexShader={ringVertex} fragmentShader={ringFragment} transparent depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

// ---------- Satellites falling ----------

const SATS = Array.from({length: 10}, (_, i) => ({
  r0: R * (1.25 + random(`sat-r-${i}`) * 0.9),
  a0: random(`sat-a-${i}`) * Math.PI * 2,
  tilt: (random(`sat-t-${i}`) - 0.5) * 1.6,
  t0: 46 + random(`sat-s-${i}`) * 2.2,
  dur: 1.4 + random(`sat-d-${i}`) * 1.2,
  w: 0.9 + random(`sat-w-${i}`) * 0.5,
}));

const satPos = (s: (typeof SATS)[number], v: number): V3 => {
  const k = ramp(v, s.t0, s.t0 + s.dur, (t) => t * t);
  const r = lerp(s.r0, R * 0.98, k);
  const a = s.a0 + (v - 46) * s.w * (1 + 1.5 * k);
  const x = Math.cos(a) * r;
  const z = Math.sin(a) * r;
  return [x, z * Math.sin(s.tilt), z * Math.cos(s.tilt)];
};

const Satellites: React.FC<{v: number}> = ({v}) => (
  <>
    {SATS.map((s, i) => {
      const hit = s.t0 + s.dur;
      if (v > hit + 0.8) return null;
      const p = satPos(s, v);
      if (v > hit) {
        const k = (v - hit) / 0.8;
        return <Ico key={i} radius={0.35 + 0.6 * k} detail={1} position={p} color="#fff1c4" emissive="#ffb04a" emissiveIntensity={2} opacity={1 - k} shadow={false} />;
      }
      const trail = satPos(s, v - 0.18);
      const burning = ramp(v, s.t0 + s.dur * 0.4, hit);
      return (
        <group key={i}>
          <group position={p} rotation={[i, i * 2, 0]} scale={0.22}>
            <Box size={[1, 1, 1.4]} color="#d8d4c8" />
            <Box size={[3.4, 0.05, 1]} position={[-2.3, 0, 0]} color="#2f4f8a" />
            <Box size={[3.4, 0.05, 1]} position={[2.3, 0, 0]} color="#2f4f8a" />
          </group>
          {burning > 0 ? <Beam from={trail} to={p} r={0.05 + 0.06 * burning} color="#fff1c4" emissive="#ff9a3a" shadow={false} opacity={0.85 * burning} /> : null}
        </group>
      );
    })}
  </>
);

// ---------- The Moon falls, is stretched and torn into a ring ----------

const MOON_R = 2.7;
const MOON_FROM: V3 = [46, 12, -30];
const MOON_TO: V3 = [15.5, 3.5, -5];
const MOON_BREAK = 52.3;
const RING_TILT = 0.32;

export const moonState = (v: number) => {
  const k = ramp(v, 49.6, MOON_BREAK, (t) => t * t);
  const p: V3 = [lerp(MOON_FROM[0], MOON_TO[0], k), lerp(MOON_FROM[1], MOON_TO[1], k), lerp(MOON_FROM[2], MOON_TO[2], k)];
  const stretch = 1 + 1.3 * ramp(v, 51.2, MOON_BREAK, (t) => t * t);
  return {p, stretch};
};

const Moon: React.FC<{v: number}> = ({v}) => {
  if (v >= MOON_BREAK) return null;
  const {p, stretch} = moonState(v);
  // stretch along the line to the Earth
  const dir = new THREE.Vector3(...p).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
  return (
    <group position={p} quaternion={q.toArray() as [number, number, number, number]} scale={[stretch, 1 / Math.sqrt(stretch), 1 / Math.sqrt(stretch)]}>
      <Ico radius={MOON_R} detail={2} color="#c9c6c0" />
      {[0, 1, 2, 3, 4].map((i) => (
        <Ico key={i} radius={MOON_R * 0.22} detail={0} position={[Math.cos(i * 1.9) * MOON_R * 0.86, Math.sin(i * 2.7) * MOON_R * 0.4, Math.sin(i * 1.9) * MOON_R * 0.5]} color="#a9a6a0" />
      ))}
    </group>
  );
};

const CHUNKS = Array.from({length: 120}, (_, i) => ({
  da: (random(`ch-a-${i}`) - 0.5) * 2,
  dr: (random(`ch-r-${i}`) - 0.5) * 0.7,
  dy: (random(`ch-y-${i}`) - 0.5) * 0.06,
  size: 0.14 + random(`ch-s-${i}`) ** 2 * 0.6,
  fall: random(`ch-f-${i}`),
}));

const DEBRIS_W = 0.55; // rad/s at the Moon's distance
const chunkFall = (c: (typeof CHUNKS)[number]) => ({t0: 54 + c.fall * 2.5, t1: 56.2 + c.fall * 4 + (c.dr + 0.35) * 2.5});

// Radius (in R) of a chunk over time: spreads out from the Moon's orbit, then spirals in.
const chunkR = (c: (typeof CHUNKS)[number], r0: number, v: number) => {
  const spread = ramp(v, MOON_BREAK, MOON_BREAK + 2.2, (t) => 1 - (1 - t) * (1 - t));
  const {t0, t1} = chunkFall(c);
  const kIn = ramp(v, t0, t1, (t) => t * t);
  // about half the chunks fall in; the rest settle into a hot disc that keeps circling the black hole
  const end = c.fall < 0.5 ? 0.97 : 1.22 + 0.5 * (c.fall - 0.5);
  return {r: lerp(r0 + c.dr * spread, end, kIn), kIn, spread};
};

// The Moon's remains: a flat disc that circles the Earth, faster the closer a chunk gets (like a real orbit),
// and spirals down into it. The angle is integrated step by step so the speed-up is smooth.
const Debris: React.FC<{v: number}> = ({v}) => {
  if (v < MOON_BREAK) return null;
  const m = moonState(MOON_BREAK);
  const a0 = Math.atan2(m.p[2], m.p[0]);
  const r0 = Math.hypot(m.p[0], m.p[2]) / R;
  const steps = Math.ceil((v - MOON_BREAK) * 60);
  const dt = steps > 0 ? (v - MOON_BREAK) / steps : 0;
  return (
    <group rotation={[RING_TILT, 0, 0.12]}>
      {CHUNKS.map((c, i) => {
        let phase = 0;
        for (let s = 0; s < steps; s++) {
          const rr = chunkR(c, r0, MOON_BREAK + (s + 0.5) * dt).r;
          phase += DEBRIS_W * Math.pow(r0 / rr, 1.5) * dt;
        }
        const {r: rn, kIn, spread} = chunkR(c, r0, v);
        const r = rn * R;
        // gone once it reaches the surface
        const fade = clamp01((rn - 1.0) / 0.06);
        if (fade <= 0) return null;
        const a = -a0 + c.da * Math.PI * spread + phase;
        const heat = clamp01(kIn * 1.4);
        return (
          <Ico
            key={i}
            radius={c.size * (1 - 0.35 * kIn) * fade}
            detail={0}
            position={[Math.cos(a) * r, c.dy * R * (1 - kIn), Math.sin(a) * r]}
            rotation={[i, v * 0.7 + i, i * 2]}
            color={heat > 0.2 ? '#ffd9a0' : '#bdb9b2'}
            emissive={heat > 0.05 ? '#ff7a2a' : undefined}
            emissiveIntensity={heat * 2.2}
          />
        );
      })}
    </group>
  );
};

// ---------- The whole space scene ----------

export const Space: React.FC<{v: number}> = ({v}) => {
  const center = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  return (
    <>
      <color attach="background" args={['#020306']} />
      <ambientLight intensity={0.08} />
      <directionalLight position={SUN_DIR.clone().multiplyScalar(200).toArray()} intensity={2.4} color="#fff6e6" />
      <StarLayer v={v} sign={1} center={center} />
      <StarLayer v={v} sign={-1} center={center} />
      <Earth v={v} />
      <Satellites v={v} />
      <Moon v={v} />
      <Debris v={v} />
      <LightRing v={v} />
    </>
  );
};
