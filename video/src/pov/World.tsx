import React from 'react';
import {Bedroom, Hallway} from './Bedroom';
import {HouseFront} from './HouseFront';
import {Field} from './Field';
import {Studio} from './Studio';
import {Beach} from './Beach';
import {EditRoom} from './EditRoom';
import {CameraRig, View, viewOf} from './camera';
import {ShotState, shotAt} from './cues';

// Which set is on screen in which shot. Only the current set is mounted, so every set has its own origin.
const SetFor: React.FC<{v: number; s: ShotState}> = ({v, s}) => {
  switch (s.name) {
    case 'alarm':
    case 'wake':
    case 'phone':
    case 'bed':
    case 'eyes':
    case 'alarm2':
      return <Bedroom v={v} s={s} />;
    case 'cameras':
      return <Hallway v={v} s={s} eye={viewOf(s, v).pos} />;
    case 'door':
    case 'keys':
    case 'crying':
      return <HouseFront v={v} s={s} />;
    case 'field':
    case 'timelapse':
    case 'sleeper':
      return <Field v={v} s={s} />;
    case 'studio':
    case 'lcd':
      return <Studio v={v} s={s} />;
    case 'beach':
    case 'digging':
      return <Beach v={v} s={s} />;
    default:
      return <EditRoom v={v} s={s} />;
  }
};

export const World: React.FC<{v: number; shot?: ShotState; view?: View}> = ({v, shot, view}) => {
  const s = shot ?? shotAt(v);
  return (
    <>
      <CameraRig s={s} v={v} view={view} />
      <SetFor v={v} s={s} />
    </>
  );
};
