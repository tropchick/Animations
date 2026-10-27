import {makeShow} from '../chess/cues';
import CUES from './cues.json';

// «Шахматный разбор: До Слободы доеду?» — the bus scene from «Мама будет против», ep. 13.
export const SLOBODY = makeShow(
  {
    id: 'slobody',
    label: 'ДО СЛОБОДЫ ДОЕДУ?',
    footH: 608,
    white: {name: 'ГОРОДСКАЯ', short: 'Городская', gen: 'Городской', avatar: 'city'},
    black: {name: 'СЛОБОДА', short: 'Слобода', gen: 'Слободы', glyphs: '♜♞♛', avatars: ['cond', 'mom'], late: {avatar: 'willow', who: 'Тётка с ивой'}},
    pieces: {'Городская': '♔', 'Кондукторша': '♜', 'Мамаша': '♞', 'Тётка с ивой': '♛'},
    awards: [
      ['Игрок матча', 'Тётка с ивой ♛'],
      ['Лучший ход', '«Психушка недалеко»'],
      ['Худший ход', '«Вырву ваш лопух»'],
    ],
    finalLine: 'Автобус идёт до Слободы. А доедешь ты или нет — никому не ведомо.',
    cover: {title: ['До Слободы', 'доеду?'], sub: 'Разбор партии: 19 ходов до мата'},
  },
  CUES,
);
