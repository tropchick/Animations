import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {World} from './three/World';
import {ROUND} from './three/Overlay';
import {clamp} from './three/timing';
export const Triptych:React.FC<{mode?:'cover'|'truth'|'end';v?:number}>=({mode='cover',v=0})=><AbsoluteFill style={{background:'#102e3d'}}>
 {(['bus','storm','lab'] as const).map((panel,i)=><div key={panel} style={{position:'absolute',top:i*640,width:1080,height:634,overflow:'hidden'}}><ThreeCanvas width={1080} height={634} flat shadows gl={{logarithmicDepthBuffer:true,antialias:true}} camera={{fov:40,position:[0,1.6,2]}}><World v={0} panel={panel}/></ThreeCanvas><AbsoluteFill style={{background:'linear-gradient(90deg,#061b2b55,transparent 35%,#061b2b22),linear-gradient(0deg,#05162288,transparent 38%)'}}/><div style={{position:'absolute',left:110,top:38,color:'#fff0d3',fontFamily:ROUND,fontWeight:800,fontSize:38,letterSpacing:2}}>{['ТОННЕЛЬ','ТОРНАДО','УСКОРИТЕЛЬ'][i]}</div>{mode==='truth'?<div style={{position:'absolute',right:120,top:280,color:'#ffedc6',fontFamily:ROUND,fontWeight:800,fontSize:64,border:'7px solid #ffedc6',borderRadius:12,padding:'10px 21px',transform:`rotate(${i%2?6:-6}deg) scale(${1+.15*(1-clamp((v-5.4-i*.08)/.12))})`,background:'#13313dab'}}>ПРАВДА</div>:null}</div>)}
 {mode==='cover'?<div style={{position:'absolute',left:110,right:110,top:545,textAlign:'center',fontFamily:ROUND,fontWeight:800,color:'#142c38',fontSize:81,lineHeight:1.05,background:'#fff0d1',borderRadius:28,padding:'24px 20px 30px',boxShadow:'0 12px 0 #112b3b99,0 25px 45px #0007',transform:'rotate(-2deg)'}}>Что если<br/>человек…</div>:null}
 {mode==='truth'?<div style={{position:'absolute',top:130,left:110,right:110,textAlign:'center',fontFamily:ROUND,fontSize:50,fontWeight:800,color:'#fff0d2',textShadow:'0 4px 15px #000'}}>Всё — по реальным случаям</div>:null}
 {mode==='end'?<div style={{position:'absolute',left:110,right:110,top:760,textAlign:'center',fontFamily:ROUND,fontWeight:800,color:'#142c38',fontSize:68,lineHeight:1.13,background:'#fff0d1',borderRadius:28,padding:'32px 30px 38px',boxShadow:'0 12px 0 #112b3b99,0 25px 45px #0007',transform:`scale(${.98+.02*clamp((v-55.2)/.2)})`}}>Какую историю<br/>сделать следующей?</div>:null}
</AbsoluteFill>;
export const ThreeCover:React.FC=()=> <Triptych/>;
