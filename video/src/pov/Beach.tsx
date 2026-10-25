import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {random} from 'remotion';
import {Box, Ico} from '../scene/parts';
import {Extra, Hero, Shovel} from './cast';
import {Crowd, CrowdMember, outfit} from './Crowd';
import {Ground, Sky, Sun} from './env';
import {PalmTree} from './props';
import {ShotState, V3, ramp, smooth, wordStart} from './cues';

// A beach: a red sports car buried in the sand (only the spoiler sticks out), a pile of shovels,
// a thousand people. First they queue for shovels, then everybody digs at once.
export const HERO_BEACH: V3 = [2.9, 0, 3.3];
export const PILE: V3 = [4.3, 0, 2.2];

const SAND = '#ecd28f';

// n points from gen(), none closer than minD to another (so nobody stands inside anybody)
const spread = (n: number, minD: number, seed: string, gen: (r: () => number) => V3): V3[] => {
  const out: V3[] = [];
  let k = 0;
  while (out.length < n && k < n * 40) {
    let c = 0;
    const p = gen(() => random(`${seed}-${k}-${c++}`));
    k++;
    if (out.every((q) => (q[0] - p[0]) ** 2 + (q[2] - p[2]) ** 2 >= minD * minD)) out.push(p);
  }
  return out;
};

const BuriedCar: React.FC = () => (
  <group>
    <Ico radius={2.2} detail={1} position={[0, -0.05, 0]} scale={[1, 0.18, 0.75]} color="#e3c47c" />
    <Box size={[1.9, 0.4, 0.9]} position={[0, 0.22, 0]} color="#d8202b" />
    <Box size={[0.1, 0.12, 0.3]} position={[0.96, 0.3, 0.25]} color="#ff6a3d" emissive="#ff4020" emissiveIntensity={0.3} shadow={false} />
    <Box size={[0.1, 0.12, 0.3]} position={[0.96, 0.3, -0.25]} color="#ff6a3d" emissive="#ff4020" emissiveIntensity={0.3} shadow={false} />
    <Box size={[0.08, 0.4, 0.08]} position={[0.75, 0.6, 0.4]} color="#1d1e22" />
    <Box size={[0.08, 0.4, 0.08]} position={[0.75, 0.6, -0.4]} color="#1d1e22" />
    <Box size={[0.42, 0.06, 2.0]} position={[0.8, 0.82, 0]} rotation={[0, 0, -0.12]} color="#d8202b" />
  </group>
);

// a pile of shovels: instanced handles and blades at random angles
const ShovelPile: React.FC<{count: number}> = ({count}) => {
  const handles = useRef<THREE.InstancedMesh>(null);
  const blades = useRef<THREE.InstancedMesh>(null);
  const geoH = useMemo(() => new THREE.BoxGeometry(0.04, 1.1, 0.04), []);
  const geoB = useMemo(() => new THREE.BoxGeometry(0.24, 0.3, 0.03), []);
  const matH = useMemo(() => new THREE.MeshStandardMaterial({color: '#9b6b3e', flatShading: true, roughness: 0.9}), []);
  const matB = useMemo(() => new THREE.MeshStandardMaterial({color: '#9aa2ad', flatShading: true, roughness: 0.6, metalness: 0.2}), []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const h = random(`pile-h-${i}`);
      const r = (1 - h) * 1.3 * Math.sqrt(random(`pile-r-${i}`));
      const a = random(`pile-a-${i}`) * Math.PI * 2;
      o.position.set(Math.sin(a) * r, 0.1 + h * 1.0, Math.cos(a) * r);
      o.rotation.set((random(`pile-x-${i}`) - 0.5) * 2.6, random(`pile-y-${i}`) * 6.3, Math.PI / 2 + (random(`pile-z-${i}`) - 0.5) * 1.2);
      o.updateMatrix();
      handles.current!.setMatrixAt(i, o.matrix);
      m.makeTranslation(0, -0.65, 0);
      blades.current!.setMatrixAt(i, o.matrix.clone().multiply(m));
    }
    handles.current!.instanceMatrix.needsUpdate = true;
    blades.current!.instanceMatrix.needsUpdate = true;
  }, [count]);
  return (
    <>
      <instancedMesh ref={handles} args={[geoH, matH, count]} castShadow receiveShadow />
      <instancedMesh ref={blades} args={[geoB, matB, count]} castShadow receiveShadow />
    </>
  );
};

// sand thrown up by the diggers
const SandSpray: React.FC<{v: number; diggers: CrowdMember[]; on: boolean}> = ({v, diggers, on}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const n = 420;
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.09, 0), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({color: '#e2c27a', flatShading: true, roughness: 1}), []);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      const d = diggers[(i * 7) % diggers.length];
      const ph = (v * 1.4 + random(`sp-p-${i}`)) % 1;
      // out from the hole, over the digger's shoulder
      const out = new THREE.Vector3(d.p[0], 0, d.p[2]).normalize();
      const sideA = (random(`sp-s-${i}`) - 0.5) * 0.9;
      const dir = out.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), sideA);
      const dist = ph * (1.6 + random(`sp-d-${i}`) * 1.6);
      const y = 0.6 + ph * 3.2 - ph * ph * 3.8;
      o.position.set(d.p[0] + dir.x * dist, Math.max(0.05, y), d.p[2] + dir.z * dist);
      o.rotation.set(ph * 5, i, ph * 3);
      const sc = on && y > 0.05 ? 0.6 + random(`sp-k-${i}`) * 0.9 : 0;
      o.scale.set(sc, sc, sc);
      o.updateMatrix();
      ref.current!.setMatrixAt(i, o.matrix);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, n]} frustumCulled={false} />;
};

export const Beach: React.FC<{v: number; s: ShotState}> = ({v, s}) => {
  const digging = s.name === 'digging';
  // the waiting crowd behind the queue, and the ring of diggers around the car
  const crowd: CrowdMember[] = useMemo(
    () =>
      spread(900, 0.7, 'bc', (r) => [-16 + r() * 32, 0, 9 + Math.pow(r(), 0.8) * 26]).map((p, i) => ({
        p,
        yaw: Math.PI + (random(`bc-yaw-${i}`) - 0.5) * 0.8,
        ...outfit(i, 'beach'),
      })),
    [],
  );
  const diggers: CrowdMember[] = useMemo(
    () =>
      spread(700, 0.8, 'dg', (r) => {
        const a = r() * Math.PI * 2;
        const d = 2.6 + Math.sqrt(r()) * 16;
        return [Math.sin(a) * d, 0, Math.cos(a) * d];
      }).map((p, i) => ({p, yaw: Math.atan2(-p[0], -p[2]) + (random(`dg-y-${i}`) - 0.5) * 0.6, ...outfit(i, 'dig')})),
    [],
  );
  const queue = useMemo(() => Array.from({length: 14}, (_, i) => ({p: [2.0 - i * 0.1, 0, 4.5 + i * 0.75] as V3, ...outfit(i, 'queue')})), []);
  const hand = smooth(ramp(v, wordStart(96) - 0.1, wordStart(96) + 0.35));
  const digPose = (i: number) => {
    const ph = v * 3.2 + random(`dg-ph-${i}`) * 6.28;
    const sw = Math.sin(ph);
    return {bend: 0.45 + 0.25 * sw, arm: 0.9 + 0.5 * sw, armL: 1.1 + 0.4 * sw};
  };
  const standPose = (i: number) => ({bend: 0.02 * Math.sin(v * 1.5 + i), arm: 0.05 + (i % 9 === 0 ? 2.6 : 0) + 0.15 * Math.sin(v * 5 + i)});
  return (
    <group>
      <Sky top="#5ec3ea" horizon="#e6f8fc" />
      <hemisphereLight color="#fffbea" groundColor="#c9a86a" intensity={0.95} />
      <ambientLight intensity={0.12} />
      <Sun position={[8, 18, 12]} target={[0, 0, 4]} intensity={2.7} size={30} color="#fff6e0" />
      <Ground color={SAND} />
      {/* sea and foam to the north */}
      <Box size={[600, 0.1, 300]} position={[0, -0.03, -185]} color="#2bb3c0" shadow={false} />
      <Box size={[600, 0.1, 6]} position={[0, -0.01, -33]} color="#5fd0d8" shadow={false} />
      {[0, 1, 2].map((k) => {
        const ph = (v * 0.25 + k / 3) % 1;
        return <Box key={k} size={[600, 0.04, 0.6]} position={[0, 0.09, -30.5 - ph * 4]} color="#f4fbfb" opacity={1 - ph} shadow={false} />;
      })}
      {[[-14, 0, -18, 0.2, 0.3], [-19, 0, -10, -0.15, 1.4], [16, 0, -16, 0.18, 2.2], [22, 0, -6, -0.2, 0.9], [-24, 0, 6, 0.12, 2.9]].map(([x, y, z, l, sd], k) => (
        <PalmTree key={k} position={[x, y, z]} lean={l} seed={sd} />
      ))}
      <BuriedCar />
      {!digging ? (
        <group position={PILE}>
          <ShovelPile count={90} />
        </group>
      ) : null}
      {digging ? (
        <>
          <Crowd members={diggers} pose={digPose} shovels />
          <SandSpray v={v} diggers={diggers} on />
        </>
      ) : (
        <>
          <Crowd members={crowd} pose={standPose} shadows={false} />
          {queue.map((q, i) => (
            <Extra
              key={i}
              position={q.p}
              rotation={2.5}
              shirt={q.shirt}
              pants={q.pants}
              skin={q.skin}
              hair={q.hair}
              pose={{armR: i === 0 ? [0.25 + 0.95 * hand, -0.1] : [0.05, -0.06], elbowR: i === 0 ? 0.3 : 0, head: [0.05, 0]}}
              rightHand={i === 0 && hand > 0.6 ? <Shovel tilt={0.25 + 0.95 * hand} /> : null}
            />
          ))}
          <Hero
            position={HERO_BEACH}
            rotation={-0.64}
            pose={{armR: [0.3 + 1.0 * hand, -0.15], elbowR: 0.3, armL: [0.1, 0.06], head: [0.05, -0.25], mouth: 0.3}}
            rightHand={hand <= 0.6 ? <Shovel tilt={0.3 + 1.0 * hand} /> : null}
          />
        </>
      )}
    </group>
  );
};
