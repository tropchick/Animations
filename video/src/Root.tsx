import {Composition} from 'remotion';
import {AirGone} from './AirGone';
import {GravityFlip} from './GravityFlip';
import {DURATION_S, FPS} from './timeline';
import {DURATION_S as GRAVITY_S} from './gravity/time';
import {SlimeEp1} from './SlimeEp1';
import {SlimeCover} from './SlimeCover';
import {DURATION_S as SLIME_S} from './slime/cues';
import {SlimeEp2} from './SlimeEp2';
import {DURATION_S as SLIME2_S} from './slime/ep2/cues';
import {LastEp1} from './LastEp1';
import {LastDebug} from './last/Debug';
import {LastCover} from './LastCover';
import {DURATION_S as LAST1_S} from './last/cues';
import {SlimeEp3} from './SlimeEp3';
import {DURATION_S as SLIME3_S} from './slime/ep3/cues';
import {PovMrBeast} from './PovMrBeast';
import {PovCover} from './PovCover';
import {DURATION_S as POV_S} from './pov/cues';
import {EarthStop} from './EarthStop';
import {EarthCover} from './EarthCover';
import {DURATION_S as EARTH_S} from './earth/time';
import {GravityGrow} from './GravityGrow';
import {GrowCover, GROW_COVER} from './GrowCover';
import {DURATION_S as GROW_S} from './grow/time';

export const RemotionRoot = () => (
  <>
    <Composition
      id="GravityGrow"
      component={GravityGrow}
      durationInFrames={GROW_S * FPS + 1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition id="GrowCover" component={GrowCover} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={GROW_COVER} />
    <Composition
      id="EarthStop"
      component={EarthStop}
      durationInFrames={EARTH_S * FPS}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: false}}
    />
    <Composition
      id="EarthCover"
      component={EarthCover}
      durationInFrames={1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{v: 31.2, view: {pos: [-24, 1.6, 6.4], target: [-26, 40, -14], fov: 66}}}
    />
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
    <Composition
      id="SlimeEp2"
      component={SlimeEp2}
      durationInFrames={Math.round(SLIME2_S * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: true}}
    />
    <Composition
      id="SlimeEp3"
      component={SlimeEp3}
      durationInFrames={Math.round(SLIME3_S * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: true}}
    />
    <Composition id="SlimeCover" component={SlimeCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition
      id="SlimeCover2"
      component={SlimeCover}
      durationInFrames={1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{episode: 2, title: 'ПЕРВЫЕ СУТКИ', line: 'ТУТ ПОЛ МЯГКИЙ'}}
    />
    <Composition
      id="LastEp1"
      component={LastEp1}
      durationInFrames={Math.round(LAST1_S * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: true}}
    />
    <Composition
      id="PovMrBeast"
      component={PovMrBeast}
      durationInFrames={Math.round(POV_S * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{withAudio: true}}
    />
    <Composition id="LastCover" component={LastCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="LastDebug" component={LastDebug} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{v: 0}} />
    <Composition
      id="SlimeCover3"
      component={SlimeCover}
      durationInFrames={1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{episode: 3, title: 'ГОРОД', line: 'ВСЕ КАНАЛЫ МОЛЧАТ'}}
    />
    <Composition id="PovCover" component={PovCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);
