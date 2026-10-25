import {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from './time';

// One InstancedMesh of unit boxes whose transforms are rewritten every frame.
export type Inst = {p: V3; s: V3; r?: V3; hide?: boolean};

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const P = new THREE.Vector3();
const S = new THREE.Vector3();

export const useBoxes = (
  colors: string[],
  opts: {emissive?: string; emissiveIntensity?: number; castShadow?: boolean; opacity?: number} = {},
) => {
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({
        flatShading: true,
        roughness: 0.75,
        emissive: new THREE.Color(opts.emissive ?? '#000000'),
        emissiveIntensity: opts.emissiveIntensity ?? 1,
        transparent: opts.opacity !== undefined,
        opacity: opts.opacity ?? 1,
      }),
      colors.length,
    );
    const c = new THREE.Color();
    colors.forEach((col, i) => m.setColorAt(i, c.set(col)));
    m.frustumCulled = false;
    m.castShadow = opts.castShadow ?? true;
    m.receiveShadow = true;
    return m;
    // colors are fixed for the life of the mesh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors]);
  return mesh;
};

export const setBoxes = (mesh: THREE.InstancedMesh, items: Inst[]) => {
  items.forEach((it, i) => {
    if (it.hide) {
      M.makeScale(0, 0, 0);
    } else {
      E.set(it.r?.[0] ?? 0, it.r?.[1] ?? 0, it.r?.[2] ?? 0);
      Q.setFromEuler(E);
      M.compose(P.set(...it.p), Q, S.set(...it.s));
    }
    mesh.setMatrixAt(i, M);
  });
  mesh.instanceMatrix.needsUpdate = true;
};
