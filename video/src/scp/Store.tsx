import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box, Material, Mat} from '../slime/parts';
import {V3} from './cues';
import {B, BEYOND, CEIL, ENTRANCE_Z, LAMP_ROWS, LAMP_ROWS_BEYOND, LAMP_X, STORE, Z_BEYOND, Z_MIN, room} from './store';

const M4 = new THREE.Matrix4();
const COL = new THREE.Color();

// One instanced mesh of boxes that never move. Built once; three.js culls it by its own bounding sphere.
const Static: React.FC<{boxes: B[]; shadow?: boolean}> = ({boxes, shadow = true}) => {
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({flatShading: true, roughness: 0.82, metalness: 0, envMapIntensity: 0.35}),
      boxes.length,
    );
    boxes.forEach((b, i) => {
      M4.makeScale(...b.s).setPosition(...b.p);
      m.setMatrixAt(i, M4);
      m.setColorAt(i, COL.set(b.c));
    });
    m.computeBoundingSphere();
    m.castShadow = shadow;
    m.receiveShadow = true;
    return m;
  }, [boxes, shadow]);
  return <primitive object={mesh} />;
};

// Ceiling light panels. brightness(x, z) 0..1 is evaluated every frame (lights going out row by row).
const Lamps: React.FC<{rows: number[]; brightness: (x: number, z: number) => number}> = ({rows, brightness}) => {
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(2.2, 0.07, 0.34), new THREE.MeshBasicMaterial({toneMapped: false}), rows.length * LAMP_X.length);
    let i = 0;
    for (const z of rows)
      for (const x of LAMP_X) {
        M4.makeTranslation(x, CEIL - 0.55, z);
        m.setMatrixAt(i++, M4);
      }
    m.computeBoundingSphere();
    return m;
  }, [rows]);
  let i = 0;
  const off = new THREE.Color('#2a2c2f');
  const on = new THREE.Color('#fffaf0').multiplyScalar(1.6);
  for (const z of rows)
    for (const x of LAMP_X) {
      const b = brightness(x, z);
      mesh.setColorAt(i++, COL.copy(off).lerp(on, b));
    }
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return <primitive object={mesh} />;
};

const FLOOR: Mat = {color: '#8f8a80', rough: 0.55, env: 0.6};
const AISLE: Mat = {color: '#aaa499', rough: 0.5, env: 0.6};
const CEILING: Mat = {color: '#3f4245', rough: 0.95};
const BEAM: Mat = {color: '#56595d', rough: 0.7};
const PAINT: Mat = {color: '#f2efe8', rough: 0.6};

// the floor arrows of the one-way path through the store, painted on the main aisle
const Arrows: React.FC<{z0: number; z1: number; dir?: 1 | -1}> = ({z0, z1, dir = -1}) => {
  const items: V3[] = [];
  for (let z = z0; z > z1; z -= 12) items.push([0, 0, z]);
  return (
    <>
      {items.map((p, i) => (
        <group key={i} position={[0, 0.0105, p[2]]} rotation={[0, dir < 0 ? 0 : Math.PI, 0]}>
          <Box size={[0.22, 0.006, 1.1]} position={[0, 0, 0.3]} m={PAINT} shadow={false} />
          <Box size={[0.75, 0.006, 0.22]} position={[0, 0, -0.32]} rotation={[0, Math.PI / 4, 0]} m={PAINT} shadow={false} />
          <Box size={[0.75, 0.006, 0.22]} position={[0, 0, -0.32]} rotation={[0, -Math.PI / 4, 0]} m={PAINT} shadow={false} />
        </group>
      ))}
    </>
  );
};

export const Shell: React.FC<{zFrom: number; zTo: number}> = ({zFrom, zTo}) => {
  const len = zTo - zFrom;
  const zc = (zFrom + zTo) / 2;
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zc]} receiveShadow>
        <planeGeometry args={[110, len]} />
        <Material m={FLOOR} />
      </mesh>
      {/* the main aisle: a lighter, smoother strip of floor */}
      <Box size={[4, 0.006, len]} position={[0, 0.004, zc]} m={AISLE} shadow={false} />
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEIL, zc]}>
        <planeGeometry args={[110, len]} />
        <Material m={CEILING} />
      </mesh>
    </>
  );
};

const Beams: React.FC<{zFrom: number; zTo: number}> = ({zFrom, zTo}) => {
  const boxes = useMemo(() => {
    const out: B[] = [];
    for (let z = Math.ceil(zFrom / 8) * 8; z < zTo; z += 8) out.push({p: [0, CEIL - 0.25, z], s: [100, 0.4, 0.22], c: BEAM.color});
    for (let x = -40; x <= 40; x += 8) out.push({p: [x + 2, CEIL - 0.12, (zFrom + zTo) / 2], s: [0.4, 0.22, zTo - zFrom], c: '#4d5054'});
    return out;
  }, [zFrom, zTo]);
  return <Static boxes={boxes} shadow={false} />;
};

const GLASS: Mat = {color: '#d6e6ee', metal: 0.1, rough: 0.05, opacity: 0.18, env: 1.4, glass: true};
const FRAME: Mat = {color: '#5d6266', metal: 0.5, rough: 0.4};
const FRONT: Mat = {color: '#cfcac0', rough: 0.9};

// The glass front with sliding doors and the bright day outside. open: 0..1
export const Entrance: React.FC<{open: number}> = ({open}) => (
  <group position={[0, 0, ENTRANCE_Z]}>
    {/* solid front either side of the glass, up to the ceiling */}
    <Box size={[50, CEIL, 0.3]} position={[-28, CEIL / 2, 0.15]} m={FRONT} />
    <Box size={[50, CEIL, 0.3]} position={[28, CEIL / 2, 0.15]} m={FRONT} />
    <Box size={[6, CEIL - 3.2, 0.3]} position={[0, 3.2 + (CEIL - 3.2) / 2, 0.15]} m={FRONT} />
    {/* glass wall with the door opening in the middle */}
    <Box size={[0.08, 3.2, 0.12]} position={[-2.96, 1.6, 0.15]} m={FRAME} />
    <Box size={[0.08, 3.2, 0.12]} position={[2.96, 1.6, 0.15]} m={FRAME} />
    <Box size={[6, 0.1, 0.14]} position={[0, 3.12, 0.15]} m={FRAME} />
    {[-1, 1].map((s) => (
      <group key={s} position={[s * (0.75 + 1.45 * open), 0, 0.06]}>
        <Box size={[1.5, 3.0, 0.03]} position={[0, 1.55, 0]} m={GLASS} />
        <Box size={[1.5, 0.08, 0.06]} position={[0, 0.06, 0]} m={FRAME} />
        <Box size={[0.06, 3.0, 0.06]} position={[-s * 0.72, 1.55, 0]} m={FRAME} />
      </group>
    ))}
    {[-1, 1].map((s) => (
      <Box key={s} size={[1.5, 3.0, 0.03]} position={[s * 2.2, 1.55, 0.22]} m={GLASS} />
    ))}
    {/* outside: a bright overcast day */}
    <mesh position={[0, 3, 6]}>
      <planeGeometry args={[30, 12]} />
      <meshBasicMaterial color={[2.2, 2.15, 2.05]} toneMapped={false} />
    </mesh>
    <Box size={[30, 0.02, 6]} position={[0, -0.005, 3.2]} m={{color: '#cfcfca', rough: 0.9}} shadow={false} />
  </group>
);

// What Ben sees when he turns round: a living room standing where the doors were, and the store going on behind it.
export const NewRoom: React.FC = () => {
  const boxes = useMemo(() => {
    const out: B[] = [];
    // a room facing -z, built with the room() helper on its side and turned with a swap of axes
    const tmp: B[] = [];
    room('living', 1, 0, tmp, {wall: '#cdbba6'});
    for (const b of tmp) {
      // room() puts the back wall at x = 10; map local (x - 6) -> z and z -> -x: the room fills z 27..35 where the doors were
      const xp = b.p[0] - 6;
      out.push({p: [-b.p[2], b.p[1], ENTRANCE_Z + 3 + xp], s: [b.s[2], b.s[1], b.s[0]], c: b.c});
    }
    return out;
  }, []);
  return <Static boxes={boxes} />;
};

export const Store: React.FC<{lamps: (x: number, z: number) => number; beyond?: boolean; entrance?: number | null}> = ({lamps, beyond = false, entrance = null}) => (
  <>
    <Shell zFrom={Z_MIN} zTo={beyond ? Z_BEYOND : ENTRANCE_Z + 0.3} />
    {STORE.map((b, i) => (
      <Static key={i} boxes={b} />
    ))}
    <Beams zFrom={Z_MIN} zTo={beyond ? Z_BEYOND : ENTRANCE_Z} />
    <Lamps rows={LAMP_ROWS} brightness={lamps} />
    <Arrows z0={14} z1={Z_MIN} />
    {beyond ? (
      <>
        {BEYOND.map((b, i) => (
          <Static key={i} boxes={b} />
        ))}
        <Lamps rows={LAMP_ROWS_BEYOND} brightness={lamps} />
        <NewRoom />
      </>
    ) : null}
    {entrance !== null ? <Entrance open={entrance} /> : null}
  </>
);
