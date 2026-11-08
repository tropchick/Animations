import React from 'react';
import {Ball,Pill,RBox,Ring,Cyl,Line} from './common';
import {V3,clamp,hash,smooth} from './timing';
const bone='#edf9ee';
const BL={basic:true};
const BLUE={basic:true,opacity:.19};
// Anatomical insert uses the original human rig's head and torso dimensions.
export const Skull:React.FC<{cracks?:number;brain?:number;beam?:boolean}>=({cracks=0,brain=0,beam=false})=><group>
 <Ball scale={[.143,.15,.139]} color={bone} look={{...BL,opacity:brain>0?.34:1}} seg={40}/>
 <Ball position={[0,-.076,.068]} scale={[.11,.078,.09]} color={bone} look={BL}/>
 {[-1,1].map(s=><group key={s}><Ball position={[s*.057,-.02,.121]} scale={[.041,.043,.026]} color="#102c45" look={BL}/><Ball position={[s*.098,-.061,.095]} scale={[.027,.021,.022]} color={bone} look={BL}/></group>)}
 <Ball position={[0,-.065,.146]} scale={[.018,.025,.012]} color="#173448" look={BL}/>
 <RBox position={[0,-.122,.071]} size={[.14,.025,.107]} r={.012} color={bone} look={BL}/>
 {Array.from({length:8},(_,i)=><RBox key={i} position={[(i-3.5)*.015,-.092,.135-Math.abs(i-3.5)*.003]} size={[.012,.027,.019]} r={.004} color="#fffde8" look={BL}/>)}
 {brain>0?<group position={[.011*Math.sin(brain*26),.035,.004]}>{[-1,1].map(s=><Ball key={s} position={[s*.042,0,0]} scale={[.055,.075,.105]} color="#b1d6f0" look={{basic:true,opacity:.8}}/>)}{Array.from({length:9},(_,i)=><Ring key={i} position={[(i%3-1)*.037,.055,-.052+Math.floor(i/3)*.043]} rotation={[.7,0,i*.4]} scale={[1,.6,1]} r={.025} tube={.006} color="#edf5ff" look={BL}/>)}</group>:null}
 {cracks>0?Array.from({length:4},(_,j)=>{const n=Math.max(2,Math.round(clamp(cracks-j*.12)*9));const pts=Array.from({length:n},(_,i)=>{const theta=.9-i*.17; const phi=.2+j*.46+(i%2)*.08;return [.147*Math.sin(theta)*Math.cos(phi),.153*Math.sin(phi),.143*Math.cos(theta)*Math.cos(phi)] as V3});return <Line key={j} points={pts} color="#092c50" r={.0018}/> }):null}
 <Ball scale={[.174,.178,.173]} color="#3eacff" look={BLUE} seg={40}/>
 <Ball position={[0,-.04,.177]} scale={[.027,.034,.028]} color="#5cbdff" look={{basic:true,opacity:.22}}/>
 {beam?<group><Pill rotation={[Math.PI/2,0,0]} position={[0,-.025,0]} len={1.5} r={.004} color="#fffde6" look={BL}/><Pill rotation={[Math.PI/2,0,0]} position={[0,-.025,0]} len={1.5} r={.013} color="#77f9f4" look={{basic:true,opacity:.3}}/></group>:null}
</group>;
export const XBody:React.FC<{bend?:number;cracks?:number;brain?:number;beam?:boolean;arms?:boolean}>=({bend=0,cracks=0,brain=0,beam=false,arms=true})=><group>
 <Pill position={[0,.92,0]} r={.165} len={.28} color="#268ef9" look={{basic:true,opacity:.13}}/>
 <Ball position={[0,.67,0]} scale={[.17,.12,.11]} color="#61baff" look={{basic:true,opacity:.16}}/>
 {Array.from({length:13},(_,i)=>{const y=.7+i*.038;const k=clamp((y-1.03)/.15);return <group key={i} position={[-bend*.08*k*k,y,-.025]} rotation={[0,0,bend*k]}><Cyl rt={.027} rb={.031} h={.024} color={bone} look={BL}/><Ball position={[0,0,-.025]} scale={[.015,.009,.025]} color={bone} look={BL}/></group>})}
 {Array.from({length:7},(_,i)=><Ring key={i} position={[0,.82+i*.035,0]} rotation={[Math.PI/2,0,0]} scale={[1,.66,1]} r={.11-Math.abs(i-3)*.006} tube={.007} color={bone} look={{basic:true,opacity:.58}}/>)}
 <group position={[0,1.185,0]} rotation={[-bend*.22,0,bend]}><group position={[0,.152,.01]}><Skull cracks={cracks} brain={brain} beam={beam}/></group></group>
 {arms?[-1,1].map(s=><group key={s} position={[s*.2,1.085,0]} rotation={[.05,0,s*.25]}><Pill position={[0,-.21,0]} len={.34} r={.058} color="#329bff" look={{basic:true,opacity:.18}}/><Pill position={[0,-.21,0]} len={.33} r={.015} color={bone} look={BL}/></group>):null}
</group>;
