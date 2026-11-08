import React,{useMemo} from 'react';
import * as THREE from 'three';
import {Eye,Brow,Spot} from '../bear/face';
import {Hair,faceStyle} from '../bear/People';
import {Ball,Line,SCI} from './common';
// Same soft bear face and hair; only the patient's left hemisphere changes shape.
export const AffectedHead:React.FC<{swelling:number;blink:number}>=({swelling:k,blink})=>{
 const geo=useMemo(()=>{const g=new THREE.SphereGeometry(.16,48,40),a=g.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),w=Math.max(0,Math.min(1,-x/.06));a.setXYZ(i,x*(1+.8*k*w),y*(1+.13*k*w),z*(1+.2*k*w));}g.computeVertexNormals();return g},[k]);
 const st=faceStyle(SCI,.16),e={lidL:.45*k,lidR:blink,browIn:.12,mouth:0,blush:0};
 return <group><mesh geometry={geo} castShadow><meshStandardMaterial color={SCI.skin} roughness={.65}/></mesh><group position={[-.025*k,0,0]} scale={[1+.25*k,1+.035*k,1]}><Hair o={SCI} R={.16} p={{}}/></group>{([-1,1] as const).map(side=><group key={side} scale={side===-1?[1+.8*k,1+.13*k,1+.2*k]:[1,1,1]}><Eye s={st} side={side} e={e}/><Brow s={st} side={side} e={e}/><Ball position={[side*.157,-.008,-.008]} scale={[.021,.032,.016]} color={SCI.skin}/></group>)}<Spot yaw={0} pitch={-.27} r={.155}><Ball scale={[.0136,.0112,.0128]} color={SCI.skin}/></Spot><Line points={[[-.029*(1+.7*k),-.087-.026*k,.135*(1+.16*k)],[-.012,-.087-.007*k,.139],[.015,-.086,.139],[.03,-.084,.133]]} color="#88504a" r={.003}/></group>
};
