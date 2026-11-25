import { POOL } from '../config/pool';
import type { Box, Bubble, Vec3 } from './types';

/**
 * A ball. The cue ball is the first. `sunk` is seconds since it left play, or negative; `pocket` is
 * the one it dropped in, or -1 if it only faded.
 */
export type Ball = { r: number; p: Vec3; v: Vec3; w: Vec3; sunk: number; pocket: number };

export type Pool = {
  balls: Ball[];
  /** Nothing has touched the rack yet. */
  racked: boolean;
  leftover: number;
  time: number;
  /** Seconds since all were down. */
  done: number;
  /** Hardest knock and number of balls potted since last asked. */
  knock: number;
  potted: number;
};

/** A contact: ball `i` with ball `j`, with a cushion (`j` is the axis), or with pocket `j`. */
type Hit = { t: number; kind: 'none' | 'ball' | 'wall' | 'pocket'; i: number; j: number };

/**
 * Straight ahead: where the cue ball would first touch something, and if that is a ball, which, and
 * where it would land.
 */
export type Trace = {
  from: Vec3;
  to: Vec3;
  r: number;
  hit: number;
  lands: Vec3 | null;
  drops: boolean;
};

/** All on the far wall: its 4 corners, and the middles of its 2 long edges. */
export function pockets(box: Box): Vec3[] {
  'worklet';
  const out: Vec3[] = [];
  for (const y of [-1, 0, 1])
    for (const x of [-1, 1]) out.push({ x: x * box.hw, y: y * box.hh, z: box.depth });
  return out;
}

/** Where a ball sits snug in each pocket, touching every wall there. */
export function snugs(box: Box): Vec3[] {
  'worklet';
  const r = POOL.radius;
  return pockets(box).map((q) => ({
    x: q.x - Math.sign(q.x) * r,
    y: q.y - Math.sign(q.y) * r,
    z: q.z - r,
  }));
}

function newBall(p: Vec3, r: number): Ball {
  'worklet';
  return {
    r,
    p: { x: p.x, y: p.y, z: p.z },
    v: { x: 0, y: 0, z: 0 },
    w: { x: 0, y: 0, z: 0 },
    sunk: -1,
    pocket: -1,
  };
}

function unit(x: number, y: number, z: number): Vec3 {
  'worklet';
  const l = Math.max(1e-9, Math.hypot(x, y, z));
  return { x: x / l, y: y / l, z: z / l };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  'worklet';
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}

/** The balls to pot: layers of 1, 4 and 9 in each other's hollows, then one behind the middle. */
function rack(box: Box): Ball[] {
  'worklet';
  const side = 2 * POOL.radius + POOL.rack.gap;
  // A layer sits this far behind the one before.
  const deep = side / Math.SQRT2;
  const z = POOL.rack.z * box.depth;
  const out: Ball[] = [];
  for (let n = 1; n <= 3; n++)
    for (let row = 0; row < n; row++)
      for (let col = 0; col < n; col++)
        out.push(
          newBall(
            {
              x: (col - (n - 1) / 2) * side,
              y: (row - (n - 1) / 2) * side,
              z: z + (n - 1) * deep,
            },
            POOL.radius,
          ),
        );
  out.push(newBall({ x: 0, y: 0, z: z + 2 * deep + side }, POOL.radius));
  return out;
}

export function createPool(box: Box): Pool {
  'worklet';
  const cue = newBall({ x: 0, y: 0, z: POOL.radius }, POOL.radius);
  // None until a finger makes one.
  cue.sunk = POOL.sink;
  return {
    balls: [cue, ...rack(box)],
    racked: true,
    leftover: 0,
    time: 0,
    done: 0,
    knock: 0,
    potted: 0,
  };
}

/** Time until a moving point comes within `reach` of another, or Infinity. */
function meetTime(
  dx: number,
  dy: number,
  dz: number,
  vx: number,
  vy: number,
  vz: number,
  reach: number,
) {
  'worklet';
  const b = dx * vx + dy * vy + dz * vz;
  // Parting, or keeping level.
  if (b >= 0) return Infinity;
  const c = dx * dx + dy * dy + dz * dz - reach * reach;
  if (c <= 0) return 0;
  const a = vx * vx + vy * vy + vz * vz;
  const disc = b * b - a * c;
  return disc < 0 ? Infinity : (-b - Math.sqrt(disc)) / a;
}

function wallTime(p: number, v: number, lo: number, hi: number) {
  'worklet';
  if (v > 0) return Math.max(0, (hi - p) / v);
  if (v < 0) return Math.max(0, (lo - p) / v);
  return Infinity;
}

/** The first contact within `most` seconds of straight travel. */
function nextHit(balls: Ball[], box: Box, holes: Vec3[], most: number): Hit {
  'worklet';
  const hit: Hit = { t: most, kind: 'none', i: -1, j: -1 };
  for (let i = 0; i < balls.length; i++) {
    const a = balls[i]!;
    if (a.sunk >= 0) continue;
    const { p, v, r } = a;
    if (v.x !== 0 || v.y !== 0 || v.z !== 0) {
      const tx = wallTime(p.x, v.x, r - box.hw, box.hw - r);
      const ty = wallTime(p.y, v.y, r - box.hh, box.hh - r);
      const tz = wallTime(p.z, v.z, r, box.depth - r);
      const t = Math.min(tx, ty, tz);
      if (t < hit.t) {
        hit.t = t;
        hit.kind = 'wall';
        hit.i = i;
        hit.j = t === tx ? 0 : t === ty ? 1 : 2;
      }
      for (let k = 0; k < holes.length; k++) {
        const q = holes[k]!;
        const s = meetTime(p.x - q.x, p.y - q.y, p.z - q.z, v.x, v.y, v.z, POOL.mouth);
        if (s < hit.t) {
          hit.t = s;
          hit.kind = 'pocket';
          hit.i = i;
          hit.j = k;
        }
      }
    }
    for (let j = i + 1; j < balls.length; j++) {
      const b = balls[j]!;
      if (b.sunk >= 0) continue;
      const s = meetTime(
        b.p.x - p.x,
        b.p.y - p.y,
        b.p.z - p.z,
        b.v.x - v.x,
        b.v.y - v.y,
        b.v.z - v.z,
        r + b.r,
      );
      if (s < hit.t) {
        hit.t = s;
        hit.kind = 'ball';
        hit.i = i;
        hit.j = j;
      }
    }
  }
  return hit;
}

function travel(balls: Ball[], t: number) {
  'worklet';
  for (const b of balls) {
    if (b.sunk >= 0) continue;
    b.p.x += b.v.x * t;
    b.p.y += b.v.y * t;
    b.p.z += b.v.z * t;
  }
}

/** A cushion: bounces, and grips a ball that slides or spins against it. */
function cushion(b: Ball, axis: number) {
  'worklet';
  const r = b.r;
  const speed = axis === 0 ? b.v.x : axis === 1 ? b.v.y : b.v.z;
  const way = speed > 0 ? 1 : -1;
  // From the ball's middle to where it touches.
  const n = { x: axis === 0 ? way : 0, y: axis === 1 ? way : 0, z: axis === 2 ? way : 0 };
  const turning = cross(b.w, n);
  const sx = b.v.x + turning.x * r - n.x * speed * way;
  const sy = b.v.y + turning.y * r - n.y * speed * way;
  const sz = b.v.z + turning.z * r - n.z * speed * way;
  const slip = Math.hypot(sx, sy, sz);
  const push = (1 + POOL.cushion) * Math.abs(speed);
  b.v.x -= n.x * push;
  b.v.y -= n.y * push;
  b.v.z -= n.z * push;
  if (slip < 1e-6) return push;
  // As much as friction allows, and no more than stops a solid ball slipping.
  const j = Math.min(POOL.grip * push, (2 / 7) * slip);
  const f = { x: (-sx / slip) * j, y: (-sy / slip) * j, z: (-sz / slip) * j };
  b.v.x += f.x;
  b.v.y += f.y;
  b.v.z += f.z;
  const twist = cross(n, f);
  const k = 2.5 / r;
  b.w.x += twist.x * k;
  b.w.y += twist.y * k;
  b.w.z += twist.z * k;
  return push;
}

/** Two balls of equal density, with nothing but the push along the line between them. */
function knockBalls(a: Ball, b: Ball) {
  'worklet';
  const n = unit(b.p.x - a.p.x, b.p.y - a.p.y, b.p.z - a.p.z);
  const closing = (a.v.x - b.v.x) * n.x + (a.v.y - b.v.y) * n.y + (a.v.z - b.v.z) * n.z;
  const ma = a.r ** 3;
  const mb = b.r ** 3;
  const j = ((1 + POOL.ballBounce) * Math.max(0, closing)) / (ma + mb);
  a.v.x -= n.x * j * mb;
  a.v.y -= n.y * j * mb;
  a.v.z -= n.z * j * mb;
  b.v.x += n.x * j * ma;
  b.v.y += n.y * j * ma;
  b.v.z += n.z * j * ma;
  return Math.max(0, closing);
}

/** Resolves a contact the balls have just been moved to. Returns how hard it was. */
function resolve(balls: Ball[], hit: Hit) {
  'worklet';
  const a = balls[hit.i]!;
  if (hit.kind === 'wall') return cushion(a, hit.j);
  if (hit.kind === 'ball') return knockBalls(a, balls[hit.j]!);
  a.sunk = 0;
  a.pocket = hit.j;
  return 0;
}

/** How pockets draw a place. */
function drawOf(holes: Vec3[], p: Vec3): Vec3 {
  'worklet';
  const D = POOL.draw;
  const out = { x: 0, y: 0, z: 0 };
  for (const q of holes) {
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const dz = q.z - p.z;
    const d = Math.hypot(dx, dy, dz);
    if (d >= D.reach || d < 1e-6) continue;
    const k = (D.strength * (1 - d / D.reach)) / d;
    out.x += dx * k;
    out.y += dy * k;
    out.z += dz * k;
  }
  return out;
}

/** The rack springs apart from its middle. */
function burst(pool: Pool, hard: number) {
  'worklet';
  pool.racked = false;
  const n = pool.balls.length - 1;
  const c = { x: 0, y: 0, z: 0 };
  for (let i = 1; i <= n; i++) {
    const { p } = pool.balls[i]!;
    c.x += p.x / n;
    c.y += p.y / n;
    c.z += p.z / n;
  }
  for (let i = 1; i <= n; i++) {
    const { p, v } = pool.balls[i]!;
    const u = unit(p.x - c.x, p.y - c.y, p.z - c.z);
    v.x += u.x * hard * POOL.rack.burst;
    v.y += u.y * hard * POOL.rack.burst;
    v.z += u.z * hard * POOL.rack.burst;
  }
}

function step(pool: Pool, box: Box, holes: Vec3[], dt: number) {
  'worklet';
  const { balls } = pool;
  // The cue ball keeps curving the way the finger curved.
  const cue = balls[0]!;
  const bend = cue.w.z * POOL.curve * dt;
  const cos = Math.cos(bend);
  const sin = Math.sin(bend);
  const vx = cue.v.x;
  cue.v.x = vx * cos - cue.v.y * sin;
  cue.v.y = vx * sin + cue.v.y * cos;
  let left = dt;
  for (let n = 0; n < POOL.maxEvents && left > 0; n++) {
    const hit = nextHit(balls, box, holes, left);
    travel(balls, hit.t);
    left -= hit.t;
    if (hit.kind === 'none') break;
    const hard = resolve(balls, hit);
    pool.knock = Math.max(pool.knock, hard);
    if (pool.racked && hit.kind === 'ball' && hard > 0) burst(pool, hard);
    if (hit.kind === 'pocket' && hit.i > 0) pool.potted++;
  }
  const fade = Math.exp(-dt / POOL.spinFade);
  for (const b of balls) {
    if (b.sunk >= 0) continue;
    const draw = drawOf(holes, b.p);
    const drawn = Math.hypot(draw.x, draw.y, draw.z) > POOL.drag;
    // Too faint to start a resting ball, it still bends a moving one.
    if (drawn || b.v.x !== 0 || b.v.y !== 0 || b.v.z !== 0) {
      b.v.x += draw.x * dt;
      b.v.y += draw.y * dt;
      b.v.z += draw.z * dt;
    }
    const speed = Math.hypot(b.v.x, b.v.y, b.v.z);
    const slower = speed - POOL.drag * dt;
    const k = slower <= 0 ? 0 : slower / speed;
    const turn = k === 0 ? 0 : fade;
    b.v.x *= k;
    b.v.y *= k;
    b.v.z *= k;
    b.w.x *= turn;
    b.w.y *= turn;
    b.w.z *= turn;
  }
}

/** Lets the old cue ball go. */
export function retire(pool: Pool) {
  'worklet';
  const cue = pool.balls[0]!;
  if (cue.sunk >= 0) return;
  cue.sunk = 0;
  cue.pocket = -1;
}

/** Advances by real elapsed seconds. Returns whether anything moved or is leaving. */
export function advancePool(pool: Pool, box: Box, seconds: number) {
  'worklet';
  const { balls } = pool;
  const busy = balls.some((b) =>
    b.sunk >= 0 ? b.sunk < POOL.sink : b.v.x !== 0 || b.v.y !== 0 || b.v.z !== 0,
  );
  for (const b of balls) if (b.sunk >= 0) b.sunk += seconds;
  if (busy) {
    const holes = snugs(box);
    pool.leftover += seconds;
    while (pool.leftover >= POOL.step) {
      pool.leftover -= POOL.step;
      pool.time += POOL.step;
      step(pool, box, holes, POOL.step);
    }
  }
  if (balls.some((b, i) => i > 0 && b.sunk < POOL.sink)) {
    pool.done = 0;
    return busy;
  }
  pool.done += seconds;
  if (pool.done < POOL.again) return true;
  pool.done = 0;
  pool.balls = [balls[0]!, ...rack(box)];
  pool.racked = true;
  // It may be where one belongs.
  retire(pool);
  return true;
}

/** Puts a ball made by a finger into play, with what the launch gave it. */
export function enter(pool: Pool, bubble: Bubble) {
  'worklet';
  const cue = newBall(bubble.p, bubble.r);
  cue.p.z = cue.r;
  cue.v = { x: bubble.v.x, y: bubble.v.y, z: bubble.v.z };
  cue.w.z = bubble.spin;
  pool.balls[0] = cue;
}

/** Follows the ball in the hand straight ahead, with the same contacts as play. */
export function traceAhead(pool: Pool, box: Box, p: Vec3, r: number): Trace {
  'worklet';
  const holes = snugs(box);
  const cue = newBall(p, r);
  cue.v.z = 1;
  const balls = [cue];
  for (let i = 1; i < pool.balls.length; i++) {
    const b = pool.balls[i]!;
    const c = newBall(b.p, b.r);
    c.sunk = b.sunk;
    balls.push(c);
  }
  const hit = nextHit(balls, box, holes, 100);
  travel(balls, hit.t);
  const out: Trace = { from: p, to: { ...cue.p }, r, hit: -1, lands: null, drops: false };
  if (hit.kind !== 'ball') return out;
  resolve(balls, hit);
  out.hit = hit.j;
  // The target alone from here.
  cue.sunk = 0;
  const next = nextHit(balls, box, holes, 100);
  travel(balls, next.t);
  const b = balls[hit.j]!;
  out.lands = { ...b.p };
  out.drops = next.kind === 'pocket';
  if (next.kind === 'wall') {
    // Off a pocket's own jaw is as good as straight in.
    const speed = Math.hypot(b.v.x, b.v.y, b.v.z);
    resolve(balls, next);
    out.drops = nextHit(balls, box, holes, POOL.mouth / Math.max(1e-6, speed)).kind === 'pocket';
  }
  return out;
}
