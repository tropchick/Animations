import {View, handheld} from '../slime/camera';
import {BRAKE, DEPART, Shot, V3, lerp, lerp3, ramp, shotAt, shotEnd, shotStart, smooth} from './cues';
import {STOP_DIST, busDist} from './action';

export type {View};

const move = (v: number, t0: number, t1: number, a: V3, b: V3, ta: V3, tb: V3, fov: number | [number, number], extra: Partial<View> = {}): View => {
  const k = smooth(ramp(v, t0, t1));
  return {pos: lerp3(a, b, k), target: lerp3(ta, tb, k), fov: typeof fov === 'number' ? fov : lerp(fov[0], fov[1], k), ...extra};
};

// cut points inside shots
export const CUTS = {
  girlShock: 19.95, // the girl's face after «Выхожу, милок»
};

export const TITLE_VIEW: View = {pos: [0.6, 1.7, 0.8], target: [-0.13, 1.64, 3.2], fov: 44};

const SHOTS: Record<Shot, (v: number) => View> = {
  // past the girl's head (left edge of the frame): he stares straight at her
  title: (v) => move(v, 0, shotEnd('title'), TITLE_VIEW.pos, [0.56, 1.7, 1.0], TITLE_VIEW.target, [-0.12, 1.66, 3.2], [44, 41]),
  // her face, from his eyes
  girl: (v) => move(v, shotStart('girl'), shotEnd('girl'), [0.0, 1.68, 2.92], [0.0, 1.66, 2.72], [0, 1.58, 1.75], [0, 1.57, 1.75], [50, 46]),
  // his face: the bus brakes, she steps aside, his eyes do not move
  brake: (v) => move(v, shotStart('brake'), shotEnd('brake'), [0.36, 1.6, 2.02], [0.32, 1.61, 2.12], [0, 1.67, 3.2], [0, 1.68, 3.2], 44),
  // over his left shoulder: she steps away and turns round; behind her, the grandma
  step: (v) => move(v, shotStart('step'), shotEnd('step'), [-0.44, 1.86, 4.15], [-0.42, 1.84, 4.0], [-0.4, 1.47, -0.1], [-0.42, 1.46, -0.25], [42, 40]),
  // the reveal in slow motion: a slow push and a little arc onto her
  reveal: (v) => move(v, shotStart('reveal'), shotEnd('reveal'), [0.38, 1.56, 1.8], [0.1, 1.5, 1.25], [0.02, 1.45, -0.3], [0.0, 1.46, -0.3], [34, 31]),
  // his face again: he is in love
  smitten: (v) => move(v, shotStart('smitten'), shotEnd('smitten'), [0.07, 1.64, 1.95], [0.04, 1.67, 2.12], [0, 1.68, 3.2], [0, 1.69, 3.2], 42),
  // from the platform beside her: he walks up the aisle towards her
  approach: (v) => move(v, shotStart('approach'), shotEnd('approach'), [-0.55, 1.48, -0.05], [-0.5, 1.5, 0.05], [0.05, 1.45, 2.2], [0.05, 1.5, 1.1], [46, 44]),
  // her view of him, low: «Девушка… вы на следующей выходите?»
  ask: (v) => move(v, shotStart('ask'), shotEnd('ask'), [0.13, 1.4, 0.0], [0.1, 1.43, 0.1], [0, 1.66, 0.95], [0, 1.67, 0.95], [52, 46]),
  // her close-up: «Выхожу, милок»; then the girl's face
  answer: (v) => {
    if (v < CUTS.girlShock) return move(v, shotStart('answer'), CUTS.girlShock, [0.52, 1.56, 1.05], [0.46, 1.54, 0.95], [0, 1.46, -0.3], [0, 1.47, -0.3], [46, 40]);
    return move(v, CUTS.girlShock, shotEnd('answer'), [-0.97, 1.62, 0.72], [-0.97, 1.62, 0.78], [-0.62, 1.6, 1.75], [-0.62, 1.6, 1.75], 44);
  },
  // wide from up the aisle: she gets up, he takes her bag and leads her to the door
  exit: (v) => move(v, shotStart('exit'), shotEnd('exit'), [-0.25, 1.8, 4.1], [-0.08, 1.76, 3.7], [0.25, 1.05, 0.3], [0.95, 1.05, 1.05], [48, 46]),
  // outside on the kerb, looking in through the open door at the girl; they walk out across the frame;
  // the doors close, the bus leaves
  end: (v) => {
    const rel = busDist(v) - STOP_DIST; // the bus moves +z: in bus coordinates the kerb camera drifts back
    const view = move(v, shotStart('end'), shotEnd('end'), [3.1, 1.52, 0.88], [2.95, 1.52, 0.9], [-0.62, 1.45, 1.75], [-0.62, 1.47, 1.75], [36, 33]);
    return {...view, pos: [view.pos[0], view.pos[1], view.pos[2] - rel], target: [view.target[0], view.target[1], view.target[2] - rel * 0.3]};
  },
};

const SHAKES: [number, number][] = [
  [BRAKE + 0.85, 0.9],
  [BRAKE, 0.3],
  [DEPART, 0.25],
];

export const viewAt = (v: number): View => {
  const s = shotAt(v);
  const view = SHOTS[s.name](v);
  // the reveal is the slow, smooth "movie" shot: no handheld
  if (s.name === 'reveal') return {...view, near: 0.02};
  return handheld(view, v, SHAKES);
};
