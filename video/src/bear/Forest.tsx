import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Ball, Cone, Cyl, G, Glow, Pill, RBox, Shaft, mat} from './kit';
import {V3, rnd} from './cues';

// The autumn forest: warm golden-hour light, round soft trees, leaf litter, falling leaves, light shafts.

export const LEAF_COLS = ['#e8862a', '#f2b33d', '#d0512a', '#f6c84a', '#c43c26', '#e9a033', '#b5a040'];

// ---------------------------------------------------------------- light, sky, fog

export const ForestLight: React.FC<{k?: number; sun?: V3; shadowBox?: number; center?: V3; warm?: number}> = ({k = 1, sun = [-9, 11, -7], shadowBox = 9, center = [0, 0, 0], warm = 1}) => (
  <>
    <hemisphereLight color={warm > 0.5 ? '#ffe7c4' : '#cfe0ff'} groundColor="#7a5232" intensity={1.25 * k} />
    <directionalLight
      position={[center[0] + sun[0], center[1] + sun[1], center[2] + sun[2]]}
      target-position={center}
      color="#ffd29a"
      intensity={2.3 * k}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-shadowBox}
      shadow-camera-right={shadowBox}
      shadow-camera-top={shadowBox}
      shadow-camera-bottom={-shadowBox}
      shadow-camera-near={0.5}
      shadow-camera-far={60}
      shadow-bias={-0.0005}
      shadow-normalBias={0.02}
    />
    {/* soft fill from the camera side */}
    <directionalLight position={[center[0] + 6, center[1] + 4, center[2] + 9]} color="#ffe6cc" intensity={0.55 * k} />
  </>
);

const skyMat = (top: string, mid: string, low: string) =>
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {cTop: {value: new THREE.Color(top)}, cMid: {value: new THREE.Color(mid)}, cLow: {value: new THREE.Color(low)}},
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 cTop; uniform vec3 cMid; uniform vec3 cLow; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h > 0.12 ? mix(cMid, cTop, smoothstep(0.12, 0.7, h)) : mix(cLow, cMid, smoothstep(-0.05, 0.12, h)); gl_FragColor = vec4(c, 1.0); }`,
  });

export const Sky: React.FC<{top?: string; mid?: string; low?: string; center?: V3}> = ({top = '#7fb2e0', mid = '#f6d9a8', low = '#f7c98a', center = [0, 0, 0]}) => {
  const m = useMemo(() => skyMat(top, mid, low), [top, mid, low]);
  return <mesh position={center} scale={400} geometry={G.sphere(24)} material={m} renderOrder={-1} />;
};

export const Haze: React.FC<{color?: string; near?: number; far?: number}> = ({color = '#f0cf9c', near = 14, far = 75}) => <fog attach="fog" args={[color, near, far]} />;

// ---------------------------------------------------------------- trees and plants

const TRUNK = '#6a4426';
const BARK = {rim: '#ffcf96', rimK: 0.25, rough: 0.95};
const LEAFL = {rim: '#ffe6a8', rimK: 0.45, rimPow: 2.0, rough: 0.9};

export const Tree: React.FC<{position: V3; h?: number; seed?: number; scale?: number; cols?: string[]; sway?: number}> = ({position, h = 4.2, seed = 1, scale = 1, cols = LEAF_COLS, sway = 0}) => {
  const blobs = useMemo(() => {
    const n = 10 + Math.floor(rnd(seed) * 5);
    const base = cols[Math.floor(rnd(seed * 19) * cols.length)];
    return Array.from({length: n}, (_, i) => {
      const a = rnd(seed * 7 + i) * Math.PI * 2;
      const r = 0.3 + rnd(seed * 13 + i) * 1.15;
      const y = h * 0.74 + rnd(seed * 3 + i) * h * 0.32 - r * 0.25;
      // one main colour per tree with a few accents, so each crown reads as one shape
      const c = rnd(seed * 11 + i) < 0.7 ? base : cols[Math.floor(rnd(seed * 23 + i) * cols.length)];
      return {p: [Math.cos(a) * r, y, Math.sin(a) * r] as V3, s: 0.62 + rnd(seed * 5 + i) * 0.6, c};
    });
  }, [seed, h, cols]);
  return (
    <group position={position} scale={scale} rotation={[0, rnd(seed * 17) * 6.28, sway]}>
      <Cyl position={[0, h * 0.42, 0]} rt={0.13} rb={0.27} h={h * 0.84} seg={14} color={TRUNK} look={BARK} />
      <Cyl position={[0.35, h * 0.62, 0]} rotation={[0, 0, -0.8]} rt={0.06} rb={0.11} h={1.1} seg={8} color={TRUNK} look={BARK} />
      <Cyl position={[-0.3, h * 0.7, 0.15]} rotation={[0.3, 0, 0.7]} rt={0.05} rb={0.1} h={0.9} seg={8} color={TRUNK} look={BARK} />
      {blobs.map((b, i) => (
        <Ball key={i} position={b.p} scale={b.s} color={b.c} look={LEAFL} seg={20} />
      ))}
    </group>
  );
};

export const Birch: React.FC<{position: V3; h?: number; seed?: number; scale?: number}> = ({position, h = 5, seed = 2, scale = 1}) => {
  const marks = useMemo(() => Array.from({length: 9}, (_, i) => ({y: 0.4 + rnd(seed * 3 + i) * h * 0.75, a: rnd(seed * 5 + i) * 6.28, w: 0.05 + rnd(seed + i) * 0.07})), [seed, h]);
  return (
    <group position={position} scale={scale} rotation={[0, rnd(seed) * 6, 0]}>
      <Cyl position={[0, h * 0.45, 0]} rt={0.1} rb={0.16} h={h * 0.9} seg={12} color="#efe9dc" look={{rim: '#fff4dc', rimK: 0.25, rough: 0.8}} />
      {marks.map((m, i) => (
        <group key={i} position={[0, m.y, 0]} rotation={[0, m.a, 0]}>
          <Ball position={[0, 0, 0.125 - (m.y / h) * 0.05]} scale={[m.w, 0.018, 0.03]} color="#2a2420" shadow={false} />
        </group>
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <Ball
          key={i}
          position={[Math.cos(i * 1.7 + seed) * 0.6, h * 0.82 + (i % 3) * 0.45, Math.sin(i * 1.7 + seed) * 0.6]}
          scale={0.7 + (i % 2) * 0.25}
          color={i % 2 ? '#f6cf4a' : '#e9b736'}
          look={LEAFL}
          seg={18}
        />
      ))}
    </group>
  );
};

export const Pine: React.FC<{position: V3; h?: number; scale?: number}> = ({position, h = 5.5, scale = 1}) => (
  <group position={position} scale={scale}>
    <Cyl position={[0, 0.6, 0]} rt={0.12} rb={0.18} h={1.2} seg={10} color="#4f3420" look={BARK} />
    {[0, 1, 2, 3].map((i) => (
      <Cone key={i} position={[0, 1.2 + i * h * 0.19, 0]} r={1.25 - i * 0.26} h={h * 0.36} seg={18} color={i % 2 ? '#2f5a3a' : '#2a5034'} look={{rim: '#c8e6a0', rimK: 0.25, rough: 0.9}} />
    ))}
  </group>
);

export const Bush: React.FC<{position: V3; scale?: number; seed?: number; shake?: number; cols?: string[]}> = ({position, scale = 1, seed = 3, shake = 0, cols = ['#b8452a', '#d8692c', '#9a3a22', '#e08a34', '#7e8a3a']}) => {
  const blobs = useMemo(
    () =>
      Array.from({length: 15}, (_, i) => {
        const a = (i / 15) * Math.PI * 2 * 2.3 + rnd(seed + i);
        const r = 0.2 + rnd(seed * 3 + i) * 0.55;
        return {p: [Math.cos(a) * r, 0.28 + rnd(seed * 5 + i) * 0.62 - r * 0.25, Math.sin(a) * r * 0.65] as V3, s: 0.24 + rnd(seed * 7 + i) * 0.2, c: cols[Math.floor(rnd(seed * 9 + i) * cols.length)]};
      }),
    [seed, cols],
  );
  return (
    <group position={position} scale={scale}>
      {blobs.map((b, i) => (
        <Ball
          key={i}
          position={[b.p[0] + Math.sin(shake * 40 + i * 2.1) * 0.05 * Math.min(1, shake), b.p[1] + Math.sin(shake * 33 + i) * 0.03 * Math.min(1, shake), b.p[2]]}
          scale={b.s}
          color={b.c}
          look={LEAFL}
          seg={18}
        />
      ))}
    </group>
  );
};

export const Mushroom: React.FC<{position: V3; s?: number}> = ({position, s = 1}) => (
  <group position={position} scale={s}>
    <Cyl position={[0, 0.06, 0]} rt={0.025} rb={0.035} h={0.12} color="#f3ead8" />
    <mesh position={[0, 0.11, 0]} scale={[0.09, 0.06, 0.09]} geometry={G.hemi(20)} material={mat('#d8342a', {rough: 0.5})} castShadow />
    {[0, 1, 2, 3].map((k) => (
      <Ball key={k} position={[Math.cos(k * 1.6) * 0.05, 0.155 - (k % 2) * 0.012, Math.sin(k * 1.6) * 0.05]} scale={0.012} color="#ffffff" shadow={false} />
    ))}
  </group>
);

export const Rock: React.FC<{position: V3; s?: V3; rot?: number}> = ({position, s = [0.5, 0.35, 0.4], rot = 0}) => (
  <group position={position} rotation={[0, rot, 0]}>
    <Ball scale={s} color="#8a8478" look={{rough: 0.95, rim: '#ffe4c0', rimK: 0.15}} seg={16} />
    <Ball position={[0, s[1] * 0.55, 0]} scale={[s[0] * 0.8, s[1] * 0.5, s[2] * 0.8]} color="#6f8a3c" look={{rough: 1}} seg={16} />
  </group>
);

export const Log: React.FC<{position: V3; rot?: number; len?: number}> = ({position, rot = 0, len = 1.6}) => (
  <group position={position} rotation={[0, rot, 0]}>
    <Cyl rotation={[0, 0, Math.PI / 2]} rt={0.2} rb={0.2} h={len} seg={18} color="#6e4a2c" look={BARK} />
    {([1, -1] as const).map((s) => (
      <Cyl key={s} position={[(len / 2 + 0.002) * s, 0, 0]} rotation={[0, 0, Math.PI / 2]} rt={0.17} rb={0.17} h={0.01} seg={18} color="#d8b07a" />
    ))}
    <Ball position={[0.1, 0.17, 0]} scale={[0.35, 0.06, 0.15]} color="#6f8a3c" look={{rough: 1}} />
  </group>
);

// ---------------------------------------------------------------- ground

// fallen leaves: many tiny tilted discs (never in one plane, so no flicker)
export const LeafLitter: React.FC<{center?: V3; r?: number; n?: number; seed?: number; avoid?: (x: number, z: number) => boolean}> = ({center = [0, 0, 0], r = 9, n = 1500, seed = 5, avoid}) => {
  const mesh = useMemo(() => {
    const g = G.plane();
    const m = new THREE.MeshStandardMaterial({map: leafTex(), alphaTest: 0.5, roughness: 0.95, side: THREE.DoubleSide});
    const im = new THREE.InstancedMesh(g, m, n);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    let k = 0;
    for (let i = 0; i < n * 3 && k < n; i++) {
      const a = rnd(seed + i * 3.1) * Math.PI * 2;
      const d = Math.sqrt(rnd(seed * 2 + i * 1.7)) * r;
      const x = center[0] + Math.cos(a) * d;
      const z = center[2] + Math.sin(a) * d;
      if (avoid && avoid(x, z)) continue;
      o.position.set(x, 0.006 + rnd(seed + i * 0.37) * 0.012, z);
      o.rotation.set(-Math.PI / 2 + (rnd(i * 1.3 + seed) - 0.5) * 0.35, (rnd(i * 2.3) - 0.5) * 0.35, rnd(i * 5.7) * 6.28);
      const s = 0.1 + rnd(i * 0.91 + seed) * 0.1;
      o.scale.set(s, s * 1.3, 1);
      o.updateMatrix();
      im.setMatrixAt(k, o.matrix);
      im.setColorAt(k, col.set(LEAF_COLS[Math.floor(rnd(i * 7.7 + seed) * LEAF_COLS.length)]).multiplyScalar(0.8 + rnd(i) * 0.3));
      k++;
    }
    im.count = k;
    im.receiveShadow = true;
    return im;
  }, [center[0], center[2], r, n, seed]);
  return <primitive object={mesh} />;
};

export const Ground: React.FC<{size?: number; color?: string; center?: V3}> = ({size = 160, color = '#b07a3e', center = [0, 0, 0]}) => (
  <mesh position={[center[0], 0, center[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow geometry={G.plane()} scale={[size, size, 1]} material={mat(color, {rough: 1})} />
);

// a dirt path along a curve, a few mm above the ground
export const Path: React.FC<{pts: V3[]; w?: number; color?: string}> = ({pts, w = 1.5, color = '#c9975c'}) => {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const N = 80;
    const pos: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= N; i++) {
      const p = curve.getPoint(i / N);
      const t = curve.getTangent(i / N);
      const nx = -t.z;
      const nz = t.x;
      const l = Math.hypot(nx, nz) || 1;
      const ww = w * (0.9 + 0.12 * Math.sin(i * 0.7));
      pos.push(p.x + (nx / l) * ww * 0.5, 0.004, p.z + (nz / l) * ww * 0.5, p.x - (nx / l) * ww * 0.5, 0.004, p.z - (nz / l) * ww * 0.5);
      if (i < N) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [pts, w]);
  const m = useMemo(() => {
    const mm = mat(color, {rough: 1}) as THREE.MeshStandardMaterial;
    const c = mm.clone();
    c.polygonOffset = true;
    c.polygonOffsetFactor = -2;
    c.polygonOffsetUnits = -2;
    c.side = THREE.DoubleSide;
    return c;
  }, [color]);
  return <mesh geometry={geo} material={m} receiveShadow />;
};

// distant tree walls: instanced round canopies on trunks
export const TreeWall: React.FC<{n?: number; seed?: number; r0?: number; r1?: number; center?: V3; arc?: [number, number]}> = ({n = 140, seed = 9, r0 = 18, r1 = 45, center = [0, 0, 0], arc = [0, Math.PI * 2]}) => {
  const meshes = useMemo(() => {
    const crowns = new THREE.InstancedMesh(G.sphere(14), new THREE.MeshStandardMaterial({roughness: 0.95}), n * 2);
    const trunks = new THREE.InstancedMesh(G.cyl(0.18, 0.28, 1, 8), new THREE.MeshStandardMaterial({color: TRUNK, roughness: 1}), n);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const a = arc[0] + rnd(seed + i * 1.37) * (arc[1] - arc[0]);
      const d = r0 + rnd(seed * 3 + i * 2.1) * (r1 - r0);
      const x = center[0] + Math.cos(a) * d;
      const z = center[2] + Math.sin(a) * d;
      const h = 4 + rnd(i * 3.3) * 4;
      o.position.set(x, h * 0.4, z);
      o.rotation.set(0, 0, 0);
      o.scale.set(1, h * 0.8, 1);
      o.updateMatrix();
      trunks.setMatrixAt(i, o.matrix);
      for (let j = 0; j < 2; j++) {
        const s = 1.6 + rnd(i * 5.1 + j) * 1.6;
        o.position.set(x + (j - 0.5) * 0.9, h * 0.8 + j * 0.9, z + (rnd(i + j) - 0.5));
        o.scale.set(s, s * 1.1, s);
        o.updateMatrix();
        crowns.setMatrixAt(i * 2 + j, o.matrix);
        const pine = rnd(i * 9.1) < 0.15;
        crowns.setColorAt(i * 2 + j, col.set(pine ? '#3a5a34' : LEAF_COLS[Math.floor(rnd(i * 7.3 + j) * LEAF_COLS.length)]).multiplyScalar(0.9));
      }
    }
    crowns.castShadow = false;
    return [crowns, trunks];
  }, [n, seed, r0, r1, center[0], center[2], arc[0], arc[1]]);
  return (
    <>
      <primitive object={meshes[0]} />
      <primitive object={meshes[1]} />
    </>
  );
};

// ---------------------------------------------------------------- air: falling leaves and dust in the light

const leafTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(32, 4);
    g.bezierCurveTo(56, 18, 56, 44, 32, 60);
    g.bezierCurveTo(8, 44, 8, 18, 32, 4);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.25)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(32, 8);
    g.lineTo(32, 58);
    g.stroke();
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();

// leaves drifting down through a box around `center`; positions are a pure function of v
export const FallingLeaves: React.FC<{v: number; center: V3; box?: V3; n?: number; seed?: number; speed?: number; gust?: number}> = ({v, center, box = [10, 6, 10], n = 70, seed = 4, speed = 1, gust = 0}) => {
  const im = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({map: leafTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9});
    const mesh = new THREE.InstancedMesh(G.plane(), m, n);
    const col = new THREE.Color();
    for (let i = 0; i < n; i++) mesh.setColorAt(i, col.set(LEAF_COLS[i % LEAF_COLS.length]));
    mesh.frustumCulled = false;
    return mesh;
  }, [n]);
  const o = useMemo(() => new THREE.Object3D(), []);
  for (let i = 0; i < n; i++) {
    const fall = 0.35 + rnd(seed + i * 1.1) * 0.35;
    const t = v * speed * fall + rnd(seed * 2 + i) * box[1];
    const y = center[1] + box[1] - (t % box[1]);
    const ph = v * (1.2 + rnd(i * 3.3)) + i;
    const x = center[0] + (rnd(seed * 3 + i * 2.7) - 0.5) * box[0] + Math.sin(ph) * 0.35 + gust * (box[1] - (t % box[1])) * 0.4;
    const z = center[2] + (rnd(seed * 5 + i * 1.9) - 0.5) * box[2] + Math.cos(ph * 0.8) * 0.25;
    o.position.set(x, y, z);
    o.rotation.set(ph * 1.3, ph * 0.7, ph);
    const s = 0.09 + rnd(i * 4.1) * 0.06;
    o.scale.set(s, s * 1.3, s);
    o.updateMatrix();
    im.setMatrixAt(i, o.matrix);
  }
  im.instanceMatrix.needsUpdate = true;
  return <primitive object={im} />;
};

// little glowing motes floating in the sun beams
export const Motes: React.FC<{v: number; center: V3; box?: V3; n?: number}> = ({v, center, box = [6, 4, 6], n = 40}) => (
  <>
    {Array.from({length: n}, (_, i) => {
      const x = center[0] + (rnd(i * 1.3) - 0.5) * box[0] + Math.sin(v * 0.4 + i) * 0.15;
      const y = center[1] + rnd(i * 2.9) * box[1] + Math.sin(v * 0.3 + i * 2) * 0.1;
      const z = center[2] + (rnd(i * 4.7) - 0.5) * box[2];
      const tw = 0.5 + 0.5 * Math.sin(v * 2 + i * 3);
      return <Glow key={i} position={[x, y, z]} size={0.06 + rnd(i) * 0.05} color="#fff0c0" k={0.5 * tw} />;
    })}
  </>
);

export const Beams: React.FC<{center: V3; k?: number; n?: number; yaw?: number}> = ({center, k = 0.16, n = 5, yaw = 0.5}) => (
  <group position={center} rotation={[0, yaw, 0]}>
    {Array.from({length: n}, (_, i) => (
      <Shaft key={i} position={[(i - n / 2) * 1.6 + rnd(i) * 0.8, 4.5, (rnd(i * 3) - 0.5) * 3]} rotation={[0, 0, 0.55]} w={0.6 + rnd(i * 5) * 0.9} h={11} k={k * (0.6 + rnd(i * 7) * 0.6)} />
    ))}
  </group>
);

// a set dressing of forest bits around a point: trees, birches, pines, bushes, rocks, mushrooms
export const ForestPatch: React.FC<{center?: V3; r0?: number; r1?: number; n?: number; seed?: number; avoid?: (x: number, z: number) => boolean; bushes?: number}> = ({center = [0, 0, 0], r0 = 3, r1 = 14, n = 22, seed = 21, avoid, bushes = 10}) => {
  const items = useMemo(() => {
    const out: {kind: number; p: V3; s: number; seed: number}[] = [];
    for (let i = 0; i < n * 4 && out.length < n; i++) {
      const a = rnd(seed + i * 1.91) * Math.PI * 2;
      const d = r0 + rnd(seed * 3 + i * 1.33) * (r1 - r0);
      const x = center[0] + Math.cos(a) * d;
      const z = center[2] + Math.sin(a) * d;
      if (avoid && avoid(x, z)) continue;
      if (out.some((q) => Math.hypot(q.p[0] - x, q.p[2] - z) < 2.2)) continue;
      const r = rnd(i * 7.7 + seed);
      out.push({kind: r < 0.55 ? 0 : r < 0.8 ? 1 : 2, p: [x, 0, z], s: 0.85 + rnd(i * 3.1) * 0.5, seed: seed + i});
    }
    return out;
  }, [center[0], center[2], r0, r1, n, seed]);
  const small = useMemo(() => {
    const out: {kind: number; p: V3; s: number; seed: number}[] = [];
    for (let i = 0; i < bushes * 4 && out.length < bushes; i++) {
      const a = rnd(seed * 9 + i * 2.3) * Math.PI * 2;
      const d = r0 * 0.6 + rnd(seed * 5 + i * 1.7) * (r1 - r0 * 0.6);
      const x = center[0] + Math.cos(a) * d;
      const z = center[2] + Math.sin(a) * d;
      if (avoid && avoid(x, z)) continue;
      out.push({kind: i % 3, p: [x, 0, z], s: 0.6 + rnd(i * 1.9) * 0.6, seed: seed * 2 + i});
    }
    return out;
  }, [center[0], center[2], r0, r1, bushes, seed]);
  return (
    <>
      {items.map((it, i) =>
        it.kind === 0 ? (
          <Tree key={i} position={it.p} scale={it.s} seed={it.seed} h={5.6 + rnd(it.seed) * 2.4} />
        ) : it.kind === 1 ? (
          <Birch key={i} position={it.p} scale={it.s} seed={it.seed} h={6 + rnd(it.seed) * 1.6} />
        ) : (
          <Pine key={i} position={it.p} scale={it.s} h={6.5 + rnd(it.seed) * 2} />
        ),
      )}
      {small.map((it, i) =>
        it.kind === 0 ? (
          <Bush key={'b' + i} position={it.p} scale={it.s} seed={it.seed} />
        ) : it.kind === 1 ? (
          <Rock key={'r' + i} position={[it.p[0], 0.1, it.p[2]]} s={[0.45 * it.s, 0.3 * it.s, 0.38 * it.s]} rot={it.seed} />
        ) : (
          <group key={'m' + i}>
            <Mushroom position={it.p} s={1.2} />
            <Mushroom position={[it.p[0] + 0.15, 0, it.p[2] + 0.1]} s={0.8} />
          </group>
        ),
      )}
    </>
  );
};

export {Pill, RBox};
