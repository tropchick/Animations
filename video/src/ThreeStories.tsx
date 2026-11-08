import React from 'react';
import {AbsoluteFill,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {ThreeCover,Triptych} from './ThreeCover';
import {World} from './three/World';
import {Overlay} from './three/Overlay';
import {shotAt} from './three/timing';
export const ThreeStories:React.FC<{withAudio?:boolean;at?:number;clean?:boolean}>=({withAudio=true,at,clean=false})=>{const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();const v=at??Math.max(0,(frame-1)/fps),s=shotAt(v);return <AbsoluteFill style={{background:'#193541'}}>{frame===0&&at===undefined?<ThreeCover/>:s.name==='truth'||s.name==='end'?<Triptych mode={s.name==='truth'?'truth':'end'} v={v}/>:<><ThreeCanvas width={width} height={height} flat shadows gl={{logarithmicDepthBuffer:true,antialias:true}} camera={{fov:40,position:[0,1.6,2]}}><World v={v}/></ThreeCanvas>{clean?null:<Overlay v={v}/>} </>}{withAudio?<Audio src={staticFile('audio/three-stories.wav')}/>:null}</AbsoluteFill>};
