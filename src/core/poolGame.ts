import { POOL } from '../config/pool';
import { POOL_RULES } from '../config/poolRules';
import type { Pool } from './pool';

/** The 8, by its place in `balls`. */
export const EIGHT = POOL.looks.findIndex((l) => l.kind === 'eight');

/** Why a shot was a foul: the cue ball potted, no ball struck, or the 8 potted before its turn. */
export type Foul = 'scratch' | 'miss' | 'eight';

/** What a shot came to, once the table was still. */
export type Verdict = {
  /** Who shot it, and whether it was a break. */
  player: 0 | 1;
  broke: boolean;
  /** Balls potted, by their place in `balls`; the cue ball is 0. */
  potted: number[];
  /** The first ball the cue ball struck, or -1. */
  first: number;
  foul: Foul | null;
  /** The 8 went down early and `POOL_RULES.earlyEight` is `lose`: the game is the opponent's (1.11). */
  lost: boolean;
  /** The shooter stays on. */
  keeps: boolean;
};

/** Whose turn it is, and what a shot is judged by. See docs/pool.md, Rules. */
export type PoolGame = {
  turn: 0 | 1;
  /** Shots that may still pot nothing in this visit: 1, or `POOL_RULES.foulShots` after a foul. */
  shots: number;
  /** A shot is out and the table not yet still: the next waits. */
  shooting: boolean;
  /** The shot out is a break. */
  breaking: boolean;
  /** Which balls were down as it began. */
  down: boolean[];
  last: Verdict | null;
};

/** Player 1 to break. */
export function createGame(): PoolGame {
  'worklet';
  return { turn: 0, shots: 1, shooting: false, breaking: false, down: [], last: null };
}

/** A shot has just been sent: what it is judged against. Call right after `enter`. */
export function beginShot(game: PoolGame, pool: Pool) {
  'worklet';
  game.shooting = true;
  // Untouched, the rack is still to break, however the last shot went.
  game.breaking = pool.racked;
  game.down = pool.balls.map((b) => b.sunk >= 0);
}

/** What a still table says of the shot out. Pure: `endShot` acts on it. */
export function judge(game: PoolGame, pool: Pool): Verdict {
  'worklet';
  const potted: number[] = [];
  pool.balls.forEach((b, i) => {
    // A cue ball that only faded was not potted.
    if (b.sunk >= 0 && b.pocket >= 0 && !game.down[i]) potted.push(i);
  });
  const broke = game.breaking;
  const eight = potted.includes(EIGHT);
  let foul: Foul | null = null;
  if (potted.includes(0)) foul = 'scratch';
  else if (pool.first < 0) foul = 'miss';
  // No group is ever cleared yet (1.8 gives them), so any 8 after the break is early.
  else if (eight && !broke) foul = 'eight';
  const lost = foul === 'eight' && POOL_RULES.earlyEight === 'lose';
  // On the break the 8 counts as any ball: it keeps the turn (WPA 4.3e).
  const pots = potted.some((i) => i !== 0 && (i !== EIGHT || broke));
  return {
    player: game.turn,
    broke,
    potted,
    first: pool.first,
    foul,
    lost,
    keeps: foul === null && pots,
  };
}

/**
 * Ends the shot out by its verdict. A legal pot keeps the turn; one that pots nothing uses up a
 * shot, passing the turn once none is left; a foul passes it at once, with two shots.
 */
export function endShot(game: PoolGame, verdict: Verdict) {
  'worklet';
  game.shooting = false;
  game.breaking = false;
  game.last = verdict;
  if (verdict.foul) {
    game.turn = game.turn === 0 ? 1 : 0;
    game.shots = POOL_RULES.foulShots;
  } else if (!verdict.keeps) {
    game.shots -= 1;
    if (game.shots <= 0) {
      game.turn = game.turn === 0 ? 1 : 0;
      game.shots = 1;
    }
  }
}
