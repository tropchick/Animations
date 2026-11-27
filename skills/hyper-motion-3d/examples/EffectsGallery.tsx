import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {ReactNode} from 'react';
import {
  AmbientParticles, AnimatedArrow, AtmosphericEffect, CartoonSmoke, DistortionEffect, DustCloud,
  EnergyAura, EnergyRing, FloatingIcon, FocusEffect, ImpactEffect, LightSweep, MotionSmear, MotionTrail,
  ObjectHighlight, ParticleBurst, Shockwave, Sparkles, SpeedLines, StylizedMotionBlur, type EffectProps,
} from './effects';
import type {Vec3} from './math';

export type GalleryProps = {theme?: 'low-poly' | 'clay'};
const accents = ['#80e4d5', '#ffd991', '#fa987e', '#b3baf8'];
const eye: Vec3 = [0, 0, 20];
const forwards: Vec3 = [0, 0, 1];

function Anchor({color = '#3f6377', scale = 0.45, position = [0, 0, 0]}: {
  color?: string;
  scale?: number;
  position?: Vec3;
}) {
  return <mesh position={position} scale={scale} rotation={[0.25, 0.2, 0.15]}>
    <icosahedronGeometry args={[1, 0]} />
    <meshStandardMaterial color={color} roughness={0.8} flatShading />
  </mesh>;
}

const sample = (frame: number): Vec3 => {
  const t = Math.max(0, Math.min(1, frame / 70));
  return [-1.04 + 2.35 * t, 0.33 * Math.sin(t * Math.PI * 2 - 1.2), 0];
};

type Card = {
  title: string;
  description: string;
  draw: (props: EffectProps, frame: number) => ReactNode;
};

const cards: Card[] = [
  {title: 'Speed lines', description: 'Directional acceleration', draw: (p) => <>
    <Anchor scale={0.37} /><SpeedLines {...p} count={22} size={0.85} position={[-0.48, 0.02, 0]}
      direction={[1, 0.17, 0]} />
  </>},
  {title: 'Motion trail', description: 'Sampled 3D path', draw: (p, f) => <>
    <MotionTrail {...p} sample={sample} step={3.7} size={0.18} /><Anchor position={sample(f)} color={p.color} scale={0.22} />
  </>},
  {title: 'Shockwave', description: 'Expanding fronts', draw: (p) => <>
    <Anchor scale={0.23} /><Shockwave {...p} size={1.31} direction={forwards} rings={3} />
  </>},
  {title: 'Particle burst', description: 'Ballistic chips', draw: (p) =>
    <ParticleBurst {...p} position={[0, -0.44, 0]} size={1.52} count={34} spread={136} />},
  {title: 'Ambient particles', description: 'Low-contrast drift', draw: (p) =>
    <AmbientParticles {...p} count={45} bounds={[2.6, 1.87, 0.4]} size={1.4} />},
  {title: 'Dust cloud', description: 'Ground-hugging volume', draw: (p) =>
    <DustCloud {...p} color="#d6a884" count={18} size={1.25} position={[0, -0.35, 0]} />},
  {title: 'Cartoon smoke', description: 'Soft ascending puffs', draw: (p) =>
    <CartoonSmoke {...p} color="#c6c8dc" count={12} size={1.23} spread={58} position={[0, -0.61, 0]} />},
  {title: 'Energy ring', description: 'Oriented revolving arcs', draw: (p) => <>
    <Anchor /><EnergyRing {...p} size={0.87} direction={[0.19, 0.48, 1]} />
  </>},
  {title: 'Energy aura', description: 'Silhouette accent', draw: (p) => <>
    <Anchor scale={0.68} /><EnergyAura {...p} size={0.82} />
  </>},
  {title: 'Impact effect', description: 'Pressure and fragments', draw: (p) =>
    <ImpactEffect {...p} count={21} size={1.29} direction={forwards} spread={265} />},
  {title: 'Object highlight', description: 'Framing brackets', draw: (p) => <>
    <Anchor scale={0.59} /><ObjectHighlight {...p} size={0.68} />
  </>},
  {title: 'Sparkles', description: 'Small specular accents', draw: (p) =>
    <Sparkles {...p} count={16} spread={280} size={1.55} />},
  {title: 'Motion smear', description: 'Stretched intermediate pose', draw: (p, f) => <>
    <MotionSmear {...p} sample={sample} size={0.45} step={21} opacity={0.65} />
    <Anchor position={sample(f)} color={p.color} scale={0.22} />
  </>},
  {title: 'Distortion', description: 'Bounded ripple field', draw: (p) =>
    <DistortionEffect {...p} size={1.06} />},
  {title: 'Light sweep', description: 'Traveling surface highlight', draw: (p) => <>
    <mesh>
      <sphereGeometry args={[0.83, 28, 16]} /><meshStandardMaterial color="#37496a" roughness={0.72} />
    </mesh>
    <LightSweep {...p} size={0.83} />
  </>},
  {title: 'Atmosphere', description: 'Backlit haze card', draw: (p) => <>
    <AtmosphericEffect {...p} color="#e0c599" size={1.02} kind="rays" position={[0, 0, 0.2]} />
    <Anchor position={[-0.63, -0.42, 0.09]} scale={0.41} />
    <Anchor position={[0.56, -0.29, 0.03]} scale={0.58} />
  </>},
  {title: 'Motion blur', description: 'Weighted pose echoes', draw: (p, f) => <>
    <StylizedMotionBlur {...p} sample={sample} size={0.5} step={5.3} samples={5} />
    <Anchor position={sample(f)} color={p.color} scale={0.24} />
  </>},
  {title: 'Focus effect', description: 'Contracting attention arcs', draw: (p) => <>
    <Anchor scale={0.41} /><FocusEffect {...p} size={0.65} />
  </>},
  {title: 'Animated arrow', description: 'World-space pointer', draw: (p) => <>
    <Anchor position={[0, -0.42, 0]} scale={0.27} />
    <AnimatedArrow {...p} position={[0, 0.47, 0]} direction={[0, -1, 0]} size={1.02} />
  </>},
  {title: 'Floating icon', description: 'Sculptural callout', draw: (p) =>
    <FloatingIcon {...p} icon="star" size={1.6} position={[0, -0.4, 0]} />},
];

const titleFont = 'Arial, sans-serif';
const gridTop = 152;
const gridBottom = 88;

export function EffectsGallery({theme = 'low-poly'}: GalleryProps) {
  const {width, height} = useVideoConfig();
  const frame = useCurrentFrame();
  const rowHeight = (height - gridTop - gridBottom) / 5;
  const scale = width / 12;
  return <AbsoluteFill style={{background: '#121c2a', fontFamily: titleFont, color: '#e6f1f5'}}>
    <div style={{position: 'absolute', left: 44, right: 44, top: 31, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
      <strong style={{fontSize: 55, fontWeight: 800, letterSpacing: -1.8}}>Motion in three dimensions</strong>
      <span style={{fontSize: 20, color: '#a8bdc9'}}>{theme === 'clay' ? 'Clay finish' : 'Low-poly finish'}</span>
    </div>
    <div style={{position: 'absolute', left: 25, right: 25, top: 115, bottom: gridBottom - 6, border: '1px solid #3a5061', borderRadius: 20,
      background: 'linear-gradient(138deg, #223749 0%, #172837 55%, #182331 100%)'}} />
    {cards.map((card, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      return <div key={card.title} style={{
        position: 'absolute', left: column * width / 4 + 31, top: gridTop + row * rowHeight, width: width / 4 - 62,
        height: rowHeight - 38, borderBottom: '1px solid #3a5061',
      }} />;
    })}
    <ThreeCanvas width={width} height={height} orthographic camera={{position: eye, zoom: scale, near: 0.1, far: 50}}>
      <hemisphereLight args={['#e8f6ff', '#71695b', 1.9]} />
      <directionalLight position={[-3, 6, 12]} color="#fff3dc" intensity={2.0} />
      {cards.map((card, index) => {
        const x = -4.5 + 3 * (index % 4);
        const y = (height / 2 - gridTop - Math.floor(index / 4) * rowHeight - rowHeight * 0.38) / scale;
        return <group key={card.title} position={[x, y, 0]}>
          {card.draw({frame, duration: 70, color: accents[index % accents.length], theme}, frame)}
        </group>;
      })}
    </ThreeCanvas>
    {cards.map((card, index) => <div key={card.title} style={{
      position: 'absolute', left: (index % 4) * width / 4 + 43,
      top: gridTop + (Math.floor(index / 4) + 1) * rowHeight - 105,
    }}>
      <div style={{fontSize: 27, fontWeight: 700, color: accents[index % accents.length]}}>{card.title}</div>
      <div style={{fontSize: 18, marginTop: 7, color: '#b7c6d1'}}>{card.description}</div>
    </div>)}
  </AbsoluteFill>;
}
