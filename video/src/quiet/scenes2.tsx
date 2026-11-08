import React from 'react';
import {Human, HumanPose} from '../bear/People';
import {ARTEM, SCREAMER, SONYA, Box, HearingAid, dead, deadIdle, deadWalk} from './Chars';
import {PharmacyIn, PX, COUNTER_Z, WIN_Z} from './Pharmacy';
import {BACK, BACKWIN, D, DOOR, F1, F2, FRONT, HATCH, RADIO, SHED_ROOF_TOP, THREAD_PTS, W} from './House';
import {HOUSE} from './Town';
import {Hammer, Note, OpenCan} from './Props';
import {Scene, Street, ease, ease5, follow, mv, walkTo} from './common';
import {HAMMER, V3, clamp01, lerp, shotLen, tIn} from './cues';
import {House} from './House';

// Scenes 3–5: Соня in the pharmacy, the detour, the note, getting the house ready.

const HX = HOUSE[0];
const HZ = HOUSE[2];
export const H = (p: V3): V3 => [HX + p[0], p[1], HZ + p[2]];
const P = (p: V3): V3 => [PX[0] + p[0], PX[1] + p[1], PX[2] + p[2]];

// low cold light for dark rooms: enough to read faces, nothing warm
export const DarkRoom: React.FC<{bg?: string; k?: number; moon?: V3; target?: V3}> = ({bg = '#070a14', k = 1, moon, target}) => (
  <>
    <color attach="background" args={[bg]} />
    <fog attach="fog" args={[bg, 8, 30]} />
    <hemisphereLight color="#7084c0" groundColor="#14161e" intensity={0.95 * k} />
    {moon ? (
      <directionalLight position={moon} target-position={target ?? [0, 0, 0]} color="#a8bcff" intensity={1.3 * k} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-bias={-0.0006} />
    ) : null}
  </>
);

// hiding under the counter: knees up, arms around them
export const hidePose = (v: number, extra: HumanPose = {}): HumanPose => ({
  sit: 1,
  legL: -0.55,
  legR: -0.5,
  kneeL: 1.2,
  kneeR: 1.15,
  lean: 0.25,
  armL: [-1.0, -0.05, 0.25],
  armR: [-1.0, -0.05, 0.25],
  elbowL: -1.0,
  elbowR: -1.0,
  head: [0.1 + 0.02 * Math.sin(v * 1.3), 0, 0],
  face: {wide: 0.4, browIn: 0.3, mouth: 0},
  ...extra,
});
// crouching on one's heels
export const crouchPose = (extra: HumanPose = {}): HumanPose => ({
  sit: 1,
  legL: -0.75,
  legR: -0.35,
  kneeL: 1.6,
  kneeR: 1.3,
  lean: 0.45,
  armL: [-0.6, 0.1, 0],
  armR: [-0.4, 0.05, 0],
  elbowL: -0.6,
  elbowR: -0.5,
  ...extra,
});

// ---------------------------------------------------------------- 6. the pharmacy
const SONYA_AT: V3 = P([-0.4, -0.3, COUNTER_Z - 0.35]);
const ARTEM_AT: V3 = P([0.85, -0.2, COUNTER_Z - 0.75]);
export const pharmacyScene: Scene = {
  view: (v) => {
    const t = tIn('pharmacy', v);
    const L = shotLen('pharmacy');
    // first: low behind Артём, finding her under the counter; then over her shoulder towards the window
    if (t < L * 0.55) return follow(t, 0, L * 0.55, P([1.2, 0.75, -1.4]), P([0.95, 0.6, -1.0]), P([-0.4, 0.55, COUNTER_Z - 0.3]), [40, 34], 820);
    return mv(t, L * 0.55, L, P([0.35, 1.05, -1.95]), P([0.2, 1.1, -1.8]), P([0.25, 0.9, WIN_Z]), P([0.1, 1.0, WIN_Z]), 52);
  },
  render: (v) => {
    const t = tIn('pharmacy', v);
    const L = shotLen('pharmacy');
    // she grabs his sleeve and points at the window: a shadow passes outside
    const grab = ease(t, L * 0.4, L * 0.5);
    const point = ease(t, L * 0.52, L * 0.62);
    const passer = walkTo(t, L * 0.5, L * 1.05, P([-4.5, 0, WIN_Z + 1.6]), P([3.5, 0, WIN_Z + 1.8]), 0.5);
    const sPose = hidePose(v, {
      armR: [lerp(-1.0, -1.45, Math.max(grab, point)), lerp(-0.05, 0.1, point), lerp(0.25, -0.2, point)],
      elbowR: lerp(-1.0, -0.15, point),
      head: [lerp(0.1, -0.1, point), lerp(0, -0.6, point), 0],
      face: {wide: 0.4 + 0.5 * point, browIn: 0.35, look: [-0.2 * point, 0.1 * point]},
    });
    const aPose = crouchPose({head: [0.15 - 0.2 * point, -0.7 * point, 0], face: {brow: 0.1 * point, wide: 0.5 * point}});
    return (
      <>
        <DarkRoom k={1.1} moon={P([3, 6, 8])} target={P([0, 0, 0])} />
        <PharmacyIn v={v} />
        <Human o={SONYA} position={SONYA_AT} rotation={Math.PI * 0.85} pose={sPose} head={<HearingAid />} />
        <Human o={ARTEM} position={ARTEM_AT} rotation={-Math.PI * 0.3} pose={aPose} />
        <Human o={dead(2)} position={passer.p} rotation={passer.yaw} pose={deadWalk(passer.ph, v, 2)} />
        <pointLight position={P([0.3, 1.6, -0.6])} color="#9fb4ff" intensity={1.4} distance={4} decay={1.6} />
        <pointLight position={P([0.5, 2.6, WIN_Z + 2.6])} color="#c8d4ff" intensity={7} distance={6} decay={1.4} />
      </>
    );
  },
};

// ---------------------------------------------------------------- 7. the detour: a screamer at the crossing
const SCR_AT: V3 = [2.0, 0.0, -1.2];
const WALK_A: V3 = [12.5, 0.14, -5.4];
const WALK_B: V3 = [6.8, 0.14, -5.4];
export const detourScene: Scene = {
  view: (v) => {
    const t = tIn('detour', v);
    const L = shotLen('detour');
    return mv(t, 0, L, [16.5, 2.2, -3.0], [15.0, 2.6, -3.6], [7, 1.2, -4], [4, 1.0, -3], 44, 0.3);
  },
  render: (v) => {
    const t = tIn('detour', v);
    const L = shotLen('detour');
    // they walk towards the crossing; she sees him first, grabs the sleeve; they back off into the yard gap
    const stop = L * 0.38;
    const w = walkTo(t, 0, stop, WALK_A, WALK_B, 0.62);
    const back = ease(t, L * 0.55, L * 0.95);
    const yard: V3 = [6.4, 0.14, -7.2];
    const pA: V3 = t < stop ? w.p : [lerp(WALK_B[0], yard[0] + 0.4, back), 0.14, lerp(WALK_B[2], yard[2], back)];
    const pS: V3 = [pA[0] + 0.7, 0.14, pA[2] - 0.35];
    const grab = ease(t, L * 0.38, L * 0.48);
    const turnAway = ease(t, L * 0.5, L * 0.62);
    const yawA = lerp(-Math.PI / 2, Math.PI * 0.75, turnAway);
    const walkA: HumanPose = t < stop ? {} : {};
    return (
      <Street v={v} center={[6, 0, -3]} lamps={[8]} box={12} cam={[15.5, 2.4, -3.3]}>
        <Human o={ARTEM} position={pA} rotation={yawA} pose={{...walkA, head: [0, 0.2 * grab, 0]}} />
        <Human
          o={SONYA}
          position={pS}
          rotation={lerp(-Math.PI / 2, Math.PI * 0.8, turnAway)}
          pose={{armL: [-1.2 * grab, 0.1, -0.3 * grab], elbowL: -0.3, head: [0, 0, 0], face: {wide: 0.8 * grab, browIn: 0.4}}}
          head={<HearingAid />}
        />
        <Human o={SCREAMER} position={SCR_AT} rotation={Math.PI * 0.6} pose={deadIdle(v, 8)} />
      </Street>
    );
  },
};

// ---------------------------------------------------------------- 8. upstairs: the note in the box
export const noteScene: Scene = {
  view: (v) => {
    const t = tIn('note', v);
    const L = shotLen('note');
    const n = H([RADIO[0] - 0.1, F2 + 0.42, RADIO[2] + 0.28]);
    return mv(t, 0, L, H([RADIO[0] - 0.9, F2 + 1.4, RADIO[2] + 1.2]), H([RADIO[0] - 0.5, F2 + 1.0, RADIO[2] + 0.75]), n, n, [44, 36], 0.1);
  },
  render: (v) => {
    const t = tIn('note', v);
    const open = ease(t, 0.2, 1.2);
    const lift = ease(t, 1.6, 2.6);
    return (
      <>
        <DarkRoom k={1.15} />
        <House position={HOUSE} s={{v, stairs: 1, noRoof: true}} />
        <Box position={H([RADIO[0] + 0.35, F2 + 0.39, RADIO[2] + 0.05])} open={open} />
        <Note position={H([RADIO[0] - 0.1, F2 + 0.4 + 0.05 * lift, RADIO[2] + 0.28])} rotation={[-Math.PI / 2 + 0.9 * lift, 0, 0.15]} scale={1.1} />
        <Human o={ARTEM} position={H([RADIO[0] + 0.65, F2, RADIO[2] + 0.95])} rotation={Math.PI + 0.3} pose={{lean: 0.35, head: [0.5, 0, 0], armL: [-0.9, 0.1, 0.2], armR: [-0.9, 0.1, 0.2], elbowL: -0.6, elbowR: -0.6, face: {brow: 0.1}}} />
        <pointLight position={H([RADIO[0] - 0.3, F2 + 1.3, RADIO[2] + 0.6])} color="#a8bcff" intensity={1.4} distance={3} decay={1.6} />
      </>
    );
  },
};

// ---------------------------------------------------------------- 9. getting ready (one quick shot each)

// a tiny progress inside a prep shot
const pk = (name: 'pWater' | 'pDoor' | 'pWin' | 'pLadder' | 'pThread' | 'pExit' | 'pFood', v: number) => clamp01(tIn(name, v) / shotLen(name));

export const pWaterScene: Scene = {
  view: (v) => {
    const k = pk('pWater', v);
    const tub = H([2.3, F1 + 0.5, -1.9]);
    return mv(k, 0, 1, H([0.0, F1 + 1.8, 0.6]), H([0.3, F1 + 1.6, 0.3]), H([2.5, F1 + 0.7, -1.4]), H([2.5, F1 + 0.7, -1.4]), 44);
  },
  render: (v) => {
    const k = pk('pWater', v);
    return (
      <>
        <DarkRoom k={1.2} />
        <House position={HOUSE} s={{v, tub: 0.3 + 0.6 * k, buckets: k, noRoof: true}} />
        {/* the tap running */}
        <mesh position={H([2.9, F1 + 0.75, -2.2])}>
          <cylinderGeometry args={[0.012, 0.012, 0.42, 8]} />
          <meshStandardMaterial color="#9ac8f0" transparent opacity={0.6} roughness={0.1} />
        </mesh>
        <Human o={ARTEM} position={H([2.7, F1, -0.85])} rotation={Math.PI + 0.3} pose={{lean: 0.5, armL: [-1.0, 0.1, 0], armR: [-1.0, 0.1, 0], elbowL: -0.3, elbowR: -0.3, kneeL: 0.3, kneeR: 0.3, head: [0.4, 0, 0]}} />
        <pointLight position={H([1.5, F1 + 1.8, -1.0])} color="#a8bcff" intensity={2} distance={4} decay={1.6} />
      </>
    );
  },
};

export const pDoorScene: Scene = {
  view: (v) => {
    const k = pk('pDoor', v);
    const door = H([0, F1 + 1.1, FRONT - 0.3]);
    return mv(k, 0, 1, H([-1.6, F1 + 1.5, FRONT - 2.4]), H([-1.2, F1 + 1.4, FRONT - 2.0]), door, door, 50);
  },
  render: (v) => {
    const k = pk('pDoor', v);
    // hits only on the wind gusts (HAMMER cues); the wardrobe slides in at the end
    const hit = HAMMER.reduce((a, h) => a + Math.max(0, 1 - Math.abs(v - h) * 6), 0);
    return (
      <>
        <DarkRoom k={1.2} />
        <House position={HOUSE} s={{v, doorBoards: Math.min(1, k * 1.6), wardrobe: ease(k, 0.65, 0.95), noRoof: true}} />
        <Human
          o={ARTEM}
          position={H([-0.75, F1, FRONT - 0.75])}
          rotation={Math.PI * 0.15}
          pose={{armR: [-1.6 - 0.9 * (1 - hit), 0.2, 0], elbowR: -0.5, armL: [-1.2, -0.2, 0.3], elbowL: -0.4, head: [-0.1, 0, 0]}}
          handR={<Hammer position={[0, -0.02, 0.05]} rotation={[Math.PI / 2, 0, 0]} />}
        />
        <pointLight position={H([-0.4, F1 + 2.0, FRONT - 1.4])} color="#a8bcff" intensity={2.2} distance={4} decay={1.6} />
      </>
    );
  },
};

export const pWinScene: Scene = {
  view: (v) => {
    const k = pk('pWin', v);
    const win = H([0, 4.45, FRONT - 0.2]);
    return mv(k, 0, 1, H([0.9, F2 + 1.5, FRONT - 2.2]), H([0.6, F2 + 1.45, FRONT - 1.8]), win, win, 48);
  },
  render: (v) => {
    const k = pk('pWin', v);
    return (
      <>
        <DarkRoom k={1.2} />
        <House position={HOUSE} s={{v, upBoards: Math.min(1, k * 1.5), blankets: ease(k, 0.55, 0.95), stairs: 1, noRoof: true}} />
        <Human o={ARTEM} position={H([-0.6, F2, FRONT - 0.8])} rotation={Math.PI * 0.1} pose={{armL: [-2.3, 0.1, 0], armR: [-2.2, -0.1, 0], elbowL: -0.3, elbowR: -0.3, head: [-0.3, 0, 0]}} />
        <pointLight position={H([0.2, F2 + 1.8, FRONT - 1.6])} color="#a8bcff" intensity={2} distance={4} decay={1.6} />
        {/* the street lamp leaking through the gaps before the blankets go up */}
        <pointLight position={H([0, 4.45, FRONT + 1.2])} color="#ffcf8a" intensity={3 * (1 - ease(k, 0.55, 0.95))} distance={4} decay={1.6} />
      </>
    );
  },
};

export const pLadderScene: Scene = {
  view: (v) => {
    const k = pk('pLadder', v);
    const hatch = H([(HATCH[0] + HATCH[1]) / 2, F2 - 0.2, (HATCH[2] + HATCH[3]) / 2]);
    return mv(k, 0, 1, H([-0.2, F1 + 1.2, 1.6]), H([-0.5, F1 + 1.35, 1.2]), H([-2.8, F1 + 1.5, -1.6]), H([-2.8, F1 + 1.7, -2.2]), 50);
  },
  render: (v) => {
    const k = pk('pLadder', v);
    return (
      <>
        <DarkRoom k={1.25} />
        <House position={HOUSE} s={{v, stairs: 1 - ease(k, 0.05, 0.5), ladder: ease(k, 0.45, 0.7) * (1 - ease(k, 0.78, 1.0)), noRoof: true, doorBoards: 1, wardrobe: 1}} />
        <Human o={ARTEM} position={H([-1.6, F1, -0.9])} rotation={-2.49} pose={{armR: [-0.4, 0.1, 0.1], elbowR: -0.3, head: [-0.35, 0, 0], face: {brow: 0.1}}} handR={<Hammer />} />
        <pointLight position={H([-1.8, F1 + 2.2, -0.5])} color="#a8bcff" intensity={2.2} distance={5} decay={1.6} />
      </>
    );
  },
};

export const pThreadScene: Scene = {
  view: (v) => {
    const k = pk('pThread', v);
    const c = H([-2.5, F2 + 0.45, 1.1]);
    return mv(k, 0, 1, H([-1.2, F2 + 1.2, 2.3]), H([-1.5, F2 + 1.0, 2.0]), c, c, 42);
  },
  render: (v) => {
    const k = pk('pThread', v);
    const sitAt = H([-2.6, F2 - 0.23, 1.25]);
    return (
      <>
        <DarkRoom k={1.25} />
        <House position={HOUSE} s={{v, stairs: 0, ladder: 0, thread: ease(k, 0, 0.6), noRoof: true, doorBoards: 1, wardrobe: 1, blankets: 1, upBoards: 1}} />
        <Human o={SONYA} position={sitAt} rotation={Math.PI * 0.6} pose={{sit: 1, kneeL: -1.3, kneeR: -1.2, armR: [-1.1, 0.25, -0.2], elbowR: -0.9, armL: [-1.1, 0.1, 0.4], elbowL: -0.9, head: [0.45, 0.15, 0], face: {browIn: 0.2, look: [0, -0.2]}}} head={<HearingAid />} />
        <pointLight position={H([-1.7, F2 + 1.5, 1.4])} color="#a8bcff" intensity={1.8} distance={3.5} decay={1.6} />
      </>
    );
  },
};

export const pExitScene: Scene = {
  view: (v) => {
    const k = pk('pExit', v);
    const win = H([(BACKWIN[0] + BACKWIN[1]) / 2, (BACKWIN[2] + BACKWIN[3]) / 2, BACK]);
    return mv(k, 0, 1, H([4.8, 2.4, BACK - 5.4]), H([4.2, 2.8, BACK - 4.8]), H([1.8, 3.4, BACK - 0.6]), win, 44, 0.3);
  },
  render: (v) => {
    const k = pk('pExit', v);
    const open = ease(k, 0.1, 0.45);
    return (
      <Street v={v} center={H([1.8, 0, BACK - 1.5])} lamps={[]} box={8} cam={H([4.5, 2.6, BACK - 5])} house={{backOpen: open, blankets: 1, upBoards: 1, stairs: 0}}>
        {/* Артём leans out of the window and looks down at the shed roof */}
        <Human o={ARTEM} position={H([1.8, F2, BACK + 0.55])} rotation={Math.PI} pose={{lean: 0.5 * open, head: [0.5 * open, 0, 0], armL: [-0.8, 0.2, 0], armR: [-0.8, 0.2, 0], elbowL: -0.4, elbowR: -0.4}} />
        <pointLight position={H([1.8, SHED_ROOF_TOP + 1.2, BACK - 1.4])} color="#a8bcff" intensity={2.4} distance={5} decay={1.6} />
      </Street>
    );
  },
};

export const pFoodScene: Scene = {
  view: (v) => {
    const k = pk('pFood', v);
    const c = H([-2.4, F2 + 0.7, 1.0]);
    return mv(k, 0, 1, H([-0.9, F2 + 1.25, -0.2]), H([-1.15, F2 + 1.1, 0.05]), c, c, 46);
  },
  render: (v) => {
    const k = pk('pFood', v);
    const chew = Math.max(0, Math.sin(v * 8)) * 0.3;
    return (
      <>
        <DarkRoom k={1.15} />
        <House position={HOUSE} s={{v, stairs: 0, thread: 1, blankets: 1, upBoards: 1, doorBoards: 1, wardrobe: 1, noRoof: true}} />
        <Human o={SONYA} position={H([-2.65, F2 - 0.23, 1.25])} rotation={Math.PI * 0.55} pose={{sit: 1, kneeL: -1.25, kneeR: -1.1, armR: [-1.3, 0.1, 0.2], elbowR: -1.4, armL: [-0.9, 0.1, 0.3], elbowL: -1.2, head: [0.25, 0, 0], face: {mouth: chew, browIn: 0.15}}} head={<HearingAid />} handL={<OpenCan position={[0, -0.05, 0.03]} />} />
        <Human o={ARTEM} position={H([-1.7, F2 - 0.39, 1.85])} rotation={-Math.PI * 0.62} pose={{sit: 1, legL: -0.6, kneeL: 0.2, kneeR: -1.2, armR: [-1.1, 0.1, 0.2], elbowR: -1.5, head: [0.15, -0.3, 0], face: {mouth: chew * 0.6 + 0.0 * k}}} handR={<OpenCan position={[0, -0.05, 0.03]} />} />
        <pointLight position={H([-1.6, F2 + 1.7, 1.4])} color="#a8bcff" intensity={1.6} distance={3.5} decay={1.6} />
      </>
    );
  },
};

export {W, D, DOOR};
