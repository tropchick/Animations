import React from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {Backpack, Bear, BearPose, HardHat} from './Bear';
import {ANYA, Human, HumanPose, MANAGER, MOM, walkPose} from './People';
import {AnyaRoom, Den, DenInside, Office, River} from './Sets';
import {Chair, Coin, HoneyJar, InkPad, MoneySack, Parcel, Phone, PhoneScreen, Pic, Plate, Pot, RingLight, Sawdust} from './Props';
import {Ball, Cyl, Glow, RBox} from './kit';
import {drawContract, drawViews} from './tex';
import {COUNT, DIP, HAMMER, LADLE, LIFT, LIGHTS, POINT, RIP, SACK, SLIDE, STAMP, V3, beatAt, lerp, lerp3, lip, ramp, rnd, shotEnd, shotStart, smooth} from './cues';
import {Scene, aim, blink, chatter, ease, ease5, follow, local, mv, orbit, yawTo} from './common';
import {at, bearArmTo, bearHand, bearHead, bearTorso, dirOf, humanHand, humanHead, humanTorso, inside} from './rig';
import {ForestWorld} from './scenes1';
import type {View} from '../slime/camera';

const S = shotStart;
const E = shotEnd;
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const NOPACK = {...ANYA, backpack: false};

// the thumbnail of her viral video, loaded once before any frame is captured
const THUMB = typeof window === 'undefined' ? null : new Image();
if (THUMB) {
  const h = delayRender('bear thumb');
  THUMB.onload = () => continueRender(h);
  THUMB.onerror = () => continueRender(h);
  THUMB.src = staticFile('bear/thumb.jpg');
}

// ---------------------------------------------------------------- 7. day 2: three million views

const ROOM_A: V3 = [0.2, 0, -0.32];
// held by its bottom edge (the fist below the screen, out of the shot)
const PHONE_AT: V3 = [-0.01, -0.125, 0.03];
const PHONE_ROT: V3 = [-0.35, 0.25, 0.15 + Math.PI];
const SHOCK = COUNT[1];

const viewsAnya = (v: number): HumanPose => {
  const shock = ease(v, SHOCK - 0.05, SHOCK + 0.2);
  return {
    sit: 1,
    lean: lerp(0.16, -0.05, shock),
    head: [lerp(0.42, -0.05, shock), 0, 0],
    armR: [-0.75 - 0.15 * shock, 0.12, -0.25],
    elbowR: -1.45 - 0.2 * shock,
    armL: [lerp(-0.1, -1.9, shock), lerp(0.18, 0.05, shock), lerp(0, 0.25, shock)],
    elbowL: lerp(-0.45, -2.0, shock),
    face: {wide: 1.2 * shock, o: shock, mouth: 0.85 * shock, brow: 0.07 * shock, look: [0, lerp(-0.35, 0.05, shock)], lid: shock > 0 ? 0 : blink(v, 2) * 0.9},
  };
};
const viewsPhone = (v: number) => inside(humanHand(ANYA, ROOM_A, 0, viewsAnya(v), 1), PHONE_AT, PHONE_ROT);

const ViewsScreen: React.FC<{v: number}> = ({v}) => {
  const img = THUMB && THUMB.complete && THUMB.naturalWidth > 0 ? THUMB : null;
  const k = ramp(v, COUNT[0], COUNT[1]);
  const views = k <= 0 ? 1200 : Math.round(1200 + (3000000 - 1200) * Math.pow(k, 2.4));
  const likes = views * 0.12;
  const zoom = 1.04 + 0.1 * ramp(v, S('views'), E('views'));
  const hearts = [0, 1, 2, 3, 4, 5, 6].map((i) => (v > COUNT[0] ? ((v - COUNT[0]) * (0.8 + 0.4 * k) + i / 7) % 1 : 0));
  const key = `views-${img ? 1 : 0}-${views}-${Math.round(zoom * 200)}-${hearts.map((h) => Math.round(h * 24)).join('.')}`;
  return <PhoneScreen draw={(g, W, H) => drawViews(g, W, H, img, views, likes, zoom, hearts)} k={key} />;
};

export const viewsScene: Scene = {
  view: (v): View => {
    if (v < SHOCK) {
      // looking at the phone; during the count the camera creeps in on the number
      const M = viewsPhone(S('views'));
      const c = at(M, [0, 0, 0.005]);
      const n = dirOf(M, [0, 0, 1]);
      const up = dirOf(M, [0, 1, 0]);
      const k = ease5(v, COUNT[0] - 0.3, COUNT[1]);
      const pos = add(c, n, lerp(0.42, 0.27, k));
      const roll = 0.05 * Math.sin(v * 0.7) + 0.04 * k;
      const right = dirOf(M, [1, 0, 0]);
      const upR: V3 = [up[0] * Math.cos(roll) + right[0] * Math.sin(roll), up[1] * Math.cos(roll) + right[1] * Math.sin(roll), up[2] * Math.cos(roll) + right[2] * Math.sin(roll)];
      return {pos, target: add(c, up, lerp(0, 0.045, k)), up: upR, fov: 30, far: 60};
    }
    // her face: three million
    const h = at(humanHead(ANYA, ROOM_A, 0, viewsAnya(v)));
    const k = ease(v, SHOCK, E('views'));
    return {pos: [h[0] + 0.08, h[1] - 0.04, h[2] + lerp(0.8, 0.62, k)], target: [h[0], h[1] - 0.02, h[2]], fov: lerp(36, 30, k), far: 60};
  },
  shakes: [[SHOCK, 0.6]],
  probe: (v) => ({head: at(humanHead(ANYA, ROOM_A, 0, viewsAnya(v))), phone: at(viewsPhone(v))}),
  render: (v) => (
    <>
      <hemisphereLight color="#fff4e2" groundColor="#7a5a40" intensity={1.35} />
      <directionalLight position={[-6, 4.5, 1.5]} color="#fff0d0" intensity={2.3} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-3} shadow-camera-right={3} shadow-camera-top={3} shadow-camera-bottom={-3} shadow-bias={-0.0005} />
      <directionalLight position={[3, 3, 5]} color="#ffeedd" intensity={0.5} />
      <color attach="background" args={['#2a2420']} />
      <AnyaRoom />
      <Human
        o={ANYA}
        position={ROOM_A}
        pose={viewsAnya(v)}
        noHead={v < SHOCK}
        handR={
          <Phone position={PHONE_AT} rotation={PHONE_ROT}>
            <ViewsScreen v={v} />
          </Phone>
        }
      />
    </>
  ),
};

// ---------------------------------------------------------------- 8. day 3: a backpack full of bars; he takes it like it weighs nothing

const C_A: V3 = [0.3, 0, 5.55];
const C_B: V3 = [-0.25, 0, 4.7];
const C_BYAW = 0.25;
const TAKE = LIFT - 0.45;

const carryAnya = (v: number): HumanPose => {
  const free = ease(v, LIFT + 0.05, LIFT + 0.45);
  const ph = (v - S('carry')) / 0.95;
  const trudge = 1 - ease(v, TAKE - 0.2, TAKE + 0.1);
  const wk = walkPose(ph, 0.45 * trudge);
  return {
    ...wk,
    lean: lerp(0.5, -0.04, free) + Math.sin(v * 3) * 0.02 * (1 - free),
    head: [lerp(-0.35, -0.3, free), lerp(0, -0.35, ease(v, LIFT + 0.4, LIFT + 0.8)), 0],
    armL: [lerp(-0.25, 0.1, free), 0.35, 0],
    elbowL: lerp(-1.6, -0.2, free),
    armR: free > 0.5 ? [lerp(-0.2, -2.3, ease(v, LIFT + 0.5, LIFT + 0.9)), 0.3, 0] : [-0.25, 0.35, 0],
    elbowR: free > 0.5 ? lerp(-0.2, -1.9, ease(v, LIFT + 0.5, LIFT + 0.9)) : -1.6,
    kneeL: (wk.kneeL ?? 0) + 0.25 * (1 - free),
    kneeR: (wk.kneeR ?? 0) + 0.25 * (1 - free),
    face:
      free < 0.5
        ? {lid: 0.55, browIn: 0.5, brow: -0.02, mouth: 0.2, smile: -0.2, look: [0, 0.2], blush: 0.6}
        : {smile: 0.9, happy: 0.6, look: [-0.2, 0.35], blush: 0.4, lid: blink(v, 4)},
  };
};

const carryBear = (v: number): BearPose => {
  const reach = ease(v, TAKE - 0.35, TAKE);
  const lift = ease(v, LIFT - 0.05, LIFT + 0.4);
  const pat = v > LIFT + 0.9 ? Math.sin((v - LIFT - 0.9) * 9) * 0.12 : 0;
  return {
    lean: 0.32 * reach * (1 - lift) + 0.02,
    head: [0.35 * reach * (1 - lift) + 0.1 * lift, -0.15 * (1 - lift) + 0.25 * lift, 0.18 * lift],
    armR: [lerp(lerp(0.05, -0.85, reach), -2.6, lift), 0.25],
    elbowR: lerp(lerp(-0.2, -0.6, reach), -1.45 + pat, lift),
    armL: [lerp(0.05, -0.3, lift), 0.15],
    elbowL: -0.4,
    face: {happy: 0.6 * lift, smile: 0.4, look: lift > 0.5 ? [0.15, -0.3] : [0.1, -0.35], lid: blink(v, 6), wide: 0.4 * reach * (1 - lift)},
    ears: 0.4 * Math.sin(v * 5) * lift,
    breathe: v,
  };
};

// where the big backpack is: on her back, in his paw, then slung on his shoulder
const packAt = (v: number): {p: V3; r: V3} => {
  const onHer = at(humanTorso(NOPACK, C_A, 0, carryAnya(v)), [0, 0.3, -0.36]);
  const herR: V3 = [carryAnya(v).lean ?? 0, 0, 0];
  const onHim = at(bearTorso(C_B, C_BYAW, carryBear(v)), [0.62, 1.12, -0.08]);
  if (v < LIFT - 0.05) return {p: onHer, r: herR};
  const k = ease5(v, LIFT - 0.05, LIFT + 0.4);
  const p = lerp3(onHer, onHim, k);
  p[1] += Math.sin(k * Math.PI) * 0.55;
  return {p, r: [lerp(herR[0], -0.3, k), lerp(0, C_BYAW + 0.4, k), lerp(0, -0.35, k) + Math.sin(k * Math.PI) * 0.6]};
};

const BigPack: React.FC<{p: V3; r: V3}> = ({p, r}) => (
  <group position={p} rotation={r}>
    <group scale={1.25}>
      <Backpack big />
    </group>
    {/* bars spilling out of the top */}
    {[-2, -1, 0, 1, 2].map((i) => (
      <group key={i} position={[0.07 * i, 0.43, 0.02 * (i % 2)]} rotation={[0.15 * i, 0, 0.25 * i]}>
        <RBox size={[0.055, 0.17, 0.02]} r={0.008} color={i % 2 ? '#f3a520' : '#ffc62e'} />
      </group>
    ))}
  </group>
);

export const carryScene: Scene = {
  view: (v) => follow(v, S('carry'), E('carry'), [2.2, 1.35, 10.4], [1.5, 1.45, 9.2], at(bearHead(C_B, C_BYAW, carryBear(v))), [38, 36], 560, 470, 0.3),
  shakes: [[LIFT, 0.25]],
  probe: (v) => ({face: at(humanHead(NOPACK, C_A, 0, carryAnya(v))), bearHead: at(bearHead(C_B, C_BYAW, carryBear(v))), pack: packAt(v).p}),
  render: (v) => {
    const pk = packAt(v);
    return (
      <>
        <ForestWorld v={v} center={[0, 0, 5]} noBush />
        <Bear position={C_B} rotation={C_BYAW} pose={carryBear(v)} />
        <Human o={NOPACK} position={C_A} rotation={0} pose={carryAnya(v)} />
        <BigPack p={pk.p} r={pk.r} />
        {v > LIFT + 0.4 && v < LIFT + 1.4 ? <Glow position={add(C_A, [0, 1.45, 0.1])} size={0.25} color="#bfe6ff" k={0.6 * (1 - ramp(v, LIFT + 0.4, LIFT + 1.4))} /> : null}
      </>
    );
  },
};

// ---------------------------------------------------------------- 9. day 7: the dance trend

const D_B: V3 = [0, 0, 5.0];
const D_RL: V3 = [0.4, 0, 7.5];
const D_A: V3 = [-1.45, 0, 6.7];

const danceBear = (v: number): BearPose => {
  const {n, ph} = beatAt(v);
  const t = n + ph;
  const hit = Math.exp(-ph * 7);
  const alt = 0.5 + 0.5 * Math.cos(Math.PI * t); // 1 on even beats, 0 on odd
  const sway = Math.sin(Math.PI * t);
  return {
    lean: 0.04 + 0.07 * hit,
    tilt: 0.1 * sway,
    twist: 0.18 * sway,
    head: [0.12 * hit - 0.05, 0.2 * sway, 0.14 * sway],
    armR: [lerp(-0.55, -2.85, alt), 0.35 + 0.2 * alt],
    armL: [lerp(-0.55, -2.85, 1 - alt), 0.35 + 0.2 * (1 - alt)],
    elbowR: lerp(-1.2, -0.35, alt),
    elbowL: lerp(-1.2, -0.35, 1 - alt),
    legL: -0.15 * Math.max(0, sway),
    legR: 0.15 * Math.min(0, sway),
    face: {happy: 0.75, smile: 0.6, lid: 0.15, look: [0.1 * sway, -0.05], blush: 0.3},
    ears: 0.5 * hit,
    breathe: v,
  };
};
const danceBob = (v: number) => -0.05 * Math.exp(-beatAt(v).ph * 7);

const danceAnya = (v: number): HumanPose => {
  const {n, ph} = beatAt(v);
  const clap = Math.exp(-((ph - 0.0) ** 2) * 60) + Math.exp(-((ph - 1) ** 2) * 60);
  return {
    bob: 0.03 * Math.exp(-ph * 6),
    head: [0.02, 0.1 * Math.sin(Math.PI * (n + ph)), 0.08 * Math.sin(Math.PI * (n + ph))],
    armL: [-1.25, 0.15 + 0.25 * (1 - clap), 0.4],
    armR: [-1.25, 0.15 + 0.25 * (1 - clap), 0.4],
    elbowL: -0.9,
    elbowR: -0.9,
    face: {smile: 0.9, happy: 0.7, mouth: 0.35 + 0.2 * clap, look: [-0.3, -0.1], blush: 0.3},
  };
};

const RecScreen: React.FC<{v: number}> = ({v}) => (
  <PhoneScreen
    k={`rec-${Math.floor(v * 2) % 2}-${Math.floor(v)}`}
    glow={1}
    draw={(g, W, H) => {
      const bg = g.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#f2b45a');
      bg.addColorStop(1, '#8a4a22');
      g.fillStyle = bg;
      g.fillRect(0, 0, W, H);
      // the bear on the screen, as a soft silhouette
      g.fillStyle = '#6a3c1e';
      g.beginPath();
      g.ellipse(W / 2, H * 0.58, W * 0.3, H * 0.22, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(W / 2, H * 0.31, W * 0.2, 0, Math.PI * 2);
      g.fill();
      for (const s of [-1, 1]) {
        g.beginPath();
        g.arc(W / 2 + s * W * 0.15, H * 0.22, W * 0.07, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = Math.floor(v * 2) % 2 ? '#ff3b4e' : '#ff8a96';
      g.beginPath();
      g.arc(W * 0.12, H * 0.06, W * 0.04, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#ffffff';
      g.font = `700 ${Math.round(W * 0.07)}px sans-serif`;
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillText(`REC 00:0${Math.floor(v - S('dance')) + 1}`, W * 0.2, H * 0.062);
    }}
  />
);

export const danceScene: Scene = {
  view: (v) => {
    const o = orbit(v, S('dance'), E('dance'), D_B, [4.4, 3.8], [1.2, 1.45], -0.6, -0.1, D_B, [40, 38]);
    return {...o, target: aim(o.pos, [D_B[0], 2.05, D_B[2] + 0.1], o.fov, 640, 560)};
  },
  probe: (v) => ({bearHead: at(bearHead([D_B[0], danceBob(v), D_B[2]], 0, danceBear(v))), ring: add(D_RL, [0, 1.45, 0]), anya: at(humanHead(ANYA, D_A, yawTo(D_A, D_B), danceAnya(v)))}),
  render: (v) => (
    <>
      <ForestWorld v={v} center={[0, 0, 5]} noBush beams={1.3} />
      <Bear position={[D_B[0], danceBob(v), D_B[2]]} rotation={0} pose={danceBear(v)} />
      <RingLight
        position={D_RL}
        rotation={Math.PI + 0.1}
        on={1}
        phone={
          <Phone rotation={[0, Math.PI, 0]}>
            <RecScreen v={v} />
          </Phone>
        }
      />
      <Human o={ANYA} position={D_A} rotation={yawTo(D_A, D_B)} pose={danceAnya(v)} />
    </>
  ),
};

// ---------------------------------------------------------------- 10. day 7: the unboxing trend

const U_B: V3 = [0, 0, 5.0];
const U_BOX: V3 = [0, 0.8, 6.0];
const BOX_S = 0.85;
const JAR_UP: [number, number] = [RIP + 0.3, RIP + 0.95];

const unboxBear = (v: number): BearPose => {
  const open = ease(v, RIP - 0.25, RIP + 0.1);
  const up = ease(v, JAR_UP[0], JAR_UP[1]);
  const love = ease(v, JAR_UP[1] - 0.2, JAR_UP[1] + 0.3);
  // paws on the flaps, then cradling the jar up to his face
  const handsY = lerp(U_BOX[1] + 0.3 * BOX_S, 1.27, up);
  const handsZ = lerp(U_BOX[2] - U_B[2] - 0.02, 0.79, up);
  const hx = lerp(0.1 + 0.1 * open, 0.14, up);
  const base: BearPose = {sit: 1, lean: lerp(0.48, 0.3, up), head: [lerp(0.38, 0.18, up) - 0.12 * open * (1 - up), 0, 0.12 * love * Math.sin(v * 4)]};
  const pR = local(U_B, 0, [hx, handsY, handsZ]);
  const pL = local(U_B, 0, [-hx, handsY, handsZ]);
  const rR = bearArmTo(U_B, 0, base, 1, pR);
  const rL = bearArmTo(U_B, 0, base, -1, pL);
  return {
    ...base,
    armR: rR.arm,
    armL: rL.arm,
    elbowR: rR.elbow,
    elbowL: rL.elbow,
    jaw: 0.35 * open * (1 - love),
    face: {wide: 0.9 * open * (1 - love), o: open * (1 - love), happy: 0.7 * love, blush: 0.6 * love, lid: 0.2 * love, look: [0, lerp(-0.3, 0.05, up)], brow: 0.05 * open},
    ears: 0.6 * love * Math.sin(v * 8),
    breathe: v,
  };
};
const jarAt = (v: number): V3 => {
  const up = ease(v, JAR_UP[0], JAR_UP[1]);
  return lerp3(add(U_BOX, [0, 0.1, 0]), local(U_B, 0, [0, 1.27, 0.8]), up);
};

export const unboxScene: Scene = {
  // low, so the parcel sits in the lower middle and his face above it
  view: (v) => follow(v, S('unbox'), E('unbox'), [0.6, 1.0, 8.45], [0.38, 1.04, 7.9], [U_B[0], 1.74, U_B[2] + 0.15], [44, 41], 575, 540, -0.2),
  shakes: [[RIP, 0.3]],
  probe: (v) => {
    const up = ease(v, JAR_UP[0], JAR_UP[1]);
    const open = ease(v, RIP - 0.25, RIP + 0.1);
    return {bearHead: at(bearHead(U_B, 0, unboxBear(v))), jar: jarAt(v), box: U_BOX, pawR: at(bearHand(U_B, 0, unboxBear(v), 1)), tR: local(U_B, 0, [lerp(0.1 + 0.1 * open, 0.14, up), lerp(U_BOX[1] + 0.3 * BOX_S, 1.27, up), lerp(U_BOX[2] - U_B[2] - 0.02, 0.79, up)])};
  },
  render: (v) => {
    const open = ease(v, RIP - 0.05, RIP + 0.2);
    return (
      <>
        <ForestWorld v={v} center={[0, 0, 5]} noBush />
        <Bear position={U_B} rotation={0} pose={unboxBear(v)} />
        <Cyl position={[U_BOX[0], U_BOX[1] / 2, U_BOX[2]]} rt={0.25} rb={0.29} h={U_BOX[1]} seg={18} color="#7a5232" look={{rough: 0.95, rim: '#ffcf96', rimK: 0.2}} />
        <Cyl position={[U_BOX[0], U_BOX[1] + 0.001, U_BOX[2]]} rt={0.24} rb={0.24} h={0.004} seg={18} color="#d8b07a" shadow={false} />
        <group position={U_BOX} scale={BOX_S}>
          <Parcel open={open} />
        </group>
        <HoneyJar position={jarAt(v)} scale={1.5} glow={0.6 * ease(v, RIP, RIP + 0.3)} />
        {/* bits of tape and paper fly off */}
        {v > RIP && v < RIP + 0.8
          ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const t = v - RIP;
              const a = rnd(i * 3.3) * Math.PI * 2;
              return <Ball key={i} position={[U_BOX[0] + Math.cos(a) * t * 0.9, U_BOX[1] + 0.32 + t * 1.6 - 3.2 * t * t, U_BOX[2] + Math.sin(a) * t * 0.6]} scale={[0.03, 0.006, 0.02]} rotation={[t * 9 + i, t * 7, 0]} color={i % 2 ? '#d8b47a' : '#f2e6c8'} shadow={false} />;
            })
          : null}
        {v > JAR_UP[1] - 0.2
          ? [0, 1, 2, 3].map((i) => {
              const t = (v * 0.8 + i / 4) % 1;
              const j = jarAt(v);
              return <Glow key={i} position={[j[0] + Math.sin(i * 2.1 + v) * 0.25, j[1] + 0.15 + t * 0.5, j[2] + 0.1]} size={0.12} color="#fff2b0" k={0.9 * (1 - t)} />;
            })
          : null}
      </>
    );
  },
};

// ---------------------------------------------------------------- 11. day 14: the honey factory contract

const K_B: V3 = [-2.0, 0.24, 0.05];
const K_BYAW = Math.PI / 2;
const K_M: V3 = [1.62, 0, 0.0];
const K_MYAW = -Math.PI / 2;
const K_A: V3 = [-2.5, 0, -0.85];
const PAD: V3 = [-1.03, 0.762, -0.5];
const PAPER_END: V3 = [-0.96, 0.763, -0.25];
const PAPER_START: V3 = [0.95, 0.763, -0.25];
const PAPER: [number, number] = [0.34, 0.46];
// the print sits at (0.64W, 0.74H) of the paper; the paper's top points to +x (away from the bear)
const PRINT_AT: V3 = [PAPER_END[0] - 0.24 * PAPER[1], 0.77, PAPER_END[2] + 0.14 * PAPER[0]];

// he leans in and turns his right shoulder to the table for the ink and the stamp
const contractReach = (v: number) => ease(v, DIP - 0.6, DIP - 0.2) * (1 - ease(v, STAMP + 0.25, STAMP + 0.7));
const contractLean = (v: number) => 0.15 + 0.47 * contractReach(v);
const contractBearBase = (v: number): BearPose => ({sit: 1, lean: contractLean(v), twist: -0.35 * contractReach(v), head: [0.3 - 0.1 * (contractLean(v) - 0.15), 0.2 * contractReach(v), 0.05 * Math.sin(v * 1.3)], breathe: v});
const pawPath = (v: number): V3 => {
  // rest → ink pad → up → the print → up
  const rest = local(K_B, K_BYAW, [0.45, 1.0, 0.62]);
  const pad = add(PAD, [0, 0.035, 0]);
  const over = add(PRINT_AT, [0, 0.22, 0]);
  const hit = add(PRINT_AT, [0, 0.03, 0]);
  if (v < DIP - 0.45) return rest;
  if (v < DIP) return lerp3(rest, pad, ease5(v, DIP - 0.45, DIP));
  if (v < DIP + 0.35) return lerp3(pad, add(pad, [0, 0.2, 0]), ease5(v, DIP + 0.05, DIP + 0.35));
  if (v < STAMP - 0.25) return lerp3(add(pad, [0, 0.2, 0]), over, ease5(v, DIP + 0.35, STAMP - 0.25));
  if (v < STAMP) return lerp3(over, hit, ease(v, STAMP - 0.25, STAMP) ** 2);
  return lerp3(hit, rest, ease5(v, STAMP + 0.2, STAMP + 0.75));
};
const contractBear = (v: number): BearPose => {
  const base = contractBearBase(v);
  const r = bearArmTo(K_B, K_BYAW, base, 1, pawPath(v));
  const grin = ease(v, STAMP + 0.1, STAMP + 0.5);
  return {
    ...base,
    armR: r.arm,
    elbowR: r.elbow,
    armL: [-0.55, 0.25],
    elbowL: -1.0,
    face: {look: [0, -0.45 + 0.4 * grin], happy: 0.6 * grin, smile: 0.3 + 0.4 * grin, lid: blink(v, 7) * (1 - grin), brow: 0.03 * (1 - grin), browIn: 0.25 * (1 - grin)},
    ears: grin * 0.5 * Math.sin(v * 7),
  };
};
const paperAt = (v: number): V3 => lerp3(PAPER_START, PAPER_END, ease5(v, SLIDE[0], SLIDE[1]));
const managerPose = (v: number): HumanPose => {
  const push = ease(v, SLIDE[0] - 0.2, SLIDE[0] + 0.25) * (1 - ease(v, SLIDE[1], SLIDE[1] + 0.4));
  return {
    sit: 1,
    lean: 0.15 + 0.25 * push,
    head: [0.1, 0, 0],
    armR: [-0.9 - 0.4 * push, 0.1, 0],
    elbowR: -0.6 + 0.4 * push,
    armL: [-0.7, 0.15, 0],
    elbowL: -1.1,
    face: {smile: 0.6, happy: 0.2, lid: blink(v, 9), mouth: v > STAMP ? 0.3 : 0, look: [0, -0.1]},
  };
};
const contractAnya = (v: number): HumanPose => ({
  head: [0.18, 0.15, 0.08],
  armR: [-1.0, 0.2, 0],
  elbowR: -1.3,
  armL: [0.1, 0.1, 0],
  face: {smile: 0.75, happy: 0.4 + 0.3 * ease(v, STAMP, STAMP + 0.3), look: [0.1, -0.35], lid: blink(v, 3)},
});

const sackAt = (v: number): {p: V3; squash: number} => {
  const land: V3 = [-0.5, 0.77, -0.08];
  if (v < SACK - 0.35) return {p: [land[0], 3.2, land[2]], squash: 0};
  if (v < SACK) {
    const k = ramp(v, SACK - 0.35, SACK);
    return {p: [land[0], lerp(3.2, land[1], k * k), land[2]], squash: 0};
  }
  const t = v - SACK;
  return {p: land, squash: Math.sin(t * 22) * Math.exp(-t * 7) * 0.8};
};

export const contractScene: Scene = {
  view: (v): View => {
    if (v < SLIDE[1] + 0.15) {
      // the deal, from behind the manager: the bear on a tiny chair, the paper slides to him
      return follow(v, S('contract'), SLIDE[1] + 0.15, [3.75, 1.75, 1.0], [3.05, 1.65, 0.8], at(bearHead(K_B, K_BYAW, contractBear(v))), [40, 38], 560, 470);
    }
    if (v < SACK - 0.45) {
      // from above: the ink, the paw, the stamp
      const c: V3 = [-0.98, 0.77, -0.33];
      const k = ease(v, SLIDE[1] + 0.15, STAMP);
      return {pos: [c[0] + 0.1, c[1] + lerp(1.3, 1.15, k), c[2]], target: c, up: [1, 0, 0], fov: 42, far: 60};
    }
    // the money lands; his face
    return follow(v, SACK - 0.45, E('contract'), [0.45, 1.55, 1.75], [0.25, 1.6, 1.55], at(bearHead(K_B, K_BYAW, contractBear(v))), [40, 38], 620, 430);
  },
  shakes: [
    [STAMP, 0.55],
    [SACK, 0.7],
  ],
  probe: (v) => ({bearHead: at(bearHead(K_B, K_BYAW, contractBear(v))), paw: at(bearHand(K_B, K_BYAW, contractBear(v), 1)), pawTarget: pawPath(v), paper: paperAt(v), manager: at(humanHead(MANAGER, K_M, K_MYAW, managerPose(v)))}),
  render: (v) => {
    const sk = sackAt(v);
    const stamped = ramp(v, STAMP - 0.02, STAMP + 0.05);
    return (
      <>
        <hemisphereLight color="#f4f6ff" groundColor="#6a6a78" intensity={1.3} />
        <directionalLight position={[3, 6, 3]} color="#fff4e0" intensity={2.0} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0005} />
        <directionalLight position={[-3, 3, 5]} color="#e0ecff" intensity={0.6} />
        <color attach="background" args={['#cfd8e6']} />
        <Office />
        {/* the bear on a tiny office chair */}
        <Chair position={[K_B[0], 0, K_B[2]]} rotation={K_BYAW} office color="#2a2a30" />
        <Bear position={K_B} rotation={K_BYAW} pose={contractBear(v)} />
        <Chair position={[K_M[0], 0, K_M[2]]} rotation={K_MYAW} office color="#2a2a30" />
        <Human o={MANAGER} position={K_M} rotation={K_MYAW} pose={managerPose(v)} />
        <Human o={ANYA} position={K_A} rotation={Math.PI / 2 - 0.25} pose={contractAnya(v)} />
        <group position={paperAt(v)} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
          <Pic size={PAPER} res={[408, 552]} k={`contract-${Math.round(stamped * 10)}`} draw={(g, W, H) => drawContract(g, W, H, stamped)} shadow />
        </group>
        <InkPad position={PAD} />
        <MoneySack position={sk.p} squash={sk.squash} />
        {v > SACK
          ? [0, 1, 2, 3, 4, 5, 6].map((i) => {
              const t = v - SACK;
              const a = rnd(i * 1.7) * Math.PI * 2;
              const sp = 0.4 + rnd(i * 2.9) * 0.5;
              const y = Math.max(0.775, 0.85 + t * 2.2 - 6 * t * t);
              return <Coin key={i} position={[sk.p[0] + Math.cos(a) * sp * Math.min(t, 0.5), y, sk.p[2] + Math.sin(a) * sp * Math.min(t, 0.5)]} rotation={[t * 12 + i, t * 5, 0]} />;
            })
          : null}
      </>
    );
  },
};

// ---------------------------------------------------------------- 12. building the den

const BUILD_B: V3 = [1.62, 0, 2.15];
const BUILD_BYAW = Math.PI + 0.05;
const POST: V3 = [1.6, 1.3, 1.25];

const hammerPose = (v: number): BearPose => {
  // the arm swings up between hits and comes down on each hit
  const raise = HAMMER.reduce((m, h) => {
    const d = v - h;
    return d >= -0.4 && d < -0.1 ? Math.max(m, Math.sin(((d + 0.4) / 0.3) * Math.PI * 0.5)) : m;
  }, 0);
  const strike = HAMMER.some((h) => v - h >= -0.1 && v - h < 0.12);
  return {
    lean: 0.1,
    head: [0.15, 0, 0],
    armR: [strike ? -1.35 : lerp(-1.35, -2.75, raise), 0.15],
    elbowR: strike ? -0.35 : lerp(-0.35, -1.6, raise),
    armL: [-1.25, 0.05],
    elbowL: -0.5,
    face: {browIn: 0.35, lid: 0.15, smile: 0.2, look: [0, 0.1]},
    breathe: v,
  };
};
const denGrowth = (v: number) => 0.42 + HAMMER.reduce((s, h) => s + 0.07 * ease(v, h, h + 0.25), 0);

const Hammer: React.FC = () => (
  <group rotation={[Math.PI / 2, 0, 0]}>
    <Cyl position={[0, 0.16, 0]} rt={0.018} rb={0.022} h={0.36} seg={10} color="#a8743e" />
    <RBox position={[0, 0.35, 0]} size={[0.16, 0.06, 0.06]} r={0.012} color="#5a5c66" look={{metal: 0.7, rough: 0.35}} />
  </group>
);

export const buildScene: Scene = {
  view: (v) => follow(v, S('build'), E('build'), local(BUILD_B, BUILD_BYAW, [-2.5, 1.25, 3.1]), local(BUILD_B, BUILD_BYAW, [-1.95, 1.4, 2.5]), at(bearHead(BUILD_B, BUILD_BYAW, hammerPose(v))), [42, 40], 640, 600, 0.25),
  shakes: HAMMER.map((h) => [h, 0.18] as [number, number]),
  probe: () => ({post: POST, bearHead: at(bearHead(BUILD_B, BUILD_BYAW, hammerPose(40)))}),
  render: (v) => (
    <>
      <ForestWorld v={v} center={[0, 0, 0]} den />
      <River z={-5.2} v={v} />
      <Den k={denGrowth(v)} lights={0} smoke={0} v={v} sign={false} />
      <Bear position={BUILD_B} rotation={BUILD_BYAW} pose={hammerPose(v)} head={<HardHat />} handR={<Hammer />} />
      <Sawdust v={v} at={HAMMER} pos={POST} />
      {HAMMER.map((h, i) => (v > h && v < h + 0.15 ? <Glow key={i} position={POST} size={0.5} color="#fff2c0" k={0.8 * (1 - (v - h) / 0.15)} /> : null))}
    </>
  ),
};

// ---------------------------------------------------------------- 13. the finished den: three rooms, a river view

const DEN_SIGN: V3 = [-1.95, 1.15, 2.75];
const DEN_SIGN_N: V3 = [Math.sin(0.35), 0, Math.cos(0.35)];
const DEN_UP = 42.35;
export const denScene: Scene = {
  // the sign, whole and readable; then a drone rise: the den, its lights, the river behind it
  view: (v) => {
    const c0 = add(DEN_SIGN, DEN_SIGN_N, 3.9);
    const c1 = add(DEN_SIGN, DEN_SIGN_N, 3.45);
    c0[1] = 1.3;
    c1[1] = 1.32;
    if (v < DEN_UP) return mv(v, S('den'), DEN_UP, c0, c1, [DEN_SIGN[0], 1.1, DEN_SIGN[2]], [DEN_SIGN[0], 1.12, DEN_SIGN[2]], 36);
    return mv(v, DEN_UP, E('den'), c1, [4.6, 7.4, 10.8], [DEN_SIGN[0], 1.12, DEN_SIGN[2]], [0.2, 0.2, -2.6], [36, 40], 0.6);
  },
  probe: () => ({sign: DEN_SIGN, den: [0, 1.2, 0], river: [0, 0, -5.2]}),
  render: (v) => {
    const on = ease(v, LIGHTS - 0.1, LIGHTS + 0.6);
    return (
      <>
        <ForestWorld v={v} center={[0, 0, 0]} den shadowBox={v > DEN_UP ? 12 : 8} />
        <River z={-5.2} v={v} />
        <Den k={1} lights={on} smoke={1} v={v} />
        <Bear position={[1.35, 0, 2.55]} rotation={-0.35} pose={{breathe: v, face: {happy: 0.6, smile: 0.5, look: [-0.2, 0], lid: blink(v, 2)}, armR: [-0.4, 0.2], elbowR: -1.6, armL: [0.05, 0.15]}} />
      </>
    );
  },
};

// ---------------------------------------------------------------- 14-16. dinner with her mother

const TBL: [number, number] = [1.45, 1.0];
const DB: V3 = [-1.42, 0, 0.2];
const DB_YAW = Math.PI / 2;
const DM: V3 = [1.2, 0, 0.2];
const DM_YAW = -Math.PI / 2;
const DA: V3 = [0.05, 0, -0.62];
const POT0: V3 = [0.15, 0.765, 0.32];
const POT1: V3 = [-0.48, 0.765, 0.25];
const PUSH = LADLE;

const dinnerBear = (v: number): BearPose => {
  const point = ease(v, POINT - 0.25, POINT + 0.1) * (1 - ease(v, S('ladle') - 0.1, S('ladle') + 0.2));
  const hug = ease(v, PUSH + 0.45, HUG);
  const sm = ease(v, S('sign'), S('sign') + 0.2);
  const base: BearPose = {sit: 1, lean: 0.1 + 0.12 * hug, head: [0.12 - 0.1 * point + 0.1 * hug, -0.35 * point, 0.15 * hug * Math.sin(v * 3)], breathe: v};
  let armR: [number, number] = [-0.6, 0.2];
  let armL: [number, number] = [-0.6, 0.2];
  let elbowR = -0.9;
  let elbowL = -0.9;
  if (point > 0) {
    // the right paw points over his shoulder at the plan on the wall
    armR = [lerp(-0.6, -1.9, point), lerp(0.2, 1.1, point)];
    elbowR = lerp(-0.9, -0.3, point);
  }
  if (v > PUSH + 0.3) {
    const pot = potAt(v);
    const r = bearArmTo(DB, DB_YAW, base, 1, add(pot, dirScale(local([0, 0, 0], DB_YAW, [0.22, 0.1, 0]), 1)));
    const l = bearArmTo(DB, DB_YAW, base, -1, add(pot, dirScale(local([0, 0, 0], DB_YAW, [-0.22, 0.1, 0]), 1)));
    const k = ease(v, PUSH + 0.3, PUSH + 0.5);
    armR = [lerp(armR[0], r.arm[0], k), lerp(armR[1], r.arm[1], k)];
    armL = [lerp(armL[0], l.arm[0], k), lerp(armL[1], l.arm[1], k)];
    elbowR = lerp(elbowR, r.elbow, k);
    elbowL = lerp(elbowL, l.elbow, k);
  }
  return {
    ...base,
    armR,
    armL,
    elbowR,
    elbowL,
    face: v < S('sign') ? {look: [0.25, 0.05], smile: 0.3, lid: blink(v, 5), browIn: 0.15} : {happy: 0.5 * sm + 0.4 * hug, smile: 0.6, blush: 0.5 * hug, look: [-0.2 * point, 0], lid: blink(v, 5) * (1 - hug)},
    ears: hug * 0.6 * Math.sin(v * 8),
  };
};
const dirScale = (p: V3, k: number): V3 => [p[0] * k, p[1] * k, p[2] * k];

const momPose = (v: number): HumanPose => {
  const soften = ease(v, S('ladle') - 0.1, S('ladle') + 0.4);
  const stand = ease(v, PUSH - 0.45, PUSH - 0.1);
  const push = ease(v, PUSH - 0.1, PUSH + 0.35);
  const talk = lip('mom', v);
  return {
    sit: 1 - stand,
    lean: lerp(0.05, 0.55, stand) + 0.1 * push,
    head: [lerp(-0.05, 0.1, soften) - 0.25 * stand, 0.05, lerp(0.12, -0.05, soften)],
    armR: stand > 0 ? [lerp(-0.6, -1.25, push), 0.15, 0] : [-0.5, 0.1, 0],
    elbowR: stand > 0 ? lerp(-1.2, -0.35, push) : -1.4,
    armL: stand > 0 ? [lerp(-0.6, -1.25, push), 0.15, 0] : [-0.45, 0.2, 0],
    elbowL: stand > 0 ? lerp(-1.2, -0.35, push) : -1.5,
    face:
      soften < 0.5
        ? {mouth: talk * 0.95, lid: 0.32 + blink(v, 4) * 0.6, browIn: 0.4, brow: -0.01, tilt: 0.2, look: [-0.05, 0.05], smile: -0.1}
        : {smile: 0.85, happy: 0.55, blush: 0.4, look: [-0.05, -0.1], lid: blink(v, 4)},
  };
};

const dinnerAnya = (v: number): HumanPose => ({
  sit: 1,
  lean: 0.08,
  head: [0.05, v < S('ladle') ? 0.45 : -0.2, 0],
  armL: [-0.65, 0.15, 0],
  armR: [-0.65, 0.15, 0],
  elbowL: -1.0,
  elbowR: -1.0,
  face: {look: [v < S('ladle') ? 0.5 : -0.4, 0], lid: blink(v, 8), smile: v < S('ladle') ? 0.1 : 0.7, browIn: v < S('ladle') ? 0.4 : 0, blush: 0.3},
});

const HUG = PUSH + 0.85;
const POT2 = local(DB, DB_YAW, [0, 1.05, 0.62]);
const potAt = (v: number): V3 => (v < PUSH + 0.5 ? lerp3(POT0, POT1, ease5(v, PUSH, PUSH + 0.45)) : lerp3(POT1, POT2, ease5(v, PUSH + 0.5, HUG)));

const DinnerSet: React.FC<{v: number}> = ({v}) => (
  <>
    <hemisphereLight color="#ffe6c0" groundColor="#6a4426" intensity={1.0} />
    <pointLight position={[0, 2.4, 0.2]} color="#ffc070" intensity={7} distance={7} decay={1.6} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.001} />
    <directionalLight position={[2, 3, 4]} color="#ffd8a0" intensity={0.55} />
    <color attach="background" args={['#3a2414']} />
    <DenInside v={v} pot={false} table={TBL} />
    <Pot position={potAt(v)} />
    <Plate position={[-0.5, 0.766, 0.12]} food={1} col="#c8742a" />
    <Plate position={[0.5, 0.766, 0.2]} food={1} col="#c8742a" />
    <Plate position={[0.05, 0.766, -0.15]} food={1} col="#c8742a" />
    <Bear position={DB} rotation={DB_YAW} pose={dinnerBear(v)} />
    <Chair position={[DM[0] + 0.02, 0, DM[2]]} rotation={DM_YAW} color="#7a4e2a" />
    <Human o={MOM} position={DM} rotation={DM_YAW} pose={momPose(v)} />
    <Chair position={[DA[0], 0, DA[2] - 0.02]} rotation={0} color="#7a4e2a" />
    <Human o={ANYA} position={DA} rotation={0} pose={dinnerAnya(v)} />
  </>
);

const momHead = (v: number) => at(humanHead(MOM, DM, DM_YAW, momPose(v)));
const bearHeadD = (v: number) => at(bearHead(DB, DB_YAW, dinnerBear(v)));

export const dinnerScene: Scene = {
  // over his shoulder onto her: «А жильё у него своё?»
  view: (v) => follow(v, S('dinner'), E('dinner'), [-0.45, 1.45, 1.85], [-0.25, 1.42, 1.55], momHead(v), [34, 30], 640, 600),
  probe: (v) => ({mom: momHead(v), bearHead: bearHeadD(v), anya: at(humanHead(ANYA, DA, 0, dinnerAnya(v)))}),
  render: (v) => <DinnerSet v={v} />,
};

const FRAME: V3 = [-1.67, 1.6, -2.5];
// straight in front of the framed plan, far enough back that the whole frame fits the width
const FRAME_CAM: V3 = [FRAME[0] + Math.sin(0.58) * 2.95, 1.6, FRAME[2] + Math.cos(0.58) * 2.95];
export const signScene: Scene = {
  // he points over his shoulder; a whip to the framed plan
  view: (v) => {
    const b = bearHeadD(v);
    const WHIP: [number, number] = [POINT + 0.2, POINT + 0.42];
    const OTS: V3 = [1.85, 1.62, 0.95];
    const t0 = aim(OTS, b, 38, 640, 430);
    if (v < WHIP[0]) return {pos: lerp3([1.95, 1.6, 1.05], OTS, ease(v, S('sign'), WHIP[0])), target: t0, fov: 38, far: 60};
    return mv(v, WHIP[0], WHIP[1], OTS, FRAME_CAM, t0, FRAME, [38, 32]);
  },
  noHandheld: false,
  probe: (v) => ({bearHead: bearHeadD(v), frame: FRAME}),
  render: (v) => <DinnerSet v={v} />,
};

export const ladleScene: Scene = {
  view: (v) => {
    if (v < PUSH + 0.75) return follow(v, S('ladle'), PUSH + 0.75, [2.35, 1.95, 0.85], [2.25, 1.98, 0.75], bearHeadD(v), [50, 48], 450, 420);
    return follow(v, PUSH + 0.75, E('ladle'), [1.5, 1.5, 2.25], [1.3, 1.52, 2.05], bearHeadD(v), [40, 37], 560, 560);
  },
  probe: (v) => ({mom: momHead(v), bearHead: bearHeadD(v), pot: potAt(v)}),
  render: (v) => <DinnerSet v={v} />,
};

export {smooth, chatter};
