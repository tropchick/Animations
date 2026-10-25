import * as THREE from 'three';

// Textures drawn once on a canvas (clock digits, monitor timelines, painted words), cached by key.
const cache = new Map<string, THREE.CanvasTexture>();

export const canvasTexture = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
};
