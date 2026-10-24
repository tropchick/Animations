import React, {useMemo} from 'react';
import * as THREE from 'three';
import {random} from 'remotion';
import {Box, Cone, Cyl, Ico} from '../scene/parts';
import {V3} from './time';

const G = 9.8;

// ---------- Layout of the square (meters) ----------
// Plaza x -16..16, z -9..22. Main street along x at z -16 (z -22..-10).
// Side street along z at x 22 (x 16..28). Camera mostly looks north (-z).

export const STREET_Z = -16;
export const SIDE_X = 22;
export const FOUNTAIN: V3 = [0, 0, 4];
export const FOUNTAIN_R = 3.2;

// ---------- Ground ----------

const Dashes: React.FC<{z: number}> = ({z}) => (
  <>
    {Array.from({length: 26}).map((_, i) => (
      <Box key={i} size={[2.2, 0.02, 0.18]} position={[-90 + i * 7, 0.012, z]} color="#f2efe6" shadow={false} />
    ))}
  </>
);

export const Ground: React.FC = () => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[3000, 3000]} />
      <meshStandardMaterial color="#9a9890" roughness={1} />
    </mesh>
    {/* plaza paving with a lighter ring around the fountain */}
    <Box size={[34, 0.12, 31]} position={[0, 0.06, 6.5]} color="#e6dfd2" />
    <Cyl rTop={8} rBottom={8} height={0.13} segments={24} position={[FOUNTAIN[0], 0.065, FOUNTAIN[2]]} color="#d9cfbf" />
    {Array.from({length: 7}).map((_, i) => (
      <Box key={i} size={[34, 0.005, 0.08]} position={[0, 0.123, -6 + i * 4.5]} color="#cfc6b6" shadow={false} />
    ))}
    {/* main street, sidewalk on the far side */}
    <Box size={[400, 0.02, 12]} position={[0, 0.01, STREET_Z]} color="#5d5f63" />
    <Dashes z={STREET_Z} />
    <Box size={[400, 0.16, 2.2]} position={[0, 0.08, -23.1]} color="#cfcac0" />
    <Box size={[400, 0.16, 0.3]} position={[0, 0.08, -9.85]} color="#bdb8ae" />
    {/* side street */}
    <Box size={[12, 0.02, 222]} position={[SIDE_X, 0.011, 89]} color="#5d5f63" />
    {Array.from({length: 7}).map((_, i) => (
      <Box key={i} size={[0.6, 0.025, 4.6]} position={[-6 + i * 1.1, 0.015, STREET_Z]} color="#f4f2ec" shadow={false} />
    ))}
    {Array.from({length: 7}).map((_, i) => (
      <Box key={i} size={[4.6, 0.025, 0.6]} position={[SIDE_X, 0.016, -6 + i * 1.1]} color="#f4f2ec" shadow={false} />
    ))}
  </>
);

// ---------- Buildings ----------

type Facade = 'south' | 'east' | 'west' | 'north';

export type BuildingSpec = {
  id: string;
  x: number;
  z: number;
  w: number; // along the facade
  d: number;
  h: number;
  color: string;
  facade: Facade;
  glass?: boolean;
  awning?: string;
};

const instancedBoxes = (items: {p: V3; s: V3; c: string}[]) => {
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({flatShading: true, roughness: 0.6}),
    items.length,
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const c = new THREE.Color();
  items.forEach((it, i) => {
    m.compose(new THREE.Vector3(...it.p), q, new THREE.Vector3(...it.s));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, c.set(it.c));
  });
  mesh.frustumCulled = false;
  mesh.receiveShadow = true;
  return mesh;
};

// Rotation that turns a facade built facing +z into the wanted direction.
const facadeYaw = (f: Facade) => ({south: 0, east: Math.PI / 2, west: -Math.PI / 2, north: Math.PI})[f];

export const Building: React.FC<{b: BuildingSpec}> = ({b}) => {
  const windows = useMemo(() => {
    const items: {p: V3; s: V3; c: string}[] = [];
    const floors = Math.floor((b.h - 4.5) / 3.3);
    if (b.glass) {
      for (let f = 0; f <= floors; f++) {
        items.push({p: [0, 4.5 + f * 3.3, b.d / 2 + 0.03], s: [b.w + 0.06, 0.12, 0.06], c: '#e8eef2'});
      }
      return items;
    }
    const cols = Math.max(2, Math.floor((b.w - 1.2) / 2.6));
    const step = (b.w - 1.6) / cols;
    for (let f = 0; f < floors; f++) {
      for (let k = 0; k < cols; k++) {
        const lit = random(`win-${b.id}-${f}-${k}`) > 0.85;
        items.push({
          p: [-b.w / 2 + 0.8 + step * (k + 0.5), 5.6 + f * 3.3, b.d / 2 + 0.03],
          s: [step * 0.62, 1.6, 0.08],
          c: lit ? '#53687c' : '#2e3a47',
        });
      }
    }
    return items;
  }, [b]);
  const mesh = useMemo(() => instancedBoxes(windows), [windows]);
  return (
    <group position={[b.x, 0, b.z]} rotation={[0, facadeYaw(b.facade), 0]}>
      <Box size={[b.w, b.h, b.d]} position={[0, b.h / 2, 0]} color={b.color} />
      {b.glass ? (
        <Box size={[b.w + 0.02, b.h - 4, b.d + 0.02]} position={[0, 2 + b.h / 2, 0]} color="#86aecb" emissive="#3b6f99" emissiveIntensity={0.35} />
      ) : null}
      <primitive object={mesh} />
      {/* roof ledge and rooftop boxes */}
      <Box size={[b.w + 0.4, 0.4, b.d + 0.4]} position={[0, b.h + 0.2, 0]} color="#cfc8bc" />
      <Box size={[2.4, 1.6, 2]} position={[-b.w * 0.2, b.h + 1.2, -b.d * 0.15]} color="#b9bec4" />
      <Cyl rTop={0.9} rBottom={0.9} height={2} segments={8} position={[b.w * 0.25, b.h + 1.4, b.d * 0.1]} color="#a98c6c" />
      {/* ground floor band */}
      <Box size={[b.w + 0.1, 0.5, 0.3]} position={[0, 4.2, b.d / 2 + 0.1]} color="#f2efe8" />
      {b.awning ? <Box size={[b.w - 2, 0.12, 1.4]} position={[0, 3.6, b.d / 2 + 0.7]} rotation={[0.2, 0, 0]} color={b.awning} /> : null}
    </group>
  );
};

// Shop windows on a south facade that blow out into the street when something hits them.
export const ShopFront: React.FC<{x: number; zFront: number; width: number; burstW: number; w: number; id: string}> = ({
  x,
  zFront,
  width,
  burstW,
  w,
  id,
}) => {
  const panes = Math.floor(width / 2.4);
  const step = width / panes;
  const items = [];
  for (let k = 0; k < panes; k++) {
    const px = x - width / 2 + step * (k + 0.5);
    const broken = w >= burstW + k * 0.03;
    items.push(<Box key={`f${k}`} size={[0.12, 3.0, 0.14]} position={[px - step / 2, 1.6, zFront + 0.05]} color="#3b3f45" />);
    items.push(<Box key={`d${k}`} size={[step - 0.15, 2.9, 0.02]} position={[px, 1.6, zFront + 0.01]} color="#1c2229" shadow={false} />);
    if (!broken) {
      items.push(<Box key={`g${k}`} size={[step - 0.15, 2.9, 0.04]} position={[px, 1.6, zFront + 0.06]} color="#8fb0c4" opacity={0.75} shadow={false} />);
    } else {
      const t = w - (burstW + k * 0.03);
      for (let i = 0; i < 6; i++) {
        const sx = px + (random(`${id}-sx-${k}-${i}`) - 0.5) * step * 0.8;
        const sy = 0.4 + random(`${id}-sy-${k}-${i}`) * 2.6;
        const vOut = 3 + random(`${id}-vo-${k}-${i}`) * 5;
        const vSide = (random(`${id}-vs-${k}-${i}`) - 0.5) * 4;
        const vUp = random(`${id}-vu-${k}-${i}`) * 3;
        const tLand = (vUp + Math.sqrt(vUp * vUp + 2 * G * sy)) / G;
        const tt = Math.min(t, tLand);
        const size = 0.18 + random(`${id}-sz-${k}-${i}`) * 0.25;
        items.push(
          <Cyl
            key={`s${k}-${i}`}
            rTop={size}
            rBottom={size}
            height={0.02}
            segments={3}
            position={[sx + vSide * tt, Math.max(0.03, sy + vUp * tt - 0.5 * G * tt * tt), zFront + 0.1 + vOut * tt]}
            rotation={t >= tLand ? [0, i, 0] : [tt * 9 + i, tt * 6, i]}
            color="#a9c3d3"
            opacity={0.9}
            shadow={false}
          />,
        );
      }
    }
  }
  return <>{items}</>;
};

// Far city seen from the sky: blocks of towers on a street grid.
export const CityBlocks: React.FC = () => {
  const mesh = useMemo(() => {
    const items: {p: V3; s: V3; c: string}[] = [];
    const cols = ['#e3dccf', '#d5cfc5', '#c9d2d9', '#e8e2d6', '#bfa48a', '#9fb7c9', '#d9cdb9'];
    for (let bx = -9; bx <= 9; bx++) {
      for (let bz = -9; bz <= 9; bz++) {
        const cx = bx * 46 + 3;
        const cz = bz * 46 - 16 - 23;
        for (let k = 0; k < 4; k++) {
          const ox = (k % 2 ? 1 : -1) * 9.5;
          const oz = (k < 2 ? 1 : -1) * 9.5;
          const x = cx + ox;
          const z = cz + oz;
          if (Math.abs(x) < 52 && z > -60 && z < 50) continue;
          const key = `${bx}-${bz}-${k}`;
          const dist = Math.hypot(x, z);
          const h = 8 + random(`cb-h-${key}`) * (dist < 250 ? 46 : 22) + (random(`cb-t-${key}`) > 0.93 ? 40 : 0);
          const s = 13 + random(`cb-s-${key}`) * 4;
          items.push({p: [x, h / 2, z], s: [s, h, s], c: cols[Math.floor(random(`cb-c-${key}`) * cols.length)]});
        }
        if (random(`park-${bx}-${bz}`) > 0.9) {
          items.push({p: [cx, 0.1, cz], s: [36, 0.2, 36], c: '#6fa94b'});
        }
      }
    }
    return instancedBoxes(items);
  }, []);
  return <primitive object={mesh} />;
};

// ---------- Street furniture ----------

export const LampPost: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <Cyl rTop={0.09} rBottom={0.12} height={5} segments={8} position={[0, 2.5, 0]} color="#2f3540" />
    <Cyl rTop={0.22} rBottom={0.22} height={0.3} segments={8} position={[0, 0.15, 0]} color="#2f3540" />
    <Box size={[0.9, 0.08, 0.08]} position={[0.35, 4.95, 0]} color="#2f3540" />
    <Cone radius={0.3} height={0.35} segments={6} position={[0.75, 4.78, 0]} color="#2f3540" />
    <Ico radius={0.13} position={[0.75, 4.6, 0]} color="#fff3cf" emissive="#ffe3a0" emissiveIntensity={0.4} shadow={false} />
  </group>
);

export const TrafficLight: React.FC<{position: V3; rot?: number; v: number}> = ({position, rot = 0, v}) => {
  const phase = Math.floor(v / 4) % 2;
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <Cyl rTop={0.1} rBottom={0.12} height={4.6} segments={8} position={[0, 2.3, 0]} color="#34383f" />
      <Box size={[0.4, 1.15, 0.3]} position={[0, 3.6, 0.2]} color="#25282d" />
      <Ico radius={0.11} position={[0, 3.95, 0.37]} color={phase ? '#ff5a4a' : '#5a2a26'} emissive={phase ? '#ff3a2a' : undefined} shadow={false} />
      <Ico radius={0.11} position={[0, 3.6, 0.37]} color="#5a4a26" shadow={false} />
      <Ico radius={0.11} position={[0, 3.25, 0.37]} color={phase ? '#24452c' : '#5cff8a'} emissive={phase ? undefined : '#2aff6a'} shadow={false} />
    </group>
  );
};

// Bus shelter; the roof caves in when the taxi lands on it.
export const BusStop: React.FC<{position: V3; crush: number}> = ({position, crush}) => (
  <group position={position}>
    {[-2, 2].map((x) => (
      <Cyl key={x} rTop={0.06} rBottom={0.06} height={2.6 - 1.4 * crush} segments={6} position={[x, (2.6 - 1.4 * crush) / 2, -0.6]} color="#3a3f47" rotation={[0, 0, crush * 0.4 * Math.sign(x)]} />
    ))}
    <group position={[0, 2.65 - 1.6 * crush, 0]} rotation={[crush * 0.35, 0, crush * 0.2]}>
      <Box size={[4.6, 0.12, 1.8]} color="#3a3f47" />
    </group>
    {crush < 0.5 ? <Box size={[4.2, 2.1, 0.04]} position={[0, 1.25, -0.65]} color="#9fc1d4" opacity={0.6} shadow={false} /> : null}
    <Box size={[1.2, 1.9, 0.1]} position={[2.25, 1.15, 0]} color="#e9563c" />
    <Box size={[3, 0.08, 0.45]} position={[0, 0.5, -0.35]} color="#c9ccd0" />
  </group>
);

export const Bench: React.FC<{position: V3; rot?: number}> = ({position, rot = 0}) => (
  <group position={position} rotation={[0, rot, 0]}>
    <Box size={[2.0, 0.08, 0.5]} position={[0, 0.48, 0]} color="#a8754a" />
    <Box size={[2.0, 0.45, 0.07]} position={[0, 0.78, -0.24]} color="#a8754a" />
    {[-0.85, 0.85].map((x) => (
      <Box key={x} size={[0.08, 0.5, 0.45]} position={[x, 0.25, 0]} color="#2f3540" />
    ))}
  </group>
);

export const Fountain: React.FC<{waterLevel: number; spray: number; broken: boolean; v: number}> = ({waterLevel, spray, broken, v}) => (
  <group position={FOUNTAIN}>
    <Cyl rTop={FOUNTAIN_R} rBottom={FOUNTAIN_R + 0.1} height={0.7} segments={20} position={[0, 0.35, 0]} color="#cfc6b6" />
    <Cyl rTop={FOUNTAIN_R - 0.35} rBottom={FOUNTAIN_R - 0.35} height={0.72} segments={20} position={[0, 0.37, 0]} color="#7d8f99" />
    {waterLevel > 0.01 ? (
      <Cyl rTop={FOUNTAIN_R - 0.36} rBottom={FOUNTAIN_R - 0.36} height={0.02} segments={20} position={[0, 0.1 + 0.6 * waterLevel, 0]} color="#6cc6dc" emissive="#1f6b80" emissiveIntensity={0.3} shadow={false} />
    ) : null}
    {broken ? (
      <Cyl rTop={0.42} rBottom={0.5} height={0.5} segments={8} position={[0, 0.25, 0]} color="#d8d0c2" />
    ) : (
      <>
        <Cyl rTop={0.35} rBottom={0.5} height={1.6} segments={8} position={[0, 0.8, 0]} color="#d8d0c2" />
        <Cyl rTop={1.0} rBottom={0.6} height={0.25} segments={10} position={[0, 1.65, 0]} color="#d8d0c2" />
      </>
    )}
    {spray > 0.01
      ? Array.from({length: 10}).map((_, i) => {
          const cyc = (v * 0.9 + i / 10) % 1;
          const a = (i / 10) * Math.PI * 2;
          const r = 0.4 + cyc * 1.4;
          return (
            <Ico key={i} radius={0.09} position={[Math.cos(a) * r, 2.3 + 1.2 * Math.sin(Math.PI * cyc) - cyc * 1.6, Math.sin(a) * r]} color="#bfe8f4" opacity={0.8 * spray} shadow={false} />
          );
        })
      : null}
    {spray > 0.01 ? <Cone radius={0.2} height={1.0} segments={6} position={[0, 2.3, 0]} color="#bfe8f4" opacity={0.7 * spray} shadow={false} /> : null}
  </group>
);

// ---------- Things that fly ----------

export const Bus: React.FC<{crush?: number}> = ({crush = 0}) => (
  <group scale={[1 - 0.08 * crush, 1 - 0.3 * crush, 1 + 0.1 * crush]}>
    <Box size={[12, 2.7, 2.55]} position={[0, 1.75, 0]} color="#e2463a" />
    <Box size={[11.2, 0.9, 2.58]} position={[-0.2, 2.25, 0]} color="#2b3947" shadow={false} />
    <Box size={[0.06, 1.3, 2.2]} position={[6.01, 2.0, 0]} color="#2b3947" shadow={false} />
    <Box size={[12.05, 0.25, 2.6]} position={[0, 1.05, 0]} color="#f2efe8" shadow={false} />
    {[-4, 3.6].map((x) =>
      [-1.15, 1.15].map((z) => (
        <Cyl key={`${x}${z}`} rTop={0.5} rBottom={0.5} height={0.35} segments={10} position={[x, 0.5, z]} rotation={[Math.PI / 2, 0, 0]} color="#22242a" />
      )),
    )}
    <Box size={[1.6, 0.4, 0.06]} position={[4.8, 3.25, 1.29]} color="#1d2a1f" shadow={false} />
  </group>
);

export const TreeInPlanter: React.FC<{uproot?: number; sway?: number}> = ({uproot = 0, sway = 0}) => (
  <group>
    {/* root ball shows once the tree is pulled out */}
    {uproot > 0 ? <Ico radius={0.8} detail={0} position={[0, -0.2, 0]} scale={[1, 0.6, 1]} color="#6b4a32" /> : null}
    <Cyl rTop={0.14} rBottom={0.2} height={2.6} segments={6} position={[0, 1.3, 0]} color="#7a5a3c" />
    <group position={[0, 2.4, 0]} rotation={[sway, 0, sway * 0.6]}>
      <Ico radius={1.4} detail={1} position={[0, 1.2, 0]} color="#5c9a4a" />
      <Ico radius={1.0} detail={1} position={[0.8, 0.7, 0.3]} color="#6aa955" />
      <Ico radius={0.9} detail={1} position={[-0.7, 0.8, -0.3]} color="#4f8a41" />
    </group>
  </group>
);

export const Planter: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <Box size={[2, 0.6, 2]} position={[0, 0.3, 0]} color="#b8afa2" />
    <Box size={[1.7, 0.05, 1.7]} position={[0, 0.6, 0]} color="#5b4330" shadow={false} />
  </group>
);

export const HotDogCart: React.FC = () => (
  <group>
    <Box size={[1.8, 0.9, 0.9]} position={[0, 0.85, 0]} color="#f2efe8" />
    <Box size={[1.82, 0.25, 0.92]} position={[0, 0.55, 0]} color="#d8473a" />
    {[-0.6, 0.6].map((x) => (
      <Cyl key={x} rTop={0.25} rBottom={0.25} height={0.1} segments={10} position={[x, 0.25, 0.46]} rotation={[Math.PI / 2, 0, 0]} color="#2a2c30" />
    ))}
    <Cyl rTop={0.03} rBottom={0.03} height={1.4} segments={5} position={[0, 2.0, 0]} color="#d0d0d0" />
    <Cone radius={1.3} height={0.5} segments={8} position={[0, 2.8, 0]} color="#f2c84b" />
  </group>
);

export const CafeTable: React.FC<{umbrella?: string}> = ({umbrella}) => (
  <group>
    <Cyl rTop={0.4} rBottom={0.4} height={0.04} segments={10} position={[0, 0.74, 0]} color="#ffffff" />
    <Cyl rTop={0.03} rBottom={0.06} height={0.74} segments={6} position={[0, 0.37, 0]} color="#3a3f47" />
    {umbrella ? (
      <>
        <Cyl rTop={0.025} rBottom={0.025} height={1.6} segments={5} position={[0, 1.5, 0]} color="#d0d0d0" />
        <Cone radius={1.2} height={0.45} segments={8} position={[0, 2.35, 0]} color={umbrella} />
      </>
    ) : null}
  </group>
);

export const Chair: React.FC<{color?: string}> = ({color = '#3fa6b4'}) => (
  <group>
    <Box size={[0.45, 0.05, 0.45]} position={[0, 0.45, 0]} color={color} />
    <Box size={[0.45, 0.45, 0.05]} position={[0, 0.7, -0.2]} color={color} />
    {[-0.18, 0.18].map((x) => [-0.18, 0.18].map((z) => <Box key={`${x}${z}`} size={[0.04, 0.45, 0.04]} position={[x, 0.22, z]} color="#3a3f47" />))}
  </group>
);

export const Bin: React.FC = () => (
  <group>
    <Cyl rTop={0.3} rBottom={0.26} height={0.9} segments={8} position={[0, 0.45, 0]} color="#3f6b4f" />
    <Cyl rTop={0.32} rBottom={0.32} height={0.08} segments={8} position={[0, 0.92, 0]} color="#2f4f3a" />
  </group>
);

export const Pigeon: React.FC<{flap: number}> = ({flap}) => (
  <group scale={1.4}>
    <Ico radius={0.09} position={[0, 0.12, 0]} scale={[0.8, 0.8, 1.3]} color="#8a8f99" shadow={false} />
    <Ico radius={0.05} position={[0, 0.2, 0.1]} color="#6c7280" shadow={false} />
    <group position={[0.05, 0.14, 0]} rotation={[0, 0, flap]}>
      <Box size={[0.18, 0.015, 0.09]} position={[0.09, 0, 0]} color="#7b808a" shadow={false} />
    </group>
    <group position={[-0.05, 0.14, 0]} rotation={[0, 0, -flap]}>
      <Box size={[0.18, 0.015, 0.09]} position={[-0.09, 0, 0]} color="#7b808a" shadow={false} />
    </group>
  </group>
);

