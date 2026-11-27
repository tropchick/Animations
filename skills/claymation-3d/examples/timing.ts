// A random-access integer hash. Namespaces (seeds) keep unrelated puppets independent.
export const seededRandom = (seed: number, index = 0): number => {
  let word = (seed | 0) ^ Math.imul(index | 0, 0x9e3779b1);
  word = Math.imul(word ^ (word >>> 16), 0x21f0aaad);
  word = Math.imul(word ^ (word >>> 15), 0x735a2d97);
  return ((word ^ (word >>> 15)) >>> 0) / 0x100000000;
};

export type MotionMode = 'smooth' | 'stop-motion';

export function stopMotionTiming(frame: number, fps: number, mode: MotionMode, poseRate = 12) {
  if (!(fps > 0 && poseRate > 0)) throw new RangeError('Frame rates must be positive');
  const rate = mode === 'smooth' ? fps : Math.min(fps, poseRate);
  // Bypass quantization for one pose per output frame, including fractional FPS.
  const exposure = rate === fps ? frame : Math.floor(frame * rate / fps);
  return {exposure, seconds: exposure / rate, cameraSeconds: frame / fps};
}

// Clamped easing with zero speed at either end.
export function easeBetween(time: number, start: number, end: number) {
  const u = Math.max(0, Math.min(1, (time - start) / (end - start)));
  return u * u * (3 - 2 * u);
}
