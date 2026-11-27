import type {CSSProperties} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {DynamicCamera, type CameraAccent, type CameraShot} from './camera';
import {sampleEditTime} from './editing';
import {sampleEnvelope} from './audio';
import {
  AmbientParticles, EnergyRing, FocusEffect, LightSweep, MotionTrail, ParticleBurst,
  Shockwave, Sparkles,
} from './effects';
import {AnimatedCounter, AnimatedHUD, counterValue, KineticText} from './typography';
import {DEMO_CUES, DEMO_ENVELOPE, DemoScore} from './demo-score';
import {AMBER, Dish, ease, Landscape, Lens, lensPosition,
  MINT, Scout, Signal, SIGNAL, span, type Point} from './demo-world';
import {HyperMotionProvider, useHyperMotion, type ActiveEvent, type Intensity,
  compileIntensity, type IntensityKey, type MotionEvent, type Quality} from './timeline';

const INTENSITY: readonly IntensityKey[] = [
  {frame: 0, level: 'Minimal', channels: {text: 0.64, background: 0.48}},
  {frame: 42, level: 'Dynamic'},
  {frame: 108, level: 'Minimal'},
  {frame: 232, level: 'Hyper', channels: {particles: 0.28}},
  {frame: 299, level: 'Dynamic'},
  {frame: 338, level: 'Hyper', channels: {text: 0.55}},
  {frame: 395, level: 'Dynamic'},
  {frame: 456, level: 'Ultra', channels: {particles: 0.65, text: 0.58}},
  {frame: 542, level: 'Climax', channels: {camera: 0.8, text: 0.56}},
  {frame: 598, level: 'Dynamic'},
  {frame: 654, level: 'Minimal', channels: {text: 0.48}},
];

const scoreIntensity = compileIntensity(INTENSITY);

const EVENTS: readonly MotionEvent[] = [
  {id: 'lens-discovered', from: DEMO_CUES.target - 2, duration: 34, kind: 'focus'},
  {id: 'lens-guidance', from: 311, duration: 29, kind: 'trail', priority: 1},
  {id: 'lens-seated', from: DEMO_CUES.dock, duration: 34, kind: 'ring', priority: 2},
  {id: 'lens-glint', from: DEMO_CUES.dock + 1, duration: 29, kind: 'lens-spark', particles: 11},
  {id: 'antenna-wake', from: DEMO_CUES.charge - 2, duration: 73, kind: 'sweep'},
  {id: 'signal-release', from: DEMO_CUES.launch, duration: 43, kind: 'wave', priority: 3},
  {id: 'signal-catches-dust', from: DEMO_CUES.launch + 2, duration: 53, kind: 'signal-spark', particles: 47, priority: 2},
  {id: 'sky-replies', from: DEMO_CUES.received - 10, duration: 41, kind: 'sky-spark', particles: 9},
];

const MACRO_TIME = [
  {frame: 0, sourceFrame: 0},
  {frame: 313, sourceFrame: 313},
  {frame: 338, sourceFrame: 338},
  {frame: 345, sourceFrame: 340},
  {frame: 376, sourceFrame: 376},
  {frame: 719, sourceFrame: 719},
] as const;

const WIDE: readonly CameraShot[] = [
  {frame: 0, position: [-1.5, 2.32, 8.95], target: [-2.4, 1.35, -0.42], fov: 38},
  {frame: 295, position: [0.64, 2.22, 8.35], target: [-0.63, 1.47, -0.63], fov: 38},
  {frame: 542, position: [1.01, 2.22, 8.35], target: [0.06, 2.0, -0.9], fov: 40},
  {frame: 650, position: [1.01, 2.22, 8.35], target: [0.28, 3.08, -3.5], fov: 43},
  {frame: 719, position: [1.01, 2.22, 8.35], target: [0.18, 2.48, -2], fov: 41},
];

const HERO_SHOTS: readonly CameraShot[] = [
  {frame: 0, position: [-4.54, 1.82, 5.88], target: [-4.17, 1.4, 1.69], fov: 40},
  {frame: 64, position: [-4.14, 1.78, 5.48], target: [-4.19, 1.39, 1.66], fov: 38, ease: 'smooth'},
  {frame: 132, position: [-4.39, 1.82, 6.45], target: [-3.57, 1.24, 1.2], fov: 42, ease: 'spline'},
  {frame: 226, position: [-2.43, 2.13, 7.0], target: [-1.81, 1.42, -0.10], fov: 43, ease: 'spline'},
  {frame: 237, position: [2.43, 2.22, 6.1], target: [-0.69, 1.52, -0.44], fov: 45, cut: true},
  {frame: 302, position: [1.36, 1.82, 4.65], target: [-0.14, 1.28, -0.09], fov: 36},
  {frame: 310, position: [-0.72, 1.65, 4.85], target: [0.045, 1.22, 0.03], fov: 34, cut: true},
  {frame: 381, position: [-0.70, 1.53, 4.48], target: [0.09, 1.22, -0.02], fov: 33, ease: 'smooth'},
  {frame: 391, position: [1.06, 2.85, 7.5], target: [-0.05, 1.66, -0.66], fov: 44, cut: true},
  {frame: 515, position: [0.63, 2.42, 6.9], target: [-0.01, 1.88, -0.81], fov: 43, orbit: true},
  {frame: 541, position: [0.51, 2.52, 6.10], target: [0.28, 2.1, -0.87], fov: 43, ease: 'smooth'},
  {frame: 542, position: [0.78, 2.45, 7.30], target: [0.17, 2.75, -1.6], fov: 48, cut: true},
  {frame: 590, position: [0.24, 2.65, 6.92], target: [0.22, 3.95, -4.4], fov: 47, ease: 'spline'},
  {frame: 641, position: [-0.59, 2.41, 5.34], target: [0.02, 4.39, -6.52], fov: 40, ease: 'spline'},
  {frame: 653, position: [-1.32, 1.97, 5.6], target: [-0.60, 1.48, -0.23], fov: 42, cut: true},
  {frame: 719, position: [-1.67, 1.91, 5.51], target: [-0.24, 1.58, -0.45], fov: 42},
];

const ACCENTS: readonly CameraAccent[] = [
  {kind: 'punch', frame: 335, duration: 23, strength: 0.43},
  {kind: 'shake', frame: 541, duration: 34, strength: 0.45},
];

const LOOK: Point = [0.64, 2.21, -1.67];
const SKY_SPARK: Point = [1.2, 6.6, -9.1];
const GRAPHIC = {finish: 'graphic', color: MINT, accent: AMBER} as const;

function DemoEffect({entry, frame, sourceFrame, intensity, trailSamples}: {
  entry: ActiveEvent; frame: number; sourceFrame: number; intensity: Intensity; trailSamples: number;
}) {
  const {event, seed, particleBudget} = entry;
  const time = {frame, from: event.from, duration: event.duration, seed};
  const lens = lensPosition(sourceFrame);
  switch (event.kind) {
    case 'focus':
      return <FocusEffect {...time} position={[lens[0], lens[1], lens[2] + 0.06]} theme={GRAPHIC}
        size={0.31} opacity={0.75} color={MINT} />;
    case 'trail':
      return <MotionTrail {...time} sample={(sampleFrame) => lensPosition(sampleEditTime(sampleFrame, MACRO_TIME))}
        theme={GRAPHIC} size={0.071} opacity={0.55} budget={trailSamples} />;
    case 'ring':
      return <EnergyRing {...time} position={lens} direction={[0, 0.02, 1]} size={0.42}
        opacity={0.69} color={MINT} theme={GRAPHIC} />;
    case 'lens-spark':
      return <Sparkles {...time} position={lens} size={0.43} color={AMBER} budget={particleBudget}
        opacity={0.9} theme={GRAPHIC} />;
    case 'sweep':
      return <LightSweep {...time} position={LOOK} size={1.10} color={MINT} theme={GRAPHIC}
        opacity={0.24 * intensity.particles} />;
    case 'wave':
      return <Shockwave {...time} position={SIGNAL} size={2.35} rings={2} thickness={0.52} color={MINT} direction={[-0.18, 0.94, -0.24]}
        theme={GRAPHIC} opacity={0.54} motion="soft" />;
    case 'signal-spark':
      return <ParticleBurst {...time} position={SIGNAL} count={47} budget={particleBudget}
        theme={GRAPHIC} direction={[0.04, 1, -0.15]} color={MINT} size={1.25} opacity={0.63} />;
    case 'sky-spark':
      return <Sparkles {...time} position={SKY_SPARK} size={0.65} color={AMBER} budget={particleBudget}
        opacity={0.72} theme={GRAPHIC} />;
    default:
      return null;
  }
}

const titleFont = "'Spectral', Georgia, serif";
const labelFont = "'Inter', sans-serif";
const ink = '#fff0d7';
const caption: CSSProperties = {
  position: 'absolute', left: 85, right: 208,
  color: ink, fontFamily: labelFont, textShadow: '0 3px 20px #120f2c', fontWeight: 600,
};
const kicker: CSSProperties = {
  font: `600 26px ${labelFont}`, letterSpacing: '0.22em', color: '#fae2be',
};

function DemoTypography({frame, amount}: {frame: number; amount: number}) {
  const titleAlpha = 1 - ease(frame, 73, 100);
  const chargeAlpha = ease(frame, 399, 423) * (1 - ease(frame, 525, 539));
  const resultAlpha = ease(frame, 654, 669) * (1 - ease(frame, 702, 720));
  return <>
    {titleAlpha > 0 && <div style={{...caption, top: 263, opacity: titleAlpha}}>
      <div style={kicker}>ОБСЕРВАТОРИЯ</div>
      <div style={{fontFamily: titleFont, fontSize: 99, lineHeight: 0.91, letterSpacing: '-0.046em',
        fontWeight: 500, marginTop: 15}}>
        <KineticText frame={frame} from={0} duration={24} intensity={amount}>Сигнал после<br />заката</KineticText>
      </div>
    </div>}
    {chargeAlpha > 0 && <div style={{...caption, top: 265, opacity: chargeAlpha}}>
      <AnimatedHUD label="Заряд" progress={counterValue(frame, 404, 123, 0, 1)} accent="#c8ffe6"
        style={{width: 249, padding: '11px 16px 14px', border: '1px solid #b9ffe13d', borderRadius: 8,
          fontFamily: labelFont, color: '#fff0d7', background: '#17172dbf'}}>
        <AnimatedCounter frame={frame} start={404} duration={123} from={0} to={100} suffix="%"
          style={{fontFamily: titleFont, color: '#d2ffeb', lineHeight: 1, fontSize: 45}} />
      </AnimatedHUD>
    </div>}
    {resultAlpha > 0 && <div style={{...caption, top: 263, opacity: resultAlpha}}>
      <div style={{fontFamily: titleFont, fontSize: 82, lineHeight: 0.91, letterSpacing: '-0.046em'}}>
        <KineticText frame={frame} from={654} duration={27} intensity={amount}>
          Сигнал<br />принят.
        </KineticText>
      </div>
    </div>}
  </>;
}

/** Three canvas stays mounted across cuts so lighting and objects retain identity. */
function Observatory({showTitles, comparisonLabel}: {showTitles: boolean; comparisonLabel?: string}) {
  const {width, height, fps} = useVideoConfig();
  const {frame, seed, enabled, active, intensity, budget, quality} = useHyperMotion();
  const poseFrame = sampleEditTime(frame, MACRO_TIME);
  const rollCut = Math.sin(Math.PI * span(frame, 229, 245)) ** 2;
  const zoomCut = Math.sin(Math.PI * span(frame, 383, 400)) ** 2;
  const wipe = ease(frame, 536, 550);
  const filming = enabled ? Math.max(rollCut, zoomCut) : 0;
  const wipeActive = enabled && frame > 536 && frame < 550;
  const cameraStyle: CSSProperties = {
    top: 0, left: 0, width: '100%', height: '100%',
    transform: `translateX(${enabled ? (frame < 237 ? 1 : -1) * rollCut * 7 * intensity.transitions : 0}%) scale(${1
      + filming * (0.08 + 0.10 * intensity.transitions)})`,
    transformOrigin: '52% 47%',
    filter: filming > 0.025 ? `blur(${filming * 5.5 * intensity.transitions}px)` : undefined,
  };
  const filmLight = (0.21 + 0.12 * sampleEnvelope(DEMO_ENVELOPE, frame, fps) * intensity.audio)
    * (ease(frame, 518, 552) - ease(frame, 569, 604));
  return <AbsoluteFill style={{overflow: 'hidden', background:
    'linear-gradient(180deg, #121730 5%, #202342 37%, #50516e 57%, #ad7580 78%, #daccaa 100%)'}}>
    <AbsoluteFill style={cameraStyle}>
      <ThreeCanvas width={width} height={height} dpr={quality === 'draft' ? 0.55 : 1}
        gl={{alpha: true, antialias: quality === 'final'}} camera={{near: 0.055, far: 128}}>
        <fog attach="fog" args={['#725a74', 13, 50]} />
        <hemisphereLight args={['#d4e5ff', '#bf756d', 1.65]} />
        <directionalLight color="#ffc69a" intensity={2.3} position={[-4.8, 5.5, 3.5]} />
        <directionalLight color="#94ceef" intensity={0.95} position={[4.8, 4.5, -5]} />
        <pointLight position={[0.64, 2.7, -1.43]} intensity={filmLight * 50} distance={4} color="#75ffcf" />
        <DynamicCamera frame={frame} shots={enabled ? HERO_SHOTS : WIDE} accents={enabled ? ACCENTS : []}
          intensity={intensity.camera} drift={enabled ? 0.36 : 0} />
        <Landscape frame={poseFrame} motion={enabled ? 1 + intensity.background * 0.28 : 1} />
        <Dish frame={poseFrame} />
        <Scout frame={poseFrame} />
        <Lens frame={poseFrame} />
        <Signal frame={poseFrame} enhanced={enabled} />
        {enabled && <AmbientParticles frame={frame} seed={seed} size={0.11} position={[-0.4, 1.15, -0.9]}
          bounds={[10, 3.2, 5]} count={quality === 'draft' ? 7 : 13} opacity={intensity.background * 0.36}
          color="#deae93" theme={GRAPHIC} />}
        {active.map((entry) => <DemoEffect key={entry.event.id} entry={entry} frame={frame}
          sourceFrame={poseFrame} trailSamples={budget.trailSamples} intensity={intensity} />)}
      </ThreeCanvas>
    </AbsoluteFill>
    {wipeActive && <div style={{position: 'absolute', left: `${-142 + wipe * 300}%`, width: '154%', height: '146%',
      top: '-23%', transform: 'rotate(15deg)', borderRadius: '48% 33% 31% 46%',
      background: 'linear-gradient(90deg, #688583 1%, #bfc8a8 4%, #548687 6%, #233a4c 10%, #222b43 78%, #4b686f 100%)'}} />}
    <AbsoluteFill style={{pointerEvents: 'none', background:
      'radial-gradient(ellipse at 50% 43%, transparent 44%, #13132753 100%)'}} />
    {showTitles && <DemoTypography frame={frame} amount={intensity.text} />}
    {comparisonLabel && <div style={{...caption, top: 232, fontSize: 32, color: '#fff0d7'}}>
      <span style={{display: 'inline-block', marginRight: 14, width: 13, height: 13, borderRadius: 13,
        backgroundColor: enabled ? MINT : AMBER, boxShadow: '0 0 18px #31544c'}} />
      {comparisonLabel}
    </div>}
  </AbsoluteFill>;
}

export type ObservatoryDemoProps = {quality?: Quality; seed?: number; withAudio?: boolean};
export function ObservatoryDemo({quality = 'final', seed = 915, withAudio = true}: ObservatoryDemoProps) {
  return <HyperMotionProvider events={EVENTS} intensity={INTENSITY} quality={quality} seed={seed}>
    <Observatory showTitles />
    {withAudio && <DemoScore accentGain={(frame) => 0.66 + 0.34 * scoreIntensity(frame).audio} />}
  </HyperMotionProvider>;
}

export function ObservatoryComparison({quality = 'final', seed = 915, withAudio = true}: ObservatoryDemoProps) {
  const frame = useCurrentFrame();
  const duration = 180;
  const clipStart = 288;
  const enhanced = frame >= duration;
  const source = clipStart + frame % duration;
  const label = enhanced ? 'С hyper-motion-3d' : 'Исходная сцена';
  return <HyperMotionProvider frame={source} enabled={enhanced} events={EVENTS} intensity={INTENSITY}
    quality={quality} seed={seed}>
    <Observatory showTitles={enhanced} comparisonLabel={label} />
    {withAudio && [0, duration].map((from) => (
      <Sequence key={from} from={from} durationInFrames={duration} layout="none">
        <DemoScore accents={false} trimBefore={clipStart} trimAfter={clipStart + duration} />
      </Sequence>
    ))}
  </HyperMotionProvider>;
}
