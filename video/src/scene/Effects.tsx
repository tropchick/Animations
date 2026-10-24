import React, {useMemo} from 'react';
import * as THREE from 'three';
import {random} from 'remotion';
import {Box, Cone, Cyl, Ico} from './parts';
import {T, clamp01, ramp, worldTime} from '../timeline';

type V3 = [number, number, number];

// ---------- Sky ----------

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// The blue drains from the horizon upward as the air disappears (uVacuum 0 -> 1).
const skyFragment = /* glsl */ `
  uniform float uVacuum;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, 0.0, 1.0);
    vec3 sky = mix(uHorizon, uZenith, pow(h, 0.6));
    float k = smoothstep(0.0, 1.0, (uVacuum * 1.6 - h) / 0.35);
    vec3 space = vec3(0.012, 0.014, 0.022);
    gl_FragColor = vec4(mix(sky, space, k), 1.0);
  }
`;

export const SkyDome: React.FC<{vacuum: number}> = ({vacuum}) => {
  const uniforms = useMemo(
    () => ({
      uVacuum: {value: 0},
      uZenith: {value: new THREE.Color('#86b4dd')},
      uHorizon: {value: new THREE.Color('#d6e6f1')},
    }),
    [],
  );
  return (
    <mesh renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[400, 32, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        uniforms-uVacuum-value={vacuum}
        vertexShader={skyVertex}
        fragmentShader={skyFragment}
      />
    </mesh>
  );
};

export const Stars: React.FC<{opacity: number}> = ({opacity}) => {
  const geometry = useMemo(() => {
    const n = 700;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = random(`star-u-${i}`);
      const w = random(`star-w-${i}`);
      const theta = u * Math.PI * 2;
      const y = 0.04 + Math.pow(w, 0.8) * 0.96;
      const r = Math.sqrt(1 - y * y);
      pos[i * 3] = Math.cos(theta) * r * 380;
      pos[i * 3 + 1] = y * 380;
      pos[i * 3 + 2] = Math.sin(theta) * r * 380;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  if (opacity <= 0.001) return null;
  return (
    <points geometry={geometry} renderOrder={-9}>
      <pointsMaterial color="#ffffff" size={2.6} sizeAttenuation={false} transparent opacity={opacity} depthWrite={false} />
    </points>
  );
};

// ---------- Fire ----------

export const Flame: React.FC<{position: V3; t: number; visible: boolean}> = ({position, t, visible}) => {
  if (!visible) return null;
  const tongues: [number, number, string][] = [
    [-0.22, 0.0, '#ff8a2a'],
    [0.0, 0.7, '#ffb43a'],
    [0.2, 1.9, '#ff7a22'],
    [-0.1, 2.7, '#ffd25a'],
    [0.12, 3.6, '#ffc040'],
  ];
  return (
    <group position={position}>
      {tongues.map(([x, ph, c], i) => {
        const s = 0.75 + 0.25 * Math.sin(t * 11 + ph * 3) + 0.1 * Math.sin(t * 23 + ph);
        return (
          <Cone
            key={i}
            radius={0.07}
            height={0.32 * s}
            segments={5}
            position={[x, 0.16 * s, (i % 2) * 0.08 - 0.04]}
            color={c}
            emissive={c}
            emissiveIntensity={1.4}
            shadow={false}
          />
        );
      })}
    </group>
  );
};

// ---------- Birds ----------

const Bird: React.FC<{position: V3; heading: number; flap: number; tumble: number}> = ({
  position,
  heading,
  flap,
  tumble,
}) => (
  <group position={position} rotation={[tumble, heading, tumble * 0.6]} scale={1.6}>
    <Box size={[0.08, 0.07, 0.26]} color="#3a3633" shadow={false} />
    <group position={[0.04, 0.01, 0]} rotation={[0, 0, flap]}>
      <Box size={[0.3, 0.02, 0.12]} position={[0.15, 0, 0]} color="#4a4541" shadow={false} />
    </group>
    <group position={[-0.04, 0.01, 0]} rotation={[0, 0, -flap]}>
      <Box size={[0.3, 0.02, 0.12]} position={[-0.15, 0, 0]} color="#4a4541" shadow={false} />
    </group>
  </group>
);

export const Birds: React.FC<{v: number}> = ({v}) => {
  const wt = worldTime(v);
  const flock = [0, 1, 2, 3, 4];
  return (
    <>
      {flock.map((i) => {
        const r = 3 + random(`bird-r-${i}`) * 3;
        const h = 7 + random(`bird-h-${i}`) * 4;
        const speed = 0.35 + random(`bird-s-${i}`) * 0.15;
        const phase = random(`bird-p-${i}`) * Math.PI * 2;
        const cx = -3 + random(`bird-cx-${i}`) * 6;
        const cz = -5 + random(`bird-cz-${i}`) * 3;
        // The flock keeps gliding on the path it had when the air vanished.
        const tFly = Math.min(wt, T.airGone);
        const a = phase + tFly * speed;
        let x = cx + Math.cos(a) * r;
        let z = cz + Math.sin(a) * r;
        let y = h;
        let flap = Math.sin(wt * 9 + phase) * 0.6;
        let tumble = 0;
        if (wt > T.airGone) {
          // No air: no lift. The fall is drawn slowed down for the slow motion.
          const d = Math.min(wt, T.airGone + 5) - T.airGone;
          const vx = -Math.sin(a) * r * speed;
          const vz = Math.cos(a) * r * speed;
          x += vx * d * 0.12;
          z += vz * d * 0.12;
          y = Math.max(0.12, h - 0.5 * ((h - 0.1) / 13) * d * d * 1.05);
          flap = 0.25;
          tumble = y <= 0.12 ? 0 : d * 0.7;
          if (v > T.airBack + 0.8) {
            // Air is back: the birds flap and fly off.
            const k = v - (T.airBack + 0.8);
            y += k * k * 0.9 + k * 1.5;
            x += k * 2.5;
            flap = Math.sin(wt * 12 + phase) * 0.7;
            tumble = 0;
          }
        }
        return <Bird key={i} position={[x, y, z]} heading={-a} flap={flap} tumble={tumble} />;
      })}
    </>
  );
};

// ---------- Airplane ----------

export const Airplane: React.FC<{v: number}> = ({v}) => {
  const wt = worldTime(v);
  const fall = clamp01((Math.min(wt, T.airGone + 5) - T.airGone) / 5);
  const recover = ramp(v, T.airBack, T.airBack + 8);
  const x = -32 + wt * 1.15;
  const y = 42 - fall * fall * 9 + recover * 2;
  const pitch = -0.45 * Math.sin(Math.PI * 0.5 * Math.min(1, fall * 1.4)) * (1 - recover);
  return (
    <group position={[x, y, -75]} rotation={[0, Math.PI / 2, 0]} scale={2.4}>
      <group rotation={[pitch, 0, 0]}>
        <Cyl rTop={0.35} rBottom={0.35} height={4} segments={8} rotation={[Math.PI / 2, 0, 0]} color="#f4f4f4" shadow={false} />
        <Cone radius={0.35} height={0.8} segments={8} position={[0, 0, 2.4]} rotation={[Math.PI / 2, 0, 0]} color="#f4f4f4" shadow={false} />
        <Box size={[5, 0.08, 0.9]} position={[0, -0.05, 0.2]} color="#e2e6ea" shadow={false} />
        <Box size={[1.8, 0.06, 0.5]} position={[0, 0.05, -1.8]} color="#e2e6ea" shadow={false} />
        <Box size={[0.08, 0.9, 0.6]} position={[0, 0.5, -1.8]} color="#c94a3a" shadow={false} />
      </group>
    </group>
  );
};

// ---------- Water ----------

// 0..1 how hard the water boils. Boiling builds up during the vacuum and stops when air returns.
export const boilAmount = (v: number) => {
  if (v >= T.airBack) return 1 - ramp(v, T.airBack, T.airBack + 0.8);
  return ramp(v, 22, 32);
};

const Bubbles: React.FC<{
  v: number;
  count: number;
  seed: string;
  area: [number, number];
  maxR: number;
  amount: number;
  rise?: number;
  color?: string;
}> = ({v, count, seed, area, maxR, amount, rise = 0, color = '#e9f8ff'}) => {
  if (amount <= 0.001) return null;
  const items = [];
  for (let i = 0; i < count; i++) {
    if (random(`${seed}-on-${i}`) > amount) continue;
    const period = 1.6 + random(`${seed}-p-${i}`) * 1.6;
    const cyc = ((v / period + random(`${seed}-o-${i}`)) % 1 + 1) % 1;
    const x = (random(`${seed}-x-${i}`) - 0.5) * area[0];
    const z = (random(`${seed}-z-${i}`) - 0.5) * area[1];
    const r = maxR * (0.5 + 0.5 * random(`${seed}-r-${i}`)) * Math.sin(Math.PI * Math.min(1, cyc * 1.05));
    items.push(
      <Ico key={i} radius={Math.max(0.001, r)} position={[x, rise * cyc, z]} color={color} shadow={false} opacity={0.85} />,
    );
  }
  return <>{items}</>;
};

const Steam: React.FC<{v: number; seed: string; area: [number, number]; amount: number; count: number; height: number}> = ({
  v,
  seed,
  area,
  amount,
  count,
  height,
}) => {
  if (amount <= 0.001) return null;
  const items = [];
  for (let i = 0; i < count; i++) {
    const period = 5 + random(`${seed}-sp-${i}`) * 3;
    const cyc = ((v / period + random(`${seed}-so-${i}`)) % 1 + 1) % 1;
    const x = (random(`${seed}-sx-${i}`) - 0.5) * area[0];
    const z = (random(`${seed}-sz-${i}`) - 0.5) * area[1];
    const s = 0.15 + cyc * 0.45;
    const op = amount * 0.18 * Math.sin(Math.PI * cyc);
    items.push(
      <Ico key={i} radius={s} detail={0} position={[x, 0.2 + cyc * height, z]} color="#ffffff" shadow={false} opacity={op} />,
    );
  }
  return <>{items}</>;
};

export const Pool: React.FC<{position: V3; size: [number, number]; v: number}> = ({position, size, v}) => {
  const boil = boilAmount(v);
  const steam = v < T.airBack ? boil : 1 - ramp(v, T.airBack, T.end);
  const [w, d] = size;
  const rim = 0.35;
  return (
    <group position={position}>
      <Box size={[w + rim * 2, 0.12, rim]} position={[0, 0.06, -(d + rim) / 2]} color="#efede7" />
      <Box size={[w + rim * 2, 0.12, rim]} position={[0, 0.06, (d + rim) / 2]} color="#efede7" />
      <Box size={[rim, 0.12, d]} position={[-(w + rim) / 2, 0.06, 0]} color="#efede7" />
      <Box size={[rim, 0.12, d]} position={[(w + rim) / 2, 0.06, 0]} color="#efede7" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#5fc0d8" roughness={0.25} emissive="#1f6b80" emissiveIntensity={0.25} />
      </mesh>
      <group position={[0, 0.05, 0]}>
        <Bubbles v={v} count={90} seed="pool" area={[w - 0.2, d - 0.2]} maxR={0.12} amount={boil} />
      </group>
      <Steam v={v} seed="pool" area={[w, d]} amount={steam} count={22} height={3.2} />
    </group>
  );
};

export const LemonadeTable: React.FC<{position: V3; v: number}> = ({position, v}) => {
  const boil = boilAmount(v);
  return (
    <group position={position}>
      <Cyl rTop={0.32} rBottom={0.32} height={0.05} segments={10} position={[0, 0.55, 0]} color="#ffffff" />
      <Cyl rTop={0.04} rBottom={0.04} height={0.55} segments={6} position={[0, 0.27, 0]} color="#d7d7d7" />
      <group position={[0, 0.58, 0]}>
        {/* glass, lemonade, ice */}
        <Cyl rTop={0.065} rBottom={0.055} height={0.2} segments={10} position={[0, 0.1, 0]} color="#dff3fb" opacity={0.35} shadow={false} />
        <Cyl rTop={0.058} rBottom={0.05} height={0.15} segments={10} position={[0, 0.08, 0]} color="#f3df6e" opacity={0.85} shadow={false} />
        <Box size={[0.04, 0.04, 0.04]} position={[0.015, 0.15, 0.01]} rotation={[0.3, 0.5, 0]} color="#f4fbff" opacity={0.85} shadow={false} />
        <Box size={[0.035, 0.035, 0.035]} position={[-0.02, 0.145, -0.015]} rotation={[0.6, 0.2, 0.4]} color="#f4fbff" opacity={0.85} shadow={false} />
        <Cyl rTop={0.006} rBottom={0.006} height={0.28} segments={5} position={[0.025, 0.2, 0]} rotation={[0, 0, -0.25]} color="#e04a5a" shadow={false} />
        <group position={[0, 0.03, 0]}>
          <Bubbles v={v} count={26} seed="glass" area={[0.08, 0.08]} maxR={0.012} amount={boil} rise={0.12} color="#fffbe0" />
        </group>
        <group position={[0, 0.16, 0]}>
          <Bubbles v={v * 1.3} count={14} seed="glass-top" area={[0.09, 0.09]} maxR={0.014} amount={boil} color="#fff7c8" />
        </group>
      </group>
    </group>
  );
};

export const TongueBubbles: React.FC<{v: number}> = ({v}) => (
  <group position={[0, 0.012, 0.05]}>
    <Bubbles v={v} count={12} seed="tongue" area={[0.06, 0.08]} maxR={0.012} amount={boilAmount(v)} />
  </group>
);

// ---------- Balloon ----------

export const BALLOON_POP = 26.5;

export const Balloon: React.FC<{v: number; counterPitch: number; scaleFix: number}> = ({v, counterPitch, scaleFix}) => {
  const grow = 1 + ramp(v, 21, BALLOON_POP, (t) => t * t);
  const popped = v >= BALLOON_POP && v < 400;
  const bob = Math.sin(worldTime(v) * 1.6) * 0.05;
  const stringLen = 1.0;
  if (!popped) {
    return (
      <group rotation={[counterPitch, 0, 0]} scale={scaleFix}>
        <group rotation={[bob, 0, bob * 0.6]}>
          <Cyl rTop={0.004} rBottom={0.004} height={stringLen} segments={4} position={[0, stringLen / 2, 0]} color="#f2f2f2" shadow={false} />
          <Ico radius={0.24 * grow} detail={1} position={[0, stringLen + 0.24 * grow, 0]} scale={[1, 1.15, 1]} color="#e23b3b" />
          <Cone radius={0.03} height={0.05} segments={5} position={[0, stringLen + 0.01, 0]} color="#c42e2e" shadow={false} />
        </group>
      </group>
    );
  }
  // After the pop: rubber pieces drift outward, the string hangs down.
  const d = (v - BALLOON_POP) / 9;
  const center: V3 = [0, stringLen + 0.48, 0];
  const pieces = [0, 1, 2, 3, 4, 5, 6, 7];
  const droop = ramp(v, BALLOON_POP, BALLOON_POP + 5);
  return (
    <group rotation={[counterPitch, 0, 0]} scale={scaleFix}>
      <group rotation={[0, 0, Math.PI * droop * 0.95]}>
        <Cyl rTop={0.004} rBottom={0.004} height={stringLen * 0.6} segments={4} position={[0, stringLen * 0.3, 0]} color="#f2f2f2" shadow={false} />
      </group>
      {pieces.map((i) => {
        const a = (i / pieces.length) * Math.PI * 2 + random(`piece-a-${i}`);
        const up = random(`piece-u-${i}`) * 2 - 0.6;
        const sp = 1.6 + random(`piece-s-${i}`);
        const x = center[0] + Math.cos(a) * sp * d;
        const z = center[2] + Math.sin(a) * sp * d;
        const y = Math.max(-1.0, center[1] + up * sp * d - 4.9 * d * d);
        return (
          <Cyl
            key={i}
            rTop={0.09}
            rBottom={0.09}
            height={0.01}
            segments={3}
            position={[x, y, z]}
            rotation={[d * 9 + i, d * 7, i]}
            color="#e23b3b"
            shadow={false}
          />
        );
      })}
    </group>
  );
};

// ---------- Gust of returning air ----------

export const Leaves: React.FC<{v: number}> = ({v}) => {
  if (v < T.airBack || v > T.airBack + 6) return null;
  const d = v - T.airBack;
  const items = [];
  for (let i = 0; i < 40; i++) {
    const x0 = (random(`leaf-x-${i}`) - 0.5) * 16;
    const z0 = 6 + random(`leaf-z-${i}`) * 6;
    const y0 = 0.3 + random(`leaf-y-${i}`) * 2.5;
    const sp = 4 + random(`leaf-s-${i}`) * 4;
    const z = z0 - sp * d * 1.4;
    if (z < -9) continue;
    const x = x0 * (1 - d * 0.08) + Math.sin(d * 3 + i) * 0.4;
    const y = y0 + Math.sin(d * 4 + i * 2) * 0.5 + d * 0.3;
    items.push(
      <Cyl key={i} rTop={0.09} rBottom={0.09} height={0.01} segments={3} position={[x, y, z]} rotation={[d * 8 + i, d * 6, i]} color={i % 3 ? '#6aa955' : '#8cbf5a'} shadow={false} />,
    );
  }
  return <>{items}</>;
};

export const ChipBag: React.FC<{position: V3; v: number}> = ({position, v}) => {
  const puff = v < T.airBack ? ramp(v, 21, 30) : 1 - ramp(v, T.airBack, T.airBack + 0.6);
  return (
    <group position={position} rotation={[0, 0.4, 0]}>
      <Box size={[0.26, 0.34, 0.07]} position={[0, 0.17, 0]} scale={[1 + 0.15 * puff, 1 + 0.05 * puff, 1 + 2.4 * puff]} color="#e9a23b" />
      <Box size={[0.27, 0.03, 0.03]} position={[0, 0.345, 0]} color="#c7832a" shadow={false} />
    </group>
  );
};
