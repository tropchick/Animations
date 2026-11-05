import React from 'react';
import {Box, Cyl, Ico} from '../scene/parts';
import {Person, PersonPose} from '../scene/Characters';
import {Sky, SkyCols} from '../gta/World';
import {Pic, SHIRTS, PANTS, HAIR, Facade, Street, Bench, FoldingChair} from '../shawa/Sets';
import {drawSign, drawFacade} from '../shawa/tex';
import {V3, lerp, rnd} from './cues';
import {
  drawBlackboard,
  drawBoard,
  drawCardboard,
  drawHeart,
  drawNight,
  drawPaper,
  drawPlate,
  drawSalary,
  drawTag,
  drawTv,
  drawTvBox,
  drawUsd,
  drawVideo,
} from './tex';

export {Pic, Facade, Street, Bench, FoldingChair, drawFacade};

// ---------------------------------------------------------------- light and sky

export const DAY: SkyCols = {top: '#3f86d6', mid: '#93c3ec', low: '#f2e7cf', sunDir: [0.5, 0.35, -1], sun: 0.8, sunCol: '#fff2c8'};
export const NIGHT: SkyCols = {top: '#04070f', mid: '#0d1630', low: '#24345e'};
export const DUSK: SkyCols = {top: '#141a44', mid: '#4a3a7a', low: '#e07a5a', sunDir: [0.2, 0.02, -1], sun: 0.6, sunCol: '#ffb070'};

export const DayLights: React.FC<{k?: number}> = ({k = 1}) => (
  <>
    <hemisphereLight color="#dff0ff" groundColor="#8a7c6a" intensity={1.25 * k} />
    <directionalLight position={[60, 90, 80]} color="#fff0d8" intensity={2.1 * k} />
    <directionalLight position={[-80, 40, -40]} color="#9ab8e0" intensity={0.45 * k} />
  </>
);
export const DaySky: React.FC<{c?: SkyCols; fog?: [number, number]; fogCol?: string}> = ({c = DAY, fog = [60, 600], fogCol = '#cfe0ee'}) => (
  <>
    <Sky c={c} />
    <fog attach="fog" args={[fogCol, fog[0], fog[1]]} />
  </>
);
export const NightLights: React.FC = () => (
  <>
    <hemisphereLight color="#6a7aa8" groundColor="#1a1a24" intensity={0.75} />
    <directionalLight position={[-40, 60, 50]} color="#a8b8e8" intensity={0.7} />
  </>
);

// ---------------------------------------------------------------- people

export const Guy: React.FC<{position: V3; rotation?: number; i: number; pose?: PersonPose; rightHand?: React.ReactNode; leftHand?: React.ReactNode; headExtra?: React.ReactNode; bodyExtra?: React.ReactNode; scale?: number; child?: boolean}> = ({
  position,
  rotation = 0,
  i,
  pose,
  rightHand,
  leftHand,
  headExtra,
  bodyExtra,
  scale,
  child,
}) => (
  <Person
    position={position}
    rotation={rotation}
    scale={scale}
    child={child}
    shirt={SHIRTS[i % SHIRTS.length]}
    pants={PANTS[(i * 3) % PANTS.length]}
    hair={HAIR[(i * 5) % HAIR.length]}
    longHair={i % 3 === 1}
    pose={pose}
    rightHand={rightHand}
    leftHand={leftHand}
    headExtra={headExtra}
    bodyExtra={bodyExtra}
  />
);

export const walk = (t: number, amount = 1, freq = 1.7): PersonPose => {
  const ph = t * freq * Math.PI * 2;
  return {legL: Math.sin(ph) * 0.45 * amount, legR: -Math.sin(ph) * 0.45 * amount, armL: [-Math.sin(ph) * 0.35 * amount, 0.06], armR: [Math.sin(ph) * 0.35 * amount, -0.06]};
};
export const SIT: PersonPose = {legL: 1.45, legR: 1.45};

// the hero: white tank top, blue track pants
export const Hero: React.FC<{position: V3; rotation?: number; pose?: PersonPose; rightHand?: React.ReactNode; leftHand?: React.ReactNode}> = (p) => (
  <Person {...p} shirt="#f2f2f0" pants="#2a3a6a" hair="#4a3324" skin="#efd2b3" bodyExtra={<Box size={[0.2, 0.06, 0.02]} position={[0, 1.55, 0.155]} color="#efd2b3" shadow={false} />} />
);

// uncle Vitya: moustache, brown shirt, a big belly
export const Uncle: React.FC<{position: V3; rotation?: number; pose?: PersonPose; rightHand?: React.ReactNode; leftHand?: React.ReactNode; red?: number}> = ({red = 0, ...p}) => (
  <Person
    {...p}
    shirt="#8a5a3a"
    pants="#3a3a40"
    hair="#6a6a6a"
    skin={red > 0.5 ? '#f0a890' : '#e8c2a0'}
    headExtra={<Box size={[0.17, 0.035, 0.02]} position={[0, 0.11, 0.16]} color="#5a5a5a" shadow={false} />}
    bodyExtra={<Box size={[0.48, 0.36, 0.12]} position={[0, 1.07, 0.18]} color="#8a5a3a" />}
  />
);

// grandma: grey hair, headscarf, purple cardigan
export const Granny: React.FC<{position: V3; rotation?: number; pose?: PersonPose; rightHand?: React.ReactNode; leftHand?: React.ReactNode}> = (p) => (
  <Person
    {...p}
    shirt="#7a4a8a"
    pants="#4a3a5a"
    hair="#c8c8c8"
    longHair
    skin="#ecc8a8"
    headExtra={
      <>
        <Box size={[0.34, 0.14, 0.34]} position={[0, 0.355, -0.01]} color="#d8483a" />
        <Box size={[0.34, 0.2, 0.06]} position={[0, 0.22, -0.16]} color="#d8483a" />
      </>
    }
  />
);

// a foreigner in a cowboy hat / beret / cap with a camera
export const Foreigner: React.FC<{position: V3; rotation?: number; i: number; pose?: PersonPose; rightHand?: React.ReactNode; leftHand?: React.ReactNode}> = ({i, ...p}) => {
  const kind = i % 4;
  const hat =
    kind === 0 ? (
      <>
        <Cyl rTop={0.36} rBottom={0.36} height={0.03} position={[0, 0.36, 0]} color="#8a5a2a" />
        <Box size={[0.26, 0.16, 0.24]} position={[0, 0.44, 0]} color="#8a5a2a" />
      </>
    ) : kind === 1 ? (
      <Cyl rTop={0.2} rBottom={0.18} height={0.07} position={[0.02, 0.38, 0]} rotation={[0, 0, 0.15]} color="#1a1a22" />
    ) : kind === 2 ? (
      <>
        <Box size={[0.34, 0.08, 0.34]} position={[0, 0.39, 0]} color="#d02a2a" />
        <Box size={[0.3, 0.025, 0.14]} position={[0, 0.34, 0.2]} color="#d02a2a" />
      </>
    ) : null;
  const shirt = kind === 3 ? '#3aa0d0' : ['#f2c14e', '#4a7fd0', '#e85d5d', '#3aa0d0'][kind];
  return (
    <Person
      {...p}
      shirt={shirt}
      pants={kind === 3 ? '#d8c8a0' : PANTS[i % PANTS.length]}
      hair={['#c9a46a', '#2a1d15', '#7b5434', '#d8b070'][kind]}
      skin={['#f2d6c0', '#efd2b3', '#f0c8a8', '#f4dccb'][kind]}
      headExtra={hat}
      bodyExtra={
        kind === 3 ? (
          <>
            {/* flowers on the shirt and a camera on the neck */}
            {[[-0.12, 1.32], [0.1, 1.1], [0.14, 1.4], [-0.08, 1.0]].map(([x, y], k) => (
              <Box key={k} size={[0.07, 0.07, 0.02]} position={[x, y, 0.155]} color="#ffe14a" shadow={false} />
            ))}
            <Box size={[0.16, 0.1, 0.08]} position={[0, 1.3, 0.2]} color="#1a1a1e" />
            <Cyl rTop={0.035} rBottom={0.035} height={0.06} position={[0, 1.3, 0.26]} rotation={[Math.PI / 2, 0, 0]} color="#3a3a40" />
          </>
        ) : undefined
      }
    />
  );
};

// ---------------------------------------------------------------- small props

export const Mug: React.FC<{position?: V3; rotation?: V3}> = ({position, rotation}) => (
  <group position={position} rotation={rotation}>
    <Cyl rTop={0.045} rBottom={0.042} height={0.11} position={[0, 0, 0]} color="#e8e4dc" />
    <Box size={[0.02, 0.06, 0.05]} position={[0.055, 0, 0]} color="#e8e4dc" />
    <Cyl rTop={0.04} rBottom={0.04} height={0.005} position={[0, 0.046, 0]} color="#5a3a1e" />
  </group>
);

export const Shards: React.FC<{position: V3; age: number}> = ({position, age}) => (
  <group position={position}>
    {Array.from({length: 9}).map((_, k) => {
      const a = (k / 9) * Math.PI * 2 + rnd(k) * 0.5;
      const sp = 0.6 + rnd(k + 9) * 0.9;
      const d = sp * (1 - Math.exp(-age * 6)) * 0.35;
      const up = Math.max(0, 0.6 * age - 2.5 * age * age) * rnd(k + 3);
      return <Box key={k} size={[0.035, 0.012, 0.03]} position={[Math.cos(a) * d, 0.006 + up, Math.sin(a) * d]} rotation={[0, a * 2, 0]} color={k % 4 ? '#e8e4dc' : '#5a3a1e'} />;
    })}
  </group>
);

export const ButtonPhone: React.FC<{flash?: number}> = ({flash = 0}) => (
  <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0.06]}>
    <Box size={[0.06, 0.13, 0.02]} color="#2a2a30" />
    <Box size={[0.045, 0.04, 0.003]} position={[0, 0.035, 0.011]} color="#9ac8a0" emissive="#5a8a60" emissiveIntensity={0.3} shadow={false} />
    {flash > 0 ? (
      <>
        <Box size={[0.015, 0.015, 0.004]} position={[0.018, 0.05, -0.012]} color="#ffffff" emissive="#ffffff" emissiveIntensity={4 * flash} shadow={false} />
        <pointLight position={[0, 0.05, -0.1]} color="#ffffff" intensity={14 * flash} distance={4} decay={1.4} />
      </>
    ) : null}
  </group>
);

// a rolling suitcase held by the handle: hangs from the hand, tilted back
export const Suitcase: React.FC<{color: string}> = ({color}) => (
  <group rotation={[0.55, 0, 0]}>
    <Box size={[0.02, 0.32, 0.02]} position={[0, -0.16, 0]} color="#3a3a40" />
    <Box size={[0.38, 0.55, 0.22]} position={[0, -0.6, 0]} color={color} />
    <Box size={[0.39, 0.03, 0.23]} position={[0, -0.5, 0]} color="#2a2a30" />
  </group>
);

export const Laptop: React.FC = () => (
  <group rotation={[0, 0, Math.PI / 2]} position={[0, -0.05, 0.05]}>
    <Box size={[0.32, 0.02, 0.22]} color="#b8bcc4" />
  </group>
);

export const Heart: React.FC<{position: V3; k: number}> = ({position, k}) => {
  if (k <= 0 || k >= 1) return null;
  const s = 0.3 + 0.7 * Math.min(1, k * 4);
  return (
    <group position={[position[0], position[1] + k * 0.5, position[2]]} scale={s}>
      <Pic size={[0.32, 0.3]} res={[160, 150]} k="heart" draw={drawHeart} lit={false} transparent />
    </group>
  );
};

// ---------------------------------------------------------------- the kitchen (panel block flat)

// room: x −3..3, z −2.6..3; TV on the left wall facing +x; window on the right wall; table at the back
export const TABLE: V3 = [0.25, 0, -1.4];
export const TV: V3 = [-2.88, 1.75, 0.0];

export const Kitchen: React.FC<{t: number; night?: boolean; tvOn?: boolean; table?: React.ReactNode}> = ({t, night = true, tvOn = true, table}) => {
  const q = Math.round(t * 15) / 15;
  return (
    <group>
      <color attach="background" args={['#0a0c14']} />
      <hemisphereLight color="#fff2dc" groundColor="#5a4a3a" intensity={night ? 0.9 : 1.2} />
      <pointLight position={[0.2, 2.45, -0.5]} color="#ffe2b0" intensity={night ? 9 : 6} distance={9} decay={1.5} />
      <directionalLight position={[3, 4, 3]} color="#fff0d8" intensity={night ? 0.25 : 0.8} />
      {/* floor (linoleum), ceiling, walls */}
      <Box size={[6, 0.1, 5.6]} position={[0, -0.05, 0.2]} color="#b88a5a" />
      {Array.from({length: 7}).map((_, i) => (
        <Box key={i} size={[6, 0.004, 0.02]} position={[0, 0.002, -2.4 + i * 0.8]} color="#a07448" shadow={false} />
      ))}
      <Box size={[6, 0.1, 5.6]} position={[0, 2.75, 0.2]} color="#efeae0" />
      <Box size={[6, 2.8, 0.1]} position={[0, 1.4, -2.65]} color="#d8e0c8" />
      <Box size={[0.1, 2.8, 5.6]} position={[-3.05, 1.4, 0.2]} color="#d8e0c8" />
      {/* right wall with the window */}
      <Box size={[0.1, 0.95, 5.6]} position={[3.05, 0.475, 0.2]} color="#d8e0c8" />
      <Box size={[0.1, 0.55, 5.6]} position={[3.05, 2.5, 0.2]} color="#d8e0c8" />
      <Box size={[0.1, 1.3, 1.9]} position={[3.05, 1.6, -1.85]} color="#d8e0c8" />
      <Box size={[0.1, 1.3, 2.1]} position={[3.05, 1.6, 2.0]} color="#d8e0c8" />
      <Box size={[0.1, 2.8, 0.1]} position={[0, 1.4, 3.05]} color="#d8e0c8" />
      <group position={[3.09, 1.6, 0.0]} rotation={[0, -Math.PI / 2, 0]}>
        <Pic size={[1.6, 1.3]} res={[480, 390]} k={`night${night ? q : 'day'}`} draw={(g, W, H) => (night ? drawNight(g, W, H, q, FW_REF.current) : drawDayWindow(g, W, H))} lit={false} glow={night ? 1 : 0.95} />
      </group>
      {/* window frame */}
      <Box size={[0.14, 0.06, 1.7]} position={[3.0, 2.24, 0]} color="#f4f4f4" />
      <Box size={[0.22, 0.06, 1.8]} position={[2.95, 0.96, 0]} color="#f4f4f4" />
      <Box size={[0.14, 1.3, 0.06]} position={[3.0, 1.6, 0]} color="#f4f4f4" />
      <Box size={[0.14, 1.3, 0.06]} position={[3.0, 1.6, -0.82]} color="#f4f4f4" />
      <Box size={[0.14, 1.3, 0.06]} position={[3.0, 1.6, 0.82]} color="#f4f4f4" />
      {/* wallpaper stripe */}
      <Box size={[5.9, 0.06, 0.02]} position={[0, 1.0, -2.59]} color="#b8c4a4" shadow={false} />
      {/* the counter, cupboards, fridge, stove at the back wall */}
      <Box size={[2.2, 0.9, 0.6]} position={[-1.7, 0.45, -2.3]} color="#efe8da" />
      <Box size={[2.24, 0.04, 0.64]} position={[-1.7, 0.92, -2.3]} color="#8a7a6a" />
      <Box size={[2.2, 0.7, 0.36]} position={[-1.7, 2.05, -2.42]} color="#efe8da" />
      <Box size={[0.7, 1.85, 0.66]} position={[2.45, 0.925, -2.25]} color="#f4f4f6" />
      <Box size={[0.04, 0.3, 0.03]} position={[2.18, 1.3, -1.9]} color="#9aa0a8" />
      <Box size={[0.6, 0.04, 0.5]} position={[-2.4, 0.95, -2.3]} color="#2a2a30" />
      {/* a teapot and a jar on the counter */}
      <Cyl rTop={0.08} rBottom={0.11} height={0.18} position={[-1.2, 1.03, -2.25]} color="#e04a3a" />
      <Cyl rTop={0.06} rBottom={0.06} height={0.2} position={[-1.6, 1.04, -2.3]} color="#d8b04a" />
      {/* the TV on a wall bracket */}
      <group position={TV} rotation={[0, Math.PI / 2, 0]}>
        <Box size={[1.24, 0.76, 0.08]} position={[0, 0, -0.06]} color="#141418" />
        {tvOn ? (
          <Pic size={[1.16, 0.68]} res={[700, 410]} k={`tv${Math.floor(t * 2) % 2}`} draw={(g, W, H) => drawTv(g, W, H, Math.floor(t * 2) % 2)} position={[0, 0, -0.015]} lit={false} glow={1} />
        ) : (
          <Box size={[1.16, 0.68, 0.01]} position={[0, 0, -0.015]} color="#0a0a0c" />
        )}
        <Box size={[0.1, 0.1, 0.12]} position={[0, -0.1, -0.15]} color="#2a2a30" />
      </group>
      {tvOn ? <pointLight position={[TV[0] + 0.8, TV[1], TV[2]]} color="#7aa8ff" intensity={2.5} distance={4} decay={1.6} /> : null}
      {/* the pendant lamp */}
      <Box size={[0.02, 0.4, 0.02]} position={[0.2, 2.5, -0.5]} color="#2a2a2a" />
      <Cyl rTop={0.1} rBottom={0.28} height={0.18} position={[0.2, 2.24, -0.5]} color="#e8a84a" emissive="#ffb050" emissiveIntensity={0.6} />
      {/* table, chairs */}
      <group position={TABLE}>
        <Box size={[1.6, 0.05, 1.0]} position={[0, 0.76, 0]} color="#f2f0ea" />
        <Box size={[1.62, 0.12, 1.02]} position={[0, 0.7, 0]} color="#e8e2d4" />
        {[[-0.72, -0.42], [0.72, -0.42], [-0.72, 0.42], [0.72, 0.42]].map(([x, z]) => (
          <Box key={`${x}${z}`} size={[0.06, 0.7, 0.06]} position={[x, 0.35, z]} color="#8a6a4a" />
        ))}
        {table}
      </group>
    </group>
  );
};
// the firework times are set by the World before the kitchen draws (keeps the Pic draw pure)
export const FW_REF: {current: number[]} = {current: []};

const drawDayWindow = (g: CanvasRenderingContext2D, W: number, H: number) => {
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#5a9ae0');
  sky.addColorStop(1, '#cfe4f4');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  for (let b = 0; b < 3; b++) {
    g.fillStyle = ['#d9d2c4', '#cfd6dc', '#e2d0bc'][b];
    g.fillRect(b * W * 0.36 - W * 0.04, H * 0.5 - b * H * 0.05, W * 0.32, H);
  }
};

// a chair at the table (seat top at 0.48)
export const Chair: React.FC<{position: V3; rotation?: number}> = ({position, rotation = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box size={[0.44, 0.05, 0.42]} position={[0, 0.455, 0]} color="#8a6a4a" />
    <Box size={[0.44, 0.48, 0.05]} position={[0, 0.72, -0.2]} color="#8a6a4a" />
    {[[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]].map(([x, z]) => (
      <Box key={`${x}${z}`} size={[0.04, 0.44, 0.04]} position={[x, 0.22, z]} color="#6a4a2a" />
    ))}
  </group>
);

// a plate with food, a cup
export const Plate: React.FC<{position: V3; food?: string}> = ({position, food = '#e8b04a'}) => (
  <group position={position}>
    <Cyl rTop={0.13} rBottom={0.1} height={0.02} color="#fafafa" />
    <Ico radius={0.06} detail={0} position={[0, 0.03, 0]} scale={[1, 0.5, 1]} color={food} />
  </group>
);
export const Cup: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <Cyl rTop={0.045} rBottom={0.038} height={0.08} position={[0, 0.04, 0]} color="#f4f4f4" />
    <Cyl rTop={0.04} rBottom={0.04} height={0.004} position={[0, 0.079, 0]} color="#8a4a1e" />
  </group>
);

export const Newspaper: React.FC<{open: number}> = ({open}) => (
  <group>
    <Pic size={[0.5, 0.66]} res={[400, 528]} k="paper" draw={drawPaper} position={[0, 0, 0]} />
    <Box size={[0.5, 0.66, 0.004]} position={[0, 0, -0.004]} color="#d8d4ca" shadow={false} />
    {open < 1 ? null : null}
  </group>
);

// ---------------------------------------------------------------- the exchange booth (rate in roubles for one dollar)

export const UsdBooth: React.FC<{value: number; down: boolean}> = ({value, down}) => {
  const q = Math.round(value * 100) / 100;
  return (
    <group>
      <Box size={[2.6, 2.4, 1.6]} position={[0, 1.2, 0]} color="#e6e8ec" />
      <Box size={[1.6, 1.2, 0.04]} position={[0, 1.3, 0.81]} color="#9ab8d0" emissive="#7a9ab0" emissiveIntensity={0.5} />
      <Box size={[0.5, 0.06, 0.3]} position={[0, 0.82, 0.95]} color="#b8bcc4" />
      <Box size={[3.0, 1.6, 0.16]} position={[0, 3.25, 0.5]} color="#1a1c22" />
      <Pic size={[2.86, 1.46]} res={[1100, 560]} k={`usd${q}${down ? 1 : 0}`} draw={(g, W, H) => drawUsd(g, W, H, q, down)} position={[0, 3.25, 0.586]} lit={false} glow={1} />
      {[-1.3, 1.3].map((x) => <Box key={x} size={[0.1, 0.9, 0.1]} position={[x, 2.85, 0.5]} color="#5a5e66" />)}
      <pointLight position={[0, 3.2, 1.6]} color="#c8ffd8" intensity={3} distance={6} decay={1.5} />
    </group>
  );
};

export const StreetLamp: React.FC<{position: V3; light?: boolean}> = ({position, light = false}) => (
  <group position={position}>
    <Cyl rTop={0.05} rBottom={0.07} height={5} position={[0, 2.5, 0]} color="#3a3e46" />
    <Box size={[0.9, 0.08, 0.1]} position={[0.4, 5.0, 0]} color="#3a3e46" />
    <Box size={[0.36, 0.1, 0.22]} position={[0.8, 4.94, 0]} color="#fff2c8" emissive="#ffd88a" emissiveIntensity={2} />
    {light ? <pointLight position={[0.8, 4.7, 0]} color="#ffd88a" intensity={20} distance={14} decay={1.6} /> : null}
  </group>
);

// ---------------------------------------------------------------- the airport

export const DepartureBoard: React.FC<{ks: number[]; hi: number}> = ({ks, hi}) => {
  const q = ks.map((k) => Math.round(k * 10) / 10);
  const h = Math.round(hi * 10) / 10;
  return (
    <group>
      <Box size={[6.2, 3.6, 0.2]} position={[0, 0, -0.12]} color="#1a1c22" />
      <Pic size={[6.0, 3.4]} res={[1200, 680]} k={`dep${q.join(',')}-${h}`} draw={(g, W, H) => drawBoard(g, W, H, q, h)} position={[0, 0, 0]} lit={false} glow={1} />
    </group>
  );
};

export const AirportHall: React.FC = () => (
  <group>
    <color attach="background" args={['#cfd8e0']} />
    <hemisphereLight color="#f4f8ff" groundColor="#8a8a90" intensity={1.4} />
    <directionalLight position={[10, 20, 10]} color="#ffffff" intensity={1.2} />
    <Box size={[60, 0.1, 30]} position={[0, -0.05, 0]} color="#d8dade" />
    {Array.from({length: 15}).map((_, i) => (
      <Box key={i} size={[0.04, 0.004, 30]} position={[-28 + i * 4, 0.002, 0]} color="#c4c6cc" shadow={false} />
    ))}
    <Box size={[60, 9, 0.2]} position={[0, 4.5, -8]} color="#e8ecf0" />
    {/* big windows along the back wall */}
    {Array.from({length: 8}).map((_, i) => (
      <Box key={i} size={[3.4, 4.6, 0.04]} position={[-21 + i * 6, 3.0, -7.88]} color="#9ac0e0" emissive="#8ab0d0" emissiveIntensity={0.5} />
    ))}
    {/* columns */}
    {Array.from({length: 6}).map((_, i) => (
      <Box key={i} size={[0.6, 9, 0.6]} position={[-15 + i * 6, 4.5, -2]} color="#f4f4f6" />
    ))}
    <Box size={[60, 0.2, 30]} position={[0, 9, 0]} color="#f4f4f6" />
  </group>
);

// ---------------------------------------------------------------- the mall and the burger shop

export const Shop: React.FC<{on: number; ply: number[]}> = ({on, ply}) => (
  <group>
    <Box size={[10, 4.2, 6]} position={[0, 2.1, -3]} color="#3a3640" />
    {[-2.6, 2.6].map((x) => (
      <Box key={x} size={[3.2, 2.4, 0.04]} position={[x, 1.4, 0.02]} color="#f7d58a" emissive="#f2b850" emissiveIntensity={0.08 + 0.4 * on} />
    ))}
    <Box size={[1.3, 2.3, 0.05]} position={[0, 1.15, 0.03]} color="#2a2a30" />
    <Box size={[4.4, 0.9, 0.14]} position={[0, 3.45, 0.08]} color={on > 0.5 ? '#ffb02e' : '#5a4a3a'} />
    <Pic size={[4.2, 0.8]} res={[1050, 200]} k={`burg${on > 0.5 ? 1 : 0}`} draw={(g, W, H) => drawSign(g, W, H, 'БУРГЕРЫ', on > 0.5 ? '#ffb02e' : '#4a3a2a', on > 0.5 ? '#2a1a10' : '#2a2018')} position={[0, 3.45, 0.156]} lit={on <= 0.5} glow={1} />
    {on > 0.5 ? <pointLight position={[0, 3.2, 1.6]} color="#ffc060" intensity={8 * on} distance={8} decay={1.5} /> : null}
    {/* «МЫ ВЕРНУЛИСЬ» banner over the door */}
    {on > 0 ? (
      <group position={[0, 2.62, 0.1]} scale={[1, Math.min(1, on * 1.5), 1]}>
        <Pic size={[2.4, 0.42]} res={[800, 140]} k="back" draw={(g, W, H) => drawSign(g, W, H, 'МЫ ВЕРНУЛИСЬ!', '#d62a22', '#ffffff')} />
      </group>
    ) : null}
    {/* plywood sheets falling forward off the windows and the door */}
    {[-2.6, 0, 2.6].map((x, i) => {
      const k = Math.min(1, Math.max(0, ply[i] ?? 0));
      const ang = (Math.PI / 2) * k * k;
      return (
        <group key={x} position={[x, 0.056 * (ang / (Math.PI / 2)), 0.12]} rotation={[ang, 0, 0]}>
          <Box size={[i === 1 ? 1.6 : 3.4, 2.6, 0.05]} position={[0, 1.3, 0.025]} color="#c8a46a" />
          <Box size={[i === 1 ? 1.5 : 3.3, 0.08, 0.01]} position={[0, 1.8, 0.055]} color="#a8844a" shadow={false} />
          <Box size={[i === 1 ? 1.5 : 3.3, 0.08, 0.01]} position={[0, 0.8, 0.055]} color="#a8844a" shadow={false} />
        </group>
      );
    })}
  </group>
);

export const MallFloor: React.FC = () => (
  <group>
    <color attach="background" args={['#d8d4cc']} />
    <hemisphereLight color="#fff8ec" groundColor="#8a847a" intensity={1.3} />
    <directionalLight position={[6, 12, 10]} color="#ffffff" intensity={1.0} />
    <Box size={[40, 0.1, 30]} position={[0, -0.05, 4]} color="#e8e2d6" />
    {Array.from({length: 12}).map((_, i) => (
      <Box key={i} size={[40, 0.004, 0.03]} position={[0, 0.002, -1 + i * 1.5]} color="#d4cec2" shadow={false} />
    ))}
    {/* other shops along the wall */}
    <Box size={[8, 4.2, 6]} position={[-10, 2.1, -3]} color="#4a5a6a" />
    <Box size={[7, 2.5, 0.04]} position={[-10, 1.4, 0.02]} color="#bcd8f0" emissive="#9ab8d0" emissiveIntensity={0.3} />
    <Box size={[8, 4.2, 6]} position={[10, 2.1, -3]} color="#6a4a5a" />
    <Box size={[7, 2.5, 0.04]} position={[10, 1.4, 0.02]} color="#f0d8e4" emissive="#d0b8c4" emissiveIntensity={0.3} />
    <Box size={[40, 0.3, 30]} position={[0, 5.2, 4]} color="#f4f2ee" />
  </group>
);

// a person asleep in a sleeping bag on the floor (head towards +x)
export const SleepingBag: React.FC<{position: V3; rotation?: number; color: string; i: number; t: number}> = ({position, rotation = 0, color, i, t}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <group rotation={[0, 0, Math.PI / 2]} position={[0.95, 0.17, 0]}>
      <Person position={[0, 0, 0]} shirt={SHIRTS[i % SHIRTS.length]} pants="#333" hair={HAIR[i % HAIR.length]} pose={{head: [0, 0], eyes: 0.15}} scale={0.95} />
    </group>
    {/* the bag covers everything but the head; breathing */}
    <Box size={[1.6, 0.34 + 0.02 * Math.sin(t * 2.2 + i), 0.62]} position={[0.05, 0.17, 0]} color={color} />
    <Box size={[0.3, 0.12, 0.5]} position={[1.25, 0.06, 0]} color="#f2f2f2" />
  </group>
);

// ---------------------------------------------------------------- the phone close-up

export const BigPhone: React.FC<{k: number; play: number}> = ({k, play}) => {
  const qk = k >= 1 ? 1 : Math.round(k * 20) / 20;
  const qp = Math.round(play * 20) / 20;
  return (
    <group>
      <Box size={[0.078, 0.162, 0.009]} position={[0, 0, -0.005]} color="#18181c" />
      <Pic size={[0.072, 0.156]} res={[360, 780]} k={`vid${qk}-${qp}`} draw={(g, W, H) => drawVideo(g, W, H, qk, qp)} position={[0, 0, 0.003]} lit={false} glow={1} />
      {/* the hand: palm behind, fingers around the sides, thumb */}
      <Box size={[0.09, 0.1, 0.03]} position={[0.004, -0.06, -0.025]} color="#efd2b3" />
      {[0, 1, 2].map((i) => (
        <Box key={i} size={[0.018, 0.02, 0.022]} position={[0.046, -0.01 - i * 0.026, -0.006]} color="#efd2b3" />
      ))}
      <Box size={[0.022, 0.06, 0.02]} position={[-0.046, -0.06, 0.0]} rotation={[0, 0, -0.3]} color="#efd2b3" />
      <Box size={[0.07, 0.25, 0.06]} position={[0.012, -0.21, -0.03]} rotation={[0, 0, 0.1]} color="#4a7fd0" />
    </group>
  );
};

export const Cardboard: React.FC<{lines: string[]; size?: [number, number]}> = ({lines, size = [0.8, 0.55]}) => (
  <group>
    <Pic size={size} res={[Math.round(size[0] * 600), Math.round(size[1] * 600)]} k={`cb${lines.join('|')}`} draw={(g, W, H) => drawCardboard(g, W, H, lines)} />
    <Box size={[size[0], size[1], 0.01]} position={[0, 0, -0.006]} color="#a8844a" shadow={false} />
  </group>
);

// ---------------------------------------------------------------- the terminal from outside (arrivals)

export const Terminal: React.FC<{doors: number}> = ({doors}) => (
  <group>
    <Box size={[30, 7, 6]} position={[0, 3.5, -3.2]} color="#c8d2dc" />
    {/* glass front */}
    {Array.from({length: 10}).map((_, i) => (
      <Box key={i} size={[2.6, 4.2, 0.04]} position={[-13 + i * 2.9, 2.6, -0.18]} color="#8ab0d0" emissive="#9ac0e0" emissiveIntensity={0.55} />
    ))}
    <Box size={[30, 0.4, 0.3]} position={[0, 4.9, -0.1]} color="#e8ecf0" />
    <Box size={[6.4, 1.0, 0.16]} position={[0, 5.9, 0.0]} color="#1e5fbf" />
    <Pic size={[6.2, 0.9]} res={[1240, 180]} k="arr" draw={(g, W, H) => drawSign(g, W, H, 'ПРИЛЁТ', '#1e5fbf', '#ffffff')} position={[0, 5.9, 0.085]} lit={false} glow={1} />
    {/* the sliding doors (in the middle bay) */}
    <Box size={[3.4, 3.0, 0.1]} position={[0, 1.5, -0.12]} color="#2a3038" />
    {[-1, 1].map((s) => (
      <Box key={s} size={[0.84, 2.6, 0.04]} position={[s * (0.43 + 0.86 * doors), 1.3, 0.0]} color="#a8d0f0" emissive="#c0e0ff" emissiveIntensity={0.4} opacity={0.75} />
    ))}
    {/* the hall behind the doors: bright */}
    <Box size={[1.7, 2.6, 0.02]} position={[0, 1.3, -0.2]} color="#f4f8ff" emissive="#f4f8ff" emissiveIntensity={0.6} />
    {/* pavement, curb, road */}
    <Box size={[40, 0.1, 6]} position={[0, -0.05, 2.9]} color="#b9b3a8" />
    <Box size={[40, 0.14, 0.3]} position={[0, -0.03, 6.0]} color="#d6d2ca" />
    <Box size={[40, 0.1, 14]} position={[0, -0.12, 13]} color="#4a4b50" />
  </group>
);

// ---------------------------------------------------------------- the tech store

export const TECH_TAGS: [string, string, string][] = [
  ['ТЕЛЕФОН', '99 990 ₽', '9 990 ₽'],
  ['ТЕЛЕВИЗОР', '49 990 ₽', '4 990 ₽'],
  ['НОУТБУК', '89 990 ₽', '8 990 ₽'],
];

export const PriceTag: React.FC<{position: V3; i: number; k: number}> = ({position, i, k}) => {
  const q = Math.round(k * 15) / 15;
  const [n, a, b] = TECH_TAGS[i];
  return <Pic size={[0.6, 0.42]} res={[480, 336]} k={`tag${i}-${q}`} draw={(g, W, H) => drawTag(g, W, H, n, a, b, q)} position={position} />;
};

export const TvBox: React.FC<{position?: V3; rotation?: V3}> = ({position, rotation}) => (
  <group position={position} rotation={rotation}>
    <Box size={[0.9, 0.55, 0.14]} color="#d8c8aa" />
    <Pic size={[0.86, 0.52]} res={[430, 260]} k="tvbox" draw={drawTvBox} position={[0, 0, 0.0715]} />
    <Pic size={[0.86, 0.52]} res={[430, 260]} k="tvbox" draw={drawTvBox} position={[0, 0, -0.0715]} rotation={[0, Math.PI, 0]} />
  </group>
);

export const TechStore: React.FC<{ks: number[]}> = ({ks}) => (
  <group>
    <color attach="background" args={['#e8eaee']} />
    <hemisphereLight color="#ffffff" groundColor="#8a8c90" intensity={1.35} />
    <directionalLight position={[4, 10, 8]} color="#ffffff" intensity={1.0} />
    <Box size={[24, 0.1, 20]} position={[0, -0.05, 4]} color="#f0f0f2" />
    <Box size={[24, 5, 0.2]} position={[0, 2.5, -1.6]} color="#f4f4f6" />
    <Box size={[7, 0.7, 0.1]} position={[0, 4.0, -1.45]} color="#1e5fbf" />
    <Pic size={[6.8, 0.6]} res={[1360, 120]} k="techsign" draw={(g, W, H) => drawSign(g, W, H, 'ТЕХНИКА', '#1e5fbf', '#ffffff')} position={[0, 4.0, -1.39]} lit={false} glow={1} />
    {/* three display stands: phone, TV, laptop, each with its tag */}
    {[-1.0, 0, 1.0].map((x, i) => (
      <group key={x} position={[x, 0, -0.6]}>
        <Box size={[0.94, 1.0, 0.8]} position={[0, 0.5, 0]} color="#ffffff" />
        <Box size={[0.96, 0.04, 0.84]} position={[0, 1.02, 0]} color="#d0d4da" />
        {i === 0 ? (
          <group position={[0, 1.2, 0]} rotation={[-0.25, 0, 0]}>
            <Box size={[0.2, 0.4, 0.03]} color="#1a1a1e" />
            <Box size={[0.18, 0.37, 0.005]} position={[0, 0, 0.016]} color="#3a6ad8" emissive="#3a6ad8" emissiveIntensity={0.5} shadow={false} />
          </group>
        ) : i === 1 ? (
          <group position={[0, 1.55, -0.1]}>
            <Box size={[0.9, 0.54, 0.05]} color="#141418" />
            <Box size={[0.84, 0.48, 0.005]} position={[0, 0, 0.026]} color="#2a7ad8" emissive="#3a8ae8" emissiveIntensity={0.6} shadow={false} />
            <Box size={[0.3, 0.04, 0.2]} position={[0, -0.36, 0]} color="#2a2a30" />
            <Box size={[0.05, 0.1, 0.03]} position={[0, -0.31, 0]} color="#2a2a30" />
          </group>
        ) : (
          <group position={[0, 1.05, 0.05]}>
            <Box size={[0.6, 0.03, 0.4]} position={[0, 0.0, 0]} color="#b8bcc4" />
            <Box size={[0.6, 0.38, 0.02]} position={[0, 0.2, -0.2]} rotation={[-0.2, 0, 0]} color="#b8bcc4" />
            <Box size={[0.55, 0.33, 0.004]} position={[0, 0.2, -0.187]} rotation={[-0.2, 0, 0]} color="#2a5ab8" emissive="#3a6ad8" emissiveIntensity={0.5} shadow={false} />
          </group>
        )}
        <PriceTag position={[0, 0.62, 0.405]} i={i} k={ks[i] ?? 0} />
      </group>
    ))}
    {/* a stack of TV boxes by the wall */}
    {[0, 1, 2, 3].map((k) => (
      <TvBox key={k} position={[-2.6, 0.28 + k * 0.56, -0.9]} />
    ))}
    {[0, 1, 2].map((k) => (
      <TvBox key={k} position={[2.6, 0.28 + k * 0.56, -0.9]} />
    ))}
    {/* the till */}
    <group position={[3.6, 0, 2.6]}>
      <Box size={[1.6, 1.0, 0.7]} position={[0, 0.5, 0]} color="#1e5fbf" />
      <Box size={[0.4, 0.25, 0.3]} position={[0.3, 1.15, 0]} color="#2a2a30" />
    </group>
    <Box size={[24, 0.2, 20]} position={[0, 5.1, 4]} color="#f8f8fa" />
  </group>
);

// ---------------------------------------------------------------- the road at night

export const Roller: React.FC<{x: number; t: number}> = ({x, t}) => {
  const spin = -x / 0.55;
  const beacon = Math.sin(t * 9) > 0;
  return (
    <group position={[x, 0, 0]}>
      {/* the front drum: its axis along z */}
      <group position={[0, 0.55, 0]} rotation={[Math.PI / 2, spin, 0]}>
        <Cyl rTop={0.55} rBottom={0.55} height={1.7} segments={14} color="#5a5e66" />
      </group>
      <Box size={[0.3, 0.9, 1.9]} position={[0, 0.95, 0]} color="#f2c12e" />
      {/* body and cabin */}
      <Box size={[2.0, 0.9, 1.5]} position={[-1.4, 1.05, 0]} color="#f2c12e" />
      <Box size={[0.4, 0.5, 1.5]} position={[-0.3, 1.35, 0]} color="#f2c12e" />
      <Box size={[1.1, 1.0, 1.2]} position={[-1.7, 2.0, 0]} color="#2a2e34" />
      <Box size={[1.04, 0.8, 1.24]} position={[-1.65, 2.05, 0]} color="#9ac0e0" emissive="#5a7a90" emissiveIntensity={0.4} />
      <Box size={[1.2, 0.08, 1.3]} position={[-1.7, 2.54, 0]} color="#f2c12e" />
      {/* rear wheels */}
      {[-0.75, 0.75].map((z) => (
        <group key={z} position={[-1.9, 0.5, z]} rotation={[Math.PI / 2, spin * 1.1, 0]}>
          <Cyl rTop={0.5} rBottom={0.5} height={0.35} segments={12} color="#1a1a1e" />
        </group>
      ))}
      {/* the worker in the cabin */}
      <Person position={[-1.75, 0.95, 0]} rotation={Math.PI / 2} shirt="#ff7a1a" pants="#2a3a5a" hair="#3a2a1e" pose={{...SIT, armL: [0.9, 0.1], armR: [0.9, -0.1], elbowL: 0.6, elbowR: 0.6}} scale={0.8} />
      {/* orange beacon */}
      <Box size={[0.16, 0.14, 0.16]} position={[-1.7, 2.65, 0]} color={beacon ? '#ffa020' : '#7a4a10'} emissive="#ff8a00" emissiveIntensity={beacon ? 3 : 0.2} />
      {beacon ? <pointLight position={[-1.7, 3.0, 0]} color="#ff9a20" intensity={14} distance={9} decay={1.6} /> : null}
      {/* headlights */}
      <Box size={[0.05, 0.12, 0.25]} position={[0.16, 1.3, 0.6]} color="#ffffff" emissive="#fff2c8" emissiveIntensity={3} />
      <Box size={[0.05, 0.12, 0.25]} position={[0.16, 1.3, -0.6]} color="#ffffff" emissive="#fff2c8" emissiveIntensity={3} />
      <pointLight position={[1.6, 1.0, 0]} color="#fff2c8" intensity={10} distance={7} decay={1.5} />
    </group>
  );
};

// a pothole with a puddle; k 0 = there, 1 = rolled flat
export const Pothole: React.FC<{position: V3; k: number; seed: number}> = ({position, k, seed}) => {
  if (k >= 1) return null;
  const s = 1 - k;
  return (
    <group position={position} rotation={[0, seed, 0]} scale={[s, 1, s]}>
      <Cyl rTop={0.5 + 0.2 * rnd(seed)} rBottom={0.5 + 0.2 * rnd(seed)} height={0.012} segments={7} position={[0, 0.006, 0]} color="#1a1c22" shadow={false} />
      <Cyl rTop={0.36 + 0.15 * rnd(seed + 1)} rBottom={0.36} height={0.014} segments={6} position={[0.05, 0.008, 0.03]} color="#2a3a5a" emissive="#3a5a8a" emissiveIntensity={0.25} shadow={false} />
    </group>
  );
};

// ---------------------------------------------------------------- the classroom

export const Classroom: React.FC = () => (
  <group>
    <color attach="background" args={['#e8e4d8']} />
    <hemisphereLight color="#fff8ec" groundColor="#8a7c6a" intensity={1.25} />
    <directionalLight position={[6, 8, 4]} color="#fff0d8" intensity={1.2} />
    <Box size={[10, 0.1, 10]} position={[0, -0.05, 2]} color="#a8845a" />
    <Box size={[10, 3.4, 0.2]} position={[0, 1.7, -2.6]} color="#e8e0c8" />
    <Box size={[0.2, 3.4, 10]} position={[-4.5, 1.7, 2]} color="#e0d8c0" />
    <Box size={[10, 0.2, 10]} position={[0, 3.4, 2]} color="#f4f2ee" />
    {/* the blackboard */}
    <Box size={[3.8, 1.4, 0.06]} position={[-0.4, 1.75, -2.47]} color="#6a4a2a" />
    <Pic size={[3.6, 1.24]} res={[1080, 372]} k="board" draw={drawBlackboard} position={[-0.4, 1.75, -2.435]} />
    <Box size={[3.6, 0.05, 0.1]} position={[-0.4, 1.06, -2.42]} color="#6a4a2a" />
    {/* teacher's desk */}
    <Box size={[1.4, 0.06, 0.7]} position={[-2.6, 0.76, -1.6]} color="#8a6a4a" />
    <Box size={[1.36, 0.72, 0.05]} position={[-2.6, 0.37, -1.25]} color="#7a5a3a" />
    {/* the door on the right wall, open, with the doctor (the school nurse) */}
    <Box size={[0.2, 3.4, 10]} position={[4.5, 1.7, 2]} color="#e0d8c0" />
    <Box size={[0.22, 2.2, 1.0]} position={[4.4, 1.1, -1.4]} color="#3a2a1e" />
    {/* a window light patch */}
    <Box size={[1.6, 1.4, 0.02]} position={[-4.39, 1.9, 0.5]} rotation={[0, Math.PI / 2, 0]} color="#cfe4f4" emissive="#cfe4f4" emissiveIntensity={0.6} />
  </group>
);

export const SchoolDesk: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <Box size={[1.2, 0.05, 0.5]} position={[0, 0.72, 0]} color="#c8a46a" />
    {[-0.55, 0.55].map((x) => <Box key={x} size={[0.04, 0.7, 0.4]} position={[x, 0.35, 0]} color="#5a5e66" />)}
  </group>
);

export const PhoneScreen: React.FC<{on: number}> = ({on}) => {
  const q = Math.round(on * 10) / 10;
  return (
    <group>
      <Box size={[0.08, 0.16, 0.01]} position={[0, 0, -0.006]} color="#18181c" />
      <Pic size={[0.074, 0.152]} res={[370, 760]} k={`sal${q}`} draw={(g, W, H) => drawSalary(g, W, H, q)} position={[0, 0, 0.0002]} lit={false} glow={1} />
    </group>
  );
};

// ---------------------------------------------------------------- the visa centre

export const Embassy: React.FC = () => (
  <group>
    <Box size={[16, 8, 6]} position={[0, 4, -3.4]} color="#e6dcc8" />
    {Array.from({length: 6}).map((_, i) => (
      <Cyl key={i} rTop={0.3} rBottom={0.34} height={5.4} segments={10} position={[-5 + i * 2, 2.7, -0.2]} color="#f2ece0" />
    ))}
    <Box size={[12, 0.6, 1.2]} position={[0, 5.7, -0.2]} color="#f2ece0" />
    <Box size={[12.6, 0.3, 2.0]} position={[0, 0.15, -0.6]} color="#d8d0c0" />
    <Box size={[2.0, 3.0, 0.1]} position={[0, 1.8, -0.38]} color="#4a3020" />
    <Box size={[6, 0.9, 0.14]} position={[0, 6.6, -0.38]} color="#1e3a6a" />
    <Pic size={[5.8, 0.8]} res={[1160, 160]} k="visa" draw={(g, W, H) => drawSign(g, W, H, 'ВИЗОВЫЙ ЦЕНТР', '#1e3a6a', '#ffd23f')} position={[0, 6.6, -0.305]} />
    {/* the waiting board by the door */}
    <group position={[1.9, 0, 0.6]}>
      <Box size={[0.06, 1.2, 0.06]} position={[0, 0.6, 0]} color="#3a3a40" />
      <Box size={[1.3, 0.84, 0.05]} position={[0, 1.6, 0]} color="#1a1a1e" />
      <Pic size={[1.24, 0.78]} res={[620, 390]} k="wait" draw={(g, W, H) => drawPlate(g, W, H, 'ОЖИДАНИЕ', '3 ГОДА', '#ffffff', '#141414', '#d62a22')} position={[0, 1.6, 0.03]} />
    </group>
  </group>
);

export const MoneySack: React.FC = () => (
  <group>
    <Ico radius={0.26} detail={1} position={[0, -0.25, 0]} scale={[1, 1.15, 0.9]} color="#5a8a4a" />
    <Cyl rTop={0.06} rBottom={0.1} height={0.12} position={[0, 0.0, 0]} color="#4a7a3a" />
    <Pic size={[0.2, 0.2]} res={[100, 100]} k="usdsign" draw={(g, W, H) => drawSign(g, W, H, '$', '#5a8a4a', '#f2ffe0')} position={[0, -0.25, 0.24]} />
  </group>
);
