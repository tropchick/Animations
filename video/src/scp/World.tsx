import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {CameraRig, View} from '../slime/camera';
import {useEnvironment} from '../slime/World';
import {Spot, Sun} from '../last/parts';
import {Box} from '../slime/parts';
import {
  CHIME, DOORS, FLASH_OFF, GONE, HAND_MOUTH, HUNT, KNOCKS, LEGS, NIGHT_CUT, PA, REC, ROWS, SLIDES, STAFF_STEP, Shot, TURN_HEAD, V3, add3, lerp,
  ramp, shotAt, shotStart, smooth, wordStart,
} from './cues';
import {viewAt} from './camera';
import {Store} from './Store';
import {COLUMN_X, FORT, columnZ} from './store';
import {Ben, Pose, Staff, bob, stride} from './people';
import {ExitSign, LampDisplay, Phone, PillowBin, Speaker, TableLamp, Wardrobe} from './props';
import {SLIT_IN, wardrobeAt} from './fort';
import {BEN_FORT, DN_BEN, DN_STAFF, JUNCTION, LAMP_DISPLAY, PA_BEN, PHONE_FLOOR, SPEAKER_AT, STAFF_AISLE, benRun} from './places';

// ---------------------------------------------------------------- light schedule

const CAM_Z = -92; // the lights-out shot looks down the main aisle from here
// when the ceiling row at distance d (m) in front of the lights-out camera goes dark: the rows die in pairs on the clunks
const rowOff = (d: number) => {
  const marks = ROWS.map((t, k) => [56 - k * 8, t]);
  if (d >= 56) return ROWS[0] - (d - 56) * 0.004;
  if (d < 0) return ROWS[ROWS.length - 1] + 0.05 - d * 0.004;
  for (let k = 0; k < marks.length - 1; k++) {
    const [d0, t0] = marks[k];
    const [d1] = marks[k + 1];
    if (d <= d0 && d > d1) return d - d1 > 4 ? t0 : marks[k + 1][1];
  }
  return ROWS[ROWS.length - 1];
};

const DAY_SHOTS: Shot[] = ['enter', 'turn', 'signs', 'rise', 'pa'];
const dayAt = (shot: Shot, v: number) => (DAY_SHOTS.includes(shot) || (shot === 'daynight' && v < NIGHT_CUT) ? 1 : 0);
const lampsAt = (shot: Shot, v: number) => (x: number, z: number) => {
  if (shot === 'lightsout') return v < rowOff(CAM_Z - z) ? 1 : 0;
  return dayAt(shot, v);
};
// how much daylight is left in the lights-out shot: the share of rows in front of the camera still lit
// how much light is left near the camera in the lights-out shot: the share of the closest rows still lit
const waveDay = (v: number) => {
  let on = 0;
  for (let d = 0; d < 20; d += 4) on += v < rowOff(d) ? 1 : 0;
  return on / 5;
};
// the darkness front: distance of the nearest row that has gone dark (Infinity before the wave starts)
const waveFront = (v: number) => {
  for (let d = 0; d < 200; d += 4) if (v >= rowOff(d)) return d;
  return Infinity;
};

const BLACK = new THREE.Color('#000');
const DAY_FOG = new THREE.Color('#d7d3c8');
const NIGHT_FOG = new THREE.Color('#030405');

// ---------------------------------------------------------------- exit signs that stay lit all night

type SignDef = {p: V3; r: number; arrow: 'left' | 'right' | 'up' | 'none'; rods?: number};
const SIGNS: SignDef[] = [
  // four round the junction, each arrow pointing on round the loop
  ...[0, 1, 2, 3].map((k): SignDef => {
    const a = (k * Math.PI) / 2 + Math.PI / 4;
    return {p: add3(JUNCTION, [Math.sin(a) * 2.9, 3.4, Math.cos(a) * 2.9]), r: a, arrow: 'right', rods: CEIL_GAP(3.4)};
  }),
  // over the main aisle
  ...[-104, -128, -152, -176].map((z): SignDef => ({p: [0, 3.3, z], r: 0, arrow: 'up', rods: CEIL_GAP(3.3)})),
  {p: [STAFF_AISLE[0], 3.0, STAFF_AISLE[2] - 4.6], r: 0, arrow: 'right', rods: CEIL_GAP(3.0)},
  // on the columns by the day/night spot and by the fort, facing the rooms
  {p: [-COLUMN_X + 0.29, 2.9, columnZ(7)], r: Math.PI / 2, arrow: 'left'},
  {p: [COLUMN_X + 0.29, 2.7, columnZ(8)], r: Math.PI / 2, arrow: 'left'},
];
function CEIL_GAP(y: number) {
  return 7 - 0.55 - y - 0.18;
}

// ---------------------------------------------------------------- people in each shot

const SEATED: Pose = {hipL: 1.5, hipR: 1.45, kneeL: 1.45, kneeR: 1.5, stoop: 0.02};
const FLOOR_SIT: Pose = {hipL: 1.9, hipR: 1.75, kneeL: 2.3, kneeR: 2.2, stoop: 0.12, armL: [0.5, 0.15], armR: [0.55, -0.15], elbowL: 0.9, elbowR: 0.9};
const floorSitY = 0.06 - (0.93 - 0.07) * 0.9;

const walkTo = (from: V3, to: V3, t0: number, speed: number, v: number) => {
  const d = Math.hypot(to[0] - from[0], to[2] - from[2]);
  const k = Math.max(0, Math.min(1, ((v - t0) * speed) / d));
  return {p: [lerp(from[0], to[0], k), 0, lerp(from[2], to[2], k)] as V3, moving: k > 0 && k < 1, dir: Math.atan2(to[0] - from[0], to[2] - from[2])};
};

const People: React.FC<{v: number; shot: Shot; cover?: boolean}> = ({v, shot, cover}) => {
  const out: React.ReactNode[] = [];
  if (cover) {
    // Ben at the end of the rack aisle, his phone light on three faceless staff in the green exit light
    out.push(
      <Ben key="ben" position={add3(STAFF_AISLE, [-0.45, 0, 5.2])} rotation={Math.PI + 0.12} eyes={1.35} pose={{armR: [1.35, -0.1], elbowR: 0.15, armL: [0.2, 0.15], elbowL: 0.5, head: [-0.05, 0.1, 0], stoop: -0.02, hipL: 0.15, kneeL: 0.2}} rightHand={<Phone v={v} mode="light" flash={3} rotation={[-Math.PI / 2 + 0.1, 0, 0]} position={[0, -0.03, 0.02]} />} />,
      <Staff key="s1" position={add3(STAFF_AISLE, [-0.2, 0, 1.6])} rotation={0.05} pose={{head: [0.18, 0.1, 0.05], armR: [0.05, -0.05]}} />,
      <Staff key="s2" position={add3(STAFF_AISLE, [1.0, 0, -0.6])} rotation={-0.5} pose={{head: [0.12, 0.6, -0.1], stoop: 0.08}} />,
      <Staff key="s3" position={add3(STAFF_AISLE, [-1.2, 0, -1.8])} rotation={0.4} pose={{head: [0.2, -0.3, 0]}} />,
    );
    return <>{out}</>;
  }
  if (shot === 'enter') {
    const w = walkTo([0.2, 0, 29.8], [0.45, 0, 23.0], shotStart('enter'), 1.35, v);
    const ph = (v - shotStart('enter')) * 7.2;
    out.push(
      <Ben key="ben" position={add3(w.p, [0, bob(ph, 0.45), 0])} rotation={w.dir} pose={{...stride(ph, 0.42), head: [0.02, Math.sin(v * 0.9) * 0.25, 0]}} />,
    );
  }
  if (shot === 'turn') {
    const t = smooth(ramp(v, shotStart('turn') + 0.15, shotStart('turn') + 1.0));
    const shock = smooth(ramp(v, GONE - 0.1, GONE + 0.6));
    out.push(
      <Ben
        key="ben"
        position={[1.6, 0, 21.4]}
        rotation={lerp(Math.PI / 2, 0, t)}
        eyes={1 + 0.35 * smooth(ramp(v, wordStart(26) - 0.5, wordStart(26)))}
        pose={{
          armL: [lerp(0.35, 0.25, shock), 0.12],
          elbowL: 1.3,
          armR: [0.05, -0.08],
          elbowR: 0.2,
          head: [lerp(0.05, -0.04, shock), lerp(0.3, 0, t), 0],
          stoop: lerp(0.04, -0.02, shock),
        }}
        leftHand={<TableLamp position={[0, -0.02, -0.17]} rotation={[Math.PI / 2, 0, 0]} />}
      />,
    );
  }
  if (shot === 'signs' || shot === 'rise') {
    const a = 0.6 + (v - shotStart('signs')) * 0.62;
    const r = 1.6;
    const ph = (v - shotStart('signs')) * 6.8;
    out.push(
      <Ben key="ben" position={add3(JUNCTION, [Math.sin(a) * r, bob(ph, 0.4), Math.cos(a) * r])} rotation={Math.atan2(Math.cos(a), -Math.sin(a))} pose={{...stride(ph, 0.4), head: [-0.12, 0.25, 0]}} />,
    );
  }
  if (shot === 'pa') {
    const look = smooth(ramp(v, CHIME + 0.1, CHIME + 0.8));
    const eat = 1 - smooth(ramp(v, CHIME - 0.2, CHIME + 0.3));
    const bite = 0.15 * Math.max(0, Math.sin(v * 2.4)) * eat;
    out.push(
      <Ben
        key="ben"
        position={[PA_BEN[0], 0.38 - 0.837, PA_BEN[2]]}
        rotation={Math.PI / 2}
        bag={false}
        pose={{
          ...SEATED,
          armR: [lerp(0.5, 0.95 + bite, eat), -0.12],
          elbowR: lerp(1.0, 1.75, eat),
          armL: [0.35, 0.25],
          elbowL: 0.6,
          head: [lerp(0.12, -0.45, look), lerp(0, 0.75, look), 0],
          stoop: lerp(0.1, 0.0, look),
        }}
        rightHand={<Box size={[0.035, 0.11, 0.02]} position={[0, -0.02, 0.03]} m={{color: '#c9772f', rough: 0.6}} shadow={false} />}
      />,
    );
  }
  if (shot === 'staff') {
    const step = smooth(ramp(v, STAFF_STEP - 0.45, STAFF_STEP));
    const turn = smooth(ramp(v, TURN_HEAD[0], TURN_HEAD[1]));
    out.push(
      <Staff key="s1" position={add3(STAFF_AISLE, [-0.25, 0, 0.6 + step * 0.75])} rotation={0.05} pose={{hipL: Math.sin(step * Math.PI) * 0.35, kneeL: Math.sin(step * Math.PI) * 0.4, head: [0.1, 0, 0]}} />,
      <Staff key="s2" position={add3(STAFF_AISLE, [1.3, 0, -1.4])} rotation={-1.4} pose={{head: [lerp(0.05, 0.12, turn), lerp(0, 1.25, turn), lerp(0, -0.15, turn)], stoop: 0.08}} />,
      <Staff key="s3" position={add3(STAFF_AISLE, [-1.5, 0, -2.6])} rotation={0.6} pose={{head: [0.2, 0.3, 0], armR: [0.1, -0.05]}} />,
    );
  }
  if (shot === 'daynight') {
    const night = v >= NIGHT_CUT;
    const snap = night ? smooth(ramp(v, HUNT - 0.06, HUNT + 0.12)) : 0;
    if (!night)
      out.push(<Ben key="ben" position={DN_BEN} rotation={-Math.PI / 2 - 0.35} pose={{head: [0.05, 0.25 * Math.sin(v * 0.8), 0], armR: [0.25, -0.05], elbowR: 1.2}} rightHand={<Phone v={v} mode="dark" rotation={[-1.2, 0, 0]} />} />);
    out.push(
      <Staff
        key="s"
        position={DN_STAFF}
        rotation={-0.25 + snap * 0.35}
        pose={{head: [lerp(0.06, 0.32, snap), lerp(-0.85, 0.75, snap), lerp(0, 0.12, snap)], stoop: lerp(0.06, 0.16, snap), armR: [lerp(0.02, 0.22, snap), -0.05]}}
      />,
    );
  }
  if (shot === 'run') {
    const b = benRun(v);
    const stopping = smooth(ramp(b.k, 0.85, 1));
    const pose = stride(b.phase, lerp(0.85, 0.15, stopping), true);
    out.push(
      <Ben
        key="ben"
        position={add3(b.p, [0, bob(b.phase, 0.85) * (1 - stopping), 0])}
        rotation={b.dir}
        pose={{...pose, armR: [1.15, -0.12], elbowR: 0.35, head: [0.0, 0.0, 0]}}
        rightHand={<Phone v={v} mode="light" flash={1} rotation={[-Math.PI / 2 + 0.25, 0, 0]} position={[0, -0.03, 0.02]} />}
      />,
    );
  }
  if (shot === 'fort') {
    // Ben stands in the middle and turns to haul each wardrobe in
    const k = SLIDES.reduce((acc, t, i) => (v >= t - 0.3 ? i : acc), 0);
    const w = wardrobeAt(k, v);
    const face = Math.atan2(w.position[0] - FORT[0], w.position[2] - FORT[2]);
    const pull = w.moving ? 1 : 0.3;
    out.push(
      <Ben
        key="ben"
        position={add3(FORT, [0.05, 0, 0])}
        rotation={face}
        pose={{armL: [1.25 * pull + 0.2, 0.15], armR: [1.25 * pull + 0.2, -0.15], elbowL: 0.25, elbowR: 0.25, stoop: -0.1 * pull, hipL: 0.15 * pull, kneeL: 0.2 * pull, hipR: -0.2 * pull}}
        rightHand={<Phone v={v} mode="light" flash={1} rotation={[-Math.PI / 2 + 0.6, 0, 0]} position={[0, -0.03, 0.02]} />}
      />,
    );
  }
  if (shot === 'hide' || shot === 'inside' || shot === 'knock' || shot === 'phone') {
    const lit = shot === 'hide' && v < FLASH_OFF;
    const mouth = shot === 'hide' ? smooth(ramp(v, HAND_MOUTH, HAND_MOUTH + 0.35)) : shot === 'inside' ? 1 - smooth(ramp(v, shotStart('inside') + 1.2, shotStart('inside') + 2.2)) : 0;
    const flinch = shot === 'knock' ? KNOCKS.reduce((a, t) => Math.max(a, Math.exp(-Math.max(0, v - t) * 6) * (v >= t ? 1 : 0)), 0) : 0;
    const eyes = shot === 'knock' ? 1.35 : shot === 'hide' && v > FLASH_OFF ? 1.2 : 1;
    out.push(
      <Ben
        key="ben"
        position={[BEN_FORT[0], floorSitY, BEN_FORT[2]]}
        rotation={-Math.PI / 2}
        eyes={eyes}
        pose={{
          ...FLOOR_SIT,
          armL: [lerp(0.5, 1.45, mouth), lerp(0.15, 0.35, mouth)],
          elbowL: lerp(0.9, 2.25, mouth),
          armR: shot === 'phone' ? [0.3, -0.25] : [0.9, -0.2],
          elbowR: shot === 'phone' ? 0.6 : 1.1,
          head: [lerp(0.08, -0.05, flinch) + (shot === 'inside' ? 0.1 : 0), shot === 'knock' ? -0.18 : shot === 'inside' ? 0.25 : 0, 0],
          lean: 0.04,
        }}
        rightHand={shot === 'phone' ? null : <Phone v={v} mode={lit ? 'light' : 'dark'} flash={lit ? 1 : 0} rotation={[0.2, 0, 0]} position={[0, -0.03, 0.03]} screenGlow={lit ? 0.6 : 0} />}
      />,
    );
  }
  if (shot === 'inside') {
    // two staff walk past outside, one each way; their feet land on the step sounds
    const walker = (t0: number, from: V3, dir: 1 | -1, key: string) => {
      const ph = ((v - t0) / 0.85) * Math.PI;
      const z = from[2] + dir * Math.max(0, v - t0 + 0.42) * 1.0;
      return <Staff key={key} position={[from[0], 0, z]} rotation={dir > 0 ? 0 : Math.PI} pose={{...stride(ph + Math.PI / 2, 0.38), head: [0.15, dir > 0 ? 0.4 : -0.4, 0]}} />;
    };
    out.push(walker(LEGS[0], [FORT[0] - 2.3, 0, FORT[2] - 2.4], 1, 'a'));
    out.push(walker(LEGS[4], [FORT[0] - 2.9, 0, FORT[2] + 1.2], -1, 'b'));
  }
  return <>{out}</>;
};

// ---------------------------------------------------------------- sets

const Fort: React.FC<{v: number; shot: Shot}> = ({v, shot}) => {
  const placed = shot !== 'run' && shot !== 'fort';
  const knock = (k: number) =>
    shot === 'knock' && k === 1 ? KNOCKS.reduce((a, t) => a + (v >= t ? Math.exp(-(v - t) * 9) * Math.sin((v - t) * 60) : 0), 0) : 0;
  return (
    <>
      {[0, 1, 2, 3].map((k) => {
        const w = wardrobeAt(k, placed ? 1e9 : shot === 'run' ? -1e9 : v);
        return <Wardrobe key={k} position={w.position} rotation={w.rotation} rattle={knock(k)} />;
      })}
    </>
  );
};

export const World: React.FC<{v: number; view?: (v: number) => View; cover?: boolean}> = ({v, view = viewAt, cover = false}) => {
  const env = useEnvironment();
  const s = shotAt(v);
  const shot: Shot = cover ? 'staff' : s.name;
  const scene = useThree((st) => st.scene);
  const day = shot === 'lightsout' ? waveDay(v) : dayAt(shot, v);
  const fog = useMemo(() => new THREE.Fog('#000', 10, 100), []);
  fog.color.copy(NIGHT_FOG).lerp(DAY_FOG, day);
  fog.near = lerp(3, 26, day);
  fog.far = lerp(shot === 'staff' ? 60 : 34, 200, day);
  if (shot === 'lightsout') {
    // the dark rolls in from the far end: black fog starting just past the front, the near floor still lit
    const front = waveFront(v);
    const black = smooth(ramp(v, ROWS[0] - 0.45, ROWS[0] + 0.05));
    fog.color.copy(DAY_FOG).lerp(NIGHT_FOG, black);
    fog.near = Math.max(3, Math.min(26, front - 6));
    fog.far = Math.max(34, Math.min(200, front + 3));
  }
  const bg = useMemo(() => new THREE.Color(), []);
  bg.copy(fog.color);
  scene.environment = env;
  scene.environmentIntensity = lerp(0.03, 0.4, day);
  scene.fog = shot === 'end' ? null : fog;
  scene.background = shot === 'end' ? BLACK : bg;
  if (shot === 'end') return <CameraRig v={v} view={view} />;

  const focus: V3 =
    shot === 'enter' ? [0.5, 0, 25] : shot === 'turn' ? [1.2, 0, 23] : shot === 'signs' || shot === 'rise' ? JUNCTION : shot === 'pa' ? [PA_BEN[0] + 3, 0, PA_BEN[2]] : shot === 'daynight' ? DN_BEN : FORT;
  const doorsOpen = smooth(ramp(v, DOORS - 0.3, DOORS + 0.9));
  const entrance = shot === 'enter' || (shot === 'turn' && v < GONE) ? doorsOpen : null;
  const night = 1 - day;
  const fortSet = ['phone', 'run', 'fort', 'hide', 'inside', 'knock'].includes(shot);
  const legsNear = shot === 'inside' ? 1 : 0;
  return (
    <>
      <CameraRig v={v} view={view} />
      <hemisphereLight args={['#fff6e6', '#8c867a', 0.95 * day + 0.12 * night]} color={day > 0.5 ? '#fff6e6' : '#2a3b52'} />
      <ambientLight intensity={0.12 * day + 0.02} />
      {day > 0 ? <Sun position={add3(focus, [7, 26, 9])} target={focus} color="#fff3e2" intensity={1.2 * day} shadow size={16} /> : null}
      <Store lamps={lampsAt(shot, v)} beyond={shot === 'turn' && v >= GONE} entrance={entrance} />
      {SIGNS.map((g, i) => (
        <ExitSign key={i} position={g.p} rotation={g.r} arrow={g.arrow} rods={g.rods} glow={1.5} />
      ))}
      {/* the lobby: pillow bins and the lamp display */}
      {shot === 'enter' || shot === 'turn' ? (
        <>
          <LampDisplay position={LAMP_DISPLAY} rotation={-Math.PI / 2} taken={shot === 'turn'} />
          <PillowBin position={[1.55, 0, 25.4]} seed={1} />
          <PillowBin position={[-1.45, 0, 24.2]} seed={2} />
          <PillowBin position={[1.7, 0, 23.1]} seed={3} />
          {shot === 'turn' && v >= GONE ? null : <PillowBin position={[-1.6, 0, 26.6]} seed={4} />}
        </>
      ) : null}
      {/* the PA room: the sofa Ben sits on, the speaker on the column */}
      {shot === 'pa' || shot === 'lightsout' ? (
        <>
          <PaSofa />
          <Speaker position={SPEAKER_AT} rotation={Math.PI} pulse={v > PA[0] && v < PA[1] ? Math.sin(v * 40) : 0} />
        </>
      ) : null}
      {fortSet ? <Fort v={v} shot={shot} /> : null}
      {shot === 'phone' ? <Phone v={v} mode={v < REC ? 'dark' : 'record'} recFrom={REC} battery={21} position={PHONE_FLOOR} rotation={[-Math.PI / 2, 0, 0.15]} screenGlow={1.1} /> : null}
      <People v={v} shot={shot} cover={cover} />
      {/* night lights: the green of the exit signs, and the slit light into the fort */}
      {night > 0.3 ? (
        <>
          {shot === 'lightsout' ? [-104, -128].map((z) => <pointLight key={z} position={[0, 3.0, z + 0.4]} color="#2fd27a" intensity={8 * night} distance={22} decay={1.6} />) : null}
          {shot === 'staff' ? (
            <>
              <pointLight position={add3(STAFF_AISLE, [0, 2.6, -5.6])} color="#2fd27a" intensity={30} distance={26} decay={1.5} />
              <Spot position={add3(STAFF_AISLE, [0.4, 2.8, -6.5])} target={add3(STAFF_AISLE, [0, 1.2, 6])} color="#3be08a" intensity={60} distance={40} angle={0.5} penumbra={0.7} />
            </>
          ) : null}
          {shot === 'daynight' ? <pointLight position={[-COLUMN_X + 0.7, 2.8, columnZ(7) - 0.2]} color="#2fd27a" intensity={14} distance={18} decay={1.6} /> : null}
          {fortSet ? (
            <>
              <pointLight position={[COLUMN_X + 0.7, 2.6, columnZ(8)]} color="#2fd27a" intensity={7} distance={16} decay={1.6} />
              <Spot position={[COLUMN_X + 0.6, 1.4 + legsNear * 0.4, FORT[2] - 0.48]} target={add3(SLIT_IN, [0.6, 0.7, 0])} color="#3be08a" intensity={14} distance={10} angle={0.35} penumbra={0.4} shadow={shot === 'inside' || shot === 'hide' || shot === 'knock' || shot === 'phone'} mapSize={1024} />
              <pointLight position={add3(FORT, [0, 2.0, 0])} color="#3a5a8a" intensity={0.25} distance={4} decay={2} />
              {shot === 'inside' ? <pointLight position={add3(FORT, [-3.4, 0.3, -0.5])} color="#3be08a" intensity={3} distance={3.2} decay={1.5} /> : null}
              {shot === 'fort' || shot === 'run' ? <pointLight position={add3(FORT, [-1.5, 4.5, 0.5])} color="#7f9cc4" intensity={6} distance={14} decay={1.4} /> : null}
            </>
          ) : null}
          {shot === 'hide' && v < FLASH_OFF ? <pointLight position={add3(BEN_FORT, [-0.35, 0.65, 0.05])} color="#ffe2b8" intensity={1.6} distance={3} decay={2} /> : null}
        </>
      ) : null}
    </>
  );
};

const PaSofa: React.FC = () => {
  const c = '#6f7d8c';
  const [x, , z] = PA_BEN;
  const sx = -0.06; // the sofa centre sits just behind Ben's hips
  return (
    <group position={[x + sx, 0, z]}>
      <Box size={[0.9, 0.26, 2.3]} position={[0, 0.22, 0]} m={{color: c, rough: 0.9}} />
      <Box size={[0.2, 0.58, 2.3]} position={[-0.35, 0.62, 0]} m={{color: c, rough: 0.9}} />
      {[-1, 1].map((a) => (
        <Box key={a} size={[0.92, 0.48, 0.18]} position={[0, 0.45, a * 1.24]} m={{color: c, rough: 0.9}} />
      ))}
      {[-1, 1].map((a) => (
        <Box key={a} size={[0.72, 0.12, 1.09]} position={[0.06, 0.41, a * 0.565]} m={{color: '#7a8796', rough: 0.95}} />
      ))}
      <Box size={[0.18, 0.36, 0.42]} position={[-0.18, 0.62, 0.7]} m={{color: '#c8a04a', rough: 0.95}} />
    </group>
  );
};
