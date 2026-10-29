import {makeShow} from '../chess/cues';
import CUES from './cues.json';

export const GENIY = makeShow(
  {
    id: 'geniy',
    label: 'ГЕНИЙ',
    footH: 821,
    footY: 610,
    white: {name: 'КАПИТАН', short: 'Капитан', gen: 'Капитана', avatar: 'cap'},
    black: {name: 'ТОНИ СТАРК', short: 'Старк', gen: 'Старка', glyphs: '♚', avatars: ['tony']},
    pieces: {Капитан: '♔', Старк: '♚', Тор: '♜'},
    drawReason: 'по решению Тора',
    awards: [
      ['Игрок матча', 'Тор ♜'],
      ['Лучший ход', '«Гений, миллиардер, плейбой, филантроп»'],
      ['Худший ход', '«Ты лабораторный эксперимент, Роджерс»'],
    ],
    finalLine: 'Броню сняли. На личности перешли. Победителя не нашли.',
    cover: {title: ['Гений, миллиардер,', 'плейбой, филантроп'], size: 56, sub: 'Разбор партии: ничья на 6-м ходу'},
  },
  CUES,
);
