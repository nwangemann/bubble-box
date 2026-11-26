import { POOL } from '../config/pool';
import { POOL_RULES } from '../config/poolRules';
import { landsAt, potEnds } from './poolRow';
import { ageTrail, pointAt, sideOf } from './trail';
import type { Box, Bubble, Trail, Vec3 } from './types';

/**
 * A ball. The cue ball is the first. `sunk` is seconds since it left play, or negative; `pocket` is
 * the one it dropped in, or -1 if it only faded. `lively` follows its
 * speed, 0 to 1, for what is drawn. `weight` is how much its pot means, set by the rules as it
 * drops (`weigh` in `core/poolGame`), or -1. `back` is seconds since it was set back on its spot,
 * while it eases in, or -1; `emptying` if its place in the row, filled when it was potted, empties
 * meanwhile.
 */
export type Ball = {
  r: number;
  p: Vec3;
  v: Vec3;
  w: Vec3;
  /**
   * Draw (below 0) or follow (above): the share of its speed it comes back or runs on by once it
   * strikes a ball, fading on the way there. Then it is spent into `rolling`, the speed still to
   * come along `along`, the way it was going when it struck.
   */
  roll: number;
  rolling: number;
  along: Vec3;
  sunk: number;
  pocket: number;
  lively: number;
  weight: number;
  back: number;
  emptying: boolean;
};

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
  /** How many have reached their places in the row since last asked. */
  landed: number;
  /** Reduce Motion. */
  calm: boolean;
  /** How many balls leave trails, the cue ball first. */
  trailing: number;
  /** Each with its ball's place in `balls`, or -1 once that has been replaced. */
  trails: Trail[];
  /** The first ball the cue ball has struck since it was sent, or -1. */
  first: number;
  /** Seconds a shot after the break has run, for its later, harder drag; -1 once all have stopped. */
  hurry: number;
  /** The game is over: a cleared table waits, and is set again only after `clearTable`. */
  over: boolean;
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
  /** The pocket it would drop in, or -1. */
  pocket: number;
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
    roll: 0,
    rolling: 0,
    along: { x: 0, y: 0, z: 0 },
    sunk: -1,
    pocket: -1,
    lively: 0,
    weight: -1,
    back: -1,
    emptying: false,
  };
}

/** Moving, or about to be by its draw or follow. */
function moves(b: Ball) {
  'worklet';
  return b.v.x !== 0 || b.v.y !== 0 || b.v.z !== 0 || b.rolling !== 0;
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
    landed: 0,
    calm: false,
    trailing: 0,
    trails: [],
    first: -1,
    hurry: -1,
    over: false,
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

/** Marks where a ball is as part of its trail: always at a contact, else every so often. */
function mark(pool: Pool, i: number, box: Box, contact: boolean) {
  'worklet';
  const b = pool.balls[i]!;
  if (i >= pool.trailing || b.sunk >= 0) return;
  const { look, every, least, most } = POOL.trail;
  let trail = pool.trails.find((o) => o.bubble === i);
  if (!trail) {
    if (b.v.x === 0 && b.v.y === 0 && b.v.z === 0) return;
    trail = { bubble: i, look, seed: 0, style: '', born: pool.time, points: [] };
    pool.trails.push(trail);
  }
  const { points } = trail;
  const last = points[points.length - 1];
  if (last) {
    const moved = Math.hypot(b.p.x - last.p.x, b.p.y - last.p.y, b.p.z - last.p.z);
    // Half a step short of `every` still counts, so rounding never skips one.
    if (moved < least || (!contact && pool.time - last.t < every - POOL.step / 2)) return;
  }
  points.push(pointAt(b, last, box.focal, pool.time));
  if (points.length > most) points.shift();
}

/** After a contact: a second point in the same place, lying across the new way, so the two join cleanly. */
function turn(pool: Pool, i: number, box: Box) {
  'worklet';
  const b = pool.balls[i]!;
  const trail = pool.trails.find((o) => o.bubble === i);
  const last = trail?.points[trail.points.length - 1];
  if (!trail || !last || i >= pool.trailing || b.sunk >= 0) {
    // One set going begins here.
    mark(pool, i, box, true);
    return;
  }
  const size = Math.hypot(b.v.x, b.v.y, b.v.z) * Math.hypot(last.v.x, last.v.y, last.v.z);
  const along = b.v.x * last.v.x + b.v.y * last.v.y + b.v.z * last.v.z;
  if (along > POOL.trail.corner * size) return;
  const point = pointAt(b, last, box.focal, pool.time);
  const side = sideOf(b.p, b.v, null, box.focal);
  const s = last.side;
  // The same edge stays on the same side.
  const way = side.x * s.x + side.y * s.y + side.z * s.z < 0 ? -1 : 1;
  point.side = { x: side.x * way, y: side.y * way, z: side.z * way };
  trail.points.push(point);
  if (trail.points.length > POOL.trail.most) trail.points.shift();
}

/** The cue ball strikes a ball: its draw or follow is spent from here, the way it was going. */
function strikeRoll(cue: Ball) {
  'worklet';
  if (cue.roll === 0) return;
  const speed = Math.hypot(cue.v.x, cue.v.y, cue.v.z);
  cue.along = unit(cue.v.x, cue.v.y, cue.v.z);
  cue.rolling = cue.roll * POOL.roll.most * speed;
  cue.roll = 0;
}

/** Draw or follow fades on the way, and once it has struck, pulls the cue ball back or on. */
function spendRoll(cue: Ball, dt: number) {
  'worklet';
  const R = POOL.roll;
  if (cue.sunk >= 0) {
    cue.roll = 0;
    cue.rolling = 0;
    return;
  }
  cue.roll *= Math.exp(-dt / R.fade);
  if (cue.rolling === 0) return;
  const left = cue.rolling * Math.exp(-dt / R.take);
  const now = Math.abs(left) < R.done ? cue.rolling : cue.rolling - left;
  cue.v.x += cue.along.x * now;
  cue.v.y += cue.along.y * now;
  cue.v.z += cue.along.z * now;
  cue.rolling -= now;
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
    mark(pool, hit.i, box, true);
    if (hit.kind === 'ball') mark(pool, hit.j, box, true);
    if (hit.kind === 'ball' && hit.i === 0) strikeRoll(cue);
    const hard = resolve(balls, hit);
    pool.knock = Math.max(pool.knock, hard);
    if (pool.racked && hit.kind === 'ball' && hard > 0) burst(pool, hard);
    if (hit.kind === 'pocket' && hit.i > 0) pool.potted++;
    if (hit.kind === 'ball' && hit.i === 0 && pool.first < 0) pool.first = hit.j;
    turn(pool, hit.i, box);
    if (hit.kind === 'ball') turn(pool, hit.j, box);
  }
  spendRoll(cue, dt);
  const fade = Math.exp(-dt / POOL.spinFade);
  const { after, drag: harder } = POOL_RULES.hurry;
  const drag = pool.hurry >= after ? POOL.drag * harder : POOL.drag;
  for (const b of balls) {
    if (b.sunk >= 0) continue;
    const draw = drawOf(holes, b.p);
    const drawn = Math.hypot(draw.x, draw.y, draw.z) > drag;
    // Too faint to start a resting ball, it still bends a moving one.
    if (drawn || moves(b)) {
      b.v.x += draw.x * dt;
      b.v.y += draw.y * dt;
      b.v.z += draw.z * dt;
    }
    const speed = Math.hypot(b.v.x, b.v.y, b.v.z);
    const slower = speed - drag * dt;
    const k = slower <= 0 ? 0 : slower / speed;
    const turn = k === 0 ? 0 : fade;
    b.v.x *= k;
    b.v.y *= k;
    b.v.z *= k;
    b.w.x *= turn;
    b.w.y *= turn;
    b.w.z *= turn;
  }
  for (let i = 0; i < balls.length; i++) mark(pool, i, box, false);
}

/** How much the latest pot means (`Ball.weight`), for its tone; 1 when the rules have not said. */
export function newestPot(pool: Pool) {
  'worklet';
  let at = -1;
  pool.balls.forEach((b, i) => {
    if (i === 0 || b.sunk < 0 || b.pocket < 0) return;
    if (at < 0 || b.sunk < pool.balls[at]!.sunk) at = i;
  });
  const w = at < 0 ? -1 : pool.balls[at]!.weight;
  return w < 0 ? 1 : w;
}

/** Lets the old cue ball go. */
export function retire(pool: Pool) {
  'worklet';
  const cue = pool.balls[0]!;
  if (cue.sunk >= 0) return;
  cue.sunk = 0;
  cue.pocket = -1;
}

/**
 * For the next game: every ball still on the table fades where it rests, as an old cue ball does,
 * and the table is set again once they have gone.
 */
export function clearTable(pool: Pool) {
  'worklet';
  pool.over = false;
  pool.balls.forEach((b) => {
    if (b.sunk >= 0) return;
    b.sunk = 0;
    b.pocket = -1;
    b.v = { x: 0, y: 0, z: 0 };
  });
}

/** Returns whether any is still settling, so that it is drawn until it has. */
function enliven(balls: Ball[], seconds: number) {
  'worklet';
  const L = POOL.lively;
  const k = 1 - Math.exp(-seconds / L.ease);
  let settling = false;
  for (const b of balls) {
    const speed = b.sunk >= 0 ? 0 : Math.hypot(b.v.x, b.v.y, b.v.z);
    b.lively += (Math.min(1, speed / L.speed) - b.lively) * k;
    if (speed > 0) continue;
    if (b.lively < 0.004) b.lively = 0;
    else settling = true;
  }
  return settling;
}

/** Lets trails age. Returns whether any is left to draw. */
function fadeTrails(pool: Pool) {
  'worklet';
  if (pool.trails.length === 0) return false;
  for (const trail of pool.trails) ageTrail(trail, pool.time);
  pool.trails = pool.trails.filter((o) => o.points.length > 0);
  return pool.trails.length > 0;
}

/** Whether a ball at rest is drawn harder than drag holds it, so it will drift into a pocket. */
function tipping(pool: Pool, box: Box) {
  'worklet';
  const holes = snugs(box);
  return pool.balls.some((b) => {
    if (b.sunk >= 0) return false;
    const draw = drawOf(holes, b.p);
    return Math.hypot(draw.x, draw.y, draw.z) > POOL.drag;
  });
}

/** Every ball on the table has stopped, and none will drift in: the next shot may be played. */
export function stillTable(pool: Pool, box: Box) {
  'worklet';
  if (pool.balls.some((b) => b.sunk < 0 && moves(b))) return false;
  return !tipping(pool, box);
}

/** The first ball a cue ball of `r` at `x`, `y` against the glass would overlap, or -1. */
function overlaps(pool: Pool, x: number, y: number, r: number) {
  'worklet';
  for (let i = 1; i < pool.balls.length; i++) {
    const b = pool.balls[i]!;
    if (b.sunk >= 0) continue;
    if (Math.hypot(b.p.x - x, b.p.y - y, b.p.z - r) < r + b.r) return i;
  }
  return -1;
}

/**
 * The nearest place to `p`, against the glass, where a cue ball of `r` fits among the balls: `p`
 * itself unless one rests that close.
 */
export function fitCue(pool: Pool, box: Box, p: Vec3, r: number): Vec3 {
  'worklet';
  const lx = box.hw - r;
  const ly = box.hh - r;
  const x0 = Math.max(-lx, Math.min(lx, p.x));
  const y0 = Math.max(-ly, Math.min(ly, p.y));
  if (overlaps(pool, x0, y0, r) < 0) return { x: x0, y: y0, z: r };
  const { step, most, ways } = POOL_RULES.fit;
  for (let n = 1; n <= most; n++) {
    let best = -1;
    let bx = 0;
    let by = 0;
    for (let k = 0; k < ways; k++) {
      const a = (k / ways) * 2 * Math.PI;
      const x = x0 + Math.cos(a) * n * step;
      const y = y0 + Math.sin(a) * n * step;
      if (Math.abs(x) > lx || Math.abs(y) > ly || overlaps(pool, x, y, r) >= 0) continue;
      // Of those at this distance, the one nearest the finger.
      const d = Math.hypot(x - p.x, y - p.y);
      if (best < 0 || d < best) {
        best = d;
        bx = x;
        by = y;
      }
    }
    if (best >= 0) return { x: bx, y: by, z: r };
  }
  return { x: x0, y: y0, z: r };
}

/**
 * Sets a potted ball back on its place in the rack, or, if a ball is there, the nearest free place
 * on the line from there to the far wall (towards the glass if none is), to ease in. Only once the
 * table is still.
 */
export function spotBall(pool: Pool, box: Box, i: number) {
  'worklet';
  const b = pool.balls[i];
  const home = rack(box)[i - 1];
  if (!b || !home || b.sunk < 0) return;
  const { x, y } = home.p;
  const free = (z: number) =>
    pool.balls.every(
      (o, j) => j === i || o.sunk >= 0 || Math.hypot(o.p.x - x, o.p.y - y, o.p.z - z) >= b.r + o.r,
    );
  const { step } = POOL.spot;
  let z = home.p.z;
  while (z + step <= box.depth - b.r && !free(z)) z += step;
  if (!free(z)) for (z = home.p.z; z - step >= b.r && !free(z);) z -= step;
  Object.assign(b, newBall({ x, y, z }, b.r));
  b.back = 0;
  b.emptying = true;
}

/**
 * Advances by real elapsed seconds, in steps of `every`. Returns whether anything moved or is
 * leaving. Contacts are exact at any step; a longer one only coarsens drag and the pockets' draw.
 */
export function advancePool(pool: Pool, box: Box, seconds: number, stepOf?: number) {
  'worklet';
  // Not a default value: a worklet captures only what its body names.
  const every = stepOf ?? POOL.step;
  const { balls } = pool;
  const moving = balls.some((b) => (b.sunk >= 0 ? b.sunk < POOL.sink : moves(b)));
  if (pool.hurry >= 0) pool.hurry = moving ? pool.hurry + seconds : -1;
  // Stopped on a lip by harder drag, a ball still tips in once it eases.
  const busy = moving || (pool.hurry < 0 && tipping(pool, box));
  const lands = landsAt(pool.calm);
  balls.forEach((b, i) => {
    if (b.back >= 0) b.back = b.back + seconds < POOL.spot.ease ? b.back + seconds : -1;
    if (b.sunk < 0) return;
    if (i > 0 && b.pocket >= 0 && b.sunk < lands && b.sunk + seconds >= lands) pool.landed++;
    b.sunk += seconds;
  });
  if (busy) {
    const holes = snugs(box);
    pool.leftover += seconds;
    while (pool.leftover >= every) {
      pool.leftover -= every;
      pool.time += every;
      step(pool, box, holes, every);
    }
  } else pool.time += seconds;
  const fading = fadeTrails(pool);
  // Until nothing of a pot shows.
  const ends = potEnds(pool.calm);
  const filling = balls.some((b, i) => i > 0 && b.sunk >= 0 && b.sunk < ends);
  const easing = balls.some((b) => b.back >= 0);
  const settling = enliven(balls, seconds) || fading || filling || easing;
  if (balls.some((b, i) => i > 0 && b.sunk < POOL.sink)) {
    pool.done = 0;
    return busy || settling;
  }
  pool.done += seconds;
  if (pool.over) return busy || settling;
  if (pool.done < POOL.again) return true;
  pool.done = 0;
  const fresh = rack(box);
  // Each swells in, and a potted one's place in the row empties meanwhile.
  fresh.forEach((b, i) => {
    b.back = 0;
    b.emptying = (balls[i + 1]?.pocket ?? -1) >= 0;
  });
  pool.balls = [balls[0]!, ...fresh];
  pool.racked = true;
  // It may be where one belongs.
  retire(pool);
  return true;
}

/**
 * Draw or follow from the finger's velocity at lifting, in units per second, screen y down: up
 * the screen follows, down draws, -1 to 1. A slower lift says neither.
 */
export function rollOf(swipe: { x: number; y: number }) {
  'worklet';
  const R = POOL.roll;
  if (Math.hypot(swipe.x, swipe.y) < R.least) return 0;
  // Not -0 for a flick straight across.
  return Math.max(-1, Math.min(1, -swipe.y / R.full)) || 0;
}

/** Puts a ball made by a finger into play, with what the launch gave it, and its draw or follow. */
export function enter(pool: Pool, box: Box, bubble: Bubble, roll?: number) {
  'worklet';
  // What the last one left fades where it hangs.
  for (const trail of pool.trails) if (trail.bubble === 0) trail.bubble = -1;
  const cue = newBall(fitCue(pool, box, bubble.p, bubble.r), bubble.r);
  cue.v = { x: bubble.v.x, y: bubble.v.y, z: bubble.v.z };
  cue.w.z = bubble.spin;
  cue.roll = roll ?? 0;
  pool.balls[0] = cue;
  pool.first = -1;
  // A break keeps plain drag.
  pool.hurry = pool.racked ? -1 : 0;
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
  const out: Trace = {
    from: p,
    to: { ...cue.p },
    r,
    hit: -1,
    lands: null,
    drops: false,
    pocket: -1,
  };
  if (hit.kind !== 'ball') return out;
  resolve(balls, hit);
  out.hit = hit.j;
  // The target alone from here.
  cue.sunk = 0;
  const next = nextHit(balls, box, holes, 100);
  travel(balls, next.t);
  const b = balls[hit.j]!;
  out.lands = { ...b.p };
  let into = next;
  if (next.kind === 'wall') {
    // Off a pocket's own jaw is as good as straight in.
    const speed = Math.hypot(b.v.x, b.v.y, b.v.z);
    resolve(balls, next);
    into = nextHit(balls, box, holes, POOL.mouth / Math.max(1e-6, speed));
  }
  out.drops = into.kind === 'pocket';
  out.pocket = out.drops ? into.j : -1;
  return out;
}
