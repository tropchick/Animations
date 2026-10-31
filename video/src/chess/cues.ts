// One «Шахматный разбор» video = its cues.json (made by audio/make_chess_audio.py) + a ShowConfig (src/<id>/show.ts).
// All times are video seconds (frame / 30; frame 0 is the cover).
export type Grade = 'start' | 'brilliant' | 'great' | 'good' | 'interesting' | 'inaccuracy' | 'mistake' | 'blunder' | 'piece' | 'mate' | 'draw';
export type Side = 'w' | 'b';
// label / glyph / head override the grade's own for one event card ("3 часа спустя", "Новое погоняло")
export type Move = {t: number; side: '' | Side; who: string; title: string; grade: Grade; text: string; better?: string; p: number; label?: string; glyph?: string; head?: string};
export type Sub = {s: number; e: number; text: string};
export type CuesJson = {duration: number; results: number; moves: unknown[]; subs: Sub[]};

export type ShowConfig = {
  id: string;
  label: string; // the line above the scoreboard
  footH: number; // height of the scene at full width (1080)
  footY?: number; // optional scene top to leave space below taller move cards
  white: {name: string; short: string; gen: string; avatar: string};
  // one or two avatars; late = a piece that joins the game later (its avatar stays a «?» until then)
  black: {name: string; short: string; gen: string; glyphs: string; avatars: string[]; late?: {avatar: string; who: string}};
  pieces: Record<string, string>; // who -> chess piece shown on the card
  drawReason?: string; // defaults to the original agreement ending
  clock?: number; // seconds on each chess clock, 180 if not set
  instant?: boolean; // cards and grade badges appear at once, no wipe or pop (for very fast clips)
  badgeLeft?: Side; // this side's grade badges pop on the left of the picture (so they don't cover the speaker's face)
  awards?: [string, string][];
  finalLine?: string;
  cover: {title: string[]; sub: string; size?: number}; // size: title font size (108 if not set), smaller for a long one-line title
  // the ending: the match results, or (when set) a parody YouTube card «Самые быстрые победы в карьере …»
  yt?: {big: string; unit: string; duration: string; title: string; meta: string};
};

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
  draw: {label: 'Ничья', glyph: '½', color: '#6f7480', ink: '#fff'},
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ramp = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
export const smooth = (x: number) => x * x * (3 - 2 * x);
export const outBack = (x: number) => {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

// only real moves get a number (the opening card and event cards do not)
// the move that ends the game: a mate, or a draw (nobody wins, the results say ½ : ½)
export const ends = (g: Grade) => g === 'mate' || g === 'draw';

export const numbered = (m: Move) => m.grade !== 'start' && m.grade !== 'piece';

// grade -> how accurate the move was, for the results screen
const SCORE: Partial<Record<Grade, number>> = {brilliant: 100, mate: 100, draw: 85, great: 95, good: 85, interesting: 75, inaccuracy: 60, mistake: 40, blunder: 15};

export type Show = ReturnType<typeof makeShow>;

export const makeShow = (cfg: ShowConfig, cues: CuesJson) => {
  const MOVES = cues.moves as Move[];
  let n = 0;
  const MOVE_NO = MOVES.map((m) => (numbered(m) ? ++n : 0));
  const mateMove = MOVES.find((m) => ends(m.grade))!;
  const late = cfg.black.late && MOVES.find((m) => m.grade === 'piece' && m.who === cfg.black.late!.who);
  const FOOT = {x: 0, y: cfg.footY ?? Math.round(960 - cfg.footH / 2), w: 1080, h: cfg.footH};
  return {
    cfg,
    MOVES,
    MOVE_NO,
    SUBS: cues.subs,
    DURATION_S: cues.duration,
    RESULTS: cues.results,
    MATE: mateMove.t,
    DRAW: mateMove.grade === 'draw',
    WINNER: (mateMove.grade === 'draw' ? '' : mateMove.side) as '' | Side,
    MATE_NO: MOVE_NO[MOVES.indexOf(mateMove)],
    LATE_IN: late ? late.t : Infinity,
    FOOT,
    moveAt: (v: number) => {
      let i = -1;
      MOVES.forEach((m, k) => {
        if (m.t <= v) i = k;
      });
      return i;
    },
    accuracy: (side: Side) => {
      const s = MOVES.filter((m) => m.side === side && numbered(m)).map((m) => SCORE[m.grade]!);
      return Math.round(s.reduce((a, b) => a + b, 0) / s.length);
    },
    count: (side: Side, g: Grade) => MOVES.filter((m) => m.side === side && m.grade === g).length,
    // chess clocks (3:00 each unless cfg.clock), the side to move runs (after a move by black it is white's turn), stopped at mate or draw
    clocks: (v: number) => {
      const left = {w: cfg.clock ?? 180, b: cfg.clock ?? 180};
      let turn: Side = (MOVES.find((m) => m.side)?.side || 'b') as Side;
      let since = MOVES[0].t;
      if (v < since) return {left, turn, running: false};
      for (const m of MOVES.slice(1)) {
        if (m.t > v) break;
        left[turn] -= m.t - since;
        since = m.t;
        if (m.side) turn = m.side === 'b' ? 'w' : 'b';
        if (ends(m.grade)) return {left, turn, running: false};
      }
      left[turn] -= v - since;
      return {left, turn, running: true};
    },
  };
};
