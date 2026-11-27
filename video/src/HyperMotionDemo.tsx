import {Composition, registerRoot} from 'remotion';
import {ObservatoryComparison, ObservatoryDemo} from './hyper-motion-examples/demo';
import {ObservatoryClay} from './HyperMotionClay';
import {EffectsGallery} from './hyper-motion-examples/EffectsGallery';
import './fonts';

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;

function HyperMotionRoot() {
  return <>
    <Composition id="HyperMotionDemo" component={ObservatoryDemo}
      width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={720}
      defaultProps={{quality: 'final', seed: 915, withAudio: true}} />
    <Composition id="HyperMotionComparison" component={ObservatoryComparison}
      width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={360}
      defaultProps={{quality: 'final', seed: 915}} />
    <Composition id="HyperMotionClay" component={ObservatoryClay}
      width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={180}
      defaultProps={{quality: 'draft', seed: 17}} />
    <Composition id="HyperMotionEffects" component={EffectsGallery}
      width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={90}
      defaultProps={{theme: 'low-poly'}} />
  </>;
}

registerRoot(HyperMotionRoot);
