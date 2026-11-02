import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {Box, Cone, Cyl, Ico} from '../scene/parts';
import {V3, clamp01, lerp, lerp3, rnd} from './cues';

// ---------- noise shared by the shaders ----------

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

const VERT = /* glsl */ `
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

// ---------- the Earth: oceans and land, then ice, then the impact ----------

const EARTH_FRAG = /* glsl */ `
  uniform vec3 uSun;
  uniform float uIce;
  uniform vec3 uHit;
  uniform float uShock;
  uniform float uBurn;
  uniform float uDead;
  uniform float uNight;
  varying vec3 vObj;
  varying vec3 vNormalW;
  ${NOISE}
  void main() {
    float land = smoothstep(0.5, 0.53, fbm(vObj * 1.7 + 3.1));
    float tone = fbm(vObj * 6.0);
    vec3 ocean = mix(vec3(0.07, 0.25, 0.42), vec3(0.10, 0.33, 0.52), tone);
    vec3 ground = mix(vec3(0.33, 0.46, 0.24), vec3(0.55, 0.50, 0.36), smoothstep(0.35, 0.7, tone));
    float cap = smoothstep(0.88, 0.95, abs(vObj.y));
    vec3 col = mix(mix(ocean, ground, land), vec3(0.92, 0.95, 0.97), cap);
    // the ice age: everything white-blue with darker cracks
    float crack = 1.0 - smoothstep(0.0, 0.025, abs(fbm(vObj * 4.0 + 2.0) - 0.5));
    vec3 ice = mix(vec3(0.86, 0.92, 0.97), vec3(0.72, 0.82, 0.92), tone) - crack * 0.18;
    col = mix(col, ice, uIce);
    // clouds
    float cl = smoothstep(0.55, 0.75, fbm(vObj * 3.0 + 9.0));
    col = mix(col, vec3(0.95), cl * 0.5 * (1.0 - uDead));
    float diff = max(dot(normalize(vNormalW), uSun), 0.0);
    col *= 0.06 + 0.94 * diff;
    // impact: a glowing shock ring runs over the planet, burning everything inside
    float a = acos(clamp(dot(vObj, normalize(uHit)), -1.0, 1.0));
    float ring = exp(-pow((a - uShock) / 0.06, 2.0)) * step(0.001, uShock);
    float inside = 1.0 - smoothstep(uShock - 0.08, uShock, a);
    float lava = fbm(vObj * 9.0 + 4.0);
    vec3 hot = mix(vec3(1.0, 0.35, 0.05), vec3(1.0, 0.8, 0.4), lava) * (0.6 + 0.8 * lava);
    vec3 burnt = vec3(0.12, 0.1, 0.09) + hot * 0.25 * (1.0 - uBurn);
    col = mix(col, mix(hot, burnt, uBurn), inside * step(0.001, uShock));
    col += vec3(1.0, 0.75, 0.45) * ring * 2.0 * (1.0 - uBurn * 0.7);
    // a dead grey world
    col = mix(col, vec3(0.22, 0.21, 0.2) * (0.25 + 0.75 * diff) + hot * 0.06 * inside, uDead);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const ATMO_FRAG = /* glsl */ `
  uniform vec3 uSun;
  uniform vec3 uColor;
  uniform float uK;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    float rim = pow(1.0 - max(dot(normalize(vNormalW), vViewDir), 0.0), 3.0);
    float lit = 0.25 + 0.75 * max(dot(normalize(vNormalW), uSun), 0.0);
    gl_FragColor = vec4(uColor * rim * lit * uK, 1.0);
  }
`;

export type EarthState = {ice?: number; hit?: V3; shock?: number; burn?: number; dead?: number; atmo?: number; atmoColor?: string; spin?: number};

export const Planet: React.FC<{position?: V3; r: number; sun: V3; st: EarthState}> = ({position = [0, 0, 0], r, sun, st}) => {
  const sunV = useMemo(() => new THREE.Vector3(...sun).normalize(), [sun]);
  const uniforms = useMemo(
    () => ({uSun: {value: sunV.clone()}, uIce: {value: 0}, uHit: {value: new THREE.Vector3(0, 0, 1)}, uShock: {value: 0}, uBurn: {value: 0}, uDead: {value: 0}, uNight: {value: 0}}),
    [sunV],
  );
  const atmo = useMemo(() => ({uSun: {value: sunV.clone()}, uColor: {value: new THREE.Color('#73b8ff')}, uK: {value: 1}}), [sunV]);
  // the impact point is given in world space; undo the spin so it stays put on the surface
  const spin = st.spin ?? 0;
  const hit = new THREE.Vector3(...(st.hit ?? [0, 0, 1])).applyAxisAngle(new THREE.Vector3(0, 1, 0), -spin);
  return (
    <group position={position}>
      <mesh rotation={[0, spin, 0]}>
        <sphereGeometry args={[r, 96, 64]} />
        <shaderMaterial
          uniforms={uniforms}
          uniforms-uIce-value={st.ice ?? 0}
          uniforms-uHit-value={hit}
          uniforms-uShock-value={st.shock ?? 0}
          uniforms-uBurn-value={st.burn ?? 0}
          uniforms-uDead-value={st.dead ?? 0}
          vertexShader={VERT}
          fragmentShader={EARTH_FRAG}
        />
      </mesh>
      {(st.atmo ?? 1) > 0.001 ? (
        <mesh>
          <sphereGeometry args={[r * 1.015, 96, 64]} />
          <shaderMaterial
            uniforms={atmo}
            uniforms-uK-value={st.atmo ?? 1}
            uniforms-uColor-value={new THREE.Color(st.atmoColor ?? '#73b8ff')}
            vertexShader={VERT}
            fragmentShader={ATMO_FRAG}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ) : null}
    </group>
  );
};

// ---------- the Sun ----------

const SUN_FRAG = /* glsl */ `
  uniform float uT;
  uniform float uFlare;
  varying vec3 vObj;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  ${NOISE}
  void main() {
    float n = fbm(vObj * 5.0 + vec3(uT * 0.15));
    float n2 = fbm(vObj * 14.0 - vec3(uT * 0.3));
    vec3 col = mix(vec3(1.0, 0.55, 0.12), vec3(1.0, 0.92, 0.6), n * 0.8 + n2 * 0.3);
    float limb = pow(max(dot(normalize(vNormalW), vViewDir), 0.0), 0.4);
    col *= 0.7 + 0.6 * limb;
    col += vec3(1.0, 0.95, 0.85) * uFlare;
    gl_FragColor = vec4(col * 1.6, 1.0);
  }
`;

const GLOW_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uK;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float a = exp(-r * r * 6.0) * 0.9 + exp(-r * 2.2) * 0.25;
    a *= smoothstep(1.0, 0.85, r);
    gl_FragColor = vec4(uColor * a * uK, 1.0);
  }
`;
const UV_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// a soft additive glow that always faces the camera
export const Glow: React.FC<{position: V3; size: number; color: string; k?: number}> = ({position, size, color, k = 1}) => {
  const camera = useThree((s) => s.camera);
  const uniforms = useMemo(() => ({uColor: {value: new THREE.Color(color)}, uK: {value: 1}}), [color]);
  return (
    <mesh position={position} quaternion={camera.quaternion.clone()} renderOrder={3}>
      <planeGeometry args={[size, size]} />
      <shaderMaterial uniforms={uniforms} uniforms-uK-value={k} vertexShader={UV_VERT} fragmentShader={GLOW_FRAG} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

export const Sun: React.FC<{position: V3; r: number; t: number; flare?: number}> = ({position, r, t, flare = 0}) => {
  const uniforms = useMemo(() => ({uT: {value: 0}, uFlare: {value: 0}}), []);
  return (
    <group>
      <mesh position={position}>
        <sphereGeometry args={[r, 64, 48]} />
        <shaderMaterial uniforms={uniforms} uniforms-uT-value={t} uniforms-uFlare-value={flare} vertexShader={VERT} fragmentShader={SUN_FRAG} />
      </mesh>
      <Glow position={position} size={r * 5} color="#ffb25a" k={0.9 + flare} />
    </group>
  );
};

// ---------- the Moon, cracking ----------

const MOON_FRAG = /* glsl */ `
  uniform vec3 uSun;
  uniform float uCrack;
  varying vec3 vObj;
  varying vec3 vNormalW;
  ${NOISE}
  void main() {
    float n = fbm(vObj * 3.0);
    float craters = smoothstep(0.62, 0.66, fbm(vObj * 7.0 + 5.0));
    vec3 col = mix(vec3(0.62, 0.61, 0.58), vec3(0.78, 0.77, 0.74), n) - craters * 0.12;
    float diff = max(dot(normalize(vNormalW), uSun), 0.0);
    col *= 0.08 + 0.92 * diff;
    float c1 = 1.0 - smoothstep(0.0, 0.02, abs(fbm(vObj * 2.2 + 1.0) - 0.5));
    float c2 = 1.0 - smoothstep(0.0, 0.012, abs(fbm(vObj * 5.0 + 3.0) - 0.5));
    float cr = clamp(c1 * smoothstep(0.0, 0.4, uCrack) + c2 * smoothstep(0.3, 1.0, uCrack), 0.0, 1.0);
    col = mix(col, vec3(1.0, 0.55, 0.2) * 2.2, cr);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export const Moon: React.FC<{position: V3; r: number; sun: V3; crack: number; chunks?: number; t?: number}> = ({position, r, sun, crack, chunks = 0, t = 0}) => {
  const uniforms = useMemo(() => ({uSun: {value: new THREE.Vector3(...sun).normalize()}, uCrack: {value: 0}}), [sun]);
  return (
    <group position={position}>
      <mesh rotation={[0.3, 0.8, 0]}>
        <icosahedronGeometry args={[r, 4]} />
        <shaderMaterial uniforms={uniforms} uniforms-uCrack-value={crack} vertexShader={VERT} fragmentShader={MOON_FRAG} />
      </mesh>
      {chunks > 0
        ? Array.from({length: 9}).map((_, i) => {
            const d = new THREE.Vector3(rnd(i + 1) - 0.5, rnd(i + 2) - 0.5, rnd(i + 3) - 0.5).normalize();
            const dist = r * (1.05 + chunks * (0.3 + rnd(i + 4) * 0.6));
            return (
              <Ico
                key={i}
                radius={r * (0.08 + rnd(i + 5) * 0.12)}
                position={[d.x * dist, d.y * dist, d.z * dist]}
                rotation={[t * 0.3 + i, t * 0.2, i]}
                color="#9c9a94"
                emissive="#5a2a10"
                emissiveIntensity={0.6}
              />
            );
          })
        : null}
    </group>
  );
};

// ---------- the asteroid ----------

export const Asteroid: React.FC<{position: V3; r: number; spin: number; heat?: number}> = ({position, r, spin, heat = 0}) => {
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 3);
    const p = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = Math.sin(v.x * 3.1 + 1) * Math.sin(v.y * 2.7 + 2) * Math.sin(v.z * 3.3) * 0.22 + Math.sin(v.x * 7 + v.z * 5) * 0.05;
      v.multiplyScalar(1 + n + (v.x > 0.3 ? 0.12 : 0));
      p.setXYZ(i, v.x, v.y * 0.85, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group position={position}>
      <mesh geometry={geo} scale={r} rotation={[spin * 0.7, spin, spin * 0.3]}>
        <meshStandardMaterial color="#5a524a" roughness={1} flatShading emissive="#ff5a1a" emissiveIntensity={heat * 0.9} />
      </mesh>
      {heat > 0.01 ? <Glow position={[0, 0, 0]} size={r * 4.5} color="#ff7a2a" k={heat * 0.8} /> : null}
    </group>
  );
};

// ---------- the rocket ----------

export const Rocket: React.FC<{position: V3; rotation?: V3; scale?: number; flame: number; t: number}> = ({position, rotation = [0, 0, 0], scale = 1, flame, t}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <Cyl rTop={0.5} rBottom={0.5} height={5} position={[0, 2.5, 0]} color="#f2f2f2" segments={12} />
    <Cyl rTop={0.505} rBottom={0.505} height={0.5} position={[0, 3.8, 0]} color="#1f3f9e" segments={12} />
    <Cone radius={0.5} height={1.6} position={[0, 5.8, 0]} color="#d8382f" segments={12} />
    {[0, 1, 2, 3].map((i) => (
      <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
        <Box size={[0.08, 1.2, 0.8]} position={[0, 0.5, 0.75]} color="#d8382f" />
      </group>
    ))}
    {flame > 0 ? (
      <group position={[0, -0.2, 0]}>
        <Cone radius={0.45} height={2.6 * flame * (0.9 + 0.15 * Math.sin(t * 40))} position={[0, -1.3 * flame, 0]} rotation={[Math.PI, 0, 0]} color="#ffd27a" emissive="#ffb03a" emissiveIntensity={3} shadow={false} segments={10} />
        <Cone radius={0.25} height={1.6 * flame} position={[0, -0.8 * flame, 0]} rotation={[Math.PI, 0, 0]} color="#ffffff" emissive="#ffffff" emissiveIntensity={3} shadow={false} segments={8} />
        <Glow position={[0, -1.2, 0]} size={5 * flame} color="#ffb25a" k={1} />
      </group>
    ) : null}
  </group>
);

// ---------- stars ----------

export const Stars: React.FC<{opacity?: number; radius?: number; size?: number}> = ({opacity = 1, radius = 2000, size = 2.4}) => {
  const geometry = useMemo(() => {
    const n = 2400;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = rnd(i * 3 + 1) * 2 - 1;
      const t = rnd(i * 3 + 2) * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      pos[i * 3] = Math.cos(t) * r * radius;
      pos[i * 3 + 1] = u * radius;
      pos[i * 3 + 2] = Math.sin(t) * r * radius;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [radius]);
  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={-5}>
      <pointsMaterial color="#ffffff" size={size} sizeAttenuation={false} transparent opacity={opacity} depthWrite={false} fog={false} />
    </points>
  );
};

// ---------- the solar flare: a tongue of plasma from the Sun to the Earth ----------

export const FlareTongue: React.FC<{from: V3; to: V3; k: number; t: number}> = ({from, to, k, t}) => {
  if (k <= 0) return null;
  const n = 26;
  return (
    <>
      {Array.from({length: n}).map((_, i) => {
        const s = i / (n - 1);
        if (s > k) return null;
        const p = lerp3(from, to, s);
        // the tongue arcs a little and widens as it travels
        const lift = Math.sin(s * Math.PI) * 28;
        const w = lerp(16, 30, s) * (0.8 + 0.25 * Math.sin(t * 6 + i));
        const fade = clamp01((k - s) * 6);
        return <Glow key={i} position={[p[0], p[1] + lift, p[2]]} size={w * 2.4} color={s < 0.5 ? '#ffcf6a' : '#ff8a3a'} k={0.55 * fade} />;
      })}
    </>
  );
};
