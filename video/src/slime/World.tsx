import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {Color, Fog, PMREMGenerator} from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {shotAt} from './cues';
import {Hall} from './Hall';
import {Corridor} from './Corridor';
import {Macro} from './Macro';
import {CameraRig} from './camera';

export const MACRO_SHOTS = ['grain', 'microscope', 'dust', 'pit', 'rim', 'bottom', 'shock', 'title'];

// Reflections for the steel and glass: a neutral studio room, dimmed and cooled.
const useEnvironment = () => {
  const gl = useThree((s) => s.gl);
  return useMemo(() => {
    const pm = new PMREMGenerator(gl);
    const tex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    return tex;
  }, [gl]);
};

const FOG: Record<string, [string, number, number]> = {
  hall: ['#0a0e13', 3.5, 17],
  corridor: ['#0a0e13', 4, 26],
  macro: ['#06080b', 5, 16],
};

export const World: React.FC<{v: number}> = ({v}) => {
  const env = useEnvironment();
  const s = shotAt(v);
  const set = MACRO_SHOTS.includes(s.name) ? 'macro' : s.name === 'corridor' ? 'corridor' : 'hall';
  const [fc, near, far] = FOG[set];
  const fog = useMemo(() => new Fog(fc, near, far), [fc, near, far]);
  const bg = useMemo(() => new Color(fc), [fc]);
  const scene = useThree((st) => st.scene);
  scene.environment = env;
  scene.environmentIntensity = 0.4;
  scene.fog = fog;
  scene.background = bg;
  return (
    <>
      <CameraRig v={v} />
      {set === 'hall' ? <Hall v={v} shot={s.name} /> : null}
      {set === 'corridor' ? <Corridor /> : null}
      {set === 'macro' ? <Macro v={v} shot={s.name} /> : null}
    </>
  );
};
