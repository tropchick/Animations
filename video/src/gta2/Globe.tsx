import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Glow, Stars} from '../gta/Space';
import {V3, clamp01, rnd} from './cues';

// ---------- the Earth at night: dark land, city lights that go out ----------

const NOISE = /* glsl */ `
  float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
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

const FRAG = /* glsl */ `
  uniform vec3 uSun;
  uniform vec3 uHub;
  uniform float uOut;   // angle (rad) from the hub inside which the lights are out
  uniform float uLoad;  // 0..1 how hard the network glows
  varying vec3 vObj;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  ${NOISE}
  void main() {
    float land = smoothstep(0.5, 0.53, fbm(vObj * 1.7 + 3.1));
    vec3 col = mix(vec3(0.015, 0.03, 0.07), vec3(0.04, 0.05, 0.06), land);
    float diff = max(dot(normalize(vNormalW), uSun), 0.0);
    col += vec3(0.05, 0.12, 0.22) * diff * 0.6;
    // the city lights: clusters on land
    float cities = smoothstep(0.62, 0.78, fbm(vObj * 9.0 + 1.3)) * land;
    float dots = step(0.78, noise(vObj * 140.0));
    float a = acos(clamp(dot(vObj, normalize(uHub)), -1.0, 1.0));
    float on = smoothstep(uOut, uOut + 0.08, a);
    vec3 warm = mix(vec3(1.0, 0.75, 0.4), vec3(1.0, 0.45, 0.35), uLoad);
    col += warm * (cities * 0.9 + cities * dots * 1.6) * on * (1.0 - diff * 0.6);
    // atmosphere rim
    float rim = pow(1.0 - max(dot(normalize(vNormalW), vViewDir), 0.0), 3.0);
    col += vec3(0.2, 0.45, 1.0) * rim * 0.6;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export const NightEarth: React.FC<{r: number; hub: V3; out: number; load: number; sun?: V3}> = ({r, hub, out, load, sun = [1, 0.3, -0.6]}) => {
  const uniforms = useMemo(
    () => ({uSun: {value: new THREE.Vector3(...sun).normalize()}, uHub: {value: new THREE.Vector3(...hub).normalize()}, uOut: {value: 0}, uLoad: {value: 0}}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return (
    <mesh>
      <sphereGeometry args={[r, 96, 64]} />
      <shaderMaterial uniforms={uniforms} uniforms-uOut-value={out} uniforms-uLoad-value={load} vertexShader={VERT} fragmentShader={FRAG} />
    </mesh>
  );
};

// cities that download from the hub: points on the sphere (on the visible hemisphere around +z)
export const CITIES: V3[] = Array.from({length: 42}).map((_, i) => {
  const lon = (rnd(i * 3 + 1) - 0.5) * 2.6;
  const lat = (rnd(i * 3 + 2) - 0.5) * 1.8;
  return [Math.sin(lon) * Math.cos(lat), Math.sin(lat), Math.cos(lon) * Math.cos(lat)];
});

const arcCurve = (a: THREE.Vector3, b: THREE.Vector3, r: number) => {
  const mid = a.clone().add(b).normalize().multiplyScalar(r * (1.12 + a.distanceTo(b) * 0.18));
  return new THREE.QuadraticBezierCurve3(a.clone().multiplyScalar(r * 1.003), mid, b.clone().multiplyScalar(r * 1.003));
};

// the download lines: grow from each city to the hub, glow hotter, turn red, then vanish
export const Arcs: React.FC<{r: number; hub: V3; grow: number; heat: number; gone: number; t: number}> = ({r, hub, grow, heat, gone, t}) => {
  const geos = useMemo(() => {
    const h = new THREE.Vector3(...hub).normalize();
    return CITIES.map((c) => {
      const cv = new THREE.Vector3(...c).normalize();
      return cv.distanceTo(h) < 0.05 ? null : arcCurve(cv, h, r);
    });
  }, [hub, r]);
  if (gone >= 1) return null;
  const color = new THREE.Color().setHSL(lerpN(0.5, 0.0, heat), 1, 0.55);
  return (
    <>
      {geos.map((curve, i) => {
        if (!curve) return null;
        const start = rnd(i + 99) * 0.6;
        const k = clamp01((grow - start) / 0.4);
        if (k <= 0) return null;
        const pts = curve.getPoints(40).slice(0, Math.max(2, Math.round(41 * k)));
        const c2 = new THREE.CatmullRomCurve3(pts);
        const flick = 0.75 + 0.25 * Math.sin(t * 20 + i);
        return (
          <mesh key={i}>
            <tubeGeometry args={[c2, 30, r * 0.004 * (1 + heat), 4, false]} />
            <meshBasicMaterial color={color} toneMapped={false} transparent opacity={(1 - gone) * flick} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}
    </>
  );
};

const lerpN = (a: number, b: number, k: number) => a + (b - a) * k;

export const Hub: React.FC<{r: number; hub: V3; heat: number; blast: number}> = ({r, hub, heat, blast}) => {
  const h = new THREE.Vector3(...hub).normalize().multiplyScalar(r * 1.01);
  const p: V3 = [h.x, h.y, h.z];
  return (
    <>
      <Glow position={p} size={r * (0.25 + 0.25 * heat)} color={heat > 0.5 ? '#ff5a4a' : '#7ff0ff'} k={1.2} />
      {blast > 0 ? <Glow position={p} size={r * (0.4 + 2.6 * blast)} color="#ffe0b0" k={Math.max(0, 2 - blast * 2)} /> : null}
    </>
  );
};

export {Stars};
