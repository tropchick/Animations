import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Ball, Block, Cone, Cyl, Glow, RBox, Ring} from '../bear/kit';
import {Pic} from '../bear/Props';
import {useRobe} from '../gaben/Sets';
import {COND, roundRect} from '../gta/tex';
import {fit} from '../cs2/tex';
import {ROUNDF} from '../nolan/Sets';
import {V3, rnd} from './cues';

// Sets for «Что весит больше: GTA 6 или мать Габена?». Gaben's mother is only ever slippers, the robe hem, a sleeve and a hand.
// GTA 6 is a game box with our own sunset cover (no real logo, no trailer frames).

export const GTA_A = '#ff8a1e';
export const GTA_B = '#8a3cf0';
export const SKIN = '#f0c2a0';

// ---------------------------------------------------------------- the game box (front faces +z, stands on y = 0)

const drawCover = (g: CanvasRenderingContext2D, W: number, H: number) => {
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2a1660');
  sky.addColorStop(0.38, '#c8307a');
  sky.addColorStop(0.62, '#ff9a3a');
  sky.addColorStop(0.63, '#3a2a7a');
  sky.addColorStop(1, '#1a1040');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  // the sun with stripes
  g.save();
  g.beginPath();
  g.arc(W * 0.5, H * 0.6, W * 0.3, Math.PI, 0);
  g.closePath();
  g.clip();
  const sun = g.createLinearGradient(0, H * 0.3, 0, H * 0.6);
  sun.addColorStop(0, '#ffe27a');
  sun.addColorStop(1, '#ff6a3a');
  g.fillStyle = sun;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#c8307a';
  for (let i = 0; i < 5; i++) g.fillRect(0, H * (0.47 + i * 0.026), W, H * (0.006 + i * 0.003));
  g.restore();
  // water shimmer
  g.fillStyle = 'rgba(255,190,120,0.55)';
  for (let i = 0; i < 9; i++) g.fillRect(W * (0.3 + 0.05 * Math.sin(i * 2.1)), H * (0.65 + i * 0.03), W * (0.4 - i * 0.03), H * 0.008);
  // palms
  const palm = (x: number, h: number, lean: number) => {
    g.strokeStyle = '#1a0c2a';
    g.lineWidth = W * 0.022;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x, H * 0.66);
    g.quadraticCurveTo(x + lean * 0.5, H * 0.66 - h * 0.5, x + lean, H * 0.66 - h);
    g.stroke();
    g.fillStyle = '#1a0c2a';
    const tx = x + lean;
    const ty = H * 0.66 - h;
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + (k - 3) * 0.55;
      g.beginPath();
      g.moveTo(tx, ty);
      g.quadraticCurveTo(tx + Math.cos(a) * W * 0.12, ty + Math.sin(a) * W * 0.12 - W * 0.02, tx + Math.cos(a) * W * 0.2, ty + Math.sin(a) * W * 0.2 + W * 0.07);
      g.quadraticCurveTo(tx + Math.cos(a) * W * 0.1, ty + Math.sin(a) * W * 0.1 + W * 0.01, tx, ty);
      g.fill();
    }
  };
  palm(W * 0.14, H * 0.3, W * 0.05);
  palm(W * 0.84, H * 0.36, -W * 0.07);
  palm(W * 0.93, H * 0.24, W * 0.02);
  // the title: our own block letters
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.font = `600 ${W * 0.36}px ${COND}`;
  g.lineWidth = W * 0.03;
  g.strokeStyle = '#1a0c2a';
  g.strokeText('GTA', W * 0.5, H * 0.33);
  g.fillStyle = '#ffffff';
  g.fillText('GTA', W * 0.5, H * 0.33);
  g.font = `600 ${W * 0.62}px ${COND}`;
  const six = g.createLinearGradient(0, H * 0.32, 0, H * 0.78);
  six.addColorStop(0, '#ff5ab0');
  six.addColorStop(1, '#ffb03a');
  g.strokeText('6', W * 0.5, H * 0.8);
  g.fillStyle = six;
  g.fillText('6', W * 0.5, H * 0.8);
  // bottom band
  g.fillStyle = '#120a24';
  g.fillRect(0, H * 0.9, W, H * 0.1);
  g.fillStyle = '#ffffff';
  g.font = `500 ${W * 0.06}px ${COND}`;
  g.fillText('VICE CITY · 2026', W * 0.5, H * 0.965);
  // the sticker
  g.save();
  g.translate(W * 0.8, H * 0.12);
  g.rotate(0.25);
  g.fillStyle = '#ffd23f';
  g.beginPath();
  for (let k = 0; k < 24; k++) {
    const r = k % 2 ? W * 0.14 : W * 0.165;
    const a = (k / 24) * Math.PI * 2;
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
  g.fillStyle = '#2a1f3a';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${W * 0.085}px ${COND}`;
  g.fillText('212', 0, -W * 0.03);
  g.font = `600 ${W * 0.06}px ${COND}`;
  g.fillText('ГБ', 0, W * 0.05);
  g.restore();
};

export const BOX = {w: 0.9, h: 1.2, d: 0.14};
export const GameBox: React.FC<{position?: V3; rotation?: V3; scale?: number; glow?: number}> = ({position, rotation, scale = 1, glow = 1}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <RBox position={[0, BOX.h / 2, 0]} size={[BOX.w, BOX.h, BOX.d]} r={0.03} color="#1a1040" look={{rough: 0.35}} />
    <Pic size={[BOX.w - 0.04, BOX.h - 0.04]} res={[384, 512]} k="gta-cover" position={[0, BOX.h / 2, BOX.d / 2 + 0.004]} draw={drawCover} glow={glow} />
    <Pic size={[BOX.w - 0.04, BOX.h - 0.04]} res={[384, 512]} k="gta-cover" position={[0, BOX.h / 2, -BOX.d / 2 - 0.004]} rotation={[0, Math.PI, 0]} draw={drawCover} glow={glow} />
  </group>
);

// ---------------------------------------------------------------- her sleeve and hand (the arm points along -z from the shoulder end at the origin)

export const MomArm: React.FC<{position?: V3; rotation?: V3; len?: number; finger?: boolean}> = ({position, rotation, len = 0.7, finger}) => {
  const robe = useRobe([3, 2]);
  const m = useMemo(() => new THREE.MeshStandardMaterial({map: robe, roughness: 0.95}), [robe]);
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -len / 2]} rotation={[Math.PI / 2, 0, 0]} material={m} castShadow receiveShadow>
        <capsuleGeometry args={[0.085, len, 6, 18]} />
      </mesh>
      <Ring position={[0, 0, -len - 0.02]} r={0.085} tube={0.025} color="#fff0f6" look={{rough: 1}} />
      <Ball position={[0, 0, -len - 0.1]} scale={[0.07, 0.055, 0.09]} color={SKIN} look={{rough: 0.7}} />
      {finger ? <Cyl position={[0, 0.005, -len - 0.2]} rotation={[Math.PI / 2, 0, 0]} rt={0.018} rb={0.02} h={0.09} seg={10} color={SKIN} /> : <Ball position={[0.045, 0.02, -len - 0.13]} scale={[0.022, 0.02, 0.04]} color={SKIN} />}
    </group>
  );
};

// a plain grey hoodie arm with one pointing finger (the GTA player)
export const PlayerArm: React.FC<{position?: V3; rotation?: V3; len?: number}> = ({position, rotation, len = 0.7}) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 0, -len / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <capsuleGeometry args={[0.075, len, 6, 18]} />
      <meshStandardMaterial color="#3a3f4a" roughness={0.9} />
    </mesh>
    <Ball position={[0, 0, -len - 0.09]} scale={[0.06, 0.05, 0.08]} color="#d8a880" look={{rough: 0.7}} />
    <Cyl position={[0, 0.005, -len - 0.18]} rotation={[Math.PI / 2, 0, 0]} rt={0.016} rb={0.018} h={0.09} seg={10} color="#d8a880" />
  </group>
);

// ---------------------------------------------------------------- a cloud: a cluster of soft balls around the origin

const PUFFS: [V3, number][] = Array.from({length: 16}, (_, i) => {
  const a = (i / 16) * Math.PI * 2 + rnd(i) * 0.4;
  const r = 0.6 + rnd(i * 3) * 1.1;
  return [[Math.cos(a) * r * 1.5, (rnd(i * 5) - 0.3) * 0.6, Math.sin(a) * r * 0.8], 0.75 + rnd(i * 7) * 0.55] as [V3, number];
});
export const Cloud: React.FC<{position?: V3; scale?: number; dark?: number; squash?: number}> = ({position, scale = 1, dark = 0, squash = 1}) => {
  const c = new THREE.Color('#ffffff').lerp(new THREE.Color('#4a4a5a'), dark);
  const col = '#' + c.getHexString();
  return (
    <group position={position} scale={[scale * (1 + (1 - squash) * 0.4), scale * squash, scale * (1 + (1 - squash) * 0.4)]}>
      <Ball scale={[2.0, 0.85, 1.2]} color={col} look={{rough: 1, rim: '#ffffff', rimK: 0.3 * (1 - dark)}} />
      {PUFFS.map(([p, r], i) => (
        <Ball key={i} position={p} scale={r} color={col} look={{rough: 1, rim: '#ffffff', rimK: 0.3 * (1 - dark)}} />
      ))}
    </group>
  );
};

// a lightning bolt: emissive zig-zag boxes going down from the origin
export const Bolt: React.FC<{position: V3; k: number; seed?: number; len?: number}> = ({position, k, seed = 1, len = 3}) => {
  if (k <= 0) return null;
  const n = 6;
  const pts: V3[] = [[0, 0, 0]];
  for (let i = 1; i <= n; i++) pts.push([(rnd(seed + i) - 0.5) * 0.9, -(i / n) * len, (rnd(seed * 3 + i) - 0.5) * 0.3]);
  return (
    <group position={position}>
      {pts.slice(1).map((p, i) => {
        const a = pts[i];
        const d = Math.hypot(p[0] - a[0], p[1] - a[1], p[2] - a[2]);
        const ang = Math.atan2(p[0] - a[0], -(p[1] - a[1]));
        return <Block key={i} position={[(a[0] + p[0]) / 2, (a[1] + p[1]) / 2, (a[2] + p[2]) / 2]} rotation={[0, 0, ang]} size={[0.07, d, 0.07]} color="#fff6c0" look={{basic: true, opacity: k}} shadow={false} receive={false} />;
      })}
      <Glow position={[0, -len * 0.5, 0.2]} size={4} color="#e8e0ff" k={k * 0.8} />
    </group>
  );
};

// ---------------------------------------------------------------- small toy city pieces

const TOWER_COLS = ['#f4d8b8', '#bfe0f0', '#f6c0c8', '#d8e8b0', '#e8d0f0', '#ffe0a0'];
export const Tower: React.FC<{position: V3; w: number; h: number; i: number; lit?: number}> = ({position, w, h, i, lit = 0}) => {
  const c = TOWER_COLS[i % TOWER_COLS.length];
  const rows = Math.max(2, Math.floor(h / 0.5));
  return (
    <group position={position}>
      <RBox position={[0, h / 2, 0]} size={[w, h, w]} r={Math.min(0.06, w * 0.1)} color={c} look={{rough: 0.85}} />
      {Array.from({length: rows}).map((_, r) => (
        <Block key={r} position={[0, 0.35 + r * ((h - 0.5) / Math.max(1, rows - 1)), 0]} size={[w + 0.012, 0.1, w + 0.012]} color={lit > 0 && rnd(i * 13 + r) < 0.7 ? '#ffe9a0' : '#5a6a8a'} look={lit > 0 && rnd(i * 13 + r) < 0.7 ? {basic: true} : {rough: 0.4}} shadow={false} />
      ))}
      <Block position={[0, h + 0.04, 0]} size={[w * 0.6, 0.08, w * 0.6]} color="#8a8a92" />
    </group>
  );
};

export const Palm: React.FC<{position: V3; h?: number; seed?: number; scale?: number}> = ({position, h = 1.4, seed = 1, scale = 1}) => {
  const lean = (rnd(seed) - 0.5) * 0.4;
  return (
    <group position={position} scale={scale} rotation={[0, rnd(seed * 3) * 6, 0]}>
      <Cyl position={[lean / 2, h / 2, 0]} rotation={[0, 0, -lean / h]} rt={0.04} rb={0.06} h={h} seg={8} color="#9a6a3a" />
      {Array.from({length: 6}).map((_, k) => {
        const a = (k / 6) * Math.PI * 2;
        return <Ball key={k} position={[lean + Math.cos(a) * 0.25, h - 0.02, Math.sin(a) * 0.25]} rotation={[0, -a, 0.5]} scale={[0.3, 0.035, 0.09]} color={k % 2 ? '#3aa04a' : '#4ab85a'} look={{rough: 0.8}} />;
      })}
      <Ball position={[lean, h, 0]} scale={0.07} color="#6a4a2a" />
    </group>
  );
};

const CAR_COLS = ['#e8453c', '#ffd23f', '#3a9cf0', '#ffffff', '#2fae5a', '#ff8a1e'];
export const ToyCar: React.FC<{position: V3; yaw?: number; i: number; scale?: number}> = ({position, yaw = 0, i, scale = 1}) => (
  <group position={position} rotation={[0, yaw, 0]} scale={scale}>
    <RBox position={[0, 0.09, 0]} size={[0.2, 0.1, 0.42]} r={0.04} color={CAR_COLS[i % CAR_COLS.length]} look={{rough: 0.4}} />
    <RBox position={[0, 0.17, -0.02]} size={[0.17, 0.08, 0.22]} r={0.035} color="#2a3a5a" look={{rough: 0.2}} />
    {[-1, 1].map((sx) => [-1, 1].map((sz) => <Cyl key={`${sx}${sz}`} position={[sx * 0.1, 0.045, sz * 0.13]} rotation={[0, 0, Math.PI / 2]} rt={0.045} rb={0.045} h={0.03} seg={10} color="#1c1d24" />))}
  </group>
);

// ---------------------------------------------------------------- household: washing machine, fuse box, router, laptop, TV, console, couch

export const Washer: React.FC<{position?: V3; on?: number; shake?: number}> = ({position, on = 0, shake = 0}) => (
  <group position={position} rotation={[0, 0, shake]}>
    <RBox position={[0, 0.43, 0]} size={[0.6, 0.86, 0.58]} r={0.04} color="#f6f8fa" look={{rough: 0.35}} />
    <RBox position={[0, 0.79, 0.29]} size={[0.56, 0.1, 0.02]} r={0.008} color="#dfe6ee" shadow={false} />
    {/* the button the hand presses */}
    <Cyl position={[0.18, 0.79, 0.305]} rotation={[Math.PI / 2, 0, 0]} rt={0.028} rb={0.028} h={0.022} seg={16} color={on > 0 ? '#3ae07a' : '#7a8a9a'} look={on > 0 ? {basic: true} : {rough: 0.4}} />
    <Cyl position={[-0.16, 0.79, 0.302]} rotation={[Math.PI / 2, 0, 0]} rt={0.04} rb={0.04} h={0.018} seg={20} color="#c8d0da" />
    <Ring position={[0, 0.4, 0.3]} r={0.17} tube={0.03} color="#c8d0da" look={{metal: 0.5, rough: 0.3}} />
    <Cyl position={[0, 0.4, 0.292]} rotation={[Math.PI / 2, 0, 0]} rt={0.16} rb={0.16} h={0.01} seg={32} color="#3a5a8a" look={{rough: 0.15}} />
    {on > 0 ? <Glow position={[0.18, 0.79, 0.33]} size={0.18} color="#7affb0" k={on} /> : null}
  </group>
);

export const FuseBox: React.FC<{position: V3; spark: number; t: number}> = ({position, spark, t}) => (
  <group position={position}>
    <RBox size={[0.36, 0.46, 0.1]} r={0.02} color="#c8ccd2" look={{rough: 0.5, metal: 0.3}} />
    {Array.from({length: 4}).map((_, i) => (
      <RBox key={i} position={[-0.12 + i * 0.08, 0.04, 0.055]} size={[0.05, 0.12, 0.02]} r={0.008} color={spark > 0 && i === 2 ? '#e8453c' : '#2a2b33'} shadow={false} />
    ))}
    {spark > 0 ? (
      <>
        <Glow position={[0.04, 0.05, 0.12]} size={0.9 * spark} color="#ffe080" k={spark} />
        {Array.from({length: 8}).map((_, i) => {
          const a = rnd(i * 3) * Math.PI * 2;
          const r = (0.05 + t * (0.4 + rnd(i) * 0.5)) * 1;
          return <Ball key={i} position={[0.04 + Math.cos(a) * r, 0.05 + Math.sin(a) * r - t * t * 1.5, 0.12 + rnd(i * 5) * 0.1]} scale={0.012} color="#fff3b0" look={{basic: true}} shadow={false} />;
        })}
      </>
    ) : null}
  </group>
);

export const Router: React.FC<{position: V3; on: boolean; blink: boolean}> = ({position, on, blink}) => (
  <group position={position}>
    <RBox position={[0, 0.04, 0]} size={[0.36, 0.08, 0.24]} r={0.02} color="#f2f2f4" look={{rough: 0.4}} />
    {[-0.12, 0.12].map((x) => (
      <Cyl key={x} position={[x, 0.2, -0.1]} rt={0.012} rb={0.014} h={0.28} seg={8} color="#2a2b33" />
    ))}
    {Array.from({length: 5}).map((_, i) => {
      const c = on ? (blink && i % 2 ? '#3ae07a' : '#2bd06a') : i === 0 ? '#ff4a3a' : '#5a5a60';
      const lit = on || i === 0;
      return (
        <group key={i}>
          <Ball position={[-0.1 + i * 0.05, 0.06, 0.121]} scale={0.011} color={c} look={lit ? {basic: true} : {rough: 0.5}} shadow={false} />
          {lit ? <Glow position={[-0.1 + i * 0.05, 0.06, 0.13]} size={0.08} color={c} k={0.9} /> : null}
        </group>
      );
    })}
  </group>
);

const drawSpinner = (bad: boolean, a: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = bad ? '#1c2030' : '#2a3a6a';
  g.fillRect(0, 0, W, H);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (bad) {
    g.fillStyle = '#ff6a5a';
    g.font = `600 ${H * 0.11}px ${ROUNDF}`;
    g.fillText('НЕТ ПОДКЛЮЧЕНИЯ', W / 2, H * 0.72);
    g.strokeStyle = '#ff6a5a';
    g.lineWidth = H * 0.035;
    g.lineCap = 'round';
    for (let r = 1; r <= 3; r++) {
      g.beginPath();
      g.arc(W / 2, H * 0.52, H * 0.08 * r, -Math.PI * 0.75, -Math.PI * 0.25);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(W / 2 - H * 0.2, H * 0.24);
    g.lineTo(W / 2 + H * 0.2, H * 0.55);
    g.stroke();
  } else {
    g.strokeStyle = 'rgba(255,255,255,0.25)';
    g.lineWidth = H * 0.04;
    g.beginPath();
    g.arc(W / 2, H * 0.45, H * 0.16, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = '#ffffff';
    g.beginPath();
    g.arc(W / 2, H * 0.45, H * 0.16, a, a + 1.6);
    g.stroke();
    g.fillStyle = '#ffffff';
    g.font = `600 ${H * 0.09}px ${ROUNDF}`;
    g.fillText('Загрузка…', W / 2, H * 0.78);
  }
};

export const Laptop: React.FC<{position: V3; rotation?: V3; bad: boolean; a: number}> = ({position, rotation, bad, a}) => (
  <group position={position} rotation={rotation}>
    <RBox position={[0, 0.012, 0]} size={[0.5, 0.024, 0.34]} r={0.01} color="#b8bcc4" look={{metal: 0.5, rough: 0.35}} />
    <group position={[0, 0.024, -0.16]} rotation={[-0.25, 0, 0]}>
      <RBox position={[0, 0.16, 0]} size={[0.5, 0.32, 0.016]} r={0.01} color="#b8bcc4" look={{metal: 0.5, rough: 0.35}} />
      <Pic size={[0.46, 0.28]} res={[384, 234]} k={`lap-${bad ? 'bad' : Math.round(a * 4)}`} position={[0, 0.16, 0.0095]} lit={false} glow={1.05} draw={drawSpinner(bad, a)} />
    </group>
  </group>
);

const drawConsoleTv = (pct: number, days: string) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2a1660');
  bg.addColorStop(1, '#c8307a');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff';
  g.font = `600 ${H * 0.2}px ${COND}`;
  g.fillText('GTA 6', W / 2, H * 0.25);
  g.font = `500 ${H * 0.075}px ${ROUNDF}`;
  g.fillText('УСТАНОВКА 212 ГБ', W / 2, H * 0.45);
  const bw = W * 0.7;
  g.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(g, (W - bw) / 2, H * 0.56, bw, H * 0.06, H * 0.03);
  g.fill();
  g.fillStyle = '#ffd23f';
  roundRect(g, (W - bw) / 2, H * 0.56, Math.max(H * 0.06, bw * pct), H * 0.06, H * 0.03);
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = `700 ${H * 0.085}px ${ROUNDF}`;
  const s = fit(g, days, W * 0.85, H * 0.085, 700, ROUNDF);
  g.font = `700 ${s}px ${ROUNDF}`;
  g.fillText(days, W / 2, H * 0.76);
};

export const Tv: React.FC<{position: V3; rotation?: V3; w?: number; pct: number; days: string; on?: boolean}> = ({position, rotation, w = 1.6, pct, days, on = true}) => {
  const h = w * 0.5625;
  return (
    <group position={position} rotation={rotation}>
      <RBox position={[0, h / 2, 0]} size={[w + 0.06, h + 0.06, 0.06]} r={0.02} color="#16171c" look={{rough: 0.3}} />
      {on ? <Pic size={[w, h]} res={[640, 360]} k={`tv-${Math.round(pct * 200)}-${days}`} position={[0, h / 2, 0.032]} lit={false} glow={1.0} draw={drawConsoleTv(pct, days)} /> : null}
    </group>
  );
};

// a generic black console standing upright, a light strip on the front; heat makes it glow orange-red
export const Console: React.FC<{position: V3; on: number; heat: number; t: number}> = ({position, on, heat, t}) => {
  const col = new THREE.Color('#16171c').lerp(new THREE.Color('#ff5a1e'), heat * 0.6);
  const jitter = heat > 0.4 ? (heat - 0.4) * 0.01 * Math.sin(t * 90) : 0;
  return (
    <group position={[position[0] + jitter, position[1], position[2]]}>
      <RBox position={[0, 0.2, 0]} size={[0.11, 0.4, 0.3]} r={0.02} color={'#' + col.getHexString()} look={{rough: 0.35, emissive: '#ff4a1a', emissiveK: heat * 0.8}} />
      <RBox position={[0, 0.2, 0.153]} size={[0.02, 0.32, 0.008]} r={0.004} color={on > 0 ? '#5ab8ff' : '#2a2b33'} look={on > 0 ? {basic: true} : {}} shadow={false} />
      <Cyl position={[0.0, 0.05, 0.155]} rotation={[Math.PI / 2, 0, 0]} rt={0.012} rb={0.012} h={0.01} seg={12} color={on > 0 ? '#ffffff' : '#5a5a60'} look={on > 0 ? {basic: true} : {}} />
      {on > 0 ? <Glow position={[0, 0.2, 0.2]} size={0.5} color="#5ab8ff" k={on * (1 - heat * 0.6)} /> : null}
      {heat > 0 ? <Glow position={[0, 0.2, 0.05]} size={1.0 + heat * 1.6} color="#ff7a3a" k={heat} /> : null}
      {heat > 0.3
        ? Array.from({length: 6}).map((_, i) => {
            const ph = (t * 0.8 + rnd(i)) % 1;
            return <Ball key={i} position={[(rnd(i * 3) - 0.5) * 0.12, 0.42 + ph * 0.5, (rnd(i * 5) - 0.5) * 0.25]} scale={0.03 + ph * 0.06} color="#d8d8dc" look={{opacity: (1 - ph) * 0.5 * heat, rough: 1}} shadow={false} receive={false} />;
          })
        : null}
    </group>
  );
};

export const Couch: React.FC<{position: V3; rotation?: number; color?: string}> = ({position, rotation = 0, color = '#5a6ab8'}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <RBox position={[0, 0.22, 0]} size={[2.0, 0.3, 0.85]} r={0.08} color={color} look={{rough: 0.95}} />
    <RBox position={[0, 0.62, -0.35]} size={[2.0, 0.6, 0.22]} r={0.09} color={color} look={{rough: 0.95}} />
    {[-1, 1].map((s) => (
      <RBox key={s} position={[s * 0.92, 0.45, 0]} size={[0.22, 0.42, 0.85]} r={0.08} color={color} look={{rough: 0.95}} />
    ))}
    <RBox position={[-0.43, 0.42, 0.02]} size={[0.82, 0.12, 0.72]} r={0.06} color="#6a7ac8" look={{rough: 0.95}} />
    <RBox position={[0.43, 0.42, 0.02]} size={[0.82, 0.12, 0.72]} r={0.06} color="#6a7ac8" look={{rough: 0.95}} />
  </group>
);

// cobweb: thin pale threads from a corner
export const Web: React.FC<{position: V3; rotation?: V3; s?: number; k?: number}> = ({position, rotation, s = 0.4, k = 1}) => (
  <group position={position} rotation={rotation} scale={s * k}>
    {Array.from({length: 6}).map((_, i) => {
      const a = (i / 5) * (Math.PI / 2);
      return <Block key={i} position={[Math.cos(a) * 0.5, -Math.sin(a) * 0.5, 0]} rotation={[0, 0, -a]} size={[1, 0.012, 0.004]} color="#f4f4f8" look={{opacity: 0.75}} shadow={false} receive={false} />;
    })}
    {[0.3, 0.55, 0.8].map((r, j) => (
      <Ring key={j} rotation={[0, 0, -Math.PI / 2]} r={r} tube={0.006} arc={Math.PI / 2} color="#f4f4f8" look={{opacity: 0.6}} shadow={false} />
    ))}
  </group>
);

// ---------------------------------------------------------------- lift doors (opening, centre at x = 0, floor at y = 0, facing +z)

export const Lift: React.FC<{gap: number; sign: boolean}> = ({gap, sign}) => {
  const W = 1.1;
  const H = 2.2;
  return (
    <group>
      {/* frame */}
      <RBox position={[0, H + 0.08, 0.02]} size={[W * 2 + 0.36, 0.16, 0.12]} r={0.02} color="#9aa2ac" look={{metal: 0.6, rough: 0.35}} />
      {[-1, 1].map((s) => (
        <RBox key={s} position={[s * (W + 0.1), H / 2, 0.02]} size={[0.2, H, 0.12]} r={0.02} color="#9aa2ac" look={{metal: 0.6, rough: 0.35}} />
      ))}
      {/* doors slide left and right */}
      {[-1, 1].map((s) => (
        <RBox key={`d${s}`} position={[s * (W / 2 + gap * W * 0.5), H / 2, 0.035]} size={[W - 0.01, H, 0.04]} r={0.01} color="#c8ced6" look={{metal: 0.75, rough: 0.25}} />
      ))}
      {/* the overload sign */}
      {sign ? <Pic size={[1.2, 0.3]} res={[512, 128]} k="lift-sign" position={[0, H + 0.42, 0.04]} lit={false} glow={1.15} draw={(g, W2, H2) => {
        g.fillStyle = '#e8352c';
        roundRect(g, 4, 4, W2 - 8, H2 - 8, 26);
        g.fill();
        g.fillStyle = '#ffffff';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.font = `800 ${H2 * 0.56}px ${ROUNDF}`;
        g.fillText('ПЕРЕГРУЗ', W2 / 2, H2 / 2 + 4);
      }} /> : <RBox position={[0, H + 0.42, 0.03]} size={[1.2, 0.3, 0.02]} r={0.03} color="#3a1a1a" />}
    </group>
  );
};

// ---------------------------------------------------------------- city lights on a toy Earth: dots on the camera-facing side

export type Light = {d: V3; i: number};
export const lightsOn = (center: V3, n: number, spread: number, seed: number): Light[] =>
  Array.from({length: n}, (_, i) => {
    const a = rnd(seed + i * 2.3) * Math.PI * 2;
    const r = spread * Math.sqrt(rnd(seed * 3 + i * 1.7));
    const d = new THREE.Vector3(center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r * 0.7, center[2]).normalize();
    return {d: [d.x, d.y, d.z], i};
  });

export const CityLights: React.FC<{r: number; lights: Light[]; off: (l: Light) => boolean; size?: number}> = ({r, lights, off, size = 0.035}) => (
  <>
    {lights.map((l) => {
      const o = off(l);
      return <Ball key={l.i} position={[l.d[0] * r * 1.003, l.d[1] * r * 1.003, l.d[2] * r * 1.003]} scale={size * (0.7 + rnd(l.i * 7) * 0.6) * (o ? 0.6 : 1)} color={o ? '#3a5a8a' : '#ffe27a'} look={o ? {rough: 0.6} : {basic: true}} shadow={false} receive={false} />;
    })}
  </>
);

export {Ball, Block, Cone, Cyl, Glow, RBox, Ring};
