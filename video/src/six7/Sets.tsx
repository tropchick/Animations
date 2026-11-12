import React from 'react';
import {Ball, Block, Cone, Cyl, Glow, Pill, RBox, Ring} from '../bear/kit';
import {Pic} from '../bear/Props';
import {HumanPose, Outfit} from '../bear/People';
import {KID, TEACHER, adult} from '../brain/Sets';
import {V3} from './cues';
import {RULER_H, drawDigit, drawKey, drawLcd, drawRoute, drawRulerTex, drawScore, drawSign} from './tex';

// People and sets for «Что если число 67 запретят?».

// ---------------------------------------------------------------- people

// the boy: yellow hoodie, red cap worn backwards
export const HERO: Outfit = {...KID, top: '#f2c12e', hair: '#5a3418', iris: '#5a3a1a'};
// the head teacher: dark navy cardigan, glasses, a bun
export const ZAVUCH: Outfit = {...TEACHER, hair: '#3a2a20', top: '#33406a', legs: '#2a3040', shirt: '#f4f0e6'};
export const GRANDPA: Outfit = {
  skin: '#efc4a2',
  hair: '#e4e4e4',
  hairStyle: 'short',
  top: '#8a5a3a',
  topStyle: 'cardigan',
  legs: '#4a4a54',
  legStyle: 'pants',
  shoes: '#2a2224',
  glasses: true,
  beard: '#e8e8e8',
  iris: '#4a3020',
  shirt: '#e8e4dc',
};
export const BALLER: Outfit = {
  skin: '#8a5a3a',
  hair: '#1a1414',
  hairStyle: 'short',
  top: '#e8453c',
  topStyle: 'hoodie',
  legs: '#f4f4f4',
  legStyle: 'pants',
  shoes: '#f2f2f2',
  iris: '#2a1a10',
  scale: 1.27,
};
export const OFFICER: Outfit = {
  skin: '#f0c4a2',
  hair: '#2a2018',
  hairStyle: 'short',
  top: '#2f4a6a',
  topStyle: 'suit',
  legs: '#2f4a6a',
  legStyle: 'pants',
  shoes: '#1a1416',
  shirt: '#e8f0f8',
  tie: '#1a2a40',
  iris: '#2a3a50',
};
// council members around the head teacher
export const teacher = (i: number): Outfit => {
  const a = adult(i + 2);
  return {...a, top: ['#6a5a8a', '#5a7a6a', '#8a6a5a', '#5a6a8a', '#7a5a6a', '#6a7a5a'][i % 6], topStyle: i % 2 ? 'cardigan' : 'suit', glasses: i % 2 === 0};
};

// the red cap, backwards (head accessory: head centre at the origin, R = 0.16)
export const BackCap: React.FC<{color?: string}> = ({color = '#e8453c'}) => (
  <group rotation={[0, Math.PI, 0]}>
    <Ball position={[0, 0.045, -0.005]} scale={[0.168, 0.135, 0.17]} color={color} look={{rough: 0.8}} />
    <RBox position={[0, 0.06, 0.17]} rotation={[0.05, 0, 0]} size={[0.22, 0.016, 0.12]} r={0.006} color={color} />
  </group>
);

// «six seven»: palms up in front of the chest, the hands go up and down in turn like scales.
// amp 0..1 blends from rest; rate in beats per second; seed shifts the phase.
export const sixSeven = (v: number, amp = 1, seed = 0, rate = 2.3): HumanPose => {
  const s = Math.sin((v * rate + seed * 0.37) * Math.PI * 2);
  return {
    armR: [-0.3 * amp + 0.3 * s * amp, 0.32 * amp + 0.1, -0.35 * amp],
    elbowR: -0.15 - 1.3 * amp,
    armL: [-0.3 * amp - 0.3 * s * amp, 0.32 * amp + 0.1, -0.35 * amp],
    elbowL: -0.15 - 1.3 * amp,
    bob: Math.abs(s) * 0.015 * amp,
    tilt: 0.05 * s * amp,
    head: [0.05, 0.12 * s * amp, 0.06 * s * amp],
  };
};
// a flat palm-up hand added to the arm tip so the gesture reads
export const Palm: React.FC<{skin: string}> = ({skin}) => <Ball position={[0, 0.0, 0.04]} scale={[0.07, 0.022, 0.08]} color={skin} shadow={false} />;

// ---------------------------------------------------------------- props

export const Whistle: React.FC = () => (
  <group>
    <Cyl rotation={[Math.PI / 2, 0, 0]} rt={0.018} rb={0.018} h={0.05} seg={14} color="#d8d8de" look={{metal: 0.8, rough: 0.25}} />
    <RBox position={[0, 0.0, 0.035]} size={[0.014, 0.012, 0.03]} r={0.003} color="#d8d8de" look={{metal: 0.8, rough: 0.25}} />
  </group>
);

// a wooden stamp held by the handle; the pad faces down (-y)
export const StampTool: React.FC = () => (
  <group>
    <Ball position={[0, 0.16, 0]} scale={0.045} color="#7a4a2a" />
    <Cyl position={[0, 0.09, 0]} rt={0.018} rb={0.024} h={0.12} seg={12} color="#8a5a34" />
    <RBox position={[0, 0.015, 0]} size={[0.12, 0.03, 0.08]} r={0.008} color="#5a3a24" />
    <Block position={[0, -0.003, 0]} size={[0.11, 0.008, 0.07]} color="#d8322a" />
  </group>
);

// kitchen scales with two pans: tilt (rad) rocks the beam
export const Scales: React.FC<{position: V3; tilt: number; taped?: number}> = ({position, tilt, taped = 0}) => (
  <group position={position}>
    <RBox position={[0, 0.03, 0]} size={[0.42, 0.06, 0.2]} r={0.02} color="#e8453c" />
    <Cyl position={[0, 0.16, 0]} rt={0.02} rb={0.03} h={0.22} seg={10} color="#d8d8de" look={{metal: 0.7, rough: 0.3}} />
    <group position={[0, 0.27, 0]} rotation={[0, 0, tilt]}>
      <RBox size={[0.5, 0.025, 0.03]} r={0.008} color="#d8d8de" look={{metal: 0.7, rough: 0.3}} />
      {[-1, 1].map((s) => (
        <group key={s} position={[0.23 * s, 0, 0]} rotation={[0, 0, -tilt]}>
          <Cyl position={[0, 0.03, 0]} rt={0.11} rb={0.07} h={0.04} seg={24} color="#e8e4dc" look={{metal: 0.5, rough: 0.3}} />
          {s === 1 ? <Ball position={[0, 0.09, 0]} scale={[0.07, 0.06, 0.07]} color="#e8453c" /> : <Ball position={[0, 0.08, 0]} scale={[0.06, 0.05, 0.06]} color="#f2b42e" />}
        </group>
      ))}
    </group>
    {taped > 0 ? (
      <group position={[0, 0.2, 0.12]} rotation={[0, 0, -0.35]} scale={[taped, 1, 1]}>
        <Pic size={[0.62, 0.09]} res={[620, 90]} k="tape-ban" draw={drawSign('ЗАПРЕЩЕНО', '#ffd23f', '#1b1c24', undefined, undefined, true)} />
      </group>
    ) : null}
  </group>
);

// a desk calculator facing +z (top tilted towards the viewer); press: index of the pressed key
const KEYS = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', ',', '=', '+'];
export const Calculator: React.FC<{position: V3; rotation?: V3; text: string; err: boolean; press?: string}> = ({position, rotation, text, err, press}) => (
  <group position={position} rotation={rotation}>
    <RBox position={[0, 0, 0]} size={[0.2, 0.02, 0.28]} r={0.01} color="#2a2c36" />
    <group position={[0, 0.012, -0.085]} rotation={[-Math.PI / 2, 0, 0]}>
      <Pic size={[0.17, 0.06]} res={[680, 240]} k={`lcd-${text}-${err ? 1 : 0}`} draw={drawLcd(text, err)} lit={false} glow={1.0} />
    </group>
    {KEYS.map((l, i) => {
      const c = i % 4;
      const r = Math.floor(i / 4);
      const down = press === l ? 0.004 : 0;
      const col = l === '=' ? '#e8853c' : c === 3 ? '#5a5e70' : '#3e4150';
      return (
        <group key={i} position={[-0.066 + c * 0.044, 0.013 - down, -0.02 + r * 0.04]}>
          <RBox size={[0.036, 0.008, 0.032]} r={0.004} color={col} />
          <group position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <Pic size={[0.03, 0.026]} res={[90, 78]} k={`key-${l}`} draw={drawKey(l, col)} />
          </group>
        </group>
      );
    })}
  </group>
);

// a soft city bus: front at +x, door side +z; route board on the front and the side
export const Bus: React.FC<{position: V3; route: string; flip?: number}> = ({position, route, flip = 1}) => (
  <group position={position}>
    <RBox position={[0, 1.55, 0]} size={[8, 2.5, 2.4]} r={0.3} color="#f2b42e" look={{rough: 0.5}} />
    <RBox position={[0, 0.5, 0]} size={[7.8, 0.4, 2.42]} r={0.12} color="#3a6ad0" />
    {/* windows along the door side */}
    {[-3.0, -1.7, -0.4, 0.9].map((x) => (
      <RBox key={x} position={[x, 1.95, 1.205]} size={[1.15, 0.95, 0.02]} r={0.06} color="#2a3a4a" look={{rough: 0.2}} />
    ))}
    {/* doors */}
    {[2.2, -3.6].map((x) => (
      <RBox key={x} position={[x, 1.25, 1.205]} size={[0.95, 1.9, 0.02]} r={0.05} color="#33465a" look={{rough: 0.25}} />
    ))}
    {/* windscreen */}
    <RBox position={[4.005, 1.85, 0]} size={[0.02, 1.3, 2.1]} r={0.1} color="#2a3a4a" look={{rough: 0.2}} />
    {/* wheels */}
    {[-2.6, 2.6].map((x) =>
      [-1, 1].map((s) => <Cyl key={`${x}${s}`} position={[x, 0.42, 1.12 * s]} rotation={[Math.PI / 2, 0, 0]} rt={0.42} rb={0.42} h={0.3} seg={20} color="#1c1c20" />),
    )}
    {/* route boards */}
    <group position={[4.03, 2.6, 0]} rotation={[0, Math.PI / 2, 0]}>
      <Pic size={[1.6, 0.42]} res={[640, 168]} k={`route-${route}-${Math.round(flip * 10)}`} draw={drawRoute(route, flip)} lit={false} glow={1.0} />
    </group>
    <group position={[1.6, 2.6, 1.212]}>
      <Pic size={[1.3, 0.38]} res={[520, 152]} k={`route-s-${route}-${Math.round(flip * 10)}`} draw={drawRoute(route, flip)} lit={false} glow={1.0} />
    </group>
    <Glow position={[4.1, 0.8, 0.8]} size={0.5} color="#fff4d0" k={0.5} />
    <Glow position={[4.1, 0.8, -0.8]} size={0.5} color="#fff4d0" k={0.5} />
  </group>
);

// a bus stop: roof, two posts at the back (-z), a bench and the stop sign on the road side (+z)
export const BusStop: React.FC<{position: V3}> = ({position}) => (
  <group position={position}>
    <RBox position={[0, 2.35, 0]} size={[3.2, 0.12, 1.4]} r={0.04} color="#3a6ad0" />
    {[-1.5, 1.5].map((x) => (
      <Cyl key={x} position={[x, 1.15, -0.6]} rt={0.04} rb={0.04} h={2.3} seg={10} color="#d8d8de" />
    ))}
    <RBox position={[0, 0.48, -0.35]} size={[2.4, 0.06, 0.4]} r={0.02} color="#8a5a34" />
    <group position={[-1.75, 2.0, 0.4]}>
      <Cyl position={[0, -1.0, 0]} rt={0.03} rb={0.03} h={2.0} seg={8} color="#d8d8de" />
      <group rotation={[0, Math.PI, 0]} position={[0, 0.25, 0]}>
        <Pic size={[0.5, 0.5]} res={[200, 200]} k="sign-A" draw={drawSign('А', '#2fae5a', '#ffffff')} />
      </group>
      <Pic position={[0, 0.25, 0.001]} size={[0.5, 0.5]} res={[200, 200]} k="sign-A" draw={drawSign('А', '#2fae5a', '#ffffff')} />
    </group>
  </group>
);

// a birthday cake with two number candles (strings); flame 0..1
export const Cake: React.FC<{position: V3; digits: [string, string]; flame?: number; pop?: number}> = ({position, digits, flame = 1, pop = 0}) => (
  <group position={position}>
    <Cyl position={[0, 0.02, 0]} rt={0.24} rb={0.24} h={0.02} seg={36} color="#f4f4f2" />
    <Cyl position={[0, 0.11, 0]} rt={0.18} rb={0.19} h={0.16} seg={36} color="#f8d8e0" />
    <Cyl position={[0, 0.195, 0]} rt={0.18} rb={0.18} h={0.015} seg={36} color="#ffffff" />
    {Array.from({length: 10}, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return <Ball key={i} position={[Math.cos(a) * 0.15, 0.21, Math.sin(a) * 0.15]} scale={0.022} color={i % 2 ? '#e8453c' : '#ffffff'} shadow={false} />;
    })}
    {digits.map((d, i) => (
      <group key={i} position={[(i - 0.5) * 0.11, 0.3, 0.02]} scale={1 + pop * 0.3}>
        <Pic size={[0.11, 0.15]} res={[220, 300]} k={`digit-${d}-${i}`} draw={drawDigit(d, i ? '#3a8ad8' : '#e8453c')} transparent />
        <Cyl position={[0, 0.09, 0]} rt={0.003} rb={0.003} h={0.03} seg={6} color="#2a2a30" shadow={false} />
        {flame > 0 ? (
          <>
            <Ball position={[0, 0.115, 0]} scale={[0.012 * flame, 0.024 * flame, 0.012 * flame]} color="#ffb030" look={{basic: true}} shadow={false} />
            <Glow position={[0, 0.115, 0]} size={0.18} color="#ffd27a" k={0.6 * flame} />
          </>
        ) : null}
      </group>
    ))}
  </group>
);

// the council hall: a stage wall with the sign, the long table along x at z = 0 (people sit at z = -0.55 facing +z), the scoreboard
export const SCORE_AT: V3 = [2.6, 2.3, -2.38];
export const Hall: React.FC<{score: number; hit: number}> = ({score, hit}) => (
  <group>
    <Block position={[0, -0.05, 0]} size={[12, 0.1, 10]} color="#a87a58" />
    <Block position={[0, 1.8, -2.5]} size={[12, 3.6, 0.1]} color="#e8dcc8" look={{rough: 0.95}} />
    {/* curtains */}
    {[-1, 1].map((s) => (
      <group key={s}>
        {Array.from({length: 4}, (_, i) => (
          <Cyl key={i} position={[s * (4.6 + i * 0.22), 1.8, -2.36]} rt={0.14} rb={0.16} h={3.6} seg={12} color="#8a1f2b" look={{rough: 0.9}} />
        ))}
      </group>
    ))}
    <Pic position={[0.1, 2.5, -2.44]} size={[4.2, 0.6]} res={[1400, 200]} k="council-sign" draw={drawSign('СОВЕТ УЧИТЕЛЕЙ СТРАНЫ', '#33406a', '#ffffff')} />
    {/* the scoreboard */}
    <group position={SCORE_AT}>
      <RBox position={[0, 0, -0.03]} size={[1.9, 1.15, 0.06]} r={0.04} color="#2a2c3a" />
      <Pic position={[0, 0, 0.002]} size={[1.8, 1.05]} res={[900, 525]} k={`score-${Math.round(score)}-${Math.round(hit * 10)}`} draw={drawScore(score, hit)} lit={false} glow={1.0} />
    </group>
    {/* the long table with a green cloth */}
    <RBox position={[0, 0.74, 0]} size={[6.4, 0.06, 1.0]} r={0.02} color="#8a5a34" />
    <RBox position={[0, 0.42, 0.46]} size={[6.3, 0.62, 0.04]} r={0.01} color="#2f6a4a" look={{rough: 0.95}} />
    <RBox position={[0, 0.775, 0]} size={[6.36, 0.012, 0.96]} r={0.004} color="#3a7a5a" look={{rough: 0.95}} />
    {/* water bottles and name cards */}
    {[-2.6, -1.6, -0.6, 0.6, 1.6, 2.6].map((x, i) => (
      <group key={x}>
        <Cyl position={[x + 0.28, 0.9, 0.1]} rt={0.03} rb={0.035} h={0.22} seg={12} color="#9fd0f0" look={{rough: 0.1}} />
        <RBox position={[x, 0.82, 0.32]} rotation={[-0.4, 0, 0]} size={[0.28, 0.1, 0.01]} r={0.003} color={i % 2 ? '#fff7e8' : '#f4f0e6'} />
      </group>
    ))}
  </group>
);

// the airport: back wall, a passport booth, the height ruler by the line, «ВЫХОД» over the far door
export const RULER_AT: V3 = [0.75, 0, -0.6];
export const Airport: React.FC<{lit: number; exitSwing?: number}> = ({lit, exitSwing = 0}) => (
  <group>
    <Block position={[0, -0.05, 0]} size={[14, 0.1, 10]} color="#d8dce4" />
    {Array.from({length: 14}, (_, i) => (
      <Block key={i} position={[-7 + i + 0.5, 0.002, 0]} size={[0.01, 0.004, 10]} color="#c4c8d2" shadow={false} receive={false} />
    ))}
    <Block position={[0, 2.0, -2.5]} size={[14, 4, 0.1]} color="#eef2f6" look={{rough: 0.9}} />
    {/* big windows with planes far away */}
    {[-4.5, -1.5, 4.5].map((x) => (
      <mesh key={x} position={[x, 2.2, -2.44]}>
        <planeGeometry args={[2.4, 2.4]} />
        <meshBasicMaterial color="#a8d4f0" toneMapped={false} />
      </mesh>
    ))}
    <Pic position={[-1.5, 3.7, -2.44]} size={[3.2, 0.42]} res={[1200, 158]} k="passport-sign" draw={drawSign('ПАСПОРТНЫЙ КОНТРОЛЬ', '#2a3a5a', '#ffffff')} />
    {/* the booth */}
    <group position={[-1.1, 0, -0.9]}>
      <RBox position={[0, 0.6, 0]} size={[1.4, 1.2, 0.9]} r={0.05} color="#5a6a80" />
      <RBox position={[0, 1.22, 0]} size={[1.46, 0.05, 0.96]} r={0.02} color="#e8ecf0" />
      <RBox position={[0, 1.75, 0.0]} size={[1.4, 1.0, 0.03]} r={0.02} color="#cfe6f6" look={{rough: 0.1}} />
    </group>
    {/* the ruler on a post */}
    <group position={RULER_AT}>
      <RBox position={[0, RULER_H / 2 + 0.05, -0.03]} size={[0.32, RULER_H + 0.1, 0.04]} r={0.01} color="#2a3a5a" />
      <Pic position={[0, RULER_H / 2, 0.0]} size={[0.28, RULER_H]} res={[200, 1714]} k={`ruler-${Math.round(lit * 10)}`} draw={drawRulerTex(lit)} />
    </group>
    {/* belt posts */}
    {[-3.2, -2.4, 2.2, 3.0].map((x) => (
      <group key={x} position={[x, 0, 0.6]}>
        <Cyl position={[0, 0.5, 0]} rt={0.03} rb={0.03} h={1.0} seg={8} color="#c8ccd4" look={{metal: 0.7, rough: 0.3}} />
        <Cyl position={[0, 0.02, 0]} rt={0.16} rb={0.16} h={0.04} seg={18} color="#9aa0aa" />
      </group>
    ))}
    {/* the exit sign hanging from the ceiling near the camera side */}
    <group position={[2.6, 2.55, 0.4]} rotation={[exitSwing, 0, 0]}>
      <Cyl position={[0, 0.4, 0]} rt={0.008} rb={0.008} h={0.6} seg={6} color="#3a3a40" />
      <Pic position={[0, 0, 0]} size={[0.9, 0.28]} res={[450, 140]} k="exit" draw={drawSign('ВЫХОД', '#2fae5a', '#ffffff')} lit={false} />
    </group>
  </group>
);

// a TV on the wall (screen faces +z)
export const WallTv: React.FC<{position: V3; rotation?: V3; k: string; draw: (g: CanvasRenderingContext2D, W: number, H: number) => void; w?: number}> = ({position, rotation, k, draw, w = 1.2}) => (
  <group position={position} rotation={rotation}>
    <RBox position={[0, 0, -0.03]} size={[w + 0.08, w * 0.5625 + 0.08, 0.05]} r={0.02} color="#16161c" />
    <Pic position={[0, 0, 0.0]} size={[w, w * 0.5625]} res={[960, 540]} k={k} draw={draw} lit={false} glow={1.0} />
  </group>
);

export {Ring, Cone, Pill};
