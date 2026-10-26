import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {Box, Glow, Mat} from '../slime/parts';
import {V3, add3} from './cues';
import {FLOOR_H, RISE, STAIR_R0, STAIR_R1, STEPS_PER_TURN, WELL, WELL_R, helix} from './places';
import {drawPlate, seeded, useTex} from './tex';

// The spiral stairwell: a round concrete well, wedge steps round an open middle, a thin railing on the inside,
// one door and one floor sign per turn. Fog fills it from below.
// Step k covers the angles [kΔ, (k+1)Δ] and its tread is at k·RISE (see places.ts).

const DELTA = (Math.PI * 2) / STEPS_PER_TURN;
const T = 0.2; // slab thickness of a step
const TURN_MIN = -4;
const TURN_MAX = 6;
const K0 = TURN_MIN * STEPS_PER_TURN;
const K1 = TURN_MAX * STEPS_PER_TURN;
const RAIL_R = STAIR_R0 + 0.05;
const RAIL_H = 0.95;

const CONCRETE: Mat = {color: '#8e8b84', rough: 0.95};
const RAIL: Mat = {color: '#2f3a33', rough: 0.6, metal: 0.3};
const DOOR: Mat = {color: '#5b4636', rough: 0.85};
const DOOR_FRAME: Mat = {color: '#3e4a42', rough: 0.8};

// one step: an annular sector, top face at y = 0, a hair wider than Δ so neighbours overlap instead of touching
const stepGeometry = () => {
  const eps = 0.012;
  const s = new THREE.Shape();
  s.moveTo(STAIR_R0, 0);
  s.lineTo(STAIR_R1, 0);
  s.absarc(0, 0, STAIR_R1, 0, DELTA + eps, false);
  s.lineTo(Math.cos(DELTA + eps) * STAIR_R0, Math.sin(DELTA + eps) * STAIR_R0);
  s.absarc(0, 0, STAIR_R0, DELTA + eps, 0, true);
  const g = new THREE.ExtrudeGeometry(s, {depth: T, bevelEnabled: false, curveSegments: 3});
  g.rotateX(-Math.PI / 2); // (x, y, z) -> (x, z, -y): the shape's angle becomes the helix angle
  g.translate(0, -T, 0);
  g.computeVertexNormals();
  return g;
};

const Instanced: React.FC<{geometry: THREE.BufferGeometry; m: Mat; matrices: THREE.Matrix4[]}> = ({geometry, m, matrices}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const im = ref.current!;
    matrices.forEach((mx, i) => im.setMatrixAt(i, mx));
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
  }, [matrices]);
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, matrices.length]} castShadow receiveShadow frustumCulled={false}>
      <meshStandardMaterial color={m.color} roughness={m.rough ?? 0.85} metalness={m.metal ?? 0} flatShading />
    </instancedMesh>
  );
};

// the painted wall: green oil paint following the slope of the stairs, whitewash above
const drawWall = (c: CanvasRenderingContext2D) => {
  const {width: w, height: h} = c.canvas;
  const r = seeded(5);
  c.fillStyle = '#cfcabd';
  c.fillRect(0, 0, w, h);
  const px = h / FLOOR_H; // pixels per metre
  for (let x = 0; x < w; x++) {
    const u = x / w;
    const base = (u - 0.25) * FLOOR_H; // tread height at this angle (see the cylinder's uv)
    for (const shift of [-FLOOR_H, 0, FLOOR_H]) {
      const y0 = base + shift - 0.1;
      const y1 = base + shift + 1.3;
      c.fillStyle = '#56735c';
      c.fillRect(x, h - y1 * px, 1, (y1 - y0) * px);
      c.fillStyle = '#2f3d33';
      c.fillRect(x, h - (y1 + 0.03) * px, 1, 0.03 * px);
    }
  }
  for (let i = 0; i < 40; i++) {
    c.fillStyle = `rgba(80,80,72,${0.05 + r() * 0.1})`;
    c.fillRect(r() * w, r() * h, 10 + r() * 60, 20 + r() * 120);
  }
};

const Plate: React.FC<{text: string[]; position: V3; yaw: number}> = ({text, position, yaw}) => {
  const tex = useTex(768, 256, drawPlate(text), `well-plate-${text.join('|')}`);
  return (
    <mesh position={position} rotation={[0, yaw, 0]}>
      <planeGeometry args={[0.75, 0.25]} />
      <meshStandardMaterial map={tex} roughness={0.8} />
    </mesh>
  );
};

// facing the middle of the well from the wall at angle a
const inward = (a: number) => Math.atan2(-Math.cos(a), Math.sin(a));
const atWall = (a: number, r: number, y: number): V3 => add3(WELL, [Math.cos(a) * r, y, -Math.sin(a) * r]);

export const DOOR_STEP = 2; // the door of each turn stands on this tread of the turn

export const Well: React.FC<{base: number; fogTop: number; turns?: [number, number]}> = ({base, fogTop, turns = [TURN_MIN, TURN_MAX - 1]}) => {
  const step = useMemo(stepGeometry, []);
  const post = useMemo(() => new THREE.BoxGeometry(0.03, RAIL_H, 0.03), []);
  const steps = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    for (let k = K0; k < K1; k++) out.push(new THREE.Matrix4().makeRotationY(k * DELTA).setPosition(WELL[0], WELL[1] + k * RISE, WELL[2]));
    return out;
  }, []);
  const posts = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    for (let k = K0; k < K1; k++) {
      const a = (k + 0.5) * DELTA;
      out.push(new THREE.Matrix4().setPosition(...atWall(a, RAIL_R, k * RISE + RAIL_H / 2)));
    }
    return out;
  }, []);
  const rail = useMemo(() => {
    const a0 = K0 * DELTA;
    const a1 = K1 * DELTA;
    const pts: THREE.Vector3[] = [];
    const n = (TURN_MAX - TURN_MIN) * 72;
    for (let j = 0; j <= n; j++) {
      const p = helix(a0 + ((a1 - a0) * j) / n, RAIL_R);
      pts.push(new THREE.Vector3(p[0], p[1] - RISE / 2 + RAIL_H + 0.02, p[2]));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, (TURN_MAX - TURN_MIN) * 72, 0.03, 6, false);
  }, []);
  const wallTex = useTex(1024, 512, drawWall, 'well-wall');
  const wallH = (TURN_MAX - TURN_MIN + 1) * FLOOR_H;
  const wallMap = useMemo(() => {
    const t = wallTex.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, wallH / FLOOR_H);
    t.needsUpdate = true;
    return t;
  }, [wallTex, wallH]);
  const fogDiscs = 18;
  const turnList: number[] = [];
  for (let n = turns[0]; n <= turns[1]; n++) turnList.push(n);
  return (
    <group>
      <Instanced geometry={step} m={CONCRETE} matrices={steps} />
      <Instanced geometry={post} m={RAIL} matrices={posts} />
      <mesh geometry={rail} castShadow>
        <meshStandardMaterial color="#5a3b2a" roughness={0.6} flatShading />
      </mesh>
      {/* the round wall; its bottom edge sits a whole number of floors down, so the paint follows the stairs */}
      <mesh position={add3(WELL, [0, TURN_MIN * FLOOR_H + wallH / 2, 0])} receiveShadow>
        <cylinderGeometry args={[WELL_R, WELL_R, wallH, 72, 1, true]} />
        <meshStandardMaterial map={wallMap} side={THREE.BackSide} roughness={0.95} flatShading />
      </mesh>
      {turnList.map((n) => {
        const a = n * Math.PI * 2 + (DOOR_STEP + 0.5) * DELTA;
        const y = (n * STEPS_PER_TURN + DOOR_STEP) * RISE;
        const yaw = inward(a);
        const la = n * Math.PI * 2 + 11.5 * DELTA;
        const ly = (n * STEPS_PER_TURN + 11) * RISE + 2.3;
        return (
          <group key={n}>
            <Box size={[1.0, 2.12, 0.06]} position={atWall(a, 4.27, y + 1.04)} rotation={[0, yaw, 0]} m={DOOR_FRAME} />
            <Box size={[0.84, 1.98, 0.06]} position={atWall(a, 4.235, y + 1.0)} rotation={[0, yaw, 0]} m={DOOR} />
            <Box size={[0.03, 0.14, 0.05]} position={atWall(a - 0.075, 4.19, y + 1.0)} rotation={[0, yaw, 0]} m={RAIL} shadow={false} />
            <Plate text={[`ЭТАЖ ${base + n}`, 'КОРПУС 14 · СЕКЦИЯ Е4']} position={atWall(a, 4.272, y + 2.42)} yaw={yaw} />
            <Box size={[0.32, 0.12, 0.1]} position={atWall(la, 4.24, ly)} rotation={[0, inward(la), 0]} m={DOOR_FRAME} shadow={false} />
            <Glow size={[0.26, 0.08, 0.01]} position={atWall(la, 4.185, ly)} rotation={[0, inward(la), 0]} color="#f1ecd8" />
          </group>
        );
      })}
      {/* the fog: stacked thin layers up to fogTop, thicker towards the bottom */}
      {Array.from({length: fogDiscs}, (_, i) => {
        const y = fogTop - i * 0.28;
        return (
          <mesh key={i} position={add3(WELL, [0, y, 0])} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[WELL_R - 0.02, 48]} />
            <meshBasicMaterial color="#d3d9d7" transparent opacity={i === 0 ? 0.1 : 0.16} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
};

// where the door of turn n stands (for camera targets)
export const wellDoor = (n: number): V3 => atWall(n * Math.PI * 2 + (DOOR_STEP + 0.5) * DELTA, 4.0, (n * STEPS_PER_TURN + DOOR_STEP) * RISE);
export {DELTA as STEP_ANGLE};
