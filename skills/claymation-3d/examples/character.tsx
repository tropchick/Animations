import {useEffect, useMemo} from 'react';
import {CatmullRomCurve3, LatheGeometry, TubeGeometry, Vector2, Vector3} from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {ClayMaterial, ClayPiece} from './surface';

type Point = [number, number, number];
type Side = -1 | 1;
const sides: Side[] = [-1, 1];
const tau = Math.PI * 2;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const fract = (n: number) => n - Math.floor(n);

export interface ClayPalette {
  skin: string;
  cheek: string;
  hair: string;
  coat: string;
  cap: string;
  scarf: string;
  trousers: string;
  boots: string;
  bag: string;
}

const courier: ClayPalette = {
  skin: '#e8a97d', cheek: '#d38768', hair: '#502e29', coat: '#287977',
  cap: '#b74430', scarf: '#e7ad44', trousers: '#36485a', boots: '#65413b', bag: '#aa6443',
};

// Lay thin ropes on a larger sculpt. Bake each collection into one static mesh.
function ropes(paths: Point[][], radius: number) {
  const tubes = paths.map(path => new TubeGeometry(
    new CatmullRomCurve3(path.map(p => new Vector3(...p))), Math.max(8, path.length * 3), radius, 6, false,
  ));
  const merged = mergeGeometries(tubes);
  tubes.forEach(t => t.dispose());
  return merged;
}

const brow = ropes([[[-0.077, -0.01, -0.006], [-0.038, 0.011, 0.003], [0.026, 0.015, 0.005], [0.074, 0, -0.007]]], 0.017);
const smile = ropes([[[-0.109, 0.013, -0.019], [-0.064, -0.004, -0.004], [0.02, -0.013, 0], [0.085, -0.001, -0.012], [0.114, 0.017, -0.023]]], 0.010);
const strap = ropes([[[-0.198, 1.108, -0.012], [-0.156, 1.077, 0.130], [0.003, 0.957, 0.202], [0.163, 0.822, 0.175], [0.244, 0.716, 0.121]]], 0.024);
const flap = ropes([[[-0.102, 0.04, 0.054], [-0.063, 0.018, 0.064], [0, -0.012, 0.069], [0.066, 0.014, 0.062], [0.106, 0.042, 0.052]]], 0.006);
const laces = ropes([0, 1].map(i => [[-0.048, 0.129 - i * 0.013, 0.058 + i * 0.032], [0.003, 0.141 - i * 0.014, 0.059 + i * 0.032], [0.048, 0.127 - i * 0.013, 0.058 + i * 0.032]]), 0.007);

// The brim and crown share one closed profile. Its ribs are sculpted into the
// radius so that the underside stays continuous at glancing camera angles.
function knittedCap() {
  const profile = [
    [0.0001,0.197], [0.244,0.197], [0.313,0.202], [0.334,0.216],
    [0.342,0.232], [0.344,0.252], [0.34,0.275], [0.327,0.285],
    [0.317,0.288], [0.317,0.303], [0.302,0.334], [0.268,0.375],
    [0.218,0.409], [0.151,0.438], [0.076,0.455], [0.0001,0.46],
  ];
  const rings = profile.length;
  const geometry = new LatheGeometry(profile.map(([r,h]) => new Vector2(r,h)), 160);
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const j = i % rings, a = tau * Math.floor(i / rings) / 160;
    const [r,h] = profile[j];
    const rib = [0,0,0.2,0.64,1,1,0.75,0.22,0][j] ?? 0;
    const crown = j > 8 ? Math.sin(Math.PI * (j - 8) / (rings - 9)) : 0;
    const fold = rib * 0.0048 * Math.cos(32 * a + (h - 0.23) * 9)
      + crown * 0.006 * Math.cos(7 * a + h * 4) + r * 0.011 * Math.sin(3 * a);
    const lean = clamp01((h - 0.276) / 0.184);
    positions.setXYZ(i, Math.sin(a) * (r + fold) - 0.026 * lean,
      h + 0.008 * (r / 0.344) * Math.sin(a + 0.3), 0.83 * Math.cos(a) * (r + fold) - 0.014 * lean);
  }
  geometry.computeVertexNormals();
  return geometry;
}
const beanie = knittedCap();

function Cord({geometry, color}: {geometry: TubeGeometry | ReturnType<typeof ropes>; color: string}) {
  return <mesh geometry={geometry} castShadow><ClayMaterial color={color} relief={0.42}/></mesh>;
}

interface EyeProps {
  look?: [number, number];
  blink?: number;
  reaction?: number;
  lid?: string;
  simple?: boolean;
}

/** Eye assembly origin sits between the eyes. +Z points towards the viewer. */
export function ClayEyes({look = [0, 0], blink = 0, reaction = 0, lid = '#cb8569', simple = false}: EyeProps) {
  const aperture = (1 - 0.97 * clamp01(blink)) * (1 + 0.13 * reaction);
  const gazeX = Math.max(-1, Math.min(1, look[0])) * 0.033;
  const gazeY = Math.max(-1, Math.min(1, look[1])) * 0.042;
  return <>{sides.map(side => <group key={side} position={[side * 0.112, side * 0.004, 0]} rotation={[0, side * 0.23, -side * 0.045]}>
    <group scale={[1, aperture, 1]}>
      {!simple && <ClayPiece size={[0.193, 0.215, 0.108]} position={[0, -0.006, -0.013]} color={lid}/>}
      <ClayPiece size={[0.167, 0.198, 0.101]} color="#f7edcf" relief={0.12}/>
      <group position={[gazeX, gazeY, 0.045]}>
        <ClayPiece size={[0.078, 0.09, 0.028]} color="#382c29" relief={0.08}/>
        {!simple && <ClayPiece size={[0.019, 0.023, 0.009]} position={[-0.014, 0.021, 0.013]} color="#ffecd0" relief={0}/>}
      </group>
    </group>
  </group>)}</>;
}

function Head({p, time, seed, look, reaction, hero}: {
  p: ClayPalette; time: number; seed: number; look: [number, number]; reaction: number; hero: boolean;
}) {
  const eyePhase = fract((time + 0.177 * seed) / 3.73);
  const blink = (1 - Math.min(1, Math.abs(eyePhase - 0.64) / 0.03)) * (1 - reaction);
  return <>
    <ClayPiece shape="pear" size={[0.636, 0.585, 0.517]} scale={[1, 1, 1.04]} seed={seed} color={p.skin}/>
    {sides.map(side => <group key={side}>
      <ClayPiece position={[side * 0.302, 0.006, -0.005]} size={[0.115, 0.161, 0.116]} rotation={[0, 0, -side * 0.19]} color={p.skin} seed={seed + 2}/>
      {hero && <ClayPiece position={[side * 0.333, 0.006, 0.036]} size={[0.05, 0.085, 0.043]} color={p.cheek}/>}
      <ClayPiece position={[side * 0.266, 0.103, -0.021]} size={[0.103, 0.208, 0.151]} rotation={[0.19, 0, side * 0.21]} color={p.hair}/>
      {hero && <group position={[side * 0.209, -0.044, 0.194]} rotation={[0, side * 0.62, side * 0.06]}>
        <ClayPiece size={[0.159, 0.087, 0.039]} color={p.cheek} relief={0.55}/>
        {[[0.038, -0.005], [-0.019, 0.017], [-0.035, -0.013]].map(([x,y],i) =>
          <ClayPiece key={i} size={[0.014, 0.011, 0.008]} position={[x * side, y, 0.018]} color="#965943" relief={0}/>)}
      </group>}
      <group position={[side * 0.113, 0.147 + reaction * (side === 1 ? 0.046 : 0.023), 0.207 - 0.009 * reaction]}
        rotation={[0, side * 0.37, side * (0.03 - 0.24 * reaction)]}><Cord geometry={brow} color={p.hair}/></group>
    </group>)}
    <group position={[0, 0.061, 0.233]}><ClayEyes look={look} reaction={reaction} blink={blink} lid={p.cheek} simple={!hero}/></group>
    <ClayPiece size={[0.142, 0.135, 0.157]} position={[0, -0.016, 0.277]} rotation={[0.16, 0, -0.09]} color={p.skin} seed={seed + 7}/>
    <group position={[0.007, -0.119 - reaction * 0.008, 0.278]} rotation={[0.38, 0, -0.032]}>
      <group scale={[1 - 0.68 * reaction, 1, 1]}><Cord geometry={smile} color="#763d35"/></group>
      {reaction > 0.02 && <ClayPiece size={[0.077, 0.082 * reaction, 0.018]} position={[0.002, -0.004, 0.003]} color="#763d35"/>}
    </group>
    {/* The beanie is pressed over the hair, with an oblique brim and an offset pom. */}
    <group rotation={[-0.055, 0, -0.115]}>
      <ClayPiece size={[0.57, 0.24, 0.437]} position={[0, 0.177, -0.034]} color={p.hair}/>
      {hero && <>
        <ClayPiece size={[0.154, 0.174, 0.083]} position={[-0.185, 0.173, 0.151]} rotation={[0.45, -0.48, -0.7]} color={p.hair}/>
        <ClayPiece size={[0.131, 0.097, 0.078]} position={[-0.105, 0.193, 0.189]} rotation={[0.3, -0.35, 0.34]} color={p.hair}/>
      </>}
      <mesh castShadow receiveShadow geometry={beanie}><ClayMaterial color={p.cap} relief={0.65}/></mesh>
      <ClayPiece size={[0.097, 0.077, 0.092]} position={[-0.031, 0.46, -0.022]} seed={seed + 5} color={p.cap}/>
    </group>
  </>;
}

type Gait = 'walk' | 'run' | 'idle';
export const CLAY_STRIDE = {walk: 0.78, run: 1.10} as const;

// A linear backward stance cancels the root's forward displacement on the floor.
// Swing has the same end velocities as stance, avoiding a snap at contact.
function footAt(phase: number, stride: number, duty: number, lift: number) {
  const p = fract(phase);
  if (p < duty) return {z: stride * (0.5 * duty - p), lift: 0, pitch: 0};
  const u = (p - duty) / (1 - duty);
  const arc = Math.sin(Math.PI * u);
  const ease = u * u * (3 - 2 * u);
  const tangent = u * (1 - u) * (1 - 2 * u);
  return {
    z: stride * (duty * (ease - 0.5) - (1 - duty) * tangent),
    lift: lift * arc * arc, pitch: 0.29 * Math.sin(tau * u) * arc,
  };
}

export const ClayWalkCycle = (phase: number) => footAt(phase, CLAY_STRIDE.walk, 0.61, 0.105);
export const ClayRunCycle = (phase: number) => footAt(phase, CLAY_STRIDE.run, 0.37, 0.221);

// Slip a continuous trouser leg over the solved armature. Its open ends are
// hidden inside the coat and boot. Slight folds soften the knee and ankle.
function trouser(hip: Point, knee: Point, ankle: Point) {
  const curve = new CatmullRomCurve3([hip, knee, ankle].map(p => new Vector3(...p)));
  const rings = 16, sides = 18;
  const tube = new TubeGeometry(curve, rings, 1, sides, false);
  const positions = tube.getAttribute('position');
  const v = new Vector3(), center = new Vector3();
  for (let j = 0; j <= rings; j++) {
    const u = j / rings;
    curve.getPointAt(u, center);
    const radius = 0.091 - 0.022 * u + 0.007 * Math.sin(Math.PI * u)
      + 0.007 * Math.exp(-((u - 0.88) ** 2) / 0.0018);
    for (let i = 0; i <= sides; i++) {
      const k = j * (sides + 1) + i;
      const fold = 1 + 0.031 * Math.cos(3 * tau * i / sides + u * 8);
      v.fromBufferAttribute(positions, k).sub(center).multiplyScalar(radius * fold).add(center);
      positions.setXYZ(k, v.x, v.y, v.z);
    }
  }
  tube.computeVertexNormals();
  return tube;
}

function Leg({side, phase, run, weight, bounce, p, hero}: {
  side: Side; phase: number; run: boolean; weight: number; bounce: number; p: ClayPalette; hero: boolean;
}) {
  const foot = (run ? ClayRunCycle : ClayWalkCycle)(phase + (side < 0 ? 0.5 : 0));
  const hipX = side * 0.105, hipY = 0.628 + bounce;
  const dy = 0.105 + foot.lift * weight - hipY, dz = foot.z * weight;
  const geometry = useMemo(() => {
    const reach = Math.hypot(dy, dz);
    const kneeOffset = Math.sqrt(Math.max(0, 0.295 ** 2 - (reach / 2) ** 2));
    const knee: Point = [hipX, hipY + dy / 2 + dz / reach * kneeOffset, dz / 2 - dy / reach * kneeOffset];
    return trouser([hipX, hipY, 0], knee, [hipX, hipY + dy, dz]);
  }, [hipX, hipY, dy, dz]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <>
    <mesh geometry={geometry} castShadow receiveShadow><ClayMaterial color={p.trousers} relief={0.6}/></mesh>
    <group position={[hipX, foot.lift * weight, foot.z * weight]} rotation={[foot.pitch * weight, side * 0.052, 0]}>
      <ClayPiece shape="loaf" position={[0, 0.034, 0.035]} size={[0.178, 0.069, 0.293]} color="#473534"/>
      <ClayPiece shape="loaf" position={[0, 0.092, 0.032]} size={[0.176, 0.12, 0.286]} color={p.boots}/>
      <ClayPiece shape="loaf" position={[0, 0.136, -0.007]} size={[0.156, 0.133, 0.149]} color={p.boots}/>
      {hero && <group position={[0, 0.015, 0.004]}><Cord geometry={laces} color="#cfa882"/></group>}
    </group>
  </>;
}

function Arm({side, swing, run, reaction, p, hero}: {
  side: Side; swing: number; run: boolean; reaction: number; p: ClayPalette; hero: boolean;
}) {
  const reach = side === 1 ? reaction : 0;
  return <group position={[0.226 * side, 1.066, 0]} rotation={[-swing - 1.06 * reach, side * 0.13 * reach, side * (0.13 + 0.89 * reach)]}>
    <ClayPiece size={[0.176, 0.304, 0.185]} position={[0, -0.116, 0]} color={p.coat}/>
    <group position={[0, -0.231, 0]} rotation={[-(run ? 0.85 : 0.21) - reach * 0.58, 0, -side * 0.055]}>
      <ClayPiece size={[0.151, 0.222, 0.163]} position={[0, -0.078, 0]} color={p.coat}/>
      {hero && <ClayPiece shape="loaf" size={[0.16, 0.052, 0.163]} position={[0, -0.15, 0]} color={p.coat}/>}
      <ClayPiece size={[0.129, 0.165, 0.115]} position={[0, -0.223, 0.009]} color={p.skin}/>
      {hero && <ClayPiece size={[0.062, 0.094, 0.068]} position={[-side * 0.048, -0.205, 0.044]} rotation={[-0.42, 0, -side * 0.34]} color={p.skin}/>}
    </group>
  </group>;
}

export interface ClayCharacterProps {
  time: number;
  phase?: number;
  gait?: Gait;
  motion?: number;
  reach?: number;
  reaction?: number;
  look?: [number, number];
  seed?: number;
  detail?: 'hero' | 'extra';
  palette?: Partial<ClayPalette>;
}

/** Soles at y=0, forward +Z; wrap in a group to place or scale the puppet. */
export function ClayCharacter({time, phase, gait = 'idle', motion = 1, reaction = 0, look = [0, 0],
  seed = 1, detail = 'hero', reach = reaction, palette}: ClayCharacterProps) {
  const p = {...courier, ...palette};
  const hero = detail === 'hero', run = gait === 'run', surprise = clamp01(reaction);
  const weight = gait === 'idle' ? 0 : clamp01(motion);
  const footWeight = phase !== undefined && gait !== 'idle' ? 1 : weight;
  const cycle = phase ?? time * (run ? 1.75 : 1.02);
  const beat = tau * cycle;
  const strideWave = Math.cos(beat) * weight;
  const bounce = (run ? -0.005 + 0.053 * Math.cos(beat * 2 + 0.22) : 0.022 * Math.cos(beat * 2 + 2.95)) * weight;
  const breath = Math.sin(time * 2.3 + seed) * 0.003;
  const stretch = 1 + bounce * 0.33 + 0.023 * surprise + breath;
  const width = 1 / Math.sqrt(stretch);
  return <>
    {sides.map(side => <Leg key={side} {...{side, phase: cycle, run, weight: footWeight, bounce, p, hero}}/>)}
    <group position={[strideWave * 0.016, bounce + (1 - stretch) * 0.61, 0]} scale={[width, stretch, width]}>
      <group rotation={[(run ? 0.079 : 0.018) * weight - surprise * 0.052, 0.042 * strideWave, -0.018 * strideWave]}>
        <ClayPiece shape="pear" size={[0.521, 0.71, 0.397]} position={[0, 0.866, 0]} color={p.coat} seed={seed}/>
        <ClayPiece size={[0.282, 0.185, 0.253]} position={[0, 1.188, 0]} color={p.skin}/>
        <ClayPiece shape="loaf" size={[0.367, 0.146, 0.321]} position={[0, 1.178, 0.003]} rotation={[0.03, 0.02, -0.07]} color={p.scarf}/>
        {hero && <>
          <ClayPiece shape="loaf" size={[0.095, 0.182, 0.055]} position={[-0.104, 1.085, 0.143]} rotation={[-0.15, -0.24, -0.23]} color={p.scarf}/>
          {[0.915, 0.813, 0.705].map((y,i) => <ClayPiece key={y} size={[0.034, 0.033, 0.021]} position={[-0.041,y,[0.196,0.2,0.189][i]]} color="#d5a769"/>)}
          <Cord geometry={strap} color={p.bag}/>
          <group position={[0.226, 0.703, 0.114]} rotation={[0.044 + 0.095 * Math.sin(beat - 0.8) * weight, 0.51, -0.16]}>
            <ClayPiece shape="slab" size={[0.257, 0.224, 0.124]} color={p.bag}/>
            <ClayPiece shape="slab" size={[0.208, 0.103, 0.025]} position={[-0.013, 0.079, -0.001]} rotation={[0, 0, 0.12]} color="#f6e1ac"/>
            <ClayPiece shape="slab" size={[0.251, 0.127, 0.048]} position={[0,0.032,0.042]} color={p.bag}/>
            <Cord geometry={flap} color="#774b38"/>
            <ClayPiece size={[0.032, 0.033, 0.018]} position={[0, -0.013, 0.071]} color="#dbb661"/>
          </group>
        </>}
        {sides.map(side => <Arm key={side} side={side} swing={-side * strideWave * (run ? 0.74 : 0.49)} run={run} reaction={clamp01(reach)} p={p} hero={hero}/>)}
        <group position={[0, 1.462, 0]} rotation={[-look[1] * 0.14 - surprise * 0.071,
          look[0] * 0.31 - strideWave * 0.031, -0.035 + Math.sin(beat - 0.41) * 0.022 * weight + surprise * 0.12]}>
          <Head p={p} time={time} seed={seed} look={look} reaction={surprise} hero={hero}/>
        </group>
      </group>
    </group>
  </>;
}
