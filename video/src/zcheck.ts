import {getInputProps} from 'remotion';
import * as THREE from 'three';

// Z-fighting check, for any composition. Off unless the render gets the input prop {zcheck: true}
// (tools/zcheck.mjs does that). Every WebGL render of a frame is then preceded by an analysis of the scene
// as the camera sees it: two visible faces that lie in the same plane (closer than the depth buffer can
// tell apart), face the same way and overlap on screen flicker in the video. They are logged as
// "ZCHECK {json}" for the tool to collect.

type Tri = {
  a: THREE.Vector3;
  b: THREE.Vector3;
  c: THREE.Vector3;
  n: THREE.Vector3;
  d: number;
  dist: number;
  src: number; // index into the sources list
  min: THREE.Vector3;
  max: THREE.Vector3;
};
type Source = {label: string; double: boolean};

const enabled = (() => {
  try {
    return Boolean((getInputProps() as {zcheck?: boolean}).zcheck);
  } catch {
    return false;
  }
})();

const MAX_DIST = 90; // m from the camera; further away the fog hides everything in these videos
const MIN_AREA = 1e-4; // m², 1 cm² of shared surface
const MIN_SHARE = 2e-6; // shared area on screen as a part of the frame (about 4 px of a 1080×1920 frame)
const NEAR_GAP = 0.001; // faces closer than 1 mm are reported as "near", even if the depth buffer copes

const hex = (c?: THREE.Color) => (c ? `#${c.getHexString()}` : '');
const fmt = (x: number) => (Math.abs(x) < 0.005 ? '0' : x.toFixed(2));

const describe = (mesh: THREE.Mesh, m: THREE.Matrix4, instance: number | null, color: string) => {
  const g = mesh.geometry;
  if (!g.boundingBox) g.computeBoundingBox();
  const box = g.boundingBox!.clone().applyMatrix4(m);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const kind = g.type.replace('Geometry', '').replace('Buffer', '').toLowerCase() || 'mesh';
  const names: string[] = [];
  for (let o: THREE.Object3D | null = mesh; o; o = o.parent) if (o.name) names.push(o.name);
  return (
    `${kind} ${fmt(size.x)}×${fmt(size.y)}×${fmt(size.z)} ${color}` +
    ` at (${fmt(centre.x)}, ${fmt(centre.y)}, ${fmt(centre.z)})` +
    (instance !== null ? ` [instance ${instance}]` : '') +
    (names.length ? ` "${names.join(' < ')}"` : '')
  );
};

// the smallest depth difference the depth buffer resolves at distance z
const depthStep = (z: number, cam: THREE.PerspectiveCamera, log: boolean) => {
  const steps = 2 ** 24;
  if (log) return ((1 + z) * Math.log(1 + cam.far)) / steps;
  return (z * z) / (cam.near * steps);
};

const collect = (scene: THREE.Scene, cam: THREE.PerspectiveCamera) => {
  const frustum = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
  const camPos = cam.getWorldPosition(new THREE.Vector3());
  const tris: Tri[] = [];
  const sources: Source[] = [];
  const sphere = new THREE.Sphere();
  const inst = new THREE.Matrix4();
  const world = new THREE.Matrix4();
  const col = new THREE.Color();
  scene.traverseVisible((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry?.attributes?.position) return;
    const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
    if (!mat || !mat.visible || mat.depthTest === false || mat.depthWrite === false || mat.colorWrite === false) return;
    if (mat.transparent && mat.opacity < 0.5) return;
    const g = mesh.geometry;
    if (!g.boundingSphere) g.computeBoundingSphere();
    const pos = g.attributes.position;
    const idx = g.index;
    const triCount = idx ? idx.count / 3 : pos.count / 3;
    const im = (mesh as unknown as THREE.InstancedMesh).isInstancedMesh ? (mesh as unknown as THREE.InstancedMesh) : null;
    const count = im ? im.count : 1;
    for (let k = 0; k < count; k++) {
      if (im) {
        im.getMatrixAt(k, inst);
        if (Math.abs(inst.determinant()) < 1e-12) continue; // hidden instances are scaled to zero
        world.multiplyMatrices(mesh.matrixWorld, inst);
      } else world.copy(mesh.matrixWorld);
      sphere.copy(g.boundingSphere!).applyMatrix4(world);
      if (!frustum.intersectsSphere(sphere)) continue;
      if (sphere.center.distanceTo(camPos) - sphere.radius > MAX_DIST) continue;
      let color = hex(mat.color);
      if (im?.instanceColor) {
        im.getColorAt(k, col);
        color = hex(col);
      }
      const src = sources.length;
      sources.push({label: describe(mesh, world, im ? k : null, color), double: mat.side === THREE.DoubleSide});
      const flip = mat.side === THREE.BackSide;
      for (let t = 0; t < triCount; t++) {
        const i0 = idx ? idx.getX(t * 3) : t * 3;
        const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
        const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
        const a = new THREE.Vector3().fromBufferAttribute(pos, i0).applyMatrix4(world);
        const b = new THREE.Vector3().fromBufferAttribute(pos, i1).applyMatrix4(world);
        const c = new THREE.Vector3().fromBufferAttribute(pos, i2).applyMatrix4(world);
        const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
        const len = n.length();
        if (len < 1e-9) continue;
        n.divideScalar(len);
        if (flip) n.negate();
        const toCam = new THREE.Vector3().subVectors(camPos, a);
        const facing = n.dot(toCam);
        if (facing <= 0) {
          if (mat.side !== THREE.DoubleSide) continue; // back face: culled, never seen
          n.negate();
        }
        const min = a.clone().min(b).min(c);
        const max = a.clone().max(b).max(c);
        const centre = a.clone().add(b).add(c).divideScalar(3);
        const dist = centre.distanceTo(camPos);
        if (dist > MAX_DIST) continue;
        tris.push({a, b, c, n, d: n.dot(a), dist, src, min, max});
      }
    }
  });
  return {tris, sources, camPos};
};

// area of the overlap of two triangles lying in (almost) the same plane, by clipping one with the other in 2D
const overlap = (p: Tri, q: Tri): {area: number; poly: THREE.Vector3[]} => {
  const n = p.n;
  const u = new THREE.Vector3().subVectors(p.b, p.a).normalize();
  const v = new THREE.Vector3().crossVectors(n, u);
  const to2 = (x: THREE.Vector3): [number, number] => [x.dot(u), x.dot(v)];
  const P = [p.a, p.b, p.c].map(to2);
  let poly = [q.a, q.b, q.c].map(to2);
  // keep P counter-clockwise
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  if (cross(P[0], P[1], P[2]) < 0) P.reverse();
  for (let i = 0; i < 3 && poly.length; i++) {
    const A = P[i];
    const B = P[(i + 1) % 3];
    const out: [number, number][] = [];
    for (let j = 0; j < poly.length; j++) {
      const S = poly[j];
      const E = poly[(j + 1) % poly.length];
      const sIn = cross(A, B, S) >= 0;
      const eIn = cross(A, B, E) >= 0;
      if (eIn) {
        if (!sIn) out.push(inter(A, B, S, E));
        out.push(E);
      } else if (sIn) out.push(inter(A, B, S, E));
    }
    poly = out;
  }
  let area = 0;
  for (let j = 0; j < poly.length; j++) {
    const a = poly[j];
    const b = poly[(j + 1) % poly.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const d = p.d;
  return {area: Math.abs(area) / 2, poly: poly.map(([x, y]) => n.clone().multiplyScalar(d).addScaledVector(u, x).addScaledVector(v, y))};
};
const inter = (A: number[], B: number[], S: number[], E: number[]): [number, number] => {
  const a1 = B[1] - A[1];
  const b1 = A[0] - B[0];
  const c1 = a1 * A[0] + b1 * A[1];
  const a2 = E[1] - S[1];
  const b2 = S[0] - E[0];
  const c2 = a2 * S[0] + b2 * S[1];
  const det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < 1e-15) return [S[0], S[1]];
  return [(b2 * c1 - b1 * c2) / det, (a1 * c2 - a2 * c1) / det];
};

// share: part of the frame the shared patch covers (0..1); screen: its centre, 0..1 from the top left
export type ZHit = {kind: 'fight' | 'near'; a: string; b: string; gapMm: number; areaCm2: number; share: number; at: [number, number, number]; screen: [number, number]};

const analyse = (scene: THREE.Scene, cam: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): ZHit[] => {
  scene.updateMatrixWorld(true);
  cam.updateMatrixWorld(true);
  const log = Boolean(renderer.capabilities.logarithmicDepthBuffer);
  const {tris, sources, camPos} = collect(scene, cam);
  // bucket by direction and plane offset, then by a coarse 3D grid so only neighbours are compared
  const CELL = 2;
  const buckets = new Map<string, number[]>();
  tris.forEach((t, i) => {
    const nk = `${Math.round(t.n.x * 40)},${Math.round(t.n.y * 40)},${Math.round(t.n.z * 40)}`;
    const dk = Math.floor(t.d / 0.004);
    for (let x = Math.floor(t.min.x / CELL); x <= Math.floor(t.max.x / CELL); x++)
      for (let y = Math.floor(t.min.y / CELL); y <= Math.floor(t.max.y / CELL); y++)
        for (let z = Math.floor(t.min.z / CELL); z <= Math.floor(t.max.z / CELL); z++) {
          const key = `${nk}|${dk}|${x},${y},${z}`;
          if (!buckets.has(key)) buckets.set(key, []);
          buckets.get(key)!.push(i);
        }
  });
  const seen = new Set<string>();
  const hits = new Map<string, ZHit>();
  const ray = new THREE.Raycaster();
  for (const [key, list] of buckets) {
    // the same plane may straddle two offset buckets: compare with the next one up as well
    const [nk, dk, cell] = key.split('|');
    const next = buckets.get(`${nk}|${Number(dk) + 1}|${cell}`) ?? [];
    const all = [...list, ...next];
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < all.length; j++) {
        const p = tris[list[i]];
        const q = tris[all[j]];
        if (p === q) continue;
        if (p.src === q.src) continue; // faces of one box never overlap each other
        const pair = list[i] < all[j] ? `${list[i]}-${all[j]}` : `${all[j]}-${list[i]}`;
        if (seen.has(pair)) continue;
        seen.add(pair);
        if (p.n.dot(q.n) < 0.99995) continue;
        const gap = Math.abs(p.d - q.d);
        const step = depthStep(Math.min(p.dist, q.dist), cam, log);
        const fight = gap <= Math.max(1e-4, 8 * step);
        if (!fight && gap > NEAR_GAP) continue;
        if (p.max.x < q.min.x - 1e-3 || q.max.x < p.min.x - 1e-3 || p.max.y < q.min.y - 1e-3 || q.max.y < p.min.y - 1e-3 || p.max.z < q.min.z - 1e-3 || q.max.z < p.min.z - 1e-3) continue;
        const ov = overlap(p, q);
        if (ov.area < MIN_AREA) continue;
        // how big the shared patch is in the final frame
        const scr = ov.poly.map((x) => x.clone().project(cam));
        let share = 0;
        for (let k = 0; k < scr.length; k++) {
          const a = scr[k];
          const b = scr[(k + 1) % scr.length];
          share += a.x * b.y - b.x * a.y;
        }
        share = Math.abs(share) / 8; // clip space is 2×2
        if (share < MIN_SHARE) continue;
        const centre = ov.poly.reduce((s, x) => s.add(x), new THREE.Vector3()).divideScalar(ov.poly.length);
        const sc = centre.clone().project(cam);
        if (Math.abs(sc.x) > 1 || Math.abs(sc.y) > 1 || sc.z > 1) continue;
        // something else in front of it?
        const dir = new THREE.Vector3().subVectors(centre, camPos);
        const dist = dir.length();
        ray.set(camPos, dir.normalize());
        ray.near = cam.near;
        ray.far = dist + 0.01;
        const first = ray.intersectObject(scene, true).find((h) => (h.object as THREE.Mesh).isMesh && ((h.object as THREE.Mesh).material as THREE.Material).depthWrite !== false);
        if (first && first.distance < dist - 0.01) continue;
        const [la, lb] = [sources[p.src].label, sources[q.src].label].sort();
        const id = `${la}|${lb}`;
        const hit: ZHit = {
          kind: fight ? 'fight' : 'near',
          a: la,
          b: lb,
          gapMm: Math.round(gap * 10000) / 10,
          areaCm2: Math.round(ov.area * 1e4 * 10) / 10,
          share,
          at: [centre.x, centre.y, centre.z].map((x) => Math.round(x * 100) / 100) as [number, number, number],
          screen: [(sc.x + 1) / 2, (1 - sc.y) / 2],
        };
        const old = hits.get(id);
        if (!old) hits.set(id, hit);
        else {
          old.areaCm2 = Math.round((old.areaCm2 + hit.areaCm2) * 10) / 10;
          old.share += hit.share;
        }
      }
  }
  return [...hits.values()];
};

// WebGLRenderer.render is set up per instance, so hook the scene instead: the renderer calls
// scene.onBeforeRender(renderer, scene, camera) at the start of every render of the frame
if (enabled) {
  const before = THREE.Scene.prototype.onBeforeRender;
  let n = 0;
  THREE.Scene.prototype.onBeforeRender = function (this: THREE.Scene, ...args: Parameters<THREE.Scene['onBeforeRender']>) {
    const [renderer, scene, camera] = args as unknown as [THREE.WebGLRenderer, THREE.Scene, THREE.Camera];
    if (scene === this && (camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const t0 = performance.now();
      const hits = analyse(scene, camera as THREE.PerspectiveCamera, renderer);
      // eslint-disable-next-line no-console
      console.log(`ZCHECK ${JSON.stringify({call: n++, ms: Math.round(performance.now() - t0), hits})}`);
    }
    return before.apply(this, args);
  };
}
