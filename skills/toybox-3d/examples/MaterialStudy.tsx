import {useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {ToyBox, ToyExtrusion} from '../../../video/src/three/toybox/geometry';
import {ToyContactShadow, ToyLighting} from '../../../video/src/three/toybox/lighting';
import {ToyMaterial} from '../../../video/src/three/toybox/materials';
import '../../../video/src/fonts';

const samples = [
  {kind: 'mattePlastic', title: 'Матовый пластик', color: '#BE7460', backing: '#EFE1D5'},
  {kind: 'silicone', title: 'Мягкий силикон', color: '#63AF9F', backing: '#E2EDE8'},
  {kind: 'wood', title: 'Дерево', color: '#B07C53', backing: '#EFE5D7'},
  {kind: 'polishedMetal', title: 'Полированный металл', color: '#A17A64', backing: '#EAE2E6'},
  {kind: 'glass', title: 'Стекло', color: '#96D9E0', backing: '#DCE9EA'},
  {kind: 'fabric', title: 'Ткань', color: '#8D7BBB', backing: '#E6E2ED'},
] as const;
type StudyKind = typeof samples[number]['kind'];

function CameraAim() {
  const camera = useThree((state) => state.camera);
  useLayoutEffect(() => {
    camera.lookAt(0, 0.8, 0);
    camera.updateMatrixWorld();
  }, [camera]);
  return null;
}

function ObjectSample({kind, color}: {kind: StudyKind; color: string}) {
  const surface = <ToyMaterial kind={kind} color={color} quality="final" />;
  switch (kind) {
    case 'mattePlastic':
      return <group rotation={[0, -0.2, 0]}>
        <ToyBox size={[1.47, 1.53, 0.58]} position={[0, 0.78, 0]} radius={0.2} quality="final" castShadow>
          {surface}
        </ToyBox>
        <ToyExtrusion points={[[-0.52, -0.29], [-0.26, 0.47], [0.54, 0.47], [0.28, -0.29]]}
          depth={0.076} bevel={0.057} position={[-0.01, 0.88, 0.28]} quality="final">
          <ToyMaterial kind="mattePlastic" color="#F8CDAF" />
        </ToyExtrusion>
        {[-0.28, 0, 0.28].map((x) => <mesh key={x} position={[x, 0.39, 0.307]}>
          <sphereGeometry args={[0.042, 12, 8]} />
          <ToyMaterial kind="mattePlastic" color="#7E514F" />
        </mesh>)}
      </group>;
    case 'silicone':
      return <group rotation={[0, -0.18, 0]}>
        <ToyBox size={[1.85, 0.21, 0.95]} position={[0, 0.108, 0]} radius={0.09} castShadow>
          <ToyMaterial kind="rubber" color="#7D9D99" />
        </ToyBox>
        <mesh position={[-0.23, 0.92, 0]} rotation={[0.24, 0, -0.2]} castShadow>
          <torusGeometry args={[0.47, 0.24, 24, 42]} />
          {surface}
        </mesh>
        <mesh position={[0.54, 0.54, 0.15]} rotation={[0.5, 0.4, 0.1]} castShadow>
          <torusGeometry args={[0.24, 0.14, 18, 32]} />
          <ToyMaterial kind="silicone" color="#DF997A" />
        </mesh>
      </group>;
    case 'wood':
      return <group rotation={[0, 0.12, 0]}>
        <ToyBox size={[1.8, 0.36, 1.12]} position={[0, 0.18, 0]} radius={0.13} quality="final" castShadow>{surface}</ToyBox>
        <ToyBox size={[1.58, 0.36, 0.98]} position={[0, 0.49, 0]} rotation={[0, 0.17, 0]}
          radius={0.1} quality="final" castShadow><ToyMaterial kind="wood" color="#C59869" quality="final" variant={1} /></ToyBox>
        <ToyExtrusion points={[[-0.7, -0.29], [0.72, -0.29], [0.67, 0.24], [0.4, 0.55], [-0.35, 0.55], [-0.68, 0.24]]}
          depth={0.67} bevel={0.07} position={[0, 0.95, 0]} quality="final" castShadow>{surface}</ToyExtrusion>
        <ToyBox size={[0.47, 0.10, 0.12]} position={[0, 0.99, 0.41]} radius={0.04}>
          <ToyMaterial kind="paintedWood" color="#784F42" />
        </ToyBox>
      </group>;
    case 'polishedMetal':
      return <group rotation={[0, -0.22, 0]}>
        <ToyBox size={[1.73, 0.32, 1.1]} position={[0, 0.16, 0]} radius={0.12} quality="final" castShadow>
          <ToyMaterial kind="mattePlastic" color="#9B7994" />
        </ToyBox>
        <mesh position={[0, 0.99, 0]} castShadow>
          <torusGeometry args={[0.51, 0.158, 28, 56]} />
          {surface}
        </mesh>
        <mesh position={[0, 0.99, 0.04]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.37, 0.37, 0.13, 36]} />
          <ToyMaterial kind="metal" color="#826B73" quality="final" />
        </mesh>
        <mesh position={[0, 0.99, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.19, 0.13, 32]} />
          {surface}
        </mesh>
      </group>;
    case 'glass':
      return <group rotation={[0, -0.16, 0]}>
        <ToyBox size={[1.65, 0.30, 1.0]} position={[0, 0.15, 0]} radius={0.12} quality="final" castShadow>
          <ToyMaterial kind="paintedWood" color="#79A49E" />
        </ToyBox>
        <ToyBox size={[1.03, 1.32, 0.72]} position={[0, 0.92, 0]} radius={0.24} quality="final">{surface}</ToyBox>
        <ToyBox size={[0.89, 0.49, 0.59]} position={[0, 0.6, 0]} radius={0.14} quality="final">
          <ToyMaterial kind="water" color="#4B9D9F" quality="final"/>
        </ToyBox>
        <mesh position={[0, 1.59, 0]} castShadow>
          <cylinderGeometry args={[0.265, 0.255, 0.24, 28]} />
          <ToyMaterial kind="wood" color="#BD947B" quality="final" />
        </mesh>
      </group>;
    case 'fabric':
      return <group rotation={[0, -0.18, -0.08]}>
        <ToyBox size={[1.64, 1.46, 0.65]} position={[0, 0.76, 0]} radius={0.26} quality="final" castShadow>{surface}</ToyBox>
        <ToyBox size={[1.39, 0.44, 0.19]} position={[0, 1.04, 0.32]} radius={0.085} quality="final">
          <ToyMaterial kind="fabric" color="#B2A0D2" quality="final" />
        </ToyBox>
        <ToyBox size={[0.27, 0.58, 0.22]} position={[0, 0.89, 0.39]} radius={0.099} quality="final">
          <ToyMaterial kind="rubber" color="#5D587B" quality="final" />
        </ToyBox>
        <mesh position={[0, 0.75, 0.505]}><sphereGeometry args={[0.062, 12, 8]} />
          <ToyMaterial kind="polishedMetal" color="#EAB383" />
        </mesh>
      </group>;
  }
}

const cellWidth = 310;
const cellHeight = 312;

function StudyCell({sample}: {sample: typeof samples[number]}) {
  return <section style={{borderRadius: 19, overflow: 'hidden', backgroundColor: sample.backing}}>
    <ThreeCanvas width={cellWidth} height={cellHeight} camera={{fov: 25, position: [3, 2.8, 6.2]}} shadows>
      <color attach="background" args={[sample.backing]} />
      <CameraAim />
      <ToyLighting preset="softStudio" quality="final" center={[0, 0.65, 0]} coverage={2.8} />
      <ToyContactShadow size={[2.5, 1.8]} opacity={0.22} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <shadowMaterial color="#56404F" opacity={0.19} />
      </mesh>
      <ObjectSample kind={sample.kind} color={sample.color} />
    </ThreeCanvas>
    <div style={{
      display: 'flex', padding: '0 18px 17px', fontSize: 20, fontWeight: 600,
      alignItems: 'center', gap: 9, color: '#372D43',
    }}>
      <span style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: sample.color}} />
      {sample.title}
    </div>
  </section>;
}

export function ToyboxMaterialStudy() {
  return <AbsoluteFill style={{backgroundColor: '#FFF5E8', padding: '54px 53px', fontFamily: 'Inter, sans-serif'}}>
    <header style={{color: '#322944'}}>
      <div style={{fontSize: 19, fontWeight: 600, color: '#825C71', marginBottom: 15}}>TOYBOX 3D</div>
      <div style={{fontSize: 63, fontFamily: 'Spectral, serif', letterSpacing: -3, lineHeight: 1}}>Характер материалов</div>
    </header>
    <div style={{marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(3, 310px)', gap: 20}}>
      {samples.map((sample) => <StudyCell key={sample.kind} sample={sample} />)}
    </div>
  </AbsoluteFill>;
}

registerRoot(() => <Composition component={ToyboxMaterialStudy} id="ToyboxMaterialStudy"
  width={1080} height={986} durationInFrames={1} fps={30} />);
