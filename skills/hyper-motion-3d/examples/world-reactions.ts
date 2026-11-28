import {clamp, lerp, sampleRandom, smoothstep, type Seed, type Vec3} from './math';

export type WorldValue = number | boolean | string | null;
export type WorldState = Readonly<Record<string, WorldValue>>;
export type ReactionChannels = Readonly<Partial<Record<string, number>>>;
export type WorldReactionEvent = Readonly<{
  id: string;
  frame: number;
  origin: Vec3 | string;
  /** World units per output frame. Omit to react simultaneously. */
  speed?: number;
  radius?: number;
  attack?: number;
  hold?: number;
  decay?: number;
  falloff?: 'linear' | 'smooth' | 'none';
  /** Limit the propagation to these registered receivers. */
  targets?: readonly string[];
  channels?: ReactionChannels;
  /** An authored patch that remains after the pulse, until another patch supersedes it. */
  persist?: WorldState;
  commit?: 'arrival' | 'peak' | 'settled';
  /** Numeric fields interpolate; symbolic fields switch when the transition finishes. */
  transitionFrames?: number;
}>;

export type WorldReaction = Readonly<{
  pulse: number;
  channels: ReactionChannels;
  state: WorldState;
  hits: readonly Readonly<{id: string; arrival: number; distance: number; weight: number}>[];
}>;

type Pulse = {
  id: string;
  arrival: number;
  distance: number;
  attenuation: number;
  attack: number;
  hold: number;
  decay: number;
  channels: ReactionChannels;
};
type Patch = {at: number; duration: number; id: string; values: WorldState};
type StateKey = {at: number; duration: number; from?: WorldValue; to: WorldValue};
type Receiver = {pulses: Pulse[]; patches: Patch[]; tracks: Map<string, StateKey[]>};

const idOrder = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const span = (value: number | undefined, fallback: number) => Math.max(0, value ?? fallback);
const finite = (value: number): boolean => Number.isFinite(value);
const envelope = (age: number, attack: number, hold: number, decay: number) => {
  if (age < 0) return 0;
  if (age < attack) return smoothstep(age / attack);
  if (age < attack + hold) return 1;
  if (age < attack + hold + decay) return 1 - smoothstep((age - attack - hold) / decay);
  return 0;
};

function stateAt(key: StateKey, frame: number): WorldValue | undefined {
  if (key.duration === 0 || frame >= key.at + key.duration) return key.to;
  return typeof key.from === 'number' && typeof key.to === 'number'
    ? lerp(key.from, key.to, smoothstep((frame - key.at) / key.duration))
    : key.from;
}

/** Compile immutable event data. Sample with output time so state persists across shots. */
export function compileWorldReaction({origins, initial = {}, events}: {
  origins: Readonly<Record<string, Vec3>>;
  initial?: Readonly<Record<string, WorldState>>;
  events: readonly WorldReactionEvent[];
}): (frame: number, objectId: string) => WorldReaction {
  const registered = Object.entries(origins);
  const positions = new Map(registered);
  const receivers = new Map<string, Receiver>();
  for (const [id, point] of registered) {
    if (!point.every(finite)) throw new RangeError(`Non-finite world position: ${id}`);
    receivers.set(id, {pulses: [], patches: [], tracks: new Map()});
  }
  for (const [id, state] of Object.entries(initial)) {
    const receiver = receivers.get(id);
    if (!receiver) throw new RangeError(`Unknown initial world object: ${id}`);
    for (const [key, value] of Object.entries(state)) {
      if (typeof value === 'number' && !finite(value)) throw new RangeError(`Non-finite state: ${id}/${key}`);
      receiver.tracks.set(key, [{at: -Infinity, duration: 0, to: value}]);
    }
  }

  const ids = new Set<string>();
  for (const event of events) {
    const {id, frame, origin, speed = Infinity, radius = Infinity, falloff = 'smooth',
      commit = 'arrival'} = event;
    if (!id || ids.has(id) || !finite(frame) || frame < 0 || !(speed > 0) || !(radius >= 0)) {
      throw new RangeError(`Invalid or repeated world event: ${id}`);
    }
    ids.add(id);
    const source = typeof origin === 'string' ? positions.get(origin) : origin;
    if (!source || !source.every(finite)) throw new RangeError(`Invalid world event origin: ${id}`);
    const [attack, hold, decay, duration] = [span(event.attack, 4), span(event.hold, 0),
      span(event.decay, 18), span(event.transitionFrames, 0)];
    const channels = {...event.channels};
    const values = event.persist ? {...event.persist} : undefined;
    if (![attack, hold, decay, duration].every(finite)
        || Object.values(channels).some((value) => value !== undefined && !finite(value))
        || Object.values(values ?? {}).some((value) => typeof value === 'number' && !finite(value))) {
      throw new RangeError(`Non-finite world event parameters: ${id}`);
    }
    const targets = event.targets === undefined ? positions.keys() : new Set(event.targets);
    for (const objectId of targets) {
      const point = positions.get(objectId);
      const receiver = receivers.get(objectId);
      if (!point || !receiver) throw new RangeError(`Unknown world reaction target: ${objectId}`);
      const distance = Math.hypot(point[0] - source[0], point[1] - source[1], point[2] - source[2]);
      if (distance > radius) continue;
      const arrival = frame + distance / speed;
      const p = radius > 0 ? clamp(distance / radius) : 0;
      const attenuation = falloff === 'none' ? 1 : 1 - (falloff === 'linear' ? p : smoothstep(p));
      if (attenuation > 0 && attack + hold + decay > 0) {
        receiver.pulses.push({id, arrival, distance, attenuation, attack, hold, decay, channels});
      }
      if (values) {
        const delay = commit === 'arrival' ? 0 : commit === 'peak' ? attack : attack + hold + decay;
        receiver.patches.push({at: arrival + delay, duration, id, values});
      }
    }
  }

  for (const receiver of receivers.values()) {
    receiver.pulses.sort((a, b) => a.arrival - b.arrival || idOrder(a.id, b.id));
    receiver.patches.sort((a, b) => a.at - b.at || idOrder(a.id, b.id));
    for (const patch of receiver.patches) {
      for (const [key, value] of Object.entries(patch.values)) {
        const track = receiver.tracks.get(key) ?? [];
        const previous = track.at(-1);
        track.push({at: patch.at, duration: patch.duration, to: value,
          from: previous ? stateAt(previous, patch.at) : undefined});
        receiver.tracks.set(key, track);
      }
    }
    receiver.patches.length = 0;
  }

  return (frame, objectId) => {
    const receiver = receivers.get(objectId);
    if (!receiver) throw new RangeError(`Unknown world reaction object: ${objectId}`);
    let pulse = 0;
    const levels = new Map<string, number>();
    const hits: Array<WorldReaction['hits'][number]> = [];
    for (const event of receiver.pulses) {
      if (event.arrival > frame) break;
      const weight = event.attenuation * envelope(frame - event.arrival, event.attack, event.hold, event.decay);
      if (weight === 0) continue;
      pulse = Math.max(pulse, weight);
      hits.push({id: event.id, arrival: event.arrival, distance: event.distance, weight});
      for (const [name, gain] of Object.entries(event.channels)) {
        if (gain !== undefined) levels.set(name, (levels.get(name) ?? 0) + gain * weight);
      }
    }
    const state = new Map<string, WorldValue>();
    for (const [name, track] of receiver.tracks) {
      let index = track.length - 1;
      while (index >= 0 && track[index].at > frame) index--;
      const value = index >= 0 ? stateAt(track[index], frame) : undefined;
      if (value !== undefined) state.set(name, value);
    }
    return {pulse, hits, state: Object.fromEntries(state),
      channels: Object.fromEntries([...levels].map(([name, gain]) => [name, clamp(gain, -1, 1)]))};
  };
}

export type ReactionMotionStyle = 'low-poly' | 'clay';
const responseStyles = {
  'low-poly': {lift: 0.2, tilt: 0.16, deform: 0.1, slide: 0.22},
  clay: {lift: 0.12, tilt: 0.23, deform: 0.25, slide: 0.14},
} as const;

/** Damped follow-through with a clean endpoint. Age and duration use the same units. */
export function elasticResponse(age: number, duration: number, cycles = 1.15, damping = 2.5) {
  if (age < 0 || age >= duration || duration <= 0) return 0;
  const p = age / duration;
  return Math.sin(p * Math.PI * 2 * cycles) * Math.exp(-p * damping) * (1 - smoothstep(p));
}

/** Local-space response applied after the authored pose. Supply dimensions via gain or parent scale. */
export function sampleReactionPose(channels: ReactionChannels, {style = 'low-poly', seed = 0,
  gain = 1, followThrough = 0}: {
  style?: ReactionMotionStyle;
  seed?: Seed;
  gain?: number;
  followThrough?: number;
} = {}) {
  const rig = responseStyles[style];
  const side = sampleRandom(seed, 0) < 0.5 ? -1 : 1;
  const follow = clamp(followThrough, -1, 1);
  const slide = (channels.offset ?? 0) * rig.slide * gain * side;
  const raise = ((channels.bounce ?? 0) + 0.45 * follow) * rig.lift * gain;
  const sway = ((channels.sway ?? 0) + 0.35 * follow) * rig.tilt * gain * side;
  const deform = (channels.stretch ?? 0) - (channels.squash ?? 0) + follow * 0.3;
  const vertical = 1 + clamp(deform * rig.deform * gain, -0.35, 0.45);
  const width = 1 / Math.sqrt(vertical);
  return {position: [slide, raise, 0] as const, rotation: [0, 0, sway] as const,
    scale: [width, vertical, width] as const};
}
