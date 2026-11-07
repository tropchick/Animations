import {FPS, PARAMS, simulate, Ev} from './sim';

// the whole run is computed once per render worker; it is deterministic, so every worker gets the same run
export const SIM = simulate(PARAMS);
export const SIM_FRAMES = SIM.frames.length;

const byKind: Record<string, Ev[]> = {};
for (const e of SIM.events) (byKind[e.kind] ||= []).push(e);

// events of a kind that happened in (t - window, t]
export const recent = (kind: Ev['kind'], t: number, window: number) => (byKind[kind] || []).filter((e) => e.t <= t + 1e-6 && e.t > t - window);

export const lastEvent = (kinds: Ev['kind'][], t: number) => {
  let best = -1e9;
  for (const k of kinds) for (const e of byKind[k] || []) if (e.t <= t + 1e-6 && e.t > best) best = e.t;
  return best;
};

export const frameAt = (i: number) => SIM.frames[Math.max(0, Math.min(SIM_FRAMES - 1, i))];

// first frame where the counter turns into infinity; the video ends a few seconds later
export const INF_VALUE = 1e13;
export const INF_FRAME = (() => {
  const i = SIM.frames.findIndex((f) => f.Sd * 100 >= INF_VALUE);
  return i < 0 ? SIM_FRAMES - 1 : i;
})();
export const STORY_FRAMES = Math.min(SIM_FRAMES, INF_FRAME + Math.round(5 * FPS));

// the cover shows the snowman at his lowest point before the comeback
export const COVER_FRAME = (() => {
  let best = 0;
  const stop = SIM.frames.findIndex((f) => f.Z > 1.01);
  // lowest point where no flake hides his face and a beam is in the air
  const clear = (i: number) => {
    const f = SIM.frames[i];
    const headY = 1500 - 0.8 * f.Hs;
    return f.beams.some((b) => b.end < 0) && f.flakes.every((fl) => Math.hypot(fl.x - 540, fl.y - headY) > 140);
  };
  for (let i = 0; i < (stop < 0 ? SIM_FRAMES : stop); i++) if (clear(i) && SIM.frames[i].Sd < SIM.frames[best].Sd) best = i;
  return best;
})();
