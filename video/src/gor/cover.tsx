import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Parts, V3} from './ink';
import {Blob} from './Jungle';
import {GScene} from './World';
import {drawGorilla, guard, hash, mixPose, scared, stand} from './rig';
import {HOME, N, put, standing} from './crowd';
import {gorBlob} from './scenesA';
import {COMIC, CREAM, INK, Panel, Print, RED, YELLOW} from './Overlay';

// The cover (frame 0 of the video): the gorilla up on two legs, roaring, seen over the heads of the men.
const GP: V3 = [0.05, 0, 5.9];
const CAM: V3 = [0.6, 3.6, 14.4];
const AT = 3.7;
export const coverScene: GScene = {
  view: () => ({pos: CAM, target: [0.05, 1.68, 5.9], fov: 35, far: 900}),
  build: (_v: number, P: Parts, blobs: Blob[]) => {
    drawGorilla(P, {
      root: {pos: GP, yaw: 0.06, scale: 1.15},
      up: 1,
      armL: [-1.02, 1.98, 0.42],
      armR: [1.05, 1.86, 0.5],
      palm: 1,
      jaw: 1,
      brow: 1,
      head: [0.05, -0.02],
      breath: 1,
    });
    gorBlob(blobs, GP, 1.1);
    for (let i = 0; i < N; i++) {
      const h = HOME[i];
      // nobody right in front of the lens
      if (Math.hypot(h.x - CAM[0], h.z - CAM[2]) < 1.05) continue;
      // and the first rows leave a gap, so he is seen head to foot
      if (h.row <= 1 && Math.abs(h.x - (GP[0] + ((CAM[0] - GP[0]) * (h.z - GP[2])) / (CAM[2] - GP[2]))) < 0.5) continue;
      const r = hash(i * 9.3);
      const pose = h.row <= 1 ? (r < 0.5 ? mixPose(stand(AT, i), guard(AT, i), 0.9) : mixPose(stand(AT, i), scared(AT, i), 0.7)) : r < 0.3 ? mixPose(stand(AT, i), guard(AT, i), 0.8) : stand(AT, i);
      put(P, blobs, standing(i, AT, [h.x, h.z], [GP[0], GP[2]], pose));
    }
  },
};

export const CoverPlates: React.FC = () => (
  <AbsoluteFill>
    <Print />
    <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center'}}>
      <div>
        <Panel bg={YELLOW} size={124} pad="6px 40px 14px" rot={-3}>
          100 МУЖЧИН
        </Panel>
      </div>
      <div style={{marginTop: 4, fontFamily: COMIC, fontSize: 92, color: RED, WebkitTextStroke: `18px ${INK}`, paintOrder: 'stroke fill', transform: 'rotate(-2deg)', lineHeight: 1}}>VS</div>
      <div style={{marginTop: 6}}>
        <Panel bg={INK} color={CREAM} size={124} pad="6px 40px 14px" rot={2}>
          1 ГОРИЛЛА
        </Panel>
      </div>
      <div style={{marginTop: 26}}>
        <Panel bg={RED} color="#fff" size={72} pad="8px 34px 14px" rot={-1.5}>
          КАК В РЕАЛЬНОСТИ?
        </Panel>
      </div>
    </div>
  </AbsoluteFill>
);
