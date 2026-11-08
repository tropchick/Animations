import React from 'react';
import {CameraRig, View, handheld} from '../slime/camera';
import {Shot, V3, shotAt} from './cues';
import {Scene} from './common';
import * as s1 from './scenes1';
import * as s2 from './scenes2';
import * as s3 from './scenes3';

// every shot of the film: what the camera does and what is on stage
const SCENES: Partial<Record<Shot, Scene>> = {
  phone: s1.phoneScene,
  path: s1.pathScene,
  rise: s1.riseScene,
  throw: s1.throwScene,
  wrapper: s1.wrapperScene,
  sit: s1.sitScene,
  views: s2.viewsScene,
  carry: s2.carryScene,
  dance: s2.danceScene,
  unbox: s2.unboxScene,
  contract: s2.contractScene,
  build: s2.buildScene,
  den: s2.denScene,
  dinner: s2.dinnerScene,
  sign: s2.signScene,
  ladle: s2.ladleScene,
  crowd: s3.crowdScene,
  jaw: s3.jawScene,
  star: s3.starScene,
  pass: s3.passScene,
  podcast: s3.podcastScene,
  lean: s3.leanScene,
  freeze: s3.freezeScene,
  answer: s3.answerScene,
  end: s3.endScene,
};

export {SCENES};

const sceneOf = (name: Shot): Scene => SCENES[name] ?? s1.sitScene;

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
