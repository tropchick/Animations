import React from 'react';
import {Bear, BearPose} from './Bear';
import {ANYA, Human, HumanPose} from './People';
import {SelfieStick} from './Props';
import {ForestWorld} from './scenes1';
import type {V3} from './cues';
import {aim, yawTo} from './common';
import {at, bearHand, bearHead, humanHand, humanHead} from './rig';
import {CameraRig, View} from '../slime/camera';

// The cover (frame 0): an autumn forest, a huge brown bear up on his hind legs in a happy roar,
// and in front of him the girl with the selfie stick, eyes wide, delighted.

const A: V3 = [0.4, 0, 2.05];
const A_YAW = -0.05;
const B: V3 = [0.0, 0, -0.25];
const B_YAW = yawTo(B, [0.12, 0, 3.9]);

const ANYA_POSE: HumanPose = {
  lean: -0.04,
  twist: 0.1,
  head: [-0.06, -0.12, -0.12],
  // the stick goes up and out to her right, the phone looking down at the two of them
  armR: [-2.95, -0.2, 0],
  elbowR: -0.05,
  armL: [0.0, 0.22, 0],
  elbowL: -0.35,
  face: {wide: 0.85, smile: 0.75, mouth: 0.6, o: 0.25, happy: 0.15, brow: 0.08, blush: 0.45, look: [0, 0.02]},
};

const BEAR_POSE: BearPose = {
  lean: -0.1,
  twist: 0.0,
  head: [0.45, 0.04, 0.12],
  jaw: 0.62,
  armL: [-2.85, 0.38],
  armR: [-2.85, 0.38],
  elbowL: -0.3,
  elbowR: -0.3,
  face: {smile: 1.0, happy: 0.2, brow: 0.11, lid: 0, look: [0.06, -0.08], blush: 0.45},
  ears: 0.7,
};

const B_SCALE = 1.2;
export const coverProbe = () => ({
  face: at(humanHead(ANYA, A, A_YAW, ANYA_POSE)),
  bearHead: at(bearHead(B, B_YAW, BEAR_POSE, B_SCALE)),
  pawL: at(bearHand(B, B_YAW, BEAR_POSE, -1, B_SCALE)),
  pawR: at(bearHand(B, B_YAW, BEAR_POSE, 1, B_SCALE)),
  hand: at(humanHand(ANYA, A, A_YAW, ANYA_POSE, 1)),
  stick: at(humanHand(ANYA, A, A_YAW, ANYA_POSE, 1), [0, -0.95, 0]),
});

export const coverView = (): View => {
  const pos: V3 = [0.12, 1.2, 3.9];
  return {pos, target: aim(pos, coverProbe().face, 60, 1330, 730), fov: 60, far: 900};
};

export const CoverScene: React.FC = () => (
  <>
    <CameraRig v={0} view={coverView} />
    <ForestWorld v={12.2} center={[0, 0, 0]} leaves={1.6} beams={1.2} />
    <Bear position={B} rotation={B_YAW} pose={BEAR_POSE} scale={B_SCALE} />
    <Human
      o={ANYA}
      position={A}
      rotation={A_YAW}
      pose={ANYA_POSE}
      handR={<SelfieStick len={0.72} tilt={-0.25} />}
    />
  </>
);
