import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {PostalStreet} from './clay-examples/PostalStreet';

const ClayDemo = () => (
  <Composition
    id="ClayPostalStreet"
    component={PostalStreet}
    width={1080}
    height={1920}
    fps={30}
    defaultProps={{mode: 'stop-motion', quality: 'final', seed: 17}}
    durationInFrames={360}
  />
);

registerRoot(ClayDemo);
