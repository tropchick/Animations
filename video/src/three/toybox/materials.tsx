import {
  Color, DataTexture, LinearFilter, LinearMipmapLinearFilter, MeshPhysicalMaterial,
  MeshStandardMaterial, RepeatWrapping, type MeshPhysicalMaterialParameters,
  type MeshStandardMaterialParameters,
} from 'three';
import {toyboxQuality, type ToyboxQuality} from './theme';

type Grain = 'peel' | 'wood' | 'brushed' | 'weave' | 'fiber' | 'chip' | 'grit' | 'ripple' | 'crumb';
type Surface = {
  color: string;
  roughness: number;
  metalness?: number;
  grain?: Grain;
  relief?: number;
  tintedGrain?: boolean;
  coat?: number;
  opacity?: number;
  glow?: number;
};

export const toyMaterials = {
  mattePlastic: {color: '#E08E63', roughness: 0.69, grain: 'peel', relief: 0.006},
  glossyPlastic: {color: '#CC6356', roughness: 0.31, coat: 0.34},
  rubber: {color: '#394857', roughness: 0.88, grain: 'grit', relief: 0.009},
  silicone: {color: '#63B1A8', roughness: 0.53, grain: 'peel', relief: 0.002, coat: 0.13},
  paintedWood: {color: '#AF8670', roughness: 0.73, grain: 'wood', relief: 0.010},
  wood: {color: '#AB754A', roughness: 0.78, grain: 'wood', relief: 0.026, tintedGrain: true},
  metal: {color: '#939FAB', roughness: 0.51, metalness: 0.7, grain: 'brushed', relief: 0.003},
  polishedMetal: {color: '#B8B6B2', roughness: 0.27, metalness: 0.84},
  glass: {color: '#B7E5EE', roughness: 0.19, opacity: 0.46, coat: 0.55},
  translucentPlastic: {color: '#EAA85A', roughness: 0.41, opacity: 0.69, grain: 'peel', relief: 0.003},
  fabric: {color: '#868599', roughness: 0.95, grain: 'weave', relief: 0.019, tintedGrain: true},
  paper: {color: '#F1DCC7', roughness: 0.89, grain: 'fiber', relief: 0.005},
  cardboard: {color: '#AF8157', roughness: 0.96, grain: 'fiber', relief: 0.023},
  asphalt: {color: '#4B5B66', roughness: 0.96, grain: 'chip', relief: 0.024, tintedGrain: true},
  concrete: {color: '#BDB8AC', roughness: 0.91, grain: 'chip', relief: 0.015},
  grass: {color: '#79A16C', roughness: 0.9, grain: 'crumb', relief: 0.018},
  sand: {color: '#D4B288', roughness: 0.97, grain: 'grit', relief: 0.015},
  stone: {color: '#848D99', roughness: 0.85, grain: 'chip', relief: 0.019},
  snow: {color: '#DEEBF0', roughness: 0.86, grain: 'grit', relief: 0.009},
  water: {color: '#55AABF', roughness: 0.28, opacity: 0.85, grain: 'ripple', relief: 0.020, coat: 0.35},
  food: {color: '#CB8C52', roughness: 0.65, grain: 'crumb', relief: 0.023, tintedGrain: true},
  emissive: {color: '#FFD293', roughness: 0.56, glow: 0.55},
} as const satisfies Record<string, Surface>;

export type ToyMaterialKind = keyof typeof toyMaterials;

const modes = new Map<Grain, DataTexture>();
const instances = new Map<string, MeshStandardMaterial>();

function hash(x: number, y: number) {
  const value = Math.imul((x + 1) ^ 0x91a1, Math.imul(y + 37, 0x119de1f3));
  const mixed = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return ((mixed ^ (mixed >>> 16)) >>> 0) / 4294967295;
}

function sample(grain: Grain, x: number, y: number, size: number) {
  const u = Math.PI * 2 * x / size;
  const v = Math.PI * 2 * y / size;
  const fine = 2 * hash(x, y) - 1;
  const fleck = 2 * hash(x >> 1, y >> 1) - 1;
  switch (grain) {
    case 'peel': return 0.38 * fine + 0.32 * fleck;
    case 'wood': return 0.12 * fine + 0.50 * Math.sin(8 * v + Math.sin(u) * 1.45 + 0.8 * Math.sin(2 * u - v)) + 0.22 * Math.sin(17 * v + Math.sin(3 * u));
    case 'brushed': return 0.15 * fine + 0.66 * Math.sin(21 * v + 0.6 * Math.sin(u));
    case 'weave': return 0.08 * fine + 0.63 * Math.cos(16 * u) * Math.cos(16 * v) + 0.18 * Math.sin(8 * (u + v));
    case 'fiber': return 0.25 * fine + 0.25 * Math.sin(14 * u + 0.4 * Math.sin(2 * v)) + 0.22 * fleck;
    case 'chip': return 0.37 * fine + 0.53 * fleck;
    case 'grit': return 0.81 * fine + 0.15 * fleck;
    case 'ripple': return 0.58 * Math.sin(3 * v + 0.67 * Math.sin(2 * u)) + 0.32 * Math.sin(2 * u - 2 * v);
    case 'crumb': return 0.5 * Math.sin(9 * v + 4 * Math.sin(4 * u)) * Math.cos(7 * u) + 0.4 * fleck;
  }
}

function microTexture(grain: Grain) {
  let texture = modes.get(grain);
  if (texture) return texture;

  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const tone = Math.round(220 + 34 * sample(grain, x, y, size));
      data[i] = data[i + 1] = data[i + 2] = tone;
      data[i + 3] = 255;
    }
  }
  texture = new DataTexture(data, size, size);
  texture.name = `Toybox grain: ${grain}`;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  modes.set(grain, texture);
  return texture;
}

/**
 * Shared by kind, color, quality and a stable art-directed variant. Keep colors and variants discrete.
 * For animated uniforms or continuous color changes, clone once per object and dispose that clone.
 */
export function getToyMaterial(
  kind: ToyMaterialKind,
  color?: string,
  quality: ToyboxQuality = 'balanced',
  variant = 0,
): MeshStandardMaterial {
  const surface: Surface = toyMaterials[kind];
  const base = color ?? surface.color;
  const key = `${kind}/${base}/${quality}/${variant}`;
  let material = instances.get(key);
  if (material) return material;

  const budget = toyboxQuality[quality];
  const pigment = new Color(base);
  const tint = variant === 0 ? 0 : hash(variant, 37) - 0.5;
  pigment.offsetHSL(tint * 0.022, tint * 0.045, tint * 0.053);
  const micro = surface.grain && budget.microTextures ? microTexture(surface.grain) : null;
  const settings: MeshStandardMaterialParameters = {
    name: `Toybox ${kind}`,
    color: pigment,
    roughness: Math.min(1, surface.roughness + tint * 0.07),
    metalness: surface.metalness ?? 0,
    map: surface.tintedGrain ? micro : null,
    roughnessMap: micro,
    bumpMap: micro,
    bumpScale: surface.relief ?? 0,
    ...(surface.opacity === undefined ? {} : {
      opacity: surface.opacity,
      transparent: true,
      depthWrite: false,
    }),
    ...(surface.glow === undefined ? {} : {emissive: pigment, emissiveIntensity: surface.glow}),
  };

  if (surface.coat && quality !== 'preview') {
    const coated: MeshPhysicalMaterialParameters = {
      ...settings,
      clearcoat: surface.coat,
      clearcoatRoughness: surface.roughness * 0.7,
    };
    material = new MeshPhysicalMaterial(coated);
  } else {
    material = new MeshStandardMaterial(settings);
  }
  instances.set(key, material);
  return material;
}

export function ToyMaterial({
  kind = 'mattePlastic',
  color,
  quality = 'balanced',
  variant,
}: {
  kind?: ToyMaterialKind;
  color?: string;
  quality?: ToyboxQuality;
  variant?: number;
}) {
  return <primitive attach="material" object={getToyMaterial(kind, color, quality, variant)} dispose={null} />;
}
