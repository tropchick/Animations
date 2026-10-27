import '@fontsource/inter/500.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/spectral/700.css';
import '@fontsource/spectral/600-italic.css';
import '@fontsource/ibm-plex-mono/600.css';
import {continueRender, delayRender} from 'remotion';

// Wait for the web fonts. The sample text is Cyrillic: fonts.load only fetches the subsets its text needs.
const SAMPLE = 'Ход Слобода 0:1 −';
const handle = delayRender('Loading fonts');
Promise.all([
  document.fonts.load("500 36px 'Inter'", SAMPLE),
  document.fonts.load("700 36px 'Inter'", SAMPLE),
  document.fonts.load("800 50px 'Inter'", SAMPLE),
  document.fonts.load("700 62px 'Spectral'", SAMPLE),
  document.fonts.load("italic 600 44px 'Spectral'", SAMPLE),
  document.fonts.load("600 44px 'IBM Plex Mono'", SAMPLE),
])
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));
