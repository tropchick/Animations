import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Ball, Block, Cone, Cyl, RBox, Ring} from '../bear/kit';
import {Pic} from '../bear/Props';
import {fit} from '../cs2/tex';
import {ROUNDF, SoftSlipper} from '../nolan/Sets';
import {V3, rnd} from './cues';

// Sets for «Мать Габена села на диету»: kitchen, donut box, salad plate, fridge, wall clock, clock tower, Saturn's rings.

const SPR = ['#ffffff', '#ffd23f', '#5ad1ff', '#7dff9a', '#ff4d6d', '#b388ff'];

// a small donut lying flat (outer radius ~0.1 at scale 1), icing on top
export const MiniDonut: React.FC<{position?: V3; rotation?: V3; scale?: number; icing?: string}> = ({position, rotation, scale = 1, icing = '#ff7eb6'}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh castShadow receiveShadow>
        <torusGeometry args={[0.065, 0.035, 12, 28]} />
        <meshStandardMaterial color="#d6955a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0, 0.012]} scale={[1, 1, 0.75]}>
        <torusGeometry args={[0.065, 0.037, 12, 28]} />
        <meshStandardMaterial color={icing} roughness={0.45} />
      </mesh>
      {Array.from({length: 12}).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 + rnd(i) * 0.4;
        const r = 0.065 + (rnd(i * 3) - 0.5) * 0.03;
        return (
          <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r, 0.042]} rotation={[0, 0, rnd(i * 7) * 3]}>
            <boxGeometry args={[0.018, 0.005, 0.005]} />
            <meshStandardMaterial color={SPR[i % SPR.length]} roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  </group>
);

// a pink donut box with the lid open backwards, four donuts inside; ~0.44 wide
export const DonutBox: React.FC<{position?: V3; rotation?: V3; n?: number}> = ({position, rotation, n = 4}) => (
  <group position={position} rotation={rotation}>
    <RBox position={[0, 0.045, 0]} size={[0.44, 0.09, 0.44]} r={0.012} color="#ff9cc6" look={{rough: 0.9}} />
    <RBox position={[0, 0.092, 0]} size={[0.4, 0.004, 0.4]} r={0.002} color="#fff2f6" shadow={false} />
    {/* the lid leans back */}
    <group position={[0, 0.09, -0.22]} rotation={[-1.9, 0, 0]}>
      <RBox position={[0, 0.0, 0.22]} size={[0.44, 0.012, 0.44]} r={0.006} color="#ff8abb" look={{rough: 0.9}} />
      <Pic size={[0.3, 0.12]} res={[300, 120]} k="donut-lid" position={[0, -0.008, 0.22]} rotation={[Math.PI / 2, 0, Math.PI]} draw={(g, W, H) => {
        g.fillStyle = '#ff8abb';
        g.fillRect(0, 0, W, H);
        g.fillStyle = '#ffffff';
        g.font = `800 64px ${ROUNDF}`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText('DONUTS', W / 2, H / 2 + 4);
      }} />
    </group>
    {[
      [-0.1, -0.1, '#ff7eb6'],
      [0.1, -0.1, '#7a4a2a'],
      [-0.1, 0.1, '#ffe6a0'],
      [0.1, 0.1, '#ff7eb6'],
    ]
      .slice(0, n)
      .map(([x, z, c], i) => (
        <MiniDonut key={i} position={[x as number, 0.13, z as number]} icing={c as string} scale={1.15} />
      ))}
  </group>
);

// a white plate with one lonely lettuce leaf
export const SaladPlate: React.FC<{position?: V3; rotation?: V3; scale?: number}> = ({position, rotation, scale = 1}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <Cyl position={[0, 0.012, 0]} rt={0.17} rb={0.12} h={0.024} seg={36} color="#ffffff" look={{rough: 0.25}} />
    <Cyl position={[0, 0.0255, 0]} rt={0.1} rb={0.1} h={0.003} seg={36} color="#f2f4f6" look={{rough: 0.25}} shadow={false} />
    <Ball position={[0.01, 0.036, 0]} rotation={[0.1, 0.6, 0.15]} scale={[0.065, 0.012, 0.045]} color="#7ccf5a" look={{rough: 0.6}} />
    <Ball position={[0.015, 0.045, 0.004]} rotation={[0.1, 0.6, 0.15]} scale={[0.05, 0.006, 0.006]} color="#b8f08a" look={{rough: 0.6}} shadow={false} />
  </group>
);

// a bathroom scale (36 cm) with a free text display, display towards +z
export const TextScale: React.FC<{position?: V3; text: string; color?: string; k: string}> = ({position, text, color = '#7dffb0', k}) => (
  <group position={position}>
    <RBox position={[0, 0.03, 0]} size={[0.36, 0.06, 0.36]} r={0.025} color="#f4f6fa" look={{rough: 0.4}} />
    <RBox position={[0, 0.062, -0.02]} size={[0.3, 0.008, 0.24]} r={0.004} color="#dfe8f2" look={{rough: 0.3}} shadow={false} />
    <RBox position={[0, 0.064, 0.135]} size={[0.16, 0.008, 0.06]} r={0.004} color="#1c2430" shadow={false} />
    <Pic size={[0.145, 0.048]} res={[320, 106]} k={`${k}-${text}-${color}`} position={[0, 0.0725, 0.135]} rotation={[-Math.PI / 2, 0, 0]} lit={false} draw={(g, W, H) => {
      g.fillStyle = '#1c2430';
      g.fillRect(0, 0, W, H);
      g.fillStyle = color;
      const s = fit(g, text, W - 20, 70, 800, ROUNDF);
      g.font = `800 ${s}px ${ROUNDF}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(text, W / 2, H / 2 + 3);
    }} />
  </group>
);

// the kitchen corner: wooden floor, tiled wall, counter with cupboards, a window
export const drawTiles = (base: string, line: string, n: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = line;
  g.lineWidth = 4;
  for (let i = 0; i <= n; i++) {
    g.beginPath();
    g.moveTo((i / n) * W, 0);
    g.lineTo((i / n) * W, H);
    g.stroke();
    g.beginPath();
    g.moveTo(0, (i / n) * H);
    g.lineTo(W, (i / n) * H);
    g.stroke();
  }
};

export const Kitchen: React.FC<{calendar?: string; night?: boolean}> = ({calendar, night}) => (
  <>
    <Block position={[0, -0.05, 0]} size={[10, 0.1, 8]} color={night ? '#5a4a5a' : '#c8955e'} />
    {Array.from({length: 12}).map((_, i) => (
      <Block key={i} position={[-5 + i * 0.85, 0.002, 0]} size={[0.012, 0.002, 8]} color={night ? '#3a2e3a' : '#a8743e'} shadow={false} />
    ))}
    <Pic size={[10, 4]} res={[640, 256]} k={`kit-wall-${night ? 'n' : 'd'}`} position={[0, 2, -1.3]} shadow draw={drawTiles(night ? '#5a6488' : '#fbefe2', night ? '#48506e' : '#ead8c4', 22)} />
    {/* counter and cupboards on the left */}
    <RBox position={[-1.5, 0.45, -1.0]} size={[1.8, 0.9, 0.55]} r={0.03} color={night ? '#4a6a70' : '#7ab0a0'} />
    {[-2.05, -1.5, -0.95].map((x) => (
      <RBox key={x} position={[x, 0.48, -0.715]} size={[0.5, 0.74, 0.02]} r={0.01} color={night ? '#55767c' : '#8cc0b0'} shadow={false} />
    ))}
    <RBox position={[-1.5, 0.92, -1.0]} size={[1.86, 0.05, 0.6]} r={0.015} color="#e8e0d4" />
    {/* a pot plant on the counter */}
    <Cyl position={[-2.1, 1.02, -1.05]} rt={0.08} rb={0.06} h={0.15} seg={14} color="#d8743a" />
    <Ball position={[-2.1, 1.16, -1.05]} scale={[0.12, 0.1, 0.12]} color="#5aa84a" />
    {calendar ? (
      <group position={[1.15, 1.45, -1.27]}>
        <RBox position={[0, 0, 0]} size={[0.62, 0.56, 0.02]} r={0.02} color="#ffffff" />
        <Pic size={[0.58, 0.52]} res={[464, 416]} k={`cal-${calendar}`} position={[0, 0, 0.012]} draw={(g, W, H) => {
          g.fillStyle = '#ffffff';
          g.fillRect(0, 0, W, H);
          g.fillStyle = '#e8453c';
          g.fillRect(0, 0, W, H * 0.3);
          g.fillStyle = '#ffffff';
          const s = fit(g, calendar, W - 30, 90, 800, ROUNDF);
          g.font = `800 ${s}px ${ROUNDF}`;
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          g.fillText(calendar, W / 2, H * 0.155);
          g.fillStyle = '#2a1f3a';
          g.font = `800 210px ${ROUNDF}`;
          g.fillText('1', W / 2, H * 0.66);
        }} />
      </group>
    ) : null}
  </>
);

// a big fridge (2 m), door hinged on its left edge; open 0..1
export const Fridge: React.FC<{position?: V3; open: number; donut: number}> = ({position, open, donut}) => {
  const W = 0.95;
  const H = 2.0;
  const D = 0.72;
  return (
    <group position={position}>
      {/* body shell: back, sides, top, bottom (open towards +z) */}
      <RBox position={[0, H / 2, -D / 2 + 0.03]} size={[W, H, 0.06]} r={0.02} color="#eef2f6" />
      <RBox position={[-W / 2 + 0.03, H / 2, 0]} size={[0.06, H, D]} r={0.02} color="#eef2f6" />
      <RBox position={[W / 2 - 0.03, H / 2, 0]} size={[0.06, H, D]} r={0.02} color="#eef2f6" />
      <RBox position={[0, H - 0.03, 0]} size={[W, 0.06, D]} r={0.02} color="#eef2f6" />
      <RBox position={[0, 0.05, 0]} size={[W, 0.1, D]} r={0.02} color="#dfe4ea" />
      {/* lit inside */}
      <mesh position={[0, H / 2, -D / 2 + 0.065]}>
        <planeGeometry args={[W - 0.14, H - 0.16]} />
        <meshBasicMaterial color={open > 0.05 ? '#fff6dc' : '#3a4050'} toneMapped={false} />
      </mesh>
      {[0.55, 1.05, 1.5].map((y) => (
        <RBox key={y} position={[0, y, -0.02]} size={[W - 0.13, 0.02, D - 0.12]} r={0.006} color="#dff4ff" look={{opacity: 0.85, rough: 0.2}} shadow={false} />
      ))}
      {/* a milk carton and jars, the lonely donut on the middle shelf */}
      <RBox position={[0.28, 0.65, -0.12]} size={[0.11, 0.2, 0.11]} r={0.01} color="#ffffff" />
      <Cyl position={[-0.28, 1.12, -0.1]} rt={0.05} rb={0.05} h={0.12} seg={14} color="#e8453c" />
      <Cyl position={[-0.14, 1.12, -0.16]} rt={0.045} rb={0.045} h={0.1} seg={14} color="#ffd23f" />
      {donut > 0.01 ? <MiniDonut position={[0.08, 1.06, 0.02]} scale={1.4 * donut} /> : null}
      {open > 0.05 ? <pointLight position={[0, 1.3, 0.1]} color="#fff2c8" intensity={7 * open} distance={4} decay={1.6} /> : null}
      {/* the door, hinge at the left front edge */}
      <group position={[-W / 2, 0, D / 2]} rotation={[0, -open * 1.9, 0]}>
        <RBox position={[W / 2, H / 2, 0.04]} size={[W, H, 0.08]} r={0.03} color="#f6f8fa" />
        <RBox position={[W - 0.1, H * 0.62, 0.11]} size={[0.04, 0.5, 0.05]} r={0.015} color="#b8c0cc" />
        <RBox position={[W / 2, H * 0.36, 0.084]} size={[W - 0.06, 0.008, 0.01]} r={0.003} color="#d8dee6" shadow={false} />
      </group>
    </group>
  );
};

// a round wall clock showing a fixed time
export const WallClock: React.FC<{position: V3; text: string}> = ({position, text}) => (
  <group position={position}>
    <Cyl rotation={[Math.PI / 2, 0, 0]} rt={0.24} rb={0.24} h={0.05} seg={36} color="#2a2b33" />
    <Pic size={[0.4, 0.4]} res={[256, 256]} k={`clock-${text}`} position={[0, 0, 0.027]} lit={false} transparent draw={(g, W, H) => {
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#fbf6ea';
      g.beginPath();
      g.arc(W / 2, H / 2, W / 2 - 2, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#e8453c';
      const s = fit(g, text, W - 40, 90, 800, ROUNDF);
      g.font = `800 ${s}px ${ROUNDF}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(text, W / 2, H / 2 + 4);
    }} />
  </group>
);

// a clock tower (city), the face towards +z; hands spin with `a` (hour hand angle, rad)
export const ClockTower: React.FC<{position: V3; a: number}> = ({position, a}) => (
  <group position={position}>
    <RBox position={[0, 4, 0]} size={[2.2, 8, 2.2]} r={0.08} color="#d8b890" />
    <RBox position={[0, 8.2, 0]} size={[2.6, 0.4, 2.6]} r={0.08} color="#a85a3a" />
    <Cone position={[0, 9.4, 0]} r={1.8} h={2.0} seg={4} color="#a84a2a" look={{flat: true}} />
    <Cyl position={[0, 6.4, 1.11]} rotation={[Math.PI / 2, 0, 0]} rt={0.85} rb={0.85} h={0.06} seg={40} color="#fbf6ea" />
    {Array.from({length: 12}).map((_, i) => {
      const b = (i / 12) * Math.PI * 2;
      return <RBox key={i} position={[Math.sin(b) * 0.7, 6.4 + Math.cos(b) * 0.7, 1.15]} size={[0.06, 0.14, 0.02]} r={0.01} color="#2a2b33" shadow={false} />;
    })}
    <group position={[0, 6.4, 1.17]} rotation={[0, 0, -a]}>
      <RBox position={[0, 0.22, 0]} size={[0.1, 0.48, 0.03]} r={0.02} color="#2a2b33" shadow={false} />
    </group>
    <group position={[0, 6.4, 1.19]} rotation={[0, 0, -a * 12]}>
      <RBox position={[0, 0.32, 0]} size={[0.06, 0.68, 0.03]} r={0.015} color="#e8453c" shadow={false} />
    </group>
  </group>
);

// a surfboard standing on its tail
export const Surfboard: React.FC<{position: V3; rotation?: V3}> = ({position, rotation}) => (
  <group position={position} rotation={rotation}>
    <Ball position={[0, 0.95, 0]} scale={[0.27, 0.95, 0.045]} color="#ffd23f" look={{rough: 0.35}} />
    <Ball position={[0, 0.95, 0.03]} scale={[0.05, 0.9, 0.02]} color="#e8453c" look={{rough: 0.35}} shadow={false} />
  </group>
);

// two flattened rings (Saturn's) lying in their local XZ plane
export const SaturnRings: React.FC<{r: number; position?: V3; rotation?: V3}> = ({r, position, rotation}) => (
  <group position={position} rotation={rotation}>
    <Ring rotation={[Math.PI / 2, 0, 0]} r={r} tube={r * 0.07} scale={[1, 1, 0.25]} color="#e8d29a" look={{rough: 0.6}} />
    <Ring rotation={[Math.PI / 2, 0, 0]} r={r * 0.82} tube={r * 0.06} scale={[1, 1, 0.25]} color="#c8a86a" look={{rough: 0.6}} />
  </group>
);

export const SlipperFly: React.FC<{p: V3; rot: V3}> = ({p, rot}) => <SoftSlipper who="g" position={p} rotation={rot} />;

export const useUnused = () => useMemo(() => new THREE.Vector3(), []);
