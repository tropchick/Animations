import {intensityPresets, type IntensityLevel} from '../../hyper-motion-examples/timeline';

const toyboxHyperLevels = {
  'Toybox Calm': 'Minimal',
  'Toybox Dynamic': 'Dynamic',
  'Toybox Hyper': 'Hyper',
  'Toybox Ultra': 'Ultra',
  'Toybox Climax': 'Climax',
} as const satisfies Record<string, IntensityLevel>;

export type ToyboxHyperPreset = keyof typeof toyboxHyperLevels;
export const DEFAULT_TOYBOX_HYPER: ToyboxHyperPreset = 'Toybox Hyper';

export function getToyboxHyperPreset(preset: ToyboxHyperPreset = DEFAULT_TOYBOX_HYPER) {
  const level = toyboxHyperLevels[preset];
  const intensity = intensityPresets[level];
  return {
    level,
    ...intensity,
    camera: Math.min(.78, intensity.camera),
    particles: Math.min(.86, intensity.particles),
  };
}
