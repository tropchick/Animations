import {makeShow} from '../chess/cues';
import CUES from './cues.json';

// «Шахматный разбор: Генеральские котлы» — «Утомлённые солнцем 2: Цитадель» (2011), комдив Котов против трёх урок.
export const KOTLY = makeShow(
  {
    id: 'kotly',
    label: 'ГЕНЕРАЛЬСКИЕ КОТЛЫ',
    footH: 604,
    white: {name: 'ГЕНЕРАЛ', short: 'Генерал', gen: 'Генерала', avatar: 'general'},
    black: {name: 'ШПАНА', short: 'Шпана', gen: 'Шпаны', glyphs: '♜♜', avatars: ['glasses', 'sweater']},
    pieces: {'Генерал': '♔', 'Шпана': '♜'},
    awards: [
      ['Игрок матча', 'Генерал ♔'],
      ['Лучший ход', '«А ты мне закурить?»'],
      ['Худший ход', '«Ты чё не на фронте-то?»'],
    ],
    finalLine: 'Котлы остались у генерала. Папироска тоже.',
    cover: {title: ['Генеральские', 'котлы'], sub: 'Разбор партии: мат на 11-м ходу'},
  },
  CUES,
);
