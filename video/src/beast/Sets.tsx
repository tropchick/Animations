import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {Ball, Block, Cone, Cyl, G, Glow, RBox, Ring, mat} from '../bear/kit';
import {Pic} from '../bear/Props';
import {Outfit} from '../bear/People';
import {COND, roundRect} from '../gta/tex';
import {drawBill} from '../cheats/tex';
import {V3, rnd} from './cues';

// Sets for «Кто богаче: Габен или Мистер Бист?». Soft toy style, no logos (no Valve / Steam / YouTube / Feastables marks).

export const G_COL = '#2fae6a'; // Gaben's side of the score
export const B_COL = '#2a7ae2'; // MrBeast's side

// both are plush toys: Gaben grey beard + glasses + teal shirt, MrBeast blue hoodie + short dark beard
export const GABE: Outfit = {
  skin: '#f0c2a0',
  hair: '#bdbdc4',
  hairStyle: 'short',
  top: '#2f8f9a',
  topStyle: 'cardigan',
  shirt: '#277a84',
  legs: '#4a4f5a',
  legStyle: 'pants',
  shoes: '#3a2a20',
  glasses: true,
  beard: '#d6d6dc',
  iris: '#4a3020',
  scale: 1.04,
};
// Gaben at 27: dark hair, office suit
export const GABE27: Outfit = {...GABE, hair: '#4a3324', beard: '#4a3324', top: '#5a6070', topStyle: 'suit', legs: '#5a6070', shirt: '#f4f6fa', tie: '#3a5a9a', scale: 1};
export const BEAST: Outfit = {
  skin: '#f2c4a2',
  hair: '#6a4a2e',
  hairStyle: 'short',
  top: B_COL,
  topStyle: 'hoodie',
  legs: '#2f4466',
  legStyle: 'jeans',
  shoes: '#f2f2f2',
  beard: '#6a4a2e',
  iris: '#3a6aa0',
};

// ---------------------------------------------------------------- text on a plate

const drawPlate = (text: string, bg: string, fg = '#ffffff', size = 0.5) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = bg;
  roundRect(g, 0, 0, W, H, H * 0.18);
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.lineWidth = H * 0.05;
  roundRect(g, H * 0.06, H * 0.06, W - H * 0.12, H - H * 0.12, H * 0.14);
  g.stroke();
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lines = text.split('\n');
  g.font = `700 ${H * size}px ${COND}`;
  lines.forEach((l, i) => g.fillText(l, W / 2, H * (0.53 + (i - (lines.length - 1) / 2) * size * 1.08)));
};
export const Plate: React.FC<{position: V3; rotation?: V3; w: number; h: number; text: string; bg: string; fg?: string; size?: number; k: string; lit?: boolean; glow?: number}> = ({position, rotation, w, h, text, bg, fg, size, k, lit, glow}) => (
  <Pic size={[w, h]} res={w >= h ? [1024, Math.max(64, Math.round((1024 * h) / w))] : [Math.max(64, Math.round((1024 * w) / h)), 1024]} k={k} position={position} rotation={rotation} draw={drawPlate(text, bg, fg, size)} lit={lit} glow={glow} />
);

// ---------------------------------------------------------------- instanced crowds (cheap: two draw calls per crowd)

type Inst = {p: V3; s: number; c: string; ry?: number; up?: V3};
const useInst = (ref: React.RefObject<THREE.InstancedMesh | null>, items: Inst[], local: (i: Inst) => THREE.Matrix4) => {
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const col = new THREE.Color();
    items.forEach((it, i) => {
      m.setMatrixAt(i, local(it));
      m.setColorAt(i, col.set(it.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [ref, items, local]);
};
const SHIRTS = ['#e85d5d', '#4a7fd0', '#f2c14e', '#6fbf73', '#b36ad1', '#ef8f4a', '#4fb6c2', '#f4f1ea', '#3d3d48', '#ff8fb1'];
const SKINS = ['#f4c7a6', '#e6b08a', '#f7d2b6', '#d89e78', '#c88e68'];
const HAIRS = ['#2a1d15', '#4a3324', '#7b5434', '#c9a46a', '#1a1a1a'];

// little people: a body capsule and a head ball each, standing on their points, "up" along the given normal
export const Crowd: React.FC<{pts: {p: V3; up?: V3; s?: number}[]; seed?: number}> = ({pts, seed = 1}) => {
  const body = useRef<THREE.InstancedMesh>(null);
  const head = useRef<THREE.InstancedMesh>(null);
  const hair = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(
    () =>
      pts.map((q, i) => ({
        p: q.p,
        up: q.up ?? ([0, 1, 0] as V3),
        s: q.s ?? 1,
        c: SHIRTS[Math.floor(rnd(seed + i * 1.7) * SHIRTS.length)],
        sk: SKINS[Math.floor(rnd(seed + i * 2.3) * SKINS.length)],
        hr: HAIRS[Math.floor(rnd(seed + i * 3.1) * HAIRS.length)],
        ry: rnd(seed + i * 4.3) * 0.8 - 0.4,
      })),
    [pts, seed],
  );
  const frame = (it: (typeof items)[number], off: number, sc: V3) => {
    const up = new THREE.Vector3(...it.up).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), it.ry));
    const pos = new THREE.Vector3(...it.p).addScaledVector(up, off * it.s);
    return new THREE.Matrix4().compose(pos, q, new THREE.Vector3(sc[0] * it.s, sc[1] * it.s, sc[2] * it.s));
  };
  const lb = useMemo(() => (it: Inst) => frame(it as (typeof items)[number], 0.32, [1, 1, 1]), [items]); // eslint-disable-line react-hooks/exhaustive-deps
  const lh = useMemo(() => (it: Inst) => frame(it as (typeof items)[number], 0.74, [0.15, 0.15, 0.15]), [items]); // eslint-disable-line react-hooks/exhaustive-deps
  const lr = useMemo(() => (it: Inst) => frame(it as (typeof items)[number], 0.79, [0.155, 0.12, 0.155]), [items]); // eslint-disable-line react-hooks/exhaustive-deps
  useInst(body, items, lb);
  useInst(head, useMemo(() => items.map((x) => ({...x, c: x.sk})), [items]), lh);
  useInst(hair, useMemo(() => items.map((x) => ({...x, c: x.hr})), [items]), lr);
  const bodyGeo = G.capsule(0.13, 0.32, 8);
  const ballGeo = G.sphere(12);
  const m = useMemo(() => new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.85}), []);
  return (
    <>
      <instancedMesh key={`b${items.length}`} ref={body} args={[bodyGeo, m, items.length]} castShadow={false} receiveShadow />
      <instancedMesh key={`h${items.length}`} ref={head} args={[ballGeo, m, items.length]} />
      <instancedMesh key={`r${items.length}`} ref={hair} args={[ballGeo, m, items.length]} />
    </>
  );
};

// ---------------------------------------------------------------- outdoors

export const Sky: React.FC<{top?: string; fog?: string; near?: number; far?: number}> = ({top = '#a8dcff', fog = '#c8e8ff', near = 14, far = 45}) => (
  <>
    <color attach="background" args={[top]} />
    <fog attach="fog" args={[fog, near, far]} />
  </>
);
export const Ground: React.FC<{color?: string; size?: number}> = ({color = '#7ccf6a', size = 120}) => <Block position={[0, -0.05, 0]} size={[size, 0.1, size]} color={color} look={{rough: 0.95}} />;

export const Cloud: React.FC<{position: V3; s?: number}> = ({position, s = 1}) => (
  <group position={position} scale={s}>
    {[
      [0, 0, 0, 1],
      [0.9, -0.15, 0.1, 0.75],
      [-0.9, -0.2, 0, 0.7],
      [0.35, 0.45, -0.1, 0.65],
    ].map(([x, y, z, r], i) => (
      <Ball key={i} position={[x, y, z]} scale={[r, r * 0.8, r * 0.8]} color="#ffffff" look={{rough: 1, rim: '#ffffff', rimK: 0.3}} shadow={false} />
    ))}
  </group>
);

// ---------------------------------------------------------------- money

// a column of gold coins, growing to height h (rings every 6 cm, a $ on top)
export const CoinColumn: React.FC<{position: V3; h: number; r?: number}> = ({position, h, r = 0.42}) => {
  const n = Math.max(0, Math.floor(h / 0.06));
  return (
    <group position={position}>
      {h > 0.01 ? <Cyl position={[0, h / 2, 0]} rt={r} rb={r} h={h} seg={28} color="#f2b82a" look={{metal: 0.55, rough: 0.35}} /> : null}
      {Array.from({length: n}).map((_, i) => (
        <Ring key={i} position={[0, 0.03 + i * 0.06, 0]} rotation={[Math.PI / 2, 0, 0]} r={r + 0.004} tube={0.012} color="#d8981a" look={{metal: 0.5, rough: 0.4}} shadow={false} />
      ))}
      {h > 0.01 ? <Cyl position={[0, h + 0.006, 0]} rt={r * 0.82} rb={r * 0.82} h={0.012} seg={28} color="#ffd65a" look={{metal: 0.5, rough: 0.3}} shadow={false} /> : null}
      {/* loose coins at the foot */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Cyl key={i} position={[Math.cos(i * 1.9) * (r + 0.18), 0.012 + (i % 2) * 0.004, Math.sin(i * 1.9) * (r + 0.18)]} rotation={[0.05 * i, i, 0]} rt={0.07} rb={0.07} h={0.02} seg={16} color="#ffc81e" look={{metal: 0.6, rough: 0.35}} />
      ))}
    </group>
  );
};

export const Bill: React.FC<{position: V3; rotation?: V3; s?: number}> = ({position, rotation, s = 1}) => (
  <Pic position={position} rotation={rotation} size={[0.32 * s, 0.15 * s]} res={[128, 60]} k="bill" draw={drawBill} />
);

// a stream of bills flying out of a point in a cone along +z
export const BillStream: React.FC<{from: V3; t: number; n?: number; dir?: number}> = ({from, t, n = 46, dir = 0}) => {
  if (t <= 0) return null;
  return (
    <group position={from} rotation={[0, dir, 0]}>
      {Array.from({length: n}).map((_, i) => {
        const born = rnd(i * 1.37) * 2.6;
        const age = t - born;
        if (age <= 0 || age > 2.6) return null;
        const a = rnd(i * 2.1) * Math.PI * 2;
        const sp = 0.7 + rnd(i * 3.3) * 0.6;
        const spread = 0.35 + rnd(i * 5.1) * 0.5;
        const z = age * 1.8 * sp;
        const x = Math.cos(a) * spread * age * 1.2;
        const y = Math.sin(a) * spread * age * 0.8 + 0.6 * age - 0.45 * age * age;
        return <Bill key={i} position={[x, y, z]} rotation={[age * 4 + i, age * 3 + i * 2, age * 2]} s={0.8} />;
      })}
    </group>
  );
};

// ---------------------------------------------------------------- the stage with the online counter

const drawCounter = (n: string, on: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#141826';
  roundRect(g, 0, 0, W, H, H * 0.1);
  g.fill();
  g.strokeStyle = '#3a4a70';
  g.lineWidth = H * 0.04;
  roundRect(g, H * 0.04, H * 0.04, W - H * 0.08, H - H * 0.08, H * 0.08);
  g.stroke();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = on ? '#7dffb0' : '#2a4a3a';
  g.font = `700 ${H * 0.42}px ${COND}`;
  g.fillText(n, W / 2, H * 0.4);
  g.fillStyle = on ? '#ffffff' : '#3a4050';
  g.font = `700 ${H * 0.2}px ${COND}`;
  g.fillText('ЧЕЛОВЕК ОНЛАЙН', W / 2, H * 0.77);
};
export const Stage: React.FC<{on: number}> = ({on}) => (
  <group>
    <RBox position={[0, 0.25, 0]} size={[6, 0.5, 3]} r={0.06} color="#3a3450" look={{rough: 0.7}} />
    <Block position={[0, 0.505, 1.48]} size={[6, 0.02, 0.06]} color="#ffd23f" look={{emissive: '#ffb020', emissiveK: 0.8}} shadow={false} />
    {/* the counter board on two posts */}
    {[-2.3, 2.3].map((x) => (
      <Cyl key={x} position={[x, 2.2, -1.2]} rt={0.08} rb={0.08} h={3.4} seg={12} color="#2a2a34" look={{metal: 0.6, rough: 0.35}} />
    ))}
    <RBox position={[0, 3.0, -1.25]} size={[4.9, 1.75, 0.16]} r={0.05} color="#20222c" />
    <Pic position={[0, 3.0, -1.165]} size={[4.7, 1.55]} res={[1024, 338]} k={`ctr${on}`} draw={drawCounter('43 500 000', on)} lit={false} glow={on ? 1.15 : 0.8} />
    {/* spotlights */}
    {[-2.6, 2.6].map((x) => (
      <group key={x} position={[x, 0.55, 1.2]} rotation={[0.9, -0.4 * Math.sign(x), 0]}>
        <Cyl rt={0.12} rb={0.16} h={0.3} seg={14} color="#1a1a20" look={{metal: 0.5, rough: 0.3}} />
      </group>
    ))}
  </group>
);

// rows of players at small glowing screens, in front of the stage (they face the stage, towards -z)
export const crowdRows = (rows: number, cols: number, z0: number, dz: number, dx: number, s = 0.62): {p: V3; s: number}[] => {
  const out: {p: V3; s: number}[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * dx + (r % 2) * dx * 0.5 + (rnd(r * 31 + c) - 0.5) * 0.15;
      out.push({p: [x, 0, z0 + r * dz + (rnd(r * 7 + c * 3) - 0.5) * 0.15], s: s * (0.92 + rnd(r * 11 + c) * 0.16)});
    }
  return out;
};
export const Screens: React.FC<{pts: {p: V3; s: number}[]}> = ({pts}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => pts.map((q) => ({p: [q.p[0], 0.62 * q.s, q.p[2] - 0.28 * q.s] as V3, s: q.s, c: '#9fe8ff'})), [pts]);
  const local = useMemo(() => (it: Inst) => new THREE.Matrix4().compose(new THREE.Vector3(...it.p), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, 0)), new THREE.Vector3(0.34 * it.s, 0.22 * it.s, 0.02)), []);
  useInst(ref, items, local);
  const m = useMemo(() => new THREE.MeshBasicMaterial({color: '#ffffff', toneMapped: false}), []);
  return <instancedMesh key={items.length} ref={ref} args={[G.box(), m, items.length]} />;
};

// ---------------------------------------------------------------- the globe covered in subscribers

export const GLOBE_R = 3;
const CONTINENTS: [number, number, number][] = [
  // lat, lon, size (rad)
  [0.75, -1.7, 0.55],
  [0.25, -1.3, 0.35],
  [-0.35, -1.0, 0.45],
  [0.85, 0.3, 0.5],
  [0.2, 0.35, 0.55],
  [0.8, 1.6, 0.75],
  [0.3, 1.4, 0.45],
  [-0.45, 2.2, 0.4],
];
const sph = (lat: number, lon: number, r: number): V3 => [r * Math.cos(lat) * Math.sin(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.cos(lon)];
export const Globe: React.FC<{n?: number}> = ({n = 1300}) => {
  const pts = useMemo(() => {
    const out: {p: V3; up: V3; s: number}[] = [];
    for (let i = 0; i < n; i++) {
      // fibonacci sphere, skipping the very top (MrBeast stands there)
      const y = 1 - (2 * (i + 0.5)) / n;
      if (y > 0.985) continue;
      const rr = Math.sqrt(1 - y * y);
      const a = i * 2.39996;
      const up: V3 = [rr * Math.sin(a), y, rr * Math.cos(a)];
      out.push({p: [up[0] * GLOBE_R, up[1] * GLOBE_R, up[2] * GLOBE_R], up, s: 0.14 + rnd(i * 1.3) * 0.03});
    }
    return out;
  }, [n]);
  return (
    <group>
      <mesh geometry={G.sphere(64)} scale={GLOBE_R - 0.004} material={mat('#3a8ad8', {rough: 0.55, rim: '#bfe6ff', rimK: 0.5})} receiveShadow />
      {CONTINENTS.map(([lat, lon, s], i) => (
        <mesh key={i} position={sph(lat, lon, GLOBE_R - s * GLOBE_R * 0.5 * 0.88)} scale={[s * GLOBE_R * 0.5, s * GLOBE_R * 0.5, s * GLOBE_R * 0.5]} geometry={G.sphere(32)} material={mat('#6cc46a', {rough: 0.9})} />
      ))}
      <Crowd pts={pts} seed={5} />
    </group>
  );
};
export const Stars: React.FC<{n?: number; r?: number}> = ({n = 500, r = 80}) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = rnd(i * 1.1) * 2 - 1;
      const t = rnd(i * 2.7) * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      a[i * 3] = r * s * Math.cos(t);
      a[i * 3 + 1] = r * u;
      a[i * 3 + 2] = r * s * Math.sin(t);
    }
    g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    return g;
  }, [n, r]);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#ffffff" size={2.2} sizeAttenuation={false} fog={false} />
    </points>
  );
};

// ---------------------------------------------------------------- the video camera on a tripod (lens towards +z)

export const VideoCam: React.FC<{position: V3; rotation?: number; rec?: boolean}> = ({position, rotation = 0, rec}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    {[0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      return <Cyl key={i} position={[Math.sin(a) * 0.22, 0.55, Math.cos(a) * 0.22]} rotation={[Math.cos(a) * 0.38, 0, -Math.sin(a) * 0.38]} rt={0.02} rb={0.025} h={1.18} seg={8} color="#2a2a30" look={{metal: 0.5, rough: 0.4}} />;
    })}
    <Cyl position={[0, 1.14, 0]} rt={0.06} rb={0.06} h={0.1} seg={12} color="#2a2a30" />
    <RBox position={[0, 1.33, -0.05]} size={[0.32, 0.3, 0.55]} r={0.05} color="#33343c" look={{rough: 0.5}} />
    <Cyl position={[0, 1.33, 0.32]} rotation={[Math.PI / 2, 0, 0]} rt={0.12} rb={0.1} h={0.22} seg={20} color="#1a1a20" look={{rough: 0.3}} />
    <Cyl position={[0, 1.33, 0.434]} rotation={[Math.PI / 2, 0, 0]} rt={0.085} rb={0.085} h={0.01} seg={20} color="#3a5a8a" look={{metal: 0.6, rough: 0.1}} shadow={false} />
    <Ball position={[0.12, 1.5, 0.18]} scale={0.025} color={rec ? '#ff2a2a' : '#5a1a1a'} look={rec ? {emissive: '#ff2020', emissiveK: 1.5} : {}} shadow={false} />
  </group>
);

// ---------------------------------------------------------------- the yacht (bow towards +z), deck at y ~ 2.1

export const YACHT_DECK = 2.12;
const Bow: React.FC<{w: number; h: number; len: number; y: number; z: number; color: string}> = ({w, h, len, y, z, color}) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0);
    s.quadraticCurveTo(-w / 2, len * 0.55, 0, len);
    s.quadraticCurveTo(w / 2, len * 0.55, w / 2, 0);
    s.lineTo(-w / 2, 0);
    const g = new THREE.ExtrudeGeometry(s, {depth: h, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 18});
    g.rotateX(Math.PI / 2);
    g.translate(0, h / 2, 0);
    return g;
  }, [w, h, len]);
  return <mesh geometry={geo} position={[0, y + h / 2, z]} material={mat(color, {rough: 0.45})} castShadow receiveShadow />;
};
export const Yacht: React.FC<{position?: V3; rotation?: number; bob?: number; s?: number; children?: React.ReactNode; ruler?: number}> = ({position = [0, 0, 0], rotation = 0, bob = 0, s = 1, children, ruler = 0}) => (
  <group position={[position[0], position[1] + Math.sin(bob * 1.2) * 0.04 * s, position[2]]} rotation={[Math.sin(bob * 0.9) * 0.01, rotation, Math.sin(bob * 1.1) * 0.012]} scale={s}>
    {/* hull: white, a navy band at the water line, a pointed bow */}
    <RBox position={[0, 1.05, -1]} size={[3.4, 2.1, 12]} r={0.12} color="#fbfbfb" look={{rough: 0.45}} />
    <Bow w={3.4} h={2.1} len={3.8} y={0} z={5} color="#fbfbfb" />
    <RBox position={[0, 0.2, -1]} size={[3.43, 0.4, 12.03]} r={0.1} color="#1e3a6a" look={{rough: 0.5}} />
    <Bow w={3.43} h={0.4} len={3.84} y={0} z={4.99} color="#1e3a6a" />
    {/* deck */}
    <Block position={[0, YACHT_DECK - 0.02, -0.6]} size={[3.2, 0.04, 12.6]} color="#c8a070" look={{rough: 0.7}} />
    {/* the superstructure: three decks stepping back, dark window bands a little proud */}
    {[
      [0, 2.6, 7.6, 0.95, -2.2],
      [1, 2.2, 5.6, 0.85, -2.8],
      [2, 1.7, 3.4, 0.75, -3.4],
    ].map(([i, w, d, h, z]) => {
      const y = YACHT_DECK + 0.02 + i * 0.9 + h / 2;
      return (
        <group key={i}>
          <RBox position={[0, y, z]} size={[w, h, d]} r={0.08} color="#f4f4f6" look={{rough: 0.45}} />
          <RBox position={[0, y + 0.08, z + 0.02]} size={[w + 0.03, h * 0.38, d - 0.4]} r={0.05} color="#1a2a3a" look={{rough: 0.15, metal: 0.4}} />
        </group>
      );
    })}
    <Cyl position={[0, YACHT_DECK + 2.95, -3.6]} rt={0.05} rb={0.07} h={1.4} seg={10} color="#e8e8ea" />
    <Ball position={[0, YACHT_DECK + 3.7, -3.6]} scale={[0.18, 0.18, 0.18]} color="#ffffff" />
    {/* rails */}
    {[-1.62, 1.62].map((x) => (
      <Block key={x} position={[x, YACHT_DECK + 0.45, 1.6]} size={[0.035, 0.035, 6.4]} color="#d0d4da" look={{metal: 0.7, rough: 0.3}} shadow={false} />
    ))}
    {/* the length ruler along the side (0..1 grows from stern to bow) */}
    {ruler > 0 ? (
      <group position={[1.78, 2.55, 0]}>
        <Block position={[0, 0, -7 + 8.9 * ruler]} size={[0.05, 0.08, 17.8 * ruler]} color="#ffd23f" look={{emissive: '#ffb020', emissiveK: 0.6}} shadow={false} />
        <Block position={[0, 0, -7]} size={[0.05, 0.5, 0.08]} color="#ffd23f" look={{emissive: '#ffb020', emissiveK: 0.6}} shadow={false} />
        {ruler > 0.98 ? <Block position={[0, 0, 10.8]} size={[0.05, 0.5, 0.08]} color="#ffd23f" look={{emissive: '#ffb020', emissiveK: 0.6}} shadow={false} /> : null}
      </group>
    ) : null}
    {children}
  </group>
);

export const Sea: React.FC<{t: number; color?: string; foam?: string}> = ({t, color = '#2f8ac0', foam = '#9fd4f0'}) => (
  <>
    <Block size={[700, 0.1, 700]} position={[0, -0.05, 0]} color={color} look={{rough: 0.35, metal: 0.1}} />
    {Array.from({length: 90}).map((_, i) => {
      const x = (rnd(i + 1) - 0.5) * 140;
      const z = (rnd(i + 2) - 0.5) * 140;
      const s = 0.6 + 0.4 * Math.sin(t * 1.3 + i);
      return <Block key={i} size={[1.6 * s, 0.02, 0.14]} position={[x, 0.012 + 0.003 * (i % 5), z]} color={foam} shadow={false} />;
    })}
  </>
);

// a sun lounger (head end at -z)
export const Lounger: React.FC<{position: V3; rotation?: number}> = ({position, rotation = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <RBox position={[0, 0.32, 0.25]} size={[0.62, 0.08, 1.2]} r={0.03} color="#f2f2f2" />
    <RBox position={[0, 0.56, -0.55]} rotation={[0.75, 0, 0]} size={[0.62, 0.08, 0.7]} r={0.03} color="#f2f2f2" />
    <RBox position={[0, 0.375, 0.25]} size={[0.58, 0.04, 1.16]} r={0.02} color="#ff8a5a" shadow={false} />
    {[-0.27, 0.27].map((x) => [-0.3, 0.75].map((z) => <Block key={`${x}${z}`} size={[0.04, 0.3, 0.04]} position={[x, 0.15, z]} color="#9aa0a8" />))}
  </group>
);

// ---------------------------------------------------------------- the shipyard on the shore

export const Shipyard: React.FC = () => (
  <group>
    <Block position={[0, 0.25, 0]} size={[40, 0.5, 18]} color="#d8c8a0" look={{rough: 0.95}} />
    {/* the hall: walls, sawtooth roof */}
    <RBox position={[0, 3.0, -2]} size={[14, 5.0, 9]} r={0.08} color="#d6dee8" look={{rough: 0.7}} />
    {[-5.25, -1.75, 1.75, 5.25].map((x) => (
      <mesh key={x} position={[x, 5.5, -2]} rotation={[0, 0, 0]} geometry={G.cyl(0.001, 2.0, 1.4, 3)} material={mat('#9aa8bc', {rough: 0.6, flat: true})} scale={[1, 1, 3.2]} castShadow />
    ))}
    {/* the big gate, open: a dark inside with a hull in it */}
    <Block position={[0, 2.3, 2.52]} size={[7, 3.6, 0.02]} color="#2a3040" shadow={false} />
    <RBox position={[0, 4.4, 2.56]} size={[8.6, 0.5, 0.12]} r={0.03} color="#3a4a60" />
    <Plate position={[0, 4.4, 2.63]} w={8.2} h={0.42} text="ЗАВОД ЯХТ" bg="#1f5fbf" size={0.72} k="yard" />
    <group position={[0, 0.5, 1.5]} scale={0.22}>
      <RBox position={[0, 3, 0]} size={[3.4, 3, 12]} r={0.2} color="#f0f0f2" />
    </group>
    {/* a crane */}
    <group position={[8.5, 0.5, 0.5]}>
      <Block position={[0, 4, 0]} size={[0.5, 8, 0.5]} color="#f2b82a" />
      <Block position={[-2.2, 7.8, 0]} size={[6.5, 0.35, 0.4]} color="#f2b82a" />
      <Block position={[-4.8, 6.6, 0]} size={[0.03, 2.3, 0.03]} color="#2a2a30" shadow={false} />
      <Block position={[-4.8, 5.4, 0]} size={[0.4, 0.3, 0.4]} color="#3a3a40" />
    </group>
    {/* the pier */}
    <Block position={[-9, 0.4, 6]} size={[3, 0.25, 8]} color="#a07850" />
  </group>
);

// ---------------------------------------------------------------- the office (1989): cubicles, beige CRTs

const drawCrt = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#0a1a0e';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#5aff8a';
  g.font = `600 ${H * 0.1}px monospace`;
  ['C:\\> DIR', 'WORK.TXT', 'C:\\> _'].forEach((l, i) => g.fillText(l, W * 0.08, H * (0.22 + i * 0.16)));
};
export const Crt: React.FC<{position: V3; rotation?: number}> = ({position, rotation = 0}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <RBox position={[0, 0.2, -0.05]} size={[0.42, 0.38, 0.4]} r={0.04} color="#d8cfb8" look={{rough: 0.6}} />
    <Pic position={[0, 0.22, 0.152]} size={[0.32, 0.26]} res={[256, 208]} k="crt" draw={drawCrt} lit={false} glow={1.1} />
    <RBox position={[0, 0.0, 0]} size={[0.3, 0.04, 0.26]} r={0.01} color="#c8bfa8" />
  </group>
);
export const Cubicle: React.FC<{position: V3; me?: boolean; open?: boolean}> = ({position, me, open}) => (
  <group position={position}>
    {/* the desk against the back panel, you sit facing -z */}
    <RBox position={[0, 0.74, -0.45]} size={[1.4, 0.05, 0.7]} r={0.01} color="#b89a72" />
    {[-0.66, 0.66].map((x) => (
      <Block key={x} position={[x, 0.37, -0.45]} size={[0.04, 0.72, 0.66]} color="#8a7a62" />
    ))}
    <Crt position={[0, 0.77, -0.55]} />
    <RBox position={[0, 0.775, -0.2]} size={[0.42, 0.03, 0.15]} r={0.008} color="#cfc6ae" />
    {/* partitions: back and sides */}
    <RBox position={[0, 0.75, -0.84]} size={[1.6, 1.5, 0.06]} r={0.02} color={me ? '#8a96a8' : '#9aa4b4'} look={{rough: 1}} />
    {(open ? [-0.8] : [-0.8, 0.8]).map((x) => (
      <RBox key={x} position={[x, 0.75, -0.25]} size={[0.06, 1.5, 1.2]} r={0.02} color="#9aa4b4" look={{rough: 1}} />
    ))}
    {/* the office chair */}
    <Cyl position={[0, 0.25, 0.15]} rt={0.03} rb={0.03} h={0.4} seg={8} color="#2a2a30" />
    <RBox position={[0, 0.46, 0.15]} size={[0.46, 0.06, 0.44]} r={0.02} color="#2a2a40" />
    <RBox position={[0, 0.75, 0.4]} size={[0.44, 0.5, 0.06]} r={0.02} color="#2a2a40" />
  </group>
);

// a lit ceiling strip
export const Strip: React.FC<{position: V3; len?: number}> = ({position, len = 2}) => (
  <Block position={position} size={[0.25, 0.04, len]} color="#ffffff" look={{basic: true}} shadow={false} />
);

// ---------------------------------------------------------------- the wallet and the moth (wallet opens around x, flaps up)

export const Wallet: React.FC<{position: V3; rotation?: V3; open: number}> = ({position, rotation, open}) => (
  <group position={position} rotation={rotation}>
    <RBox position={[0, 0.006, 0]} size={[0.2, 0.012, 0.11]} r={0.004} color="#6a3e22" look={{rough: 0.7}} />
    <RBox position={[0, 0.0135, 0]} size={[0.18, 0.003, 0.09]} r={0.001} color="#3a2214" shadow={false} />
    <group position={[0, 0.012, -0.055]} rotation={[-open * Math.PI * 0.85, 0, 0]}>
      <RBox position={[0, 0.0, 0.055]} size={[0.2, 0.012, 0.11]} r={0.004} color="#7a4a2a" look={{rough: 0.7}} />
    </group>
  </group>
);
export const Moth: React.FC<{position: V3; t: number}> = ({position, t}) => {
  const f = Math.sin(t * 38) * 0.9;
  return (
    <group position={position} rotation={[0.3, t * 0.8, 0]}>
      <Ball scale={[0.012, 0.012, 0.03]} color="#8a8070" shadow={false} />
      {([1, -1] as const).map((s) => (
        <group key={s} rotation={[0, 0, s * f]}>
          <Ball position={[s * 0.028, 0, 0]} scale={[0.028, 0.004, 0.022]} color="#b8ae98" look={{rough: 1}} shadow={false} />
        </group>
      ))}
    </group>
  );
};

// an envelope with a heart
const drawHeart = (g: CanvasRenderingContext2D, W: number, H: number) => {
  g.fillStyle = '#fbf6ea';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#d8ccb0';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(W / 2, H * 0.55);
  g.lineTo(W, 0);
  g.stroke();
  g.fillStyle = '#e8453c';
  const cx = W / 2;
  const cy = H * 0.56;
  const r = H * 0.16;
  g.beginPath();
  g.moveTo(cx, cy + r * 1.3);
  g.bezierCurveTo(cx - r * 2.2, cy - r * 0.2, cx - r * 0.9, cy - r * 1.7, cx, cy - r * 0.5);
  g.bezierCurveTo(cx + r * 0.9, cy - r * 1.7, cx + r * 2.2, cy - r * 0.2, cx, cy + r * 1.3);
  g.fill();
};
export const Envelope: React.FC<{position: V3; rotation?: V3}> = ({position, rotation}) => (
  <group position={position} rotation={rotation}>
    <Block size={[0.24, 0.15, 0.008]} color="#efe6d2" />
    <Pic position={[0, 0, 0.008]} size={[0.235, 0.145]} res={[256, 158]} k="env" draw={drawHeart} />
  </group>
);

// a gold room (for the cash throne)
export const GoldRoom: React.FC = () => (
  <>
    <Block position={[0, -0.05, 0]} size={[20, 0.1, 20]} color="#7a3a5a" look={{rough: 0.9}} />
    <Block position={[0, 3, -2.2]} size={[20, 6.2, 0.1]} color="#5a2a4a" look={{rough: 1}} />
    {[-2.4, -1.2, 1.2, 2.4].map((x) => (
      <CoinColumn key={x} position={[x, 0, -1.4 + Math.abs(x) * 0.1]} h={0.4 + Math.abs(x) * 0.25} r={0.25} />
    ))}
    <Glow position={[0, 2.2, -2.1]} size={4} color="#ffd27a" k={0.5} />
  </>
);

export {Ball, Block, Cone, Cyl, Glow, RBox, Ring};
