import {Composition} from 'remotion';
import {AirGone} from './AirGone';
import {GravityFlip} from './GravityFlip';
import {DURATION_S, FPS} from './timeline';
import {DURATION_S as GRAVITY_S} from './gravity/time';
import {SlimeEp1} from './SlimeEp1';
import {DURATION_S as SLIME_S} from './slime/cues';

export const RemotionRoot = () => (
  <>
    <Composition id="AirGone" component={AirGone} durationInFrames={DURATION_S * FPS} fps={FPS} width={1080} height={1920} />
    <Composition
      id="GravityFlip"
      component={GravityFlip}
      durationInFrames={GRAVITY_S * FPS}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: true}}
    />
    <Composition
      id="SlimeEp1"
      component={SlimeEp1}
      durationInFrames={Math.round(SLIME_S * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: true}}
    />
  </>
);
