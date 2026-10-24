import React from 'react';
import {random} from 'remotion';
import {Dog, Person} from '../scene/Characters';
import {Box, Ico} from '../scene/parts';
import {SkyDome} from '../scene/Effects';
import {
  Bench,
  Bin,
  Building,
  BuildingSpec,
  Bus,
  BusStop,
  CafeTable,
  Chair,
  CityBlocks,
  FOUNTAIN,
  Fountain,
  Ground,
  HotDogCart,
  LampPost,
  Pigeon,
  Planter,
  ShopFront,
  TrafficLight,
  TreeInPlanter,
} from './city';
import {BENCHES, BUS_STOP, BodyState, CROWD, DAD, GIRL, LAMPS, Member, SIGNALS, bodyAt, dadAt, dogAt, girlAt, girlLeftHand} from './cast';
import {Burst, Car, Cloud, DustPuff, Rope, Splash} from './props';
import {FLYERS, Flyer, HEROES, WATER, WATER_IMPACT, WATER_LAND, flyerAt} from './objects';
import {CameraRig, viewAt} from './camera';
import {W, V3, clamp01, ramp, worldTime} from './time';
import {Vector3} from 'three';

const BUILDINGS: BuildingSpec[] = [
  {id: 'n1', x: -34, z: -32.2, w: 18, d: 16, h: 24, color: '#d9cbb5', facade: 'south', awning: '#3fa6b4'},
  {id: 'n2', x: -14, z: -32.2, w: 20, d: 16, h: 58, color: '#cfd6dc', facade: 'south', glass: true},
  {id: 'n3', x: 4, z: -32.2, w: 14, d: 16, h: 28, color: '#e3d6c3', facade: 'south', awning: '#e9563c'},
  {id: 'n4', x: 18, z: -32.2, w: 12, d: 16, h: 20, color: '#c98f6f', facade: 'south', awning: '#f2c84b'},
  {id: 'n5', x: 34, z: -32.2, w: 18, d: 16, h: 36, color: '#d7dde2', facade: 'south'},
  {id: 'w1', x: -26, z: -2, w: 16, d: 16, h: 22, color: '#e8dccb', facade: 'east', awning: '#3fa6b4'},
  {id: 'w2', x: -26, z: 15, w: 18, d: 16, h: 30, color: '#dfe3e6', facade: 'east'},
  {id: 'e1', x: 37, z: -2, w: 18, d: 16, h: 32, color: '#efe2cf', facade: 'west', awning: '#e9563c'},
  {id: 'e2', x: 37, z: 16, w: 16, d: 16, h: 24, color: '#d5cfc5', facade: 'west'},
  {id: 's1', x: -20, z: 52, w: 18, d: 16, h: 26, color: '#e6d8c2', facade: 'north'},
  {id: 's2', x: 0, z: 52, w: 18, d: 16, h: 20, color: '#dfe3e6', facade: 'north'},
  {id: 's3', x: 20, z: 52, w: 18, d: 16, h: 34, color: '#d9cbb5', facade: 'north'},
];

const PLANTERS: V3[] = [
  [-12, 0, -2],
  [12, 0, -2],
  [-12, 0, 18],
  [12, 0, 18],
];

const CLOUDS = Array.from({length: 16}).map((_, i) => ({
  p: [(random(`cloud-x-${i}`) - 0.5) * 360, 200 + random(`cloud-y-${i}`) * 110, (random(`cloud-z-${i}`) - 0.5) * 360 - 30] as V3,
  s: 10 + random(`cloud-s-${i}`) * 14,
}));

const Wrapped: React.FC<{b: BodyState; m: Member}> = ({b, m}) => (
  <group position={b.P.toArray()} quaternion={b.Q.toArray() as [number, number, number, number]}>
    <Person
      position={[0, 0, 0]}
      scale={m.scale}
      child={m.child}
      longHair={m.longHair}
      shirt={m.shirt}
      pants={m.pants}
      hair={m.hair}
      skin={b.skin ?? m.skin}
      pose={b.pose}
    />
  </group>
);

const FlyerModel: React.FC<{o: Flyer; w: number}> = ({o, w}) => {
  const s = flyerAt(o, w);
  const hh = o.kind === 'junk' ? 0 : {car: 0.82, taxi: 0.82, bus: 1.62, tree: 2.2, cart: 1.0, table: 0.5, chair: 0.4, bin: 0.45, water: 0}[o.kind];
  const blink = s.landed && Math.floor(w * 2.2) % 2 === 0;
  let model: React.ReactNode = null;
  if (o.kind === 'car') model = <Car color={o.color} crush={s.crush} blink={blink} />;
  if (o.kind === 'taxi')
    model = (
      <>
        <Car color={o.color} crush={s.crush} blink={blink} />
        <Box size={[0.6, 0.22, 0.3]} position={[-0.2, 1.75 - 0.6 * s.crush, 0]} color="#222" />
      </>
    );
  if (o.kind === 'bus') model = <Bus crush={s.crush} />;
  if (o.kind === 'tree') model = <TreeInPlanter uproot={w > o.f.liftW ? 1 : 0} sway={w > o.f.liftW ? 0.15 * Math.sin(w * 3) : 0} />;
  if (o.kind === 'cart') model = <HotDogCart />;
  if (o.kind === 'table') model = <CafeTable umbrella={o.umbrella} />;
  if (o.kind === 'chair') model = <Chair color={o.color} />;
  if (o.kind === 'bin') model = <Bin />;
  if (o.kind === 'junk') model = <Box size={[o.size!, o.size! * 0.3, o.size! * 0.8]} color={o.color} />;
  return (
    <group position={s.pos} rotation={s.rot}>
      <group position={[0, -hh, 0]}>{model}</group>
    </group>
  );
};

// Fountain water: one bulging mass at the lift-off that tears into wobbling blobs.
const WaterBlobs: React.FC<{w: number}> = ({w}) => {
  if (w < W.flip || w >= WATER_IMPACT + 0.2) return null;
  return (
    <>
      {WATER.map((o, i) => {
        const s = flyerAt(o, w);
        if (s.landed) return null;
        const t = w - W.flip;
        const wob = 1 + 0.18 * Math.sin(w * 7 + i * 1.7);
        const stretch = 1 + 0.6 * Math.exp(-t * 1.5);
        return (
          <Ico
            key={o.id}
            radius={o.size!}
            detail={1}
            position={s.pos}
            scale={[wob / Math.sqrt(stretch), stretch / wob, 1 / wob]}
            rotation={[w * 0.4 + i, w * 0.3, i]}
            color="#6cc6dc"
            emissive="#1f6b80"
            emissiveIntensity={0.25}
            opacity={0.86}
          />
        );
      })}
    </>
  );
};

const Pigeons: React.FC<{w: number}> = ({w}) => (
  <>
    {Array.from({length: 9}).map((_, i) => {
      const a = random(`pg-a-${i}`) * Math.PI * 2;
      const r = 4 + random(`pg-r-${i}`) * 3;
      const x0 = FOUNTAIN[0] + Math.cos(a) * r;
      const z0 = FOUNTAIN[2] + Math.sin(a) * r;
      if (w < W.flip) {
        const peck = Math.max(0, Math.sin(w * 3 + i * 2)) * 0.3;
        return (
          <group key={i} position={[x0 + 0.1 * Math.sin(w * 0.5 + i), 0.12, z0]} rotation={[peck, a + i, 0]}>
            <Pigeon flap={0.1} />
          </group>
        );
      }
      // pigeons can fly, but nothing feels like down any more: they tumble upward flapping
      const t = w - W.flip;
      const y = 0.12 + 1.2 * t + 0.4 * t * t;
      if (y > 120) return null;
      return (
        <group key={i} position={[x0 + Math.sin(t * 2 + i) * t, y, z0 + Math.cos(t * 1.7 + i) * t]} rotation={[t * 2 + i, t + i, t * 1.4]}>
          <Pigeon flap={Math.sin(w * 22 + i) * 0.9} />
        </group>
      );
    })}
  </>
);

// Dust and debris for every landing, plus the special hits.
const Impacts: React.FC<{w: number}> = ({w}) => {
  const items: React.ReactNode[] = [];
  const hero = Object.values(HEROES);
  for (const o of hero) {
    const w0 = o.f.impactW;
    if (w < w0) continue;
    const p: V3 = [o.land[0], 0.15, o.land[2]];
    const big = o.kind === 'bus' ? 1.6 : o.kind === 'tree' ? 0.9 : 1;
    items.push(<DustPuff key={`d-${o.id}`} w={w} w0={w0} position={p} size={2.2 * big} seed={o.id} life={3.2} />);
    const colors = o.kind === 'tree' ? ['#5c9a4a', '#6b4a32', '#4f8a41'] : o.kind === 'cart' ? ['#f2efe8', '#d8473a', '#f2c84b'] : ['#d9cfbf', '#5d5f63', o.color || '#999', '#a9c3d3'];
    items.push(<Burst key={`b-${o.id}`} w={w} w0={w0} position={[o.land[0], 0.6, o.land[2]]} seed={o.id} colors={colors} count={16} speed={6 * big} floorY={0.12} />);
  }
  // traffic out on the streets
  for (const o of FLYERS) {
    if (o.kind !== 'car' && o.kind !== 'taxi') continue;
    if (o.id in HEROES || w < o.f.impactW) continue;
    items.push(<DustPuff key={`t-${o.id}`} w={w} w0={o.f.impactW} position={[o.land[0], 0.1, o.land[2]]} size={1.8} seed={o.id} life={4} />);
  }
  // fountain pillar shatters under the car
  const fc = HEROES.fountainCar.f.impactW;
  items.push(<Burst key="fountain" w={w} w0={fc} position={[FOUNTAIN[0], 1.2, FOUNTAIN[2]]} seed="fountain" colors={['#d8d0c2', '#cfc6b6']} count={20} speed={7} floorY={0.12} />);
  // bus stop glass
  const tx = HEROES.taxi.f.impactW;
  items.push(<Burst key="stop" w={w} w0={tx} position={[BUS_STOP[0], 1.4, BUS_STOP[2]]} seed="stop" colors={['#9fc1d4', '#3a3f47']} count={18} speed={5} floorY={0.12} size={0.25} />);
  items.push(<Splash key="splash" w={w} w0={WATER_IMPACT} position={WATER_LAND} seed="water" size={1} />);
  return <>{items}</>;
};

export const World: React.FC<{v: number}> = ({v}) => {
  const w = worldTime(v);
  const cam = viewAt(v).pos;
  const high = clamp01((cam[1] - 30) / 300);
  const fountainCarHit = w >= HEROES.fountainCar.f.impactW;
  const taxiCrush = clamp01((w - HEROES.taxi.f.impactW) / 0.2);
  const waterLeft = ramp(w, W.flip, W.flip + 0.4);
  const dad = dadAt(w);
  const girl = girlAt(w);
  const dog = dogAt(w);
  const leashFrom = girlLeftHand(w);
  return (
    <>
      <CameraRig v={v} />
      <SkyDome vacuum={0} />
      <fog attach="fog" args={['#d6e6f1', 60 + high * 500, 260 + high * 1800]} />

      <hemisphereLight color="#e4f0fb" groundColor="#8a8f80" intensity={1.0} />
      <ambientLight intensity={0.12} />
      <directionalLight
        position={[22, 40, 18]}
        color="#fff1dc"
        intensity={2.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-near={1}
        shadow-camera-far={160}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />

      <Ground />
      <CityBlocks />
      {BUILDINGS.map((b) => (
        <Building key={b.id} b={b} />
      ))}
      <ShopFront id="n3" x={4} zFront={-24.2} width={12} burstW={HEROES.bus.f.impactW + 0.02} w={w} />
      <ShopFront id="n4" x={18} zFront={-24.2} width={10} burstW={HEROES.pile3.f.impactW + 0.05} w={w} />
      <ShopFront id="n2" x={-14} zFront={-24.2} width={16} burstW={HEROES.pile1.f.impactW + 0.05} w={w} />

      {LAMPS.map((p, i) => (
        <LampPost key={i} position={[p[0], 0.12, p[2]]} />
      ))}
      {SIGNALS.map((s, i) => (
        <TrafficLight key={i} position={s.p} rot={s.rot} v={v} />
      ))}
      <BusStop position={BUS_STOP} crush={taxiCrush} />
      {BENCHES.map((b, i) => (
        <Bench key={i} position={b.p} rot={b.rot} />
      ))}
      {PLANTERS.map((p, i) => (
        <group key={i}>
          <Planter position={p} />
          {i >= 2 ? (
            <group position={[p[0], 0.6, p[2]]}>
              <TreeInPlanter sway={0.03 * Math.sin(w * 1.3 + i)} />
            </group>
          ) : null}
        </group>
      ))}
      <Fountain waterLevel={1 - waterLeft} spray={w < W.flip ? 1 : 0} broken={fountainCarHit} v={v} />

      {FLYERS.map((o) => (
        <FlyerModel key={o.id} o={o} w={w} />
      ))}
      <WaterBlobs w={w} />
      <Impacts w={w} />
      <Pigeons w={w} />

      {CROWD.map((m) => (
        <Wrapped key={m.id} m={m} b={bodyAt(m, w, () => new Vector3(...m.grip!))} />
      ))}
      <Wrapped m={DAD} b={dad} />
      <Wrapped m={GIRL} b={girl} />
      <group position={dog.P.toArray()} quaternion={dog.Q.toArray() as [number, number, number, number]}>
        <Dog position={[0, 0, 0]} pose={{head: dog.head, tail: dog.tail, legPhase: dog.legPhase, tongue: 1, shake: dog.shake}} />
      </group>
      <Rope from={leashFrom.toArray() as V3} to={dog.collar.toArray() as V3} />

      {CLOUDS.map((c, i) => (
        <Cloud key={i} position={c.p} size={c.s} seed={i} />
      ))}
    </>
  );
};

