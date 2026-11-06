import React from 'react';
import {Box, Cone, Cyl, Ico} from '../scene/parts';
import {Person, PersonPose} from '../scene/Characters';
import {Sky, SkyCols} from '../gta/World';
import {Pic, Facade, SHIRTS, PANTS, HAIR} from '../shawa/Sets';
import {Suitcase} from '../dvizh/Sets';
import {V3, rnd} from './cues';
import {drawBoard, drawCartSign, drawIce, drawPanelDisplay, drawWindows} from './tex';

export {Pic, Facade, Suitcase};

// ---------------------------------------------------------------- light and sky

export const DAY: SkyCols = {top: '#3f86d6', mid: '#93c3ec', low: '#f2e7cf', sunDir: [0.35, 0.42, -1], sun: 1, sunCol: '#fff2c8'};
// after the Sun is gone: no blue sky at all, only black with stars
export const VOID: SkyCols = {top: '#020308', mid: '#05070f', low: '#0b0f1c'};

export const DayLights: React.FC<{k?: number}> = ({k = 1}) => (
  <>
    <hemisphereLight color="#dff0ff" groundColor="#8a7c6a" intensity={1.25 * k} />
    <directionalLight position={[50, 90, -110]} color="#fff0d8" intensity={2.2 * k} />
    <directionalLight position={[-80, 40, 60]} color="#9ab8e0" intensity={0.45 * k} />
  </>
);
// starlight: dim and blue, just enough to read the shapes
export const DarkLights: React.FC<{k?: number}> = ({k = 1}) => (
  <>
    <hemisphereLight color="#5a6c9c" groundColor="#14161e" intensity={0.8 * k} />
    <directionalLight position={[-30, 60, 40]} color="#9aaee0" intensity={0.55 * k} />
  </>
);
export const SkyFog: React.FC<{c: SkyCols; fog?: [number, number]; fogCol?: string}> = ({c, fog = [60, 600], fogCol = '#cfe0ee'}) => (
  <>
    <Sky c={c} />
    <fog attach="fog" args={[fogCol, fog[0], fog[1]]} />
  </>
);

// ---------------------------------------------------------------- people

const SKIN = '#efd2b3';
export const TRUNKS = '#e8473a';

// the hero in swim trunks
export const Hero: React.FC<{position: V3; rotation?: number; pose?: PersonPose; rightHand?: React.ReactNode; leftHand?: React.ReactNode; frost?: number}> = ({frost = 0, ...p}) => (
  <Person
    {...p}
    shirt={frost > 0.5 ? '#d8c8bc' : SKIN}
    pants={frost > 0.5 ? '#d8c8bc' : SKIN}
    hair="#4a3324"
    skin={frost > 0.5 ? '#d8c8bc' : SKIN}
    bodyExtra={<Box size={[0.5, 0.3, 0.27]} position={[0, 0.83, 0]} color={TRUNKS} />}
  />
);

// the hero a month later: a fur coat over the same swim trunks, bare legs, sunglasses up on the forehead
export const CoatHero: React.FC<{position: V3; rotation?: number; pose?: PersonPose; rightHand?: React.ReactNode; leftHand?: React.ReactNode; glasses?: boolean}> = ({glasses = true, ...p}) => (
  <Person
    {...p}
    shirt="#6b4a32"
    pants={SKIN}
    hair="#4a3324"
    skin={SKIN}
    headExtra={glasses ? <Sunglasses /> : undefined}
    bodyExtra={
      <>
        <Box size={[0.6, 0.48, 0.36]} position={[0, 0.66, 0]} color="#6b4a32" />
        <Box size={[0.62, 0.1, 0.38]} position={[0, 0.43, 0]} color="#d8c8b0" />
        <Box size={[0.6, 0.11, 0.36]} position={[0, 1.55, 0]} color="#d8c8b0" />
        <Box size={[0.03, 0.6, 0.01]} position={[0, 1.15, 0.156]} color="#4a3222" shadow={false} />
      </>
    }
  />
);

const Sunglasses: React.FC = () => (
  <group position={[0, 0.305, 0.178]}>
    <Box size={[0.3, 0.018, 0.02]} color="#1a1a1e" shadow={false} />
    <Box size={[0.11, 0.06, 0.02]} position={[-0.07, -0.03, 0]} color="#1a1a1e" shadow={false} />
    <Box size={[0.11, 0.06, 0.02]} position={[0.07, -0.03, 0]} color="#1a1a1e" shadow={false} />
  </group>
);

export const Guy: React.FC<{position: V3; rotation?: number; i: number; pose?: PersonPose; rightHand?: React.ReactNode; leftHand?: React.ReactNode; scale?: number; child?: boolean; coat?: boolean}> = ({i, coat, ...p}) => (
  <Person
    {...p}
    shirt={coat ? ['#4a4a52', '#5a3a2a', '#2c3550', '#6a2a2a'][i % 4] : SHIRTS[i % SHIRTS.length]}
    pants={PANTS[(i * 3) % PANTS.length]}
    hair={HAIR[(i * 5) % HAIR.length]}
    longHair={i % 3 === 1}
    bodyExtra={coat ? <Box size={[0.6, 0.4, 0.36]} position={[0, 0.72, 0]} color={['#4a4a52', '#5a3a2a', '#2c3550', '#6a2a2a'][i % 4]} /> : undefined}
  />
);

export const walk = (t: number, amount = 1, freq = 1.7): PersonPose => {
  const ph = t * freq * Math.PI * 2;
  return {legL: Math.sin(ph) * 0.45 * amount, legR: -Math.sin(ph) * 0.45 * amount, armL: [-Math.sin(ph) * 0.35 * amount, 0.06], armR: [Math.sin(ph) * 0.35 * amount, -0.06]};
};

// ---------------------------------------------------------------- props

// ice cream cone: the origin is where the hand holds it (the middle of the cone)
export const IceCream: React.FC<{position?: V3; rotation?: V3; frozen?: number}> = ({position, rotation, frozen = 0}) => (
  <group position={position} rotation={rotation}>
    <Cone radius={0.04} height={0.13} position={[0, 0.0, 0]} rotation={[Math.PI, 0, 0]} color={frozen ? '#c8b89a' : '#d89a4a'} segments={7} />
    <Ico radius={0.05} detail={1} position={[0, 0.085, 0]} color={frozen ? '#e6f2fa' : '#f6b8c8'} emissive={frozen ? '#8ac8f0' : undefined} emissiveIntensity={frozen ? 0.55 : undefined} />
    <Ico radius={0.032} detail={0} position={[0.012, 0.13, 0.005]} color={frozen ? '#f2f8fc' : '#fff4e8'} />
    {frozen ? (
      <>
        <Box size={[0.012, 0.03, 0.012]} position={[0.03, 0.05, 0.03]} rotation={[0.3, 0, 0.4]} color="#ffffff" />
        <Box size={[0.012, 0.025, 0.012]} position={[-0.035, 0.06, 0.01]} rotation={[0.2, 0, -0.5]} color="#ffffff" />
      </>
    ) : null}
  </group>
);

export const Palm: React.FC<{position: V3; lean?: number; seed?: number; snow?: number; sway?: number}> = ({position, lean = 0.15, seed = 0, snow = 0, sway = 0}) => {
  const segs = 6;
  return (
    <group position={position} rotation={[0, seed * 2.1, lean]}>
      {Array.from({length: segs}).map((_, i) => (
        <Cyl key={i} rTop={0.13 - i * 0.008} rBottom={0.16 - i * 0.008} height={0.72} segments={6} position={[Math.sin(i * 0.25) * 0.08 * i, 0.36 + i * 0.7, 0]} rotation={[0, i * 0.4, 0]} color={i % 2 ? '#8a6a48' : '#7a5c3e'} />
      ))}
      <group position={[0.4, segs * 0.7 + 0.05, 0]} rotation={[sway * 0.2, 0, sway * 0.3]}>
        {Array.from({length: 7}).map((_, i) => {
          const a = (i / 7) * Math.PI * 2 + seed;
          return (
            <group key={i} rotation={[0, a, 0]}>
              <Box size={[0.36, 0.04, 1.6]} position={[0, -0.18, 0.75]} rotation={[0.42, 0, 0]} color={snow > 0.5 ? '#7a8a6a' : i % 2 ? '#4f9a46' : '#5aa850'} />
              {snow > 0.5 ? <Box size={[0.3, 0.05, 1.3]} position={[0, -0.13, 0.7]} rotation={[0.42, 0, 0]} color="#f2f6fa" /> : null}
            </group>
          );
        })}
        <Ico radius={0.22} position={[0, -0.1, 0]} color={snow > 0.5 ? '#eef2f6' : '#6a4a2a'} />
      </group>
    </group>
  );
};

export const Umbrella: React.FC<{position: V3; color?: string; snow?: number}> = ({position, color = '#e85d5d', snow = 0}) => (
  <group position={position}>
    <Cyl rTop={0.025} rBottom={0.025} height={2.2} position={[0, 1.1, 0]} color="#e8e4dc" />
    <Cone radius={1.25} height={0.45} position={[0, 2.25, 0]} color={color} segments={8} />
    <Cone radius={0.6} height={0.22} position={[0, 2.38, 0]} color={snow > 0.5 ? '#f4f8fb' : '#ffffff'} segments={8} />
    {snow > 0.5 ? <Cone radius={1.15} height={0.42} position={[0, 2.28, 0]} color="#eef3f8" segments={8} /> : null}
  </group>
);

// a straight sloped sun lounger; `lie` is where the hero lies (see BeachHero)
export const Lounger: React.FC<{position: V3; rotation?: number; snow?: number}> = ({position, rotation = 0, snow = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    {/* the bed: flat part for the legs, raised back */}
    <Box size={[0.72, 0.05, 1.1]} position={[0, 0.3, 0.45]} color={snow > 0.5 ? '#e8eef4' : '#f2f2f2'} />
    <Box size={[0.66, 0.03, 1.06]} position={[0, 0.34, 0.45]} color={snow > 0.5 ? '#f4f8fb' : '#3a7ad0'} />
    <group position={[0, 0.3, -0.1]} rotation={[0.45, 0, 0]}>
      <Box size={[0.72, 0.05, 1.0]} position={[0, 0, -0.5]} color={snow > 0.5 ? '#e8eef4' : '#f2f2f2'} />
      <Box size={[0.66, 0.03, 0.96]} position={[0, 0.04, -0.5]} color={snow > 0.5 ? '#f4f8fb' : '#3a7ad0'} />
    </group>
    {[-0.32, 0.32].map((x) => [0.9, -0.5].map((z) => <Box key={`${x}${z}`} size={[0.04, 0.3, 0.04]} position={[x, 0.15, z]} color="#9aa0a8" />))}
    {snow > 0.5 ? <Box size={[0.7, 0.08, 1.0]} position={[0, 0.4, 0.45]} color="#f6f9fc" /> : null}
  </group>
);

export const Towel: React.FC<{position: V3; rotation?: number; color?: string; frozen?: number}> = ({position, rotation = 0, color = '#f2c14e', frozen = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[0.9, 0.02, 1.8]} position={[0, 0.012, 0]} color={frozen ? '#c8d8e4' : color} />
    {[-0.5, 0, 0.5].map((z) => (
      <Box key={z} size={[0.92, 0.022, 0.14]} position={[0, 0.013, z]} color={frozen ? '#e8f0f6' : '#ffffff'} />
    ))}
  </group>
);

export const IceCreamCart: React.FC<{position: V3; rotation?: number; lid?: number}> = ({position, rotation = 0, lid = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[1.5, 0.85, 0.8]} position={[0, 0.62, 0]} color="#f4f6f8" />
    <Box size={[1.52, 0.12, 0.82]} position={[0, 0.32, 0]} color="#2f7fd0" />
    <Box size={[1.4, 0.04, 0.7]} position={[0, 1.06, 0]} color="#9ab0c4" />
    {/* the lid opens towards the seller */}
    <group position={[0, 1.1, -0.37]} rotation={[-lid * 1.1, 0, 0]}>
      <Box size={[1.46, 0.03, 0.76]} position={[0, 0, 0.37]} color="#d8e2ec" />
    </group>
    <Pic size={[1.3, 0.34]} res={[700, 184]} k="cart-sign" draw={drawCartSign} position={[0, 0.66, 0.405]} />
    {[-0.6, 0.6].map((x) => (
      <Cyl key={x} rTop={0.2} rBottom={0.2} height={0.08} position={[x, 0.2, 0.42]} rotation={[Math.PI / 2, 0, 0]} color="#2a2a30" />
    ))}
    <Cyl rTop={0.025} rBottom={0.025} height={1.6} position={[0.6, 1.9, -0.3]} color="#e8e4dc" />
    <Cone radius={0.95} height={0.36} position={[0.6, 2.8, -0.3]} color="#2f7fd0" segments={8} />
    <Cone radius={0.45} height={0.17} position={[0.6, 2.9, -0.3]} color="#ffffff" segments={8} />
  </group>
);

export const StreetLamp: React.FC<{position: V3; on?: number; rotation?: number}> = ({position, on = 0, rotation = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Cyl rTop={0.05} rBottom={0.07} height={4.2} position={[0, 2.1, 0]} color="#3a3e46" />
    <Box size={[0.7, 0.08, 0.1]} position={[0.3, 4.2, 0]} color="#3a3e46" />
    <Box size={[0.32, 0.1, 0.2]} position={[0.6, 4.14, 0]} color={on > 0.5 ? '#fff2c8' : '#8a8a80'} emissive="#ffd88a" emissiveIntensity={on > 0.5 ? 2.2 : 0} />
    {on > 0.5 ? <pointLight position={[0.6, 3.9, 0]} color="#ffd88a" intensity={22 * on} distance={14} decay={1.6} /> : null}
  </group>
);

// ---------------------------------------------------------------- the beach (sunny, dark or snowed in)

export const Beach: React.FC<{t: number; snow?: number; lamps?: number; people?: boolean}> = ({t, snow = 0, lamps = 0, people = false}) => {
  const sand = snow > 0.5 ? '#e8eef4' : '#ead7a0';
  return (
    <>
      {/* sand to z = -8, then the sea */}
      <Box size={[400, 0.1, 200]} position={[0, -0.05, 92]} color={sand} />
      {snow > 0.5 ? (
        <>
          <Box size={[400, 0.1, 300]} position={[0, -0.08, -158]} color="#c6dbe8" />
          <Pic size={[160, 80]} res={[1024, 512]} k="sea-ice" draw={(g, W, H) => drawIce(g, W, H, 3)} position={[0, -0.025, -48]} rotation={[-Math.PI / 2, 0, 0]} />
        </>
      ) : (
        <>
          <Box size={[400, 0.1, 300]} position={[0, -0.08, -158]} color="#2f8ac0" />
          {Array.from({length: 60}).map((_, i) => {
            const x = (rnd(i + 1) - 0.5) * 90;
            const z = -12 - rnd(i + 2) * 80;
            const s = 0.6 + 0.4 * Math.sin(t * 1.3 + i);
            return <Box key={i} size={[1.4 * s, 0.02, 0.12]} position={[x, -0.02 + 0.002 * (i % 4), z]} color="#9fd4f0" shadow={false} />;
          })}
          {/* foam along the shore, washing in and out */}
          <Box size={[400, 0.02, 0.5 + 0.25 * Math.sin(t * 1.1)]} position={[0, -0.018, -8.1]} color="#f4fbff" shadow={false} />
        </>
      )}
      {/* palms and umbrellas */}
      <Palm position={[-4.2, 0, -2.5]} lean={0.18} seed={1} snow={snow} sway={snow ? 0 : Math.sin(t * 0.9)} />
      <Palm position={[5.6, 0, -4.0]} lean={-0.2} seed={2} snow={snow} sway={snow ? 0 : Math.sin(t * 0.8 + 1)} />
      <Palm position={[-9.5, 0, 1.5]} lean={0.1} seed={3} snow={snow} sway={snow ? 0 : Math.sin(t * 1.0 + 2)} />
      <Palm position={[11, 0, -1]} lean={-0.12} seed={4} snow={snow} sway={snow ? 0 : Math.sin(t * 0.7 + 3)} />
      <Palm position={[-1.9, 0, -3.4]} lean={0.22} seed={5} snow={snow} sway={snow ? 0 : Math.sin(t * 0.85 + 4)} />
      <Palm position={[2.3, 0, -5.2]} lean={-0.15} seed={6} snow={snow} sway={snow ? 0 : Math.sin(t * 0.75 + 5)} />
      <Umbrella position={[-2.4, 0, 1.2]} snow={snow} />
      <Umbrella position={[3.4, 0, -1.8]} color="#f2c14e" snow={snow} />
      <Umbrella position={[-6.4, 0, -4.5]} color="#4a9ad8" snow={snow} />
      <Towel position={[-2.6, 0, 2.6]} rotation={0.2} color="#4fb6c2" frozen={snow} />
      <Towel position={[3.0, 0, -0.2]} rotation={-0.3} color="#c85b8a" frozen={snow} />
      <Towel position={[-6.0, 0, -2.6]} rotation={0.1} color="#6fbf73" frozen={snow} />
      <Lounger position={[0, 0, 0]} snow={snow} />
      <StreetLamp position={[-7.5, 0, 5.5]} on={lamps} />
      <StreetLamp position={[7.0, 0, 6.5]} on={lamps} rotation={Math.PI} />
      {people
        ? PEOPLE.map((p, i) => <Guy key={i} position={p.pos} rotation={p.yaw} i={i + 2} pose={p.pose} />)
        : null}
      {snow > 0.5 && t > 0 ? <Snowfall t={t} center={[0, 0, 0]} /> : null}
    </>
  );
};

const PEOPLE: {pos: V3; yaw: number; pose: PersonPose}[] = [
  {pos: [-3.6, 0, 3.8], yaw: 2.8, pose: {head: [-0.5, 0]}},
  {pos: [2.2, 0, 2.6], yaw: -2.9, pose: {head: [-0.55, 0.1], armR: [0.4, -0.1]}},
  {pos: [4.6, 0, 1.0], yaw: 3.0, pose: {head: [-0.45, -0.1]}},
  {pos: [-1.2, 0, 4.6], yaw: 3.1, pose: {head: [-0.6, 0], armL: [2.2, 0.1], elbowL: 0.2}},
  {pos: [1.0, 0, 5.4], yaw: -3.0, pose: {head: [-0.5, 0]}},
];

export const Snowfall: React.FC<{t: number; center: V3; n?: number; r?: number; h?: number}> = ({t, center, n = 160, r = 9, h = 7}) => (
  <group position={center}>
    {Array.from({length: n}).map((_, i) => {
      const x = (rnd(i * 3 + 1) - 0.5) * 2 * r + Math.sin(t * 0.8 + i) * 0.3;
      const z = (rnd(i * 3 + 2) - 0.5) * 2 * r;
      const y = h - (((t * (0.9 + rnd(i) * 0.6) + rnd(i * 3 + 3) * h) % h));
      return <Box key={i} size={[0.05, 0.05, 0.05]} position={[x, y, z]} rotation={[i, i * 2, 0]} color="#ffffff" emissive="#dfe8f4" emissiveIntensity={0.9} shadow={false} />;
    })}
  </group>
);

// ---------------------------------------------------------------- the night city (Moon, balcony)

export const Balcony: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <Box size={[2.4, 0.14, 1.2]} position={[0, 0, 0.6]} color="#b8b0a4" />
    <Box size={[2.4, 0.9, 0.06]} position={[0, 0.52, 1.18]} color="#8a8478" />
    <Box size={[0.06, 0.9, 1.2]} position={[-1.17, 0.52, 0.6]} color="#8a8478" />
    <Box size={[0.06, 0.9, 1.2]} position={[1.17, 0.52, 0.6]} color="#8a8478" />
    {/* the balcony door, lit from inside */}
    <Box size={[0.9, 2.0, 0.02]} position={[0.5, 1.07, 0.012]} color="#ffd98a" emissive="#ffc870" emissiveIntensity={0.9} shadow={false} />
  </group>
);

export const MoonBall: React.FC<{position: V3; r: number; on: number}> = ({position, r, on}) => (
  <group position={position}>
    <mesh>
      <icosahedronGeometry args={[r, 2]} />
      <meshStandardMaterial color="#cfccc2" flatShading emissive="#e8e4d8" emissiveIntensity={0.05 + 0.95 * on} roughness={1} fog={false} />
    </mesh>
    {[
      [0.4, 0.3, 0.86, 0.22],
      [-0.35, -0.2, 0.9, 0.16],
      [0.1, -0.5, 0.86, 0.12],
    ].map(([x, y, z, s], i) => (
      <mesh key={i} position={[x * r, y * r, z * r]}>
        <icosahedronGeometry args={[s * r, 0]} />
        <meshStandardMaterial color="#a8a498" flatShading emissive="#b8b4a8" emissiveIntensity={0.03 + 0.7 * on} fog={false} />
      </mesh>
    ))}
  </group>
);

// ---------------------------------------------------------------- the rooftop telescope

export const Telescope: React.FC<{position: V3; rotation?: number; lift?: number}> = ({position, rotation = 0, lift = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    {[0, 2.1, 4.2].map((a) => (
      <Box key={a} size={[0.04, 1.34 + lift, 0.04]} position={[Math.sin(a) * 0.3, (1.3 + lift) / 2, Math.cos(a) * 0.3]} rotation={[Math.cos(a) * 0.25, 0, -Math.sin(a) * 0.25]} color="#3a3e46" />
    ))}
    <group position={[0, 1.3 + lift, 0]} rotation={[-0.75, 0, 0]}>
      <Cyl rTop={0.11} rBottom={0.09} height={1.3} position={[0, 0.3, 0]} color="#e8e8ec" segments={10} />
      <Cyl rTop={0.12} rBottom={0.12} height={0.12} position={[0, 0.95, 0]} color="#2a2a30" segments={10} />
      <Cyl rTop={0.025} rBottom={0.025} height={0.14} position={[0, -0.38, 0.05]} rotation={[0.6, 0, 0]} color="#2a2a30" />
    </group>
  </group>
);

// ---------------------------------------------------------------- solar farm and the city

export const SolarPanel: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <Box size={[0.08, 0.9, 0.08]} position={[0, 0.45, 0]} color="#7a8088" />
    <group position={[0, 1.0, 0]} rotation={[-0.6, 0, 0]}>
      <Box size={[2.2, 0.05, 1.2]} color="#c8ccd2" />
      <Box size={[2.1, 0.02, 1.1]} position={[0, 0.03, 0]} color="#1d3a6a" />
      {[-0.52, 0, 0.52].map((x) => (
        <Box key={x} size={[0.02, 0.012, 1.1]} position={[x, 0.045, 0]} color="#5a7aa8" shadow={false} />
      ))}
    </group>
  </group>
);

export const PanelDisplay: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <Box size={[0.1, 2.3, 0.08]} position={[0, 1.15, -0.03]} color="#5a5e66" />
    <Box size={[2.0, 1.1, 0.12]} position={[0, 2.7, 0]} color="#2a2e36" />
    <Pic size={[1.86, 0.96]} res={[620, 320]} k="panel-0" draw={drawPanelDisplay} position={[0, 2.7, 0.065]} lit={false} />
    <pointLight position={[0, 2.7, 0.8]} color="#ff5a4a" intensity={2.5} distance={5} decay={2} />
  </group>
);

export type WinMode = 'lit' | 'heat' | 'off';
export const Tower: React.FC<{position: V3; size: V3; cols: number; rows: number; seed: number; mode: WinMode}> = ({position, size, cols, rows, seed, mode}) => (
  <group position={position}>
    <Box size={size} position={[0, size[1] / 2, 0]} color="#22262f" />
    <Pic size={[size[0] - 0.2, size[1] - 0.6]} res={[cols * 24, rows * 24]} k={`win-${cols}-${rows}-${seed}-${mode}`} draw={(g, W, H) => drawWindows(g, W, H, cols, rows, seed, mode)} position={[0, size[1] / 2, size[2] / 2 + 0.02]} lit={false} glow={mode === 'off' ? 0.6 : 1} />
  </group>
);

// ---------------------------------------------------------------- the frozen field

export const Sunflower: React.FC<{position: V3; droop: number; seed: number; frost: number}> = ({position, droop, seed, frost}) => {
  const h = 1.5 + rnd(seed) * 0.4;
  return (
    <group position={position} rotation={[0, rnd(seed + 3) * 0.8 - 0.4, 0]}>
      <Cyl rTop={0.035} rBottom={0.045} height={h} position={[0, h / 2, 0]} color={frost > 0.5 ? '#7a8a62' : '#4f8a41'} segments={5} />
      <Box size={[0.3, 0.02, 0.14]} position={[0.12, h * 0.45, 0]} rotation={[0, 0, -0.5 - droop * 0.5]} color={frost > 0.5 ? '#7a7a5a' : '#5aa850'} />
      <Box size={[0.3, 0.02, 0.14]} position={[-0.12, h * 0.6, 0]} rotation={[0, 0, 0.5 + droop * 0.5]} color={frost > 0.5 ? '#7a7a5a' : '#5aa850'} />
      <group position={[0, h, 0]} rotation={[0.25 + droop * 0.45, 0, 0]}>
        {Array.from({length: 10}).map((_, k) => {
          const a = (k / 10) * Math.PI * 2;
          return <Box key={k} size={[0.09, 0.16, 0.02]} position={[Math.sin(a) * 0.2, Math.cos(a) * 0.2, 0.06]} rotation={[0, 0, -a]} color={frost > 0.5 ? '#c8a848' : '#f2c32a'} />;
        })}
        <Cyl rTop={0.15} rBottom={0.15} height={0.06} position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]} color="#4a3220" segments={8} />
        <Cyl rTop={0.14} rBottom={0.14} height={0.06} position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]} color="#5a6a3a" segments={8} />
        {frost > 0.5 ? <Cyl rTop={0.1} rBottom={0.1} height={0.02} position={[0, 0.0, 0.106]} rotation={[Math.PI / 2, 0, 0]} color="#e8f0f6" segments={8} /> : null}
      </group>
    </group>
  );
};

export const Lantern: React.FC<{on?: number}> = ({on = 1}) => (
  <group position={[0, -0.12, 0]}>
    <Box size={[0.02, 0.1, 0.02]} position={[0, 0.06, 0]} color="#2a2a30" />
    <Box size={[0.12, 0.16, 0.12]} position={[0, -0.06, 0]} color="#fff2c8" emissive="#ffc870" emissiveIntensity={2 * on} />
    <pointLight position={[0, -0.06, 0.1]} color="#ffc870" intensity={9 * on} distance={9} decay={1.6} />
  </group>
);

// ---------------------------------------------------------------- the airport

export const AirportHall: React.FC = () => (
  <>
    <Box size={[40, 0.1, 30]} position={[0, -0.05, 0]} color="#c8ccd2" />
    {Array.from({length: 10}).map((_, i) => (
      <Box key={i} size={[40, 0.006, 0.05]} position={[0, 0.003, -14 + i * 3]} color="#aeb2ba" shadow={false} />
    ))}
    {/* back wall with the board, window wall on the left, ceiling */}
    <Box size={[40, 9, 0.3]} position={[0, 4.5, -10]} color="#e6e8ec" />
    <Box size={[0.3, 9, 30]} position={[-12, 4.5, 0]} color="#1a2030" />
    {Array.from({length: 8}).map((_, i) => (
      <Box key={i} size={[0.36, 9, 0.2]} position={[-11.9, 4.5, -12 + i * 3.6]} color="#8a9098" />
    ))}
    <Box size={[40, 0.3, 30]} position={[0, 9.1, 0]} color="#d8dade" />
    {Array.from({length: 6}).map((_, i) => (
      <Box key={i} size={[1.6, 0.05, 0.4]} position={[-6 + (i % 3) * 6, 8.92, -6 + Math.floor(i / 3) * 8]} color="#ffffff" emissive="#ffffff" emissiveIntensity={1.4} shadow={false} />
    ))}
    <Box size={[9.4, 4.1, 0.2]} position={[1.5, 5.8, -9.75]} color="#1a1c22" />
    <Pic size={[9, 3.8]} res={[1200, 506]} k="board-rkv" draw={drawBoard} position={[1.5, 5.8, -9.64]} lit={false} />
    {/* queue posts with a belt */}
    {Array.from({length: 7}).map((_, i) => (
      <group key={i} position={[-4 + i * 1.8, 0, -1.6]}>
        <Cyl rTop={0.04} rBottom={0.12} height={0.95} position={[0, 0.48, 0]} color="#8a9098" />
      </group>
    ))}
    <Box size={[10.8, 0.06, 0.02]} position={[1.4, 0.9, -1.6]} color="#2f5fd0" shadow={false} />
  </>
);

// ---------------------------------------------------------------- the Iceland greenhouse

export const GH_LEN = 30;
export const Greenhouse: React.FC<{t: number}> = ({t}) => (
  <>
    <Box size={[60, 0.1, 80]} position={[0, -0.05, 0]} color="#3a3430" />
    {/* the tunnel: arches every 3 m, translucent walls */}
    {Array.from({length: 11}).map((_, i) => (
      <group key={i} position={[0, 0, -GH_LEN / 2 + i * 3]}>
        <Box size={[0.08, 3.2, 0.08]} position={[-3.6, 1.6, 0]} color="#c8ccd2" />
        <Box size={[0.08, 3.2, 0.08]} position={[3.6, 1.6, 0]} color="#c8ccd2" />
        <Box size={[7.3, 0.08, 0.08]} position={[0, 3.2, 0]} color="#c8ccd2" />
      </group>
    ))}
    <Box size={[0.03, 3.2, GH_LEN]} position={[-3.62, 1.6, 0]} color="#9ab0c0" opacity={0.25} shadow={false} />
    <Box size={[0.03, 3.2, GH_LEN]} position={[3.62, 1.6, 0]} color="#9ab0c0" opacity={0.25} shadow={false} />
    <Box size={[7.3, 0.03, GH_LEN]} position={[0, 3.25, 0]} color="#9ab0c0" opacity={0.25} shadow={false} />
    {/* beds of potatoes on both sides of the aisle */}
    {[-2.2, 2.2].map((x) => (
      <group key={x}>
        <Box size={[1.6, 0.4, GH_LEN - 1]} position={[x, 0.2, 0]} color="#5a4030" />
        <Box size={[1.7, 0.08, GH_LEN - 0.9]} position={[x, 0.36, 0]} color="#8a6a48" />
        <Box size={[1.5, 0.02, GH_LEN - 1.1]} position={[x, 0.41, 0]} color="#3a2a20" />
        {Array.from({length: 26}).map((_, i) => (
          <group key={i} position={[x + (i % 2 ? 0.35 : -0.35), 0.42, -GH_LEN / 2 + 1.2 + i * 1.07]}>
            <Ico radius={0.26} detail={1} position={[0, 0.2, 0]} scale={[1, 0.8, 1]} rotation={[i, i * 2, 0]} color={i % 3 ? '#5aa850' : '#4f9a46'} />
            <Ico radius={0.16} detail={0} position={[0.15, 0.36, 0.05]} rotation={[i * 3, 0, i]} color="#6ab85a" />
          </group>
        ))}
      </group>
    ))}
    {/* pink grow lamps */}
    {[-2.2, 2.2].map((x) =>
      Array.from({length: 9}).map((_, i) => (
        <group key={`${x}-${i}`} position={[x, 2.6, -GH_LEN / 2 + 2 + i * 3.25]}>
          <Box size={[0.02, 0.55, 0.02]} position={[0, 0.3, 0]} color="#5a5e66" />
          <Box size={[1.3, 0.06, 0.16]} color="#ff7ad8" emissive="#ff4ac8" emissiveIntensity={2.4} shadow={false} />
        </group>
      )),
    )}
    {Array.from({length: 5}).map((_, i) => (
      <pointLight key={i} position={[0, 2.3, -GH_LEN / 2 + 3 + i * 6]} color="#ff6ad0" intensity={9 + 0.4 * Math.sin(t * 3 + i)} distance={9} decay={1.5} />
    ))}
    {/* a hot water pipe along the floor: the heat from under the ground */}
    {[-1.25, 1.25].map((x) => (
      <Cyl key={x} rTop={0.07} rBottom={0.07} height={GH_LEN - 1} position={[x, 0.09, 0]} rotation={[Math.PI / 2, 0, 0]} color="#b85a3a" segments={8} />
    ))}
  </>
);

// a person asleep on a mat
export const Sleeper: React.FC<{position: V3; i: number; yaw?: number}> = ({position, i, yaw = 0}) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <Box size={[0.7, 0.04, 2.0]} position={[0, 0.02, 0]} color={['#4a7fd0', '#6fbf73', '#c85b8a', '#ef8f4a'][i % 4]} />
    <group position={[0, 0.17, 0.92]}>
      <Person position={[0, 0, 0]} rotation={Math.PI} lying shirt={SHIRTS[(i + 3) % SHIRTS.length]} pants={PANTS[i % PANTS.length]} hair={HAIR[(i * 2) % HAIR.length]} pose={{eyes: 0.2}} />
    </group>
    {/* blanket over the legs and belly */}
    <Box size={[0.66, 0.3, 1.2]} position={[0, 0.28, -0.3]} color={['#d8c8b0', '#b8a0c8', '#a8c8b0', '#e0b0a0'][i % 4]} />
  </group>
);

// ---------------------------------------------------------------- under the ice, the sea floor, the vent

export const IceSheet: React.FC<{crack: number}> = ({crack}) => (
  <>
    <Box size={[600, 1.2, 600]} position={[0, -0.6, 0]} color="#bcd6e6" />
    <Pic size={[60, 60]} res={[1024, 1024]} k="ice-top" draw={(g, W, H) => drawIce(g, W, H, 7)} position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} />
    {/* pressure ridges: slabs pushed up where the ice froze in waves */}
    {Array.from({length: 26}).map((_, i) => {
      const x = (rnd(i + 11) - 0.5) * 60;
      const z = -6 - rnd(i + 12) * 60;
      return <Box key={`r${i}`} size={[1.2 + rnd(i) * 2, 0.25, 0.8 + rnd(i + 1)]} position={[x, 0.15, z]} rotation={[0.3 + rnd(i + 2) * 0.5, rnd(i + 3) * 3, 0.2]} color={i % 2 ? '#d8e8f2' : '#b8d2e2'} />;
    })}
    {/* the crack spreading from the point the camera dives into */}
    {Array.from({length: 9}).map((_, i) => {
      const a = (i / 9) * Math.PI * 2 + rnd(i) * 0.4;
      const len = (1.5 + rnd(i + 4) * 2.5) * crack;
      return len > 0.01 ? <Box key={i} size={[0.05, 0.012, len]} position={[Math.sin(a) * len * 0.5, 0.014, Math.cos(a) * len * 0.5]} rotation={[0, a, 0]} color="#2a4a68" shadow={false} /> : null;
    })}
  </>
);

export const Seabed: React.FC = () => (
  <>
    <Box size={[400, 0.2, 400]} position={[0, -0.1, 0]} color="#2a2a30" />
    {Array.from({length: 40}).map((_, i) => (
      <Ico key={i} radius={0.4 + rnd(i) * 1.2} detail={0} position={[(rnd(i + 1) - 0.5) * 50, 0, (rnd(i + 2) - 0.5) * 50]} scale={[1, 0.6, 1]} rotation={[i, i * 2, 0]} color={i % 3 ? '#4a4a56' : '#3a3a44'} />
    ))}
  </>
);

// black smoker chimney with a plume of dark mineral smoke
export const Smoker: React.FC<{position: V3; t: number; h?: number}> = ({position, t, h = 4}) => (
  <group position={position}>
    {Array.from({length: 6}).map((_, i) => (
      <Cyl key={i} rTop={0.55 - i * 0.07} rBottom={0.75 - i * 0.07} height={h / 6 + 0.05} position={[Math.sin(i * 1.7) * 0.08, (i + 0.5) * (h / 6), Math.cos(i * 1.3) * 0.08]} rotation={[0, i, 0]} color={i % 2 ? '#1e1c1e' : '#2a2626'} segments={7} />
    ))}
    {/* glowing mouth */}
    <Cyl rTop={0.12} rBottom={0.16} height={0.05} position={[0, h + 0.03, 0]} color="#ff7a2a" emissive="#ff5a1a" emissiveIntensity={2} shadow={false} />
    <pointLight position={[0, h + 0.4, 0.4]} color="#ff7a3a" intensity={8} distance={8} decay={1.7} />
    <pointLight position={[0.6, 0.5, 0.9]} color="#ff8a4a" intensity={3} distance={4} decay={2} />
    {/* the plume: solid low-poly puffs rising and growing */}
    {Array.from({length: 14}).map((_, i) => {
      const k = ((t * 0.35 + i / 14) % 1 + 1) % 1;
      const s = 0.18 + k * 0.9;
      return <Ico key={i} radius={s} detail={0} position={[Math.sin(i * 2.3 + t * 0.4) * 0.3 * k + k * 0.8, h + 0.2 + k * 6, Math.cos(i * 1.7) * 0.3 * k]} rotation={[i, t * 0.2 + i, 0]} color={k < 0.12 ? '#3a2a24' : '#18181c'} shadow={false} />;
    })}
  </group>
);

export const TubeWorm: React.FC<{position: V3; t: number; i: number}> = ({position, t, i}) => {
  const h = 0.6 + rnd(i) * 0.9;
  const sw = Math.sin(t * 1.4 + i) * 0.08;
  return (
    <group position={position} rotation={[sw, 0, sw * 0.7]}>
      <Cyl rTop={0.035} rBottom={0.045} height={h} position={[0, h / 2, 0]} color="#e8e4dc" segments={6} />
      <Ico radius={0.07} detail={0} position={[0, h + 0.05, 0]} scale={[1, 1.4, 1]} color="#e03a3a" />
    </group>
  );
};

export const Shrimp: React.FC<{position: V3; yaw: number}> = ({position, yaw}) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <Box size={[0.06, 0.05, 0.18]} color="#f2b8a8" />
    <Box size={[0.04, 0.04, 0.08]} position={[0, 0.01, -0.12]} rotation={[0.4, 0, 0]} color="#e8a090" />
    <Box size={[0.01, 0.01, 0.12]} position={[0.02, 0.02, 0.14]} rotation={[-0.3, 0.2, 0]} color="#f2c8b8" shadow={false} />
    <Box size={[0.01, 0.01, 0.12]} position={[-0.02, 0.02, 0.14]} rotation={[-0.3, -0.2, 0]} color="#f2c8b8" shadow={false} />
  </group>
);
