import React from 'react';
import {Ball, Block, Glow, RBox} from '../bear/kit';
import {Scene, ease, ease5, mv} from '../bear/common';
import {Pic} from '../bear/Props';
import {InteriorLights} from '../cs2/scenes1';
import {Stars} from '../gta/Space';
import {ServerRoom, CanvasPlane} from '../gta2/Sets';
import {BlackHoleRing, Donut, Galaxy} from '../gaben/Sets';
import {ROUNDF, Mom, SoftSlipper} from '../nolan/Sets';
import {SpaceLights, bounce} from '../nolan/scenes1';
import type {View} from '../slime/camera';
import {fit} from '../cs2/tex';
import {BITE, DONE, DOOR, GONE, REVEAL, SLIPS, SUCK, V3, lerp, ramp, rnd, shotEnd, shotStart} from './cues';
import {Fridge, Kitchen, TextScale, WallClock, drawTiles} from './Sets';

const S = shotStart;
const E = shotEnd;

// ======================================================================= day 4: Valve's computers that computed her weight are free

const drawStatus = (g: CanvasRenderingContext2D, W: number, H: number, mode: 'calc' | 'done' | 'back', pct: number) => {
  g.fillStyle = mode === 'done' ? '#0b2a18' : mode === 'back' ? '#2a0b0b' : '#0b1220';
  g.fillRect(0, 0, W, H);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (mode === 'done') {
    g.fillStyle = '#2fe07a';
    g.font = `800 ${Math.round(H * 0.3)}px ${ROUNDF}`;
    g.fillText('ГОТОВО ✓', W / 2, H * 0.38);
    g.fillStyle = '#c8ffd8';
    const s = fit(g, 'РЕСУРСЫ СВОБОДНЫ', W * 0.86, H * 0.14, 700, ROUNDF);
    g.font = `700 ${s}px ${ROUNDF}`;
    g.fillText('РЕСУРСЫ СВОБОДНЫ', W / 2, H * 0.72);
    return;
  }
  g.fillStyle = mode === 'back' ? '#ff8a7a' : '#9fb8d8';
  const s = fit(g, 'РАСЧЁТ ВЕСА: МАТЬ ГАБЕНА', W * 0.86, H * 0.12, 700, ROUNDF);
  g.font = `700 ${s}px ${ROUNDF}`;
  g.fillText('РАСЧЁТ ВЕСА: МАТЬ ГАБЕНА', W / 2, H * 0.24);
  g.fillStyle = '#1c2a40';
  g.fillRect(W * 0.08, H * 0.42, W * 0.84, H * 0.14);
  g.fillStyle = mode === 'back' ? '#ff4a3a' : '#2fe07a';
  g.fillRect(W * 0.08, H * 0.42, W * 0.84 * pct, H * 0.14);
  g.fillStyle = '#ffffff';
  g.font = `800 ${Math.round(H * 0.16)}px ${ROUNDF}`;
  g.fillText(`${(pct * 100).toFixed(1)}%`, W / 2, H * 0.74);
};

const serversRender = (v: number, mode: 'calc' | 'done' | 'back', offFrom: number) => {
  const pct = mode === 'back' ? 0.001 + 0.002 * ramp(v, S('rwServers'), E('rwServers')) : lerp(0.991, 0.999, ramp(v, S('servers'), DONE));
  const key = mode === 'done' ? 'done' : `${mode}${pct.toFixed(4)}`;
  return (
    <>
      <color attach="background" args={['#000']} />
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 2.5, -2]} color={mode === 'back' ? '#ffb0a0' : '#cfe0ff'} intensity={6} distance={9} decay={2} />
      <pointLight position={[0, 2.5, -7]} color={mode === 'done' ? '#b0ffc8' : '#cfe0ff'} intensity={6} distance={9} decay={2} />
      <ServerRoom v={v} red={mode === 'back' ? 1 : 0} offAt={(k) => (mode === 'done' ? offFrom + k * 0.08 : 1e9)} screenOn={0} />
      <CanvasPlane size={[1.6, 0.9]} res={[640, 360]} k={`diet-st-${key}`} draw={(g, W, H) => drawStatus(g, W, H, mode, pct)} position={[0, 1.7, -10.34]} />
    </>
  );
};

export const serversScene: Scene = {
  view: (v): View => mv(v, S('servers'), E('servers'), [0.35, 1.4, 1.4], [0.0, 1.62, -7.2], [-0.15, 1.45, -10.4], [0, 1.7, -10.4], [52, 44], 0.2),
  render: (v) => serversRender(v, v < DONE ? 'calc' : 'done', DONE),
};

export const rwServersScene: Scene = {
  view: (v): View => mv(v, S('rwServers'), E('rwServers'), [0.0, 1.5, -6.4], [0.05, 1.5, -6.9], [0, 1.52, -10.4], [0, 1.52, -10.4], [42, 40]),
  render: (v) => serversRender(v, 'back', 1e9),
};

// ======================================================================= day 5: the black hole leaves the galaxy, it was her donut

export const galaxyScene: Scene = {
  view: (v): View => {
    const base = mv(v, S('galaxy'), GONE, [0.0, 8.5, 15], [0.6, 6.5, 12.5], [0, 0, 0], [0, 0.5, 0], [46, 46]);
    if (v < GONE) return base;
    const k = ease5(v, GONE, REVEAL + 0.6);
    return {...base, target: [0, lerp(0.5, 3.6, k), lerp(0, 3.2, k)], fov: lerp(46, 40, k)};
  },
  render: (v) => {
    const lift = ease5(v, GONE - 0.2, REVEAL + 0.5);
    const dk = ease(v, REVEAL - 0.2, REVEAL + 0.3);
    const spread = 1 + 0.35 * ease(v, GONE, E('galaxy'));
    const c: V3 = [0, lerp(0.1, 3.8, lift), lerp(0, 3.4, lift)];
    return (
      <>
        <color attach="background" args={['#04040c']} />
        <Stars radius={300} size={1.6} />
        <SpaceLights />
        <group scale={[spread, 1, spread]} rotation={[0, (v - S('galaxy')) * 0.12, 0]}>
          <Galaxy position={[0, 0, 0]} size={9} seed={4} tilt={[0, 0, 0]} />
          <Galaxy position={[0, 0.05, 0]} size={7} seed={9} tilt={[0, 0.4, 0]} />
        </group>
        <Glow position={[0, 0.2, 0]} size={4 * (1 - lift)} color="#ffd8a0" k={0.5 * (1 - lift)} />
        <group position={c} rotation={[-0.55 + 0.5 * lift, lift * 0.6, 0]} scale={1.1}>
          <BlackHoleRing k={1 - dk} />
          <group rotation={[0, 0, (v - REVEAL) * 0.6]}>
            <Donut k={dk} />
          </group>
        </group>
      </>
    );
  },
};

// ======================================================================= day 6: the weigh-in (suck in the belly, slippers off)

const WEIGHT = (v: number) => (v < SUCK + 0.3 ? '999 999 т' : v < SLIPS + 0.4 ? '999 994 т' : '999 991 т');

export const weighScene: Scene = {
  view: (v): View => mv(v, S('weigh'), E('weigh'), [1.0, 0.95, 2.9], [0.55, 0.75, 2.3], [0.0, 0.16, 0.1], [0.0, 0.14, 0.1], [42, 42], 0.12),
  shakes: [[SUCK, 0.08]],
  render: (v) => {
    const suck = ease5(v, SUCK - 0.1, SUCK + 0.2);
    const bare = v > SLIPS;
    const fly = (side: 1 | -1) => {
      const t = v - SLIPS;
      if (t < 0) return null;
      const vy = 1.6;
      const y = Math.max(0, 0.066 + vy * t - 4.9 * t * t);
      const x = side * (0.13 + 1.2 * Math.min(t, 0.55));
      const z = 0.1 + 0.5 * Math.min(t, 0.55);
      return <SoftSlipper key={side} who="g" position={[x, y, z]} rotation={[t * 6 * side, t * 4, t * 3 * side]} />;
    };
    return (
      <>
        <color attach="background" args={['#cfe6ee']} />
        <InteriorLights key1={[1.5, 5, 4]} k={1.0} box={3} warm="#fff4e6" sky="#eef8ff" ground="#8aa0a8" />
        <Pic size={[8, 8]} res={[512, 512]} k="diet-floor-tiles" position={[0, 0.0, 0]} rotation={[-Math.PI / 2, 0, 0]} shadow draw={drawTiles('#f2f4f6', '#c8d4dc', 16)} />
        <Pic size={[8, 5]} res={[512, 320]} k="diet-wall-tiles" position={[0, 2.5, -1.4]} shadow draw={drawTiles('#bfe2ea', '#9cc8d4', 20)} />
        <RBox position={[-1.6, 0.3, -1.0]} size={[1.7, 0.6, 0.75]} r={0.12} color="#ffffff" look={{rough: 0.3}} />
        <RBox position={[1.5, 0.42, -1.15]} size={[0.6, 0.84, 0.45]} r={0.05} color="#f4f0e8" />
        <TextScale position={[0, 0, 0]} text={WEIGHT(v)} k="weigh" color={v > SLIPS + 0.4 ? '#ffd23f' : '#7dffb0'} />
        <Mom who="g" position={[0, 0.066, -0.02]} hem={3} waist={lerp(1, 0.8, suck)} bare={bare} squash={bounce(v, SUCK, 0.04)} />
        {fly(-1)}
        {fly(1)}
      </>
    );
  },
};

// ======================================================================= day 7: 3 am, the fridge, one donut

export const fridgeScene: Scene = {
  view: (v): View => {
    const base = mv(v, S('fridge'), DOOR, [1.3, 1.25, 3.2], [1.0, 1.2, 2.8], [-0.45, 1.2, -0.4], [-0.35, 1.25, -0.45], [46, 44], 0.1);
    if (v < DOOR) return base;
    const k = ease5(v, DOOR, BITE + 0.3);
    return {...base, pos: [lerp(1.0, 0.85, k), lerp(1.15, 1.2, k), lerp(2.8, 1.7, k)], target: [lerp(-0.35, 0.0, k), lerp(1.25, 1.05, k), lerp(-0.45, -0.7, k)]};
  },
  noHandheld: false,
  render: (v) => {
    const open = ease5(v, DOOR, DOOR + 0.5);
    const donut = v < BITE ? 1 : 0;
    const crumbs = v > BITE ? Math.min(1, (v - BITE) * 3) : 0;
    return (
      <>
        <color attach="background" args={['#0c1028']} />
        <InteriorLights key1={[2, 5, 4]} k={0.45} box={3} warm="#9ab0ff" sky="#4a58a0" ground="#1a2038" />
        <Kitchen night />
        <WallClock position={[0.1, 2.3, -1.27]} text="03:00" />
        <Fridge position={[0, 0, -0.85]} open={open} donut={donut} />
        <Mom who="g" position={[-0.8, 0, 0.3]} rotation={Math.PI - 0.7} hem={3} feet={{liftL: 0}} />
        {crumbs > 0
          ? Array.from({length: 10}).map((_, i) => (
              <Ball key={i} position={[0.08 + (rnd(i) - 0.5) * 0.3 * crumbs, Math.max(0.01, 1.06 - crumbs * (0.4 + rnd(i * 3) * 0.6)), 0.0 - 0.85 + 0.3 + rnd(i * 7) * 0.2]} scale={0.012} color="#d6955a" shadow={false} />
            ))
          : null}
      </>
    );
  },
};

export {Block};
