import {makeShow} from '../chess/cues';
import CUES from './cues.json';

// «Шахматный разбор: Телефон убери!» — a viral clip: a маршрутка driver (Гелоди) and a passenger filming him.
// Real people: the cards joke about the argument, never about the passenger herself.
export const GELODI = makeShow(
  {
    id: 'gelodi',
    label: 'ТЕЛЕФОН УБЕРИ!',
    footH: 738,
    white: {name: 'ГЕЛОДИ', short: 'Гелоди', gen: 'Гелоди', avatar: 'driver'},
    black: {name: 'ПАССАЖИРКА', short: 'Пассажирка', gen: 'Пассажирки', glyphs: '♜', avatars: ['chess/av-phone.jpg']},
    pieces: {'Гелоди': '♔', 'Пассажирка': '♜'},
    awards: [
      ['Игрок матча', 'Гелоди ♔'],
      ['Лучший ход', '«Давление поднимаешь!»'],
      ['Худший ход', '«Вас Артём Игоревич не спасёт»'],
    ],
    finalLine: 'Телефон так и не убрали. Зато давление поднялось у всех.',
    cover: {title: ['Телефон убери!'], sub: 'Разбор партии: мат на 16-м ходу'},
  },
  CUES,
);
