import '@fontsource/spectral/400.css';
import '@fontsource/spectral/500-italic.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import {continueRender, delayRender} from 'remotion';

// Wait until the web fonts are ready so no frame renders with a fallback font.
const handle = delayRender('Loading fonts');
Promise.all([
  document.fonts.load("400 84px 'Spectral'"),
  document.fonts.load("italic 500 62px 'Spectral'"),
  document.fonts.load("500 21px 'Inter'"),
  document.fonts.load("600 30px 'Inter'"),
])
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));
