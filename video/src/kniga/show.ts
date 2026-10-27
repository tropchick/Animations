import {makeShow} from '../chess/cues';
import CUES from './cues.json';

// «Шахматный разбор: Книга, братан, иди-ка сюда!» — the sketch from The GG Show (2021) with Биржан Ашим.
export const KNIGA = makeShow(
  {
    id: 'kniga',
    label: 'КНИГА, БРАТАН, ИДИ-КА СЮДА!',
    footH: 536,
    white: {name: 'ЧУЖАК', short: 'Чужак', gen: 'Чужака', avatar: 'guest'},
    black: {name: 'РАЙОН', short: 'Район', gen: 'Района', glyphs: '♜♛', avatars: ['boss', 'daut'], late: {avatar: 'book', who: 'Книга'}},
    pieces: {'Чужак': '♔', 'Район': '♜', 'Книга': '♛'},
    awards: [
      ['Игрок матча', 'Книга ♛'],
      ['Лучший ход', '«В книге»'],
      ['Худший ход', '«Книга, братан, иди-ка сюда!»'],
    ],
    finalLine: 'На любом районе есть какой-то Баха. И какая-то книга.',
    cover: {title: ['Книга, братан,', 'иди-ка сюда!'], sub: 'Разбор партии: 16 ходов до мата'},
  },
  CUES,
);
