import React from 'react';
import * as THREE from 'three';
import {Box, Cone, Cyl, Ico} from '../scene/parts';
import {Dog, Person, PersonPose} from '../scene/Characters';
import {Rope} from '../gravity/props';
import {DECK} from './town';
import {V3, clamp01, gAt, lerp, ramp} from './time';

const G0 = 9.8;
const FPS = 30;

// ---------- Posture: standing -> sitting on the ground -> lying on the back ----------

type Posture = {pos: V3; yaw: number; scale?: number; sit: number; lie: number};

// The body pivots at the hips: sitting drops the hips to the ground with the legs forward,
// lying tips the torso back until the back rests on the ground.
const Posed: React.FC<{st: Posture; pose?: PersonPose; children: (pose: PersonPose) => React.ReactNode}> = ({st, pose = {}, children}) => {
  const s = st.scale ?? 1;
  const a = st.lie * (Math.PI / 2);
  const hip = lerp(0.9, 0.16, st.sit);
  const legs = st.sit * (Math.PI / 2) - a;
  const restArms: [number, number] = [lerp(0, 0.35, st.sit) * (1 - st.lie), 0.06];
  const p: PersonPose = {
    ...pose,
    legL: lerp(pose.legL ?? 0, legs, Math.max(st.sit, st.lie)),
    legR: lerp(pose.legR ?? 0, legs, Math.max(st.sit, st.lie)),
    armL: st.sit > 0 ? [lerp((pose.armL ?? [0, 0.06])[0], restArms[0], st.sit), 0.06 + 0.1 * st.lie] : pose.armL,
    armR: st.sit > 0 ? [lerp((pose.armR ?? [0, -0.06])[0], restArms[0], st.sit), -0.06 - 0.1 * st.lie] : pose.armR,
    elbowL: st.sit > 0 ? lerp(pose.elbowL ?? 0, 0, st.sit) : pose.elbowL,
    elbowR: st.sit > 0 ? lerp(pose.elbowR ?? 0, 0, st.sit) : pose.elbowR,
    head: st.lie > 0 ? [lerp((pose.head ?? [0, 0])[0], -0.15, st.lie), 0] : pose.head,
  };
  return (
    <group position={st.pos} rotation={[0, st.yaw, 0]} scale={s}>
      <group position={[0, hip, 0]} rotation={[-a, 0, 0]}>
        <group position={[0, -0.9, 0]}>{children(p)}</group>
      </group>
    </group>
  );
};

// World position of a standing person's hand (same chain as the arm in Characters.tsx).
const M = new THREE.Matrix4();
const M2 = new THREE.Matrix4();
const E = new THREE.Euler();
const Q = new THREE.Quaternion();
const P = new THREE.Vector3();
const S = new THREE.Vector3();
export const handAt = (pos: V3, yaw: number, scale: number, side: 1 | -1, arm: [number, number], elbow: number): V3 => {
  M.compose(P.set(...pos), Q.setFromEuler(E.set(0, yaw, 0)), S.set(scale, scale, scale));
  M.multiply(M2.makeTranslation(0.33 * side, 1.52, 0));
  M.multiply(M2.makeRotationFromEuler(E.set(-arm[0], 0, arm[1])));
  M.multiply(M2.makeTranslation(0, -0.5, 0));
  M.multiply(M2.makeRotationFromEuler(E.set(-elbow, 0, 0)));
  M.multiply(M2.makeTranslation(0, -0.42, 0.02));
  return new THREE.Vector3().setFromMatrixPosition(M).toArray() as V3;
};

const walkPose = (phase: number, amount: number): PersonPose => ({
  legL: Math.sin(phase) * 0.45 * amount,
  legR: -Math.sin(phase) * 0.45 * amount,
  armL: [-Math.sin(phase) * 0.35 * amount, 0.06],
  armR: [Math.sin(phase) * 0.35 * amount, -0.06],
});

// Everyone sits down around 2.5-3 g and lies down at about 5 g.
const sitK = (v: number, t: number) => ramp(v, t, t + 1.3);
const lieK = (v: number, t: number) => ramp(v, t, t + 1.5);

// ---------- Girl with an ice cream ----------

export const GIRL: V3 = [3.4, DECK, 6.0];
const GIRL_YAW = Math.PI + 0.35;
const GIRL_S = 0.74;
export const SCOOP_DROP = 9.7;
const scoopFall = (v: number) => {
  const h0 = cone0()[1] + 0.22 - DECK;
  const t = Math.max(0, v - SCOOP_DROP);
  const gg = G0 * gAt(SCOOP_DROP);
  const tLand = Math.sqrt((2 * (h0 - 0.06)) / gg);
  return {t, tLand, y: Math.max(0.06, h0 - 0.5 * gg * t * t)};
};
const GIRL_ARM: [number, number] = [0.7, -0.14];
const GIRL_ELBOW = 1.4;
const cone0 = () => handAt(GIRL, GIRL_YAW, GIRL_S, 1, GIRL_ARM, GIRL_ELBOW);
export const splatTime = () => SCOOP_DROP + scoopFall(1e9).tLand;

const Girl: React.FC<{v: number}> = ({v}) => {
  const lower = ramp(v, 11.2, 12.2);
  const arm: [number, number] = [lerp(GIRL_ARM[0], 0.25, lower), GIRL_ARM[1]];
  const elbow = lerp(GIRL_ELBOW, 0.3, lower);
  const hand = handAt(GIRL, GIRL_YAW, GIRL_S, 1, arm, elbow);
  const f = scoopFall(v);
  const look = ramp(v, SCOOP_DROP + 0.2, SCOOP_DROP + 0.6);
  const st: Posture = {pos: GIRL, yaw: GIRL_YAW, scale: GIRL_S, sit: sitK(v, 21.2), lie: lieK(v, 25.3)};
  const sitting = st.sit > 0;
  return (
    <>
      <Posed st={st} pose={{armR: arm, elbowR: elbow, head: [0.15 + 0.35 * look, 0], mouth: look > 0.5 ? 0.5 : 0}}>
        {(p) => <Person position={[0, 0, 0]} shirt="#f28bb0" pants="#5b7fc4" hair="#c98a4a" longHair child pose={p} />}
      </Posed>
      {/* the cone, upright in her hand; she drops it once she sits */}
      {!sitting ? (
        <group position={hand}>
          <Cone radius={0.06} height={0.2} segments={8} position={[0, 0.06, 0]} rotation={[Math.PI, 0, 0]} color="#d9a35a" />
          {v < SCOOP_DROP ? <Ico radius={0.075} detail={1} position={[0, 0.2, 0]} color="#f6c3d2" /> : null}
        </group>
      ) : null}
      {/* the scoop falls, then lies flattened on the paving */}
      {v >= SCOOP_DROP ? (
        f.t < f.tLand ? (
          <Ico radius={0.075} detail={1} position={[cone0()[0], DECK + f.y, cone0()[2]]} color="#f6c3d2" />
        ) : (
          <group position={[cone0()[0], DECK + 0.012, cone0()[2]]}>
            <Cyl rTop={0.1} rBottom={0.13} height={0.024} segments={9} color="#f6c3d2" shadow={false} />
            {[0, 1, 2, 3].map((i) => (
              <Cyl key={i} rTop={0.03} rBottom={0.035} height={0.016} segments={6} position={[Math.cos(i * 1.7) * 0.2, -0.004, Math.sin(i * 1.7) * 0.2]} color="#f6c3d2" shadow={false} />
            ))}
          </group>
        )
      ) : null}
    </>
  );
};

// ---------- Juggler ----------

export const JUGGLER: V3 = [-3.6, DECK, 5.0];
const JUG_YAW = Math.PI - 0.25;
export const MISS = 11.75;
const BALL_R = 0.06;
const BALL_COLORS = ['#e6493b', '#f2c23a', '#3c8fd8'];

const jugArms = (v: number, phase: number) => {
  const drop = ramp(v, MISS + 0.3, MISS + 0.9);
  const bobL = v < MISS + 0.3 ? 0.12 * Math.sin(phase * Math.PI) : 0;
  const bobR = v < MISS + 0.3 ? -0.12 * Math.sin(phase * Math.PI) : 0;
  return {
    armL: [lerp(0.55, 0.15, drop), 0.12] as [number, number],
    armR: [lerp(0.55, 0.15, drop), -0.12] as [number, number],
    elbowL: lerp(0.95 + bobL, 0.3, drop),
    elbowR: lerp(0.95 + bobR, 0.3, drop),
  };
};

// Juggling tempo speeds up as gravity grows (same throw height, shorter flights).
const jugPhase = (v: number) => {
  let ph = 0;
  const n = Math.floor(Math.min(v, MISS) * FPS);
  for (let i = 0; i < n; i++) ph += 1 / FPS / (0.3 / Math.sqrt(gAt(i / FPS)));
  ph += (Math.min(v, MISS) - n / FPS) / (0.3 / Math.sqrt(gAt(Math.min(v, MISS))));
  return ph;
};

const jugHands = (v: number, phase: number) => {
  const a = jugArms(v, phase);
  return {L: handAt(JUGGLER, JUG_YAW, 1, -1, a.armL, a.elbowL), R: handAt(JUGGLER, JUG_YAW, 1, 1, a.armR, a.elbowR)};
};

// Ball j is thrown at phases 3n + j, alternating hands; 2.4 beats in the air, 0.6 in the hand.
const ballBeforeMiss = (v: number, j: number): V3 => {
  const ph = jugPhase(v);
  const hands = jugHands(v, ph);
  const k = Math.floor((ph - j) / 3);
  const local = ph - (3 * k + j);
  const fromLeft = (((3 * k + j) % 2) + 2) % 2 === 0;
  const A = fromLeft ? hands.L : hands.R;
  const B = fromLeft ? hands.R : hands.L;
  if (local < 2.4) {
    const u = local / 2.4;
    return [lerp(A[0], B[0], u), lerp(A[1], B[1], u) + 0.65 * 4 * u * (1 - u) + 0.05, lerp(A[2], B[2], u)];
  }
  return [B[0], B[1] + 0.05, B[2]];
};

const ballAt = (v: number, j: number): V3 => {
  if (v <= MISS) return ballBeforeMiss(v, j);
  const p0 = ballBeforeMiss(MISS, j);
  const p1 = ballBeforeMiss(MISS - 1 / FPS, j);
  const vel: V3 = [(p0[0] - p1[0]) * FPS, (p0[1] - p1[1]) * FPS, (p0[2] - p1[2]) * FPS];
  const gg = G0 * gAt(MISS);
  const t = v - MISS;
  const tLand = (vel[1] + Math.sqrt(vel[1] * vel[1] + 2 * gg * Math.max(0, p0[1] - DECK - BALL_R))) / gg;
  const tt = Math.min(t, tLand);
  // after landing the ball rolls a little and stops (no bounce)
  const roll = Math.max(0, t - tLand);
  const slide = 0.5 * (1 - Math.exp(-roll * 3));
  const dir = Math.atan2(vel[2], vel[0]) + j;
  return [
    p0[0] + vel[0] * tt + Math.cos(dir) * slide,
    Math.max(DECK + BALL_R, p0[1] + vel[1] * tt - 0.5 * gg * tt * tt),
    p0[2] + vel[2] * tt + Math.sin(dir) * slide,
  ];
};

export const ballLandTimes = () =>
  [0, 1, 2].map((j) => {
    const p0 = ballBeforeMiss(MISS, j);
    const p1 = ballBeforeMiss(MISS - 1 / FPS, j);
    const vy = (p0[1] - p1[1]) * FPS;
    const gg = G0 * gAt(MISS);
    return MISS + (vy + Math.sqrt(vy * vy + 2 * gg * Math.max(0, p0[1] - DECK - BALL_R))) / gg;
  });

const Juggler: React.FC<{v: number}> = ({v}) => {
  const ph = jugPhase(v);
  const arms = jugArms(v, ph);
  const look = ramp(v, MISS, MISS + 0.5);
  const st: Posture = {pos: JUGGLER, yaw: JUG_YAW, sit: sitK(v, 20.6), lie: lieK(v, 25.0)};
  return (
    <>
      <Posed st={st} pose={{...arms, head: [lerp(-0.25, 0.45, look), 0], mouth: look > 0.3 ? 0.4 : 0}}>
        {(p) => (
          <Person
            position={[0, 0, 0]}
            shirt="#7b4fc4"
            pants="#2c2f38"
            hair="#3b2a1e"
            pose={p}
            headExtra={
              <>
                <Cyl rTop={0.2} rBottom={0.2} height={0.03} segments={10} position={[0, 0.41, 0]} color="#22242a" />
                <Cyl rTop={0.13} rBottom={0.14} height={0.24} segments={10} position={[0, 0.545, 0]} color="#22242a" />
                <Cyl rTop={0.141} rBottom={0.141} height={0.05} segments={10} position={[0, 0.455, 0]} color="#e6493b" />
              </>
            }
          />
        )}
      </Posed>
      {[0, 1, 2].map((j) => (
        <Ico key={j} radius={BALL_R} detail={1} position={ballAt(v, j)} color={BALL_COLORS[j]} />
      ))}
    </>
  );
};

// ---------- Kid on a trampoline ----------

export const TRAMP: V3 = [-10.5, DECK, 6.4];
const TRAMP_H = 0.75;
const MAT_TOP = TRAMP_H - 0.015;
const KID_S = 0.6;
const CONTACT = 0.26;
const BOUNCE_END = 15.9;

// Height of the kid's feet above the mat (negative while pressing the mat down).
// Each takeoff has the same push; gravity decides how high it gets.
export const kidJump = (v: number) => {
  const v0 = Math.sqrt(2 * G0 * 1.15);
  let t = 0;
  while (t < Math.min(v, BOUNCE_END)) {
    const gg = G0 * gAt(t);
    const push = v0 * Math.max(0.3, 1 - 1.1 * (gAt(t) - 1)); // tired legs push less
    const air = (2 * push) / gg;
    if (v < t + air) {
      const a = v - t;
      return {h: push * a - 0.5 * gg * a * a, air: true};
    }
    t += air;
    if (v < t + CONTACT) return {h: -0.22 * Math.sin((Math.PI * (v - t)) / CONTACT), air: false};
    t += CONTACT;
  }
  return {h: 0, air: false};
};

const Trampoline: React.FC<{v: number}> = ({v}) => {
  const j = kidJump(v);
  const press = j.h < 0 ? -j.h : 0;
  const st: Posture = {pos: [TRAMP[0], TRAMP[1] + MAT_TOP + 0.015 + Math.max(j.h, -press), TRAMP[2]], yaw: Math.PI + 0.5, scale: KID_S, sit: sitK(v, 16.6), lie: lieK(v, 24.8)};
  const armsUp = j.air ? clamp01(j.h / 0.4) : 0;
  return (
    <>
      <group position={TRAMP}>
        <mesh position={[0, TRAMP_H, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <torusGeometry args={[1.5, 0.08, 6, 20]} />
          <meshStandardMaterial color="#2f8fd8" flatShading roughness={0.8} />
        </mesh>
        <Cyl rTop={1.42} rBottom={1.42} height={0.03} segments={20} position={[0, TRAMP_H - 0.03 - press * 0.8, 0]} color="#25272c" />
        {Array.from({length: 6}, (_, i) => (
          <Cyl key={i} rTop={0.04} rBottom={0.04} height={TRAMP_H - 0.06} segments={5} position={[Math.cos((i / 6) * Math.PI * 2) * 1.5, (TRAMP_H - 0.06) / 2, Math.sin((i / 6) * Math.PI * 2) * 1.5]} color="#3a3d44" />
        ))}
      </group>
      <Posed st={st} pose={{armL: [2.3 * armsUp, 0.06 - 0.55 * armsUp], armR: [2.3 * armsUp, -0.06 + 0.55 * armsUp], head: [-0.2, 0], mouth: 0.3}}>
        {(p) => <Person position={[0, 0, 0]} shirt="#f2b33a" pants="#3c8fd8" hair="#3b2a1e" child pose={p} />}
      </Posed>
    </>
  );
};

// ---------- Dad holding his son up ----------

export const DAD: V3 = [1.6, DECK, 8.4];
const DAD_YAW = Math.PI + 0.15;
const SON_S = 0.55;
const LOWER0 = 16.5;
const LOWER1 = 17.9;

const dadArms = (v: number) => {
  const k = ramp(v, LOWER0, LOWER1);
  const rest = ramp(v, LOWER1 + 0.2, LOWER1 + 0.8);
  const pitch = lerp(lerp(2.45, 0.75, k), 0.1, rest);
  const roll = lerp(0.2, 0.08, k);
  return {armL: [pitch, roll] as [number, number], armR: [pitch, -roll] as [number, number], elbowL: 0.15 + 0.6 * k * (1 - rest), elbowR: 0.15 + 0.6 * k * (1 - rest)};
};

const Dad: React.FC<{v: number}> = ({v}) => {
  const arms = dadArms(v);
  const hL = handAt(DAD, DAD_YAW, 1, -1, arms.armL, arms.elbowL);
  const hR = handAt(DAD, DAD_YAW, 1, 1, arms.armR, arms.elbowR);
  const mid: V3 = [(hL[0] + hR[0]) / 2, (hL[1] + hR[1]) / 2, (hL[2] + hR[2]) / 2];
  const fwd: V3 = [Math.sin(DAD_YAW), 0, Math.cos(DAD_YAW)];
  const right: V3 = [Math.cos(DAD_YAW), 0, -Math.sin(DAD_YAW)];
  // held up: the son's torso sits between the hands, a little forward of them
  const heldPos: V3 = [mid[0] + fwd[0] * 0.2, Math.max(DECK, mid[1] - 1.22 * SON_S), mid[2] + fwd[2] * 0.2];
  // put down beside his dad, so they never overlap when they lie down
  const sonGround: V3 = [DAD[0] + right[0] * 0.8 + fwd[0] * 0.3, DECK, DAD[2] + right[2] * 0.8 + fwd[2] * 0.3];
  const k2 = ramp(v, LOWER0 + 0.6, LOWER1);
  const sonPos: V3 = [lerp(heldPos[0], sonGround[0], k2), lerp(heldPos[1], DECK, k2 * k2), lerp(heldPos[2], sonGround[2], k2)];
  const dadSt: Posture = {pos: DAD, yaw: DAD_YAW, sit: sitK(v, 21.6), lie: lieK(v, 25.6)};
  const sonSt: Posture = {pos: sonPos, yaw: DAD_YAW, scale: SON_S, sit: sitK(v, 21.9), lie: lieK(v, 25.8)};
  const happy = 1 - ramp(v, LOWER0 - 0.3, LOWER0 + 0.4);
  return (
    <>
      <Posed st={dadSt} pose={{...arms, head: [-0.45 * happy, 0], mouth: 0.25 * happy}}>
        {(p) => <Person position={[0, 0, 0]} shirt="#3c8f6a" pants="#4a5568" hair="#5a3d26" pose={p} headExtra={<Box size={[0.3, 0.1, 0.06]} position={[0, 0.08, 0.16]} color="#5a3d26" shadow={false} />} />}
      </Posed>
      <Posed st={sonSt} pose={{armL: [2.2 * happy, 0.06 - 0.6 * happy], armR: [2.2 * happy, -0.06 + 0.6 * happy], legL: 0.25 * happy, legR: 0.1 * happy, mouth: 0.5 * happy, head: [0.1 * happy, 0]}}>
        {(p) => <Person position={[0, 0, 0]} shirt="#e6493b" pants="#2f6fd0" hair="#c98a4a" child pose={p} />}
      </Posed>
    </>
  );
};

// ---------- Woman with a dog ----------

export const WOMAN0: V3 = [-27, DECK, 7.4];
const WALK_STOP = 14.6;
export const womanX = (v: number) => {
  // eases in and out: 0.8 m/s, slowing to a stop
  const t = Math.min(v, WALK_STOP);
  const slow = Math.max(0, t - (WALK_STOP - 1.5));
  return WOMAN0[0] + 0.8 * t - 0.8 * (slow * slow) / 3;
};

const Woman: React.FC<{v: number}> = ({v}) => {
  const x = womanX(v);
  const moving = clamp01((WALK_STOP - v) / 1.2);
  const phase = (x - WOMAN0[0]) * 3.2;
  const pos: V3 = [x, DECK, WOMAN0[2]];
  const st: Posture = {pos, yaw: Math.PI / 2 + 0.6 * (1 - moving), sit: sitK(v, 22.2), lie: lieK(v, 26.0)};
  const walk = walkPose(phase, moving);
  const dogDown = ramp(v, 22.6, 23.6);
  const dogPos: V3 = [x + 1.4, DECK - 0.3 * dogDown, WOMAN0[2] - 0.9];
  const leashHand = st.sit > 0 ? null : handAt(pos, st.yaw, 1, 1, walk.armR ?? [0, -0.06], 0.4);
  return (
    <>
      <Posed st={st} pose={{...walk, elbowR: 0.4}}>
        {(p) => <Person position={[0, 0, 0]} shirt="#f2d36b" pants="#6b5a8a" hair="#2a1d14" longHair pose={p} />}
      </Posed>
      <group position={dogPos} scale={[1, 1 - 0.15 * dogDown, 1]}>
        <Dog position={[0, 0, 0]} rotation={Math.PI / 2 - 0.3 * (1 - moving)} pose={{legPhase: phase * 1.3 * moving, tail: Math.sin(v * 8) * 0.5 * (1 - dogDown), head: 0.2 * dogDown, tongue: dogDown}} />
      </group>
      {leashHand ? <Rope from={leashHand} to={[dogPos[0] + 0.4, dogPos[1] + 0.7, dogPos[2]]} /> : null}
    </>
  );
};

// ---------- Other people on the promenade ----------

const WALKERS: {x0: number; z: number; dir: 1 | -1; speed: number; stop: number; sit: number; lie: number; shirt: string; pants: string; hair: string; long?: boolean}[] = [
  {x0: 22, z: 3.4, dir: -1, speed: 1.0, stop: 16.4, sit: 20.9, lie: 25.2, shirt: '#2f8fd8', pants: '#3a3d44', hair: '#2a1d14'},
  {x0: -30, z: 3.0, dir: 1, speed: 0.9, stop: 17.2, sit: 21.4, lie: 25.9, shirt: '#e86a5a', pants: '#e9e2cf', hair: '#c98a4a', long: true},
  {x0: 18, z: 8.0, dir: -1, speed: 0.7, stop: 15.8, sit: 22.0, lie: 26.3, shirt: '#ffffff', pants: '#4a6fa8', hair: '#7b5434'},
];

const Walkers: React.FC<{v: number}> = ({v}) => (
  <>
    {WALKERS.map((w, i) => {
      const t = Math.min(v, w.stop);
      const slow = Math.max(0, t - (w.stop - 1.5));
      const dist = w.speed * t - (w.speed * slow * slow) / 3;
      const moving = clamp01((w.stop - v) / 1.2);
      const pos: V3 = [w.x0 + w.dir * dist, DECK, w.z];
      const yaw = lerp((w.dir * Math.PI) / 2, w.dir * Math.PI, 1 - moving);
      const st: Posture = {pos, yaw, sit: sitK(v, w.sit), lie: lieK(v, w.lie)};
      return (
        <Posed key={i} st={st} pose={walkPose(dist * 3.2, moving)}>
          {(p) => <Person position={[0, 0, 0]} shirt={w.shirt} pants={w.pants} hair={w.hair} longHair={w.long} pose={p} />}
        </Posed>
      );
    })}
  </>
);

export const Cast: React.FC<{v: number}> = ({v}) => {
  // nobody is shown once the gravity could hurt them
  if (v > 37.5) return null;
  return (
    <>
      <Girl v={v} />
      <Juggler v={v} />
      <Trampoline v={v} />
      <Dad v={v} />
      <Woman v={v} />
      <Walkers v={v} />
    </>
  );
};
