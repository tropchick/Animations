import {memo, useLayoutEffect, useMemo, useRef} from 'react';
import {Color, CylinderGeometry, InstancedMesh, Object3D, SphereGeometry} from 'three';
import {ToyBox, getRoundedBox} from './geometry';
import {getToyMaterial} from './materials';
import {ToyContactShadow} from './lighting';
import type {ToyboxQuality} from './theme';
import {ToyCharacter, TOY_CAST} from './character';

type Point = [number, number, number];
type Material = Parameters<typeof getToyMaterial>[0];
type DetailProps = {quality?: ToyboxQuality};
type AnimatedWorldProps = DetailProps & {frame: number; fps: number; seed?: number};
type Piece = {position: Point; color?: string; scale?: Point; rotation?: Point};

const TAU = Math.PI * 2;
const wrap = (value: number, period: number) => ((value % period) + period) % period;
const picks = (seed: number, slot: number) => {
  const hash = Math.imul(seed + 15823, 374761393) ^ Math.imul(slot + 3, 668265263);
  return (Math.imul(hash ^ (hash >>> 13), 1274126177) >>> 0) / 4294967296;
};

const Solid = ({
  size, at = [0, 0, 0], color, kind = 'mattePlastic', radius = 0.045,
  quality = 'balanced', rotation,
}: DetailProps & {size: Point; at?: Point; color: string; kind?: Material; radius?: number; rotation?: Point}) => (
  <ToyBox size={size} radius={radius} quality={quality} position={at} rotation={rotation}
    material={getToyMaterial(kind, color, quality)} />
);

const Batch = ({
  pieces, kind = 'mattePlastic', color = '#ffffff', size, radius = 0.035, quality = 'balanced', receiveShadow = false,
}: DetailProps & {pieces: Piece[]; kind?: Material; color?: string; size: Point; radius?: number; receiveShadow?: boolean}) => {
  const ref = useRef<InstancedMesh>(null);
  const geometry = useMemo(
    () => getRoundedBox(size, radius, 1),
    [size[0], size[1], size[2], radius],
  );
  const material = getToyMaterial(kind, color, quality);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const transform = new Object3D();
    const tint = new Color();
    pieces.forEach(({position, scale, rotation, color: tone}, index) => {
      transform.position.set(...position);
      transform.rotation.set(...(rotation ?? [0, 0, 0]));
      transform.scale.set(...(scale ?? [1, 1, 1]));
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
      mesh.setColorAt(index, tint.set(tone ?? '#ffffff'));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [pieces]);

  if (!pieces.length) return null;
  return <instancedMesh ref={ref} args={[geometry, material, pieces.length]} receiveShadow={receiveShadow} dispose={null} />;
};

const ballLow = new SphereGeometry(1, 12, 8);
const ballHigh = new SphereGeometry(1, 18, 12);
const cylinderCache = new Map<string, CylinderGeometry>();

const Ball = ({
  at, scale, color, kind = 'mattePlastic', quality = 'balanced',
}: DetailProps & {at: Point; scale: Point; color: string; kind?: Material}) => (
  <mesh position={at} scale={scale} material={getToyMaterial(kind, color, quality)}
    geometry={quality === 'preview' ? ballLow : ballHigh} dispose={null} />
);

const Cylinder = ({
  top, bottom, height, at, color, kind = 'mattePlastic', rotation, quality = 'balanced',
}: DetailProps & {top: number; bottom: number; height: number; at: Point; color: string; kind?: Material; rotation?: Point}) => {
  const segments = quality === 'preview' ? 14 : 24;
  const key = [top, bottom, height, segments].join('/');
  let geometry = cylinderCache.get(key);
  if (!geometry) {
    geometry = new CylinderGeometry(top, bottom, height, segments);
    cylinderCache.set(key, geometry);
  }
  return <mesh position={at} rotation={rotation} material={getToyMaterial(kind, color, quality)}
    geometry={geometry} dispose={null} />;
};

const shopColors = [
  {shell: '#EFA584', edge: '#5F435B', trim: '#E87154', panel: '#FBE3B7', awning: '#D75A50'},
  {shell: '#8EBBB9', edge: '#365968', trim: '#4E898E', panel: '#F7DFAC', awning: '#438B88'},
  {shell: '#DFB387', edge: '#675173', trim: '#997ABE', panel: '#FFF0CA', awning: '#9876B8'},
] as const;

const SignGlyph = ({variant, quality}: DetailProps & {variant: number}) => (
  <group>
    {variant === 0 ? (
      <>
        <Ball at={[-0.02, 0.04, 0]} scale={[0.27, 0.14, 0.06]} color="#FFF1C8" quality={quality} />
        {[0, 1, 2].map((stripe) => <Solid key={stripe} size={[0.025, 0.1, 0.03]} at={[(stripe - 1) * 0.09, 0.07, 0.059]} rotation={[0, 0, -0.43]} color="#D68451" quality={quality} />)}
      </>
    ) : variant === 1 ? (
      <>
        <Solid size={[0.2, 0.31, 0.045]} color="#FBDB9C" rotation={[0, 0, 0.24]} quality={quality} />
        <Solid size={[0.135, 0.235, 0.043]} at={[0.02, 0.025, 0.03]} color="#B3F3D0" rotation={[0, 0, -0.19]} quality={quality} />
      </>
    ) : (
      <>
        <Cylinder top={0.15} bottom={0.15} height={0.035} at={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} color="#FCE7BA" quality={quality} />
        <Solid size={[0.36, 0.045, 0.035]} at={[0, 0, 0.027]} color="#BFA5DC" rotation={[0, 0, -0.5]} quality={quality} />
      </>
    )}
  </group>
);

export const ToyBuilding = ({
  position = [0, 0, 0], variant = 0, quality = 'balanced', scale = 1, detail = 'street',
}: DetailProps & {position?: Point; variant?: 0 | 1 | 2 | 'tower'; scale?: number; detail?: 'street' | 'background'}) => {
  if (variant === 'tower') {
    return (
      <group position={position} scale={scale}>
        <Solid size={[3.45, 6.5, 2.7]} at={[0, 3.25, 0]} color="#8B9CBC" radius={0.19} quality={quality} />
        <Solid size={[2.37, 1.03, 1.83]} at={[0, 6.47, 0]} color="#A7AEC7" radius={0.19} quality={quality} />
        <Batch size={[0.16, 5.2, 0.11]} color="#B4BBD2" quality={quality}
          pieces={[-1.25, -0.62, 0, 0.62, 1.25].map((x) => ({position: [x, 3.55, 1.36]}))} />
        <Batch size={[0.4, 0.21, 0.08]} color="#5C789D" quality={quality}
          pieces={Array.from({length: 24}, (_, i) => ({position: [-0.94 + (i % 4) * 0.63, 1.35 + Math.floor(i / 4) * 0.78, 1.39]}))} />
        <Solid size={[0.77, 0.28, 0.71]} at={[0.35, 7.12, 0]} color="#806F9B" quality={quality} />
        <Cylinder top={0.035} bottom={0.048} height={0.58} at={[0.35, 7.55, 0]} color="#9C85AA" quality={quality} />
      </group>
    );
  }

  const tint = shopColors[variant];
  const width = variant === 1 ? 4.25 : 3.77;
  const floor = variant === 1 ? 4.32 : 3.7;
  const windowX = [-width * 0.29, 0, width * 0.29];
  const secondFloor = windowX.map((x) => ({position: [x, floor - 0.54, 1.21] as Point}));
  const full = detail === 'street';
  return (
    <group position={position} scale={scale}>
      <Solid size={[width, floor, 2.34]} at={[0, floor / 2, 0]} color={tint.shell} kind="paintedWood" radius={0.17} quality={quality} />
      <Solid size={[width + 0.09, 0.18, 2.41]} at={[0, 0.09, 0.02]} color={tint.edge} kind="concrete" quality={quality} />
      <Solid size={[width + 0.11, 0.26, 2.45]} at={[0, floor, 0]} color={tint.trim} radius={0.1} quality={quality} />
      <Solid size={[width - 0.25, 0.15, 2.22]} at={[0, floor + 0.2, 0]} color={tint.panel} radius={0.07} quality={quality} />
      <Solid size={[width - 0.12, 0.1, 0.11]} at={[0, floor - 0.21, 1.19]} color={tint.panel} quality={quality} />
      <Batch size={[0.86, 0.85, 0.1]} color={tint.trim} radius={0.14} pieces={secondFloor} quality={quality} />
      <Batch size={[0.67, 0.67, 0.13]} color="#545D70" radius={0.12}
        pieces={secondFloor.map(({position: [x, y]}) => ({position: [x, y, 1.275]}))} quality={quality} />
      {full && <Batch size={[0.59, 0.084, 0.045]} color="#ABBCC3"
        pieces={secondFloor.map(({position: [x, y]}) => ({position: [x, y - 0.1, 1.36]}))} quality={quality} />}
      <Batch size={[0.93, 0.13, 0.22]} color={tint.panel}
        pieces={secondFloor.map(({position: [x, y]}) => ({position: [x, y - 0.43, 1.31]}))} quality={quality} />

      <Solid size={[width - 0.32, 1.87, 0.24]} at={[0, 1.02, 1.2]} color={tint.trim} radius={0.15} quality={quality} />
      <Solid size={[width - 1.64, 1.18, 0.12]} at={[-0.47, 1.05, 1.34]} color="#334653" radius={0.13} quality={quality} />
      <Solid size={[width - 1.85, 0.95, 0.09]} at={[-0.47, 1.04, 1.408]} color={variant === 0 ? '#A36F54' : '#628D8D'} radius={0.09} quality={quality} />
      <Solid size={[width - 1.8, 0.089, 0.17]} at={[-0.48, 0.73, 1.468]} color={tint.panel} quality={quality} />
      <Solid size={[0.81, 1.61, 0.13]} at={[width * 0.303, 0.91, 1.39]} color={tint.edge} radius={0.11} quality={quality} />
      <Solid size={[0.58, 1.05, 0.09]} at={[width * 0.303, 1.12, 1.48]} color="#698188" radius={0.08} quality={quality} />
      <Solid size={[0.08, 0.23, 0.08]} at={[width * 0.303 + 0.27, 0.81, 1.52]} color="#EAC180" kind="metal" quality={quality} />
      <Solid size={[0.95, 0.1, 0.42]} at={[width * 0.303, 0.045, 1.53]} color={tint.panel} kind="concrete" quality={quality} />

      {full && (
        <group>
          {([-1, 0, 1] as const).map((slot) => (
            <group key={slot} position={[-0.47 + slot * 0.48, 0.85, 1.5]}>
              <Solid size={[0.34, 0.055, 0.094]} color="#7A4F47" quality={quality} />
              {variant === 0 ? (
                <group>
                  <Ball at={[0, 0.11, 0]} scale={[0.153, 0.087 + slot * 0.012, 0.075]} color="#DDA367" kind="food" quality={quality} />
                  <Solid size={[0.024, 0.092, 0.03]} at={[-0.023, 0.151, 0.061]} rotation={[0, 0, -0.45]} color="#F2C597" quality={quality} />
                  <Solid size={[0.024, 0.092, 0.03]} at={[0.034, 0.151, 0.061]} rotation={[0, 0, -0.45]} color="#F2C597" quality={quality} />
                </group>
              ) : (
                <Solid size={[0.184 - slot * 0.025, 0.157 + slot * 0.041, 0.043]} at={[0, 0.12, 0.029]}
                  color={['#F2BD75', '#F5E1A5', '#E19077'][slot + 1]} rotation={[0, -slot * 0.33, 0.11]} kind="paper" quality={quality} />
              )}
            </group>
          ))}
        </group>
      )}
      <group position={[0, 2.04, 1.44]} rotation={[0.22, 0, 0]}>
        <Solid size={[width - 0.16, 0.12, 0.74]} color={tint.panel} kind="fabric" radius={0.055} quality={quality} />
        <Batch size={[(width - 0.16) / 11, 0.11, 0.746]} kind="fabric" color={tint.awning} quality={quality}
          pieces={Array.from({length: 6}, (_, i) => ({position: [((width - 0.16) / 11) * (i * 2 - 5), 0.019, 0]}))} />
        <Solid size={[width - 0.14, 0.12, 0.12]} at={[0, -0.065, 0.36]} color={tint.awning} kind="fabric" quality={quality} />
      </group>
      <Solid size={[1.17, 0.52, 0.19]} at={[0.02, 2.46, 1.2]} color={tint.edge} radius={0.15} quality={quality} />
      {full && <group position={[0.02, 2.46, 1.32]}><SignGlyph variant={variant} quality={quality} /></group>}
      <Solid size={[0.43, 0.29, 0.35]} at={[-1.02, floor + 0.39, -0.67]} color={tint.trim} quality={quality} />
      <Solid size={[0.52, 0.1, 0.44]} at={[-1.02, floor + 0.56, -0.67]} color={tint.panel} quality={quality} />
    </group>
  );
};

export const ToyVegetation = ({
  position = [0, 0, 0], size = 1, frame, fps, quality = 'balanced', seed = 0, bush = false,
}: AnimatedWorldProps & {position?: Point; size?: number; bush?: boolean}) => {
  const sway = Math.sin(frame / fps * 1.7 + seed * 0.67) * (bush ? 0.025 : 0.052);
  const palette = ['#579D7D', '#6DA984', '#83B88F', '#A7C990'];
  return (
    <group position={position} scale={size}>
      <ToyContactShadow size={[1.31, 1.1]} opacity={0.22} />
      <Cylinder top={0.48} bottom={0.36} height={0.39} at={[0, 0.195, 0]} color={seed % 2 ? '#DC905F' : '#A18CB3'} kind="mattePlastic" quality={quality} />
      <Cylinder top={0.46} bottom={0.46} height={0.072} at={[0, 0.36, 0]} color="#FFCF98" quality={quality} />
      <Cylinder top={0.41} bottom={0.41} height={0.04} at={[0, 0.405, 0]} color="#7E625D" kind="stone" quality={quality} />
      <group position={[0, 0.41, 0]} rotation={[sway * 0.3, 0, sway]}>
        {!bush && <Cylinder top={0.055} bottom={0.095} height={0.74} at={[0, 0.36, 0]} color="#926449" kind="wood" quality={quality} />}
        <group position={[0, bush ? 0.26 : 1.04, 0]} scale={bush ? 0.72 : 1}>
          {([
            [[0, 0.185, 0], [0.52, 0.65, 0.43]],
            [[-0.34, -0.16, 0.042], [0.35, 0.38, 0.32]],
            [[0.32, -0.06, -0.043], [0.37, 0.45, 0.38]],
            [[0.06, 0.12, 0.24], [0.28, 0.32, 0.25]],
          ] as [Point, Point][]).map(([at, volume], i) =>
            <Ball key={i} at={at} scale={volume} color={palette[(i + Math.abs(seed)) % palette.length]} kind="grass" quality={quality} />)}
          {quality !== 'preview' && [0, 1, 2].map((i) => (
            <Ball key={i} at={[0.18 + i * 0.085, -0.12 + i * 0.095, 0.328 - i * 0.04]} scale={[0.037, 0.043, 0.03]} color="#EABC70" quality={quality} />
          ))}
        </group>
      </group>
    </group>
  );
};

export const ToyStreetLamp = ({
  position = [0, 0, 0], quality = 'balanced',
}: DetailProps & {position?: Point}) => (
  <group position={position}>
    <Cylinder top={0.15} bottom={0.2} height={0.14} at={[0, 0.07, 0]} color="#344F5B" kind="metal" quality={quality} />
    <Cylinder top={0.034} bottom={0.056} height={2.47} at={[0, 1.27, 0]} color="#4B6467" kind="metal" quality={quality} />
    <Cylinder top={0.065} bottom={0.085} height={0.3} at={[0, 0.25, 0]} color="#658887" kind="metal" quality={quality} />
    <Solid size={[0.1, 0.11, 0.52]} at={[0, 2.52, 0.23]} color="#4B6467" kind="metal" quality={quality} />
    <Cylinder top={0.116} bottom={0.235} height={0.145} at={[0, 2.442, 0.48]} color="#DE9A56" quality={quality} />
    <Ball at={[0, 2.364, 0.48]} scale={[0.18, 0.075, 0.18]} color="#FFE4A5" kind="emissive" quality={quality} />
  </group>
);

export const ToyBench = ({
  position = [0, 0, 0], quality = 'balanced',
}: DetailProps & {position?: Point}) => (
  <group position={position}>
    <ToyContactShadow size={[1.84, 0.89]} opacity={0.2} />
    {[-0.54, 0.54].map((x) => (
      <group key={x}>
        <Solid size={[0.083, 0.42, 0.085]} at={[x, 0.23, -0.165]} color="#526066" kind="metal" quality={quality} />
        <Solid size={[0.083, 0.41, 0.075]} at={[x, 0.22, 0.173]} color="#526066" kind="metal" quality={quality} />
        <Solid size={[0.073, 0.42, 0.07]} at={[x, 0.63, -0.21]} color="#526066" kind="metal" quality={quality} />
      </group>
    ))}
    <Batch size={[1.43, 0.068, 0.125]} kind="wood" color="#BA815B" quality={quality}
      pieces={[-0.15, 0, 0.15].map((z) => ({position: [0, 0.435, z]}))} />
    <Batch size={[1.43, 0.11, 0.06]} kind="wood" color="#CB955F" quality={quality}
      pieces={[0.6, 0.75].map((y) => ({position: [0, y, -0.224]}))} />
  </group>
);

const Wheel = ({x, z, angle, quality}: DetailProps & {x: number; z: number; angle: number}) => (
  <group position={[x, 0.229, z]} rotation={[0, 0, angle]}>
    <Cylinder top={0.217} bottom={0.217} height={0.129} at={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}
      color="#3E3D49" kind="rubber" quality={quality} />
    <Cylinder top={0.12} bottom={0.12} height={0.145} at={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}
      color="#BFA58F" kind="metal" quality={quality} />
    <Solid size={[0.15, 0.05, 0.15]} at={[0, 0, 0]} color="#FFF1D1" kind="mattePlastic" quality={quality} />
  </group>
);

export const ToyVehicle = ({
  position = [0, 0, 0], heading = 0, distance = 0, color = '#F59756',
  variant = 'car', quality = 'balanced',
}: DetailProps & {position?: Point; heading?: number; distance?: number; color?: string; variant?: 'car' | 'bus' | 'train' | 'plane'}) => {
  if (variant === 'plane') {
    return (
      <group position={position} rotation={[0, heading, 0]}>
        <Ball at={[0, 0, 0]} scale={[1.41, 0.36, 0.39]} color={color} quality={quality} />
        <Ball at={[0.63, 0.18, 0]} scale={[0.49, 0.27, 0.29]} color="#627488" quality={quality} />
        <Solid at={[-0.21, -0.065, 0]} size={[0.71, 0.12, 2.72]} radius={0.056} color="#FBE7BE" quality={quality} />
        <Solid at={[-1.04, 0.25, 0]} size={[0.38, 0.58, 0.092]} radius={0.042} rotation={[0, 0, 0.28]} color={color} quality={quality} />
        {[-0.83, 0.83].map((z) => <Ball key={z} at={[-0.25, -0.17, z]} scale={[0.4, 0.165, 0.169]} color={color} quality={quality} />)}
      </group>
    );
  }

  const transit = variant !== 'car';
  const length = transit ? 3.2 : 1.9;
  const halfWidth = transit ? 0.54 : 0.465;
  const axle = transit ? 1.06 : 0.57;
  const turn = -distance / 0.217;
  return (
    <group position={position} rotation={[0, heading, 0]}>
      <ToyContactShadow position={[0, 0.008, 0]} size={[length * 1.06, halfWidth * 2.8]} opacity={0.33} />
      <Solid size={[length, 0.4, halfWidth * 1.95]} at={[0, 0.415, 0]} color={color} radius={0.184} quality={quality} />
      <Solid size={[length * 0.95, 0.103, halfWidth * 2]} at={[0, 0.275, 0]} color="#48505F" kind="rubber" quality={quality} />
      <Solid size={[transit ? length - 0.09 : 1.03, transit ? 0.69 : 0.41, halfWidth * 1.7]}
        at={[-0.1, transit ? 0.877 : 0.746, 0]} color={transit ? color : '#FFF1CF'} radius={0.165} quality={quality} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Batch size={[transit ? 0.475 : 0.37, transit ? 0.39 : 0.235, 0.06]} radius={0.055} color="#506777" quality={quality}
            pieces={(transit ? [-1.1, -0.5, 0.1, 0.68, 1.23] : [-0.33, 0.146]).map((x) => ({
              position: [x, transit ? 0.921 : 0.758, halfWidth * 0.83 * side],
            }))} />
          <Solid size={[length - 0.2, 0.063, 0.018]} at={[0, 0.469, halfWidth * 0.982 * side]}
            color="#FFEAC2" kind="paintedWood" quality={quality} />
          {[-axle, axle].map((x) => <Wheel key={x} x={x} z={side * halfWidth * 0.94} angle={turn} quality={quality} />)}
          <Ball at={[length * 0.503, 0.47, halfWidth * side * 0.62]} scale={[0.042, 0.092, 0.087]} color="#FFEACB" kind="emissive" quality={quality} />
          <Ball at={[-length * 0.503, 0.46, halfWidth * side * 0.66]} scale={[0.034, 0.055, 0.065]} color="#CE6156" quality={quality} />
        </group>
      ))}
      <Solid size={[0.035, transit ? 0.36 : 0.215, halfWidth * 1.36]} at={[transit ? length * 0.45 : 0.42, transit ? 0.93 : 0.76, 0]}
        color="#526B7D" radius={0.017} quality={quality} rotation={[0, 0, transit ? 0 : 0.34]} />
      <Solid size={[0.075, 0.065, halfWidth * 0.73]} at={[length * 0.5, 0.373, 0]} color="#1D334B" kind="metal" quality={quality} />
      {variant === 'train' && <Solid size={[1.7, 0.105, 0.79]} at={[0, 1.257, 0]} color="#DCE0C5" kind="metal" quality={quality} />}
    </group>
  );
};

// A closed-form lane clock allows a red stop without integrating velocity or
// changing the gap between a leading vehicle and the one behind it.
const trafficSchedule = (seconds: number) => {
  const time = seconds + 7.3;
  const period = 18;
  const phase = wrap(time, period);
  const departing = Math.min(phase, 0.8);
  const braking = Math.min(1.4, Math.max(0, phase - 12));
  const distance = departing * departing / 1.6 + Math.max(0, Math.min(phase, 12) - 0.8)
    + braking - (braking * braking) / 2.8;
  return {phase, distance: Math.floor(time / period) * 12.3 + distance};
};

const slots = [
  {speed: 2.0, phase: 6.8, lane: 4.53, direction: 1, color: '#E97269', variant: 'car'},
  {speed: 2.0, phase: 27.1, lane: 4.53, direction: 1, color: '#79A9AB', variant: 'car'},
  {speed: 2.45, phase: 4.2, lane: 6.12, direction: -1, color: '#E9AD62', variant: 'bus'},
  {speed: 2.45, phase: 21.7, lane: 6.12, direction: -1, color: '#B29AC5', variant: 'car'},
] as const;

export const ToyTraffic = ({frame, fps, quality = 'balanced'}: AnimatedWorldProps) => {
  const clock = trafficSchedule(frame / fps).distance;
  return <group>
    {slots.slice(0, quality === 'preview' ? 3 : 4).map(({speed, phase, lane, direction, color, variant}) => {
      const distance = clock * speed + phase;
      return <ToyVehicle key={phase} position={[direction * (wrap(distance, 34) - 17), -0.156, lane]}
        heading={direction > 0 ? 0 : Math.PI} distance={distance} color={color} variant={variant} quality={quality} />;
    })}
  </group>;
};

const TrafficLight = ({position, frame, fps, quality}: AnimatedWorldProps & {position: Point}) => {
  const {phase} = trafficSchedule(frame / fps);
  const index = phase < 12 ? 2 : phase < 13.4 ? 1 : 0;
  const lights = ['#FF6E6D', '#FFBD53', '#7AE4AB'];
  return (
    <group position={position}>
      <Cylinder top={0.034} bottom={0.049} height={1.99} at={[0, 1, 0]} kind="metal" color="#526B6D" quality={quality} />
      <Solid size={[0.33, 0.78, 0.27]} at={[0, 2.09, 0]} color="#455663" radius={0.1} quality={quality} />
      {lights.map((color, i) => (
        <group key={color} position={[0, 2.318 - i * 0.218, 0]}>
          <Solid size={[0.218, 0.06, 0.12]} at={[0, 0.086, 0.166]} color="#455663" quality={quality} />
          <Ball at={[0, 0, 0.143]} scale={[0.075, 0.073, 0.035]} color={index === i ? color : '#6A6F77'}
            kind={index === i ? 'emissive' : 'mattePlastic'} quality={quality} />
        </group>
      ))}
    </group>
  );
};

export const ToyPedestrian = ({
  frame, fps, route = 0, reaction = 0, seed = 0,
}: AnimatedWorldProps & {route?: number; reaction?: number}) => {
  const phase = wrap((frame / fps) * (0.62 + picks(seed, route) * 0.24) + route * 7.9 + 7, 24);
  const direction = route % 2 === 0 ? 1 : -1;
  const x = (phase - 12) * direction;
  const z = -2.78 - route * 0.35;
  const turning = reaction > 0.25 && Math.abs(x) < 6;
  return (
    <group position={[x, 0, z]} scale={0.55 + picks(seed, route + 3) * 0.12}>
      <ToyContactShadow size={[0.88, 0.74]} opacity={0.24} />
      <ToyCharacter frame={frame + route * 26} fps={fps} detail="background" action="walk"
        yaw={Math.PI * 0.5 * direction} config={route % 2 === 0 ? TOY_CAST.neighbor : TOY_CAST.vendor}
        emotion={turning ? 'surprise' : 'joy'} target={turning ? [z * direction, 1.7, -x * direction] : undefined} />
    </group>
  );
};

const tiles: Piece[] = Array.from({length: 22 * 7}, (_, i) => {
  const row = Math.floor(i / 22);
  const col = i % 22;
  const tint = ['#D3B496', '#DABA9D', '#DFBEA2', '#D4B5A0', '#DFC0A3', '#D7B59B'];
  return {position: [(col - 10.5) * 0.98 + (row % 2) * 0.48, -0.048, (row - 3) * 0.96],
    color: tint[Math.floor(picks(22, i) * tint.length)]};
});
const roadDash: Piece[] = Array.from({length: 22}, (_, i) => ({position: [(i - 10.5) * 1.53, -0.14, 4.99]}));
const curbs: Piece[] = Array.from({length: 33}, (_, i) => ({position: [(i - 16) * 0.873, -0.057, 3.36], color: i % 4 === 0 ? '#C28E7D' : '#E7CBB0'}));
const crossing: Piece[] = Array.from({length: 8}, (_, i) => ({position: [-4.04 - i * 0.29, -0.145, 4.87]}));

const Cloud = ({position, quality}: DetailProps & {position: Point}) => (
  <group position={position}>
    <Ball at={[-0.78, 0, 0]} scale={[0.83, 0.24, 0.36]} color="#F3DFCB" quality={quality} />
    <Ball at={[0.04, 0.14, 0]} scale={[0.78, 0.38, 0.46]} color="#F8E8CC" quality={quality} />
    <Ball at={[0.69, -0.01, 0.03]} scale={[0.79, 0.23, 0.34]} color="#F8E8CC" quality={quality} />
  </group>
);

const CornerSign = ({reaction, frame, fps, position, quality}: AnimatedWorldProps & {position: Point; reaction: number}) => (
  <group position={position}>
    <Cylinder top={0.038} bottom={0.06} height={2.79} at={[0, 1.41, 0]} color="#4B6467" kind="metal" quality={quality} />
    <Cylinder top={0.12} bottom={0.145} height={0.23} at={[0, 0.12, 0]} color="#537977" kind="metal" quality={quality} />
    <Solid size={[0.49, 0.078, 0.1]} at={[-0.22, 2.77, 0.027]} color="#4B6467" kind="metal" quality={quality} />
    <group position={[-0.43, 2.7, 0.029]} rotation={[0.11, 0.14, Math.sin(frame / fps * 3.7) * (0.037 + reaction * 0.23)]}>
      <Solid size={[0.78, 0.45, 0.12]} at={[0, -0.19, 0]} color="#425E6C" radius={0.14} quality={quality} />
      <Solid size={[0.29, 0.071, 0.032]} at={[0.058, -0.19, 0.067]} color="#F5D898" quality={quality} />
      <Solid size={[0.17, 0.065, 0.027]} at={[-0.132, -0.15, 0.067]} rotation={[0, 0, -0.58]} color="#F5D898" quality={quality} />
      <Solid size={[0.17, 0.065, 0.027]} at={[-0.132, -0.23, 0.067]} rotation={[0, 0, 0.58]} color="#F5D898" quality={quality} />
    </group>
  </group>
);

const CityArchitecture = memo(function CityArchitecture({seed, quality}: {seed: number; quality: ToyboxQuality}) {
  return <group>
    <Solid size={[43, 0.22, 30]} at={[0, -0.293, -2.2]} color="#D6B598" kind="concrete" quality={quality} />
    <Solid size={[34, 0.09, 4.55]} at={[0, -0.21, 5.02]} color="#71818B" kind="asphalt" quality={quality} />
    <Solid size={[29, 0.133, 7.27]} at={[0, -0.094, -0.35]} color="#C6A18A" kind="concrete" quality={quality} />
    <Batch pieces={tiles} size={[0.962, 0.089, 0.945]} kind="concrete" quality={quality} receiveShadow={quality !== 'preview'} />
    <Batch pieces={curbs} size={[0.86, 0.17, 0.31]} kind="concrete" quality={quality} />
    <Batch pieces={roadDash} size={[0.78, 0.019, 0.063]} color="#E7CAB0" quality={quality} />
    <Batch pieces={crossing} size={[0.16, 0.018, 2.79]} color="#D7C9B4" quality={quality} />
    <Solid size={[34, 0.04, 0.047]} at={[0, -0.164, 7.24]} color="#D6B995" quality={quality} />
    <Solid size={[34, 0.04, 0.045]} at={[0, -0.164, 3.65]} color="#D6B995" quality={quality} />

    {[-9, -3.4, 2.26, 7.6, 12.3].map((x, i) => (
      <ToyBuilding key={x} position={[x, -0.05, -10.3 - picks(seed, i) * 2.3]} variant="tower"
        scale={0.91 + picks(seed, i + 33) * 0.43} quality="preview" />
    ))}
    <ToyBuilding position={[-7.58, 0, -5.91]} variant={2} quality="preview" detail="background" />
    <ToyBuilding position={[-3.69, 0, -5.28]} variant={0} quality={quality} />
    <ToyBuilding position={[0.505, 0, -5.76]} variant={1} quality={quality} />
    <ToyBuilding position={[4.69, 0, -5.21]} variant={2} quality={quality} />
    <ToyBuilding position={[8.71, 0, -5.72]} variant={0} quality="preview" detail="background" />

  </group>;
});

export const ToyCity = ({
  frame, fps, seed = 12, quality = 'balanced', reaction = 0, traffic = true, pedestrians = true,
}: AnimatedWorldProps & {reaction?: number; traffic?: boolean; pedestrians?: boolean}) => (
  <group>
    <CityArchitecture seed={seed} quality={quality} />
    {([-9.76, -5.59, 3.2, 7.11] as const).map((x, i) => (
      <ToyVegetation key={x} position={[x, 0, -2.93 - i % 2 * 0.35]} size={i % 2 ? 0.9 : 1.06}
        frame={frame} fps={fps} seed={seed + i} quality={quality} />
    ))}
    <ToyVegetation position={[-3.75, 0, 2.67]} size={0.65} frame={frame} fps={fps} seed={seed + 7} quality={quality} bush />
    <ToyVegetation position={[5.72, 0, 2.55]} size={0.85} frame={frame} fps={fps} seed={seed + 9} quality={quality} bush />
    <ToyStreetLamp position={[-6.19, 0, 2.68]} quality={quality} />
    <ToyStreetLamp position={[5.47, 0, -2.67]} quality={quality} />
    <ToyBench position={[-5.27, 0, -2.57]} quality={quality} />
    <ToyBench position={[4.52, 0, -2.59]} quality={quality} />
    <TrafficLight position={[-4.71, 0, 3.04]} frame={frame} fps={fps} quality={quality} />
    <CornerSign position={[6.45, 0, 2.83]} frame={frame} fps={fps} quality={quality} reaction={reaction} />
    <Cloud position={[-5.6 + Math.sin(frame / fps * 0.13) * 0.7, 8.13, -8.4]} quality={quality} />
    <Cloud position={[4.8 + Math.sin(frame / fps * 0.1 + 2) * 1.2, 7.59, -9.7]} quality={quality} />
    {traffic && <ToyTraffic frame={frame} fps={fps} quality={quality} />}
    {pedestrians && [0, 1].slice(0, quality === 'preview' ? 1 : 2).map((route) => (
      <ToyPedestrian key={route} route={route} frame={frame} fps={fps} seed={seed} quality={quality} reaction={reaction} />
    ))}
  </group>
);

const Cup = ({position, color, quality}: DetailProps & {position: Point; color: string}) => (
  <group position={position}>
    <Cylinder top={0.117} bottom={0.09} height={0.176} at={[0, 0.101, 0]} color={color} quality={quality} />
    <Cylinder top={0.094} bottom={0.094} height={0.016} at={[0, 0.187, 0]} color="#634D50" kind="food" quality={quality} />
    <mesh position={[0.128, 0.108, 0]} material={getToyMaterial('mattePlastic', color, quality)}>
      <torusGeometry args={[0.049, 0.017, 8, 14]} />
    </mesh>
  </group>
);

export const ToyCafeTable = ({
  position = [0, 0, 0], quality = 'balanced', rotation = 0,
}: DetailProps & {position?: Point; rotation?: number}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <ToyContactShadow size={[2.8, 2.25]} opacity={0.24} />
    <Cylinder top={0.14} bottom={0.38} height={0.074} at={[0, 0.045, 0]} color="#536A72" kind="metal" quality={quality} />
    <Cylinder top={0.069} bottom={0.09} height={0.77} at={[0, 0.415, 0]} color="#60777C" kind="metal" quality={quality} />
    <Cylinder top={0.64} bottom={0.62} height={0.103} at={[0, 0.799, 0]} color="#9D7270" kind="paintedWood" quality={quality} />
    <Cylinder top={0.63} bottom={0.639} height={0.045} at={[0, 0.862, 0]} color="#F7D69A" kind="wood" quality={quality} />
    <Cup position={[0.25, 0.89, -0.08]} color="#F5E6C7" quality={quality} />
    <Cup position={[-0.27, 0.89, 0.14]} color="#B68CB6" quality={quality} />
    {[-1.77, 1.5, Math.PI].map((heading, i) => (
      <group key={heading} rotation={[0, heading, 0]}>
        <group position={[0, 0, 1.05]}>
          <Solid size={[0.44, 0.12, 0.43]} at={[0, 0.455, 0]} color={['#BF826E', '#8AA99D', '#AE8CB4'][i]} kind="fabric" radius={0.061} quality={quality} />
          <Solid size={[0.46, 0.3, 0.09]} at={[0, 0.729, 0.208]} color="#E7BC8B" kind="wood" radius={0.044} quality={quality} />
          {[-0.15, 0.15].flatMap((x) => [-0.16, 0.16].map((z) => (
            <Solid key={`${x}/${z}`} size={[0.047, z > 0 ? 0.72 : 0.42, 0.054]}
              at={[x, z > 0 ? 0.36 : 0.21, z]} color="#586E75" kind="metal" radius={0.019} quality={quality} rotation={[z * 0.41, 0, -x * 0.53]} />
          )))}
        </group>
      </group>
    ))}
  </group>
);

export const ToyConsole = ({
  position = [0, 0, 0], quality = 'balanced', signal = 0,
}: DetailProps & {position?: Point; signal?: number}) => (
  <group position={position}>
    <Solid size={[0.82, 0.066, 0.5]} at={[0, 0.037, 0.085]} color="#596577" kind="rubber" quality={quality} />
    <Solid size={[0.18, 0.23, 0.081]} at={[0, 0.188, -0.04]} color="#B59EB5" kind="metal" quality={quality} />
    <Solid size={[1.23, 0.79, 0.166]} at={[0, 0.59, -0.033]} color="#2F4554" radius={0.113} quality={quality} />
    <Solid size={[1.085, 0.619, 0.05]} at={[0, 0.61, 0.047]} color="#569387" radius={0.024} quality={quality} />
    <Batch size={[0.058, 0.12, 0.015]} radius={0.005} quality={quality}
      pieces={Array.from({length: 9}, (_, i) => ({position: [(i - 4) * 0.1, 0.574, 0.078],
        scale: [1, 0.35 + 1.55 * (0.5 + 0.5 * Math.sin(i * 0.78 - signal)), 1],
        color: i % 3 === 0 ? '#F8DB9C' : '#A6DBC0'}))} />
    <Solid size={[0.109, 0.031, 0.036]} at={[0.44, 0.241, 0.045]} color="#FFC578" kind="emissive" quality={quality} />
    <Solid size={[0.472, 0.07, 0.174]} at={[0.014, 0.051, 0.44]} color="#E2C597" radius={0.035} quality={quality} />
    <Batch size={[0.04, 0.027, 0.037]} color="#6F697D" quality={quality}
      pieces={Array.from({length: 14}, (_, i) => ({position: [((i % 7) - 3) * 0.058, 0.09, 0.41 + Math.floor(i / 7) * 0.055]}))} />
  </group>
);

export const ToyBeaker = ({
  position = [0, 0, 0], quality = 'balanced', fill = '#7CC8AA',
}: DetailProps & {position?: Point; fill?: string}) => (
  <group position={position}>
    <Cylinder top={0.128} bottom={0.215} height={0.263} at={[0, 0.14, 0]} color={fill} quality={quality} kind="translucentPlastic" />
    <Cylinder top={0.08} bottom={0.126} height={0.16} at={[0, 0.35, 0]} color="#D1DFD4" quality={quality} kind="glass" />
    <Cylinder top={0.105} bottom={0.09} height={0.048} at={[0, 0.458, 0]} color="#E1A876" quality={quality} kind="wood" />
    {[0.071, 0.122, 0.173].map((y, i) =>
      <Solid key={y} size={[i === 1 ? 0.07 : 0.14, 0.01, 0.013]} at={[0.037, y, 0.223 - y * 0.34]} color="#EAF3E2" radius={0.004} quality={quality} />)}
  </group>
);

export const ToyInterior = ({frame, fps, quality = 'balanced'}: AnimatedWorldProps) => (
  <group>
    <Solid size={[13, 0.173, 12]} at={[0, -0.089, 0.85]} color="#BC967F" kind="wood" quality={quality} />
    <Batch size={[0.62, 0.023, 7.9]} radius={0.008} kind="wood" quality={quality}
      pieces={Array.from({length: 18}, (_, i) => ({position: [(i - 8.5) * 0.64, -0.011, 0.65],
        color: ['#C69B78', '#D0A283', '#C5A088', '#CEA788'][i % 4]}))} />
    <Solid size={[12.98, 5.1, 0.24]} at={[0, 2.51, -3.32]} color="#DBB09A" kind="paintedWood" radius={0.1} quality={quality} />
    <Solid size={[12.9, 0.19, 0.13]} at={[0, 0.106, -3.11]} color="#AA7E70" quality={quality} />
    <Solid size={[13, 1.17, 0.094]} at={[0, 0.724, -3.13]} color="#C38D80" kind="paintedWood" quality={quality} />
    <Solid size={[13, 0.11, 0.14]} at={[0, 1.302, -3.04]} color="#E7B49A" quality={quality} />

    <group position={[-1.56, 2.93, -3.06]}>
      <Solid size={[2.74, 2.67, 0.21]} radius={0.18} color="#798D98" quality={quality} />
      <Solid size={[2.45, 2.39, 0.16]} at={[0, 0.01, 0.095]} radius={0.135} color="#9FC3BA" quality={quality} />
      <Solid size={[0.102, 2.42, 0.15]} at={[0, 0, 0.189]} color="#DEF0D4" quality={quality} />
      <Solid size={[2.55, 0.098, 0.154]} at={[0, 0.017, 0.19]} color="#DEF0D4" quality={quality} />
      <Solid size={[2.96, 0.105, 0.41]} at={[0, -1.315, 0.11]} color="#F4D6AC" kind="wood" quality={quality} />
      <group position={[-0.98, -0.82, 0.082]} scale={0.4}><Cloud position={[0, 0, 0]} quality={quality} /></group>
      <group position={[0.63 + Math.sin(frame / fps * 0.27) * 0.18, 0.68, 0.057]} scale={0.35}>
        <Cloud position={[0, 0, 0]} quality={quality} />
      </group>
      {[-1.32, 1.32].map((x, i) => <Solid key={x} size={[0.48, 2.72, 0.18]} at={[x, 0.08, 0.245]}
        color={i ? '#B18086' : '#BF888B'} kind="fabric" radius={0.084} quality={quality}
        rotation={[0, 0, Math.sin(frame / fps * 1.18 + i) * 0.036]} />)}
    </group>
    <group position={[2.69, 0, -2.41]}>
      <Solid size={[3.0, 0.15, 1.15]} at={[0, 0.91, 0]} color="#E5B782" kind="wood" radius={0.071} quality={quality} />
      <Solid size={[2.76, 0.71, 0.94]} at={[0, 0.473, 0]} color="#896D7A" kind="paintedWood" radius={0.095} quality={quality} />
      {[-0.89, 0, 0.89].map((x, i) => (
        <group key={x} position={[x, 0.46, 0.477]}>
          <Solid size={[0.81, 0.57, 0.09]} color={i % 2 ? '#C08988' : '#A98792'} radius={0.044} quality={quality} />
          <Solid size={[0.216, 0.043, 0.059]} at={[0, 0.135, 0.054]} color="#F0CB8D" kind="metal" quality={quality} />
        </group>
      ))}
      <ToyConsole position={[0.12, 0.996, 0]} signal={frame / fps * 2} quality={quality} />
      <ToyBeaker position={[-0.96, 0.996, -0.13]} quality={quality} />
      <ToyBeaker position={[-0.66, 0.996, 0.23]} fill="#D9A083" quality={quality} />
      <Solid size={[2.25, 0.102, 0.43]} at={[0.03, 2.42, -0.559]} color="#E7BA89" kind="wood" quality={quality} />
      {Array.from({length: 7}, (_, i) => (
        <Solid key={i} size={[0.116, 0.31 + (i % 4) * 0.07, 0.264]} at={[-0.4 + i * 0.147, 2.624 + (i % 4) * 0.035, -0.522]}
          color={['#6A868C', '#C07D76', '#D8A969', '#9F7D9F'][i % 4]} kind="paper" quality={quality}
          rotation={[0, 0, i === 6 ? -0.15 : 0]} />
      ))}
    </group>
    <ToyVegetation position={[-3.31, 0, -1.98]} frame={frame} fps={fps} size={1.13} seed={2} quality={quality} />
    <ToyCafeTable position={[-2.7, 0, 0.4]} rotation={-0.34} quality={quality} />
    <Cylinder top={1.78} bottom={1.78} height={0.022} at={[0.53, 0.016, 0.54]} color="#A5798B" kind="fabric" quality={quality} />
    <Cylinder top={1.61} bottom={1.61} height={0.02} at={[0.53, 0.024, 0.54]} color="#C29798" kind="fabric" quality={quality} />
  </group>
);

export const ToyPlanet = ({
  position = [0, 0, 0], size = 1, frame, fps, quality = 'balanced', rings = true,
}: AnimatedWorldProps & {position?: Point; size?: number; rings?: boolean}) => (
  <group position={position} scale={size} rotation={[0.18, 0.31, -0.19]}>
    <group rotation={[0, frame / fps * 0.25, 0]}>
      <Ball at={[0, 0, 0]} scale={[1, 0.94, 1]} color="#7762AF" kind="stone" quality={quality} />
      {([-0.48, -0.28, 0.04, 0.31, 0.47] as const).map((latitude, i) => (
        <mesh key={latitude} position={[0, latitude * 0.92, 0]} rotation={[Math.PI * 0.5, 0, 0]}
          material={getToyMaterial('mattePlastic', ['#A47AB3', '#8F75CB', '#B999DA', '#8272B5', '#A78CC4'][i], quality)}>
          <torusGeometry args={[Math.sqrt(1 - latitude * latitude) + 0.001, i === 2 ? 0.055 : 0.032, 10, 45]} />
        </mesh>
      ))}
      <Ball at={[0.25, 0.18, 0.91]} scale={[0.24, 0.105, 0.11]} color="#E4A388" kind="stone" quality={quality} />
      <Ball at={[-0.48, -0.42, 0.736]} scale={[0.16, 0.108, 0.159]} color="#6656A9" kind="stone" quality={quality} />
    </group>
    {rings && [1.35, 1.44, 1.58].map((radius, i) => (
      <mesh key={radius} rotation={[1.47, 0.17, 0]} material={getToyMaterial('mattePlastic', ['#F2B591', '#D18EA5', '#E7AC8C'][i], quality)}>
        <torusGeometry args={[radius, i === 2 ? 0.024 : 0.036, 8, 64]} />
      </mesh>
    ))}
  </group>
);

export const ToySpace = ({frame, fps, quality = 'balanced', seed = 21}: AnimatedWorldProps) => {
  const stars = useMemo(() => Array.from({length: quality === 'preview' ? 41 : 74}, (_, i) => {
    const radius = 0.025 + picks(seed, i * 4 + 1) * 0.054;
    return {
      position: [(picks(seed, i * 4 + 2) - 0.5) * 27, picks(seed, i * 4 + 3) * 18 - 1, -15 - picks(seed, i * 4 + 4) * 6] as Point,
      scale: [radius, radius * (i % 6 ? 1 : 1.65), radius] as Point,
      rotation: [0.09, i * 0.211, Math.PI / 4] as Point,
      color: ['#F8E0A8', '#91BAF2', '#E4B3C7', '#BFE1D7'][i % 4],
    };
  }), [seed, quality]);
  const orbit = frame / fps * 0.26 + 0.7;
  return (
    <group>
      <Batch size={[1, 1, 1]} pieces={stars} kind="emissive" quality={quality} />
      <ToyPlanet position={[-0.56, 3.52, -4.06]} size={1.2} frame={frame} fps={fps} seed={seed} quality={quality} />
      <Ball at={[-0.56 + Math.cos(orbit) * 2.44, 3.52 + Math.sin(orbit) * 0.39, -4.06 + Math.sin(orbit) * 0.92]}
        scale={[0.23, 0.23, 0.23]} color="#E8BFA5" kind="stone" quality={quality} />
      <Cylinder top={2.57} bottom={2.08} height={0.32} at={[0, -0.33, 0]} color="#74619B" kind="stone" quality={quality} />
      <Cylinder top={2.6} bottom={2.57} height={0.19} at={[0, -0.109, 0]} color="#3E697F" kind="metal" quality={quality} />
      <Cylinder top={2.55} bottom={2.58} height={0.036} at={[0, -0.03, 0]} color="#8AB1BE" kind="stone" quality={quality} />
      {[2.14, 2.4].map((radius, i) => (
        <mesh key={radius} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}
          material={getToyMaterial(i ? 'emissive' : 'rubber', i ? '#A8DECB' : '#5F86A8', quality)}>
          <torusGeometry args={[radius, i ? 0.025 : 0.018, 8, 58]} />
        </mesh>
      ))}
      <ToyConsole position={[-1.35, 0, -1.17]} quality={quality} signal={frame / fps} />
      <ToyBeaker position={[-1.97, 0, -0.68]} quality={quality} fill="#CAA0D7" />
      <ToyVehicle variant="plane" position={[4.35 + Math.sin(orbit) * 0.73, 3.48 + Math.sin(orbit * 1.6) * 0.4, -7.32]}
        heading={0.61} color="#EA9C82" quality={quality} />
    </group>
  );
};
