import { FEELS } from '../config/feels';
import { POOL } from '../config/pool';
import {
  advancePool,
  createPool,
  enter,
  pockets,
  retire,
  snugs,
  traceAhead,
  type Pool,
} from './pool';
import { landsAt, potEnds } from './poolRow';
import type { Box } from './types';
import { advance, beginHold, createWorld, moveHold, newBubble, release } from './world';

const box: Box = { hw: 1, hh: 2.17, depth: 5, focal: 3.2 };
const r = POOL.radius;
const at = (p: number[]) => ({ x: p[0]!, y: p[1]!, z: p[2]! });

/** Pockets draw nothing, for what must be exact. */
const plainly = (check: () => void) => {
  const was = POOL.draw.strength;
  const spring = POOL.rack.burst;
  POOL.draw.strength = 0;
  POOL.rack.burst = 0;
  try {
    check();
  } finally {
    POOL.draw.strength = was;
    POOL.rack.burst = spring;
  }
};

/** A table with chosen balls, and a cue ball sent off. */
const table = (cue: number[], v: number[], others: number[][], size = r) => {
  const pool = createPool(box);
  pool.balls.length = 1 + others.length;
  others.forEach((p, i) => (pool.balls[i + 1]!.p = at(p)));
  pool.racked = false;
  const c = pool.balls[0]!;
  c.sunk = -1;
  c.r = size;
  c.p = at(cue);
  c.v = at(v);
  return pool;
};
const still = (pool: Pool) => pool.balls.every((b) => b.lively === 0);
const until = (pool: Pool, done: () => boolean, most = 2400) => {
  for (let n = 0; n < most && !done(); n++) advancePool(pool, box, 1 / 120);
};

test('pockets are all on the far wall: its corners and the middles of its long edges', () => {
  const all = pockets(box);
  expect(all).toHaveLength(6);
  for (const q of all) {
    expect(q.z).toBe(box.depth);
    expect(Math.abs(q.x)).toBe(box.hw);
  }
});

test('a ball sent at any pocket drops, and the near corners only bounce', () => {
  pockets(box).forEach((q, k) => {
    const pool = table([0, 0.3, 2], [q.x, q.y - 0.3, 3], [[0, 1, 1]]);
    const cue = pool.balls[0]!;
    until(pool, () => cue.sunk >= 0);
    expect(cue.pocket).toBe(k);
  });
  const near = table([0, 0, 2], [1, 2.17, -2], [[0, 1, 3]]);
  until(near, () => near.balls[0]!.v.z > 0);
  expect(near.balls[0]!.sunk).toBe(-1);
});

test('a cut sends the target along the line of centres, exactly, at any speed', () =>
  plainly(() => {
    for (const speed of [1, 3, 8])
      for (let i = 0; i < 20; i++) {
        const pool = table([r, 0, 1 + i * 0.0031], [0, 0, speed], [[0, 0, 3]]);
        const b = pool.balls[1]!;
        until(pool, () => b.v.z !== 0);
        // Half a ball: 30 degrees.
        expect(Math.atan2(-b.v.x, b.v.z)).toBeCloseTo(Math.PI / 6, 5);
      }
  }));

test('a larger cue ball hits harder and is turned less', () => {
  const speeds = [0.1, r, 0.5].map((size) => {
    const pool = table([0, 0, 1], [0, 0, 3], [[0, 0, 3]], size);
    until(pool, () => pool.balls[1]!.v.z !== 0);
    return [pool.balls[1]!.v.z, pool.balls[0]!.v.z];
  });
  expect(speeds[0]![0]).toBeLessThan(speeds[1]![0]!);
  expect(speeds[1]![0]).toBeLessThan(speeds[2]![0]!);
  expect(speeds[0]![1]).toBeLessThan(0);
  expect(speeds[2]![1]).toBeGreaterThan(2);
});

test('balls never overlap, leave the room or gain energy, and all come to rest', () =>
  plainly(() => {
    const pool = createPool(box);
    const w = createWorld();
    const bubble = newBubble(w, 'glass', 0.3, at([0.2, -0.3, 0.3]));
    bubble.v = at([0.3, 0.6, 6]);
    enter(pool, bubble);
    let energy = Infinity;
    let moving = true;
    for (let n = 0; n < 3600 && moving; n++) {
      moving = advancePool(pool, box, 1 / 60);
      const up = pool.balls.filter((b) => b.sunk < 0);
      let e = 0;
      for (const b of up) {
        const spin = 0.4 * b.r * b.r * (b.w.x ** 2 + b.w.y ** 2 + b.w.z ** 2);
        e += b.r ** 3 * (b.v.x ** 2 + b.v.y ** 2 + b.v.z ** 2 + spin);
        expect(Math.abs(b.p.x)).toBeLessThanOrEqual(box.hw - b.r + 1e-6);
        expect(Math.abs(b.p.y)).toBeLessThanOrEqual(box.hh - b.r + 1e-6);
        expect(b.p.z).toBeGreaterThanOrEqual(b.r - 1e-6);
        expect(b.p.z).toBeLessThanOrEqual(box.depth - b.r + 1e-6);
        for (const o of up)
          if (o !== b)
            expect(Math.hypot(o.p.x - b.p.x, o.p.y - b.p.y, o.p.z - b.p.z)).toBeGreaterThan(
              o.r + b.r - 1e-6,
            );
      }
      expect(e).toBeLessThanOrEqual(energy + 1e-9);
      energy = e;
    }
    expect(moving).toBe(false);
  }));

test('a new cue ball takes the place of the last, even while balls roll', () => {
  const pool = table([0, 0, 1], [0, 0, 3], [[0.5, 0.5, 3]]);
  advancePool(pool, box, 0.1);
  retire(pool);
  expect(pool.balls[0]!.sunk).toBe(0);
  const bubble = newBubble(createWorld(), 'glass', 0.2, at([0.4, -0.4, 0.2]));
  bubble.v.z = 2;
  bubble.spin = 2;
  enter(pool, bubble);
  expect(pool.balls[0]!.sunk).toBe(-1);
  advancePool(pool, box, 0.5);
  expect(pool.balls[0]!.p.z).toBeGreaterThan(1);
});

test('spin bends the path and kicks off a cushion', () => {
  const pool = table([-0.5, 0, 1], [2, 0, 0], [[0, 1.5, 4]]);
  pool.balls[0]!.w.z = 4;
  advancePool(pool, box, 0.3);
  expect(pool.balls[0]!.v.y).toBeGreaterThan(0.3);
  const plain = table([0, 0.5, 1], [3, 0, 0], [[0, 1.5, 4]]);
  until(plain, () => plain.balls[0]!.v.x < 0);
  expect(plain.balls[0]!.v.y).toBeCloseTo(0);
});

test('a cleared table is set again', () => {
  const pool = createPool(box);
  for (const b of pool.balls) b.sunk = 9;
  until(pool, () => pool.balls[1]!.sunk < 0);
  expect(pool.balls.filter((b) => b.sunk < 0)).toHaveLength(15);
});

test('what shows straight ahead is what happens', () =>
  plainly(() => {
    const pool = table([0.1, 0.05, 0.2], [0, 0, 3], [[0, 0, 3]], 0.2);
    const t = traceAhead(pool, box, at([0.1, 0.05, 0.2]), 0.2);
    expect(t.hit).toBe(1);
    const b = pool.balls[1]!;
    until(pool, () => b.v.z !== 0);
    const dx = t.lands!.x;
    const dz = t.lands!.z - 3;
    expect(b.v.x / b.v.z).toBeCloseTo(dx / dz, 5);
  }));

test('it knows when the target would drop', () => {
  const ball = { x: 0.5, y: 1.1, z: 3.4 };
  const q = snugs(box)[5]!;
  const d = { x: ball.x - q.x, y: ball.y - q.y, z: ball.z - q.z };
  const l = Math.hypot(d.x, d.y, d.z);
  const pool = table([0, 0, 1], [0, 0, 0], [[ball.x, ball.y, ball.z]]);
  const x = ball.x + (d.x / l) * 2 * r;
  const y = ball.y + (d.y / l) * 2 * r;
  expect(traceAhead(pool, box, at([x, y, r]), r).drops).toBe(true);
  expect(traceAhead(pool, box, at([ball.x, ball.y, r]), r).drops).toBe(false);
});

test('the rack is a pyramid of 15 touching balls, its tip to the viewer', () => {
  const balls = createPool(box).balls.slice(1);
  expect(balls).toHaveLength(15);
  expect(Math.min(...balls.slice(1).map((b) => b.p.z))).toBeGreaterThan(balls[0]!.p.z);
  for (const b of balls) {
    const gaps = balls
      .filter((o) => o !== b)
      .map((o) => Math.hypot(o.p.x - b.p.x, o.p.y - b.p.y, o.p.z - b.p.z) - 2 * r);
    for (const g of gaps) expect(g).toBeGreaterThan(0);
    expect(gaps.filter((g) => g < 1e-5).length).toBeGreaterThan(0);
  }
});

test('a break moves every ball, even off centre', () => {
  for (const [x, y, size, speed] of [
    [0, 0, 0.12, 2.2],
    [0, 0, 0.2, 3],
    [0.1, 0.05, 0.2, 3],
    [-0.12, 0.2, 0.35, 3.5],
  ] as const) {
    const pool = createPool(box);
    const from = pool.balls.map((b) => ({ ...b.p }));
    const bubble = newBubble(createWorld(), 'glass', size, at([x, y, size]));
    bubble.v.z = speed;
    enter(pool, bubble);
    for (let n = 0; n < 1200; n++) advancePool(pool, box, 1 / 60);
    pool.balls.forEach((b, i) => {
      if (i === 0 || b.sunk >= 0) return;
      const q = from[i]!;
      expect(Math.hypot(b.p.x - q.x, b.p.y - q.y, b.p.z - q.z)).toBeGreaterThan(0.03);
    });
  }
});

test('a pocket draws in what rests near, bends what passes, and leaves the rest alone', () => {
  const rest = (p: number[]) => {
    const pool = table([0, 0, 1], [0.1, 0, 0], [p]);
    const b = pool.balls[1]!;
    for (let n = 0; n < 1800; n++) advancePool(pool, box, 1 / 60);
    return b;
  };
  const q = snugs(box)[5]!;
  const near = (d: number) => [q.x, q.y, q.z - d];
  expect(rest(near(0.23)).sunk).toBeGreaterThanOrEqual(0);
  // Hanging on the lip it tips in; further off it stays.
  expect(rest(near(0.45)).sunk).toBe(-1);
  expect(rest([0, 1, 4]).v).toEqual({ x: 0, y: 0, z: 0 });
  expect(rest([0, 1, 4]).p).toEqual(at([0, 1, 4]));
  const pass = table([0.35, 1.4, 4.6], [0, 0.3, 0], [[0, -1, 1]]);
  advancePool(pass, box, 0.5);
  expect(pass.balls[0]!.v.x).toBeGreaterThan(0);
});

test('in the hand the cue ball keeps its size, goes where it is dragged, and gains no more power', () => {
  const held = (seconds: number) => {
    const w = createWorld();
    w.steady = { r, charge: POOL.cue.charge };
    beginHold(w, box, 0, 0, 'glass');
    moveHold(w, 0.3, 0.5);
    for (let t = 0; t < seconds; t += 1 / 60) {
      advance(w, box, [FEELS.weightless!], 1, 1 / 60);
      expect(w.holds[0]!.bubble.r).toBe(r);
    }
    const traced = { ...w.holds[0]!.bubble.p };
    release(w, 0, 0, POOL.cue.speed);
    const b = w.bubbles[0]!;
    expect(b.p).toEqual(traced);
    expect(b.v.x).toBe(0);
    expect(b.v.y).toBe(0);
    return b;
  };
  const long = held(4);
  expect(long.p.x).toBeCloseTo((0.3 * (box.focal + r)) / box.focal, 3);
  expect(long.v.z).toBeCloseTo(held(1.2).v.z, 6);
  expect(long.v.z).toBeGreaterThan(held(0.2).v.z);
});

test('a ball is lively as it moves, eases in and out, and is drawn until it has', () => {
  const pool = table([0, 0, 1], [1.2, 0, 0], []);
  advancePool(pool, box, 1 / 60);
  const cue = pool.balls[0]!;
  expect(cue.lively).toBeGreaterThan(0);
  expect(cue.lively).toBeLessThan(0.3);
  // Something left to pot, or the table would be set again.
  pool.balls.push({ ...createPool(box).balls[1]!, p: at([0, 1.5, 3]) });
  until(pool, () => cue.lively > 0.8);
  expect(cue.lively).toBeGreaterThan(0.8);
  cue.v = at([0, 0, 0]);
  expect(advancePool(pool, box, 1 / 60)).toBe(true);
  expect(cue.lively).toBeGreaterThan(0.5);
  until(pool, () => still(pool));
  expect(still(pool)).toBe(true);
  expect(advancePool(pool, box, 1 / 60)).toBe(false);
});

test('a moving ball leaves a trail that turns where it does, then goes', () => {
  plainly(() => {
    const pool = table([0.2, 0.3, 2], [1.4, 0, 0.5], [[-0.5, -1, 1]]);
    pool.trailing = Infinity;
    until(pool, () => pool.balls[0]!.v.x < 0);
    until(pool, () => pool.balls[0]!.p.x < 0.6);
    expect(pool.trails).toHaveLength(1);
    const { points } = pool.trails[0]!;
    // The bounce itself is a point, and nothing is older than it should be.
    expect(Math.max(...points.map((o) => o.p.x))).toBeCloseTo(box.hw - r, 5);
    expect(pool.time - points[1]!.t).toBeLessThanOrEqual(POOL.trail.look.seconds);
    // It fades where it hangs after another takes its place, and the table then rests.
    enter(pool, newBubble(createWorld(), 'soap', r, at([0, 0, r])));
    advancePool(pool, box, 1 / 60);
    expect(pool.trails[0]!.bubble).toBe(-1);
    until(pool, () => pool.trails.length === 0);
    expect(pool.trails).toHaveLength(0);
    expect(advancePool(pool, box, 1 / 60)).toBe(false);
  });
});

test('only as many balls as chosen leave trails', () => {
  const run = (most: number) => {
    const pool = createPool(box);
    pool.trailing = most;
    const cue = newBubble(createWorld(), 'soap', r, at([0.02, 0.01, r]));
    cue.v.z = 4;
    enter(pool, cue);
    until(pool, () => !pool.racked);
    for (let n = 0; n < 30; n++) advancePool(pool, box, 1 / 120);
    return new Set(pool.trails.map((o) => o.bubble)).size;
  };
  expect(run(0)).toBe(0);
  expect(run(1)).toBe(1);
  expect(run(Infinity)).toBeGreaterThan(10);
});

test('a still table is drawn until nothing of a pot is left to see', () => {
  const pool = table(
    [0, 1, 1],
    [0, 0, 0],
    [
      [0, 0, 2],
      [0, 0, 3],
    ],
  );
  pool.balls[1]!.sunk = POOL.sink;
  expect(advancePool(pool, box, potEnds(false) - POOL.sink - 0.01)).toBe(true);
  expect(advancePool(pool, box, 1 / 60)).toBe(false);
});

test('a ball lands in its place once, after it drops', () => {
  for (const calm of [false, true]) {
    const pool = table([0, 1, 1], [0, 0, 0], [[0, 0, 2]]);
    pool.balls.push({ ...pool.balls[1]!, p: at([0, 1, 4]) });
    pool.calm = calm;
    pool.balls[1]!.sunk = 0;
    pool.balls[1]!.pocket = 0;
    let when = 0;
    for (let t = 0; t < 3; t += 1 / 60) {
      advancePool(pool, box, 1 / 60);
      if (pool.landed === 1 && !when) when = pool.balls[1]!.sunk;
    }
    expect(pool.landed).toBe(1);
    expect(when).toBeCloseTo(landsAt(calm), 1);
  }
});

test('a cue ball lands nowhere', () => {
  const pool = table([0, 1, 1], [0, 0, 0], [[0, 0, 2]]);
  retire(pool);
  for (let t = 0; t < 3; t += 1 / 60) advancePool(pool, box, 1 / 60);
  expect(pool.landed).toBe(0);
});
