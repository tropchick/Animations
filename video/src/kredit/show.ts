import {makeShow} from '../chess/cues';
import CUES from './cues.json';

// «Шахматный разбор: Кредит» — a sketch: a gopnik «bank» in an office, the banker in a red cap gives a loan to a
// client in a flat cap. The camera swings between them.
export const KREDIT = makeShow(
  {
    id: 'kredit',
    label: 'КРЕДИТ',
    footH: 788,
    white: {name: 'БАНКИР', short: 'Банкир', gen: 'Банкира', avatar: 'banker'},
    black: {name: 'КЛИЕНТ', short: 'Клиент', gen: 'Клиента', glyphs: '♜', avatars: ['client']},
    pieces: {Банкир: '♔', Клиент: '♜'},
    awards: [
      ['Игрок матча', 'Банкир ♔'],
      ['Лучший ход', '«Е*ать ты ферзь. 37%»'],
      ['Худший ход', '«Против цифр не пойду»'],
    ],
    finalLine: 'Кредит одобрен. Ставка от 5%. 37 — тоже от 5.',
    cover: {title: ['Кредит'], sub: 'Разбор партии: мат на 14-м ходу'},
  },
  CUES,
);
