import {Audio} from '@remotion/media';
import {useMemo} from 'react';
import {Sequence, staticFile} from 'remotion';
import {CueAudio, type CueGain, type PlaybackCue} from './audio';
import {clamp} from './math';
import gardenAudio from './garden-audio.json';

export type ReactiveAudioCue = Readonly<{key: string; gain?: number}>;
type CueEvent = Readonly<{id: string; at: number; audio?: ReactiveAudioCue}>;
type CueLibrary = Readonly<Record<string, {
  src: string;
  duration: number;
  gain?: number;
  trimBefore?: number;
  fadeOut?: number;
}>>;

/** Attach each authored audio accent once. Changing a visual budget cannot drop a cue. */
export function compileCueAudio(events: readonly CueEvent[], library: CueLibrary): PlaybackCue[] {
  const transients = new Set<number>();
  return events.flatMap(({id, at, audio}) => {
    if (!audio) return [];
    const clip = Object.hasOwn(library, audio.key) ? library[audio.key] : undefined;
    if (!clip || !clip.src || !Number.isInteger(clip.duration) || clip.duration < 1 ||
      !Number.isInteger(at) || at < 0 || transients.has(at) ||
      !Number.isFinite(audio.gain ?? 1) || !Number.isFinite(clip.gain ?? 1)) {
      throw new Error(`Invalid or overlapping audio cue: ${id}`);
    }
    transients.add(at);
    return [{
      id, src: clip.src, time: {frame: at}, duration: clip.duration, trimBefore: clip.trimBefore,
      volume: clamp((clip.gain ?? 1) * (audio.gain ?? 1)), fadeOut: clip.fadeOut,
    }];
  });
}

export function excerptCueAudio(cues: readonly PlaybackCue[], from: number, duration: number): PlaybackCue[] {
  const end = from + duration;
  return cues.flatMap((cue) => {
    if (!('frame' in cue.time)) throw new TypeError('Expected a frame-compiled audio cue');
    const onset = cue.time.frame;
    if (onset >= end || onset + cue.duration <= from) return [];
    return [{...cue, time: {frame: onset - from}, duration: Math.min(cue.duration, end - onset)}];
  });
}

/** Keep stems on output time. Supply start only for a frame-accurate excerpt or A/B. */
export function ChoreographyAudio({bed, cues, includeAccents = true, accentGain = 1, bedGain = 1, excerpt}: {
  bed: string;
  cues: readonly PlaybackCue[];
  includeAccents?: boolean;
  accentGain?: CueGain;
  bedGain?: number;
  excerpt?: {from: number; duration: number};
}) {
  const from = excerpt?.from ?? 0;
  const duration = excerpt?.duration;
  const end = duration === undefined ? undefined : from + duration;
  const clips = useMemo(() => duration === undefined ? cues : excerptCueAudio(cues, from, duration),
    [cues, duration, from]);
  const gain = typeof accentGain === 'number' ? accentGain : (frame: number) => accentGain(frame + from);
  return <>
    <Audio src={bed} volume={clamp(bedGain)} trimBefore={from} trimAfter={end}/>
    {includeAccents && <CueAudio cues={clips} gain={gain}/>}
  </>;
}

const gardenRoot = 'audio/hyper-motion-v2/';

export function gardenAudioCues(events: readonly CueEvent[]) {
  const clips = Object.fromEntries(Object.entries(gardenAudio.accents).map(([name, duration]) => [name, {
    src: staticFile(`${gardenRoot}${name}.mp3`), duration,
  }]));
  return compileCueAudio(events, clips);
}

export function GardenScore({events, from, ...props}: {
  events: readonly CueEvent[];
  from?: number;
} & Omit<Parameters<typeof ChoreographyAudio>[0], 'bed' | 'cues'>) {
  const cues = useMemo(() => gardenAudioCues(events), [events]);
  const audio = <ChoreographyAudio {...props} bed={staticFile(`${gardenRoot}bed.mp3`)} cues={cues}/>;
  return from === undefined ? audio : <Sequence from={from} durationInFrames={props.excerpt?.duration}
    layout="none">{audio}</Sequence>;
}
