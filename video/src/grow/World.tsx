import React, {useMemo} from 'react';
import * as THREE from 'three';
import {random} from 'remotion';
import {CameraRig, View} from './camera';
import {Cars, Ground, Houses, Kiosk, Mountains, Promenade, SEA_Y, Sea, WaterTower} from './town';
import {Pier} from './pier';
import {Boats, Bridge, Clouds, Gulls, Plane} from './bay';
import {Cast} from './cast';
import {Space} from './space';
import {V, gAt, lerp, ramp} from './time';

// ---------- Sky: blue that drains to black as the air is squeezed into a thin layer ----------

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const skyFragment = /* glsl */ `
  uniform float uBlack;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, 0.0, 1.0);
    vec3 sky = mix(vec3(0.85, 0.91, 0.96), vec3(0.42, 0.65, 0.88), pow(h, 0.55));
    // the zenith goes dark first, the horizon keeps a thin glow the longest
    float k = clamp(uBlack * 1.5 - (1.0 - h) * 0.5, 0.0, 1.0);
    vec3 space = mix(vec3(0.03, 0.04, 0.07), vec3(0.008, 0.01, 0.018), h);
    gl_FragColor = vec4(mix(sky, space, k), 1.0);
  }
`;

const Sky: React.FC<{black: number}> = ({black}) => {
  const uniforms = useMemo(() => ({uBlack: {value: 0}}), []);
  uniforms.uBlack.value = black;
  return (
    <mesh renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[7000, 32, 16]} />
      <shaderMaterial side={THREE.BackSide} depthWrite={false} fog={false} uniforms={uniforms} vertexShader={skyVertex} fragmentShader={skyFragment} />
    </mesh>
  );
};

const DayStars: React.FC<{opacity: number}> = ({opacity}) => {
  const geometry = useMemo(() => {
    const n = 1400;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = random(`ds-t-${i}`) * Math.PI * 2;
      const y = 0.03 + Math.pow(random(`ds-y-${i}`), 0.8) * 0.97;
      const r = Math.sqrt(1 - y * y);
      pos[i * 3] = Math.cos(t) * r * 6500;
      pos[i * 3 + 1] = y * 6500;
      pos[i * 3 + 2] = Math.sin(t) * r * 6500;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  if (opacity <= 0.001) return null;
  return (
    <points geometry={geometry} renderOrder={-9} frustumCulled={false}>
      <pointsMaterial color="#ffffff" size={2.6} sizeAttenuation={false} transparent opacity={opacity} depthWrite={false} fog={false} />
    </points>
  );
};

// The air pressed into a layer about 8.5 km / g thick: a pale film over the ground.
const AirLayer: React.FC<{v: number}> = ({v}) => {
  if (v < 41) return null;
  const h = Math.min(400, 8500 / gAt(v));
  return (
    <mesh position={[0, SEA_Y + h / 2, -800]} renderOrder={2}>
      <boxGeometry args={[2800, h, 3400]} />
      <meshBasicMaterial color="#a9cdf0" transparent opacity={0.16} depthWrite={false} fog={false} />
    </mesh>
  );
};

export const blackSky = (v: number) => ramp(v, 38.2, 41.8, (t) => t * t * (3 - 2 * t));

const CLEAR = new THREE.Color('#d7e5f0');
const DARK = new THREE.Color('#06080d');

export const World: React.FC<{v: number; view?: View}> = ({v, view}) => {
  if (v >= V.space) {
    return (
      <>
        <CameraRig v={v} view={view} />
        <Space v={v} />
      </>
    );
  }
  const black = blackSky(v);
  const fogColor = CLEAR.clone().lerp(DARK, black);
  return (
    <>
      <CameraRig v={v} view={view} />
      <Sky black={black} />
      <DayStars opacity={ramp(v, 39.2, 41.8)} />
      <fog attach="fog" args={[fogColor, 400, 4200]} color={fogColor} near={lerp(400, 3000, black)} far={lerp(4200, 12000, black)} />
      <hemisphereLight color="#e4f0fb" groundColor="#8a8678" intensity={lerp(1.0, 0.12, black)} />
      <ambientLight intensity={lerp(0.12, 0.05, black)} />
      <directionalLight
        position={[90, 150, 110]}
        color="#fff4dc"
        intensity={lerp(2.3, 2.8, black)}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-110}
        shadow-camera-right={110}
        shadow-camera-top={110}
        shadow-camera-bottom={-130}
        shadow-camera-near={1}
        shadow-camera-far={500}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      <Clouds v={v} />
      <Sea v={v} />
      <Ground v={v} />
      <Mountains v={v} />
      <Bridge v={v} />
      <Boats v={v} />
      <Plane v={v} />
      <Houses v={v} />
      <WaterTower v={v} />
      <Promenade v={v} />
      <Kiosk v={v} />
      <Cars v={v} />
      <Pier v={v} />
      <Gulls v={v} />
      <Cast v={v} />
      <AirLayer v={v} />
    </>
  );
};
