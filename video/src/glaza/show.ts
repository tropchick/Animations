import {makeShow} from '../chess/cues';
import CUES from './cues.json';

export const GLAZA = makeShow(
  {
    id: 'glaza',
    label: 'ГЛАЗА КРАСНЫЕ',
    footH: 855,
    footY: 610,
    white: {name: 'ПОЛИЦЕЙСКИЙ', short: 'Полицейский', gen: 'Полицейского', avatar: 'cop'},
    black: {name: 'ПАРЕНЬ', short: 'Парень', gen: 'Парня', glyphs: '♚', avatars: ['guy']},
    pieces: {Полицейский: '♔', Парень: '♚', Врач: '♝', Ведущий: '♜', Зрительница: '♛', Общественность: '♟', Зал: '♟'},
    awards: [
      ['Игрок матча', 'Кубик'],
      ['Лучший ход', '«Я сру кубиками»'],
      ['Худший ход', '«Скуривает улику»'],
    ],
    finalLine: 'Двадцать лет стажа. Один кубик до мата.',
    cover: {title: ['Я сру кубиками'], size: 100, sub: 'Разбор партии: мат на 13-м ходу'},
  },
  CUES,
);
