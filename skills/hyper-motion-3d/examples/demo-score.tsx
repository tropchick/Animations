import {Audio} from '@remotion/media';
import {staticFile} from 'remotion';
import timing from './demo-cues.json';
import envelope from './demo-envelope.json';

export const DEMO_CUES = timing.beats;
export const DEMO_BEATS = Object.values(DEMO_CUES).sort((a, b) => a - b);
export const DEMO_ENVELOPE = envelope;

export function DemoScore({accents = true, accentGain = 1, trimBefore, trimAfter}: {
  accents?: boolean;
  accentGain?: number | ((frame: number) => number);
  trimBefore?: number;
  trimAfter?: number;
}) {
  return (
    <>
      <Audio src={staticFile('audio/hyper-motion-3d/bed.mp3')} {...{trimBefore, trimAfter}}/>
      {accents && (
        <Audio src={staticFile('audio/hyper-motion-3d/accents.mp3')} volume={accentGain} {...{trimBefore, trimAfter}}/>
      )}
    </>
  );
}
