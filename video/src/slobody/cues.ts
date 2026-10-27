import CUES from './cues.json';

// Timing made by audio/make_slobody_audio.py. All times are video seconds (frame / 30; frame 0 is the cover).
export type Grade = 'start' | 'brilliant' | 'great' | 'good' | 'interesting' | 'inaccuracy' | 'mistake' | 'blunder' | 'piece' | 'mate';
export type Move = {t: number; side: '' | 'w' | 'b'; who: string; title: string; grade: Grade; text: string; better?: string; p: number};
export type Sub = {s: number; e: number; text: string};

export const DURATION_S: number = CUES.duration;
export const RESULTS: number = CUES.results;
export const MOVES = CUES.moves as Move[];
export const SUBS = CUES.subs as Sub[];

export const GRADES: Record<Grade, {label: string; glyph: string; color: string; ink: string}> = {
  start: {label: 'Партия началась', glyph: '▶', color: '#c9b48a', ink: '#2a2216'},
  brilliant: {label: 'Блестящий ход', glyph: '‼', color: '#1fb5a8', ink: '#fff'},
  great: {label: 'Сильный ход', glyph: '!', color: '#5b8bd6', ink: '#fff'},
  good: {label: 'Хороший ход', glyph: '✓', color: '#7fa650', ink: '#fff'},
  interesting: {label: 'Интересный ход', glyph: '!?', color: '#9a7ad1', ink: '#fff'},
  inaccuracy: {label: 'Неточность', glyph: '?!', color: '#e8b730', ink: '#2a2216'},
  mistake: {label: 'Ошибка', glyph: '?', color: '#ee8a2c', ink: '#fff'},
  blunder: {label: 'Зевок', glyph: '??', color: '#d9452f', ink: '#fff'},
  piece: {label: 'Новая фигура', glyph: '♛', color: '#c9b48a', ink: '#2a2216'},
  mate: {label: 'Мат', glyph: '#', color: '#141414', ink: '#fff'},
};

export const PIECE: Record<string, string> = {'Городская': '♔', 'Кондукторша': '♜', 'Мамаша': '♞', 'Тётка с ивой': '♛'};

// only real moves get a number (the opening card and the new piece do not)
export const numbered = (m: Move) => m.grade !== 'start' && m.grade !== 'piece';
export const MOVE_NO: number[] = (() => {
  let n = 0;
  return MOVES.map((m) => (numbered(m) ? ++n : 0));
})();

export const WILLOW_IN = MOVES.find((m) => m.grade === 'piece')!.t;
export const MATE = MOVES.find((m) => m.grade === 'mate')!.t;

export const moveAt = (v: number) => {
  let i = -1;
  MOVES.forEach((m, k) => {
    if (m.t <= v) i = k;
  });
  return i;
};

// grade -> how accurate the move was, for the results screen
const SCORE: Partial<Record<Grade, number>> = {brilliant: 100, mate: 100, great: 95, good: 85, interesting: 75, inaccuracy: 60, mistake: 40, blunder: 15};
export const accuracy = (side: 'w' | 'b') => {
  const s = MOVES.filter((m) => m.side === side && numbered(m)).map((m) => SCORE[m.grade]!);
  return Math.round(s.reduce((a, b) => a + b, 0) / s.length);
};
export const count = (side: 'w' | 'b', g: Grade) => MOVES.filter((m) => m.side === side && m.grade === g).length;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ramp = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
export const smooth = (x: number) => x * x * (3 - 2 * x);
export const outBack = (x: number) => {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

// chess clocks: 3:00 each, the side to move runs (after a move by Слобода it is the city's turn), stopped at mate
export const clocks = (v: number) => {
  const left = {w: 180, b: 180};
  let turn: 'w' | 'b' = 'b';
  let since = MOVES[0].t;
  if (v < since) return {left, turn, running: false};
  for (const m of MOVES.slice(1)) {
    if (m.t > v) break;
    left[turn] -= m.t - since;
    since = m.t;
    turn = m.side === 'b' ? 'w' : 'b';
    if (m.grade === 'mate') return {left, turn, running: false};
  }
  left[turn] -= v - since;
  return {left, turn, running: true};
};
