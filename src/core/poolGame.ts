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

/** Which balls are down, by their place in `balls`. */
export function downOf(pool: Pool) {
  'worklet';
  return pool.balls.map((b) => b.sunk >= 0);
}

/** The shooter's group is cleared, by `down`: the 8 is now their ball. */
export function onEight(game: PoolGame, down: boolean[]) {
  'worklet';
  const mine = game.groups ? game.groups[game.turn] : null;
  return mine !== null && cleared(down, mine);
}

/**
 * Whether `first` was not the shooter's to strike first. On the break any ball may be; while open,
 * any but the 8 (WPA 4.4); once taken, their own, or the 8 once that is cleared.
 */
function wrongFirst(game: PoolGame, first: number) {
  'worklet';
  if (game.breaking || first <= 0) return false;
  const mine = game.groups ? game.groups[game.turn] : null;
  if (mine === null) return first === EIGHT;
  return onEight(game, game.down) ? first !== EIGHT : groupOf(first) !== mine;
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
  /** The shooter legally potted the 8 in the called pocket: the game is theirs. */
  won: boolean;
  /**
   * The game is the opponent's: the 8 dropped on a foul, in another pocket or with none called, or
   * early with `POOL_RULES.earlyEight` at `lose`.
   */
  lost: boolean;
  /** The 8 went down on the break or early: it is set back on its spot. */
  spot: boolean;
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
  /** The pocket the aim line marked as the 8's as the shot was sent, or -1. */
  called: number;
  /** The 8 is to be set back once its pot has played out: the next shot waits. */
  spotting: boolean;
  /** Who won the game, once it is over, until `nextGame`. */
  winner: 0 | 1 | null;
  /** Who breaks this game: player 1 first, then each in turn (1.3). */
  breaker: 0 | 1;
  /** The table is being set again for this game: the first shot waits for the rack. */
  racking: boolean;
  /** Games each player has won since 8-ball was opened, kept by `nextGame`. */
  wins: [number, number];
  last: Verdict | null;
};

/** Player 1 to break, unless `breaker` says otherwise. */
export function createGame(breaker: 0 | 1 = 0): PoolGame {
  'worklet';
  return {
    turn: breaker,
    groups: null,
    shots: 1,
    shooting: false,
    breaking: false,
    down: [],
    called: -1,
    spotting: false,
    winner: null,
    breaker,
    racking: false,
    wins: [0, 0],
    last: null,
  };
}

/**
 * The next game, after one is over: the other player breaks, on a table set again. `racking` holds
 * the first shot until the rack is there. The wins so far are kept.
 */
export function nextGame(game: PoolGame) {
  'worklet';
  const wins = game.wins;
  Object.assign(game, createGame(game.breaker === 0 ? 1 : 0));
  game.wins = wins;
  game.racking = true;
}

/**
 * A shot has just been sent: what it is judged against, and the pocket `called` for the 8, or -1.
 * Call right after `enter`.
 */
export function beginShot(game: PoolGame, pool: Pool, called = -1) {
  'worklet';
  game.shooting = true;
  game.called = called;
  // Untouched, the rack is still to break, however the last shot went.
  game.breaking = pool.racked;
  // A new rack is open again.
  if (pool.racked) game.groups = null;
  game.down = downOf(pool);
}

/**
 * Sets how much each pot of the shot out means as it drops, for its light: more for the last of a
 * group, most for the 8 in the called pocket, muted for a foul so far. Call after each advance.
 */
export function weigh(game: PoolGame, pool: Pool) {
  'worklet';
  if (!game.shooting) return;
  const M = POOL.pot.meaning;
  const cue = pool.balls[0]!;
  const fouled = (cue.sunk >= 0 && cue.pocket >= 0) || wrongFirst(game, pool.first);
  const owns = onEight(game, game.down);
  let now: boolean[] | null = null;
  pool.balls.forEach((b, i) => {
    if (i === 0 || b.weight >= 0 || b.sunk < 0 || b.pocket < 0 || game.down[i]) return;
    if (i === EIGHT) {
      const legal = !fouled && owns && b.pocket === game.called;
      // On the break it is only set back.
      b.weight = legal ? M.eight : game.breaking && !fouled ? 1 : M.foul;
      return;
    }
    const group = groupOf(i);
    now ??= downOf(pool);
    b.weight = fouled ? M.foul : group && cleared(now, group) ? M.last : 1;
  });
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
  const owns = onEight(game, game.down);
  const first = pool.first;
  const eight = potted.includes(EIGHT);
  let foul: Foul | null = null;
  if (potted.includes(0)) foul = 'scratch';
  else if (first < 0) foul = 'miss';
  else if (wrongFirst(game, first)) foul = 'wrong';
  else if (eight && !broke && !owns) foul = 'eight';
  // Its owner wins with it legally in the called pocket, and loses it on a foul, in another
  // pocket, or with none called (WPA 4.8a, c).
  const won = eight && owns && foul === null && pool.balls[EIGHT]!.pocket === game.called;
  const lost = (eight && owns && !won) || (foul === 'eight' && POOL_RULES.earlyEight === 'lose');
  // On the break, or early: set back on its spot.
  const spot = eight && !owns && !lost;
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
    won,
    lost,
    spot,
    keeps: foul === null && pots && !won && !lost,
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
  game.spotting = verdict.spot;
  if (verdict.won || verdict.lost) {
    // Over: the turn stays where it ended until `nextGame`.
    const winner = verdict.won === (verdict.player === 0) ? 0 : 1;
    game.winner = winner;
    game.wins = winner === 0 ? [game.wins[0] + 1, game.wins[1]] : [game.wins[0], game.wins[1] + 1];
    return;
  }
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
