import {useLayoutEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {
  DataTexture, EquirectangularReflectionMapping, LinearFilter, MeshBasicMaterial,
  Object3D, PlaneGeometry,
} from 'three';
import {toyboxQuality, type ToyboxQuality, type ToyLightingPreset} from './theme';

type Point = [number, number, number];
type Directional = readonly [offset: Point, color: string, intensity: number];
type LightRig = {
  name: string;
  sky: string;
  bounce: string;
  ambient: number;
  key: Directional;
  fill: Directional;
  rim: Directional;
  reflection: number;
  shadow: number;
};

export const toyboxLighting = {
  sunnyToyCity: {
    name: 'Sunny Toy City', sky: '#D9EEFB', bounce: '#E8B594', ambient: 1.18,
    key: [[-4.5, 7, 5.5], '#FFF0D0', 2.35], fill: [[5, 2, 3], '#C6E8FD', 0.55],
    rim: [[3, 5, -6], '#FFE6AD', 1.48], reflection: 0.31, shadow: 0.86,
  },
  cozyInterior: {
    name: 'Cozy Interior', sky: '#EECDAB', bounce: '#A76973', ambient: 0.92,
    key: [[-3, 4, 4], '#FFE3B6', 2.48], fill: [[4, 1.5, 2], '#C2D9ED', 0.38],
    rim: [[4, 2, -4], '#FFB689', 0.83], reflection: 0.37, shadow: 0.74,
  },
  softStudio: {
    name: 'Soft Studio', sky: '#EFEDF3', bounce: '#D0BAD0', ambient: 1.35,
    key: [[-2, 6, 4], '#FFF3E5', 2.12], fill: [[4, 2, 4], '#DCF1F3', 0.55],
    rim: [[3, 4, -5], '#DCD1FF', 1.27], reflection: 0.44, shadow: 0.65,
  },
  cinematicNight: {
    name: 'Cinematic Night', sky: '#859DDC', bounce: '#373957', ambient: 0.72,
    key: [[-4, 6, 3], '#C5D9FF', 1.78], fill: [[4, 2, 3], '#E49A8C', 0.54],
    rim: [[2, 5, -4], '#7C94F2', 1.36], reflection: 0.21, shadow: 0.82,
  },
  neonTechnology: {
    name: 'Neon Technology', sky: '#8B9FC7', bounce: '#626587', ambient: 0.85,
    key: [[-3, 6, 4], '#DDE9FD', 1.89], fill: [[4, 2, 2], '#85DFC8', 0.56],
    rim: [[3, 4, -5], '#A895FF', 1.65], reflection: 0.33, shadow: 0.8,
  },
  spaceAdventure: {
    name: 'Space Adventure', sky: '#8B9CCB', bounce: '#525278', ambient: 0.85,
    key: [[-5, 5, 4], '#FFF0D0', 2.42], fill: [[4, 1, 4], '#B7CAFF', 0.42],
    rim: [[3, 5, -5], '#A1B7FF', 1.8], reflection: 0.23, shadow: 0.94,
  },
  colorfulLaboratory: {
    name: 'Colorful Laboratory', sky: '#DAF3EB', bounce: '#B3CED2', ambient: 1.22,
    key: [[-3, 6, 5], '#FFFAE9', 2.06], fill: [[3, 2, 4], '#BBD8FF', 0.48],
    rim: [[3, 4, -5], '#B0F3D7', 1.45], reflection: 0.38, shadow: 0.81,
  },
  dramaticClimax: {
    name: 'Dramatic Climax', sky: '#9C9FCC', bounce: '#826B8A', ambient: 0.98,
    key: [[-4, 4, 4], '#FFE3C2', 2.55], fill: [[4, 1, 3], '#A3CBE0', 0.47],
    rim: [[3, 4, -6], '#F1A9D4', 1.74], reflection: 0.29, shadow: 0.86,
  },
  goldenHour: {
    name: 'Golden Hour', sky: '#C6DAF7', bounce: '#D9A58D', ambient: 1.04,
    key: [[-6, 3.3, 5], '#FFE0AD', 2.51], fill: [[5, 2, 4], '#E4F0FF', 0.42],
    rim: [[5, 4, -5], '#FFD59B', 1.52], reflection: 0.3, shadow: 0.88,
  },
} as const satisfies Record<ToyLightingPreset, LightRig>;

function reflectionCards() {
  const width = 128;
  const height = 64;
  const data = new Uint8Array(width * height * 4);
  for (let v = 0; v < height; v++) {
    const latitude = Math.PI * ((v + 0.5) / height - 0.5);
    for (let u = 0; u < width; u++) {
      const longitude = Math.PI * 2 * ((u + 0.5) / width - 0.5);
      const keyCard = Math.max(0, Math.cos(longitude + 0.9)) ** 9
        * Math.max(0, Math.cos(latitude - 0.52)) ** 24;
      const rimCard = Math.max(0, Math.cos(longitude - 2.2)) ** 22
        * Math.max(0, Math.cos(latitude - 0.4)) ** 11;
      const ceiling = 12 + 22 * Math.max(0, Math.sin(latitude));
      const i = 4 * (v * width + u);
      data[i] = ceiling + 194 * keyCard + 112 * rimCard;
      data[i + 1] = ceiling + 185 * keyCard + 138 * rimCard;
      data[i + 2] = ceiling + 164 * keyCard + 176 * rimCard;
      data[i + 3] = 255;
    }
  }
  const texture = new DataTexture(data, width, height);
  texture.name = 'Toybox reflection cards';
  texture.mapping = EquirectangularReflectionMapping;
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

const reflection = reflectionCards();

function ReflectionCards({intensity}: {intensity: number}) {
  const scene = useThree((state) => state.scene);
  useLayoutEffect(() => {
    const previous = scene.environment;
    const previousIntensity = scene.environmentIntensity;
    scene.environment = reflection;
    scene.environmentIntensity = intensity;
    return () => {
      scene.environment = previous;
      scene.environmentIntensity = previousIntensity;
    };
  }, [scene, intensity]);
  return null;
}

/** Keep ground +Y up. Coverage is the half-width of the directional shadow frustum. */
export function ToyLighting({
  preset = 'sunnyToyCity',
  quality = 'balanced',
  center = [0, 0.4, 0],
  coverage = 9,
}: {
  preset?: ToyLightingPreset;
  quality?: ToyboxQuality;
  center?: Point;
  coverage?: number;
}) {
  const rig = toyboxLighting[preset];
  const budget = toyboxQuality[quality];
  const focus = useMemo(() => new Object3D(), []);
  function place([x, y, z]: Point): Point {
    return [center[0] + x, center[1] + y, center[2] + z];
  }
  const mapSize = budget.shadowMap || 256;
  return <>
    <primitive object={focus} position={center} />
    {budget.reflection && <ReflectionCards intensity={rig.reflection} />}
    <hemisphereLight args={[rig.sky, rig.bounce, rig.ambient]} />
    <directionalLight
      target={focus}
      position={place(rig.key[0])}
      color={rig.key[1]}
      intensity={rig.key[2]}
      castShadow={budget.shadowMap > 0}
      shadow-mapSize={[mapSize, mapSize]}
      shadow-radius={quality === 'final' ? 2.1 : 1.4}
      shadow-intensity={rig.shadow}
      shadow-bias={-0.00022}
      shadow-normalBias={0.025}
    >
      <orthographicCamera attach="shadow-camera" args={[-coverage, coverage, coverage, -coverage, 0.25, 20 + coverage]} />
    </directionalLight>
    <directionalLight target={focus} position={place(rig.fill[0])} color={rig.fill[1]} intensity={rig.fill[2]} />
    <directionalLight target={focus} position={place(rig.rim[0])} color={rig.rim[1]} intensity={rig.rim[2]} />
  </>;
}

function makeFootprint() {
  const size = 32;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (2 * x + 1) / size - 1;
      const v = (2 * y + 1) / size - 1;
      const density = Math.max(0, 1 - u * u - v * v) ** 2.6;
      const i = 4 * (y * size + x);
      data[i] = data[i + 1] = data[i + 2] = Math.round(255 * density);
      data[i + 3] = 255;
    }
  }
  const texture = new DataTexture(data, size, size);
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

const contactGeometry = new PlaneGeometry();
const contactMask = makeFootprint();

/** Use sparingly for grounding at the nearest contact, especially before enabling full shadows. */
export function ToyContactShadow({
  position = [0, 0.008, 0],
  size = [1, 0.65],
  opacity = 0.28,
  color = '#45333F',
}: {
  position?: Point;
  size?: readonly [number, number];
  opacity?: number;
  color?: string;
}) {
  const material = useMemo(() => new MeshBasicMaterial({
    color,
    alphaMap: contactMask,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    opacity: 0.28,
  }), [color]);
  useLayoutEffect(() => () => material.dispose(), [material]);
  useLayoutEffect(() => {
    material.opacity = opacity;
  }, [material, opacity]);
  return <mesh
    geometry={contactGeometry}
    material={material}
    position={position}
    rotation={[-Math.PI / 2, 0, 0]}
    scale={[size[0], size[1], 1]}
    dispose={null}
  />;
}
