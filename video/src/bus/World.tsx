import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {CameraRig, View} from '../slime/camera';
import {useEnvironment} from '../slime/World';
import {Spot} from '../last/parts';
import {Box, Cyl, Glow} from '../slime/parts';
import {REVEAL, V3, ramp, shotAt, smooth} from './cues';
import {viewAt} from './camera';
import {GIRL, GRANNY, GUY, Voxel} from './Voxel';
import {BusInterior, Outside} from './Bus';
import {STOP_DIST, WALL_X, busDist, doorOpen, girl, granny, grannyGlint, grannyKnitting, guy, guyHasBag} from './action';

const mm = (color: string, rough = 0.85) => ({color, rough, env: 0.2});

// her knitting: two needles, a red piece of work hanging from them, the ball of yarn on the bench
const Knitting: React.FC = () => (
  <group>
    <Box size={[0.2, 0.14, 0.02]} position={[0.0, -0.06, 0.03]} m={mm('#b0342c', 0.95)} />
    <Cyl r={0.006} h={0.32} position={[0.04, 0.02, 0.05]} rotation={[0, 0, 1.2]} m={mm('#d8d2c4', 0.4)} seg={6} />
    <Cyl r={0.006} h={0.32} position={[-0.04, 0.02, 0.06]} rotation={[0, 0, -1.2]} m={mm('#d8d2c4', 0.4)} seg={6} />
  </group>
);

// her shopping bag: a beige tote with two handles
const Bag: React.FC = () => (
  <group>
    <Box size={[0.3, 0.3, 0.14]} position={[0, -0.24, 0]} m={mm('#c9b08a', 0.9)} />
    <Box size={[0.02, 0.12, 0.02]} position={[0.07, -0.05, 0]} m={mm('#8a6c4a')} />
    <Box size={[0.02, 0.12, 0.02]} position={[-0.07, -0.05, 0]} m={mm('#8a6c4a')} />
    <Box size={[0.16, 0.02, 0.02]} position={[0, 0.0, 0]} m={mm('#8a6c4a')} />
    {/* green onion tops and a loaf sticking out */}
    <Box size={[0.05, 0.12, 0.04]} position={[0.08, -0.06, 0.02]} m={mm('#5f8a3a')} />
    <Box size={[0.1, 0.07, 0.09]} position={[-0.06, -0.08, 0.0]} rotation={[0, 0, 0.3]} m={mm('#c98b45')} />
  </group>
);

// floating warm specks in front of the lens during the reveal, like out-of-focus lights in a romance
const Bokeh: React.FC<{v: number; center: V3}> = ({v, center}) => {
  const pts = useMemo(() => {
    const out: [number, number, number, number][] = [];
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 30; i++) out.push([r() * 1.4 - 0.7, r() * 1.0 - 0.4, r() * 0.6 - 0.9, r()]);
    return out;
  }, []);
  const k = smooth(ramp(v, REVEAL, REVEAL + 0.8)) * (1 - smooth(ramp(v, 10.9, 11.2)));
  if (k <= 0) return null;
  return (
    <group position={center}>
      {pts.map(([x, y, z, ph], i) => (
        <mesh key={i} position={[x + 0.05 * Math.sin(v * 0.7 + ph * 6), y + 0.06 * Math.sin(v * 0.5 + ph * 9) + (v - REVEAL) * 0.03, z]}>
          <sphereGeometry args={[0.006 + 0.01 * ph, 8, 6]} />
          <meshBasicMaterial color={ph > 0.6 ? '#ffd29a' : '#ff9a5a'} transparent opacity={k * (0.25 + 0.35 * ph)} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
};

export const World: React.FC<{v: number; view?: (v: number) => View; cover?: boolean}> = ({v, view = viewAt, cover = false}) => {
  const env = useEnvironment();
  const scene = useThree((st) => st.scene);
  const fog = useMemo(() => new THREE.Fog('#0a0b11', 7, 34), []);
  const bg = useMemo(() => new THREE.Color('#07080c'), []);
  scene.environment = env;
  scene.environmentIntensity = 0.35;
  scene.fog = fog;
  scene.background = bg;

  const shot = cover ? 'title' : shotAt(v).name;
  const dist = busDist(v);
  const rel = dist - STOP_DIST;
  const door = doorOpen(v);
  const G = guy(v);
  const N = granny(v);
  const R = girl(v);
  // people who already stepped off stay on the kerb while the bus pulls away (bus coordinates move with the bus)
  const off = (p: V3): V3 => (p[0] > WALL_X + 0.2 && rel > 0 ? [p[0], p[1], p[2] - rel] : p);
  const reveal = shot === 'reveal';
  const warmBack = reveal ? 1 : 0.55;

  return (
    <>
      <CameraRig v={v} view={view} />
      <hemisphereLight args={['#5b6680', '#2a1d14', 0.45]} />
      <ambientLight intensity={0.08} />
      {/* ceiling light along the bus, warm */}
      {[0.2, 2.2, 4.2].map((z) => (
        <pointLight key={z} position={[0, 2.12, z]} color="#ffc68c" intensity={2.2} distance={4.5} decay={1.6} />
      ))}
      {/* key light from above-front onto the faces (shadows) */}
      <Spot position={[0.9, 2.2, 3.9]} target={[0, 1.2, 0.8]} color="#ffd2a0" intensity={14} distance={9} angle={0.75} penumbra={0.8} shadow mapSize={1024} />
      {/* warm orange back light through the rear window: the rim around the grandma */}
      <pointLight position={[0.35, 1.85, -0.95]} color="#ff8a3a" intensity={4.5 * warmBack} distance={2.6} decay={1.5} />
      <pointLight position={[-0.5, 1.6, -0.95]} color="#ff7a30" intensity={2.4 * warmBack} distance={2.4} decay={1.5} />
      {/* cool city light from the left windows */}
      <pointLight position={[-1.8, 1.6, 2.5 + Math.sin(dist * 0.4) * 0.6]} color="#7d95c8" intensity={1.6} distance={4} decay={1.5} />
      {/* passing street lamps sweep orange light through the right windows while the bus moves */}
      <pointLight position={[2.0, 2.2, (((-dist * 1.0) % 7) + 7) % 7 - 0.5]} color="#ffad5a" intensity={v < 7 || v > 24.6 ? 3.5 : 0} distance={4.5} decay={1.5} />
      {/* the stop lamp outside the door */}
      <pointLight position={[2.9, 3.0, 1.0 - Math.max(0, rel)]} color="#ffb56a" intensity={6} distance={7} decay={1.4} />
      {reveal ? <pointLight position={[0.3, 1.55, 0.4]} color="#ffd8b0" intensity={0.9} distance={1.6} decay={1.5} /> : null}

      <BusInterior door={door} lightsOn={1} />
      <Outside dist={dist} />
      {/* the rear window glow behind the bench */}
      <Glow size={[2.4, 0.9, 0.01]} position={[0, 1.52, -1.2]} color={reveal ? '#a8522a' : '#5a3020'} power={0.55} />

      <Voxel look={GUY} position={off(G.pos)} rotation={G.rot} pose={G.pose} face={G.face} rightHand={guyHasBag(v) ? <Bag /> : null} />
      <Voxel look={GIRL} position={R.pos} rotation={R.rot} pose={R.pose} face={R.face} />
      <Voxel look={GRANNY} position={off(N.pos)} rotation={N.rot} pose={N.pose} face={N.face} glint={grannyGlint(v)} rightHand={grannyKnitting(v) ? <Knitting /> : null} />
      {/* the bag waits on the bench next to her, the ball of yarn too */}
      {!guyHasBag(v) ? (
        <group position={[0.42, 0.945, -0.36]}>
          <Bag />
        </group>
      ) : null}
      {grannyKnitting(v) ? (
        <mesh position={[-0.36, 0.55 + 0.06, -0.32]} castShadow>
          <icosahedronGeometry args={[0.06, 0]} />
          <meshStandardMaterial color="#b0342c" roughness={0.95} flatShading />
        </mesh>
      ) : null}
      <Bokeh v={v} center={[0.0, 1.5, 0.4]} />
    </>
  );
};
