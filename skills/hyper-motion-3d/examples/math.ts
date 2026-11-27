export type Vec3 = readonly [number, number, number];
export type Seed = string | number;

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
export const smoothstep = (t: number) => {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
};
export const frameProgress = (frame: number, start: number, duration: number) =>
  clamp((frame - start) / Math.max(1, duration - 1));

/** One deterministic hash per sample. Seeking or changing iteration order does not affect it. */
export function sampleRandom(seed: Seed, index = 0): number {
  let h = 2166136261;
  for (const char of `${seed}:${index}`) {
    h = Math.imul(h ^ char.codePointAt(0)!, 16777619);
  }
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
  return ((h ^ (h >>> 15)) >>> 0) / 0x100000000;
}
