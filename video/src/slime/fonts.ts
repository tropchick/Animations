import '@fontsource/spectral/300.css';
import '@fontsource/spectral/400.css';
import '@fontsource/spectral/500-italic.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import {continueRender, delayRender} from 'remotion';

// Wait for the Cyrillic parts of the fonts too (they load only when Cyrillic text is requested).
const handle = delayRender('Loading fonts');
const RU = 'ЗАПИСЬ ОБРАЗЦОВ ХРОНИКА СЛИЗИ уж';
Promise.all([
  document.fonts.load("300 84px 'Spectral'", RU),
  document.fonts.load("400 84px 'Spectral'", RU),
  document.fonts.load("italic 500 34px 'Spectral'", RU),
  document.fonts.load("400 30px 'IBM Plex Mono'", RU),
  document.fonts.load("500 30px 'IBM Plex Mono'", RU),
])
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));
