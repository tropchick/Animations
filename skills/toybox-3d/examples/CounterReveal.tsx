import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame, useVideoConfig} from 'remotion';
import {getToyboxTheme} from '../../../video/src/three/toybox/theme';
import {ToyBox} from '../../../video/src/three/toybox/geometry';
import {ToyLighting, ToyContactShadow} from '../../../video/src/three/toybox/lighting';
import {ToyMaterial} from '../../../video/src/three/toybox/materials';
import {TOY_MOTION, toyImpact} from '../../../video/src/three/toybox/motion';
import {ToyHinge, toyTransitionProgress} from '../../../video/src/three/toybox/transforms';

function CounterReveal() {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const theme = getToyboxTheme('product', 'balanced', {lighting: 'softStudio'});
  const {palette, quality} = theme;
  const hinge = toyTransitionProgress(frame, Math.round(fps * 0.55), Math.round(fps * 0.78));
  const spring = toyImpact((frame - Math.round(fps * 1.25)) / fps, TOY_MOTION.silicone);

  return (
    <AbsoluteFill style={{background: palette.background}}>
      <ThreeCanvas width={width} height={height} camera={{position: [2.95, 2.75, 5.4], fov: 41}}
        onCreated={({camera}) => camera.lookAt(0, 0.75, -0.1)}>
        <color attach="background" args={[palette.background]} />
        <ToyLighting preset={theme.lighting} quality={quality} center={[0, 0.7, 0]} />
        <ToyBox size={[13, 0.45, 13]} position={[0, -0.23, 0]} quality={quality}>
          <ToyMaterial kind="wood" color={palette.ground} quality={quality} />
        </ToyBox>
        <ToyContactShadow position={[0, 0.007, 0]} size={[3.5, 2.8]} opacity={0.38} />

        <ToyBox size={[1.75, 0.32, 1.45]} position={[0, 0.18, 0]} radius={0.12} quality={quality}>
          <ToyMaterial kind="paintedWood" color={palette.primary} quality={quality} />
        </ToyBox>
        <ToyBox size={[1.59, 0.095, 1.28]} position={[0, 0.377, 0]} radius={0.04} quality={quality}>
          <ToyMaterial kind="rubber" color={palette.ink} quality={quality} />
        </ToyBox>

        <group position={[0, 0.42 + spring.height, 0.08]} scale={spring.scale}>
          <mesh position-y={0.22}>
            <cylinderGeometry args={[0.33, 0.255, 0.44, 24]} />
            <ToyMaterial kind="silicone" color={palette.accent} quality={quality} />
          </mesh>
          <mesh position-y={0.45} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.304, 0.036, 10, 30]} />
            <ToyMaterial kind="mattePlastic" color={palette.neutral} quality={quality} />
          </mesh>
          <mesh position-y={0.442} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.287, 30]} />
            <ToyMaterial kind="food" color="#724737" quality={quality} />
          </mesh>
        </group>

        <ToyHinge pivot={[0, 0.56, -0.63]} progress={hinge} open={-Math.PI * 0.69} settle={0.035}>
          <ToyBox size={[1.66, 0.29, 1.36]} position={[0, 0.74, 0]} radius={0.13} quality={quality}>
            <ToyMaterial kind="mattePlastic" color={palette.secondary} quality={quality} />
          </ToyBox>
          <ToyBox size={[1.61, 0.26, 1.28]} position={[0, 0.56, 0.01]} radius={0.12} quality={quality}>
            <ToyMaterial kind="mattePlastic" color={palette.secondary} quality={quality} />
          </ToyBox>
          <ToyBox size={[1.39, 0.048, 0.99]} position={[0, 0.43, -0.004]} radius={0.022} quality={quality}>
            <ToyMaterial kind="rubber" color="#34665F" quality={quality} />
          </ToyBox>
          {[-0.59, 0.59].map((x) => (
            <mesh key={x} position={[x, 0.57, -0.62]} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.075, 0.075, 0.22, 16]} />
              <ToyMaterial kind="metal" color={palette.neutral} quality={quality} />
            </mesh>
          ))}
          <ToyBox size={[0.4, 0.085, 0.15]} position={[0, 0.76, 0.69]} radius={0.04} quality={quality}>
            <ToyMaterial kind="polishedMetal" color={palette.neutral} quality={quality} />
          </ToyBox>
        </ToyHinge>
      </ThreeCanvas>
    </AbsoluteFill>
  );
}

const ToyboxExample = () => (
  <Composition id="ToyboxCounterReveal" component={CounterReveal} width={1080} height={1920}
    fps={30} durationInFrames={90} />
);

registerRoot(ToyboxExample);
