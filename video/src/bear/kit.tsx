import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type {V3} from './cues';

// Soft toy-like 3D kit for «она выбрала медведя»: smooth shading, a fresnel rim on fur and fabric,
// shared geometries and materials (one material per colour/look, so hundreds of parts stay cheap).

// ---------------------------------------------------------------- materials

type Look = {
  rough?: number;
  metal?: number;
  rim?: string; // fresnel rim colour (fur, fluffy fabric)
  rimPow?: number;
  rimK?: number;
  emissive?: string;
  emissiveK?: number;
  opacity?: number;
  side?: THREE.Side;
  flat?: boolean;
  fog?: boolean;
  basic?: boolean; // unlit
  map?: THREE.Texture;
};

const MATS = new Map<string, THREE.Material>();

const rimify = (m: THREE.MeshStandardMaterial, rim: string, pow: number, k: number) => {
  const c = new THREE.Color(rim).multiplyScalar(k);
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = {value: c};
    shader.uniforms.uRimPow = {value: pow};
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRim;\nuniform float uRimPow;')
      .replace(
        '#include <opaque_fragment>',
        'float rimF = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), uRimPow);\noutgoingLight += uRim * rimF;\n#include <opaque_fragment>',
      );
  };
  m.customProgramCacheKey = () => 'rim';
};

export const mat = (color: string, look: Look = {}): THREE.Material => {
  if (look.map) {
    // textured materials are not cached here (their textures change)
    return new THREE.MeshStandardMaterial({color, map: look.map, roughness: look.rough ?? 0.8, metalness: 0});
  }
  const key = color + JSON.stringify(look);
  let m = MATS.get(key);
  if (m) return m;
  if (look.basic) {
    m = new THREE.MeshBasicMaterial({
      color,
      transparent: look.opacity !== undefined && look.opacity < 1,
      opacity: look.opacity ?? 1,
      side: look.side ?? THREE.FrontSide,
      fog: look.fog ?? true,
      toneMapped: false,
      depthWrite: look.opacity === undefined || look.opacity >= 1,
    });
  } else {
    const s = new THREE.MeshStandardMaterial({
      color,
      roughness: look.rough ?? 0.78,
      metalness: look.metal ?? 0,
      emissive: look.emissive ?? '#000000',
      emissiveIntensity: look.emissiveK ?? 1,
      transparent: look.opacity !== undefined && look.opacity < 1,
      opacity: look.opacity ?? 1,
      depthWrite: look.opacity === undefined || look.opacity >= 1,
      side: look.side ?? THREE.FrontSide,
      flatShading: look.flat ?? false,
      fog: look.fog ?? true,
    });
    if (look.rim) rimify(s, look.rim, look.rimPow ?? 2.4, look.rimK ?? 1);
    m = s;
  }
  MATS.set(key, m);
  return m;
};

// ---------------------------------------------------------------- geometries

const GEOS = new Map<string, THREE.BufferGeometry>();
const geo = (key: string, make: () => THREE.BufferGeometry) => {
  let g = GEOS.get(key);
  if (!g) {
    g = make();
    GEOS.set(key, g);
  }
  return g;
};
export const G = {
  sphere: (seg = 32) => geo(`s${seg}`, () => new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75))),
  hemi: (seg = 32) => geo(`h${seg}`, () => new THREE.SphereGeometry(1, seg, Math.round(seg * 0.4), 0, Math.PI * 2, 0, Math.PI / 2)),
  capsule: (r: number, len: number, seg = 16) => geo(`c${r.toFixed(3)}_${len.toFixed(3)}_${seg}`, () => new THREE.CapsuleGeometry(r, len, 6, seg)),
  cyl: (rt: number, rb: number, h: number, seg = 24, open = false) =>
    geo(`y${rt.toFixed(3)}_${rb.toFixed(3)}_${h.toFixed(3)}_${seg}_${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)),
  rbox: (w: number, h: number, d: number, r: number) =>
    geo(`b${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}_${r.toFixed(3)}`, () => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4))),
  box: () => geo('box', () => new THREE.BoxGeometry(1, 1, 1)),
  torus: (r: number, tube: number, arc = Math.PI * 2, seg = 32) =>
    geo(`t${r.toFixed(3)}_${tube.toFixed(3)}_${arc.toFixed(3)}_${seg}`, () => new THREE.TorusGeometry(r, tube, 12, seg, arc)),
  cone: (r: number, h: number, seg = 24) => geo(`k${r.toFixed(3)}_${h.toFixed(3)}_${seg}`, () => new THREE.ConeGeometry(r, h, seg)),
  plane: () => geo('plane', () => new THREE.PlaneGeometry(1, 1)),
  circle: (seg = 32) => geo(`o${seg}`, () => new THREE.CircleGeometry(1, seg)),
  ico: (detail = 1) => geo(`i${detail}`, () => new THREE.IcosahedronGeometry(1, detail)),
};

// ---------------------------------------------------------------- shapes

type Base = {
  position?: V3;
  rotation?: V3;
  scale?: V3 | number;
  color: string;
  look?: Look;
  shadow?: boolean;
  receive?: boolean;
};

const sc = (s: V3 | number | undefined): V3 | undefined => (s === undefined ? undefined : typeof s === 'number' ? [s, s, s] : s);

// an ellipsoid: radius 1 scaled
export const Ball: React.FC<Base & {seg?: number}> = ({position, rotation, scale, color, look, shadow = true, receive = true, seg = 32}) => (
  <mesh position={position} rotation={rotation} scale={sc(scale)} geometry={G.sphere(seg)} material={mat(color, look)} castShadow={shadow} receiveShadow={receive} />
);

// a capsule standing on y (centre at the middle)
export const Pill: React.FC<Base & {r: number; len: number; seg?: number}> = ({position, rotation, scale, color, look, r, len, seg = 16, shadow = true}) => (
  <mesh position={position} rotation={rotation} scale={sc(scale)} geometry={G.capsule(r, len, seg)} material={mat(color, look)} castShadow={shadow} receiveShadow />
);

// a capsule hanging down from its top end (the pivot); good for limbs
export const Limb: React.FC<{r: number; len: number; color: string; look?: Look; rotation?: V3; position?: V3; children?: React.ReactNode; r2?: number}> = ({
  r,
  len,
  color,
  look,
  rotation,
  position,
  children,
}) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, -len / 2, 0]} geometry={G.capsule(r, len, 14)} material={mat(color, look)} castShadow receiveShadow />
    <group position={[0, -len, 0]}>{children}</group>
  </group>
);

export const Cyl: React.FC<Base & {rt: number; rb: number; h: number; seg?: number; open?: boolean}> = ({position, rotation, scale, color, look, rt, rb, h, seg = 24, open, shadow = true}) => (
  <mesh position={position} rotation={rotation} scale={sc(scale)} geometry={G.cyl(rt, rb, h, seg, open)} material={mat(color, look)} castShadow={shadow} receiveShadow />
);

export const RBox: React.FC<Base & {size: V3; r?: number}> = ({position, rotation, scale, color, look, size, r = 0.02, shadow = true, receive = true}) => (
  <mesh position={position} rotation={rotation} scale={sc(scale)} geometry={G.rbox(size[0], size[1], size[2], r)} material={mat(color, look)} castShadow={shadow} receiveShadow={receive} />
);

export const Block: React.FC<Base & {size: V3}> = ({position, rotation, color, look, size, shadow = true, receive = true}) => (
  <mesh position={position} rotation={rotation} scale={size} geometry={G.box()} material={mat(color, look)} castShadow={shadow} receiveShadow={receive} />
);

export const Ring: React.FC<Base & {r: number; tube: number; arc?: number}> = ({position, rotation, scale, color, look, r, tube, arc, shadow = true}) => (
  <mesh position={position} rotation={rotation} scale={sc(scale)} geometry={G.torus(r, tube, arc)} material={mat(color, look)} castShadow={shadow} receiveShadow />
);

export const Cone: React.FC<Base & {r: number; h: number; seg?: number}> = ({position, rotation, scale, color, look, r, h, seg, shadow = true}) => (
  <mesh position={position} rotation={rotation} scale={sc(scale)} geometry={G.cone(r, h, seg)} material={mat(color, look)} castShadow={shadow} receiveShadow />
);

// a flat disc (for blush, pads, puddles), facing +z
export const Disc: React.FC<Base> = ({position, rotation, scale, color, look}) => (
  <mesh position={position} rotation={rotation} scale={sc(scale)} geometry={G.circle(32)} material={mat(color, look)} />
);

// ---------------------------------------------------------------- glow sprites (fake bloom)

const glowTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.18, 'rgba(255,255,255,0.65)');
    gr.addColorStop(0.45, 'rgba(255,255,255,0.18)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();

export const Glow: React.FC<{position: V3; size: number; color?: string; k?: number; fog?: boolean}> = ({position, size, color = '#fff3d0', k = 1, fog = false}) => {
  const m = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: glowTex(),
        color,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog,
        toneMapped: false,
      }),
    [color, fog],
  );
  m.opacity = Math.max(0, Math.min(1, k));
  if (k <= 0.001) return null;
  return <sprite position={position} scale={[size, size, size]} material={m} renderOrder={10} />;
};

// soft light shafts: additive planes with a vertical gradient
const shaftTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 256;
    const g = c.getContext('2d')!;
    const lg = g.createLinearGradient(0, 0, 0, 256);
    lg.addColorStop(0, 'rgba(255,255,255,0.9)');
    lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lg;
    g.fillRect(0, 0, 64, 256);
    const sg = g.createLinearGradient(0, 0, 64, 0);
    sg.addColorStop(0, 'rgba(0,0,0,1)');
    sg.addColorStop(0.5, 'rgba(0,0,0,0)');
    sg.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = sg;
    g.fillRect(0, 0, 64, 256);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();

export const Shaft: React.FC<{position: V3; rotation: V3; w: number; h: number; k?: number; color?: string}> = ({position, rotation, w, h, k = 0.25, color = '#ffd9a0'}) => {
  const m = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: shaftTex(),
        color,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        fog: false,
        toneMapped: false,
      }),
    [color],
  );
  m.opacity = k;
  return (
    <mesh position={position} rotation={rotation} scale={[w, h, 1]} material={m} renderOrder={9}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
};

// a picture from a canvas (signs, screens): lit or glowing
export const usePicMat = (tex: THREE.Texture, lit = true, glow = 1, transparent = false) =>
  useMemo(
    () =>
      lit
        ? new THREE.MeshStandardMaterial({map: tex, roughness: 0.8, metalness: 0, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.22 * glow, transparent})
        : new THREE.MeshBasicMaterial({map: tex, toneMapped: false, transparent, color: new THREE.Color(glow, glow, glow)}),
    [tex, lit, glow, transparent],
  );
