import {useLayoutEffect, useMemo, useRef} from 'react';
import {useThree} from '@react-three/fiber';
import {
  BufferGeometry, DataTexture, DepthTexture, Float32BufferAttribute, HalfFloatType,
  LinearFilter, Mesh, NoBlending, Object3D, OrthographicCamera, PerspectiveCamera,
  Scene, ShaderMaterial, UnsignedIntType, Vector2, WebGLRenderTarget,
} from 'three';

type Point = [number, number, number];

export function ClayCamera({eye, target, fov = 36}: {
  eye: Point;
  target: Point;
  /** Vertical angle of view in degrees. */
  fov?: number;
}) {
  const camera = useThree((state) => state.camera);
  const [x, y, z] = eye;
  const [tx, ty, tz] = target;
  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) {
      throw new Error('ClayCamera needs a perspective ThreeCanvas camera');
    }
    camera.position.set(x, y, z);
    camera.lookAt(tx, ty, tz);
    camera.fov = fov;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }, [camera, x, y, z, tx, ty, tz, fov]);
  return null;
}

export function ClayEnvironment({
  sky = '#eed7af', haze = sky, near = 7.5, far = 26,
}: {
  sky?: string;
  haze?: string;
  near?: number;
  far?: number;
}) {
  return <>
    <color attach="background" args={[sky]} />
    <fog attach="fog" args={[haze, near, far]} />
  </>;
}

/** Ratios are tuned for standard dielectric materials and pale painted scenery. */
export function ClayLighting({
  quality = 'final', center = [0, 0.8, -1.4], coverage = 7,
  key = '#fff0d4', rim = '#ffd5a1', skyFill = '#e1eeff', bounce = '#bb9278',
}: {
  quality?: 'draft' | 'final';
  center?: Point;
  /** Half-width of the directional shadow camera in set units. */
  coverage?: number;
  key?: string;
  rim?: string;
  skyFill?: string;
  bounce?: string;
}) {
  const [x, y, z] = center;
  const aim = useMemo(() => new Object3D(), []);
  const resolution = quality === 'final' ? 1024 : 512;
  return <>
    <primitive object={aim} position={center} />
    <hemisphereLight args={[skyFill, bounce, 1.22]} />
    <directionalLight position={[x - 5, y + 8, z + 5]} target={aim}
      color={key} intensity={2.15} castShadow
      shadow-mapSize-width={resolution} shadow-mapSize-height={resolution}
      shadow-radius={quality === 'final' ? 2.5 : 1.25} shadow-intensity={0.88}
      shadow-bias={-0.00016} shadow-normalBias={0.018}>
      <orthographicCamera attach="shadow-camera"
        args={[-coverage, coverage, coverage, -coverage, 0.35, 18 + coverage]} />
    </directionalLight>
    <directionalLight target={aim} position={[x + 4, y + 5, z - 5]} color={rim} intensity={1.1} />
  </>;
}

// A reusable radial contact mask. No canvas, asset request or frame history.
function makeContactMask() {
  const size = 64;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const r = Math.hypot((2 * x + 1) / size - 1, (2 * y + 1) / size - 1);
      const weight = Math.max(0, 1 - r * r);
      const i = 4 * (y * size + x);
      pixels[i] = pixels[i + 1] = pixels[i + 2] = Math.round(255 * weight ** 3);
      pixels[i + 3] = 255;
    }
  }
  const texture = new DataTexture(pixels, size, size);
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
const contactMask = makeContactMask();

/** Flat local ground, +Y up. Width and depth are full diameters. */
export function ClayContactShadow({
  position = [0, 0.004, 0], size = [1, 0.6], opacity = 0.26, color = '#483232',
}: {
  position?: Point;
  size?: [number, number];
  opacity?: number;
  color?: string;
}) {
  return <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={size} />
    <meshBasicMaterial color={color} alphaMap={contactMask} transparent opacity={opacity}
      depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
  </mesh>;
}

// Fixed disk pattern gives each exposure the same aperture, including when seeking.
const offsets = Array.from({length: 8}, (_, i) => {
  const radius = Math.sqrt((i + 0.5) / 8);
  const angle = i * Math.PI * (3 - Math.sqrt(5));
  const v = new Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius);
  return [v, v.clone().negate()];
}).flat();

const focusFragment = `
  uniform sampler2D colorImage, depthImage;
  uniform float nearClip, farClip, focusDistance, focalBand;
  uniform vec2 radiusUv, disk[16];
  varying vec2 vUv;

  float distanceAt(vec2 uv) {
    float d = texture2D(depthImage, uv).r;
    return nearClip * farClip / (farClip - d * (farClip - nearClip));
  }
  void main() {
    float z = distanceAt(vUv);
    // Approximate circle of confusion, with a small tack-sharp band for the puppet.
    float coc = clamp(2.4 * (abs(z - focusDistance) - focalBand) / z, 0.0, 1.0);
    vec4 sum = texture2D(colorImage, vUv);
    float count = 1.0;
    if (coc > 0.015) {
      for (int i = 0; i < 16; ++i) {
        vec2 uv = vUv + disk[i] * radiusUv * coc;
        // Prevent a nearer sharp silhouette from bleeding into far bokeh.
        float w = smoothstep(-0.24, -0.02, distanceAt(uv) - z);
        sum += w * texture2D(colorImage, uv);
        count += w;
      }
    }
    gl_FragColor = sum / count;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * Single-canvas depth of field for a perspective WebGL scene. Mount one instance
 * inside ThreeCanvas for opaque shots. maxBlurPx is a radius at 1080 px width.
 */
export function ClayFocus({distance, band = 0.35, maxBlurPx = 6}: {
  distance: number;
  band?: number;
  maxBlurPx?: number;
}) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const settings = useRef({distance, band, maxBlurPx});
  useLayoutEffect(() => {
    settings.current = {distance, band, maxBlurPx};
  }, [distance, band, maxBlurPx]);

  useLayoutEffect(() => {
    if (!gl.extensions.has('EXT_color_buffer_float')) return;
    const depth = new DepthTexture(1, 1, UnsignedIntType);
    const target = new WebGLRenderTarget(1, 1, {
      type: HalfFloatType, depthTexture: depth, samples: Math.min(2, gl.capabilities.maxSamples),
    });
    const uniforms = {
      colorImage: {value: target.texture}, depthImage: {value: depth},
      nearClip: {value: 0.1}, farClip: {value: 100},
      focusDistance: {value: 1}, focalBand: {value: 0.35},
      radiusUv: {value: new Vector2()}, disk: {value: offsets},
    };
    const material = new ShaderMaterial({
      uniforms, blending: NoBlending, depthTest: false, depthWrite: false,
      vertexShader: `varying vec2 vUv;
        void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy,0.,1.); }`,
      fragmentShader: focusFragment,
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute([-1,-1,0, 3,-1,0, -1,3,0], 3));
    const triangle = new Mesh(geometry, material);
    triangle.frustumCulled = false;
    const screenScene = new Scene();
    screenScene.add(triangle);
    const screenCamera = new OrthographicCamera();
    const size = new Vector2();
    const original = gl.render;
    // ThreeCanvas owns frame submission. Wrap just its main, on-screen render
    // so stills and scrubs run both passes on that very same submission.
    gl.render = function (input, camera) {
      if (input !== scene || this.getRenderTarget() || !(camera instanceof PerspectiveCamera)) {
        original.call(this, input, camera);
        return;
      }
      this.getDrawingBufferSize(size);
      target.setSize(size.x, size.y);
      const {distance: d, band: b, maxBlurPx: r} = settings.current;
      uniforms.focusDistance.value = d;
      uniforms.focalBand.value = b;
      uniforms.nearClip.value = camera.near;
      uniforms.farClip.value = camera.far;
      uniforms.radiusUv.value.set(r / 1080, r * size.x / (1080 * size.y));
      this.setRenderTarget(target);
      try {
        original.call(this, input, camera);
      } finally {
        this.setRenderTarget(null);
      }
      original.call(this, screenScene, screenCamera);
    };
    return () => {
      gl.render = original;
      target.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [gl, scene]);
  return null;
}
