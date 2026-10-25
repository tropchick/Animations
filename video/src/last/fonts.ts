import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/spectral/300.css';
import '@fontsource/spectral/400.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import {continueRender, delayRender} from 'remotion';

// Cyrillic parts of the fonts load only when Cyrillic text is requested, so ask for them before the first frame
// (the phone screens draw Inter on a canvas).
const handle = delayRender('Loading fonts');
const RU = 'ПОСЛЕДНИЙ Мама Ты дома? Сообщение доставлено уж';
Promise.all([
  document.fonts.load("400 40px 'Inter'", RU),
  document.fonts.load("500 40px 'Inter'", RU),
  document.fonts.load("600 40px 'Inter'", RU),
  document.fonts.load("300 84px 'Spectral'", RU),
  document.fonts.load("400 84px 'Spectral'", RU),
  document.fonts.load("400 30px 'IBM Plex Mono'", RU),
  document.fonts.load("500 30px 'IBM Plex Mono'", RU),
])
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));
