import { POOL } from '../config/pool';
import { POOL_RULES } from '../config/poolRules';
import type { Pool } from './pool';

/** The 8, by its place in `balls`. */
export const EIGHT = POOL.looks.findIndex((l) => l.kind === 'eight');

/** A player's balls, once the table is no longer open. */
export type Group = 'solid' | 'stripe';

/**
 * Why a shot was a foul: the cue ball potted, no ball struck, first a ball not the shooter's (the
 * other group, or the 8 before their group is cleared), or the 8 potted before its turn.
 */
export type Foul = 'scratch' | 'miss' | 'wrong' | 'eight';

/** A ball's group, or null for the cue ball and the 8. */
export function groupOf(ball: number): Group | null {
  'worklet';
  const kind = POOL.looks[ball]?.kind;
  return kind === 'solid' || kind === 'stripe' ? kind : null;
}

/** Whether every ball of a group was already down, by `down`. */
export function cleared(down: boolean[], group: Group) {
  'worklet';
  return POOL.looks.every((l, i) => l.kind !== group || !!down[i]);
}

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
  /** The group this shot gave the shooter, taking the table from open; else null. */
  takes: Group | null;
  /** The 8 went down early and `POOL_RULES.earlyEight` is `lose`: the game is the opponent's (1.11). */
  lost: boolean;
  /** The shooter stays on. */
  keeps: boolean;
};

/** Whose turn it is, and what a shot is judged by. See docs/pool.md, Rules. */
export type PoolGame = {
  turn: 0 | 1;
  /** Each player's group, or null while the table is open. */
  groups: [Group, Group] | null;
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
  return {
    turn: 0,
    groups: null,
    shots: 1,
    shooting: false,
    breaking: false,
    down: [],
    last: null,
  };
}

/** A shot has just been sent: what it is judged against. Call right after `enter`. */
export function beginShot(game: PoolGame, pool: Pool) {
  'worklet';
  game.shooting = true;
  // Untouched, the rack is still to break, however the last shot went.
  game.breaking = pool.racked;
  // A new rack is open again.
  if (pool.racked) game.groups = null;
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
  const mine = game.groups ? game.groups[game.turn] : null;
  // Theirs is cleared: the 8 is now the shooter's ball.
  const onEight = mine !== null && cleared(game.down, mine);
  const first = pool.first;
  const eight = potted.includes(EIGHT);
  // On the break any ball may be struck first; while open, any but the 8 (WPA 4.4).
  let wrong = false;
  if (!broke && first > 0) {
    if (mine === null) wrong = first === EIGHT;
    else wrong = onEight ? first !== EIGHT : groupOf(first) !== mine;
  }
  let foul: Foul | null = null;
  if (potted.includes(0)) foul = 'scratch';
  else if (first < 0) foul = 'miss';
  else if (wrong) foul = 'wrong';
  else if (eight && !broke && !onEight) foul = 'eight';
  const lost = foul === 'eight' && POOL_RULES.earlyEight === 'lose';
  const groups = potted.map(groupOf).filter((g) => g !== null);
  // An open table is taken by a legal shot after the break that pots balls of one group only.
  const one = groups.length > 0 && groups.every((g) => g === groups[0]);
  const takes = !foul && !broke && mine === null && one ? groups[0]! : null;
  // On the break the 8 counts as any ball (WPA 4.3e); while open any ball but the 8 keeps the
  // turn; once taken, only the shooter's own. The opponent's stays down and keeps nothing.
  const pots = broke
    ? potted.some((i) => i !== 0)
    : mine === null
      ? groups.length > 0
      : groups.includes(mine);
  return {
    player: game.turn,
    broke,
    potted,
    first,
    foul,
    takes,
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
  if (verdict.takes) {
    const other: Group = verdict.takes === 'solid' ? 'stripe' : 'solid';
    game.groups = verdict.player === 0 ? [verdict.takes, other] : [other, verdict.takes];
  }
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
