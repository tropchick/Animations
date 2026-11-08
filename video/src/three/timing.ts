export type V3 = [number, number, number];
export const FPS = 30;
export const DURATION = 57;
export const FRAMES = 1711;
export const SHOTS = [
 ['hookBus',0],['hookStorm',2.8],['hookBeam',3.8],['truth',5.4],
 ['busRide',7.4],['busEdge',11.5],['busHit',13.1],['busInside',17.4],['busSign',20.05],
 ['stormCalm',21.85],['stormBreak',28.3],['stormLamp',30.7],['black',32.45],['flight',32.8],['wake',35.65],['walk',37.55],['record',38.65],
 ['labHall',39.9],['labOpen',41.7],['labBeam',44.65],['flash',47.23],['dose',47.6],['after',50.5],['diploma',52.6],['end',55.2],
] as const;
export type Shot = typeof SHOTS[number][0];
export const E = {hookHit:0.7, hookGlass:2.97,hookBeam:4.55, busHit:13.4,brake:17.65, glass:29.05, wall:29.5,roof:30.0,lamp:31.9, black:32.45, countStart:32.85,countEnd:35.45,wake:35.7,step1:37.8,step2:38.27,hatch:42.25,beam:45.9,flash:47.23,ear:51.3,diploma:53.5};
export const clamp=(x:number)=>Math.min(1,Math.max(0,x));
export const ease=(x:number)=>{const k=clamp(x);return k*k*k*(k*(k*6-15)+10)};
export const ramp=(t:number,a:number,b:number)=>clamp((t-a)/(b-a));
export const smooth=(t:number,a:number,b:number)=>ease(ramp(t,a,b));
export const mix=(a:number,b:number,k:number)=>a+(b-a)*k;
export const vlerp=(a:V3,b:V3,k:number):V3=>a.map((x,i)=>mix(x,b[i],k)) as V3;
export const shotAt=(v:number)=>{let i=0;for(let j=0;j<SHOTS.length;j++)if(v>=SHOTS[j][1])i=j;return {name:SHOTS[i][0],start:SHOTS[i][1],end:SHOTS[i+1]?.[1]??DURATION,index:i,t:v-SHOTS[i][1],k:ramp(v,SHOTS[i][1],SHOTS[i+1]?.[1]??DURATION)}};
export const hash=(n:number)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
