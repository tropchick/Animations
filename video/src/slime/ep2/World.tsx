import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {Color, Fog} from 'three';
import {V3, lerp, ramp, smooth} from '../cues';
import {Hall} from '../Hall';
import {Macro, MacroState, surfaceY} from '../Macro';
import {Cyl, GLASS} from '../parts';
import {CameraRig, View} from '../camera';
import {useEnvironment} from '../World';
import {SceneContext, SceneState} from '../scene';
import {EP1_END, HER, LEVER, LIGHTS_OFF, LOG_NUMBER, RADIO_CLICK, Shot2, VOICE, shotAt, shotEnd, shotStart, wordStart} from './cues';
import {viewAt2} from './camera';
import {Campus, Time} from './Campus';
import {Tunnel} from './Tunnel';
import {DoorEdge, DoorHand, FloorMass, GlebAtDoor, GlebAtWindow, GlebBacking, GlebPhone} from './HallEp2';
import {MassField, blob} from './Mass';
import {FPS} from '../cues';

const HALL_SHOTS: Shot2[] = ['recorder', 'sinking', 'phone', 'door', 'face', 'window', 'deskgone', 'doorgap'];
const OUTSIDE_DOOR: Shot2[] = ['door', 'face', 'doorgap'];
const NIGHT: Shot2[] = ['waiting', 'radio', 'silent', 'osoka'];
const DAWN: Shot2[] = ['roof', 'roofview', 'aerial', 'title'];

type Set = 'macro' | 'hall' | 'campus' | 'tunnel';
const FOG: Record<string, [string, number, number]> = {
  macro: ['#06080b', 5, 16],
  hall: ['#0a0e13', 3.5, 17],
  tunnel: ['#07090b', 2, 18],
  dusk: ['#3a4a63', 30, 260],
  night: ['#0b0f16', 30, 220],
  dawn: ['#a6aeb4', 80, 700],
};

// ---------------------------------------------------------------- macro: the jar sinking, the grains multiplying

const grainSpot = (i: number, R: number, D: number, scale: number): V3 => {
  // golden-angle spiral, a little shuffled: a dense heap in the middle of the pit
  const a = i * 2.39996 + Math.sin(i * 7.1) * 0.4;
  const r = Math.sqrt(i + 0.5) * 0.26 * scale * (1 + 0.15 * Math.sin(i * 3.7));
  const rr = Math.min(r, R * 0.8);
  return [Math.cos(a) * rr, surfaceY(rr, R, D) + 0.3 * scale * 0.55 + (i > 18 ? 0.1 * scale : 0), Math.sin(a) * rr];
};

const swarmCount = (v: number) => {
  if (v < wordStart(11)) return 4;
  if (v < wordStart(13)) return 8;
  return Math.round(lerp(8, 46, smooth(ramp(v, wordStart(13), shotEnd('swarm') - 0.3))));
};

const macroFor = (shot: Shot2, v: number): MacroState => {
  const scale = 0.55;
  if (shot === 'swarm') {
    const n = swarmCount(v);
    const R = lerp(2.0, 2.5, ramp(v, shotStart('swarm'), shotEnd('swarm')));
    const D = R * 0.3;
    return {pitR: R, pitD: D, grains: Array.from({length: n}).map((_, i) => grainSpot(i, R, D, scale)), scale, jar: true, ring: true};
  }
  return {pitR: 2.5, pitD: 0.75, grains: Array.from({length: 46}).map((_, i) => grainSpot(i, 2.5, 0.75, scale)), scale, ring: true};
};

const ringHeight = (x: number, z: number) => {
  const b = blob(x, z, 0, 0, 4.1);
  const r = Math.hypot(x, z);
  return r > 2.6 && b < 1 ? 0.03 + 0.05 * (1 - b) : -1;
};

const SunkJar: React.FC<{v: number}> = ({v}) => (
  <>
    <Cyl r={2.75} h={7} seg={48} open position={[0, 2.8, 0]} m={{...GLASS, opacity: 0.15}} />
    <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[2.75, 0.07, 5, 64]} />
      <meshStandardMaterial color="#9aa2a9" metalness={0.6} roughness={0.28} envMapIntensity={1.1} flatShading />
    </mesh>
    <MassField id="jar-ring" size={[9, 9]} seg={[80, 80]} height={ringHeight} v={v} ripple={0.006} jitter={0.35} />
  </>
);

// ---------------------------------------------------------------- the hall in episode 2

const sceneFor = (v: number, shot: Shot2): SceneState => ({
  v,
  log: LOG_NUMBER,
  clock: '05:00',
  voice: VOICE,
  counter: 'ОШИБКА',
  jarSink: lerp(0.03, 0.085, smooth(ramp(v, shotStart('sinking'), shotEnd('sinking')))),
  deskPatch: lerp(0.075, 0.13, smooth(ramp(v, shotStart('sinking') - 2, shotEnd('sinking')))),
  deskGone: v >= shotStart('window'),
  redLamp: v >= LEVER,
  corridorOutside: OUTSIDE_DOOR.includes(shot),
});

const HallEp2: React.FC<{v: number; shot: Shot2}> = ({v, shot}) => {
  const noon = shot === 'window' || shot === 'deskgone';
  return (
    <SceneContext.Provider value={sceneFor(v, shot)}>
      <Hall v={EP1_END} shot={shot} />
      {noon ? (
        <>
          <FloorMass v={v} />
          <hemisphereLight color="#e9eef2" groundColor="#2a3036" intensity={0.55} />
        </>
      ) : null}
      {shot === 'sinking' ? <GlebBacking v={v} from={shotStart('sinking')} to={shotEnd('sinking')} /> : null}
      {shot === 'phone' ? <GlebPhone v={v} /> : null}
      {shot === 'door' ? <GlebAtDoor v={v} lever={LEVER} /> : null}
      {shot === 'face' ? <GlebAtWindow v={v} /> : null}
      {shot === 'doorgap' ? (
        <>
          <DoorHand v={v} />
          <DoorEdge v={v} k={ramp(v, shotStart('doorgap'), shotEnd('doorgap'))} />
        </>
      ) : null}
    </SceneContext.Provider>
  );
};

// ---------------------------------------------------------------- campus

const herLevel = (v: number) => {
  if (v >= HER[0] && v <= HER[1]) return 0.35 + 0.65 * (VOICE[Math.round(v * FPS)] ?? 0);
  if (v >= RADIO_CLICK && v < RADIO_CLICK + 0.35) return 1;
  if (v > HER[1] && v < HER[1] + 0.3) return 0.4;
  return 0;
};

export const World2: React.FC<{v: number; view?: (v: number) => View}> = ({v, view = viewAt2}) => {
  const env = useEnvironment();
  const s = shotAt(v);
  const shot = s.name;
  const set: Set = shot === 'jarsink' || shot === 'swarm' ? 'macro' : HALL_SHOTS.includes(shot) ? 'hall' : shot === 'tunnel' ? 'tunnel' : 'campus';
  const time: Time = shot === 'yard' ? 'dusk' : NIGHT.includes(shot) ? 'night' : 'dawn';
  const [fc, near, far] = FOG[set === 'campus' ? time : set];
  const fog = useMemo(() => new Fog(fc, near, far), [fc, near, far]);
  const bg = useMemo(() => new Color(fc), [fc]);
  const scene = useThree((st) => st.scene);
  scene.environment = env;
  scene.environmentIntensity = 0.4;
  scene.fog = fog;
  scene.background = bg;
  return (
    <>
      <CameraRig v={v} view={view} />
      {set === 'macro' ? (
        <Macro v={v} shot={shot} state={macroFor(shot, v)}>
          {shot === 'jarsink' ? <SunkJar v={v} /> : null}
        </Macro>
      ) : null}
      {set === 'hall' ? <HallEp2 v={v} shot={shot} /> : null}
      {set === 'tunnel' ? <Tunnel k={s.k} /> : null}
      {set === 'campus' ? (
        <Campus
          v={v}
          time={time}
          shot={shot}
          osokaOn={time === 'dusk' || (time === 'night' && v < LIGHTS_OFF)}
          nina={shot === 'yard' ? [shotStart('yard') - 1, shotEnd('yard') + 0.5] : undefined}
          led={herLevel(v)}
          reflect={shot === 'silent' ? 1 : 0.3}
          glebAtWindow={shot === 'waiting'}
          glebOnRoof={DAWN.includes(shot)}
        />
      ) : null}
    </>
  );
};
