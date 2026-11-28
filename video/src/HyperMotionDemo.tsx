import {Composition, registerRoot} from 'remotion';
import {ObservatoryComparison, ObservatoryDemo} from './hyper-motion-examples/demo';
import {ObservatoryClay} from './HyperMotionClay';
import {EffectsGallery} from './hyper-motion-examples/EffectsGallery';
import {GARDEN_COMPARISON_LENGTH, GARDEN_PLAN, GardenComparison, GardenDemo} from './hyper-motion-examples/demo-garden';
import './fonts';

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;

function HyperMotionRoot() {
  return <>
    <Composition id="HyperMotionGarden" component={GardenDemo}
      width={WIDTH} height={HEIGHT} fps={GARDEN_PLAN.fps} durationInFrames={GARDEN_PLAN.durationInFrames}
      defaultProps={{quality: 'final', seed: 734, withAudio: true}} />
    <Composition id="HyperMotionGardenComparison" component={GardenComparison}
      width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={GARDEN_COMPARISON_LENGTH}
      defaultProps={{quality: 'final', seed: 734, withAudio: true}} />
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
