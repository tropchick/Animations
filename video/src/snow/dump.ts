// Writes the run's timeline for the soundtrack script: node out/snow-dump.cjs > src/snow/timeline.json
import {SIM, STORY_FRAMES, INF_FRAME} from './data';
import {FPS, geom} from './sim';
import {winterAt} from './winter';

const beams = new Set<number>();
const beamT: number[] = [];
for (const f of SIM.frames) for (const b of f.beams) if (!beams.has(b.id)) { beams.add(b.id); beamT.push(+b.born.toFixed(3)); }
const curve: number[][] = [];
for (let i = 0; i < STORY_FRAMES; i += 3) {
  const f = SIM.frames[i];
  curve.push([+(i / FPS).toFixed(2), +Math.log(f.Sd).toFixed(3), +winterAt(f.Sd).toFixed(3), +geom(f.Sd).Z.toFixed(2)]);
}
const zoom = SIM.frames.findIndex((f) => f.Z > 1.01) / FPS;
console.log(JSON.stringify({
  dur: STORY_FRAMES / FPS,
  frames: STORY_FRAMES + 1,
  inf: INF_FRAME / FPS,
  zoom,
  events: SIM.events.filter((e) => e.t < STORY_FRAMES / FPS && e.kind !== 'spawn').map((e) => [+e.t.toFixed(3), e.kind, Math.round(e.x)]),
  beams: beamT.filter((t) => t < STORY_FRAMES / FPS),
  curve,
}));
