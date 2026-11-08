import React from 'react';
import {CameraRig, View, handheld} from '../slime/camera';
import {Shot, V3, shotAt} from './cues';
import type {Scene} from './common';
import * as s1 from './scenes1';
import * as s2 from './scenes2';

const SCENES: Partial<Record<Shot, Scene>> = {
  door: s1.doorScene,
  pull: s1.pullScene,
  turn: s1.turnScene,
  rNoise: s1.rNoiseScene,
  rTire: s1.rTireScene,
  rHabit: s1.rHabitScene,
  rCount: s1.rCountScene,
  rScream: s1.rScreamScene,
  palm: s1.palmScene,
  pharmacy: s2.pharmacyScene,
  detour: s2.detourScene,
  note: s2.noteScene,
  pWater: s2.pWaterScene,
  pDoor: s2.pDoorScene,
  pWin: s2.pWinScene,
  pLadder: s2.pLadderScene,
  pThread: s2.pThreadScene,
  pExit: s2.pExitScene,
  pFood: s2.pFoodScene,
};
export {SCENES};

const sceneOf = (name: Shot): Scene => SCENES[name] ?? s1.doorScene;

// handheld drift that grows with distance only up to a point, so close-ups stay readable
export const viewAt = (v: number): View => {
  const s = shotAt(v);
  const sc = sceneOf(s.name);
  const view = sc.view(v);
  if (sc.noHandheld) return {...view, near: view.near ?? 0.01};
  const hv = handheld(view, v, sc.shakes ?? []);
  const d = Math.hypot(view.pos[0] - view.target[0], view.pos[1] - view.target[1], view.pos[2] - view.target[2]);
  const k = Math.min(1, 2 / d);
  const off: V3 = [hv.pos[0] - view.pos[0], hv.pos[1] - view.pos[1], hv.pos[2] - view.pos[2]];
  return {
    ...hv,
    near: Math.min(0.05, Math.max(0.004, d * 0.015)),
    far: view.far ?? 400,
    pos: [view.pos[0] + off[0] * k, view.pos[1] + off[1] * k, view.pos[2] + off[2] * k],
    target: [view.target[0] - off[0] * (1 - k), view.target[1] - off[1] * (1 - k), view.target[2] - off[2] * (1 - k)],
  };
};

export const World: React.FC<{v: number; view?: (v: number) => View; shot?: Shot}> = ({v, view, shot}) => {
  const s = shot ?? shotAt(v).name;
  return (
    <>
      <CameraRig v={v} view={view ?? viewAt} />
      {sceneOf(s).render(v)}
    </>
  );
};
