import { POOL } from '../config/pool';
import { createOpponent, opponentTurn, ponder, thinkAbout, type Opponent } from './opponent';
import {
  advancePool,
  createPool,
  enter,
  fitCue,
  spotBall,
  stillTable,
  traceAhead,
  type Pool,
} from './pool';
import {
  beginShot,
  createGame,
  EIGHT,
  endShot,
  groupOf,
  judge,
  type PoolGame,
  type Verdict,
} from './poolGame';
import { scaleAt } from './projection';
import type { Box, Bubble } from './types';
import { chargeAt } from './world';
import { TUNING } from '../config/tuning';

const box: Box = { hw: 1, hh: 2.17, depth: 5, focal: 3.2 };
const r = POOL.radius;
const k = scaleAt(box, r);

/** Repeatable randomness. */
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** With its hand exact. */
const sure = (check: () => void) => {
  const O = POOL.opponent;
  const { miss, breakMiss } = O;
  O.miss = 0;
  O.breakMiss = 0;
  try {
    check();
  } finally {
    O.miss = miss;
    O.breakMiss = breakMiss;
  }
};

/** A table after the break with only these balls on it, where they are. */
const table = (at: Record<number, [number, number, number]>) => {
  const pool = createPool(box);
  pool.racked = false;
  pool.balls.forEach((b, i) => {
    if (i === 0) return;
    const p = at[i];
    if (p) b.p = { x: p[0], y: p[1], z: p[2] };
    else {
      b.sunk = POOL.sink + 1;
      b.pocket = 0;
    }
  });
  return pool;
};

/** Its turn, frame by frame as the screen runs it, to where its hand lets go, in box units. */
const turnOf = (op: Opponent, pool: Pool, game: PoolGame, calm = false, rand = seeded(1)) => {
  let held = -1;
  let at = { x: 0, y: 0 };
  let first: { x: number; y: number } | null = null;
  for (let n = 0; n < 60 * 60; n++) {
    const act = opponentTurn(op, pool, game, box, 1 / 60, held, calm, rand);
    if (act.kind === 'hold' || act.kind === 'move') {
      at = { x: act.x / k, y: act.y / k };
      if (act.kind === 'hold') {
        first = at;
        held = 0;
      }
    }
    if (act.kind === 'send') return { at, first: first!, frames: n };
    if (held >= 0) held += 1 / 60;
  }
  throw new Error('never shot');
};

const speed = () => {
  const L = TUNING.launch;
  return (L.base + L.hold * chargeAt(POOL.cue.charge)) * POOL.cue.speed;
};

/** Sends a straight shot from `at` as the screen does, and judges it once the table is still. */
const play = (pool: Pool, game: PoolGame, at: { x: number; y: number }): Verdict => {
  const from = fitCue(pool, box, { x: at.x, y: at.y, z: r }, r);
  const t = traceAhead(pool, box, from, r);
  const called = t.hit === EIGHT && t.drops ? t.pocket : -1;
  const ball = { p: from, r, v: { x: 0, y: 0, z: speed() }, spin: 0 };
  enter(pool, box, ball as unknown as Bubble);
  beginShot(game, pool, called);
  // As the screen marks a game over, a table cleared by the 8 waits to be judged.
  const over = pool.over;
  pool.over = true;
  for (let n = 0; n < 120 * 60 && !stillTable(pool, box); n++) advancePool(pool, box, 1 / 120);
  pool.over = over;
  const v = judge(game, pool);
  endShot(game, v);
  return v;
};

describe('opponent', () => {
  it('pots a lone ball in front of a pocket', () => {
    sure(() => {
      // A solid, open table, half a metre short of the far right corner.
      const pool = table({ 2: [0.55, -1.6, 4.2], 3: [-0.7, 1.5, 1.5] });
      const game = createGame(1);
      const { at } = turnOf(createOpponent(), pool, game);
      const v = play(pool, game, at);
      expect(v.potted).toEqual([2]);
      expect(v.foul).toBeNull();
      expect(v.takes).toBe('solid');
    });
  });

  it('never strikes the 8 first while the table is open', () => {
    sure(() => {
      // The 8 sits easy in front of a pocket; a stripe is far from any.
      const pool = table({ [EIGHT]: [0.55, -1.6, 4.2], 1: [-0.3, 0.4, 2.5] });
      const game = createGame(1);
      const { at } = turnOf(createOpponent(), pool, game);
      const v = play(pool, game, at);
      expect(v.first).toBe(1);
      expect(v.foul).toBeNull();
    });
  });

  it('strikes only its own group once the table is taken', () => {
    sure(() => {
      // Its stripe is hard; the opponent's solid is easy.
      const pool = table({ 2: [0.55, -1.6, 4.2], 1: [-0.3, 0.4, 2.5], [EIGHT]: [0, 1.2, 3] });
      const game = createGame(1);
      game.groups = ['solid', 'stripe'];
      const { at } = turnOf(createOpponent(), pool, game);
      const v = play(pool, game, at);
      expect(groupOf(v.first)).toBe('stripe');
    });
  });

  it('calls and pots the 8 once its group is cleared, and wins', () => {
    sure(() => {
      const pool = table({ [EIGHT]: [0.5, 1.5, 4.1], 2: [-0.6, -1, 2] });
      const game = createGame(1);
      game.groups = ['solid', 'stripe'];
      const { at } = turnOf(createOpponent(), pool, game);
      const v = play(pool, game, at);
      expect(v.won).toBe(true);
      expect(game.winner).toBe(1);
    });
  });

  it('breaks straight at the rack', () => {
    sure(() => {
      const pool = createPool(box);
      const { at } = turnOf(createOpponent(), pool, createGame(1));
      expect(Math.hypot(at.x, at.y)).toBeLessThan(1e-3);
    });
  });

  it('eases its hand onto the shot, but starts there with Reduce Motion', () => {
    sure(() => {
      const pool = table({ 2: [0.55, -1.6, 4.2] });
      const moving = turnOf(createOpponent(), pool, createGame(1));
      expect(Math.hypot(moving.first.x - moving.at.x, moving.first.y - moving.at.y)).toBeCloseTo(
        POOL.opponent.drift,
        3,
      );
      const calm = turnOf(createOpponent(), pool, createGame(1), true);
      expect(calm.first).toEqual(calm.at);
    });
  });

  it('waits a moment before it holds the ball', () => {
    const pool = table({ 2: [0.55, -1.6, 4.2] });
    const { frames } = turnOf(createOpponent(), pool, createGame(1));
    const O = POOL.opponent;
    expect(frames / 60).toBeGreaterThanOrEqual(O.pause + O.hold - 0.05);
  });

  it('thinks within a few frames', () => {
    const pool = createPool(box);
    play(pool, createGame(), { x: 0.01, y: 0.02 });
    const op = createOpponent();
    const game = createGame();
    game.turn = 1;
    thinkAbout(op, pool, game);
    let frames = 1;
    while (!ponder(op, pool, game, box, POOL.opponent.steps)) frames++;
    // Under its pause at 60 frames a second, most of the time.
    expect(frames).toBeLessThan(120);
  });

  it('plays whole games against itself to the end', () => {
    const rand = seeded(7);
    let shots = 0;
    let pots = 0;
    let fouls = 0;
    const games = 4;
    for (let g = 0; g < games; g++) {
      const pool = createPool(box);
      const game = createGame((g % 2) as 0 | 1);
      const ops = [createOpponent(), createOpponent()];
      for (let n = 0; n < 150 && game.winner === null; n++) {
        const { at } = turnOf(ops[game.turn]!, pool, game, false, rand);
        const v = play(pool, game, at);
        if (v.spot) {
          for (let m = 0; m < 120 * 3; m++) advancePool(pool, box, 1 / 120);
          spotBall(pool, box, EIGHT);
          game.spotting = false;
          for (let m = 0; m < 120; m++) advancePool(pool, box, 1 / 120);
        }
        shots++;
        if (v.keeps || v.won) pots++;
        if (v.foul) fouls++;
      }
      expect(game.winner).not.toBeNull();
    }
    // A fair, beatable player: pots often, fouls seldom.
    expect(pots / shots).toBeGreaterThan(0.3);
    expect(fouls / shots).toBeLessThan(0.2);
  });
});
