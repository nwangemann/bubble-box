import { POOL } from '../config/pool';
import { POOL_RULES } from '../config/poolRules';
import {
  advancePool,
  createPool,
  enter,
  fitCue,
  pockets,
  snugs,
  spotBall,
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
  nextGame,
  weigh,
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
  won: false,
  lost: false,
  spot: false,
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
const judged = (
  game: PoolGame,
  first: number,
  potted: number[],
  down: number[] = [],
  called = -1,
  pocket = 1,
) => {
  const pool = createPool(box);
  pool.racked = false;
  pool.balls[0]!.sunk = -1;
  for (const i of down) pool.balls[i]!.sunk = 1;
  beginShot(game, pool, called);
  pool.first = first;
  for (const i of potted) {
    pool.balls[i]!.sunk = 0;
    pool.balls[i]!.pocket = pocket;
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

test('the 8 wins in the called pocket; in another, with none called or on a foul, it loses', () => {
  const play = (called: number, pocket: number, potted = [EIGHT]) => {
    const game = createGame();
    game.groups = ['solid', 'stripe'];
    const v = judged(game, EIGHT, potted, SOLIDS, called, pocket);
    return { v, winner: game.winner };
  };
  expect(play(3, 3)).toMatchObject({ v: { won: true, lost: false, keeps: false }, winner: 0 });
  expect(play(2, 3)).toMatchObject({ v: { won: false, lost: true, foul: null }, winner: 1 });
  expect(play(-1, 3)).toMatchObject({ v: { lost: true }, winner: 1 });
  expect(play(3, 3, [EIGHT, 0])).toMatchObject({ v: { foul: 'scratch', lost: true }, winner: 1 });
  expect(play(3, 3)).toMatchObject({ v: { spot: false } });
  // Over, the turn stays where it ended.
  const game = createGame();
  game.groups = ['solid', 'stripe'];
  judged(game, EIGHT, [EIGHT], SOLIDS, 3, 3);
  expect([game.turn, game.shots]).toEqual([0, 1]);
});

test('the 8 potted early or on the break is set back; a game goes on', () => {
  const game = createGame();
  game.groups = ['solid', 'stripe'];
  const v = judged(game, SOLIDS[0]!, [EIGHT], [], 3, 3);
  expect(v).toMatchObject({ foul: 'eight', spot: true, won: false, lost: false });
  expect(game).toMatchObject({ spotting: true, winner: null });
  const brk = createGame();
  const pool = createPool(box);
  beginShot(brk, pool);
  pool.first = 1;
  pool.balls[EIGHT]!.sunk = 0;
  pool.balls[EIGHT]!.pocket = 1;
  expect(judge(brk, pool)).toMatchObject({ foul: null, spot: true, lost: false });
  POOL_RULES.earlyEight = 'lose';
  try {
    const lose = createGame();
    lose.groups = ['solid', 'stripe'];
    expect(judged(lose, SOLIDS[0]!, [EIGHT])).toMatchObject({ lost: true, spot: false });
  } finally {
    POOL_RULES.earlyEight = 'spot';
  }
});

test('the 8 is set back on its spot, or further along the line when a ball is there, easing in', () => {
  const home = createPool(box).balls[EIGHT]!.p;
  const pool = createPool(box);
  const eight = pool.balls[EIGHT]!;
  eight.sunk = 2;
  eight.pocket = 1;
  eight.p = at([0.5, 1, 5]);
  spotBall(pool, box, EIGHT);
  expect(eight.p).toEqual(home);
  expect(eight).toMatchObject({ sunk: -1, pocket: -1, back: 0, weight: -1 });
  // Another ball rests there: the nearest room towards the far wall.
  const other = pool.balls[1]!;
  other.p = { ...home };
  eight.sunk = 2;
  spotBall(pool, box, EIGHT);
  expect(eight.p.x).toBe(home.x);
  expect(eight.p.z).toBeGreaterThan(home.z);
  expect(eight.p.z - home.z).toBeLessThan(2 * r + POOL.spot.step * 2);
  // One in play is left where it is.
  const was = { ...eight.p };
  spotBall(pool, box, EIGHT);
  expect(eight.p).toEqual(was);
  // It eases in, and is drawn until it has.
  pool.balls[0]!.sunk = POOL.sink;
  expect(advancePool(pool, box, POOL.spot.ease / 2)).toBe(true);
  expect(eight.back).toBeCloseTo(POOL.spot.ease / 2);
  advancePool(pool, box, POOL.spot.ease);
  expect(eight.back).toBe(-1);
});

test('a pot means more as the last of a group, most as the 8 called, less on a foul', () => {
  const M = POOL.pot.meaning;
  const weighed = (first: number, potted: number[], down: number[], called = -1) => {
    const game = createGame();
    game.groups = ['solid', 'stripe'];
    const pool = createPool(box);
    pool.racked = false;
    pool.balls[0]!.sunk = -1;
    for (const i of down) pool.balls[i]!.sunk = 1;
    beginShot(game, pool, called);
    pool.first = first;
    for (const i of potted) {
      pool.balls[i]!.sunk = 0;
      pool.balls[i]!.pocket = 2;
    }
    weigh(game, pool);
    return potted.map((i) => pool.balls[i]!.weight);
  };
  expect(weighed(SOLIDS[0]!, [SOLIDS[0]!], [])).toEqual([1]);
  expect(weighed(SOLIDS[0]!, [SOLIDS[0]!], SOLIDS.slice(1))).toEqual([M.last]);
  expect(weighed(EIGHT, [EIGHT], SOLIDS, 2)).toEqual([M.eight]);
  expect(weighed(EIGHT, [EIGHT], SOLIDS, 4)).toEqual([M.foul]);
  expect(weighed(STRIPES[0]!, [SOLIDS[0]!], [])).toEqual([M.foul]);
  expect(weighed(SOLIDS[0]!, [SOLIDS[0]!, 0], [])).toEqual([M.foul, -1]);
});

test('breaks alternate: the next game opens with the other player breaking, after the rack', () => {
  const game = createGame();
  expect([game.turn, game.breaker]).toEqual([0, 0]);
  game.groups = ['solid', 'stripe'];
  endShot(game, verdict({ player: 0, won: true, potted: [EIGHT], first: EIGHT }));
  expect(game.winner).toBe(0);
  nextGame(game);
  expect(game).toMatchObject({
    turn: 1,
    breaker: 1,
    winner: null,
    groups: null,
    shots: 1,
    racking: true,
    spotting: false,
    last: null,
  });
  // Lost by player 2: player 1 wins, and breaks the third.
  game.turn = 1;
  endShot(game, verdict({ player: 1, lost: true, foul: 'scratch' }));
  expect(game.winner).toBe(0);
  nextGame(game);
  expect([game.turn, game.breaker]).toEqual([0, 0]);
});

test('wins are counted for each player, by whoever won however, and kept between games', () => {
  const game = createGame();
  expect(game.wins).toEqual([0, 0]);
  game.groups = ['solid', 'stripe'];
  endShot(game, verdict({ player: 0, won: true, potted: [EIGHT], first: EIGHT }));
  expect(game.wins).toEqual([1, 0]);
  nextGame(game);
  expect(game.wins).toEqual([1, 0]);
  // Player 2 loses with the 8: player 1's.
  endShot(game, verdict({ player: 1, lost: true, foul: 'scratch' }));
  nextGame(game);
  // Player 1 loses: player 2's.
  endShot(game, verdict({ player: 0, lost: true, potted: [EIGHT] }));
  expect(game.wins).toEqual([2, 1]);
  // A shot that ends nothing counts nothing.
  nextGame(game);
  endShot(game, verdict({ player: 1, keeps: true, potted: [1], first: 1 }));
  expect(game.wins).toEqual([2, 1]);
  expect(createGame(1).wins).toEqual([0, 0]);
});
