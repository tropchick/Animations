import {makeShow} from '../chess/cues';
import CUES from './cues.json';

export const MASHA = makeShow(
  {
    id: 'masha',
    label: 'МАША ПРОТИВ ПАНДЫ',
    footH: 608,
    footY: 610,
    clock: 240,
    white: {name: 'МАША', short: 'Маша', gen: 'Маши', avatar: 'masha'},
    black: {name: 'ПАНДА', short: 'Панда', gen: 'Панды', glyphs: '♚', avatars: ['panda']},
    pieces: {Маша: '♔', Панда: '♚', Медведь: '♜'},
    awards: [
      ['Игрок матча', 'Медведь'],
      ['Лучший ход', 'Метла вместо нравоучений'],
      ['Худший ход', 'Съела всё варенье'],
    ],
    finalLine: 'Маша и Панда спорили. Медведь выиграл ремонт.',
    cover: {title: ['Маша против Панды'], size: 84, sub: 'Разбор партии: мат на 14-м ходу'},
  },
  CUES,
);
