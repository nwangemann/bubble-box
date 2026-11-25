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
  cleared,
  EIGHT,
  endShot,
  groupOf,
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
  takes: null,
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

const SOLIDS = POOL.looks.flatMap((l, i) => (l.kind === 'solid' ? [i] : []));
const STRIPES = POOL.looks.flatMap((l, i) => (l.kind === 'stripe' ? [i] : []));

/**
 * Judges a shot after the break on a full table without playing it: `down` were down before,
 * `first` struck first, `potted` dropped.
 */
const judged = (game: PoolGame, first: number, potted: number[], down: number[] = []) => {
  const pool = createPool(box);
  pool.racked = false;
  pool.balls[0]!.sunk = -1;
  for (const i of down) pool.balls[i]!.sunk = 1;
  beginShot(game, pool);
  pool.first = first;
  for (const i of potted) {
    pool.balls[i]!.sunk = 0;
    pool.balls[i]!.pocket = 1;
  }
  const v = judge(game, pool);
  endShot(game, v);
  return v;
};

test('balls are of a group by their look; a group is cleared once all of it is down', () => {
  expect(SOLIDS).toHaveLength(7);
  expect(STRIPES).toHaveLength(7);
  expect(groupOf(0)).toBeNull();
  expect(groupOf(EIGHT)).toBeNull();
  expect(SOLIDS.every((i) => groupOf(i) === 'solid')).toBe(true);
  const down: boolean[] = [];
  SOLIDS.slice(1).forEach((i) => (down[i] = true));
  expect(cleared(down, 'solid')).toBe(false);
  down[SOLIDS[0]!] = true;
  expect(cleared(down, 'solid')).toBe(true);
  expect(cleared(down, 'stripe')).toBe(false);
});

test('the break leaves the table open, whatever drops', () => {
  const game = createGame();
  const pool = createPool(box);
  beginShot(game, pool);
  pool.first = 1;
  pool.balls[SOLIDS[0]!]!.sunk = 0;
  pool.balls[SOLIDS[0]!]!.pocket = 1;
  const v = judge(game, pool);
  endShot(game, v);
  expect(v).toMatchObject({ broke: true, takes: null, keeps: true });
  expect(game.groups).toBeNull();
});

test('after the break, a shot potting one group only gives it to the shooter', () => {
  const game = createGame();
  game.turn = 1;
  const v = judged(game, STRIPES[0]!, [STRIPES[0]!, STRIPES[1]!]);
  expect(v).toMatchObject({ takes: 'stripe', foul: null, keeps: true });
  expect(game.groups).toEqual(['solid', 'stripe']);
  expect(game.turn).toBe(1);
});

test('while open, any ball but the 8 may be struck first, and pots from both leave it open', () => {
  const game = createGame();
  const v = judged(game, STRIPES[2]!, [SOLIDS[0]!, STRIPES[0]!]);
  expect(v).toMatchObject({ foul: null, takes: null, keeps: true });
  expect(game.groups).toBeNull();
  expect(judged(game, SOLIDS[1]!, [])).toMatchObject({ foul: null, keeps: false });
  expect(game.groups).toBeNull();
});

test('while open, the 8 struck first is a foul, and takes nothing', () => {
  const game = createGame();
  const v = judged(game, EIGHT, [SOLIDS[0]!]);
  expect(v).toMatchObject({ foul: 'wrong', takes: null, keeps: false });
  expect(game.groups).toBeNull();
  expect([game.turn, game.shots]).toEqual([1, POOL_RULES.foulShots]);
});

test('a foul that pots one group takes nothing', () => {
  const game = createGame();
  expect(judged(game, SOLIDS[0]!, [SOLIDS[0]!, 0])).toMatchObject({ foul: 'scratch', takes: null });
  expect(game.groups).toBeNull();
});

test('once taken, the other group struck first is a foul', () => {
  const game = createGame();
  game.groups = ['solid', 'stripe'];
  const v = judged(game, STRIPES[0]!, [SOLIDS[0]!]);
  expect(v).toMatchObject({ foul: 'wrong', keeps: false });
  expect([game.turn, game.shots]).toEqual([1, POOL_RULES.foulShots]);
  // Player 2's own is the stripes.
  expect(judged(game, STRIPES[0]!, [STRIPES[0]!])).toMatchObject({ foul: null, keeps: true });
});

test("only the shooter's own keeps the turn; the opponent's stays down for nothing", () => {
  const game = createGame();
  game.groups = ['solid', 'stripe'];
  expect(judged(game, SOLIDS[0]!, [STRIPES[0]!])).toMatchObject({ foul: null, keeps: false });
  expect(game.turn).toBe(1);
  expect(judged(game, STRIPES[1]!, [STRIPES[1]!, SOLIDS[1]!])).toMatchObject({
    foul: null,
    keeps: true,
  });
  expect(game.turn).toBe(1);
});

test('the 8 struck first before the group is cleared is a foul; after, it is the only ball', () => {
  const game = createGame();
  game.groups = ['solid', 'stripe'];
  expect(judged(game, EIGHT, [])).toMatchObject({ foul: 'wrong' });
  game.turn = 0;
  // The last solid goes down with the 8 struck first: still early.
  const last = SOLIDS.slice(1);
  expect(judged(game, EIGHT, [SOLIDS[0]!], last)).toMatchObject({ foul: 'wrong' });
  game.turn = 0;
  expect(judged(game, EIGHT, [], SOLIDS)).toMatchObject({ foul: null });
  game.turn = 0;
  expect(judged(game, SOLIDS[0]!, [], SOLIDS.slice(1).concat(SOLIDS[0]!))).toMatchObject({
    foul: 'wrong',
  });
  game.turn = 0;
  expect(judged(game, STRIPES[0]!, [], SOLIDS)).toMatchObject({ foul: 'wrong' });
});

test('the 8 potted with the last of the group is early; once it is cleared, it is no foul', () => {
  const game = createGame();
  game.groups = ['solid', 'stripe'];
  const v = judged(game, SOLIDS[0]!, [SOLIDS[0]!, EIGHT], SOLIDS.slice(1));
  expect(v).toMatchObject({ foul: 'eight', keeps: false });
  game.turn = 0;
  expect(judged(game, EIGHT, [EIGHT], SOLIDS)).toMatchObject({ foul: null });
});

test('a new rack opens the table again', () => {
  const game = createGame();
  game.groups = ['stripe', 'solid'];
  beginShot(game, createPool(box));
  expect(game.groups).toBeNull();
});

test('the 8 potted early is a foul, and a loss only by the switch', () => {
  const potEight = () => {
    const game = createGame();
    game.groups = ['solid', 'stripe'];
    return judged(game, SOLIDS[0]!, [EIGHT]);
  };
  expect(potEight()).toMatchObject({ foul: 'eight', lost: false, keeps: false });
  POOL_RULES.earlyEight = 'lose';
  try {
    expect(potEight()).toMatchObject({ foul: 'eight', lost: true });
  } finally {
    POOL_RULES.earlyEight = 'spot';
  }
});
