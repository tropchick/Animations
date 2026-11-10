import React from 'react';
import {CameraRig, View, handheld} from '../slime/camera';
import {Scene} from '../bear/common';
import {Shot, V3, shotAt} from './cues';
import {cloudGScene, cloudMScene, hookScene, planetScene, selfieScene, washerScene, wifiScene} from './scenes1';
import {consoleScene, europeScene, filesScene, islandScene, liftScene, loadingScene, robeScene} from './scenes2';

export const SCENES: Record<Shot, Scene> = {
  hook: hookScene,
  selfie: selfieScene,
  wifi: wifiScene,
  planet: planetScene,
  cloudG: cloudGScene,
  cloudM: cloudMScene,
  washer: washerScene,
  console: consoleScene,
  europe: europeScene,
  loading: loadingScene,
  lift: liftScene,
  files: filesScene,
  island: islandScene,
  robe: robeScene,
};

export const viewAt = (v: number): View => {
  const s = shotAt(v);
  const sc = SCENES[s.name];
  const view = sc.view(v);
  if (sc.noHandheld) return {...view, near: view.near ?? 0.05};
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
