import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Batch, LOOK, Parts, SUN, V3} from './ink';
import {hash} from './rig';

// The clearing: sunset sky with the sun low in a gap of the tree line, a ground with long tree shadows
// and a corridor of light, rings of jungle trees fading into orange haze.

export const SUN_AZ = Math.atan2(SUN[0], SUN[2]);
// unit vector on the ground pointing to the sun, and across it
export const SUN_G: V3 = [Math.sin(SUN_AZ), 0, Math.cos(SUN_AZ)];
export const SUN_X: V3 = [Math.cos(SUN_AZ), 0, -Math.sin(SUN_AZ)];

const NOISE = `
  float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) { return 0.55 * vnoise(p) + 0.3 * vnoise(p * 2.1 + 3.7) + 0.15 * vnoise(p * 4.3 + 9.1); }
`;

const skyMat = () =>
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    uniforms: {uSun: {value: new THREE.Vector3(...SUN)}, uFog: {value: LOOK.fog}},
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = position;
        vec4 p = projectionMatrix * vec4(mat3(modelViewMatrix) * position, 1.0);
        gl_Position = p.xyww;
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 uSun;
      uniform vec3 uFog;
      ${NOISE}
      vec3 srgb(float r, float g, float b) { return pow(vec3(r, g, b) / 255.0, vec3(2.2)); }
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 c = mix(srgb(255.0, 196.0, 110.0), srgb(255.0, 140.0, 92.0), smoothstep(0.0, 0.13, h));
        c = mix(c, srgb(214.0, 92.0, 128.0), smoothstep(0.1, 0.34, h));
        c = mix(c, srgb(104.0, 62.0, 150.0), smoothstep(0.3, 0.62, h));
        c = mix(c, srgb(44.0, 36.0, 104.0), smoothstep(0.55, 1.0, h));
        float sd = dot(d, normalize(uSun));
        // stepped halo, like inked rings
        c += srgb(255.0, 190.0, 90.0) * (0.34 * smoothstep(0.90, 0.905, sd) + 0.3 * smoothstep(0.965, 0.968, sd) + 0.2 * pow(max(sd, 0.0), 6.0));
        // clouds: long flat bands, lit from below
        float az = atan(d.x, d.z);
        float cl = fbm(vec2(az * 2.6, h * 15.0 + 2.0)) + 0.25 * (1.0 - smoothstep(0.0, 0.5, h));
        float band = smoothstep(0.62, 0.64, cl) * smoothstep(0.03, 0.08, h) * (1.0 - smoothstep(0.42, 0.6, h));
        vec3 cc = mix(srgb(255.0, 214.0, 150.0), srgb(170.0, 84.0, 140.0), smoothstep(0.66, 0.8, cl));
        c = mix(c, cc, band * 0.9);
        c = mix(c, srgb(255.0, 250.0, 215.0), smoothstep(0.9972, 0.9976, sd));
        c = mix(uFog, c, smoothstep(-0.02, 0.02, h));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });

const groundMat = () =>
  new THREE.ShaderMaterial({
    uniforms: {uSun: {value: new THREE.Vector3(...SUN)}, uFog: {value: LOOK.fog}, uFogD: {value: 0.012}},
    vertexShader: `
      varying vec3 vW;
      varying vec3 vVP;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vec4 mv = viewMatrix * w;
        vVP = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vW;
      varying vec3 vVP;
      uniform vec3 uSun;
      uniform vec3 uFog;
      uniform float uFogD;
      ${NOISE}
      vec3 srgb(float r, float g, float b) { return pow(vec3(r, g, b) / 255.0, vec3(2.2)); }
      void main() {
        vec2 p = vW.xz;
        float r = length(p);
        float n = fbm(p * 0.22);
        float clear = step(12.5, r + (n - 0.5) * 9.0);
        vec3 dirt = mix(srgb(226.0, 172.0, 104.0), srgb(204.0, 146.0, 86.0), step(0.5, fbm(p * 0.5 + 7.0)));
        dirt = mix(dirt, srgb(240.0, 196.0, 128.0), step(0.7, fbm(p * 1.1 + 2.0)));
        vec3 grass = mix(srgb(126.0, 170.0, 62.0), srgb(96.0, 146.0, 58.0), step(0.5, fbm(p * 0.45 + 3.0)));
        grass = mix(grass, srgb(160.0, 190.0, 70.0), step(0.72, fbm(p * 1.3 + 11.0)));
        vec3 c = mix(dirt, grass, clear);
        // tree shadows: long stripes along the sun direction, with a corridor of light through the middle
        vec2 sg = normalize(uSun.xz);
        float across = dot(p, vec2(sg.y, -sg.x));
        float al = dot(p, sg);
        float st = vnoise(vec2(across * 0.2 + 5.0, 1.5)) + 0.1 * vnoise(vec2(across * 1.3, al * 0.07));
        float sh = smoothstep(0.5, 0.52, st) * smoothstep(3.0, 4.2, abs(across) + 0.6 * vnoise(vec2(al * 0.3, 2.0)));
        c *= mix(vec3(1.0), vec3(0.5, 0.46, 0.72), sh);
        float f = 1.0 - exp(-max(0.0, length(vVP) - 2.0) * uFogD);
        c = mix(c, uFog, clamp(f, 0.0, 1.0));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });

// ---------------------------------------------------------------- trees
const GREENS = ['#3f8f3a', '#57a43c', '#2f7a45', '#7ab83f', '#4a9a52'];
const TRUNK = '#6a4434';
const pick = (arr: string[], r: number) => arr[Math.floor(r * arr.length) % arr.length];
const inGap = (az: number, half: number) => {
  let d = az - SUN_AZ;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d) < half;
};

const tree = (P: Parts, x: number, z: number, hgt: number, seed: number, line: boolean) => {
  const r = (k: number) => hash(seed * 3.7 + k);
  const tr = 0.32 + 0.3 * r(1);
  const lean: V3 = [(r(2) - 0.5) * 1.6, 0, (r(3) - 0.5) * 1.6];
  const top: V3 = [x + lean[0], hgt, z + lean[2]];
  P.seg('tap', [x, -0.2, z], top, tr, TRUNK, line);
  for (let i = 0; i < 3; i++) {
    const a = r(4) * 6 + i * 2.1;
    P.seg('cone', [x + Math.cos(a) * tr * 1.5, -0.1, z + Math.sin(a) * tr * 1.5], [x, 1.5 + r(5 + i), z], tr * 0.6, TRUNK, false);
  }
  const n = line ? 6 : 4;
  for (let i = 0; i < n; i++) {
    const a = i * 2.4 + r(10) * 6;
    const rr = i === 0 ? 0 : 1.6 + 1.6 * r(11 + i);
    const s = 2.3 + 1.9 * r(20 + i);
    P.at('sph', [top[0] + Math.cos(a) * rr, hgt + 0.6 - 0.8 * r(30 + i) + (i === 0 ? 1 : 0), top[2] + Math.sin(a) * rr], [s, s * 0.62, s], pick(GREENS, r(40 + i)), undefined, line);
  }
  // a hanging vine or two
  if (line && r(50) < 0.7) {
    const a = r(51) * 6;
    const vx = top[0] + Math.cos(a) * 2;
    const vz = top[2] + Math.sin(a) * 2;
    P.seg('cyl', [vx, hgt - 0.5, vz], [vx + 0.2, hgt - 3.5 - 2 * r(52), vz], 0.035, '#2f6a3a', false);
  }
};

const palm = (P: Parts, x: number, z: number, hgt: number, seed: number) => {
  const r = (k: number) => hash(seed * 5.3 + k);
  const dx = (r(1) - 0.5) * 2.4;
  const dz = (r(2) - 0.5) * 2.4;
  let prev: V3 = [x, -0.1, z];
  for (let i = 1; i <= 4; i++) {
    const k = i / 4;
    const p: V3 = [x + dx * k * k, hgt * k, z + dz * k * k];
    P.seg('cyl', prev, p, 0.17 - 0.03 * k, '#8a6a48', true);
    prev = p;
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + r(3);
    const out: V3 = [Math.cos(a), 0, Math.sin(a)];
    const mid: V3 = [prev[0] + out[0] * 1.2, prev[1] + 0.35, prev[2] + out[2] * 1.2];
    const tip: V3 = [prev[0] + out[0] * 2.6, prev[1] - 0.7 - 0.5 * r(5 + i), prev[2] + out[2] * 2.6];
    P.ell('sph', prev, mid, 0.34, 0.06, [-out[2], 0, out[0]], pick(GREENS, r(20 + i)), true, 0.1);
    P.ell('sph', mid, tip, 0.3, 0.05, [-out[2], 0, out[0]], pick(GREENS, r(30 + i)), true, 0.1);
  }
};

// a low plant with big leaves (also used close to the camera as a dark frame)
export const leafPlant = (P: Parts, at: V3, size: number, seed: number, hex?: string, n = 6) => {
  const r = (k: number) => hash(seed * 9.1 + k);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r(1) * 3;
    const out: V3 = [Math.cos(a), 0, Math.sin(a)];
    const reach = size * (0.7 + 0.5 * r(2 + i));
    const up = size * (0.55 + 0.6 * r(10 + i));
    const mid: V3 = [at[0] + out[0] * reach * 0.45, at[1] + up, at[2] + out[2] * reach * 0.45];
    const tip: V3 = [at[0] + out[0] * reach, at[1] + up * (0.5 + 0.4 * r(20 + i)), at[2] + out[2] * reach];
    P.seg('cyl', at, mid, 0.025 * size, hex ?? '#3a7a3c', false);
    P.ell('sph', mix(at, mid, 0.6), tip, size * 0.2, size * 0.03, [-out[2], 0, out[0]], hex ?? pick(GREENS, r(30 + i)), true, 0.05);
  }
};
const mix = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const buildJungle = () => {
  const P = new Parts();
  // ring A: the wall of the clearing
  for (let i = 0; i < 46; i++) {
    const az = (i / 46) * Math.PI * 2 + (hash(i) - 0.5) * 0.1;
    if (inGap(az, 0.2)) continue;
    const rad = 19.5 + 6 * hash(i + 50);
    tree(P, Math.sin(az) * rad, Math.cos(az) * rad, 8 + 5 * hash(i + 90), i, true);
  }
  // ring B
  for (let i = 0; i < 60; i++) {
    const az = (i / 60) * Math.PI * 2 + (hash(i + 7) - 0.5) * 0.1;
    if (inGap(az, 0.13)) continue;
    const rad = 30 + 16 * hash(i + 150);
    tree(P, Math.sin(az) * rad, Math.cos(az) * rad, 10 + 8 * hash(i + 190), i + 300, false);
  }
  // far hills
  for (let i = 0; i < 26; i++) {
    const az = (i / 26) * Math.PI * 2;
    const rad = 75 + 50 * hash(i + 250);
    const low = inGap(az, 0.3);
    const s = 18 + 16 * hash(i + 270);
    P.at('sph', [Math.sin(az) * rad, 0, Math.cos(az) * rad], [s * 1.6, low ? 5 + 4 * hash(i) : 12 + 14 * hash(i + 280), s], pick(GREENS, hash(i + 290)), undefined, false);
  }
  // palms at the edge
  for (let i = 0; i < 9; i++) {
    const az = (i / 9) * Math.PI * 2 + 0.3 + hash(i + 400) * 0.4;
    if (inGap(az, 0.16)) continue;
    const rad = 15.5 + 3 * hash(i + 410);
    palm(P, Math.sin(az) * rad, Math.cos(az) * rad, 5 + 3.5 * hash(i + 420), i);
  }
  // bushes, big-leaf plants and rocks around the edge
  for (let i = 0; i < 70; i++) {
    const az = hash(i + 500) * Math.PI * 2;
    const rad = 13.5 + 7 * hash(i + 510);
    if (inGap(az, 0.11) && rad < 30) continue;
    const x = Math.sin(az) * rad;
    const z = Math.cos(az) * rad;
    const t = hash(i + 520);
    if (t < 0.45) {
      const s = 0.6 + 0.9 * hash(i + 530);
      P.at('sph', [x, s * 0.5, z], [s * 1.3, s, s * 1.2], pick(GREENS, hash(i + 540)));
      P.at('sph', [x + s * 0.9, s * 0.35, z + s * 0.3], [s * 0.8, s * 0.7, s * 0.8], pick(GREENS, hash(i + 550)));
    } else if (t < 0.8) leafPlant(P, [x, 0, z], 1.1 + 1.1 * hash(i + 560), i);
    else {
      const s = 0.4 + 0.7 * hash(i + 570);
      P.at('sph', [x, s * 0.35, z], [s * 1.2, s * 0.75, s], '#8f8aa0', [0, hash(i) * 3, 0.2]);
    }
  }
  // grass tufts and pebbles on the clearing
  for (let i = 0; i < 520; i++) {
    const az = hash(i + 600) * Math.PI * 2;
    const rad = 2 + 16 * Math.sqrt(hash(i + 610));
    const x = Math.sin(az) * rad;
    const z = Math.cos(az) * rad;
    if (rad > 11 + 3 * hash(i + 615)) {
      for (let j = 0; j < 3; j++) P.seg('cone', [x + (j - 1) * 0.07, 0, z], [x + (j - 1) * 0.16, 0.22 + 0.2 * hash(i + j), z + (hash(i + j * 3) - 0.5) * 0.1], 0.035, pick(GREENS, hash(i + 620)), false);
    } else if (hash(i + 630) < 0.5) {
      const s = 0.04 + 0.07 * hash(i + 640);
      P.at('sph', [x, s * 0.3, z], [s * 1.3, s * 0.6, s], hash(i + 650) < 0.5 ? '#b08a62' : '#9a8f8a', undefined, false);
    } else {
      for (let j = 0; j < 2; j++) P.seg('cone', [x + j * 0.06, 0, z], [x + j * 0.1 - 0.04, 0.12 + 0.1 * hash(i + j), z], 0.022, '#c9b060', false);
    }
  }
  // a fallen log and two boulders, for the foreground of some shots
  P.seg('cyl', [-9.5, 0.35, 5.5], [-7.2, 0.4, 8.6], 0.42, TRUNK);
  P.at('sph', [9.2, 0.7, 4.2], [1.5, 1.0, 1.2], '#8f8aa0', [0.1, 0.5, 0.1]);
  P.at('sph', [10.3, 0.35, 5.4], [0.8, 0.5, 0.7], '#a39cb0', [0, 1.2, 0]);
  return P.list;
};

// ---------------------------------------------------------------- blob shadows (stencilled, so they never double up)
export type Blob = {x: number; z: number; len: number; w: number};
const MAX_BLOBS = 400;
export class Shadows {
  mesh: THREE.InstancedMesh;
  constructor() {
    const g = new THREE.CircleGeometry(1, 20);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.DstColorFactor,
      blendDst: THREE.ZeroFactor,
      stencilWrite: true,
      stencilFunc: THREE.NotEqualStencilFunc,
      stencilRef: 1,
      stencilZPass: THREE.ReplaceStencilOp,
      uniforms: {uFogD: {value: 0.02}},
      vertexShader: `
        varying vec3 vVP;
        void main() {
          vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          vVP = mv.xyz;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vVP;
        uniform float uFogD;
        void main() {
          float f = exp(-length(vVP) * uFogD);
          gl_FragColor = vec4(mix(vec3(1.0), vec3(0.6, 0.55, 0.8), f), 1.0);
        }
      `,
    });
    this.mesh = new THREE.InstancedMesh(g, m, MAX_BLOBS);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    this.mesh.count = 0;
  }
  set(blobs: Blob[]) {
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), SUN_AZ);
    const m = new THREE.Matrix4();
    let i = 0;
    for (const b of blobs) {
      if (i >= MAX_BLOBS) break;
      // the blob starts under the feet and stretches away from the sun
      m.compose(new THREE.Vector3(b.x - SUN_G[0] * b.len * 0.8, 0.02, b.z - SUN_G[2] * b.len * 0.8), q, new THREE.Vector3(b.w, 1, b.len));
      this.mesh.setMatrixAt(i++, m);
    }
    this.mesh.count = i;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// ---------------------------------------------------------------- floating dust in the back light
const MOTES = 260;
const Motes: React.FC<{v: number}> = ({v}) => {
  const pts = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MOTES * 3), 3));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp(60.0 / -mv.z, 2.0, 9.0);
        }
      `,
      fragmentShader: `
        void main() {
          float d = length(gl_PointCoord - 0.5);
          gl_FragColor = vec4(vec3(1.0, 0.85, 0.55) * smoothstep(0.5, 0.25, d) * 0.7, 1.0);
        }
      `,
    });
    const p = new THREE.Points(g, m);
    p.frustumCulled = false;
    return p;
  }, []);
  const a = pts.geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < MOTES; i++) {
    const x = (hash(i) - 0.5) * 30 + Math.sin(v * 0.3 + i) * 0.6;
    const y = 0.3 + ((hash(i + 100) * 6 + v * (0.05 + 0.1 * hash(i + 200))) % 6);
    const z = (hash(i + 300) - 0.5) * 30 + Math.cos(v * 0.25 + i * 1.7) * 0.6;
    a.setXYZ(i, x, y, z);
  }
  a.needsUpdate = true;
  return <primitive object={pts} />;
};

export const Jungle: React.FC<{v: number}> = ({v}) => {
  const o = useMemo(() => {
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), skyMat());
    sky.frustumCulled = false;
    sky.renderOrder = -100;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), groundMat());
    ground.renderOrder = -50;
    const b = new Batch(0.05, 1.2, 4, {shade: new THREE.Vector3(0.5, 0.58, 0.62), mid: new THREE.Vector3(0.84, 0.84, 0.72), light: new THREE.Vector3(1.2, 1.1, 0.8)});
    b.set(buildJungle());
    return {sky, ground, trees: b.group};
  }, []);
  return (
    <>
      <primitive object={o.sky} />
      <primitive object={o.ground} />
      <primitive object={o.trees} />
      <Motes v={v} />
    </>
  );
};
