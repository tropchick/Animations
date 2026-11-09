import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useCanvas} from '../gta/tex';
import {Ball, Block, Cone, Cyl, Disc, RBox, Ring, mat} from '../bear/kit';
import {Pic} from '../bear/Props';
import {useRobe} from '../gaben/Sets';
import {fit} from '../cs2/tex';
import {V3, rnd} from './cues';

// Sets for «мать Габена или мать Нолана»: the two mothers are only ever feet: slippers, ankles and the robe hem.
// Gaben's mother: pink floral robe + pink fluffy slippers. Nolan's mother: leopard robe + blue slippers with big pompoms.

export const ROUNDF = "'Rubik', 'Arial', sans-serif";
export const PINK = '#f06aa0';
export const BLUE = '#4aa8f0';

// ---------------------------------------------------------------- leopard print, tiling

const drawLeopard = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#e2a65a';
  g.fillRect(0, 0, W, H);
  for (let k = 0; k < 8; k++) {
    const x = (k / 8) * W;
    const gr = g.createLinearGradient(x, 0, x + W / 8, 0);
    gr.addColorStop(0, 'rgba(90,50,10,0)');
    gr.addColorStop(0.5, 'rgba(90,50,10,0.14)');
    gr.addColorStop(1, 'rgba(90,50,10,0)');
    g.fillStyle = gr;
    g.fillRect(x, 0, W / 8, H);
  }
  const spot = (cx: number, cy: number, r: number, a: number) => {
    // a rosette: a few dark blobs around a warm centre
    g.fillStyle = '#c47a2c';
    g.beginPath();
    g.ellipse(cx, cy, r * 0.7, r * 0.55, a, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#3a2412';
    for (let p = 0; p < 5; p++) {
      const b = a + (p / 5) * Math.PI * 2 + 0.3 * Math.sin(p * 7.1 + cx);
      g.beginPath();
      g.ellipse(cx + Math.cos(b) * r * 0.78, cy + Math.sin(b) * r * 0.65, r * 0.32, r * 0.2, b + Math.PI / 2, 0, Math.PI * 2);
      g.fill();
    }
  };
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const cx = ((i + (j % 2) * 0.5 + 0.2 * rnd(i * 5 + j)) / 5) * W;
      const cy = ((j + 0.5) / 5) * H;
      const r = W * (0.055 + 0.02 * rnd(i * 7 + j * 3));
      for (const dx of [-W, 0, W]) for (const dy of [-H, 0, H]) spot(cx + dx, cy + dy, r, rnd(i + j * 9) * 3);
    }
  }
};

export const useLeopard = (repeat: [number, number]) => {
  const tex = useCanvas(512, 512, 'leopard', (g) => drawLeopard(g, 512, 512));
  return useMemo(() => {
    const t = tex.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
    t.needsUpdate = true;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex, tex.version, repeat[0], repeat[1]]);
};

export type Who = 'g' | 'n';
const usePrint = (who: Who, repeat: [number, number]) => {
  const robe = useRobe(repeat);
  const leo = useLeopard(repeat);
  return who === 'g' ? robe : leo;
};

// ---------------------------------------------------------------- one slipper (toe towards +z, sole on y = 0, ~0.36 long)

export const SoftSlipper: React.FC<{who: Who; position?: V3; rotation?: V3; scale?: number}> = ({who, position, rotation, scale = 1}) => {
  const g = who === 'g';
  const body = g ? PINK : BLUE;
  const sole = g ? '#b8406f' : '#2a5a9a';
  const fluff = g ? '#ffd6e8' : '#f4faff';
  const fur = {rim: '#ffffff', rimK: 0.35, rimPow: 2.2, rough: 0.95};
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Ball position={[0, 0.025, 0]} scale={[0.115, 0.026, 0.19]} color={sole} look={{rough: 0.9}} />
      <Ball position={[0, 0.048, -0.01]} scale={[0.1, 0.012, 0.165]} color={g ? '#ffb3d1' : '#bfe0ff'} look={{rough: 1}} shadow={false} />
      {/* toe cover */}
      <Ball position={[0, 0.06, 0.075]} scale={[0.112, 0.075, 0.11]} color={body} look={fur} />
      {/* heel cuff */}
      <Ring position={[0, 0.07, -0.06]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1.25, 1]} r={0.085} tube={0.022} color={fluff} look={fur} />
      {/* pompom: pink small and fluffy, blue big and white */}
      {g ? (
        <>
          <Ball position={[0, 0.135, 0.11]} scale={0.045} color={fluff} look={fur} />
          <Ball position={[0.03, 0.15, 0.13]} scale={0.03} color="#ffe6f1" look={fur} />
          <Ball position={[-0.03, 0.145, 0.09]} scale={0.03} color="#ffc4dc" look={fur} />
        </>
      ) : (
        <>
          <Ball position={[0, 0.15, 0.1]} scale={0.072} color={fluff} look={fur} />
          <Ball position={[0, 0.2, 0.12]} scale={0.035} color="#ffffff" look={fur} />
        </>
      )}
    </group>
  );
};

// ---------------------------------------------------------------- the mother: two feet in slippers + the robe hem

export type Feet = {liftL?: number; liftR?: number; toeL?: number; toeR?: number};

export const Mom: React.FC<{who: Who; position?: V3; rotation?: number; scale?: number; hem?: number; feet?: Feet; squash?: number; sway?: number; cap?: boolean}> = ({who, position = [0, 0, 0], rotation = 0, scale = 1, hem = 1.6, feet = {}, squash = 1, sway = 0, cap = false}) => {
  const print = usePrint(who, [5, Math.max(1, Math.round(hem * 2))]);
  const robeMat = useMemo(() => new THREE.MeshStandardMaterial({map: print, roughness: 0.95, side: THREE.DoubleSide}), [print]);
  const trim = who === 'g' ? '#fff0f6' : '#3a2412';
  const skin = '#f0c2a0';
  const R = 0.36;
  const foot = (side: 1 | -1) => {
    const lift = (side === 1 ? feet.liftR : feet.liftL) ?? 0;
    const toe = (side === 1 ? feet.toeR : feet.toeL) ?? 0;
    return (
      <group key={side} position={[side * 0.13, lift, 0.02]} rotation={[-toe, side * 0.08, 0]}>
        <Cyl position={[0, 0.27, -0.03]} rt={0.058} rb={0.052} h={0.4} seg={16} color={skin} look={{rough: 0.7}} />
        <SoftSlipper who={who} />
      </group>
    );
  };
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={[scale, scale * squash, scale]}>
      {foot(-1)}
      {foot(1)}
      <group position={[0, 0.34, -0.02]} rotation={[0, 0, sway]}>
        <mesh position={[0, hem / 2, 0]} material={robeMat} castShadow receiveShadow>
          <cylinderGeometry args={[R * 0.9, R * 1.12, hem, 40, 1, true]} />
        </mesh>
        {cap ? (
          <mesh position={[0, hem, 0]} scale={[R * 0.96, R * 0.9, R * 0.96]} material={robeMat} castShadow>
            <sphereGeometry args={[1, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        ) : null}
        <Ring position={[0, 0.0, 0]} rotation={[Math.PI / 2, 0, 0]} r={R * 1.12} tube={0.028} color={trim} look={{rough: 1, rim: '#ffffff', rimK: 0.2}} />
      </group>
    </group>
  );
};

// the whole mother, seen from behind (no face): slippers, robe as a bell, shoulders, sleeves, a hair bun. ~1.9 tall at scale 1.
export const MomBack: React.FC<{who: Who; position?: V3; rotation?: V3; scale?: number; feet?: Feet; squash?: number}> = ({who, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, feet = {}, squash = 1}) => {
  const print = usePrint(who, [4, 2]);
  const robeMat = useMemo(() => new THREE.MeshStandardMaterial({map: print, roughness: 0.95, side: THREE.DoubleSide}), [print]);
  const trim = who === 'g' ? '#fff0f6' : '#3a2412';
  const hair = who === 'g' ? '#8a6a5a' : '#e8c878';
  const skin = '#f0c2a0';
  const foot = (side: 1 | -1) => {
    const lift = (side === 1 ? feet.liftR : feet.liftL) ?? 0;
    const toe = (side === 1 ? feet.toeR : feet.toeL) ?? 0;
    return (
      <group key={side} position={[side * 0.14, lift, 0.02 + lift * 1.6]} rotation={[-toe, side * 0.08, 0]}>
        <Cyl position={[0, 0.27, -0.03]} rt={0.058} rb={0.052} h={0.4} seg={16} color={skin} look={{rough: 0.7}} />
        <SoftSlipper who={who} />
      </group>
    );
  };
  const hairLook = {rough: 0.95, rim: '#ffffff', rimK: 0.2};
  return (
    <group position={position} rotation={rotation} scale={[scale, scale * squash, scale]}>
      {foot(-1)}
      {foot(1)}
      <mesh position={[0, 0.34 + 0.6, -0.02]} material={robeMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.27, 0.46, 1.2, 40, 1, true]} />
      </mesh>
      <Ring position={[0, 0.34, -0.02]} rotation={[Math.PI / 2, 0, 0]} r={0.46} tube={0.03} color={trim} look={{rough: 1}} />
      <mesh position={[0, 1.53, -0.02]} scale={[0.36, 0.17, 0.26]} material={robeMat} castShadow>
        <sphereGeometry args={[1, 32, 16]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.33, 1.5, -0.02]} rotation={[0, 0, s * 0.18]}>
          <mesh position={[0, -0.32, 0]} material={robeMat} castShadow>
            <capsuleGeometry args={[0.085, 0.5, 6, 16]} />
          </mesh>
          <Ball position={[0, -0.68, 0.01]} scale={0.065} color={skin} />
        </group>
      ))}
      <Cyl position={[0, 1.7, -0.02]} rt={0.07} rb={0.08} h={0.12} seg={14} color={skin} />
      <Ball position={[0, 1.88, 0.0]} scale={[0.17, 0.19, 0.17]} color={skin} />
      <Ball position={[0, 1.9, -0.035]} scale={[0.19, 0.2, 0.18]} color={hair} look={hairLook} />
      <Ball position={[0, 2.08, -0.06]} scale={0.11} color={hair} look={hairLook} />
    </group>
  );
};

// a flat canvas label that faces +z (names, small signs)
export const Label: React.FC<{text: string; position: V3; rotation?: V3; w: number; bg?: string; fg?: string; k?: string}> = ({text, position, rotation, w, bg = '#fff7e8', fg = '#2a1f3a', k}) => (
  <Pic
    size={[w, w * 0.25]}
    res={[512, 128]}
    k={k ?? `lab-${text}-${bg}`}
    position={position}
    rotation={rotation}
    lit={false}
    transparent
    draw={(g, W, H) => {
      g.fillStyle = bg;
      g.beginPath();
      g.roundRect(4, 4, W - 8, H - 8, 40);
      g.fill();
      g.fillStyle = fg;
      const s = fit(g, text, W - 60, 84, 800, ROUNDF);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = `800 ${s}px ${ROUNDF}`;
      g.fillText(text, W / 2, H / 2 + 4);
    }}
  />
);

// ---------------------------------------------------------------- bathroom scale (34 cm), display facing +z

export const ToyScale: React.FC<{position?: V3; squash?: number; err?: boolean; k: string}> = ({position, squash = 1, err, k}) => (
  <group position={position} scale={[1 + (1 - squash) * 0.25, squash, 1 + (1 - squash) * 0.25]}>
    <RBox position={[0, 0.03, 0]} size={[0.36, 0.06, 0.36]} r={0.025} color="#f4f6fa" look={{rough: 0.4}} />
    <RBox position={[0, 0.062, -0.02]} size={[0.3, 0.008, 0.24]} r={0.004} color="#dfe8f2" look={{rough: 0.3}} shadow={false} />
    <RBox position={[0, 0.064, 0.135]} size={[0.13, 0.008, 0.055]} r={0.004} color="#1c2430" shadow={false} />
    <Pic size={[0.115, 0.042]} res={[256, 96]} k={`${k}-${err ? 'e' : 'o'}`} position={[0, 0.0725, 0.135]} rotation={[-Math.PI / 2, 0, 0]} lit={false} draw={(g, W, H) => {
      g.fillStyle = '#1c2430';
      g.fillRect(0, 0, W, H);
      g.fillStyle = err ? '#ff4a3a' : '#7dffb0';
      const s = fit(g, err ? 'ОШИБКА' : '0.0', W - 20, 64, 800, ROUNDF);
      g.font = `800 ${s}px ${ROUNDF}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(err ? 'ОШИБКА' : '0.0', W / 2, H / 2 + 3);
    }} />
  </group>
);

export const Coil: React.FC<{position: V3; rotation?: V3; s?: number}> = ({position, rotation, s = 1}) => (
  <group position={position} rotation={rotation} scale={s}>
    {Array.from({length: 6}).map((_, i) => (
      <Ring key={i} position={[0, i * 0.016, 0]} rotation={[Math.PI / 2 + 0.15, 0, 0]} r={0.022} tube={0.005} color="#b9c0c8" look={{metal: 0.6, rough: 0.3}} />
    ))}
  </group>
);

// ---------------------------------------------------------------- water

export const Water: React.FC<{y: number; size?: number; color?: string; center?: V3; opacity?: number}> = ({y, size = 200, color = '#3fa6d8', center = [0, 0, 0], opacity}) => (
  <mesh position={[center[0], y, center[2]]} rotation={[-Math.PI / 2, 0, 0]} geometry={undefined} material={mat(color, {rough: 0.25, ...(opacity !== undefined ? {opacity} : {})})} receiveShadow>
    <planeGeometry args={[size, size, 1, 1]} />
  </mesh>
);

// wave crests: soft white strips that drift
export const Foam: React.FC<{v: number; y: number; n?: number; area?: [number, number, number, number]; seed?: number}> = ({v, y, n = 30, area = [-12, 12, -30, 4], seed = 1}) => (
  <>
    {Array.from({length: n}).map((_, i) => {
      const x = area[0] + rnd(i * 3 + seed) * (area[1] - area[0]);
      const z = area[2] + rnd(i * 5 + seed * 2) * (area[3] - area[2]);
      const ph = rnd(i * 7 + seed) * 6;
      const k = 0.5 + 0.5 * Math.sin(v * 1.6 + ph);
      return <Ball key={i} position={[x + 0.2 * Math.sin(v * 0.7 + ph), y + 0.005, z]} scale={[0.4 + 0.3 * rnd(i), 0.01, 0.05 * (0.4 + k)]} color="#ffffff" look={{rough: 0.6, opacity: 0.7}} shadow={false} receive={false} />;
    })}
  </>
);

// an inflatable dinghy (2 m), bow towards +z
export const Dinghy: React.FC<{position: V3; rotation?: V3; squash?: number}> = ({position, rotation, squash = 1}) => (
  <group position={position} rotation={rotation}>
    <Ring position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.75, 1.15, squash]} r={0.58} tube={0.11} color="#f2a43a" look={{rough: 0.5}} />
    <Ball position={[0, 0.06, 0]} scale={[0.5, 0.05, 0.74]} color="#3a3f4a" look={{rough: 0.8}} />
    <RBox position={[0, 0.2, 0]} size={[0.85, 0.05, 0.16]} r={0.02} color="#d8dde4" />
  </group>
);

export const Bubbles: React.FC<{t: number; center: V3; n?: number; up?: number}> = ({t, center, n = 18, up = 1.4}) => (
  <>
    {t > 0 && t < 3
      ? Array.from({length: n}).map((_, i) => {
          const tt = t - rnd(i * 3) * 1.2;
          if (tt < 0) return null;
          const y = center[1] + (tt * up) % 1.2;
          return <Ball key={i} position={[center[0] + (rnd(i) - 0.5) * 0.9, y, center[2] + (rnd(i * 7) - 0.5) * 0.9]} scale={0.03 + 0.04 * rnd(i * 5)} color="#e8f8ff" look={{rough: 0.2, opacity: 0.8}} shadow={false} />;
        })
      : null}
  </>
);

// ---------------------------------------------------------------- beach and Venice

export const Umbrella: React.FC<{position: V3; color?: string}> = ({position, color = '#e8453c'}) => (
  <group position={position}>
    <Cyl position={[0, 0.9, 0]} rt={0.025} rb={0.025} h={1.8} seg={8} color="#f2f2f2" />
    <Cone position={[0, 1.85, 0]} r={0.9} h={0.35} seg={12} color={color} look={{flat: true}} />
  </group>
);

export const Towel: React.FC<{position: V3; rotation?: number; color?: string}> = ({position, rotation = 0, color = '#3a8ad8'}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <RBox position={[0, 0.012, 0]} size={[0.7, 0.02, 1.5]} r={0.008} color={color} />
    <RBox position={[0, 0.025, 0]} size={[0.7, 0.008, 0.3]} r={0.003} color="#ffffff" shadow={false} />
  </group>
);

const VCOLS = ['#e8a07a', '#f2d29a', '#d87a5a', '#f0c0a0', '#c8a0c8', '#e8c86a', '#a8c8b8'];
export const VeniceHouse: React.FC<{position: V3; rotation?: number; w: number; h: number; i: number}> = ({position, rotation = 0, w, h, i}) => {
  const c = VCOLS[i % VCOLS.length];
  const rows = Math.max(2, Math.round(h / 1.1));
  const cols = Math.max(2, Math.round(w / 0.9));
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RBox position={[0, h / 2, 0]} size={[w, h, 3]} r={0.05} color={c} look={{rough: 0.9}} />
      <RBox position={[0, h + 0.08, 0]} size={[w + 0.16, 0.16, 3.16]} r={0.04} color="#b85a3a" />
      {Array.from({length: rows}).map((_, r) =>
        Array.from({length: cols}).map((_, q) => (
          <group key={`${r}-${q}`} position={[(q - (cols - 1) / 2) * (w / cols), 0.8 + r * ((h - 1.1) / Math.max(1, rows - 1)), 1.52]}>
            <RBox size={[0.36, 0.56, 0.04]} r={0.04} color="#4a3a4a" shadow={false} />
            <RBox position={[0, 0.3, 0.02]} size={[0.44, 0.08, 0.04]} r={0.03} color="#fff3e0" shadow={false} />
          </group>
        )),
      )}
      {/* a chimney */}
      <Cyl position={[w * 0.25, h + 0.45, 0.4]} rt={0.14} rb={0.17} h={0.75} seg={10} color="#a84a2a" />
    </group>
  );
};

export const Gondola: React.FC<{position: V3; rotation?: number}> = ({position, rotation = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Ball position={[0, 0.12, 0]} scale={[0.3, 0.14, 1.7]} color="#1c1d24" look={{rough: 0.35}} />
    <Cone position={[0, 0.4, 1.6]} rotation={[0.5, 0, 0]} r={0.06} h={0.6} seg={8} color="#1c1d24" />
    <RBox position={[0, 0.27, -0.3]} size={[0.42, 0.06, 0.5]} r={0.02} color="#c8302a" />
  </group>
);

export const Pigeon: React.FC<{position: V3; rotation?: number; flap?: number}> = ({position, rotation = 0, flap = 0}) => (
  <group position={position} rotation={[0, rotation, 0]} scale={0.6}>
    <Ball position={[0, 0.12, 0]} scale={[0.09, 0.09, 0.14]} color="#9aa0b0" />
    <Ball position={[0, 0.22, 0.1]} scale={0.06} color="#7a8098" />
    <Cone position={[0, 0.22, 0.17]} rotation={[Math.PI / 2, 0, 0]} r={0.015} h={0.04} seg={6} color="#f2a43a" />
    <Ball position={[0.08, 0.15, 0]} rotation={[0, 0, -0.3 - flap]} scale={[0.12, 0.02, 0.08]} color="#8890a4" />
    <Ball position={[-0.08, 0.15, 0]} rotation={[0, 0, 0.3 + flap]} scale={[0.12, 0.02, 0.08]} color="#8890a4" />
  </group>
);

// ---------------------------------------------------------------- the kitchen spoon (14 cm), bowl towards +z

export const Spoon: React.FC<{position: V3; rotation?: V3; scale?: number}> = ({position, rotation, scale = 1}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <Cyl position={[0, 0, -0.03]} rotation={[Math.PI / 2, 0, 0]} rt={0.005} rb={0.007} h={0.11} seg={8} color="#d8dde4" look={{metal: 0.8, rough: 0.25}} />
    <Ball position={[0, 0, 0.045]} scale={[0.02, 0.008, 0.03]} color="#e4e8ee" look={{metal: 0.8, rough: 0.2}} />
  </group>
);

// ---------------------------------------------------------------- space: Earth, the Moon, a dotted orbit

export type Land = {d: V3; s: V3; c?: string};
const LANDS: Land[] = Array.from({length: 9}, (_, i) => {
  const u = rnd(i * 2.3 + 11) * 1.6 - 0.8;
  const a = rnd(i * 3.7 + 12) * Math.PI * 2;
  const r = Math.sqrt(1 - u * u);
  return {d: [Math.cos(a) * r, u, Math.sin(a) * r], s: [0.55 + rnd(i) * 0.4, 0.45 + rnd(i * 5) * 0.35, 0.2]};
});

export const LandBlob: React.FC<{r: number; d: V3; s: V3; c?: string}> = ({r, d, s, c = '#6fbf73'}) => {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...d).normalize());
  const e = new THREE.Euler().setFromQuaternion(q);
  const h = r * Math.sqrt(Math.max(0, 1 - (Math.max(s[0], s[1]) / 5) ** 2));
  const n = new THREE.Vector3(...d).normalize();
  return <Ball position={[n.x * h, n.y * h, n.z * h]} rotation={[e.x, e.y, e.z]} scale={[(s[0] * r) / 5, (s[1] * r) / 5, (s[2] * r) / 5]} color={c} look={{rough: 0.8}} />;
};

export const ToyEarth: React.FC<{r: number; spin?: number; position?: V3; lands?: boolean; children?: React.ReactNode}> = ({r, spin = 0, position = [0, 0, 0], lands = true, children}) => (
  <group position={position} rotation={[0.3, spin, 0]}>
    <Ball scale={r} seg={64} color="#3a8ad8" look={{rough: 0.5, rim: '#9ad8ff', rimK: 0.6, rimPow: 2.2}} />
    {lands ? LANDS.map((c, i) => <LandBlob key={i} r={r} d={c.d} s={c.s} c={i % 3 ? '#6fbf73' : '#c8b878'} />) : null}
    {children}
  </group>
);

export const ToyMoon: React.FC<{position: V3; r: number}> = ({position, r}) => (
  <group position={position}>
    <Ball scale={r} seg={40} color="#c8c8cc" look={{rough: 0.95, rim: '#ffffff', rimK: 0.25}} />
    {[[0.4, 0.5, 0.77], [-0.5, 0.1, 0.86], [0.1, -0.55, 0.83], [-0.2, 0.6, 0.77]].map((d, i) => (
      <Ball key={i} position={[d[0] * r * 0.99, d[1] * r * 0.99, d[2] * r * 0.99]} scale={[r * 0.22, r * 0.22, r * 0.05]} rotation={[-Math.asin(d[1]), Math.atan2(d[0], d[2]), 0]} color="#a8a8b0" look={{rough: 1}} shadow={false} />
    ))}
  </group>
);

export const Dots: React.FC<{center: V3; r: number; n?: number; opacity?: number; tilt?: number; color?: string; size?: number}> = ({center, r, n = 70, opacity = 0.8, tilt = 0, color = '#ffffff', size = 0.06}) => (
  <group position={center} rotation={[tilt, 0, 0]}>
    {Array.from({length: n}).map((_, i) => {
      const a = (i / n) * Math.PI * 2;
      return <Ball key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} scale={size} color={color} look={{basic: true, opacity}} shadow={false} receive={false} />;
    })}
  </group>
);

export const Planet: React.FC<{position: V3; r: number; color: string; ring?: string}> = ({position, r, color, ring}) => (
  <group position={position}>
    <Ball scale={r} seg={40} color={color} look={{rough: 0.7, rim: '#ffffff', rimK: 0.2}} />
    {ring ? <Ring rotation={[1.2, 0.2, 0]} r={r * 1.7} tube={r * 0.12} scale={[1, 1, 0.15]} color={ring} look={{rough: 0.6}} /> : null}
  </group>
);

// ---------------------------------------------------------------- the seismograph (on a table), paper scrolling to -x

export const Seismograph: React.FC<{position: V3; rotation?: number; t: number; amp: number; k: string}> = ({position, rotation = 0, t, amp, k}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <RBox position={[0, 0.06, 0]} size={[0.62, 0.12, 0.34]} r={0.03} color="#4a5a6a" />
    <Cyl position={[-0.22, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]} rt={0.06} rb={0.06} h={0.28} seg={20} color="#f4f0e4" />
    <Cyl position={[0.22, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]} rt={0.06} rb={0.06} h={0.28} seg={20} color="#f4f0e4" />
    <Pic size={[0.44, 0.24]} res={[512, 280]} k={k} position={[0, 0.232, 0]} rotation={[-Math.PI / 2, 0, 0]} draw={(g, W, H) => {
      g.fillStyle = '#fbf7ea';
      g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(80,120,200,0.35)';
      g.lineWidth = 2;
      for (let x = 0; x < W; x += 32) {
        g.beginPath();
        g.moveTo(x - ((t * 120) % 32), 0);
        g.lineTo(x - ((t * 120) % 32), H);
        g.stroke();
      }
      g.strokeStyle = '#d0302a';
      g.lineWidth = 5;
      g.beginPath();
      for (let x = 0; x <= W; x += 3) {
        const tt = t - (W - x) / 240;
        const a = amp * Math.max(0, Math.exp(-Math.max(0, tt) * 2.5)) * (tt > 0 ? 1 : 0);
        const y = H / 2 + Math.sin(tt * 70) * a * H * 0.4 + Math.sin(tt * 13) * 3;
        if (x === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
    }} />
    {/* the pen arm */}
    <RBox position={[0.24, 0.27, -0.12]} size={[0.04, 0.12, 0.04]} r={0.01} color="#2a2b33" />
    <RBox position={[0.17, 0.3, 0.0 + Math.sin(t * 70) * 0.04 * amp * Math.exp(-Math.max(0, t) * 2.5)]} rotation={[0, 0, 0]} size={[0.16, 0.015, 0.015]} r={0.005} color="#2a2b33" />
  </group>
);

// ---------------------------------------------------------------- the observatory telescope (tube towards +z and up)

export const Telescope: React.FC<{position: V3; rotation?: number; tilt?: number}> = ({position, rotation = 0, tilt = 0.55}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Cyl position={[0, 0.5, 0]} rt={0.12} rb={0.25} h={1.0} seg={16} color="#5a5f6a" />
    <group position={[0, 1.1, 0]} rotation={[-tilt, 0, 0]}>
      <Cyl position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]} rt={0.24} rb={0.18} h={2.2} seg={24} color="#f2f2f6" look={{rough: 0.4}} />
      <Cyl position={[0, 0, 1.52]} rotation={[Math.PI / 2, 0, 0]} rt={0.26} rb={0.26} h={0.08} seg={24} color="#2a2b33" />
      <Cyl position={[0, 0.12, -0.75]} rotation={[0.9, 0, 0]} rt={0.035} rb={0.035} h={0.22} seg={10} color="#2a2b33" />
    </group>
  </group>
);

// ---------------------------------------------------------------- the cosmic balance: pillar, beam, two hanging pans

export const BALANCE = {arm: 2.2, hang: 2.0, top: 4.0};
export const panPos = (side: 1 | -1, angle: number, base: V3 = [0, 0, 0]): V3 => {
  // side -1 = left, 1 = right; positive angle tips the right end down
  const ex = side * BALANCE.arm * Math.cos(angle);
  const ey = BALANCE.top - side * BALANCE.arm * Math.sin(angle);
  return [base[0] + ex, base[1] + ey - BALANCE.hang, base[2]];
};

export const Balance: React.FC<{position?: V3; angle: number; leftPan?: React.ReactNode; rightPan?: React.ReactNode}> = ({position = [0, 0, 0], angle, leftPan, rightPan}) => {
  const gold = {rough: 0.3, metal: 0.6, rim: '#fff3c0', rimK: 0.3};
  const pan = (side: 1 | -1, content: React.ReactNode) => {
    const p = panPos(side, angle);
    return (
      <group key={side} position={p}>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2 + 0.4;
          const bx = Math.cos(a) * 0.9;
          const bz = Math.sin(a) * 0.9;
          const len = Math.hypot(bx, BALANCE.hang, bz);
          return <Cyl key={i} position={[bx / 2, BALANCE.hang / 2, bz / 2]} rotation={[Math.atan2(bz, BALANCE.hang), 0, -Math.atan2(bx, BALANCE.hang)]} rt={0.018} rb={0.018} h={len} seg={6} color="#d8b04a" look={gold} />;
        })}
        <Cyl position={[0, -0.06, 0]} rt={1.0} rb={0.85} h={0.12} seg={36} color="#e8c060" look={gold} />
        <group position={[0, 0.001, 0]}>{content}</group>
      </group>
    );
  };
  return (
    <group position={position}>
      <Cyl position={[0, BALANCE.top / 2, 0]} rt={0.12} rb={0.2} h={BALANCE.top} seg={20} color="#e8c060" look={gold} />
      <Cyl position={[0, 0.1, 0]} rt={0.8} rb={1.0} h={0.2} seg={30} color="#d8b04a" look={gold} />
      <group position={[0, BALANCE.top, 0]} rotation={[0, 0, -angle]}>
        <RBox size={[BALANCE.arm * 2 + 0.2, 0.16, 0.2]} r={0.06} color="#e8c060" look={gold} />
        <Ball scale={0.22} color="#f2d070" look={gold} />
      </group>
      {pan(-1, leftPan)}
      {pan(1, rightPan)}
      {/* the needle at the top shows the balance */}
      <group position={[0, BALANCE.top, 0.12]} rotation={[0, 0, -angle]}>
        <Cone position={[0, 0.55, 0]} r={0.07} h={0.9} seg={10} color="#e8453c" />
      </group>
    </group>
  );
};

export {Ball, Block, Cone, Cyl, Disc, RBox, Ring};
