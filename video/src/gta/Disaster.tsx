import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box, Cone, Ico} from '../scene/parts';
import {V3, clamp01, lerp, rnd} from './cues';

// ---------- the tsunami: one long wall of water with a curling crest, moving inland (+z) ----------

const WAVE_LEN = 900;
export const WAVE_H = 26;

export const Wave: React.FC<{front: number; t: number; color?: string}> = ({front, t, color = '#1f6f8b'}) => {
  const {body, foam} = useMemo(() => {
    // profile in (u, y): u = distance along the travel direction, front at u = 0
    const s = new THREE.Shape();
    s.moveTo(-90, -2);
    s.lineTo(-90, 10);
    s.lineTo(-40, 16);
    s.lineTo(-14, 24);
    s.lineTo(-4, WAVE_H);
    s.lineTo(3, WAVE_H - 1);
    s.lineTo(6, WAVE_H - 4);
    s.lineTo(3, WAVE_H - 6);
    s.lineTo(0, WAVE_H - 9);
    s.lineTo(-1, 12);
    s.lineTo(1, 4);
    s.lineTo(4, -2);
    s.lineTo(-90, -2);
    const g = new THREE.ExtrudeGeometry(s, {depth: WAVE_LEN, bevelEnabled: false, steps: 1});
    g.translate(0, 0, -WAVE_LEN / 2);
    const f = new THREE.Shape();
    f.moveTo(-14, 24.2);
    f.lineTo(-4, WAVE_H + 0.4);
    f.lineTo(3.4, WAVE_H - 0.6);
    f.lineTo(6.5, WAVE_H - 4);
    f.lineTo(5, WAVE_H - 4.5);
    f.lineTo(2.5, WAVE_H - 1.6);
    f.lineTo(-4, WAVE_H - 0.6);
    f.lineTo(-14, 23.4);
    const fg = new THREE.ExtrudeGeometry(f, {depth: WAVE_LEN, bevelEnabled: false, steps: 1});
    fg.translate(0, 0, -WAVE_LEN / 2);
    return {body: g, foam: fg};
  }, []);
  return (
    <group position={[0, 0, front]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh geometry={body}>
        <meshStandardMaterial color={color} emissive="#0e3446" emissiveIntensity={0.6} roughness={0.3} flatShading />
      </mesh>
      <mesh geometry={foam}>
        <meshStandardMaterial color="#e9f4f7" emissive="#8aa8b8" emissiveIntensity={0.35} roughness={0.8} flatShading />
      </mesh>
      {/* spray along the crest */}
      {Array.from({length: 40}).map((_, i) => {
        const x = -WAVE_LEN / 2 + (i + 0.5) * (WAVE_LEN / 40) + Math.sin(t * 2 + i) * 4;
        const up = ((t * 1.3 + rnd(i)) % 1);
        return <Ico key={i} radius={1.2 + rnd(i + 3) * 1.6} position={[5 + up * 4, WAVE_H - 2 + up * 5, -x]} color="#f4fafb" opacity={0.9 * (1 - up)} shadow={false} />;
      })}
      {/* white water at the foot */}
      {Array.from({length: 30}).map((_, i) => (
        <Ico key={`f${i}`} radius={2 + rnd(i + 9) * 2} position={[3 + rnd(i + 2) * 3, 1 + rnd(i + 4) * 2, -(-WAVE_LEN / 2 + (i + 0.5) * (WAVE_LEN / 30))]} scale={[1, 0.6, 1]} color="#dcecf0" shadow={false} />
      ))}
    </group>
  );
};

// ---------- the volcano ----------

export const VOLCANO: V3 = [-170, -0.6, -900];

export const Volcano: React.FC<{erupt: number; t: number}> = ({erupt, t}) => {
  // erupt = seconds since the explosion (negative = before)
  const k = clamp01(erupt / 3);
  const colH = (1 - Math.pow(1 - k, 2)) * 820;
  return (
    <group position={VOLCANO}>
      <Cone radius={330} height={190} position={[0, 95, 0]} color="#3a302c" segments={9} />
      <Cone radius={120} height={60} position={[0, 172, 0]} color="#2b2422" segments={9} />
      {/* glowing crater */}
      <Ico radius={46} position={[0, 200, 0]} scale={[1, 0.25, 1]} color="#ff7a2a" emissive="#ff4a10" emissiveIntensity={erupt > 0 ? 3 : 0.6} shadow={false} />
      {/* lava streams down the slopes */}
      {erupt > 0
        ? [0, 1.3, 2.6, 4.0, 5.1].map((a, i) => {
            const len = Math.min(1, erupt / (2 + i * 0.3)) * 190;
            return (
              <group key={i} rotation={[0, a, 0]}>
                <Box
                  size={[14, 4, len]}
                  position={[0, 196 - len * 0.45, 40 + len / 2]}
                  rotation={[0.52, 0, 0]}
                  color="#ff8a2a"
                  emissive="#ff4a10"
                  emissiveIntensity={2.5}
                  shadow={false}
                />
              </group>
            );
          })
        : null}
      {/* the ash column and its mushroom cap */}
      {erupt > 0
        ? Array.from({length: 26}).map((_, i) => {
            const s = i / 25;
            if (s * 820 > colH) return null;
            const w = lerp(40, 105, s) * (0.9 + 0.2 * Math.sin(t * 0.8 + i));
            return (
              <Ico
                key={i}
                radius={w}
                detail={1}
                position={[Math.sin(i * 1.7) * 30 + s * 60, 200 + s * 820, Math.cos(i * 2.1) * 30]}
                rotation={[i, t * 0.1 + i, 0]}
                color={s < 0.15 ? '#6a3a28' : '#5e5650'}
                emissive={s < 0.25 ? '#ff4a10' : undefined}
                emissiveIntensity={s < 0.25 ? 0.6 * (1 - s * 4) : 0}
              />
            );
          })
        : (
          <Ico radius={50} detail={1} position={[10, 270 + Math.sin(t) * 5, 0]} color="#5a5650" opacity={0.6} />
        )}
      {erupt > 0 && colH > 600
        ? Array.from({length: 10}).map((_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const r = (colH - 600) * 1.2;
            return <Ico key={`c${i}`} radius={110} detail={1} position={[Math.cos(a) * r + 60, 1000 - 40 * Math.sin(i), Math.sin(a) * r]} color="#36322f" />;
          })
        : null}
      {/* lava bombs thrown out of the crater */}
      {erupt > 0
        ? Array.from({length: 18}).map((_, i) => {
            const life = 2.4;
            const age = (erupt + rnd(i) * life) % life;
            const a = rnd(i + 1) * Math.PI * 2;
            const sp = 80 + rnd(i + 2) * 120;
            const vy = 160 + rnd(i + 3) * 140;
            const y = 200 + vy * age - 0.5 * 120 * age * age;
            if (y < 120) return null;
            return (
              <Ico
                key={`b${i}`}
                radius={8 + rnd(i + 4) * 8}
                position={[Math.cos(a) * sp * age, y, Math.sin(a) * sp * age]}
                color="#ffb04a"
                emissive="#ff6a1a"
                emissiveIntensity={3}
                shadow={false}
              />
            );
          })
        : null}
    </group>
  );
};

// the blast ring running over the sea
export const ShockRing: React.FC<{center: V3; r: number; opacity: number}> = ({center, r, opacity}) =>
  r > 1 && opacity > 0 ? (
    <mesh position={[center[0], center[1] + 0.6, center[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[r * 0.96, r, 96]} />
      <meshBasicMaterial color="#f0e6dc" transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  ) : null;

// ---------- particles that fall around the camera: ash or snow ----------

export const Fall: React.FC<{center: V3; t: number; color: string; size: number; n?: number; box?: V3; speed?: number; wind?: number; opacity?: number}> = ({
  center,
  t,
  color,
  size,
  n = 900,
  box = [40, 24, 40],
  speed = 1.5,
  wind = 0.6,
  opacity = 0.9,
}) => {
  const base = useMemo(() => {
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      a[i * 3] = rnd(i * 3 + 1);
      a[i * 3 + 1] = rnd(i * 3 + 2);
      a[i * 3 + 2] = rnd(i * 3 + 3);
    }
    return a;
  }, [n]);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return g;
  }, [n]);
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < n; i++) {
    const fy = (base[i * 3 + 1] - (t * speed * (0.7 + 0.6 * base[i * 3])) / box[1]) % 1;
    const fx = (base[i * 3] + (t * wind) / box[0] + 1) % 1;
    pos.setXYZ(
      i,
      center[0] + (fx - 0.5) * box[0] + Math.sin(t * 1.3 + i) * 0.3,
      center[1] + ((fy + 1) % 1) * box[1] - box[1] / 2,
      center[2] + (base[i * 3 + 2] - 0.5) * box[2],
    );
  }
  pos.needsUpdate = true;
  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial color={color} size={size} sizeAttenuation transparent opacity={opacity} depthWrite={false} />
    </points>
  );
};

// ---------- a lava bomb falling on a car, with a smoke trail ----------

export const LavaBomb: React.FC<{from: V3; to: V3; k: number}> = ({from, to, k}) => {
  if (k <= 0 || k >= 1) return null;
  const p: V3 = [lerp(from[0], to[0], k), lerp(from[1], to[1], k * k), lerp(from[2], to[2], k)];
  return (
    <group>
      <Ico radius={0.9} detail={1} position={p} color="#ffb04a" emissive="#ff5a10" emissiveIntensity={3} shadow={false} />
      {Array.from({length: 8}).map((_, i) => {
        const kk = Math.max(0, k - (i + 1) * 0.035);
        const q: V3 = [lerp(from[0], to[0], kk), lerp(from[1], to[1], kk * kk), lerp(from[2], to[2], kk)];
        return <Ico key={i} radius={0.6 + i * 0.18} position={q} color={i < 2 ? '#ff7a2a' : '#2a2422'} emissive={i < 2 ? '#ff4a10' : undefined} emissiveIntensity={i < 2 ? 2 : 0} opacity={0.85 - i * 0.09} shadow={false} />;
      })}
    </group>
  );
};

// pieces thrown out of a hit
export const Burst: React.FC<{at: V3; age: number; seed: number; color?: string; n?: number; speed?: number}> = ({at, age, seed, color = '#2a2422', n = 10, speed = 7}) => {
  if (age < 0 || age > 2) return null;
  return (
    <>
      {Array.from({length: n}).map((_, i) => {
        const a = rnd(seed + i) * Math.PI * 2;
        const up = 4 + rnd(seed + i + 50) * 8;
        const sp = speed * (0.4 + rnd(seed + i + 90));
        const y = at[1] + up * age - 4.9 * age * age;
        if (y < 0.05) return null;
        return (
          <Box
            key={i}
            size={[0.25, 0.18, 0.3]}
            position={[at[0] + Math.cos(a) * sp * age, y, at[2] + Math.sin(a) * sp * age]}
            rotation={[age * 9 + i, age * 7, i]}
            color={i % 3 === 0 ? '#ff8a2a' : color}
            emissive={i % 3 === 0 ? '#ff4a10' : undefined}
            emissiveIntensity={i % 3 === 0 ? 2 : 0}
          />
        );
      })}
    </>
  );
};
