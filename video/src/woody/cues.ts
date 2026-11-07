// Timing for the Woody VPN ad banner (1920×960, green screen, 7 s).
// Voice: ONE ElevenLabs v4 take (VASKO), audio/voice/woody-vo.mp3, word times audio/voice/woody-words.json.
// The take is sped up by TEMPO and starts at LEAD, so a word at voice time w plays at LEAD + w / TEMPO.
export const FPS = 30;
export const LEAD = 0.1;
export const TEMPO = 1.04;
export const DURATION_S = 7.0;
export const FRAMES = Math.round(DURATION_S * FPS);

const v = (w: number) => LEAD + w / TEMPO;

export const CUE = {
  woody: v(0.0), // «Вуди»
  vpn: v(0.5), // «ВПН»
  vsego: v(1.34), // «всего»
  n99: v(1.72), // «девяносто девять» -> the 99 slams down
  rub: v(2.5), // «рублей» -> ₽
  month: v(3.4), // «в месяц» -> red tag
  cheaper: v(4.1), // «Дешевле» -> stamp slams
  shawa: v(4.65), // «шаурмы» -> emoji pops
  link: v(5.68), // «Ссылка в профиле» -> button
};
