import React, {useMemo} from 'react';
import * as THREE from 'three';
import {CameraRig, View} from './camera';
import {FarCity, Billboard, Ground, LowRow, Metro, TOWERS, Tower, dust01} from './city';
import {Cast} from './cast';
import {Cafe, Cars, Debris, Furniture, Pigeons, Rubble, Trees, YellowBus} from './street';
import {Cloud} from '../gravity/props';
import {V, lerp, ramp, windKmh} from './time';

// ---------- Sky: blue gradient that fills with dust as the wind grows ----------

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const skyFragment = /* glsl */ `
  uniform float uDust;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, 0.0, 1.0);
    vec3 sky = mix(vec3(0.84, 0.90, 0.95), vec3(0.45, 0.66, 0.86), pow(h, 0.6));
    vec3 dust = mix(vec3(0.78, 0.70, 0.58), vec3(0.62, 0.56, 0.48), pow(h, 0.8));
    gl_FragColor = vec4(mix(sky, dust, uDust), 1.0);
  }
`;

const Sky: React.FC<{dust: number}> = ({dust}) => {
  const uniforms = useMemo(() => ({uDust: {value: 0}}), []);
  return (
    <mesh renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[1800, 32, 16]} />
      <shaderMaterial side={THREE.BackSide} depthWrite={false} fog={false} uniforms={uniforms} uniforms-uDust-value={dust} vertexShader={skyVertex} fragmentShader={skyFragment} />
    </mesh>
  );
};

const CLEAR = new THREE.Color('#d6e5ef');
const DUST = new THREE.Color('#bba98c');

// Dust in the air: builds with the wind, hangs through the zero, settles after the restart.
export const dustAt = (v: number) => {
  if (v < V.restart) return dust01(windKmh(v));
  return dust01(1280) * (1 - ramp(v, V.restart + 3, V.restored + 2.5));
};

const Clouds: React.FC<{v: number}> = ({v}) => {
  // clouds race east with the wind, and are gone by the climax
  const w = windKmh(v);
  const drift = v < V.zero ? v * 1.2 + Math.max(0, v - 14) ** 2 * 1.4 : 0;
  if (w > 600 && v < V.restored) return null;
  const list: [number, number, number, number][] = [
    [-140, 150, -420, 14],
    [60, 170, -520, 18],
    [220, 140, -380, 12],
    [-300, 160, -600, 20],
  ];
  return (
    <>
      {list.map(([x, y, z, s], i) => (
        <Cloud key={i} position={[x + (v >= V.restored ? 0 : drift), y, z]} size={s} seed={i + 1} />
      ))}
    </>
  );
};

export const World: React.FC<{v: number; view?: View}> = ({v, view}) => {
  const dust = dustAt(v);
  const fogColor = CLEAR.clone().lerp(DUST, dust);
  const near = lerp(160, 20, dust);
  const far = lerp(1400, 240, dust);
  const sun = lerp(2.4, 1.3, dust);
  return (
    <>
      <CameraRig v={v} view={view} />
      <Sky dust={dust} />
      <fog attach="fog" args={[fogColor, near, far]} color={fogColor} near={near} far={far} />
      <hemisphereLight color="#e4f0fb" groundColor="#8a8678" intensity={lerp(1.0, 0.8, dust)} />
      <ambientLight intensity={0.12} />
      <directionalLight
        position={[60, 120, 70]}
        color={dust > 0.3 ? '#ffe2b8' : '#fff4dc'}
        intensity={sun}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={140}
        shadow-camera-bottom={-80}
        shadow-camera-near={1}
        shadow-camera-far={420}
        shadow-bias={-0.0005}
        shadow-normalBias={0.05}
      />
      <Clouds v={v} />
      <Ground />
      <FarCity v={v} />
      {TOWERS.map((t) => (
        <Tower key={t.id} t={t} v={v} />
      ))}
      <Billboard v={v} />
      <LowRow v={v} />
      <Metro v={v} />
      <Furniture v={v} />
      <Trees v={v} />
      <Cafe v={v} />
      <Cars v={v} />
      <YellowBus v={v} />
      <Pigeons v={v} />
      <Cast v={v} />
      <Debris v={v} />
      <Rubble v={v} />
    </>
  );
};
