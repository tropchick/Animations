import {makeShow} from '../chess/cues';
import CUES from './cues.json';

// «Шахматный разбор: Покажи боевое лицо» — «Цельнометаллическая оболочка»: a meme edit where the drill sergeant and
// the recruit take turns screaming at each other. Every scream is a move; the shots are short, so cards appear at once.
export const HARTMAN = makeShow(
  {
    id: 'hartman',
    label: 'УЧЕБКА МОРПЕХОВ',
    footH: 790,
    clock: 30,
    instant: true,
    white: {name: 'ХАРТМАН', short: 'Хартман', gen: 'Хартмана', avatar: 'hartman'},
    black: {name: 'ШУТНИК', short: 'Шутник', gen: 'Шутника', glyphs: '♚', avatars: ['joker']},
    pieces: {Хартман: '♔', Шутник: '♚'},
    awards: [
      ['Игрок матча', 'Шутник ♚'],
      ['Лучший ход', '«Крик с вибрато»'],
      ['Худший ход', '«Последний запас лёгких»'],
    ],
    finalLine: 'Слов не было. Победил тот, у кого больше лёгких.',
    cover: {title: ['Покажи боевое лицо'], size: 84, sub: 'Разбор партии: мат на 10-м ходу'},
  },
  CUES,
);
