import {Composition} from 'remotion';
import {AirGone} from './AirGone';
import {DURATION_S, FPS} from './timeline';

export const RemotionRoot = () => (
  <Composition id="AirGone" component={AirGone} durationInFrames={DURATION_S * FPS} fps={FPS} width={1080} height={1920} />
);
