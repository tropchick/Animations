import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/600-italic.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/700.css';
import {continueRender, delayRender} from 'remotion';

// Wait for the web fonts so no frame (and no canvas sign or phone screen) renders with a fallback font.
const handle = delayRender('Loading fonts');
Promise.all([
  document.fonts.load("500 34px 'Inter'"),
  document.fonts.load("600 34px 'Inter'"),
  document.fonts.load("italic 600 56px 'Inter'"),
  document.fonts.load("700 36px 'Inter'"),
  document.fonts.load("800 60px 'Inter'"),
  document.fonts.load("900 76px 'Inter'"),
  document.fonts.load("500 34px 'IBM Plex Mono'"),
  document.fonts.load("700 64px 'IBM Plex Mono'"),
])
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));
