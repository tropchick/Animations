import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ROUND} from '../bear/Overlay';
import data from './cues.json';
import {E,shotAt,clamp,ramp,smooth,mix} from './timing';
export {ROUND};
const CREAM='#fff1d2',GOLD='#ffd16b',INK='#142e3a';
const plate:React.CSSProperties={fontFamily:ROUND,fontWeight:800,background:CREAM,color:INK,borderRadius:24,padding:'15px 28px',boxShadow:'0 9px 0 #122b3880,0 18px 38px #0004',display:'inline-block'};
const words=data.words as [number,number,string,number][];
// Same word-timing karaoke method and Rubik plates as bear/Overlay, with non-overlapping groups.
export const Captions:React.FC<{v:number;calm:boolean}>=({v,calm})=>{
 const groups=data.groups as number[];
 const g=groups.find(n=>{const w=words.filter(x=>x[3]===n);const next=words.find(x=>x[3]===n+1);return v>=w[0][0]-.02&&v<Math.min(w[w.length-1][1]+.13,(next?.[0]??1e9)-.055)});
 if(g===undefined||v<7.4||v>=55.2)return null;
 const ws=words.filter(x=>x[3]===g),start=ws[0][0]-.02;const next=words.find(x=>x[3]===g+1);const end=Math.min(ws[ws.length-1][1]+.13,(next?.[0]??1e9)-.055);const enter=clamp((v-start)/.1),exit=clamp((end-v)/.06);const transition=g%3;
 return <div style={{position:'absolute',left:108,right:108,top:calm?1700:1490,textAlign:'center',opacity:Math.min(enter+.4,1)*exit,transform:transition===0?`translateY(${(1-enter)*15}px)`:transition===1?`scale(${.965+.035*enter})`:`translateX(${(1-enter)*-18}px)`}}><div style={{fontFamily:ROUND,fontWeight:700,fontSize:55,lineHeight:1.18,color:'#fff8e7',background:'#0b1c29e8',border:'2px solid #c8e7e51f',borderRadius:24,padding:'18px 24px',boxShadow:'0 12px 30px #0005'}}>{ws.map((w,i)=><span key={i} style={{color:v>=w[0]-.015&&v<w[1]+.04?GOLD:'#fff8e7'}}>{w[2]}{i<ws.length-1?' ':''}</span>)}</div></div>
};
export const Overlay:React.FC<{v:number}>=({v})=>{const s=shotAt(v),calm=v>=21.85&&v<29.05;const story=v<7.4?0:v<21.85?1:v<39.9?2:3;const accent=story===1?'#f3b85c':story===2?'#9bd1c8':'#91dee9';const hook=s.name.startsWith('hook');let title:string|null=null;if(s.name==='hookBus')title='…высунул голову\nв тоннеле?';if(s.name==='hookStorm')title='…попал\nв торнадо?';if(s.name==='hookBeam')title='…сунул голову\nв ускоритель?';
 if(s.name==='black'||s.name==='flash')return null;
 const hud=story===1?(s.name==='busEdge'?'До стены: 30 см':'60 км/ч'):story===2?(v<32.45?'Ветер 200 км/ч':null):'Протоны 76 ГэВ';
 const flashTimes=[E.hookHit,E.hookBeam,E.busHit,E.lamp,E.beam];const flash=Math.max(0,...flashTimes.map(t=>v>=t&&v<t+.1?.35*(1-(v-t)/.1):0));
 return <>
 <AbsoluteFill style={{pointerEvents:'none',background:'linear-gradient(180deg,#03131c55 0%,transparent 28%,transparent 67%,#020e1b88 100%)'}}/>
 {story>0&&v<55.2?<div style={{position:'absolute',top:130,left:106,right:106,textAlign:'center'}}><div style={{...plate,fontSize:39,padding:'14px 24px',borderRadius:99,background:accent}}>ИСТОРИЯ {story} · {['','ТОННЕЛЬ','ТОРНАДО','УСКОРИТЕЛЬ'][story]}</div></div>:null}
 {hud&&v<55.2&&story>0&&s.name!=='busSign'?<div style={{position:'absolute',top:235,left:110,color:CREAM,fontFamily:ROUND,fontSize:38,fontWeight:700,padding:'12px 21px',border:'2px solid #d5eee448',borderRadius:16,background:'#0b2436b8'}}>{hud}</div>:null}
 {title?<div style={{position:'absolute',top:160,left:108,right:108,textAlign:'center',transform:s.index%2?`translateX(${(1-smooth(s.t,0,.12))*-20}px)`:`scale(${1+.055*(1-smooth(s.t,0,.13))})`}}><div style={{...plate,fontSize:68,lineHeight:1.08,whiteSpace:'pre-line',padding:'23px 30px'}}>{title}</div></div>:null}
 {s.name==='hookBus'?<div style={{position:'absolute',top:1455,left:110,right:110,textAlign:'center',color:CREAM,fontFamily:ROUND,fontWeight:800,fontSize:48}}>Три реальные истории</div>:null}
 {s.name==='busEdge'?<div style={{position:'absolute',top:1240,left:110,right:110,textAlign:'center'}}><div style={{...plate,fontSize:48,background:'#e4b86b'}}>Голова снаружи: 40 см</div></div>:null}
 {s.name==='busHit'&&v>14.25&&v<15.95?<div style={{position:'absolute',top:1190,left:110,right:110,textAlign:'center',opacity:clamp((15.95-v)/.12)}}><div style={{...plate,fontSize:52}}>Как с пятого этажа</div></div>:null}
 {calm&&v<25.9?<div style={{position:'absolute',top:570,left:110,right:110,textAlign:'center',color:CREAM,fontFamily:ROUND,fontSize:37,fontWeight:700,textShadow:'0 3px 12px #000'}}>Миссури · 2006<br/><span style={{fontSize:35}}>Мэтт Сутер, 19 лет</span></div>:null}
 {s.name==='flight'?<div style={{position:'absolute',left:110,right:110,top:1070,textAlign:'center',fontFamily:ROUND,color:CREAM,fontWeight:800}}><div style={{fontSize:142,letterSpacing:-6}}>{Math.round(398*smooth(v,E.countStart,E.countEnd))}<span style={{fontSize:62,letterSpacing:0}}> м</span></div><div style={{fontSize:36,color:'#acd2d6',marginTop:5}}>без сознания над полем</div><div style={{height:7,background:'#426976',marginTop:25,borderRadius:5}}><div style={{height:7,width:`${ramp(v,E.countStart,E.countEnd)*100}%`,background:'#d2f4e3',borderRadius:5}}/></div></div>:null}
 {s.name==='record'?<div style={{position:'absolute',top:330,left:110,right:110,textAlign:'center'}}><div style={{...plate,fontSize:60,background:'#dbdfa9'}}>Мировой рекорд</div><div style={{fontFamily:ROUND,fontWeight:700,fontSize:36,color:CREAM,marginTop:23,textShadow:'0 4px 12px #000'}}>398 м · Мэтт Сутер</div></div>:null}
 {(s.name==='labHall'||s.name==='labOpen')&&v<42?<div style={{position:'absolute',top:1200,left:110,right:110,textAlign:'center'}}><div style={{...plate,fontSize:40}}>Протвино · 1978<br/><span style={{fontSize:39}}>Анатолий Бугорский</span></div></div>:null}
 {s.name==='dose'?<div style={{position:'absolute',left:110,right:110,top:1060,textAlign:'center',fontFamily:ROUND,color:CREAM}}><div style={{fontSize:75,fontWeight:800}}>Доза ≈ 2000 Гр</div><div style={{fontSize:36,fontWeight:600,marginTop:14,lineHeight:1.25}}>Смертельная для всего тела: ≈ 5 Гр</div><div style={{...plate,fontSize:37,marginTop:22,background:'#a3dce1'}}>Здесь — только тонкий пучок</div></div>:null}
 {s.name==='after'?<div style={{position:'absolute',top:1130,left:110,right:110,textAlign:'center'}}><div style={{...plate,fontSize:40,background:'#bdd9dc'}}>Паралич левой половины лица<br/>Потеря слуха слева</div></div>:null}
 <Captions v={v} calm={calm}/>
 {flash>0?<AbsoluteFill style={{background:'#dff9ff',opacity:flash}}/>:null}
 </>};
