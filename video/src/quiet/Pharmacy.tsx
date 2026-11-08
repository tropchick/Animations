import React from 'react';
import {Block, Glow, RBox, mat} from '../bear/kit';
import {Sign} from './Town';
import {V3, rnd} from '../bear/cues';

// Inside the pharmacy (its own little set, away from the town): a counter, shelves, the broken shop window.
// Local frame: origin on the floor in the middle, the window wall at +z (the street beyond it).
export const PX: V3 = [120, 0, 0];
export const PW = 6.4;
export const PD = 5.0;
export const WIN_Z = PD / 2;
export const COUNTER_Z = 0.6;

const SHELF_COLS = ['#e8e4d8', '#7ab8d8', '#e87a6a', '#a8d87a', '#f0c85a', '#c89ae8', '#ffffff'];

export const PharmacyIn: React.FC<{v?: number}> = () => (
  <group position={PX}>
    {/* floor tiles */}
    <Block position={[0, -0.05, 0]} size={[PW, 0.1, PD]} color="#a8b0a8" look={{rough: 0.6}} />
    {Array.from({length: 13}, (_, i) => (
      <Block key={'tx' + i} position={[-PW / 2 + i * 0.5, 0.002, 0]} size={[0.01, 0.004, PD]} color="#8a928a" shadow={false} receive={false} />
    ))}
    {/* back + side walls (light green tiles), ceiling */}
    <Block position={[0, 1.6, -PD / 2]} size={[PW, 3.2, 0.1]} color="#b8d0c0" look={{rough: 0.9}} />
    <Block position={[-PW / 2, 1.6, 0]} size={[0.1, 3.2, PD]} color="#b8d0c0" look={{rough: 0.9}} />
    <Block position={[PW / 2, 1.6, 0]} size={[0.1, 3.2, PD]} color="#b8d0c0" look={{rough: 0.9}} />
    <Block position={[0, 3.25, 0]} size={[PW, 0.1, PD]} color="#d8dcd4" />
    {/* front wall with the big window (hole x −2.4..1.2, y 0.6..2.6) and the door at the right */}
    <Block position={[-2.8, 1.6, WIN_Z]} size={[0.8, 3.2, 0.12]} color="#8a8478" />
    <Block position={[-0.6, 0.3, WIN_Z]} size={[3.6, 0.6, 0.12]} color="#8a8478" />
    <Block position={[-0.6, 2.9, WIN_Z]} size={[3.6, 0.6, 0.12]} color="#8a8478" />
    <Block position={[1.55, 1.6, WIN_Z]} size={[0.7, 3.2, 0.12]} color="#8a8478" />
    <Block position={[2.55, 2.75, WIN_Z]} size={[1.3, 0.9, 0.12]} color="#8a8478" />
    <Block position={[2.55, 1.15, WIN_Z + 0.02]} size={[1.0, 2.3, 0.05]} color="#2a2e34" />
    {/* broken glass: a few jagged shards left in the frame */}
    {[
      [-2.2, 2.3, 0.5, 0.2],
      [-1.0, 0.8, 0.45, 2.4],
      [0.8, 2.4, 0.4, 4.0],
      [0.95, 0.85, 0.35, 1.1],
    ].map(([x, y, s, r], i) => (
      <mesh key={i} position={[x, y, WIN_Z - 0.01]} rotation={[0, 0, r]} material={mat('#9ab0c0', {opacity: 0.3, rough: 0.05, metal: 0.4})}>
        <circleGeometry args={[s, 3]} />
      </mesh>
    ))}
    {/* glass crumbs on the floor */}
    {Array.from({length: 26}, (_, i) => (
      <Block key={'g' + i} position={[-2.2 + rnd(i * 3.1) * 3.2, 0.006, WIN_Z - 0.2 - rnd(i * 7.3) * 1.4]} rotation={[0, rnd(i) * 3, 0]} size={[0.04 + rnd(i * 2) * 0.05, 0.008, 0.03]} color="#c8d8e8" look={{rough: 0.05, metal: 0.4}} shadow={false} />
    ))}
    {/* the counter: front panel faces the window, a gap under the top at the back for Соня */}
    <group position={[0, 0, COUNTER_Z]}>
      <RBox position={[0, 1.02, 0]} size={[3.6, 0.06, 0.8]} r={0.02} color="#e8e4dc" />
      <Block position={[0, 0.5, 0.36]} size={[3.6, 1.0, 0.06]} color="#4a8a6a" />
      <Block position={[-1.77, 0.5, 0]} size={[0.06, 1.0, 0.78]} color="#3a7a5a" />
      <Block position={[1.77, 0.5, 0]} size={[0.06, 1.0, 0.78]} color="#3a7a5a" />
      <Block position={[0, 0.42, -0.1]} size={[3.5, 0.03, 0.5]} color="#d8d4cc" />
      <Sign text="+" position={[0, 0.6, 0.395]} size={[0.35, 0.35]} bg="#4a8a6a" fg="#eaffea" glow={0.3} />
      {/* scattered boxes on the counter */}
      {[-1.2, -0.6, 0.4, 1.1].map((x, i) => (
        <RBox key={i} position={[x, 1.1, -0.1 + (i % 2) * 0.15]} rotation={[0, i * 0.7, i === 2 ? Math.PI / 2 : 0]} size={[0.18, 0.1, 0.12]} r={0.01} color={SHELF_COLS[i]} />
      ))}
    </group>
    {/* shelves on the back wall, half emptied */}
    {[0.6, 1.2, 1.8, 2.4].map((y, row) => (
      <group key={row}>
        <Block position={[0, y, -PD / 2 + 0.25]} size={[5.6, 0.04, 0.4]} color="#e8e4dc" />
        {Array.from({length: 18}, (_, i) => i)
          .filter((i) => rnd(row * 17 + i) > 0.45)
          .map((i) => (
            <RBox key={i} position={[-2.6 + i * 0.3, y + 0.1, -PD / 2 + 0.25 + (rnd(i + row) - 0.5) * 0.15]} size={[0.2, 0.16 + rnd(i * row) * 0.1, 0.14]} r={0.012} color={SHELF_COLS[(i + row * 3) % SHELF_COLS.length]} />
          ))}
      </group>
    ))}
    {/* the street outside: wet asphalt, a lamp glow, far houses */}
    <Block position={[0, -0.04, WIN_Z + 6]} size={[40, 0.06, 12]} color="#2c3038" look={{rough: 0.6}} />
    <Block position={[0, 3.0, WIN_Z + 13]} size={[40, 6, 0.5]} color="#3a3e4a" />
    {[-6, -1, 4].map((x, i) => (
      <mesh key={i} position={[x, 2.6, WIN_Z + 12.7]} material={mat('#11161e', {basic: true})}>
        <planeGeometry args={[1, 1.2]} />
      </mesh>
    ))}
    <Glow position={[3.5, 4.8, WIN_Z + 4]} size={4} color="#ffd28a" k={0.8} fog />
    <spotLight position={[3.5, 5, WIN_Z + 4]} angle={0.8} penumbra={0.7} color="#ffcf8a" intensity={60} distance={14} decay={1.6} target-position={[0, 0, WIN_Z + 3]} />
  </group>
);
