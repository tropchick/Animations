import React, {useMemo} from 'react';
import {Box, Cyl} from '../scene/parts';
import {setBoxes, useBoxes, Inst} from '../earth/inst';
import {Beam, Puff, SquashY} from './geo';
import {DECK, Railing, SEA_Y, squash} from './town';
import {V3, clamp01, collapse, lerp, ramp, vAtG} from './time';

// ---------- The pier: a walkway out to a platform with the rides ----------

export const WALK_X = 5; // walkway half width
export const WALK_END = -38;
export const PLAT: {x: [number, number]; z: [number, number]} = {x: [-26, 26], z: [-38, -82]};
const PLANK_D = 0.5;
const PLANK_STEP = 0.56; // 6 cm gaps between planks
const PLANK_T = 0.12;

// The piles give way at 25 g and the deck drops into the sea.
export const pierDrop = (v: number) => collapse(v, 25, 1.4);

// One run of planks from the promenade to the end of the platform, so no two planks ever overlap.
const plankList = () => {
  const items: {p: V3; s: V3}[] = [];
  for (let z = -0.03 - PLANK_D / 2; z - PLANK_D / 2 > PLAT.z[1]; z -= PLANK_STEP) {
    const w = z > WALK_END ? WALK_X * 2 : PLAT.x[1] - PLAT.x[0];
    items.push({p: [0, DECK - PLANK_T / 2, z], s: [w, PLANK_T, PLANK_D]});
  }
  return items;
};

const PLANKS = plankList();
const PLANK_COLORS = PLANKS.map((_, i) => (i % 3 === 0 ? '#b98a5c' : i % 3 === 1 ? '#c49466' : '#ad8053'));

const Planks: React.FC<{v: number}> = ({v}) => {
  const mesh = useBoxes(PLANK_COLORS);
  // planks crack and sag a little before the piles go
  const sag = collapse(v, 5, 3);
  const items: Inst[] = PLANKS.map((p, i) => ({
    p: [p.p[0], p.p[1] - sag * 0.04 * (i % 4 === 0 ? 1 : 0), p.p[2]],
    s: p.s,
    r: [sag * 0.02 * ((i % 5) - 2) * (i % 4 === 0 ? 1 : 0), 0, 0],
  }));
  setBoxes(mesh, items);
  return <primitive object={mesh} />;
};

const Structure: React.FC = () => {
  const items = useMemo(() => {
    const out: React.ReactNode[] = [];
    const sTop = DECK - PLANK_T - 0.01; // stringers stop 1 cm under the planks
    // walkway stringers and piles
    [-4.5, -1.5, 1.5, 4.5].forEach((x) =>
      out.push(<Box key={`ws${x}`} size={[0.3, 0.4, 38.2]} position={[x, sTop - 0.2, -19.1 - 0.02]} color="#6e5338" />),
    );
    for (let z = -4; z > WALK_END; z -= 5)
      [-4.5, 4.5].forEach((x) =>
        out.push(<Cyl key={`wp${x}${z}`} rTop={0.3} rBottom={0.3} height={sTop - 0.42 - (SEA_Y - 5)} segments={7} position={[x, (sTop - 0.42 + SEA_Y - 5) / 2, z]} color="#5c4630" />),
      );
    // platform stringers and piles
    for (let x = -24; x <= 24; x += 4)
      out.push(<Box key={`ps${x}`} size={[0.3, 0.4, 43.6]} position={[x, sTop - 0.2, (PLAT.z[0] + PLAT.z[1]) / 2]} color="#6e5338" />);
    for (let x = -24; x <= 24; x += 8)
      for (let z = -41; z > PLAT.z[1]; z -= 7)
        out.push(<Cyl key={`pp${x}${z}`} rTop={0.35} rBottom={0.35} height={sTop - 0.42 - (SEA_Y - 5)} segments={7} position={[x, (sTop - 0.42 + SEA_Y - 5) / 2, z]} color="#5c4630" />);
    return out;
  }, []);
  return <>{items}</>;
};

// Railings along the walkway and around the platform (each runs along x; the walkway ones are turned).
const PierRailings: React.FC = () => (
  <>
    {[-WALK_X + 0.15, WALK_X - 0.15].map((x) => (
      <group key={x} position={[x, 0, WALK_END / 2]} rotation={[0, Math.PI / 2, 0]}>
        <Railing from={-18.7} to={18.7} z={0} />
      </group>
    ))}
    <Railing from={PLAT.x[0] + 0.15} to={PLAT.x[1] - 0.15} z={PLAT.z[1] + 0.2} />
    <Railing from={PLAT.x[0] + 0.15} to={-WALK_X - 0.4} z={PLAT.z[0] - 0.2} />
    <Railing from={WALK_X + 0.4} to={PLAT.x[1] - 0.15} z={PLAT.z[0] - 0.2} />
    {[PLAT.x[0] + 0.2, PLAT.x[1] - 0.2].map((x) => (
      <group key={x} position={[x, 0, (PLAT.z[0] + PLAT.z[1]) / 2]} rotation={[0, Math.PI / 2, 0]}>
        <Railing from={-21.6} to={21.6} z={0} />
      </group>
    ))}
  </>
);

// ---------- Ferris wheel ----------

export const WHEEL: V3 = [-15, DECK, -62];
export const WHEEL_R = 13;
const HUB_H = 16.6;
const GONDOLAS = 14;
const GONDOLA_COLORS = ['#e6493b', '#f2b33a', '#3c8fd8', '#47b07a', '#d856a0', '#f07f3a', '#7b62d0'];
export const WHEEL_BREAK_G = 9.2;

const wheelSpin = (v: number) => {
  const w0 = 0.09;
  if (v < 17.5) return w0 * v;
  const t = Math.min(2, v - 17.5);
  return w0 * 17.5 + w0 * (t - (t * t) / 4);
};

export const wheelState = (v: number) => {
  const tb = vAtG(WHEEL_BREAK_G);
  const sag = ramp(v, tb, tb + 0.5, (t) => t * t); // the legs give way, the rim drops onto the deck
  const tr = tb + 0.5;
  const rollT = Math.max(0, v - tr);
  const edgeX = PLAT.x[0] - 1;
  const rollDist = WHEEL[0] - edgeX; // until the centre is past the edge
  const a = 16;
  const tEdge = Math.sqrt((2 * rollDist) / a);
  const dx = Math.min(rollDist, 0.5 * a * rollT * rollT) + Math.max(0, rollT - tEdge) * a * tEdge * 0.35;
  const fallK = ramp(v, tr + tEdge, tr + tEdge + 1.0, (t) => t * t);
  const hubY = lerp(lerp(HUB_H, WHEEL_R + 0.1, sag), SEA_Y - DECK + 2.2, fallK);
  return {
    sag,
    x: WHEEL[0] - dx,
    hubY,
    spin: wheelSpin(v) + dx / WHEEL_R,
    fallK,
    crumple: 0.2 * sag + 0.25 * fallK,
    tSplash: tr + tEdge + 0.85,
  };
};

const Wheel: React.FC<{v: number}> = ({v}) => {
  const st = wheelState(v);
  const rimSegs = 28;
  const parts: React.ReactNode[] = [];
  [-1.4, 1.4].forEach((z) => {
    for (let i = 0; i < rimSegs; i++) {
      const a0 = (i / rimSegs) * Math.PI * 2;
      const a1 = ((i + 1) / rimSegs) * Math.PI * 2;
      parts.push(
        <Beam key={`r${z}-${i}`} from={[Math.cos(a0) * WHEEL_R, Math.sin(a0) * WHEEL_R, z]} to={[Math.cos(a1) * WHEEL_R, Math.sin(a1) * WHEEL_R, z]} r={0.2} color="#f4f4f2" />,
      );
    }
    for (let i = 0; i < GONDOLAS; i++) {
      const a = (i / GONDOLAS) * Math.PI * 2;
      parts.push(<Beam key={`s${z}-${i}`} from={[0, 0, z * 0.5]} to={[Math.cos(a) * WHEEL_R * 0.985, Math.sin(a) * WHEEL_R * 0.985, z]} r={0.09} color="#e9e9e6" />);
    }
  });
  // cross bars between the two rims, one per gondola
  const gond: React.ReactNode[] = [];
  for (let i = 0; i < GONDOLAS; i++) {
    const a = (i / GONDOLAS) * Math.PI * 2 + st.spin;
    const px = Math.cos(a) * WHEEL_R;
    const py = Math.sin(a) * WHEEL_R;
    parts.push(<Cyl key={`x${i}`} rTop={0.1} rBottom={0.1} height={2.7} segments={6} position={[Math.cos(a - st.spin) * WHEEL_R, Math.sin(a - st.spin) * WHEEL_R, 0]} rotation={[Math.PI / 2, 0, 0]} color="#d8d8d4" />);
    // gondolas hang straight down from the bar (they swing as the wheel falls)
    const swing = st.fallK * 0.9 * Math.sin(i * 1.3) + st.sag * 0.3 * Math.sin(v * 4 + i);
    gond.push(
      <group key={`g${i}`} position={[px, py, 0]} rotation={[0, 0, swing]}>
        <Box size={[0.08, 1.1, 0.08]} position={[0, -0.55, 0]} color="#3a3d44" />
        <Box size={[1.7, 1.5, 1.9]} position={[0, -1.85, 0]} color={GONDOLA_COLORS[i % GONDOLA_COLORS.length]} />
        <Box size={[1.9, 0.12, 2.1]} position={[0, -1.04, 0]} color="#f4f4f2" />
      </group>,
    );
  }
  return (
    <group position={[st.x, DECK + st.hubY, WHEEL[2]]} rotation={[-1.35 * st.fallK, 0, 0]} scale={[1, 1 - st.crumple, 1]}>
      <group rotation={[0, 0, st.spin]}>{parts}</group>
      {gond}
      <Cyl rTop={0.9} rBottom={0.9} height={3.6} segments={10} rotation={[Math.PI / 2, 0, 0]} color="#c9c9c4" />
    </group>
  );
};

// A-frame legs on both sides of the wheel; they splay and fold when it breaks.
const WheelLegs: React.FC<{v: number}> = ({v}) => {
  const st = wheelState(v);
  const top = lerp(HUB_H, 2.5, st.sag);
  const spread = lerp(7.5, 10, st.sag);
  return (
    <group position={WHEEL}>
      {[-2.9, 2.9].map((z) =>
        [-1, 1].map((sx) => (
          <Beam key={`${z}${sx}`} from={[sx * spread, 0, z * (1 + 0.3 * st.sag)]} to={[sx * 0.4 * (1 - st.sag), top, z * 0.62]} r={0.32} color="#d7d7d2" />
        )),
      )}
      <Box size={[2.4, 0.5, 8.4]} position={[0, 0.25, 0]} color="#8c8f96" />
    </group>
  );
};

// ---------- Roller coaster ----------

const COASTER_C: V3 = [13, DECK, -60];
const RX = 8.5;
const RZ = 13.5;
const TRACK_N = 96;

const trackH = (s: number) => {
  const u = ((s % 1) + 1) % 1;
  if (u < 0.28) return 3 + (12 * u) / 0.28; // lift hill
  if (u < 0.38) {
    const k = (u - 0.28) / 0.1;
    return 15 - 12.5 * (k * k * (3 - 2 * k));
  }
  if (u < 0.45) return 2.5;
  if (u < 0.6) return 2.5 + 5.5 * Math.sin(((u - 0.45) / 0.15) * Math.PI);
  return 2.5 + (0.5 * (u - 0.6)) / 0.4;
};

const trackP = (s: number): V3 => {
  const a = s * Math.PI * 2;
  return [COASTER_C[0] + RX * Math.cos(a), COASTER_C[1] + trackH(s), COASTER_C[2] + RZ * Math.sin(a)];
};

// Where the train is along the track (0..1, the lift starts at 0).
export const trainS = (v: number) => {
  if (v < 14.5) return (((v - 14.5) * 0.07) % 1 + 1) % 1;
  if (v < 16.5) return 0.05 * (v - 14.5);
  if (v < 18.5) {
    const t = v - 16.5;
    return 0.1 + 0.05 * t - 0.0125 * t * t;
  }
  if (v < 19) return 0.15;
  const t = v - 19;
  if (t < 2.236) return 0.15 - 0.03 * t * t;
  const t2 = Math.min(0.96, t - 2.236);
  return 1 - (0.134 * t2 - 0.07 * t2 * t2);
};

const coasterBreak = (v: number) => collapse(v, 14, 1.2);

const Coaster: React.FC<{v: number}> = ({v}) => {
  const k = coasterBreak(v);
  const rails: React.ReactNode[] = [];
  for (let i = 0; i < TRACK_N; i++) {
    const s0 = i / TRACK_N;
    const s1 = (i + 1) / TRACK_N;
    const p0 = trackP(s0);
    const p1 = trackP(s1);
    // lateral offset (outward normal of the ellipse in xz)
    const a = ((s0 + s1) / 2) * Math.PI * 2;
    const nx = Math.cos(a) / RX;
    const nz = Math.sin(a) / RZ;
    const nl = Math.hypot(nx, nz);
    const ox = (nx / nl) * 0.55;
    const oz = (nz / nl) * 0.55;
    [-1, 1].forEach((sd) =>
      rails.push(<Beam key={`r${i}${sd}`} from={[p0[0] + ox * sd, p0[1], p0[2] + oz * sd]} to={[p1[0] + ox * sd, p1[1], p1[2] + oz * sd]} r={0.09} color="#e84a3a" />),
    );
    if (i % 2 === 0) rails.push(<Beam key={`t${i}`} from={[p0[0] - ox * 1.15, p0[1] - 0.12, p0[2] - oz * 1.15]} to={[p0[0] + ox * 1.15, p0[1] - 0.12, p0[2] + oz * 1.15]} r={0.06} color="#5a5d63" />);
    if (i % 4 === 0) rails.push(<Cyl key={`c${i}`} rTop={0.16} rBottom={0.16} height={p0[1] - DECK - 0.25} segments={6} position={[p0[0], (p0[1] - 0.25 + DECK) / 2, p0[2]]} color="#f2f2ee" />);
  }
  // train: three cars
  const s = trainS(v);
  const cars: React.ReactNode[] = [];
  for (let c = 0; c < 3; c++) {
    const sc = s - c * 0.026;
    const p = trackP(sc);
    const q = trackP(sc + 0.004);
    const yaw = Math.atan2(q[0] - p[0], q[2] - p[2]);
    const pitch = -Math.atan2(q[1] - p[1], Math.hypot(q[0] - p[0], q[2] - p[2]));
    cars.push(
      <group key={c} position={[p[0], p[1] + 0.12, p[2]]} rotation={[0, yaw, 0]}>
        <group rotation={[pitch, 0, 0]}>
          <Box size={[1.3, 0.7, 1.9]} position={[0, 0.35, 0]} color={c === 0 ? '#2f6fd0' : '#3f86e6'} />
          <Box size={[1.1, 0.35, 0.5]} position={[0, 0.85, -0.45]} color="#20242a" />
          <Box size={[1.1, 0.35, 0.5]} position={[0, 0.85, 0.45]} color="#20242a" />
        </group>
      </group>,
    );
  }
  return (
    <SquashY base={DECK} s={1 - 0.82 * k}>
      <group rotation={[0, 0, 0.03 * k]}>
        {rails}
        {cars}
      </group>
    </SquashY>
  );
};

// ---------- The whole pier ----------

export const Pier: React.FC<{v: number}> = ({v}) => {
  const drop = pierDrop(v);
  const st = wheelState(v);
  return (
    <>
      <SquashY base={DECK} s={squash(v)}>
        <group position={[0, -5.2 * drop, 0]} rotation={[0.035 * drop, 0, -0.02 * drop]}>
          <Planks v={v} />
          <Structure />
          <PierRailings />
          <WheelLegs v={v} />
          <Coaster v={v} />
          {/* ticket booth at the platform entrance */}
          <group position={[-9, DECK, -41.5]}>
            <Box size={[3, 2.6, 2.4]} position={[0, 1.3, 0]} color="#f2e6c8" />
            <Box size={[3.4, 0.3, 2.8]} position={[0, 2.75, 0]} color="#d24a3c" />
            <Box size={[1.6, 0.9, 0.1]} position={[0, 1.5, 1.22]} color="#3a3a42" shadow={false} />
          </group>
        </group>
      </SquashY>
      <Wheel v={v} />
      <Puff v={v} t0={st.tSplash} position={[PLAT.x[0] - 8, SEA_Y, WHEEL[2]]} size={6} seed="wheel-splash" color="#f2f7fa" life={2.4} />
      <Puff v={v} t0={vAtG(25) + 1.0} position={[0, SEA_Y, -40]} size={6} seed="pier-splash" color="#f2f7fa" life={2.2} />
    </>
  );
};

export const COASTER = COASTER_C;
export const coasterTrainPos = (v: number) => trackP(trainS(v));
export {clamp01};
