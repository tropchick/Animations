import {makeShow} from '../chess/cues';
import CUES from './cues.json';

// «Шахматный разбор: Вот бы сейчас гидры поюзать» — Key & Peele (Russian dub): Джоэл whispers a hypotenuse pun, Трой
// says it out loud and gets the credit, the teacher and then the comedian Габриэл Иглесиас take his side.
export const GYDRI = makeShow(
  {
    id: 'gydri',
    label: 'KEY & PEELE',
    footH: 750,
    white: {name: 'ДЖОЭЛ', short: 'Джоэл', gen: 'Джоэла', avatar: 'joel'},
    black: {name: 'ТРОЙ', short: 'Трой', gen: 'Троя', glyphs: '♚♛♜', avatars: ['troy', 'teacher'], late: {avatar: 'iglesias', who: 'Иглесиас'}},
    pieces: {Джоэл: '♔', Трой: '♚', Училка: '♛', Иглесиас: '♜'},
    awards: [
      ['Игрок матча', 'Трой ♚'],
      ['Лучший ход', '«Гидры поюзать» (оригинал)'],
      ['Худший ход', '«Кривой дудл»'],
    ],
    finalLine: 'Придумал шутку — остался на уроке. Украл шутку — поехал в тур.',
    cover: {title: ['Вот бы сейчас', 'гидры поюзать'], size: 66, sub: 'Разбор партии: мат на 16-м ходу'},
  },
  CUES,
);
