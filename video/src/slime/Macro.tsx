import React, {useMemo} from 'react';
import {random} from 'remotion';
import {BufferAttribute, CanvasTexture, Color, IcosahedronGeometry, PlaneGeometry, RepeatWrapping, SRGBColorSpace} from 'three';
import {V3} from './cues';
import {Cyl, GLASS, Ico, Material} from './parts';
import {useTarget} from './Hall';

// Macro world: 1 unit here is a fraction of a millimetre on Gleb's desk.
export const MACRO_X = 200;
const GRID = 16;
const SEG = 160;

// brushed steel: thin horizontal streaks
const useBrushed = () =>
  useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 512;
    const c = cv.getContext('2d')!;
    c.fillStyle = '#d0d4d8';
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1400; i++) {
      const g = 170 + Math.floor(random(`br-${i}`) * 70);
      c.fillStyle = `rgba(${g},${g + 3},${g + 6},0.55)`;
      c.fillRect(random(`brx-${i}`) * 512 - 100, random(`bry-${i}`) * 512, 60 + random(`brl-${i}`) * 260, 1);
    }
    const tex = new CanvasTexture(cv);
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.repeat.set(3, 3);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, []);

// height of the steel at distance r from the centre of the pit (radius R, depth D)
export const surfaceY = (r: number, R: number, D: number) => {
  if (R <= 0 || r >= R) return 0;
  const q = r / R;
  return -D * (1 - q * q) * (1 - q * q * 0.35);
};

const Surface: React.FC<{R: number; D: number}> = ({R, D}) => {
  const map = useBrushed();
  const geo = useMemo(() => {
    const g = new PlaneGeometry(GRID, GRID, SEG, SEG);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const base = new Color('#8f989f');
    const mirror = new Color('#e4ebf1');
    const c = new Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const r = Math.hypot(x, z);
      const edge = Math.abs(x) > GRID / 2 - 0.01 || Math.abs(z) > GRID / 2 - 0.01;
      const inPit = R > 0 && r < R;
      const jitter = edge || inPit ? 0 : random(`sv-${i}`) * 0.014;
      pos.setY(i, surfaceY(r, R, D) + jitter);
      const n = 0.92 + random(`sc-${i}`) * 0.1;
      c.copy(inPit ? mirror : base).multiplyScalar(n);
      if (R > 0 && r >= R && r < R + 0.35) c.multiplyScalar(0.7 + 0.3 * ((r - R) / 0.35)); // dusty dark ring
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [R, D]);
  const far = 120;
  const outer: [number, number, number, number][] = [
    [0, -(GRID / 2 + far / 2), far * 2 + GRID, far],
    [0, GRID / 2 + far / 2, far * 2 + GRID, far],
    [-(GRID / 2 + far / 2), 0, far, GRID],
    [GRID / 2 + far / 2, 0, far, GRID],
  ];
  return (
    <group>
      <mesh geometry={geo} receiveShadow castShadow>
        <Material m={{color: '#ffffff', metal: 0.8, rough: 0.34, env: 1.0, map, vertexColors: true}} />
      </mesh>
      {outer.map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w, d]} />
          <Material m={{color: '#8f989f', metal: 0.8, rough: 0.34, env: 1.0, map}} />
        </mesh>
      ))}
    </group>
  );
};

// The copier: a faceted graphite grain, a little irregular, no legs, no lights.
export const Grain: React.FC<{position: V3; rotation?: V3; scale?: number}> = ({position, rotation, scale = 1}) => {
  const geo = useMemo(() => {
    const g = new IcosahedronGeometry(0.3, 0);
    const pos = g.attributes.position as BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
      const f = 0.85 + random(`grain-${key}`) * 0.3;
      pos.setXYZ(i, pos.getX(i) * f, pos.getY(i) * f * 0.85, pos.getZ(i) * f);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
      <Material m={{color: '#454b52', metal: 0.65, rough: 0.3, env: 1.2}} />
    </mesh>
  );
};

const DustRing: React.FC<{R: number; D: number}> = ({R, D}) => {
  const bits = useMemo(
    () =>
      Array.from({length: 170}).map((_, i) => {
        const a = random(`dr-a-${i}`) * Math.PI * 2;
        const r = R - 0.12 + Math.pow(random(`dr-r-${i}`), 1.6) * 0.5;
        const s = 0.012 + random(`dr-s-${i}`) * 0.035;
        return {p: [Math.cos(a) * r, surfaceY(r, R, D) + s * 0.6, Math.sin(a) * r] as V3, s, rot: random(`dr-t-${i}`) * 6};
      }),
    [R, D],
  );
  return (
    <group>
      {bits.map((b, i) => (
        <Ico key={i} r={b.s} position={b.p} rotation={[b.rot, b.rot * 2, 0]} m={{color: '#5d646b', metal: 0.5, rough: 0.5, env: 0.8}} shadow={false} />
      ))}
    </group>
  );
};

// A speck of household dust, huge next to the grain: a soft tangle of thin fibres and fluff.
const DustMote: React.FC<{position: V3}> = ({position}) => {
  const fibres = useMemo(
    () =>
      Array.from({length: 70}).map((_, i) => {
        const yaw = random(`dm-y-${i}`) * Math.PI * 2;
        const tilt = (random(`dm-t-${i}`) - 0.5) * 0.9;
        return {
          len: 0.5 + random(`dm-l-${i}`) * 1.3,
          rot: [Math.PI / 2 + tilt, yaw, 0] as V3,
          bend: (random(`dm-b-${i}`) - 0.5) * 1.2,
          off: [(random(`dm-ox-${i}`) - 0.5) * 1.1, (random(`dm-oy-${i}`) - 0.5) * 0.5, (random(`dm-oz-${i}`) - 0.5) * 1.1] as V3,
        };
      }),
    [],
  );
  const FLUFF = {color: '#b4b8bc', rough: 0.95};
  return (
    <group position={position}>
      {fibres.map((f, i) => (
        <group key={i} position={f.off} rotation={f.rot}>
          <Cyl r={0.009} h={f.len / 2} seg={4} position={[0, f.len / 4, 0]} m={FLUFF} />
          <group position={[0, f.len / 2, 0]} rotation={[f.bend, 0, f.bend * 0.5]}>
            <Cyl r={0.008} h={f.len / 2} seg={4} position={[0, f.len / 4, 0]} m={FLUFF} />
          </group>
        </group>
      ))}
      {Array.from({length: 14}).map((_, i) => (
        <Ico
          key={i}
          r={0.12 + random(`dm-r-${i}`) * 0.2}
          detail={1}
          scale={[1, 0.55, 1]}
          position={[(random(`dm-bx-${i}`) - 0.5) * 1.0, (random(`dm-by-${i}`) - 0.5) * 0.35, (random(`dm-bz-${i}`) - 0.5) * 1.0]}
          m={{...FLUFF, color: '#a7abb0'}}
        />
      ))}
    </group>
  );
};

export type MacroState = {pitR: number; pitD: number; grains: V3[]; scale: number; dust?: boolean; jar?: boolean; ring?: boolean};

export const macroState = (shot: string): MacroState => {
  if (shot === 'pit' || shot === 'rim' || shot === 'bottom') return {pitR: 1.2, pitD: 0.4, grains: [[0.05, -0.4 + 0.11, 0.02]], scale: 0.5, ring: true};
  if (shot === 'shock')
    return {pitR: 2.4, pitD: 0.6, grains: [[-0.3, -0.6 + 0.17, 0.06], [0.29, -0.6 + 0.17, -0.05]], scale: 0.8, jar: true, ring: true};
  if (shot === 'dust') return {pitR: 0, pitD: 0, grains: [[0, 0.22, 0]], scale: 1, dust: true};
  return {pitR: 0, pitD: 0, grains: [[0, 0.22, 0]], scale: 1};
};

export const Macro: React.FC<{v: number; shot: string; state?: MacroState; children?: React.ReactNode}> = ({v, shot, state, children}) => {
  const st = state ?? macroState(shot);
  const target = useTarget([MACRO_X, 0, 0]);
  return (
    <group position={[MACRO_X, 0, 0]}>
      <Surface R={st.pitR} D={st.pitD} />
      {st.ring ? <DustRing R={st.pitR} D={st.pitD} /> : null}
      {st.grains.map((g, i) => (
        <Grain key={i} position={g} scale={st.scale} rotation={[0.3 + i * 1.1, 0.8 + i * 2.3 + (shot === 'microscope' ? v * 0.05 : 0), 0.2]} />
      ))}
      {st.dust ? <DustMote position={[2.5, 0.55, -1.3]} /> : null}
      {st.jar ? (
        <>
          <Cyl r={2.75} h={7} seg={48} open position={[0, 3.5, 0]} m={{...GLASS, opacity: 0.1}} />
          <Cyl r={2.76} h={0.06} seg={48} open position={[0, 0.03, 0]} m={{...GLASS, opacity: 0.35}} />
        </>
      ) : null}
      {children}
      <ambientLight intensity={0.1} color="#9fb4c8" />
      <hemisphereLight color="#d5e3f2" groundColor="#11161b" intensity={0.3} />
      <spotLight
        position={[-5, 9, 4]}
        target={target}
        color="#eef4ff"
        intensity={160}
        distance={30}
        angle={0.45}
        penumbra={0.6}
        decay={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
      />
      <pointLight position={[4, 2.5, -5]} color="#6f9fd6" intensity={14} distance={16} decay={2} />
    </group>
  );
};
