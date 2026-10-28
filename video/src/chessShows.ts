import {Show} from './chess/cues';
import {SLOBODY} from './slobody/show';
import {KNIGA} from './kniga/show';
import {MINUTOCHKA} from './minutochka/show';
import {KOTLY} from './kotly/show';
import {GELODI} from './gelodi/show';
import {RIFMA} from './rifma/show';
import {ODETY} from './odety/show';
import {KLIM} from './klim/show';

// The «Шахматный разбор» videos. Compositions get the key as a prop (props must stay plain JSON).
export const CHESS_SHOWS: Record<string, Show> = {slobody: SLOBODY, kniga: KNIGA, minutochka: MINUTOCHKA, kotly: KOTLY, gelodi: GELODI, rifma: RIFMA, odety: ODETY, klim: KLIM};
