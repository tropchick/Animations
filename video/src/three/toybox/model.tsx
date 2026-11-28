import {useMemo} from 'react';
import {useLoader, type ThreeElements} from '@react-three/fiber';
import {Box3, Mesh, Vector3, type Material} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {getToyMaterial, type ToyMaterialKind} from './materials';
import type {ToyboxQuality} from './theme';

export type ToyModelRule = {
  readonly mesh?: string;
  readonly material?: string;
  readonly kind: ToyMaterialKind;
  readonly color?: string;
  readonly variant?: number;
};

const noRules: readonly ToyModelRule[] = [];

/**
 * Load a GLB or GLTF inside ThreeCanvas. Pass staticFile('models/example.glb') for local assets.
 * Rules match exact glTF node/material names in order. Keep the array stable between frames.
 */
export function ToyModel({
  src,
  height,
  rules = noRules,
  quality = 'balanced',
  shadows = true,
  ...group
}: Omit<ThreeElements['group'], 'children'> & {
  src: string;
  /** Normalize height and set X/Z center and lowest point to the wrapper's origin. */
  height?: number;
  rules?: readonly ToyModelRule[];
  quality?: ToyboxQuality;
  shadows?: boolean;
}) {
  const gltf = useLoader(GLTFLoader, src);
  const model = useMemo(() => {
    const object = clone(gltf.scene);
    object.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      const adapt = (original: Material) => {
        const rule = rules.find((entry) =>
          (entry.mesh === undefined || entry.mesh === node.name)
          && (entry.material === undefined || entry.material === original.name));
        return rule
          ? getToyMaterial(rule.kind, rule.color, quality, rule.variant)
          : original;
      };
      node.material = Array.isArray(node.material) ? node.material.map(adapt) : adapt(node.material);
      const surfaces = Array.isArray(node.material) ? node.material : [node.material];
      node.castShadow = shadows && surfaces.some((surface) => !surface.transparent);
      node.receiveShadow = shadows;
    });

    const offset = new Vector3();
    let scale = 1;
    if (height !== undefined) {
      if (!(height > 0 && Number.isFinite(height))) throw new Error('ToyModel height must be in positive scene units.');
      const bounds = new Box3().setFromObject(object);
      const extent = bounds.getSize(new Vector3()).y;
      if (extent > 0) {
        scale = height / extent;
        const center = bounds.getCenter(new Vector3());
        offset.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      }
    }
    return {object, offset, scale};
  }, [gltf.scene, height, quality, rules, shadows]);

  return <group {...group}>
    <group position={model.offset} scale={model.scale}>
      <primitive object={model.object} dispose={null} />
    </group>
  </group>;
}
