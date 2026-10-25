import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {Color, Fog} from 'three';
import {FPS} from '../cues';
import {CameraRig, View} from '../camera';
import {useEnvironment} from '../World';
import {SceneContext, SceneState} from '../scene';
import {Campus, Time} from '../ep2/Campus';
import {DARK, FLAME, HER, LIVE, LOG_NUMBER, NO_INTERNET, NO_NET, SCAN_STOP, Shot3, VOICE, shotAt, shotStart, wordStart} from './cues';
import {viewAt3} from './camera';
import {Cordon, CordonState} from './Cordon';
import {Tent} from './Tent';
import {City, GlebAt} from './City';
import {PhoneSet} from './PhoneSet';

type Set = 'campus' | 'tent' | 'phone' | 'city';
const CAMPUS: Shot3[] = ['aerial', 'cordon', 'crane', 'wall', 'fire'];
const TENT: Shot3[] = ['recorder', 'tent', 'notepad'];
const FOG: Record<string, [string, number, number]> = {
  night: ['#0b0f16', 40, 330],
  overcast: ['#8e969b', 60, 520],
  evening: ['#262e39', 40, 360],
  tent: ['#0d0f10', 4, 14],
  phone: ['#05070a', 2, 30],
  city: ['#06080c', 160, 1900],
};

const sceneFor = (v: number): SceneState => ({
  v,
  log: LOG_NUMBER,
  clock: '08:00',
  voice: VOICE,
  jarSink: 0,
  deskPatch: 0,
  deskGone: false,
  redLamp: false,
  corridorOutside: false,
});

// the staff walkie-talkie: scanning channels, then stuck on the live one, the led following her voice
const SCAN_FROM = shotStart('scan') + 0.4;
const radioState = (v: number) => {
  if (v < SCAN_FROM) return {channel: 1, scanning: false, led: 0};
  if (v < SCAN_STOP) return {channel: (Math.floor((v - SCAN_FROM) / 0.32) % 16) + 1, scanning: true, led: 0};
  let led = v >= LIVE ? 0.12 : 0;
  for (const [a, b] of HER) if (v >= a && v <= b) led = 0.3 + 0.7 * (VOICE[Math.round(v * FPS)] ?? 0);
  return {channel: 13, scanning: false, led};
};
const freq = (ch: number) => `1${(43 + ch * 0.275).toFixed(3)}`;

export const World3: React.FC<{v: number; view?: (v: number) => View}> = ({v, view = viewAt3}) => {
  const env = useEnvironment();
  const s = shotAt(v);
  const shot = s.name;
  const set: Set = CAMPUS.includes(shot) ? 'campus' : TENT.includes(shot) ? 'tent' : shot === 'phone' ? 'phone' : 'city';
  const time: Time = shot === 'crane' ? 'overcast' : shot === 'wall' || shot === 'fire' ? 'evening' : 'night';
  const state: CordonState = shot === 'crane' ? 'day' : shot === 'wall' || shot === 'fire' ? 'evening' : 'night';
  const [fc, near, far] = FOG[set === 'campus' ? time : set];
  const fog = useMemo(() => new Fog(fc, near, far), [fc, near, far]);
  const bg = useMemo(() => new Color(fc), [fc]);
  const scene = useThree((st) => st.scene);
  scene.environment = env;
  scene.environmentIntensity = 0.4;
  scene.fog = fog;
  scene.background = bg;
  const r = radioState(v);
  const gleb: GlebAt = shot === 'window' ? 'window' : shot === 'hold' ? 'hold' : shot === 'reflect' ? 'reflect' : undefined;
  return (
    <>
      <CameraRig v={v} view={view} />
      {set === 'campus' ? (
        <Campus v={v} time={time} shot={shot} osokaOn={false} bare>
          <Cordon
            v={v}
            state={state}
            drop={shot === 'crane' ? s.k : 1}
            flame={shot === 'fire' ? FLAME : undefined}
            guards={shot === 'cordon' || shot === 'aerial'}
          />
        </Campus>
      ) : null}
      {set === 'tent' ? (
        <SceneContext.Provider value={sceneFor(v)}>
          <Tent v={v} writes={[wordStart(32) - 0.05, wordStart(34) + 0.05]} closeup={shot === 'notepad'} />
        </SceneContext.Provider>
      ) : null}
      {set === 'phone' ? <PhoneSet v={v} noNet={NO_NET} noInternet={NO_INTERNET} /> : null}
      {set === 'city' ? <City v={v} dark={DARK} gleb={gleb} people={shot === 'bridge' || shot === 'window' || shot === 'city'} radio={{...r, freq: freq(r.channel)}} /> : null}
    </>
  );
};
