import {makeShow} from '../chess/cues';
import CUES from './cues.json';

// «Шахматный разбор: Начинающий гопник» — klimkeef's sketch: a rookie gopnik at night tries to get coins out of a
// passer-by, who films him (his voice only).
export const KLIM = makeShow(
  {
    id: 'klim',
    label: 'ПОВ: НАЧИНАЮЩИЙ ГОПНИК',
    footH: 750,
    white: {name: 'KLIMKEEF', short: 'Klimkeef', gen: 'Klimkeef', avatar: 'klim'},
    black: {name: 'ОПЕРАТОР', short: 'Оператор', gen: 'Оператора', glyphs: '♜', avatars: ['chess/av-phone.jpg']},
    pieces: {Klimkeef: '♔', Оператор: '♜'},
    awards: [
      ['Игрок матча', 'Шавуха'],
      ['Лучший ход', '«Помоги, по-братски»'],
      ['Худший ход', '«Старшие поставили сюда»'],
    ],
    finalLine: 'Монет не нащёлкал. Зато нашёл, с кем сходить за шавухой.',
    cover: {title: ['Начинающий гопник'], size: 84, sub: 'Разбор партии: ничья на 16-м ходу'},
  },
  CUES,
);
