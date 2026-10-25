import React, {useMemo} from 'react';
import {random} from 'remotion';
import {AdditiveBlending, CanvasTexture, Color, DoubleSide, Quaternion, RepeatWrapping, Vector3} from 'three';
import {V3, lerp, ramp, smooth} from '../cues';
import {Box, Cyl, DARK_STEEL, Glow, Ico, Mat, RUBBER, STEEL} from '../parts';
import {Gleb, GlebPose, SOLDIER_LOOK} from '../Gleb';
import {MASS, useTarget} from '../Hall';
import {CAMPUS_X, THIRD} from '../ep2/Campus';
import {MassField, blob, mound} from '../ep2/Mass';

// The cordon around the two grey mounds that were «Ковыль» and «Осока», in the campus' local metres.
// Centre of the eaten ground and the rings around it:
export const CENTER: V3 = [0, 0, -10];
export const WALL_R = 41;
const FENCE_R = 47;
const TRUCK_R = 53;
const at = (a: number, r: number, y = 0): V3 => [CENTER[0] + Math.cos(a) * r, y, CENTER[2] + Math.sin(a) * r];

const OLIVE: Mat = {color: '#3d433c', rough: 0.85, metal: 0.1};
const OLIVE_DARK: Mat = {color: '#2f342f', rough: 0.9};
const CANVAS: Mat = {color: '#4a5046', rough: 1};
const CONCRETE: Mat = {color: '#7b8186', rough: 0.95};
const GREY_MASS: Mat = {...MASS, metal: 0.35, rough: 0.42, env: 0.55};

// ---------------------------------------------------------------- the mass on day 2

const dayHeight = (x: number, z: number) => {
  const b = blob(x, z, CENTER[0], CENTER[2], 38.5);
  if (b >= 1) return -1;
  return Math.max(0.08 + 0.45 * (1 - b), mound(x, z, 0, 7, 17, 11, 8), mound(x, z, 0, -26, 15, 13, 7.5));
};

// in the evening it presses against the wall, climbs it and spills over in tongues
const spillAt = (a: number) => Math.pow(0.5 + 0.5 * Math.sin(a * 5 + 0.7), 2);
export const EVE_TOP = 2.15;
const eveHeight = (x: number, z: number) => {
  const dx = x - CENTER[0];
  const dz = z - CENTER[2];
  const r = Math.hypot(dx, dz);
  const a = Math.atan2(dz, dx);
  const sp = spillAt(a);
  const edge = WALL_R + 0.6 + 4.2 * sp;
  if (r > edge) return -1;
  // against the wall it stands lower than the slumped blocks, except in the tongues that go over them
  const top = 1.25 + EVE_TOP * 0.7 * sp;
  const inner = Math.max(0.1 + 0.5 * (1 - r / 41), mound(x, z, 0, 7, 17.5, 11.5, 8.3), mound(x, z, 0, -26, 15.5, 13.5, 7.8));
  if (r < WALL_R + 0.6) return Math.max(inner, top * smooth(ramp(r, 33, WALL_R)) + 0.12 * Math.sin(a * 17));
  if (sp < 0.25) return -1;
  return top * Math.pow(1 - (r - WALL_R - 0.6) / (edge - WALL_R - 0.6), 0.55);
};

export const Mass3: React.FC<{v: number; evening: boolean}> = ({v, evening}) => (
  <MassField
    id={evening ? 'ep3-eve' : 'ep3-day'}
    size={[104, 104]}
    seg={[84, 84]}
    height={evening ? eveHeight : dayHeight}
    v={v}
    ripple={0.05}
    jitter={0.4}
    position={[0, 0, 0]}
    m={GREY_MASS}
    shadow
  />
);

// ---------------------------------------------------------------- concrete wall

const insideThird = (p: V3) => Math.abs(p[0] - THIRD.x) < THIRD.w / 2 + 2.5 && Math.abs(p[2] - THIRD.z) < THIRD.d / 2 + 2.5;
const BLOCK_L = 3.0;
const BLOCKS = (() => {
  const n = Math.floor((2 * Math.PI * WALL_R) / (BLOCK_L + 0.06));
  return Array.from({length: n})
    .map((_, i) => (i / n) * Math.PI * 2)
    .filter((a) => !insideThird(at(a, WALL_R)));
})();
export const CRANE_A = 0.42;

// state: 'day' clean concrete, 3 m (one gap where the crane lowers the last block), 'evening' grey and slumped
export const Wall: React.FC<{state: 'day' | 'evening'; drop?: number}> = ({state, drop = 1}) => (
  <group>
    {BLOCKS.map((a, i) => {
      const p = at(a, WALL_R);
      const rot: V3 = [0, -a + Math.PI / 2, 0];
      if (state === 'day') {
        const last = Math.abs(a - CRANE_A) < 0.035;
        const h = 3;
        const y = last ? lerp(9, h / 2, smooth(drop)) : h / 2;
        return <Box key={i} size={[BLOCK_L, h, 0.9]} position={[p[0], y, p[2]]} rotation={rot} m={CONCRETE} />;
      }
      const h = 2.0 + random(`wall-h-${i}`) * 0.5;
      const sag = random(`wall-s-${i}`);
      return (
        <group key={i} position={p} rotation={rot}>
          <Box size={[BLOCK_L, h, 0.9]} position={[0, h / 2, 0]} m={{color: '#6f767c', rough: 0.8, metal: 0.15}} />
          <Ico r={1} detail={1} position={[0.2 * (sag - 0.5), h - 0.05, 0.05]} scale={[1.7, 0.32 + 0.2 * sag, 0.62]} m={GREY_MASS} />
        </group>
      );
    })}
  </group>
);

// ---------------------------------------------------------------- mesh fence

const useMeshTexture = () =>
  useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const g = c.getContext('2d')!;
    g.clearRect(0, 0, 64, 64);
    g.strokeStyle = '#aab3ba';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(64, 64);
    g.moveTo(64, 0);
    g.lineTo(0, 64);
    g.stroke();
    const t = new CanvasTexture(c);
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.repeat.set(12, 8);
    return t;
  }, []);

const FENCE_N = 96;
export const MeshFence: React.FC = () => {
  const tex = useMeshTexture();
  return (
    <group>
      {Array.from({length: FENCE_N}).map((_, i) => {
        const a = (i / FENCE_N) * Math.PI * 2;
        if (insideThird(at(a, FENCE_R))) return null;
        const p = at(a, FENCE_R);
        const len = (2 * Math.PI * FENCE_R) / FENCE_N;
        return (
          <group key={i} position={p} rotation={[0, -a + Math.PI / 2, 0]}>
            <mesh position={[0, 1.15, 0]}>
              <planeGeometry args={[len - 0.1, 2.1]} />
              <meshStandardMaterial map={tex} alphaTest={0.4} transparent={false} side={DoubleSide} metalness={0.6} roughness={0.4} color="#c0c7cc" />
            </mesh>
            <Cyl r={0.04} h={2.4} seg={6} position={[len / 2, 1.2, 0]} m={DARK_STEEL} shadow={false} />
            <Box size={[0.5, 0.12, 0.5]} position={[len / 2, 0.06, 0]} m={CONCRETE} shadow={false} />
          </group>
        );
      })}
    </group>
  );
};

// ---------------------------------------------------------------- trucks

export const Truck: React.FC<{p: V3; rot: number; lights?: boolean}> = ({p, rot, lights}) => (
  <group position={p} rotation={[0, rot, 0]}>
    <Box size={[2.4, 0.5, 7.6]} position={[0, 0.95, 0]} m={OLIVE_DARK} />
    {/* cab and hood */}
    <Box size={[2.4, 1.8, 1.9]} position={[0, 2.0, 2.55]} m={OLIVE} />
    <Box size={[2.2, 1.0, 1.2]} position={[0, 1.6, 3.95]} m={OLIVE} />
    <Box size={[2.1, 0.7, 0.04]} position={[0, 2.45, 3.51]} m={{color: '#1b2126', metal: 0.6, rough: 0.2, env: 1.2}} shadow={false} />
    {/* bed with a canvas cover */}
    <Box size={[2.5, 0.5, 5.0]} position={[0, 1.45, -1.3]} m={OLIVE} />
    <Box size={[2.55, 2.0, 5.0]} position={[0, 2.7, -1.3]} m={CANVAS} />
    {[[-1.15, 3.2], [1.15, 3.2], [-1.15, -0.6], [1.15, -0.6], [-1.15, -2.4], [1.15, -2.4]].map(([x, z]) => (
      <Cyl key={`${x}${z}`} r={0.55} h={0.4} seg={10} position={[x, 0.55, z]} rotation={[0, 0, Math.PI / 2]} m={RUBBER} shadow={false} />
    ))}
    {lights ? (
      <>
        {[-0.75, 0.75].map((x) => (
          <Glow key={x} size={[0.28, 0.2, 0.04]} position={[x, 1.55, 4.57]} color="#e9eef5" />
        ))}
        <pointLight position={[0, 1.4, 6]} color="#dfe8f3" intensity={18} distance={20} decay={2} />
      </>
    ) : null}
  </group>
);

const TRUCK_AS = [0.15, 0.6, 1.05, 1.5, 2.0, 2.45, 2.9, 3.35, 3.8, 4.25, 4.7, 5.2, 5.7];

// ---------------------------------------------------------------- searchlights

// yaw is measured like the ring angle; the beam is drawn as a faint cone and lights the mass with a spot
const Searchlight: React.FC<{p: V3; aim: V3; beam?: number}> = ({p, aim, beam = 1}) => {
  const target = useTarget([aim[0] + CAMPUS_X, aim[1], aim[2]]);
  const d: V3 = [aim[0] - p[0], aim[1] - (p[1] + 2.2), aim[2] - p[2]];
  const len = Math.hypot(...d);
  const yaw = Math.atan2(d[0], d[2]);
  const pitch = Math.acos(d[1] / len);
  const L = Math.min(len * 1.15, 110);
  return (
    <group position={p}>
      {[-1, 1, 0].map((s, i) => (
        <Cyl key={i} r={0.04} h={2.3} seg={5} position={[s * 0.45 * (i < 2 ? 1 : 0), 1.05, i === 2 ? -0.45 : 0.25]} rotation={[i === 2 ? 0.38 : -0.2, 0, -s * 0.4]} m={DARK_STEEL} shadow={false} />
      ))}
      <group position={[0, 2.2, 0]} rotation={[0, yaw, 0]}>
        <group rotation={[pitch, 0, 0]}>
          <Cyl r={0.42} h={0.7} seg={14} position={[0, 0.1, 0]} m={DARK_STEEL} shadow={false} />
          <Cyl r={0.36} h={0.02} seg={14} position={[0, 0.46, 0]} m={{color: '#f2f6ff', emissive: '#f2f6ff', glow: 3}} shadow={false} />
          {beam > 0 ? (
            <mesh position={[0, 0.46 + L / 2, 0]}>
              <cylinderGeometry args={[0.36 + L * 0.06, 0.36, L, 20, 1, true]} />
              <meshBasicMaterial color="#9fb4cc" transparent opacity={0.06 * beam} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} fog={false} toneMapped={false} />
            </mesh>
          ) : null}
          {beam > 0 ? (
            <mesh position={[0, 0.46 + L * 0.35, 0]}>
              <cylinderGeometry args={[0.36 + L * 0.7 * 0.03, 0.3, L * 0.7, 16, 1, true]} />
              <meshBasicMaterial color="#b9cce0" transparent opacity={0.045 * beam} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} fog={false} toneMapped={false} />
            </mesh>
          ) : null}
        </group>
      </group>
      <spotLight position={[0, 2.2, 0]} target={target} color="#dfe9f5" intensity={0.7 * beam} distance={160} angle={0.075} penumbra={0.5} decay={0} />
    </group>
  );
};

const LIGHTS = [
  {a: 0.25, r: 50, cx: 0, cz: 7, sx: 9, sp: 0.21, ph: 0},
  {a: 1.3, r: 50, cx: 0, cz: -26, sx: 8, sp: 0.17, ph: 1.7},
  {a: 2.3, r: 50, cx: 0, cz: 7, sx: 10, sp: 0.23, ph: 3.1},
  {a: 3.4, r: 50, cx: 0, cz: -26, sx: 9, sp: 0.19, ph: 0.6},
  {a: 4.3, r: 50, cx: -2, cz: -10, sx: 12, sp: 0.15, ph: 2.4},
  {a: 5.2, r: 50, cx: 0, cz: -26, sx: 8, sp: 0.2, ph: 4.0},
  {a: 5.9, r: 50, cx: 0, cz: 7, sx: 8, sp: 0.18, ph: 5.1},
];

// ---------------------------------------------------------------- soldiers

const STAND: GlebPose = {armL: [0.1, 0.08], armR: [0.1, -0.08], head: [0.05, 0], stoop: 0.03};
export const Soldier: React.FC<{p: V3; rot: number; pose?: GlebPose; rightHand?: React.ReactNode}> = ({p, rot, pose = STAND, rightHand}) => (
  <Gleb position={p} rotation={rot} look={SOLDIER_LOOK} pose={pose} rightHand={rightHand} />
);

// a cluster at the east checkpoint, looking at the mounds (rotation -π/2 faces -x)
const GUARDS: [number, number, number][] = [
  [51.8, -4.2, 0.1],
  [53.0, -6.3, -0.15],
  [51.2, -8.4, 0.05],
  [52.4, -10.6, 0.25],
  [50.9, -12.9, -0.1],
  [52.7, -15.0, 0.15],
];

// ---------------------------------------------------------------- crane

const Crane: React.FC<{drop: number}> = ({drop}) => {
  const base = at(CRANE_A, WALL_R + 9);
  const tip = at(CRANE_A, WALL_R + 0.3, 16);
  const yaw = Math.atan2(tip[0] - base[0], tip[2] - base[2]);
  const pivot: V3 = [base[0], 3.2, base[2]];
  const dx = Math.hypot(tip[0] - pivot[0], tip[2] - pivot[2]);
  const dy = tip[1] - pivot[1];
  const boom = Math.hypot(dx, dy);
  const block = lerp(9, 1.5, smooth(drop));
  const boomQ = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(tip[0] - pivot[0], dy, tip[2] - pivot[2]).normalize());
  return (
    <group>
      <group position={base} rotation={[0, yaw, 0]}>
        <Box size={[2.8, 1.4, 9]} position={[0, 1.2, -1]} m={{color: '#8c8a5a', rough: 0.8}} />
        <Box size={[2.6, 1.6, 2.2]} position={[0, 2.4, -4.5]} m={{color: '#8c8a5a', rough: 0.8}} />
        <Box size={[3.2, 1.4, 3.2]} position={[0, 2.6, 0]} m={{color: '#77754b', rough: 0.8}} />
        {[-3.6, -1.8, 1.6, 3.2].map((z) =>
          [-1.3, 1.3].map((x) => <Cyl key={`${x}${z}`} r={0.6} h={0.45} seg={10} position={[x, 0.6, z]} rotation={[0, 0, Math.PI / 2]} m={RUBBER} shadow={false} />),
        )}
      </group>
      {/* the boom, from the turret to the hook */}
      <group position={[(pivot[0] + tip[0]) / 2, (pivot[1] + tip[1]) / 2, (pivot[2] + tip[2]) / 2]} quaternion={boomQ}>
        <Box size={[0.7, boom, 0.7]} m={{color: '#a29f63', rough: 0.7}} />
      </group>
      {/* the hook and the last block */}
      <Cyl r={0.045} h={tip[1] - block - 1.5} seg={5} position={[tip[0], (tip[1] + block + 1.5) / 2, tip[2]]} m={DARK_STEEL} shadow={false} />
      <Box size={[0.5, 0.4, 0.3]} position={[tip[0], block + 1.7, tip[2]]} m={DARK_STEEL} />
    </group>
  );
};

// ---------------------------------------------------------------- fire

export const FIRE_FROM: V3 = [45.5, 1.12, -10.1];
export const FIRE_TO: V3 = [43.6, 1.15, -10.0];

const Flamethrower: React.FC = () => (
  <group rotation={[-Math.PI / 2 + 0.1, 0, 0]}>
    <Cyl r={0.025} h={0.9} seg={6} position={[0, -0.35, 0]} m={DARK_STEEL} />
    <Cyl r={0.04} h={0.12} seg={6} position={[0, -0.82, 0]} m={STEEL} />
  </group>
);

const Tanks: React.FC = () => (
  <group>
    {[-0.12, 0.12].map((x) => (
      <Cyl key={x} r={0.1} h={0.6} seg={8} position={[x, 0, 0]} m={{color: '#4a4f4a', rough: 0.6, metal: 0.4}} />
    ))}
  </group>
);

// the jet: blobs of flame along the path, bigger and redder where it hits the grey skin
const Flame: React.FC<{v: number; on: number}> = ({v, on}) => {
  const n = 34;
  return (
    <group>
      {on > 0
        ? Array.from({length: n}).map((_, i) => {
            const k = (i + ((v * 9) % 1)) / n;
            const p: V3 = [lerp(FIRE_FROM[0], FIRE_TO[0], k), lerp(FIRE_FROM[1], FIRE_TO[1], k) + Math.sin(k * 3) * 0.12, lerp(FIRE_FROM[2], FIRE_TO[2], k) + Math.sin(v * 13 + i) * 0.05 * k];
            const r = (0.07 + k * 0.32) * (0.8 + 0.3 * Math.sin(v * 31 + i * 2.1)) * on;
            const c = new Color().setHSL(0.03 + 0.08 * (1 - k), 1, 0.42 + 0.12 * (1 - k));
            return (
              <mesh key={i} position={p} scale={[r * 2.2, r, r]}>
                <icosahedronGeometry args={[1, 0]} />
                <meshBasicMaterial color={c} transparent opacity={0.28} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
              </mesh>
            );
          })
        : null}
      {on > 0 ? (
        <>
          {Array.from({length: 7}).map((_, i) => {
            const a = (i / 7) * Math.PI * 2 + v * 2;
            const r = (0.45 + 0.25 * Math.sin(v * 17 + i)) * on;
            return (
              <mesh key={i} position={[FIRE_TO[0] - 0.1 + Math.cos(a) * 0.5, FIRE_TO[1] + 0.05, FIRE_TO[2] + Math.sin(a) * 0.6]} scale={[r, r * 0.5, r]}>
                <icosahedronGeometry args={[1, 0]} />
                <meshBasicMaterial color="#ff6a1a" transparent opacity={0.35} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
              </mesh>
            );
          })}
          <pointLight position={[FIRE_TO[0] + 0.6, FIRE_TO[1] + 0.8, FIRE_TO[2]]} color="#ff7a2a" intensity={(10 + 3 * Math.sin(v * 23)) * on} distance={16} decay={2} />
          <pointLight position={[FIRE_FROM[0] - 0.5, FIRE_FROM[1] + 0.2, FIRE_FROM[2] + 0.4]} color="#ff9440" intensity={6 * on} distance={5} decay={2} />
        </>
      ) : null}
    </group>
  );
};

// white puffs rising off the impact; they keep coming a little after the flame is gone
const Steam: React.FC<{v: number; from: number; to: number}> = ({v, from, to}) => (
  <group>
    {Array.from({length: 26}).map((_, i) => {
      const life = 2.2;
      const born = from + 0.3 + i * 0.22;
      const age = v - born;
      if (age < 0 || age > life || born > to + 1.2) return null;
      const k = age / life;
      const p: V3 = [FIRE_TO[0] - 0.2 + (random(`st-x-${i}`) - 0.5) * 1.4, FIRE_TO[1] + 0.2 + k * 3.2, FIRE_TO[2] + (random(`st-z-${i}`) - 0.5) * 1.6 + k * 0.6];
      const r = 0.2 + k * 0.9;
      return (
        <mesh key={i} position={p} scale={[r, r * 0.8, r]}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#c9d0d4" transparent opacity={0.14 * Math.sin(Math.PI * k)} depthWrite={false} roughness={1} flatShading />
        </mesh>
      );
    })}
  </group>
);

// ---------------------------------------------------------------- the whole cordon

export type CordonState = 'night' | 'day' | 'evening';

export const Cordon: React.FC<{v: number; state: CordonState; drop?: number; flame?: [number, number]; guards?: boolean}> = ({v, state, drop, flame, guards}) => {
  const night = state === 'night';
  const flameOn = flame ? Math.min(ramp(v, flame[0], flame[0] + 0.15), 1 - ramp(v, flame[1] - 0.05, flame[1])) : 0;
  return (
    <group>
      <Mass3 v={v} evening={state === 'evening'} />
      {state !== 'night' ? <Wall state={state === 'day' ? 'day' : 'evening'} drop={drop} /> : null}
      {state === 'day' ? <Crane drop={drop ?? 1} /> : null}
      <MeshFence />
      {TRUCK_AS.map((a, i) => (
        <Truck key={i} p={at(a, TRUCK_R + (i % 3) * 1.5)} rot={-a + (i % 2 ? 0.15 : -0.1)} lights={night && i % 2 === 0} />
      ))}
      {/* trucks across the east road */}
      <Truck p={[57, 0, 2]} rot={Math.PI / 2 + 0.08} lights={night} />
      <Truck p={[56.5, 0, -24]} rot={-Math.PI / 2 + 0.05} lights={night} />
      {night
        ? LIGHTS.map((l, i) => {
            const p = at(l.a, l.r);
            const s = Math.sin(v * l.sp + l.ph);
            const aim: V3 = [l.cx + s * l.sx, 2, l.cz + Math.cos(v * l.sp * 0.7 + l.ph) * 6];
            return <Searchlight key={i} p={p} aim={aim} />;
          })
        : null}
      {guards
        ? GUARDS.map(([x, z, r], i) => <Soldier key={i} p={[x, 0, z]} rot={-Math.PI / 2 + r} pose={{...STAND, head: [0.05 + 0.04 * i, 0.1 * Math.sin(i)]}} />)
        : null}
      {flame ? (
        <>
          <Soldier
            p={[46.3, 0, -10.25]}
            rot={-Math.PI / 2}
            pose={{armL: [1.0, 0.25], armR: [0.9, -0.1], elbowL: 0.5, elbowR: 0.7, head: [0.25, 0], stoop: 0.12, legL: 0.25, legR: -0.15}}
            rightHand={<Flamethrower />}
          />
          <group position={[46.75, 1.3, -10.25]} rotation={[0, -Math.PI / 2, 0.08]}>
            <Tanks />
          </group>
          <Soldier p={[47.3, 0, -7.4]} rot={-Math.PI / 2 + 0.3} pose={{...STAND, head: [0.2, 0.1]}} />
          <Flame v={v} on={flameOn} />
          <Steam v={v} from={flame[0]} to={flame[1]} />
        </>
      ) : null}
    </group>
  );
};
