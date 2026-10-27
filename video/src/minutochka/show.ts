import {makeShow} from '../chess/cues';
import CUES from './cues.json';

// «Шахматный разбор: Когда вернёшь минуточку?» — a mall sketch: a hand-cream seller asks to «занять минуточку».
// Short one: the ending is the parody YouTube card instead of the match results.
export const MINUTOCHKA = makeShow(
  {
    id: 'minutochka',
    label: 'КОГДА ВЕРНЁШЬ МИНУТОЧКУ?',
    footH: 556,
    white: {name: 'ПРОДАВЕЦ', short: 'Продавец', gen: 'Продавца', avatar: 'seller'},
    black: {name: 'МУЖИК', short: 'Мужик', gen: 'Мужика', glyphs: '♚', avatars: ['man']},
    pieces: {'Продавец': '♔', 'Мужик': '♚'},
    clock: 60,
    badgeLeft: 'b',
    cover: {title: ['Когда вернёшь', 'минуточку?'], sub: 'Разбор партии: мат на 9-м ходу'},
    // 27.96 s = this video from move 1 «Могу занять минуточку?» (0:00.95) to the mate «Так когда?» (0:28.91)
    yt: {big: '27.96', unit: 'seconds', duration: '6:57', title: 'Самые быстрые победы в карьере мужика в водолазке', meta: 'Шахматный разбор · ▷18M · 3 года назад'},
  },
  CUES,
);
