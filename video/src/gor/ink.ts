import * as THREE from 'three';

// «100 мужчин против гориллы»: comic 3D look. Everything is drawn with two custom shaders:
// a three-tone toon fill (purple shade, warm light, orange rim from the low sun, distance haze)
// and an ink outline (inverted hull pushed out in screen space, so lines keep a readable width).
// Characters are lists of parts (spheres, cylinders, cones) batched into a few InstancedMeshes.

export type V3 = [number, number, number];

// direction TO the sun: low, behind the gorilla (the men look into it)
export const SUN: V3 = (() => {
  const v = new THREE.Vector3(-0.42, 0.3, -0.86).normalize();
  return [v.x, v.y, v.z] as V3;
})();

const lin = (hex: string) => new THREE.Color(hex);

export const LOOK = {
  shade: new THREE.Vector3(0.36, 0.3, 0.58),
  mid: new THREE.Vector3(0.82, 0.68, 0.7),
  light: new THREE.Vector3(1.22, 1.04, 0.82),
  rim: lin('#ffb347'),
  fog: lin('#f29a5c'),
  ink: lin('#1c1024'),
};

const VERT_COMMON = `
  #ifdef INST_COL
    attribute vec3 aCol;
  #endif
  varying vec3 vN;
  varying vec3 vVP;
  varying vec3 vCol;
  uniform vec3 uColor;
  vec3 instNormal() {
    vec3 n = normal;
    #ifdef USE_INSTANCING
      mat3 m3 = mat3(instanceMatrix);
      n /= vec3(dot(m3[0], m3[0]), dot(m3[1], m3[1]), dot(m3[2], m3[2]));
      n = m3 * n;
    #endif
    return normalize(normalMatrix * n);
  }
  vec4 instView() {
    vec4 p = vec4(position, 1.0);
    #ifdef USE_INSTANCING
      p = instanceMatrix * p;
    #endif
    return modelViewMatrix * p;
  }
  void setColor() {
    vCol = uColor;
    #ifdef INST_COL
      vCol *= aCol;
    #endif
    #ifdef USE_COLOR
      vCol *= color.rgb;
    #endif
  }
`;

const FOG = `
  uniform vec3 uFog;
  uniform float uFogD;
  vec3 haze(vec3 c, vec3 vp) {
    float f = 1.0 - exp(-max(0.0, length(vp) - 2.0) * uFogD);
    return mix(c, uFog, clamp(f, 0.0, 1.0));
  }
`;

const FILL_VERT = `
  ${VERT_COMMON}
  void main() {
    vN = instNormal();
    vec4 mv = instView();
    vVP = mv.xyz;
    setColor();
    gl_Position = projectionMatrix * mv;
  }
`;

const FILL_FRAG = `
  varying vec3 vN;
  varying vec3 vVP;
  varying vec3 vCol;
  uniform vec3 uSun;
  uniform vec3 uShade;
  uniform vec3 uMid;
  uniform vec3 uLight;
  uniform vec3 uRim;
  uniform float uRimK;
  uniform float uFlat;
  ${FOG}
  void main() {
    vec3 N = normalize(vN);
    if (!gl_FrontFacing) N = -N;
    vec3 L = normalize((viewMatrix * vec4(uSun, 0.0)).xyz);
    vec3 V = normalize(-vVP);
    float ndl = dot(N, L);
    float b1 = smoothstep(-0.015, 0.015, ndl + 0.08);
    float b2 = smoothstep(-0.015, 0.015, ndl - 0.6);
    vec3 col = vCol * mix(uShade, uMid, b1);
    col = mix(col, vCol * uLight, b2);
    float fr = 1.0 - max(dot(N, V), 0.0);
    float rim = smoothstep(0.66, 0.7, fr) * smoothstep(-0.25, 0.2, ndl);
    col = mix(col, uRim * (0.55 + 0.45 * vCol), rim * uRimK);
    col = mix(col, vCol, uFlat);
    col = haze(col, vVP);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const LINE_VERT = `
  ${VERT_COMMON}
  uniform float uThick;
  uniform vec2 uPx;
  void main() {
    vec3 nv = instNormal();
    vec4 mv = instView();
    vVP = mv.xyz;
    vCol = vec3(1.0);
    vN = nv;
    vec4 clip = projectionMatrix * mv;
    float l = length(nv.xy);
    vec2 dir = l > 1e-4 ? nv.xy / l : vec2(0.0);
    dir *= smoothstep(0.0, 0.3, l);
    float px = clamp(uThick * projectionMatrix[1][1] * 960.0 / max(clip.w, 0.01), uPx.x, uPx.y);
    clip.xy += dir * px * vec2(2.0 / 1080.0, 2.0 / 1920.0) * clip.w;
    gl_Position = clip;
  }
`;

const LINE_FRAG = `
  varying vec3 vVP;
  uniform vec3 uInk;
  ${FOG}
  void main() {
    gl_FragColor = vec4(haze(uInk, vVP), 1.0);
    #include <colorspace_fragment>
  }
`;

const base = () => ({
  uSun: {value: new THREE.Vector3(...SUN)},
  uShade: {value: LOOK.shade},
  uMid: {value: LOOK.mid},
  uLight: {value: LOOK.light},
  uRim: {value: LOOK.rim},
  uRimK: {value: 1},
  uFlat: {value: 0},
  uFog: {value: LOOK.fog},
  uFogD: {value: 0.012},
  uColor: {value: new THREE.Color('#ffffff')},
});

export type FillOpts = {color?: string; inst?: boolean; vertexColors?: boolean; rim?: number; flat?: number; side?: THREE.Side; fog?: number};
export const fillMat = (o: FillOpts = {}) => {
  const m = new THREE.ShaderMaterial({
    uniforms: base(),
    vertexShader: FILL_VERT,
    fragmentShader: FILL_FRAG,
    defines: o.inst ? {INST_COL: ''} : {},
    vertexColors: Boolean(o.vertexColors),
    side: o.side ?? THREE.FrontSide,
  });
  if (o.color) m.uniforms.uColor.value = new THREE.Color(o.color);
  if (o.rim !== undefined) m.uniforms.uRimK.value = o.rim;
  if (o.flat !== undefined) m.uniforms.uFlat.value = o.flat;
  if (o.fog !== undefined) m.uniforms.uFogD.value = o.fog;
  return m;
};

export const lineMat = (thick = 0.014, min = 1.3, max = 5, fog?: number) => {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uInk: {value: LOOK.ink},
      uFog: {value: LOOK.fog},
      uFogD: {value: fog ?? 0.012},
      uThick: {value: thick},
      uPx: {value: new THREE.Vector2(min, max)},
      uColor: {value: new THREE.Color('#ffffff')},
    },
    vertexShader: LINE_VERT,
    fragmentShader: LINE_FRAG,
    side: THREE.BackSide,
  });
  return m;
};

// ---------------------------------------------------------------- part batches
export type Kind = 'sph' | 'cyl' | 'tap' | 'cap' | 'cone' | 'box';
const GEO: Record<Kind, () => THREE.BufferGeometry> = {
  sph: () => new THREE.SphereGeometry(1, 18, 12),
  cyl: () => new THREE.CylinderGeometry(1, 1, 1, 14, 1),
  tap: () => new THREE.CylinderGeometry(0.72, 1, 1, 14, 1),
  cap: () => new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI * 0.56),
  cone: () => new THREE.ConeGeometry(1, 1, 12, 1),
  box: () => new THREE.BoxGeometry(1, 1, 1),
};
export const KINDS = Object.keys(GEO) as Kind[];

export type Part = {k: Kind; m: THREE.Matrix4; c: THREE.Color; line: boolean};

const colorCache = new Map<string, THREE.Color>();
// bright colours above 1 stay light even in the shade (dust, breath)
export const DUST_A = 'rgb:1.02,0.82,0.56';
export const DUST_B = 'rgb:0.88,0.69,0.48';
export const col = (hex: string) => {
  let c = colorCache.get(hex);
  if (!c) {
    if (hex.startsWith('rgb:')) {
      const [r, g, b] = hex.slice(4).split(',').map(Number);
      c = new THREE.Color(r, g, b);
    } else c = new THREE.Color(hex);
    colorCache.set(hex, c);
  }
  return c;
};

const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _y = new THREE.Vector3(0, 1, 0);
const _m3 = new THREE.Matrix4();

// collects the parts of everything in a shot; root transforms are applied by the caller (see rig.ts)
export class Parts {
  list: Part[] = [];
  root = new THREE.Matrix4();
  private push(k: Kind, m: THREE.Matrix4, hex: string, line: boolean) {
    this.list.push({k, m: m.premultiply(this.root), c: col(hex), line});
  }
  // ellipsoid / scaled part at a point, optional rotation (euler XYZ)
  at(k: Kind, p: V3, s: V3 | number, hex: string, rot?: V3, line = true) {
    _p.set(p[0], p[1], p[2]);
    if (rot) _q.setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ'));
    else _q.identity();
    if (typeof s === 'number') _s.set(s, s, s);
    else _s.set(s[0], s[1], s[2]);
    this.push(k, new THREE.Matrix4().compose(_p, _q, _s), hex, line);
  }
  // limb between two points
  seg(k: Kind, a: V3, b: V3, r: number, hex: string, line = true, r2?: number) {
    _a.set(a[0], a[1], a[2]);
    _b.set(b[0], b[1], b[2]);
    const len = _a.distanceTo(_b) || 1e-4;
    _p.copy(_a).add(_b).multiplyScalar(0.5);
    _q.setFromUnitVectors(_y, _b.clone().sub(_a).divideScalar(len));
    _s.set(r, len, r2 ?? r);
    this.push(k, new THREE.Matrix4().compose(_p, _q, _s), hex, line);
  }
  // scaled part in an explicit frame (x, y, z unit axes)
  basis(k: Kind, c: V3, x: V3, y: V3, z: V3, s: V3, hex: string, line = true) {
    _m3.makeBasis(new THREE.Vector3(x[0], x[1], x[2]), new THREE.Vector3(y[0], y[1], y[2]), new THREE.Vector3(z[0], z[1], z[2]));
    _q.setFromRotationMatrix(_m3);
    _p.set(c[0], c[1], c[2]);
    _s.set(s[0], s[1], s[2]);
    this.push(k, new THREE.Matrix4().compose(_p, _q, _s), hex, line);
  }
  // ellipsoid stretched from a to b (length axis), width rx across `side`, depth rz
  ell(k: Kind, a: V3, b: V3, rx: number, rz: number, side: V3, hex: string, line = true, pad = 0) {
    _a.set(a[0], a[1], a[2]);
    _b.set(b[0], b[1], b[2]);
    const len = _a.distanceTo(_b) || 1e-4;
    const y = _b.clone().sub(_a).divideScalar(len);
    const x = new THREE.Vector3(side[0], side[1], side[2]);
    x.addScaledVector(y, -x.dot(y)).normalize();
    const z = new THREE.Vector3().crossVectors(x, y);
    _m3.makeBasis(x, y, z);
    _q.setFromRotationMatrix(_m3);
    _p.copy(_a).add(_b).multiplyScalar(0.5);
    _s.set(rx, len / 2 + pad, rz);
    this.push(k, new THREE.Matrix4().compose(_p, _q, _s), hex, line);
  }
}

const MAX = 6000;
export class Batch {
  group = new THREE.Group();
  fills = {} as Record<Kind, THREE.InstancedMesh>;
  lines = {} as Record<Kind, THREE.InstancedMesh>;
  cols = {} as Record<Kind, THREE.InstancedBufferAttribute>;
  constructor(thick = 0.014, minPx = 1.3, maxPx = 5, tone?: {shade: THREE.Vector3; mid: THREE.Vector3; light: THREE.Vector3}) {
    for (const k of KINDS) {
      const g = GEO[k]();
      const attr = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3);
      attr.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('aCol', attr);
      const fm = fillMat({inst: true});
      if (tone) {
        fm.uniforms.uShade.value = tone.shade;
        fm.uniforms.uMid.value = tone.mid;
        fm.uniforms.uLight.value = tone.light;
      }
      const f = new THREE.InstancedMesh(g, fm, MAX);
      const l = new THREE.InstancedMesh(GEO[k](), lineMat(thick, minPx, maxPx), MAX);
      for (const m of [f, l]) {
        m.frustumCulled = false;
        m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        m.count = 0;
      }
      l.renderOrder = -1;
      this.fills[k] = f;
      this.lines[k] = l;
      this.cols[k] = attr;
      this.group.add(l, f);
    }
  }
  set(parts: Part[]) {
    const n = {} as Record<Kind, number>;
    const nl = {} as Record<Kind, number>;
    for (const k of KINDS) n[k] = nl[k] = 0;
    for (const p of parts) {
      const i = n[p.k]++;
      if (i >= MAX) continue;
      this.fills[p.k].setMatrixAt(i, p.m);
      this.cols[p.k].setXYZ(i, p.c.r, p.c.g, p.c.b);
      if (p.line) this.lines[p.k].setMatrixAt(nl[p.k]++, p.m);
    }
    for (const k of KINDS) {
      this.fills[k].count = Math.min(MAX, n[k]);
      this.lines[k].count = Math.min(MAX, nl[k]);
      this.fills[k].instanceMatrix.needsUpdate = true;
      this.lines[k].instanceMatrix.needsUpdate = true;
      this.cols[k].needsUpdate = true;
    }
  }
}
