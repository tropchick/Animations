import {createContext, useContext} from 'react';
import type {ThreeElements} from '@react-three/fiber';
import {
  DataTexture, Float32BufferAttribute, LinearFilter, LinearMipmapLinearFilter,
  RepeatWrapping, SphereGeometry, Vector3,
} from 'three';
import type {ColorRepresentation, Vector3Tuple} from 'three';

export type ClayDetail = 'draft' | 'final';
export type ClayShape = 'blob' | 'loaf' | 'pear' | 'slab';
export const ClayDetailContext = createContext<ClayDetail>('final');

const tau = 2 * Math.PI;
const variant = (seed: number, count: number) => ((Math.trunc(seed) % count) + count) % count;
const shapes = new Map<string, SphereGeometry>();

// Radial mapping avoids sharp pinches at the axes of a conventional superellipsoid.
function mould(direction: Vector3, shape: ClayShape, phase: number) {
  const {x, y, z} = direction;
  const p = shape === 'slab' ? 7 : shape === 'loaf' ? 3.05 : 2;
  const radius = 0.5 / (Math.abs(x) ** p + Math.abs(y) ** p + Math.abs(z) ** p) ** (1 / p);
  const knead = 1 + 0.019 * Math.sin(x * 4.3 + z * 2.4 + phase) * Math.cos(y * 4.7 - phase)
    + 0.008 * Math.sin(x * 8 - y * 6 + z * 5 + phase);
  const taper = shape === 'pear' ? 1 - 0.25 * y : 1;
  return new Vector3(
    x * taper + 0.018 * y * y * Math.cos(phase),
    y,
    z * taper + 0.015 * x * y,
  ).multiplyScalar(radius * knead);
}

/** Shared read-only geometry, nominally one unit across. Safe to pass to instancedMesh. */
export function getClayGeometry(shape: ClayShape = 'blob', seed = 0, detail: ClayDetail = 'final') {
  const index = variant(seed, 8);
  const key = [shape, index, detail].join('/');
  const cached = shapes.get(key);
  if (cached) return cached;
  const geometry = new SphereGeometry(1, detail === 'final' ? 40 : 24, detail === 'final' ? 26 : 16);
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const colors = new Float32Array(positions.count * 3);
  const d = new Vector3();
  const axis = new Vector3();
  const phase = index * 2.39996;
  for (let i = 0; i < positions.count; i++) {
    d.fromBufferAttribute(positions, i).normalize();
    const pos = mould(d, shape, phase);
    // Differentiate on the sphere so normals agree at the duplicated UV seam and poles.
    axis.set(0, Math.abs(d.y) < 0.9 ? 1 : 0, Math.abs(d.y) < 0.9 ? 0 : 1);
    const u = axis.cross(d).normalize().multiplyScalar(0.001);
    const v = d.clone().cross(u);
    const derivative = (t: Vector3) => mould(d.clone().add(t).normalize(), shape, phase)
      .sub(mould(d.clone().sub(t).normalize(), shape, phase));
    const n = derivative(u).cross(derivative(v)).normalize();
    positions.setXYZ(i, pos.x, pos.y, pos.z);
    normals.setXYZ(i, n.x, n.y, n.z);
    const pigment = 0.974 + 0.023 * Math.sin(d.x * 6 + d.y * 3 - phase) * Math.cos(d.z * 5 + phase);
    colors.set([pigment, pigment ** 1.25, pigment ** 1.5], i * 3);
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  shapes.set(key, geometry);
  return geometry;
}

function lattice(x: number, y: number, seed: number) {
  let h = Math.imul(x + 17, 0x45d9f3b) ^ Math.imul(y + 31, 0x27d4eb2d) ^ Math.imul(seed + 7, 0x165667b1);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function noise(u: number, v: number, freq: number, seed: number) {
  const x = u * freq * 2;
  const y = v * freq;
  const a = Math.floor(x);
  const b = Math.floor(y);
  const ease = (t: number) => t * t * (3 - 2 * t);
  const tx = ease(x - a), ty = ease(y - b);
  const right = (a + 1) % (freq * 2);
  const bottom = (b + 1) % freq;
  const row = (j: number) => lattice(a, j, seed) * (1 - tx) + lattice(right, j, seed) * tx;
  return row(b) * (1 - ty) + row(bottom) * ty;
}

const normalMaps = new Map<number, DataTexture>();

// One CPU bake per mould family. The PBR shader samples a mipmapped tangent normal.
function clayNormalMap(seed: number) {
  const index = variant(seed, 4);
  const existing = normalMaps.get(index);
  if (existing) return existing;
  const width = 512, height = 256;
  const field = new Float32Array(width * height);
  const pixels = new Uint8Array(width * height * 4);
  const prints = Array.from({length: 6}, (_, i) => {
    const angle = lattice(i, 13, index) * tau;
    return {
      u: (i + 0.5 + 0.45 * lattice(i, 2, index)) / 6 % 1,
      v: 0.22 + 0.55 * lattice(i, 3, index),
      cos: Math.cos(angle), sin: Math.sin(angle),
      length: 0.10 + 0.07 * lattice(i, 6, index),
    };
  });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width, v = y / height;
      const fold = noise(u, v, 5, index);
      // A mostly smoothed skin with broad directional tool sweeps. Stretch and
      // bend the mid-frequency field so the raking light does not reveal a grid.
      const bentU = (u + 0.036 * Math.sin(tau * (2 * v + 0.25 * fold))) % 1;
      const sweep = noise((bentU + 1) % 1, (v * 3 + 0.10 * fold) % 1, 9, index);
      let value = 1.05 * fold + 0.28 * sweep + 0.052 * noise(u, v, 45, index);
      for (const print of prints) {
        let dx = u - print.u;
        dx = (dx - Math.round(dx)) * 2;
        const dy = v - print.v;
        const a = (dx * print.cos + dy * print.sin) / print.length;
        const b = (dy * print.cos - dx * print.sin) / 0.093;
        const edge = 1 - a * a - b * b;
        if (edge <= 0) continue;
        // Part of an offset oval under a soft pad-shaped envelope: broken, curved ridges.
        const curve = Math.hypot(0.75 * (a + 0.45), b + 1.25 + 0.15 * fold);
        const wear = 0.60 + 0.40 * noise(u, v, 23, index + 4);
        value += edge * edge * (0.14 * wear * Math.sin(tau * (5.6 * curve + 0.28 * fold)) - 0.46);
      }
      field[y * width + x] = value * Math.min(1, Math.sin(Math.PI * v) * 5);
    }
  }
  const at = (x: number, y: number) => field[((y + height) % height) * width + ((x + width) % width)];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = at(x - 1, y) - at(x + 1, y);
      const dy = at(x, y - 1) - at(x, y + 1);
      const length = Math.hypot(dx, dy, 1);
      const k = (y * width + x) * 4;
      pixels[k] = Math.round((1 + dx / length) * 127.5);
      pixels[k + 1] = Math.round((1 + dy / length) * 127.5);
      pixels[k + 2] = Math.round((1 + 1 / length) * 127.5);
      pixels[k + 3] = 255;
    }
  }
  const map = new DataTexture(pixels, width, height);
  map.wrapS = RepeatWrapping;
  map.magFilter = LinearFilter;
  map.minFilter = LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  map.needsUpdate = true;
  normalMaps.set(index, map);
  return map;
}

type GeometryProps = {shape?: ClayShape; seed?: number; detail?: ClayDetail};
type MaterialProps = {
  color: ColorRepresentation; roughness?: number; relief?: number; seed?: number; vertexColors?: boolean;
};

export function ClayGeometry({shape = 'blob', seed = 0, detail}: GeometryProps) {
  const inherited = useContext(ClayDetailContext);
  return <primitive object={getClayGeometry(shape, seed, detail ?? inherited)} attach="geometry" />;
}

export function ClayMaterial({color, roughness = 0.8, relief = 1, seed = 0, vertexColors = false}: MaterialProps) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={0}
    vertexColors={vertexColors} normalMap={relief > 0 ? clayNormalMap(seed) : null}
    normalScale={[relief, relief]} />;
}

export type ClayPieceProps = GeometryProps & MaterialProps
  & Omit<ThreeElements['mesh'], 'children' | 'geometry' | 'material' | 'color' | 'scale'>
  & {size?: Vector3Tuple; scale?: number | Vector3Tuple};

/** size sets nominal full dimensions and scale applies an additional pose transform. */
export function ClayPiece({
  shape, seed, detail, color, roughness, relief, vertexColors = true,
  size = [1, 1, 1], scale = 1, ...mesh
}: ClayPieceProps) {
  const factor: Vector3Tuple = typeof scale === 'number' ? [scale, scale, scale] : scale;
  return <mesh castShadow receiveShadow {...mesh} scale={[size[0] * factor[0], size[1] * factor[1], size[2] * factor[2]]}>
    <ClayGeometry shape={shape} seed={seed} detail={detail} />
    <ClayMaterial color={color} seed={seed} roughness={roughness} relief={relief} vertexColors={vertexColors} />
  </mesh>;
}
