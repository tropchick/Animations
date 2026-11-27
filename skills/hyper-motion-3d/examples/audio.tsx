import type {ReactNode} from 'react';
import {Audio} from '@remotion/media';
import {Sequence, useCurrentFrame, useVideoConfig} from 'remotion';

export type CueTime = {frame: number} | {seconds: number};
export type AudioEnvelope = {
  samples: readonly number[];
  /** Continuous offset of the first measurement, in seconds. */
  startSeconds?: number;
  /** Time between measurements, in seconds. */
  stepSeconds: number;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function frameAt(time: CueTime, fps: number) {
  return Math.round('frame' in time ? time.frame : time.seconds * fps);
}

/** Linear interpolation across offline RMS or peak samples. */
export function sampleEnvelope(track: AudioEnvelope, frame: number, fps: number) {
  const {samples, stepSeconds, startSeconds = 0} = track;
  if (stepSeconds <= 0 || fps <= 0 || samples.length === 0) return 0;
  const cursor = (frame / fps - startSeconds) / stepSeconds;
  const last = samples.length - 1;
  // Allow floating-point rounding at timestamps produced by frame / fps.
  if (cursor < -1e-8 || cursor > last + 1e-8) return 0;
  const time = Math.min(last, Math.max(0, cursor));
  const left = Math.floor(time);
  const right = Math.min(last, left + 1);
  const mix = time - left;
  return clamp(samples[left] * (1 - mix) + samples[right] * mix);
}

/** Envelope evaluates sorted absolute beat frames without accumulated state. */
export function beatPulse(frame: number, beats: readonly number[], decay = 10, anticipation = 0) {
  let lo = 0;
  let hi = beats.length;
  while (lo < hi) {
    const middle = (lo + hi) >>> 1;
    if (beats[middle] <= frame) lo = middle + 1;
    else hi = middle;
  }
  const previous = beats[lo - 1];
  const upcoming = beats[lo];
  const tail = previous === undefined ? 0 : (1 - clamp((frame - previous) / Math.max(1, decay))) ** 2;
  const attack = upcoming === undefined || anticipation <= 0 ? 0 :
    (1 - clamp((upcoming - frame) / anticipation)) ** 2;
  return Math.max(tail, attack);
}

export function BeatSync({beats, decay, anticipation, strength = 1, frame: suppliedFrame, children}: {
  beats: readonly number[];
  decay?: number;
  anticipation?: number;
  strength?: number;
  frame?: number;
  children: (pulse: number) => ReactNode;
}) {
  const frame = useCurrentFrame();
  return <>{children(beatPulse(suppliedFrame ?? frame, beats, decay, anticipation) * clamp(strength))}</>;
}

export function AudioReactiveEffect({envelope, frame: suppliedFrame, strength = 1, children}: {
  envelope: AudioEnvelope;
  frame?: number;
  strength?: number;
  children: (level: number) => ReactNode;
}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <>{children(sampleEnvelope(envelope, suppliedFrame ?? frame, fps) * clamp(strength))}</>;
}

export type PlaybackCue = {
  id: string;
  src: string;
  time: CueTime;
  duration: number;
  volume?: number;
  trimBefore?: number;
  fadeIn?: number;
  fadeOut?: number;
};

export function cueGain(frame: number, duration: number, volume: number, fadeIn: number, fadeOut: number) {
  if (frame < 0 || frame >= duration) return 0;
  const attack = fadeIn > 0 ? clamp(frame / fadeIn) : 1;
  const release = fadeOut > 0 ? clamp((duration - 1 - frame) / fadeOut) : 1;
  return clamp(volume) * Math.min(attack, release);
}

export function CueAudio({cues, gain = 1}: {cues: readonly PlaybackCue[]; gain?: number}) {
  const {fps} = useVideoConfig();
  if (gain <= 0) return null;
  return (
    <>
      {cues.map(({id, src, time, duration, volume = 1, trimBefore = 0, fadeIn = 0, fadeOut = 0}) => (
        <Sequence key={id} from={frameAt(time, fps)} durationInFrames={duration} layout="none">
          <Audio src={src} trimBefore={trimBefore}
            volume={(localFrame) => cueGain(localFrame, duration, volume * gain, fadeIn, fadeOut)}/>
        </Sequence>
      ))}
    </>
  );
}
