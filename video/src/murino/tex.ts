import {useMemo} from 'react';
import {CanvasTexture, RepeatWrapping, SRGBColorSpace, Texture} from 'three';

// Canvas textures drawn once per key: facades, tiles, the lift panel, signs.
export const useTex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, key: string) =>
  useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    draw(cv.getContext('2d')!);
    const tx = new CanvasTexture(cv);
    tx.colorSpace = SRGBColorSpace;
    tx.anisotropy = 8;
    return tx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, key]);

// a repeating copy of a texture (each face of a building needs its own repeat)
export const tiled = (base: Texture, rx: number, ry: number) => {
  const t = base.clone();
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  return t;
};

// a seeded random, so every render draws the same stains and lit windows
export const seeded = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

export const FONT = "'Inter', Helvetica, Arial, sans-serif";
export const MONO_FONT = "'IBM Plex Mono', monospace";

// a sign plate: white enamel with dark letters, as on Soviet stairwells
export const drawPlate = (lines: string[], opts: {bg?: string; fg?: string; border?: string} = {}) => (c: CanvasRenderingContext2D) => {
  const {width: w, height: h} = c.canvas;
  c.fillStyle = opts.bg ?? '#e9e6dc';
  c.fillRect(0, 0, w, h);
  c.strokeStyle = opts.border ?? '#2a2f36';
  c.lineWidth = h * 0.05;
  c.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1);
  c.fillStyle = opts.fg ?? '#1f252c';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const n = lines.length;
  lines.forEach((l, i) => {
    const size = n === 1 ? h * 0.55 : h * (i === 0 ? 0.36 : 0.26);
    c.font = `800 ${size}px ${FONT}`;
    const y = n === 1 ? h * 0.54 : h * (0.36 + (i * 0.4) / (n - 1 || 1));
    c.fillText(l, w / 2, y, w * 0.9);
  });
};
