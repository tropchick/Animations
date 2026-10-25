import React, {useMemo} from 'react';
import * as THREE from 'three';

// Gradient sky dome and a flat ground, shared by the outdoor sets.
const vert = `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const frag = `uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uBottom; varying vec3 vDir;
void main(){ float h = vDir.y; vec3 c = h > 0.0 ? mix(uHorizon, uTop, pow(clamp(h,0.0,1.0), 0.6)) : mix(uHorizon, uBottom, clamp(-h*4.0,0.0,1.0)); gl_FragColor = vec4(c,1.0); }`;

export const Sky: React.FC<{top: string; horizon: string; bottom?: string; radius?: number}> = ({top, horizon, bottom, radius = 900}) => {
  const uniforms = useMemo(
    () => ({uTop: {value: new THREE.Color()}, uHorizon: {value: new THREE.Color()}, uBottom: {value: new THREE.Color()}}),
    [],
  );
  uniforms.uTop.value.set(top);
  uniforms.uHorizon.value.set(horizon);
  uniforms.uBottom.value.set(bottom ?? horizon);
  return (
    <mesh renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[radius, 32, 16]} />
      <shaderMaterial side={THREE.BackSide} depthWrite={false} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} />
    </mesh>
  );
};

export const Ground: React.FC<{color: string; size?: number; y?: number}> = ({color, size = 1600, y = 0}) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
    <planeGeometry args={[size, size]} />
    <meshStandardMaterial color={color} roughness={1} flatShading />
  </mesh>
);

type SunProps = {position: [number, number, number]; intensity?: number; color?: string; size?: number; target?: [number, number, number]};
// directional sun with a shadow box of +-size around the target
export const Sun: React.FC<SunProps> = ({position, intensity = 2.2, color = '#fff4e2', size = 20, target = [0, 0, 0]}) => {
  const obj = useMemo(() => new THREE.Object3D(), []);
  obj.position.set(...target);
  obj.updateMatrixWorld();
  return (
    <>
      <primitive object={obj} />
      <directionalLight
        position={[target[0] + position[0], target[1] + position[1], target[2] + position[2]]}
        target={obj}
        intensity={intensity}
        color={color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-size}
        shadow-camera-right={size}
        shadow-camera-top={size}
        shadow-camera-bottom={-size}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
    </>
  );
};
