import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraRig, View} from './slime/camera';
import {Human} from './bear/People';
import {ARTEM, SCREAMER, SONYA, STRANGER, Box, HearingAid, dead, deadIdle, deadKid} from './quiet/Chars';
import {HOUSE, LAMP_FAR, NightLight, NightSky, Town} from './quiet/Town';
import {House, HouseState, Yard} from './quiet/House';
import {Marker, Note, Palm} from './quiet/Props';

// test bench for «Тихий этаж»: node tools/still-view.mjs QuietLab out/q.jpg '{"cam":{...},"who":"town"}'
type Props = {cam?: View; who?: string; v?: number; house?: HouseState};

export const QuietLab: React.FC<Props> = ({cam = {pos: [0.6, 1.5, 5.4], target: [0, 1.0, 0], fov: 40}, who = 'lineup', v = 3, house = {}}) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <ThreeCanvas width={width} height={height} flat shadows gl={{logarithmicDepthBuffer: true}} camera={{fov: 40, position: [0, 1.6, 2]}}>
        <CameraRig v={0} view={() => cam} />
        {who === 'palm' ? (
          <>
            <color attach="background" args={['#1a2238']} />
            <hemisphereLight color="#9fb4ff" groundColor="#2a2a34" intensity={1.2} />
            <pointLight position={[0.15, 0.3, 0.2]} color="#ffd8a8" intensity={0.8} distance={2} />
            <Palm position={[0, 0, 0]} written={1} />
            <Marker position={[0.06, 0.03, 0.03]} rotation={[0.5, 0, -0.5]} />
            <Note position={[0.25, 0.0, 0]} rotation={[-Math.PI / 2, 0, 0.1]} />
          </>
        ) : who === 'lineup' ? (
          <>
            <color attach="background" args={['#3a4050']} />
            <hemisphereLight color="#dfe6ff" groundColor="#3a3a44" intensity={1.3} />
            <directionalLight position={[4, 7, 5]} color="#ffffff" intensity={2.0} castShadow />
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[30, 30]} />
              <meshStandardMaterial color="#5a5d64" roughness={0.95} />
            </mesh>
            <Human o={ARTEM} position={[-0.9, 0, 0.4]} rotation={0.3} pose={{armL: [-0.9, 0.1], armR: [-0.9, -0.1], elbowL: -0.6, elbowR: -0.6}} handR={<Box position={[-0.2, -0.05, 0.12]} scale={0.9} />} />
            <Human o={SONYA} position={[0.0, 0, 0.8]} rotation={0} head={<HearingAid />} />
            <Human o={STRANGER} position={[0.9, 0, 0.2]} rotation={-0.3} />
            <Human o={dead(1)} position={[1.8, 0, -0.4]} rotation={-0.4} pose={deadIdle(v, 1)} />
            <Human o={SCREAMER} position={[-1.9, 0, -0.5]} rotation={0.5} pose={{...deadIdle(v, 2), face: {mouth: 1, o: 1, wide: 1}}} />
            <Human o={deadKid(1)} position={[2.6, 0, 0.4]} rotation={-0.6} pose={deadIdle(v, 3)} />
          </>
        ) : (
          <>
            <NightSky center={cam.pos} dawn={0} />
            <NightLight center={[HOUSE[0], 0, -4]} box={16} />
            <Town v={v} lampLights={[5]} />
            <House position={HOUSE} s={{v, lit: true, ...house}} />
            <Yard position={HOUSE} />
            <Human o={dead(0)} position={[LAMP_FAR[0] + 0.5, 0.14, LAMP_FAR[2] - 0.25]} rotation={Math.PI} pose={deadIdle(v, 0)} />
            <Human o={ARTEM} position={[HOUSE[0] + 0.2, 0.24, HOUSE[2] + 3.6]} rotation={Math.PI} />
          </>
        )}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
