import {makeShow} from '../chess/cues';
import CUES from './cues.json';

// «Шахматный разбор: Человек-рифма» — a sketch: a masked hero in a top hat answers every insult with a rhyme.
export const RIFMA = makeShow(
  {
    id: 'rifma',
    label: 'ЧЕЛОВЕК-РИФМА',
    footH: 720,
    white: {name: 'ЧЕЛОВЕК-РИФМА', short: 'Рифма', gen: 'Человека-рифмы', avatar: 'rifma'},
    black: {name: 'ГЛАВАРЬ', short: 'Главарь', gen: 'Главаря', glyphs: '♜', avatars: ['boss']},
    pieces: {'Человек-рифма': '♔', 'Главарь': '♜'},
    awards: [
      ['Игрок матча', 'Человек-рифма ♔'],
      ['Лучший ход', '«Х**ркуль!»'],
      ['Худший ход', '«Упал»'],
    ],
    finalLine: 'Рифма есть всегда. Аура — не всегда.',
    cover: {title: ['Человек-рифма'], sub: 'Разбор партии: мат на 14-м ходу'},
  },
  CUES,
);
