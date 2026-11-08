import cues from './cues.json';

export const FPS = 30;
export const DURATION_S = cues.duration;
export type ShotCue = {name: string; from: number; to: number; clip: string; offset: number; rate: number; date: string};
export const SHOTS: ShotCue[] = cues.shots.map((s, i) => ({...s, to: i + 1 < cues.shots.length ? cues.shots[i + 1].from : cues.duration}));
export const shotAt = (v: number) => SHOTS.filter((s) => v >= s.from).pop() ?? SHOTS[0];
export const WORDS = cues.words as unknown as [number, number, string, number][];
export const POPUP = cues.popup;
export const FLASH = cues.flash;
// the evening clip is 7.93 s long; after it ends its last frame is held as a still
export const EVENING_END = SHOTS.find((s) => s.name === 'evening')!.from + 7.85;
