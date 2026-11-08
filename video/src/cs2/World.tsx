import React from 'react';
import {CameraRig, View, handheld} from '../slime/camera';
import {Scene} from '../bear/common';
import {Shot, V3, shotAt} from './cues';
import {arenaScene, clubScene, familyScene, lobbyScene} from './scenes1';
import {examScene, exitScene, officeScene, queueScene} from './scenes2';
import {backScene, launchScene, mirrorScene, orbitScene, phoneScene, xrayScene} from './scenes3';

export const SCENES: Record<Shot, Scene> = {
  club: clubScene,
  lobby: lobbyScene,
  family: familyScene,
  arena: arenaScene,
  queue: queueScene,
  office: officeScene,
  exit: exitScene,
  exam: examScene,
  launch: launchScene,
  orbit: orbitScene,
  xray: xrayScene,
  mirror: mirrorScene,
  back: backScene,
  phone: phoneScene,
};

// handheld drift that grows with distance only up to a point, so close-ups stay readable
export const viewAt = (v: number): View => {
  const s = shotAt(v);
  const sc = SCENES[s.name];
  const view = sc.view(v);
  if (sc.noHandheld) return {...view, near: view.near ?? 0.01};
  const hv = handheld(view, v, sc.shakes ?? []);
  const d = Math.hypot(view.pos[0] - view.target[0], view.pos[1] - view.target[1], view.pos[2] - view.target[2]);
  const k = Math.min(1, 2 / d);
  const off: V3 = [hv.pos[0] - view.pos[0], hv.pos[1] - view.pos[1], hv.pos[2] - view.pos[2]];
  return {
    ...hv,
    near: Math.min(0.05, Math.max(0.004, d * 0.015)),
    far: view.far ?? 900,
    pos: [view.pos[0] + off[0] * k, view.pos[1] + off[1] * k, view.pos[2] + off[2] * k],
    target: [view.target[0] - off[0] * (1 - k), view.target[1] - off[1] * (1 - k), view.target[2] - off[2] * (1 - k)],
  };
};

export const World: React.FC<{v: number; view?: (v: number) => View; shot?: Shot}> = ({v, view, shot}) => {
  const s = shot ?? shotAt(v).name;
  return (
    <>
      <CameraRig v={v} view={view ?? viewAt} />
      {SCENES[s].render(v)}
    </>
  );
};
