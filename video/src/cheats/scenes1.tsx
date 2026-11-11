import React from 'react';
import {Human, HumanPose} from '../bear/People';
import {MoneySack, Pic} from '../bear/Props';
import {Block, Cyl, Glow, RBox} from '../bear/kit';
import {Scene, blink, ease, ease5, mv} from '../bear/common';
import type {View} from '../slime/camera';
import {CODES, PARK, PRICE, SACK, V3, clamp01, lerp, lerp3, ramp, shotEnd, shotStart, typedText} from './cues';
import {BED, Bar, BillsOnGround, COP, Car, CopCap, Baton, Flowerbed, Granny, HERO, MoneyRain, ROAD_Y, SELLER, STALL, Stall, walker} from './Sets';
import {BigPhone, PhoneInHand, StreetSet, phonePose, withArm} from './common';
import {drawCodes, drawSackTag} from './tex';

const S = shotStart;
const E = shotEnd;

// ======================================================================= Monday: the kid at the bread stall

export const KID_AT: V3 = [-2.6, 0, -4.4];

// passers-by on the far sidewalk: [x, z, yaw, outfit index]
const WALKERS: [number, number, number][] = [
  [-6.5, -5.6, 0.4],
  [-0.6, -4.9, -0.3],
  [1.4, -5.8, 0.2],
  [3.2, -4.6, -0.5],
  [-8.4, -4.4, 0.6],
  [6.2, -4.2, -0.2],
];

// cars flying over the street in the teaser
const Flyers: React.FC<{v: number; k?: number}> = ({v, k = 1}) => (
  <>
    {[0, 1, 2, 3].map((i) => {
      const x = -12 + ((v * (2.2 + i * 0.4) + i * 7) % 26);
      return <Car key={i} position={[x, 7 + i * 1.6 + Math.sin(v * 1.3 + i) * 0.2, -6 - i * 1.5]} i={i + 1} pitch={0.06 * Math.sin(v + i)} wheels={v * 6} />;
    }).slice(0, Math.round(4 * k))}
  </>
);

const lookUp = (v: number, seed: number): HumanPose => ({head: [-0.55, 0.1 * Math.sin(v + seed), 0], armR: [-2.4, 0.3, 0], elbowR: -0.3, armL: [-2.3, 0.35, 0], elbowL: -0.4, face: {mouth: 0.5, o: 0.6, wide: 0.6, look: [0, 0.4]}});

export const teaserScene: Scene = {
  view: (v): View => mv(v, 0, E('teaser'), [-1.0, 0.95, 0.4], [-1.45, 0.9, -0.75], [-2.3, 2.1, -4.6], [-2.4, 1.95, -4.6], [60, 56], 0.3),
  render: (v) => <CoverWorld v={v} />,
};
export const CoverWorld: React.FC<{v?: number}> = ({v = 1.7}) => (
  <>
    <StreetSet center={[-2, 0, -4]} />
    <Stall price={0} cash={0} />
    <Flowerbed />
    {[0, 1, 2].map((i) => (
      <Car key={i} position={[[-6.5, -0.6, 3.6][i] + (v - 1.7) * [1.2, -0.8, 1.0][i], [6.4, 8.2, 5.6][i] + Math.sin(v * 1.3 + i) * 0.15, [-9, -11, -7.5][i]]} i={i + 1} yaw={[0.3, -0.2, 0.1][i]} pitch={[0.08, -0.05, 0.12][i]} roll={0.05} wheels={v * 8} />
    ))}
    <MoneyRain v={v + 4.6} t0={0} center={[-1.6, 0, -3]} />
    <BillsOnGround area={[-6, 1, -6, -3.4]} n={60} />
    <Granny position={[-1.95 + (1.7 - v) * 1.1, 0.95 + Math.sin(v * 2.5) * 0.06, -2.9]} rotation={-Math.PI / 2 + 0.6} v={v} pose={{lean: 0.35, armL: [-2.4, 0.6, 0], elbowL: -0.2, armR: [-0.8, 0.4, 0], elbowR: -0.5, legL: -0.3, legR: 0.2, kneeL: 0.4, kneeR: 0.6, face: {smile: 0.9, happy: 0.7, mouth: 0.4}}} />
    <Human o={HERO} position={KID_AT} pose={{head: [-0.45, 0.1 + 0.08 * Math.sin(v * 2), 0], armR: [-2.6 + 0.1 * Math.sin(v * 5), 0.25, 0], elbowR: -0.2, armL: [-2.5 + 0.1 * Math.cos(v * 5), 0.4, 0], elbowL: -0.3, bob: Math.abs(Math.sin(v * 5)) * 0.04, face: {mouth: 0.6, o: 0.4, smile: 0.6, wide: 0.7, look: [0, 0.4]}}} handR={<PhoneInHand k="cover" />} />
    {WALKERS.slice(0, 3).map(([x, z, yaw], i) => (
      <Human key={i} o={walker(i)} position={[x, 0, z]} rotation={yaw} pose={lookUp(v, i)} />
    ))}
  </>
);
export const coverView: View = {pos: [-1.4, 0.9, -0.6], target: [-2.4, 2.0, -4.6], fov: 58, far: 300};

// the yard: the kid reads the phone by the stall
const kidRead = (v: number, extra: HumanPose = {}) => phonePose(HERO, KID_AT, 0, v, 1, extra);
const YardSet: React.FC<{v: number}> = ({v}) => (
  <>
    <StreetSet center={[-2, 0, -4]} />
    <Stall price={0} cash={0} />
    <Flowerbed />
    <Human o={SELLER} position={[STALL[0], 0, STALL[2] - 0.7]} pose={{lean: 0.05, armL: [-0.3, 0.1, 0], elbowL: -1.4, armR: [-0.3, 0.1, 0], elbowR: -1.4, face: {lid: blink(v, 6) * 0.9 + 0.1, smile: 0.2}}} />
    <Human o={HERO} position={KID_AT} pose={kidRead(v)} handR={<PhoneInHand k="yard" />} />
    {WALKERS.map(([x, z, yaw], i) => {
      const tt = v - S('yard');
      const ph = tt * 1.4 + i;
      const dx = (i % 2 ? -1 : 1) * 0.9;
      if (Math.abs(x - KID_AT[0]) < 2.2) return null;
      return <Human key={i} o={walker(i)} position={[x + dx * tt * 0.5, 0, z]} rotation={Math.PI / 2 * (i % 2 ? -1 : 1)} pose={{legL: 0.35 * Math.sin(ph * 3), legR: -0.35 * Math.sin(ph * 3), kneeL: 0.2, kneeR: 0.2, armL: [-0.3 * Math.sin(ph * 3), 0.1, 0], armR: [0.3 * Math.sin(ph * 3), 0.1, 0], bob: Math.abs(Math.sin(ph * 3)) * 0.02}} />;
    })}
  </>
);

export const yardScene: Scene = {
  view: (v): View => mv(v, S('yard'), E('yard'), [0.2, 1.5, 0.8], [-1.4, 1.3, -1.8], [-2.9, 1.0, -4.8], [-2.7, 0.95, -4.6], [42, 40], 0.5),
  render: (v) => <YardSet v={v} />,
};

// close-up of the phone: the codes page, HESOYAM typed into the field
const PHONE_AT: V3 = [-2.6, 1.0, -4.05];
const phoneScreen = (v: number) => {
  const text = typedText(0, v);
  const ok = v >= CODES[0].on ? 1 : 0;
  const caret = !ok && Math.floor(v * 3) % 2 === 0;
  return {k: `codes-${text}-${caret ? 1 : 0}-${ok}`, draw: (g: CanvasRenderingContext2D, W: number, H: number) => drawCodes(g, W, H, text, caret, ok)};
};
export const phoneScene: Scene = {
  view: (v): View => mv(v, S('phone'), E('phone'), [-2.6, 1.42, -4.25], [-2.6, 1.38, -4.235], [-2.6, 0.985, -4.08], [-2.6, 0.985, -4.08], [40, 38]),
  noHandheld: true,
  render: (v) => {
    const sc = phoneScreen(v);
    return (
      <>
        <StreetSet center={[-2, 0, -4]} />
        <group position={PHONE_AT} rotation={[0, Math.PI, 0]}>
          <BigPhone position={[0, 0, 0]} rotation={[-Math.PI / 2 + 0.45, 0, 0]} k={sc.k} draw={sc.draw} />
        </group>
        <Glow position={[PHONE_AT[0], PHONE_AT[1] + 0.02, PHONE_AT[2]]} size={0.3} color="#cfe0ff" k={0.15} />
      </>
    );
  },
};

// the money sack drops next to him; health and armour bars appear over his head
const SACK_AT: V3 = [-1.85, 0, -4.1];
const SackSet: React.FC<{v: number}> = ({v}) => {
  const on = CODES[0].on;
  const fall = clamp01((v - (SACK - 0.7)) / 0.7);
  const y = v < SACK ? lerp(9, 0, fall * fall) : 0;
  const squash = v >= SACK ? Math.max(0, Math.sin(Math.min(1, (v - SACK) / 0.35) * Math.PI)) * 0.6 : 0;
  const flash = Math.max(0, 1 - (v - on) / 0.5);
  const look = ease(v, SACK - 1.0, SACK - 0.6);
  const startle = ease(v, SACK, SACK + 0.25);
  const bars = ease(v, on + 0.1, on + 0.4);
  const pose = kidRead(v, {
    head: [lerp(0.38, -0.5, look) + startle * 0.35, lerp(0, 0.45, startle), 0],
    face: {wide: 0.4 + startle * 0.6, mouth: 0.2 + startle * 0.5, o: startle, look: [startle * 0.5, lerp(-0.2, 0.5, look) - startle * 0.6], brow: 0.04 + startle * 0.05},
  });
  return (
    <>
      <StreetSet center={[-2, 0, -4]} />
      <Stall price={0} cash={0} />
      <Flowerbed />
      <Human o={HERO} position={KID_AT} pose={pose} handR={<PhoneInHand k="sack" />} />
      {bars > 0 ? (
        <group position={[KID_AT[0], 1.5, KID_AT[2]]} scale={bars}>
          <Bar position={[0, 0, 0]} yaw={0.36} hp={1} armour={1} w={0.6} k="kidbar" />
        </group>
      ) : null}
      {flash > 0 ? <Glow position={[KID_AT[0], 0.9, KID_AT[2] + 0.2]} size={3} color="#fff4c0" k={flash} /> : null}
      <group position={[SACK_AT[0], y, SACK_AT[2]]} scale={1.5}>
        <MoneySack squash={squash} />
        <Pic position={[0, 0.2, 0.205]} size={[0.24, 0.08]} res={[240, 80]} k="sacktag" draw={drawSackTag} />
      </group>
      {v > SACK ? <BillsOnGround area={[-2.6, -1.1, -4.6, -3.6]} n={14} seed={3} /> : null}
    </>
  );
};
export const sackScene: Scene = {
  view: (v): View => mv(v, S('sack'), E('sack'), [-1.3, 1.15, -1.0], [-1.5, 1.2, -1.3], [-2.2, 1.0, -4.3], [-2.2, 1.1, -4.3], [46, 48]),
  shakes: [[SACK, 0.3]],
  render: (v) => <SackSet v={v} />,
};

// money falls on the whole street, people catch it with bags
const RainSet: React.FC<{v: number}> = ({v}) => (
  <>
    <StreetSet center={[0, 0, -4]} />
    <Stall price={0} cash={0} />
    <Flowerbed />
    <MoneyRain v={v} t0={S('rain') - 2.5} center={[0, 0, -1]} />
    <BillsOnGround area={[-9, 7, -7, -3.4]} n={120} seed={5} />
    <Human o={HERO} position={KID_AT} pose={{...lookUp(v, 9), armR: [-0.4, 0.2, 0], elbowR: -1.1}} handR={<PhoneInHand k="rain" />} />
    {WALKERS.map(([x, z, yaw], i) => (
      <Human key={i} o={walker(i)} position={[x, 0, z]} rotation={yaw} pose={{...lookUp(v, i), bob: Math.abs(Math.sin(v * 5 + i)) * 0.06, armL: [-2.6 + 0.2 * Math.sin(v * 6 + i), 0.4, 0], armR: [-2.6 + 0.2 * Math.cos(v * 6 + i), 0.4, 0], face: {smile: 0.9, happy: 0.7, mouth: 0.5}}} />
    ))}
  </>
);
export const rainScene: Scene = {
  view: (v): View => mv(v, S('rain'), E('rain'), [3.4, 0.8, 0.2], [2.6, 0.95, -0.4], [-3.0, 2.2, -4.6], [-3.4, 2.6, -4.8], [56, 58], 0.3),
  render: (v) => <RainSet v={v} />,
};

// bread: the price tag jumps, the seller sweeps the money off the counter with a broom
const Broom: React.FC = () => (
  <group rotation={[0.2, 0, 0]}>
    <Cyl position={[0, 0.0, 0.03]} rt={0.016} rb={0.016} h={1.0} seg={8} color="#c8945a" />
    <RBox position={[0, -0.55, 0.03]} size={[0.3, 0.18, 0.06]} r={0.02} color="#e8c46a" look={{rough: 1}} />
  </group>
);
const priceAt = (v: number) => PRICE.filter((t) => v >= t).length;
const BreadSet: React.FC<{v: number}> = ({v}) => {
  const k = priceAt(v);
  const sweep = Math.sin((v - S('bread')) * 5.5);
  const sellerAt: V3 = [STALL[0] + 0.3, 0, STALL[2] - 0.75];
  const tgt: V3 = [STALL[0] + 0.45 + sweep * 0.25, 1.15, STALL[2] + 0.05];
  return (
    <>
      <StreetSet center={STALL} box={5} />
      <Stall price={k} cash={0.6 + 0.4 * ease(v, S('bread'), E('bread'))} />
      <Human
        o={SELLER}
        position={sellerAt}
        pose={withArm(SELLER, sellerAt, 0, {lean: 0.15, armL: [-0.9, 0.2, 0], elbowL: -0.6, head: [0.25, 0.1, 0], face: {mouth: 0.15 + 0.2 * (k >= 3 ? 1 : 0), wide: k >= 3 ? 0.8 : 0.2, brow: 0.05, lid: blink(v, 3) * 0.8}}, 1, tgt)}
        handR={<Broom />}
      />
    </>
  );
};
export const breadScene: Scene = {
  view: (v): View => mv(v, S('bread'), E('bread'), [-3.5, 1.55, -2.9], [-3.7, 1.5, -3.25], [-4.05, 1.25, -4.85], [-4.1, 1.27, -4.85], [46, 42]),
  render: (v) => <BreadSet v={v} />,
};

// Tuesday: the whole street takes out phones and types the police code
const TypeSet: React.FC<{v: number}> = ({v}) => (
  <>
    <StreetSet center={[0, 0, -4]} />
    <Stall price={3} cash={1} />
    <Flowerbed />
    <BillsOnGround area={[-9, 7, -7, -3.4]} n={120} seed={5} />
    <Human o={HERO} position={KID_AT} pose={kidRead(v)} handR={<PhoneInHand k="tc0" />} />
    {WALKERS.map(([x, z, yaw], i) => {
      const p: V3 = [x, 0, z];
      return <Human key={i} o={walker(i)} position={p} rotation={yaw} pose={phonePose(walker(i), p, yaw, v, i + 3, {bob: 0.01 * Math.sin(v * 9 + i)})} handR={<PhoneInHand k={`tc${i}`} />} />;
    })}
  </>
);
export const typecopScene: Scene = {
  view: (v): View => mv(v, S('typecop'), E('typecop'), [-4.6, 1.5, -1.4], [-3.4, 1.6, -1.0], [-0.8, 1.0, -5], [-0.2, 1.05, -5], [52, 50], -0.3),
  render: (v) => <TypeSet v={v} />,
};

// the traffic cop doesn't see anyone: a car climbs onto the flowerbed behind him
export const COP_AT: V3 = [2.0, 0, -4.6];
const bez = (a: V3, b: V3, c: V3, t: number): V3 => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1], u * u * a[2] + 2 * u * t * b[2] + t * t * c[2]];
};
const C0: V3 = [-6, ROAD_Y, -1.3];
const C1: V3 = [4.6, ROAD_Y, -1.3];
const C2: V3 = [BED[0], 0.27, BED[2] + 0.2];
export const parkedCar = (v: number) => {
  const t = ease5(v, PARK - 1.4, PARK + 0.9);
  const p = bez(C0, C1, C2, t);
  const d = bez(C0, C1, C2, Math.min(1, t + 0.01));
  const yaw = t >= 0.999 ? Math.PI / 2 : Math.atan2(-(d[2] - p[2]), d[0] - p[0]);
  // up over the curb (z ≈ -3.1) and the flowerbed rim
  const z = p[2];
  const y = z > -3.1 ? ROAD_Y : z > -3.9 ? lerp(0, 0.27, clamp01((-3.1 - z) / 0.8)) : 0.27;
  const bump = z < -3.0 && z > -3.6 ? Math.sin(((-3.0 - z) / 0.6) * Math.PI) * 0.1 : 0;
  return {p: [p[0], y + bump, p[2]] as V3, yaw, pitch: z < -3.0 && z > -4.2 ? 0.12 * Math.sin(((-3.0 - z) / 1.2) * Math.PI) : 0, wheels: t * 30};
};
const CopSet: React.FC<{v: number}> = ({v}) => {
  const c = parkedCar(v);
  const yawn = ramp(v, S('cop') + 0.6, S('cop') + 2.4);
  const mouth = Math.sin(Math.PI * yawn) * 0.9;
  const crush = ease(v, PARK + 0.4, PARK + 0.9);
  return (
    <>
      <StreetSet center={[3, 0, -4]} box={7} />
      <Flowerbed crush={crush} />
      <Car position={c.p} yaw={c.yaw} i={2} pitch={c.pitch} wheels={c.wheels} />
      {/* traffic flows behind */}
      {[0, 1].map((i) => (
        <Car key={i} position={[-14 + ((v * 5 + i * 13) % 34), ROAD_Y, 1.4]} yaw={0} i={i + 4} wheels={v * 15} />
      ))}
      <Human
        o={COP}
        position={COP_AT}
        rotation={-1.25}
        pose={{head: [-0.45 - 0.15 * mouth, 0.2 * Math.sin(v * 0.7), 0], armR: [-0.35, 0.15, 0], elbowR: -1.0, armL: [-2.6 * Math.sin(Math.PI * yawn), 0.2, 0], elbowL: -0.6 * Math.sin(Math.PI * yawn), face: {mouth, o: mouth * 0.6, lid: 0.3 + mouth * 0.5, look: [0.3, 0.5]}}}
        head={<CopCap />}
        handR={<Baton rot={0.3} />}
      />
    </>
  );
};
export const copScene: Scene = {
  view: (v): View => mv(v, S('cop'), E('cop'), [-0.6, 1.45, -4.9], [-0.2, 1.5, -5.1], [3.6, 1.0, -4.3], [3.9, 0.9, -4.6], [52, 50], 0.2),
  render: (v) => <CopSet v={v} />,
};
