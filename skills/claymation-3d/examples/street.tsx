import React, {memo, useEffect, useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {ClayMaterial, ClayPiece} from './surface';
import {shopPainting, shopPigments, type Shop} from './shop-paint';
import {seededRandom} from './timing';

type V3 = [number, number, number];
type Detail = 'draft' | 'final';
type Placement = {position?: V3; rotationY?: number; scale?: number};
const cream = '#edcda0';
const dark = '#3a4044';

// A thin slice cut from a rolled-out slab. Branches, rim bands and glass each have
// real depth, so their overlaps and silhouettes survive changes of camera angle.
const Slab = ({size, at, color, tilt = 0}: {size: V3; at: V3; color: string; tilt?: number}) => (
  <ClayPiece
    shape="slab"
    size={size}
    position={at}
    color={color}
    rotation-z={tilt}
    detail="draft"
    relief={0.5}
  />
);
const Blob = ({
  size,
  at,
  color,
  tilt = 0,
  seed = 1,
}: {
  size: V3;
  at: V3;
  color: string;
  tilt?: number;
  seed?: number;
}) => (
  <ClayPiece
    shape="blob"
    size={size}
    position={at}
    color={color}
    rotation-z={tilt}
    seed={seed}
    detail="draft"
  />
);

function archOutline(path: THREE.Path, width: number, height: number, rise: number) {
  const x = width / 2,
    y = height / 2;
  path.moveTo(-x, -y);
  path.lineTo(x, -y);
  path.lineTo(x, y - rise);
  path.absellipse(0, y - rise, x, rise, 0, Math.PI, false, 0);
  path.closePath();
}

// The glass sits behind a raised architrave, with real jambs between glass and stucco.
function UpperWindow({
  width,
  height,
  texture,
  shop,
}: {
  width: number;
  height: number;
  texture: THREE.Texture;
  shop: Shop;
}) {
  const {ring, pane} = useMemo(() => {
    const rise = height * 0.16,
      arch = new THREE.Shape(),
      surround = new THREE.Shape(),
      opening = new THREE.Path();
    archOutline(arch, width, height, rise);
    archOutline(surround, width + 0.105, height + 0.105, rise + 0.05);
    archOutline(opening, width, height, rise);
    surround.holes.push(opening);
    const pane = new THREE.ShapeGeometry(arch, 12);
    const uv = pane.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / width + 0.5, uv.getY(i) / height + 0.5);
    return {ring: surround, pane};
  }, [width, height]);
  useEffect(() => () => pane.dispose(), [pane]);
  return (
    <>
      <mesh geometry={pane} position-z={0.037} receiveShadow>
        <meshStandardMaterial map={texture} roughness={0.89} />
      </mesh>
      <mesh castShadow receiveShadow>
        <extrudeGeometry
          args={[
            ring,
            {depth: 0.095, bevelSize: 0.011, bevelThickness: 0.013, bevelSegments: 2, curveSegments: 12},
          ]}
        />
        <ClayMaterial color={shopPigments[shop].trim} relief={0.35} />
      </mesh>
      <Slab at={[0, 0, 0.051]} size={[0.026, height - 0.014, 0.027]} color={shopPigments[shop].frame} />
      <Slab at={[0, height * 0.233, 0.055]} size={[width, 0.029, 0.025]} color={shopPigments[shop].frame} />
      <Slab
        at={[0, -height / 2 - 0.041, 0.061]}
        size={[width + 0.16, 0.075, 0.18]}
        color={shopPigments[shop].trim}
      />
    </>
  );
}

const Panel = memo(function Panel({
  kind,
  shop,
  width,
  height,
  at,
  seed,
}: {
  kind: Parameters<typeof shopPainting>[1];
  shop: Shop;
  width: number;
  height: number;
  at: V3;
  seed: number;
}) {
  const texture = useMemo(() => shopPainting(shop, kind, seed), [shop, kind, seed]);
  useEffect(() => () => texture.dispose(), [texture]);
  if (kind === 'upstairs')
    return (
      <group position={at}>
        <UpperWindow width={width} height={height} texture={texture} shop={shop} />
      </group>
    );
  return (
    <group position={at}>
      <Slab at={[0, 0, 0]} size={[width + 0.1, height + 0.1, 0.12]} color={shopPigments[shop].trim} />
      <mesh receiveShadow position-z={0.085}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={texture} roughness={0.93} />
      </mesh>
      {kind !== 'sign' && (
        <Slab
          at={[0, -height / 2 - 0.05, 0.07]}
          size={[width + 0.18, 0.085, 0.19]}
          color={shopPigments[shop].trim}
        />
      )}
    </group>
  );
});

// One mesh for the folded canopy and its scalloped hem, including both stripe colors.
function makeAwning(width: number, color: string) {
  const vertices: number[] = [],
    colors: number[] = [];
  const stripes = 9,
    steps = 4;
  for (let stripe = 0; stripe < stripes; stripe++) {
    const pigment = new THREE.Color(stripe % 2 ? cream : color);
    const point = (column: number, row: number): V3 => {
      const u = column / steps,
        x = width * ((stripe + u) / stripes - 0.5);
      const sag = 0.026 * Math.sin(Math.PI * u);
      if (row === 0) return [x, 0, 0];
      if (row === 1) return [x, -0.03 + sag, 0.22];
      if (row === 2) return [x, -0.17 + sag, 0.46];
      return [x, -0.23 - 0.085 * Math.sin(Math.PI * u), 0.47];
    };
    for (let i = 0; i < steps; i++)
      for (let row = 0; row < 3; row++) {
        for (const [x, y] of [
          [i, row],
          [i + 1, row],
          [i, row + 1],
          [i + 1, row],
          [i + 1, row + 1],
          [i, row + 1],
        ]) {
          vertices.push(...point(x, y));
          colors.push(pigment.r, pigment.g, pigment.b);
        }
      }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}
function Awning({width, color}: {width: number; color: string}) {
  const geometry = useMemo(() => makeAwning(width, color), [width, color]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.94} side={THREE.DoubleSide} />
    </mesh>
  );
}

const roofProfile = new THREE.Shape();
roofProfile.moveTo(-0.28, -0.035);
roofProfile.lineTo(-0.28, 0.03);
roofProfile.lineTo(0.08, 0.6);
roofProfile.quadraticCurveTo(0.4, 0.63, 0.95, 0.92);
roofProfile.lineTo(1.99, 0.22);
roofProfile.lineTo(2.03, 0);
roofProfile.closePath();

// Shingles are little overlapping pieces cut from one sheet of clay. The front skirt
// of the mansard slopes inward from z=0.24 at y=.03 to z=-.12 at y=.60.
function SlateCourses({width, color, seed}: {width: number; color: string; seed: number}) {
  const geometry = useMemo(() => {
    const positions: number[] = [],
      colors: number[] = [];
    const divisions = Math.ceil(width / 0.27),
      pitch = width / divisions,
      rows = 4;
    const base = new THREE.Color(color),
      shade = new THREE.Color();
    const z = (y: number) => 0.24 - ((y - 0.03) * 0.36) / 0.57 + 0.052;
    for (let row = 0; row < rows; row++) {
      const shift = (row % 2) * 0.5;
      for (let col = -1; col < divisions; col++) {
        const left = Math.max(0, (col + shift) * pitch) + 0.003;
        const right = Math.min(width, (col + shift + 1) * pitch) - 0.003;
        if (right - left < 0.025) continue;
        const r = seededRandom(seed + row, col);
        const y = 0.035 + row * 0.136 + (r - 0.5) * 0.009,
          top = y + 0.148;
        const points = [
          [left + 0.006, y + 0.013, z(y) + 0.012],
          [left + 0.034, y, z(y) + 0.013],
          [right - 0.024, y - 0.001, z(y) + 0.013],
          [right, y + 0.009, z(y) + 0.012],
          [right, top, z(top)],
          [left, top, z(top)],
        ];
        shade.copy(base).multiplyScalar(0.87 + 0.17 * r);
        for (const idx of [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5]) {
          const [x, y, z] = points[idx];
          positions.push(x - width / 2, y, z);
          colors.push(shade.r, shade.g, shade.b);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [width, color, seed]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.95} />
    </mesh>
  );
}

export const ClayBuilding = memo(function ClayBuilding({
  shop = 'post',
  width = 3.3,
  height = 3.2,
  position = [0, 0, 0],
  rotationY = 0,
  scale = 1,
  seed = 1,
}: Placement & {shop?: Shop; width?: number; height?: number; seed?: number}) {
  const {wall, trim, frame, roof} = shopPigments[shop];
  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <Slab size={[width, height, 2.07]} at={[0, height / 2, -1]} color={wall} />
      <mesh position={[0, height - 0.13, -0.97]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.075, 0.19, 2.13]} />
        <ClayMaterial color={trim} relief={0.4} />
      </mesh>
      <mesh castShadow receiveShadow position={[-width / 2 - 0.065, height, -0.04]} rotation-y={Math.PI / 2}>
        <extrudeGeometry
          args={[
            roofProfile,
            {
              depth: width + 0.13,
              bevelEnabled: true,
              bevelSize: 0.035,
              bevelThickness: 0.035,
              bevelSegments: 2,
              curveSegments: 5,
            },
          ]}
        />
        <ClayMaterial color={roof} relief={0.5} />
      </mesh>
      <group position-y={height}>
        <SlateCourses width={width + 0.14} color={roof} seed={seed} />
      </group>
      <Slab at={[width * 0.31, height + 0.8, -1.2]} size={[0.32, 0.88, 0.32]} color={wall} />
      <Slab at={[width * 0.31, height + 1.24, -1.2]} size={[0.41, 0.12, 0.42]} color={roof} />
      {[-1, 0, 1].map((side) => (
        <Panel
          key={side}
          at={[side * width * 0.305, (height + 1.88) / 2, 0.06]}
          width={width * 0.165}
          height={(height - 1.92) * 0.69}
          kind="upstairs"
          shop={shop}
          seed={seed + side + 3}
        />
      ))}
      <Slab at={[0, 1.82, -0.03]} size={[width + 0.06, 0.085, 0.44]} color={trim} />
      <Slab at={[0, 0.79, 0.02]} size={[width - 0.09, 1.67, 0.17]} color={frame} />
      <Panel
        at={[-width * 0.18, 0.73, 0.15]}
        width={width * 0.52}
        height={0.98}
        kind="display"
        shop={shop}
        seed={seed}
      />
      <Panel
        at={[width * 0.31, 0.71, 0.15]}
        width={width * 0.215}
        height={1.27}
        kind="door"
        shop={shop}
        seed={seed + 1}
      />
      <Panel at={[0, 1.66, 0.17]} width={width - 0.27} height={0.3} kind="sign" shop={shop} seed={seed} />
      <group position={[-width * 0.18, 1.405, 0.22]}>
        <Awning width={width * 0.59} color={frame} />
      </group>
    </group>
  );
});

type Brick = {at: V3; size: V3; angle: number; color: string};
// Batch the repeated paving and little stamped flecks using one reusable bevelled tile.
function Pavers({stones}: {stones: Brick[]}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 1, 0.095), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    const transform = new THREE.Object3D(),
      pigment = new THREE.Color();
    stones.forEach((stone, i) => {
      transform.position.fromArray(stone.at);
      transform.scale.fromArray(stone.size);
      transform.rotation.y = stone.angle;
      transform.updateMatrix();
      mesh.current!.setMatrixAt(i, transform.matrix);
      mesh.current!.setColorAt(i, pigment.set(stone.color));
    });
    mesh.current!.instanceMatrix.needsUpdate = true;
    mesh.current!.instanceColor!.needsUpdate = true;
    mesh.current!.computeBoundingSphere();
  }, [stones]);
  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, stones.length]} receiveShadow>
      <meshStandardMaterial roughness={0.96} />
    </instancedMesh>
  );
}

export const ClayGround = memo(function ClayGround({seed = 11, width = 22}: {seed?: number; width?: number}) {
  const stones = useMemo(() => {
    const tiles: Brick[] = [];
    const swatches = ['#d3b79e', '#d9bda1', '#d9bea4', '#d3b9a0', '#dbc2a9', '#d7baa1'];
    const road = ['#7b8585', '#7e8887', '#838d89', '#80898a', '#7e8788'];
    for (let row = -6; row < 16; row++) {
      const isRoad = row >= 7 && row < 12;
      const depth = 0.48,
        length = isRoad ? 0.58 : 0.99;
      for (let col = 0; col < Math.ceil(width / length) + 1; col++) {
        const id = row * 1000 + col,
          v = seededRandom(seed, id);
        const x = col * length - width / 2 + ((row % 2) * length) / 2;
        const z = 1.87 - row * depth;
        const palette = isRoad ? road : swatches;
        tiles.push({
          at: [x, isRoad ? -0.135 : -0.044, z],
          size: [length - 0.013, 0.085, depth - 0.014],
          angle: (v - 0.5) * 0.008,
          color: palette[Math.floor(seededRandom(seed + 1, id) * palette.length)],
        });
      }
    }
    return tiles;
  }, [seed, width]);
  return (
    <>
      <mesh receiveShadow position={[0, -0.2, -0.8]}>
        <boxGeometry args={[width + 2, 0.13, 11]} />
        <meshStandardMaterial color="#a19988" roughness={1} />
      </mesh>
      <Pavers stones={stones} />
    </>
  );
});

export const ClayTree = memo(function ClayTree({
  position,
  rotationY = 0,
  scale = 1,
  seed = 1,
  leaf = '#78926a',
}: Placement & {seed?: number; leaf?: string}) {
  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <Blob at={[0, 0.76, 0]} size={[0.2, 1.59, 0.23]} color="#876956" tilt={-0.06} />
      <Blob at={[-0.16, 1.29, 0.04]} size={[0.115, 0.81, 0.13]} color="#886953" tilt={0.55} />
      <Blob at={[0.14, 1.4, 0]} size={[0.129, 0.75, 0.13]} color="#886953" tilt={-0.49} />
      {Array.from({length: 9}, (_, i) => {
        const a = i * 2.39996 + seed * 0.2;
        const radius = 0.4 * Math.sqrt(i / 8);
        return (
          <ClayPiece
            key={i}
            shape="pear"
            detail="draft"
            seed={i + seed}
            size={[0.71, 0.78, 0.65]}
            position={[radius * Math.cos(a), 1.65 + 0.51 * (1 - i / 9), radius * Math.sin(a)]}
            rotation-z={0.25 * Math.cos(a)}
            color={i % 4 === 0 ? '#92a877' : leaf}
          />
        );
      })}
    </group>
  );
});

export const ClayCar = memo(function ClayCar({
  position,
  rotationY = 0,
  scale = 1,
  color = '#d5ac65',
  distance = 0,
}: Placement & {color?: string; distance?: number}) {
  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <ClayPiece shape="loaf" size={[1.47, 0.47, 0.73]} position={[0, 0.36, 0]} color={color} detail="draft" />
      <ClayPiece
        shape="loaf"
        size={[0.89, 0.54, 0.65]}
        position={[-0.1, 0.58, 0]}
        color="#547378"
        detail="draft"
      />
      <ClayPiece
        shape="loaf"
        size={[0.89, 0.16, 0.68]}
        position={[-0.12, 0.83, 0]}
        color={color}
        detail="draft"
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Slab at={[-0.16, 0.63, side * 0.317]} size={[0.057, 0.33, 0.053]} color={color} />
          <Blob at={[0.59, 0.44, side * 0.225]} size={[0.18, 0.15, 0.16]} color="#f7d99b" />
          {[-0.45, 0.43].map((x) => (
            <group key={x} position={[x, 0.18, side * 0.325]} rotation-z={-distance / 0.18}>
              <mesh castShadow rotation-x={Math.PI / 2}>
                <cylinderGeometry args={[0.176, 0.176, 0.135, 18]} />
                <meshStandardMaterial color={dark} roughness={0.98} />
              </mesh>
              <Blob at={[0, 0, side * 0.072]} size={[0.19, 0.19, 0.043]} color={cream} />
              <Blob at={[0.042, 0.017, side * 0.091]} size={[0.027, 0.026, 0.012]} color="#8b7867" />
            </group>
          ))}
        </group>
      ))}
      <Slab at={[0.66, 0.27, 0]} size={[0.1, 0.086, 0.6]} color="#bcc1af" />
    </group>
  );
});

const mailboxCurve = [
  [0.02, 0.02],
  [0.27, 0.02],
  [0.29, 0.05],
  [0.29, 0.11],
  [0.235, 0.145],
  [0.22, 0.21],
  [0.23, 0.96],
  [0.25, 1.02],
  [0.24, 1.055],
  [0.287, 1.09],
  [0.285, 1.135],
  [0.25, 1.16],
  [0.2, 1.22],
  [0.1, 1.254],
  [0.024, 1.29],
  [0.001, 1.294],
].map(([r, y]) => new THREE.Vector2(r, y));

export const ClayLetterbox = memo(function ClayLetterbox({position, rotationY = 0, scale = 1}: Placement) {
  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <mesh castShadow receiveShadow>
        <latheGeometry args={[mailboxCurve, 40]} />
        <ClayMaterial color="#ad4b43" />
      </mesh>
      <Slab at={[0, 0.93, 0.225]} size={[0.29, 0.115, 0.039]} color="#85463d" />
      <Slab at={[0, 0.935, 0.244]} size={[0.235, 0.05, 0.019]} color="#473b39" />
      <Slab at={[0, 1.0, 0.22]} size={[0.32, 0.055, 0.115]} color="#cc7054" />
      <Slab at={[0, 0.648, 0.222]} size={[0.223, 0.285, 0.04]} color={cream} />
      <Slab at={[0, 0.695, 0.247]} size={[0.165, 0.018, 0.009]} color="#746d62" />
      <Slab at={[0, 0.65, 0.247]} size={[0.13, 0.011, 0.009]} color="#867969" />
      <Slab at={[0, 0.627, 0.247]} size={[0.13, 0.011, 0.009]} color="#867969" />
    </group>
  );
});

export const ClayFlowerPot = memo(function ClayFlowerPot({
  position,
  rotationY = 0,
  scale = 1,
  seed = 1,
}: Placement & {seed?: number}) {
  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <mesh castShadow receiveShadow position-y={0.13}>
        <cylinderGeometry args={[0.2, 0.14, 0.26, 16]} />
        <ClayMaterial color="#b77556" />
      </mesh>
      <Slab at={[0, 0.249, 0]} size={[0.37, 0.042, 0.36]} color="#69584d" />
      {Array.from({length: 7}, (_, i) => {
        const a = 2.39996 * i + seed,
          h = 0.32 + 0.12 * seededRandom(seed, i),
          x = 0.13 * Math.cos(a),
          z = 0.13 * Math.sin(a);
        return (
          <group key={i}>
            <Blob
              at={[x, h, z]}
              size={[0.082, 0.25, 0.055]}
              color={i % 2 ? '#75906c' : '#647d63'}
              tilt={-x * 3.2}
            />
            {i % 2 === 0 && (
              <Blob
                at={[x * 1.28, h + 0.1, z]}
                size={[0.105, 0.087, 0.093]}
                color={i % 4 ? '#e5af55' : '#c57878'}
              />
            )}
          </group>
        );
      })}
    </group>
  );
});

function Resident({
  x,
  z,
  seconds,
  phase,
  coat,
  direction = 1,
}: {
  x: number;
  z: number;
  seconds: number;
  phase: number;
  coat: string;
  direction?: number;
}) {
  const step = seconds * 5.5 + phase,
    bob = 0.024 * Math.cos(step * 2);
  return (
    <group position={[x, 0, z]} rotation-y={direction * 1.18} scale={0.86}>
      <group position-y={bob}>
        <ClayPiece shape="pear" color={coat} position={[0, 0.66, 0]} size={[0.38, 0.51, 0.35]} detail="draft" />
        <Blob at={[0, 1.04, 0]} color="#cf9574" size={[0.27, 0.32, 0.25]} />
        <Blob at={[0, 1.15, -0.016]} color="#625855" size={[0.29, 0.17, 0.27]} />
        <Blob at={[0, 1.036, 0.117]} color="#c68b6c" size={[0.104, 0.094, 0.101]} />
      </group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <group position={[side * 0.095, 0.48, 0]} rotation-x={side * 0.44 * Math.sin(step)}>
            <Blob at={[0, -0.2, 0]} color="#575c62" size={[0.12, 0.44, 0.13]} />
            <Blob at={[0, -0.4, 0.042]} color="#544c48" size={[0.14, 0.14, 0.22]} />
          </group>
          <group position={[side * 0.155, 0.8 + bob, 0]} rotation-x={side * -0.5 * Math.sin(step)}>
            <Blob at={[0, -0.14, 0]} color={coat} size={[0.13, 0.33, 0.14]} />
          </group>
        </group>
      ))}
    </group>
  );
}

const Backdrop = memo(function Backdrop({seed, quality}: {seed: number; quality: Detail}) {
  return (
    <>
      <ClayGround seed={seed} />
      <ClayBuilding shop="post" position={[-0.16, -0.02, -4.76]} width={3.38} height={3.26} seed={seed} />
      <ClayBuilding
        shop="bakery"
        position={[-3.59, -0.02, -4.94]}
        rotationY={0.045}
        width={3.34}
        height={3.62}
        seed={seed + 8}
      />
      <ClayBuilding
        shop="florist"
        position={[3.28, -0.02, -4.82]}
        rotationY={-0.045}
        width={3.43}
        height={3.05}
        seed={seed + 3}
      />
      <ClayTree position={[3.66, 0, -0.6]} scale={1.15} seed={seed + 12} />
      <ClayTree position={[-3.56, 0, -3.99]} scale={0.94} seed={seed + 1} />
      <ClayTree position={[1.79, 0, -4.12]} scale={0.74} seed={seed + 2} />
      <ClayLetterbox position={[-1.75, 0, -0.5]} rotationY={0.22} />
      <ClayFlowerPot position={[-2.12, 0, -0.5]} scale={0.74} seed={seed} />
      <ClayFlowerPot position={[1.24, 0, -4.22]} scale={0.87} seed={seed + 6} />
      {quality === 'final' && <ClayFlowerPot position={[-2.34, 0, -4.04]} seed={seed + 3} />}
      {/* Rear street breaks the horizon behind chimneys and the gaps between the shops. */}
      {[-2, -1, 0, 1, 2].map((i) => (
        <group key={i} position={[i * 3.6, 0, -9.8 - (i % 2)]}>
          <Slab
            at={[0, 2.19, -1]}
            size={[3.25, 4.5 + 0.48 * Math.cos(i * 2), 2.2]}
            color={i % 2 ? '#bca698' : '#c7b89f'}
          />
          <ClayPiece
            shape="loaf"
            position={[0, 4.2 + 0.24 * Math.cos(i * 2), -1]}
            size={[3.47, 1.0, 2.43]}
            detail="draft"
            color="#9c918e"
          />
          <Slab at={[-0.7, 4.73 + 0.24 * Math.cos(i * 2), -1.1]} size={[0.31, 0.91, 0.38]} color="#aa9789" />
        </group>
      ))}
    </>
  );
});

export function ClayStreet({
  seconds,
  seed = 11,
  quality = 'final',
}: {
  seconds: number;
  seed?: number;
  quality?: Detail;
}) {
  const carA = seconds * 1.05,
    carB = -seconds * 0.87;
  return (
    <>
      <Backdrop seed={seed} quality={quality} />
      <ClayCar position={[-4.7 + carA, -0.092, -2.26]} color="#d1a35d" distance={carA} />
      <ClayCar
        position={[5.0 + carB, -0.092, -3.32]}
        rotationY={Math.PI}
        scale={0.87}
        color="#749fa4"
        distance={-carB / 0.87}
      />
      <Resident x={-2.38 + seconds * 0.3} z={-4.03} coat="#a16363" seconds={seconds} phase={1.9} />
      <Resident
        x={2.37 - seconds * 0.21}
        z={-4.16}
        coat="#748b74"
        seconds={seconds}
        phase={0.7}
        direction={-1}
      />
    </>
  );
}
