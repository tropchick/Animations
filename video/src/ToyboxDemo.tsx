import {useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {
  AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {PerspectiveCamera} from 'three';
import {DynamicCamera, type CameraShot} from './hyper-motion-examples/camera';
import {Block} from './bear/kit';
import {Person, type PersonPose} from './scene/Characters';
import {Car} from './gta/props';
import {BUTTON, CoffeeMachine, CoffeeTerrace, soft, type Point} from './three/toybox/coffee';
import {ToyCharacter, TOY_CAST} from './three/toybox/character';
import {ToyEffects, type ToyEffectCue} from './three/toybox/effects';
import {ToyContactShadow, ToyLighting} from './three/toybox/lighting';
import {ToyTitle} from './three/toybox/typography';
import {getToyboxHyperPreset, type ToyboxHyperPreset} from './three/toybox/presets';
import {getToyboxTheme, type ToyboxQuality} from './three/toybox/theme';
import {ToyCafeTable, ToyCity, ToyInterior, ToySpace, ToyVehicle} from './three/toybox/world';

const FORMAT = {width: 1080, height: 1920, fps: 30};
const LENGTH = 840;
const COMPARE_FROM = 104;
const COMPARE_LENGTH = 180;

type Style = 'low' | 'standalone' | 'hyper';
type CoffeeProps = {quality?: ToyboxQuality; withAudio?: boolean; preset?: ToyboxHyperPreset};

const CINEMA: readonly CameraShot[] = [
  {frame: 0, position: [3.85, 3.52, 10.0], target: [-.60, 1.43, .03], fov: 46},
  {frame: 102, position: [2.30, 2.75, 7.10], target: [-.44, 1.29, .04], fov: 45},
  {frame: 104, position: [1.25, 2.05, 4.7], target: [-.48, 1.05, .19], cut: true, fov: 40},
  {frame: 143, position: [.85, 1.75, 4.0], target: [-.57, 1.12, .34], fov: 37},
  {frame: 168, position: [2.05, 2.65, 5.65], target: [-.22, 1.22, .01], cut: true, fov: 40},
  {frame: 275, position: [2.65, 3.85, 5.8], target: [-.17, 1.13, -.27], fov: 39},
  {frame: 317, position: [1.05, 3.76, 3.2], target: [.19, 1.45, .09], fov: 41},
  {frame: 365, position: [.50, 2.46, 1.16], target: [.23, 1.70, -.01], fov: 43},
  {frame: 428, position: [.59, 2.38, .95], target: [.17, 1.74, -.02], fov: 44},
  {frame: 483, position: [.39, 2.26, .80], target: [.16, 1.74, -.08], fov: 41},
  {frame: 547, position: [.56, 2.62, 1.19], target: [.20, 1.70, -.04], fov: 44},
  {frame: 615, position: [1.20, 4.50, 4.32], target: [.13, 1.28, .0], fov: 39},
  {frame: 648, position: [1.65, 2.20, 5.7], target: [-.26, 1.12, .06], cut: true, fov: 42},
  {frame: 702, position: [.68, 1.30, 2.40], target: [.12, .53, .41], cut: true, fov: 36},
  {frame: 745, position: [.42, 1.05, 2.12], target: [.16, .48, .46], fov: 33},
  {frame: 767, position: [1.85, 2.38, 5.40], target: [-.24, 1.11, -.05], cut: true, fov: 42},
  {frame: 839, position: [1.47, 2.41, 5.72], target: [-.21, 1.10, -.13], fov: 42},
];

const BASE_CAMERA = {position: [1.60, 2.74, 6.25], target: [-.22, 1.17, .02], fov: 42} as const;
const CUES: readonly ToyEffectCue[] = [
  {kind: 'ring', from: 132, duration: 13, position: [-.47, 1.21, .73], direction: [0, 0, 1], size: .26, color: '#81e6bb'},
  {kind: 'dust', from: 190, duration: 31, position: [.42, .2, .42], direction: [.83, .24, .2], size: .5, color: '#e9c9ad'},
  {kind: 'glint', from: 270, duration: 17, position: [.89, 1.81, .31], size: .34, color: '#ffdf9e'},
  {kind: 'star', from: 320, duration: 19, position: [-1.15, 1.97, .69], size: .23, color: '#ffcf88'},
  {kind: 'haze', from: 378, duration: 59, position: [.42, 1.61, -.06], direction: [.1, 1, 0], size: .24, color: '#ffe0b4'},
  {kind: 'dust', from: 667, duration: 27, position: [.46, .14, .52], direction: [.79, .65, 0], size: .45, color: '#eed2ad'},
  {kind: 'ring', from: 720, duration: 19, position: [.32, .31, .47], direction: [0, 1, 0], size: .35, color: '#ffcb70'},
  {kind: 'glint', from: 724, duration: 17, position: [.33, .56, .49], size: .3, color: '#ffe9bc'},
];

function StaticLens({position, target, fov}: {position: readonly number[]; target: readonly number[]; fov: number}) {
  const camera = useThree(({camera}) => camera);
  const [x, y, z] = position;
  const [tx, ty, tz] = target;
  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    camera.position.set(x, y, z);
    camera.lookAt(tx, ty, tz);
    camera.fov = fov;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }, [camera, x, y, z, tx, ty, tz, fov]);
  return null;
}

function BaselineStreet({frame}: {frame: number}) {
  return <>
    <hemisphereLight args={['#f7ecd9', '#b8a4ad', 1.6]} />
    <directionalLight position={[4, 7, 5]} intensity={2.15} color="#fff2db" />
    <Block position={[0, -.08, -1.7]} size={[45, .16, 12]} color="#bdac9f" />
    <Block position={[0, -.14, 4.6]} size={[45, .17, 4]} color="#626975" />
    {[-2, -1, 0, 1, 2].map((i) => <group key={i} position={[i * 3.05, 0, -4.65]}>
      <Block position={[0, 1.8, -.68]} size={[2.87, 3.6, 2.4]}
        color={['#d2a685', '#799f9d', '#d9ad87', '#c99983', '#a9a8be'][i + 2]} />
      <Block position={[0, 2.7, .56]} size={[1.6, .8, .07]} color="#889ea4" />
      <Block position={[0, .75, .57]} size={[1.7, 1.5, .086]} color="#546d79" />
      <Block position={[0, 1.56, .72]} size={[2.1, .15, .42]} color="#ead7c2" />
    </group>)}
    <group scale={.55} position={[-8 + frame * .063 % 18, -.09, 3.8]}>
      <Car position={[0, 0, 0]} color="#d08d69" />
    </group>
  </>;
}

function Cast({frame, fps, low}: {frame: number; fps: number; low: boolean}) {
  const step = soft(frame, 0, 97);
  const recoil = soft(frame, 255, 287) - soft(frame, 305, 331);
  const pos: Point = [-3 + 1.94 * step - .26 * recoil, 0, 1.19 - .18 * step];
  const yaw = 1.13 - .43 * soft(frame, 92, 127) - .39 * soft(frame, 763, 780);
  const stepAngle = Math.sin(step * Math.PI * 8) * .54;
  const personPose: PersonPose = {
    legL: stepAngle, legR: -stepAngle, armL: [-stepAngle, .11],
    armR: [stepAngle + 1.25 * (soft(frame, 105, 132) - soft(frame, 145, 171)), -.1],
    elbowR: .4, head: [-.28 * recoil, .1], eyes: 1 + .55 * recoil, mouth: .6 * recoil,
  };
  if (low) return <>
    <Person position={pos} rotation={yaw} shirt="#4c9f9a" pants="#30445b" pose={personPose} />
    <Person position={[1.65, 0, -.88]} rotation={-.62} scale={.92} shirt="#bb8460" pants="#3e5966" />
  </>;

  const action = frame < 93 ? 'walk' : frame < 107 ? 'stop' : frame < 169 ? 'interact'
    : frame < 250 ? 'look' : frame < 323 ? 'surprise' : frame < 704 ? 'look'
      : frame < 767 ? 'interact' : 'laugh';
  const actionStart = frame < 93 ? 0 : frame < 107 ? 93 : frame < 169 ? 107 : frame < 250 ? 169
    : frame < 323 ? 250 : frame < 704 ? 323 : frame < 767 ? 704 : 767;
  // Express the contact marker in the rig's local +Z-forward coordinate system.
  const marker: Point = frame < 704 ? [BUTTON[0], BUTTON[1], BUTTON[2] + .095 - .041 * (soft(frame, 125, 132) - soft(frame, 137, 147))] : [.28, .65, .51];
  const dx = marker[0] - pos[0], dz = marker[2] - pos[2];
  const release = soft(frame, 138, 170);
  const target: Point = frame > 170 && frame < 704 ? [.27, 2.06, .72]
    : [dx * Math.cos(yaw) - dz * Math.sin(yaw) - .23 * release,
      marker[1] - .33 * release * Number(frame < 170), dx * Math.sin(yaw) + dz * Math.cos(yaw) + .12 * release];
  return <>
    <ToyContactShadow position={[pos[0], .012, pos[2]]} size={[1.04, .78]} />
    <ToyCharacter frame={frame} fps={fps} position={pos} yaw={yaw} config={TOY_CAST.courier}
      action={action} actionStart={actionStart} actionDuration={frame < 169 ? 88 : 63} target={target}
      hand="right" gaitStart={0}
      emotion={frame < 173 ? 'neutral' : frame < 249 ? 'confusion' : frame < 366 ? 'surprise'
        : frame < 705 ? 'delight' : frame < 767 ? 'suspicion' : 'joy'} />
    <ToyContactShadow position={[1.69, .012, -.94]} size={[.94, .70]} />
    <ToyCharacter frame={frame} fps={fps} position={[1.69, 0, -.94]} yaw={-.65} config={TOY_CAST.vendor}
      action={frame >= 265 && frame <= 321 ? 'surprise' : frame >= 744 ? 'laugh' : 'idle'}
      actionStart={frame > 744 ? 744 : 265}
      emotion={frame > 744 ? 'comedy' : frame > 265 && frame < 340 ? 'surprise' : 'neutral'} />
  </>;
}

function TerraceCast({frame, fps}: {frame: number; fps: number}) {
  const mini = soft(frame, 369, 433);
  return <>
    <group position={[.34 - .245 * mini, .058, -.145]} scale={.152}>
      <ToyCharacter frame={frame} fps={fps} yaw={-.75 + 1.24 * soft(frame, 437, 457)}
        config={TOY_CAST.neighbor} action={frame < 435 ? 'walk' : 'gesture'} actionStart={frame < 435 ? 361 : 435}
        emotion="joy" />
    </group>
    <group position={[-.39, .058, -.19]} scale={.126}>
      <ToyCharacter frame={frame} fps={fps} yaw={.62} config={TOY_CAST.vendor} action="talk" emotion="delight" />
    </group>
  </>;
}

function CoffeeFilm({style, compare = false, quality = 'balanced', withAudio = true, preset}: CoffeeProps & {
  style: Style; compare?: boolean;
}) {
  const localFrame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const frame = localFrame + (compare ? COMPARE_FROM : 0);
  const low = style === 'low';
  const hyper = style === 'hyper';
  const theme = getToyboxTheme('city', quality);
  const motion = getToyboxHyperPreset(preset);
  const macro = !compare && frame >= 362 && frame <= 553;
  const trim = !compare && frame >= 702 && frame < 767;
  const reaction = soft(frame, 268, 287) - soft(frame, 299, 337);
  return <AbsoluteFill style={{backgroundColor: theme.palette.background}}>
    <ThreeCanvas width={width} height={height} dpr={theme.budget.pixelRatio} shadows={!low && quality !== 'preview'}
      gl={{antialias: quality === 'final', alpha: false, preserveDrawingBuffer: true}} camera={{near: .025, far: 85}}>
      <color attach="background" args={[theme.palette.background]} />
      <fog attach="fog" args={[theme.palette.haze, 9, 37]} />
      {hyper ? <DynamicCamera frame={frame} shots={CINEMA} intensity={motion.camera} drift={.12}
        accents={[{kind: 'punch', frame: 278, duration: 12, strength: .19},
          {kind: 'punch', frame: 720, duration: 11, strength: .16}]} />
        : <StaticLens {...BASE_CAMERA} />}
      {low ? <BaselineStreet frame={frame} /> : <>
        <ToyLighting preset={theme.lighting} quality={quality} coverage={8} />
        {!trim && <ToyCity frame={frame} fps={fps} quality={quality} reaction={reaction} />}
        {!compare && frame < 79 && <ToyVehicle quality={quality} variant="car"
          position={[-2.3 + frame * .083, -.156, 4.44]} distance={frame * .083} color="#CA8A6B" />}
        {trim && <ToyCity frame={frame} fps={fps} quality="preview" traffic={false} pedestrians={false} />}
        {!macro && <ToyContactShadow size={[2.32, 1.96]} position={[0, .015, 0]} opacity={.54} />}
      </>}
      {!macro && <Cast {...{frame, fps, low}} />}
      <CoffeeMachine {...{frame, fps, quality, low}}>
        <CoffeeTerrace frame={frame} quality={quality} />
        <TerraceCast frame={frame} fps={fps} />
      </CoffeeMachine>
      {hyper && <ToyEffects cues={CUES} frame={frame} quality={quality} intensity={motion.particles} />}
    </ThreeCanvas>
    {!compare && <ToyTitle intensity={motion.text} title="ВСЕГО ОДИН КОФЕ" from={7} to={82} accent="#ffce76" />}
    {!compare && <ToyTitle intensity={motion.text} title="А КОФЕ ГДЕ?" from={530} to={592} accent="#ffca7a" variant="soft" />}
    {!compare && <ToyTitle intensity={motion.text} title="ОДИН. КАК ПРОСИЛИ." position="bottom" from={767} to={839} accent="#87d4bc" variant="soft" />}
    {!compare && withAudio && <Audio src={staticFile('audio/toybox-3d/coffee.mp3')} />}
  </AbsoluteFill>;
}

function Specimen({kind, quality = 'balanced'}: {kind: 'interior' | 'space'; quality?: ToyboxQuality}) {
  const {width, height, fps} = useVideoConfig();
  const frame = useCurrentFrame() + 41;
  const theme = getToyboxTheme(kind === 'space' ? 'space' : 'product', quality);
  return <ThreeCanvas width={width} height={height} shadows={quality !== 'preview'} camera={{near: .03, far: 95}}>
    <color attach="background" args={[theme.palette.background]} />
    <StaticLens position={kind === 'space' ? [1.65, 2.8, 7.42] : [3.2, 2.82, 6.22]}
      target={kind === 'space' ? [0, 1.72, -1.04] : [.20, 1.27, -.37]} fov={43} />
    <ToyLighting preset={theme.lighting} quality={quality} coverage={7} />
    {kind === 'space' ? <>
      <ToySpace frame={frame} fps={fps} quality={quality} />
      <ToyContactShadow position={[.55, .005, .16]} size={[1.08, .81]} opacity={.48} />
      <ToyCharacter frame={frame} fps={fps} position={[.55, 0, .16]} yaw={-.38}
        config={TOY_CAST.neighbor} action="gesture" emotion="delight" target={[-.62, 3.7, .4]} />
    </> : <>
      <ToyInterior frame={frame} fps={fps} quality={quality} />
      <ToyCafeTable position={[.55, .034, -.38]} rotation={-.39} quality={quality} />
      <ToyContactShadow position={[-.49, .038, .30]} size={[1.07, .79]} opacity={.36} />
      <ToyCharacter frame={frame} fps={fps} position={[-.49, .031, .30]} yaw={.38}
        config={TOY_CAST.vendor} action="talk" emotion="joy" />
    </>}
  </ThreeCanvas>;
}

const HyperDemo = (props: CoffeeProps) => <CoffeeFilm style="hyper" {...props} />;
const CompareLow = (props: CoffeeProps) => <CoffeeFilm style="low" compare {...props} />;
const CompareToy = (props: CoffeeProps) => <CoffeeFilm style="standalone" compare {...props} />;
const CompareHyper = (props: CoffeeProps) => <CoffeeFilm style="hyper" compare {...props} />;
const Interior = (props: CoffeeProps) => <Specimen kind="interior" {...props} />;
const Space = (props: CoffeeProps) => <Specimen kind="space" {...props} />;

export function ToyboxRoot() {
  return <>
    <Composition id="ToyboxHyperDemo" component={HyperDemo} {...FORMAT} durationInFrames={LENGTH}
      defaultProps={{quality: 'balanced', withAudio: true, preset: 'Toybox Hyper'} satisfies CoffeeProps} />
    <Composition id="ToyboxCompareLowPoly" component={CompareLow} {...FORMAT} durationInFrames={COMPARE_LENGTH}
      defaultProps={{quality: 'balanced', withAudio: false} satisfies CoffeeProps} />
    <Composition id="ToyboxCompareStandalone" component={CompareToy} {...FORMAT} durationInFrames={COMPARE_LENGTH}
      defaultProps={{quality: 'balanced', withAudio: false} satisfies CoffeeProps} />
    <Composition id="ToyboxCompareHyper" component={CompareHyper} {...FORMAT} durationInFrames={COMPARE_LENGTH}
      defaultProps={{quality: 'balanced', withAudio: false} satisfies CoffeeProps} />
    <Composition id="ToyboxInterior" component={Interior} {...FORMAT} durationInFrames={90}
      defaultProps={{quality: 'balanced'} satisfies CoffeeProps} />
    <Composition id="ToyboxSpace" component={Space} {...FORMAT} durationInFrames={90}
      defaultProps={{quality: 'balanced'} satisfies CoffeeProps} />
  </>;
}

registerRoot(ToyboxRoot);
