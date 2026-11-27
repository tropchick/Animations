import path from 'node:path';
import {Config} from '@remotion/cli/config';

Config.setChromiumOpenGlRenderer('swangle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);

// The clay demo imports reusable examples from the skill outside video/.
// Leave normal package lookup first, then use this project's installed packages.
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    modules: [...(config.resolve?.modules ?? ['node_modules']), path.resolve('node_modules')],
  },
}));
