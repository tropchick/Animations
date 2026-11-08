import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box, Cyl, Ico} from '../scene/parts';
import {Person, PersonPose} from '../scene/Characters';
import {useCanvas} from '../gta/tex';
import {V3, rnd} from './cues';

// ---------- the pink floral robe: a tiling canvas texture ----------

const drawRobe = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#e8669c';
  g.fillRect(0, 0, W, H);
  // soft vertical folds
  for (let k = 0; k < 8; k++) {
    const x = (k / 8) * W;
    const gr = g.createLinearGradient(x, 0, x + W / 8, 0);
    gr.addColorStop(0, 'rgba(120,20,60,0.0)');
    gr.addColorStop(0.5, 'rgba(120,20,60,0.16)');
    gr.addColorStop(1, 'rgba(120,20,60,0.0)');
    g.fillStyle = gr;
    g.fillRect(x, 0, W / 8, H);
  }
  // flowers: five white petals and a yellow middle, on a 4x4 staggered grid
  const flower = (cx: number, cy: number, r: number, petal: string) => {
    g.fillStyle = petal;
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      g.beginPath();
      g.ellipse(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.42, r * 0.3, a, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#ffd23f';
    g.beginPath();
    g.arc(cx, cy, r * 0.24, 0, Math.PI * 2);
    g.fill();
  };
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const cx = ((i + (j % 2) * 0.5) / 4) * W;
      const cy = (j / 4) * H + H / 8;
      const big = (i + j) % 2 === 0;
      // draw wrapped copies so the tile is seamless
      for (const dx of [-W, 0, W]) flower(cx + dx, cy, big ? W * 0.07 : W * 0.05, big ? '#fff3f8' : '#ffc2dc');
    }
  }
};

export const useRobe = (repeat: [number, number]) => {
  const tex = useCanvas(512, 512, 'robe', (g) => drawRobe(g, 512, 512));
  return useMemo(() => {
    const t = tex.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
    t.needsUpdate = true;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex, tex.version, repeat[0], repeat[1]]);
};

// a long hanging robe hem: an upright cylinder, open at the top, with a white trim band at the bottom edge
export const RobeHem: React.FC<{position: V3; r: number; h: number; repeat?: [number, number]; seg?: number}> = ({position, r, h, repeat = [6, 3], seg = 40}) => {
  const map = useRobe(repeat);
  return (
    <group position={position}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[r, r * 1.08, h, seg, 1, false]} />
        <meshStandardMaterial map={map} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, r * 0.03, 0]}>
        <cylinderGeometry args={[r * 1.092, r * 1.095, r * 0.06, seg, 1, true]} />
        <meshStandardMaterial color="#fff0f6" roughness={1} side={THREE.DoubleSide} flatShading />
      </mesh>
    </group>
  );
};

// a planet-sized ball of robe (the moon shot)
export const RobeBall: React.FC<{position: V3; r: number; repeat?: [number, number]; rot?: number}> = ({position, r, repeat = [8, 4], rot = 0}) => {
  const map = useRobe(repeat);
  return (
    <mesh position={position} rotation={[0.3, rot, 0.1]}>
      <sphereGeometry args={[r, 48, 32]} />
      <meshStandardMaterial map={map} roughness={0.95} />
    </mesh>
  );
};

// ---------- the fluffy pink slipper (1 unit long, toe towards +z, sole on y = 0) ----------

export const Slipper: React.FC<{position?: V3; rotation?: V3; scale?: number; quaternion?: THREE.Quaternion}> = ({position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, quaternion}) => (
  <group position={position} rotation={quaternion ? undefined : rotation} quaternion={quaternion} scale={scale}>
    {/* oval sole and the soft inner footbed on top of it */}
    <mesh position={[0, 0.035, 0]} scale={[0.42, 1, 1]}>
      <cylinderGeometry args={[0.5, 0.5, 0.07, 22]} />
      <meshStandardMaterial color="#b8406f" roughness={1} flatShading />
    </mesh>
    <mesh position={[0, 0.08, -0.01]} scale={[0.36, 1, 0.9]}>
      <cylinderGeometry args={[0.5, 0.5, 0.02, 22]} />
      <meshStandardMaterial color="#ffb3d1" roughness={1} flatShading />
    </mesh>
    {/* the toe cover: half a cylinder lying across the foot, dome up */}
    <mesh position={[0, 0.07, 0.2]} rotation={[0, 0, Math.PI / 2]} scale={[0.85, 1, 1]}>
      <cylinderGeometry args={[0.235, 0.235, 0.4, 14, 1, false, 0, Math.PI]} />
      <meshStandardMaterial color="#f06aa0" roughness={1} flatShading side={THREE.DoubleSide} />
    </mesh>
    {/* fluffy trim along the opening and the pompom */}
    {Array.from({length: 7}).map((_, i) => {
      const a = Math.PI * (i / 6);
      return <Ico key={i} radius={0.055} position={[Math.cos(a) * 0.205, 0.07 + Math.sin(a) * 0.2, 0.0]} color="#ffd6e8" />;
    })}
    <Ico radius={0.11} position={[0, 0.28, 0.22]} color="#ffd6e8" />
    <Ico radius={0.07} position={[0.07, 0.31, 0.27]} color="#ffe6f1" />
    <Ico radius={0.07} position={[-0.07, 0.3, 0.17]} color="#ffc4dc" />
  </group>
);

// ---------- the bathroom scale (34 cm square), dial facing +z ----------

export const BathScale: React.FC<{position?: V3; rotation?: V3; needle?: number; squash?: number; broken?: boolean}> = ({position = [0, 0, 0], rotation = [0, 0, 0], needle = 0, squash = 1, broken}) => (
  <group position={position} rotation={rotation} scale={[1, squash, 1]}>
    <Box size={[0.34, 0.045, 0.34]} position={[0, 0.0225, 0]} color="#f2f3f5" />
    <Box size={[0.3, 0.006, 0.22]} position={[0, 0.048, -0.04]} color={broken ? '#9aa4ad' : '#dbe5ee'} shadow={false} />
    {/* the dial window */}
    <Cyl rTop={0.055} rBottom={0.055} height={0.006} position={[0, 0.0505, 0.11]} color="#ffffff" segments={16} shadow={false} />
    <group position={[0, 0.0555, 0.11]} rotation={[0, -needle, 0]}>
      <Box size={[0.004, 0.003, 0.05]} position={[0, 0, -0.02]} color="#e02424" shadow={false} />
    </group>
    {broken ? <Box size={[0.2, 0.004, 0.006]} position={[0.02, 0.0515, -0.02]} rotation={[0, 0.6, 0]} color="#3a3f45" shadow={false} /> : null}
  </group>
);

// a little coil spring (a stack of rings)
export const Spring: React.FC<{position: V3; rotation?: V3; s?: number}> = ({position, rotation = [0, 0, 0], s = 1}) => (
  <group position={position} rotation={rotation} scale={s}>
    {Array.from({length: 6}).map((_, i) => (
      <mesh key={i} position={[0, i * 0.012, 0]} rotation={[Math.PI / 2 + 0.15, 0, 0]}>
        <torusGeometry args={[0.018, 0.0035, 5, 10]} />
        <meshStandardMaterial color="#b9c0c8" metalness={0.6} roughness={0.35} flatShading />
      </mesh>
    ))}
  </group>
);

// ---------- people ----------

export const Scientist: React.FC<{position: V3; rotation?: number; pose?: PersonPose; rightHand?: React.ReactNode; hair?: string}> = ({position, rotation = 0, pose, rightHand, hair = '#5a4030'}) => (
  <Person
    position={position}
    rotation={rotation}
    shirt="#f3f4f6"
    pants="#39404f"
    hair={hair}
    pose={pose}
    rightHand={rightHand}
    bodyExtra={<Box size={[0.08, 0.1, 0.02]} position={[0.12, 1.32, 0.157]} color="#3a7bd5" shadow={false} />}
  />
);

// ---------- road things ----------

export const Lorry: React.FC<{position: V3; rotation?: number}> = ({position, rotation = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    {/* cab at +x */}
    <Box size={[2.2, 2.6, 2.5]} position={[5.3, 1.9, 0]} color="#d23a2a" />
    <Box size={[0.05, 1.0, 2.1]} position={[6.43, 2.5, 0]} color="#1c2530" shadow={false} />
    <Box size={[0.3, 0.3, 2.4]} position={[6.5, 0.85, 0]} color="#3a3a3a" />
    {/* the trailer box */}
    <Box size={[9.6, 3.2, 2.5]} position={[-0.9, 2.5, 0]} color="#e9ecef" />
    <Box size={[9.62, 0.4, 2.52]} position={[-0.9, 1.0, 0]} color="#5a5f66" />
    {[-4.4, -3.2, 1.6, 5.3].map((x) =>
      [-1.05, 1.05].map((z) => <Cyl key={`${x}${z}`} rTop={0.5} rBottom={0.5} height={0.38} position={[x, 0.5, z]} rotation={[Math.PI / 2, 0, 0]} color="#1e1e22" segments={12} />),
    )}
  </group>
);

// ---------- space ----------

// a little spiral galaxy made of coloured points (in its own XZ plane)
export const Galaxy: React.FC<{position: V3; size: number; seed: number; tilt?: V3}> = ({position, size, seed, tilt = [0.9, 0, 0.3]}) => {
  const geo = useMemo(() => {
    const n = 700;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const arm = i % 2;
      const r = Math.pow(rnd(seed * 1000 + i * 3 + 1), 0.7);
      const a = r * 5.5 + arm * Math.PI + (rnd(seed * 1000 + i * 3 + 2) - 0.5) * 0.7;
      pos[i * 3] = Math.cos(a) * r * size;
      pos[i * 3 + 1] = (rnd(seed * 1000 + i * 3 + 3) - 0.5) * size * 0.06;
      pos[i * 3 + 2] = Math.sin(a) * r * size;
      c.set(r < 0.25 ? '#fff1c8' : rnd(seed + i) > 0.5 ? '#9fc4ff' : '#e4c6ff');
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [seed, size]);
  return (
    <points geometry={geo} position={position} rotation={tilt}>
      <pointsMaterial vertexColors size={4} sizeAttenuation={false} transparent opacity={1} depthWrite={false} />
    </points>
  );
};

// a dotted ring (orbits)
export const DottedRing: React.FC<{center: V3; r: number; opacity?: number; color?: string; n?: number}> = ({center, r, opacity = 1, color = '#ffffff', n = 90}) => {
  const geo = useMemo(() => {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pos.set([Math.cos(a) * r, 0, Math.sin(a) * r], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [r, n]);
  return (
    <points geometry={geo} position={center}>
      <pointsMaterial color={color} size={5} sizeAttenuation={false} transparent opacity={opacity} depthWrite={false} />
    </points>
  );
};

// ---------- the black-hole photo that turns out to be a donut ----------

export const BlackHoleRing: React.FC<{k: number}> = ({k}) => (
  <group>
    {[
      [0.62, '#ff7a1a', 0.18],
      [0.46, '#ff9a30', 0.28],
      [0.32, '#ffb347', 0.4],
      [0.2, '#ffd27a', 0.5],
    ].map(([tube, col, op], i) => (
      <mesh key={i} renderOrder={2 + i}>
        <torusGeometry args={[1, tube as number, 16, 64]} />
        <meshBasicMaterial color={col as string} transparent opacity={(op as number) * k} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    ))}
    {/* the dark middle */}
    <mesh position={[0, 0, -0.05]}>
      <circleGeometry args={[0.72, 40]} />
      <meshBasicMaterial color="#000000" transparent opacity={k} depthWrite={false} />
    </mesh>
  </group>
);

const SPRINKLE = ['#ffffff', '#ffd23f', '#5ad1ff', '#7dff9a', '#ff4d6d', '#b388ff'];

export const Donut: React.FC<{k: number}> = ({k}) => {
  const sprinkles = useMemo(
    () =>
      Array.from({length: 70}).map((_, i) => {
        const a = rnd(i * 4 + 1) * Math.PI * 2;
        const b = (rnd(i * 4 + 2) - 0.5) * 2.2;
        const R = 1 + 0.44 * Math.cos(b);
        return {p: [Math.cos(a) * R, Math.sin(a) * R, 0.1 + 0.44 * 0.7 * Math.cos(b * 0.6) + 0.02] as V3, rot: [0, 0, rnd(i * 4 + 3) * Math.PI] as V3, c: SPRINKLE[i % SPRINKLE.length]};
      }),
    [],
  );
  if (k <= 0.001) return null;
  return (
    <group>
      <mesh>
        <torusGeometry args={[1, 0.42, 14, 40]} />
        <meshStandardMaterial color="#d6955a" roughness={0.9} transparent opacity={k} flatShading />
      </mesh>
      {/* icing on the front half */}
      <mesh position={[0, 0, 0.1]} scale={[1, 1, 0.7]}>
        <torusGeometry args={[1, 0.445, 14, 40]} />
        <meshStandardMaterial color="#ff7eb6" roughness={0.5} transparent opacity={k} flatShading />
      </mesh>
      {sprinkles.map((s, i) => (
        <Box key={i} size={[0.1, 0.025, 0.025]} position={s.p} rotation={s.rot} color={s.c} shadow={false} opacity={k} />
      ))}
    </group>
  );
};

export {Box, Cyl, Ico};
