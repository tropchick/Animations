import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {random} from 'remotion';
import {V3} from './cues';

// Big crowds (100 in the circle, 1000 on the beach) as instanced boxes: same build as Person, far fewer draw calls.
export type CrowdMember = {
  p: V3;
  yaw: number;
  shirt: string;
  pants: string;
  skin: string;
  hair: string;
  scale?: number;
};
export type CrowdPose = {bend?: number; arm?: number; armL?: number; legSwing?: number; hidden?: boolean; lift?: number; p?: V3; yaw?: number};

type Part = {size: V3; at: V3; group: 'legL' | 'legR' | 'body' | 'armL' | 'armR' | 'shovel'; color: keyof CrowdMember | string};

const PARTS: Part[] = [
  {size: [0.2, 0.86, 0.22], at: [0, -0.43, 0], group: 'legL', color: 'pants'},
  {size: [0.2, 0.86, 0.22], at: [0, -0.43, 0], group: 'legR', color: 'pants'},
  {size: [0.21, 0.08, 0.3], at: [0, -0.86, 0.04], group: 'legL', color: '#efefef'},
  {size: [0.21, 0.08, 0.3], at: [0, -0.86, 0.04], group: 'legR', color: '#efefef'},
  {size: [0.54, 0.7, 0.3], at: [0, 0.32, 0], group: 'body', color: 'shirt'},
  {size: [0.3, 0.34, 0.3], at: [0, 0.91, 0], group: 'body', color: 'skin'},
  {size: [0.32, 0.08, 0.32], at: [0, 1.1, -0.005], group: 'body', color: 'hair'},
  {size: [0.32, 0.22, 0.08], at: [0, 0.99, -0.13], group: 'body', color: 'hair'},
  {size: [0.14, 0.3, 0.15], at: [0, -0.13, 0], group: 'armL', color: 'shirt'},
  {size: [0.13, 0.36, 0.14], at: [0, -0.46, 0], group: 'armL', color: 'skin'},
  {size: [0.14, 0.3, 0.15], at: [0, -0.13, 0], group: 'armR', color: 'shirt'},
  {size: [0.13, 0.36, 0.14], at: [0, -0.46, 0], group: 'armR', color: 'skin'},
  {size: [0.04, 1.05, 0.04], at: [0, -0.35, 0], group: 'shovel', color: '#9b6b3e'},
  {size: [0.24, 0.3, 0.03], at: [0, -0.95, 0], group: 'shovel', color: '#9aa2ad'},
];

const tmp = {
  base: new THREE.Matrix4(),
  hip: new THREE.Matrix4(),
  g: new THREE.Matrix4(),
  m: new THREE.Matrix4(),
  r: new THREE.Matrix4(),
  t: new THREE.Matrix4(),
  s: new THREE.Matrix4(),
  c: new THREE.Color(),
};

const T = (m: THREE.Matrix4, x: number, y: number, z: number) => m.makeTranslation(x, y, z);

export const Crowd: React.FC<{members: CrowdMember[]; pose: (i: number) => CrowdPose; shovels?: boolean; shadows?: boolean}> = ({
  members,
  pose,
  shovels = false,
  shadows = true,
}) => {
  const parts = useMemo(() => PARTS.filter((p) => shovels || p.group !== 'shovel'), [shovels]);
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const geoms = useMemo(() => parts.map((p) => new THREE.BoxGeometry(...p.size)), [parts]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({flatShading: true, roughness: 0.9, metalness: 0}), []);

  useLayoutEffect(() => {
    parts.forEach((part, pi) => {
      const mesh = refs.current[pi];
      if (!mesh) return;
      members.forEach((mb, i) => {
        const st = pose(i);
        const sc = mb.scale ?? 1;
        if (st.hidden) {
          tmp.m.makeScale(0, 0, 0);
          mesh.setMatrixAt(i, tmp.m);
          return;
        }
        const pos = st.p ?? mb.p;
        tmp.base.compose(
          new THREE.Vector3(pos[0], pos[1] + (st.lift ?? 0), pos[2]),
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), st.yaw ?? mb.yaw),
          new THREE.Vector3(sc, sc, sc),
        );
        // hips at 0.9; the upper body bends forward around them
        tmp.hip.copy(tmp.base).multiply(T(tmp.t, 0, 0.9, 0));
        const upper = new THREE.Matrix4().copy(tmp.hip).multiply(tmp.r.makeRotationX(st.bend ?? 0));
        const swing = st.legSwing ?? 0;
        let g: THREE.Matrix4;
        if (part.group === 'legL') g = tmp.g.copy(tmp.hip).multiply(T(tmp.t, -0.12, 0, 0)).multiply(tmp.r.makeRotationX(-swing));
        else if (part.group === 'legR') g = tmp.g.copy(tmp.hip).multiply(T(tmp.t, 0.12, 0, 0)).multiply(tmp.r.makeRotationX(swing));
        else if (part.group === 'body') g = tmp.g.copy(upper);
        else {
          const side = part.group === 'armL' ? -1 : 1;
          const pitch = part.group === 'armL' ? st.armL ?? st.arm ?? 0 : st.arm ?? 0;
          g = tmp.g.copy(upper).multiply(T(tmp.t, 0.33 * side, 0.62, 0)).multiply(tmp.r.makeRotationX(-pitch));
          if (part.group === 'shovel') {
            g = tmp.g.copy(upper).multiply(T(tmp.t, 0.33, 0.62, 0)).multiply(tmp.r.makeRotationX(-pitch));
            g.multiply(T(tmp.t, 0, -0.62, 0)).multiply(tmp.r.makeRotationX(-0.7));
          }
        }
        tmp.m.copy(g).multiply(T(tmp.t, ...part.at));
        mesh.setMatrixAt(i, tmp.m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  });

  // colors are set once per crowd
  useLayoutEffect(() => {
    parts.forEach((part, pi) => {
      const mesh = refs.current[pi];
      if (!mesh) return;
      members.forEach((mb, i) => {
        const key = part.color as keyof CrowdMember;
        const col = key in mb ? (mb[key] as string) : (part.color as string);
        mesh.setColorAt(i, tmp.c.set(col));
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [members, parts]);

  return (
    <>
      {parts.map((p, pi) => (
        <instancedMesh
          key={pi}
          ref={(el) => {
            refs.current[pi] = el;
          }}
          args={[geoms[pi], mat, members.length]}
          castShadow={shadows}
          receiveShadow
          frustumCulled={false}
        />
      ))}
    </>
  );
};

const SHIRTS = ['#e9563c', '#3fa6b4', '#f2c84b', '#7c5cc4', '#4f9a52', '#f08aa8', '#ffffff', '#2f3640', '#e88d3a', '#5b8bd9', '#c8473f', '#9ad1c8'];
const PANTS = ['#2f3a52', '#3b3f47', '#5a4a3a', '#24314a', '#6d6f78', '#2b2b2b'];
const SKINS = ['#efd2b3', '#e2b892', '#c58c62', '#9c6a45', '#f3dcc4', '#7a4f33'];
const HAIRS = ['#2e2620', '#7b5434', '#c9a46a', '#1b1916', '#a5452c', '#5a4632'];

// a deterministic random outfit for crowd member i
export const outfit = (i: number, seed: string) => {
  const r = (k: string) => random(`${seed}-${k}-${i}`);
  return {
    shirt: SHIRTS[Math.floor(r('shirt') * SHIRTS.length)],
    pants: PANTS[Math.floor(r('pants') * PANTS.length)],
    skin: SKINS[Math.floor(r('skin') * SKINS.length)],
    hair: HAIRS[Math.floor(r('hair') * HAIRS.length)],
    scale: 0.9 + r('scale') * 0.16,
  };
};
