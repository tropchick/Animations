import {ThreeCanvas} from '@remotion/three';
import {Quaternion, Vector3} from 'three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {DynamicCamera, sampleCamera, type CameraSample, type CameraAccent, type CameraShot} from './camera';
import {sampleChoreography, type ActiveCue} from './choreography';
import {GardenScore} from './cue-audio';
import {MotionTrail, ParticleBurst, Sparkles} from './effects';
import {EnergizedArc, FragmentAssembly, LayeredWave, VolumetricCloud,
  type FragmentPiece} from './spatial-effects';
import {sampleEditTime} from './editing';
import {bandPlacement, compileScaleLadder, toBandCamera} from './scale-escalation';
import {compileReactiveHud, ReactiveHUD} from './reactive-hud';
import {KineticText, SafeArea} from './typography';
import {AwakenAwnings, BUD, CatchDrain, CityAqueduct, DEW_PALM, ease, GARDEN, GARDEN_PLAN,
  GardenArchitecture, Gardener, GardenPlants, GardenWater, HeroFlower, Hub, Seed, seedAt,
  type GardenPoint} from './demo-garden-world';
import type {Quality} from './timeline';

export {GARDEN_PLAN};
const plan = GARDEN_PLAN;
const cues = Object.fromEntries(plan.cues.map((cue) => [cue.id, cue]));
const hud = compileReactiveHud(plan.cues, {label: 'Цветение', unit: 'percent', value: 0,
  maximum: 100, palette: '#aef39a'});
const SCALE = compileScaleLadder([
  {id: 'courtyard', from: 0, origin: [0, 0, 0], worldUnitsPerUnit: 1, near: 0.055, far: 120},
  {id: 'street', from: 166, origin: [0, 0.72, -6.21], worldUnitsPerUnit: 1, near: 0.055, far: 120},
  {id: 'roof', from: 456, origin: BUD, worldUnitsPerUnit: 1, near: 0.05, far: 120},
  {id: 'neighborhood', from: 548, origin: [0, 3.17, -15.5], worldUnitsPerUnit: 4, near: 0.05, far: 55},
  {id: 'payoff', from: 655, origin: BUD, worldUnitsPerUnit: 1, near: 0.05, far: 120},
]);
const TIME = [
  {frame: 0, sourceFrame: 0}, {frame: 46, sourceFrame: 46}, {frame: 51, sourceFrame: 48},
  {frame: 84, sourceFrame: 84}, {frame: 839, sourceFrame: 839},
] as const;
const TRACK = plan.cameraTrack;

const BASE: readonly CameraShot[] = [
  {frame: 0, position: [1.0, 2.71, 5.1], target: [0.03, 0.76, -0.33], fov: 50},
  {frame: 166, position: [1.47, 3.09, 5.60], target: [0.01, 0.78, -0.70], fov: 50},
  {frame: 242, position: [1.54, 3.51, -0.1], target: [0.21, 1.03, -6.26], fov: 50, cut: true},
  {frame: 339, position: [1.22, 3.41, -4.97], target: [0.08, 2.4, -12.61], fov: 50, cut: true},
  {frame: 430, position: [1.28, 5.18, -8.89], target: [0.17, 3.84, -15.88], fov: 48, cut: true},
  {frame: 548, position: [3.38, 13.76, -1.31], target: [0.36, 4.42, -24.89], fov: 51, cut: true},
  {frame: 655, position: [0.63, 5.13, -11.05], target: [0.12, 4.05, -15.46], fov: 43, cut: true},
];
const ACCENTS: readonly CameraAccent[] = [
  {kind: 'punch', frame: cues.catch.at - 3, duration: 15, strength: 0.54},
  {kind: 'punch', frame: cues.dock.at - 3, duration: 17, strength: 0.38},
  {kind: 'shake', frame: cues.roof.at, duration: 26, strength: 0.31},
];
const tiles: readonly FragmentPiece[] = Array.from({length: 7}, (_, i) => {
  const angle = 2 * Math.PI * i / 7;
  return {position: [Math.sin(angle) * 0.31, 0.011, Math.cos(angle) * 0.31],
    scale: [0.077, 0.044, 0.112], rotation: [0, angle, 0], color: i % 2 ? '#8ae7b8' : '#dff695'};
});

function GardenEffect({entry, frame, quality}: {entry: ActiveCue; frame: number; quality: Quality}) {
  const {cue, seed, lanes, particleBudget} = entry;
  const props = {frame, at: cue.at, origin: cue.origin, direction: cue.direction, seed,
    size: cue.size, color: cue.palette.color, accent: cue.palette.accent,
    strength: (0.4 + lanes.vfx * 0.6) * cue.strength, particleBudget, finish: 'faceted' as const};
  switch (cue.id) {
    case 'seed-rattle':
      return <VolumetricCloud {...props} size={0.39} color="#d9ad8c" accent="#f4cc9a"
        duration={25} count={12} direction={[-0.85, 0.15, 0.14]} />;
    case 'catch':
      return <>
        <MotionTrail frame={frame} from={cue.at - 2} duration={18} sample={seedAt} size={0.15}
          opacity={0.36} color="#84eac3" budget={quality === 'final' ? 7 : 4} />
        <Sparkles frame={frame} from={cue.at} duration={25} position={cue.origin}
          direction={[-0.45, 0.65, 0.15]} size={0.37} budget={particleBudget}
          opacity={0.84} color="#e5c67c" />
      </>;
    case 'dock':
      return <FragmentAssembly {...props} at={cue.at - 11} duration={35} pieces={tiles}
        travel={0.57} hold={false} strength={props.strength * 0.92} />;
    case 'courtyard':
      return <LayeredWave {...props} origin={[0.2, 0.10, -0.99]} thickness={0.48} fronts={2} duration={35} />;
    case 'terrace':
      return <EnergizedArc {...props} origin={undefined} start={[0.65, 0.75, -5.82]}
        end={[1.58, 1.07, -6.65]} duration={42} arcHeight={0.32} size={1} thickness={0.027} />;
    case 'alley':
      return <ParticleBurst frame={frame} from={cue.at} duration={43} position={cue.origin}
        direction={[0.12, 0.5, 0.2]} gravity={0.20} size={1.14} spread={122}
        opacity={0.78} color="#bee889" budget={particleBudget} count={28} />;
    case 'roof':
      return <LayeredWave {...props} origin={[-0.48, 3.24, -15.65]} size={3.49}
        thickness={0.43} fronts={3} duration={48} />;
    case 'city':
      return <LayeredWave {...props} origin={[0.08, 5.19, -25.1]} size={15.5}
        thickness={0.33} fronts={2} duration={65} strength={props.strength * 0.74} />;
    case 'dew':
      return <Sparkles frame={frame} from={cue.at} duration={24} position={DEW_PALM}
        direction={[-0.2, 0.4, 0.5]} size={0.30} color="#fec77f" budget={particleBudget} opacity={0.57} />;
    default:
      return null;
  }
}

function GardenTitle({frame, intensity}: {frame: number; intensity: number}) {
  const alpha = ease(frame, 789, 808);
  if (!alpha) return null;
  return <KineticText from={790} frame={frame} duration={24} intensity={intensity}
    style={{fontFamily: 'Spectral, Georgia, serif', fontSize: 69, fontWeight: 500,
      color: '#fff5df', lineHeight: 1, letterSpacing: '-0.05em',
      textShadow: '0 2px 2px #6b4f58, 0 3px 15px #634351', opacity: alpha}}>
    Сад на крыше
  </KineticText>;
}

type SceneMode = 'base' | 'decoration' | 'full';
const accentAt = (frame: number) => 0.71 + 0.29 * sampleChoreography(GARDEN_PLAN, frame).intensity.audio;

function ForegroundLeaf({frame, camera}: {frame: number; camera: CameraSample}) {
  const p = ease(frame, 540, 557);
  if (p <= 0 || p >= 1) return null;
  const focus = new Vector3(...camera.position);
  const forward = new Vector3(...camera.target).sub(focus).normalize();
  const right = forward.clone().cross(new Vector3(0, 1, 0)).normalize();
  const up = right.clone().cross(forward);
  const position = focus.addScaledVector(forward, 0.48)
    .addScaledVector(right, -0.42 + p * 0.86).addScaledVector(up, -0.10);
  const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), forward.clone().negate());
  return <group position={position} quaternion={quaternion}>
    <group rotation-z={-0.52}>
      <mesh scale={[0.21, 0.43, 0.16]}>
        <sphereGeometry args={[1, 11, 7]} />
        <meshStandardMaterial color="#839f68" flatShading roughness={0.84} />
      </mesh>
      <mesh position={[0, -0.005, 0.144]} scale={[0.006, 0.295, 0.021]}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshStandardMaterial color="#b8cb7d" roughness={0.94} />
      </mesh>
    </group>
  </group>;
}

function GardenScene({frame, quality, seed, mode, label}: {
  frame: number; quality: Quality; seed: number; mode: SceneMode; label?: string;
}) {
  const enhanced = mode === 'full';
  const decorative = mode === 'decoration';
  const {width, height} = useVideoConfig();
  const move = sampleChoreography(plan, frame, {quality, seed});
  const band = SCALE(frame);
  const roofShot = frame >= 456;
  const detailed = frame < 548 || frame >= 655;
  const city = frame >= 519 && frame < 655;
  const pose = sampleEditTime(frame, TIME);
  const cityMotion = enhanced ? Math.max(...move.events.map(({lanes}) => lanes.light), 0) : 0;
  const deformation = enhanced ? Math.max(...move.events.map(({lanes}) => lanes.body), 0) : 0;
  const catchActive = enhanced && move.events.some(({cue, lanes}) => cue.id === 'catch' && lanes.vfx > 0);
  const interior = frame < 166;
  const chargeVisible = frame >= cues.courtyard.at && frame < 655;
  const cameraIntensity = enhanced ? move.intensity.camera : 0;
  const draft = quality === 'draft';
  const activeDpr = draft ? 0.56 : 0.80;
  const cam = enhanced ? TRACK : BASE;
  const colorWash = (ease(frame, 471, 534) - ease(frame, 618, 654)) * 0.28;
  const leafCamera = enhanced && frame > 540 && frame < 557 ? toBandCamera(sampleCamera({
    frame, shots: cam, accents: ACCENTS, intensity: cameraIntensity, drift: 0.22,
  }), band) : null;
  return <AbsoluteFill style={{overflow: 'hidden',
    background: 'linear-gradient(180deg,#b9a7b5 0%,#eec3ae 54%,#f8dfb4 100%)'}}>
    <AbsoluteFill style={{opacity: colorWash,
      background: 'linear-gradient(180deg,#9e92ab 0%,#dcaa98 42%,#f9dab3 100%)'}} />
    <ThreeCanvas width={width} height={height} dpr={activeDpr} camera={{near: band.near, far: band.far}}
      gl={{alpha: true, antialias: !draft}}>
      <fog attach="fog" args={['#e5b5ac', 23 / band.worldUnitsPerUnit, 101 / band.worldUnitsPerUnit]} />
      <hemisphereLight args={['#f9e7cd', '#997582', 1.15]} />
      <directionalLight position={[-4.3, 7.6, 5.8]} color="#fff0cd" intensity={2.48} />
      <directionalLight position={[3.9, 3.4, -4.0]} color="#eee2ff" intensity={0.55 + cityMotion * 0.52} />
      <DynamicCamera frame={frame} shots={cam} accents={enhanced ? ACCENTS : []}
        intensity={cameraIntensity} drift={enhanced ? 0.22 : 0}
        mapSample={(sample) => toBandCamera(sample, band)} />
      <group {...bandPlacement(band)}>
        <GardenArchitecture city={city} />
        {city && <CityAqueduct frame={pose} />}
        <GardenWater frame={pose} />
        {frame > 153 && <AwakenAwnings frame={pose} />}
        <GardenPlants frame={pose} city={city} seed={seed} reactionGain={enhanced ? move.intensity.environment : 0} />
        {detailed && <Gardener frame={pose} />}
        {interior && <><CatchDrain /><Hub frame={pose} /><Seed frame={pose} deformation={deformation} contour={catchActive} /></>}
        {roofShot && <HeroFlower frame={pose} />}
        {decorative && (frame < 548
          ? <Sparkles frame={frame} from={cues.roof.at} duration={55} size={1.48} count={26}
              position={[-0.28, 4.08, -15.42]} seed={seed} color="#ebc878" />
          : <Sparkles frame={frame} from={cues.city.at} duration={62} size={7.3} count={29}
              position={[0.01, 8.3, -24.18]} seed={seed} color="#ebc878" />)}
        {enhanced && move.events.filter((entry) => entry.lanes.vfx > 0)
          .map((entry) => <GardenEffect key={entry.cue.id} entry={entry} frame={frame} quality={quality} />)}
      </group>
      {leafCamera && <ForegroundLeaf frame={frame} camera={leafCamera} />}
    </ThreeCanvas>
    {mode !== 'base' && chargeVisible && <SafeArea style={{fontFamily: 'Inter, sans-serif', pointerEvents: 'none'}}>
      <ReactiveHUD view={hud.at(frame)} intensity={move.intensity.hud}
        style={{marginTop: label ? 97 : 39, opacity: ease(frame, 178, 184) * (1 - ease(frame, 648, 655))}} />
    </SafeArea>}
    {enhanced && !label && <SafeArea style={{display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', paddingTop: 34}}>
      <GardenTitle frame={frame} intensity={move.intensity.hud} />
    </SafeArea>}
    {label && <SafeArea style={{display: 'block', top: 209}}>
      <span style={{font: '600 34px Inter, sans-serif', color: '#fff0d6', borderRadius: 12,
        background: '#352744', padding: '10px 15px'}}>{label}</span>
    </SafeArea>}
  </AbsoluteFill>;
}

type GardenDemoProps = {quality?: Quality; seed?: number; withAudio?: boolean};
export function GardenDemo({quality = 'final', seed = 734, withAudio = true}: GardenDemoProps) {
  const frame = useCurrentFrame();
  return <>
    <GardenScene frame={frame} quality={quality} seed={seed} mode="full" />
    {withAudio && <GardenScore events={plan.cues} accentGain={accentAt} />}
  </>;
}

const COMPARISON_MODES = ['base', 'decoration', 'full'] as const;
const COMPARISON_LABELS = ['Исходная сцена', 'Отдельные эффекты', 'Срежиссированная сцена'] as const;
const COMPARISON_TAKE = 140;
export const GARDEN_COMPARISON_LENGTH = COMPARISON_MODES.length * COMPARISON_TAKE;
export function GardenComparison({quality = 'final', seed = 734, withAudio = true}: GardenDemoProps) {
  const local = useCurrentFrame();
  const excerpt = {from: 476, duration: COMPARISON_TAKE};
  const take = Math.min(COMPARISON_MODES.length - 1, Math.floor(local / COMPARISON_TAKE));
  return <>
    <GardenScene frame={excerpt.from + local % COMPARISON_TAKE} quality={quality} seed={seed}
      mode={COMPARISON_MODES[take]} label={COMPARISON_LABELS[take]} />
    {withAudio && COMPARISON_MODES.map((mode, index) =>
      <GardenScore key={mode} events={plan.cues} from={index * COMPARISON_TAKE} excerpt={excerpt}
        includeAccents={mode === 'full'} accentGain={accentAt} />)}
  </>;
}
