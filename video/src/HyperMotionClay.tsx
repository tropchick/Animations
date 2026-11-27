import {ThreeCanvas} from '@remotion/three';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {ClayCharacter, CLAY_STRIDE} from './clay-examples/character';
import {ClayContactShadow, ClayEnvironment, ClayFocus, ClayLighting} from './clay-examples/cinema';
import {ClayStreet} from './clay-examples/street';
import {ClayDetailContext, ClayPiece} from './clay-examples/surface';
import {stopMotionTiming} from './clay-examples/timing';
import {DynamicCamera, type CameraShot} from './hyper-motion-examples/camera';
import {DustCloud, Sparkles} from './hyper-motion-examples/effects';
import {ease, type Point} from './hyper-motion-examples/demo-world';
import type {Quality} from './hyper-motion-examples/timeline';

const TRACK: readonly CameraShot[] = [
  {frame: 0, position: [1.08, 1.84, 5.65], target: [-0.73, 1.43, -0.57], fov: 36},
  {frame: 81, position: [0.71, 1.79, 4.66], target: [-0.14, 1.41, -0.37], fov: 34},
  {frame: 130, position: [0.69, 1.60, 3.28], target: [0.14, 1.38, -0.27], fov: 33, ease: 'spline'},
  {frame: 179, position: [0.58, 1.63, 3.52], target: [0.03, 1.38, -0.29], fov: 33, ease: 'spline'},
];

export function ObservatoryClay({quality = 'draft', seed = 17}: {quality?: Quality; seed?: number}) {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const {seconds} = stopMotionTiming(frame, fps, 'stop-motion');
  const pose = seconds * fps;
  const distance = 1.46 * ease(pose, -12, 83);
  const x = -1.14 + distance * 0.69;
  const z = -0.69 + distance * 0.33;
  const move = 1 - ease(pose, 53, 85);
  const raise = ease(pose, 77, 111) - 0.45 * ease(pose, 137, 168);
  const object: Point = [x + 0.51, 0.92 + raise * 0.21, z + 0.39];

  const rack = ease(frame, 97, 125) - ease(frame, 134, 166);
  const focus: Point = [x + (object[0] - x) * rack, 1.51 + (object[1] - 1.51) * rack,
    z + 0.19 + (object[2] - z - 0.19) * rack];

  return <ThreeCanvas width={width} height={height} shadows="percentage"
    gl={{antialias: quality === 'final', alpha: false}} camera={{near: 0.04, far: 60}}>
    <ClayDetailContext.Provider value={quality}>
      <ClayEnvironment sky="#bfd4d6" haze="#e8d8c3" near={7} far={26} />
      <ClayLighting quality={quality} />
      <DynamicCamera frame={frame} shots={TRACK} sampleFocus={() => focus}
        renderFocus={quality === 'final' ? (focusDistance) =>
          <ClayFocus distance={focusDistance} band={0.24} maxBlurPx={6} /> : undefined} />
      <ClayStreet seconds={seconds} seed={seed} quality={quality} />
      <ClayContactShadow position={[x, 0.009, z]} size={[0.83, 0.5]} opacity={0.32} />
      <group position={[x, 0, z]} rotation-y={0.57 - 0.4 * raise}>
        <ClayCharacter time={seconds} phase={distance / CLAY_STRIDE.walk} motion={move} gait="walk"
          look={[0.46 * raise, -0.27 * raise]} reaction={0.57 * raise} reach={raise} seed={seed} />
      </group>
      {pose > 80 && <group position={object} rotation={[0.2, 0.6 + raise * 0.3, 0.19]}>
        <ClayPiece color="#d98f5e" shape="slab" scale={[0.16, 0.11, 0.071]} seed={seed + 1} castShadow />
        <ClayPiece color="#f2cc87" shape="slab" scale={[0.085, 0.006, 0.077]} position={[0, 0.028, 0]}
          seed={seed + 2} />
      </group>}
      <DustCloud frame={pose} from={63} duration={29} seed={seed} position={[-0.36, 0.05, -0.49]}
        color="#bfa98c" size={0.39} count={8} opacity={0.77} theme="clay" />
      <Sparkles frame={pose} from={105} duration={36} seed={seed} position={[object[0] + 0.09, object[1] - 0.04, object[2]]}
        color="#e4b879" direction={[0.72, 0.34, 0.33]} spread={88} size={0.30} count={7} opacity={0.80} theme="clay" />
    </ClayDetailContext.Provider>
  </ThreeCanvas>;
}
