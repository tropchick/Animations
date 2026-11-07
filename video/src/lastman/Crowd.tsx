import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {V3, rnd} from './cues';
import {HAIR, PANTS, SHIRTS, SKINS} from './people';

// Big crowds of women as instanced boxes (same build as Person, long hair, some in skirts).
export type Member = {p: V3; yaw: number; shirt: string; pants: string; skin: string; hair: string; skirt: string | null; scale: number};
export type MemberPose = {p?: V3; yaw?: number; bend?: number; armL?: number; armR?: number; legSwing?: number; lift?: number; hidden?: boolean; headYaw?: number};

type Group = 'legL' | 'legR' | 'hip' | 'body' | 'head' | 'armL' | 'armR';
type Part = {size: V3; at: V3; group: Group; color: keyof Member | string};

const PARTS: Part[] = [
  {size: [0.2, 0.86, 0.22], at: [0, -0.43, 0], group: 'legL', color: 'pants'},
  {size: [0.2, 0.86, 0.22], at: [0, -0.43, 0], group: 'legR', color: 'pants'},
  {size: [0.21, 0.08, 0.3], at: [0, -0.86, 0.065], group: 'legL', color: '#efefef'},
  {size: [0.21, 0.08, 0.3], at: [0, -0.86, 0.065], group: 'legR', color: '#efefef'},
  {size: [0.58, 0.36, 0.34], at: [0, -0.14, 0], group: 'hip', color: 'skirt'},
  {size: [0.54, 0.7, 0.3], at: [0, 0.32, 0], group: 'body', color: 'shirt'},
  {size: [0.12, 0.08, 0.12], at: [0, 0.7, 0], group: 'body', color: 'skin'},
  {size: [0.3, 0.34, 0.3], at: [0, 0.17, 0], group: 'head', color: 'skin'},
  {size: [0.32, 0.08, 0.32], at: [0, 0.36, -0.005], group: 'head', color: 'hair'},
  {size: [0.32, 0.22, 0.08], at: [0, 0.25, -0.13], group: 'head', color: 'hair'},
  {size: [0.33, 0.34, 0.1], at: [0, 0.08, -0.13], group: 'head', color: 'hair'},
  {size: [0.05, 0.035, 0.012], at: [-0.07, 0.21, 0.152], group: 'head', color: '#2a2622'},
  {size: [0.05, 0.035, 0.012], at: [0.07, 0.21, 0.152], group: 'head', color: '#2a2622'},
  {size: [0.15, 0.27, 0.16], at: [0, -0.12, 0], group: 'armL', color: 'shirt'},
  {size: [0.12, 0.62, 0.13], at: [0, -0.55, 0], group: 'armL', color: 'skin'},
  {size: [0.15, 0.27, 0.16], at: [0, -0.12, 0], group: 'armR', color: 'shirt'},
  {size: [0.12, 0.62, 0.13], at: [0, -0.55, 0], group: 'armR', color: 'skin'},
];

const M = () => new THREE.Matrix4();
const tmp = {base: M(), hip: M(), up: M(), g: M(), m: M(), r: M(), t: M(), c: new THREE.Color(), q: new THREE.Quaternion(), y: new THREE.Vector3(0, 1, 0)};
const T = (m: THREE.Matrix4, x: number, y: number, z: number) => m.makeTranslation(x, y, z);

export const Crowd: React.FC<{members: Member[]; pose: (i: number) => MemberPose; shadows?: boolean}> = ({members, pose, shadows = true}) => {
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const geoms = useMemo(() => PARTS.map((p) => new THREE.BoxGeometry(...p.size)), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({flatShading: true, roughness: 0.9, metalness: 0}), []);

  useLayoutEffect(() => {
    const poses = members.map((_, i) => pose(i));
    PARTS.forEach((part, pi) => {
      const mesh = refs.current[pi];
      if (!mesh) return;
      members.forEach((mb, i) => {
        const st = poses[i];
        if (st.hidden || (part.group === 'hip' && !mb.skirt)) {
          mesh.setMatrixAt(i, tmp.m.makeScale(0, 0, 0));
          return;
        }
        const pos = st.p ?? mb.p;
        tmp.q.setFromAxisAngle(tmp.y, st.yaw ?? mb.yaw);
        tmp.base.compose(new THREE.Vector3(pos[0], pos[1] + (st.lift ?? 0), pos[2]), tmp.q, new THREE.Vector3(mb.scale, mb.scale, mb.scale));
        tmp.hip.copy(tmp.base).multiply(T(tmp.t, 0, 0.9, 0));
        tmp.up.copy(tmp.hip).multiply(tmp.r.makeRotationX(st.bend ?? 0));
        const sw = st.legSwing ?? 0;
        let g: THREE.Matrix4;
        if (part.group === 'legL') g = tmp.g.copy(tmp.hip).multiply(T(tmp.t, -0.12, 0, 0)).multiply(tmp.r.makeRotationX(-sw));
        else if (part.group === 'legR') g = tmp.g.copy(tmp.hip).multiply(T(tmp.t, 0.12, 0, 0)).multiply(tmp.r.makeRotationX(sw));
        else if (part.group === 'hip') g = tmp.g.copy(tmp.hip);
        else if (part.group === 'body') g = tmp.g.copy(tmp.up);
        else if (part.group === 'head') g = tmp.g.copy(tmp.up).multiply(T(tmp.t, 0, 0.74, 0)).multiply(tmp.r.makeRotationY(st.headYaw ?? 0));
        else {
          const side = part.group === 'armL' ? -1 : 1;
          const pitch = part.group === 'armL' ? st.armL ?? 0 : st.armR ?? 0;
          g = tmp.g.copy(tmp.up).multiply(T(tmp.t, 0.33 * side, 0.62, 0)).multiply(tmp.r.makeRotationX(-pitch));
        }
        tmp.m.copy(g).multiply(T(tmp.t, ...part.at));
        mesh.setMatrixAt(i, tmp.m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  });

  useLayoutEffect(() => {
    PARTS.forEach((part, pi) => {
      const mesh = refs.current[pi];
      if (!mesh) return;
      members.forEach((mb, i) => {
        const key = part.color as keyof Member;
        const col = key in mb ? ((mb[key] as string) ?? '#000') : (part.color as string);
        mesh.setColorAt(i, tmp.c.set(col));
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [members]);

  return (
    <>
      {PARTS.map((p, pi) => (
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

// a deterministic outfit for member i
export const member = (i: number, p: V3, yaw: number, seed = 0): Member => {
  const r = (k: number) => rnd(i * 7 + k, seed);
  const skirt = r(1) < 0.45;
  return {
    p,
    yaw,
    shirt: SHIRTS[Math.floor(r(2) * SHIRTS.length)],
    pants: skirt ? SKINS[Math.floor(r(3) * SKINS.length)] : PANTS[Math.floor(r(3) * PANTS.length)],
    skin: SKINS[Math.floor(r(4) * SKINS.length)],
    hair: HAIR[Math.floor(r(5) * HAIR.length)],
    skirt: skirt ? PANTS[Math.floor(r(6) * PANTS.length)] : null,
    scale: 0.92 + r(7) * 0.1,
  };
};
