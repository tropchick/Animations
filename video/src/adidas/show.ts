import {makeShow} from '../chess/cues';
import CUES from './cues.json';

// «Шахматный разбор: Адидаса вытаскивают» — «Слово пацана»: Марат takes a white coat from an intern, the Универсам
// carry Вова Адидас straight off the operating table, fight off the хадишевские with a fire extinguisher and steal an ambulance.
export const ADIDAS = makeShow(
  {
    id: 'adidas',
    label: 'СЛОВО ПАЦАНА',
    footH: 665,
    white: {name: 'УНИВЕРСАМ', short: 'Универсам', gen: 'Универсама', avatar: 'marat'},
    black: {name: 'БОЛЬНИЦА', short: 'Больница', gen: 'Больницы', glyphs: '♚♛♜', avatars: ['intern', 'nurse'], late: {avatar: 'hadi', who: 'Хадишевские'}},
    pieces: {Универсам: '♔', Марат: '♔', Турбо: '♖', Андрей: '♘', Адидас: '♕', Интерн: '♟', Медсестра: '♛', 'Мама Андрея': '♝', Хадишевские: '♜'},
    awards: [
      ['Игрок матча', 'Марат ♔'],
      ['Лучший ход', '«Мы ветеранам помогаем»'],
      ['Худший ход', '«Я сейчас позову…»'],
    ],
    finalLine: 'Пришли без халата. Ушли с халатом, пациентом и скорой.',
    cover: {title: ['Адидаса вытаскивают'], size: 72, sub: 'Разбор партии: мат на 27-м ходу'},
  },
  CUES,
);
