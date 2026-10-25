import React, {useMemo} from 'react';
import {random} from 'remotion';
import {Box, Cyl} from '../scene/parts';
import {Inst, setBoxes, useBoxes} from './inst';
import {vAtWind} from './loose';
import {V, V3, clamp01, ramp, restartK} from './time';

// ---------- Layout (meters). East is +x, the camera mostly looks north (-z). ----------
// Avenue along x: road |z| < 7, sidewalks 7..12. Towers stand north of it, a low row south.
// A side street runs north between towers B and C (|x| < 4).

export const ROAD_HALF = 7;
export const WALK = 12;
export const SIDE_HALF = 4;

export type TowerSpec = {id: string; x: number; w: number; d: number; h: number; glass: string; crane?: boolean};

export const TOWERS: TowerSpec[] = [
  {id: 'A', x: -35, w: 18, d: 20, h: 92, glass: '#7fa7c4'},
  {id: 'B', x: -13, w: 16, d: 20, h: 118, glass: '#8bb3cf', crane: true},
  {id: 'C', x: 14, w: 18, d: 20, h: 78, glass: '#9cc0d4'},
  {id: 'D', x: 36, w: 18, d: 20, h: 104, glass: '#7ea2bd'},
];
const TOWER_FRONT = -13; // south face of every tower
export const towerZ = (t: TowerSpec) => TOWER_FRONT - t.d / 2;

export const METRO: V3 = [24.5, 0.16, -10.3];

// ---------- Ground ----------

const Stripes: React.FC = () => {
  const items = [];
  for (let i = 0; i < 30; i++) {
    const x = -105 + i * 7;
    if (Math.abs(x) < 9) continue;
    items.push(<Box key={i} size={[3, 0.02, 0.16]} position={[x, 0.012, 0]} color="#f2efe6" shadow={false} />);
  }
  // crosswalk across the avenue west of the side street
  for (let i = 0; i < 9; i++) {
    items.push(<Box key={`z${i}`} size={[3.2, 0.022, 0.6]} position={[-7.5, 0.013, -5.6 + i * 1.4]} color="#f4f2ec" shadow={false} />);
  }
  return <>{items}</>;
};

export const Ground: React.FC = () => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[3000, 3000]} />
      <meshStandardMaterial color="#8c8a84" roughness={1} />
    </mesh>
    <Box size={[400, 0.02, ROAD_HALF * 2]} position={[0, 0.01, 0]} color="#56585d" />
    <Stripes />
    {/* sidewalks with curbs */}
    {[-1, 1].map((s) => (
      <React.Fragment key={s}>
        <Box size={[400, 0.16, WALK - ROAD_HALF]} position={[0, 0.08, s * (ROAD_HALF + WALK) / 2]} color="#d3cdc2" />
        <Box size={[400, 0.17, 0.3]} position={[0, 0.085, s * (ROAD_HALF + 0.15)]} color="#bdb7ab" />
      </React.Fragment>
    ))}
    {/* side street going north */}
    <Box size={[SIDE_HALF * 2, 0.021, 300]} position={[0, 0.011, -WALK - 150]} color="#56585d" />
    {[-1, 1].map((s) => (
      <Box key={s} size={[2.4, 0.16, 300]} position={[s * (SIDE_HALF + 1.2), 0.08, -WALK - 150]} color="#d3cdc2" />
    ))}
  </>
);

// ---------- Towers ----------

const G = 9.81;
const FLOOR = 3.5;
const LOBBY = 6;

type PaneSeed = {p: V3; s: V3; side: 'south' | 'east' | 'west'; release: number; spin: number; drift: number};

const towerSeeds = (t: TowerSpec) => {
  const floors = Math.floor((t.h - LOBBY) / FLOOR);
  const panes: PaneSeed[] = [];
  const cz = towerZ(t);
  const addFace = (side: PaneSeed['side'], cols: number, len: number) => {
    for (let f = -1; f < floors; f++) {
      const y0 = f < 0 ? 0.2 : LOBBY + f * FLOOR;
      const hgt = f < 0 ? LOBBY - 0.6 : FLOOR - 0.25;
      for (let c = 0; c < cols; c++) {
        const key = `${t.id}-${side}-${f}-${c}`;
        const u = -len / 2 + (len / cols) * (c + 0.5);
        const pw = len / cols - 0.22;
        // Glass gives way at 230..480 km/h; upper floors a little sooner.
        const thr = 230 + random(`thr-${key}`) * 250 - (f / floors) * 60;
        const p: V3 =
          side === 'south'
            ? [t.x + u, y0 + hgt / 2, cz + t.d / 2 + 0.06]
            : [t.x + (side === 'east' ? 1 : -1) * (t.w / 2 + 0.06), y0 + hgt / 2, cz + u];
        const s: V3 = side === 'south' ? [pw, hgt, 0.08] : [0.08, hgt, pw];
        panes.push({p, s, side, release: vAtWind(thr), spin: 2 + random(`sp-${key}`) * 5, drift: random(`dr-${key}`)});
      }
    }
  };
  addFace('south', Math.round(t.w / 3), t.w);
  addFace('east', Math.round(t.d / 3), t.d);
  addFace('west', Math.round(t.d / 3), t.d);

  // Dark rooms behind the glass, three chunks per floor; they blow out at the climax.
  const rooms: {p: V3; s: V3; release: number; up: number}[] = [];
  for (let f = -1; f < floors; f++) {
    const y0 = f < 0 ? 0.3 : LOBBY + f * FLOOR + 0.3;
    const hgt = f < 0 ? LOBBY - 0.6 : FLOOR - 0.6;
    for (let k = 0; k < 3; k++) {
      const key = `${t.id}-room-${f}-${k}`;
      rooms.push({
        p: [t.x - t.w / 3 + (k * t.w) / 3, y0 + hgt / 2, cz],
        s: [t.w / 3 - 0.5, hgt, t.d - 0.8],
        release: 40.5 + random(key) * 6.5 - (f / floors) * 1.5,
        up: random(`${key}-u`),
      });
    }
  }
  const slabs: Inst[] = [];
  for (let f = 0; f <= floors; f++) {
    slabs.push({p: [t.x, LOBBY + f * FLOOR, cz], s: [t.w - 0.2, 0.32, t.d - 0.2]});
  }
  const cols: Inst[] = [];
  for (const cx of [-0.5, -1 / 6, 1 / 6, 0.5]) {
    for (const zz of [-0.5, 0, 0.5]) {
      const top = LOBBY + floors * FLOOR;
      cols.push({p: [t.x + cx * (t.w - 0.7), top / 2, cz + zz * (t.d - 0.7)], s: [0.55, top, 0.55]});
    }
  }
  return {floors, panes, rooms, slabs, cols};
};

export const Tower: React.FC<{t: TowerSpec; v: number}> = ({t, v}) => {
  const seeds = useMemo(() => towerSeeds(t), [t]);
  const glass = useBoxes(useMemo(() => seeds.panes.map(() => t.glass), [seeds, t.glass]), {emissive: '#33618a', emissiveIntensity: 0.25});
  const rooms = useBoxes(useMemo(() => seeds.rooms.map((_, i) => (i % 2 ? '#3b4048' : '#444a52')), [seeds]));
  const slabs = useBoxes(useMemo(() => seeds.slabs.map(() => '#c9c4ba'), [seeds]));
  const cols = useBoxes(useMemo(() => seeds.cols.map(() => '#6f767f'), [seeds]));
  const gone = v >= V.zero;

  setBoxes(
    glass,
    seeds.panes.map((pn) => {
      const d = v - pn.release;
      if (d < 0) return {p: pn.p, s: pn.s};
      // windward panes cave in; the rest are sucked out and fly downwind
      if (pn.side === 'west' || d > 4.5 || gone) return {p: pn.p, s: pn.s, hide: true};
      const ax = 26 + 20 * pn.drift;
      const flutter = Math.sin(d * 7 + pn.drift * 6) * 0.6;
      return {
        p: [pn.p[0] + 0.5 * ax * d * d, pn.p[1] - 0.5 * 2.5 * d * d + flutter, pn.p[2] + (pn.side === 'south' ? 1.2 * d : 0)],
        s: pn.s,
        r: [d * pn.spin, d * pn.spin * 0.7, d * pn.spin * 0.4],
      };
    }),
  );
  setBoxes(
    rooms,
    seeds.rooms.map((r) => {
      const d = v - r.release;
      if (d < 0) return {p: r.p, s: r.s};
      if (d > 5 || gone) return {p: r.p, s: r.s, hide: true};
      return {
        p: [r.p[0] + 0.5 * 30 * d * d, r.p[1] + d * 3 * r.up - 0.5 * 2 * d * d, r.p[2] + d * 2 * (r.up - 0.5)],
        s: r.s,
        r: [d * 0.6 * r.up, d * 0.4, -d * (0.8 + r.up)],
      };
    }),
  );
  setBoxes(slabs, seeds.slabs);
  setBoxes(cols, seeds.cols);

  // Leans a little downwind at the climax; whips back west when the Earth snaps back.
  const lean = -0.025 * ramp(v, 41, 48) + (0.025 + 0.11 * Math.sin((Math.PI / 2) * restartK(v))) * (v >= V.restart ? 1 : 0);
  const baseX = t.x;
  const roofOn = v < 41 + random(`roof-${t.id}`) * 3;
  const top = LOBBY + seeds.floors * FLOOR;
  return (
    <group position={[baseX, 0, 0]} rotation={[0, 0, lean]}>
      <group position={[-baseX, 0, 0]}>
        <primitive object={glass} />
        <primitive object={rooms} />
        <primitive object={slabs} />
        <primitive object={cols} />
        {roofOn ? (
          <>
            <Box size={[t.w, 0.6, t.d]} position={[t.x, top + 0.3, towerZ(t)]} color="#d6d0c4" />
            <Box size={[4, 2.4, 3.4]} position={[t.x - t.w * 0.22, top + 1.8, towerZ(t) - 3]} color="#b5bac0" />
          </>
        ) : null}
        {t.crane ? <Crane t={t} v={v} top={top + 0.6} /> : null}
      </group>
    </group>
  );
};

// ---------- Tower crane on the roof of tower B ----------

const YELLOW = '#f2b632';

const Beam: React.FC<{a: V3; b: V3; r?: number; color?: string}> = ({a, b, r = 0.12, color = YELLOW}) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  return (
    <Box
      size={[len, r * 2, r * 2]}
      position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]}
      rotation={[0, 0, Math.atan2(dy, dx)]}
      color={color}
    />
  );
};

export const CRANE_FALL = 33.2;

export const craneState = (v: number) => {
  // Cranes are built to swing freely with the wind, so first the jib turns downwind.
  const yaw = -Math.PI / 2 + (Math.PI / 2) * ramp(v, 21, 27.5);
  const tip = -1.25 * ramp(v, CRANE_FALL - 0.4, CRANE_FALL + 1.2, (x) => x * x);
  const d = Math.max(0, v - (CRANE_FALL + 1.2));
  return {yaw, tip, d};
};

const Crane: React.FC<{t: TowerSpec; v: number; top: number}> = ({t, v, top}) => {
  const {yaw, tip, d} = craneState(v);
  if (d > 6 || v >= V.zero) return null;
  const mastH = 24;
  const fall: V3 = [12 * d + 0.5 * 14 * d * d, -0.5 * G * d * d, 0];
  return (
    <group position={[t.x - 3 + fall[0], top + fall[1], towerZ(t) + 2]} rotation={[0, 0, tip - 1.4 * d]}>
      <Box size={[1.6, mastH, 1.6]} position={[0, mastH / 2, 0]} color={YELLOW} />
      {Array.from({length: 8}).map((_, i) => (
        <Box key={i} size={[1.75, 0.15, 1.75]} position={[0, 1.5 + i * 3, 0]} color="#d99a1e" />
      ))}
      <group position={[0, mastH, 0]} rotation={[0, yaw, 0]}>
        <Box size={[2.2, 2, 2.2]} position={[0.6, 1, 0]} color="#e9e4da" />
        <Box size={[34, 1.1, 1.1]} position={[12, 1.2, 0]} color={YELLOW} />
        <Box size={[3, 2, 2]} position={[-6.5, 0.4, 0]} color="#9a968e" />
        <Beam a={[0, 6.5, 0]} b={[0, 1.2, 0]} r={0.3} />
        <Beam a={[0, 6.5, 0]} b={[24, 1.7, 0]} r={0.07} />
        <Beam a={[0, 6.5, 0]} b={[-6, 1.7, 0]} r={0.07} />
        <Box size={[0.06, 12, 0.06]} position={[22, -4.8, 0]} color="#3a3a3a" shadow={false} />
        <Box size={[0.8, 0.9, 0.8]} position={[22, -11, 0]} color="#3a3a3a" />
      </group>
    </group>
  );
};

// ---------- Billboard on the face of tower A ----------

export const BILLBOARD_TEAR = 30.0;

export const Billboard: React.FC<{v: number}> = ({v}) => {
  const t = TOWERS[0];
  const z0 = TOWER_FRONT + 0.35;
  const flap = 0.5 * ramp(v, BILLBOARD_TEAR - 0.8, BILLBOARD_TEAR, (x) => x * x) + 0.12 * Math.sin(v * 9) * ramp(v, 22, BILLBOARD_TEAR - 0.8) * (v < BILLBOARD_TEAR ? 1 : 0);
  const d = Math.max(0, v - BILLBOARD_TEAR);
  if (d > 6 || v >= V.zero) return null;
  const pos: V3 = [t.x + 4 + 0.5 * 18 * d * d, 21 + 4 * d - 0.5 * 3 * d * d, z0 + 3 * d];
  return (
    <group position={pos} rotation={[flap + d * 2.2, d * 1.3, -d * 1.6]}>
      <group position={[0, -3.5, 0]}>
        <Box size={[14.4, 7.4, 0.3]} position={[0, 0, 0]} color="#2c2f34" />
        <Box size={[14, 7, 0.1]} position={[0, 0, 0.18]} color="#f08a3c" />
        <Cyl rTop={2.1} rBottom={2.1} height={0.1} segments={16} position={[3.8, 0.6, 0.25]} rotation={[Math.PI / 2, 0, 0]} color="#ffe08a" />
        <Box size={[7.5, 1.1, 0.1]} position={[-2.6, 1.6, 0.25]} color="#ffffff" />
        <Box size={[5.5, 0.6, 0.1]} position={[-3.6, 0.1, 0.25]} color="#ffffff" />
        <Box size={[4, 0.9, 0.1]} position={[-4.1, -1.9, 0.25]} color="#2c6fb3" />
      </group>
    </group>
  );
};

// ---------- Low row of buildings south of the avenue (facades face north) ----------

type LowSpec = {x: number; w: number; h: number; color: string; key: string};

const LOW: LowSpec[] = (() => {
  const out: LowSpec[] = [];
  const cols = ['#e3d6c3', '#d9c2a8', '#c9d0d4', '#e8e0d0', '#cdb49a', '#d7cdbd'];
  let x = -95;
  let i = 0;
  while (x < 95) {
    const w = 12 + random(`lw-${i}`) * 9;
    out.push({x: x + w / 2, w: w - 0.6, h: 14 + random(`lh-${i}`) * 14, color: cols[i % cols.length], key: `low-${i}`});
    x += w;
    i++;
  }
  return out;
})();

const LOW_Z = WALK + 7;

export const LowRow: React.FC<{v: number}> = ({v}) => {
  const chunks = useMemo(() => {
    const items: {p: V3; s: V3; release: number; c: string; up: number}[] = [];
    LOW.forEach((b) => {
      const n = 4;
      for (let k = 0; k < n; k++) {
        for (let lvl = 0; lvl < 2; lvl++) {
          const key = `${b.key}-${k}-${lvl}`;
          items.push({
            p: [b.x - b.w / 2 + (b.w / n) * (k + 0.5), (b.h / 2) * (lvl + 0.5), LOW_Z],
            s: [b.w / n - 0.05, b.h / 2 - 0.05, 12],
            release: 38.5 + random(key) * 6 - lvl * 1.2,
            c: b.color,
            up: random(`${key}-u`),
          });
        }
      }
    });
    return items;
  }, []);
  const windows = useMemo(() => {
    const items: {p: V3; s: V3; chunk: number}[] = [];
    chunks.forEach((c, ci) => {
      const rows = Math.floor(c.s[1] / 3.2);
      for (let r = 0; r < rows; r++) {
        items.push({p: [0, -c.s[1] / 2 + 1.8 + r * 3.2, -6.03], s: [c.s[0] * 0.55, 1.5, 0.08], chunk: ci});
      }
    });
    return items;
  }, [chunks]);
  const body = useBoxes(useMemo(() => chunks.map((c) => c.c), [chunks]));
  const win = useBoxes(useMemo(() => windows.map(() => '#34404d'), [windows]), {castShadow: false});
  const state = chunks.map((c) => {
    const d = v - c.release;
    if (d < 0) return {p: c.p, r: [0, 0, 0] as V3, hide: false};
    if (d > 5 || v >= V.zero) return {p: c.p, r: [0, 0, 0] as V3, hide: true};
    return {
      p: [c.p[0] + 0.5 * 22 * d * d, c.p[1] + 4 * d * c.up - 0.5 * 3 * d * d, c.p[2] - 2 * d] as V3,
      r: [d * 0.5, d * 0.3 * c.up, -d * (0.7 + c.up)] as V3,
      hide: false,
    };
  });
  setBoxes(
    body,
    chunks.map((c, i) => ({p: state[i].p, s: c.s, r: state[i].r, hide: state[i].hide})),
  );
  // windows ride with their chunk (offset rotated approximately by the chunk's spin)
  setBoxes(
    win,
    windows.map((w) => {
      const st = state[w.chunk];
      if (st.hide) return {p: w.p, s: w.s, hide: true};
      const moving = v >= chunks[w.chunk].release;
      if (moving) return {p: w.p, s: w.s, hide: true};
      return {p: [st.p[0] + w.p[0], st.p[1] + w.p[1], st.p[2] + w.p[2]], s: w.s};
    }),
  );
  // stumps and foundations stay after everything above has gone
  const ruins = v >= 38.5;
  return (
    <>
      <primitive object={body} />
      <primitive object={win} />
      {ruins
        ? LOW.map((b) => <Box key={b.key} size={[b.w, 0.8 + random(`st-${b.key}`) * 1.4, 12]} position={[b.x, 0.5, LOW_Z]} color="#a8a196" />)
        : null}
    </>
  );
};

// ---------- Far city: intact towers, later only stumps ----------

export const FarCity: React.FC<{v: number}> = ({v}) => {
  const seeds = useMemo(() => {
    const items: {p: V3; s: V3; c: string}[] = [];
    const cols = ['#e3dccf', '#d5cfc5', '#c9d2d9', '#e8e2d6', '#bfa48a', '#9fb7c9', '#d9cdb9'];
    for (let bx = -8; bx <= 8; bx++) {
      for (let bz = -8; bz <= 8; bz++) {
        for (let k = 0; k < 4; k++) {
          const x = bx * 44 + (k % 2 ? 1 : -1) * 9.5;
          const z = bz * 44 - 30 + (k < 2 ? 1 : -1) * 9.5;
          if (Math.abs(x) < 100 && z > -60 && z < 45) continue;
          if (Math.abs(x) < 12 && z < -40) continue; // keep the side street open
          const key = `${bx}-${bz}-${k}`;
          const dist = Math.hypot(x, z);
          const h = 10 + random(`fc-h-${key}`) * (dist < 220 ? 60 : 26) + (random(`fc-t-${key}`) > 0.92 ? 45 : 0);
          const s = 13 + random(`fc-s-${key}`) * 4;
          items.push({p: [x, h / 2, z], s: [s, h, s], c: cols[Math.floor(random(`fc-c-${key}`) * cols.length)]});
        }
      }
    }
    return items;
  }, []);
  const mesh = useBoxes(useMemo(() => seeds.map((s) => s.c), [seeds]), {castShadow: false});
  const ruined = v >= 46;
  setBoxes(
    mesh,
    seeds.map((s, i) => {
      if (!ruined) return {p: s.p, s: s.s};
      const h = 1 + random(`fc-r-${i}`) * 4;
      return {p: [s.p[0], h / 2, s.p[2]], s: [s.s[0], h, s.s[2]]};
    }),
  );
  return <primitive object={mesh} />;
};

// ---------- Metro entrance: stairs down, railings, the M sign ----------

export const Metro: React.FC<{v: number}> = ({v}) => {
  const [x, y, z] = METRO;
  // the sign dies when the power goes, then flickers back on at the very end
  const end = v - (V.end - 2.6);
  const flick = end > 0 ? (end > 0.9 ? 1 : [0.15, 0.35, 0.5, 0.7].some((k) => end > k && end < k + 0.08) ? 1 : 0) : 0;
  const lit = v < 26 ? 1 : flick;
  const railsUp = v < 44.5;
  return (
    <group position={[x, y, z]}>
      {/* dark stairwell opening */}
      <Box size={[2.6, 0.02, 3.6]} position={[0, 0.012, 0]} color="#1b1d21" shadow={false} />
      {Array.from({length: 6}).map((_, i) => (
        <Box key={i} size={[2.5, 0.03, 0.12]} position={[0, 0.03, -1.6 + i * 0.6]} color="#4a4d53" shadow={false} />
      ))}
      {railsUp ? (
        <>
          {[-1.4, 1.4].map((rx) => (
            <React.Fragment key={rx}>
              <Box size={[0.1, 1.0, 3.8]} position={[rx, 0.5, 0]} color="#2f6b4f" />
              <Box size={[0.16, 0.1, 3.9]} position={[rx, 1.05, 0]} color="#2f6b4f" />
            </React.Fragment>
          ))}
          <Box size={[2.9, 1.0, 0.1]} position={[0, 0.5, -1.9]} color="#2f6b4f" />
        </>
      ) : null}
      {/* sign post with the M (concrete-set post, stays) */}
      <Cyl rTop={0.09} rBottom={0.12} height={3.4} segments={8} position={[1.9, 1.7, 1.6]} color="#2f3540" />
      <group position={[1.9, 3.6, 1.6]}>
        <Box size={[0.9, 0.9, 0.25]} color="#e23b3b" emissive={lit ? '#ff2a2a' : undefined} emissiveIntensity={lit ? 0.9 : 0} />
        {/* the M: two legs and a V */}
        <Box size={[0.1, 0.55, 0.05]} position={[-0.22, 0, 0.14]} color="#ffffff" emissive={lit ? '#ffffff' : undefined} emissiveIntensity={lit ? 0.8 : 0} shadow={false} />
        <Box size={[0.1, 0.55, 0.05]} position={[0.22, 0, 0.14]} color="#ffffff" emissive={lit ? '#ffffff' : undefined} emissiveIntensity={lit ? 0.8 : 0} shadow={false} />
        <Box size={[0.08, 0.32, 0.05]} position={[-0.1, 0.1, 0.14]} rotation={[0, 0, 0.5]} color="#ffffff" emissive={lit ? '#ffffff' : undefined} emissiveIntensity={lit ? 0.8 : 0} shadow={false} />
        <Box size={[0.08, 0.32, 0.05]} position={[0.1, 0.1, 0.14]} rotation={[0, 0, -0.5]} color="#ffffff" emissive={lit ? '#ffffff' : undefined} emissiveIntensity={lit ? 0.8 : 0} shadow={false} />
      </group>
    </group>
  );
};

export const dust01 = (wind: number) => clamp01((wind - 60) / 700);
