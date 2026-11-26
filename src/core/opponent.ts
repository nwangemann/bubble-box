import { POOL } from '../config/pool';
import { TUNING } from '../config/tuning';
import { advancePool, enter, fitCue, snugs, stillTable, traceAhead, type Pool } from './pool';
import {
  beginShot,
  downOf,
  EIGHT,
  judge,
  wrongFirst,
  type PoolGame,
  type Verdict,
} from './poolGame';
import { scaleAt } from './projection';
import type { Box, Bubble } from './types';
import { chargeAt } from './world';

/**
 * Player 2 played by the phone (docs/pool.md, Playing alone). It looks for a shot while the table is
 * still, then holds a cue ball as a finger would, eases it onto its place and sends it straight.
 */

/** Where a straight shot starts, on the glass, and the pocket its line calls for the 8, or -1. */
export type Shot = { x: number; y: number; called: number };

type Try = Shot & { score: number };

/** A shot being played out on a copy of the table. */
type Rehearsal = { shot: Shot; pool: Pool; game: PoolGame; seconds: number };

export type Opponent = {
  /** Resting until its turn; looking for a shot; holding the cue ball. */
  phase: 'rest' | 'think' | 'aim';
  /** Seconds in this phase. */
  since: number;
  /** Balls still to look at for pots, one a frame (the costliest part), and the pots found so far. */
  looking: number[];
  found: Try[];
  /** Shots still to play out, most promising first, and the one being played out. */
  queue: Try[];
  rehearsal: Rehearsal | null;
  /** The best played out so far, and how it went (`rankOf`). */
  best: Shot | null;
  rank: number;
  /** Where it will send the ball from, once chosen, as it will truly be off; and where its hand starts. */
  shot: Shot | null;
  from: { x: number; y: number };
};

/** What the screen should do for it this frame. Positions are on the screen plane, as a finger's. */
export type Act =
  | { kind: 'wait' }
  | { kind: 'hold'; x: number; y: number }
  | { kind: 'move'; x: number; y: number }
  | { kind: 'send' };

export function createOpponent(): Opponent {
  'worklet';
  return {
    phase: 'rest',
    since: 0,
    looking: [],
    found: [],
    queue: [],
    rehearsal: null,
    best: null,
    rank: -Infinity,
    shot: null,
    from: { x: 0, y: 0 },
  };
}

/** Back to waiting for its turn, forgetting any shot it had in mind. */
export function restOpponent(op: Opponent) {
  'worklet';
  Object.assign(op, createOpponent());
}

/** A normal deviate, from uniform `rand`. */
function gauss(rand: () => number) {
  'worklet';
  const u = Math.max(1e-12, rand());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

/** How fast a straight shot held to full power leaves the glass, as `release` sends it. */
function fullSpeed() {
  'worklet';
  const L = TUNING.launch;
  return (L.base + L.hold * chargeAt(POOL.cue.charge)) * POOL.cue.speed;
}

/** The table as it is, without trails, to play a shot out on. */
function copyPool(pool: Pool): Pool {
  'worklet';
  return {
    ...pool,
    balls: pool.balls.map((b) => ({
      ...b,
      p: { ...b.p },
      v: { ...b.v },
      w: { ...b.w },
    })),
    trailing: 0,
    trails: [],
    knock: 0,
    potted: 0,
    landed: 0,
  };
}

function copyGame(game: PoolGame): PoolGame {
  'worklet';
  return {
    ...game,
    groups: game.groups ? [game.groups[0], game.groups[1]] : null,
    down: [...game.down],
    wins: [game.wins[0], game.wins[1]],
  };
}

/** The balls it may strike first now. */
function targetsOf(pool: Pool, game: PoolGame) {
  'worklet';
  // Judged by the table as it is now, not as the last shot began.
  const now = { ...game, down: downOf(pool), breaking: false };
  const out: number[] = [];
  for (let i = 1; i < pool.balls.length; i++)
    if (pool.balls[i]!.sunk < 0 && !wrongFirst(now, i)) out.push(i);
  return out;
}

/** Whether a straight shot from `x`, `y` strikes ball `i` first and drops it in pocket `k`. */
function pots(pool: Pool, box: Box, x: number, y: number, i: number, k: number) {
  'worklet';
  const r = POOL.radius;
  const from = fitCue(pool, box, { x, y, z: r }, r);
  // A ball resting at the glass would move it: then it is not this shot.
  if (Math.abs(from.x - x) > 1e-6 || Math.abs(from.y - y) > 1e-6) return false;
  const t = traceAhead(pool, box, from, r);
  return t.hit === i && t.drops && t.pocket === k;
}

/**
 * Every straight shot that would pot ball `i` into some pocket, with how forgiving it is: the cue
 * ball sent from where it touches the ball on the line from the pocket through it.
 */
function potsAt(pool: Pool, box: Box, i: number): Try[] {
  'worklet';
  const O = POOL.opponent;
  const r = POOL.radius;
  const b = pool.balls[i]!.p;
  const out: Try[] = [];
  snugs(box).forEach((q, k) => {
    const dx = q.x - b.x;
    const dy = q.y - b.y;
    const dz = q.z - b.z;
    const l = Math.hypot(dx, dy, dz);
    if (l < 1e-6 || dz / l < O.cut) return;
    // Where the cue ball's middle is as they touch; it comes straight from the glass.
    const x = b.x - (dx / l) * 2 * r;
    const y = b.y - (dy / l) * 2 * r;
    if (b.z - (dz / l) * 2 * r < r) return;
    if (!pots(pool, box, x, y, i, k)) return;
    let kept = 0;
    for (const m of O.margin)
      for (const [ox, oy] of [
        [m, 0],
        [-m, 0],
        [0, m],
        [0, -m],
      ] as const)
        if (pots(pool, box, x + ox, y + oy, i, k)) kept++;
    // Straighter breaks ties.
    out.push({ x, y, called: i === EIGHT ? k : -1, score: kept + (0.5 * dz) / l });
  });
  return out;
}

/** Shots that only strike a ball it may, full on, nearest the glass first. */
function safeShots(pool: Pool, game: PoolGame, box: Box): Try[] {
  'worklet';
  const r = POOL.radius;
  const out: Try[] = [];
  for (const i of targetsOf(pool, game)) {
    const b = pool.balls[i]!.p;
    const from = fitCue(pool, box, { x: b.x, y: b.y, z: r }, r);
    const t = traceAhead(pool, box, from, r);
    if (t.hit === i) out.push({ x: from.x, y: from.y, called: -1, score: -b.z });
  }
  return out.sort((a, b) => b.score - a.score);
}

/** How a shot played out went: higher is better. */
function rankOf(v: Verdict) {
  'worklet';
  if (v.won) return 3;
  if (v.lost) return -1;
  if (v.foul) return 0;
  return v.keeps ? 2 : 1;
}

/** Starts playing out the next shot in the queue, on a copy of the table as it is now. */
function rehearse(pool: Pool, game: PoolGame, box: Box, s: Shot): Rehearsal {
  'worklet';
  const copy = copyPool(pool);
  // A table it clears is judged as it is, not set again.
  copy.over = true;
  const g = copyGame(game);
  const r = POOL.radius;
  const ball = { p: { x: s.x, y: s.y, z: r }, r, v: { x: 0, y: 0, z: fullSpeed() }, spin: 0 };
  enter(copy, box, ball as unknown as Bubble);
  beginShot(g, copy, s.called);
  return { shot: s, pool: copy, game: g, seconds: 0 };
}

/**
 * Decides what to look at once the table is still on its turn: on the break, straight at the
 * rack; else each ball it may strike, for pots, one a frame (`ponder`).
 */
export function thinkAbout(op: Opponent, pool: Pool, game: PoolGame) {
  'worklet';
  op.phase = 'think';
  op.since = 0;
  op.rehearsal = null;
  op.best = null;
  op.rank = -Infinity;
  op.shot = null;
  op.found = [];
  op.queue = [];
  op.looking = pool.racked ? [] : targetsOf(pool, game);
  if (pool.racked) op.best = { x: 0, y: 0, called: -1 };
}

/** Once every ball has been looked at: the most forgiving pots, then safe shots, to play out. */
function lineUp(op: Opponent, pool: Pool, game: PoolGame, box: Box) {
  'worklet';
  const O = POOL.opponent;
  op.queue = [
    ...op.found.sort((a, b) => b.score - a.score).slice(0, O.tries),
    ...safeShots(pool, game, box).slice(0, O.safe),
  ];
  if (op.queue.length > 0) return;
  // Nothing it may strike is in sight: at least it goes towards the first.
  const i = targetsOf(pool, game)[0];
  const b = i === undefined ? null : pool.balls[i]!.p;
  op.best = { x: b ? b.x : 0, y: b ? b.y : 0, called: -1 };
}

/**
 * One frame's thought: looks at one ball for pots, or plays shots out, `steps` steps in all. The
 * best is chosen once all have been played out, or one keeps the turn. Returns whether it has.
 */
export function ponder(op: Opponent, pool: Pool, game: PoolGame, box: Box, steps: number) {
  'worklet';
  const O = POOL.opponent;
  const i = op.looking.shift();
  if (i !== undefined) {
    op.found.push(...potsAt(pool, box, i));
    if (op.looking.length === 0) lineUp(op, pool, game, box);
    return false;
  }
  if (op.phase === 'think' && op.queue.length === 0 && !op.rehearsal && op.best === null)
    lineUp(op, pool, game, box);
  let left = steps;
  while (left > 0) {
    if (!op.rehearsal) {
      const next = op.queue.shift();
      if (!next) return op.best !== null;
      op.rehearsal = rehearse(pool, game, box, next);
    }
    const h = op.rehearsal;
    advancePool(h.pool, box, O.every, O.every);
    h.seconds += O.every;
    left--;
    if (!stillTable(h.pool, box) && h.seconds < O.look) continue;
    const rank = rankOf(judge(h.game, h.pool));
    if (rank > op.rank) {
      op.rank = rank;
      op.best = { x: h.shot.x, y: h.shot.y, called: h.shot.called };
    }
    op.rehearsal = null;
    // Good enough: the queue is in order of promise.
    if (op.rank >= 2) {
      op.queue = [];
      return true;
    }
  }
  return op.queue.length === 0 && !op.rehearsal && op.best !== null;
}

/** The chosen shot as its hand will truly play it: a little off, more on the break. */
function offBy(best: Shot, box: Box, breaking: boolean, rand: () => number): Shot {
  'worklet';
  const O = POOL.opponent;
  const s = breaking ? O.breakMiss : O.miss;
  const lx = box.hw - POOL.radius;
  const ly = box.hh - POOL.radius;
  return {
    x: Math.max(-lx, Math.min(lx, best.x + gauss(rand) * s)),
    y: Math.max(-ly, Math.min(ly, best.y + gauss(rand) * s)),
    called: best.called,
  };
}

/**
 * Its turn, each frame while the table is still: think, then hold, ease onto the shot and send it.
 * `held` is how long its cue ball has been held, or -1. With `calm` (Reduce Motion) the hand starts
 * where it will send from.
 */
export function opponentTurn(
  op: Opponent,
  pool: Pool,
  game: PoolGame,
  box: Box,
  dt: number,
  held: number,
  calm: boolean,
  rand: () => number,
): Act {
  'worklet';
  const O = POOL.opponent;
  const k = scaleAt(box, POOL.radius);
  if (op.phase === 'rest') thinkAbout(op, pool, game);
  op.since += dt;
  if (op.phase === 'think') {
    if (!op.shot && ponder(op, pool, game, box, O.steps)) {
      op.shot = offBy(op.best!, box, pool.racked, rand);
      const a = rand() * 2 * Math.PI;
      const d = calm ? 0 : O.drift;
      op.from = { x: op.shot.x + Math.cos(a) * d, y: op.shot.y + Math.sin(a) * d };
    }
    if (!op.shot || op.since < O.pause) return { kind: 'wait' };
    op.phase = 'aim';
    op.since = 0;
    return { kind: 'hold', x: op.from.x * k, y: op.from.y * k };
  }
  if (held < 0 || !op.shot) return { kind: 'wait' };
  if (held >= O.hold) {
    restOpponent(op);
    return { kind: 'send' };
  }
  const t = Math.min(1, held / O.settle);
  const e = t * t * (3 - 2 * t);
  const { x, y } = op.shot;
  return {
    kind: 'move',
    x: (op.from.x + (x - op.from.x) * e) * k,
    y: (op.from.y + (y - op.from.y) * e) * k,
  };
}
