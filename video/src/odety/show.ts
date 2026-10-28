import {makeShow} from '../chess/cues';
import CUES from './cues.json';

// «Шахматный разбор: А по факту мы оба одеты» — «Гуляй, Вася!» (2017): at a village feast the bride's brother
// argues with her city fiancé that progress made everyone equal. The game ends in a draw over a toast.
export const ODETY = makeShow(
  {
    id: 'odety',
    label: 'А ПО ФАКТУ МЫ ОБА ОДЕТЫ',
    footH: 608,
    white: {name: 'БРАТ', short: 'Брат', gen: 'Брата', avatar: 'brother'},
    black: {name: 'ЖЕНИХ', short: 'Жених', gen: 'Жениха', glyphs: '♚', avatars: ['groom']},
    pieces: {Брат: '♔', Жених: '♚'},
    awards: [
      ['Игрок матча', 'Оба ♔♚'],
      ['Лучший ход', '«А по факту мы оба одеты»'],
      ['Худший ход', '«Была. 4 года назад умерла»'],
    ],
    finalLine: 'Рубашки разные. Счёт одинаковый.',
    cover: {title: ['А по факту', 'мы оба одеты'], sub: 'Разбор партии: ничья на 14-м ходу'},
  },
  CUES,
);
