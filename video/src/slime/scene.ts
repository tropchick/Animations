import {createContext, useContext} from 'react';

// What a later episode changes in the episode 1 sets (the hall, the recorder, the counter).
// Episode 1 renders without it.
export type SceneState = {
  v: number; // the episode's own time, for screens that animate
  log: number;
  clock: string;
  voice: number[];
  counter?: string; // text instead of the unit count
  jarSink: number; // metres the jar has sunk into the desk
  deskPatch: number; // radius of the grey patch on the desk around the jar
  deskGone: boolean;
  redLamp: boolean; // the lock lamp over the hall door (outside)
  corridorOutside: boolean;
};

export const SceneContext = createContext<SceneState | null>(null);
export const useScene = () => useContext(SceneContext);
