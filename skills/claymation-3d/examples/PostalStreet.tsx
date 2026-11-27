import {useEffect, useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {BufferGeometry, CanvasTexture, DoubleSide, Float32BufferAttribute, SRGBColorSpace} from 'three';
import {CLAY_STRIDE, ClayCharacter} from './character';
import {ClayCamera, ClayContactShadow, ClayFocus, ClayEnvironment, ClayLighting} from './cinema';
import {ClayDetailContext, type ClayDetail} from './surface';
import {ClayStreet} from './street';
import {easeBetween, seededRandom, stopMotionTiming, type MotionMode} from './timing';

type Point = [number, number, number];
type Props = {mode?: MotionMode; quality?: ClayDetail; seed?: number};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// The walk travels along the puppet's +Z axis. Ease velocity to zero over the last step.
function route(t: number) {
  const brake = Math.max(0, Math.min(1, t - 3.7));
  const distance = 0.58 * (Math.min(t, 3.7) + brake - brake * brake / 2);
  return {distance, x: -1.05 + distance * 0.56, z: -0.84 + distance * 0.8285};
}

// Painted before folding: both wings carry the same postal border in paper coordinates.
function airmailStationery() {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 256;
  const ink = canvas.getContext('2d')!;
  ink.fillStyle = '#fff0c9';
  ink.fillRect(0, 0, 320, 256);
  for (let i = -1; i < 12; i++) {
    ink.fillStyle = i % 2 ? '#b95246' : '#497585';
    for (const y of [5, 236]) {
      ink.beginPath();
      ink.moveTo(i * 31, y); ink.lineTo(i * 31 + 15, y);
      ink.lineTo(i * 31 + 25, y + 15); ink.lineTo(i * 31 + 10, y + 15);
      ink.fill();
    }
  }
  ink.strokeStyle = '#68838a';
  ink.lineWidth = 3;
  ink.beginPath();
  ink.arc(235, 65, 19, 0, 2 * Math.PI);
  for (const y of [60, 65, 70]) {
    ink.moveTo(242, y); ink.bezierCurveTo(257, y-6, 264, y+6, 280, y);
  }
  ink.stroke();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// One folded sheet, with two wing planes and a valley fold. The nose points to -X.
function AirLetter() {
  const paper = useMemo(() => {
    const tip = [-0.30, 0, 0], valley = [0.20, -0.075, 0];
    const left = [0.19, 0.025, -0.20], right = [0.19, 0.025, 0.20];
    const foldL = [0.14, 0.018, -0.042], foldR = [0.14, 0.018, 0.042];
    const faces = [tip,left,foldL, tip,foldL,valley, tip,valley,foldR, tip,foldR,right];
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(faces.flat(), 3));
    g.setAttribute('uv', new Float32BufferAttribute(faces.flatMap(([x, , z]) => [(x + 0.30) / 0.50, (z + 0.20) / 0.40]), 2));
    g.computeVertexNormals();
    return g;
  }, []);
  const ink = useMemo(airmailStationery, []);
  useEffect(() => () => {paper.dispose(); ink.dispose();}, [paper, ink]);
  return <mesh geometry={paper} castShadow>
    <meshStandardMaterial side={DoubleSide} map={ink} roughness={0.92}/>
  </mesh>;
}

export function PostalStreet({mode = 'stop-motion', quality = 'final', seed = 17}: Props) {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const {seconds: t, cameraSeconds: ct, exposure} = stopMotionTiming(frame, fps, mode);
  const path = route(t);
  const tracking = route(ct);
  const walk = 1 - easeBetween(t, 3.7, 4.7);
  const reach = easeBetween(t, 4.85, 5.36) - 0.42 * easeBetween(t, 6.12, 6.85)
    + 0.42 * easeBetween(t, 7.02, 7.72);
  const surprised = reach * (1 - easeBetween(t, 8.45, 9.50));
  const flight = easeBetween(t, 4.6, 8.25);
  const lean = Math.sin(Math.PI * flight);
  const portrait = easeBetween(ct, 6.55, 10.45);
  const orbit = easeBetween(ct, 0, 7.7);
  const yaw = 0.595 - 0.53 * easeBetween(t, 4.15, 5.6);
  const eye: Point = [tracking.x + mix(1.86 - orbit * 1.27, 0.33, portrait),
    mix(1.68, 1.56, portrait), tracking.z + mix(6.85 - 1.65 * orbit, 3.32, portrait)];
  const target: Point = [tracking.x + mix(0.09, 0.19, portrait), mix(1.45, 1.46, portrait), tracking.z];
  const thumbPressure = mode === 'stop-motion' ? (seededRandom(seed, exposure) - 0.5) * 0.003 : 0;
  return <ThreeCanvas width={width} height={height} shadows="percentage" gl={{antialias: true, alpha: false}}
    camera={{position: eye, fov: 39, near: 0.04, far: 60}}>
    <ClayDetailContext.Provider value={quality}>
      <ClayEnvironment sky="#bfd4d6" haze="#e8d8c3" near={7.0} far={26} />
      <ClayLighting quality={quality} />
      <ClayCamera eye={eye} target={target} fov={mix(39, 36, portrait)} />
      {quality === "final" && <ClayFocus distance={Math.hypot(eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]) - 0.18}
        band={0.42} maxBlurPx={mix(6, 10, portrait)}/>}
      <ClayStreet seconds={t} seed={seed} quality={quality} />
      <ClayContactShadow position={[path.x, 0.009, path.z]} size={[0.83, 0.5]} opacity={0.32}/>
      <group position={[path.x, 0, path.z]} rotation-y={yaw}
        scale={[1 - thumbPressure / 2, 1 + thumbPressure, 1 - thumbPressure / 2]}>
        <ClayCharacter time={t} phase={path.distance / CLAY_STRIDE.walk - 0.06} motion={walk} gait="walk"
          look={[0.85 * reach, 0.83 * reach - 1.38 * flight]} reaction={surprised} reach={reach} seed={seed}/>
        {t >= 4.6 && <group position={[mix(2.90, 0.49, flight), mix(2.38, 1.205, flight) + 0.21 * lean,
          mix(-0.36, 0.17, flight)]}
          rotation={[0.43 + 0.84 * Math.sin(flight * Math.PI * 3) * lean, -0.42, 0.10 - lean * 0.32]}>
          <AirLetter/>
        </group>}
      </group>
    </ClayDetailContext.Provider>
  </ThreeCanvas>;
}
