import {makeShow} from '../chess/cues';
import CUES from './cues.json';

// «Шахматный разбор: Кощея отшили» — «Слово пацана»: Вова Адидас calls Кощей out in front of the whole street on the
// hockey box; Кощей answers with a speech about the thieves' world, gets punched and is out of Универсам.
export const KOSHEY = makeShow(
  {
    id: 'koshey',
    label: 'СЛОВО ПАЦАНА',
    footH: 673,
    white: {name: 'ВОВА АДИДАС', short: 'Вова', gen: 'Вовы', avatar: 'vova'},
    black: {name: 'КОЩЕЙ', short: 'Кощей', gen: 'Кощея', glyphs: '♚', avatars: ['koshey']},
    pieces: {Вова: '♔', Кощей: '♚'},
    awards: [
      ['Игрок матча', 'Вова Адидас ♔'],
      ['Лучший ход', '«Ты хуже дяди Толи стал»'],
      ['Худший ход', '«Очищение воровского мира»'],
    ],
    finalLine: 'Пришёл с «Всем салам». Ушёл без улицы.',
    cover: {title: ['Кощея отшили'], sub: 'Разбор партии: мат на 23-м ходу'},
  },
  CUES,
);
