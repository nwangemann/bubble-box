import { POOL } from '../config/pool';
import { POOL_RULES } from '../config/poolRules';
import {
  advancePool,
  createPool,
  enter,
  fitCue,
  pockets,
  snugs,
  stillTable,
  type Pool,
} from './pool';
import {
  beginShot,
  createGame,
  EIGHT,
  endShot,
  judge,
  type PoolGame,
  type Verdict,
} from './poolGame';
import type { Box } from './types';
import { createWorld, newBubble } from './world';

const box: Box = { hw: 1, hh: 2.17, depth: 5, focal: 3.2 };
const r = POOL.radius;
const at = (p: number[]) => ({ x: p[0]!, y: p[1]!, z: p[2]! });

/** A table of chosen balls after the break, the cue ball not yet out. */
const table = (others: number[][]) => {
  const pool = createPool(box);
  pool.balls.length = 1 + others.length;
  others.forEach((p, i) => (pool.balls[i + 1]!.p = at(p)));
  pool.racked = false;
  return pool;
};

/** Sends a cue ball from the glass, as a release does, and plays the shot out. */
const shoot = (pool: Pool, game: PoolGame, from: number[], v: number[]) => {
  const bubble = newBubble(createWorld(), 'glass', r, at([from[0]!, from[1]!, r]));
  bubble.v = at(v);
  enter(pool, box, bubble);
  beginShot(game, pool);
  let n = 0;
  for (; n < 12000 && !stillTable(pool, box); n++) advancePool(pool, box, 1 / 120);
  const verdict = judge(game, pool);
  endShot(game, verdict);
  return { verdict, seconds: n / 120 };
};

const verdict = (v: Partial<Verdict>): Verdict => ({
  player: 0,
  broke: false,
  potted: [],
  first: 1,
  foul: null,
  lost: false,
  keeps: false,
  ...v,
});

test('player 1 breaks; the break is judged as one, and needs only to strike a ball', () => {
  const pool = createPool(box);
  const game = createGame();
  expect(game.turn).toBe(0);
  const { verdict: v } = shoot(pool, game, [0.02, 0.01], [0, 0, 4]);
  expect(v.broke).toBe(true);
  expect(v.first).toBeGreaterThan(0);
  expect(v.foul).toBeNull();
  expect(game.turn).toBe(v.keeps ? 0 : 1);
  expect(game.breaking).toBe(false);
});

test('the first ball the cue ball strikes is recorded, not the ones it reaches later', () => {
  const pool = table([
    [0.6, 0, 3],
    [0, 0, 2],
    [0, 0, 3.5],
  ]);
  const { verdict: v } = shoot(pool, createGame(), [0, 0], [0, 0, 2]);
  expect(v.first).toBe(2);
});

test('striking nothing is a foul that passes the turn with two shots', () => {
  const pool = table([[0.6, 1.5, 4]]);
  const game = createGame();
  const { verdict: v } = shoot(pool, game, [-0.6, -1.5], [0, 0, 1.5]);
  expect(v.first).toBe(-1);
  expect(v.foul).toBe('miss');
  expect(game.turn).toBe(1);
  expect(game.shots).toBe(POOL_RULES.foulShots);
});

test('the cue ball potted is a foul', () => {
  const q = pockets(box)[0]!;
  const pool = table([[0.6, 1.5, 4]]);
  const game = createGame();
  const { verdict: v } = shoot(pool, game, [0, 0.3], [q.x, q.y - 0.3, q.z - r]);
  expect(v.potted).toContain(0);
  expect(v.foul).toBe('scratch');
  expect(game.turn).toBe(1);
});

test('a pot keeps the turn; one that pots nothing passes it', () => {
  const game = createGame();
  endShot(game, verdict({ potted: [3], keeps: true }));
  expect(game.turn).toBe(0);
  endShot(game, verdict({}));
  expect(game.turn).toBe(1);
  expect(game.shots).toBe(1);
});

test('after a foul the opponent has two shots: a pot keeps them, the second empty one ends them', () => {
  const game = createGame();
  endShot(game, verdict({ first: -1, foul: 'miss' }));
  expect([game.turn, game.shots]).toEqual([1, 2]);
  endShot(game, verdict({}));
  expect([game.turn, game.shots]).toEqual([1, 1]);
  endShot(game, verdict({ potted: [4], keeps: true }));
  expect([game.turn, game.shots]).toEqual([1, 1]);
  endShot(game, verdict({}));
  expect([game.turn, game.shots]).toEqual([0, 1]);
});

test('a foul of their own ends the two shots at once', () => {
  const game = createGame();
  endShot(game, verdict({ foul: 'scratch', potted: [0] }));
  endShot(game, verdict({ foul: 'miss', first: -1 }));
  expect([game.turn, game.shots]).toEqual([0, 2]);
});

test('the 8 potted after the break is a foul, and a loss only by the switch', () => {
  const potEight = () => {
    const pool = table([[0, 0, 3]]);
    // The one ball on the table is the 8.
    pool.balls[EIGHT] = pool.balls[1]!;
    pool.balls[1] = { ...pool.balls[1]!, p: at([0.6, 1.5, 4]), sunk: 0.1, pocket: 0 };
    const game = createGame();
    pool.balls[EIGHT]!.sunk = -1;
    for (let i = 2; i < EIGHT; i++)
      pool.balls[i] = { ...pool.balls[1]!, p: at([0, 0, 0]), sunk: 1, pocket: 0 };
    beginShot(game, pool);
    pool.first = EIGHT;
    pool.balls[EIGHT]!.sunk = 0;
    pool.balls[EIGHT]!.pocket = 2;
    return judge(game, pool);
  };
  expect(potEight()).toMatchObject({ foul: 'eight', lost: false, keeps: false });
  POOL_RULES.earlyEight = 'lose';
  try {
    expect(potEight()).toMatchObject({ foul: 'eight', lost: true });
  } finally {
    POOL_RULES.earlyEight = 'spot';
  }
});

test('on the break the 8 is no foul and keeps the turn', () => {
  const game = createGame();
  const pool = createPool(box);
  beginShot(game, pool);
  pool.first = 1;
  pool.balls[EIGHT]!.sunk = 0;
  pool.balls[EIGHT]!.pocket = 1;
  expect(judge(game, pool)).toMatchObject({ broke: true, foul: null, keeps: true });
});

test('after the break a long shot slows harder late, and ends sooner; the break does not', () => {
  const run = (hurry: boolean) => {
    const was = POOL_RULES.hurry.after;
    if (!hurry) POOL_RULES.hurry.after = Infinity;
    try {
      const pool = table([[0.5, 1.6, 4.5]]);
      // Straight up and down the room, clear of every pocket.
      return shoot(pool, createGame(), [0, -1], [0, 0, 2]).seconds;
    } finally {
      POOL_RULES.hurry.after = was;
    }
  };
  const plain = run(false);
  const hurried = run(true);
  expect(plain).toBeGreaterThan(10);
  expect(hurried).toBeLessThan(plain / 2);
  expect(hurried).toBeGreaterThan(POOL_RULES.hurry.after);
  const pool = createPool(box);
  const bubble = newBubble(createWorld(), 'glass', r, at([0, 0, r]));
  bubble.v.z = 4;
  enter(pool, box, bubble);
  for (let n = 0; n < 600; n++) advancePool(pool, box, 1 / 120);
  expect(pool.hurry).toBe(-1);
});

test('a ball stopped on a lip by the harder drag still tips in once all have stopped', () => {
  const s = snugs(box)[2]!;
  // Close enough that a pocket draws it harder than plain drag, not than the harder one.
  const lip = [s.x + 0.15, s.y, s.z - 0.15];
  const pool = table([lip, [0.5, 1, 1]]);
  const cue = pool.balls[0]!;
  cue.sunk = -1;
  cue.p = at([-0.5, -1, r]);
  cue.v = at([0, 0, 0.3]);
  pool.hurry = POOL_RULES.hurry.after;
  for (let n = 0; n < 30; n++) advancePool(pool, box, 1 / 120);
  expect(pool.balls[1]!.v).toEqual({ x: 0, y: 0, z: 0 });
  expect(stillTable(pool, box)).toBe(false);
  for (let n = 0; n < 2400 && !stillTable(pool, box); n++) advancePool(pool, box, 1 / 120);
  expect(pool.balls[1]!.pocket).toBe(2);
});

test('a cue ball starts at the nearest place it fits beside a ball against the glass', () => {
  const pool = table([[0, 0, r]]);
  const free = fitCue(pool, box, at([0.6, 0.6, 0.3]), r);
  expect(free).toEqual({ x: 0.6, y: 0.6, z: r });
  const fit = fitCue(pool, box, at([0.05, 0, r]), r);
  const apart = Math.hypot(fit.x, fit.y);
  expect(apart).toBeGreaterThanOrEqual(2 * r);
  expect(apart).toBeLessThan(2 * r + POOL_RULES.fit.step * 2);
  expect(fit.x).toBeGreaterThan(0);
  // Against a cushion too.
  const edge = table([[box.hw - r, 0, r]]);
  const p = fitCue(edge, box, at([box.hw, 0, r]), r);
  expect(Math.abs(p.x)).toBeLessThanOrEqual(box.hw - r);
  expect(Math.hypot(p.x - (box.hw - r), p.y)).toBeGreaterThanOrEqual(2 * r);
  const bubble = newBubble(createWorld(), 'glass', r, at([0.05, 0, r]));
  enter(pool, box, bubble);
  expect(pool.balls[0]!.p).toEqual(fit);
});
