import {GScene} from './World';
import {cheer, drawGorilla, drawMan, fly, guard, hug, lie, makeLook, press, run, scared, sitHurt, stand, tired} from './rig';

export const labScene: GScene = {
  view: () => ({pos: [0, 1.5, 9], target: [0, 1.1, 0], fov: 40, far: 900}),
  build: (v, P, blobs) => {
    drawGorilla(P, {root: {pos: [-1.6, 0, 0], yaw: 0.5}, up: 0});
    drawGorilla(P, {root: {pos: [1.6, 0, -0.5], yaw: -0.3}, up: 1, jaw: 1, brow: 1, armL: [-0.3, 1.5, 0.5], armR: [0.3, 1.3, 0.5], palm: 1});
    blobs.push({x: -1.6, z: 0, len: 2.4, w: 0.9}, {x: 1.6, z: -0.5, len: 2.8, w: 0.8});
    const poses = [stand(v, 1), guard(v, 2), scared(v, 3), run(v * 9, 1, 4), fly(v, 5), sitHurt(v, 6), tired(v, 7), cheer(v, 8), press(v, 9), lie(v, 3), hug(v, 4)];
    poses.forEach((pose, i) => {
      const x = -5.5 + i * 1.1;
      const z = 3.2 + (i % 2) * 0.4;
      const root = i === 9 ? {pos: [x, 0, z] as [number, number, number], yaw: 0.6, pitch: -Math.PI / 2, pivot: 0.93, lift: 0.14} : i === 4 ? {pos: [x, 0, z] as [number, number, number], yaw: 0.4, pitch: -0.9, pivot: 1, lift: 1.6} : i === 10 ? {pos: [x, 0, z] as [number, number, number], yaw: 0.6, pitch: Math.PI / 2, pivot: 0.93, lift: 0.16} : {pos: [x, 0, z] as [number, number, number], yaw: Math.PI + (i - 5) * 0.08};
      drawMan(P, {root, pose, look: makeLook(i + 3)});
      blobs.push({x, z, len: 1.5, w: 0.33});
    });
  },
};
