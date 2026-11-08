import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraRig, View} from './slime/camera';
import {Bear, BearPose} from './bear/Bear';
import {ANYA, HOST, Human, HumanPose, MOM, MANAGER, girl} from './bear/People';
import {Ball} from './bear/kit';

// A test bench for the «медведь» characters: render stills with a camera override.
// node tools/still-view.mjs BearLab out/lab.jpg '{"cam":{"pos":[0,1.5,5],"target":[0,1.2,0],"fov":40},"bear":{},"anya":{}}'
type Props = {cam?: View; bear?: BearPose; anya?: HumanPose; who?: string};

export const BearLab: React.FC<Props> = ({cam = {pos: [0.6, 1.5, 5.4], target: [0, 1.15, 0], fov: 40}, bear = {}, anya = {}, who = 'lineup'}) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#c9b28a'}}>
      <ThreeCanvas width={width} height={height} flat shadows gl={{logarithmicDepthBuffer: true}} camera={{fov: 40, position: [0, 1.6, 2]}}>
        <CameraRig v={0} view={() => cam} />
        <color attach="background" args={['#e9d2a8']} />
        <hemisphereLight color="#fff4e0" groundColor="#8a6a4a" intensity={1.35} />
        <directionalLight position={[4, 7, 5]} color="#ffe2b8" intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0004} />
        <directionalLight position={[-4, 3, -5]} color="#ffc890" intensity={1.2} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#b98a52" roughness={0.95} />
        </mesh>
        {who === 'lineup' ? (
          <>
            <Bear position={[-0.4, 0, 0]} rotation={0.25} pose={bear} />
            <Human o={ANYA} position={[1.15, 0, 0.6]} rotation={-0.4} pose={anya} />
            <Human o={MOM} position={[2.0, 0, -0.4]} rotation={-0.5} />
            <Human o={HOST} position={[-1.9, 0, 0.5]} rotation={0.4} />
            <Human o={MANAGER} position={[-2.7, 0, -0.6]} rotation={0.5} />
            <Human o={girl(1)} position={[2.8, 0, 0.3]} rotation={-0.6} />
          </>
        ) : who === 'bear' ? (
          <Bear pose={bear} />
        ) : (
          <Human o={ANYA} pose={anya} />
        )}
        <Ball position={[0, -5, 0]} scale={0.01} color="#000" />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
