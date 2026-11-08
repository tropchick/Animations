import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useCanvas} from '../gta/tex';
import {Ball, Block, Cone, Cyl, G, Glow, Pill, RBox, Ring, mat, usePicMat} from './kit';
import {drawWrapper} from './tex';
import {V3, rnd} from './cues';

// Props: phones, the honey bar, ring light, parcel, ink pad, money sack, tables, chairs, tents, the den.

export const Pic: React.FC<{
  size: [number, number];
  res: [number, number];
  k: string;
  draw: (g: CanvasRenderingContext2D, W: number, H: number) => void;
  position?: V3;
  rotation?: V3;
  lit?: boolean;
  glow?: number;
  transparent?: boolean;
  shadow?: boolean;
}> = ({size, res, k, draw, position, rotation, lit = true, glow = 1, transparent, shadow}) => {
  const tex = useCanvas(res[0], res[1], k, (g) => draw(g, res[0], res[1]));
  const m = usePicMat(tex, lit, glow, transparent);
  return (
    <mesh position={position} rotation={rotation} material={m} castShadow={shadow} receiveShadow={shadow}>
      <planeGeometry args={size} />
    </mesh>
  );
};

// a phone; the screen (a Pic or anything) is passed as children, placed on the front (+z)
export const Phone: React.FC<{position?: V3; rotation?: V3; scale?: number; color?: string; children?: React.ReactNode}> = ({position, rotation, scale = 1, color = '#1c1d24', children}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <RBox size={[0.075, 0.155, 0.009]} r={0.009} color={color} look={{rough: 0.3, metal: 0.4}} />
    <group position={[0, 0, 0.0058]}>{children}</group>
    {/* camera bump on the back */}
    <RBox position={[-0.018, 0.055, -0.006]} size={[0.026, 0.03, 0.004]} r={0.006} color="#2a2b33" look={{rough: 0.3}} />
  </group>
);

export const PhoneScreen: React.FC<{draw: (g: CanvasRenderingContext2D, W: number, H: number) => void; k: string; res?: [number, number]; glow?: number}> = ({draw, k, res = [540, 1140], glow = 1.05}) => (
  <Pic size={[0.069, 0.148]} res={res} k={k} draw={draw} lit={false} glow={glow} />
);

// a selfie stick held in a fist: it carries on past the fist (along the forearm), a phone clamped at the tip
export const SelfieStick: React.FC<{len?: number; children?: React.ReactNode; tilt?: number}> = ({len = 0.75, children, tilt = 0}) => (
  <group rotation={[Math.PI + tilt, 0, 0]}>
    <Cyl position={[0, len / 2, 0]} rt={0.008} rb={0.012} h={len} color="#26272e" look={{rough: 0.3, metal: 0.6}} />
    <Cyl position={[0, 0.02, 0]} rt={0.016} rb={0.016} h={0.1} color="#111" />
    <group position={[0, len, 0]}>
      {children ?? (
        <group position={[0, 0.07, 0]} rotation={[0, Math.PI, 0]}>
          <RBox size={[0.03, 0.03, 0.03]} r={0.008} color="#26272e" />
          <Phone position={[0, 0.02, 0.02]} scale={0.95} />
        </group>
      )}
    </group>
  </group>
);

// the honey protein bar: a wrapped bar with the «МЁД» label on both faces
export const HoneyBar: React.FC<{position?: V3; rotation?: V3; scale?: number; open?: number; bitten?: number}> = ({position, rotation, scale = 1, open = 0, bitten = 0}) => {
  const tex = useCanvas(512, 160, 'wrapper', (g) => drawWrapper(g, 512, 160));
  const m = usePicMat(tex, true, 1.3);
  const len = 0.15 * (1 - bitten * 0.35);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {open < 0.5 ? (
        <>
          <RBox size={[0.15, 0.045, 0.02]} r={0.008} color="#f3a520" look={{rough: 0.4}} />
          <mesh position={[0, 0, 0.0115]} material={m}>
            <planeGeometry args={[0.135, 0.04]} />
          </mesh>
          <mesh position={[0, 0, -0.0115]} rotation={[0, Math.PI, 0]} material={m}>
            <planeGeometry args={[0.135, 0.04]} />
          </mesh>
          {/* crimped ends */}
          {([1, -1] as const).map((s) => (
            <RBox key={s} position={[0.08 * s, 0, 0]} size={[0.014, 0.05, 0.006]} r={0.002} color="#e8921a" />
          ))}
        </>
      ) : (
        <>
          {/* the bar itself, honey-oat colour, with the wrapper peeled back; a bite takes the open (−x) end */}
          <RBox position={[(0.15 - len) / 2, 0, 0]} size={[len, 0.04, 0.018]} r={0.008} color="#c98a3e" look={{rough: 0.9}} />
          {[0, 1, 2, 3]
            .filter((k) => -0.05 + k * 0.03 > 0.075 - len + 0.008)
            .map((k) => (
              <Ball key={k} position={[-0.05 + k * 0.03, 0.018, 0.004 * (k % 2)]} scale={[0.008, 0.005, 0.008]} color="#e8c070" shadow={false} />
            ))}
          <group position={[0.04, 0, 0]}>
            <RBox position={[0.03, 0, 0]} size={[0.07, 0.047, 0.022]} r={0.008} color="#f3a520" look={{rough: 0.4}} />
            {/* the torn wrapper peels back in two flaps, front and back, like a banana skin */}
            {([1, -1] as const).map((s) => (
              <group key={s} position={[-0.005, 0, 0.0125 * s]} rotation={[0, s * (0.35 + 0.65 * open), 0]}>
                <RBox position={[-0.019, 0, 0]} size={[0.038, 0.043, 0.003]} r={0.0012} color="#f6b52a" look={{rough: 0.4}} />
              </group>
            ))}
          </group>
        </>
      )}
    </group>
  );
};

// the wrapper on its own (falling leaf-like, big and readable)
export const Wrapper: React.FC<{position?: V3; rotation?: V3; scale?: number}> = ({position, rotation, scale = 1}) => {
  const tex = useCanvas(512, 160, 'wrapper', (g) => drawWrapper(g, 512, 160));
  const m = useMemo(() => new THREE.MeshStandardMaterial({map: tex, roughness: 0.35, metalness: 0.15, side: THREE.DoubleSide, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.25}), [tex]);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.15, 0.047, 12, 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 40) * 0.004 + Math.abs(p.getX(i)) * 0.06);
    g.computeVertexNormals();
    return g;
  }, []);
  return <mesh position={position} rotation={rotation} scale={scale} geometry={geo} material={m} castShadow />;
};

export const HoneyJar: React.FC<{position?: V3; rotation?: V3; scale?: number; glow?: number}> = ({position, rotation, scale = 1, glow = 0}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <Cyl position={[0, 0.06, 0]} rt={0.055} rb={0.06} h={0.12} seg={24} color="#f0a020" look={{rough: 0.15, emissive: '#ff9a10', emissiveK: 0.25 + glow}} />
    <Cyl position={[0, 0.13, 0]} rt={0.05} rb={0.05} h={0.03} seg={24} color="#d84a2a" look={{rough: 0.6}} />
    <Cyl position={[0, 0.06, 0]} rt={0.0605} rb={0.0655} h={0.05} seg={24} color="#fff4d6" look={{rough: 0.8}} />
    {glow > 0 ? <Glow position={[0, 0.08, 0.02]} size={0.6 * glow} color="#ffc040" k={glow} /> : null}
  </group>
);

export const Parcel: React.FC<{position?: V3; rotation?: V3; open?: number}> = ({position, rotation, open = 0}) => (
  <group position={position} rotation={rotation}>
    <RBox position={[0, 0.15, 0]} size={[0.45, 0.3, 0.35]} r={0.015} color="#c8955a" look={{rough: 0.95}} />
    <Block position={[0, 0.301, 0]} size={[0.46, 0.004, 0.06]} color="#d8b47a" shadow={false} />
    {/* flaps fold open */}
    {([1, -1] as const).map((s) => (
      <group key={s} position={[0.225 * s, 0.3, 0]} rotation={[0, 0, -s * open * 2.2]}>
        <RBox position={[-0.11 * s, 0.006, 0]} size={[0.22, 0.012, 0.34]} r={0.004} color="#c08c50" look={{rough: 0.95}} />
      </group>
    ))}
  </group>
);

export const RingLight: React.FC<{position: V3; rotation?: number; on?: number; phone?: React.ReactNode}> = ({position, rotation = 0, on = 1, phone}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    {[0, 1, 2].map((k) => (
      <Cyl key={k} position={[Math.sin((k / 3) * Math.PI * 2) * 0.18, 0.55, Math.cos((k / 3) * Math.PI * 2) * 0.18]} rotation={[Math.cos((k / 3) * Math.PI * 2) * 0.3, 0, -Math.sin((k / 3) * Math.PI * 2) * 0.3]} rt={0.012} rb={0.012} h={1.15} seg={8} color="#22232a" />
    ))}
    <Cyl position={[0, 1.2, 0]} rt={0.015} rb={0.015} h={0.35} seg={8} color="#22232a" />
    <group position={[0, 1.45, 0]}>
      <Ring r={0.2} tube={0.028} color="#fdfbf2" look={{emissive: '#fff6e0', emissiveK: 1.2 * on, rough: 0.4}} shadow={false} />
      <Glow position={[0, 0, 0.05]} size={1.0} color="#fff3d8" k={0.55 * on} />
      <group position={[0, 0, 0.01]}>{phone}</group>
    </group>
  </group>
);

export const Table: React.FC<{position?: V3; rotation?: number; size?: [number, number]; h?: number; top?: string; cloth?: string}> = ({position, rotation = 0, size = [1.6, 0.9], h = 0.76, top = '#8a5a34', cloth}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <RBox position={[0, h - 0.025, 0]} size={[size[0], 0.05, size[1]]} r={0.015} color={top} look={{rough: 0.6}} />
    {cloth ? <RBox position={[0, h + 0.004, 0]} size={[size[0] * 0.9, 0.004, size[1] * 0.8]} r={0.0015} color={cloth} look={{rough: 0.95}} /> : null}
    {[-1, 1].map((sx) =>
      [-1, 1].map((sz) => <Cyl key={`${sx}${sz}`} position={[(size[0] / 2 - 0.08) * sx, (h - 0.05) / 2, (size[1] / 2 - 0.08) * sz]} rt={0.03} rb={0.025} h={h - 0.05} seg={10} color={top} />),
    )}
  </group>
);

export const Chair: React.FC<{position?: V3; rotation?: number; color?: string; office?: boolean}> = ({position, rotation = 0, color = '#7a5232', office}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <RBox position={[0, 0.45, 0]} size={[0.44, 0.06, 0.42]} r={0.02} color={color} />
    <RBox position={[0, 0.75, -0.19]} size={[0.42, 0.5, 0.05]} r={0.02} color={color} />
    {office ? (
      <>
        <Cyl position={[0, 0.25, 0]} rt={0.025} rb={0.025} h={0.4} seg={10} color="#2a2a30" look={{metal: 0.6, rough: 0.3}} />
        {[0, 1, 2, 3, 4].map((k) => (
          <RBox key={k} position={[Math.sin(k * 1.256) * 0.17, 0.05, Math.cos(k * 1.256) * 0.17]} rotation={[0, k * 1.256, 0]} size={[0.04, 0.03, 0.34]} r={0.01} color="#2a2a30" />
        ))}
      </>
    ) : (
      [-1, 1].map((sx) => [-1, 1].map((sz) => <Cyl key={`${sx}${sz}`} position={[0.18 * sx, 0.22, 0.17 * sz]} rt={0.022} rb={0.02} h={0.44} seg={8} color={color} />))
    )}
  </group>
);

export const Plate: React.FC<{position?: V3; food?: number; col?: string}> = ({position, food = 0, col = '#c8742a'}) => (
  <group position={position}>
    <Cyl position={[0, 0.008, 0]} rt={0.13} rb={0.09} h={0.016} seg={28} color="#fbf8f2" look={{rough: 0.3}} />
    {food > 0 ? <mesh position={[0, 0.014, 0]} scale={[0.085 * Math.min(1.4, 0.6 + food * 0.4), 0.025 * Math.min(2.5, food), 0.085 * Math.min(1.4, 0.6 + food * 0.4)]} geometry={G.hemi(20)} material={mat(col, {rough: 0.7})} castShadow /> : null}
  </group>
);

export const Pot: React.FC<{position?: V3}> = ({position}) => (
  <group position={position}>
    <Cyl position={[0, 0.1, 0]} rt={0.16} rb={0.14} h={0.2} seg={28} color="#c23a2a" look={{rough: 0.35}} />
    <Cyl position={[0, 0.2045, 0]} rt={0.145} rb={0.145} h={0.01} seg={28} color="#a8441c" />
    {([1, -1] as const).map((s) => (
      <Ring key={s} position={[0.175 * s, 0.15, 0]} rotation={[0, Math.PI / 2, 0]} r={0.03} tube={0.008} color="#2a2020" />
    ))}
  </group>
);

export const Ladle: React.FC<{full?: number}> = ({full = 0}) => (
  <group>
    <Cyl position={[0, 0.16, 0]} rotation={[0.2, 0, 0]} rt={0.008} rb={0.008} h={0.32} seg={8} color="#c8c8cc" look={{metal: 0.8, rough: 0.3}} />
    <mesh position={[0, 0.0, 0.03]} rotation={[Math.PI, 0, 0]} scale={0.05} geometry={G.hemi(18)} material={mat('#c8c8cc', {metal: 0.8, rough: 0.3, side: THREE.DoubleSide})} castShadow />
    {full > 0 ? <Ball position={[0, -0.005, 0.03]} scale={[0.044, 0.012, 0.044]} color="#a8441c" shadow={false} /> : null}
  </group>
);

export const InkPad: React.FC<{position?: V3}> = ({position}) => (
  <group position={position}>
    <RBox position={[0, 0.015, 0]} size={[0.2, 0.03, 0.14]} r={0.01} color="#2a2a30" />
    <RBox position={[0, 0.0315, 0]} size={[0.17, 0.004, 0.11]} r={0.002} color="#2a1a4a" look={{rough: 0.4}} />
  </group>
);

export const MoneySack: React.FC<{position?: V3; squash?: number}> = ({position, squash = 0}) => (
  <group position={position} scale={[1 + squash * 0.15, 1 - squash * 0.2, 1 + squash * 0.15]}>
    <Ball position={[0, 0.17, 0]} scale={[0.22, 0.2, 0.2]} color="#c8a874" look={{rough: 0.95, rim: '#fff0d0', rimK: 0.25}} />
    <Ball position={[0, 0.37, 0]} scale={[0.08, 0.07, 0.08]} color="#c8a874" look={{rough: 0.95}} />
    <Ring position={[0, 0.33, 0]} rotation={[Math.PI / 2, 0, 0]} r={0.075} tube={0.012} color="#8a5a2a" />
    <group position={[0, 0.17, 0.19]}>
      <Pill rotation={[0, 0, 0]} r={0.012} len={0.12} color="#2f7a3a" shadow={false} />
      <mesh position={[0, 0.0, 0.004]} rotation={[0, 0, 0]} geometry={G.torus(0.04, 0.012, Math.PI, 12)} material={mat('#2f7a3a')} />
    </group>
  </group>
);

export const Coin: React.FC<{position?: V3; rotation?: V3}> = ({position, rotation}) => (
  <Cyl position={position} rotation={rotation} rt={0.025} rb={0.025} h={0.006} seg={16} color="#f2c23a" look={{metal: 0.9, rough: 0.25}} />
);

export const Mic: React.FC<{position?: V3; rotation?: V3}> = ({position, rotation}) => (
  <group position={position} rotation={rotation}>
    <Cyl position={[0, -0.25, -0.15]} rotation={[-0.6, 0, 0]} rt={0.012} rb={0.012} h={0.55} seg={8} color="#1a1a20" look={{metal: 0.6, rough: 0.3}} />
    <Pill rotation={[Math.PI / 2 - 0.3, 0, 0]} r={0.045} len={0.11} color="#2a2b33" look={{rough: 0.35, metal: 0.4}} />
    <Ring position={[0, 0, 0]} rotation={[Math.PI / 2 - 0.3, 0, 0]} r={0.05} tube={0.008} color="#5a5c66" look={{metal: 0.8, rough: 0.25}} />
  </group>
);

// tents for the camp: instanced cones with a round base, many colours
export const Tents: React.FC<{n?: number; seed?: number; area: [number, number, number, number]; avoid?: (x: number, z: number) => boolean; night?: number}> = ({n = 200, seed = 3, area, avoid, night = 0}) => {
  const meshes = useMemo(() => {
    const cols = ['#e8462e', '#f2b33d', '#3a8ad8', '#6ac46a', '#e85d9a', '#9a6ad8', '#f07a2a', '#2ab0a8'];
    const tent = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 4), new THREE.MeshStandardMaterial({roughness: 0.8}), n);
    const door = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({color: '#2a1a14'}), n);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    let k = 0;
    for (let i = 0; i < n * 4 && k < n; i++) {
      const x = area[0] + rnd(seed + i * 1.37) * (area[1] - area[0]);
      const z = area[2] + rnd(seed * 3 + i * 2.11) * (area[3] - area[2]);
      if (avoid && avoid(x, z)) continue;
      const s = 0.9 + rnd(i * 3.3) * 0.5;
      const yaw = rnd(i * 5.5) * 6.28;
      o.position.set(x, 0.55 * s, z);
      o.rotation.set(0, yaw, 0);
      o.scale.set(1.0 * s, 1.1 * s, 1.0 * s);
      o.updateMatrix();
      tent.setMatrixAt(k, o.matrix);
      tent.setColorAt(k, col.set(cols[Math.floor(rnd(i * 7.1) * cols.length)]));
      // dark door triangle on one face
      o.position.set(x + Math.sin(yaw + Math.PI / 4) * 0.36 * s, 0.3 * s, z + Math.cos(yaw + Math.PI / 4) * 0.36 * s);
      o.rotation.set(0.47, yaw + Math.PI / 4, 0);
      o.scale.set(0.35 * s, 0.5 * s, 1);
      o.updateMatrix();
      door.setMatrixAt(k, o.matrix);
      k++;
    }
    tent.count = k;
    door.count = k;
    tent.castShadow = true;
    tent.receiveShadow = true;
    return [tent, door];
  }, [n, seed, area[0], area[1], area[2], area[3]]);
  (meshes[0].material as THREE.MeshStandardMaterial).emissive.set(night > 0 ? '#ff9a40' : '#000000');
  (meshes[0].material as THREE.MeshStandardMaterial).emissiveIntensity = night * 0.35;
  return (
    <>
      <primitive object={meshes[0]} />
      <primitive object={meshes[1]} />
    </>
  );
};

// a string of glowing bulbs between points (sagging)
export const Garland: React.FC<{pts: V3[]; on?: number; n?: number; cols?: string[]}> = ({pts, on = 1, n = 9, cols = ['#ffd27a', '#ff9a5a', '#fff0c0']}) => (
  <>
    {pts.slice(0, -1).map((a, s) => {
      const b = pts[s + 1];
      return Array.from({length: n}, (_, i) => {
        const t = (i + 0.5) / n;
        const p: V3 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * 0.18, a[2] + (b[2] - a[2]) * t];
        const k = Math.max(0, Math.min(1, on * 3 - (i / n) * 2));
        return (
          <group key={`${s}-${i}`}>
            <Ball position={p} scale={0.035} color={cols[i % cols.length]} look={{emissive: cols[i % cols.length], emissiveK: 0.2 + 1.6 * k}} shadow={false} />
            <Glow position={p} size={0.35} color={cols[i % cols.length]} k={0.75 * k} />
          </group>
        );
      });
    })}
  </>
);

export const Sawdust: React.FC<{v: number; at: number[]; pos: V3}> = ({v, at, pos}) => (
  <>
    {at.flatMap((t0, j) =>
      v > t0 && v < t0 + 0.7
        ? Array.from({length: 7}, (_, i) => {
            const t = v - t0;
            const a = rnd(j * 13 + i) * Math.PI * 2;
            const sp = 0.6 + rnd(j * 7 + i) * 0.9;
            return (
              <Ball
                key={`${j}-${i}`}
                position={[pos[0] + Math.cos(a) * sp * t, pos[1] + 1.2 * t - 3 * t * t, pos[2] + Math.sin(a) * sp * t]}
                scale={0.012 + rnd(i) * 0.01}
                color="#e8c890"
                shadow={false}
              />
            );
          })
        : [],
    )}
  </>
);

export {Cone};
