import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Ball, Block, Cyl, Glow, Pill, RBox, mat} from '../bear/kit';
import {Pic} from '../bear/Props';
import {COND} from '../gta/tex';
import {V3, rnd} from '../bear/cues';

// A small town at night: one main street along x (road |z| < 4), a cross street along z at x = 0,
// two-storey houses with yards, the pharmacy and the shop on the corner, the school down the cross street.
// Тихая, 9 is the house at HOUSE (north side, front facing +z).

export const ROAD_W = 8;
export const WALK_W = 2.6;
export const HOUSE: V3 = [-14, 0, -13.2];
export const LAMP_FAR: V3 = [-13.5, 0.14, 4.5]; // lamp post index 5 // the lamp the first one stands under (south side, across from the house)
export const PHARMACY: V3 = [9.5, 0, -10.5];
export const SHOP: V3 = [19, 0, -10.5];
export const SCHOOL: V3 = [-9, 0, 22];
export const CROSS: V3 = [0, 0, 0];

const ASPHALT = '#2c3038';
const WALK = '#5a5d64';
const CURB = '#7a7d84';
const GRASS = '#2c3a2e';

// ---------------------------------------------------------------- ground

export const Ground: React.FC = () => (
  <group>
    <Block position={[0, -0.06, 0]} size={[220, 0.1, 220]} color={GRASS} look={{rough: 1}} />
    {/* main street + cross street */}
    <Block position={[0, -0.005, 0]} size={[200, 0.02, ROAD_W]} color={ASPHALT} look={{rough: 0.75}} />
    <Block position={[0, -0.004, 40]} size={[ROAD_W, 0.02, 80]} color={ASPHALT} look={{rough: 0.75}} />
    {/* sidewalks with curbs */}
    {([1, -1] as const).map((s) => (
      <group key={s}>
        <Block position={[0, 0.07, s * (ROAD_W / 2 + WALK_W / 2)]} size={[200, 0.14, WALK_W]} color={WALK} look={{rough: 0.95}} />
        <Block position={[0, 0.075, s * (ROAD_W / 2 + 0.09)]} size={[200, 0.15, 0.18]} color={CURB} look={{rough: 0.9}} />
      </group>
    ))}
    {/* the cross street cuts the south sidewalk: patch it with asphalt */}
    <Block position={[0, 0.0, ROAD_W / 2 + WALK_W / 2]} size={[ROAD_W - 0.01, 0.16, WALK_W + 0.02]} color={ASPHALT} look={{rough: 0.75}} />
    {([1, -1] as const).map((s) => (
      <Block key={s} position={[s * (ROAD_W / 2 + WALK_W / 2), 0.07, 42]} size={[WALK_W, 0.14, 70]} color={WALK} look={{rough: 0.95}} />
    ))}
    {/* lane dashes */}
    {Array.from({length: 40}, (_, i) => -98 + i * 5)
      .filter((x) => Math.abs(x) > ROAD_W / 2 + 1)
      .map((x) => (
        <Block key={x} position={[x, 0.012, 0]} size={[2.2, 0.006, 0.14]} color="#c9c4b0" shadow={false} />
      ))}
    {/* zebra at the crossing */}
    {Array.from({length: 6}, (_, i) => (
      <Block key={i} position={[-ROAD_W / 2 - 1.4, 0.012, -3 + i * 1.2]} size={[2.0, 0.006, 0.5]} color="#c9c4b0" shadow={false} />
    ))}
  </group>
);

// ---------------------------------------------------------------- street furniture

// lamp post: arm over the road; on = 0..1 (flicker comes from the caller)
export const Lamp: React.FC<{position: V3; dir?: 1 | -1; on?: number; light?: boolean; k?: number}> = ({position, dir = -1, on = 1, light = false, k = 1}) => (
  <group position={position}>
    <Cyl position={[0, 2.6, 0]} rt={0.06} rb={0.09} h={5.2} seg={10} color="#3a3d44" look={{rough: 0.6, metal: 0.3}} />
    <Pill position={[0, 5.2, dir * 0.55]} rotation={[Math.PI / 2, 0, 0]} r={0.05} len={1.0} color="#3a3d44" />
    <RBox position={[0, 5.15, dir * 1.1]} size={[0.32, 0.12, 0.6]} r={0.04} color="#2e3036" />
    <mesh position={[0, 5.085, dir * 1.1]} rotation={[Math.PI / 2, 0, 0]} material={mat(on > 0.05 ? '#ffe2a8' : '#4a4a40', {basic: true})}>
      <planeGeometry args={[0.26, 0.5]} />
    </mesh>
    <Glow position={[0, 5.0, dir * 1.1]} size={2.4} color="#ffd28a" k={0.55 * on * k} fog />
    {/* the warm pool on the ground (cheap fake light, soft radial edge) */}
    <Pool position={[0, 0.155, dir * 1.1]} r={3.6} k={0.32 * on * k} />
    {light ? <spotLight position={[0, 5.0, dir * 1.1]} angle={0.75} penumbra={0.7} color="#ffcf8a" intensity={55 * on * k} distance={14} decay={1.6} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0006} target-position={[position[0], 0, position[2] + dir * 1.1]} /> : null}
  </group>
);

const poolTex = (() => {
  let tx: THREE.Texture | null = null;
  return () => {
    if (tx) return tx;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    gr.addColorStop(0.7, 'rgba(255,255,255,0.15)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  };
})();
const POOLS = new Map<string, THREE.Material>();
// a soft additive light pool on the ground
export const Pool: React.FC<{position: V3; r: number; k: number; color?: string}> = ({position, r, k, color = '#ffb860'}) => {
  if (k <= 0.001) return null;
  const key = color + Math.round(k * 60);
  let m = POOLS.get(key);
  if (!m) {
    m = new THREE.MeshBasicMaterial({map: poolTex(), color, transparent: true, opacity: Math.round(k * 60) / 60, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: true});
    POOLS.set(key, m);
  }
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2} material={m}>
      <planeGeometry args={[r * 2, r * 2]} />
    </mesh>
  );
};

// traffic light blinking yellow
export const TrafficLight: React.FC<{position: V3; v: number; rot?: number}> = ({position, v, rot = 0}) => {
  const on = Math.floor(v * 1.25) % 2 === 0 ? 1 : 0;
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <Cyl position={[0, 1.6, 0]} rt={0.05} rb={0.06} h={3.2} seg={10} color="#3a3d44" />
      <RBox position={[0, 3.4, 0.05]} size={[0.3, 0.8, 0.22]} r={0.05} color="#25272c" />
      {[0.25, 0, -0.25].map((y, i) => (
        <mesh key={i} position={[0, 3.4 + y, 0.165]} material={mat(i === 1 && on ? '#ffc23a' : '#3a3628', {basic: true})}>
          <circleGeometry args={[0.08, 20]} />
        </mesh>
      ))}
      <Glow position={[0, 3.4, 0.25]} size={1.6} color="#ffb020" k={0.8 * on} fog />
    </group>
  );
};

// a parked (abandoned) car facing +x; doorOpen swings the driver door (−z side)
export const Car: React.FC<{position: V3; rot?: number; color?: string; doorOpen?: number}> = ({position, rot = 0, color = '#6a7a8a', doorOpen = 0}) => (
  <group position={position} rotation={[0, rot, 0]}>
    <RBox position={[0, 0.55, 0]} size={[4.0, 0.7, 1.75]} r={0.22} color={color} look={{rough: 0.4, metal: 0.2}} />
    <RBox position={[-0.25, 1.12, 0]} size={[2.2, 0.62, 1.55]} r={0.22} color={color} look={{rough: 0.4, metal: 0.2}} />
    {/* windows */}
    {([1, -1] as const).map((s) => (
      <Block key={s} position={[-0.25, 1.14, s * 0.778]} size={[1.9, 0.42, 0.01]} color="#151a22" look={{rough: 0.15}} shadow={false} />
    ))}
    <Block position={[0.86, 1.14, 0]} rotation={[0, 0, -0.5]} size={[0.01, 0.5, 1.36]} color="#151a22" look={{rough: 0.15}} shadow={false} />
    <Block position={[-1.36, 1.14, 0]} rotation={[0, 0, 0.5]} size={[0.01, 0.5, 1.36]} color="#151a22" look={{rough: 0.15}} shadow={false} />
    {/* wheels */}
    {[
      [1.3, 0.85],
      [1.3, -0.85],
      [-1.3, 0.85],
      [-1.3, -0.85],
    ].map(([x, z], i) => (
      <Cyl key={i} position={[x, 0.34, z]} rotation={[Math.PI / 2, 0, 0]} rt={0.34} rb={0.34} h={0.26} seg={18} color="#1a1a1c" />
    ))}
    {/* lights off */}
    {([1, -1] as const).map((s) => (
      <group key={s}>
        <RBox position={[2.0, 0.66, s * 0.6]} size={[0.04, 0.14, 0.34]} r={0.02} color="#d8d4c8" shadow={false} />
        <RBox position={[-2.0, 0.66, s * 0.6]} size={[0.04, 0.14, 0.34]} r={0.02} color="#6a1a1a" shadow={false} />
      </group>
    ))}
    {doorOpen > 0 ? (
      <group position={[0.35, 0.8, -0.89]} rotation={[0, -doorOpen * 1.0, 0]}>
        <RBox position={[-0.55, 0, -0.02]} size={[1.1, 0.95, 0.07]} r={0.03} color={color} look={{rough: 0.4}} />
      </group>
    ) : null}
  </group>
);

// a wheelie bin; tip tilts it over (0..1)
export const Bin: React.FC<{position: V3; rot?: number; tip?: number; color?: string}> = ({position, rot = 0, tip = 0, color = '#3a5a3e'}) => (
  <group position={position} rotation={[0, rot, 0]}>
    <group rotation={[0, 0, (-tip * Math.PI) / 2]} position={[0.32 * Math.sin((tip * Math.PI) / 2), 0, 0]}>
      <RBox position={[0, 0.5, 0]} size={[0.62, 1.0, 0.66]} r={0.04} color={color} />
      <RBox position={[0, 1.02, 0.02]} size={[0.66, 0.06, 0.72]} r={0.02} color={color} />
    </group>
  </group>
);

// picket fence along x from x0 to x1 at z; gap = [a, b] in x left open (a gate)
export const Fence: React.FC<{z: number; x0: number; x1: number; gap?: [number, number]; color?: string; alongZ?: boolean; at?: number}> = ({z, x0, x1, gap, color = '#5a4a3c', alongZ, at = 0}) => {
  const n = Math.floor((x1 - x0) / 0.22);
  const posts = Array.from({length: n}, (_, i) => x0 + i * 0.22).filter((x) => !gap || x < gap[0] || x > gap[1]);
  const P = (x: number, y: number): V3 => (alongZ ? [at, y, x] : [x, y, z]);
  const segs: [number, number][] = gap ? [[x0, gap[0]], [gap[1], x1]] : [[x0, x1]];
  return (
    <group>
      {posts.map((x) => (
        <Block key={x} position={P(x, 0.55)} size={alongZ ? [0.03, 1.1, 0.12] : [0.12, 1.1, 0.03]} color={color} />
      ))}
      {segs.map(([a, b], i) =>
        [0.3, 0.85].map((y) => <Block key={i + '_' + y} position={P((a + b) / 2, y)} size={alongZ ? [0.04, 0.07, b - a] : [b - a, 0.07, 0.04]} color={color} />),
      )}
    </group>
  );
};

// a bare autumn tree, dark (no warm rim at night)
export const NightTree: React.FC<{position: V3; h?: number; seed?: number; sway?: number}> = ({position, h = 5, seed = 1, sway = 0}) => {
  const blobs = useMemo(
    () =>
      Array.from({length: 16}, (_, i) => {
        const a = rnd(seed * 7 + i) * Math.PI * 2;
        const r = 0.4 + rnd(seed * 13 + i) * 1.3;
        return {p: [Math.cos(a) * r, h * 0.72 + rnd(seed * 3 + i) * h * 0.32, Math.sin(a) * r] as V3, s: 0.32 + rnd(seed * 5 + i) * 0.3, c: ['#5a6a3a', '#7a6a32', '#8a5a2a', '#4a5a34'][i % 4]};
      }),
    [seed, h],
  );
  return (
    <group position={position} rotation={[sway * 0.4, rnd(seed * 17) * 6.28, sway]}>
      <Cyl position={[0, h * 0.42, 0]} rt={0.1} rb={0.2} h={h * 0.84} seg={10} color="#2a221c" look={{rough: 0.95}} />
      {blobs.map((b, i) => (
        <Ball key={i} position={b.p} scale={b.s} color={b.c} look={{rough: 0.95, rim: '#8aa0ff', rimK: 0.1}} seg={14} />
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- buildings

const drawSign = (text: string, bg: string, fg: string, size = 0.62) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = fg;
  g.font = `600 ${Math.round(H * size)}px ${COND}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, W / 2, H / 2 + H * 0.03);
};
export const Sign: React.FC<{text: string; position: V3; rotation?: V3; size: [number, number]; bg?: string; fg?: string; glow?: number; lit?: boolean}> = ({text, position, rotation, size, bg = '#1c2a3a', fg = '#e8e4d8', glow = 1, lit = true}) => (
  <Pic size={size} res={[Math.round(512 * (size[0] / size[1]) > 2048 ? 2048 : 512 * (size[0] / size[1])), 512]} k={`sign_${text}_${bg}_${fg}`} draw={drawSign(text, bg, fg)} position={position} rotation={rotation} lit={lit} glow={glow} />
);

// a dark window with a frame, on a wall facing +z
const Win: React.FC<{position: V3; w?: number; h?: number; lit?: number; boarded?: boolean}> = ({position, w = 1.0, h = 1.3, lit = 0, boarded}) => (
  <group position={position}>
    <Block position={[0, 0, 0.02]} size={[w + 0.14, h + 0.14, 0.05]} color="#d8d2c4" />
    <mesh position={[0, 0, 0.05]} material={mat(lit > 0 ? '#ffcf7a' : '#11161e', lit > 0 ? {basic: true} : {rough: 0.12, metal: 0.3})}>
      <planeGeometry args={[w, h]} />
    </mesh>
    <Block position={[0, 0, 0.06]} size={[0.05, h, 0.02]} color="#d8d2c4" shadow={false} />
    <Block position={[0, -h * 0.5 - 0.08, 0.08]} size={[w + 0.3, 0.06, 0.16]} color="#c8c2b4" />
    {boarded
      ? [-0.32, 0.05, 0.36].map((y, i) => <Block key={i} position={[0, y * h, 0.1 + i * 0.012]} rotation={[0, 0, (i - 1) * 0.08]} size={[w + 0.3, 0.16, 0.025]} color="#8a6a48" />)
      : null}
  </group>
);

// a two-storey house: footprint w × d, front facing +z, door in the middle
export const Cottage: React.FC<{position: V3; rot?: number; w?: number; d?: number; wall?: string; roof?: string; seed?: number; litWin?: number; boarded?: boolean}> = ({
  position,
  rot = 0,
  w = 7,
  d = 6,
  wall = '#a89a86',
  roof = '#5a3a32',
  seed = 1,
  litWin = -1,
  boarded,
}) => {
  const H = 5.4;
  const ridge = 2.2;
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <Block position={[0, H / 2, 0]} size={[w, H, d]} color={wall} look={{rough: 0.95}} />
      <Block position={[0, 0.2, 0]} size={[w + 0.1, 0.4, d + 0.1]} color="#6a6460" />
      {/* gable roof: two slabs */}
      {([1, -1] as const).map((s) => (
        <Block key={s} position={[0, H + ridge / 2 - 0.05, (s * d) / 4]} rotation={[s * Math.atan2(ridge, d / 2), 0, 0]} size={[w + 0.5, 0.18, Math.hypot(ridge, d / 2) + 0.35]} color={roof} look={{rough: 0.85}} />
      ))}
      {/* gable ends */}
      {([1, -1] as const).map((s) => (
        <mesh key={s} position={[(s * w) / 2, H, 0]} rotation={[0, s * Math.PI / 2, 0]} material={mat(wall, {rough: 0.95})}>
          <shapeGeometry args={[gable(d, ridge)]} />
        </mesh>
      ))}
      <Block position={[w * 0.28, H + ridge * 0.7, -d * 0.12]} size={[0.5, 1.4, 0.5]} color="#5a4a44" />
      {/* door + porch */}
      <Block position={[0, 1.15, d / 2 + 0.03]} size={[1.0, 2.1, 0.06]} color={['#5a3a2a', '#3a4a5a', '#5a2a2a'][seed % 3]} />
      <Block position={[0, 0.1, d / 2 + 0.7]} size={[1.8, 0.2, 1.4]} color="#6a6460" />
      {/* windows */}
      {[-w * 0.3, w * 0.3].map((x, i) => (
        <Win key={'g' + i} position={[x, 1.5, d / 2]} boarded={boarded} lit={litWin === i ? 1 : 0} />
      ))}
      {[-w * 0.3, 0, w * 0.3].map((x, i) => (
        <Win key={'u' + i} position={[x, 4.0, d / 2]} w={0.9} h={1.1} lit={litWin === i + 2 ? 1 : 0} />
      ))}
    </group>
  );
};

const gable = (d: number, ridge: number) => {
  const s = new THREE.Shape();
  s.moveTo(-d / 2, 0);
  s.lineTo(d / 2, 0);
  s.lineTo(0, ridge);
  s.lineTo(-d / 2, 0);
  return s;
};

// shop-front building on the corner: one tall storey, big windows
export const ShopFront: React.FC<{position: V3; w?: number; d?: number; label: string; signBg: string; signFg?: string; wall?: string; broken?: boolean; cross?: number; v?: number}> = ({
  position,
  w = 8,
  d = 7,
  label,
  signBg,
  signFg = '#ffffff',
  wall = '#8a8478',
  broken,
  cross,
  v = 0,
}) => (
  <group position={position}>
    <Block position={[0, 2.2, 0]} size={[w, 4.4, d]} color={wall} look={{rough: 0.95}} />
    <Block position={[0, 4.5, 0]} size={[w + 0.2, 0.2, d + 0.2]} color="#5a5650" />
    <Sign text={label} position={[0, 3.55, d / 2 + 0.03]} size={[w * 0.7, 0.8]} bg={signBg} fg={signFg} glow={0.8} />
    {/* big window, dark; broken = a jagged hole */}
    <Block position={[-w * 0.18, 1.45, d / 2 + 0.02]} size={[w * 0.5, 2.1, 0.05]} color="#4a4640" />
    <mesh position={[-w * 0.18, 1.45, d / 2 + 0.05]} material={mat('#0e141c', {rough: 0.1, metal: 0.4})}>
      <planeGeometry args={[w * 0.46, 1.95]} />
    </mesh>
    {broken
      ? [
          [-0.9, 0.5, 0.4],
          [-0.2, -0.3, 0.55],
          [0.6, 0.2, 0.35],
        ].map(([x, y, s], i) => (
          <mesh key={i} position={[-w * 0.18 + x, 1.45 + y, d / 2 + 0.065]} rotation={[0, 0, i * 1.3]} material={mat('#9aa8b8', {opacity: 0.35, rough: 0.1})}>
            <circleGeometry args={[s, 3]} />
          </mesh>
        ))
      : null}
    {/* door */}
    <Block position={[w * 0.28, 1.1, d / 2 + 0.03]} size={[1.2, 2.2, 0.06]} color="#2a2e34" />
    <mesh position={[w * 0.28, 1.15, d / 2 + 0.065]} material={mat('#0e141c', {rough: 0.1, metal: 0.4})}>
      <planeGeometry args={[0.9, 1.8]} />
    </mesh>
    {cross !== undefined ? <PharmacyCross position={[w / 2 + 0.05, 3.4, d / 2 - 0.6]} on={cross} v={v} /> : null}
  </group>
);

// the green pharmacy cross sticking out of the corner, flickering
export const PharmacyCross: React.FC<{position: V3; on: number; v: number}> = ({position, on, v}) => {
  const fl = on * (Math.sin(v * 23) > 0.85 ? 0.3 : 1);
  const c = fl > 0.5 ? '#3cff7a' : '#1e5a32';
  return (
    <group position={position}>
      <Block position={[0.35, 0, 0]} size={[0.7, 0.08, 0.08]} color="#3a3d44" />
      <group position={[0.8, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Block size={[0.7, 0.22, 0.08]} color={c} look={{basic: true}} />
        <Block size={[0.22, 0.7, 0.082]} color={c} look={{basic: true}} />
      </group>
      <Glow position={[0.8, 0, 0]} size={2.2} color="#3cff7a" k={0.5 * fl} fog />
    </group>
  );
};

// the school: three storeys, a clock over the door, a fence
export const School: React.FC<{position: V3; v?: number}> = ({position}) => (
  <group position={position}>
    <Block position={[0, 5, 0]} size={[22, 10, 9]} color="#b88a6a" look={{rough: 0.95}} />
    <Block position={[0, 10.1, 0]} size={[22.3, 0.25, 9.3]} color="#6a5048" />
    {[1.8, 5.0, 8.2].map((y) =>
      [-9, -6, -3, 3, 6, 9].map((x) => <Win key={x + '_' + y} position={[x, y, 4.5]} w={1.6} h={1.7} />),
    )}
    <Block position={[0, 1.3, 4.53]} size={[2.4, 2.6, 0.06]} color="#3a3a40" />
    <Sign text="ШКОЛА" position={[0, 3.2, 4.53]} size={[3.2, 0.7]} bg="#2a3a5a" glow={0.5} />
    {/* clock */}
    <group position={[0, 5.4, 4.53]}>
      <Cyl rotation={[Math.PI / 2, 0, 0]} rt={0.7} rb={0.7} h={0.08} seg={32} color="#f0ead8" />
      <Block position={[0, 0.22, 0.05]} size={[0.06, 0.45, 0.02]} color="#1a1a1a" shadow={false} />
      <Block position={[0.18, 0.0, 0.06]} rotation={[0, 0, -1.2]} size={[0.05, 0.36, 0.02]} color="#1a1a1a" shadow={false} />
    </group>
  </group>
);

// moonlit night: dark blue sky dome with a moon, cold hemisphere light, moon shadows
export const NightLight: React.FC<{center?: V3; box?: number; k?: number; moon?: V3}> = ({center = [0, 0, 0], box = 14, k = 1, moon = [-12, 22, -16]}) => (
  <>
    <hemisphereLight color="#6a80b8" groundColor="#1c2030" intensity={1.05 * k} />
    <directionalLight
      position={[center[0] + moon[0], center[1] + moon[1], center[2] + moon[2]]}
      target-position={center}
      color="#a8bcff"
      intensity={1.5 * k}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-box}
      shadow-camera-right={box}
      shadow-camera-top={box}
      shadow-camera-bottom={-box}
      shadow-camera-near={1}
      shadow-camera-far={90}
      shadow-bias={-0.0005}
      shadow-normalBias={0.02}
    />
  </>
);

export const NightSky: React.FC<{center?: V3; dawn?: number}> = ({center = [0, 0, 0], dawn = 0}) => {
  const top = lerpC('#101e44', '#3a5a8c', dawn);
  const low = lerpC('#25345a', '#f0a070', dawn);
  return (
    <group>
      <color attach="background" args={[top]} />
      <fog attach="fog" args={[lerpC('#1a2440', '#8a8aa0', dawn), 20, 90]} />
      <mesh position={[center[0], center[1], center[2]]} scale={300} material={skyMat(top, low)} renderOrder={-1}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      {dawn < 0.6 ? <Glow position={[center[0] - 60, center[1] + 90, center[2] - 120]} size={26 * (1 - dawn)} color="#dfe8ff" k={0.9 * (1 - dawn)} /> : null}
      {dawn < 0.6 ? (
        <mesh position={[center[0] - 60, center[1] + 90, center[2] - 120]} material={mat('#eef2ff', {basic: true, fog: false})}>
          <sphereGeometry args={[3.2, 20, 14]} />
        </mesh>
      ) : null}
    </group>
  );
};

const lerpC = (a: string, b: string, k: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, k))).getHexString();
const SKY = new Map<string, THREE.Material>();
const skyMat = (top: string, low: string) => {
  const key = top + low;
  let m = SKY.get(key);
  if (m) return m;
  m = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {cTop: {value: new THREE.Color(top)}, cLow: {value: new THREE.Color(low)}},
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 cTop; uniform vec3 cLow; varying vec3 vP; void main(){ float h = clamp(vP.y * 2.2, 0.0, 1.0); gl_FragColor = vec4(mix(cLow, cTop, h), 1.0); }`,
  });
  SKY.set(key, m);
  return m;
};

// ---------------------------------------------------------------- the whole town (minus Тихая, 9, which is in House.tsx)

const HOUSES: {x: number; z: number; rot: number; wall: string; roof: string; seed: number; lit?: number}[] = [
  {x: -26, z: -13.2, rot: 0, wall: '#9a8e7e', roof: '#4a3a3a', seed: 2},
  {x: -38, z: -13.2, rot: 0, wall: '#8e9690', roof: '#3a3a44', seed: 3},
  {x: -2.5, z: -13.2, rot: 0, wall: '#a08a7a', roof: '#4a3430', seed: 4},
  {x: -16, z: 13.2, rot: Math.PI, wall: '#8a8478', roof: '#3a3436', seed: 5},
  {x: -28, z: 13.2, rot: Math.PI, wall: '#a49a88', roof: '#4a3a30', seed: 6},
  {x: 12, z: 13.2, rot: Math.PI, wall: '#968c84', roof: '#3a3a40', seed: 7},
  {x: 24, z: 13.2, rot: Math.PI, wall: '#a8a090', roof: '#4a3632', seed: 8},
  {x: 31, z: -13.2, rot: 0, wall: '#8a8a82', roof: '#3a3436', seed: 9},
];

export const Town: React.FC<{v: number; lampLights?: number[]; wind?: number; skipHouses?: boolean; flicker?: boolean}> = ({v, lampLights = [], wind = 0, flicker = true}) => {
  const lamps: {p: V3; dir: 1 | -1}[] = [];
  for (let x = -46; x <= 40; x += 12) {
    lamps.push({p: [x + 2.5, 0.14, -(ROAD_W / 2 + 0.5)], dir: 1});
    lamps.push({p: [x + 8.5, 0.14, ROAD_W / 2 + 0.5], dir: -1});
  }
  return (
    <group>
      <Ground />
      {HOUSES.map((h, i) => (
        <group key={i}>
          <Cottage position={[h.x, 0, h.z]} rot={h.rot} wall={h.wall} roof={h.roof} seed={h.seed} boarded={i % 3 === 1} />
          <Fence z={h.z + (h.rot === 0 ? 1 : -1) * 6.4} x0={h.x - 5} x1={h.x + 5} gap={[h.x - 0.7, h.x + 0.7]} />
        </group>
      ))}
      <ShopFront position={PHARMACY} label="АПТЕКА" signBg="#1f6a3e" broken cross={1} v={v} />
      <ShopFront position={SHOP} label="ПРОДУКТЫ" signBg="#8a2a2a" wall="#857e70" />
      <School position={SCHOOL} />
      {lamps.map((l, i) => {
        const fl = flicker && i % 5 === 2 ? (Math.sin(v * 17 + i) > 0.6 ? 0.2 : 1) : 1;
        return <Lamp key={i} position={l.p} dir={l.dir} on={fl} light={lampLights.includes(i)} />;
      })}
      <TrafficLight position={[ROAD_W / 2 + 0.5, 0.14, -(ROAD_W / 2 + 0.5)]} v={v} rot={0} />
      <TrafficLight position={[-(ROAD_W / 2 + 0.5), 0.14, ROAD_W / 2 + 0.5]} v={v} rot={Math.PI} />
      <Car position={[-20, 0, -2.2]} rot={0.06} color="#6a7a8a" doorOpen={0.8} />
      <Car position={[-5.5, 0, 2.3]} rot={Math.PI + 0.15} color="#8a3a32" />
      <Car position={[6, 0, -1.8]} rot={-0.35} color="#d8d2c4" />
      <Car position={[2.2, 0, 14]} rot={Math.PI / 2 + 0.1} color="#3a4a3a" doorOpen={0.6} />
      <Car position={[26, 0, 2.2]} rot={Math.PI} color="#4a4a6a" />
      {[-31, -20, -8, 4, 16, 28].map((x, i) => (
        <NightTree key={'n' + i} position={[x, 0, -7.2]} h={5.2} seed={i + 3} sway={0.03 * wind * Math.sin(v * 2.2 + i)} />
      ))}
      {[-34, -22, -10, 8, 18, 30].map((x, i) => (
        <NightTree key={'s' + i} position={[x, 0, 7.4]} h={4.8} seed={i + 13} sway={0.03 * wind * Math.sin(v * 2.0 + i)} />
      ))}
      <Bin position={[-7.6, 0.14, -5.6]} rot={0.2} />
      <Bin position={[14.5, 0.14, -5.8]} rot={-0.1} color="#4a4a52" />
    </group>
  );
};
