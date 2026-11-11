import React, {useMemo} from 'react';
import {CameraRig, View} from '../slime/camera';
import {Batch, Parts} from './ink';
import {Blob, Jungle, Shadows} from './Jungle';

export type GScene = {
  view: (v: number) => View;
  build: (v: number, P: Parts, blobs: Blob[]) => void;
  extra?: (v: number) => React.ReactNode;
  shakes?: [number, number][];
};

export const Stage: React.FC<{v: number; scene: GScene; view: (v: number) => View}> = ({v, scene, view}) => {
  const o = useMemo(() => ({batch: new Batch(0.016, 1.4, 5.5), shadows: new Shadows()}), []);
  const P = new Parts();
  const blobs: Blob[] = [];
  scene.build(v, P, blobs);
  o.batch.set(P.list);
  o.shadows.set(blobs);
  return (
    <>
      <CameraRig v={v} view={view} />
      <Jungle v={v} />
      <primitive object={o.batch.group} />
      <primitive object={o.shadows.mesh} />
      {scene.extra?.(v)}
    </>
  );
};

// ---------------------------------------------------------------- shots
import {handheld} from '../slime/camera';
import {Shot, shotAt} from './cues';
import {beatScene, braveScene, chargeScene, clashScene, faceScene, hesitateScene, overScene} from './scenesA';
import {meleeScene, pileScene, pinnedScene, releaseScene, resultScene, spentScene, swarmScene} from './scenesB';

export const SCENES: Record<Shot, GScene> = {
  over: overScene,
  face: faceScene,
  hesitate: hesitateScene,
  beat: beatScene,
  charge: chargeScene,
  brave: braveScene,
  clash: clashScene,
  swarm: swarmScene,
  melee: meleeScene,
  pile: pileScene,
  pinned: pinnedScene,
  spent: spentScene,
  release: releaseScene,
  result: resultScene,
};

export const viewAt = (v: number, shot?: Shot): View => {
  const sc = SCENES[shot ?? shotAt(v).name];
  const view = sc.view(v);
  const hv = handheld(view, v, sc.shakes ?? []);
  const d = Math.hypot(view.pos[0] - view.target[0], view.pos[1] - view.target[1], view.pos[2] - view.target[2]);
  // far shots get the drift of a hand-held camera at two metres, not at twenty
  const k = Math.min(1, 2.5 / d);
  const off = [hv.pos[0] - view.pos[0], hv.pos[1] - view.pos[1], hv.pos[2] - view.pos[2]];
  return {
    ...view,
    near: 0.12,
    far: 900,
    pos: [view.pos[0] + off[0] * k, view.pos[1] + off[1] * k, view.pos[2] + off[2] * k],
    target: [view.target[0] - off[0] * (1 - k) * 0.5, view.target[1] - off[1] * (1 - k) * 0.5, view.target[2] - off[2] * (1 - k) * 0.5],
  };
};

export const World: React.FC<{v: number; view?: (v: number) => View; shot?: Shot}> = ({v, view, shot}) => {
  const s = shot ?? shotAt(v).name;
  return <Stage v={v} scene={SCENES[s]} view={view ?? ((x) => viewAt(x, s))} />;
};
