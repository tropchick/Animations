import React from 'react';
import {shotAt} from './cues';
import {Build, RaftShot} from './scenes4';
import {Plaza, RoomShot} from './scenes1';
import {Block, BusCab, Cockpit, Empty, JumpShot, Office, Police} from './scenes2';
import {Earth, FloodShot, GatorShot, Miami, PenguinShot} from './scenes3';

// picks the scene for story time v
export const Scene: React.FC<{v: number}> = ({v}) => {
  const s = shotAt(v);
  const p = {v, t: s.t, k: s.k, d: s.d};
  switch (s.name) {
    case 'hook':
      return <Plaza {...p} />;
    case 'hook2':
      return <Plaza {...p} close />;
    case 'block':
      return <Block {...p} />;
    case 'heat':
      return <Block {...p} hot />;
    case 'empty':
      return <Empty {...p} />;
    case 'bus':
      return <BusCab {...p} />;
    case 'cockpit':
      return <Cockpit {...p} />;
    case 'office':
      return <Office {...p} />;
    case 'jump':
      return <JumpShot {...p} />;
    case 'police':
      return <Police {...p} />;
    case 'earth':
      return <Earth {...p} />;
    case 'penguin':
      return <PenguinShot {...p} />;
    case 'miami':
      return <Miami {...p} />;
    case 'raft':
      return <RaftShot {...p} />;
    case 'pc':
      return <RaftShot {...p} close />;
    case 'build':
      return <Build {...p} />;
    case 'room':
      return <RoomShot {...p} />;
    case 'flood':
      return <FloodShot {...p} />;
    case 'gator':
      return <GatorShot {...p} />;
    default:
      return <Plaza {...p} />;
  }
};
