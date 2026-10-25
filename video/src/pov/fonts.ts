import '@fontsource/spectral/400.css';
import '@fontsource/spectral/500-italic.css';
import '@fontsource/spectral/700.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/800.css';
import {continueRender, delayRender} from 'remotion';

// Wait for the Cyrillic parts of the fonts too (they load only when Cyrillic text is requested).
const handle = delayRender('Loading fonts');
const RU = 'ПОВ: ты Мистер Бист ПОТРАЧЕНО СЕГОДНЯ ёщ $0123456789';
Promise.all([
  document.fonts.load("400 84px 'Spectral'", RU),
  document.fonts.load("700 84px 'Spectral'", RU),
  document.fonts.load("italic 500 62px 'Spectral'", RU),
  document.fonts.load("500 21px 'Inter'", RU),
  document.fonts.load("600 30px 'Inter'", RU),
  document.fonts.load("800 30px 'Inter'", RU),
])
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));
