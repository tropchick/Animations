import {useEffect, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {BoxGeometry, IcosahedronGeometry, CylinderGeometry, SphereGeometry} from 'three';
import {
  DeformGeometry, EnergizedArc, FragmentAssembly, ImpactOutline, LayeredWave, Materialization, OpticalShell,
  VolumetricCloud, VolumetricRing,
} from './spatial-effects';
import type {Vec3} from './math';

const names = ['Volumetric ring', 'Layered wave', 'Energized arc', 'Volumetric cloud', 'Fragment formation',
  'Directional deformation', 'Impact outline', 'Materialization', 'Local optics'];
const ink = '#d5e4df';
const mint = '#b0f9ce';
const shell = '#294f52';
const sun = '#ffe0a4';
const backdrop = '#14252a';
const nodes = [
  [-2.8, 3.65, 0], [0, 3.65, 0], [2.8, 3.65, 0],
  [-2.8, 0, 0], [0, 0, 0], [2.8, 0, 0],
  [-2.8, -3.65, 0], [0, -3.65, 0], [2.8, -3.65, 0],
] as const satisfies readonly Vec3[];

function Base({position = [0, -0.49, 0], color = shell}: {position?: Vec3; color?: string}) {
  return <mesh rotation={[0.16, 0.35, 0.08]} position={position}>
    <boxGeometry args={[0.61, 0.72, 0.8]} /><meshStandardMaterial color={color} roughness={0.8} />
  </mesh>;
}

export function SpatialGallery() {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const shape = useMemo(() => new IcosahedronGeometry(0.62, 0), []);
  const cylinder = useMemo(() => new CylinderGeometry(0.13, 0.50, 1.60, 8, 6), []);
  const material = useMemo(() => new BoxGeometry(0.83, 1.43, 0.7, 1, 4, 1), []);
  const pearl = useMemo(() => new SphereGeometry(0.51, 21, 15), []);
  useEffect(() => () => {
    shape.dispose();
    cylinder.dispose();
    material.dispose();
    pearl.dispose();
  }, [cylinder, material, pearl, shape]);
  const common = {frame, at: 0, duration: 48, color: mint, accent: sun, strength: 1.0};
  const blocks = [
    <><Base position={[-0.43, -0.19, 0.38]} /><VolumetricRing {...common} size={0.95} direction={[0.14, 0.48, 1]} /></>,
    <><Base position={[0.37, -0.38, 0.37]} /><LayeredWave {...common} speed={0.047} size={1.10} at={-5} direction={[0, 0.5, 1]} /></>,
    <><Base position={[-0.8, -0.44, 0.29]} /><Base position={[0.72, -0.28, -0.31]} />
      <EnergizedArc {...common} start={[-0.8, -0.05, 0.29]} end={[0.72, 0.1, -0.31]} arcHeight={0.55} thickness={0.065} /></>,
    <><VolumetricCloud {...common} origin={[0, -0.2, -0.05]} color="#a98769" accent={sun} size={0.86} at={-8}
      drift={0.07} finish="sculpted"/><Base position={[-0.28, -0.55, 0.52]} /></>,
    <FragmentAssembly {...common} mode="assemble" color="#93ccae" accent={sun} at={-3} size={0.75} strength={0.72} />,
    <><DeformGeometry geometry={cylinder} pivot={[0, -0.85, 0]} axis={[0, 1, 0]} stretch={1.13} warp={0.24} phase={frame/16}>
      {(surface) => <mesh {...surface}><meshStandardMaterial color="#a8a8d9" roughness={0.75} flatShading /></mesh>}
    </DeformGeometry><Base position={[-0.03, -0.73, 0.19]} /></>,
    <><mesh geometry={shape}><meshStandardMaterial color="#395e59" roughness={0.84} flatShading /></mesh>
      <ImpactOutline {...common} geometry={shape} mode="outline" thickness={0.09} />
      <ImpactOutline {...common} geometry={shape} mode="wireframe" color={sun} strength={0.62} /></>,
    <group rotation={[0.22, 0.47, 0.06]}><Materialization {...common} at={-7} geometry={material} mode="reveal"
      axis={[0.6, 1, 0]} color="#96a6d8" edgeWidth={0.14} /></group>,
    <><mesh geometry={pearl}><meshStandardMaterial color="#364957" roughness={0.79} /></mesh>
      <OpticalShell {...common} size={0.86} direction={[0.35, 1, 0.16]} /><Base position={[-0.41, -0.49, 0.62]} /></>,
  ];
  const scale = width / 8.4;
  return <AbsoluteFill style={{background: backdrop, fontFamily:'Arial, sans-serif', color:ink}}>
    <div style={{position:'absolute',inset:'87px 23px 36px',border:'1px solid #335158',borderRadius:20,background:'linear-gradient(115deg,#20363c,#14272c)'}} />
    <strong style={{position:'absolute',left:32,top:24,fontSize:38,letterSpacing:-1}}>Spatial effects lab</strong>
    <ThreeCanvas width={width} height={height} orthographic camera={{position:[0, 0, 18],zoom:scale,near:0.1,far:48}}>
      <hemisphereLight args={['#cfecff', '#8e7a6c', 1.7]}/><directionalLight position={[2.5, 5, 7]} color="#fff5d8" intensity={2.5}/>
      {blocks.map((child, index)=><group key={names[index]} position={nodes[index]}>{child}</group>)}
    </ThreeCanvas>
    {names.map((name,index)=><div key={name} style={{position:'absolute',left:32+index%3*width/3,
      top:height/2-nodes[index][1]*scale+scale*1.15,fontSize:23,fontWeight:700,color:mint}}>{name}</div>)}
  </AbsoluteFill>;
}
