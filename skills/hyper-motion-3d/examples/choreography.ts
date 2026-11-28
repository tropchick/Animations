import {clamp, lerp, smoothstep, type Seed, type Vec3} from './math';
import type {CameraShot} from './camera';
import type {ReactiveHudCue} from './reactive-hud';
import type {IntensityLevel, Quality} from './timeline';
import type {WorldReactionEvent, WorldState} from './world-reactions';

const laneChannels = {
  body: 'deformation', world: 'environment', vfx: 'particles', light: 'environment',
  camera: 'camera', hud: 'hud', audio: 'audio', edit: 'transitions',
} as const;

export type Lane = keyof typeof laneChannels;
export type ChoreographyIntensity = Readonly<Record<(typeof laneChannels)[Lane], number>>;
export const choreographyLevels: Readonly<Record<IntensityLevel, ChoreographyIntensity>> = {
  Minimal: {camera: 0.22, environment: 0.32, particles: 0.22, deformation: 0.34, hud: 0.29, transitions: 0.24, audio: 0.27},
  Dynamic: {camera: 0.55, environment: 0.65, particles: 0.48, deformation: 0.62, hud: 0.51, transitions: 0.52, audio: 0.50},
  Hyper: {camera: 0.82, environment: 0.92, particles: 0.84, deformation: 0.90, hud: 0.80, transitions: 0.83, audio: 0.76},
  Ultra: {camera: 0.91, environment: 0.98, particles: 0.96, deformation: 0.98, hud: 0.89, transitions: 0.90, audio: 0.85},
  Climax: {camera: 0.97, environment: 1, particles: 1, deformation: 1, hud: 0.95, transitions: 0.96, audio: 0.92},
};

type Window = readonly [start: number, peak: number, end: number, gain?: number];
type Recipe = Readonly<Partial<Record<Lane, Window>>>;
/** Offset windows in 30 FPS authoring units. Scene cues scale them to actual FPS and pace. */
export const choreographyRecipes = {
  'layered-reveal': {body: [-14, 3, 28], world: [2, 13, 49], vfx: [-3, 6, 39], light: [-6, 5, 50], camera: [-10, 5, 32], hud: [2, 10, 44], audio: [0, 0, 14]},
  'elastic-transformation': {body: [-17, 2, 43], world: [2, 11, 38, 0.65], vfx: [-2, 5, 27], light: [1, 6, 32], camera: [-8, 4, 30], audio: [0, 0, 14]},
  'energy-build-up': {body: [-29, -5, 20], world: [-12, 9, 46], vfx: [-27, 1, 48], light: [-30, 3, 57], camera: [-24, 1, 44], hud: [-12, 4, 44], audio: [0, 0, 25]},
  'world-reaction-sequence': {body: [-13, 0, 22], world: [1, 22, 80], vfx: [-2, 5, 51], light: [2, 17, 69], camera: [-9, 15, 51], hud: [7, 20, 58], audio: [0, 0, 20]},
  'scale-reveal': {body: [-9, 0, 18], world: [0, 25, 73], vfx: [2, 18, 60], light: [0, 22, 60], camera: [-17, 20, 58], edit: [-10, 0, 23], hud: [12, 26, 64], audio: [0, 0, 28]},
  'counter-level-up': {body: [-9, 0, 23], world: [1, 12, 38], vfx: [0, 4, 25, 0.77], light: [0, 6, 28], camera: [-7, 3, 23, 0.55], hud: [0, 6, 47], audio: [0, 0, 12]},
  'geometric-assembly': {body: [-22, 1, 40], world: [3, 17, 51], vfx: [-25, -4, 35], light: [-11, 4, 45], camera: [-18, 2, 35], hud: [4, 13, 40], audio: [0, 0, 18]},
  'object-transformation': {body: [-16, 3, 46], world: [4, 15, 56], vfx: [-5, 7, 43], light: [-3, 9, 53], camera: [-10, 8, 42], hud: [5, 16, 55], audio: [0, 0, 18]},
  'cinematic-focus-shift': {body: [-8, 3, 24, 0.6], world: [-9, 7, 50, 0.45], vfx: [0, 7, 35, 0.45], light: [-8, 8, 42], camera: [-18, 2, 39], edit: [-9, 0, 16], audio: [0, 0, 13, 0.55]},
  'comedic-reaction': {body: [-13, 2, 35], world: [3, 10, 37, 0.6], vfx: [0, 4, 26, 0.8], light: [1, 6, 39, 0.65], camera: [-4, 2, 21, 0.65], hud: [4, 12, 52, 0.74], audio: [0, 0, 18]},
  'environmental-ripple': {body: [-8, 0, 17], world: [1, 20, 66], vfx: [0, 12, 54], light: [1, 15, 60], camera: [-9, 13, 43], audio: [0, 0, 24]},
  'material-change': {body: [-10, 2, 29], world: [0, 16, 58], vfx: [0, 8, 42], light: [0, 12, 52], camera: [-7, 9, 39, 0.62], hud: [5, 17, 46], audio: [0, 0, 19]},
  'particle-cascade': {body: [-9, 0, 23], world: [1, 17, 62], vfx: [0, 14, 56], light: [2, 15, 53], camera: [-7, 12, 45], audio: [0, 0, 24]},
  'stylized-impact': {body: [-14, 0, 38], world: [1, 12, 56], vfx: [0, 0, 37], light: [0, 3, 36], camera: [-5, 1, 23], hud: [2, 9, 40], audio: [0, 0, 15], edit: [-2, 0, 8]},
  'continuous-scale-journey': {body: [-19, 3, 38], world: [0, 41, 104], vfx: [-6, 33, 82], light: [-7, 36, 90], camera: [-23, 27, 85], edit: [-10, 0, 45], hud: [16, 38, 88], audio: [0, 0, 30]},
} as const satisfies Readonly<Record<string, Recipe>>;

export type RecipeName = keyof typeof choreographyRecipes;
export type CuePalette = Readonly<{color: string; accent: string}>;
export type CueHud = ReactiveHudCue;
export type CueAudio = Readonly<{key: string; gain?: number}>;
export type CueReaction = Omit<WorldReactionEvent, 'id' | 'frame' | 'origin'>;
type CueLanes = Partial<Record<Lane, Window | false>>;
export type ChoreographyCue = Readonly<{
  id: string; at: number; subject: string; recipe: RecipeName;
  origin: Vec3; direction: Vec3; palette: CuePalette;
  size: number; strength: number; pace: number; priority: number; particles: number;
  layers?: Readonly<CueLanes>; state?: Readonly<Record<string, unknown>>; hud?: CueHud; audio?: CueAudio;
  reaction?: CueReaction;
  /** Opt out for cues that support a beat, such as a brief atmosphere or camera accent. */
  meaningful?: boolean;
}>;
export type DirectedShot = Readonly<{
  from: number; to: number; focus: string; camera: string;
  scale?: string; transition?: string; quietReason?: string;
}>;
type IntensityKey = Readonly<{frame: number; values: ChoreographyIntensity}>;
type CueTiming = Readonly<{cue: ChoreographyCue; layers: CueLanes; start: number; end: number}>;
export type VoiceLine = Readonly<{from: number; to: number; text: string}>;
export type PoseKey = Readonly<{frame: number; position: Vec3; rotation?: Vec3; scale?: Vec3; ease?: 'linear' | 'smooth'}>;
export type PoseTrack = Readonly<{subject: string; keys: readonly PoseKey[]}>;
export type Choreography = Readonly<{
  fps: number; durationInFrames: number; cues: readonly ChoreographyCue[];
  shots: readonly DirectedShot[]; timings: readonly CueTiming[]; intensity: readonly IntensityKey[];
  voice: readonly VoiceLine[]; poseTracks: readonly PoseTrack[]; cameraTrack: readonly CameraShot[];
}>;

const paletteDefault: CuePalette = {color: '#58cdb9', accent: '#ffc674'};
const laneNames = Object.keys(laneChannels) as Lane[];
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const vec = (value: unknown): value is Vec3 => Array.isArray(value) && value.length === 3 && value.every(finite);
const isLevel = (value: unknown): value is IntensityLevel =>
  isString(value) && Object.hasOwn(choreographyLevels, value);
const isRecipe = (value: unknown): value is RecipeName =>
  isString(value) && Object.hasOwn(choreographyRecipes, value);
const rounded = (value: unknown, field: string, min: number, max: number) => {
  if (!finite(value) || !Number.isInteger(value) || value < min || value > max) throw new RangeError(field);
  return value;
};
const numberInRange = (value: unknown, fallback: number, field: string, min: number, max: number) => {
  if (value === undefined) return fallback;
  if (!finite(value) || value < min || value > max) throw new RangeError(field);
  return value;
};
const point = (value: unknown, field: string): Vec3 => {
  if (!vec(value)) throw new TypeError(field);
  return [value[0], value[1], value[2]];
};
const requiredText = (value: unknown, field: string) => {
  if (!isString(value)) throw new TypeError(field);
  return value;
};
function choice<const T extends string>(value: unknown, values: readonly T[], field: string): T | undefined {
  if (value === undefined) return undefined;
  const match = values.find((item) => item === value);
  if (match === undefined) throw new TypeError(field);
  return match;
}

function readReaction(value: unknown, id: string): CueReaction | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) throw new TypeError(`${id}.reaction`);
  const {targets, channels, persist} = value;
  if (targets !== undefined && (!Array.isArray(targets) || !targets.every(isString))) {
    throw new TypeError(`${id}.reaction.targets`);
  }
  if (channels !== undefined && (!isRecord(channels) || !Object.values(channels).every(finite))) {
    throw new TypeError(`${id}.reaction.channels`);
  }
  if (persist !== undefined && (!isRecord(persist) || !Object.values(persist).every((item) =>
    item === null || typeof item === 'boolean' || typeof item === 'string' || finite(item)))) {
    throw new TypeError(`${id}.reaction.persist`);
  }
  const timing = (key: string, min = 0) => value[key] === undefined ? undefined :
    numberInRange(value[key], 0, `${id}.reaction.${key}`, min, Number.MAX_SAFE_INTEGER);
  return {
    targets: targets === undefined ? undefined : [...targets],
    channels: channels === undefined ? undefined : {...channels} as Record<string, number>,
    persist: persist === undefined ? undefined : {...persist} as WorldState,
    speed: timing('speed', Number.MIN_VALUE), radius: timing('radius'), attack: timing('attack'),
    hold: timing('hold'), decay: timing('decay'), transitionFrames: timing('transitionFrames'),
    falloff: choice(value.falloff, ['linear', 'smooth', 'none'], `${id}.reaction.falloff`),
    commit: choice(value.commit, ['arrival', 'peak', 'settled'], `${id}.reaction.commit`),
  };
}

function readLayers(value: unknown, id: string): CueLanes | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) throw new TypeError(`${id}.layers`);
  const layers: CueLanes = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!Object.hasOwn(laneChannels, key)) throw new RangeError(`${id}.layers.${key}`);
    const lane = key as Lane;
    if (raw === false) {
      layers[lane] = false;
      continue;
    }
    if (!Array.isArray(raw) || ![3, 4].includes(raw.length) || !raw.every(finite) ||
      raw[0] > raw[1] || raw[1] >= raw[2] || (raw[3] !== undefined && (raw[3] < 0 || raw[3] > 2))) {
      throw new RangeError(`${id}.layers.${key}: expected [start, peak, end, gain?]`);
    }
    layers[lane] = [raw[0], raw[1], raw[2], raw[3]];
  }
  return layers;
}

function readCue(value: unknown, duration: number): ChoreographyCue {
  if (!isRecord(value)) throw new TypeError('Expected an event object');
  const {id, subject, recipe, at, origin, direction, palette, size, strength, pace, priority, particles,
    layers, state, hud, audio, meaningful, reaction} = value;
  const label = requiredText(id, 'events.id');
  if (!isRecipe(recipe)) throw new TypeError(`${label}.recipe`);
  if (palette !== undefined && (!isRecord(palette) || !isString(palette.color) || !isString(palette.accent))) {
    throw new TypeError(`${label}.palette`);
  }
  if (state !== undefined && !isRecord(state)) throw new TypeError(`${label}.state`);
  if (hud !== undefined && !isRecord(hud)) throw new TypeError(`${label}.hud`);
  if (audio !== undefined && (!isRecord(audio) || !isString(audio.key))) throw new TypeError(`${label}.audio`);
  if (meaningful !== undefined && typeof meaningful !== 'boolean') throw new TypeError(`${label}.meaningful`);
  const audioGain = audio === undefined ? undefined :
    numberInRange(audio.gain, 1, `${label}.audio.gain`, 0, 1);
  return {
    id: label, subject: requiredText(subject, `${label}.subject`), recipe,
    at: rounded(at, `${label}.at`, 0, duration - 1), origin: point(origin, `${label}.origin`),
    direction: direction === undefined ? [0, 1, 0] : point(direction, `${label}.direction`),
    palette: (palette as CuePalette | undefined) ?? paletteDefault,
    size: numberInRange(size, 1, `${label}.size`, 0.001, 1_000_000),
    strength: numberInRange(strength, 1, `${label}.strength`, 0, 2),
    pace: numberInRange(pace, 1, `${label}.pace`, 0.1, 16),
    priority: numberInRange(priority, 0, `${label}.priority`, -100, 100),
    particles: particles === undefined ? 48 : rounded(particles, `${label}.particles`, 0, 1000),
    layers: readLayers(layers, label), state, hud: hud as CueHud | undefined, meaningful,
    audio: audio === undefined ? undefined : {key: audio.key as string, gain: audioGain},
    reaction: readReaction(reaction, label),
  };
}

const gainNames = Object.keys(choreographyLevels.Hyper) as (keyof ChoreographyIntensity)[];
const buildGains = (read: (key: keyof ChoreographyIntensity) => number): ChoreographyIntensity =>
  Object.fromEntries(gainNames.map((key) => [key, read(key)])) as ChoreographyIntensity;

function readIntensity(value: unknown, duration: number) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new TypeError('intensity');
  const seen = new Set<number>();
  return value.map((key): IntensityKey => {
    if (!isRecord(key) || !isLevel(key.level) || (key.channels !== undefined && !isRecord(key.channels))) {
      throw new TypeError('intensity key');
    }
    const frame = rounded(key.frame, 'intensity.frame', 0, duration - 1);
    if (seen.has(frame)) throw new RangeError(`Duplicate intensity frame: ${frame}`);
    seen.add(frame);
    const base = choreographyLevels[key.level];
    return {frame, values: buildGains((name) => numberInRange(
      isRecord(key.channels) ? key.channels[name] : undefined, base[name], `intensity.channels.${name}`, 0, 1,
    ))};
  }).sort((a, b) => a.frame - b.frame);
}

function readShots(value: unknown, duration: number): DirectedShot[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new TypeError('shots');
  return value.map((shot): DirectedShot => {
    if (!isRecord(shot)) throw new TypeError('shot');
    const from = rounded(shot.from, 'shot.from', 0, duration - 1);
    return {
      from, to: rounded(shot.to, 'shot.to', from + 1, duration),
      focus: requiredText(shot.focus, 'shot.focus'), camera: requiredText(shot.camera, 'shot.camera'),
      scale: isString(shot.scale) ? shot.scale : undefined,
      transition: isString(shot.transition) ? shot.transition : undefined,
      quietReason: isString(shot.quietReason) ? shot.quietReason : undefined,
    };
  }).sort((a, b) => a.from - b.from);
}

function list(value: unknown, field: string): readonly unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new TypeError(field);
  return value;
}

function sortedKeys<T extends {frame: number}>(keys: T[], field: string): T[] {
  keys.sort((a, b) => a.frame - b.frame);
  if (keys.some((key, index) => keys[index - 1]?.frame === key.frame)) throw new RangeError(`Duplicate ${field} frame`);
  return keys;
}

function readVoice(value: unknown, duration: number): VoiceLine[] {
  return list(value, 'voice').map((row): VoiceLine => {
    if (!isRecord(row)) throw new TypeError('voice line');
    const from = rounded(row.from, 'voice.from', 0, duration - 1);
    return {from, to: rounded(row.to, 'voice.to', from + 1, duration), text: requiredText(row.text, 'voice.text')};
  }).sort((a, b) => a.from - b.from);
}

function readPoses(value: unknown, duration: number): PoseTrack[] {
  const subjects = new Set<string>();
  return list(value, 'poseTracks').map((row) => {
    if (!isRecord(row)) throw new TypeError('pose track');
    const subject = requiredText(row.subject, 'poseTracks.subject');
    if (subjects.has(subject)) throw new RangeError(`Duplicate pose subject: ${subject}`);
    subjects.add(subject);
    const keys = sortedKeys(list(row.keys, 'pose.keys').map((key): PoseKey => {
      if (!isRecord(key)) throw new TypeError('pose key');
      return {
        frame: rounded(key.frame, 'pose.frame', 0, duration - 1),
        position: point(key.position, 'pose.position'),
        rotation: key.rotation === undefined ? undefined : point(key.rotation, 'pose.rotation'),
        scale: key.scale === undefined ? undefined : point(key.scale, 'pose.scale'),
        ease: choice(key.ease, ['linear', 'smooth'], 'pose.ease'),
      };
    }), 'pose');
    if (keys.length === 0) throw new RangeError(`No poses for ${subject}`);
    return {subject, keys};
  });
}

function readCamera(value: unknown, duration: number): CameraShot[] {
  return sortedKeys(list(value, 'cameraTrack').map((key): CameraShot => {
    if (!isRecord(key)) throw new TypeError('camera key');
    if (key.cut !== undefined && typeof key.cut !== 'boolean') throw new TypeError('camera.cut');
    if (key.dollyZoom !== undefined && typeof key.dollyZoom !== 'boolean') throw new TypeError('camera.dollyZoom');
    const focus = key.focus === undefined || finite(key.focus) ? key.focus : point(key.focus, 'camera.focus');
    return {
      frame: rounded(key.frame, 'camera.frame', 0, duration - 1),
      position: point(key.position, 'camera.position'), target: point(key.target, 'camera.target'),
      fov: key.fov === undefined ? undefined : numberInRange(key.fov, 40, 'camera.fov', 1, 179),
      roll: key.roll === undefined ? undefined : numberInRange(key.roll, 0, 'camera.roll', -360, 360),
      ease: choice(key.ease, ['linear', 'smooth', 'spline'], 'camera.ease'),
      cut: key.cut, dollyZoom: key.dollyZoom, focus,
      orbit: key.orbit === true ? true : choice(key.orbit, ['clockwise', 'counterclockwise'], 'camera.orbit'),
    };
  }), 'camera');
}

/** Independent transform sample. Rotation is authored in unwrapped radians. */
export function sampleAuthoredPose(track: PoseTrack, frame: number) {
  const next = track.keys.findIndex((key) => key.frame > frame);
  const left = track.keys[next < 0 ? track.keys.length - 1 : Math.max(0, next - 1)];
  const right = track.keys[next] ?? left;
  const progress = clamp((frame - left.frame) / Math.max(1, right.frame - left.frame));
  const p = right.ease === 'linear' ? progress : smoothstep(progress);
  const blend = (a: Vec3, b: Vec3): Vec3 => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
  return {
    position: blend(left.position, right.position),
    rotation: blend(left.rotation ?? [0, 0, 0], right.rotation ?? [0, 0, 0]),
    scale: blend(left.scale ?? [1, 1, 1], right.scale ?? [1, 1, 1]),
  };
}

/** Projection of the same cue IDs and contact frames into the persistent world sampler. */
export function worldEventsFromPlan(plan: Choreography): WorldReactionEvent[] {
  return plan.cues.flatMap(({reaction, id, at, origin}) => reaction ? [{...reaction, id, frame: at, origin}] : []);
}

export function compileChoreography(raw: unknown): Choreography {
  if (!isRecord(raw) || !Array.isArray(raw.events)) throw new TypeError('Expected a choreography plan with events');
  const {fps, durationInFrames} = raw;
  if (!finite(fps) || fps <= 0) throw new RangeError('fps');
  const duration = rounded(durationInFrames, 'durationInFrames', 1, Number.MAX_SAFE_INTEGER);
  const ids = new Set<string>();
  const cues = raw.events.map((cue) => {
    const item = readCue(cue, duration);
    if (ids.has(item.id)) throw new RangeError(`Duplicate event id: ${item.id}`);
    ids.add(item.id);
    return item;
  }).sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));
  return {
    fps, durationInFrames: duration, cues, shots: readShots(raw.shots, duration),
    voice: readVoice(raw.voice, duration), poseTracks: readPoses(raw.poseTracks, duration),
    cameraTrack: readCamera(raw.cameraTrack, duration),
    timings: cues.map((cue) => {
      const layers = {...choreographyRecipes[cue.recipe], ...cue.layers};
      const windows = Object.values(layers).filter((window): window is Window => !!window);
      return {
        cue, layers,
        start: Math.min(...windows.map(([from]) => from)),
        end: Math.max(...windows.map(([, , to]) => to)),
      };
    }),
    intensity: readIntensity(raw.intensity, duration),
  };
}

function sampleIntensity(frame: number, intensity: readonly IntensityKey[], base: IntensityLevel): ChoreographyIntensity {
  if (intensity.length === 0) return choreographyLevels[base];
  const next = intensity.findIndex((key) => key.frame > frame);
  if (next < 0) return intensity[intensity.length - 1].values;
  const left = intensity[next - 1] ?? {frame: 0, values: choreographyLevels[base]};
  const right = intensity[next];
  const p = smoothstep((frame - left.frame) / Math.max(1, right.frame - left.frame));
  return buildGains((name) => lerp(left.values[name], right.values[name], p));
}

function envelope(age: number, [start, peak, end, gain = 1]: Window): number {
  if (age < start || age >= end) return 0;
  return gain * (age < peak ? smoothstep((age - start) / (peak - start)) : 1 - smoothstep((age - peak) / (end - peak)));
}

export type CuePhase = Readonly<{anticipation: number; strike: number; recoil: number; settle: number}>;
export function sampleCuePhase(age: number): CuePhase {
  return {
    anticipation: envelope(age, [-18, -3, 0]),
    strike: envelope(age, [0, 0, 12]),
    recoil: envelope(age, [1, 8, 31]),
    settle: smoothstep((age - 3) / 42),
  };
}

export type ActiveCue = Readonly<{
  cue: ChoreographyCue; seed: string; age: number; phase: CuePhase;
  lanes: Readonly<Record<Lane, number>>; particleBudget: number;
}>;
export const choreographyBudgets = {
  draft: {particles: 128, spatialCues: 3},
  final: {particles: 400, spatialCues: 5},
} as const;

/** Always sample pose, world, edit and sound. Only optional spatial cosmetics compete for capacity. */
export function sampleChoreography(plan: Choreography, frame: number, {
  quality = 'final', seed = 'hyper-motion', level = 'Hyper',
  budgets = choreographyBudgets[quality],
}: {quality?: Quality; seed?: Seed; level?: IntensityLevel; budgets?: {particles: number; spatialCues: number}} = {}) {
  const intensity = sampleIntensity(frame, plan.intensity, level);
  const active: ActiveCue[] = [];
  for (const {cue, layers, start, end} of plan.timings) {
    const age = frame - cue.at;
    const age30 = age * 30 / (plan.fps * cue.pace);
    if (age30 < start || age30 >= end || cue.strength === 0) continue;
    const sample = Object.fromEntries(laneNames.map((lane) => {
      const shape = layers[lane];
      return [lane, shape ? clamp(envelope(age30, shape) * intensity[laneChannels[lane]] * cue.strength) : 0];
    })) as Record<Lane, number>;
    if (!Object.values(sample).some((value) => value > 0)) continue;
    active.push({cue, seed: `${seed}/${cue.id}`, lanes: sample, phase: sampleCuePhase(age30), age, particleBudget: 0});
  }
  let particles = Math.max(0, Math.floor(budgets.particles));
  const slots = Math.max(0, Math.floor(budgets.spatialCues));
  const effects = active.filter((entry) => entry.lanes.vfx > 0)
    .sort((a, b) => b.cue.priority - a.cue.priority || a.cue.at - b.cue.at ||
      (a.cue.id < b.cue.id ? -1 : 1));
  const allocations = new Map<string, number>();
  effects.slice(0, slots).forEach(({cue}) => {
    const budget = Math.min(particles, Math.floor(cue.particles * intensity.particles));
    allocations.set(cue.id, budget);
    particles -= budget;
  });
  return {
    frame, fps: plan.fps, intensity,
    events: active.map((entry): ActiveCue => ({
      ...entry,
      lanes: allocations.has(entry.cue.id) || entry.lanes.vfx === 0 ?
        entry.lanes : {...entry.lanes, vfx: 0},
      particleBudget: allocations.get(entry.cue.id) ?? 0,
    })),
  };
}

export type DensityGap = Readonly<{from: number; to: number; seconds: number; explained: boolean}>;
/** Flag stretches for direction review. A camera event never substitutes for a story change. */
export function inspectVisualDensity(plan: Choreography, gapSeconds = 3): DensityGap[] {
  const meaningful = plan.timings.filter(({cue, layers}) => cue.meaningful !== false && cue.strength > 0 &&
    (layers.body || layers.world || cue.state || cue.reaction?.persist || cue.hud?.value !== undefined || cue.hud?.stage));
  const frames = [0, ...meaningful.map(({cue}) => cue.at), plan.durationInFrames];
  return frames.slice(1).flatMap((to, i) => {
    const from = frames[i];
    const seconds = (to - from) / plan.fps;
    return seconds > gapSeconds ?
      [{from, to, seconds, explained: plan.shots.some((shot) => shot.from <= from && shot.to >= to && !!shot.quietReason)}] :
      [];
  });
}
