import React, {useMemo} from 'react';
import {random} from 'remotion';
import {AdditiveBlending, BufferGeometry, CanvasTexture, Float32BufferAttribute, Object3D} from 'three';
import {
  COUNT_ZERO,
  GLASS_TAP,
  JAR_DOWN,
  LID,
  LOCKS,
  V3,
  lerp,
  lerp3,
  ramp,
  shotEnd,
  shotStart,
  smooth,
} from './cues';
import {Box, Cyl, DARK_STEEL, FLOOR, GLASS, Glow, Ico, Mat, Material, PANEL, RUBBER, STEEL} from './parts';
import {Gleb, GloveHand} from './Gleb';
import {CounterScreen, NotePage, RecorderScreen, ScopeScreen} from './screens';
import {useScene} from './scene';

// ---------------------------------------------------------------- layout (metres)

export const CONSOLE: V3 = [-2.4, 0, 2.0];
export const RECORDER: V3 = [-2.02, 0.875, 2.16];
export const MONITOR: V3 = [-2.4, 1.3, 1.86];
export const DESK: V3 = [-6.5, 0, -3.0];
export const DESK_TOP = 0.76;
export const MUG: V3 = [-6.72, DESK_TOP, -3.13];
export const SPOT: V3 = [-6.56, DESK_TOP + 0.0005, -3.0]; // the glint, the pit, the jar
export const NOTEBOOK: V3 = [-7.05, DESK_TOP + 0.003, -2.9];
export const LAMP_HEAD: V3 = [-6.86, 1.16, -3.22];
const LIGHT_COLD = '#dde9f6';

const HAZE: Mat = {color: '#0e1318', rough: 1};
const PLASTIC: Mat = {color: '#24292e', rough: 0.6, metal: 0.1};
const CERAMIC: Mat = {color: '#d6d9d6', rough: 0.4, metal: 0, env: 0.6};
const TEA: Mat = {color: '#3b2a1e', rough: 0.2, env: 0.6};
const PAPER: Mat = {color: '#c9cdc8', rough: 0.95};
const AMBER: Mat = {color: '#ffb547', emissive: '#ffb547', glow: 2.2};
const AMBER_OFF: Mat = {color: '#4a3417', emissive: '#4a3417', glow: 0.3};

// ---------------------------------------------------------------- timing of things in the hall

const ARM_FROM = shotStart('arm');
const ARM_TO = shotEnd('arm');
// height of the gripper: up, down into the chamber, lets go, back up
export const gripperY = (v: number) => {
  const down = smooth(ramp(v, ARM_FROM + 0.1, ARM_TO - 0.7));
  const up = smooth(ramp(v, ARM_TO - 0.45, ARM_TO + 1.5));
  return lerp(lerp(3.05, 0.66, down), 3.05, up);
};
const holdsCapsule = (v: number) => v < ARM_TO - 0.55;
const lidAngle = (v: number) => 1.72 * (1 - smooth(ramp(v, LID - 0.55, LID)));
const lockK = (v: number, i: number) => smooth(ramp(v, LOCKS[i] - 0.12, LOCKS[i]));

// ---------------------------------------------------------------- the room

const Room: React.FC = () => {
  const strips = useMemo(() => {
    const s: V3[] = [];
    for (let x = -14; x <= 14; x += 4) for (const z of [-4.5, -1.5, 1.5, 4.5]) s.push([x, 3.38, z]);
    return s;
  }, []);
  const benches = useMemo(
    () =>
      [4.5, 8.5, 12.5].flatMap((x, i) => [
        {p: [x, 0, -3.2] as V3, i: i * 2},
        {p: [x, 0, 3.0] as V3, i: i * 2 + 1},
      ]),
    [],
  );
  return (
    <group>
      <Box size={[34, 0.1, 16]} position={[0, -0.05, 0]} m={FLOOR} />
      {/* floor seams */}
      {Array.from({length: 17}).map((_, i) => (
        <Box key={i} size={[0.012, 0.004, 16]} position={[-16 + i * 2, 0.002, 0]} m={HAZE} shadow={false} />
      ))}
      <Box size={[34, 0.1, 16]} position={[0, 3.45, 0]} m={{color: '#161a1f', rough: 0.9}} shadow={false} />
      {/* walls with panel seams */}
      {/* back wall with the door to the corridor */}
      <Box size={[11.95, 3.4, 0.2]} position={[-11.025, 1.7, -7.1]} m={PANEL} />
      <Box size={[20.95, 3.4, 0.2]} position={[6.525, 1.7, -7.1]} m={PANEL} />
      <Box size={[1.1, 1.25, 0.2]} position={[-4.5, 2.775, -7.1]} m={PANEL} />
      <HallDoor />
      <Box size={[0.2, 3.4, 16]} position={[-16.1, 1.7, 0]} m={PANEL} />
      <Box size={[0.2, 3.4, 16]} position={[16.1, 1.7, 0]} m={PANEL} />
      <Box size={[34, 3.4, 0.2]} position={[0, 1.7, 8.1]} m={PANEL} />
      {Array.from({length: 28}).map((_, i) => (
        Math.abs(-15.6 + i * 1.2 + 4.5) < 0.7 ? null : <Box key={i} size={[0.02, 3.4, 0.02]} position={[-15.6 + i * 1.2, 1.7, -6.99]} m={HAZE} shadow={false} />
      ))}
      <Box size={[34, 0.03, 0.02]} position={[0, 1.2, -6.99]} m={HAZE} shadow={false} />
      {strips.map((p, i) => (
        <group key={i}>
          <Box size={[3.1, 0.06, 0.3]} position={[p[0], 3.39, p[2]]} m={DARK_STEEL} shadow={false} />
          <Glow size={[2.9, 0.02, 0.2]} position={[p[0], 3.355, p[2]]} color={LIGHT_COLD} />
        </group>
      ))}
      {/* racks along the back wall, with a few status lights */}
      {Array.from({length: 7}).map((_, i) => {
        const x = -13 + i * 1.1;
        return (
          <group key={i} position={[x, 0, -6.55]}>
            <Box size={[1.0, 2.2, 0.8]} position={[0, 1.1, 0]} m={DARK_STEEL} />
            {Array.from({length: 5}).map((__, j) => (
              <Glow
                key={j}
                size={[0.03, 0.03, 0.01]}
                position={[-0.38 + random(`rack-${i}-${j}`) * 0.6, 0.6 + j * 0.3, 0.405]}
                color={random(`rack-c-${i}-${j}`) > 0.75 ? '#ffb547' : '#7fd6ff'}
              />
            ))}
          </group>
        );
      })}
      {/* lab benches with boxes of equipment */}
      {benches.map(({p, i}) => (
        <group key={i} position={p}>
          <Box size={[2.6, 0.06, 0.9]} position={[0, 0.9, 0]} m={STEEL} />
          {[-1.2, 1.2].map((lx) => (
            <Box key={lx} size={[0.06, 0.9, 0.8]} position={[lx, 0.45, 0]} m={DARK_STEEL} />
          ))}
          <Box size={[0.5, 0.35, 0.4]} position={[-0.7, 1.1, -0.1]} m={PLASTIC} />
          <Box size={[0.3, 0.5, 0.3]} position={[0.5, 1.18, 0.1]} m={DARK_STEEL} />
          <Glow size={[0.2, 0.12, 0.01]} position={[-0.7, 1.12, 0.105]} color="#2f6170" />
        </group>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- the chamber

const LOCK_ANGLES = [Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 + (4 * Math.PI) / 3];

const Chamber: React.FC<{v: number}> = ({v}) => {
  const a = lidAngle(v);
  const gy = gripperY(v);
  const capsule: V3 = holdsCapsule(v) ? [0, gy - 0.1, 0] : [0, 0.53, 0];
  return (
    <group>
      <Cyl r={0.92} r2={1.0} h={0.5} seg={16} position={[0, 0.25, 0]} m={DARK_STEEL} />
      {/* the floor of the chamber is lit from below */}
      <Cyl r={0.77} h={0.02} seg={24} position={[0, 0.5, 0]} m={{color: '#5d7286', emissive: '#4f7da8', glow: 0.35, rough: 0.4, metal: 0.4, env: 0.6}} />
      <mesh position={[0, 0.512, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.77, 0.9, 24]} />
        <meshBasicMaterial color="#5f97c8" toneMapped={false} />
      </mesh>
      {[0.57, 0.67, 0.77].map((r) => (
        <Cyl key={r} r={r} h={1.32} seg={24} open position={[0, 1.17, 0]} m={GLASS} />
      ))}
      {/* thin steel rings that hold the glass */}
      {[0.53, 1.82].map((y) => (
        <Cyl key={y} r={0.8} h={0.035} seg={24} open position={[0, y, 0]} m={STEEL} />
      ))}
      <Cyl r={0.85} h={0.08} seg={24} open position={[0, 1.86, 0]} m={DARK_STEEL} />
      {/* lid on a hinge at -x */}
      <group position={[-0.84, 1.9, 0]} rotation={[0, 0, a]}>
        <Cyl r={0.8} h={0.05} seg={24} position={[0.84, 0.025, 0]} m={DARK_STEEL} />
        <Cyl r={0.81} h={0.02} seg={24} open position={[0.84, 0.04, 0]} m={STEEL} />
        <Cyl r={0.2} h={0.05} seg={12} position={[0.84, 0.07, 0]} m={DARK_STEEL} />
        <Box size={[0.12, 0.08, 0.5]} position={[0.02, 0.02, 0]} m={DARK_STEEL} />
      </group>
      {/* three locks */}
      {LOCK_ANGLES.map((ang, i) => {
        const k = lockK(v, i);
        const r = lerp(1.0, 0.78, k);
        const on = v >= LOCKS[i];
        return (
          <group key={i} rotation={[0, -ang + Math.PI / 2, 0]}>
            <Box size={[0.18, 0.2, 0.2]} position={[0, 1.86, 0.95]} m={DARK_STEEL} />
            <Box size={[0.1, 0.05, 0.26]} position={[0, 1.97, r]} m={STEEL} />
            <Box size={[0.05, 0.03, 0.012]} position={[0, 1.82, 1.056]} m={on ? AMBER : AMBER_OFF} shadow={false} />
          </group>
        );
      })}
      {/* sample cup */}
      <group position={capsule}>
        <Cyl r={0.045} h={0.05} seg={10} m={STEEL} />
        <Cyl r={0.035} h={0.012} seg={10} position={[0, 0.02, 0]} m={RUBBER} shadow={false} />
      </group>
      <pointLight position={[0, 0.75, 0]} color="#7fb2e6" intensity={1.4} distance={3} decay={2} />
    </group>
  );
};

// robotic arm on a ceiling rail above the chamber
const Arm: React.FC<{v: number}> = ({v}) => {
  const gy = gripperY(v);
  const grip = holdsCapsule(v) ? 0.05 : 0.075;
  const len = 3.4 - gy;
  return (
    <group>
      <Box size={[0.25, 0.12, 4]} position={[0, 3.32, 0]} m={DARK_STEEL} />
      <Box size={[0.3, 0.18, 0.3]} position={[0, 3.2, 0]} m={STEEL} />
      <Cyl r={0.05} h={len} seg={8} position={[0, gy + len / 2, 0]} m={STEEL} />
      <Cyl r={0.07} h={0.12} seg={8} position={[0, gy + 0.3, 0]} m={DARK_STEEL} />
      <Box size={[0.16, 0.06, 0.12]} position={[0, gy, 0]} m={DARK_STEEL} />
      {[-1, 1].map((s) => (
        <Box key={s} size={[0.02, 0.12, 0.05]} position={[s * grip, gy - 0.07, 0]} m={STEEL} />
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- console with the recorder and the counter

const Console: React.FC<{v: number}> = ({v}) => (
  <group>
    <group position={CONSOLE}>
      <Box size={[1.6, 0.86, 0.72]} position={[0, 0.43, 0]} m={DARK_STEEL} />
      <Box size={[1.62, 0.04, 0.76]} position={[0, 0.865, 0]} m={STEEL} />
      <Box size={[0.08, 0.2, 0.08]} position={[0, 0.98, -0.2]} m={DARK_STEEL} />
      <Box size={[0.4, 0.6, 0.05]} position={[0, 1.3, -0.17]} m={PLASTIC} />
      {/* keyboard */}
      <Box size={[0.46, 0.02, 0.16]} position={[-0.05, 0.895, 0.12]} m={PLASTIC} />
      {Array.from({length: 24}).map((_, i) => (
        <Box key={i} size={[0.03, 0.008, 0.03]} position={[-0.24 + (i % 12) * 0.039, 0.909, 0.08 + Math.floor(i / 12) * 0.05]} m={DARK_STEEL} shadow={false} />
      ))}
    </group>
    <CounterScreen v={v} size={[0.34, 0.51]} position={[MONITOR[0], MONITOR[1], MONITOR[2] + 0.001]} />
    <pointLight position={[MONITOR[0], MONITOR[1], MONITOR[2] + 0.35]} color={v < COUNT_ZERO ? '#7fb9c9' : '#ff4a3d'} intensity={0.5} distance={2} decay={2} />
    {/* voice recorder */}
    <group position={RECORDER} rotation={[0, 0.35, 0]}>
      <Box size={[0.075, 0.022, 0.14]} position={[0, 0.011, 0]} m={PLASTIC} />
      <RecorderScreen v={v} size={[0.058, 0.029]} position={[0, 0.0225, -0.025]} rotation={[-Math.PI / 2, 0, 0]} />
      <Cyl r={0.009} h={0.006} seg={10} position={[0, 0.024, 0.03]} m={{color: '#c0392b', rough: 0.5}} shadow={false} />
      {[-0.02, 0.02].map((x) => (
        <Box key={x} size={[0.014, 0.004, 0.01]} position={[x, 0.023, 0.03]} m={DARK_STEEL} shadow={false} />
      ))}
      {Array.from({length: 12}).map((_, i) => (
        <Box key={i} size={[0.003, 0.002, 0.03]} position={[-0.025 + i * 0.0045, 0.0225, 0.055]} m={RUBBER} shadow={false} />
      ))}
    </group>
  </group>
);

// ---------------------------------------------------------------- Gleb's desk

const jarLift = (v: number) => 0.2 * (1 - smooth(ramp(v, JAR_DOWN - 1.25, JAR_DOWN)));
const jarPlaced = (v: number) => v >= shotStart('jar');

export const Jar: React.FC<{v: number}> = ({v}) => {
  const ep = useScene();
  const y = SPOT[1] + jarLift(v) - (ep ? ep.jarSink : 0);
  return (
    <group position={[SPOT[0], y, SPOT[2]]}>
      <Cyl r={0.06} h={0.1} seg={20} open position={[0, 0.05, 0]} m={{...GLASS, opacity: 0.2}} />
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.06, 20, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#cfe3f0" transparent opacity={0.13} metalness={0.1} roughness={0.05} envMapIntensity={1.6} depthWrite={false} flatShading />
      </mesh>
      <Cyl r={0.062} h={0.006} seg={20} position={[0, 0.003, 0]} m={{color: '#cfe0ea', metal: 0.2, rough: 0.2, opacity: 0.55, env: 1.5, glass: true}} />
      <Cyl r={0.0605} h={0.004} seg={20} open position={[0, 0.1, 0]} m={{color: '#cfe0ea', metal: 0.2, rough: 0.2, opacity: 0.45, env: 1.5, glass: true}} />
      <Ico r={0.013} detail={0} position={[0, 0.167, 0]} m={{color: '#cfe0ea', metal: 0.2, rough: 0.2, opacity: 0.6, env: 1.5, glass: true}} />
    </group>
  );
};

const Lamp: React.FC = () => (
  <group>
    <Cyl r={0.07} r2={0.08} h={0.02} seg={10} position={[-6.98, DESK_TOP + 0.01, -3.28]} m={DARK_STEEL} />
    <Cyl r={0.008} h={0.34} seg={6} position={[-6.98, DESK_TOP + 0.18, -3.28]} rotation={[0.25, 0, 0.05]} m={STEEL} />
    <Cyl r={0.008} h={0.24} seg={6} position={[-6.92, 1.07, -3.25]} rotation={[0, 0, -1.0]} m={STEEL} />
    <Cyl r={0.025} r2={0.075} h={0.1} seg={10} open position={LAMP_HEAD} rotation={[0.25, 0, 0.45]} m={DARK_STEEL} />
    <Glow size={[0.06, 0.004, 0.06]} position={[LAMP_HEAD[0] + 0.02, LAMP_HEAD[1] - 0.045, LAMP_HEAD[2] + 0.012]} color="#f4f8ff" />
  </group>
);

const Mug: React.FC = () => (
  <group position={MUG}>
    <Cyl r={0.042} r2={0.04} h={0.095} seg={12} position={[0, 0.0475, 0]} m={CERAMIC} />
    <Cyl r={0.036} h={0.002} seg={12} position={[0, 0.08, 0]} m={TEA} shadow={false} />
    <mesh position={[-0.046, 0.05, 0]} rotation={[0, 0, 0]}>
      <torusGeometry args={[0.022, 0.006, 4, 8, Math.PI]} />
      <meshStandardMaterial color="#d6d9d6" flatShading roughness={0.4} />
    </mesh>
  </group>
);

// the glint next to the mug: a tiny star that breathes
const useStar = () =>
  useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 128;
    cv.height = 128;
    const c = cv.getContext('2d')!;
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.12, 'rgba(220,235,255,0.8)');
    g.addColorStop(0.4, 'rgba(160,190,230,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
    c.fillStyle = 'rgba(235,245,255,0.9)';
    c.fillRect(0, 62, 128, 4);
    c.fillRect(62, 0, 4, 128);
    return new CanvasTexture(cv);
  }, []);

const Glint: React.FC<{v: number}> = ({v}) => {
  const tex = useStar();
  const g0 = shotStart('glint');
  const pulse = 0.75 + 0.25 * Math.sin(v * 5.3) * Math.sin(v * 2.1 + 1);
  const size = v < g0 ? 0.006 : v < shotStart('pit') ? 0.006 + 0.012 * smooth(ramp(v, g0 + 0.3, g0 + 1.2)) : 0.008;
  return (
    <sprite position={[SPOT[0], SPOT[1] + 0.002, SPOT[2]]} scale={[size * pulse, size * pulse, 1]}>
      <spriteMaterial map={tex} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  );
};

const noteK = (v: number) => smooth(ramp(v, shotStart('note') + 0.1, shotEnd('note') - 0.1));

const Desk: React.FC<{v: number}> = ({v}) => {
  const ep = useScene();
  const nk = noteK(v);
  if (ep?.deskGone) return null;
  return (
    <group>
      <group position={DESK}>
        <Box size={[1.5, 0.04, 0.74]} position={[0, DESK_TOP - 0.02, 0]} m={{color: '#646c73', metal: 0.75, rough: 0.42, env: 0.8}} />
        {[[-0.7, -0.33], [0.7, -0.33], [-0.7, 0.33], [0.7, 0.33]].map(([x, z]) => (
          <Box key={`${x}${z}`} size={[0.04, DESK_TOP - 0.04, 0.04]} position={[x, (DESK_TOP - 0.04) / 2, z]} m={DARK_STEEL} />
        ))}
        <Box size={[0.42, 0.62, 0.66]} position={[0.5, 0.35, 0]} m={DARK_STEEL} />
      </group>
      <Lamp />
      <Mug />
      {/* papers */}
      {[[-6.3, -2.86, 0.2], [-6.27, -2.9, -0.1], [-6.95, -3.18, 0.4]].map(([x, z, r], i) => (
        <Box key={i} size={[0.21, 0.002, 0.297]} position={[x, DESK_TOP + 0.002 + i * 0.002, z]} rotation={[0, r, 0]} m={PAPER} shadow={false} />
      ))}
      <NotePage k={nk} size={[0.21, 0.148]} position={NOTEBOOK} rotation={[-Math.PI / 2, 0, 0.12]} />
      <Box size={[0.215, 0.006, 0.152]} position={[NOTEBOOK[0], NOTEBOOK[1] - 0.004, NOTEBOOK[2]]} rotation={[0, 0.12, 0]} m={DARK_STEEL} shadow={false} />
      {/* pocket microscope and its monitor */}
      <group position={[-6.28, DESK_TOP, -3.2]}>
        <Box size={[0.06, 0.01, 0.06]} position={[0, 0.005, 0]} m={DARK_STEEL} />
        <Cyl r={0.004} h={0.08} seg={6} position={[0.02, 0.05, 0]} m={STEEL} />
        <Cyl r={0.013} h={0.1} seg={10} position={[0, 0.07, 0.01]} rotation={[0.5, 0, 0]} m={PLASTIC} />
      </group>
      <group position={[-6.05, DESK_TOP, -3.3]} rotation={[0, -0.35, 0]}>
        <Box size={[0.26, 0.17, 0.02]} position={[0, 0.14, 0]} m={PLASTIC} />
        <Box size={[0.03, 0.06, 0.03]} position={[0, 0.03, -0.01]} m={DARK_STEEL} />
        <ScopeScreen size={[0.24, 0.15]} position={[0, 0.14, 0.0105]} />
      </group>
      {Array.from({length: 8}).map((_, i) => (
        <Box key={i} size={[0.032, 0.006, 0.006]} position={[-6.25 + i * 0.026, DESK_TOP + 0.003, -3.22 - Math.sin(i * 0.6) * 0.04]} rotation={[0, 0.4, 0]} m={RUBBER} shadow={false} />
      ))}
      {jarPlaced(v) ? <Jar v={v} /> : null}
      {ep ? <DeskPatch r={ep.deskPatch} v={ep.v} /> : <Glint v={v} />}
      {ep ? <Box size={[0.6, 0.12, 0.45]} position={[SPOT[0], DESK_TOP - 0.08, SPOT[2]]} m={DARK_STEEL} /> : null}
      <spotLight
        position={LAMP_HEAD}
        color="#e8f1ff"
        intensity={0.9}
        distance={3}
        angle={0.6}
        penumbra={0.7}
        decay={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        target={useTarget([SPOT[0] - 0.05, DESK_TOP, SPOT[2]])}
      />
    </group>
  );
};

export const useTarget = (p: V3) =>
  useMemo(() => {
    const o = new Object3D();
    o.position.set(...p);
    o.updateMatrixWorld();
    return o;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p[0], p[1], p[2]]);

// ---------------------------------------------------------------- later episodes: the door, the grey patch

export const MASS: Mat = {color: '#9aa2a9', metal: 0.6, rough: 0.28, env: 1.1};
export const HALL_DOOR: V3 = [-4.5, 0, -7.1];
export const DOOR_WINDOW: V3 = [-4.5, 1.6, -7.1];

// steel door with a small square window of thick glass
const HallDoor: React.FC = () => {
  const ep = useScene();
  const [x, , z] = HALL_DOOR;
  return (
    <group>
      <Box size={[0.32, 1.4, 0.07]} position={[x - 0.34, 0.7, z]} m={DARK_STEEL} />
      <Box size={[0.36, 1.4, 0.07]} position={[x, 0.7, z]} m={DARK_STEEL} />
      <Box size={[0.32, 1.4, 0.07]} position={[x + 0.34, 0.7, z]} m={DARK_STEEL} />
      <Box size={[1.0, 0.32, 0.07]} position={[x, 1.94, z]} m={DARK_STEEL} />
      <Box size={[0.32, 0.38, 0.07]} position={[x - 0.34, 1.59, z]} m={DARK_STEEL} />
      <Box size={[0.32, 0.38, 0.07]} position={[x + 0.34, 1.59, z]} m={DARK_STEEL} />
      <Box size={[0.36, 0.38, 0.02]} position={[x, 1.59, z]} m={{...GLASS, opacity: 0.18}} />
      {/* frame */}
      <Box size={[1.12, 0.06, 0.24]} position={[x, 2.13, z]} m={STEEL} />
      <Box size={[0.06, 2.16, 0.24]} position={[x - 0.53, 1.07, z]} m={STEEL} />
      <Box size={[0.06, 2.16, 0.24]} position={[x + 0.53, 1.07, z]} m={STEEL} />
      {ep?.corridorOutside ? <OutsideCorridor red={ep.redLamp} /> : null}
    </group>
  );
};

// the service corridor behind the hall's back wall, with the lock lever and its lamp
const OutsideCorridor: React.FC<{red: boolean}> = ({red}) => {
  const [x, , z] = HALL_DOOR;
  return (
    <group>
      <Box size={[8, 0.1, 3]} position={[x, -0.05, z - 1.6]} m={FLOOR} />
      <Box size={[8, 0.1, 3]} position={[x, 2.85, z - 1.6]} m={{color: '#161a1f', rough: 0.9}} shadow={false} />
      <Box size={[8, 2.9, 0.2]} position={[x, 1.45, z - 3.0]} m={PANEL} />
      <Box size={[0.2, 2.9, 3]} position={[x - 4, 1.45, z - 1.6]} m={PANEL} />
      <Box size={[0.2, 2.9, 3]} position={[x + 4, 1.45, z - 1.6]} m={PANEL} />
      <Glow size={[0.8, 0.02, 0.3]} position={[x + 1.5, 2.79, z - 1.4]} color={LIGHT_COLD} />
      <pointLight position={[x + 1.5, 2.5, z - 1.4]} color={LIGHT_COLD} intensity={1.6} distance={6} decay={2} />
      {/* lever box and the lamp above the door */}
      <Box size={[0.16, 0.3, 0.08]} position={[x + 0.75, 1.2, z - 0.14]} m={DARK_STEEL} />
      <group position={[x + 0.75, 1.2, z - 0.2]} rotation={[0, 0, red ? -1.2 : 0.3]}>
        <Box size={[0.03, 0.22, 0.03]} position={[0, 0.1, 0]} m={STEEL} />
      </group>
      <Box size={[0.12, 0.08, 0.06]} position={[x, 2.28, z - 0.13]} m={DARK_STEEL} />
      <Box size={[0.08, 0.05, 0.02]} position={[x, 2.28, z - 0.17]} m={red ? {color: '#ff3b30', emissive: '#ff3b30', glow: 2.5} : {color: '#3a1512'}} shadow={false} />
      {red ? <pointLight position={[x, 2.2, z - 0.5]} color="#ff3b30" intensity={0.8} distance={3} decay={2} /> : null}
    </group>
  );
};

// grey glossy patch on the desk where the jar sinks
const DeskPatch: React.FC<{r: number; v: number}> = ({r, v}) => {
  const geo = useMemo(() => {
    const seg = 28;
    const pts: number[] = [];
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2;
      const a1 = ((i + 1) / seg) * Math.PI * 2;
      const r0 = r * (0.85 + 0.15 * Math.sin(a0 * 3 + 1) + 0.06 * Math.sin(a0 * 7));
      const r1 = r * (0.85 + 0.15 * Math.sin(a1 * 3 + 1) + 0.06 * Math.sin(a1 * 7));
      pts.push(0, 0.001, 0, Math.cos(a1) * r1, 0, Math.sin(a1) * r1, Math.cos(a0) * r0, 0, Math.sin(a0) * r0);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pts, 3));
    g.computeVertexNormals();
    return g;
  }, [r]);
  if (r <= 0) return null;
  return (
    <mesh geometry={geo} position={[SPOT[0], DESK_TOP + 0.0012, SPOT[2]]} rotation={[0, v * 0.02, 0]} receiveShadow>
      <Material m={MASS} />
    </mesh>
  );
};

// ---------------------------------------------------------------- Gleb in the hall

const walk = (v: number, a: number, b: number) => {
  const k = smooth(ramp(v, a, b));
  const ph = (v - a) * 9.5;
  const moving = v > a && v < b ? 1 : 0;
  return {k, swing: Math.sin(ph) * 0.42 * moving};
};

const GlebInHall: React.FC<{v: number; shot: string}> = ({v, shot}) => {
  if (shot === 'hall') {
    const type = Math.sin(v * 13) * 0.04;
    return (
      <Gleb
        position={[-2.3, 0, 2.66]}
        rotation={Math.PI}
        pose={{armL: [0.75, 0.12], armR: [0.7 + type, -0.12], elbowL: 0.55, elbowR: 0.6, head: [0.42, 0.05], stoop: 0.22}}
      />
    );
  }
  if (shot === 'approach') {
    const a = shotStart('approach');
    const {k, swing} = walk(v, a - 0.2, shotEnd('approach') + 0.2);
    const p = lerp3([-2.1, 0, 2.5], [-0.55, 0, 1.22], k);
    const rot = Math.atan2(-p[0], -p[2]);
    return (
      <Gleb
        position={p}
        rotation={rot}
        pose={{legL: swing, legR: -swing, armL: [-swing * 0.5, 0.06], armR: [0.85, -0.1], elbowR: 0.5, head: [0.2, 0], stoop: 0.12}}
        rightHand={<Flashlight on={false} />}
      />
    );
  }
  return null;
};

export const Flashlight: React.FC<{on: boolean}> = ({on}) => (
  <group rotation={[Math.PI / 2, 0, 0]}>
    <Cyl r={0.018} h={0.16} seg={8} position={[0, -0.04, 0]} m={RUBBER} />
    <Cyl r={0.026} r2={0.019} h={0.04} seg={8} position={[0, -0.13, 0]} m={DARK_STEEL} />
    <Cyl r={0.022} h={0.004} seg={8} position={[0, -0.152, 0]} m={on ? {color: '#f4f8ff', emissive: '#f4f8ff', glow: 2} : STEEL} shadow={false} />
  </group>
);

// close-up of the glove on the glass and the flashlight beam into the empty chamber
const GLASS_DIR: V3 = [-0.399, 0, 0.917];
const GlassMoment: React.FC<{v: number}> = ({v}) => {
  const on = v >= shotStart('glass') + 0.3;
  const tap = Math.max(0, Math.sin(Math.PI * ramp(v, GLASS_TAP - 0.12, GLASS_TAP + 0.05))) + Math.max(0, Math.sin(Math.PI * ramp(v, GLASS_TAP + 0.43, GLASS_TAP + 0.6)));
  const r = 0.8 + tap * 0.012;
  const hand: V3 = [GLASS_DIR[0] * r, 1.28, GLASS_DIR[2] * r];
  const yaw = Math.atan2(GLASS_DIR[0], GLASS_DIR[2]);
  const src: V3 = [-0.02, 1.52, 1.05];
  const dst: V3 = [0.02, 0.53, 0.0];
  const target = useTarget(dst);
  const beamLen = Math.hypot(dst[0] - src[0], dst[1] - src[1], dst[2] - src[2]);
  const pitch = Math.atan2(Math.hypot(dst[0] - src[0], dst[2] - src[2]), src[1] - dst[1]);
  return (
    <group>
      {/* palm faces the glass, fingers up */}
      <group position={hand} rotation={[0, yaw, 0]}>
        <GloveHand position={[0, 0, 0]} rotation={[Math.PI, 0, 0.15]} curl={0.08} spread={0.18} />
      </group>
      {on ? (
        <>
          <spotLight position={src} target={target} color="#f2f6ff" intensity={6} distance={4} angle={0.22} penumbra={0.5} decay={2} />
          <group position={src} rotation={[0, Math.atan2(dst[0] - src[0], dst[2] - src[2]), 0]}>
            <group rotation={[pitch, 0, 0]}>
              <mesh position={[0, -beamLen / 2, 0]}>
                <cylinderGeometry args={[0.02, 0.24, beamLen, 16, 1, true]} />
                <meshBasicMaterial color="#9fb8d6" transparent opacity={0.07} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
              </mesh>
            </group>
          </group>
        </>
      ) : null}
    </group>
  );
};

// gloved hands on the desk: resting, writing, trembling, holding the jar
const DeskHands: React.FC<{v: number; shot: string}> = ({v, shot}) => {
  const tremble = shot === 'hands' ? 1 : shot === 'jarhold' || shot === 'jar' ? 0.4 : 0;
  const jx = tremble * 0.004 * Math.sin(v * 41) + tremble * 0.002 * Math.sin(v * 67 + 1);
  const jz = tremble * 0.003 * Math.sin(v * 53 + 2);
  const flat: V3 = [Math.PI / 2, 0, 0];
  if (shot === 'desk' || shot === 'glint') {
    return (
      <>
        <GloveHand position={[-6.86, DESK_TOP + 0.016, -2.84]} rotation={[Math.PI / 2, 0, 0.25]} curl={0.35} />
        <GloveHand position={[-6.36, DESK_TOP + 0.016, -2.86]} rotation={[Math.PI / 2, 0, -0.3]} curl={0.35} />
      </>
    );
  }
  if (shot === 'jar') {
    const y = SPOT[1] + jarLift(v) + 0.19;
    const away = smooth(ramp(v, JAR_DOWN + 0.25, JAR_DOWN + 0.9));
    return (
      <GloveHand
        position={[SPOT[0] + 0.01 + jx, y + away * 0.15, SPOT[2] + 0.03 + away * 0.08]}
        rotation={[0.25, 0, 0]}
        curl={0.9}
        spread={0.05}
      />
    );
  }
  if (shot === 'note') {
    const k = noteK(v);
    const tip: V3 = [NOTEBOOK[0] - 0.085 + 0.15 * k, DESK_TOP + 0.004, NOTEBOOK[2] + 0.024 + Math.sin(v * 31) * 0.0015];
    return (
      <group position={tip}>
        <group rotation={[0, -0.5, 0]}>
          <group rotation={[0, 0, -0.75]}>
            <Cyl r={0.0035} h={0.14} seg={6} position={[0, 0.07, 0]} m={{color: '#c9a24a', rough: 0.6}} />
          </group>
        </group>
        <GloveHand position={[0.07, 0.03, 0.055]} rotation={[Math.PI / 2 - 0.5, -0.5, -0.9]} curl={1.1} spread={0.02} sleeve />
      </group>
    );
  }
  if (shot === 'hands' || shot === 'jarhold') {
    return <GloveHand position={[-6.8 + jx, DESK_TOP + 0.016, -2.86 + jz]} rotation={[flat[0], 0, 0.35 + jx * 8]} curl={0.5} />;
  }
  return null;
};

// ---------------------------------------------------------------- the whole hall

export const Hall: React.FC<{v: number; shot: string}> = ({v, shot}) => {
  const near = shot === 'desk' || shot === 'glint' || shot === 'jar' || shot === 'note' || shot === 'hands' || shot === 'jarhold';
  return (
    <group>
      <Room />
      <Chamber v={v} />
      <Arm v={v} />
      <Console v={v} />
      <Desk v={v} />
      <GlebInHall v={v} shot={shot} />
      {shot === 'glass' ? <GlassMoment v={v} /> : null}
      {near ? <DeskHands v={v} shot={shot} /> : null}
      {/* lights: cold ceiling strips; only the one above the chamber throws shadows */}
      <ambientLight intensity={0.05} color="#9fb4c8" />
      <hemisphereLight color="#c7d8ea" groundColor="#1a1f25" intensity={0.12} />
      <spotLight
        position={[0.3, 3.3, 0.6]}
        target={useTarget([0, 0, 0])}
        color={LIGHT_COLD}
        intensity={8}
        distance={8}
        angle={0.9}
        penumbra={0.8}
        decay={2}
        castShadow={!near}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      {[[-6, -1.5], [-2.4, 2.8], [6, 0], [-10, 3], [10, -3.5]].map(([x, z]) => (
        <pointLight key={`${x}${z}`} position={[x, 3.1, z]} color={LIGHT_COLD} intensity={1.3} distance={9} decay={2} />
      ))}
    </group>
  );
};
