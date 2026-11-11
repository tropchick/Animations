import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Ball, Block, Cone, Cyl, Glow, RBox, Ring} from '../bear/kit';
import {Pic} from '../bear/Props';
import {Tree} from '../bear/Forest';
import {useRobe} from '../gaben/Sets';
import {useLeopard, SoftSlipper, PINK, BLUE, ROUNDF} from '../nolan/Sets';
import type {Who} from '../nolan/Sets';
import {Tower} from '../gtamom/Sets';
import {fit} from '../cs2/tex';
import {V3, lerp, rnd} from './cues';

// Sets for the new «мать Габена или мать Нолана»: yard + seesaw, beach, trampoline, Earth cut, Australia, plane, Moscow, clocks.
// The mothers are never shown with faces: slippers, robe, silhouettes from behind (as in src/nolan).

export {PINK, BLUE, ROUNDF};

const usePrint = (who: Who, repeat: [number, number]) => {
  const robe = useRobe(repeat);
  const leo = useLeopard(repeat);
  return who === 'g' ? robe : leo;
};
const usePrintMat = (who: Who, repeat: [number, number]) => {
  const print = usePrint(who, repeat);
  return useMemo(() => new THREE.MeshStandardMaterial({map: print, roughness: 0.95, side: THREE.DoubleSide}), [print]);
};

// ---------------------------------------------------------------- crack lines on a floor (asphalt, sand)

export const Crack: React.FC<{position: V3; k: number; seed: number; color?: string; r0?: number; len?: number}> = ({position, k, seed, color = '#1c1a1e', r0 = 0.3, len = 0.5}) => (
  <group position={position}>
    {Array.from({length: 7}).map((_, i) => {
      const a = (i / 7) * Math.PI * 2 + rnd(seed + i) * 0.6;
      const l = (len * 0.7 + len * 0.7 * rnd(seed * 3 + i)) * k;
      return <Block key={i} position={[Math.cos(a) * (r0 + l / 2), 0.006, Math.sin(a) * (r0 + l / 2)]} rotation={[0, -a, 0]} size={[l, 0.004, 0.03]} color={color} shadow={false} />;
    })}
  </group>
);

// ---------------------------------------------------------------- the yard: asphalt, a lawn strip, trees, blocks of flats far away

export const Yard: React.FC<{crater?: number}> = () => (
  <>
    <Block position={[0, -0.05, 0]} size={[40, 0.1, 40]} color="#6f7480" />
    <Block position={[0, 0.0, -6]} size={[40, 0.12, 6]} color="#7ab85a" />
    {[-1, 1].map((s) => (
      <Block key={s} position={[0, 0.04, -3 + s * 0.0]} size={[40, 0.08, 0.2]} color="#c8c8cc" />
    ))}
    {Array.from({length: 7}).map((_, i) => (
      <Tree key={i} position={[-12 + i * 4 + rnd(i) * 1.5, 0.06, -6.5 - rnd(i * 3) * 2]} h={3.2 + rnd(i * 5)} seed={i + 3} />
    ))}
    {Array.from({length: 6}).map((_, i) => (
      <Tower key={i} position={[-15 + i * 6, 0, -18 - (i % 2) * 3]} w={4.5} h={9 + rnd(i * 7) * 6} i={i + 1} />
    ))}
  </>
);

// ---------------------------------------------------------------- the seesaw: pivot at the origin, beam along x; positive angle lowers the left (pink) end

export const SEE = {half: 1.75, top: 0.55, seat: 1.5};
export const seatPos = (side: -1 | 1, a: number, base: V3 = [0, 0, 0]): V3 => [base[0] + side * SEE.seat * Math.cos(a), base[1] + SEE.top + 0.1 + side * SEE.seat * Math.sin(a), base[2]];

export const Seesaw: React.FC<{position?: V3; angle: number; left?: React.ReactNode; right?: React.ReactNode}> = ({position = [0, 0, 0], angle, left, right}) => (
  <group position={position}>
    {/* the stand: an A-frame */}
    {[-1, 1].map((s) => (
      <group key={s} position={[0, 0, s * 0.2]}>
        <Cyl position={[-0.18, 0.27, 0]} rotation={[0, 0, -0.55]} rt={0.04} rb={0.05} h={0.62} seg={10} color="#e8453c" />
        <Cyl position={[0.18, 0.27, 0]} rotation={[0, 0, 0.55]} rt={0.04} rb={0.05} h={0.62} seg={10} color="#e8453c" />
      </group>
    ))}
    <Cyl position={[0, SEE.top, 0]} rotation={[Math.PI / 2, 0, 0]} rt={0.06} rb={0.06} h={0.52} seg={14} color="#2a2b33" look={{metal: 0.5, rough: 0.4}} />
    <group position={[0, SEE.top, 0]} rotation={[0, 0, angle]}>
      <RBox position={[0, 0.03, 0]} size={[SEE.half * 2, 0.07, 0.24]} r={0.03} color="#ffd23f" />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * SEE.seat, 0, 0]}>
          <RBox position={[0, 0.085, 0]} size={[0.5, 0.04, 0.34]} r={0.02} color={s < 0 ? '#f06aa0' : '#4aa8f0'} />
          {/* handle in front of the seat (towards the pivot) */}
          <Cyl position={[-s * 0.36, 0.3, 0]} rt={0.025} rb={0.025} h={0.4} seg={8} color="#2a2b33" />
          <Cyl position={[-s * 0.36, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} rt={0.022} rb={0.022} h={0.34} seg={8} color="#2a2b33" />
          {/* rubber stop under the end */}
          <Cyl position={[s * 0.15, -0.06, 0]} rt={0.07} rb={0.07} h={0.1} seg={12} color="#1c1d24" />
        </group>
      ))}
    </group>
    {/* what sits on the seats is placed in world space (it stays upright while the beam tilts) */}
    <group position={seatPos(-1, angle)}>{left}</group>
    <group position={seatPos(1, angle)}>{right}</group>
  </group>
);

// a mother sitting on something at y = 0 (the seat top), seen side-on; she faces `face` (+1 = towards +x).
// Robe bell, shoulders, sleeves, a head from the side with a bun (no face drawn), two shins with slippers that hang or rest.
export const SitMom: React.FC<{who: Who; face: 1 | -1; seatH?: number; position?: V3; squash?: number; bob?: number}> = ({who, face, seatH = 0.6, position = [0, 0, 0], squash = 1, bob = 0}) => {
  const robeMat = usePrintMat(who, [4, 2]);
  const hair = who === 'g' ? '#8a6a5a' : '#e8c878';
  const skin = '#f0c2a0';
  const trim = who === 'g' ? '#fff0f6' : '#3a2412';
  // the shins hang down from the front of the seat; when the seat is low they swing forward so the slippers rest on the ground
  const L = 0.44;
  const h = Math.max(0.02, seatH - 0.02);
  const swing = h >= L ? 0 : Math.acos(Math.min(1, h / L));
  const hairLook = {rough: 0.95, rim: '#ffffff', rimK: 0.2};
  return (
    <group position={[position[0], position[1] + bob, position[2]]} scale={[1, squash, 1]}>
      <group rotation={[0, face > 0 ? 0 : Math.PI, 0]}>
        {/* robe bell */}
        <mesh position={[0, 0.5, 0]} material={robeMat} castShadow receiveShadow>
          <cylinderGeometry args={[0.27, 0.46, 1.0, 40, 1, true]} />
        </mesh>
        <Ring position={[0, 0.0, 0]} rotation={[Math.PI / 2, 0, 0]} r={0.46} tube={0.03} color={trim} look={{rough: 1}} />
        <mesh position={[0, 0.99, 0]} scale={[0.26, 0.15, 0.36]} material={robeMat} castShadow>
          <sphereGeometry args={[1, 32, 16]} />
        </mesh>
        {/* arms reach forward to the handle */}
        {[-1, 1].map((s) => (
          <group key={s} position={[0.05, 0.95, s * 0.3]} rotation={[0, 0, -1.0]}>
            <mesh position={[0, -0.25, 0]} material={robeMat} castShadow>
              <capsuleGeometry args={[0.08, 0.38, 6, 16]} />
            </mesh>
            <Ball position={[0, -0.52, 0]} scale={0.065} color={skin} />
          </group>
        ))}
        <Cyl position={[0, 1.15, 0]} rt={0.07} rb={0.08} h={0.12} seg={14} color={skin} />
        <Ball position={[0.02, 1.33, 0]} scale={[0.17, 0.19, 0.17]} color={skin} />
        {/* hair covers the back and the top; the face side stays plain skin */}
        <Ball position={[-0.03, 1.36, 0]} scale={[0.17, 0.2, 0.185]} color={hair} look={hairLook} />
        <Ball position={[-0.17, 1.47, 0]} scale={0.1} color={hair} look={hairLook} />
        {/* thighs forward out of the robe, then shins + slippers from the knees */}
        {[-1, 1].map((s) => (
          <mesh key={`t${s}`} position={[0.34, 0.1, s * 0.17]} rotation={[0, 0, Math.PI / 2]} material={robeMat} castShadow>
            <capsuleGeometry args={[0.085, 0.4, 6, 14]} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <group key={s} position={[0.6, 0.06, s * 0.17]} rotation={[0, 0, swing]}>
            <Cyl position={[0, -L / 2, 0]} rt={0.058} rb={0.052} h={L} seg={14} color={skin} look={{rough: 0.7}} />
            <group position={[0.03, -L, 0]} rotation={[0, Math.PI / 2, -swing]}>
              <SoftSlipper who={who} scale={0.9} />
            </group>
          </group>
        ))}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- sand, a bucket and a spade

export const Bucket: React.FC<{position: V3; rotation?: V3; color?: string}> = ({position, rotation, color = '#e8453c'}) => (
  <group position={position} rotation={rotation}>
    <Cyl position={[0, 0.1, 0]} rt={0.12} rb={0.09} h={0.2} seg={20} color={color} look={{rough: 0.5}} />
    <Ring position={[0, 0.16, 0]} rotation={[0, 0, 0]} r={0.12} tube={0.008} arc={Math.PI} color="#2a2b33" />
  </group>
);
export const Spade: React.FC<{position: V3; rotation?: V3}> = ({position, rotation}) => (
  <group position={position} rotation={rotation}>
    <Cyl position={[0, 0.2, 0]} rt={0.015} rb={0.015} h={0.4} seg={8} color="#3a9cf0" />
    <RBox position={[0, 0.0, 0]} size={[0.11, 0.12, 0.02]} r={0.02} color="#3a9cf0" />
  </group>
);

// a dented footprint pit in the sand, shaped like a slipper sole (toe towards +z); `k` 0..1 grows it
export const Pit: React.FC<{position: V3; k: number; s?: number; color?: string}> = ({position, k, s = 1, color = '#b88a4a'}) =>
  k <= 0 ? null : (
    <group position={position} scale={[s * k, 1, s * k]}>
      <Ball position={[0, 0.004, 0.06]} scale={[0.17, 0.004, 0.26]} color={color} look={{rough: 1}} shadow={false} />
      <Ball position={[0, 0.0045, 0.08]} scale={[0.13, 0.004, 0.2]} color="#7a5428" look={{rough: 1}} shadow={false} />
      <Ring position={[0, 0.0, 0.06]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1.5, 1]} r={0.18} tube={0.03} color="#f2d49a" look={{rough: 1}} />
    </group>
  );

// ---------------------------------------------------------------- Baikal from orbit: land with a slipper-shaped lake that fills

const drawLand = (fill: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#5f9a4a';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 220; i++) {
    const x = rnd(i * 3.1) * W;
    const y = rnd(i * 7.3) * H;
    const r = 6 + rnd(i * 1.7) * 26;
    g.fillStyle = i % 3 === 0 ? '#4a7f3a' : i % 3 === 1 ? '#78ad58' : '#8a9a5a';
    g.beginPath();
    g.ellipse(x, y, r, r * 0.7, rnd(i) * 3, 0, Math.PI * 2);
    g.fill();
  }
  // mountains: pale ridges
  for (let i = 0; i < 18; i++) {
    const x = rnd(i * 11.3 + 2) * W;
    const y = rnd(i * 5.9 + 1) * H;
    g.fillStyle = 'rgba(200,190,170,0.55)';
    g.beginPath();
    g.moveTo(x - 40, y + 20);
    g.lineTo(x, y - 30);
    g.lineTo(x + 40, y + 20);
    g.fill();
  }
  // the slipper-shaped lake (toe up, heel down), long axis tilted a bit like the real lake
  g.save();
  g.translate(W / 2, H / 2);
  g.rotate(0.55);
  const sole = () => {
    g.beginPath();
    g.ellipse(0, -H * 0.12, W * 0.14, H * 0.2, 0, 0, Math.PI * 2);
    g.ellipse(0, H * 0.14, W * 0.105, H * 0.16, 0, 0, Math.PI * 2);
  };
  g.fillStyle = '#6a4a2a';
  sole();
  g.fill();
  g.beginPath();
  g.rect(-W, H * 0.32 - H * 0.64 * fill, W * 2, H * 2);
  g.clip();
  g.fillStyle = '#2f86c8';
  sole();
  g.fill();
  g.restore();
};
export const BaikalLand: React.FC<{fill: number; size?: number}> = ({fill, size = 120}) => (
  <Pic size={[size, size]} res={[1024, 1024]} k={`baikal-${Math.round(fill * 40)}`} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} draw={drawLand(fill)} />
);

// ---------------------------------------------------------------- the trampoline (radius 1.3, mat at y = 0.7); sag pulls the middle down

export const TRAMP = {r: 1.3, y: 0.7};
export const Trampoline: React.FC<{position?: V3; sag: number; torn?: number}> = ({position, sag, torn = 0}) => (
  <group position={position}>
    <Ring position={[0, TRAMP.y, 0]} rotation={[Math.PI / 2, 0, 0]} r={TRAMP.r} tube={0.05} color="#2a7ad8" look={{rough: 0.5}} />
    <Ring position={[0, TRAMP.y + 0.012, 0]} rotation={[Math.PI / 2, 0, 0]} r={TRAMP.r - 0.04} tube={0.035} color="#ffd23f" look={{rough: 0.6}} />
    {Array.from({length: 6}).map((_, i) => {
      const a = (i / 6) * Math.PI * 2;
      return <Cyl key={i} position={[Math.cos(a) * TRAMP.r, TRAMP.y / 2, Math.sin(a) * TRAMP.r]} rt={0.03} rb={0.03} h={TRAMP.y} seg={8} color="#9aa2ae" look={{metal: 0.5, rough: 0.4}} />;
    })}
    {torn <= 0 ? (
      // the mat: a shallow cone, apex down
      <Cone position={[0, TRAMP.y - Math.max(0.02, sag) / 2, 0]} rotation={[Math.PI, 0, 0]} r={TRAMP.r - 0.06} h={Math.max(0.02, sag)} seg={40} color="#1c1d24" look={{rough: 0.8, side: THREE.DoubleSide}} />
    ) : (
      // torn flaps hanging from the rim
      Array.from({length: 8}).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const hang = 0.25 + 0.35 * rnd(i * 3) * torn;
        return (
          <group key={i} position={[Math.cos(a) * (TRAMP.r - 0.1), TRAMP.y, Math.sin(a) * (TRAMP.r - 0.1)]} rotation={[0, -a, 0]}>
            <RBox position={[-0.1, -hang / 2, 0]} rotation={[0, 0, 0.3]} size={[0.18, hang, 0.4]} r={0.01} color="#1c1d24" />
          </group>
        );
      })
    )}
  </group>
);

export const Coil2: React.FC<{position: V3; rotation?: V3; s?: number}> = ({position, rotation, s = 1}) => (
  <group position={position} rotation={rotation} scale={s}>
    {Array.from({length: 6}).map((_, i) => (
      <Ring key={i} position={[0, i * 0.016, 0]} rotation={[Math.PI / 2 + 0.15, 0, 0]} r={0.022} tube={0.005} color="#b9c0c8" look={{metal: 0.6, rough: 0.3}} />
    ))}
  </group>
);

// ---------------------------------------------------------------- the Earth cut in half: crust, mantle, core; the cut faces +z

export const EarthCut: React.FC<{r: number; position?: V3; heat?: number}> = ({r, position = [0, 0, 0], heat = 1}) => (
  <group position={position}>
    <mesh>
      <sphereGeometry args={[r, 48, 32, Math.PI, Math.PI]} />
      <meshStandardMaterial color="#3a8ad8" roughness={0.5} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 0, 0.0]}>
      <circleGeometry args={[r, 64]} />
      <meshStandardMaterial color="#8a5a3a" roughness={0.9} />
    </mesh>
    <mesh position={[0, 0, 0.03]}>
      <circleGeometry args={[r * 0.9, 64]} />
      <meshStandardMaterial color="#e8642a" roughness={0.8} emissive="#e8642a" emissiveIntensity={0.25 * heat} />
    </mesh>
    <mesh position={[0, 0, 0.06]}>
      <circleGeometry args={[r * 0.55, 64]} />
      <meshStandardMaterial color="#ffa53a" roughness={0.7} emissive="#ffa53a" emissiveIntensity={0.5 * heat} />
    </mesh>
    <mesh position={[0, 0, 0.09]}>
      <circleGeometry args={[r * 0.28, 48]} />
      <meshBasicMaterial color="#fff2a0" />
    </mesh>
    <Glow position={[0, 0, 0.4]} size={r * 1.4} color="#ffb84a" k={0.6 * heat} />
  </group>
);

// ---------------------------------------------------------------- a kangaroo (1.4 m), facing +z

export const Kangaroo: React.FC<{position: V3; rotation?: number; hop?: number; scared?: number}> = ({position, rotation = 0, hop = 0, scared = 0}) => {
  const c = '#c88a52';
  const light = '#ecc89a';
  return (
    <group position={[position[0], position[1] + hop, position[2]]} rotation={[0, rotation, 0]}>
      <Ball position={[0, 0.25, -0.15]} scale={[0.16, 0.12, 0.34]} color={c} />
      <Ball position={[0, 0.62, 0]} rotation={[-0.35, 0, 0]} scale={[0.22, 0.34, 0.2]} color={c} />
      <Ball position={[0, 0.58, 0.12]} rotation={[-0.35, 0, 0]} scale={[0.13, 0.24, 0.1]} color={light} />
      <Ball position={[0, 1.02 + scared * 0.05, 0.05]} scale={[0.11, 0.12, 0.15]} color={c} />
      <Ball position={[0, 0.99 + scared * 0.05, 0.19]} scale={[0.06, 0.06, 0.07]} color={c} />
      <Ball position={[0, 1.0 + scared * 0.05, 0.255]} scale={0.022} color="#2a1a10" />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Ball position={[s * 0.07, 1.16 + scared * 0.07, -0.0]} rotation={[0, 0, s * (0.3 - scared * 0.25)]} scale={[0.035, 0.1, 0.02]} color={c} />
          <Ball position={[s * 0.055, 1.06 + scared * 0.05, 0.13]} scale={[0.025, 0.03, 0.02]} color="#ffffff" />
          <Ball position={[s * 0.055, 1.06 + scared * 0.05, 0.145]} scale={[0.014, 0.018, 0.01]} color="#1c1d24" shadow={false} />
          <Ball position={[s * 0.12, 0.13, 0.05]} scale={[0.07, 0.13, 0.12]} color={c} />
          <Ball position={[s * 0.12, 0.03, 0.18]} scale={[0.05, 0.03, 0.14]} color={c} />
          <Ball position={[s * 0.12, 0.7, 0.18]} rotation={[0.6 + scared, 0, 0]} scale={[0.035, 0.11, 0.035]} color={c} />
        </group>
      ))}
    </group>
  );
};

export const Palm2: React.FC<{position: V3; h?: number; seed?: number}> = ({position, h = 2.6, seed = 1}) => {
  const lean = (rnd(seed) - 0.5) * 0.5;
  return (
    <group position={position} rotation={[0, rnd(seed * 3) * 6, 0]}>
      <Cyl position={[lean / 2, h / 2, 0]} rotation={[0, 0, -lean / h]} rt={0.07} rb={0.11} h={h} seg={10} color="#9a6a3a" />
      {Array.from({length: 7}).map((_, k) => {
        const a = (k / 7) * Math.PI * 2;
        return <Ball key={k} position={[lean + Math.cos(a) * 0.45, h - 0.05, Math.sin(a) * 0.45]} rotation={[0, -a, 0.45]} scale={[0.55, 0.05, 0.15]} color={k % 2 ? '#3aa04a' : '#4ab85a'} look={{rough: 0.8}} />;
      })}
      <Ball position={[lean, h, 0]} scale={0.12} color="#6a4a2a" />
    </group>
  );
};

// ---------------------------------------------------------------- the toy plane (fuselage along z, nose towards +z, 4.4 m); window 3 on the left side shows a print

export const ToyPlane: React.FC<{position?: V3; roll?: number; yaw?: number; who: Who; color?: string}> = ({position = [0, 0, 0], roll = 0, yaw = 0, who, color = '#f4f6fa'}) => {
  const print = usePrintMat(who, [1, 1]);
  const W = 0.36;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <group position={[0, 0.8, 0]} rotation={[0, 0, roll]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[W, 3.4, 10, 28]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
        {/* a stripe along the side, proud of the skin */}
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.012, 1, 0.25]} position={[0, -0.06, 0]}>
          <capsuleGeometry args={[W, 3.4, 6, 28]} />
          <meshStandardMaterial color="#e8453c" roughness={0.5} />
        </mesh>
        {/* cockpit glass */}
        <Ball position={[0, 0.13, 1.95]} scale={[0.25, 0.14, 0.2]} color="#2a3a5a" look={{rough: 0.2}} />
        {/* wings */}
        <RBox position={[0, -0.12, 0.1]} size={[4.2, 0.07, 0.8]} r={0.03} color={color} />
        <RBox position={[0, 0.0, -1.75]} size={[1.5, 0.05, 0.4]} r={0.02} color={color} />
        <RBox position={[0, 0.42, -1.85]} rotation={[0.25, 0, 0]} size={[0.06, 0.65, 0.5]} r={0.02} color="#e8453c" />
        {[-1, 1].map((s) => (
          <Cyl key={s} position={[s * 1.1, -0.3, 0.3]} rotation={[Math.PI / 2, 0, 0]} rt={0.13} rb={0.11} h={0.55} seg={16} color="#c8ccd4" look={{metal: 0.4, rough: 0.35}} />
        ))}
        {/* windows on the left (-x) side; window 3 shows the passenger */}
        {Array.from({length: 7}).map((_, i) => (
          <group key={i} position={[-W - 0.004, 0.08, 1.2 - i * 0.38]} rotation={[0, -Math.PI / 2, 0]}>
            <mesh>
              <circleGeometry args={[0.085, 20]} />
              {i === 3 ? <primitive object={print} attach="material" /> : <meshStandardMaterial color="#2a3a5a" roughness={0.2} />}
            </mesh>
          </group>
        ))}
        {/* wheels */}
        {[
          [0, -0.55, 1.4],
          [-0.5, -0.55, -0.1],
          [0.5, -0.55, -0.1],
        ].map((p, i) => (
          <group key={i}>
            <Cyl position={[p[0], p[1] + 0.2, p[2]]} rt={0.025} rb={0.025} h={0.3} seg={8} color="#9aa2ae" />
            <Cyl position={p as V3} rotation={[0, 0, Math.PI / 2]} rt={0.12} rb={0.12} h={0.08} seg={14} color="#1c1d24" />
          </group>
        ))}
      </group>
    </group>
  );
};

export const Runway: React.FC = () => (
  <>
    <Block position={[0, -0.05, 0]} size={[60, 0.1, 80]} color="#7ab85a" />
    <Block position={[0, 0.01, 0]} size={[8, 0.04, 80]} color="#5a5e66" />
    {Array.from({length: 16}).map((_, i) => (
      <Block key={i} position={[0, 0.035, -38 + i * 5]} size={[0.25, 0.012, 2.2]} color="#f4f4f4" shadow={false} />
    ))}
    {[-1, 1].map((s) => (
      <Block key={s} position={[s * 3.8, 0.035, 0]} size={[0.15, 0.012, 80]} color="#f4f4f4" shadow={false} />
    ))}
  </>
);

// ---------------------------------------------------------------- Moscow: towers, snow that melts, a snowman in sunglasses

export const SnowCity: React.FC<{melt: number}> = ({melt}) => {
  const snow = 1 - melt;
  const ground = new THREE.Color('#f4f8fc').lerp(new THREE.Color('#6fb04f'), melt).getStyle();
  return (
    <>
      <Block position={[0, -0.05, 0]} size={[60, 0.1, 60]} color={ground} />
      <Block position={[0, 0.005, 2]} size={[60, 0.02, 2.6]} color={new THREE.Color('#e8eef4').lerp(new THREE.Color('#5a5e66'), melt).getStyle()} />
      {Array.from({length: 8}).map((_, i) => {
        const x = -10 + (i % 4) * 6.5;
        const z = -4 - Math.floor(i / 4) * 6;
        const h = 6 + rnd(i * 5) * 5;
        return (
          <group key={i}>
            <Tower position={[x, 0, z]} w={3.4} h={h} i={i} />
            {snow > 0.02 ? <Block position={[x, h + 0.08 + 0.08 + 0.12 * snow, z]} size={[3.0, 0.24 * snow, 3.0]} color="#ffffff" /> : null}
          </group>
        );
      })}
      {Array.from({length: 6}).map((_, i) => (
        <group key={i}>
          <Tree position={[-9 + i * 3.6 + (i > 2 ? 3.5 : 0), 0, -1.6 - rnd(i) * 1.2]} h={2.6} seed={i + 21} cols={melt > 0.5 ? ['#4ab85a', '#6fc85a', '#3a9a4a'] : ['#f4f8fc', '#e4ecf4', '#dce6f0']} />
        </group>
      ))}
    </>
  );
};

export const Snowman: React.FC<{position: V3; melt: number}> = ({position, melt}) => (
  <group position={position} scale={[1, 1 - 0.25 * melt, 1]}>
    <Ball position={[0, 0.35, 0]} scale={0.38} color="#ffffff" look={{rough: 0.9}} />
    <Ball position={[0, 0.88, 0]} scale={0.27} color="#ffffff" look={{rough: 0.9}} />
    <Ball position={[0, 1.27, 0]} scale={0.19} color="#ffffff" look={{rough: 0.9}} />
    <Cone position={[0, 1.27, 0.26]} rotation={[Math.PI / 2, 0, 0]} r={0.035} h={0.16} seg={8} color="#ff8a1e" />
    {/* sunglasses (appear with the summer) */}
    {melt > 0.4 ? (
      <group position={[0, 1.33, 0.17]}>
        {[-1, 1].map((s) => (
          <RBox key={s} position={[s * 0.07, 0, 0]} size={[0.11, 0.06, 0.02]} r={0.02} color="#1c1d24" look={{rough: 0.2}} />
        ))}
        <Block position={[0, 0.01, 0]} size={[0.06, 0.015, 0.015]} color="#1c1d24" />
      </group>
    ) : (
      [-1, 1].map((s) => <Ball key={s} position={[s * 0.06, 1.33, 0.17]} scale={0.022} color="#1c1d24" />)
    )}
    <Cyl position={[0, 1.5, 0]} rt={0.12} rb={0.14} h={0.1} seg={14} color="#e8453c" />
  </group>
);

// ---------------------------------------------------------------- a wall clock with hands (face towards +z); angles in turns of the minute hand

export const HandClock: React.FC<{position: V3; minutes: number; r?: number}> = ({position, minutes, r = 0.42}) => {
  const am = (minutes / 60) * Math.PI * 2;
  const ah = (minutes / 720) * Math.PI * 2;
  return (
    <group position={position}>
      <Cyl rotation={[Math.PI / 2, 0, 0]} rt={r + 0.04} rb={r + 0.04} h={0.06} seg={40} color="#2a2b33" />
      <Cyl position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]} rt={r} rb={r} h={0.01} seg={40} color="#fbf6ea" />
      {Array.from({length: 12}).map((_, i) => {
        const b = (i / 12) * Math.PI * 2;
        return <RBox key={i} position={[Math.sin(b) * r * 0.82, Math.cos(b) * r * 0.82, 0.045]} size={[0.025, i % 3 ? 0.05 : 0.09, 0.01]} r={0.005} color="#2a2b33" shadow={false} />;
      })}
      <group position={[0, 0, 0.055]} rotation={[0, 0, -ah]}>
        <RBox position={[0, r * 0.25, 0]} size={[0.04, r * 0.55, 0.012]} r={0.01} color="#2a2b33" shadow={false} />
      </group>
      <group position={[0, 0, 0.07]} rotation={[0, 0, -am]}>
        <RBox position={[0, r * 0.36, 0]} size={[0.025, r * 0.8, 0.012]} r={0.008} color="#e8453c" shadow={false} />
      </group>
      <Cyl position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]} rt={0.03} rb={0.03} h={0.02} seg={12} color="#2a2b33" />
    </group>
  );
};

// a fat old CRT monitor (front towards +z)
export const Crt: React.FC<{position: V3; rotation?: number}> = ({position, rotation = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <RBox position={[0, 0.27, -0.05]} size={[0.6, 0.52, 0.42]} r={0.05} color="#e4ddc8" />
    <RBox position={[0, 0.27, -0.35]} size={[0.42, 0.38, 0.3]} r={0.06} color="#d8d0b8" />
    <RBox position={[0, 0.28, 0.165]} size={[0.46, 0.36, 0.01]} r={0.04} color="#2a4a3a" look={{rough: 0.2, emissive: '#3a8a5a', emissiveK: 0.4}} />
    <RBox position={[0, 0.02, -0.05]} size={[0.36, 0.04, 0.3]} r={0.02} color="#d8d0b8" />
  </group>
);

// a game box without any logo: a big «3» and an «IN DEVELOPMENT» sticker (front towards +z)
const drawBox = (g: CanvasRenderingContext2D, W: number, H: number) => {
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#2a2f3a');
  gr.addColorStop(1, '#14161c');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ff8a1e';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `800 ${H * 0.62}px ${ROUNDF}`;
  g.fillText('3', W / 2, H * 0.4);
  g.fillStyle = '#ffd23f';
  g.save();
  g.translate(W / 2, H * 0.8);
  g.rotate(-0.12);
  g.fillRect(-W * 0.46, -H * 0.075, W * 0.92, H * 0.15);
  g.fillStyle = '#2a1f3a';
  const s = fit(g, 'В РАЗРАБОТКЕ', W * 0.86, H * 0.11, 800, ROUNDF);
  g.font = `800 ${s}px ${ROUNDF}`;
  g.fillText('В РАЗРАБОТКЕ', 0, 4);
  g.restore();
};
export const GameBox: React.FC<{position: V3; rotation?: V3; scale?: number}> = ({position, rotation, scale = 1}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <RBox position={[0, 0.3, 0]} size={[0.44, 0.6, 0.08]} r={0.01} color="#14161c" />
    <Pic size={[0.42, 0.58]} res={[256, 352]} k="box3" position={[0, 0.3, 0.042]} draw={drawBox} />
  </group>
);

// ---------------------------------------------------------------- a five-point star (flat, extruded), facing +z

const starShape = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
    const r = i % 2 ? 0.42 : 1;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
})();
export const StarShape: React.FC<{position: V3; size: number; color?: string; k?: number; spin?: number}> = ({position, size, color = '#7ac4ff', k = 1, spin = 0}) => {
  const geo = useMemo(() => new THREE.ExtrudeGeometry(starShape, {depth: 0.25, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3}), []);
  const m = useMemo(() => new THREE.MeshStandardMaterial({color, emissive: color, emissiveIntensity: 0.8, roughness: 0.4}), [color]);
  return (
    <group position={position} scale={size * k} rotation={[0, 0, spin]}>
      <mesh geometry={geo} material={m} position={[0, 0, -0.12]} />
    </group>
  );
};

export {Ball, Block, Cone, Cyl, Glow, RBox, Ring, lerp};
