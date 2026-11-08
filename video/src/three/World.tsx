import React from 'react';
import {shotAt,E} from './timing';
import {BusRide,BusImpact,BusInside,BusSign} from './Bus';
import {StormCover,StormExterior,StormInterior,StormLamp,Flight,Field} from './Storm';
import {LabHall,LabBeam,Aftermath,Diploma} from './Lab';
export const World:React.FC<{v:number;panel?:'bus'|'storm'|'lab';interior?:boolean}>=({v,panel,interior})=>{
 if(panel==='bus')return <BusImpact v={E.busHit-.015} cover/>;
 if(panel==='storm')return <StormCover/>;
 if(panel==='lab')return <LabBeam v={E.beam+.02} cover/>;
 const s=shotAt(v).name;
 switch(s){
 case 'hookBus':return v<.7?<BusRide v={v} hook/>:<BusImpact v={13.4+Math.min(.5,(v-.7)*.22)}/>;
 case 'hookStorm':return <StormExterior v={29.05+(v-2.8)*1.7}/>;
 case 'hookBeam':return <LabBeam v={v} time={4.55}/>;
 case 'busRide':return <BusRide v={v}/>;
 case 'busEdge':return <BusRide v={v} edge/>;
 case 'busHit':return <BusImpact v={v}/>;
 case 'busInside':return <BusInside v={v}/>;
 case 'busSign':return <BusSign v={v}/>;
 case 'stormCalm':return interior?<StormInterior v={v} calm/>:<StormExterior v={v} calm/>;
 case 'stormBreak':return v<29.05?(interior?<StormInterior v={v}/>:<StormExterior v={v}/>):v<29.55?<StormInterior v={v}/>:<StormExterior v={v}/>;
 case 'stormLamp':return <StormLamp v={v}/>;
 case 'flight':return <Flight v={v}/>;
 case 'wake':return <Field v={v}/>;
 case 'walk':case 'record':return <Field v={v} walk={s==='walk'} record={s==='record'}/>;
 case 'labHall':case 'labOpen':return <LabHall v={v} open={s==='labOpen'}/>;
 case 'labBeam':case 'dose':return <LabBeam v={v} dose={s==='dose'}/>;
 case 'after':return <Aftermath v={v}/>;
 case 'diploma':return <Diploma v={v}/>;
 default:return <><color attach="background" args={[s==='flash'?'#e8faff':'#01070b']}/></>;
 }
};
