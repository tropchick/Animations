import React, {useMemo} from 'react';
import * as THREE from 'three';
import {G} from '../bear/kit';
import {V3, rnd} from '../bear/cues';

// Many of the dead at once (instanced, cheap): body, legs, head, hair, arms reaching a little forward.
// Keep them behind the hero characters (they look crude closer than ~4 m).

const TOPS = ['#6a6f78', '#7a5a52', '#4f5a66', '#7d7a62', '#5f6a5a', '#8a6a6a', '#55606e', '#7a7d84', '#4f7a5a'];
const SKIN = ['#a7b39a', '#9faa94', '#b2b8a4', '#98a48e'];
const HAIR = ['#3a332c', '#5a5048', '#2a2622', '#7a6a58'];

export type Dead = {p: V3; yaw: number; i: number; walk?: {from: V3; to: V3; t0: number; t1: number}; s?: number};

// where one of them is at time v (walking from → to between t0 and t1, else standing)
export const deadPos = (d: Dead, v: number): {p: V3; yaw: number; moving: boolean} => {
  if (!d.walk) return {p: d.p, yaw: d.yaw, moving: false};
  const {from, to, t0, t1} = d.walk;
  const k = Math.max(0, Math.min(1, (v - t0) / (t1 - t0)));
  const p: V3 = [from[0] + (to[0] - from[0]) * k, 0, from[2] + (to[2] - from[2]) * k];
  const moving = v > t0 && v < t1;
  const yaw = k < 1 ? Math.atan2(to[0] - from[0], to[2] - from[2]) : d.yaw;
  return {p, yaw, moving};
};

export const DeadCrowd: React.FC<{dead: Dead[]; v: number; y?: number}> = ({dead, v, y = 0}) => {
  const n = dead.length;
  const meshes = useMemo(() => {
    const body = new THREE.InstancedMesh(G.capsule(0.17, 0.32, 10), new THREE.MeshStandardMaterial({roughness: 0.9}), n);
    const legs = new THREE.InstancedMesh(G.capsule(0.075, 0.5, 8), new THREE.MeshStandardMaterial({roughness: 0.9, color: '#33363e'}), n * 2);
    const head = new THREE.InstancedMesh(G.sphere(16), new THREE.MeshStandardMaterial({roughness: 0.75}), n);
    const hair = new THREE.InstancedMesh(G.sphere(14), new THREE.MeshStandardMaterial({roughness: 0.85}), n);
    const arm = new THREE.InstancedMesh(G.capsule(0.055, 0.38, 8), new THREE.MeshStandardMaterial({roughness: 0.9}), n * 2);
    const eye = new THREE.InstancedMesh(G.sphere(8), new THREE.MeshBasicMaterial({color: '#d8dcd0', toneMapped: false}), n * 2);
    const col = new THREE.Color();
    dead.forEach((f, k) => {
      const top = TOPS[(f.i * 5) % TOPS.length];
      body.setColorAt(k, col.set(top));
      arm.setColorAt(k * 2, col.set(top));
      arm.setColorAt(k * 2 + 1, col.set(top));
      head.setColorAt(k, col.set(SKIN[f.i % SKIN.length]));
      hair.setColorAt(k, col.set(HAIR[(f.i * 3) % HAIR.length]));
    });
    for (const m of [body, legs, head, hair, arm]) {
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
    }
    eye.frustumCulled = false;
    return {body, legs, head, hair, arm, eye};
  }, [n]);
  const o = useMemo(() => new THREE.Object3D(), []);
  const q = useMemo(() => new THREE.Object3D(), []);
  dead.forEach((f, k) => {
    const {p, yaw, moving} = deadPos(f, v);
    const ph = f.i * 1.7;
    const sc = f.s ?? 0.95 + (f.i % 5) * 0.02;
    const step = moving ? Math.sin(v * 4.2 + ph) : 0;
    const sway = Math.sin(v * 0.9 + ph) * 0.04 + step * 0.05;
    q.position.set(p[0], y + p[1] + Math.abs(step) * 0.02, p[2]);
    q.rotation.set(0.12, yaw, sway);
    q.scale.set(sc, sc, sc);
    q.updateMatrixWorld();
    const put = (mesh: THREE.InstancedMesh, idx: number, x: number, yy: number, z: number, rx = 0, rz = 0, s: V3 = [1, 1, 1]) => {
      o.position.set(x, yy, z);
      o.rotation.set(rx, 0, rz);
      o.scale.set(...s);
      o.updateMatrix();
      o.matrix.premultiply(q.matrixWorld);
      mesh.setMatrixAt(idx, o.matrix);
    };
    put(meshes.body, k, 0, 0.98, 0);
    put(meshes.legs, k * 2, 0.08, 0.38, step * 0.08, step * 0.35);
    put(meshes.legs, k * 2 + 1, -0.08, 0.38, -step * 0.08, -step * 0.35);
    const tilt = 0.25 * Math.sin(ph * 1.3);
    put(meshes.head, k, 0.02 * tilt, 1.47, 0.04, 0, tilt, [0.16, 0.16, 0.16]);
    put(meshes.hair, k, 0.02 * tilt, 1.51, 0.0, 0, tilt, [0.168, 0.15, 0.165]);
    put(meshes.arm, k * 2, 0.22, 1.18, 0.12, -0.9 + Math.sin(v * 1.1 + ph) * 0.1, 0.1);
    put(meshes.arm, k * 2 + 1, -0.22, 1.12, 0.06, -0.5 + Math.sin(v * 1.3 + ph) * 0.1, -0.1);
    put(meshes.eye, k * 2, 0.055 + 0.02 * tilt, 1.49, 0.185, 0, 0, [0.025, 0.025, 0.012]);
    put(meshes.eye, k * 2 + 1, -0.055 + 0.02 * tilt, 1.49 - 0.012 * tilt * 4, 0.185, 0, 0, [0.025, 0.025, 0.012]);
  });
  for (const m of Object.values(meshes)) m.instanceMatrix.needsUpdate = true;
  return (
    <>
      {Object.values(meshes).map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </>
  );
};

// a blob of them around a centre, facing a point
export const blob = (center: V3, r: number, n: number, seed = 1, face?: V3, minR = 0): Dead[] =>
  Array.from({length: n}, (_, i) => {
    const a = rnd(seed + i * 1.37) * Math.PI * 2;
    const d = minR + Math.sqrt(rnd(seed * 2 + i * 1.91)) * (r - minR);
    const x = center[0] + Math.cos(a) * d;
    const z = center[2] + Math.sin(a) * d;
    const yaw = face ? Math.atan2(face[0] - x, face[2] - z) + (rnd(i) - 0.5) * 0.5 : rnd(i * 3.3) * 6.28;
    return {p: [x, 0, z] as V3, yaw, i: i + seed};
  });

// a semicircle of them facing a point (standing at the door), rows r0, r0 + gap, ...
export const arc = (center: V3, r0: number, rows: number, perRow: number, span: number, baseYaw: number, seed = 1): Dead[] => {
  const out: Dead[] = [];
  for (let r = 0; r < rows; r++)
    for (let j = 0; j < perRow + r; j++) {
      const a = baseYaw + (j / Math.max(1, perRow + r - 1) - 0.5) * span + (rnd(seed + r * 7 + j) - 0.5) * 0.12;
      const rr = r0 + r * 0.75 + (rnd(seed * 3 + j + r) - 0.5) * 0.3;
      const x = center[0] + Math.sin(a) * rr;
      const z = center[2] + Math.cos(a) * rr;
      out.push({p: [x, 0, z], yaw: Math.atan2(center[0] - x, center[2] - z) + (rnd(j * 1.3 + r) - 0.5) * 0.3, i: seed + r * 31 + j});
    }
  return out;
};
