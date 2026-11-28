import type {ReactNode} from 'react';
import {Vector2} from 'three';
import {Block, Cyl} from '../../bear/kit';
import {Person} from '../../scene/Characters';
import {ToyBox} from './geometry';
import {ToyMaterial} from './materials';
import {TOY_MOTION, toyImpact, toySettle} from './motion';
import type {ToyboxQuality} from './theme';
import {ToyAssembly, ToyHinge} from './transforms';

export type Point = [number, number, number];
export const phase = (frame: number, from: number, to: number) =>
  Math.max(0, Math.min(1, (frame - from) / (to - from)));
export const soft = (frame: number, from: number, to: number) => {
  const p = phase(frame, from, to);
  return p * p * (3 - 2 * p);
};

export const COFFEE = {
  enamel: '#cc5639', cap: '#ff8a52', piping: '#f7cba4', ivory: '#fff2de',
  ink: '#432533', base: '#32565c', mint: '#58d0ad', brass: '#d9984a', crema: '#b4753d',
};

const cupProfile = [
  [0, 0], [.5, 0], [.61, .025], [.64, .11], [.70, .34], [.78, .75], [.84, 1.19],
  [.845, 1.25], [.835, 1.28], [.80, 1.29], [.775, 1.27], [.766, 1.24],
  [.72, .92], [.66, .55], [.60, .20], [.57, .13], [0, .13],
].map(([r, h]) => new Vector2(r, h));

export const BUTTON: Point = [-.47, 1.21, .64];
export const CUP_BASE: Point = [.25, .57, .05];
export const TERRACE_Y = CUP_BASE[1] + 1.0;

function Ring({r, tube, position, color, quality, vertical = false}: {
  r: number; tube: number; position: Point; color: string; quality: ToyboxQuality; vertical?: boolean;
}) {
  return <mesh position={position} rotation-x={vertical ? 0 : Math.PI / 2}>
    <torusGeometry args={[r, tube, 8, quality === 'preview' ? 24 : 40]} />
    <ToyMaterial kind="glossyPlastic" color={color} quality={quality} />
  </mesh>;
}

function CupShell({quality, children}: {quality: ToyboxQuality; children?: ReactNode}) {
  return <group>
    <mesh castShadow receiveShadow>
      <latheGeometry args={[cupProfile, quality === 'preview' ? 24 : 56]} />
      <ToyMaterial kind="glossyPlastic" color={COFFEE.cap} quality={quality} />
    </mesh>
    <Ring r={.814} tube={.038} position={[0, 1.25, 0]} color={COFFEE.ivory} quality={quality} />
    <Ring r={.691} tube={.016} position={[0, .326, 0]} color={COFFEE.piping} quality={quality} />
    <Ring r={.705} tube={.014} position={[0, .375, 0]} color={COFFEE.piping} quality={quality} />
    {children}
  </group>;
}

function Handle({quality}: {quality: ToyboxQuality}) {
  return <group rotation-z={-.18} scale={[.88, 1.05, 1]}>
    <Ring r={.28} tube={.08} position={[0, 0, 0]} color={COFFEE.cap} quality={quality} vertical />
    <Ring r={.294} tube={.022} position={[0, 0, .071]} color={COFFEE.piping} quality={quality} vertical />
  </group>;
}

function CoffeeStamp({position, size, quality}: {position: Point; size: number; quality: ToyboxQuality}) {
  return <group position={position} scale={size}>
    <mesh scale={[.76, 1, .33]} rotation-z={-.45}>
      <sphereGeometry args={[1, 24, 16]} />
      <ToyMaterial kind="paintedWood" color={COFFEE.piping} quality={quality} />
    </mesh>
    <ToyBox quality={quality} position={[0, 0, .314]} size={[.11, 1.42, .085]} radius={.042} rotation-z={-.45}>
      <ToyMaterial kind="mattePlastic" color={COFFEE.enamel} quality={quality} />
    </ToyBox>
  </group>;
}

export function CoffeeMachine({frame, fps = 30, quality, low = false, children}: {
  frame: number; fps?: number; quality: ToyboxQuality; low?: boolean; children?: ReactNode;
}) {
  const press = soft(frame, 125, 132) - soft(frame, 137, 147);
  const open = soft(frame, 173, 238) - soft(frame, 649, 709);
  const assembled = soft(frame, 191, 279) - soft(frame, 617, 667);
  const tiny = phase(frame, 706, 720);
  const tap = (frame - 720) / fps;
  const bounce = toyImpact(tap, {...TOY_MOTION.stone, airtime: .24, height: .055});
  const tinyY = .55 * (1 - tiny * tiny) + bounce.height;
  const cupTilt = toySettle(tap, {amplitude: .17, frequency: 2.2, decay: 5.1});
  const sway = toySettle((frame - 272) / fps, {amplitude: 1, frequency: 1, decay: 2.5});
  if (low) return <group>
    <Block position={[0, .09, 0]} size={[1.65, .18, 1.4]} color={COFFEE.base} />
    <Block position={[0, .83, -.32]} size={[1.38, 1.42, .55]} color={COFFEE.enamel} />
    <Block position={[-.47, 1.21, .23]} size={[.29, .28, .72]} color={COFFEE.ink} />
    <Block position={BUTTON} size={[.22, .22, .14 - .08 * press]} color={COFFEE.mint} />
    {[-1, 1].map((side) => <ToyHinge key={side} pivot={[side * .67, .42, -.25]} axis="z"
      open={side * -1.03} progress={open}>
      <Block position={[side * .71, .87, .031]} size={[.20, .98, .99]} color={COFFEE.cap} />
    </ToyHinge>)}
    {assembled > 0 && <ToyAssembly position={CUP_BASE} progress={assembled} parts={[
      {id: 'dish', position: [0, -.015, 0], offset: [0, -.1, .16], arc: .14,
        children: <Cyl position={[0, 0, 0]} rt={.68} rb={.56} h={.07} seg={10} color={COFFEE.brass} />},
      {id: 'shell', offset: [0, -.52, -.55], spin: [-.55, -.35, 0], delay: .03, arc: .38,
        children: <>
          <mesh>
            <latheGeometry args={[cupProfile, 10]} />
            <meshStandardMaterial color={COFFEE.cap} roughness={.8} flatShading />
          </mesh>
        </>},
      {id: 'handle', position: [.88, .64, -.025], offset: [-1.14, -.3, -.18],
        spin: [1.25, 0, -.9], delay: .15, arc: .4,
        children: <Block position={[.03, 0, 0]} size={[.25, .51, .23]} color={COFFEE.cap} />},
    ]} />}
    {frame > 265 && frame < 647 && <group position={[CUP_BASE[0],
      CUP_BASE[1] + .62 + .38 * soft(frame, 265, 292) - .38 * soft(frame, 610, 646), CUP_BASE[2]]}>
      <Cyl position={[0, 0, 0]} rt={.725} rb={.725} h={.02} seg={10} color={COFFEE.crema} />
      <Block position={[-.12, .046, -.032]} size={[.87, .052, .68]} color="#dcb18d" />
      <Cyl position={[-.19, .27, -.18]} rt={.012} rb={.016} h={.48} seg={8} color={COFFEE.brass} />
      <Cyl position={[-.19, .515, -.18]} rt={.038} rb={.262} h={.11} seg={8} color={COFFEE.enamel} />
      <Cyl position={[.19, .19, .04]} rt={.109} rb={.095} h={.031} seg={8} color={COFFEE.ivory} />
      <Cyl position={[.19, .12, .04]} rt={.015} rb={.025} h={.14} seg={8} color={COFFEE.base} />
      <Person position={[.34 - .245 * soft(frame, 369, 433), .063, -.145]} scale={.157}
        rotation={-.75} shirt="#2f796f" pants="#30445b" />
      <Person position={[-.39, .063, -.19]} scale={.13} rotation={.62}
        shirt="#e6ac51" pants="#3e5966" />
    </group>}
  </group>;

  return <group>
    <ToyBox quality={quality} position={[0, .085, 0]} size={[1.76, .17, 1.48]} radius={.08} castShadow receiveShadow>
      <ToyMaterial kind="rubber" color={COFFEE.ink} quality={quality} />
    </ToyBox>
    <ToyBox quality={quality} position={[0, .18, -.02]} size={[1.7, .14, 1.4]} radius={.067}>
      <ToyMaterial kind="paintedWood" color={COFFEE.base} quality={quality} />
    </ToyBox>
    <ToyBox quality={quality} position={[0, .257, .12]} size={[1.26, .072, 1.1]} radius={.033}>
      <ToyMaterial kind="metal" color={COFFEE.brass} quality={quality} />
    </ToyBox>
    {Array.from({length: 7}, (_, i) => <ToyBox quality={quality} key={i} position={[(i - 3) * .15, .297, .19]}
      size={[.037, .01, .71]} radius={.004}>
      <ToyMaterial kind="rubber" color={COFFEE.ink} quality={quality} />
    </ToyBox>)}
    <ToyBox quality={quality} position={[0, .955, -.46]} size={[1.49, 1.4, .57]} radius={.19}
      castShadow receiveShadow>
      <ToyMaterial kind="glossyPlastic" color={COFFEE.enamel} quality={quality} />
    </ToyBox>
    <ToyBox quality={quality} position={[0, 1.537, -.39]} size={[1.35, .15, .67]} radius={.072}>
      <ToyMaterial kind="glossyPlastic" color={COFFEE.cap} quality={quality} />
    </ToyBox>
    <ToyBox quality={quality} position={[0, 1.34, -.085]} size={[1.19, .42, .28]} radius={.13}>
      <ToyMaterial kind="mattePlastic" color={COFFEE.ivory} quality={quality} />
    </ToyBox>
    <ToyBox quality={quality} position={[.055, 1.35, .062]} size={[.67, .21, .051]} radius={.025}>
      <ToyMaterial kind="glossyPlastic" color={COFFEE.base} quality={quality} />
    </ToyBox>
    <CoffeeStamp position={[.04, 1.35, .101]} size={.065} quality={quality} />
    {[-1, 1].map((side) => <group key={side}>
      <ToyHinge pivot={[side * .67, .42, -.25]} axis="z" open={side * -1.03} progress={open}>
        <ToyBox quality={quality} position={[side * .71, .87, .031]} size={[.20, .98, .99]} radius={.09} castShadow>
          <ToyMaterial kind="glossyPlastic" color={COFFEE.cap} quality={quality} />
        </ToyBox>
        <ToyBox quality={quality} position={[side * .717, .84, .54]} size={[.094, .67, .025]} radius={.012}>
          <ToyMaterial kind="paintedWood" color={COFFEE.piping} quality={quality} />
        </ToyBox>
      </ToyHinge>
      {[.48, 1.12].map((y) => <mesh key={y} position={[side * .61, y, -.09]}
        rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[.033, .033, .04, 12]} />
        <ToyMaterial kind="polishedMetal" color={COFFEE.brass} quality={quality} />
      </mesh>)}
    </group>)}
    <ToyBox quality={quality} position={[-.47, 1.21, .50]} size={[.34, .33, .23]} radius={.09}>
      <ToyMaterial kind="mattePlastic" color={COFFEE.ink} quality={quality} />
    </ToyBox>
    <ToyBox quality={quality} position={[BUTTON[0], BUTTON[1], BUTTON[2] - .064 * press]}
      size={[.24, .22, .12]} radius={.052}>
      <ToyMaterial kind="silicone" color={COFFEE.mint} quality={quality} />
    </ToyBox>
    <group position={[.28, .94, .15 - .46 * open]}>
      <mesh>
        <cylinderGeometry args={[.19, .13, .24, 20]} />
        <ToyMaterial kind="polishedMetal" color={COFFEE.brass} quality={quality} />
      </mesh>
      <Ring r={.145} tube={.02} position={[0, -.095, 0]} color={COFFEE.ivory} quality={quality} />
    </group>
    {assembled > .001 && <group position={CUP_BASE}
      rotation-z={sway * .045} scale={[1 + sway * .035, 1 - sway * .045, 1 + sway * .035]}>
      <ToyAssembly progress={assembled} parts={[
        {id: 'dish', position: [0, -.015, 0], offset: [0, -.1, .16], arc: .14,
          children: <mesh><cylinderGeometry args={[.68, .56, .07, 42]} />
            <ToyMaterial kind="metal" color={COFFEE.brass} quality={quality} /></mesh>},
        {id: 'shell', position: [0, .01, 0], offset: [0, -.52, -.55], spin: [-.55, -.35, 0],
          delay: .03, arc: .38, children: <CupShell quality={quality} />},
        {id: 'handle', position: [.88, .64, -.025], offset: [-1.14, -.3, -.18],
          spin: [1.25, 0, -.9], delay: .15, arc: .4, children: <Handle quality={quality} />},
        {id: 'stamp', position: [0, .67, .765], offset: [0, .69, -.21], delay: .23,
          arc: .2, children: <CoffeeStamp position={[0, 0, 0]} size={.095} quality={quality} />},
      ]} />
      {frame > 265 && frame < 647 && <group position-y={.62 + .38 * soft(frame, 265, 292)
        - .38 * soft(frame, 610, 646)}>{children}</group>}
    </group>}
    {frame >= 706 && <group position={[.3, .3 + tinyY, .47]} scale={.19}
      rotation-z={cupTilt}>
      <CupShell quality={quality} />
      <HandleAt quality={quality} />
      <mesh position-y={1.01}>
        <cylinderGeometry args={[.75, .75, .045, 24]} />
        <ToyMaterial kind="food" color={COFFEE.crema} quality={quality} />
      </mesh>
    </group>}
  </group>;
}

function HandleAt({quality}: {quality: ToyboxQuality}) {
  return <group position={[.88, .64, 0]}><Handle quality={quality} /></group>;
}

export function CoffeeTerrace({frame, quality}: {frame: number; quality: ToyboxQuality}) {
  const parasolX = -.19;
  const parasolZ = -.18;
  const stir = Math.sin(frame * .079);
  return <group>
    <mesh receiveShadow>
      <cylinderGeometry args={[.718, .71, .041, 48]} />
      <ToyMaterial kind="food" color={COFFEE.crema} quality={quality} />
    </mesh>
    <Ring r={.63} tube={.025} position={[0, .031, 0]} color="#e7b579" quality={quality} />
    <Ring r={.511} tube={.008} position={[0, .027, 0]} color="#edc88c" quality={quality} />
    <ToyBox quality={quality} position={[-.12, .038, -.032]} size={[.87, .037, .68]} radius={.016}>
      <ToyMaterial kind="wood" color="#e8ba8c" quality={quality} />
    </ToyBox>
    {Array.from({length: 7}, (_, i) => <ToyBox quality={quality} key={i} position={[-.12, .058, -.31 + i * .092]}
      size={[.832, .026, .082]} radius={.012}>
      <ToyMaterial kind="wood" color={i % 2 ? '#dbad7c' : '#efc99a'} quality={quality} />
    </ToyBox>)}
    <group position={[parasolX, .06, parasolZ]} rotation-z={stir * .018}>
      <mesh position-y={.25}>
        <cylinderGeometry args={[.011, .016, .5, 12]} />
        <ToyMaterial kind="metal" color={COFFEE.brass} quality={quality} />
      </mesh>
      {Array.from({length: 8}, (_, i) => <mesh key={i} position-y={.466} rotation-y={i * Math.PI / 4}>
        <cylinderGeometry args={[.046, .262, .096, 5, 1, false, 0, Math.PI / 4]} />
        <ToyMaterial kind="fabric" color={i % 2 ? COFFEE.ivory : COFFEE.enamel} quality={quality} />
      </mesh>)}
      <mesh position-y={.528}>
        <sphereGeometry args={[.018, 12, 8]} />
        <ToyMaterial kind="metal" color={COFFEE.brass} quality={quality} />
      </mesh>
    </group>
    {[[.19, .04], [-.35, .16]].map(([x, z], i) => <group key={i} position={[x, .065, z]}>
      <mesh position-y={.084}>
        <cylinderGeometry args={[.012, .024, .168, 12]} />
        <ToyMaterial kind="metal" color={COFFEE.base} quality={quality} />
      </mesh>
      <mesh position-y={.167}>
        <cylinderGeometry args={[.109, .095, .031, 20]} />
        <ToyMaterial kind="paintedWood" color={COFFEE.ivory} quality={quality} />
      </mesh>
      {[-1, 1].map((side) => <group key={side} position-x={side * .146}>
        <ToyBox quality={quality} position={[0, .069, 0]} size={[.073, .035, .085]} radius={.015}>
          <ToyMaterial kind="paintedWood" color={i === 0 ? '#228b78' : '#dc8644'} quality={quality} />
        </ToyBox>
        <ToyBox quality={quality} position={[side * .036, .111, 0]} size={[.027, .102, .086]} radius={.009}>
          <ToyMaterial kind="paintedWood" color={i === 0 ? '#228b78' : '#dc8644'} quality={quality} />
        </ToyBox>
        <ToyBox quality={quality} position={[0, .027, 0]} size={[.037, .054, .042]} radius={.008}>
          <ToyMaterial kind="metal" color={COFFEE.base} quality={quality} />
        </ToyBox>
      </group>)}
      <group position={[0, .185, -.024]} scale={.039}>
        <CupShell quality={quality} />
        <HandleAt quality={quality} />
      </group>
    </group>)}
  </group>;
}
