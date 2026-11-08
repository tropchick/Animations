import React from 'react';
import {AbsoluteFill,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {ThreeCover,Triptych} from './ThreeCover';
import {World} from './three/World';
import {Overlay} from './three/Overlay';
import {shotAt} from './three/timing';
export const ThreeStories:React.FC<{withAudio?:boolean;at?:number;clean?:boolean}>=({withAudio=true,at,clean=false})=>{const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();const v=at??Math.max(0,(frame-1)/fps),s=shotAt(v);const split=v>=21.85&&v<29.05;return <AbsoluteFill style={{background:'#193541'}}>{frame===0&&at===undefined?<ThreeCover/>:s.name==='truth'||s.name==='end'?<Triptych mode={s.name==='truth'?'truth':'end'} v={v}/>:<>{split?<>{[false,true].map((inside,i)=><div key={i} style={{position:'absolute',top:i?1200:0,left:0,width,height:720}}><ThreeCanvas width={width} height={720} flat shadows gl={{logarithmicDepthBuffer:true,antialias:true}} camera={{fov:40,position:[0,1.6,2]}}><World v={v} interior={inside}/></ThreeCanvas></div>)}<div style={{position:'absolute',top:650,height:620,width,background:'linear-gradient(180deg,transparent,#193541 18%,#193541 88%,transparent)'}}/></>:<ThreeCanvas width={width} height={height} flat shadows gl={{logarithmicDepthBuffer:true,antialias:true}} camera={{fov:40,position:[0,1.6,2]}}><World v={v}/></ThreeCanvas>}{clean?null:<Overlay v={v}/>} </>}{withAudio?<Audio src={staticFile('audio/three-stories.wav')}/>:null}</AbsoluteFill>};
