import {makeShow} from '../chess/cues';
import CUES from './cues.json';

// «Шахматный разбор: Я пришиваться пришёл» — «Слово пацана»: Андрей in a coat asks to join Универсам on the hockey
// box; Турбо and Зима question him, make him fight Марат (who brought him) and shake his hand.
export const PALTO = makeShow(
  {
    id: 'palto',
    label: 'СЛОВО ПАЦАНА',
    footH: 710,
    white: {name: 'АНДРЕЙ', short: 'Андрей', gen: 'Андрея', avatar: 'andrey'},
    black: {name: 'УНИВЕРСАМ', short: 'Универсам', gen: 'Универсама', glyphs: '♜♛', avatars: ['turbo', 'zima']},
    pieces: {Андрей: '♔', Марат: '♘', Турбо: '♜', Зима: '♛'},
    awards: [
      ['Игрок матча', 'Андрей ♔'],
      ['Лучший ход', '«Надоело быть чушпаном»'],
      ['Худший ход', '«У меня музыкалка была»'],
    ],
    finalLine: 'Пришёл в пальто. Ушёл Пальто.',
    cover: {title: ['Я пришиваться пришёл'], size: 72, sub: 'Разбор партии: мат на 20-м ходу'},
  },
  CUES,
);
