// «Снеговик против весны»: a real, seeded simulation of the rule on screen.
// Every sunbeam that hits the snowman: S *= 0.9. Every snowflake that reaches him: S *= 1.5 and 2 new flakes appear.
// Beams also melt flakes on their way. All positions are in screen pixels (1080x1920).

export const FPS = 30;
export const W = 1080;
export const GY = 1500; // ground line on screen
export const CX = 540; // snowman centre
export const SUN = {x: 196, y: 728, r: 92};
export const H0 = 400; // snowman height at 100 %
export const HCAP = 960; // screen height at which the camera starts to pull back
export const ZMAX = 34; // the camera stops pulling back here, after that he outgrows the frame

export type Params = {
  seed: number;
  beamRate: number; // beams per second
  speed: number; // flake speed px/s
  kill: number; // beam kill radius
  spread: number; // how widely the sun aims
  dur: number; // seconds simulated
};

export const PARAMS: Params = {seed: 407, beamRate: 2.6, speed: 190, kill: 34, spread: 0.55, dur: 90};

export type Flake = {id: number; x: number; y: number; rot: number; born: number};
export type Beam = {id: number; x0: number; y0: number; hx: number; hy: number; tx: number; ty: number; born: number; end: number; kind: 'snowman' | 'ground' | 'flake' | 'none'};
export type Ev = {t: number; kind: 'hit' | 'grow' | 'kill' | 'flower' | 'spawn'; x: number; y: number; id: number};

export type FrameState = {
  S: number; // the real value
  Sd: number; // smoothed, drives the picture
  Z: number;
  Hs: number; // snowman height on screen
  flakes: Flake[];
  beams: Beam[];
  n: number;
};

export type SimResult = {frames: FrameState[]; events: Ev[]; flowers: {x: number; t: number; c: number}[]};

const mulberry = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const geom = (Sd: number) => {
  const Hw = H0 * Math.cbrt(Sd);
  const Z = Math.min(ZMAX, Math.max(1, Hw / HCAP));
  return {Hw, Z, Hs: Hw / Z};
};

// the three snow balls on screen
export const balls = (Hs: number) => [
  {x: CX, y: GY - 0.21 * Hs, r: 0.21 * Hs},
  {x: CX, y: GY - 0.545 * Hs, r: 0.155 * Hs},
  {x: CX, y: GY - 0.8 * Hs, r: 0.115 * Hs},
];

const segPoint = (ax: number, ay: number, bx: number, by: number, px: number, py: number) => {
  const dx = bx - ax;
  const dy = by - ay;
  const L = dx * dx + dy * dy || 1;
  const u = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L));
  const qx = ax + u * dx - px;
  const qy = ay + u * dy - py;
  return {d: Math.sqrt(qx * qx + qy * qy), u};
};

export const simulate = (p: Params = PARAMS): SimResult => {
  const rnd = mulberry(p.seed * 7919 + 13);
  const gauss = () => {
    const u = Math.max(1e-9, rnd());
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
  };
  const dt = 1 / FPS;
  const N = Math.round(p.dur * FPS);
  let S = 1;
  let lnSd = 0;
  let nextId = 1;
  type F = Flake & {vx: number; vy: number; ti: number; ox: number; oy: number; ph: number; v: number};
  let flakes: F[] = [];
  let beams: (Beam & {dx: number; dy: number; len: number})[] = [];
  const events: Ev[] = [];
  const flowers: {x: number; t: number; c: number}[] = [];
  const frames: FrameState[] = [];
  const queue: number[] = [0.4, 1.3, 2.6]; // spawn times of the first flakes
  let nextBeam = 1.2;
  const NMAX = 240;

  const spawn = (t: number) => {
    if (flakes.length >= NMAX) return;
    const x = 30 + rnd() * (W - 60);
    flakes.push({id: nextId++, x, y: -40 - rnd() * 60, rot: rnd() * 6.28, born: t, vx: 0, vy: 0, ti: Math.floor(rnd() * 3), ox: (rnd() - 0.5) * 0.9, oy: rnd(), ph: rnd() * 6.28, v: p.speed * (0.85 + rnd() * 0.3)});
    events.push({t, kind: 'spawn', x, y: -40, id: nextId - 1});
  };

  let infAt = -1;
  for (let f = 0; f < N; f++) {
    const t = f * dt;
    // nothing is needed once the counter has been at infinity for a while
    if (infAt < 0 && lnSd > Math.log(1e11)) infAt = t;
    if (infAt >= 0 && t > infAt + 6) break;
    const {Z, Hs} = geom(Math.exp(lnSd));
    const B = balls(Hs);
    const sunCovered = B.some((b) => Math.hypot(SUN.x - b.x, SUN.y - b.y) < b.r - SUN.r * 0.3);

    while (queue.length && queue[0] <= t) {
      queue.shift();
      spawn(t);
    }

    // new beams
    while (!sunCovered && t >= nextBeam) {
      const span = Math.max(Hs, H0);
      const tx = CX + gauss() * (0.5 * span * p.spread + 120);
      const ty = GY - rnd() * span * 1.05;
      const dx0 = tx - SUN.x;
      const dy0 = ty - SUN.y;
      // carry on to the ground
      const k = dy0 > 4 ? (GY - SUN.y) / dy0 : 1;
      const ex = SUN.x + dx0 * k;
      const len = Math.hypot(ex - SUN.x, GY - SUN.y);
      beams.push({id: nextId++, x0: SUN.x, y0: SUN.y, hx: SUN.x, hy: SUN.y, tx: ex, ty: GY, born: t, end: -1, kind: 'none', dx: (ex - SUN.x) / len, dy: (GY - SUN.y) / len, len});
      nextBeam += -Math.log(Math.max(1e-6, rnd())) / p.beamRate;
    }

    // move beams
    for (const b of beams) {
      if (b.end >= 0) continue;
      const step = 3000 * dt;
      const ax = b.hx;
      const ay = b.hy;
      let bx = ax + b.dx * step;
      let by = ay + b.dy * step;
      let done = false;
      // the snowman first
      let best = 2;
      for (const c of B) {
        const {d, u} = segPoint(ax, ay, bx, by, c.x, c.y);
        if (d < c.r && u < best) best = u;
      }
      if (best <= 1) {
        // walk back to the surface
        let u = best;
        for (let i = 0; i < 12; i++) {
          const px = ax + (bx - ax) * (u - 0.04);
          const py = ay + (by - ay) * (u - 0.04);
          if (B.some((c) => Math.hypot(px - c.x, py - c.y) < c.r)) u -= 0.04;
          else break;
        }
        bx = ax + (bx - ax) * u;
        by = ay + (by - ay) * u;
        S *= 0.9;
        b.kind = 'snowman';
        events.push({t, kind: 'hit', x: bx, y: by, id: b.id});
        done = true;
      }
      // flakes in the way
      flakes = flakes.filter((fl) => {
        const {d} = segPoint(ax, ay, bx, by, fl.x, fl.y);
        if (d < p.kill) {
          events.push({t, kind: 'kill', x: fl.x, y: fl.y, id: fl.id});
          return false;
        }
        return true;
      });
      if (!done && Math.hypot(bx - b.x0, by - b.y0) >= b.len) {
        bx = b.tx;
        by = b.ty;
        b.kind = 'ground';
        events.push({t, kind: 'flower', x: bx, y: by, id: b.id});
        flowers.push({x: CX + (bx - CX) * Z, t, c: Math.floor(rnd() * 4)});
        done = true;
      }
      b.hx = bx;
      b.hy = by;
      if (done) b.end = t;
    }
    beams = beams.filter((b) => b.end < 0 || t - b.end < 0.35);

    // move flakes: they glide towards the snowman with a wobble
    const keep: F[] = [];
    for (const fl of flakes) {
      const target = B[fl.ti];
      const tx = target.x + fl.ox * target.r;
      const ty = target.y - target.r * 0.2 + (fl.oy - 0.5) * target.r * 0.6;
      let dx = tx - fl.x;
      let dy = ty - fl.y;
      const L = Math.hypot(dx, dy) || 1;
      dx /= L;
      dy /= L;
      const w = Math.sin(t * 2.1 + fl.ph) * 0.55;
      fl.vx = (dx - dy * w) * fl.v;
      fl.vy = (dy + dx * w) * fl.v;
      fl.x += fl.vx * dt;
      fl.y += fl.vy * dt;
      fl.rot += dt * 0.9;
      const hit = B.some((c) => Math.hypot(fl.x - c.x, fl.y - c.y) < c.r + 10);
      if (hit) {
        S *= 1.5;
        events.push({t, kind: 'grow', x: fl.x, y: fl.y, id: fl.id});
        const a1 = t + 0.25 + rnd() * 0.5;
        const a2 = t + 0.5 + rnd() * 0.9;
        if (flakes.length + queue.length < NMAX) {
          queue.push(a1, a2);
          queue.sort((a, b) => a - b);
        }
      } else keep.push(fl);
    }
    flakes = keep;

    // the picture follows the real value, but never grows faster than a set pace, so the finale reads
    const want = (Math.log(S) - lnSd) * Math.min(1, dt / 0.14);
    lnSd += Math.min(want, (0.9 + 0.09 * Math.max(0, lnSd)) * dt);
    const g = geom(Math.exp(lnSd));
    frames.push({
      S,
      Sd: Math.exp(lnSd),
      Z: g.Z,
      Hs: g.Hs,
      flakes: flakes.map(({id, x, y, rot, born}) => ({id, x, y, rot, born})),
      beams: beams.map(({id, x0, y0, hx, hy, tx, ty, born, end, kind}) => ({id, x0, y0, hx, hy, tx, ty, born, end, kind})),
      n: flakes.length + queue.length,
    });
  }
  return {frames, events, flowers};
};
